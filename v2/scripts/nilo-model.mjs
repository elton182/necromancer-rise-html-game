// O rastro de João: missão que liga Jacarandá, a Várzea de Itaúna, a Gruta das Tecelãs e o Forte da Pedra Negra.
// Regras puras e sem dependências (os modelos do mundo e da várzea importam daqui): etapas, pontos, grupos exigidos e prêmios.
// `locked`: ainda não aceita. `road`: rumo ao acampamento da várzea. `cave`: João está na gruta. `fort`: João voltou à vila; falta o contrato no forte.
// `return`: levar o contrato a João, na praça. `done`: concluída.
export const NILO_STAGES=['locked','road','cave','fort','return','done'];
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
 contract:{x:0,y:-34,name:'Mesa do capitão'}
};
// Grupos de que cada etapa depende. O do acampamento renasce como os demais da várzea; basta vencê-lo na saída atual.
export const NILO_GROUPS={camp:'camp-inner',cave:'cave-queen',fort:'fort-captain'};
// Prêmios únicos de cada trecho. Valores iniciais, sem passagem pelo simulador.
export const NILO_REWARDS={rescue:{gold:150,xp:350},contract:{gold:200,xp:500},done:{gold:250,xp:700}};
