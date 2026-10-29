import test from 'node:test';
import assert from 'node:assert/strict';
import {outpostArena,OUTPOST_ID,OUTPOST_START,OUTPOST_BOSS} from '../scripts/outpost-map.mjs';
import {normalizeCampaign} from '../scripts/campaign-model.mjs';
import {overlaps,findPath} from '../scripts/terrain.mjs';
import {createSession} from '../scripts/session.mjs';
import {startCampaign,launchStage,nextStory,tickAdventure} from '../scripts/campaign.mjs';

const skip=s=>{for(let i=0;i<200&&s.world.story;i++)nextStory(s);};
const reach=s=>s.kind==='box'?Math.hypot(s.width,s.depth)/2:s.r;
test('mapa do posto: determinístico, colisores só nas bordas e centro livre para o chefe',()=>{
 const a=outpostArena(),b=outpostArena();assert.deepEqual(a,b);assert.equal(a.id,OUTPOST_ID);assert.equal(a.theme,'outpost');
 assert.deepEqual(a.bounds,{minX:-20,maxX:20,minY:-20,maxY:20});assert.ok(a.solids.length>=18&&a.solids.length<=30&&a.solids.every(s=>s.look));
 for(const s of a.solids){assert.ok(Math.hypot(s.x-OUTPOST_BOSS.x,s.y-OUTPOST_BOSS.y)-reach(s)>=9,`${s.look}@${s.x},${s.y} perto demais do chefe`);
  assert.ok(Math.hypot(s.x-OUTPOST_START.x,s.y-OUTPOST_START.y)-reach(s)>=6,`${s.look} perto demais da chegada`);}
 assert.ok(a.decor.palisade.length>150&&a.decor.towers.length===5&&a.decor.tents.length===4);
 assert.ok(a.decor.trees.every(t=>t.y<-22||t.x<-22),'mata alta só ao norte e a oeste');
 assert.ok(a.decor.palisade.filter(l=>l.y>-20&&l.x>-20&&(l.y>20||l.x>20)).every(l=>l.height<=2.6),'paliçada sul/leste deve ser baixa');
});
test('posto: chegada, chefe e cantos alcançáveis a pé',()=>{
 const a=outpostArena();assert.ok(!overlaps(OUTPOST_START,.55,a)&&!overlaps(OUTPOST_BOSS,1.1,a));
 for(const t of [OUTPOST_BOSS,{x:-18,y:-18},{x:18,y:-18},{x:-18,y:18},{x:18,y:18},{x:-12,y:0},{x:12,y:0}])assert.ok(findPath(OUTPOST_START,t,.55,a).length,`sem rota até ${t.x},${t.y}`);
});
test('fase 4 usa o posto e o Capitão aparece em chão livre',()=>{
 const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1}});startCampaign(s);skip(s);launchStage(s,4);skip(s);const w=s.world;
 assert.equal(w.arena.id,OUTPOST_ID);assert.ok(!overlaps(w.player,w.player.radius,w.arena));
 for(let i=0;i<40&&w.boss.hp<=0;i++)tickAdventure(s,.25);
 assert.ok(w.boss.hp>0,'Capitão não apareceu');assert.ok(!overlaps(w.boss,w.boss.radius,w.arena));assert.ok(Math.hypot(w.boss.x-OUTPOST_BOSS.x,w.boss.y-OUTPOST_BOSS.y)<1);
});
