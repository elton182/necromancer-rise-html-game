import {dealDamage} from './combat.mjs';
import {lineClear,moveCircle} from './terrain.mjs';
export const COMBO_WINDOW=.45;
export const THRUST_TIMING={animation:11/30,advanceStart:6/30,impact:11/30,recovery:.12};
export const WARRIOR_ACTIONS=[
 {name:'Três cortes',cost:0,cooldown:.6,duration:.6,durations:[.6,16/30,.4],range:2.6,arc:Math.PI*.8,impacts:[11/30,8/30,8/30],multipliers:[.55,.65,.9],clips:['slash_1','slash_2','slash_3']},
 {name:'Estocada avançada',cost:20,cooldown:5,duration:THRUST_TIMING.animation+THRUST_TIMING.recovery,range:3.4,radius:.85,impacts:[THRUST_TIMING.impact],multipliers:[2.2],clips:['thrust']},
 {name:'Golpe de escudo',cost:15,cooldown:7,duration:.8,range:1.8,arc:Math.PI*.65,impacts:[.3],multipliers:[1.3],clips:['shield_bash']},
 {name:'Esquiva',cost:0,cooldown:3,duration:.5,clips:['idle']},
 {name:'Corte tornado',cost:5,cooldown:3,duration:Infinity,range:2.7,arc:Math.PI*2,impacts:[.15],multipliers:[.65],clips:['slash_2']},
 {name:'Arremesso de escudo',cost:20,cooldown:7,duration:.4,range:8,impacts:[.18],multipliers:[1.2],clips:['shield_bash']},
];
export function warriorAction(w,index=0,aim=w.aim){
 const a=WARRIOR_ACTIONS[index],p=w.player;
 if(index===3||index===4&&!w.warriorRanks?.tornado||index===5&&!w.warriorRanks?.shieldThrow||[2,5].includes(index)&&(!w.equipment?.shield||w.warriorShieldFlight))return false;
 if(!a||w.paused||p.hp<=0||p.dead||w.dash.remaining>0)return false;
 const dx=aim.x-p.x,dy=aim.y-p.y,d=Math.hypot(dx,dy);
 if(!Number.isFinite(d)||d<1e-9||index===1&&p.rootTime>0)return false;
 const active=w.warriorAction;
 // Um clique após o impacto reserva somente o próximo corte, sem interromper o atual.
 if(active){
  if(index!==0||active.index!==0||active.stage>=2||active.queued||active.time<a.impacts[active.stage])return false;
  active.queued={x:aim.x,y:aim.y};return true;
 }
 if(w.castCooldown>1e-9||p.mp<a.cost||(w.warriorCooldowns?.[index]||0)>w.time+1e-9)return false;
 const stage=index===0&&w.warriorCombo&&w.time<=w.warriorCombo.expires+1e-9?w.warriorCombo.next:0;
 const duration=index===0?a.durations[stage]:a.duration;
 w.warriorCombo=null;
 const bonus=index===1&&w.warriorMomentum?.until>=w.time?w.warriorMomentum.bonus:[2,5].includes(index)&&w.warriorRiposte?.until>=w.time?w.warriorRiposte.bonus:0;
 if(index===1)w.warriorMomentum=null;if([2,5].includes(index))w.warriorRiposte=null;
 p.mp-=a.cost;(w.warriorCooldowns??=[])[index]=w.time+(index===0?duration:a.cooldown*(1-(w.modifiers?.gearCooldown||0)/100));
 w.castCooldown=duration;p.angle=Math.atan2(dx,dy);p.animation=a.clips[index===0?stage:0];p.animationTime=0;p.actionId++;p.timer=duration;
 w.warriorAction={index,stage,duration,damageFactor:1+bonus,time:0,next:0,queued:null,origin:{x:p.x,y:p.y},dx:dx/d,dy:dy/d,travel:index===1?Math.min(5,Math.max(0,d-2.2)):0};
 return true;
}
export function tickWarrior(w,dt){
 if(w.paused)return;
 tickShieldFlight(w,dt);
 if(w.warriorCombo&&w.time>w.warriorCombo.expires)w.warriorCombo=null;
 const s=w.warriorAction;if(!s)return;
 const p=w.player,a=WARRIOR_ACTIONS[s.index];
 if(p.hp<=0||p.dead||w.dash.remaining>0){w.warriorAction=null;w.warriorCombo=null;p.timer=0;return;}
 const before=s.time;s.time+=dt;
 if(s.index===4){
  const available=Math.min(dt,p.mp/12);p.mp=Math.max(0,p.mp-dt*12);p.angle=Math.atan2(s.dx,s.dy)+s.time*Math.PI*2/.6;p.timer=.1;
  if(p.mp<=0||available<dt){stopWarriorChannel(w);return;}
  if(s.time+1e-9<.15+s.next*.3)return;
 }

 if(s.index===1){const elapsed=Math.max(0,Math.min(THRUST_TIMING.impact,s.time)-Math.max(THRUST_TIMING.advanceStart,before));if(elapsed){const pos=moveCircle(p,{x:s.dx*s.travel*elapsed/(THRUST_TIMING.impact-THRUST_TIMING.advanceStart),y:s.dy*s.travel*elapsed/(THRUST_TIMING.impact-THRUST_TIMING.advanceStart)},p.radius,w.arena,{slide:false});p.x=pos.x;p.y=pos.y;if(pos.blocked)s.travel=0;}}
 const strike=s.index===0?s.stage:0;
 if(s.index===5&&s.next<1&&s.time>=a.impacts[0]){s.next++;launchShield(w,s);}
 while(s.index!==5&&(s.index===4||s.next<1)&&s.time+1e-9>=(s.index===4?.15+s.next*.3:a.impacts[strike])){
  s.next++;const impact=strike;
  for(const e of w.actors){
   if(e.team!=='enemy'||e.hp<=0)continue;
   const x=e.x-p.x,y=e.y-p.y,n=Math.hypot(x,y);
   if(s.index===1){
    // Cápsula contínua: cobre o avanço e a ponta, inclusive alvos já ultrapassados.
    const origin=s.origin,length=Math.hypot(p.x-origin.x,p.y-origin.y)+a.range;
    const along=Math.max(0,Math.min(length,(e.x-origin.x)*s.dx+(e.y-origin.y)*s.dy));
    if(Math.hypot(e.x-origin.x-s.dx*along,e.y-origin.y-s.dy*along)>a.radius+e.radius||!lineClear(origin,e,.05,w.arena))continue;
   }else if(n>a.range+e.radius||n>0&&(x*s.dx+y*s.dy)/n<Math.cos(a.arc/2)||!lineClear(p,e,.05,w.arena))continue;
   const rank=w.warriorRanks||{},factor=s.index===0?1+(rank.slash||0)*.06:s.index===1?1+(rank.thrust||0)*.1:s.index===2?1+(rank.bash||0)*.1:1;
   const result=dealDamage(w,e,Math.max(1,Math.floor(p.damage*a.multipliers[impact]*factor*s.damageFactor)),p,a.name);
   if(s.index===0&&s.stage===2&&result.applied>0)w.warriorMomentum={until:w.time+4,bonus:(rank.momentum||0)*.1};
   if(s.index===2&&e.hp>0){const pos=moveCircle(e,{x:s.dx*.8,y:s.dy*.8},e.radius,w.arena,{slide:false});e.x=pos.x;e.y=pos.y;}
  }
  if(s.index===1)w.effects.push({id:w.nextId++,kind:'thrust',fx:'thrust',x:s.origin.x,y:s.origin.y,dx:s.dx,dy:s.dy,length:Math.hypot(p.x-s.origin.x,p.y-s.origin.y)+a.range,radius:a.radius,time:0,duration:.25,color:'#ffd9a0',visual:true});
  else w.effects.push({id:w.nextId++,kind:'slash',fx:'slash',x:p.x,y:p.y,dx:s.dx,dy:s.dy,radius:a.range,arc:a.arc,time:0,duration:.22,color:s.index===2?'#a8d4ec':'#ffd9a0',visual:true});
 }
 if(s.time+1e-9>=s.duration){
  const excess=Math.max(0,s.time-s.duration);w.warriorAction=null;p.timer=0;w.castCooldown=0;
  if(s.index===0&&s.stage<2){
   w.warriorCombo={next:s.stage+1,expires:w.time-excess+COMBO_WINDOW};
   if(s.queued){const now=w.time;w.time-=excess;(w.warriorCooldowns??=[])[0]=w.time;const started=warriorAction(w,0,s.queued);w.time=now;if(started&&excess>0)tickWarrior(w,excess);}
  }
 }

}
export function warriorPose(w){const s=w.warriorAction;if(!s)return w.warriorCombo&&w.time<=w.warriorCombo.expires?{anim:WARRIOR_ACTIONS[0].clips[w.warriorCombo.next-1],progress:1}:null;return {anim:WARRIOR_ACTIONS[s.index].clips[s.index===0?s.stage:0],progress:s.index===4?1:Math.min(1,s.time/(s.index===1?THRUST_TIMING.animation:s.duration))};}

