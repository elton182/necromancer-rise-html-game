// Arqueira e Mercenário em combate: tiros com projétil real, Recuo, Chuva de Flechas, bombas em arco,
// minas e chão em chamas. Unidades de mundo, segundos, atualização por dt.
// O renderizador lê w.marksmanAction (pose) e os efeitos `fx`; todo dano passa por dealDamage.
import {dealDamage} from './combat.mjs';
import {moveCircle,lineClear,resolvePosition} from './terrain.mjs';
import {fx} from './vfx-events.mjs';
import {isMarksman,isMartial} from './class-registry.mjs';
import {marksmanActions,marksmanLearned,actionCooldown,actionDamage,actionPierce,blastRadius,AMBUSH,FALCON,falconDamage,MAGE} from './marksman-model.mjs';

const living=e=>e.team==='enemy'&&e.hp>0&&!e.dead;
const boss=(w,e)=>e===w.boss||e.isBoss;
// Dano-base: físico para as classes marciais, mágico para o Mago.
const power=w=>isMartial(w.classId)?(w.player.damage||0):(w.player.spellDamage||0);
// Bônus contra o alvo: marca do falcão (flechas) e Estilhaçar (fogo e arcano em alvos lentos pelo gelo).
function bonusVs(w,e,def){let k=markFactor(w,e);if(w.classId==='mage'&&e?.frostUntil>w.time&&(def?.element==='fire'||def?.element==='arcane'))k*=1+(w.marksmanRanks?.shatter||0)*MAGE.shatter;return k;}
export const marksmanShot=w=>marksmanActions(w.classId)[0];

export function initializeMarksman(w,character){
 Object.assign(w,{marksmanRanks:character?.marksmanRanks||{},marksmanAction:null,marksmanShots:[],marksmanCooldowns:{},marksmanLobs:[],marksmanZones:[],marksmanMines:[],marksmanAmbush:0,falcon:null,falconReady:0});
}
// Morte, troca de cena e reinício: nada do que o atirador lançou continua no mundo.
export function clearMarksman(w){
 Object.assign(w,{marksmanAction:null,marksmanShots:[],marksmanLobs:[],marksmanZones:[],marksmanMines:[],marksmanAmbush:0});
 removeFalcon(w);
 if(w.effects)w.effects=w.effects.filter(f=>!f.marksmanShot&&!f.marksmanRing&&!f.marksmanFire);
 if(w.player&&isMarksman(w.classId))w.player.timer=0;
}
export const marksmanCooldown=(w,id=marksmanShot(w).id)=>Math.max(0,(w.marksmanCooldowns?.[id]||0)-w.time);

// Inicia a ação do slot na direção da mira. Direção e ponto-alvo ficam fixos durante a ação.
export function marksmanAction(w,index=0,aim=w.aim){
 const p=w.player,list=marksmanActions(w.classId),def=list[index];
 if(!isMarksman(w.classId)||!def||def.kind==='dodge'||w.paused||p.hp<=0||p.dead||w.dash.remaining>0||w.marksmanAction||p.rootTime>0)return false;
 if(!marksmanLearned(w.classId,index,w.marksmanRanks)||marksmanCooldown(w,def.id)>1e-9||p.mp<def.cost)return false;
 const dx=aim.x-p.x,dy=aim.y-p.y,d=Math.hypot(dx,dy);
 if(!Number.isFinite(d)||d<1e-9)return false;
 const ux=dx/d,uy=dy/d,reach=def.range?Math.max(def.minRange||0,Math.min(def.range,d)):0;
 p.mp-=def.cost;
 w.marksmanCooldowns[def.id]=w.time+actionCooldown(def,w.marksmanRanks,w.modifiers?.gearCooldown);
 const target=reach?resolvePosition({x:p.x+ux*reach,y:p.y+uy*reach},.1,w.arena):null;
 w.marksmanAction={index,id:def.id,clip:def.clip,time:0,released:false,fired:0,duration:def.duration,dx:ux,dy:uy,target,aim:d,origin:{x:p.x,y:p.y}};
 w.castCooldown=def.duration;p.angle=Math.atan2(ux,uy);p.animation=def.clip;p.animationTime=0;p.actionId++;p.timer=def.duration;
 // Avisos legíveis: a linha da Flecha Perfurante e a área da Chuva aparecem antes do efeito.
 if(def.warn)fx(w,'dangerLine',{x:p.x,y:p.y,dx:ux,dy:uy,length:def.range,radius:def.radius+.25,color:def.color,harmless:true,progress:1,duration:def.release});
 return true;
}
// Fração do movimento permitida agora: 1 sem ação; a da ação em curso (0 trava).
export function marksmanMove(w){const s=w.marksmanAction;return s?marksmanActions(w.classId)[s.index]?.move||0:1;}
// Com movimento, o clipe vai só para o tronco (upper) e as pernas seguem a passada.
export function marksmanPose(w){const s=w.marksmanAction;return s?{anim:s.clip,progress:Math.min(1,s.time/s.duration),upper:marksmanMove(w)>0}:null;}

