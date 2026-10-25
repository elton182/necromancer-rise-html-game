// Expedition boss bindings: shared damage, loot, scaling and projectile collision.
(function(){
'use strict';
const isWarden=e=>e.type?.id==='soulWarden';
const spawn=spawnEnemy;spawnEnemy=function(type,x,y){
 const e=spawn(type,x,y);if(isWarden(e)){SoulWardenModel.reset(e);e.atkRate=1.8;e.atkR=1.8;}return e;
};
const ability=updateMobAbility;updateMobAbility=function(e,dt){
 if(!isWarden(e))return ability(e,dt);
 return SoulWardenModel.update(e,dt,{
  target:()=>mobSkillTarget(e),bound:(x,y)=>clampMobLanding(x,y,e),
  enrage:()=>{ring(e.x,e.y,3,'#eeac69',.8);floatMsg('Carcereiro · Jaula rompida!',W/2,H*.22,'#efb46f');},
  area:(x,y,r,damage,color)=>{mobAreaDamage(x,y,r,damage);ring(x,y,r,color,.6);burst(x,y,color,14,2.5);shake=Math.max(shake,.18);},
  projectile:(x,y,vx,vy,damage)=>eshots.push({x,y,vx,vy,dmg:damage,kind:'magic',strong:true,life:1.9,z:1.4,warden:true,owner:e})
 });
};
const reset=resetAbilities;resetAbilities=function(){for(const e of enemies)if(isWarden(e))SoulWardenModel.reset(e);return reset();};
const kill=killEnemy;killEnemy=function(e,...args){
 if(isWarden(e)){e.ability=null;eshots=eshots.filter(s=>s.owner!==e);burst(e.x,e.y,'#eeac69',28,3);}
 return kill(e,...args);
};
const awake=expeditionEnemyAwake;expeditionEnemyAwake=function(e,dt){
 const was=e.alert,result=awake(e,dt);
 if(isWarden(e)&&was&&!result){SoulWardenModel.reset(e);eshots=eshots.filter(s=>s.owner!==e);}
 return result;
};
const hazards=minionHazards;minionHazards=function(){
 const result=hazards();for(const e of enemies){
  const a=e.ability;if(!isWarden(e)||e.dead||!a||a.phase!=='windup')continue;
  if(a.kind==='volley'){
   const count=e.wardenPhase===2?7:5,angle=Math.atan2(a.dy,a.dx);
   for(let i=0;i<count;i++){const t=angle+(i-(count-1)/2)*.2;result.push({x:e.x,y:e.y,bx:e.x+Math.cos(t)*12,by:e.y+Math.sin(t)*12,r:.85});}
  }else for(const p of a.points)result.push({x:p.x,y:p.y,r:SoulWardenModel.skills[a.kind].radius+.45});
 }return result;
};
const warnings=drawMobAbilityWarnings;drawMobAbilityWarnings=function(){
 const active=[];for(const e of enemies)if(isWarden(e)&&e.ability){active.push([e,e.ability]);e.ability=null;}
 try{warnings();}finally{for(const [e,a]of active)e.ability=a;}
 ctx.save();try{for(const [e,a]of active){
  if(e.dead||a.phase!=='windup')continue;
  const skill=SoulWardenModel.skills[a.kind],k=Math.min(1,a.time/a.duration);
  ctx.strokeStyle=skill.color;ctx.fillStyle=skill.color;ctx.lineWidth=2;
  if(a.kind==='volley'){
   const count=e.wardenPhase===2?7:5,angle=Math.atan2(a.dy,a.dx);ctx.globalAlpha=.65+.3*k;ctx.setLineDash([8,5]);
   for(let i=0;i<count;i++){const t=angle+(i-(count-1)/2)*.2;ctx.beginPath();ctx.moveTo(sx(e.x),sy(e.y));ctx.lineTo(sx(e.x+Math.cos(t)*12),sy(e.y+Math.sin(t)*12));ctx.stroke();}ctx.setLineDash([]);
  }else for(const p of a.points){
   ctx.globalAlpha=.14;ctx.beginPath();ctx.ellipse(sx(p.x),sy(p.y),skill.radius*S,skill.radius*S*.6,0,0,Math.PI*2);ctx.fill();
   ctx.globalAlpha=.9;ctx.stroke();ctx.beginPath();ctx.ellipse(sx(p.x),sy(p.y),skill.radius*S*k,skill.radius*S*.6*k,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.globalAlpha=1;ctx.font='bold 12px Georgia';ctx.textAlign='center';ctx.fillText(skill.name,sx(a.tx),sy(a.ty)-S*(skill.radius||1)-12);
 }}finally{ctx.restore();}
};
const sprite=drawSprite;drawSprite=function(key,ref,o){
 if(key==='soulWarden'&&!ref.ability&&ref.swing>0&&!ref.dead&&!o.deadT)o={...o,anim:'attack',animTime:(1-ref.swing/.28)*.4};
 if(key==='soulWarden'&&ref.ability&&!ref.dead&&!o.deadT){
  const a=ref.ability,casting=a.kind!=='slam';
  o={...o,face:Math.atan2(a.dy,a.dx),anim:a.phase==='windup'?(casting?'cast':'windup'):(casting?'recover':'attack'),animTime:a.phase==='windup'?a.time*(casting?1.35:1.2)/a.duration:a.time};
 }return sprite(key,ref,o);
};
ESPR['Carcereiro das Almas']='soulWarden';ESPR_K.soulWarden=1;
})();
