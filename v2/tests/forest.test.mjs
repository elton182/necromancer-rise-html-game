import test from 'node:test';
import assert from 'node:assert/strict';
import {forestArena,FOREST_ID,FOREST_START,FOREST_SPAWN,FOREST_KEEPOUT} from '../scripts/forest-map.mjs';
import {overlaps,findPath,moveCircle} from '../scripts/terrain.mjs';
import {createSession} from '../scripts/session.mjs';
import {normalizeCampaign} from '../scripts/campaign-model.mjs';
import {startCampaign,launchStage,nextStory} from '../scripts/campaign.mjs';

const radius=s=>s.kind==='box'?Math.hypot(s.width,s.depth)/2:s.r;
test('mapa da floresta é determinístico e mantém dados visuais separados dos colisores',()=>{
 const a=forestArena(),b=forestArena();assert.deepEqual(a,b);assert.equal(a.id,FOREST_ID);assert.equal(a.theme,'forest');
 assert.ok(a.solids.length>=30&&a.solids.length<=60,'quantidade de colisores controlada para a navegação');
 assert.ok(a.solids.every(s=>s.look&&Number.isFinite(s.x+s.y)&&s.height>0));
 assert.ok(a.decor.trees.every(t=>Math.max(Math.abs(t.x),Math.abs(t.y))>20),'mata de fundo fica fora do limite caminhável');
 assert.ok(a.decor.trees.length>60&&a.decor.grass.length>100);
});
test('colisores respeitam limites, afastamento entre obstáculos e áreas livres',()=>{
 const {solids,bounds}=forestArena();
 for(const s of solids){assert.ok(s.x-radius(s)>=bounds.minX&&s.x+radius(s)<=bounds.maxX&&s.y-radius(s)>=bounds.minY&&s.y+radius(s)<=bounds.maxY);}
 for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++){const a=solids[i],b=solids[j];if(a.kind==='box'&&b.kind==='box')continue;
  // Marcos fixos podem formar aglomerados (rochas); entre árvores sorteadas, uma Abominação (0,55 u) deve passar.
  if(a.look==='rock'&&b.look==='rock')continue;assert.ok(Math.hypot(a.x-b.x,a.y-b.y)-radius(a)-radius(b)>=1.1,`${a.look}@${a.x},${a.y} muito perto de ${b.look}@${b.x},${b.y}`);}
 for(const s of solids.filter(s=>s.look==='pine'))for(const k of FOREST_KEEPOUT)assert.ok(Math.hypot(s.x-k.x,s.y-k.y)>=k.r,'árvore sorteada invadiu área livre');
 for(const p of [FOREST_START,FOREST_SPAWN,{x:3.7,y:-7},{x:-3.7,y:-3}])assert.ok(!overlaps(p,.48,forestArena()),'ponto de chegada/spawn bloqueado');
});
test('toda a clareira alcançável: jogador chega ao campo das ondas e aos cantos',()=>{
 const arena=forestArena();
 for(const target of [FOREST_SPAWN,{x:-17,y:-17},{x:17,y:-17},{x:-17,y:17},{x:17,y:17},{x:-14,y:0},{x:14,y:0}]){
  const path=findPath(FOREST_START,target,.55,arena);assert.ok(path.length,`sem rota até ${target.x},${target.y}`);}
});
test('árvore bloqueia o movimento pelo raio do colisor',()=>{
 const arena=forestArena(),tree=arena.solids.find(s=>s.look==='pine'),from={x:tree.x-tree.r-1.5,y:tree.y},q=moveCircle(from,{x:3,y:0},.45,arena);
 assert.ok(q.blocked);assert.ok(q.x<=tree.x-tree.r-.45+1e-3,'atravessou o tronco');
});
test('fase 2 usa a floresta com jogador e inimigos em chão livre',()=>{
 const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1}});startCampaign(s);
 for(let i=0;i<200&&s.world.story;i++)nextStory(s);launchStage(s,2);for(let i=0;i<200&&s.world.story;i++)nextStory(s);
 const w=s.world;assert.equal(w.arena.id,FOREST_ID);assert.ok(w.arena.solids.length>=30);
 assert.ok(!overlaps(w.player,w.player.radius,w.arena));assert.ok(w.actors.every(a=>!overlaps(a,a.radius,w.arena)));
});
