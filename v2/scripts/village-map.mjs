// Vila de Eldrin: dados puros do mapa. Colisores em `solids`; `decor` (ruas, pedras, vegetação) é só visual.
// Os pontos de interação (NPCs, portal, mercador) vêm de campaign.mjs; este layout os deixa livres e acessíveis.
export const VILLAGE_ID='village';
export const VILLAGE_START={x:0,y:9};
const BOUNDS={minX:-20,maxX:20,minY:-20,maxY:20};
// Ruas retangulares (cobble|dirt) e praça circular. Só desenho: o chão é todo caminhável.
export const VILLAGE_ROADS=[
 {kind:'cobble',x0:-2.5,x1:2.5,y0:-10.6,y1:15.6},
 {kind:'cobble',x0:-13.2,x1:13.2,y0:-1,y1:3},
 {kind:'dirt',x0:-17.5,x1:17.5,y0:-12.6,y1:-11},
 {kind:'dirt',x0:-9,x1:-5,y0:-11,y1:-1},
 {kind:'dirt',x0:5,x1:11,y0:-11,y1:-7.2}
];
export const VILLAGE_PLAZA={x:0,y:2,r:6.5};
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick=(r,a,b)=>a+(b-a)*r(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const house=(x,y,width,depth,height,tone,extra={})=>({kind:'box',look:'house',x,y,width,depth,height,tone,...extra});
const SOLIDS=[
 // Fileira ao norte, com o corredor do portal livre ao centro.
 house(-15,-14.5,6,4.6,3,.1,{chimney:true}),house(-7.5,-15.5,5,4,2.8,.6),house(7.5,-15.5,5,4,2.8,.35),house(15,-14.5,6,4.6,3.1,.85,{chimney:true}),
 // Oeste (ferraria de Bram) e leste (casa de Lysa), de frente para a rua principal.
 house(-14.5,-2.2,6,4.5,3.2,.45,{chimney:true,smithy:true}),house(14.5,-2.2,6,4.5,2.8,.9,{chimney:true}),
 house(-14.5,8.5,5.5,5,3,.25),house(14.5,8.5,5.5,5,3,.7,{chimney:true}),
 house(-14,16.5,6,4.5,2.9,.8),house(14,16.5,6,4.5,2.9,.15),
 // Estalagem fecha a rua principal ao sul.
 house(0,17.5,10,4,3.5,.55,{chimney:true,inn:true}),
 // Feira do mercador (8,-6), quadro do mapa (-6,-8) e portal (0,-9).
 {kind:'box',look:'stall',x:8,y:-7.6,width:3.4,depth:1.4,height:2.1,tone:.2},{kind:'box',look:'stall',x:12.5,y:-8.4,width:3,depth:1.3,height:2.1,tone:.7},
 {kind:'box',look:'board',x:-6,y:-9.2,width:1.8,depth:.35,height:1.6},
 {kind:'circle',look:'pillar',x:-2.4,y:-9.7,r:.45,height:3.2},{kind:'circle',look:'pillar',x:2.4,y:-9.7,r:.45,height:3.2},
 {kind:'circle',look:'well',x:0,y:2,r:.95,height:1.1},
 // Pedra do Infinito (6, 7.4): monólito ao sul da praça, de frente para a rua principal.
 {kind:'circle',look:'pillar',x:6,y:8.7,r:.55,height:2.8},
 // Postes, barris e caixas junto aos pontos de movimento.
 ...[[-3.4,7],[3.4,7],[-3.4,-4],[3.4,-4],[-8.6,3.3],[8.6,3.3],[-3.4,13],[3.4,13]].map(([x,y])=>({kind:'circle',look:'lamp',x,y,r:.18,height:2.6})),
 {kind:'circle',look:'barrel',x:5.4,y:-6.1,r:.36,height:.9},{kind:'circle',look:'barrel',x:5.9,y:-7.1,r:.36,height:.9},{kind:'circle',look:'barrel',x:10.4,y:-6.8,r:.36,height:.9},
 {kind:'box',look:'crate',x:-10.2,y:-3.4,width:.85,depth:.85,height:.8},{kind:'box',look:'crate',x:-9.8,y:-2.4,width:.7,depth:.7,height:.65},
 {kind:'box',look:'crate',x:11.2,y:-7.2,width:.8,depth:.8,height:.75},
 // Cercas de quintal ao sul das casas laterais.
 {kind:'box',look:'fence',x:-14.5,y:12.2,width:7,depth:.18,height:.65},{kind:'box',look:'fence',x:14.5,y:12.2,width:7,depth:.18,height:.65},
 {kind:'box',look:'fence',x:-11.1,y:11.2,width:.18,depth:2.2,height:.65},{kind:'box',look:'fence',x:11.1,y:11.2,width:.18,depth:2.2,height:.65},
 // Árvores e pedras nas bordas e entre as casas.
 {kind:'circle',look:'pine',x:-17.8,y:-8.6,r:.45,height:6},{kind:'circle',look:'pine',x:17.8,y:-8.8,r:.45,height:6.4},
 {kind:'circle',look:'oak',x:-18.2,y:4.6,r:.5,height:5.4},{kind:'circle',look:'oak',x:18.2,y:4.8,r:.5,height:5.6},
 {kind:'circle',look:'oak',x:-9.6,y:17.4,r:.5,height:5},{kind:'circle',look:'oak',x:9.6,y:17.5,r:.5,height:5.2},
 {kind:'circle',look:'pine',x:-3.8,y:-12.6,r:.4,height:5},{kind:'circle',look:'pine',x:3.8,y:-12.6,r:.4,height:5.2},
 {kind:'circle',look:'rock',x:-9,y:-11,r:.5,height:.8},{kind:'circle',look:'rock',x:10,y:-11.8,r:.6,height:.9},{kind:'circle',look:'rock',x:6.6,y:13,r:.45,height:.7}
];
const distance=(s,x,y)=>s.kind==='circle'?Math.hypot(x-s.x,y-s.y)-s.r:Math.hypot(x-clamp(x,s.x-s.width/2,s.x+s.width/2),y-clamp(y,s.y-s.depth/2,s.y+s.depth/2));
const onRoad=(x,y,m=0)=>VILLAGE_ROADS.some(r=>x>r.x0-m&&x<r.x1+m&&y>r.y0-m&&y<r.y1+m)||Math.hypot(x-VILLAGE_PLAZA.x,y-VILLAGE_PLAZA.y)<VILLAGE_PLAZA.r+m;

export function villageArena(){
 const random=rng(0x711A6E),solids=SOLIDS.map(s=>({...s})),free=(x,y,m)=>solids.every(s=>distance(s,x,y)>=m);
 const decor={trees:[],bushes:[],grass:[],flowers:[],patches:[],path:[],mushrooms:[],stones:[]};
 // Pedras de calçamento: textura barata sobre ruas de pedra e a praça.
 const cobbles=[...VILLAGE_ROADS.filter(r=>r.kind==='cobble'),{circle:VILLAGE_PLAZA}];
 for(const r of cobbles){const area=r.circle?Math.PI*r.circle.r**2:(r.x1-r.x0)*(r.y1-r.y0),count=Math.round(area*1.25);
  for(let n=0,tries=0;n<count&&tries<count*4;tries++){let x,y;if(r.circle){const a=random()*Math.PI*2,d=Math.sqrt(random())*r.circle.r;x=r.circle.x+Math.cos(a)*d;y=r.circle.y+Math.sin(a)*d;}else{x=pick(random,r.x0,r.x1);y=pick(random,r.y0,r.y1);}
   if(!free(x,y,.3))continue;decor.stones.push({x:+x.toFixed(2),y:+y.toFixed(2),size:+pick(random,.22,.42).toFixed(2),tone:+random().toFixed(2)});n++;}}
 // Anel de pedras claras marca a borda da praça.
 for(let i=0;i<46;i++){const a=i/46*Math.PI*2,x=VILLAGE_PLAZA.x+Math.cos(a)*(VILLAGE_PLAZA.r+.1),y=VILLAGE_PLAZA.y+Math.sin(a)*(VILLAGE_PLAZA.r+.1);if(!free(x,y,.3)||Math.abs(x)>19.5||Math.abs(y)>19.5)continue;decor.stones.push({x:+x.toFixed(2),y:+y.toFixed(2),size:.5,tone:1.1});}
 for(let n=0,tries=0;n<420&&tries<4000;tries++){const x=pick(random,-19.4,19.4),y=pick(random,-19.4,19.4);if(onRoad(x,y,.5)||!free(x,y,.35))continue;decor.grass.push({x:+x.toFixed(2),y:+y.toFixed(2),height:+pick(random,.2,.5).toFixed(2),tone:+random().toFixed(2)});n++;}
 for(let n=0,tries=0;n<90&&tries<1500;tries++){const x=pick(random,-19,19),y=pick(random,-19,19);if(onRoad(x,y,.4)||!free(x,y,.4))continue;decor.flowers.push({x:+x.toFixed(2),y:+y.toFixed(2),tone:+random().toFixed(2)});n++;}
 for(let n=0,tries=0;n<34&&tries<900;tries++){const x=pick(random,-19,19),y=pick(random,-19,19),r=pick(random,.4,.7);if(onRoad(x,y,.6)||!free(x,y,r+.4))continue;decor.bushes.push({x:+x.toFixed(2),y:+y.toFixed(2),size:+r.toFixed(2),tone:+random().toFixed(2)});n++;}
 for(let n=0;n<16;n++)decor.patches.push({x:+pick(random,-18,18).toFixed(2),y:+pick(random,-18,18).toFixed(2),r:+pick(random,1.2,3).toFixed(2),tone:+random().toFixed(2)});
 return {id:VILLAGE_ID,theme:'village',bounds:{...BOUNDS},solids,roads:VILLAGE_ROADS.map(r=>({...r})),plaza:{...VILLAGE_PLAZA},decor};
}
