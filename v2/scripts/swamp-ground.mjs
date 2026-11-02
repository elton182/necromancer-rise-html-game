// Chão do pântano pintado ao carregar; trilhas e manchas vêm do mapa, sem novas áreas de dano.
import * as THREE from 'three';
export function swampGround(arena,{forest=false}={}){
 const b=arena.bounds,w=b.maxX-b.minX+24,h=b.maxY-b.minY+24,c=document.createElement('canvas');
 const resolution=2048/Math.max(w,h);c.width=Math.max(256,Math.round(w*resolution));c.height=Math.max(256,Math.round(h*resolution));
 const g=c.getContext('2d'),kx=c.width/w,ky=c.height/h,X=x=>(x-b.minX+12)*kx,Y=y=>(y-b.minY+12)*ky;
 let seed=4139;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
 g.fillStyle=forest?'#4a6038':'#35402b';g.fillRect(0,0,c.width,c.height);
 function stain(x,y,r,color){const a=g.createRadialGradient(X(x),Y(y),0,X(x),Y(y),r*kx);a.addColorStop(0,color);a.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=a;g.fillRect(X(x)-r*kx,Y(y)-r*kx,r*kx*2,r*kx*2);}
 for(let i=0;i<950;i++)stain(b.minX-12+random()*w,b.minY-12+random()*h,1+random()*4,(forest?['rgba(67,88,47,.3)','rgba(100,120,63,.35)','rgba(86,105,54,.3)']:['#202e2b','#566044','#4a4730'])[i%3]);
 for(const p of arena.decor.patches)stain(p.x,p.y,p.r*1.5,forest?(p.tone>.5?'rgba(112,126,66,.3)':'rgba(62,86,43,.22)'):(p.tone>.5?'#626342':'#20362e'));
 // Margens escuras e centro claro distinguem a trilha sem imitar avisos de perigo.
 function patch(p,scale,color){
  g.beginPath();for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=p.r*scale*(1+.09*Math.sin(a*5+p.x*.7)+.05*Math.cos(a*3+p.y));const x=X(p.x+Math.cos(a)*r),y=Y(p.y+Math.sin(a)*r);i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fillStyle=color;g.fill();
 }
 // Água estagnada fora das trilhas, sem cor tóxica nem colisão.
 for(const p of forest?[]:arena.decor.patches){
  if(arena.decor.path.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<t.r+p.r+1))continue;
  patch(p,.8,'#263d3c');patch(p,.58,'#304a46');
  g.strokeStyle='rgba(139,157,129,.2)';g.lineWidth=1;g.beginPath();g.ellipse(X(p.x),Y(p.y),p.r*kx*.42,p.r*ky*.22,-.15,0,Math.PI);g.stroke();
 }
 const paths=arena.decor.path;
 // Máscara única de terra: textura e bordas quebradas, sem círculos de cores distintas.
 const trail=document.createElement('canvas');trail.width=c.width;trail.height=c.height;const t=trail.getContext('2d');
 t.fillStyle='#fff';t.strokeStyle='#fff';t.lineCap='round';t.lineJoin='round';
 for(let i=0;i<paths.length;i++){
  const p=paths[i];t.beginPath();t.ellipse(X(p.x),Y(p.y),p.r*kx*.88,p.r*ky*.88,0,0,Math.PI*2);t.fill();
  for(let j=i+1;j<paths.length;j++){const q=paths[j];if(Math.hypot(p.x-q.x,p.y-q.y)>Math.min(p.r,q.r)*2.5)continue;
   t.lineWidth=Math.min(p.r,q.r)*1.76*kx;t.beginPath();t.moveTo(X(p.x),Y(p.y));t.lineTo(X(q.x),Y(q.y));t.stroke();}
 }
 const image=t.getImageData(0,0,trail.width,trail.height),pixels=image.data;
 // Grão de terra determinístico, sem animação.
 for(let y=0;y<trail.height;y++)for(let x=0;x<trail.width;x++){
  const i=(y*trail.width+x)*4;if(!pixels[i+3])continue;
  const grain=random(),variation=Math.sin(x*.14+y*.06)*5+Math.cos(y*.19-x*.03)*4+(grain-.5)*18;
  pixels[i]=111+variation;pixels[i+1]=94+variation;pixels[i+2]=65+variation;
  // Pequenos vazios de vegetação quebram o preenchimento uniforme.
  if(grain<.035)pixels[i+3]=60;
 }
 t.putImageData(image,0,0);g.save();g.globalAlpha=.88;g.drawImage(trail,0,0);g.restore();
 for(let i=0;i<27000;i++){const x=random()*c.width,y=random()*c.height;g.fillStyle=i%2?'rgba(190,178,125,.12)':'rgba(12,25,22,.18)';g.fillRect(x,y,1+random()*2,1);}
 for(const s of arena.solids){
  const contact=forest?'rgba(24,35,20,.18)':'rgba(12,20,17,.4)';
  if(s.kind==='box'){
   // Sombra estreita ao longo da base, sem transformar muros longos em discos escuros.
   const along=s.width>=s.depth,len=along?s.width:s.depth,r=Math.max(.45,Math.min(1,(along?s.depth:s.width)*.7)),n=Math.max(1,Math.ceil(len/(r*1.5)));
   for(let i=0;i<n;i++){const t=-len/2+(i+.5)*len/n;stain(s.x+(along?t:0),s.y+(along?0:t),r,contact);}
  }else stain(s.x,s.y,Math.max(.45,s.r*1.35),contact);
 }
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 const mat=new THREE.MeshStandardMaterial({map:texture,roughness:.83}),mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h).rotateX(-Math.PI/2),mat);
 mesh.position.set((b.minX+b.maxX)/2,.004,(b.minY+b.maxY)/2);mesh.receiveShadow=true;mesh.renderOrder=-3;mesh.userData.replacesGround=true;mesh.userData.lightColor=new THREE.Color(1.3,1.3,1.25);
 const dispose=mat.dispose.bind(mat);mat.dispose=()=>{texture.dispose();dispose();};return mesh;
}
