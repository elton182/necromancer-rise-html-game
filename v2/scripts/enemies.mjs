import BaseTypes from './enemy-types.mjs';
import R from './enemy-rules.mjs';
import Hound from './shared-crypt-hound.mjs';
import Acolyte from './shared-war-acolyte.mjs';
import Expedition from './shared-expedition.mjs';
import EQ from './shared-equipment.mjs';
import {dealDamage} from './combat.mjs';
import {navigate,resolvePosition,moveCircle,lineClear} from './terrain.mjs';
import {blockEnemyByWalls,firstWallHit,absorbWallProjectile} from './spells.mjs';
import {fx,slashFx,hitFx} from './vfx-events.mjs';
import {plan} from './enemy-tactics.mjs';
// Extensão exclusiva da v2: índices legados permanecem intactos.
const Types=[...BaseTypes.map((t,i)=>i===0?{...t,hp:60}:t),...[['hoodedThief','Ladrão'],['griffinHumanoid','Humanoide Grifo'],['spider','Aranha']].map(([id,name])=>({...BaseTypes[0],id,name})),
 // Ladino Arqueiro usa as regras do Arqueiro (`rules`); Orc é corpo a corpo com golpe de maça preparado. Atributos provisórios.
 {...BaseTypes[1],id:'hoodedArcher',name:'Ladino Arqueiro',rules:'Arqueiro'},{...BaseTypes[2],id:'orc',name:'Orc',hp:110,dmg:14,spd:1.5,xp:24,souls:16,sc:1.3}];
