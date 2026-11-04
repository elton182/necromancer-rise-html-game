import test from 'node:test';
import assert from 'node:assert/strict';
import {bakeTerrain,flattenBake,fineWater,encodeGrid,decodeGrid,blankTerrain,openGrid,closeGrid,applyBrush,fitTerrain,normalizeTerrain,terrainSpeed,highGround,groundAt,heightAt,terrainStatus,TERRAIN_RULES} from '../scripts/map-terrain.mjs';
import {normalizeMap,normalizeSpawn,toArena,resolveMap,blankMap,createLibrary,builtinMap,analyze,PROPS,STYLE_PRESETS,normalizeStyle} from '../scripts/map-model.mjs';
import {overlaps,moveCircle,lineClear,findPath,resolvePosition,navigate} from '../scripts/terrain.mjs';
import {makeGroups,tickGroups,spawnTypes,spawnSlots} from '../scripts/map-spawns.mjs';
import {useCampaignMaps,campaignDocument,editedCampaignMap,campaignMapId,checkCampaignMap,CAMPAIGN_SLOTS,isRequiredSpawn} from '../scripts/campaign-maps.mjs';
import {prologueArena} from '../scripts/prologue-map.mjs';
import {createSession,transition} from '../scripts/session.mjs';
import {startCampaign} from '../scripts/campaign.mjs';
import {launchWorld,tickWorld} from '../scripts/campaign-world.mjs';
import {launchMap} from '../scripts/map-play.mjs';
import {dealDamage} from '../scripts/combat.mjs';

const memory=()=>{const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),data};};
const SIZE={w:60,h:60};
const withRiver=(depth,extra={})=>{const t=blankTerrain(SIZE);t.rivers=[{id:'r',points:[[0,-40],[0,40]],width:8,depth}];return normalizeMap({id:'t',name:'T',size:SIZE,biome:'forest',start:{x:-20,y:0},objects:[],terrain:t,...extra}).map;};
const hill=(height=3,radius=8)=>{const t=blankTerrain(SIZE),g=openGrid(t);applyBrush(g,'plateau',10,0,{radius,target:height});return closeGrid(g,[]);};

