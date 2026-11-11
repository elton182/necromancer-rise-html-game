import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../scripts/training-model.mjs';
import {dealDamage,beginDash} from '../scripts/combat.mjs';
import {MARKSMAN_ACTIONS,actionDamage,rainRadius,marksmanRanks} from '../scripts/marksman-model.mjs';
import {marksmanAction,tickMarksman,clearMarksman,falconCommand,marksmanCooldown} from '../scripts/marksman.mjs';

const defs=MARKSMAN_ACTIONS.archer,def=id=>defs.find(d=>d.id===id);
function field(ranks={}){
 const w=createWorld({horde:0,character:{classId:'archer',level:30,equipment:{},marksmanRanks:{}}});
 w.marksmanRanks={shot:1,pierce:1,fan:1,leap:1,ambush:1,falcon:1,impactoCeleste:1,rain:1,saraivadaSeguidora:1,...ranks};
 Object.assign(w.player,{x:0,y:0,mp:1000,maxMp:1000,damage:100});w.actors=[w.player];w.aim={x:8,y:0};w.random=()=>.5;
 w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};tick(w,.01);w.falcon.next=Infinity;return w;
}
function target(w,x,y=0){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:100000,maxHp:100000,animation:'idle'};w.actors.push(e);return e;}
function tick(w,seconds,dt=1/120){for(let t=0;t<seconds-1e-9;t+=dt){const step=Math.min(dt,seconds-t);w.time+=step;tickMarksman(w,step);}}
const use=(w,id)=>marksmanAction(w,defs.indexOf(def(id)));
const lost=e=>e.maxHp-e.hp;

test('Marca: todo dano ganha 20% uma vez, troca de presa, expiração e limpeza',()=>{
 const w=field({marcaDoCacador:1}),a=target(w,6),b=target(w,6,3);
 assert.ok(falconCommand(w,a));assert.equal(a.hunterMarkBonus,.2);
 assert.equal(dealDamage(w,a,100,w.player,'Flecha').applied,120);
 assert.equal(dealDamage(w,a,100,{team:'ally'},'Aliado').applied,120);
 assert.equal(dealDamage(w,a,100,w.player,'Queimadura').applied,120);
 w.falconReady=0;assert.ok(falconCommand(w,b));assert.equal(a.hunterMark,0);assert.ok(b.hunterMark>w.time);
 assert.equal(dealDamage(w,a,100,w.player).applied,100);
 w.time=b.hunterMark+.01;assert.equal(dealDamage(w,b,100,w.player).applied,100);
 w.falconReady=0;falconCommand(w,b);clearMarksman(w);assert.equal(b.hunterMark,0);assert.equal(w.falcon,null);
});

test('Marca: falcão prioriza a presa visível, paredes impedem comando sem gastar',()=>{
 const w=field({marcaDoCacador:1}),near=target(w,2),prey=target(w,7);
 falconCommand(w,prey);tick(w,.7);w.falcon.state='orbit';w.falcon.next=0;tick(w,.01);
 assert.equal(w.falcon.target,prey);assert.equal(lost(near),0);
 w.falconReady=0;
 w.arena.solids=[{kind:'box',x:3.5,y:0,width:1,depth:10}];const mp=w.player.mp;
 assert.equal(falconCommand(w,prey),false);assert.equal(w.player.mp,mp);
});

test('Disparo Preciso: preparação, alcance longo, colisão e cancelamento',()=>{
 const w=field({disparoPreciso:1}),e=target(w,22);w.aim=e;assert.ok(use(w,'disparoPreciso'));
 tick(w,1.1);assert.equal(lost(e),0);assert.ok(w.effects.some(e=>e.fx==='dangerLine'));
 tick(w,.6);assert.equal(lost(e),actionDamage(def('disparoPreciso'),100,w.marksmanRanks));assert.ok(marksmanCooldown(w,'disparoPreciso')>18);
 const v=field({disparoPreciso:1}),out=target(v,27);v.aim=out;use(v,'disparoPreciso');tick(v,2);assert.equal(lost(out),0);
 const c=field({disparoPreciso:1}),safe=target(c,12);use(c,'disparoPreciso');tick(c,.4);assert.ok(beginDash(c,{x:0,y:1}));tick(c,2);assert.equal(lost(safe),0);
 const blocked=field({disparoPreciso:1}),cover=target(blocked,12);blocked.arena.solids=[{kind:'box',x:5,y:0,width:1,depth:8}];use(blocked,'disparoPreciso');tick(blocked,2);assert.equal(lost(cover),0);
});

test('Saraivada Múltipla: 25 flechas, cinco em cada presa, sem concentrar num chefe',()=>{
 for(const count of [1,3,5]){
  const w=field({saraivadaMultipla:1}),es=Array.from({length:count},(_,i)=>target(w,8,(i-(count-1)/2)*1.5));
  assert.ok(use(w,'saraivadaMultipla'));tick(w,1.8);
  const damage=actionDamage(def('saraivadaMultipla'),100,w.marksmanRanks);
  assert.deepEqual(es.map(lost),es.map(()=>damage*5));assert.ok(marksmanCooldown(w,'saraivadaSeguidora')>0);
 }
});

