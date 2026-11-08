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
 const nilo=niloAreaObjective(id,progress),base=placeObjectives(id,progress);
 return nilo?[nilo,...base]:base;
}
// O rastro de João na área: vem antes dos objetivos de exploração e guia a bússola.
function niloAreaObjective(id,progress){
 const stage=progress?.nilo,done=g=>progress?.cleared?.includes(g);
 if(!['road','cave','fort','return'].includes(stage))return null;
 if(id==='itauna'){
  if(stage==='road')return {title:'O rastro de João',text:'Atravesse a ponte e tome o acampamento dos saqueadores, a nordeste. Derrote o bando do centro e examine o livro de contas (G).',target:NILO_POINTS.ledger};
  if(stage==='cave')return {title:'O rastro de João',text:'João foi levado à Gruta das Tecelãs. Cruze o vau ou siga a estrada leste até a boca da gruta, a sudeste.',target:ITAUNA_POINTS.caveMouth};
  if(stage==='fort')return {title:'O contrato da Pedra Negra',text:'Suba a encosta até o portão do Forte da Pedra Negra, a nordeste. O contrato está com o capitão.',target:ITAUNA_POINTS.fortGate};
  return {title:'O contrato da Pedra Negra',text:'Você tem o contrato. Volte a Jacarandá pela estrada oeste e leve-o a João.',target:ITAUNA_POINTS.entrance};
 }
 if(id==='itauna-cave'){
  if(stage==='road'||stage==='cave')return done('cave-queen')?{title:'João nas teias',text:'A Mãe-Tecelã caiu. Corte o casulo no fundo da câmara e liberte João (G).',target:NILO_POINTS.cocoon}:{title:'João nas teias',text:'Um prisioneiro foi deixado na câmara da Mãe-Tecelã, a noroeste. Derrote-a para cortar o casulo.',target:NILO_POINTS.cocoon};
  return {title:'O contrato da Pedra Negra',text:stage==='fort'?'João está livre. Saia da gruta e siga ao Forte da Pedra Negra.':'Volte a Jacarandá e leve o contrato a João.',target:CAVE_POINTS.exit};
 }
 if(id==='itauna-fort'){
  if(stage==='fort'){
   if(!gateOpen(FORT_GATE,progress?.cleared))return {title:'O contrato da Pedra Negra',text:'O contrato está na mesa do capitão, diante da torre. Tome o pátio externo para a grade interna subir.',target:FORT_POINTS.inner};
   return done('fort-captain')?{title:'O contrato da Pedra Negra',text:'O capitão caiu. Examine a mesa diante da torre de menagem (G).',target:NILO_POINTS.contract}:{title:'O contrato da Pedra Negra',text:'Derrote o Capitão da Pedra Negra; o contrato está na mesa atrás dele.',target:NILO_POINTS.contract};
  }
  return {title:'O rastro de João',text:stage==='return'?'Volte a Jacarandá e leve o contrato a João.':stage==='cave'?'João não está no forte: o livro diz que foi levado à Gruta das Tecelãs, a sudeste da várzea.':'João não está no forte. O livro dos saqueadores, no acampamento, pode dizer para onde o levaram.',target:FORT_POINTS.gate};
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
