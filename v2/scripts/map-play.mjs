// Jogar um mapa personalizado: arena do mapa + grupos de inimigos configurados no editor.
// É um campo de treino com cenário próprio: sem fases, chefe nem missão. Recompensas seguem as do treino.
import {clean} from './campaign.mjs';
import {resolveMap,toArena} from './map-model.mjs';
import {resolvePosition} from './terrain.mjs';
import {makeGroups,spawnTypes,tickGroups} from './map-spawns.mjs';
import {campaignDocument} from './campaign-maps.mjs';
import {WORLD_EXITS,WORLD_ARRIVALS} from './campaign-world-model.mjs';
import {AREAS,areaEntry,gateSolid,gateOpen} from './itauna-model.mjs';
import {tuneGroups,AREA_LEVELS} from './area-tuning.mjs';

export const isCustomMap=s=>s.scene==='training'&&s.world.adventure?.kind==='custom-map';
// Abre pelo menu, pela vila ou pelo treino livre; campanhas, missões e modos de ondas em andamento ficam de fora.
export const canLaunch=s=>['village','menu'].includes(s.scene)||s.scene==='training'&&!s.world.adventure;
const PLAYER_RADIUS=.45;

// Rearma os grupos; os que nascem ao entrar aparecem já neste quadro. Devolve o total previsto na primeira onda de todos.
export function populateMap(w){
 const run=w.adventure;if(run?.kind!=='custom-map')return 0;
 w.actors=w.actors.filter(a=>a.team!=='enemy');w.hostileShots=[];w.hostileZones=[];
 run.groups=makeGroups(run.spawns);tickGroups(w,run.groups,0,{level:run.level});
 run.enemies=run.spawns.reduce((n,s)=>n+spawnTypes(s).length*(s.waves||1),0);
 return run.enemies;
}
export function tickCustomMap(s,dt){
 const w=s.world,run=w.adventure;
 if(checkTestExits(w))return;
 if(!run?.groups)return;
 tickGroups(w,run.groups,dt,{level:run.level});
 const cleared=run.groups.filter(g=>g.state==='clear').map(g=>g.id);
 for(const g of w.arena.gates||[])if(!g.open&&gateOpen(g,cleared)){g.open=true;w.arena.solids=w.arena.solids.filter(o=>o.gateId!==g.id);w.notice='A grade do pátio interno sobe.';}
}
// Testar um mapa da campanha usa as mesmas passagens e grades do jogo, para a planta poder ser percorrida inteira. O save da campanha não muda.
const slotArea=slot=>Object.values(AREAS).find(a=>a.slot===slot)||null;
function checkTestExits(w){
 const run=w.adventure,p=w.player,inside=(w.arena.exits||[]).find(e=>Math.hypot(e.x-p.x,e.y-p.y)<e.r);
 if(run.exitLock){if(!inside)run.exitLock=false;return false;}
 if(!inside)return false;
 w.areaTravel={to:inside.to,entry:inside.entry,name:inside.name};w.paused=true;return true;
}
export function travelTestMap(s){
 const w=s.world,t=w.areaTravel,lookup=w.adventure?.lookup;if(!t)return false;w.areaTravel=null;
 const arrival=t.to?areaEntry(t.to,t.entry):WORLD_ARRIVALS[t.entry]||null;
 enterMap(s,campaignDocument(t.to?AREAS[t.to].slot:'world'),lookup,arrival);return true;
}
// Entra no mapa a partir do menu ou da vila. `lookup` resolve mapas base guardados na biblioteca.
export function launchMap(s,map,lookup){
 if(!canLaunch(s))return {ok:false,message:'Termine ou saia da missão atual para jogar um mapa.'};
 return enterMap(s,map,lookup);
}
function enterMap(s,map,lookup,arrival=null){
 const {map:flat,warnings}=resolveMap(map,lookup),arena=toArena(flat),start=resolvePosition(arrival||flat.start,PLAYER_RADIUS,arena),area=slotArea(map.campaign);
 arena.exits=map.campaign==='world'?WORLD_EXITS:area?.exits||undefined;arena.gates=(area?.gates||[]).map(g=>({...g,open:false}));
 for(const g of arena.gates)arena.solids=[...arena.solids,gateSolid(g)];
 clean(s,arena,start);
 const w=s.world;s.scene='training';w.paused=false;w.gearLevel=flat.level;w.aim={x:start.x,y:start.y-1};
 // Mapa da campanha testado no editor: mesmo nível e densidade do jogo.
 const key=map.campaign==='world'?'world':Object.keys(AREAS).find(id=>AREAS[id].slot===map.campaign),spawns=key?tuneGroups(flat.spawns,{area:key,mapLevel:flat.level}):flat.spawns;
 w.adventure={kind:'custom-map',mapId:map.id,name:flat.name,done:false,queue:[],spawns:spawns.map(p=>({...p})),level:key?AREA_LEVELS[key]:flat.level,enemies:0,lookup,exitLock:true};
 const total=populateMap(w);
 w.notice='Mapa «'+flat.name+'» · '+total+' inimigo(s) · nível '+flat.level+(warnings.length?' · '+warnings[0]:'');
 return {ok:true,total};
}
