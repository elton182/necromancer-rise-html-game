// Relevo, água e superfícies dos mapas: dados puros, sem DOM nem Three.js.
// O documento guarda uma grade de alturas (água = abaixo da cota 0), uma grade de superfícies e os rios como linhas.
// `bakeTerrain` junta tudo em dados de consulta; deep e penhasco viram colisores no mesmo caminho dos demais (`terrain.mjs`).
export const TERRAIN_RULES={
 minHeight:-3,maxHeight:8,wet:-.08,deep:-.7,cliff:1.15,
 water:.6,current:.25,climb:.35,descend:.12,highGround:1.2,highGroundBonus:1.2,deck:.55,fade:12,maxCells:40000,maxRivers:24,maxRiverPoints:200
};
// Superfícies pintadas: `speed` multiplica o deslocamento de quem anda por cima.
export const SURFACES={1:{id:'dirt',label:'Terra',speed:1,color:'#7a6444'},2:{id:'sand',label:'Areia',speed:.9,color:'#c9b179'},3:{id:'stone',label:'Pedra',speed:1,color:'#8a8c88'},4:{id:'snow',label:'Neve',speed:.85,color:'#dfe6ec'},5:{id:'mud',label:'Lama',speed:.7,color:'#4a3d2a'}};
const R=TERRAIN_RULES,HEIGHT_SCALE=20,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=(v,d)=>Number.isFinite(+v)&&v!==null&&v!==''?+v:d;
const round=v=>Math.round(v*20)/20;

