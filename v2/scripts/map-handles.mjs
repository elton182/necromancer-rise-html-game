// Seleção e alças do editor no 3D, sem DOM nem Three.js: o que o raio do ponteiro toca e o que cada alça faz com a peça.
// Coordenadas do mapa: x/y no chão; `up` é a altura. O raio usa os eixos do Three.js (y para cima, z = y do mapa).
import {PROPS,canRotate} from './map-model.mjs';

const MIN_HEIGHT=.6,DEFAULT_HEIGHT=.9,MARKER_HEIGHT=2.6,MARKER_RADIUS=.7,ROTATE_STEP=15;
const FLAT=o=>PROPS[o.type]?.group==='Chão'||o.type==='crypt_floor';
const heightOf=(o,def)=>o.h??def.pickH??(o.s??1)*DEFAULT_HEIGHT;
const radians=o=>(o.rot||0)*Math.PI/180;
// Do referencial da peça para o mapa, e de volta. Mesmo sentido de `rotation.y` e dos colisores girados.
const toMap=(o,lx,ly)=>{const a=radians(o),c=Math.cos(a),s=Math.sin(a);return {x:o.x+lx*c+ly*s,y:o.y-lx*s+ly*c};};
const toPiece=(o,p)=>{const a=radians(o),c=Math.cos(a),s=Math.sin(a),dx=p.x-o.x,dy=p.y-o.y;return {x:dx*c-dy*s,y:dx*s+dy*c};};
const radiusOf=(o,def)=>(o.r??def.r??.5)*(def.dims?.includes('s')?o.s??1:1);
// Caixas de seleção da peça. Árvores têm duas: tronco e copa, para a copa não roubar cliques do chão ao redor do tronco.
export function pickBoxes(o,def=PROPS[o.type],ground=0){
 if(!def)return [];
 const up=def.float?0:ground,h=Math.max(FLAT(o)?.05:MIN_HEIGHT,heightOf(o,def));
 if(def.shape==='box')return [{x0:o.x-o.w/2,x1:o.x+o.w/2,z0:o.y-o.d/2,z1:o.y+o.d/2,y0:up,y1:up+h,...(o.rot?{angle:radians(o),cx:o.x,cz:o.y}:{})}];
 const r=Math.max(.35,radiusOf(o,def)),box=(rr,y0,y1)=>({x0:o.x-rr,x1:o.x+rr,z0:o.y-rr,z1:o.y+rr,y0:up+y0,y1:up+y1});
 if(def.look==='oak'||def.look==='pine')return [box(r,0,h),box(h*.3,h*.4,h)];
 return [box(r,0,h)];
}
// Caixa que envolve a peça inteira: é o contorno desenhado na seleção.
export function objectBounds(o,def=PROPS[o.type],ground=0){
 const boxes=pickBoxes(o,def,ground);if(!boxes.length)return null;
 if(boxes.length===1)return boxes[0];
 return boxes.reduce((a,b)=>({x0:Math.min(a.x0,b.x0),x1:Math.max(a.x1,b.x1),z0:Math.min(a.z0,b.z0),z1:Math.max(a.z1,b.z1),y0:Math.min(a.y0,b.y0),y1:Math.max(a.y1,b.y1)}));
}
function slab(ray,b){
 let near=-Infinity,far=Infinity,ox=ray.ox,oz=ray.oz,dx=ray.dx,dz=ray.dz;
 // Caixa girada: gira o raio em volta do centro dela e testa como se estivesse alinhada.
 if(b.angle){const c=Math.cos(b.angle),s=Math.sin(b.angle),rx=ox-b.cx,rz=oz-b.cz;ox=b.cx+rx*c-rz*s;oz=b.cz+rx*s+rz*c;const ndx=dx*c-dz*s;dz=dx*s+dz*c;dx=ndx;}
 for(const [o,d,lo,hi] of [[ox,dx,b.x0,b.x1],[ray.oy,ray.dy,b.y0,b.y1],[oz,dz,b.z0,b.z1]]){
  if(Math.abs(d)<1e-9){if(o<lo||o>hi)return null;continue;}
  const a=(lo-o)/d,c=(hi-o)/d;near=Math.max(near,Math.min(a,c));far=Math.min(far,Math.max(a,c));if(near>far)return null;
 }
 return far<0?null:Math.max(0,near);
}
// O que o raio toca primeiro: marcadores antes de peças, e peças antes das manchas planas de chão. Rios ficam para o chamador, pelo ponto no chão.
export function rayPick(ray,flat,ground=()=>0){
 let best=null,bestT=Infinity,flatHit=null,flatT=Infinity;
 const marker=(p,hit)=>{const up=ground(p.x,p.y),t=slab(ray,{x0:p.x-MARKER_RADIUS,x1:p.x+MARKER_RADIUS,z0:p.y-MARKER_RADIUS,z1:p.y+MARKER_RADIUS,y0:up,y1:up+MARKER_HEIGHT});if(t!==null&&t<bestT){bestT=t;best=hit;}};
 for(const o of flat.objects){
  const hit={kind:o.inherited?'base':'object',id:o.id};
  for(const box of pickBoxes(o,PROPS[o.type],ground(o.x,o.y))){
   const t=slab(ray,box);if(t===null)continue;
   if(FLAT(o)){if(t<flatT){flatT=t;flatHit=hit;}}else if(t<bestT){bestT=t;best=hit;}
  }
 }
 for(const s of flat.spawns)marker(s,{kind:'spawn',id:s.id});
 marker(flat.start,{kind:'start'});
 return best||flatHit;
}

