import Model from './shared-mastery.mjs';
export {Model};
export function normalizeMastery(raw){return Model.migrate(raw);}
export function masteryBonus(w,id){return w.army?.loadout.includes(id)?Model.bonus(id,w.army.mastery?.[id]):{};}
export function masteryFactor(w,id,key){return 1+(masteryBonus(w,id)[key]||0)/100;}
export function masteryCooldown(w,id){return 1-(masteryBonus(w,id).cooldown||0)/100;}
