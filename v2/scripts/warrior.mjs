import {dealDamage} from './combat.mjs';
import {lineClear,moveCircle} from './terrain.mjs';
import {fx} from './vfx-events.mjs';
import {warriorActionLearned,warriorTornado,activeStance,warriorStanceId,STANCE_COOLDOWN,STANCES} from './warrior-model.mjs';
export const COMBO_WINDOW=.45;
export const THRUST_TIMING={animation:11/30,advanceStart:6/30,impact:11/30,recovery:.12};
export const RICOCHET={range:6,falloff:.8};
export const WAR_CRY={radius:6,slow:.3,slowTime:4,rally:6};
export const STEEL_WAVE={length:7,speed:18,radius:.9,step:.9};
export const WARRIOR_ACTIONS=[
 {name:'Três cortes',cost:0,cooldown:.6,duration:.6,durations:[.6,16/30,.4],range:2.6,arc:Math.PI*.8,impacts:[11/30,8/30,8/30],multipliers:[.55,.65,.9],clips:['slash_1','slash_2','slash_3']},
 {name:'Estocada avançada',cost:20,cooldown:5,duration:THRUST_TIMING.animation+THRUST_TIMING.recovery,range:3.4,radius:.85,impacts:[THRUST_TIMING.impact],multipliers:[2.2],clips:['thrust']},
 {name:'Golpe de escudo',cost:15,cooldown:7,duration:.8,range:1.8,arc:Math.PI*.65,impacts:[.3],multipliers:[1.3],clips:['shield_bash']},
 {name:'Esquiva',cost:0,cooldown:3,duration:.5,clips:['idle']},
 {name:'Corte tornado',cost:5,cooldown:3,duration:Infinity,range:2.7,arc:Math.PI*2,impacts:[.15],multipliers:[.65],clips:['slash_2']},
 {name:'Arremesso de escudo',cost:20,cooldown:7,duration:.4,range:8,impacts:[.18],multipliers:[1.2],clips:['shield_bash']},
 {name:'Brado de Guerra',cost:0,cooldown:18,duration:.5,impacts:[.2],multipliers:[0],clips:['shield_bash']},
 {name:'Onda de Aço',cost:25,cooldown:8,duration:.4,range:STEEL_WAVE.length,impacts:[8/30],multipliers:[1.8],clips:['slash_3']},
];
// Ações que resolvem o efeito no impacto por conta própria, sem o laço de golpe corpo a corpo.
const LAUNCHED=new Set([5,6,7]);
const warriorPower=w=>w.player.damage*(activeStance(w)?.damage??1);
export function warriorAction(w,index=0,aim=w.aim){
 const a=WARRIOR_ACTIONS[index],p=w.player;
 if(index===3||!warriorActionLearned(index,w.warriorRanks)||[2,5].includes(index)&&(!w.equipment?.shield||w.warriorShieldFlight))return false;
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
 w.warriorAction={index,stage,duration,damageFactor:1+bonus,time:0,next:0,queued:null,origin:{x:p.x,y:p.y},dx:dx/d,dy:dy/d,travel:index===1?Math.min(5,Math.max(0,d-2.2)):0,tornado:index===4?warriorTornado(w.warriorTornadoVariant,w.warriorRanks):null};
 return true;
}
// Troca instantânea: não passa pelo caminho das ações e não interrompe o golpe em andamento.
export function toggleStance(w){
 const p=w.player;
 if(w.classId!=='warrior'||!((w.warriorRanks?.stance||0)>0)||w.paused||p.hp<=0||p.dead||(w.warriorStanceReady||0)>w.time+1e-9)return false;
 w.warriorStance=warriorStanceId(w.warriorStance)==='offensive'?'defensive':'offensive';w.warriorStanceReady=w.time+STANCE_COOLDOWN;
 fx(w,'impact',{x:p.x,y:p.y,h:1,color:STANCES[w.warriorStance].color,radius:.7,duration:.3});
 return true;
}
export function tickWarrior(w,dt){
 if(w.paused)return;
 tickStanceRing(w);tickWaves(w,dt);
 tickShieldFlight(w,dt);
 if(w.warriorCombo&&w.time>w.warriorCombo.expires)w.warriorCombo=null;
 const s=w.warriorAction;if(!s)return;
 const p=w.player,a=WARRIOR_ACTIONS[s.index];
 if(p.hp<=0||p.dead||w.dash.remaining>0){w.warriorAction=null;w.warriorCombo=null;p.timer=0;return;}
 const before=s.time;s.time+=dt;
 if(s.index===4){
  const t=s.tornado,available=Math.min(dt,p.mp/t.drain);p.mp=Math.max(0,p.mp-dt*t.drain);p.angle=Math.atan2(s.dx,s.dy)+s.time*Math.PI*2/t.turn;p.timer=.1;
  if(p.mp<=0||available<dt){stopWarriorChannel(w);return;}
  if(s.time+1e-9<.15+s.next*t.interval)return;
 }

 if(s.index===1){const elapsed=Math.max(0,Math.min(THRUST_TIMING.impact,s.time)-Math.max(THRUST_TIMING.advanceStart,before));if(elapsed){const pos=moveCircle(p,{x:s.dx*s.travel*elapsed/(THRUST_TIMING.impact-THRUST_TIMING.advanceStart),y:s.dy*s.travel*elapsed/(THRUST_TIMING.impact-THRUST_TIMING.advanceStart)},p.radius,w.arena,{slide:false});p.x=pos.x;p.y=pos.y;if(pos.blocked)s.travel=0;}}
 const strike=s.index===0?s.stage:0;
 if(LAUNCHED.has(s.index)&&s.next<1&&s.time>=a.impacts[0]){s.next++;if(s.index===5)launchShield(w,s);else if(s.index===6)warCry(w);else launchWave(w,s);}
 const range=s.index===4?s.tornado.range:a.range;
 while(!LAUNCHED.has(s.index)&&(s.index===4||s.next<1)&&s.time+1e-9>=(s.index===4?.15+s.next*s.tornado.interval:a.impacts[strike])){
  s.next++;const impact=strike;
  for(const e of w.actors){
   if(e.team!=='enemy'||e.hp<=0)continue;
   const x=e.x-p.x,y=e.y-p.y,n=Math.hypot(x,y);
   if(s.index===1){
    // Cápsula contínua: cobre o avanço e a ponta, inclusive alvos já ultrapassados.
    const origin=s.origin,length=Math.hypot(p.x-origin.x,p.y-origin.y)+a.range;
    const along=Math.max(0,Math.min(length,(e.x-origin.x)*s.dx+(e.y-origin.y)*s.dy));
    if(Math.hypot(e.x-origin.x-s.dx*along,e.y-origin.y-s.dy*along)>a.radius+e.radius||!lineClear(origin,e,.05,w.arena))continue;
   }else if(n>range+e.radius||n>0&&(x*s.dx+y*s.dy)/n<Math.cos(a.arc/2)||!lineClear(p,e,.05,w.arena))continue;
   const rank=w.warriorRanks||{},factor=s.index===0?1+(rank.slash||0)*.06:s.index===1?1+(rank.thrust||0)*.1:s.index===2?1+(rank.bash||0)*.1:1;
   const result=dealDamage(w,e,Math.max(1,Math.floor(warriorPower(w)*a.multipliers[impact]*factor*s.damageFactor)),p,a.name);
   if(s.index===0&&s.stage===2&&result.applied>0)w.warriorMomentum={until:w.time+4,bonus:(rank.momentum||0)*.1};
   if(s.index===0&&result.applied>0){const vigor=activeStance(w)?.vigorOnSlash||0;if(vigor)p.mp=Math.min(p.maxMp,p.mp+vigor);}
   if(s.index===2&&e.hp>0){const pos=moveCircle(e,{x:s.dx*.8,y:s.dy*.8},e.radius,w.arena,{slide:false});e.x=pos.x;e.y=pos.y;}
  }
  if(s.index===1)w.effects.push({id:w.nextId++,kind:'thrust',fx:'thrust',x:s.origin.x,y:s.origin.y,dx:s.dx,dy:s.dy,length:Math.hypot(p.x-s.origin.x,p.y-s.origin.y)+a.range,radius:a.radius,time:0,duration:.25,color:'#ffd9a0',visual:true});
  else w.effects.push({id:w.nextId++,kind:'slash',fx:'slash',x:p.x,y:p.y,dx:s.dx,dy:s.dy,radius:range,arc:a.arc,time:0,duration:.22,color:s.index===2?'#a8d4ec':'#ffd9a0',visual:true});
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
// Anel discreto sob os pés, na cor da postura, ligado à posição real do personagem.
function tickStanceRing(w){
 if(w.classId!=='warrior')return;
 w.effects=w.effects.filter(f=>!f.warriorStanceRing);
 const stance=activeStance(w),p=w.player;if(!stance||p.hp<=0)return;
 w.effects.push({id:'warrior-stance-'+stance.id,warriorStanceRing:true,x:p.x,y:p.y,radius:p.radius+.55,color:stance.color,visual:true,ground:true,fixedRadius:true,time:3,duration:10});
}
function warCry(w){
 const p=w.player;
 for(const e of w.actors){if(e.team!=='enemy'||e.hp<=0||Math.hypot(e.x-p.x,e.y-p.y)>WAR_CRY.radius+e.radius||!lineClear(p,e,.05,w.arena))continue;e.slow=WAR_CRY.slow;e.slowTime=WAR_CRY.slowTime;}
 w.warriorRally={until:w.time+WAR_CRY.rally};
 fx(w,'shockwave',{x:p.x,y:p.y,radius:WAR_CRY.radius,color:'#d9b574',mood:'dust',shake:.1,duration:.5});
}
function launchWave(w,s){
 const p=w.player;
 (w.warriorWaves??=[]).push({x:p.x,y:p.y,dx:s.dx,dy:s.dy,traveled:0,nextFx:0,hits:new Set(),damage:Math.max(1,Math.floor(warriorPower(w)*WARRIOR_ACTIONS[7].multipliers[0]*s.damageFactor))});
}
// A onda avança como a varredura do escudo: atravessa inimigos, uma vez por alvo, e para na primeira parede.
function tickWaves(w,dt){
 if(!w.warriorWaves?.length)return;
 if(w.player.hp<=0){w.warriorWaves=[];return;}
 w.warriorWaves=w.warriorWaves.filter(o=>{
  const distance=Math.min(STEEL_WAVE.speed*dt,STEEL_WAVE.length-o.traveled),previous={x:o.x,y:o.y},pos=moveCircle(o,{x:o.dx*distance,y:o.dy*distance},.1,w.arena,{slide:false});
  o.x=pos.x;o.y=pos.y;o.traveled+=distance;
  const sx=o.x-previous.x,sy=o.y-previous.y,length=sx*sx+sy*sy;
  for(const e of w.actors){
   if(e.team!=='enemy'||e.hp<=0||o.hits.has(e.id))continue;
   const t=length?Math.max(0,Math.min(1,((e.x-previous.x)*sx+(e.y-previous.y)*sy)/length)):0;
   if(Math.hypot(e.x-previous.x-sx*t,e.y-previous.y-sy*t)>STEEL_WAVE.radius+e.radius||!lineClear(previous,e,.05,w.arena))continue;
   o.hits.add(e.id);dealDamage(w,e,o.damage,w.player,'Onda de Aço');
  }
  // Arcos curtos em sequência mostram a posição real da onda.
  while(o.nextFx<=o.traveled){o.nextFx+=STEEL_WAVE.step;w.effects.push({id:w.nextId++,kind:'slash',fx:'slash',x:o.x-o.dx*.5,y:o.y-o.dy*.5,dx:o.dx,dy:o.dy,radius:1.4,arc:Math.PI*.8,sparks:2,time:0,duration:.22,color:'#ffd9a0',visual:true});}
  return !pos.blocked&&o.traveled<STEEL_WAVE.length-1e-9;
 });
}
function launchShield(w,s){
 const a={id:w.nextId++,model:'warriorShield',team:'neutral',warriorProjectile:true,dummy:true,x:w.player.x,y:w.player.y,radius:.22,hp:1,maxHp:1,angle:0,animation:'idle',animationTime:0,timer:0};w.actors.push(a);
 w.warriorShieldFlight={actor:a,time:0,returnTime:0,returning:false,dx:s.dx,dy:s.dy,hits:new Set(),damage:Math.floor(warriorPower(w)*1.2*s.damageFactor),bounces:w.warriorRanks?.ricochet||0,factor:1,targetId:null,chained:false};
}
// Próximo alvo do Ricochete: o inimigo vivo mais próximo do escudo, ainda não atingido na ida e sem parede no caminho.
function nextBounce(w,a,f){
 let best=null,nearest=RICOCHET.range;
 for(const e of w.actors){
  if(e.team!=='enemy'||e.hp<=0||f.hits.has(e.id+':false'))continue;
  const d=Math.hypot(e.x-a.x,e.y-a.y);
  if(d<=nearest&&lineClear(a,e,.05,w.arena)){best=e;nearest=d;}
 }
 return best;
}
function tickShieldFlight(w,dt){
 const f=w.warriorShieldFlight;if(!f)return;const a=f.actor,p=w.player;
 if(p.hp<=0||!w.actors.includes(a)){w.actors=w.actors.filter(e=>e!==a);w.warriorShieldFlight=null;return;}
 f.time+=dt;if(f.returning)f.returnTime+=dt;const previous={x:a.x,y:a.y};
 if(!f.returning&&f.targetId!==null){
  // Alvo morto no caminho: procura outro sem gastar salto; sem opção, a cadeia termina.
  const target=w.actors.find(e=>e.id===f.targetId&&e.hp>0)||nextBounce(w,a,f);
  if(target){f.targetId=target.id;const d=Math.hypot(target.x-a.x,target.y-a.y)||1;f.dx=(target.x-a.x)/d;f.dy=(target.y-a.y)/d;}
  else{f.targetId=null;f.returning=true;}
 }
 let dx=f.dx,dy=f.dy;
 if(f.returning){const d=Math.hypot(p.x-a.x,p.y-a.y);if(d<.65||f.returnTime>2){w.actors=w.actors.filter(e=>e!==a);w.warriorShieldFlight=null;return;}dx=(p.x-a.x)/d;dy=(p.y-a.y)/d;}
 const pos=moveCircle(a,{x:dx*14*dt,y:dy*14*dt},a.radius,w.arena,{slide:false});a.x=pos.x;a.y=pos.y;a.angle+=dt*15;
 const sx=a.x-previous.x,sy=a.y-previous.y,length=sx*sx+sy*sy;let reached=false;
 for(const e of w.actors){if(e.team!=='enemy'||e.hp<=0)continue;const key=e.id+':'+f.returning;if(f.hits.has(key))continue;
  const t=length?Math.max(0,Math.min(1,((e.x-previous.x)*sx+(e.y-previous.y)*sy)/length)):0;
  if(Math.hypot(e.x-previous.x-sx*t,e.y-previous.y-sy*t)>.5+e.radius||!lineClear(previous,e,.05,w.arena))continue;
  f.hits.add(key);dealDamage(w,e,Math.max(1,Math.floor(f.damage*(f.returning?1:f.factor))),p,'Arremesso de escudo');
  if(!f.returning&&(f.targetId===null||f.targetId===e.id))reached=true;
 }
 if(!f.returning&&reached){
  const next=f.bounces>0?nextBounce(w,a,f):null;
  if(next){
   const d=Math.hypot(next.x-a.x,next.y-a.y)||1;f.bounces--;f.factor*=RICOCHET.falloff;f.targetId=next.id;f.chained=true;
   fx(w,'impact',{x:a.x,y:a.y,h:1.1,color:'#a8d4ec',size:.6,radius:.5,duration:.25});
   w.effects.push({id:w.nextId++,kind:'thrust',fx:'thrust',x:a.x,y:a.y,dx:(next.x-a.x)/d,dy:(next.y-a.y)/d,length:d,radius:.16,time:0,duration:.25,color:'#a8d4ec',visual:true});
  }else if(f.chained){f.targetId=null;f.returning=true;}
 }
 if(!f.returning&&(pos.blocked||f.targetId===null&&f.time>=.55)){f.targetId=null;f.returning=true;}
}
