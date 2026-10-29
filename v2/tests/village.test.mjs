import test from 'node:test';
import assert from 'node:assert/strict';
import {villageArena,VILLAGE_ID,VILLAGE_START} from '../scripts/village-map.mjs';
import {overlaps,findPath,moveCircle} from '../scripts/terrain.mjs';
import {createSession} from '../scripts/session.mjs';
import {normalizeCampaign} from '../scripts/campaign-model.mjs';
import {startCampaign,nextStory,enterVillage} from '../scripts/campaign.mjs';

const enter=()=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1,4:1}});startCampaign(s);for(let i=0;i<200&&s.world.story;i++)nextStory(s);assert.ok(enterVillage(s));return s;};
test('mapa da vila é determinístico, tem ids únicos de tema e mantém tudo dentro do limite',()=>{
 const a=villageArena(),b=villageArena();assert.deepEqual(a,b);assert.equal(a.id,VILLAGE_ID);assert.equal(a.theme,'village');
 assert.ok(a.solids.length>=40&&a.solids.length<=70);assert.ok(a.solids.every(s=>s.look&&s.height>0));
 for(const s of a.solids.filter(s=>s.kind==='circle'))assert.ok(s.x-s.r>=a.bounds.minX&&s.x+s.r<=a.bounds.maxX&&s.y-s.r>=a.bounds.minY&&s.y+s.r<=a.bounds.maxY);
 for(const s of a.solids.filter(s=>s.kind==='box'&&s.look==='house'))assert.ok(s.x-s.width/2>=a.bounds.minX&&s.x+s.width/2<=a.bounds.maxX&&s.y+s.depth/2<=a.bounds.maxY&&s.y-s.depth/2>=a.bounds.minY);
 assert.ok(a.decor.stones.length>200&&a.decor.grass.length>200);
});
test('casas não se sobrepõem entre si nem com barracas e poço',()=>{
 const big=villageArena().solids.filter(s=>['house','stall','well'].includes(s.look)),r=s=>s.kind==='box'?{x0:s.x-s.width/2,x1:s.x+s.width/2,y0:s.y-s.depth/2,y1:s.y+s.depth/2}:{x0:s.x-s.r,x1:s.x+s.r,y0:s.y-s.r,y1:s.y+s.r};
 for(let i=0;i<big.length;i++)for(let j=i+1;j<big.length;j++){const a=r(big[i]),b=r(big[j]);assert.ok(a.x1<=b.x0||b.x1<=a.x0||a.y1<=b.y0||b.y1<=a.y0,`${big[i].look}@${big[i].x},${big[i].y} sobrepõe ${big[j].look}@${big[j].x},${big[j].y}`);}
});
test('na vila, pontos de interação ficam livres e alcançáveis a pé',()=>{
 const s=enter(),w=s.world;assert.equal(w.arena.id,VILLAGE_ID);assert.ok(w.landmarks.length>=7);
 assert.ok(!overlaps(w.player,w.player.radius,w.arena));assert.ok(w.actors.every(a=>!overlaps(a,a.radius,w.arena)),'ator nasceu dentro de um sólido');
 for(const l of w.landmarks){const stand=findPath(VILLAGE_START,{x:l.x,y:l.y},.55,w.arena);assert.ok(stand.length,`sem rota até ${l.id}`);
  const end=stand[stand.length-1];assert.ok(Math.hypot(end.x-l.x,end.y-l.y)<3.2,`${l.id}: ponto de parada fora do alcance de interação`);
  assert.ok(!overlaps({x:l.x,y:l.y},.4,w.arena),`${l.id} dentro de um sólido`);}
});
test('casa e poço bloqueiam o jogador; rua principal e praça ficam livres',()=>{
 const a=villageArena(),inn=a.solids.find(s=>s.look==='inn'||s.inn),q=moveCircle({x:0,y:12},{x:0,y:8},.45,a);
 assert.ok(inn.depth>0);assert.ok(q.blocked,'estalagem deveria bloquear');assert.ok(q.y<=inn.y-inn.depth/2-.45+1e-3);
 const walk=moveCircle({x:-1.8,y:9},{x:0,y:-16},.45,a,{slide:false});assert.ok(walk.y<-6.5&&walk.y>-9.5,'rua principal deveria levar ao portal sem atravessar os pilares');
 const free=moveCircle({x:-6,y:2},{x:12,y:0},.45,a);assert.ok(Math.hypot(free.x+6,free.y-2)>4,'praça bloqueada demais');
});
