import {patchScenery} from './scenery-fx.mjs';
// Visual procedural da Expedição: vegetação, rochas e trilha vêm de buildForest; aqui entram os adereços por bioma.
// Tudo com geometria simples e sem luzes dinâmicas; é cenário provisório (acabamento na E11).
import * as THREE from 'three';
import {buildForest,family,material,mix,dummy} from './forest-scene.mjs';
import {buildHouses,kitFamily} from './village-kit.mjs';
import {paintedGround} from './painted-ground.mjs';
import {buildNature,NATURE_SWAY} from './nature-kit.mjs';
import {buildVillage} from './village-scene.mjs';
import {buildWater} from './terrain-scene.mjs';
import {buildPrologueScenery} from './prologue-scene.mjs';
const GROUND_COLORS={grass:null,dirt:'#6f5a3e',sand:'#c2a873',snow:'#e4eaee',stone:'#83847f',ash:'#3f3c3a',moss:'#3f5430'};
const BIOME_GROUND={desert:'sand',snow:'snow',grave:'stone',cave:'stone',mountain:'stone',river:'grass'};
const groupProps=list=>{const out={};for(const p of list)(out[p.model+'/'+p.part]??=[]).push(p);return out;};
const box=()=>new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
const post=new THREE.CylinderGeometry(1,1,1,8).translate(0,.5,0);
// `source.layer`: 'ground' desenha só o chão, a água e a cobertura; 'objects' desenha só as peças. Sem camada, tudo (o jogo).
// Peças giradas fora do catálogo: cada uma é montada sozinha, no lugar, e todas as suas instâncias giram em volta do centro dela.
const spinAt=new THREE.Matrix4(),spinMatrix=new THREE.Matrix4(),spinBack=new THREE.Matrix4(),spinOne=new THREE.Matrix4(),spinAxis=new THREE.Vector3(0,1,0);
export function buildRotatedParts(arena,models){
 const out=[];
 for(const part of arena.rotatedParts||[]){
  spinMatrix.makeRotationY(part.angle);spinAt.makeTranslation(part.x,0,part.y).multiply(spinMatrix);spinBack.makeTranslation(-part.x,0,-part.y);spinAt.multiply(spinBack);
  const meshes=[...buildExpedition({...part.arena,layer:'objects'},models),...(part.scene?buildPrologueScenery(part.arena,models):[])];
  for(const m of meshes){
   if(m.isInstancedMesh){for(let i=0;i<m.count;i++){m.getMatrixAt(i,spinOne);spinOne.premultiply(spinAt);m.setMatrixAt(i,spinOne);}m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();}
   else{const dx=m.position.x-part.x,dz=m.position.z-part.y,c=Math.cos(part.angle),s=Math.sin(part.angle);m.position.x=part.x+dx*c+dz*s;m.position.z=part.y-dx*s+dz*c;m.rotateOnWorldAxis(spinAxis,part.angle);}
   out.push(m);
  }
 }
 return out;
}
export function buildExpedition(source,models){
 const layer=source.layer,arena=layer==='ground'?{...source,solids:[],kitProps:[],decor:{...source.decor,bushes:[],misc:[],braziers:[]}}:source;
 if(arena.settlement){
  const base={...arena,settlement:null,solids:arena.solids.filter(s=>!s.settlement)},out=buildExpedition(base,models);
  for(const mesh of buildVillage({...arena.settlement,groundBlend:true},models)){
   if(mesh.userData.replacesGround){mesh.userData.replacesGround=false;mesh.position.y+=.012;}
   out.push(mesh);
  }
  return out;
 }
 // Primeiro acabamento regional: pântano. Mantém os dados e o fallback procedural.
 const useNature=(arena.biome==='swamp'||arena.custom&&arena.biome==='forest')&&models?.natureKit;
 const forestGround=arena.custom&&arena.biome==='forest';
 // Biomas verdes usam o chão pintado de Jacarandá (grama e terra batida); o pântano escurece a grama e ganha poças.
 const groundStyle=arena.style?.ground||(arena.terrain?BIOME_GROUND[arena.biome]:null),painted=['forest','village','swamp'].includes(arena.biome)||!!arena.terrain||!!arena.style?.ground;
 const base=useNature?{...arena,solids:arena.solids.filter(s=>!['pine','oak','rock'].includes(s.look)),decor:{...arena.decor,trees:[],bushes:[],grass:[],flowers:[]}}:arena;
 const forest=painted?{...base,decor:{...base.decor,path:[],patches:[]}}:base;
 const out=[...buildForest(forest)],add=m=>{if(Array.isArray(m))out.push(...m.flat(Infinity).filter(Boolean));else if(m)out.push(m);},look=name=>arena.solids.filter(s=>s.look===name),misc=name=>arena.decor.misc.filter(m=>m.look===name);
 if(layer!=='objects'){
  if(painted)add(paintedGround(source,{swamp:arena.biome==='swamp',base:GROUND_COLORS[groundStyle]||null,tint:arena.style?.tint||null}));
  add(buildWater(arena));
 }
 // Catálogo de peças de kit: instâncias por peça; colisão e medidas vêm do objeto do mapa.
 for(const [key,list]of Object.entries(groupProps(arena.kitProps||[]))){
  const [model,part]=key.split('/');if(!models?.[model])continue;
  for(const mesh of kitFamily(models[model],part,list.map(p=>({x:p.x,z:p.y,y:0,ry:p.ry,sx:p.sx,sy:p.sy,sz:p.sz})))){mesh.userData.noLift=list[0].float;add(mesh);}
 }
 if(useNature){
  for(const mesh of buildNature(arena,models.natureKit)){
   // Isolar a paleta regional dos materiais do kit usados na vila.
   mesh.material=mesh.material.clone();
   if(arena.biome==='swamp'&&['kit_leaf','kit_needle','kit_grass','kit_petal'].includes(mesh.material.name))mesh.material.color.multiply(new THREE.Color(0xa6ad72));
   if(forestGround){const [sway,swayFrom]=NATURE_SWAY[mesh.material.name]||[0,0];patchScenery(mesh.material,{sway,swayFrom});}
   out.push(mesh);
  }
 }
 if(models?.cryptArchitecture){
  for(const part of ['crypt_floor','sarcophagus','crypt_bench','crypt_altar','crypt_shelf'])for(const mesh of kitFamily(models.cryptArchitecture,part,misc(part).map(m=>({x:m.x,y:part==='crypt_floor'?.025:0,z:m.y,sx:m.size,sy:m.size,sz:m.size})))){
   if(part==='crypt_floor'){
    // Lajes acima do terreno, abaixo dos avisos de combate (.04): elimina faces coplanares.
    mesh.castShadow=false;mesh.material=mesh.material.clone();
    mesh.material.polygonOffset=true;mesh.material.polygonOffsetFactor=-1;mesh.material.polygonOffsetUnits=-1;
   }
   add(mesh);
  }
  for(const mesh of kitFamily(models.cryptArchitecture,'crypt_wall',look('cryptwall').map(w=>{const along=w.width>w.depth;return{x:w.x,z:w.y,ry:along?0:Math.PI/2,sx:(along?w.width:w.depth)/4,sy:w.height/8,sz:(along?w.depth:w.width)/.7};}))){
   mesh.material=mesh.material.clone();mesh.material.side=THREE.DoubleSide;
   // Paredes sólidas; recorte localizado libera a visão do personagem quando necessário.
   mesh.material.transparent=false;mesh.material.opacity=1;mesh.material.depthWrite=true;patchScenery(mesh.material);add(mesh);
  }
 }else add(family(box(),material({color:0x777180}),look('cryptwall'),w=>{dummy.position.set(w.x,0,w.y);dummy.scale.set(w.width,w.height,w.depth);},{shadow:true}));
 // Casas: caixa e telhado de quatro águas, dentro do raio de colisão.
 const swampRuins=arena.biome==='swamp'&&models?.swampKit;
 if(swampRuins)for(let v=0;v<3;v++)for(const mesh of kitFamily(models.swampKit,'tomb_'+v,misc('tomb').filter((m,i)=>i%3===v).map((m,i)=>({x:m.x,z:m.y,ry:i,sx:m.size,sy:m.size,sz:m.size}))))add(mesh);
 const houses=look('house'),damaged=arena.custom&&models?.ruinedVillageKit;
 if(damaged){
  const kit=models.ruinedVillageKit,layout=houses.map(h=>({...h,width:h.r*1.35,depth:h.r*1.25}));
  for(const mesh of buildHouses(kit,layout,h=>({wall:new THREE.Color([0xd4c6a4,0xc7b995,0xdacdaf][Math.floor(h.tone*3)%3]),roof:new THREE.Color([0x78533f,0x62694e,0x875140][Math.floor(h.tone*3)%3])})).meshes){mesh.material=mesh.material.clone();if(mesh.material.name==='kit_glow'){mesh.material.emissive.set(0);mesh.material.color.set(0x292923);}if(forestGround)patchScenery(mesh.material);add(mesh);}
  add(kitFamily(kit,'boarding',layout.map(h=>({x:h.x,z:h.y+h.depth/2+.09,y:.9,sx:.8,sy:.8,sz:1}))));
 }
 const plainHouses=damaged?[]:houses;
 add(family(box(),material({color:0xffffff}),plainHouses,h=>{dummy.position.set(h.x,0,h.y);dummy.scale.set(3.2,h.height*.8,3.2);},{shadow:true,color:h=>mix(0x9a8466,0xb89a70,h.tone)}));
 add(family(new THREE.ConeGeometry(Math.SQRT1_2,1,4).rotateY(Math.PI/4).translate(0,.5,0),material({color:0xffffff}),plainHouses,h=>{dummy.position.set(h.x,h.height*.8,h.y);dummy.scale.set(4.2,1.4,4.2);},{shadow:true,color:h=>mix(0x7a3a2c,0x9a4c36,h.tone)}));
 if(models?.cryptArchitecture)add(kitFamily(models.cryptArchitecture,'crypt_column',look('column').map(c=>({x:c.x,z:c.y,sx:c.r/.86,sy:c.height/6,sz:c.r/.86}))));
 else add(family(post,material({color:0xc9c1ad}),look('column'),(c,i)=>{dummy.position.set(c.x,0,c.y);dummy.scale.set(c.r,c.height*(i%3?1:.6),c.r);},{shadow:true}));
 add(family(post,material({color:0x4f8a46}),look('cactus'),c=>{dummy.position.set(c.x,0,c.y);dummy.scale.set(c.r*.7,c.height,c.r*.7);},{shadow:true}));
 add(family(new THREE.ConeGeometry(1,1,5).translate(0,.5,0),material({color:0xb7dcef,flatShading:true}),look('ice'),(c,i)=>{dummy.position.set(c.x,0,c.y);dummy.scale.set(c.r*1.1,c.height,c.r*1.1);dummy.rotation.y=i;},{shadow:true}));
 add(family(box(),material({color:0x8d8770}),look('ruin'),(c,i)=>{dummy.position.set(c.x,0,c.y);dummy.scale.set(c.r*2,c.height*(i%2?1:.6),c.r*1.6);dummy.rotation.y=i;},{shadow:true}));
 const kitProps=arena.custom&&models?.villageKit;
 if(kitProps)for(const part of ['barrel','crate'])add(kitFamily(models.villageKit,part,misc(part).map(m=>({x:m.x,z:m.y,sx:m.size*.75,sy:m.size*.8,sz:m.size*.75}))));
 // Sem colisão: lápides, caveiras, barris e caixas.
 add(family(box(),material({color:0x77777f}),(swampRuins?[]:misc('tomb')),(m,i)=>{dummy.position.set(m.x,0,m.y);dummy.scale.set(.8*m.size,.9*m.size,.25);dummy.rotation.set(m.tilt*.2,i,0);},{shadow:true}));
 add(family(new THREE.SphereGeometry(.14,6,5),material({color:0xe8e2cc}),misc('skulls'),m=>{dummy.position.set(m.x,.12,m.y);}));
 add(family(post,material({color:0x6a4a2b}),(kitProps?[]:misc('barrel')),m=>{dummy.position.set(m.x,0,m.y);dummy.scale.set(.36,.8,.36);},{shadow:true}));
 add(family(box(),material({color:0x8a6a3c}),(kitProps?[]:misc('crate')),(m,i)=>{dummy.position.set(m.x,0,m.y);dummy.scale.set(.75,.7,.75);dummy.rotation.y=i;},{shadow:true}));
 // Rio: discos de água achatados sobre o chão (sem teste de profundidade, como a trilha).
 add(family(new THREE.CircleGeometry(1,16).rotateX(-Math.PI/2),material({color:0x487d87,flatShading:false,depthTest:false,depthWrite:false}),arena.decor.water,w=>{dummy.position.set(w.x,.02,w.y);dummy.scale.set(w.r,1,w.r);},{order:-1}));
 // Trilha de cantos retos nos biomas sem chão pintado (no chão pintado, ela entra na textura).
 add(family(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),material({color:0x78694c,flatShading:false,depthTest:false,depthWrite:false}),painted?[]:arena.decor.pathBoxes||[],q=>{dummy.position.set(q.x,.018,q.y);dummy.rotation.y=q.angle||0;dummy.scale.set(q.w,1,q.d);},{order:-1}));
 const torches=models?.cryptArchitecture;
 if(torches)add(kitFamily(models.cryptArchitecture,'torch',arena.decor.braziers.map(b=>({x:b.x,z:b.y}))));
 if(forestGround&&torches&&arena.decor.braziers.length){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(255,255,255,.7)');gradient.addColorStop(.4,'rgba(255,255,255,.28)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const texture=new THREE.CanvasTexture(canvas),mat=new THREE.MeshBasicMaterial({map:texture,color:0xffbe72,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending});
  const pool=family(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),mat,arena.decor.braziers,b=>{dummy.position.set(b.x,.032,b.y);dummy.scale.set(5,1,5);});
  pool.receiveShadow=false;pool.userData.lightOpacity=.13;const dispose=mat.dispose.bind(mat);mat.dispose=()=>{texture.dispose();dispose();};add(pool);
 }
 const plainBraziers=torches?[]:arena.decor.braziers;
 // Brasas: poste e chama sem iluminação dinâmica.
 add(family(post,material({color:0x3d352e}),plainBraziers,b=>{dummy.position.set(b.x,0,b.y);dummy.scale.set(.1,1.2,.1);},{shadow:true}));
 add(family(new THREE.ConeGeometry(.28,.7,6).translate(0,.35,0),new THREE.MeshBasicMaterial({color:0xffa94d}),plainBraziers,b=>{dummy.position.set(b.x,1.2,b.y);}));
 if(layer!=='ground')out.push(...buildRotatedParts(arena,models));
 return out;
}
