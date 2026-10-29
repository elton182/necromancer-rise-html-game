// Itens no chão e mensagens de recompensa: estado transitório do encontro, nunca persistido.
import P from './progression-rules.mjs';
import {resolvePosition} from './terrain.mjs';
const LIFE={gold:P.gold.life,hp:P.orbs.life,mp:P.orbs.life,equipment:Infinity},RADIUS={gold:P.gold.pickup,hp:P.orbs.pickup,mp:P.orbs.pickup,equipment:P.gear.pickup};
export const FEED_SECONDS=4,FEED_LIMIT=5,RARITY_ORDER=['common','magic','rare','epic'];
// Equipamentos abaixo do filtro ficam ocultos e não são coletados; ouro e orbes nunca são filtrados.
export const lootAllowed=(drop,minimum='common')=>drop.kind!=='equipment'||RARITY_ORDER.indexOf(drop.item.rarity)>=RARITY_ORDER.indexOf(minimum);
export function clearDrops(w){w.drops=[];w.feed=[];}
export function announce(w,text,color='#e8e0c0'){w.feed.push({id:w.nextId++,text,color,time:0});while(w.feed.length>FEED_LIMIT)w.feed.shift();}
export function spawnDrop(w,kind,x,y,extra={}){
 if(!(kind in LIFE)||!Number.isFinite(x)||!Number.isFinite(y))return null;
 const p=resolvePosition({x,y},.2,w.arena),drop={id:w.nextId++,kind,x:p.x,y:p.y,age:0,life:LIFE[kind],...extra};w.drops.push(drop);return drop;
}
// Coleta automática por proximidade; a vida útil só corre com a simulação ativa.
export function tickDrops(w,dt){
 for(const m of w.feed)m.time+=dt;w.feed=w.feed.filter(m=>m.time<FEED_SECONDS);
 for(let i=w.drops.length-1;i>=0;i--){
  const d=w.drops[i];d.age+=dt;d.life-=dt;
  // Um coletor pode recusar (mochila cheia): a peça continua no chão.
  if(w.player.hp>0&&Math.hypot(d.x-w.player.x,d.y-w.player.y)<RADIUS[d.kind]&&d.life>0){if(w.onPickup?.(d)!==false)w.drops.splice(i,1);continue;}
  if(d.life<=0)w.drops.splice(i,1);
 }
}
