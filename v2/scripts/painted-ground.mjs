// Chão dos mapas abertos com a grama e a terra batida da Vila de Jacarandá (mesmos tons e traços de village-ground.mjs).
// Grama e terra são ladrilhos sem emenda amostrados pela posição no mundo: a nitidez é a mesma num mapa de 40 u ou de 360 u.
// Uma textura de sobreposição por mapa diz onde há trilha (R), sombra de contato e sulcos (G), manchas de cor (B) e água parada (A).
// Só desenho: o chão continua todo caminhável e a mira usa um plano matemático.
import * as THREE from 'three';
import {heightAt,TERRAIN_RULES,SURFACES} from './map-terrain.mjs';

const K=32,GRASS_TILE=32,DIRT_TILE=16,MARGIN=12,OVERLAY_MAX=2048;
const GRASS=['#4f6a38','#45602f','#58743c','#3e5a2d','#62793f','#4a6534','#536d33','#3b532b'];
const BLOBS=['#647f40','#3a5229','#6f8446','#43602e','#7a7c45'],SPECKS=['#5e4c34','#86704d','#6a563a','#8f7a58'];
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function surface(w,h,read=true){const c=document.createElement('canvas');c.width=w;c.height=h;return c.getContext('2d',{willReadFrequently:read});}
// Desenha nas nove posições vizinhas: o que passa da borda reaparece do outro lado do ladrilho.
function wrapped(g,size,draw){for(const dx of [-size,0,size])for(const dz of [-size,0,size]){g.setTransform(1,0,0,1,dx,dz);draw();}g.setTransform(1,0,0,1,0,0);}
function tileTexture(color,mask,size){
 const a=color.getImageData(0,0,size,size).data,b=mask?.getImageData(0,0,size,size).data,data=new Uint8Array(size*size*4);
 for(let i=0;i<data.length;i+=4){data[i]=a[i];data[i+1]=a[i+1];data[i+2]=a[i+2];data[i+3]=b?b[i]:255;}
 const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;
 return t;
}

// Ladrilhos gerados uma vez e compartilhados por todos os mapas (nunca liberados).
// Grama: RGB = cor, A = folhas (usadas para a grama invadir a borda das trilhas). Terra: base, grãos e pedriscos.
let tiles=null;
function groundTiles(){
 if(tiles)return tiles;
 const random=rng(0xE1D41),between=(a,c)=>a+(c-a)*random(),pick=list=>list[Math.floor(random()*list.length)];
 const S=GRASS_TILE*K,g=surface(S,S),m=surface(S,S);
 g.fillStyle='#4b6536';g.fillRect(0,0,S,S);m.fillStyle='#000';m.fillRect(0,0,S,S);
 for(let i=0;i<130;i++){
  const x=between(0,S),z=between(0,S),r=between(1,5)*K,color=pick(BLOBS),alpha=between(.18,.35);
  wrapped(g,S,()=>{const gr=g.createRadialGradient(x,z,0,x,z,r);gr.addColorStop(0,color);gr.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=alpha;g.fillStyle=gr;g.fillRect(x-r,z-r,r*2,r*2);});
 }
 g.globalAlpha=1;
 // Folhas em lotes por cor, na mesma densidade da vila (~27 por u²).
 const buckets=GRASS.map(()=>new Path2D()),all=new Path2D();
 for(let i=0;i<GRASS_TILE*GRASS_TILE*27;i++){
  const x=between(0,S),z=between(0,S),p=buckets[Math.floor(random()*GRASS.length)],tx=x+between(-1.6,1.6),tz=z-between(2,5);
  p.moveTo(x,z);p.lineTo(tx,tz);all.moveTo(x,z);all.lineTo(tx,tz);
 }
 for(const c of [g,m]){c.lineWidth=1.1;c.lineCap='round';}
 buckets.forEach((p,i)=>{g.strokeStyle=GRASS[i];wrapped(g,S,()=>g.stroke(p));});
 m.strokeStyle='#fff';wrapped(m,S,()=>m.stroke(all));
 const D=DIRT_TILE*K,d=surface(D,D);
 d.fillStyle='#735e40';d.fillRect(0,0,D,D);
 for(let i=0;i<DIRT_TILE*DIRT_TILE*60;i++){
  const x=between(0,D),z=between(0,D),s=between(1,2.4);d.fillStyle=pick(SPECKS);
  for(const ox of x+s>D?[0,-D]:[0])for(const oz of z+s>D?[0,-D]:[0])d.fillRect(x+ox,z+oz,s,s);
 }
 return tiles={grass:tileTexture(g,m,S),dirt:tileTexture(d,null,D)};
}

