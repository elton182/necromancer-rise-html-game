// Árvore de talentos do Guerreiro (aba Habilidades): barra lateral com os ramos, quatro colunas de
// selos ligados por pré-requisitos, painel de detalhe e barra de XP. As regras (orçamento, limites,
// pré-requisitos e variantes) vêm de warrior-model.mjs; aqui só há apresentação e o investimento.
import {PASSIVES,warriorRanks,warriorBudget,warriorSpent,canLearn,warriorTornado,TORNADO_VARIANTS} from './warrior-model.mjs';
import {DRUID_NODES,druidRanks,druidBudget,druidSpent,canLearnDruid} from './druid-model.mjs';
import {MARKSMAN_NODES,marksmanRanks,marksmanBudget,marksmanSpent,canLearnMarksman} from './marksman-model.mjs';
import {applyAttributes,levelOf,xpNext} from './progression.mjs';
import {ensureArtDefs} from './item-icons.mjs';
// Posições: x em % da coluna, y em px. Ids preservados; os testes contam selos e ligações.
export const BRANCHES=[
 {id:'sword',name:'Espada',motto:'Precisão e impacto',color:'#d2553a',crest:'slash',nodes:[['slash',24,18],['thrust',76,18],['momentum',24,122],['tornado',76,122],['steelWave',24,226],['tornadoCyclone',76,226],['tornadoWhirl',76,330]]},
 {id:'shield',name:'Escudo',motto:'Guarda e retaliação',color:'#4f86c6',crest:'shieldDefense',nodes:[['bash',24,18],['shieldDefense',76,18],['shieldThrow',24,122],['riposte',76,122],['ricochet',24,226]]},
 {id:'passives',name:'Passivas',motto:'O corpo como fortaleza',color:'#79a446',crest:'vitality',nodes:[['strength',24,18],['vitality',76,18],['armor',24,122],['regeneration',76,122],['equipmentMastery',50,226]]},
 {id:'veteran',name:'Veterano',motto:'A experiência do campo',color:'#9a63c4',crest:'star',nodes:[['stance',24,18],['warCry',76,18]]},
];
const PATHS={slash:'M9 30 28 5l-3 13-13 15M6 25l11 8M7 36l5-7',thrust:'M4 32 31 5M22 6h10v10M9 24l7 7M5 36l5-7',tornado:'M6 13c3-9 24-9 25 1 1 8-22 4-23 12-1 8 17 11 23 3M5 20c7-5 19 1 25-3M28 28l4 1-2 5',bash:'M8 6 27 6 31 15 28 29 18 36 7 27 4 14ZM3 18h13M11 13l5 5-5 5',shieldDefense:'M18 4 31 10 28 27 18 36 8 27 5 10ZM11 19l5 5 9-12',shieldThrow:'M16 6 28 11 25 26 16 33 7 26 4 11ZM27 5c9 5 11 18 3 25M29 25l1 5 5-2',riposte:'M7 8h13l3 8-3 11-7 6-7-7-2-11ZM22 23 33 6M26 6h8v8',strength:'M8 32 27 6l-2 12-13 17M6 27l12 8M22 27l6 6M27 23l6 7',vitality:'M18 33C-3 20 1 7 10 7c4 0 6 2 8 5 2-3 4-5 8-5 9 0 13 13-8 26ZM6 19h7l3-6 4 13 3-7h7',armor:'M10 6 18 10 26 6 33 14 28 21 25 18 29 34H7l4-16-3 3-5-7ZM18 11v21',regeneration:'M18 5C15 12 6 19 7 26c1 13 21 13 22 0 1-7-8-14-11-21ZM18 19v12M12 25h12',equipmentMastery:'M7 5l7 9-4 5-7-6c-2 9 7 13 12 8l13 13 6-6-13-13c5-6 0-14-8-12l6 7-5 4Z',momentum:'M5 28h9l-3 7 19-22H19l5-10ZM3 12h9M2 19h6',ricochet:'M4 30 15 9l8 15 11-16M9 6l6 3 3-6M29 8h5v5',steelWave:'M5 10c9 2 9 18 0 20M14 8c9 3 9 21 0 24M23 11c5 3 5 15 0 18M25 20h10M31 16l4 4-4 4',tornadoCyclone:'M3 12c6-9 26-9 32 0M7 20c5-6 19-6 24 0M12 28c3-3 11-3 14 0M19 28v8',tornadoWhirl:'M26 7c-7-5-19-1-19 9 0 8 9 12 15 8 4-3 3-10-2-11-4-1-7 3-5 6M30 5l4 2-2 4M31 30H19M34 35H24',stance:'M19 4v32M6 11h9l-3 13H3ZM32 11h-9l3 13h9ZM6 11l6-5M32 11l-6-5',warCry:'M5 15v10l9 2 13 8V5L14 13ZM14 13v14M31 13c3 4 3 10 0 14M9 27l2 8h4l-2-8'};
Object.assign(PATHS,{spark:'M22 3 9 22h9l-4 15 15-21h-9l4-13Z',chain:'M5 6l6 8-4 4 9 5-3 9M20 32l6-6 4 4 5-6M27 5l-2 7 5 2',storm:'M9 20a6 6 0 0 1 2-11 8 8 0 0 1 15 1 5 5 0 0 1 2 10ZM20 20l-4 8h6l-4 9',roots:'M19 4v14M19 18c-6 0-9 5-12 12M19 18c6 0 9 5 12 12M19 18v18M12 26l-4 2M26 26l4 2M3 18h32',thornbind:'M6 34 32 6M10 24l-4-3M14 20l-1-5M20 14l4-3M24 18l5 1M17 26l4 3M12 30l-3 4',rejuvenate:'M8 32C8 16 18 6 32 6c0 14-10 24-24 26ZM8 32 24 16M26 26v10M21 31h10',wolf:'M7 6l6 9h12l6-9 1 14-6 9-7 6-7-6-6-9ZM14 21h2M22 21h2M17 29h4',leap:'M4 32c4-16 20-22 30-14M34 18l-2 7M34 18l-7-1M3 36h12',wildHeart:'M19 33C-2 20 2 7 11 7c4 0 6 2 8 5 2-3 4-5 8-5 9 0 13 13-8 26ZM13 15l3 10M19 14v11M25 15l-3 10',howl:'M24 5a12 12 0 1 0 10 17 10 10 0 0 1-10-17ZM4 26h8M3 31h11M5 36h7',wisdom:'M3 10c6-3 11-3 16 2 5-5 10-5 16-2v22c-6-3-11-3-16 2-5-5-10-5-16-2ZM19 12v22',sap:'M18 5C15 12 6 19 7 26c1 13 21 13 22 0 1-7-8-14-11-21ZM13 27c3 0 7-2 8-7',attunement:'M15 19a4 4 0 1 0 8 0 8 8 0 1 0-16 0 12 12 0 1 0 24 0',leaf:'M6 34C6 16 18 5 33 5c0 16-12 28-27 29ZM6 34 25 14M14 27l-6-2M19 22l-1-7'});
// Arqueira e Mercenário.
Object.assign(PATHS,{bow:'M10 4c12 4 18 15 18 30M10 4v30M10 34h18M4 19h26M25 15l5 4-5 4',crossbow:'M4 13c9-7 21-7 30 0M19 8v26M15 34h8M4 13l15 7 15-7M19 3l-3 5h6Z',shot:'M4 34 30 8M24 7h7v7M7 27l5 5M4 30l4 4',pierce:'M3 20h32M28 14l7 6-7 6M10 12v16M17 12v16M24 12v16',fan:'M6 32 19 8M6 32 30 14M6 32 34 26M6 32l28 2M6 32 26 6',rain:'M8 4v12M15 8v14M22 4v12M29 8v14M5 32c8-4 20-4 28 0M8 16l-2-3M15 22l-2-3M22 16l-2-3M29 22l-2-3',ambush:'M19 33C10 28 6 21 6 13c5 0 9-3 13-8 4 5 8 8 13 8 0 8-4 15-13 20ZM12 19l5 5 9-10',precision:'M19 4v8M19 28v8M4 20h8M26 20h8M19 9a11 11 0 1 0 0 22 11 11 0 1 0 0-22ZM19 17v6M16 20h6',focus:'M4 20s6-10 15-10 15 10 15 10-6 10-15 10S4 20 4 20ZM19 15a5 5 0 1 0 0 10 5 5 0 1 0 0-10Z',swift:'M6 30c6-2 10-8 12-14l8-8M22 6l6 2-2 6M4 22h8M6 16h6M10 34h10',quarrel:'M4 34 30 8M23 6l9-1-1 9M27 10l-4-4M30 13l-4-4M8 26l4 4',volley:'M4 14h24M23 9l6 5-6 5M4 22h24M23 17l6 5-6 5M4 30h24M23 25l6 5-6 5',breach:'M3 20h32M28 14l7 6-7 6M12 8v24M12 8l3 4M12 32l3-4M20 8v24',bomb:'M17 12a11 11 0 1 0 1 0ZM21 11l4-5M25 6c2-2 5-1 6 1M28 3l1 3M32 7l-3 1',shrapnel:'M19 20m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0M19 4v7M19 29v7M4 20h7M27 20h7M8 9l5 5M25 26l5 5M30 9l-5 5M13 26l-5 5',mine:'M6 28h26l-3-8H9ZM12 20l2-6h10l2 6M19 14V8M15 8h8M4 33h30',firebomb:'M15 4h8v6l4 6v16a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V16l4-6ZM19 31c-4 0-5-4-2-7 0 2 2 2 2 0 2 2 4 4 0 7Z',caliber:'M19 4l4 8v22h-8V12ZM15 26h8M15 20h8',bolt:'M6 32 26 12M20 6l10 2 2 10M15 15l8 2M12 22l6 4',fireball:'M19 35c-8 0-12-6-12-12 0-7 6-10 6-17 4 3 5 6 5 9 2-3 2-6 1-9 7 4 12 10 12 17 0 7-5 12-12 12ZM19 35c-3 0-5-3-5-6 0-4 4-6 4-9 3 2 6 5 6 9 0 3-2 6-5 6Z',frost:'M19 3v34M5 11l28 18M5 29l28-18M15 6l4 4 4-4M15 34l4-4 4 4M5 16l5-1-1-5M33 24l-5 1 1 5',blink:'M8 30l5-5M12 34l3-3M16 8a9 9 0 1 1 0 18 9 9 0 1 1 0-18ZM16 12a5 5 0 1 0 0 10',combustion:'M10 34h18M13 34c-2-5 2-8 2-12 2 2 3 4 3 6 1-2 1-4 0-6 4 2 6 6 6 9 0 2-1 3-2 3',shatter:'M19 4l4 10 10 1-8 7 3 10-9-6-9 6 3-10-8-7 10-1ZM19 14v12M14 20h10',echo:'M19 20m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M19 20m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0M19 20m-13 0a13 13 0 1 0 26 0',meteor:'M28 8 12 24M32 14 18 28M22 4 8 18M10 26a6 6 0 1 0 8 8 6 6 0 1 0-8-8Z',intellect:'M19 6c-7 0-11 5-11 10 0 4 2 6 4 8v6h14v-6c2-2 4-4 4-8 0-5-4-10-11-10ZM15 34h8M17 16l2 4 2-4',wisdom:'M6 8h11c2 0 2 2 2 4v22c0-2-1-3-3-3H6ZM32 8H21c-2 0-2 2-2 4v22c0-2 1-3 3-3h10Z',meditation:'M19 7a3 3 0 1 0 0 6 3 3 0 1 0 0-6ZM19 14v8M10 30c3-4 6-5 9-5s6 1 9 5M7 24l8-2M31 24l-8-2',mageStaff:'M9 34 24 13M22 6l5 1 1 5-4 3-4-3ZM7 26l5 1M5 21l4 4',falcon:'M3 14c6 0 10 3 13 7 2-7 8-12 19-12-4 3-6 6-7 10l5 2-6 2c-2 6-7 10-14 10l3-5c-6 0-10-3-13-14Z',stamina:'M10 6h18v6l-5 6 5 6v8H10v-8l5-6-5-6ZM14 30h10'});
PATHS.star='M19 4l4.2 8.6 9.3 1.3-6.8 6.5 1.6 9.3L19 25.3l-8.3 4.4 1.6-9.3-6.8-6.5 9.3-1.3Z';
PATHS.lock='M12 18v-5a7 7 0 0 1 14 0v5M9 18h20v16H9ZM19 24v5';
PATHS.check='M8 20l7 7 15-15';
PATHS.swords='M5 5l20 20M25 25l4-1 1 4-4 1ZM33 5 13 25M13 25l-4-1-1 4 4 1M7 31l4-4M31 31l-4-4';
// Os traçados não ocupam o centro da área 38×40 em que foram desenhados: cada ícone é medido uma vez
// num <svg> fora da tela e recebe um viewBox quadrado centrado no desenho.
const boxes=new Map();
function fitBox(id){
 if(boxes.has(id))return boxes.get(id);
 try{const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('style','position:absolute;left:-9999px;top:0;width:38px;height:40px;visibility:hidden');s.innerHTML='<path d="'+(PATHS[id]||PATHS.star)+'"/>';document.body.append(s);const b=s.getBBox();s.remove();
  if(b.width>0&&b.height>0){const size=Math.max(b.width,b.height)+3,vb=[b.x+b.width/2-size/2,b.y+b.height/2-size/2,size,size].map(n=>n.toFixed(2)).join(' ');boxes.set(id,vb);return vb;}}catch{}
 return '0 0 38 40';
}
export const icon=id=>'<svg viewBox="'+fitBox(id)+'" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="'+(PATHS[id]||PATHS.star)+'"/></svg>';
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:0});
const TILE=56,GRAPH=372,Y=v=>Math.round(v*.9);
// Cada classe com árvore própria fornece nós, ramos, orçamento e textos; a apresentação é a mesma.
export const DRUID_BRANCHES=[
 {id:'storm',name:'Tempestade',motto:'O céu responde',color:'#6fa8dc',crest:'spark',nodes:[['spark',24,18],['chain',76,18],['storm',76,122]]},
 {id:'nature',name:'Natureza',motto:'Raízes que prendem',color:'#79a446',crest:'roots',nodes:[['roots',24,18],['thornbind',24,122],['rejuvenate',76,122]]},
 {id:'wild',name:'Selvagem',motto:'A fera sob a pele',color:'#b07a45',crest:'wolf',nodes:[['wolf',50,18],['leap',24,122],['wildHeart',76,122],['howl',50,226]]},
 {id:'passives',name:'Passivas',motto:'A paciência da floresta',color:'#9a63c4',crest:'vitality',nodes:[['vitality',24,18],['wisdom',76,18],['sap',24,122],['attunement',76,122]]},
];
const WARRIOR_TREE={nodes:PASSIVES,branches:BRANCHES,first:'slash',field:'warriorRanks',ranks:warriorRanks,budget:warriorBudget,spent:warriorSpent,canLearn,banner:'swords',title:'Guerreiro',subtitle:'Treinamento do Guerreiro',intro:'Força, disciplina e técnica de combate. Escolha um selo para conhecer a habilidade e investir seus pontos.',affinity:true,
 kind:id=>['tornadoCyclone','tornadoWhirl'].includes(id)?'Variante':['momentum','riposte','ricochet'].includes(id)?'Sinergia':PASSIVES[id].max===1||['thrust','bash'].includes(id)?'Habilidade':'Aperfeiçoamento',
 learnedNote:id=>['steelWave','warCry'].includes(id)?'Aprendida. Clique em um slot da barra para equipar.':'Treinamento completo.'};
