import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,snapshot} from '../scripts/session.mjs';
import {launchWorld,nearbyWorldPerson,interactWorld} from '../scripts/campaign-world.mjs';
import {returnAdventure,launchArena} from '../scripts/campaign.mjs';
import {launchExpedition,launchConquest} from '../scripts/expedition.mjs';
import {launchSiege,siegeAccess} from '../scripts/siege.mjs';
import {inVillageHub,villageServices} from '../scripts/village-services.mjs';
import {overlaps,findPath} from '../scripts/terrain.mjs';
function hub(intact=true){const s=createSession();s.save.campaign.started=true;s.save.campaign.world={stage:'village',checkpoint:'village'};if(intact)s.save.campaign.prologue={stage:'done'};launchWorld(s);return s;}
test('três serviços nascem na praça, acessíveis nos dois cenários de Jacarandá',()=>{
 for(const intact of [true,false]){const s=hub(intact),w=s.world;
  for(const npc of villageServices(true)){
   const actor=w.actors.find(a=>a.service===npc.service);assert.ok(actor,npc.name);assert.equal(actor.team,'neutral');assert.ok(!overlaps(npc,.4,w.arena),npc.name+' em sólido');
   assert.ok(findPath(w.player,npc,.45,w.arena).length,npc.name+' sem caminho');
   Object.assign(w.player,{x:npc.x,y:npc.y});assert.equal(nearbyWorldPerson(s).service,npc.service);assert.equal(interactWorld(s),false,'serviço não pode abrir diálogo de quest');
  }
 }
});
test('modos abrem pela vila contínua sem concluir Ato I; sair retoma a praça e preserva quests',()=>{
 for(const [launch,kind] of [[launchArena,'arena'],[launchExpedition,'expedition'],[s=>launchConquest(s,'expedition'),'expedition'],[launchSiege,'siege']]){
  const s=hub(),before={...s.save.campaign.cleared};assert.ok(inVillageHub(s));assert.ok(siegeAccess(s));const result=launch(s);assert.ok(result===true||result.ok);
  assert.equal(s.world.adventure.kind,kind);assert.equal(inVillageHub(s),false);returnAdventure(s);assert.equal(s.world.adventure.kind,'campaign-world');assert.ok(inVillageHub(s));
  assert.deepEqual(s.save.campaign.cleared,before);assert.equal(snapshot(s).campaign.world.checkpoint,'village');assert.equal(s.world.actors.filter(a=>a.service).length,3);
 }
});
test('fora da vila e morto não inicia modos; não fabrica conclusão da campanha',()=>{
 const s=hub();s.world.player.x=-98;s.world.player.y=-86;assert.equal(inVillageHub(s),false);assert.equal(launchArena(s),false);assert.equal(launchExpedition(s),false);assert.equal(launchConquest(s,'expedition').ok,false);assert.equal(launchSiege(s).ok,false);
 s.world.player.x=60;s.world.player.y=64;s.world.player.hp=0;assert.equal(inVillageHub(s),false);assert.equal(launchSiege(s).ok,false);
});
