'use strict';
const Tree = require('../build-simulator/model.js');
const Gear = require('../scripts/equipment-model.js');
const slots = ['staff', 'grimoire', 'body', 'head', 'boots', 'ring1', 'ring2'];
const priorities = {
  caster: ['bolt', 'rain', 'shards', 'meditate', 'vitality', 'pierce', 'wall', 'storm', 'dash', 'stride'],
  horde: ['zombie', 'vigor', 'skeleton', 'archer', 'armor', 'blades', 'shot', 'salvo', 'meditate', 'vitality', 'dash'],
  hybrid: ['bolt', 'zombie', 'vigor', 'rain', 'meditate', 'archer', 'skeleton', 'vitality', 'shards', 'armor', 'dash']
};
function rng(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function xpNext(level, config) { return Math.floor(config.xp.base * config.xp.growth ** (level - 1)); }
function awardXp(state, amount, config) {
  if (state.level >= config.maxLevel) return;
  state.xp += amount;
  while (state.level < config.maxLevel && state.xp >= xpNext(state.level, config)) {
    state.xp -= xpNext(state.level, config); state.level++;
  }
  if (state.level === config.maxLevel) state.xp = 0;
}
function buildRanks(level, build) {
  if (!priorities[build]) throw Error('Unknown build: ' + build);
  const state = { version: 1, level, ranks: {} };
  let changed = true;
  while (changed && Tree.spent(state.ranks) < Tree.budget(level)) {
    changed = false;
    for (const id of priorities[build]) {
      const n = Tree.byId[id];
      if ((state.ranks[id] || 0) < n.max && !Tree.reason(n, state.ranks, level)) {
        Tree.invest(state, id); changed = true; break;
      }
    }
  }
  return Tree.validate(state).ranks;
}
function skillEffects(ranks, items) {
  const result=Gear.effects(Tree,ranks,Object.fromEntries(items.map((item,index)=>[index,item])));
  return {effects:result.effects,bonusRanks:result.extra};
}
function stats(level, build, items, source) {
  const ranks = buildRanks(level, build), { effects: e, bonusRanks } = skillEffects(ranks, items);
  const mods = {};
  for (const a of items.flatMap(i => [i.base, ...i.affixes])) if (!['skill', 'school'].includes(a.stat)) mods[a.stat] = (mods[a.stat] || 0) + a.value;
  const percent = key => 1 + (e[key] || 0) / 100;
  const spell = Gear.spellDamage(level,mods);
  const minions = [];
  const allowed = build === 'caster' ? [] : build === 'horde' ? ['zombie', 'skeleton', 'archer'] : ['zombie', 'archer'];
  for (const type of allowed) {
    if (!ranks[type]) continue;
    const d = source.minions[type], bone = ['skeleton', 'archer'].includes(type);
    const count = type === 'zombie' ? 3 : type === 'skeleton' ? 3 + (e['Guerreiros adicionais'] || 0) : 2 + (e['Arqueiros adicionais'] || 0);
    const damage = (e[bone ? 'Dano de Esqueletos e Arqueiros' : 'Dano de Zumbis e Abominações'] || 0) + (type === 'archer' ? e['Dano dos Arqueiros'] || 0 : type==='zombie'?e['Dano de Zumbis']||0:0);
    const hp = Math.round((d.hp*source.combatTuning.minionHpMultiplier+(level-1)*source.combatTuning.minionHpPerLevel) * (percent(bone ? 'Vida de Esqueletos e Arqueiros' : 'Vida de Zumbis e Abominações') + ((mods.hordeHp || 0)+(type==='zombie'?e['Vida de Zumbis']||0:0)) / 100));
    for (let i = 0; i < count; i++) minions.push({ type, hp, maxHp: hp, regen:hp*source.combatTuning.minionRegen,damageTakenMultiplier:['zombie','skeleton','abom'].includes(type)?source.combatTuning.frontlineDamageTaken??1:1,reviveHealth:source.combatTuning.autoReviveHealth,damage: Math.round((d.dmg + level - 1 + (mods.hordeFlat || 0)) * (1 + (damage + (mods.horde || 0)) / 100)), interval: d.atkRate });
  }
  return {
    level, ranks, bonusRanks, effects: e,
    hp: Math.round((100 + 10 * (level - 1)) * percent('Vida de Zephyr') + (mods.hp || 0)),
    mp: Math.round((80 + 5 * (level - 1)) * percent('Mana máxima') + (mods.mp || 0)),
    regen: (4 + 0.3 * (level - 1)) * percent('Regeneração de mana') + (mods.regen || 0), hpRegen: 0.2 * (level - 1),
    bolt: Math.floor(spell * percent('Dano do Tiro de Osso') * source.combatTuning.boltMultiplier), rain: Math.floor(spell * 0.7 * percent('Dano da Chuva de Ossos')),
    pierce: 1 + (e['Alvos perfurados adicionais'] || 0),
    cooldown: 1 - Math.min(0.5, (mods.cooldown || 0) / 100), move: 100*(Gear.moveSpeed(mods)/4-1), minions
  };
}
function weighted(weights, random) {
  let x = random() * Object.values(weights).reduce((a, b) => a + b, 0);
  for (const [key, weight] of Object.entries(weights)) { x -= weight; if (x < 0) return key; }
  return Object.keys(weights).at(-1);
}
function generateItem(level, random, config, type, boss = false) {
  return Gear.generate(level,Tree,random,type,boss,'sim-'+random().toString(36).slice(2),config);
}
function referenceItems(config) { const random = rng(19); return slots.map(type => generateItem(5, random, config, type)); }
function score(s) {
  // Explicit build utility, not rarity: sustained bolt DPS + active minion DPS, scaled by survivability.
  const dps = Math.min(2 / s.cooldown, s.regen / 20) * s.bolt + s.minions.reduce((sum, m) => sum + m.damage / m.interval * 0.7, 0);
  return Math.max(0.01, dps) * Math.sqrt(s.hp / 100) * (1 + s.mp / 1000) * (1 + s.move / 300);
}
function equipBest(equipped, item, level, build, source) {
  const destinations = item.type.startsWith('ring') ? ['ring1', 'ring2'] : [item.type];
  let best = equipped, bestScore = score(stats(level, build, Object.values(equipped), source));
  for (const slot of destinations) {
    const next = { ...equipped, [slot]: item }, value = score(stats(level, build, Object.values(next), source));
    if (value > bestScore + 1e-9) { best = next; bestScore = value; }
  }
  return best;
}
function scaleEnemy(enemy, wave, rules, config, { campaign = false, stage = 1, level = 1, liveEquipment = false } = {}) {
  let hp = enemy.hp, damage = enemy.dmg, xp = enemy.xp;
  if (rules === 'current' && liveEquipment && !campaign) {
    const scale=Gear.waveStats(wave);hp=Math.round(hp*scale.hp);damage=Math.round(damage*scale.damage);xp=Math.round(xp*scale.xp);
  } else if (rules === 'current' || rules === 'legacy') {
    if (campaign) {
      hp = Math.round(hp * (1 + (stage - 1) * 0.18 + (level - 1) * 0.02));
      damage = Math.round(damage * (1 + (stage - 1) * 0.1));
    } else {
      hp = Math.round(hp * (1 + 0.07 * Math.min(wave, 60)));
      damage = Math.round(damage * (1 + 0.035 * Math.min(wave, 60)));
      xp = Math.round(xp * (1 + 0.04 * Math.min(wave, 60)));
    }
    hp *= 1 + wave * 0.12;
  } else {
    hp = Math.round(hp * config.proposed.hpGrowth ** (wave - 1));
    damage = Math.round(damage * config.proposed.damageGrowth ** (wave - 1));
    xp = Math.round(xp * config.proposed.xpGrowth ** (wave - 1));
  }
  return { ...enemy, hp, maxHp: hp, damage, xp, interval: enemy.interval||1.5 };
}
function makeEncounter(wave, rules, config, source, random, context = {}) {
  const count = Math.floor((4 + wave * 2 + Math.floor(wave / 3)) * (context.mult || 1));
  const cap=rules==='current'&&source.liveEquipment&&!context.campaign?Gear.waveStats(wave).maxEnemies:rules==='proposed'?config.proposed.maxEnemies:Infinity;
  const composition=require('../scripts/crypt-hound-model.js').arenaTypes(wave,Math.min(count,cap),source.enemies,random,!!context.campaign||rules==='legacy');
  const enemies=composition.map(e=>scaleEnemy(e,wave,rules,config,{...context,liveEquipment:source.liveEquipment}));
  return { enemies, wave, id: 'wave-' + wave, rewardXp: context.campaign ? 0 : 20 + wave * 8, rewardGold: context.campaign ? 0 : 3 + wave * 2, campaign: !!context.campaign };
}

function simulateCombat(s, encounter, profile, config, random) {
  const c = config.combat, enemies = encounter.enemies.map((e, i) => ({ ...e, spawn: i * c.spawnInterval, attack: i * c.spawnInterval + c.engageDelay, special: i * c.spawnInterval + (e.specialDelayMin===undefined?7:e.specialDelayMin+random()*(e.specialDelayMax-e.specialDelayMin)+(e.ability?.windup||0)) }));
  const minions = s.minions.map(m => ({ ...m, attack: c.engageDelay, revive: 0 }));
  let hp = s.hp, mp = s.mp, time = 0, dealt = 0, taken = 0, healed = 0, kills = 0, xp = 0, deaths = 0, casts = 0, starvation = 0, boltAt = 0, rainAt = 0;
  const deadEnemies = [], reinforcements = [...(encounter.reinforcements || [])];
  function damage(e, value) {
    const hit = Math.min(e.hp, Math.max(0, Math.floor(value))); e.hp -= hit; dealt += hit;
    if (e.hp > 0 || e.killed) return;
    e.killed = true; kills++; xp += e.xp; deadEnemies.push(e);
    if (random() < (e.dropChance || 0) * c.pickupChance) {
      if (random() < (e.hpOrbShare??0.5)) { const heal = Math.min(s.hp - hp, Math.floor(s.hp * 0.3)); hp += heal; healed += heal; }
      else mp = Math.min(s.mp, mp + Math.floor(s.mp * 0.4));
    }
  }
  for (; time < c.timeout && hp > 0 && enemies.some(e => e.hp > 0); time += c.step) {
    hp = Math.min(s.hp, hp + s.hpRegen * c.step); mp = Math.min(s.mp, mp + s.regen * c.step);
    let active = enemies.filter(e => e.hp > 0 && e.spawn <= time);
    for (const m of minions) {
      if (m.hp <= 0 && time >= m.revive) m.hp = Math.floor(m.maxHp*(m.reviveHealth??1));
      if (m.hp > 0) m.hp=Math.min(m.maxHp,m.hp+(m.regen||0)*c.step);
      if (m.hp <= 0 || time < m.attack || !active.length) continue;
      m.attack = time + m.interval / c.minionUptime;
      if (random() < profile.accuracy) damage(active[0], m.damage);
      active = active.filter(e => e.hp > 0);
    }
    if (active.length && time >= rainAt && s.ranks.rain && active.length > 1 && mp >= 40) {
      mp -= 40; casts++; rainAt = time + 5 * s.cooldown;
      for (let i = 0; i < 7; i++) if (random() < profile.accuracy) damage(active[i % Math.min(active.length, profile.areaTargets)], s.rain);
    }
    active = active.filter(e => e.hp > 0);
    if (active.length && time >= boltAt) {
      if (mp >= 20) {
        mp -= 20; casts++; boltAt = time + 0.5 * s.cooldown;
        for (const e of active.slice(0, Math.min(s.pierce, profile.areaTargets))) if (random() < profile.accuracy) damage(e, s.bolt);
      } else starvation += c.step;
    }
    const captain = enemies.find(e => e.captain && e.hp > 0);
    if (captain && reinforcements.length && captain.hp / captain.maxHp <= reinforcements[0].threshold) {
      const pack = reinforcements.shift();
      enemies.push(...pack.enemies.map(e => ({ ...e, spawn: time + 1, attack: time + 2, special: time + 8 })));
    }
    active = enemies.filter(e => e.hp > 0 && e.spawn <= time).slice(0, c.concurrentEnemies);
    for (const e of active) {
      function receive(value, accuracy) {
        if (random() >= accuracy) return;
        const live = minions.filter(m => m.hp > 0);
        if (live.length && random() < c.aggroToMinions) {
          const m = live[Math.floor(random() * live.length)]; m.hp -= value>0?Math.max(1,Math.round(value*(m.damageTakenMultiplier??1))):value;
          if (m.hp <= 0) { deaths++; m.revive = time + c.reviveSeconds; }
        } else { const hit = Math.min(hp, value); hp -= hit; taken += hit; }
      }
      if (time >= e.attack) { e.attack = time + e.interval; receive(e.damage, profile.enemyAccuracy); }
      if (time >= e.special && !e.isBoss && e.damage > 0 && e.ability) {
        e.special = time + e.ability.cooldown + e.ability.windup + (e.ability.recovery||0) + (e.ability.kind==='charge'?e.ability.distance/e.ability.speed:0);
        // Fire assumes all three residual pulses connect; coverage remains configurable.
        receive(e.damage * (e.ability.mult + (e.ability.kind === 'fire' ? 0.9 : 0)), profile.specialAccuracy);
      }
      if (hp <= 0) break;
    }
  }
  const victory = hp > 0 && enemies.every(e => e.hp <= 0);
  return { victory, outcome: victory ? 'clear' : hp <= 0 ? 'death' : 'timeout', seconds: time, damageDealt: dealt, damageTaken: taken, healingFromDrops: healed, kills, killXp: xp, minionDeaths: deaths, casts, manaStarvedSeconds: starvation, hpRemaining: Math.max(0, hp), deadEnemies, effectiveDps: dealt / Math.max(time, c.step) };
}
module.exports = { slots, rng, xpNext, awardXp, buildRanks, skillEffects, stats, weighted, generateItem, referenceItems, score, equipBest, scaleEnemy, makeEncounter, simulateCombat };