export function tickMarksman(w,dt){
 if(!isMarksman(w.classId))return;
 tickShots(w,dt);tickLobs(w,dt);tickZones(w);tickMines(w);tickFalcon(w,dt);rings(w);
 const p=w.player,s=w.marksmanAction;
 if(p.hp<=0||p.dead){w.marksmanAction=null;return;}
 if(!s||w.paused)return;
 // A esquiva cancela a ação; o que já foi lançado continua.
 if(w.dash.remaining>0){w.marksmanAction=null;p.timer=0;w.castCooldown=0;return;}
 const def=marksmanActions(w.classId)[s.index],before=s.time;s.time+=dt;
 if(def.kind==='leap'&&s.released){
  const [a,b]=def.advance,elapsed=Math.max(0,Math.min(b,s.time)-Math.max(a,before));
  if(elapsed){const f=elapsed/(b-a),pos=moveCircle(p,{x:-s.dx*def.distance*f,y:-s.dy*def.distance*f},p.radius,w.arena,{slide:false});p.walkDistance+=Math.hypot(pos.x-p.x,pos.y-p.y);p.x=pos.x;p.y=pos.y;}
 }
 if(!s.released&&s.time+1e-9>=def.release){s.released=true;release(w,s,def);}
 if(def.kind==='volley')while(s.fired<def.shots&&s.time+1e-9>=def.release+s.fired*def.gap){fire(w,def,s.dx,s.dy,{multiplier:1});s.fired++;}
 if(s.time+1e-9>=s.duration){w.marksmanAction=null;p.timer=0;w.castCooldown=0;if(def.kind==='leap')w.marksmanAmbush=w.time+AMBUSH.time;}
}

