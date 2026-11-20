import test from 'node:test';
import assert from 'node:assert/strict';
import {classes} from './cave-balance-simulation.mjs';
import {scenarios,measureMode} from './global-balance-simulation.mjs';
import {conquestCombatScale,CONQUEST_MIN_HP_SCALE} from '../scripts/expedition.mjs';
import Endgame from '../scripts/shared-endgame.mjs';
import {readV2Balance} from '../../balance-simulator/v2-source.mjs';

for(const id of classes)test(`${id}: resistência chega à campanha, Arena, Expedições, Valdoria e Cerco`,()=>{
 for(const scenario of scenarios){const r=measureMode(id,scenario);assert.ok(r.killed,JSON.stringify(r));assert.ok(r.casts>=3,JSON.stringify(r));}
});
test('piso de Valdoria mantém dano/XP e deixa de interferir nas dificuldades altas',()=>{
 for(const difficulty of [1,2,3,10,20]){const original=Endgame.combatScale(difficulty),actual=conquestCombatScale(difficulty);
  assert.equal(actual.damage,original.damage);assert.equal(actual.xp,original.xp);assert.equal(actual.hp,Math.max(CONQUEST_MIN_HP_SCALE,original.hp));
  if(original.hp>=CONQUEST_MIN_HP_SCALE)assert.deepEqual(actual,original);
 }
});
test('adaptador distingue as regras da v2 das simulações legadas',()=>{
 const source=readV2Balance();assert.equal(source.version,'v2');assert.equal(source.enemies.length,11);
 assert.ok(source.enemies.every(e=>e.hp>=source.resilience.floor));assert.ok(source.basic.mercenary<1);
});
