// O diário deriva das etapas já salvas: não cria uma segunda fonte de progresso ou de prêmios.
import {niloReady,NILO_RECOVERED,NILO_CITY} from './nilo-model.mjs';
export function normalizeVillageQuests(raw,complete){
 if(!complete)return {questFlow:1,smith:'locked',lumber:'locked'};
 const old=raw.questFlow!==1,cleared=Array.isArray(raw.cleared)?raw.cleared:[],woodProgress=(Array.isArray(raw.piles)&&raw.piles.some(v=>v===1))||cleared.some(id=>['mill-a','mill-b','mill-c'].includes(id));
 let smith=['available','active','found','done'].includes(raw.smith)?raw.smith:'available';
 if(old&&smith==='active'&&!cleared.includes('mine-guards'))smith='available';
 let lumber=['locked','available','active','done'].includes(raw.lumber)?raw.lumber:smith==='done'?'available':'locked';
 if(old&&lumber==='active'&&!woodProgress)lumber=smith==='done'?'available':'locked';
 if(lumber==='locked'&&smith==='done')lumber='available';
 return {questFlow:1,smith,lumber};
}
export function questMarkerFor(key,p){
 if(!p)return '';
 const n=p.nilo||'locked',clear=id=>p.cleared?.includes(id);
 if(key==='child'&&['wake','village'].includes(p.stage))return '!';
 if(key==='mayor'){
  if(p.stage==='return'||p.stage==='rescue'&&p.guardsCleared)return '?';
  if(p.stage==='complete'&&(p.smith==='available'||p.lumber==='available'))return '!';
  if(p.lumber==='active'&&p.piles?.every(Boolean))return '?';
 }
 if(key==='smith'&&(p.smith==='found'||p.smith==='active'&&clear('mine-guards')))return '?';
 if(key==='marta'&&n==='locked'&&niloReady(p))return '!';
 if(key==='nilo')return ['rescued','done'].includes(n)?'!':n==='return'?'?':'';
 if(key==='nilo-cocoon'&&['road','cave'].includes(n)&&clear('cave-queen'))return '?';
 if(key==='helena'&&n==='itavera')return '?';
 if(key==='city-joao'&&n==='invitation')return '!';
 return '';
}
export function campaignQuests(save){
 const c=save.campaign||{},p=c.world,pro=c.prologue,out=[];
 const add=(id,title,giver,done,steps)=>{
  const rows=steps.map(([label,ok])=>({label,done:done||!!ok})),index=rows.findIndex(s=>!s.done);
  out.push({id,title,giver,status:done?'done':'active',steps:rows,current:index<0?rows.length-1:index,summary:done?'Concluída':rows[index]?.label||'Volte ao responsável pela missão.'});
 };
 if(pro){const stages=['travel','ambush','farewell','fall','cave','trail','defense','reunion','done'],at=stages.indexOf(pro.stage);add('jacaranda-defense','Uma parada em Jacarandá','Marta · caravana',pro.stage==='done',[
  ['Proteger a caravana',at>=2],['Sair da caverna e investigar as ordens',at>=5],['Ajudar Tomás',at>=6],['Defender Jacarandá e reencontrar Marta',at>=8]
 ]);}
 if(!p)return out;
 if(!pro&&['rescue','return','complete'].includes(p.stage))add('mayor-rescue','Resgate o prefeito','Lili',p.stage==='complete',[
  ['Derrotar os guardas do posto',p.guardsCleared],['Libertar Joaquim',p.stage==='return'],['Voltar à praça e falar com Joaquim',false]
 ]);
 if(['active','found','done'].includes(p.smith))add('smith','O ferreiro de Jacarandá','Joaquim',p.smith==='done',[
  ['Liberar a entrada da Mina de Valfundo',p.cleared?.includes('mine-guards')||p.smith==='found'],['Encontrar Bruno na mina',p.smith==='found'],['Voltar à ferraria e falar com Bruno',false]
 ]);
 if(['active','done'].includes(p.lumber))add('lumber','Madeira para Jacarandá','Joaquim',p.lumber==='done',[
  ['Marcar a pilha do barracão',p.piles?.[0]],['Marcar a pilha do riacho',p.piles?.[1]],['Marcar a pilha da serra',p.piles?.[2]],['Voltar a Joaquim',false]
 ]);
 const n=p.nilo||'locked',rescued=['rescued','fort',...NILO_RECOVERED].includes(n);
 if(n!=='locked')add('joao-rescue','O rastro de João','Marta',rescued,[
  ['Investigar o acampamento de Itaúna',n!=='road'],['Derrotar a Mãe-Tecelã',p.cleared?.includes('cave-queen')],['Libertar João',rescued]
 ]);
 if(['fort',...NILO_RECOVERED].includes(n))add('joao-letter','A carta da Pedra Negra','João',['done',...NILO_CITY].includes(n),[
  ['Derrotar o Capitão da Pedra Negra',p.cleared?.includes('fort-captain')],['Recuperar a bolsa com a carta',p.niloLetter],['Guardar o contrato e as ordens',p.niloEvidence],['Entregar a bolsa e as provas a João',false]
 ]);
 if(NILO_CITY.includes(n))add('itavera-letter','A denúncia chega a Itavera','João',['invitation','complete'].includes(n),[
  ['Viajar com a caravana a Itavera',p.area==='itavera'],['Entregar a denúncia a Helena',false]
 ]);
 if(n==='complete')add('itajuba-invitation','Uma oportunidade conquistada','João',true,[['Aceitar o convite para o Vale de Itajuba',true]]);
 return out;
}
