// Visual procedural da Floresta de Eldrin. Cada família é um InstancedMesh: poucas chamadas de desenho.
import * as THREE from 'three';
export const FOREST_PALETTE={
 dark:{ground:0x2c4a2f,background:0x13201a},
 light:{ground:0x86a266,background:0x8ea98a}
};
// Paleta por tema de cenário; o renderizador escolhe pelo `arena.theme`.
export const THEME_PALETTE={forest:FOREST_PALETTE,village:{dark:{ground:0x3c5135,background:0x172026},light:{ground:0x93a773,background:0x8da08b}},outpost:{dark:{ground:0x3d392f,background:0x14140f},light:{ground:0x9a907a,background:0x8c8c80}},trail:{dark:{ground:0x38442a,background:0x151c18},light:{ground:0x9a9a62,background:0x8f9a84}},crypt:{dark:{ground:0x15131b,background:0x0b0a10},light:{ground:0x5b5766,background:0x6b6874}}};
export const dummy=new THREE.Object3D(),tint=new THREE.Color();
// `order` negativo: camada plana sem teste de profundidade, desenhada na ordem das instâncias (evita z-fighting entre discos coplanares).
export function family(geometry,material,items,place,{shadow=false,color,order}={}){
 if(!items.length)return null;
 const mesh=new THREE.InstancedMesh(geometry,material,items.length);
 items.forEach((item,i)=>{dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);place(item,i);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(color)mesh.setColorAt(i,color(item,i));});
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.castShadow=shadow;mesh.receiveShadow=true;if(order!==undefined)mesh.renderOrder=order;return mesh;
}
export const mix=(a,b,t)=>tint.set(a).lerp(new THREE.Color(b),t).clone();
export const material=(extra={})=>new THREE.MeshStandardMaterial({roughness:1,flatShading:true,...extra});
const tall=(s,i)=>s.height*(.92+i%3*.05);

