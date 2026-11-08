// Fatos persistentes da abertura. Posições, diálogos e flecha são transitórios.
export const PROLOGUE_STAGES=['travel','ambush','farewell','fall','cave','trail','defense','reunion','done'];
export function normalizePrologue(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 return {stage:PROLOGUE_STAGES.includes(raw.stage)?raw.stage:'travel',introRead:raw.introRead!==false,clue:raw.clue===true,caveCleared:raw.caveCleared===true,caveHeard:raw.caveHeard===true||raw.clue===true||raw.caveCleared===true};
}
export const PROLOGUE_INTRO=[
 'Arandu é um mundo de magia, reinos antigos e terras que os homens jamais conseguiram domar. Além das muralhas, monstros rondam as florestas, ruínas guardam segredos e nenhuma estrada é inteiramente segura.',
 'Em Ferrabrás, o poder se sustenta no ferro e nos exércitos. Em Alvorada, a coroa e a fé ditam quem pode exercer a magia. Seus reis prometem proteção, mas a segurança das cidades tem um preço — quase sempre pago por quem menos possui.',
 'Entre os interesses das coroas, Itavera permanece uma cidade livre. Suas guildas vivem do comércio, suas portas recebem gente de toda parte e suas caravanas atravessam caminhos que poucos ousam percorrer. Para quem sabe lutar, nunca falta trabalho.',
 'Você é um aventureiro que deixou sua cidade em busca de fama, riqueza e poder. Longe de casa e ainda sem um nome conhecido, acaba de conseguir seu primeiro contrato: escoltar uma caravana até Itavera, com uma parada na vila de Jacarandá.',
 'Por enquanto, tudo parece simples. Proteger os viajantes. Receber o pagamento. Encontrar o próximo trabalho. Ao som das rodas sobre a estrada, sua história começa.'
];
export const PROLOGUE_TEXT={
 travel:[
  ['Marta','Ah, então você é quem a caravana contratou para a proteção? Tem certeza de que dá conta? Parece um novato.','marta'],
  ['João','Marta… Você vai assustar a nossa proteção antes mesmo de chegarmos a Itavera.','nilo'],
  ['Marta','Estou só perguntando! Da última vez, o sujeito prometeu enfrentar um ogro. Fugiu quando ouviu um lobo.','marta'],
  ['João','Deixe {player} em paz. Se veio de tão longe por esse contrato, deve saber se virar.','nilo'],
  ['Marta','É o que eu espero. Primeiro Jacarandá, uma cama de verdade… Depois, as muralhas de Itavera.','marta'],
  ['Cocheiro','Ô! Esperem… Tem alguma coisa bloqueando a estrada!','driver'],
  ['Cocheiro','Ei, {player}! Você precisa ver isso.','driver']
 ],
 farewell:[['Marta','Você conseguiu! Os passageiros estão bem. Vamos tirar as carroças daqui.'],['João','Obrigado. Eu… Cuidado! Na encosta!']],
 cave:[
  ['Sob a estrada','Por um instante, só existe o som da sua respiração. A poeira arranha a garganta. Muito acima, uma faixa de luz revela o buraco por onde você caiu. Não há como subir por ali.'],
  ['Você','Ainda consigo me mexer… Ótimo começo para o primeiro trabalho. Marta? Alguém está me ouvindo?'],
  ['Uma luz adiante','Nenhuma resposta. O ruído das rodas se perde ao longe. O ar corre por uma passagem entre as pedras. Há rastros de animais e teias nas galerias. Se eu seguir adiante, talvez encontre outra saída.']
 ],
 cave_whispers:[
  ['Uma voz entre as pedras','Você ouviu isso? Veio da passagem velha. Eu disse que aquela estrada ia ceder.'],
  ['Outra voz','Esquece a estrada. O chefe quer o passageiro vivo. O resto não é problema nosso. Vigie a entrada e deixe os papéis na mesa.']
 ],
 cargo:[
  ['Carga sem dono','Símbolos de guildas diferentes foram raspados dos caixotes. Há mantimentos, ferramentas e rolos de tecido sob uma lona velha. Este depósito não foi montado para um único assalto.'],
  ['Você','Estavam esperando outras caravanas… Ou já roubaram muitas antes da nossa.']
 ],
 clue:[
  ['Ordens sobre a mesa','Ao lado de uma vela, um papel foi preso sob uma adaga. A ordem é curta: “João. Viaja com a caravana que segue para Itavera. Parada prevista em Jacarandá.”'],
  ['Uma captura encomendada','“Confirmem o nome antes de agir. O homem deve ser entregue vivo. A carga fica com o bando; o pagamento é pelo passageiro.” O trecho com a identificação do remetente foi arrancado.'],
  ['Você','João… O homem da carroça. Não era só um roubo. Preciso alcançar a caravana antes que tentem de novo.']
 ],
 cave_exit:[['Ar do lado de fora','Uma corrente de ar frio atravessa a passagem. Além das rochas, a luz do dia revela uma trilha entre as árvores. Jacarandá: foi lá que Marta disse que a caravana pararia. Ainda pode haver tempo.']],
 messenger:[['Tomás · mensageiro ferido','Você… está vindo da estrada? Eu tentava buscar ajuda em Itavera. Os bandidos estão atacando Jacarandá!'],['Tomás','Uma caravana chegou há pouco. Os guardas ficaram para ajudar. Siga esta trilha até a praça. Ainda pode dar tempo!']],
 reunion:[['Marta · reencontro','Você está vivo! Vimos a terra ceder… Não conseguimos alcançar você. Achei que tínhamos perdido mais alguém.'],['Marta','A vila resistiu, mas levaram João durante o ataque. Sabiam o nome dele. Não estavam aqui só para roubar.'],['Uma nova dívida','Você conta sobre a lista encontrada na caverna. Joaquim oferece abrigo em Jacarandá. O passageiro continua desaparecido; descobrir quem o procurava será o próximo passo.']]
};
export function travelLine(index,name='Zephyr'){
 const [speaker,text,actor]=PROLOGUE_TEXT.travel[index]||PROLOGUE_TEXT.travel[0];
 return {speaker,text:text.replaceAll('{player}',name),actor};
}
export const caveTitle=p=>p.clue?'Esconderijo dos salteadores':p.caveCleared?'Depósito dos salteadores':p.caveHeard?'Galeria ocupada':'Sob a estrada';
export function caveObjective(p){
 if(p.clue)return ['Alcance a caravana','João era o alvo. Siga a corrente de ar até a saída ao norte.'];
 if(p.caveCleared)return ['O que eles procuravam?','Examine as ordens sobre a mesa antes de deixar o esconderijo.'];
 if(p.caveHeard)return ['Vozes entre as pedras','Há bandidos nas galerias adiante. Avance com cuidado e investigue as ordens.'];
 return ['Encontre outra saída','O buraco ficou alto demais. Siga as marcas no chão e a luz das tochas.'];
}
export function prologueObjective(p){return {
 travel:['A caminho de Itavera','Converse com os viajantes antes de chegar a Jacarandá.'],
 ambush:['Proteja a caravana','Derrote os bandidos. Clique ataca, WASD move e C esquiva.'],
 farewell:['A estrada está livre','A caravana foi salva. Ouça Marta.'],
 fall:['O último disparo','Uma flecha vem da encosta…'],
 cave:caveObjective(p),
 trail:['Um pedido de socorro','Siga a trilha, derrote os perseguidores e ajude o mensageiro ferido.'],
 defense:['Defenda Jacarandá','Reencontre a caravana e derrote os bandidos que atacam a praça.'],
 reunion:['Salvamos Jacarandá','Fale com Marta sobre o passageiro desaparecido.'],
 done:['O passageiro desaparecido','João foi levado. Jacarandá agora oferece abrigo.']
 }[p.stage];}
