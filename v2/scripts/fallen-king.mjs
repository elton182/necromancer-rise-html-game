import King from './shared-fallen-king.mjs';
import {spawnEnemy,target} from './enemies.mjs';
import {dealDamage} from './combat.mjs';
import {navigate,resolvePosition} from './terrain.mjs';
import {blockEnemyByWalls} from './spells.mjs';
export function tickKing(w,e,dt){
 const targets=()=>w.actors.filter(a=>(a===w.player||a.team==='ally')&&a.hp>0&&!a.dead);
 const nearest=()=>target(w,e);
 const damage=(test,n)=>{for(const t of targets())if(test(t))dealDamage(w,t,n,e);};
 const bound=(x,y)=>resolvePosition({x,y},e.radius,w.arena);
 const busy=King.update(e,dt,{
  target:nearest,bound,adds:()=>w.actors.filter(a=>a.kingOwner===e.id&&a.hp>0).length,
  cone:(x,y,dx,dy,r,arc,n)=>damage(t=>{const vx=t.x-x,vy=t.y-y,d=Math.hypot(vx,vy);return d<=r&&(d<.6||(vx*dx+vy*dy)/d>=Math.cos(arc/2));},n),
  area:(x,y,r,n)=>damage(t=>Math.hypot(t.x-x,t.y-y)<=r,n),
  summon:points=>{for(const p of points){if(w.spawnKingAdd)w.spawnKingAdd(p,e);else spawnEnemy(w,0,p.x,p.y,{wave:e.gearWave||1,owner:e.id});}},
 });
 e.pose=King.pose(e);if(e.pose){e.animation=e.pose.anim;e.angle=Math.PI/2-e.pose.face;}
 if(!busy){const t=nearest();if(t){const before={x:e.x,y:e.y},q=navigate(e,t,(e.spd??1.1)*((e.slowTime||0)>0?1-(e.slow||0):1),dt,w.arena);e.x=q.x;e.y=q.y;blockEnemyByWalls(w,e,before);const d=Math.hypot(e.x-before.x,e.y-before.y);e.walkDistance+=d;e.animation=d>1e-5?'walk':'idle';if(d>1e-5)e.angle=Math.atan2(e.x-before.x,e.y-before.y);}}
 // Os avisos são visuais: apenas o modelo dispara o dano no contato real.
 w.effects=w.effects.filter(f=>f.kingWarning!==e.id);
 const a=e.king;if(!a)return;
 const s=King.skills[a.kind],event=s.phases.findIndex(p=>p[2]);if(a.index>event)return;
 const marks=a.kind==='summon'?a.points:[a.kind==='leap'?{x:a.tx,y:a.ty}:e];
 for(const p of marks)w.effects.push({id:`king-${e.id}-${marks.indexOf(p)}`,kingWarning:e.id,source:e.id,x:p.x,y:p.y,radius:s.range||s.radius||.7,arc:a.kind==='slash'?s.arc:undefined,direction:Math.atan2(a.dy,a.dx),kind:'kingWarning',harmless:a.kind==='summon',color:s.color,visual:true,ground:true,fixedRadius:true,time:0,duration:10});
}
