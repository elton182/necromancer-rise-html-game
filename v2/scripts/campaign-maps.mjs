// Mapas da campanha editáveis: cada um é uma variação viva da planta embutida, guardada na biblioteca com id fixo (`campaign-<mapa>`).
// Sem edição, a campanha usa a planta original. Edições gravadas em v2/assets/maps/ entram no jogo pelo build.
import {builtinMap,normalizeMap,resolveMap,reachable,canReach,toArena,centered} from './map-model.mjs';
import {PROLOGUE_POINTS,CAVE_ROOMS,PAPERS_GUARD_RADIUS,MESSENGER_GUARD_RADIUS} from './prologue-map-data.mjs';
import {WORLD_POINTS,WORLD_PILES,WORLD_ENCOUNTERS} from './campaign-world-model.mjs';
import {ITAUNA_POINTS,FORT_POINTS,CAVE_POINTS} from './itauna-model.mjs';
import {NILO_POINTS,NILO_GROUPS} from './nilo-model.mjs';

const QUEST_SPAWNS=WORLD_ENCOUNTERS.filter(e=>e.quest).map(e=>e.id);
// `points`: lugares que a história usa; ficam marcados no editor e a verificação confere se seguem alcançáveis.
// `required`: grupos de que uma missão depende; podem ser movidos e configurados, mas não removidos.
// `triggers`: se a cena respeita gatilho, ondas e retorno dos grupos.
// `fixedStart`: cena roteirizada com posição inicial própria. `noTerrain`: cinemática sobre o plano, sem relevo.
export const CAMPAIGN_SLOTS={
 itavera:{ref:'builtin:itavera',name:'Itavera · praça das guildas',note:'Encerramento do Ato I: recepção de Helena e convite de João. Sem combate.',noSpawns:true,points:[NILO_POINTS.helena,NILO_POINTS.cityJoao,NILO_POINTS.cityMarta,{x:0,y:24,name:'Chegada da caravana'},{x:0,y:30,name:'Retorno a Jacarandá'}]},
 world:{ref:'builtin:campaign-world',name:'Mundo de Jacarandá',note:'Cripta, bosque, vila, posto, mina, serraria e cemitério.',triggers:true,required:QUEST_SPAWNS,points:[...Object.values(WORLD_POINTS),...WORLD_PILES.map(p=>({x:p.x,y:p.y,name:p.name})),NILO_POINTS.marta,NILO_POINTS.nilo]},
 travel:{ref:'builtin:arandu-travel',name:'Estrada de Itavera',note:'Cinemática da caravana: só cenário e estilo; sem relevo nem inimigos.',noTerrain:true,noSpawns:true,fixedStart:true,points:[]},
 caravan:{ref:'builtin:arandu-caravan',name:'Desembarque da caravana',note:'Emboscada, despedida e queda. A queda é mostrada sem relevo.',triggers:true,points:[{x:0,y:12,name:'Local da queda'}]},
 cave:{ref:'builtin:arandu-cave',name:'Caverna dos bandidos',note:'Salas, túneis, ordens e saída. Para ler as ordens, só é preciso derrotar os grupos a até '+PAPERS_GUARD_RADIUS+' u delas; os outros são opcionais.',triggers:true,points:[{...PROLOGUE_POINTS.papers,name:'Ordens'},{...PROLOGUE_POINTS.exit,name:'Saída'},...[2,4,6].map(i=>({x:CAVE_ROOMS[i].x+8,y:CAVE_ROOMS[i].y+3,name:'Carga lateral'}))]},
 trail:{ref:'builtin:arandu-trail',name:'Caminho de Jacarandá',note:'Trilha da caverna até Tomás: lobos na clareira, vigias na carroça tombada e os perseguidores. Para ajudar Tomás, só é preciso derrotar os grupos a até '+MESSENGER_GUARD_RADIUS+' u dele.',triggers:true,points:[{...PROLOGUE_POINTS.messenger,name:'Tomás'},{...PROLOGUE_POINTS.satchel,name:'Bolsa caída'}]},
 itauna:{ref:'builtin:itauna',name:'Várzea de Itaúna',note:'Área além da estrada leste de Jacarandá: rio, lagos, acampamento, encosta do forte e morro da gruta.',triggers:true,required:['islet-guard',NILO_GROUPS.camp],points:[...Object.values(ITAUNA_POINTS),NILO_POINTS.ledger]},
 itaunaFort:{ref:'builtin:itauna-fort',name:'Forte da Pedra Negra',note:'A grade interna sobe quando os três grupos do pátio externo caem. Mantenha o vão em (0, 6).',triggers:true,required:['fort-gate','fort-west','fort-east','fort-inner-w','fort-inner-e','fort-captain'],points:[...Object.values(FORT_POINTS),NILO_POINTS.contract,NILO_POINTS.bag]},
 itaunaCave:{ref:'builtin:itauna-cave',name:'Gruta das Tecelãs',note:'Galerias de lobos e aranhas, lago subterrâneo e câmara da Mãe-Tecelã.',triggers:true,required:['cave-queen'],points:[...Object.values(CAVE_POINTS),NILO_POINTS.cocoon]}
};
export const campaignMapId=slot=>'campaign-'+slot;
let library=null,baked=new Map();
// `lib`: biblioteca do navegador. `bundle`: edições publicadas, embutidas no build. Testes usam a planta original (nada configurado).
export function useCampaignMaps(lib,bundle=null){
 library=lib;baked=new Map();
 for(const raw of Array.isArray(bundle?.maps)?bundle.maps:[]){const {map}=normalizeMap(raw);if(map?.campaign&&CAMPAIGN_SLOTS[map.campaign])baked.set(map.campaign,{...map,id:campaignMapId(map.campaign)});}
}
const lookup=id=>library?.get(id)||null;
export const savedCampaignMap=slot=>library?.get(campaignMapId(slot))||null;
export const bakedCampaignMap=slot=>baked.get(slot)||null;
// Vale a edição mais recente entre a do navegador e a publicada. A cópia que perde não é apagada. Empate fica com a do navegador.
const newest=(saved,published)=>saved&&published?((published.updated||0)>(saved.updated||0)?published:saved):saved||published;
export const campaignEdit=slot=>newest(savedCampaignMap(slot),bakedCampaignMap(slot));
const mapContent=({updated,...content})=>JSON.stringify(content);
// O que a aba Mapas precisa para dizer qual versão está valendo e se a outra é diferente.
export function campaignEditStatus(slot){
 const saved=savedCampaignMap(slot),published=bakedCampaignMap(slot),active=newest(saved,published);
 return {saved,published,source:!active?'original':active===saved?'local':'published',differs:!!(saved&&published&&mapContent(saved)!==mapContent(published))};
}
// Documento para o editor: a edição guardada ou uma variação vazia da planta original.
export function campaignDocument(slot){
 const def=CAMPAIGN_SLOTS[slot];if(!def)return null;
 const edit=campaignEdit(slot);if(edit)return edit;
 return normalizeMap({id:campaignMapId(slot),name:def.name,base:def.ref,campaign:slot,objects:[],hidden:[],biome:null,size:null,start:null,spawns:null}).map;
}
// Mapa resolvido para a campanha, ou null quando não há edição (a campanha segue pelo caminho original).
export function editedCampaignMap(slot){
 const edit=campaignEdit(slot);if(!edit)return null;
 const def=CAMPAIGN_SLOTS[slot],{map}=resolveMap(edit,lookup);
 const spawns=(def.required||[]).length?withRequired(map.spawns,slot):map.spawns;
 return {...map,spawns,terrain:def.noTerrain?null:map.terrain};
}
// Grupos de missão removidos por importação ou edição externa voltam da planta: sem eles, a missão travaria.
function withRequired(spawns,slot){
 const def=CAMPAIGN_SLOTS[slot],original=builtinMap(def.ref).spawns,out=[...spawns];
 for(const id of def.required)if(!out.some(s=>s.id===id)){const s=original.find(o=>o.id===id);if(s)out.push(s);}
 return out;
}
export const isRequiredSpawn=(slot,id)=>!!CAMPAIGN_SLOTS[slot]?.required?.includes(id);
// Avisos específicos da campanha para a verificação do editor.
export function checkCampaignMap(doc,lookupDoc=lookup){
 const def=CAMPAIGN_SLOTS[doc.campaign];if(!def)return [];
 const out=[],{map:flat}=resolveMap(doc,lookupDoc),b=centered(flat.size),inside=p=>p.x>=b.minX&&p.x<=b.maxX&&p.y>=b.minY&&p.y<=b.maxY;
 const lost=def.points.filter(p=>!inside(p));
 if(lost.length)out.push({level:'erro',text:'Fora do mapa: '+lost.slice(0,4).map(p=>p.name).join(', ')+(lost.length>4?'…':'')+'. A história usa estes lugares.'});
 const arena=toArena(flat);
 if(inside(flat.start)&&def.points.length){
  const r=reachable(arena,flat.start,{step:flat.size.w>120?1:.5});
  if(!r.blocked){const cut=def.points.filter(p=>inside(p)&&!canReach(r,p));if(cut.length)out.push({level:'aviso',text:'Sem caminho a pé até: '+cut.slice(0,4).map(p=>p.name).join(', ')+(cut.length>4?'…':'')+'.'});}
 }
 return out;
}
