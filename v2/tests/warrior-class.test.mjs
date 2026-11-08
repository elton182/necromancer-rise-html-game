import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import EQ from '../scripts/warrior-equipment.mjs';
import Shared from '../scripts/shared-equipment.mjs';
import Build from '../scripts/shared-build.mjs';
import {freshSave,normalizeSave,createSaveStore} from '../scripts/save-model.mjs';
import {createSession,transition,snapshot,equipSession} from '../scripts/session.mjs';
import {createWorld,setPaused,step} from '../scripts/training-model.mjs';
import {applyAttributes,snapshotFor} from '../scripts/progression.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {buy,equip,unequip,forge} from '../scripts/gear.mjs';
import {canLearn,warriorRanks,warriorSpent} from '../scripts/warrior-model.mjs';
import {warriorAction,tickWarrior,stopWarriorChannel} from '../scripts/warrior.mjs';
let serial=0;
const item=type=>EQ.generate(10,null,()=>.95,type,false,'martial-test-'+(++serial));
function field(ranks={}){const w=createWorld({horde:0,character:{classId:'warrior',level:20,warriorRanks:ranks,equipment:{sword:item('sword'),shield:item('shield')}}});w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.arena={bounds:{minX:-20,maxX:20,minY:-20,maxY:20},solids:[]};return w;}
function target(w,x,y=0){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:10000,maxHp:10000,animation:'idle',animationTime:0,timer:0};w.actors.push(e);return e;}
function advance(w,dt){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);tickWarrior(w,dt);}

test('catálogo marcial só gera atributos próprios, valida forja e persiste trocas',()=>{
 const raw=freshSave();raw.character.classId='warrior';raw.character.level=20;raw.character.gold=100000;
 const s=createSession(normalizeSave(raw));s.world.random=()=>.95;
 for(const type of Object.keys(EQ.slots)){
  assert.ok(buy(s,type).ok);const i=s.save.character.gearBag.at(-1);assert.ok(EQ.validate(i));
  assert.ok([i.base,...i.affixes].every(a=>!['spell','hordeDps','hordeHp','skill','school'].includes(a.stat)));
  assert.ok(equip(s,i.id,type).ok);assert.ok(unequip(s,type).ok);
  s.scene='village';assert.ok(forge(s,i.id).ok);assert.ok(forge(s,i.id,0).ok);assert.ok(EQ.validate(i));s.scene='menu';
 }
 const saved=normalizeSave(snapshot(s));assert.equal(saved.character.gearBag.length,s.save.character.gearBag.length);
 const a=snapshotFor(s.world).attributes;assert.equal(a.spell,0);assert.equal(a.hordeDps,undefined);assert.ok(a.damage>0);
});
test('migração preserva equipamento antigo e não recria espada ou escudo após guardar ou vender',()=>{
 const raw=freshSave(),staff=Shared.generate(1,Build,()=>.2,'staff',false,'old-staff');raw.character.classId='warrior';raw.character.equipment.staff=staff;
 const once=normalizeSave(raw);assert.equal(once.character.equipment.staff.id,staff.id);assert.ok(once.character.equipment.sword);assert.ok(once.character.equipment.shield);
 delete once.character.equipment.shield;const twice=normalizeSave(once);assert.equal(twice.character.equipment.shield,undefined);
 const s=createSession(twice);s.save.character.gearBag.push(staff);assert.equal(equip(s,staff.id,'staff').ok,false);
 const store=createSaveStore(new MapStorage());const created=store.createCharacter('Soldado','warrior');assert.ok(created.ok);assert.ok(created.save.character.equipment.sword);assert.ok(store.selectCharacter(created.save.character.slotId).ok);
});
class MapStorage{values=new Map();getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,v);}removeItem(k){this.values.delete(k);}}
test('bloqueio anula todo o ataque sem gastar barreira; armadura continua separada',()=>{
 const w=field({shieldDefense:5,riposte:3}),e=target(w,1);w.random=()=>0;w.player.barrier=30;const hp=w.player.hp;
 const result=dealDamage(w,w.player,1000,e);assert.equal(result.blocked,true);assert.equal(w.player.hp,hp);assert.equal(w.player.barrier,30);assert.ok(Math.abs(w.warriorRiposte.bonus-.3)<1e-9);
 w.random=()=>.99;assert.ok(dealDamage(w,w.player,100,e).applied>0);
 w.player.blockChance=75;assert.equal(snapshotFor(w,{...w.equipment,shield:null}).attributes.blockChance,0);
 const rings={...w.equipment,ring1:item('ring1'),ring2:item('ring2')};rings.ring1.affixes=[{stat:'blockChance',value:100}];rings.ring2.affixes=[];assert.equal(snapshotFor(w,rings).attributes.blockChance,75);
});
test('árvore exige nível, investimento e orçamento sem usar bônus de equipamento',()=>{
 assert.equal(canLearn({},'tornado',6),false);assert.equal(canLearn({thrust:1},'tornado',5),false);assert.ok(canLearn({thrust:1},'tornado',6));
 const r=warriorRanks({strength:5,shieldThrow:1,tornado:1},2);assert.equal(warriorSpent(r),5);assert.equal(r.shieldThrow,0);assert.equal(r.tornado,0);
 const w=field({regeneration:2,equipmentMastery:2});assert.ok(w.player.hpRegen>=.8);const damage=w.player.damage;applyAttributes(w);assert.equal(w.player.damage,damage);
});
test('só cortes funcionam sem investimento; um ponto libera cada habilidade',()=>{
 const w=field(),mp=w.player.mp;
 for(const index of [1,2,4,5])assert.equal(warriorAction(w,index),false,'ação '+index);
 assert.equal(w.player.mp,mp);assert.deepEqual(w.warriorCooldowns,[]);assert.equal(w.warriorAction,null);
 assert.ok(warriorAction(w,0));
 for(const [index,ranks] of [[1,{thrust:1}],[2,{bash:1}],[4,{thrust:1,tornado:1}],[5,{bash:1,shieldThrow:1}]])assert.ok(warriorAction(field(ranks),index),'ação '+index);
 const save=freshSave();Object.assign(save.character,{classId:'warrior',level:6});const s=createSession(save);
 for(const id of [1,2,4,5])assert.equal(equipSession(s,0,id).ok,false,'slot '+id);
 s.world.warriorRanks={thrust:1};assert.ok(equipSession(s,0,1).ok);
});

