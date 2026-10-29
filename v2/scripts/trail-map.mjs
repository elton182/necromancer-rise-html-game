// Trilha dos Vigias (fase 3): dados puros do mapa. Faixa de 150 × 6,4 u com quatro clareiras de emboscada.
// `solids` só traz obstáculos nas bordas das clareiras; as barricadas das emboscadas entram em campaign.mjs (`lock`).
// `decor` é visual: mata outono ao norte (longe da câmera), cerca e arbustos baixos ao sul, torres, tendas e paliçada.
export const TRAIL_ID='campaign-strip';
export const TRAIL_BOUNDS={minX:0,maxX:150,minY:-3.4,maxY:3};
export const TRAIL_START={x:2.5,y:0};
const AMBUSH_X=[24,50,78,108],CENTER=-.2;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick=(r,a,b)=>a+(b-a)*r(),f2=v=>+v.toFixed(2);

export function trailArena(){
 const random=rng(0x7A11),solids=[],decor={trees:[],bushes:[],grass:[],flowers:[],patches:[],path:[],mushrooms:[],towers:[],lanterns:[],fences:[],tents:[],camp:{fires:[],banners:[]},palisade:[]};
 // Rochas e tocos nas bordas das clareiras: nunca na faixa central |y| < 1,7, onde as ondas nascem e a horda se forma.
 for(const x of AMBUSH_X){
  for(const [dx,y,look,r,h]of [[-9,2.35,'rock',.6,.9],[-4,-2.45,'stump',.4,.55],[-1.5,2.5,'rock',.5,.8],[8.5,-2.5,'rock',.6,.9],[11.4,2.4,'stump',.38,.5]])
   solids.push({kind:'circle',look,x:f2(x+dx+pick(random,-.4,.4)),y,r,height:h});
 }
 // Trilha de terra batida seguindo o eixo; largura sorteada para parecer gasta.
 for(let x=-1;x<=151;x+=.85)decor.path.push({x:f2(x+pick(random,-.2,.2)),y:f2(CENTER+pick(random,-.55,.55)),r:f2(pick(random,1,1.7))});
 // Mata ao norte (atrás da trilha para a câmera), em quatro fileiras; recuada nas clareiras.
 const inAmbush=x=>AMBUSH_X.some(a=>Math.abs(x-a)<13);
 for(let row=0;row<4;row++)for(let x=-6;x<=156;x+=3.1){if(row===0&&inAmbush(x))continue;
  decor.trees.push({x:f2(x+pick(random,-1,1)),y:f2(-5.3-row*3.1+pick(random,-.8,.8)),look:random()<.5?'pine':'oak',height:f2(pick(random,5.5,9)),tone:f2(random())});}
 // Árvores altas só bem ao sul (fora da área onde esconderiam a trilha); mudas baixas junto à cerca.
 for(let row=0;row<2;row++)for(let x=-6;x<=156;x+=4.4)decor.trees.push({x:f2(x+pick(random,-1.4,1.4)),y:f2(12+row*4+pick(random,-1,1)),look:random()<.55?'pine':'oak',height:f2(pick(random,6,9)),tone:f2(random())});
 for(let x=-3;x<=153;x+=3.4)decor.trees.push({x:f2(x+pick(random,-1,1)),y:f2(pick(random,5.2,8)),look:random()<.4?'pine':'oak',height:f2(pick(random,2,3.2)),tone:f2(random())});
 // Cerca de estacas ao sul, com vãos; lanternas ao norte, a cada ~14 u.
 for(let x=1;x<149;x+=2.7)decor.fences.push({x:f2(x),y:3.55,w:2});
 for(let x=7;x<150;x+=14)decor.lanterns.push({x:f2(x),y:-3.75});
 // Torres de vigia junto às clareiras e ao acampamento final.
 for(const x of [...AMBUSH_X,142])decor.towers.push({x:f2(x-5),y:-8,height:f2(x===142?9:8)});
 // Acampamento do Capitão no fim da trilha: tendas, fogueira, estandartes e paliçada fora do limite.
 for(const [x,y,s] of [[136,-6.2,2.8],[141,-7.2,3.2],[146,-6,2.6],[139,7.8,1.9],[145,8.4,2]])decor.tents.push({x,y,size:s,tone:f2(random())});
 decor.camp.fires.push({x:4,y:2.3},{x:143,y:-3.2});
 for(const [x,y] of [[134,-4.2],[146.5,-4.2],[2.4,-4]])decor.camp.banners.push({x,y,tone:f2(random())});
 for(let y=-9;y<=9;y+=.9)decor.palisade.push({x:150.6,y:f2(y),height:f2(pick(random,3.6,4.6))});
 for(let n=0,tries=0;n<420&&tries<3000;tries++){const x=pick(random,0,150),y=pick(random,-3.3,2.9);decor.grass.push({x:f2(x),y:f2(y),height:f2(pick(random,.2,.55)),tone:f2(random())});n++;}
 for(let n=0;n<120;n++)decor.bushes.push({x:f2(pick(random,0,150)),y:f2(random()<.5?pick(random,3.7,4.6):pick(random,-4.2,-3.6)),size:f2(pick(random,.5,1)),tone:f2(random())});
 for(let n=0;n<70;n++)decor.flowers.push({x:f2(pick(random,0,150)),y:f2(pick(random,-3.2,2.8)),tone:f2(random())});
 for(let n=0;n<40;n++)decor.patches.push({x:f2(pick(random,0,150)),y:f2(pick(random,-3.2,2.8)),r:f2(pick(random,1.2,2.8)),tone:f2(random())});
 for(let n=0;n<26;n++)decor.mushrooms.push({x:f2(pick(random,0,150)),y:f2(random()<.5?pick(random,2.2,3):pick(random,-3.3,-2.4)),size:f2(pick(random,.12,.2))});
 return {id:TRAIL_ID,theme:'trail',autumn:true,bounds:{...TRAIL_BOUNDS},solids,decor};
}
