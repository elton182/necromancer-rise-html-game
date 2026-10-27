// Embedded into necromancer-canvas.html by sync-skill-trees.js, before bootGame().
// BuildModel is also embedded: the released game remains a standalone HTML file.
const SKILL_TREE_VERSION=1;
// Shared with the simulator through its source adapter. Keep pressure readable and dodgeable.
const COMBAT_TUNING={boltMultiplier:.5,zombieBurstMultiplier:3.5,zombieBurstRadius:3.5,minionHpMultiplier:1.5,minionHpPerLevel:6,minionRegen:.01,frontlineDamageTaken:.8,manualReviveHealth:.6,autoReviveHealth:.5,enemySpeed:1.15,meleeInterval:1.1,rangedInterval:1.3,specialDelayMin:.75,specialDelayMax:1.25,gearChance:.16,orbChance:.16,hpOrbShare:.25,specials:{Guerreiro:{windup:.5,cooldown:5},Arqueiro:{windup:.65,cooldown:5},'Mago Vivo':{windup:.75,cooldown:6.5},Bruto:{windup:.65,cooldown:6}}};
const TREE_ACTIONS={bolt:'raio',rain:'chuva',wall:'maos',shield:'barreira',nova:'explosao',dash:'dash',zombie:'zombie',skeleton:'skeleton',archer:'archer',specter:'specter',abom:'abom',curse:'maldicao'};
const TREE_PASSIVES={zombie_burst:'burst',archer_power:'shot',abom_slam:'colossus',aura:'aura'};
let skillTreeTab='minions',skillTreeSelected='zombie';
function skillRank(id){return player.skillRanks?.[id]||0;}
function skillEffects(){return typeof EquipmentModel==='undefined'?BuildModel.effects(player.skillRanks||{}):EquipmentModel.effects(BuildModel,player.skillRanks||{},player.equipment).effects;}
function skillGearStat(key){return typeof EquipmentModel==='undefined'?0:EquipmentModel.bonuses(player)[key]||0;}
function skillEffect(key){return skillEffects()[key]||0;}
function skillPercent(key){return 1+skillEffect(key)/100;}
function skillState(){return {version:1,level:player.level,ranks:player.skillRanks||{}};}
function skillBaseGrants(){return ['raio','dash'];}
const SKILL_REFUND_GOLD_PER_POINT=20;
function skillResetCost(ranks=player.skillRanks){return BuildModel.spent(ranks||{})*SKILL_REFUND_GOLD_PER_POINT;}
function skillRefundQuote(id){const s={...skillState(),ranks:{...player.skillRanks}},points=BuildModel.refund(s,id);return {points,cost:points*SKILL_REFUND_GOLD_PER_POINT,ranks:s.ranks};}
function skillPayRefund(cost){if((player.gold||0)<cost){floatMsg('Ouro insuficiente: precisa de '+cost+' ouro.',innerWidth/2,innerHeight*.4,'#d7a68e');return false;}player.gold-=cost;return true;}
function skillTutorialComplete(){player.skillTutorialState='done';document.getElementById('skill-level-tutorial')?.remove();}
function skillTutorialOpen(){
 if(player.skillTutorialState!=='pending'||TITLE.active||COMIC.active)return;
 if(document.getElementById('skill-level-tutorial'))return;
 setPause(true);
 const modal=document.createElement('div');modal.id='skill-level-tutorial';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','skill-tutorial-title');
 modal.innerHTML='<section><small>SEU PRIMEIRO NÍVEL</small><h2 id="skill-tutorial-title">Três pontos. Seu primeiro caminho.</h2><p>Você ganhou <b>3 pontos de habilidade</b>. Abra o Grimório, escolha um símbolo em <b>Minions</b> ou <b>Profana</b> e use <b>+ Investir ponto</b>.</p><p>Depois, clique em um slot do HUD para equipar as habilidades aprendidas.</p><button class="btn primary">Abrir Grimório</button><button class="btn later">Depois</button></section>';
 document.body.append(modal);
 modal.querySelector('.primary').onclick=()=>{player.skillTutorialState='allocating';modal.remove();tPause('skills');};
 modal.querySelector('.later').onclick=()=>{skillTutorialComplete();setPause(false);};
 modal.querySelector('.primary').focus();setTimeout(()=>{if(modal.isConnected)modal.querySelector('.primary').focus();},40);
 modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();skillTutorialComplete();setPause(false);}if(e.key==='Tab'){const buttons=[...modal.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}});
}
function skillEquipTutorialQueue(action){
 if(!action||!skillUnlocked(action)||player.actionLoadout.includes(action)||(player.skillEquipTutorialSeen||[]).includes(action))return false;
 player.skillEquipTutorialPending=action;setTimeout(skillEquipTutorialOpen,0);return true;
}
function skillEquipTutorialDone(action){
 player.skillEquipTutorialSeen=[...new Set([...(player.skillEquipTutorialSeen||[]),action])];
 player.skillEquipTutorialPending=null;
}
function skillEquipTutorialOpen(){
 const action=player.skillEquipTutorialPending;
 if(!action||!skillUnlocked(action)||TITLE.active||COMIC.active||document.getElementById('skill-equip-tutorial'))return;
 if(player.actionLoadout.includes(action)){skillEquipTutorialDone(action);return;}
 const wasPaused=TITLE.paused;setPause(true);
 const modal=document.createElement('div');modal.id='skill-equip-tutorial';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','skill-equip-title');
 modal.innerHTML='<section><small>HABILIDADE DESBLOQUEADA</small><h2 id="skill-equip-title">'+ACTION_SKILLS[action].icon+' '+ACTION_SKILLS[action].name+'</h2><p><b>Aprender é o primeiro passo. Agora escolha onde usar.</b></p><ol><li>Escolha um dos seis slots abaixo.</li><li>Use a tecla indicada para ativar a habilidade.</li></ol><p class="equip-instruction">Você também pode trocar habilidades clicando nos slots do HUD durante o jogo. Uma evocação traz seu grupo ao ser equipada.</p><div class="equip-tutorial-slots"></div><p class="equip-tutorial-error" role="alert"></p><button class="btn equip-later">Alocar depois</button></section>';
 const close=()=>{skillEquipTutorialDone(action);modal.remove();if(wasPaused)tPause('skills');else setPause(false);if(gameState==='hub'||CAMP.map)saveGame();};
 player.actionLoadout.forEach((current,index)=>{
  const b=document.createElement('button');b.className='btn equip-tutorial-slot'+(current==='empty'?' empty':'');b.innerHTML='<small>'+ACTION_KEYS[index]+'</small><b>Slot '+(index+1)+'</b><span>'+ACTION_SKILLS[current].name+'</span>';b.setAttribute('aria-label','Alocar '+ACTION_SKILLS[action].name+' no slot '+(index+1)+' · '+ACTION_KEYS[index]+(current==='empty'?' · vazio':' · substituir '+ACTION_SKILLS[current].name));
  b.onclick=()=>{if(equipActionSkill(index,action))close();else modal.querySelector('.equip-tutorial-error').textContent='Não foi possível equipar neste slot. Confira a mana ou aguarde a recuperação do grupo atual.';};
  modal.querySelector('.equip-tutorial-slots').append(b);
 });
 modal.querySelector('.equip-later').onclick=close;document.body.append(modal);
 const firstSlot=modal.querySelector('.empty')||modal.querySelector('button');firstSlot.focus();setTimeout(()=>{if(modal.isConnected)firstSlot.focus();},40);
 modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(e.key==='Tab'){const buttons=[...modal.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}});
}
function skillUnlocked(id){return (player.skillGrants||[]).includes(id)||Object.entries(TREE_ACTIONS).some(([node,action])=>action===id&&skillRank(node)>0);}
function skillMigrateSave(d){
 if(typeof EquipmentModel!=='undefined')EquipmentModel.migrate(d,BuildModel);
 const level=Math.max(1,Math.min(60,Math.floor(Number(d.level)||1))),legacy=d.skillTreeVersion!==SKILL_TREE_VERSION;
 let ranks={};
 if(!legacy){try{ranks=BuildModel.validate({version:1,level,ranks:d.skillRanks}).ranks;}catch(e){ranks={};}}
 const grants=skillBaseGrants();
 d.skillTutorialState=['pending','allocating','done'].includes(d.skillTutorialState)?d.skillTutorialState:level>=2?'done':'new';
 const oldHp=d.maxHp||100,oldMp=d.maxMp||80;
 Object.assign(d,{level,skillTreeVersion:SKILL_TREE_VERSION,skillRanks:ranks,skillGrants:grants,souls:0,skillPoints:BuildModel.budget(level)-BuildModel.spent(ranks),upgradeCount:{},minionUpgradeCount:{},spellUpgradeCount:{},minionHpBonus:0,minionDmgBonus:0,minionRegenBonus:0});
 const effects=typeof EquipmentModel==='undefined'?BuildModel.effects(ranks):EquipmentModel.effects(BuildModel,ranks,d.equipment).effects;
 const gear=typeof EquipmentModel==='undefined'?{}:EquipmentModel.bonuses(d);
 d.maxHp=Math.round((100+10*(level-1))*(1+(effects['Vida de Zephyr']||0)/100)+(gear.hp||0));
 d.maxMp=Math.round((80+5*(level-1))*(1+(effects['Mana máxima']||0)/100)+(gear.mp||0));
 d.hp=Math.max(1,Math.min(d.maxHp,Math.round((d.hp??oldHp)/oldHp*d.maxHp)));
 d.mp=Math.max(0,Math.min(d.maxMp,Math.round((d.mp??oldMp)/oldMp*d.maxMp)));
 d.spellDmg=Math.round((40+4*(level-1)+(gear.spellFlat||0))*(1+(gear.spell||0)/100));d.spellRadius=2.5;d.mpRegen=(4+.3*(level-1))*(1+(effects['Regeneração de mana']||0)/100)+(gear.regen||0);d.hpRegen=.2*(level-1);
 d.learnedSkills=[...new Set([...grants,...Object.entries(TREE_ACTIONS).filter(([node])=>ranks[node]).map(([,action])=>action),...Object.keys(ranks)])];
 d.skillEquipTutorialSeen=Array.isArray(d.skillEquipTutorialSeen)?[...new Set(d.skillEquipTutorialSeen.filter(id=>Object.values(TREE_ACTIONS).includes(id)))]:[];
 const allowed=id=>id==='empty'||d.learnedSkills.includes(id);
 d.actionLoadout=(Array.isArray(d.actionLoadout)&&d.actionLoadout.length===6?d.actionLoadout:['raio','empty','dash','empty','empty','empty']).map(id=>allowed(id)&&ACTION_SKILLS[id]?id:'empty');
 d.skillEquipTutorialPending=d.learnedSkills.includes(d.skillEquipTutorialPending)&&!d.actionLoadout.includes(d.skillEquipTutorialPending)&&!d.skillEquipTutorialSeen.includes(d.skillEquipTutorialPending)?d.skillEquipTutorialPending:null;
 if(!allowed(d.activeSpell))d.activeSpell='raio';
 // Preserve cooldowns and unavailable members of retained groups, discard removed types.
 const minionAllowed=type=>d.learnedSkills.includes(type);
 d.summonLoadout=(d.summonLoadout||[]).map(type=>minionAllowed(type)?type:null);
 d.summonGroups=(d.summonGroups||[]).filter(group=>minionAllowed(group.type));
 d.summonReserve=(d.summonReserve||[]).filter(group=>minionAllowed(group.type));
 d.minionTypes=(d.minionTypes||[]).filter(minionAllowed);
 return d;
}
function skillMinionStats(type){
 const def=MINION_DEFS[type],e=skillEffects(),flesh=type==='zombie'||type==='abom',bone=type==='skeleton'||type==='archer';
 let hp=flesh?(e['Vida de Zumbis e Abominações']||0):bone?(e['Vida de Esqueletos e Arqueiros']||0):(e['Vida dos Espectros']||0);
 let damage=flesh?(e['Dano de Zumbis e Abominações']||0):bone?(e['Dano de Esqueletos e Arqueiros']||0):(e['Dano dos Espectros']||0);
 if(type==='abom'){hp+=e['Vida da Abominação']||0;damage+=e['Dano da Abominação']||0;}
 if(type==='skeleton')hp+=e['Vida dos Guerreiros']||0;
 if(type==='archer')damage+=e['Dano dos Arqueiros']||0;
 if(type==='zombie'){hp+=e['Vida de Zumbis']||0;damage+=e['Dano de Zumbis']||0;}
 hp+=skillGearStat('hordeHp');damage+=skillGearStat('horde');
 const maxHp=Math.round((def.hp*COMBAT_TUNING.minionHpMultiplier+(player.level-1)*COMBAT_TUNING.minionHpPerLevel)*(1+hp/100));
 const baseDmg=def.dmg+player.level-1+skillGearStat('hordeFlat');
 return {hp:maxHp,dmg:Math.round(baseDmg*(1+damage/100)),baseDmg,damageBonus:damage,spd:def.spd,regen:maxHp*COMBAT_TUNING.minionRegen,rng:def.atkR};
}
function skillApplyMinion(m){
 const stats=skillMinionStats(m.type),ratio=m.maxHp?m.hp/m.maxHp:1;
 m.maxHp=stats.hp;m.hp=m.dead?0:Math.min(stats.hp,Math.max(1,Math.round(stats.hp*ratio)));m.dmg=stats.dmg;m.spd=stats.spd;m.hpRegen=stats.regen;m.atkR=stats.rng;m.lifeDrain=false;
 m.reviveReduce=m.type==='specter'?MINION_REVIVE_TIME*(-skillEffect('Tempo de renascimento dos Espectros'))/100:0;
}
function skillSync(recalculate=true){
 player.skillRanks=player.skillRanks||{};player.skillGrants=skillBaseGrants();player.skillTreeVersion=SKILL_TREE_VERSION;player.souls=0;
 player.skillPoints=Math.max(0,BuildModel.budget(player.level)-BuildModel.spent(player.skillRanks));
 player.learnedSkills=new Set([...player.skillGrants,...Object.entries(TREE_ACTIONS).filter(([node])=>skillRank(node)).map(([,action])=>action),...Object.keys(player.skillRanks)]);
 if(recalculate){
  const hpRatio=player.hp/player.maxHp,mpRatio=player.mp/player.maxMp;
  player.maxHp=Math.round((100+10*(player.level-1))*skillPercent('Vida de Zephyr')+skillGearStat('hp'));player.maxMp=Math.round((80+5*(player.level-1))*skillPercent('Mana máxima')+skillGearStat('mp'));
  player.hp=Math.min(player.maxHp,Math.max(1,Math.round(player.maxHp*hpRatio)));player.mp=Math.min(player.maxMp,Math.max(0,Math.round(player.maxMp*mpRatio)));
  player.spellDmg=Math.round((40+4*(player.level-1)+skillGearStat('spellFlat'))*(1+skillGearStat('spell')/100));player.mpRegen=(4+.3*(player.level-1))*skillPercent('Regeneração de mana')+skillGearStat('regen');player.hpRegen=.2*(player.level-1);
  minionHpBonus=0;minionDmgBonus=0;minionRegenBonus=0;
  player.upgradeCount={};player.minionUpgradeCount={};player.spellUpgradeCount={};minions.forEach(skillApplyMinion);
 }
 const pts=document.getElementById('sp-pts-txt');if(pts)pts.textContent=`✦ ${player.skillPoints} pts`;
 actionSignature='';actionAvailabilitySignature='';summonSlotsSignature='';_mpSig='';
}
function skillRefundReason(){
 const safe=gameState==='hub'||CAMP.map||(TITLE.paused&&gameState==='field'&&(typeof waveActive==='undefined'||!waveActive)&&!enemies.some(e=>!e.dead));
 if(!safe)return 'Devolva pontos na vila, no mapa ou pausado entre waves, sem inimigos.';
 if(minions.some(m=>m.exploded||m.sacrificed))return 'Há aliados detonados ou sacrificados em recuperação. Feche a pausa para o tempo avançar e tente novamente.';
 return '';
}
function skillCanRefund(){return !skillRefundReason();}
function skillRefresh(){skillSync();syncSummonProgress();reconcileActionSummons();updateHUD();updateMinionPanel();buildSkillTree();const footer=document.querySelector?.('.pm:has(.live-grimoire) .pmside>.section-note');if(footer)footer.textContent=(player.gold||0)+' ouro · '+player.skillPoints+' pontos';if(gameState==='hub'||CAMP.map)saveGame();}
function skillInvest(id){
 try{const action=TREE_ACTIONS[id],wasUnlocked=action&&skillUnlocked(action),s=skillState();BuildModel.invest(s,id);player.skillRanks=s.ranks;if(player.skillTutorialState==='allocating'&&BuildModel.spent(s.ranks)>=3)skillTutorialComplete();if(action&&!wasUnlocked)skillEquipTutorialQueue(action);skillRefresh();playSound('levelUp');}
 catch(e){floatMsg(e.message,innerWidth/2,innerHeight*.4,'#d7a68e');}
}
function skillRefund(id){
 if(!skillCanRefund()){floatMsg(skillRefundReason(),innerWidth/2,innerHeight*.4,'#d7a68e');return;}
 const quote=skillRefundQuote(id);if(!quote.points||!skillPayRefund(quote.cost))return;player.skillRanks=quote.ranks;skillRemoveUnavailable();skillRefresh();
}
function skillRemoveUnavailable(){
 skillSync();
 for(const i of unlockedSummonIndices())if(player.summonLoadout[i]&&!skillUnlocked(player.summonLoadout[i])){
  slotMembers(i).forEach(m=>scene.remove(m.mesh));minions=minions.filter(m=>m.summonSlot!==i);player.summonLoadout[i]=null;
 }
 player.summonReserve=player.summonReserve.filter(g=>skillUnlocked(g.type));
 player.actionLoadout=player.actionLoadout.map(id=>id==='empty'||skillUnlocked(id)?id:'empty');
 if(!skillUnlocked(player.activeSpell))player.activeSpell='raio';
}
function skillDamage(m,commandBonus=0){
 const stats=skillMinionStats(m.type),aura=Math.hypot(m.x-P.x,m.y-P.y)<=8?skillEffect('Dano da horda próxima'):0;
 return stats.baseDmg*(1+(stats.damageBonus+aura+commandBonus)/100);
}
function skillCastCurse(x,y){
 if(!skillUnlocked('maldicao')||!abilityReady('maldicao',25))return false;
 if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x-P.x,y-P.y)>9)return false;
 player.mp-=25;player.spellCooldowns.maldicao=8;
 const radius=4*Math.sqrt(skillPercent('Área da Maldição')),duration=6*skillPercent('Duração da Maldição');
 enemies.forEach(e=>{if(e.dead||Math.hypot(e.x-x,e.y-y)>radius)return;e._uncursedDmg=e._uncursedDmg??e.dmg;e.dmg=e._uncursedDmg*(1-skillEffect('Redução de dano da Maldição')/100);e.skillCurseT=duration;});
 ring(x,y,radius,'#b69ad2',1);castAnim(x,y,'#b69ad2');playSound('raio');updateHUD();return true;
}
function skillWallAbsorb(sh,x,y){
 const wall=handsAreas.find(w=>{const q=wallNearest(w,x,y);return Math.hypot(q.x-x,q.y-y)<w.width/2+.3;});
 if(wall){wall.hp=(wall.hp??160)-sh.dmg;if(wall.hp<=0){wall.life=0;handsAreas=handsAreas.filter(w=>w.life>0);}}
}

