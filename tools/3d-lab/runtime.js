import * as THREE from 'three';
import {GLTFLoader} from 'gltf-loader';
import {clone} from 'skeleton-utils';
const $=id=>document.getElementById(id);
try { await start(); } catch(error){$('status').textContent='Não foi possível iniciar: '+error.message;console.error(error);}
async function start(){
 const renderer=new THREE.WebGLRenderer({canvas:$('view'),antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#182428');scene.fog=new THREE.Fog('#182428',32,65);
 const camera=new THREE.OrthographicCamera();let zoom=15;
 const playerPos=new THREE.Vector3(0,0,4),aim=new THREE.Vector3(0,0,-5),clock=new THREE.Clock();
 scene.add(new THREE.HemisphereLight(0xc1dfdc,0x50504a,2));
 const sun=new THREE.DirectionalLight(0xffe2b0,3);sun.position.set(8,16,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,far:60});sun.shadow.bias=-.001;scene.add(sun);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x35443e,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const grid=new THREE.GridHelper(60,30,0x61756a,0x42544b);grid.position.y=.012;scene.add(grid);
 // Volumes provisórios: não são assets finais do cenário.
 for(let i=0;i<18;i++){
  const a=i*Math.PI*2/18,x=Math.sin(a)*19,z=Math.cos(a)*19;
  const grave=new THREE.Mesh(new THREE.BoxGeometry(.8,1.35,.35),new THREE.MeshStandardMaterial({color:i%2?0x69736b:0x505e5a,roughness:1}));grave.position.set(x,.675,z);grave.rotation.y=-a;grave.castShadow=true;grave.receiveShadow=true;scene.add(grave);
 }
 const loader=new GLTFLoader(),data=JSON.parse($('assets').textContent),models={};
 for(const [name,encoded] of Object.entries(data)){
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));models[name]=await loader.parseAsync(bytes.buffer,'');
 }
 const actors=[],effects=[];let player,hp=100,castCooldown=0,time=0,hits=0;
 function actor(name,pos,team){
  const gltf=models[name],body=clone(gltf.scene),pivot=new THREE.Group();
  body.updateMatrixWorld(true);body.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  const box=new THREE.Box3().setFromObject(body,true),height=box.max.y-box.min.y,scale=(name==='fallen_king'?3.2:2.25)/height;
  body.scale.setScalar(scale);body.position.y=-box.min.y*scale;pivot.add(body);pivot.position.copy(pos);scene.add(pivot);
  body.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  const mixer=new THREE.AnimationMixer(body),actions={};for(const original of gltf.animations){const clip=original.clone();if(name==='necromante'){const durations={idle:1,walk:8/12,cast:6/16,death:6/7.5};if(durations[clip.name]&&clip.duration>0){const factor=durations[clip.name]/clip.duration;for(const track of clip.tracks)for(let i=0;i<track.times.length;i++)track.times[i]*=factor;clip.duration=durations[clip.name];}}actions[clip.name]=mixer.clipAction(clip);}
  const a={name,pivot,body,mixer,actions,team,boss:name==='fallen_king',hp:name==='fallen_king'?1000:team==='enemy'?60:100,state:'',timer:0,phase:Math.random()*6};actors.push(a);animate(a,'idle');mixer.update(Math.random());return a;
 }
 function animate(a,name){if(a.state===name)return;const next=a.actions[name]||a.actions.idle;if(!next)return;for(const action of Object.values(a.actions))if(action!==next)action.fadeOut(.15);next.reset().setLoop(['idle','walk'].includes(name)?THREE.LoopRepeat:THREE.LoopOnce,Infinity);next.clampWhenFinished=true;next.fadeIn(.15).play();a.state=name;}
 function ring(pos,color,radius){const mesh=new THREE.Mesh(new THREE.RingGeometry(radius-.07,radius,48),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.9}));mesh.rotation.x=-Math.PI/2;mesh.position.copy(pos);mesh.position.y=.04;scene.add(mesh);return mesh;}
 function clearEffect(e){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();}
 function reset(){for(const a of actors){scene.remove(a.pivot);a.mixer.stopAllAction();a.mixer.uncacheRoot(a.body);}actors.length=0;for(const e of effects)clearEffect(e);effects.length=0;hp=100;hits=0;castCooldown=0;playerPos.set(0,0,4);player=actor('necromante',playerPos,'player');
  for(let i=0;i<Number($('horde').value);i++){const a=i*2.399;actor('mob_skeleton',new THREE.Vector3(Math.sin(a)*(2+i*.06),0,4+Math.cos(a)*(2+i*.06)),'ally');}
  for(let i=0;i<8;i++)actor('mob_zombie',new THREE.Vector3((i%4-1.5)*4,0,-7-Math.floor(i/4)*4),'enemy');
  actor('fallen_king',new THREE.Vector3(1,0,-13),'enemy');
 }
 function cast(){if(castCooldown>0||hp<=0)return;castCooldown=.65;animate(player,'cast');player.timer=.55;const pos=aim.clone();const delta=pos.clone().sub(playerPos);if(delta.length()>10)pos.copy(playerPos).add(delta.setLength(10));effects.push({mesh:ring(pos,0x94f6ca,2.4),pos,t:0,kind:'spell',hit:false});}
 $('cast').onclick=cast;$('reset').onclick=reset;$('horde').onchange=reset;
 $('ground').onchange=()=>{const light=$('ground').value==='light';ground.material.color.set(light?0xa5a393:0x35443e);scene.background.set(light?0x777e79:0x182428);scene.fog.color.copy(scene.background);};
 $('quality').onchange=()=>{renderer.shadowMap.enabled=$('quality').value==='high';renderer.setPixelRatio($('quality').value==='high'?Math.min(devicePixelRatio,1.5):1);scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});resize();};
 const keys=new Set();window.addEventListener('keydown',e=>{if(e.target.matches('select,button'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space')cast();});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
 const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 $('view').addEventListener('pointermove',e=>{ray.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);ray.ray.intersectPlane(plane,aim);});$('view').addEventListener('pointerdown',cast);
 $('view').addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.01,8,24);resize();},{passive:false});
 function resize(){const aspect=innerWidth/innerHeight;camera.left=-zoom*aspect;camera.right=zoom*aspect;camera.top=zoom;camera.bottom=-zoom;camera.near=.1;camera.far=120;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}window.addEventListener('resize',resize);resize();reset();
 let fpsFrames=0,fpsTime=0,fps=0;
 window.lab3d={get actors(){return actors;},get hp(){return hp;},get hits(){return hits;},playerPos,aim,cast,reset,renderer,models};
 $('status').textContent='Pronto · modelos atuais + Fallen King v4';
 renderer.setAnimationLoop(()=>{
  const dt=Math.min(clock.getDelta(),.05);time+=dt;castCooldown=Math.max(0,castCooldown-dt);
  let x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
  // Movimento relativo à tela, mantendo o plano horizontal.
  const move=new THREE.Vector3(x+z,0,z-x);if(move.lengthSq()&&hp>0){move.normalize().multiplyScalar(5*dt);playerPos.add(move);playerPos.x=THREE.MathUtils.clamp(playerPos.x,-15,15);playerPos.z=THREE.MathUtils.clamp(playerPos.z,-15,15);}player.pivot.position.copy(playerPos);
  for(const a of actors){a.mixer.update(dt);a.timer=Math.max(0,a.timer-dt);if(a.hp<=0){animate(a,'death');for(const action of Object.values(a.actions)){if(action===a.actions.death){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}}continue;}
   if(a===player){if(hp<=0)animate(a,'death');else if(a.timer<=0)animate(a,move.lengthSq()?'walk':'idle');a.pivot.rotation.y=Math.atan2(aim.x-playerPos.x,aim.z-playerPos.z);continue;}
   let target;if(a.team==='ally'){target=actors.filter(b=>b.team==='enemy'&&b.hp>0).sort((b,c)=>a.pivot.position.distanceToSquared(b.pivot.position)-a.pivot.position.distanceToSquared(c.pivot.position))[0];}else target=player;
   const goal=target?target.pivot.position:playerPos.clone().add(new THREE.Vector3(Math.sin(a.phase)*3,0,Math.cos(a.phase)*3));const dir=goal.clone().sub(a.pivot.position),distance=dir.length();
   if(a.timer<=0){if(distance>(a.boss?3:1.5)){a.pivot.position.add(dir.normalize().multiplyScalar(dt*(a.team==='ally'?2.7:a.boss?1.1:1.35)));a.pivot.rotation.y=Math.atan2(dir.x,dir.z);animate(a,'walk');}else if(target&&hp>0){a.state='';a.pivot.rotation.y=Math.atan2(dir.x,dir.z);animate(a,a.boss?'windup':'attack');a.timer=a.team==='enemy'?2.4:1;const radius=a.boss?3:1.7;effects.push({mesh:ring(goal,a.team==='enemy'?0xff784e:0xaacdb6,a.team==='enemy'?radius:.65),radius,pos:goal.clone(),t:0,kind:a.team==='enemy'?'danger':'melee',source:a,target,hit:false});}else animate(a,'idle');}
  }
  for(let i=effects.length-1;i>=0;i--){const e=effects[i];if(e.source?.hp<=0&&!e.hit){clearEffect(e);effects.splice(i,1);continue;}e.t+=dt;const delay=e.kind==='danger'?.85:e.kind==='spell'?.25:.35;if(e.source?.boss&&e.t>=.7&&!e.hit)animate(e.source,'attack');if(e.t>=delay&&!e.hit){e.hit=true;if(e.kind==='danger'){if(hp>0&&playerPos.distanceTo(e.pos)<e.radius)hp=Math.max(0,hp-(e.source.boss?25:12));}else if(e.kind==='spell'){for(const a of actors)if(a.team==='enemy'&&a.hp>0&&a.pivot.position.distanceTo(e.pos)<2.4){a.hp-=35;hits++;}}else if(e.target.hp>0&&e.target.pivot.position.distanceTo(e.pos)<1)e.target.hp-=8;}
   if(e.source?.boss&&e.source.hp>0&&e.t>delay+.25)animate(e.source,'recover');
   e.mesh.material.opacity=e.hit?.4:.9;e.mesh.scale.setScalar(e.hit?1+(e.t-delay)*.7:1);if(e.t>delay+.3){clearEffect(e);effects.splice(i,1);}}
  camera.position.copy(playerPos).add(new THREE.Vector3(22,28,22));camera.lookAt(playerPos);renderer.render(scene,camera);
  fpsFrames++;fpsTime+=dt;if(fpsTime>.5){fps=Math.round(fpsFrames/fpsTime);fpsFrames=0;fpsTime=0;$('stats').textContent=`${fps} FPS · ${actors.length} criaturas · ${renderer.info.render.calls} desenhos · ${renderer.info.render.triangles.toLocaleString('pt-BR')} triângulos`;}
  const boss=actors.find(a=>a.boss);$('health').textContent=(hp>0?`Vida: ${hp} · Saia dos círculos laranja antes do impacto.`:'Você caiu · Recomece para testar novamente.')+` Rei Caído: ${Math.max(0,boss.hp)} / 1000`;
 });
}
