// Cenário por setores: uma família de instâncias grande vira várias, uma por região do mapa, para a câmera descartar o que está fora da tela.
// Só muda o que é enviado à placa de vídeo: posição, cor e material de cada instância continuam os mesmos.
import * as THREE from 'three';

const CELL=48,MIN_INSTANCES=128,matrix=new THREE.Matrix4(),color=new THREE.Color();
function splitMesh(mesh){
 const cells=new Map();
 for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,matrix);const key=Math.floor(matrix.elements[12]/CELL)+':'+Math.floor(matrix.elements[14]/CELL);
  if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i);
 }
 if(cells.size<2)return null;
 return [...cells.values()].map(list=>{
  const part=new THREE.InstancedMesh(mesh.geometry,mesh.material,list.length);
  list.forEach((from,to)=>{mesh.getMatrixAt(from,matrix);part.setMatrixAt(to,matrix);if(mesh.instanceColor){mesh.getColorAt(from,color);part.setColorAt(to,color);}});
  part.name=mesh.name;part.renderOrder=mesh.renderOrder;part.castShadow=mesh.castShadow;part.receiveShadow=mesh.receiveShadow;part.visible=mesh.visible;part.userData={...mesh.userData};
  part.customDepthMaterial=mesh.customDepthMaterial;part.customDistanceMaterial=mesh.customDistanceMaterial;
  part.instanceMatrix.needsUpdate=true;if(part.instanceColor)part.instanceColor.needsUpdate=true;part.computeBoundingSphere();
  return part;
 });
}
// Troca, dentro do grupo, as famílias grandes por seus setores. Camadas planas sem teste de profundidade ficam inteiras: nelas, a ordem das instâncias é o desenho.
export function splitSceneIntoSectors(group){
 for(const mesh of [...group.children]){
  if(!mesh.isInstancedMesh||mesh.count<MIN_INSTANCES||mesh.material?.depthTest===false)continue;
  const parts=splitMesh(mesh);if(!parts)continue;
  group.remove(mesh);mesh.dispose();group.add(...parts);
 }
 return group;
}
