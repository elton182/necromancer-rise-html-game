import {gridFor,closeGrid} from './map-terrain.mjs';
import {CEDRO_POINTS} from './cedro-model.mjs';
// Estrada, povoado e acampamento conectados; kits GLB existentes, sem assets externos.
export function cedroMap(){
 const objects=[],add=(type,x,y,extra={})=>objects.push({id:'cedro-o-'+objects.length,type,x,y,...extra});
 const routes=[[[ -130,142],[-114,119],[-90,90],[-55,65],[-28,48],[0,5],[10,-42],[48,-60],[80,-72],[80,-119]],
 [[-55,65],[-75,40],[-53,25],[-40,-4],[-86,-22],[-45,-48],[10,-42]],
 [[0,5],[35,20],[68,25],[94,0],[107,-42],[80,-72]],
 [[-53,25],[-18,-14],[15,-60],[42,-78],[42,-100],[80,-119]]];
 const samples=[];
 for(const route of routes)for(let i=1;i<route.length;i++){
  const [ax,ay]=route[i-1],[bx,by]=route[i],n=Math.ceil(Math.hypot(bx-ax,by-ay)/3);
  for(let j=0;j<=n;j++){const x=ax+(bx-ax)*j/n,y=ay+(by-ay)*j/n;samples.push([x,y]);add('path',x,y,{r:i===1?4:3.8});}
 }
 for(const [x,y] of [[-18,8],[18,4],[-20,32],[14,35],[-31,-25],[29,-18]]){
  add('house',x,y,{h:3.6});add('crate',x+3,y);add('barrel',x+3,y+2);
 }
 add('ruined_well',0,22);add('open_cart',-104,103,{rot:35});add('wheel',-99,105);add('open_cart',-63,80,{rot:120});
 for(const x of [-103,-77])add('palisade',x,91,{w:9});
 for(const [x,y] of [[-90,-28],[-82,-28]])add('watchtower',x,y);
 add('banner',-86,-25);add('hideout_cargo',72,25);add('barrel',72,29);add('barrel',75,27);
 for(const x of [-59,-47])add('tent',x,30);
 for(const [x,y] of [[4,-49],[16,-49]])add('tent',x,y);add('banner',10,-49);
 // Dois vãos: o principal abre com o avanço; moradores abrem o atalho.
 for(const [x,w] of [[33.5,11],[60.5,31],[112,56]])add('fort_wall',x,-87,{w,d:1.4,h:4});
 for(const x of [28,140])for(let y=-90;y>=-150;y-=6)add('fort_wall',x,y,{w:1.4,d:6,h:4});
 for(let x=31;x<=139;x+=6)add('fort_wall',x,-150,{h:4});
 for(const [x,y] of [[55,-104],[112,-105],[55,-136],[112,-135]]){add('tent',x,y);add('crate',x+3,y+3);add('campfire',x+4,y);}
 add('banner',80,-139,{s:2});add('hideout_table',80,-142);add('fort_tower',136,-146);add('fort_tower',32,-146);
 add('path',80,-119,{r:11});
 for(const [x,y] of [[36,-103],[129,-116],[101,-144],[60,-145]]){add('barrel',x,y);add('crate',x+1.5,y);add('banner',x,y+2);}
 add('open_cart',121,-138,{rot:90});
 // Bordas da estrada formam corredores legíveis de mata, inclusive na chegada.
 const main=routes[0];
 for(let i=1;i<main.length;i++){
  const [ax,ay]=main[i-1],[bx,by]=main[i],length=Math.hypot(bx-ax,by-ay),n=Math.ceil(length/4.5),nx=-(by-ay)/length,ny=(bx-ax)/length;
  for(let j=0;j<n;j++)for(const side of [-1,1]){
   const offset=12+(j%3)*2,x=ax+(bx-ax)*j/n+nx*offset*side,y=ay+(by-ay)*j/n+ny*offset*side;
   if(samples.some(([a,b])=>Math.hypot(x-a,y-b)<9)||x>20&&x<148&&y<-79&&y>-158)continue;
   if(Object.values(CEDRO_POINTS).some(p=>Math.hypot(x-p.x,y-p.y)<12))continue;
   add(j%4?'pine':'boulder',x,y,j%4?{h:5.5+(j%3)}:{r:1.3,h:2.3});
  }
 }
 // Vegetação continua além dos limites; o horizonte do motor prolonga o piso.
 let seed=7319;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<350;i++){
  const x=random()*370-185,y=random()*390-195;
  if(samples.some(([a,b])=>Math.hypot(x-a,y-b)<10)||x>20&&x<148&&y<-79&&y>-158)continue;
  if(Object.values(CEDRO_POINTS).some(p=>Math.hypot(x-p.x,y-p.y)<12))continue;
  add(i%6===0?'boulder':i%3?'pine':'oak',x,y,i%6===0?{r:1.5,h:2}:{h:5+random()*3});
 }
 const patrols=[[-117,120],[-107,102],[-66,75],[-42,56],[-26,39],[-71,43],[-37,7],[-68,-6],[-43,-39],[4,12],[28,20],[54,27],[92,1],[105,-29],[45,-57],[120,-62],[104,-99],[58,-111],[111,-130],
  [-121,132],[-84,111],[-78,78],[-50,52],[-19,25],[-12,-17],[-12,-37],[-56,-12],[21,18],[86,15],[44,-103],[92,-135]];
 const group=(id,x,y,mix,extra={})=>({id,x,y,mix,type:mix[0],count:mix.length,level:13,trigger:'near',radius:16,spread:2.5,idle:true,waves:1,respawn:0,...extra});
 const spawns=patrols.map(([x,y],i)=>group('cedro-patrol-'+i,x,y,i%3===0?[0,0,9,9,6]:i%3===1?[6,0,1,0,6]:[0,9,0,1,0]));
 for(const [id,p,mix,extra] of [['road','road',[0,0,0,9,9,6],{}],['captain','captain',[0,0,9,0,6,9],{leader:'magic'}],['signal','signal',[9,0,9,6],{}],['supplies','supplies',[0,9,6,0],{}],['prisoners','prisoners',[6,0,9,0],{}],['bento','boss',[0,0,0,9,9],{leader:'rare'}]]){
  const point=CEDRO_POINTS[p];spawns.push(group('cedro-'+id,point.x,point.y,mix,extra));
 }
 const size={w:300,h:320},grid=gridFor(size),h=new Float32Array(grid.cols*grid.rows),surface=new Uint8Array(h.length);
 for(let j=0;j<grid.rows;j++)for(let i=0;i<grid.cols;i++){const x=i*grid.cell-size.w/2,y=j*grid.cell-size.h/2,r=Math.hypot((x-80)/72,(y+118)/68),fade=Math.min(1,Math.max(0,(size.w/2-Math.abs(x))/12),Math.max(0,(size.h/2-Math.abs(y))/12));h[j*grid.cols+i]=3.3*Math.max(0,1-r*r)*fade;}
 const terrain=closeGrid({...grid,h,s:surface});
 return {id:'cedro',name:'Passo do Cedro',biome:'forest',size,terrain,start:{x:-126,y:134},level:13,objects,spawns,
 style:{ground:'grass',tint:'#e0d4ad',sky:'#817c68',sun:2.8,ambient:1.7,fog:.2}};
}
