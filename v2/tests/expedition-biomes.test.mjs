import test from 'node:test';
import assert from 'node:assert/strict';
import {expeditionArena} from '../scripts/expedition-map.mjs';
import {EXPEDITION_STYLES} from '../scripts/expedition-biomes.mjs';
import {reachable,canReach,PROPS} from '../scripts/map-model.mjs';
import {overlaps,lineClear} from '../scripts/terrain.mjs';
import {heightAt,terrainSpeed,TERRAIN_RULES} from '../scripts/map-terrain.mjs';
import Expedition from '../scripts/shared-expedition.mjs';

// Os cinco biomas do ciclo da Expedição e os três da Conquista, mais o piloto do Brejo com desvio e patrulha.
const CASES=[[1,{}],[2,{}],[3,{}],[4,{}],[5,{}],[8,{}],[13,{}],[1,{biome:'swamp',groups:4}],[1,{biome:'swamp',groups:8,pilot:true}],[2,{biome:'river',groups:6}],[3,{biome:'mountain',groups:4}],[9,{biome:'forest',groups:4}]];

test('mapas por bioma: trilha seca e livre, encontros e chefe alcançáveis a pé, estilo e relevo próprios',()=>{
 for(const [wave,options] of CASES){
  const a=expeditionArena(wave,options),plan=a.plan,tag=a.biome+' wave '+wave;
  assert.ok(a.terrain&&a.custom&&a.expeditionMap,'relevo e peças do kit: '+tag);for(const [k,v] of Object.entries(EXPEDITION_STYLES[a.biome]))assert.equal(a.style[k],v,'estilo '+k+': '+tag);
  assert.ok(a.kitProps.length>60,'peças do kit: '+tag);assert.equal(a.rotatedParts.length,0);
  assert.ok(a.kitProps.every(k=>k.x>=-1&&k.x<=plan.width+1&&k.y>=-1&&k.y<=plan.height+1),'peças dentro do campo: '+tag);
  // Trilha (e desvio do Brejo): sem colisor no caminho, chão seco e plano, sem lentidão de água ou lama.
  for(const route of [plan.route,...(plan.branches||[])])for(let x=route[0].x;x<=route.at(-1).x;x+=1){
   const p={x,y:Expedition.routeY(route,x)},q={x:x+1,y:Expedition.routeY(route,x+1)};
   if(x+1<=route.at(-1).x)assert.ok(lineClear(p,q,.45,a),'trilha bloqueada: '+tag+' x='+x);
   assert.ok(heightAt(a,p.x,p.y)>TERRAIN_RULES.wet&&heightAt(a,p.x,p.y)<1,'trilha fora da água e do morro: '+tag+' x='+x);
   assert.equal(terrainSpeed(a,p.x,p.y,1,0)>.9,true,'trilha sem lentidão: '+tag+' x='+x);
  }
  const reach=reachable(a,{x:plan.entry.x+3,y:plan.entry.y+2});assert.equal(reach.blocked,false);
  for(const g of plan.groups)for(const m of g.mobs){assert.ok(!overlaps(m,.3,a),'inimigo dentro de colisor: '+tag);assert.ok(heightAt(a,m.x,m.y)>TERRAIN_RULES.wet,'inimigo na água: '+tag);assert.ok(canReach(reach,m),'inimigo inalcançável: '+tag);}
  for(const g of plan.groups.filter(g=>g.patrol))for(const p of g.patrol)assert.ok(canReach(reach,p),'patrulha inalcançável: '+tag);
  assert.ok(canReach(reach,{x:plan.exit.x-4,y:plan.exit.y})&&canReach(reach,plan.exit),'chefe e portal final alcançáveis: '+tag);
 }
});
test('mapas por bioma: determinísticos, diferentes entre waves e só com peças do catálogo do editor',()=>{
 assert.deepEqual(expeditionArena(6),expeditionArena(6));assert.notDeepEqual(expeditionArena(1).kitProps,expeditionArena(6).kitProps);
 const biomes=new Set(CASES.map(([w,o])=>expeditionArena(w,o).biome));assert.deepEqual([...biomes].sort(),['desert','forest','grave','mountain','river','snow','swamp','village']);
 for(const biome of biomes)assert.ok(EXPEDITION_STYLES[biome].sky,'céu de '+biome);
 // Cada bioma tem algo seu: água no pântano e no rio, relevo alto nas montanhas.
 assert.ok(expeditionArena(1,{biome:'swamp'}).terrain.hasWater);assert.ok(expeditionArena(1,{biome:'river'}).terrain.hasWater);
 const peak=a=>{let m=0;for(let x=0;x<=a.plan.width;x+=2)for(let y=0;y<=a.plan.height;y+=2)m=Math.max(m,heightAt(a,x,y));return m;};
 assert.ok(peak(expeditionArena(1,{biome:'mountain'}))>4);
 assert.ok(Object.keys(PROPS).length>0);
});
