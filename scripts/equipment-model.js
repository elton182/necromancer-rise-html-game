(function(root){
'use strict';
const VERSION=1,CAPACITY=60,MAX_WAVE=1000;
const slots={staff:{name:'Cajado',icon:'⚚',base:'spell'},grimoire:{name:'Grimório',icon:'▤',base:'horde'},body:{name:'Vestimenta',icon:'♜',base:'hp'},head:{name:'Capuz',icon:'♙',base:'mp'},boots:{name:'Botas',icon:'♟',base:'move'},ring1:{name:'Anel esquerdo',icon:'◉',base:'regen'},ring2:{name:'Anel direito',icon:'◉',base:'regen'}};
const rarities={common:{name:'Comum',color:'#c7c9c2',count:0,weight:60},magic:{name:'Mágico',color:'#73b5ff',count:2,weight:28},rare:{name:'Raro',color:'#ecd16b',count:3,weight:10},epic:{name:'Épico',color:'#c994ff',count:4,weight:2}};
const attributes={hp:{name:'Vida máxima',base:12},mp:{name:'Mana máxima',base:8},spell:{name:'Dano mágico',base:4,percent:true},horde:{name:'Dano da horda',base:4,percent:true},hordeHp:{name:'Vida da horda',base:6,percent:true},regen:{name:'Regeneração de mana',base:.4},move:{name:'Movimento',base:1,percent:true},cooldown:{name:'Redução de recarga',base:1,percent:true}};
const pools={staff:['spell','mp','regen','horde','cooldown'],grimoire:['horde','hordeHp','mp','regen','spell'],body:['hp','mp','hordeHp','regen','cooldown'],head:['mp','hp','regen','spell','horde'],boots:['move','hp','mp','regen','cooldown'],ring1:['hp','mp','spell','horde','regen','cooldown'],ring2:['hp','mp','spell','horde','regen','cooldown']};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const waveNumber=n=>clamp(Math.floor(Number(n)||1),1,MAX_WAVE);
function waveStats(n){n=waveNumber(n);return {wave:n,hp:1.12**(n-1),damage:1.08**(n-1),xp:1.04**(n-1),itemLevel:n,maxEnemies:60};}
function progress(raw={}){const best=clamp(Math.floor(Number(raw.best)||0),0,MAX_WAVE),unlocked=Math.min(MAX_WAVE,best+1);return {best,unlocked,selected:clamp(Math.floor(Number(raw.selected)||1),1,unlocked)};}
function complete(raw,n){const p=progress(raw);if(!Number.isInteger(n)||n<1||n>p.unlocked)return p;n=waveNumber(n);p.best=Math.max(p.best,n);return progress(p);}
function price(level){return 25+10*waveNumber(level);}
function sellPrice(item){return Math.floor(price(item.level)*.15);}
function generate(level,tree,random=Math.random,type,boss=false,id,options={}){
 const loot=options.loot||{};
 level=waveNumber(level);type=slots[type]?type:Object.keys(slots)[Math.floor(random()*7)];
 const eligible=Object.entries(rarities).map(([k,v])=>[k,{...v,weight:loot.weights?.[k]??v.weight}]).filter(([k])=>!boss||k!=='common');let roll=random()*eligible.reduce((s,[,v])=>s+v.weight,0),rarity=eligible.at(-1)[0];
 for(const [k,v]of eligible){roll-=v.weight;if(roll<0){rarity=k;break;}}
 const scale=1+(level-1)*(loot.valuePerLevel??.12),value=stat=>Math.round(attributes[stat].base*scale*(.7+random()*.6)*100)/100;
 const base={stat:slots[type].base,value:value(slots[type].base)},pool=[...pools[type]],affixes=[];
 if(level>=(loot.skillBonusMinLevel??4))pool.push('skill');if(level>=(loot.schoolBonusMinLevel??8)&&['rare','epic'].includes(rarity))pool.push('school');
 for(let i=0;i<(loot.affixes?.[rarity]??rarities[rarity].count);i++){
  if(!pool.length)throw Error('Atributos insuficientes para a raridade.');
  const stat=pool.splice(Math.floor(random()*pool.length),1)[0];
  if(stat==='skill'){const nodes=tree.nodes.filter(n=>n.max>1);affixes.push({stat,target:nodes[Math.floor(random()*nodes.length)].id,value:level>=12&&random()<.25?2:1});}
  else if(stat==='school')affixes.push({stat,target:tree.schools[Math.floor(random()*tree.schools.length)].id,value:1});
  else affixes.push({stat,value:value(stat)});
 }
 return {version:VERSION,id:id||'eq-'+Date.now().toString(36)+'-'+random().toString(36).slice(2,12),type,level,originWave:level,rarity,base,affixes};
}
function validate(item,tree){
 if(!item||item.version!==VERSION||!slots[item.type]||!rarities[item.rarity]||typeof item.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(item.id)||!Number.isInteger(item.level)||item.level<1||item.level>MAX_WAVE)return null;
 if(!item.base||item.base.stat!==slots[item.type].base||!Array.isArray(item.affixes)||item.affixes.length!==rarities[item.rarity].count)return null;
 const seen=new Set();
 function attr(a,base=false){
  if(!a||!Number.isFinite(a.value)||a.value<=0)return null;
  if(['skill','school'].includes(a.stat)){
   if(base||!Number.isInteger(a.value)||a.value>(a.stat==='school'?1:2)||item.level<(a.stat==='school'?8:4))return null;
   if(a.stat==='skill'&&(!tree.byId[a.target]||tree.byId[a.target].max===1))return null;
   if(a.stat==='school'&&(!['rare','epic'].includes(item.rarity)||!tree.schools.some(s=>s.id===a.target)))return null;
   return {stat:a.stat,target:a.target,value:a.value};
  }
  if(!attributes[a.stat]||!base&&!pools[item.type].includes(a.stat)||a.value>attributes[a.stat].base*(1+(item.level-1)*.12)*1.3+.02)return null;
  return {stat:a.stat,value:a.value};
 }
 const base=attr(item.base,true);if(!base)return null;const affixes=[];
 for(const a of item.affixes){if(!a||seen.has(a.stat))return null;seen.add(a.stat);const v=attr(a);if(!v)return null;affixes.push(v);}
 return {version:VERSION,id:item.id,type:item.type,level:item.level,originWave:waveNumber(item.originWave||item.level),rarity:item.rarity,base,affixes};
}
function migrate(data,tree){
 const seen=new Set(),equipment={};
 const read=raw=>{const i=validate(raw,tree);if(!i||seen.has(i.id))return null;seen.add(i.id);return i;};
 for(const slot of Object.keys(slots)){const i=read(data.equipment?.[slot]);if(i&&(i.type===slot||slot.startsWith('ring')&&i.type.startsWith('ring')))equipment[slot]=i;}
 const gearBag=[];for(const raw of (Array.isArray(data.gearBag)?data.gearBag:[]).slice(0,CAPACITY)){const i=read(raw);if(i)gearBag.push(i);}
 Object.assign(data,{equipmentVersion:VERSION,equipment,gearBag,waveProgress:progress(data.waveProgress||{best:data.camp?.eb||0})});return data;
}
function items(data){return Object.values(data.equipment||{});}
function bonuses(data){const out={};for(const i of items(data))for(const a of [i.base,...i.affixes])if(attributes[a.stat])out[a.stat]=(out[a.stat]||0)+a.value;out.move=Math.min(30,out.move||0);out.cooldown=Math.min(50,out.cooldown||0);return out;}
function effects(tree,ranks,equipment){
 const e=tree.effects(ranks),extra={};
 for(const n of tree.nodes){if(!ranks[n.id]||n.max===1)continue;let count=0;
  for(const i of Object.values(equipment||{}))for(const a of i.affixes)if(a.stat==='skill'&&a.target===n.id||a.stat==='school'&&a.target===n.school)count+=a.value;
  extra[n.id]=count;
  for(const [key,value]of Object.entries(n.effects)){if(n.id==='bolt'&&key==='Dano da Chuva de Ossos'||n.id==='rain'&&key==='Dano do Tiro de Osso')continue;e[key]=(e[key]||0)+value*count;}
 }
 if(e['Redução de dano da Maldição'])e['Redução de dano da Maldição']=Math.min(75,e['Redução de dano da Maldição']);
 if(e['Recarga do Dash'])e['Recarga do Dash']=Math.max(-50,e['Recarga do Dash']);
 if(e['Recarga do Passo Espectral'])e['Recarga do Passo Espectral']=Math.max(-50,e['Recarga do Passo Espectral']);
 return {effects:e,extra};
}
function targetLabel(a,tree){if(a.stat==='skill')return tree.byId[a.target]?.name||a.target;const s=tree.schools.find(s=>s.id===a.target);return s?s.name+' · '+(s.tree==='minions'?'Minions':'Profana'):a.target;}
function describe(a,tree){return ['skill','school'].includes(a.stat)?'+'+a.value+' em '+(a.stat==='school'?'toda a escola ':'')+targetLabel(a,tree):'+'+Number(a.value.toFixed(2))+(attributes[a.stat].percent?'%':'')+' '+attributes[a.stat].name+(a.stat==='regen'?'/s':'');}
const api={VERSION,CAPACITY,MAX_WAVE,slots,rarities,attributes,pools,waveNumber,waveStats,progress,complete,price,sellPrice,generate,validate,migrate,items,bonuses,effects,describe};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EquipmentModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
