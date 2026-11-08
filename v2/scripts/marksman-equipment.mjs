// Catálogo de equipamentos da Arqueira e do Mercenário: a arma própria da classe (Arco ou Besta) mais
// armadura, elmo, botas e anéis do catálogo marcial. Não altera os itens do Guerreiro nem do Necromante.
// Armas levam classId da classe ('archer' / 'mercenary'); as demais peças continuam com o selo marcial.
import WarriorGear from './warrior-equipment.mjs';

export const MARKSMAN_ARMOR=['body','head','boots','ring1','ring2'];
export const MARKSMAN_WEAPONS={
 archer:{type:'bow',slot:{name:'Arco',icon:'🏹',base:'damageFlat'},pool:['damagePercent','mp','regen','cooldown','move']},
 mercenary:{type:'crossbow',slot:{name:'Besta',icon:'➹',base:'damageFlat'},pool:['damagePercent','hp','regen','cooldown','defensePercent']},
};
export const weaponType=classId=>MARKSMAN_WEAPONS[classId]?.type;
const {attributes,rarities}=WarriorGear;
const scaleOf=(stat,level)=>attributes[stat].fixed?1:1+(level-1)*.12;
const catalogs=new Map();

export function marksmanGear(classId){
 if(catalogs.has(classId))return catalogs.get(classId);
 const W=MARKSMAN_WEAPONS[classId]||MARKSMAN_WEAPONS.archer,weapon=W.type;
 const slots={[weapon]:W.slot,...Object.fromEntries(MARKSMAN_ARMOR.map(k=>[k,WarriorGear.slots[k]]))},types=Object.keys(slots);
 const pools={...WarriorGear.pools,[weapon]:W.pool};
 const isWeapon=item=>item?.type===weapon;
 const allowed=item=>!!item&&!!slots[item.type]&&(isWeapon(item)?item.classId===classId:item.classId==='warrior'||!item.classId);
 // Mesma rolagem do catálogo marcial (raridade, valores por nível e afixos sem repetição).
 function rollWeapon(level,random,boss,id,options){
  level=Math.max(1,Math.floor(level));
  const choices=Object.entries(rarities).filter(([r])=>!boss||r!=='common');let roll=random()*choices.reduce((s,[r,d])=>s+(options.loot?.weights?.[r]??d.weight),0),rarity=choices.at(-1)[0];
  for(const [r,d] of choices){roll-=options.loot?.weights?.[r]??d.weight;if(roll<0){rarity=r;break;}}
  const value=stat=>Math.round(attributes[stat].base*scaleOf(stat,level)*(.7+random()*.6)*100)/100;
  const pool=[...W.pool],affixes=[];for(let i=0;i<rarities[rarity].count;i++){const stat=pool.splice(Math.min(pool.length-1,Math.floor(random()*pool.length)),1)[0];affixes.push({stat,value:value(stat)});}
  return {version:1,classId,id:id||'marksman-'+Date.now().toString(36),type:weapon,level,originWave:level,rarity,base:{stat:W.slot.base,value:value(W.slot.base)},affixes,...(options.loot?.unboundedLevel?{region:'valdoria'}:{})};
 }
 function generate(level,tree,random=Math.random,type,boss=false,id,options={}){
  type=slots[type]?type:types[Math.min(types.length-1,Math.floor(random()*types.length))];
  return type===weapon?rollWeapon(level,random,boss,id,options):WarriorGear.generate(level,tree,random,type,boss,id,options);
 }
 function validate(i,tree){
  if(!isWeapon(i))return MARKSMAN_ARMOR.includes(i?.type)?WarriorGear.validate(i,tree):null;
  if(i.classId!==classId||i.version!==1||!rarities[i.rarity]||typeof i.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(i.id)||!Number.isSafeInteger(i.level)||i.level<1||i.level>1000&&i.region!=='valdoria'||i.base?.stat!==W.slot.base||!Array.isArray(i.affixes)||i.affixes.length!==rarities[i.rarity].count)return null;
  const seen=new Set();for(const [n,a] of [i.base,...i.affixes].entries()){
   const def=attributes[a?.stat];if(!def||!Number.isFinite(a.value)||a.value<=0||a.value>def.base*scaleOf(a.stat,i.level)*1.3+.02||n>0&&(!W.pool.includes(a.stat)||seen.has(a.stat)))return null;if(n>0)seen.add(a.stat);
  }
  if(i.enhancement!==undefined&&(!Number.isInteger(i.enhancement)||i.enhancement<0||i.enhancement>5))return null;
  return JSON.parse(JSON.stringify(i));
 }
 function migrate(data,tree){
  const seen=new Set(),equipment={},gearBag=[],read=i=>{const v=validate(i,tree);if(!v||seen.has(v.id))return null;seen.add(v.id);return v;};
  for(const [slot,item]of Object.entries(data.equipment||{})){const i=read(item);if(i&&(slot===i.type||slot.startsWith('ring')&&i.type.startsWith('ring')))equipment[slot]=i;}
  for(const item of data.gearBag||[]){const i=read(item);if(i)gearBag.push(i);}
  return {equipment,gearBag,waveProgress:WarriorGear.progress({...data.waveProgress,best:Math.max(data.waveProgress?.best||0,data.camp?.eb||0)})};
 }
 // Armadura pelo catálogo marcial; a arma soma base (com aprimoramento) e afixos.
 function bonuses(data){
  const equipment=data?.equipment||{},armor=Object.fromEntries(Object.entries(equipment).filter(([slot,item])=>MARKSMAN_ARMOR.includes(slot)&&allowed(item))),out=WarriorGear.bonuses({...data,equipment:armor});
  const w=equipment[weapon];
  if(allowed(w)){out.defense=(out.defense||0)/(1+(out.defensePercent||0)/100);for(const a of [{...w.base,value:w.base.value*WarriorGear.enhancementMultiplier(w)},...w.affixes])out[a.stat]=(out[a.stat]||0)+a.value;out.defense*=1+(out.defensePercent||0)/100;}
  return out;
 }
 function dropRoll(equipment,level,random=Math.random){const weakest=types.reduce((a,b)=>(equipment?.[a]?.level||0)<=(equipment?.[b]?.level||0)?a:b);return {level,type:random()<.5?weakest:undefined,upgrade:!equipment?.[weakest]};}
 const api={...WarriorGear,slots,pools,allowed,generate,validate,migrate,bonuses,dropRoll,weapon};
 catalogs.set(classId,api);return api;
}
// Arma inicial: comum, nível 1, criada uma única vez por personagem.
export const starterWeapon=(classId,slotId)=>marksmanGear(classId).generate(1,null,()=>.2,weaponType(classId),false,'starter-'+weaponType(classId)+'-'+(slotId||'imported'));
