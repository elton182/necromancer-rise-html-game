import {schoolSynergy} from './skill-synergy.mjs';
// Arqueira e Mercenário em combate: tiros com projétil real (alguns teleguiados), Recuo, Chuva de Flechas,
// ataques do falcão, bombas e redes em arco, minas, armadilhas e chão em chamas. Unidades de mundo, segundos, atualização por dt.
// O renderizador lê w.marksmanAction (pose) e os efeitos `fx`; todo dano passa por dealDamage.
import {dealDamage} from './combat.mjs';
import {moveCircle,lineClear,resolvePosition} from './terrain.mjs';
import {fx} from './vfx-events.mjs';
import {isMarksman,isMartial} from './class-registry.mjs';
import {marksmanActions,marksmanLearned,actionCooldown,actionDamage,actionPierce,blastRadius,rainRadius,AMBUSH,FALCON,falconDamage,MAGE,rankFactor,combustionTime,actionTime,imbueBonus,showerCount,cloneCopy,cooldownKey,summonDamageFactor} from './marksman-model.mjs';
import {COMPANIONS,spawnCompanion,companionsOf} from './companions.mjs';

const living=e=>e.team==='enemy'&&e.hp>0&&!e.dead;
const boss=(w,e)=>e===w.boss||e.isBoss;
// Dano-base: físico para as classes marciais, mágico para o Mago. Enquanto o Clone Arcano repete um feitiço,
// w.marksmanMirror reduz o dano-base à fração copiada.
const power=w=>(isMartial(w.classId)?(w.player.damage||0):(w.player.spellDamage||0))*(w.marksmanMirror||1);
const roll=w=>(w.random||Math.random)();
// Bônus contra o alvo: marca do falcão (flechas) e Estilhaçar (fogo e arcano em alvos lentos pelo gelo).
function bonusVs(w,e,def){let k=markFactor(w,e);if(w.classId==='mage'&&e?.frostUntil>w.time&&(def?.element==='fire'||def?.element==='arcane'))k*=1+(w.marksmanRanks?.shatter||0)*MAGE.shatter;return k;}
export const marksmanShot=w=>marksmanActions(w.classId)[0];

export function initializeMarksman(w,character){
 Object.assign(w,{marksmanRanks:character?.marksmanRanks||{},marksmanShield:null,marksmanFeathersReady:0,marksmanAction:null,marksmanShots:[],marksmanCooldowns:{},marksmanLobs:[],marksmanZones:[],marksmanMines:[],marksmanTraps:[],marksmanOrbs:[],marksmanFamiliar:null,marksmanImbue:null,marksmanMirror:0,marksmanAmbush:0,marksmanDoubleAmbush:false,falcon:null,falconReady:0});
}
// Morte, troca de cena e reinício: nada do que o atirador lançou continua no mundo.
export function clearMarksman(w){
 w.marksmanShield=null;w.marksmanFeathersReady=0;
 Object.assign(w,{marksmanAction:null,marksmanShots:[],marksmanLobs:[],marksmanZones:[],marksmanMines:[],marksmanTraps:[],marksmanOrbs:[],marksmanFamiliar:null,marksmanImbue:null,marksmanMirror:0,marksmanAmbush:0});
 for(const e of w.actors||[])if(e.burnUntil)e.burnUntil=0;
 for(const e of w.actors||[]){e.hunterMark=0;e.hunterMarkBonus=0;e.falconMark=0;}
 w.marksmanDoubleAmbush=false;
 removeFalcon(w);
 if(w.effects)w.effects=w.effects.filter(f=>!f.marksmanShot&&!f.marksmanRing&&!f.marksmanFire&&!f.marksmanBurst);
 if(w.player&&isMarksman(w.classId))w.player.timer=0;
}
// Recarga restante da ação; as variantes (Nova, Chuva de Fogo) dividem a da ação de origem.
export const marksmanCooldown=(w,id=marksmanShot(w).id)=>Math.max(0,(w.marksmanCooldowns?.[cooldownKey(marksmanActions(w.classId).find(a=>a.id===id))||id]||0)-w.time);