// --- Grade e formato ---
export function gridFor(size){const cell=Math.max(1,Math.ceil(Math.max(size.w,size.h)/180));return {cell,cols:Math.ceil(size.w/cell)+1,rows:Math.ceil(size.h/cell)+1};}
export function encodeGrid(values,scale=1){
 const out=[];let run=0,last=null;
 const flush=()=>{if(run)out.push(run>1?last+'*'+run:String(last));};
 for(let i=0;i<values.length;i++){const v=Math.round(values[i]*scale);if(v===last)run++;else{flush();last=v;run=1;}}
 flush();return out.join(',');
}
export function decodeGrid(text,length,scale=1,Type=Float32Array){
 const out=new Type(length);let i=0;
 for(const part of String(text||'').split(',')){const [v,n]=part.split('*'),value=Number(v)/scale,count=n===undefined?1:Math.floor(Number(n));if(!Number.isFinite(value)||!(count>0))continue;for(let k=0;k<count&&i<length;k++)out[i++]=value;}
 return out;
}
const pointList=raw=>(Array.isArray(raw)?raw:[]).slice(0,R.maxRiverPoints).map(p=>Array.isArray(p)?[round(num(p[0],0)),round(num(p[1],0))]:null).filter(Boolean);
export function normalizeRiver(raw,taken=new Set()){
 const points=pointList(raw?.points);if(points.length<2)return null;
 let id=String(raw?.id||'').slice(0,32);if(!id||taken.has(id))do id='r'+Math.floor(Math.random()*36**5).toString(36);while(taken.has(id));taken.add(id);
 return {id,points,width:clamp(round(num(raw.width,6)),2,40),depth:clamp(round(num(raw.depth,1.2)),.2,3)};
}
export function normalizeTerrain(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const cell=Math.floor(num(raw.cell,0)),cols=Math.floor(num(raw.cols,0)),rows=Math.floor(num(raw.rows,0));
 if(!(cell>=1&&cols>=2&&rows>=2)||cols*rows>R.maxCells)return null;
 const taken=new Set(),rivers=(Array.isArray(raw.rivers)?raw.rivers:[]).slice(0,R.maxRivers).map(r=>normalizeRiver(r,taken)).filter(Boolean);
 return {cell,cols,rows,h:typeof raw.h==='string'?raw.h:'0*'+cols*rows,s:typeof raw.s==='string'?raw.s:'0*'+cols*rows,rivers};
}
export function blankTerrain(size){const g=gridFor(size);return {...g,h:'0*'+g.cols*g.rows,s:'0*'+g.cols*g.rows,rivers:[]};}
// Grade de trabalho do editor. A origem é centrada no mapa, então redimensionar preserva as posições.
export function openGrid(t){
 const length=t.cols*t.rows;
 return {cell:t.cell,cols:t.cols,rows:t.rows,x0:-(t.cols-1)*t.cell/2,y0:-(t.rows-1)*t.cell/2,h:decodeGrid(t.h,length,HEIGHT_SCALE),s:decodeGrid(t.s,length,1,Uint8Array)};
}
export function closeGrid(g,rivers=[]){return {cell:g.cell,cols:g.cols,rows:g.rows,h:encodeGrid(g.h,HEIGHT_SCALE),s:encodeGrid(g.s),rivers};}
const sample=(g,x,y)=>{
 const fx=clamp((x-g.x0)/g.cell,0,g.cols-1),fy=clamp((y-g.y0)/g.cell,0,g.rows-1),i=Math.min(g.cols-2,Math.floor(fx)),j=Math.min(g.rows-2,Math.floor(fy)),u=fx-i,v=fy-j,a=j*g.cols+i,c=a+g.cols;
 return (g.h[a]*(1-u)+g.h[a+1]*u)*(1-v)+(g.h[c]*(1-u)+g.h[c+1]*u)*v;
};
// Refaz a grade para um novo tamanho, preservando alturas e superfícies nas mesmas posições.
export function fitTerrain(t,size){
 const target=gridFor(size);if(t.cell===target.cell&&t.cols===target.cols&&t.rows===target.rows)return t;
 const from=openGrid(t),to={...target,x0:-(target.cols-1)*target.cell/2,y0:-(target.rows-1)*target.cell/2,h:new Float32Array(target.cols*target.rows),s:new Uint8Array(target.cols*target.rows)};
 const x1=from.x0+(from.cols-1)*from.cell,y1=from.y0+(from.rows-1)*from.cell;
 for(let j=0;j<to.rows;j++)for(let i=0;i<to.cols;i++){
  const x=to.x0+i*to.cell,y=to.y0+j*to.cell;if(x<from.x0||x>x1||y<from.y0||y>y1)continue;
  to.h[j*to.cols+i]=sample(from,x,y);to.s[j*to.cols+i]=from.s[Math.round((y-from.y0)/from.cell)*from.cols+Math.round((x-from.x0)/from.cell)];
 }
 return closeGrid(to,t.rivers);
}

// --- Pincéis (grade de trabalho) ---
// `strength`: u por aplicação no centro. Devolve true quando algo mudou.
export function applyBrush(g,tool,x,y,{radius=4,strength=.3,target=0,surface=0}={}){
 const r=Math.max(.5,radius),i0=Math.max(0,Math.floor((x-r-g.x0)/g.cell)),i1=Math.min(g.cols-1,Math.ceil((x+r-g.x0)/g.cell)),j0=Math.max(0,Math.floor((y-r-g.y0)/g.cell)),j1=Math.min(g.rows-1,Math.ceil((y+r-g.y0)/g.cell));
 let changed=false;const smooth=tool==='smooth'?Float32Array.from(g.h):null;
 for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
  const d=Math.hypot(g.x0+i*g.cell-x,g.y0+j*g.cell-y);if(d>r)continue;
  const k=j*g.cols+i,t=d/r,soft=(1-t*t)*(1-t*t),before=g.h[k];
  if(tool==='surface'){if(g.s[k]!==surface){g.s[k]=surface;changed=true;}continue;}
  if(tool==='raise')g.h[k]+=strength*soft;
  else if(tool==='lower')g.h[k]-=strength*soft;
  else if(tool==='flatten')g.h[k]+=(target-g.h[k])*Math.min(1,strength*soft*2);
  else if(tool==='plateau')g.h[k]=target; // borda dura: forma penhasco ao redor
  else if(tool==='lake')g.h[k]=Math.min(g.h[k],-target*Math.min(1,(1-t)*3));
  else if(tool==='dry'){if(g.h[k]<0)g.h[k]+=(0-g.h[k])*Math.min(1,strength*soft*3);}
  else if(tool==='smooth'&&i>0&&j>0&&i<g.cols-1&&j<g.rows-1){const m=(smooth[k-1]+smooth[k+1]+smooth[k-g.cols]+smooth[k+g.cols])/4;g.h[k]+=(m-g.h[k])*Math.min(1,strength*soft*3);}
  g.h[k]=clamp(g.h[k],R.minHeight,R.maxHeight);if(g.h[k]!==before)changed=true;
 }
 return changed;
}

