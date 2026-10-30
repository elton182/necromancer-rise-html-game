import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMap,blankMap,resolveMap,detach,dependents,toArena,analyze,createLibrary,builtinMap,TEMPLATES,PROPS,LIMITS,mapRef,reachable,canReach} from '../scripts/map-model.mjs';
import {overlaps,resolvePosition} from '../scripts/terrain.mjs';

const memory=()=>{const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),data};};
const make=(extra={})=>normalizeMap({id:'a',name:'Teste',objects:[],...extra}).map;

test('normaliza valores inválidos sem lançar erro', () => {
 assert.equal(normalizeMap(null).map,null);
 assert.equal(normalizeMap([]).map,null);
 const {map,problems}=normalizeMap({name:'<b>x</b>'.repeat(30),biome:'lua',size:{w:9999,h:-3},level:999,objects:[{type:'nada'},{type:'oak',x:'7',y:NaN,r:99,h:-1},{type:'wall',w:0,d:'x'}],spawns:[{x:1,y:2,count:500,type:99}]});
 assert.equal(map.biome,'forest');
 assert.deepEqual(map.size,{w:LIMITS.maxSize,h:LIMITS.minSize});
 assert.equal(map.level,LIMITS.maxLevel);
 assert.ok(map.name.length<=LIMITS.maxName&&!/[<>]/.test(map.name));
 assert.equal(map.objects.length,2);
 assert.equal(map.objects[0].x,7);assert.equal(map.objects[0].y,0);assert.equal(map.objects[0].r,12);assert.equal(map.objects[0].h,.1);
 assert.ok(map.objects[1].w>=.2&&map.objects[1].d>=.2);
 assert.equal(map.spawns[0].count,LIMITS.maxCount);assert.ok(map.spawns[0].type<=10);
 assert.ok(problems.some(p=>/desconhecido/.test(p)));
});

test('limita a quantidade de objetos e gera ids únicos', () => {
 const {map,problems}=normalizeMap({objects:Array.from({length:LIMITS.maxObjects+20},()=>({type:'rock',id:'x'}))});
 assert.equal(map.objects.length,LIMITS.maxObjects);
 assert.equal(new Set(map.objects.map(o=>o.id)).size,LIMITS.maxObjects);
 assert.ok(problems.some(p=>p.includes(String(LIMITS.maxObjects))));
});

test('arena: colisores, enfeites e limites centrados', () => {
 const map=make({size:{w:30,h:20},biome:'desert',objects:[
  {type:'wall',x:0,y:0,w:6,d:1,h:1},{type:'pillar',x:5,y:5,r:1},{type:'cactus',x:-5,y:2},{type:'bush',x:2,y:2},{type:'barrel',x:3,y:3},{type:'water',x:-8,y:-4,r:3}]});
 const arena=toArena(resolveMap(map).map);
 assert.deepEqual(arena.bounds,{minX:-15,maxX:15,minY:-10,maxY:10});
 assert.equal(arena.theme,'expedition');assert.ok(arena.palette.dark.ground);
 assert.equal(arena.solids.length,3);
 assert.deepEqual(arena.solids.find(s=>s.kind==='box'),{kind:'box',x:0,y:0,width:6,depth:1,height:1,tone:arena.solids.find(s=>s.kind==='box').tone});
 assert.equal(arena.solids.find(s=>s.look==='cactus').kind,'circle');
 assert.equal(arena.decor.bushes.length,1);assert.equal(arena.decor.misc.length,1);assert.equal(arena.decor.water.length,1);
 assert.ok(overlaps({x:0,y:0},.3,arena)&&!overlaps({x:0,y:6},.3,arena));
});

test('cobertura do chão é determinística e respeita colisores', () => {
 const map=make({biome:'forest',objects:[{type:'rock',x:0,y:0,r:3}]});
 const a=toArena(resolveMap(map).map),b=toArena(resolveMap(map).map);
 assert.deepEqual(a.decor,b.decor);assert.ok(a.decor.grass.length>20);
 assert.ok(a.decor.grass.every(g=>Math.hypot(g.x,g.y)>3));
 assert.equal(toArena(resolveMap(make({biome:'snow'})).map).decor.grass.length,0);
});