// Install the new progression and combat rules before the game loads a save.
(function installSkillTrees(){
 player.skillRanks={};player.skillGrants=skillBaseGrants();player.skillTreeVersion=1;player.skillTutorialState='new';player.skillEquipTutorialSeen=[];player.skillEquipTutorialPending=null;
 player.actionLoadout=['raio','empty','dash','empty','empty','empty'];player.summonLoadout=Array(7).fill(null);
 ACTION_SKILLS.explosao.name='Explosão Necrótica';
 ACTION_SKILLS.skeleton={name:'Esqueletos Guerreiros',icon:'⚔',summon:true,passive:'skeleton',ability:'Reunir',cooldown:4};
 ACTION_SKILLS.specter={name:'Espectros',icon:'👻',summon:true,passive:'step',ability:'Passo Espectral',cooldown:8};
 ACTION_SKILLS.maldicao={name:'Maldição da Fraqueza',icon:'☽',cost:25};
 Object.assign(player.minionSkillCooldowns,{skeleton:0,specter:0});
 // These compatibility names are consulted by the existing command dispatcher.
 hasPassive=function(id){return !!skillRank(TREE_PASSIVES[id]||id);};
 minionBonus=function(){return 0;};
 spellBonus=function(spell,id){
  // The old projectile adds this bridge to spellDmg; scale the complete hit, including bonuses.
  if(id==='raio_d')return player.spellDmg*COMBAT_TUNING.boltMultiplier*skillPercent('Dano do Tiro de Osso')-player.spellDmg;
  if(id==='raio_s')return skillEffect('Alvos perfurados adicionais')*.3;
  if(id==='raio_n')return skillRank('shards')?2:0;
  if(id==='chuva_d')return player.spellDmg*.7*skillEffect('Dano da Chuva de Ossos')/100;
  if(id==='exp_d')return player.spellDmg*2.5*(skillEffect('Dano da Explosão Necrótica')+skillEffect('Dano das explosões de Zumbi e Necrótica'))/100;
  return 0;
 };
 swStats=skillMinionStats;
 summonAvailable=function(){return true;};
 summonTypeAvailable=function(type){return !!MINION_DEFS[type]&&skillUnlocked(type);};
 summonGroupSize=function(type){const e=skillEffects();return type==='zombie'?3+(e['Zumbis adicionais']||0):type==='skeleton'?3+(e['Guerreiros adicionais']||0):type==='archer'?2+(e['Arqueiros adicionais']||0):type==='specter'?2+(e['Espectros adicionais']||0):1;};
 for(const cost of Object.values(SW_COST))cost[0]=0;
 const spawn=spawnMinion;spawnMinion=function(type,fromField){if(!skillUnlocked(type))return null;const m=spawn(type,fromField);if(m){skillApplyMinion(m);_mpSig='';updateMinionPanel();}return m;};
 const load=loadGame;loadGame=function(){const ok=load();if(ok){skillSync();skillRemoveUnavailable();minions.forEach(skillApplyMinion);if(player.skillEquipTutorialPending)setTimeout(skillEquipTutorialOpen,0);}return ok;};
 gainSouls=function(){};spawnSoulOrb=function(){};
 onLevelUp=function(){
  const oldHp=player.hp,oldMp=player.mp;skillSync();player.hp=Math.min(player.maxHp,oldHp+20);player.mp=Math.min(player.maxMp,oldMp+5);player.maxSp+=10;
  syncSummonProgress();renderSummonSlots();document.getElementById('level-txt').textContent=`NV. ${player.level}`;
  playSound('levelUp');showOverlay(`NÍVEL ${player.level}!`,'+3 pontos · Minions e Profana','#d4af37');updateHUD();
  if(player.level===2&&player.skillTutorialState==='new'){player.skillTutorialState='pending';setTimeout(skillTutorialOpen,0);}
 };
 gainExp=function(v){if(player.level>=60)return;player.exp+=v;while(player.level<60&&player.exp>=player.expNext){player.exp-=player.expNext;player.level++;player.expNext=Math.floor(100*Math.pow(1.4,player.level-1));onLevelUp();}if(player.level===60)player.exp=0;updateHUD();};
 campGrant=function(){CAMP.summon=true;campSyncSlots();return false;};
 const newChar=campNewChar;campNewChar=function(){newChar();CAMP.summon=true;player.skillRanks={};player.skillGrants=skillBaseGrants();player.skillTutorialState='new';player.skillEquipTutorialSeen=[];player.skillEquipTutorialPending=null;player.summonLoadout=Array(7).fill(null);skillSync();};
 const syncCampaign=campSyncSlots;campSyncSlots=function(){CAMP.summon=true;syncCampaign();};
 if(typeof TUT_DEFS!=='undefined'){
  TUT_DEFS[1]=TUT_DEFS[1].map(s=>s.ev==='pause'?{...s,t:'Abra o Grimório pelo contador de pontos do HUD ou por ESC → Habilidades.'}:s);
  TUT_DEFS[2]=TUT_DEFS[2].filter(s=>s.ev!=='summon');
  TUT_DEFS[3]=TUT_DEFS[3].filter(s=>s.ev!=='maos');TUT_DEFS[4]=TUT_DEFS[4].filter(s=>s.ev!=='barrier');
 }
 const castWall=castHands;castHands=function(x,y){const before=handsAreas.length;castWall(x,y);if(handsAreas.length>before){const wall=handsAreas[handsAreas.length-1];wall.life=5*skillPercent('Duração da Muralha');wall.hp=160*skillPercent('Resistência da Muralha');}};
 const rain=castChuva;castChuva=function(x,y){if(!abilityReady('chuva',40)||!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x-P.x,y-P.y)>9)return;const radius=player.spellRadius;player.spellRadius=radius*Math.sqrt(skillPercent('Área da Chuva de Ossos'));rain(x,y);player.spellRadius=radius;player.spellCooldowns.chuva=5;};
 const nova=castExplosao;castExplosao=function(x,y){if(!abilityReady('explosao',60)||!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x-P.x,y-P.y)>9)return;nova(x,y);player.spellCooldowns.explosao=8;};
 const barrier=castBarrier;castBarrier=function(){const mp=player.mp;barrier();if(player.mp<mp){player.barrier=Math.round(player.barrier*skillPercent('Absorção do Escudo de Carne'));player.barrierMax=player.barrier;}};
 const dash=castDash;castDash=function(){const ok=dash();if(ok){playerDash.cd=3*skillPercent('Recarga do Dash');if(skillRank('veil'))player.skillVeilT=.18+skillPercent('Duração da proteção após Dash');}return ok;};
 const damage=dealDamageToPlayer;dealDamageToPlayer=function(v,source){return damage(v*((player.skillVeilT||0)>0?.75:1),source);};
 const kill=killMinion;killMinion=function(m){if(m.dead)return;if(!m.sacrificed&&!m.exploded&&skillRank('pact'))player.hp=Math.min(player.maxHp,player.hp+player.maxHp*skillEffect('Vida máxima recuperada por morte de aliado')/100);kill(m);};
 const enemyDeath=killEnemy;killEnemy=function(e,x,y){if(e.dead)return;if(!e.dummy){const amount=Math.max(2,Math.round((e.xp||10)*.35))*(e.isBoss?3:1);droppedItems.push({mesh:mkMesh2(x,y),type:'gold',amount,life:45,t:0});}return enemyDeath(e,x,y);};
 const pickup=checkPickups;checkPickups=function(dt){
  for(let i=droppedItems.length-1;i>=0;i--){const item=droppedItems[i];if(item.type!=='gold')continue;if(Math.hypot(item.mesh.position.x-P.x,item.mesh.position.z-P.y)<1.8){player.gold+=item.amount;droppedItems.splice(i,1);playSound('pickupMp');floatMsg('+'+item.amount+' ouro',innerWidth/2,innerHeight*.47,'#e2c46d');updateHUD();}}
  // The original collector handles only potions. Gold keeps its own lifetime and pickup radius.
  const gold=droppedItems.filter(i=>i.type==='gold');droppedItems=droppedItems.filter(i=>i.type!=='gold');pickup(dt);gold.forEach(i=>{i.life-=dt;i.t+=dt;if(i.life>0)droppedItems.push(i);});
 };
 const strike=minionStrike;minionStrike=function(m,target){const base=m.dmg,oldHp=Math.max(0,target.hp);m.dmg=Math.round(skillDamage(m));strike(m,target);m.dmg=base;
  if(m.type==='specter'&&skillRank('drain')){const healed=Math.min(m.maxHp-m.hp,Math.max(0,oldHp-Math.max(0,target.hp))*skillEffect('Roubo de vida dos Espectros')/100);m.hp+=healed;player.hp=Math.min(player.maxHp,player.hp+healed*skillEffect('Cura compartilhada com Zephyr')/100);}
 };
 actionSkillAvailable=function(id){return !!ACTION_SKILLS[id]&&(id==='empty'||(ACTION_SKILLS[id].summon?summonTypeAvailable(id):skillUnlocked(id)));};
 const activate=activateActionSlot;activateActionSlot=function(i,x,y){if(player.actionLoadout[i]==='maldicao'){if(TITLE.active||TITLE.paused||COMIC.active||CAMP.map||summonWheelOpen||P.deadT>0)return false;const aim=screenToWorld(mouse.x,mouse.y);return skillCastCurse(x??aim.x,y??aim.z);}return activate(i,x,y);};
 activateSummonSkill=function(type,x,y){
  const skill=ACTION_SKILLS[type];if(!hasPassive(skill.passive)){floatMsg('Aprenda '+skill.ability+' na árvore',innerWidth/2,innerHeight*.4,'#bdc79f');return false;}
  if((player.minionSkillCooldowns[type]||0)>0)return false;
  const group=actionGroup(type).filter(m=>!m.dead);if(!group.length)return false;
  if(type==='zombie'){
   const z=group.slice().sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0],px=z.x,py=z.y,damage=skillDamage(z,skillEffect('Dano da explosão de Zumbi')+skillEffect('Dano das explosões de Zumbi e Necrótica'))*COMBAT_TUNING.zombieBurstMultiplier,radius=COMBAT_TUNING.zombieBurstRadius;
   z.exploded=true;killMinion(z);enemies.slice().forEach(e=>{if(!e.dead&&Math.hypot(e.x-px,e.y-py)<=radius)dealDamageToEnemy(e,Math.round(damage));});ring(px,py,radius,'#99c46a',.6);burst(px,py,'#9dbf68',26,3);
  }else if(type==='archer'){
   const target=localMinionTarget(x,y,necroGroup.position);if(!target)return false;
   for(const m of group){const dx=target.x-m.x,dy=target.y-m.y,d=Math.hypot(dx,dy)||1;eshots.push({friendly:true,locked:true,strong:true,x:m.x,y:m.y,vx:dx/d*18,vy:dy/d*18,dmg:Math.round(skillDamage(m,skillEffect('Dano do Tiro Sepulcral'))*1.9),kind:'arrow',life:1.3,z:1.1});m.swing=.28;}
  }else if(type==='abom'){
   const m=group[0],target=localMinionTarget(x,y,necroGroup.position);let tx=target?target.x:x,ty=target?target.y:y;
   let dx=tx-P.x,dy=ty-P.y,d=Math.hypot(dx,dy)||1;if(d>LEASH_DIST){tx=P.x+dx/d*LEASH_DIST;ty=P.y+dy/d*LEASH_DIST;}dx=tx-m.x;dy=ty-m.y;d=Math.hypot(dx,dy)||1;if(d>7){tx=m.x+dx/d*7;ty=m.y+dy/d*7;}
   const q=clampMobLanding(tx,ty,{type:{sc:1.3}});m.allyLeap={sx:m.x,sy:m.y,x:q.x,y:q.y,time:0};m.target=null;
  }else if(type==='specter'){
   const dx=x-P.x,dy=y-P.y,d=Math.hypot(dx,dy)||1,cx=P.x+dx/d*Math.min(d,6),cy=P.y+dy/d*Math.min(d,6);
   group.forEach((m,i)=>{const a=i*Math.PI*2/group.length,q=clampMobLanding(cx+Math.cos(a),cy+Math.sin(a),{type:{sc:1}});m.x=q.x;m.y=q.y;m.target=null;ring(m.x,m.y,.7,'#b6c4ec',.5);});
  }else if(type==='skeleton'){minionCommand={type:'rally',x:P.x,z:P.y,timer:14};placeCommandMarker(P.x,P.y,'rally');}
  player.minionSkillCooldowns[type]=skill.cooldown*(type==='specter'?skillPercent('Recarga do Passo Espectral'):1);return true;
 };
 updateAllyLeap=function(m,dt){const a=m.allyLeap;if(!a)return false;a.time+=dt;const k=Math.min(1,a.time/.45);m.x=a.sx+(a.x-a.sx)*k;m.y=a.sy+(a.y-a.sy)*k;m.jumpZ=Math.sin(k*Math.PI)*2.6;if(k>=1){m.jumpZ=0;m.allyLeap=null;enemies.slice().forEach(e=>{if(!e.dead&&Math.hypot(e.x-m.x,e.y-m.y)<=3)dealDamageToEnemy(e,Math.round(skillDamage(m,skillEffect('Dano do Salto Devastador'))*2.2));});ring(m.x,m.y,3,'#aac679',.6);burst(m.x,m.y,'#a7c98a',25,3);}return true;};
 const tick=updateActionSystem;updateActionSystem=function(dt){tick(dt);if(player.skillTutorialState==='pending')skillTutorialOpen();player.skillVeilT=Math.max(0,(player.skillVeilT||0)-dt);for(const id of ['skeleton','specter'])player.minionSkillCooldowns[id]=Math.max(0,(player.minionSkillCooldowns[id]||0)-dt);for(const id of ['chuva','explosao','maldicao'])player.spellCooldowns[id]=Math.max(0,(player.spellCooldowns[id]||0)-dt);enemies.forEach(e=>{if(e.skillCurseT>0){e.skillCurseT-=dt;if(e.skillCurseT<=0){e.dmg=e._uncursedDmg;delete e._uncursedDmg;}}});};
 buildUpgradeGrid=function(){document.getElementById('upgrade-grid').innerHTML='';};
 buildMinionUpgradeGrid=function(){const el=document.getElementById('minion-upgrade-grid');if(el)el.innerHTML='';};
 buildSpellUpgradesSection=function(){const el=document.getElementById('spell-upgrades-section');if(el)el.innerHTML='';};
 const hub=showHubOverlay;showHubOverlay=function(tab){return hub(tab==='upgrades'||tab==='minions'?'skills':tab);};
 const selectTab=showTab;showTab=function(id,button){return selectTab(id==='upgrades'||id==='minions'?'skills':id,button);};
 buyUpgrade=buyMinionUpgrade=buySpellUpgrade=function(){return false;};
 fuseZombies=function(){floatMsg('Abominação é desbloqueada no ramo dos Zumbis.',innerWidth/2,innerHeight*.4,'#bdc79f');return null;};
 learnSkill=skillInvest;unlearnSkill=skillRefund;
 respecAllSkills=function(){if(!skillCanRefund()){floatMsg(skillRefundReason(),innerWidth/2,innerHeight*.4,'#d7a68e');return;}const cost=skillResetCost();if(!cost||!skillPayRefund(cost))return;player.skillRanks={};skillRemoveUnavailable();skillRefresh();};
 MANAGEMENT_INFO.upgrades[1]='Atributos e equipamentos de Zephyr.';MANAGEMENT_INFO.skills[1]='Minions e Profana · bifurcações, sinergias e 3 pontos por nível.';
 const pointButton=document.getElementById('sp-pts-txt');
 if(pointButton?.setAttribute){
  pointButton.setAttribute('role','button');pointButton.setAttribute('tabindex','0');pointButton.title='Abrir árvores de habilidades: Minions e Profana';
  const open=()=>{if(TITLE.active||COMIC.active||CAMP.map)return;setPause(true);tPause('skills');};
  pointButton.onclick=open;pointButton.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();open();}});
 }
 skillSync();
})();

