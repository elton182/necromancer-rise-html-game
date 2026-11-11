import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,stepSession,snapshot,castSession} from '../scripts/session.mjs';
import {startCampaign,tickAdventure,returnAdventure,campaignMap} from '../scripts/campaign.mjs';
import {interactWorld,worldDialogueAction,worldDialogue,closeWorldOverlay,toggleWorldMap} from '../scripts/campaign-world.mjs';
import {WORLD_POINTS,WORLD_ROUTES,WORLD_ENCOUNTERS,WORLD_PILES,WORLD_SIZE,normalizeWorld,inWorldVillage,worldObjectives,worldRegion} from '../scripts/campaign-world-model.mjs';
import {builtinMap,toArena,LIMITS} from '../scripts/map-model.mjs';
import {campaignWorldMap} from '../scripts/campaign-world-map.mjs';
import {lineClear,overlaps,moveCircle} from '../scripts/terrain.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {musicTheme} from '../scripts/sound-events.mjs';
const fresh=()=>{const s=createSession();startCampaign(s,{opening:false});return s;};
const go=(s,p)=>{Object.assign(s.world.player,{x:p.x,y:p.y});tickAdventure(s,.1);};
const clear=(s,id)=>{const kill=()=>{for(const e of [...s.world.actors])if(e.worldGroup===id&&e.hp>0)dealDamage(s.world,e,1e6,s.world.player);tickAdventure(s,.1);},g=()=>s.world.adventure.groups.find(g=>g.id===id);kill();for(let i=0;i<30&&g()?.state==='between';i++){g().timer=0;tickAdventure(s,.1);kill();}};
const accept=s=>{go(s,WORLD_POINTS.child);assert.equal(interactWorld(s),true);assert.equal(worldDialogueAction(s),true);};
const rescue=s=>{go(s,WORLD_POINTS.prison);clear(s,'prison-guards');assert.equal(interactWorld(s),true);assert.equal(worldDialogueAction(s),true);};

