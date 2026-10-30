import Base from './shared-mastery.mjs';
import {LICH_SKILLS,LICH_LABELS,LICH_ABILITIES} from './lich-mastery.mjs';
// Modelo compartilhado de maestrias + as habilidades da Morte (a Forma da Morte ativa as cinco habilidades da foice).
export const Model=Base.extend(LICH_SKILLS,LICH_LABELS);
export function normalizeMastery(raw){return Model.migrate(raw);}
const active=(w,id)=>!!w.army&&(w.army.loadout.includes(id)||LICH_ABILITIES.includes(id)&&w.army.loadout.includes('lich'));
export function masteryBonus(w,id){return active(w,id)?Model.bonus(id,w.army.mastery?.[id]):{};}
export function masteryFactor(w,id,key){return 1+(masteryBonus(w,id)[key]||0)/100;}
export function masteryCooldown(w,id){return 1-(masteryBonus(w,id).cooldown||0)/100;}
