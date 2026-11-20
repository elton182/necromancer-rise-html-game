// Frasco reutilizável: carga em décimos de gole; cura transitória em segundos.
export const POTION={capacity:30,sip:10,heal:.5,duration:5,killCharge:1};
export const normalizePotion=value=>Number.isFinite(value)?Math.max(0,Math.min(POTION.capacity,Math.floor(value))):POTION.capacity;
export function initializePotion(w,character){w.potionCharge=normalizePotion(character?.potionCharge);w.potionHeal=null;}
export function canDrinkPotion(s){
 const w=s.world,p=w.player;
 return ['training','village'].includes(s.scene)&&!w.paused&&!w.adventure?.cinematic&&!w.adventure?.done&&p.hp>0&&p.hp<p.maxHp&&!w.potionHeal&&w.potionCharge>=POTION.sip;
}
export function drinkPotion(s){
 if(!canDrinkPotion(s))return false;
 const w=s.world;w.potionCharge-=POTION.sip;s.save.character.potionCharge=w.potionCharge;
 w.potionHeal={remaining:POTION.duration,rate:w.player.maxHp*POTION.heal/POTION.duration};
 return true;
}
export function rechargePotion(s){
 const w=s.world;if(w.player.hp<=0)return;
 w.potionCharge=Math.min(POTION.capacity,normalizePotion(w.potionCharge)+POTION.killCharge);
 s.save.character.potionCharge=w.potionCharge;
}
export function tickPotion(w,dt){
 const heal=w.potionHeal,p=w.player;if(!heal)return;
 if(p.hp<=0){w.potionHeal=null;return;}
 if(w.paused||!Number.isFinite(dt)||dt<=0)return;
 const elapsed=Math.min(dt,heal.remaining);
 p.hp=Math.min(p.maxHp,p.hp+heal.rate*elapsed);heal.remaining=Math.max(0,heal.remaining-elapsed);
 if(heal.remaining<1e-8)w.potionHeal=null;
}
