(function(root){
'use strict';
const VERSION=2,CAPACITY=60,MAX_WAVE=1000;
const slots={staff:{name:'Cajado',icon:'⚚',base:'spellFlat'},grimoire:{name:'Grimório',icon:'▤',base:'hordeFlat'},body:{name:'Vestimenta',icon:'♜',base:'hp'},head:{name:'Capuz',icon:'♙',base:'mp'},boots:{name:'Botas',icon:'♟',base:'moveFlat'},ring1:{name:'Anel esquerdo',icon:'◉',base:'regen'},ring2:{name:'Anel direito',icon:'◉',base:'regen'}};
const rarities={common:{name:'Comum',color:'#c7c9c2',count:0,weight:60},magic:{name:'Mágico',color:'#73b5ff',count:2,weight:28},rare:{name:'Raro',color:'#ecd16b',count:3,weight:10},epic:{name:'Épico',color:'#c994ff',count:4,weight:2}};
const attributes={hp:{name:'Vida máxima de Zephyr',base:12},mp:{name:'Mana máxima',base:8},spellFlat:{name:'Dano mágico base',base:11,min:10,max:12},hordeFlat:{name:'Dano base da horda',base:4,min:3,max:5},moveFlat:{name:'Velocidade de movimento',base:.05},spell:{name:'Dano mágico',base:4,percent:true},horde:{name:'Dano da horda',base:4,percent:true},hordeHp:{name:'Vida da horda',base:12,percent:true},regen:{name:'Regeneração de mana',base:.4},move:{name:'Movimento',base:1,percent:true},cooldown:{name:'Redução de recarga',base:1,percent:true}};
const pools={staff:['spell','mp','regen','horde','hordeHp','cooldown'],grimoire:['horde','hordeHp','mp','regen','spell'],body:['hp','mp','hordeHp','regen','cooldown'],head:['mp','hp','regen','spell','horde','hordeHp'],boots:['move','hp','mp','regen','hordeHp','cooldown'],ring1:['hp','mp','spell','horde','hordeHp','regen','cooldown'],ring2:['hp','mp','spell','horde','hordeHp','regen','cooldown']};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const waveNumber=n=>clamp(Math.floor(Number(n)||1),1,MAX_WAVE);
function waveStats(n){n=waveNumber(n);return {wave:n,hp:1.12**(n-1),damage:1.08**(n-1),xp:1.04**(n-1)*(n<10?1:1.5*1.1**(Math.min(n,60)-10)),itemLevel:n,maxEnemies:60};}
function progress(raw={}){const best=clamp(Math.floor(Number(raw.best)||0),0,MAX_WAVE),unlocked=Math.min(MAX_WAVE,best+1);return {best,unlocked,selected:clamp(Math.floor(Number(raw.selected)||1),1,unlocked)};}
function complete(raw,n){const p=progress(raw);if(!Number.isInteger(n)||n<1||n>p.unlocked)return p;n=waveNumber(n);if(n>p.best){p.best=n;p.selected=Math.min(MAX_WAVE,n+1);}return progress(p);}
function price(level){return 25+10*waveNumber(level);}
function sellPrice(item){return Math.floor(price(item.level)*.15);}
function generate(level,tree,random=Math.random,type,boss=false,id,options={}){
 const loot=options.loot||{};
 level=waveNumber(level);type=slots[type]?type:Object.keys(slots)[Math.floor(random()*7)];
 const eligible=Object.entries(rarities).map(([k,v])=>[k,{...v,weight:loot.weights?.[k]??v.weight}]).filter(([k])=>!boss||k!=='common');let roll=random()*eligible.reduce((s,[,v])=>s+v.weight,0),rarity=eligible.at(-1)[0];
 for(const [k,v]of eligible){roll-=v.weight;if(roll<0){rarity=k;break;}}
 const scale=1+(level-1)*(loot.valuePerLevel??.12),value=stat=>{const a=attributes[stat],roll=random();return a.min!==undefined?Math.round((a.min+Math.min(a.max-a.min,Math.floor(roll*(a.max-a.min+1))))*scale):Math.round(a.base*scale*(.7+roll*.6)*100)/100;};
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
// Catch-up: while worn gear trails the drop level (empty slots count as 0), some drops roll above it,
// and half of those are cut for the weakest slot. The further behind, the likelier and bigger the jump.
function dropRoll(equipment,level,random=Math.random){
 level=waveNumber(level);
 const worn=Object.keys(slots).map(slot=>({slot,level:equipment?.[slot]?.level||0})),deficit=level-worn.reduce((s,w)=>s+w.level,0)/worn.length;
 if(deficit<1||random()>=Math.min(.6,.15+.05*deficit))return {level,type:undefined,upgrade:false};
 const bonus=1+Math.floor(random()*Math.min(10,Math.ceil(deficit/2))),weakest=worn.reduce((a,b)=>b.level<a.level?b:a);
 return {level:waveNumber(level+bonus),type:random()<.5?weakest.slot:undefined,upgrade:true};
}
function validate(item,tree){
 // Upgrade old percentage bases deterministically; retain identity, rarity and affixes.
 if(item?.version===1){
  const old={staff:'spell',grimoire:'horde',boots:'move'}[item.type]||slots[item.type]?.base,a=item.base,scale=1+(item.level-1)*.12;
  if(!a||a.stat!==old||!Number.isFinite(a.value)||a.value<=0||!attributes[old]||a.value>attributes[old].base*scale*1.3+.02)return null;
  const stat=slots[item.type].base,def=attributes[stat],quality=clamp((a.value/(attributes[old].base*scale)-.7)/.6,0,1);
  const value=old===stat?a.value:def.min!==undefined?Math.round((def.min+(def.max-def.min)*quality)*scale):Math.round(def.base*scale*(.7+quality*.6)*100)/100;
  item={...item,version:VERSION,base:{stat,value}};
 }
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
  const def=attributes[a.stat],scale=1+(item.level-1)*.12;
  if(!def||!base&&!pools[item.type].includes(a.stat)||a.value>(def.max!==undefined?Math.round(def.max*scale):def.base*scale*1.3)+.02||base&&def.min!==undefined&&a.value<Math.round(def.min*scale))return null;
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
 // The arena record predates waveProgress and can be newer in existing saves.
 const saved=progress(data.waveProgress||{}),arena=progress({best:data.camp?.eb});
 const waveProgress=progress({...saved,best:Math.max(saved.best,arena.best)});
 Object.assign(data,{equipmentVersion:VERSION,equipment,gearBag,waveProgress});return data;
}
function items(data){return Object.values(data.equipment||{});}
function bonuses(data){const out={};for(const i of items(data))for(const a of [i.base,...i.affixes])if(attributes[a.stat])out[a.stat]=(out[a.stat]||0)+a.value;out.move=Math.min(30,out.move||0);out.cooldown=Math.min(50,out.cooldown||0);return out;}
function spellDamage(level,b={}){return Math.round((40+4*(level-1)+(b.spellFlat||0))*(1+(b.spell||0)/100));}
function moveSpeed(b={}){return Math.min(5.2,(4+(b.moveFlat||0))*(1+(b.move||0)/100));}
function effects(tree,ranks,equipment){
 const e=tree.effects(ranks),extra={};
 for(const n of tree.nodes){if(!ranks[n.id]||n.max===1)continue;let count=0;
  for(const i of Object.values(equipment||{}))for(const a of i.affixes)if(a.stat==='skill'&&a.target===n.id||a.stat==='school'&&a.target===n.school)count+=a.value;
  extra[n.id]=count;
  for(const [key,value]of Object.entries(n.effects)){if((tree.directSynergies?.[n.id]||[]).includes(key))continue;e[key]=(e[key]||0)+value*count;}
 }
 if(e['Redução de dano da Maldição'])e['Redução de dano da Maldição']=Math.min(75,e['Redução de dano da Maldição']);
 if(e['Recarga do Dash'])e['Recarga do Dash']=Math.max(-50,e['Recarga do Dash']);
 if(e['Recarga do Passo Espectral'])e['Recarga do Passo Espectral']=Math.max(-50,e['Recarga do Passo Espectral']);
 return {effects:e,extra};
}
function targetLabel(a,tree){if(a.stat==='skill')return tree.byId[a.target]?.name||a.target;const s=tree.schools.find(s=>s.id===a.target);return s?s.name+' · '+(s.tree==='minions'?'Minions':'Profana'):a.target;}
function describe(a,tree){return ['skill','school'].includes(a.stat)?'+'+a.value+' em '+(a.stat==='school'?'toda a escola ':'')+targetLabel(a,tree):'+'+Number(a.value.toFixed(2))+(attributes[a.stat].percent?'%':'')+' '+attributes[a.stat].name+(a.stat==='regen'?'/s':'');}
// Read-only estimates: one stationary target, all hits connect, each skill evaluated alone.
function snapshot(tree,data,defs,tuning,equipment=data.equipment||{}){
 const masteryModel=root.SkillMasteryModel||(typeof module!=='undefined'&&module.exports?require('./skill-mastery-model.js'):null);
 const mastery=id=>masteryModel?masteryModel.bonus(id,data.skillMastery?.[id]):{},mf=(id,key)=>1+(mastery(id)[key]||0)/100,mc=id=>1-(mastery(id).cooldown||0)/100;
 const level=Math.max(1,Number(data.level)||1),ranks=data.skillRanks||{},e=effects(tree,ranks,equipment).effects,b=bonuses({equipment}),pct=k=>1+(e[k]||0)/100;
 const stat={hp:Math.round((100+10*(level-1))*pct('Vida de Zephyr')+(b.hp||0)),mp:Math.round((80+5*(level-1))*pct('Mana máxima')+(b.mp||0)),spell:spellDamage(level,b),regen:(4+.3*(level-1))*pct('Regeneração de mana')+(b.regen||0),hpRegen:.2*(level-1),move:moveSpeed(b),cooldown:b.cooldown||0,hordeDps:0,hordeHp:0,hordeRegen:0};
 const rows=[],factor=1-(b.cooldown||0)/100,cd=(base,skill=1)=>Math.max(base*.5,base*skill*factor),grants=data.skillGrants||['raio','dash'],loadout=data.actionLoadout||[];
 const learned=(node,action)=>!!ranks[node]||grants.includes(action);
 function row(id,name,damage,cooldown,mana,note='',continuous){rows.push({id,name,damage,cooldown,mana,note,equipped:loadout.includes(id),dps:damage===null?null:damage/cooldown,sustained:damage===null?null:continuous??damage/Math.max(cooldown,mana?mana/stat.regen:0)});}
 if(learned('bolt','raio'))row('raio','Tiro de Osso',Math.floor(stat.spell*tuning.boltMultiplier*pct('Dano do Tiro de Osso')*mf('raio','damage')),cd(.5)*mc('raio'),20,ranks.shards?'3 estilhaços em leque; cada inimigo é atingido uma vez por disparo.':'Um alvo; perfuração não multiplica o dano no mesmo alvo.');
 if(learned('rain','chuva'))row('chuva','Chuva de Ossos',7*Math.floor(stat.spell*.7*pct('Dano da Chuva de Ossos')*mf('chuva','damage')),cd(5)*mc('chuva'),40,'Teto de dano: os 7 fragmentos acertando o mesmo alvo.');
 if(learned('nova','explosao'))row('explosao','Explosão Necrótica',Math.floor((stat.spell*2.5+stat.spell*2.5*((e['Dano da Explosão Necrótica']||0)+(e['Dano das explosões de Zumbi e Necrótica']||0))/100)*mf('explosao','damage')),cd(8)*mc('explosao'),60,'Dano por alvo na área.');
 if(learned('wall','maos')){const duration=5*pct('Duração da Muralha')*mf('maos','duration'),hit=Math.round(Math.max(1,Math.round(stat.spell*.4))*mf('maos','damage'));row('maos','Muralha de Corpos',hit*Math.ceil(duration/.5),cd(12)*mc('maos'),35,'Estimativa: contato contínuo por '+duration.toFixed(1)+' s, pulsos de 0,5 s.');}
 const groups={};
 for(const type of ['zombie','skeleton','archer','specter','abom']){
  if(!ranks[type]||!defs[type])continue;
  const d=defs[type],flesh=['zombie','abom'].includes(type),bone=['skeleton','archer'].includes(type);
  const hpBonus=(e[flesh?'Vida de Zumbis e Abominações':bone?'Vida de Esqueletos e Arqueiros':'Vida dos Espectros']||0)+(type==='abom'?e['Vida da Abominação']||0:type==='skeleton'?e['Vida dos Guerreiros']||0:type==='zombie'?e['Vida de Zumbis']||0:0)+(b.hordeHp||0);
  const damageBonus=(e[flesh?'Dano de Zumbis e Abominações':bone?'Dano de Esqueletos e Arqueiros':'Dano dos Espectros']||0)+(type==='abom'?e['Dano da Abominação']||0:type==='archer'?e['Dano dos Arqueiros']||0:type==='zombie'?e['Dano de Zumbis']||0:0)+(b.horde||0)+(e['Dano da horda próxima']||0);
  const count=type==='zombie'?3+(e['Zumbis adicionais']||0):type==='skeleton'?3+(e['Guerreiros adicionais']||0):type==='archer'?2+(e['Arqueiros adicionais']||0):type==='specter'?2+(e['Espectros adicionais']||0):1;
  const raw=bonus=>(d.dmg+level-1+(b.hordeFlat||0))*mf(type,'damage')*(1+(damageBonus+bonus)/100),damage=Math.round(raw(0));
  groups[type]={count,raw};row(type,d.name+' · ataques',count*damage,d.atkRate,0,count+' aliados vivos, atacando sem interrupção e dentro da aura.');
  if(loadout.includes(type)){const hp=Math.round(Math.round((d.hp*tuning.minionHpMultiplier+(level-1)*tuning.minionHpPerLevel)*(1+hpBonus/100))*mf(type,'hp'));stat.hordeDps+=count*damage/d.atkRate;stat.hordeHp+=count*hp;stat.hordeRegen+=count*hp*tuning.minionRegen*mf(type,'regen');}
 }
 if(groups.zombie&&ranks.burst){const g=groups.zombie,damage=Math.round(g.raw((e['Dano da explosão de Zumbi']||0)+(e['Dano das explosões de Zumbi e Necrótica']||0))*tuning.zombieBurstMultiplier),cooldown=cd(1.2);row('zombie-burst','Explosão do Zumbi',damage,cooldown,0,'Um zumbi; raio '+tuning.zombieBurstRadius+'. Contínuo: grupo limitado pelo renascimento de 12 s.',damage/Math.max(cooldown,12/g.count));rows.at(-1).equipped=loadout.includes('zombie');}
 if(groups.archer&&ranks.shot){const g=groups.archer;row('archer-shot','Tiro Sepulcral',g.count*Math.round(g.raw(e['Dano do Tiro Sepulcral']||0)*1.9),cd(7),0,'Salva do grupo por alvo; separado dos ataques básicos.');rows.at(-1).equipped=loadout.includes('archer');}
 if(groups.abom&&ranks.colossus){const g=groups.abom;row('abom-impact','Salto Devastador',Math.round(g.raw(e['Dano do Salto Devastador']||0)*2.2),cd(8),0,'Impacto por alvo; separado dos ataques básicos.');rows.at(-1).equipped=loadout.includes('abom');}
 for(const r of rows){const id={'zombie-burst':'zombie','archer-shot':'archer','abom-impact':'abom'}[r.id];if(!id)continue;r.cooldown*=mc(id);r.dps=r.damage/r.cooldown;r.sustained=id==='zombie'?r.damage/Math.max(r.cooldown,12/groups.zombie.count):r.dps;}
 if(learned('dash','dash'))row('dash','Dash',null,cd(3,pct('Recarga do Dash'))*mc('dash'),0,'Mobilidade, sem dano direto.');
 if(learned('shield','barreira'))row('barreira','Escudo de Carne',null,cd(12)*mc('barreira'),15,'Defesa; absorção depende do aliado sacrificado.');
 if(learned('curse','maldicao'))row('maldicao','Maldição',null,cd(8)*mc('maldicao'),25,'Reduz o dano inimigo em '+Math.min(75,(e['Redução de dano da Maldição']||0)+(mastery('maldicao').curse||0))+'%.');
 return {attributes:stat,skills:rows};
}
const api={VERSION,CAPACITY,MAX_WAVE,slots,rarities,attributes,pools,waveNumber,waveStats,progress,complete,price,sellPrice,generate,dropRoll,validate,migrate,items,bonuses,spellDamage,moveSpeed,effects,describe,snapshot};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EquipmentModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
