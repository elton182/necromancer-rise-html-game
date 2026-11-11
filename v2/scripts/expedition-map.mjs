// Expedição: dados puros do mapa de cada wave. Colisores em `solids`; `decor` é só visual.
// O traçado e os grupos vêm de ExpeditionModel.plan (scripts/expedition-model.js); o cenário, de expedition-biomes.mjs.
import Expedition from './shared-expedition.mjs';
import {expeditionDocument} from './expedition-biomes.mjs';
import {toArena,normalizeMap} from './map-model.mjs';
export const EXPEDITION_ID='expedition';
// Paleta por bioma; o renderizador usa `arena.palette` no lugar da paleta do tema.
export const PALETTES={
 cave:{dark:{ground:0x303031,background:0x111318},light:{ground:0x9a9890,background:0x9fa2a8}},
 grave:{dark:{ground:0x2a2a33,background:0x111118},light:{ground:0x8e8a96,background:0x80808a}},
 forest:{dark:{ground:0x2c4a2f,background:0x13201a},light:{ground:0x86a266,background:0x8ea98a}},
 desert:{dark:{ground:0x6b5a38,background:0x2a2216},light:{ground:0xc9b179,background:0xb9a572}},
 snow:{dark:{ground:0x6c7a88,background:0x1a222b},light:{ground:0xdfe6ec,background:0xbfcad3}},
 village:{dark:{ground:0x3c5135,background:0x172026},light:{ground:0x93a773,background:0x8da08b}},
 // Biomas exclusivos da Conquista de Valdoria.
 swamp:{dark:{ground:0x1d2615,background:0x091009},light:{ground:0x7a8a5a,background:0x8a9a78}},
 river:{dark:{ground:0x1e3536,background:0x0b171a},light:{ground:0x7aa09a,background:0x8fb0ac}},
 mountain:{dark:{ground:0x303031,background:0x111318},light:{ground:0x9a9890,background:0x9fa2a8}}
};
// Piloto exclusivo do Brejo: duas trilhas convergem antes do chefe.
function brejo(plan){
 plan.layout='brejo-fork';
 plan.route=[{x:8,y:40},{x:30,y:40},{x:65,y:31},{x:102,y:36},{x:125,y:40},{x:148,y:40}];
 plan.branches=[[{x:30,y:40},{x:48,y:62},{x:83,y:64},{x:108,y:56},{x:125,y:40}]];
 const spots=[[32,40,'guard'],[55,31,'defense'],[75,35,'defense'],[54,63,'camp'],[78,64,'camp'],[108,53,'patrol'],[119,39,'guard'],[131,43,'guard']];
 plan.groups.forEach((g,i)=>{const [x,y,encounter]=spots[i];g.x=x;g.y=y;g.encounter=encounter;
 g.mobs.forEach((m,j)=>{m.x=x+(encounter==='defense'?(j%4-1.5)*2:Math.cos(j*2.4)*3);m.y=y+(encounter==='defense'?Math.floor(j/4)*4:Math.sin(j*2.4)*3);});
 if(encounter==='patrol')g.patrol=[{x:96,y:53},{x:113,y:53}];
 });
 // O grupo raro existente ocupa o desvio; não acrescenta loot nem inimigos.
 return plan;
}

// Desloca a arena centrada do editor para o referencial do plano (0..largura, 0..altura), sem mexer nas medidas.
function shiftArena(a,dx,dy){
 const mv=o=>({...o,x:o.x+dx,y:o.y+dy}),decor={};
 for(const [k,list] of Object.entries(a.decor))decor[k]=list.map(mv);
 const t=a.terrain&&{...a.terrain,x0:a.terrain.x0+dx,y0:a.terrain.y0+dy,x1:a.terrain.x1+dx,y1:a.terrain.y1+dy,bridges:a.terrain.bridges.map(mv),blocks:a.terrain.blocks.map(mv)};
 return {...a,solids:a.solids.map(mv),kitProps:a.kitProps.map(mv),decor,caravans:a.caravans.map(mv),roadBlocks:a.roadBlocks.map(mv),rotatedParts:a.rotatedParts.map(p=>({...p,x:p.x+dx,y:p.y+dy})),terrain:t};
}
// `options` (Conquista): troca o bioma e limita os grupos, como o jogo antigo faz sobre o plano da Expedição.
// O cenário é um mapa no formato do editor (expedition-biomes.mjs): relevo, água, chão pintado e peças do kit por bioma.
export function expeditionArena(wave,options={}){
 const plan=Expedition.plan(wave);if(options.biome)plan.biome=options.biome;if(options.groups)plan.groups=plan.groups.slice(0,options.groups);
 if(options.pilot)brejo(plan);
 const map=normalizeMap(expeditionDocument(plan)).map,arena=shiftArena(toArena(map),plan.width/2,plan.height/2);
 return {...arena,id:EXPEDITION_ID+'-'+plan.wave,name:'Expedição',theme:'expedition',expeditionMap:true,palette:PALETTES[plan.biome],biome:plan.biome,plan,bounds:{minX:0,maxX:plan.width,minY:0,maxY:plan.height}};
}
