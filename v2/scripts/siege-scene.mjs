import * as THREE from 'three';
import {CORE,LANES,PADS,TOWERS} from './siege-model.mjs';
// Somente marcas planas. Obelisco e torres são GLBs animados do Blender.
export function buildSiege(){
 const group=new THREE.Group(),add=o=>{group.add(o);return o;};
 // Pavimento quebrado e trilhas são marcas planas, sem colisão.
 const paving=[];let seed=17;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<260;i++){const x=rand()*46-23,y=rand()*40-23,r=.22+rand()*.65;for(let n=0;n<5;n++){const a=n/5*Math.PI*2,b=(n+1)/5*Math.PI*2;paving.push(x,.012,y,x+Math.cos(a)*r,.012,y+Math.sin(a)*r,x+Math.cos(b)*r,.012,y+Math.sin(b)*r);}}
 const pavement=new THREE.BufferGeometry();pavement.setAttribute('position',new THREE.Float32BufferAttribute(paving,3));add(new THREE.Mesh(pavement,new THREE.MeshBasicMaterial({color:0xc0b59a,transparent:true,opacity:.12,side:THREE.DoubleSide})));
 const ring=(x,y,r,color)=>{const m=new THREE.Mesh(new THREE.RingGeometry(r-.08,r,48),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(x,.035,y);add(m);};
 for(const lane of LANES){const color=TOWERS[lane.resist].color;
  const points=lane.points.map(p=>new THREE.Vector3(p.x,.022,p.y));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color,dashSize:.6,gapSize:.35}));line.computeLineDistances();add(line);
  for(let i=1;i<lane.points.length;i++){const a=lane.points[i-1],b=lane.points[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);for(let s=2;s<d;s+=3){const x=a.x+dx*s/d,y=a.y+dy*s/d,v=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x-dx/d*.45-dy/d*.3,.025,y-dy/d*.45+dx/d*.3),new THREE.Vector3(x,.025,y),new THREE.Vector3(x-dx/d*.45+dy/d*.3,.025,y-dy/d*.45-dx/d*.3)]),new THREE.LineBasicMaterial({color}));add(v);}}
  ring(lane.points[0].x,lane.points[0].y,1.4,color);
 }
 ring(CORE.x,CORE.y,2.1,'#b59ce9');ring(CORE.x,CORE.y,2.45,'#a5d8ca');
 for(const p of PADS){ring(p.x,p.y,1.1,'#d6c38a');const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#101713';ctx.beginPath();ctx.arc(64,64,57,0,Math.PI*2);ctx.fill();ctx.font='bold 76px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f4dfa3';ctx.fillText(String(p.id),64,65);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(p.x,.04,p.y+1.5);add(m);}
 return group.children.slice();
}
