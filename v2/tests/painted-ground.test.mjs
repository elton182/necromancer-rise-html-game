import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TEMPLATES,toArena} from '../scripts/map-model.mjs';
import {forestArena} from '../scripts/forest-map.mjs';
// Canvas e Three.js simulados: confere coordenadas finitas, tamanho da sobreposição e a troca do chão liso.
async function load(){
 const source=await readFile(new URL('../scripts/painted-ground.mjs',import.meta.url),'utf8');
 const calls={gradients:0,sizes:[]};
 const context=c=>new Proxy({
  createRadialGradient(...args){assert.ok(args.every(Number.isFinite),'gradiente com coordenadas ou raio inválidos');assert.ok(args[2]>=0&&args[5]>=0);calls.gradients++;return {addColorStop(){}};},
  arc(...args){assert.ok(args.every(Number.isFinite),'sombra com coordenadas inválidas');},
  getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)};}
 },{get:(o,k)=>k in o?o[k]:()=>{},set:()=>true});
 globalThis.document={createElement:()=>{const c={width:0,height:0};c.getContext=()=>context(c);return c;}};
 globalThis.Path2D=class{moveTo(){}lineTo(){}};
 const stub=`const THREE={DataTexture:class{constructor(d,w,h){Object.assign(this,{data:d,width:w,height:h});globalThis.__sizes.push([w,h]);}dispose(){this.disposed=true;}},MeshStandardMaterial:class{constructor(v){Object.assign(this,v)}dispose(){}},PlaneGeometry:class{rotateX(){return this}},Mesh:class{constructor(g,m){this.material=m;this.position={set(){}};this.userData={}}},Color:class{},Vector4:class{constructor(x,y,z,w){Object.assign(this,{x,y,z,w})}},SRGBColorSpace:'srgb',RepeatWrapping:1,LinearFilter:2,LinearMipmapLinearFilter:3,RGBAFormat:4};`;
 globalThis.__sizes=calls.sizes;
 const {paintedGround}=await import('data:text/javascript;base64,'+Buffer.from(source.replace("import * as THREE from 'three';",stub)).toString('base64'));
 return {paintedGround,calls};
}
test('chão pintado cobre o mundo da campanha e a floresta com sobreposição limitada',async()=>{
 const oldDocument=globalThis.document,oldPath=globalThis.Path2D;
 try{
  const {paintedGround,calls}=await load();
  const world=toArena(TEMPLATES.find(t=>t.id==='campaign-world').make());
  assert.ok(world.decor.path.length>50);
  const mesh=paintedGround(world);
  assert.ok(mesh.userData.replacesGround&&mesh.userData.paintedGround);
  // Ladrilhos de grama (1024 px) e terra (512 px) são criados uma vez; a sobreposição do mundo respeita o limite de 2048 px.
  assert.deepEqual(calls.sizes.slice(0,2),[[1024,1024],[512,512]]);
  const [w,h]=calls.sizes[2];assert.ok(w<=2048&&h<=2048&&w>1000);
  assert.ok(calls.gradients>1000);
  const overlay=mesh.material.dispose;mesh.material.dispose();assert.equal(typeof overlay,'function');
  const forest=paintedGround(forestArena(),{swamp:true});assert.ok(forest.userData.replacesGround);
  assert.equal(calls.sizes.length,4,'ladrilhos reaproveitados entre mapas');
  const [fw,fh]=calls.sizes[3];assert.equal(fw,fh);assert.ok(fw>=(40+24)*32-1);
 }finally{
  if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
  if(oldPath===undefined)delete globalThis.Path2D;else globalThis.Path2D=oldPath;delete globalThis.__sizes;
 }
});
