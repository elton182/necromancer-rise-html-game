import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,snapshot} from '../scripts/session.mjs';
import {startCampaign,tickAdventure} from '../scripts/campaign.mjs';
import {WORLD_POINTS,WORLD_PILES,worldObjectives,normalizeWorld} from '../scripts/campaign-world-model.mjs';
import {campaignQuests,questMarkerFor} from '../scripts/quest-model.mjs';
import {interactWorld,worldDialogue,worldDialogueAction,closeWorldOverlay} from '../scripts/campaign-world.mjs';
const arrival=()=>{const s=createSession();Object.assign(s.save.campaign,{started:true,prologue:{stage:'done'},world:{stage:'complete',questFlow:1,smith:'available',lumber:'locked',passengerMissing:true}});startCampaign(s);return s;};
function talk(s,p){Object.assign(s.world.player,{x:p.x+.8,y:p.y});tickAdventure(s,.1);assert.equal(interactWorld(s),true);return worldDialogue(s);}
const act=(s,kind)=>{assert.equal(worldDialogue(s).kind,kind);assert.equal(worldDialogueAction(s),true);};

test('chegada: pedidos só entram no HUD e diário depois de aceitar; fechar não aceita',()=>{
 const s=arrival(),p=s.save.campaign.world,active=()=>campaignQuests(s.save).filter(q=>q.status==='active');
 assert.equal(active().length,0);assert.equal(questMarkerFor('mayor',p),'!');assert.equal(worldObjectives(p)[0].title,'Missões em Jacarandá');
 talk(s,WORLD_POINTS.mayor);closeWorldOverlay(s);assert.equal(p.smith,'available');assert.equal(active().length,0);
 const gold=s.save.character.gold;talk(s,WORLD_POINTS.mayor);act(s,'smith-accept');assert.equal(s.save.character.gold,gold);
 assert.equal(active()[0].id,'smith');assert.equal(active()[0].current,0);assert.equal(worldObjectives(p)[0].title,'O ferreiro de Jacarandá');
 assert.equal(questMarkerFor('mayor',p),'');assert.equal(p.lumber,'locked');
 const resumed=createSession(snapshot(s));startCampaign(resumed);assert.equal(resumed.save.campaign.world.smith,'active');
});

test('etapas e ofertas em sequência: Bruno, madeira, pista de Marta; pagamento único',()=>{
 const s=arrival(),p=s.save.campaign.world;talk(s,WORLD_POINTS.mayor);act(s,'smith-accept');
 p.cleared.push('mine-guards');tickAdventure(s,.1);assert.equal(questMarkerFor('smith',p),'?');
 assert.equal(campaignQuests(s.save).find(q=>q.id==='smith').current,1);
 talk(s,WORLD_POINTS.mine);act(s,'smith-found');assert.equal(campaignQuests(s.save).find(q=>q.id==='smith').current,2);
 const gold=s.save.character.gold;talk(s,WORLD_POINTS.forge);act(s,'smith');assert.equal(s.save.character.gold,gold+100);
 assert.equal(p.lumber,'available');assert.equal(questMarkerFor('mayor',p),'!');assert.equal(campaignQuests(s.save).find(q=>q.id==='smith').status,'done');
 assert.equal(campaignQuests(s.save).some(q=>q.id==='lumber'),false,'oferta ainda não é missão aceita');
 talk(s,WORLD_POINTS.mayor);act(s,'lumber-accept');
 for(const pile of WORLD_PILES){p.cleared.push(pile.guard);talk(s,pile);act(s,'pile');}
 assert.equal(questMarkerFor('mayor',p),'?');talk(s,WORLD_POINTS.mayor);act(s,'lumber');
 assert.equal(s.save.character.gold,gold+210);assert.equal(questMarkerFor('marta',p),'!');
 assert.equal(campaignQuests(s.save).filter(q=>q.status==='active').length,0);
 talk(s,WORLD_POINTS.mayor);assert.equal(worldDialogueAction(s),false,'não repete prêmio');closeWorldOverlay(s);
});

test('migração conserva coletas e missões em curso; pedidos automáticos sem progresso viram ofertas',()=>{
 const fresh=normalizeWorld({stage:'complete',smith:'active',lumber:'active'});assert.equal(fresh.smith,'available');assert.equal(fresh.lumber,'locked');
 const old=normalizeWorld({stage:'complete',smith:'active',lumber:'active',piles:[1,0,0],cleared:['mine-guards','mill-a']});
 assert.equal(old.smith,'active');assert.equal(old.lumber,'active');assert.deepEqual(old.piles,[1,0,0]);assert.equal(old.questFlow,1);
 assert.deepEqual(normalizeWorld(old),old);assert.equal(normalizeWorld({stage:'complete',questFlow:1,smith:'active',lumber:'locked'}).smith,'active');
 const done=normalizeWorld({stage:'complete',smith:'done',lumber:'done',nilo:'done'});assert.equal(done.smith,'done');assert.equal(done.lumber,'done');assert.equal(done.nilo,'done');
});

test('diário deriva o histórico regional e não registra a próxima missão antes da aceitação',()=>{
 const s=arrival(),p=s.save.campaign.world;Object.assign(p,{smith:'done',lumber:'done',nilo:'rescued'});
 let q=campaignQuests(s.save);assert.equal(q.find(q=>q.id==='joao-rescue').status,'done');assert.equal(q.some(q=>q.id==='joao-letter'),false);assert.equal(questMarkerFor('nilo',p),'!');
 Object.assign(p,{nilo:'fort',niloLetter:true,niloEvidence:false});q=campaignQuests(s.save);assert.equal(q.find(q=>q.id==='joao-letter').status,'active');
 Object.assign(p,{nilo:'invitation',area:'itavera'});q=campaignQuests(s.save);assert.equal(q.find(q=>q.id==='itavera-letter').status,'done');assert.equal(questMarkerFor('city-joao',p),'!');
});
