import {CLASSES} from './class-registry.mjs';
import * as THREE from 'three';
import {GLTFLoader} from 'gltf-loader';

// Cenas exclusivas da tela inicial; nunca avançam a simulação nem alteram o personagem.
// createTitlePreview: um modelo animado (seleção de classe) ou, com `companions`, o palco de "Suas jornadas" com a horda.
// renderPortrait: retrato estático do modelo real para as cartas da lista, feito uma vez por modelo.
const HEIGHT={skeleton:2.05,zombie:2,archer:2.05,specter:2.15,abom:2.9};
// Heróis jogáveis: todos com os ombros (ossos LeftArm/RightArm) na mesma altura, sem contar cajado, chapéu ou arma.
// O ombro é a referência anatômica estável entre os rigs; HeadTop_End varia (no Mercenário fica no topo do chapéu).
const HERO_MODELS=new Set(Object.values(CLASSES).map(c=>c.model)),HERO_SHOULDER=1.6,HERO_HEIGHT=2.2;
// Lugares dos integrantes da horda em volta do Necromante (x, z, rotação).
const SLOTS=[[-1.3,-.6,.5],[1.35,-.45,-.45],[-2.05,-1.65,.35],[2.05,-1.75,-.3]];
let assets=null;
const entryOf=id=>(assets??=JSON.parse(document.getElementById('assets').textContent))[id];
const release=root=>root.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});
function loadModel(id){
 const entry=entryOf(id);if(!entry)return Promise.reject(Error('Modelo ausente: '+id));
 const bytes=Uint8Array.from(atob(entry.data),c=>c.charCodeAt(0));
 return new Promise((resolve,reject)=>new GLTFLoader().parse(bytes.buffer,'',resolve,reject));
}
// Põe o modelo de pé na origem com a altura pedida, já na pose de `idle`.
// Heróis medem dos pés (origem do modelo) aos ombros; os demais, pela caixa do modelo inteiro.
function stand(gltf,id){
 const model=gltf.scene,mixer=new THREE.AnimationMixer(model),idle=gltf.animations.find(a=>a.name==='idle')||gltf.animations.find(a=>/idle/i.test(a.name));
 const action=idle&&mixer.clipAction(idle);action?.play();mixer.update(0);
 model.updateMatrixWorld(true);model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 const box=new THREE.Box3().setFromObject(model,true),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 const shoulders=[];if(HERO_MODELS.has(id))model.traverse(o=>{if(o.isBone&&/(Left|Right)Arm$/.test(o.name))shoulders.push(o.getWorldPosition(new THREE.Vector3()).y);});
 const shoulder=shoulders.length?shoulders.reduce((a,b)=>a+b)/shoulders.length:0,hero=shoulder>0,scale=hero?HERO_SHOULDER/shoulder:(HEIGHT[id]||2.2)/size.y;
 const holder=new THREE.Group();model.scale.setScalar(scale);model.position.set(-center.x*scale,hero?0:-box.min.y*scale,-center.z*scale);holder.add(model);
 return {holder,model,mixer,action,idle};
}
function shadowTexture(){
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,32);
 r.addColorStop(0,'rgba(0,0,0,.6)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);
}
export function createTitlePreview(host,modelId='necromancer',{companions=null}={}){
 const stage=Array.isArray(companions);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(stage?30:32,1,.1,60);
 if(stage){camera.position.set(0,2.2,7);camera.lookAt(0,1.55,-.4);}else{camera.position.set(0,1.6,5.6);camera.lookAt(0,1.1,0);}
 scene.add(new THREE.HemisphereLight(0xb8d2e0,0x30212b,stage?1.6:2));
 const light=new THREE.DirectionalLight(0xffc38a,stage?3.4:3);light.position.set(4,4.5,3);scene.add(light);
 const rim=new THREE.DirectionalLight((Object.values(CLASSES).find(c=>c.model===modelId)?.rim??0x69d9bf),stage?3:2);rim.position.set(-3,2.5,-3);scene.add(rim);
 if(stage&&modelId==='necromancer'){const glow=new THREE.PointLight(0x5dffb0,6,5,1.6);glow.position.set(.9,1.5,.9);scene.add(glow);}
 let stopped=false,frame=0;const clock=new THREE.Clock(),parts=[],shadow=stage?shadowTexture():null;
 const ids=[modelId,...(stage?companions:[])];
 Promise.all(ids.map((id,i)=>loadModel(id).then(gltf=>{
  if(stopped){release(gltf.scene);return;}
  const p=stand(gltf,id);
  if(i===0)p.holder.rotation.y=stage?.12:.25;
  else{const [x,z,ry]=SLOTS[i-1];p.holder.position.set(x,0,z);p.holder.rotation.y=ry;if(p.action&&p.idle)p.action.time=(i*.37)%p.idle.duration;}
  if(shadow){const disc=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:shadow,transparent:true,depthWrite:false}));disc.rotation.x=-Math.PI/2;disc.position.y=.01;disc.scale.setScalar((HERO_MODELS.has(id)?HERO_HEIGHT:HEIGHT[id]||2.2)*.75);p.holder.add(disc);}
  scene.add(p.holder);parts.push(p);
 }).catch(error=>{if(i===0)throw error;console.warn('Prévia: '+error.message);}))).then(()=>{if(!stopped)host.dataset.ready='true';},()=>{if(!stopped){const p=document.createElement('p');p.textContent=Object.values(CLASSES).find(c=>c.model===modelId)?.name||'Necromante';host.append(p);}});
 function render(){if(stopped)return;const w=host.clientWidth,h=host.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;
  // Em telas estreitas o palco recua para caber a horda inteira.
  if(stage){const back=Math.max(0,1.25-camera.aspect)*6;camera.position.set(0,2.2+back*.12,7+back);camera.lookAt(0,1.55-back*.05,-.4);}
  camera.updateProjectionMatrix();const dt=Math.min(clock.getDelta(),.05);for(const p of parts)p.mixer.update(dt);renderer.render(scene,camera);}frame=requestAnimationFrame(render);}render();
 return ()=>{stopped=true;cancelAnimationFrame(frame);for(const p of parts){p.mixer.stopAllAction();p.mixer.uncacheRoot(p.model);release(p.holder);}shadow?.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
}
const portraits=new Map();
// Retrato de busto do modelo real (PNG em data URL), guardado por modelo durante a sessão.
export function renderPortrait(modelId){
 if(!portraits.has(modelId))portraits.set(modelId,loadModel(modelId).then(gltf=>{
  const size=192,renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(size,size,false);
  try{
   const scene=new THREE.Scene(),p=stand(gltf,modelId),camera=new THREE.PerspectiveCamera(24,1,.1,30);
   p.holder.rotation.y=.35;scene.add(p.holder);
   scene.add(new THREE.HemisphereLight(0xc8d6e0,0x2a1d22,1.8));const key=new THREE.DirectionalLight(0xffc38a,3.2);key.position.set(2.5,3,3);scene.add(key);
   const rim=new THREE.DirectionalLight((Object.values(CLASSES).find(c=>c.model===modelId)?.rim??0x69d9bf),2.4);rim.position.set(-2.5,2.5,-2);scene.add(rim);
   camera.position.set(0,2.1,2.9);camera.lookAt(0,2,0);renderer.render(scene,camera);
   const url=renderer.domElement.toDataURL('image/png');p.mixer.stopAllAction();release(p.holder);return url;
  }finally{renderer.dispose();renderer.forceContextLoss();}
 }));
 return portraits.get(modelId);
}