test('campanha integrada anterior nasce no sarcófago; cenário e pontos de inimigos são os do editor',()=>{
 const s=fresh(),w=s.world,map=builtinMap('builtin:campaign-world');
 assert.equal(s.scene,'training');assert.equal(w.adventure.kind,'campaign-world');assert.equal(w.story,null);assert.equal(w.paused,false);
 assert.equal(w.player.x,WORLD_POINTS.crypt.x);assert.equal(w.player.y,WORLD_POINTS.crypt.y);assert.equal(w.actors.filter(a=>a.team==='enemy').length,0);
 assert.deepEqual(w.arena.solids,toArena(map).solids);assert.deepEqual(map.spawns.filter(g=>WORLD_ENCOUNTERS.some(e=>e.id===g.id)).map(({id,x,y,count,type})=>({id,x,y,count,type})),WORLD_ENCOUNTERS.map(({id,x,y,count,type})=>({id,x,y,count,type})));assert.deepEqual(map.size,{w:WORLD_SIZE,h:WORLD_SIZE});assert.equal(campaignWorldMap().objects.length,map.objects.length);assert.ok(map.objects.length<=LIMITS.maxObjects);
 assert.equal(w.actors.filter(a=>a.worldNpc&&!a.service&&inWorldVillage(a)).length,1);assert.equal(musicTheme(s),'crypt');
});
test('rotas contínuas e NPCs são alcançáveis sem cruzar colisores',()=>{
 const arena=toArena(builtinMap('builtin:campaign-world'));
 for(const route of [[[-98,-86],[-60,-86]],...Object.values(WORLD_ROUTES)])for(let i=1;i<route.length;i++){
  const a={x:route[i-1][0],y:route[i-1][1]},b={x:route[i][0],y:route[i][1]};
  assert.equal(lineClear(a,b,.55,arena),true,JSON.stringify([a,b]));
  const moved=moveCircle(a,{x:b.x-a.x,y:b.y-a.y},.45,arena);assert.ok(Math.hypot(moved.x-b.x,moved.y-b.y)<.01);
 }
 for(const p of Object.values(WORLD_POINTS))assert.equal(overlaps(p,.55,arena),false,p.name);
});
test('encontros são locais; pausa não cria inimigos; Tiro de Osso usa combate e recompensa comuns',()=>{
 const s=fresh(),w=s.world;w.paused=true;go(s,{x:-48,y:-76});assert.equal(w.actors.filter(a=>a.worldGroup).length,0);
 w.paused=false;tickAdventure(s,.1);assert.equal(w.actors.filter(a=>a.worldGroup).length,2,'grupo pequeno, sem multiplicador global');assert.equal(w.adventure.groups[1].state,'dormant');
 const enemy=w.actors.find(a=>a.worldGroup);Object.assign(w.player,{x:enemy.x,y:enemy.y-6});w.aim={x:enemy.x,y:enemy.y};
 assert.equal(castSession(s),true);for(let i=0;i<30;i++)stepSession(s,1/60,{});assert.ok(w.actors.some(a=>a.worldGroup==='forest-a'&&a.hp<a.maxHp),'projétil acerta um inimigo real do grupo');
 const xp=s.save.character.exp;clear(s,'forest-a');assert.ok(s.save.character.exp>xp);assert.equal(w.adventure.groups[0].state,'clear');
});
test('pedido, guardas, libertação e retorno: ordem obrigatória e prêmio único',()=>{
 const s=fresh(),w=s.world;go(s,WORLD_POINTS.prison);assert.ok(interactWorld(s));assert.equal(worldDialogueAction(s),false);closeWorldOverlay(s);
 accept(s);assert.equal(s.save.campaign.world.stage,'rescue');go(s,WORLD_POINTS.prison);
 assert.ok(interactWorld(s));assert.equal(worldDialogueAction(s),false,'não liberta com guardas vivos');closeWorldOverlay(s);
 const guards=w.actors.filter(a=>a.worldGroup==='prison-guards');assert.equal(guards.length,3);
 dealDamage(w,guards[0],1e6,w.player);tickAdventure(s,.1);assert.equal(s.save.campaign.world.guardsCleared,false);
 clear(s,'prison-guards');assert.ok(interactWorld(s));assert.equal(worldDialogueAction(s),true);assert.equal(s.save.campaign.world.stage,'return');
 assert.equal(w.actors.filter(a=>a.worldNpc&&!a.service&&inWorldVillage(a)).length,2);assert.equal(w.landmarks.some(l=>l.key==='mayor'&&l.y<0),false);
 go(s,WORLD_POINTS.mayor);assert.ok(interactWorld(s));const gold=s.save.character.gold;assert.equal(worldDialogue(s).kind,'complete');assert.ok(worldDialogueAction(s));assert.equal(s.save.character.gold,gold+90);assert.equal(s.save.campaign.world.stage,'complete');
 assert.equal(worldDialogueAction(s),false);assert.ok(interactWorld(s));assert.equal(worldDialogue(s).kind,'smith-accept');assert.equal(worldDialogueAction(s),true);assert.equal(s.save.character.gold,gold+90);
});
test('retorno à vila limpa ameaças e rearma só encontros repetíveis',()=>{
 const s=fresh(),w=s.world;go(s,WORLD_ENCOUNTERS[0]);clear(s,'forest-a');assert.equal(w.adventure.groups[0].state,'clear');
 go(s,WORLD_POINTS.child);assert.equal(w.adventure.groups[0].state,'dormant');assert.equal(w.actors.some(a=>a.team==='enemy'),false);assert.equal(s.save.campaign.world.checkpoint,'village');assert.equal(musicTheme(s),'village');
 go(s,WORLD_ENCOUNTERS[0]);assert.equal(w.actors.filter(a=>a.worldGroup==='forest-a'&&a.hp>0).length,2);
 accept(s);rescue(s);go(s,WORLD_POINTS.mayor);go(s,WORLD_POINTS.prison);assert.equal(w.actors.some(a=>a.worldGroup==='prison-guards'),false);
});
test('morte retoma no último abrigo; recarga mantém a missão, sem serializar combate',()=>{
 const s=fresh();s.world.player.hp=0;stepSession(s,.1,{});assert.equal(s.scene,'dead');assert.equal(interactWorld(s),false);returnAdventure(s);assert.equal(s.world.player.x,-98);
 accept(s);s.world.player.hp=0;stepSession(s,.1,{});returnAdventure(s);assert.equal(s.world.player.x,60);assert.equal(s.save.campaign.world.stage,'rescue');
 rescue(s);const saved=snapshot(s);assert.equal(saved.world,undefined);const resumed=createSession(saved);campaignMap(resumed);assert.equal(resumed.save.campaign.world.stage,'return');assert.equal(resumed.world.player.x,60);assert.equal(resumed.world.hostileShots.length,0);
 assert.equal(resumed.world.actors.filter(a=>a.worldNpc&&!a.service&&inWorldVillage(a)).length,2);
});
test('mapa e conversa pausam, fecham sem perder missão e recusam ação à distância',()=>{
 const s=fresh();assert.ok(toggleWorldMap(s));assert.equal(s.world.paused,true);assert.equal(s.world.adventure.mapOpen,true);assert.ok(toggleWorldMap(s));assert.equal(s.world.paused,false);
 go(s,WORLD_POINTS.child);assert.ok(interactWorld(s));assert.equal(toggleWorldMap(s),false);s.world.player.x=0;assert.equal(worldDialogueAction(s),false);closeWorldOverlay(s);assert.equal(s.save.campaign.world.stage,'village');
 assert.deepEqual(normalizeWorld({stage:'invalid'}),{questFlow:1,stage:'wake',checkpoint:'crypt',guardsCleared:false,smith:'locked',lumber:'locked',piles:[0,0,0],cleared:[]});
});
const finish=s=>{accept(s);rescue(s);go(s,WORLD_POINTS.mayor);assert.ok(interactWorld(s));assert.ok(worldDialogueAction(s));};
test('todos os pontos de quest, pilhas e encontros ficam em espaço livre e alcançável',()=>{
 const arena=toArena(builtinMap('builtin:campaign-world'));
 for(const p of [...WORLD_PILES,...WORLD_ENCOUNTERS])assert.equal(overlaps(p,.55,arena),false,p.key||p.id);
 for(const pile of WORLD_PILES)assert.equal(lineClear(WORLD_POINTS.mill,pile,.45,arena),true,pile.key);
 assert.equal(worldRegion(WORLD_POINTS.mine),'Mina de Valfundo');assert.equal(worldRegion(WORLD_POINTS.mill),'Serraria do Vale');assert.equal(worldRegion(WORLD_POINTS.graveyard),'Cemitério antigo');
});
test('grupos misturam tipos, escalam por região e trazem líder de elite',()=>{
 const s=fresh(),w=s.world,g=WORLD_ENCOUNTERS.find(e=>e.id==='mine-guards');go(s,{x:g.x,y:g.y+10});
 const foes=w.actors.filter(a=>a.worldGroup==='mine-guards');assert.equal(foes.length,g.mix.length);
 assert.deepEqual(foes.map(e=>e.typeIndex).sort(),[...g.mix].sort());assert.equal(foes[0].lootTier,'magic');assert.equal(foes[1].gearWave,6,'nível da área (4) mais o bônus limitado do grupo');
 assert.ok(WORLD_ENCOUNTERS.length>=20);assert.ok(new Set(WORLD_ENCOUNTERS.flatMap(e=>e.mix)).size>=8);
});
test('Joaquim oferece o resgate; Bruno exige a mina livre, volta à forja e paga uma vez',()=>{
 const s=fresh(),w=s.world,p=()=>s.save.campaign.world;finish(s);
 assert.equal(p().smith,'available');assert.equal(p().lumber,'locked');go(s,WORLD_POINTS.mayor);assert.ok(interactWorld(s));assert.equal(worldDialogue(s).kind,'smith-accept');assert.ok(worldDialogueAction(s));assert.equal(p().smith,'active');
 go(s,WORLD_POINTS.mine);assert.ok(interactWorld(s));assert.equal(worldDialogueAction(s),false,'bando vivo');closeWorldOverlay(s);
 clear(s,'mine-guards');assert.ok(p().cleared.includes('mine-guards'));assert.ok(interactWorld(s));assert.ok(worldDialogueAction(s));assert.equal(p().smith,'found');
 assert.ok(w.landmarks.some(l=>l.key==='smith'&&inWorldVillage(l)));
 go(s,WORLD_POINTS.forge);go(s,WORLD_POINTS.mine);assert.equal(w.actors.some(a=>a.worldGroup==='mine-guards'),false,'grupo de quest não volta');
 go(s,WORLD_POINTS.forge);assert.ok(interactWorld(s));const gold=s.save.character.gold;assert.ok(worldDialogueAction(s));assert.equal(s.save.character.gold,gold+100);assert.equal(p().smith,'done');
 assert.ok(interactWorld(s));assert.equal(worldDialogue(s).kind,'forge');assert.equal(worldDialogueAction(s),false);assert.equal(s.save.character.gold,gold+100);
});
test('madeira: cada pilha exige seus guardas; Joaquim só paga com as três marcadas',()=>{
 const s=fresh(),w=s.world,p=()=>s.save.campaign.world;finish(s);p().smith='done';p().lumber='active';
 const [a,b,c]=WORLD_PILES;go(s,a);assert.ok(interactWorld(s));assert.equal(worldDialogueAction(s),false,'guardas vivos');closeWorldOverlay(s);
 clear(s,a.guard);assert.ok(interactWorld(s));assert.ok(worldDialogueAction(s));assert.deepEqual(p().piles,[1,0,0]);assert.equal(w.landmarks.some(l=>l.key===a.key),false);
 go(s,WORLD_POINTS.mayor);assert.ok(interactWorld(s));assert.equal(worldDialogue(s).kind,undefined);closeWorldOverlay(s);
 for(const pile of [b,c]){go(s,pile);clear(s,pile.guard);assert.ok(interactWorld(s));assert.ok(worldDialogueAction(s));}
 const gold=s.save.character.gold;go(s,WORLD_POINTS.mayor);assert.ok(interactWorld(s));assert.ok(worldDialogueAction(s));assert.equal(s.save.character.gold,gold+110);assert.equal(p().lumber,'done');
 assert.ok(interactWorld(s));assert.equal(worldDialogueAction(s),false);
 const resumed=createSession(snapshot(s));campaignMap(resumed);assert.deepEqual(resumed.save.campaign.world.piles,[1,1,1]);assert.equal(resumed.save.campaign.world.lumber,'done');
});
test('saves concluídos antes das novas quests recebem os pedidos de Joaquim',()=>{
 assert.deepEqual(normalizeWorld({stage:'complete',guardsCleared:true}),{questFlow:1,stage:'complete',checkpoint:'village',guardsCleared:true,smith:'available',lumber:'locked',piles:[0,0,0],cleared:[]});
 assert.equal(normalizeWorld({stage:'rescue',smith:'done'}).smith,'locked');assert.deepEqual(normalizeWorld({stage:'complete',cleared:['mine-guards','forest-a','x']}).cleared,['mine-guards']);
});
