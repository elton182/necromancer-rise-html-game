import R from './spell-rules.mjs';
import {masteryBonus,masteryFactor,masteryCooldown} from './mastery.mjs';
import {available} from './actions.mjs';
import {dealDamage} from './combat.mjs';
import {killMember,effects} from './horde.mjs';
import {resolvePosition} from './terrain.mjs';
export {R as SPELL_RULES};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),living=a=>a.hp>0&&!a.dead;
export function clearSpells(w){w.rain=[];w.walls=[];w.spellCooldowns={};w.player.barrier=0;w.player.barrierMax=0;for(const a of w.actors)delete a.curse;}
export function initializeSpells(w){clearSpells(w);w.onPlayerDeath=()=>clearSpells(w);}
function ring(w,x,y,radius,color,duration=.6){w.effects.push({id:w.nextId++,kind:'spellArea',x,y,radius,color,time:0,duration,visual:true,ground:true,fixedRadius:true});}
export function castSpell(w,id){
 const rule=R[id],p=w.player;
 if(!rule||w.armyMode!=='groups'||w.paused||!living(p)||!w.army.loadout.includes(id)||!available(w.army,id)||(w.spellCooldowns[id]||0)>1e-9||p.mp<rule.cost)return false;
 const point=id==='barreira'?p:w.aim;
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||id!=='barreira'&&dist(p,point)>R.range)return false;
 const e=effects(w),percent=key=>1+(e[key]||0)/100,factor=key=>masteryFactor(w,id,key),{x,y}=point;
 let victim,hpCost=0;
 if(id==='barreira'){
  victim=w.actors.filter(a=>a.groupType==='zombie'&&living(a)).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||dist(a,p)-dist(b,p))[0];hpCost=victim?0:Math.ceil(p.maxHp*rule.healthCost);if(p.hp-hpCost<1)return false;
 }
 // Validar tudo antes de pagar. Trocar slots não altera as recargas em andamento.
 p.mp-=rule.cost;const gear=1-Math.min(50,Math.max(0,w.modifiers.gearCooldown||0))/100;
 w.spellCooldowns[id]=Math.max(rule.cooldown*.5,rule.cooldown*gear)*masteryCooldown(w,id);
 p.animation='cast';p.animationTime=0;p.actionId++;p.timer=.375;p.angle=Math.atan2(x-p.x,y-p.y);
 if(id==='explosao'){
  const radius=R.radius*rule.radius*Math.sqrt(factor('area')),damage=p.spellDamage*rule.damage*(1+((e['Dano da Explosão Necrótica']||0)+(e['Dano das explosões de Zumbi e Necrótica']||0))/100)*factor('damage');
  // Explosão imediata: o desenho nunca agenda um segundo impacto.
  for(const enemy of w.actors.filter(a=>a.team==='enemy'&&living(a)))if(dist(enemy,point)<radius)dealDamage(w,enemy,damage,p);
  ring(w,x,y,radius,'#c17cdd',.85);
 }else if(id==='chuva'){
  const radius=R.radius*Math.sqrt(percent('Área da Chuva de Ossos')*factor('area')),damage=p.spellDamage*rule.damage*percent('Dano da Chuva de Ossos')*factor('damage'),random=w.random||Math.random;
  for(let i=0;i<rule.count;i++)w.rain.push({id:w.nextId++,x:x+(random()-.5)*radius*rule.spread,y:y+(random()-.5)*radius*rule.spread,time:0,delay:rule.delay+i*rule.interval,fall:rule.fall,damage,radius:Math.sqrt(rule.hitRadius)});
  ring(w,x,y,radius,'#d4cda8',.5);
 }else if(id==='maos'){
  const dx=x-p.x,dy=y-p.y,n=Math.hypot(dx,dy)||1;
  w.walls.push({id:w.nextId++,x,y,ux:-dy/n||0,uy:dx/n||1,half:rule.half,width:rule.width,remaining:rule.duration*percent('Duração da Muralha')*factor('duration'),hp:rule.hp*percent('Resistência da Muralha')*factor('resistance'),tick:0,damage:Math.round(Math.max(1,Math.round(p.spellDamage*rule.damage))*factor('damage'))});
 }else if(id==='barreira'){
  const cap=Math.floor(victim?victim.maxHp*rule.zombieRatio:p.maxHp*rule.healthRatio);
  if(victim)killMember(w,victim,'sacrificed');else p.hp-=hpCost;
  p.barrier=p.barrierMax=Math.round(Math.round(cap*percent('Absorção do Escudo de Carne'))*factor('absorb'));ring(w,p.x,p.y,1.6,'#d397a1');
 }else if(id==='maldicao'){
  const radius=rule.radius*Math.sqrt(percent('Área da Maldição')*factor('area')),duration=rule.duration*percent('Duração da Maldição')*factor('duration'),reduction=Math.min(75,(e['Redução de dano da Maldição']||0)+(masteryBonus(w,id).curse||0))/100;
  for(const enemy of w.actors.filter(a=>a.team==='enemy'&&living(a)))if(dist(enemy,point)<=radius)enemy.curse={remaining:duration,reduction};
  ring(w,x,y,radius,'#ad9acf');
 }
 return true;
}
export function wallNearest(w,p){const along=Math.max(-w.half,Math.min(w.half,(p.x-w.x)*w.ux+(p.y-w.y)*w.uy));return {x:w.x+w.ux*along,y:w.y+w.uy*along};}
// Varredura na caixa orientada: o inimigo não atravessa a muralha em passos longos.
export function firstWallHit(w,from,to,radius=.1){
 let best=null;for(const wall of w.walls){if(wall.remaining<=0||wall.hp<=0)continue;let lo=0,hi=1;const nx=-wall.uy,ny=wall.ux,ox=from.x-wall.x,oy=from.y-wall.y,dx=to.x-from.x,dy=to.y-from.y;
  for(const [p,v,extent]of [[ox*wall.ux+oy*wall.uy,dx*wall.ux+dy*wall.uy,wall.half+radius],[ox*nx+oy*ny,dx*nx+dy*ny,wall.width/2+radius]]){if(Math.abs(v)<1e-9){if(Math.abs(p)>extent){lo=2;break;}}else{let a=(-extent-p)/v,b=(extent-p)/v;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);}}
  if(lo<=hi&&hi>=0&&lo<=1&&(!best||lo<best.t))best={t:Math.max(0,lo),wall};
 }return best;
}
export function blockEnemyByWalls(w,a,from){
 if(!living(a)||(a.jumpZ||0)>0)return;
 const hit=firstWallHit(w,from,a,a.radius||.3);if(hit&&hit.t>0){const t=Math.max(0,hit.t-1e-5);a.x=from.x+(a.x-from.x)*t;a.y=from.y+(a.y-from.y)*t;}
 for(const wall of w.walls){const q=wallNearest(wall,a);let dx=a.x-q.x,dy=a.y-q.y,d=Math.hypot(dx,dy),limit=wall.width/2+(a.radius||.3);if(d<limit){if(d<1e-6){dx=-wall.uy;dy=wall.ux;d=1;}a.x=q.x+dx/d*(limit+1e-6);a.y=q.y+dy/d*(limit+1e-6);}}
 Object.assign(a,resolvePosition(a,a.radius||.3,w.arena));
}
// Contrato para projéteis hostis da E8; flechas aliadas e Tiro de Osso não são absorvidos.
export function absorbWallProjectile(w,from,to,damage){const hit=firstWallHit(w,from,to);if(!hit||!Number.isFinite(damage)||damage<=0)return false;hit.wall.hp-=damage;if(hit.wall.hp<=0)w.walls=w.walls.filter(a=>a!==hit.wall);return true;}
export function tickSpells(w,dt){
 for(const id of Object.keys(w.spellCooldowns))w.spellCooldowns[id]=Math.max(0,w.spellCooldowns[id]-dt);
 for(const enemy of w.actors)if(enemy.curse){enemy.curse.remaining-=dt;if(enemy.curse.remaining<=1e-9||!living(enemy))delete enemy.curse;}
 for(const drop of w.rain){drop.time+=dt;if(drop.time+1e-9<drop.delay+drop.fall)continue;for(const e of w.actors.filter(a=>a.team==='enemy'&&living(a)))if(dist(e,drop)<drop.radius)dealDamage(w,e,drop.damage,w.player);ring(w,drop.x,drop.y,drop.radius,'#e1d2a0',.25);drop.hit=true;}
 w.rain=w.rain.filter(d=>!d.hit);
 for(const wall of w.walls){wall.remaining-=dt;wall.tick-=dt;while(wall.tick<=1e-9&&wall.remaining>0){wall.tick+=R.maos.interval;for(const enemy of w.actors.filter(a=>a.team==='enemy'&&living(a)&&!(a.jumpZ>0)))if(dist(enemy,wallNearest(wall,enemy))<=wall.width/2+(enemy.radius||.3)+.12)dealDamage(w,enemy,wall.damage,w.player);}}
 w.walls=w.walls.filter(wall=>wall.remaining>1e-9&&wall.hp>0);
 for(const enemy of w.actors.filter(a=>a.team==='enemy'))blockEnemyByWalls(w,enemy,{x:enemy.x,y:enemy.y});
}
