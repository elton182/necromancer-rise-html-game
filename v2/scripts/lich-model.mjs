// Forma de Lich (árvore Morte): regras sem DOM nem Three.js. Unidades de mundo, segundos, atualização por dt.
// Guia: docs/v2-morte-lich.md. Valores iniciais para balancear; o renderizador lê w.lich e w.spirits.
import {dealDamage} from './combat.mjs';
import {lineClear,moveCircle} from './terrain.mjs';
import {fx} from './vfx-events.mjs';
import EQ from './shared-equipment.mjs';
import {masteryBonus} from './mastery.mjs';
const R=a=>a*Math.PI/180;
export const LICH={
 enter:{cost:50,cooldown:20,duration:.9,start:40},
 souls:{max:100,drain:1.5},
 baseBuff:{damage:1.25,defense:1.25},
 spirit:{ttl:8,absorb:3,pullRange:6,pullSpeed:7,values:{common:4,elite:12,boss:40}},
 ceifada:{clip:'slash',duration:.55,contact:.28,cooldown:.55,cost:0,range:3.4,half:R(60),damage:.9},
 colheita:{cost:0,cooldown:0,window:.6,mark:{duration:2,slow:.3,soulBonus:.5},
  steps:[{clip:'combo_1',duration:.6,contact:.31,range:3.4,half:R(60),damage:1,flip:false},
         {clip:'combo_2',duration:.6,contact:.31,range:3.4,half:R(60),damage:1.1,flip:true},
         {clip:'combo_3',duration:1,contact:.8,range:4.2,half:Math.PI,damage:2,wave:{length:6,width:1.2}}],executeBelow:.25,executeBonus:.5,executeMark:4},
 giratoria:{clip:'throw',duration:.83,release:.39,cost:15,cooldown:6,range:11,speed:22,hitRadius:1.4,damage:1.2,catchDistance:.8},
 arco:{clip:'throw',duration:.83,release:.39,cost:25,cooldown:8,range:8,speed:20,hitRadius:1.1,damage:1.1,pull:2,markedPull:4},
 ciclone:{clip:'spin',duration:1.4,cost:40,cooldown:14,radius:4.5,turns:2,hitRadius:1.3,damage:.8,moveFactor:.6},
 catch:{clip:'catch',duration:.42},
 libertar:{cooldown:1},
 // Roubo de vida: todo golpe da foice devolve esta fração do dano causado; equipamentos (afixo `lifesteal`) e a maestria da Forma da Morte somam.
 lifesteal:{base:.06,cap:.5},
};
export const LICH_SLOTS=['ceifada','giratoria','colheita','arco','ciclone','libertar'];
export const LICH_NAMES={lich:'Forma da Morte',ceifada:'Ceifada',giratoria:'Foice Giratória',colheita:'Colheita Tripla',arco:'Gancho do Túmulo',ciclone:'Ciclone da Morte',libertar:'Libertar Forma'};
// Habilidade da foice → nó da árvore que a libera (a Ceifada e Libertar Forma valem sempre dentro da forma).
export const LICH_UNLOCK={giratoria:'spinning',colheita:'triple',arco:'arc',ciclone:'cyclone'};

