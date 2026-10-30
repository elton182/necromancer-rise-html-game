// Caminho único de recompensa: cada morte de inimigo paga XP, maestria, ouro e drops uma vez.
import Expedition from './shared-expedition.mjs';
import P from './progression-rules.mjs';
import {addExp,goldFor,levelUp,levelOf,xpNext} from './progression.mjs';
import {gainMastery,syncSkills} from './grimoire.mjs';
import {recalculateHorde} from './horde.mjs';
import {spawnDrop,announce,lootAllowed} from './drops.mjs';
import EQ from './shared-equipment.mjs';
import Build from './shared-build.mjs';
import {newItemId,gearName,CAPACITY} from './gear.mjs';
export {levelOf,xpNext};
const validXp=xp=>Number.isFinite(xp)&&xp>0;
function raise(s,progress){
 const w=s.world,c=s.save.character,levels=progress.level-levelOf(w);
 c.exp=progress.exp;c.level=progress.level;
 if(!levels)return '';
 levelUp(w,levels);syncSkills(w);if(w.armyMode==='groups')recalculateHorde(w);
 return 'Nível '+progress.level+' · +'+levels*P.levelUp.hp+' vida e +'+levels*P.levelUp.mp+' mana';
}
export function grantExperience(s,amount){return raise(s,addExp({level:levelOf(s.world),exp:s.save.character.exp},amount));}
// Recompensa de abate. O XP de maestria é creditado antes do nível, como no jogo atual.
export function rewardKill(s,enemy){
 const xp=enemy?.xp,w=s.world;
 // Inimigo infectado de Valdoria deixa uma poça com 1,5 s de aviso.
 if(enemy?.infected&&!enemy.rewarded&&w.infectedPool)w.hostileZones.push({id:w.nextId++,source:null,gearWave:enemy.gearWave,x:enemy.x,y:enemy.y,radius:2.3,delay:1.5,life:3,tick:0,damage:Math.max(1,Math.round(enemy.dmg*.4))});
 if(!validXp(xp)||enemy.rewarded)return false;
 enemy.rewarded=true;
 if(enemy.siegeLane!==undefined&&w.adventure?.kind==='siege'&&!w.adventure.done)w.adventure.essence+=enemy.siegeBoss?80:12;
 const run=w.adventure?.conquest,characterXp=Math.round(xp*(enemy.expedition?(run?.xpMultiplier??1):1));
 const mastery=gainMastery(s,xp),c=s.save.character,level=raise(s,addExp({level:levelOf(w),exp:c.exp},characterXp));
 const notes=[level,mastery?.raised?.length?'Maestria ↑ '+mastery.raised.join(' · '):''].filter(Boolean);
 if(notes.length)w.notice=notes.join(' · ');
 if(level)announce(w,level,'#f0d98a');
 if(Number.isFinite(enemy.x)&&Number.isFinite(enemy.y)){
  const gold=goldFor(xp,enemy===w.boss);
  spawnDrop(w,'gold',enemy.x,enemy.y,{amount:gold});
  // Um sorteio decide se o orbe existe e outro, o tipo, como no jogo atual.
  if(w.random()<P.orbs.chance){
   const hp=w.random()<P.orbs.hpShare;
   spawnDrop(w,hp?'hp':'mp',enemy.x+(w.random()-.5)*P.orbs.spread,enemy.y+(w.random()-.5)*P.orbs.spread);
  }
  // Chefes sempre deixam uma peça; a recuperação de nível favorece quem está atrasado em relação ao drop.
  const boss=enemy===w.boss;
  if(boss||w.random()<(Expedition.tiers[enemy.lootTier]?.chance??P.gear.chance)){const roll=EQ.dropRoll(w.equipment,w.gearLevel,w.random),region=w.lootConfig?.(enemy,roll),item=EQ.generate(region?.level??roll.level,Build,w.random,region?.type??roll.type,boss,newItemId(s),{loot:{weights:region?.weights??(enemy.expeditionBoss?{common:0,magic:0,rare:75,epic:25}:Expedition.lootWeights(enemy.lootTier)),unboundedLevel:!!region},extraAffixes:['lifesteal']});if(region?.special)item.special='carcomido';spawnDrop(w,'equipment',enemy.x,enemy.y,{item,upgrade:roll.upgrade});}
 }
 return mastery;
}
// Coleta por proximidade: ouro vai ao personagem; orbes restauram uma fração do máximo.
export function collect(s,drop){
 const w=s.world,p=w.player,c=s.save.character;
 if(drop.kind==='gold'){c.gold+=drop.amount;announce(w,'+'+drop.amount+' ouro','#e2c46d');return true;}
 if(drop.kind==='hp'){const heal=Math.floor(p.maxHp*P.orbs.hpRestore);p.hp=Math.min(p.maxHp,p.hp+heal);announce(w,'+'+heal+' vida','#ff7a6a');return true;}
 if(drop.kind==='mp'){const restore=Math.floor(p.maxMp*P.orbs.mpRestore);p.mp=Math.min(p.maxMp,p.mp+restore);announce(w,'+'+restore+' mana','#78a2ff');return true;}
 if(drop.kind==='equipment'){
  if(!lootAllowed(drop,w.lootFilter))return false;
  if(c.gearBag.length>=CAPACITY){if(w.time>=(w.bagNoticeAt||0)){announce(w,'Mochila cheia · I para equipamentos','#e8c777');w.bagNoticeAt=w.time+3;}return false;}
  c.gearBag.push(drop.item);announce(w,'+'+gearName(drop.item)+' · nv. '+drop.item.level,EQ.rarities[drop.item.rarity].color);return true;
 }
 return false;
}
