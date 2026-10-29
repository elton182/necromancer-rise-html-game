// Floresta de Eldrin (fase 2): dados puros do mapa. Colisores em `solids`; `decor` é só visual.
// Layout determinístico: cada partida vê o mesmo terreno e a navegação pode ser testada.
export const FOREST_ID='campaign-forest';
export const FOREST_START={x:0,y:10},FOREST_SPAWN={x:0,y:-5};
const BOUNDS={minX:-20,maxX:20,minY:-20,maxY:20},GAP=1.8,EDGE=1.6;
// Áreas que precisam ficar livres: chegada do jogador, campo das ondas (fila em x±3,75 / y -7…-3) e a alameda entre os dois.
export const FOREST_KEEPOUT=[{x:0,y:10,r:5},{x:0,y:-5,r:7.2},{x:0,y:2.5,r:4.2}];
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick=(r,a,b)=>a+(b-a)*r();
// Marcos fixos dão referência ao jogador; o restante é sorteado entre eles.
const FIXED=[
 {look:'oak',x:-12,y:-3,r:.9,height:7},{look:'oak',x:11.5,y:5,r:.9,height:6.5},
 {look:'rock',x:-8,y:-10,r:1,height:1.5},{look:'rock',x:-6.4,y:-9.1,r:.6,height:.9},{look:'rock',x:-9.5,y:-8.5,r:.5,height:.7},
 {look:'rock',x:9,y:-11,r:1.1,height:1.7},{look:'rock',x:10.5,y:-9.9,r:.6,height:.9},
 {look:'rock',x:-14,y:9,r:.8,height:1.2},{look:'rock',x:15,y:-4,r:.7,height:1},
 {look:'stump',x:4.8,y:8.6,r:.35,height:.5},{look:'stump',x:-6,y:-1.5,r:.4,height:.55},
 {look:'log',kind:'box',x:-7.5,y:4,width:4,depth:.7,height:.7},{look:'log',kind:'box',x:8,y:-2,width:.7,depth:3.8,height:.7},{look:'log',kind:'box',x:-3.5,y:-13,width:3.4,depth:.7,height:.7}
];
const radius=s=>s.kind==='box'?Math.hypot(s.width,s.depth)/2:s.r;
const clearOf=(x,y,r,list,gap)=>list.every(s=>Math.hypot(x-s.x,y-s.y)-r-radius(s)>=gap);
const inKeepout=(x,y,r)=>FOREST_KEEPOUT.some(k=>Math.hypot(x-k.x,y-k.y)<k.r+r);

export function forestArena(){
 const random=rng(0x0E1D12),solids=FIXED.map(s=>({kind:'circle',...s}));
 for(let tries=0;solids.length<FIXED.length+24&&tries<6000;tries++){
  const r=pick(random,.35,.55),limit=20-r-EDGE,x=pick(random,-limit,limit),y=pick(random,-limit,limit);
  if(inKeepout(x,y,r)||!clearOf(x,y,r,solids,GAP))continue;
  solids.push({kind:'circle',look:random()<.55?'pine':'oak',x:+x.toFixed(2),y:+y.toFixed(2),r:+r.toFixed(2),height:+pick(random,4.6,6.8).toFixed(2)});
 }
 // Cada elemento visual guarda posição e tamanho; `tone` varia a cor sem novas texturas.
 const decor={trees:[],bushes:[],grass:[],flowers:[],patches:[],path:[],mushrooms:[]},blocked=(x,y,r)=>!clearOf(x,y,r,solids,.25);
 // Mata fechada além do limite caminhável: não há colisão, pois o próprio limite impede a passagem.
 for(let x=-30;x<=30;x+=3){for(let y=-30;y<=30;y+=3){const d=Math.max(Math.abs(x),Math.abs(y));if(d<21.4||d>28.5)continue;
  decor.trees.push({x:+(x+pick(random,-1,1)).toFixed(2),y:+(y+pick(random,-1,1)).toFixed(2),look:random()<.6?'pine':'oak',height:+pick(random,5,8.5).toFixed(2),tone:+random().toFixed(2)});}}
 // Sebe baixa marca o limite sem criar parede invisível.
 for(let t=-20;t<20;t+=2.2)for(const [x,y]of [[t,-20.5],[t,20.5],[-20.5,t],[20.5,t]])decor.bushes.push({x:+(x+pick(random,-.3,.3)).toFixed(2),y:+(y+pick(random,-.3,.3)).toFixed(2),size:+pick(random,.7,1.2).toFixed(2),tone:+random().toFixed(2)});
 for(let n=0,tries=0;n<22&&tries<800;tries++){const x=pick(random,-18,18),y=pick(random,-18,18),r=pick(random,.45,.8);if(blocked(x,y,r+.3))continue;decor.bushes.push({x:+x.toFixed(2),y:+y.toFixed(2),size:+r.toFixed(2),tone:+random().toFixed(2)});n++;}
 for(let n=0,tries=0;n<22&&tries<500;tries++){const x=pick(random,-18,18),y=pick(random,-18,18);decor.patches.push({x:+x.toFixed(2),y:+y.toFixed(2),r:+pick(random,1.2,3.2).toFixed(2),tone:+random().toFixed(2)});n++;}
 for(let n=0,tries=0;n<320&&tries<2400;tries++){const x=pick(random,-19.2,19.2),y=pick(random,-19.2,19.2);if(blocked(x,y,.1))continue;decor.grass.push({x:+x.toFixed(2),y:+y.toFixed(2),height:+pick(random,.25,.6).toFixed(2),tone:+random().toFixed(2)});n++;}
 for(let n=0,tries=0;n<70&&tries<900;tries++){const x=pick(random,-19,19),y=pick(random,-19,19);if(blocked(x,y,.1))continue;decor.flowers.push({x:+x.toFixed(2),y:+y.toFixed(2),tone:+random().toFixed(2)});n++;}
 for(let n=0,tries=0;n<16&&tries<400;tries++){const base=solids[Math.floor(random()*solids.length)];if(base.kind==='box')continue;const a=random()*Math.PI*2,d=base.r+pick(random,.25,.7),x=base.x+Math.cos(a)*d,y=base.y+Math.sin(a)*d;if(blocked(x,y,.05)||Math.abs(x)>19||Math.abs(y)>19)continue;decor.mushrooms.push({x:+x.toFixed(2),y:+y.toFixed(2),size:+pick(random,.12,.22).toFixed(2)});n++;}
 // Trilha de terra: da chegada até o campo das ondas, levemente sinuosa.
 for(let y=FOREST_START.y+1.2,i=0;y>FOREST_SPAWN.y-1.5;y-=.75,i++)decor.path.push({x:+(Math.sin(i*.55)*1.1+pick(random,-.25,.25)).toFixed(2),y:+y.toFixed(2),r:+pick(random,.9,1.35).toFixed(2)});
 return {id:FOREST_ID,theme:'forest',bounds:{...BOUNDS},solids,decor};
}
