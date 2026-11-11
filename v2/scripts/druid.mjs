import {schoolSynergy} from './skill-synergy.mjs';
// Druida em combate: magias de raio, vento e plantas na forma humana, garras na forma de lobo.
// Unidades de mundo, segundos, atualização por dt. O renderizador lê w.druidAction (pose) e os efeitos `fx`.
import {dealDamage} from './combat.mjs';
import {lineClear,moveCircle,resolvePosition} from './terrain.mjs';
import {fx} from './vfx-events.mjs';
import {druidActionLearned,WOLF,wolfDrain,isWolf,normalizeDruidPack,DRUID_SUMMONS,DRUID_ADVANCED,druidRankFactor,druidTornadoFactor,druidHowlBonus,druidHealShare} from './druid-model.mjs';
import {spawnCompanion} from './companions.mjs';

// Recargas das habilidades em 4 s desde 08/11/2026 (docs/habilidades/arvores.json); Faísca e Garras mantêm o ritmo do ataque básico.
export const HUMAN_ACTIONS=[
 {id:'spark',name:'Faísca',cost:0,cooldown:.55,duration:.45,release:.17,range:10,width:.45,multiplier:.45,clip:'cast'},
 {id:'chain',name:'Corrente de Raios',cost:22,cooldown:4,duration:.5,release:.2,range:10,pick:2.5,jumpRange:5,jumps:1,multiplier:1.2,falloff:.8,clip:'cast'},
 {id:'roots',name:'Raízes',cost:18,cooldown:4,duration:.6,release:.33,range:10,radius:2.4,root:2,multiplier:.8,clip:'slam'},
 {id:'dodge',name:'Esquiva',cost:0,cooldown:3},
 {id:'storm',name:'Tempestade',cost:35,cooldown:4,duration:.7,release:.4,range:10,radius:3.5,time:4,interval:.5,targets:3,multiplier:.6,clip:'cast_up'},
 {id:'rejuvenate',name:'Rejuvenescer',cost:25,cooldown:4,duration:.6,release:.3,heal:.3,time:5,clip:'cast_up'},
 // Vento (docs/habilidades/arvores.json): o turbilhão atravessa a fila e empurra para os lados; o tornado anda devagar,
 // puxa para o centro e, com o Furacão, cresce, dura mais e explode no fim.
 {id:'turbilhao',name:'Turbilhão',cost:12,cooldown:4,duration:.45,release:.2,range:9,speed:10,radius:.9,push:.6,multiplier:.6,clip:'cast'},
 {id:'tornado',name:'Tornado',cost:30,cooldown:4,duration:.6,release:.35,range:10,radius:1.8,time:4,drift:1.2,pull:1.6,interval:.4,multiplier:.25,clip:'cast_up',hurricane:{radius:2.7,time:6,multiplier:1.2,push:1.5}},
 {id:'lobo',name:'Lobo',cost:30,cooldown:8,duration:.7,release:.35,range:2,multiplier:0,clip:'cast_up'},
 {id:'calamidade',name:'Calamidade',cost:55,cooldown:24,duration:.9,release:.55,range:10,multiplier:DRUID_ADVANCED.calamity.multiplier,clip:'cast_up'},
 {id:'florestaTropical',name:'Floresta Tropical',cost:45,cooldown:20,duration:.8,release:.45,range:10,multiplier:0,clip:'cast_up'},
 {id:'escudoDeFolhas',name:'Escudo de Folhas',cost:25,cooldown:18,duration:.6,release:.3,multiplier:0,clip:'cast_up'},
 {id:'liderDaMatilha',name:'Líder da Matilha',cost:20,cooldown:12,duration:.5,release:.25,range:DRUID_ADVANCED.leader.range,multiplier:0,clip:'cast'},
];
export const WOLF_ACTIONS=[
 {id:'claws',name:'Garras',cost:0,cooldown:.42,duration:.42,release:.2,range:2.3,arc:Math.PI*.72,multiplier:.75,clips:['claw_1','claw_2'],lock:true},
 {id:'leap',name:'Salto Feroz',cost:15,cooldown:4,duration:.6,release:.47,advance:[.1,.45],distance:6,radius:2.2,multiplier:1.5,clip:'leap',lock:true},
 {id:'howl',name:'Uivo',cost:0,cooldown:4,duration:.7,release:.25,radius:6,slow:.35,slowTime:3,frenzy:.25,frenzyTime:6,clip:'howl',lock:true},
 {id:'dodge',name:'Esquiva',cost:0,cooldown:3},
 // Corte Sangrento: sangramento renovado (não soma). Garra de Gelo: lentidão; chefes só recebem o dano.
 {id:'corteSangrento',name:'Corte Sangrento',cost:12,cooldown:4,duration:.42,release:.2,range:4.6,arc:Math.PI,multiplier:.9,bleed:{time:4,interval:.5,multiplier:.15},clip:'claw_1',lock:true},
 {id:'garraDeGelo',name:'Garra de Gelo',cost:15,cooldown:4,duration:.42,release:.2,range:3,arc:Math.PI*.45,multiplier:1.3,slow:.5,slowTime:2.5,clip:'claw_2',lock:true},
];
export const druidActions=w=>isWolf(w)?WOLF_ACTIONS:HUMAN_ACTIONS;
const COLORS={bolt:'#bfe4ff',nature:'#8fd16a',wolf:'#e0b07a',wind:'#d6f4ff',blood:'#d03a3a',ice:'#9fe0ff'};
const living=e=>e.team==='enemy'&&e.hp>0&&!e.dead;
const isBoss=(w,e)=>e===w.boss||e.isBoss;
const actionOf=(list,id)=>list.find(a=>a.id===id);
const gearFactor=w=>1-Math.min(50,Math.max(0,w.modifiers?.gearCooldown||0))/100;

