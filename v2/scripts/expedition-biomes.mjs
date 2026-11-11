// Mapas das Expedições no formato dos mapas novos (como a Várzea de Itaúna): relevo, chão pintado, água, peças do kit e luz por bioma.
// Dados puros e determinísticos. O plano (trilha, grupos, entrada e saída) vem de ExpeditionModel.plan e não muda:
// tudo o que colide fica fora da trilha, dos grupos, das patrulhas, da entrada e da clareira do chefe, e o relevo é aplainado ali.
// Coordenadas do plano (0..width, 0..height); o documento sai centrado, como no editor, e expedition-map.mjs o desloca de volta.
import {gridFor,closeGrid} from './map-terrain.mjs';
import {clamp,mix,smooth,fbm,seeded,lineDistance} from './itauna-map.mjs';

const r2=v=>Math.round(v*100)/100;
// Céu, luz, névoa, chão e água de cada bioma (campos de `normalizeStyle`).
export const EXPEDITION_STYLES={
 grave:{sky:'#1f2433',sun:2.5,sunColor:'#c4d0f0',ambient:1.9,fog:.4,tint:'#a9b4bc',water:'#2c4048',grass:.8,flowers:0},
 forest:{sky:'#6f8a7a',sun:3.2,sunColor:'#ffe2b0',ambient:1.8,fog:.15,tint:'#eef2dc',grass:1.2,flowers:1.2,water:'#3b7a86'},
 desert:{sky:'#c4a878',sun:3.9,sunColor:'#ffe2a8',ambient:1.7,fog:.12,tint:'#f0e2c0',ground:'sand',water:'#4f8f8a'},
 snow:{sky:'#a9b8c8',sun:2.6,sunColor:'#eef4ff',ambient:2,fog:.35,tint:'#ffffff',ground:'snow',water:'#7fa8c0'},
 village:{sky:'#6a5a5e',sun:2.8,sunColor:'#ffc89a',ambient:1.5,fog:.2,tint:'#f2e6d4',grass:1,flowers:.8,water:'#3f7686'},
 swamp:{sky:'#2c3626',sun:2.2,sunColor:'#d0dca8',ambient:1.6,fog:.5,tint:'#c4cc9c',water:'#3f5a42',grass:1.3,flowers:.15},
 river:{sky:'#7fa3b8',sun:3.4,sunColor:'#fff2d8',ambient:1.9,fog:.1,tint:'#f2f4e8',water:'#3b7a8c'},
 mountain:{sky:'#7c8a94',sun:2.6,sunColor:'#e8eef8',ambient:1.8,fog:.4,tint:'#e4e6e8',ground:'stone',water:'#557f94'}
};
// Relevo e vegetação: `hills` (altura das colinas), `wall` (encosta das bordas), `woods` (limiar da mata; maior = menos árvores),
// `pine`/`dead` (fração de pinheiros e de árvores mortas), `ponds` (lagoas), `pools` (charcos rasos), `rocks` (matacões soltos).
const RECIPES={
 grave:{hills:1.2,wall:2.6,woods:.56,pine:.6,dead:.4,ponds:1,pools:0,rocks:14,sites:['graveyard','graveyard','mausoleum','shrine','graveyard','camp']},
 forest:{hills:1.6,wall:3,woods:.44,pine:.42,dead:.02,ponds:2,pools:0,rocks:12,sites:['camp','ruins','nest','shrine','camp']},
 desert:{hills:2.4,wall:3.4,woods:2,pine:0,dead:1,ponds:1,pools:0,rocks:26,sites:['oasis','ruins','wreck','camp','shrine','wreck']},
 snow:{hills:1.8,wall:3.8,woods:.52,pine:.9,dead:.1,ponds:0,pools:0,rocks:22,sites:['camp','watchpost','stones','ruins','stones']},
 village:{hills:1,wall:2.2,woods:.6,pine:.3,dead:0,ponds:1,pools:0,rocks:6,sites:['farm','market','farm','farm','orchard','farm']},
 swamp:{hills:.8,wall:1.6,woods:.5,pine:0,dead:.45,ponds:0,pools:16,rocks:6,sites:['shrine','hut','graveyard','hut']},
 river:{hills:1.2,wall:2.4,woods:.5,pine:.4,dead:0,ponds:0,pools:0,rocks:10,river:true,sites:['camp','ruins','farm','camp']},
 mountain:{hills:2.6,wall:5,woods:.5,pine:.85,dead:.15,ponds:0,pools:0,rocks:34,sites:['watchpost','stones','ruins','camp','stones']}
};
const SEEDS={grave:11,forest:23,desert:37,snow:41,village:53,swamp:67,river:71,mountain:89};