// Sobreposição do mapa: cada camada é pintada em tons de cinza no mesmo canvas e copiada para um canal.
function paintOverlay(arena,swamp){
 const b=arena.bounds,x0=b.minX-MARGIN,z0=b.minY-MARGIN,w=b.maxX-b.minX+MARGIN*2,h=b.maxY-b.minY+MARGIN*2;
 const k=Math.min(K,OVERLAY_MAX/Math.max(w,h)),cw=Math.max(16,Math.round(w*k)),ch=Math.max(16,Math.round(h*k));
 const random=rng(hash(arena.id)),between=(a,c)=>a+(c-a)*random();
 // Formas desenhadas sem filtro em `g` e compostas em `out` com um único desfoque por etapa (filtro por forma trava o mundo de 360 u).
 const out=surface(cw,ch),g=surface(cw,ch,false),data=new Uint8Array(cw*ch*4),X=x=>(x-x0)*cw/w,Z=z=>(z-z0)*ch/h,U=u=>u*k;
 const flush=px=>{out.filter=px?`blur(${px.toFixed(2)}px)`:'none';out.drawImage(g.canvas,0,0);out.filter='none';g.clearRect(0,0,cw,ch);g.globalAlpha=1;};
 const layer=(channel,base,paint)=>{out.globalAlpha=1;out.fillStyle=base;out.fillRect(0,0,cw,ch);g.clearRect(0,0,cw,ch);paint();flush(0);const px=out.getImageData(0,0,cw,ch).data;for(let i=0;i<data.length;i+=4)data[i+channel]=px[i];};
 const blob=(x,z,r,color,alpha)=>{const gr=g.createRadialGradient(X(x),Z(z),0,X(x),Z(z),U(r));gr.addColorStop(0,color);gr.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=alpha;g.fillStyle=gr;g.fillRect(X(x)-U(r),Z(z)-U(r),U(r)*2,U(r)*2);g.globalAlpha=1;};
 // Contorno irregular de um círculo (borda orgânica, como as ruas de terra da vila).
 const ragged=(cx,cz,r,amp)=>{const phase=[random()*9,random()*9,random()*9],n=Math.max(12,Math.ceil(r*2*Math.PI/.25));g.beginPath();
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,t=a*r,q=r+(Math.sin(t*1.7+phase[0])*.5+Math.sin(t*4.3+phase[1])*.3+Math.sin(t*9.1+phase[2])*.2)*amp;i?g.lineTo(X(cx+Math.cos(a)*q),Z(cz+Math.sin(a)*q)):g.moveTo(X(cx+Math.cos(a)*q),Z(cz+Math.sin(a)*q));}
  g.closePath();};
 const paths=arena.decor?.path||[],patches=arena.decor?.patches||[];
 // Círculos vizinhos formam a trilha; a árvore geradora mínima dá um único eixo por trecho (sulcos e faixa de grama central).
 const links=[];
 for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++){const p=paths[i],q=paths[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<=Math.min(p.r,q.r)*2.5)links.push([d,i,j]);}
 const parent=paths.map((_,i)=>i),root=i=>parent[i]===i?i:(parent[i]=root(parent[i]));
 const adjacent=paths.map(()=>[]);
 for(const [,i,j]of [...links].sort((a,c)=>a[0]-c[0])){const a=root(i),c=root(j);if(a===c)continue;parent[a]=c;adjacent[i].push(j);adjacent[j].push(i);}
 // Eixos contínuos: percorre a árvore entre pontas e bifurcações e suaviza (Chaikin) para os sulcos acompanharem as curvas.
 const axes=[],used=new Set(),edge=(i,j)=>i<j?i+','+j:j+','+i;
 for(let s=0;s<paths.length;s++)if(adjacent[s].length!==2)for(const first of adjacent[s]){
  if(used.has(edge(s,first)))continue;used.add(edge(s,first));const line=[s];let prev=s,cur=first;
  for(;;){line.push(cur);if(adjacent[cur].length!==2)break;const next=adjacent[cur][0]===prev?adjacent[cur][1]:adjacent[cur][0];if(used.has(edge(cur,next)))break;used.add(edge(cur,next));prev=cur;cur=next;}
  if(line.some(i=>paths[i].r<1.2))continue;
  let pts=line.map(i=>[paths[i].x,paths[i].y]);
  for(let n=0;n<2&&pts.length>2;n++)pts=[pts[0],...pts.slice(0,-1).flatMap((p,i)=>{const q=pts[i+1];return [[p[0]*.75+q[0]*.25,p[1]*.75+q[1]*.25],[p[0]*.25+q[0]*.75,p[1]*.25+q[1]*.75]];}),pts[pts.length-1]];
  axes.push(pts);
 }
 const along=(pts,off,wobble)=>{let t=0;g.beginPath();
  pts.forEach((p,i)=>{const a=pts[Math.max(0,i-1)],c=pts[Math.min(pts.length-1,i+1)],len=Math.hypot(c[0]-a[0],c[1]-a[1])||1,nx=-(c[1]-a[1])/len,nz=(c[0]-a[0])/len;
   if(i)t+=Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]);const o=off+Math.sin(t*.7+off)*wobble,x=p[0]+nx*o,z=p[1]+nz*o;i?g.lineTo(X(x),Z(z)):g.moveTo(X(x),Z(z));});
  g.stroke();};
 // R: terra batida. Borda desfocada para a grama do ladrilho entrar nela; faixa central mais fraca deixa brotar grama entre os sulcos.
 layer(0,'#000',()=>{
  g.fillStyle=g.strokeStyle='#fff';g.lineCap=g.lineJoin='round';
  // Terra pintada no editor entra na mesma camada das trilhas.
  const t=arena.terrain;if(t)for(let j=0;j<t.rows;j++)for(let i=0;i<t.cols;i++)if(SURFACES[t.s[j*t.cols+i]]?.id==='dirt')g.fillRect(X(t.x0+(i-.5)*t.cell),Z(t.y0+(j-.5)*t.cell),U(t.cell),U(t.cell));
  for(const p of paths){ragged(p.x,p.y,p.r*.9,.2);g.fill();}
  // Trilha de cantos retos: o retângulo exato, girado com a peça.
  for(const q of arena.decor?.pathBoxes||[]){
   const c=Math.cos(q.angle),n=Math.sin(q.angle);g.beginPath();
   [[-q.w/2,-q.d/2],[q.w/2,-q.d/2],[q.w/2,q.d/2],[-q.w/2,q.d/2]].forEach(([a,e],i)=>{const x=X(q.x+a*c+e*n),z=Z(q.y-a*n+e*c);i?g.lineTo(x,z):g.moveTo(x,z);});g.closePath();g.fill();
  }
  for(const [,i,j]of links){const p=paths[i],q=paths[j];g.lineWidth=U(Math.min(p.r,q.r)*1.8);g.beginPath();g.moveTo(X(p.x),Z(p.y));g.lineTo(X(q.x),Z(q.y));g.stroke();}
  flush(Math.max(.5,U(.18)));g.strokeStyle='rgb(150,150,150)';g.lineWidth=U(.4);
  for(const pts of axes)along(pts,0,.08);flush(Math.max(.5,U(.08)));
 });
 // G: escurecimento. Sulcos de carroça nas trilhas e sombra de contato sob colisores (a vila embutida pinta a sua).
 layer(1,'#000',()=>{
  g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=Math.max(1,U(.2));g.lineCap='round';
  g.lineJoin='round';for(const pts of axes)for(const off of [-.42,.42])along(pts,off,.06);
  flush(0);g.fillStyle='rgba(255,255,255,.5)';
  for(const s of arena.solids){
   if(s.settlement||s.terrainBlock)continue;
   if(s.kind==='box'&&s.angle){
    const e=.12,c=Math.cos(s.angle),n=Math.sin(s.angle),hw=s.width/2+e,hd=s.depth/2+e;g.beginPath();
    [[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].forEach(([a,b],i)=>{const x=X(s.x+a*c+b*n),z=Z(s.y-a*n+b*c);i?g.lineTo(x,z):g.moveTo(x,z);});g.closePath();g.fill();
   }
   else if(s.kind==='box'){const e=.12;g.fillRect(X(s.x-s.width/2-e),Z(s.y-s.depth/2-e),U(s.width+2*e),U(s.depth+2*e));}
   else{g.beginPath();g.arc(X(s.x),Z(s.y),U(s.r*(s.look==='oak'||s.look==='pine'?1.8:1.35)),0,Math.PI*2);g.fill();}
  }
  flush(Math.max(1,Math.round(U(.3))));
 });
 // Água parada do pântano, fora das trilhas: A = 0,5 na margem e 1 no centro.
 const pools=swamp?patches.filter(p=>!paths.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<t.r+p.r+1)):[];
 // B: manchas grandes de palha (claro) e musgo (escuro) quebram a repetição do ladrilho; as manchas do mapa vêm por cima.
 layer(2,'#808080',()=>{
  for(let i=0,n=Math.round(w*h/45);i<n;i++)blob(between(x0,x0+w),between(z0,z0+h),between(3,9),random()<.5?'#fff':'#000',between(.06,.14));
  for(const p of patches)if(!pools.includes(p))blob(p.x,p.y,p.r*1.3,p.tone>.5?'#fff':'#000',.45);
 });
 layer(3,'#000',()=>{
  const pool=(p,scale,color)=>{g.beginPath();for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=p.r*scale*(1+.09*Math.sin(a*5+p.x*.7)+.05*Math.cos(a*3+p.y));const x=X(p.x+Math.cos(a)*r),z=Z(p.y+Math.sin(a)*r);i?g.lineTo(x,z):g.moveTo(x,z);}g.closePath();g.fillStyle=color;g.fill();};
  for(const p of pools){pool(p,.8,'rgb(128,128,128)');pool(p,.58,'#fff');}flush(Math.max(.5,U(.1)));
 });
 const texture=new THREE.DataTexture(data,cw,ch,THREE.RGBAFormat);texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
 return {texture,rect:new THREE.Vector4(x0,z0,w,h)};
}

