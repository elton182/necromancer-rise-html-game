// Map expeditions reuse the combat engine; the original endless arena remains selectable.
const EXPEDITION={active:false,map:null,boss:null,cleared:false};
let endlessMode=optsLoad()?.endlessMode==='classic'?'classic':'expedition';
function setEndlessMode(mode){
 endlessMode=mode==='classic'?'classic':'expedition';
 const options=optsLoad()||{};options.endlessMode=endlessMode;optsSave(options);
}
function expeditionClamp(q,r=.4){
 const m=EXPEDITION.map;if(!m)return;
 q.x=clamp(q.x,r,m.width-r);q.y=clamp(q.y,r,m.height-r);
}
function expeditionClearCombat(){
 enemies=[];spawnQueue=[];enemiesLeft=0;bossEnemy=null;droppedItems=[];
 resetAbilities();boltsFx=[];spellFx=[];eshots=[];mobZones=[];soulOrbs=[];particles=[];
 minionCommand=null;commandMarker=null;
}
function expeditionPlaceArmy(){
 const p=EXPEDITION.map.entry;setPlayerAt(p.x+3,p.y+2);cam.x=P.x;cam.y=P.y;expeditionCamera(1);
 minions.forEach((m,i)=>{
  const a=i*2.4;m.x=P.x+Math.cos(a)*2;m.y=P.y+Math.sin(a)*2;
  m.target=null;m.returning=false;m.allyLeap=null;m.jumpZ=0;m._terrainPath=null;m._evade=null;
 });
}
function expeditionCamera(dt){
 const m=EXPEDITION.map,hw=W/S/2,hh=H/S/2;
 const x=clamp(P.x,Math.min(hw,m.width/2),Math.max(m.width-hw,m.width/2));
 const y=clamp(P.y,Math.min(hh,m.height/2),Math.max(m.height-hh,m.height/2));
 cam.x+=(x-cam.x)*Math.min(1,dt*5);cam.y+=(y-cam.y)*Math.min(1,dt*5);
}
function expeditionStartMap(n){
 EXPEDITION.active=true;EXPEDITION.cleared=false;EXPEDITION.map=ExpeditionModel.plan(n);
 expeditionClearCombat();wave=n;missionWave=n;waveActive=true;waveEndTimer=0;
 CAMP.noWaves=true;STG.on=true;STG.kind='expedition';
 Object.assign(STG,{clamp:expeditionClamp,clampE:expeditionClamp,cam:expeditionCamera,update:null,onKill:null,drawFore:expeditionDrawMarkers,drawGround:expeditionDrawGround,minimap:expeditionMinimap});
 BIOME=BIOMES[EXPEDITION.map.biome];vigC=null;
 expeditionBuildScenery();expeditionPlaceArmy();
 for(const group of EXPEDITION.map.groups)for(const mob of group.mobs){
  const e=spawnEnemy(ENEMY_TYPES[mob.type],mob.x,mob.y),t=ExpeditionModel.tiers[group.tier];
  e.expedition=true;e.lootTier=group.tier;e.home={x:mob.x,y:mob.y};e.alert=false;
  e.hp=e.maxHp=Math.round(e.maxHp*t.hp);e.dmg=Math.round(e.dmg*t.damage);e.spd*=t.speed;e.xp=Math.round(e.xp*t.xp);e.souls=Math.round(e.souls*t.xp);
 }
 const base=SoulWardenModel.type,p=EXPEDITION.map.exit;
 const boss=spawnEnemy({...base},p.x-4,p.y);
 boss.isBoss=true;boss.expedition=true;boss.expeditionBoss=true;boss.home={x:boss.x,y:boss.y};boss.alert=false;
 boss.atkRate=1.8;boss.atkR=1.8;bossEnemy=boss;EXPEDITION.boss=boss;
 enemiesLeft=enemies.length;
 showWaveBanner('EXPEDIÇÃO · WAVE '+n,BIOME.name+' · Explore ou siga até o boss','#d4af37');
 playSound('waveStart');expeditionUpdateHud();updateBossHpBar();
}
function expeditionBuildScenery(){
 const m=EXPEDITION.map,rr=ExpeditionModel.random(wave*3571);
 props=[];solids=[];torches=[];fogs=[];motes=[];
 const kinds={grave:['tomb','column','skulls'],forest:['oak','pine','bush'],desert:['cactus','rock','ruin'],snow:['pine','ice','rock'],village:['house','barrel','crate']}[m.biome];
 for(let i=0;i<190;i++){
  const x=3+rr()*(m.width-6),y=3+rr()*(m.height-6);
  if(Math.abs(y-ExpeditionModel.routeY(m.route,x))<5||Math.hypot(x-m.entry.x,y-m.entry.y)<7||Math.hypot(x-m.exit.x,y-m.exit.y)<9||m.groups.some(g=>Math.hypot(x-g.x,y-g.y)<5))continue;
  const type=kinds[Math.floor(rr()*kinds.length)];
  props.push({type,x,y,sc:.7+rr()*.5,seed:rr(),w:.7+rr()*.4,h:1.2,v:Math.floor(rr()*3),snow:m.biome==='snow',tilt:rr()-.5});
  if(['oak','pine','rock','cactus','column','house','ice','ruin'].includes(type))solids.push({x,y,r:type==='house'?2:.55});
 }
 for(let x=8;x<m.width;x+=16){
  const y=ExpeditionModel.routeY(m.route,x)+4.5;
  props.push({type:'brazier',x,y,col:'orange',seed:rr()});torches.push({x,y:y-.9,r:10,col:'#ffbc72',a:.65,steady:true});
 }
 // Small repeating texture: drawing only visible tiles avoids a giant map canvas.
 const tile=document.createElement('canvas');tile.width=tile.height=128;const c=tile.getContext('2d');
 const ground=BIOME.ground?.A||[37,30,45];c.fillStyle='rgb('+ground.join(',')+')';c.fillRect(0,0,128,128);
 for(let i=0;i<1500;i++){c.fillStyle=rr()>.5?'rgba(0,0,0,.09)':'rgba(240,230,180,.06)';c.fillRect(rr()*128,rr()*128,1+rr()*4,1+rr()*2);}
 EXPEDITION.tile=tile;
 for(let i=0;i<BIOME.motes.n;i++)motes.push({x:0,y:0,z:rr()*3,ph:rr()*6.28,col:BIOME.motes.cols[i%BIOME.motes.cols.length],fresh:true});
}
function expeditionDrawGround(){
 const m=EXPEDITION.map;
 ctx.save();ctx.beginPath();ctx.rect(sx(0),sy(0),m.width*S,m.height*S);ctx.clip();
 const tile=EXPEDITION.tile,left=Math.max(0,Math.floor((cam.x-W/S/2)/4)*4),top=Math.max(0,Math.floor((cam.y-H/S/2)/4)*4);
 for(let x=left;x<Math.min(m.width,cam.x+W/S/2+4);x+=4)for(let y=top;y<Math.min(m.height,cam.y+H/S/2+4);y+=4)ctx.drawImage(tile,sx(x),sy(y),4*S,4*S);
 ctx.lineCap='round';ctx.lineJoin='round';
 for(const [width,color]of [[5,'rgba(0,0,0,.18)'],[3.6,BIOME.path?.col||'#4a3b42']]){
  ctx.strokeStyle=color;ctx.lineWidth=width*S;ctx.beginPath();m.route.forEach((p,i)=>i?ctx.lineTo(sx(p.x),sy(p.y)):ctx.moveTo(sx(p.x),sy(p.y)));ctx.stroke();
 }
 ctx.restore();ctx.strokeStyle='#73816b';ctx.lineWidth=3;ctx.strokeRect(sx(0),sy(0),m.width*S,m.height*S);
}
function expeditionDrawMarkers(){
 const m=EXPEDITION.map;drawPortal({x:m.entry.x,y:m.entry.y});
 if(EXPEDITION.cleared)drawPortal({x:m.exit.x,y:m.exit.y});
 ctx.save();ctx.textAlign='center';ctx.font='bold 13px Georgia';ctx.fillStyle='#dfce96';
 ctx.fillText('G · Voltar à vila',sx(m.entry.x),sy(m.entry.y)-65);
 if(EXPEDITION.cleared)ctx.fillText(wave>=EquipmentModel.MAX_WAVE?'G · Retornar à vila':'G · Próximo bioma',sx(m.exit.x),sy(m.exit.y)-65);
 for(const e of enemies){
  if(e.dead||!e.expedition||e.lootTier==='common'||Math.abs(e.x-cam.x)>W/S/2+3||Math.abs(e.y-cam.y)>H/S/2+3)continue;
  const tier=ExpeditionModel.tiers[e.lootTier],color=e.isBoss?'#ff7755':tier?.color||'#ff7755';
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(sx(e.x),sy(e.y),S*.65,S*.33,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=color;ctx.fillText(e.isBoss?'BOSS':tier.name,sx(e.x),sy(e.y)-S*2.8*(e.type.sc||1));
 }
 ctx.restore();
}
function expeditionMinimap(){
 const m=EXPEDITION.map,w=Math.min(190,W*.34),h=w*m.height/m.width,x=20,y=26,k=w/m.width;
 ctx.save();ctx.fillStyle=BIOME.mm;ctx.fillRect(x,y,w,h);ctx.strokeStyle='#9caa86';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
 ctx.strokeStyle='#8a785b';ctx.beginPath();m.route.forEach((p,i)=>i?ctx.lineTo(x+p.x*k,y+p.y*k):ctx.moveTo(x+p.x*k,y+p.y*k));ctx.stroke();
 const dot=(px,py,color,r)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x+px*k,y+py*k,r,0,Math.PI*2);ctx.fill();};
 dot(m.entry.x,m.entry.y,'#b47aff',3);if(EXPEDITION.cleared)dot(m.exit.x,m.exit.y,'#b47aff',4);
 for(const e of enemies)if(!e.dead)dot(e.x,e.y,e.isBoss?'#ff6644':ExpeditionModel.tiers[e.lootTier]?.color||'#e44',e.isBoss?4:1.7);
 for(const a of minions)if(!a.dead)dot(a.x,a.y,'#4dff9a',1.6);
 dot(P.x,P.y,'#fff',3);ctx.font='10px Georgia';ctx.fillStyle='#e6dcc0';ctx.textAlign='right';ctx.fillText('BOSS →  ·  G nos portais',x+w,y-6);ctx.restore();
}
function expeditionUpdateHud(){
 document.getElementById('wave-txt').textContent='EXPEDIÇÃO '+wave+' · '+BIOME.name+' · '+(EXPEDITION.cleared?'Boss derrotado · G no portal final':'Boss → '+Math.round(Math.hypot(EXPEDITION.map.exit.x-P.x,EXPEDITION.map.exit.y-P.y))+' u');
}
function expeditionEnemyAwake(e,dt){
 if(!e.expedition)return true;
 const close=Math.hypot(e.x-P.x,e.y-P.y)<11||minions.some(m=>!m.dead&&Math.hypot(e.x-m.x,e.y-m.y)<7);
 if(close||e.hp<(e._lastExpeditionHp??e.maxHp))e.alert=true;
 e._lastExpeditionHp=e.hp;
 if(e.alert&&Math.hypot(e.x-P.x,e.y-P.y)>30&&!close){e.alert=false;e.target=null;e.ability=null;}
 if(e.alert)return true;
 if(Math.hypot(e.x-e.home.x,e.y-e.home.y)>.3)moveEnemyTo(e,e.home.x,e.home.y,e.spd,dt);
 return false;
}
function expeditionBossDown(){
 if(!EXPEDITION.active||EXPEDITION.cleared)return;
 EXPEDITION.cleared=true;bossEnemy=null;enemiesLeft=Math.max(0,enemiesLeft-1);endWave();
 showWaveBanner('BOSS DERROTADO!',wave>=EquipmentModel.MAX_WAVE?'Expedições concluídas · G no portal para voltar':'Explore mais ou use G no portal final para avançar','#d4af37');
 expeditionUpdateHud();updateBossHpBar();
}
function expeditionStop(){
 if(!EXPEDITION.active)return;
 EXPEDITION.active=false;EXPEDITION.map=null;EXPEDITION.boss=null;EXPEDITION.cleared=false;
 STG.on=false;STG.kind='circle';CAMP.noWaves=false;
}
(function installExpedition(){
 const classic=startEndless;startEndless=function(){
  if(endlessMode==='classic'){expeditionStop();STG.on=false;CAMP.noWaves=false;return classic();}
  gearEnsure();CAMP.on=false;CAMP.map=false;CAMP.inStage=false;gameState='field';VILLAGE_ROUTE.on=false;
  clearHubScene();document.getElementById('hub-overlay').style.display='none';
  currentMission={id:'v_expedition',endless:true,expedition:true,label:'EXPEDIÇÃO',wavesGoal:1e9,rewardSouls:0,rewardExp:0};
  expeditionStartMap(player.waveProgress.selected);
 };
 const start=startWave;startWave=function(){if(EXPEDITION.active)return;return start();};
 const end=endWave;endWave=function(){if(EXPEDITION.active&&(!EXPEDITION.cleared||!waveActive))return;return end();};
 const tick=update;update=function(dt){tick(dt);if(EXPEDITION.active&&gameState==='field')expeditionUpdateHud();};
 const portal=tryPortal;tryPortal=function(){
  if(!EXPEDITION.active)return portal();
  const m=EXPEDITION.map;if(Math.hypot(P.x-m.entry.x,P.y-m.entry.y)<3)return enterHub();
  if(EXPEDITION.cleared&&Math.hypot(P.x-m.exit.x,P.y-m.exit.y)<4){
   if(wave>=EquipmentModel.MAX_WAVE)return enterHub();
   gearCollectAvailable();
   if(droppedItems.some(d=>d.type==='equipment'&&lootDropAllowed(d))){floatMsg('Mochila cheia · I para liberar espaço antes de avançar',W/2,H*.4,'#e8c777');return;}
   expeditionStartMap(wave+1);return;
  }
  floatMsg(EXPEDITION.cleared?'Use G perto de um portal':'O boss está no final da trilha →',W/2,H*.4,'#d4af37');
 };
 const hub=enterHub;enterHub=function(){const result=hub();if(gameState==='hub')expeditionStop();return result;};
 const pause=gearRenderWaves;gearRenderWaves=function(body){
  pause(body);const box=document.createElement('div');box.className='gear-wave-info';
  box.innerHTML='<label>Modelo de waves <select aria-label="Modelo de waves"><option value="expedition">Expedição (padrão)</option><option value="classic">Arena clássica</option></select></label><p>Expedição: mapa amplo, bioma por wave, encontros comuns, mágicos e raros. Derrote o boss e avance pelo portal final com seus minions. Arena clássica: ondas de inimigos na arena original.</p>';
  const select=box.querySelector('select');select.value=endlessMode;select.disabled=!gearVillage();select.onchange=()=>setEndlessMode(select.value);body.prepend(box);
 };
 const offer=vilOpen;vilOpen=function(id){offer(id);if(id==='endless'){const card=VIL.modal?.querySelector('.offer');if(card){const p=card.querySelector('p');if(p)p.textContent='Expedições por biomas, com encontros e boss ao final. Escolha Expedição ou Arena clássica no menu WAVES.';}}};
 const bar=updateBossHpBar;updateBossHpBar=function(){bar();if(EXPEDITION.active&&EXPEDITION.boss&&!EXPEDITION.boss.alert)document.getElementById('boss-bar').style.display='none';};
})();
