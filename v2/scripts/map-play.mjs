// Jogar um mapa personalizado: arena do mapa + grupos de inimigos configurados no editor.
// É um campo de treino com cenário próprio: sem fases, chefe nem missão. Recompensas seguem as do treino.
import {clean} from './campaign.mjs';
import {resolveMap,toArena} from './map-model.mjs';
import {resolvePosition} from './terrain.mjs';
import {makeGroups,spawnTypes,tickGroups} from './map-spawns.mjs';

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
export function tickCustomMap(s,dt){const w=s.world,run=w.adventure;if(run?.groups)tickGroups(w,run.groups,dt,{level:run.level});}
// Entra no mapa a partir do menu ou da vila. `lookup` resolve mapas base guardados na biblioteca.
export function launchMap(s,map,lookup){
 if(!canLaunch(s))return {ok:false,message:'Termine ou saia da missão atual para jogar um mapa.'};
 const {map:flat,warnings}=resolveMap(map,lookup),arena=toArena(flat),start=resolvePosition(flat.start,PLAYER_RADIUS,arena);
 clean(s,arena,start);
 const w=s.world;s.scene='training';w.paused=false;w.gearLevel=flat.level;w.aim={x:start.x,y:start.y-1};
 w.adventure={kind:'custom-map',mapId:map.id,name:flat.name,done:false,queue:[],spawns:flat.spawns.map(p=>({...p})),level:flat.level,enemies:0};
 const total=populateMap(w);
 w.notice='Mapa «'+flat.name+'» · '+total+' inimigo(s) · nível '+flat.level+(warnings.length?' · '+warnings[0]:'');
 return {ok:true,total};
}
