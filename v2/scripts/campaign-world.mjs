import {villageServices} from './village-services.mjs';
import {clean} from './campaign.mjs';
import {builtinMap,toArena} from './map-model.mjs';
import {withIntactVillage} from './campaign-world-map.mjs';
import {WORLD_POINTS,WORLD_ENCOUNTERS,WORLD_PILES,normalizeWorld,inWorldVillage,worldObjective} from './campaign-world-model.mjs';
import {spawnEnemy} from './enemies.mjs';
import {grantExperience} from './rewards.mjs';
import {collectAll} from './gear.mjs';

const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
// Grupos de quest derrotados não voltam; os demais rearmam ao retornar à vila.
const groupCleared=(p,g)=>g.quest&&(g.id==='prison-guards'?p.guardsCleared:p.cleared.includes(g.id));
const groupState=(p,g)=>groupCleared(p,g)?'clear':'dormant';
export const isWorld=s=>s.world.adventure?.kind==='campaign-world';
export function launchWorld(s){
 const progress=s.save.campaign.world=normalizeWorld(s.save.campaign.world||{});
 const map=builtinMap('builtin:campaign-world'),start=WORLD_POINTS[progress.checkpoint];
 const arena=toArena(map),savedVillage=s.save.campaign.prologue?.stage==='done';
 clean(s,savedVillage?withIntactVillage(arena):arena,{x:start.x,y:start.y});
 const w=s.world;s.scene='training';w.paused=false;w.gearLevel=1;w.aim={x:start.x+5,y:start.y};
 w.adventure={kind:'campaign-world',name:'Jacarandá · O despertar',done:false,queue:[],zones:[],groups:WORLD_ENCOUNTERS.map(e=>({...e,state:groupState(progress,e)})),inVillage:inWorldVillage(start),dialogue:null,mapOpen:false};
 w.portal=progress.checkpoint==='village'?{x:60,y:64}:null;
 syncWorldPeople(s);w.notice=worldObjective(progress).text;return true;
}
function syncWorldPeople(s){
 const w=s.world,p=s.save.campaign.world,r=w.adventure;
 const home=['return','complete'].includes(p.stage),cast=[{key:'child',...WORLD_POINTS.child,model:'npcTilda',visualScale:.65}];
 // O cativo existe no posto desde o início, mas só é libertado depois do pedido e da derrota dos guardas.
 cast.push({key:'mayor',...(home?WORLD_POINTS.mayor:WORLD_POINTS.prison),name:home?'Oren, o prefeito':'Oren, prefeito prisioneiro',model:'npcBram',visualScale:1});
 // Bran espera na mina até ser encontrado; depois fica na forja da vila.
 const forge=['found','done'].includes(p.smith);
 cast.push({key:'smith',...(forge?WORLD_POINTS.forge:WORLD_POINTS.mine),name:forge?'Bran, o ferreiro':'Bran, ferreiro escondido',model:'npcBran',visualScale:1});
 // Pilhas de madeira: pontos de interação sem modelo próprio (o cenário já mostra as toras).
 cast.push(...villageServices(true));
 WORLD_PILES.forEach((pile,i)=>{if(!p.piles[i])cast.push({...pile});});
 const signature=[home,forge,p.piles.join('')].join('|');if(r.people===signature)return;r.people=signature;
 w.actors=w.actors.filter(a=>!a.worldNpc);w.landmarks=cast;
 for(const l of cast.filter(l=>l.model))w.actors.push({...l,id:w.nextId++,worldNpc:true,team:'neutral',radius:.35,hp:1,maxHp:1,angle:Math.PI,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,abilityLabel:l.name,labelTime:999});
}
const GROUP_NOTICES={'prison-guards':'O prefeito está no posto. Derrote os três guardas.','mine-guards':'O bando da mina avança, liderado por um Orc. Cuidado com o golpe de maça.','graveyard':'Magos vivos guardam o cemitério. Afaste-se das áreas marcadas.'};
export function nearbyWorldPerson(s){return s.world.landmarks.filter(l=>near(l,s.world.player,3.2)).sort((a,b)=>Math.hypot(a.x-s.world.player.x,a.y-s.world.player.y)-Math.hypot(b.x-s.world.player.x,b.y-s.world.player.y))[0]||null;}
function villageArrival(s){
 const w=s.world,r=w.adventure,p=s.save.campaign.world;
 if(p.stage==='wake')p.stage='village';p.checkpoint='village';w.portal={x:60,y:64};
 // Retornar ao abrigo encerra os encontros dos arredores. Só renascem ao explorar de novo.
 collectAll(s);w.actors=w.actors.filter(a=>a.team!=='enemy');w.hostileShots=[];w.hostileZones=[];w.projectiles=[];w.allyShots=[];w.effects=[];
 for(const g of r.groups)g.state=groupState(p,g);
 w.notice='Vila de Jacarandá · abrigo alcançado. Os arredores voltam a ser povoados ao sair.';w.progressChanged=true;
}
export function tickWorld(s){
 const w=s.world,r=w.adventure,p=s.save.campaign.world;if(!isWorld(s)||w.paused||w.player.hp<=0)return;
 const safe=inWorldVillage(w.player);
 if(safe&&!r.inVillage)villageArrival(s);r.inVillage=safe;
 if(!safe)for(const g of r.groups){
  if(g.state==='dormant'&&near(w.player,g,18)){
   g.state='active';
   const types=g.mix||Array(g.count).fill(g.type);
   types.forEach((type,i)=>{const a=i*Math.PI*2/types.length+.6,e=spawnEnemy(w,type,g.x+Math.cos(a)*2.2,g.y+Math.sin(a)*2.2,{wave:g.wave||1,tier:i===0&&g.leader||'common'});Object.assign(e,{worldGroup:g.id,home:{x:e.x,y:e.y},alert:false});});
   w.notice=GROUP_NOTICES[g.id]||'Inimigos à frente · clique para atacar; use Dash para esquivar.';
  }
  if(g.state==='active'&&!w.actors.some(a=>a.worldGroup===g.id&&a.hp>0)){
   g.state='clear';
   if(g.id==='prison-guards'){p.guardsCleared=true;w.progressChanged=true;w.notice='Posto livre · aproxime-se do prefeito e pressione G.';}
   else if(g.quest){if(!p.cleared.includes(g.id))p.cleared.push(g.id);w.progressChanged=true;w.notice=g.id==='mine-guards'?(p.smith==='active'?'Mina livre · Bran está na entrada.':'Mina livre · alguém se esconde na entrada.'):(p.lumber==='active'?'Guardas derrotados · a pilha pode ser marcada com G.':'Guardas derrotados · a madeira da serraria ficou livre.');}
  }
 }
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
 if(key==='smith')return smithDialogue(p,['found','done'].includes(p.smith));
 const pile=WORLD_PILES.find(x=>x.key===key);if(pile)return pileDialogue(s,pile);
 if(key==='child'){
  if(['wake','village'].includes(p.stage))return {title:'Lia · uma voz entre as ruínas',text:'Você saiu da cripta? Eu me escondi quando eles vieram. Levaram Oren, nosso prefeito, para o velho posto ao norte. Ele tentou proteger a gente… Por favor, traga ele de volta.',action:'Aceitar · resgatar o prefeito',kind:'accept'};
  return {title:'Lia',text:p.stage==='rescue'?'O posto fica ao norte. Siga a trilha entre as duas colunas quebradas. Oren está preso no fundo.':'Você trouxe Oren de volta! Agora não estou mais sozinha.'};
 }
 if(p.stage==='wake'||p.stage==='village')return {title:'Oren · prisioneiro',text:'A criança… Lia ficou na vila. Veja se ela está bem. Ainda há guardas por aqui.'};
 if(p.stage==='rescue')return p.guardsCleared?{title:'Oren · prefeito de Jacarandá',text:'Achei que ninguém viria. Obrigado por me soltar. Conheço um atalho seguro; vou encontrar Lia na praça. Venha falar comigo quando voltar.',action:'Libertar Oren',kind:'rescue'}:{title:'Oren · prisioneiro',text:'Os guardas ainda vigiam o posto. Derrote os três antes de me libertar.'};
 if(p.stage==='return')return {title:'Oren · de volta a Jacarandá',text:'Lia me contou tudo. A vila está em ruínas, mas ainda podemos reconstruí-la. Precisamos de duas coisas: Bran, nosso ferreiro, fugiu para a Mina de Valfundo, ao norte do posto; e a madeira cortada ficou na Serraria do Vale, a sudoeste. Aceite o pouco que guardei.',action:'Concluir resgate · 90 ouro e 120 XP',kind:'complete'};
 if(p.lumber==='active'&&p.piles.every(Boolean))return {title:'Oren · prefeito de Jacarandá',text:'Três pilhas marcadas! Os lenhadores vão buscá-las com as carroças. Com essa madeira cobrimos as casas antes das chuvas.',action:'Entregar a madeira · 110 ouro e 160 XP',kind:'lumber'};
 const tasks=[p.smith==='active'?'encontre Bran na Mina de Valfundo, ao norte do posto':p.smith==='found'?'fale com Bran na forja':null,p.lumber==='active'?'marque as pilhas de madeira na Serraria do Vale, a sudoeste':null].filter(Boolean);
 if(tasks.length)return {title:'Oren · prefeito de Jacarandá',text:'Jacarandá ainda precisa de você: '+tasks.join('; ')+'. Os caminhos saem da praça para o norte e para o oeste.'};
 return {title:'Oren · prefeito de Jacarandá',text:'Forja acesa e madeira a caminho. Os sobreviventes começam a voltar. Ainda há ameaças nos arredores; novas histórias de Jacarandá virão.'};
}
function smithDialogue(p,atForge){
 if(atForge){
  if(p.smith==='found')return {title:'Bran · forja de Jacarandá',text:'A forja está fria, mas o fole ainda funciona. Me dê um momento e reacendo o fogo. Com ferro bom, sua horda vai durar mais.',action:'Reacender a forja · 100 ouro e 150 XP',kind:'smith'};
  return {title:'Bran, o ferreiro',text:'O fogo está aceso. Traga o que encontrar nos arredores e vamos ver o que presta.',action:'Abrir a forja · equipamentos',kind:'forge'};
 }
 if(p.smith!=='active')return {title:'Bran · escondido na mina',text:'Quem está aí? Se Oren estiver vivo, diga a ele que estou aqui. Não saio enquanto esse bando rondar a mina.'};
 if(!p.cleared.includes('mine-guards'))return {title:'Bran · escondido na mina',text:'O Orc e os ladrões ainda estão na entrada. Derrote o bando e eu saio.'};
 return {title:'Bran · Mina de Valfundo',text:'Oren mandou você? Então Jacarandá ainda resiste. Vou voltar pela trilha da mina e reacender a forja. Me encontre lá.',action:'Mandar Bran para a vila',kind:'smith-found'};
}
function pileDialogue(s,pile){
 const p=s.save.campaign.world,g=s.world.adventure.groups.find(g=>g.id===pile.guard);
 if(p.lumber!=='active')return {title:pile.name,text:'Toras cortadas e abandonadas. Oren saberá onde usá-las.'};
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
 else if(action==='complete'){p.stage='complete';p.smith='active';p.lumber='active';s.save.character.gold+=90;grantExperience(s,120);}
 else if(action==='smith-found')p.smith='found';
 else if(action==='smith'){p.smith='done';s.save.character.gold+=100;grantExperience(s,150);}
 else if(action==='pile')p.piles[WORLD_PILES.findIndex(x=>x.key===r.dialogue)]=1;
 else if(action==='lumber'){p.lumber='done';s.save.character.gold+=110;grantExperience(s,160);}
 else return false;
 closeWorldOverlay(s);syncWorldPeople(s);w.notice=worldObjective(p).text;w.progressChanged=true;return true;
}
