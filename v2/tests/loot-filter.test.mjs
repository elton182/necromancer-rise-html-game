import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,updateSettings,transition} from '../scripts/session.mjs';
import {normalizeCampaign} from '../scripts/campaign-model.mjs';
import {startCampaign,nextStory,enterVillage,launchStage,launchArena,returnAdventure} from '../scripts/campaign.mjs';
import {launchExpedition} from '../scripts/expedition.mjs';
import {lootAllowed,spawnDrop} from '../scripts/drops.mjs';
import {collect} from '../scripts/rewards.mjs';
import {collectAll} from '../scripts/gear.mjs';
// O filtro de raridade do Relicário precisa valer em todos os modos, não só no treino: cada modo reconstrói o mundo.
const village=()=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1,4:1}});startCampaign(s);for(let i=0;i<200&&s.world.story;i++)nextStory(s);assert.ok(enterVillage(s));return s;};
const item=rarity=>({id:'x'+rarity,rarity,level:1,type:'staff'});

test('filtro de loot sobrevive à entrada em fase, Arena, Expedição e à volta à vila', () => {
 const s=village();updateSettings(s,{lootFilter:'rare'});
 assert.equal(s.world.lootFilter,'rare');
 assert.ok(launchStage(s,1));assert.equal(s.world.lootFilter,'rare','fase da campanha');
 returnAdventure(s);
 assert.ok(launchArena(s));assert.equal(s.world.lootFilter,'rare','Arena');
 returnAdventure(s);
 assert.ok(launchExpedition(s));assert.equal(s.world.lootFilter,'rare','Expedição');
 returnAdventure(s);assert.equal(s.world.lootFilter,'rare','vila');
});

test('peça abaixo do filtro fica oculta e não é coletada em modo de aventura', () => {
 const s=village();updateSettings(s,{lootFilter:'epic'});assert.ok(launchExpedition(s));
 const w=s.world,common=spawnDrop(w,'equipment',w.player.x,w.player.y,{item:item('common')}),epic=spawnDrop(w,'equipment',w.player.x,w.player.y,{item:item('epic')});
 assert.equal(lootAllowed(common,w.lootFilter),false);assert.equal(collect(s,common),false);
 assert.equal(lootAllowed(epic,w.lootFilter),true);
});
