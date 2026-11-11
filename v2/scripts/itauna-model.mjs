// Várzea de Itaúna: área ligada a Jacarandá por estrada, com um forte e uma gruta em mapas próprios.
import {NILO_POINTS} from './nilo-model.mjs';
// Regras puras: pontos da história, passagens entre mapas, grade do forte e objetivos. Sem DOM nem Three.js.
export const FORT_GATE={id:'fort-portcullis',x:0,y:6,width:4.8,depth:1,height:4.4,requires:['fort-gate','fort-west','fort-east']};
export const ITAUNA_POINTS={
 entrance:{x:-176,y:22,name:'Estrada de Jacarandá'},
 fortGate:{x:105,y:-77.5,name:'Portão do Forte da Pedra Negra'},
 caveMouth:{x:147,y:91,name:'Gruta das Tecelãs'},
 camp:{x:74,y:-34,name:'Acampamento dos saqueadores'},
 fishing:{x:-52,y:72,name:'Palafitas da margem'},
 islet:{x:-24,y:113,name:'Ilhota do Obelisco'},
 mirror:{x:-98,y:-62,name:'Lagoa do Espelho'},
 shrine:{x:-60,y:-70,name:'Santuário partido'},
 tower:{x:-128,y:118,name:'Atalaia velha'},
 ford:{x:7,y:48,name:'Vau do Rio Turvo'},
 bridge:{x:10,y:-4,name:'Ponte do Rio Turvo'}
};
export const FORT_POINTS={keep:{x:0,y:-30,name:'Torre de menagem'},gate:{x:0,y:69,name:'Saída do forte'},inner:{x:0,y:6,name:'Grade interna'}};
export const CAVE_POINTS={exit:{x:66,y:75,name:'Saída da gruta'},queen:{x:-40,y:-58,name:'Câmara da Mãe-Tecelã'},den:{x:8,y:52,name:'Covil dos lobos'},lake:{x:-2,y:-40,name:'Lago subterrâneo'},nursery:{x:62,y:-36,name:'Berçário'}};
// `exits`: pisar no anel leva a `to` (null é o mundo de Jacarandá) e chega em `entry`. As chegadas ficam fora dos anéis, para ninguém voltar sem querer.
export const AREAS={
 itavera:{slot:'itavera',ref:'builtin:itavera',name:'Itavera · praça das guildas',music:'village',
  entries:{caravan:{x:0,y:24}},exits:[{id:'itavera-home',x:0,y:30,r:2.5,to:null,entry:'village',name:'Caravana para Jacarandá'}]},
 itauna:{slot:'itauna',ref:'builtin:itauna',name:'Várzea de Itaúna',music:'forest',
  entries:{west:{x:-168,y:22},fort:{x:105,y:-68},cave:{x:152,y:96}},
  exits:[{id:'itauna-road',...ITAUNA_POINTS.entrance,r:3.4,to:null,entry:'itauna',name:'Estrada de Jacarandá'},{id:'itauna-fort',...ITAUNA_POINTS.fortGate,r:3.4,to:'itauna-fort',entry:'gate',name:'Forte da Pedra Negra'},{id:'itauna-cave',...ITAUNA_POINTS.caveMouth,r:2.8,to:'itauna-cave',entry:'mouth',name:'Gruta das Tecelãs'}]},
 'itauna-fort':{slot:'itaunaFort',ref:'builtin:itauna-fort',name:'Forte da Pedra Negra',music:'crypt',
  entries:{gate:{x:0,y:61}},
  exits:[{id:'fort-out',...FORT_POINTS.gate,r:3,to:'itauna',entry:'fort',name:'Várzea de Itaúna'}],gates:[FORT_GATE]},
 'itauna-cave':{slot:'itaunaCave',ref:'builtin:itauna-cave',name:'Gruta das Tecelãs',music:'crypt',
  entries:{mouth:{x:60,y:66}},
  exits:[{id:'cave-out',...CAVE_POINTS.exit,r:3,to:'itauna',entry:'cave',name:'Várzea de Itaúna'}]}
};
export const AREA_IDS=Object.keys(AREAS);
export const isArea=id=>typeof id==='string'&&Object.hasOwn(AREAS,id);
export const areaEntry=(id,entry)=>{const a=AREAS[id];return a.entries[entry]||Object.values(a.entries)[0];};
// Grupos que não voltam depois de derrotados. Os demais rearmam ao retornar à vila, como no mundo de Jacarandá.
export const ITAUNA_QUEST_GROUPS=['fort-gate','fort-west','fort-east','fort-inner-w','fort-inner-e','fort-captain','cave-queen','islet-guard'];
export const gateOpen=(gate,cleared=[])=>gate.requires.every(id=>cleared.includes(id));
export const gateSolid=g=>({kind:'box',x:g.x,y:g.y,width:g.width,depth:g.depth,height:g.height,look:'fort-gate',gateId:g.id});
// Nomes da fala do jogo: o tipo continua o mesmo (índice, regras e modelo); só o rótulo muda.
export const ITAUNA_NAMES={4:'Lobo'};
export const LEADER_NAMES={'fort-captain':'Capitão da Pedra Negra','cave-queen':'Mãe-Tecelã','islet-guard':'Guardião do Obelisco'};
const NOTICES={'fort-captain':'O capitão caiu · o Forte da Pedra Negra está livre.','cave-queen':'A Mãe-Tecelã caiu · a gruta silencia.','islet-guard':'O obelisco da ilhota está livre.'};
export const clearNotice=id=>NOTICES[id]||'';
// Sub-regiões para o título da tela: o ponto nomeado mais próximo dentro do raio, senão o nome da área.
const ZONES={itauna:[[ITAUNA_POINTS.camp,24],[ITAUNA_POINTS.fishing,20],[ITAUNA_POINTS.islet,16],[{x:-112,y:-82,name:'Lagoa do Espelho'},42],[ITAUNA_POINTS.shrine,18],[ITAUNA_POINTS.tower,22],[ITAUNA_POINTS.ford,16],[ITAUNA_POINTS.bridge,14],[{x:105,y:-58,name:'Encosta da Pedra Negra'},26],[{x:146,y:96,name:'Morro das Tecelãs'},26]],
 'itauna-fort':[[{x:0,y:-24,name:'Pátio interno'},52],[{x:0,y:36,name:'Pátio externo'},60]],
 'itauna-cave':[[CAVE_POINTS.queen,24],[CAVE_POINTS.den,24],[{x:-2,y:-22,name:'Lago subterrâneo'},28],[CAVE_POINTS.nursery,24]]};