function release(w,s,def){
 const p=w.player;
 if(def.kind==='shot')return fire(w,def,s.dx,s.dy,{ambush:def.ambush});
 if(def.kind==='fan'){const bonus=ambush(w,def);for(let i=0;i<def.count;i++){const a=(i/(def.count-1)-.5)*def.spread,c=Math.cos(a),n=Math.sin(a);fire(w,def,s.dx*c-s.dy*n,s.dx*n+s.dy*c,{bonus,quiet:i>0});}return;}
 if(def.kind==='cone')return cone(w,s,def);
 if(def.kind==='blink')return blink(w,s,def);
 if(def.kind==='leap'){
  for(const e of w.actors){if(!living(e)||boss(w,e)||Math.hypot(e.x-p.x,e.y-p.y)>def.slowRadius+(e.radius||.3)||!lineClear(p,e,.05,w.arena))continue;e.slow=Math.max(e.slow||0,def.slow);e.slowTime=Math.max(e.slowTime||0,def.slowTime);}
  fx(w,'shockwave',{x:p.x,y:p.y,radius:def.slowRadius,color:'#c9e39a',duration:.4});w.combatEvents?.push({kind:'scytheWind'});return;
 }
 if(def.kind==='rain'){
  const t=s.target;w.marksmanZones.push({kind:'rain',x:t.x,y:t.y,radius:def.radius,next:w.time+def.delay,left:def.waves,interval:def.interval,damage:actionDamage(def,power(w),w.marksmanRanks),name:def.name,color:def.color,fx:def.fx,element:def.element,until:w.time+def.delay+def.interval*(def.waves-1)+.2});
  w.combatEvents?.push({kind:def.fx==='meteor'?'meteorCast':'bowShot'});return;
 }
 if(def.kind==='lob'){
  const from={x:p.x+s.dx*.4,y:p.y+s.dy*.4},t=s.target;
  w.marksmanLobs.push({id:w.nextId++,x:from.x,y:from.y,tx:t.x,ty:t.y,time:0,flight:def.flight,index:s.index});
  fx(w,'lob',{x:from.x,y:from.y,tx:t.x,ty:t.y,peak:2,color:def.fire?'#8a3a1a':'#2a2420',fuse:!def.fire,duration:def.flight,ground:false});
  w.combatEvents?.push({kind:'bombThrow'});return;
 }
 if(def.kind==='mine'){
  const mines=w.marksmanMines;mines.push({id:w.nextId++,x:p.x+s.dx*.5,y:p.y+s.dy*.5,armAt:w.time+def.arm,until:w.time+def.life});
  while(mines.length>def.max)mines.shift();
 }
}
// Bônus do Tiro de Emboscada: consumido pelo primeiro tiro elegível depois do Recuo.
function ambush(w,def){
 if(!def.ambush||!(w.marksmanAmbush>w.time))return 1;
 w.marksmanAmbush=0;return 1+(w.marksmanRanks?.ambush||0)*AMBUSH.perRank;
}
function fire(w,def,dx,dy,{ambush:use=false,bonus,quiet=false}={}){
 const p=w.player,start={x:p.x+dx*.55,y:p.y+dy*.55};
 // Disparo encostado numa parede não atravessa: começa no corpo do atirador.
 const from=lineClear(p,start,.05,w.arena)?start:{x:p.x,y:p.y},factor=bonus??(use?ambush(w,def):1);
 w.marksmanShots.push({id:w.nextId++,index:marksmanActions(w.classId).indexOf(def),x:from.x,y:from.y,dx,dy,remaining:def.range,speed:def.speed,damage:actionDamage(def,power(w),w.marksmanRanks)*factor,pierce:actionPierce(def,w.marksmanRanks),hits:new Set(),factor:1});
 if(!quiet){fx(w,'muzzle',{x:from.x,y:from.y,dx,dy,color:def.color,duration:.2});w.combatEvents?.push({kind:w.classId==='mercenary'?'crossbowShot':w.classId==='mage'?(def.element==='fire'?'fireIgnite':'arcaneBolt'):'bowShot'});}
}

