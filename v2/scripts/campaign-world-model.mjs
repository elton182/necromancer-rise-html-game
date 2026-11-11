import {normalizeVillageQuests} from './quest-model.mjs';
// Mundo contínuo de Jacarandá. Coordenadas compartilhadas pelo mapa, HUD e encontros.
import {isArea,ITAUNA_QUEST_GROUPS} from './itauna-model.mjs';
import {normalizeNilo,niloReady,NILO_POINTS,NILO_RECOVERED,NILO_CITY} from './nilo-model.mjs';
export const WORLD_SIZE=360;
// Passagens para outras áreas. A estrada fica fora de WORLD_ROUTES: aquela lista alimenta o sorteio da mata, e mudá-la trocaria os ids que as edições do mapa usam.
export const WORLD_ROAD_ITAUNA=[[90,74],[112,84],[140,92],[176,96]];
export const WORLD_EXITS=[{id:'road-itauna',x:174,y:96,r:3.4,to:'itauna',entry:'west',name:'Várzea de Itaúna'}];
// `village`: chegada do teleporte de volta, na praça (o mesmo ponto do abrigo).
export const WORLD_ARRIVALS={itauna:{x:166,y:95},village:{x:60,y:64}};
export const WORLD_POINTS={
 crypt:{x:-98,y:-86,name:'Cripta Esquecida'},
 exit:{x:-60,y:-86,name:'Saída da cripta'},
 forest:{x:-36,y:-36,name:'Bosque dos Vigias'},
 village:{x:60,y:64,name:'Vila de Jacarandá'},
 child:{x:60,y:61,name:'Lili, a criança'},
 prison:{x:80,y:-36,name:'Posto em ruínas'},
 mayor:{x:64,y:64,name:'Joaquim, o prefeito'},
 mine:{x:30,y:-146,name:'Mina de Valfundo'},
 forge:{x:52,y:71,name:'Forja de Jacarandá'},
 mill:{x:-104,y:126,name:'Serraria do Vale'},
 graveyard:{x:142,y:30,name:'Cemitério antigo'}
};
// Pilhas de madeira da Serraria do Vale; cada uma tem seu grupo de guardas.
export const WORLD_PILES=[
 {key:'pile-0',x:-132,y:108,guard:'mill-a',name:'Pilha do barracão'},
 {key:'pile-1',x:-104,y:150,guard:'mill-b',name:'Pilha do riacho'},
 {key:'pile-2',x:-76,y:126,guard:'mill-c',name:'Pilha da serra'}
];
export const WORLD_ROUTES={
 village:[[-60,-86],[-48,-64],[-36,-36],[0,-24],[24,0],[56,24],[60,64]],
 rescue:[[60,64],[60,32],[58,8],[68,-12],[76,-28],[80,-36]],
 mine:[[68,-12],[54,-46],[44,-84],[36,-116],[30,-146]],
 mill:[[60,64],[50,74],[30,78],[-10,96],[-60,112],[-104,126]],
 graveyard:[[60,64],[66,74],[90,74],[112,52],[142,30]]
};
// `mix`: tipos do grupo (índices de inimigo). `quest`: não volta depois de derrotado. `wave`: escala de atributos e itens.
export const WORLD_ENCOUNTERS=[
 {id:'forest-a',x:-48,y:-64,count:2,type:0,mix:[0,0],wave:1},
 {id:'forest-b',x:0,y:-24,count:3,type:0,mix:[0,1,0],wave:1},
 {id:'outpost-road',x:64,y:-5,count:2,type:0,mix:[0,1],wave:1},
 {id:'prison-guards',x:76,y:-29,count:3,type:0,mix:[0,1,0],wave:2,quest:true},
 {id:'forest-hounds',x:30,y:4,count:2,type:4,mix:[4,4],wave:1},
 {id:'west-ruins',x:-35,y:0,count:3,type:1,mix:[1,3,0],wave:2},
 {id:'north-ring',x:10,y:-50,count:2,type:6,mix:[6,6],wave:2},
 {id:'old-camp',x:-50,y:-15,count:3,type:0,mix:[0,0,1],wave:2},
 {id:'mine-road-a',x:52,y:-58,count:3,type:4,mix:[4,4,4],wave:2},
 {id:'mine-road-b',x:40,y:-100,count:3,type:6,mix:[6,9,6],wave:3},
 {id:'mine-guards',x:30,y:-132,count:4,type:10,mix:[10,6,9,1],wave:3,leader:'magic',quest:true},
 {id:'mill-road-a',x:-10,y:96,count:2,type:8,mix:[8,8],wave:2},
 {id:'mill-road-b',x:-60,y:112,count:3,type:7,mix:[7,0,1],wave:2},
 {id:'mill-a',x:-128,y:104,count:3,type:8,mix:[8,8,8],wave:3,quest:true},
 {id:'mill-b',x:-104,y:144,count:3,type:7,mix:[7,1,1],wave:3,quest:true},
 {id:'mill-c',x:-80,y:122,count:3,type:10,mix:[10,0,0],wave:3,leader:'magic',quest:true},
 {id:'graveyard',x:138,y:30,count:4,type:3,mix:[3,3,0,0],wave:4,leader:'rare'},
 {id:'wild-nw',x:-142,y:-22,count:2,type:4,mix:[4,4],wave:2},
 {id:'wild-w',x:-140,y:46,count:2,type:7,mix:[7,7],wave:3},
 {id:'wild-se',x:120,y:126,count:3,type:8,mix:[8,8,0],wave:3},
 {id:'wild-ne',x:132,y:-100,count:2,type:10,mix:[10,6],wave:3}
];
export const WORLD_STAGES=['wake','village','rescue','return','complete'];
const QUEST_GROUPS=[...WORLD_ENCOUNTERS.filter(e=>e.quest&&e.id!=='prison-guards').map(e=>e.id),...ITAUNA_QUEST_GROUPS];
export function normalizeWorld(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const stage=WORLD_STAGES.includes(raw.stage)?raw.stage:'wake',done=stage==='complete';
 const quests=normalizeVillageQuests(raw,done);
 const piles=WORLD_PILES.map((p,i)=>Array.isArray(raw.piles)&&raw.piles[i]===1?1:0);
 // `area`/`entry`: última passagem usada fora do mundo de Jacarandá; ausentes nos saves anteriores, que continuam no mundo.
 // `nilo`: etapa de O rastro de João; ausente equivale a `locked`, como nos saves anteriores.
 const nilo=done?normalizeNilo(raw.nilo):'locked';
 const recovered=NILO_RECOVERED.includes(nilo),fort=nilo==='fort';
 return {...quests,...(raw.passengerMissing===true?{passengerMissing:true}:{}),...(nilo!=='locked'?{nilo}:{}),...((recovered||fort&&raw.niloLetter===true)?{niloLetter:true}:{}),...((recovered||fort&&raw.niloEvidence===true)?{niloEvidence:true}:{}),...(isArea(raw.area)&&(raw.area!=='itavera'||NILO_CITY.includes(nilo))?{area:raw.area,entry:typeof raw.entry==='string'?raw.entry.slice(0,16):''}:{}),stage,checkpoint:stage==='wake'?'crypt':'village',guardsCleared:!!raw.guardsCleared||['return','complete'].includes(stage),piles,
  cleared:Array.isArray(raw.cleared)?[...new Set(raw.cleared.filter(id=>QUEST_GROUPS.includes(id)))]:[]};
}
export const inWorldVillage=p=>p.x>=34&&p.x<=86&&p.y>=36&&p.y<=98;
export function worldRegion(p){
 if(inWorldVillage(p))return 'Vila de Jacarandá';
 if(p.x<-56&&p.x>-116&&p.y<-64&&p.y>-108)return 'Cripta Esquecida';
 if(p.y<-112&&p.x>-10&&p.x<80)return 'Mina de Valfundo';
 if(p.x>55&&p.y<0&&p.y>-55)return 'Posto em ruínas';
 if(p.x<-60&&p.y>86)return 'Serraria do Vale';
 if(p.x>110&&p.y>0&&p.y<70)return 'Cemitério antigo';
 return 'Bosque dos Vigias';
}
const pilesLeft=progress=>WORLD_PILES.filter((p,i)=>!progress.piles?.[i]);
// Objetivos ativos, na ordem em que o painel mostra. O primeiro guia a bússola.
export function worldObjectives(progress){
 const stage=progress?.stage||'wake';
 if(stage!=='complete')return [{
  wake:{title:'Encontre abrigo',text:'Saia da cripta e siga a trilha até Jacarandá. WASD move; clique lança Tiro de Osso.',target:WORLD_POINTS.village},
  village:{title:'Uma voz entre as ruínas',text:'Aproxime-se da criança na praça e pressione G.',target:WORLD_POINTS.child},
  rescue:{title:'Resgate o prefeito',text:progress.guardsCleared?'Os guardas caíram. Fale com Joaquim no posto em ruínas.':'Siga a trilha ao norte da vila. Derrote os três guardas e fale com o prefeito.',target:WORLD_POINTS.prison},
  return:{title:'Um começo para Jacarandá',text:'Joaquim voltou pelo atalho. Retorne à praça e fale com ele para concluir o resgate.',target:WORLD_POINTS.mayor}
 }[stage]];
 const out=[],nilo=niloWorldObjective(progress);if(nilo?.lead)out.push(nilo);
 if(progress.smith==='active')out.push({title:'O ferreiro de Jacarandá',text:progress.cleared?.includes('mine-guards')?'A mina está livre. Fale com Bruno na entrada da Mina de Valfundo.':'Bruno se escondeu na Mina de Valfundo, ao norte do posto. Derrote o bando que tomou a mina.',target:WORLD_POINTS.mine});
 if(progress.smith==='found')out.push({title:'O ferreiro de Jacarandá',text:'Bruno voltou à vila. Fale com ele na frente da ferraria, na rua a oeste da praça.',target:WORLD_POINTS.forge});
 if(progress.lumber==='active'){const left=pilesLeft(progress),n=WORLD_PILES.length-left.length;out.push(left.length?{title:'Madeira para Jacarandá',text:`Marque as pilhas da Serraria do Vale, a sudoeste (${n}/${WORLD_PILES.length}). Cada pilha tem guardas.`,target:left[0]}:{title:'Madeira para Jacarandá',text:'As três pilhas estão marcadas. Volte à praça e avise Joaquim.',target:WORLD_POINTS.mayor});}
 if(nilo&&!nilo.lead)out.push(nilo);
 if(!out.length&&progress.questFlow===1&&progress.nilo!=='complete'){
  const target=progress.smith==='available'||progress.lumber==='available'?WORLD_POINTS.mayor:progress.nilo==='rescued'||['done','itavera','invitation'].includes(progress.nilo)?NILO_POINTS.nilo:niloReady(progress)?NILO_POINTS.marta:WORLD_POINTS.village;
  return [{title:'Missões em Jacarandá',text:'Procure os NPCs com ! para conhecer e aceitar o próximo pedido. As missões aceitas aparecem aqui e no inventário.',target}];
 }
 if(!out.length)out.push(progress.nilo==='complete'?{title:'Ato I · Além das Muralhas concluído',text:'Helena recebeu a denúncia e você aceitou o convite de João. A viagem do Ato II ainda não está disponível; explore as regiões do Ato I.',target:WORLD_POINTS.village}:{title:'Jacarandá se reergue',text:'Bruno reabriu a forja e a madeira está a caminho. Explore os arredores; novas histórias virão.',target:WORLD_POINTS.village});
 return out;
}
export const worldObjective=progress=>worldObjectives(progress)[0];
// O rastro de João no mundo de Jacarandá. `lead`: guia a bússola (missão em curso ou oferta pronta); senão, fica depois dos pedidos de Joaquim.
const ROAD=WORLD_EXITS[0];
function niloWorldObjective(p){
 const stage=p.nilo||'locked';
 if(stage==='locked'){
  if(p.questFlow!==1&&niloReady(p))return {lead:true,questId:'joao-rescue',title:'O rastro de João',text:'Jacarandá voltou a respirar. Marta tem notícias de João: fale com ela na praça.',target:NILO_POINTS.marta};
  return p.questFlow!==1&&p.passengerMissing?{title:'O passageiro desaparecido',text:'João foi levado pelos bandidos. A lista da caverna prova que era o alvo. Ajude Joaquim a reacender a forja e trazer a madeira; depois, Marta vai atrás do rastro.',target:WORLD_POINTS.village}:null;
 }
 if(stage==='road')return {lead:true,questId:'joao-rescue',title:'O rastro de João',text:'Siga a estrada leste, depois do cemitério, até a Várzea de Itaúna. O acampamento dos saqueadores fica além da ponte do Rio Turvo.',target:ROAD};
 if(stage==='cave')return {lead:true,questId:'joao-rescue',title:'O rastro de João',text:'João escapou perto do vau e seus rastros entram na Gruta das Tecelãs. Siga pela estrada leste.',target:ROAD};
 if(stage==='fort')return {lead:true,questId:'joao-letter',title:'A carta e a Pedra Negra',text:'Recupere a bolsa de João e as ordens do capitão no Forte da Pedra Negra, na Várzea de Itaúna.',target:ROAD};
 if(stage==='return')return {lead:true,questId:'joao-letter',title:'A denúncia recuperada',text:'Leve a bolsa com a carta e as provas a João, na praça de Jacarandá.',target:NILO_POINTS.nilo};
 if(p.questFlow!==1&&['done','itavera','invitation'].includes(stage))return {lead:true,title:'A caminho de Itavera',text:'Fale com João para viajar com a caravana. A denúncia deve chegar a Helena, do Conselho das Guildas.',target:NILO_POINTS.nilo};
 return null;
}
