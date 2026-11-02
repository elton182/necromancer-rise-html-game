import * as THREE from 'three';
import {kitFamily} from './village-kit.mjs';
export function createFallGroundMask(){
 const value={value:new THREE.Vector3(0,0,0)};
 return {
  patch(material){if(material.userData.fallMasked)return;material.userData.fallMasked=true;const before=material.onBeforeCompile,cache=material.customProgramCacheKey.bind(material);
   material.onBeforeCompile=function(shader){before.call(this,shader);shader.uniforms.uFallHole=value;shader.vertexShader='varying vec3 vFallWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vFallWorld=(modelMatrix*vec4(transformed,1.)).xyz;');shader.fragmentShader='uniform vec3 uFallHole;varying vec3 vFallWorld;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n if(uFallHole.z>0. && distance(vFallWorld.xz,uFallHole.xy)<uFallHole.z)discard;');};
   material.customProgramCacheKey=()=>cache()+'-fall-hole';material.needsUpdate=true;
  },
  update(w){const r=w.adventure;value.value.set(w.arena.fallSite?.x||0,w.arena.fallSite?.y||0,r?.kind==='prologue'&&r.stage==='fall'?(r.holeRadius||0):0);}
 };
}
export function buildFallScenery(arena,models){
 if(!arena.fallSite||!models.caveFallKit)return [];
 const site=arena.fallSite,out=[];
 for(const name of ['pit_rim','pit_shaft'])for(const m of kitFamily(models.caveFallKit,name,[{x:site.x,z:site.y}])){m.userData.fallPit=true;m.visible=false;out.push(m);}
 const chunks=Array.from({length:9},(_,i)=>({x:site.x+Math.cos(i*2.399)*(i%2?1.1:1.5),z:site.y+Math.sin(i*2.399)*(i%2?1.1:1.5)}));
 for(const m of kitFamily(models.caveFallKit,'collapse_chunk',chunks)){m.userData.fallChunks=chunks;m.visible=false;out.push(m);}
 const points=[];for(let i=0;i<7;i++){const a=i*Math.PI*2/7;for(const radius of [.4,1,1.8])points.push(new THREE.Vector3(site.x+Math.cos(a+(radius===1?.13:0))*radius,.045,site.y+Math.sin(a+(radius===1?.13:0))*radius));}
 const crack=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x181715}));crack.userData.fallCrack=true;out.push(crack);return out;
}
export function updateFallScenery(scenery,w){
 const r=w.adventure;if(r?.kind!=='prologue'||r.stage!=='fall')return;
 for(const mesh of scenery.children){
  if(mesh.userData.fallPit)mesh.visible=(r.holeRadius||0)>.05;
  if(mesh.userData.fallCrack)mesh.visible=r.elapsed<2.5;
  if(mesh.userData.fallChunks){mesh.visible=r.elapsed>2;const mat=new THREE.Matrix4(),q=new THREE.Quaternion(),axis=new THREE.Vector3(1,.4,.3).normalize();for(const [i,p] of mesh.userData.fallChunks.entries()){const t=Math.max(0,r.elapsed-2-i*.035);q.setFromAxisAngle(axis,t*(i%2?2:-2));mat.compose(new THREE.Vector3(p.x,-t*t*2.1,p.z),q,new THREE.Vector3(1,1,1));mesh.setMatrixAt(i,mat);}mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
 }
 let fade=document.getElementById('prologue-descent-fade');if(!fade){fade=document.createElement('div');fade.id='prologue-descent-fade';document.body.append(fade);}fade.style.opacity=String(Math.max(0,Math.min(1,(r.elapsed-4.3)/.7)));
}
export function clearFallFade(w){if(w.adventure?.kind==='prologue'&&w.adventure.stage==='fall')return;const fade=document.getElementById('prologue-descent-fade');if(fade)fade.style.opacity='0';}
