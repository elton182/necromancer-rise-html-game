import {questMarkerFor} from './quest-model.mjs';
import {villageServices} from './village-services.mjs';
import {clean} from './campaign.mjs';
import {builtinMap,toArena} from './map-model.mjs';
import {withIntactVillage} from './campaign-world-map.mjs';
import {WORLD_POINTS,WORLD_ENCOUNTERS,WORLD_PILES,WORLD_EXITS,WORLD_ARRIVALS,normalizeWorld,inWorldVillage,worldObjective} from './campaign-world-model.mjs';
import {AREAS,areaEntry,areaObjectives,gateOpen,gateSolid,clearNotice,ITAUNA_NAMES,LEADER_NAMES,ITAUNA_QUEST_GROUPS} from './itauna-model.mjs';
import {editedCampaignMap} from './campaign-maps.mjs';
import {tuneGroups,AREA_LEVELS,addRouteEncounters} from './area-tuning.mjs';
import {makeGroups,tickGroups} from './map-spawns.mjs';
import {grantExperience} from './rewards.mjs';
import {collectAll} from './gear.mjs';
import {niloCast,niloDialogue,niloAction,isNiloAction,NILO_KEYS} from './nilo-quest.mjs';

const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
// Grupos de quest derrotados não voltam; os demais rearmam ao retornar à vila.
const groupCleared=(p,g)=>g.quest&&(g.id==='prison-guards'?p.guardsCleared:p.cleared.includes(g.id));
const groupState=(p,g)=>groupCleared(p,g)?'clear':'dormant';
export const isWorld=s=>s.world.adventure?.kind==='campaign-world';
// O que é missão vem sempre do jogo, não do mapa: a edição muda onde e como o grupo aparece, não o que a história espera dele.
// Nível da área, densidade e renascimento vêm de area-tuning.mjs. Grupo vencido nesta saída volta só depois do tempo de renascimento.
const remember=(g,run)=>run.has(g.id)?{state:'clear',timer:g.respawn||0}:{};
const worldGroups=(spawns,p,run,mapLevel)=>makeGroups(tuneGroups(addRouteEncounters(spawns,'world').map(s=>({...s,quest:QUEST_IDS.has(s.id)})),{area:'world',mapLevel})).map(g=>({...g,state:groupState(p,g),...remember(g,run)}));
// Loot do nível do grupo que gerou o inimigo (área + bônus do grupo); sem grupo, vale o nível da área em `w.gearLevel`.
const groupLootLevel=e=>e?.gearWave;
const QUEST_IDS=new Set(WORLD_ENCOUNTERS.filter(e=>e.quest).map(e=>e.id));
const AREA_QUESTS=new Set(ITAUNA_QUEST_GROUPS);
// `memory`: grupos já vencidos nesta saída, que seguem derrotados ao passar de um mapa a outro; rearmam ao voltar à vila.
export function launchWorld(s,{arrival=null,memory=null}={}){
 const progress=s.save.campaign.world=normalizeWorld(s.save.campaign.world||{});
 if(progress.area)return launchArea(s,progress.area,progress.entry,memory);
 const edited=editedCampaignMap('world'),map=edited||builtinMap('builtin:campaign-world'),point=WORLD_POINTS[progress.checkpoint],start=arrival||(progress.checkpoint==='crypt'&&edited?map.start:point);
 const arena=toArena(map),savedVillage=s.save.campaign.prologue?.stage==='done',world=savedVillage?withIntactVillage(arena):arena;world.exits=WORLD_EXITS;
 clean(s,world,{x:start.x,y:start.y});
 const w=s.world,run=new Set(memory||[]);s.scene='training';w.paused=false;w.gearLevel=AREA_LEVELS.world;w.lootLevelOf=groupLootLevel;w.aim={x:start.x+5,y:start.y};
 w.adventure={kind:'campaign-world',name:'Jacarandá · O despertar',done:false,queue:[],zones:[],groups:worldGroups(map.spawns,progress,run,map.level),level:AREA_LEVELS.world,inVillage:inWorldVillage(start),dialogue:null,mapOpen:false,clearedRun:run,exitLock:true};
 w.portal=progress.checkpoint==='village'?{x:60,y:64}:null;
 syncWorldPeople(s);w.notice=worldObjective(progress).text;return true;
}
// Área fora do mundo de Jacarandá: mesmo modo de jogo, com mapa, grupos e objetivos próprios. A plantas são editáveis como as demais.
function launchArea(s,area,entry,memory){
 const def=AREAS[area],progress=s.save.campaign.world,map=editedCampaignMap(def.slot)||builtinMap(def.ref),arena=toArena(map),start=areaEntry(area,entry),run=new Set(memory||[]);
 arena.exits=def.exits;arena.gates=(def.gates||[]).map(g=>({...g,open:gateOpen(g,progress.cleared)}));
 for(const g of arena.gates)if(!g.open)arena.solids=[...arena.solids,gateSolid(g)];
 clean(s,arena,{x:start.x,y:start.y});
 const w=s.world;s.scene='training';w.paused=false;w.gearLevel=AREA_LEVELS[area]||1;w.lootLevelOf=groupLootLevel;w.aim={x:start.x+5,y:start.y};
 const groups=makeGroups(tuneGroups(addRouteEncounters(map.spawns,area).map(g=>({...g,quest:AREA_QUESTS.has(g.id)})),{area,mapLevel:map.level})).map(g=>({...g,state:g.quest&&progress.cleared.includes(g.id)?'clear':'dormant',...remember(g,run)}));
 w.adventure={kind:'campaign-world',area,name:def.name,done:false,queue:[],zones:[],groups,level:AREA_LEVELS[area],inVillage:false,dialogue:null,mapOpen:false,clearedRun:run,exitLock:true};
 syncWorldPeople(s);w.notice=def.name+' · '+areaObjectives(area,progress)[0].title;return true;
}
const exitsOf=w=>w.arena.exits||[];
export const nearbyExit=(w,r=14)=>exitsOf(w).filter(e=>near(e,w.player,r)).sort((a,b)=>Math.hypot(a.x-w.player.x,a.y-w.player.y)-Math.hypot(b.x-w.player.x,b.y-w.player.y))[0]||null;
// Pisar no anel pede a viagem; o aplicativo escurece a tela e chama `travelArea`. A chegada fica fora do anel, e a trava só solta depois de sair dele.
function checkExits(s){
 const w=s.world,r=w.adventure,inside=exitsOf(w).find(e=>near(e,w.player,e.r));
 if(r.exitLock){if(!inside)r.exitLock=false;return false;}
 if(!inside)return false;
 w.areaTravel={to:inside.to,entry:inside.entry,name:inside.name};w.paused=true;return true;
}
export function travelArea(s){
 const w=s.world,t=w.areaTravel;if(!t)return false;w.areaTravel=null;
 // Chegar à vila pelo teleporte é chegar ao abrigo: os grupos dos arredores rearmam, como ao entrar nela a pé.
 const p=s.save.campaign.world,memory=t.entry==='village'?null:w.adventure?.clearedRun;
 if(t.to){p.area=t.to;p.entry=t.entry;launchWorld(s,{memory});}
 else{delete p.area;delete p.entry;launchWorld(s,{arrival:WORLD_ARRIVALS[t.entry]||null,memory});}
 s.world.progressChanged=true;return true;
}
// Teleporte à vila: leva à praça de Jacarandá de qualquer ponto do mundo ou das áreas ligadas, com a mesma passagem escura.
// Só depois de chegar à vila uma vez, e nunca com inimigo em combate por perto: fugir de uma luta continua custando correr.
export const HOME_DANGER=16;
export function homeTeleport(s){
 const w=s.world,r=w.adventure,p=s.save.campaign.world;
 if(!isWorld(s)||w.player.hp<=0||w.areaTravel)return {ok:false,reason:''};
 if(p.checkpoint!=='village')return {ok:false,reason:'Chegue a Jacarandá uma vez para liberar o retorno.'};
 if(!r.area&&r.inVillage)return {ok:false,reason:'Você já está na vila.'};
 const p0=w.player,danger=w.actors.some(a=>a.team==='enemy'&&a.hp>0&&(!a.home||a.alert)&&Math.hypot(a.x-p0.x,a.y-p0.y)<HOME_DANGER);
 if(danger)return {ok:false,reason:'Inimigos em combate por perto: afaste-se para voltar à vila.'};
 return {ok:true,reason:''};
}
export function teleportHome(s){
 const w=s.world,check=homeTeleport(s);if(!check.ok){if(check.reason)w.notice=check.reason;return false;}
 if(w.adventure.dialogue||w.adventure.mapOpen)closeWorldOverlay(s);
 w.areaTravel={to:null,entry:'village',name:'Vila de Jacarandá'};w.paused=true;return true;
}
// Volta ao abrigo pelo menu: esquece a última passagem. A morte, não: retoma na entrada do mapa em que o jogador estava.
export function forgetArea(s){const p=s.save.campaign.world;if(p){delete p.area;delete p.entry;}}
function nameGroup(w,g){
 for(const a of w.actors){if(a.worldGroup!==g.id)continue;const name=a.lootTier&&a.lootTier===g.leader&&LEADER_NAMES[g.id]||ITAUNA_NAMES[a.typeIndex];if(name){a.name=name;a.type={...a.type,name};}}
}
function tickGates(s){
 const w=s.world,p=s.save.campaign.world;
 for(const g of w.arena.gates||[]){if(g.open||!gateOpen(g,p.cleared))continue;g.open=true;w.arena.solids=w.arena.solids.filter(o=>o.gateId!==g.id);w.notice='A grade do pátio interno sobe. O caminho até a torre está aberto.';}
}
function tickArea(s,dt){
 const w=s.world,r=w.adventure,p=s.save.campaign.world;
 if(checkExits(s))return;
 tickGroups(w,r.groups,dt,{level:r.level||1,onRelease:g=>nameGroup(w,g),onClear:g=>{
  r.clearedRun.add(g.id);
  if(g.quest&&!p.cleared.includes(g.id)){p.cleared.push(g.id);w.progressChanged=true;}
  const text=clearNotice(g.id);if(text)w.notice=text;
 }});
 tickGates(s);syncAreaPeople(s);
}
function syncWorldPeople(s){
 const w=s.world,p=s.save.campaign.world,r=w.adventure;
 if(r.area)return syncAreaPeople(s);
 const home=['return','complete'].includes(p.stage),cast=[{key:'child',...WORLD_POINTS.child,model:'npcTilda',visualScale:.65}];
 // O cativo existe no posto desde o início, mas só é libertado depois do pedido e da derrota dos guardas.
 cast.push({key:'mayor',...(home?WORLD_POINTS.mayor:WORLD_POINTS.prison),name:home?'Joaquim, o prefeito':'Joaquim, prefeito prisioneiro',model:'npcBram',visualScale:1});
 // Bruno espera na mina até ser encontrado; depois fica na forja da vila.
 const forge=['found','done'].includes(p.smith);
 cast.push({key:'smith',...(forge?WORLD_POINTS.forge:WORLD_POINTS.mine),name:forge?'Bruno, o ferreiro':'Bruno, ferreiro escondido',model:'npcBran',visualScale:1,showName:forge,serviceTitle:'Ferraria'});
 // Pilhas de madeira: pontos de interação sem modelo próprio (o cenário já mostra as toras).
 cast.push(...villageServices(true));
 WORLD_PILES.forEach((pile,i)=>{if(p.lumber==='active'&&!p.piles[i])cast.push({...pile});});
 cast.push(...niloCast('world',p));
 const signature=[home,forge,p.smith,p.lumber,p.piles.join(''),p.nilo||'',p.guardsCleared,p.cleared.join(',')].join('|');if(r.people===signature)return;r.people=signature;
 placePeople(s,cast);
}
// Pessoas e marcadores das áreas ligadas: hoje, só os de O rastro de João.
function syncAreaPeople(s){
 const w=s.world,p=s.save.campaign.world,r=w.adventure,cast=niloCast(r.area,p),signature=[r.area,p.nilo,p.niloLetter,p.niloEvidence,p.cleared.join(',')].join('|');
 if(r.people===signature)return;r.people=signature;placePeople(s,cast);
}
function placePeople(s,cast){
 const w=s.world,p=s.save.campaign.world;cast=cast.map(l=>({...l,questMarker:questMarkerFor(l.key,p)}));
 w.actors=w.actors.filter(a=>!a.worldNpc);w.landmarks=cast;
 for(const l of cast.filter(l=>l.model))w.actors.push({...l,id:w.nextId++,worldNpc:true,team:'neutral',radius:.35,hp:1,maxHp:1,angle:Math.PI,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,abilityLabel:l.name,labelTime:999});
}
const GROUP_NOTICES={'prison-guards':'O prefeito está no posto. Derrote os três guardas.','mine-guards':'O bando da mina avança, liderado por um Orc. Cuidado com o golpe de maça.','graveyard':'Magos vivos guardam o cemitério. Afaste-se das áreas marcadas.'};
export function nearbyWorldPerson(s){return s.world.landmarks.filter(l=>near(l,s.world.player,3.2)).sort((a,b)=>Math.hypot(a.x-s.world.player.x,a.y-s.world.player.y)-Math.hypot(b.x-s.world.player.x,b.y-s.world.player.y))[0]||null;}
function villageArrival(s){
 const w=s.world,r=w.adventure,p=s.save.campaign.world;
 if(p.stage==='wake')p.stage='village';p.checkpoint='village';w.portal={x:60,y:64};
 // Retornar ao abrigo encerra os encontros dos arredores. Só renascem ao explorar de novo.
 collectAll(s);w.actors=w.actors.filter(a=>a.team!=='enemy');w.hostileShots=[];w.hostileZones=[];w.projectiles=[];w.allyShots=[];w.effects=[];r.clearedRun?.clear();
 for(const g of r.groups){g.state=groupState(p,g);g.wavesLeft=g.waves||1;g.timer=g.trigger==='timer'?g.delay||0:0;}
 w.notice='Vila de Jacarandá · abrigo alcançado. Os arredores voltam a ser povoados ao sair.';w.progressChanged=true;
}
export function tickWorld(s,dt=1/60){
 const w=s.world,r=w.adventure,p=s.save.campaign.world;if(!isWorld(s)||w.paused||w.player.hp<=0)return;
 if(r.area)return tickArea(s,dt);
 const safe=inWorldVillage(w.player);
 if(safe&&!r.inVillage)villageArrival(s);r.inVillage=safe;
 if(checkExits(s))return;
 tickGroups(w,r.groups,dt,{level:r.level||1,blocked:safe,onRelease:g=>{w.notice=GROUP_NOTICES[g.id]||'Inimigos à frente · clique para atacar; use Dash para esquivar.';},onClear:g=>{
   r.clearedRun?.add(g.id);
   if(g.id==='prison-guards'){p.guardsCleared=true;w.progressChanged=true;w.notice='Posto livre · aproxime-se do prefeito e pressione G.';}
   else if(g.quest){if(!p.cleared.includes(g.id))p.cleared.push(g.id);w.progressChanged=true;w.notice=g.id==='mine-guards'?(p.smith==='active'?'Mina livre · Bruno está na entrada.':'Mina livre · alguém se esconde na entrada.'):(p.lumber==='active'?'Guardas derrotados · a pilha pode ser marcada com G.':'Guardas derrotados · a madeira da serraria ficou livre.');}
 }});
 syncWorldPeople(s);
}
export function interactWorld(s){
 const w=s.world,r=w.adventure;if(!isWorld(s)||s.scene!=='training'||w.paused||w.player.hp<=0)return false;
 const npc=nearbyWorldPerson(s);if(!npc||npc.service)return false;
 // Conversar pausa o jogo; o resgate exige que o encontro tenha sido efetivamente vencido.
 r.dialogue=npc.key;r.mapOpen=false;w.boltCharge=null;w.paused=true;return true;
}
export function worldDialogue(s){
 const p=s.save.campaign.world,key=s.world.adventure.dialogue;
 if(NILO_KEYS.has(key))return niloDialogue(key,p,{run:s.world.adventure.clearedRun});
 if(key==='smith')return smithDialogue(p,['found','done'].includes(p.smith));
 const pile=WORLD_PILES.find(x=>x.key===key);if(pile)return pileDialogue(s,pile);
 if(key==='child'){
  if(['wake','village'].includes(p.stage))return {title:'Lili · uma voz entre as ruínas',text:'Você saiu da cripta? Eu me escondi quando eles vieram. Levaram Joaquim, nosso prefeito, para o velho posto ao norte. Ele tentou proteger a gente… Por favor, traga ele de volta.',action:'Aceitar · resgatar o prefeito',kind:'accept'};
  return {title:'Lili',text:p.stage==='rescue'?'O posto fica ao norte. Siga a trilha entre as duas colunas quebradas. Joaquim está preso no fundo.':'Você trouxe Joaquim de volta! Agora não estou mais sozinha.'};
 }
 if(p.stage==='wake'||p.stage==='village')return {title:'Joaquim · prisioneiro',text:'A criança… Lili ficou na vila. Veja se ela está bem. Ainda há guardas por aqui.'};
 if(p.stage==='rescue')return p.guardsCleared?{title:'Joaquim · prefeito de Jacarandá',text:'Achei que ninguém viria. Obrigado por me soltar. Conheço um atalho seguro; vou encontrar Lili na praça. Venha falar comigo quando voltar.',action:'Libertar Joaquim',kind:'rescue'}:{title:'Joaquim · prisioneiro',text:'Os guardas ainda vigiam o posto. Derrote os três antes de me libertar.'};
 if(p.stage==='return')return {title:'Joaquim · de volta a Jacarandá',text:'Lili me contou tudo. A vila está em ruínas, mas ainda podemos reconstruí-la. Precisamos de duas coisas: Bruno, nosso ferreiro, fugiu para a Mina de Valfundo, ao norte do posto; e a madeira cortada ficou na Serraria do Vale, a sudoeste. Aceite o pouco que guardei.',action:'Concluir resgate · 90 ouro e 120 XP',kind:'complete'};
 if(p.stage==='complete'&&p.smith==='available')return {title:'Joaquim · o ferreiro de Jacarandá',text:'Bruno se refugiou na Mina de Valfundo, ao norte do posto. Um bando tomou a entrada e ele não consegue voltar. Sem o ferreiro, ficaremos sem ferramentas e sem defesa. Você pode abrir o caminho e trazê-lo de volta?',action:'Aceitar missão · O ferreiro de Jacarandá',kind:'smith-accept'};
 if(p.stage==='complete'&&p.lumber==='available')return {title:'Joaquim · madeira para Jacarandá',text:'A forja voltou a funcionar. Agora precisamos cobrir as casas antes da chuva. Há três pilhas de madeira na Serraria do Vale, a sudoeste, mas os caminhos estão tomados. Marque as pilhas depois de afastar os guardas; eu mandarei os lenhadores buscá-las.',action:'Aceitar missão · Madeira para Jacarandá',kind:'lumber-accept'};
 if(p.lumber==='active'&&p.piles.every(Boolean))return {title:'Joaquim · prefeito de Jacarandá',text:'Três pilhas marcadas! Os lenhadores vão buscá-las com as carroças. Com essa madeira cobrimos as casas antes das chuvas.',action:'Entregar a madeira · 110 ouro e 160 XP',kind:'lumber'};
 const tasks=[p.smith==='active'?'encontre Bruno na Mina de Valfundo, ao norte do posto':p.smith==='found'?'fale com Bruno na forja':null,p.lumber==='active'?'marque as pilhas de madeira na Serraria do Vale, a sudoeste':null].filter(Boolean);
 if(tasks.length)return {title:'Joaquim · prefeito de Jacarandá',text:'Jacarandá ainda precisa de você: '+tasks.join('; ')+'. Os caminhos saem da praça para o norte e para o oeste.'};
 return {title:'Joaquim · prefeito de Jacarandá',text:'Forja acesa e madeira a caminho. Os sobreviventes começam a voltar. Ainda há ameaças nos arredores; novas histórias de Jacarandá virão.'};
}
function smithDialogue(p,atForge){
 if(atForge){
  if(p.smith==='found')return {title:'Bruno · forja de Jacarandá',text:'A forja está fria, mas o fole ainda funciona. Me dê um momento e reacendo o fogo. Com a forja acesa, posso cuidar das suas armas e reforçar suas defesas.',action:'Reacender a forja · 100 ouro e 150 XP',kind:'smith'};
  return {title:'Bruno, o ferreiro',text:'O fogo está aceso. Traga o que encontrar nos arredores e vamos ver o que presta.',action:'Abrir a forja · equipamentos',kind:'forge'};
 }
 if(p.smith!=='active')return {title:'Bruno · escondido na mina',text:'Quem está aí? Se Joaquim estiver vivo, diga a ele que estou aqui. Não saio enquanto esse bando rondar a mina.'};
 if(!p.cleared.includes('mine-guards'))return {title:'Bruno · escondido na mina',text:'O Orc e os ladrões ainda estão na entrada. Derrote o bando e eu saio.'};
 return {title:'Bruno · Mina de Valfundo',text:'Joaquim mandou você? Então Jacarandá ainda resiste. Vou voltar pela trilha da mina e reacender a forja. Me encontre lá.',action:'Mandar Bruno para a vila',kind:'smith-found'};
}
function pileDialogue(s,pile){
 const p=s.save.campaign.world,g=s.world.adventure.groups.find(g=>g.id===pile.guard);
 if(p.lumber!=='active')return {title:pile.name,text:'Toras cortadas e abandonadas. Joaquim saberá onde usá-las.'};
 if(g?.state!=='clear'&&!p.cleared.includes(pile.guard))return {title:pile.name,text:'Há guardas rondando a pilha. Derrote-os antes de marcar a madeira.'};
 return {title:pile.name,text:'Toras secas e bem empilhadas. Uma fita vermelha basta para os lenhadores de Jacarandá saberem o que buscar.',action:'Marcar a pilha para transporte',kind:'pile'};
}
export function closeWorldOverlay(s){if(!isWorld(s))return;s.world.adventure.dialogue=null;s.world.adventure.mapOpen=false;s.world.paused=false;}
export function toggleWorldMap(s){
 if(!isWorld(s)||s.scene!=='training'||s.world.player.hp<=0)return false;
 const w=s.world,r=w.adventure;if(r.dialogue||w.paused&&!r.mapOpen)return false;
 if(r.mapOpen)closeWorldOverlay(s);else{r.mapOpen=true;w.paused=true;w.boltCharge=null;}return true;
}
export function worldDialogueAction(s){
 const w=s.world,r=w.adventure,p=s.save.campaign.world;if(!isWorld(s)||!r.dialogue||s.scene!=='training'||w.player.hp<=0)return false;
 const npc=nearbyWorldPerson(s);if(npc?.key!==r.dialogue)return false;
 const action=worldDialogue(s).kind;
 if(action==='accept')p.stage='rescue';
 else if(action==='rescue')p.stage='return';
 else if(action==='complete'){p.stage='complete';p.smith='available';p.lumber='locked';s.save.character.gold+=90;grantExperience(s,120);}
 else if(action==='smith-accept'&&p.smith==='available')p.smith='active';
 else if(action==='lumber-accept'&&p.lumber==='available')p.lumber='active';
 else if(action==='smith-found')p.smith='found';
 else if(action==='smith'){p.smith='done';if(p.lumber==='locked')p.lumber='available';s.save.character.gold+=100;grantExperience(s,150);}
 else if(action==='pile')p.piles[WORLD_PILES.findIndex(x=>x.key===r.dialogue)]=1;
 else if(action==='lumber'){p.lumber='done';s.save.character.gold+=110;grantExperience(s,160);}
 else if(!(isNiloAction(action)&&niloAction(s,action)))return false;
 closeWorldOverlay(s);if(w.areaTravel)w.paused=true;syncWorldPeople(s);w.notice=r.area?areaObjectives(r.area,p)[0].text:worldObjective(p).text;w.progressChanged=true;return true;
}