export function stopWarriorChannel(w){if(w.warriorAction?.index!==4)return false;w.warriorAction=null;w.player.timer=0;w.castCooldown=0;(w.warriorCooldowns??=[])[4]=w.time+3*(1-(w.modifiers?.gearCooldown||0)/100);return true;}
function launchShield(w,s){
 const a={id:w.nextId++,model:'warriorShield',team:'neutral',warriorProjectile:true,dummy:true,x:w.player.x,y:w.player.y,radius:.22,hp:1,maxHp:1,angle:0,animation:'idle',animationTime:0,timer:0};w.actors.push(a);
 w.warriorShieldFlight={actor:a,time:0,returning:false,dx:s.dx,dy:s.dy,hits:new Set(),damage:Math.floor(w.player.damage*1.2*s.damageFactor)};
}
function tickShieldFlight(w,dt){
 const f=w.warriorShieldFlight;if(!f)return;const a=f.actor,p=w.player;
 if(p.hp<=0||!w.actors.includes(a)){w.actors=w.actors.filter(e=>e!==a);w.warriorShieldFlight=null;return;}
 f.time+=dt;const previous={x:a.x,y:a.y};
 let dx=f.dx,dy=f.dy;
 if(f.returning){const d=Math.hypot(p.x-a.x,p.y-a.y);if(d<.65||f.time>2){w.actors=w.actors.filter(e=>e!==a);w.warriorShieldFlight=null;return;}dx=(p.x-a.x)/d;dy=(p.y-a.y)/d;}
 const pos=moveCircle(a,{x:dx*14*dt,y:dy*14*dt},a.radius,w.arena,{slide:false});a.x=pos.x;a.y=pos.y;a.angle+=dt*15;
 const sx=a.x-previous.x,sy=a.y-previous.y,length=sx*sx+sy*sy;
 for(const e of w.actors){if(e.team!=='enemy'||e.hp<=0)continue;const key=e.id+':'+f.returning;if(f.hits.has(key))continue;
  const t=length?Math.max(0,Math.min(1,((e.x-previous.x)*sx+(e.y-previous.y)*sy)/length)):0;
  if(Math.hypot(e.x-previous.x-sx*t,e.y-previous.y-sy*t)>.5+e.radius||!lineClear(previous,e,.05,w.arena))continue;
  f.hits.add(key);dealDamage(w,e,f.damage,p,'Arremesso de escudo');
 }
 if(!f.returning&&(f.time>=.55||pos.blocked))f.returning=true;
}
