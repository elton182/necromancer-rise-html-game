import {WORLD_SIZE,WORLD_POINTS,WORLD_ROUTES,WORLD_ENCOUNTERS,WORLD_PILES} from './campaign-world-model.mjs';
import {villageArena} from './village-map.mjs';
import {flattenBake} from './map-terrain.mjs';

// A vila salva conserva a mesma planta da defesa, dentro do mundo contínuo.
export function withIntactVillage(arena){
 const home=WORLD_POINTS.village,village=villageArena(),shift=o=>({...o,x:o.x+home.x,y:o.y+home.y});
 const inside=o=>o.x>=34&&o.x<=86&&o.y>=36&&o.y<=98;
 const settlement={...village,bounds:{minX:home.x-20,maxX:home.x+20,minY:home.y-20,maxY:home.y+20},
  solids:village.solids.map(s=>({...shift(s),settlement:true})),
  decor:Object.fromEntries(Object.entries(village.decor).map(([key,list])=>[key,list.map(shift)])),
  roads:village.roads.map(r=>({...r,x0:r.x0+home.x,x1:r.x1+home.x,y0:r.y0+home.y,y1:r.y1+home.y})),plaza:shift(village.plaza)};
 return {...arena,id:arena.id+'-intact',settlement,terrain:arena.terrain?flattenBake(arena.terrain,{minX:34,maxX:86,minY:36,maxY:98}):null,solids:[...arena.solids.filter(s=>!inside(s)),...settlement.solids],
  decor:Object.fromEntries(Object.entries(arena.decor).map(([key,list])=>[key,list.filter(o=>!inside(o))]))};
}
// A campanha e o editor usam a mesma planta. Cópias editadas continuam independentes.
export function campaignWorldMap(){
 const objects=[],add=(type,x,y,extra={})=>objects.push({id:'world-'+objects.length,type,x,y,...extra});
 const route=[[-43,-43],[-30,-43],[-24,-32],[-18,-18],[0,-12],[12,0],[28,12],[30,30]];
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3);for(let j=0;j<n;j++){const t=j/n;add('path',a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,{r:2.4});}}
 // Cripta no sudoeste: salão, alas funerárias e saída a leste.
 add('wall',-44,-53,{w:24,d:1,h:2});add('wall',-56,-43,{w:1,d:20,h:2});add('wall',-44,-33,{w:24,d:1,h:2});
 for(const y of [-49,-36]){add('wall',-32,y,{w:1,d:6,h:2});for(const x of [-51,-44,-37])add('tomb',x,y,{s:1.3});}
 for(const x of [-50,-40])for(const y of [-47,-39])add('column',x,y,{r:.6,h:2.4});
 // Vila ao nordeste, praça aberta e três acessos para futuras regiões.
 for(const [x,y]of [[20,22],[40,22],[20,32],[40,32],[20,42],[40,42],[30,45]])add('house',x,y,{h:3});
 for(let x=22;x<=38;x+=2)add('path',x,32,{r:3});
 for(let y=15;y<=46;y+=2)add('path',30,y,{r:2.6});
 for(const [x,y]of [[25,27],[35,27],[25,37],[35,37]])add('brazier',x,y);
 for(const [x,y]of [[17,20],[43,20],[18,43],[42,43]])add('crate',x,y);
 // Floresta: maciços de árvores, clareiras e trilha de ligação livres.
 const distance=(x,y)=>Math.min(...route.slice(1).map((b,i)=>{const a=route[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);}));
 let seed=918;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
 for(let i=0;i<260;i++){const x=-55+random()*110,y=-28+random()*82;if(x>14&&y>14||distance(x,y)<5||Math.hypot(x+3,y+6)<8)continue;add(i%3?'oak':'pine',x,y,{r:.45,h:4+random()*2});if(i%4===0)add('bush',x+1,y+1,{r:.7});}
 for(const [x,y]of [[-10,-3],[3,-21],[14,-12],[-29,6]])add('ruin',x,y,{r:.7,h:1.5});
 // Dobro da extensão por eixo, mantendo edifícios em escala humana.
 for(const o of objects){o.x*=2;o.y*=2;if(o.type==='wall'){o.w*=2;o.d*=2;}if(o.type==='path')o.r*=1.65;}
 // Alvenaria modular alta com vitrais; mantém os mesmos limites e a abertura leste.
 const walls=objects.filter(o=>o.type==='wall');
 for(const wall of walls){
  objects.splice(objects.indexOf(wall),1);const along=wall.w>wall.d,len=along?wall.w:wall.d,n=Math.ceil(len/4);
  for(let i=0;i<n;i++)add('cryptwall',wall.x+(along?-len/2+(i+.5)*len/n:0),wall.y+(along?0:-len/2+(i+.5)*len/n),{w:along?len/n:.7,d:along?.7:len/n,h:8});
 }
 // Caminho secundário para a clareira de ruínas e acampamento abandonado.
 const branch=[[-36,-36],[-42,-18],[-35,0],[-15,8],[8,-24]];
 for(let i=1;i<branch.length;i++){const a=branch[i-1],b=branch[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3.2);for(let j=0;j<n;j++)add('path',a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n,{r:1.7});}
 // Marcos agrupados, em vez de enfeites isolados por todo o terreno.
 for(const [cx,cy]of [[-35,0],[-15,8],[10,-42]]){
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;add('column',cx+Math.cos(a)*4,cy+Math.sin(a)*4,{r:.85,h:4.5+i*.3});}
  add('brazier',cx,cy);add('skulls',cx+1,cy+1);
 }
 for(const [cx,cy]of [[-50,-15],[20,10],[49,35]]){
  add('brazier',cx,cy);add('barrel',cx+2,cy+1);add('crate',cx+2,cy-1);add('log',cx-2,cy+2,{w:3,d:.65,h:.5});
 }
 // Jardins e depósitos da vila; praça permanece livre.
 for(const x of [39,81])for(const y of [47,67,87]){add('bush',x,y,{r:.8});add('barrel',x+2,y,{s:1});}
 add('crypt_floor',-88,-86);add('sarcophagus',-98,-86);
 // Salas norte e sul separadas do corredor central, com vãos de acesso largos.
 for(const y of [-94,-78])for(const x of [-106,-94,-78])add('cryptwall',x,y,{w:8,d:.7,h:5});
 for(const [x,y]of [[-106,-101],[-94,-101],[-80,-101],[-106,-71],[-94,-71]])add('crypt_bench',x,y);
 for(const [x,y]of [[-108,-88],[-88,-101],[-88,-71]])add('crypt_altar',x,y);
 for(const [x,y]of [[-108,-103],[-102,-103],[-108,-69]])add('crypt_shelf',x,y);
 // Retira a trilha do salão e os adornos antigos que cruzavam as novas salas.
 for(let i=objects.length-1;i>=0;i--){const o=objects[i],inside=o.x<-63&&o.x>-114&&o.y>-107&&o.y<-65;
  if((inside&&['column','tomb'].includes(o.type))||(o.type==='path'&&o.x<-60&&o.y>-110&&o.y<-62))objects.splice(i,1);
 }
 for(const [x,y]of [[-102,-98],[-90,-98],[-78,-98],[-102,-74],[-90,-74],[-78,-74]])add('tomb',x,y,{s:1.2});
 for(const [x,y]of [[-104,-90],[-88,-90],[-76,-90],[-104,-82],[-88,-82],[-76,-82]])add('column',x,y,{r:.85,h:6});
 // Fatia de acabamento: saída da cripta até a primeira clareira.
 // Retira vegetação sorteada dessa faixa antes de compor os agrupamentos.
 for(let i=objects.length-1;i>=0;i--){const o=objects[i];if(o.x>-64&&o.x<-32&&o.y>-96&&o.y<-35&&['oak','pine','bush'].includes(o.type))objects.splice(i,1);}
 const edge=[[-58,-85],[-52,-74],[-46,-62],[-40,-50],[-36,-38]];
 for(let i=0;i<edge.length;i++){
  const [x,y]=edge[i];
  for(const side of [-1,1]){
   add(i%2?'pine':'oak',x+side*7,y,{r:.45,h:5.6+i*.15});
   add('bush',x+side*5.3,y+1,{r:.8});add('bush',x+side*6.3,y-1,{r:.55});
   add('rock',x+side*4.8,y-2,{r:.35,h:.35});
  }
 }
 // Vestígios de um pequeno posto de vigia, fora da faixa de circulação.
 add('column',-59,-91,{r:.8,h:4.5});add('column',-59,-80,{r:.8,h:4.5});
 add('crate',-49,-84);add('barrel',-48,-82);add('brazier',-51,-81);
 add('tomb',-47,-81,{s:1.1});add('skulls',-47,-80);
 add('log',-31,-48,{w:3.8,d:.7,h:.6});add('stump',-30,-46,{r:.5,h:.65});
 // Acesso norte da vila ao posto: área de combate e cela aberta para interação.
 const rescue=WORLD_ROUTES.rescue;
 for(let i=1;i<rescue.length;i++){const a=rescue[i-1],b=rescue[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3);for(let j=0;j<=n;j++)add('path',a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n,{r:2.7});}
 const roadDistance=(o,points)=>Math.min(...points.slice(1).map((b,i)=>{const a=points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((o.x-a[0])*dx+(o.y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(o.x-a[0]-dx*t,o.y-a[1]-dy*t);}));
 // As duas rotas têm largura suficiente para Zephyr e a horda, sem árvores sorteadas no caminho.
 for(let i=objects.length-1;i>=0;i--){const o=objects[i];if(['oak','pine','rock','stump','log','ruin','column'].includes(o.type)&&(roadDistance(o,WORLD_ROUTES.village)<3.4||roadDistance(o,rescue)<4||Math.hypot(o.x-77,o.y+31)<12))objects.splice(i,1);}
 add('wall',80,-42,{w:14,d:.8,h:2.6});add('wall',87,-36,{w:.8,d:12,h:2.6});add('wall',73,-39,{w:.8,d:6,h:2});
 for(const [x,y] of [[70,-25],[86,-25]])add('column',x,y,{r:.7,h:4});
 for(const [x,y] of [[70,-22],[86,-22],[78,-39]])add('brazier',x,y);
 add('crate',84,-38);add('barrel',85,-34);add('crypt_bench',81,-40);
 for(const [x,y] of [[68,-37],[90,-30],[64,-15]])add('pine',x,y,{r:.45,h:5.6});
 // --- Arredores ampliados (360 × 360): mina ao norte, serraria a sudoeste, cemitério a leste. ---
 let seed2=4721;const rand=()=>{seed2=(Math.imul(seed2,1664525)+1013904223)|0;return(seed2>>>0)/4294967296;};
 const between=(a,b)=>a+(b-a)*rand();
 const newRoutes=[WORLD_ROUTES.mine,WORLD_ROUTES.mill,WORLD_ROUTES.graveyard];
 for(const route of newRoutes)for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3);for(let j=0;j<=n;j++)add('path',a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n,{r:2.5});}
 const MILL=WORLD_POINTS.mill,YARD={x:31,y:-142},CHAPEL={x:150,y:30};
 const zones=[[YARD.x,YARD.y,28],[MILL.x,MILL.y+2,36],[CHAPEL.x,CHAPEL.y,30],...WORLD_ENCOUNTERS.map(e=>[e.x,e.y,6])];
 const inZone=(x,y,pad=0)=>zones.some(([zx,zy,r])=>Math.hypot(x-zx,y-zy)<r+pad);
 const nearRoute=(o,d)=>Object.values(WORLD_ROUTES).some(route=>roadDistance(o,route)<d);
 // Vegetação antiga que ficaria sobre as estradas novas ou dentro das áreas de combate.
 for(let i=objects.length-1;i>=0;i--){const o=objects[i];if(['oak','pine','rock','stump','log','ruin','column','bush'].includes(o.type)&&(newRoutes.some(r=>roadDistance(o,r)<4)||inZone(o.x,o.y)&&Math.hypot(o.x-MILL.x,o.y-MILL.y)<38&&o.y>80))objects.splice(i,1);}
 // Mina de Valfundo: pátio cercado por paredões de rocha, boca da mina ao norte.
 for(let x=2;x<=60;x+=3.2){add('rock',x,-166+between(-1,1),{r:+between(2.2,2.8).toFixed(2),h:+between(3,5).toFixed(2)});if(x<58)add('rock',x+1.6,-172+between(-1,1),{r:2.4,h:+between(4,6).toFixed(2)});}
 for(let y=-162;y<=-124;y+=3.4){add('rock',4+between(-1,1),y,{r:+between(1.8,2.4).toFixed(2),h:+between(2.5,4).toFixed(2)});add('rock',58+between(-1,1),y,{r:+between(1.8,2.4).toFixed(2),h:+between(2.5,4).toFixed(2)});}
 add('cryptwall',30,-160,{w:14,d:1,h:5});add('column',22.5,-159,{r:.9,h:6});add('column',37.5,-159,{r:.9,h:6});
 for(const [x,y] of [[24,-155],[36,-155],[14,-128],[48,-128]])add('brazier',x,y);
 for(const [x,y] of [[14,-150],[15.5,-148],[46,-152],[47,-138]])add('crate',x,y);
 for(const [x,y] of [[47.5,-150],[13,-140],[12,-142]])add('barrel',x,y);
 add('log',16,-132,{w:3.6,d:.7,h:.7});add('log',46,-133,{w:3.2,d:.7,h:.6});add('skulls',40,-140);add('skulls',20,-150);
 for(const [x,y] of [[44,-126],[18,-158],[48,-158],[11,-134]])add('rock',x,y,{r:.6,h:.7});
 // Serraria do Vale: clareira de tocos, barracões, pilhas de toras e riacho.
 add('house',-122,124,{h:3.5});add('house',-88,142,{h:3});add('ruin',-114,110,{r:.8,h:1.6});
 for(const [x,y] of [[-116,120],[-96,132],[-128,140]])add('brazier',x,y);
 for(const pile of WORLD_PILES){
  // Toras do lado oposto à trilha que vem da serraria, para a pilha não fechar o acesso.
  const len=Math.hypot(pile.x-MILL.x,pile.y-MILL.y),ux=(pile.x-MILL.x)/len,uy=(pile.y-MILL.y)/len;
  for(const [d,w] of [[3,3.6],[3.8,3.4],[4.6,3]])add('log',+(pile.x+ux*d).toFixed(2),+(pile.y+uy*d).toFixed(2),{w,d:.7,h:.7});
  add('crate',+(pile.x+ux*2.6-uy*3).toFixed(2),+(pile.y+uy*2.6+ux*3).toFixed(2));add('barrel',+(pile.x+ux*2.6+uy*3).toFixed(2),+(pile.y+uy*2.6-ux*3).toFixed(2));
  const n=Math.ceil(Math.hypot(pile.x-MILL.x,pile.y-MILL.y)/3.2);for(let j=1;j<n;j++)add('path',MILL.x+(pile.x-MILL.x)*j/n,MILL.y+(pile.y-MILL.y)*j/n,{r:1.8});
 }
 const millFree=(x,y)=>Math.hypot(x+122,y-124)>4.5&&Math.hypot(x+88,y-142)>4.5&&!WORLD_PILES.some(p=>Math.hypot(x-p.x,y-p.y)<7)&&!WORLD_ENCOUNTERS.some(e=>Math.hypot(x-e.x,y-e.y)<4.5)&&!nearRoute({x,y},4.5)&&!WORLD_PILES.some(p=>roadDistance({x,y},[[MILL.x,MILL.y],[p.x,p.y]])<3);
 for(let n=0,t=0;n<42&&t<400;t++){const a=rand()*Math.PI*2,d=8+rand()*28,x=MILL.x+Math.cos(a)*d,y=MILL.y+Math.sin(a)*d;if(y>176||x<-176||!millFree(x,y))continue;add('stump',+x.toFixed(2),+y.toFixed(2),{r:+between(.35,.55).toFixed(2),h:+between(.4,.7).toFixed(2)});n++;}
 for(let x=-170;x<=-40;x+=6)add('water',x,168+Math.sin(x*.08)*3,{r:3.2});
 // Cemitério antigo: capela sem telhado, lápides em fileiras e colunas tombadas.
 for(let x=156;x<=168;x+=4){add('cryptwall',x,16,{w:4,d:.7,h:6});add('cryptwall',x,44,{w:4,d:.7,h:6});}
 for(let y=18;y<=42;y+=4)add('cryptwall',172,y,{w:.7,d:4,h:6});
 add('crypt_altar',166,30);add('crypt_bench',160,26);add('crypt_bench',160,34);
 for(const [x,y] of [[150,15],[150,45]])add('column',x,y,{r:.8,h:4.5});
 for(const [x,y] of [[151,24],[151,36]])add('brazier',x,y);
 for(let x=116;x<=146;x+=5)for(let y=8;y<=54;y+=6){if(roadDistance({x,y},WORLD_ROUTES.graveyard)<3.5||Math.hypot(x-138,y-30)<5)continue;add('tomb',x+between(-.6,.6),y+between(-.6,.6),{s:+between(.9,1.3).toFixed(2)});if(rand()<.2)add('skulls',x+1,y+1);}
 for(const [x,y] of [[112,8],[114,56],[146,6],[146,54]])add('pine',x,y,{r:.45,h:6.2});
 // Marcos de caminho: colunas e brasas indicam bifurcações e entradas de região.
 for(const [x,y] of [[60,-48],[50,-90],[-6,104],[-56,104],[108,68]]){add('column',x,y,{r:.7,h:3.6});add('brazier',x+1.5,y+1.5);}
 add('crate',49,83);add('barrel',48,81);add('brazier',55,83);add('log',52,85.5,{w:3,d:.7,h:.6});
 // Mata densa nas bordas novas: fora da área antiga, longe de estradas, regiões e encontros.
 const solids=()=>objects.filter(o=>['oak','pine','rock','stump','house','column','ruin'].includes(o.type));
 const taken=solids().map(o=>[o.x,o.y]);
 const old=(x,y)=>x>-110&&x<110&&y>-56&&y<108,reserved=(x,y)=>x>-122&&x<-48&&y>-114&&y<-58||x>28&&x<92&&y>30&&y<104||Math.hypot(x-80,y+36)<16;
 for(let n=0,t=0;n<330&&t<2400;t++){
  const x=between(-176,176),y=between(-176,176);
  if(old(x,y)||reserved(x,y)||inZone(x,y,4)||nearRoute({x,y},6)||taken.some(([a,b])=>Math.hypot(x-a,y-b)<2.4))continue;
  const kind=rand()<.12?'rock':rand()<.55?'pine':'oak';
  add(kind,+x.toFixed(2),+y.toFixed(2),kind==='rock'?{r:+between(.7,1.4).toFixed(2),h:+between(.8,1.6).toFixed(2)}:{r:.45,h:+between(4.4,6.4).toFixed(2)});taken.push([x,y]);
  if(n%3===0)add('bush',+(x+1.2).toFixed(2),+(y+.8).toFixed(2),{r:.7});n++;
 }
 objects.forEach((o,i)=>o.id='world-'+i);
 return {name:'Eldrin · Arredores',biome:'forest',size:{w:WORLD_SIZE,h:WORLD_SIZE},start:{x:WORLD_POINTS.crypt.x,y:WORLD_POINTS.crypt.y},level:1,spawns:WORLD_ENCOUNTERS.map(({id,x,y,count,type,mix,wave,leader,quest})=>({id,x,y,count,type,mix,level:wave,leader,quest,trigger:'near',radius:18,idle:true,spread:2.2})),objects};
}
