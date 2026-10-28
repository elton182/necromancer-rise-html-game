// Arena experimental com colisões E3. Regras completas da campanha ainda pendentes.
// Mundo lógico: x/y no chão, distâncias em unidades, tempos em segundos.
import {TRAINING_ARENA,resolvePosition,moveCircle,lineClear,navigate} from './terrain.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function animate(a,name){if(a.animation!==name){a.animation=name;a.animationTime=0;}}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function createWorld(options={}){
 const world={nextId:1,actors:[],effects:[],time:0,paused:false,hits:0,horde:6};
 resetWorld(world,options);return world;
}
export function resetWorld(w,{horde=w.horde}={}){
 if(!Number.isInteger(horde)||horde<0||horde>64)throw Error('Quantidade de aliados inválida.');
 Object.assign(w,{actors:[],effects:[],time:0,paused:false,hits:0,horde,castCooldown:0,arena:TRAINING_ARENA});
 function spawn(model,team,x,y,hp){const radius=model==='player'?.45:model==='fallenKing'?.48:team==='ally'?.35:.3,pos=resolvePosition({x,y},radius,w.arena);const a={id:w.nextId++,model,team,...pos,radius,hp,maxHp:hp,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,phase:w.actors.length*2.399};w.actors.push(a);return a;}
 w.player=spawn('player','player',0,4,100);w.aim={x:0,y:-5};
 for(let i=0;i<horde;i++){const a=i*2.399,r=2+i*.06;spawn('skeleton','ally',Math.sin(a)*r,4+Math.cos(a)*r,100);}
 for(let i=0;i<8;i++)spawn('zombie','enemy',(i%4-1.5)*4,-7-Math.floor(i/4)*4,60);
 w.boss=spawn('fallenKing','enemy',1,-13,1000);
}
export function cast(w){
 if(w.paused||w.player.hp<=0||w.castCooldown>0||!Number.isFinite(w.aim.x)||!Number.isFinite(w.aim.y))return false;
 const p=w.player,dx=w.aim.x-p.x,dy=w.aim.y-p.y,d=Math.hypot(dx,dy),f=d>10?10/d:1;
 w.castCooldown=.65;animate(p,'cast');p.animationTime=0;p.actionId++;p.timer=.55;p.angle=Math.atan2(dx,dy);
 w.effects.push({id:w.nextId++,kind:'spell',x:p.x+dx*f,y:p.y+dy*f,radius:2.4,time:0,delay:.25,hit:false});return true;
}
export function setPaused(w,paused){w.paused=!!paused;}
function damage(target,value){if(target.hp>0)target.hp=Math.max(0,target.hp-value);}
function tick(w,dt,input){
 w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);
 const p=w.player,x=clamp(Number(input.x)||0,-1,1),y=clamp(Number(input.y)||0,-1,1);
 // Movimento relativo à tela da câmera isométrica.
 let mx=x+y,my=y-x;const length=Math.hypot(mx,my);if(length){const magnitude=Math.min(1,Math.hypot(x,y));mx=mx/length*magnitude;my=my/length*magnitude;}
 let moved=0;if(length&&p.hp>0){const pos=moveCircle(p,{x:mx*5*dt,y:my*5*dt},p.radius,w.arena);moved=pos.distance;p.x=pos.x;p.y=pos.y;p.walkDistance+=moved;}
 for(const a of w.actors){
  a.timer=Math.max(0,a.timer-dt);a.animationTime+=dt;a.pose=null;
  if(a.hp<=0){animate(a,'death');continue;}
  if(a===p){if(a.timer<=0)animate(a,moved>1e-5?'walk':'idle');else if(a.animation==='cast')a.pose={anim:'cast',progress:Math.min(1,a.animationTime/.55)};a.angle=Math.atan2(w.aim.x-p.x,w.aim.y-p.y);continue;}
  let target=p;
  if(a.team==='ally'){
   target=null;let nearest=Infinity;
   for(const e of w.actors)if(e.team==='enemy'&&e.hp>0){const d=distance(a,e);if(d<nearest){target=e;nearest=d;}}
  }
  const goal=target||{x:p.x+Math.sin(a.phase)*3,y:p.y+Math.cos(a.phase)*3};
  const dx=goal.x-a.x,dy=goal.y-a.y,d=Math.hypot(dx,dy),boss=a===w.boss;
  if(a.timer>0)continue;
  if(d>(boss?3:1.5)||!lineClear(a,goal,.05,w.arena)){
   const pos=navigate(a,goal,a.team==='ally'?2.7:boss?1.1:1.35,dt,w.arena),dx=pos.x-a.x,dy=pos.y-a.y;a.x=pos.x;a.y=pos.y;a.walkDistance+=pos.distance;if(pos.distance>1e-5)a.angle=Math.atan2(dx,dy);animate(a,pos.distance>1e-5?'walk':'idle');
  }else if(target&&p.hp>0){
   a.angle=Math.atan2(dx,dy);animate(a,boss?'windup':'attack');a.animationTime=0;a.actionId++;a.timer=a.team==='enemy'?2.4:1;
   w.effects.push({id:w.nextId++,kind:a.team==='enemy'?'danger':'melee',source:a.id,target:target.id,x:goal.x,y:goal.y,radius:boss?3:a.team==='enemy'?1.7:.65,time:0,delay:a.team==='enemy'?.85:.35,hit:false});
  }else animate(a,'idle');
 }
 for(let i=w.effects.length-1;i>=0;i--){
  const e=w.effects[i],source=w.actors.find(a=>a.id===e.source);
  if(source&&source.hp<=0&&!e.hit){w.effects.splice(i,1);continue;}
  e.time+=dt;
  if(source?.hp>0){if(source===w.boss){const t=e.time;source.pose=t<.7?{anim:'windup',progress:t/.7}:t<.85?{anim:'attack',progress:(t-.7)/.15*4/13}:t<1.1?{anim:'attack',progress:4/13+(t-.85)/.25*9/13}:{anim:'recover',progress:Math.min(1,(t-1.1)/1.3)};animate(source,source.pose.anim);}else source.pose={anim:'attack',progress:e.time<e.delay?e.time/e.delay*.5:Math.min(1,.5+(e.time-e.delay)/.3*.5)};}
  if(e.time+1e-9>=e.delay&&!e.hit){
   e.hit=true;
   if(e.kind==='spell'){for(const a of w.actors)if(a.team==='enemy'&&a.hp>0&&distance(a,e)<e.radius){damage(a,35);w.hits++;}}
   else if(e.kind==='danger'){if(distance(p,e)<e.radius)damage(p,source===w.boss?25:12);}
   else{const target=w.actors.find(a=>a.id===e.target);if(target&&distance(target,e)<1)damage(target,8);}
  }
  if(source===w.boss&&source.hp>0&&e.time>e.delay+.25)animate(source,'recover');
  if(e.time>e.delay+.3)w.effects.splice(i,1);
 }
 // Morte precisa aparecer também no quadro em que o dano foi aplicado.
 for(const a of w.actors)if(a.hp<=0){animate(a,'death');a.pose=null;}
}
export function step(w,dt,input={}){
 if(w.paused||!Number.isFinite(dt)||dt<=0)return;
 // Subpassos limitam erro temporal; suspender uma aba não avança o combate inteiro.
 let left=Math.min(dt,.25);while(left>1e-9){const d=Math.min(left,1/60);tick(w,d,input);left-=d;}
}