// --- Alças ---
// Pontos de agarrar da peça selecionada. `edge`: arrasta um lado, com o oposto parado (bom para encostar em outra peça).
export function handlesFor(o,def=PROPS[o.type]){
 if(!def)return [];
 const out=[],h=heightOf(o,def);
 if(def.shape==='box'){
  for(const [id,lx,ly] of [['e',o.w/2,0],['w',-o.w/2,0],['s',0,o.d/2],['n',0,-o.d/2]])out.push({id,kind:'edge',...toMap(o,lx,ly),up:.3});
 }else if(def.dims?.includes('r'))out.push({id:'r',kind:'edge',x:o.x+o.r,y:o.y,up:.3});
 else if(def.dims?.includes('s'))out.push({id:'scale',kind:'edge',x:o.x+radiusOf(o,def),y:o.y,up:.3});
 if(def.dims?.includes('h'))out.push({id:'h',kind:'height',x:o.x,y:o.y,up:h});
 if(canRotate(def))out.push({id:'rot',kind:'rotate',...toMap(o,(def.shape==='box'?o.w/2:radiusOf(o,def))+.9,0),up:.3});
 return out;
}
const snapTo=(v,step)=>step?Math.round(v/step)*step:v;
// Novos campos da peça ao arrastar a alça até `p`. `start`: a peça como estava ao agarrar. `lift`: subida do ponteiro em unidades. `steps`: giro em passos de 15°; sem ele, o giro é livre.
export function applyHandle(start,handle,p,{snap=0,lift=0,steps=false}={}){
 const o={...start};
 // Lados: o ponto vai para o referencial da peça. A grade vale no mapa para a peça alinhada e na medida do lado para a girada.
 const edge=handle==='e'||handle==='w'||handle==='n'||handle==='s',grid=edge?toPiece(start,start.rot?p:{x:snapTo(p.x,snap),y:snapTo(p.y,snap)}):null;
 if(handle==='e'||handle==='w'){
  const at=start.rot?snapTo(grid.x,snap):grid.x,left=-start.w/2,right=start.w/2,a=handle==='w'?Math.min(at,right-.2):left,b=handle==='e'?Math.max(at,left+.2):right,q=toMap(start,(a+b)/2,0);
  o.w=b-a;o.x=q.x;o.y=q.y;
 }else if(handle==='n'||handle==='s'){
  const at=start.rot?snapTo(grid.y,snap):grid.y,top=-start.d/2,bottom=start.d/2,a=handle==='n'?Math.min(at,bottom-.2):top,b=handle==='s'?Math.max(at,top+.2):bottom,q=toMap(start,0,(a+b)/2);
  o.d=b-a;o.x=q.x;o.y=q.y;
 }else if(handle==='r')o.r=Math.max(.1,Math.hypot(p.x-start.x,p.y-start.y));
 else if(handle==='scale'){const base=PROPS[start.type]?.r||.5;o.s=Math.max(.2,Math.hypot(p.x-start.x,p.y-start.y)/base);}
 else if(handle==='h')o.h=Math.max(.1,(start.h??1)+lift);
 else if(handle==='rot'){const deg=Math.atan2(-(p.y-start.y),p.x-start.x)*180/Math.PI;o.rot=steps?Math.round(deg/ROTATE_STEP)*ROTATE_STEP:Math.round(deg);}
 return o;
}
