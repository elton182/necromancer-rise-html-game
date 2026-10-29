import RULES from './combat-rules.mjs';
import {defenseReduction,spellDamage,moveSpeed} from './shared-equipment.mjs';
import {moveCircle,resolvePosition} from './terrain.mjs';
import {MAX_LEVEL,levelOf} from './progression.mjs';
export {RULES};
// O custo do Tiro de Osso cresce de 5 MP no nível 1 até o valor das regras (RULES.bolt.cost) no nível máximo.
export const BOLT_COST_MIN=5;
export const boltCost=w=>{const level=Math.min(MAX_LEVEL,Math.max(1,levelOf(w)));return Math.round(BOLT_COST_MIN+(RULES.bolt.cost-BOLT_COST_MIN)*(level-1)/(MAX_LEVEL-1));};
export function initializeCombat(w){
 w.projectiles=[];w.combatEvents=[];w.dash={remaining:0,cooldown:0,dx:0,dy:0};w.modifiers={};
 Object.assign(w.player,{mp:RULES.base.mp,maxMp:RULES.base.mp,mpRegen:RULES.base.regen,hpRegen:0,spellDamage:spellDamage(1),moveSpeed:moveSpeed(),defense:0,barrier:0,boneShield:false,veilTime:0,level:1});
}
function kill(w,a,source){
 if(a.dead)return;a.dead=true;a.hp=0;a.animation='death';a.animationTime=0;a.pose=null;a.timer=0;a.ability=null;a.jumpZ=0;w.effects=w.effects.filter(f=>f.enemyWarning!==a.id);
 if(a===w.boss){a.king=null;a.jumpZ=0;w.effects=w.effects.filter(f=>f.kingWarning!==a.id);for(const add of w.actors)if(add.kingOwner===a.id&&add.hp>0){add.hp=0;add.dead=true;add.animation='death';add.animationTime=0;add.kingOwner=null;}}
 w.combatEvents.push({kind:'death',id:w.nextId++,target:a.id,team:a.team,source:source?.id??null});
 if(a.groupType)w.onAllyDeath?.(a);
 if(a.team==='enemy')w.onEnemyDeath?.(a,source);
 if(a===w.player){w.onPlayerDeath?.();w.projectiles=[];w.effects=[];w.dash.remaining=0;}
}
// Osso Carcomido (cajado especial): o Tiro de Osso aplica Podridão, até 5 cargas por 5 s; 12% do dano bruto do projétil por carga, a cada segundo.
export const ROT={stacks:5,ttl:5,share:.12,tick:1};
export const hasRot=w=>Object.values(w.equipment||{}).some(i=>i?.special==='carcomido');
export function addRot(e,damage){const r=e.rot||{stacks:0,tick:ROT.tick,power:0};r.stacks=Math.min(ROT.stacks,r.stacks+1);r.ttl=ROT.ttl;r.power=Math.max(r.power,damage*ROT.share);e.rot=r;}
export function tickRot(w,dt){
 for(const e of w.actors){const r=e.rot;if(!r)continue;if(e.hp<=0){delete e.rot;continue;}
  const elapsed=Math.min(dt,Math.max(0,r.ttl));r.ttl-=dt;r.tick-=elapsed;
  while(r.tick<=1e-8&&e.hp>0){r.tick+=ROT.tick;dealDamage(w,e,Math.max(1,Math.round(r.power*r.stacks)),w.player);}
  if(r.ttl<=0)delete e.rot;}
}
export function dealDamage(w,target,amount,source=null){
 const result={applied:0,absorbed:0,killed:false,blocked:false};
 if(!target||target.hp<=0||target.dead||!Number.isFinite(amount)||amount<=0)return result;
 let damage=amount*(source?.curse?1-source.curse.reduction:1);
 if(target===w.player){
  if(w.dash.remaining>1e-9){result.blocked=true;return result;}
  if(target.veilTime>0)damage*=.75;
  damage*=1-defenseReduction(target.defense,source?.gearWave??source?.level??1);
  if(target.barrier>0){result.absorbed=Math.min(target.barrier,damage);target.barrier-=result.absorbed;damage-=result.absorbed;}
  if(damage<=0)return result;
  if(target.boneShield){target.boneShield=false;result.blocked=true;return result;}
 }else if(target.team==='ally'&&['skeleton','zombie','abom'].includes(target.model))damage=Math.max(1,Math.round(damage*RULES.frontlineDamageTaken));
 else if(target.team==='enemy')damage=Math.floor(damage*(w.curses?.damage??1));
 result.applied=Math.min(target.hp,damage);target.hp=Math.max(0,target.hp-damage);
 if(target.hp<=0){kill(w,target,source);result.killed=true;}return result;
}
export function castBolt(w){
 const p=w.player,m=w.modifiers;
 if(w.paused||p.hp<=0||w.castCooldown>1e-9||p.mp<boltCost(w)||!Number.isFinite(w.aim.x)||!Number.isFinite(w.aim.y))return false;
 const dx=w.aim.x-p.x,dy=w.aim.y-p.y,d=Math.hypot(dx,dy);if(d<1e-9)return false;
 const gear=1-Math.min(50,Math.max(0,m.gearCooldown||0))/100;
 w.castCooldown=Math.max(RULES.bolt.cooldown*.5,RULES.bolt.cooldown*gear)*(1-(m.boltMasteryCooldown||0)/100);p.mp-=boltCost(w);
 p.animation='cast';p.animationTime=0;p.actionId++;p.timer=.375;p.angle=Math.atan2(dx,dy);
 const count=m.shards?3:1,hitIds=[],angle=Math.atan2(dy,dx);
 for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*RULES.bolt.spread;w.projectiles.push({id:w.nextId++,source:p.id,x:p.x,y:p.y,dx:Math.cos(a),dy:Math.sin(a),range:RULES.bolt.range,remaining:RULES.bolt.range,damage:Math.floor(p.spellDamage*RULES.bolt.multiplier*(1+(m.boltDamagePercent||0)/100)),maxPierce:1+Math.max(0,Math.floor(m.extraPierce||0)),pierced:0,hitIds,shard:count>1});}
 w.effects.push({id:w.nextId++,kind:'boneLaunch',x:p.x,y:p.y,radius:.3,time:0,duration:.14,visual:true});return true;
}
export function beginDash(w,input={}){
 if(w.paused||w.player.hp<=0||w.dash.cooldown>1e-9||w.dash.remaining>0)return false;
 let x=Number(input.x)||0,y=Number(input.y)||0,dx=x+y,dy=y-x;
 if(Math.hypot(dx,dy)<.1){dx=w.aim.x-w.player.x;dy=w.aim.y-w.player.y;}
 const length=Math.hypot(dx,dy);if(!Number.isFinite(length)||length<1e-9){dx=Math.sin(w.player.angle)||1;dy=Math.cos(w.player.angle);}
 const n=Math.hypot(dx,dy),m=w.modifiers;
 Object.assign(w.dash,{remaining:RULES.dash.duration,cooldown:Math.max(1.5,RULES.dash.cooldown*(1+Math.max(-50,m.dashCooldownPercent||0)/100)*(1-Math.min(50,Math.max(0,m.gearCooldown||0))/100))*(1-(m.dashMasteryCooldown||0)/100),dx:dx/n,dy:dy/n,origin:{x:w.player.x,y:w.player.y}});
 return true;
}
export function moveDash(w,dt){
 const dash=w.dash;if(dash.remaining<=0)return false;
 const t=Math.min(dt,dash.remaining),travel=RULES.dash.distance*(1+(w.modifiers.dashDistancePercent||0)/100)*t/RULES.dash.duration;
 const pos=moveCircle(w.player,{x:dash.dx*travel,y:dash.dy*travel},RULES.dash.radius,w.arena,{slide:false});w.player.x=pos.x;w.player.y=pos.y;w.player.angle=Math.atan2(dash.dx,dash.dy);
 dash.remaining=Math.max(0,dash.remaining-t);if(pos.blocked)dash.remaining=0;
 if(dash.remaining<=1e-9){dash.remaining=0;const p=resolvePosition(w.player,w.player.radius,w.arena);w.player.x=p.x;w.player.y=p.y;if(w.modifiers.veilDuration)w.player.veilTime=w.modifiers.veilDuration;}
 return true;
}
export function updateProjectiles(w,dt){
 for(let i=w.projectiles.length-1;i>=0;i--){
  const b=w.projectiles[i],travel=Math.min(b.remaining,RULES.bolt.speed*dt),dx=b.dx*travel,dy=b.dy*travel,len=dx*dx+dy*dy;
  const hits=w.actors.filter(a=>a.team==='enemy'&&a.hp>0&&!b.hitIds.includes(a.id)).map(a=>{const t=len?Math.max(0,Math.min(1,((a.x-b.x)*dx+(a.y-b.y)*dy)/len)):0;return {a,t,d:Math.hypot(a.x-b.x-dx*t,a.y-b.y-dy*t)};}).filter(h=>h.d<RULES.bolt.hitRadius).sort((a,b)=>a.t-b.t);
  for(const {a}of hits){if(b.pierced>=b.maxPierce)break;if(a.hp<=0||b.hitIds.includes(a.id))continue;b.hitIds.push(a.id);b.pierced++;const result=dealDamage(w,a,b.damage,w.player);if(result.applied>0)w.hits++;if(hasRot(w))addRot(a,b.damage);w.effects.push({id:w.nextId++,kind:'boneImpact',x:a.x,y:a.y,radius:.35,time:0,duration:.22,visual:true});}
  b.x+=dx;b.y+=dy;b.remaining-=travel;
  if(b.remaining<=1e-9||b.pierced>=b.maxPierce)w.projectiles.splice(i,1);
 }
}
