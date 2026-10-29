import BaseTypes from './enemy-types.mjs';
import R from './enemy-rules.mjs';
import Hound from './shared-crypt-hound.mjs';
import Acolyte from './shared-war-acolyte.mjs';
import Expedition from './shared-expedition.mjs';
import EQ from './shared-equipment.mjs';
import {dealDamage} from './combat.mjs';
import {navigate,resolvePosition,moveCircle,lineClear} from './terrain.mjs';
import {blockEnemyByWalls,firstWallHit,absorbWallProjectile} from './spells.mjs';
// Extensão exclusiva da v2: índices legados permanecem intactos.
const Types=[...BaseTypes,...[['hoodedThief','Ladrão'],['griffinHumanoid','Humanoide Grifo'],['spider','Aranha']].map(([id,name])=>({...BaseTypes[0],id,name}))];
export {Types,R,Hound,Acolyte,Expedition};
export const models=['warrior','enemyArcher','brute','livingMage','cryptHound','warAcolyte','enemyThief','enemyGriffin','enemySpider'];
// Voo baixo: a projeção no chão mantém as colisões e a vulnerabilidade comuns.
export function flightHeight(actor,time){if(actor.model!=='enemyGriffin')return 0;if(actor.hp<=0)return .85*Math.max(0,1-(actor.animationTime||0)/.8);return .85+.09*Math.sin(time*Math.PI*2);}
// Corpos de inimigos somem sozinhos; no último segundo afundam no chão antes de sair da cena.
export const CORPSE_LIFETIME=2,CORPSE_SINK_TIME=1;
export const corpseSink=a=>a.hp>0||!a.corpseTime?0:Math.min(1,Math.max(0,(a.corpseTime-(CORPSE_LIFETIME-CORPSE_SINK_TIME))/CORPSE_SINK_TIME))*.9;
const alive=a=>a&&a.hp>0&&!a.dead;
export function targets(w){return w.actors.filter(a=>(a===w.player||a.team==='ally')&&alive(a));}
export function target(w,e){const allies=targets(w).filter(a=>a.team==='ally').sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y));return allies[0]&&Math.hypot(allies[0].x-e.x,allies[0].y-e.y)<5?allies[0]:alive(w.player)?w.player:null;}
export function spawnEnemy(w,index,x,y,{wave=1,tier='common',owner=null}={}){
 const type=Types[index];if(!type||!Expedition.tiers[tier])throw Error('Tipo ou raridade de inimigo inválido.');
 const scale=EQ.waveStats(wave),elite=Expedition.tiers[tier],hp=Math.round(type.hp*scale.hp*elite.hp),radius=.3*type.sc,pos=resolvePosition({x,y},radius,w.arena);
 const e={id:w.nextId++,type,typeIndex:index,model:models[index],team:'enemy',...pos,radius,hp,maxHp:hp,dmg:Math.round(type.dmg*scale.damage*elite.damage),spd:type.spd*R.tuning.enemySpeed*elite.speed,xp:Math.round(type.xp*scale.xp*elite.xp),gearWave:wave,lootTier:tier,kingOwner:owner,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,atkTimer:0,abilityCd:R.tuning.specialDelayMin+w.random()*(R.tuning.specialDelayMax-R.tuning.specialDelayMin),phase:0};if(index===4)e.abilityCd=R.basic.hound.initial;if(index===5)e.abilityCd=Acolyte.skill.initial;w.actors.push(e);return e;
}
export function composition(wave,count=8,random=Math.random){const list=Acolyte.arenaTypes(wave,Hound.arenaTypes(wave,count,BaseTypes,random),BaseTypes).map(t=>BaseTypes.indexOf(t));for(const [minimum,type]of [[9,6],[11,7],[13,8]])if(wave>=minimum){const slot=list.findIndex(i=>i<4);if(slot>=0)list[slot]=type;}return list;}
function power(w,e,n){return Acolyte.damage(n,e,w.actors.filter(a=>a.team==='enemy'));}
function hurt(w,e,t,n){return dealDamage(w,t,power(w,e,n),e);}
function area(w,e,x,y,r,n,mult=1){for(const t of targets(w))if(Math.hypot(t.x-x,t.y-y)<=r)dealDamage(w,t,Math.round(power(w,e,n)*mult),e);}
function mark(w,e,key,x,y,r,color,extra={}){w.effects.push({id:`enemy-${e.id}-${key}`,enemyWarning:e.id,x,y,radius:r,color,kind:'enemyWarning',harmless:e.typeIndex===5,visual:true,ground:true,fixedRadius:true,time:0,duration:10,...extra});}
export function shoot(w,e,dx,dy,damage,speed,life,kind='arrow',mult=1){w.hostileShots.push({id:w.nextId++,source:e.id,x:e.x,y:e.y,dx,dy,speed,damage:Math.round(power(w,e,damage)*mult),remaining:speed*life,kind});}
function move(w,e,t,speed,dt){const before={x:e.x,y:e.y},q=navigate(e,t,speed*((e.slowTime||0)>0?1-(e.slow||0):1),dt,w.arena);e.x=q.x;e.y=q.y;blockEnemyByWalls(w,e,before);const d=Math.hypot(e.x-before.x,e.y-before.y);e.walkDistance+=d;e.animation=d>1e-5?'walk':'idle';if(d>1e-5)e.angle=Math.atan2(e.x-before.x,e.y-before.y);}
// Expedição: inimigos parados em `home` até detectar o jogador (11 u) ou um aliado (7 u), sofrer dano ou ser alertados.
// Perdem o alerta além de 30 u sem ninguém por perto. Devolve true quando o inimigo deve agir.
export function tickSleep(w,e,dt){
 const p=w.player,close=Math.hypot(e.x-p.x,e.y-p.y)<11||w.actors.some(a=>a.team==='ally'&&alive(a)&&Math.hypot(e.x-a.x,e.y-a.y)<7);
 if(close||e.hp<(e.lastHp??e.maxHp))e.alert=true;
 e.lastHp=e.hp;
 if(e.alert&&Math.hypot(e.x-p.x,e.y-p.y)>30&&!close){e.alert=false;e.ability=null;e.strike=null;e.king=null;e.pose=null;}
 if(e.lootTier&&e.lootTier!=='common'){e.abilityLabel=e.isBoss?'Rei Caído':e.type.name+' · '+Expedition.tiers[e.lootTier].name;e.labelTime=.2;}
 if(e.alert)return true;
 if(Math.hypot(e.x-e.home.x,e.y-e.home.y)>.3)move(w,e,e.home,e.spd||1,dt);else e.animation='idle';
 return false;
}
export function tickEnemy(w,e,dt){
 w.effects=w.effects.filter(f=>f.enemyWarning!==e.id);const t=target(w,e);if(!t)return;e.abilityLabel=e.type.name+(e.lootTier==='common'?'':' · '+Expedition.tiers[e.lootTier].name);e.labelTime=.2;
 const dx=t.x-e.x,dy=t.y-e.y,d=Math.hypot(dx,dy)||1;e.angle=Math.atan2(dx,dy);e.atkTimer=Math.max(0,e.atkTimer-dt);
 if(e.castRecovery){const a=e.castRecovery;a.time+=dt;e.pose={anim:a.time<.15?a.clip:'recover',progress:a.time<.15?a.time/.15:Math.min(1,(a.time-.15)/.15)};e.animation=e.pose.anim;if(a.time>=.3)e.castRecovery=null;return;}
 if(e.typeIndex>=6){
  const clip=['stab','claw','bite'][e.typeIndex-6],range=1.4*e.type.sc;
  if(e.strike){const a=e.strike;a.time+=dt;e.angle=a.angle;
   if(a.time<.25)e.pose={anim:clip+'_windup',progress:a.time/.25};
   else{if(!a.hit){a.hit=true;const victim=w.actors.find(x=>x.id===a.target);if(alive(victim)&&Math.hypot(victim.x-e.x,victim.y-e.y)<=range&&lineClear(e,victim,.05,w.arena))hurt(w,e,victim,e.dmg);}
    e.pose=a.time<.4?{anim:clip,progress:(a.time-.25)/.15}:{anim:'recover',progress:Math.min(1,(a.time-.4)/.2)};}
   e.animation=e.pose.anim;if(a.time>=.6)e.strike=null;return;
  }
  if(d>range||!lineClear(e,t,.05,w.arena))move(w,e,t,e.spd,dt);
  else if(e.atkTimer<=0){e.strike={time:0,target:t.id,angle:e.angle,hit:false};e.atkTimer=R.tuning.meleeInterval;e.actionId++;e.pose={anim:clip+'_windup',progress:0};e.animation=e.pose.anim;}
  else e.animation='idle';return;
 }
 if(e.type.id==='cryptHound'){
 const base=e.dmg;e.dmg=power(w,e,base);const busy=Hound.update(e,dt,{target:()=>target(w,e),bound:(x,y)=>resolvePosition({x,y},.5,w.arena),sweep:(ax,ay,bx,by)=>{
 const q=moveCircle({x:ax,y:ay},{x:bx-ax,y:by-ay},.5,w.arena,{slide:false}),len=Math.hypot(bx-ax,by-ay);let hit=q.blocked?{t:len?q.distance/len:0,target:null}:null;
 const wall=firstWallHit(w,{x:ax,y:ay},{x:bx,y:by},.5);if(wall&&(!hit||wall.t<=hit.t))hit={t:wall.t,target:null};for(const a of targets(w)){const f=Hound.circleHit(ax,ay,bx,by,a.x,a.y,.5);if(f!==null&&(!hit||f<hit.t))hit={t:f,target:a};}return hit;},damage:(a,n)=>dealDamage(w,a,n,e)});e.dmg=base;
 if(busy){const a=e.ability;if(a){e.angle=Math.atan2(a.dx,a.dy);e.animation=a.phase==='charge'?'charge':a.phase==='recover'?'recover':'windup';e.pose={anim:e.animation,progress:Math.min(1,a.time/(a.phase==='windup'?Hound.ability.windup:a.phase==='recover'?Hound.ability.recovery:Hound.ability.distance/Hound.ability.speed))};if(a.phase==='windup')for(let i=0;i<=6;i++)mark(w,e,i,a.sx+a.dx*a.distance*i/6,a.sy+a.dy*a.distance*i/6,.5,Hound.ability.color);}return;}
 }else if(e.type.id==='warAcolyte'){
 if(Acolyte.update(e,dt,{target:()=>target(w,e),allies:()=>w.actors.filter(a=>a.team==='enemy')})){const a=e.ability;if(a){e.animation=a.phase==='channel'?'channel':'windup';e.pose={anim:e.animation,progress:a.time/(a.phase==='channel'?Acolyte.skill.duration:Acolyte.skill.windup)};mark(w,e,'aura',e.x,e.y,Acolyte.skill.radius,Acolyte.skill.color);}return;}
 }else{
 const def=R.abilities[e.type.name];if(e.ability){const a=e.ability;a.time+=dt;e.animation='attack';e.pose={anim:e.typeIndex===0?'heavy_windup':e.typeIndex===3?'eruption_windup':'attack',progress:Math.min(1,a.time/def.windup*(e.typeIndex===0||e.typeIndex===3?1:.5))};
 if(a.phase==='air'){const u=Math.min(1,a.time/.45);e.x=a.sx+(a.tx-a.sx)*u;e.y=a.sy+(a.ty-a.sy)*u;e.jumpZ=Math.sin(u*Math.PI)*2.7;e.pose={anim:'attack',progress:.5+u*.5};if(u>=1){e.jumpZ=0;area(w,e,a.tx,a.ty,def.radius,e.dmg,def.mult);e.ability=null;e.abilityCd=def.cooldown;e.atkTimer=1;}}
 else if(a.time+1e-9>=def.windup){if(def.kind==='powerShot')shoot(w,e,a.dx,a.dy,e.dmg,18,15/18,'arrow',def.mult);else if(def.kind==='leap'){a.phase='air';a.time=0;a.sx=e.x;a.sy=e.y;}else{area(w,e,a.tx,a.ty,def.radius,e.dmg,def.mult);if(def.kind==='fire')w.hostileZones.push({id:w.nextId++,source:e.id,x:a.tx,y:a.ty,radius:def.radius,life:3,tick:1,damage:Math.max(1,Math.round(power(w,e,e.dmg)*.3))});}if(def.kind!=='leap'){e.ability=null;e.abilityCd=def.cooldown;e.atkTimer=1;}}
 if(!e.ability&&(e.typeIndex===0||e.typeIndex===3)){e.castRecovery={time:0,clip:e.typeIndex===0?'heavy_attack':'eruption_cast'};e.actionId++;e.pose={anim:e.castRecovery.clip,progress:0};}
 if(e.ability){if(def.kind==='powerShot')for(let i=1;i<=15;i++)mark(w,e,i,e.x+a.dx*i,e.y+a.dy*i,.2,def.color);else mark(w,e,'area',a.tx,a.ty,def.radius,def.color);}return;
 }
 e.abilityCd=Math.max(0,e.abilityCd-dt);if(def&&e.abilityCd<=0&&d<=def.range&&d>=(def.minRange||0)){const p=def.kind==='heavy'?e:def.kind==='leap'?resolvePosition(t,e.radius,w.arena):t;e.ability={phase:'windup',time:0,tx:p.x,ty:p.y,dx:dx/d,dy:dy/d};e.actionId++;return;}
 }
 if(e.timer>0){e.animation='attack';e.pose={anim:'attack',progress:Math.min(1,e.animationTime/.3)};return;}
 const range=R.ranged[e.type.name]||(e.typeIndex===4?R.basic.hound.range:e.typeIndex===5?R.basic.acolyte.range:1.4*e.type.sc);
 if(d>range||!lineClear(e,t,.05,w.arena))move(w,e,t,e.spd,dt);
 else{if(R.ranged[e.type.name]&&d<2.6)move(w,e,{x:e.x-dx,y:e.y-dy},e.spd*.5,dt);else e.animation='idle';if(e.atkTimer<=0){e.atkTimer=R.ranged[e.type.name]?R.basic.rangedInterval:e.typeIndex===4?R.basic.hound.interval:e.typeIndex===5?R.basic.acolyte.interval:R.tuning.meleeInterval;e.animation='attack';e.animationTime=0;e.timer=.3;e.actionId++;if(R.ranged[e.type.name])shoot(w,e,dx/d,dy/d,e.dmg,e.typeIndex===1?12:8,2,e.typeIndex===1?'arrow':'magic');else hurt(w,e,t,e.dmg);}}
}
export function tickHostiles(w,dt){
 w.effects=w.effects.filter(f=>!f.hostileShot);for(const s of [...w.hostileShots]){const e=w.actors.find(a=>a.id===s.source);const travel=Math.min(s.remaining,s.speed*dt),end={x:s.x+s.dx*travel,y:s.y+s.dy*travel};let hit=null;
 for(const t of targets(w)){const k=Hound.circleHit(s.x,s.y,end.x,end.y,t.x,t.y,.6);if(k!==null&&(!hit||k<hit.t))hit={t:k,target:t};}
 const wall=firstWallHit(w,s,end);const q=moveCircle(s,{x:end.x-s.x,y:end.y-s.y},.1,w.arena,{slide:false}),solid=q.blocked?(travel?q.distance/travel:0):Infinity;
 if(wall&&wall.t<=solid&&(!hit||wall.t<=hit.t)){absorbWallProjectile(w,s,end,s.damage);s.remaining=0;}else if(solid!==Infinity&&(!hit||solid<=hit.t))s.remaining=0;else if(hit){dealDamage(w,hit.target,s.damage,e);s.remaining=0;}
 s.x=end.x;s.y=end.y;s.remaining-=travel;if(s.remaining>0)w.effects.push({id:`shot-${s.id}`,hostileShot:true,x:s.x,y:s.y,radius:s.kind==='arrow'?.16:.3,color:s.kind==='arrow'?'#edce77':'#ff7755',visual:true,time:0,duration:10});if(s.remaining<=1e-9)w.hostileShots=w.hostileShots.filter(a=>a!==s);
 }
 // Poças com `delay` só avisam (cor clara) e depois causam dano a cada segundo; `gearWave` vem da fonte ou do próprio dado.
 for(const z of w.hostileZones){if(z.delay>0){z.delay-=dt;continue;}const active=Math.min(dt,z.life);z.tick-=active;while(z.tick<=1e-9){for(const t of targets(w))if(Math.hypot(t.x-z.x,t.y-z.y)<=z.radius)dealDamage(w,t,z.damage,{gearWave:z.gearWave??w.actors.find(a=>a.id===z.source)?.gearWave??1});z.tick++;}z.life-=dt;}
 w.hostileZones=w.hostileZones.filter(z=>z.life>1e-9);w.effects=w.effects.filter(f=>!f.hostileZone);for(const z of w.hostileZones)w.effects.push({id:`zone-${z.id}`,hostileZone:true,x:z.x,y:z.y,radius:z.radius,color:z.delay>0?'#c6d48a':z.color||'#ff8951',visual:true,ground:true,fixedRadius:true,time:0,duration:10});
}
