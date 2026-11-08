// O rastro de João: quem aparece em cada lugar, o que diz e o que cada ação muda no progresso.
// Etapas, pontos e prêmios ficam em nilo-model.mjs; o mundo contínuo (campaign-world.mjs) chama estas funções. Sem DOM nem Three.js.
import {NILO_POINTS,NILO_GROUPS,NILO_REWARDS,niloReady} from './nilo-model.mjs';
import {grantExperience} from './rewards.mjs';

export const NILO_KEYS=new Set(['marta','nilo','nilo-ledger','nilo-cocoon','nilo-contract']);
const stageOf=p=>p?.nilo||'locked';
// `place`: 'world' para Jacarandá ou o id da área. Pontos sem `model` são só marcadores de interação.
export function niloCast(place,p){
 const stage=stageOf(p),out=[];
 if(place==='world'){
  if(p?.passengerMissing)out.push({key:'marta',...NILO_POINTS.marta,name:'Marta, da caravana',model:'npcLysa',visualScale:1});
  if(['fort','return','done'].includes(stage))out.push({key:'nilo',...NILO_POINTS.nilo,name:'João, o passageiro',model:'npcBram',visualScale:1});
 }else if(place==='itauna'&&stage==='road')out.push({key:'nilo-ledger',...NILO_POINTS.ledger});
 // João já está na gruta quando a busca começa: quem chega antes de ler o livro também pode libertá-lo.
 else if(place==='itauna-cave'&&['road','cave'].includes(stage))out.push({key:'nilo-cocoon',...NILO_POINTS.cocoon,name:'Prisioneiro no casulo',model:'npcBram',visualScale:1});
 else if(place==='itauna-fort'&&stage==='fort')out.push({key:'nilo-contract',...NILO_POINTS.contract});
 return out;
}
const prize=r=>r.gold+' ouro e '+r.xp+' XP';
// `run`: grupos vencidos nesta saída (o do acampamento renasce). `cleared`: grupos permanentes já derrotados.
export function niloDialogue(key,p,{run=new Set()}={}){
 const stage=stageOf(p),cleared=id=>p?.cleared?.includes(id);
 if(key==='marta'){
  if(stage==='locked')return niloReady(p)?{title:'Marta · o rastro de João',text:'Jacarandá voltou a respirar, e eu não consigo dormir. Tomás viu quem levou João: capas escuras e um estandarte com uma pedra negra. Seguiram pela estrada leste, para a Várzea de Itaúna. Dizem que saqueadores acampam além da ponte do Rio Turvo. Comece por eles.',action:'Aceitar · seguir o rastro de João',kind:'nilo-accept'}
   :{title:'Marta, da caravana',text:'Ainda não sei por onde começar a procurar João. Ajude Joaquim a reacender a forja e trazer a madeira; enquanto isso, pergunto a cada viajante que passa pela praça.'};
  if(stage==='road')return {title:'Marta',text:'A estrada para a Várzea sai a leste, depois do cemitério. Cuidado: lá fora tudo é mais perigoso que nos arredores de Jacarandá.'};
  if(stage==='cave')return {title:'Marta',text:'Na gruta das aranhas? Então ainda está vivo. Vá logo; João não aguenta muito tempo naquele escuro.'};
  if(stage==='fort')return {title:'Marta',text:'Você o trouxe de volta. Ele não quis me contar o que os bandidos queriam, só falou de um papel no forte. Se é isso que vai acabar com a caçada, traga esse papel.'};
  if(stage==='return')return {title:'Marta',text:'João está ali, perto do poço. Mostre a ele o que encontrou.'};
  return {title:'Marta',text:'Ele ainda não disse o que aquele selo significa. Vou ficar de olho nele, e em quem perguntar por ele na estrada.'};
 }
 if(key==='nilo'){
  if(stage==='fort')return {title:'João · Jacarandá',text:'O Capitão da Pedra Negra guarda o contrato, na mesa diante da torre de menagem. A grade do pátio interno só sobe depois que o pátio de fora cair. Sem esse papel, quem me quer vivo vai mandar outro bando.'};
  if(stage==='return')return {title:'João · o contrato',text:'João passa o polegar sobre o selo partido, onde ainda se vê parte de uma torre. Fica em silêncio por um tempo. “Eu conheço essa torre. Não aqui, e não ainda. Você atravessou a várzea por um passageiro que mal conhecia. Fique com o que tenho, por enquanto.”',action:'Entregar o contrato · '+prize(NILO_REWARDS.done),kind:'nilo-done'};
  return {title:'João',text:'Ainda não posso dizer o que aquela torre significa. Quando puder, você vai saber antes de qualquer um.'};
 }
 if(key==='nilo-ledger'){
  if(!run.has(NILO_GROUPS.camp))return {title:'Livro de contas dos saqueadores',text:'O livro está numa caixa no centro do acampamento, e o bando ainda guarda o lugar. Derrote os saqueadores do centro antes de revirar as caixas.'};
  return {title:'Livro de contas dos saqueadores',text:'Entre dívidas e rações, uma linha recente: “Passageiro da caravana entregue aos homens da Pedra Negra. Pago em prata.” Logo abaixo, outra mão: “Tentou fugir na travessia do vau. Levado à gruta das Tecelãs até o capitão decidir. As aranhas vigiam melhor que nós.”',action:'Seguir para a Gruta das Tecelãs',kind:'nilo-ledger'};
 }
 if(key==='nilo-cocoon'){
  if(!cleared(NILO_GROUPS.cave))return {title:'Prisioneiro no casulo',text:'No fundo da câmara, uma silhueta presa em teias se mexe e geme. Enquanto a Mãe-Tecelã guardar a câmara, não há como cortar o casulo.'};
  return {title:'João · Gruta das Tecelãs',text:'A teia cede e João cai de joelhos, tossindo. “Você… Vi a terra engolir você na estrada. Achei que estava morto.” Respira fundo. “Não queriam resgate. O Capitão da Pedra Negra guarda um contrato com o selo de quem me quer vivo. Enquanto esse papel existir, vão voltar por mim, e por Jacarandá. Volto para a vila pela estrada; Marta deve estar lá. Traga esse contrato.”',action:'Libertar João · '+prize(NILO_REWARDS.rescue),kind:'nilo-rescue'};
 }
 if(key==='nilo-contract'){
  if(!cleared(NILO_GROUPS.fort))return {title:'Mesa do capitão',text:'Um baú pesado e um tinteiro sobre a mesa. O capitão e sua guarda ainda estão diante da torre.'};
  return {title:'Contrato da Pedra Negra',text:'Sob o tinteiro, um pergaminho dobrado: o passageiro João deve ser entregue vivo e sem marcas, em Itavera, antes da lua nova. O pagamento foi adiantado. O nome do contratante foi raspado a faca; resta metade de um selo de cera, com parte de uma torre.',action:'Guardar o contrato · '+prize(NILO_REWARDS.contract),kind:'nilo-contract'};
 }
 return null;
}
const NEXT={'nilo-accept':['locked','road'],'nilo-ledger':['road','cave'],'nilo-rescue':[['road','cave'],'fort'],'nilo-contract':['fort','return'],'nilo-done':['return','done']};
const PAID={'nilo-rescue':NILO_REWARDS.rescue,'nilo-contract':NILO_REWARDS.contract,'nilo-done':NILO_REWARDS.done};
export const isNiloAction=kind=>Object.hasOwn(NEXT,kind);
// Avança a etapa e paga o prêmio uma única vez: a ação só vale a partir da etapa esperada.
export function niloAction(s,kind){
 const p=s.save.campaign.world,step=NEXT[kind];if(!step)return false;
 const from=[step[0]].flat();if(!from.includes(stageOf(p)))return false;
 p.nilo=step[1];const r=PAID[kind];if(r){s.save.character.gold+=r.gold;grantExperience(s,r.xp);}
 return true;
}
