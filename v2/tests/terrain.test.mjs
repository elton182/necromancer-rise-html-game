import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRAINING_ARENA,overlaps,resolvePosition,moveCircle,lineClear,findPath,navigate} from '../scripts/terrain.mjs';
import {createWorld,step} from '../scripts/training-model.mjs';
import {sampleGamepad,stick} from '../scripts/gamepad.mjs';
const arena={bounds:{minX:-15,maxX:15,minY:-15,maxY:15},solids:[{kind:'box',x:0,y:0,width:.1,depth:6,height:100}]};
test('varredura impede atravessar parede fina em deslocamento longo e preserva raio no limite',()=>{
 const q=moveCircle({x:-8,y:0},{x:1000,y:0},.45,arena);assert.ok(q.blocked);assert.ok(q.x<=-.5);assert.ok(!overlaps(q,.45,arena));
 const b=moveCircle({x:-3,y:10},{x:1000,y:1000},.45,arena);assert.ok(b.x<=14.55&&b.y<=14.55);assert.ok(!overlaps(b,.45,arena));
});
test('desliza junto da parede, permite afastar e respeita quinas arredondadas pelo raio',()=>{
 const p=moveCircle({x:-2,y:0},{x:4,y:2},.45,arena);assert.ok(p.x<=-.5);assert.ok(p.y>1.9);const away=moveCircle(p,{x:-2,y:0},.45,arena);assert.ok(away.x<p.x-1.9);
 const q=moveCircle({x:-1,y:3.8},{x:2,y:0},.45,arena);assert.ok(q.x>.9);assert.ok(!overlaps(q,.45,arena));
});
test('resolve centros exatos e sobreposição inicial sem NaN; evita círculo em alta velocidade',()=>{
 const circle={...arena,solids:[{kind:'circle',x:0,y:0,r:.8}]};for(const a of [arena,circle]){const q=resolvePosition({x:0,y:0},.45,a);assert.ok(Number.isFinite(q.x+q.y));assert.ok(!overlaps(q,.45,a));}
 const q=moveCircle({x:-9,y:0},{x:20,y:0},.45,circle);assert.ok(q.x<=-1.25);assert.ok(!overlaps(q,.45,circle));
});
test('trajetos são contínuos e navegação contorna obstáculo sem cortar diagonal',()=>{
 const start={x:-4,y:0},goal={x:4,y:0},path=findPath(start,goal,.45,arena);assert.ok(path.length>1);assert.equal(lineClear(start,goal,.45,arena),false);let p=start;for(const q of path){assert.ok(lineClear(p,q,.45,arena));p=q;}assert.deepEqual(p,goal);
});
test('movimentos variados não penetram sólidos ou limites da cena compartilhada',()=>{
 let p={x:0,y:4},seed=42;const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 for(let i=0;i<400;i++){p=moveCircle(p,{x:(rnd()-.5)*14,y:(rnd()-.5)*14},.45,TRAINING_ARENA);assert.ok(!overlaps(p,.45,TRAINING_ARENA),'Passo '+i);}
 assert.throws(()=>moveCircle(p,{x:NaN,y:0},.45,arena));
});
test('atores nascem fora dos sólidos e caminhada bloqueada usa descanso',()=>{
 const w=createWorld({horde:64});assert.ok(w.actors.every(a=>!overlaps(a,a.radius,w.arena)));w.actors=[w.player];w.arena=arena;w.player.x=-.500001;w.player.y=0;
 const before=w.player.walkDistance;for(let i=0;i<20;i++)step(w,1/60,{x:1,y:1});assert.equal(w.player.animation,'idle');assert.ok(w.player.walkDistance-before<.0001);assert.ok(!overlaps(w.player,w.player.radius,arena));
});
test('IA usa rota para chegar ao outro lado da parede sem teleporte ou penetração',()=>{
 const w=createWorld({horde:0});const a=w.actors.find(a=>a.model==='zombie');w.actors=[w.player,a];w.arena=arena;w.player.x=4;w.player.y=0;a.x=-4;a.y=0;
 for(let i=0;i<1200&&a.x<1;i++){const p={x:a.x,y:a.y};step(w,1/60);assert.ok(!overlaps(a,a.radius,arena));assert.ok(Math.hypot(a.x-p.x,a.y-p.y)<=1.35/60+.001);}assert.ok(a.x>1);
});
test('pose do boss acompanha preparação e impacto sem antecipar o dano',()=>{
 const w=createWorld({horde:0});w.actors=[w.player,w.boss];w.boss.x=0;w.boss.y=2;Object.assign(w.boss,{kingGap:0,kingCd:{slash:0,leap:99,summon:99}});
 for(let i=0;i<49;i++)step(w,1/60);assert.equal(w.player.hp,100);assert.equal(w.boss.pose.anim,'attack');assert.ok(w.boss.pose.progress<4/13);
 for(let i=0;i<6;i++)step(w,1/60);assert.equal(w.player.hp,71);assert.ok(w.boss.pose.progress>=4/13);
});
test('gamepad ignora drift, normaliza diagonais, lê botões e suporta desconexão',()=>{
 assert.deepEqual(stick(.1,-.1),{x:0,y:0});const d=stick(1,1);assert.ok(Math.abs(Math.hypot(d.x,d.y)-1)<1e-9);
 const buttons=Array.from({length:16},()=>({pressed:false,value:0}));buttons[7].value=.8;buttons[9].pressed=true;buttons[0].pressed=true;const p=sampleGamepad({axes:[1,0,0,-1],buttons,connected:true});assert.equal(p.move.x,1);assert.equal(p.aim.y,-1);assert.ok(p.fire&&p.pause&&p.confirm);assert.equal(sampleGamepad({connected:false}).fire,false);
 const a=createWorld({horde:0}),b=createWorld({horde:0});a.actors=[a.player];b.actors=[b.player];step(a,.1,{x:.5});step(b,.1,{x:1});assert.ok(Math.abs(a.player.x*2-b.player.x)<1e-9);
});
// Alvo cercado por colisores (como um início fechado por pinheiros no editor de mapas): sem caminho, e sem custo a cada quadro.
const sealed=(()=>{const solids=[];for(let a=0;a<24;a++){const t=a/24*Math.PI*2;solids.push({kind:'circle',x:Math.cos(t)*3,y:Math.sin(t)*3,r:.45,height:6});}
 return {id:'sealed',bounds:{minX:-20,maxX:20,minY:-20,maxY:20},solids};})();
