// Aba Habilidades do Relicário: árvores Minions/Profana e Maestrias.
// Estrutura e classes seguem scripts/skill-trees.js e skill-mastery.js (jogo anterior); regras em grimoire.mjs.
import {Build,Model,changeRank,changeMastery,resetRanks,editReason} from './grimoire.mjs';
import {ACTIONS,SPELL_NODES,available,actionName} from './actions.mjs';
import R from './horde-rules.mjs';
import {D} from './campaign-model.mjs';
const ICON={empty:'＋',raio:'⚡',dash:'➶',zombie:'🧟',skeleton:'💀',archer:'🏹',specter:'👻',abom:'👹',chuva:'🦴',explosao:'💥',maos:'🖐',barreira:'🛡',maldicao:'🕯'};
const KEYS=['M1 · 1','M2 · 2','3 · Q','4 · E','5 · R','6 · T'];
const POSITIONS=[[50,8],[23,104],[77,104],[23,200],[77,200],[23,296],[77,296]];
const REFUND_GOLD=20;
const pct=(key,v)=>(v>0?'+':'')+v+(/adicionais/.test(key)?'':'%');
const fmt=(stat,value)=>'+'+Number(value.toFixed(2))+(stat==='pierce'?'':stat==='curse'?' p.p.':'%')+' '+Model.labels[stat];
export function createGrimoirePanel(session,{open,changed,equip}){
 const host=document.getElementById('grimoire-content'),status=document.getElementById('grimoire-message'),warning=document.getElementById('grimoire-warning');
 let tab='minions',selected='zombie',masterySlot=0;const api={render,isOpen:()=>false,openPicker:index=>window.NecromancerV2?.ui?.chooseSlot(index)};
 const el=(tag,cls,html,parent)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;parent?.append(e);return e;};
 function result(r){status.textContent=r.message;changed();render();}
 function render(){
  const w=session.world;host.replaceChildren();const reason=editReason(session);warning.textContent=reason||'';
  if(!w.army){el('p','lg-note','Ative Grupos reais para abrir seu perfil.',host);return;}
  const profile=w.army.profile,remaining=Build.budget(profile.level)-Build.spent(profile.ranks),mastery=tab==='mastery',gold=session.save.character.gold||0;
  const shell=el('div','live-grimoire'+(tab==='spells'?' profana':'')+(mastery?' mastery-view':''),undefined,host);
  shell.innerHTML='<div class="lg-heading"><div><small>O LEGADO DE ZEPHYR</small><h2>'+(mastery?'Maestrias das habilidades':'Grimório dos Mortos')+'</h2></div><div><b>'+remaining+'</b> pontos disponíveis<small>3 pontos por nível · nível '+profile.level+'</small></div></div><div class="lg-toolbar"><div class="lg-tabs" role="tablist" aria-label="Árvore de habilidades"></div><button type="button" class="btn lg-reset"></button><span class="lg-gold">🪙 '+gold+' ouro</span></div>';
  const tabs=shell.querySelector('.lg-tabs');
  for(const [id,title] of [['minions','☠ Minions'],['spells','✧ Profana'],['mastery','✦ Maestrias']]){const b=el('button',undefined,title,tabs);b.type='button';b.dataset.tree=id;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(tab===id));b.onclick=()=>{tab=id;if(id!=='mastery'&&Build.byId[selected]?.tree!==id)selected=Build.nodes.find(n=>n.tree===id).id;render();};}
  const resetCost=Build.spent(profile.ranks)*REFUND_GOLD,reset=shell.querySelector('.lg-reset');reset.textContent='Redistribuir · '+resetCost+' ouro';reset.disabled=!resetCost||!!reason||gold<resetCost;reset.title=REFUND_GOLD+' ouro por ponto devolvido · Seu ouro: '+gold;reset.hidden=mastery;reset.onclick=()=>result(resetRanks(session));
  if(mastery)renderMastery(shell,w,reason);else renderTree(shell,w,profile,remaining,reason,gold);
 }
 function renderTree(shell,w,profile,remaining,reason,gold){
  const layout=el('div','lg-layout','<div class="lg-schools"></div><section class="lg-detail" aria-live="polite"></section>',shell),schools=layout.querySelector('.lg-schools');
  for(const school of Build.schools.filter(s=>s.tree===tab)){
   const section=el('section','lg-school','<h3>'+school.name+'</h3><div class="lg-paths"><span>'+school.paths[0]+'</span><span>'+school.paths[1]+'</span></div><div class="lg-graph"></div>',schools),graph=section.querySelector('.lg-graph'),list=Build.nodes.filter(n=>n.school===school.id),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
   svg.setAttribute('viewBox','0 0 100 390');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
   list.forEach((n,i)=>{if(!n.requires)return;const p=list.findIndex(x=>x.id===n.requires),[x,y]=POSITIONS[i],[px,py]=POSITIONS[p],path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M '+px+' '+(py+82)+' V '+(y-8)+' H '+x+' V '+y);if(profile.ranks[n.id])path.classList.add('learned');svg.append(path);});graph.append(svg);
   list.forEach((n,i)=>{const b=el('button',undefined,undefined,graph),rank=profile.ranks[n.id]||0,blocked=Build.reason(n,profile.ranks,profile.level);
    b.type='button';b.dataset.node=n.id;b.className='lg-node'+(rank?' learned':'')+(blocked?' locked':'')+(n.max===1?' final':'')+(n.id===selected?' selected':'');b.style.left=POSITIONS[i][0]+'%';b.style.top=POSITIONS[i][1]+'px';
    b.setAttribute('aria-label',n.name+', '+rank+' de '+n.max+' pontos'+(blocked?' · '+blocked:''));b.title=blocked||n.name+' · Selecione para ver os efeitos';b.setAttribute('aria-pressed',String(n.id===selected));
    b.innerHTML='<span class="lg-seal"><i>'+n.icon+'</i><em>'+rank+'/'+n.max+'</em></span><span>'+n.name+'</span>';b.onclick=()=>{selected=n.id;render();};});
  }
  if(Build.byId[selected]?.tree!==tab)selected=Build.nodes.find(n=>n.tree===tab).id;
  const n=Build.byId[selected],rank=profile.ranks[n.id]||0,error=Build.reason(n,profile.ranks,profile.level),detail=layout.querySelector('.lg-detail');
  const blocked=reason||error||rank>=n.max&&'Habilidade no máximo.'||remaining<=0&&'Sem pontos disponíveis.';
  const school=Build.schools.find(s=>s.id===n.school);
  detail.innerHTML='<small>'+(tab==='minions'?'MINIONS':'PROFANA')+' · '+school.name+'</small><h3>'+n.icon+' '+n.name+'</h3><b>'+rank+'/'+n.max+' pontos</b><p>'+n.description+'</p><div class="lg-requirement">'+(error||'Nível '+n.level+(n.requires?' · 2 pontos em '+Build.byId[n.requires].name:''))+'</div>'+(n.exclusive?'<p class="lg-note">Escolha final exclusiva com '+Build.byId[n.exclusive].name+'.</p>':'')+'<h4>Por ponto investido</h4><ul>'+Object.entries(n.effects).map(([k,v])=>'<li>'+pct(k,v)+' '+k.toLowerCase()+'</li>').join('')+'</ul><div class="lg-invest"><button type="button" class="btn invest">+ Investir ponto</button><button type="button" class="btn refund">− Devolver ponto</button></div>';
  const invest=detail.querySelector('.invest'),refund=detail.querySelector('.refund'),points=Build.refund(structuredClone(profile),n.id),cost=points*REFUND_GOLD;
  invest.disabled=!!blocked;invest.title=blocked||'Investir 1 ponto em '+n.name;invest.onclick=()=>result(changeRank(session,n.id));
  refund.disabled=!!reason||!points||gold<cost;refund.setAttribute('aria-label','Devolver ponto de '+n.name+' por '+cost+' ouro');refund.title='Devolve '+points+' ponto(s), incluindo dependentes · '+cost+' ouro';refund.onclick=()=>result(changeRank(session,n.id,{refund:true}));
  el('p','lg-note lg-refund-feedback',reason||(!rank?'Este nó não tem pontos investidos para devolver.':gold<cost?'Ouro insuficiente: precisa de '+cost+' ouro para devolver '+points+' ponto(s), incluindo dependentes. Seu saldo: '+gold+'.':'Devolve '+points+' ponto(s), incluindo dependentes, por '+cost+' ouro.'),detail).setAttribute('role','status');
  const action=Object.entries(SPELL_NODES).find(([,node])=>node===n.id)?.[0]||(ACTIONS.includes(n.id)?n.id:null);
  if(action){
   const slots=el('div','lg-equip',undefined,detail);el('h4',undefined,'Equipar nos slots',slots);const learned=available(w.army,action);
   if(!learned){const ranked=rank>0,stage=D.stages.find(s=>s?.grant===(R.types.includes(action)?'summon':action));el('p','lg-note',!ranked?'Invista um ponto para poder equipar.':stage?'Ponto investido. Esta habilidade é liberada na campanha ao iniciar "'+stage.name+'".':'Ponto investido, mas esta habilidade ainda não está liberada na campanha.',slots);}
   w.army.loadout.forEach((id,i)=>{const b=el('button','btn',(i+1)+' · '+actionName(id)+(id===action?' ✓':''),slots);b.type='button';b.classList.toggle('lg-equip-help',id===action);b.disabled=!learned;b.dataset.equipSlot=i;b.onclick=()=>{const r=equip(i,action);result({...r,message:r.ok?'Slot '+(i+1)+': '+actionName(action)+'.':r.message});};});
  }
  const bonuses=Object.entries(Build.effects(profile.ranks)).filter(([,v])=>v);
  const fold=el('details','lg-bonus-fold','<summary>Bônus acumulados da build</summary>',detail);const list=el('div','lg-bonuses',undefined,fold);
  if(bonuses.length)for(const [k,v] of bonuses)el('div',undefined,'<span>'+k+'</span><b>'+pct(k,v)+'</b>',list);else list.textContent='Invista pontos para fortalecer sua build.';
  el('p','lg-note','Bônus para habilidades ainda não aprendidas ficam dormentes. A devolução custa '+REFUND_GOLD+' ouro por ponto e só é possível no menu, na vila, no mapa ou pausado. Aliados detonados/sacrificados precisam terminar a recuperação.',detail);
  el('p','lg-note','Linhas: pré-requisitos · Diamantes: especializações finais exclusivas · Sinergias somam pontos diretos.',shell);
 }
 function renderMastery(shell,w,reason){
  const slots=w.army.loadout;masterySlot=Math.min(masterySlot,slots.length-1);
  const panel=el('section','mastery-panel','<p class="mastery-slot-intro">6 especializações vinculadas à barra de combate. Somente essas habilidades ganham níveis, recebem pontos próprios e ativam os bônus de maestria.</p><div class="mastery-slots" role="group" aria-label="Seis slots de especialização"></div>',shell);panel.setAttribute('aria-label','Especializações da barra de combate');
  slots.forEach((id,index)=>{
   const def=Model.skills[id],state=def?w.army.mastery[id]:null,next=state?Model.xpNext(state.level):0,b=el('button','mastery-specialization'+(index===masterySlot?' selected':''),undefined,panel.querySelector('.mastery-slots'));
   b.type='button';b.dataset.masterySlot=String(index);b.setAttribute('aria-pressed',String(index===masterySlot));b.setAttribute('aria-label','Especialização '+(index+1)+' · '+(def?def.name:'Slot vazio'));
   b.innerHTML='<small>SLOT '+(index+1)+' · '+KEYS[index]+'</small><span>'+(def?ICON[id]:'＋')+'</span><b>'+(def?def.name:'Vazio')+'</b><em>'+(state?'Nível '+state.level+' · '+Model.points(state)+' pts':'Equipe na barra')+'</em>'+(state?'<progress aria-label="XP de '+def.name+'" max="'+(next||1)+'" value="'+(next?state.xp:1)+'"></progress>':'');
   b.onclick=()=>{masterySlot=index;render();};
  });
  const id=slots[masterySlot],def=Model.skills[id];
  if(!def){el('p','mastery-locked','Equipe uma habilidade na barra de combate para iniciar sua especialização.',panel);const choose=el('button','btn','Escolher habilidade para slot '+(masterySlot+1),panel);choose.type='button';choose.onclick=()=>api.openPicker(masterySlot);return;}
  const state=w.army.mastery[id],next=Model.xpNext(state.level),bonus=Model.bonus(id,state);
  const detail=el('section','mastery-selected-tree',undefined,panel);detail.setAttribute('aria-label','Árvore de '+def.name);
  detail.innerHTML='<div class="mastery-heading"><div><small>ESPECIALIZAÇÃO '+(masterySlot+1)+'</small><h3>'+ICON[id]+' '+def.name+' <span>nível '+state.level+' / '+Model.MAX_LEVEL+'</span></h3></div><b>'+Model.points(state)+' pontos próprios</b></div><label class="mastery-xp-label">'+(next?Math.floor(state.xp)+' / '+next+' XP':'Nível máximo alcançado')+'</label><progress class="mastery-progress" aria-label="Experiência de '+def.name+'" max="'+(next||1)+'" value="'+(next?state.xp:1)+'"></progress><div class="mastery-branches"></div><details class="mastery-help"><summary>Bônus e regras de evolução</summary><p>Por nível: '+Object.entries(def.automatic).map(([k,v])=>fmt(k,v)).join(' · ')+'.</p><p>Bônus ativos: '+(Object.entries(bonus).filter(([,v])=>v).map(([k,v])=>fmt(k,v)).join(' · ')||'nenhum ainda')+'.</p><p>Apenas habilidades equipadas ativam bônus. Após o primeiro, cada nível concede 1 ponto exclusivo. Nós avançados exigem maestria 6 e 2 pontos no nó anterior. Ao sair da barra, a habilidade preserva níveis, XP e pontos; a maestria fica inativa até ser equipada novamente. Cada abate concede o XP do inimigo às habilidades equipadas, uma vez.</p></details><div class="mastery-footer"><button type="button" class="btn mastery-reset">Redistribuir maestria · grátis</button><button type="button" class="btn mastery-change">Trocar habilidade do slot '+(masterySlot+1)+'</button></div><p class="mastery-reset-reason" role="status"></p>';
  for(let i=0;i<def.nodes.length;i+=2){
   const branch=el('div','mastery-branch',undefined,detail.querySelector('.mastery-branches'));
   for(const n of def.nodes.slice(i,i+2)){
    const error=Model.reason(id,state,n.id),rank=state.ranks[n.id]||0,card=el('article','mastery-node'+(n.requires?' advanced':'')+(rank?' learned':''),undefined,branch);
    card.innerHTML='<h4>'+n.name+'</h4><b>'+rank+'/'+n.max+'</b><p>'+fmt(n.stat,n.value)+' por ponto</p><button type="button" class="btn mastery-invest" data-mastery-node="'+n.id+'" aria-label="Investir em '+n.name+'">+</button><p class="mastery-node-reason">'+(reason||error||'')+'</p>';
    const invest=card.querySelector('button');invest.disabled=!!reason||!!error;invest.title=reason||error||'Investir 1 ponto em '+n.name;invest.onclick=()=>result(changeMastery(session,id,n.id));
   }
  }
  const resetBtn=detail.querySelector('.mastery-reset');resetBtn.disabled=!!reason||!Model.spent(state);resetBtn.onclick=()=>result(changeMastery(session,id,null,{reset:true}));
  detail.querySelector('.mastery-change').onclick=()=>api.openPicker(masterySlot);detail.querySelector('.mastery-reset-reason').textContent=reason;
 }
 // Trocar a habilidade pelo seletor deve atualizar a aba aberta.
 document.getElementById('action-picker')?.addEventListener('close',()=>{if(host.isConnected&&host.offsetParent)render();});
 return api;
}
