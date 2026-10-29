// Gerado da fonte canônica.
const module={exports:{}};
(function(root){
'use strict';
const ability={kind:'charge',name:'Investida da Cripta',windup:.75,cooldown:7,range:7,minRange:2.5,distance:6,speed:12,width:1,recovery:1,mult:1.6,color:'#e4ad64'};
function arenaTypes(wave,count,types,random=Math.random,campaign=false){
 const old=types.slice(0,4),available=old.slice(0,Math.min(4,1+Math.floor(wave/2)));
 const list=Array.from({length:count},()=>available[Math.floor(random()*available.length)]);
 const dog=types.find(t=>t.id==='cryptHound');
 if(campaign||wave<4||!dog)return list;
 const n=Math.min(count,wave===4?1:wave===5?2:Math.floor(count*.2));
 if(wave<=5)list.fill(old[0]);
 for(let i=0;i<n;i++)list[wave===4?0:Math.floor(i*count/n)]=dog;
 return list;
}
function circleHit(ax,ay,bx,by,x,y,r){
 const dx=bx-ax,dy=by-ay,ox=ax-x,oy=ay-y,c=ox*ox+oy*oy-r*r;
 if(c<=0)return 0;const a=dx*dx+dy*dy;if(a===0)return null;
 const b=2*(ox*dx+oy*dy),disc=b*b-4*a*c;if(disc<0)return null;
 const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:null;
}
function wallHit(ax,ay,bx,by,w,r){
 const ox=ax-w.x,oy=ay-w.y,dx=bx-ax,dy=by-ay,nx=-w.uy,ny=w.ux;
 let lo=0,hi=1;
 for(const [p,v,extent]of [[ox*w.ux+oy*w.uy,dx*w.ux+dy*w.uy,w.half+r],[ox*nx+oy*ny,dx*nx+dy*ny,w.width/2+r]]){
  if(Math.abs(v)<1e-9){if(Math.abs(p)>extent)return null;}
  else{let a=(-extent-p)/v,b=(extent-p)/v;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);}
 }
 return lo<=hi&&hi>=0&&lo<=1?Math.max(0,lo):null;
}
// Conservative sweep: walls win ties, so damage cannot pass through cover.
function sweep(ax,ay,bx,by,solids,walls,targets){
 let hit=null;
 const add=(t,target=null)=>{if(t!==null&&(!hit||t<hit.t))hit={t,target};};
 for(const p of solids)add(circleHit(ax,ay,bx,by,p.x,p.y,p.r+.5));
 for(const w of walls)add(wallHit(ax,ay,bx,by,w,.5));
 for(const t of targets)add(circleHit(ax,ay,bx,by,t.x,t.y,.5),t);
 return hit;
}
function update(e,dt,env){
 if(e.dead){e.ability=null;return false;}
 let a=e.ability,remaining=dt;
 if(!a){
  const cooldown=e.abilityCd??2;
  e.abilityCd=Math.max(0,cooldown-dt);
  if(e.abilityCd>0)return false;
  const target=env.target(e);if(!target)return false;
  const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);
  if(d<ability.minRange||d>ability.range)return false;
  remaining=Math.max(0,dt-cooldown);
  a=e.ability={phase:'windup',time:0,sx:e.x,sy:e.y,dx:dx/d,dy:dy/d,distance:Math.min(d,ability.distance),travel:0};
  a.tx=a.sx+a.dx*a.distance;a.ty=a.sy+a.dy*a.distance;
  e.kx=0;e.ky=0;e.swing=0;e.face=a.dx<0?-1:1;
 }
 // Consume phase boundaries exactly, including long frames.
 while(remaining>1e-9&&e.ability){
  if(a.phase==='windup'){
   const step=Math.min(remaining,ability.windup-a.time);a.time+=step;remaining-=step;
   if(a.time+1e-9<ability.windup)break;
   a.phase='charge';a.time=0;
  }else if(a.phase==='charge'){
   const step=Math.min(remaining,(a.distance-a.travel)/ability.speed),distance=step*ability.speed;
   const bx=e.x+a.dx*distance,by=e.y+a.dy*distance,bounded=env.bound(bx,by);
   const blocked=Math.hypot(bounded.x-bx,bounded.y-by)>.00001;
   let limit=1;
   if(blocked){
    let lo=0,hi=1;
    for(let i=0;i<24;i++){const k=(lo+hi)/2,x=e.x+a.dx*distance*k,y=e.y+a.dy*distance*k,q=env.bound(x,y);if(Math.hypot(q.x-x,q.y-y)>1e-8)hi=k;else lo=k;}
    limit=lo;
   }
   const hit=env.sweep(e.x,e.y,e.x+a.dx*distance*limit,e.y+a.dy*distance*limit);
   const t=limit*(hit?Math.max(0,hit.t-1e-5):1);
   e.x+=a.dx*distance*t;e.y+=a.dy*distance*t;a.travel+=distance*t;a.time+=step*t;remaining-=step*t;
   if(hit?.target)env.damage(hit.target,Math.round(e.dmg*ability.mult));
   if(hit||blocked||a.travel+1e-8>=a.distance){a.phase='recover';a.time=0;e.atkTimer=1.2;}
  }else{
   const step=Math.min(remaining,ability.recovery-a.time);a.time+=step;remaining-=step;
   if(a.time+1e-9<ability.recovery)break;
   e.ability=null;e.abilityCd=ability.cooldown;
  }
 }
 return true;
}
const api={ability,arenaTypes,circleHit,wallHit,sweep,update};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CryptHoundModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);

export default module.exports;