// `arena` vem de forestArena(); devolve os objetos que o renderizador deve adicionar à cena.
export function buildForest(arena){
 const out=[],add=m=>{if(m)out.push(m);};
 const solids=arena.solids,d=arena.decor,au=!!arena.autumn;/* outono: copas, arbustos e grama em tons quentes */
 const trunkGeometry=new THREE.CylinderGeometry(.55,1,1,7).translate(0,.5,0);
 const pineGeometry=new THREE.ConeGeometry(1,1,7).translate(0,.5,0);
 const crownGeometry=new THREE.IcosahedronGeometry(1,0);
 const rockGeometry=new THREE.DodecahedronGeometry(1,0);
 const trees=[...solids.filter(s=>s.look==='pine'||s.look==='oak'),...d.trees.map(t=>({...t,r:t.r??.45,outer:true}))];
 const pines=trees.filter(t=>t.look==='pine'),oaks=trees.filter(t=>t.look==='oak');
 const inner=t=>!t.outer,outer=t=>t.outer;
 // Troncos: espessura segue o raio do colisor, para o corpo desenhado coincidir com a colisão.
 for(const [list,shadow]of [[trees.filter(inner),true],[trees.filter(outer),false]])
  add(family(trunkGeometry,material({color:0x5a3d28}),list,(t)=>{const r=Math.min(.6,t.r*.75);dummy.position.set(t.x,0,t.y);dummy.scale.set(r,t.height*.5,r);},{shadow,color:(t,i)=>mix(0x5a3d28,0x3d2a1c,(i*.37)%1)}));
 // Pinheiros: três camadas de cone; carvalhos: copa em dois blocos irregulares.
 for(const [list,shadow]of [[pines.filter(inner),true],[pines.filter(outer),false]])for(const layer of [0,1,2]){
  add(family(pineGeometry,material({color:0xffffff}),list,(t,i)=>{const h=t.height,base=h*(.28+layer*.2),w=(1.7-layer*.42)*(h/6)*(t.outer?1.15:1);dummy.position.set(t.x,base,t.y);dummy.scale.set(w,h*.36,w);dummy.rotation.y=i;},{shadow,color:(t,i)=>mix(layer?0x2f6a3c:0x25583a,0x3f7d43,(t.tone??((i*.29)%1))*.6)}));
 }
 for(const [list,shadow]of [[oaks.filter(inner),true],[oaks.filter(outer),false]])for(const part of [0,1]){
  add(family(crownGeometry,material({color:0xffffff}),list,(t,i)=>{const h=t.height,w=(1.7-part*.5)*(h/6.5),ox=part?Math.cos(i)*.5:0,oz=part?Math.sin(i)*.5:0;dummy.position.set(t.x+ox,h*(.72+part*.14),t.y+oz);dummy.scale.set(w,w*.78,w);dummy.rotation.set(i*.4,i,0);},{shadow,color:(t,i)=>mix(au?(part?0xd9902c:0xb4531d):(part?0x5a9a3f:0x3e8040),au?0xe8c050:0x7aa84a,(t.tone??((i*.31)%1))*.55)}));
 }
 // Rochas: escala vertical acompanha a altura do sólido; achatadas nos lados para parecerem blocos.
 const rocks=solids.filter(s=>s.look==='rock');
 add(family(rockGeometry,material({color:0xffffff}),rocks,(s,i)=>{dummy.position.set(s.x,s.height*.34,s.y);dummy.scale.set(s.r,s.height*.55,s.r*.9);dummy.rotation.y=i*1.3;},{shadow:true,color:(s,i)=>mix(0x7d8279,0x5d625b,(i*.43)%1)}));
 const stumps=solids.filter(s=>s.look==='stump');
 add(family(trunkGeometry,material({color:0x6b4a2f}),stumps,s=>{dummy.position.set(s.x,0,s.y);dummy.scale.set(s.r,s.height,s.r);},{shadow:true}));
 // Troncos caídos: cilindro deitado sobre o eixo maior da caixa de colisão.
 const logs=solids.filter(s=>s.look==='log'),logGeometry=new THREE.CylinderGeometry(.34,.34,1,8);
 add(family(logGeometry,material({color:0x6a4a31}),logs,s=>{const along=s.width>=s.depth;dummy.position.set(s.x,s.height*.5,s.y);dummy.rotation.set(along?0:Math.PI/2,0,along?Math.PI/2:0);dummy.scale.set(s.height/.68,Math.max(s.width,s.depth),s.height/.68);}));
 // Arbustos, grama, flores e cogumelos não colidem e ficam abaixo da altura das magias.
 add(family(crownGeometry,material({color:0xffffff}),d.bushes,(b,i)=>{dummy.position.set(b.x,b.size*.4,b.y);dummy.scale.set(b.size,b.size*.7,b.size);dummy.rotation.y=i;},{shadow:false,color:b=>au?mix(0x7a4a22,0xb0742a,b.tone):mix(0x2f6a35,0x5f9444,b.tone)}));
 const blade=new THREE.ConeGeometry(.07,1,4).translate(0,.5,0);
 add(family(blade,material({color:0xffffff}),d.grass,(g,i)=>{dummy.position.set(g.x,0,g.y);dummy.scale.set(1,g.height,1);dummy.rotation.set(Math.sin(i)*.25,i,0);},{color:g=>au?mix(0x6b6a2c,0xb59a45,g.tone):mix(0x3c7a3c,0x8bb35a,g.tone)}));
 const bloom=new THREE.SphereGeometry(.09,5,4);
 add(family(bloom,material({color:0xffffff}),d.flowers,(f,i)=>{dummy.position.set(f.x,.2,f.y);},{color:f=>new THREE.Color([0xe8d37a,0xd9a0c0,0xbfd2f0,0xf2f0e4][Math.floor(f.tone*4)%4])}));
 const cap=new THREE.SphereGeometry(1,6,4,0,Math.PI*2,0,Math.PI/2);
 add(family(cap,material({color:0xc2564a}),d.mushrooms,m=>{dummy.position.set(m.x,.14,m.y);dummy.scale.set(m.size,m.size,m.size);}));
 // Manchas de musgo e trilha: discos achatados sobre o chão, com polygonOffset contra z-fighting.
 const disc=new THREE.CircleGeometry(1,18).rotateX(-Math.PI/2);
 const flat=()=>material({color:0xffffff,flatShading:false,depthTest:false,depthWrite:false});
 add(family(disc,flat(),d.patches,(p,i)=>{dummy.position.set(p.x,.014,p.y);dummy.scale.set(p.r,1,p.r*.8);dummy.rotation.y=i;},{order:-2,color:p=>au?mix(0x4a4a22,0x8c7a38,p.tone):mix(0x2a4a2d,0x6a8c45,p.tone)}));
 add(family(disc,flat(),d.path,(p,i)=>{dummy.position.set(p.x,.018,p.y);dummy.scale.set(p.r,1,p.r*.85);dummy.rotation.y=i;},{order:-1,color:(p,i)=>mix(0x6e5a3c,0x8a7650,(i*.37)%1)}));
 return out;
}
