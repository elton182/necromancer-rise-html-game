import * as THREE from 'three';
import {kitFamily} from './village-kit.mjs';
import {patchScenery} from './scenery-fx.mjs';

// Luz e textura narrativas: entrada fria, caminho gasto e depósito acolhido pelo fogo.
export function paintCaveFloor(canvas,arena){
 const g=canvas.getContext('2d'),W=canvas.width,H=canvas.height,b=arena.bounds;
 const X=x=>(x-b.minX)/(b.maxX-b.minX)*W,Y=y=>(y-b.minY)/(b.maxY-b.minY)*H;
 g.fillStyle='#30353a';g.fillRect(0,0,W,H);
 let seed=381;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<28;i++){
  const x=random()*W,y=random()*H,r=12+random()*45,gr=g.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0,i%3?'#41423d':'#242f35');gr.addColorStop(1,'#30353a00');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);
 }
 g.strokeStyle='#68574755';g.lineWidth=14;g.lineCap='round';const paths=arena.decor.path;
 for(let i=1;i<paths.length;i++){const a=paths[i-1],p=paths[i];if(Math.hypot(a.x-p.x,a.y-p.y)>7)continue;g.beginPath();g.moveTo(X(a.x),Y(a.y));g.lineTo(X(p.x),Y(p.y));g.stroke();}
 // Trilha de cantos retos, no mesmo tom do caminho gasto.
 g.fillStyle='#68574755';for(const q of arena.decor.pathBoxes||[]){const c=Math.cos(q.angle),n=Math.sin(q.angle);g.beginPath();[[-q.w/2,-q.d/2],[q.w/2,-q.d/2],[q.w/2,q.d/2],[-q.w/2,q.d/2]].forEach(([a,e],i)=>{const x=X(q.x+a*c+e*n),y=Y(q.y-a*n+e*c);i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();g.fill();}
 // Pequenas marcas desencontradas sugerem botas e carga arrastada.
 g.fillStyle='#211e1b75';for(let y=17;y>=-20;y-=1.35){const x=Math.sin(y*.6)*.25;g.fillRect(X(x-.26),Y(y),2,3);g.fillRect(X(x+.15),Y(y-.55),2,3);}
 for(let i=0;i<6500;i++){g.fillStyle=random()>.5?'#928575':'#11191e';g.globalAlpha=.05+random()*.12;g.fillRect(random()*W,random()*H,1+random()*2,1+random()*2);}g.globalAlpha=1;
}
export function buildCaveHideout(arena,models){
 const out=[],kit=models.caveHideoutKit,misc=name=>arena.decor.misc.filter(m=>m.look===name);
 if(kit){
  for(const [look,part,w,d,h] of [['hideout-table','hideout_table',1.8,1.1,1],['hideout-cargo','hideout_cargo',2,1.5,1.6]])
   out.push(...kitFamily(kit,part,arena.solids.filter(s=>s.look===look).map(s=>({x:s.x,z:s.y,sx:s.width/w,sy:s.height/h,sz:s.depth/d}))));
  for(const part of ['hideout_bedroll','cave_support'])for(const m of kitFamily(kit,part,misc(part).map(p=>({x:p.x,z:p.y,sx:p.size,sy:p.size,sz:p.size})))){if(part==='cave_support')patchScenery(m.material);out.push(m);}
  out.push(...kitFamily(kit,'cave_spire',arena.solids.filter(s=>s.look==='cave-spire').map(s=>({x:s.x,z:s.y,sx:s.r/.55,sy:s.height/1.6,sz:s.r/.55}))));
 }
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),grad=g.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'#ffffff');grad.addColorStop(.4,'#ffffff88');grad.addColorStop(1,'#ffffff00');g.fillStyle=grad;g.fillRect(0,0,64,64);
 const texture=new THREE.CanvasTexture(c),pool=(x,y,size,color,opacity)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:texture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));m.rotation.x=-Math.PI/2;m.position.set(x,.03,y);out.push(m);return m;};
 for(const b of arena.decor.braziers){const light=pool(b.x,b.y,7,0xe1a45d,.24);light.userData.caveGlow=true;light.userData.glowPhase=b.x+b.y;}
 for(const t of arena.solids.filter(s=>s.look==='hideout-table'))pool(t.x-.64,t.y-.25,4.5,0xe8b16b,.18);
 for(const p of misc('fall_debris')){
  pool(p.x,p.y,7,0xabc8e6,.26);
  const beam=new THREE.Mesh(new THREE.ConeGeometry(1.9,6,24,1,true),new THREE.MeshBasicMaterial({color:0xb9d2e1,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));beam.position.set(p.x,3,p.y);out.push(beam);
 }
 return out;
}