test('tornado atinge ao redor enquanto mantido e termina ao soltar, pausar, esgotar ou morrer',()=>{
 const w=field({thrust:1,tornado:1}),front=target(w,2),back=target(w,-2);assert.ok(warriorAction(w,4));const mp=w.player.mp;advance(w,.8);assert.ok(front.hp<10000);assert.equal(front.hp,back.hp);assert.ok(w.player.mp<mp);
 assert.ok(stopWarriorChannel(w));const hp=front.hp;advance(w,1);assert.equal(front.hp,hp);assert.equal(w.warriorAction,null);assert.equal(warriorAction(w,4),false);
 advance(w,3);assert.ok(warriorAction(w,4));setPaused(w,true);assert.equal(w.warriorAction,null);w.paused=false;advance(w,3);
 w.player.mp=5.1;assert.ok(warriorAction(w,4));advance(w,.1);assert.equal(w.warriorAction,null);
 advance(w,3);w.player.mp=50;assert.ok(warriorAction(w,4));w.player.hp=0;advance(w,.1);assert.equal(w.warriorAction,null);
 assert.equal(warriorAction(field(),4),false);
});
test('escudo acerta uma vez na ida e na volta; não bloqueia em voo e retorna',()=>{
 const w=field({bash:1,shieldThrow:1}),e=target(w,3);w.random=()=>0;assert.ok(warriorAction(w,5));advance(w,.2);assert.ok(w.warriorShieldFlight);assert.equal(warriorAction(w,2),false);
 const hp=w.player.hp;assert.ok(dealDamage(w,w.player,10,e).applied>0);assert.ok(w.player.hp<hp);
 for(let i=0;i<120;i++)advance(w,1/60);
 assert.equal(w.warriorShieldFlight,null);assert.equal(w.actors.filter(a=>a.warriorProjectile).length,0);assert.equal(e.hp,10000-2*Math.floor(w.player.damage*1.2));
 const v=field({bash:1,shieldThrow:1}),behind=target(v,4);v.arena.solids=[{kind:'box',x:2,y:0,width:1,depth:6}];warriorAction(v,5);for(let i=0;i<120;i++)advance(v,1/60);assert.equal(behind.hp,10000);assert.equal(v.warriorShieldFlight,null);
});
test('sinergias são temporárias, consumidas uma vez e morte limpa o escudo',()=>{
 const w=field({slash:1,momentum:2,thrust:1,shieldDefense:1,riposte:2,bash:1,shieldThrow:1}),e=target(w,2);
 for(const duration of [.6,16/30,.4]){warriorAction(w,0);advance(w,duration);}assert.equal(w.warriorMomentum.bonus,.2);
 assert.ok(warriorAction(w,1));assert.equal(w.warriorAction.damageFactor,1.2);assert.equal(w.warriorMomentum,null);advance(w,1);
 w.random=()=>0;dealDamage(w,w.player,10,e);assert.ok(warriorAction(w,5));assert.equal(w.warriorAction.damageFactor,1.2);assert.equal(w.warriorRiposte,null);advance(w,.2);w.random=()=>.99;dealDamage(w,w.player,1e9,e);assert.equal(w.warriorShieldFlight,null);assert.ok(!w.actors.some(a=>a.warriorProjectile));
});
test('inimigo soldado usa modelo anterior e jogador preserva só oito clipes',()=>{
 const registry=JSON.parse(readFileSync(new URL('../assets/models.json',import.meta.url)));
 assert.equal(registry.enemySoldier.path,'blender/exports/v2_enemy_knight.glb');assert.notEqual(registry.enemySoldier.path,registry.warrior.path);
 const b=readFileSync(new URL('../../blender/exports/warrior.glb',import.meta.url));const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert.equal(gltf.animations.length,11);assert.equal(new Set(gltf.animations.map(a=>a.name)).size,11);assert.equal(gltf.meshes.length,1);assert.ok('_WARRIOR_SHIELD' in gltf.meshes[0].primitives[0].attributes);
});
