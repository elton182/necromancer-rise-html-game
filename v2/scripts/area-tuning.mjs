// Nível e densidade dos encontros da campanha integrada, aplicados por cima das plantas (embutidas ou editadas).
// O editor guarda a composição e o nível relativo de cada grupo; aqui entram o nível da área, o dobro de integrantes,
// o triplo de ondas e o renascimento dos grupos que não são de missão. Dados puros, sem DOM nem Three.js.
export const AREA_LEVELS={world:10,itauna:20,'itauna-cave':30,'itauna-fort':40};
// count × waves = 6 vezes mais inimigos por grupo. `respawn`: segundos até o grupo vencido voltar, se o jogador estiver longe.
export const DENSITY={count:2,waves:3,interval:5,respawn:90,spread:1.35};
const MAX_COUNT=30,MAX_WAVES=20,MAX_LEVEL=60;
const typesOf=s=>s.mix?.length?s.mix:Array(Math.max(1,s.count||1)).fill(s.type??0);
// `mapLevel`: nível base da planta. A diferença de cada grupo para ele vira bônus sobre o nível da área (missões mais duras continuam mais duras).
export function tuneGroups(spawns,{area,mapLevel=1}={}){
 const base=AREA_LEVELS[area];if(!base)return spawns;
 return spawns.map(s=>{
  const mix=[];for(let i=0;i<DENSITY.count;i++)mix.push(...typesOf(s));
  const out=mix.slice(0,MAX_COUNT);
  return {...s,mix:out,count:out.length,type:out[0],level:Math.min(MAX_LEVEL,base+Math.max(0,(s.level??mapLevel)-mapLevel)),
   waves:Math.min(MAX_WAVES,(s.waves||1)*DENSITY.waves),interval:s.interval||DENSITY.interval,respawn:s.quest?0:(s.respawn||DENSITY.respawn),spread:Math.max(s.spread||0,1.6)*DENSITY.spread};
 });
}