test('grades compactas voltam iguais e mapas antigos seguem sem relevo',()=>{
 const values=[0,0,0,.5,.5,-1.2,3,3,3,3];
 assert.deepEqual([...decodeGrid(encodeGrid(values,20),values.length,20)].map(v=>+v.toFixed(2)),values);
 const old=normalizeMap({id:'a',name:'A',objects:[{type:'rock',x:1,y:1}]}).map;
 assert.equal(old.terrain,null);assert.equal(old.style,null);const arena=toArena(old);assert.equal(arena.terrain,null);assert.equal(terrainSpeed(arena,1,1,1,0),1);assert.equal(groundAt(arena,1,1),0);
 assert.equal(normalizeTerrain({cell:2}),null,'grade incompleta é descartada');assert.equal(normalizeTerrain('x'),null);
 const body=JSON.parse(JSON.stringify(withRiver(1.2))),again=normalizeMap(body).map;assert.equal(again.terrain.rivers[0].width,8);assert.equal(again.terrain.h,body.terrain.h);
});
test('rio raso atrasa e pode ser atravessado; correnteza ajuda ou atrapalha',()=>{
 const arena=toArena(withRiver(.5));
 assert.equal(arena.terrain.blocks.length,0);assert.ok(heightAt(arena,0,0)<TERRAIN_RULES.wet);assert.equal(overlaps({x:0,y:0},.45,arena),false);
 const k=terrainSpeed(arena,0,0,1,0);assert.ok(Math.abs(k-TERRAIN_RULES.water)<1e-6,'atravessar a corrente paga só a água');
 assert.ok(terrainSpeed(arena,0,0,0,1)>k,'a favor da correnteza');assert.ok(terrainSpeed(arena,0,0,0,-1)<k,'contra a correnteza');
 assert.equal(terrainSpeed(arena,-20,0,1,0),1,'fora da água nada muda');
 assert.ok(findPath({x:-10,y:0},{x:10,y:0},.45,arena).length>0);assert.match(terrainStatus(arena,{x:0,y:0}),/Correnteza/);
});
test('rio fundo barra quem anda, deixa tiros passarem e a ponte abre a travessia',()=>{
 const deep=toArena(withRiver(1.6));
 assert.ok(deep.terrain.blocks.length>0);assert.ok(deep.solids.some(s=>s.terrainBlock));assert.equal(overlaps({x:0,y:0},.45,deep),true);
 assert.ok(moveCircle({x:-6,y:0},{x:12,y:0},.45,deep).x<0,'o personagem fica na margem');assert.equal(findPath({x:-10,y:0},{x:10,y:0},.45,deep).length,0);
 assert.equal(lineClear({x:-10,y:0},{x:10,y:0},.05,deep),true,'linha de visão atravessa');
 const shot=moveCircle({x:-6,y:0},{x:12,y:0},.1,deep,{slide:false});assert.equal(shot.blocked,false,'projétil cruza a água');
 const bridged=toArena(withRiver(1.6,{objects:[{type:'bridge',x:0,y:0,w:14,d:3.2}]}));
 assert.equal(overlaps({x:0,y:0},.45,bridged),false);assert.ok(findPath({x:-10,y:0},{x:10,y:0},.45,bridged).length>0,'a ponte liga as margens');
 assert.equal(overlaps({x:0,y:10},.45,bridged),true,'fora da ponte continua fundo');assert.equal(terrainSpeed(bridged,0,0,1,0),1);assert.ok(groundAt(bridged,0,0)>.4);
 assert.ok(analyze(withRiver(1.6,{spawns:[{x:20,y:0,count:1,type:0}]})).some(p=>/isolados/.test(p.text)),'a verificação avisa do rio intransponível');
});
test('platô tem borda intransitável, ladeira custa, e quem está no alto bate mais forte',()=>{
 const arena=toArena(normalizeMap({id:'h',name:'H',size:SIZE,biome:'forest',terrain:hill(),objects:[]}).map);
 assert.ok(arena.terrain.blocks.length>0,'a borda dura vira penhasco');assert.equal(overlaps({x:10,y:0},.45,arena),false,'o topo é caminhável');
 const top=heightAt(arena,10,0);assert.ok(top>=2.5);
 assert.ok(terrainStatus(arena,{x:10,y:0}).includes('Terreno alto'));
 assert.equal(highGround(arena,{x:10,y:0},{x:-20,y:0}),TERRAIN_RULES.highGroundBonus);assert.equal(highGround(arena,{x:-20,y:0},{x:10,y:0}),1,'só de cima para baixo');
 const t=blankTerrain(SIZE),g=openGrid(t);for(let i=0;i<6;i++)applyBrush(g,'raise',0,0,{radius:14,strength:.4});
 const slope=toArena(normalizeMap({id:'s',name:'S',size:SIZE,biome:'forest',terrain:closeGrid(g,[]),objects:[]}).map);
 assert.equal(slope.terrain.blocks.length,0,'encosta suave não bloqueia');assert.ok(terrainSpeed(slope,-6,0,1,0)<1,'subir custa');assert.ok(terrainSpeed(slope,6,0,1,0)>1,'descer rende');
 const victim={hp:100,team:'enemy',x:-20,y:0},source={x:10,y:0,team:'ally'},world={arena,player:{},dash:{remaining:0},combatEvents:[],curses:null,actors:[victim],damageNumbers:[],time:0,nextId:1};
 assert.equal(dealDamage(world,victim,10,source).applied,12,'+20% de cima para baixo no caminho comum de dano');
});
test('superfícies pintadas e redimensionar preservam a posição',()=>{
 const t=blankTerrain(SIZE),g=openGrid(t);applyBrush(g,'surface',5,5,{radius:4,surface:5});applyBrush(g,'lake',-15,-15,{radius:5,target:1.2});
 const doc=closeGrid(g,[]),arena=toArena(normalizeMap({id:'m',name:'M',size:SIZE,biome:'forest',terrain:doc,objects:[]}).map);
 assert.ok(Math.abs(terrainSpeed(arena,5,5)-.7)<1e-6,'lama');assert.ok(heightAt(arena,-15,-15)<TERRAIN_RULES.deep,'lago fundo');
 const grown=fitTerrain(doc,{w:120,h:120}),bigger=toArena(normalizeMap({id:'m2',name:'M',size:{w:120,h:120},biome:'forest',terrain:grown,objects:[]}).map);
 assert.ok(heightAt(bigger,-15,-15)<TERRAIN_RULES.deep);assert.ok(Math.abs(terrainSpeed(bigger,5,5)-.7)<1e-6);assert.equal(heightAt(bigger,50,50),0);
 const huge=fitTerrain(doc,{w:360,h:360});assert.ok(huge.cell>=2&&huge.cols*huge.rows<=TERRAIN_RULES.maxCells);
});
test('catálogo: toda peça vira colisor ou decoração, em qualquer tamanho',()=>{
 const types=Object.keys(PROPS);assert.ok(types.length>=70,'variedade de peças');
 for(const type of types){
  const def=PROPS[type],map=normalizeMap({id:'c',name:'C',objects:[{type,x:1,y:2}]}).map,arena=toArena(map);
  assert.equal(map.objects.length,1,type);
  if(def.solid)assert.ok(arena.solids.length===1,type+' deveria colidir');
  if(def.kit){assert.equal(arena.kitProps.length,1,type);const p=arena.kitProps[0];for(const k of ['sx','sy','sz'])assert.ok(p[k]>0,type+' '+k);}
 }
 const box=toArena(normalizeMap({id:'b',name:'B',objects:[{type:'palisade',x:0,y:0,w:.5,d:8,h:2.4}]}).map).kitProps[0];
 assert.ok(Math.abs(box.ry-Math.PI/2)<1e-6,'cerca desenhada na vertical gira');assert.ok(Math.abs(box.sx-2)<1e-6);
});
test('estilo por mapa: predefinições válidas, herança e cobertura do chão',()=>{
 for(const p of Object.values(STYLE_PRESETS)){const {name,...v}=p;assert.ok(normalizeStyle(v),name);}
 assert.equal(normalizeStyle({sky:'azul',sun:'x'}),null);
 const base=normalizeMap({id:'base',name:'B',style:{sky:'#112233',grass:0},objects:[]}).map,child=blankMap('F',{base:'map:base'}),{map:flat}=resolveMap(child,id=>id==='base'?base:null);
 assert.equal(flat.style.sky,'#112233');
 const plain=toArena(normalizeMap({id:'g',name:'G',size:{w:40,h:40},objects:[]}).map),bare=toArena(normalizeMap({id:'g',name:'G',size:{w:40,h:40},style:{grass:0,flowers:0},objects:[]}).map);
 assert.ok(plain.decor.grass.length>0);assert.equal(bare.decor.grass.length,0);assert.equal(bare.decor.flowers.length,0);
});
function world(){const w={actors:[],nextId:1,random:()=>.5,player:{x:0,y:0,hp:100},arena:{bounds:{minX:-50,maxX:50,minY:-50,maxY:50},solids:[]}};return w;}
const kill=w=>{for(const a of w.actors)a.hp=0;};
test('spawn: gatilho, ondas, retorno, composição e líder',()=>{
 const s=normalizeSpawn({id:'g',x:30,y:0,mix:[0,0,4],trigger:'near',radius:10,waves:2,interval:3,respawn:5,leader:'magic',level:4,idle:true});
 assert.equal(s.count,3);assert.equal(s.type,0);assert.deepEqual(spawnTypes(s),[0,0,4]);assert.equal(spawnSlots(s).length,3);
 const w=world(),groups=makeGroups([s]);let cleared=0;
 tickGroups(w,groups,1,{});assert.equal(w.actors.length,0,'longe, não nasce');
 w.player.x=25;tickGroups(w,groups,1,{});assert.equal(w.actors.length,3,'perto, nasce');assert.equal(w.actors[0].lootTier,'magic');assert.equal(w.actors[1].lootTier,'common');assert.equal(w.actors[0].gearWave,4);assert.ok(w.actors[0].home&&w.actors[0].alert===false);
 kill(w);tickGroups(w,groups,.1,{});assert.equal(groups[0].state,'between');tickGroups(w,groups,3,{});assert.equal(w.actors.filter(a=>a.hp>0).length,3,'segunda onda');
 kill(w);tickGroups(w,groups,.1,{onClear:()=>cleared++});assert.equal(groups[0].state,'clear');assert.equal(cleared,1);
 tickGroups(w,groups,6,{});assert.equal(groups[0].state,'clear','perto do jogador não renasce');w.player.x=-30;tickGroups(w,groups,1,{});assert.equal(groups[0].state,'dormant','longe, rearma');
 const timer=makeGroups([normalizeSpawn({id:'t',x:0,y:0,count:2,trigger:'timer',delay:4})]),w2=world();tickGroups(w2,timer,3,{});assert.equal(w2.actors.length,0);tickGroups(w2,timer,2,{});assert.equal(w2.actors.length,2);
 const quest=makeGroups([{...normalizeSpawn({id:'q',x:0,y:0,count:1,respawn:5}),quest:true}]),w3=world();tickGroups(w3,quest,1,{});kill(w3);tickGroups(w3,quest,.1,{});tickGroups(w3,quest,99,{});w3.player.x=40;tickGroups(w3,quest,1,{});assert.equal(quest[0].state,'clear','grupo de missão não volta');
 assert.equal(normalizeSpawn({x:0,y:0,count:3,type:1}).trigger,'start','mapas antigos seguem nascendo ao entrar');
});
test('mapa personalizado usa gatilhos: quem espera não nasce na entrada',()=>{
 const s=createSession();transition(s,'menu');
 const map=normalizeMap({id:'p',name:'P',size:SIZE,start:{x:0,y:0},objects:[],spawns:[{id:'a',x:5,y:0,count:2,type:0},{id:'b',x:25,y:25,count:3,type:0,trigger:'near',radius:5}]}).map;
 assert.ok(launchMap(s,map,()=>null).ok);assert.equal(s.world.actors.filter(a=>a.team==='enemy').length,2);assert.equal(s.world.adventure.enemies,5);
 s.world.player.x=25;s.world.player.y=24;tickGroups(s.world,s.world.adventure.groups,.1,{level:s.world.adventure.level});assert.equal(s.world.actors.filter(a=>a.team==='enemy').length,5);
});
test('edição da campanha: fica salva, entra no jogo e não quebra a história',()=>{
 const storage=memory(),library=createLibrary(storage);useCampaignMaps(library);
 try{
  assert.equal(editedCampaignMap('world'),null,'sem edição, a campanha usa a planta');
  const doc=campaignDocument('world');assert.equal(doc.id,campaignMapId('world'));assert.equal(doc.base,'builtin:campaign-world');
  const original=builtinMap('builtin:campaign-world');
  doc.spawns=original.spawns.filter(s=>s.id!=='mine-guards').map(s=>s.id==='forest-a'?{...s,mix:[4,4,4,4],count:4,trigger:'near',radius:30}:s);
  doc.hidden=[original.objects[0].id];doc.objects=[normalizeMap({objects:[{id:'novo',type:'tent',x:-90,y:-70}]}).map.objects[0]];
  doc.terrain=(()=>{const t=blankTerrain({w:360,h:360});t.rivers=[{id:'r',points:[[-40,-100],[-40,-60]],width:8,depth:1.6}];return t;})();doc.style={sky:'#0b1120'};
  assert.ok(library.save(doc).ok);
  const reloaded=createLibrary(storage);useCampaignMaps(reloaded);const flat=editedCampaignMap('world');
  assert.equal(flat.objects.length,original.objects.length,'um oculto, um novo');assert.ok(flat.objects.some(o=>o.id==='novo'));assert.equal(flat.terrain.rivers.length,1);
  assert.ok(flat.spawns.some(s=>s.id==='mine-guards'),'grupo de missão removido volta da planta');assert.ok(isRequiredSpawn('world','mine-guards'));
  const s=createSession();startCampaign(s,{opening:false,legacy:false});const w=s.world;
  assert.equal(w.adventure.kind,'campaign-world');assert.ok(w.arena.terrain,'o mundo recebe o relevo');assert.equal(w.arena.style.sky,'#0b1120');assert.ok(w.arena.kitProps.some(p=>p.part==='tent'));
  const g=w.adventure.groups.find(x=>x.id==='forest-a');assert.equal(g.count,4);assert.equal(g.radius,30);
  const quest=w.adventure.groups.find(x=>x.id==='mine-guards');assert.equal(quest.quest,true,'o que é missão vem do jogo');
  w.player.x=g.x+25;w.player.y=g.y;tickWorld(s,.1);assert.equal(w.actors.filter(a=>a.worldGroup==='forest-a').length,4,'composição e raio editados valem em jogo');
  doc.size={w:100,h:100};const problems=checkCampaignMap(doc,reloaded.lookup);assert.ok(problems.some(p=>p.level==='erro'&&/Fora do mapa/.test(p.text)),'reduzir o mapa avisa dos lugares da história');
  assert.ok(reloaded.remove(doc.id).ok);assert.equal(editedCampaignMap('world'),null,'restaurar volta ao original');
  const cave=campaignDocument('cave');cave.terrain=blankTerrain({w:144,h:360});library.save(cave);useCampaignMaps(createLibrary(storage));
 }finally{useCampaignMaps(null);}
});
test('prólogo: edição vale nas cenas de combate; viagem e queda seguem sobre o plano',()=>{
 const storage=memory(),library=createLibrary(storage);useCampaignMaps(library);
 try{
  const plain=prologueArena('ambush');assert.equal(plain.prologueGroups,undefined);
  for(const [slot,stage] of [['caravan','ambush'],['caravan','fall'],['travel','travel'],['trail','trail']]){
   const doc=campaignDocument(slot);doc.terrain=(()=>{const t=blankTerrain({w:40,h:60});t.rivers=[{id:'r',points:[[-10,-20],[10,-20]],width:4,depth:.4}];return t;})();doc.spawns=[{id:'x',x:0,y:-10,mix:[6,6,9],level:3}];library.save(doc);
   const arena=prologueArena(stage);
   if(stage==='ambush'){assert.ok(arena.terrain);assert.equal(arena.prologueGroups[0].mix.length,3);assert.equal(arena.prologueGroups[0].level,3);assert.ok(arena.decor.misc.some(m=>m.look==='road_block'));}
   if(stage==='fall'){assert.equal(arena.terrain,null);assert.ok(!arena.decor.misc.some(m=>m.look==='road_block'));}
   if(stage==='travel')assert.equal(arena.terrain,null);
   if(stage==='trail')assert.ok(arena.terrain);
  }
  assert.ok(CAMPAIGN_SLOTS.travel.noTerrain);
 }finally{useCampaignMaps(null);}
});
test('navegação sobe o custo em água e mantém resolvePosition fora do fundo',()=>{
 const arena=toArena(withRiver(.5)),a={x:-4,y:0,radius:.3},b={x:-20,y:0,radius:.3};
 const inWater={...a,x:0},q=navigate(inWater,{x:3,y:0},2,.1,arena),q2=navigate(b,{x:-17,y:0},2,.1,arena);
 assert.ok(q.distance<q2.distance,'na água anda menos');
 const griffin=navigate({x:0,y:0,radius:.3,model:'enemyGriffin'},{x:3,y:0},2,.1,arena);assert.ok(griffin.distance>q.distance,'quem voa ignora a água');
 const deep=toArena(withRiver(1.6)),p=resolvePosition({x:0,y:0},.45,deep);assert.equal(overlaps(p,.45,deep),false);
});

test('água desenhada fica seca no trecho aplainado da vila, e a da colisão também',()=>{
 const t=blankTerrain({w:360,h:360});t.rivers=[{id:'r',points:[[0,60],[120,60]],width:10,depth:1.6}];
 const b=bakeTerrain(t,{minX:-180,maxX:180,minY:-180,maxY:180}),rect={minX:34,maxX:86,minY:36,maxY:98},flat=flattenBake(b,rect);
 const at=(g,x,y)=>g.h[Math.round((y-g.y0)/g.cell)*g.cols+Math.round((x-g.x0)/g.cell)];
 assert.ok(at(b,60,60)<-1,'sem aplainar, o rio passa ali');assert.ok(Math.abs(at(flat,60,60))<1e-9,'aplainado: seco');assert.ok(at(flat,150,60)===0||at(flat,110,60)<-1,'fora do trecho, o rio segue');
 const fine=fineWater(flat);assert.ok(Math.abs(at(fine,60,60))<1e-9,'o desenho também fica seco');assert.ok(at(fine,110,60)<-1,'fora do trecho, o desenho segue');assert.ok(fine.cell<flat.cell,'grade mais fina');
 assert.ok(at(fineWater(b),60,60)<-1,'sem aplainar, o desenho mantém o rio');
});
