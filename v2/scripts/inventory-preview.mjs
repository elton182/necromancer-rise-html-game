import * as THREE from 'three';
import {GLTFLoader} from 'gltf-loader';

// Retrato 3D do inventário: o GLB real da classe em pose de espera, girável com o mouse.
// Só visual: não lê nem altera a simulação. Um único contexto WebGL é reaproveitado entre
// renderizações do painel; o laço para sozinho quando o diálogo fecha ou a aba muda.
export function createInventoryPreview(assets){
 const element=document.createElement('div');element.className='inv-model';element.setAttribute('role','img');
 let renderer=null,scene,camera,model=null,body=null,mixer=null,modelId=null,frame=0,running=false,token=0,yaw=.32,drag=null,shield=true,shieldParts=[];
 const clock=new THREE.Clock(),loader=new GLTFLoader();
 const release=root=>root.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});
 function ensure(){
  if(renderer)return true;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{element.dataset.state='unavailable';return false;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.outputColorSpace=THREE.SRGBColorSpace;element.append(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(26,1,.1,50);
  scene.add(new THREE.HemisphereLight(0xffe2bd,0x2a1d17,1.7));
  const key=new THREE.DirectionalLight(0xffd29a,3.2);key.position.set(2.5,4,4);scene.add(key);
  const rim=new THREE.DirectionalLight(0xe0a060,2.4);rim.position.set(-3,2.5,-2.5);scene.add(rim);
  const fill=new THREE.DirectionalLight(0x9fb4ff,.7);fill.position.set(-3,1,3);scene.add(fill);
  const canvas=renderer.domElement;canvas.style.touchAction='none';
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,yaw};canvas.setPointerCapture(e.pointerId);element.classList.add('dragging');});
  canvas.addEventListener('pointermove',e=>{if(drag)yaw=drag.yaw+(e.clientX-drag.x)*.012;});
  const end=()=>{drag=null;element.classList.remove('dragging');};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('dblclick',()=>{yaw=.32;});
  return true;
 }
 function applyShield(){for(const p of shieldParts)p.mesh.geometry.setIndex(shield?p.full:p.hidden);}
 function unload(){if(!model)return;scene.remove(model);mixer?.stopAllAction();mixer?.uncacheRoot(body);release(model);model=body=mixer=null;shieldParts=[];}
 function load(id){
  if(id===modelId)return;unload();modelId=id;element.dataset.ready='false';element.dataset.drawn='false';const mine=++token,entry=assets?.[id];
  if(!entry){element.dataset.state='missing';return;}
  const bytes=Uint8Array.from(atob(entry.data),c=>c.charCodeAt(0));
  loader.parse(bytes.buffer,'',gltf=>{
   if(mine!==token){release(gltf.scene);return;}
   body=gltf.scene;mixer=new THREE.AnimationMixer(body);
   const idle=gltf.animations.find(a=>a.name==='idle')||gltf.animations.find(a=>/idle/i.test(a.name));if(idle)mixer.clipAction(idle).play();mixer.update(0);
   // Mesma máscara do renderizador: o escudo do Guerreiro só aparece com um escudo equipado.
   if(id==='warrior')body.traverse(m=>{const mask=m.geometry?.getAttribute('_warrior_shield');if(!mask||!m.geometry.index)return;m.geometry=m.geometry.clone();const full=m.geometry.index,kept=[];for(let i=0;i<full.count;i+=3){const t=[full.getX(i),full.getX(i+1),full.getX(i+2)];if(!t.every(v=>mask.getX(v)>.5))kept.push(...t);}shieldParts.push({mesh:m,full,hidden:new THREE.BufferAttribute(new full.array.constructor(kept),1)});});
   applyShield();
   body.updateMatrixWorld(true);body.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
   const box=new THREE.Box3().setFromObject(body,true),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=2.5/size.y;
   body.scale.setScalar(scale);body.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
   model=new THREE.Group();model.rotation.y=yaw;model.add(body);scene.add(model);
   element.dataset.ready='true';element.dataset.state='ready';
  },()=>{if(mine===token)element.dataset.state='error';});
 }
 // Até 30 quadros por segundo: basta para a pose de espera e o giro, e poupa a GPU com o menu aberto.
 let drawnAt=0;
 function loop(now=0){
  if(!element.isConnected||element.offsetParent===null){running=false;return;}
  if(now-drawnAt<32){frame=requestAnimationFrame(loop);return;}drawnAt=now;
  const w=element.clientWidth,h=element.clientHeight;
  if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;const d=Math.max(7.4,7.4*.7/camera.aspect);camera.position.set(0,1.5,d);camera.lookAt(0,1.3,0);camera.updateProjectionMatrix();
   const dt=Math.min(clock.getDelta(),.05);mixer?.update(dt);if(model)model.rotation.y+=(yaw-model.rotation.y)*Math.min(1,dt*12);renderer.render(scene,camera);if(model&&element.dataset.drawn!=='true')element.dataset.drawn='true';}
  frame=requestAnimationFrame(loop);
 }
 return {
  element,
  show({model:id,shield:visible=true}){if(!ensure())return;shield=visible;applyShield();load(id);element.setAttribute('aria-label','Modelo 3D do personagem; arraste para girar');if(!running){running=true;clock.getDelta();frame=requestAnimationFrame(loop);}},
  dispose(){running=false;cancelAnimationFrame(frame);token++;unload();renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();renderer=null;modelId=null;},
 };
}
