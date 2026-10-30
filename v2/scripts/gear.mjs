// Inventário do personagem: operações atômicas sobre equipamento e mochila, sem DOM.
// Geração, validação, preços e bônus pertencem ao modelo compartilhado de equipamentos.
import EQ from './shared-equipment.mjs';
import Build from './shared-build.mjs';
import {syncSkills} from './grimoire.mjs';
import {recalculateHorde} from './horde.mjs';
import {lootAllowed} from './drops.mjs';
export const CAPACITY=EQ.CAPACITY,RARITIES=['common','magic','rare','epic'];
const ok=message=>({ok:true,message}),no=message=>({ok:false,message});
export const gearName=item=>(item.special==='carcomido'?'Osso Carcomido · ':'')+EQ.slots[item.type].name+' '+EQ.rarities[item.rarity].name+(item.enhancement?' +'+item.enhancement:'');
export const compatible=(item,slot)=>item.type===slot||item.type.startsWith('ring')&&slot.startsWith('ring');
// IDs seguem o padrão aceito pelo validador (letras, números, hífen e sublinhado).
export function newItemId(s){s.gearSerial=(s.gearSerial||0)+1;return 'eq-'+Date.now().toString(36)+'-'+s.gearSerial+'-'+Math.floor(s.world.random()*36**4).toString(36);}
// Trocar itens recalcula atributos preservando a proporção de vida e mana, sem curar nem reiniciar recargas.
export function refreshGear(s){const w=s.world;w.equipment=s.save.character.equipment;syncSkills(w);if(w.armyMode==='groups')recalculateHorde(w);}
const blocked=s=>s.scene==='dead'?'Você caiu: a mochila só muda em uma nova tentativa.':'';
export function equip(s,id,slot){
 const c=s.save.character,reason=blocked(s);if(reason)return no(reason);
 const index=c.gearBag.findIndex(i=>i.id===id),item=c.gearBag[index];
 if(!item||!EQ.slots[slot]||!compatible(item,slot))return no('Peça incompatível com este espaço.');
 const old=c.equipment[slot];c.gearBag.splice(index,1);if(old)c.gearBag.push(old);c.equipment[slot]=item;refreshGear(s);return ok(gearName(item)+' equipado.');
}
export function unequip(s,slot){
 const c=s.save.character,reason=blocked(s);if(reason)return no(reason);
 if(!c.equipment[slot])return no('Espaço vazio.');if(c.gearBag.length>=CAPACITY)return no('Mochila cheia.');
 const item=c.equipment[slot];c.gearBag.push(item);delete c.equipment[slot];refreshGear(s);return ok(gearName(item)+' guardado na mochila.');
}
export function discard(s,id){const c=s.save.character,reason=blocked(s);if(reason)return no(reason);const index=c.gearBag.findIndex(i=>i.id===id);if(index<0)return no('Peça não encontrada.');const [item]=c.gearBag.splice(index,1);return ok(gearName(item)+' descartado.');}
export function discardAll(s){const c=s.save.character,reason=blocked(s);if(reason)return no(reason);const count=c.gearBag.length;c.gearBag=[];return count?ok(count+' peça(s) descartada(s). Equipados foram mantidos.'):no('A mochila já está vazia.');}
// O menu faz o papel da vila: mercador e venda existem apenas fora do encontro.
const village=s=>['menu','village'].includes(s.scene)?'':'O mercador só atende no menu, fora do encontro.';
export function sell(s,id){
 const c=s.save.character,reason=village(s)||blocked(s);if(reason)return no(reason);
 const index=c.gearBag.findIndex(i=>i.id===id);if(index<0)return no('Peça não encontrada.');
 const [item]=c.gearBag.splice(index,1),price=EQ.sellPrice(item);c.gold+=price;return ok(gearName(item)+' vendido por '+price+' ouro.');
}
// Na vila o mercador vende peças do nível da maior wave liberada; no menu vale a configuração explícita.
export const relicLevel=s=>s.scene==='village'?s.save.character.waveProgress.unlocked:s.save.settings.gearLevel;
export const relicPrice=s=>EQ.price(relicLevel(s));
export function buy(s,type){
 const c=s.save.character,reason=village(s)||blocked(s);if(reason)return no(reason);
 if(!EQ.slots[type])return no('Tipo inválido.');if(c.gearBag.length>=CAPACITY)return no('Mochila cheia.');
 const level=relicLevel(s),cost=EQ.price(level);if(c.gold<cost)return no('Ouro insuficiente: '+cost+'.');
 const item=EQ.generate(level,Build,s.world.random,type,false,newItemId(s),{extraAffixes:['lifesteal']});c.gold-=cost;c.gearBag.push(item);return ok(gearName(item)+' nível '+item.level+' comprado por '+cost+' ouro.');
}
// Ao deixar o encontro, tudo que o filtro permite e cabe na mochila é coletado; o restante se perde.
export function collectAll(s){
 const w=s.world,c=s.save.character;let collected=0,left=0;
 for(const d of w.drops)if(d.kind==='equipment'&&lootAllowed(d,w.lootFilter)){if(c.gearBag.length<CAPACITY){c.gearBag.push(d.item);collected++;}else left++;}
 w.drops=[];return {collected,left};
}

// Bran melhora a base em 25% por grau; afixos e nível permanecem intactos.
export const forgePrice=item=>EQ.price(item.level)*((item.enhancement||0)+1);
export const rerollPrice=item=>EQ.price(item.level)*2;
export function forge(s,id,index=null){
 const c=s.save.character,item=[...c.gearBag,...Object.values(c.equipment)].find(i=>i.id===id);
 if(s.scene!=='village')return no('Bran atende apenas na vila.');
 if(!item)return no('Peça não encontrada.');
 const upgrade=index===null,cost=upgrade?forgePrice(item):rerollPrice(item);
 if(upgrade&&(item.enhancement||0)>=5)return no('Aprimoramento máximo: +5.');
 if(!upgrade&&(!Number.isInteger(index)||!item.affixes[index]))return no('Atributo inválido.');
 if(c.gold<cost)return no('Ouro insuficiente.');
 if(upgrade)item.enhancement=(item.enhancement||0)+1;
 else{
  const pool=EQ.pools[item.type].filter(stat=>!item.affixes.some(a=>a.stat===stat));
  if(!pool.length)return no('Nenhum atributo alternativo disponível.');
  const stat=pool[Math.floor(s.world.random()*pool.length)],def=EQ.attributes[stat],scale=1+(item.level-1)*.12;
  item.affixes[index]={stat,value:Math.round(def.base*scale*(.7+s.world.random()*.6)*100)/100};
 }
 c.gold-=cost;refreshGear(s);return ok(upgrade?'Bran aprimorou a peça para +'+item.enhancement+'.':'Bran substituiu o atributo.');
}