// Segmento contra círculo: fração [0,1] do primeiro contato, ou null.
function sweep(x0,y0,x1,y1,cx,cy,r){
 const dx=x1-x0,dy=y1-y0,fx0=x0-cx,fy0=y0-cy,a=dx*dx+dy*dy,b=2*(fx0*dx+fy0*dy),c=fx0*fx0+fy0*fy0-r*r;
 if(c<=0)return 0;if(a<1e-12)return null;const disc=b*b-4*a*c;if(disc<0)return null;
 const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:null;
}
function push(w,e,dx,dy,distance){if(!distance||e.hp<=0||boss(w,e))return;const pos=moveCircle(e,{x:dx*distance,y:dy*distance},e.radius||.3,w.arena);e.x=pos.x;e.y=pos.y;}
function tickShots(w,dt){
 w.effects=w.effects.filter(f=>!f.marksmanShot);
 if(!w.marksmanShots?.length)return;
 const list=marksmanActions(w.classId),p=w.player;
 for(const s of w.marksmanShots){
  if(w.paused)break;
  const def=list[s.index]||list[0],travel=Math.min(s.remaining,s.speed*dt),end={x:s.x+s.dx*travel,y:s.y+s.dy*travel};
  const q=moveCircle({x:s.x,y:s.y},{x:end.x-s.x,y:end.y-s.y},.08,w.arena,{slide:false}),wall=q.blocked?(travel?q.distance/travel:0):Infinity;
  const hits=[];
  for(const e of w.actors){if(!living(e)||s.hits.has(e.id))continue;const k=sweep(s.x,s.y,end.x,end.y,e.x,e.y,(def.hit??def.radius+.3)+Math.max(0,(e.radius||.3)-.3));if(k!==null&&k<=wall)hits.push({k,e});}
  hits.sort((a,b)=>a.k-b.k);
  let stopped=wall!==Infinity;
  for(const {e} of hits){
   s.hits.add(e.id);
   // Bola de Fogo: o contato vira explosão em área (que inclui o alvo).
   if(def.explode){explodeShot(w,def,e.x,e.y);stopped=true;break;}
   dealDamage(w,e,Math.max(1,Math.round(s.damage*s.factor*bonusVs(w,e,def))),p,def.name);
   fx(w,'impact',{x:e.x,y:e.y,dx:s.dx,dy:s.dy,color:def.color,size:w.classId==='mercenary'?1.1:.8,mood:'pierce',duration:.3});
   push(w,e,s.dx,s.dy,def.knockback);
   if(s.pierce<=0){stopped=true;break;}
   s.pierce--;s.factor*=def.falloff??1;
  }
  if(stopped){if(wall!==Infinity&&s.hits.size===0){if(def.explode)explodeShot(w,def,q.x,q.y);else fx(w,'impact',{x:q.x,y:q.y,dx:s.dx,dy:s.dy,color:'#c9b48a',size:.5,mood:'pierce',duration:.25});}s.remaining=0;continue;}
  s.x=end.x;s.y=end.y;s.remaining-=travel;
  if(def.explode&&s.remaining<=1e-9)explodeShot(w,def,s.x,s.y);
 }
 w.marksmanShots=w.marksmanShots.filter(s=>s.remaining>1e-9);
 for(const s of w.marksmanShots){const def=list[s.index]||list[0];w.effects.push({id:'mshot-'+s.id,marksmanShot:true,fx:'projectile',shot:'arrow',ally:true,dx:s.dx,dy:s.dy,x:s.x,y:s.y,radius:def.radius,color:def.color,size:def.size,visual:true,time:0,duration:10});}
}
// Explosão: dano em área (paredes bloqueiam) e empurrão a partir do centro.
function explode(w,def,x,y){
 const p=w.player,r=blastRadius(def,w.marksmanRanks),damage=actionDamage(def,power(w),w.marksmanRanks),c={x,y};
 for(const e of w.actors){
  if(!living(e))continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);
  if(d>r+(e.radius||.3)||!lineClear(c,e,.05,w.arena))continue;
  dealDamage(w,e,Math.round(damage*bonusVs(w,e,def)),p,def.name);push(w,e,d>1e-6?dx/d:1,d>1e-6?dy/d:0,def.knockback);
 }
 fx(w,'groundBreak',{x,y,radius:r,color:def.color,shake:.15,duration:.55});
 fx(w,'impact',{x,y,h:.6,color:'#ffd27a',size:1.6,radius:r*.6,mood:'fire',duration:.4});
 w.combatEvents?.push({kind:'powderBlast'});
}
function tickLobs(w,dt){
 if(!w.marksmanLobs?.length)return;
 const list=marksmanActions(w.classId);
 for(const b of w.marksmanLobs){
  if(w.paused)break;b.time+=dt;if(b.time+1e-9<b.flight)continue;
  const def=list[b.index];b.done=true;
  if(def.fire){w.marksmanZones.push({kind:'fire',x:b.tx,y:b.ty,radius:def.radius,next:w.time,interval:def.interval,until:w.time+def.fireTime,damage:actionDamage(def,power(w),w.marksmanRanks),name:def.name,color:def.color,id:w.nextId++});fx(w,'impact',{x:b.tx,y:b.ty,h:.4,color:def.color,size:1.2,radius:1,mood:'fire',duration:.35});w.combatEvents?.push({kind:'fireIgnite'});}
  else explode(w,def,b.tx,b.ty);
 }
 w.marksmanLobs=w.marksmanLobs.filter(b=>!b.done);
}
// Chuva de Flechas e chão em chamas: ondas em intervalos fixos sobre quem estiver dentro.
function tickZones(w){
 w.effects=w.effects.filter(f=>!f.marksmanFire);
 if(!w.marksmanZones?.length)return;
 const p=w.player;
 for(const z of w.marksmanZones){
  while(z.next<=w.time+1e-9&&z.next<=z.until+1e-9&&(z.kind!=='rain'||z.left>0)){
   z.next+=z.interval;if(z.kind==='rain')z.left--;
   for(const e of w.actors){if(!living(e)||Math.hypot(e.x-z.x,e.y-z.y)>z.radius+(e.radius||.3))continue;dealDamage(w,e,Math.round(z.damage*(z.kind==='rain'||z.element?bonusVs(w,e,z):1)),p,z.name);}
   if(z.fx==='meteor'){fx(w,'groundBreak',{x:z.x,y:z.y,radius:z.radius,color:z.color,shake:.35,duration:.8});fx(w,'impact',{x:z.x,y:z.y,h:1.2,color:'#ffcf7a',size:2.2,radius:z.radius*.7,mood:'fire',duration:.5});w.combatEvents?.push({kind:'meteorImpact'});}
   else if(z.kind==='rain')fx(w,'arrowRain',{x:z.x,y:z.y,radius:z.radius,count:9,fall:.3,color:z.color,duration:.8});
  }
  if(z.kind==='fire')w.effects.push({id:'mfire-'+z.id,marksmanFire:true,fx:'fireField',x:z.x,y:z.y,radius:z.radius,remaining:z.until-w.time,color:z.color,visual:true,ground:true,time:0,duration:10});
 }
 w.marksmanZones=w.marksmanZones.filter(z=>z.kind==='rain'?z.left>0:w.time<z.until);
}
function tickMines(w){
 if(!w.marksmanMines?.length)return;
 const def=marksmanActions(w.classId).find(a=>a.kind==='mine');if(!def){w.marksmanMines=[];return;}
 for(const m of w.marksmanMines){
  if(w.time>=m.until){m.done=true;continue;}
  if(w.time+1e-9<m.armAt)continue;
  if(!m.armed){m.armed=true;w.combatEvents?.push({kind:'mineArm'});}
  if(w.actors.some(e=>living(e)&&Math.hypot(e.x-m.x,e.y-m.y)<=def.trigger+(e.radius||.3))){m.done=true;explode(w,def,m.x,m.y);}
 }
 w.marksmanMines=w.marksmanMines.filter(m=>!m.done);
}
// Marcas no chão ligadas à posição real: queda da bomba, área da chuva e minas (desarmada / armada).
function rings(w){
 w.effects=w.effects.filter(f=>!f.marksmanRing);
 const list=marksmanActions(w.classId),ring=(id,x,y,radius,color,time=0)=>w.effects.push({id,marksmanRing:true,x,y,radius,color,visual:true,ground:true,fixedRadius:true,time,duration:10});
 for(const b of w.marksmanLobs||[]){const def=list[b.index];ring('mlob-'+b.id,b.tx,b.ty,def.fire?def.radius:blastRadius(def,w.marksmanRanks),def.color,3*(1-b.time/b.flight));}
 for(const z of w.marksmanZones||[])if(z.kind==='rain')ring('mrain-'+z.x.toFixed(2)+z.y.toFixed(2),z.x,z.y,z.radius,z.color,2);
 for(const e of w.actors)if(living(e)&&e.frostUntil>w.time)ring('mfrost-'+e.id,e.x,e.y,(e.radius||.3)+.35,'#9fe0ff',2);
 for(const e of w.actors)if(living(e)&&e.falconMark>w.time)ring('mmark-'+e.id,e.x,e.y,(e.radius||.3)+.4,'#f2d17a',1);
 const mine=list.find(a=>a.kind==='mine');
 for(const m of w.marksmanMines||[]){const armed=w.time>=m.armAt;ring('mmine-'+m.id,m.x,m.y,.45,armed?'#ff7a2a':'#c9a87a',armed?0:4);if(armed&&mine)ring('mtrig-'+m.id,m.x,m.y,mine.trigger,'#ffb35a',8);}
}

