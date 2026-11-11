import {tunePrologueGroups} from './area-tuning.mjs';
import {normalizeMap,toArena} from './map-model.mjs';
import {prologueMapData,PROLOGUE_POINTS} from './prologue-map-data.mjs';
import {editedCampaignMap} from './campaign-maps.mjs';
import {villageArena} from './village-map.mjs';
export {PROLOGUE_POINTS};
export function prologueArena(stage){
 if(['defense','reunion'].includes(stage)){const a=villageArena();return {...a,id:'arandu-jacaranda',name:'Jacarandá',prologue:true,caravans:[{x:6,y:10,angle:0}]};}
 // A cena usa a edição guardada, quando existe; a queda e a viagem seguem sobre o plano por causa da cinemática.
 const slot=stage==='travel'?'travel':stage==='cave'?'cave':stage==='trail'?'trail':'caravan',edited=editedCampaignMap(slot);
 const map=edited?{...edited,objects:stage==='ambush'?edited.objects:edited.objects.filter(o=>!(o.inherited&&o.type==='road_block')),terrain:stage==='fall'?null:edited.terrain}:normalizeMap(prologueMapData(stage)).map,arena={...toArena(map),prologue:true,prologueSpawns:map.spawns};
 if(edited)arena.prologueGroups=tunePrologueGroups(map.spawns,stage,map.level);
 if(edited)arena.prologueStart=map.start;
 if(stage==='fall')arena.fallSite={x:0,y:12};
 if(stage==='travel')Object.assign(arena,{journey:true,caravans:[{x:0,y:80,angle:Math.PI}]});
 return arena;
}
