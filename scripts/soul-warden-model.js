(function(root){
'use strict';
const type={id:'soulWarden',name:'Carcereiro das Almas',col:0x75818b,hCol:0xeeac69,hp:480,dmg:20,spd:1.45,xp:160,souls:85,sc:1.4,isBoss:true,dropChance:1};
const skills={
 slam:{name:'Sentença do Carcereiro',windup:1.2,recover:.8,cooldown:3.8,radius:2.8,mult:1.8,color:'#efb46f'},
 volley:{name:'Almas Condenadas',windup:1.35,recover:.65,cooldown:3.8,radius:0,mult:.8,color:'#e9a0a0'},
 seals:{name:'Selos da Prisão',windup:1.5,recover:.8,cooldown:4.2,radius:2,mult:1.35,color:'#ed9976'}
};
function reset(e){e.ability=null;e.abilityCd=2;e.wardenStep=0;e.wardenPhase=1;}
function update(e,dt,io){
 if(e.dead||e.dummy)return false;
 if(!e.wardenPhase)reset(e);
 if(e.hp<=e.maxHp*.5&&e.wardenPhase===1){e.wardenPhase=2;io.enrage?.();}
 if(e.ability){
  const a=e.ability,d=skills[a.kind];a.time+=dt;
  if(a.phase==='windup'&&a.time>=a.duration){
   a.phase='recover';a.time-=a.duration;
   if(a.kind==='volley'){
    const count=e.wardenPhase===2?7:5,angle=Math.atan2(a.dy,a.dx);
    for(let i=0;i<count;i++){const theta=angle+(i-(count-1)/2)*.2;io.projectile(e.x,e.y,Math.cos(theta)*8,Math.sin(theta)*8,Math.round(e.dmg*d.mult));}
   }else{for(const p of a.points)io.area(p.x,p.y,d.radius,Math.round(e.dmg*d.mult),d.color);}
  }
  if(a.phase==='recover'&&a.time>=d.recover){e.ability=null;e.abilityCd=d.cooldown*(e.wardenPhase===2?.78:1);e.atkTimer=1;}
  return true;
 }
 e.abilityCd=Math.max(0,(e.abilityCd??2)-dt);
 if(e.abilityCd>0)return false;
 const target=io.target();if(!target)return false;
 const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);
 if(d>12)return false;
 const sequence=e.wardenPhase===2?['slam','volley','seals']:['slam','volley'];
 const kind=sequence[e.wardenStep++%sequence.length],skill=skills[kind];
 // Lock the target during windup so movement and dash can evade the attack.
 const limit=kind==='slam'?5:10,k=d>limit?limit/d:1;
 const p=io.bound(e.x+dx*k,e.y+dy*k),points=[p];
 if(kind==='seals'){
  const nx=d?-dy/d:0,ny=d?dx/d:1;
  points.push(io.bound(p.x+nx*3.5,p.y+ny*3.5),io.bound(p.x-nx*3.5,p.y-ny*3.5));
 }
 e.ability={kind,phase:'windup',time:0,duration:skill.windup,tx:p.x,ty:p.y,dx:d?dx/d:1,dy:d?dy/d:0,points};
 e.target={x:target.x,y:target.y};if(Math.abs(dx)>.1)e.face=dx>0?1:-1;
 return true;
}
const api={type,skills,reset,update};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SoulWardenModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