// ── Árvore Morte: nós em death-tree.mjs (sem dependências, para o Grimório estendido) ──
import {DEATH_SCHOOLS,DEATH_NODES} from './death-tree.mjs';
export {DEATH_SCHOOLS,DEATH_NODES};
const nodeById=Object.fromEntries(DEATH_NODES.map(n=>[n.id,n]));
const rank=(ranks,id)=>Math.max(0,Math.min(nodeById[id].max,Math.floor(ranks?.[id]||0)));
// Efeitos finais a partir dos pontos investidos (validação de pré-requisitos é do Grimório).
// `m`: bônus da maestria da Forma da Morte (almas máximas e redução da drenagem).
export function lichStats(ranks={},m={}){
 const r=id=>rank(ranks,id);
 return {
  learned:r('lichform')>0,
  maxSouls:LICH.souls.max+5*r('lichform')+4*r('vessel')+(m.souls||0),
  drain:LICH.souls.drain*Math.max(.3,1-.06*r('hunger'))*(1-Math.min(.5,(m.drain||0)/100)),
  soulFactor:1+.08*r('harvest'),
  eliteFactor:r('reaper')?2:1,
  absorb:LICH.spirit.absorb+.3*r('callspirit'),
  heal:.005*r('wail'),
  defenseFactor:LICH.baseBuff.defense,
  damageTaken:r('avatar')?.75:1,
  transformTime:LICH.enter.duration*(r('avatar')?.67:1),
  reach:1+.06*r('reach'),
  damage:Object.fromEntries(Object.entries({ceifada:1+.06*r('reach'),giratoria:1+.05*r('spinning'),colheita:1+.05*r('triple'),arco:1+.05*r('arc'),ciclone:1+.1*r('cyclone')}).map(([id,value])=>[id,value*LICH.baseBuff.damage])),
  executor:r('executor')>0,
  unlocked:{ceifada:true,libertar:true,giratoria:r('spinning')>0,colheita:r('triple')>0,arco:r('arc')>0,ciclone:r('cyclone')>0},
 };
}

// ── Estado ──
const living=a=>a.hp>0&&!a.dead;
const hostile=w=>w.actors.filter(a=>a.team==='enemy'&&living(a));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function fresh(ranks){return {form:'none',ranks:{...ranks},stats:lichStats(ranks),souls:0,mpStored:0,mpRegen:0,transformTime:0,entryCooldown:0,cooldowns:{},action:null,combo:null,scythe:null,moveFactor:1,invuln:false,pose:null,events:[]};}
export function initializeLich(w,ranks){
 const previous=w.lich?.ranks;w.lich=fresh(ranks??previous??{});w.spirits=[];
 w.onLichKill=enemy=>spawnSpirit(w,enemy);
 const chained=w.onPlayerDeath;w.onPlayerDeath=()=>{chained?.();clearLich(w,'death');};
 return w.lich;
}
// Troca os pontos investidos sem reiniciar a forma em andamento.
export function setLichRanks(w,ranks){
 const l=w.lich;l.ranks={...ranks};l.stats=lichStats(ranks,masteryBonus(w,'lich'));
 if(l.form!=='none'){l.souls=Math.min(l.souls,l.stats.maxSouls);if(!l.stats.learned)exitLich(w,'ranks');}
}
export const isLich=w=>w.lich?.form==='lich';
// Dentro da forma (ou transformando) a barra normal, o Tiro de Osso e as magias de mana ficam bloqueados.
export const lichLocksSlots=w=>!!w.lich&&w.lich.form!=='none';
export function lichSlots(w){return LICH_SLOTS.map((base,index)=>{const id=index===0&&w.lich.stats.unlocked.colheita?'colheita':base;return {id,name:LICH_NAMES[id],unlocked:!!w.lich.stats.unlocked[id],cooldown:id==='colheita'&&w.lich.combo&&w.lich.combo.step<2?0:w.lich.cooldowns[id]||0,cost:cost(id)};});}
function cost(id){return id==='ceifada'||id==='libertar'?0:LICH[id].cost;}
function emit(w,kind,data={}){w.lich.events.push({kind,time:w.time,...data});if(w.lich.events.length>64)w.lich.events.shift();}
const gearCooldown=w=>1-Math.min(50,Math.max(0,w.modifiers?.gearCooldown||0))/100;

