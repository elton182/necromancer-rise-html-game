export const CAVE_ROOMS=[{x:0,y:165},{x:36,y:165},{x:36,y:125},{x:-8,y:125},{x:-44,y:125},{x:-44,y:85},{x:0,y:85},{x:0,y:45},{x:0,y:5}];
export const PROLOGUE_POINTS={papers:{x:0,y:0},exit:{x:0,y:-22},messenger:{x:0,y:-82},satchel:{x:17,y:-23}};
// Quem conta como guarda das ordens: a sala delas. Grupos mais longe são opcionais, para uma sala lateral não travar a história.
export const PAPERS_GUARD_RADIUS=20;
// Caminho de Jacarandá: da boca da caverna, ao norte, até Tomás, ao sul. Só os perseguidores a até este raio dele impedem a conversa.
export const MESSENGER_GUARD_RADIUS=16;
export const TRAIL_START={x:0,y:86};
// Eixo da trilha e clareiras com encontro: lobos atraídos pelo sangue, vigias na carroça tombada e os perseguidores de Tomás.
export const TRAIL_ROUTE=[[0,92],[-5,80],[-15,67],[-23,52],[-22,37],[-10,24],[0,17],[0,7],[10,-3],[19,-14],[22,-28],[15,-43],[3,-57],[-3,-70],[0,-82],[3,-98]];
export const TRAIL_CLEARINGS=[{key:'wolves',x:-25,y:47,r:10},{key:'cart',x:22,y:-27,r:10},{key:'messenger',x:0,y:-82,r:11}];
const STREAM_Y=x=>11+3.5*Math.sin(x/8);
function routeDistance(x,y){
 let best=Infinity;
 for(let i=1;i<TRAIL_ROUTE.length;i++){const [ax,ay]=TRAIL_ROUTE[i-1],[bx,by]=TRAIL_ROUTE[i],dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-ax-dx*t,y-ay-dy*t));}
 return best;
}
function trailMap(add){
 let seed=7331;const random=()=>(seed=(seed*16807)%2147483647)/2147483647,pick=(a,b)=>+(a+(b-a)*random()).toFixed(2);
 // Trilha contínua: pontos a cada 2,5 u sobre o eixo.
 for(let i=1;i<TRAIL_ROUTE.length;i++){const [ax,ay]=TRAIL_ROUTE[i-1],[bx,by]=TRAIL_ROUTE[i],n=Math.ceil(Math.hypot(bx-ax,by-ay)/2.5);for(let k=i===1?0:1;k<=n;k++)add('path',+(ax+(bx-ax)*k/n).toFixed(2),+(ay+(by-ay)*k/n).toFixed(2),{r:2.7});}
 // Encosta da caverna ao norte, com a boca de onde o personagem sai.
 add('cave_mouth',0,98);
 for(let x=-50;x<=50;x+=4.5)if(Math.abs(x)>6)add('cliff',x,100+pick(-1.5,1),{r:+pick(2.2,3).toFixed(2),h:+pick(3.4,4.6).toFixed(2)});
 for(const [x,y] of [[-7,93],[7,94],[-12,95],[12,96]])add('boulder',x,y,{r:1.2,h:1.6});
 // Riacho atravessando a mata, com ponte de madeira na trilha.
 for(let x=-50;x<=50;x+=3)if(Math.abs(x)>4)add('water',x,+STREAM_Y(x).toFixed(2),{r:2.6});
 add('bridge',0,STREAM_Y(0),{w:10,d:3.2,rot:90});
 for(let x=-46;x<=46;x+=7)if(Math.abs(x)>8){add('reeds',x+pick(-1,1),+(STREAM_Y(x)+3.6).toFixed(2));if(random()<.5)add('shore_rock',x+2,+(STREAM_Y(x)-3.8).toFixed(2),{r:.8,h:.7});}
 // Clareira dos lobos.
 add('bone_pile',-27,44);add('bone_pile',-21,51);add('dead_tree',-33,52,{r:.4,h:4.5});add('mushrooms',-30,40);add('mushrooms',-18,44);add('stump',-28,55,{r:.45,h:.55});
 // Carroça tombada: vigias dos bandidos e a bolsa de Tomás.
 add('open_cart',25,-25,{rot:62});add('wheel',20,-31);add('wheel',28,-20);add('crate',26,-31,{s:1});add('crate',29,-29,{s:.9});add('barrel',18,-33,{s:1});add('banner',29,-34);add('campfire',24,-36);add('crate',17,-23,{s:.6});
 // Tomás encurralado perto da placa para Jacarandá.
 add('signpost',7,-92);add('brazier',-3,-80);add('crate',3,-84,{s:1});add('rock',-8,-76,{r:1.6,h:2});add('rock',9,-74,{r:1.5,h:2.4});add('log',-9,-89,{w:3.6,d:.7,h:.7,rot:30});
 // Mata densa fora do corredor; mais aberta perto da trilha, sem cobrir riacho, clareiras e encosta.
 for(let gx=-48;gx<=48;gx+=5.5)for(let gy=-100;gy<=92;gy+=5.5){
  const x=+(gx+pick(-2,2)).toFixed(2),y=+(gy+pick(-2,2)).toFixed(2),d=routeDistance(x,y);
  if(d<7.5||Math.abs(y-STREAM_Y(x))<4.5||y>90||TRAIL_CLEARINGS.some(c=>Math.hypot(x-c.x,y-c.y)<c.r+2))continue;
  const roll=random();if(roll>(d<13?.55:.86))continue;
  if(roll<.05)add('boulder',x,y,{r:1.1,h:1.5});else if(roll<.3)add('pine',x,y,{r:.45,h:+pick(5.4,7).toFixed(2)});else add('oak',x,y,{r:.55,h:+pick(4.8,6).toFixed(2)});
 }
 // Sub-bosque na beira do caminho.
 for(let i=1;i<TRAIL_ROUTE.length;i++){const [ax,ay]=TRAIL_ROUTE[i-1],[bx,by]=TRAIL_ROUTE[i],len=Math.hypot(bx-ax,by-ay),nx=-(by-ay)/len,ny=(bx-ax)/len;
  for(let t=2;t<len;t+=4.5){const side=random()<.5?-1:1,off=pick(5,7),x=+(ax+(bx-ax)*t/len+nx*side*off).toFixed(2),y=+(ay+(by-ay)*t/len+ny*side*off).toFixed(2);if(routeDistance(x,y)<4.5||TRAIL_CLEARINGS.some(c=>Math.hypot(x-c.x,y-c.y)<c.r-2)||Math.abs(y-STREAM_Y(x))<3.5)continue;const r=random();add(r<.45?'bush':r<.75?'fern':r<.9?'flowers':'mushrooms',x,y,r<.45?{r:+pick(.6,.9).toFixed(2)}:{});}
 }
 return [[4,-28,44],[4,-23,50],[4,-21,43],[6,19,-24],[6,25,-30],[9,27,-34],[6,-3,-78],[6,4,-79],
  [4,-10,72],[4,-13,70],[8,-16,30],[8,-13,28],[6,0,3],[9,3,1],[4,9,-48],[4,6,-50]];
}
export const CAVE_LINKS=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[3,6]];
// Fonte comum da campanha e do editor. Somente dados, sem motor ou normalizador.
export function prologueMapData(stage){
 const cave=stage==='cave',travel=stage==='travel',trail=stage==='trail',objects=[];let trailEnemies=[];
 const add=(type,x,y,extra={})=>objects.push({id:'opening-'+objects.length,type,x,y,...extra});
 if(travel){for(let y=-114;y<=114;y+=5){add('path',0,y,{r:3.3});for(const side of [-1,1]){add('oak',side*(7+(Math.abs(y)%3)),y,{r:.5,h:5.5});add('bush',side*5,y+2,{r:.8});}}}
 else if(cave){
  // União de salas e túneis: só o contorno externo recebe paredes.
  // Isso impede batentes sobrepostos e mantém as junções abertas.
  const cells=new Set(),key=(x,y)=>x+','+y;
  const carve=(cx,cy,w,d)=>{for(let x=-60;x<=52;x+=2)for(let y=-27;y<=179;y+=2)if(Math.abs(x-cx)<=w/2&&Math.abs(y-cy)<=d/2)cells.add(key(x,y));};
  for(const r of CAVE_ROOMS)carve(r.x,r.y,24,20);
  for(const [a,b] of CAVE_LINKS){const from=CAVE_ROOMS[a],to=CAVE_ROOMS[b];carve((from.x+to.x)/2,from.y,Math.abs(to.x-from.x)+6,6);carve(to.x,(from.y+to.y)/2,6,Math.abs(to.y-from.y)+6);
   const distance=Math.abs(to.x-from.x)+Math.abs(to.y-from.y);
   for(let t=0;t<=distance;t+=2){const dx=Math.sign(to.x-from.x)*Math.min(t,Math.abs(to.x-from.x)),dy=Math.sign(to.y-from.y)*Math.max(0,t-Math.abs(to.x-from.x));add('path',from.x+dx,from.y+dy,{r:2});}
  }
  carve(0,-12,8,28);
  const boundary=new Set();for(const cell of cells){const [x,y]=cell.split(',').map(Number);for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]])if(!cells.has(key(x+dx,y+dy)))boundary.add(key(x+dx,y+dy));}
  for(const cell of boundary){const [x,y]=cell.split(',').map(Number);add('cave_wall',x,y,{w:2,d:2,h:2.8});}
  for(let i=1;i<9;i++){const r=CAVE_ROOMS[i];add('cave_spire',r.x-8,r.y+6,{r:.7,h:2});if(i>=4){add('brazier',r.x-8,r.y-5);add('hideout_bedroll',r.x+8,r.y+6);}}
  for(const i of [2,4,6]){const r=CAVE_ROOMS[i];add('hideout_cargo',r.x+8,r.y+3);}
  add('fall_debris',0,165);add('capture_note',0,0);add('cave_exit',0,-22);
  add('hideout_cargo',7,7);add('hideout_table',0,0);add('brazier',-5,0);add('brazier',0,-22);

 }else if(trail)trailEnemies=trailMap(add);
 else{
  for(let y=-25;y<=25;y+=4){add('path',0,y,{r:3});for(const side of [-1,1]){add('oak',side*(9+(y%3)),y,{r:.6,h:5});add('bush',side*6,y+1,{r:.8});}}
  add('rock',-6,4,{r:1.6,h:2});add('rock',7,-8,{r:1.5,h:2.4});
  add('caravan',-3,4,{w:2.8,d:5.2,h:2});add('caravan',3,-3,{w:2.8,d:5.2,h:2});if(stage==='ambush')add('road_block',0,-18);
 }
 const enemies=cave?CAVE_ROOMS.flatMap((r,i)=>i===0||i===4?[]:(i<4?[4,8]:i===8?[6,9,0]:[6,9]).map((type,j)=>[type,r.x+(j-1)*4,r.y-3])):trail?trailEnemies:travel?[]:[[6,-5,-7],[6,5,-9],[9,0,-15]];
 return {id:'arandu-'+(travel?'journey':cave?'cave':trail?'trail':'caravan'),name:travel?'Estrada de Itavera':cave?'Caverna · Esconderijo dos bandidos':trail?'Caminho de Jacarandá':'ARANDU · Desembarque da caravana',size:travel?{w:32,h:240}:cave?{w:144,h:360}:trail?{w:100,h:204}:{w:40,h:60},biome:cave?'cave':'forest',objects,spawns:enemies.map(([type,x,y],i)=>({id:'opening-enemy-'+i,type,x,y,count:1})),start:trail?TRAIL_START:{x:0,y:travel?80:cave?165:10},level:1};
}
