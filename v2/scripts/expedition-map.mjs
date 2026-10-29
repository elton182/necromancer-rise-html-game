// Expedição: dados puros do mapa de cada wave. Colisores em `solids`; `decor` é só visual.
// O traçado, os grupos e o sorteio dos adereços vêm de ExpeditionModel.plan e do sorteio de expeditionBuildScenery
// (necromancer-canvas.html / scripts/expedition.js), mantendo a ordem das chamadas ao gerador.
import Expedition from './shared-expedition.mjs';
export const EXPEDITION_ID='expedition';
// Paleta por bioma; o renderizador usa `arena.palette` no lugar da paleta do tema.
export const PALETTES={
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
const KINDS={grave:['tomb','column','skulls'],forest:['oak','pine','bush'],desert:['cactus','rock','ruin'],snow:['pine','ice','rock'],village:['house','barrel','crate'],swamp:['bush','skulls','tomb','oak'],river:['bush','rock','oak'],mountain:['rock','ruin','pine']};
// Só estes viram colisor, como no jogo antigo; `r` é o raio de colisão e `height` a altura visual.
const SOLID={oak:{r:.5,height:5.2},pine:{r:.45,height:6},rock:{r:.55,height:.9},cactus:{r:.55,height:2.4},column:{r:.55,height:3.2},house:{r:2,height:3},ice:{r:.55,height:1.6},ruin:{r:.55,height:1.8}};
const round=n=>+n.toFixed(2);
// Distância de um ponto à trilha, ao início, à saída e aos grupos: a mesma regra do jogo antigo para deixar a rota livre.
function blocked(plan,x,y){
 return Math.abs(y-Expedition.routeY(plan.route,x))<5||Math.hypot(x-plan.entry.x,y-plan.entry.y)<7||Math.hypot(x-plan.exit.x,y-plan.exit.y)<9||plan.groups.some(g=>Math.hypot(x-g.x,y-g.y)<5);
}
// `options` (Conquista): troca o bioma e limita os grupos, como o jogo antigo faz sobre o plano da Expedição.
export function expeditionArena(wave,options={}){
 const plan=Expedition.plan(wave);if(options.biome)plan.biome=options.biome;if(options.groups)plan.groups=plan.groups.slice(0,options.groups);
 const rr=Expedition.random(plan.wave*3571),kinds=KINDS[plan.biome],solids=[],decor={trees:[],bushes:[],grass:[],flowers:[],mushrooms:[],patches:[],path:[],misc:[],braziers:[],water:[]};
 for(let i=0;i<190;i++){
  const x=3+rr()*(plan.width-6),y=3+rr()*(plan.height-6);if(blocked(plan,x,y))continue;
  const look=kinds[Math.floor(rr()*kinds.length)],sc=.7+rr()*.5,seed=rr(),w=.7+rr()*.4,v=Math.floor(rr()*3),tilt=rr()-.5;
  if(SOLID[look]){const d=SOLID[look];solids.push({kind:'circle',look,x:round(x),y:round(y),r:d.r,height:round(d.height*(look==='house'?1:sc)),tone:round(seed)});}
  else if(look==='bush')decor.bushes.push({x:round(x),y:round(y),size:round(.5*sc+.15),tone:round(seed)});
  else decor.misc.push({look,x:round(x),y:round(y),size:round(sc),tone:round(seed),tilt:round(tilt),w:round(w),v});
 }
 // Trilha de terra ao longo da rota e brasas a cada 16 u, sem luz dinâmica.
 for(let x=0;x<=plan.width;x+=1.5)decor.path.push({x:round(x),y:round(Expedition.routeY(plan.route,x)),r:1.9});
 for(let x=8;x<plan.width;x+=16)decor.braziers.push({x,y:round(Expedition.routeY(plan.route,x)+4.5)});
 // Relevo rasteiro: só nos biomas verdes; manchas de musgo também só nesses.
 const free=(x,y)=>!blocked(plan,x,y)&&Math.abs(y-Expedition.routeY(plan.route,x))>2.4;
 const green=plan.biome==='forest'||plan.biome==='village'||plan.biome==='swamp';
 // Rio da Conquista: curso de água paralelo à trilha, só desenho.
 if(plan.biome==='river')for(let x=6;x<plan.width-6;x+=1.6)decor.water.push({x:round(x),y:round(Expedition.routeY(plan.route,x)+13+Math.sin(x*.14)*3),r:3.2});
 for(let n=0,t=0;green&&n<700&&t<4000;t++){const x=1+rr()*(plan.width-2),y=1+rr()*(plan.height-2);if(!free(x,y))continue;decor.grass.push({x:round(x),y:round(y),height:round(.2+rr()*.3),tone:round(rr())});n++;}
 for(let n=0,t=0;plan.biome==='forest'&&n<120&&t<1500;t++){const x=1+rr()*(plan.width-2),y=1+rr()*(plan.height-2);if(!free(x,y))continue;decor.flowers.push({x:round(x),y:round(y),tone:round(rr())});n++;}
 for(let n=0;green&&n<40;n++)decor.patches.push({x:round(1+rr()*(plan.width-2)),y:round(1+rr()*(plan.height-2)),r:round(1.2+rr()*2.4),tone:round(rr())});
 return {id:EXPEDITION_ID+'-'+plan.wave,theme:'expedition',palette:PALETTES[plan.biome],biome:plan.biome,plan,bounds:{minX:0,maxX:plan.width,minY:0,maxY:plan.height},solids,decor};
}