export function canEnter(w){
 const l=w.lich,p=w.player;
 return !!l&&l.stats.learned&&l.form==='none'&&!w.paused&&p.hp>0&&l.entryCooldown<=1e-9&&p.mp>=LICH.enter.cost;
}
export function enterLich(w){
 if(!canEnter(w))return false;
 const l=w.lich,p=w.player;
 w.boltCharge=null;p.mp-=LICH.enter.cost;l.mpStored=p.mp;l.mpRegen=p.mpRegen;p.mpRegen=0;
 p.model='lich';
 Object.assign(l,{form:'transform',transformTime:l.stats.transformTime,souls:Math.min(LICH.enter.start,l.stats.maxSouls),action:null,combo:null,scythe:null,invuln:true,moveFactor:0,
  pose:{anim:'transform',progress:0}});
 w.spirits=[];p.animation='idle';burst(w,p.x,p.y,3.5);emit(w,'transform');return true;
}
// Motivos: 'souls', 'manual', 'death', 'scene', 'ranks'. Morte e troca de cena não deixam recarga de reentrada.
export function exitLich(w,reason='manual'){
 const l=w.lich;if(!l||l.form==='none')return false;
 const p=w.player;
 p.mpRegen=l.mpRegen;p.mp=Math.min(p.maxMp,l.mpStored);
 if(reason!=='death')p.model='player';   // na morte o Lich cai como Lich; troca de cena recria o ator
 for(const e of w.actors)delete e.reaped;
 Object.assign(l,{form:'none',souls:0,action:null,combo:null,scythe:null,invuln:false,moveFactor:1,pose:null,transformTime:0,cooldowns:{},
  entryCooldown:reason==='death'||reason==='scene'?0:LICH.enter.cooldown});
 w.spirits=[];burst(w,p.x,p.y,2.5,'#6d5aa8');emit(w,'exit',{reason});return true;
}
export function clearLich(w,reason='scene'){return exitLich(w,reason);}

