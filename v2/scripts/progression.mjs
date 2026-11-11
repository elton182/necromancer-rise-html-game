import {schoolSynergy} from './skill-synergy.mjs';
// Regras de progressão do personagem: sem DOM, armazenamento ou Three.js.
// As constantes vêm de progression-rules.mjs e os atributos, do modelo de equipamentos compartilhado.
import {warriorAttributes,warriorRanks,warriorTornado} from './warrior-model.mjs';
import {druidAttributes,druidRanks,WOLF,druidRankFactor,DRUID_ADVANCED,DRUID_SUMMONS} from './druid-model.mjs';
import {marksmanAttributes,marksmanActions,marksmanRanks,marksmanLearned,actionDamage,actionCooldown,mageAttributes,mageSkillDamage} from './marksman-model.mjs';
import {isMarksman} from './class-registry.mjs';
import WarriorGear from './warrior-equipment.mjs';
import P from './progression-rules.mjs';
import EQ from './shared-equipment.mjs';
import Build from './full-build.mjs';
import R from './horde-rules.mjs';
export const MAX_LEVEL=P.xp.maxLevel;
export const xpNext=level=>level>=MAX_LEVEL?0:Math.floor(P.xp.base*Math.pow(P.xp.growth,level-1));
// No nível máximo a experiência para de acumular; saves externos não podem guardar XP já suficiente para subir.
export const clampExp=(level,exp)=>level>=MAX_LEVEL?0:Math.min(exp,xpNext(level)-1);
export function addExp(progress,amount){
 let {level,exp}=progress,levels=0;
 if(!Number.isFinite(amount)||amount<=0||level>=MAX_LEVEL)return {level,exp:level>=MAX_LEVEL?0:exp,levels};
 exp+=amount;while(level<MAX_LEVEL&&exp>=xpNext(level)){exp-=xpNext(level);level++;levels++;}
 return {level,exp:level>=MAX_LEVEL?0:exp,levels};
}
export const goldFor=(xp,boss=false)=>Math.max(P.gold.min,Math.round(xp*P.gold.factor))*(boss?P.gold.boss:1);
export const points=(level,ranks={})=>Math.max(0,Build.budget(level)-Build.spent(ranks));
// Nível efetivo: com grupos reais ele pertence ao perfil do Grimório; no teste de carga, ao personagem.
export const levelOf=w=>w.army?w.army.profile.level:w.level||1;
// Estimativas e atributos saem do mesmo modelo usado pelo inventário atual; `equipment` permite prever uma troca.
export function snapshotFor(w,equipment=w.equipment||{},level=levelOf(w)){
 if(w.classId==='warrior'){
  const b=WarriorGear.bonuses({equipment}),r=warriorRanks(w.warriorRanks,level),mastery=1+r.equipmentMastery*.08;
  const raw={hp:120+18*(level-1)+(b.hp||0),mp:80+4*(level-1)+(b.mp||0),damage:(24+6*(level-1)+(b.damageFlat||0)*mastery)*(1+(b.damagePercent||0)/100),defense:(b.defense||0)*mastery,blockChance:equipment.shield?12+(b.blockChance||0):0,hpRegen:b.hpRegen||0,regen:5+(b.regen||0),move:(6+(b.moveFlat||0))*(1+Math.min(30,b.move||0)/100),cooldown:Math.min(50,b.cooldown||0)};
  const a=warriorAttributes(raw,r);if(!equipment.shield)a.blockChance=0;a.defenseMitigation=WarriorGear.defenseReduction(a.defense,level)*100;
  const spin=warriorTornado(null,r),spatial=r.corteEspacial>0;
  return {attributes:a,skills:[['slash','Três cortes',2.1,0],['thrust','Estocada',2.2,20],['bash','Golpe de escudo',1.3,15],['tornado',spin.name,.65*spin.damage,5],['shieldThrow','Arremesso de escudo',1.2*(1+.1*Math.max(0,r.shieldThrow-1)+schoolSynergy('warrior',r,'shieldThrow')),20],['steelWave',spatial?'Corte Espacial':'Onda de Aço',spatial?2.3*(1+.1*Math.max(0,r.corteEspacial-1)+schoolSynergy('warrior',r,'corteEspacial')):1.8*(1+.1*Math.max(0,r.steelWave-1)+schoolSynergy('warrior',r,'steelWave')),0]].map(([id,name,mult,mana])=>({id,name,damage:id==='slash'?[.55,.65,.9].reduce((sum,m)=>sum+Math.floor(a.damage*m*(1+r.slash*.06+schoolSynergy('warrior',r,'slash'))),0):spatial&&id==='steelWave'?Math.round(a.damage*mult):Math.floor(a.damage*mult*(1+(r[id]||0)*(id==='thrust'||id==='bash'?.1:0)+(['thrust','bash'].includes(id)?schoolSynergy('warrior',r,id):0))),cooldown:(spatial&&id==='steelWave'?0:({slash:0,thrust:5,bash:7,tornado:3,shieldThrow:7,steelWave:8}[id]))*(1-a.cooldown/100),mana,equipped:!['tornado','shieldThrow','steelWave'].includes(id)||r[id]>0,dps:null,sustained:null}))};
 }
 // Mago: base mágica do mesmo modelo de itens (como a Druida), sem horda nem Grimório; a árvore ajusta o resultado.
 if(w.classId==='mage'){
  const r=marksmanRanks('mage',w.marksmanRanks,level),base=EQ.snapshot(Build,{level,skillRanks:{},actionLoadout:[],skillMastery:{},equipment},R.defs,R.tuning,equipment).attributes,a=mageAttributes(base,r);
  const skills=marksmanActions('mage').map((d,i)=>d.kind==='dodge'?null:{id:d.id,name:d.name,...mageSkillDamage(d,a.spell,r),cooldown:actionCooldown(d,r,a.cooldown),mana:d.cost,equipped:marksmanLearned('mage',i,r),dps:null,sustained:null}).filter(Boolean);
  return {attributes:a,skills};
 }
 // Arqueira e Mercenário: base marcial própria, só armadura, elmo, botas e anéis, e a árvore da classe.
 if(isMarksman(w.classId)){
  const r=marksmanRanks(w.classId,w.marksmanRanks,level),a=marksmanAttributes(w.classId,level,equipment,r);
  const skills=marksmanActions(w.classId).map((d,i)=>d.kind==='dodge'||d.passive?null:{id:d.id,name:d.name,damage:actionDamage(d,a.damage,r),cooldown:actionCooldown(d,r,a.cooldown),mana:d.cost,equipped:marksmanLearned(w.classId,i,r),dps:null,sustained:null}).filter(Boolean);
  return {attributes:a,skills};
 }
 // Druida: base mágica do mesmo modelo de itens, sem horda nem Grimório; a árvore própria ajusta o resultado.
 if(w.classId==='druid'){
  const base=EQ.snapshot(Build,{level,skillRanks:{},actionLoadout:[],skillMastery:{},equipment},R.defs,R.tuning,equipment).attributes,r=druidRanks(w.druidRanks,level),a=druidAttributes(base,r);
  const skill=(id,name,mult,mana,cooldown,learned=true,wolf=false)=>{
   const own=id==='spark'?1+r.spark*.06:id==='roots'?1+r.roots*.1:['storm','leap'].includes(id)?druidRankFactor(r,id):1;
   const factor=own+schoolSynergy('druid',r,id==='claws'?'wolf':id);
   return {id,name,damage:Math.floor(a.spell*mult*factor*(wolf?1+r.wolf*WOLF.damagePerRank:1)),cooldown:['spark','claws'].includes(id)?cooldown:cooldown*(1-a.cooldown/100),mana,equipped:learned,dps:null,sustained:null};
  };
  const advanced=[
   {...skill('calamidade','Calamidade',DRUID_ADVANCED.calamity.multiplier,55,24,r.calamidade>0),note:'por pulso de vento; raios de '+Math.floor(a.spell*DRUID_ADVANCED.calamity.boltMultiplier*(1+schoolSynergy('druid',r,'calamidade')))+' a até duas presas por segundo'},
   {...skill('florestaTropical','Floresta Tropical',0,45,20,r.florestaTropical>0),damage:Math.floor(a.spell*DRUID_SUMMONS.plantDamage*(druidRankFactor(r,'plantaCarnivora')+schoolSynergy('druid',r,'plantaCarnivora'))),note:'por ataque de cada uma das cinco plantas, por 10 s'},
   {...skill('escudoDeFolhas','Escudo de Folhas',0,25,18,r.escudoDeFolhas>0),damage:null,note:'absorve até '+Math.round(a.hp*DRUID_ADVANCED.leaves.share)+' de dano por 8 s'},
   {...skill('liderDaMatilha','Líder da Matilha',0,20,12,r.liderDaMatilha>0),damage:null,note:'líder com +30% de dano; comando de caçada por 6 s'},
  ];
  return {attributes:a,skills:[skill('spark','Faísca',.45,0,.55),skill('chain','Corrente de Raios',1.2,22,6,r.chain>0),skill('roots','Raízes',.8,18,7,r.roots>0),skill('storm','Tempestade',.6,35,14,r.storm>0),skill('claws','Garras',.75,0,.42,r.wolf>0,true),skill('leap','Salto Feroz',1.5,15,6,r.leap>0,true),...advanced]};
 }
 const army=w.army;
 const result=EQ.snapshot(Build,{level,skillRanks:army?.profile.ranks||{},actionLoadout:army?.loadout||[],skillMastery:army?.mastery||{},equipment},R.defs,R.tuning,equipment);return result;
}
export const attributes=(w,level=levelOf(w))=>snapshotFor(w,w.equipment||{},level).attributes;
// Aplica os atributos derivados ao jogador. Trocar nível, árvore ou itens preserva a proporção de vida e mana
// e não cura; `fill` é reservado ao início de um encontro novo.
export function applyAttributes(w,{fill=false,level=levelOf(w)}={}){
 // Maldições de Valdoria (w.curses) multiplicam estes atributos; saem sozinhas quando o mundo é recriado.
 const a={...attributes(w,level)},p=w.player,m=w.curses;if(m){a.hp=Math.max(1,Math.round(a.hp*m.hp));a.regen*=m.mpRegen;a.hpRegen*=m.hpRegen;a.move*=m.move;}
 const hp=p.maxHp>0?p.hp/p.maxHp:1,mp=p.maxMp>0?p.mp/p.maxMp:1,changed=a.hp!==p.maxHp||a.mp!==p.maxMp;
 Object.assign(p,{maxHp:a.hp,maxMp:a.mp,spellDamage:a.spell??0,damage:a.damage??0,blockChance:a.blockChance??0,mpRegen:a.regen,hpRegen:a.hpRegen,moveSpeed:a.move,defense:a.defense,level});
 if(fill){p.hp=a.hp;p.mp=a.mp;}else if(changed){p.hp=p.hp<=0?0:Math.max(1,Math.floor(a.hp*hp+1e-8));p.mp=Math.max(0,Math.floor(a.mp*mp+1e-8));}
 w.modifiers={...w.modifiers,gearCooldown:a.cooldown};
 return a;
}
// Cada nível ganho soma a cura fixa sobre a vida e a mana de antes, sem passar do máximo do novo nível.
export function levelUp(w,levels){
 for(let i=0;i<levels;i++){
  const hp=w.player.hp,mp=w.player.mp,level=levelOf(w)+1;
  if(w.army)w.army.profile.level=level;else w.level=level;
  applyAttributes(w,{level});if(hp>0)w.player.hp=Math.min(w.player.maxHp,hp+P.levelUp.hp);w.player.mp=Math.min(w.player.maxMp,mp+P.levelUp.mp);
 }
}
export {P as RULES};
