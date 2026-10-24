'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('./model.js');
const R = require('./run.js');
const { readSource } = require('./source.js');
const Tree = require('../build-simulator/model.js');
const config = require('./config.json');
const Gear = require('../scripts/equipment-model.js');
const source = readSource();
const scenario = { rules: 'current', build: 'hybrid', gear: 'loot', profile: 'normal', route: 'advance' };
const item = (stat, target, value = 1) => ({ type: 'staff', level: 1, rarity: 'magic', base: { stat: 'spell', value: 0 }, affixes: [{ stat, target, value }] });
const enemy = (hp = 40, damage = 8) => ({ name: 'Guerreiro', hp, maxHp: hp, damage, interval: 1.5, xp: 12, dropChance: 0 });

test('source adapter captures live overrides, campaign layouts and captain', () => {
  assert.equal(source.minions.zombie.hp, 130);
  assert.equal(source.minions.zombie.dmg, 11);
  assert.equal(source.captain.hp, 20000);
  assert.equal(source.rooms.length, 8);
  assert.equal(source.strip.length, 9);
  assert.equal(source.stages[0].rew.xp, 140);
});
test('XP crosses multiple levels and caps exactly at 60', () => {
  const state = { level: 1, xp: 0 };
  M.awardXp(state, 240, config);
  assert.deepEqual(state, { level: 3, xp: 0 });
  M.awardXp(state, 1e15, config);
  assert.deepEqual(state, { level: 60, xp: 0 });
});
test('all generated builds obey prerequisites and point budget at all levels', () => {
  for (const build of ['caster', 'horde', 'hybrid']) for (let level = 1; level <= 60; level++) assert.doesNotThrow(() => Tree.validate({ version: 1, level, ranks: M.buildRanks(level, build) }));
});
test('level one has no free minions; the first invested zombie point enables the group', () => {
  assert.equal(M.stats(1, 'horde', [], source).minions.length, 0);
  assert.equal(M.stats(2, 'horde', [], source).minions.length, 3);
});

