import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,normalizeSave,createSaveStore,CLASS_IDS} from '../scripts/save-model.mjs';
import {createSession,activateSlot,castSession,equipSession} from '../scripts/session.mjs';
import {createWorld,step} from '../scripts/training-model.mjs';
import {snapshotFor} from '../scripts/progression.mjs';
import {beginDash} from '../scripts/combat.mjs';
import {classInfo,isMarksman,isMartial} from '../scripts/class-registry.mjs';
import {gearCatalog} from '../scripts/class-gear.mjs';
import {SHOTS,MARKSMAN_SLOTS,marksmanAttributes,shotDamage} from '../scripts/marksman-model.mjs';
import {marksmanGear} from '../scripts/marksman-equipment.mjs';
const MarksmanGear=marksmanGear('archer');
import {marksmanAction,tickMarksman,clearMarksman} from '../scripts/marksman.mjs';
import {journeySummary,classPreview} from '../scripts/journey-model.mjs';
import WarriorGear from '../scripts/warrior-equipment.mjs';

class MapStorage{values=new Map();getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,v);}removeItem(k){this.values.delete(k);}}
function field(classId='archer',level=1){
 const w=createWorld({horde:0,character:{classId,level,equipment:{}}});
 w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.random=()=>.5;
 w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};
 return w;
}
function target(w,x,y=0,extra={}){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:10000,maxHp:10000,animation:'idle',animationTime:0,timer:0,...extra};w.actors.push(e);return e;}
// Avança só o relógio e as regras dos atiradores, sem a IA dos alvos.
function advance(w,dt=1/60,steps=1){for(let i=0;i<steps;i++){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);w.dash.remaining=Math.max(0,w.dash.remaining-dt);tickMarksman(w,dt);}}

test('registro: seis classes, ids preservados e Arqueira/Mercenário marciais e atiradores',()=>{
 assert.deepEqual(CLASS_IDS,['necromancer','warrior','druid','archer','mercenary','mage']);
 for(const id of ['archer','mercenary']){assert.ok(isMarksman(id));assert.ok(isMartial(id));assert.equal(classInfo(id).horde,undefined);}
 assert.equal(isMarksman('warrior'),false);assert.equal(isMartial('druid'),false);
 assert.equal(classInfo('desconhecida').id,'necromancer');
 assert.equal(classInfo('archer').model,'archerHero');assert.equal(classInfo('archer').resource,'foco');assert.equal(classInfo('mercenary').resource,'vigor');
});

test('Novo Jogo cria Arqueira e Mercenário sem horda; saves antigos continuam Necromantes',()=>{
 const store=createSaveStore(new MapStorage());
 for(const id of ['archer','mercenary']){
  const created=store.createCharacter('Teste '+id,id);assert.ok(created.ok,id);assert.equal(created.save.character.classId,id);
  assert.deepEqual(Object.keys(created.save.character.equipment),[id==='archer'?'bow':'crossbow'],'só a arma inicial');
  assert.equal(normalizeSave(JSON.parse(JSON.stringify(created.save))).character.classId,id);
  const j=classPreview(id);assert.equal(j.model,classInfo(id).model);assert.deepEqual(j.companions,[]);assert.equal(j.stats[1].label,id==='archer'?'Foco':'Vigor');
 }
 assert.equal(normalizeSave(freshSave()).character.classId,'necromancer');
 assert.equal(store.createCharacter('X','bardo').ok,false);
});

test('mundo da classe: modelo próprio, sem aliados e atributos marciais por nível',()=>{
 for(const id of ['archer','mercenary']){
  const w=createWorld({horde:6,character:{classId:id,level:5,equipment:{}}});
  assert.equal(w.player.model,classInfo(id).model);
  assert.equal(w.actors.filter(a=>a.team==='ally').length,0);
  const a=marksmanAttributes(id,5,{});assert.equal(w.player.maxHp,a.hp);assert.equal(w.player.maxMp,a.mp);assert.equal(w.player.damage,a.damage);assert.equal(w.player.spellDamage,0);
  assert.equal(snapshotFor(w).skills[0].damage,shotDamage(id,a.damage));
 }
 assert.ok(marksmanAttributes('mercenary',1).hp>marksmanAttributes('archer',1).hp,'Mercenário é mais resistente');
 assert.ok(marksmanAttributes('archer',1).move>marksmanAttributes('mercenary',1).move,'Arqueira é mais rápida');
});

test('Disparo da Arqueira: solta no instante da regra, voa e acerta uma vez o primeiro inimigo da linha',()=>{
 const w=field('archer'),d=SHOTS.archer,near=target(w,6),far=target(w,9);
 assert.ok(marksmanAction(w));assert.equal(w.player.animation,'shoot');
 assert.equal(marksmanAction(w),false,'uma ação por vez');
 advance(w,1/60,Math.floor(d.release*60)-1);assert.equal(w.marksmanShots.length,0,'antes da soltura não há flecha');
 advance(w,1/60,2);assert.equal(w.marksmanShots.length,1);
 advance(w,1/60,60);
 const dmg=shotDamage('archer',w.player.damage);
 assert.equal(near.hp,10000-dmg);assert.equal(far.hp,10000,'flecha sem perfuração para no primeiro');
 assert.equal(w.marksmanShots.length,0);assert.equal(w.marksmanAction,null);
});

