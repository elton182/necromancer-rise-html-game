import {normalizeMap,toArena} from './map-model.mjs';
import {prologueMapData} from './prologue-map-data.mjs';
import {villageArena} from './village-map.mjs';
export const PROLOGUE_POINTS={papers:{x:0,y:0},exit:{x:0,y:-22},messenger:{x:0,y:-8}};
export function prologueArena(stage){
 if(['defense','reunion'].includes(stage)){const a=villageArena();return {...a,id:'arandu-jacaranda',name:'Jacarandá',prologue:true,caravans:[{x:6,y:10,angle:0}]};}
 const map=normalizeMap(prologueMapData(stage)).map,arena={...toArena(map),prologue:true,prologueSpawns:map.spawns};
 if(stage==='fall')arena.fallSite={x:0,y:12};
 if(stage==='travel')Object.assign(arena,{journey:true,caravans:[{x:0,y:80,angle:Math.PI}]});
 return arena;
}
