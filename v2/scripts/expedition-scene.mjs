// Visual procedural da Expedição: vegetação, rochas e trilha vêm de buildForest; aqui entram os adereços por bioma.
// Tudo com geometria simples e sem luzes dinâmicas; é cenário provisório (acabamento na E11).
import * as THREE from 'three';
import {buildForest,family,material,mix,dummy} from './forest-scene.mjs';
const box=()=>new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
const post=new THREE.CylinderGeometry(1,1,1,8).translate(0,.5,0);
export function buildExpedition(arena){
 const out=[...buildForest(arena)],add=m=>{if(m)out.push(m);},look=name=>arena.solids.filter(s=>s.look===name),misc=name=>arena.decor.misc.filter(m=>m.look===name);
 // Casas: caixa e telhado de quatro águas, dentro do raio de colisão.
 const houses=look('house');
 add(family(box(),material({color:0xffffff}),houses,h=>{dummy.position.set(h.x,0,h.y);dummy.scale.set(3.2,h.height*.8,3.2);},{shadow:true,color:h=>mix(0x9a8466,0xb89a70,h.tone)}));
 add(family(new THREE.ConeGeometry(Math.SQRT1_2,1,4).rotateY(Math.PI/4).translate(0,.5,0),material({color:0xffffff}),houses,h=>{dummy.position.set(h.x,h.height*.8,h.y);dummy.scale.set(4.2,1.4,4.2);},{shadow:true,color:h=>mix(0x7a3a2c,0x9a4c36,h.tone)}));
 add(family(post,material({color:0xc9c1ad}),look('column'),(c,i)=>{dummy.position.set(c.x,0,c.y);dummy.scale.set(c.r,c.height*(i%3?1:.6),c.r);},{shadow:true}));
 add(family(post,material({color:0x4f8a46}),look('cactus'),c=>{dummy.position.set(c.x,0,c.y);dummy.scale.set(c.r*.7,c.height,c.r*.7);},{shadow:true}));
 add(family(new THREE.ConeGeometry(1,1,5).translate(0,.5,0),material({color:0xb7dcef,flatShading:true}),look('ice'),(c,i)=>{dummy.position.set(c.x,0,c.y);dummy.scale.set(c.r*1.1,c.height,c.r*1.1);dummy.rotation.y=i;},{shadow:true}));
 add(family(box(),material({color:0x8d8770}),look('ruin'),(c,i)=>{dummy.position.set(c.x,0,c.y);dummy.scale.set(c.r*2,c.height*(i%2?1:.6),c.r*1.6);dummy.rotation.y=i;},{shadow:true}));
 // Sem colisão: lápides, caveiras, barris e caixas.
 add(family(box(),material({color:0x77777f}),misc('tomb'),(m,i)=>{dummy.position.set(m.x,0,m.y);dummy.scale.set(.8*m.size,.9*m.size,.25);dummy.rotation.set(m.tilt*.2,i,0);},{shadow:true}));
 add(family(new THREE.SphereGeometry(.14,6,5),material({color:0xe8e2cc}),misc('skulls'),m=>{dummy.position.set(m.x,.12,m.y);}));
 add(family(post,material({color:0x6a4a2b}),misc('barrel'),m=>{dummy.position.set(m.x,0,m.y);dummy.scale.set(.36,.8,.36);},{shadow:true}));
 add(family(box(),material({color:0x8a6a3c}),misc('crate'),(m,i)=>{dummy.position.set(m.x,0,m.y);dummy.scale.set(.75,.7,.75);dummy.rotation.y=i;},{shadow:true}));
 // Rio: discos de água achatados sobre o chão (sem teste de profundidade, como a trilha).
 add(family(new THREE.CircleGeometry(1,16).rotateX(-Math.PI/2),material({color:0x487d87,flatShading:false,depthTest:false,depthWrite:false}),arena.decor.water,w=>{dummy.position.set(w.x,.02,w.y);dummy.scale.set(w.r,1,w.r);},{order:-1}));
 // Brasas: poste e chama sem iluminação dinâmica.
 add(family(post,material({color:0x3d352e}),arena.decor.braziers,b=>{dummy.position.set(b.x,0,b.y);dummy.scale.set(.1,1.2,.1);},{shadow:true}));
 add(family(new THREE.ConeGeometry(.28,.7,6).translate(0,.35,0),new THREE.MeshBasicMaterial({color:0xffa94d}),arena.decor.braziers,b=>{dummy.position.set(b.x,1.2,b.y);}));
 return out;
}
