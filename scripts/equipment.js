// Embedded after the skill rules, before bootGame(). Source of runtime equipment integration.
let gearSelected=null,gearShopType='staff',gearSerial=0,gearNoticeAt=0;
const gearVillage=()=>gameState==='hub'&&!CAMP.on;
const gearBonus=key=>EquipmentModel.bonuses(player)[key]||0;
function gearEnsure(){player.equipment||={};player.gearBag||=[];player.waveProgress||=EquipmentModel.progress();}
function gearName(item){return EquipmentModel.slots[item.type].name+' '+EquipmentModel.rarities[item.rarity].name;}
function gearCurrentWave(){return EquipmentModel.waveNumber(currentMission?.endless?wave:CAMP.on?CAMP.stage:currentMission?.difficulty||1);}
function gearRefresh(){
 const hp=player.hp/player.maxHp,mp=player.mp/player.maxMp,allies=minions.map(m=>({m,hp:m.hp/maxHpSafe(m)}));
 skillSync();player.hp=hp<=0?0:Math.max(1,Math.floor(player.maxHp*hp+1e-8));player.mp=Math.max(0,Math.floor(player.maxMp*mp+1e-8));
 for(const {m,hp:ratio}of allies)m.hp=m.dead?0:Math.max(1,Math.floor(m.maxHp*ratio+1e-8));
 updateHUD();updateMinionPanel();buildSkillTree();saveGame();
}
function maxHpSafe(m){return Math.max(1,m.maxHp||1);}
function gearEquip(id,slot){
 gearEnsure();const index=player.gearBag.findIndex(i=>i.id===id),item=player.gearBag[index];if(!item||!EquipmentModel.slots[slot])return false;
 if(item.type!==slot&&!(item.type.startsWith('ring')&&slot.startsWith('ring')))return false;
 const old=player.equipment[slot];player.gearBag.splice(index,1);if(old)player.gearBag.push(old);player.equipment[slot]=item;gearSelected={slot};gearRefresh();return true;
}
function gearUnequip(slot){gearEnsure();if(!player.equipment[slot]||player.gearBag.length>=EquipmentModel.CAPACITY)return false;const item=player.equipment[slot];player.gearBag.push(item);delete player.equipment[slot];gearSelected={id:item.id};gearRefresh();return true;}
function gearSell(id){if(!gearVillage())return false;const index=player.gearBag.findIndex(i=>i.id===id);if(index<0)return false;player.gold+=EquipmentModel.sellPrice(player.gearBag[index]);player.gearBag.splice(index,1);gearSelected=null;updateHUD();saveGame();return true;}
function gearBuy(type){
 gearEnsure();if(!gearVillage()||!EquipmentModel.slots[type]||player.gearBag.length>=EquipmentModel.CAPACITY)return false;
 const level=player.waveProgress.unlocked,cost=EquipmentModel.price(level);if(player.gold<cost)return false;
 const item=EquipmentModel.generate(level,BuildModel,Math.random,type,false,'eq-'+Date.now().toString(36)+'-'+(++gearSerial));
 player.gold-=cost;player.gearBag.push(item);gearSelected={id:item.id};updateHUD();saveGame();playSound('pickupMp');return true;
}
function gearPickup(drop){gearEnsure();if(player.gearBag.length>=EquipmentModel.CAPACITY)return false;player.gearBag.push(drop.item);floatMsg('+'+gearName(drop.item),innerWidth/2,innerHeight*.42,EquipmentModel.rarities[drop.item.rarity].color);playSound('pickupMp');return true;}
function gearCollectAvailable(){let collected=false;for(let i=droppedItems.length-1;i>=0;i--)if(droppedItems[i].type==='equipment'&&gearPickup(droppedItems[i])){droppedItems.splice(i,1);collected=true;}if(collected)saveGame();}
function gearLeave(next){
 if(player.hp<=0||P.deadT>0)return next();
 gearCollectAvailable();const remaining=droppedItems.filter(d=>d.type==='equipment').length;
 if(!remaining)return next();
 if(CAMP.on&&!CAMP.inStage)CAMP.noWaves=true;
 setPause(true);tConfirm(remaining+' equipamento(s) ficarão no chão porque a mochila está cheia. Sair mesmo assim?','SAIR',()=>{setPause(false);next();},()=>tPause('equipment'));
}
function gearSelectWave(n){gearEnsure();if(!gearVillage())return false;n=Math.floor(Number(n));if(!Number.isFinite(n)||n<1||n>player.waveProgress.unlocked)return false;player.waveProgress.selected=n;saveGame();return true;}
function gearOpen(tab='equipment'){if(TITLE.active||COMIC.active||CAMP.map||P.deadT>0)return;setPause(true);tPause(tab);}
function gearRender(body){
 gearEnsure();body.innerHTML='<div class="gear-header"><div><small>RELICÁRIO DE ZEPHYR</small><h2>Equipamentos</h2></div><span>'+player.gearBag.length+'/'+EquipmentModel.CAPACITY+' peças · '+player.gold+' ouro</span></div><p class="section-note">Selecione uma peça para comparar. Os equipamentos modificam atributos e habilidades; a aparência de Zephyr permanece a mesma.</p><div class="gear-layout"><section class="gear-slots" aria-label="Equipados"></section><section class="gear-bag" aria-label="Mochila"></section><section class="gear-detail" aria-live="polite"></section></div><div class="gear-totals"></div><section class="gear-merchant"></section>';
 const button=(host,text,action,disabled=false)=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=text;b.disabled=disabled;b.onclick=()=>{action();tPause('equipment');};host.append(b);return b;};
 const slots=body.querySelector('.gear-slots'),bag=body.querySelector('.gear-bag'),detail=body.querySelector('.gear-detail');
 slots.innerHTML='<h3>Equipados</h3>';bag.innerHTML='<h3>Mochila</h3>';
 for(const [slot,def]of Object.entries(EquipmentModel.slots)){
  const item=player.equipment[slot],b=button(slots,def.icon+' '+def.name+' · '+(item?EquipmentModel.rarities[item.rarity].name+' Nv.'+item.level:'vazio'),()=>{gearSelected={slot};});
  if(item)b.style.borderColor=b.style.color=EquipmentModel.rarities[item.rarity].color;if(gearSelected?.slot===slot)b.setAttribute('aria-pressed','true');
 }
 if(!player.gearBag.length)bag.insertAdjacentHTML('beforeend','<p class="section-note">Encontre equipamentos nos monstros ou compre relíquias na vila.</p>');
 for(const item of player.gearBag){const b=button(bag,EquipmentModel.slots[item.type].icon+' '+gearName(item)+' · Nv.'+item.level,()=>{gearSelected={id:item.id};});b.style.borderColor=b.style.color=EquipmentModel.rarities[item.rarity].color;if(gearSelected?.id===item.id)b.setAttribute('aria-pressed','true');}
 const chosen=gearSelected?.slot?player.equipment[gearSelected.slot]:player.gearBag.find(i=>i.id===gearSelected?.id);
 function card(item,title){
  const rarity=EquipmentModel.rarities[item.rarity];
  const dormant=a=>a.stat==='skill'&&!skillRank(a.target)||a.stat==='school'&&!BuildModel.nodes.some(n=>n.school===a.target&&n.max>1&&skillRank(n.id));
  return '<article class="gear-card" style="border-color:'+rarity.color+'"><small>'+title+'</small><h3 style="color:'+rarity.color+'">'+gearName(item)+'</h3><p>Nível '+item.level+' · '+rarity.name+'</p><p class="gear-base">Base: '+EquipmentModel.describe(item.base,BuildModel)+'</p>'+item.affixes.map(a=>'<p>'+EquipmentModel.describe(a,BuildModel)+(dormant(a)?' <em>(inativo)</em>':'')+'</p>').join('')+'</article>';
 }
 if(chosen){
  detail.innerHTML=card(chosen,gearSelected.slot?'EQUIPADO':'SELECIONADO');
  if(gearSelected.slot)button(detail,'Desequipar',()=>gearUnequip(gearSelected.slot),player.gearBag.length>=EquipmentModel.CAPACITY);
  else {
   const targets=chosen.type.startsWith('ring')?['ring1','ring2']:[chosen.type];
   for(const slot of targets){
    const current=player.equipment[slot];if(current)detail.insertAdjacentHTML('beforeend',card(current,'ATUAL · '+EquipmentModel.slots[slot].name));
    const next={...player.equipment,[slot]:chosen},before=EquipmentModel.effects(BuildModel,player.skillRanks||{},player.equipment),after=EquipmentModel.effects(BuildModel,player.skillRanks||{},next);
    const oldBonus=EquipmentModel.bonuses(player),newBonus=EquipmentModel.bonuses({equipment:next}),changes=[];
    for(const key of Object.keys(EquipmentModel.attributes)){const delta=(newBonus[key]||0)-(oldBonus[key]||0);if(Math.abs(delta)>.001)changes.push((delta>0?'+':'')+delta.toFixed(2)+(EquipmentModel.attributes[key].percent?'%':'')+' '+EquipmentModel.attributes[key].name);}
    for(const n of BuildModel.nodes){const delta=(after.extra[n.id]||0)-(before.extra[n.id]||0);if(delta)changes.push((delta>0?'+':'')+delta+' pontos em '+n.name);}
    detail.insertAdjacentHTML('beforeend','<p class="gear-compare">Troca em '+EquipmentModel.slots[slot].name+': '+(changes.join(' · ')||'mesmos bônus ativos')+'</p>');
    button(detail,'Equipar · '+EquipmentModel.slots[slot].name,()=>gearEquip(chosen.id,slot));
   }
   if(gearVillage())button(detail,'Vender por '+EquipmentModel.sellPrice(chosen)+' ouro',()=>gearSell(chosen.id));
   else button(detail,'Descartar peça',()=>{player.gearBag=player.gearBag.filter(i=>i.id!==chosen.id);gearSelected=null;saveGame();});
  }
 }else detail.innerHTML='<h3>Detalhes da peça</h3><p>Selecione um equipamento. Bônus de pontos só fortalecem nós aprendidos e não liberam pré-requisitos.</p>';
 const totals=EquipmentModel.bonuses(player),extra=EquipmentModel.effects(BuildModel,player.skillRanks||{},player.equipment).extra;
 body.querySelector('.gear-totals').innerHTML='<h3>Bônus equipados</h3><p>'+Object.entries(totals).filter(([,v])=>v).map(([stat,value])=>EquipmentModel.describe({stat,value},BuildModel)).join(' · ')+'</p><p>'+Object.entries(extra).filter(([,n])=>n).map(([id,n])=>BuildModel.byId[id].name+': '+skillRank(id)+' investidos + '+n+' de equipamento = '+(skillRank(id)+n)).join(' · ')+'</p>';
 const merchant=body.querySelector('.gear-merchant');
 if(gearVillage()){
  const level=player.waveProgress.unlocked,cost=EquipmentModel.price(level);
  merchant.innerHTML='<h3>Mercador de relíquias misteriosas</h3><p>Peça nível '+level+' · '+cost+' ouro. Revelada após a compra.</p><p>Comum 60% · Mágico 28% · Raro 10% · Épico 2%</p>';
  const choose=document.createElement('div');choose.className='gear-shop-types';merchant.append(choose);
  for(const [type,def]of Object.entries(EquipmentModel.slots)){const b=button(choose,def.name,()=>{gearShopType=type;});b.setAttribute('aria-pressed',String(gearShopType===type));}
  button(merchant,'Comprar '+EquipmentModel.slots[gearShopType].name+' · '+cost+' ouro',()=>gearBuy(gearShopType),player.gold<cost||player.gearBag.length>=EquipmentModel.CAPACITY);
 }else merchant.innerHTML='<p class="section-note">Compre relíquias e venda equipamentos na vila. Atalho I abre esta mochila.</p>';
}
function gearRenderWaves(body){
 gearEnsure();const p=player.waveProgress;
 body.innerHTML='<div class="gear-header"><h2>Pedra do Infinito</h2><span>Recorde concluído: '+p.best+'</span></div><p>Escolha uma wave desbloqueada. Repetir waves anteriores mantém seu recorde e reduz a dificuldade e o nível do loot.</p><div class="gear-wave-picker"></div><div class="gear-wave-info"></div>';
 const picker=body.querySelector('.gear-wave-picker');
 for(let n=1;n<=p.unlocked;n++){const b=document.createElement('button');b.className='btn';b.textContent=String(n);b.disabled=!gearVillage();b.setAttribute('aria-label','Selecionar wave '+n);b.setAttribute('aria-pressed',String(p.selected===n));b.onclick=()=>{gearSelectWave(n);tPause('waves');};picker.append(b);}
 const s=EquipmentModel.waveStats(p.selected),info=body.querySelector('.gear-wave-info');
 info.innerHTML='<h3>Wave '+p.selected+'</h3><p>Vida dos monstros ×'+s.hp.toFixed(2)+' · dano ×'+s.damage.toFixed(2)+' · loot nível '+s.itemLevel+'</p><p>Conclusão: +'+(20+p.selected*8)+' XP e +'+(3+p.selected*2)+' ouro, além dos monstros. Loja: peças nível '+p.unlocked+'.</p>';
 const b=document.createElement('button');b.className='btn';b.textContent='Entrar na wave '+p.selected;b.disabled=!gearVillage();b.onclick=()=>{setPause(false);startEndless();};info.append(b);
}
function installEquipment(){
 gearEnsure();
 for(const [name,values]of Object.entries(COMBAT_TUNING.specials))Object.assign(MOB_ABILITIES[name],values);
 const pause=tPause;tPause=function(tab){pause(tab);const tabs=document.querySelector('.pmtabs'),body=document.querySelector('.pmbody');if(!tabs||!body)return;
  for(const [id,name]of [['equipment','EQUIPAMENTOS'],['waves','WAVES']]){if(id==='waves'&&!gearVillage())continue;const b=document.createElement('button');b.className='pmtab'+(PM.tab===id?' on':'');b.textContent=name;b.onclick=()=>tPause(id);tabs.append(b);}
  if(PM.tab==='equipment')gearRender(body);if(PM.tab==='waves')gearRenderWaves(body);
  if(currentMission?.endless){const b=document.createElement('button');b.className='btn';b.textContent='Voltar à vila';b.onclick=()=>{setPause(false);enterHub();};document.querySelector('.pmside')?.append(b);}
 };
 const controls=pmControlsHtml;pmControlsHtml=function(){return controls()+'<p class="section-note">I · Equipamentos. Na vila, abra WAVES para escolher a dificuldade e EQUIPAMENTOS para comprar ou vender.</p>';};
 const shop=buildShopGrid;buildShopGrid=function(){shop();const host=document.getElementById('shop-grid');if(!host||!gearVillage()||host.querySelector?.('.gear-world-shop'))return;const b=document.createElement('button');b.className='btn gear-world-shop';b.textContent='Relíquias · Comprar equipamentos';b.onclick=()=>{closeHubOverlay();gearOpen('equipment');};host.prepend(b);};
 const tree=buildSkillTree;buildSkillTree=function(){tree();const detail=document.querySelector('.lg-detail');if(!detail)return;const rank=skillRank(skillTreeSelected),n=EquipmentModel.effects(BuildModel,player.skillRanks||{},player.equipment).extra[skillTreeSelected]||0;const p=document.createElement('p');p.className='gear-skill-bonus';p.textContent=rank+' investidos + '+n+' de equipamento = '+(rank+n)+' efetivos. Equipamentos não liberam pré-requisitos.';detail.prepend(p);};
 const newChar=campNewChar;campNewChar=function(){player.equipment={};player.gearBag=[];player.waveProgress=EquipmentModel.progress();ENDLESS.best=0;gearSelected=null;return newChar();};
 const load=loadGame;loadGame=function(){const result=load();if(result)ENDLESS.best=player.waveProgress.best;return result;};
 const spawn=spawnEnemy;spawnEnemy=function(type,x,z){const e=spawn(type,x,z);e.gearWave=gearCurrentWave();if(!e.isBoss){e.spd=(e.spd??type.spd??0)*COMBAT_TUNING.enemySpeed;e.atkRate=['Arqueiro','Mago Vivo'].includes(type.name)?COMBAT_TUNING.rangedInterval:COMBAT_TUNING.meleeInterval;e.abilityCd=COMBAT_TUNING.specialDelayMin+Math.random()*(COMBAT_TUNING.specialDelayMax-COMBAT_TUNING.specialDelayMin);}if(currentMission?.endless&&!CAMP.on){const s=EquipmentModel.waveStats(wave);e.hp=e.maxHp=Math.round(type.hp*s.hp);e.dmg=Math.round(type.dmg*s.damage);e.xp=Math.round(type.xp*s.xp);}return e;};
 spawnDrop=function(x,z){const hp=Math.random()<COMBAT_TUNING.hpOrbShare;droppedItems.push({mesh:mkMesh2(x+(Math.random()-.5)*.6,z+(Math.random()-.5)*.6),type:hp?'hp':'mp',life:22,t:0});};
 const death=killEnemy;killEnemy=function(e,x,z){if(e.dead)return;e.dropChance=COMBAT_TUNING.orbChance;const reward=!e.dummy&&(e.isBoss||Math.random()<COMBAT_TUNING.gearChance),level=e.gearWave||gearCurrentWave();if(reward){const item=EquipmentModel.generate(level,BuildModel,Math.random,undefined,!!e.isBoss,'eq-'+Date.now().toString(36)+'-'+(++gearSerial));droppedItems.push({type:'equipment',item,mesh:mkMesh2(x,z),life:Infinity,t:0});}return death(e,x,z);};
 const pickup=checkPickups;checkPickups=function(dt){
  const equipment=droppedItems.filter(d=>d.type==='equipment');droppedItems=droppedItems.filter(d=>d.type!=='equipment');pickup(dt);let changed=false;
  for(const d of equipment){d.t+=dt;if(Math.hypot(d.mesh.position.x-P.x,d.mesh.position.z-P.y)<1.8){if(gearPickup(d)){changed=true;continue;}if(Date.now()>gearNoticeAt){floatMsg('Mochila cheia · I para equipamentos',innerWidth/2,innerHeight*.4,'#e8c777');gearNoticeAt=Date.now()+3000;}}droppedItems.push(d);}if(changed)saveGame();
 };
 const hub=enterHub;enterHub=function(){return gearLeave(()=>hub());};
 const map=campMapOpen;campMapOpen=function(){return gearLeave(()=>map());};
 const start=startEndless;startEndless=function(){gearEnsure();const selected=player.waveProgress.selected;start();wave=selected-1;missionWave=selected-1;};
 const end=endWave;endWave=function(){const endless=!!currentMission?.endless,finished=missionWave;if(endless&&!waveActive)return;if(endless){player.waveProgress=EquipmentModel.complete(player.waveProgress,finished);ENDLESS.best=player.waveProgress.best;}const result=end();if(endless)saveGame();return result;};
 const offer=vilOpen;vilOpen=function(id){offer(id);if(id==='endless'){const card=VIL.modal?.querySelector('.offer');if(!card)return;const p=player.waveProgress,b=document.createElement('button');b.className='btn';b.textContent='Escolher wave · atual '+p.selected+' / liberada '+p.unlocked;b.onclick=()=>{vilClose();gearOpen('waves');};card.append(b);}};
 for(const [name,key,base]of [['castRaio','raio',.5],['castHands','maos',12],['castChuva','chuva',5],['castExplosao','explosao',8],['skillCastCurse','maldicao',8]]){
  // Global function declarations in this script share the browser global object.
  const original=globalThis[name];globalThis[name]=function(...args){const mp=player.mp,result=original(...args);if(player.mp<mp)player.spellCooldowns[key]=Math.max(base*.5,(player.spellCooldowns[key]||0)*(1-gearBonus('cooldown')/100));return result;};
 }
 const barrier=castBarrier;castBarrier=function(...args){const mp=player.mp,result=barrier(...args);if(player.mp<mp)player.barrierCd=Math.max(6,player.barrierCd*(1-gearBonus('cooldown')/100));return result;};
 const dash=castDash;castDash=function(...args){const result=dash(...args);if(result)playerDash.cd=Math.max(1.5,playerDash.cd*(1-gearBonus('cooldown')/100));return result;};
 const command=activateSummonSkill;activateSummonSkill=function(type,...args){const result=command(type,...args);if(result)player.minionSkillCooldowns[type]=Math.max(ACTION_SKILLS[type].cooldown*.5,player.minionSkillCooldowns[type]*(1-gearBonus('cooldown')/100));return result;};
 window.addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='i'||e.repeat||TITLE.active||COMIC.active||CAMP.map||document.getElementById('hub-overlay')?.style.display==='flex'||VIL.open)return;if(['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;e.preventDefault();e.stopImmediatePropagation();if(TITLE.paused&&PM.tab==='equipment')setPause(false);else gearOpen();},true);
}
installEquipment();