// ── Habilidades ──
export function castLich(w,id){
 const l=w.lich,p=w.player;
 if(!l||l.form!=='lich'||w.paused||p.hp<=0||!LICH_SLOTS.includes(id)||!l.stats.unlocked[id])return false;
 if(id==='libertar')return exitLich(w,'manual');
 if(l.action)return false;
 if(id==='colheita'&&l.combo&&l.combo.step<2&&l.combo.window>0)return startStep(w,l.combo.step+1);
 if(l.scythe||l.combo||(l.cooldowns[id]||0)>1e-9||l.souls<cost(id))return false;
 const dx=w.aim.x-p.x,dy=w.aim.y-p.y;if(!Number.isFinite(dx)||!Number.isFinite(dy))return false;
 const n=Math.hypot(dx,dy)||1,dir={x:dx/n,y:dy/n};
 l.souls-=cost(id);
 if(id==='colheita'){l.combo={step:0,window:0};return startStep(w,0,dir);}
 const rule=LICH[id];
 l.cooldowns[id]=cooldownOf(w,id,rule.cooldown);
 l.action={id,clip:rule.clip,time:0,duration:rule.duration,contact:rule.contact??rule.release??0,fired:false,dir};
 face(w,dir);return true;
}
function startStep(w,index,dirIn){
 const l=w.lich,p=w.player,rule=LICH.colheita.steps[index],tempo=1-Math.min(.5,mb(w,'colheita','speed')+mb(w,'ceifada','cooldown'));
 let dir=dirIn;if(!dir){const dx=w.aim.x-p.x,dy=w.aim.y-p.y,n=Math.hypot(dx,dy);dir=n>1e-9?{x:dx/n,y:dy/n}:l.combo.dir;}
 l.combo.step=index;l.combo.window=0;l.combo.dir=dir;
 l.action={id:'colheita',step:index,clip:rule.clip,time:0,duration:rule.duration*tempo,contact:rule.contact*tempo,fired:false,dir,hits:new Set()};
 face(w,dir);return true;
}
function face(w,dir){const p=w.player;p.angle=Math.atan2(dir.x,dir.y);p.actionId++;}
// Maestrias das habilidades da Morte: só valem com a Forma da Morte equipada (ver mastery.mjs); sem exército, nenhum bônus.
const mb=(w,id,key)=>(masteryBonus(w,id)[key]||0)/100;
function amount(w,id,multiplier,e){return Math.max(1,Math.round(w.player.spellDamage*multiplier*w.lich.stats.damage[id]*(1+mb(w,id,'damage')+(id==='colheita'?mb(w,'ceifada','damage'):0))*(e||1)));}
// Fração do dano devolvida em vida: base + equipamentos (pontos percentuais) + maestria; limitada para não anular o dano recebido.
export function lifestealRate(w){const gear=(EQ.bonuses({equipment:w.equipment||{}}).lifesteal||0)/100;return Math.min(LICH.lifesteal.cap,LICH.lifesteal.base+gear+mb(w,'lich','lifesteal'));}
const cooldownOf=(w,id,base)=>Math.max(base*.5,base*gearCooldown(w)*(1-Math.min(.5,mb(w,id,'cooldown'))));
function inArc(p,e,dir,range,half){
 const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)-(e.radius||.3);
 if(d>range)return false;if(half>=Math.PI-1e-9)return true;
 const a=Math.abs(Math.atan2(dir.x*dy-dir.y*dx,dir.x*dx+dir.y*dy));return a<=half||Math.hypot(dx,dy)<.4;
}
const clear=(w,a,b)=>lineClear(a,b,.05,w.arena);
function mark(w,e,duration){
 const m=LICH.colheita.mark;e.reaped={remaining:(duration??m.duration)*(1+mb(w,'colheita','duration'))};
 if((e.slowTime||0)<e.reaped.remaining||(e.slow||0)<m.slow){e.slowTime=Math.max(e.slowTime||0,e.reaped.remaining);e.slow=Math.max(e.slow||0,m.slow);}
}
const SOUL_COLOR='#9fe8ff';
function hit(w,e,damage){
 const p=w.player,d=Math.hypot(e.x-p.x,e.y-p.y)||1,r=dealDamage(w,e,damage,p);
 if(r.applied>0){w.hits++;
  // Roubo de vida: cura Zephyr (nunca acima do máximo) e agrupa o total para um único brilho verde a cada 0,4 s.
  if(p.hp>0){const heal=Math.min(p.maxHp-p.hp,r.applied*lifestealRate(w));if(heal>0){p.hp+=heal;w.lich.stolen=(w.lich.stolen||0)+heal;}}
  fx(w,'impact',{x:e.x,y:e.y,dx:(e.x-p.x)/d,dy:(e.y-p.y)/d,color:SOUL_COLOR,size:.5,mood:'magic',duration:.28});}
 return r;
}
// Rastro do golpe: só desenho, no mesmo instante e geometria do dano.
function slash(w,dir,range,arc,{sparks=12,color=SOUL_COLOR,duration=.35,sweep=-1,wind=true}={}){const p=w.player;fx(w,'slash',{x:p.x,y:p.y,dx:dir.x,dy:dir.y,radius:range,arc:Math.min(arc,Math.PI*2),h:.9,color,mood:'magic',sparks,duration});if(wind)fx(w,'windarc',{x:p.x,y:p.y,dx:dir.x,dy:dir.y,radius:range,arc:Math.min(arc,Math.PI*2),sweep,duration:.45});}
function burst(w,x,y,radius,color='#8b5cf6'){fx(w,'shockwave',{x,y,radius,color,mood:'magic',duration:.6});}