// Falcão da Arqueira. É um ator neutro sem vida própria: nada o atinge e ele não bloqueia ninguém.
// A altura (jumpZ) e a órbita são só visuais; o dano acontece quando o mergulho chega ao alvo.
const markFactor=(w,e)=>e?.falconMark>w.time?1+FALCON.mark.bonus:1;
export const falconCooldown=w=>Math.max(0,(w.falconReady||0)-w.time);
function removeFalcon(w){if(w.falcon&&w.actors)w.actors=w.actors.filter(a=>a!==w.falcon);w.falcon=null;w.falconReady=0;}
function dive(w,a,target,command){w.combatEvents?.push({kind:'falconDive'});a.state='dive';a.target=target;a.command=command;a.from=a.jumpZ;a.span=Math.max(.5,Math.hypot(target.x-a.x,target.y-a.y));a.animation='dive';a.animationTime=0;a.actionId++;}
function fly(a,x,y,step){const dx=x-a.x,dy=y-a.y,d=Math.hypot(dx,dy);if(d<1e-6)return 0;const k=Math.min(1,step/d);a.x+=dx*k;a.y+=dy*k;a.angle=Math.atan2(dx,dy);return d-step;}
// F: manda o falcão ao inimigo mais perto da mira. Sem alvo válido não gasta foco nem inicia a recarga.
export function falconCommand(w,aim=w.aim){
 const p=w.player,a=w.falcon,C=FALCON.command;
 if(w.classId!=='archer'||!a||w.paused||p.hp<=0||p.dead||p.mp<C.cost||falconCooldown(w)>1e-9)return false;
 let best=null,near=C.pick;
 for(const e of w.actors){if(!living(e)||Math.hypot(e.x-p.x,e.y-p.y)>C.range+(e.radius||.3))continue;const d=Math.hypot(e.x-aim.x,e.y-aim.y)-(e.radius||.3);if(d<=near){near=d;best=e;}}
 if(!best)return false;
 p.mp-=C.cost;w.falconReady=w.time+C.cooldown*(1-Math.min(50,Math.max(0,w.modifiers?.gearCooldown||0))/100);
 dive(w,a,best,true);w.combatEvents?.push({kind:'falconCry'});fx(w,'shockwave',{x:best.x,y:best.y,radius:1,color:'#f2d17a',duration:.35});
 return true;
}
function tickFalcon(w,dt){
 const p=w.player,learned=w.classId==='archer'&&(w.marksmanRanks?.falcon||0)>0&&p.hp>0&&!p.dead;
 if(!learned){if(w.falcon)removeFalcon(w);return;}
 let a=w.falcon;
 if(!a||!w.actors.includes(a)){
  a=w.falcon={id:w.nextId++,model:'falcon',team:'neutral',dummy:true,falcon:true,x:p.x,y:p.y-FALCON.orbit,radius:.2,hp:1,maxHp:1,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,phase:0,jumpZ:FALCON.height,state:'orbit',orbit:0,next:w.time+1};
  w.actors.push(a);
 }
 if(w.paused)return;
 a.orbit+=dt*1.6;
 if(a.state==='dive'){
  const t=a.target;
  if(!t||!living(t)){a.state='return';a.animation='idle';a.actionId++;return;}
  const left=fly(a,t.x,t.y,FALCON.speed*1.4*dt);
  a.jumpZ=FALCON.strikeHeight+(a.from-FALCON.strikeHeight)*Math.max(0,Math.min(1,left/a.span));
  if(left<=.3){
   dealDamage(w,t,falconDamage(power(w),w.marksmanRanks,a.command),p,'Falcão');
   fx(w,'impact',{x:t.x,y:t.y,h:1,color:'#f2d17a',size:.9,mood:'claw',duration:.3});
   if(a.command)t.falconMark=w.time+FALCON.mark.time;
   a.state='return';a.animation='idle';a.actionId++;a.next=w.time+FALCON.interval;
  }
  return;
 }
 const gx=p.x+Math.cos(a.orbit)*FALCON.orbit,gy=p.y+Math.sin(a.orbit)*FALCON.orbit,left=fly(a,gx,gy,FALCON.speed*dt);
 a.jumpZ+=(FALCON.height-a.jumpZ)*Math.min(1,dt*4);
 if(a.state==='return'&&left<.6)a.state='orbit';
 if(a.state!=='orbit'||w.time<a.next)return;
 let best=null,near=FALCON.range;
 for(const e of w.actors){if(!living(e))continue;const d=Math.hypot(e.x-p.x,e.y-p.y)-(e.radius||.3);if(d<=near&&lineClear(p,e,.05,w.arena)){near=d;best=e;}}
 if(best)dive(w,a,best,false);else a.next=w.time+.25;
}