// Pesos das superfícies pintadas: areia, pedra, neve e lama (terra vai na camada das trilhas).
function surfaceTexture(t){
 const data=new Uint8Array(t.cols*t.rows*4),channel={sand:0,stone:1,snow:2,mud:3};
 for(let k=0;k<t.cols*t.rows;k++){const c=channel[SURFACES[t.s[k]]?.id];if(c!==undefined)data[k*4+c]=255;}
 const texture=new THREE.DataTexture(data,t.cols,t.rows,THREE.RGBAFormat);texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}
const terrainRect=t=>t?new THREE.Vector4(t.x0,t.y0,t.x1-t.x0,t.y1-t.y0):new THREE.Vector4(0,0,1,1);
// Malha na resolução da grade: altura real em cada vértice e, em `aTerrain`, altura, inclinação e o sinal de que há relevo.
function terrainGeometry(arena,rect){
 const t=arena.terrain,sx=Math.max(1,Math.ceil(rect.z/t.cell)),sz=Math.max(1,Math.ceil(rect.w/t.cell)),geometry=new THREE.PlaneGeometry(rect.z,rect.w,sx,sz).rotateX(-Math.PI/2);
 const p=geometry.attributes.position,info=new Float32Array(p.count*3),shore=new Float32Array(p.count),wet=t.hasWater?(x,z)=>{if(heightAt(arena,x,z)<TERRAIN_RULES.wet)return 1;for(const [r,weight]of [[1.5,1],[3,.55]])for(let a=0;a<8;a++)if(heightAt(arena,x+Math.cos(a*Math.PI/4)*r,z+Math.sin(a*Math.PI/4)*r)<TERRAIN_RULES.wet)return weight;return 0;}:null,cx=rect.x+rect.z/2,cz=rect.y+rect.w/2,e=t.cell*.5;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)+cx,z=p.getZ(i)+cz,h=heightAt(arena,x,z);p.setY(i,h);
  const gx=(heightAt(arena,x+e,z)-heightAt(arena,x-e,z))/(2*e),gz=(heightAt(arena,x,z+e)-heightAt(arena,x,z-e))/(2*e);
  info[i*3]=h;info[i*3+1]=Math.hypot(gx,gz)/TERRAIN_RULES.cliff;info[i*3+2]=1;if(wet)shore[i]=wet(x,z);
 }
 geometry.setAttribute('aTerrain',new THREE.BufferAttribute(info,3));geometry.setAttribute('aShore',new THREE.BufferAttribute(shore,1));geometry.computeVertexNormals();return geometry;
}

