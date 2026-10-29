// Gerado do modelo canônico; não editar.
const module={exports:{}};
(function(root){
'use strict';
// Rei Caído: chefe único enquanto os chefes antigos estão desativados.
const type={id:'fallenKing',name:'Rei Caído',col:0x3b3f4a,hCol:0x4fe3d4,sc:1.6,isBoss:true,dropChance:1};
// Cada golpe é uma lista de fases; o evento acontece ao fim da fase marcada.
// Corte: a fase 'swing' termina no quadro de contato da animação de ataque.
const skills={
 slash:{name:'Corte Real',range:2.8,arc:Math.PI*2/3,mult:1.5,cooldown:4.5,color:'#ff7a4a',
  phases:[['windup',.8],['swing',.093,'hit'],['follow',.207],['recover',.5]]},
 leap:{name:'Queda do Rei',min:2.5,max:7,radius:2.6,mult:2,height:1.1,cooldown:7,color:'#ffb347',
  phases:[['windup',1],['air',.55,'impact'],['recover',1]]},
 summon:{name:'Chamado da Coroa',count:2,limit:4,spread:1.6,cooldown:14,color:'#5fe8d8',
  phases:[['windup',1.2,'summon'],['recover',.6]]}
};
const GAP=.9,ENRAGE=.5,ENRAGED_COOLDOWN=.8;
function reset(e){e.king=null;e.kingGap=1.5;e.kingCd={slash:0,leap:2,summon:3};e.kingPhase2=false;e.jumpZ=0;}
function phaseOf(a){return skills[a.kind].phases[a.index];}
function choose(e,distance,adds){
 if(e.kingPhase2&&e.kingCd.summon<=0&&adds<skills.summon.limit)return 'summon';
 if(distance<=skills.slash.range&&e.kingCd.slash<=0)return 'slash';
 if(distance>=skills.leap.min&&distance<=skills.leap.max+2&&e.kingCd.leap<=0)return 'leap';
 return null;
}
function start(e,kind,target,io){
 const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy),ux=d?dx/d:1,uy=d?dy/d:0;
 const a={kind,index:0,time:0,dx:ux,dy:uy,sx:e.x,sy:e.y,tx:e.x,ty:e.y};
 // Direção e ponto são travados no início: andar ou usar o Dash evita o golpe.
 if(kind==='leap'){const reach=Math.min(d,skills.leap.max),p=io.bound(e.x+ux*reach,e.y+uy*reach);a.tx=p.x;a.ty=p.y;}
 if(kind==='summon')a.points=[-1,1].map(s=>io.bound(e.x-uy*s*skills.summon.spread,e.y+ux*s*skills.summon.spread));
 e.king=a;e.target={x:target.x,y:target.y};if(Math.abs(dx)>.1)e.face=dx>0?1:-1;
 io.cue?.(kind,'windup',a);
}
function fire(e,a,event,io){
 const s=skills[a.kind],damage=Math.round(e.dmg*s.mult||0);
 if(event==='hit')io.cone(e.x,e.y,a.dx,a.dy,s.range,s.arc,damage,s.color);
 if(event==='impact'){e.x=a.tx;e.y=a.ty;e.jumpZ=0;io.area(a.tx,a.ty,s.radius,damage,s.color);}
 if(event==='summon')io.summon(a.points,e);
}
function finish(e,a){
 e.king=null;e.jumpZ=0;e.kingGap=GAP;e.atkTimer=Math.max(e.atkTimer||0,.6);
 e.kingCd[a.kind]=skills[a.kind].cooldown*(e.kingPhase2?ENRAGED_COOLDOWN:1);
}
function advance(e,dt,io){
 let left=dt;
 while(e.king&&left>0){
  const a=e.king,[phase,duration,event]=phaseOf(a),step=Math.min(left,duration-a.time);
  a.time+=step;left-=step;
  if(phase==='air'){
   const u=Math.min(1,a.time/duration);
   e.x=a.sx+(a.tx-a.sx)*u;e.y=a.sy+(a.ty-a.sy)*u;e.jumpZ=skills.leap.height*Math.sin(Math.PI*u);
  }
  if(a.time<duration-1e-9)break;
  if(event)fire(e,a,event,io);
  a.index++;a.time=0;
  if(a.index>=skills[a.kind].phases.length)finish(e,a);
  else io.cue?.(a.kind,phaseOf(a)[0],a);
 }
}
function update(e,dt,io){
 if(e.dead||e.dummy)return false;
 if(!e.kingCd)reset(e);
 if(!e.kingPhase2&&e.hp<=e.maxHp*ENRAGE){e.kingPhase2=true;io.enrage?.(e);}
 if(e.king){advance(e,dt,io);return true;}
 for(const k of Object.keys(e.kingCd))e.kingCd[k]=Math.max(0,e.kingCd[k]-dt);
 e.kingGap=Math.max(0,e.kingGap-dt);
 if(e.kingGap>0)return false;
 const target=io.target();if(!target)return false;
 const kind=choose(e,Math.hypot(target.x-e.x,target.y-e.y),io.adds?.(e)||0);
 if(!kind)return false;
 start(e,kind,target,io);return true;
}
// Progresso normalizado (0..1) de cada animação, para o desenho seguir o estado real.
function pose(e){
 const a=e.king;if(!a)return null;
 const [phase,duration]=phaseOf(a),u=duration?Math.min(1,a.time/duration):1,face=Math.atan2(a.dy,a.dx);
 if(a.kind==='slash'){
  if(phase==='windup')return {anim:'windup',progress:u,face};
  if(phase==='recover')return {anim:'recover',progress:u,face};
  // Contato em 4/13 da animação de ataque (quadro 5 de 14 no Blender).
  return {anim:'attack',progress:phase==='swing'?u*4/13:4/13+u*9/13,face};
 }
 if(a.kind==='leap'){
  if(phase==='windup')return {anim:'slam_windup',progress:u,face};
  // Impacto em 13/17 da ação slam (quadro 14 de 18); a recuperação mostra o resto e depois slam_recover.
  if(phase==='air')return {anim:'slam',progress:u*13/17,face};
  return u<.25?{anim:'slam',progress:13/17+u/.25*4/17,face}:{anim:'slam_recover',progress:(u-.25)/.75,face};
 }
 return {anim:phase==='windup'?'cast':'recover',progress:phase==='windup'?u:.5+u*.5,face};
}
// Áreas de perigo para a esquiva da horda: círculos ou cápsulas.
function hazards(e){
 const a=e.king;if(!a||e.dead)return [];
 const [phase]=phaseOf(a),s=skills[a.kind];
 if(a.kind==='slash'&&(phase==='windup'||phase==='swing'))return [{x:e.x,y:e.y,bx:e.x+a.dx*s.range*.7,by:e.y+a.dy*s.range*.7,r:s.range*.55+.45}];
 if(a.kind==='leap'&&(phase==='windup'||phase==='air'))return [{x:a.tx,y:a.ty,r:s.radius+.45}];
 return [];
}
const api={type,skills,reset,update,pose,hazards,GAP,ENRAGE};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FallenKingModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);

export default module.exports;