test('Virote pesado do Mercenário atravessa até dois inimigos extras, perdendo força, e empurra',()=>{
 const w=field('mercenary'),d=SHOTS.mercenary,list=[4,6,8,10].map(x=>target(w,x));
 assert.ok(marksmanAction(w));advance(w,1/60,120);
 const base=shotDamage('mercenary',w.player.damage),expected=[base,Math.round(base*d.falloff),Math.round(base*d.falloff*d.falloff),0];
 assert.deepEqual(list.map(e=>10000-e.hp),expected);
 assert.ok(list[0].x>4+.3,'o impacto empurra respeitando colisões');
});

test('paredes param o projétil; esquiva cancela antes da soltura; troca de cena limpa tiros',()=>{
 const w=field('archer'),e=target(w,8);
 w.arena.solids=[{kind:'box',x:4,y:0,width:.6,depth:4}];
 marksmanAction(w);advance(w,1/60,90);assert.equal(e.hp,10000,'a parede bloqueia a flecha');
 const w2=field('archer');target(w2,6);marksmanAction(w2);advance(w2,1/60,5);
 assert.ok(beginDash(w2,{x:1,y:0}));assert.equal(w2.marksmanAction,null);advance(w2,1/60,30);assert.equal(w2.marksmanShots.length,0,'cancelado antes da soltura não dispara');
 const w3=field('mercenary');marksmanAction(w3);advance(w3,1/60,30);assert.equal(w3.marksmanShots.length,1);clearMarksman(w3);assert.equal(w3.marksmanShots.length,0);assert.equal(w3.effects.filter(f=>f.marksmanShot).length,0);
});

test('recarga, movimento durante o tiro e barra: 1 atira, 4 esquiva, as demais pedem a árvore',()=>{
 const w=field('archer');w.player.moveSpeed=6;
 marksmanAction(w);const x=w.player.x,y=w.player.y;step(w,.1,{x:1,y:0});assert.ok(Math.abs(Math.hypot(w.player.x-x,w.player.y-y)-.6*SHOTS.archer.move)<1e-6,'anda a 85% enquanto atira');
 assert.equal(w.player.pose.upper,true,'tiro só no tronco');assert.equal(w.player.animation,'walk','pernas na passada');assert.equal(w.player.pose.anim,'shoot');
 step(w,.25,{});step(w,.25,{});assert.equal(w.marksmanAction,null,'step limita cada chamada a 0,25 s');
 const raw=freshSave();raw.character.classId='mercenary';const s=createSession(raw);s.world=field('mercenary');s.scene='training';
 assert.ok(activateSlot(s,0,{}));assert.equal(activateSlot(s,1,{}),false);assert.equal(activateSlot(s,2,{}),false);
 assert.equal(equipSession(s,1,2).ok,false);
 s.world.marksmanAction=null;s.world.marksmanCooldowns={};assert.ok(castSession(s),'clique comum dispara');
});

test('equipamento: catálogo marcial sem espada e escudo; afixos marciais valem',()=>{
 assert.equal(gearCatalog('archer'),MarksmanGear);assert.equal(gearCatalog('warrior'),WarriorGear);
 assert.deepEqual(Object.keys(MarksmanGear.slots),['bow',...MARKSMAN_SLOTS]);
 let r=0;const random=()=>((r=(r*9301+49297)%233280)/233280);
 for(let i=0;i<60;i++){const item=MarksmanGear.generate(5,null,random);assert.ok(['bow',...MARKSMAN_SLOTS].includes(item.type),item.type);}
 assert.equal(MarksmanGear.generate(5,null,random,'sword').type!=='sword',true);
 const sword=WarriorGear.generate(5,null,()=>.5,'sword'),armor=WarriorGear.generate(5,null,()=>.5,'body');
 assert.equal(MarksmanGear.allowed(sword),false);assert.ok(MarksmanGear.allowed(armor));
 const bare=marksmanAttributes('archer',5,{}),geared=marksmanAttributes('archer',5,{body:armor,sword});
 assert.ok(geared.hp>bare.hp,'armadura conta');assert.equal(marksmanAttributes('archer',5,{sword}).damage,bare.damage,'espada não conta');
 const roll=MarksmanGear.dropRoll({},5,()=>.1);assert.ok(['bow',...MARKSMAN_SLOTS].includes(roll.type));
});

test('journeySummary mostra a classe salva e o modelo certo',()=>{
 const s=freshSave();s.character.classId='mercenary';s.character.name='Bento';
 const j=journeySummary('x',normalizeSave(s));assert.equal(j.className,'Mercenário');assert.equal(j.model,'mercenary');
});