export function initializeDruid(w,character){
 w.druidPack=normalizeDruidPack(character?.druidPack);
 Object.assign(w,{druidRanks:character?.druidRanks||{},druidForm:'human',druidAction:null,druidCooldowns:{},druidStorms:[],druidWinds:[],druidTornados:[],druidHeal:null,druidLeafShield:null,druidHunt:null,druidFrenzy:0,druidFormReady:0,druidClawSide:0});
}
// Morte, troca de cena e reinício: nada do que a Druida lançou continua no mundo.
export function clearDruid(w){
 w.druidPack=w.player?.hp>0?snapshotDruidPack(w):[];
 w.actors=(w.actors||[]).filter(a=>!['druidWolf','carnivorousPlant','forestPlant'].includes(a.companion));
 w.druidAction=null;w.druidStorms=[];w.druidWinds=[];w.druidTornados=[];w.druidHeal=null;w.druidFrenzy=0;
 w.druidLeafShield=null;w.druidHunt=null;
 if(w.effects)w.effects=w.effects.filter(f=>!f.druidRing&&!f.druidAdvanced);
 for(const a of w.actors||[]){delete a.druidBleed;delete a.druidChill;}
 if(w.player)w.player.timer=0;
}
export const druidCooldown=(w,id)=>Math.max(0,(w.druidCooldowns?.[id]||0)-w.time);
// Poder base das magias e das garras, com os bônus do nó de cada ação.
function power(w,def){
 const r=w.druidRanks||{},p=w.player;
 const node=def.id==='spark'?1+(r.spark||0)*.06:def.id==='roots'?1+(r.roots||0)*.1:def.id==='turbilhao'?1+(r.turbilhao||0)*.08:def.id==='tornado'?druidTornadoFactor(r):['storm','leap','garraDeGelo','corteSangrento'].includes(def.id)?druidRankFactor(r,def.id):1;
 const wolf=isWolf(w)?(1+(r.wolf||0)*WOLF.damagePerRank)*(w.druidFrenzy>w.time?1+druidHowlBonus(r):1):1;
 const factor=Math.round((node+(def.id==='tornado'?0:schoolSynergy('druid',r,def.id==='claws'?'wolf':def.id)))*1e9)/1e9;
 return p.spellDamage*def.multiplier*factor*wolf;
}
export function druidAction(w,index=0,aim=w.aim){
 const p=w.player,form=w.druidForm==='wolf'?'wolf':'human',list=form==='wolf'?WOLF_ACTIONS:HUMAN_ACTIONS,def=list[index];
 if(!def||def.id==='dodge'||w.classId!=='druid'||w.paused||p.hp<=0||p.dead||w.dash.remaining>0)return false;
 if(!druidActionLearned(form,index,w.druidRanks)||w.druidAction||w.castCooldown>1e-9||p.mp<def.cost||druidCooldown(w,def.id)>1e-9)return false;
 if(def.id==='lobo'&&w.actors.filter(a=>a.companion==='druidWolf'&&a.hp>0).length>=packLimit(w))return false;
 const dx=aim.x-p.x,dy=aim.y-p.y,d=Math.hypot(dx,dy);
 if(!Number.isFinite(d)||d<1e-9)return false;
 if(def.lock&&p.rootTime>0)return false;
 const reach=Math.min(def.range||d,d),target={x:p.x+dx/d*reach,y:p.y+dy/d*reach};
 const forest=def.id==='florestaTropical'?forestPositions(w,target):null;
 const prey=def.id==='liderDaMatilha'?huntTarget(w,aim):null;
 if(def.id==='florestaTropical'&&forest.length!==DRUID_ADVANCED.forest.count)return false;
 if(def.id==='calamidade'&&!lineClear(p,target,.05,w.arena))return false;
 if(def.id==='liderDaMatilha'&&(!prey||!w.actors.some(a=>a.companion==='druidWolf'&&a.hp>0)))return false;
 p.mp-=def.cost;
 w.druidCooldowns[def.id]=w.time+(['spark','claws'].includes(def.id)?def.cooldown:def.cooldown*gearFactor(w));
 const clip=def.clips?def.clips[w.druidClawSide=(w.druidClawSide+1)%2]:def.clip;
 w.druidAction={form,index,id:def.id,clip,time:0,released:false,duration:def.duration,dx:dx/d,dy:dy/d,target:{x:p.x+dx/d*reach,y:p.y+dy/d*reach},origin:{x:p.x,y:p.y},travel:def.distance?Math.min(def.distance,Math.max(0,d-.6)):0,lock:!!def.lock};
 w.druidAction.prey=prey?.id;w.druidAction.forest=forest;
 w.castCooldown=def.duration;p.angle=Math.atan2(dx,dy);p.animation=clip;p.animationTime=0;p.actionId++;p.timer=def.duration;
 return true;
}
// Pose do jogador durante a ação: o clipe avança pelo tempo da regra.
export function druidPose(w){const s=w.druidAction;return s?{anim:s.clip,progress:Math.min(1,s.time/s.duration)}:null;}

