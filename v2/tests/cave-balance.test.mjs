import test from 'node:test';
import assert from 'node:assert/strict';
import {classes,measure,caveSession} from './cave-balance-simulation.mjs';
import {spawnEnemy,Types} from '../scripts/enemies.mjs';
import {createWorld} from '../scripts/training-model.mjs';
import {releaseGroup} from '../scripts/map-spawns.mjs';

for(const id of classes){
 test(`${id}: comuns da caverna resistem ao básico; progressão continua reduzindo o tempo de abate`,()=>{
  for(const type of [4,8,6,9]){
   const options={type,wave:type===9?2:1},start=measure(id,options),later=measure(id,{...options,level:3});
   assert.ok(start.killed&&later.killed);
   assert.ok(start.casts>=5&&start.casts<=7,JSON.stringify(start));
   assert.ok(later.casts>=3&&later.casts<=start.casts,JSON.stringify(later));
   assert.equal(start.hp,later.hp,'a vida não acompanha artificialmente o nível do jogador');
  }
 });
 test(`${id}: habilidade inicial tem impacto superior ao básico`,()=>{
  const result=measure(id,{ability:true,level:id==='druid-wolf'?4:1});
  assert.ok(result.killed&&result.casts>=1&&result.casts<=2,JSON.stringify(result));
 });
}
test('resistência global é igual entre modos, sem alterar dano/XP; elite mantém proporção',()=>{
 const s=caveSession('mage'),w=s.world,plain=createWorld({horde:0}),normal=spawnEnemy(plain,4,0,0),cave=spawnEnemy(w,4,0,165),elite=spawnEnemy(w,4,0,165,{tier:'magic'});
 assert.equal(normal.hp,Types[4].hp);assert.equal(cave.dmg,normal.dmg);assert.equal(cave.xp,normal.xp);
 assert.ok(elite.hp>cave.hp);
 w.adventure={kind:'prologue',stage:'trail'};assert.equal(spawnEnemy(w,4,0,165).hp,normal.hp);
});
test('reforços recebem exatamente a mesma resistência da primeira leva',()=>{
 const {world:w}=caveSession('warrior');
 const g={id:'test-reinforcement',x:0,y:165,mix:[4,8],count:2,level:1,waves:2,wavesLeft:2};
 releaseGroup(w,g);const first=w.actors.filter(a=>a.worldGroup===g.id).map(e=>e.maxHp);
 w.actors=w.actors.filter(a=>a.worldGroup!==g.id);releaseGroup(w,g);
 assert.deepEqual(w.actors.filter(a=>a.worldGroup===g.id).map(e=>e.maxHp),first);
});
