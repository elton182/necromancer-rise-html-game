import {dealDamage} from './combat.mjs';
import {lineClear,navigate,resolvePosition} from './terrain.mjs';
import {blockEnemyByWalls} from './spells.mjs';
import {fx} from './vfx-events.mjs';

export function prepareCaveQueen(w,e){
 if(e.caveQueen)return;
 Object.assign(e,{caveQueen:true,isBoss:true,name:'Mãe-Tecelã',scale:2.6,tint:'#785179',radius:1.15,home:null,alert:true});
 e.type={...e.type,name:e.name};e.hp=e.maxHp=Math.round(e.maxHp*8);e.dmg=Math.round(e.dmg*1.45);e.spd*=1.35;
 Object.assign(e,resolvePosition(e,e.radius,w.arena));
}
// Ataques usam os clipes existentes do GLB da aranha; perigo e dano compartilham as mesmas áreas.
export function tickCaveQueen(w,e,dt,{targets,target,spawnEnemy,shoot}){
 const t=target(w,e);if(!t)return;
 const s=e.queen||(e.queen={action:null,step:0,cooldown:.9,broods:0}),furious=e.hp<=e.maxHp*.5;
 const warn=(a,p,r,extra={})=>w.effects.push({id:`queen-${e.id}-${p.x}-${p.y}`,enemyWarning:e.id,kind:'enemyWarning',fx:'dangerRune',x:p.x,y:p.y,radius:r,color:'#b3d66d',visual:true,ground:true,fixedRadius:true,time:0,duration:10,progress:Math.min(1,a.time/a.wind),...extra});
 e.abilityLabel=e.name;e.labelTime=.2;
 if(s.action){
  const a=s.action;a.time+=dt;e.angle=Math.atan2(a.dx,a.dy);
  e.animation=a.time<a.wind?'bite_windup':a.time<a.wind+.25?'bite':'recover';e.pose={anim:e.animation,progress:Math.min(1,a.time<a.wind?a.time/a.wind:(a.time-a.wind)/.6)};
  if(a.time<a.wind){
   if(a.kind==='venom')for(const p of a.points)warn(a,p,2.5);
   else if(a.kind==='web')for(const d of a.dirs)warn(a,e,.3,{kind:'enemyLine',fx:'dangerLine',dx:d.x,dy:d.y,length:14});
   else if(a.kind==='brood')warn(a,e,5,{harmless:true,noFill:true});
   else warn(a,e,5,{arc:Math.PI*1.3,direction:Math.atan2(a.dy,a.dx)});
  }else if(!a.hit){
   a.hit=true;
   if(a.kind==='venom'){
    for(const p of a.points)w.hostileZones.push({id:w.nextId++,source:e.id,bossOwned:true,gearWave:e.gearWave,...p,radius:2.5,life:5,span:5,tick:0,damage:Math.max(1,Math.round(e.dmg*.5)),color:'#a4ce60'});
   }else if(a.kind==='web'){
    for(const d of a.dirs){shoot(w,e,d.x,d.y,e.dmg*.45,11,14/11,'web');w.hostileShots.at(-1).bossOwned=true;}
   }else if(a.kind==='brood'){
    const count=s.broods===1?3:5;
    for(let i=0;i<count;i++){const angle=i*Math.PI*2/count,p=resolvePosition({x:e.x+Math.sin(angle)*4,y:e.y+Math.cos(angle)*4},.3,w.arena),child=spawnEnemy(w,8,p.x,p.y,{wave:e.gearWave});Object.assign(child,{worldGroup:e.worldGroup,queenOwner:e.id,rewarded:true,xp:0,alert:true});}
    w.notice='O ninho eclodiu! Elimine os filhotes e mantenha distância das poças.';
   }else{
    for(const victim of targets(w)){const dx=victim.x-e.x,dy=victim.y-e.y,d=Math.hypot(dx,dy);if(d<=5&&(d<.1||(dx*a.dx+dy*a.dy)/d>=Math.cos(Math.PI*.65))&&lineClear(e,victim,.05,w.arena))dealDamage(w,victim,e.dmg*1.8,e);}
    fx(w,'slash',{x:e.x,y:e.y,dx:a.dx,dy:a.dy,radius:5,arc:Math.PI*1.3,color:'#d0a2dc',duration:.4});
   }
  }
  if(a.time>=a.total){s.action=null;s.cooldown=furious?.35:.6;}
  return;
 }
 s.cooldown=Math.max(0,s.cooldown-dt);
 const dx=t.x-e.x,dy=t.y-e.y,d=Math.hypot(dx,dy)||1;
 const brood=s.broods<2&&e.hp/e.maxHp<=(s.broods===0?.66:.33);
 if(brood||s.cooldown<=0&&d<=16&&lineClear(e,t,.1,w.arena)){
  const step=s.step++%3,kind=brood?'brood':step===2?'web':d>6||step===1?'venom':'bite';
  if(brood)s.broods++;
  const a=s.action={kind,time:0,wind:kind==='brood'?1.4:kind==='bite'?.85:1.15,total:kind==='brood'?2.2:kind==='bite'?1.7:2,dx:dx/d,dy:dy/d,hit:false};
  if(kind==='venom'){
   const p=w.player,count=furious?5:3;
   a.points=Array.from({length:count},(_,i)=>resolvePosition(i?{x:p.x+Math.sin(i*Math.PI/2)*5,y:p.y+Math.cos(i*Math.PI/2)*5}:{x:p.x,y:p.y},.3,w.arena));
  }
  if(kind==='web')a.dirs=Array.from({length:furious?5:3},(_,i)=>{const angle=(i-(furious?2:1))*.25,c=Math.cos(angle),n=Math.sin(angle);return {x:a.dx*c-a.dy*n,y:a.dx*n+a.dy*c};});
  e.actionId++;return;
 }
 if(d>3.8){const before={x:e.x,y:e.y},p=navigate(e,t,e.spd*(furious?1.2:1),dt,w.arena);e.x=p.x;e.y=p.y;blockEnemyByWalls(w,e,before);e.walkDistance+=Math.hypot(e.x-before.x,e.y-before.y);e.angle=Math.atan2(dx,dy);e.animation='walk';}else e.animation='idle';
}
