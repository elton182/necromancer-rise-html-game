import King from './shared-fallen-king.mjs';
import {spawnEnemy,target} from './enemies.mjs';
import {dealDamage} from './combat.mjs';
import {navigate,resolvePosition} from './terrain.mjs';
import {blockEnemyByWalls} from './spells.mjs';
import {fx} from './vfx-events.mjs';
// Ajustes exclusivos da v2 sobre o modelo canônico, que a v1 continua usando sem alterações.
// Cada par é [fase I, fase II]; o modelo compartilhado segue como fonte de tempos, recargas e escolha do golpe.
export const V2_KING={
 slashRange:[1.2,1.3],slashArc:[1.2,1.25],leapRadius:[1.5,1.7],
 // Queda do Rei deixa chão em chamas: fração do dano do chefe por segundo, duração (s) e proporção do raio do impacto.
 fireShare:[.3,.4],fireLife:[3,4.5],fireRatio:.8,
 // Fase II: o relógio do modelo corre mais rápido (preparação, golpe, recarga e intervalo) e o chefe anda mais depressa.
 speed:[1,1.3],move:[1,1.3],gap:[Infinity,.35],
 // Transição: levanta a arma, bate no chão e libera uma onda de fogo apenas visual.
 roar:{windup:.9,strike:.35,recover:.5,radius:9,warning:3.4},
};
const EMBER='#ff7a2a',phase=e=>e.kingPhase2?1:0;
// Fração (0..1) do tempo de preparação até o evento do golpe, para os avisos acompanharem o estado real.
function lead(a){
 const phases=King.skills[a.kind].phases,event=phases.findIndex(p=>p[2]);let total=0,done=0;
 phases.forEach((p,i)=>{if(i<=event)total+=p[1];if(i<a.index)done+=p[1];});
 return Math.min(1,(done+a.time)/total);
}
function warn(w,e,key,props){w.effects.push({id:`king-${e.id}-${key}`,kingWarning:e.id,source:e.id,kind:'kingWarning',visual:true,ground:true,fixedRadius:true,time:0,duration:10,...props});}
function roar(w,e,dt){
 const r=e.kingRoar,T=V2_KING.roar,strikeEnd=T.windup+T.strike;
 if(r.face===undefined){const t=target(w,e);r.face=t?Math.atan2(t.y-e.y,t.x-e.x):Math.PI/2;}
 r.time+=dt;let pose;
 if(r.time<T.windup)pose={anim:'slam_windup',progress:r.time/T.windup,face:r.face};
 else if(r.time<strikeEnd)pose={anim:'slam',progress:(r.time-T.windup)/T.strike*13/17,face:r.face};
 else{
  if(!r.fired){r.fired=true;fx(w,'roar',{x:e.x,y:e.y,radius:T.radius,color:EMBER,mood:'fire',shake:.7,duration:1.1});}
  const u=(r.time-strikeEnd)/T.recover;
  pose=u<.3?{anim:'slam',progress:13/17+u/.3*4/17,face:r.face}:{anim:'slam_recover',progress:Math.min(1,(u-.3)/.7),face:r.face};
 }
 e.pose=pose;e.animation=pose.anim;e.angle=Math.PI/2-pose.face;
 if(r.time<strikeEnd)warn(w,e,'roar',{x:e.x,y:e.y,radius:T.warning,harmless:true,fx:'dangerRune',mood:'fire',progress:Math.min(1,r.time/strikeEnd),color:EMBER});
 if(r.time>=strikeEnd+T.recover){e.kingRoar=null;e.kingGap=Math.max(e.kingGap,.5);}
}
export function tickKing(w,e,dt){
 if(!e.kingCd){King.reset(e);e.kingRoar=null;e.kingCombo=false;}
 w.effects=w.effects.filter(f=>f.kingWarning!==e.id);
 if(!e.kingPhase2&&!e.dead&&!e.dummy&&e.hp<=e.maxHp*King.ENRAGE){e.kingPhase2=true;e.kingRoar={time:0};}
 // A transição espera o golpe em andamento terminar e então ocupa o chefe; sem ataques novos até acabar.
 if(e.kingRoar&&!e.king){roar(w,e,dt);return;}
 const ph=phase(e),targets=()=>w.actors.filter(a=>(a===w.player||a.team==='ally')&&a.hp>0&&!a.dead);
 const nearest=()=>target(w,e);
 const damage=(test,n)=>{for(const t of targets())if(test(t))dealDamage(w,t,n,e);};
 const bound=(x,y)=>resolvePosition({x,y},e.radius,w.arena);
 if(ph&&!e.king)e.kingGap=Math.min(e.kingGap,V2_KING.gap[ph]);
 const before=e.king?.kind;
 const busy=King.update(e,dt*V2_KING.speed[ph],{
  target:nearest,bound,adds:()=>w.actors.filter(a=>a.kingOwner===e.id&&a.hp>0).length,
  cone:(x,y,dx,dy,r,arc,n)=>{
   const reach=r*V2_KING.slashRange[ph],width=Math.min(Math.PI,arc*V2_KING.slashArc[ph]);
   damage(t=>{const vx=t.x-x,vy=t.y-y,d=Math.hypot(vx,vy);return d<=reach&&(d<.6||(vx*dx+vy*dy)/d>=Math.cos(width/2));},n);
   fx(w,'slash',{x,y,dx,dy,radius:reach,arc:width,h:.55,color:'#ff7a4a',mood:'fire',sparks:18,duration:.45});
  },
  area:(x,y,r,n)=>{
   const reach=r*V2_KING.leapRadius[ph],life=V2_KING.fireLife[ph];
   damage(t=>Math.hypot(t.x-x,t.y-y)<=reach,n);
   fx(w,'shockwave',{kind:'kingSlam',x,y,radius:reach,color:EMBER,mood:'fire',shake:.55,duration:.75});
   (w.hostileZones||=[]).push({id:w.nextId++,source:e.id,gearWave:e.gearWave,x,y,radius:reach*V2_KING.fireRatio,life,span:life,tick:1,damage:Math.max(1,Math.round(e.dmg*V2_KING.fireShare[ph])),fire:true,color:EMBER});
  },
  summon:points=>{
   for(const p of points){if(w.spawnKingAdd)w.spawnKingAdd(p,e);else spawnEnemy(w,0,p.x,p.y,{wave:e.gearWave||1,owner:e.id});fx(w,'summonBurst',{kind:'kingSummon',x:p.x,y:p.y,radius:1.3,color:King.skills.summon.color,duration:.9});}
   fx(w,'summonBurst',{x:e.x,y:e.y,radius:3,color:King.skills.summon.color,duration:.9});
  },
 });
 e.pose=King.pose(e);if(e.pose){e.animation=e.pose.anim;e.angle=Math.PI/2-e.pose.face;}
 // Fase II: depois de um Corte Real, um segundo corte encadeado (sempre em pares) enquanto o alvo continuar à frente.
 if(ph&&before==='slash'&&!e.king){if(!e.kingCombo){e.kingCombo=true;e.kingCd.slash=0;e.kingGap=.12;}else e.kingCombo=false;}
 if(!busy){const t=nearest();if(t){const before={x:e.x,y:e.y},q=navigate(e,t,(e.spd??1.1)*V2_KING.move[ph]*((e.slowTime||0)>0?1-(e.slow||0):1),dt,w.arena);e.x=q.x;e.y=q.y;blockEnemyByWalls(w,e,before);const d=Math.hypot(e.x-before.x,e.y-before.y);e.walkDistance+=d;e.animation=d>1e-5?'walk':'idle';if(d>1e-5)e.angle=Math.atan2(e.x-before.x,e.y-before.y);}}
 // Os avisos são visuais: apenas o modelo dispara o dano no contato real.
 const a=e.king;if(!a)return;
 const s=King.skills[a.kind],event=s.phases.findIndex(p=>p[2]);if(a.index>event)return;
 const progress=lead(a),direction=Math.atan2(a.dy,a.dx);
 if(a.kind==='summon'){
  a.points.forEach((p,i)=>warn(w,e,i,{x:p.x,y:p.y,radius:1.15,harmless:true,fx:'summonRune',progress,color:s.color}));
  warn(w,e,'boss',{x:e.x,y:e.y,radius:3.1,harmless:true,fx:'summonRune',progress,color:s.color});
 }else if(a.kind==='leap'){
  warn(w,e,0,{x:a.tx,y:a.ty,radius:s.radius*V2_KING.leapRadius[ph],direction,fx:'dangerRune',mood:'fire',progress,color:s.color});
 }else warn(w,e,0,{x:e.x,y:e.y,radius:s.range*V2_KING.slashRange[ph],arc:Math.min(Math.PI,s.arc*V2_KING.slashArc[ph]),direction,color:s.color});
}