// Alterna entre a forma humana e a de lobo. A forma de lobo exige o nó aprendido e alguma mana.
export function toggleWolf(w){
 const p=w.player;
 if(w.classId!=='druid'||!(w.druidRanks?.wolf>0)||w.paused||p.hp<=0||p.dead||w.druidAction||w.dash.remaining>0||(w.druidFormReady||0)>w.time+1e-9)return false;
 if(w.druidForm!=='wolf'&&p.mp<10)return false;
 shift(w,w.druidForm==='wolf'?'human':'wolf',WOLF.toggleCooldown);return true;
}
function shift(w,form,cooldown){
 const p=w.player;w.druidForm=form;p.model=form==='wolf'?'druidWolf':'druid';p.animation='idle';p.animationTime=0;p.actionId++;p.timer=0;
 w.druidFormReady=w.time+cooldown;w.castCooldown=Math.max(w.castCooldown,WOLF.shift);
 fx(w,'summonBurst',{x:p.x,y:p.y,radius:1.3,color:form==='wolf'?COLORS.wolf:COLORS.nature,duration:.6});
 fx(w,'impact',{x:p.x,y:p.y,h:1.1,color:COLORS.nature,size:1.2,radius:1,duration:.35});
}
export function tickDruid(w,dt){
 if(w.classId!=='druid'||w.paused)return;
 const p=w.player;
 if(p.hp<=0||p.dead){clearDruid(w);return;}
 if(w.druidLeafShield&&w.time>=w.druidLeafShield.until)w.druidLeafShield=null;
 if(w.druidHunt&&(w.time>=w.druidHunt.until||!w.actors.some(a=>a.id===w.druidHunt.target&&living(a))))w.druidHunt=null;
 tickStorms(w,dt);tickWinds(w,dt);tickTornados(w,dt);tickBleeds(w);tickRings(w);
 if(p.hp<=0||p.dead){clearDruid(w);return;}
 restorePack(w);
 // w.time já avançou neste quadro: cura só a parte do passo que ainda cabe na duração.
 if(w.druidHeal){const h=w.druidHeal,step=Math.max(0,Math.min(dt,h.until-(w.time-dt)));p.hp=Math.min(p.maxHp,p.hp+h.rate*step);if(w.time>=h.until-1e-9)w.druidHeal=null;}
 if(isWolf(w)){p.mp=Math.max(0,p.mp-wolfDrain(w.druidRanks)*dt);if(p.mp<=0&&!w.druidAction)shift(w,'human',WOLF.exhaustedCooldown);}
 const s=w.druidAction;if(!s)return;
 if(w.dash.remaining>0){w.druidAction=null;p.timer=0;return;}
 const def=(s.form==='wolf'?WOLF_ACTIONS:HUMAN_ACTIONS)[s.index],before=s.time;s.time+=dt;
 if(def.advance&&s.travel>0){
  const [a,b]=def.advance,elapsed=Math.max(0,Math.min(b,s.time)-Math.max(a,before));
  if(elapsed){const f=elapsed/(b-a),pos=moveCircle(p,{x:s.dx*s.travel*f,y:s.dy*s.travel*f},p.radius,w.arena,{slide:false});p.x=pos.x;p.y=pos.y;if(pos.blocked)s.travel=0;}
 }
 if(!s.released&&s.time+1e-9>=def.release){s.released=true;release(w,s,def);}
 if(s.time+1e-9>=s.duration){w.druidAction=null;p.timer=0;w.castCooldown=0;if(isWolf(w)&&p.mp<=0)shift(w,'human',WOLF.exhaustedCooldown);}
}
function release(w,s,def){
 const p=w.player;
 if(def.id==='escudoDeFolhas'){
  const amount=Math.max(1,Math.round(p.maxHp*DRUID_ADVANCED.leaves.share));w.druidLeafShield={remaining:amount,max:amount,until:w.time+DRUID_ADVANCED.leaves.time};
  fx(w,'summonBurst',{x:p.x,y:p.y,radius:1.2,color:COLORS.nature,duration:.5});return;
 }
 if(def.id==='calamidade'){
  const C=DRUID_ADVANCED.calamity;
  w.druidTornados.push({id:w.nextId++,x:s.target.x,y:s.target.y,dx:s.dx,dy:s.dy,...C,until:w.time+C.time,next:w.time+C.interval,damage:Math.floor(power(w,def)),calamity:true,boltNext:w.time+C.boltInterval,boltDamage:Math.floor(power(w,{...def,multiplier:C.boltMultiplier})),nextFx:0});
  fx(w,'summonBurst',{x:s.target.x,y:s.target.y,radius:C.radius,color:COLORS.bolt,duration:.6});w.combatEvents?.push({kind:'scytheWind'});return;
 }
 if(def.id==='florestaTropical'){
  w.actors=w.actors.filter(a=>a.companion!=='forestPlant');
  const r=w.druidRanks,k=druidRankFactor(r,'plantaCarnivora'),damageK=k+schoolSynergy('druid',r,'plantaCarnivora');
  for(const at of s.forest){const a=spawnCompanion(w,'forestPlant',at,{hp:p.maxHp*DRUID_SUMMONS.plantHp*k,damage:p.spellDamage*DRUID_SUMMONS.plantDamage*damageK});a.forestCenter={...s.target};}
  fx(w,'summonRune',{x:s.target.x,y:s.target.y,radius:DRUID_ADVANCED.forest.radius,color:COLORS.nature,duration:1});return;
 }
 if(def.id==='liderDaMatilha'){
  const t=w.actors.find(e=>e.id===s.prey&&living(e));
  if(t&&lineClear(p,t,.05,w.arena)&&Math.hypot(t.x-p.x,t.y-p.y)<=DRUID_ADVANCED.leader.range+(t.radius||.3)&&w.actors.some(a=>a.companion==='druidWolf'&&a.hp>0)){
   w.druidHunt={target:t.id,until:w.time+DRUID_ADVANCED.leader.markTime,id:w.nextId++};w.combatEvents?.push({kind:'wolfHowl'});
   fx(w,'roar',{x:t.x,y:t.y,radius:1.3,color:COLORS.nature,duration:.4});
  }return;
 }
 if(def.id==='lobo'){
  w.druidPack=snapshotDruidPack(w);for(let i=0;i<packLimit(w);i++)if(!(w.druidPack[i]>0))w.druidPack[i]=1;
  w.actors=w.actors.filter(a=>a.companion!=='druidWolf'||a.hp>0);
  restorePack(w);return;
 }
 if(def.id==='spark')return spark(w,s,def);
 if(def.id==='chain')return chain(w,s,def);
 if(def.id==='roots')return roots(w,s,def);
 if(def.id==='storm'){w.druidStorms.push({x:s.target.x,y:s.target.y,radius:def.radius,until:w.time+def.time,next:w.time+.25,damage:Math.max(1,Math.floor(power(w,def)))});fx(w,'stormCloud',{x:s.target.x,y:s.target.y,radius:def.radius,color:COLORS.bolt,duration:def.time});return;}
 if(def.id==='turbilhao'){w.druidWinds.push({id:w.nextId++,x:p.x+s.dx*.5,y:p.y+s.dy*.5,dx:s.dx,dy:s.dy,left:def.range,hits:new Set(),damage:Math.max(1,Math.floor(power(w,def))),nextFx:0});w.combatEvents?.push({kind:'scytheWind'});return;}
 if(def.id==='tornado'){
  const H=(w.druidRanks?.furacao||0)>0?def.hurricane:null;
  w.druidTornados.push({id:w.nextId++,x:s.target.x,y:s.target.y,dx:s.dx,dy:s.dy,radius:H?H.radius:def.radius,until:w.time+(H?H.time:def.time),next:w.time+def.interval,damage:Math.max(1,Math.floor(power(w,def))),hurricane:H?{damage:Math.max(1,Math.floor(p.spellDamage*H.multiplier*druidTornadoFactor(w.druidRanks,'furacao'))),push:H.push}:null,nextFx:0});
  fx(w,'summonBurst',{x:s.target.x,y:s.target.y,radius:H?H.radius:def.radius,color:COLORS.wind,duration:.5});w.combatEvents?.push({kind:'scytheWind'});return;
 }
 if(def.id==='rejuvenate'){w.druidHeal={until:w.time+def.time,rate:p.maxHp*druidHealShare(w.druidRanks)/def.time};fx(w,'summonRune',{x:p.x,y:p.y,radius:1.4,color:COLORS.nature,duration:.9});return;}
 if(def.id==='claws'){
  let hit=false;
  for(const e of w.actors){
   if(!living(e))continue;const x=e.x-p.x,y=e.y-p.y,n=Math.hypot(x,y);
   if(n>def.range+e.radius||n>0&&(x*s.dx+y*s.dy)/n<Math.cos(def.arc/2)||!lineClear(p,e,.05,w.arena))continue;
   if(dealDamage(w,e,Math.max(1,Math.floor(power(w,def))),p,def.name).applied>0)hit=true;
  }
  if(hit)p.mp=Math.min(p.maxMp,p.mp+WOLF.hitRestore);
  w.combatEvents?.push({kind:'scytheWind'});
  w.effects.push({id:w.nextId++,kind:'slash',fx:'slash',x:p.x,y:p.y,dx:s.dx,dy:s.dy,radius:def.range,arc:def.arc,sparks:5,time:0,duration:.2,color:COLORS.wolf,mood:'claw',visual:true});
  return;
 }
 if(def.id==='corteSangrento'||def.id==='garraDeGelo'){
  const bleed=def.bleed?Math.max(1,Math.floor(power(w,{...def,multiplier:def.bleed.multiplier}))):0;
  for(const e of w.actors){
   if(!living(e))continue;const x=e.x-p.x,y=e.y-p.y,n=Math.hypot(x,y);
   if(n>def.range+e.radius||n>0&&(x*s.dx+y*s.dy)/n<Math.cos(def.arc/2)||!lineClear(p,e,.05,w.arena))continue;
   dealDamage(w,e,Math.max(1,Math.floor(power(w,def))),p,def.name);if(!living(e))continue;
   if(def.bleed)e.druidBleed={until:w.time+def.bleed.time,next:w.time+def.bleed.interval,damage:bleed};
   if(def.slow&&!isBoss(w,e)){e.slow=Math.max(e.slow||0,def.slow);e.slowTime=Math.max(e.slowTime||0,def.slowTime);e.druidChill=w.time+def.slowTime;}
  }
  w.combatEvents?.push({kind:'scytheWind'});
  w.effects.push({id:w.nextId++,kind:'slash',fx:'slash',x:p.x,y:p.y,dx:s.dx,dy:s.dy,radius:def.range,arc:def.arc,sparks:7,time:0,duration:.22,color:def.bleed?COLORS.blood:COLORS.ice,mood:'claw',visual:true});
  return;
 }
 if(def.id==='leap'){
  for(const e of w.actors){if(!living(e)||Math.hypot(e.x-p.x,e.y-p.y)>def.radius+e.radius||!lineClear(p,e,.05,w.arena))continue;dealDamage(w,e,Math.max(1,Math.floor(power(w,def))),p,def.name);}
  fx(w,'groundBreak',{x:p.x,y:p.y,radius:def.radius,color:COLORS.wolf,shake:.12,duration:.5});w.combatEvents?.push({kind:'orcSlam'});return;
 }
 if(def.id==='howl'){
  for(const e of w.actors){if(!living(e)||Math.hypot(e.x-p.x,e.y-p.y)>def.radius+e.radius||!lineClear(p,e,.05,w.arena))continue;if(!(e.druidRoot>w.time)){e.slow=def.slow;e.slowTime=def.slowTime;}}
  w.druidFrenzy=w.time+def.frenzyTime;w.combatEvents?.push({kind:'wolfHowl'});
  fx(w,'roar',{x:p.x,y:p.y,radius:def.radius,color:COLORS.wolf,mood:'howl',shake:.08,duration:.6});
 }
}
// Raio instantâneo: o primeiro inimigo cujo corpo cruza a linha da mira; sem alvo, para no alcance ou na primeira parede.
function lineTarget(w,from,dx,dy,range,width,skip=new Set()){
 let best=null,nearest=Infinity;
 for(const e of w.actors){
  if(!living(e)||skip.has(e.id))continue;
  const along=(e.x-from.x)*dx+(e.y-from.y)*dy;if(along<0||along>range+e.radius)continue;
  if(Math.hypot(e.x-from.x-dx*along,e.y-from.y-dy*along)>width+e.radius||along>=nearest||!lineClear(from,e,.05,w.arena))continue;
  best=e;nearest=along;
 }
 return best;
}
function bolt(w,from,to,{h0=1.5,h1=1,width=1,duration=.22}={}){fx(w,'lightning',{x:from.x,y:from.y,tx:to.x,ty:to.y,h0,h1,width,color:COLORS.bolt,duration,ground:false});}
function wallPoint(w,from,dx,dy,range){const pos=moveCircle({x:from.x,y:from.y},{x:dx*range,y:dy*range},.1,w.arena,{slide:false});return {x:pos.x,y:pos.y};}
function spark(w,s,def){
 const p=w.player,from={x:p.x+s.dx*.5,y:p.y+s.dy*.5},target=lineTarget(w,p,s.dx,s.dy,def.range,def.width);
 const end=target?{x:target.x,y:target.y}:wallPoint(w,p,s.dx,s.dy,def.range);
 bolt(w,from,end,{h0:1.55,h1:target?1:.3});
 if(target){dealDamage(w,target,Math.max(1,Math.floor(power(w,def))),p,def.name);fx(w,'impact',{x:target.x,y:target.y,h:1,color:COLORS.bolt,size:.7,radius:.5,duration:.25});}
}
function chain(w,s,def){
 const p=w.player,hits=new Set();
 // Primeiro alvo: o inimigo visível mais próximo do ponto mirado; sem ninguém ali, o primeiro na linha.
 let first=null,best=def.pick;
 for(const e of w.actors){if(!living(e))continue;const d=Math.hypot(e.x-s.target.x,e.y-s.target.y)-e.radius;if(d<=best&&Math.hypot(e.x-p.x,e.y-p.y)<=def.range+e.radius&&lineClear(p,e,.05,w.arena)){best=d;first=e;}}
 first??=lineTarget(w,p,s.dx,s.dy,def.range,def.width??.6);
 const from={x:p.x+s.dx*.5,y:p.y+s.dy*.5};
 if(!first){bolt(w,from,wallPoint(w,p,s.dx,s.dy,def.range),{h0:1.55,h1:.3});return;}
 const jumps=def.jumps+(w.druidRanks?.chain||0);let current=first,previous=from,factor=1,h0=1.55;
 for(let k=0;current&&k<=jumps;k++){
  hits.add(current.id);bolt(w,previous,current,{h0,h1:1,width:1-.1*k,duration:.28});
  dealDamage(w,current,Math.max(1,Math.floor(power(w,def)*factor)),p,def.name);
  fx(w,'impact',{x:current.x,y:current.y,h:1,color:COLORS.bolt,size:.7,radius:.5,duration:.25});
  factor*=def.falloff;previous={x:current.x,y:current.y};h0=1;
  let next=null,near=def.jumpRange;
  for(const e of w.actors){if(!living(e)||hits.has(e.id))continue;const d=Math.hypot(e.x-previous.x,e.y-previous.y);if(d<=near&&lineClear(previous,e,.05,w.arena)){near=d;next=e;}}
  current=next;
 }
}
function roots(w,s,def){
 const p=w.player,r=w.druidRanks||{},hold=def.root+(r.roots||0)*.3,c=s.target;
 for(const e of w.actors){
  if(!living(e)||Math.hypot(e.x-c.x,e.y-c.y)>def.radius+e.radius)continue;
  // Chefes sofrem o dano, mas não ficam presos.
  if(e!==w.boss&&!e.isBoss){e.druidRoot=w.time+hold;e.slow=1;e.slowTime=hold;}
  dealDamage(w,e,Math.max(1,Math.floor(power(w,def))),p,def.name);
 }
 fx(w,'thorns',{x:c.x,y:c.y,radius:def.radius,color:COLORS.nature,duration:Math.max(.9,hold)});
 if(r.plantaCarnivora>0&&lineClear(p,c,.05,w.arena)){const k=druidRankFactor(r,'plantaCarnivora'),damageK=k+schoolSynergy('druid',r,'plantaCarnivora');spawnCompanion(w,'carnivorousPlant',c,{hp:p.maxHp*DRUID_SUMMONS.plantHp*k,damage:Math.floor(p.spellDamage*DRUID_SUMMONS.plantDamage*damageK+1e-9)});}
}
// Cinco posições distintas e visíveis, dentro da área e fora de sólidos. Sem espaço, a conjuração não começa.
function forestPositions(w,c){
 if(!lineClear(w.player,c,.05,w.arena))return [];
 const positions=[],candidates=Array.from({length:5},(_,i)=>({x:c.x+Math.cos(i*Math.PI*2/5)*2.6,y:c.y+Math.sin(i*Math.PI*2/5)*2.6}));candidates.push(c);
 for(const r of [2.6,1.4,3.6])for(let i=0;i<12;i++){const a=i*Math.PI/6;candidates.push({x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r});}
 for(const at of candidates){const pos=resolvePosition(at,.4,w.arena);
  if(Math.hypot(pos.x-at.x,pos.y-at.y)>.8||Math.hypot(pos.x-c.x,pos.y-c.y)>DRUID_ADVANCED.forest.radius-.4||!lineClear(c,pos,.05,w.arena)||positions.some(q=>Math.hypot(pos.x-q.x,pos.y-q.y)<1.3))continue;
  positions.push(pos);if(positions.length===DRUID_ADVANCED.forest.count)break;
 }return positions;
}
function huntTarget(w,aim){
 const C=DRUID_ADVANCED.leader,p=w.player;let best=null,near=C.pick;
 for(const e of w.actors){if(!living(e)||Math.hypot(e.x-p.x,e.y-p.y)>C.range+(e.radius||.3)||!lineClear(p,e,.05,w.arena))continue;
  const d=Math.hypot(e.x-aim.x,e.y-aim.y)-(e.radius||.3);if(d<near){near=d;best=e;}
 }return best;
}
const packLimit=w=>(w.druidRanks?.lobo||0)>0?1+Math.min(3,w.druidRanks?.alcateia||0):0;
export function snapshotDruidPack(w){
 if(w.classId!=='druid'||!(w.player?.hp>0))return [];
 const pack=normalizeDruidPack(w.druidPack).slice(0,packLimit(w));
 for(const a of w.actors||[])if(a.companion==='druidWolf'&&Number.isInteger(a.packIndex)&&a.packIndex<packLimit(w))pack[a.packIndex]=Math.max(0,Math.min(1,a.hp/a.maxHp));
 return pack;
}
function restorePack(w){
 w.druidPack=snapshotDruidPack(w);
 w.actors=w.actors.filter(a=>a.companion!=='druidWolf'||a.packIndex<packLimit(w));
 const k=1+Math.max(0,(w.druidRanks?.lobo||0)-1)*DRUID_SUMMONS.wolfPerRank,p=w.player;
 for(let i=0;i<w.druidPack.length;i++){
  const ratio=w.druidPack[i];if(!(ratio>0)||w.actors.some(a=>a.companion==='druidWolf'&&a.packIndex===i))continue;
  const a=spawnCompanion(w,'druidWolf',{x:p.x+Math.sin(i*2)*1.5,y:p.y+Math.cos(i*2)*1.5},{hp:p.maxHp*DRUID_SUMMONS.wolfHp*k,damage:p.spellDamage*DRUID_SUMMONS.wolfDamage*(k+schoolSynergy('druid',w.druidRanks,'lobo'))});
  a.hp=Math.max(1,Math.round(a.maxHp*ratio));a.packIndex=i;
 }
 // Atualiza atributos por nível/ranks preservando ferimentos, inclusive enquanto o jogador está transformado.
 const leader=(w.druidRanks?.liderDaMatilha||0)>0?w.actors.filter(a=>a.companion==='druidWolf'&&a.hp>0).sort((a,b)=>a.packIndex-b.packIndex)[0]:null;
 for(const a of w.actors)if(a.companion==='druidWolf'&&a.hp>0){const ratio=a.hp/a.maxHp;a.maxHp=Math.max(1,Math.round(p.maxHp*DRUID_SUMMONS.wolfHp*k));a.hp=Math.max(1,Math.round(a.maxHp*ratio));a.packLeader=a===leader;a.scale=.8;a.visualScale=a.packLeader?DRUID_ADVANCED.leader.scale/.8:1;a.damage=Math.max(1,Math.floor(p.spellDamage*DRUID_SUMMONS.wolfDamage*(k+schoolSynergy('druid',w.druidRanks,'lobo'))*(a.packLeader?DRUID_ADVANCED.leader.damage:1)));}
}
function tickStorms(w,dt){
 if(!w.druidStorms?.length)return;
 const def=HUMAN_ACTIONS[4];
 w.druidStorms=w.druidStorms.filter(st=>{
  while(st.next<=w.time+1e-9&&st.next<=st.until+1e-9){
   st.next+=def.interval;
   const inside=w.actors.filter(e=>living(e)&&Math.hypot(e.x-st.x,e.y-st.y)<=st.radius+e.radius);
   // Sem inimigos, o raio cai num ponto qualquer da área: mostra onde a nuvem age.
   if(!inside.length){const a=(w.random?.()??Math.random())*Math.PI*2,d=st.radius*Math.sqrt(w.random?.()??Math.random());bolt(w,{x:st.x+Math.cos(a)*d,y:st.y+Math.sin(a)*d},{x:st.x+Math.cos(a)*d,y:st.y+Math.sin(a)*d},{h0:7,h1:0,width:1.3,duration:.25});continue;}
   for(let i=0;i<def.targets&&inside.length;i++){
    const e=inside.splice(Math.floor((w.random?.()??Math.random())*inside.length),1)[0];
    bolt(w,e,e,{h0:7,h1:.6,width:1.3,duration:.25});
    dealDamage(w,e,st.damage??Math.max(1,Math.floor(w.player.spellDamage*def.multiplier)),w.player,def.name);
    fx(w,'impact',{x:e.x,y:e.y,h:.6,color:COLORS.bolt,size:.9,radius:.7,duration:.3});
   }
  }
  return w.time<st.until;
 });
}
// Turbilhão: avança em linha, fere cada inimigo uma vez e o empurra para o lado; para na primeira parede.
function tickWinds(w,dt){
 if(!w.druidWinds?.length)return;
 const def=actionOf(HUMAN_ACTIONS,'turbilhao'),p=w.player;
 w.druidWinds=w.druidWinds.filter(o=>{
  const step=Math.min(o.left,def.speed*dt),prev={x:o.x,y:o.y},pos=moveCircle(o,{x:o.dx*step,y:o.dy*step},.1,w.arena,{slide:false});
  o.x=pos.x;o.y=pos.y;o.left-=step;const sx=o.x-prev.x,sy=o.y-prev.y,len=sx*sx+sy*sy;
  for(const e of w.actors){
   if(!living(e)||o.hits.has(e.id))continue;
   const t=len?Math.max(0,Math.min(1,((e.x-prev.x)*sx+(e.y-prev.y)*sy)/len)):0;
   if(Math.hypot(e.x-prev.x-sx*t,e.y-prev.y-sy*t)>def.radius+e.radius||!lineClear(prev,e,.05,w.arena))continue;
   o.hits.add(e.id);dealDamage(w,e,o.damage,p,def.name);
   if(living(e)&&!isBoss(w,e)){const side=(e.x-o.x)*-o.dy+(e.y-o.y)*o.dx>=0?1:-1,q=moveCircle(e,{x:-o.dy*side*def.push,y:o.dx*side*def.push},e.radius,w.arena);e.x=q.x;e.y=q.y;}
  }
  if((o.nextFx-=dt)<=0){o.nextFx=.12;fx(w,'windarc',{x:o.x,y:o.y,dx:o.dx,dy:o.dy,radius:def.radius*1.1,arc:Math.PI*2,color:COLORS.wind,duration:.3});}
  return !pos.blocked&&o.left>1e-6;
 });
}
// Tornado: anda devagar na direção da mira, puxa para o centro (chefes e presos pelas Raízes não) e fere em pulsos.
// Com o Furacão, ao terminar explode e empurra para fora.
function tickTornados(w,dt){
 if(!w.druidTornados?.length)return;
 const def=actionOf(HUMAN_ACTIONS,'tornado'),p=w.player;
 w.druidTornados=w.druidTornados.filter(t=>{
  if(t.calamity)return tickCalamity(w,t,dt);
  const pos=moveCircle(t,{x:t.dx*def.drift*dt,y:t.dy*def.drift*dt},.3,w.arena);t.x=pos.x;t.y=pos.y;
  for(const e of w.actors){
   if(!living(e)||isBoss(w,e)||e.druidRoot>w.time)continue;const x=t.x-e.x,y=t.y-e.y,d=Math.hypot(x,y);
   if(d>t.radius+e.radius||d<.2)continue;const k=Math.min(d-.15,def.pull*dt),q=moveCircle(e,{x:x/d*k,y:y/d*k},e.radius,w.arena);e.x=q.x;e.y=q.y;
  }
  while(t.next<=w.time+1e-9&&t.next<=t.until+1e-9){t.next+=def.interval;for(const e of w.actors)if(living(e)&&Math.hypot(e.x-t.x,e.y-t.y)<=t.radius+e.radius)dealDamage(w,e,t.damage,p,def.name);}
  if((t.nextFx-=dt)<=0){t.nextFx=.2;fx(w,'windarc',{x:t.x,y:t.y,dx:t.dx,dy:t.dy,radius:t.radius,arc:Math.PI*2,color:COLORS.wind,duration:.35});}
  if(w.time+1e-9<t.until)return true;
  if(t.hurricane){
   for(const e of w.actors){
    if(!living(e))continue;const x=e.x-t.x,y=e.y-t.y,d=Math.hypot(x,y);
    if(d>t.radius+e.radius||!lineClear(t,e,.05,w.arena))continue;
    dealDamage(w,e,t.hurricane.damage,p,'Furacão');
    if(living(e)&&!isBoss(w,e)){const q=moveCircle(e,{x:(d>1e-6?x/d:1)*t.hurricane.push,y:(d>1e-6?y/d:0)*t.hurricane.push},e.radius,w.arena);e.x=q.x;e.y=q.y;}
   }
   fx(w,'shockwave',{x:t.x,y:t.y,radius:t.radius,color:COLORS.wind,shake:.1,duration:.5});w.combatEvents?.push({kind:'orcSlam'});
  }
  return false;
 });
}
function tickCalamity(w,t,dt){
 const C=DRUID_ADVANCED.calamity,elapsed=Math.max(0,Math.min(dt,t.until-(w.time-dt))),p=w.player;
 const pos=moveCircle(t,{x:t.dx*C.drift*elapsed,y:t.dy*C.drift*elapsed},.3,w.arena,{slide:false});t.x=pos.x;t.y=pos.y;
 for(const e of w.actors){const d=Math.hypot(t.x-e.x,t.y-e.y);
  if(!living(e)||isBoss(w,e)||e.druidRoot>w.time||d<.2||d>t.radius+(e.radius||.3)||!lineClear(t,e,.05,w.arena))continue;
  const k=Math.min(d-.15,C.pull*elapsed),q=moveCircle(e,{x:(t.x-e.x)/d*k,y:(t.y-e.y)/d*k},e.radius||.3,w.arena);e.x=q.x;e.y=q.y;
 }
 const inside=()=>w.actors.filter(e=>living(e)&&Math.hypot(e.x-t.x,e.y-t.y)<=t.radius+(e.radius||.3)&&lineClear(t,e,.05,w.arena));
 while(t.next<=w.time+1e-9&&t.next<=t.until+1e-9){t.next+=C.interval;for(const e of inside())dealDamage(w,e,t.damage,p,'Calamidade (vento)');}
 while(t.boltNext<=w.time+1e-9&&t.boltNext<=t.until+1e-9){t.boltNext+=C.boltInterval;
  const targets=inside().sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y)).slice(0,C.boltTargets);
  for(const e of targets){dealDamage(w,e,t.boltDamage,p,'Calamidade (raio)');bolt(w,e,e,{h0:6,h1:.7,width:1.5});}
 }
 return w.time<t.until-1e-9;
}
// Sangramento do Corte Sangrento: pulsos fixos até acabar; um novo corte só renova.
function tickBleeds(w){
 const def=actionOf(WOLF_ACTIONS,'corteSangrento');
 for(const e of w.actors){
  const b=e.druidBleed;if(!b)continue;
  if(!living(e)||w.time>b.until+1e-9){delete e.druidBleed;continue;}
  while(b.next<=w.time+1e-9&&b.next<=b.until+1e-9){b.next+=def.bleed.interval;dealDamage(w,e,b.damage,w.player,'Sangramento');if(!living(e))break;}
 }
}
// Anéis no chão ligados à posição real: inimigos presos pelas Raízes e a cura em andamento.
function tickRings(w){
 w.effects=w.effects.filter(f=>!f.druidRing);
 for(const a of w.actors)if(a.druidRoot>w.time&&a.hp>0)w.effects.push({id:'druid-root-'+a.id,druidRing:true,x:a.x,y:a.y,radius:a.radius+.45,color:COLORS.nature,visual:true,ground:true,fixedRadius:true,time:0,duration:10});
 const ring=(id,x,y,radius,color,time=0)=>w.effects.push({id,druidRing:true,x,y,radius,color,visual:true,ground:true,fixedRadius:true,time,duration:10});
 for(const a of w.actors){if(a.hp<=0)continue;if(a.druidBleed&&w.time<=a.druidBleed.until)ring('druid-bleed-'+a.id,a.x,a.y,a.radius+.35,COLORS.blood,1);if(a.druidChill>w.time)ring('druid-chill-'+a.id,a.x,a.y,a.radius+.4,COLORS.ice,2);}
 for(const o of w.druidWinds||[])ring('druid-wind-'+o.id,o.x,o.y,.9,COLORS.wind,2);
 for(const t of w.druidTornados||[])ring('druid-tornado-'+t.id,t.x,t.y,t.radius,COLORS.wind,t.hurricane?3:2);
 for(const t of w.druidTornados||[])if(t.calamity)w.effects.push({id:'druid-calamity-'+t.id,druidRing:true,fx:'stormVortex',x:t.x,y:t.y,radius:t.radius,color:COLORS.bolt,visual:true,time:0,duration:10});
 const p=w.player;
 const shield=w.druidLeafShield;
 if(shield?.until>w.time&&p.hp>0)w.effects.push({id:'druid-leaves',druidRing:true,fx:'leafShield',x:p.x,y:p.y,radius:1,strength:shield.remaining/shield.max,color:COLORS.nature,visual:true,time:0,duration:10});
 const hunt=w.druidHunt?.until>w.time&&w.actors.find(a=>a.id===w.druidHunt.target&&living(a));if(hunt)ring('druid-hunt',hunt.x,hunt.y,(hunt.radius||.3)+.6,'#e5ca82',1);
 for(const a of w.actors)if(a.packLeader&&a.hp>0)ring('druid-leader-'+a.id,a.x,a.y,a.radius+.3,'#d5be83',1);
 const plants=w.actors.filter(a=>a.companion==='forestPlant'&&a.hp>0);if(plants.length){const c=plants[0].forestCenter;if(c)ring('druid-forest',c.x,c.y,DRUID_ADVANCED.forest.radius,COLORS.nature,1);}
 if(w.druidHeal&&p.hp>0)w.effects.push({id:'druid-heal',druidRing:true,x:p.x,y:p.y,radius:p.radius+.65,color:'#c8f59a',visual:true,ground:true,fixedRadius:true,time:2,duration:10});
 if(isWolf(w)&&w.druidFrenzy>w.time&&p.hp>0)w.effects.push({id:'druid-frenzy',druidRing:true,x:p.x,y:p.y,radius:p.radius+.55,color:'#ff9a5a',visual:true,ground:true,fixedRadius:true,time:2,duration:10});
}
