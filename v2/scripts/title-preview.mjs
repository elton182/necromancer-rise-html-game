import * as THREE from 'three';
import {GLTFLoader} from 'gltf-loader';

// Cena exclusiva da seleção; nunca avança a simulação ou altera o personagem.
export function createTitlePreview(host,modelId='player'){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,50);
 camera.position.set(0,1.6,5.6);camera.lookAt(0,1.1,0);
 scene.add(new THREE.HemisphereLight(0xb8d2e0,0x30212b,2));
 const light=new THREE.DirectionalLight(0xffcf94,3);light.position.set(3,4,4);scene.add(light);
 const rim=new THREE.DirectionalLight(0x69d9bf,2);rim.position.set(-3,2,-2);scene.add(rim);
 let stopped=false,frame=0,mixer,model;const clock=new THREE.Clock();
 const entry=JSON.parse(document.getElementById('assets').textContent)[modelId];
 const bytes=Uint8Array.from(atob(entry.data),c=>c.charCodeAt(0));
 const release=root=>root.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});
 new GLTFLoader().parse(bytes.buffer,'',gltf=>{
  model=gltf.scene;if(stopped){release(model);return;}
  model.rotation.y=.25;
  mixer=new THREE.AnimationMixer(model);const idle=gltf.animations.find(a=>a.name==='idle');if(idle)mixer.clipAction(idle).play();mixer.update(0);
  model.updateMatrixWorld(true);model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  const box=new THREE.Box3().setFromObject(model,true),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=2.5/size.y;
  model.scale.setScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);scene.add(model);host.dataset.ready='true';
 },()=>{if(!stopped){const p=document.createElement('p');p.textContent='Necromante';host.append(p);}});
 function render(){if(stopped)return;const w=host.clientWidth,h=host.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();mixer?.update(Math.min(clock.getDelta(),.05));renderer.render(scene,camera);}frame=requestAnimationFrame(render);}render();
 return ()=>{stopped=true;cancelAnimationFrame(frame);mixer?.stopAllAction();if(model){mixer?.uncacheRoot(model);release(model);}renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
}
