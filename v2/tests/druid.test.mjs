import {schoolSynergy} from '../scripts/skill-synergy.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,normalizeSave,createSaveStore} from '../scripts/save-model.mjs';
import {createSession,transition,activateSlot,stanceSession,castSession} from '../scripts/session.mjs';
import {createWorld} from '../scripts/training-model.mjs';
import {snapshotFor} from '../scripts/progression.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {druidRanks,canLearnDruid,druidBudget,druidSpent,WOLF,DRUID_NODES} from '../scripts/druid-model.mjs';
import {druidAction,tickDruid,toggleWolf,HUMAN_ACTIONS,WOLF_ACTIONS} from '../scripts/druid.mjs';

class MapStorage{values=new Map();getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,v);}removeItem(k){this.values.delete(k);}}
const ALL={spark:5,chain:3,storm:1,roots:3,thornbind:3,rejuvenate:1,wolf:3,leap:1,wildHeart:0,howl:1};
function field(ranks=ALL,level=20){
 const w=createWorld({horde:0,character:{classId:'druid',level,druidRanks:ranks,equipment:{}}});
 w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.random=()=>.5;
 w.arena={bounds:{minX:-30,maxX:30,minY:-30,maxY:30},solids:[]};w.player.mp=w.player.maxMp;
 return w;
}
function target(w,x,y=0,extra={}){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:10000,maxHp:10000,animation:'idle',animationTime:0,timer:0,...extra};w.actors.push(e);return e;}
// Avança só o relógio e as regras da Druida, sem a IA dos alvos.
function advance(w,dt,steps=1){for(let i=0;i<steps;i++){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);tickDruid(w,dt);}}
const finish=(w)=>advance(w,1/60,90);

