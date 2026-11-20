import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,snapshot,transition,pauseSession,stepSession,applySave} from '../scripts/session.mjs';
import {freshSave,normalizeSave} from '../scripts/save-model.mjs';
import {testAction} from '../scripts/test-tools.mjs';
import {MAX_LEVEL,levelOf} from '../scripts/progression.mjs';

for(const classId of ['necromancer','warrior','druid','archer','mercenary','mage'])test('ajuste de nível e save: '+classId,()=>{
 const save=freshSave();Object.assign(save.character,{classId,level:5,exp:12});
 const s=createSession(save),hp=s.world.player.maxHp;
 assert.equal(testAction(s,'level-up').ok,true);assert.equal(levelOf(s.world),6);assert.equal(s.save.character.exp,0);
 assert.ok(s.world.player.maxHp>hp);assert.equal(snapshot(s).character.level,6);
 assert.equal(testAction(s,'level-down').ok,true);assert.equal(levelOf(s.world),5);assert.equal(s.world.player.maxHp,hp);
 assert.equal(normalizeSave(snapshot(s)).character.level,5);
});
test('limites, ouro, restauração e proteções',()=>{
 const s=createSession();assert.equal(testAction(s,'level-down').ok,false);
 testAction(s,'gold-down');assert.equal(s.save.character.gold,0);
 testAction(s,'gold-up');assert.equal(s.save.character.gold,1000);
 s.world.player.hp=1;s.world.player.mp=0;testAction(s,'restore');assert.equal(s.world.player.hp,s.world.player.maxHp);assert.equal(s.world.player.mp,s.world.player.maxMp);
 transition(s,'training');assert.equal(testAction(s,'level-up').ok,false);
 pauseSession(s,true);s.world.adventure={cinematic:true};assert.equal(testAction(s,'gold-up').ok,false);
 s.world.adventure=null;s.world.player.hp=0;assert.equal(testAction(s,'restore').ok,false);
 const save=freshSave();save.character.level=MAX_LEVEL;const capped=createSession(save);assert.equal(testAction(capped,'level-up').ok,false);
});
test('remover nível não apaga investimentos incompatíveis',()=>{
 const save=freshSave();save.character.classId='warrior';save.character.level=2;save.character.warriorRanks={slash:6};
 const s=createSession(save),before=snapshot(s);
 assert.equal(testAction(s,'level-down').ok,false);assert.equal(levelOf(s.world),2);assert.deepEqual(snapshot(s).character.warriorRanks,before.character.warriorRanks);
});

for(const classId of ['necromancer','warrior','druid','archer','mercenary','mage'])test('velocidade temporária, movimento e recarga do save: '+classId,()=>{
 const save=freshSave();save.character.classId=classId;
 const measure=speed=>{const s=createSession(save);transition(s,'training');s.world.actors=[s.world.player];s.world.arena={solids:[],bounds:{minX:-100,maxX:100,minY:-100,maxY:100}};pauseSession(s,true);assert.equal(testAction(s,'move-speed',speed).ok,true);pauseSession(s,false);const x=s.world.player.x;stepSession(s,.1,{x:1,y:0});return {s,distance:s.world.player.x-x};};
 const normal=measure(1),fast=measure(5);assert.ok(Math.abs(fast.distance/normal.distance-5)<1e-8);
 assert.equal(fast.s.world.time,normal.s.world.time,'não acelera o relógio de combate');
 const saved=snapshot(fast.s);assert.equal('testMoveSpeed' in saved.character,false);assert.equal('testMoveSpeed' in saved.settings,false);
 pauseSession(fast.s,true);for(const v of [0,-1,6,Infinity,NaN])assert.equal(testAction(fast.s,'move-speed',v).ok,false);
 assert.equal(fast.s.world.testMoveSpeed,5);
 applySave(fast.s,saved);assert.equal(fast.s.world.testMoveSpeed,1);
});
test('velocidade de teste respeita pausa, morte e paredes',()=>{
 const s=createSession();transition(s,'training');assert.equal(testAction(s,'move-speed',5).ok,false);
 pauseSession(s,true);assert.equal(testAction(s,'move-speed',5).ok,true);s.world.player.hp=0;assert.equal(testAction(s,'move-speed',1).ok,false);s.world.player.hp=s.world.player.maxHp;
 s.world.actors=[s.world.player];s.world.arena={solids:[{kind:'box',x:2,y:4,width:1,depth:20}],bounds:{minX:-20,maxX:20,minY:-20,maxY:20}};
 pauseSession(s,false);stepSession(s,.25,{x:1,y:0});assert.ok(s.world.player.x<1.1,'não atravessa a parede a 5×');
});
