import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveMap,toArena,builtinMap,reachable,canReach} from '../scripts/map-model.mjs';
import {tuneGroups,tunePrologueGroups,ROUTE_ENCOUNTERS,addRouteEncounters} from '../scripts/area-tuning.mjs';
import {TRAIL_ROUTE,prologueMapData} from '../scripts/prologue-map-data.mjs';
import {WORLD_ROUTES,WORLD_ROAD_ITAUNA,inWorldVillage} from '../scripts/campaign-world-model.mjs';
import {ITAUNA_ROUTES} from '../scripts/itauna-map.mjs';
import {overlaps} from '../scripts/terrain.mjs';
import {makeGroups,tickGroups} from '../scripts/map-spawns.mjs';
import {createWorld} from '../scripts/training-model.mjs';

const published=slot=>resolveMap(JSON.parse(fs.readFileSync(new URL('../assets/maps/campaign-'+slot+'.json',import.meta.url),'utf8'))).map;
const routeGap=(path,groups,safe=()=>false)=>{
 let run=0,longest=0;
 for(let i=1;i<path.length;i++){
  const [ax,ay]=path[i-1],[bx,by]=path[i],d=Math.hypot(bx-ax,by-ay),steps=Math.ceil(d);
  for(let n=1;n<=steps;n++){
   const p={x:ax+(bx-ax)*n/steps,y:ay+(by-ay)*n/steps},covered=safe(p)||groups.some(g=>Math.hypot(g.x-p.x,g.y-p.y)<(g.radius||14));
   run=covered?0:run+d/steps;longest=Math.max(longest,run);
  }
 }
 return longest;
};

test('caverna publicada: sem enxurradas de elites nem retorno contínuo; só dois reforços',()=>{
 const map=published('cave'),g=tunePrologueGroups(map.spawns,'cave',map.level);
 assert.equal(g.filter(s=>s.waves===2).length,2);
 assert.ok(g.every(s=>s.count<=2&&s.waves<=2&&s.respawn===0&&s.leader!=='rare'));
 assert.ok(g.reduce((n,s)=>n+s.count*s.waves,0)<=40,'encontro local não se transforma em arena');
 const custom=tunePrologueGroups([{id:'custom',count:20,type:8,waves:20,respawn:1,leader:'rare',trigger:'start'}],'cave');
 assert.equal(custom[0].waves,1);assert.equal(custom[0].respawn,0,'mapa antigo no navegador também recebe os limites');
});

test('caminho de Jacarandá tem ação distribuída, sem concentrar a população no fim',()=>{
 const before=prologueMapData('trail'),groups=before.spawns.map(g=>({...g,radius:14}));
 assert.equal(groups.length,16);assert.ok(routeGap(TRAIL_ROUTE,groups)<16,'nenhum intervalo descoberto longo entre encontros');
 assert.ok(groups.some(g=>g.y>65),'encontro antes da antiga clareira dos lobos');
 assert.ok(groups.some(g=>g.y>0&&g.y<12),'travessia do riacho');
 assert.ok(groups.some(g=>g.y<-40&&g.y>-60),'aproximação de Tomás');
});

test('rotas de Jacarandá e Itaúna mantêm pausas curtas entre grupos pequenos',()=>{
 const world=published('world'),wg=tuneGroups(addRouteEncounters(world.spawns,'world'),{area:'world',mapLevel:world.level});
 for(const [name,route] of Object.entries({...WORLD_ROUTES,itauna:WORLD_ROAD_ITAUNA}))assert.ok(routeGap(route,wg,inWorldVillage)<30,name+' sem caminhada longa sem ação');
 const map=published('itauna'),groups=tuneGroups(addRouteEncounters(map.spawns,'itauna'),{area:'itauna',mapLevel:map.level});
 for(const [name,route] of Object.entries(ITAUNA_ROUTES))assert.ok(routeGap(route,groups)<30,name+' com cobertura de encontros');
 for(const g of [...wg,...groups])assert.ok(g.count<=(g.leader?4:3)&&g.waves<=2&&g.respawn===0);
});

test('patrulhas novas são alcançáveis nas plantas publicadas e não duplicam IDs',()=>{
 for(const [slot,area] of [['world','world'],['itauna','itauna'],['itaunaCave','itauna-cave']]){
  const map=published(slot),arena=toArena(map),r=reachable(arena,map.start,{step:1});
  for(const g of ROUTE_ENCOUNTERS[area]){assert.equal(overlaps(g,.6,arena),false,g.id+' livre');assert.equal(canReach(r,g),true,g.id+' alcançável');}
  const added=addRouteEncounters(map.spawns,area);assert.equal(new Set(added.map(g=>g.id)).size,added.length);
 }
 const trail=toArena(builtinMap('builtin:arandu-trail')),r=reachable(trail,{x:0,y:86},{step:1});
 for(const g of prologueMapData('trail').spawns){assert.equal(overlaps(g,.6,trail),false,g.id);assert.equal(canReach(r,g),true,g.id);}
});

test('ponto com reforço encerra após a segunda leva, mesmo depois de longa espera',()=>{
 const w=createWorld(),g=makeGroups(tunePrologueGroups([{id:'opening-enemy-4',x:0,y:0,count:2,type:8,waves:4,respawn:1}],'cave'));
 w.player.x=w.player.y=0;tickGroups(w,g,.1);assert.equal(g[0].state,'active');
 for(const a of w.actors)if(a.worldGroup)a.hp=0;tickGroups(w,g,.1);assert.equal(g[0].state,'between');
 tickGroups(w,g,10);assert.equal(g[0].state,'active');for(const a of w.actors)if(a.worldGroup)a.hp=0;
 tickGroups(w,g,.1);assert.equal(g[0].state,'clear');w.player.x=100;tickGroups(w,g,1000);assert.equal(g[0].state,'clear');
});
