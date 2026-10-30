import * as THREE from 'three';
// Efeitos de combate desenhados a partir de `w.effects` (campo `fx`) e do estado do mundo.
// Somente leitura: nada aqui altera dano, colisão ou recarga. Coordenadas lógicas (x, y) viram (x, z) no mundo 3D.
const TAU=Math.PI*2,rand=(a,b)=>a+Math.random()*(b-a),clamp01=v=>Math.max(0,Math.min(1,v)),lerp=(a,b,t)=>a+(b-a)*t,easeOut=t=>1-(1-t)*(1-t)*(1-t);
const hex=h=>{const n=parseInt(String(h).replace('#',''),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];};
const mix=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const WHITE=[1,1,1],life=e=>e.progress!==undefined?e.progress:clamp01(e.time/(e.duration||1));
const rng=seed=>{let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};

// ---------- Texturas procedurais (brancas com alfa; a cor vem do material) ----------
const makeCanvas=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const texture=c=>{const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
function radial(stops,size=256){const c=makeCanvas(size),g=c.getContext('2d'),r=size/2,gr=g.createRadialGradient(r,r,0,r,r,r);for(const [o,a]of stops)gr.addColorStop(o,`rgba(255,255,255,${a})`);g.fillStyle=gr;g.fillRect(0,0,size,size);return texture(c);}
// Círculo ritual: anéis, faixa de runas (hastes com ramos, no estilo rúnico), estrela e contorno escuro para ler em chão claro.
function runeRing(seed,{glyphs=12,inner=.5,star=5,ticks=48,band=[.7,.88]}={}){
 const S=512,c=makeCanvas(S),g=c.getContext('2d'),R=S/2-8,rnd=rng(seed);g.translate(S/2,S/2);g.lineCap='round';g.lineJoin='round';
 const draw=(w,path)=>{for(const [lw,col]of [[w+8,'rgba(0,0,0,.6)'],[w,'#fff']]){g.lineWidth=lw;g.strokeStyle=col;g.beginPath();path();g.stroke();}};
 const fill=g.createRadialGradient(0,0,0,0,0,R);fill.addColorStop(0,'rgba(255,255,255,0)');fill.addColorStop(.6,'rgba(255,255,255,.1)');fill.addColorStop(1,'rgba(255,255,255,.22)');g.fillStyle=fill;g.beginPath();g.arc(0,0,R,0,TAU);g.fill();
 draw(9,()=>g.arc(0,0,R,0,TAU));draw(5,()=>g.arc(0,0,R*.93,0,TAU));draw(6,()=>g.arc(0,0,R*(band[0]-.03),0,TAU));
 draw(4,()=>{for(let i=0;i<ticks;i++){const a=i/ticks*TAU,r0=R*.93,r1=R*(i%2?.965:.985);g.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);g.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);}});
 const h=R*.075;
 for(let i=0;i<glyphs;i++){
  const segs=[[0,-h,0,h]],n=1+Math.floor(rnd()*3);
  for(let k=0;k<n;k++){const y=(rnd()*1.2-.6)*h,dir=rnd()<.5?-1:1,len=h*(.6+rnd()*.6),up=rnd()<.5?-1:1;segs.push([0,y,dir*len*.7,y+up*len*.7]);}
  if(rnd()<.3)segs.push([-h*.5,-h*.35,h*.5,-h*.35]);
  g.save();g.rotate(i/glyphs*TAU);g.translate(0,-R*(band[0]+band[1])/2);
  draw(7,()=>{for(const s of segs){g.moveTo(s[0],s[1]);g.lineTo(s[2],s[3]);}});g.restore();
 }
 if(star){
  const r=R*inner,pts=Array.from({length:star},(_,i)=>[Math.sin(i/star*TAU)*r,-Math.cos(i/star*TAU)*r]);
  draw(5,()=>g.arc(0,0,r,0,TAU));draw(4,()=>g.arc(0,0,r*.32,0,TAU));
  draw(6,()=>{
   if(star%2){g.moveTo(pts[0][0],pts[0][1]);for(let k=1;k<=star;k++){const p=pts[(k*2)%star];g.lineTo(p[0],p[1]);}}
   else for(const s of [0,1]){g.moveTo(pts[s][0],pts[s][1]);for(let k=1;k<=star/2;k++){const p=pts[(s+k*2)%star];g.lineTo(p[0],p[1]);}}
  });
 }
 return texture(c);
}
function edgeTexture(){const S=512,c=makeCanvas(S),g=c.getContext('2d');g.translate(S/2,S/2);for(const [w,col]of [[28,'rgba(0,0,0,.55)'],[15,'#fff']]){g.lineWidth=w;g.strokeStyle=col;g.beginPath();g.arc(0,0,S/2-12,0,TAU);g.stroke();}return texture(c);}
function columnTexture(){const c=makeCanvas(4,128),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.65,'rgba(255,255,255,.3)');gr.addColorStop(1,'rgba(255,255,255,.9)');g.fillStyle=gr;g.fillRect(0,0,4,128);return texture(c);}
// Mancha de queimado: borda irregular escura (lê bem em chão claro). Rachaduras: linhas ramificadas que recebem a cor do fogo.
function scorchTexture(){
 const S=512,c=makeCanvas(S),g=c.getContext('2d'),rnd=rng(77),N=56;g.translate(S/2,S/2);
 let k=Array.from({length:N},()=>.74+rnd()*.26);k=k.map((v,i)=>(v+k[(i+1)%N]+k[(i+N-1)%N])/3);
 g.filter='blur(5px)';g.beginPath();for(let i=0;i<=N;i++){const a=i/N*TAU,r=S/2*.9*k[i%N];i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();
 const gr=g.createRadialGradient(0,0,0,0,0,S/2);gr.addColorStop(0,'rgba(14,8,5,.92)');gr.addColorStop(.7,'rgba(18,11,7,.8)');gr.addColorStop(1,'rgba(18,11,7,.35)');g.fillStyle=gr;g.fill();
 return texture(c);
}
function cracksTexture(){
 const S=512,c=makeCanvas(S),g=c.getContext('2d'),rnd=rng(91);g.translate(S/2,S/2);g.lineCap='round';
 const branch=(x,y,a,len,w,depth)=>{
  const steps=Math.max(3,Math.round(len/14));let px=x,py=y;
  for(let i=0;i<steps;i++){a+=(rnd()-.5)*.7;const nx=px+Math.cos(a)*len/steps,ny=py+Math.sin(a)*len/steps;g.lineWidth=Math.max(1.2,w*(1-i/steps*.6));g.beginPath();g.moveTo(px,py);g.lineTo(nx,ny);g.stroke();px=nx;py=ny;if(depth>0&&rnd()<.3)branch(px,py,a+(rnd()<.5?-1:1)*(.5+rnd()*.6),len*.5,w*.6,depth-1);}
 };
 g.strokeStyle='#fff';g.shadowColor='#fff';g.shadowBlur=14;
 for(let i=0;i<9;i++)branch(rnd()*20-10,rnd()*20-10,i/9*TAU+rnd()*.5,S/2*(.5+rnd()*.35),6,2);
 return texture(c);
}
function makeTextures(){return {scorch:scorchTexture(),cracks:cracksTexture(),
 runeA:runeRing(11,{glyphs:14,star:5}),runeB:runeRing(23,{glyphs:9,star:6,inner:.46,ticks:24,band:[.64,.86]}),runeD:runeRing(37,{glyphs:18,star:0,ticks:60}),
 edge:edgeTexture(),column:columnTexture(),
 shock:radial([[0,0],[.5,0],[.8,.25],[.93,.85],[.97,1],[.99,.8],[1,0]]),disc:radial([[0,.1],[.7,.28],[.93,.42],[1,0]]),heat:radial([[0,.3],[.5,.4],[.9,.65],[1,0]]),
 glow:radial([[0,1],[.25,.6],[.6,.15],[1,0]]),arc:radial([[0,0],[.45,0],[.7,.25],[.93,1],[.985,.8],[1,0]]),
};}

// ---------- Partículas: um único Points, tamanho em unidades de mundo ----------
const VERT=`attribute float aSize;attribute float aAlpha;attribute float aShape;attribute vec3 aColor;varying vec3 vColor;varying float vAlpha;varying float vShape;uniform float uScale;
void main(){vColor=aColor;vAlpha=aAlpha;vShape=aShape;gl_PointSize=max(1.,aSize*uScale);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
// Forma 0: ponto macio; forma 1: língua de fogo (larga na base, afinando para o topo).
// Forma 0: ponto macio; forma >= 1: língua de fogo procedural (ruído fbm animado, rampa de cor do vermelho ao branco quente).
const FRAG=`varying vec3 vColor;varying float vAlpha;varying float vShape;uniform float uTime;
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){return vn(p)*.55+vn(p*2.1)*.3+vn(p*4.3)*.15;}
void main(){
 vec2 uv=gl_PointCoord;
 if(vShape>.5){
  float ph=vShape-1.;vec2 q=vec2((uv.x-.5)*2.,1.-uv.y);float t=uTime*2.4+ph*20.;
  float n=fbm(vec2(q.x*2.+ph*7.,q.y*2.6-t));
  float sway=(fbm(vec2(q.y*1.6+ph*3.,t*.3))-.5)*1.5*q.y*q.y;
  float base=sqrt(max(0.,1.-pow((.22-min(q.y,.22))/.22,2.)));
  float taper=pow(max(0.,1.-max(q.y-.22,0.)/.78),1.25);
  float width=.7*base*taper*(.45+1.1*n);
  float dx=abs(q.x-sway)/max(width,.02);
  float body=smoothstep(1.,.38,dx)*smoothstep(1.,.3,q.y+(n-.5)*.95);
  if(body<.02)discard;
  float heat=body*(.45+.95*n)*(1.-q.y*.45);
  vec3 c=mix(vec3(.4,.02,.01),vec3(1.,.3,.04),smoothstep(.04,.38,heat));
  c=mix(c,vec3(1.,.66,.14),smoothstep(.42,.9,heat));
  c=mix(c,vec3(1.,.94,.72),smoothstep(.95,1.35,heat));
  gl_FragColor=vec4(mix(c,vColor,.1),smoothstep(.03,.28,heat)*vAlpha);
 }else{float d=length(uv-vec2(.5))*2.;if(d>1.)discard;float a=smoothstep(1.,.05,d);gl_FragColor=vec4(mix(vColor,vec3(1.),smoothstep(.6,0.,d)*.6),a*vAlpha);}
}`;
class Particles{
 constructor(scene,max,additive=false){
  const f=k=>new Float32Array(max*k);Object.assign(this,{max,n:0,p:f(3),v:f(3),col:f(3),size:f(1),alpha:f(1),shape:f(1),age:f(1),life:f(1),s0:f(1),s1:f(1),a0:f(1),c0:f(3),c1:f(3),grav:f(1),drag:f(1)});
  const g=new THREE.BufferGeometry();this.attrs={position:new THREE.BufferAttribute(this.p,3),aColor:new THREE.BufferAttribute(this.col,3),aSize:new THREE.BufferAttribute(this.size,1),aAlpha:new THREE.BufferAttribute(this.alpha,1),aShape:new THREE.BufferAttribute(this.shape,1)};
  for(const [k,a]of Object.entries(this.attrs)){a.setUsage(THREE.DynamicDrawUsage);g.setAttribute(k,a);}g.setDrawRange(0,0);
  this.material=new THREE.ShaderMaterial({uniforms:{uScale:{value:40},uTime:{value:0}},vertexShader:VERT,fragmentShader:FRAG,transparent:true,depthWrite:false,depthTest:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending});
  this.points=new THREE.Points(g,this.material);this.points.frustumCulled=false;this.points.renderOrder=additive?13:12;scene.add(this.points);
 }
 emit({x,h=0,z,vx=0,vh=0,vz=0,life=.5,s0=.2,s1=.02,c0=WHITE,c1=WHITE,a0=1,grav=0,drag=0,shape=0}){
  if(this.n>=this.max)return;const i=this.n++,i3=i*3;
  this.p[i3]=x;this.p[i3+1]=h;this.p[i3+2]=z;this.v[i3]=vx;this.v[i3+1]=vh;this.v[i3+2]=vz;
  this.life[i]=life;this.age[i]=0;this.shape[i]=shape;this.s0[i]=s0;this.s1[i]=s1;this.a0[i]=a0;this.grav[i]=grav;this.drag[i]=drag;
  for(let k=0;k<3;k++){this.c0[i3+k]=c0[k];this.c1[i3+k]=c1[k];}
 }
 move(from,to){
  const f=from*3,t=to*3;for(const a of [this.p,this.v,this.c0,this.c1])for(let k=0;k<3;k++)a[t+k]=a[f+k];
  for(const a of [this.life,this.age,this.shape,this.s0,this.s1,this.a0,this.grav,this.drag])a[to]=a[from];
 }
 update(dt){
  for(let i=0;i<this.n;){
   this.age[i]+=dt;if(this.age[i]>=this.life[i]){this.move(--this.n,i);continue;}
   const i3=i*3,t=this.age[i]/this.life[i],k=Math.exp(-this.drag[i]*dt);
   this.v[i3]*=k;this.v[i3+2]*=k;this.v[i3+1]=this.v[i3+1]*k-this.grav[i]*dt;
   this.p[i3]+=this.v[i3]*dt;this.p[i3+1]=Math.max(.03,this.p[i3+1]+this.v[i3+1]*dt);this.p[i3+2]+=this.v[i3+2]*dt;
   for(let c=0;c<3;c++)this.col[i3+c]=lerp(this.c0[i3+c],this.c1[i3+c],t);
   this.size[i]=lerp(this.s0[i],this.s1[i],t);this.alpha[i]=this.a0[i]*Math.pow(1-t,1.2);i++;
  }
  for(const a of Object.values(this.attrs))a.needsUpdate=true;this.points.geometry.setDrawRange(0,this.n);
 }
 dispose(scene){scene.remove(this.points);this.points.geometry.dispose();this.material.dispose();}
}

export function createVfx(scene,{pixelsPerUnit=()=>40}={}){
 const textures=makeTextures(),main=new Particles(scene,1400),fire=new Particles(scene,1400,true),entries=new Map();
 // Partículas com `shape` (chamas) vão para a camada aditiva; as demais, para a normal.
 const particles={emit:o=>(o.shape?fire:main).emit(o),update:dt=>{main.update(dt);fire.update(dt);},count:()=>main.n+fire.n,reset(){for(const l of [main,fire]){l.n=0;l.points.geometry.setDrawRange(0,0);}},uniforms(scale,time){for(const l of [main,fire]){l.material.uniforms.uScale.value=scale;l.material.uniforms.uTime.value=time;}},dispose(){main.dispose(scene);fire.dispose(scene);}};
 const plane=new THREE.PlaneGeometry(2,2),column=new THREE.CylinderGeometry(1,1,1,28,1,true);column.translate(0,.5,0);
 let density=1,time=0,shake=0,lastTime=0,failed=false;const aura={mesh:null,acc:0};
 const material=(map,color,opacity=1)=>new THREE.MeshBasicMaterial({map,color:new THREE.Color(color),transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,fog:false});
 // Marca no chão (textura quadrada de lado 2, escalada pelo raio).
 function decal(o,map,color,{y=.06,opacity=1}={}){const m=new THREE.Mesh(plane,material(map,color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;m.renderOrder=4;scene.add(m);o.objs.push(m);return m;}
 function pillar(o,color){const m=new THREE.Mesh(column,material(textures.column,color,0));m.renderOrder=6;scene.add(m);o.objs.push(m);return m;}
 function release(o){for(const m of o.objs){scene.remove(m);m.material.dispose();if(m.userData.ownGeometry)m.geometry.dispose();}o.objs.length=0;}
 const shockRing=(o,e)=>{const r=decal(o,textures.shock,e.color||'#d8c9a0',{y:.07,opacity:.9});r.position.set(e.x,.07,e.y);return r;};
 const flame=(x,z,{up=2,spread=.5,life=.8,size=.5}={})=>{const s=rand(size*1.3,size*2)*(Math.random()<.45?.55:1);particles.emit({x,h:.05+s*.42,z,vx:rand(-spread,spread),vh:rand(up*.4,up),vz:rand(-spread,spread),life:rand(life*.7,life),s0:s,s1:s*.5,c0:[1,.74,.25],c1:[.78,.1,.03],a0:1,grav:-1.2,drag:.9,shape:1+Math.random()});};
 const ember=(x,z,{up=2.4,size=.12}={})=>particles.emit({x,h:rand(.1,.5),z,vx:rand(-.5,.5),vh:rand(up*.5,up),vz:rand(-.5,.5),life:rand(.9,1.8),s0:rand(size*.7,size*1.3),s1:.02,c0:[1,.85,.35],c1:[1,.3,.05],a0:1,grav:-.8,drag:.5});
 const smoke=(x,z,{size=.7}={})=>particles.emit({x,h:rand(.5,1.3),z,vx:rand(-.3,.3),vh:rand(.7,1.4),vz:rand(-.3,.3),life:rand(1.2,2),s0:size*.7,s1:size*2.2,c0:[.2,.17,.15],c1:[.34,.31,.29],a0:.28,grav:-.2,drag:.5});

 const INIT={},RUN={};
 INIT.siegeBolt=(o,e)=>{const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(e.x,2,e.y),new THREE.Vector3(e.tx,.8,e.ty)]),m=new THREE.Line(g,new THREE.LineBasicMaterial({color:e.color,transparent:true,opacity:1}));m.userData.ownGeometry=true;scene.add(m);o.objs.push(m);};
 RUN.siegeBolt=(o,e)=>{o.objs[0].material.opacity=1-life(e);};
 INIT.siegePulse=(o,e)=>{o.ring=shockRing(o,e);};
 RUN.siegePulse=(o,e)=>{const t=life(e);o.ring.scale.setScalar(e.radius*(.75+.25*t));o.ring.material.opacity=(1-t)*.65;};
 // Faíscas e clarão no corpo atingido.
 INIT.impact=(o,e)=>{
  const s=e.size||1,c=hex(e.color||'#ffd9a0'),h=e.h??.9,n=Math.round(10*s*density),dir=e.dx!==undefined?Math.atan2(e.dy,e.dx):null;
  for(let i=0;i<n;i++){const a=dir===null||Math.random()<.35?rand(0,TAU):dir+rand(-.9,.9),sp=rand(2.5,6.5)*s;
   particles.emit({x:e.x,h,z:e.y,vx:Math.cos(a)*sp,vh:rand(.8,3.6),vz:Math.sin(a)*sp,life:rand(.22,.5),s0:rand(.22,.36)*s,s1:.04,c0:mix(c,WHITE,.6),c1:c,grav:10,drag:2.2});}
  particles.emit({x:e.x,h,z:e.y,life:.18,s0:2.4*s,s1:.7*s,c0:WHITE,c1:c,a0:.9});
  o.ring=shockRing(o,e);o.ring.position.set(e.x,.07,e.y);
 };
 RUN.impact=(o,e)=>{const t=life(e);o.ring.scale.setScalar((e.size||1)*lerp(.3,1.05,easeOut(t)));o.ring.material.opacity=(1-t)*.8;};

 // Rastro curvo de um golpe: faixa em arco com brilho na borda externa.
 INIT.slash=(o,e)=>{
  const arc=e.arc||Math.PI*.8,r=e.radius||1.8,dir=Math.atan2(e.dy,e.dx),c=hex(e.color||'#ffd9a0'),h=e.h??.85;
  const m=new THREE.Mesh(new THREE.RingGeometry(r*.45,r,40,1,-dir-arc/2,arc),material(textures.arc,e.color||'#ffd9a0',.95));
  m.userData.ownGeometry=true;m.rotation.x=-Math.PI/2;m.position.set(e.x,h,e.y);m.renderOrder=11;scene.add(m);o.objs.push(m);o.mesh=m;o.arc=arc;
  const n=Math.round((e.sparks??8)*density);
  for(let i=0;i<n;i++){const a=dir+(n>1?i/(n-1)-.5:0)*arc*.9,rr=r*rand(.8,1);
   particles.emit({x:e.x+Math.cos(a)*rr,h,z:e.y+Math.sin(a)*rr,vx:-Math.sin(a)*rand(1,3),vh:rand(.4,1.6),vz:Math.cos(a)*rand(1,3),life:rand(.2,.4),s0:rand(.12,.2),s1:.02,c0:WHITE,c1:c,grav:4,drag:3});
   if(e.mood==='fire'&&Math.random()<.7)flame(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,{up:2.2,size:.55,life:.7});}
 };
 RUN.slash=(o,e)=>{const t=life(e);o.mesh.scale.setScalar(lerp(.82,1.08,easeOut(t)));o.mesh.material.opacity=Math.pow(1-t,2)*.95;o.mesh.rotation.z=(t-.5)*o.arc*.3;};

 // Vento do golpe: filetes de ar varrendo o arco (só desenho; o dano usa a geometria das regras).
 INIT.windarc=(o,e)=>{
  const arc=e.arc||Math.PI*.7,r=e.radius||3,dir=Math.atan2(e.dy,e.dx),c=hex(e.color||'#d6f4ff'),spin=e.sweep||-1,n=Math.round(54*density);
  for(let k=0;k<3;k++){const rr=r*(.5+.25*k),m=new THREE.Mesh(new THREE.RingGeometry(rr,rr+r*.025,48,1,-dir-arc/2,arc),new THREE.MeshBasicMaterial({color:new THREE.Color(e.color||'#d6f4ff'),transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide,fog:false}));m.userData.ownGeometry=true;m.rotation.x=-Math.PI/2;m.position.set(e.x,.7+.45*k,e.y);m.renderOrder=11;scene.add(m);o.objs.push(m);}
  o.spin=spin;o.arc=arc;
  for(let i=0;i<n;i++){const a=dir+(Math.random()-.5)*arc*.95,rr=r*rand(.4,1),sp=rand(5,10);
   particles.emit({x:e.x+Math.cos(a)*rr,h:rand(.5,2.1),z:e.y+Math.sin(a)*rr,vx:-Math.sin(a)*spin*sp,vh:rand(-.3,.5),vz:Math.cos(a)*spin*sp,life:rand(.25,.5),s0:rand(.12,.26),s1:.03,c0:mix(c,WHITE,.7),c1:c,a0:.65,drag:3.5});}
 };
 RUN.windarc=(o,e)=>{const t=life(e);o.objs.forEach((m,i)=>{m.rotation.z=-t*o.arc*.6*o.spin*(1+i*.25);m.material.opacity=Math.pow(1-t,1.6)*.8;m.scale.setScalar(1+t*.12);});};

 // Onda de choque no chão: poeira ou fogo saindo do centro.
 INIT.shockwave=(o,e)=>{
  const r=e.radius,fire=e.mood==='fire',n=Math.round(Math.min(46,r*9)*density);
  o.ring=shockRing(o,e);o.ring.scale.setScalar(.1);o.ring2=shockRing(o,e);o.ring2.scale.setScalar(.1);o.r=r;
  if(fire){o.glow=decal(o,textures.heat,e.color||'#ff7a2a',{y:.066,opacity:.8});o.glow.position.set(e.x,.066,e.y);}
  for(let i=0;i<n;i++){const a=i/n*TAU+rand(-.1,.1),sp=r/(e.duration||.5)*rand(.5,.9);
   particles.emit({x:e.x+Math.cos(a)*r*.12,h:.15,z:e.y+Math.sin(a)*r*.12,vx:Math.cos(a)*sp,vh:rand(.2,fire?3.4:1.2),vz:Math.sin(a)*sp,life:rand(.35,.75),s0:rand(.35,.65)*(fire?1:1.2),s1:fire?.1:1,c0:fire?[1,.85,.45]:[.82,.76,.62],c1:fire?[.8,.2,.05]:[.5,.46,.4],a0:fire?.9:.5,grav:fire?-1.5:-.5,drag:2});}
  if(e.shake)shake=Math.max(shake,e.shake);
 };
 RUN.shockwave=(o,e)=>{const t=life(e),t2=clamp01(t*1.2-.12);o.ring.scale.setScalar(Math.max(.05,o.r*(.15+.85*easeOut(t))));o.ring.material.opacity=Math.pow(1-t,1.4)*.95;o.ring2.scale.setScalar(Math.max(.05,o.r*(.1+.7*easeOut(t2))));o.ring2.material.opacity=Math.pow(1-t2,1.8)*.6*(t>.04?1:0);if(o.glow){o.glow.scale.setScalar(o.r*(.5+.5*easeOut(t)));o.glow.material.opacity=Math.pow(1-t,1.6)*.8;}};

 // Fase II do Rei: pilares de fogo em anel e onda grande, só visuais.
 INIT.roar=(o,e)=>{
  INIT.shockwave(o,e);o.rune=decal(o,textures.runeA,e.color||'#ff7a2a',{y:.072});o.rune.position.set(e.x,.072,e.y);
  if(e.mood!=='war')for(let k=0;k<14;k++){const a=k/14*TAU,x=e.x+Math.cos(a)*3.2,z=e.y+Math.sin(a)*3.2;for(let j=0;j<Math.round(5*density);j++)flame(x,z,{up:6.5,spread:.35,life:1.1,size:1.5});}
 };
 RUN.roar=(o,e)=>{RUN.shockwave(o,e);const t=life(e);o.rune.scale.setScalar(lerp(2.5,6,easeOut(t)));o.rune.rotation.z=time*1.2;o.rune.material.opacity=Math.pow(1-t,1.2);};

 // Fratura temporária do chão, combinada com poeira e onda de choque.
 INIT.groundBreak=(o,e)=>{INIT.shockwave(o,e);o.cracks=decal(o,textures.cracks,'#231c19',{y:.065});o.cracks.position.set(e.x,.065,e.y);o.cracks.scale.setScalar(e.radius);};
 RUN.groundBreak=(o,e)=>{RUN.shockwave(o,e);o.cracks.material.opacity=Math.min(1,(1-life(e))*3);};
 // Marca de perigo: círculo rúnico, preenchimento que cresce até a borda quando o golpe acontece e chamas na borda.
 INIT.dangerRune=(o,e)=>{
  const c=e.color||'#ff784e';o.rune=decal(o,textures.runeD,c,{y:.06});
  if(!e.noFill)o.fill=decal(o,textures.heat,c,{y:.058,opacity:0});
  o.edge=decal(o,textures.edge,c,{y:.064});o.seed=Math.random()*TAU;o.acc=0;
 };
 RUN.dangerRune=(o,e,step)=>{
  const r=e.radius,p=clamp01(e.progress??1);
  for(const m of [o.rune,o.edge,o.fill])if(m)m.position.set(e.x,m.position.y,e.y);
  o.rune.scale.setScalar(r*.97);o.rune.rotation.z=o.seed+time*.35;o.rune.material.opacity=.5+.25*Math.sin(time*6);
  o.edge.scale.setScalar(r);o.edge.material.opacity=e.mood==='aura'?.6:.7+.3*Math.sin(time*(6+p*14));
  if(o.fill){o.fill.scale.setScalar(Math.max(.04,r*p));o.fill.material.opacity=.3+.5*p;}
  if(e.mood==='fire'&&p>.1){o.acc+=step*r*(3+p*7)*density;while(o.acc>=1){o.acc--;const a=rand(0,TAU);flame(e.x+Math.cos(a)*r*.96,e.y+Math.sin(a)*r*.96,{up:1.6+p,size:.4+.2*p,life:.6});}}
 };

 // Chão em chamas (Erupção, Queda do Rei): disco quente sobre uma runa queimada, com labaredas.
 INIT.fireField=(o,e)=>{o.base=decal(o,textures.scorch,'#ffffff',{y:.052,opacity:.95});o.glow=decal(o,textures.heat,e.color||'#ff7a2a',{y:.056,opacity:.4});o.cracks=decal(o,textures.cracks,'#ff6a1a',{y:.06});o.acc=0;o.emb=0;o.smk=0;o.seed=Math.random()*TAU;};
 RUN.fireField=(o,e,step)=>{
  const r=e.radius,fade=clamp01((e.remaining??9)/.7),flick=.8+.2*Math.sin(time*13+o.seed)*Math.sin(time*5.3+o.seed*2);
  for(const m of [o.base,o.glow,o.cracks])m.position.set(e.x,m.position.y,e.y);
  o.base.scale.setScalar(r*1.04);o.base.rotation.z=o.seed;o.base.material.opacity=.95*Math.min(1,fade*1.5);
  o.glow.scale.setScalar(r*.95);o.glow.material.opacity=.45*flick*fade;
  o.cracks.scale.setScalar(r*.98);o.cracks.rotation.z=o.seed;o.cracks.material.opacity=Math.min(1,flick*1.15)*fade;
  o.acc+=step*r*r*7*density*fade;while(o.acc>=1){o.acc--;const a=rand(0,TAU),d=r*Math.pow(Math.random(),.6)*.92;flame(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d,{up:2.4,spread:.25,size:.8,life:1.1});}
  o.emb+=step*r*r*1.1*density*fade;while(o.emb>=1){o.emb--;const a=rand(0,TAU),d=r*Math.sqrt(Math.random());ember(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d);}
  o.smk+=step*r*r*.35*density*fade;while(o.smk>=1){o.smk--;const a=rand(0,TAU),d=r*Math.sqrt(Math.random())*.8;smoke(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d);}
 };

 // Círculos de invocação: dois anéis rúnicos contra-rotativos, coluna de luz e fagulhas subindo.
 INIT.summonRune=(o,e)=>{
  const c=e.color||'#9dbf68';o.a=decal(o,textures.runeA,c,{y:.065});o.b=decal(o,textures.runeB,c,{y:.068});o.glow=decal(o,textures.disc,c,{y:.062,opacity:0});o.col=pillar(o,c);o.acc=0;o.seed=Math.random()*TAU;
 };
 RUN.summonRune=(o,e,step)=>{
  const r=e.radius,t=life(e),grow=easeOut(clamp01(t*3.2)),fade=e.progress!==undefined?1:clamp01((1-t)*4),alpha=clamp01(t*6)*fade,c=hex(e.color||'#9dbf68');
  for(const [m,s,sp]of [[o.a,1,.9],[o.b,.62,-1.4]]){m.position.set(e.x,m.position.y,e.y);m.scale.setScalar(r*s*(.55+.45*grow));m.rotation.z=o.seed+time*sp;m.material.opacity=alpha*.95;}
  o.glow.position.set(e.x,.062,e.y);o.glow.scale.setScalar(r*.95);o.glow.material.opacity=alpha*(.5+.25*Math.sin(time*9));
  const height=lerp(.2,3.4,easeOut(clamp01((t-.2)*2.5)));o.col.position.set(e.x,.05,e.y);o.col.scale.set(r*.55,height,r*.55);o.col.material.opacity=t>.15?alpha*.85:0;
  if(e.progress===undefined&&!o.flashed&&t>.55){o.flashed=true;particles.emit({x:e.x,h:.6,z:e.y,life:.25,s0:r*2.4,s1:r*.8,c0:WHITE,c1:c,a0:.7});for(let i=0;i<Math.round(14*density);i++){const a=rand(0,TAU),d=rand(0,r*.7);particles.emit({x:e.x+Math.cos(a)*d,h:.2,z:e.y+Math.sin(a)*d,vh:rand(2.5,5),life:rand(.4,.8),s0:rand(.14,.24),s1:.02,c0:mix(c,WHITE,.6),c1:c,grav:3,drag:.8});}}
  o.acc+=step*(20+r*14)*density;while(o.acc>=1){o.acc--;const a=rand(0,TAU),d=r*rand(.35,.95);particles.emit({x:e.x+Math.cos(a)*d,h:.1,z:e.y+Math.sin(a)*d,vh:rand(1.2,3),life:rand(.6,1),s0:rand(.18,.3),s1:.03,c0:mix(c,WHITE,.5),c1:c,drag:.5,a0:1});}
 };
 // Chegada dos reforços do chefe: coluna de luz, anel e fagulhas.
 INIT.summonBurst=(o,e)=>{
  const c=hex(e.color||'#5fe8d8'),r=e.radius;o.ring=shockRing(o,e);o.ring.scale.setScalar(.1);o.col=pillar(o,e.color||'#5fe8d8');o.rune=decal(o,textures.runeB,e.color||'#5fe8d8',{y:.068});
  particles.emit({x:e.x,h:.6,z:e.y,life:.3,s0:r*2.2,s1:r*.7,c0:WHITE,c1:c,a0:.75});
  for(let i=0;i<Math.round(16*density);i++){const a=rand(0,TAU),d=rand(0,r*.8);particles.emit({x:e.x+Math.cos(a)*d,h:.2,z:e.y+Math.sin(a)*d,vh:rand(2,5.5),life:rand(.4,.9),s0:rand(.14,.26),s1:.02,c0:mix(c,WHITE,.6),c1:c,grav:3,drag:.8});}
  o.r=r;
 };
 RUN.summonBurst=(o,e)=>{
  const t=life(e),r=o.r;o.ring.position.set(e.x,.07,e.y);o.ring.scale.setScalar(Math.max(.05,r*(.2+.9*easeOut(t))));o.ring.material.opacity=Math.pow(1-t,1.3)*.9;
  o.rune.position.set(e.x,.068,e.y);o.rune.scale.setScalar(r*(.7+.5*t));o.rune.rotation.z=time*2;o.rune.material.opacity=Math.pow(1-t,1.5)*.9;
  o.col.position.set(e.x,.05,e.y);o.col.scale.set(r*.5*(1-t*.5),lerp(1,3.6,easeOut(t)),r*.5*(1-t*.5));o.col.material.opacity=Math.pow(1-t,1.2)*.8;
 };

 // Tiro de Osso no jogador: clarão na mão do cajado, faíscas na direção da mira e anel rúnico sob os pés.
 INIT.boltCast=(o,e)=>{
  const c=hex(e.color||'#b8f2d0'),hx=e.x+e.dx*.55,hz=e.y+e.dy*.55,base=Math.atan2(e.dy,e.dx);
  particles.emit({x:hx,h:1.15,z:hz,life:.2,s0:1.2,s1:.4,c0:WHITE,c1:c,a0:.9});
  for(let i=0;i<Math.round(9*density);i++){const a=base+rand(-.55,.55),sp=rand(4,9);particles.emit({x:hx,h:1.15+rand(-.1,.1),z:hz,vx:Math.cos(a)*sp,vh:rand(-.4,1),vz:Math.sin(a)*sp,life:rand(.18,.38),s0:rand(.12,.22),s1:.02,c0:WHITE,c1:c,drag:3});}
  for(let i=0;i<Math.round(4*density);i++)particles.emit({x:hx,h:1.1,z:hz,vx:Math.cos(base+rand(-1,1))*rand(1,2.5),vh:rand(1.5,3),vz:Math.sin(base+rand(-1,1))*rand(1,2.5),life:rand(.4,.6),s0:rand(.1,.15),s1:.06,c0:[.93,.91,.8],c1:[.7,.68,.6],grav:9,drag:1});
  o.rune=decal(o,textures.runeB,e.color||'#b8f2d0',{y:.075});o.rune.position.set(e.x,.075,e.y);o.ring=shockRing(o,e);o.ring.position.set(e.x,.07,e.y);o.seed=Math.random()*TAU;
 };
 RUN.boltCast=(o,e)=>{
  const t=life(e);o.rune.position.set(e.x,.075,e.y);o.rune.scale.setScalar(lerp(.6,1.25,easeOut(t)));o.rune.rotation.z=o.seed+t*2.4;o.rune.material.opacity=Math.pow(1-t,1.3)*.9;
  o.ring.position.set(e.x,.07,e.y);o.ring.scale.setScalar(lerp(.4,1.7,easeOut(t)));o.ring.material.opacity=Math.pow(1-t,2)*.7;
 };
 // Disparo de arqueiro/mago: clarão e faíscas na saída.
 INIT.muzzle=(o,e)=>{
  const c=hex(e.color||'#edce77'),base=Math.atan2(e.dy,e.dx),hx=e.x+e.dx*.5,hz=e.y+e.dy*.5;
  particles.emit({x:hx,h:1.1,z:hz,life:.16,s0:.9,s1:.3,c0:WHITE,c1:c,a0:.85});
  for(let i=0;i<Math.round(6*density);i++){const a=base+rand(-.45,.45),sp=rand(3,7);particles.emit({x:hx,h:1.1,z:hz,vx:Math.cos(a)*sp,vh:rand(-.3,.8),vz:Math.sin(a)*sp,life:rand(.15,.3),s0:rand(.1,.18),s1:.02,c0:WHITE,c1:c,drag:3});}
 };
 // Saraivada dos arqueiros: flechas caem do alto na área marcada e ficam fincadas por um instante.
 let arrowGeo=null;
 INIT.arrowRain=(o,e)=>{
  arrowGeo=arrowGeo||new THREE.ConeGeometry(.08,1.3,5);o.arrows=[];
  for(let i=0,n=Math.max(4,Math.round((e.count||10)*density));i<n;i++){
   const a=rand(0,TAU),r=Math.sqrt(Math.random())*e.radius*.95,m=new THREE.Mesh(arrowGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(e.color||'#e0c070'),transparent:true})),life=e.fall*rand(.45,.6);
   m.rotation.x=Math.PI;m.renderOrder=11;m.visible=false;scene.add(m);o.objs.push(m);o.arrows.push({m,x:e.x+Math.cos(a)*r,z:e.y+Math.sin(a)*r,life,start:rand(0,e.fall-life),tilt:rand(-.35,.35),landed:false});
  }
 };
 RUN.arrowRain=(o,e)=>{
  const t=e.time;
  for(const a of o.arrows){
   const u=(t-a.start)/a.life;if(u<0)continue;a.m.visible=true;
   if(u<1)a.m.position.set(a.x,.4+9*(1-u*u),a.z);
   else{a.m.position.set(a.x,.3,a.z);a.m.rotation.z=a.tilt;a.m.material.opacity=clamp01((e.duration-t)/.4);
    if(!a.landed){a.landed=true;for(let k=0,n=Math.round(4*density);k<n;k++)particles.emit({x:a.x,h:.2,z:a.z,vx:rand(-1,1),vh:rand(.8,2),vz:rand(-1,1),life:rand(.25,.45),s0:.2,s1:.04,c0:[.8,.72,.5],c1:[.5,.45,.35],drag:3,a0:.7});}}
  }
 };
 // Projétil hostil: orbe luminoso e rastro de faíscas.
 INIT.projectile=(o,e)=>{
  const magic=e.shot!=='arrow'&&e.shot!=='feather',s=new THREE.Sprite(new THREE.SpriteMaterial({map:textures.glow,color:new THREE.Color(e.shot==='feather'?'#f0e0b8':magic?'#e0a0ff':'#fff0b0'),transparent:true,depthTest:false,depthWrite:false}));
  s.renderOrder=11;scene.add(s);o.objs.push(s);o.orb=s;o.lx=e.x;o.lz=e.y;
  if(e.rogueTrail){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xe4d3a8,transparent:true,opacity:.3,depthWrite:false}));line.userData.ownGeometry=true;scene.add(line);o.objs.push(line);o.trail=line;}

 };
 RUN.projectile=(o,e,step)=>{
  const feather=e.shot==='feather',magic=e.shot!=='arrow'&&!feather,c=magic?[.82,.5,1]:feather?[.94,.86,.66]:[.95,.82,.4],size=feather?.4:magic?1:.6;
  if(o.trail){const a=o.trail.geometry.attributes.position;a.setXYZ(0,e.x,.85,e.y);a.setXYZ(1,e.x-e.dx*.9,.85,e.y-e.dy*.9);a.needsUpdate=true;o.trail.geometry.computeBoundingSphere();}
  o.orb.position.set(e.x,.85,e.y);o.orb.scale.setScalar(size*(.9+.1*Math.sin(time*40)));
  if(step>0){const n=Math.max(1,Math.round(step*80*density));for(let i=0;i<n;i++){const k=Math.random();particles.emit({x:lerp(o.lx,e.x,k),h:.85+rand(-.08,.08),z:lerp(o.lz,e.y,k),vx:rand(-.3,.3),vh:rand(-.2,.4),vz:rand(-.3,.3),life:rand(.18,.35),s0:(magic?.26:.14)*rand(.8,1.2),s1:.02,c0:mix(c,WHITE,.4),c1:c,a0:.8});}}
  o.lx=e.x;o.lz=e.y;
 };

 // Forma de Lich: aura que evapora do corpo, vento da foice em voo e fiapos dos espíritos.
 const lichFx={acc:0,fine:0,last:null};
 function lichAmbient(w,step){
  const l=w.lich;if(!l||step<=0)return;const p=w.player;
  if(l.form!=='none'){
   lichFx.acc+=step*(l.form==='transform'?70:20)*density;
   while(lichFx.acc>=1){lichFx.acc--;const a=rand(0,TAU),d=rand(.1,.8);
    particles.emit({x:p.x+Math.cos(a)*d,h:rand(.3,2.7),z:p.y+Math.sin(a)*d,vx:Math.cos(a)*rand(0,.3),vh:rand(.7,1.6),vz:Math.sin(a)*rand(0,.3),life:rand(1.1,1.8),s0:rand(.28,.45),s1:rand(.8,1.2),c0:[.82,.55,1],c1:[.4,.7,1],a0:.2,drag:.6});}
   lichFx.fine+=step*5*density;
   while(lichFx.fine>=1){lichFx.fine--;const a=rand(0,TAU),d=rand(.2,.7);
    particles.emit({x:p.x+Math.cos(a)*d,h:rand(.4,2.4),z:p.y+Math.sin(a)*d,vh:rand(1.8,3.2),life:rand(.7,1.2),s0:rand(.06,.1),s1:.02,c0:WHITE,c1:[.7,.85,1],a0:.5,drag:.3});}
  }
  const s=l.scythe;
  if(s&&!s.arrived){
   if(lichFx.last){const dx=s.x-lichFx.last.x,dy=s.y-lichFx.last.y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,n=Math.max(1,Math.round(step*150*density));
    for(let i=0;i<n;i++){const ph=time*18+i*2.1,rad=rand(.3,.7),k=rand(0,1);
     particles.emit({x:lerp(lichFx.last.x,s.x,k)+nx*Math.cos(ph)*rad,h:1.3+Math.sin(ph)*rad*.8,z:lerp(lichFx.last.y,s.y,k)+ny*Math.cos(ph)*rad,vx:-dx/d*rand(1,3)+nx*Math.sin(ph)*2,vh:rand(-.3,.3),vz:-dy/d*rand(1,3)+ny*Math.sin(ph)*2,life:rand(.3,.5),s0:rand(.16,.26),s1:.03,c0:[.92,.98,1],c1:[.55,.8,1],a0:.6,drag:2.2});}}
   lichFx.last={x:s.x,y:s.y};
  }else lichFx.last=null;
  for(const sp of w.spirits||[]){particles.emit({x:sp.x,h:1.35,z:sp.y,life:.06,s0:1.7,s1:1.5,c0:[.85,.95,1],c1:[.85,.95,1],a0:.2});if(Math.random()<step*9*density)particles.emit({x:sp.x+rand(-.15,.15),h:rand(.6,1.5),z:sp.y+rand(-.15,.15),vh:rand(.3,.8),life:rand(.8,1.3),s0:rand(.14,.22),s1:rand(.4,.6),c0:[.95,.98,1],c1:[.7,.85,1],a0:.3,drag:.6});}
 }

 // Efeitos ligados ao estado do mundo (sem evento próprio): rastro do osso e aura do chefe na Fase II.
 const TIER_FX={magic:{color:'#73b5ff',rgb:[.45,.71,1],opacity:.7,rate:3},rare:{color:'#ecd16b',rgb:[.93,.82,.42],opacity:.9,rate:7}},elites=new Map();
 function eliteAuras(w,step){
  const live=new Set(),p=w.player;
  for(const a of w.actors){
   const tier=TIER_FX[a.lootTier];if(!tier||a.isBoss||a.hp<=0||a.dead||Math.hypot(a.x-p.x,a.y-p.y)>40)continue;
   live.add(a.id);let o=elites.get(a.id);
   if(!o){o={objs:[],seed:Math.random()*TAU,acc:0};o.mesh=decal(o,textures.runeB,tier.color,{y:.058});elites.set(a.id,o);}
   const r=a.radius*2.8+.35;o.mesh.position.set(a.x,.058,a.y);o.mesh.scale.setScalar(r);o.mesh.rotation.z=o.seed+time*(a.lootTier==='rare'?1.1:.7);o.mesh.material.opacity=tier.opacity*(.8+.2*Math.sin(time*4+o.seed));
   o.acc+=step*tier.rate*density;while(o.acc>=1){o.acc--;const t=rand(0,TAU),d=r*rand(.4,.95);
    if(a.lootTier==='rare'&&Math.random()<.4)flame(a.x+Math.cos(t)*d,a.y+Math.sin(t)*d,{up:1.2,spread:.1,size:.3,life:.7});
    else particles.emit({x:a.x+Math.cos(t)*d,h:.1,z:a.y+Math.sin(t)*d,vh:rand(.8,1.8),life:rand(.7,1.1),s0:rand(.1,.17),s1:.02,c0:mix(tier.rgb,WHITE,.5),c1:tier.rgb,drag:.4,a0:.9});}
  }
  for(const [id,o] of elites)if(!live.has(id)){release(o);elites.delete(id);}
 }
 function ambient(w,step){
  if(step>0)for(const b of w.projectiles||[]){
   const n=Math.max(1,Math.round(step*90*density));
   for(let i=0;i<n;i++){const k=rand(0,step*14);particles.emit({x:b.x-b.dx*k+rand(-.05,.05),h:.85+rand(-.08,.08),z:b.y-b.dy*k+rand(-.05,.05),vh:rand(-.1,.5),life:rand(.2,.4),s0:rand(.12,.2),s1:.02,c0:[.9,1,.92],c1:[.5,.85,.65],a0:.7,drag:1});}
   particles.emit({x:b.x,h:.85,z:b.y,life:.05,s0:.6,s1:.5,c0:[.8,1,.9],c1:[.6,.95,.8],a0:.45});
  }
  eliteAuras(w,step);
  const boss=w.boss,on=boss&&boss.kingPhase2&&boss.hp>0&&!boss.dead&&w.actors.includes(boss);
  if(!on){if(aura.mesh){scene.remove(aura.mesh);aura.mesh.material.dispose();aura.mesh=null;}return;}
  if(!aura.mesh){const m=new THREE.Mesh(plane,material(textures.runeD,'#ff5a2a',.55));m.rotation.x=-Math.PI/2;m.position.y=.055;m.renderOrder=4;scene.add(m);aura.mesh=m;}
  aura.mesh.position.set(boss.x,.055,boss.y);aura.mesh.scale.setScalar(2.3);aura.mesh.rotation.z=time*.5;aura.mesh.material.opacity=.75+.2*Math.sin(time*5);
  aura.acc+=step*40*density;while(aura.acc>=1){aura.acc--;const a=rand(0,TAU),d=rand(.2,1.2);if(Math.random()<.45)flame(boss.x+Math.cos(a)*d,boss.y+Math.sin(a)*d,{up:1.8,spread:.15,size:.34,life:.7});else particles.emit({x:boss.x+Math.cos(a)*d,h:rand(.1,2.2),z:boss.y+Math.sin(a)*d,vx:rand(-.2,.2),vh:rand(1,2.4),vz:rand(-.2,.2),life:rand(.8,1.3),s0:rand(.16,.28),s1:.03,c0:[1,.8,.35],c1:[.9,.15,.05],a0:.9,drag:.4});}
 }

 function update(w,dt,{frozen=false,view=1}={}){
  if(failed)return;
  const step=frozen?0:Math.min(dt,.1);
  try{
   if(w.time<lastTime-.5)clear();lastTime=w.time;
   time+=step;particles.uniforms(pixelsPerUnit(),time);
   const seen=new Set();
   for(const e of w.effects){
    if(!e.fx||!INIT[e.fx])continue;const key=e.fx+':'+e.id;seen.add(key);
    let o=entries.get(key);if(!o){o={objs:[]};entries.set(key,o);INIT[e.fx](o,e);}
    RUN[e.fx]?.(o,e,step);
   }
   for(const [key,o] of entries)if(!seen.has(key)){release(o);entries.delete(key);}
   ambient(w,step);lichAmbient(w,step);particles.update(step);shake*=Math.exp(-6*step);if(shake<.01)shake=0;
  }catch(error){failed=true;clear();console.error('Efeitos visuais desativados após erro:',error);}
 }
 function clear(){for(const o of entries.values())release(o);entries.clear();for(const o of elites.values())release(o);elites.clear();particles.reset();shake=0;}
 function dispose(){
  clear();particles.dispose();if(aura.mesh){scene.remove(aura.mesh);aura.mesh.material.dispose();}
  plane.dispose();column.dispose();for(const t of Object.values(textures))t.dispose();
 }
 return {
  update,clear,dispose,
  quality(low){density=low?.4:1;},
  // Deslocamento da câmera por tremor de impacto (decai sozinho); zero com a simulação pausada.
  shakeOffset(){return shake>0?{x:rand(-1,1)*shake*.35,z:rand(-1,1)*shake*.35}:{x:0,z:0};},
  stats:()=>({particles:particles.count(),effects:entries.size,failed}),
 };
}
