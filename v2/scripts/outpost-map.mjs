// Posto do Capitão (fase 4): dados puros do mapa do chefe. Arena 40 × 40 com o centro livre para o Rei Caído.
// `solids` ficam nas bordas (|x| > 7 e longe da linha entre o jogador e o chefe); paliçada, torres e mata são visuais.
export const OUTPOST_ID='campaign-outpost';
export const OUTPOST_START={x:0,y:10},OUTPOST_BOSS={x:0,y:-12};
const BOUNDS={minX:-20,maxX:20,minY:-20,maxY:20};
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick=(r,a,b)=>a+(b-a)*r(),f2=v=>+v.toFixed(2);
// Tendas: o colisor aproxima a pirâmide (≈85% da base desenhada, 1,6 × 1,3 do tamanho).
const tent=(x,y,size,tone)=>({kind:'box',look:'tent',x,y,width:f2(size*1.6*.85),depth:f2(size*1.3*.85),height:size,size,tone});

export function outpostArena(){
 const random=rng(0x0B05),solids=[
  tent(-16.5,-5,3,.1),tent(-16.8,3.6,3.2,.55),tent(16.6,-6.6,3.1,.8),tent(16.4,2.6,2.9,.3),
  {kind:'circle',look:'fire',x:-9,y:8,r:.55,height:.5},{kind:'circle',look:'fire',x:9,y:8,r:.55,height:.5},
  ...[[-9.5,-5.5],[9.5,-5.5],[-10,6.5],[10,5.5]].map(([x,y])=>({kind:'circle',look:'brazier',x,y,r:.28,height:1.5})),
  {kind:'box',look:'crate',x:-13.2,y:-17.6,width:1.3,depth:1.3,height:1.1},{kind:'box',look:'crate',x:-11.9,y:-18.4,width:1,depth:1,height:.9},
  {kind:'box',look:'crate',x:13.2,y:-17.6,width:1.3,depth:1.3,height:1.1},{kind:'box',look:'crate',x:11.9,y:-18.4,width:1,depth:1,height:.9},
  {kind:'box',look:'rack',x:-8.8,y:-19.1,width:2.4,depth:.5,height:1.5},{kind:'box',look:'rack',x:8.8,y:-19.1,width:2.4,depth:.5,height:1.5},
  {kind:'box',look:'wagon',x:-12.5,y:17.2,width:3.4,depth:1.7,height:1.3},
  {kind:'circle',look:'hay',x:12.4,y:17.3,r:.65,height:.8},{kind:'circle',look:'hay',x:13.8,y:16.6,r:.6,height:.75},{kind:'circle',look:'hay',x:13.2,y:18.3,r:.6,height:.75},
  {kind:'circle',look:'barrel',x:17.2,y:12.6,r:.36,height:.9},{kind:'circle',look:'barrel',x:17.9,y:13.6,r:.36,height:.9},{kind:'circle',look:'barrel',x:16.5,y:13.6,r:.36,height:.9}
 ];
 const decor={trees:[],bushes:[],grass:[],flowers:[],patches:[],path:[],mushrooms:[],towers:[],tents:solids.filter(s=>s.look==='tent').map(s=>({x:s.x,y:s.y,size:s.size,tone:s.tone})),camp:{fires:[],banners:[]},palisade:[],straw:[],pebbles:[],dais:{x:OUTPOST_BOSS.x,y:OUTPOST_BOSS.y,r:5.2},gate:{x:0,y:-20.8}};
 decor.camp.fires=solids.filter(s=>s.look==='fire').map(s=>({x:s.x,y:s.y}));
 for(const x of [-14,-8.5,8.5,14])decor.camp.banners.push({x,y:-19.7,tone:f2(random())});
 // Paliçada: norte/oeste altas (longe da câmera), sul/leste baixas para não esconder a borda; o norte tem vão do portão.
 for(let t=-21;t<=21;t+=.9){
  if(Math.abs(t)>2.4)decor.palisade.push({x:f2(t),y:-20.8,height:f2(pick(random,3.8,4.8))});
  decor.palisade.push({x:-20.8,y:f2(t),height:f2(t>16?pick(random,1.9,2.5):pick(random,3.8,4.8))},{x:f2(t),y:20.8,height:f2(pick(random,1.9,2.5))},{x:20.8,y:f2(t),height:f2(pick(random,1.9,2.5))});
 }
 for(const [x,y,h] of [[-5.2,-23.6,8],[5.2,-23.6,8],[-23.6,-8,8],[-23.6,10,8],[23.6,-16,8]])decor.towers.push({x,y,height:h});
 // Mata só ao norte e a oeste, depois da paliçada: ao sul/leste copas altas esconderiam a arena.
 for(let row=0;row<3;row++)for(let t=-30;t<=30;t+=3.4){
  decor.trees.push({x:f2(t+pick(random,-1,1)),y:f2(-27-row*3.2+pick(random,-.8,.8)),look:random()<.6?'pine':'oak',height:f2(pick(random,6,9.5)),tone:f2(random())});
  if(t>-23&&t<23)decor.trees.push({x:f2(-27-row*3.2+pick(random,-.8,.8)),y:f2(t+pick(random,-1,1)),look:random()<.6?'pine':'oak',height:f2(pick(random,6,9.5)),tone:f2(random())});
 }
 const free=(x,y,r)=>solids.every(s=>Math.hypot(x-s.x,y-s.y)>r+(s.kind==='box'?Math.max(s.width,s.depth)/2:s.r)+.2);
 for(let n=0,tries=0;n<26&&tries<400;tries++){const x=pick(random,-18,18),y=pick(random,-18,18);decor.patches.push({x:f2(x),y:f2(y),r:f2(pick(random,1.2,3)),tone:f2(random())});n++;}
 for(let n=0,tries=0;n<140&&tries<1400;tries++){const x=pick(random,-19,19),y=pick(random,-19,19);if(Math.hypot(x-OUTPOST_BOSS.x,y-OUTPOST_BOSS.y)<5.6||!free(x,y,.1))continue;decor.straw.push({x:f2(x),y:f2(y),height:f2(pick(random,.2,.45)),tone:f2(random())});n++;}
 for(let n=0,tries=0;n<90&&tries<900;tries++){const x=pick(random,-19,19),y=pick(random,-19,19);if(!free(x,y,.15))continue;decor.pebbles.push({x:f2(x),y:f2(y),size:f2(pick(random,.08,.2)),tone:f2(random())});n++;}
 return {id:OUTPOST_ID,theme:'outpost',autumn:true,bounds:{...BOUNDS},solids,decor};
}
