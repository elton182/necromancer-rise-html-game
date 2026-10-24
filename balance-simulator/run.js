#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const M = require('./model.js');
const { readSource } = require('./source.js');
const defaults = require('./config.json');

function merge(base, override) {
  const out = structuredClone(base);
  for (const [key, value] of Object.entries(override)) {
    if (!Object.hasOwn(base, key)) throw Error('Unknown configuration key: ' + key);
    out[key] = value && typeof value === 'object' && !Array.isArray(value) && typeof base[key] === 'object' ? merge(base[key], value) : value;
  }
  return out;
}
function validate(config) {
  function finite(value) {
    if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) throw Error('Numeric configuration must be finite and nonnegative.');
    if (value && typeof value === 'object') Object.values(value).forEach(finite);
  }
  finite(config);
  const positive = [config.runs, config.waves, config.xp.base, config.xp.growth, config.combat.step, config.combat.timeout, config.combat.concurrentEnemies, config.combat.spawnInterval, config.combat.minionUptime, config.combat.reviveSeconds, config.loot.capacity];
  if (positive.some(n => !Number.isFinite(n) || n <= 0)) throw Error('Counts, time intervals and growth factors must be finite and positive.');
  if (![config.runs, config.waves, config.maxLevel, config.seed, config.combat.concurrentEnemies, config.loot.capacity].every(Number.isInteger)) throw Error('Counts and seed must be integers.');
  if (config.runs > 1000 || config.waves > 200 || config.maxLevel < 1 || config.maxLevel > 60 || config.combat.step < 0.02 || config.combat.timeout > 3600) throw Error('Configuration exceeds supported simulation bounds.');
  if (config.combat.minionUptime > 1 || config.combat.step > config.combat.timeout) throw Error('Invalid uptime or time step.');
  for (const p of Object.values(config.profiles)) {
    if (![p.accuracy, p.enemyAccuracy, p.specialAccuracy].every(n => Number.isFinite(n) && n >= 0 && n <= 1) || !Number.isInteger(p.areaTargets) || p.areaTargets < 1) throw Error('Invalid accuracy or area target count.');
  }
  for (const n of [config.loot.chance, config.combat.aggroToMinions, config.combat.pickupChance]) if (!Number.isFinite(n) || n < 0 || n > 1) throw Error('Probabilities must lie between zero and one.');
  for (const key of ['hpGrowth', 'damageGrowth', 'xpGrowth']) if (!(config.proposed[key] >= 1 && config.proposed[key] <= 2)) throw Error('Proposed growth must be between 1 and 2.');
  if (!Number.isInteger(config.proposed.maxEnemies) || config.proposed.maxEnemies < 1 || config.proposed.maxEnemies > 1000) throw Error('Invalid proposed enemy cap.');
  if (!(config.economy.sellFraction >= 0 && config.economy.sellFraction < 1) || config.economy.buyBase < 0 || config.economy.buyPerLevel <= 0 || !Number.isInteger(config.economy.purchasesPerVisit) || config.economy.purchasesPerVisit < 0) throw Error('Invalid economy.');
  const choices = { rules: ['current', 'proposed', 'legacy'], builds: ['caster', 'horde', 'hybrid'], gear: ['none', 'reference', 'loot'], profiles: Object.keys(config.profiles), routes: ['advance', 'farm'] };
  for (const [key, allowed] of Object.entries(choices)) if (!Array.isArray(config.scenarios[key]) || !config.scenarios[key].length || config.scenarios[key].some(v => !allowed.includes(v))) throw Error('Invalid scenario list: ' + key);
  for (const [rarity, count] of Object.entries(config.loot.affixes)) {
    if (!Number.isInteger(count) || count < 0 || count > 8 || !(config.loot.weights[rarity] >= 0)) throw Error('Invalid rarity configuration.');
  }
  if (Object.values(config.loot.weights).some(n => !Number.isFinite(n) || n < 0) || Object.values(config.loot.weights).reduce((a, b) => a + b, 0) <= 0 || config.loot.weights.magic + config.loot.weights.rare + config.loot.weights.epic <= 0) throw Error('Invalid rarity weights.');
  return config;
}

