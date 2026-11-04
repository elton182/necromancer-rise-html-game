import test from 'node:test';
import assert from 'node:assert/strict';
import {rayPick,pickBoxes,objectBounds,handlesFor,applyHandle} from '../scripts/map-handles.mjs';
import {normalizeObject,normalizeMap,toArena,PROPS} from '../scripts/map-model.mjs';

// Raio vindo de cima na direção do ponto, como a câmera do editor.
const down=(x,y)=>({ox:x+10,oy:20,oz:y+10,dx:-10/Math.hypot(10,20,10),dy:-20/Math.hypot(10,20,10),dz:-10/Math.hypot(10,20,10)});
const obj=raw=>normalizeObject(raw,new Set());
const flat=(objects,extra={})=>({objects,spawns:[],start:{x:50,y:50},...extra});

test('o raio seleciona a peça certa, inclusive pelo alto, e marca o que é herdado',()=>{
 const wall=obj({id:'muro',type:'wall',x:0,y:0,w:6,d:.6,h:3}),rock=obj({id:'pedra',type:'rock',x:20,y:0});
 assert.deepEqual(rayPick(down(0,0),flat([wall,rock])),{kind:'object',id:'muro'});
 assert.deepEqual(rayPick(down(20,0),flat([wall,{...rock,inherited:true}])),{kind:'base',id:'pedra'});
 assert.equal(rayPick(down(40,40),flat([wall,rock])),null);
 // Topo do muro: o raio entra na caixa antes de chegar ao chão atrás dele.
 const top={ox:12,oy:22,oz:10,dx:-10/Math.hypot(10,20,10),dy:-20/Math.hypot(10,20,10),dz:-10/Math.hypot(10,20,10)};
 assert.deepEqual(rayPick(top,flat([wall])),{kind:'object',id:'muro'},'a peça é alcançada onde é desenhada');
});
test('marcadores vencem peças, e peças vencem manchas planas de chão',()=>{
 const path=obj({id:'trilha',type:'path',x:0,y:0,r:4}),rock=obj({id:'pedra',type:'rock',x:0,y:0});
 assert.deepEqual(rayPick(down(0,0),flat([path])),{kind:'object',id:'trilha'},'a trilha só é pega quando não há nada em cima');
 assert.deepEqual(rayPick(down(0,0),flat([path,rock])),{kind:'object',id:'pedra'});
 assert.deepEqual(rayPick(down(50,50),flat([path])),{kind:'start'});
 assert.deepEqual(rayPick(down(0,0),flat([rock],{spawns:[{id:'g',x:0,y:0}]})).kind,'spawn');
});
test('o relevo sobe as caixas de seleção; o que flutua fica na água',()=>{
 const rock=obj({id:'p',type:'rock',x:0,y:0,h:1}),lily=obj({id:'l',type:'lily',x:0,y:0});
 assert.equal(pickBoxes(rock,PROPS.rock,3)[0].y0,3);assert.equal(pickBoxes(lily,PROPS.lily,-1)[0].y0,0);
 const tree=obj({id:'c',type:'oak',x:0,y:0,h:6}),all=objectBounds(tree);assert.ok(all.x1>tree.r,'o contorno envolve a copa');assert.equal(pickBoxes(tree).length,2);
});
test('alças de lado movem um lado e deixam o oposto parado',()=>{
 const wall=obj({id:'m',type:'wall',x:0,y:0,w:4,d:1,h:2}),ids=handlesFor(wall).map(h=>h.id);
 assert.deepEqual(ids,['e','w','s','n','h','rot']);
 const east=applyHandle(wall,'e',{x:5,y:0});assert.equal(east.w,7);assert.equal(east.x-east.w/2,-2,'o lado oeste não saiu do lugar');
 const west=applyHandle(wall,'w',{x:-5,y:0});assert.equal(west.w,7);assert.equal(west.x+west.w/2,2);
 const south=applyHandle(wall,'s',{x:0,y:3});assert.equal(south.d,3.5);assert.equal(south.y-south.d/2,-.5);
 const north=applyHandle(wall,'n',{x:0,y:-3});assert.equal(north.d,3.5);assert.equal(north.y+north.d/2,.5);
 const crossed=applyHandle(wall,'e',{x:-50,y:0});assert.ok(crossed.w>.19,'não vira do avesso');assert.ok(Math.abs(crossed.x-crossed.w/2+2)<1e-9);
 assert.equal(applyHandle(wall,'e',{x:5.3,y:0},{snap:.5}).w,7.5,'respeita a grade');
});
test('alças de raio, altura, escala e giro',()=>{
 const rock=obj({id:'p',type:'rock',x:2,y:2,r:1,h:1}),tent=obj({id:'t',type:'tent',x:0,y:0}),fern=obj({id:'f',type:'fern',x:0,y:0});
 assert.equal(applyHandle(rock,'r',{x:5,y:2}).r,3);assert.equal(applyHandle(rock,'h',{x:0,y:0},{lift:2}).h,3);assert.ok(applyHandle(rock,'h',{x:0,y:0},{lift:-9}).h>0);
 assert.ok(handlesFor(rock).some(h=>h.id==='rot'),'toda peça gira, inclusive fora do catálogo');
 assert.ok(!handlesFor(obj({id:'t',type:'path',x:0,y:0,r:2})).some(h=>h.id==='rot'),'mancha plana de chão não gira');
 assert.ok(handlesFor(tent).some(h=>h.id==='rot'));assert.ok(handlesFor(fern).some(h=>h.id==='scale'));
 assert.ok(handlesFor(obj({id:'b',type:'palisade',x:0,y:0})).some(h=>h.id==='rot'),'peça retangular gira livre');
 assert.equal(applyHandle(fern,'scale',{x:1.2,y:0}).s,2);
 assert.equal(applyHandle(tent,'rot',{x:1,y:-1}).rot,45);assert.notEqual(applyHandle(tent,'rot',{x:1,y:-1.2},{}).rot%15,0,'o giro é livre');assert.equal(applyHandle(tent,'rot',{x:1,y:-1.2},{steps:true}).rot%15,0,'Shift dá passos de 15°');
 const rotated={...tent,rot:90},knob=handlesFor(rotated).find(h=>h.id==='rot');assert.ok(Math.abs(knob.x)<1e-9);assert.ok(knob.y<0,'a alça acompanha o giro');
 assert.equal(applyHandle(rotated,'rot',{x:knob.x,y:knob.y}).rot,90,'agarrar sem mover não muda o giro');
 // Toda alça gera uma peça que o normalizador aceita e que vira arena.
 for(const type of Object.keys(PROPS)){
  const o=obj({id:'x',type,x:0,y:0});
  for(const h of handlesFor(o)){const next=normalizeObject(applyHandle(o,h.id,{x:3,y:2},{lift:1}),new Set());assert.ok(next,type+'/'+h.id);toArena(normalizeMap({id:'a',name:'A',objects:[next]}).map,{cover:false});}
 }
});
test('peça girada: alças no referencial dela, com o lado oposto parado',()=>{
 const wall=obj({id:'m',type:'wall',x:10,y:10,w:4,d:1,h:2,rot:30}),a=30*Math.PI/180,east=handlesFor(wall).find(h=>h.id==='e');
 assert.ok(Math.abs(east.x-(10+2*Math.cos(a)))<1e-9);assert.ok(Math.abs(east.y-(10-2*Math.sin(a)))<1e-9,'o lado leste gira junto');
 // Agarrar e soltar sem mover não muda nada.
 const same=applyHandle(wall,'e',{x:east.x,y:east.y});assert.ok(Math.abs(same.w-4)<1e-9);assert.ok(Math.abs(same.x-10)<1e-9);assert.ok(Math.abs(same.y-10)<1e-9);
 // Puxar 3 u ao longo do comprimento: cresce 3, e a outra ponta fica onde estava.
 const far={x:east.x+3*Math.cos(a),y:east.y-3*Math.sin(a)},long=applyHandle(wall,'e',far);assert.ok(Math.abs(long.w-7)<1e-9);
 const west=handlesFor(wall).find(h=>h.id==='w'),westAfter=handlesFor(normalizeObject(long,new Set())).find(h=>h.id==='w');assert.ok(Math.hypot(west.x-westAfter.x,west.y-westAfter.y)<.08,'o lado oposto ficou parado');
 // Puxar na perpendicular não muda o comprimento.
 const side=applyHandle(wall,'e',{x:east.x+Math.sin(a)*3,y:east.y+Math.cos(a)*3});assert.ok(Math.abs(side.w-4)<1e-9);
 // A seleção por raio segue a caixa girada.
 const longWall=obj({id:'g',type:'wall',x:0,y:0,w:12,d:.6,h:2,rot:45}),tip={x:4,y:-4};
 assert.deepEqual(rayPick(down(tip.x,tip.y),flat([longWall])),{kind:'object',id:'g'},'a ponta da diagonal é da peça');
 assert.equal(rayPick(down(4,4),flat([longWall])),null,'a outra diagonal não é');
 const box=objectBounds(longWall);assert.ok(Math.abs(box.angle-45*Math.PI/180)<1e-9,'o contorno gira junto');
});
test('arena para o editor: sem cobertura, com tom estável e terreno reaproveitado',()=>{
 const map=normalizeMap({id:'m',name:'M',size:{w:40,h:40},biome:'forest',objects:[{id:'a',type:'rock',x:1,y:1},{id:'b',type:'rock',x:5,y:5}]}).map;
 assert.ok(toArena(map).decor.grass.length>0);assert.equal(toArena(map,{cover:false}).decor.grass.length,0);
 const both=toArena(map,{cover:false,stableTone:true}),only=toArena({...map,objects:[map.objects[1]]},{cover:false,stableTone:true});
 assert.equal(both.solids[1].tone,only.solids[0].tone,'tirar uma peça não muda a cor das outras');
 assert.deepEqual(toArena(map).solids,toArena(map).solids,'o jogo continua determinístico');
});

