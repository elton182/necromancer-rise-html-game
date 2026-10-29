import {initializeSpells,tickSpells,blockEnemyByWalls} from './spells.mjs';
// Arena experimental com colisões E3. Regras completas da campanha ainda pendentes.
// Mundo lógico: x/y no chão, distâncias em unidades, tempos em segundos.
import {TRAINING_ARENA,resolvePosition,moveCircle,lineClear,navigate} from './terrain.mjs';
import {RULES,initializeCombat,castBolt,beginDash,moveDash,updateProjectiles,tickRot,dealDamage} from './combat.mjs';
import {initializeHorde,tickHorde} from './horde.mjs';
import {applyAttributes} from './progression.mjs';
import {clearDrops,tickDrops} from './drops.mjs';
import EQ from './shared-equipment.mjs';
import {tickKing} from './fallen-king.mjs';
import {spawnEnemy,composition,tickEnemy,tickSleep,tickHostiles,R,CORPSE_LIFETIME} from './enemies.mjs';
export {dealDamage};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function animate(a,name){if(a.animation!==name){a.animation=name;a.animationTime=0;}}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function createWorld(options={}){
 const world={nextId:1,actors:[],effects:[],time:0,paused:false,hits:0,horde:6,random:Math.random};
 resetWorld(world,options);return world;
}
export function resetWorld(w,{horde=w.horde,armyMode='load',army,character,gearLevel=1,lootFilter='common',encounterWave=null}={}){
 if(!Number.isInteger(horde)||horde<0||horde>64)throw Error('Quantidade de aliados inválida.');
 Object.assign(w,{actors:[],effects:[],time:0,paused:false,hits:0,horde,armyMode,army:null,onAllyDeath:null,allyShots:[],command:null,castCooldown:0,arena:TRAINING_ARENA,equipment:character?.equipment||{},level:character?.level||1,gearLevel,lootFilter});
 clearDrops(w);w.spawnKingAdd=null;w.adventure=null;w.story=null;w.tutorial=null;w.offer=null;w.portal=null;w.landmarks=[];
 w.encounterWave=encounterWave;w.hostileShots=[];w.hostileZones=[];w.curses=null;w.lootConfig=null;
 function spawn(model,team,x,y,hp){const radius=model==='player'?.45:model==='fallenKing'?.48:team==='ally'?.35:.3,pos=resolvePosition({x,y},radius,w.arena);const a={id:w.nextId++,model,team,...pos,radius,hp,maxHp:hp,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,phase:w.actors.length*2.399};w.actors.push(a);return a;}
 w.player=spawn('player','player',0,4,RULES.base.hp);w.aim={x:0,y:-5};initializeCombat(w);initializeSpells(w);
 if(armyMode==='groups')initializeHorde(w,army);else for(let i=0;i<horde;i++){const a=i*2.399,r=2+i*.06;spawn('skeleton','ally',Math.sin(a)*r,4+Math.cos(a)*r,100);}
 // Um encontro novo começa com vida e mana cheias, calculadas pelo nível, pela árvore e pelos itens atuais.
 applyAttributes(w,{fill:true});
 if(encounterWave){const list=composition(encounterWave,8,w.random);for(let i=0;i<list.length;i++)spawnEnemy(w,list[i],(i%4-1.5)*4,-7-Math.floor(i/4)*4,{wave:encounterWave,tier:encounterWave<6?'common':i===7?'rare':i===5?'magic':'common'});}
 else for(let i=0;i<8;i++)spawn('zombie','enemy',(i%4-1.5)*4,-7-Math.floor(i/4)*4,60).xp=RULES.rewards.enemyXp;
 const bs=EQ.waveStats(encounterWave||1);w.boss=spawn('fallenKing','enemy',1,-13,encounterWave?Math.round(R.boss.hp*bs.hp):1000);Object.assign(w.boss,{xp:Math.round(R.boss.xp*bs.xp),dmg:encounterWave?Math.round(R.boss.dmg*bs.damage):R.boss.dmg,isBoss:true,gearWave:encounterWave||1});
}
export function cast(w){
 return castBolt(w);
}
export function dash(w,input={}){return beginDash(w,input);}
export function setPaused(w,paused){w.paused=!!paused;}
function tick(w,dt,input){
 w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);w.dash.cooldown=Math.max(0,w.dash.cooldown-dt);w.player.mp=Math.min(w.player.maxMp,w.player.mp+w.player.mpRegen*dt);if(w.player.hp>0)w.player.hp=Math.min(w.player.maxHp,w.player.hp+w.player.hpRegen*dt);w.player.veilTime=Math.max(0,w.player.veilTime-dt);if(w.player.veilTime<1e-9)w.player.veilTime=0;
 const p=w.player,x=clamp(Number(input.x)||0,-1,1),y=clamp(Number(input.y)||0,-1,1);
 // Movimento relativo à tela da câmera isométrica.
 let mx=x+y,my=y-x;const length=Math.hypot(mx,my);if(length){const magnitude=Math.min(1,Math.hypot(x,y));mx=mx/length*magnitude;my=my/length*magnitude;}
 const dashing=moveDash(w,dt);let moved=0;if(!dashing&&length&&p.hp>0){const pos=moveCircle(p,{x:mx*p.moveSpeed*dt,y:my*p.moveSpeed*dt},p.radius,w.arena);moved=pos.distance;p.x=pos.x;p.y=pos.y;p.walkDistance+=moved;}
 tickDrops(w,dt);updateProjectiles(w,dt);tickRot(w,dt);tickSpells(w,dt);
 if(w.armyMode==='groups')tickHorde(w,dt);
 tickHostiles(w,dt);
 for(const a of w.actors){
  if(a.groupType)continue;
  a.slowTime=Math.max(0,(a.slowTime||0)-dt);a.timer=Math.max(0,a.timer-dt);a.animationTime+=dt;a.pose=null;
  if(a.hp<=0){animate(a,'death');w.effects=w.effects.filter(f=>f.enemyWarning!==a.id);a.ability=null;a.jumpZ=0;if(a===w.boss){a.king=null;a.jumpZ=0;w.effects=w.effects.filter(f=>f.kingWarning!==a.id);}else if(a.team==='enemy')a.corpseTime=(a.corpseTime||0)+dt;continue;}
  if(a.dummy||a.team==='neutral')continue;
  if(a.home&&!tickSleep(w,a,dt))continue;
  if(a===w.boss){tickKing(w,a,dt);continue;}
  if(a.typeIndex!==undefined){tickEnemy(w,a,dt);continue;}
  if(a===p){if(dashing){animate(a,'idle');a.angle=Math.atan2(w.dash.dx,w.dash.dy);}else{if(a.timer<=0)animate(a,moved>1e-5?'walk':'idle');else if(a.animation==='cast')a.pose={anim:'cast',progress:Math.min(1,a.animationTime/.375)};a.angle=Math.atan2(w.aim.x-p.x,w.aim.y-p.y);}continue;}
  let target=p;
  if(a.team==='ally'){
   target=null;let nearest=Infinity;
   for(const e of w.actors)if(e.team==='enemy'&&e.hp>0){const d=distance(a,e);if(d<nearest){target=e;nearest=d;}}
  }
  const goal=target||{x:p.x+Math.sin(a.phase)*3,y:p.y+Math.cos(a.phase)*3};
  const dx=goal.x-a.x,dy=goal.y-a.y,d=Math.hypot(dx,dy),boss=a===w.boss;
  if(a.timer>0)continue;
  if(d>(boss?3:1.5)||!lineClear(a,goal,.05,w.arena)){
   const before={x:a.x,y:a.y};const slow=(a.slowTime||0)>0?1-(a.slow||0):1;const pos=navigate(a,goal,(a.team==='ally'?2.7:boss?1.1:1.35)*slow,dt,w.arena),dx=pos.x-a.x,dy=pos.y-a.y;a.x=pos.x;a.y=pos.y;if(a.team==='enemy')blockEnemyByWalls(w,a,before);a.walkDistance+=Math.hypot(a.x-before.x,a.y-before.y);if(pos.distance>1e-5)a.angle=Math.atan2(dx,dy);animate(a,pos.distance>1e-5?'walk':'idle');
  }else if(target&&p.hp>0){
   a.angle=Math.atan2(dx,dy);animate(a,boss?'windup':'attack');a.animationTime=0;a.actionId++;a.timer=a.team==='enemy'?2.4:1;
   w.effects.push({id:w.nextId++,kind:a.team==='enemy'?'danger':'melee',source:a.id,target:target.id,x:goal.x,y:goal.y,radius:boss?3:a.team==='enemy'?1.7:.65,time:0,delay:a.team==='enemy'?.85:.35,hit:false});
  }else animate(a,'idle');
 }
 if(w.actors.some(a=>a.corpseTime>=CORPSE_LIFETIME))w.actors=w.actors.filter(a=>!(a.corpseTime>=CORPSE_LIFETIME));
 for(let i=w.effects.length-1;i>=0;i--){
  const e=w.effects[i];if(!e)continue;
  if(e.visual){e.time+=dt;if(e.time>=e.duration)w.effects.splice(i,1);continue;}
  const source=w.actors.find(a=>a.id===e.source);
  if(source&&source.hp<=0&&!e.hit){w.effects.splice(i,1);continue;}
  e.time+=dt;
  if(source?.hp>0){if(source===w.boss){const t=e.time;source.pose=t<.7?{anim:'windup',progress:t/.7}:t<.85?{anim:'attack',progress:(t-.7)/.15*4/13}:t<1.1?{anim:'attack',progress:4/13+(t-.85)/.25*9/13}:{anim:'recover',progress:Math.min(1,(t-1.1)/1.3)};animate(source,source.pose.anim);}else source.pose={anim:'attack',progress:e.time<e.delay?e.time/e.delay*.5:Math.min(1,.5+(e.time-e.delay)/.3*.5)};}
  if(e.time+1e-9>=e.delay&&!e.hit){
   e.hit=true;
   if(e.kind==='danger'){for(const target of w.actors.filter(a=>(a===p||a.team==='ally')&&a.hp>0))if(distance(target,e)<e.radius)dealDamage(w,target,source===w.boss?25:12,source);}
   else{const target=w.actors.find(a=>a.id===e.target);if(target&&distance(target,e)<1)dealDamage(w,target,8,source);}
  }
  if(source===w.boss&&source.hp>0&&e.time>e.delay+.25)animate(source,'recover');
  if(e.time>e.delay+.3)w.effects.splice(i,1);
 }
 // Morte precisa aparecer também no quadro em que o dano foi aplicado.
 for(const a of w.actors)if(a.hp<=0){animate(a,'death');a.pose=null;a.strike=null;a.castRecovery=null;}
}
export function step(w,dt,input={}){
 if(w.paused||w.player.hp<=0||!Number.isFinite(dt)||dt<=0)return;
 // Subpassos limitam erro temporal; suspender uma aba não avança o combate inteiro.
 let left=Math.min(dt,.25);while(left>1e-9&&w.player.hp>0){const d=Math.min(left,1/60);tick(w,d,input);left-=d;}
}
