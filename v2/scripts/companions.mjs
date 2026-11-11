// Companheiros invocados fora da horda: o Golem de Gelo e o Clone Arcano do Mago. São aliados temporários com vida, dano e ritmo
// próprios, desenhados com um modelo existente (tinta e escala). Inimigos perto dele passam a atacá-lo (enemies.mjs).
// O laço comum de atores o ignora (`companion`); tudo acontece aqui. Os Cães Zumbis e os Esqueletos Magos do
// Necromante são tipos da horda (horde.mjs), permanentes e com reanimação.
// Regras e números em docs/habilidades/arvores.json; unidades de mundo, segundos, atualização por dt.
import {dealDamage} from './combat.mjs';
import {lineClear,navigate,resolvePosition} from './terrain.mjs';
import {fx} from './vfx-events.mjs';
import {MAGE_SUMMONS} from './marksman-model.mjs';
import {DRUID_SUMMONS,DRUID_ADVANCED} from './druid-model.mjs';

// hp e damage são frações da vida máxima e do dano de quem invoca (MAGE_SUMMONS); range inclui o raio do alvo.
export const COMPANIONS={
 iceGolem:{name:'Golem de Gelo',model:'abom',tint:'#9fd8ff',scale:.85,radius:.45,...MAGE_SUMMONS.iceGolem,range:1.8,rate:1.4,hitDelay:.45,speed:2.6,life:25,max:1,slow:.3,slowTime:1.5,color:'#9fe0ff'},
 // Clone Arcano do Mago: parado, sem golpe próprio; marksman.mjs repete os feitiços do Mago a partir dele.
 arcaneClone:{name:'Clone Arcano',model:'mageHero',tint:'#b78cff',scale:1,radius:.35,...MAGE_SUMMONS.arcaneClone,static:true,life:12,max:1,color:'#b78cff'},
 druidWolf:{name:'Lobo',model:'cryptHound',tint:'#b8c4a0',scale:.8,radius:.3,range:1.3,rate:1,hitDelay:.3,speed:4.2,life:0,max:4,color:'#b8d69a'},
 carnivorousPlant:{name:'Planta Carnívora',model:'carnivorousPlant',scale:1,radius:.4,range:4.5,rate:1.4,hitDelay:.4,speed:0,rooted:true,life:DRUID_SUMMONS.plantLife,max:1,color:'#96ce65'},
 forestPlant:{name:'Floresta Tropical',model:'carnivorousPlant',scale:1,radius:.4,range:4.5,rate:1.4,hitDelay:.4,speed:0,rooted:true,life:DRUID_ADVANCED.forest.life,max:DRUID_ADVANCED.forest.count,color:'#96ce65'},
};
const living=e=>e.team==='enemy'&&e.hp>0&&!e.dead;
const isBoss=(w,e)=>e===w.boss||e.isBoss;
const animate=(a,name)=>{if(a.animation!==name){a.animation=name;a.animationTime=0;}};
export const companionsOf=(w,type)=>w.actors.filter(a=>a.companion===type);

