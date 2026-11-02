// Catálogo próprio da v2: não altera itens ou regras do Necromante.
import Shared from './shared-equipment.mjs';
const slots={sword:{name:'Espada de uma mão',icon:'⚔',base:'damageFlat'},shield:{name:'Escudo',icon:'🛡',base:'blockChance'},body:{name:'Armadura',icon:'♜',base:'hp'},head:{name:'Elmo',icon:'♙',base:'hp'},boots:{name:'Botas',icon:'♟',base:'moveFlat'},ring1:{name:'Anel esquerdo',icon:'◉',base:'hpRegen'},ring2:{name:'Anel direito',icon:'◉',base:'hpRegen'}};
const attributes={damageFlat:{name:'Dano',base:11},damagePercent:{name:'Dano',base:5,percent:true},blockChance:{name:'Defesa de escudo',base:5,percent:true,fixed:true},hp:{name:'Vida máxima',base:12},defense:{name:'Armadura',base:10},defensePercent:{name:'Armadura',base:10,percent:true},hpRegen:{name:'Recuperação de vida',base:.25},moveFlat:{name:'Movimento',base:.05},move:{name:'Movimento',base:1,percent:true},cooldown:{name:'Redução de recarga',base:1,percent:true},mp:{name:'Vigor máximo',base:8},regen:{name:'Recuperação de vigor',base:.4}};
const pools={sword:['damagePercent','hp','regen','cooldown','hpRegen'],shield:['defensePercent','hp','hpRegen','cooldown','regen'],body:['hpRegen','defensePercent','hp','mp','cooldown'],head:['hp','mp','hpRegen','defensePercent','regen'],boots:['move','hp','hpRegen','defensePercent','cooldown'],ring1:['damagePercent','hp','blockChance','regen','cooldown','hpRegen'],ring2:['damagePercent','hp','blockChance','regen','cooldown','hpRegen']};
const rarities=Shared.rarities;
export function allowed(item){return !!item&&!!slots[item.type]&&(item.classId==='warrior'||!['sword','shield'].includes(item.type));}
function generate(level,tree,random=Math.random,type,boss=false,id,options={}){
 level=Math.max(1,Math.floor(level));type=slots[type]?type:Object.keys(slots)[Math.min(6,Math.floor(random()*7))];
 const choices=Object.entries(rarities).filter(([r])=>!boss||r!=='common');let roll=random()*choices.reduce((s,[r,d])=>s+(options.loot?.weights?.[r]??d.weight),0),rarity=choices.at(-1)[0];for(const [r,d] of choices){roll-=options.loot?.weights?.[r]??d.weight;if(roll<0){rarity=r;break;}}
 const value=stat=>Math.round(attributes[stat].base*(attributes[stat].fixed?1:1+(level-1)*.12)*(.7+random()*.6)*100)/100;
 const pool=[...pools[type]],affixes=[];for(let i=0;i<rarities[rarity].count;i++){const stat=pool.splice(Math.min(pool.length-1,Math.floor(random()*pool.length)),1)[0];affixes.push({stat,value:value(stat)});}
 return {version:1,classId:'warrior',id:id||'martial-'+Date.now().toString(36),type,level,originWave:level,rarity,base:{stat:slots[type].base,value:value(slots[type].base)},affixes,...(options.loot?.unboundedLevel?{region:'valdoria'}:{})};
}
function validate(i,tree){
 if(i?.classId!=='warrior')return Shared.validate(i,tree);
 if(i.version!==1||!slots[i.type]||!rarities[i.rarity]||typeof i.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(i.id)||!Number.isSafeInteger(i.level)||i.level<1||i.level>1000&&i.region!=='valdoria'||i.base?.stat!==slots[i.type].base||!Array.isArray(i.affixes)||i.affixes.length!==rarities[i.rarity].count)return null;
 const seen=new Set();for(const [n,a] of [i.base,...i.affixes].entries()){
  const def=attributes[a?.stat];if(!def||!Number.isFinite(a.value)||a.value<=0||a.value>def.base*(def.fixed?1:1+(i.level-1)*.12)*1.3+.02||n>0&&(!pools[i.type].includes(a.stat)||seen.has(a.stat)))return null;if(n>0)seen.add(a.stat);
 }
 if(i.enhancement!==undefined&&(!Number.isInteger(i.enhancement)||i.enhancement<0||i.enhancement>5))return null;
 return JSON.parse(JSON.stringify(i));
}
function migrate(data,tree){const seen=new Set(),equipment={},gearBag=[];const read=i=>{const v=validate(i,tree);if(!v||seen.has(v.id))return null;seen.add(v.id);return v;};for(const [slot,item]of Object.entries(data.equipment||{})){const i=read(item);if(i&&(slot===i.type||slot.startsWith('ring')&&i.type.startsWith('ring')))equipment[slot]=i;}for(const item of data.gearBag||[]){const i=read(item);if(i)gearBag.push(i);}return {equipment,gearBag,waveProgress:Shared.progress({...data.waveProgress,best:Math.max(data.waveProgress?.best||0,data.camp?.eb||0)})};}
function baseDefense(i){return i&&['body','head','boots'].includes(i.type)?Shared.baseDefense(i):0;}
function bonuses(data){const out={};for(const i of Object.values(data.equipment||{}).filter(allowed)){for(const a of [{...i.base,value:i.base.value*Shared.enhancementMultiplier(i)},...i.affixes])if(attributes[a.stat])out[a.stat]=(out[a.stat]||0)+a.value;out.defense=(out.defense||0)+baseDefense(i);}out.defense=(out.defense||0)*(1+(out.defensePercent||0)/100);return out;}
function dropRoll(equipment,level,random=Math.random){const weakest=Object.keys(slots).reduce((a,b)=>(equipment[a]?.level||0)<=(equipment[b]?.level||0)?a:b);return {level,type:random()<.5?weakest:undefined,upgrade:!equipment[weakest]};}
function describe(a){const d=attributes[a.stat];return d?'+'+a.value+(d.percent?'%':'')+' '+d.name:'Afixo do Necromante (inativo)';}
const api={...Shared,allowed,slots,attributes,pools,generate,validate,migrate,bonuses,dropRoll,baseDefense,describe,effects:()=>({extra:{}})};
export default api;