export {Types,R,Hound,Acolyte,Expedition};
export const models=['warrior','enemyRogue','brute','livingMage','cryptHound','warAcolyte','enemyThief','enemyGriffin','enemySpider','enemyRogue','enemyOrc'];
// Voo baixo: a projeção no chão mantém as colisões e a vulnerabilidade comuns.
export function flightHeight(actor,time){if(actor.model!=='enemyGriffin')return 0;if(actor.hp<=0)return .85*Math.max(0,1-(actor.animationTime||0)/.8);return .85+.09*Math.sin(time*Math.PI*2);}
// Corpos de inimigos somem sozinhos; no último segundo afundam no chão antes de sair da cena.
export const CORPSE_LIFETIME=2,CORPSE_SINK_TIME=1;
export const corpseSink=a=>a.hp>0||!a.corpseTime?0:Math.min(1,Math.max(0,(a.corpseTime-((a.corpseLifetime||CORPSE_LIFETIME)-CORPSE_SINK_TIME))/CORPSE_SINK_TIME))*.9;
const alive=a=>a&&a.hp>0&&!a.dead;
export function targets(w){return w.actors.filter(a=>(a===w.player||a.team==='ally')&&alive(a));}
export function target(w,e){const allies=targets(w).filter(a=>a.team==='ally').sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y));return allies[0]&&Math.hypot(allies[0].x-e.x,allies[0].y-e.y)<5?allies[0]:alive(w.player)?w.player:null;}
// Tipos desativados: o índice segue válido (saves, fontes compartilhadas e testes dos modelos), mas nenhum modo os gera. Cada um cede o lugar a um substituto de papel parecido (Bruto→Orc, Acólito de Guerra→Ladino Arqueiro).
export const DISABLED_TYPES={2:10,5:9};
export const activeType=index=>DISABLED_TYPES[index]??index;
export function spawnEnemy(w,index,x,y,{wave=1,tier='common',owner=null,legacy=false}={}){
 if(!legacy)index=activeType(index);const type=Types[index];if(!type||!Expedition.tiers[tier])throw Error('Tipo ou raridade de inimigo inválido.');
 const scale=EQ.waveStats(wave),elite=Expedition.tiers[tier],hp=Math.round(type.hp*scale.hp*elite.hp),radius=.3*type.sc,pos=resolvePosition({x,y},radius,w.arena);
 const e={id:w.nextId++,type,typeIndex:index,model:models[index],team:'enemy',...pos,radius,hp,maxHp:hp,dmg:Math.round(type.dmg*scale.damage*elite.damage),spd:type.spd*R.tuning.enemySpeed*elite.speed*({0:1.65,1:1.4,4:1.35,6:1.55,9:1.4,10:1.3}[index]||1),xp:Math.round(type.xp*scale.xp*elite.xp),gearWave:wave,lootTier:tier,kingOwner:owner,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,atkTimer:0,abilityCd:R.tuning.specialDelayMin+w.random()*(R.tuning.specialDelayMax-R.tuning.specialDelayMin),phase:0};if(index===4)e.abilityCd=R.basic.hound.initial;if(index===5)e.abilityCd=Acolyte.skill.initial;if(index===10)e.abilityCd=SLAM.initial[0]+w.random()*(SLAM.initial[1]-SLAM.initial[0]);w.actors.push(e);return e;
}
// Introdução dos tipos 6–8 por nível de progressão (Arena: encontro; campanha: 2×fase+onda; Expedição: onda+2; Conquista: tudo liberado).
export const NEW_TYPE_LEVELS=[[6,4],[7,6],[8,8],[9,10],[10,12]];
export const unlockedTypes=level=>NEW_TYPE_LEVELS.filter(([,from])=>level>=from).map(([type])=>type);
// Troca, de forma determinística, metade dos Guerreiros de uma lista pelos tipos liberados no nível, em rodízio.
export function withNewTypes(list,level){const open=unlockedTypes(level);if(!open.length)return list;let zeros=0,next=0;return list.map(i=>i===0&&zeros++%2===1?open[next++%open.length]:i);}
export function composition(wave,count=8,random=Math.random){const list=Acolyte.arenaTypes(wave,Hound.arenaTypes(wave,count,BaseTypes,random),BaseTypes).map(t=>BaseTypes.indexOf(t));for(const [type,minimum]of [[6,5],[7,7],[8,9],[9,11],[10,13]])for(let n=wave>=minimum?1+Math.floor((wave-minimum)/5):0;n>0;n--){let slot=list.findIndex(i=>i<4);if(slot<0&&type>=9){/* Sem espaço de tipo básico: Ladino e Orc tomam o lugar de um dos tipos 6–8 mais repetidos. */const counts=[8,7,6].map(k=>[k,list.filter(i=>i===k).length]).sort((a,b)=>b[1]-a[1])[0];if(counts[1]>1)slot=list.lastIndexOf(counts[0]);}if(slot>=0)list[slot]=type;}return list.map(activeType);}
export const CRY={range:8,wind:1,duration:6,cooldown:14,damage:1.25,speed:1.15};
export function warBuffActive(w,e){return !!(e.warBuff&&e.warBuff.until>w.time&&w.actors.some(a=>a.id===e.warBuff.source&&a.hp>0&&!a.dead));}
function power(w,e,n){return Acolyte.damage(n,e,w.actors.filter(a=>a.team==='enemy'))*(warBuffActive(w,e)?CRY.damage:1);}
function hurt(w,e,t,n){slashFx(w,e,t);return dealDamage(w,t,power(w,e,n),e);}
function area(w,e,x,y,r,n,mult=1,def=null){
 for(const t of targets(w))if(Math.hypot(t.x-x,t.y-y)<=r)dealDamage(w,t,Math.round(power(w,e,n)*mult),e);
 if(def)fx(w,'shockwave',{x,y,radius:r,color:def.color,mood:def.kind==='fire'?'fire':'dust',shake:def.kind==='leap'?.3:.12,duration:.5});
}
function mark(w,e,key,x,y,r,color,extra={}){w.effects.push({id:`enemy-${e.id}-${key}`,enemyWarning:e.id,x,y,radius:r,color,kind:'enemyWarning',harmless:e.typeIndex===5,visual:true,ground:true,fixedRadius:true,time:0,duration:10,...extra});}
export function shoot(w,e,dx,dy,damage,speed,life,kind='arrow',mult=1){w.hostileShots.push({id:w.nextId++,source:e.id,x:e.x,y:e.y,dx,dy,speed,damage:Math.round(power(w,e,damage)*mult),remaining:speed*life,kind,rogueTrail:kind==='arrow'&&e.model==='enemyRogue'});fx(w,'muzzle',{x:e.x,y:e.y,dx,dy,color:kind==='arrow'?'#edce77':kind==='feather'?FEATHER.color:'#d08cff',duration:.22});}
// Inimigos vivos e ativos ao redor do alvo, para a IA tática (papéis, vagas de ataque e leque de atiradores).
const mates=(w,t)=>w.actors.filter(a=>a.team==='enemy'&&a.typeIndex!==undefined&&a.siegeLane===undefined&&alive(a)&&(!a.home||a.alert)&&Math.hypot(a.x-t.x,a.y-t.y)<16);
function move(w,e,t,speed,dt){const before={x:e.x,y:e.y};e.moveSpeedNow=(e.moveSpeedNow||0)+(speed*(warBuffActive(w,e)?CRY.speed:1)-(e.moveSpeedNow||0))*(1-Math.exp(-dt*9));const q=navigate(e,t,e.moveSpeedNow*((e.slowTime||0)>0?1-(e.slow||0):1),dt,w.arena);e.x=q.x;e.y=q.y;blockEnemyByWalls(w,e,before);const d=Math.hypot(e.x-before.x,e.y-before.y);e.walkDistance+=d;e.animation=d>1e-5?'walk':'idle';if(d>1e-5){const angle=Math.atan2(e.x-before.x,e.y-before.y),delta=Math.atan2(Math.sin(angle-(e.moveAngle??angle)),Math.cos(angle-(e.moveAngle??angle)));e.moveAngle=(e.moveAngle??angle)+delta*(1-Math.exp(-dt*12));e.angle=e.moveAngle;}}
// Expedição: inimigos parados em `home` até detectar o jogador (11 u) ou um aliado (7 u), sofrer dano ou ser alertados.
// Perdem o alerta além de 30 u sem ninguém por perto. Devolve true quando o inimigo deve agir.
export function tickSleep(w,e,dt){
 const p=w.player,close=Math.hypot(e.x-p.x,e.y-p.y)<11||w.actors.some(a=>a.team==='ally'&&alive(a)&&Math.hypot(e.x-a.x,e.y-a.y)<7);
 if(close||e.hp<(e.lastHp??e.maxHp))e.alert=true;
 e.lastHp=e.hp;
 if(e.alert&&Math.hypot(e.x-p.x,e.y-p.y)>30&&!close){e.alert=false;e.ability=null;e.strike=null;e.volley=null;e.slam=null;e.cry=null;e.cut=null;e.jumpZ=0;e.rain=null;e.howl=null;e.king=null;e.pose=null;}
 if(e.lootTier&&e.lootTier!=='common'){e.abilityLabel=e.isBoss?'Rei Caído':e.type.name+' · '+Expedition.tiers[e.lootTier].name;e.labelTime=.2;}
 if(e.alert)return true;
 if(e.patrol){
  const goal=e.patrol[e.patrolIndex||0];
  if(Math.hypot(e.x-goal.x,e.y-goal.y)<.6)e.patrolIndex=((e.patrolIndex||0)+1)%e.patrol.length;
  move(w,e,e.patrol[e.patrolIndex||0],(e.spd||1)*.65,dt);return false;
 }
 if(Math.hypot(e.x-e.home.x,e.y-e.home.y)>.3)move(w,e,e.home,e.spd||1,dt);else e.animation='idle';
 return false;
}
// Golpes preparados de corpo a corpo (tipos 6–8 e Orc). O Orc marca o ponto do impacto na preparação e só quem está na área leva o dano.
const STRIKE_CLIPS={6:'stab',7:'claw',8:'bite',10:'smash'};
// Harpia: além da garra, arremessa três penas em leque. A direção trava ao começar a armar, avisa o trajeto e as penas voam retas: saia da linha.
export const FEATHER={range:6.5,min:2.6,wind:.6,throw:.3,total:1,cooldown:2.6,count:3,spread:.2,speed:13,reach:8.5,mult:.45,color:'#e0c590'};
const featherDirs=v=>[-1,0,1].map(k=>{const a=k*FEATHER.spread,c=Math.cos(a),s=Math.sin(a);return {x:v.dx*c-v.dy*s,y:v.dx*s+v.dy*c};});
const SMASH={wind:.7,total:1.2,range:2.2,reach:1.5,radius:1.6,mult:1.25};
// Orc — Pancada no Chão: especial de área grande. O ponto do impacto trava ao começar a armar; só o pouso causa dano (saia do círculo).
export const CUT={wind:2,range:3.5,arc:Math.PI*.75,mult:1.6,cooldown:5};
export const SLAM={initial:[3,5],range:10,reach:10,wind:1.1,flight:.6,hit:.15,total:2.5,radius:3.2,mult:1.8,cooldown:7,color:'#ff7a3a'};
// Arqueiros (tipos 1 e 9) — Saraivada: flechas para o alto que caem numa área travada no alvo. O aviso no chão dura a preparação e a queda; o dano é um só, no pouso.
export const RAIN={initial:[5,8],range:9,min:3.5,wind:1,fall:.9,total:1.6,radius:2.8,mult:1.1,count:10,cooldown:9,color:'#e0c070'};
// Cão de Cripta — Uivo: chama reforços (sem XP nem loot, que não uivam). O chamado só acontece se o cão sobreviver à preparação.
export const HOWL={initial:[4,7],range:12,wind:1.1,total:1.7,count:2,cap:4,hounds:10,radius:5,cooldown:16,color:'#b9a6ff'};
function callPack(w,e){
 const alive=w.actors.filter(a=>a.hp>0&&a.typeIndex===4),mine=alive.filter(a=>a.summoned===e.id).length,n=Math.max(0,Math.min(HOWL.count,HOWL.cap-mine,HOWL.hounds-alive.length));
 fx(w,'shockwave',{x:e.x,y:e.y,radius:HOWL.radius,color:HOWL.color,mood:'dust',shake:.05,duration:.6});
 for(let i=0;i<n;i++){const a=w.random()*Math.PI*2,p=resolvePosition({x:e.x+Math.cos(a)*1.9,y:e.y+Math.sin(a)*1.9},.3,w.arena),pup=spawnEnemy(w,4,p.x,p.y,{wave:e.gearWave,tier:'common'});pup.summoned=e.id;pup.rewarded=true;pup.xp=0;}
}
export function tickEnemy(w,e,dt){
 w.effects=w.effects.filter(f=>f.enemyWarning!==e.id);const t=target(w,e);if(!t)return;const rk=e.type.rules||e.type.name;e.abilityLabel=e.type.name+(e.lootTier==='common'?'':' · '+Expedition.tiers[e.lootTier].name);e.labelTime=.2;
 const dx=t.x-e.x,dy=t.y-e.y,d=Math.hypot(dx,dy)||1;e.angle=Math.atan2(dx,dy);e.atkTimer=Math.max(0,e.atkTimer-dt);
 if(e.typeIndex===10){
  e.cryCd=Math.max(0,(e.cryCd??5)-dt);
  if(e.cry){e.cry.time+=dt;e.animation='idle';e.pose={anim:'smash_windup',progress:Math.min(1,e.cry.time/CRY.wind)};
   mark(w,e,'cry',e.x,e.y,CRY.range,'#ed8051',{fx:'dangerRune',harmless:true,noFill:true,progress:e.cry.time/CRY.wind});
   if(e.cry.time>=CRY.wind){for(const ally of w.actors)if(ally!==e&&ally.team==='enemy'&&ally.hp>0&&Math.hypot(ally.x-e.x,ally.y-e.y)<=CRY.range)ally.warBuff={source:e.id,until:w.time+CRY.duration};
    fx(w,'roar',{x:e.x,y:e.y,radius:CRY.range,mood:'war',color:'#ed8051',shake:.35,duration:.9});w.combatEvents.push({kind:'orcCry'});e.cry=null;e.cryCd=CRY.cooldown;e.timer=.3;}
   return;
  }
  if(e.cryCd<=0&&!e.slam&&!e.strike&&d<=12&&w.actors.some(a=>a!==e&&a.team==='enemy'&&a.hp>0&&Math.hypot(a.x-e.x,a.y-e.y)<=CRY.range)){e.cry={time:0};e.actionId++;return;}
 }
 if(e.typeIndex===8){
  e.webCd=Math.max(0,(e.webCd??3)-dt);
  if(e.web){const a=e.web;a.time+=dt;e.angle=Math.atan2(a.dx,a.dy);e.animation='attack';
   for(let i=1;i<=8;i++)mark(w,e,'web'+i,e.x+a.dx*i,e.y+a.dy*i,.22,'#e3e9ec');
   if(a.time>=.75){shoot(w,e,a.dx,a.dy,1,10,.9,'web');e.web=null;e.webCd=7;e.timer=.35;}return;
  }
  if(e.webCd<=0&&d>=2&&d<=8&&lineClear(e,t,.1,w.arena)){e.web={time:0,dx:dx/d,dy:dy/d};e.actionId++;return;}
 }
 if(e.typeIndex===0){
  if(e.cut){const a=e.cut;a.time+=dt;e.angle=Math.atan2(a.dx,a.dy);
   if(a.time<CUT.wind){e.pose={anim:'heavy_windup',progress:a.time/CUT.wind};mark(w,e,'cut',e.x,e.y,CUT.range,'#efb76b',{arc:CUT.arc,direction:Math.atan2(a.dy,a.dx),progress:a.time/CUT.wind});}
   else{if(!a.hit){a.hit=true;for(const victim of targets(w)){const vx=victim.x-e.x,vy=victim.y-e.y,distance=Math.hypot(vx,vy);if(distance<=CUT.range&&(distance<.1||(vx*a.dx+vy*a.dy)/distance>=Math.cos(CUT.arc/2))&&lineClear(e,victim,.05,w.arena))dealDamage(w,victim,power(w,e,e.dmg)*CUT.mult,e);}fx(w,'slash',{x:e.x,y:e.y,dx:a.dx,dy:a.dy,radius:CUT.range,arc:CUT.arc,color:'#ffe2ae',h:.9,sparks:16,duration:.4});w.combatEvents.push({kind:'soldierCut'});}
    e.pose={anim:'heavy_attack',progress:Math.min(1,(a.time-CUT.wind)/.35)};}
   e.animation=e.pose.anim;if(a.time>=CUT.wind+.4){e.cut=null;e.abilityCd=CUT.cooldown;e.atkTimer=.5;}return;
  }
  e.abilityCd=Math.max(0,e.abilityCd-dt);if(e.abilityCd<=0&&d<=CUT.range&&lineClear(e,t,.05,w.arena)){e.cut={time:0,dx:dx/d,dy:dy/d,hit:false};e.actionId++;return;}
 }
 if(e.castRecovery){const a=e.castRecovery;a.time+=dt;e.pose={anim:a.time<.15?a.clip:'recover',progress:a.time<.15?a.time/.15:Math.min(1,(a.time-.15)/.15)};e.animation=e.pose.anim;if(a.time>=.3)e.castRecovery=null;return;}
 if(STRIKE_CLIPS[e.typeIndex]){
  const clip=STRIKE_CLIPS[e.typeIndex],orc=e.typeIndex===10,wind=orc?SMASH.wind:.25,swing=.15,total=orc?SMASH.total:.6,range=(orc?SMASH.range:1.4*e.type.sc)+(t.radius||.3);
  if(e.slam){const a=e.slam;a.time+=dt;e.angle=a.angle;
   if(a.time<SLAM.wind+SLAM.flight)mark(w,e,'landing',a.px,a.py,SLAM.radius,SLAM.color,{fx:'dangerRune',progress:Math.min(1,a.time/(SLAM.wind+SLAM.flight))});
   if(a.time<SLAM.wind){e.pose={anim:'smash_windup',progress:a.time/SLAM.wind};mark(w,e,'slam',a.px,a.py,SLAM.radius,SLAM.color,{fx:'dangerRune',progress:a.time/SLAM.wind,mood:'plain'});}
   else if(a.time<SLAM.wind+SLAM.flight){const u=Math.min(1,(a.time-SLAM.wind)/SLAM.flight);e.x=a.sx+(a.px-a.sx)*u;e.y=a.sy+(a.py-a.sy)*u;e.jumpZ=Math.sin(u*Math.PI)*3;e.pose={anim:'smash_windup',progress:1};}
   else{e.x=a.px;e.y=a.py;e.jumpZ=0;if(!a.hit){a.hit=true;w.combatEvents.push({kind:'orcSlam'});fx(w,'groundBreak',{x:a.px,y:a.py,radius:SLAM.radius,color:'#bfa282',shake:.5,duration:1.2});area(w,e,a.px,a.py,SLAM.radius,e.dmg,SLAM.mult,{color:SLAM.color,kind:'leap'});}
    e.pose=a.time<SLAM.wind+SLAM.flight+SLAM.hit?{anim:'smash',progress:(a.time-SLAM.wind-SLAM.flight)/SLAM.hit}:{anim:'recover',progress:Math.min(1,(a.time-SLAM.wind-SLAM.flight-SLAM.hit)/(SLAM.total-SLAM.wind-SLAM.flight-SLAM.hit))};}
   e.animation=e.pose.anim;if(a.time>=SLAM.total){e.slam=null;e.abilityCd=SLAM.cooldown;e.atkTimer=Math.max(e.atkTimer,.6);}return;
  }
  if(e.volley){const v=e.volley;v.time+=dt;e.angle=Math.atan2(v.dx,v.dy);
   if(v.time<FEATHER.wind){e.pose={anim:'feather_windup',progress:v.time/FEATHER.wind};featherDirs(v).forEach((q,j)=>{for(let i=1;i<=Math.floor(FEATHER.reach);i++)mark(w,e,'f'+j+'-'+i,e.x+q.x*i,e.y+q.y*i,.15,FEATHER.color);});}
   else{if(!v.fired){v.fired=true;for(const q of featherDirs(v))shoot(w,e,q.x,q.y,e.dmg,FEATHER.speed,FEATHER.reach/FEATHER.speed,'feather',FEATHER.mult);}
    e.pose=v.time<FEATHER.wind+FEATHER.throw?{anim:'feather',progress:(v.time-FEATHER.wind)/FEATHER.throw}:{anim:'recover',progress:Math.min(1,(v.time-FEATHER.wind-FEATHER.throw)/(FEATHER.total-FEATHER.wind-FEATHER.throw))};}
   e.animation=e.pose.anim;if(v.time>=FEATHER.total){e.volley=null;e.abilityCd=FEATHER.cooldown;e.atkTimer=Math.max(e.atkTimer,.6);}return;
  }
  if(e.strike){const a=e.strike;a.time+=dt;e.angle=a.angle;
   if(a.time<wind){e.pose={anim:clip+'_windup',progress:a.time/wind};if(orc)mark(w,e,'smash',a.px,a.py,SMASH.radius,'#ff9a5a',{fx:'dangerRune',progress:a.time/wind,mood:'plain'});}
   else{if(!a.hit){a.hit=true;if(orc)area(w,e,a.px,a.py,SMASH.radius,e.dmg,SMASH.mult,{color:'#ff9a5a',kind:'leap'});else{const victim=w.actors.find(x=>x.id===a.target);if(alive(victim)&&Math.hypot(victim.x-e.x,victim.y-e.y)<=range&&lineClear(e,victim,.05,w.arena))hurt(w,e,victim,e.dmg);}}
    e.pose=a.time<wind+swing?{anim:clip,progress:(a.time-wind)/swing}:{anim:'recover',progress:Math.min(1,(a.time-wind-swing)/(total-wind-swing))};}
   e.animation=e.pose.anim;if(a.time>=total)e.strike=null;return;
  }
  const line=lineClear(e,t,.05,w.arena),harpy=e.typeIndex===7;
  if(orc){e.abilityCd=Math.max(0,e.abilityCd-dt);if(e.abilityCd<=0&&d<=SLAM.range&&line){const landing=resolvePosition(t,e.radius,w.arena);e.slam={time:0,angle:e.angle,hit:false,sx:e.x,sy:e.y,px:landing.x,py:landing.y};e.actionId++;e.pose={anim:'smash_windup',progress:0};e.animation=e.pose.anim;return;}}
  if(harpy){e.abilityCd=Math.max(0,e.abilityCd-dt);if(e.abilityCd<=0&&d<=FEATHER.range&&d>=FEATHER.min&&line){e.volley={time:0,dx:dx/d,dy:dy/d,fired:false};e.actionId++;e.pose={anim:'feather_windup',progress:0};e.animation=e.pose.anim;return;}}
  const tac=plan(e,t,mates(w,t),{range,shoot:harpy?FEATHER.range:0,ready:harpy?e.abilityCd<=0:e.atkTimer<=0,lineOk:line,dt});
  if(d>range||!line){if(tac.goal)move(w,e,tac.goal,e.spd*tac.speed,dt);else e.animation='idle';}
  else if(e.atkTimer<=0){const reach=Math.min(d,SMASH.reach);e.strike={time:0,target:t.id,angle:e.angle,hit:false,px:e.x+dx/d*reach,py:e.y+dy/d*reach};e.atkTimer=R.tuning.meleeInterval;e.actionId++;e.pose={anim:clip+'_windup',progress:0};e.animation=e.pose.anim;}
  else e.animation='idle';return;
 }
 if(rk==='Arqueiro'){
  if(e.rain){const a=e.rain;a.time+=dt;e.angle=Math.atan2(a.tx-e.x,a.ty-e.y);
   if(a.time<RAIN.wind){e.pose={anim:'attack',progress:Math.min(.5,a.time/RAIN.wind*.5)};mark(w,e,'rain',a.tx,a.ty,RAIN.radius,RAIN.color,{fx:'dangerRune',progress:a.time/RAIN.wind,mood:'plain'});}
   else{if(!a.fired){a.fired=true;w.hostileZones.push({id:w.nextId++,source:e.id,x:a.tx,y:a.ty,radius:RAIN.radius,delay:RAIN.fall,life:.05,span:.05,tick:.001,damage:Math.max(1,Math.round(power(w,e,e.dmg)*RAIN.mult)),color:RAIN.color,gearWave:e.gearWave});fx(w,'arrowRain',{x:a.tx,y:a.ty,radius:RAIN.radius,count:RAIN.count,fall:RAIN.fall,color:RAIN.color,duration:RAIN.fall+.6});}
    e.pose={anim:'attack',progress:Math.min(1,.5+(a.time-RAIN.wind)/.3*.5)};}
   e.animation='attack';if(a.time>=RAIN.total){e.rain=null;e.rainCd=RAIN.cooldown;e.atkTimer=Math.max(e.atkTimer,.6);}return;
  }
  if(!e.ability){e.rainCd=Math.max(0,(e.rainCd??RAIN.initial[0]+w.random()*(RAIN.initial[1]-RAIN.initial[0]))-dt);if(e.rainCd<=0&&d<=RAIN.range&&d>=RAIN.min){const q=resolvePosition({x:t.x,y:t.y},.3,w.arena);e.rain={time:0,tx:q.x,ty:q.y,fired:false};e.actionId++;e.pose={anim:'attack',progress:0};e.animation='attack';return;}}
 }
 if(e.typeIndex===4&&!e.summoned){
  if(e.howl){const a=e.howl;a.time+=dt;e.pose={anim:'howl',progress:Math.min(1,a.time/HOWL.total)};e.animation='howl';
   if(a.time<HOWL.wind)mark(w,e,'howl',e.x,e.y,.5+HOWL.radius*a.time/HOWL.wind,HOWL.color,{fx:'dangerRune',progress:a.time/HOWL.wind,mood:'aura',noFill:true,harmless:true});
   else if(!a.called){a.called=true;callPack(w,e);}
   if(a.time>=HOWL.total){e.howl=null;e.howlCd=HOWL.cooldown;e.atkTimer=Math.max(e.atkTimer,.8);}return;
  }
  if(!e.ability){e.howlCd=Math.max(0,(e.howlCd??HOWL.initial[0]+w.random()*(HOWL.initial[1]-HOWL.initial[0]))-dt);
   if(e.howlCd<=0&&d<=HOWL.range){const alive=w.actors.filter(a=>a.hp>0&&a.typeIndex===4);if(alive.filter(a=>a.summoned===e.id).length<HOWL.cap&&alive.length<HOWL.hounds){e.howl={time:0,called:false};w.combatEvents.push({kind:'wolfHowl'});fx(w,'roar',{x:e.x,y:e.y,radius:HOWL.radius,color:HOWL.color,duration:HOWL.wind});e.actionId++;e.pose={anim:'howl',progress:0};e.animation='howl';return;}}}
 }
 if(e.type.id==='cryptHound'){
 const base=e.dmg;e.dmg=power(w,e,base);const busy=Hound.update(e,dt,{target:()=>target(w,e),bound:(x,y)=>resolvePosition({x,y},.5,w.arena),sweep:(ax,ay,bx,by)=>{
 const q=moveCircle({x:ax,y:ay},{x:bx-ax,y:by-ay},.5,w.arena,{slide:false}),len=Math.hypot(bx-ax,by-ay);let hit=q.blocked?{t:len?q.distance/len:0,target:null}:null;
 const wall=firstWallHit(w,{x:ax,y:ay},{x:bx,y:by},.5);if(wall&&(!hit||wall.t<=hit.t))hit={t:wall.t,target:null};for(const a of targets(w)){const f=Hound.circleHit(ax,ay,bx,by,a.x,a.y,.5);if(f!==null&&(!hit||f<hit.t))hit={t:f,target:a};}return hit;},damage:(a,n)=>dealDamage(w,a,n,e)});e.dmg=base;
 if(busy){const a=e.ability;if(a){e.angle=Math.atan2(a.dx,a.dy);e.animation=a.phase==='charge'?'charge':a.phase==='recover'?'recover':'windup';e.pose={anim:e.animation,progress:Math.min(1,a.time/(a.phase==='windup'?Hound.ability.windup:a.phase==='recover'?Hound.ability.recovery:Hound.ability.distance/Hound.ability.speed))};if(a.phase==='windup')for(let i=0;i<=6;i++)mark(w,e,i,a.sx+a.dx*a.distance*i/6,a.sy+a.dy*a.distance*i/6,.5,Hound.ability.color);}return;}
 }else if(e.type.id==='warAcolyte'){
 if(Acolyte.update(e,dt,{target:()=>target(w,e),allies:()=>w.actors.filter(a=>a.team==='enemy')})){const a=e.ability;if(a){e.animation=a.phase==='channel'?'channel':'windup';e.pose={anim:e.animation,progress:a.time/(a.phase==='channel'?Acolyte.skill.duration:Acolyte.skill.windup)};mark(w,e,'aura',e.x,e.y,Acolyte.skill.radius,Acolyte.skill.color,{fx:'dangerRune',progress:1,mood:'aura',noFill:true});}return;}
 }else{
 const baseDef=e.typeIndex===0?null:R.abilities[rk],def=baseDef&&e.typeIndex===3?{...baseDef,windup:2}:baseDef;if(e.ability){const a=e.ability;a.time+=dt;e.animation='attack';e.pose={anim:e.typeIndex===0?'heavy_windup':e.typeIndex===3?'eruption_windup':'attack',progress:Math.min(1,a.time/def.windup*(e.typeIndex===0||e.typeIndex===3?1:.5))};
 if(a.phase==='air'){const u=Math.min(1,a.time/.45);e.x=a.sx+(a.tx-a.sx)*u;e.y=a.sy+(a.ty-a.sy)*u;e.jumpZ=Math.sin(u*Math.PI)*2.7;e.pose={anim:'attack',progress:.5+u*.5};if(u>=1){e.jumpZ=0;area(w,e,a.tx,a.ty,def.radius,e.dmg,def.mult,def);e.ability=null;e.abilityCd=def.cooldown;e.atkTimer=1;}}
 else if(a.time+1e-9>=def.windup){if(def.kind==='powerShot')shoot(w,e,a.dx,a.dy,e.dmg,18,15/18,'arrow',def.mult);else if(def.kind==='leap'){a.phase='air';a.time=0;a.sx=e.x;a.sy=e.y;}else{area(w,e,a.tx,a.ty,def.radius,e.dmg,def.mult,def);if(def.kind==='fire')w.hostileZones.push({id:w.nextId++,source:e.id,x:a.tx,y:a.ty,radius:def.radius,life:3,span:3,tick:1,damage:Math.max(1,Math.round(power(w,e,e.dmg)*.3)),fire:true,color:def.color});}if(def.kind!=='leap'){e.ability=null;e.abilityCd=def.cooldown;e.atkTimer=1;}}
 if(!e.ability&&(e.typeIndex===0||e.typeIndex===3)){e.castRecovery={time:0,clip:e.typeIndex===0?'heavy_attack':'eruption_cast'};e.actionId++;e.pose={anim:e.castRecovery.clip,progress:0};}
 if(e.ability){if(def.kind==='powerShot')for(let i=1;i<=15;i++)mark(w,e,i,e.x+a.dx*i,e.y+a.dy*i,.2,def.color);else mark(w,e,'area',a.tx,a.ty,def.radius,def.color,{fx:'dangerRune',progress:a.phase==='air'?1:Math.min(1,a.time/def.windup),mood:def.kind==='fire'?'fire':'plain'});}return;
 }
 e.abilityCd=Math.max(0,e.abilityCd-dt);if(def&&e.abilityCd<=0&&d<=def.range&&d>=(def.minRange||0)){const p=def.kind==='heavy'?e:def.kind==='leap'?resolvePosition(t,e.radius,w.arena):t;e.ability={phase:'windup',time:0,tx:p.x,ty:p.y,dx:dx/d,dy:dy/d};e.actionId++;return;}
 }
 if(e.timer>0){e.animation='attack';e.pose={anim:'attack',progress:Math.min(1,e.animationTime/.3)};return;}
 const range=R.ranged[rk]||(e.typeIndex===4?R.basic.hound.range:e.typeIndex===5?R.basic.acolyte.range:1.4*e.type.sc)+(R.ranged[rk]?0:(t.radius||.3));
 const line=lineClear(e,t,.05,w.arena),tac=plan(e,t,mates(w,t),{range,shoot:R.ranged[rk]||0,ready:e.atkTimer<=0,lineOk:line,dt});
 if(d>range||!line)move(w,e,tac.goal||t,e.spd*tac.speed,dt);
 else{if(R.ranged[rk]&&tac.goal){const x=e.x,y=e.y;move(w,e,tac.goal,e.spd*tac.speed,dt);if(tac.mode==='strafe'&&Math.hypot(e.x-x,e.y-y)<1e-4)e.tac.side=-e.tac.side;}else e.animation='idle';if(e.atkTimer<=0){e.atkTimer=R.ranged[rk]?R.basic.rangedInterval:e.typeIndex===4?R.basic.hound.interval:e.typeIndex===5?R.basic.acolyte.interval:R.tuning.meleeInterval;e.animation='attack';e.animationTime=0;e.timer=.3;e.actionId++;if(R.ranged[rk])shoot(w,e,dx/d,dy/d,e.dmg,rk==='Arqueiro'?12:8,2,rk==='Arqueiro'?'arrow':'magic');else hurt(w,e,t,e.dmg);}}
}
export function tickHostiles(w,dt){
 w.effects=w.effects.filter(f=>!f.warAura);for(const a of w.actors){if(!warBuffActive(w,a)){a.warBuff=null;continue;}if(a.hp>0)w.effects.push({id:'war-aura-'+a.id,warAura:true,fx:'dangerRune',x:a.x,y:a.y,radius:a.radius+.35,color:'#ed8051',harmless:true,noFill:true,progress:1,visual:true,ground:true,time:0,duration:10});}

 w.effects=w.effects.filter(f=>!f.hostileShot);for(const s of [...w.hostileShots]){const e=w.actors.find(a=>a.id===s.source);const travel=Math.min(s.remaining,s.speed*dt),end={x:s.x+s.dx*travel,y:s.y+s.dy*travel};let hit=null;
 for(const t of targets(w)){const k=Hound.circleHit(s.x,s.y,end.x,end.y,t.x,t.y,.6);if(k!==null&&(!hit||k<hit.t))hit={t:k,target:t};}
 const wall=firstWallHit(w,s,end);const q=moveCircle(s,{x:end.x-s.x,y:end.y-s.y},.1,w.arena,{slide:false}),solid=q.blocked?(travel?q.distance/travel:0):Infinity;
 if(wall&&wall.t<=solid&&(!hit||wall.t<=hit.t)){absorbWallProjectile(w,s,end,s.damage);s.remaining=0;}else if(solid!==Infinity&&(!hit||solid<=hit.t))s.remaining=0;else if(hit){const result=dealDamage(w,hit.target,s.damage,e);if(s.kind==='web'&&!result.blocked&&(result.applied>0||result.absorbed>0)&&hit.target.hp>0){hit.target.rootTime=2;}if(!e)hitFx(w,hit.target,s,{color:s.kind==='arrow'?'#f2e2a0':s.kind==='feather'?FEATHER.color:'#d08cff',size:.9,mood:'pierce'});s.remaining=0;}
 s.x=end.x;s.y=end.y;s.remaining-=travel;if(s.remaining>0)w.effects.push({id:`shot-${s.id}`,hostileShot:true,fx:'projectile',shot:s.kind,rogueTrail:s.rogueTrail,dx:s.dx,dy:s.dy,x:s.x,y:s.y,radius:s.kind==='arrow'?.16:s.kind==='feather'?.2:.3,color:s.kind==='web'?'#e3e9ec':s.kind==='arrow'?'#edce77':s.kind==='feather'?FEATHER.color:'#ff7755',visual:true,time:0,duration:10});if(s.remaining<=1e-9)w.hostileShots=w.hostileShots.filter(a=>a!==s);
 }
 // Poças com `delay` só avisam (cor clara) e depois causam dano a cada segundo; `gearWave` vem da fonte ou do próprio dado.
 for(const z of w.hostileZones){if(z.delay>0){z.delay-=dt;continue;}const active=Math.min(dt,z.life);z.tick-=active;while(z.tick<=1e-9){for(const t of targets(w))if(Math.hypot(t.x-z.x,t.y-z.y)<=z.radius)dealDamage(w,t,z.damage,{gearWave:z.gearWave??w.actors.find(a=>a.id===z.source)?.gearWave??1});z.tick++;}z.life-=dt;}
 w.hostileZones=w.hostileZones.filter(z=>z.life>1e-9);w.effects=w.effects.filter(f=>!f.hostileZone);for(const z of w.hostileZones)w.effects.push({id:`zone-${z.id}`,hostileZone:true,x:z.x,y:z.y,radius:z.radius,color:z.delay>0?'#c6d48a':z.color||'#ff8951',visual:true,ground:true,fixedRadius:true,time:0,duration:10,...(z.fire&&!(z.delay>0)?{fx:'fireField',remaining:z.life,span:z.span||z.life}:{})});
}