function buildSkillTree(){
 const container=document.getElementById('skill-tree');if(!container)return;container.innerHTML='';
 const shell=document.createElement('div');shell.className='live-grimoire';container.append(shell);
 shell.innerHTML=`<div class="lg-heading"><div><small>O LEGADO DE ZEPHYR</small><h2>Grimório dos Mortos</h2></div><div><b>${player.skillPoints}</b> pontos disponíveis<small>3 pontos por nível · nível ${player.level}</small></div></div><div class="lg-toolbar"><div class="lg-tabs" role="tablist" aria-label="Árvore de habilidades"><button data-tree="minions" role="tab" aria-selected="${skillTreeTab==='minions'}">☠ Minions</button><button data-tree="spells" role="tab" aria-selected="${skillTreeTab==='spells'}">✧ Profana</button></div><button class="btn lg-reset">Redistribuir pontos</button></div><div class="lg-layout"><div class="lg-schools"></div><section class="lg-detail" aria-live="polite"></section></div><p class="lg-note">Linhas: pré-requisitos · Diamantes: especializações finais exclusivas · Sinergias somam pontos diretos.</p>`;
 shell.classList.toggle('profana',skillTreeTab==='spells');
 shell.querySelectorAll('[data-tree]').forEach(b=>b.onclick=()=>{skillTreeTab=b.dataset.tree;skillTreeSelected=BuildModel.nodes.find(n=>n.tree===skillTreeTab).id;buildSkillTree();});
 const reset=shell.querySelector('.lg-reset'),resetCost=skillResetCost();reset.textContent='Redistribuir · '+resetCost+' ouro';reset.disabled=!resetCost||!skillCanRefund()||(player.gold||0)<resetCost;reset.title='20 ouro por ponto devolvido · Seu ouro: '+(player.gold||0);reset.onclick=respecAllSkills;
 const balance=document.createElement('span');balance.className='lg-gold';balance.textContent='🪙 '+(player.gold||0)+' ouro';shell.querySelector('.lg-toolbar').append(balance);
 if(player.skillTutorialState==='allocating'){
  const guide=document.createElement('div');guide.className='lg-tutorial-guide';guide.setAttribute('role','status');guide.textContent='Seus primeiros pontos: selecione um símbolo e clique em + Investir ponto. Distribuídos: '+Math.min(3,BuildModel.spent(player.skillRanks))+'/3. Você pode misturar Minions e Profana.';shell.querySelector('.lg-toolbar').after(guide);
 }
 const positions=[[50,8],[23,104],[77,104],[23,200],[77,200],[23,296],[77,296]];
 for(const school of BuildModel.schools.filter(s=>s.tree===skillTreeTab)){
  const section=document.createElement('section');section.className='lg-school';section.innerHTML=`<h3>${school.name}</h3><div class="lg-paths"><span>${school.paths[0]}</span><span>${school.paths[1]}</span></div><div class="lg-graph"></div>`;
  const graph=section.querySelector('.lg-graph'),list=BuildModel.nodes.filter(n=>n.school===school.id),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 390');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
  list.forEach((n,i)=>{if(!n.requires)return;const p=list.findIndex(x=>x.id===n.requires),[x,y]=positions[i],[px,py]=positions[p],path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M ${px} ${py+82} V ${y-8} H ${x} V ${y}`);if(skillRank(n.id))path.classList.add('learned');svg.append(path);});graph.append(svg);
  list.forEach((n,i)=>{const b=document.createElement('button'),rank=skillRank(n.id),blocked=BuildModel.reason(n,player.skillRanks,player.level);b.className='lg-node'+(rank?' learned':'')+(blocked?' locked':'')+(n.max===1?' final':'')+(n.id===skillTreeSelected?' selected':'');b.style.left=positions[i][0]+'%';b.style.top=positions[i][1]+'px';b.setAttribute('aria-label',n.name+', '+rank+' de '+n.max+' pontos'+(blocked?' · '+blocked:''));b.title=blocked||n.name+' · Selecione para ver os efeitos';b.setAttribute('aria-pressed',String(n.id===skillTreeSelected));b.innerHTML=`<span class="lg-seal"><i>${n.icon}</i><em>${rank}/${n.max}</em></span><span>${n.name}</span>`;b.onclick=()=>{skillTreeSelected=n.id;buildSkillTree();};graph.append(b);});shell.querySelector('.lg-schools').append(section);
 }
 const n=BuildModel.byId[skillTreeSelected],rank=skillRank(n.id),error=BuildModel.reason(n,player.skillRanks,player.level),detail=shell.querySelector('.lg-detail'),e=skillEffects();
 detail.innerHTML=`<small>${skillTreeTab==='minions'?'MINIONS':'PROFANA'} · ${BuildModel.schools.find(s=>s.id===n.school).name}</small><h3>${n.icon} ${n.name}</h3><b>${rank}/${n.max} pontos</b><p>${n.description}</p><div class="lg-requirement">${error||`Nível ${n.level}${n.requires?' · 2 pontos em '+BuildModel.byId[n.requires].name:''}`}</div>${TREE_ACTIONS[n.id]&&(player.skillGrants||[]).includes(TREE_ACTIONS[n.id])?'<p class="lg-note">Habilidade base já disponível. Investir aprimora e abre os próximos nós.</p>':''}${n.exclusive?'<p class="lg-note">Escolha final exclusiva com '+BuildModel.byId[n.exclusive].name+'.</p>':''}<h4>Por ponto investido</h4><ul>${Object.entries(n.effects).map(([k,v])=>`<li>${v>0?'+':''}${v}${/adicionais/.test(k)?'':'%'} ${k.toLowerCase()}</li>`).join('')}</ul><div class="lg-invest"><button class="btn invest">+ Investir ponto</button><button class="btn refund">−</button></div><h4>Sinergias da build</h4><div class="lg-bonuses">${Object.entries(e).map(([k,v])=>`<div><span>${k}</span><b>${v>0?'+':''}${v}${/adicionais/.test(k)?'':'%'}</b></div>`).join('')||'Invista pontos para fortalecer sua build.'}</div><p class="lg-note">Bônus para habilidades ainda não aprendidas ficam dormentes. Devolução na vila, no mapa ou pausado entre waves. Aliados detonados/sacrificados precisam terminar a recuperação.</p>`;
 const invest=detail.querySelector('.invest');invest.disabled=!!error||rank>=n.max||player.skillPoints<=0;invest.onclick=()=>skillInvest(n.id);
 const refund=detail.querySelector('.refund'),quote=skillRefundQuote(n.id);refund.disabled=!rank||!skillCanRefund()||(player.gold||0)<quote.cost;refund.textContent='− Devolver ponto';refund.setAttribute('aria-label','Devolver ponto de '+n.name+' por '+quote.cost+' ouro');refund.title='Devolve '+quote.points+' ponto(s), incluindo dependentes · '+quote.cost+' ouro';refund.onclick=()=>skillRefund(n.id);
 {const price=document.createElement('p');price.className='lg-note lg-refund-feedback';price.setAttribute('role','status');price.textContent=skillRefundReason()||(!rank?'Este nó não tem pontos investidos para devolver.':(player.gold||0)<quote.cost?'Ouro insuficiente: precisa de '+quote.cost+' ouro para devolver '+quote.points+' ponto(s), incluindo dependentes. Seu saldo: '+(player.gold||0)+'.':'Devolve '+quote.points+' ponto(s), incluindo dependentes, por '+quote.cost+' ouro.');detail.querySelector('.lg-invest').after(price);}
 const bonus=detail.querySelector('.lg-bonuses'),bonusTitle=bonus.previousElementSibling,fold=document.createElement('details');fold.className='lg-bonus-fold';fold.innerHTML='<summary>Bônus acumulados da build</summary>';bonusTitle.replaceWith(fold);fold.append(bonus);
 const action=TREE_ACTIONS[n.id];if(action&&skillUnlocked(action)&&!player.actionLoadout.includes(action)){
  const equip=document.createElement('button');equip.className='btn lg-equip-help';equip.textContent='Alocar em um slot';equip.onclick=()=>{player.skillEquipTutorialPending=action;skillEquipTutorialOpen();};detail.querySelector('.lg-invest').after(equip);
 }
}
