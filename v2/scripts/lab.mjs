// Laboratório: arena vazia com boneco de treino (medidor de DPS) e visualizador de modelos/animações.
// Reaproveita o personagem, a horda e o equipamento atuais; nada aqui é salvo e nenhuma regra de combate muda.
import {clean,emptyArena} from './campaign.mjs';
import {resolvePosition} from './terrain.mjs';
import R from './horde-rules.mjs';
import {createMeter,resetMeter,record,stats,tick,clipProgress,modelLabel} from './lab-model.mjs';
export const DUMMY_HP=1e12,MAX_DUMMIES=5,VIEWER_POS={x:-7,y:-3},FLOATER_LIFE=1.1,FLOATER_LIMIT=40;
// Resultados de testes cronometrados desta sessão do navegador (não entram no save).
export const history=[];
export const isLab=s=>s.scene==='training'&&s.world.adventure?.kind==='lab';
const labelOf=(w,source)=>!source?'Outros':source===w.player?'Zephyr':source.groupType?R.defs[source.groupType].name:source.type?.name||'Outros';

export function launchLab(s){
 if(!['village','menu'].includes(s.scene))return false;
 clean(s,emptyArena('lab'),{x:0,y:8});
 const w=s.world;s.scene='training';w.paused=false;w.adventure={kind:'lab',done:false,queue:[]};w.portal=null;
 w.lab={meter:createMeter(),floaters:[],viewer:null,focus:true,infiniteMana:false,noCooldown:false,dummyCount:1};
 w.onDummyHit=(target,amount,source,tag)=>{
  const lab=w.lab;if(!lab||!isLab({scene:'training',world:w}))return;
  record(lab.meter,w.time,amount,tag||labelOf(w,source));
  target.hitTime=w.time;const dx=target.x-(source?.x??target.x),dy=target.y-(source?.y??target.y),d=Math.hypot(dx,dy)||1;target.hitDir={x:dx/d,y:dy/d};
  lab.floaters.push({id:w.nextId++,x:target.x,y:target.y,amount:Math.round(amount),time:w.time});if(lab.floaters.length>FLOATER_LIMIT)lab.floaters.shift();
 };
 setDummies(w,1);return true;
}

const dummies=w=>w.actors.filter(a=>a.labDummy);
// Bonecos em fila à frente do personagem. Vida enorme e restaurada a cada quadro: nunca morre nem dá recompensa.
export function setDummies(w,count,at=null){
 count=Math.max(1,Math.min(MAX_DUMMIES,Math.floor(count)||1));
 const base=at||dummies(w)[0]||{x:0,y:-2};w.actors=w.actors.filter(a=>!a.labDummy);
 for(let i=0;i<count;i++){
  const pos=resolvePosition({x:base.x+(i-(count-1)/2)*2.2,y:base.y},.5,w.arena);
  w.actors.push({id:w.nextId++,model:'woodDummy',team:'enemy',...pos,radius:.5,hp:DUMMY_HP,maxHp:DUMMY_HP,angle:Math.PI/4,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,phase:0,dummy:true,labDummy:true,type:{name:'Boneco de treino'},lootTier:'common'});
 }
 w.lab.dummyCount=count;return count;
}
// Leva o boneco central até o ponto de mira, dentro da arena.
export function moveDummies(w,point){if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;setDummies(w,w.lab.dummyCount,point);return true;}

// Medidor: zera, ou arma um teste cronometrado (`duration` em s) que também enche a mana e as recargas do personagem.
export function resetTest(w,duration=0){
 const lab=w.lab;resetMeter(lab.meter,duration>0?duration:null);lab.floaters=[];lab.testLabel='';
 if(duration>0){w.player.mp=w.player.maxMp;clearCooldowns(w);}
}
function clearCooldowns(w){
 w.castCooldown=0;w.dash.cooldown=0;for(const k of Object.keys(w.spellCooldowns))w.spellCooldowns[k]=0;
 if(w.army)for(const k of Object.keys(w.army.cooldowns))w.army.cooldowns[k]=0;
 for(const a of w.actors)if(a.groupType)a.abilityCooldown=0;
}
export function setOptions(w,{infiniteMana,noCooldown}){const lab=w.lab;if(infiniteMana!==undefined)lab.infiniteMana=!!infiniteMana;if(noCooldown!==undefined)lab.noCooldown=!!noCooldown;}
export function meterStats(w){return stats(w.lab.meter,w.time);}

