import * as THREE from 'three';
import {GLTFLoader} from 'gltf-loader';
import {clone} from 'skeleton-utils';
import {TRAINING_ARENA} from './terrain.mjs';

export async function createRenderer(canvas,assets,progress=()=>{}){
 const context=canvas.getContext('webgl2',{antialias:true});
 if(!context)throw Error('Este navegador não disponibilizou WebGL 2. Tente habilitar a aceleração gráfica ou abrir no Edge/Chrome atualizado.');
 const renderer=new THREE.WebGLRenderer({canvas,context,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#182428');scene.fog=new THREE.Fog('#182428',32,65);
 const camera=new THREE.OrthographicCamera(),models={},actors=new Map(),effects=new Map();let zoom=15,disposed=false;
 const sun=new THREE.DirectionalLight(0xffe2b0,3);sun.position.set(8,16,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,far:60});sun.shadow.bias=-.001;scene.add(sun,new THREE.HemisphereLight(0xc1dfdc,0x50504a,2));
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x35443e,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const grid=new THREE.GridHelper(60,30,0x61756a,0x42544b);grid.position.y=.012;scene.add(grid);
 const graveGeometry=new THREE.BoxGeometry(.8,1.35,.35),graveMaterial=new THREE.MeshStandardMaterial({color:0x69736b,roughness:1});
 for(let i=0;i<18;i++){const a=i*Math.PI*2/18,o=new THREE.Mesh(graveGeometry,graveMaterial);o.position.set(Math.sin(a)*19,.675,Math.cos(a)*19);o.rotation.y=-a;o.castShadow=true;o.receiveShadow=true;scene.add(o);}
 const collisionView=new THREE.Group();collisionView.visible=false;scene.add(collisionView);
 for(const s of TRAINING_ARENA.solids){
  const geometry=s.kind==='circle'?new THREE.CylinderGeometry(s.r,s.r,s.height,16):new THREE.BoxGeometry(s.width,s.height,s.depth),o=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x74877c,roughness:1}));o.position.set(s.x,s.height/2,s.y);o.castShadow=true;o.receiveShadow=true;scene.add(o);
  const g=s.kind==='circle'?new THREE.RingGeometry(s.r-.02,s.r+.02,32):new THREE.PlaneGeometry(s.width,s.depth),footprint=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x87d8d1,side:THREE.DoubleSide,wireframe:s.kind==='box'}));footprint.rotation.x=-Math.PI/2;footprint.position.set(s.x,.025,s.y);collisionView.add(footprint);
 }
 const b=TRAINING_ARENA.bounds,edge=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[b.minX,b.minY],[b.maxX,b.minY],[b.maxX,b.maxY],[b.minX,b.maxY]].map(([x,y])=>new THREE.Vector3(x,.025,y))),new THREE.LineBasicMaterial({color:0x718b77}));scene.add(edge);
 const cursor=new THREE.Mesh(new THREE.RingGeometry(.17,.23,24),new THREE.MeshBasicMaterial({color:0xbbebd1,side:THREE.DoubleSide}));cursor.rotation.x=-Math.PI/2;scene.add(cursor);
 const loader=new GLTFLoader();
 function disposeMaterial(m){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}
 function releaseEffect(o){scene.remove(o);o.geometry.dispose();o.material.dispose();}
 function releaseActor(o){scene.remove(o.root);o.mixer.stopAllAction();o.mixer.uncacheRoot(o.body);o.body.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.dispose();});}
 function dispose(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);for(const o of actors.values())releaseActor(o);for(const o of effects.values())releaseEffect(o);actors.clear();effects.clear();const geometries=new Set(),materials=new Set();for(const g of [scene,...Object.values(models).map(m=>m.scene)])g.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(disposeMaterial);sun.shadow.dispose();renderer.dispose();}
 try{
  for(const [key,asset]of Object.entries(assets)){
   progress(key);const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),model=await loader.parseAsync(bytes.buffer,'');models[key]=model;
   for(const animation of asset.requiredAnimations)if(!model.animations.some(a=>a.name===animation))throw Error(`Modelo ${key}: animação ${animation} ausente.`);
  }
 }catch(error){dispose();throw error;}
 function spawn(a){
  const asset=assets[a.model],model=models[a.model];if(!model)throw Error('Modelo não registrado: '+a.model);
  const body=clone(model.scene),root=new THREE.Group();body.updateMatrixWorld(true);body.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  const box=new THREE.Box3().setFromObject(body,true),height=box.max.y-box.min.y;if(!(height>0))throw Error('Modelo sem altura: '+a.model);
  const scale=asset.height/height;body.scale.setScalar(scale);body.position.y=-box.min.y*scale;body.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});root.add(body);scene.add(root);
  const mixer=new THREE.AnimationMixer(body),actions={};
  for(const original of model.animations){const clip=original.clone(),duration=asset.durations?.[clip.name];if(duration&&clip.duration>0){const factor=duration/clip.duration;for(const t of clip.tracks)for(let i=0;i<t.times.length;i++)t.times[i]*=factor;clip.duration=duration;}actions[clip.name]=mixer.clipAction(clip);}
  return {root,body,mixer,actions,state:'',actionId:-1,deathTime:0};
 }
 function resize(){const width=canvas.clientWidth||innerWidth,height=canvas.clientHeight||innerHeight,aspect=width/height;Object.assign(camera,{left:-zoom*aspect,right:zoom*aspect,top:zoom,bottom:-zoom,near:.1,far:120});camera.updateProjectionMatrix();renderer.setSize(width,height,false);}
 function render(w,dt,{animateWhilePaused=false}={}){
  const live=new Set(w.actors.map(a=>a.id));for(const [id,o]of actors)if(!live.has(id)){releaseActor(o);actors.delete(id);}
  for(const a of w.actors){let o=actors.get(a.id);if(!o){o=spawn(a);actors.set(a.id,o);}o.root.position.set(a.x,0,a.y);o.root.rotation.y=a.angle;
   const name=a.pose?.anim||a.animation,next=o.actions[name]||o.actions.idle;
   if(o.state!==name||o.actionId!==a.actionId){const frozen=w.paused&&!animateWhilePaused;for(const action of Object.values(o.actions))if(action!==next){if(frozen)action.stop();else action.fadeOut(.08);}next.reset().setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;next.paused=true;if(frozen)next.stopFading().setEffectiveWeight(1);else next.fadeIn(.08);next.play();o.state=name;o.actionId=a.actionId;o.deathTime=0;}
   const elapsed=w.paused&&!animateWhilePaused?0:dt;o.mixer.update(elapsed);
   let progress;if(a.pose)progress=a.pose.progress;else if(name==='walk')progress=(a.walkDistance/(assets[a.model].stride||1.5))%1;else if(name==='idle')progress=(a.animationTime/next.getClip().duration)%1;else if(name==='death'){if(animateWhilePaused)o.deathTime+=elapsed;progress=Math.max(a.animationTime,o.deathTime)/next.getClip().duration;}else progress=a.animationTime/next.getClip().duration;
   next.time=THREE.MathUtils.clamp(progress,0,1)*next.getClip().duration;o.mixer.update(0);
  }
  const liveFx=new Set(w.effects.map(e=>e.id));for(const [id,o]of effects)if(!liveFx.has(id)){releaseEffect(o);effects.delete(id);}
  for(const e of w.effects){let o=effects.get(e.id);if(!o){o=new THREE.Mesh(new THREE.RingGeometry(e.radius-.07,e.radius,48),new THREE.MeshBasicMaterial({color:e.kind==='danger'?0xff784e:0x94f6ca,side:THREE.DoubleSide,transparent:true,opacity:.9}));o.rotation.x=-Math.PI/2;scene.add(o);effects.set(e.id,o);}o.position.set(e.x,.04,e.y);o.material.opacity=e.hit?.4:.9;o.scale.setScalar(e.hit?1+(e.time-e.delay)*.7:1);}
  cursor.position.set(w.aim.x,.035,w.aim.y);cursor.visible=!w.paused;follow(w);renderer.render(scene,camera);
 }
 const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),point=new THREE.Vector3();
 function follow(w){camera.position.set(w.player.x+22,28,w.player.y+22);camera.lookAt(w.player.x,0,w.player.y);camera.updateMatrixWorld();}
 resize();
 return {render,resize,dispose,renderer,models,actors,effects,
  aim(x,y,w){if(w)follow(w);const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),camera);return ray.ray.intersectPlane(plane,point)?{x:point.x,y:point.z}:null;},
  screen(x,y,w){if(w)follow(w);const p=new THREE.Vector3(x,0,y).project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};},
  colliders(visible){collisionView.visible=visible;},
  zoom(delta){zoom=THREE.MathUtils.clamp(zoom+delta*.01,8,24);resize();},
  quality(low){renderer.shadowMap.enabled=!low;renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.5));scene.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.needsUpdate=true;});resize();},
  ground(light){ground.material.color.set(light?0xa5a393:0x35443e);scene.background.set(light?0x777e79:0x182428);scene.fog.color.copy(scene.background);}
 };
}
