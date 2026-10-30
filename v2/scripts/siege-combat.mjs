import {CORE,LANES,TOWERS,guardianStats} from './siege-model.mjs';
import {dealDamage} from './combat.mjs';
import {moveCircle} from './terrain.mjs';
import {fx} from './vfx-events.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const living=a=>a.hp>0&&!a.dead;
// Rotas vencem a perseguição comum. Horda, guardiões e Zephyr podem segurar o avanço.
export function tickSiegeEnemy(w,e,dt){
 const r=w.adventure;if(r?.kind!=='siege'||r.done||!living(e)||e.team!=='enemy')return;
 e.atkTimer=Math.max(0,e.atkTimer-dt);
 const blocker=w.actors.filter(a=>(a.team==='ally'||a===w.player)&&living(a)&&distance(e,a)<1.35).sort((a,b)=>distance(e,a)-distance(e,b))[0];
 if(blocker){e.angle=Math.atan2(blocker.x-e.x,blocker.y-e.y);e.animation=e.atkTimer>.7?'attack':'idle';if(e.atkTimer<=0){e.animation='attack';e.animationTime=0;e.actionId++;e.atkTimer=1;dealDamage(w,blocker,e.dmg,e);fx(w,'impact',{x:blocker.x,y:blocker.y,color:'#ffab75',duration:.3});}return;}
 const path=LANES[e.siegeLane].points,goal=path[e.siegeNode],d=distance(e,goal),slow=e.slowTime>0?1-(e.slow||0):1;
 const step=Math.min(d,e.spd*slow*dt),dx=(goal.x-e.x)/(d||1)*step,dy=(goal.y-e.y)/(d||1)*step;
 const p=moveCircle(e,{x:dx,y:dy},e.radius,w.arena);e.x=p.x;e.y=p.y;e.walkDistance+=Math.hypot(dx,dy);e.angle=Math.atan2(dx,dy);e.animation='walk';
 if(d<=step+.05){if(e.siegeNode<path.length-1)e.siegeNode++;else{
  r.integrity=Math.max(0,r.integrity-(e.siegeBoss?8:e.lootTier==='rare'?3:1));e.hp=0;e.dead=true;e.rewarded=true;e.corpseTime=2;e.animation='death';
  fx(w,'impact',{x:CORE.x,y:CORE.y,color:'#ff5e43',size:2,duration:.6});
 }}
}
function guards(w,t,r){
 w.actors=w.actors.filter(a=>!a.siegeGuard||living(a));
 for(let i=0;i<2;i++){
  if(w.actors.some(a=>a.siegeGuard===t.id&&a.guardIndex===i&&living(a)))continue;
  const stats=guardianStats(t,r),q={id:w.nextId++,model:'skeleton',team:'ally',x:t.x+(i?1:-1)*.65,y:t.y+.8,radius:.35,hp:stats.maxHp,maxHp:stats.maxHp,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,siegeGuard:t.id,guardIndex:i,anchor:{x:t.x,y:t.y},power:stats.power,atkTimer:0};w.actors.push(q);fx(w,'summonRune',{x:q.x,y:q.y,radius:1,color:'#c29aff',duration:.7});
 }
}
export function tickSiegeCombat(w,dt){
 const r=w.adventure;if(r?.kind!=='siege'||r.done)return;
 const enemies=()=>w.actors.filter(a=>a.team==='enemy'&&a.siegeLane!==undefined&&living(a));
 for(const t of r.towers){
  if(t.animationTime>.6)t.animation='idle';const def=TOWERS[t.kind];t.cd=Math.max(0,t.cd-dt);if(t.cd>0)continue;
  const rune=r.rune===t.kind?1+.12*r.runeRank:1,scale=(1+.65*(t.rank-1))*(1+.18*(r.tier-1))*rune;
  if(t.kind==='crypt'){guards(w,t,r);t.cd=12/Math.sqrt(rune);continue;}
  const targets=enemies().filter(e=>distance(t,e)<=def.range+.5*(t.rank-1)).sort((a,b)=>distance(a,CORE)-distance(b,CORE));if(!targets.length)continue;
  t.cd=def.interval;t.animation='attack';t.animationTime=0;t.actionId++;
  const selected=t.kind==='bone'?targets.slice(0,1):targets;
  for(const e of selected){
   const resistant=LANES[e.siegeLane].resist===t.kind;
   if(t.kind==='frost'){e.slow=Math.max(e.slowTime>0?e.slow||0:0,Math.min(.7,(.45+.06*(t.rank-1))*rune)*(resistant?.5:1));e.slowTime=Math.max(e.slowTime||0,1.5);}
   dealDamage(w,e,def.damage*scale*(resistant?.5:1),{id:t.id,team:'ally'},def.name);
  }
  const p=selected[0];t.angle=Math.atan2(p.x-t.x,p.y-t.y);
  fx(w,t.kind==='bone'?'siegeBolt':'siegePulse',{x:t.x,y:t.y,tx:p.x,ty:p.y,color:def.color,radius:def.range+.5*(t.rank-1),duration:t.kind==='plague'?.6:.35});
 }
 for(const a of w.actors.filter(a=>a.siegeGuard&&living(a))){
  a.atkTimer=Math.max(0,a.atkTimer-dt);const target=enemies().filter(e=>distance(e,a.anchor)<5).sort((x,y)=>distance(x,a)-distance(y,a))[0],goal=target||a.anchor,d=distance(a,goal);
  if(target&&d<1.5){a.animation=a.atkTimer>.5?'attack':'idle';if(a.atkTimer<=0){dealDamage(w,target,a.power,a,'Guardiões da Cripta');a.atkTimer=1;a.animationTime=0;a.actionId++;}}
  else if(d>.2){const step=Math.min(d,2.5*dt),p=moveCircle(a,{x:(goal.x-a.x)/d*step,y:(goal.y-a.y)/d*step},a.radius,w.arena);a.x=p.x;a.y=p.y;a.walkDistance+=step;a.angle=Math.atan2(goal.x-a.x,goal.y-a.y);a.animation='walk';}else a.animation='idle';
 }
}
