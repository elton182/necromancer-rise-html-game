// Vegetação do kit do Blender (blender/exports/v2_nature_kit.glb, gerado por blender/scripts/v2_nature_kit.py).
// Lê os mesmos campos de buildForest (sólidos pine/oak/rock e decor trees/bushes/grass/flowers), então os mapas não mudam.
// Folhagem, grama e pétalas são tingidas por instância; o vento vem de scenery-fx.mjs.
import * as THREE from 'three';
import {kitFamily} from './village-kit.mjs';
import {mix} from './forest-scene.mjs';

// Alturas de referência das peças no GLB.
const OAK_HEIGHT=5.5,PINE_HEIGHT=6;
// Vento por material: [deslocamento por unidade de altura, altura onde começa] no espaço da peça.
export const NATURE_SWAY={kit_leaf:[.015,.3],kit_needle:[.012,1],kit_grass:[.2,0],kit_petal:[.18,0],kit_stem:[.18,0]};
const FLOWERS=[0xe8d37a,0xd9a0c0,0xbfd2f0,0xf2f0e4];

export function buildNature(arena,kit,{autumn=false}={}){
 const solids=arena.solids,d=arena.decor,out=[];
 const trees=[...solids.filter(s=>s.look==='pine'||s.look==='oak'),...(d.trees||[]).map(t=>({...t,outer:true}))];
 const tone=(t,i)=>t.tone??((i*.31)%1);
 // Árvores de dentro projetam sombra; as da borda, não (como em buildForest).
 for(const outer of [false,true]){
  const list=trees.filter(t=>!!t.outer===outer),shadow=!outer;
  out.push(...kitFamily(kit,'oak',list.filter(t=>t.look==='oak').map((t,i)=>{const s=t.height/OAK_HEIGHT;return {x:t.x,z:t.y,ry:i*2.1+t.x,sx:s*(.95+(i%3)*.05),sy:s,sz:s,tint:autumn?mix(0xc0602a,0xe0b04c,tone(t,i)):mix(0x4a8a3a,0x78a64a,tone(t,i)*.6)};}),{shadow}));
  out.push(...kitFamily(kit,'pine',list.filter(t=>t.look==='pine').map((t,i)=>{const s=t.height/PINE_HEIGHT;return {x:t.x,z:t.y,ry:i*1.7+t.y,sx:s,sy:s,sz:s,tint:mix(0x3c7a48,0x5a9256,tone(t,i)*.6)};}),{shadow}));
 }
 out.push(...kitFamily(kit,'rock',solids.filter(s=>s.look==='rock').map((s,i)=>({x:s.x,z:s.y,ry:i*1.3,sx:s.r*1.15,sy:s.height,sz:s.r*1.15}))));
 out.push(...kitFamily(kit,'bush',(d.bushes||[]).map((b,i)=>({x:b.x,z:b.y,ry:i,sx:b.size*1.3,sy:b.size*1.25,sz:b.size*1.3,tint:autumn?mix(0x8a5426,0xc0843a,b.tone):mix(0x3f7a36,0x6a9a44,b.tone)})),{shadow:false}));
 out.push(...kitFamily(kit,'grass',(d.grass||[]).map((g,i)=>({x:g.x,z:g.y,ry:i*2.3,sx:1+g.tone*.6,sy:g.height*1.4,sz:1+g.tone*.6,tint:autumn?mix(0x8a8a3c,0xc8aa55,g.tone):mix(0x4c8238,0x8eae52,g.tone)})),{shadow:false}));
 out.push(...kitFamily(kit,'flowers',(d.flowers||[]).map((f,i)=>({x:f.x,z:f.y,ry:i,sx:1.4,sy:1.4,sz:1.4,tint:new THREE.Color(FLOWERS[Math.floor(f.tone*4)%4])})),{shadow:false}));
 return out;
}
