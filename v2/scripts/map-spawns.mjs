// Grupos de inimigos dos mapas: quando nascem, quantas ondas têm e se voltam. Usado pelos mapas jogáveis e pelo mundo da campanha.
// Sem DOM nem Three.js; o dano, a escala e o loot continuam em `spawnEnemy` e no combate.
import {spawnEnemy} from './enemies.mjs';

export const TRIGGERS={start:'Ao entrar no mapa',near:'Quando o jogador se aproxima',timer:'Depois de um tempo'};
export const TIERS={common:'Comum',magic:'Mágico',rare:'Raro'};
export const spawnTypes=s=>s.mix?.length?s.mix:Array(s.count).fill(s.type);
// Posições dos integrantes: anel de raio `spread`, ou espiral compacta quando `spread` é 0.
export function spawnSlots(s){
 const types=spawnTypes(s);
 return types.map((type,i)=>{
  if(s.spread>0){const a=i*Math.PI*2/types.length+.6;return {type,x:s.x+Math.cos(a)*s.spread,y:s.y+Math.sin(a)*s.spread};}
  const a=i*2.399,d=i?.55*Math.sqrt(i)+.4:0;return {type,x:s.x+Math.cos(a)*d,y:s.y+Math.sin(a)*d};
 });
}
export const makeGroups=spawns=>spawns.map(s=>({...s,state:'dormant',wavesLeft:s.waves||1,timer:s.trigger==='timer'?s.delay||0:0}));
export function releaseGroup(w,g,level=1){
 const wave=g.level||level;
 spawnSlots(g).forEach((slot,i)=>{
  const e=spawnEnemy(w,slot.type,slot.x,slot.y,{wave,tier:i===0&&g.leader||'common'});e.worldGroup=g.id;
  // Ajustes do mapa: valem para todas as ondas dos grupos dele, sem mudar os tipos usados nos outros modos.
  const hp=w.arena?.enemyHp??1,xp=w.arena?.enemyXp??1;if(hp!==1)e.hp=e.maxHp=Math.round(e.maxHp*hp);if(xp!==1)e.xpScale=xp;
  if(g.idle)Object.assign(e,{home:{x:e.x,y:e.y},alert:false});
 });
 g.state='active';g.wavesLeft--;
}
const alive=(w,id)=>w.actors.some(a=>a.worldGroup===id&&a.hp>0);
// Avança um grupo. `blocked` impede novos nascimentos (abrigo da vila). `onRelease`/`onClear` são avisos para o modo que usa os grupos.
export function tickGroups(w,groups,dt,{level=1,blocked=false,onRelease,onClear}={}){
 const p=w.player;
 for(const g of groups){
  const near=Math.hypot(p.x-g.x,p.y-g.y)<(g.radius||18);
  if(g.state==='dormant'){
   if(blocked)continue;
   if(g.trigger==='timer')g.timer-=dt;
   if(g.trigger==='start'||g.trigger==='near'&&near||g.trigger==='timer'&&g.timer<=0){releaseGroup(w,g,level);onRelease?.(g);}
  }else if(g.state==='active'&&!alive(w,g.id)){
   if(g.wavesLeft>0){g.state='between';g.timer=g.interval||0;}
   else{g.state='clear';onClear?.(g);if(g.respawn>0&&!g.quest)g.timer=g.respawn;}
  }else if(g.state==='between'){
   g.timer-=dt;if(g.timer<=0&&!blocked)releaseGroup(w,g,level);
  }else if(g.state==='clear'&&g.respawn>0&&!g.quest){
   g.timer-=dt;if(g.timer<=0&&!near){g.state='dormant';g.wavesLeft=g.waves||1;g.timer=g.trigger==='timer'?g.delay||0:0;}
  }
 }
}
