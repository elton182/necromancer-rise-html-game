import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toArena,normalizeMap,reachable,canReach} from '../scripts/map-model.mjs';
import {groundAt,terrainSpeed,blankTerrain} from '../scripts/map-terrain.mjs';
import {SOLID_INDEX,nearbySolids,TRAINING_ARENA,overlaps,resolvePosition,moveCircle,lineClear,findPath,navigate} from '../scripts/terrain.mjs';
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

// Muro em diagonal: de (-7,-7) a (7,7) no referencial do mapa, com 1 u de espessura. No mapa, y cresce para o sul; o giro segue rotation.y.
const diagonal=(extra={})=>({id:'arena',bounds:{minX:-20,maxX:20,minY:-20,maxY:20},solids:[{kind:'box',x:0,y:0,width:20,depth:1,height:2,angle:-Math.PI/4,...extra}]});
test('caixa girada: colisão acompanha a diagonal',()=>{
 const a=diagonal();
 assert.equal(overlaps({x:5,y:5},.45,a),true,'em cima da diagonal');assert.equal(overlaps({x:5,y:-5},.45,a),false,'fora dela, onde a caixa alinhada bloquearia ao redor');
 const stopped=moveCircle({x:-3,y:3},{x:6,y:-6},.45,a,{slide:false});assert.equal(stopped.blocked,true);assert.ok(stopped.x-stopped.y<0,'não atravessa: segue do mesmo lado');
 const slid=moveCircle({x:-2,y:2},{x:3,y:-1},.45,a);assert.ok(slid.x-slid.y<0,'não atravessa ao deslizar');assert.ok(slid.x>0,'desliza ao longo da parede, além do ponto onde parou de encostar: '+slid.x);
 const out=resolvePosition({x:3,y:3},.45,a);assert.equal(overlaps(out,.45,a),false,'quem nasce dentro é empurrado para fora');
 assert.equal(lineClear({x:-3,y:3},{x:3,y:-3},.05,a),false,'a linha de visão é barrada pela parede');assert.equal(lineClear({x:-3,y:3},{x:-9,y:3},.05,a),true);
});
test('caixa girada: busca de caminho contorna e sabe quando não há saída',()=>{
 const a=diagonal({width:16});
 const path=findPath({x:-3,y:3},{x:3,y:-3},.45,a);assert.ok(path.length>0,'dá a volta pela ponta');
 let p={x:-3,y:3};for(const q of path){assert.equal(lineClear(p,q,.45,a),true,'cada trecho livre');p=q;}
 const closed={id:'c',bounds:{minX:-10,maxX:10,minY:-10,maxY:10},solids:[{kind:'box',x:0,y:0,width:40,depth:1,height:2,angle:-Math.PI/4}]};
 assert.equal(findPath({x:-3,y:3},{x:3,y:-3},.45,closed).length,0,'diagonal de canto a canto separa o mapa');
});
test('a arena aplica o giro de cada peça, e a peça alinhada não muda',()=>{
 const map=(rot)=>normalizeMap({id:'m',name:'M',size:{w:60,h:60},start:{x:-10,y:10},objects:[{id:'w',type:'wall',x:0,y:0,w:20,d:1,h:2,rot},{id:'p',type:'palisade',x:15,y:15,w:4,d:.5,h:2.4,rot},{id:'c',type:'cryptwall',x:-15,y:15,w:4,d:.7,h:8,rot},{id:'o',type:'oak',x:15,y:-15,rot}]}).map;
 const flat=toArena(map(0)),turned=toArena(map(45));
 assert.ok(flat.solids.every(s=>s.angle===undefined),'sem giro, nenhum campo novo');assert.equal(flat.rotatedParts.length,0);
 const [wall,palisade,crypt,oak]=turned.solids;
 assert.ok(Math.abs(wall.angle-Math.PI/4)<1e-9);assert.ok(Math.abs(palisade.angle-Math.PI/4)<1e-9);assert.ok(Math.abs(crypt.angle-Math.PI/4)<1e-9);assert.equal(oak.angle,undefined,'círculo não precisa');
 assert.equal(wall.look,undefined,'muro liso gira no próprio desenho');assert.equal(crypt.look,'rotated-part','peça com desenho próprio é desenhada à parte');assert.equal(palisade.look,'kit-prop');
 assert.deepEqual(turned.rotatedParts.map(p=>p.arena.solids[0].look).sort(),['cryptwall','oak']);assert.ok(turned.rotatedParts.every(p=>p.arena.solids[0].angle===undefined),'a parte é montada alinhada e girada depois');
 const p=turned.kitProps[0];assert.ok(Math.abs(p.ry-Math.PI/4)<1e-9,'o modelo gira como o colisor');
 // Mesma convenção no desenho e na colisão: a ponta local +x da caixa fica em (cos, -sen).
 const tip={x:9*Math.cos(Math.PI/4),y:-9*Math.sin(Math.PI/4)};assert.equal(overlaps(tip,.1,{bounds:turned.bounds,solids:[wall]}),true);assert.equal(overlaps({x:-tip.x*-1,y:-tip.y},.1,{bounds:turned.bounds,solids:[wall]}),false);
 const r=reachable(turned,{x:-10,y:10});assert.equal(canReach(r,{x:-10,y:-10}),true);
 assert.equal(toArena(normalizeMap({id:'m',name:'M',objects:[{id:'t',type:'path',x:0,y:0,rot:45}]}).map).decor.path.length,1,'mancha de chão ignora giro');
 assert.equal(normalizeMap(JSON.parse(JSON.stringify(map(30)))).map.objects[0].rot,30,'o giro fica salvo');assert.equal(normalizeMap({id:'m',name:'M',objects:[{type:'wall',x:0,y:0,rot:-90}]}).map.objects[0].rot,270);
});
test('ponte girada abre passagem e dá altura em diagonal',()=>{
 const terrain=blankTerrain({w:60,h:60});terrain.rivers=[{id:'r',points:[[-40,-40],[40,40]],width:8,depth:1.6}];
 const map=(objects)=>normalizeMap({id:'b',name:'B',size:{w:60,h:60},biome:'forest',start:{x:-20,y:20},objects,terrain}).map,closed=toArena(map([]));
 const from={x:-10,y:10},to={x:10,y:-10},onDeck={x:0,y:0};
 assert.equal(findPath(from,to,.45,closed).length,0,'sem ponte, o rio separa as margens');
 const bridged=toArena(map([{id:'p',type:'bridge',x:0,y:0,w:16,d:3.2,rot:45}]));
 assert.ok(findPath(from,to,.45,bridged).length>0,'a ponte girada liga as margens');assert.ok(groundAt(bridged,onDeck.x,onDeck.y)>.4,'o tabuleiro sobe no meio');assert.equal(terrainSpeed(bridged,onDeck.x,onDeck.y,1,0),1,'sem atraso na ponte');
 assert.equal(overlaps({x:6,y:6},.45,bridged),true,'fora do tabuleiro continua fundo');
});

