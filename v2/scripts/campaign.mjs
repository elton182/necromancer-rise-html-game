import {stageScale,waveCount} from './campaign-rules.mjs';
import {available} from './actions.mjs';
export {D} from './campaign-model.mjs';
import {D,normalizeCampaign,completeStage,offer} from './campaign-model.mjs';
import {resetWorld,step} from './training-model.mjs';
import {spawnEnemy,composition,withNewTypes} from './enemies.mjs';
import {snapshotHorde,equipGroup} from './horde.mjs';
import {syncSkills} from './grimoire.mjs';
import {boltCost} from './combat.mjs';
import {grantExperience} from './rewards.mjs';
import {collectAll} from './gear.mjs';
import {resolvePosition} from './terrain.mjs';
import {forestArena} from './forest-map.mjs';
import {villageArena,VILLAGE_PLAZA} from './village-map.mjs';
import {cryptArena} from './crypt-map.mjs';
import {trailArena} from './trail-map.mjs';
import {outpostArena} from './outpost-map.mjs';
import {newRun,LAST_WAVE,BETWEEN_WAVES,waveSize,spawnTimes,spawnPoint,completeWave,summary} from './arena-model.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
export const emptyArena=id=>({id,bounds:{minX:-20,maxX:20,minY:-20,maxY:20},solids:[]});
export function clean(s,arena,pos={x:0,y:4}){
 const w=s.world;if(w.armyMode==='groups')s.save.horde=snapshotHorde(w);collectAll(s);
 resetWorld(w,{horde:0,armyMode:'groups',army:s.save.horde,character:s.save.character,gearLevel:1,lootFilter:s.save.settings.lootFilter});w.actors=w.actors.filter(a=>a.team!=='enemy');w.boss.hp=0;w.arena=arena;w.sceneryRevision=(w.sceneryRevision||0)+1;w.adventure=null;w.portal=null;w.landmarks=[];Object.assign(w.player,pos);for(const a of w.actors.filter(a=>a.team==='ally')){Object.assign(a,{hp:a.maxHp,dead:false,sacrificed:false,exploded:false,deathHandled:false,deadTimer:0,returning:false});a.x=pos.x+(w.random()-.5)*2;a.y=pos.y+(w.random()-.5)*2;Object.assign(a,resolvePosition(a,a.radius,arena));}syncSkills(w);
}
function grant(s,id){const c=s.save.campaign;if(!c.grants.includes(id))c.grants.push(id);for(const army of [s.save.horde,s.world.army])if(army){army.profile={...army.profile,campaign:true,grants:[...c.grants]};army.loadout=army.loadout.map(id=>available(army,id)?id:'empty');}}

