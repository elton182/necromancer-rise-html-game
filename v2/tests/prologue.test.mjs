import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,stepSession,snapshot,castSession,dashSession} from '../scripts/session.mjs';
import {startCampaign,campaignMap,tickAdventure,returnAdventure} from '../scripts/campaign.mjs';
import {interactPrologue,nextPrologueDialogue} from '../scripts/prologue.mjs';
import {normalizePrologue,travelLine} from '../scripts/prologue-model.mjs';
import {prologueArena} from '../scripts/prologue-map.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {lineClear,overlaps} from '../scripts/terrain.mjs';
const fresh=()=>{const s=createSession();startCampaign(s);return s;};
const talk=s=>{for(let i=0;i<10&&s.world.adventure?.dialogue;i++)assert.ok(nextPrologueDialogue(s));};
const clear=s=>{for(const e of [...s.world.actors])if(e.prologueEnemy&&e.hp>0)dealDamage(s.world,e,1e8,s.world.player);tickAdventure(s,.1);};
const go=(s,x,y)=>Object.assign(s.world.player,{x,y});
const cave=s=>{talk(s);clear(s);talk(s);for(let i=0;i<22;i++)stepSession(s,.25,{x:1,y:1});assert.equal(s.save.campaign.prologue.stage,'cave');talk(s);};
test('nova campanha começa na caravana; saves sem prólogo mantêm fluxo anterior',()=>{
 const s=fresh();assert.equal(s.save.campaign.prologue.stage,'travel');assert.equal(s.world.adventure.kind,'prologue');assert.equal(s.world.paused,true);assert.ok(s.world.adventure.intro);assert.ok(s.world.arena.caravans.length);
 const old=createSession();startCampaign(old,{opening:false});const resumed=createSession(snapshot(old));campaignMap(resumed);assert.equal(resumed.world.adventure.kind,'campaign-world');assert.equal(resumed.save.campaign.prologue,null);
});
test('defesa, flecha roteirizada, pista, mensageiro, vila e recompensa única',()=>{
 const s=fresh();talk(s);assert.equal(s.save.campaign.prologue.stage,'ambush');clear(s);assert.equal(s.save.campaign.prologue.stage,'farewell');talk(s);assert.equal(s.save.campaign.prologue.stage,'fall');
 const hp=s.world.player.hp,x=s.world.player.x;for(let i=0;i<10;i++)stepSession(s,.25,{x:1,y:1});assert.equal(s.world.player.hp,hp);assert.equal(s.world.player.x,x);assert.ok(s.world.adventure.fall>0);
 const elapsed=s.world.adventure.elapsed;s.world.paused=true;stepSession(s,.25,{});assert.equal(s.world.adventure.elapsed,elapsed);s.world.paused=false;for(let i=0;i<12;i++)stepSession(s,.25,{});
 assert.equal(s.save.campaign.prologue.stage,'cave');talk(s);go(s,0,-22);assert.equal(interactPrologue(s),false);go(s,0,0);assert.equal(interactPrologue(s),false);clear(s);assert.ok(interactPrologue(s));talk(s);assert.equal(s.save.campaign.prologue.clue,true);
 go(s,0,-22);assert.ok(interactPrologue(s));talk(s);assert.equal(s.save.campaign.prologue.stage,'trail');go(s,0,-8);assert.equal(interactPrologue(s),false);clear(s);assert.ok(interactPrologue(s));talk(s);assert.equal(s.save.campaign.prologue.stage,'defense');clear(s);assert.equal(s.save.campaign.prologue.stage,'reunion');const before=s.save.character.gold;talk(s);assert.equal(s.save.character.gold,before+90);assert.equal(s.world.adventure.kind,'campaign-world');assert.equal(s.save.campaign.world.stage,'complete');assert.equal(s.save.campaign.world.passengerMissing,true);const gold=s.save.character.gold;returnAdventure(s);assert.equal(s.save.character.gold,gold);assert.equal(nextPrologueDialogue(s),false);
});
test('morte e reload retomam trecho; pista e vitória da caverna persistem',()=>{
 const s=fresh();cave(s);clear(s);go(s,0,0);interactPrologue(s);talk(s);const saved=snapshot(s),restored=createSession(saved);campaignMap(restored);assert.equal(restored.save.campaign.prologue.clue,true);assert.equal(restored.world.actors.filter(a=>a.prologueEnemy).length,0);assert.equal(restored.world.player.y,165);assert.equal(restored.world.adventure.dialogue,null);
 restored.world.player.hp=0;stepSession(restored,.1,{});assert.equal(restored.scene,'dead');returnAdventure(restored);assert.equal(restored.save.campaign.prologue.stage,'cave');assert.ok(restored.world.player.hp>0);
 assert.equal(normalizePrologue({stage:'impossível'}).stage,'travel');assert.equal(normalizePrologue(null),null);
});
test('caverna e estrada possuem percurso e nascimentos livres',()=>{
 const cave=prologueArena('cave'),route=[{x:0,y:165},{x:36,y:165},{x:36,y:125},{x:-8,y:125},{x:-44,y:125},{x:-44,y:85},{x:0,y:85},{x:0,y:45},{x:0,y:5},{x:-3,y:3},{x:-3,y:-5},{x:0,y:-10},{x:0,y:-22}];for(let i=1;i<route.length;i++)assert.ok(lineClear(route[i-1],route[i],.55,cave));
 for(const stage of ['ambush','cave','trail','defense']){const s=fresh();s.save.campaign.prologue.stage=stage;campaignMap(s);for(const a of s.world.actors)assert.equal(overlaps(a,a.radius,s.world.arena),false,stage+' '+a.key);}
});


