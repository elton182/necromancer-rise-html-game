// Kit modular da vila (blender/exports/v2_village_kit.glb, gerado por blender/scripts/v2_village_kit.py).
// Cada peça vira um InstancedMesh por material; as casas são montadas a partir dos colisores de village-map.mjs,
// que continuam sendo a única fonte de colisão: o kit só desenha.
import * as THREE from 'three';
import {family,dummy} from './forest-scene.mjs';

// Reboco, telhado, folhagem, grama e pétalas são brancos nos GLBs dos kits: a cor vem da instância.
const TINTED=new Set(['kit_plaster','kit_roof','kit_leaf','kit_needle','kit_grass','kit_petal']),WHITE=new THREE.Color(1,1,1),cache=new WeakMap();
// Módulo de parede do kit: 1 u de largura por 3 u de altura (base de pedra incluída).
export const KIT_WALL_HEIGHT=3;

// Geometria de cada malha da peça com a transformação local aplicada (o nó da peça fica na origem do GLB).
export function kitPart(model,name){
 let parts=cache.get(model);if(!parts){parts=new Map();cache.set(model,parts);}
 if(!parts.has(name)){
  const node=model.scene.getObjectByName('kit_'+name);if(!node)throw Error('Peça do kit da vila ausente: '+name);
  node.updateMatrixWorld(true);const inverse=node.matrixWorld.clone().invert(),list=[];
  node.traverse(o=>{if(o.isMesh)list.push({geometry:o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld)),material:o.material});});
  parts.set(name,list);
 }
 return parts.get(name);
}

// Posicionamento comum: {x,y,z} no espaço do Three.js, rotação em Y, escala por eixo e cor opcional (`tint`).
const place=p=>{dummy.position.set(p.x,p.y||0,p.z);dummy.rotation.y=p.ry||0;dummy.scale.set(p.sx??1,p.sy??1,p.sz??1);};
export function kitFamily(model,name,items,{shadow=true}={}){
 if(!items.length)return [];
 // A geometria é clonada por família: o renderizador descarta a geometria ao trocar de cena.
 return kitPart(model,name).map(({geometry,material})=>family(geometry.clone(),material,items,place,{shadow,color:TINTED.has(material.name)?(p=>p.tint||WHITE):undefined}));
}

// Peças de uma casa a partir do colisor. Face sul (+y do jogo, +z do Three.js) e leste ficam de frente para a câmera:
// porta e janelas vão nelas; norte e oeste recebem enxaimel simples. Devolve {peça:[posições]} e as janelas acesas.
export function houseLayout(h,{wall,roof}={}){
 const pieces={},windows=[],add=(name,p)=>(pieces[name]??=[]).push(p);
 const W=h.width,D=h.depth,H=h.height,sy=H/KIT_WALL_HEIGHT,doorX=h.x+(h.inn?-1.6:0),rise=Math.min(W,D)*.42+.7,flip=h.tone>.5;
 // Cada face: centro, rotação (a face externa do módulo aponta para +z local) e direção do eixo local X no mundo.
 const faces=[
  {side:'s',len:W,x:h.x,z:h.y+D/2,ry:0,ux:1,uz:0},
  {side:'e',len:D,x:h.x+W/2,z:h.y,ry:Math.PI/2,ux:0,uz:-1},
  {side:'n',len:W,x:h.x,z:h.y-D/2,ry:Math.PI,ux:-1,uz:0},
  {side:'w',len:D,x:h.x-W/2,z:h.y,ry:-Math.PI/2,ux:0,uz:1}];
 for(const f of faces){
  const n=Math.max(2,Math.round(f.len/1.25)),bw=f.len/n,centers=Array.from({length:n},(_,i)=>-f.len/2+bw*(i+.5));
  const door=f.side==='s'?centers.reduce((best,t,i)=>Math.abs(f.x+t*f.ux-doorX)<Math.abs(f.x+centers[best]*f.ux-doorX)?i:best,0):-1;
  centers.forEach((t,i)=>{
   let kind=(i+(flip?1:0))%2?'bay_brace':'bay_plain';
   if(i===door)kind='bay_door';
   else if(f.side==='s'&&(i===0||i===n-1||(h.inn&&i%2===0)))kind='bay_window';
   else if(f.side==='e'&&i===Math.floor(n/2))kind='bay_window';
   const x=f.x+t*f.ux,z=f.z+t*f.uz;add(kind,{x,z,ry:f.ry,sx:bw,sy,tint:wall});
   // Poça de luz da janela: um pouco à frente da parede, na direção externa.
   if(kind==='bay_window')windows.push({x:x+(f.side==='e'?.9:0),z:z+(f.side==='s'?.9:0),r:1.25});
  });
 }
 for(const sx of [-1,1])for(const sz of [-1,1])add('corner',{x:h.x+sx*W/2,z:h.y+sz*D/2,sy});
 // Empenas leste/oeste, telhado com beiral (12% no comprimento, 22% na profundidade) e testeiras sem escala em X.
 for(const sx of [-1,1])add('gable',{x:h.x+sx*W/2,y:H,z:h.y,ry:sx*Math.PI/2,sx:D,sy:rise,tint:wall});
 add('roof',{x:h.x,y:H-.05,z:h.y,sx:W*1.12,sy:rise+.08,sz:D*1.22,tint:roof});
 for(const sx of [-1,1])add('roof_end',{x:h.x+sx*W*.56,y:H-.05,z:h.y,sy:rise+.08,sz:D*1.22});
 // Chaminé na água norte: a altura acompanha o telhado para sempre aparecer acima dele.
 if(h.chimney)add('chimney',{x:h.x+W*.25,y:H,z:h.y-D*.15,sy:(rise*.75+.9)/2.2});
 return {pieces,windows};
}

// Junta os layouts de várias casas e devolve as famílias instanciadas e as janelas.
export function buildHouses(model,houses,colors){
 const pieces={},windows=[];
 for(const h of houses){const layout=houseLayout(h,colors(h));windows.push(...layout.windows);for(const [k,list]of Object.entries(layout.pieces))(pieces[k]??=[]).push(...list);}
 return {meshes:Object.entries(pieces).flatMap(([name,list])=>kitFamily(model,name,list)),windows};
}