// --- Consulta ---
function carve(b,river){
 const half=river.width/2,bank=Math.max(1.5,river.width*.4),reach=half+bank,pts=river.points,n=b.cols*b.rows,dist=new Float32Array(n).fill(Infinity),dirX=new Float32Array(n),dirY=new Float32Array(n);
 for(let s=1;s<pts.length;s++){
  const [ax,ay]=pts[s-1],[cx,cy]=pts[s],dx=cx-ax,dy=cy-ay,len=Math.hypot(dx,dy);if(len<1e-6)continue;
  const i0=Math.max(0,Math.floor((Math.min(ax,cx)-reach-b.x0)/b.cell)),i1=Math.min(b.cols-1,Math.ceil((Math.max(ax,cx)+reach-b.x0)/b.cell)),j0=Math.max(0,Math.floor((Math.min(ay,cy)-reach-b.y0)/b.cell)),j1=Math.min(b.rows-1,Math.ceil((Math.max(ay,cy)+reach-b.y0)/b.cell));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
   const x=b.x0+i*b.cell,y=b.y0+j*b.cell,t=clamp(((x-ax)*dx+(y-ay)*dy)/(len*len),0,1),d=Math.hypot(x-ax-dx*t,y-ay-dy*t),k=j*b.cols+i;
   if(d<dist[k]){dist[k]=d;dirX[k]=dx/len;dirY[k]=dy/len;}
  }
 }
 for(let k=0;k<n;k++){
  const d=dist[k];if(d>reach)continue;
  if(d<=half){const t=d/half;b.h[k]=Math.min(b.h[k],-river.depth*(1-t*t));b.flow[k*2]=dirX[k];b.flow[k*2+1]=dirY[k];}
  else if(b.h[k]>0){const t=(d-half)/bank;b.h[k]*=t*t*(3-2*t);}
 }
}
function gridHeight(b,x,y){
 if(x<b.x0||y<b.y0||x>b.x1||y>b.y1){const out=Math.hypot(Math.max(b.x0-x,0,x-b.x1),Math.max(b.y0-y,0,y-b.y1));if(out>=R.fade)return 0;return sample(b,x,y)*(1-out/R.fade);}
 return sample(b,x,y);
}
export function heightAt(arena,x,y){const b=arena?.terrain;return b?gridHeight(b,x,y):0;}
// Posição no referencial da ponte, que pode estar girada: x ao longo da largura, y ao longo da profundidade.
const bridgeLocal=(p,x,y)=>{const dx=x-p.x,dy=y-p.y;if(!p.angle)return {x:dx,y:dy};const c=Math.cos(p.angle),s=Math.sin(p.angle);return {x:dx*c-dy*s,y:dx*s+dy*c};};
const onBridge=(b,x,y)=>b.bridges.find(p=>{const l=bridgeLocal(p,x,y);return Math.abs(l.x)<=p.w/2&&Math.abs(l.y)<=p.d/2;})||null;
// Altura de quem pisa no ponto: o tabuleiro da ponte, em arco, vence a água e o barranco.
export function groundAt(arena,x,y){
 const b=arena?.terrain;if(!b)return 0;const h=gridHeight(b,x,y);if(!b.bridges.length)return h;
 const p=onBridge(b,x,y);if(!p)return h;
 const l=bridgeLocal(p,x,y),along=p.w>=p.d,u=clamp((along?l.x+p.w/2:l.y+p.d/2)/(along?p.w:p.d),0,1),arc=p.flat?p.deck:p.deck*(1-Math.abs(2*u-1)**3);
 return Math.max(h,arc);
}
function steepAt(b,x,y){const e=b.cell*.5,gx=(sample(b,x+e,y)-sample(b,x-e,y))/(2*e),gy=(sample(b,x,y+e)-sample(b,x,y-e))/(2*e);return Math.hypot(gx,gy);}
// Colisores de água funda e penhascos, unidos em retângulos. `terrain.mjs` deixa tiros e linhas de visão passarem por eles.
function buildBlocks(b,bounds){
 const step=Math.max(1,b.cell/2),boxes=[];let open=new Map();
 for(let y=bounds.minY+step/2;y<bounds.maxY;y+=step){
  const next=new Map();let x=bounds.minX+step/2;
  while(x<bounds.maxX){
   const blocked=c=>(sample(b,c,y)<R.deep||steepAt(b,c,y)>R.cliff)&&!onBridge(b,c,y);
   if(!blocked(x)){x+=step;continue;}
   const from=x;while(x<bounds.maxX&&blocked(x))x+=step;
   const key=from+':'+x,prev=open.get(key),box=prev||{x0:from-step/2,x1:x-step/2,y0:y-step/2,y1:y+step/2};box.y1=y+step/2;if(!prev)boxes.push(box);next.set(key,box);
  }
  open=next;
 }
 return boxes.map(r=>({kind:'box',x:(r.x0+r.x1)/2,y:(r.y0+r.y1)/2,width:r.x1-r.x0,depth:r.y1-r.y0,height:.01,look:'terrain-block',terrainBlock:true}));
}
// Grade com os rios já escavados, sem colisores: usada pelo jogo e pelo desenho do editor. `g` pode ser a grade em edição.
export function carvedGrid(g,rivers=[]){
 const n=g.cols*g.rows,b={...g,h:Float32Array.from(g.h),x1:g.x0+(g.cols-1)*g.cell,y1:g.y0+(g.rows-1)*g.cell,flow:new Float32Array(n*2),hasWater:false,dry:g.h,rivers};
 for(const river of rivers)carve(b,river);
 for(let k=0;k<n;k++)if(b.h[k]<R.wet){b.hasWater=true;break;}
 return b;
}
// Água em resolução fina, só para o desenho: em mapas grandes a grade de 2 u deixaria a margem dos rios serrilhada.
export function fineWater(b,cell=1){
 if(b.cell<=cell)return b;
 const cols=Math.floor((b.x1-b.x0)/cell)+1,rows=Math.floor((b.y1-b.y0)/cell)+1,dry={cols:b.cols,rows:b.rows,cell:b.cell,x0:b.x0,y0:b.y0,h:b.dry},f={cell,cols,rows,x0:b.x0,y0:b.y0,x1:b.x1,y1:b.y1,h:new Float32Array(cols*rows),flow:new Float32Array(cols*rows*2)};
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)f.h[j*cols+i]=sample(dry,f.x0+i*cell,f.y0+j*cell);
 for(const river of b.rivers)carve(f,river);
 // O trecho aplainado (vila fixa) também fica seco no desenho da água.
 if(b.flattened)flattenGrid(f,b.flattened.rect,b.flattened.margin);
 return f;
}
// `bridges`: [{x,y,w,d}] (retângulos caminháveis). `bounds`: limites do mapa.
export function bakeTerrain(t,bounds,bridges=[]){
 const b=carvedGrid(openGrid(t),t.rivers);b.bridges=bridges.map(p=>({deck:R.deck,...p}));b.blocks=buildBlocks(b,bounds);return b;
}
export const isBlockedCell=(b,x,y)=>sample(b,x,y)<R.deep||steepAt(b,x,y)>R.cliff;
// Aplaina um retângulo (vila fixa da campanha) sem mexer no resto da grade.
function flattenGrid(g,rect,margin){
 for(let j=0;j<g.rows;j++)for(let i=0;i<g.cols;i++){
  const x=g.x0+i*g.cell,y=g.y0+j*g.cell,d=Math.hypot(Math.max(rect.minX-x,0,x-rect.maxX),Math.max(rect.minY-y,0,y-rect.maxY));
  if(d<margin){const t=d/margin;g.h[j*g.cols+i]*=t*t*(3-2*t);}
 }
}
export function flattenBake(b,rect,margin=6){
 const flat={...b,h:Float32Array.from(b.h),flattened:{rect,margin}};flattenGrid(flat,rect,margin);return flat;
}

