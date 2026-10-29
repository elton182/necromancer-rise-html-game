// Visual procedural da Vila de Eldrin: casas, ruas, praça e mobiliário em InstancedMesh.
// Árvores, rochas, grama e flores vêm de buildForest, que lê os mesmos campos `look`/`decor`.
import * as THREE from 'three';
import {buildForest,family,material,mix,dummy} from './forest-scene.mjs';
const WALLS=[0xd9cba9,0xcbb88f,0xc2ad88,0xd3c4a0],ROOFS=[0x8a4b3a,0x6b4a3a,0x7a3f33,0x59604f],at=(list,t)=>list[Math.min(list.length-1,Math.floor(t*list.length))];
const box=()=>new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
// Camadas planas sem teste de profundidade: ordem fixa, sem z-fighting com o chão ou entre si.
const flat=()=>material({color:0xffffff,flatShading:false,depthTest:false,depthWrite:false});

export function buildVillage(arena){
 const out=[],add=m=>{if(m)out.push(m);},solids=arena.solids,look=name=>solids.filter(s=>s.look===name);
 // Chão: ruas e praça são planos achatados acima do terreno (polygonOffset evita cintilação).
 const plane=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),disc=new THREE.CircleGeometry(1,40).rotateX(-Math.PI/2);
 add(family(plane,flat(),arena.roads,(r,i)=>{dummy.position.set((r.x0+r.x1)/2,.016+i*.0006,(r.y0+r.y1)/2);dummy.scale.set(r.x1-r.x0,1,r.y1-r.y0);},{order:-2,color:r=>new THREE.Color(r.kind==='cobble'?0x7b7468:0x7d6643)}));
 add(family(disc,flat(),[arena.plaza],(p)=>{dummy.position.set(p.x,.024,p.y);dummy.scale.set(p.r,1,p.r);},{order:-1,color:()=>new THREE.Color(0x877f70)}));
 const stoneGeometry=new THREE.DodecahedronGeometry(1,0);
 add(family(stoneGeometry,material({color:0xffffff}),arena.decor.stones,(s,i)=>{dummy.position.set(s.x,.03,s.y);dummy.scale.set(s.size,s.size*.18,s.size*.85);dummy.rotation.y=i*1.7;},{color:s=>s.tone>1?new THREE.Color(0xb7aea0):mix(0x9a9283,0x6c675c,s.tone)}));

 // Casas: base de pedra, parede de reboco, telhado de quatro águas, porta e janelas na face sul.
 const houses=look('house');
 add(family(box(),material({color:0xffffff}),houses,(h)=>{dummy.position.set(h.x,0,h.y);dummy.scale.set(h.width+.12,.4,h.depth+.12);},{shadow:true,color:()=>new THREE.Color(0x6f6a60)}));
 add(family(box(),material({color:0xffffff}),houses,(h)=>{dummy.position.set(h.x,.4,h.y);dummy.scale.set(h.width,h.height-.4,h.depth);},{shadow:true,color:h=>new THREE.Color(at(WALLS,h.tone))}));
 const roof=new THREE.ConeGeometry(Math.SQRT1_2,1,4).rotateY(Math.PI/4).translate(0,.5,0);
 add(family(roof,material({color:0xffffff}),houses,(h)=>{const rise=Math.min(h.width,h.depth)*.42+.7;dummy.position.set(h.x,h.height,h.y);dummy.scale.set(h.width*1.16,rise,h.depth*1.16);},{shadow:true,color:h=>new THREE.Color(at(ROOFS,(h.tone*1.7)%1))}));
 add(family(box(),material({color:0x6a6258}),houses.filter(h=>h.chimney),(h)=>{dummy.position.set(h.x+h.width*.25,h.height,h.y-h.depth*.15);dummy.scale.set(.55,1.9,.55);},{shadow:true}));
 const doors=houses.map(h=>({x:h.x+(h.inn?-1.6:0),y:h.y+h.depth/2+.03,w:h.inn?1.4:1.05,tall:h.inn?2.1:1.8}));
 add(family(box(),material({color:0x4a3322}),doors,(d)=>{dummy.position.set(d.x,0,d.y);dummy.scale.set(d.w,d.tall,.14);}));
 // Janelas acesas: material sem iluminação, para ler à noite e no fundo claro.
 const windows=houses.flatMap(h=>{const n=h.inn?4:2,list=[];for(let i=0;i<n;i++){const span=h.width-1.6,x=h.x-span/2+span*(n===1?.5:i/(n-1));if(Math.abs(x-(h.x+(h.inn?-1.6:0)))<1.2)continue;list.push({x,y:h.y+h.depth/2+.03,z:h.height*.55,face:'s'});}list.push({x:h.x+h.width/2+.03,y:h.y,z:h.height*.55,face:'e'});return list;});
 add(family(box(),new THREE.MeshBasicMaterial({color:0xffd58a}),windows,(w)=>{dummy.position.set(w.x,w.z-.35,w.y);if(w.face==='s')dummy.scale.set(.7,.7,.12);else dummy.scale.set(.12,.7,.7);}));

 // Barracas do mercador: balcão, quatro postes e toldo inclinado.
 const stalls=look('stall');
 add(family(box(),material({color:0x7a5535}),stalls,(s)=>{dummy.position.set(s.x,0,s.y+.15);dummy.scale.set(s.width-.2,.95,s.depth*.55);},{shadow:true}));
 const post=new THREE.CylinderGeometry(.07,.07,1,6).translate(0,.5,0);
 add(family(post,material({color:0x5b3f27}),stalls.flatMap(s=>[[-1,-1],[1,-1],[-1,1],[1,1]].map(([dx,dz])=>({x:s.x+dx*(s.width/2-.1),y:s.y+dz*(s.depth/2-.1),h:s.height}))),(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(1,p.h,1);},{shadow:true}));
 add(family(box(),material({color:0xffffff}),stalls,(s)=>{dummy.position.set(s.x,s.height,s.y);dummy.rotation.x=-.14;dummy.scale.set(s.width+.3,.12,s.depth+.5);},{shadow:true,color:s=>new THREE.Color(s.tone<.5?0xa23a35:0x3a6a8a)}));
 add(family(new THREE.SphereGeometry(.18,6,5),material({color:0xffffff}),stalls.flatMap(s=>[-1,-.5,0,.5,1].map((k,i)=>({x:s.x+k*(s.width/2-.45),y:s.y+.15,tone:(i*.37+s.tone)%1}))),(p)=>{dummy.position.set(p.x,1.1,p.y);},{color:p=>new THREE.Color([0xc65b3a,0xd8b04a,0x7ca04a,0xc9a078][Math.floor(p.tone*4)%4])}));

 // Poço: anel de pedra, água escura e telhadinho sobre dois postes.
 const wells=look('well');
 add(family(new THREE.CylinderGeometry(1,1.06,1,12).translate(0,.5,0),material({color:0x8b877b}),wells,(w)=>{dummy.position.set(w.x,0,w.y);dummy.scale.set(w.r,w.height,w.r);},{shadow:true}));
 add(family(disc,material({color:0x1e3e4a,flatShading:false}),wells,(w)=>{dummy.position.set(w.x,w.height+.01,w.y);dummy.scale.set(w.r*.72,1,w.r*.72);}));
 add(family(post,material({color:0x5b3f27}),wells.flatMap(w=>[-1,1].map(k=>({x:w.x+k*w.r*.85,y:w.y,h:2.3}))),(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(1.3,p.h,1.3);},{shadow:true}));
 add(family(roof,material({color:0x7a3f33}),wells,(w)=>{dummy.position.set(w.x,2.25,w.y);dummy.scale.set(w.r*2.6,.75,w.r*1.6);},{shadow:true}));

 // Quadro de avisos, pilares do portal, postes de luz, cercas e caixotes.
 const boards=look('board');
 add(family(box(),material({color:0x5b3f27}),boards,(b)=>{dummy.position.set(b.x,0,b.y);dummy.scale.set(b.width,b.height,.12);},{shadow:true}));
 add(family(box(),material({color:0xe4d4a5}),boards.flatMap(b=>[-.4,.3].map(k=>({x:b.x+k*b.width*.5,y:b.y+.08,z:b.height*(k<0?.62:.5)}))),(p)=>{dummy.position.set(p.x,p.z,p.y);dummy.scale.set(.5,.45,.03);}));
 const pillars=look('pillar');
 add(family(new THREE.CylinderGeometry(.82,1,1,8).translate(0,.5,0),material({color:0x8a8579}),pillars,(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(p.r,p.height,p.r);},{shadow:true}));
 add(family(box(),material({color:0x9a958a}),pillars,(p)=>{dummy.position.set(p.x,p.height,p.y);dummy.scale.set(p.r*2.5,.28,p.r*2.5);},{shadow:true}));
 const lamps=look('lamp');
 add(family(post,material({color:0x3d352e}),lamps,(l)=>{dummy.position.set(l.x,0,l.y);dummy.scale.set(1.4,l.height,1.4);},{shadow:true}));
 add(family(new THREE.SphereGeometry(.22,8,6),new THREE.MeshBasicMaterial({color:0xffd070}),lamps,(l)=>{dummy.position.set(l.x,l.height+.1,l.y);}));
 const fences=look('fence');
 add(family(box(),material({color:0x735234}),fences.flatMap(f=>[.2,.45].map(z=>({...f,z}))),(f)=>{dummy.position.set(f.x,f.z,f.y);dummy.scale.set(f.width,.07,f.depth);},{shadow:true}));
 add(family(post,material({color:0x5b3f27}),fences.flatMap(f=>{const along=f.width>f.depth,length=along?f.width:f.depth,n=Math.max(2,Math.round(length/1.4)+1);return Array.from({length:n},(_,i)=>({x:along?f.x-length/2+length*i/(n-1):f.x,y:along?f.y:f.y-length/2+length*i/(n-1)}));}),(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(1.2,.68,1.2);},{shadow:true}));
 add(family(box(),material({color:0xffffff}),look('crate'),(c)=>{dummy.position.set(c.x,0,c.y);dummy.scale.set(c.width,c.height,c.depth);dummy.rotation.y=c.x;},{shadow:true,color:c=>new THREE.Color(c.height>.7?0x8a6a42:0x7a5a38)}));
 add(family(new THREE.CylinderGeometry(.82,1,1,10).translate(0,.5,0),material({color:0x6e4a2c}),look('barrel'),(b)=>{dummy.position.set(b.x,0,b.y);dummy.scale.set(b.r,b.height,b.r);},{shadow:true}));
 for(const o of buildForest(arena))add(o);
 return out;
}
