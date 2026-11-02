import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TEMPLATES,toArena} from '../scripts/map-model.mjs';
test('chão da campanha com muros gera gradientes finitos',async()=>{
 const source=await readFile(new URL('../scripts/swamp-ground.mjs',import.meta.url),'utf8');
 let gradients=0;
 const context=new Proxy({createRadialGradient(...args){assert.ok(args.every(Number.isFinite),'gradiente com coordenadas ou raio inválidos');assert.ok(args[2]>=0&&args[5]>=0);gradients++;return {addColorStop(){}};},getImageData(){return {data:new Uint8ClampedArray(0)};}},{get:(o,k)=>k in o?o[k]:()=>{}});
 const oldDocument=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
 const stub=`const THREE={CanvasTexture:class{dispose(){}},MeshStandardMaterial:class{constructor(v){Object.assign(this,v)}dispose(){}},PlaneGeometry:class{rotateX(){return this}},Mesh:class{constructor(g,m){this.material=m;this.position={set(){}};this.userData={}}},Color:class{},SRGBColorSpace:'srgb'};`;
 try{
  const {swampGround}=await import('data:text/javascript;base64,'+Buffer.from(source.replace("import * as THREE from 'three';",stub)).toString('base64'));
  const arena=toArena(TEMPLATES.find(t=>t.id==='campaign-world').make());
  assert.ok(arena.solids.some(s=>s.kind==='box'));
  const mesh=swampGround(arena,{forest:true});assert.ok(mesh.userData.replacesGround);assert.ok(gradients>950);mesh.material.dispose();
 }finally{if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;}
});
