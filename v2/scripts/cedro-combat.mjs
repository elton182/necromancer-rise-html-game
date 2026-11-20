import {dealDamage} from './combat.mjs';
import {lineClear,moveCircle,navigate} from './terrain.mjs';
import {blockEnemyByWalls} from './spells.mjs';
import {fx} from './vfx-events.mjs';
export function bentoAction(e,t,kind,{chain=0}={}){
 const furious=e.hp<=e.maxHp*.65,dx=t.x-e.x,dy=t.y-e.y,d=Math.hypot(dx,dy)||1;
 const wind=kind==='charge'?(furious?.75:.9):kind==='sweep'?(furious?.65:.8):(furious?.95:1.1);
 return {kind,time:0,wind,total:wind+(kind==='charge'?1.4:kind==='sweep'?.8:1.05),
  x:kind==='fire'||kind==='slam'?t.x:e.x,y:kind==='fire'||kind==='slam'?t.y:e.y,dx:dx/d,dy:dy/d,hit:false,victims:[],chain};
}
// Chefe humano sobre o GLB animado do soldado. Não usa o caminho do Rei Caído.
// Toda ameaça tem preparação, execução única e recuperação; dano comum respeita defesa e esquiva.
export function tickBento(w,e,dt,{targets,target,spawnEnemy}){
 const t=target(w,e);if(!t)return;
 const state=e.bento||(e.bento={cooldown:.7,step:0,reserve:false,action:null});
 const progress=w.cedroProgress||{},clear=id=>progress.cleared?.includes(id);
 e.abilityLabel='Bento Ferraz';e.labelTime=.2;
 const warning=(a,r,extra={})=>w.effects.push({id:'bento-warning-'+e.id,enemyWarning:e.id,kind:'enemyWarning',fx:'dangerRune',visual:true,ground:true,fixedRadius:true,x:a.x,y:a.y,radius:r,color:'#ef9b62',time:0,duration:10,progress:Math.min(1,a.time/a.wind),...extra});
 const hurt=(victim,mult,element=null)=>dealDamage(w,victim,e.dmg*mult,e,null,element);
 const reserve=()=>{
  const count=clear('cedro-signal')?0:6;
  for(let i=0;i<count;i++){
   const a=spawnEnemy(w,i%2?9:0,80+(i-1.5)*2,-141,{wave:e.gearWave});a.worldGroup=e.worldGroup;a.bentoReserve=e.id;a.alert=true;
  }
  w.notice=count?'Bento: "Última reserva, avancem!"':'A corneta está em silêncio. Os reforços não chegam.';
 };
 if(!state.reserve&&e.hp<=e.maxHp*.5&&!state.action){
  state.reserve=true;state.action={kind:'order',time:0,wind:1.5,total:2.4,x:e.x,y:e.y,hp:e.hp};e.actionId++;
 }
 if(state.action){
  const a=state.action,old=a.time;a.time+=dt;e.angle=Math.atan2(a.dx??0,a.dy??1);
  if(a.kind==='order'){
   e.animation='heavy_windup';e.pose={anim:e.animation,progress:Math.min(1,a.time/a.wind)};
   warning(a,5,{harmless:true,noFill:true});
   if(!a.hit&&a.hp-e.hp>=e.maxHp*.07){a.hit=true;w.notice='Ordem interrompida! A reserva não recebeu o sinal.';}
   if(a.time>=a.wind&&!a.hit){a.hit=true;reserve();}
  }else if(a.kind==='charge'){
   if(a.time<a.wind){e.animation='heavy_windup';e.pose={anim:e.animation,progress:a.time/a.wind};warning(a,1.1,{kind:'enemyLine',fx:'dangerLine',dx:a.dx,dy:a.dy,length:15.6});}
   else if(old<a.wind+.65){
    const travel=Math.max(0,Math.min(a.time,a.wind+.65)-Math.max(old,a.wind))*24;
    const before={x:e.x,y:e.y},p=moveCircle(e,{x:a.dx*travel,y:a.dy*travel},e.radius,w.arena,{slide:false});e.x=p.x;e.y=p.y;blockEnemyByWalls(w,e,before);e.walkDistance+=Math.hypot(e.x-before.x,e.y-before.y);e.animation='walk';
    for(const victim of targets(w)){
     const dx=e.x-before.x,dy=e.y-before.y,l=dx*dx+dy*dy,k=l?Math.max(0,Math.min(1,((victim.x-before.x)*dx+(victim.y-before.y)*dy)/l)):0;
     if(!a.victims.includes(victim.id)&&Math.hypot(victim.x-before.x-dx*k,victim.y-before.y-dy*k)<1.1+(victim.radius||.3)&&lineClear(e,victim,.05,w.arena)){a.victims.push(victim.id);hurt(victim,1.3);}
    }
   }else{e.animation='recover';e.pose={anim:'recover',progress:Math.min(1,(a.time-a.wind-.65)/1.1)};}
  }else{
   const sweep=a.kind==='sweep',radius=sweep?4.3:a.kind==='fire'?3.4:3;
   if(a.time<a.wind){e.animation='heavy_windup';e.pose={anim:e.animation,progress:a.time/a.wind};warning(a,radius,sweep?{arc:Math.PI*1.15,direction:Math.atan2(a.dy,a.dx)}:{});}
   else{
    if(!a.hit){a.hit=true;
     for(const victim of targets(w)){
      const dx=victim.x-a.x,dy=victim.y-a.y,d=Math.hypot(dx,dy);
      if(d<=radius&&(!sweep||d<.1||(dx*a.dx+dy*a.dy)/d>=Math.cos(Math.PI*1.15/2))&&lineClear(e,victim,.05,w.arena))hurt(victim,sweep?1.25:1.5,a.kind==='fire'?'fire':null);
     }
     fx(w,sweep?'slash':'groundBreak',{x:a.x,y:a.y,dx:a.dx,dy:a.dy,radius,arc:Math.PI*1.15,color:a.kind==='fire'?'#ff7e32':'#e5c38b',shake:.25,duration:.6});
    }
    e.animation=a.time<a.wind+.25?'heavy_attack':'recover';e.pose={anim:e.animation,progress:Math.min(1,(a.time-a.wind)/(e.animation==='recover'?1.3:.25))};
   }
  }
  if(a.time>=a.total){
   if(a.kind==='sweep'&&a.chain>0){state.action=bentoAction(e,t,'sweep',{chain:a.chain-1});e.actionId++;}
   else{state.action=null;state.cooldown=e.hp<=e.maxHp*.65?.2:.4;}
  }
  return;
 }
 state.cooldown=Math.max(0,state.cooldown-dt);
 const dx=t.x-e.x,dy=t.y-e.y,d=Math.hypot(dx,dy)||1;e.angle=Math.atan2(dx,dy);
 if(state.cooldown<=0&&d<18&&lineClear(e,t,.1,w.arena)){
  const kind=state.step++%4,fire=kind===3&&!clear('cedro-fuel'),name=fire?'fire':d>5||kind===1?'charge':kind===2?'slam':'sweep';
  state.action=bentoAction(e,t,name,{chain:name==='sweep'&&e.hp<=e.maxHp*.65?1:0});
  e.actionId++;return;
 }
 if(d>3){const before={x:e.x,y:e.y},p=navigate(e,t,e.spd*(e.hp<=e.maxHp*.65?1.35:1),dt,w.arena);e.walkDistance+=p.distance;e.x=p.x;e.y=p.y;blockEnemyByWalls(w,e,before);e.animation='walk';}else e.animation='idle';
}