test('Druida é uma classe válida, com árvore própria persistida e saves antigos intactos',()=>{
 const store=createSaveStore(new MapStorage()),created=store.createCharacter('Flora','druid');
 assert.ok(created.ok);assert.equal(created.save.character.classId,'druid');assert.deepEqual(Object.keys(created.save.character.druidRanks),Object.keys(DRUID_NODES));
 assert.equal(store.createCharacter('X','bardo').ok,false);
 const raw=freshSave();raw.character.classId='druid';raw.character.level=4;raw.character.druidRanks={spark:5,chain:3,storm:1,roots:3,wolf:3};
 const saved=normalizeSave(raw).character.druidRanks;
 assert.equal(druidSpent(saved),druidBudget(4));assert.equal(saved.storm,0,'Tempestade exige nível 6');
 assert.equal(normalizeSave(freshSave()).character.classId,'necromancer');
});
test('orçamento, nível e pré-requisitos da árvore',()=>{
 const r=druidRanks({},6);assert.equal(canLearnDruid(r,'storm',6),false,'requer Corrente');
 r.chain=1;assert.ok(canLearnDruid(r,'storm',6));assert.equal(canLearnDruid(r,'storm',5),false);
 assert.equal(canLearnDruid({...r,leap:0},'leap',8),false,'Salto requer Forma de Lobo');
 const full=druidRanks(Object.fromEntries(Object.entries(DRUID_NODES).map(([id,n])=>[id,n.max])),60);
 assert.equal(druidSpent(full),Object.values(DRUID_NODES).reduce((a,n)=>a+n.max,0));
});
test('atributos mágicos sem horda; passivas e itens do catálogo do Necromante',()=>{
 const base=snapshotFor({classId:'druid',level:10,druidRanks:{}},{},10).attributes,necro=snapshotFor({classId:'necromancer',level:10,army:{profile:{level:10,ranks:{}},loadout:[],mastery:{}}},{},10).attributes;
 assert.equal(base.hp,Math.round(necro.hp*1.1));assert.equal(base.spell,necro.spell);assert.equal(base.hordeDps,0);assert.ok(base.move>necro.move);
 const strong=snapshotFor({classId:'druid',level:10,druidRanks:{vitality:5,attunement:5,wisdom:5}},{},10).attributes;
 assert.equal(strong.hp,Math.round(necro.hp*1.1*1.5));assert.ok(Math.abs(strong.spell-necro.spell*1.4)<1e-9);assert.equal(strong.mp,Math.round(necro.mp*1.5));
});
test('mundo da Druida: modelo próprio e nenhum aliado da horda',()=>{
 const w=createWorld({horde:6,armyMode:'groups',army:freshSave().horde,character:{classId:'druid',level:3,druidRanks:{},equipment:{}}});
 assert.equal(w.player.model,'druid');assert.equal(w.actors.filter(a=>a.team==='ally').length,0);assert.equal(w.druidForm,'human');
});
test('Faísca atinge só o primeiro inimigo na linha, sem custo, e respeita a recarga',()=>{
 const w=field(),near=target(w,4),far=target(w,7),mp=w.player.mp;
 assert.ok(druidAction(w,0,{x:10,y:0}));assert.equal(druidAction(w,0,{x:10,y:0}),false,'uma ação por vez');
 finish(w);assert.ok(near.hp<10000);assert.equal(far.hp,10000);assert.equal(w.player.mp,mp);
 const expected=Math.floor(w.player.spellDamage*HUMAN_ACTIONS[0].multiplier*(1+5*.06+schoolSynergy('druid',w.druidRanks,'spark')));assert.equal(10000-near.hp,expected);
 const side=field(),off=target(side,5,2);druidAction(side,0,{x:10,y:0});finish(side);assert.equal(off.hp,10000,'fora da linha');
});
test('Corrente salta para inimigos próximos, um salto extra por ponto, com perda por salto',()=>{
 const w=field({...ALL,chain:1}),list=[target(w,5),target(w,7),target(w,9),target(w,11)];
 assert.ok(druidAction(w,1,{x:5,y:0}));finish(w);
 const hit=list.filter(e=>e.hp<10000);assert.equal(hit.length,3,'primeiro alvo + 2 saltos');
 assert.ok(10000-list[0].hp>10000-list[1].hp);assert.equal(list[3].hp,10000);
 const locked=field({spark:1});target(locked,5);assert.equal(druidAction(locked,1,{x:5,y:0}),false,'precisa do nó');
});
test('Raízes prendem no lugar, poupam chefes e a Casca de Espinhos aumenta o dano recebido',()=>{
 const w=field(),a=target(w,6),boss=target(w,6.5,0,{isBoss:true}),out=target(w,12);
 assert.ok(druidAction(w,2,{x:6,y:0}));finish(w);
 assert.ok(a.druidRoot>w.time);assert.equal(a.slow,1);assert.ok(a.slowTime>2);assert.ok(a.hp<10000);
 assert.equal(boss.druidRoot,undefined);assert.ok(boss.hp<10000);assert.equal(out.hp,10000);
 const before=a.hp;dealDamage(w,a,100,w.player);assert.equal(before-a.hp,Math.floor(100*1.3));
});
test('Tempestade derruba raios só dentro da área, enquanto ela dura',()=>{
 const w=field(),inside=target(w,8),outside=target(w,14);
 assert.ok(druidAction(w,4,{x:8,y:0}));advance(w,1/30,30);
 assert.equal(w.druidStorms.length,1);const after=inside.hp;assert.ok(after<10000);assert.equal(outside.hp,10000);
 advance(w,1/30,150);assert.equal(w.druidStorms.length,0);const done=inside.hp;advance(w,1/30,30);assert.equal(inside.hp,done);
});
test('Rejuvenescer cura 30% da vida ao longo de 5 s',()=>{
 const w=field(),p=w.player;p.hp=1;assert.ok(druidAction(w,5,{x:3,y:0}));advance(w,1/30,30*6);
 assert.ok(Math.abs(p.hp-(1+p.maxHp*.3))<1,'cura total de 30%');
});
test('Forma de Lobo: troca de modelo, garras devolvem mana, consumo contínuo e volta ao esgotar',()=>{
 const w=field(),p=w.player;
 const locked=field({spark:1});assert.equal(toggleWolf(locked),false,'precisa do nó');
 assert.ok(toggleWolf(w));assert.equal(p.model,'druidWolf');assert.equal(w.druidForm,'wolf');
 assert.equal(druidAction(w,4,{x:3,y:0}),false,'sem magias na forma de lobo');
 p.mp=60;const e=target(w,1.5);advance(w,1/60,30);const mp=p.mp;assert.ok(druidAction(w,0,{x:3,y:0}));advance(w,1/60,40);
 assert.ok(e.hp<10000);assert.ok(Math.abs(p.mp-(mp+WOLF.hitRestore-WOLF.drain*40/60))<.05,'drena 4/s e devolve 3 por acerto');
 const before=p.hp;dealDamage(w,p,100,e);assert.equal(before-p.hp,80,'lobo recebe 20% menos');
 p.mp=.01;advance(w,1/60,2);assert.equal(w.druidForm,'human');assert.equal(p.model,'druid');assert.ok(w.druidFormReady-w.time>3.9);
 assert.equal(toggleWolf(w),false,'espera após esgotar');
});
test('Salto Feroz avança com colisão e atinge a área de pouso',()=>{
 const w=field(),p=w.player;toggleWolf(w);advance(w,1/60,30);const e=target(w,5.5);
 assert.ok(druidAction(w,1,{x:6,y:0}));finish(w);assert.ok(p.x>4.5&&p.x<6);assert.ok(e.hp<10000);
 const wall=field();toggleWolf(wall);advance(wall,1/60,30);wall.arena.solids=[{kind:'box',x:3,y:0,width:1,depth:6,angle:0}];
 druidAction(wall,1,{x:6,y:0});finish(wall);assert.ok(wall.player.x<2.6,'não atravessa parede');
});
test('sessão: barra fixa por forma, F alterna, esquiva no slot 4 e troca de cena volta à forma humana',()=>{
 const raw=freshSave();raw.character.classId='druid';raw.character.level=20;raw.character.druidRanks=ALL;
 const s=createSession(normalizeSave(raw));transition(s,'training');const w=s.world;w.aim={x:w.player.x+5,y:w.player.y};
 assert.ok(castSession(s));assert.equal(w.druidAction.id,'spark');w.druidAction=null;w.castCooldown=0;
 assert.ok(activateSlot(s,3,{x:1,y:0}));assert.ok(w.dash.remaining>0);w.dash.remaining=0;
 assert.ok(stanceSession(s));assert.equal(w.druidForm,'wolf');assert.equal(activateSlot(s,0),false,'troca de forma leva 0,35 s');w.castCooldown=0;assert.ok(activateSlot(s,0));assert.equal(w.druidAction.id,'claws');
 transition(s,'training');assert.equal(s.world.druidForm,'human');assert.equal(s.world.player.model,'druid');
 assert.equal(WOLF_ACTIONS[3].id,'dodge');
});