// Visualizador: um ator neutro (sem IA, fora da horda) que mostra um clipe por vez, controlado por `labPose`.
export function setViewer(w,model,clips=[]){
 const lab=w.lab;w.actors=w.actors.filter(a=>!a.labViewer);lab.viewer=null;if(!model){w.focus=null;return null;}
 const pos=resolvePosition(VIEWER_POS,.5,w.arena),first=clips.find(c=>c.name==='idle')||clips[0]||null;
 const actor={id:w.nextId++,model,team:'neutral',...pos,radius:.5,hp:1,maxHp:1,angle:Math.PI/4,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,phase:0,dummy:true,labViewer:true,type:{name:modelLabel(model)}};
 w.actors.push(actor);
 lab.viewer={actor,model,clips,clip:first?.name||null,duration:first?.duration||1,time:0,playing:true,loop:true,speed:1,spin:false,heading:Math.PI/4,sequence:false};
 return lab.viewer;
}
export function setClip(w,name){
 const v=w.lab.viewer;if(!v)return false;const c=v.clips.find(x=>x.name===name);if(!c)return false;
 v.clip=c.name;v.duration=c.duration||1;v.time=0;v.playing=true;return true;
}
export function scrub(w,progress){const v=w.lab.viewer;if(!v)return false;v.playing=false;v.sequence=false;v.time=Math.max(0,Math.min(1,progress))*v.duration;return true;}
// Reproduz todos os clipes em sequência, uma vez cada, e depois volta ao laço do último.
export function playAll(w){const v=w.lab.viewer;if(!v||!v.clips.length)return false;v.sequence=true;v.loop=false;v.playing=true;setClip(w,v.clips[0].name);return true;}

export function tickLab(s,dt){
 if(!isLab(s))return;const w=s.world,lab=w.lab;if(!lab||w.paused||!(dt>0))return;
 for(const d of dummies(w))d.hp=d.maxHp;
 if(lab.infiniteMana)w.player.mp=w.player.maxMp;
 if(lab.noCooldown)clearCooldowns(w);
 lab.floaters=lab.floaters.filter(f=>w.time-f.time<FLOATER_LIFE);
 const m=lab.meter;tick(m,w.time);
 if(m.done&&!m.saved){m.saved=true;const r=stats(m,w.time);history.push({id:history.length+1,label:lab.testLabel||'Teste '+(history.length+1),duration:m.test.duration,dps:r.average,peak:r.peak,total:r.total,hits:r.hits,level:s.save.character.level,by:r.by.slice(0,3).map(x=>x.name+' '+Math.round(x.share*100)+'%').join(' · ')});}
 const v=lab.viewer;
 if(v){
  if(v.playing){
   v.time+=dt*v.speed;
   if(!v.loop&&v.time>=v.duration){
    const i=v.clips.findIndex(c=>c.name===v.clip);
    if(v.sequence&&i+1<v.clips.length)setClip(w,v.clips[i+1].name);
    else{v.time=v.duration;v.playing=false;if(v.sequence){v.sequence=false;v.loop=true;}}
   }
  }
  if(v.spin)v.heading+=dt*.9;
  v.actor.angle=v.heading;
  v.actor.labPose=v.clip?{anim:v.clip,progress:clipProgress(v.time,v.duration,v.loop),face:v.heading}:null;
  w.focus=lab.focus?{x:v.actor.x,y:v.actor.y}:null;
 }else w.focus=null;
}
