import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSession} from '../scripts/session.mjs';
import {startCampaign,tickAdventure,returnAdventure} from '../scripts/campaign.mjs';
import {travelArea,forgetArea,nearbyExit,homeTeleport,teleportHome,HOME_DANGER} from '../scripts/campaign-world.mjs';
import {WORLD_EXITS,WORLD_ARRIVALS,WORLD_POINTS,normalizeWorld} from '../scripts/campaign-world-model.mjs';
import {AREAS,AREA_IDS,ITAUNA_POINTS,FORT_POINTS,CAVE_POINTS,FORT_GATE,areaObjectives,areaRegion,gateOpen,isArea} from '../scripts/itauna-model.mjs';
import {itaunaMap,fortMap,caveMap,ITAUNA_RIVERS} from '../scripts/itauna-map.mjs';
import {builtinMap,toArena,reachable,canReach,resolveMap,normalizeMap,LIMITS,ENEMY_TYPE_COUNT} from '../scripts/map-model.mjs';
import {useCampaignMaps,CAMPAIGN_SLOTS,checkCampaignMap,campaignDocument} from '../scripts/campaign-maps.mjs';
import {overlaps,moveCircle} from '../scripts/terrain.mjs';
import {heightAt,TERRAIN_RULES,groundAt,terrainSpeed} from '../scripts/map-terrain.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {inVillageHub} from '../scripts/village-services.mjs';
import {musicTheme} from '../scripts/sound-events.mjs';
import {spawnTypes} from '../scripts/map-spawns.mjs';
import {tuneGroups,AREA_LEVELS,DENSITY} from '../scripts/area-tuning.mjs';
import {withIntactVillage} from '../scripts/campaign-world-map.mjs';
import {WORLD_ENCOUNTERS,WORLD_PILES} from '../scripts/campaign-world-model.mjs';
import {launchMap,travelTestMap,isCustomMap} from '../scripts/map-play.mjs';
useCampaignMaps(null,null);
const REFS={itauna:'builtin:itauna','itauna-fort':'builtin:itauna-fort','itauna-cave':'builtin:itauna-cave'};
const started=()=>{const s=createSession();startCampaign(s,{opening:false});s.save.campaign.world.stage='complete';return s;};
const tick=(s,dt=.1)=>tickAdventure(s,dt);
const at=(s,p)=>{Object.assign(s.world.player,{x:p.x,y:p.y});s.world.adventure.exitLock=false;tick(s);};
const enter=(s,area,entry)=>{s.world.areaTravel={to:area,entry,name:'teste'};assert.equal(travelArea(s),true);assert.equal(s.world.adventure.area,area);};
const clear=(s,id)=>{const w=s.world,g=w.adventure.groups.find(g=>g.id===id);assert.ok(g,id);Object.assign(w.player,{x:g.x,y:g.y});tick(s);for(const e of [...w.actors])if(e.worldGroup===id&&e.hp>0)dealDamage(w,e,1e7,w.player);tick(s);while(g.state==='between'){g.timer=0;tick(s);for(const e of [...w.actors])if(e.worldGroup===id&&e.hp>0)dealDamage(w,e,1e7,w.player);tick(s);}assert.equal(g.state,'clear',id);};

