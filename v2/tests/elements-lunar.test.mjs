import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,step} from '../scripts/training-model.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {tickElements,isFrozen,clearElements} from '../scripts/elements.mjs';
import {DRUID_NODES} from '../scripts/druid-model.mjs';
import {WOLF_ACTIONS,druidAction,tickDruid,toggleWolf,clearDruid} from '../scripts/druid.mjs';
const ranks=Object.fromEntries(Object.keys(DRUID_NODES).map(id=>[id,1]));
function field(){const w=createWorld({horde:0,character:{classId:'druid',level:60,druidRanks:ranks,equipment:{}}});w.actors=[w.player];w.player.x=0;w.player.y=0;w.player.mp=w.player.maxMp;w.aim={x:6,y:0};w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};return w;}
function target(w,x=2,extra={}){const e={id:w.nextId++,team:'enemy',dummy:true,x,y:0,radius:.3,hp:100000,maxHp:100000,animation:'idle',animationTime:0,timer:0,...extra};w.actors.push(e);return e;}
function advance(w,seconds){for(let left=seconds;left>1e-8;){const dt=Math.min(1/60,left);left-=dt;w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);tickDruid(w,dt);}}
function use(w,id){return druidAction(w,WOLF_ACTIONS.findIndex(a=>a.id===id));}
function wolf(w){assert.ok(toggleWolf(w));advance(w,.5);}

test('fogo acumula até cinco, queima sem recursão, expira e mantém a autoria',()=>{
 const w=field(),e=target(w);for(let i=0;i<8;i++)dealDamage(w,e,100,w.player,'Fogo','fire');
 assert.equal(e.fireStacks,5);const hp=e.hp;w.time=.5;tickElements(w,.5,dealDamage);assert.equal(hp-e.hp,20);assert.equal(e.fireStacks,5);
 const once=e.hp;tickElements(w,.5,dealDamage);assert.equal(e.hp,once,'tick comum idempotente');
 w.time=5;tickElements(w,4.5,dealDamage);assert.equal(e.fireStacks,0);assert.equal(hp-e.hp,160);
});
test('barreira e esquiva que absorvem todo dano não recebem acúmulo',()=>{
 const w=field(),enemy=target(w);w.player.barrier=1000;
 assert.equal(dealDamage(w,w.player,20,enemy,'Fogo','fire').applied,0);assert.equal(w.player.fireStacks,undefined);
 w.player.barrier=0;w.dash.remaining=.2;dealDamage(w,w.player,20,enemy,'Gelo','frost');assert.equal(w.player.frostStacks,undefined);
});
test('gelo congela em cinco cargas, chefes por menos tempo e imunidade impede travamento contínuo',()=>{
 const w=field(),e=target(w),boss=target(w,3,{isBoss:true});
 for(let i=0;i<5;i++){dealDamage(w,e,1,w.player,'Gelo','frost');dealDamage(w,boss,1,w.player,'Gelo','frost');}
 assert.ok(isFrozen(w,e));assert.ok(isFrozen(w,boss));assert.equal(e.freezeUntil-w.time,1.5);assert.equal(boss.freezeUntil-w.time,.5);
 const until=e.freezeUntil;for(let i=0;i<20;i++)dealDamage(w,e,1,w.player,'Gelo','frost');assert.equal(e.freezeUntil,until);
 clearElements(w);assert.equal(e.freezeUntil,undefined);assert.equal(e.frostStacks,undefined);
});
test('Corte Sangrento chega a 6 u, cura só pelo dano inicial aplicado e respeita o teto',()=>{
 const w=field();wolf(w);const e=target(w,5.8);w.player.hp=w.player.maxHp*.4;const hp=w.player.hp,before=e.hp;
 assert.ok(use(w,'corteSangrento'));advance(w,.25);const dealt=before-e.hp;
 assert.ok(dealt>0);assert.ok(Math.abs(w.player.hp-hp-Math.min(w.player.maxHp*.05,dealt*.12))<1e-6);
 assert.ok(w.effects.some(e=>e.fx==='wolfClaws'&&e.element==='blood'));const healed=w.player.hp;advance(w,1);assert.equal(w.player.hp,healed,'sangramento não rouba vida');
 w.aim={x:-6,y:0};assert.ok(use(w,'corteSangrento'));advance(w,.25);assert.equal(w.player.hp,healed,'errar não cura');
});
test('Garra de Gelo alcança 4,5 u e aplica a carga elemental',()=>{
 const w=field();wolf(w);const e=target(w,4.4);assert.ok(use(w,'garraDeGelo'));advance(w,.25);
 assert.ok(e.hp<e.maxHp);assert.equal(e.frostStacks,1);assert.ok(w.effects.some(e=>e.fx==='wolfClaws'&&e.element==='frost'));
});
test('Lua Prateada evoca um meteoro por golpe, inclusive cruzado, e expira/limpa',()=>{
 const w=field();wolf(w);const e=target(w);assert.ok(use(w,'luaPrateada'));advance(w,.65);const expiry=w.druidMoonUntil;assert.ok(expiry>w.time+29);
 for(const clip of ['claw_1','claw_2','claw_cross']){
  assert.ok(use(w,'claws'));assert.equal(w.druidAction.clip,clip);advance(w,.22);assert.equal(w.druidMoonMeteors.length,1);
  advance(w,.6);assert.equal(w.druidMoonMeteors.length,0);assert.ok(e.frostUntil>w.time);
 }
 w.time=expiry+.01;assert.ok(use(w,'claws'));advance(w,.25);assert.equal(w.druidMoonMeteors.length,0);
 w.druidMoonUntil=w.time+30;w.druidMoonMeteors=[{at:w.time+1}];clearDruid(w);assert.equal(w.druidMoonUntil,0);assert.deepEqual(w.druidMoonMeteors,[]);
});
test('congelamento impede movimento e lançamento da Druida no laço real',()=>{
 const w=field(),e=target(w);for(let i=0;i<5;i++)dealDamage(w,w.player,1,e,'Gelo','frost');
 const x=w.player.x,y=w.player.y;step(w,.1,{x:1,y:0});assert.equal(w.player.x,x);assert.equal(w.player.y,y);assert.equal(druidAction(w,0),false);
});
test('lobo ganha vida e regeneração, reduz dano e cura por Garras sem explorar a transformação',()=>{
 const w=field(),p=w.player,e=target(w);const humanMax=p.maxHp,humanRegen=p.hpRegen;p.hp=humanMax*.5;
 wolf(w);assert.equal(p.maxHp,Math.round(humanMax*1.4));assert.ok(p.hp/p.maxHp<=.5);assert.ok(p.hpRegen>=humanRegen+p.maxHp*.007-.0001);
 const before=p.hp;dealDamage(w,p,100,e);assert.ok(Math.abs(before-p.hp-60)<1e-6);
 const hurt=p.hp;step(w,.25,{});assert.ok(p.hp>hurt,'regenera em combate');
 const hp=p.hp;assert.ok(use(w,'claws'));advance(w,.25);assert.ok(Math.abs(p.hp-hp-p.maxHp*.012)<1e-6);
 advance(w,.3);const share=p.hp/p.maxHp;w.druidFormReady=0;assert.ok(toggleWolf(w));assert.equal(p.maxHp,humanMax);assert.ok(p.hp/p.maxHp<=share+.0001);
 const value=p.hp/p.maxHp;w.druidFormReady=0;w.castCooldown=0;assert.ok(toggleWolf(w));assert.ok(p.hp/p.maxHp<=value+.0001,'alternar não gera cura');
});
