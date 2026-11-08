// Apresentação das passagens e das grades de uma área: só desenho. Quem decide atravessar ou abrir é `campaign-world.mjs`.
import * as THREE from 'three';
import {groundAt} from './map-terrain.mjs';
import {kitFamily} from './village-kit.mjs';

// A grade sobe só o bastante para o topo entrar na alvenaria da portaria (7,2 u) e o vão ficar livre para quem passa.
const GATE_LIFT=2.6;
// Anel verde-água no chão: a mesma cor do mapa da área, para o jogador ligar uma coisa à outra.
export function buildAreaScenery(arena,models){
 const out=[];
 for(const e of arena.exits||[]){
  const y=groundAt(arena,e.x,e.y)+.07,ring=new THREE.Mesh(new THREE.RingGeometry(e.r-.16,e.r,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xa9ddc9,transparent:true,opacity:.8,depthWrite:false})),glow=new THREE.Mesh(new THREE.CircleGeometry(e.r-.16,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xa9ddc9,transparent:true,opacity:.12,depthWrite:false}));
  for(const m of [ring,glow]){m.position.set(e.x,y,e.y);m.renderOrder=2;m.userData.noLift=true;out.push(m);}
  ring.userData.exitPulse=glow.userData.exitPulse=e.x+e.y;glow.userData.exitBase=.12;ring.userData.exitBase=.8;
 }
 if(models?.fortKit)for(const g of arena.gates||[])for(const m of kitFamily(models.fortKit,'fort_portcullis',[{x:g.x,z:g.y,sx:g.width/4.8,sy:g.height/4.4,sz:1}])){
  const base=groundAt(arena,g.x,g.y);m.position.y=base+(g.open?GATE_LIFT:0);m.userData.noLift=true;m.userData.gateId=g.id;m.userData.gateBase=base;m.userData.gateLift=GATE_LIFT;out.push(m);
 }
 return out;
}
const RAISE_SPEED=1.1;
export function updateAreaScenery(list,w,dt){
 for(const o of list){
  if(o.userData.exitBase!==undefined)o.material.opacity=o.userData.exitBase*(.72+Math.sin(w.time*2.4+o.userData.exitPulse)*.28);
  else if(o.userData.gateId){const gate=w.arena.gates?.find(g=>g.id===o.userData.gateId),target=o.userData.gateBase+(gate?.open?o.userData.gateLift:0);if(o.position.y!==target){const step=RAISE_SPEED*Math.max(dt,0);o.position.y=Math.abs(target-o.position.y)<=step?target:o.position.y+Math.sign(target-o.position.y)*step;}}
 }
}