test('Saraivada Múltipla: alvos mortos não concentram sequências nos já escolhidos',()=>{
 const w=field({saraivadaMultipla:1}),a=target(w,8,-1),b=target(w,8,1);use(w,'saraivadaMultipla');a.hp=0;a.dead=true;
 tick(w,2);assert.equal(lost(b),5*actionDamage(def('saraivadaMultipla'),100,w.marksmanRanks));
});

test('Rasantes: seis impactos, prioridade da marca, ocupação e passos de tempo grandes',()=>{
 for(const dt of [1/120,.5]){
  const w=field({rasanteRelampago:1,marcaDoCacador:1}),a=target(w,8),b=target(w,8,2);a.hunterMark=w.time+8;a.hunterMarkBonus=.2;
  assert.ok(use(w,'rasanteRelampago'));tick(w,.5,dt);assert.equal(w.falcon.state,'rush');
  const mp=w.player.mp;assert.equal(falconCommand(w,a),false);assert.equal(use(w,'impactoCeleste'),false);assert.equal(w.player.mp,mp);
  tick(w,1.5,dt);assert.equal(lost(a),6*Math.floor(actionDamage(def('rasanteRelampago'),100,w.marksmanRanks)*1.2));assert.equal(lost(b),0);assert.notEqual(w.falcon.state,'rush');
 }
});

test('Rasantes distribuem impactos e morte remove a sequência',()=>{
 const w=field({rasanteRelampago:1}),es=[target(w,7,-2),target(w,8),target(w,7,2)];use(w,'rasanteRelampago');tick(w,1.9);
 assert.ok(es.every(e=>lost(e)>0));assert.equal(es.reduce((s,e)=>s+lost(e),0),6*actionDamage(def('rasanteRelampago'),100,w.marksmanRanks));
 w.marksmanCooldowns={};use(w,'rasanteRelampago');tick(w,.4);w.player.hp=0;tick(w,.1);assert.equal(w.falcon,null);assert.equal(w.marksmanShots.length,0);
});

test('Rasantes não acertam presas além de paredes; morte encerra Marca imediatamente',()=>{
 const w=field({rasanteRelampago:1,marcaDoCacador:1}),e=target(w,8);w.arena.solids=[{kind:'box',x:5,y:0,width:1,depth:20}];
 assert.ok(use(w,'rasanteRelampago'));tick(w,2);assert.equal(lost(e),0);
 e.hunterMark=w.time+8;e.hunterMarkBonus=.2;dealDamage(w,w.player,w.player.hp+100,{team:'enemy',level:30});assert.equal(e.hunterMark,0);
});

test('Chuva cresce por ponto; variante deixa um único campo e compartilha recarga',()=>{
 assert.equal(rainRadius(def('rain'),{rain:1}),3);assert.equal(rainRadius(def('rain'),{rain:5}),4.2);
 const w=field({rain:5,fechadefogo:1,flechaExplosiva:1,chuvaDeFlechasExplosivas:1}),e=target(w,8,4.4);
 use(w,'chuvaDeFlechasExplosivas');tick(w,.5);assert.equal(w.marksmanZones[0].radius,4.8);
 tick(w,1.8);assert.ok(lost(e)>0);assert.equal(w.marksmanZones.filter(z=>z.kind==='fire').length,1);assert.ok(marksmanCooldown(w,'rain')>0);
 tick(w,5);assert.equal(w.marksmanZones.length,0);
});

test('Emboscada em Dupla chama só um Impacto; Impacto Feroz libera 18 penas',()=>{
 const w=field({emboscadaEmDupla:1,impactoFeroz:1,penasVoadoras:1});w.marksmanFeathersReady=Infinity;
 target(w,8,-1);target(w,8,1);w.marksmanAmbush=w.time+3;assert.ok(use(w,'fan'));tick(w,.7);
 assert.equal(w.marksmanZones.filter(z=>z.kind==='strike').length,1);assert.equal(w.marksmanDoubleAmbush,false);
 tick(w,1.1);assert.equal(w.marksmanZones.filter(z=>z.kind==='strike').length,0);
 assert.ok(w.marksmanShots.some(s=>s.def.id==='penasVoadoras'&&!s.def.homing));
 assert.equal(w.marksmanZones.filter(z=>z.kind==='featherBurst').length,1);tick(w,.5);assert.equal(w.marksmanZones.filter(z=>z.kind==='featherBurst').length,0);
});

test('novos nós são normalizados e preservados com seus pré-requisitos',()=>{
 const r={shot:1,pierce:1,disparoPreciso:3,falcon:1,marcaDoCacador:1,rasanteRelampago:2,fan:1,saraivadaSeguidora:1,saraivadaMultipla:1};
 const normalized=marksmanRanks('archer',r,30);for(const [id,rank] of Object.entries(r))assert.equal(normalized[id],rank,id);
});
