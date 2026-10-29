// Consumíveis comprados no mercador e usados com F1–F5. Preços, pilhas e efeitos vêm de progression-rules.mjs.
import P from './progression-rules.mjs';
import {dealDamage} from './combat.mjs';
import {announce} from './drops.mjs';
// O pergaminho teleporta ao portal da vila, que a v2 ainda não tem; ele volta com a campanha (E9).
export const CATALOG=P.consumables,SLOTS=5;
export const definition=id=>CATALOG.find(i=>i.id===id);
const ok=message=>({ok:true,message}),no=message=>({ok:false,message});
// Entradas desconhecidas, repetidas ou fora da pilha são descartadas ao carregar, sem recriar itens.
export function normalizeInventory(raw){
 if(raw!==undefined&&!Array.isArray(raw))throw Error('Inventário de consumíveis inválido.');
 const seen=new Set(),out=[];
 for(const e of raw??[]){const d=e&&typeof e==='object'?definition(e.id):null;if(!d||seen.has(d.id)||!Number.isInteger(e.count)||e.count<1)continue;seen.add(d.id);out.push({id:d.id,count:Math.min(e.count,d.maxStack)});if(out.length===SLOTS)break;}
 return out;
}
export function buyConsumable(s,id){
 const c=s.save.character,d=definition(id);
 if(!d)return no('Item inválido.');if(!['menu','village'].includes(s.scene))return no('O mercador só atende no menu, fora do encontro.');
 const held=c.inventory.find(i=>i.id===id);if(held&&held.count>=d.maxStack)return no('Bolso cheio: '+d.name+'.');if(c.gold<d.cost)return no('Ouro insuficiente: '+d.cost+'.');
 c.gold-=d.cost;if(held)held.count++;else c.inventory.push({id,count:1});return ok(d.name+' comprado por '+d.cost+' ouro.');
}
// Como no jogo atual, o item é consumido mesmo quando o efeito não muda nada (vida cheia, por exemplo).
export function useConsumable(s,index){
 const w=s.world,c=s.save.character,p=w.player,slot=c.inventory[index];
 if(s.scene!=='training'||w.paused||p.hp<=0||!slot||slot.count<1)return false;
 const d=definition(slot.id),E=P.consumableEffects;if(!d||d.id==='recall_scroll'&&!w.portal)return false;
 if(d.id==='recall_scroll'){Object.assign(p,w.portal);p.navPath=null;}
 else if(d.id==='potion_hp')p.hp=Math.min(p.maxHp,p.hp+E.hp);
 else if(d.id==='potion_mp')p.mp=Math.min(p.maxMp,p.mp+E.mp);
 else if(d.id==='bone_shield')p.boneShield=true;
 else if(d.id==='soul_bomb'){
  w.effects.push({id:w.nextId++,kind:'bomb',x:p.x,y:p.y,radius:E.bombRadius,time:0,duration:.5,visual:true,ground:true,color:0xaa00ff});
  for(const e of [...w.actors])if(e.team==='enemy'&&e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<E.bombRadius)dealDamage(w,e,E.bombDamage,p);
 }
 announce(w,d.name+' usado',d.id==='potion_hp'?'#ff7a6a':d.id==='potion_mp'?'#78a2ff':'#d9bf6a');
 slot.count--;if(slot.count<=0)c.inventory.splice(index,1);return true;
}
