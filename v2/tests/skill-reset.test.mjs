import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,snapshot} from '../scripts/session.mjs';
import {freshSave} from '../scripts/save-model.mjs';
import {resetRanks,talentResetInfo,syncSkills} from '../scripts/grimoire.mjs';
import {warriorActionLearned} from '../scripts/warrior-model.mjs';
import {loadoutLearned} from '../scripts/skill-loadout.mjs';

const builds={warrior:['warriorRanks',{slash:2,tornado:1}],druid:['druidRanks',{spark:2,wolf:1}],mage:['marksmanRanks',{bolt:2,fireball:1}],archer:['marksmanRanks',{shot:2,pierce:1}],mercenary:['marksmanRanks',{quarrel:2,volley:1}]};
function fixture(id){const save=freshSave(),[field,ranks]=builds[id];save.character.classId=id;save.character.level=24;save.horde.profile.level=24;save.character[field]=ranks;save.character.gold=1000;return createSession(save);}
for(const id of Object.keys(builds)){
 test(id+': devolve a árvore, cobra por ponto e persiste sem alterar progressão ou equipamento',()=>{
  const s=fixture(id),w=s.world,[field]=builds[id];syncSkills(w);
  const before=snapshot(s),cost=talentResetInfo(s).cost;assert.ok(cost>0);
  w.player.hp=Math.floor(w.player.maxHp/2);w.player.mp=Math.floor(w.player.maxMp/2);
  const hp=w.player.hp/w.player.maxHp,mp=w.player.mp/w.player.maxMp;
  w.warriorCooldowns=[99];w.druidCooldowns={storm:99};w.marksmanCooldowns={fireball:99};
  assert.equal(resetRanks(s).ok,true);assert.equal(s.save.character.gold,1000-cost);assert.deepEqual(w[field],{});
  assert.ok(Math.abs(w.player.hp/w.player.maxHp-hp)<.02);assert.ok(Math.abs(w.player.mp/w.player.maxMp-mp)<.02);
  assert.deepEqual(w.warriorCooldowns,[99]);assert.deepEqual(w.druidCooldowns,{storm:99});assert.deepEqual(w.marksmanCooldowns,{fireball:99});
  const after=snapshot(s);for(const key of ['level','exp','equipment'])assert.deepEqual(after.character[key],before.character[key]);
  const restored=createSession(after);assert.equal(talentResetInfo(restored).cost,0);
  assert.equal(id==='warrior'?warriorActionLearned(4,w[field]):loadoutLearned(id,id==='druid'?'storm':id==='mage'?'fireball':id==='archer'?'pierce':'volley',w[field]),false);
  const gold=s.save.character.gold;assert.equal(resetRanks(s).ok,false);assert.equal(s.save.character.gold,gold);
 });
 test(id+': falhas por ouro, combate ou morte preservam o estado',()=>{
  for(const fail of ['gold','combat','dead']){const s=fixture(id);if(fail==='gold')s.save.character.gold=0;if(fail==='combat'){s.scene='training';s.world.paused=false;}if(fail==='dead')s.world.player.hp=0;
   const before=JSON.stringify(s);assert.equal(resetRanks(s).ok,false);assert.equal(JSON.stringify(s),before);
  }
 });
 test(id+': disponível no treino pausado e independente da horda',()=>{const s=fixture(id);s.scene='training';s.world.paused=true;s.world.armyMode='stress';assert.equal(resetRanks(s).ok,true);});
}
test('Druida encerra forma e invocações; Mago encerra escudo e projéteis; Guerreiro encerra canalização',()=>{
 const d=fixture('druid');d.world.druidForm='wolf';d.world.player.model='druidWolf';d.world.druidHeal={until:99};d.world.actors.push({companion:'druidWolf',hp:100,maxHp:100});
 assert.equal(resetRanks(d).ok,true);assert.equal(d.world.druidForm,'human');assert.equal(d.world.player.model,'druid');assert.deepEqual(d.save.character.druidPack,[]);assert.equal(d.world.druidHeal,null);assert.ok(!d.world.actors.some(a=>a.companion));
 const m=fixture('mage');m.world.marksmanShield={until:99};m.world.marksmanShots=[{}];m.world.actors.push({companion:'iceGolem'});
 assert.equal(resetRanks(m).ok,true);assert.equal(m.world.marksmanShield,null);assert.deepEqual(m.world.marksmanShots,[]);assert.ok(!m.world.actors.some(a=>a.companion));
 const w=fixture('warrior');w.world.warriorAction={index:4};w.world.warriorWaves=[{}];w.world.actors.push({warriorProjectile:true});
 assert.equal(resetRanks(w).ok,true);assert.equal(w.world.warriorAction,null);assert.deepEqual(w.world.warriorWaves,[]);assert.ok(!w.world.actors.some(a=>a.warriorProjectile));
});
