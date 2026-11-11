import {campaignQuests} from './quest-model.mjs';
export function renderQuestJournal(save,host){
 host.replaceChildren();
 const node=(tag,text,parent=host)=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;},quests=campaignQuests(save);
 node('h2','Diário de missões');node('p','As etapas são atualizadas conforme suas ações. Novos pedidos são oferecidos pelos NPCs marcados com !.');
 for(const [status,title] of [['active','Em aberto'],['done','Concluídas']]){
  const list=quests.filter(q=>q.status===status),section=node('section','');section.className='quest-journal-group';section.dataset.questStatus=status;
  node('h3',title+' · '+list.length,section);
  if(!list.length)node('p',status==='active'?'Nenhuma missão aceita em aberto.':'Nenhuma missão concluída.',section);
  for(const q of list){
   const card=node('details','',section);card.className='quest-card';card.dataset.questId=q.id;card.open=status==='active';
   node('summary',q.title,card);node('small','Responsável: '+q.giver,card);
   if(status==='active')node('p','Etapa '+(q.current+1)+' de '+q.steps.length+' · '+q.summary,card);
   const steps=node('ol','',card);for(const [i,s] of q.steps.entries()){const item=node('li',(s.done?'✓ ':i===q.current?'→ ':'')+s.label,steps);item.className=s.done?'done':i===q.current?'current':'';}
  }
 }
}