export function areaRegion(id,p){
 let best=null,score=Infinity;for(const [point,r] of ZONES[id]||[]){const d=Math.hypot(p.x-point.x,p.y-point.y);if(d<r&&d/r<score){best=point;score=d/r;}}
 return best?.name||AREAS[id]?.name||'';
}
// Objetivos da área em que o jogador está: os alvos usam as coordenadas do próprio mapa.
export function areaObjectives(id,progress){
 if(id==='itavera'){
  if(progress?.nilo==='itavera')return [{title:'A denúncia chega a Itavera',text:'Fale com Helena, do Conselho das Guildas, e entregue a carta e as provas da Pedra Negra.',target:NILO_POINTS.helena}];
  if(progress?.nilo==='invitation')return [{title:'Uma conversa com João',text:'Helena recebeu a denúncia. João tem uma proposta: procure o ! sobre ele.',target:NILO_POINTS.cityJoao}];
  return [{title:'Ato I · Além das Muralhas concluído',text:'A escolta foi cumprida e o convite está aceito. A viagem do Ato II ainda não está disponível; volte a Jacarandá ou explore a praça.',target:AREAS.itavera.exits[0]}];
 }
 const nilo=niloAreaObjective(id,progress),base=placeObjectives(id,progress);
 return nilo?[nilo,...base]:base;
}
// O rastro de João na área: vem antes dos objetivos de exploração e guia a bússola.
function niloAreaObjective(id,progress){
 const stage=progress?.nilo,done=g=>progress?.cleared?.includes(g);
 if(stage==='rescued')return {title:'Volte a Jacarandá',text:'João voltou à praça. Converse com ele, marcado com !, para conhecer o próximo pedido.',target:id==='itauna'?ITAUNA_POINTS.entrance:id==='itauna-cave'?CAVE_POINTS.exit:FORT_POINTS.gate};
 if(!['road','cave','fort','return'].includes(stage))return null;
 if(id==='itauna'){
  if(stage==='road')return {questId:'joao-rescue',title:'O rastro de João',text:'Atravesse a ponte e tome o acampamento dos saqueadores, a nordeste. Derrote o bando do centro e examine o livro de contas (G).',target:NILO_POINTS.ledger};
  if(stage==='cave')return {questId:'joao-rescue',title:'O rastro de João',text:'João escapou dos captores e entrou na Gruta das Tecelãs. Cruze o vau ou siga a estrada leste até a boca da gruta.',target:ITAUNA_POINTS.caveMouth};
  if(stage==='fort')return {questId:'joao-letter',title:'A carta e a Pedra Negra',text:'Suba ao forte. Recupere a bolsa no depósito do pátio interno e as provas na mesa do capitão.',target:ITAUNA_POINTS.fortGate};
  return {title:'A denúncia recuperada',text:'Você tem a bolsa e as provas. Volte a Jacarandá pela estrada oeste e entregue tudo a João.',target:ITAUNA_POINTS.entrance};
 }
 if(id==='itauna-cave'){
  if(stage==='road'||stage==='cave')return done('cave-queen')?{questId:'joao-rescue',title:'João nas teias',text:'A Mãe-Tecelã caiu. Corte o casulo no fundo da câmara e liberte João (G).',target:NILO_POINTS.cocoon}:{questId:'joao-rescue',title:'João nas teias',text:'João fugiu para as galerias e foi apanhado pelas aranhas. Derrote a Mãe-Tecelã, a noroeste, para libertá-lo.',target:NILO_POINTS.cocoon};
  return {questId:'joao-letter',title:'A carta e a Pedra Negra',text:stage==='fort'?'João está livre. Saia da gruta e siga ao forte para recuperar a bolsa e as provas.':'Volte a Jacarandá e leve a bolsa e as provas a João.',target:CAVE_POINTS.exit};
 }
 if(id==='itauna-fort'){
  if(stage==='fort'){
   if(!gateOpen(FORT_GATE,progress?.cleared))return {questId:'joao-letter',title:'A carta e a Pedra Negra',text:'Tome o pátio externo para abrir a grade. A carga e as provas estão no pátio interno.',target:FORT_POINTS.inner};
   if(!done('fort-captain'))return {questId:'joao-letter',title:'Detenha a operação da Pedra Negra',text:'Derrote o capitão para impedir a nova incursão a Jacarandá e recuperar a carga.',target:FORT_POINTS.keep};
   return !progress.niloLetter?{questId:'joao-letter',title:'A bolsa de João',text:'Recupere a bolsa com a carta no depósito a leste do pátio interno (G).',target:NILO_POINTS.bag}:{questId:'joao-letter',title:'As provas da perseguição',text:'A carta está segura. Examine a mesa diante da torre para guardar o contrato e as ordens (G).',target:NILO_POINTS.contract};
  }
  return {questId:'joao-rescue',title:'O rastro de João',text:stage==='return'?'Volte a Jacarandá e leve a bolsa e as provas a João.':stage==='cave'?'João fugiu para a Gruta das Tecelãs.':'O livro dos saqueadores, no acampamento, pode dizer para onde João foi.',target:FORT_POINTS.gate};
 }
 return null;
}
function placeObjectives(id,progress){
 const done=g=>progress?.cleared?.includes(g);
 if(id==='itauna-fort'){
  if(!gateOpen(FORT_GATE,progress?.cleared))return [{title:'Tome o pátio externo',text:'A grade interna só sobe quando os três grupos do pátio caírem: portão, barracas a oeste e campo de treino a leste.',target:FORT_POINTS.inner}];
  if(!done('fort-captain'))return [{title:'O capitão da Pedra Negra',text:'A grade subiu. Atravesse o pátio interno e derrote o capitão diante da torre de menagem.',target:FORT_POINTS.keep}];
  return [{title:'Forte tomado',text:'A Pedra Negra está em silêncio. Volte à várzea pelo portão sul.',target:FORT_POINTS.gate}];
 }
 if(id==='itauna-cave'){
  if(!done('cave-queen'))return [{title:'As Tecelãs',text:'Lobos guardam as primeiras galerias e as teias engrossam a oeste. Encontre a câmara da Mãe-Tecelã.',target:CAVE_POINTS.queen}];
  return [{title:'Gruta em silêncio',text:'A Mãe-Tecelã caiu. Volte à várzea pela saída leste.',target:CAVE_POINTS.exit}];
 }
 const out=[];
 if(!done('fort-captain'))out.push({title:'Forte da Pedra Negra',text:'Atravesse a ponte, passe pelo acampamento dos saqueadores e suba a encosta até o portão, a nordeste.',target:ITAUNA_POINTS.fortGate});
 if(!done('cave-queen'))out.push({title:'Gruta das Tecelãs',text:'Cruze o vau do Rio Turvo e contorne o morro até a boca da gruta, a sudeste. Na água, você anda mais devagar.',target:ITAUNA_POINTS.caveMouth});
 if(!out.length)out.push({title:'Várzea livre',text:'Forte e gruta estão em silêncio. Explore a várzea ou volte a Jacarandá pela estrada oeste.',target:ITAUNA_POINTS.entrance});
 return out;
}