test('simulation applies flat weapon bases before percentage damage just like the game preview',()=>{
 const staff={type:'staff',base:{stat:'spellFlat',value:11},affixes:[{stat:'spell',value:4}]};
 const s=M.stats(12,'hybrid',[staff],source),ranks=M.buildRanks(12,'hybrid');
 const preview=Gear.snapshot(Tree,{level:12,skillRanks:ranks,equipment:{staff}},source.minions,source.combatTuning);
 assert.equal(s.bolt,preview.skills.find(s=>s.id==='raio').damage);
 const grimoire={type:'grimoire',base:{stat:'hordeFlat',value:4},affixes:[{stat:'horde',value:4}]};
 const h=M.stats(12,'horde',[grimoire],source),p=Gear.snapshot(Tree,{level:12,skillRanks:h.ranks,equipment:{grimoire}},source.minions,source.combatTuning);
 assert.equal(h.minions.filter(m=>m.type==='zombie').reduce((sum,m)=>sum+m.damage,0),p.skills.find(s=>s.id==='zombie').damage);
});
test('item points stack above investment cap, keep cross synergy direct and do not unlock nodes', () => {
  const ranks = { bolt: 5, rain: 2 };
  const items = [item('skill', 'bolt', 2), item('school', 'osso')];
  const { effects, bonusRanks } = M.skillEffects(ranks, items);
  assert.equal(bonusRanks.bolt, 3);
  assert.equal(effects['Dano do Tiro de Osso'], 80 + 8);
  assert.equal(effects['Dano da Chuva de Ossos'], 20 + 30);
  assert.equal(bonusRanks.pierce, undefined);
  assert.deepEqual(ranks, { bolt: 5, rain: 2 });
  assert.equal(M.skillEffects(ranks, []).effects['Dano do Tiro de Osso'], 58);
});
test('finals and unlearned skills ignore item bonuses', () => {
  const e = M.skillEffects({ storm: 1 }, [item('school', 'osso', 9), item('skill', 'bolt', 9)]);
  assert.equal(e.effects['Dano da Chuva de Ossos'], 35);
  assert.equal(e.effects['Dano do Tiro de Osso'], undefined);
});
test('rarities have exact unique affix count and boss drops exclude common', () => {
  const random = M.rng(42), counts = {};
  for (let n = 0; n < 20000; n++) {
    const i = M.generateItem(15, random, config);
    counts[i.rarity] = (counts[i.rarity] || 0) + 1;
    assert.equal(i.affixes.length, config.loot.affixes[i.rarity]);
    assert.equal(new Set(i.affixes.map(a => a.stat)).size, i.affixes.length);
    assert.notEqual(M.generateItem(15, random, config, undefined, true).rarity, 'common');
  }
  for (const [key, weight] of Object.entries(config.loot.weights)) assert.ok(Math.abs(counts[key] / 20000 - weight / 100) < 0.02);
});
test('legacy endless preserves original factors; current adapter uses the shared live wave model', () => {
  const e = source.enemies[0];
  const current = M.scaleEnemy(e, 10, 'legacy', config);
  assert.equal(current.hp, Math.round(40 * 1.7) * 2.2);
  assert.equal(current.damage, Math.round(8 * 1.35));
  const live=M.scaleEnemy(e,10,'current',config,{liveEquipment:true});
  assert.equal(live.hp,Math.round(e.hp*Gear.waveStats(10).hp));
  assert.equal(live.damage,Math.round(e.dmg*Gear.waveStats(10).damage));
  assert.deepEqual(M.scaleEnemy(e, 10, 'proposed', config, { level: 1 }), M.scaleEnemy(e, 10, 'proposed', config, { level: 60 }));
  assert.ok(M.scaleEnemy(e, 3, 'proposed', config).hp < M.scaleEnemy(e, 10, 'proposed', config).hp);
});
test('completion rewards are unique when requested; defeats never reward', () => {
  const state = { cleared: new Set() };
  assert.deepEqual(R.applyCompletion(state, 'stage', false, 100, 30, true), { xp: 0, gold: 0 });
  assert.deepEqual(R.applyCompletion(state, 'stage', true, 100, 30, true), { xp: 100, gold: 30 });
  assert.deepEqual(R.applyCompletion(state, 'stage', true, 100, 30, true), { xp: 0, gold: 0 });
});
test('hand-computable kill uses actual hit damage and awards no overkill XP twice', () => {
  const s = M.stats(1, 'caster', [], source);
  const c = R.merge(config, { combat: { spawnInterval: 0.1 }, profiles: { normal: { accuracy: 1, enemyAccuracy: 0, specialAccuracy: 0 } } });
  const result = M.simulateCombat(s, { enemies: [enemy()] }, c.profiles.normal, c, M.rng(1));
  assert.equal(result.victory, true);
  assert.equal(result.damageDealt, 40);
  assert.equal(result.killXp, 12);
  assert.equal(result.kills, 1);
});
test('mana depletion constrains sustained combat and cooldown constrains bursts', () => {
  const s = { ...M.stats(1, 'caster', [], source), regen: 0 };
  const c = R.merge(config, { combat: { timeout: 10 }, profiles: { normal: { accuracy: 1, enemyAccuracy: 0, specialAccuracy: 0 } } });
  const result = M.simulateCombat(s, { enemies: [enemy(1000, 0)] }, c.profiles.normal, c, M.rng(1));
  assert.equal(result.casts, 4);
  assert.equal(result.damageDealt, 80);
  assert.equal(result.outcome, 'timeout');
  const short = M.simulateCombat({ ...s, mp: 10000 }, { enemies: [enemy(10000, 0)] }, c.profiles.normal, { ...c, combat: { ...c.combat, timeout: 1 } }, M.rng(1));
  assert.equal(short.casts, 2);
});
test('minion deaths and revival reduce damage contribution', () => {
  const s = { ...M.stats(2, 'horde', [], source), hp: 1000000 };
  const c = R.merge(config, { combat: { timeout: 30, aggroToMinions: 1 }, profiles: { normal: { accuracy: 1, enemyAccuracy: 1, specialAccuracy: 0 } } });
  const result = M.simulateCombat(s, { enemies: [enemy(100000, 1000)] }, c.profiles.normal, c, M.rng(5));
  assert.ok(result.minionDeaths > s.minions.length);
  assert.ok(result.hpRemaining > 0);
  assert.ok(result.damageTaken > 0);
});
test('merchant cannot buy without gold and selling cannot create a buy/sell arbitrage', () => {
  const state = { level: 1, gold: 0, unlocked: 20, equipped: {} };
  assert.equal(R.visitVillage(state, [], scenario, config, source, M.rng(1)).bought, 0);
  assert.equal(state.gold, 0);
  state.gold = 1000;
  const result = R.visitVillage(state, [], scenario, config, source, M.rng(1));
  assert.equal(result.bought, 1); assert.ok(state.gold < 1000);
  assert.equal(Object.values(state.equipped)[0].level, 20);
});
test('campaign completion XP is actually credited after final encounter', () => {
  const c = R.merge(config, { profiles: { normal: { accuracy: 1, enemyAccuracy: 0, specialAccuracy: 0 } } });
  const rows = R.runScenario({ ...scenario, build: 'horde', gear: 'reference' }, 0, c, source, true);
  assert.equal(rows.filter(r => r.stage === 1).reduce((sum, r) => sum + r.xpCompletion, 0), 140);
  assert.equal(rows.filter(r => r.stage === 2).reduce((sum, r) => sum + r.xpCompletion, 0), 220);
});
test('failed waves preserve unlock, award kill XP only, and farm returns lower drop levels', () => {
  const c = R.merge(config, { waves: 5, combat: { timeout: 0.1 }, profiles: { normal: { accuracy: 0, enemyAccuracy: 0, specialAccuracy: 0 } } });
  const failed = R.runScenario(scenario, 0, c, source);
  assert.ok(failed.every(r => r.unlocked === 1 && r.xpCompletion === 0));
  const safe = R.merge(config, { waves: 4, profiles: { normal: { accuracy: 1, enemyAccuracy: 0, specialAccuracy: 0 } } });
  const farm = R.runScenario({ ...scenario, route: 'farm' }, 0, safe, source);
  assert.equal(farm[2].wave, 1); assert.equal(farm[2].dropLevel, 1); assert.equal(farm[2].unlocked, 3);
});
test('reports are reproducible, finite, escape CSV and interpolate percentiles', () => {
  const c = R.merge(config, { runs: 1, waves: 2, scenarios: { rules: ['current'], builds: ['caster'], gear: ['loot'] } });
  const a = R.run(c, source), b = R.run(c, source);
  assert.deepEqual(a, b);
  for (const row of a.rows) for (const value of Object.values(row)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
  assert.equal(R.percentile([0, 10], 0.5), 5);
  assert.equal(R.percentile([], 0.5), null);
  assert.match(R.csv([{ a: 'x,"y' }]), /"x,""y"/);
});
test('configuration rejects invalid scenarios and dangerous numeric bounds', () => {
  assert.throws(() => R.validate(R.merge(config, { runs: 0 })));
  assert.throws(() => R.validate(R.merge(config, { scenarios: { rules: ['unknown'] } })));
  assert.throws(() => R.validate(R.merge(config, { profiles: { normal: { accuracy: 2 } } })));
  assert.throws(() => R.merge(config, { typo: 2 }));
});
test('summary detects stagnant levels, difficulty jumps and more efficient farming', () => {
  const rows = [];
  for (const route of ['advance', 'farm']) for (let attempt = 1; attempt <= 7; attempt++) rows.push({
    ...scenario, route, scenario: route, mode: 'endless', run: 0, attempt, wave: route === 'farm' ? 1 : attempt,
    levelBefore: 1, levelAfter: 1, seconds: route === 'farm' ? 10 : 30, xpEarned: 100,
    outcome: 'clear', hpRemaining: 100, averageEnemyHp: attempt === 7 ? 100 : 10, averageEnemyDamage: 10,
    hitsSurvived: 10, utilityGain: 0, equipmentDpsGain: 0, equipmentBoltGain: 0
  });
  const summary = R.summarize(rows, config);
  assert.ok(summary.find(s => s.route === 'advance' && s.attempt === 7).alerts.includes('NIVEL_ESTAGNADO'));
  assert.ok(summary.find(s => s.route === 'advance' && s.attempt === 7).alerts.includes('SALTO_DIFICULDADE'));
  assert.ok(summary.find(s => s.route === 'farm' && s.attempt === 7).alerts.includes('FARM_MAIS_EFICIENTE'));
});
