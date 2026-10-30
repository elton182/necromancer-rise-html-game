import {clean} from './campaign.mjs';
import {spawnEnemy} from './enemies.mjs';
import {grantExperience} from './rewards.mjs';
import {CORE,PADS,TOWERS,LANES,MODIFIERS,WAVES,MAX_TIER,normalizeSiege,guardianStats,siegeArena,wavePlan,towerCost,runeCost,victoryReward} from './siege-model.mjs';
const fail=message=>({ok:false,message}),ok=message=>({ok:true,message});
export const siegeAccess=s=>s.scene==='village'&&s.save.campaign.village&&!!s.save.campaign.cleared[4];
export function launchSiege(s,tier=1,modifier='none'){
 const p=normalizeSiege(s.save.character.siege);if(!siegeAccess(s))return fail('Conclua o Ato I e entre na vila para iniciar o cerco.');
 if(!Number.isInteger(tier)||tier<1||tier>p.unlocked||!Object.hasOwn(MODIFIERS,modifier))return fail('Grau ou modificador indisponível.');
 clean(s,siegeArena(),{x:0,y:3});s.scene='training';s.world.siegeMenu=false;const w=s.world;
 w.adventure={kind:'siege',n:0,tier,modifier,done:false,won:false,wave:0,active:false,queue:[],essence:240,integrity:CORE.hp,towers:[],rune:p.rune,runeRank:p.runes[p.rune],mission:{label:'Cerco ao Ritual'},zones:[]};
 w.portal=null;w.gearLevel=8+3*tier;w.paused=false;
 w.actors.push({id:w.nextId++,model:'siegeCore',team:'neutral',...CORE,hp:1,maxHp:1,radius:0,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0});
 w.lootConfig=()=>({level:8+3*tier});return ok('Prepare suas torres e inicie a primeira onda.');
}
export function buildTower(s,padId,kind){
 const w=s.world,r=w.adventure,p=PADS.find(p=>p.id===padId);if(s.scene!=='training'||r?.kind!=='siege'||r.done||w.player.hp<=0||!p||!Object.hasOwn(TOWERS,kind))return fail('Construção indisponível.');
 if(r.towers.some(t=>t.pad===padId))return fail('Este pedestal já está ocupado.');const def=TOWERS[kind];if(r.essence<def.cost)return fail('Essência insuficiente.');
 const t={id:w.nextId++,model:def.model,team:'neutral',x:p.x,y:p.y,pad:padId,kind,rank:1,cd:0,hp:1,maxHp:1,radius:0,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0};r.essence-=def.cost;r.towers.push(t);w.actors.push(t);return ok(def.name+' construída.');
}
export function upgradeTower(s,padId){const w=s.world,r=w.adventure,t=r?.towers?.find(t=>t.pad===padId);if(s.scene!=='training'||r?.kind!=='siege'||r.done||w.player.hp<=0||!t||t.rank>=3)return fail('Melhoria indisponível.');const cost=towerCost(t);if(r.essence<cost)return fail('Essência insuficiente.');r.essence-=cost;t.rank++;t.cd=0;for(const a of w.actors.filter(a=>a.siegeGuard===t.id&&a.hp>0)){const stats=guardianStats(t,r),ratio=a.hp/a.maxHp;Object.assign(a,stats,{hp:Math.max(1,Math.round(stats.maxHp*ratio))});}return ok('Torre melhorada para grau '+t.rank+'.');}
export function startSiegeWave(s){const r=s.world.adventure;if(s.scene!=='training'||r?.kind!=='siege'||r.done||r.active||s.world.player.hp<=0)return false;r.wave++;r.queue=wavePlan(r.tier,r.wave,r.modifier);r.elapsed=0;r.active=true;s.world.paused=false;return true;}
export function attuneRune(s,kind,upgrade=false){
 if(!siegeAccess(s)||!Object.hasOwn(TOWERS,kind))return fail('Runas só podem mudar na vila após o Ato I.');const p=normalizeSiege(s.save.character.siege);
 if(upgrade){const cost=runeCost(p.runes[kind]);if(p.runes[kind]>=3||p.shards<cost)return fail('Fragmentos insuficientes ou runa no máximo.');p.shards-=cost;p.runes[kind]++;}p.rune=kind;s.save.character.siege=p;return ok('Runa de '+TOWERS[kind].name+' equipada.');
}
export function endSiege(s,won){
 const w=s.world,r=w.adventure;if(r?.kind!=='siege'||r.done)return false;
 r.done=true;r.won=won;r.active=false;r.queue=[];w.paused=true;w.projectiles=[];w.allyShots=[];w.hostileShots=[];w.hostileZones=[];w.effects=[];w.command=null;
 if(won){const p=normalizeSiege(s.save.character.siege),reward=victoryReward(r.tier,r.modifier);p.best=Math.max(p.best,r.tier);p.unlocked=Math.min(MAX_TIER,Math.max(p.unlocked,r.tier+1));p.wins++;p.shards+=reward.shards;s.save.character.siege=p;s.save.character.gold+=reward.gold;grantExperience(s,reward.xp);r.result='Ritual concluído · +'+reward.gold+' ouro · +'+reward.xp+' XP · +'+reward.shards+' fragmento(s) rúnico(s).';}
 else r.result='O obelisco foi destruído. O ritual falhou.';
 w.progressChanged=true;return true;
}
export function tickSiege(s,dt){
 const w=s.world,r=w.adventure;if(s.scene!=='training'||r?.kind!=='siege'||r.done||w.paused||w.player.hp<=0)return;
 if(r.integrity<=0){endSiege(s,false);return;}if(!r.active)return;
 r.elapsed+=dt;for(const q of r.queue.filter(q=>q.time<=r.elapsed)){
  const pos=LANES[q.lane].points[0],e=spawnEnemy(w,q.type,pos.x,pos.y,{wave:1,tier:q.boss?'rare':'common'});
  Object.assign(e,{siegeLane:q.lane,siegeNode:1,siegeBoss:q.boss,hp:q.hp*(q.boss?9:1),maxHp:q.hp*(q.boss?9:1),spd:q.speed*(q.boss?.7:1),dmg:q.damage*(q.boss?2:1),xp:q.boss?120:12,gearWave:w.gearLevel});
  if(q.boss){e.model='fallenKing';e.isBoss=true;w.boss=e;}
 }r.queue=r.queue.filter(q=>q.time>r.elapsed);
 if(!r.queue.length&&!w.actors.some(a=>a.team==='enemy'&&a.siegeLane!==undefined&&a.hp>0)){
  r.active=false;if(r.wave===WAVES)endSiege(s,true);else{r.essence+=75+10*r.wave;w.notice='Onda '+r.wave+' repelida. Prepare as defesas para a próxima.';}
 }
}
