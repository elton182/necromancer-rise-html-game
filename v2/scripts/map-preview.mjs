import {buildForestBorder} from './forest-border.mjs';
import {buildMapHorizon,updateMapHorizon} from './map-horizon.mjs';
import {buildPrologueScenery} from './prologue-scene.mjs';
import {sceneLookKey,createSceneEnvironment,applySceneLook,applyMapStyle} from './scene-look.mjs';
import {liftScenery,updateWater} from './terrain-scene.mjs';
import {splitSceneIntoSectors} from './scene-sectors.mjs';
import {groundAt,terrainSpeed} from './map-terrain.mjs';
import {updateSceneryFx} from './scenery-fx.mjs';
// Vista 3D do editor de mapas: o mesmo cenário do jogo, câmera ortográfica como a do jogo e, nela, a construção do mapa.
// A cena fica em camadas: o chão (caro de pintar) à parte, uma camada por tipo de peça e uma só para a peça selecionada;
// cada alteração refaz apenas a camada que mudou. As regras de seleção e alças ficam no editor; aqui só desenho e entrada.
// Usa um renderizador próprio, criado ao abrir o editor e liberado ao fechar; nada aqui altera o jogo.
import * as THREE from 'three';
import {clone} from 'skeleton-utils';
import {buildExpedition,buildRotatedParts} from './expedition-scene.mjs';
import {toArena,PROPS,SCENE_PROPS} from './map-model.mjs';
import {moveCircle,resolvePosition} from './terrain.mjs';

