// Regras de progressão do personagem: sem DOM, armazenamento ou Three.js.
// As constantes vêm de progression-rules.mjs e os atributos, do modelo de equipamentos compartilhado.
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
 const army=w.army;
 return EQ.snapshot(Build,{level,skillRanks:army?.profile.ranks||{},actionLoadout:army?.loadout||[],skillMastery:army?.mastery||{},equipment},R.defs,R.tuning,equipment);
}
export const attributes=(w,level=levelOf(w))=>snapshotFor(w,w.equipment||{},level).attributes;
// Aplica os atributos derivados ao jogador. Trocar nível, árvore ou itens preserva a proporção de vida e mana
// e não cura; `fill` é reservado ao início de um encontro novo.
export function applyAttributes(w,{fill=false,level=levelOf(w)}={}){
 // Maldições de Valdoria (w.curses) multiplicam estes atributos; saem sozinhas quando o mundo é recriado.
 const a={...attributes(w,level)},p=w.player,m=w.curses;if(m){a.hp=Math.max(1,Math.round(a.hp*m.hp));a.regen*=m.mpRegen;a.hpRegen*=m.hpRegen;a.move*=m.move;}
 const hp=p.maxHp>0?p.hp/p.maxHp:1,mp=p.maxMp>0?p.mp/p.maxMp:1,changed=a.hp!==p.maxHp||a.mp!==p.maxMp;
 Object.assign(p,{maxHp:a.hp,maxMp:a.mp,spellDamage:a.spell,mpRegen:a.regen,hpRegen:a.hpRegen,moveSpeed:a.move,defense:a.defense,level});
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
