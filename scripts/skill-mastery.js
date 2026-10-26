// Installed after existing combat modules, before bootGame loads the character.
let masteryView=false,masterySelected='zombie',masterySelectedSlot=0;
const masteryCache=new WeakMap();
function masteryState(id){
 if(!player.skillMastery)player.skillMastery=SkillMasteryModel.migrate();
 return player.skillMastery[id];
}
function masterySpecializations(){return SkillMasteryModel.specializations(player.actionLoadout,[]);}
function masteryIsSpecialized(id){return masterySpecializations().includes(id)&&skillUnlocked(id);}
function masteryBonus(id){
 if(!masteryIsSpecialized(id))return {};
 const state=masteryState(id);if(!state)return {};
 if(!masteryCache.has(state))masteryCache.set(state,SkillMasteryModel.bonus(id,state));
 return masteryCache.get(state);
}
function masteryFactor(id,key){return 1+(masteryBonus(id)[key]||0)/100;}
function masteryCooldown(id){return 1-(masteryBonus(id).cooldown||0)/100;}
function masteryRefresh(){
 skillSync();actionSignature='';updateHUD();updateMinionPanel();
 if(typeof menuUpdateSummary==='function')menuUpdateSummary();
 buildSkillTree();saveGame();
}
function masteryInvest(id,node){
 if(!masteryIsSpecialized(id))return;
 const state=SkillMasteryModel.normalize(id,masteryState(id));
 try{SkillMasteryModel.invest(id,state,node);player.skillMastery[id]=state;masteryRefresh();document.querySelector('[data-mastery-node="'+node+'"]')?.focus();playSound('levelUp');}
 catch(error){floatMsg(error.message,innerWidth/2,innerHeight*.4,'#d7a68e');}
}
function masteryReset(id){
 if(!masteryIsSpecialized(id)||!skillCanRefund())return;
 const state=masteryState(id);player.skillMastery[id]={...state,ranks:{}};masteryRefresh();
}
function masteryGain(amount){
 if(!Number.isFinite(amount)||amount<=0)return;
 const raised=[];
 for(const id of masterySpecializations()){
  if(!SkillMasteryModel.ids.includes(id)||!skillUnlocked(id))continue;
  const result=SkillMasteryModel.gain(id,masteryState(id),amount,player.level);
  player.skillMastery[id]=result.state;
  if(result.levels)raised.push(SkillMasteryModel.skills[id].name+' '+result.state.level);
 }
 if(raised.length){
  minions.forEach(skillApplyMinion);actionSignature='';updateMinionPanel();
  floatMsg('Maestria ↑ '+raised.join(' · '),innerWidth/2,innerHeight*.34,'#d7c588');
 }
}
function masteryFormat(stat,value){return '+'+Number(value.toFixed(2))+(stat==='pierce'?'':stat==='curse'?' p.p.':'%')+' '+SkillMasteryModel.labels[stat];}
function buildMasteryPanel(shell){
 const slots=masterySpecializations();
 masterySelected=slots[masterySelectedSlot];
 const host=document.createElement('section');host.className='mastery-panel';host.setAttribute('aria-label','Especializações da barra de combate');
 host.innerHTML='<p class="mastery-slot-intro">6 especializações vinculadas à barra de combate. Somente essas habilidades ganham níveis, recebem pontos próprios e ativam os bônus de maestria.</p><div class="mastery-slots" role="group" aria-label="Seis slots de especialização"></div>';
 slots.forEach((id,index)=>{
  const button=document.createElement('button'),state=id?masteryState(id):null,def=id?SkillMasteryModel.skills[id]:null,next=state?SkillMasteryModel.xpNext(state.level):0;
  button.type='button';button.className='mastery-specialization'+(index===masterySelectedSlot?' selected':'');button.dataset.masterySlot=String(index);button.setAttribute('aria-pressed',String(index===masterySelectedSlot));
  button.setAttribute('aria-label','Especialização '+(index+1)+' · '+(def?def.name:'Slot vazio'));
  button.innerHTML='<small>SLOT '+(index+1)+' · '+ACTION_KEYS[index]+'</small><span>'+(id?ACTION_SKILLS[id].icon:'＋')+'</span><b>'+(def?def.name:'Vazio')+'</b><em>'+(state?'Nível '+state.level+' · '+SkillMasteryModel.points(state)+' pts':'Equipe na barra')+'</em>'+(state?'<progress aria-label="XP de '+def.name+'" max="'+(next||1)+'" value="'+(next?state.xp:1)+'"></progress>':'');
  button.onclick=()=>{masterySelectedSlot=index;masterySelected=id;buildSkillTree();};host.querySelector('.mastery-slots').append(button);
 });
 const id=masterySelected,def=SkillMasteryModel.skills[id];
 if(!def){
  const empty=document.createElement('p');empty.className='mastery-locked';empty.textContent='Equipe uma habilidade na barra de combate para iniciar sua especialização.';host.append(empty);
  const choose=document.createElement('button');choose.className='btn';choose.textContent='Escolher habilidade para slot '+(masterySelectedSlot+1);choose.onclick=()=>openActionPicker(masterySelectedSlot);host.append(choose);
  shell.querySelector('.lg-layout').replaceWith(host);shell.querySelector('.lg-note')?.remove();return;
 }
 const state=masteryState(id),unlocked=masteryIsSpecialized(id),bonus=masteryBonus(id),next=SkillMasteryModel.xpNext(state.level);
 const detail=document.createElement('section');detail.className='mastery-selected-tree';detail.setAttribute('aria-label','Árvore de '+def.name);
 detail.innerHTML=`<div class="mastery-heading"><div><small>ESPECIALIZAÇÃO ${masterySelectedSlot+1}</small><h3>${ACTION_SKILLS[id].icon} ${def.name} <span>nível ${state.level} / 20</span></h3></div><b>${SkillMasteryModel.points(state)} pontos próprios</b></div><label class="mastery-xp-label">${next?Math.floor(state.xp)+' / '+next+' XP':'Nível máximo alcançado'}</label><progress class="mastery-progress" aria-label="Experiência de ${def.name}" max="${next||1}" value="${next?state.xp:1}"></progress>${!unlocked?'<p class="mastery-locked">Habilidade indisponível. Aprenda no Grimório para ativar esta especialização.</p>':''}<div class="mastery-branches"></div><details class="mastery-help"><summary>Bônus e regras de evolução</summary><p>Por nível: ${Object.entries(def.automatic).map(([key,value])=>masteryFormat(key,value)).join(' · ')}.</p><p>Bônus ativos: ${Object.entries(bonus).filter(([,v])=>v).map(([key,value])=>masteryFormat(key,value)).join(' · ')||'nenhum ainda'}.</p><p>Após o primeiro, cada nível concede 1 ponto exclusivo. Nós avançados exigem maestria 6 e 2 pontos no nó anterior. Ao sair da barra, a habilidade preserva níveis, XP e pontos; a maestria fica inativa até ser equipada novamente.</p></details><div class="mastery-footer"><button class="btn mastery-reset">Redistribuir maestria · grátis</button><button class="btn mastery-change">Trocar habilidade do slot ${masterySelectedSlot+1}</button></div><p class="mastery-reset-reason" role="status"></p>`;
 for(let i=0;i<def.nodes.length;i+=2){
  const branch=document.createElement('div');branch.className='mastery-branch';
  for(const n of def.nodes.slice(i,i+2)){
   const error=SkillMasteryModel.reason(id,state,n.id),rank=state.ranks[n.id]||0,card=document.createElement('article');card.className='mastery-node'+(n.requires?' advanced':'')+(rank?' learned':'');
   card.innerHTML=`<h4>${n.name}</h4><b>${rank}/${n.max}</b><p>${masteryFormat(n.stat,n.value)} por ponto</p><button class="btn mastery-invest" data-mastery-node="${n.id}" aria-label="Investir em ${n.name}">+</button><p class="mastery-node-reason">${!unlocked?'Habilidade bloqueada':error||''}</p>`;
   const invest=card.querySelector('button');invest.disabled=!unlocked||!!error;invest.title=error||'Investir 1 ponto em '+n.name;invest.onclick=()=>masteryInvest(id,n.id);branch.append(card);
  }
  detail.querySelector('.mastery-branches').append(branch);
 }
 const reset=detail.querySelector('.mastery-reset');reset.disabled=!unlocked||!SkillMasteryModel.spent(state)||!skillCanRefund();reset.onclick=()=>masteryReset(id);
 detail.querySelector('.mastery-change').onclick=()=>openActionPicker(masterySelectedSlot);
 detail.querySelector('.mastery-reset-reason').textContent=skillRefundReason();host.append(detail);shell.querySelector('.lg-layout').replaceWith(host);shell.querySelector('.lg-note')?.remove();
}
(function installSkillMastery(){
 player.skillMastery=SkillMasteryModel.migrate();player.skillMasteryVersion=SkillMasteryModel.VERSION;
 const migrate=skillMigrateSave;skillMigrateSave=function(data){data=migrate(data);data.skillMastery=SkillMasteryModel.migrate(data.skillMastery);data.skillMasteryVersion=SkillMasteryModel.VERSION;return data;};
 const newChar=campNewChar;campNewChar=function(){player.skillMastery=SkillMasteryModel.migrate();masteryView=false;masterySelectedSlot=0;return newChar();};
 // Award before character XP so catch-up is independent of how rewards are batched.
 const xp=gainExp;gainExp=function(amount){if(!Number.isFinite(amount)||amount<=0)return;masteryGain(amount);return xp(amount);};
 const stats=skillMinionStats;skillMinionStats=function(type){
  const s=stats(type),baseDmg=s.baseDmg*masteryFactor(type,'damage'),hp=Math.round(s.hp*masteryFactor(type,'hp'));
  return {...s,hp,baseDmg,dmg:Math.round(baseDmg*(1+s.damageBonus/100)),spd:s.spd*masteryFactor(type,'speed'),regen:hp*COMBAT_TUNING.minionRegen*masteryFactor(type,'regen')};
 };swStats=skillMinionStats;
 const effect=skillEffect;skillEffect=function(key){
  const value=effect(key);
  if(key==='Distância do Dash')return 100*((1+value/100)*masteryFactor('dash','distance')-1);
  if(key==='Redução de dano da Maldição')return Math.min(75,value+(masteryBonus('maldicao').curse||0));
  if(key==='Área da Maldição')return 100*((1+value/100)*masteryFactor('maldicao','area')-1);
  if(key==='Duração da Maldição')return 100*((1+value/100)*masteryFactor('maldicao','duration')-1);
  return value;
 };
 const spell=spellBonus;spellBonus=function(id,key){
  const value=spell(id,key),base=key==='raio_d'?player.spellDmg:key==='chuva_d'?player.spellDmg*.7:key==='exp_d'?player.spellDmg*2.5:null;
  if(base!==null)return (base+value)*masteryFactor(id,'damage')-base;
  if(key==='raio_s')return value+(masteryBonus('raio').pierce||0)*.3;
  if(key==='exp_r')return (player.spellRadius+value)*Math.sqrt(masteryFactor('explosao','area'))-player.spellRadius;
  return value;
 };
 const wall=castHands;castHands=function(...args){
  const before=handsAreas.length,result=wall(...args);
  if(handsAreas.length>before){const w=handsAreas.at(-1);w.dmg=Math.round(w.dmg*masteryFactor('maos','damage'));w.hp*=masteryFactor('maos','resistance');w.life*=masteryFactor('maos','duration');}
  return result;
 };
 const rain=castChuva;castChuva=function(...args){const radius=player.spellRadius;try{player.spellRadius=radius*Math.sqrt(masteryFactor('chuva','area'));return rain(...args);}finally{player.spellRadius=radius;}};
 const shield=castBarrier;castBarrier=function(...args){const mp=player.mp,result=shield(...args);if(player.mp<mp){player.barrier=Math.round(player.barrier*masteryFactor('barreira','absorb'));player.barrierMax=player.barrier;player.barrierCd*=masteryCooldown('barreira');}return result;};
 const dash=castDash;castDash=function(...args){const ok=dash(...args);if(ok)playerDash.cd*=masteryCooldown('dash');return ok;};
 for(const [name,id]of [['castRaio','raio'],['castHands','maos'],['castChuva','chuva'],['castExplosao','explosao'],['skillCastCurse','maldicao']]){
  const cast=globalThis[name];globalThis[name]=function(...args){const mp=player.mp,result=cast(...args);if(player.mp<mp)player.spellCooldowns[id]*=masteryCooldown(id);return result;};
 }
 const command=activateSummonSkill;activateSummonSkill=function(type,...args){const ok=command(type,...args);if(ok)player.minionSkillCooldowns[type]*=masteryCooldown(type);return ok;};
 const automatic=castMinionAbility;castMinionAbility=function(m,...args){const ok=automatic(m,...args);if(ok)m._abilityCd*=masteryCooldown(m.type);return ok;};
 const equip=equipActionSkill;equipActionSkill=function(index,id){const ok=equip(index,id);if(ok&&masteryView&&TITLE.paused&&PM.tab==='skills'){masterySelectedSlot=index;buildSkillTree();}return ok;};
 const build=buildSkillTree;buildSkillTree=function(){
  build();const shell=document.querySelector('.live-grimoire');if(!shell)return;
  const tabs=shell.querySelector('.lg-tabs'),b=document.createElement('button');b.textContent='✦ Maestrias';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(masteryView));b.onclick=()=>{masteryView=true;buildSkillTree();};tabs.append(b);
  tabs.querySelectorAll('[data-tree]').forEach(tab=>{const select=tab.onclick;tab.onclick=()=>{masteryView=false;select();};if(masteryView)tab.setAttribute('aria-selected','false');});
  if(masteryView){shell.classList.add('mastery-view');shell.querySelector('.lg-heading h2').textContent='Maestrias das habilidades';shell.querySelector('.lg-reset').hidden=true;buildMasteryPanel(shell);}
 };
 let hudSignature='';const slots=renderActionSlots;renderActionSlots=function(){
  const previous=actionSignature;slots();const signature=(player.actionLoadout||[]).map(id=>id+':'+(masteryState(id)?.level||0)).join(',');
  if(previous===actionSignature&&signature===hudSignature)return;hudSignature=signature;
  document.querySelectorAll('[data-action-slot]').forEach(button=>{
   const id=player.actionLoadout[Number(button.dataset.actionSlot)];if(!masteryIsSpecialized(id)){button.querySelector('.mastery-slot-level')?.remove();return;}
   let badge=button.querySelector('.mastery-slot-level');if(!badge){badge=document.createElement('strong');badge.className='mastery-slot-level';button.append(badge);}
   badge.textContent='Nv. '+masteryState(id).level;badge.title='Maestria da habilidade';
  });
 };
})();