const WALK_SPEED=5,FREE_SPEED=14,PLAYER_RADIUS=.45,CAMERA_DISTANCE=40,SUN_OFFSET=new THREE.Vector3(8,16,6),MIN_ZOOM=3,MAX_ZOOM=240,HANDLE_PICK=14,TOP_PITCH=1.55,GROUND_REFRESH=1500;
const DEFAULT_VIEW={yaw:Math.PI/4,pitch:.72,zoom:11};
const KEYS={KeyW:[0,1],ArrowUp:[0,1],KeyS:[0,-1],ArrowDown:[0,-1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
// Tipos desenhados com a caverna e a caravana ficam em uma camada só, pois a cena delas é montada em conjunto.
const SCENE_TYPES=SCENE_PROPS,GROUND_TYPES=new Set(['path','path_square','water']);
const HANDLE_COLORS={edge:0xffe27a,height:0x7fd8ff,rotate:0xff9f5a};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function disposeTree(group){
 for(const o of [...group.children]){group.remove(o);o.traverse?.(n=>{n.geometry?.dispose();for(const m of [].concat(n.material||[])){if(n.userData.replacesGround)m.map?.dispose();m.dispose?.();}n.dispose?.();});}
}
// Sólidos sem `look` (muro e pilar) não têm peça própria: o jogo os desenha como blocos lisos.
function plainSolids(arena){
 const out=[],material=new THREE.MeshStandardMaterial({color:0x74877c,roughness:1});
 for(const s of arena.solids){
  if(s.look)continue;const h=s.height||.9,geometry=s.kind==='circle'?new THREE.CylinderGeometry(s.r,s.r,h,16):new THREE.BoxGeometry(s.width,h,s.depth),mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(s.x,h/2,s.y);mesh.rotation.y=s.angle||0;mesh.castShadow=true;mesh.receiveShadow=true;out.push(mesh);
 }
 return out;
}

// `hooks`: ligação com o editor. `down`, `move`, `up` e `hover` recebem o ponto no chão e o raio do ponteiro; `handleDown` agarra uma alça.
export function createMapPreview({models,assets,hooks={},freeByDefault=false}){
 const root=document.createElement('div');root.className='mp';
 const node=(tag,cls,text,parent=root)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;parent.append(e);return e;};
 const holder=node('div','mp-holder'),hint=node('p','mp-hint','Esquerdo: usar a ferramenta · Direito: girar · Meio: mover a vista · Roda: zoom · WASD: mover · T: vista de cima'),
  bar=node('div','mp-bar'),status=node('p','mp-status');status.hidden=true;void hint;
 const option=(text,initial,fn)=>{const l=node('label','mp-check',undefined,bar),c=document.createElement('input');c.type='checkbox';c.checked=initial;c.onchange=()=>fn(c.checked);l.append(c);node('span',undefined,text,l);return c;};
 const button=(text,fn)=>{const b=node('button','mp-btn',text,bar);b.type='button';b.onclick=()=>{fn();canvasFocus();};return b;};

 const timing={updateMs:0,groundMs:0,groundBuilds:0,frameMs:16,layers:0,triangles:0,calls:0};
 let live=null,pending=null,raf=0,last=0,showMarkers=true,lightGround=false,freeCamera=freeByDefault,topView=null,overlay=null,overlayKey='',hoverInfo=null,groundDue=0,current=null,toolHeld=false;
 const view={...DEFAULT_VIEW},player={x:0,y:0,angle:0,placed:false,moving:false},camTarget=new THREE.Vector3(),held=new Set(),sigs=new Map();
 const canvasFocus=()=>live?.canvas.focus({preventScroll:true});
 const free=option('Câmera livre',freeByDefault,on=>{freeCamera=on;if(on)camTarget.set(player.x,camTarget.y,player.y);});
 option('Marcadores',true,on=>{showMarkers=on;if(live)live.markers.visible=on;});
 option('Chão claro',false,on=>{lightGround=on;paint();});
 const topButton=button('Vista de cima',()=>setTop(!topView));
 button('Ir ao início',()=>{if(current){place(current.start);camTarget.set(player.x,0,player.y);}});
 button('Redefinir câmera',()=>{setTop(false);Object.assign(view,DEFAULT_VIEW);});

 const say=text=>{status.hidden=!text;status.textContent=text||'';};

 // --- Ciclo de vida ---
 function start(){
  if(live)return true;
  const canvas=document.createElement('canvas');canvas.tabIndex=0;canvas.className='mp-canvas';canvas.setAttribute('aria-label','Vista 3D do mapa');
  const gl=canvas.getContext('webgl2',{antialias:true});
  if(!gl){say('Este navegador não disponibilizou WebGL 2: a vista 3D não está disponível.');return false;}
  holder.replaceChildren(canvas);say('');
  const renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#182428');scene.fog=new THREE.Fog('#182428',32,65);
  const camera=new THREE.OrthographicCamera(),sun=new THREE.DirectionalLight(0xffe2b0,3),hemisphere=new THREE.HemisphereLight(0xc1dfdc,0x50504a,2);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,far:70});sun.shadow.bias=-.001;
  scene.add(sun,sun.target,hemisphere);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x35443e,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.renderOrder=-3;scene.add(ground);
  const scenery=new THREE.Group(),markers=new THREE.Group(),ghost=new THREE.Group(),guides=new THREE.Group(),handles=new THREE.Group();scene.add(scenery,markers,ghost,guides,handles);markers.visible=showMarkers;
  const body=buildPlayer();if(body)scene.add(body.root);
  const box=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:0xffe27a,depthTest:false,transparent:true})),hoverBox=new THREE.LineSegments(box.geometry.clone(),new THREE.LineBasicMaterial({color:0xffffff,depthTest:false,transparent:true,opacity:.55}));
  box.renderOrder=hoverBox.renderOrder=30;box.visible=hoverBox.visible=false;scene.add(box,hoverBox);
  live={canvas,renderer,scene,camera,sun,hemisphere,environment:null,lookKey:null,ground,scenery,markers,ghost,ghostType:null,guides,handles,box,hoverBox,body,palette:null,layers:new Map(),probe:{terrain:null},probeKey:null,collision:null,raycaster:new THREE.Raycaster(),size:{w:0,h:0},handleGeometry:new THREE.SphereGeometry(1,12,8),fog:{near:32,far:65},cave:false};
  bindCanvas(canvas);
  live.observer=new ResizeObserver(resize);live.observer.observe(holder);resize();
  sigs.clear();if(current)pending=current;
  last=performance.now();raf=requestAnimationFrame(frame);
  return true;
 }
 function stop(){
  cancelAnimationFrame(raf);raf=0;if(!live)return;
  live.observer.disconnect();for(const group of [live.scenery,live.markers,live.ghost,live.guides,live.handles])disposeTree(group);
  for(const o of [live.box,live.hoverBox]){o.geometry.dispose();o.material.dispose();}live.handleGeometry.dispose();live.ground.geometry.dispose();live.ground.material.dispose();
  live.environment?.dispose();live.sun.shadow.dispose();live.body?.mixer.stopAllAction();live.renderer.dispose();live.canvas.remove();live=null;held.clear();player.placed=false;pending=null;overlayKey='';sigs.clear();groundDue=0;
 }
 const running=()=>!!live;

 // --- Personagem (modelo do jogo, parado em idle ou andando) ---
 function buildPlayer(){
  const model=models?.necromancer,asset=assets?.necromancer;if(!model||!asset)return null;
  const body=clone(model.scene),root=new THREE.Group();body.updateMatrixWorld(true);body.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  const box=new THREE.Box3().setFromObject(body,true),height=box.max.y-box.min.y;if(!(height>0))return null;
  const scale=asset.height/height;body.scale.setScalar(scale);body.position.y=-box.min.y*scale;
  body.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});root.add(body);
  const mixer=new THREE.AnimationMixer(body),actions={};
  for(const name of ['idle','walk']){const clip=model.animations.find(c=>c.name===name);if(clip)actions[name]=mixer.clipAction(clip.clone());}
  let active=null;const play=name=>{const next=actions[name];if(!next||next===active)return;next.reset().play();if(active)active.crossFadeTo(next,.15,false);active=next;};
  play('idle');
  return {root,mixer,play};
 }

 // --- Camadas ---
 const eachMesh=fn=>{for(const {group} of live.layers.values())for(const o of group.children)fn(o);};
 function paint(){
  if(!live)return;const side=live.palette?.[lightGround?'light':'dark'];
  live.ground.material.color.set(side?side.ground:lightGround?0xa5a393:0x35443e);live.scene.background.set(side?side.background:lightGround?0x777e79:0x182428);live.scene.fog.color.copy(live.scene.background);
  live.sun.color.set(0xffe2b0);live.sun.intensity=3;live.hemisphere.intensity=2;
  applySceneLook(live.renderer,live.scene,live.sun,live.hemisphere,live.lookKey,()=>live.environment??=(createSceneEnvironment(live.renderer)));applyMapStyle(live.scene,live.sun,live.hemisphere,current?.flat.style||null,lightGround);
  live.fog={near:live.scene.fog.near,far:live.scene.fog.far};
  eachMesh(o=>{const u=o.userData;if(u.lightColor)o.material.color.copy(lightGround?u.lightColor:new THREE.Color(1,1,1));if(u.lightOpacity!==undefined){u.darkOpacity??=o.material.opacity;o.material.opacity=lightGround?u.lightOpacity:u.darkOpacity;}});
  const groundLayer=live.layers.get('ground');if(groundLayer)updateMapHorizon(groundLayer.group);
 }
 function layerGroup(key){
  let layer=live.layers.get(key);if(!layer){layer={group:new THREE.Group()};live.layers.set(key,layer);live.scenery.add(layer.group);}
  disposeTree(layer.group);return layer.group;
 }
 const dropLayer=key=>{const layer=live.layers.get(key);if(!layer)return;disposeTree(layer.group);live.scenery.remove(layer.group);live.layers.delete(key);sigs.delete(key);};
 // Arena só com estas peças: sem cobertura do chão e com tom próprio de cada peça, para refazer uma camada não mudar a cor das demais.
 const partial=(flat,objects)=>toArena({...flat,objects,terrain:null},{cover:false,stableTone:true});
 const caveFloor=flat=>flat.biome==='cave'&&!flat.terrain&&!flat.style?.ground;
 const sceneArena=(flat,objects)=>toArena({...flat,objects},{cover:false});
 function buildGround(flat){
  const t=performance.now(),arena=toArena(flat),b=arena.bounds,group=layerGroup('ground');
  live.palette=arena.palette||null;live.lookKey=sceneLookKey(arena);live.cave=!!arena.cave;
  live.ground.scale.set((b.maxX-b.minX+24)/60,(b.maxY-b.minY+24)/60,1);live.ground.position.set((b.minX+b.maxX)/2,0,(b.minY+b.maxY)/2);
  const meshes=[...buildExpedition({...arena,layer:'ground'},models)];
  if(caveFloor(flat)){const scene=sceneArena(flat,flat.objects.filter(o=>SCENE_TYPES.has(o.type)||o.type==='path'||o.type==='path_square'));meshes.push(...buildPrologueScenery(scene,models),...buildRotatedParts(scene,models));}
  for(const o of meshes)group.add(o);
  const source=group.children.find(o=>o.userData.replacesGround);live.ground.visible=!source;group.add(buildMapHorizon(source||live.ground));
  for(const mesh of buildForestBorder(arena,models))group.add(mesh);
  liftScenery(group.children,arena);splitSceneIntoSectors(group);paint();groundDue=0;timing.groundMs=performance.now()-t;timing.groundBuilds++;
 }
 function buildObjects(key,flat,objects){
  const group=layerGroup(key);
  if(key==='scene'){const scene=sceneArena(flat,[...objects,...flat.objects.filter(o=>o.type==='path'||o.type==='path_square')]);for(const o of [...buildPrologueScenery(scene,models),...buildRotatedParts(scene,models)])group.add(o);}
  else{const arena=partial(flat,objects);for(const o of [...buildExpedition({...arena,layer:'objects'},models),...plainSolids(arena)])group.add(o);}
  liftScenery(group.children,live.probe);splitSceneIntoSectors(group);
  eachLayerPaint(group);
 }
 function eachLayerPaint(group){for(const o of group.children){const u=o.userData;if(u.lightColor)o.material.color.copy(lightGround?u.lightColor:new THREE.Color(1,1,1));}}
 function buildMarkers(flat,points){
  disposeTree(live.markers);
  const b={minX:-flat.size.w/2,maxX:flat.size.w/2,minY:-flat.size.h/2,maxY:flat.size.h/2};
  // Limite do mapa (auxílio do editor; o jogo não desenha esta linha).
  const edge=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[b.minX,b.minY],[b.maxX,b.minY],[b.maxX,b.maxY],[b.minX,b.maxY]].map(([x,z])=>new THREE.Vector3(x,.04,z))),new THREE.LineBasicMaterial({color:0xd4af37}));
  edge.userData.noLift=true;live.markers.add(edge);
  const ring=(x,z,r,color)=>{
   const m=new THREE.Mesh(new THREE.RingGeometry(Math.max(.05,r-.07),r,40),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.05,z);live.markers.add(m);
   const beam=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.6,6).translate(0,1.3,0),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5,depthWrite:false}));beam.position.set(x,0,z);live.markers.add(beam);
  };
  ring(flat.start.x,flat.start.y,.7,0x6fb7ff);
  for(const p of points||[])ring(p.x,p.y,.9,0xd4af37);
  for(const s of flat.spawns)ring(s.x,s.y,Math.max(.7,.55*Math.sqrt(s.count)+.4),0xe0605a);
  liftScenery(live.markers.children,live.probe);live.markers.visible=showMarkers;
 }
 const changedSig=(key,sig)=>{if(sigs.get(key)===sig)return false;sigs.set(key,sig);return true;};
 function update({flat,points,solo}){
  const t=performance.now(),terrainKey=flat.terrain?JSON.stringify(flat.terrain):'';let rebuilt=0;
  const bridges=JSON.stringify(flat.objects.filter(o=>PROPS[o.type]?.bridge));
  if(live.probeKey!==terrainKey+bridges){live.probeKey=terrainKey+bridges;live.probe=toArena({...flat,objects:flat.objects.filter(o=>PROPS[o.type]?.bridge)},{cover:false});}
  live.collision=null;
  const cave=caveFloor(flat),byKey=new Map();let soloObject=null;
  for(const o of flat.objects){
   if(GROUND_TYPES.has(o.type))continue;
   if(SCENE_TYPES.has(o.type)){if(!cave){if(!byKey.has('scene'))byKey.set('scene',[]);byKey.get('scene').push(o);}continue;}
   if(o.id===solo){soloObject=o;continue;}
   if(!byKey.has(o.type))byKey.set(o.type,[]);byKey.get(o.type).push(o);
  }
  // Chão: refeito na hora quando muda o que ele desenha; a sombra de contato das peças espera a edição assentar.
  const groundSig=JSON.stringify([flat.size,flat.biome,flat.style,terrainKey,flat.objects.filter(o=>GROUND_TYPES.has(o.type)||cave&&SCENE_TYPES.has(o.type))]);
  // Com o botão pressionado, a trilha acompanha pelo contorno e o chão é repintado ao soltar.
  if(changedSig('ground',groundSig)){if(toolHeld&&live.layers.has('ground'))groundDue=1;else{buildGround(flat);rebuilt++;sigs.set('contact',null);}}
  const contactSig=JSON.stringify(flat.objects.filter(o=>PROPS[o.type]?.solid).map(o=>[o.x,o.y,o.r,o.w,o.d]));
  if(sigs.get('contact')===null)sigs.set('contact',contactSig);else if(changedSig('contact',contactSig))groundDue=performance.now()+GROUND_REFRESH;
  for(const [key,objects] of byKey)if(changedSig('layer:'+key,JSON.stringify([terrainKey,bridges,objects]))){buildObjects(key,flat,objects);rebuilt++;}
  for(const key of [...live.layers.keys()])if(key!=='ground'&&key!=='solo'&&!byKey.has(key))dropLayer(key);
  for(const key of [...sigs.keys()])if(key.startsWith('layer:')&&!byKey.has(key.slice(6)))sigs.delete(key);
  if(soloObject){if(changedSig('solo',JSON.stringify([terrainKey,bridges,soloObject]))){buildObjects('solo',flat,[soloObject]);rebuilt++;}}
  else if(live.layers.has('solo'))dropLayer('solo');
  if(changedSig('markers',JSON.stringify([terrainKey,flat.size,flat.start,flat.spawns.map(s=>[s.x,s.y,s.count]),points])))buildMarkers(flat,points);
  if(!player.placed){place(flat.start);camTarget.set(player.x,0,player.y);player.placed=true;}
  if(rebuilt){timing.updateMs=performance.now()-t;timing.layers=rebuilt;}
 }
 // Colisão do mapa inteiro só quando alguém anda: arrastar peças não paga por isso.
 function collision(){return live.collision??=(toArena(current.flat,{cover:false}));}
 function place(p){
  const q=resolvePosition(p,PLAYER_RADIUS,collision());player.x=q.x;player.y=q.y;player.angle=0;if(!freeCamera)camTarget.set(q.x,0,q.y);
 }
 // Chamado pelo editor a cada alteração; a atualização acontece no próximo quadro (várias alterações viram uma).
 function setMap(state){current=state;if(live)pending=state;}

 // --- Auxiliares de edição ---
 const groundY=(x,z)=>live?groundAt(live.probe,x,z):0;
 function placeBox(box,b){
  box.visible=!!b;if(!b)return;
  box.rotation.y=b.angle||0;box.position.set((b.x0+b.x1)/2,(b.y0+b.y1)/2,(b.z0+b.z1)/2);box.scale.set(Math.max(.05,b.x1-b.x0),Math.max(.05,b.y1-b.y0),Math.max(.05,b.z1-b.z0));
 }
 function linePath(points,color,closed=false){
  const pts=points.map(([x,z])=>new THREE.Vector3(x,groundY(x,z)+.08,z)),geometry=new THREE.BufferGeometry().setFromPoints(pts),material=new THREE.LineBasicMaterial({color,depthTest:false,transparent:true});
  const line=closed?new THREE.LineLoop(geometry,material):new THREE.Line(geometry,material);line.renderOrder=29;return line;
 }
 const circlePoints=(x,y,r,n=48)=>Array.from({length:n},(_,i)=>[x+Math.cos(i/n*Math.PI*2)*r,y+Math.sin(i/n*Math.PI*2)*r]);
 function buildGhost(type){
  live.ghostType=type;disposeTree(live.ghost);if(!type||!PROPS[type]||GROUND_TYPES.has(type)||SCENE_TYPES.has(type)||!current)return;
  const def=PROPS[type],o={id:'ghost',type,x:0,y:0,...(def.shape==='box'?{w:def.w,d:def.d}:{r:def.r}),...(def.h?{h:def.h}:{}),...(def.s?{s:def.s}:{})};
  try{const arena=partial(current.flat,[o]);for(const m of [...buildExpedition({...arena,layer:'objects'},models),...plainSolids(arena)])live.ghost.add(m);}catch(error){console.warn(error);}
 }
 // `state`: selection {bounds,handles}, hoverBounds, ring, rect, line, ghost {type,x,y}.
 function setOverlay(state){overlay=state;}
 function applyOverlay(){
  const s=overlay||{};placeBox(live.box,s.selection?.bounds);placeBox(live.hoverBox,s.hoverBounds);
  if(live.ghostType!==(s.ghost?.type||null))buildGhost(s.ghost?.type||null);
  live.ghost.visible=!!s.ghost&&live.ghost.children.length>0;if(s.ghost)live.ghost.position.set(s.ghost.x,PROPS[s.ghost.type]?.float?0:groundY(s.ghost.x,s.ghost.y),s.ghost.y);
  const key=JSON.stringify([s.ring,s.rect,s.line,s.selection?.handles]);
  if(key!==overlayKey){
   overlayKey=key;disposeTree(live.guides);disposeTree(live.handles);
   if(s.ring)live.guides.add(linePath(circlePoints(s.ring.x,s.ring.y,s.ring.r),s.ring.color??0xffffff,true));
   if(s.rect)live.guides.add(linePath([[s.rect.x-s.rect.w/2,s.rect.y-s.rect.d/2],[s.rect.x+s.rect.w/2,s.rect.y-s.rect.d/2],[s.rect.x+s.rect.w/2,s.rect.y+s.rect.d/2],[s.rect.x-s.rect.w/2,s.rect.y+s.rect.d/2]],0xffe27a,true));
   if(s.line?.length>1)live.guides.add(linePath(s.line,0xbfe6ff));
   for(const h of s.selection?.handles||[]){
    const m=new THREE.Mesh(live.handleGeometry,new THREE.MeshBasicMaterial({color:HANDLE_COLORS[h.kind]||0xffffff,depthTest:false,transparent:true}));
    m.position.set(h.x,groundY(h.x,h.y)+h.up,h.y);m.renderOrder=31;m.userData.handle=h;m.userData.noDispose=true;live.handles.add(m);
   }
  }
  const size=view.zoom*.014;for(const m of live.handles.children)m.scale.setScalar(size);
 }

 // --- Entrada ---
 function infoOf(e){
  const r=live.canvas.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
  live.raycaster.setFromCamera(new THREE.Vector2(px/r.width*2-1,-(py/r.height*2-1)),live.camera);
  const ray=live.raycaster.ray,point=new THREE.Vector3();if(!ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),point))return null;
  // Refina o ponto contra o relevo, como a mira do jogo.
  if(live.probe.terrain)for(let i=0;i<3;i++){const level=new THREE.Plane(new THREE.Vector3(0,1,0),-groundY(point.x,point.z));if(!ray.intersectPlane(level,point))break;}
  return {point:{x:point.x,y:point.z},ray:{ox:ray.origin.x,oy:ray.origin.y,oz:ray.origin.z,dx:ray.direction.x,dy:ray.direction.y,dz:ray.direction.z},px,py,shift:e.shiftKey,alt:e.altKey};
 }
 function handleAt(px,py){
  const r=live.canvas.getBoundingClientRect();let best=null,bestD=HANDLE_PICK;
  for(const m of live.handles.children){const p=m.position.clone().project(live.camera),d=Math.hypot((p.x+1)*r.width/2-px,(1-p.y)*r.height/2-py);if(d<bestD){bestD=d;best=m.userData.handle;}}
  return best;
 }
 function panBy(dx,dy){
  const units=2*view.zoom/live.size.h,fx=-Math.sin(view.yaw),fz=-Math.cos(view.yaw),rx=Math.cos(view.yaw),rz=-Math.sin(view.yaw),k=units/Math.max(.2,Math.sin(view.pitch));
  camTarget.x+=-dx*units*rx+dy*k*fx;camTarget.z+=-dx*units*rz+dy*k*fz;
 }
 function setFree(on){freeCamera=on;free.checked=on;}
 function setTop(on){
  if(!!topView===!!on)return;
  if(on){
   topView={...view};const m=current?.flat.size||{w:40,h:40},aspect=(live?.size.w||1)/(live?.size.h||1);
   Object.assign(view,{yaw:0,pitch:TOP_PITCH,zoom:clamp(Math.max(m.h,m.w/aspect)/2*1.06,MIN_ZOOM,MAX_ZOOM)});setFree(true);camTarget.set(0,0,0);
  }else{Object.assign(view,topView);topView=null;}
  topButton.classList.toggle('on',!!on);
 }
 function bindCanvas(canvas){
  let drag=null;
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{
   canvas.focus({preventScroll:true});try{canvas.setPointerCapture(e.pointerId);}catch{}
   if(e.button===1){setFree(true);drag={pan:true,x:e.clientX,y:e.clientY};return;}
   if(e.button===2){drag={orbit:true,x:e.clientX,y:e.clientY};return;}
   if(e.button!==0)return;
   const info=infoOf(e);if(!info)return;
   const handle=handleAt(info.px,info.py);
   if(handle&&hooks.handleDown?.(handle,info)){drag={tool:true};toolHeld=true;return;}
   // Sem nada sob o ponteiro, arrastar com o esquerdo gira a câmera.
   drag=hooks.down?.(info)?{tool:true}:{orbit:true,x:e.clientX,y:e.clientY};toolHeld=!!drag.tool;
  });
  canvas.addEventListener('pointermove',e=>{
   if(!drag){hoverInfo=e;return;}
   if(drag.pan){panBy(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;return;}
   if(drag.orbit){
    if(topView){topView=null;topButton.classList.remove('on');}
    view.yaw-=(e.clientX-drag.x)*.008;view.pitch=clamp(view.pitch+(e.clientY-drag.y)*.006,.3,1.45);drag.x=e.clientX;drag.y=e.clientY;return;
   }
   const info=infoOf(e);if(info)hooks.move?.(info);
  });
  const end=e=>{const wasTool=drag?.tool;drag=null;toolHeld=false;try{canvas.releasePointerCapture(e.pointerId);}catch{}if(wasTool)hooks.up?.();};
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('pointerleave',()=>{hoverInfo=null;hooks.leave?.();});
  canvas.addEventListener('wheel',e=>{
   e.preventDefault();
   // Zoom no ponto sob o ponteiro: o que está lá continua lá.
   const before=infoOf(e);view.zoom=clamp(view.zoom*Math.exp(e.deltaY*.0012),MIN_ZOOM,MAX_ZOOM);applyCamera();
   if(freeCamera&&before){const after=infoOf(e);if(after){camTarget.x+=before.point.x-after.point.x;camTarget.z+=before.point.y-after.point.y;applyCamera();}}
  },{passive:false});
  canvas.addEventListener('dblclick',e=>{if(freeCamera||hooks.toolActive?.())return;const info=infoOf(e);if(info)place(info.point);});
  canvas.addEventListener('keydown',e=>{
   if(e.ctrlKey||e.metaKey||e.altKey)return;
   if(KEYS[e.code]){if(hooks.keepKey?.(e.code))return;held.add(e.code);e.preventDefault();e.stopPropagation();}
   else if(e.code==='KeyC'){free.checked=!free.checked;free.onchange();e.stopPropagation();}
   else if(e.code==='KeyT'){setTop(!topView);e.stopPropagation();}
  });
  canvas.addEventListener('keyup',e=>{held.delete(e.code);});
  canvas.addEventListener('blur',()=>held.clear());
 }

 function resize(){
  if(!live)return;const w=holder.clientWidth,h=holder.clientHeight;if(!w||!h)return;
  live.size={w,h};live.renderer.setSize(w,h,false);
 }
 // Câmera ortográfica orbital; os valores iniciais reproduzem a câmera do jogo. De longe, ela recua e a névoa acompanha, para o mapa inteiro caber.
 function applyCamera(){
  const aspect=live.size.w/live.size.h,cp=Math.cos(view.pitch),distance=Math.max(CAMERA_DISTANCE,view.zoom*2),k=distance/CAMERA_DISTANCE;
  Object.assign(live.camera,{left:-view.zoom*aspect,right:view.zoom*aspect,top:view.zoom,bottom:-view.zoom,near:.1,far:distance*3.5});live.camera.updateProjectionMatrix();
  live.camera.position.set(camTarget.x+Math.sin(view.yaw)*cp*distance,camTarget.y+Math.sin(view.pitch)*distance,camTarget.z+Math.cos(view.yaw)*cp*distance);live.camera.lookAt(camTarget);
  live.camera.updateMatrixWorld();
  live.scene.fog.near=topView?1e6:live.fog.near*k;live.scene.fog.far=topView?2e6:live.fog.far*k;
 }

 // --- Quadro ---
 function frame(now){
  raf=requestAnimationFrame(frame);const dt=Math.min(.1,Math.max(0,(now-last)/1000));timing.frameMs+=(now-last-timing.frameMs)*.05;last=now;
  if(!live||!live.size.w)return;
  if(pending){const state=pending;pending=null;try{update(state);say('');}catch(error){console.error(error);say('Não foi possível montar a vista 3D: '+error.message);}}
  if(!current||!live.layers.has('ground'))return;
  // A repintura espera o botão ser solto, para não engasgar um arraste em andamento.
  if(groundDue&&now>groundDue&&!pending&&!toolHeld){try{buildGround(current.flat);}catch(error){console.error(error);}}
  if(hoverInfo){const e=hoverInfo;hoverInfo=null;const info=infoOf(e);if(info){hooks.hover?.(info);live.canvas.style.cursor=handleAt(info.px,info.py)?'grab':'';}}
  applyOverlay();
  // Direção de andar relativa à câmera: "para a frente" é para onde ela olha.
  let ix=0,iy=0;for(const code of held){ix+=KEYS[code][0];iy+=KEYS[code][1];}
  const len=Math.hypot(ix,iy),fx=-Math.sin(view.yaw),fz=-Math.cos(view.yaw),rx=Math.cos(view.yaw),rz=-Math.sin(view.yaw);
  player.moving=false;
  if(len){
   const dx=(rx*ix+fx*iy)/len,dz=(rz*ix+fz*iy)/len;
   if(freeCamera){const speed=FREE_SPEED*Math.max(1,view.zoom/11);camTarget.x+=dx*speed*dt;camTarget.z+=dz*speed*dt;}
   else{const arena=collision(),k=terrainSpeed(arena,player.x,player.y,dx,dz),m=moveCircle(player,{x:dx*WALK_SPEED*k*dt,y:dz*WALK_SPEED*k*dt},PLAYER_RADIUS,arena);player.x=m.x;player.y=m.y;player.angle=Math.atan2(dx,dz);player.moving=m.distance>1e-5;}
  }
  const ground=groundY(player.x,player.y);if(!freeCamera)camTarget.set(player.x,ground,player.y);
  updateWater(live.layers.get('ground').group,now/1000);
  const body=live.body;if(body){body.root.position.set(player.x,ground,player.y);body.root.rotation.y=player.angle;body.play(player.moving?'walk':'idle');body.mixer.update(dt);}
  applyCamera();
  live.sun.position.copy(camTarget).add(SUN_OFFSET);live.sun.target.position.copy(camTarget);live.sun.target.updateMatrixWorld();
  updateSceneryFx(live.renderer,live.camera,player,live.lookKey==='custom-forest'||live.cave);
  live.renderer.render(live.scene,live.camera);timing.triangles=live.renderer.info.render.triangles;timing.calls=live.renderer.info.render.calls;
 }
 // Posição em tela de um ponto do mapa; usada por testes e pelas alças.
 function project(x,y,up=0){
  if(!live)return null;const p=new THREE.Vector3(x,groundY(x,y)+up,y).project(live.camera),r=live.canvas.getBoundingClientRect();
  return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};
 }
 const upPerPixel=()=>live?2*view.zoom/live.size.h/Math.max(.2,Math.cos(view.pitch)):0;

 return {root,start,stop,running,setMap,setOverlay,resize,focus:canvasFocus,project,upPerPixel,groundY,stats:()=>({...timing}),setTop,camera:()=>({...view,target:camTarget.toArray()})};
}