export function expeditionDocument(plan){
 const W=plan.width,H=plan.height,biome=plan.biome,B=RECIPES[biome]||RECIPES.forest,seed=plan.wave*7919+(SEEDS[biome]||0),s=seed%997;
 const random=seeded(seed),between=(a,b)=>a+(b-a)*random(),chance=p=>random()<p;
 const lines=[plan.route,...(plan.branches||[])].map(r=>r.map(p=>[p.x,p.y]));
 for(const g of plan.groups)if(g.patrol)lines.push(g.patrol.map(p=>[p.x,p.y]));
 const routeDist=(x,y)=>Math.min(...lines.map(l=>lineDistance(l,x,y).d));
 const {groups,entry,exit}=plan,boss={x:exit.x-4,y:exit.y};
 // 1 = precisa ficar plano e seco (trilha, grupos, entrada, clareira do chefe); 0 = livre para o relevo.
 const keep=(x,y)=>{
  let k=smooth(9,4.5,routeDist(x,y));
  for(const g of groups)k=Math.max(k,smooth(10,6,Math.hypot(x-g.x,y-g.y)));
  return Math.max(k,smooth(13,8,Math.hypot(x-entry.x,y-entry.y)),smooth(17,12,Math.hypot(x-boss.x,y-boss.y)));
 };
 // Folga mínima para peças com colisão: a mesma regra do gerador antigo, mais o raio da peça.
 const clear=(x,y,r=0)=>x>r+.5&&x<W-r-.5&&y>r+.5&&y<H-r-.5&&routeDist(x,y)>4.8+r&&groups.every(g=>Math.hypot(x-g.x,y-g.y)>5.6+r)&&Math.hypot(x-entry.x,y-entry.y)>7+r&&Math.hypot(x-boss.x,y-boss.y)>11+r;
 // Margem do mapa: vale entre encostas em cima e embaixo; nas laterais só longe da trilha.
 const wallAt=(x,y)=>{
  const top=y+(fbm(x/14,1,s,2)-.5)*5,bottom=H-y+(fbm(x/14,9,s+3,2)-.5)*5,side=Math.min(x,W-x)+(fbm(3,y/14,s+5,2)-.5)*4;
  const riverSide=B.river?riverY.side:0;
  return Math.max(riverSide<0?0:B.wall*smooth(7,1.5,top),riverSide>0?0:B.wall*smooth(7,1.5,bottom),B.wall*smooth(6,1,side));
 };
 // Rio da Conquista: corre pela margem com mais espaço, abaixo ou acima dos grupos.
 const meanY=plan.route.reduce((a,p)=>a+p.y,0)/plan.route.length,riverY={side:meanY<H/2?1:-1};
 riverY.at=x=>(riverY.side>0?H-8:8)+Math.sin(x*.08+s)*2.4;
 // Lagoas e charcos escolhidos antes do relevo: só onde há folga para a água inteira.
 const ponds=[];
 const findSpot=(r,tries=400,extra=()=>true)=>{for(let t=0;t<tries;t++){const x=between(r+3,W-r-3),y=between(r+3,H-r-3);if(clear(x,y,r+1.5)&&ponds.every(p=>Math.hypot(x-p.x,y-p.y)>Math.max(p.rx,p.ry)+r+4)&&extra(x,y))return {x,y};}return null;};
 for(let i=0;i<B.ponds;i++){const rx=between(6,9),ry=rx*between(.6,.8),at=findSpot(rx);if(at)ponds.push({...at,rx,ry,depth:between(1.4,2),seed:i*7});}
 for(let i=0;i<B.pools;i++){const rx=between(2.2,4.2),ry=rx*between(.6,.95),at=findSpot(rx*.6,120);if(at)ponds.push({...at,rx,ry,depth:.55,seed:30+i,shallow:true});}
 const height=(x,y)=>{
  const k=keep(x,y),detail=fbm(x/9,y/9,s+11,2)-.5;
  let h=.35+Math.max(0,fbm(x/24,y/24,s+7,3)-.42)*B.hills*2+detail*.2;
  if(biome==='desert')h+=Math.max(0,Math.sin(x*.21+fbm(x/30,y/30,s+13,2)*6)*.5)*smooth(.35,.7,fbm(x/40,y/40,s+17,2))*1.2;
  h=Math.max(h,wallAt(x,y));
  for(const p of ponds){const e=Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry)*(1+(fbm(x/8,y/8,s+p.seed,2)-.5)*.3);if(e<1.35){const shore=Math.min(h,.28);h=e>=1?mix(shore,h,smooth(1,1.35,e)):-p.depth*(1-e*e)**.85;}}
  if(B.river){const d=Math.abs(y-riverY.at(x));if(d<8)h=d<4?-1.7*(1-(d/4)**2)**.8:mix(Math.min(h,.25),h,smooth(4,8,d));}
  return clamp(mix(h,.32+detail*.08,k),-3,8);
 };
 const size={w:W,h:H},grid=gridFor(size),n=grid.cols*grid.rows,x0=0,y0=0,hs=new Float32Array(n),ss=new Uint8Array(n);
 for(let j=0;j<grid.rows;j++)for(let i=0;i<grid.cols;i++){
  const x=x0+i*grid.cell,y=y0+j*grid.cell;hs[j*grid.cols+i]=height(x,y);
 }
 const at=(x,y)=>{const fx=clamp(x,0,W),fy=clamp(y,0,H),i=Math.min(grid.cols-2,Math.floor(fx/grid.cell)),j=Math.min(grid.rows-2,Math.floor(fy/grid.cell)),u=fx/grid.cell-i,v=fy/grid.cell-j,a=j*grid.cols+i,c=a+grid.cols;return (hs[a]*(1-u)+hs[a+1]*u)*(1-v)+(hs[c]*(1-u)+hs[c+1]*u)*v;};
 const slope=(x,y)=>Math.hypot(at(x+1,y)-at(x-1,y),at(x,y+1)-at(x,y-1))/2;
 // --- Peças ---
 const objects=[],placed=[];
 const raw=(type,x,y,extra={})=>{objects.push({id:'x'+objects.length,type,x:r2(x-W/2),y:r2(y-H/2),...extra});};
 // `put`: só onde há folga, chão seco e espaço livre de outras peças com colisão.
 const put=(type,x,y,extra={},{r=.6,solid=true,wet=false,steep=.7}={})=>{
  if(!clear(x,y,solid?r:Math.min(r,.4)))return false;
  const h=at(x,y);if(!wet&&h<.18||wet&&(h>.3||h<-2.5)||slope(x,y)>steep)return false;
  if(solid&&placed.some(p=>Math.hypot(x-p.x,y-p.y)<p.r+r+.3))return false;
  if(solid)placed.push({x,y,r});raw(type,x,y,extra);return true;
 };
 const deco=(type,x,y,extra={},o={})=>put(type,x,y,extra,{r:.4,solid:false,...o});
 const tomb=()=>['mossy_tomb_a','mossy_tomb_b','mossy_tomb_c'][Math.floor(random()*3)];
 const rot=()=>Math.round(between(0,360));
 // Trilha e brasas: mesma trilha do gerador antigo, agora pintada no chão.
 lines.slice(0,1+(plan.branches?.length||0)).forEach((l,i)=>{const route=i?plan.branches[i-1]:plan.route;for(let x=route[0].x-(i?0:8);x<=route.at(-1).x+(i?0:8);x+=2.4){const px=clamp(x,0,W);raw('path',px,routeYAt(route,px),{r:i?1.9:2.4});}});
 const braziers=[];for(let x=8;x<W;x+=16){const y=r2(routeYAt(plan.route,x)+4.5);braziers.push({x,y});raw('brazier',x,y);}
 // Entrada: placa e marcos; saída: clareira do chefe cercada de colunas partidas e brasas.
 raw('signpost',entry.x+2,entry.y-4.6,{r:.2,h:2});
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2+.35,x=boss.x+Math.cos(a)*12.5,y=boss.y+Math.sin(a)*10.5;if(x>W-1.5||x<1.5||y<1.5||y>H-1.5||routeDist(x,y)<4)continue;if(i%3===0)raw('brazier',x,y);else{raw(i%2?'broken_column':'column',x,y,{r:.7,h:i%2?r2(between(1.4,2.2)):r2(between(3.4,4.2))});placed.push({x,y,r:.7});}}
 raw(biome==='grave'||biome==='swamp'?'obelisk':'statue',boss.x+7,boss.y-(boss.y>H/2?8.5:-8.5),biome==='grave'||biome==='swamp'?{r:.7,h:4.4}:{r:.8,h:3.4});
 // Rochedos ao longo das encostas da borda: escondem o degrau do relevo e fecham o vale.
 for(let x=2;x<W-1;x+=between(3.2,5.2))for(const top of [true,false]){
  if(B.river&&(riverY.side>0)!==top)continue;
  const y=top?between(1.6,4.2):H-between(1.6,4.2),big=chance(.65);
  if(biome==='desert'||biome==='mountain'||biome==='snow'||big)put(big?'cliff':'boulder',x,y,big?{r:r2(between(1.6,2.6)),h:r2(between(2.6,4.4)),rot:rot()}:{r:r2(between(.8,1.4)),h:r2(between(1,1.8))},{r:big?2:1.1,steep:9});
 }
 // Lugares: cada um ocupa um bolsão longe da trilha e dos grupos; peças que não cabem são omitidas.
 const sites=[];
 const spot=r=>{for(let t=0;t<500;t++){const x=between(r,W-r),y=between(r,H-r);if(!clear(x,y,r*.55))continue;if(ponds.some(p=>Math.hypot(x-p.x,y-p.y)<Math.max(p.rx,p.ry)+r))continue;if(sites.some(q=>Math.hypot(x-q.x,y-q.y)<q.r+r+5))continue;if(B.river&&Math.abs(y-riverY.at(x))<r+5)continue;return {x,y,r};}return null;};
 const toward=(cx,cy)=>{const ry=routeYAt(plan.route,cx);return cy<ry?1:-1;};
 const SITES={
  graveyard(c){const f=toward(c.x,c.y),hw=6,hd=4;
   for(const [x,y,w,turn] of [[c.x,c.y-hd*f,hw*2,0],[c.x-hw,c.y,hd*2,90],[c.x+hw,c.y,hd*2,90],[c.x-hw*.6,c.y+hd*f,hw*.8,0],[c.x+hw*.6,c.y+hd*f,hw*.8,0]])
    for(let k=0;k<w;k+=4){const along=k-w/2+2,px=turn?x:x+along,py=turn?y+along:y;if(chance(.82))put('stone_wall',px,py,{w:4,d:.8,h:r2(between(1,1.5)),rot:turn+Math.round(between(-6,6))},{r:1.2});}
   for(let i=-2;i<=2;i++)for(let j=-1;j<=1;j++)if(chance(.8))deco(chance(.25)?'grave_cross':tomb(),c.x+i*2.2+between(-.3,.3),c.y+j*2.3,{s:r2(between(.85,1.15)),rot:Math.round(between(-12,12))});
   put('dead_tree',c.x+hw-1.2,c.y-hd*f+1.2*f,{r:.4,h:r2(between(3.6,4.8))},{r:.5});deco('skulls',c.x+between(-3,3),c.y+between(-2,2),{s:1});put('ruined_lamp',c.x,c.y+(hd+1)*f,{r:.18,h:2.7},{r:.3});},
  mausoleum(c){for(const [dx,dy] of [[-3,-2.5],[3,-2.5],[-3,2.5],[3,2.5]])put('column',c.x+dx,c.y+dy,{r:.55,h:r2(between(3,3.6))},{r:.6});
   deco('sarcophagus',c.x,c.y,{s:1.1},{r:.9});deco('crypt_altar',c.x,c.y-1.8,{s:.9});for(const dx of [-4.5,4.5])deco('brazier',c.x+dx,c.y);for(let i=0;i<5;i++)deco(tomb(),c.x+between(-6,6),c.y+between(-5,5),{s:r2(between(.8,1.1)),rot:rot()});put('statue',c.x,c.y-4.5,{r:.8,h:3.4},{r:.85});},
  shrine(c){const n=6+Math.floor(random()*3);for(let i=0;i<n;i++){const a=i/n*Math.PI*2+between(0,.4);put(i%3?'broken_column':'column',c.x+Math.cos(a)*5,c.y+Math.sin(a)*5,{r:.7,h:i%3?r2(between(1.2,2.2)):r2(between(3.4,4.2))},{r:.75});}
   put(chance(.5)?'obelisk':'statue',c.x,c.y,{r:.75,h:4},{r:.8});deco('brazier',c.x+2,c.y+2);deco('skulls',c.x-2,c.y+1.5,{s:1});if(biome!=='desert')deco('grave_cross',c.x+3,c.y-2,{s:1});},
  ruins(c){deco('arch',c.x,c.y,{s:r2(between(1,1.2)),rot:rot()},{r:1.2});for(let i=0;i<4;i++)put('stone_wall',c.x+between(-6,6),c.y+between(-5,5),{w:r2(between(3,5)),d:.8,h:r2(between(.8,1.8)),rot:rot()},{r:1.4});
   for(let i=0;i<3;i++)put('broken_column',c.x+between(-5,5),c.y+between(-5,5),{r:.7,h:r2(between(1,2.2))},{r:.75});deco('rubble',c.x+between(-3,3),c.y+between(-3,3),{s:1});if(biome==='desert')deco('bone_pile',c.x+between(-4,4),c.y+between(-4,4),{s:1});},
  camp(c){const n=2+Math.floor(random()*2);for(let i=0;i<n;i++){const a=i/n*Math.PI*2+between(0,1);put('tent',c.x+Math.cos(a)*4.4,c.y+Math.sin(a)*4.4,{r:1.6,h:2.2,rot:Math.round(-a*180/Math.PI+90)},{r:1.7});}
   put('campfire',c.x,c.y,{r:.55,h:.6},{r:.6});put('log_pile',c.x+between(-2.5,2.5),c.y+2.6,{w:3,d:1.4,h:1.2,rot:rot()},{r:1.5});deco('crate',c.x-2,c.y-1.6,{s:1});deco('barrel',c.x+2,c.y-1.6,{s:1});deco('banner',c.x+3.2,c.y+1.2,{s:1});if(biome!=='snow')put('hay',c.x-3,c.y+2,{r:.6,h:.9},{r:.6});},
  watchpost(c){put('watchtower',c.x,c.y,{r:1.4,h:6},{r:1.5});const f=toward(c.x,c.y);for(let i=-2;i<=2;i++){if(!i)continue;put('palisade',c.x+i*3.4,c.y-3.4*f,{w:3.6,d:.5,h:2.4},{r:1.4});}
   deco('brazier',c.x+2.4,c.y+2.4*f);deco('crate',c.x-2.2,c.y+1.8*f,{s:1.1});put('hay',c.x+3.6,c.y,{r:.6,h:.9},{r:.6});},
  wreck(c){const a=rot();put('open_cart',c.x,c.y,{w:3,d:5.3,h:1.5,rot:a},{r:2.2});deco('wheel',c.x+2.8,c.y+1.6,{s:1});for(let i=0;i<3;i++)deco('crate',c.x+between(-3.5,3.5),c.y+between(-3.5,3.5),{s:r2(between(.9,1.2))});
   deco('barrel',c.x-2.6,c.y-2,{s:1});deco('bone_pile',c.x+between(-4,4),c.y+between(-4,4),{s:1});deco('skulls',c.x+between(-3,3),c.y+between(-3,3),{s:1});},
  nest(c){for(let i=0;i<3;i++)deco('spider_web',c.x+between(-4,4),c.y+between(-4,4),{s:r2(between(.9,1.3)),rot:rot()},{r:1});for(let i=0;i<4;i++)deco('egg_sac',c.x+between(-3,3),c.y+between(-3,3),{s:r2(between(.8,1.2))});
   deco('bone_pile',c.x+between(-3,3),c.y+between(-3,3),{s:1});put('dead_tree',c.x,c.y,{r:.4,h:r2(between(3.8,4.8))},{r:.5});},
  stones(c){const n=7;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;put(i%2?'cairn':'boulder',c.x+Math.cos(a)*4.6,c.y+Math.sin(a)*4.6,i%2?{r:.5,h:.9}:{r:.8,h:r2(between(1.6,2.4))},{r:.85});}put('obelisk',c.x,c.y,{r:.7,h:4.4},{r:.75});deco('brazier',c.x+1.6,c.y+1.6);},
  oasis(c){const rx=4.5,ry=3.4;ponds.push({x:c.x,y:c.y,rx,ry,depth:1.2,seed:91});
   for(let i=0;i<14;i++){const a=i/14*Math.PI*2,k=between(1.05,1.25);raw('reeds',c.x+Math.cos(a)*rx*k,c.y+Math.sin(a)*ry*k,{s:r2(between(.8,1.2))});}
   for(let i=0;i<4;i++){const a=between(0,6.28),k=between(1.6,1.9);put('oak',c.x+Math.cos(a)*rx*k,c.y+Math.sin(a)*ry*k,{r:.45,h:r2(between(4,5))},{r:.5});}put('tent',c.x+rx+3,c.y,{r:1.6,h:2.2},{r:1.7});},
  farm(c){put('house',c.x,c.y,{r:2,h:3},{r:2.3});const f=toward(c.x,c.y);for(let i=-1;i<=1;i++)put('fence',c.x+i*3.2,c.y+4.4*f,{w:3,d:.2,h:1},{r:1.2});
   put('hay',c.x+4,c.y-1,{r:.6,h:.9},{r:.6});put('hay',c.x+4.6,c.y+.6,{r:.6,h:.9},{r:.6});if(chance(.5))put('ruined_well',c.x-4.2,c.y+1,{r:1,h:2.7},{r:1.1});else put('open_cart',c.x-4.4,c.y,{w:3,d:5.3,h:1.5,rot:rot()},{r:2});
   deco('barrel',c.x+2.6,c.y+2.6*f,{s:1});deco('crate',c.x-2.6,c.y+2.6*f,{s:1});put('ruined_lamp',c.x+1.5,c.y+4.6*f,{r:.18,h:2.7},{r:.3});},
  market(c){put('market_stall',c.x-3,c.y,{w:3,d:2,h:2.4},{r:1.6});put('market_stall',c.x+3,c.y,{w:3,d:2,h:2.4},{r:1.6});put('ruined_well',c.x,c.y+3.6,{r:1,h:2.7},{r:1.1});
   for(let i=0;i<4;i++)deco(i%2?'barrel':'crate',c.x+between(-5,5),c.y+between(-4,-2),{s:1});deco('bench',c.x+4.6,c.y+3,{s:1});deco('banner',c.x-4.6,c.y+3,{s:1});},
  orchard(c){for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)put('oak',c.x+i*4,c.y+j*3.6,{r:.45,h:r2(between(3.6,4.4))},{r:.5});put('fence',c.x,c.y+6,{w:3,d:.2,h:1},{r:1.2});},
  hut(c){put('tent',c.x,c.y,{r:1.6,h:2.2},{r:1.7});put('campfire',c.x+2.6,c.y+1,{r:.55,h:.6},{r:.6});for(let i=0;i<4;i++)deco(tomb(),c.x+between(-5,5),c.y+between(-5,5),{s:r2(between(.8,1.1)),rot:rot()});deco('mushrooms',c.x-2.4,c.y+2,{s:1.2});deco('bone_pile',c.x+between(-3,3),c.y-2.6,{s:1});}
 };
 for(const name of B.sites){const c=spot(name==='graveyard'||name==='ruins'?7:6);if(!c)continue;sites.push(c);SITES[name](c);}
 // Margens: juncos e pedras em volta da água; nenúfares no raso.
 for(const p of ponds){const count=Math.round((p.rx+p.ry)*(p.shallow?1.2:2.2));for(let i=0;i<count;i++){const a=i/count*Math.PI*2+between(0,.2),k=between(.95,1.12),x=p.x+Math.cos(a)*p.rx*k,y=p.y+Math.sin(a)*p.ry*k;if(chance(.8))deco('reeds',x,y,{s:r2(between(.8,1.3))},{wet:true,steep:9});else put('shore_rock',x,y,{r:r2(between(.5,.8)),h:r2(between(.4,.7))},{r:.6,wet:true,steep:9});}
  if(biome!=='desert')for(let i=0;i<Math.round(count*.3);i++){const a=between(0,6.28),k=between(.3,.7);deco('lily',p.x+Math.cos(a)*p.rx*k,p.y+Math.sin(a)*p.ry*k,{s:r2(between(.8,1.3))},{wet:true,steep:9});}}
 if(B.river)for(let x=4;x<W-4;x+=between(2.4,4)){const side=chance(.5)?1:-1,y=riverY.at(x)+side*between(3.8,4.6);if(chance(.75))deco('reeds',x,y,{s:r2(between(.8,1.3))},{wet:true,steep:9});else deco('lily',x,riverY.at(x)+between(-2,2),{s:1.1},{wet:true,steep:9});}
 if(B.river){const x=between(30,W-30),y=riverY.at(x)-riverY.side*5.2;put('dock',x,y+riverY.side*2.6,{w:2.8,d:7},{r:1,solid:false,wet:true,steep:9});deco('bench',x+2,y-riverY.side*.8,{s:1});}
 // Mata: manchas por ruído, com pinheiros, carvalhos e árvores mortas conforme o bioma; sub-bosque em volta.
 const tree=(x,y)=>{const roll=random(),kind=roll<B.dead?'dead_tree':roll<B.dead+B.pine?'pine':'oak',scale=random();
  const ok=kind==='dead_tree'?put(kind,x,y,{r:.4,h:r2(3.4+scale*1.6)},{r:.45}):put(kind,x,y,{r:.45,h:r2((kind==='pine'?5:4.3)+scale*2.1)},{r:.5});
  if(ok&&biome!=='desert'&&biome!=='snow'&&chance(.22))deco(chance(.6)?'bush':'fern',x+between(-1.8,1.8),y+between(1,2),chance(.6)?{r:r2(between(.5,.9))}:{s:r2(between(.9,1.4))});return ok;};
 for(let gx=2;gx<W;gx+=3.6)for(let gy=2;gy<H;gy+=3.6){const x=gx+between(-1.4,1.4),y=gy+between(-1.4,1.4),woods=fbm(x/26,y/26,s+23,3);if(woods<B.woods)continue;tree(x,y);}
 // Árvores soltas pelos campos, para a mata não terminar em linha.
 for(let n=0,t=0;n<(biome==='desert'?7:18)&&t<400;t++){const x=between(2,W-2),y=between(2,H-2);if(tree(x,y))n++;}
 // Pedras, enfeites do chão e restos.
 for(let n=0,t=0;n<B.rocks&&t<600;t++){const x=between(2,W-2),y=between(2,H-2),big=chance(.3);if(put(big?'cliff':'boulder',x,y,big?{r:r2(between(1.3,2)),h:r2(between(2,3.2)),rot:rot()}:{r:r2(between(.6,1.2)),h:r2(between(.7,1.4))},{r:big?1.6:1,steep:1.2}))n++;}
 const scatter=(type,count,extra)=>{for(let n=0,t=0;n<count&&t<count*12;t++)if(deco(type,between(2,W-2),between(2,H-2),typeof extra==='function'?extra():extra))n++;};
 const sz=(a,b)=>()=>({s:r2(between(a,b))}),bush=()=>({r:r2(between(.5,1))});
 // Afloramentos: um rochedo com matacões em volta, para o campo aberto ganhar volume.
 const outcrops=count=>{for(let n=0,t=0;n<count&&t<count*30;t++){const x=between(6,W-6),y=between(6,H-6);if(!put('cliff',x,y,{r:r2(between(1.6,2.3)),h:r2(between(2.4,3.6)),rot:rot()},{r:2,steep:1.2}))continue;n++;
  for(let k=0;k<4;k++){const a=between(0,6.28),d=between(2.6,4);if(chance(.7))put('boulder',x+Math.cos(a)*d,y+Math.sin(a)*d,{r:r2(between(.6,1.1)),h:r2(between(.7,1.3))},{r:1,steep:1.2});else deco('grass_tuft',x+Math.cos(a)*d,y+Math.sin(a)*d,{s:1});}}};
 const DRESS={
  grave:()=>{scatter(tomb(),10,()=>({s:r2(between(.8,1.1)),rot:rot()}));scatter('grave_cross',6,sz(.9,1.1));scatter('skulls',8,sz(.9,1.1));scatter('bone_pile',4,sz(.8,1.1));scatter('grass_tuft',60,sz(.8,1.2));scatter('mushrooms',8,sz(.8,1.2));},
  forest:()=>{scatter('bush',30,bush);scatter('fern',24,sz(.9,1.4));scatter('mushrooms',12,sz(.8,1.3));scatter('flowers',18,sz(.9,1.4));for(let i=0;i<5;i++)put('log',between(4,W-4),between(4,H-4),{w:3.6,d:.7,h:.7},{r:1.8});for(let i=0;i<4;i++)put('stump',between(4,W-4),between(4,H-4),{r:.4,h:.55},{r:.45});},
  desert:()=>{outcrops(9);scatter('bush',22,bush);scatter('grass_tuft',70,sz(.8,1.2));scatter('bone_pile',10,sz(.8,1.2));scatter('skulls',8,sz(.9,1.1));scatter('wheel',3,sz(.9,1.1));for(let i=0;i<6;i++)put('broken_column',between(4,W-4),between(4,H-4),{r:.7,h:r2(between(.8,1.6))},{r:.75});},
  snow:()=>{outcrops(5);for(let i=0;i<10;i++)put('cairn',between(4,W-4),between(4,H-4),{r:.5,h:.9},{r:.55});scatter('bone_pile',3,sz(.8,1));for(let i=0;i<5;i++)put('log',between(4,W-4),between(4,H-4),{w:3.6,d:.7,h:.7},{r:1.8});},
  village:()=>{scatter('bush',22,bush);scatter('flowers',24,sz(.9,1.4));scatter('crate',6,sz(.9,1.1));scatter('barrel',5,sz(.9,1.1));for(let i=0;i<8;i++)put('fence',between(4,W-4),between(4,H-4),{w:3,d:.2,h:1,rot:rot()},{r:1.2});scatter('wheel',2,sz(.9,1));},
  swamp:()=>{scatter('mushrooms',18,sz(.9,1.5));scatter(tomb(),8,()=>({s:r2(between(.8,1.1)),rot:rot()}));scatter('fern',16,sz(.9,1.3));scatter('bush',16,bush);scatter('skulls',5,sz(.9,1.1));},
  river:()=>{scatter('bush',24,bush);scatter('fern',14,sz(.9,1.3));scatter('flowers',20,sz(.9,1.4));scatter('grass_tuft',90,sz(.8,1.2));},
  mountain:()=>{outcrops(8);for(let i=0;i<12;i++)put('cairn',between(4,W-4),between(4,H-4),{r:.5,h:.9},{r:.55});scatter('grass_tuft',40,sz(.7,1));scatter('bone_pile',3,sz(.8,1));}
 };
 DRESS[biome]?.();
 // Cairns marcam a trilha nas montanhas e na neve; placas nos vilarejos.
 if(biome==='mountain'||biome==='snow')for(let x=20;x<W-12;x+=24){const y=routeYAt(plan.route,x)-5.6;put('cairn',x,y,{r:.5,h:.9},{r:.55});}
 if(biome==='village')for(let x=30;x<W-20;x+=40)put('signpost',x,routeYAt(plan.route,x)-5.2,{r:.2,h:2},{r:.3});
 // A grade de relevo é feita depois das peças: a lagoa do oásis entra nela também.
 for(let j=0;j<grid.rows;j++)for(let i=0;i<grid.cols;i++){const k=j*grid.cols+i,x=i*grid.cell,y=j*grid.cell,v=height(x,y);hs[k]=v;}
 return {id:'expedition-'+plan.wave+'-'+biome,name:'Expedição',biome,size,start:{x:entry.x-W/2,y:entry.y-H/2},level:1,spawns:[],objects,
  terrain:closeGrid({...grid,x0:-W/2,y0:-H/2,h:hs,s:ss},[]),style:EXPEDITION_STYLES[biome]||null};
}
// Altura da trilha no ponto x (mesma conta de ExpeditionModel.routeY).
function routeYAt(route,x){let i=1;while(i<route.length-1&&x>route[i].x)i++;const a=route[i-1],b=route[i],t=Math.max(0,Math.min(1,(x-a.x)/(b.x-a.x)));return a.y+(b.y-a.y)*t;}
