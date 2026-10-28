// Rei Caído como chefe único: missões, trilhas, Capitão, expedições e Conquista.
// Cada encontro mantém vida, dano, XP, loot e fluxo; muda corpo, nome e golpes.
// ?bosses=classic mantém os chefes anteriores (testes e comparação).
(function(){
'use strict';
const M=FallenKingModel,classic=/(?:^|[?&])bosses=classic(?:&|$)/.test(location.search);
window.FallenKingRuntime={active:!classic};
if(classic)return;
const KEY='fallenKing',SLAM='fallenKingSlam',SLAM_ANIMS=new Set(['slam_windup','slam','slam_recover']);
ESPR[M.type.name]=KEY;ESPR_K[KEY]=1.1;  // cerca de 4,2 u de altura, ~1,8× o player
const isKing=e=>!!e&&e.type?.id===M.type.id&&!e.dummy;
// defOf guarda o desenho em _def; copiar esse cache manteria o sprite do chefe antigo.
function kingType({_def,...base}){return {...base,id:M.type.id,name:M.type.name,col:M.type.col,hCol:M.type.hCol,sc:M.type.sc,isBoss:true,dropChance:1};}
function convert(e){
 if(!e||e.dead||e.dummy||isKing(e))return e;
 e.kingSource=e.type?.name;e.type=kingType(e.type);e.def=defOf(e.type);e.isBoss=true;
 // O Capitão deixa a IA própria (fases, escudo e reforços); o rei usa a sua.
 e.cap=false;e.xAI=null;e.shield=false;e.ability=null;e.atkR=Math.max(e.atkR||0,2.2);e.atkRate=1.6;
 M.reset(e);return e;
}
const DESC={ext:'Sobreviva 4 waves e derrote o Rei Caído.',horde:'6 waves densas + Rei Caído.',elim:'Apenas 3 waves, mas o Rei Caído é brutal.'};
for(const mission of MISSION_TEMPLATES){mission.boss=kingType(mission.boss);if(DESC[mission.id])mission.desc=DESC[mission.id];}

function inCone(px,py,x,y,dx,dy,range,arc){
 const vx=px-x,vy=py-y,d=Math.hypot(vx,vy);
 return d<=range&&(d<.6||(vx*dx+vy*dy)/d>=Math.cos(arc/2));
}
function summon(points,owner){
 for(const p of points){
  const a=spawnEnemy(ENEMY_TYPES[0],p.x,p.y);
  a.kingOwner=owner;a.gearWave=owner.gearWave;a.room=owner.room;
  if(owner.expedition)Object.assign(a,{expedition:true,alert:true,home:{x:p.x,y:p.y},lootTier:'common'});
  enemiesLeft++;ring(p.x,p.y,1.4,M.skills.summon.color,.7);burst(p.x,p.y,M.skills.summon.color,12,2.4);
 }
}
function io(e){return {
 target:()=>mobSkillTarget(e),bound:(x,y)=>clampMobLanding(x,y,e),
 adds:()=>enemies.filter(a=>a.kingOwner===e&&!a.dead).length,
 enrage:()=>{ring(e.x,e.y,3.2,M.skills.summon.color,.8);burst(e.x,e.y,M.skills.summon.color,24,3);
  floatMsg('Rei Caído · A coroa chama os mortos!',W/2,H*.22,'#7ff0e4');shake=Math.max(shake,.3);},
 cone:(x,y,dx,dy,range,arc,damage,color)=>{
  if(P.deadT===0&&inCone(P.x,P.y,x,y,dx,dy,range,arc))dealDamageToPlayer(damage,e);
  minions.forEach(m=>{if(!m.dead&&inCone(m.x,m.y,x,y,dx,dy,range,arc))dealDamageToMinion(m,damage);});
  burst(x+dx*range*.6,y+dy*range*.6,color,18,3);shake=Math.max(shake,.22);
 },
 area:(x,y,radius,damage,color)=>{
  mobAreaDamage(x,y,radius,damage,e);ring(x,y,radius,color,.7);burst(x,y,color,26,3.5);
  shake=Math.max(shake,.45);playSound('explosao');
 },
 summon,
 cue:(kind,phase)=>{if(kind==='leap'&&phase==='air')burst(e.x,e.y,'#9b8a72',14,2.5);}
};}
const ability=updateMobAbility;updateMobAbility=function(e,dt){
 // Qualquer chefe que ainda não passou por um spawn convertido vira o rei aqui.
 if(e.isBoss&&!e.dummy&&!e.endgameObject)convert(e);
 if(!isKing(e))return ability(e,dt);
 return M.update(e,dt,io(e));
};
const captain=spawnCaptain;spawnCaptain=function(...args){
 const result=captain(...args);convert(bossEnemy);
 showWaveBanner('💀 '+M.type.name.toUpperCase(),'O rei não vai recuar — prepare-se!','#ff2244');
 document.getElementById('wave-txt').textContent='👑 BOSS: '+M.type.name;
 return result;
};
const startMap=expeditionStartMap;expeditionStartMap=function(...args){
 const result=startMap(...args);
 if(EXPEDITION.boss){convert(EXPEDITION.boss);updateBossHpBar();}
 return result;
};
const kill=killEnemy;killEnemy=function(e,...args){
 if(isKing(e)&&!e.dead){
  e.king=null;e.jumpZ=0;
  // Os mortos erguidos pela coroa se desfazem com o rei, sem recompensa extra.
  for(const a of enemies)if(a.kingOwner===e&&!a.dead){a.dead=true;a.deadTimer=1;a.kingOwner=null;enemiesLeft=Math.max(0,enemiesLeft-1);burst(a.x,a.y,M.skills.summon.color,8,2);}
 }
 return kill(e,...args);
};
const reset=resetAbilities;resetAbilities=function(){for(const e of enemies)if(isKing(e))M.reset(e);return reset();};
const awake=expeditionEnemyAwake;expeditionEnemyAwake=function(e,dt){
 const was=e.alert,result=awake(e,dt);
 if(isKing(e)&&was&&!result)M.reset(e);
 return result;
};
const hazards=minionHazards;minionHazards=function(){
 const result=hazards();for(const e of enemies)if(isKing(e))result.push(...M.hazards(e));return result;
};
function worldPath(points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(sx(x),sy(y)):ctx.moveTo(sx(x),sy(y)));ctx.closePath();}
function circle(x,y,r){return Array.from({length:36},(_,i)=>[x+Math.cos(i/36*Math.PI*2)*r,y+Math.sin(i/36*Math.PI*2)*r]);}
function wedge(x,y,angle,arc,r){const p=[[x,y]];for(let i=0;i<=16;i++){const t=angle-arc/2+arc*i/16;p.push([x+Math.cos(t)*r,y+Math.sin(t)*r]);}return p;}
const warnings=drawMobAbilityWarnings;drawMobAbilityWarnings=function(){
 warnings();ctx.save();
 try{for(const e of enemies){
  const a=e.king;if(!isKing(e)||e.dead||!a)continue;
  const s=M.skills[a.kind],phases=s.phases,[phase,duration]=phases[a.index];
  // O aviso cresce até o instante real do dano (fim da fase com evento).
  const until=phases.findIndex(p=>p[2]);if(a.index>until)continue;
  const total=phases.slice(0,until+1).reduce((n,p)=>n+p[1],0),done=phases.slice(0,a.index).reduce((n,p)=>n+p[1],0)+a.time,k=Math.min(1,done/total);
  ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=2;
  let shapes=[],inner=[],label=[e.x,e.y];
  if(a.kind==='slash'){const angle=Math.atan2(a.dy,a.dx);shapes=[wedge(e.x,e.y,angle,s.arc,s.range)];inner=[wedge(e.x,e.y,angle,s.arc,s.range*k)];}
  else if(a.kind==='leap'){shapes=[circle(a.tx,a.ty,s.radius)];inner=[circle(a.tx,a.ty,s.radius*k)];label=[a.tx,a.ty];}
  else{shapes=a.points.map(p=>circle(p.x,p.y,.9));inner=a.points.map(p=>circle(p.x,p.y,.9*k));}
  for(const shape of shapes){ctx.globalAlpha=.15;worldPath(shape);ctx.fill();ctx.globalAlpha=.9;worldPath(shape);ctx.stroke();}
  ctx.globalAlpha=.75;for(const shape of inner){worldPath(shape);ctx.stroke();}
  ctx.globalAlpha=1;ctx.font='bold 12px Georgia';ctx.textAlign='center';
  ctx.fillText(s.name,sx(label[0]),sy(label[1])-S*(a.kind==='leap'?s.radius*.6:2.6)-12);
 }}finally{ctx.restore();}
};
const sprite=drawSprite;drawSprite=function(key,ref,o){
 if(key!==KEY)return sprite(key,ref,o);
 o={...o};let progress=null;
 if(o.deadT)o.deadT*=.5;  // a morte dura 1,6 s em vez dos 0,8 s padrão
 else if(!o.dead){
  const pose=M.pose(ref);
  if(pose){o.anim=pose.anim;o.face=pose.face;progress=pose.progress;}
  else if(ref.swing>0){o.anim='attack';progress=1-ref.swing/.28;}
 }
 if(progress!==null){
  const sheet=SLAM_ANIMS.has(o.anim)?SLAM:KEY;
  if(!SPR.ready(sheet))return sprite(KEY,ref,{...o,anim:undefined});
  const anim=SPR.sheets[sheet].meta.anims[o.anim];
  o.animTime=Math.max(0,Math.min(1,progress))*(anim.n-.01)/anim.fps;
  return sprite(sheet,ref,o);
 }
 return sprite(KEY,ref,o);
};
Object.assign(window.FallenKingRuntime,{convert,isKing,kingType});
})();