test('plantas são determinísticas e cabem nos limites do editor',()=>{
 for(const make of [itaunaMap,fortMap,caveMap]){
  const raw=make(),{map,problems}=normalizeMap(raw);
  assert.deepEqual(make(),raw,'mesma planta a cada geração');assert.deepEqual(problems,[]);
  assert.ok(map.objects.length===raw.objects.length&&map.objects.length<=LIMITS.maxObjects,map.name+' cabe no limite de peças');
  assert.ok(map.size.w<=LIMITS.maxSize&&map.size.h<=LIMITS.maxSize);assert.ok(map.spawns.length<=LIMITS.maxSpawns);
  assert.ok(map.terrain,'relevo preservado');assert.equal(new Set(map.objects.map(o=>o.id)).size,map.objects.length);
  for(const g of map.spawns)for(const t of spawnTypes(g))assert.ok(t>=0&&t<ENEMY_TYPE_COUNT);
 }
 const rivers=builtinMap('builtin:itauna').terrain.rivers;assert.equal(rivers.length,ITAUNA_RIVERS.length);
 const types=m=>new Set(builtinMap(m).spawns.flatMap(spawnTypes));
 // Forte só de humanos, gruta só de lobos e aranhas. Bruto (2) e Acólito (5) estão fora de uso nos modos.
 assert.deepEqual([...types('builtin:itauna-fort')].sort(),[0,1,3,6,9]);assert.deepEqual([...types('builtin:itauna-cave')].sort(),[4,8]);
 for(const ref of Object.values(REFS))for(const t of types(ref))assert.ok(t!==2&&t!==5);
});
test('todo caminho da história é alcançável a pé e as chegadas ficam fora dos anéis',()=>{
 for(const id of AREA_IDS){
  const def=AREAS[id],map=builtinMap(def.ref),arena=toArena(map),start=Object.values(def.entries)[0],r=reachable(arena,start,{step:1});
  assert.equal(r.blocked,false,id);
  for(const e of Object.values(def.entries)){assert.equal(canReach(r,e),true,id+' chegada');assert.equal(overlaps(e,.55,arena),false,id+' chegada livre');for(const x of def.exits)assert.ok(Math.hypot(e.x-x.x,e.y-x.y)>x.r+1,id+' chegada fora do anel '+x.id);}
  for(const x of def.exits)assert.equal(canReach(r,x),true,id+' saída '+x.id);
  for(const g of map.spawns)assert.equal(canReach(r,g),true,id+' grupo '+g.id);
 }
 const open=reachable(toArena(builtinMap(REFS.itauna)),AREAS.itauna.entries.west,{step:1});
 for(const p of Object.values(ITAUNA_POINTS))assert.equal(canReach(open,p),true,p.name);
});
test('rio e lagos têm travessias legíveis: ponte seca, vau lento, fundo bloqueado',()=>{
 const arena=toArena(builtinMap(REFS.itauna)),{x:bx,y:by}=ITAUNA_POINTS.bridge,{x:fx,y:fy}=ITAUNA_POINTS.ford;
 assert.ok(heightAt(arena,10,-16)<TERRAIN_RULES.deep,'leito fundo ao lado da ponte');assert.ok(groundAt(arena,bx,by)>.3,'tabuleiro acima da água');
 assert.equal(terrainSpeed(arena,bx,by),1,'ponte não atrasa');
 const blocked=moveCircle({x:-2,y:-16},{x:24,y:0},.45,arena);assert.ok(blocked.x<8,'o rio fundo segura quem tenta cruzar fora da ponte');
 const bridge=moveCircle({x:-4,y:-4},{x:28,y:0},.45,arena);assert.ok(bridge.x>20,'a ponte atravessa');
 const ford=moveCircle({x:fx-12,y:fy},{x:24,y:0},.45,arena);assert.ok(ford.x>fx+8,'o vau atravessa');
 assert.ok(heightAt(arena,fx,fy)<TERRAIN_RULES.wet&&heightAt(arena,fx,fy)>TERRAIN_RULES.deep,'vau é água rasa');assert.ok(terrainSpeed(arena,fx,fy)<.75,'vau é mais lento');
 assert.ok(heightAt(arena,-14,130)<TERRAIN_RULES.deep,'centro do lago bloqueia');assert.ok(arena.terrain.blocks.length>100);
 // O píer é o único caminho seco até a ilhota.
 assert.ok(groundAt(arena,-24,91)>=.5,'píer sobre a água');assert.equal(overlaps({x:-24,y:91},.45,arena),false);assert.equal(overlaps({x:-10,y:91},.45,arena),heightAt(arena,-10,91)<TERRAIN_RULES.deep);
 // Encosta do forte: sobe pela rampa e o penhasco cerca o platô.
 assert.ok(heightAt(arena,105,-72)>4.5);assert.equal(overlaps({x:108,y:-52},.45,arena),false);
 assert.ok(arena.terrain.blocks.some(b=>Math.abs(b.x-60)<20&&Math.abs(b.y+108)<30),'penhasco a oeste do platô');
});
test('save: saves anteriores continuam no mundo; área inválida é ignorada e a passagem é lembrada',()=>{
 assert.equal('area' in normalizeWorld({stage:'complete'}),false);
 assert.equal(normalizeWorld({stage:'complete',area:'nada',entry:'x'}).area,undefined);
 assert.deepEqual((({area,entry})=>({area,entry}))(normalizeWorld({stage:'complete',area:'itauna-fort',entry:'gate'})),{area:'itauna-fort',entry:'gate'});
 assert.deepEqual(normalizeWorld({stage:'complete',cleared:['fort-captain','inventado','cave-queen']}).cleared,['fort-captain','cave-queen']);
 assert.equal(isArea('toString'),false);
});
test('estrada de Jacarandá: pisar no anel pede a viagem, chega na várzea e volta pelo mesmo caminho',()=>{
 const s=started(),w=s.world,exit=WORLD_EXITS[0];
 assert.equal(w.adventure.area,undefined);assert.ok(w.arena.exits.includes(exit));assert.equal(nearbyExit(w),null);
 at(s,exit);assert.equal(w.paused,true);assert.deepEqual(w.areaTravel,{to:'itauna',entry:'west',name:'Várzea de Itaúna'});
 assert.equal(travelArea(s),true);assert.equal(w.areaTravel,null);assert.equal(w.paused,false);
 assert.equal(w.adventure.area,'itauna');assert.equal(w.adventure.kind,'campaign-world');assert.deepEqual({x:w.player.x,y:w.player.y},{x:AREAS.itauna.entries.west.x,y:AREAS.itauna.entries.west.y});
 assert.equal(s.save.campaign.world.area,'itauna');assert.equal(w.progressChanged,true);
 assert.equal(w.landmarks.length,0,'os NPCs da vila ficam na vila');assert.equal(musicTheme(s),'forest');
 // Trava: quem chega não volta sem querer; só depois de sair do anel a passagem vale de novo.
 Object.assign(w.player,AREAS.itauna.exits[0]);w.adventure.exitLock=true;tick(s);assert.equal(w.areaTravel,null);assert.equal(w.adventure.exitLock,true);
 Object.assign(w.player,{x:-150,y:18});tick(s);assert.equal(w.adventure.exitLock,false);
 Object.assign(w.player,{x:AREAS.itauna.exits[0].x,y:AREAS.itauna.exits[0].y});tick(s);assert.equal(w.areaTravel.to,null);
 travelArea(s);assert.equal(w.adventure.area,undefined);assert.equal('area' in s.save.campaign.world,false);assert.deepEqual({x:w.player.x,y:w.player.y},{x:WORLD_ARRIVALS.itauna.x,y:WORLD_ARRIVALS.itauna.y});
});
test('coordenadas da vila não valem em outra área: nada de abrigo nem serviços na várzea',()=>{
 const s=started(),w=s.world;enter(s,'itauna','west');
 Object.assign(w.player,{x:WORLD_POINTS.village.x,y:WORLD_POINTS.village.y});tick(s);
 assert.equal(inVillageHub(s),false);assert.equal(w.adventure.inVillage,false);
 assert.equal(areaRegion('itauna',ITAUNA_POINTS.camp),ITAUNA_POINTS.camp.name);assert.equal(areaRegion('itauna',{x:-170,y:150}),'Várzea de Itaúna');
});
test('grupos vencidos seguem derrotados ao trocar de mapa e rearmam ao voltar à vila',()=>{
 const s=started(),w=s.world;enter(s,'itauna','west');
 clear(s,'road-west');enter(s,'itauna-cave','mouth');assert.equal(w.adventure.groups.find(g=>g.id==='den-pack-a').state,'dormant');
 enter(s,'itauna','cave');assert.equal(w.adventure.groups.find(g=>g.id==='road-west').state,'clear','memória da saída');
 w.areaTravel={to:null,entry:'itauna',name:'x'};travelArea(s);Object.assign(w.player,WORLD_POINTS.village);tick(s);assert.equal(w.adventure.inVillage,true);
 assert.equal(w.adventure.clearedRun.size,0);
 enter(s,'itauna','west');assert.equal(w.adventure.groups.find(g=>g.id==='road-west').state,'dormant','rearmou na vila');
});
test('gruta usa lobos nomeados e líder único; a Mãe-Tecelã não volta depois de derrotada',()=>{
 const s=started(),w=s.world;enter(s,'itauna-cave','mouth');
 assert.equal(w.arena.cave,true);assert.equal(musicTheme(s),'crypt');
 Object.assign(w.player,{x:8,y:46});tick(s);const wolf=w.actors.find(a=>a.worldGroup==='den-pack-a');assert.equal(wolf.typeIndex,4);assert.equal(wolf.name,'Lobo');assert.equal(wolf.type.name,'Lobo');
 assert.equal(w.actors.filter(a=>a.team==='enemy').every(a=>[4,8].includes(a.typeIndex)),true);
 clear(s,'cave-queen');assert.ok(s.save.campaign.world.cleared.includes('cave-queen'));assert.equal(w.progressChanged,true);
 assert.equal(areaObjectives('itauna-cave',s.save.campaign.world)[0].target,CAVE_POINTS.exit);
 enter(s,'itauna','cave');enter(s,'itauna-cave','mouth');assert.equal(w.adventure.groups.find(g=>g.id==='cave-queen').state,'clear');
});
test('grade do forte fecha o pátio interno até os três grupos caírem e continua aberta na volta',()=>{
 const s=started(),w=s.world;enter(s,'itauna-fort','gate');
 const gate=()=>w.arena.gates[0],below={x:0,y:12},above={x:0,y:0};
 assert.equal(gate().open,false);assert.ok(w.arena.solids.some(o=>o.gateId===FORT_GATE.id));assert.equal(overlaps({x:0,y:6},.45,w.arena),true,'a grade é um colisor real');
 const closed=reachable(w.arena,AREAS['itauna-fort'].entries.gate,{step:1});assert.equal(canReach(closed,below),true);assert.equal(canReach(closed,above),false,'sem outro caminho até a torre');assert.equal(canReach(closed,FORT_POINTS.keep),false);
 assert.equal(areaObjectives('itauna-fort',s.save.campaign.world)[0].target,FORT_POINTS.inner);
 clear(s,'fort-gate');clear(s,'fort-west');assert.equal(gate().open,false,'faltando um grupo a grade não sobe');
 clear(s,'fort-east');assert.equal(gate().open,true);assert.equal(w.arena.solids.some(o=>o.gateId===FORT_GATE.id),false);assert.match(w.notice,/grade/);
 const opened=reachable(w.arena,AREAS['itauna-fort'].entries.gate,{step:1});assert.equal(canReach(opened,FORT_POINTS.keep),true);
 assert.equal(gateOpen(FORT_GATE,s.save.campaign.world.cleared),true);
 enter(s,'itauna','fort');enter(s,'itauna-fort','gate');assert.equal(gate().open,true,'a grade fica aberta para sempre');assert.equal(w.arena.solids.some(o=>o.gateId===FORT_GATE.id),false);
 clear(s,'fort-captain');assert.equal(w.actors.some(a=>a.worldGroup==='fort-captain'&&a.hp>0),false);assert.equal(areaObjectives('itauna-fort',s.save.campaign.world)[0].target,FORT_POINTS.gate);
 assert.equal(areaObjectives('itauna',s.save.campaign.world).some(o=>o.title==='Forte da Pedra Negra'),false);
});
test('morte retoma na entrada do mapa; voltar ao abrigo pelo menu esquece a passagem',()=>{
 const s=started(),w=s.world;enter(s,'itauna-fort','gate');
 w.player.hp=0;returnAdventure(s);assert.equal(w.adventure.area,'itauna-fort');assert.equal(w.player.y,AREAS['itauna-fort'].entries.gate.y);assert.ok(w.player.hp>0);
 forgetArea(s);returnAdventure(s);assert.equal(w.adventure.area,undefined);assert.equal('area' in s.save.campaign.world,false);
});
test('plantas entram no editor da campanha, com a história conferida; a edição publicada do mundo mantém a estrada livre',()=>{
 for(const [slot,ref] of [['itauna',REFS.itauna],['itaunaFort',REFS['itauna-fort']],['itaunaCave',REFS['itauna-cave']]]){
  assert.equal(CAMPAIGN_SLOTS[slot].ref,ref);const doc=campaignDocument(slot);assert.equal(doc.campaign,slot);
  assert.deepEqual(checkCampaignMap(doc),[],slot+' sem avisos da história');
 }
 const published=JSON.parse(fs.readFileSync(new URL('../assets/maps/campaign-world.json',import.meta.url)));
 const {map}=resolveMap(normalizeMap(published).map,()=>null),arena=toArena(map),r=reachable(arena,WORLD_POINTS.village,{step:1});
 assert.equal(canReach(r,WORLD_EXITS[0]),true,'da vila até a passagem');assert.equal(canReach(r,WORLD_ARRIVALS.itauna),true);
 assert.equal(overlaps(WORLD_ARRIVALS.itauna,.55,arena),false);
});
test('Testar do editor percorre as passagens e a grade, sem tocar no save da campanha',()=>{
 const s=createSession(),before=JSON.stringify(s.save.campaign);
 assert.equal(launchMap(s,campaignDocument('world'),()=>null).ok,true);const w=s.world;
 assert.equal(isCustomMap(s),true);assert.deepEqual(w.arena.exits,WORLD_EXITS);
 Object.assign(w.player,{x:WORLD_EXITS[0].x,y:WORLD_EXITS[0].y});w.adventure.exitLock=false;tick(s);
 assert.equal(w.paused,true);assert.equal(w.areaTravel.to,'itauna');assert.equal(travelTestMap(s),true);
 assert.equal(isCustomMap(s),true);assert.equal(w.adventure.mapId,'campaign-itauna');assert.equal(w.paused,false);assert.equal(w.player.x,AREAS.itauna.entries.west.x);assert.equal(w.player.y,AREAS.itauna.entries.west.y);
 // A chegada não dispara a volta; atravessar para o forte chega com a grade fechada, e ela sobe quando os grupos caem.
 tick(s);assert.equal(w.areaTravel,null);
 Object.assign(w.player,{x:ITAUNA_POINTS.fortGate.x,y:ITAUNA_POINTS.fortGate.y});w.adventure.exitLock=false;tick(s);assert.equal(travelTestMap(s),true);
 assert.equal(w.adventure.mapId,'campaign-itaunaFort');assert.equal(w.arena.gates[0].open,false);assert.equal(overlaps({x:0,y:6},.45,w.arena),true);
 for(const id of FORT_GATE.requires)clear(s,id);
 assert.equal(w.arena.gates[0].open,true);assert.equal(overlaps({x:0,y:6},.45,w.arena),false);
 assert.equal(JSON.stringify(s.save.campaign.world??null),JSON.stringify(JSON.parse(before).world??null));
 // Mapa pessoal, sem vaga na campanha, continua sem passagens.
 const free=createSession();assert.equal(launchMap(free,builtinMap('builtin:forest'),()=>null).ok,true);assert.equal(free.world.arena.exits,undefined);assert.deepEqual(free.world.arena.gates,[]);
});
test('teleporte à vila: leva à praça de qualquer área, mas não no meio de uma luta nem antes de conhecer a vila',()=>{
 const s=started(),w=s.world,p=s.save.campaign.world;
 p.checkpoint='crypt';assert.equal(homeTeleport(s).ok,false);assert.equal(teleportHome(s),false);assert.match(w.notice,/Jacarandá/);
 p.checkpoint='village';Object.assign(w.player,WORLD_POINTS.village);tick(s);assert.equal(w.adventure.inVillage,true);assert.equal(homeTeleport(s).ok,false,'já está na vila');
 enter(s,'itauna-fort','gate');clear(s,'fort-gate');assert.equal(homeTeleport(s).ok,true);
 // Inimigo alerta por perto bloqueia; parado longe ou ocioso não.
 const g=w.adventure.groups.find(g=>g.id==='fort-west');Object.assign(w.player,{x:g.x,y:g.y});tick(s);const e=w.actors.find(a=>a.worldGroup==='fort-west'&&a.hp>0);
 e.alert=true;Object.assign(w.player,{x:e.x+HOME_DANGER-2,y:e.y});assert.equal(teleportHome(s),false);assert.match(w.notice,/afaste-se/);
 Object.assign(w.player,{x:e.x+HOME_DANGER+2,y:e.y});assert.equal(homeTeleport(s).ok,true);
 assert.equal(teleportHome(s),true);assert.equal(w.paused,true);assert.equal(w.areaTravel.entry,'village');
 assert.equal(travelArea(s),true);assert.equal(w.adventure.area,undefined);assert.equal('area' in s.save.campaign.world,false);
 assert.deepEqual({x:w.player.x,y:w.player.y},{x:WORLD_POINTS.village.x,y:WORLD_POINTS.village.y});assert.equal(w.adventure.inVillage,true);assert.equal(w.adventure.clearedRun.size,0);
 assert.ok(s.save.campaign.world.cleared.includes('fort-gate'),'o progresso permanente fica');
 // Prólogo e Testar do editor não têm o botão.
 const t=createSession();t.save.campaign.prologue={stage:'cave'};startCampaign(t,{opening:false});assert.equal(homeTeleport(t).ok,false);
});
test('níveis por área, seis vezes mais inimigos por grupo e renascimento só fora das missões',()=>{
 assert.deepEqual(AREA_LEVELS,{world:10,itauna:20,'itauna-cave':30,'itauna-fort':40});assert.equal(DENSITY.count*DENSITY.waves,6);
 const [g]=tuneGroups([{id:'a',x:0,y:0,count:3,type:0,mix:[0,1,0],level:3,waves:1}],{area:'world',mapLevel:1});
 assert.deepEqual(g.mix,[0,1,0,0,1,0]);assert.equal(g.count,6);assert.equal(g.waves,3);assert.equal(g.level,12,'bônus do grupo sobre o nível da área');assert.equal(g.respawn,DENSITY.respawn);
 assert.equal(tuneGroups([{id:'q',x:0,y:0,count:2,type:0,mix:null,level:1,quest:true}],{area:'world',mapLevel:1})[0].respawn,0,'missão não volta');
 assert.equal(tuneGroups([{id:'z',x:0,y:0,count:30,type:0,mix:null}],{area:'itauna'})[0].count,30,'limite do editor');
 const s=started(),w=s.world;assert.equal(w.adventure.level,10);assert.ok(w.adventure.groups.every(g=>g.level>=10&&g.level<=14));
 for(const [area,entry,low,high] of [['itauna','west',20,22],['itauna-cave','mouth',30,32],['itauna-fort','gate',40,42]]){enter(s,area,entry);assert.ok(w.adventure.groups.every(g=>g.level>=low&&g.level<=high),area);}
 // Grupo comum vencido renasce depois do tempo, com o jogador longe; o do forte (missão) não.
 enter(s,'itauna','west');clear(s,'road-west');const g2=w.adventure.groups.find(g=>g.id==='road-west');assert.equal(g2.state,'clear');
 Object.assign(w.player,{x:-168,y:22});for(let i=0;i<DENSITY.respawn*10+5;i++)tick(s);assert.equal(g2.state,'dormant');
 Object.assign(w.player,{x:g2.x,y:g2.y});tick(s);assert.ok(w.actors.some(a=>a.worldGroup==='road-west'&&a.hp>0),'volta a atacar');
 const e=w.actors.find(a=>a.worldGroup==='road-west');assert.equal(e.gearWave,20);
});
test('loot do mundo da campanha segue o nível do grupo do inimigo, não o nível 1',()=>{
 const s=started(),w=s.world;assert.equal(w.gearLevel,AREA_LEVELS.world);
 // Sem equipamento vestido a recuperação de nível pode somar até +10; o piso é o nível do grupo (ou da área).
 const dropFrom=(enemy)=>{w.drops=[];w.random=()=>0;w.onEnemyDeath(enemy,w.player);return w.drops.find(d=>d.kind==='equipment')?.item;};
 const inRange=(item,level,label)=>{assert.ok(item,label);assert.ok(item.level>=level&&item.level<=level+10,label+': '+item.level+' para nível '+level);};
 for(const [area,entry,group] of [[null,null,null],['itauna','west','road-west'],['itauna-fort','gate',null]]){
  if(area)enter(s,area,entry);assert.equal(w.gearLevel,AREA_LEVELS[area||'world'],'sem grupo vale o nível da área');
  const g=group?w.adventure.groups.find(x=>x.id===group):w.adventure.groups.find(x=>x.state==='dormant');Object.assign(w.player,{x:g.x,y:g.y});w.adventure.exitLock=false;tick(s);
  const e=w.actors.find(a=>a.worldGroup===g.id&&a.hp>0);assert.ok(e,g.id);assert.equal(e.gearWave,g.level);
  inRange(dropFrom({...e,rewarded:false}),g.level,(area||'world')+' · grupo');
  inRange(dropFrom({xp:1,x:w.player.x,y:w.player.y}),AREA_LEVELS[area||'world'],(area||'world')+' · sem grupo');
 }
});
test('relevo de Jacarandá: regiões variadas sem bloquear a história, também na edição publicada',()=>{
 const map=builtinMap('builtin:campaign-world'),arena=toArena(map);
 assert.ok(map.terrain&&arena.terrain.blocks.length>50,'há penhascos');assert.ok(map.objects.length<=LIMITS.maxObjects);
 const kinds=new Set(Array.from(arena.terrain.s));for(const k of [3,4,5])assert.ok(kinds.has(k),'superfície '+k);
 assert.ok(heightAt(arena,30,-140)>2.5,'mina nas terras altas');assert.ok(heightAt(arena,-150,154)<TERRAIN_RULES.deep,'lagoa da baixada');assert.ok(Math.abs(heightAt(arena,60,64)-.3)<.05,'vila nivelada');
 const published=JSON.parse(fs.readFileSync(new URL('../assets/maps/campaign-world.json',import.meta.url)));
 const {map:flat}=resolveMap(normalizeMap(published).map,()=>null);assert.equal(flat.terrain.rivers.length,1,'o rio da edição continua');
 for(const a of [toArena(flat),withIntactVillage(toArena(flat))]){const r=reachable(a,WORLD_POINTS.crypt,{step:1});for(const p of [...Object.values(WORLD_POINTS),...WORLD_ENCOUNTERS,...WORLD_PILES,...WORLD_EXITS,...Object.values(WORLD_ARRIVALS)])assert.equal(canReach(r,p),true,p.name||p.id||p.key);}
});
