// Peças de acampamento militar compartilhadas por mapas (Trilha dos Vigias, Posto do Capitão).
import * as THREE from 'three';
import {family,material,mix,dummy} from './forest-scene.mjs';
const box=()=>new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
const col=hex=>new THREE.Color(hex);
const TENTS=[0xa68b5b,0x7a4a3a,0x58604a],wood=0x5b3f27;
const post=new THREE.CylinderGeometry(.08,.1,1,6).translate(0,.5,0),roof=new THREE.ConeGeometry(Math.SQRT1_2,1,4).rotateY(Math.PI/4).translate(0,.5,0);
const flame=new THREE.ConeGeometry(.2,.6,6).translate(0,.3,0),glow=new THREE.MeshBasicMaterial({color:0xffb347});
// Torres: `d.towers` = [{x,y,height}].
export function buildTowers(add,d){
 // Torres de vigia: quatro pernas, plataforma, cabine e telhado de quatro águas.
 const legs=d.towers.flatMap(t=>[[-1,-1],[1,-1],[-1,1],[1,1]].map(([a,b])=>({x:t.x+a*1.2,y:t.y+b*1.2,h:t.height*.72})));
 add(family(post,material({color:wood}),legs,(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(2.2,p.h,2.2);}));
 add(family(box(),material({color:0x6b4a2f}),d.towers,(t)=>{dummy.position.set(t.x,t.height*.72,t.y);dummy.scale.set(3.4,.25,3.4);},{shadow:true}));
 add(family(box(),material({color:0x7d5a37}),d.towers,(t)=>{dummy.position.set(t.x,t.height*.72+.25,t.y);dummy.scale.set(2.5,1.7,2.5);},{shadow:true}));
 add(family(roof,material({color:0x6a3a2c}),d.towers,(t)=>{dummy.position.set(t.x,t.height*.72+1.95,t.y);dummy.scale.set(3.8,1.4,3.8);},{shadow:true}));
 add(family(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffd58a}),d.towers,(t)=>{dummy.position.set(t.x,t.height*.72+1.1,t.y+1.26);dummy.scale.set(.8,.6,.1);}));
}
// Acampamento: `d.tents`, `d.camp.fires`, `d.camp.banners` e `d.palisade`.
export function buildCamp(add,d){
 // Acampamento: tendas, fogueiras, estandartes e paliçada com portão ao fim da trilha.
 add(family(roof,material({color:0xffffff}),d.tents,(t)=>{dummy.position.set(t.x,0,t.y);dummy.scale.set(t.size*1.6,t.size,t.size*1.3);},{shadow:true,color:t=>col(TENTS[Math.min(2,Math.floor(t.tone*3))])}));
 const fires=d.camp.fires;
 add(family(flame,glow,fires,(f,i)=>{dummy.position.set(f.x,.2,f.y);dummy.scale.set(1,1+(i%2)*.2,1);}));
 add(family(box(),material({color:0x3a2a1c}),fires.flatMap(f=>[0,Math.PI/2].map(r=>({...f,r}))),(f)=>{dummy.position.set(f.x,0,f.y);dummy.rotation.y=f.r+.4;dummy.scale.set(.9,.14,.16);}));
 add(family(new THREE.DodecahedronGeometry(.16,0),material({color:0x78766d}),fires.flatMap(f=>Array.from({length:7},(_,i)=>({x:f.x+Math.cos(i*.9)*.55,y:f.y+Math.sin(i*.9)*.55}))),(p)=>{dummy.position.set(p.x,.1,p.y);}));
 add(family(post,material({color:wood}),d.camp.banners,(b)=>{dummy.position.set(b.x,0,b.y);dummy.scale.set(1.5,4.4,1.5);},{shadow:true}));
 add(family(box(),material({color:0xffffff}),d.camp.banners,(b)=>{dummy.position.set(b.x+.55,2.2,b.y);dummy.scale.set(1.1,1.9,.06);},{color:b=>col(b.tone<.5?0x7a2530:0x2f3a63)}));
 const logs=d.palisade;
 add(family(new THREE.CylinderGeometry(.32,.36,1,7).translate(0,.5,0),material({color:0x6a4a31}),logs,(l)=>{dummy.position.set(l.x,0,l.y);dummy.scale.set(1,l.height,1);},{shadow:true,color:(l,i)=>mix(0x6a4a31,0x4d3524,(i*.37)%1)}));
 add(family(new THREE.ConeGeometry(.33,.7,7).translate(0,.35,0),material({color:0x7a5a3c}),logs,(l)=>{dummy.position.set(l.x,l.height,l.y);}));
}
