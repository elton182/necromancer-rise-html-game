// Sinergias de escola: somente pontos investidos nos outros nós, sem realimentação.
// O Necromante conserva as sinergias explícitas do modelo compartilhado/árvore Morte.
import DATA from './skill-tree-data.mjs';
export const SCHOOL_SYNERGY_RATE=.02;
const CLASSES=new Set(['warrior','druid','archer','mercenary','mage']);
// Eco é o aperfeiçoamento próprio do dano do Teleporte; não conta outra vez como sinergia.
const COUPLED={mage:{blink:['echo']}};
function sourceId(classId,id){const node=DATA[classId]?.nodes[id];return node?.type==='variante'?node.requires[0]:id;}
export function synergySchool(classId,id){
 const c=DATA[classId],node=c?.nodes[id];
 if(!CLASSES.has(classId)||!node||['passives','veteran'].includes(node.branch))return null;
 const branch=c.trees.flatMap(t=>t.branches).find(b=>b.id===node.branch);
 return {id:node.branch,name:branch?.name||node.branch};
}
export function schoolSynergySources(classId,ranks,id){
 id=sourceId(classId,id);
 const school=synergySchool(classId,id);if(!school)return [];
 return Object.entries(DATA[classId].nodes).flatMap(([key,node])=>{
  if(key===id||COUPLED[classId]?.[id]?.includes(key)||node.branch!==school.id||node.type==='variante')return [];
  const points=Math.min(node.max,Math.max(0,Math.floor(Number(ranks?.[key])||0)));
  return points>0?[{id:key,name:node.name,points,bonus:points*SCHOOL_SYNERGY_RATE}]:[];
 });
}
export function schoolSynergy(classId,ranks,id){
 id=sourceId(classId,id);
 const school=synergySchool(classId,id);if(!school)return 0;
 let points=0;
 for(const [key,node] of Object.entries(DATA[classId].nodes))if(key!==id&&!COUPLED[classId]?.[id]?.includes(key)&&node.branch===school.id&&node.type!=='variante')points+=Math.min(node.max,Math.max(0,Math.floor(Number(ranks?.[key])||0)));
 return points*SCHOOL_SYNERGY_RATE;
}
