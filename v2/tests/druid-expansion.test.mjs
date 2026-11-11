import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../scripts/training-model.mjs';
import {DRUID_NODES,DRUID_ADVANCED,DRUID_HUMAN_IDS,druidRanks} from '../scripts/druid-model.mjs';
import {druidAction,tickDruid,clearDruid,toggleWolf,HUMAN_ACTIONS} from '../scripts/druid.mjs';
import {tickCompanions} from '../scripts/companions.mjs';
import {dealDamage,beginDash} from '../scripts/combat.mjs';
import {freshSave,normalizeSave} from '../scripts/save-model.mjs';
import {schoolSynergy} from '../scripts/skill-synergy.mjs';
import {snapshotFor} from '../scripts/progression.mjs';
const index=id=>HUMAN_ACTIONS.findIndex(a=>a.id===id);
function ranks(value){const r={...value};function add(id){for(const p of DRUID_NODES[id].requires){r[p] ||=1;add(p);}}for(const id of Object.keys(r))add(id);return druidRanks(r,60);}
function field(value={}){
 const r=ranks(value),w=createWorld({horde:0,character:{classId:'druid',level:60,druidRanks:r,equipment:{}}});
 w.actors=[w.player];Object.assign(w.player,{x:0,y:0,hp:1000,maxHp:1000,mp:1000,maxMp:1000,spellDamage:100,defense:0});
 w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};w.aim={x:8,y:0};w.random=()=>.5;return w;
}
function tick(w,seconds,dt=1/60){for(let t=0;t<seconds-1e-9;t+=dt){const step=Math.min(dt,seconds-t);w.time+=step;w.castCooldown=Math.max(0,w.castCooldown-step);w.dash.remaining=Math.max(0,w.dash.remaining-step);tickDruid(w,step);tickCompanions(w,step);}}
const use=(w,id,aim=w.aim)=>druidAction(w,index(id),aim);
function target(w,x,y=0,extra={}){const e={id:w.nextId++,team:'enemy',dummy:true,labDummy:true,x,y,radius:.3,hp:100000,maxHp:100000,animation:'idle',...extra};w.actors.push(e);return e;}
const living=(w,type)=>w.actors.filter(a=>a.companion===type&&a.hp>0);
const lost=e=>e.maxHp-e.hp;

test('quatro ações entram ao final da barra e exigem seus nós',()=>{
 assert.deepEqual(DRUID_HUMAN_IDS,HUMAN_ACTIONS.map(a=>a.id));assert.deepEqual(DRUID_HUMAN_IDS.slice(-4),['calamidade','florestaTropical','escudoDeFolhas','liderDaMatilha']);
 const w=field(),mp=w.player.mp;for(const id of DRUID_HUMAN_IDS.slice(-4))assert.equal(use(w,id),false);assert.equal(w.player.mp,mp);
 assert.equal(druidRanks(ranks({calamidade:1}),12).calamidade,0);
});

test('Calamidade prepara, avança e aplica vento e raios em pulsos completos com diferentes passos',()=>{
 for(const dt of [1/60,.5]){
  const w=field({calamidade:1}),e=target(w,11,0,{isBoss:true}),out=target(w,11,10);
  assert.ok(use(w,'calamidade'));tick(w,.4,dt);assert.equal(w.druidTornados.length,0);
  tick(w,.6,dt);assert.ok(w.druidTornados[0].calamity);assert.equal(w.druidTornados[0].radius,4);
  tick(w,9,dt);const k=1+schoolSynergy('druid',w.druidRanks,'calamidade');
  assert.equal(lost(e),16*Math.floor(100*.3*k)+8*Math.floor(100*.65*k));assert.equal(lost(out),0);assert.equal(e.x,11);assert.equal(w.druidTornados.length,0);
 }
});

test('Calamidade não atravessa parede para causar dano e morte limpa antes dos pulsos',()=>{
 const w=field({calamidade:1}),hidden=target(w,8);w.aim={x:3,y:0};w.arena.solids=[{kind:'box',x:5,y:0,width:1,depth:50}];
 assert.ok(use(w,'calamidade'));tick(w,4);assert.equal(lost(hidden),0);
 const t=w.druidTornados[0];assert.ok(t.x<5);w.player.hp=0;tick(w,1);assert.equal(w.druidTornados.length,0);assert.equal(lost(hidden),0);
});

