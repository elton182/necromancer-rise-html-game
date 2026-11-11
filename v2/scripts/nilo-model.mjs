// O rastro de João: missão que liga Jacarandá, a Várzea de Itaúna, a Gruta das Tecelãs e o Forte da Pedra Negra.
// Regras puras e sem dependências (os modelos do mundo e da várzea importam daqui): etapas, pontos, grupos exigidos e prêmios.
// `locked`: ainda não aceita. `road`: acampamento. `cave`: resgate. `fort`: bolsa e provas, em qualquer ordem.
// `return`: entrega na vila. `done`: retorno local premiado. Depois: Helena, convite e conclusão do ato.
export const NILO_STAGES=['locked','road','cave','fort','return','done','itavera','invitation','complete','rescued'];
// `done` continua significando retorno a João já premiado; o epílogo vem depois.
export const NILO_RECOVERED=['return','done','itavera','invitation','complete'];
export const NILO_CITY=['itavera','invitation','complete'];
export const normalizeNilo=v=>NILO_STAGES.includes(v)?v:'locked';
// Marta só oferece a busca depois que Jacarandá se reergue: forja acesa e madeira entregue.
export const niloReady=p=>!!p?.passengerMissing&&p.stage==='complete'&&p.smith==='done'&&p.lumber==='done';
export const niloActive=p=>['road','cave','fort','return'].includes(p?.nilo);
// Pontos de interação, nas coordenadas do mapa de cada lugar. Todos livres de colisores e alcançáveis a pé (testes).
export const NILO_POINTS={
 marta:{x:56,y:62,name:'Marta'},
 nilo:{x:52,y:64,name:'João'},
 ledger:{x:78,y:-30,name:'Livro de contas dos saqueadores'},
 cocoon:{x:-44,y:-66,name:'Casulo na câmara'},
 contract:{x:0,y:-34,name:'Mesa do capitão'},
 bag:{x:44,y:-28,name:'Bolsa de João · depósito'},
 helena:{x:0,y:-12,name:'Helena · Conselho das Guildas'},
 cityJoao:{x:-5,y:-6,name:'João · emissário da coroa'},
 cityMarta:{x:6,y:9,name:'Marta · caravana em Itavera'}
};
// Grupos de que cada etapa depende. O do acampamento renasce como os demais da várzea; basta vencê-lo na saída atual.
export const NILO_GROUPS={camp:'camp-inner',cave:'cave-queen',fort:'fort-captain'};
// Prêmios únicos de cada trecho. Valores iniciais, sem passagem pelo simulador.
export const NILO_REWARDS={rescue:{gold:150,xp:350},contract:{gold:200,xp:500},done:{gold:250,xp:700}};