test('alvo num bolsão fechado: não há caminho e a busca não roda de novo a cada quadro',()=>{
 assert.deepEqual(findPath({x:12,y:8},{x:0,y:0},.3,sealed),[]);
 const e={x:12,y:8,radius:.3},first=navigate(e,{x:0,y:0},3,1/60,sealed);assert.equal(first.distance,0);
 for(let i=0;i<200;i++)navigate(e,{x:0,y:0},3,1/60,sealed);
 // Cada busca regrava `navGoal`; em 200 quadros (3,3 s) só cabem as poucas tentativas espaçadas por 1,5 s ou mais.
 let searches=0,last=e.navGoal;for(let i=0;i<300;i++){navigate(e,{x:0,y:0},3,1/60,sealed);if(e.navGoal!==last){searches++;last=e.navGoal;}}
 assert.ok(searches<=4,'buscas em 5 s: '+searches);
});
test('colisores trocados (portas) invalidam o cache de regiões',()=>{
 const door={bounds:{minX:-10,maxX:10,minY:-10,maxY:10},solids:[{kind:'box',x:0,y:0,width:.6,depth:20.4,height:3}]};
 assert.deepEqual(findPath({x:-5,y:0},{x:5,y:0},.3,door),[]);
 // A porta abre: o mesmo `arena`, com um vetor novo de colisores (vão de 2 u no meio), volta a ter rota.
 door.solids=[{kind:'box',x:0,y:-5.5,width:.6,depth:9,height:3},{kind:'box',x:0,y:5.5,width:.6,depth:9,height:3}];assert.ok(findPath({x:-5,y:-4},{x:5,y:4},.3,door).length>0);
});