function contact(w){
 const l=w.lich,a=l.action,p=w.player;
 if(a.id==='ceifada'){
  const rule=LICH.ceifada,range=rule.range*l.stats.reach*(1+mb(w,'ceifada','area'));slash(w,a.dir,range,rule.half*2);
  for(const e of hostile(w))if(inArc(p,e,a.dir,range,rule.half)&&clear(w,p,e))hit(w,e,amount(w,'ceifada',rule.damage));
 }else if(a.id==='colheita'){
  const rule=LICH.colheita.steps[a.step],last=a.step===2,reach=l.stats.reach*(1+mb(w,'ceifada','area'));
  slash(w,a.dir,rule.range*reach,rule.half*2,{sparks:last?24:14,color:last?'#c9a8ff':SOUL_COLOR,sweep:rule.flip?1:-1});
  if(last)slash(w,a.dir,rule.wave.length*reach,.3,{sparks:18,color:'#c9a8ff',duration:.4,wind:false});
  for(const e of hostile(w)){
   if(a.hits.has(e.id))continue;
   let inside=inArc(p,e,a.dir,rule.range*reach,rule.half);
   if(!inside&&rule.wave){const dx=e.x-p.x,dy=e.y-p.y,along=dx*a.dir.x+dy*a.dir.y,side=Math.abs(dx*a.dir.y-dy*a.dir.x);inside=along>0&&along<=rule.wave.length*reach&&side<=rule.wave.width/2+(e.radius||.3);}
   if(!inside||!clear(w,p,e))continue;
   a.hits.add(e.id);
   const weak=last&&l.stats.executor&&e.hp/e.maxHp<LICH.colheita.executeBelow;
   // A marca vem antes do dano: o espírito de quem morre no golpe final já rende o bônus.
   if(last)mark(w,e,l.stats.executor?LICH.colheita.executeMark:undefined);
   hit(w,e,amount(w,'colheita',rule.damage,weak?1+LICH.colheita.executeBonus:1));
  }
 }else if(a.id==='giratoria'){
  const rule=LICH.giratoria;
  l.scythe={kind:'giratoria',x:p.x,y:p.y,dx:a.dir.x,dy:a.dir.y,leg:'out',range:rule.range*l.stats.reach*(1+mb(w,'giratoria','reach')),travelled:0,hits:new Set(),angle:0,time:0};
  emit(w,'throw');
 }else if(a.id==='arco'){
  l.scythe={kind:'arco',x:p.x,y:p.y,dx:a.dir.x,dy:a.dir.y,leg:'out',range:LICH.arco.range*l.stats.reach*(1+mb(w,'arco','area')),travelled:0,hits:new Set(),angle:0,time:0};emit(w,'throw');
 }else if(a.id==='ciclone'){
  l.scythe={kind:'ciclone',x:p.x,y:p.y,base:Math.atan2(a.dir.y,a.dir.x),leg:'orbit',time:0,hits:new Set(),pass:0,angle:0,consumed:new Set()};emit(w,'throw');
 }
}

