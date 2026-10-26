// Presentation-only bindings for Blender reference characters. No combat stats or actor types change.
(function(){
'use strict';
const catalogue=window.ReferenceCharacterCatalog||{},overrides=new Map(),pending=new Map(),states=new WeakMap();
const allowed={specter:['skeleton_mage'],mage:['skeleton_mage'],soldier:['raider'],brute:['corrupted'],cryptHound:['shadow_wolf']};
const defaults={specter:'skeleton_mage',mage:'skeleton_mage',soldier:'raider',brute:'corrupted',cryptHound:'shadow_wolf'},disabled=new Set(),scheduled=new Map();
function ensure(role){
 if(disabled.has(role)||!defaults[role])return Promise.resolve();
 if(scheduled.has(role))return scheduled.get(role);
 const promise=load(defaults[role]).then(key=>{if(!disabled.has(role)&&!overrides.has(role))overrides.set(role,key);return key;}).catch(error=>{console.warn(error.message);return null;});
 scheduled.set(role,promise);return promise;
}
function load(id){
 const key='reference_'+id;if(SPR.ready(key))return Promise.resolve(key);if(pending.has(id))return pending.get(id);
 const entry=catalogue[id];if(!entry)return Promise.reject(new Error('Unknown character visual: '+id));
 const promise=new Promise((resolve,reject)=>{const sheet={ok:false,img:new Image(),meta:entry.meta};sheet.img.onload=()=>{sheet.ok=true;resolve(key);};sheet.img.onerror=()=>{delete SPR.sheets[key];pending.delete(id);reject(new Error('Character atlas failed: '+id));};sheet.img.src=entry.b64?'data:image/webp;base64,'+entry.b64:entry.url;SPR.sheets[key]=sheet;});pending.set(id,promise);return promise;
}
window.CharacterVisuals={
 available:allowed,defaults:{...defaults},
 preload(){return Promise.all(Object.keys(defaults).map(ensure));},
 async set(role,id){if(!allowed[role]?.includes(id))throw new Error('Incompatible visual role: '+role+'/'+id);const key=await load(id);disabled.delete(role);overrides.set(role,key);return key;},
 reset(role){disabled.add(role);overrides.delete(role);},
 active(){return Object.fromEntries(overrides);}
};
let summonedAt=-Infinity,lastCastAt=-Infinity,lastCastColor='';
const cast=castAnim;
castAnim=function(tx,tz,color){const result=cast.apply(this,arguments);lastCastAt=time;lastCastColor=color;return result;};
const spawn=spawnMinion;
spawnMinion=function(...args){const result=spawn.apply(this,args);if(result)summonedAt=time;return result;};
// The supplied pose stays intact. Hammer arm, free arm and a small body sway
// move independently around pivots cut from those same pixels.
function animateStaticSprite(key,ref,o){
 const sheet=SPR.sheets[key],m=sheet.meta,parts=m.parts;
 if(!parts)return draw(key,ref,{...o,anim:'idle',animTime:0,face:0,attacking:false});
 const x=sx(ref.x),y=sy(ref.y),k=S/m.ppu*(o.scale||1.05),C=m.cell;
 const dx=x-m.anchorX*k,dy=y-m.anchorY*k,size=C*k,cycle=time%9;
 const sway=Math.sin(time*2.2+(ref.phase||0))*.018;
 let bodyAngle=sway,hammerAngle=.18,freeAngle=0;
 if(o.attacking){const wave=(Math.sin(time*5)+1)*.5;freeAngle=-1.05*wave;bodyAngle+=Math.sin(time*5)*.045;hammerAngle=0;}
 else if(cycle>5){const swing=Math.sin(Math.min(1,(cycle-5)/3)*Math.PI);hammerAngle=.18-1.35*swing;}
 shadow(x,y,o.shadow||.45);
 if(ref.hit>0)ctx.filter='brightness(1.8) saturate(.6)';
 const smooth=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
 ctx.save();ctx.translate(x,y);ctx.rotate(bodyAngle);ctx.translate(-x,-y);
 ctx.drawImage(sheet.img,0,parts.body.row*C,C,C,dx,dy,size,size);
 limb(parts.freeArm,freeAngle);limb(parts.hammer,hammerAngle);
 function limb(part,angle){
  const px=dx+part.pivot[0]*k,py=dy+part.pivot[1]*k;
  ctx.save();ctx.translate(px,py);ctx.rotate(angle);ctx.translate(-px,-py);
  ctx.drawImage(sheet.img,0,part.row*C,C,C,dx,dy,size,size);ctx.restore();
 }
 ctx.restore();ctx.imageSmoothingEnabled=smooth;
 if(ref.hit>0)ctx.filter='none';
}
const draw=drawSprite;
drawSprite=function(key,ref,options){
 let o=options||{};const originalKey=key;
 if(defaults[key]&&!overrides.has(key)&&!disabled.has(key))ensure(key);
 key=overrides.get(key)||key;
 const sheet=SPR.sheets[key],a=sheet?.meta.anims;if(!a)return draw(key,ref,o);
 // The supplied Bram sheet contains exactly one real pose, never fabricated directions.
 if(sheet.meta.staticReference){animateStaticSprite(key,ref,o);return;}
 let state=states.get(ref);if(!state){state={hit:0,hurtAt:-Infinity};states.set(ref,state);}
 if((ref.hit||0)>state.hit+.001)state.hurtAt=time;state.hit=ref.hit||0;
 if(originalKey==='cryptHound'&&ref.ability&&!ref.dead&&!o.deadT){
  const ability=ref.ability;o={...o,anim:ability.phase==='charge'?'charge':ability.phase==='recover'?'recover':'windup',animTime:ability.time,face:Math.atan2(ability.dy,ability.dx)};
 }
 if(!o.anim){
  if(o.dead&&a.death){const duration=ref._reviveTime||MINION_REVIVE_TIME;const elapsed=Math.max(0,duration-(ref.deadTimer||0));o={...o,dead:false,deadT:Math.max(.001,elapsed)};}
  else if(!o.deadT&&!ref.dead){
   if(originalKey==='necro'&&playerDash.time>0&&a.dash)o={...o,anim:'dash',animTime:Math.max(0,.18-playerDash.time),face:Math.atan2(playerDash.dy,playerDash.dx)};
   else if(originalKey==='necro'&&ref.swing>0&&time-lastCastAt<.4){
    const anim=['#ff5522','#a65465'].includes(lastCastColor)?'nova':['#e8e0c0','#a5b778'].includes(lastCastColor)?'channel':'cast';
    if(a[anim])o={...o,anim,animTime:Math.max(0,Math.min(1,1-ref.swing/.28))*(a[anim].n-.01)/a[anim].fps};
   }
   else if(a.spawn&&ref.spawn>0)o={...o,anim:'spawn',animTime:Math.max(0,.6-ref.spawn)};
   else if(originalKey==='necro'&&a.summon&&time-summonedAt<.5)o={...o,anim:'summon',animTime:Math.max(0,time-summonedAt)};
   else if(a.hurt&&time-state.hurtAt<.22)o={...o,anim:'hurt',animTime:Math.max(0,time-state.hurtAt)};
   else if(originalKey==='smith'){
    // One facing. Idle and the wave travel out and back, so the last pose does not snap to the first.
    const facing=sheet.meta.dirs===1?0:o.face;
    const swing=(anim,t)=>{const n=anim.n,fps=anim.fps,span=Math.max(1,n*2-2),step=Math.floor(t*fps)%span,frame=step<n?step:span-step;return (frame+.001)/fps;};
    if(o.attacking&&a.greet)o={...o,anim:'greet',animTime:swing(a.greet,time),face:facing,attacking:false};
    else if(a.idle&&a.hammer&&a.recover){
     // Each phase starts on the pose the previous one ended on: a full breath returns to idle frame 0,
     // the pickup is the recover hand-swap reversed, and recover replaces the rest clip's last frame,
     // which jumps straight from leaning to standing.
     const idle=a.idle,rest=a.hammer,recover=a.recover;
     const breath=(idle.n*2-2)/idle.fps,pickup=(recover.n-recover.pickup)/recover.fps,lean=(rest.n-1)/rest.fps,rise=recover.n/recover.fps;
     let t=time%(breath+pickup+lean+rise);
     if(t<breath)o={...o,anim:'idle',animTime:swing(idle,t),face:facing};
     else if((t-=breath)<pickup)o={...o,anim:'recover',animTime:(recover.n-1-Math.floor(t*recover.fps)+.001)/recover.fps,face:facing};
     else if((t-=pickup)<lean)o={...o,anim:'hammer',animTime:t,face:facing};
     else o={...o,anim:'recover',animTime:t-lean,face:facing};
    }
    else if(a.idle)o={...o,anim:'idle',animTime:swing(a.idle,time),face:facing};
    else o={...o,face:facing};
   }
  }
 }
 return draw(key,ref,o);
};
})();