const DRUID_TREE={nodes:DRUID_NODES,branches:DRUID_BRANCHES,first:'spark',field:'druidRanks',ranks:druidRanks,budget:druidBudget,spent:druidSpent,canLearn:canLearnDruid,banner:'leaf',title:'Druida',subtitle:'Caminhos da Druida',intro:'Raios do céu, raízes da terra e a fera que dorme na pele. Escolha um selo para conhecer a habilidade e investir seus pontos.',
 kind:id=>id==='thornbind'||id==='wildHeart'?'Sinergia':['chain','roots','wolf'].includes(id)||DRUID_NODES[id].max===1?'Habilidade':'Aperfeiçoamento',
 learnedNote:id=>id==='wolf'?'Aprendida. Pressione F para mudar de forma.':'Caminho completo.'};
export const ARCHER_BRANCHES=[
 {id:'bow',name:'Arco',motto:'Cada flecha conta',color:'#8fbf5a',crest:'shot',nodes:[['shot',24,18],['pierce',76,18],['fan',24,122],['rain',76,122]]},
 {id:'hunt',name:'Caça',motto:'Nunca onde esperam',color:'#c49a52',crest:'leap',nodes:[['leap',24,18],['falcon',76,18],['ambush',24,122]]},
 {id:'passives',name:'Passivas',motto:'Olho firme, passo leve',color:'#9a63c4',crest:'vitality',nodes:[['precision',24,18],['vitality',76,18],['focus',24,122],['swift',76,122],['regeneration',50,226]]},
];
export const MAGE_BRANCHES=[
 {id:'fire',name:'Fogo',motto:'Rápido e sem perdão',color:'#e0603a',crest:'fireball',nodes:[['fireball',50,18],['combustion',24,122],['meteor',76,122]]},
 {id:'frost',name:'Gelo',motto:'Devagar, para sempre',color:'#6fb8e0',crest:'frost',nodes:[['frost',50,18],['shatter',50,122]]},
 {id:'arcane',name:'Arcano',motto:'O caminho mais curto',color:'#9a72e0',crest:'bolt',nodes:[['bolt',24,18],['blink',76,18],['echo',76,122]]},
 {id:'passives',name:'Passivas',motto:'Estudo e paciência',color:'#9a63c4',crest:'vitality',nodes:[['intellect',24,18],['vitality',76,18],['wisdom',24,122],['meditation',76,122],['regeneration',50,226]]},
];
export const MERCENARY_BRANCHES=[
 {id:'crossbow',name:'Besta',motto:'Peso e alcance',color:'#c98a4a',crest:'quarrel',nodes:[['quarrel',24,18],['volley',76,18],['breach',24,122]]},
 {id:'powder',name:'Pólvora',motto:'Pavio curto, problema longo',color:'#d9622b',crest:'bomb',nodes:[['bomb',50,18],['shrapnel',24,122],['mine',76,122],['firebomb',50,226]]},
 {id:'passives',name:'Passivas',motto:'Contrato cumprido, couro inteiro',color:'#9a63c4',crest:'vitality',nodes:[['caliber',24,18],['vitality',76,18],['armor',24,122],['stamina',76,122],['regeneration',50,226]]},
];
const marksmanTree=(classId,T)=>{const N=MARKSMAN_NODES[classId];return {nodes:N,first:Object.keys(N)[0],field:'marksmanRanks',ranks:(v,l)=>marksmanRanks(classId,v,l),budget:marksmanBudget,spent:r=>marksmanSpent(classId,r),canLearn:(r,id,l)=>canLearnMarksman(classId,r,id,l),...T,
 kind:id=>['ambush','breach','shrapnel','combustion','shatter','echo'].includes(id)?'Sinergia':N[id].branch==='passives'?'Aperfeiçoamento':N[id].max===1||['pierce','leap','volley','bomb','falcon','fireball','frost','blink'].includes(id)?'Habilidade':'Aperfeiçoamento',
 learnedNote:id=>id==='falcon'?'Aprendido. O falcão já voa com você; pressione F para mandá-lo a um alvo.':'Aprendida. Ela já está no seu slot da barra.'};};