// Inicia a ação do slot na direção da mira. Direção e ponto-alvo ficam fixos durante a ação.
export function marksmanAction(w,index=0,aim=w.aim){
 const p=w.player,list=marksmanActions(w.classId),def=list[index];
 if(!isMarksman(w.classId)||!def||def.kind==='dodge'||w.paused||p.hp<=0||p.dead||w.dash.remaining>0||w.marksmanAction||p.rootTime>0)return false;
 if(!marksmanLearned(w.classId,index,w.marksmanRanks)||marksmanCooldown(w,def.id)>1e-9||p.mp<def.cost)return false;
 if(['falconStrike','falconRush'].includes(def.kind)&&(!w.falcon||['strike','rush'].includes(w.falcon.state)))return false;
 const dx=aim.x-p.x,dy=aim.y-p.y,d=Math.hypot(dx,dy);
 if(!Number.isFinite(d)||d<1e-9)return false;
 const ux=dx/d,uy=dy/d,reach=def.range?Math.max(def.minRange||0,Math.min(def.range,d)):0;
 p.mp-=def.cost;
 // Canalizado: a recarga de verdade começa ao soltar (stopMarksmanChannel); até lá fica reservada.
 w.marksmanCooldowns[cooldownKey(def)]=w.time+actionCooldown(def,w.marksmanRanks,w.modifiers?.gearCooldown)+(def.kind==='beam'?def.duration:0);
 const target=reach?resolvePosition({x:p.x+ux*reach,y:p.y+uy*reach},.1,w.arena):null;
 // Saraivada Seguidora: trava no inimigo mais perto da mira no início da ação.
 const lock=def.lock?lockTarget(w,aim,def.lock):null;
 const locks=def.targets?w.actors.filter(e=>living(e)&&Math.hypot(e.x-p.x,e.y-p.y)<=def.lock.range&&Math.hypot(e.x-aim.x,e.y-aim.y)<=def.lock.pick&&lineClear(p,e,.05,w.arena)).sort((a,b)=>Math.hypot(a.x-aim.x,a.y-aim.y)-Math.hypot(b.x-aim.x,b.y-aim.y)).slice(0,def.targets).map(e=>e.id):null;
 if(locks&&!locks.length){p.mp+=def.cost;delete w.marksmanCooldowns[cooldownKey(def)];return false;}
 w.marksmanAction={index,id:def.id,clip:def.clip,time:0,released:false,fired:0,duration:def.duration,dx:ux,dy:uy,target,aim:d,origin:{x:p.x,y:p.y},lock};
 if(locks){w.marksmanAction.locks=locks;w.marksmanAction.assigned=new Set(locks);}
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
 if(!isMarksman(w.classId)||w.paused)return;
 if(w.player.hp<=0||w.player.dead){clearMarksman(w);return;}
 if(w.marksmanShield&&w.time>=w.marksmanShield.until)w.marksmanShield=null;
 tickShots(w,dt);tickOrbs(w,dt);tickFamiliar(w,dt);tickLobs(w,dt);tickZones(w);tickBurns(w);tickMines(w);tickTraps(w);tickFalcon(w,dt);rings(w);
 const p=w.player,s=w.marksmanAction;
 if(p.hp<=0||p.dead){if(s&&marksmanActions(w.classId)[s.index]?.kind==='beam')stopMarksmanChannel(w);w.marksmanAction=null;return;}
 if(!s||w.paused)return;
 // A esquiva cancela a ação; o que já foi lançado continua. O Raio Arcano encerra e entra em recarga.
 if(w.dash.remaining>0){if(marksmanActions(w.classId)[s.index]?.kind==='beam')stopMarksmanChannel(w);w.marksmanAction=null;p.timer=0;w.castCooldown=0;return;}
 const def=marksmanActions(w.classId)[s.index],before=s.time;s.time+=dt;
 if(def.kind==='beam'&&s.released&&!channelBeam(w,s,def,dt))return;
 if(def.kind==='leap'&&s.released){
  const [a,b]=def.advance,elapsed=Math.max(0,Math.min(b,s.time)-Math.max(a,before));
  if(elapsed){const f=elapsed/(b-a),pos=moveCircle(p,{x:-s.dx*def.distance*f,y:-s.dy*def.distance*f},p.radius,w.arena,{slide:false});p.walkDistance+=Math.hypot(pos.x-p.x,pos.y-p.y);p.x=pos.x;p.y=pos.y;}
 }
 if(!s.released&&s.time+1e-9>=def.release){s.released=true;release(w,s,def);mirror(w,s,def);}
 if(def.kind==='volley')while(s.fired<def.shots&&s.time+1e-9>=def.release+s.fired*def.gap){
  if(s.locks)for(let i=0;i<s.locks.length;i++){
   let e=w.actors.find(e=>e.id===s.locks[i]&&living(e));
   if(!e){e=w.actors.find(e=>living(e)&&!s.assigned.has(e.id)&&Math.hypot(e.x-p.x,e.y-p.y)<=def.lock.range&&lineClear(p,e,.05,w.arena));if(e){s.locks[i]=e.id;s.assigned.add(e.id);}}
   if(e){const d=Math.hypot(e.x-p.x,e.y-p.y)||1;fire(w,def,(e.x-p.x)/d,(e.y-p.y)/d,{target:e.id,quiet:i>0||s.fired>0,seek:false});}
  }else fire(w,def,s.dx,s.dy,{target:s.lock,quiet:s.fired>0&&!!def.lock});
  s.fired++;
 }
 if(s.time+1e-9>=s.duration){if(def.kind==='beam'){stopMarksmanChannel(w);return;}w.marksmanAction=null;p.timer=0;w.castCooldown=0;if(def.kind==='leap')w.marksmanAmbush=w.time+AMBUSH.time;}
}
// Solta o Raio Arcano (tecla solta, mana no fim, esquiva, morte ou tempo máximo): a recarga começa agora.
export function stopMarksmanChannel(w){
 const s=w.marksmanAction,def=s&&marksmanActions(w.classId)[s.index];if(def?.kind!=='beam')return false;
 w.marksmanAction=null;w.player.timer=0;w.castCooldown=0;
 w.marksmanCooldowns[cooldownKey(def)]=w.time+actionCooldown(def,w.marksmanRanks,w.modifiers?.gearCooldown);
 w.effects=w.effects.filter(f=>!f.marksmanBeam);return true;
}
// Raio Arcano em curso: gasta mana por segundo, acompanha a mira e fere a cada `tick` s quem estiver na linha
// (atravessa inimigos, para em paredes). Devolve false quando o raio acabou.
function channelBeam(w,s,def,dt){
 const p=w.player;p.mp-=def.drain*dt;
 if(p.mp<=0){p.mp=0;stopMarksmanChannel(w);return false;}
 const aim=w.aim,ax=aim?aim.x-p.x:s.dx,ay=aim?aim.y-p.y:s.dy,d=Math.hypot(ax,ay);
 if(d>1e-6){s.dx=ax/d;s.dy=ay/d;p.angle=Math.atan2(s.dx,s.dy);}
 const from={x:p.x+s.dx*.5,y:p.y+s.dy*.5},q=moveCircle(from,{x:s.dx*def.range,y:s.dy*def.range},.08,w.arena,{slide:false}),end={x:q.x,y:q.y};
 s.beamEnd=end;
 if(w.time+1e-9>=(s.nextTick??0)){
  s.nextTick=w.time+def.tick;const damage=actionDamage(def,power(w),w.marksmanRanks);
  for(const e of w.actors){if(!living(e))continue;if(sweep(from.x,from.y,end.x,end.y,e.x,e.y,def.width+(e.radius||.3))===null)continue;dealDamage(w,e,Math.max(1,Math.round(damage*bonusVs(w,e,def))),p,def.name);if(roll(w)<.5)fx(w,'impact',{x:e.x,y:e.y,dx:s.dx,dy:s.dy,color:def.color,size:.6,mood:'magic',duration:.2});}
  w.combatEvents?.push({kind:'arcaneBolt'});
 }
 // Traço contínuo: um raio novo a cada 0,07 s, cada um durando mais que o intervalo, e brilho no ponto final.
 if(w.time+1e-9>=(s.nextFx??0)){s.nextFx=w.time+.07;fx(w,'lightning',{x:from.x,y:from.y,tx:end.x,ty:end.y,h0:1.25,h1:1.1,width:2.4,color:def.color,ground:false,duration:.18});fx(w,'impact',{x:end.x,y:end.y,h:1.1,color:def.color,size:.7,mood:'magic',duration:.15});}
 return true;
}
// Clone Arcano: repete da própria posição o feitiço que o Mago acabou de liberar, mirando o mesmo ponto,
// com a fração copiada do dano. Não repete Teleporte, Imbuir, Raio Arcano nem evocações.
const NO_MIRROR=new Set(['blink','imbue','beam','clone','summon','familiar','dodge','manaShield']);
function mirror(w,s,def){
 if(w.classId!=='mage'||s.mirror||NO_MIRROR.has(def.kind))return;
 const c=companionsOf(w,'arcaneClone').find(a=>a.hp>0);if(!c)return;
 const p=w.player,save={x:p.x,y:p.y,angle:p.angle},aim=w.aim||{x:p.x+s.dx*8,y:p.y+s.dy*8},cdef=marksmanActions('mage').find(a=>a.kind==='clone');
 let dx=aim.x-c.x,dy=aim.y-c.y,d=Math.hypot(dx,dy);if(d<1e-6){dx=s.dx;dy=s.dy;d=1;}else{dx/=d;dy/=d;}
 const reach=def.range?Math.max(def.minRange||0,Math.min(def.range,d)):0,target=reach?resolvePosition({x:c.x+dx*reach,y:c.y+dy*reach},.1,w.arena):null;
 p.x=c.x;p.y=c.y;w.marksmanMirror=cloneCopy(cdef,w.marksmanRanks);
 try{release(w,{...s,dx,dy,target,aim:d,mirror:true},def);}finally{p.x=save.x;p.y=save.y;p.angle=save.angle;w.marksmanMirror=0;}
 c.angle=Math.atan2(dx,dy);c.animation=def.clip;c.animationTime=0;c.actionId++;
}
// Queimadura (Muralha de Fogo, Imbuir Fogo): dano a cada intervalo; uma nova renova a duração, sem acumular.
function burn(w,e,damage,spec){
 if(!living(e))return;
 const active=e.burnUntil>w.time;
 e.burnDamage=Math.max(active?e.burnDamage||0:0,Math.max(1,Math.floor(damage)));e.burnInterval=spec.interval;e.burnUntil=Math.max(active?e.burnUntil:0,w.time+spec.time);
 if(!active)e.burnNext=w.time+spec.interval;
}
function tickBurns(w){
 if(w.paused)return;
 for(const e of w.actors){
  if(!e.burnUntil||!living(e))continue;
  while(e.burnNext<=w.time+1e-9&&e.burnNext<=e.burnUntil+1e-9&&living(e)){e.burnNext+=e.burnInterval;dealDamage(w,e,Math.max(1,Math.round(e.burnDamage*bonusVs(w,e,{element:'fire'}))),w.player,'Queimadura');}
  if(w.time>=e.burnUntil){e.burnUntil=0;e.burnDamage=0;e.burnNext=0;}
 }
}
// Lentidão do gelo do Mago: conta para o Estilhaçar; chefes recebem o dano, mas não ficam lentos.
function chill(w,e,slow,time){if(!living(e)||boss(w,e))return;e.slow=Math.max(e.slow||0,slow);e.slowTime=Math.max(e.slowTime||0,time);e.frostUntil=Math.max(e.frostUntil||0,w.time+time);}