test('trilha de cantos retos: retângulo que estica e gira, sem colisão',()=>{
 const p=obj({id:'t',type:'path_square',x:0,y:0,w:8,d:3,rot:30});assert.equal(p.rot,30,'o giro fica salvo');
 const arena=toArena(normalizeMap({id:'a',name:'A',size:{w:40,h:40},objects:[p]}).map);
 assert.equal(arena.solids.length,0,'é chão: não colide');assert.equal(arena.decor.pathBoxes.length,1);assert.equal(arena.decor.path.length,0);assert.equal(arena.rotatedParts.length,0,'gira no próprio desenho');assert.ok(Math.abs(arena.decor.pathBoxes[0].angle-Math.PI/6)<1e-9);
 assert.deepEqual(handlesFor(p).map(h=>h.id),['e','w','s','n','rot'],'estica pelos quatro lados e gira; não tem altura');
 assert.deepEqual(rayPick(down(0,0),flat([p])),{kind:'object',id:'t'});
 assert.deepEqual(rayPick(down(0,0),flat([p,obj({id:'r',type:'rock',x:0,y:0})])),{kind:'object',id:'r'},'peça em cima vem antes do chão');
 assert.ok(!handlesFor(obj({id:'o',type:'path',x:0,y:0,r:2})).some(h=>h.id==='rot'),'a trilha redonda segue sem giro');
 const covered=toArena(normalizeMap({id:'a',name:'A',size:{w:24,h:24},biome:'forest',objects:[{id:'c',type:'path_square',x:0,y:0,w:24,d:24}]}).map);assert.equal(covered.decor.grass.length,0,'grama não nasce sobre a trilha');
});
