import {campaignQuests} from './quest-model.mjs';
export function renderQuestJournal(save,host){
 const previous=host.dataset.selectedQuest;host.replaceChildren();
 const node=(tag,text,parent=host,cls='')=>{const e=document.createElement(tag);if(text)e.textContent=text;e.className=cls;parent.append(e);return e;},quests=campaignQuests(save),active=quests.filter(q=>q.status==='active'),done=quests.filter(q=>q.status==='done');
 const head=node('header','',host,'journal-heading'),intro=node('div','',head);node('small','CRÔNICAS DA JORNADA',intro,'journal-eyebrow');node('h2','Diário de missões',intro);node('p','Cada pedido, um caminho. Acompanhe as histórias que você escolheu seguir.',intro);
 const counters=node('div','',head,'journal-counters');for(const [count,label] of [[active.length,'em aberto'],[done.length,'concluídas']]){const c=node('div','',counters);node('strong',String(count).padStart(2,'0'),c);node('span',label,c);}
 const layout=node('div','',host,'journal-layout'),nav=node('nav','',layout,'journal-index');nav.setAttribute('aria-label','Lista de missões');const detail=node('article','',layout,'journal-detail');detail.id='quest-detail';detail.setAttribute('aria-live','polite');const buttons=[];
 function select(q,focus=false){
  host.dataset.selectedQuest=q.id;for(const [b,id] of buttons){b.classList.toggle('selected',id===q.id);b.setAttribute('aria-pressed',String(id===q.id));}detail.replaceChildren();
  node('small',q.status==='done'?'HISTÓRIA CONCLUÍDA':'MISSÃO EM ANDAMENTO',detail,'journal-eyebrow');node('div',q.status==='done'?'✓':'!',detail,'journal-seal');node('h3',q.title,detail,'journal-title');
  const giver=node('p','',detail,'journal-giver');node('span','PEDIDO DE',giver);node('b',q.giver,giver);
  const count=q.steps.filter(s=>s.done).length,progress=node('div','',detail,'journal-progress');node('span',q.status==='done'?'Todos os objetivos cumpridos':'Etapa '+(q.current+1)+' de '+q.steps.length,progress);node('b',count+' / '+q.steps.length,progress);const track=node('div','',progress,'journal-progress-track');track.setAttribute('role','progressbar');track.setAttribute('aria-label','Objetivos concluídos');track.setAttribute('aria-valuenow',count);track.setAttribute('aria-valuemin',0);track.setAttribute('aria-valuemax',q.steps.length);node('i','',track).style.width=(count/q.steps.length*100)+'%';
  node('h4',q.status==='done'?'Registro da jornada':'Seu próximo passo',detail);node('p',q.status==='done'?'Você cumpriu este pedido. Os passos desta história ficaram registrados abaixo.':q.summary,detail,'journal-next');
  const steps=node('ol','',detail,'journal-timeline');for(const [i,s] of q.steps.entries()){const current=!s.done&&i===q.current,item=node('li','',steps,s.done?'done':current?'current':'pending');node('span',s.done?'✓':String(i+1).padStart(2,'0'),item,'step-number');const text=node('div','',item);node('small',s.done?'CONCLUÍDA':current?'AGORA':'A SEGUIR',text);node('span',s.label,text);}
  node('p',q.status==='done'?'Este registro permanece no seu diário.':'O progresso é atualizado conforme você cumpre os objetivos.',detail,'journal-footnote');if(focus){detail.tabIndex=-1;detail.focus({preventScroll:true});detail.scrollIntoView({block:'nearest',behavior:'smooth'});}
 }
 for(const [status,title,list] of [['active','Em aberto',active],['done','Concluídas',done]]){
  const section=node('section','',nav,'quest-journal-group');section.dataset.questStatus=status;const heading=node('h3','',section);node('span',title,heading);node('b',String(list.length),heading);
  if(!list.length)node('p',status==='active'?'Nenhuma missão aceita em aberto.':'Nenhuma missão concluída.',section,'journal-empty');
  for(const q of list){const card=node('button','',section,'quest-card');card.type='button';card.dataset.questId=q.id;card.setAttribute('aria-controls','quest-detail');node('span',status==='done'?'✓':'!',card,'quest-card-symbol');const body=node('span','',card,'quest-card-body');node('small',status==='done'?'CONCLUÍDA':'EM ANDAMENTO',body);node('strong',q.title,body);node('span',q.giver,body);node('span','›',card,'quest-card-arrow');buttons.push([card,q.id]);card.addEventListener('click',()=>select(q,true));}
 }
 const chosen=quests.find(q=>q.id===previous)||active[0]||done.at(-1);if(chosen)select(chosen);else{node('div','!',detail,'journal-seal');node('h3','Sua próxima história espera',detail,'journal-title');node('p','Procure os moradores com ! acima da cabeça. Converse e aceite um pedido para registrá-lo no diário.',detail,'journal-next');}
}
