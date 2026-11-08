import {test} from 'node:test';
import assert from 'node:assert/strict';
import EQ from '../scripts/warrior-equipment.mjs';
import {freshSave,normalizeSave} from '../scripts/save-model.mjs';
import {createSession,equipSession,snapshot,stanceSession,tornadoVariantSession,activateSlot} from '../scripts/session.mjs';
import {createWorld} from '../scripts/training-model.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {canLearn,warriorLoadout,warriorRanks,warriorTornado,warriorSpent,STANCE_COOLDOWN} from '../scripts/warrior-model.mjs';
import {warriorAction,tickWarrior,toggleStance,stopWarriorChannel,WARRIOR_ACTIONS} from '../scripts/warrior.mjs';
let serial=0;
const item=type=>EQ.generate(10,null,()=>.2,type,false,'skills-test-'+(++serial));
function field(ranks={},extra={}){const w=createWorld({horde:0,character:{classId:'warrior',level:20,warriorRanks:ranks,equipment:{sword:item('sword'),shield:item('shield')},...extra}});w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.arena={bounds:{minX:-30,maxX:30,minY:-30,maxY:30},solids:[]};return w;}
function target(w,x,y=0,hp=10000){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp,maxHp:hp,animation:'idle',animationTime:0,timer:0};w.actors.push(e);return e;}
function advance(w,dt){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);tickWarrior(w,dt);}
function fly(w,seconds=4){for(let i=0;i<seconds*60;i++)advance(w,1/60);}
const SHIELD={bash:1,shieldThrow:1};

