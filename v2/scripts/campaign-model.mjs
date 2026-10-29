import D from './campaign-rules.mjs';
export {D};
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function normalizeCampaign(raw={}){
 if(!object(raw))throw Error('Progresso da campanha inválido.');const flags=v=>{if(v!==undefined&&!object(v))throw Error('Marcadores da campanha inválidos.');return Object.fromEntries(Object.entries(v||{}).filter(([k,x])=>x===1||x===true).map(([k])=>[k,1]));};
 const cleared=flags(raw.cleared);for(const k of Object.keys(cleared))if(![1,2,3,4].includes(Number(k)))delete cleared[k];
 let unlocked=1;while(unlocked<4&&cleared[unlocked])unlocked++;
 return {started:!!raw.started,unlocked,cleared,story:flags(raw.story),tut:flags(raw.tut),grants:Array.from(new Set((Array.isArray(raw.grants)?raw.grants:[]).filter(x=>['raio','summon','maos','barreira'].includes(x)))),village:!!cleared[4],resume:cleared[4]&&raw.resume==='village'?'village':'map',missionSerial:Number.isSafeInteger(raw.missionSerial)&&raw.missionSerial>=0?raw.missionSerial:0};
}
export function completeStage(raw,n){const state=normalizeCampaign(raw);if(!Number.isInteger(n)||!D.stages[n]||n>state.unlocked)throw Error('Fase bloqueada.');const first=!state.cleared[n];state.cleared[n]=1;state.unlocked=Math.max(state.unlocked,Math.min(4,n+1));state.village=!!state.cleared[4];state.resume=state.village?'village':'map';return {state,first,gold:first?D.stages[n].rew.gold:0,xp:first?D.stages[n].rew.xp:0};}
export function offer(raw,npcId,random=Math.random){const state=normalizeCampaign(raw),npc=D.npcs[npcId];if(!state.village||!npc)throw Error('A vila ainda não está disponível.');const pool=D.missions.filter(m=>npc.kinds.includes(m.id)),base=pool[Math.floor(random()*pool.length)],layout=random()<.5?'strip':'arena';state.missionSerial++;return {state,mission:{...base,boss:{...base.boss},npc:npcId,token:state.missionSerial,layout,label:base.label+' · '+(layout==='strip'?'Trilha de Eldrin':'Arredores de Eldrin'),rewardExp:Math.round(base.rewardExp*1.25),rewardSouls:Math.round(base.rewardSouls*1.25)}};}
// Complemento da união de salas/corredores: paredes baixas não ocultam os avisos.
export function roomArena(){const walk=[...D.rooms,...D.corridors],bounds={minX:-12,maxX:113,minY:-12,maxY:12},xs=[bounds.minX,bounds.maxX,...walk.flatMap(r=>[r.x0,r.x1])].sort((a,b)=>a-b),solids=[];
 for(let i=1;i<xs.length;i++){const x0=xs[i-1],x1=xs[i];if(x1<=x0)continue;const spans=walk.filter(r=>r.x0<x1&&r.x1>x0).map(r=>[r.y0,r.y1]).sort((a,b)=>a[0]-b[0]);let y=bounds.minY;for(const [a,b]of spans){if(a>y)solids.push({kind:'box',x:(x0+x1)/2,y:(y+a)/2,width:x1-x0,depth:a-y,height:.9});y=Math.max(y,b);}if(y<bounds.maxY)solids.push({kind:'box',x:(x0+x1)/2,y:(y+bounds.maxY)/2,width:x1-x0,depth:bounds.maxY-y,height:.9});}
 return {id:'campaign-crypt',bounds,solids,walk};}
