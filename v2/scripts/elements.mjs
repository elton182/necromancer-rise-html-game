// Acúmulos elementais comuns a todas as origens. Apenas dano aplicado cria cargas.
import {fx} from './vfx-events.mjs';
export const ELEMENTS={cap:5,burnTime:4,burnTick:.5,burnShare:.04,frostTime:4,slowPerStack:.08,freezeTime:1.5,bossFreeze:.5};
export const isFrozen=(w,a)=>!!a&&a.freezeUntil>w.time;
export function clearElement(a,time=0){
 if(a.freezeUntil>time&&(a.rootTime||0)<=a.freezeUntil-time+.001)a.rootTime=0;
 if(a.elementSlow&&a.slow===a.elementSlow){a.slow=0;a.slowTime=0;}
 for(const k of ['fireStacks','burnUntil','burnNext','burnDamage','burnSource','frostStacks','frostUntil','freezeUntil','freezeImmuneUntil','elementLabel','elementSlow'])delete a[k];
}
export function clearElements(w){for(const a of w.actors||[])clearElement(a,w.time);delete w.elementTickAt;w.effects=(w.effects||[]).filter(e=>!e.elementStatus);}
export function applyElement(w,a,element,damage,source){
 if(!a||a.hp<=0||a.dead||damage<=0)return;
 const boss=a===w.boss||a.isBoss;
 if(element==='fire'){
  const active=a.burnUntil>w.time;
  a.fireStacks=Math.min(ELEMENTS.cap,(active?a.fireStacks||0:0)+1);
  a.burnDamage=Math.max(active?a.burnDamage||0:0,damage*ELEMENTS.burnShare);
  a.burnUntil=w.time+ELEMENTS.burnTime;a.burnSource=source;
  if(!active)a.burnNext=w.time+ELEMENTS.burnTick;
 }else if(element==='frost'){
  a.frostStacks=Math.min(ELEMENTS.cap,(a.frostUntil>w.time?a.frostStacks||0:0)+1);a.frostUntil=w.time+ELEMENTS.frostTime;
  a.elementSlow=a.frostStacks*(boss?.02:ELEMENTS.slowPerStack);a.slow=Math.max(a.slowTime>0?a.slow||0:0,a.elementSlow);a.slowTime=Math.max(a.slowTime||0,ELEMENTS.frostTime);
  if(a.frostStacks>=ELEMENTS.cap&&!(a.freezeImmuneUntil>w.time)){
   a.frostStacks=0;a.freezeUntil=w.time+(boss?ELEMENTS.bossFreeze:ELEMENTS.freezeTime);
   a.freezeImmuneUntil=a.freezeUntil+(boss?3:1);a.rootTime=Math.max(a.rootTime||0,a.freezeUntil-w.time);
   fx(w,'impact',{x:a.x,y:a.y,h:.9,color:'#d6f8ff',size:1.1,duration:.3});
  }
 }
}
export function tickElements(w,dt,damage){
 if(w.paused||w.elementTickAt===w.time)return;w.elementTickAt=w.time;
 w.effects=(w.effects||[]).filter(e=>!e.elementStatus);
 if(w.player?.hp<=0){clearElements(w);return;}
 for(const a of w.actors||[]){
  if(a.hp<=0||a.dead){clearElement(a);continue;}
  while(a.burnNext<=w.time+1e-9&&a.burnNext<=a.burnUntil+1e-9&&a.hp>0){
   a.burnNext+=ELEMENTS.burnTick;damage(w,a,Math.max(1,Math.round(a.burnDamage*a.fireStacks)),a.burnSource,'Queimadura');
  }
  if(a.hp<=0){clearElement(a);continue;}
  if(a.burnUntil<=w.time){a.fireStacks=0;a.burnUntil=0;}
  if(a.frostUntil<=w.time)a.frostStacks=0;
  a.elementLabel=[a.fireStacks>0?'Fogo '+a.fireStacks+'/5':'',isFrozen(w,a)?'Congelado':a.frostStacks>0?'Gelo '+a.frostStacks+'/5':''].filter(Boolean).join(' · ');
  if(isFrozen(w,a))a.rootTime=Math.max(a.rootTime||0,a.freezeUntil-w.time);
  const ring=(id,color,stacks)=>w.effects.push({id:id+a.id,elementStatus:true,fx:'dangerRune',x:a.x,y:a.y,radius:(a.radius||.3)+.3+stacks*.04,color,harmless:true,noFill:true,progress:1,visual:true,ground:true,time:0,duration:10});
  if(a.fireStacks>0)ring('element-fire-','#ff852e',a.fireStacks);
  if(a.frostStacks>0||isFrozen(w,a))ring('element-frost-',isFrozen(w,a)?'#f0ffff':'#72cfff',a.frostStacks||5);
 }
}
