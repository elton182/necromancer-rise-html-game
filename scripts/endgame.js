// Conquest uses expedition maps, but owns its progress, rewards and completion.
const ENDGAME={run:null,difficulty:1,hazards:[],corpses:[],result:''};
function endgameEnsure(){if(!player.conquest)player.conquest=EndgameModel.normalize({seed:Math.floor(Math.random()*4294967294)+1});return player.conquest;}
function endgameModifiers(){return EndgameModel.modifiers(ENDGAME.run?.curses||[]);}
function endgameStop(){
 if(!ENDGAME.run)return;
 ENDGAME.run=null;ENDGAME.hazards=[];ENDGAME.corpses=[];
 const dead=player.hp<=0;skillSync();if(dead)player.hp=0;
}
function endgameLootConfig(e,roll){
 if(!ENDGAME.run||!e.expedition)return null;
 const r=ENDGAME.run.reward,special=!!e.expeditionBoss&&Math.random()<r.specialChance;
 return {level:r.itemLevel,type:special?'staff':roll.type,special,
  weights:e.expeditionBoss?{common:0,magic:0,rare:(1-r.epicChance)*100,epic:r.epicChance*100}:undefined};
}
function endgameBoneHit(e,b){
 if(e.dead||e.endgameObject||!Object.values(player.equipment||{}).some(i=>i.special==='carcomido'))return;
 const rot=e.endgameRot||{stacks:0,tick:1,power:0};
 rot.stacks=Math.min(5,rot.stacks+1);rot.ttl=5;rot.power=Math.max(rot.power,b.dmg*.12);e.endgameRot=rot;
}
function endgameOpen(){if(!gearVillage())return;vilClose();closeHubOverlay();gearOpen('conquest');}
function endgameStart(kind,routeId){
 if(!gearVillage())return false;
 const state=endgameEnsure(),d=ENDGAME.difficulty;
 let next;try{next=EndgameModel.begin(state,kind,d,state.offers[d].selected,routeId);}catch(error){floatMsg(error.message,W/2,H*.4,'#e7b688');return false;}
 player.conquest=next.state;ENDGAME.run=next.run;ENDGAME.hazards=[];ENDGAME.corpses=[];ENDGAME.result='';
 saveGame();PM.tab='status';setPause(false);CAMP.on=false;CAMP.map=false;CAMP.inStage=false;gameState='field';VILLAGE_ROUTE.on=false;
 clearHubScene();document.getElementById('hub-overlay').style.display='none';
 currentMission={id:'val_routes',conquest:true,label:EndgameModel.encounters[kind].name,wavesGoal:1e9,rewardSouls:0,rewardExp:0};
 skillSync();expeditionStartMap(d);return true;
}
function endgameComplete(){
 const run=ENDGAME.run;if(!run||EXPEDITION.cleared)return;
 const result=EndgameModel.complete(player.conquest,run);if(!result.applied)return;
 player.conquest=result.state;EXPEDITION.cleared=true;waveActive=false;waveEndTimer=0;bossEnemy=null;
 ENDGAME.routeSelected=result.newRoutes[0]||run.routeId;
 player.gold+=result.reward.gold;gainExp(result.reward.xp);
 ENDGAME.hazards=[];
 for(const e of enemies)if(e.endgameObject&&!e.dead){e.dead=true;e.deadTimer=0;}
 ENDGAME.result=result.conqueredNow?'DIFICULDADE '+run.difficulty+' CONQUISTADA · '+(result.fragmentNow?'Fragmento obtido · ':'')+'Dificuldade '+player.conquest.unlocked+' liberada':
  EndgameModel.routeGraph(player.conquest.seed).find(n=>n.id===run.routeId).label+' concluído · '+(result.newRoutes.length?'+'+result.newRoutes.length+' rota(s) liberada(s)':'Área revisitada')+' · +'+result.reward.influence+'% influência';
 saveGame();showWaveBanner(result.conqueredNow?'PÂNTANO CONQUISTADO!':'VITÓRIA EM VALDORIA',ENDGAME.result,'#b4ce78');
 expeditionUpdateHud();updateBossHpBar();
}
function endgameHazard(x,y,r=2.5,delay=1.3,life=4,damage=8){
 ENDGAME.hazards.push({level:ENDGAME.run?.reward.itemLevel||1,x,y,r,delay,life,tick:0,damage});
}
function endgameObject(boss,index,corpse=false){
 const angle=index*Math.PI*2/3,q=clampMobLanding(boss.x-3+Math.cos(angle)*4,boss.y+Math.sin(angle)*4,boss);
 const e=spawnEnemy({...ENEMY_TYPES[0],_def:null,name:corpse?'Restos em decomposição':'Caldeirão de decomposição',spd:0,xp:0,souls:0},q.x,q.y);
 e.endgameObject=true;e.dummy=true;e.expedition=true;e.alert=true;e.home={x:e.x,y:e.y};e.lootTier='common';
 e.hp=e.maxHp=Math.round(boss.maxHp*(corpse?.035:.07));e.dmg=0;e.spd=0;
 e.endgameOwner=boss;e.endgameCorpse=corpse;enemiesLeft++;
 return e;
}
function endgameBossAbility(e,dt){
 if(e.dead||EXPEDITION.cleared)return false;
 e.endgameCd=Math.max(0,(e.endgameCd??2)-dt);
 if(e.endgameCast){
  const a=e.endgameCast;a.time+=dt;
  if(a.time>=a.duration){
   e.endgameCast=null;e.endgameCd=e.endgameKind==='fortress'?4:5;
   if(e.endgameKind==='apothecary'){
    const count=1+enemies.filter(o=>!o.dead&&o.endgameOwner===e).length;
    for(let i=0;i<count;i++)endgameHazard(a.x+Math.cos(i*2.4)*2,a.y+Math.sin(i*2.4)*2,2.2,0,4,Math.round(e.dmg*.35));
   }else if(e.endgameKind==='drowned'){
    mobAreaDamage(a.x,a.y,3,Math.round(e.dmg*1.4),e);
    endgameHazard(a.x,a.y,3,0,3,Math.round(e.dmg*.25));
    for(let i=0;i<2;i++){
     const m=spawnEnemy(ENEMY_TYPES[0],e.x-2+i*4,e.y+2);m.expedition=true;m.alert=true;m.home={x:m.x,y:m.y};m.lootTier='common';
     m.hp=m.maxHp=Math.round(e.maxHp*.035);m.dmg=Math.round(e.dmg*.45);m.xp=0;m.souls=0;m.dummy=true;enemiesLeft++;
    }
   }else{
    const remains=enemies.filter(o=>!o.dead&&o.endgameCorpse&&o.endgameOwner===e);
    e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.06*remains.length);
    for(const o of remains){o.dead=true;o.deadTimer=.5;enemiesLeft=Math.max(0,enemiesLeft-1);}
    ring(e.x,e.y,5,'#a1bf6b',.7);updateBossHpBar();
   }
  }
  return true;
 }
 if(e.endgameCd>0)return false;
 if(e.endgameKind==='fortress')for(let i=0;i<3;i++)endgameObject(e,i,true);
 e.endgameCast={time:0,duration:e.endgameKind==='fortress'?4:1.6,x:P.x,y:P.y};
 return true;
}
function endgameTick(dt){
 // Relic effects work in campaign, arena and conquest alike.
 for(const e of enemies.slice())if(!e.dead&&e.endgameRot){
  const r=e.endgameRot,elapsed=Math.min(dt,Math.max(0,r.ttl));r.ttl-=dt;r.tick-=elapsed;
  while(r.tick<=1e-8&&!e.dead){r.tick+=1;dealDamageToEnemy(e,Math.max(1,Math.round(r.power*r.stacks)));}
  if(r.ttl<=0)delete e.endgameRot;
 }
 if(!ENDGAME.run||EXPEDITION.cleared||gameState!=='field'||P.deadT>0)return;
 for(const h of ENDGAME.hazards){
  if(h.delay>0){h.delay-=dt;continue;}
  h.life-=dt;h.tick-=dt;
  if(h.tick<=0){h.tick+=1;mobAreaDamage(h.x,h.y,h.r,h.damage,h);}
 }
 ENDGAME.hazards=ENDGAME.hazards.filter(h=>h.life>0);
}
function endgameDraw(){
 if(!ENDGAME.run)return;
 ctx.save();
 for(const h of ENDGAME.hazards){
  ctx.fillStyle=h.delay>0?'#c6d48a':'#577a3d';ctx.strokeStyle=h.delay>0?'#f1d397':'#b6d17b';ctx.lineWidth=2;
  ctx.globalAlpha=h.delay>0?.18:.4;ctx.beginPath();ctx.ellipse(sx(h.x),sy(h.y),h.r*S,h.r*S*.6,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.9;ctx.stroke();
 }
 for(const e of enemies){
  if(e.dead)continue;
  if(e.endgameObject){
   const x=sx(e.x),y=sy(e.y);ctx.fillStyle=e.endgameCorpse?'#785d41':'#303c2b';ctx.strokeStyle='#a3b275';ctx.lineWidth=2;
   ctx.beginPath();ctx.ellipse(x,y-S*.2,S*.7,S*.45,0,0,Math.PI*2);ctx.fill();ctx.stroke();
   if(!e.endgameCorpse){ctx.fillStyle='#8ba454';ctx.beginPath();ctx.ellipse(x,y-S*.4,S*.6,S*.22,0,0,Math.PI*2);ctx.fill();for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+Math.sin(time*2+i)*S*.35,y-S*(.5+(time*.4+i*.3)%1),S*.08,0,Math.PI*2);ctx.fill();}}
   ctx.fillStyle='#e3dfb8';ctx.font='12px Georgia';ctx.textAlign='center';ctx.fillText((e.endgameCorpse?'Restos':'Caldeirão')+' '+Math.ceil(e.hp),sx(e.x),sy(e.y)-S*1.2);
  }
  const a=e.endgameCast;if(!a)continue;
  const consume=e.endgameKind==='fortress';
  ctx.strokeStyle='#f0d282';ctx.fillStyle='#e7d597';ctx.lineWidth=2;ctx.setLineDash([6,4]);
  ctx.beginPath();ctx.ellipse(sx(consume?e.x:a.x),sy(consume?e.y:a.y),(consume?5:3)*S,(consume?5:3)*S*.6,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.font='bold 14px Georgia';ctx.textAlign='center';ctx.fillText(consume?'Destrua os restos! · '+Math.ceil(a.duration-a.time)+'s':e.endgameKind==='drowned'?'Erupção do brejo':'Frascos de decomposição',sx(e.x),sy(e.y)-S*3.5);
 }
 ctx.restore();
}
function endgameRender(body){
 const s=endgameEnsure(),d=ENDGAME.difficulty=s.difficulty;
 const selected=s.offers[d].selected,r=EndgameModel.rewards(s,'expedition',d,selected);
 body.innerHTML='<section class="conquest-panel"><div class="conquest-heading"><small>CONQUISTA DE VALDORIA · TERRITÓRIO I</small><h2>Pântano da Febre Negra</h2><p>Domine a decomposição. Revele os tenentes, tome a fortaleza e obtenha o Fragmento da Pestilência.</p></div><div class="conquest-progress"><b>'+(s.conquered?'TERRITÓRIO CONQUISTADO':s.influence+'% de influência')+'</b><progress aria-label="Influência no pântano" max="100" value="'+s.influence+'"></progress><span>30% · Boticário &nbsp; 60% · Guardiã &nbsp; 100% + tenentes · Fortaleza</span></div><div class="conquest-settings"><label>Dificuldade regional <input type="number" min="1" step="1" inputmode="numeric" aria-label="Dificuldade regional"><button class="btn conquest-apply-difficulty" type="button">Aplicar</button></label><span>Recomendado: nível '+(8+(d-1)*6)+' ou build equivalente</span></div><h3>Escolha suas maldições <small>'+selected.length+'/3</small></h3><p>Quatro ofertas sorteadas. A oferta muda ao vencer um encontro; morte, saída e recarga preservam as opções.</p><div class="conquest-curses"></div><div class="conquest-rewards" aria-live="polite"></div><h3>Avanço no território</h3><div class="conquest-encounters"></div><div class="conquest-fragment"></div></section>';
 const root=body.querySelector('.conquest-panel'),select=root.querySelector('input[aria-label="Dificuldade regional"]');
 const next=EndgameModel.nextEncounter(s),nextBox=document.createElement('section');nextBox.className='conquest-next';nextBox.setAttribute('aria-label','Próximo objetivo da conquista');
 const nextTitle=document.createElement('h3');nextTitle.textContent=s.conquered?'Revisitar a fortaleza':'Próximo objetivo';
 const nextText=document.createElement('p');nextText.textContent=s.influence===100&&!s.conquered?(EndgameModel.blockedReason(s,'fortress',d)||'Influência completa e tenentes derrotados. A fortaleza está liberada!'):
  next==='expedition'?'Conclua expedições para aumentar sua influência.':next==='fortress'?'A fortaleza está disponível na dificuldade escolhida.':'Tenente revelado. Derrote '+EndgameModel.encounters[next].name+' para avançar rumo à fortaleza.';
 const nextButton=document.createElement('button');nextButton.className='btn';nextButton.textContent=(s.conquered?'Revisitar agora · ':'Avançar agora · ')+EndgameModel.encounters[next].name;nextButton.onclick=()=>endgameStart(next);
 nextBox.append(nextTitle,nextText,nextButton);root.querySelector('.conquest-progress').after(nextBox);
 select.value=d;
 const freedom=document.createElement('p');freedom.textContent='Sem limite de dificuldade. Trocar o nível reinicia influência, rotas e tenentes.';root.querySelector('.conquest-settings').after(freedom);
 const apply=()=>{const value=Number(select.value);if(!EndgameModel.validDifficulty(value)){select.setCustomValidity('Use um número inteiro a partir de 1.');select.reportValidity();return;}select.setCustomValidity('');player.conquest=EndgameModel.selectDifficulty(s,value);ENDGAME.difficulty=value;ENDGAME.routeSelected=null;saveGame();endgameRender(body);};
 root.querySelector('.conquest-apply-difficulty').onclick=apply;select.oninput=()=>select.setCustomValidity('');select.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();apply();}};
 for(const id of EndgameModel.offer(s.seed,s.offers[d].cycle,d)){
  const c=EndgameModel.curses.find(c=>c.id===id),label=document.createElement('label');label.className='conquest-curse'+(selected.includes(id)?' selected':'');
  label.innerHTML='<input type="checkbox" '+(selected.includes(id)?'checked':'')+'><span><b>'+c.name+'</b><em>'+c.text+'</em><small>Intensidade +'+c.weight+'</small></span>';
  const input=label.querySelector('input');input.setAttribute('aria-label',c.name);input.disabled=!selected.includes(id)&&selected.length>=3;
  input.onchange=()=>{s.offers[d].selected=input.checked?[...selected,id]:selected.filter(v=>v!==id);saveGame();endgameRender(body);body.querySelector('input[aria-label="'+c.name+'"]')?.focus();};root.querySelector('.conquest-curses').append(label);
 }
 root.querySelector('.conquest-rewards').innerHTML='<b>Intensidade '+r.score+' · Patamar '+r.tier+'</b><p>Expedição: +'+r.influence+'% influência · '+r.gold+' ouro · '+r.xp+' XP.</p><p>Todos os equipamentos: nível '+r.itemLevel+'. Chefe garante raro ou épico ('+Math.round(r.epicChance*100)+'% épico).</p><p>'+(r.specialChance?'Chefe: '+Math.round(r.specialChance*100)+'% de chance do cajado Osso Carcomido.':'Intensidade 4: libera 12% de chance de Osso Carcomido; intensidade 6: aumenta para 25%.')+'</p><small>Osso Carcomido: Tiro de Osso aplica Podridão por 5 s, até 5 cargas. Funciona em todos os modos.</small>';
 for(const [kind,e]of Object.entries(EndgameModel.encounters)){
  const open=EndgameModel.available(s,kind,d),reward=EndgameModel.rewards(s,kind,d,selected),done=kind==='fortress'?s.conquered:s.lieutenants[kind];
  const card=document.createElement('article');card.className='conquest-encounter';card.dataset.conquestKind=kind;
  if(ENDGAME.mapSelected===kind)card.classList.add('atlas-target');
  const reason=EndgameModel.blockedReason(s,kind,d);
  card.innerHTML='<h4>'+e.name+'</h4><p>'+(open?(done?(kind==='fortress'?'Território conquistado · fortaleza disponível para revisitar.':'Derrotado · disponível para repetir.'):'Disponível para enfrentar.'):reason)+'</p><small>+'+reward.influence+'% influência · '+reward.gold+' ouro · '+reward.xp+' XP</small>';
  const button=document.createElement('button');button.className='btn';button.textContent=(done?'Revisitar · ':'Entrar · ')+e.name;button.disabled=!open;if(!open)button.title=reason;button.onclick=()=>endgameStart(kind);card.append(button);root.querySelector('.conquest-encounters').append(card);
 }
 root.querySelector('.conquest-fragment').innerHTML=s.fragment?'<b>Fragmento da Pestilência obtido</b><p>Conquista permanente. Maior dificuldade vencida na fortaleza: '+s.highest+'. Todas as dificuldades podem ser escolhidas livremente.</p><p>Os outros territórios e o chefe dos fragmentos serão adicionados em uma próxima etapa.</p>':'<p>Conquiste a fortaleza em qualquer dificuldade para obter o Fragmento da Pestilência.</p>';
 endgameMapMount(root,s,d);
}
(function installEndgame(){
 endgameEnsure();
 BIOMES.swamp={...BIOMES.forest,id:'swamp',name:'Pântano da Febre Negra',bg:'#091009',mm:'rgba(15,25,8,.85)',fog:[130,155,92],ground:{A:[29,38,21],B:[40,53,27],C:[48,43,27],DARK:[8,14,7]},path:{col:'#494832'},motes:{cols:['#a2ad64','#738342'],n:65,add:false,size:3}};
 BIOMES.river={...BIOMES.forest,id:'river',name:'Travessia do Rio',bg:'#0b171a',mm:'rgba(14,33,40,.85)',fog:[123,171,178],ground:{A:[30,53,54],B:[45,65,61],C:[62,60,40],DARK:[7,18,21]},path:{col:'#657360'},motes:{cols:['#8cb9bd','#a5ccc2'],n:45,add:false,size:3}};
 BIOMES.mountain={...BIOMES.snow,id:'mountain',name:'Passagem da Montanha',bg:'#111318',mm:'rgba(24,27,32,.85)',fog:[157,164,177],ground:{A:[48,48,49],B:[65,64,59],C:[72,66,56],DARK:[14,15,20]},path:{col:'#746c5d'},motes:{cols:['#b2ada1','#7b818c'],n:30,add:false,size:2}};
 const migrate=skillMigrateSave;skillMigrateSave=function(data){data=migrate(data);data.conquest=EndgameModel.normalize(data.conquest);return data;};
 const newChar=campNewChar;campNewChar=function(){endgameStop();player.conquest=EndgameModel.normalize({seed:Math.floor(Math.random()*4294967294)+1});ENDGAME.difficulty=1;return newChar();};
 const load=loadGame;loadGame=function(){endgameStop();return load();};
 const sync=skillSync;skillSync=function(recalculate=true){
  sync(recalculate);if(!recalculate||!ENDGAME.run)return;
  const ratio=player.hp/player.maxHp,m=endgameModifiers();player.maxHp=Math.max(1,Math.round(player.maxHp*m.hp));player.hp=Math.max(0,Math.min(player.maxHp,Math.round(player.maxHp*ratio)));player.mpRegen*=m.mpRegen;player.hpRegen*=m.hpRegen;
 };
 const stats=skillMinionStats;skillMinionStats=function(type){const s=stats(type),hp=Math.max(1,Math.round(s.hp*endgameModifiers().hordeHp));return {...s,hp,regen:s.regen*(hp/s.hp)};};swStats=skillMinionStats;
 const speed=EquipmentModel.moveSpeed;EquipmentModel.moveSpeed=function(...args){return speed(...args)*endgameModifiers().move;};
 const damage=dealDamageToEnemy;dealDamageToEnemy=function(e,amount){return damage(e,amount*endgameModifiers().damage);};
 const plan=ExpeditionModel.plan;ExpeditionModel.plan=function(n){
  if(!ENDGAME.run)return plan(n);
  const run=ENDGAME.run,s=endgameEnsure(),map=plan(1+(s.seed+run.cycle*31+run.difficulty*7+Object.keys(EndgameModel.encounters).indexOf(run.kind)*13)%1000);
  map.biome=run.biome;map.groups=map.groups.slice(0,run.kind==='expedition'?8:run.kind==='fortress'?6:4);return map;
 };
 const start=expeditionStartMap;expeditionStartMap=function(n){
  start(n);if(!ENDGAME.run)return;
  const run=ENDGAME.run,scale=EndgameModel.combatScale(run.difficulty);
  enemies.forEach((e,i)=>{e.gearWave=run.reward.itemLevel;e.hp=e.maxHp=Math.round(e.maxHp*scale.hp);e.dmg=Math.round(e.dmg*scale.damage);e.xp=Math.round(e.xp*scale.xp);if(!e.isBoss&&i%5===0)e.endgameInfected=true;});
  const b=EXPEDITION.boss;b.type={...b.type,id:'valdoria-'+run.kind,name:run.kind==='expedition'?'Portador da Decomposição':EndgameModel.encounters[run.kind].name};
  ESPR[b.type.name]='soulWarden';b.hp=b.maxHp=Math.round(b.maxHp*EndgameModel.encounters[run.kind].hp);b.endgameKind=run.kind==='expedition'?'apothecary':run.kind;b.endgameCd=2;
  if(run.kind==='apothecary')for(let i=0;i<3;i++)endgameObject(b,i);
  if(run.kind==='expedition')for(const g of EXPEDITION.map.groups.slice(1,5))endgameHazard(g.x+3,g.y,2.5,1.5,1e9,Math.round(6*scale.damage));
  showWaveBanner(EndgameModel.encounters[run.kind].name,EndgameModel.routeBiomes[run.biome].name+' · dificuldade '+run.difficulty+' · intensidade '+run.reward.score,'#b6cd7f');expeditionUpdateHud();
 };
 const down=expeditionBossDown;expeditionBossDown=function(){return ENDGAME.run?endgameComplete():down();};
 const end=endWave;endWave=function(){if(ENDGAME.run)return;return end();};
 const stop=expeditionStop;expeditionStop=function(){endgameStop();return stop();};
 const portal=tryPortal;tryPortal=function(){
  if(!ENDGAME.run)return portal();
  const m=EXPEDITION.map;if(Math.hypot(P.x-m.entry.x,P.y-m.entry.y)<3||EXPEDITION.cleared&&Math.hypot(P.x-m.exit.x,P.y-m.exit.y)<4){const cleared=EXPEDITION.cleared,result=enterHub();if(cleared&&gameState==='hub')gearOpen('conquest');return result;}
  floatMsg(EXPEDITION.cleared?'Use G perto de um portal para voltar à vila.':'Derrote o líder no final da trilha →',W/2,H*.4,'#b6cd7f');
 };
 const over=gameOver;gameOver=function(){endgameStop();return over();};
 const ability=updateMobAbility;updateMobAbility=function(e,dt){if(e.endgameObject)return true;if(e.endgameKind)return endgameBossAbility(e,dt);return ability(e,dt);};
 const kill=killEnemy;killEnemy=function(e,...args){
  if(e.dead)return;
  if(e.endgameObject){e.dead=true;e.deadTimer=.3;enemiesLeft=Math.max(0,enemiesLeft-1);burst(e.x,e.y,'#9cad63',12,2);return;}
  if(ENDGAME.run&&!EXPEDITION.cleared&&e.endgameInfected)endgameHazard(e.x,e.y,2.3,1.5,3,Math.max(1,Math.round(e.dmg*.4)));
  return kill(e,...args);
 };
 const tick=update;update=function(dt){tick(dt);if(!TITLE.paused&&P.deadT===0&&['field','hub'].includes(gameState))endgameTick(dt);};
 const markers=expeditionDrawMarkers;expeditionDrawMarkers=function(){markers();endgameDraw();};
 const ground=expeditionDrawGround;expeditionDrawGround=function(){
  ground();if(!ENDGAME.run||ENDGAME.run.biome!=='river')return;
  const map=EXPEDITION.map;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const [width,color]of [[7,'#697b65'],[5.8,'#315b68'],[3.5,'#487d87']]){
   ctx.strokeStyle=color;ctx.lineWidth=width*S;ctx.beginPath();
   for(let x=6;x<map.width-6;x+=2){const y=ExpeditionModel.routeY(map.route,x)+13+Math.sin(x*.14)*3;x===6?ctx.moveTo(sx(x),sy(y)):ctx.lineTo(sx(x),sy(y));}ctx.stroke();
  }
  ctx.restore();
 };
 const hud=expeditionUpdateHud;expeditionUpdateHud=function(){
  if(!ENDGAME.run)return hud();const r=ENDGAME.run;
  document.getElementById('wave-txt').textContent=EXPEDITION.cleared?ENDGAME.result+' · G no portal para voltar':EndgameModel.encounters[r.kind].name+' · D'+r.difficulty+' · Maldições '+r.reward.score+' · Influência '+player.conquest.influence+'% · Líder → '+Math.round(Math.hypot(EXPEDITION.map.exit.x-P.x,EXPEDITION.map.exit.y-P.y))+' u';
 };
 const hazards=minionHazards;minionHazards=function(){const list=hazards();for(const h of ENDGAME.hazards)list.push({x:h.x,y:h.y,r:h.r+.45});for(const e of enemies)if(!e.dead&&e.endgameCast&&e.endgameKind!=='fortress')list.push({x:e.endgameCast.x,y:e.endgameCast.y,r:3.45});return list;};
 const personDraw=person;person=function(o){if(o.ref?.endgameObject)return;return personDraw(o);};
 const spriteDrawOriginal=drawSprite;drawSprite=function(key,ref,o){if(ref.endgameObject)return;return spriteDrawOriginal(key,ref,o);};
 const warnings=drawMobAbilityWarnings;drawMobAbilityWarnings=function(){warnings();ctx.save();ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillStyle='#b9d983';for(const e of enemies)if(!e.dead&&e.endgameRot)ctx.fillText('Podridão ×'+e.endgameRot.stacks,sx(e.x),sy(e.y)-S*2.5);ctx.restore();};
 const pause=tPause;tPause=function(tab){if((tab||PM.tab)==='conquest'&&gearVillage())return endgameScreen();if((tab||PM.tab)==='conquest'&&!gearVillage())tab='status';pause(tab);const tabs=document.querySelector('.pmtabs'),body=document.querySelector('.pmbody');if(!tabs||!body)return;
  if(ENDGAME.run){const note=document.createElement('aside');note.className='conquest-rewards';note.textContent='Maldições desta tentativa: '+(ENDGAME.run.curses.map(id=>{const c=EndgameModel.curses.find(c=>c.id===id);return c.name+' — '+c.text;}).join(' · ')||'nenhuma')+'.';body.prepend(note);}
  if(!gearVillage())return;
  const b=document.createElement('button');b.className='pmtab'+(PM.tab==='conquest'?' on':'');b.textContent='VALDORIA';b.onclick=()=>tPause('conquest');tabs.append(b);if(PM.tab==='conquest')endgameRender(body);
 };
 const offer=vilOpen;vilOpen=function(id){offer(id);if(id!=='endless')return;const card=VIL.modal?.querySelector('.offer');if(card){const b=document.createElement('button');b.className='btn';b.textContent='Conquistar Valdoria · Pântano';b.onclick=endgameOpen;card.append(b);}};
 const detail=gearRenderDetail;gearRenderDetail=function(host,item,...args){detail(host,item,...args);if(item?.special==='carcomido'){const p=document.createElement('p');p.className='conquest-special';p.textContent='Osso Carcomido · Tiro de Osso aplica Podridão: 12% do dano do projétil por carga por segundo, por 5 s. Até 5 cargas; novos acertos renovam a duração. Um efeito de peste ativo por vez.';host.append(p);}};
 const name=gearName;gearName=function(item){return (item.special==='carcomido'?'Osso Carcomido · ':'')+name(item);};
})();
