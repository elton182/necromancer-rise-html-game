// Gerado; a fórmula pertence a scripts/skill-trees.js.
import R from './horde-rules.mjs';
export function statsFor(type,level,effects={},gear={}){const MINION_DEFS=R.defs,COMBAT_TUNING=R.tuning,player={level};const skillEffects=()=>effects,skillGearStat=k=>gear[k]||0;function skillMinionStats(type){
 const def=MINION_DEFS[type],e=skillEffects(),flesh=type==='zombie'||type==='abom',bone=type==='skeleton'||type==='archer';
 let hp=flesh?(e['Vida de Zumbis e Abominações']||0):bone?(e['Vida de Esqueletos e Arqueiros']||0):(e['Vida dos Espectros']||0);
 let damage=flesh?(e['Dano de Zumbis e Abominações']||0):bone?(e['Dano de Esqueletos e Arqueiros']||0):(e['Dano dos Espectros']||0);
 if(type==='abom'){hp+=e['Vida da Abominação']||0;damage+=e['Dano da Abominação']||0;}
 if(type==='skeleton')hp+=e['Vida dos Guerreiros']||0;
 if(type==='archer')damage+=e['Dano dos Arqueiros']||0;
 if(type==='zombie'){hp+=e['Vida de Zumbis']||0;damage+=e['Dano de Zumbis']||0;}
 hp+=skillGearStat('hordeHp');damage+=skillGearStat('horde');
 const maxHp=Math.round((def.hp*COMBAT_TUNING.minionHpMultiplier+(player.level-1)*COMBAT_TUNING.minionHpPerLevel)*(1+hp/100));
 const baseDmg=def.dmg+player.level-1+skillGearStat('hordeFlat');
 return {hp:maxHp,dmg:Math.round(baseDmg*(1+damage/100)),baseDmg,damageBonus:damage,spd:def.spd,regen:maxHp*COMBAT_TUNING.minionRegen,rng:def.atkR};
};return skillMinionStats(type);}
export const capacity=function summonSlotCount(level=player.level,act1=!!CAMP.cleared[4]){
  return 3+Number(act1)+Number(level>=12)+Number(level>=15)+Number(level>=20);
};