test('Floresta: cinco plantas animadas, limite separado das Raízes, substituição e expiração',()=>{
 const w=field({florestaTropical:1});assert.ok(use(w,'roots'));tick(w,.7);assert.equal(living(w,'carnivorousPlant').length,1);
 assert.ok(use(w,'florestaTropical'));tick(w,.9);assert.equal(living(w,'forestPlant').length,5);assert.equal(living(w,'carnivorousPlant').length,1);
 const plants=living(w,'forestPlant'),ids=plants.map(a=>a.id);assert.ok(plants.every(a=>a.model==='carnivorousPlant'&&a.maxHp===600&&a.until>w.time));
 for(let i=0;i<plants.length;i++)for(let j=i+1;j<plants.length;j++)assert.ok(Math.hypot(plants[i].x-plants[j].x,plants[i].y-plants[j].y)>1.2);
 w.druidCooldowns={};assert.ok(use(w,'florestaTropical'));tick(w,.9);assert.equal(living(w,'forestPlant').length,5);assert.ok(living(w,'forestPlant').every(a=>!ids.includes(a.id)));
 tick(w,11);assert.equal(living(w,'forestPlant').length,0);
});

test('Floresta bloqueada não gasta mana; plantas causam dano e podem ser destruídas',()=>{
 const w=field({florestaTropical:1});w.arena.solids=[{kind:'box',x:4,y:0,width:1,depth:50}];const mp=w.player.mp;
 assert.equal(use(w,'florestaTropical'),false);assert.equal(w.player.mp,mp);assert.equal(w.druidCooldowns.florestaTropical,undefined);
 w.arena.solids=[];use(w,'florestaTropical');tick(w,.9);const p=living(w,'forestPlant')[0],e=target(w,p.x+1,p.y);tick(w,2);assert.ok(lost(e)>0);
 dealDamage(w,p,p.hp+100,e);assert.equal(living(w,'forestPlant').length,4);
});

test('Escudo absorve dano depois das defesas; excedente atinge vida e não acumula',()=>{
 const w=field({escudoDeFolhas:1});use(w,'escudoDeFolhas');tick(w,.7);assert.equal(w.druidLeafShield.remaining,350);
 let hit=dealDamage(w,w.player,250,{team:'enemy',level:60});assert.equal(hit.absorbed,250);assert.equal(hit.applied,0);assert.equal(w.player.hp,1000);assert.equal(w.druidLeafShield.remaining,100);
 tick(w,.02);assert.ok(w.effects.find(e=>e.fx==='leafShield').strength<.3);
 hit=dealDamage(w,w.player,200,{team:'enemy',level:60});assert.equal(hit.absorbed,100);assert.equal(hit.applied,100);assert.equal(w.player.hp,900);assert.equal(w.druidLeafShield,null);
 w.druidCooldowns={};use(w,'escudoDeFolhas');tick(w,.7);w.druidCooldowns={};use(w,'escudoDeFolhas');tick(w,.7);assert.equal(w.druidLeafShield.remaining,350);
});

test('Escudo respeita barreira, esquiva, transformação, expiração e cura',()=>{
 const w=field({escudoDeFolhas:1,wolf:1});use(w,'escudoDeFolhas');tick(w,.7);w.player.barrier=50;
 const hit=dealDamage(w,w.player,100,{team:'enemy'});assert.equal(hit.absorbed,100);assert.equal(w.druidLeafShield.remaining,300);
 w.dash.remaining=.5;assert.ok(dealDamage(w,w.player,100,{team:'enemy'}).blocked);assert.equal(w.druidLeafShield.remaining,300);w.dash.remaining=0;
 w.player.hp=500;use(w,'rejuvenate');tick(w,.7);assert.ok(toggleWolf(w));tick(w,1);assert.ok(w.player.hp>500);assert.ok(w.druidLeafShield);
 tick(w,8);assert.equal(w.druidLeafShield,null);
});

