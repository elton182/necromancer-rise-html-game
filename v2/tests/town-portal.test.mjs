import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,snapshot} from '../scripts/session.mjs';
import {startCampaign,returnAdventure} from '../scripts/campaign.mjs';
import {launchWorld,homeTeleport,teleportHome,travelArea,useWorldPortal,interactWorld,worldDialogue,worldDialogueAction,closeWorldOverlay} from '../scripts/campaign-world.mjs';
import {questMarkerFor,campaignQuests} from '../scripts/quest-model.mjs';
import {normalizeWorld,WORLD_POINTS} from '../scripts/campaign-world-model.mjs';
import {overlaps} from '../scripts/terrain.mjs';

const ready=()=>{const s=createSession();Object.assign(s.save.campaign,{started:true,prologue:{stage:'done'},world:{stage:'complete',questFlow:1,smith:'done',lumber:'done',portalUnlocked:true}});startCampaign(s);return s;};
const locate=(s,area=null)=>{const p=s.save.campaign.world;if(area){p.area=area;p.entry=area==='itauna-cave'?'mouth':'gate';}else delete p.area;launchWorld(s);s.world.actors=s.world.actors.filter(a=>a.team!=='enemy');};

test('Joaquim entrega o selo uma vez depois da forja; fechar não aceita e o save mantém a recompensa',()=>{
 const s=ready();let p=s.save.campaign.world;p.portalUnlocked=false;p.smith='active';
 Object.assign(s.world.player,{x:120,y:84});assert.equal(homeTeleport(s).ok,false);
 p.smith='done';Object.assign(s.world.player,WORLD_POINTS.mayor);
 assert.equal(questMarkerFor('mayor',p),'!');assert.equal(interactWorld(s),true);assert.equal(worldDialogue(s).kind,'portal-unlock');
 closeWorldOverlay(s);assert.equal(p.portalUnlocked,false);
 interactWorld(s);const gold=s.save.character.gold;assert.equal(worldDialogueAction(s),true);assert.equal(p.portalUnlocked,true);
 assert.equal(worldDialogueAction(s),false);assert.equal(s.save.character.gold,gold);
 assert.equal(campaignQuests(s.save).find(q=>q.id==='jacaranda-seal').status,'done');
 const resumed=createSession(snapshot(s));startCampaign(resumed);assert.equal(resumed.save.campaign.world.portalUnlocked,true);assert.equal(resumed.campaignPortal,null);
 assert.equal(normalizeWorld({stage:'complete',smith:'done'}).portalUnlocked,false);
 assert.equal(normalizeWorld({stage:'wake',portalUnlocked:true}).portalUnlocked,false);
});

test('portal retorna à posição no mundo, na gruta e no forte e conserva os grupos vencidos por várias viagens',()=>{
 for(const area of [null,'itauna','itauna-cave','itauna-fort']){
  const s=ready();locate(s,area);const w=s.world;
  if(!area){Object.assign(w.player,{x:120,y:84});w.adventure.inVillage=false;}
  const origin={x:w.player.x,y:w.player.y},group=w.adventure.groups.find(g=>!g.quest);w.adventure.clearedRun.add(group.id);
  assert.equal(teleportHome(s),true);assert.equal(travelArea(s),true);assert.equal(w.adventure.inVillage,true);
  assert.equal(overlaps(w.player,w.player.radius,w.arena),false,'chegada livre');
  assert.equal(overlaps(w.portal,1,w.arena),false,'portal livre');
  assert.equal(useWorldPortal(s),false,'exige aproximação');
  Object.assign(w.player,w.portal);assert.equal(interactWorld(s),true);assert.equal(travelArea(s),true);
  assert.equal(w.adventure.area||null,area);assert.deepEqual({x:w.player.x,y:w.player.y},origin);
  assert.equal(w.adventure.groups.find(g=>g.id===group.id).state,'clear');assert.equal(w.adventure.clearedRun.has(group.id),true);
  assert.equal(useWorldPortal(s),true);assert.equal(travelArea(s),true);Object.assign(w.player,w.portal);
  assert.equal(useWorldPortal(s),true);assert.equal(travelArea(s),true);assert.deepEqual({x:w.player.x,y:w.player.y},origin);
 }
});

test('novo portal substitui o anterior; passagem comum, morte e retomada encerram o vínculo',()=>{
 const s=ready();locate(s,'itauna-fort');const w=s.world;
 assert.equal(teleportHome(s),true);travelArea(s);Object.assign(w.player,w.portal);useWorldPortal(s);travelArea(s);
 const old=s.campaignPortal;w.player.x+=6;assert.equal(teleportHome(s),true);assert.notEqual(s.campaignPortal,old);travelArea(s);
 w.areaTravel={to:'itauna',entry:'west'};travelArea(s);assert.equal(s.campaignPortal,null);assert.equal(w.portal,null);
 teleportHome(s);travelArea(s);Object.assign(w.player,w.portal);useWorldPortal(s);travelArea(s);
 w.player.hp=0;assert.equal(useWorldPortal(s),false);returnAdventure(s);assert.equal(s.campaignPortal,null);
});
