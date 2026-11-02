import * as THREE from 'three';
import {kitFamily} from './village-kit.mjs';

export function forestBorderTrees(arena){
 if(arena.cave||!(arena.theme==='forest'||arena.biome==='forest'))return [];
 const b=arena.bounds,trees=[],step=3.5,reach=80;
 const noise=(x,y,k)=>{const n=Math.sin(x*127.1+y*311.7+k*74.7)*43758.5453;return n-Math.floor(n);};
 for(let x=b.minX-reach;x<=b.maxX+reach;x+=step)for(let y=b.minY-reach;y<=b.maxY+reach;y+=step){
  const px=x+(noise(x,y,1)-.5)*1.7,py=y+(noise(x,y,2)-.5)*1.7;
  // Copas inteiramente fora do campo: nenhuma árvore nova invade o percurso.
  if(px>b.minX-4&&px<b.maxX+4&&py>b.minY-4&&py<b.maxY+4)continue;
  trees.push({x:px,y:py,height:6+noise(x,y,3)*3,look:noise(x,y,4)<.6?'pine':'oak',tone:noise(x,y,5),angle:noise(x,y,6)*Math.PI*2});
 }
 return trees;
}

export function buildForestBorder(arena,models){
 if(!models?.natureKit)return [];
 const trees=forestBorderTrees(arena),out=[];
 for(const kind of ['oak','pine']){
  const items=trees.filter(t=>t.look===kind).map(t=>{const s=t.height/(kind==='oak'?5.5:6);return {x:t.x,z:t.y,ry:t.angle,sx:s,sy:s,sz:s,tint:new THREE.Color(kind==='pine'?0x3c7a48:arena.autumn?0xb77529:0x4a8a3a).multiplyScalar(.8+t.tone*.3)};});
  for(const mesh of kitFamily(models.natureKit,kind,items,{shadow:false})){
   mesh.name='forest-border-'+kind;mesh.userData.forestBorder=true;out.push(mesh);
  }
 }
 return out;
}