test('mapa base: herda, oculta objetos e substitui campos', () => {
 const base=make({id:'base',biome:'snow',size:{w:50,h:30},start:{x:1,y:2},spawns:[{id:'s1',x:0,y:-5,count:3,type:1}],objects:[{id:'p1',type:'pine',x:0,y:0},{id:'p2',type:'pine',x:4,y:4}]});
 const child=make({id:'child',base:mapRef('base'),hidden:['p1','fantasma'],objects:[{type:'rock',x:9,y:9}]});
 const lookup=id=>({base,child})[id]||null;
 const {map,warnings}=resolveMap(child,lookup);
 assert.deepEqual(warnings,[]);
 assert.equal(map.biome,'snow');assert.deepEqual(map.size,{w:50,h:30});assert.deepEqual(map.start,{x:1,y:2});assert.equal(map.spawns[0].count,3);
 assert.deepEqual(map.objects.map(o=>o.type+':'+o.inherited),['pine:true','rock:false']);
 assert.equal(map.objects[0].id,'p2');
 const over=resolveMap({...child,biome:'grave',spawns:[]},lookup).map;
 assert.equal(over.biome,'grave');assert.deepEqual(over.spawns,[]);
 // Alterar a base reflete no filho.
 const changed={...base,objects:[...base.objects,{id:'p3',type:'oak',x:-3,y:-3}]};
 assert.equal(resolveMap(child,id=>({base:changed,child})[id]).map.objects.length,3);
});

test('base em cadeia, ausente e circular', () => {
 const a=make({id:'a',objects:[{id:'x',type:'rock'}]}),b=make({id:'b',base:'map:a',objects:[{id:'y',type:'oak'}]}),c=make({id:'c',base:'map:b',objects:[{id:'z',type:'pine'}]});
 const lookup=id=>({a,b,c})[id]||null;
 assert.deepEqual(resolveMap(c,lookup).map.objects.map(o=>o.id),['x','y','z']);
 assert.deepEqual(resolveMap(c,lookup).chain,['map:a','map:b','map:c']);
 const orphan=resolveMap(make({id:'o',base:'map:nada'}),lookup);
 assert.equal(orphan.map.hasBase,false);assert.ok(orphan.warnings[0].includes('não existe'));
 const loopA=make({id:'a',base:'map:b'}),loopB=make({id:'b',base:'map:a'});
 const loop=resolveMap(loopA,id=>({a:loopA,b:loopB})[id]);
 assert.ok(loop.warnings.some(w=>w.includes('circular')));
});

test('mapas embutidos servem de base', () => {
 const forest=builtinMap('builtin:forest'),training=builtinMap('builtin:training');
 assert.ok(forest.objects.length>30);assert.ok(forest.objects.every(o=>PROPS[o.type]));
 assert.equal(training.objects.length,4);
 const child=make({base:'builtin:training',objects:[{type:'rock',x:3,y:3}]});
 const flat=resolveMap(child).map;
 assert.equal(flat.objects.length,5);assert.equal(flat.biome,'grave');assert.deepEqual(flat.size,{w:30,h:30});
 assert.equal(normalizeMap({base:'builtin:desconhecida'}).map.base,null);
 const arena=toArena(flat);assert.equal(arena.solids.length,5);
});

test('desvincular copia a base para o próprio mapa', () => {
 const base=make({id:'base',biome:'snow',objects:[{id:'p1',type:'pine'}]}),child=make({id:'c',base:'map:base',hidden:[],objects:[{type:'rock'}]});
 const solo=detach(child,id=>({base})[id]);
 assert.equal(solo.base,null);assert.equal(solo.objects.length,2);assert.equal(solo.biome,'snow');
 const {map}=normalizeMap(solo);assert.equal(map.objects.length,2);assert.equal(map.biome,'snow');
});

test('gera avisos úteis', () => {
 const open=make({objects:[],spawns:[]});
 assert.ok(analyze(open).some(w=>w.level==='info'));
 const outside=make({start:{x:99,y:0},spawns:[{x:0,y:0}]});
 assert.ok(analyze(outside).some(w=>w.level==='erro'&&/fora/.test(w.text)));
 // Muro fechando uma sala isola o ponto de inimigos.
 const walls=[{type:'wall',x:0,y:-5,w:10,d:.8},{type:'wall',x:0,y:5,w:10,d:.8},{type:'wall',x:-5,y:0,w:.8,d:10},{type:'wall',x:5,y:0,w:.8,d:10}];
 const sealed=make({start:{x:15,y:15},spawns:[{x:0,y:0,count:2,type:0}],objects:walls});
 assert.ok(analyze(sealed).some(w=>/isolados/.test(w.text)));
 const reachableMap=make({start:{x:15,y:15},spawns:[{x:-15,y:-15,count:2,type:0}],objects:walls});
 assert.ok(!analyze(reachableMap).some(w=>/isolados/.test(w.text)));
 // Início encaixotado.
 const trapped=make({start:{x:0,y:0},spawns:[{x:15,y:15}],objects:[{type:'pillar',x:0,y:0,r:3}]});
 assert.ok(analyze(trapped).some(w=>w.level==='erro'&&/preso/.test(w.text)));
 const r=reachable(toArena(resolveMap(reachableMap).map),{x:15,y:15});assert.ok(canReach(r,{x:-15,y:-15}));assert.ok(!canReach(r,{x:0,y:0}),'o centro da sala fechada não é alcançável');
});

