// Visual procedural do Posto do Capitão: paliçada, torres, tendas, plataforma do chefe e mobiliário militar.
// Peças de acampamento compartilhadas com a Trilha dos Vigias vêm de camp-parts.mjs.
import * as THREE from 'three';
import {buildForest,family,material,mix,dummy} from './forest-scene.mjs';
import {buildTowers,buildCamp} from './camp-parts.mjs';
const box=()=>new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
const col=hex=>new THREE.Color(hex);
const flat=()=>material({color:0xffffff,flatShading:false,depthTest:false,depthWrite:false});

export function buildOutpost(arena){
 const out=[],add=m=>{if(m)out.push(m);},d=arena.decor,solids=arena.solids,look=n=>solids.filter(s=>s.look===n);
 const post=new THREE.CylinderGeometry(.08,.1,1,6).translate(0,.5,0),flame=new THREE.ConeGeometry(.22,.65,6).translate(0,.32,0),glow=new THREE.MeshBasicMaterial({color:0xffa83a});
 // Chão de terra pisada: manchas planas em ordem fixa, palha, pedrinhas e a plataforma do chefe.
 const disc=new THREE.CircleGeometry(1,18).rotateX(-Math.PI/2);
 add(family(disc,flat(),d.patches,(p,i)=>{dummy.position.set(p.x,.014,p.y);dummy.scale.set(p.r,1,p.r*.8);dummy.rotation.y=i;},{order:-2,color:p=>mix(0x3a352b,0x6d6350,p.tone)}));
 add(family(new THREE.ConeGeometry(.06,1,4).translate(0,.5,0),material({color:0xffffff}),d.straw,(s,i)=>{dummy.position.set(s.x,0,s.y);dummy.scale.set(1,s.height,1);dummy.rotation.set(Math.sin(i)*.3,i,0);},{color:s=>mix(0x8a7a4a,0xc2ad6a,s.tone)}));
 add(family(new THREE.DodecahedronGeometry(1,0),material({color:0xffffff}),d.pebbles,(p,i)=>{dummy.position.set(p.x,.03,p.y);dummy.scale.set(p.size,p.size*.5,p.size);dummy.rotation.y=i;},{color:p=>mix(0x7a766c,0x55524a,p.tone)}));
 const dais=[d.dais];
 add(family(new THREE.CylinderGeometry(1.1,1.12,1,28).translate(0,.5,0),material({color:0x5c5448}),dais,(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(p.r+.7,.12,p.r+.7);},{shadow:true}));
 add(family(new THREE.CylinderGeometry(1,1.02,1,28).translate(0,.5,0),material({color:0x6f6558}),dais,(p)=>{dummy.position.set(p.x,.12,p.y);dummy.scale.set(p.r,.12,p.r);},{shadow:true}));
 // Anel de runas avermelhado sobre a plataforma (sem coplanaridade: .02 acima do topo).
 add(family(new THREE.RingGeometry(.86,.92,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x8a2434}),dais,(p)=>{dummy.position.set(p.x,.26,p.y);dummy.scale.set(p.r,1,p.r);}));
 // Portão da paliçada ao norte: dois mastros, travessa e batentes fechados.
 const g=d.gate;
 add(family(post,material({color:0x4d3524}),[{x:-2.4},{x:2.4}],(p)=>{dummy.position.set(p.x,0,g.y);dummy.scale.set(4.5,5.6,4.5);},{shadow:true}));
 add(family(box(),material({color:0x4d3524}),[{}],()=>{dummy.position.set(0,5.2,g.y);dummy.scale.set(5.6,.5,.5);},{shadow:true}));
 add(family(box(),material({color:0x7a5a3a}),[-1,1].map(k=>({k})),(p)=>{dummy.position.set(p.k*1.1,0,g.y);dummy.scale.set(2.1,3.6,.3);},{shadow:true,color:(p,i)=>mix(0x7a5a3a,0x6a4a2e,i*.5)}));
 // Tendas já vêm dos colisores; fogueiras, braseiros, caixotes, estantes de armas, carroça, feno e barris.
 const braziers=look('brazier');
 add(family(post,material({color:0x3d352e}),braziers,(b)=>{dummy.position.set(b.x,0,b.y);dummy.scale.set(2.2,b.height-.35,2.2);},{shadow:true}));
 add(family(new THREE.CylinderGeometry(.42,.2,.3,8).translate(0,.15,0),material({color:0x4a4038}),braziers,(b)=>{dummy.position.set(b.x,b.height-.35,b.y);},{shadow:true}));
 add(family(flame,glow,braziers,(b,i)=>{dummy.position.set(b.x,b.height-.05,b.y);dummy.scale.set(1,1+(i%2)*.25,1);}));
 add(family(box(),material({color:0xffffff}),look('crate'),(c)=>{dummy.position.set(c.x,0,c.y);dummy.scale.set(c.width,c.height,c.depth);dummy.rotation.y=c.x*.7;},{shadow:true,color:c=>mix(0x7a5a38,0x8a6a42,c.height%1)}));
 const racks=look('rack');
 add(family(box(),material({color:0x5b3f27}),racks,(r)=>{dummy.position.set(r.x,0,r.y);dummy.scale.set(r.width,.9,r.depth);},{shadow:true}));
 add(family(post,material({color:0x7a7a82}),racks.flatMap(r=>Array.from({length:5},(_,i)=>({x:r.x-r.width/2+.3+i*(r.width-.6)/4,y:r.y}))),(p)=>{dummy.position.set(p.x,.3,p.y);dummy.rotation.z=.12;dummy.scale.set(1.1,1.8,1.1);},{shadow:true}));
 const wagon=look('wagon');
 add(family(box(),material({color:0x6a4a31}),wagon,(w)=>{dummy.position.set(w.x,.45,w.y);dummy.scale.set(w.width,.65,w.depth);},{shadow:true}));
 add(family(new THREE.CylinderGeometry(.5,.5,.12,12).rotateX(Math.PI/2).translate(0,.5,0),material({color:0x3e2b1c}),wagon.flatMap(w=>[[-1,-1],[1,-1],[-1,1],[1,1]].map(([a,b])=>({x:w.x+a*(w.width/2-.5),y:w.y+b*(w.depth/2+.05)}))),(p)=>{dummy.position.set(p.x,0,p.y);},{shadow:true}));
 add(family(new THREE.SphereGeometry(1,8,6),material({color:0xc2ad6a}),look('hay'),(h)=>{dummy.position.set(h.x,h.height*.45,h.y);dummy.scale.set(h.r,h.height*.55,h.r);},{shadow:true}));
 add(family(new THREE.CylinderGeometry(.82,1,1,10).translate(0,.5,0),material({color:0x6e4a2c}),look('barrel'),(b)=>{dummy.position.set(b.x,0,b.y);dummy.scale.set(b.r,b.height,b.r);},{shadow:true}));
 buildTowers(add,d);buildCamp(add,d);
 // Mata de fundo ao norte e a oeste (fora da paliçada).
 for(const o of buildForest({solids:[],decor:{trees:d.trees,bushes:[],grass:[],flowers:[],patches:[],path:[],mushrooms:[]},autumn:true}))add(o);
 return out;
}
