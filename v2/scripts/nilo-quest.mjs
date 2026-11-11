// O rastro de João e o encerramento do Ato I. IDs históricos preservados para saves.
import {NILO_POINTS,NILO_GROUPS,NILO_REWARDS,NILO_RECOVERED,NILO_CITY,niloReady} from './nilo-model.mjs';
import {grantExperience} from './rewards.mjs';
export const NILO_KEYS=new Set(['marta','nilo','nilo-ledger','nilo-cocoon','nilo-contract','nilo-bag','helena','city-joao','city-marta']);
const stageOf=p=>p?.nilo||'locked';
const recovered=(p,key)=>p[key]===true||NILO_RECOVERED.includes(stageOf(p));
const prize=r=>r.gold+' ouro e '+r.xp+' XP';
export function niloCast(place,p){
 const stage=stageOf(p),out=[];
 if(place==='itavera'&&NILO_CITY.includes(stage))return [
  {key:'helena',...NILO_POINTS.helena,model:'npcTilda',visualScale:1},
  {key:'city-joao',...NILO_POINTS.cityJoao,model:'npcBram',visualScale:1},
  {key:'city-marta',...NILO_POINTS.cityMarta,model:'npcLysa',visualScale:1}
 ];
 if(place==='world'){
  if(p?.passengerMissing)out.push({key:'marta',...NILO_POINTS.marta,name:'Marta, da caravana',model:'npcLysa',visualScale:1});
  if(['rescued','fort',...NILO_RECOVERED].includes(stage))out.push({key:'nilo',...NILO_POINTS.nilo,name:'João · emissário da coroa',model:'npcBram',visualScale:1});
 }else if(place==='itauna'&&stage==='road')out.push({key:'nilo-ledger',...NILO_POINTS.ledger});
 else if(place==='itauna-cave'&&['road','cave'].includes(stage))out.push({key:'nilo-cocoon',...NILO_POINTS.cocoon,name:'Prisioneiro no casulo',model:'npcBram',visualScale:1});
 else if(place==='itauna-fort'&&stage==='fort'){
  if(!p.niloEvidence)out.push({key:'nilo-contract',...NILO_POINTS.contract});
  if(!p.niloLetter)out.push({key:'nilo-bag',...NILO_POINTS.bag});
 }
 return out;
}
export function niloDialogue(key,p,{run=new Set()}={}){
 const stage=stageOf(p),cleared=id=>p?.cleared?.includes(id);
 if(key==='marta'){
  if(stage==='locked')return niloReady(p)?{title:'Marta · o rastro de João',text:'Consegui uma pista enquanto você ajudava a vila. Tomás e dois viajantes confirmaram: os homens que levaram João seguiram para a Várzea de Itaúna. Saqueadores acampam além da ponte do Rio Turvo. Também levaram nossa carroça de mantimentos. Comece pelo acampamento.',action:'Aceitar · seguir o rastro de João',kind:'nilo-accept'}
   :{title:'Marta, da caravana',text:'Estou perguntando aos viajantes por onde levaram João. Não vou mandar você procurar às cegas. Enquanto confirmo a pista, ajude a tirar Bruno da mina e liberar a madeira para os reparos de emergência. Os bandidos também levaram nossa carroça de mantimentos.'};
  if(stage==='road')return {title:'Marta',text:'Siga a estrada leste, depois do cemitério. Procure o acampamento na Várzea de Itaúna.'};
  if(stage==='cave')return {title:'Marta',text:'João escapou e entrou na gruta? Então ainda temos uma chance. Vá atrás dele!'};
  if(stage==='rescued')return {title:'Marta',text:'João voltou em segurança. Ele quer conversar sobre a carta; procure o ! sobre ele na praça.'};
  if(stage==='fort')return {title:'Marta',text:'João contou sobre a carta e a bolsa na carroça. Ele devia ter contado o risco antes de embarcar. Mas o capitão prepara outra busca em Jacarandá. Recupere a carta e as ordens; precisamos deter esse bando.'};
  if(stage==='return')return {title:'Marta',text:'João espera perto do poço. Você recuperou a bolsa e as provas; mostre tudo a ele.'};
  return {title:'Marta',text:stage==='complete'?'O contrato da escolta foi cumprido. Agora você tem uma proposta de João para o Vale de Itajuba.':'A estrada está livre da operação do capitão. João quer retomar a viagem a Itavera e entregar a carta a Helena.'};
 }
 if(key==='nilo'){
  if(stage==='rescued')return {title:'João · a carta da Pedra Negra',text:'Consegui voltar em segurança. Agora preciso recuperar a denúncia antes que o capitão descubra onde a escondi. Minha bolsa foi levada na carroça de mantimentos; procure o depósito do pátio interno do forte. Traga também o contrato e as ordens da mesa dele. Aceita me ajudar a impedir outra incursão contra Jacarandá?',action:'Aceitar missão · A carta da Pedra Negra',kind:'nilo-letter-accept'};

  if(stage==='fort')return {title:'João · a carta escondida',text:'Sou emissário da coroa, de uma família nobre. Investigava o desaparecimento de suprimentos. A carta é uma denúncia assinada; preciso entregá-la a Helena, do Conselho das Guildas de Itavera.\n\nAntes da captura, escondi a bolsa na carroça de mantimentos. A carta está costurada no forro. Procure a carga no depósito a leste do pátio interno do forte.\n\nO capitão prepara outra busca em Jacarandá. Derrote-o, recupere a bolsa e traga as ordens da mesa dele. Não vou deixar que a vila pague outra vez pelo meu silêncio.'};
  if(stage==='return')return {title:'João · a denúncia recuperada',text:'João abre o forro da bolsa e confere a assinatura. “A carta está intacta. Este depoimento denuncia desvios de armas, alimentos e dinheiro para quem lucra com a guerra entre Eduardo e Mariana. O contrato prova que pagaram pela minha captura; as ordens mostram que o capitão voltaria a Jacarandá. Você desfez a operação local, mas os mandantes continuam livres. Helena poderá preservar essas provas. Eu devia ter contado o risco desde o início. Vou ajudar os feridos e os reparos antes de partirmos.”',action:'Entregar a bolsa e as provas · '+prize(NILO_REWARDS.done),kind:'nilo-done'};
  if(stage==='done')return {title:'João · retomar a escolta',text:'Marta preparou a caravana e deixei recursos para os cuidados e reparos da vila. Vamos concluir seu primeiro contrato: chegar a Itavera. Levarei a carta e as provas a Helena, responsável pela segurança das rotas no Conselho das Guildas. Suspeito que a denúncia seria interceptada no meu reino; por isso procurei apoio numa cidade independente.',action:'Viajar com a caravana para Itavera',kind:'nilo-travel'};
  if(stage==='complete')return {title:'João · Ato I concluído',text:'Helena recebeu a denúncia. Meu convite para investigar os desvios no Vale de Itajuba continua de pé. A viagem do Ato II ainda não está disponível; podemos continuar ajudando Jacarandá e explorando os arredores.',action:'Revisitar Itavera',kind:'nilo-travel'};
  return {title:'João',text:'Helena nos espera em Itavera. Vamos falar com ela na praça das guildas.',action:'Voltar a Itavera',kind:'nilo-travel'};
 }
 if(key==='nilo-ledger'){
  if(!run.has(NILO_GROUPS.camp))return {title:'Livro de contas dos saqueadores',text:'O bando ainda guarda as caixas no centro do acampamento. Derrote os saqueadores antes de examinar o livro.'};
  return {title:'Livro de contas dos saqueadores',text:'“Passageiro João entregue aos homens da Pedra Negra. Pagamento em prata. Carroça de mantimentos de Jacarandá enviada ao depósito do forte.” Uma nota posterior: “O prisioneiro escapou durante a parada junto ao vau. Rastros entram na Gruta das Tecelãs. O capitão exige que seja encontrado vivo. O documento não apareceu na revista.”',action:'Seguir os rastros até a gruta',kind:'nilo-ledger'};
 }
 if(key==='nilo-cocoon'){
  if(!cleared(NILO_GROUPS.cave))return {title:'Prisioneiro no casulo',text:'Uma pessoa ainda se move dentro das teias. Derrote a Mãe-Tecelã para poder libertá-la.'};
  return {title:'João · a verdade sobre a viagem',text:'“Você… eu vi a estrada ceder. Achei que tivesse morrido.” João se apoia na parede. “Escapei quando pararam perto do vau. Entrei na gruta para despistá-los e caí nas teias.”\n\n“Sou emissário da coroa, de uma família nobre. Investigo desvios que alimentam a guerra em Itajuba. Levo uma denúncia assinada a Helena, em Itavera. Eles querem a carta e os nomes de quem sabe dela.”\n\n“Escondi minha bolsa na carroça de mantimentos antes da captura. A carta está costurada no forro. Ouvi que a carga foi para o forte e que o capitão prepara outra busca na vila. Vou encontrar Marta em Jacarandá. Recupere a bolsa e as ordens dele.”',action:'Libertar João · '+prize(NILO_REWARDS.rescue),kind:'nilo-rescue'};
 }
 if(key==='nilo-bag'){
  if(!cleared(NILO_GROUPS.fort))return {title:'Depósito da carga saqueada',text:'A bolsa de viagem está entre os mantimentos da caravana. O capitão ainda comanda a guarda; derrote-o antes de recuperar a carga.'};
  return {title:'A bolsa de João',text:'Você reconhece a bolsa que João mantinha junto de si na carruagem. O forro está fechado e há um papel dobrado por dentro. Guarde-a intacta para ele conferir. Os caixotes ao redor ainda trazem as marcas da caravana.',action:'Recuperar a bolsa com a carta',kind:'nilo-bag'};
 }
 if(key==='nilo-contract'){
  if(!cleared(NILO_GROUPS.fort))return {title:'Mesa do capitão',text:'O capitão e sua guarda ainda protegem a mesa diante da torre.'};
  return {title:'Contrato e ordens da Pedra Negra',text:'O contrato exige recuperar uma carta e entregar João vivo, para descobrir quem mais conhece a denúncia. O nome do contratante foi raspado; o selo conserva parte de uma torre. Outra ordem prepara uma nova busca em Jacarandá. Registros de pagamento ligam o bando a carregamentos desviados para o Vale de Itajuba. Estas são provas da perseguição, distintas da carta na bolsa.',action:'Guardar o contrato e as ordens · '+prize(NILO_REWARDS.contract),kind:'nilo-contract'};
 }
 if(key==='helena'){
  if(stage==='itavera')return {title:'Helena · Conselho das Guildas de Itavera',text:'João entrega a carta e as provas da Pedra Negra. Helena lê o depoimento e guarda os documentos sob o selo do Conselho.\n\n“Essas cargas não desapareceram na estrada. Alguém está desviando armas, comida e dinheiro para prolongar a guerra. Aqui, a denúncia estará protegida. Vou cruzar os nomes e as rotas com nossos registros em Itajuba.”\n\n“Vocês cumpriram a escolta. E fizeram mais: impediram que este testemunho fosse silenciado.”',action:'Entregar a denúncia a Helena',kind:'nilo-deliver'};
  return {title:'Helena · provas sob proteção',text:'O depoimento e as provas estão guardados pelo Conselho. João tem uma proposta para você. Vamos investigar os carregamentos com cuidado: a disputa entre Eduardo e Mariana não se explica por um único culpado.'};
 }
 if(key==='city-joao'){
  if(stage==='invitation')return {title:'João · uma oportunidade conquistada',text:'“Você poderia ter ido embora depois do primeiro pagamento. Protegeu a caravana, ajudou Jacarandá e voltou por um passageiro que mal conhecia. Vi coragem e discernimento nas suas escolhas. Quero contratar você para me acompanhar à cidade onde começaremos a investigação no Vale de Itajuba. Será um trabalho remunerado, e desta vez vou contar os riscos. Aceita?” A próxima viagem será a campanha do Ato II; por enquanto, você pode continuar explorando as regiões do Ato I.',action:'Aceitar o convite · concluir o Ato I',kind:'nilo-finish'};
  return {title:'João · Itavera',text:stage==='complete'?'Seu primeiro contrato foi cumprido e o convite está aceito. Quando a viagem ao Vale de Itajuba estiver disponível, retomaremos a investigação. Por enquanto, podemos voltar a Jacarandá.':'Chegamos a Itavera. Helena nos espera diante da sede das guildas, ao norte da praça.'};
 }
 if(key==='city-marta')return {title:'Marta · contrato cumprido',text:'“Finalmente, Itavera! Você entregou a caravana e seus passageiros. O pagamento combinado está acertado com João. Agora vá falar com Helena; depois quero saber se você vai aceitar mais trabalho ou tirar uma noite de folga.”'};
 return null;
}
const NEXT={'nilo-accept':['locked','road'],'nilo-ledger':['road','cave'],'nilo-letter-accept':['rescued','fort'],'nilo-rescue':[['road','cave'],'fort'],'nilo-done':['return','done'],'nilo-deliver':['itavera','invitation'],'nilo-finish':['invitation','complete']};
const PAID={'nilo-rescue':NILO_REWARDS.rescue,'nilo-contract':NILO_REWARDS.contract,'nilo-done':NILO_REWARDS.done};
export const isNiloAction=kind=>Object.hasOwn(NEXT,kind)||['nilo-bag','nilo-contract','nilo-travel'].includes(kind);
export function niloAction(s,kind){
 const p=s.save.campaign.world,stage=stageOf(p),area=s.world.adventure?.area,run=s.world.adventure?.clearedRun||new Set();
 if(kind==='nilo-travel'){
  if(!['done','itavera','invitation','complete'].includes(stage)||area)return false;
  if(stage==='done')p.nilo='itavera';
  s.world.areaTravel={to:'itavera',entry:'caravan',name:'Itavera · praça das guildas'};return true;
 }
 if(kind==='nilo-bag'||kind==='nilo-contract'){
  const key=kind==='nilo-bag'?'niloLetter':'niloEvidence';
  if(stage!=='fort'||area!=='itauna-fort'||!p.cleared.includes(NILO_GROUPS.fort)||p[key])return false;
  p[key]=true;if(p.niloLetter&&p.niloEvidence)p.nilo='return';
 }else{
  const step=NEXT[kind];if(!step||![step[0]].flat().includes(stage))return false;
  if(kind==='nilo-accept'&&(!niloReady(p)||area))return false;
  if(kind==='nilo-ledger'&&(area!=='itauna'||!run.has(NILO_GROUPS.camp)))return false;
  if(kind==='nilo-rescue'&&(area!=='itauna-cave'||!p.cleared.includes(NILO_GROUPS.cave)))return false;
  if(kind==='nilo-done'&&(area||!recovered(p,'niloLetter')||!recovered(p,'niloEvidence')))return false;
  if(['nilo-deliver','nilo-finish'].includes(kind)&&area!=='itavera')return false;
  if(kind==='nilo-letter-accept'&&area)return false;
  p.nilo=kind==='nilo-rescue'&&p.questFlow===1?'rescued':step[1];
  if(kind==='nilo-finish'){s.save.horde.profile.act1=true;s.world.army.profile.act1=true;}
 }
 const r=PAID[kind];if(r){s.save.character.gold+=r.gold;grantExperience(s,r.xp);}
 return true;
}
