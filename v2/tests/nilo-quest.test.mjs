import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession} from '../scripts/session.mjs';
import {startCampaign,tickAdventure} from '../scripts/campaign.mjs';
import {travelArea,interactWorld,worldDialogue,worldDialogueAction,closeWorldOverlay,nearbyWorldPerson} from '../scripts/campaign-world.mjs';
import {normalizeWorld,worldObjectives,WORLD_EXITS} from '../scripts/campaign-world-model.mjs';
import {AREAS,areaObjectives,ITAUNA_POINTS} from '../scripts/itauna-model.mjs';
import {NILO_POINTS,NILO_GROUPS,NILO_REWARDS,NILO_STAGES,niloReady} from '../scripts/nilo-model.mjs';
import {niloCast,niloDialogue} from '../scripts/nilo-quest.mjs';
import {builtinMap,toArena,reachable,canReach} from '../scripts/map-model.mjs';
import {overlaps} from '../scripts/terrain.mjs';
import {withIntactVillage} from '../scripts/campaign-world-map.mjs';
import {useCampaignMaps,CAMPAIGN_SLOTS} from '../scripts/campaign-maps.mjs';
import {dealDamage} from '../scripts/combat.mjs';
useCampaignMaps(null,null);

// Campanha saída do prólogo, com os dois pedidos de Joaquim já concluídos.
const ready=()=>{const s=createSession();startCampaign(s,{opening:false});Object.assign(s.save.campaign.world,{stage:'complete',smith:'done',lumber:'done',passengerMissing:true});s.save.campaign.prologue={stage:'done'};travel(s,null,'village');return s;};
const tick=(s,dt=.1)=>tickAdventure(s,dt);
function travel(s,to,entry){s.world.areaTravel={to,entry,name:'teste'};assert.equal(travelArea(s),true);assert.equal(s.world.adventure.area,to||undefined);}
function clear(s,id){
 const w=s.world,g=w.adventure.groups.find(g=>g.id===id);assert.ok(g,id);Object.assign(w.player,{x:g.x,y:g.y});tick(s);
 const kill=()=>{for(const e of [...w.actors])if(e.worldGroup===id&&e.hp>0)dealDamage(w,e,1e7,w.player);tick(s);};
 kill();while(g.state==='between'){g.timer=0;tick(s);kill();}assert.equal(g.state,'clear',id);
}
// Vai até o ponto, abre a conversa e devolve o que ela oferece.
function talk(s,point){
 const w=s.world;Object.assign(w.player,{x:point.x+.8,y:point.y});w.adventure.exitLock=true;tick(s);
 assert.equal(nearbyWorldPerson(s)?.x,point.x,'ponto de interação ao alcance');assert.equal(interactWorld(s),true);return worldDialogue(s);
}
const act=(s,kind)=>{assert.equal(worldDialogue(s).kind,kind);assert.equal(worldDialogueAction(s),true);};