test('ricochete salta um alvo por ponto, com 20% menos dano e no máximo dois acertos por inimigo',()=>{
 const w=field({...SHIELD,ricochet:3}),a=target(w,3),b=target(w,3,3),c=target(w,6,3),d=target(w,9,3),out=target(w,9,3+7.5);
 assert.ok(warriorAction(w,5));advance(w,.2);const base=w.warriorShieldFlight.damage;
 fly(w);
 const lost=e=>10000-e.hp;
 assert.equal(w.warriorShieldFlight,null);assert.equal(w.actors.filter(e=>e.warriorProjectile).length,0);
 assert.ok(lost(a)>=base&&lost(a)<=2*base,'primeiro alvo');
 assert.ok(lost(b)>=Math.floor(base*.8));assert.ok(lost(c)>=Math.floor(base*.64));assert.ok(lost(d)>=Math.floor(base*.512));
 assert.ok(lost(a)<=2*base&&lost(b)<=2*base&&lost(c)<=2*base&&lost(d)<=2*base);
 assert.equal(out.hp,10000,'fora do alcance do salto');
});
test('ricochete sem ponto ou sem outro alvo funciona como o arremesso atual',()=>{
 for(const ranks of [SHIELD,{...SHIELD,ricochet:3}]){
  const w=field(ranks),e=target(w,3);assert.ok(warriorAction(w,5));fly(w);
  assert.equal(w.warriorShieldFlight,null);assert.equal(e.hp,10000-2*Math.floor(w.player.damage*1.2));
 }
 const plain=field(SHIELD),a=target(plain,3),b=target(plain,3,3);assert.ok(warriorAction(plain,5));fly(plain);assert.ok(a.hp<10000);assert.equal(b.hp,10000);
});
test('ricochete não salta através de paredes e mantém o escudo fora da mão durante a cadeia',()=>{
 const w=field({...SHIELD,ricochet:3}),a=target(w,3),hidden=target(w,3,3);w.arena.solids=[{kind:'box',x:3,y:1.6,width:4,depth:.6}];
 assert.ok(warriorAction(w,5));fly(w);assert.ok(a.hp<10000);assert.equal(hidden.hp,10000);
 const v=field({...SHIELD,ricochet:3}),m=target(v,3),n=target(v,3,4),o=target(v,6,4);v.random=()=>0;assert.ok(warriorAction(v,5));
 let inChain=false;for(let i=0;i<240&&!inChain;i++){advance(v,1/60);inChain=v.warriorShieldFlight?.chained;}assert.ok(inChain);
 const hp=v.player.hp;assert.ok(dealDamage(v,v.player,10,m).applied>0,'sem bloqueio em voo');assert.ok(v.player.hp<hp);fly(v);assert.equal(v.warriorShieldFlight,null);assert.ok(n.hp<10000);assert.ok(o.hp<10000);
});
test('cadeia longa volta ao jogador sem sumir no ar',()=>{
 const w=field({...SHIELD,ricochet:3}),list=[target(w,3),target(w,3,5),target(w,3,10),target(w,3,15)];assert.ok(warriorAction(w,5));advance(w,.2);w.player.x=-8;
 let peak=0,last=null;for(let i=0;i<600&&(w.warriorShieldFlight||i<20);i++){advance(w,1/60);if(w.warriorShieldFlight){peak=Math.max(peak,w.warriorShieldFlight.time);last={x:w.warriorShieldFlight.actor.x,y:w.warriorShieldFlight.actor.y};}}
 assert.ok(list.every(e=>e.hp<10000));assert.equal(w.warriorShieldFlight,null);assert.ok(Math.hypot(last.x-w.player.x,last.y-w.player.y)<1,'retorno completo');assert.ok(peak>2,'voo além dos 2 s antigos');
});
test('Ciclone e Turbilhão mudam alcance, ritmo, gasto e movimento; só a escolhida vale',()=>{
 const ranks={thrust:1,tornado:1,tornadoCyclone:1,tornadoWhirl:1};
 assert.equal(warriorTornado('cyclone',{tornado:1}).id,'base');assert.equal(warriorTornado('nada',ranks).id,'base');assert.equal(warriorTornado('constructor',ranks).id,'base');
 const base=field({thrust:1,tornado:1}),far=target(base,3.5);assert.ok(warriorAction(base,4));for(let i=0;i<60;i++)advance(base,1/60);assert.equal(far.hp,10000);assert.equal(base.warriorAction.tornado.move,.55);
 const cyclone=field(ranks,{warriorTornadoVariant:'cyclone'}),near=target(cyclone,3.5);assert.ok(warriorAction(cyclone,4));for(let i=0;i<60;i++)advance(cyclone,1/60);assert.ok(near.hp<10000);assert.equal(cyclone.warriorAction.tornado.move,.4);
 const hits=variant=>{const w=field(ranks,{warriorTornadoVariant:variant}),e=target(w,1);w.player.mp=500;w.player.maxMp=500;const start=w.player.mp;warriorAction(w,4);const paid=start-w.player.mp;const n=Math.floor(w.player.damage*.65);for(let i=0;i<60;i++)advance(w,1/60);return {hits:Math.round((10000-e.hp)/n),spent:start-w.player.mp-paid};};
 const slow=hits('base'),fast=hits('whirl');assert.equal(slow.hits,3);assert.equal(fast.hits,5);assert.ok(Math.abs(slow.spent-12)<.01);assert.ok(Math.abs(fast.spent-16)<.01);
});
test('variante só troca fora de combate, exige o nó e persiste; variante sem nó volta à base',()=>{
 const save=freshSave();Object.assign(save.character,{classId:'warrior',level:20,warriorRanks:{thrust:1,tornado:1,tornadoCyclone:1}});
 const s=createSession(save);s.scene='training';s.world.paused=false;
 assert.equal(tornadoVariantSession(s,'whirl').ok,false);
 s.world.actors=[s.world.player];target(s.world,s.world.player.x+3,s.world.player.y);assert.match(tornadoVariantSession(s,'cyclone').message,/Afaste-se/);
 s.world.actors=[s.world.player];assert.ok(tornadoVariantSession(s,'cyclone').ok);
 assert.equal(normalizeSave(snapshot(s)).character.warriorTornadoVariant,'cyclone');
 const lost=freshSave();Object.assign(lost.character,{classId:'warrior',level:20,warriorRanks:{thrust:1,tornado:1},warriorTornadoVariant:'cyclone'});assert.equal(normalizeSave(lost).character.warriorTornadoVariant,'base');
});
test('postura ofensiva e defensiva alteram dano, dano recebido e bloqueio; só uma fica ativa',()=>{
 const none=field(),e0=target(none,2);warriorAction(none,0);advance(none,.5);const plain=10000-e0.hp;
 const off=field({stance:1},{warriorStance:'offensive'}),e1=target(off,2);warriorAction(off,0);advance(off,.5);assert.equal(10000-e1.hp,Math.floor(off.player.damage*1.2*.55));assert.equal(plain,Math.floor(none.player.damage*.55));
 const def=field({stance:1}),e2=target(def,2);warriorAction(def,0);advance(def,.5);assert.equal(10000-e2.hp,Math.floor(def.player.damage*.85*.55));
 const taken=world=>{const a=target(world,1);world.random=()=>.99;const before=world.player.hp;world.player.defense=0;dealDamage(world,world.player,20,a);return before-world.player.hp;};
 assert.ok(Math.abs(taken(field())-20)<1e-6);assert.ok(Math.abs(taken(field({stance:1},{warriorStance:'offensive'}))-23)<1e-6);assert.ok(Math.abs(taken(field({stance:1}))-17)<1e-6);
 const chance=(world,base,roll)=>{world.player.blockChance=base;world.random=()=>roll;return dealDamage(world,world.player,5,target(world,1)).blocked;};
 assert.equal(chance(field({stance:1},{warriorStance:'offensive'}),15,.1),false);assert.equal(chance(field({stance:1}),15,.2),true);assert.equal(chance(field({stance:1}),70,.76),false,'teto de 75%');
});
test('ofensiva devolve vigor por acerto de corte; defensiva recupera mais e cura ao bloquear',()=>{
 const off=field({stance:1},{warriorStance:'offensive'});target(off,2);target(off,2,.5);off.player.mp=10;warriorAction(off,0);advance(off,.5);assert.equal(off.player.mp,14);
 const def=field({stance:1});def.player.hp=50;def.player.blockChance=75;def.random=()=>0;const r=dealDamage(def,def.player,99,target(def,1));assert.equal(r.blocked,true);assert.ok(Math.abs(def.player.hp-(50+def.player.maxHp*.02))<1e-6);
 const flying=field({...SHIELD,stance:1});flying.random=()=>0;flying.player.blockChance=75;warriorAction(flying,5);advance(flying,.2);flying.player.hp=50;assert.ok(dealDamage(flying,flying.player,10,target(flying,5,5)).applied>0,'sem bloqueio nem cura com o escudo em voo');assert.ok(flying.player.hp<50);
});
test('troca de postura é instantânea, tem recarga, não interrompe golpes e persiste',()=>{
 assert.equal(toggleStance(field()),false,'sem o nó');
 const w=field({stance:1},{warriorStance:'offensive'});warriorAction(w,0);const action=w.warriorAction;assert.ok(toggleStance(w));assert.equal(w.warriorAction,action);assert.equal(w.warriorStance,'defensive');
 assert.equal(toggleStance(w),false);advance(w,STANCE_COOLDOWN-.1);assert.equal(toggleStance(w),false);advance(w,.11);assert.ok(toggleStance(w));assert.equal(w.warriorStance,'offensive');
 w.paused=true;w.warriorStanceReady=0;assert.equal(toggleStance(w),false);
 const save=freshSave();Object.assign(save.character,{classId:'warrior',level:20,warriorRanks:{stance:1}});assert.equal(normalizeSave(save).character.warriorStance,'defensive');
 const s=createSession(save);s.scene='training';s.world.paused=false;assert.ok(stanceSession(s));assert.equal(normalizeSave(snapshot(s)).character.warriorStance,'offensive');assert.equal(createSession(snapshot(s)).world.warriorStance,'offensive');
});
test('Brado desacelera inimigos no raio, dobra o vigor por 6 s e respeita paredes',()=>{
 assert.equal(warriorAction(field(),6),false);
 const w=field({warCry:1}),near=target(w,4),far=target(w,7),hidden=target(w,0,4);w.arena.solids=[{kind:'box',x:0,y:2,width:2,depth:.5}];const mp=w.player.mp;
 assert.ok(warriorAction(w,6));assert.equal(w.player.mp,mp);advance(w,.1);assert.equal(near.slowTime||0,0);advance(w,.15);
 assert.equal(near.slow,.3);assert.equal(near.slowTime,4);assert.equal(far.slowTime||0,0);assert.equal(hidden.slowTime||0,0);assert.ok(w.warriorRally.until>w.time);
 advance(w,.3);assert.equal(warriorAction(w,6),false,'recarga');assert.ok(Math.abs(w.warriorCooldowns[6]-18)<1e-6);
});
test('Onda de Aço atravessa inimigos uma vez por alvo, alcança 7 u e para em paredes',()=>{
 assert.equal(warriorAction(field(),7),false);
 const w=field({slash:1,steelWave:1}),a=target(w,3),b=target(w,6.5),out=target(w,9),side=target(w,4,1.5);const mp=w.player.mp;
 assert.ok(warriorAction(w,7));assert.equal(w.player.mp,mp-25);fly(w,1);
 const hit=10000-Math.floor(w.player.damage*1.8);assert.equal(a.hp,hit);assert.equal(b.hp,hit);assert.equal(out.hp,10000);assert.equal(side.hp,10000);assert.deepEqual(w.warriorWaves,[]);
 const v=field({slash:1,steelWave:1}),behind=target(v,5);v.arena.solids=[{kind:'box',x:3,y:0,width:1,depth:8}];warriorAction(v,7);fly(v,1);assert.equal(behind.hp,10000);assert.deepEqual(v.warriorWaves,[]);
 const dead=field({slash:1,steelWave:1});warriorAction(dead,7);advance(dead,.3);assert.equal(dead.warriorWaves.length,1);dead.player.hp=0;advance(dead,.1);assert.deepEqual(dead.warriorWaves,[]);
});
test('barra aceita oito ações, mantém Cortes e Esquiva e preserva saves antigos',()=>{
 assert.deepEqual(warriorLoadout(undefined),[0,1,2,3,4,5]);assert.deepEqual(warriorLoadout([4,1,2,3,0,5]),[4,1,2,3,0,5]);assert.deepEqual(warriorLoadout([0,1,2,3,6,7]),[0,1,2,3,6,7]);
 assert.deepEqual(warriorLoadout([1,2,3,4,5,6]),[0,1,2,3,4,5],'sem Cortes');assert.deepEqual(warriorLoadout([0,1,2,4,5,6]),[0,1,2,3,4,5],'sem Esquiva');assert.deepEqual(warriorLoadout([0,1,2,3,4,8]),[0,1,2,3,4,5],'ação inexistente');
 const save=freshSave();Object.assign(save.character,{classId:'warrior',level:20,warriorRanks:{slash:1,steelWave:1,warCry:1,thrust:1}});const s=createSession(save);s.scene='training';s.world.paused=false;s.world.aim={x:8,y:0};
 assert.equal(equipSession(s,0,7).ok,false,'Cortes não saem da barra');assert.equal(equipSession(s,3,6).ok,false,'Esquiva não sai da barra');
 assert.ok(equipSession(s,4,7).ok);assert.ok(equipSession(s,5,6).ok);assert.deepEqual(s.world.warriorLoadout,[0,1,2,3,7,6]);
 assert.ok(equipSession(s,1,7).ok);assert.deepEqual(s.world.warriorLoadout,[0,7,2,3,1,6],'ação da barra troca de lugar');
 assert.equal(equipSession(s,2,8).ok,false);assert.ok(activateSlot(s,1));assert.equal(s.world.warriorAction.index,7);
 assert.deepEqual(createSession(snapshot(s)).world.warriorLoadout,[0,7,2,3,1,6]);
});
test('nós novos respeitam nível e pré-requisito sem alterar investimentos de saves antigos',()=>{
 assert.equal(canLearn({bash:1,shieldThrow:1},'ricochet',7),false);assert.ok(canLearn({bash:1,shieldThrow:1},'ricochet',8));assert.equal(canLearn({},'ricochet',8),false);
 assert.equal(canLearn({slash:1},'steelWave',9),false);assert.ok(canLearn({slash:1},'steelWave',10));
 assert.equal(canLearn({thrust:1,tornado:1},'tornadoCyclone',11),false);assert.ok(canLearn({thrust:1,tornado:1},'tornadoWhirl',12));
 assert.equal(canLearn({},'stance',9),false);assert.ok(canLearn({},'stance',10));assert.equal(canLearn({},'warCry',13),false);assert.ok(canLearn({},'warCry',14));
 const old={strength:5,vitality:5,armor:5,regeneration:5,shieldDefense:5,equipmentMastery:5,slash:5,thrust:3,tornado:1,bash:3,shieldThrow:1,riposte:3,momentum:3};
 const loaded=warriorRanks(old,17);assert.equal(warriorSpent(loaded),49);for(const [id,value] of Object.entries(old))assert.equal(loaded[id],value);
 for(const id of ['ricochet','steelWave','tornadoCyclone','tornadoWhirl','stance','warCry'])assert.equal(loaded[id],0);
 assert.equal(warriorRanks({warCry:1},13).warCry,0);
});
test('tornado continua encerrando com a variante escolhida',()=>{
 const w=field({thrust:1,tornado:1,tornadoWhirl:1},{warriorTornadoVariant:'whirl'});assert.ok(warriorAction(w,4));advance(w,.3);assert.ok(stopWarriorChannel(w));assert.equal(w.warriorAction,null);
 w.player.mp=5.1;advance(w,3.1);assert.ok(warriorAction(w,4));advance(w,.1);assert.equal(w.warriorAction,null);assert.equal(WARRIOR_ACTIONS[4].range,2.7);
});