const FRAGMENT=`#include <map_fragment>
{
 vec2 gp=vGroundXZ;
 vec4 grassTexel=texture2D(uGrassTile,gp/${GRASS_TILE}.);
 vec3 dirtColor=texture2D(uDirtTile,gp/${DIRT_TILE}.).rgb;
 vec2 ouv=(gp-uGroundRect.xy)/uGroundRect.zw;
 vec4 o=texture2D(uGroundOverlay,clamp(ouv,0.,1.));
 float edge=min(min(ouv.x,1.-ouv.x)*uGroundRect.z,min(ouv.y,1.-ouv.y)*uGroundRect.w);
 o=mix(vec4(0.,0.,.5,0.),o,smoothstep(0.,3.,edge));
 float grain=dot(dirtColor,vec3(.3,.59,.11))*2.4;
 vec3 c=mix(grassTexel.rgb,uBaseColor*grain,uBaseMix)*uGrassTint;
 float tone=o.b*2.-1.;
 c=mix(c,uGroundDry,max(tone,0.)*(1.-uBaseMix*.8));c=mix(c,uGroundMoss,max(-tone,0.)*(1.-uBaseMix*.8));
 c=mix(c,dirtColor,smoothstep(.3,.7,o.r*1.4-grassTexel.a*.5));
 c=mix(c,mix(uPondEdge,uPond,smoothstep(.7,.8,o.a)),smoothstep(.15,.35,o.a));
 if(vTerrain.z>.5){
  vec2 suv=(gp-uSurfaceRect.xy)/uSurfaceRect.zw;
  vec4 w=texture2D(uSurfaceMap,(suv*(uSurfaceSize-1.)+.5)/uSurfaceSize);
  c=mix(c,vec3(.72,.62,.4)*grain,w.r);c=mix(c,vec3(.48,.49,.47)*grain,w.g);c=mix(c,vec3(.88,.92,.95)*(.6+grain*.45),w.b);c=mix(c,vec3(.2,.16,.1)*grain,w.a);
  c=mix(c,vec3(.52,.5,.46)*grain,smoothstep(.55,1.05,vTerrain.y));
  c=mix(c,vec3(.56,.5,.36)*grain,vShore*.8);c=mix(c,vec3(.22,.26,.22)*grain,smoothstep(.0,-.5,vTerrain.x));
 }
 c*=1.-o.g;
 vec2 outside=max(max(uGroundBounds.xy-gp,gp-uGroundBounds.zw),vec2(0.));
 c*=1.-.3*smoothstep(4.,40.,length(outside));
 diffuseColor.rgb*=c;
}`;