// Mago. Bola de Fogo: explosão no ponto de contato; com Combustão, o chão fica em chamas.
function explodeShot(w,def,x,y){
 explode(w,{...def,radius:def.explode,blast:false,knockback:0},x,y);
 const rank=w.marksmanRanks?.combustion||0,C=MAGE.combustion;
 if(rank>0)w.marksmanZones.push({kind:'fire',id:w.nextId++,x,y,radius:C.radius,next:w.time+C.interval,interval:C.interval,until:w.time+C.time*rank,damage:Math.max(1,Math.floor(power(w)*C.multiplier)),name:'Combustão',color:'#ff7a2a',element:'fire'});
}
// Rajada de Gelo: cone instantâneo que fere e desacelera; paredes bloqueiam. Chefes recebem dano, mas não ficam lentos.
function cone(w,s,def){
 const p=w.player,damage=actionDamage(def,power(w),w.marksmanRanks);
 for(const e of w.actors){
  if(!living(e))continue;const x=e.x-p.x,y=e.y-p.y,n=Math.hypot(x,y);
  if(n>def.range+(e.radius||.3)||n>1e-6&&(x*s.dx+y*s.dy)/n<Math.cos(def.arc/2)||!lineClear(p,e,.05,w.arena))continue;
  dealDamage(w,e,Math.round(damage*bonusVs(w,e,def)),p,def.name);
  if(!boss(w,e)){e.slow=Math.max(e.slow||0,def.slow);e.slowTime=Math.max(e.slowTime||0,def.slowTime);e.frostUntil=w.time+def.slowTime;}
 }
 w.effects.push({id:w.nextId++,kind:'slash',fx:'slash',x:p.x,y:p.y,dx:s.dx,dy:s.dy,radius:def.range,arc:def.arc,sparks:10,time:0,duration:.35,color:def.color,mood:'blade',visual:true});
 fx(w,'shockwave',{x:p.x+s.dx*2,y:p.y+s.dy*2,radius:2.5,color:def.color,duration:.4});
 w.combatEvents?.push({kind:'frostBlast'});
}
// Teleporte: salta na direção da mira até a distância da regra, parando em paredes; o eco fere quem ficou no ponto de partida.
function blink(w,s,def){
 const p=w.player,from={x:p.x,y:p.y},reach=Math.min(def.distance,s.aim||def.distance);
 const pos=moveCircle(p,{x:s.dx*reach,y:s.dy*reach},p.radius,w.arena,{slide:false});p.x=pos.x;p.y=pos.y;
 const damage=actionDamage(def,power(w),w.marksmanRanks);
 for(const e of w.actors){if(!living(e)||Math.hypot(e.x-from.x,e.y-from.y)>def.radius+(e.radius||.3)||!lineClear(from,e,.05,w.arena))continue;dealDamage(w,e,Math.round(damage*bonusVs(w,e,def)),p,'Eco Arcano');}
 fx(w,'summonBurst',{x:from.x,y:from.y,radius:def.radius,color:def.color,duration:.5});
 fx(w,'summonBurst',{x:p.x,y:p.y,radius:1,color:def.color,duration:.4});
 w.combatEvents?.push({kind:'blink'});
}