// Varre o segmento percorrido pela foice: acerta cada inimigo uma vez por perna, independentemente do passo de tempo.
function sweepHits(w,s,from,to,radius,damage,id){
 const dx=to.x-from.x,dy=to.y-from.y,len=dx*dx+dy*dy;
 for(const e of hostile(w)){
  if(s.hits.has(e.id)||!clear(w,w.player,e))continue;
  const t=len?Math.max(0,Math.min(1,((e.x-from.x)*dx+(e.y-from.y)*dy)/len)):0;
  if(Math.hypot(e.x-from.x-dx*t,e.y-from.y-dy*t)<radius+(e.radius||.3)*.5){s.hits.add(e.id);scytheHit(w,s,e,damage);}
 }
}
function scytheHit(w,s,e,damage){
 const marked=!!e.reaped;
 const consume=s.kind==='ciclone'&&marked&&!s.consumed.has(e.id);
 hit(w,e,damage*(consume?1.75:1));
 if(s.kind==='giratoria'&&e.reaped){e.reaped.remaining=Math.min(4,e.reaped.remaining+1);e.slowTime=Math.max(e.slowTime||0,e.reaped.remaining);e.slow=Math.max(e.slow||0,LICH.colheita.mark.slow);}
 if(consume){s.consumed.add(e.id);delete e.reaped;}
 if(s.kind==='arco'&&s.leg==='out'&&living(e)){
  if(e.isBoss||e===w.boss||e.model==='fallenKing'){e.slowTime=Math.max(e.slowTime||0,2);e.slow=Math.max(e.slow||0,.25);return;}
  const p=w.player,d=dist(p,e)||1,length=Math.min(Math.max(0,d-1.5),marked?LICH.arco.markedPull:LICH.arco.pull),q=moveCircle(e,{x:(p.x-e.x)/d*length,y:(p.y-e.y)/d*length},e.radius||.3,w.arena,{slide:false});e.x=q.x;e.y=q.y;e.navPath=null;
 }
}
function updateScythe(w,h){
 const l=w.lich,s=l.scythe,p=w.player;if(!s)return;
 if(s.arrived){if(!l.action)finishScythe(w);return;}
 s.time+=h;
 if(s.kind==='giratoria'||s.kind==='arco'){
  const rule=LICH[s.kind],ranged=rule.speed*h,damage=amount(w,s.kind,rule.damage);s.angle+=h*20;
  const from={x:s.x,y:s.y};let to;
  if(s.leg==='out'){
   const step=Math.min(ranged,s.range-s.travelled);to={x:s.x+s.dx*step,y:s.y+s.dy*step};
   if(!clear(w,from,to)){s.leg='back';s.hits=new Set();to=from;}
   else{s.travelled+=step;if(s.travelled>=s.range-1e-9){s.leg='back';sweepHits(w,s,from,to,rule.hitRadius,damage);s.hits=new Set();}else sweepHits(w,s,from,to,rule.hitRadius,damage);}
  }else{
   const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy);
   if(d<=rule.catchDistance||d<=ranged){s.x=p.x;s.y=p.y;return arrive(w);}
   to={x:s.x+dx/d*ranged,y:s.y+dy/d*ranged};sweepHits(w,s,from,to,rule.hitRadius,damage);
  }
  s.x=to.x;s.y=to.y;
 }else if(s.kind==='ciclone'){
  const rule=LICH.ciclone,damage=amount(w,'ciclone',rule.damage),radius=rule.radius*l.stats.reach*(1+mb(w,'ciclone','area')),turn=rule.duration/rule.turns;
  const before=Math.max(0,s.time-h),a0=s.base+Math.PI*2*(before/turn),a1=s.base+Math.PI*2*(Math.min(s.time,rule.duration)/turn);
  s.angle=a1;s.x=p.x+Math.cos(a1)*radius;s.y=p.y+Math.sin(a1)*radius;
  const pass=Math.floor(Math.min(s.time,rule.duration-1e-9)/turn);if(pass!==s.pass){s.pass=pass;s.hits=new Set();}
  sweepHitsArc(w,s,p,radius,damage,rule.hitRadius,a0,a1);
  if(s.time>=rule.duration-1e-9)return arrive(w);
 }
}
// Acertos ao longo do arco percorrido em torno de Zephyr: testa pontos intermediários para não saltar inimigos em passos longos.
function sweepHitsArc(w,s,center,radius,damage,hitRadius,a0,a1){
 const steps=Math.max(1,Math.ceil(Math.abs(a1-a0)/.2));let prev={x:center.x+Math.cos(a0)*radius,y:center.y+Math.sin(a0)*radius};
 for(let i=1;i<=steps;i++){const a=a0+(a1-a0)*i/steps,next={x:center.x+Math.cos(a)*radius,y:center.y+Math.sin(a)*radius};
  for(const e of hostile(w)){if(s.hits.has(e.id))continue;if(!clear(w,center,e))continue;
   const dx=next.x-prev.x,dy=next.y-prev.y,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((e.x-prev.x)*dx+(e.y-prev.y)*dy)/len)):0;
   if(Math.hypot(e.x-prev.x-dx*t,e.y-prev.y-dy*t)<hitRadius+(e.radius||.3)*.5){s.hits.add(e.id);scytheHit(w,s,e,damage);}}
  prev=next;}
}
// A foice só volta à mão quando o clipe de arremesso termina: assim 'catch' nunca corta a animação em andamento.
function arrive(w){const l=w.lich;l.scythe.arrived=true;if(!l.action)finishScythe(w);}
function finishScythe(w){
 const l=w.lich;l.scythe=null;l.moveFactor=1;
 l.action={id:'catch',clip:LICH.catch.clip,time:0,duration:LICH.catch.duration,contact:Infinity,fired:true,dir:l.action?.dir||{x:0,y:1}};
 emit(w,'catch');
}

