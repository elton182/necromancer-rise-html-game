import King from './shared-fallen-king.mjs';
import {spawnEnemy,target} from './enemies.mjs';
import {dealDamage} from './combat.mjs';
import {navigate,resolvePosition,lineClear} from './terrain.mjs';
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
 // Vida dos Reis fora da Fase 4 (Expedições, Conquista, missões da vila e treino): multiplica a vida-base de 350/1000.
 hp:12,
 // Queda do Rei mira Zephyr quando ele está no alcance do salto, mesmo com a horda colada no chefe.
 leapAtPlayer:true,
 // Golpes só da v2 (fora do modelo canônico). Fases como no modelo: [nome, duração, evento]; o relógio também acelera na fase II.
 // Giro da Coroa: com a horda amontoada, gira a arma em 360°; aviso em círculo no próprio Rei.
 spin:{name:'Giro da Coroa',range:3.4,mult:1.3,crowd:3,cooldown:8,initial:4,color:'#ff5a2a',phases:[['windup',1.1],['swing',.15,'hit'],['recover',.8]]},
 // Rastro de Brasas: com Zephyr longe, risca uma linha de fogo na direção travada dele e deixa poças acesas no caminho.
 embers:{name:'Rastro de Brasas',min:6,max:14,length:12,width:1.1,mult:.7,cooldown:6.5,initial:3,color:'#ff9a3a',pools:[3,6,9],poolRadius:1.1,poolLife:2.5,poolShare:.15,phases:[['windup',.9],['cast',.1,'hit'],['recover',.6]]},
 enragedCooldown:.8,
};
const TAU=Math.PI*2;
// Progresso do golpe v2 até o evento, para o aviso acompanhar o tempo real.
function leadV2(a){const phases=V2_KING[a.kind].phases,event=phases.findIndex(p=>p[2]);let total=0,done=0;phases.forEach((p,i)=>{if(i<=event)total+=p[1];if(i<a.index)done+=p[1];});return Math.min(1,(done+a.time)/total);}
function poseV2(a){
 const [name,duration]=V2_KING[a.kind].phases[a.index],u=duration?Math.min(1,a.time/duration):1;
 if(a.kind==='spin'){
  if(name==='windup')return {anim:'windup',progress:u,face:a.face};
  // O corpo gira uma volta inteira no golpe; a recuperação termina virada para o alvo original.
  if(name==='swing')return {anim:'attack',progress:u*4/13,face:a.face+TAU*u};
  return {anim:'recover',progress:u,face:a.face};
 }
 if(name==='windup')return {anim:'cast',progress:u,face:a.face};
 return {anim:'recover',progress:name==='cast'?.5:.5+u*.5,face:a.face};
}
// Escolhe um golpe da v2 antes do modelo canônico; devolve null para o modelo seguir com Corte, Queda e Chamado.
// Prioridade: Chamado (fase II) > Giro > Queda em Zephyr > Corte > Brasas > Queda no alvo próximo.
function pickV2(w,e,ctx){
 const p=w.player,alive=p&&p.hp>0&&!p.dead,pd=alive?Math.hypot(p.x-e.x,p.y-e.y):Infinity;
 if(e.kingPhase2&&e.kingCd.summon<=0&&ctx.adds()<King.skills.summon.limit)return null;
 if(e.kingV2Cd.spin<=0&&ctx.crowd(V2_KING.spin.range)>=V2_KING.spin.crowd)return {kind:'spin',target:ctx.nearest()||p};
 if(!alive)return null;
 if(V2_KING.leapAtPlayer&&e.kingCd.leap<=0&&pd>=King.skills.leap.min&&pd<=King.skills.leap.max+2)return null;
 const t=ctx.nearest();if(t&&Math.hypot(t.x-e.x,t.y-e.y)<=King.skills.slash.range&&e.kingCd.slash<=0)return null;
 const E=V2_KING.embers;if(e.kingV2Cd.embers<=0&&pd>=E.min&&pd<=E.max&&lineClear(e,p,.05,w.arena))return {kind:'embers',target:p};
 return null;
}
function advanceV2(e,dt,fire){
 let left=dt;
 while(e.kingV2&&left>0){
  const a=e.kingV2,S=V2_KING[a.kind],[,duration,event]=S.phases[a.index],step=Math.min(left,duration-a.time);
  a.time+=step;left-=step;if(a.time<duration-1e-9)break;
  if(event)fire(a);
  a.index++;a.time=0;
  if(a.index>=S.phases.length){e.kingV2=null;e.kingGap=King.GAP;e.atkTimer=Math.max(e.atkTimer||0,.6);e.kingV2Cd[a.kind]=S.cooldown*(e.kingPhase2?V2_KING.enragedCooldown:1);}
 }
}
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
 if(!e.kingCd){King.reset(e);e.kingRoar=null;e.kingCombo=false;e.kingV2=null;e.kingV2Cd=null;}
 e.kingV2Cd||={spin:V2_KING.spin.initial,embers:V2_KING.embers.initial};
 w.effects=w.effects.filter(f=>f.kingWarning!==e.id);
 if(!e.kingPhase2&&!e.dead&&!e.dummy&&e.hp<=e.maxHp*King.ENRAGE){e.kingPhase2=true;e.kingRoar={time:0};}
 // A transição espera o golpe em andamento terminar e então ocupa o chefe; sem ataques novos até acabar.
 if(e.kingRoar&&!e.king&&!e.kingV2){roar(w,e,dt);return;}
 const ph=phase(e),targets=()=>w.actors.filter(a=>(a===w.player||a.team==='ally')&&a.hp>0&&!a.dead);
 const nearest=()=>target(w,e);
 const damage=(test,n)=>{for(const t of targets())if(test(t))dealDamage(w,t,n,e);};
 const bound=(x,y)=>resolvePosition({x,y},e.radius,w.arena);
 const crowd=r=>targets().filter(t=>t.team==='ally'&&Math.hypot(t.x-e.x,t.y-e.y)<=r).length,adds=()=>w.actors.filter(a=>a.kingOwner===e.id&&a.hp>0).length;
 if(ph&&!e.king&&!e.kingV2)e.kingGap=Math.min(e.kingGap,V2_KING.gap[ph]);
 const clock=dt*V2_KING.speed[ph];
 // Golpes da v2: o anel do Giro e a linha das Brasas aplicam dano só no evento, como os do modelo.
 const ring=(x,y,r,n)=>{damage(t=>Math.hypot(t.x-x,t.y-y)<=r+(t.radius||0)*.5,n);fx(w,'shockwave',{kind:'kingSpin',x,y,radius:r,color:V2_KING.spin.color,mood:'fire',shake:.45,duration:.6});fx(w,'slash',{x,y,dx:1,dy:0,radius:r,arc:TAU,h:.55,color:V2_KING.spin.color,mood:'fire',sparks:24,duration:.45});};
 const line=(x,y,dx,dy,len,width,n)=>{const E=V2_KING.embers;
  damage(t=>{const vx=t.x-x,vy=t.y-y,along=vx*dx+vy*dy,side=Math.abs(-vx*dy+vy*dx);return along>=-.3&&along<=len&&side<=width/2+(t.radius||0);},n);
  for(const s of E.pools){const q=bound(x+dx*s,y+dy*s);(w.hostileZones||=[]).push({id:w.nextId++,source:e.id,gearWave:e.gearWave,x:q.x,y:q.y,radius:E.poolRadius,life:E.poolLife,span:E.poolLife,tick:1,damage:Math.max(1,Math.round(e.dmg*E.poolShare)),fire:true,color:EMBER});}
  for(let s=1;s<=len;s+=1.5)fx(w,'shockwave',{x:x+dx*s,y:y+dy*s,radius:.9,color:E.color,mood:'fire',duration:.5});
 };
 if(e.kingV2){
  advanceV2(e,clock,a=>{const S=V2_KING[a.kind],n=Math.round(e.dmg*S.mult);if(a.kind==='spin')ring(e.x,e.y,S.range,n);else line(e.x,e.y,a.dx,a.dy,S.length,S.width,n);});
  const a=e.kingV2;
  if(a){
   e.pose=poseV2(a);e.animation=e.pose.anim;e.angle=Math.PI/2-e.pose.face;
   const S=V2_KING[a.kind],event=S.phases.findIndex(p=>p[2]);
   if(a.index<=event){const progress=leadV2(a);
    if(a.kind==='spin')warn(w,e,'spin',{x:e.x,y:e.y,radius:S.range,fx:'dangerRune',mood:'fire',progress,color:S.color});
    else warn(w,e,'embers',{x:e.x,y:e.y,dx:a.dx,dy:a.dy,length:S.length,radius:S.width/2,direction:Math.atan2(a.dy,a.dx),fx:'dangerLine',mood:'fire',progress,color:S.color});}
  }
  return;
 }
 if(!e.king){
  for(const k in e.kingV2Cd)e.kingV2Cd[k]=Math.max(0,e.kingV2Cd[k]-clock);
  if(e.kingGap<=clock+1e-9){const pick=pickV2(w,e,{crowd,adds,nearest});
   if(pick){const dx=pick.target.x-e.x,dy=pick.target.y-e.y,d=Math.hypot(dx,dy);e.kingGap=0;e.kingV2={kind:pick.kind,index:0,time:0,dx:d>1e-6?dx/d:1,dy:d>1e-6?dy/d:0,face:d>1e-6?Math.atan2(dy,dx):0};e.pose=poseV2(e.kingV2);e.animation=e.pose.anim;e.angle=Math.PI/2-e.pose.face;return;}}
 }
 // Com a horda segurando o Rei, a Queda procura Zephyr quando ele está no alcance do salto.
 const leapTarget=()=>{const t=nearest(),p=w.player;if(!V2_KING.leapAtPlayer||!p||p.hp<=0||p.dead||e.kingCd.leap>0)return t;const d=Math.hypot(p.x-e.x,p.y-e.y);return d>=King.skills.leap.min&&d<=King.skills.leap.max+2?p:t;};
 const before=e.king?.kind;
 const busy=King.update(e,clock,{
  target:leapTarget,bound,adds,
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
 }else warn(w,e,0,{x:e.x,y:e.y,radius:s.range*V2_KING.slashRange[ph],arc:Math.min(Math.PI,s.arc*V2_KING.slashArc[ph]),direction,fx:'dangerRune',progress,color:s.color});
}