test('modelos iniciais geram mapas válidos e jogáveis', () => {
 for(const t of TEMPLATES){
  const map=t.make(),flat=resolveMap(map).map,arena=toArena(flat);
  assert.ok(flat.objects.length>=0&&map.name);
  const start=resolvePosition(flat.start,.45,arena);assert.ok(!overlaps(start,.45,arena),t.name);
  assert.ok(!analyze(map).some(w=>w.level==='erro'),t.name);
 }
});

test('biblioteca: salvar, listar, duplicar e excluir', () => {
 const store=memory(),lib=createLibrary(store);
 assert.deepEqual(lib.list(),[]);
 const saved=lib.save(make({id:'a',name:'Primeiro'}),1000);assert.equal(saved.ok,true);assert.equal(saved.map.updated,1000);
 assert.equal(lib.get('a').name,'Primeiro');
 lib.save({...lib.get('a'),name:'Renomeado'},2000);assert.equal(lib.list().length,1);assert.equal(lib.get('a').name,'Renomeado');
 const copy=lib.duplicate('a');assert.equal(copy.ok,true);assert.notEqual(copy.map.id,'a');assert.equal(lib.list().length,2);
 assert.equal(lib.remove(copy.map.id).ok,true);assert.equal(lib.list().length,1);
 assert.equal(createLibrary(store).list().length,1,'persistido no armazenamento');
});

test('biblioteca: variação cria herança viva e protege contra exclusão e ciclo', () => {
 const lib=createLibrary(memory());
 lib.save(make({id:'a',name:'Base',objects:[{id:'r',type:'rock'}]}));
 const v=lib.variant('a');assert.equal(v.ok,true);assert.equal(v.map.base,'map:a');
 assert.deepEqual(dependents('a',lib.list()),[v.map.id]);
 const blocked=lib.remove('a');assert.equal(blocked.ok,false);assert.ok(blocked.message.includes('usam este como base'));
 // A base não pode apontar para o filho.
 const cycle=lib.save({...lib.get('a'),base:'map:'+v.map.id});assert.equal(cycle.ok,false);
 assert.equal(lib.save({...lib.get('a'),base:'map:a'}).ok,false);
 const fv=lib.variant('builtin:forest');assert.equal(fv.map.base,'builtin:forest');
 assert.equal(lib.get(v.map.id).hidden.length,0);
});

test('exportar e importar levam a cadeia de bases e evitam colisão de ids', () => {
 const source=createLibrary(memory());
 source.save(make({id:'a',name:'Base'}));source.save(make({id:'b',name:'Filho',base:'map:a'}));source.save(make({id:'z',name:'Outro'}));
 const json=source.exportJson('b'),data=JSON.parse(json);
 assert.deepEqual(data.maps.map(m=>m.id),['a','b']);
 const target=createLibrary(memory());target.save(make({id:'a',name:'Já existente'}));
 const result=target.importJson(json);assert.equal(result.ok,true);assert.equal(target.list().length,3);
 const child=target.list().find(m=>m.name==='Filho');
 assert.notEqual(child.base,'map:a');assert.equal(target.get(child.base.slice(4)).name,'Base');
 assert.equal(target.get('a').name,'Já existente');
 // Mapa solto também é aceito.
 assert.equal(createLibrary(memory()).importJson(JSON.stringify(make({id:'solo'}))).ok,true);
});

test('importação rejeita lixo e armazenamento com falha não lança', () => {
 const lib=createLibrary(memory());
 for(const bad of ['','{','[]','null','{"maps":[]}','{"maps":[1,2]}'])assert.equal(lib.importJson(bad).ok,false,bad);
 const broken=createLibrary({getItem(){throw Error('bloqueado');},setItem(){throw Error('bloqueado');}});
 assert.deepEqual(broken.list(),[]);assert.equal(broken.save(make()).ok,false);
 const corrupt=memory();corrupt.setItem('necromancer_v2_maps','{lixo');
 const lib2=createLibrary(corrupt);assert.equal(lib2.status(),'invalid');assert.equal(lib2.save(make()).ok,false);
 assert.equal(corrupt.getItem('necromancer_v2_maps'),'{lixo','a biblioteca corrompida não é sobrescrita');
});

test('limites da biblioteca', () => {
 const lib=createLibrary(memory());
 for(let i=0;i<LIMITS.maxMaps;i++)assert.equal(lib.save(make({id:'m'+i})).ok,true);
 assert.equal(lib.save(make({id:'extra'})).ok,false);
 assert.equal(lib.save(make({id:'m0',name:'Atualizado'})).ok,true);
});
