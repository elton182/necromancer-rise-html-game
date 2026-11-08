// Relevo e regiões do mundo de Jacarandá, no mesmo espírito da Várzea de Itaúna: colinas largas por onde as estradas passam
// suaves, terras altas e cumes nevados ao norte e nordeste, colinas cinzentas da cripta, alto do cemitério e baixada alagada da serraria.
// Penhascos só nascem longe das estradas e dos lugares da história. Dados puros: devolve a grade de trabalho (`openGrid`).
import {gridFor} from './map-terrain.mjs';
import {clamp,mix,smooth,fbm,lineDistance} from './itauna-map.mjs';
import {WORLD_POINTS,WORLD_ROUTES,WORLD_ROAD_ITAUNA,WORLD_ENCOUNTERS,WORLD_PILES} from './campaign-world-model.mjs';

const SIZE={w:360,h:360};
// Retângulos aplainados: interior da cripta, vila, pátio da mina e capela do cemitério. `h` null usa a altura larga do lugar.
export const FLAT_ZONES=[
 {name:'cripta',x0:-116,x1:-54,y0:-110,y1:-60,h:.3,margin:8},
 {name:'vila',x0:34,x1:86,y0:36,y1:98,h:.3,margin:10},
 {name:'mina',x0:4,x1:58,y0:-168,y1:-122,h:null,margin:12},
 {name:'cemitério',x0:112,x1:174,y0:6,y1:56,h:null,margin:10}
];
export const MARSH={x:-118,y:142,r:56},POND={x:-150,y:154,rx:15,ry:10};
const PEAKS={x:140,y:-130};
const pointList=()=>[...Object.values(WORLD_POINTS),...WORLD_ENCOUNTERS,...WORLD_PILES];
const rectDistance=(z,x,y)=>Math.hypot(Math.max(z.x0-x,0,x-z.x1),Math.max(z.y0-y,0,y-z.y1));
// Altura larga: o que as estradas acompanham. Rampas suaves, sem penhasco.
function broad(x,y){
 let h=.42+Math.max(0,fbm(x/80,y/80,211,3)-.36)*1.9;
 h+=smooth(-96,-150,y)*(2.9+fbm(x/50,0,213,2)*1.4);
 h+=smooth(70,150,x)*smooth(-50,-120,y)*(1.8+fbm(x/40,y/40,217,2)*1.2);
 h+=1.7*smooth(64,10,Math.hypot(x+130,y+30))*smooth(.35,.7,fbm(x/30,y/30,219,2));
 h+=1.1*smooth(52,20,Math.hypot(x-144,y-30));
 h+=smooth(100,170,x)*smooth(100,170,y)*1.6+smooth(-150,-178,x)*1.6+smooth(150,178,y)*smooth(-60,-178,x)*.8;
 h*=mix(.42,1,smooth(MARSH.r*.55,MARSH.r,Math.hypot(x-MARSH.x,y-MARSH.y)));
 return h;
}
// `rivers`: rios da edição publicada, para as margens descerem antes do leito. `paths`: círculos de trilha do mapa ({x,y,r}).
export function worldRelief({rivers=[],paths=[]}={}){
 const grid=gridFor(SIZE),n=grid.cols*grid.rows,x0=-(grid.cols-1)*grid.cell/2,y0=-(grid.rows-1)*grid.cell/2,h=new Float32Array(n),s=new Uint8Array(n);
 const routes=[...Object.values(WORLD_ROUTES),WORLD_ROAD_ITAUNA],points=pointList();
 // Trilhas agrupadas em células de 24 u: consulta rápida da distância até a estrada mais próxima.
 const bucket=new Map(),key=(i,j)=>i+':'+j;for(const p of paths){const k=key(Math.floor(p.x/24),Math.floor(p.y/24));if(!bucket.has(k))bucket.set(k,[]);bucket.get(k).push(p);}
 const roadDistance=(x,y)=>{let d=Infinity;const i=Math.floor(x/24),j=Math.floor(y/24);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const p of bucket.get(key(i+a,j+b))||[])d=Math.min(d,Math.hypot(x-p.x,y-p.y)-p.r);for(const r of routes)d=Math.min(d,lineDistance(r,x,y).d-2.5);return d;};
 const zoneHeight=FLAT_ZONES.map(z=>z.h??broad((z.x0+z.x1)/2,(z.y0+z.y1)/2));
 for(let j=0;j<grid.rows;j++)for(let i=0;i<grid.cols;i++){
  const x=x0+i*grid.cell,y=y0+j*grid.cell,k=j*grid.cols+i,base=broad(x,y),road=roadDistance(x,y);
  let near=Infinity;for(const p of points)near=Math.min(near,Math.hypot(x-p.x,y-p.y));
  const wild=smooth(12,22,road)*smooth(14,24,near);
  let v=base+(fbm(x/18,y/18,223,3)-.5)*.5*smooth(3,10,road);
  // Cristas rochosas nas terras altas e nos cumes, só onde ninguém precisa passar.
  const high=Math.max(smooth(-90,-130,y),smooth(80,140,x)*smooth(-40,-100,y),smooth(-140,-170,x));
  const ridge=fbm(x/26,y/26,227,3);v+=wild*high*smooth(.56,.6,ridge)*(1.6+ridge*2.6);
  v+=wild*2.6*smooth(70,30,Math.hypot(x-PEAKS.x,y-PEAKS.y))*smooth(.45,.55,fbm(x/16,y/16,229,2));
  // Lagoa da baixada e vale do rio.
  const pond=Math.hypot((x-POND.x)/POND.rx,(y-POND.y)/POND.ry)*(1+(fbm(x/10,y/10,231,2)-.5)*.3);if(pond<1.3)v=pond>=1?mix(.24,v,smooth(1,1.3,pond)):-1.5*(1-pond*pond)**.8;
  let river=Infinity;for(const r of rivers)river=Math.min(river,lineDistance(r.points,x,y).d);if(v<3.4&&river<34)v=mix(.3+(v-.3)*.35,v,smooth(8,34,river));
  // Lugares aplainados: interiores e pátios ficam nivelados, com borda suave.
  FLAT_ZONES.forEach((z,i)=>{const d=rectDistance(z,x,y);if(d<z.margin)v=mix(zoneHeight[i],v,smooth(0,z.margin,d));});
  h[k]=clamp(v,-3,8);
  const broadH=base,patch=fbm(x/38,y/38,233,2);
  if(broadH>4.6&&h[k]>4.4)s[k]=4;
  else if(broadH>3.1&&road>5||wild*high>.5&&smooth(.56,.6,ridge)>.5)s[k]=3;
  else if(Math.hypot(x-MARSH.x,y-MARSH.y)<MARSH.r*.8&&h[k]>0&&patch>.47&&road>3)s[k]=5;
  else if(rectDistance(FLAT_ZONES[3],x,y)<6&&patch>.5)s[k]=3;
 }
 return {...grid,x0,y0,h,s};
}
// Mescla com uma edição: alturas e superfícies pintadas à mão ganham do relevo gerado (alturas: a maior das duas).
export function mergeRelief(generated,edited){
 const out={...generated,h:Float32Array.from(generated.h),s:Uint8Array.from(generated.s)};
 for(let k=0;k<out.h.length;k++){if(edited.h[k]!==0)out.h[k]=Math.max(out.h[k],edited.h[k]);if(edited.s[k])out.s[k]=edited.s[k];}
 return out;
}
