// Ritmo da campanha: grupos pequenos distribuídos nas rotas, sem multiplicação global de ondas.
// Regras apenas da campanha integrada; Arena, Expedições e mapas pessoais mantêm suas configurações.
export const AREA_LEVELS={world:4,itauna:7,'itauna-cave':9,'itauna-fort':11};
export const DENSITY={count:1,waves:1,interval:9,respawn:0,spread:1};
const REINFORCEMENTS={world:['mill-road-b'],itauna:['camp-gate'],'itauna-cave':['fork-spiders','lake-wolves'],'itauna-fort':['fort-west']};
const typesOf=s=>s.mix?.length?s.mix:Array(Math.max(1,s.count||1)).fill(s.type??0);
const group=(id,x,y,mix,level=1)=>({id,x,y,mix,count:mix.length,type:mix[0],level,trigger:'near',radius:14,idle:true,spread:1.6,waves:1,respawn:0});
// IDs próprios: acrescentar patrulhas não muda os IDs dos grupos, objetos ou edições anteriores.
export const ROUTE_ENCOUNTERS={
 world:[group('route-crypt-bend',-28,-46,[4,4]),group('route-village-north',58,22,[6,6]),group('route-mine-bend',60,-30,[4,4]),group('route-mine-ridge',46,-78,[6,9]),
  group('route-mill-east',15,86,[8,8]),group('route-mill-bend',-35,104,[6,6]),group('route-itauna-west',102,82,[4,4]),group('route-itauna-middle',128,88,[6,9]),group('route-itauna-east',154,94,[6,6]),group('route-graveyard',112,52,[0,0],2)],
 itauna:[group('route-entry',-145,19,[4,4]),group('route-west-bend',-116,26,[6,6]),group('route-west-road',-90,24,[4,4]),group('route-bridge-west',-30,-2,[6,9]),
  group('route-camp-road',48,-12,[6,6]),group('route-cave-road',161,18,[8,8]),group('route-cave-hill',166,79,[4,4]),group('route-delta-trail',62,84,[8,8]),group('route-pines-trail',120,108,[6,9]),
  group('route-lagoon-north',-128,-4,[4,4]),group('route-lagoon-south',-119,-31,[0,0]),group('route-tower-south',-154,50,[6,6]),group('route-tower-north',-146,81,[6,9]),group('route-ford-west',-18,53,[4,4])],
 'itauna-cave':[group('route-gruta-entry',36,58,[4,4]),group('route-gruta-gallery',-20,45,[8,8]),group('route-gruta-east',50,-12,[8,8])]
};
export function addRouteEncounters(spawns,area){const ids=new Set(spawns.map(g=>g.id));return [...spawns,...(ROUTE_ENCOUNTERS[area]||[]).filter(g=>!ids.has(g.id)).map(g=>({...g,mix:[...g.mix]}))];}
export function tuneGroups(spawns,{area,mapLevel=1}={}){
 const base=AREA_LEVELS[area];if(!base)return spawns;
 // Edições antigas guardavam nível 1 sobre plantas de nível 4/5. Esse piso preserva a gradação entre pátios e chefes.
 const reference=Math.max(mapLevel,{world:1,itauna:4,'itauna-cave':5,'itauna-fort':5}[area]);
 return spawns.map(s=>{
  const mix=typesOf(s).slice(0,s.id==='fort-captain'?3:s.leader?4:3),reinforce=REINFORCEMENTS[area]?.includes(s.id);
  return {...s,mix,count:mix.length,type:mix[0],level:base+Math.min(2,Math.max(0,(s.level??reference)-reference)),
   waves:reinforce?2:1,interval:DENSITY.interval,respawn:0,trigger:'near',idle:true,radius:Math.min(s.radius||16,16),spread:Math.min(Math.max(s.spread||0,1.2),2.5)};
 });
}
// O prólogo tem uma só leva em cada ponto; apenas dois grupos da caverna recebem um reforço.
// Protege também saves de mapas do navegador que ainda conservam as antigas três/quatro ondas.
export function tunePrologueGroups(spawns,stage,mapLevel=1){
 if(!['cave','trail'].includes(stage))return spawns;
 return spawns.map(s=>{
  const reinforcement=stage==='cave'&&['opening-enemy-4','opening-enemy-10'].includes(s.id),extra=stage==='cave'&&!s.id.startsWith('opening-enemy-');
  const mix=typesOf(s).slice(0,extra?1:2),leader=stage==='cave'&&['opening-enemy-3','opening-enemy-7'].includes(s.id)?'magic':null;
  return {...s,mix,count:mix.length,type:mix[0],level:Math.min(stage==='cave'?3:2,s.level||mapLevel),leader,waves:reinforcement?2:1,interval:9,respawn:0,trigger:'near',radius:14,idle:true,spread:Math.min(s.spread||1.2,2)};
 });
}
