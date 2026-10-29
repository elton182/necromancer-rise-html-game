import * as THREE from 'three';
import {GLTFLoader} from 'gltf-loader';
import {clone} from 'skeleton-utils';
import {TRAINING_ARENA} from './terrain.mjs';
import {lootAllowed} from './drops.mjs';
import {flightHeight,corpseSink} from './enemies.mjs';
import {buildForest,THEME_PALETTE} from './forest-scene.mjs';
import {buildExpedition} from './expedition-scene.mjs';
import {buildVillage} from './village-scene.mjs';
import {buildCrypt} from './crypt-scene.mjs';
import {buildTrail} from './trail-scene.mjs';
import {buildOutpost} from './outpost-scene.mjs';

export async function createRenderer(canvas,assets,progress=()=>{}){
 const context=canvas.getContext('webgl2',{antialias:true});
 if(!context)throw Error('Este navegador não disponibilizou WebGL 2. Tente habilitar a aceleração gráfica ou abrir no Edge/Chrome atualizado.');
 const renderer=new THREE.WebGLRenderer({canvas,context,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#182428');scene.fog=new THREE.Fog('#182428',32,65);
 const camera=new THREE.OrthographicCamera(),models={},actors=new Map(),effects=new Map(),projectiles=new Map(),allyShots=new Map(),labels=new Map(),fallingBones=new Map(),corpseWalls=new Map();let zoom=11,disposed=false;/* zoom inicial; a roda varia entre 8 e 24 */
 const sun=new THREE.DirectionalLight(0xffe2b0,3),hemisphere=new THREE.HemisphereLight(0xc1dfdc,0x50504a,2),SUN_OFFSET=new THREE.Vector3(8,16,6);sun.position.copy(SUN_OFFSET);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,far:70});sun.shadow.bias=-.001;scene.add(sun,sun.target,hemisphere);
 /* A sombra acompanha o jogador, em passos de um texel, para não sumir longe da origem (cripta de 125 u) nem tremer. */
 const sunRight=new THREE.Vector3().crossVectors(SUN_OFFSET.clone().negate(),new THREE.Vector3(0,1,0)).normalize(),sunUp=new THREE.Vector3().crossVectors(sunRight,SUN_OFFSET.clone().negate()).normalize(),sunCenter=new THREE.Vector3(),texel=60/2048;
 function followSun(x,z){sunCenter.set(x,0,z);const a=sunCenter.dot(sunRight),b=sunCenter.dot(sunUp);sunCenter.addScaledVector(sunRight,Math.round(a/texel)*texel-a).addScaledVector(sunUp,Math.round(b/texel)*texel-b);sun.target.position.copy(sunCenter);sun.position.copy(sunCenter).add(SUN_OFFSET);sun.target.updateMatrixWorld();}
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x35443e,roughness:1}));ground.rotation.x=-Math.PI/2;ground.renderOrder=-3;ground.receiveShadow=true;scene.add(ground);
 const grid=new THREE.GridHelper(60,30,0x61756a,0x42544b);grid.position.y=.012;scene.add(grid);
 const graveGeometry=new THREE.BoxGeometry(.8,1.35,.35),graveMaterial=new THREE.MeshStandardMaterial({color:0x69736b,roughness:1});
 const graves=new THREE.Group();scene.add(graves);for(let i=0;i<18;i++){const a=i*Math.PI*2/18,o=new THREE.Mesh(graveGeometry,graveMaterial);o.position.set(Math.sin(a)*19,.675,Math.cos(a)*19);o.rotation.y=-a;o.castShadow=true;o.receiveShadow=true;graves.add(o);}
 const collisionView=new THREE.Group();collisionView.visible=false;scene.add(collisionView);
 const scenery=new THREE.Group();scene.add(scenery);const villageScenery=new THREE.Group();villageScenery.name='medieval-village';scene.add(villageScenery);let sceneryKey='';
 function placeVillagePart(part,x,z,height,angle=0){const source=models.medievalVillage.scene.getObjectByName('tripo_part_'+part);if(!source)throw Error('Peça medieval ausente: '+part);const body=source.clone(true);body.position.set(0,0,0);body.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(body),scale=height/(box.max.y-box.min.y),center=box.getCenter(new THREE.Vector3());body.scale.setScalar(scale);body.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);body.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});const root=new THREE.Group();root.add(body);root.position.set(x,0,z);root.rotation.y=angle;villageScenery.add(root);}
 function syncVillage(a){villageScenery.clear();const active=a.id==='village'||a.id===TRAINING_ARENA.id;grid.visible=!active;if(!active)return;const b=a.bounds;/* Peças fora do limite caminhável: ambientação sem colisões invisíveis. */
 const north=b.minY-5,west=b.minX-5,east=b.maxX+5;placeVillagePart(1,west,north,6);placeVillagePart(0,4,north,6.5);placeVillagePart(2,east,north,7);for(const [i,x,z]of [[12,west,0],[5,east,1],[23,west,12],[10,east,13]])placeVillagePart(i,x,z,5);placeVillagePart(4,west,7,3);placeVillagePart(3,east,7,4);
 }
 const portalMark=new THREE.Mesh(new THREE.RingGeometry(1,1.15,40),new THREE.MeshBasicMaterial({color:0xbb88ff,side:THREE.DoubleSide}));portalMark.rotation.x=-Math.PI/2;scene.add(portalMark);const exitMark=portalMark.clone();exitMark.visible=false;scene.add(exitMark);
 let lightGround=false,theme='default',palette=null;/* Paleta por tema: a floresta substitui as cores neutras do treino. */
 function paint(){const f=(palette||THEME_PALETTE[theme])?.[lightGround?'light':'dark']||null;ground.material.color.set(f?f.ground:lightGround?0xa5a393:0x35443e);scene.background.set(f?f.background:lightGround?0x777e79:0x182428);scene.fog.color.copy(scene.background);const crypt=theme==='crypt';sun.color.set(crypt?0xb9b4ec:0xffe2b0);sun.intensity=crypt?2.1:3;hemisphere.intensity=crypt?1.5:2;}
 function syncScenery(w){const a=w.arena,key=a.id+':'+(w.sceneryRevision||0);portalMark.visible=!!w.portal;if(w.portal)portalMark.position.set(w.portal.x,.06,w.portal.y);exitMark.visible=!!w.exitPortal;if(w.exitPortal)exitMark.position.set(w.exitPortal.x,.06,w.exitPortal.y);if(key===sceneryKey)return;sceneryKey=key;
 for(const g of [scenery,collisionView]){for(const o of [...g.children]){g.remove(o);o.geometry?.dispose();o.material?.dispose();o.dispose?.();}}
 syncVillage(a);theme=a.theme||'default';palette=a.palette||null;paint();if(a.theme){grid.visible=false;for(const o of ({forest:buildForest,village:buildVillage,crypt:buildCrypt,trail:buildTrail,outpost:buildOutpost,expedition:buildExpedition})[a.theme](a))scenery.add(o);}graves.visible=false;const b=a.bounds,cx=(b.minX+b.maxX)/2,cy=(b.minY+b.maxY)/2;const margin=(a.id==='village'||a.id===TRAINING_ARENA.id||a.theme==='forest'||a.theme==='expedition')?24:0;ground.scale.set((b.maxX-b.minX+margin)/60,(b.maxY-b.minY+margin)/60,1);ground.position.set(cx,0,cy);grid.position.set(cx,.012,cy);grid.scale.set((b.maxX-b.minX)/60,1,(b.maxY-b.minY)/60);
 for(const landmark of w.landmarks||[]){const marker=new THREE.Mesh(new THREE.RingGeometry(.5,.6,24),new THREE.MeshBasicMaterial({color:0xd4af37,side:THREE.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.set(landmark.x,.05,landmark.y);scenery.add(marker);}
 for(const r of a.theme==='crypt'?[]:a.walk||[]){const floor=new THREE.Mesh(new THREE.PlaneGeometry(r.x1-r.x0,r.y1-r.y0),new THREE.MeshStandardMaterial({color:0x4b455b,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.set((r.x0+r.x1)/2,.015,(r.y0+r.y1)/2);floor.receiveShadow=true;scenery.add(floor);}
 for(const solid of a.solids){if(!solid.look||!a.theme){const h=solid.height||.9,geometry=solid.kind==='circle'?new THREE.CylinderGeometry(solid.r,solid.r,h,16):new THREE.BoxGeometry(solid.width,h,solid.depth),o=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:solid.door?0x8c5449:0x74877c,roughness:1}));o.position.set(solid.x,h/2,solid.y);o.castShadow=true;o.receiveShadow=true;scenery.add(o);}const g=solid.kind==='circle'?new THREE.RingGeometry(solid.r-.02,solid.r+.02,24):new THREE.PlaneGeometry(solid.width,solid.depth),mark=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x87d8d1,side:THREE.DoubleSide,wireframe:solid.kind==='box'}));mark.rotation.x=-Math.PI/2;mark.position.set(solid.x,.03,solid.y);collisionView.add(mark);}
 }
 const cursor=new THREE.Mesh(new THREE.RingGeometry(.17,.23,24),new THREE.MeshBasicMaterial({color:0xbbebd1,side:THREE.DoubleSide}));cursor.rotation.x=-Math.PI/2;scene.add(cursor);
 const dashTrail=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0x9ed5d1,transparent:true,opacity:.65}));dashTrail.visible=false;scene.add(dashTrail);
 const dashHalo=new THREE.Mesh(new THREE.RingGeometry(.56,.65,32),new THREE.MeshBasicMaterial({color:0x9ed5d1,side:THREE.DoubleSide,transparent:true,opacity:.85}));dashHalo.rotation.x=-Math.PI/2;dashHalo.visible=false;scene.add(dashHalo);
 const commandMarker=new THREE.Mesh(new THREE.RingGeometry(.6,.7,32),new THREE.MeshBasicMaterial({color:0x8bcad4,side:THREE.DoubleSide}));commandMarker.rotation.x=-Math.PI/2;commandMarker.visible=false;scene.add(commandMarker);
 const fleshHalo=new THREE.Mesh(new THREE.RingGeometry(.8,.95,40),new THREE.MeshBasicMaterial({color:0xd397a1,side:THREE.DoubleSide,transparent:true,opacity:.75}));fleshHalo.rotation.x=-Math.PI/2;fleshHalo.visible=false;scene.add(fleshHalo);
 // Itens no chão usam geometrias e materiais compartilhados; a sombra escura mantém a leitura no fundo claro.
 const dropGeometry={coin:new THREE.CylinderGeometry(.3,.3,.08,18),orb:new THREE.SphereGeometry(.26,14,10),shade:new THREE.CircleGeometry(.4,20)},dropMaterial={gold:new THREE.MeshStandardMaterial({color:0xe2c46d,metalness:.5,roughness:.35,emissive:0x5a4510}),hp:new THREE.MeshStandardMaterial({color:0xe0584a,emissive:0x7a1a12,roughness:.4}),mp:new THREE.MeshStandardMaterial({color:0x5b86ff,emissive:0x1a2f84,roughness:.4}),shade:new THREE.MeshBasicMaterial({color:0x14110d,transparent:true,opacity:.4,depthWrite:false})},drops=new Map(),gearMaterial={};
 for(const [rarity,hex]of Object.entries({common:0xc7c9c2,magic:0x73b5ff,rare:0xecd16b,epic:0xc994ff}))gearMaterial[rarity]={body:new THREE.MeshStandardMaterial({color:hex,emissive:hex,emissiveIntensity:.35,roughness:.4}),ring:new THREE.MeshBasicMaterial({color:hex,side:THREE.DoubleSide,transparent:true,opacity:.85})};
 dropGeometry.gem=new THREE.OctahedronGeometry(.3);dropGeometry.ring=new THREE.RingGeometry(.42,.5,28);
 const loader=new GLTFLoader();
 function disposeMaterial(m){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}
 function releaseDrop(o){scene.remove(o.root);}
 function releaseEffect(o){scene.remove(o);o.geometry.dispose();o.material.dispose();}
 function releaseActor(o){scene.remove(o.root);if(o.flightShadow){o.flightShadow.geometry.dispose();o.flightShadow.material.dispose();}o.mixer.stopAllAction();o.mixer.uncacheRoot(o.body);o.body.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.dispose();});}
 function releaseWall(o){scene.remove(o.root);o.root.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.dispose();});releaseEffect(o.mark);releaseEffect(o.shade);}
 function releaseFall(o){scene.remove(o.root);releaseEffect(o.mark);releaseEffect(o.shade);}
 function releaseProjectile(o){scene.remove(o.root,o.trail);o.trail.geometry.dispose();o.trail.material.dispose();}
 function dispose(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);for(const o of actors.values())releaseActor(o);for(const o of effects.values())releaseEffect(o);for(const o of drops.values())releaseDrop(o);drops.clear();for(const g of Object.values(dropGeometry))g.dispose();for(const m of [...Object.values(dropMaterial),...Object.values(gearMaterial).flatMap(x=>[x.body,x.ring])])m.dispose();for(const o of projectiles.values())releaseProjectile(o);for(const o of allyShots.values())releaseEffect(o);for(const o of fallingBones.values())releaseFall(o);for(const o of corpseWalls.values())releaseWall(o);fallingBones.clear();corpseWalls.clear();for(const el of labels.values())el.remove();allyShots.clear();labels.clear();actors.clear();effects.clear();projectiles.clear();const geometries=new Set(),materials=new Set();for(const g of [scene,...Object.values(models).map(m=>m.scene)])g.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(disposeMaterial);sun.shadow.dispose();renderer.dispose();}
 try{
  for(const [key,asset]of Object.entries(assets)){
   progress(key);const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),model=await loader.parseAsync(bytes.buffer,'');models[key]=model;
   for(const animation of asset.requiredAnimations)if(!model.animations.some(a=>a.name===animation))throw Error(`Modelo ${key}: animação ${animation} ausente.`);
  }
 }catch(error){dispose();throw error;}
 let matchedPlayerHeight=null;
 function playerBodyHeight(){
  if(matchedPlayerHeight!==null)return matchedPlayerHeight;
  const reference=clone(models.player.scene);reference.updateMatrixWorld(true);reference.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  const original=new THREE.Box3().setFromObject(reference,true),mixer=new THREE.AnimationMixer(reference),idle=models.player.animations.find(c=>c.name==='idle');
  if(idle){mixer.clipAction(idle).play();mixer.update(0);}reference.updateMatrixWorld(true);
  const skin=new THREE.Box3();reference.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();skin.union(new THREE.Box3().setFromObject(o,true));}});
  matchedPlayerHeight=assets.player.height*(skin.max.y-skin.min.y)/(original.max.y-original.min.y);
  mixer.stopAllAction();mixer.uncacheRoot(reference);reference.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});return matchedPlayerHeight;
 }
 function spawn(a){
  const asset=assets[a.model],model=models[a.model];if(!model)throw Error('Modelo não registrado: '+a.model);
  const body=clone(model.scene),root=new THREE.Group();body.updateMatrixWorld(true);body.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  const box=new THREE.Box3().setFromObject(body,true);let targetHeight=asset.height;
  if(asset.matchPlayerHeight){targetHeight=playerBodyHeight();box.makeEmpty();body.traverse(o=>{if(o.isSkinnedMesh)box.union(new THREE.Box3().setFromObject(o,true));});}
  const height=box.max.y-box.min.y;if(!(height>0))throw Error('Modelo sem altura: '+a.model);
  const scale=targetHeight/height;body.scale.setScalar(scale);body.position.y=-box.min.y*scale;body.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});root.add(body);scene.add(root);
  const mixer=new THREE.AnimationMixer(body),actions={};
  for(const original of model.animations){const clip=original.clone(),duration=asset.durations?.[clip.name];if(duration&&clip.duration>0){const factor=duration/clip.duration;for(const t of clip.tracks)for(let i=0;i<t.times.length;i++)t.times[i]*=factor;clip.duration=duration;}actions[clip.name]=mixer.clipAction(clip);}
  let flightShadow=null;if(a.model==='enemyGriffin'){flightShadow=new THREE.Mesh(new THREE.CircleGeometry(.4,24),new THREE.MeshBasicMaterial({color:0x10191a,transparent:true,opacity:.23,depthWrite:false}));flightShadow.rotation.x=-Math.PI/2;root.add(flightShadow);}
  return {root,body,mixer,actions,flightShadow,state:'',actionId:-1,deathTime:0,lastHp:a.hp,hitTime:0};
 }
 function resize(){const width=canvas.clientWidth||innerWidth,height=canvas.clientHeight||innerHeight,aspect=width/height;Object.assign(camera,{left:-zoom*aspect,right:zoom*aspect,top:zoom,bottom:-zoom,near:.1,far:120});camera.updateProjectionMatrix();renderer.setSize(width,height,false);}
 function render(w,dt,{animateWhilePaused=false}={}){
  const live=new Set(w.actors.map(a=>a.id));for(const [id,o]of actors)if(!live.has(id)){releaseActor(o);actors.delete(id);}
  syncScenery(w);follow(w);for(const a of w.actors){let o=actors.get(a.id);if(!o){o=spawn(a);actors.set(a.id,o);}o.root.position.set(a.x,(a.jumpZ||0)+flightHeight(a,w.time)-corpseSink(a),a.y);o.root.rotation.y=a.angle;
   if(o.flightShadow)o.flightShadow.position.y=.025-o.root.position.y;
   const elapsed=w.paused&&!animateWhilePaused?0:dt;
   if(a.hp<o.lastHp&&a.hp>0&&o.actions.hit)o.hitTime=.16;o.lastHp=a.hp;
   let pose=a.pose;
   if(!pose&&a.model==='enemyGriffin'&&a.hp>0&&['idle','walk'].includes(a.animation))pose={anim:'fly',progress:(w.time/o.actions.fly.getClip().duration)%1};
   // Reação visual não interrompe ataques nem altera o estado de combate.
   if(a.hp>0&&o.hitTime>0&&['idle','walk'].includes(a.animation))pose={anim:'hit',progress:1-o.hitTime/.16};
   o.hitTime=Math.max(0,o.hitTime-elapsed);
   const name=pose?.anim||a.animation,next=o.actions[name]||o.actions.idle;
   if(o.state!==name||o.actionId!==a.actionId){const frozen=w.paused&&!animateWhilePaused;for(const action of Object.values(o.actions))if(action!==next){if(frozen)action.stop();else action.fadeOut(.08);}next.reset().setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;next.paused=true;if(frozen)next.stopFading().setEffectiveWeight(1);else next.fadeIn(.08);next.play();o.state=name;o.actionId=a.actionId;o.deathTime=0;}
   o.mixer.update(elapsed);
   let progress;if(pose)progress=pose.progress;else if(name==='walk')progress=(a.walkDistance/(assets[a.model].stride||1.5))%1;else if(name==='idle')progress=(a.animationTime/next.getClip().duration)%1;else if(name==='death'){if(animateWhilePaused)o.deathTime+=elapsed;progress=Math.max(a.animationTime,o.deathTime)/next.getClip().duration;}else progress=a.animationTime/next.getClip().duration;
   next.time=THREE.MathUtils.clamp(progress,0,1)*next.getClip().duration;o.mixer.update(0);
  }
  const liveFx=new Set(w.effects.map(e=>e.id));for(const [id,o]of effects)if(!liveFx.has(id)){releaseEffect(o);effects.delete(id);}
  for(const e of w.effects){let o=effects.get(e.id);const shape=[e.radius,e.arc,e.direction].join(':');if(o&&o.userData.shape!==shape){releaseEffect(o);effects.delete(e.id);o=null;}if(!o){o=new THREE.Mesh(new THREE.RingGeometry(e.arc?0:e.radius-.07,e.radius,48,1,e.arc?-e.direction-e.arc/2:0,e.arc||Math.PI*2),new THREE.MeshBasicMaterial({color:e.color||(e.kind==='danger'?0xff784e:e.visual?0xf1e5c4:0x94f6ca),side:THREE.DoubleSide,transparent:true,opacity:.9}));o.rotation.x=-Math.PI/2;o.userData.shape=shape;scene.add(o);effects.set(e.id,o);}o.position.set(e.x,e.visual&&!e.ground&&e.kind!=='allyAbility'?.75:.04,e.y);o.material.opacity=e.visual?Math.max(0,1-e.time/e.duration):e.hit?.4:.9;o.scale.setScalar(e.fixedRadius?1:e.visual?1+e.time*2:e.hit?1+(e.time-e.delay)*.7:1);}
  const dropIds=new Set(w.drops.map(d=>d.id));for(const [id,o]of drops)if(!dropIds.has(id)){releaseDrop(o);drops.delete(id);}
  for(const d of w.drops){let o=drops.get(d.id);if(!o){const gear=d.kind==='equipment',root=new THREE.Group(),pivot=new THREE.Group(),body=new THREE.Mesh(gear?dropGeometry.gem:d.kind==='gold'?dropGeometry.coin:dropGeometry.orb,gear?gearMaterial[d.item.rarity].body:dropMaterial[d.kind]),shade=new THREE.Mesh(dropGeometry.shade,dropMaterial.shade);shade.rotation.x=-Math.PI/2;shade.position.y=.03;if(d.kind==='gold')body.rotation.x=Math.PI/2;body.castShadow=true;pivot.add(body);root.add(shade,pivot);if(gear){const ring=new THREE.Mesh(dropGeometry.ring,gearMaterial[d.item.rarity].ring);ring.rotation.x=-Math.PI/2;ring.position.y=.045;root.add(ring);}scene.add(root);o={root,pivot};drops.set(d.id,o);}
   o.root.position.set(d.x,0,d.y);o.pivot.position.y=.42+Math.sin(d.age*3)*.06;o.pivot.rotation.y=d.age*2;o.root.visible=lootAllowed(d,w.lootFilter)&&(d.life>4||Math.floor(d.age*6)%2===0);}
  // Abaixo de 20% da absorção, o halo pisca como aviso de que o escudo vai cair.
  fleshHalo.visible=w.player.barrier>0&&(w.player.barrier>=w.player.barrierMax*.2||Math.floor(w.time*8)%2===0);fleshHalo.position.set(w.player.x,.05,w.player.y);
  const fallIds=new Set(w.rain.map(d=>d.id));for(const [id,o]of fallingBones)if(!fallIds.has(id)){releaseFall(o);fallingBones.delete(id);}
  for(const d of w.rain){let o=fallingBones.get(d.id);if(!o){const root=models.bone.scene.clone(true),mark=new THREE.Mesh(new THREE.RingGeometry(d.radius-.04,d.radius,32),new THREE.MeshBasicMaterial({color:0xd4cda8,side:THREE.DoubleSide,transparent:true,opacity:.6}));mark.rotation.x=-Math.PI/2;mark.position.set(d.x,.035,d.y);const shade=new THREE.Mesh(new THREE.CircleGeometry(d.radius,32),new THREE.MeshBasicMaterial({color:0x14110d,transparent:true,opacity:.12,depthWrite:false}));shade.rotation.x=-Math.PI/2;shade.position.set(d.x,.03,d.y);scene.add(root,shade,mark);o={root,mark,shade};fallingBones.set(d.id,o);}const k=Math.max(0,Math.min(1,(d.time-d.delay)/d.fall));o.root.visible=d.time>=d.delay;o.root.position.set(d.x,(1-k)*5+.1,d.y);o.root.rotation.set(k*3,0,.8);o.mark.material.opacity=.35+k*.5;o.shade.material.opacity=.12+k*.2;}
  const wallIds=new Set(w.walls.map(a=>a.id));for(const [id,o]of corpseWalls)if(!wallIds.has(id)){releaseWall(o);corpseWalls.delete(id);}
  for(const wall of w.walls)if(!corpseWalls.has(wall.id)){
   const root=new THREE.Group();root.position.set(wall.x,0,wall.y);root.rotation.y=-Math.atan2(wall.uy,wall.ux);
   for(let i=0;i<7;i++){const body=clone(models.zombie.scene);body.updateMatrixWorld(true);body.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.update();});const box=new THREE.Box3().setFromObject(body,true),scale=.95/(box.max.y-box.min.y);body.scale.setScalar(scale);body.position.set(-wall.half+(i+.5)*wall.half*2/7,-box.min.y*scale,0);body.rotation.z=(i%2?1:-1)*.4;root.add(body);}
   const nx=-wall.uy,ny=wall.ux,points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>new THREE.Vector3(wall.x+a*wall.ux*wall.half+b*nx*wall.width/2,.045,wall.y+a*wall.uy*wall.half+b*ny*wall.width/2)),mark=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xb0bc88})),shade=new THREE.Mesh(new THREE.PlaneGeometry(wall.half*2,wall.width),new THREE.MeshBasicMaterial({color:0x14110d,transparent:true,opacity:.38,depthWrite:false}));shade.rotation.set(-Math.PI/2,0,Math.atan2(-wall.uy,wall.ux));shade.position.set(wall.x,.04,wall.y);scene.add(root,shade,mark);corpseWalls.set(wall.id,{root,mark,shade});
  }
  const liveBolts=new Set(w.projectiles.map(b=>b.id));for(const [id,o]of projectiles)if(!liveBolts.has(id)){releaseProjectile(o);projectiles.delete(id);}
  for(const b of w.projectiles){let o=projectiles.get(b.id);if(!o){const root=models[b.shard?'boneShard':'bone'].scene.clone(true);root.traverse(m=>{if(m.isMesh){m.renderOrder=10;for(const material of Array.isArray(m.material)?m.material:[m.material]){material.depthTest=false;material.depthWrite=false;}}});const trail=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xc0dbcd,transparent:true,opacity:.5,depthTest:false,depthWrite:false}));trail.renderOrder=9;scene.add(root,trail);o={root,trail};projectiles.set(b.id,o);}o.root.position.set(b.x,.85,b.y);o.root.rotation.y=-Math.atan2(b.dy,b.dx);const length=Math.min(.85,b.range-b.remaining);const positions=o.trail.geometry.attributes.position;positions.setXYZ(0,b.x-b.dx*length,.85,b.y-b.dy*length);positions.setXYZ(1,b.x,.85,b.y);positions.needsUpdate=true;o.trail.geometry.computeBoundingSphere();}
  dashHalo.visible=dashTrail.visible=w.dash.remaining>0;if(dashTrail.visible){dashHalo.position.set(w.player.x,.045,w.player.y);const p=dashTrail.geometry.attributes.position;p.setXYZ(0,w.dash.origin.x,.06,w.dash.origin.y);p.setXYZ(1,w.player.x,.06,w.player.y);p.needsUpdate=true;dashTrail.geometry.computeBoundingSphere();}
  const shotIds=new Set(w.allyShots.map(s=>s.id));for(const [id,o]of allyShots)if(!shotIds.has(id)){releaseEffect(o);allyShots.delete(id);}
  for(const s of w.allyShots){let o=allyShots.get(s.id);if(!o){o=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xe7dfbf,depthTest:false}));o.renderOrder=9;scene.add(o);allyShots.set(s.id,o);}const p=o.geometry.attributes.position;p.setXYZ(0,s.x-s.dx*.6,1.1,s.y-s.dy*.6);p.setXYZ(1,s.x,1.1,s.y);p.needsUpdate=true;o.geometry.computeBoundingSphere();}
  commandMarker.visible=!!w.command;if(w.command){commandMarker.position.set(w.command.x,.045,w.command.y);commandMarker.material.color.set(w.command.type==='attack'?0xe5a58b:0x8bcad4);}
  const labeled=new Set();for(const a of w.actors)if(a.curse&&a.hp>0){labeled.add(a.id);let el=labels.get(a.id);if(!el){el=document.createElement('div');el.className='world-label';document.body.append(el);labels.set(a.id,el);}el.textContent="Fraqueza · "+Math.ceil(a.curse.remaining)+"s";const p=new THREE.Vector3(a.x,(assets[a.model].height||2.25)+.4+(a.jumpZ||0)+flightHeight(a,w.time),a.y).project(camera),r=canvas.getBoundingClientRect();el.style.left=(r.left+(p.x+1)*r.width/2)+'px';el.style.top=(r.top+(1-p.y)*r.height/2)+'px';}for(const [id,el]of labels)if(!labeled.has(id)){el.remove();labels.delete(id);}
  cursor.position.set(w.aim.x,.035,w.aim.y);cursor.visible=!w.paused;follow(w);renderer.render(scene,camera);
 }
 const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),point=new THREE.Vector3();
 function follow(w){followSun(w.player.x,w.player.y);camera.position.set(w.player.x+22,28,w.player.y+22);camera.lookAt(w.player.x,0,w.player.y);camera.updateMatrixWorld();}
 resize();
 return {render,resize,dispose,renderer,models,actors,effects,projectiles,drops,
  aim(x,y,w){if(w)follow(w);const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),camera);return ray.ray.intersectPlane(plane,point)?{x:point.x,y:point.z}:null;},
  screen(x,y,w){if(w)follow(w);const p=new THREE.Vector3(x,0,y).project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};},
  colliders(visible){collisionView.visible=visible;},
  zoom(delta){zoom=THREE.MathUtils.clamp(zoom+delta*.01,8,24);resize();},
  quality(low){renderer.shadowMap.enabled=!low;renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.5));scene.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.needsUpdate=true;});resize();},
  ground(light){lightGround=!!light;paint();}
 };
}
