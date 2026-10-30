// Jogar um mapa personalizado: arena do mapa + inimigos nos pontos marcados no editor.
// É um campo de treino com cenário próprio: sem fases, chefe nem missão. Recompensas seguem as do treino.
import {clean} from './campaign.mjs';
import {spawnEnemy} from './enemies.mjs';
import {resolveMap,toArena} from './map-model.mjs';
import {resolvePosition} from './terrain.mjs';

export const isCustomMap=s=>s.scene==='training'&&s.world.adventure?.kind==='custom-map';
// Abre pelo menu, pela vila ou pelo treino livre; campanhas, missões e modos de ondas em andamento ficam de fora.
export const canLaunch=s=>['village','menu'].includes(s.scene)||s.scene==='training'&&!s.world.adventure;
const PLAYER_RADIUS=.45;

// Inimigos de cada ponto em espiral ao redor dele; `resolvePosition` empurra para fora de colisores.
export function populateMap(w){
 const run=w.adventure;if(run?.kind!=='custom-map')return 0;
 w.actors=w.actors.filter(a=>a.team!=='enemy');w.hostileShots=[];w.hostileZones=[];
 let total=0;
 for(const spawn of run.spawns)for(let i=0;i<spawn.count;i++){
  const angle=i*2.399,distance=i?.55*Math.sqrt(i)+.4:0;
  spawnEnemy(w,spawn.type,spawn.x+Math.cos(angle)*distance,spawn.y+Math.sin(angle)*distance,{wave:run.level});total++;
 }
 run.enemies=total;return total;
}
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
