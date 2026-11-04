export const CAVE_ROOMS=[{x:0,y:165},{x:36,y:165},{x:36,y:125},{x:-8,y:125},{x:-44,y:125},{x:-44,y:85},{x:0,y:85},{x:0,y:45},{x:0,y:5}];
export const PROLOGUE_POINTS={papers:{x:0,y:0},exit:{x:0,y:-22},messenger:{x:0,y:-8}};
// Quem conta como guarda das ordens: a sala delas. Grupos mais longe são opcionais, para uma sala lateral não travar a história.
export const PAPERS_GUARD_RADIUS=20;
export const CAVE_LINKS=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[3,6]];
// Fonte comum da campanha e do editor. Somente dados, sem motor ou normalizador.
export function prologueMapData(stage){
 const cave=stage==='cave',travel=stage==='travel',trail=stage==='trail',objects=[];
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

 }else{
  for(let y=-25;y<=25;y+=4){add('path',0,y,{r:3});for(const side of [-1,1]){add('oak',side*(9+(y%3)),y,{r:.6,h:5});add('bush',side*6,y+1,{r:.8});}}
  add('rock',-6,4,{r:1.6,h:2});add('rock',7,-8,{r:1.5,h:2.4});
  if(trail){add('brazier',-2,-7);add('crate',3,-9);}
  else{add('caravan',-3,4,{w:2.8,d:5.2,h:2});add('caravan',3,-3,{w:2.8,d:5.2,h:2});if(stage==='ambush')add('road_block',0,-18);}
 }
 const enemies=cave?CAVE_ROOMS.flatMap((r,i)=>i===0||i===4?[]:(i<4?[4,8]:i===8?[6,9,0]:[6,9]).map((type,j)=>[type,r.x+(j-1)*4,r.y-3])):trail?[[6,-3,3],[6,3,-1]]:travel?[]:[[6,-5,-7],[6,5,-9],[9,0,-15]];
 return {id:'arandu-'+(travel?'journey':cave?'cave':trail?'trail':'caravan'),name:travel?'Estrada de Itavera':cave?'Caverna · Esconderijo dos bandidos':trail?'Caminho de Jacarandá':'ARANDU · Desembarque da caravana',size:travel?{w:32,h:240}:cave?{w:144,h:360}:{w:40,h:60},biome:cave?'cave':'forest',objects,spawns:enemies.map(([type,x,y],i)=>({id:'opening-enemy-'+i,type,x,y,count:1})),start:{x:0,y:travel?80:cave?165:trail?20:10},level:1};
}
