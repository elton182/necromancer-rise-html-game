// War support: live aura affects outgoing damage through the shared mob stats.
(function(){
'use strict';
const M=WarAcolyteModel;
const spawn=spawnEnemy;spawnEnemy=function(type,x,y){
 const e=spawn(type,x,y);
 // Scale setters used by waves/elites keep an unmodified base; the aura is read
 // only when an attack captures damage. Existing projectiles keep their damage.
 let base=e.dmg;
 Object.defineProperty(e,'dmg',{enumerable:true,configurable:true,get:()=>M.damage(base,e,enemies),set:value=>{base=value;}});
 if(M.isAcolyte(e)){M.reset(e);e.atkR=1.3;e.atkRate=1.5;}
 return e;
};
const plan=ExpeditionModel.plan;ExpeditionModel.plan=function(w){return M.expeditionPlan(plan(w));};
const ability=updateMobAbility;updateMobAbility=function(e,dt){
 if(!M.isAcolyte(e))return ability(e,dt);
 return M.update(e,dt,{target:mobSkillTarget,allies:()=>enemies,pulse:s=>ring(s.x,s.y,M.skill.radius,M.skill.color,.5)});
};
const kill=killEnemy;killEnemy=function(e,...args){if(M.isAcolyte(e))e.ability=null;return kill(e,...args);};
const reset=resetAbilities;resetAbilities=function(){for(const e of enemies)if(M.isAcolyte(e))M.reset(e);return reset();};
const warnings=drawMobAbilityWarnings;drawMobAbilityWarnings=function(){
 const sources=enemies.filter(e=>M.isAcolyte(e)&&!e.dead&&e.ability),saved=sources.map(e=>[e,e.ability]);
 for(const [e]of saved)e.ability=null;
 try{warnings();}finally{for(const [e,a]of saved)e.ability=a;}
 ctx.save();try{
  for(const [e,a]of saved){
   const channel=a.phase==='channel',r=M.skill.radius*S;
   // Dashed outer boundary during preparation; solid sun rays while channeling.
   ctx.strokeStyle=M.skill.color;ctx.fillStyle=M.skill.color;ctx.lineWidth=channel?2:1.5;
   ctx.globalAlpha=channel?.07:.04;ctx.beginPath();ctx.ellipse(sx(e.x),sy(e.y),r,r*.6,0,0,Math.PI*2);ctx.fill();
   ctx.globalAlpha=channel?.65:.5;ctx.setLineDash(channel?[]:[6,6]);ctx.stroke();ctx.setLineDash([]);
   const progress=channel?1:Math.min(1,a.time/M.skill.windup);
   ctx.beginPath();ctx.ellipse(sx(e.x),sy(e.y),r*progress,r*.6*progress,0,0,Math.PI*2);ctx.stroke();
   ctx.globalAlpha=1;ctx.font='bold 12px Georgia';ctx.textAlign='center';
   ctx.fillText(channel?'LITANIA · +30% DANO':'PREPARANDO LITANIA',sx(e.x),sy(e.y)-S*2.5);
  }
  for(const e of enemies)if(M.supported(e,sources)){
   const x=sx(e.x),y=sy(e.y)-S*2*(e.type.sc||1);
   ctx.globalAlpha=.95;ctx.strokeStyle=M.skill.color;ctx.lineWidth=2;ctx.beginPath();
   ctx.moveTo(x-5,y+3);ctx.lineTo(x,y-3);ctx.lineTo(x+5,y+3);ctx.stroke();
  }
 }finally{ctx.restore();}
};
const sprite=drawSprite;drawSprite=function(key,ref,o){
 if(key==='warAcolyte'&&ref.ability&&!ref.dead&&!o.deadT){
  const a=ref.ability;o={...o,anim:a.phase,animTime:a.time,face:Math.atan2(a.dy,a.dx)};
 }
 return sprite(key,ref,o);
};
ESPR['Acólito de Guerra']='warAcolyte';ESPR_K.warAcolyte=1.1;
})();
