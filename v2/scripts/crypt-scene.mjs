// Visual procedural da Cripta Esquecida: lajes, paredes de pedra, pilares, tochas e ossos em InstancedMesh.
import * as THREE from 'three';
import {family,material,mix,dummy} from './forest-scene.mjs';
const box=()=>new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
const col=hex=>new THREE.Color(hex);

export function buildCrypt(arena){
 const out=[],add=m=>{if(m)out.push(m);},solids=arena.solids,d=arena.decor,look=n=>solids.filter(s=>s.look===n);
 // Lajes do chão (3D, com espessura): a fresta entre elas é o chão escuro do renderizador.
 add(family(box(),material({color:0xffffff}),d.tiles,(t)=>{dummy.position.set(t.x,0,t.y);dummy.scale.set(t.w,.07,t.d);},{color:t=>mix(0x514c60,0x3a3646,t.tone)}));
 // Tapete cerimonial ao longo do eixo da cripta: lâmina fina acima das lajes (sem plano coplanar).
 add(family(box(),material({color:0xffffff}),d.rugs,(r)=>{dummy.position.set((r.x0+r.x1)/2,.07,r.y);dummy.scale.set(r.x1-r.x0,.025,r.w);},{color:()=>col(0x5a2230)}));

 // Paredes: cada bloco é fatiado em segmentos de ~2,2 u para dar ritmo de pedra; tampa mais clara no topo.
 const pieces=[];
 for(const s of look('wall')){const along=s.width>=s.depth,length=along?s.width:s.depth,n=Math.max(1,Math.round(length/2.2)),seg=length/n,h=s.tall?3:1;
  for(let i=0;i<n;i++){const k=(s.index*7+i*13)%10/10,jitter=s.tall?k*.35:k*.12;pieces.push({x:along?s.x-length/2+seg*(i+.5):s.x,y:along?s.y:s.y-length/2+seg*(i+.5),w:along?seg+.01:s.width,d:along?s.depth:seg+.01,h:h+jitter,tone:(s.tone+k)%1});}}
 add(family(box(),material({color:0xffffff}),pieces,(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(p.w,p.h,p.d);},{shadow:true,color:p=>mix(0x4a4658,0x34303f,p.tone)}));
 add(family(box(),material({color:0xffffff}),pieces,(p)=>{dummy.position.set(p.x,p.h,p.y);dummy.scale.set(p.w+.04,.14,p.d+.04);},{color:p=>mix(0x6a6578,0x57536a,p.tone)}));

 // Pilares com base e capitel.
 const pillars=look('pillar');
 add(family(new THREE.CylinderGeometry(.78,.92,1,10).translate(0,.5,0),material({color:0x6c687a}),pillars,(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(p.r,p.height,p.r);},{shadow:true}));
 add(family(box(),material({color:0x7b7789}),pillars,(p)=>{dummy.position.set(p.x,p.height,p.y);dummy.scale.set(p.r*2.5,.3,p.r*2.5);},{shadow:true}));
 add(family(box(),material({color:0x5c5869}),pillars,(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(p.r*2.5,.28,p.r*2.5);},{shadow:true}));
 // Sarcófagos: caixa de pedra e tampa ligeiramente deslocada.
 const tombs=look('sarcophagus');
 add(family(box(),material({color:0x6b6678}),tombs,(t)=>{dummy.position.set(t.x,0,t.y);dummy.scale.set(t.width,t.height*.7,t.depth);},{shadow:true,color:t=>mix(0x6b6678,0x58546a,t.tone)}));
 add(family(box(),material({color:0x827d92}),tombs,(t)=>{dummy.position.set(t.x+.08,t.height*.7,t.y);dummy.scale.set(t.width+.12,t.height*.3,t.depth+.1);},{shadow:true}));

 // Grades das portas seladas: moldura, barras verticais (o encontro continua visível através delas).
 const gates=look('gate'),barGeometry=new THREE.CylinderGeometry(.06,.06,1,6).translate(0,.5,0);
 add(family(box(),material({color:0x3b3a40}),gates,(g)=>{dummy.position.set(g.x,2.4,g.y);dummy.scale.set(g.width+.3,.35,g.depth+.2);},{shadow:true}));
 add(family(box(),material({color:0x3b3a40}),gates.flatMap(g=>[-1,1].map(k=>({x:g.x,y:g.y+k*(g.depth/2-.12)}))),(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(.5,2.6,.3);},{shadow:true}));
 add(family(barGeometry,material({color:0x56545c}),gates.flatMap(g=>Array.from({length:9},(_,i)=>({x:g.x,y:g.y-g.depth/2+.3+(g.depth-.6)*i/8}))),(p)=>{dummy.position.set(p.x,0,p.y);dummy.scale.set(1,2.4,1);},{shadow:true}));

 // Tochas: suporte e chama sem iluminação dinâmica (material sem iluminação, legível nos dois fundos).
 const torches=d.torches;
 add(family(box(),material({color:0x3a2c20}),torches,(t)=>{dummy.position.set(t.x+(t.face==='e'?.12:0),1.55,t.y+(t.face==='s'?.12:0));dummy.scale.set(.18,.55,.18);}));
 const flame=new THREE.ConeGeometry(.17,.55,6).translate(0,.27,0);
 add(family(flame,new THREE.MeshBasicMaterial({color:0xffb347}),torches,(t,i)=>{dummy.position.set(t.x+(t.face==='e'?.15:0),2.05,t.y+(t.face==='s'?.15:0));dummy.scale.set(1,.85+(i%3)*.12,1);}));
 add(family(new THREE.SphereGeometry(.09,6,5),new THREE.MeshBasicMaterial({color:0xfff0b0}),torches,(t)=>{dummy.position.set(t.x+(t.face==='e'?.15:0),2.12,t.y+(t.face==='s'?.15:0));}));
 // Estandartes: tecido escuro pendurado entre as tochas.
 add(family(box(),material({color:0xffffff}),d.banners,(b)=>{dummy.position.set(b.x,1,b.y+.05);dummy.scale.set(1.1,2,.06);},{color:b=>col(b.tone<.5?0x6a1f2c:0x2f2a56)}));
 add(family(box(),material({color:0xb6963e}),d.banners,(b)=>{dummy.position.set(b.x,2.02,b.y+.06);dummy.scale.set(1.2,.08,.08);}));

 // Ossos espalhados: pequenos blocos e crânios, só decoração.
 const bone=new THREE.DodecahedronGeometry(1,0),skull=new THREE.SphereGeometry(1,7,5);
 add(family(bone,material({color:0xffffff}),d.bones,(b,i)=>{dummy.position.set(b.x,.1,b.y);dummy.scale.set(b.size,b.size*.35,b.size*.6);dummy.rotation.y=i*1.9;},{color:b=>mix(0xd8d0bc,0xa59d8a,b.tone)}));
 add(family(skull,material({color:0xe8e0cc}),d.bones.filter((_,i)=>i%3===0),(b)=>{dummy.position.set(b.x+.2,.16,b.y-.15);dummy.scale.set(b.size*.55,b.size*.5,b.size*.55);}));
 return out;
}