// `swamp`: grama mais escura e poças nas manchas longe das trilhas.
// `base`: cor do chão no lugar da grama (areia, neve, pedra...), com o grão do ladrilho de terra.
export function paintedGround(arena,{swamp=false,base=null,tint=null}={}){
 const {grass,dirt}=groundTiles(),overlay=paintOverlay(arena,swamp),b=arena.bounds,rect=overlay.rect;
 const uniforms={uGrassTile:{value:grass},uDirtTile:{value:dirt},uGroundOverlay:{value:overlay.texture},uGroundRect:{value:rect},
  uGroundBounds:{value:new THREE.Vector4(b.minX,b.minY,b.maxX,b.maxY)},uGrassTint:{value:tint?new THREE.Color(tint):swamp?new THREE.Color(.7,.72,.62):new THREE.Color(1,1,1)},uBaseColor:{value:new THREE.Color(base||'#ffffff')},uBaseMix:{value:base?1:0},uSurfaceMap:{value:arena.terrain?surfaceTexture(arena.terrain):null},uSurfaceRect:{value:terrainRect(arena.terrain)},uSurfaceSize:{value:{x:arena.terrain?.cols||1,y:arena.terrain?.rows||1}},
  uGroundDry:{value:new THREE.Color('#7f7c46')},uGroundMoss:{value:new THREE.Color('#36502a')},uPondEdge:{value:new THREE.Color('#263d3c')},uPond:{value:new THREE.Color('#304a46')}};
 const material=new THREE.MeshStandardMaterial({roughness:.95});
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='attribute vec3 aTerrain;attribute float aShore;varying vec3 vTerrain;varying float vShore;varying vec2 vGroundXZ;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vGroundXZ=(modelMatrix*vec4(transformed,1.)).xz;vTerrain=aTerrain;vShore=aShore;');
  shader.fragmentShader='uniform sampler2D uGrassTile,uDirtTile,uGroundOverlay,uSurfaceMap;uniform vec4 uGroundRect,uGroundBounds,uSurfaceRect;uniform vec2 uSurfaceSize;uniform float uBaseMix;uniform vec3 uGrassTint,uBaseColor,uGroundDry,uGroundMoss,uPondEdge,uPond;varying vec3 vTerrain;varying float vShore;varying vec2 vGroundXZ;\n'+shader.fragmentShader.replace('#include <map_fragment>',FRAGMENT);
 };
 material.customProgramCacheKey=()=>'painted-ground-v3';
 const mesh=new THREE.Mesh(arena.terrain?terrainGeometry(arena,rect):new THREE.PlaneGeometry(rect.z,rect.w).rotateX(-Math.PI/2),material);
 mesh.position.set(rect.x+rect.z/2,.004,rect.y+rect.w/2);mesh.receiveShadow=true;mesh.renderOrder=-3;
 // O renderizador esconde o chão liso, clareia este no fundo claro e o horizonte reaproveita o material além do mapa.
 mesh.userData.replacesGround=true;mesh.userData.paintedGround=true;mesh.userData.lightColor=new THREE.Color(1.3,1.3,1.25);
 const dispose=material.dispose.bind(material);material.dispose=()=>{overlay.texture.dispose();uniforms.uSurfaceMap.value?.dispose();dispose();};
 return mesh;
}
