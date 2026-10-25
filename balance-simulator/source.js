'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

// Evaluate only bounded, repository-owned data literals, never the game runtime.
function readSource(root = path.resolve(__dirname, '..')) {
  const html = fs.readFileSync(path.join(root, 'necromancer-canvas.html'), 'utf8');
  function constant(name) {
    const match = html.match(new RegExp('const ' + name + '\\s*=([\\s\\S]*?);\\r?\\n'));
    if (!match) throw Error('Source data missing: ' + name);
    return JSON.parse(JSON.stringify(vm.runInNewContext('(' + match[1] + ')', {}, { timeout: 1000 })));
  }
  function expression(pattern, context = {}) {
    const match = html.match(pattern);
    if (!match) throw Error('Encounter layout changed; update source adapter: ' + pattern);
    return JSON.parse(JSON.stringify(vm.runInNewContext('(' + match[1] + ')', context, { timeout: 1000 })));
  }
  const minions = constant('MINION_DEFS');
  // Apply the explicit late overrides used by the released game.
  for (const match of html.matchAll(/MINION_DEFS\.(\w+)\.(hp|dmg|spd)\s*=\s*([\d.]+)\s*;/g)) {
    if (minions[match[1]]) minions[match[1]][match[2]] = Number(match[3]);
  }
  minions.abom = expression(/Object\.defineProperty\(MINION_DEFS,'abom',\{enumerable:false,value:({[^\n]+})\}\);/);
  // Fail visibly if manually mirrored current rules drift.
  const checks = [
    'Math.floor(100*Math.pow(1.4,player.level-1))',
    'hp:type.hp*(1+wave*.12)', 'atkRate:1.5',
    't.hp=Math.round(t.hp*(1+.07*w))', 't.dmg=Math.round(t.dmg*(1+.035*w))',
    't.xp=Math.round(t.xp*(1+.04*w))', 'g=3+w*2, x=20+w*8',
    'Math.floor((4+wave*2+Math.floor(wave/3))*mult)',
    'spellCooldowns.raio=.5', 'spellCooldowns.chuva=5', 'spellCooldowns.explosao=8'
  ];
  for (const check of checks) if (!html.includes(check)) throw Error('Current rule drift: ' + check);
  const rooms = expression(/DNG\.rooms=(\[[^\n]+\]);/, { R: (id, x0, x1, y0, y1, waves) => ({ id, waves }) });
  const strip = expression(/STRIP\.zones=(\[[^\n]+\])\.map/);
  const abilities = constant('MOB_ABILITIES');
  const combatTuning=constant('COMBAT_TUNING');
  for(const [name,values]of Object.entries(combatTuning.specials))Object.assign(abilities[name],values);
  const goldDrops = html.includes('Math.max(2,Math.round((e.xp||10)*.35))*(e.isBoss?3:1)');
  if (!goldDrops) throw Error('Gold rule changed; update source adapter.');
  return {
    enemies: constant('ENEMY_TYPES').map(e => ({ ...e, dropChance:combatTuning.orbChance,hpOrbShare:combatTuning.hpOrbShare,spd:e.spd*combatTuning.enemySpeed,interval:e.id==='cryptHound'?1.2:['Arqueiro','Mago Vivo'].includes(e.name)?combatTuning.rangedInterval:combatTuning.meleeInterval,specialDelayMin:e.id==='cryptHound'?2.6:.6+combatTuning.specialDelayMin,specialDelayMax:e.id==='cryptHound'?2.6:.6+combatTuning.specialDelayMax,ability: abilities[e.name] })), combatTuning,minions, stages: constant('CAMP_STAGES').filter(Boolean),liveEquipment:html.includes('/* EQUIPMENT_RULES_BEGIN */'),
    missions: constant('MISSION_TEMPLATES'), captain: constant('CAPTAIN'),
    rooms: rooms.flatMap(r => r.waves), strip: strip.flatMap(z => z.waves),
    provenance: {
      game: 'necromancer-canvas.html', sha256: crypto.createHash('sha256').update(html).digest('hex'),
      treeSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'build-simulator/model.js'))).digest('hex'),
      equipmentSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'scripts/equipment-model.js'))).digest('hex'),
      currentRules: 'Live equipment model supplies current endless scaling, item generation and skill bonuses. Legacy formulas remain available under rules=legacy; campaign keeps stageMul.',
      assumptions: [
        'Crypt Hound uses arena composition; charge collision and lateral dodging remain approximations.',
        'Combat is a positional abstraction: accuracy, engagement, area coverage and aggro are configurable.',
        'XP and skill allocation apply after each encounter; no mid-encounter level-up healing.',
        'Each encounter starts with full player resources and living minions (village/reset assumption).',
        'Summons require invested ranks, including Zombies; level 1 has no starting army.',
        'Gold pickup uses the configured pickup probability; equipment purchases are hypothetical.',
        'Rain resolves as seven fragments spread over configurable targets, without geometry or delayed impacts.',
        'Captain reinforcements are emitted at 75%, 50%, 25% HP; captain AI specials/shield are not modeled.',
        'Minion commands, dash invulnerability, shields, curses, walls, lifesteal and movement geometry are not modeled.',
        'Minion health scaling, regeneration and 50% auto-revive health use live tuning. Manual revival and positional dodging are validated in game, not simulated.',
        'Campaign traversal time is excluded; encounter intervals are counted. XP/min is combat-based.',
        'Campaign enemy scaling is fixed at phase entry; levels/points are updated between ambushes.',
        'Equipment generator and skill bonuses are shared with the game. Selection utility and combat behavior remain assumptions.'
      ]
    }
  };
}
module.exports = { readSource };
