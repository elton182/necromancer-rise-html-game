import {inWorldVillage,WORLD_POINTS} from './campaign-world-model.mjs';

// Serviços da praça, compartilhados pela vila antiga e pelo mundo contínuo.
export const VILLAGE_SERVICES=[
 {id:'endless',name:'Guardião das Ondas',serviceTitle:'Arena e Expedições',model:'npcBram',x:4,y:5},
 {id:'valdoria',name:'Cartógrafa de Valdoria',serviceTitle:'Conquista do mapa',model:'npcLysa',x:-4,y:5},
 {id:'siege',name:'Mestre do Cerco',serviceTitle:'Defesa de torres',model:'npcMerchant',x:8,y:2},
];
export function villageServices(continuous=false){return VILLAGE_SERVICES.map(n=>({...n,key:n.id,service:n.id,x:n.x+(continuous?WORLD_POINTS.village.x:0),y:n.y+(continuous?WORLD_POINTS.village.y:0)}));}
export function inVillageHub(s){return s.world.player.hp>0&&(s.scene==='village'&&s.save.campaign.village||s.scene==='training'&&s.world.adventure?.kind==='campaign-world'&&!s.world.adventure.area&&inWorldVillage(s.world.player));}
export function rememberVillage(s){if(s.world.adventure?.kind==='campaign-world'&&inVillageHub(s)){s.save.campaign.world.checkpoint='village';if(s.save.campaign.world.stage==='wake')s.save.campaign.world.stage='village';}}