// ── Espíritos ──
export function spiritValue(w,enemy){
 const s=w.lich.stats,v=LICH.spirit.values;
 const kind=enemy.isBoss?'boss':enemy.tier==='magic'||enemy.tier==='rare'||enemy.elite?'elite':'common';
 let value=v[kind]*s.soulFactor*(kind==='common'?1:s.eliteFactor);
 if(enemy.reaped)value*=1+LICH.colheita.mark.soulBonus;
 return value;
}
export function spawnSpirit(w,enemy){
 if(!isLich(w)||!enemy||enemy.team!=='enemy')return null;
 const spirit={id:w.nextId++,x:enemy.x,y:enemy.y,value:spiritValue(w,enemy),age:0,ttl:LICH.spirit.ttl,source:enemy.id};
 w.spirits.push(spirit);return spirit;
}
function updateSpirits(w,h){
 const l=w.lich,p=w.player,s=l.stats;
 for(let i=w.spirits.length-1;i>=0;i--){
  const sp=w.spirits[i];sp.age+=h;
  if(sp.age>=sp.ttl){w.spirits.splice(i,1);continue;}
  const d=dist(sp,p);
  if(d<=s.absorb){
   l.souls=Math.min(s.maxSouls,l.souls+sp.value);
   if(s.heal&&p.hp>0)p.hp=Math.min(p.maxHp,p.hp+p.maxHp*s.heal);
   fx(w,'impact',{x:p.x,y:p.y,h:1.1,color:SOUL_COLOR,size:.7,mood:'magic',duration:.3});emit(w,'absorb',{value:sp.value,x:sp.x,y:sp.y});w.spirits.splice(i,1);continue;
  }
  if(d<=LICH.spirit.pullRange){const k=Math.min(d-s.absorb+.01,LICH.spirit.pullSpeed*h*(1+(LICH.spirit.pullRange-d)/LICH.spirit.pullRange*2));sp.x+=(p.x-sp.x)/d*k;sp.y+=(p.y-sp.y)/d*k;}
 }
}

// ── Relógio ──
export function tickLich(w,dt){
 const l=w.lich;if(!l||!(dt>0))return;
 let left=dt;
 while(left>1e-9){
  const h=Math.min(left,1/60);left-=h;
  l.entryCooldown=Math.max(0,l.entryCooldown-h);
  if(l.form==='none'){if(w.player.model==='lich'&&w.player.hp>0)w.player.model='player';continue;}
  const p=w.player;
  p.mp=l.mpStored;
  if(l.form==='transform'){
   l.transformTime-=h;l.pose={anim:'transform',progress:Math.min(1,1-l.transformTime/l.stats.transformTime)};
   if(l.transformTime<=1e-9){l.form='lich';l.invuln=false;l.moveFactor=1;l.pose=null;emit(w,'lich');}
   continue;
  }
  for(const key of Object.keys(l.cooldowns))l.cooldowns[key]=Math.max(0,l.cooldowns[key]-h);
  l.souls-=l.stats.drain*h;
  if(l.souls<=1e-9){exitLich(w,'souls');continue;}
  for(const e of w.actors)if(e.reaped){e.reaped.remaining-=h;if(e.reaped.remaining<=0)delete e.reaped;}
  const a=l.action;
  if(a){
   a.time+=h;
   if(!a.fired&&a.time+1e-9>=a.contact){a.fired=true;contact(w);}
   l.pose={anim:a.clip,progress:Math.min(1,a.time/a.duration)};
   if(l.action&&a.time+1e-9>=a.duration){
    l.action=null;l.pose=null;
    if(a.id==='colheita'){if(a.step<2)l.combo.window=LICH.colheita.window;else endCombo(w);}
   }
  }else if(l.combo&&l.combo.window>0){
   l.combo.window-=h;if(l.combo.window<=1e-9)endCombo(w);
  }
  if(l.form!=='lich')continue;
  updateScythe(w,h);
  // Com a foice fora e sem ação, o corpo segura o último quadro do arremesso (mão vazia), nunca o repouso com a foice.
  if(!l.action&&l.scythe)l.pose={anim:LICH[l.scythe.kind].clip,progress:1};
  l.moveFactor=l.scythe?.kind==='ciclone'&&!l.scythe.arrived?LICH.ciclone.moveFactor:1;
  updateSpirits(w,h);
 }
}
function endCombo(w){const l=w.lich;l.combo=null;l.cooldowns.colheita=cooldownOf(w,'colheita',LICH.colheita.cooldown);}