test('viagem mantém passageiros a bordo, bloqueia combate e freia na chamada do cocheiro',()=>{
 const s=fresh();nextPrologueDialogue(s);const w=s.world,j=w.adventure.journey,startY=j.y,mp=w.player.mp;
 assert.equal(castSession(s),false);assert.equal(dashSession(s),false);assert.equal(w.player.mp,mp);
 stepSession(s,.25,{x:1,y:1});assert.ok(j.y<startY);assert.equal(w.player.x,.6);assert.equal(w.player.y,j.y+.65);
 for(const a of w.actors)assert.ok(a.ride||a.journeyHorse);assert.ok(w.player.jumpZ>.9);
 const distance=j.distance;w.paused=true;stepSession(s,.25,{});assert.equal(j.distance,distance);assert.equal(nextPrologueDialogue(s),false);w.paused=false;
 for(let i=0;i<5;i++)nextPrologueDialogue(s);assert.equal(w.adventure.dialogue.index,5);assert.equal(j.braking,true);assert.ok(j.blockY<j.y);
 for(let i=0;i<8;i++)stepSession(s,.25,{});assert.equal(j.speed,0);
 const line=travelLine(6,'<Araci>');assert.ok(line.text.includes('<Araci>'));assert.equal(line.actor,'driver');
 nextPrologueDialogue(s);assert.equal(s.save.campaign.prologue.stage,'travel');nextPrologueDialogue(s);assert.equal(s.save.campaign.prologue.stage,'ambush');assert.equal(s.world.adventure.cinematic,false);
});


test('introdução congela a viagem e sua leitura persiste sem afetar saves anteriores',()=>{
 const s=fresh(),distance=s.world.adventure.journey.distance;
 stepSession(s,.25,{});assert.equal(s.world.adventure.journey.distance,distance);
 s.world.paused=false;stepSession(s,.25,{});assert.equal(s.world.adventure.journey.distance,distance);
 assert.ok(nextPrologueDialogue(s));assert.equal(s.save.campaign.prologue.introRead,true);assert.equal(s.world.adventure.dialogue.index,0);
 const loaded=createSession(snapshot(s));campaignMap(loaded);assert.equal(loaded.world.adventure.intro,undefined);assert.equal(loaded.world.paused,false);
 assert.equal(normalizePrologue({stage:'travel'}).introRead,true);
});


test('caverna revela a ocupação antes da lista e preserva a conversa dos guardas',()=>{
 const s=fresh();cave(s);assert.equal(s.world.adventure.name,'Sob a estrada');assert.equal(s.save.campaign.prologue.caveHeard,false);
 const guard=s.world.actors.find(a=>a.prologueEnemy);assert.ok(guard.home);assert.equal(guard.alert,false);
 go(s,0,84);tickAdventure(s,.1);assert.equal(s.world.adventure.dialogue.key,'cave_whispers');assert.equal(s.world.paused,true);talk(s);assert.equal(s.save.campaign.prologue.caveHeard,true);assert.equal(s.save.campaign.prologue.clue,false);assert.equal(s.world.adventure.name,'Galeria ocupada');
 go(s,5,7);assert.ok(interactPrologue(s));assert.equal(s.world.adventure.dialogue.key,'cargo');const gold=s.save.character.gold;talk(s);assert.equal(s.save.character.gold,gold);
 const saved=snapshot(s),loaded=createSession(saved);campaignMap(loaded);talk(loaded);go(loaded,0,12);tickAdventure(loaded,.1);assert.equal(loaded.world.adventure.dialogue,null);
 assert.equal(normalizePrologue({stage:'cave',clue:true}).caveHeard,true);assert.equal(normalizePrologue({stage:'cave',caveCleared:true}).caveHeard,true);
});


test('Jacarandá salva mantém a planta intacta ao entrar e recarregar o mundo',async()=>{
 const {WORLD_POINTS}=await import('../scripts/campaign-world-model.mjs');
 const {villageArena}=await import('../scripts/village-map.mjs');
 const {findPath}=await import('../scripts/terrain.mjs');
 const s=fresh();s.save.campaign.prologue.stage='reunion';campaignMap(s);talk(s);
 const expected=villageArena().solids.filter(o=>o.look==='house').map(o=>[o.x+60,o.y+64,o.width,o.depth]);
 for(const state of [s,createSession(snapshot(s))]){
  if(state!==s)campaignMap(state);
  const arena=state.world.arena;assert.ok(arena.settlement);
  assert.deepEqual(arena.solids.filter(o=>o.settlement&&o.look==='house').map(o=>[o.x,o.y,o.width,o.depth]),expected);
  for(const p of Object.values(WORLD_POINTS))assert.equal(overlaps(p,.55,arena),false,p.name);
  for(const key of ['mayor','forge','mine','mill','graveyard'])assert.ok(findPath(WORLD_POINTS.village,WORLD_POINTS[key],.45,arena).length,key);
  assert.equal(state.save.campaign.world.passengerMissing,true);
 }
});