// --- Efeitos no jogo ---
// Multiplicador de deslocamento para quem anda em (x,y) na direção (dx,dy): água, correnteza, ladeira e superfície.
export function terrainSpeed(arena,x,y,dx=0,dy=0){
 const b=arena?.terrain;if(!b)return 1;
 const len=Math.hypot(dx,dy);let k=1;
 if(onBridge(b,x,y))return 1;
 const h=sample(b,x,y);
 if(h<R.wet){
  k*=R.water;
  if(len){const fi=Math.round((clamp(y,b.y0,b.y1)-b.y0)/b.cell)*b.cols+Math.round((clamp(x,b.x0,b.x1)-b.x0)/b.cell),fx=b.flow[fi*2],fy=b.flow[fi*2+1];if(fx||fy)k*=1+R.current*(dx*fx+dy*fy)/len;}
 }else if(len){
  const e=b.cell*.5,grade=((sample(b,x+dx/len*e,y+dy/len*e)-sample(b,x-dx/len*e,y-dy/len*e))/(2*e));
  k*=grade>0?1-Math.min(R.climb,grade*R.climb):1+Math.min(R.descend,-grade*R.descend);
 }
 const s=b.s[Math.round((clamp(y,b.y0,b.y1)-b.y0)/b.cell)*b.cols+Math.round((clamp(x,b.x0,b.x1)-b.x0)/b.cell)];
 return s&&h>=R.wet?k*(SURFACES[s]?.speed??1):k;
}
// Quem bate de cima bate mais forte: a diferença precisa ser visível (uma encosta, não um desnível qualquer).
export function highGround(arena,source,target){
 if(!arena?.terrain||!source||!target)return 1;
 return groundAt(arena,source.x,source.y)-groundAt(arena,target.x,target.y)>=R.highGround?R.highGroundBonus:1;
}
// Texto curto do que o chão faz com o personagem; vazio quando não faz nada.
export function terrainStatus(arena,p){
 const b=arena?.terrain;if(!b||!p)return '';
 if(onBridge(b,p.x,p.y))return '';
 const h=sample(b,p.x,p.y);
 if(h<R.wet){const fi=Math.round((clamp(p.y,b.y0,b.y1)-b.y0)/b.cell)*b.cols+Math.round((clamp(p.x,b.x0,b.x1)-b.x0)/b.cell);return b.flow[fi*2]||b.flow[fi*2+1]?'Correnteza · −40% de velocidade, mais a favor e menos contra':'Água rasa · −40% de velocidade';}
 const s=SURFACES[b.s[Math.round((clamp(p.y,b.y0,b.y1)-b.y0)/b.cell)*b.cols+Math.round((clamp(p.x,b.x0,b.x1)-b.x0)/b.cell)]];
 const parts=[];if(h>=R.highGround)parts.push('Terreno alto · +20% de dano em quem está abaixo');if(s&&s.speed!==1)parts.push(s.label+' · −'+Math.round((1-s.speed)*100)+'% de velocidade');
 return parts.join('  ·  ');
}
