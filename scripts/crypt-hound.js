// Runtime bindings; loaded after equipment and expedition rules.
(function(){
'use strict';
const isDog=e=>e.type?.id==='cryptHound';
const spawn=spawnEnemy;
spawnEnemy=function(type,x,y){const e=spawn(type,x,y);if(isDog(e)){e.atkR=1;e.atkRate=1.2;e.abilityCd=2;}return e;};
const ability=updateMobAbility;
updateMobAbility=function(e,dt){
 if(!isDog(e))return ability(e,dt);
 if(e.dummy||e.isBoss)return false;
 return CryptHoundModel.update(e,dt,{
  target:mobSkillTarget,
  sweep:(ax,ay,bx,by)=>CryptHoundModel.sweep(ax,ay,bx,by,solids,handsAreas,
   [...(P.deadT===0?[{x:P.x,y:P.y,player:true}]:[]),...minions.filter(m=>!m.dead)]),
  bound:(x,y)=>{const q={x,y};if(STG.on)STG.clampE(q,.5);else{const d=Math.hypot(x,y),r=FIELD_R-1.5;if(d>r){q.x*=r/d;q.y*=r/d;}}return q;},
  damage:(target,damage)=>{if(target.player)dealDamageToPlayer(damage,e);else dealDamageToMinion(target,damage);}
 });
};
const death=killEnemy;
killEnemy=function(e,...args){if(isDog(e))e.ability=null;return death(e,...args);};
const reset=resetAbilities;
resetAbilities=function(){for(const e of enemies)if(isDog(e)){e.ability=null;e.abilityCd=2;}return reset();};
const warnings=drawMobAbilityWarnings;
drawMobAbilityWarnings=function(){
 // Hide dogs from the circular legacy warning renderer.
 const active=[];for(const e of enemies)if(isDog(e)&&e.ability){active.push([e,e.ability]);e.ability=null;}
 try{warnings();}finally{for(const [e,a]of active)e.ability=a;}
 for(const [e,a]of active){
  if(e.dead||a.phase==='recover')continue;
  const w=CryptHoundModel.ability.width/2,nx=-a.dy*w,ny=a.dx*w;
  ctx.save();ctx.strokeStyle='#e4ad64';ctx.fillStyle='#e4ad64';ctx.lineWidth=2;
  ctx.globalAlpha=.18;ctx.beginPath();ctx.moveTo(sx(a.sx+nx),sy(a.sy+ny));
  ctx.lineTo(sx(a.tx+nx),sy(a.ty+ny));ctx.lineTo(sx(a.tx-nx),sy(a.ty-ny));ctx.lineTo(sx(a.sx-nx),sy(a.sy-ny));ctx.closePath();ctx.fill();
  ctx.globalAlpha=.9;ctx.stroke();ctx.beginPath();ctx.moveTo(sx(a.tx-a.dx*.7+nx),sy(a.ty-a.dy*.7+ny));ctx.lineTo(sx(a.tx),sy(a.ty));ctx.lineTo(sx(a.tx-a.dx*.7-nx),sy(a.ty-a.dy*.7-ny));ctx.stroke();ctx.restore();
 }
};
const sprite=drawSprite;
drawSprite=function(key,ref,o){
 if(key==='cryptHound'){
  o={...o};const a=ref.ability;
  if(a&&!ref.dead&&!o.deadT){o.anim=a.phase==='charge'?'charge':a.phase==='recover'?'recover':'windup';o.animTime=a.time;o.face=Math.atan2(a.dy,a.dx);}
 }
 return sprite(key,ref,o);
};
ESPR['Cão de Cripta']='cryptHound';ESPR_K.cryptHound=1;
})();
