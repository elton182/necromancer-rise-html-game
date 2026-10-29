// Visual procedural da Trilha dos Vigias: mata outono, cerca, lanternas, torres, barricadas e acampamento.
// Vegetação, rochas, grama e trilha vêm de buildForest (`arena.autumn` troca a paleta das copas).
import * as THREE from 'three';
import {buildForest,family,material,mix,dummy} from './forest-scene.mjs';
import {buildTowers,buildCamp} from './camp-parts.mjs';
const box=()=>new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
const col=hex=>new THREE.Color(hex);

export function buildTrail(arena){
 const out=[],add=m=>{if(m)out.push(m);},d=arena.decor,wood=0x5b3f27;
 const post=new THREE.CylinderGeometry(.08,.1,1,6).translate(0,.5,0);
 const glow=new THREE.MeshBasicMaterial({color:0xffb347});
 // Cerca de estacas ao sul: dois trilhos baixos e dois postes por segmento.
 add(family(box(),material({color:0x735234}),d.fences.flatMap(f=>[.22,.5].map(z=>({...f,z}))),(f)=>{dummy.position.set(f.x,f.z,f.y);dummy.scale.set(f.w,.07,.1);},{shadow:true}));
 add(family(post,material({color:wood}),d.fences.flatMap(f=>[-1,1].map(k=>({x:f.x+k*f.w/2,y:f.y}))),(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(1.2,.72,1.2);},{shadow:true}));
 // Lanternas ao longo da borda norte: poste, braço e luz sem iluminação dinâmica.
 add(family(post,material({color:0x3d352e}),d.lanterns,(l)=>{dummy.position.set(l.x,0,l.y);dummy.scale.set(1.4,2.7,1.4);},{shadow:true}));
 add(family(new THREE.SphereGeometry(.2,8,6),glow,d.lanterns,(l)=>{dummy.position.set(l.x,2.75,l.y+.25);}));
 buildTowers(add,d);
 // Barricadas das emboscadas (solids com look 'barricade'): toras empilhadas e estacas inclinadas para os dois lados.
 const barricades=arena.solids.filter(s=>s.look==='barricade'),logGeometry=new THREE.CylinderGeometry(.24,.24,1,8);
 add(family(logGeometry,material({color:0x6a4a31}),barricades.flatMap(b=>[.28,.7].map(z=>({...b,z}))),(b)=>{dummy.position.set(b.x,b.z,b.y);dummy.rotation.set(Math.PI/2,0,0);dummy.scale.set(1,b.depth,1);},{shadow:true}));
 const spikes=barricades.flatMap(b=>Array.from({length:8},(_,i)=>({x:b.x,y:b.y-b.depth/2+.4+(b.depth-.8)*i/7,k:i%2?-1:1})));
 add(family(new THREE.ConeGeometry(.13,1.5,5).translate(0,.75,0),material({color:0x8a6a45}),spikes,(s)=>{dummy.position.set(s.x,.25,s.y);dummy.rotation.set(0,0,-s.k*.55);},{shadow:true}));
 buildCamp(add,d);
 add(family(post,material({color:0x4d3524}),[{y:-2.6},{y:2.6}],(p)=>{dummy.position.set(150.2,0,p.y);dummy.scale.set(4,6.2,4);},{shadow:true}));
 add(family(box(),material({color:0x4d3524}),[{y:0}],()=>{dummy.position.set(150.2,5.6,0);dummy.scale.set(.5,.5,6.4);},{shadow:true}));
 for(const o of buildForest(arena))add(o);
 return out;
}