function release(w,s,def){
 const p=w.player;
 if(def.kind==='manaShield'){w.marksmanShield={until:w.time+def.time};fx(w,'summonBurst',{x:p.x,y:p.y,radius:1,color:def.color,duration:.5});return;}
 if(def.kind==='shot')return fire(w,def,s.dx,s.dy,{ambush:def.ambush});
 if(def.kind==='fan'){const bonus=ambush(w,def);for(let i=0;i<def.count;i++){const a=(i/(def.count-1)-.5)*def.spread,c=Math.cos(a),n=Math.sin(a);fire(w,def,s.dx*c-s.dy*n,s.dx*n+s.dy*c,{bonus,quiet:i>0});}return;}
 if(def.kind==='cone')return cone(w,s,def);
 if(def.kind==='blink')return blink(w,s,def);
 if(def.kind==='leap'){
  for(const e of w.actors){if(!living(e)||boss(w,e)||Math.hypot(e.x-p.x,e.y-p.y)>def.slowRadius+(e.radius||.3)||!lineClear(p,e,.05,w.arena))continue;e.slow=Math.max(e.slow||0,def.slow);e.slowTime=Math.max(e.slowTime||0,def.slowTime);}
  fx(w,'shockwave',{x:p.x,y:p.y,radius:def.slowRadius,color:'#c9e39a',duration:.4});w.combatEvents?.push({kind:'scytheWind'});return;
 }
 if(def.kind==='rain'){
  const t=s.target;w.marksmanZones.push({kind:'rain',id:w.nextId++,x:t.x,y:t.y,radius:rainRadius(def,w.marksmanRanks),next:w.time+def.delay,left:def.waves,interval:def.interval,damage:actionDamage(def,power(w),w.marksmanRanks),name:def.name,color:def.color,fx:def.fx,element:def.element,explosiveRain:def.explosiveRain,until:w.time+def.delay+def.interval*(def.waves-1)+.2,burn:def.burn?{...def.burn,damage:Math.max(1,Math.floor(power(w)*def.burn.multiplier*rankFactor(def,w.marksmanRanks)))}:null});
  // Meteoro: a bola de fogo cai do céu, vinda de trás do Mago, e chega no instante do dano.
  if(def.fx==='meteor')fx(w,'meteor',{x:t.x,y:t.y,dx:s.dx,dy:s.dy,radius:def.radius,color:def.color,ground:false,duration:def.delay});
  w.combatEvents?.push({kind:def.fx==='meteor'?'meteorCast':'bowShot'});return;
 }
 if(def.kind==='lob'){
  const from={x:p.x+s.dx*.4,y:p.y+s.dy*.4},t=s.target;
  w.marksmanLobs.push({id:w.nextId++,x:from.x,y:from.y,tx:t.x,ty:t.y,time:0,flight:def.flight,index:s.index});
  fx(w,'lob',{x:from.x,y:from.y,tx:t.x,ty:t.y,peak:2,color:def.fire?'#8a3a1a':def.net?def.color:'#2a2420',fuse:!def.fire&&!def.net,duration:def.flight,ground:false});
  w.combatEvents?.push({kind:'bombThrow'});return;
 }
 // Impacto Celeste: a área fica marcada e o falcão desce até ela; o dano vem no fim do atraso.
 if(def.kind==='falconStrike'){
  const t=s.target;w.marksmanZones.push({kind:'strike',id:w.nextId++,x:t.x,y:t.y,radius:def.radius,at:w.time+def.delay,delay:def.delay,damage:actionDamage(def,power(w),w.marksmanRanks),name:def.name,color:def.color,knockback:def.knockback});
  const a=w.falcon;if(a){a.state='strike';a.target=null;a.strike={x:t.x,y:t.y,at:w.time+def.delay};a.from=a.jumpZ;a.span=Math.max(.5,Math.hypot(t.x-a.x,t.y-a.y));a.animation='dive';a.animationTime=0;a.actionId++;}
  w.combatEvents?.push({kind:'falconCry'});return;
 }
 if(def.kind==='falconRush'){
  if(!w.falcon||['strike','rush'].includes(w.falcon.state))return;
  const a=w.falcon;a.state='rush';a.target=null;a.animation='dive';a.animationTime=0;a.actionId++;
  a.rush={center:s.target,def,next:w.time+def.gap,left:def.count,visited:new Set(),from:{x:a.x,y:a.y},start:w.time};
  w.combatEvents?.push({kind:'falconCry'});return;
 }
 // Penas Voadoras: uma pena por inimigo próximo da Arqueira, saindo do falcão; as que sobram seguem a mira.
 if(def.kind==='feathers'){
  const origin=w.falcon?{x:w.falcon.x,y:w.falcon.y}:{x:p.x,y:p.y},near=e=>Math.hypot(e.x-p.x,e.y-p.y);
  const targets=w.actors.filter(e=>living(e)&&near(e)<=def.pick+(e.radius||.3)&&lineClear(p,e,.05,w.arena)).sort((a,b)=>near(a)-near(b)).slice(0,def.count),spare=def.count-targets.length;
  for(let i=0;i<def.count;i++){
   const e=targets[i];let dx,dy;
   if(e){const x=e.x-origin.x,y=e.y-origin.y,d=Math.hypot(x,y)||1;dx=x/d;dy=y/d;}
   else{const j=i-targets.length,a=(spare>1?j/(spare-1)-.5:0)*.6,c=Math.cos(a),n=Math.sin(a);dx=s.dx*c-s.dy*n;dy=s.dx*n+s.dy*c;}
   fire(w,def,dx,dy,{origin,target:e?.id??null,seek:!!e,quiet:i>0});
  }
  fx(w,'shockwave',{x:origin.x,y:origin.y,radius:1,color:def.color,duration:.3});w.combatEvents?.push({kind:'scytheWind'});return;
 }
 // Muralha de Fogo: segmento atravessado na mira, centrado no ponto mirado; o aviso no chão vem antes das chamas.
 if(def.kind==='wall'){
  const t=s.target||{x:p.x+s.dx*def.range,y:p.y+s.dy*def.range},ux=-s.dy,uy=s.dx,h=def.length/2;
  w.marksmanZones.push({kind:'wall',id:w.nextId++,x:t.x,y:t.y,ux,uy,half:h,width:def.width,armAt:w.time+def.arm,next:w.time+def.arm,interval:def.interval,until:w.time+def.arm+actionTime(def,w.marksmanRanks),
   damage:actionDamage(def,power(w),w.marksmanRanks),burn:{...def.burn,damage:power(w)*def.burn.multiplier*rankFactor(def,w.marksmanRanks)},name:def.name,color:def.color,element:def.element});
  fx(w,'dangerLine',{x:t.x-ux*h,y:t.y-uy*h,dx:ux,dy:uy,length:def.length,radius:def.width,color:def.color,harmless:true,progress:1,duration:def.arm});
  w.combatEvents?.push({kind:'fireIgnite'});return;
 }
 // Imbuir: a Seta Arcana ganha o elemento por um tempo; o novo imbuir substitui o anterior.
 if(def.kind==='imbue'){
  w.marksmanImbue={id:def.id,element:def.element,until:w.time+actionTime(def,w.marksmanRanks),bonus:imbueBonus(def,w.marksmanRanks),color:def.color,
   burn:def.burn?{...def.burn,damage:power(w)*def.burn.multiplier*(1+schoolSynergy(w.classId,w.marksmanRanks,def.node))}:null,slow:def.slow||0,slowTime:def.slowTime||0};
  fx(w,'summonBurst',{x:p.x,y:p.y,radius:1,color:def.color,duration:.45});w.combatEvents?.push({kind:def.element==='fire'?'fireIgnite':'frostBlast'});return;
 }
 if(def.kind==='nova')return nova(w,def);
 // Chuva de Fogo e Avalanche: quedas agendadas em pontos aleatórios da área (cada uma com a própria sombra).
 if(def.kind==='shower'){
  const t=s.target||{x:p.x,y:p.y},count=showerCount(def,w.marksmanRanks),gap=def.span?def.span/count:def.gap,R=Math.max(0,def.radius-def.drop*.5),drops=[];
  for(let i=0;i<count;i++){const r=R*Math.sqrt(roll(w)),a=roll(w)*Math.PI*2,at=resolvePosition({x:t.x+Math.cos(a)*r,y:t.y+Math.sin(a)*r},.1,w.arena);drops.push({x:at.x,y:at.y,at:w.time+def.fall+i*gap,shown:false,done:false});}
  w.marksmanZones.push({kind:'shower',id:w.nextId++,x:t.x,y:t.y,radius:def.radius,drop:def.drop,fall:def.fall,drops,dx:s.dx,dy:s.dy,damage:actionDamage(def,power(w),w.marksmanRanks),
   burn:def.burn?{...def.burn,damage:Math.max(1,Math.floor(power(w)*def.burn.multiplier*rankFactor(def,w.marksmanRanks)))}:null,slow:def.slow||0,slowTime:def.slowTime||0,snow:!!def.snow,name:def.name,color:def.color,element:def.element});
  w.combatEvents?.push({kind:def.snow?'frostBlast':'meteorCast'});return;
 }
 // Clone Arcano: aparece no ponto mirado (até o alcance), com uma fração da vida máxima do Mago.
 if(def.kind==='clone'){const t=s.target||{x:p.x+s.dx*2,y:p.y+s.dy*2},spec=COMPANIONS[def.companion];const c=spawnCompanion(w,def.companion,t,{hp:p.maxHp*spec.hp,damage:0});c.angle=p.angle;fx(w,'summonBurst',{x:p.x,y:p.y,radius:.8,color:def.color,duration:.4});w.combatEvents?.push({kind:'blink'});return;}
 // Esfera de Gelo: avança devagar e solta cristais. Familiar de Fogo: acompanha e atira. Golem: companheiro.
 if(def.kind==='orb'){w.marksmanOrbs.push({id:w.nextId++,x:p.x+s.dx*.6,y:p.y+s.dy*.6,dx:s.dx,dy:s.dy,left:def.range,hits:new Set(),next:w.time+def.shard.interval,index:s.index,damage:actionDamage(def,power(w),w.marksmanRanks),k:w.marksmanMirror||0});w.combatEvents?.push({kind:'frostBlast'});return;}
 if(def.kind==='familiar'){w.marksmanFamiliar={index:s.index,until:w.time+def.life,next:w.time+.6,angle:0,x:p.x,y:p.y};fx(w,'summonBurst',{x:p.x,y:p.y,radius:1.2,color:def.color,duration:.5});w.combatEvents?.push({kind:'fireIgnite'});return;}
 if(def.kind==='summon'){const spec=COMPANIONS[def.companion],k=def.node==='golemDeGelo'?1+Math.max(0,(w.marksmanRanks?.golemDeGelo||0)-1)*MAGE.golemPerRank:1,damageK=summonDamageFactor(def,w.marksmanRanks);spawnCompanion(w,def.companion,{x:p.x+s.dx*1.5,y:p.y+s.dy*1.5},{hp:p.maxHp*spec.hp*k,damage:power(w)*spec.damage*damageK});w.combatEvents?.push({kind:'frostBlast'});return;}
 // Armadilha de Urso: assentada aos pés, arma depois de um instante; as mais antigas saem acima do limite.
 if(def.kind==='trap'){const traps=w.marksmanTraps;traps.push({id:w.nextId++,x:p.x+s.dx*.5,y:p.y+s.dy*.5,armAt:w.time+def.arm,until:w.time+def.life,index:s.index});while(traps.length>def.max)traps.shift();return;}
 if(def.kind==='mine'){
  const mines=w.marksmanMines;mines.push({id:w.nextId++,x:p.x+s.dx*.5,y:p.y+s.dy*.5,armAt:w.time+def.arm,until:w.time+def.life});
  while(mines.length>def.max)mines.shift();
 }
}
// Bônus do Tiro de Emboscada: consumido pelo primeiro tiro elegível depois do Recuo.
function ambush(w,def){
 if(!def.ambush||!(w.marksmanAmbush>w.time))return 1;
 w.marksmanAmbush=0;w.marksmanDoubleAmbush=(w.marksmanRanks?.emboscadaEmDupla||0)>0?{}:false;return 1+(w.marksmanRanks?.ambush||0)*AMBUSH.perRank;
}
// Inimigo vivo mais perto do ponto mirado, dentro do alcance do atirador.
function lockTarget(w,aim,L){
 const p=w.player;let best=null,near=L.pick;
 for(const e of w.actors){if(!living(e)||Math.hypot(e.x-p.x,e.y-p.y)>L.range+(e.radius||.3))continue;const d=Math.hypot(e.x-aim.x,e.y-aim.y)-(e.radius||.3);if(d<=near){near=d;best=e;}}
 return best?.id??null;
}
function fire(w,def,dx,dy,{ambush:use=false,bonus,quiet=false,target=null,origin=null,seek=true}={}){
 const p=w.player,start={x:p.x+dx*.55,y:p.y+dy*.55};
 // Disparo encostado numa parede não atravessa: começa no corpo do atirador. Penas saem do falcão.
 const from=origin?{x:origin.x,y:origin.y}:lineClear(p,start,.05,w.arena)?start:{x:p.x,y:p.y},factor=bonus??(use?ambush(w,def):1);
 // Imbuir: a Seta Arcana leva o elemento (dano extra, cor e efeito ao acertar).
 const im=w.classId==='mage'&&def===marksmanActions('mage')[0]&&w.marksmanImbue?.until>w.time?w.marksmanImbue:null;
 w.marksmanShots.push({id:w.nextId++,def,index:marksmanActions(w.classId).indexOf(def),x:from.x,y:from.y,dx,dy,remaining:def.range,speed:def.speed,damage:actionDamage(def,power(w),w.marksmanRanks)*factor*(im?1+im.bonus:1),pierce:actionPierce(def,w.marksmanRanks),hits:new Set(),factor:1,target,seek,
  doubleAmbush:factor>1?w.marksmanDoubleAmbush:null,
  imbue:im&&{element:im.element,burn:im.burn&&{...im.burn,damage:im.burn.damage*(w.marksmanMirror||1)},slow:im.slow,slowTime:im.slowTime},color:im?.color,k:w.marksmanMirror||1});
 if(!quiet){fx(w,'muzzle',{x:from.x,y:from.y,dx,dy,color:im?.color||def.color,duration:.2});w.combatEvents?.push({kind:w.classId==='mercenary'?'crossbowShot':w.classId==='mage'?(def.element==='fire'||im?.element==='fire'?'fireIgnite':'arcaneBolt'):'bowShot'});}
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
  const def=s.def||list[s.index]||list[0];if(def.homing)steer(w,s,def,dt);
  const travel=Math.min(s.remaining,s.speed*dt),end={x:s.x+s.dx*travel,y:s.y+s.dy*travel};
  const q=moveCircle({x:s.x,y:s.y},{x:end.x-s.x,y:end.y-s.y},.08,w.arena,{slide:false}),wall=q.blocked?(travel?q.distance/travel:0):Infinity;
  const hits=[];
  for(const e of w.actors){if(!living(e)||s.hits.has(e.id)||(def.targets&&e.id!==s.target))continue;const k=sweep(s.x,s.y,end.x,end.y,e.x,e.y,(def.hit??def.radius+.3)+Math.max(0,(e.radius||.3)-.3));if(k!==null&&k<=wall)hits.push({k,e});}
  hits.sort((a,b)=>a.k-b.k);
  let stopped=wall!==Infinity;
  for(const {e} of hits){
   s.hits.add(e.id);
   // Bola de Fogo: o contato vira explosão em área (que inclui o alvo).
   if(def.explode){explodeShot(w,def,e.x,e.y,s.k);stopped=true;break;}
   dealDamage(w,e,Math.max(1,Math.round(s.damage*s.factor*bonusVs(w,e,def))),p,def.name);
   if(s.doubleAmbush&&s.doubleAmbush===w.marksmanDoubleAmbush){
    w.marksmanDoubleAmbush=false;
    const d=marksmanActions('archer').find(d=>d.id==='impactoCeleste');
    if(w.falcon&&!['strike','rush'].includes(w.falcon.state)&&!['falconStrike','falconRush'].includes(list[w.marksmanAction?.index]?.kind))release(w,{target:{x:e.x,y:e.y}},{...d,multiplier:d.multiplier*(1+.1*Math.max(0,w.marksmanRanks.emboscadaEmDupla-1))});
   }
   if(s.imbue?.burn)burn(w,e,s.imbue.burn.damage,s.imbue.burn);
   if(s.imbue?.slow)chill(w,e,s.imbue.slow,s.imbue.slowTime);
   if(def.burn)burn(w,e,power(w)*def.burn.multiplier*s.k*rankFactor(def,w.marksmanRanks),def.burn);
   // Cristais da Esfera de Gelo: lentidão curta que também conta para o Estilhaçar; chefes não ficam lentos.
   if(def.chill&&living(e)&&!boss(w,e)){e.slow=Math.max(e.slow||0,def.slow);e.slowTime=Math.max(e.slowTime||0,def.slowTime);e.frostUntil=Math.max(e.frostUntil||0,w.time+def.slowTime);}
   fx(w,'impact',{x:e.x,y:e.y,dx:s.dx,dy:s.dy,color:def.color,size:w.classId==='mercenary'?1.1:.8,mood:'pierce',duration:.3});
   push(w,e,s.dx,s.dy,def.knockback);
   if(s.pierce<=0){stopped=true;break;}
   s.pierce--;s.factor*=def.falloff??1;
  }
  if(stopped){if(wall!==Infinity&&s.hits.size===0){if(def.explode)explodeShot(w,def,q.x,q.y,s.k);else fx(w,'impact',{x:q.x,y:q.y,dx:s.dx,dy:s.dy,color:'#c9b48a',size:.5,mood:'pierce',duration:.25});}s.remaining=0;continue;}
  s.x=end.x;s.y=end.y;s.remaining-=travel;
  if(def.explode&&s.remaining<=1e-9)explodeShot(w,def,s.x,s.y,s.k);
 }
 w.marksmanShots=w.marksmanShots.filter(s=>s.remaining>1e-9);
 for(const s of w.marksmanShots){const def=s.def||list[s.index]||list[0];w.effects.push({id:'mshot-'+s.id,marksmanShot:true,fx:def.id==='bigBang'?'bigBangOrb':'projectile',shot:'arrow',ally:true,dx:s.dx,dy:s.dy,x:s.x,y:s.y,radius:def.radius,color:s.color||def.color,size:def.size*(s.imbue?1.2:1),visual:true,time:0,duration:10});}
}
// Flecha teleguiada: segue o alvo travado; sem ele, procura o inimigo mais próximo à frente (até `seek` u)
// e vira no máximo `turn` rad/s, então a curva é visível e uma esquiva lateral ainda pode escapar.
// Tiros com seek falso (penas que sobraram) não procuram alvo novo.
function steer(w,s,def,dt){
 let t=s.target!=null?w.actors.find(e=>e.id===s.target&&living(e)):null;
 if(!t){
  s.target=null;if(!s.seek)return;let near=def.homing.seek;
  for(const e of w.actors){if(!living(e)||s.hits.has(e.id))continue;const x=e.x-s.x,y=e.y-s.y,d=Math.hypot(x,y);if(d>near||d<1e-6||(x*s.dx+y*s.dy)/d<.2)continue;near=d;t=e;}
  if(!t)return;s.target=t.id;
 }
 const cur=Math.atan2(s.dy,s.dx),want=Math.atan2(t.y-s.y,t.x-s.x),diff=Math.atan2(Math.sin(want-cur),Math.cos(want-cur)),turn=def.homing.turn*dt;
 const a=cur+Math.max(-turn,Math.min(turn,diff));s.dx=Math.cos(a);s.dy=Math.sin(a);
}
// Explosão: dano em área (paredes bloqueiam) e empurrão a partir do centro.
// k: fração do dano (bola de fogo do Clone Arcano).
function explode(w,def,x,y,k=1){
 const p=w.player,r=blastRadius(def,w.marksmanRanks),damage=actionDamage(def,power(w),w.marksmanRanks)*k,c={x,y};
 for(const e of w.actors){
  if(!living(e))continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);
  if(d>r+(e.radius||.3)||!lineClear(c,e,.05,w.arena))continue;
  dealDamage(w,e,Math.round(damage*bonusVs(w,e,def)),p,def.name);push(w,e,d>1e-6?dx/d:1,d>1e-6?dy/d:0,def.knockback);
 }
 if(def.id==='bigBang'){fx(w,'bigBangBlast',{x,y,radius:r,color:def.color,marksmanBurst:true,duration:.85});w.combatEvents?.push({kind:'meteorImpact'});return;}
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
  else if(def.net)net(w,def,b.tx,b.ty);
  else explode(w,def,b.tx,b.ty);
 }
 w.marksmanLobs=w.marksmanLobs.filter(b=>!b.done);
}
// Esfera de Gelo: fere uma vez quem toca e, girando, solta cristais em espiral a partir da borda.
function tickOrbs(w,dt){
 if(!w.marksmanOrbs?.length)return;
 const list=marksmanActions(w.classId),p=w.player;
 w.marksmanOrbs=w.marksmanOrbs.filter(o=>{
  const def=list[o.index];if(!def||w.paused)return !!def;
  const step=Math.min(o.left,def.speed*dt),pos=moveCircle(o,{x:o.dx*step,y:o.dy*step},.1,w.arena,{slide:false});o.x=pos.x;o.y=pos.y;o.left-=step;
  for(const e of w.actors){if(!living(e)||o.hits.has(e.id)||Math.hypot(e.x-o.x,e.y-o.y)>def.radius+(e.radius||.3))continue;o.hits.add(e.id);dealDamage(w,e,Math.max(1,Math.round(o.damage*bonusVs(w,e,def))),p,def.name);}
  const S=def.shard;o.spin??=Math.atan2(o.dy,o.dx);
  while(o.next<=w.time+1e-9){
   o.next+=S.interval;o.spin+=S.step;
   // A esfera do Clone solta cristais com a mesma fração copiada.
   w.marksmanMirror=o.k||0;
   for(let k=0;k<S.count;k++){const a=o.spin+k*Math.PI*2/S.count,c=Math.cos(a),n=Math.sin(a);fire(w,S,c,n,{origin:{x:o.x+c*def.radius*.8,y:o.y+n*def.radius*.8},quiet:true});}
   w.marksmanMirror=0;
  }
  const alive=!pos.blocked&&o.left>1e-6;
  if(!alive)fx(w,'impact',{x:o.x,y:o.y,h:.8,color:def.color,size:1,radius:.6,mood:'magic',duration:.35});
  else w.effects.push({id:'morb-'+o.id,marksmanShot:true,fx:'iceOrb',ally:true,dx:o.dx,dy:o.dy,x:o.x,y:o.y,radius:def.radius,spin:o.spin,color:def.color,visual:true,time:0,duration:10});
  return alive;
 });
}
// Familiar de Fogo: orbita o Mago e lança uma bola de fogo no inimigo mais próximo dele, com linha de visão.
function tickFamiliar(w,dt){
 const f=w.marksmanFamiliar;if(!f)return;
 const def=marksmanActions(w.classId)[f.index],p=w.player;
 if(!def||p.hp<=0||w.time>=f.until){w.marksmanFamiliar=null;if(def)fx(w,'summonBurst',{x:f.x,y:f.y,radius:.8,color:def.color,duration:.4});return;}
 if(!w.paused){f.angle+=dt*2.2;f.x=p.x+Math.cos(f.angle)*def.orbit;f.y=p.y+Math.sin(f.angle)*def.orbit;}
 if(!w.paused&&f.next<=w.time+1e-9){
  let best=null,near=def.pick;
  for(const e of w.actors){if(!living(e))continue;const d=Math.hypot(e.x-p.x,e.y-p.y)-(e.radius||.3);if(d<=near&&lineClear(f,e,.05,w.arena)){near=d;best=e;}}
  if(best){const x=best.x-f.x,y=best.y-f.y,d=Math.hypot(x,y)||1;fire(w,def.bolt,x/d,y/d,{origin:f,target:best.id,quiet:true});f.next=w.time+def.interval;w.combatEvents?.push({kind:'fireIgnite'});}
  else f.next=w.time+.25;
 }
 w.effects.push({id:'mfamiliar',marksmanShot:true,fx:'projectile',shot:'orb',ally:true,dx:Math.cos(f.angle),dy:Math.sin(f.angle),x:f.x,y:f.y,radius:.35,color:def.color,size:1.1,visual:true,time:0,duration:10});
}
// Rede de Caça: dano leve e lentidão em quem está na área; chefes só recebem o dano.
function net(w,def,x,y){
 const p=w.player,c={x,y},rank=Math.max(1,w.marksmanRanks?.[def.node]||1),time=def.slowTime+(rank-1)*def.slowPerRank,damage=actionDamage(def,power(w),w.marksmanRanks);
 for(const e of w.actors){
  if(!living(e)||Math.hypot(e.x-x,e.y-y)>def.radius+(e.radius||.3)||!lineClear(c,e,.05,w.arena))continue;
  dealDamage(w,e,Math.max(1,Math.round(damage*bonusVs(w,e,def))),p,def.name);
  if(e.hp>0&&!boss(w,e)){e.slow=Math.max(e.slow||0,def.slow);e.slowTime=Math.max(e.slowTime||0,time);e.netUntil=w.time+time;}
 }
 fx(w,'shockwave',{x,y,radius:def.radius,color:def.color,duration:.45});w.combatEvents?.push({kind:'scytheWind'});
}
// Impacto Celeste: dano em área, empurrão a partir do centro, e o falcão volta à órbita.
function strike(w,z){
 const p=w.player,c={x:z.x,y:z.y};
 for(const e of w.actors){
  if(!living(e))continue;const dx=e.x-z.x,dy=e.y-z.y,d=Math.hypot(dx,dy);
  if(d>z.radius+(e.radius||.3)||!lineClear(c,e,.05,w.arena))continue;
  dealDamage(w,e,Math.max(1,Math.round(z.damage*bonusVs(w,e,z))),p,z.name);push(w,e,d>1e-6?dx/d:1,d>1e-6?dy/d:0,z.knockback);
 }
 fx(w,'groundBreak',{x:z.x,y:z.y,radius:z.radius,color:z.color,shake:.2,duration:.6});
 fx(w,'impact',{x:z.x,y:z.y,h:.8,color:'#fff2c0',size:1.6,radius:z.radius*.6,mood:'claw',duration:.4});
 w.combatEvents?.push({kind:'orcSlam'});
 const rank=w.marksmanRanks?.impactoFeroz||0;
 if(rank>0)w.marksmanZones.push({kind:'featherBurst',x:z.x,y:z.y,next:w.time+.15,left:3,interval:.2,rank});
 const a=w.falcon;if(a?.state==='strike'){a.state='return';a.strike=null;a.animation='idle';a.actionId++;a.next=w.time+FALCON.interval;}
}
// Chuva de Flechas e chão em chamas: ondas em intervalos fixos sobre quem estiver dentro.
function tickZones(w){
 w.effects=w.effects.filter(f=>!f.marksmanFire);
 if(!w.marksmanZones?.length)return;
 const p=w.player;
 for(const z of w.marksmanZones){
  if(z.kind==='featherBurst'){
   while(z.left>0&&w.time+1e-9>=z.next){z.left--;z.next+=z.interval;
    const base=marksmanActions('archer').find(d=>d.id==='penasVoadoras'),def={...base,homing:null,multiplier:base.multiplier*(1+.1*(z.rank-1))};
    for(let i=0;i<6;i++){const a=i*Math.PI/3+z.left*.18;fire(w,def,Math.cos(a),Math.sin(a),{origin:z,quiet:true,seek:false});}
   }continue;
  }
  if(z.kind==='strike'){if(!z.done&&w.time+1e-9>=z.at){z.done=true;strike(w,z);}continue;}
  // Chuva de Fogo / Avalanche: cada queda aparece `fall` s antes do impacto (sombra crescendo) e cai na hora marcada.
  if(z.kind==='shower'){
   for(const d of z.drops){
    if(!d.shown&&w.time+1e-9>=d.at-z.fall){d.shown=true;fx(w,'meteor',{x:d.x,y:d.y,dx:z.dx,dy:z.dy,radius:z.drop,color:z.color,snow:z.snow,size:z.snow?.75:.8,ground:false,duration:Math.max(.05,d.at-w.time)});}
    if(!d.done&&w.time+1e-9>=d.at){d.done=true;land(w,z,d);}
   }
   continue;
  }
  // Muralha de Fogo: a cada intervalo, fere e incendeia quem toca o segmento.
  if(z.kind==='wall'){
   while(z.next<=w.time+1e-9&&z.next<=z.until+1e-9){
    z.next+=z.interval;
    for(const e of w.actors){if(!living(e)||wallDistance(z,e)>z.width+(e.radius||.3))continue;dealDamage(w,e,Math.max(1,Math.round(z.damage*bonusVs(w,e,z))),p,z.name);burn(w,e,z.burn.damage,z.burn);}
   }
   // Chamas só depois do aviso: cinco focos ao longo do segmento.
   if(w.time+1e-9>=z.armAt)for(let i=0;i<5;i++){const t=-z.half+z.half*i/2;w.effects.push({id:'mwall-'+z.id+'-'+i,marksmanFire:true,fx:'fireField',x:z.x+z.ux*t,y:z.y+z.uy*t,radius:.85,remaining:z.until-w.time,color:z.color,visual:true,ground:true,time:0,duration:10});}
   continue;
  }
  while(z.next<=w.time+1e-9&&z.next<=z.until+1e-9&&(z.kind!=='rain'||z.left>0)){
   z.next+=z.interval;if(z.kind==='rain')z.left--;
   for(const e of w.actors){if(!living(e)||Math.hypot(e.x-z.x,e.y-z.y)>z.radius+(e.radius||.3)||(w.classId==='archer'&&!lineClear(z,e,.05,w.arena)))continue;dealDamage(w,e,Math.round(z.damage*(z.kind==='rain'||z.element?bonusVs(w,e,z):1)),p,z.name);}
   if(z.explosiveRain){
    fx(w,'impact',{x:z.x,y:z.y,h:.4,radius:z.radius,size:1.6,color:z.color,mood:'fire',duration:.35});
    let field=w.marksmanZones.find(f=>f.rainOwner===z.id);
    if(field)field.until=z.next-z.interval+2;
    else w.marksmanZones.push({kind:'fire',id:w.nextId++,rainOwner:z.id,x:z.x,y:z.y,radius:z.radius,next:z.next,interval:.5,until:z.next-z.interval+2,damage:Math.max(1,Math.floor(z.damage*.3)),name:z.name+' (chamas)',element:'fire',color:z.color});
   }
   if(z.fx==='meteor'){fx(w,'groundBreak',{x:z.x,y:z.y,radius:z.radius,color:z.color,shake:.35,duration:.8});fx(w,'impact',{x:z.x,y:z.y,h:1.2,color:'#ffcf7a',size:2.2,radius:z.radius*.7,mood:'fire',duration:.5});w.combatEvents?.push({kind:'meteorImpact'});
    if(z.burn)w.marksmanZones.push({kind:'fire',id:w.nextId++,x:z.x,y:z.y,radius:z.burn.radius,next:w.time+z.burn.interval,interval:z.burn.interval,until:w.time+z.burn.time,damage:z.burn.damage,name:'Meteoro (chamas)',color:z.color,element:'fire'});}
   else if(z.kind==='rain')fx(w,'arrowRain',{x:z.x,y:z.y,radius:z.radius,count:9,fall:.3,color:z.color,duration:.8});
  }
  if(z.kind==='fire')w.effects.push({id:'mfire-'+z.id,marksmanFire:true,fx:'fireField',x:z.x,y:z.y,radius:z.radius,remaining:z.until-w.time,color:z.color,visual:true,ground:true,time:0,duration:10});
 }
 w.marksmanZones=w.marksmanZones.filter(z=>z.kind==='rain'||z.kind==='featherBurst'?z.left>0:z.kind==='strike'?!z.done:z.kind==='shower'?z.drops.some(d=>!d.done):w.time<z.until);
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
// Armadilha de Urso: fecha no primeiro inimigo que chega perto; prende (chefes só ficam lentos).
function tickTraps(w){
 if(!w.marksmanTraps?.length)return;
 const list=marksmanActions(w.classId),p=w.player;
 for(const t of w.marksmanTraps){
  const def=list[t.index];if(!def||def.kind!=='trap'||w.time>=t.until){t.done=true;continue;}
  if(w.time+1e-9<t.armAt)continue;
  if(!t.armed){t.armed=true;w.combatEvents?.push({kind:'mineArm'});}
  let prey=null,near=Infinity;
  for(const e of w.actors){if(!living(e))continue;const d=Math.hypot(e.x-t.x,e.y-t.y);if(d<=def.trigger+(e.radius||.3)&&d<near){near=d;prey=e;}}
  if(!prey)continue;
  t.done=true;dealDamage(w,prey,Math.max(1,Math.round(actionDamage(def,power(w),w.marksmanRanks)*bonusVs(w,prey,def))),p,def.name);
  if(prey.hp>0){prey.slow=boss(w,prey)?Math.max(prey.slow||0,def.bossSlow):1;prey.slowTime=Math.max(prey.slowTime||0,def.root);prey.trapUntil=w.time+def.root;}
  fx(w,'impact',{x:t.x,y:t.y,h:.3,color:def.color,size:1,radius:.6,mood:'claw',duration:.3});w.combatEvents?.push({kind:'soldierCut'});
 }
 w.marksmanTraps=w.marksmanTraps.filter(t=>!t.done);
}
// Marcas no chão ligadas à posição real: queda da bomba e da rede, área da chuva e do Impacto Celeste, alvo
// travado, minas e armadilhas (desarmada / armada) e inimigos presos na rede ou na armadilha.
function rings(w){
 w.effects=w.effects.filter(f=>!f.marksmanRing);
 const list=marksmanActions(w.classId),ring=(id,x,y,radius,color,time=0)=>w.effects.push({id,marksmanRing:true,x,y,radius,color,visual:true,ground:true,fixedRadius:true,time,duration:10});
 for(const b of w.marksmanLobs||[]){const def=list[b.index];ring('mlob-'+b.id,b.tx,b.ty,def.fire?def.radius:blastRadius(def,w.marksmanRanks),def.color,3*(1-b.time/b.flight));}
 for(const z of w.marksmanZones||[])if(z.kind==='rain')ring('mrain-'+z.x.toFixed(2)+z.y.toFixed(2),z.x,z.y,z.radius,z.color,2);
 for(const z of w.marksmanZones||[])if(z.kind==='strike'&&!z.done)ring('mstrike-'+z.id,z.x,z.y,z.radius,z.color,3*Math.min(1,Math.max(0,1-(z.at-w.time)/z.delay)));
 const lock=w.marksmanAction?.lock!=null&&w.actors.find(e=>e.id===w.marksmanAction.lock&&living(e));if(lock)ring('mlock-'+lock.id,lock.x,lock.y,(lock.radius||.3)+.5,'#ffe08a',1);
 for(const id of w.marksmanAction?.locks||[]){const e=w.actors.find(e=>e.id===id&&living(e));if(e)ring('mlock-'+id,e.x,e.y,(e.radius||.3)+.5,'#ffe08a',1);}
 for(const e of w.actors)if(living(e)&&e.netUntil>w.time)ring('mnet-'+e.id,e.x,e.y,(e.radius||.3)+.4,'#d8c9a0',2);
 for(const e of w.actors)if(living(e)&&e.trapUntil>w.time)ring('mtrapped-'+e.id,e.x,e.y,(e.radius||.3)+.35,'#e8e4d8',1);
 const trap=list.find(a=>a.kind==='trap');
 for(const t of w.marksmanTraps||[]){const armed=w.time>=t.armAt;ring('mtrap-'+t.id,t.x,t.y,.4,armed?'#e8e4d8':'#8a8478',armed?0:4);if(armed&&trap)ring('mtrapr-'+t.id,t.x,t.y,trap.trigger,'#c8c4b8',8);}
 for(const e of w.actors)if(living(e)&&e.frostUntil>w.time)ring('mfrost-'+e.id,e.x,e.y,(e.radius||.3)+.35,'#9fe0ff',2);
 // Mago: queimadura (anel laranja), Seta imbuída (anel no Mago) e área da Chuva de Fogo / Avalanche.
 for(const e of w.actors)if(living(e)&&e.burnUntil>w.time)ring('mburn-'+e.id,e.x,e.y,(e.radius||.3)+.3,'#ff7a2a',1);
 const im=w.marksmanImbue;if(im?.until>w.time&&w.player?.hp>0)ring('mimbue',w.player.x,w.player.y,.85,im.color,1);
 if(w.marksmanShield?.until>w.time&&w.player.hp>0){ring('mana-shield',w.player.x,w.player.y,1.15,'#bd91ff',2);w.effects.push({id:'mana-shield-bubble',marksmanRing:true,fx:'arcaneShield',x:w.player.x,y:w.player.y,radius:1.15,color:'#bd91ff',visual:true,time:0,duration:10});}
 for(const z of w.marksmanZones||[])if(z.kind==='shower')ring('mshower-'+z.id,z.x,z.y,z.radius,z.color,2);
 for(const e of w.actors)if(living(e)&&(e.falconMark>w.time||e.hunterMark>w.time))ring('mmark-'+e.id,e.x,e.y,(e.radius||.3)+.4,'#f2d17a',1);
 if(w.falcon?.rush){const r=w.falcon.rush;ring('falcon-rush',r.center.x,r.center.y,r.def.radius,r.def.color,1);}
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
 if(w.classId!=='archer'||!a||['strike','rush'].includes(a.state)||['falconStrike','falconRush'].includes(marksmanActions(w.classId)[w.marksmanAction?.index]?.kind)||w.paused||p.hp<=0||p.dead||p.mp<C.cost||falconCooldown(w)>1e-9)return false;
 let best=null,near=C.pick;
 for(const e of w.actors){if(!living(e)||Math.hypot(e.x-p.x,e.y-p.y)>C.range+(e.radius||.3)||!lineClear(p,e,.05,w.arena))continue;const d=Math.hypot(e.x-aim.x,e.y-aim.y)-(e.radius||.3);if(d<=near){near=d;best=e;}}
 if(!best)return false;
 const hunter=(w.marksmanRanks?.marcaDoCacador||0)>0;
 p.mp-=C.cost;w.falconReady=w.time+(hunter?12:C.cooldown)*(1-Math.min(50,Math.max(0,w.modifiers?.gearCooldown||0))/100);
 if(hunter){for(const e of w.actors){e.hunterMark=0;e.falconMark=0;}best.hunterMark=w.time+8;best.hunterMarkBonus=.2;}
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
 // Passiva periódica, sem custo e sem slot. Só dispara com presas visíveis e falcão livre do Impacto Celeste.
 if((w.marksmanRanks?.penasVoadoras||0)>0&&!['strike','rush'].includes(a.state)&&w.time>=(w.marksmanFeathersReady||0)){
  const def=marksmanActions('archer').find(d=>d.id==='penasVoadoras');
  if(w.actors.some(e=>living(e)&&Math.hypot(e.x-p.x,e.y-p.y)<=def.pick+(e.radius||.3)&&lineClear(p,e,.05,w.arena))){
   const x=w.aim.x-p.x,y=w.aim.y-p.y,d=Math.hypot(x,y)||1;release(w,{dx:x/d,dy:y/d},def);w.marksmanFeathersReady=w.time+def.cooldown;
  }
 }
 a.orbit+=dt*1.6;
 if(a.state==='rush'){
  const r=a.rush,D=r.def,c=r.center;
  while(r.left>0){
   if(!r.to){
    const candidates=w.actors.filter(e=>living(e)&&Math.hypot(e.x-c.x,e.y-c.y)<=D.radius+(e.radius||.3)&&lineClear(c,e,.05,w.arena)&&lineClear(a,e,.05,w.arena));
    candidates.sort((a,b)=>(b.hunterMark>w.time)-(a.hunterMark>w.time)||(r.visited.has(a.id)-r.visited.has(b.id))||a.id-b.id);
    r.to=candidates[0];if(!r.to){r.left=0;break;}
    r.from={x:a.x,y:a.y};r.start=r.next-D.gap;r.end={x:r.to.x,y:r.to.y};
   }
   const k=Math.max(0,Math.min(1,(w.time-r.start)/D.gap));a.x=r.from.x+(r.end.x-r.from.x)*k;a.y=r.from.y+(r.end.y-r.from.y)*k;a.jumpZ=.9;a.angle=Math.atan2(r.end.x-r.from.x,r.end.y-r.from.y);
   if(w.time+1e-9<r.next)break;
   if(living(r.to)&&Math.hypot(r.to.x-r.end.x,r.to.y-r.end.y)<1&&lineClear(r.from,r.to,.05,w.arena)){
    dealDamage(w,r.to,actionDamage(D,power(w),w.marksmanRanks),p,D.name);r.visited.add(r.to.id);
    fx(w,'lightning',{x:r.from.x,y:r.from.y,tx:r.end.x,ty:r.end.y,h0:1,h1:1,width:1,color:D.color,ground:false,duration:.15});
    fx(w,'impact',{x:r.end.x,y:r.end.y,h:1,size:.8,color:D.color,mood:'claw',duration:.2});
   }
   r.left--;r.next+=D.gap;r.to=null;
  }
  if(r.left<=0){a.rush=null;a.state='return';a.animation='idle';a.actionId++;a.next=w.time+FALCON.interval;}return;
 }
 // Impacto Celeste: desce até o ponto marcado e chega no instante do dano.
 if(a.state==='strike'){
  const t=a.strike;if(!t){a.state='return';return;}
  const d=Math.hypot(t.x-a.x,t.y-a.y),remain=Math.max(dt,t.at-w.time),left=fly(a,t.x,t.y,Math.min(d,d/remain*dt));
  a.jumpZ=FALCON.strikeHeight+(a.from-FALCON.strikeHeight)*Math.max(0,Math.min(1,left/a.span));
  return;
 }
 if(a.state==='dive'){
  const t=a.target;
  if(!t||!living(t)){a.state='return';a.animation='idle';a.actionId++;return;}
  const left=fly(a,t.x,t.y,FALCON.speed*1.4*dt);
  a.jumpZ=FALCON.strikeHeight+(a.from-FALCON.strikeHeight)*Math.max(0,Math.min(1,left/a.span));
  if(left<=.3){
   dealDamage(w,t,falconDamage(power(w),w.marksmanRanks,a.command),p,'Falcão');
   fx(w,'impact',{x:t.x,y:t.y,h:1,color:'#f2d17a',size:.9,mood:'claw',duration:.3});
   if(a.command&&!(w.marksmanRanks?.marcaDoCacador>0))t.falconMark=w.time+FALCON.mark.time;
   a.state='return';a.animation='idle';a.actionId++;a.next=w.time+FALCON.interval;
  }
  return;
 }
 const gx=p.x+Math.cos(a.orbit)*FALCON.orbit,gy=p.y+Math.sin(a.orbit)*FALCON.orbit,left=fly(a,gx,gy,FALCON.speed*dt);
 a.jumpZ+=(FALCON.height-a.jumpZ)*Math.min(1,dt*4);
 if(a.state==='return'&&left<.6)a.state='orbit';
 if(a.state!=='orbit'||w.time<a.next)return;
 let best=null,near=FALCON.range;
 const prey=w.actors.find(e=>living(e)&&e.hunterMark>w.time&&Math.hypot(e.x-p.x,e.y-p.y)<=FALCON.range+(e.radius||.3)&&lineClear(p,e,.05,w.arena));
 for(const e of w.actors){if(!living(e))continue;const d=Math.hypot(e.x-p.x,e.y-p.y)-(e.radius||.3);if(d<=near&&lineClear(p,e,.05,w.arena)){near=d;best=e;}}
 if(prey||best)dive(w,a,prey||best,false);else a.next=w.time+.25;
}

// Mago. Bola de Fogo: explosão no ponto de contato; com Combustão, o chão fica em chamas.
function explodeShot(w,def,x,y,k=1){
 explode(w,{...def,radius:def.explode,blast:false,knockback:0},x,y,k);
 const rank=w.marksmanRanks?.combustion||0,C=MAGE.combustion;
 if(w.classId==='mage'&&def.element==='fire'&&rank>0)w.marksmanZones.push({kind:'fire',id:w.nextId++,x,y,radius:C.radius,next:w.time+C.interval,interval:C.interval,until:w.time+combustionTime(rank),damage:Math.max(1,Math.floor(power(w)*C.multiplier*k*(1+schoolSynergy('mage',w.marksmanRanks,'combustion')))),name:'Combustão',color:'#ff7a2a',element:'fire'});
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
// Nova de Gelo: onda em volta de quem conjura; paredes bloqueiam. Lentidão como a da Rajada.
function nova(w,def){
 const p=w.player,damage=actionDamage(def,power(w),w.marksmanRanks);
 for(const e of w.actors){
  if(!living(e)||Math.hypot(e.x-p.x,e.y-p.y)>def.radius+(e.radius||.3)||!lineClear(p,e,.05,w.arena))continue;
  dealDamage(w,e,Math.round(damage*bonusVs(w,e,def)),p,def.name);chill(w,e,def.slow,def.slowTime);
 }
 fx(w,'shockwave',{x:p.x,y:p.y,radius:def.radius,color:def.color,duration:.5});
 fx(w,'groundBreak',{x:p.x,y:p.y,radius:def.radius*.8,color:'#cfefff',shake:.08,duration:.5});
 w.combatEvents?.push({kind:'frostBlast'});
}
// Distância de um ponto ao segmento da Muralha (centro z, direção u, meia-largura half).
function wallDistance(z,e){const t=Math.max(-z.half,Math.min(z.half,(e.x-z.x)*z.ux+(e.y-z.y)*z.uy));return Math.hypot(e.x-(z.x+z.ux*t),e.y-(z.y+z.uy*t));}
// Queda da Chuva de Fogo ou da Avalanche: dano em raio, chão em chamas ou lentidão.
function land(w,z,d){
 const p=w.player,c={x:d.x,y:d.y};
 for(const e of w.actors){
  if(!living(e)||Math.hypot(e.x-d.x,e.y-d.y)>z.drop+(e.radius||.3)||!lineClear(c,e,.05,w.arena))continue;
  dealDamage(w,e,Math.max(1,Math.round(z.damage*bonusVs(w,e,z))),p,z.name);if(z.slow)chill(w,e,z.slow,z.slowTime);
 }
 fx(w,'groundBreak',{x:d.x,y:d.y,radius:z.drop,color:z.color,shake:z.snow?.08:.18,duration:.6});
 fx(w,'impact',{x:d.x,y:d.y,h:.8,color:z.snow?'#f4fbff':'#ffcf7a',size:z.snow?1.3:1.6,radius:z.drop*.6,mood:z.snow?'magic':'fire',duration:.45});
 if(z.burn)w.marksmanZones.push({kind:'fire',id:w.nextId++,x:d.x,y:d.y,radius:z.burn.radius,next:w.time+z.burn.interval,interval:z.burn.interval,until:w.time+z.burn.time,damage:z.burn.damage,name:z.name+' (chamas)',color:z.color,element:'fire'});
 w.combatEvents?.push({kind:z.snow?'frostBlast':'meteorImpact'});
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