// Arena sorteada, com círculos, caixas e caixas giradas, para comparar o índice com a varredura direta.
function crowded(n,span=170,seed=7){
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;},solids=[];
 for(let i=0;i<n;i++){const x=(random()-.5)*2*span,y=(random()-.5)*2*span,k=i%3;solids.push(k===0?{kind:'circle',x,y,r:.3+random()*2,height:1}:{kind:'box',x,y,width:.5+random()*6,depth:.5+random()*6,height:1,...(k===2?{angle:random()*6}:{})});}
 return {id:'c',bounds:{minX:-180,maxX:180,minY:-180,maxY:180},solids,random};
}
test('índice de colisores: mesmas respostas da varredura direta',()=>{
 const a=crowded(1500),random=a.random,linear={...a,solids:a.solids},from=SOLID_INDEX.from;
 try{
  for(let i=0;i<4000;i++){
   const p={x:(random()-.5)*340,y:(random()-.5)*340},d={x:(random()-.5)*(i%5?2:30),y:(random()-.5)*(i%5?2:30)},r=i%7?.45:.05;
   SOLID_INDEX.from=48;const fast={over:overlaps(p,r,a),move:moveCircle(p,d,r,a),clear:lineClear(p,{x:p.x+d.x,y:p.y+d.y},r,a),fixed:resolvePosition(p,r,a)};
   SOLID_INDEX.from=Infinity;const slow={over:overlaps(p,r,linear),move:moveCircle(p,d,r,linear),clear:lineClear(p,{x:p.x+d.x,y:p.y+d.y},r,linear),fixed:resolvePosition(p,r,linear)};
   assert.equal(fast.over,slow.over,'colide '+i);assert.equal(fast.clear,slow.clear,'linha '+i);assert.equal(fast.move.blocked,slow.move.blocked,'bloqueio '+i);
   assert.ok(Math.hypot(fast.move.x-slow.move.x,fast.move.y-slow.move.y)<1e-6,'movimento '+i);assert.equal(overlaps(fast.fixed,r,a),overlaps(slow.fixed,r,a),'empurrão '+i);
  }
 }finally{SOLID_INDEX.from=from;}
});
test('índice de colisores: consulta traz poucos, em ordem, e acompanha a troca de colisores',()=>{
 const a=crowded(2000),near=nearbySolids(a,-1,-1,1,1);
 assert.ok(near.length<40,'só os próximos: '+near.length);let last=-1;for(const s of near){const i=a.solids.indexOf(s);assert.ok(i>last,'na ordem original');last=i;}
 // Peça longa e peça girada entram em todas as células que alcançam.
 const long={kind:'box',x:0,y:0,width:100,depth:1,height:1},turned={kind:'box',x:60,y:60,width:40,depth:1,height:1,angle:Math.PI/4},b={bounds:a.bounds,solids:[...a.solids.slice(0,100),long,turned]};
 assert.ok(nearbySolids(b,45,-.2,45.1,.2).includes(long));assert.ok(overlaps({x:60+14,y:60-14},.2,b),'ponta da peça girada');
 // Portas trocam o vetor; acrescentar colisor no mesmo vetor também é percebido.
 const swapped={...b,solids:b.solids.filter(s=>s!==long)};assert.ok(!nearbySolids(swapped,45,-.2,45.1,.2).includes(long));
 const extra={kind:'circle',x:30,y:30,r:1,height:1};b.solids.push(extra);assert.ok(nearbySolids(b,30,30,30.1,30.1).includes(extra));
 assert.equal(nearbySolids({solids:a.solids.slice(0,10)},0,0,1,1).length,10,'vetor pequeno segue direto');
});