test('etapa salva: ausente equivale a locked e só vale depois do mundo concluído',()=>{
 assert.equal('nilo' in normalizeWorld({stage:'complete'}),false);
 assert.equal(normalizeWorld({stage:'complete',nilo:'cave'}).nilo,'cave');
 assert.equal('nilo' in normalizeWorld({stage:'complete',nilo:'inventado'}),false);
 assert.equal('nilo' in normalizeWorld({stage:'rescue',nilo:'fort'}),false);
 for(const stage of NILO_STAGES.slice(1))assert.equal(normalizeWorld(normalizeWorld({stage:'complete',nilo:stage})).nilo,stage,'idempotente');
});
test('pontos da missão ficam livres, alcançáveis e marcados no editor',()=>{
 const places=[[withIntactVillage(toArena(builtinMap('builtin:campaign-world'))),{x:60,y:64},[NILO_POINTS.marta,NILO_POINTS.nilo]],
  [toArena(builtinMap(AREAS.itauna.ref)),AREAS.itauna.entries.west,[NILO_POINTS.ledger]],
  [toArena(builtinMap(AREAS['itauna-cave'].ref)),AREAS['itauna-cave'].entries.mouth,[NILO_POINTS.cocoon]],
  [toArena(builtinMap(AREAS['itauna-fort'].ref)),AREAS['itauna-fort'].entries.gate,[NILO_POINTS.contract]]];
 for(const [arena,start,points] of places){const r=reachable(arena,start,{step:1});for(const p of points){assert.equal(overlaps(p,.6,arena),false,p.name+' livre');assert.equal(canReach(r,p),true,p.name+' alcançável');}}
 assert.ok(CAMPAIGN_SLOTS.itauna.required.includes(NILO_GROUPS.camp),'o editor não remove o bando do acampamento');
 assert.ok(builtinMap(AREAS.itauna.ref).spawns.some(g=>g.id===NILO_GROUPS.camp));
 for(const [slot,p] of [['world',NILO_POINTS.marta],['itauna',NILO_POINTS.ledger],['itaunaCave',NILO_POINTS.cocoon],['itaunaFort',NILO_POINTS.contract]])assert.ok(CAMPAIGN_SLOTS[slot].points.includes(p),slot);
});
test('Marta só oferece a busca com Jacarandá de pé',()=>{
 const p={stage:'complete',smith:'done',lumber:'active',passengerMissing:true};
 assert.equal(niloReady(p),false);assert.equal(niloDialogue('marta',p).kind,undefined);
 assert.equal(worldObjectives(p)[0].title,'Madeira para Jacarandá','os pedidos de Joaquim guiam a bússola antes');
 p.lumber='done';assert.equal(niloReady(p),true);assert.equal(niloDialogue('marta',p).kind,'nilo-accept');assert.equal(worldObjectives(p)[0].target,NILO_POINTS.marta);
 assert.equal(niloReady({...p,passengerMissing:false}),false,'campanhas sem o prólogo não recebem a missão');
 assert.deepEqual(niloCast('world',{...p,passengerMissing:false}),[]);
});
test('percurso completo: Jacarandá, várzea, gruta, forte e volta, com prêmios únicos',()=>{
 const s=ready(),p=()=>s.save.campaign.world,c=s.save.character;
 assert.ok(s.world.actors.some(a=>a.worldNpc&&a.key==='marta'),'Marta na praça');
 talk(s,NILO_POINTS.marta);act(s,'nilo-accept');assert.equal(p().nilo,'road');
 assert.equal(worldObjectives(p())[0].target,WORLD_EXITS[0],'bússola aponta a estrada da várzea');

 travel(s,'itauna','west');assert.equal(areaObjectives('itauna',p())[0].target,NILO_POINTS.ledger);
 assert.equal(talk(s,NILO_POINTS.ledger).kind,undefined,'o livro exige vencer o bando');closeWorldOverlay(s);
 clear(s,NILO_GROUPS.camp);talk(s,NILO_POINTS.ledger);act(s,'nilo-ledger');assert.equal(p().nilo,'cave');
 assert.equal(s.world.landmarks.some(l=>l.key==='nilo-ledger'),false,'livro lido sai da cena');
 assert.equal(areaObjectives('itauna',p())[0].target,ITAUNA_POINTS.caveMouth);

 travel(s,'itauna-cave','mouth');assert.ok(s.world.actors.some(a=>a.worldNpc&&a.key==='nilo-cocoon'),'João preso na gruta');
 assert.equal(talk(s,NILO_POINTS.cocoon).kind,undefined,'casulo exige a Mãe-Tecelã');closeWorldOverlay(s);
 clear(s,NILO_GROUPS.cave);const gold=c.gold;talk(s,NILO_POINTS.cocoon);act(s,'nilo-rescue');
 assert.equal(p().nilo,'fort');assert.equal(c.gold,gold+NILO_REWARDS.rescue.gold);assert.equal(s.world.actors.some(a=>a.key==='nilo-cocoon'),false);

 travel(s,'itauna-fort','gate');assert.equal(areaObjectives('itauna-fort',p())[0].title,'O contrato da Pedra Negra');
 for(const id of ['fort-gate','fort-west','fort-east'])clear(s,id);
 assert.equal(talk(s,NILO_POINTS.contract).kind,undefined,'mesa exige o capitão');closeWorldOverlay(s);
 clear(s,NILO_GROUPS.fort);talk(s,NILO_POINTS.contract);act(s,'nilo-contract');assert.equal(p().nilo,'return');

 // Recarregar no meio do caminho preserva a etapa.
 assert.equal(normalizeWorld(JSON.parse(JSON.stringify(p()))).nilo,'return');
 travel(s,null,'itauna');assert.equal(worldObjectives(p())[0].target,NILO_POINTS.nilo);
 assert.ok(s.world.actors.some(a=>a.worldNpc&&a.key==='nilo'),'João voltou à praça');
 const before={gold:c.gold,exp:c.exp,level:c.level};talk(s,NILO_POINTS.nilo);act(s,'nilo-done');
 assert.equal(p().nilo,'done');assert.equal(c.gold,before.gold+NILO_REWARDS.done.gold);assert.ok(c.level>before.level||c.exp>before.exp,'XP concedido');
 assert.equal(talk(s,NILO_POINTS.nilo).kind,undefined,'o prêmio final não se repete');closeWorldOverlay(s);
 assert.equal(talk(s,NILO_POINTS.marta).kind,undefined);
});
test('quem chega à gruta antes de ler o livro também liberta João',()=>{
 const s=ready();talk(s,NILO_POINTS.marta);act(s,'nilo-accept');
 travel(s,'itauna','west');travel(s,'itauna-cave','mouth');clear(s,NILO_GROUPS.cave);talk(s,NILO_POINTS.cocoon);act(s,'nilo-rescue');
 assert.equal(s.save.campaign.world.nilo,'fort');
 travel(s,'itauna','cave');assert.equal(s.world.landmarks.some(l=>l.key==='nilo-ledger'),false,'o livro deixa de importar');
 assert.equal(areaObjectives('itauna',s.save.campaign.world)[0].target,ITAUNA_POINTS.fortGate);
});
