import {paintCaveFloor,buildCaveHideout} from './cave-hideout.mjs';
import * as THREE from 'three';
import {kitFamily} from './village-kit.mjs';
export function buildPrologueScenery(arena,models){
 if(!arena.prologue||!models.caravanKit)return [];
 const out=kitFamily(models.caravanKit,arena.journey?'caravan_open':'caravan_cart',(arena.caravans||[]).map(c=>({x:c.x,z:c.y,ry:c.angle||0,sx:c.sx??1,sy:c.sy??1,sz:c.sz??1})));
 if(arena.journey){
  for(const m of out)m.userData.journeyCart=true;
  const wheels=[];for(const x of [-1.35,1.35])for(const z of [-1.1,1.1])wheels.push({x,y:.65,z:z+80});
  for(const m of kitFamily(models.caravanKit,'caravan_wheel',wheels)){m.userData.journeyWheels=wheels;out.push(m);}
 }
 if(arena.journey||arena.roadBlock||arena.roadBlocks?.length)for(const m of kitFamily(models.caravanKit,'road_block',arena.journey?[{x:0,z:0}]:arena.roadBlock?[{x:arena.roadBlock.x||0,z:arena.roadBlock.y}]:arena.roadBlocks.map(b=>({x:b.x,z:b.y})))){m.userData.journeyBlock=!!arena.journey;m.visible=!arena.journey;out.push(m);}
 if(arena.caravans?.length){
  out.push(...kitFamily(models.caravanKit,'bandit_banner',[{x:7,z:-5}]));
  // Flecha da cena roteirizada: apresentação separada do dano de combate.
  for(const mesh of kitFamily(models.caravanKit,'story_arrow',[{x:0,z:0}])){mesh.userData.prologueArrow=true;mesh.visible=false;out.push(mesh);}
 }
 if(arena.cave||arena.id==='custom-arandu-cave'){
  // Corte de caverna sem teto: a malha rochosa cobre os limites físicos, sem
  // acrescentar obstáculos invisíveis ao percurso central.
  if(models.natureKit){
   const rocks=[];for(const wall of arena.solids.filter(s=>s.look==='cave-boundary')){
    const along=wall.width>=wall.depth,len=along?wall.width:wall.depth,count=Math.max(1,Math.ceil(len/3));
    for(let i=0;i<=count;i++){const offset=-len/2+i*len/count;rocks.push({x:wall.x+(along?offset:0),z:wall.y+(along?0:offset),ry:i*.7,sx:along?3:wall.width*.76,sy:wall.height*1.07,sz:along?wall.depth*.76:3.5});}
   }
   // Continuação rochosa fora dos limites: sem colisões adicionais.
   const b=arena.bounds;
   for(let x=b.minX-70;x<=b.maxX+70;x+=8)for(let y=b.minY-70;y<=b.maxY+70;y+=8){
    if(x>b.minX-5&&x<b.maxX+5&&y>b.minY-5&&y<b.maxY+5)continue;
    const n=Math.sin(x*12.7+y*31.1)*.5+.5;
    rocks.push({x,z:y,ry:n*6,sx:8+n*3,sy:2+n*3,sz:8+n*2});
   }
   for(const mesh of kitFamily(models.natureKit,'rock',rocks)){mesh.name='cave-rock-continuation';out.push(mesh);}
  }
  if(models.caveFallKit)for(const point of arena.decor.misc.filter(m=>m.look==='fall_debris'))out.push(...kitFamily(models.caveFallKit,'collapse_chunk',Array.from({length:7},(_,i)=>({x:point.x+Math.cos(i*2.399)*1.4,z:point.y+Math.sin(i*2.399)*1.2,ry:i*.7,sx:.65,sy:.45,sz:.7}))));
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;paintCaveFloor(canvas,arena);
  out.push(...buildCaveHideout(arena,models));
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(arena.bounds.maxX-arena.bounds.minX,arena.bounds.maxY-arena.bounds.minY),new THREE.MeshStandardMaterial({map:texture,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=.005;floor.receiveShadow=true;floor.userData.replacesGround=true;out.push(floor);

  for(const point of arena.decor.misc.filter(m=>m.look==='capture_note')){
   const paper=new THREE.Mesh(new THREE.PlaneGeometry(.85,.6),new THREE.MeshBasicMaterial({color:0xe2c899,side:THREE.DoubleSide}));paper.rotation.x=-Math.PI/2;paper.position.set(point.x,arena.solids.some(s=>s.look==='hideout-table'&&Math.hypot(s.x-point.x,s.y-point.y)<1)?.997:.06,point.y);out.push(paper);
   const mark=new THREE.Mesh(new THREE.RingGeometry(1.1,1.2,32),new THREE.MeshBasicMaterial({color:0xe6c17c,transparent:true,opacity:.7,side:THREE.DoubleSide}));mark.rotation.x=-Math.PI/2;mark.position.set(point.x,.08,point.y);out.push(mark);
  }
  for(const point of arena.decor.misc.filter(m=>m.look==='cave_exit')){const exit=new THREE.Mesh(new THREE.RingGeometry(1.5,1.65,32),new THREE.MeshBasicMaterial({color:0xa9ddc9,side:THREE.DoubleSide}));exit.rotation.x=-Math.PI/2;exit.position.set(point.x,.08,point.y);out.push(exit);}

 }

 return out;
}
export function updatePrologueScenery(scenery,w){
 const r=w.adventure;if(r?.kind!=='prologue')return;
 for(const o of scenery.children){
  if(o.userData.caveGlow)o.material.opacity=.23+Math.sin(w.time*3.5+o.userData.glowPhase)*.015;
  const j=r.journey;
  if(j&&o.userData.journeyCart){o.position.set(0,j.bob,j.y-80);}
  if(j&&o.userData.journeyWheels){const mat=new THREE.Matrix4(),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-j.distance/.65);for(const [i,p] of o.userData.journeyWheels.entries()){mat.compose(new THREE.Vector3(p.x,p.y+j.bob,j.y+p.z-80),q,new THREE.Vector3(1,1,1));o.setMatrixAt(i,mat);}o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();}
  if(j&&o.userData.journeyBlock){o.visible=j.braking;o.position.z=j.blockY||0;}
  if(o.userData.prologueHole)o.visible=(r.fall||0)>0;
  if(o.userData.prologueArrow){const shot=r.shot;o.visible=!!shot?.visible;if(shot){o.position.set(shot.x,1.1,shot.y);o.rotation.y=Math.atan2(shot.to.x-shot.from.x,shot.to.y-shot.from.y);}}
 }
}
export function positionTravelSpeech(camera,w,canvas){
 const host=document.getElementById('campaign-panel');if(host?.dataset.view!=='travel-dialogue')return;
 const speaker=w.actors.find(a=>a.key===host.dataset.speaker)||w.player;if(!speaker)return;
 const p=new THREE.Vector3(speaker.x,(speaker.jumpZ||0)-(w.adventure?.journey?.bob||0)+1.8,speaker.y).project(camera),r=canvas.getBoundingClientRect(),half=Math.min(195,r.width/2-16);
 const x=Math.max(half+12,Math.min(r.width-half-12,(p.x+1)*r.width/2)),anchor=(1-p.y)*r.height/2;
 const y=Math.max(host.offsetHeight+65,Math.min(r.height-35,anchor-12));
 host.style.setProperty('--speech-x',Math.round(x)+'px');host.style.setProperty('--speech-y',Math.round(y)+'px');
}