export function initializeCompanions(w){}
// Troca de cena, morte e reinício: invocações somem.
export function clearCompanions(w){
 w.actors=(w.actors||[]).filter(a=>!a.companion);
 if(w.effects)w.effects=w.effects.filter(f=>!f.companionRing);
}
// Cria um companheiro perto de `at`. stats: {hp, damage} já calculados por quem invoca. Acima do limite do tipo, o mais antigo sai.
export function spawnCompanion(w,type,at,stats){
 const spec=COMPANIONS[type],pos=resolvePosition({x:at.x,y:at.y},spec.radius,w.arena),hp=Math.max(1,Math.round(stats.hp));
 const a={id:w.nextId++,model:spec.model,team:'ally',companion:type,tint:spec.tint,scale:spec.scale,...pos,radius:spec.radius,hp,maxHp:hp,damage:Math.max(1,Math.floor(stats.damage)),angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,phase:(w.nextId%7)*.9,until:spec.life?w.time+spec.life:null};
 w.actors.push(a);
 const same=companionsOf(w,type).filter(c=>c.hp>0);
 for(const old of same.slice(0,Math.max(0,same.length-spec.max)))w.actors=w.actors.filter(x=>x!==old);
 fx(w,'summonBurst',{x:a.x,y:a.y,radius:1.1*spec.scale,color:spec.color,duration:.5});
 return a;
}
function nearestEnemy(w,from,range){
 let best=null,near=range;
 for(const e of w.actors){if(!living(e))continue;const d=Math.hypot(e.x-from.x,e.y-from.y)-(e.radius||.3);if(d<=near){near=d;best=e;}}
 return best;
}
function strike(w,a,spec){
 const s=a.strike;a.strike=null;
 const t=w.actors.find(e=>e.id===s.target&&living(e));
 if(!t||Math.hypot(t.x-a.x,t.y-a.y)>spec.range+(t.radius||.3)+.4)return;
 if(!lineClear(a,t,.05,w.arena))return;
 dealDamage(w,t,Math.max(1,Math.floor(a.damage*(s.claw||s.bite||1))),a,s.claw?'Garras do Líder':s.bite?'Mordida Pesada':spec.name);
 if(s.claw)fx(w,'slash',{x:a.x,y:a.y,dx:Math.sin(a.angle),dy:Math.cos(a.angle),radius:spec.range,arc:Math.PI*.8,color:'#e5ca82',mood:'claw',duration:.25});
 if(spec.slow&&living(t)&&!isBoss(w,t)){t.slow=Math.max(t.slow||0,spec.slow);t.slowTime=Math.max(t.slowTime||0,spec.slowTime);t.companionChill=w.time+spec.slowTime;}
 if(spec.rooted)fx(w,'thorns',{x:t.x,y:t.y,radius:.6,color:spec.color,duration:.35});
 fx(w,'impact',{x:t.x,y:t.y,h:.8,color:spec.color,size:(s.bite?1.3:.8)*spec.scale,mood:'claw',duration:.3});
}
export function tickCompanions(w,dt){
 if(w.paused)return;
 if(w.player.hp<=0||w.player.dead){clearCompanions(w);return;}
 w.effects=w.effects.filter(f=>!f.companionRing);
 const p=w.player,gone=new Set();
 for(const a of w.actors){
  if(!a.companion)continue;
  const spec=COMPANIONS[a.companion];
  a.animationTime+=dt;a.timer=Math.max(0,a.timer-dt);a.slowTime=Math.max(0,(a.slowTime||0)-dt);
  if(a.hp>0&&a.until&&w.time>=a.until){a.hp=0;fx(w,'summonBurst',{x:a.x,y:a.y,radius:1,color:spec.color,duration:.5});}
  if(a.hp<=0){animate(a,'death');a.strike=null;a.deadTime=(a.deadTime||0)+dt;if(a.deadTime>2)gone.add(a);continue;}
  // Parado (Clone Arcano): só vira para o inimigo mais próximo e volta ao repouso depois de conjurar.
  if(spec.static){const t=nearestEnemy(w,a,12);if(t)a.angle=Math.atan2(t.x-a.x,t.y-a.y);if(a.animation!=='idle'&&a.animationTime>.8)animate(a,'idle');continue;}
  if(a.strike&&w.time+1e-9>=a.strike.at)strike(w,a,spec);
  if(a.strike)continue;
  const hunt=a.companion==='druidWolf'&&w.druidHunt?.until>w.time?w.druidHunt:null,prey=hunt&&w.actors.find(e=>e.id===hunt.target&&living(e));
  const target=prey||nearestEnemy(w,a,spec.rooted?spec.range:12)||(p.hp>0&&!spec.rooted?nearestEnemy(w,p,10):null);
  let goal,reach;
  if(target){
   const d=Math.hypot(target.x-a.x,target.y-a.y),inRange=d<=spec.range+(target.radius||.3)&&lineClear(a,target,.05,w.arena);
   if(inRange&&a.timer<=0){
    const claw=a.packLeader&&prey&&a.huntUsed!==hunt.id?DRUID_ADVANCED.leader.claw:0;if(claw)a.huntUsed=hunt.id;
    const rank=a.companion==='druidWolf'?(w.druidRanks?.mordidaPesada||0):0,bite=!claw&&rank>0&&w.time>=(a.biteReady||0)?DRUID_SUMMONS.bite+DRUID_SUMMONS.bitePerRank*(rank-1):0;
    if(bite)a.biteReady=w.time+DRUID_SUMMONS.biteInterval;
    a.angle=Math.atan2(target.x-a.x,target.y-a.y);animate(a,'attack');a.animationTime=0;a.actionId++;a.timer=spec.rate;a.strike={at:w.time+spec.hitDelay,target:target.id,bite:claw?0:bite,claw};continue;}
   if(inRange){a.angle=Math.atan2(target.x-a.x,target.y-a.y);animate(a,'idle');continue;}
   goal=target;reach=spec.range*.8;
  }else{goal={x:p.x+Math.sin(a.phase)*2.4,y:p.y+Math.cos(a.phase)*2.4};reach=.6;}
  if(spec.rooted||Math.hypot(goal.x-a.x,goal.y-a.y)<=reach){animate(a,'idle');continue;}
  const before={x:a.x,y:a.y},slow=a.slowTime>0?1-(a.slow||0):1,pos=navigate(a,goal,spec.speed*slow,dt,w.arena),mx=pos.x-a.x,my=pos.y-a.y;
  a.x=pos.x;a.y=pos.y;a.walkDistance+=Math.hypot(a.x-before.x,a.y-before.y);if(pos.distance>1e-5)a.angle=Math.atan2(mx,my);animate(a,pos.distance>1e-5?'walk':'idle');
 }
 if(gone.size)w.actors=w.actors.filter(a=>!gone.has(a));
 for(const e of w.actors)if(living(e)&&e.companionChill>w.time)w.effects.push({id:'cchill-'+e.id,companionRing:true,x:e.x,y:e.y,radius:(e.radius||.3)+.4,color:COMPANIONS.iceGolem.color,visual:true,ground:true,fixedRadius:true,time:2,duration:10});
}