test('Escudo consome somente o dano mitigado pela defesa; ficha mostra as novas regras',()=>{
 const w=field({escudoDeFolhas:1,florestaTropical:1,calamidade:1,liderDaMatilha:1}),control=field();w.player.defense=control.player.defense=100;
 const source={team:'enemy',level:60},mitigated=dealDamage(control,control.player,100,source).applied;
 use(w,'escudoDeFolhas');tick(w,.7);const hit=dealDamage(w,w.player,100,source);assert.equal(hit.absorbed,mitigated);assert.equal(w.druidLeafShield.remaining,350-mitigated);
 const sheet=snapshotFor(w,{},60);for(const id of DRUID_HUMAN_IDS.slice(-4))assert.ok(sheet.skills.find(s=>s.id===id).equipped);
 assert.equal(sheet.skills.find(s=>s.id==='escudoDeFolhas').damage,null);assert.match(sheet.skills.find(s=>s.id==='florestaTropical').note,/cinco plantas/);
});

test('Líder: um lobo maior com dano extra, sucessão preserva ferimentos e não ressuscita',()=>{
 const w=field({lobo:1,alcateia:3,liderDaMatilha:1});use(w,'lobo');tick(w,.9);const pack=living(w,'druidWolf');assert.equal(pack.length,4);
 const leader=pack.find(a=>a.packLeader),ordinary=pack.find(a=>!a.packLeader);assert.ok(leader.visualScale>1);assert.equal(leader.damage,Math.floor(100*.45*(1+schoolSynergy('druid',w.druidRanks,'lobo'))*1.3));
 ordinary.hp=Math.floor(ordinary.maxHp*.5);const before=ordinary.hp;dealDamage(w,leader,leader.hp+100,{team:'enemy'});tick(w,.1);
 assert.equal(living(w,'druidWolf').length,3);assert.equal(living(w,'druidWolf').filter(a=>a.packLeader).length,1);assert.ok(ordinary.packLeader);assert.equal(ordinary.hp,before);
});

test('Comando da matilha exige lobos e presa; concentra ataques e usa uma garra por caçada',()=>{
 const w=field({lobo:1,alcateia:3,liderDaMatilha:1}),mp=w.player.mp;assert.equal(use(w,'liderDaMatilha'),false);assert.equal(w.player.mp,mp);
 use(w,'lobo');tick(w,.9);const e=target(w,8),tags=[];w.onDummyHit=(t,amount,source,tag)=>tags.push(tag);
 assert.ok(use(w,'liderDaMatilha',e));tick(w,.7);assert.equal(w.druidHunt.target,e.id);tick(w,4);
 assert.ok(lost(e)>0);assert.equal(tags.filter(t=>t==='Garras do Líder').length,1);assert.ok(living(w,'druidWolf').every(a=>Math.hypot(a.x-e.x,a.y-e.y)<2.5));
 e.hp=0;e.dead=true;tick(w,.1);assert.equal(w.druidHunt,null);
});

test('Comando não atravessa paredes; esquiva cancela a preparação das novas ações',()=>{
 const w=field({liderDaMatilha:1,alcateia:3,lobo:1,calamidade:1});use(w,'lobo');tick(w,.9);const e=target(w,8);use(w,'liderDaMatilha',e);tick(w,.6);
 w.arena.solids=[{kind:'box',x:4,y:0,width:1,depth:50}];tick(w,4);assert.equal(lost(e),0);
 const v=field({calamidade:1});use(v,'calamidade');tick(v,.2);assert.ok(beginDash(v,{x:0,y:1}));tick(v,1);assert.equal(v.druidTornados.length,0);
});

test('save mantém pontos e barra, mas escudo, floresta, alvo e líder são transitórios',()=>{
 const value=freshSave();value.character.classId='druid';value.character.level=60;value.character.druidRanks=ranks({calamidade:1,florestaTropical:1,escudoDeFolhas:1,liderDaMatilha:1});
 value.character.skillLoadout=['spark','dodge','calamidade','florestaTropical','escudoDeFolhas','liderDaMatilha'];value.character.druidPack=[.5,0,1];
 const saved=normalizeSave(value);assert.deepEqual(saved.character.skillLoadout,value.character.skillLoadout);assert.deepEqual(saved.character.druidPack,[.5,0]);
 for(const id of DRUID_HUMAN_IDS.slice(-4))assert.equal(saved.character.druidRanks[id],1);
 const w=field(value.character.druidRanks);use(w,'escudoDeFolhas');tick(w,.7);use(w,'florestaTropical');tick(w,.9);clearDruid(w);
 assert.equal(w.druidLeafShield,null);assert.equal(w.druidHunt,null);assert.equal(living(w,'forestPlant').length,0);assert.ok(!w.effects.some(e=>e.druidRing));
});