function campaignEncounters(stage, rules, level, config, source, random) {
  const ctx = { campaign: true, stage: stage.n, level,liveEquipment:source.liveEquipment };
  const packs = stage.n === 1 ? [[-1, -1, -1], ...source.rooms] : stage.n === 3 ? source.strip : [];
  const encounters = [];
  if (stage.n === 2) for (let w = 3; w <= 8; w++) encounters.push(M.makeEncounter(rules !== 'proposed' ? w : stage.n, rules, config, source, random, { ...ctx, mult: 0.95 }));
  else if (stage.n === 4) {
    const boss = { ...source.captain, hp: source.captain.hp, maxHp: source.captain.hp, damage: Math.round(source.captain.dmg * 1.3), interval: 1.3, captain: true, dropChance: source.combatTuning.orbChance,hpOrbShare:source.combatTuning.hpOrbShare };
    if (rules === 'proposed') Object.assign(boss, M.scaleEnemy(source.captain, stage.n, rules, config), { captain: true, interval: 1.3 });
    const reinforcements = [6, 8, 10].map((count, i) => ({ threshold: [0.75, 0.5, 0.25][i], enemies: Array.from({ length: count }, (_, k) => M.scaleEnemy(source.enemies[(i >= 1 && k % 3 === 2) || k % 4 === 3 ? 1 : 0], rules !== 'proposed' ? 6 : stage.n, rules, config, ctx)) }));
    encounters.push({ id: 'captain', wave: stage.n, enemies: [boss], reinforcements, rewardXp: 0, rewardGold: 0, campaign: true });
  } else for (const pack of packs) encounters.push({
    id: 'pack-' + (encounters.length + 1), wave: stage.n, campaign: true, rewardXp: 0, rewardGold: 0,
    enemies: pack.map(index => index === -1
      ? { name: 'Treino', hp: 28, maxHp: 28, dmg: 0, damage: 0, xp: 6, interval: 1.5, dropChance: source.combatTuning.orbChance,hpOrbShare:source.combatTuning.hpOrbShare }
      : M.scaleEnemy(source.enemies[index], rules !== 'proposed' ? 0 : stage.n, rules, config, ctx))
  });
  return encounters;
}
function applyCompletion(state, id, victory, xp, gold, once = false) {
  if (!victory || once && state.cleared.has(id)) return { xp: 0, gold: 0 };
  state.cleared.add(id); return { xp, gold };
}
function price(level, config) { return config.economy.buyBase + level * config.economy.buyPerLevel; }
function visitVillage(state, collected, scenario, config, source, random, inVillage=true) {
  state.bag||=[];
  let upgrades = 0, bought = 0, sold = 0, discarded = Math.max(0, collected.length - Math.max(0,config.loot.capacity-state.bag.length));
  function sellOrStore(item){if(inVillage){state.gold+=Math.floor(price(item.level,config)*config.economy.sellFraction);sold++;}else state.bag.push(item);}
  function consider(item) {
    const old = state.equipped;
    state.equipped = M.equipBest(old, item, state.level, scenario.build, source);
    if (state.equipped === old) sellOrStore(item);
    else {
      upgrades++;
      for (const [slot, previous] of Object.entries(old)) if (state.equipped[slot] !== previous) sellOrStore(previous);
    }
  }
  if (scenario.gear === 'loot') {
    if(inVillage){state.bag.forEach(i=>{state.gold+=Math.floor(price(i.level,config)*config.economy.sellFraction);sold++;});state.bag=[];}
    collected.slice(0, Math.max(0,config.loot.capacity-state.bag.length)).forEach(consider);
    for (let i = 0; inVillage&&i < config.economy.purchasesPerVisit; i++) {
      const level = state.unlocked;
      if (state.gold < price(level, config)) break;
      state.gold -= price(level, config); bought++;
      const type = M.slots.find(slot => !state.equipped[slot]) || M.slots[Math.floor(random() * M.slots.length)];
      consider(M.generateItem(level, random, config, type));
    }
  } else discarded = 0;
  return { upgrades, bought, sold, discarded };
}
function runScenario(scenario, run, config, source, campaign = false) {
  const state = { level: 1, xp: 0, totalXp: 0, gold: 0, unlocked: 1, cleared: new Set(), equipped: {} };
  if (scenario.gear === 'reference') state.equipped = Object.fromEntries(M.referenceItems(config).map((item, i) => [M.slots[i], item]));
  const rows = [], seed = config.seed + run * 100003;
  let encounterIndex = 0, stage = 1;
  const stageCleared = new Set();
  for (let attempt = 1; attempt <= (campaign ? source.stages.length : config.waves); attempt++) {
    const wave = scenario.route === 'farm' && attempt % 3 === 0 ? Math.max(1, state.unlocked - 2) : state.unlocked;
    const random = M.rng(seed + attempt * 997);
    const encounters = campaign ? campaignEncounters(source.stages[stage - 1], scenario.rules, state.level, config, source, random) : [M.makeEncounter(wave, scenario.rules, config, source, random)];
    let complete = true;
    for (const encounter of encounters) {
      const index = encounterIndex++, levelBefore = state.level, goldBefore = state.gold;
      const equipmentAtStart = Object.keys(state.equipped).length;
      const s = M.stats(state.level, scenario.build, Object.values(state.equipped), source);
      const naked = M.stats(state.level, scenario.build, [], source);
      const combatSeed = seed + index * 2017 + 700001;
      const result = M.simulateCombat(s, encounter, config.profiles[scenario.profile], config, M.rng(combatSeed));
      const control = scenario.gear === 'none' ? result : M.simulateCombat(naked, encounter, config.profiles[scenario.profile], config, M.rng(combatSeed));
      const last = encounter === encounters.at(-1);
      const completion = applyCompletion(state, campaign ? 'stage-' + stage : encounter.id, result.victory && (!campaign || last),
        campaign ? last && !stageCleared.has(stage) ? source.stages[stage - 1].rew.xp : 0 : encounter.rewardXp,
        campaign ? last && !stageCleared.has(stage) ? source.stages[stage - 1].rew.gold : 0 : encounter.rewardGold, campaign && last);
      const earned = result.killXp + completion.xp;
      const goldRandom = M.rng(seed + index * 3089 + 800001);
      const goldKills = result.deadEnemies.reduce((sum, e) => sum + (e.name !== 'Treino' && goldRandom() < config.combat.pickupChance ? Math.max(2, Math.round((e.xp || 10) * 0.35)) * (e.isBoss ? 3 : 1) : 0), 0);
      state.totalXp += earned; M.awardXp(state, earned, config); state.gold += completion.gold + goldKills;
      if (!campaign && result.victory && wave === state.unlocked) state.unlocked++;
      if (campaign && last && result.victory) { stageCleared.add(stage); state.unlocked = Math.max(state.unlocked, stage + 1); }
      const dropRandom = M.rng(seed + index * 4051 + 900001), collected = [], rarities = { common: 0, magic: 0, rare: 0, epic: 0 };
      const lootLevel=campaign?stage:encounter.wave;
      for (const e of result.deadEnemies) if (e.name!=='Treino' && (e.isBoss || dropRandom() < config.loot.chance)) {
        const item = M.generateItem(lootLevel, dropRandom, config, undefined, !!e.isBoss);
        rarities[item.rarity]++; collected.push(item);
      }
      const economy = visitVillage(state, result.victory ? collected : [], scenario, config, source, dropRandom,!campaign);
      const avgHp = encounter.enemies.reduce((sum, e) => sum + e.maxHp, 0) / encounter.enemies.length;
      const avgDamage = encounter.enemies.reduce((sum, e) => sum + e.damage, 0) / encounter.enemies.length;
      rows.push({
        ...scenario, scenario: Object.values(scenario).join('/'), mode: campaign ? 'campaign' : 'endless', run, seed,
        attempt, encounter: index + 1, stage: campaign ? stage : null, phaseName: campaign ? source.stages[stage - 1].name : 'Arena infinita',
        wave: encounter.wave, unlocked: state.unlocked, levelBefore, levelAfter: state.level, xpKills: result.killXp, xpCompletion: completion.xp, xpEarned: earned, xpTotal: state.totalXp, xpRemaining: state.level >= config.maxLevel ? 0 : M.xpNext(state.level, config) - state.xp,
        enemies: encounter.enemies.length, kills: result.kills, averageEnemyHp: avgHp, averageEnemyDamage: avgDamage,
        playerHp: s.hp, playerMana: s.mp, manaRegen: s.regen, boltDamage: s.bolt, boltHitsToKill: Math.ceil(avgHp / s.bolt), hitsSurvived: avgDamage ? Math.ceil(s.hp / avgDamage) : null,
        damageDealt: result.damageDealt, damageTaken: result.damageTaken, hpRemaining: result.hpRemaining, healingFromDrops: result.healingFromDrops, minionDeaths: result.minionDeaths, manaStarvedSeconds: result.manaStarvedSeconds,
        seconds: result.seconds, outcome: result.outcome, effectiveDps: result.effectiveDps, xpPerMinute: earned * 60 / (result.seconds + config.combat.betweenWavesSeconds),
        dropLevel: scenario.gear === 'loot' ? lootLevel : null, generatedHypotheticalDrops: collected.length, uncollectedDrops: result.victory ? economy.discarded : collected.length, ...rarities,
        equipmentAtStart, equippedLevelsAfter: Object.values(state.equipped).map(i => i.level).join('/'), ...economy,
        gold: state.gold, goldKills, goldCompletion: completion.gold, goldDelta: state.gold - goldBefore, nakedHp: naked.hp, nakedBoltDamage: naked.bolt,
        equipmentHpGain: s.hp / naked.hp - 1, equipmentBoltGain: s.bolt / naked.bolt - 1,
        equipmentDpsGain: control.effectiveDps ? result.effectiveDps / control.effectiveDps - 1 : null,
        nakedOutcome: control.outcome, nakedSeconds: control.seconds, utilityGain: M.score(s) / M.score(naked) - 1
      });
      if (!result.victory) { complete = false; break; }
    }
    if (campaign && complete) stage++;
    if (campaign && stage > source.stages.length) break;
  }
  return rows;
}
function percentile(values, p) {
  values = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!values.length) return null;
  const x = (values.length - 1) * p, low = Math.floor(x), high = Math.ceil(x);
  return values[low] + (values[high] - values[low]) * (x - low);
}
function summarize(rows, config) {
  const groups = new Map();
  for (const row of rows) { const key = row.scenario + '/' + row.mode + '/attempt-' + row.attempt; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row); }
  const summaries = [...groups.entries()].map(([key, values]) => {
    // Campaign attempts may include multiple encounters: aggregate each run before taking percentiles.
    const runs = [...new Set(values.map(v => v.run))].map(run => {
      const r = values.filter(v => v.run === run), last = r.at(-1);
      const seconds = r.reduce((a, v) => a + v.seconds, 0), xpEarned = r.reduce((a, v) => a + v.xpEarned, 0);
      return { ...last, levelBefore: r[0].levelBefore, seconds, xpEarned, xpPerMinute: xpEarned * 60 / (seconds + r.length * config.combat.betweenWavesSeconds) };
    });
    const median = field => percentile(runs.map(v => v[field]), 0.5);
    const clearRate = runs.filter(r => r.outcome === 'clear').length / runs.length;
    const alerts = [];
    if (clearRate < 0.7) alerts.push('BAIXA_SOBREVIVENCIA');
    if (median('seconds') > (runs[0].stage === 4 ? config.targets.maxBossSeconds : config.targets.maxWaveSeconds) && runs[0].mode !== 'campaign') alerts.push('LENTO');
    if (runs[0].stage === 4 && median('seconds') > config.targets.maxBossSeconds) alerts.push('CHEFE_LENTO');
    if (runs[0].mode !== 'campaign' && median('seconds') < config.targets.minWaveSeconds) alerts.push('RAPIDO');
    if (median('hitsSurvived') !== null && median('hitsSurvived') < config.targets.minHitsSurvived) alerts.push('POUCOS_ACERTOS_SUPORTADOS');
    if (median('equipmentDpsGain') > config.targets.maxEquipmentDpsGain) alerts.push('DEPENDENCIA_EQUIPAMENTO');
    return { key, ...Object.fromEntries(['rules', 'build', 'gear', 'profile', 'route', 'mode', 'attempt'].map(k => [k, runs[0][k]])), samples: runs.length, clearRate, waveP50: median('wave'), levelP50: median('levelAfter'), secondsP10: percentile(runs.map(r => r.seconds), 0.1), secondsP50: median('seconds'), secondsP90: percentile(runs.map(r => r.seconds), 0.9), xpP50: median('xpEarned'), xpPerMinuteP50: median('xpPerMinute'), hpRemainingP10: percentile(runs.map(r => r.hpRemaining), 0.1), hpRemainingP50: median('hpRemaining'), hpRemainingP90: percentile(runs.map(r => r.hpRemaining), 0.9), utilityGainP10: percentile(runs.map(r => r.utilityGain), 0.1), utilityGainP50: median('utilityGain'), utilityGainP90: percentile(runs.map(r => r.utilityGain), 0.9), boltGainP50: median('equipmentBoltGain'), enemyThreatP50: median('averageEnemyHp') * median('averageEnemyDamage'), alerts };
  });
  const byKey = new Map(summaries.map(s => [s.key, s]));
  for (const s of summaries) {
    const prefix = s.key.slice(0, s.key.lastIndexOf('/attempt-'));
    const previous = byKey.get(prefix + '/attempt-' + (s.attempt - 1));
    const old = byKey.get(prefix + '/attempt-' + (s.attempt - config.targets.maxWavesWithoutLevel));
    if (old && s.levelP50 <= old.levelP50) s.alerts.push('NIVEL_ESTAGNADO');
    if (previous && previous.enemyThreatP50 > 0 && s.enemyThreatP50 / previous.enemyThreatP50 > config.targets.maxDifficultyJump) s.alerts.push('SALTO_DIFICULDADE');
    if (s.route === 'farm' && s.mode === 'endless') {
      const advance = summaries.find(a => a.route === 'advance' && a.mode === s.mode && a.rules === s.rules && a.build === s.build && a.gear === s.gear && a.profile === s.profile && a.attempt === s.attempt);
      if (advance && s.waveP50 < advance.waveP50 && s.xpPerMinuteP50 > advance.xpPerMinuteP50 * 1.1) s.alerts.push('FARM_MAIS_EFICIENTE');
    }
  }
  return summaries;
}
function csv(rows) {
  const fields = Object.keys(rows[0] || {}), quote = v => '"' + String(v ?? '').replaceAll('"', '""') + '"';
  return [fields.map(quote).join(','), ...rows.map(row => fields.map(k => quote(row[k])).join(','))].join('\n') + '\n';
}
function markdown(report) {
  const f = n => n === null ? '—' : Number(n).toFixed(1);
  const lines = ['# Simulação de balanceamento', '', 'Resultado de um modelo matemático exploratório. Não confirma balanceamento em partidas reais.', '',
    `Configuração v${report.config.version}; semente ${report.config.seed}; ${report.config.runs} amostras por cenário; ${report.config.waves} tentativas de arena por amostra.`,
    `Fonte do jogo SHA-256: \`${report.source.sha256}\`.`, '', '## Como interpretar', '',
    '- `current`: curva de waves e modelo de itens compartilhados com o jogo; `none` é o controle sem equipamento.',
    '- `legacy`: curvas anteriores à integração. `proposed`: curvas alternativas da configuração.',
    '- `proposed`: curvas de waves e itens propostas. Cada cenário começa no nível 1.',
    '- Uma derrota mantém XP das mortes, não concede conclusão nem libera wave. A próxima tentativa repete a dificuldade disponível.',
    '- A campanha é separada da arena, com quatro tentativas de fase por amostra. Só avança após completar todos os encontros.',
    '- Comparação de equipamentos usa personagem sem itens no mesmo nível/build e encontro. DPS efetivo depende também de duração, sobrevida e overkill.',
    '- Referência de itens é um conjunto fixo de nível 5; loot usa o gerador do jogo e os atributos permitidos por tipo. Campanha não compra/vende durante as fases.',
    '- Drops hipotéticos são contados também nos controles sem itens; só o cenário loot coleta/equipa/vende/compra.', '', '## Hipóteses e limites', '', ...report.source.assumptions.map(a => '- ' + a), '',
    '## Resultado na última tentativa de cada cenário', '', '| Modo / regras / build / itens / perfil / rota | Wave mediana | Nível | Conclusão | Tempo p10 / p50 / p90 (s) |', '| --- | ---: | ---: | ---: | --- |'];
  const last = new Map();
  for (const s of report.summary) last.set([s.mode, s.rules, s.build, s.gear, s.profile, s.route].join(' / '), s);
  for (const [key, s] of last) lines.push(`| ${key} | ${f(s.waveP50)} | ${f(s.levelP50)} | ${f(s.clearRate * 100)}% | ${f(s.secondsP10)} / ${f(s.secondsP50)} / ${f(s.secondsP90)} |`);
  lines.push('', '## Alertas', '', 'Faixas-alvo configuráveis sinalizam cenários para investigar; não são aprovação automática.', '');
  const flagged = report.summary.filter(s => s.alerts.length);
  lines.push(`${flagged.length} grupos com alertas entre ${report.summary.length} grupos. Detalhes completos em summary.csv.`, '');
  for (const s of flagged.slice(0, 25)) lines.push(`- ${s.key}: ${s.alerts.join(', ')}.`);
  lines.push('', '## Artefatos', '', '- encounters.csv: XP, nível, dano, vida, mana, drops, bônus e economia por encontro e semente.', '- summary.csv: percentis e alertas por tentativa/cenário.', '- report.json: configuração, procedência, resultados completos e resumos.', '', 'Não alterar curvas do jogo automaticamente a partir destes números. Validar a aproximação em combate real e ampliar os efeitos modelados antes de concluir sobre builds não representadas.', '');
  return lines.join('\n');
}
function run(config, source) {
  validate(config);
  const rows = [];
  for (const rules of config.scenarios.rules) for (const build of config.scenarios.builds) for (const gear of config.scenarios.gear) for (const profile of config.scenarios.profiles) for (const route of config.scenarios.routes) {
    const scenario = { rules, build, gear, profile, route };
    for (let sample = 0; sample < config.runs; sample++) {
      rows.push(...runScenario(scenario, sample, config, source), ...runScenario(scenario, sample, config, source, true));
    }
  }
  return { config, source: source.provenance, rows, summary: summarize(rows, config) };
}
function main(args) {
  let config = structuredClone(defaults), output = path.join(__dirname, 'reports', 'latest');
  const overrides = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--help') { console.log('node balance-simulator/run.js [--config overrides.json] [--waves 20] [--runs 8] [--seed 182] [--out directory]\nConfig accepts partial JSON overrides; output: Markdown, JSON, CSV. --waves is the number of attempts.'); return; }
    const value = args[++i]; if (!value || value.startsWith('--')) throw Error('Missing value: ' + flag);
    if (flag === '--config') config = merge(config, JSON.parse(fs.readFileSync(value, 'utf8')));
    else if (flag === '--out') output = path.resolve(value);
    else if (['--waves', '--runs', '--seed'].includes(flag)) overrides[flag.slice(2)] = Number(value);
    else throw Error('Unknown option: ' + flag);
  }
  Object.assign(config, overrides);
  const report = run(config, readSource());
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'encounters.csv'), csv(report.rows));
  fs.writeFileSync(path.join(output, 'summary.csv'), csv(report.summary.map(s => ({ ...s, alerts: s.alerts.join('|') }))));
  fs.writeFileSync(path.join(output, 'README.md'), markdown(report));
  console.log(`Simulated ${report.rows.length} encounters; ${report.summary.filter(s => s.alerts.length).length} groups flagged.\nReport: ${path.join(output, 'README.md')}`);
}
if (require.main === module) { try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { merge, validate, campaignEncounters, applyCompletion, visitVillage, runScenario, percentile, summarize, csv, markdown, run };
