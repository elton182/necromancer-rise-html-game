// Pré-visualização 3D do editor de mapas: o mesmo cenário do jogo (buildExpedition), câmera ortográfica como a do jogo,
// um personagem que anda com a colisão real do mapa e câmera que pode girar, aproximar ou ficar livre.
// Usa um renderizador próprio, criado ao abrir o editor e liberado ao fechar; nada aqui altera o jogo nem o mapa.
import * as THREE from 'three';
import {clone} from 'skeleton-utils';
import {buildExpedition} from './expedition-scene.mjs';
import {moveCircle,resolvePosition} from './terrain.mjs';

const WALK_SPEED=5,FREE_SPEED=14,PLAYER_RADIUS=.45,CAMERA_DISTANCE=40,SUN_OFFSET=new THREE.Vector3(8,16,6);
const DEFAULT_VIEW={yaw:Math.PI/4,pitch:.72,zoom:11};
const KEYS={KeyW:[0,1],ArrowUp:[0,1],KeyS:[0,-1],ArrowDown:[0,-1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function disposeTree(group){
 for(const o of [...group.children]){group.remove(o);o.traverse?.(n=>{n.geometry?.dispose();for(const m of [].concat(n.material||[]))m.dispose?.();n.dispose?.();});}
}

export function createMapPreview({models,assets}){
 const root=document.createElement('div');root.className='mp';
 const node=(tag,cls,text,parent=root)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;parent.append(e);return e;};
 const holder=node('div','mp-holder'),hint=node('p','mp-hint','WASD ou setas: andar · arraste: girar a câmera · roda: zoom · duplo clique: ir até o ponto'),
  bar=node('div','mp-bar'),status=node('p','mp-status');status.hidden=true;
 const option=(text,initial,fn)=>{const l=node('label','mp-check',undefined,bar),c=document.createElement('input');c.type='checkbox';c.checked=initial;c.onchange=()=>fn(c.checked);l.append(c);node('span',undefined,text,l);return c;};
 const button=(text,fn)=>{const b=node('button','mp-btn',text,bar);b.type='button';b.onclick=()=>{fn();canvasFocus();};return b;};

 let live=null,pending=null,raf=0,last=0,showMarkers=true,lightGround=false,freeCamera=false;
 const view={...DEFAULT_VIEW},player={x:0,y:0,angle:0,placed:false,moving:false},camTarget=new THREE.Vector3(),held=new Set(),arenaState={arena:null,start:{x:0,y:0},spawns:[]};
 const canvasFocus=()=>live?.canvas.focus({preventScroll:true});
 const free=option('Câmera livre',false,on=>{freeCamera=on;if(on)camTarget.set(player.x,0,player.y);});
 option('Marcadores',true,on=>{showMarkers=on;if(live)live.markers.visible=on;});
 option('Chão claro',false,on=>{lightGround=on;paint();});
 button('Ir ao início',()=>{if(arenaState.arena)place(arenaState.start);});
 button('Redefinir câmera',()=>{Object.assign(view,DEFAULT_VIEW);});

 const say=text=>{status.hidden=!text;status.textContent=text||'';};

 // --- Ciclo de vida ---
 function start(){
  if(live)return true;
  const canvas=document.createElement('canvas');canvas.tabIndex=0;canvas.className='mp-canvas';canvas.setAttribute('aria-label','Pré-visualização 3D do mapa');
  const gl=canvas.getContext('webgl2',{antialias:true});
  if(!gl){say('Este navegador não disponibilizou WebGL 2: a pré-visualização 3D não está disponível.');return false;}
  holder.replaceChildren(canvas);say('');
  const renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#182428');scene.fog=new THREE.Fog('#182428',32,65);
  const camera=new THREE.OrthographicCamera(),sun=new THREE.DirectionalLight(0xffe2b0,3),hemisphere=new THREE.HemisphereLight(0xc1dfdc,0x50504a,2);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,far:70});sun.shadow.bias=-.001;
  scene.add(sun,sun.target,hemisphere);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x35443e,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.renderOrder=-3;scene.add(ground);
  const scenery=new THREE.Group(),markers=new THREE.Group();scene.add(scenery,markers);markers.visible=showMarkers;
  const body=buildPlayer();if(body)scene.add(body.root);
  live={canvas,renderer,scene,camera,sun,ground,scenery,markers,body,palette:null,raycaster:new THREE.Raycaster(),size:{w:0,h:0}};
  bindCanvas(canvas);
  live.observer=new ResizeObserver(resize);live.observer.observe(holder);resize();
  if(arenaState.arena)pending=arenaState;
  last=performance.now();raf=requestAnimationFrame(frame);
  return true;
 }
 function stop(){
  cancelAnimationFrame(raf);raf=0;if(!live)return;
  live.observer.disconnect();disposeTree(live.scenery);disposeTree(live.markers);live.ground.geometry.dispose();live.ground.material.dispose();
  live.body?.mixer.stopAllAction();live.renderer.dispose();live.canvas.remove();live=null;held.clear();player.placed=false;pending=null;
 }
 const running=()=>!!live;

 // --- Personagem (modelo do jogo, parado em idle ou andando) ---
 function buildPlayer(){
  const model=models?.player,asset=assets?.player;if(!model||!asset)return null;
  const body=clone(model.scene),root=new THREE.Group();body.updateMatrixWorld(true);body.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  const box=new THREE.Box3().setFromObject(body,true),height=box.max.y-box.min.y;if(!(height>0))return null;
  const scale=asset.height/height;body.scale.setScalar(scale);body.position.y=-box.min.y*scale;
  body.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});root.add(body);
  const mixer=new THREE.AnimationMixer(body),actions={};
  for(const name of ['idle','walk']){const clip=model.animations.find(c=>c.name===name);if(clip)actions[name]=mixer.clipAction(clip.clone());}
  let current=null;const play=name=>{const next=actions[name];if(!next||next===current)return;next.reset().play();if(current)current.crossFadeTo(next,.15,false);current=next;};
  play('idle');
  return {root,mixer,play};
 }

 // --- Cenário ---
 function paint(){
  if(!live)return;const side=live.palette?.[lightGround?'light':'dark'];
  live.ground.material.color.set(side?side.ground:lightGround?0xa5a393:0x35443e);live.scene.background.set(side?side.background:lightGround?0x777e79:0x182428);live.scene.fog.color.copy(live.scene.background);
 }
 function rebuild({arena,start,spawns}){
  const b=arena.bounds,cx=(b.minX+b.maxX)/2,cy=(b.minY+b.maxY)/2;
  disposeTree(live.scenery);disposeTree(live.markers);live.palette=arena.palette||null;paint();
  live.ground.scale.set((b.maxX-b.minX+24)/60,(b.maxY-b.minY+24)/60,1);live.ground.position.set(cx,0,cy);
  for(const o of buildExpedition(arena))live.scenery.add(o);
  // Sólidos sem `look` (muro e pilar) não têm peça própria: o jogo os desenha como blocos lisos.
  const plain=new THREE.MeshStandardMaterial({color:0x74877c,roughness:1});
  for(const s of arena.solids){
   if(s.look)continue;const h=s.height||.9,geometry=s.kind==='circle'?new THREE.CylinderGeometry(s.r,s.r,h,16):new THREE.BoxGeometry(s.width,h,s.depth),mesh=new THREE.Mesh(geometry,plain);
   mesh.position.set(s.x,h/2,s.y);mesh.castShadow=true;mesh.receiveShadow=true;live.scenery.add(mesh);
  }
  // Limite do mapa (auxílio do editor; o jogo não desenha esta linha).
  const edge=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[b.minX,b.minY],[b.maxX,b.minY],[b.maxX,b.maxY],[b.minX,b.maxY]].map(([x,z])=>new THREE.Vector3(x,.04,z))),new THREE.LineBasicMaterial({color:0xd4af37}));
  live.markers.add(edge);
  const ring=(x,z,r,color)=>{
   const m=new THREE.Mesh(new THREE.RingGeometry(Math.max(.05,r-.07),r,40),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.05,z);live.markers.add(m);
   const beam=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.6,6).translate(0,1.3,0),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5,depthWrite:false}));beam.position.set(x,0,z);live.markers.add(beam);
  };
  ring(start.x,start.y,.7,0x6fb7ff);
  for(const s of spawns)ring(s.x,s.y,Math.max(.7,.55*Math.sqrt(s.count)+.4),0xe0605a);
  live.markers.visible=showMarkers;
  if(!player.placed){place(start);player.placed=true;}else{const p=resolvePosition(player,PLAYER_RADIUS,arena);player.x=p.x;player.y=p.y;}
 }
 function place(p){
  const q=resolvePosition(p,PLAYER_RADIUS,arenaState.arena);player.x=q.x;player.y=q.y;player.angle=0;if(!freeCamera)camTarget.set(q.x,0,q.y);
 }
 // Chamado pelo editor a cada alteração; a reconstrução acontece no próximo quadro (várias alterações viram uma).
 function setScene(state){arenaState.arena=state.arena;arenaState.start=state.start;arenaState.spawns=state.spawns;if(live)pending=arenaState;}

 // --- Entrada ---
 function bindCanvas(canvas){
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});try{canvas.setPointerCapture(e.pointerId);}catch{}drag={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;view.yaw-=(e.clientX-drag.x)*.008;view.pitch=clamp(view.pitch+(e.clientY-drag.y)*.006,.3,1.45);drag={x:e.clientX,y:e.clientY};});
  const end=e=>{drag=null;try{canvas.releasePointerCapture(e.pointerId);}catch{}};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoom=clamp(view.zoom*Math.exp(e.deltaY*.0012),3,45);},{passive:false});
  canvas.addEventListener('dblclick',e=>{
   if(!live||!arenaState.arena)return;const r=canvas.getBoundingClientRect();
   live.raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1)),live.camera);
   const hit=live.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());if(hit)place({x:hit.x,y:hit.z});
  });
  canvas.addEventListener('keydown',e=>{
   if(e.ctrlKey||e.metaKey||e.altKey)return;
   if(KEYS[e.code]){held.add(e.code);e.preventDefault();e.stopPropagation();}
   else if(e.code==='KeyC'){free.checked=!free.checked;free.onchange();e.stopPropagation();}
  });
  canvas.addEventListener('keyup',e=>{held.delete(e.code);});
  canvas.addEventListener('blur',()=>held.clear());
 }

 function resize(){
  if(!live)return;const w=holder.clientWidth,h=holder.clientHeight;if(!w||!h)return;
  live.size={w,h};live.renderer.setSize(w,h,false);
 }

 // --- Quadro ---
 function frame(now){
  raf=requestAnimationFrame(frame);const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
  if(!live||!live.size.w)return;
  if(pending){const state=pending;pending=null;try{rebuild(state);say('');}catch(error){say('Não foi possível montar a prévia 3D: '+error.message);}}
  if(!arenaState.arena)return;
  // Direção de andar relativa à câmera: "para a frente" é para onde ela olha.
  let ix=0,iy=0;for(const code of held){ix+=KEYS[code][0];iy+=KEYS[code][1];}
  const len=Math.hypot(ix,iy),fx=-Math.sin(view.yaw),fz=-Math.cos(view.yaw),rx=Math.cos(view.yaw),rz=-Math.sin(view.yaw);
  player.moving=false;
  if(len){
   const dx=(rx*ix+fx*iy)/len,dz=(rz*ix+fz*iy)/len;
   if(freeCamera){camTarget.x+=dx*FREE_SPEED*dt;camTarget.z+=dz*FREE_SPEED*dt;}
   else{const m=moveCircle(player,{x:dx*WALK_SPEED*dt,y:dz*WALK_SPEED*dt},PLAYER_RADIUS,arenaState.arena);player.x=m.x;player.y=m.y;player.angle=Math.atan2(dx,dz);player.moving=m.distance>1e-5;}
  }
  if(!freeCamera)camTarget.set(player.x,0,player.y);
  const body=live.body;if(body){body.root.position.set(player.x,0,player.y);body.root.rotation.y=player.angle;body.play(player.moving?'walk':'idle');body.mixer.update(dt);}
  // Câmera ortográfica orbital; os valores iniciais reproduzem a câmera do jogo.
  const aspect=live.size.w/live.size.h,cp=Math.cos(view.pitch);
  Object.assign(live.camera,{left:-view.zoom*aspect,right:view.zoom*aspect,top:view.zoom,bottom:-view.zoom,near:.1,far:140});live.camera.updateProjectionMatrix();
  live.camera.position.set(camTarget.x+Math.sin(view.yaw)*cp*CAMERA_DISTANCE,Math.sin(view.pitch)*CAMERA_DISTANCE,camTarget.z+Math.cos(view.yaw)*cp*CAMERA_DISTANCE);live.camera.lookAt(camTarget);
  live.sun.position.copy(camTarget).add(SUN_OFFSET);live.sun.target.position.copy(camTarget);live.sun.target.updateMatrixWorld();
  live.renderer.render(live.scene,live.camera);
 }

 return {root,start,stop,running,setScene,resize,focus:canvasFocus};
}
