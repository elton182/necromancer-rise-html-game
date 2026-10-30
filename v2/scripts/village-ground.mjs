// Chão pintado da Vila de Eldrin: grama, terra batida, calçamento e praça numa única textura gerada ao carregar a cena.
// Substitui os planos de rua e as pedras soltas. Só desenho: o chão continua todo caminhável e a mira usa um plano matemático.
import * as THREE from 'three';

const MARGIN=12,SIZE=2048;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const GRASS=['#4f6a38','#45602f','#58743c','#3e5a2d','#62793f','#4a6534','#536d33','#3b532b'];
const STONE=['#8d8576','#7f786b','#968e7f','#746e63','#878074','#9c9484'];

export function villageGround(arena){
 const random=rng(0xE1D41),b=arena.bounds,span=Math.max(b.maxX-b.minX,b.maxY-b.minY)+MARGIN*2;
 const cx=(b.minX+b.maxX)/2,cz=(b.minY+b.maxY)/2,x0=cx-span/2,z0=cz-span/2,k=SIZE/span;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;const g=canvas.getContext('2d');
 // Coordenadas: coluna = x do mundo, linha = y do jogo (z do Three.js), k pixels por unidade.
 const X=x=>(x-x0)*k,Z=z=>(z-z0)*k,U=u=>u*k,between=(a,c)=>a+(c-a)*random(),pick=list=>list[Math.floor(random()*list.length)];
 const blob=(x,z,r,color,alpha)=>{const gr=g.createRadialGradient(X(x),Z(z),0,X(x),Z(z),U(r));gr.addColorStop(0,color);gr.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=alpha;g.fillStyle=gr;g.fillRect(X(x)-U(r),Z(z)-U(r),U(r)*2,U(r)*2);g.globalAlpha=1;};
 // Contorno irregular ao redor de um retângulo ou círculo (borda orgânica para terra e calçamento).
 function ragged(shape,expand,amp){
  const phase=[random()*9,random()*9,random()*9],noise=t=>Math.sin(t*1.7+phase[0])*.5+Math.sin(t*4.3+phase[1])*.3+Math.sin(t*9.1+phase[2])*.2,pts=[];
  if(shape.r){const n=Math.ceil(shape.r*2*Math.PI/.2);for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=shape.r+expand+noise(a*shape.r)*amp;pts.push([shape.x+Math.cos(a)*r,shape.y+Math.sin(a)*r]);}}
  else{const {x0:a,x1:c,y0:d,y1:e}=shape,edges=[[a,d,c,d,0,-1],[c,d,c,e,1,0],[c,e,a,e,0,1],[a,e,a,d,-1,0]];let t=0;
   for(const [ax,az,bx,bz,nx,nz]of edges){const len=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(len/.2));for(let i=0;i<n;i++,t+=.2){const f=i/n,o=expand+noise(t)*amp;pts.push([ax+(bx-ax)*f+nx*o,az+(bz-az)*f+nz*o]);}}}
  g.beginPath();pts.forEach(([x,z],i)=>i?g.lineTo(X(x),Z(z)):g.moveTo(X(x),Z(z)));g.closePath();
 }
 function speckle(shape,count,colors,size){
  for(let i=0;i<count;i++){let x,z;if(shape.r){const a=random()*Math.PI*2,d=Math.sqrt(random())*shape.r;x=shape.x+Math.cos(a)*d;z=shape.y+Math.sin(a)*d;}else{x=between(shape.x0,shape.x1);z=between(shape.y0,shape.y1);}
   g.fillStyle=pick(colors);const s=between(size[0],size[1]);g.fillRect(X(x),Z(z),s,s);}
 }
 // Folhas de grama em lotes por cor: poucas chamadas de desenho para dezenas de milhares de traços.
 function blades(count,area,len=[2,5]){
  const buckets=GRASS.map(()=>[]);
  for(let i=0;i<count;i++){const [x,z]=area();buckets[Math.floor(random()*buckets.length)].push(X(x),Z(z));}
  g.lineWidth=1.1;g.lineCap='round';
  buckets.forEach((list,c)=>{g.strokeStyle=GRASS[c];g.beginPath();for(let i=0;i<list.length;i+=2){const px=list[i],pz=list[i+1];g.moveTo(px,pz);g.lineTo(px+between(-1.6,1.6),pz-between(len[0],len[1]));}g.stroke();});
 }
 function stone(x,z,w,d,angle,color){
  const r=Math.min(w,d)*.28;g.save();g.translate(X(x),Z(z));g.rotate(angle);
  const shape=(ox,oz,s)=>{g.beginPath();g.roundRect(U(-w/2*s)+ox,U(-d/2*s)+oz,U(w*s),U(d*s),U(r*s));};
  shape(U(.03),U(.04),1);g.fillStyle='rgba(20,17,12,.45)';g.fill();             // sombra para baixo e à direita
  shape(0,0,1);g.fillStyle=color;g.fill();
  shape(U(-.02),U(-.025),.72);g.fillStyle='rgba(255,250,232,.13)';g.fill();     // luz no topo da pedra
  g.restore();
 }
 const shade=(hex,amount)=>{const n=parseInt(hex.slice(1),16),f=c=>Math.max(0,Math.min(255,Math.round(c*(1+amount))));return `rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`;};
 const stoneColor=()=>shade(pick(STONE),between(-.12,.08));

 // 1. Grama: base, manchas grandes de cor e manchas de musgo/palha do mapa.
 g.fillStyle='#4b6536';g.fillRect(0,0,SIZE,SIZE);
 for(let i=0;i<520;i++)blob(between(x0,x0+span),between(z0,z0+span),between(1,5),pick(['#647f40','#3a5229','#6f8446','#43602e','#7a7c45']),between(.18,.35));
 for(const p of arena.decor.patches||[])blob(p.x,p.y,p.r*1.3,p.tone>.5?'#7f7c46':'#36502a',.45);
 blades(110000,()=>[between(x0,x0+span),between(z0,z0+span)]);

 // 2. Terra batida no pé das construções (onde se pisa e a chuva respinga) e franjas das ruas de pedra.
 const solids=arena.solids,houses=solids.filter(s=>s.kind==='box'&&(s.look==='house'||s.look==='stall'));
 g.fillStyle='#655540';
 for(const h of houses){ragged({x0:h.x-h.width/2,x1:h.x+h.width/2,y0:h.y-h.depth/2,y1:h.y+h.depth/2},.55,.22);g.globalAlpha=.85;g.fill();g.globalAlpha=1;}
 const roads=arena.roads||[],plaza=arena.plaza;
 for(const r of roads.filter(r=>r.kind==='cobble')){ragged(r,.5,.22);g.fillStyle='#6a5a43';g.fill();}
 if(plaza){ragged(plaza,.6,.25);g.fillStyle='#6a5a43';g.fill();}

 // 3. Ruas de terra: borda irregular, grãos, sulcos de carroça e grama no meio.
 for(const r of roads.filter(r=>r.kind==='dirt')){
  ragged(r,.18,.2);g.fillStyle='#735e40';g.fill();
  speckle(r,Math.round((r.x1-r.x0)*(r.y1-r.y0)*60),['#5e4c34','#86704d','#6a563a','#8f7a58'],[1,2.4]);
  const along=r.x1-r.x0>r.y1-r.y0,mid=along?(r.y0+r.y1)/2:(r.x0+r.x1)/2,a=along?r.x0:r.y0,c=along?r.x1:r.y1;
  g.strokeStyle='rgba(58,44,28,.42)';g.lineWidth=U(.2);
  for(const off of [-.42,.42]){g.beginPath();for(let t=a;t<=c;t+=.5){const w=mid+off+Math.sin(t*.7+off)*.06;along?g.lineTo(X(t),Z(w)):g.lineTo(X(w),Z(t));}g.stroke();}
  blades(Math.round((c-a)*30),()=>{const t=between(a,c),w=mid+between(-.2,.2);return along?[t,w]:[w,t];},[1.5,3.5]);
 }

 // 4. Ruas de pedra: rejunte, fiadas desencontradas ao longo do eixo maior.
 const inPlaza=(x,z)=>plaza&&Math.hypot(x-plaza.x,z-plaza.y)<plaza.r-.1;
 for(const r of roads.filter(r=>r.kind==='cobble')){
  g.fillStyle='#48433b';g.fillRect(X(r.x0),Z(r.y0),U(r.x1-r.x0),U(r.y1-r.y0));
  const along=r.x1-r.x0>=r.y1-r.y0,[a,c]=along?[r.x0,r.x1]:[r.y0,r.y1],[d,e]=along?[r.y0,r.y1]:[r.x0,r.x1],row=.36;
  for(let w=d,ri=0;w<e-.05;w+=row,ri++){
   for(let t=a-(ri%2)*.2;t<c;){const len=between(.3,.5),s0=Math.max(a,t),s1=Math.min(c,t+len),wm=Math.min(e,w+row);t+=len;if(s1-s0<.12)continue;
    const mx=(s0+s1)/2,mw=(w+wm)/2,[x,z]=along?[mx,mw]:[mw,mx];if(inPlaza(x,z))continue;
    stone(x,z,along?s1-s0-.05:wm-w-.05,along?wm-w-.05:s1-s0-.05,between(-.06,.06),stoneColor());}
  }
 }
 // 5. Praça: anéis concêntricos de pedras ao redor do poço e meio-fio claro na borda.
 if(plaza){
  g.beginPath();g.arc(X(plaza.x),Z(plaza.y),U(plaza.r),0,Math.PI*2);g.fillStyle='#48433b';g.fill();
  for(let r=.9;r<plaza.r-.2;r+=.36){const n=Math.floor(2*Math.PI*r/.4),o=random()*Math.PI;
   for(let i=0;i<n;i++){const ang=o+i/n*Math.PI*2,x=plaza.x+Math.cos(ang)*r,z=plaza.y+Math.sin(ang)*r;stone(x,z,2*Math.PI*r/n-.05,.31,ang+Math.PI/2,stoneColor());}}
  const n=Math.floor(2*Math.PI*plaza.r/.62);
  for(let i=0;i<n;i++){const ang=i/n*Math.PI*2,x=plaza.x+Math.cos(ang)*plaza.r,z=plaza.y+Math.sin(ang)*plaza.r;stone(x,z,2*Math.PI*plaza.r/n-.06,.42,ang+Math.PI/2,shade('#a59d8d',between(-.08,.06)));}
 }
 // 6. Grama invadindo as bordas das ruas (quebra as linhas retas).
 for(const r of roads){const edge=()=>{const side=Math.floor(random()*4),[x,z]=side<2?[between(r.x0,r.x1),side?r.y1:r.y0]:[side===2?r.x0:r.x1,between(r.y0,r.y1)];return [x+between(-.35,.35),z+between(-.35,.35)];};
  blades(Math.round(((r.x1-r.x0)+(r.y1-r.y0))*45),edge,[2,4.5]);}

 // 7. Sombra de contato sob construções, árvores e mobiliário: assenta os objetos no chão.
 g.filter=`blur(${Math.round(U(.3))}px)`;g.fillStyle='rgba(16,13,9,.5)';
 for(const s of solids){
  if(s.kind==='box'){const e=s.look==='house'?.22:.12;g.fillRect(X(s.x-s.width/2-e),Z(s.y-s.depth/2-e),U(s.width+2*e),U(s.depth+2*e));}
  else{g.beginPath();g.arc(X(s.x),Z(s.y),U(s.r*(s.look==='oak'||s.look==='pine'?1.8:1.35)),0,Math.PI*2);g.fill();}
 }
 g.filter='none';

 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(span,span).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:texture,roughness:.95}));
 mesh.position.set(cx,.004,cz);mesh.receiveShadow=true;mesh.renderOrder=-3;
 // O renderizador esconde o chão liso quando a cena traz o próprio e clareia este no modo de fundo claro.
 mesh.userData.replacesGround=true;mesh.userData.lightColor=new THREE.Color(1.3,1.3,1.25);
 const dispose=mesh.material.dispose.bind(mesh.material);mesh.material.dispose=()=>{texture.dispose();dispose();};
 return mesh;
}
