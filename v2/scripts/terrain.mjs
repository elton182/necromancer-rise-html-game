// Colisão/navegação no plano x/y. Altura dos modelos não participa do cálculo.
const EPS=1e-6,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const TRAINING_ARENA={id:'training-e3',bounds:{minX:-15,maxX:15,minY:-15,maxY:15},solids:[
 {id:'west-wall',kind:'box',x:-7,y:-2,width:.65,depth:7,height:.9},
 {id:'east-wall',kind:'box',x:7,y:-2,width:.65,depth:7,height:.9},
 {id:'west-pillar',kind:'circle',x:-3,y:-3,r:.65,height:1.2},
 {id:'east-pillar',kind:'circle',x:4,y:0,r:.55,height:1.2}
]};
function box(s){return {minX:s.x-s.width/2,maxX:s.x+s.width/2,minY:s.y-s.depth/2,maxY:s.y+s.depth/2};}
function circleHit(p,d,c,r){
 const x=p.x-c.x,y=p.y-c.y,a=d.x*d.x+d.y*d.y;if(a<EPS*EPS)return null;
 const b=x*d.x+y*d.y,disc=b*b-a*(x*x+y*y-r*r);if(disc<0)return null;
 const t=(-b-Math.sqrt(disc))/a;if(t< -EPS||t>1)return null;
 const nx=x+d.x*Math.max(0,t),ny=y+d.y*Math.max(0,t),n=Math.hypot(nx,ny);if(n<EPS||d.x*nx+d.y*ny>=0)return null;
 return {t:Math.max(0,t),nx:nx/n,ny:ny/n};
}
function hit(p,d,r,arena){
 let best=null;const keep=h=>{if(h&&h.t>=0&&h.t<=1&&(!best||h.t<best.t))best=h;};
 const b=arena.bounds;
 for(const [axis,lo,hi]of [['x',b.minX+r,b.maxX-r],['y',b.minY+r,b.maxY-r]]){
  const v=d[axis];if(Math.abs(v)<EPS)continue;const t=((v>0?hi:lo)-p[axis])/v;keep({t,nx:axis==='x'?(v>0?-1:1):0,ny:axis==='y'?(v>0?-1:1):0});
 }
 for(const s of arena.solids){
  if(s.kind==='circle'){keep(circleHit(p,d,s,r+s.r));continue;}
  const q=box(s);
  for(const [axis,min,max,other,otherMin,otherMax]of [['x',q.minX-r,q.maxX+r,'y',q.minY,q.maxY],['y',q.minY-r,q.maxY+r,'x',q.minX,q.maxX]]){
   const v=d[axis];if(Math.abs(v)<EPS)continue;const t=((v>0?min:max)-p[axis])/v,value=p[other]+d[other]*t;
   if(value>=otherMin-EPS&&value<=otherMax+EPS)keep({t,nx:axis==='x'?(v>0?-1:1):0,ny:axis==='y'?(v>0?-1:1):0});
  }
  for(const x of [q.minX,q.maxX])for(const y of [q.minY,q.maxY])keep(circleHit(p,d,{x,y},r));
 }
 return best;
}
export function overlaps(p,r,arena=TRAINING_ARENA){
 const b=arena.bounds;if(p.x<b.minX+r-EPS||p.x>b.maxX-r+EPS||p.y<b.minY+r-EPS||p.y>b.maxY-r+EPS)return true;
 return arena.solids.some(s=>{if(s.kind==='circle')return Math.hypot(p.x-s.x,p.y-s.y)<r+s.r-EPS;const q=box(s);return Math.hypot(p.x-clamp(p.x,q.minX,q.maxX),p.y-clamp(p.y,q.minY,q.maxY))<r-EPS;});
}
export function resolvePosition(p,r,arena=TRAINING_ARENA){
 const out={x:p.x,y:p.y},b=arena.bounds;
 for(let pass=0;pass<12;pass++){
  out.x=clamp(out.x,b.minX+r,b.maxX-r);out.y=clamp(out.y,b.minY+r,b.maxY-r);
  for(const s of arena.solids){
   let x,y,min=r;if(s.kind==='circle'){x=out.x-s.x;y=out.y-s.y;min+=s.r;}else{const q=box(s);x=out.x-clamp(out.x,q.minX,q.maxX);y=out.y-clamp(out.y,q.minY,q.maxY);if(Math.hypot(x,y)<EPS){const choices=[{d:out.x-q.minX,x:q.minX-r-EPS,y:out.y},{d:q.maxX-out.x,x:q.maxX+r+EPS,y:out.y},{d:out.y-q.minY,x:out.x,y:q.minY-r-EPS},{d:q.maxY-out.y,x:out.x,y:q.maxY+r+EPS}];choices.sort((a,b)=>a.d-b.d);Object.assign(out,{x:choices[0].x,y:choices[0].y});continue;}}
   const length=Math.hypot(x,y);if(length<min){if(length<EPS){x=1;y=0;}const n=length<EPS?1:length;out.x+=x/n*(min-length+EPS);out.y+=y/n*(min-length+EPS);}
  }
  if(!overlaps(out,r,arena))break;
 }
 return out;
}
export function moveCircle(p,delta,r,arena=TRAINING_ARENA){
 if(![p.x,p.y,delta.x,delta.y,r].every(Number.isFinite)||r<=0)throw Error('Movimento inválido.');
 let out=resolvePosition(p,r,arena),d={...delta},blocked=false;
 for(let pass=0;pass<5&&Math.hypot(d.x,d.y)>EPS;pass++){
  const h=hit(out,d,r,arena);if(!h){out.x+=d.x;out.y+=d.y;break;}blocked=true;
  const t=Math.max(0,h.t-EPS/Math.max(EPS,Math.hypot(d.x,d.y)));out.x+=d.x*t;out.y+=d.y*t;
  const left=1-t;d.x*=left;d.y*=left;const inward=d.x*h.nx+d.y*h.ny;if(inward<0){d.x-=inward*h.nx;d.y-=inward*h.ny;}else break;
 }
 out=resolvePosition(out,r,arena);return {...out,blocked,distance:Math.hypot(out.x-p.x,out.y-p.y)};
}
export function lineClear(a,b,r,arena=TRAINING_ARENA){return !overlaps(a,r,arena)&&!overlaps(b,r,arena)&&!hit(a,{x:b.x-a.x,y:b.y-a.y},r,arena);}
export function findPath(start,target,r,arena=TRAINING_ARENA){
 const goal=resolvePosition(target,r+.02,arena);if(lineClear(start,goal,r,arena))return [goal];
 const stride=.8,key=(i,j)=>i+','+j,open=[],seen=new Map();
 const initial={i:0,j:0,x:start.x,y:start.y,g:0,f:Math.hypot(goal.x-start.x,goal.y-start.y)};open.push(initial);seen.set('0,0',initial);
 for(let count=0;open.length&&count<2000;count++){
  open.sort((a,b)=>b.f-a.f);const n=open.pop();if(n.closed)continue;n.closed=true;
  if(lineClear(n,goal,r,arena)){const path=[goal];for(let p=n;p.parent;p=p.parent)path.unshift({x:p.x,y:p.y});return path;}
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
   if(!i&&!j)continue;const ni=n.i+i,nj=n.j+j,id=key(ni,nj),old=seen.get(id),p={x:start.x+ni*stride,y:start.y+nj*stride};if(old?.closed||!lineClear(n,p,r,arena))continue;
   const g=n.g+Math.hypot(i,j)*stride;if(old&&old.g<=g)continue;const next={...p,i:ni,j:nj,g,f:g+Math.hypot(goal.x-p.x,goal.y-p.y),parent:n};seen.set(id,next);open.push(next);
  }
 }
 return [];
}
export function navigate(a,target,speed,dt,arena=TRAINING_ARENA){
 const r=a.radius,goal=resolvePosition(target,r+.02,arena);let waypoint=goal;
 a.navRetry=Math.max(0,(a.navRetry||0)-dt);
 if(!lineClear(a,goal,r,arena)){
  if(!a.navPath||a.navRetry<=0&&Math.hypot(goal.x-a.navGoal.x,goal.y-a.navGoal.y)>1.5){a.navPath=findPath(a,goal,r,arena);a.navGoal=goal;a.navRetry=.7;}
  while(a.navPath.length&&Math.hypot(a.navPath[0].x-a.x,a.navPath[0].y-a.y)<.15)a.navPath.shift();
  if(!a.navPath.length){a.navPath=null;return {...a,distance:0};}waypoint=a.navPath[0];
  if(!lineClear(a,waypoint,r,arena)){a.navPath=null;return {...a,distance:0};}
 }else a.navPath=null;
 const dx=waypoint.x-a.x,dy=waypoint.y-a.y,d=Math.hypot(dx,dy),travel=Math.min(d,speed*dt);return moveCircle(a,{x:d?dx/d*travel:0,y:d?dy/d*travel:0},r,arena);
}