export function startCampaign(s){s.save.campaign=normalizeCampaign({...s.save.campaign,started:true});for(const id of ['raio','summon','maos','barreira'])grant(s,id);s.save.character.mode='campaign';s.save.settings.armyMode='groups';campaignMap(s);}
export function campaignMap(s){clean(s,emptyArena('campaign-map'));s.scene='map';s.world.paused=true;s.save.campaign.resume=s.save.campaign.village?'village':'map';if(!s.save.campaign.story.intro)s.world.story={id:'intro',pages:D.stories.camp_intro,index:0};}
export function nextStory(s){const story=s.world.story;if(!story)return false;story.index++;if(story.index>=story.pages.length){s.save.campaign.story[story.id]=1;if(story.id==='post4'&&!s.save.campaign.story.end){s.world.story={id:'end',pages:D.stories.camp_end,index:0};return true;}s.world.story=null;s.world.paused=!!s.world.adventure?.done||s.scene!=='training'&&s.scene!=='village';}return true;}
export function launchStage(s,n){const c=s.save.campaign;if(!c.started||!D.stages[n]||n>c.unlocked)return false;const stage=D.stages[n];for(const id of ['raio','summon','maos','barreira'])grant(s,id);
 const arena=n===1?cryptArena():n===2?forestArena():n===3?trailArena():n===4?outpostArena():emptyArena('campaign-'+n);
 clean(s,arena,n===1?{x:-6,y:0}:n===3?{x:2.5,y:0}:{x:0,y:10});const w=s.world;s.scene='training';w.adventure={kind:'stage',n,done:false,wave:0,queue:[],wait:n===2?3.2:n===4?3.6:0,rooms:n===1?clone(D.rooms).map((r,i)=>({...r,state:i===0?'active':'idle',wi:0})):[],zones:n===3?clone(D.strip):[],active:null};w.gearLevel=n;
 w.tutorial={stage:n,index:0,pages:(D.tutorials[n]||[]).map(t=>t.replace('(20 MP)',`(${boltCost(w)} MP)`))};w.portal={x:n===1?-6:0,y:n===1?0:10};
 if(n===1){for(const [x,y]of [[2,-3],[4.5,0],[2,3]]){const e=campEnemy(s,0,x,y,'A');Object.assign(e,{hp:28,maxHp:28,dmg:0,spd:0,xp:6,dummy:true});}doors(w,[false,false,false]);}
 if(!c.story['pre'+n]){w.story={id:'pre'+n,pages:D.stories['camp_pre'+n],index:0};w.paused=true;}
 if(stage.grant==='summon'&&!w.army.loadout.includes('zombie'))equipGroup(w,2,'zombie',{preparation:true});
 return true;
}
function doors(w,open){const base=w.arena.solids.filter(s=>!s.door);w.arena.solids=[...base,...D.doors.flatMap((d,i)=>open[i]?[]:[{kind:'box',door:true,look:'gate',x:d.x,y:(d.y0+d.y1)/2,width:d.w,depth:d.y1-d.y0,height:.9}])];w.adventure.doors=open;w.sceneryRevision++;}
function campEnemy(s,index,x,y,room,mission=false){const w=s.world,r=w.adventure,t=spawnEnemy(w,index,x,y),n=r.n||1,level=s.save.character.level,route=mission&&r.mission.layout==='strip',arena=n===2||mission&&!route,combatWave=r.combatWave??r.wave??0;
 const scale=route?(r.mission.enemyMult||1)*(1+(level-1)*.05):arena?1:stageScale(n,level).hp;
 t.hp=t.maxHp=Math.round(t.type.hp*scale)*(1+combatWave*.12);t.dmg=Math.round(t.type.dmg*(route?Math.sqrt(scale):arena?1:stageScale(n,level).dmg));t.room=room;t.gearWave=r.kind==='stage'?n:r.mission.difficulty||1;w.gearLevel=t.gearWave;return t;}

function king(s,base,x=0,y=-12){const w=s.world,e=w.boss,q=resolvePosition({x,y},e.radius,w.arena);Object.assign(e,{...q,hp:base.hp,maxHp:base.hp,dmg:base.dmg,spd:base.spd,xp:base.xp,dead:false,rewarded:false,king:null,kingCd:null,animation:'idle',jumpZ:0,gearWave:w.adventure.kind==='stage'?w.adventure.n:w.adventure.mission.difficulty||1});w.gearLevel=e.gearWave;w.spawnKingAdd=(p,owner)=>{const add=spawnEnemy(w,0,p.x,p.y,{wave:1,owner:owner.id}),sourceWave=w.adventure.n===4?6:w.adventure.zones?.length?0:w.adventure.wave+1;add.hp=add.maxHp=add.type.hp*(1+sourceWave*.12);add.gearWave=owner.gearWave;return add;};w.actors.push(e);return e;}
// Fase 1 (tutorial) mantém os tipos básicos; depois Ladrão, Humanoide Grifo e Aranha entram por nível (2×fase ou dificuldade + onda).
function queue(s,list,room,cx,cy){const r=s.world.adventure,level=r.n===1?0:2*(r.kind==='stage'?r.n:r.mission.difficulty||1)+(r.wave||0);r.queue=withNewTypes(list,level).map((index,i)=>({index,room,time:i*.18,x:cx+(i%4-1.5)*2.5,y:cy+(Math.floor(i/4)%3-1)*2}));r.wait=0;}
function living(w,room){return w.actors.some(e=>e.team==='enemy'&&e.hp>0&&(room===undefined||e.room===room));}
function finish(s){const w=s.world,r=w.adventure;if(r.done)return;r.done=true;w.progressChanged=true;w.hostileShots=[];w.hostileZones=[];w.effects=[];w.paused=true;
 if(r.kind==='stage'){const result=completeStage(s.save.campaign,r.n);s.save.campaign=result.state;s.save.character.gold+=result.gold;grantExperience(s,result.xp);if(r.n===4){s.save.horde.profile.act1=true;w.army.profile.act1=true;}w.notice=result.first?`Fase concluída · +${result.gold} ouro · +${result.xp} XP`:'Fase concluída novamente';if(result.first&&!s.save.campaign.story['post'+r.n])w.story={id:'post'+r.n,pages:D.stories['camp_post'+r.n],index:0};}
 else {const m=r.mission;s.save.character.gold+=Math.floor(m.rewardSouls*.6+w.random()*30);grantExperience(s,m.rewardExp);w.notice='Missão concluída · '+m.label;}
}
export function enterVillage(s){if(!s.save.campaign.village)return false;clean(s,villageArena(),{x:0,y:9});s.scene='village';s.world.paused=false;s.save.campaign.resume='village';s.world.portal={x:0,y:-9};s.world.offers={};s.world.landmarks=[{id:'portal',name:'Portal da Campanha',x:0,y:-9},{id:'map',name:'Mapa da Campanha',x:-6,y:-8},{id:'merchant',name:'Mercador',x:8,y:-6},{id:'endless',name:'Guardião das Waves',x:4,y:5},{id:'valdoria',name:'Emissária de Valdoria',x:-4,y:5},...Object.entries(D.npcs).map(([id,n])=>({id,name:id==='bram'?'Bran, o ferreiro':n.name,x:n.pos[0],y:n.pos[1]}))];
 const models={bram:'npcBran',lysa:'npcLysa',tilda:'npcTilda',vesper:'specter',merchant:'npcMerchant',endless:'npcBram',valdoria:'npcLysa'};for(const l of s.world.landmarks){if(['map','portal'].includes(l.id))continue;s.world.actors.push({id:s.world.nextId++,model:models[l.id],team:'neutral',...l,radius:.4,hp:1,maxHp:1,angle:l.id==='bram'?Math.atan2(VILLAGE_PLAZA.x-l.x,VILLAGE_PLAZA.y-l.y):0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,abilityLabel:l.name,labelTime:999});}return true;}
