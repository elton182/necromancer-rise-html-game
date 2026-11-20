import {cedroStage,cedroWon,CEDRO_POINTS,CEDRO_REWARD} from './cedro-model.mjs';
import {grantExperience} from './rewards.mjs';
export function cedroCast(area,p){
 const stage=cedroStage(p);
 if(!area&&stage==='offered')return [{key:'cedro-messenger',x:65,y:70,name:'Rafael, vigia ferido',model:'npcMessenger',questMarker:'!'}];
 if(!area&&stage==='done'&&p.cleared?.includes('cedro-shortcut'))return [{key:'cedro-survivor',x:69,y:73,name:'Rosa, moradora resgatada',model:'npcMarta'}];
 if(area!=='cedro')return [];
 return [...(!p.cleared.includes('cedro-shortcut')?[{key:'cedro-prisoners',...CEDRO_POINTS.prisoners,name:'Rosa e os moradores',model:'npcMarta',questMarker:'!'}]:[]),
 ...(!p.cleared.includes('cedro-fuel')?[{key:'cedro-fuel',...CEDRO_POINTS.supplies,name:'Estoque incendiário',questMarker:'!'}]:[])];
}
export function cedroDialogue(key,p){
 const stage=cedroStage(p);
 if(key==='cedro-messenger')return {title:'Rafael — o ultimato de Bento',text:'Os homens de Bento Ferraz fecharam o Passo do Cedro. Eu o vi diante das tropas. Ele exige João, a carta e o contrato. Se a vila os esconder, atacará Jacarandá. Já estão levando combustível para o acampamento. Avise João; precisamos agir antes da marcha.'};
 if(key==='cedro-survivor')return {title:'Rosa — de volta à vila',text:'Os outros já encontraram suas famílias. Joaquim nos recebeu e João está ajudando os feridos. Obrigada por voltar por nós.'};
 if(key==='nilo'&&p.nilo==='done'){
  if(stage==='offered')return {title:'João — Jacarandá cercada',text:'Rafael chegou ferido. Bento Ferraz reuniu os bandidos no Passo do Cedro e exige a mim e às provas. Ele comandava o capitão da Pedra Negra. Não entregaremos a vila nas mãos dele. Ficarei com Joaquim, organizando a defesa e protegendo os documentos. Atravesse os bloqueios e derrube o comando antes que ataquem. Sem Bento, o cerco se desfaz.',action:'Aceitar missão — Romper o Cerco',kind:'cedro-accept'};
  if(stage==='active'&&!cedroWon(p))return {title:'João — romper o cerco',text:'A defesa está sendo preparada. Eu e as provas ficaremos aqui. Rafael marcou a estrada para o Passo do Cedro. Silencie a corneta, destrua o estoque incendiário e ajude os moradores se puder. Esses golpes enfraquecerão a defesa de Bento.',action:'Seguir para o Passo do Cedro',kind:'cedro-travel'};
  if(stage==='return'||cedroWon(p)&&stage!=='done')return {title:'João — o cerco foi rompido',text:'Os vigias confirmaram: as tropas se dispersaram. Joaquim abriu as casas para os resgatados e a vila está segura. Nas ordens de Bento há pagamentos com o mesmo selo raspado da Pedra Negra. Ele recebia dinheiro para recuperar as provas e silenciar testemunhas. Levaremos esses registros a Helena. Agora podemos concluir a viagem a Itavera.',action:`Concluir Romper o Cerco — ${CEDRO_REWARD.gold} ouro e ${CEDRO_REWARD.xp} XP`,kind:'cedro-finish'};
 }
 if(key==='cedro-prisoners')return p.cleared.includes('cedro-prisoners')?{title:'Rosa — uma passagem esquecida',text:'Bento nos obrigava a abrir caminho para as carroças. Há um portão lateral a oeste do acampamento. Conheço a tranca; deixaremos a passagem aberta e voltaremos a Jacarandá pelo bosque.',action:'Libertar os moradores e abrir o atalho',kind:'cedro-free'}:{title:'Moradores capturados',text:'Derrote os captores para libertar os moradores. Eles conhecem uma entrada lateral do acampamento.'};
 if(key==='cedro-fuel')return p.cleared.includes('cedro-supplies')?{title:'Estoque incendiário',text:'Os guardas caíram. Inutilize o combustível para impedir os ataques incendiários da defesa final.',action:'Destruir o combustível',kind:'cedro-fuel'}:{title:'Estoque incendiário',text:'Tome o depósito antes de destruir o combustível. Isso impedirá os ataques incendiários de Bento.'};
 return null;
}
export function cedroAction(s,kind){
 const p=s.save.campaign.world,area=s.world.adventure?.area,stage=cedroStage(p);
 if(kind==='cedro-accept'&&!area&&p.nilo==='done'&&stage==='offered')p.cedro='active';
 else if(kind==='cedro-travel'&&!area&&stage==='active')s.world.areaTravel={to:'cedro',entry:'village',name:'Passo do Cedro'};
 else if(kind==='cedro-free'&&area==='cedro'&&p.cleared.includes('cedro-prisoners')&&!p.cleared.includes('cedro-shortcut'))p.cleared.push('cedro-shortcut');
 else if(kind==='cedro-fuel'&&area==='cedro'&&p.cleared.includes('cedro-supplies')&&!p.cleared.includes('cedro-fuel'))p.cleared.push('cedro-fuel');
 else if(kind==='cedro-finish'&&!area&&stage!=='done'&&cedroWon(p)){
  p.cedro='done';s.save.character.gold+=CEDRO_REWARD.gold;grantExperience(s,CEDRO_REWARD.xp);
 }else return false;
 return true;
}
