(function(root){
'use strict';
const skill={name:'Litania de Guerra',radius:5.5,windup:1,duration:4,cooldown:7,initial:2,damage:1.3,color:'#e9b46b'};
const isAcolyte=e=>e.type?.id==='warAcolyte';
const eligible=e=>!e.dead&&!e.dummy&&!e.isBoss&&!e.type?.isBoss&&!isAcolyte(e);
function active(e){return isAcolyte(e)&&!e.dead&&!e.dummy&&!(e.spawnT>0)&&(!e.expedition||e.alert)&&e.ability?.phase==='channel';}
function supported(e,sources){
 return eligible(e)&&sources.some(s=>s!==e&&active(s)&&Math.hypot(e.x-s.x,e.y-s.y)<=skill.radius);
}
// Evaluate from live sources: no permanent stat mutation and no stacked auras.
function damage(base,e,sources){return supported(e,sources)?Math.round(base*skill.damage):base;}
function reset(e){e.ability=null;e.abilityCd=skill.initial;}
function update(e,dt,env){
 if(e.dead||e.dummy){e.ability=null;return false;}
 let remaining=dt,a=e.ability;
 if(!a){
  const cd=e.abilityCd??skill.initial;e.abilityCd=Math.max(0,cd-dt);
  if(e.abilityCd>0)return false;
  const t=env.target(e);
  if(!t||Math.hypot(t.x-e.x,t.y-e.y)>10||!env.allies().some(m=>m!==e&&eligible(m)&&Math.hypot(m.x-e.x,m.y-e.y)<=skill.radius))return false;
  remaining=Math.max(0,dt-cd);
  const angle=Math.atan2(t.y-e.y,t.x-e.x);
  a=e.ability={phase:'windup',time:0,dx:Math.cos(angle),dy:Math.sin(angle),tx:e.x,ty:e.y};
  e.kx=e.ky=0;e.swing=0;
 }
 while(remaining>1e-9&&e.ability){
  const duration=a.phase==='windup'?skill.windup:skill.duration;
  const step=Math.min(remaining,duration-a.time);a.time+=step;remaining-=step;
  if(a.time+1e-9<duration)break;
  if(a.phase==='windup'){a.phase='channel';a.time=0;env.pulse?.(e);}
  else{e.ability=null;e.abilityCd=skill.cooldown;}
 }
 return true;
}
function arenaTypes(wave,list,types,campaign=false){
 const acolyte=types.find(t=>t.id==='warAcolyte');
 if(campaign||wave<6||!acolyte)return list;
 const result=list.slice(),n=Math.min(wave===6?1:wave===7?2:Math.max(1,Math.min(3,Math.floor(list.length*.1))),list.filter(t=>t.id!=='cryptHound').length);
 const slots=result.map((t,i)=>t.id!=='cryptHound'?i:-1).filter(i=>i>=0);
 for(let i=0;i<n;i++)result[slots[Math.floor(i*slots.length/n)]]=acolyte;
 return result;
}
function expeditionPlan(plan){
 if(plan.wave<6)return plan;
 plan.groups.forEach((g,i)=>{if(plan.wave===6?i===0:i%3===0)g.mobs[g.mobs.length-1].type=5;});
 return plan;
}
const api={skill,isAcolyte,eligible,active,supported,damage,reset,update,arenaTypes,expeditionPlan};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WarAcolyteModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