const ARCHER_TREE=marksmanTree('archer',{branches:ARCHER_BRANCHES,banner:'bow',title:'Arqueira',subtitle:'Caminhos da Arqueira',intro:'Distância, ritmo e o chão certo para pisar. Escolha um selo para conhecer a habilidade e investir seus pontos.'});
const MERCENARY_TREE=marksmanTree('mercenary',{branches:MERCENARY_BRANCHES,banner:'crossbow',title:'Mercenário',subtitle:'Ofício do Mercenário',intro:'Virotes que atravessam fileiras e pólvora para quem insistir em chegar perto. Escolha um selo para conhecer a habilidade e investir seus pontos.'});
const MAGE_TREE=marksmanTree('mage',{branches:MAGE_BRANCHES,banner:'mageStaff',title:'Mago',subtitle:'Escolas do Mago',intro:'Fogo para os grupos, gelo para quem chega perto e o arcano para sair do caminho. Escolha um selo para conhecer o feitiço e investir seus pontos.'});
export function createMarksmanTalents(s,{changed}){const trees={archer:createTalentTree(s,ARCHER_TREE,{changed}),mercenary:createTalentTree(s,MERCENARY_TREE,{changed}),mage:createTalentTree(s,MAGE_TREE,{changed})};return {render:host=>(trees[s.world.classId]||trees.archer).render(host)};}
export function createWarriorTalents(s,{tornadoVariant,changed}){return createTalentTree(s,WARRIOR_TREE,{tornadoVariant,changed});}
export function createDruidTalents(s,{changed}){return createTalentTree(s,DRUID_TREE,{changed});}
function createTalentTree(s,T,{tornadoVariant,changed}){
 const PASSIVES=T.nodes,BRANCHES=T.branches,kind=T.kind,warriorRanks=T.ranks,warriorBudget=T.budget,warriorSpent=T.spent,canLearn=T.canLearn;
 let selected=T.first,root=null;
 const w=()=>s.world;
 function invest(){const level=levelOf(w()),r=warriorRanks(w()[T.field],level);if(!canLearn(r,selected,level))return;r[selected]++;w()[T.field]={...r};s.save.character[T.field]={...r};applyAttributes(w());w().progressChanged=true;render(root);changed?.();root.querySelector('.invest')?.focus({preventScroll:true});}
 function graph(branch,r,level){
  let svg='',nodes='';
  for(const [id,x,yr] of branch.nodes){const y=Y(yr),n=PASSIVES[id],parent=branch.nodes.find(([key])=>key===n.requires);
   if(parent){const [,px,pr]=parent,py=Y(pr),from=py+TILE+12,mid=Math.round((from+y)/2),state=r[id]?' learned':r[n.requires]&&level>=(n.level||1)?' available':'';svg+='<path class="warrior-link'+state+'" d="M '+px+' '+from+' V '+mid+' H '+x+' V '+(y-2)+'"/>';}}
  if(branch.id==='passives'&&T.affinity)svg+='<path class="warrior-affinity" d="M 24 84 V 108 M 76 84 V 108 M 24 178 V 191 H 76 V 178 M 50 191 V 202"/>';
  for(const [id,x,yr] of branch.nodes){const y=Y(yr),n=PASSIVES[id],rank=r[id],locked=level<(n.level||1)||!!n.requires&&!r[n.requires],open=canLearn(r,id,level);
   const cls='warrior-node wt-node'+(rank?' learned':'')+(rank>=n.max?' maxed':'')+(locked?' locked':'')+(open?' available':'')+(n.max===1?' final':'')+(id===selected?' selected':'');
   const title=n.name+' · '+rank+'/'+n.max+(locked?' · requer nível '+(n.level||1)+(n.requires?' e '+PASSIVES[n.requires].name:''):'');
   nodes+='<button type="button" class="'+cls+'" style="left:'+x+'%;top:'+y+'px" data-warrior-node="'+id+'" aria-pressed="'+(id===selected)+'" aria-label="'+esc(n.name+', '+rank+' de '+n.max+' pontos')+'" title="'+esc(title)+'"><span class="wt-tile">'+icon(id)+(locked?'<i class="wt-lock">'+icon('lock')+'</i>':'')+'</span><em>'+rank+'/'+n.max+'</em></button>';}
  return '<div class="wt-graph" style="height:'+GRAPH+'px"><svg viewBox="0 0 100 '+GRAPH+'" preserveAspectRatio="none" aria-hidden="true">'+svg+'</svg>'+nodes+'</div>';
 }
 function detail(r,level,left,branch){
  const n=PASSIVES[selected],rank=r[selected],maxed=rank>=n.max,levelOk=level>=(n.level||1),reqOk=!n.requires||r[n.requires]>0;
  const reason=maxed?T.learnedNote(selected):!levelOk?'Disponível a partir do nível '+n.level+'.':!reqOk?'Invista primeiro em '+PASSIVES[n.requires].name+'.':left<=0?'Suba de nível para receber mais pontos.':'Pronto para receber um ponto.';
  const effects=n.description.split(/(?<=\.)\s+/).filter(Boolean).map(t=>'<li>'+esc(t)+'</li>').join('');
  const req='<li class="'+(levelOk?'ok':'no')+'">'+icon(levelOk?'check':'lock')+'Nível '+(n.level||1)+'</li>'+(n.requires?'<li class="'+(reqOk?'ok':'no')+'">'+icon(reqOk?'check':'lock')+'1 ponto em '+esc(PASSIVES[n.requires].name)+'</li>':'');
  return '<div class="wt-detail-head"><div class="wt-detail-icon">'+icon(selected)+'<em>'+rank+'/'+n.max+'</em></div><div><h3>'+esc(n.name)+'</h3><p>'+branch.name+' • '+kind(selected)+'</p></div></div>'
   +'<h4>Efeito <small>'+rank+' / '+n.max+' pontos investidos</small></h4><ul class="wt-effects">'+effects+'</ul>'
   +'<h4>Pré-requisito</h4><ul class="wt-req">'+req+'</ul>'
   +'<div class="wt-invest"><button type="button" class="btn invest'+(maxed?' maxed':'')+'" aria-label="'+esc('Aprender '+n.name)+'"'+(canLearn(r,selected,level)?'':' disabled')+'>'+(maxed?icon('check')+'Nível máximo alcançado':'+ Investir ponto')+'</button></div>'
   +'<p class="lg-note wt-reason" role="status">'+esc(reason)+'</p>';
 }
 function render(target){
  ensureArtDefs();root=target;const level=levelOf(w()),r=warriorRanks(w()[T.field],level),left=warriorBudget(level)-warriorSpent(r),branch=BRANCHES.find(b=>b.nodes.some(([id])=>id===selected)),c=s.save.character,next=xpNext(level),exp=next?Math.min(c.exp,next):0;
  const learned=b=>b.nodes.filter(([id])=>r[id]>0).length;
  root.innerHTML='<div class="wt">'
   +'<div class="wt-side"><div class="wt-banner" aria-hidden="true">'+icon(T.banner)+'</div><h2>'+T.title+'</h2><h3>'+T.subtitle+'</h3><p>'+T.intro+'</p>'
   +'<div class="wt-points"><span>Pontos disponíveis</span><b class="warrior-budget">'+left+'</b></div>'
   +'<nav class="warrior-branch-nav wt-branches" role="group" aria-label="Ramos: '+T.title+'">'+BRANCHES.map(b=>'<button type="button" data-branch="'+b.id+'" style="--branch-accent:'+b.color+'" aria-label="'+b.name+'" aria-pressed="'+(b===branch)+'">'+icon(b.crest)+'<span>'+b.name+'</span><b>'+learned(b)+' / '+b.nodes.length+'</b></button>').join('')+'</nav></div>'
   +'<div class="wt-board"><div class="wt-board-head"><p><b>'+left+'</b> pontos disponíveis</p><small>3 pontos por nível • Nível '+level+'</small></div><div class="warrior-tree wt-tree">'
   +BRANCHES.map(b=>'<section class="warrior-school wt-school" data-branch="'+b.id+'" data-active="'+(b===branch)+'" style="--branch-accent:'+b.color+'" aria-label="Ramo '+b.name+'"><header class="warrior-school-heading wt-school-head"><span class="wt-crest">'+icon(b.crest)+'</span><h3>'+b.name+'</h3><small>'+b.motto+'</small></header>'+graph(b,r,level)+'</section>').join('')
   +'</div></div>'
   +'<section class="warrior-detail wt-detail" aria-live="polite" style="--branch-accent:'+branch.color+'">'+detail(r,level,left,branch)+'</section>'
   +'<div class="wt-footer"><div class="wt-xp"><b>Nível '+level+'</b><div class="wt-xp-bar" role="progressbar" aria-label="Experiência" aria-valuemin="0" aria-valuemax="'+(next||1)+'" aria-valuenow="'+(next?Math.floor(exp):1)+'"><i style="width:'+(next?Math.min(100,exp/next*100):100).toFixed(1)+'%"></i><span>'+(next?num(exp)+' / '+num(next)+' XP':'Nível máximo')+'</span></div></div><div class="wt-legend"><span class="learned">Aprendida</span><span class="available">Pode investir</span><span class="locked">Bloqueada</span></div></div>'
   +'</div>';
  const det=root.querySelector('.wt-detail');
  if(tornadoVariant&&['tornado','tornadoCyclone','tornadoWhirl'].includes(selected)&&r.tornado){
   const box=document.createElement('div');box.className='warrior-variant';box.innerHTML='<small>Variante ativa do Tornado</small><div class="warrior-variant-options"></div><p class="lg-note"></p>';det.append(box);
   const current=warriorTornado(w().warriorTornadoVariant,r).id,message=box.querySelector('.lg-note');
   for(const v of Object.values(TORNADO_VARIANTS)){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=v.name;b.dataset.tornadoVariant=v.id;b.setAttribute('aria-pressed',String(v.id===current));b.disabled=warriorTornado(v.id,r).id!==v.id;b.onclick=()=>{const result=tornadoVariant(v.id);if(result.ok)render(root);else message.textContent=result.message;};box.querySelector('.warrior-variant-options').append(b);}
  }
  if(T===DRUID_TREE&&selected==='wolf')det.insertAdjacentHTML('beforeend','<div class="warrior-combat-note"><small>Forma de lobo</small><p>F alterna as formas. Sem mana, a Druida volta à forma humana e espera 4 s para se transformar de novo.</p></div>');
  if(T===WARRIOR_TREE&&selected==='slash')det.insertAdjacentHTML('beforeend','<div class="warrior-combat-note"><small>Espada e escudo</small><p>Três cortes: um clique por golpe. Complete a sequência dentro de 0,45 s para manter o combo.</p></div>');
  root.querySelector('.invest').onclick=invest;
  for(const b of root.querySelectorAll('[data-warrior-node]'))b.onclick=()=>{selected=b.dataset.warriorNode;render(root);root.querySelector('[data-warrior-node="'+selected+'"]')?.focus({preventScroll:true});};
  for(const b of root.querySelectorAll('.wt-branches button'))b.onclick=()=>{selected=BRANCHES.find(x=>x.id===b.dataset.branch).nodes[0][0];render(root);};
 }
 return {render};
}
