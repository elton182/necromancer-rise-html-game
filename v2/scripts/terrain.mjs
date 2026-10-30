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
 // Descarte rápido: o círculo em movimento só pode tocar um colisor cuja caixa encosta na caixa do trajeto (alargada por r).
 const x0=Math.min(p.x,p.x+d.x)-r,x1=Math.max(p.x,p.x+d.x)+r,y0=Math.min(p.y,p.y+d.y)-r,y1=Math.max(p.y,p.y+d.y)+r;
 for(const s of arena.solids){
  if(s.kind==='circle'){if(s.x+s.r<x0||s.x-s.r>x1||s.y+s.r<y0||s.y-s.r>y1)continue;keep(circleHit(p,d,s,r+s.r));continue;}
  const q=box(s);if(q.maxX<x0||q.minX>x1||q.maxY<y0||q.minY>y1)continue;
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
export function moveCircle(p,delta,r,arena=TRAINING_ARENA,{slide=true}={}){
 if(![p.x,p.y,delta.x,delta.y,r].every(Number.isFinite)||r<=0)throw Error('Movimento inválido.');
 let out=resolvePosition(p,r,arena),d={...delta},blocked=false;
 for(let pass=0;pass<5&&Math.hypot(d.x,d.y)>EPS;pass++){
  const h=hit(out,d,r,arena);if(!h){out.x+=d.x;out.y+=d.y;break;}blocked=true;
  const t=Math.max(0,h.t-EPS/Math.max(EPS,Math.hypot(d.x,d.y)));out.x+=d.x*t;out.y+=d.y*t;
  if(!slide)break;const left=1-t;d.x*=left;d.y*=left;const inward=d.x*h.nx+d.y*h.ny;if(inward<0){d.x-=inward*h.nx;d.y-=inward*h.ny;}else break;
 }
 out=resolvePosition(out,r,arena);return {...out,blocked,distance:Math.hypot(out.x-p.x,out.y-p.y)};
}
export function lineClear(a,b,r,arena=TRAINING_ARENA){return !overlaps(a,r,arena)&&!overlaps(b,r,arena)&&!hit(a,{x:b.x-a.x,y:b.y-a.y},r,arena);}
// Os nós da busca já são posições livres: só o trecho até o destino precisa ser testado.
const segmentClear=(a,b,r,arena)=>!overlaps(b,r,arena)&&!hit(a,{x:b.x-a.x,y:b.y-a.y},r,arena);
// Limite de nós por busca: caminhos reais passam longe disso; só alvos sem saída (ou corredores estreitos demais para a grade) o esgotam.
const SEARCH_LIMIT=400;
// Regiões livres da arena (grade de .4 u, com folga menor que o raio para nunca declarar "isolado" um caminho possível).
// Guardadas por vetor de colisores, que as portas da campanha substituem; assim a busca cara só roda entre pontos conectados.
const REGIONS=new WeakMap();
function regions(arena,r){
 const key=Math.round(r*20),byRadius=REGIONS.get(arena.solids)||new Map();REGIONS.set(arena.solids,byRadius);
 let map=byRadius.get(key);if(map)return map;
 const step=.4,rr=r*.75,b=arena.bounds,w=Math.floor((b.maxX-b.minX)/step)+1,h=Math.floor((b.maxY-b.minY)/step)+1,label=new Int32Array(w*h),blocked=new Uint8Array(w*h);
 // Rasteriza cada colisor só nas células que ele alcança (em vez de testar todas as células contra todos os colisores).
 const span=(lo,hi,min,count)=>[Math.max(0,Math.ceil((lo-min)/step)),Math.min(count-1,Math.floor((hi-min)/step))];
 for(const s of arena.solids){
  const q=s.kind==='circle'?{minX:s.x-s.r,maxX:s.x+s.r,minY:s.y-s.r,maxY:s.y+s.r}:box(s),[i0,i1]=span(q.minX-rr,q.maxX+rr,b.minX,w),[j0,j1]=span(q.minY-rr,q.maxY+rr,b.minY,h);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
   const x=b.minX+i*step,y=b.minY+j*step,d=s.kind==='circle'?Math.hypot(x-s.x,y-s.y)-s.r:Math.hypot(x-clamp(x,q.minX,q.maxX),y-clamp(y,q.minY,q.maxY));
   if(d<rr)blocked[j*w+i]=1;
  }
 }
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const x=b.minX+i*step,y=b.minY+j*step;if(x<b.minX+rr||x>b.maxX-rr||y<b.minY+rr||y>b.maxY-rr)blocked[j*w+i]=1;}
 let next=0;
 for(let start=0;start<label.length;start++){
  if(label[start]||blocked[start])continue;
  next++;label[start]=next;const stack=[start];
  while(stack.length){const i=stack.pop(),x=i%w,y=(i-x)/w;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const j=ny*w+nx;if(label[j]||blocked[j])continue;label[j]=next;stack.push(j);}
  }
 }
 map={label,w,h,step,minX:b.minX,minY:b.minY};byRadius.set(key,map);return map;
}
// Regiões das células ao redor do ponto (o ponto pode estar entre células bloqueadas e livres). Vazio = sem informação.
function regionsAround(m,p){
 const out=new Set(),cx=Math.round((p.x-m.minX)/m.step),cy=Math.round((p.y-m.minY)/m.step);
 for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){if(x<0||y<0||x>=m.w||y>=m.h)continue;const id=m.label[y*m.w+x];if(id)out.add(id);}
 return out;
}
// Só afirma "isolado" quando as regiões ao redor dos dois pontos não têm nada em comum.
function isolated(start,goal,r,arena){
 const m=regions(arena,r),a=regionsAround(m,start),g=regionsAround(m,goal);
 if(!a.size||!g.size)return false;
 for(const id of a)if(g.has(id))return false;
 return true;
}
export function findPath(start,target,r,arena=TRAINING_ARENA){
 const goal=resolvePosition(target,r+.02,arena);if(lineClear(start,goal,r,arena))return [goal];
 if(isolated(start,goal,r,arena))return [];
 const stride=.8,key=(i,j)=>i+','+j,open=[],seen=new Map();
 const initial={i:0,j:0,x:start.x,y:start.y,g:0,f:Math.hypot(goal.x-start.x,goal.y-start.y)};open.push(initial);seen.set('0,0',initial);
 for(let count=0;open.length&&count<SEARCH_LIMIT;count++){
  // Menor custo estimado: varredura linear em vez de ordenar a lista inteira a cada nó (era o gargalo quando não há caminho).
  let best=0;for(let k=1;k<open.length;k++)if(open[k].f<open[best].f)best=k;
  const n=open[best];open[best]=open[open.length-1];open.pop();if(n.closed)continue;n.closed=true;
  if(segmentClear(n,goal,r,arena)){const path=[goal];for(let p=n;p.parent;p=p.parent)path.unshift({x:p.x,y:p.y});return path;}
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
   if(!i&&!j)continue;const ni=n.i+i,nj=n.j+j,id=key(ni,nj),old=seen.get(id),p={x:start.x+ni*stride,y:start.y+nj*stride};if(old?.closed||!segmentClear(n,p,r,arena))continue;
   const g=n.g+Math.hypot(i,j)*stride;if(old&&old.g<=g)continue;const next={...p,i:ni,j:nj,g,f:g+Math.hypot(goal.x-p.x,goal.y-p.y),parent:n};seen.set(id,next);open.push(next);
  }
 }
 return [];
}
export function navigate(a,target,speed,dt,arena=TRAINING_ARENA){
 const r=a.radius,goal=resolvePosition(target,r+.02,arena);let waypoint=goal;
 a.navRetry=Math.max(0,(a.navRetry||0)-dt);
 if(!lineClear(a,goal,r,arena)){
  // Sem caminho (alvo isolado por obstáculos): espera antes de procurar de novo, em vez de refazer a busca a cada quadro.
  // Primeira busca de cada inimigo adiada por um sorteio curto, para uma horda inteira não buscar no mesmo quadro.
  if(a.navGoal===undefined&&!a.navPath){a.navGoal=goal;a.navFail=true;a.navRetry=Math.random()*.35;}
  if(!a.navPath&&a.navFail&&a.navRetry>0)return {...a,distance:0};
  if(!a.navPath||a.navRetry<=0&&Math.hypot(goal.x-a.navGoal.x,goal.y-a.navGoal.y)>1.5){
   a.navPath=findPath(a,goal,r,arena);a.navGoal=goal;a.navFail=!a.navPath.length;a.navRetry=a.navFail?1.5+Math.random():.7;
  }
  while(a.navPath.length&&Math.hypot(a.navPath[0].x-a.x,a.navPath[0].y-a.y)<.15)a.navPath.shift();
  if(!a.navPath.length){a.navPath=null;return {...a,distance:0};}waypoint=a.navPath[0];
  if(!lineClear(a,waypoint,r,arena)){a.navPath=null;return {...a,distance:0};}
 }else a.navPath=null;
 const dx=waypoint.x-a.x,dy=waypoint.y-a.y,d=Math.hypot(dx,dy),travel=Math.min(d,speed*dt);return moveCircle(a,{x:d?dx/d*travel:0,y:d?dy/d*travel:0},r,arena);
}