export function makeOffer(s,id){if(s.world.offers?.[id]){s.world.offer=s.world.offers[id];return s.world.offer;}const result=offer(s.save.campaign,id,s.world.random);s.save.campaign=result.state;s.world.offer=result.mission;if(s.world.offers)s.world.offers[id]=result.mission;return result.mission;}
export function launchMission(s,mission=s.world.offer){if(!s.save.campaign.village||!mission)return false;const copy=clone(mission),strip=copy.layout==='strip';clean(s,strip?{id:'village-route',bounds:{minX:0,maxX:150,minY:-3.4,maxY:3},solids:[]}:emptyArena('village-mission'),strip?{x:2.5,y:0}:{x:0,y:10});s.scene='training';s.world.adventure={kind:'mission',n:0,mission:copy,done:false,wave:0,queue:[],wait:1,zones:strip?clone(D.route):[],active:null};s.world.portal=strip?{x:2.5,y:0}:{x:0,y:10};return true;}
// Arena Infinita: pelo Guardião das Waves. O recorde é gravado a cada wave concluída, não ao sair.
export function launchArena(s){if(!s.save.campaign.village)return false;const progress=s.save.character.waveProgress;clean(s,emptyArena('arena'),{x:0,y:10});const w=s.world;s.scene='training';w.adventure=newRun(progress);w.gearLevel=progress.selected;w.portal={x:0,y:10};return true;}
function tickArena(s,dt){const w=s.world,r=w.adventure;
 for(const p of r.queue)p.time-=dt;const ready=r.queue.filter(p=>p.time<=0);r.queue=r.queue.filter(p=>p.time>0);
 for(const p of ready){const e=spawnEnemy(w,p.index,p.x,p.y,{wave:r.wave});Object.assign(e,resolvePosition(e,e.radius,w.arena));}
 if(r.queue.length||living(w))return;
 if(r.active){r.active=false;r.completed++;const result=completeWave(s.save.character.waveProgress,r.wave);r.record=r.record||result.record;s.save.character.waveProgress=result.progress;s.save.character.gold+=result.reward.gold;grantExperience(s,result.reward.xp);w.progressChanged=true;
  w.notice=`Wave ${r.wave} concluída · +${result.reward.gold} ouro · +${result.reward.xp} XP`;if(r.wave>=LAST_WAVE){r.done=true;w.paused=true;return;}r.wait=BETWEEN_WAVES;return;}
 r.wait-=dt;if(r.wait>0)return;
 r.wave++;w.gearLevel=r.wave;const count=waveSize(r.wave),list=composition(r.wave,count,w.random),times=spawnTimes(count,w.random);
 r.queue=list.map((index,i)=>({index,time:times[i],...spawnPoint(w.random,w.player)}));r.active=true;w.notice=`Wave ${r.wave} · ${count} inimigos`;
}
export function returnAdventure(s){const r=s.world.adventure,note=r?.conquest?(r.result||'Valdoria: tentativa encerrada; o progresso foi preservado.'):r?.kind==='arena'||r?.kind==='expedition'?summary(r,s.save.character.waveProgress):null;if(r&&!r.done&&s.world.player.hp<=0){s.world.drops=[];}const result=s.save.campaign.village?enterVillage(s):campaignMap(s);if(note)s.world.notice=note;return result;}
export function tickAdventure(s,dt){const w=s.world,r=w.adventure;if(!r||w.paused||r.done||w.player.hp<=0)return;
 if(r.kind==='arena')return tickArena(s,dt);
 if(r.kind==='expedition'||r.kind==='lab'||r.kind==='siege'||r.kind==='custom-map')return;
 for(const p of r.queue)p.time-=dt;const ready=r.queue.filter(p=>p.time<=0);r.queue=r.queue.filter(p=>p.time>0);for(const p of ready){const e=campEnemy(s,p.index,p.x,p.y,p.room,r.kind==='mission');Object.assign(e,resolvePosition(e,e.radius,w.arena));}
 if(r.queue.length)return;
 if(r.n===1){for(let i=0;i<r.rooms.length;i++){const room=r.rooms[i];if(room.state==='idle'&&w.player.x>room.x0+1.8&&w.player.x<room.x1-1.8){room.state='active';w.notice='Sala selada · derrote todos para abrir as portas';r.active=i;const open=[...r.doors];if(i>0)open[i-1]=false;if(i<3)open[i]=false;doors(w,open);room.wait=.9;}
 if(room.state==='active'&&!living(w,room.id)){if(room.wait>0){room.wait-=dt;continue;}if(room.wi<room.waves.length){queue(s,room.waves[room.wi++],room.id,(room.x0+room.x1)/2,0);room.wait=1.4;return;}room.state='clear';w.notice='Portas abertas · siga pelo corredor';const open=[...r.doors];if(i>0)open[i-1]=true;if(i<3)open[i]=true;doors(w,open);if(i===3)finish(s);}}return;}
 if(r.zones.length){const z=r.zones.find(z=>!z.done);if(!z){if(w.player.x>145)finish(s);return;}if(!z.active&&w.player.x>=z.x){z.active=true;z.wi=0;z.wait=.5;w.arena.solids=[...w.arena.solids.filter(s=>!s.lock),{kind:'box',lock:true,look:'barricade',x:z.x+12,y:0,width:1,depth:6.4,height:.9},{kind:'box',lock:true,look:'barricade',x:z.x-12,y:0,width:1,depth:6.4,height:.9}];w.sceneryRevision++;}
 if(z.active&&!living(w)){z.wait-=dt;if(z.wait>0)return;if(z.wi<z.waves.length){const list=z.waves[z.wi++];if(list.includes('boss')){const scale=(r.mission.enemyMult||1)*(1+(s.save.character.level-1)*.05);king(s,{...r.mission.boss,hp:Math.round(r.mission.boss.hp*scale),dmg:Math.round(r.mission.boss.dmg*Math.sqrt(scale))},z.x+6,0);}else queue(s,list,'zone',z.x+6,0);z.wait=1.3;}else{z.done=true;z.active=false;w.arena.solids=w.arena.solids.filter(s=>!s.lock);w.sceneryRevision++;}}return;}
 if(living(w))return;r.wait-=dt;if(r.wait>0)return;
 if(r.n===4){if(r.wave===0){r.wave=1;king(s,{...D.captain,dmg:Math.round(D.captain.dmg*stageScale(4,s.save.character.level).dmg)});}else finish(s);return;}
 const max=r.kind==='mission'?r.mission.wavesGoal:6;
 if(r.wave>=max){if(r.kind==='mission'&&!r.bossSpawned){r.bossSpawned=true;king(s,r.mission.boss);return;}finish(s);return;}
 r.wave++;r.combatWave=r.n===2?r.wave+2:r.wave;const wave=r.n===2?r.wave+2:r.wave,mult=r.kind==='mission'?r.mission.enemyMult:.95,count=waveCount(wave,mult),available=Math.min(4,1+Math.floor(wave/2));queue(s,Array.from({length:count},()=>Math.floor(w.random()*available)),'wave',0,-5);r.wait=5;
}
