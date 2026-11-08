// Plantas da Várzea de Itaúna, do Forte da Pedra Negra e da Gruta das Tecelãs. Dados puros e determinísticos, consumidos por `map-model.mjs`.
// A várzea desenha a viagem: estrada a leste até a ponte, encosta do forte a nordeste; vau, morro e gruta a sudeste; lagos ao sul e a noroeste.
// As frentes de portão e gruta ficam voltadas para o sul/leste, o lado que a câmera vê.
import {closeGrid,carvedGrid,gridFor} from './map-terrain.mjs';
import {ITAUNA_POINTS,CAVE_POINTS} from './itauna-model.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const hash=(x,y,s)=>{const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n);};
function noise(x,y,s=0){const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,fu=u*u*(3-2*u),fv=v*v*(3-2*v);return mix(mix(hash(i,j,s),hash(i+1,j,s),fu),mix(hash(i,j+1,s),hash(i+1,j+1,s),fu),fv);}
function fbm(x,y,s=0,octaves=4){let sum=0,amp=.5,total=0;for(let o=0;o<octaves;o++){sum+=noise(x,y,s+o*13)*amp;total+=amp;x*=2.03;y*=2.03;amp*=.5;}return sum/total;}
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};}
const r2=v=>Math.round(v*100)/100;
function lineDistance(points,x,y){
 let best=Infinity,at=0,run=0;
 for(let i=1;i<points.length;i++){const [ax,ay]=points[i-1],[bx,by]=points[i],dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy),t=clamp(((x-ax)*dx+(y-ay)*dy)/(len*len),0,1),d=Math.hypot(x-ax-dx*t,y-ay-dy*t);if(d<best){best=d;at=run+t*len;}run+=len;}
 return {d:best,at,length:run};
}
// Ruído e distâncias reaproveitados pelo relevo do mundo de Jacarandá.
export {clamp,mix,smooth,hash,fbm,seeded,lineDistance};
// Colecionador de peças: identificadores estáveis pela ordem de criação.
function collector(prefix){const objects=[];return {objects,add:(type,x,y,extra={})=>{objects.push({id:prefix+'-'+objects.length,type,x:r2(x),y:r2(y),...extra});},line(type,points,step,extra={}){for(let i=1;i<points.length;i++){const [ax,ay]=points[i-1],[bx,by]=points[i],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/step));for(let j=0;j<n+(i===points.length-1?1:0);j++)objects.push({id:prefix+'-'+objects.length,type,x:r2(ax+(bx-ax)*j/n),y:r2(ay+(by-ay)*j/n),...extra});}}};}
function group(id,x,y,mix_,level,extra={}){return {id,x,y,count:mix_.length,type:mix_[0],mix:mix_,level,trigger:'near',radius:18,idle:true,spread:extra.spread??2.4,...extra};}

// A portaria não tem colisão própria: estas duas muralhas curtas, escondidas dentro das torres, fecham tudo menos o vão de 4,8 u.
const gateJambs=(add,x,y)=>{for(const s of [-1,1])add('fort_wall',x+s*4.2,y,{w:3.6,d:1.4,h:5});};

// --- Várzea de Itaúna ---
const MAIN=[[-178,22],[-150,18],[-122,26],[-92,24],[-60,10],[-30,-2],[-6,-4],[10,-4],[26,-4],[48,-10],[76,-14],[96,-24],[110,-34],[108,-50],[106,-62],[105,-74]];
const SOUTH=[[-92,24],[-74,44],[-56,58],[-30,56],[-8,49],[7,48],[24,50],[44,60],[62,84],[90,104],[120,110],[140,106],[150,96]];
const EAST=[[96,-24],[128,-10],[160,8],[169,40],[168,76],[160,96],[152,98]];
const LAGOON=[[-122,26],[-128,0],[-120,-30],[-104,-54],[-92,-58],[-60,-66]];
const OLD_TOWER=[[-150,18],[-156,50],[-146,84],[-132,104]];
const FISHING=[[-56,58],[-52,72]];
const ROADS=[MAIN,SOUTH,EAST,LAGOON,OLD_TOWER,FISHING];
const RAMP=[[110,-36],[108,-50],[106,-62],[105,-70]],RAMP_TOP=5.2;
const LAKE={x:-14,y:118,rx:58,ry:36,depth:2.6},MIRROR={x:-118,y:-92,rx:34,ry:24,depth:1.9},ISLET={x:-24,y:113,r:10};
const FORT_BOX={x0:72,x1:138,y0:-138,y1:-74},PLATEAU={x:105,y:-108,rx:58,ry:40},BUTTE={x:118,y:62,rx:40,ry:30};
const TOWER_HILL={x:-128,y:118,r:18},SHRINE_HILL={x:-60,y:-70,r:20};
export const ITAUNA_RIVERS=[
 {id:'turvo-alto',points:[[22,-190],[14,-160],[30,-128],[12,-96],[-4,-66],[-2,-40],[10,-22],[10,10],[20,22],[14,30]],width:10,depth:1.7},
 {id:'turvo-vau',points:[[14,30],[7,48],[0,66]],width:11,depth:.55},
 {id:'turvo-foz',points:[[0,66],[10,78],[18,94]],width:10,depth:1.6},
 {id:'turvo-baixo',points:[[42,124],[70,128],[100,142],[130,160],[150,178],[164,198]],width:8,depth:1.5}
];
const CLEARINGS=[[74,-34,22],[-52,74,13],[-128,118,17],[-60,-70,13],[-96,-62,9],[150,98,15],[-92,24,8],[-170,22,10],[7,48,15],[10,-4,12],[105,-60,9],[160,96,8]];
const lakeShape=(l,x,y)=>Math.hypot((x-l.x)/l.rx,(y-l.y)/l.ry)*(1+(fbm(x/28,y/28,41,3)-.5)*.34);
const ellipse=(e,x,y)=>Math.hypot((x-e.x)/e.rx,(y-e.y)/e.ry);
const roadDistance=(x,y)=>Math.min(...ROADS.map(r=>lineDistance(r,x,y).d));
function varzeaHeight(x,y){
 const rolling=fbm(x/64,y/64,3),detail=fbm(x/17,y/17,9,3)-.5;
 let h=.42+Math.max(0,rolling-.34)*2.6+detail*.3;
 // Colinas mais altas no oeste e no sudeste: dão terreno alto sem bloquear a passagem.
 h+=smooth(-60,-150,x)*smooth(.45,.7,fbm(x/44,y/44,17,3))*1.6;
 h+=smooth(90,170,x)*smooth(120,170,y)*1.3;
 // Muralha de montanhas ao norte e a leste: penhasco que dá limite natural ao mapa.
 const northEdge=-150+(fbm(x/36,0,23,3)-.5)*22,eastEdge=150+(fbm(0,y/30,29,3)-.5)*16;
 const peak=6.2+fbm(x/24,y/24,31,3)*1.6,north=smooth(northEdge,northEdge-4.6,y),east=smooth(eastEdge,eastEdge+4.6,x)*smooth(-8,-20,y);
 h=Math.max(h,peak*Math.max(north,east));
 // Platô do forte, com borda em penhasco; o caminho sobe pela rampa.
 const plateauEdge=ellipse(PLATEAU,x,y)*(1+(fbm(x/20,y/20,37,2)-.5)*.1);
 h=Math.max(h,mix(RAMP_TOP+detail*.12,0,smooth(1,1.085,plateauEdge)));
 // Morro das Tecelãs: a gruta abre na face sudeste.
 const butteEdge=ellipse(BUTTE,x,y)*(1+(fbm(x/18,y/18,43,2)-.5)*.1);
 h=Math.max(h,mix(4.6+fbm(x/14,y/14,47,3)*1.8,0,smooth(1,1.1,butteEdge)));
 // Atalaia velha e santuário: morros suaves, com vantagem de terreno alto.
 h=Math.max(h,3*smooth(TOWER_HILL.r+16,TOWER_HILL.r-4,Math.hypot(x-TOWER_HILL.x,y-TOWER_HILL.y)));
 h=Math.max(h,2.1*smooth(SHRINE_HILL.r+12,SHRINE_HILL.r-6,Math.hypot(x-SHRINE_HILL.x,y-SHRINE_HILL.y)));
 // Vale do rio: as margens descem antes do leito, para o rio não parecer um corte.
 let river=Infinity;for(const r of ITAUNA_RIVERS)river=Math.min(river,lineDistance(r.points,x,y).d);
 if(h<3)h=mix(.3+(h-.3)*.35,h,smooth(8,30,river));
 // Estradas e clareiras aplainadas.
 const road=roadDistance(x,y);if(road<9)h=mix(Math.min(h,1),h,smooth(3.5,9,road));
 for(const [cx,cy,r] of CLEARINGS){const d=Math.hypot(x-cx,y-cy);if(d<r+6&&h<3.4)h=mix(mix(h,.55,.75),h,smooth(r-2,r+6,d));}
 // Rampa do forte: corredor com inclinação constante até o alto.
 const ramp=lineDistance(RAMP,x,y);if(ramp.d<10){const k=ramp.at/ramp.length,target=mix(.65,RAMP_TOP,smooth(0,1,k));h=mix(target,h,smooth(4.5,9,ramp.d));}
 // Lagos, com rasos em volta do fundo.
 for(const l of [LAKE,MIRROR]){const e=lakeShape(l,x,y);if(e<1.32){const shore=Math.min(h,.32);if(e>=1)h=mix(shore,h,smooth(1,1.32,e));else h=-l.depth*(1-e*e)**.85;}}
 // Ilhota do lago maior, ligada à margem pelo píer.
 const isle=Math.hypot(x-ISLET.x,y-ISLET.y)*(1+(fbm(x/9,y/9,53,2)-.5)*.3);if(isle<ISLET.r+6)h=Math.max(h,mix(.95,-1.1,smooth(ISLET.r*.55,ISLET.r+5,isle)));
 return clamp(h,-3,8);
}
function varzeaTerrain(){
 const size={w:360,h:360},grid=gridFor(size),n=grid.cols*grid.rows,x0=-(grid.cols-1)*grid.cell/2,y0=-(grid.rows-1)*grid.cell/2,h=new Float32Array(n),s=new Uint8Array(n);
 for(let j=0;j<grid.rows;j++)for(let i=0;i<grid.cols;i++){
  const x=x0+i*grid.cell,y=y0+j*grid.cell,k=j*grid.cols+i,v=varzeaHeight(x,y);h[k]=v;
  // Pedra no alto, lama na foz do rio e areia nas praias do lago maior (mais lenta, mas segura).
  const delta=Math.hypot(x-26,y-76),e=lakeShape(LAKE,x,y);
  if(v>3.4&&roadDistance(x,y)>6&&!(ellipse(PLATEAU,x,y)<1&&fbm(x/15,y/15,59,3)<.58))s[k]=3;
  else if(delta<24&&v>0&&fbm(x/10,y/10,61,3)>.42)s[k]=5;
  else if(e>=.98&&e<1.13&&fbm(x/24,y/24,67,2)>.46)s[k]=2;
 }
 return {g:{...grid,x0,y0,h,s},rivers:ITAUNA_RIVERS};
}
export function itaunaMap(){
 const {g,rivers}=varzeaTerrain(),b=carvedGrid(g,rivers),at=(x,y)=>{const fx=clamp((x-b.x0)/b.cell,0,b.cols-1),fy=clamp((y-b.y0)/b.cell,0,b.rows-1),i=Math.min(b.cols-2,Math.floor(fx)),j=Math.min(b.rows-2,Math.floor(fy)),u=fx-i,v=fy-j,a=j*b.cols+i,c=a+b.cols;return (b.h[a]*(1-u)+b.h[a+1]*u)*(1-v)+(b.h[c]*(1-u)+b.h[c+1]*u)*v;},slope=(x,y)=>Math.hypot(at(x+1,y)-at(x-1,y),at(x,y+1)-at(x,y-1))/2;
 const {objects,add,line}=collector('itauna'),random=seeded(7741),between=(a,c)=>a+(c-a)*random();
 const inFort=(x,y,m=0)=>x>FORT_BOX.x0-m&&x<FORT_BOX.x1+m&&y>FORT_BOX.y0-m&&y<FORT_BOX.y1+m;
 const cleared=(x,y,pad=0)=>CLEARINGS.some(([cx,cy,r])=>Math.hypot(x-cx,y-cy)<r+pad);
 // Estradas: principal larga; ramais estreitos.
 line('path',MAIN,3.3,{r:3.1});line('path',SOUTH.slice(1),3.3,{r:2.7});line('path',EAST.slice(1),3.4,{r:2.3});line('path',LAGOON.slice(1),3.4,{r:2.1});line('path',OLD_TOWER.slice(1),3.4,{r:1.9});line('path',FISHING.slice(1),3,{r:1.9});
 // Ponte de pedra, vau com pedras e píer até a ilhota: as três travessias contam histórias diferentes.
 add('stone_bridge',10,-4,{w:17,d:5.2});
 for(const [x,y] of [[-3.5,-8.5],[-3.5,.5],[23.5,-8.5],[23.5,.5]]){add('brazier',x,y);}
 add('signpost',-7,-9);add('signpost',-96,18);add('signpost',-5,44);add('signpost',-150,12);add('signpost',92,-18);
 for(const [x,y] of [[2,44],[5,52],[10,44],[13,52],[-3,50],[17,47]])add('stepping',x,y,{s:1});
 for(const y of [83,91,99])add('dock',-24,y,{w:2.8,d:8.6});
 add('dock',-52,84,{w:2.8,d:9});add('bench',-49,77);
 // Palafitas de pescadores na margem norte do lago.
 for(const [x,y] of [[-60,70],[-44,68]])add('tent',x,y);
 add('campfire',-52,70);add('log_pile',-64,76,{rot:20});add('crate',-47,74,{s:1});add('crate',-46,72,{s:1.1});add('barrel',-57,76,{s:1});add('hay',-40,74);add('fence',-58,64,{w:6});add('fence',-46,63,{w:6});
 // Ilhota: obelisco rúnico e brasas.
 add('obelisk',-24,113);for(const [x,y] of [[-28.5,110],[-19.5,110],[-29,117],[-19,117]])add('broken_column',x,y,{r:.6,h:1.4});add('brazier',-24,107.5);add('skulls',-22,108);
 // Acampamento dos saqueadores: paliçada aberta para a estrada, tendas, torre e fogueira.
 const CAMP=ITAUNA_POINTS.camp;
 for(let i=0;i<=20;i++){const a=-Math.PI/2+(i/10-1)*Math.PI*.8,x=CAMP.x+Math.cos(a)*19,y=CAMP.y+Math.sin(a)*15,along=Math.atan2(15*Math.cos(a),-19*Math.sin(a));add('palisade',x,y,{w:4.4,rot:Math.round(-along*180/Math.PI)});}
 for(const [dx,dy] of [[-11,-7],[0,-10],[11,-7],[-13,1],[13,1]])add('tent',CAMP.x+dx,CAMP.y+dy);
 add('campfire',CAMP.x,CAMP.y-1);add('watchtower',CAMP.x-16,CAMP.y+8);add('watchtower',CAMP.x+16,CAMP.y+8);add('banner',CAMP.x-4,CAMP.y+7);add('banner',CAMP.x+4,CAMP.y+7);
 add('log_pile',CAMP.x-7,CAMP.y+3,{rot:40});add('hay',CAMP.x+7,CAMP.y+3);add('crate',CAMP.x+5,CAMP.y-5,{s:1.1});add('barrel',CAMP.x+6.5,CAMP.y-4,{s:1});add('crate',CAMP.x-5,CAMP.y-5,{s:1});add('open_cart',CAMP.x+10,CAMP.y+8,{rot:70});
 // Fachada do forte sobre o platô. O interior é outro mapa: quem chega ao portão entra nele.
 const WALL_S=-80,WALL_N=-132,WALL_W=78,WALL_E=132;
 const wall=(x,y,along)=>add('fort_wall',x,y,along?{w:6,d:1.4,h:5}:{w:1.4,d:6,h:5});
 for(let x=WALL_W+3;x<96;x+=6)wall(x,WALL_S,true);for(let x=114;x<WALL_E;x+=6)wall(x,WALL_S,true);
 for(let y=WALL_S-3;y>WALL_N;y-=6){wall(WALL_W,y,false);wall(WALL_E,y,false);}
 for(let x=WALL_W+3;x<WALL_E;x+=6)wall(x,WALL_N,true);
 for(const [x,y] of [[WALL_W,WALL_S],[WALL_E,WALL_S],[WALL_W,WALL_N],[WALL_E,WALL_N],[WALL_E,-106],[WALL_W,-106]])add('fort_tower',x,y);
 add('fort_gatehouse',105,WALL_S);gateJambs(add,105,WALL_S);add('fort_keep',105,-112,{w:30,d:18,h:12});
 for(const x of [100,110])add('brazier',x,WALL_S+4.5);for(const x of [95,115])add('banner',x,WALL_S+2.6);
 for(const [x,y] of [[86,-90],[124,-90]])add('tent',x,y);
 // Encosta do forte: marcos de pedra acompanham a rampa e dizem onde é seguro subir.
 for(const [x,y] of [[103,-44],[116,-44],[101,-56],[113,-56]])add('cairn',x,y);
 // Boca da gruta na face sudeste do morro. Teias e ossos avisam o que espera lá dentro.
 add('cave_mouth',143.5,87.5,{rot:45,s:1});for(const [x,y] of [[141,93.5],[149.5,85.5]])add('spider_web',x,y,{s:.9,rot:45});add('bone_pile',153,92,{s:1});add('bone_pile',144,99,{s:.9});add('egg_sac',156,88,{s:1});add('brazier',152,91);
 // Lagoa do Espelho: píer, arco antigo e estátua meio tomada pelo mato.
 add('dock',-104,-66,{rot:45,w:9,d:2.8});add('arch',-92,-68,{s:1.1,rot:30});add('statue',-82,-60);for(const [x,y] of [[-100,-58],[-88,-50]])add('broken_column',x,y);add('stone_wall',-108,-58,{w:6,rot:15});
 // Santuário partido: círculo de colunas, com vantagem de terreno alto.
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7+.3,x=SHRINE_HILL.x+Math.cos(a)*8,y=SHRINE_HILL.y+Math.sin(a)*8;add(i%3?'broken_column':'column',x,y,{r:.75,h:i%3?1.7:4.2});}
 add('statue',SHRINE_HILL.x,SHRINE_HILL.y);add('brazier',SHRINE_HILL.x+3,SHRINE_HILL.y+3);add('skulls',SHRINE_HILL.x-3,SHRINE_HILL.y+2);add('grave_cross',SHRINE_HILL.x+5,SHRINE_HILL.y-3);
 // Atalaia velha: torre, muretas caídas e vista sobre o lago.
 add('watchtower',TOWER_HILL.x,TOWER_HILL.y);for(const [x,y,rot] of [[-136,110,20],[-120,110,-15],[-138,124,80],[-118,126,100]])add('stone_wall',x,y,{w:5,rot});add('brazier',-128,110);add('crate',-124,113,{s:1});add('barrel',-133,114,{s:1});
 // Ruínas no caminho do acampamento e carroça abandonada na estrada.
 add('open_cart',-34,10,{rot:75});add('wheel',-30,6);add('crate',-38,7,{s:1});add('ruined_well',-112,38);add('ruin',-104,44,{r:1.2,h:1.8});add('ruin',-120,46,{r:1,h:1.2});
 // Pedras: matacões nos campos e rochedos ao longo dos penhascos, que escondem a grade do relevo.
 for(let n=0,t=0;n<54&&t<900;t++){const x=between(-175,175),y=between(-175,175);if(at(x,y)<.32||slope(x,y)>.8||roadDistance(x,y)<5||cleared(x,y)||inFort(x,y,3))continue;add(n%3?'boulder':'rock',x,y,n%3?{r:r2(between(.7,1.4)),h:r2(between(.9,1.7))}:{r:r2(between(.6,1.2)),h:r2(between(.7,1.3))});n++;}
 let cliffs=0;for(let gx=-178;gx<=178&&cliffs<170;gx+=6)for(let gy=-178;gy<=178&&cliffs<170;gy+=6){
  const x=gx+(hash(gx,gy,8)-.5)*3,y=gy+(hash(gx,gy,9)-.5)*3,sl=slope(x,y);if(sl<.85||at(x,y)<.4||inFort(x,y,1)||lineDistance(RAMP,x,y).d<7)continue;
  const size=hash(gx,gy,10);add('cliff',x,y,{r:r2(1.5+size*1.5),h:r2(2.8+size*2.4),rot:Math.round(hash(gx,gy,11)*360)});cliffs++;
 }
 // Margens: juncos no raso, nenúfares no parado e pedras de margem.
 for(const l of [LAKE,MIRROR]){const count=Math.round((l.rx+l.ry)*1.2);for(let i=0;i<count;i++){const a=i/count*Math.PI*2,rad=between(.94,1.08),x=l.x+Math.cos(a)*l.rx*rad,y=l.y+Math.sin(a)*l.ry*rad,h=at(x,y);if(h>.3||h<-.45||roadDistance(x,y)<3.5||Math.abs(x+24)<4&&l===LAKE&&y<112)continue;add(i%5?'reeds':'shore_rock',x,y,i%5?{s:r2(between(.8,1.3))}:{r:r2(between(.5,.9)),h:r2(between(.5,.8))});}
  for(let i=0;i<Math.round(count*.45);i++){const a=between(0,6.28),rad=between(.72,.9),x=l.x+Math.cos(a)*l.rx*rad,y=l.y+Math.sin(a)*l.ry*rad;if(at(x,y)>-.15||Math.abs(x+24)<4&&l===LAKE)continue;add('lily',x,y,{s:r2(between(.8,1.4))});}}
 for(const r of [ITAUNA_RIVERS[0],ITAUNA_RIVERS[2],ITAUNA_RIVERS[3]])for(let i=1;i<r.points.length;i++){const [ax,ay]=r.points[i-1],[bx,by]=r.points[i],len=Math.hypot(bx-ax,by-ay),nx=-(by-ay)/len,ny=(bx-ax)/len;for(let t=0;t<len;t+=11){const side=hash(ax,t,12)<.5?-1:1,o=r.width/2+between(.2,1.6),x=ax+(bx-ax)*t/len+nx*o*side,y=ay+(by-ay)*t/len+ny*o*side;if(Math.abs(x)>178||Math.abs(y)>178||Math.hypot(x-10,y+4)<13||at(x,y)>.8)continue;add(hash(ax,t,13)<.7?'reeds':'shore_rock',x,y,hash(ax,t,13)<.7?{s:r2(between(.8,1.2))}:{r:.6,h:.6});}}
 // Vegetação: mata fechada e clareiras por ruído; pinheiros tomam as encostas e o leste, carvalhos as baixadas.
 const treeRoom=(x,y)=>{const h=at(x,y);return h>.32&&slope(x,y)<.62&&roadDistance(x,y)>5.4&&!cleared(x,y,1)&&!inFort(x,y,4);};
 const step=8.4;
 for(let gx=-176;gx<=176;gx+=step)for(let gy=-176;gy<=176;gy+=step){
  const x=gx+(hash(gx,gy,1)-.5)*6.4,y=gy+(hash(gx,gy,2)-.5)*6.4,woods=fbm(x/52,y/52,71,3);if(woods<.46||!treeRoom(x,y)||objects.length>1880)continue;
  const h=at(x,y),pine=hash(gx,gy,3)<clamp(.28+h*.14+(x>50?.3:0)+(y<-60?.2:0),0,.92),scale=hash(gx,gy,4);
  add(pine?'pine':'oak',x,y,{r:.45,h:r2((pine?5:4.3)+scale*2.1)});
  if(hash(gx,gy,5)<.16&&treeRoom(x+1.6,y+1))add('bush',x+1.6,y+1,{r:r2(.6+scale*.4)});
  else if(hash(gx,gy,6)<.07)add('fern',x-1.4,y+1.2,{s:r2(.9+scale*.6)});
 }
 // Sub-bosque solto nos campos, para o verde não ficar liso entre as matas.
 for(let n=0,t=0;n<46&&t<900&&objects.length<1950;t++){const x=between(-175,175),y=between(-175,175);if(at(x,y)<.34||slope(x,y)>.5||roadDistance(x,y)<4||cleared(x,y)||inFort(x,y,3))continue;add(n%4?'bush':'fern',x,y,n%4?{r:r2(between(.5,1))}:{s:r2(between(.8,1.4))});n++;}
 for(let n=0,t=0;n<28&&t<400;t++){const x=between(-170,170),y=between(-170,170);if(at(x,y)<.34||roadDistance(x,y)<4||fbm(x/40,y/40,73,2)<.5||inFort(x,y,3))continue;add('flowers',x,y,{s:r2(between(.9,1.5))});n++;}
 for(let n=0,t=0;n<16&&t<300;t++){const x=between(-170,170),y=between(-170,170);if(at(x,y)<.4||fbm(x/52,y/52,71,3)<.5||roadDistance(x,y)<5)continue;add('mushrooms',x,y,{s:r2(between(.8,1.3))});n++;}
 for(let n=0,t=0;n<10&&t<300;t++){const x=between(-170,170),y=between(40,170);if(at(x,y)<.34||at(x,y)>1.2||Math.hypot(x+14,y-118)>84||roadDistance(x,y)<5)continue;add('dead_tree',x,y,{r:.4,h:r2(between(3.4,5))});n++;}
 const spawns=[
  group('road-west',-60,10,[0,1,6],3),group('south-road',-74,44,[4,4],3),group('fishing',-52,70,[6,6,9],4,{radius:16}),group('lagoon-east',-92,-56,[7,7],4),group('shrine',-60,-70,[3,0,0],4,{leader:'magic'}),
  group('old-tower',-128,112,[1,9,9,6],4),group('bridge-east',26,-6,[0,1],4,{radius:14}),group('camp-gate',72,-20,[0,0,1,6],5),group('camp-inner',74,-36,[0,1,9,3,0],5,{leader:'magic',spread:4}),group('slope-guards',108,-48,[1,9,0,0],5,{radius:16,spread:3}),
  group('ford-archers',26,50,[9,9,1],4,{radius:20}),group('delta-hounds',34,76,[4,4,4],4,{radius:16}),group('pines-a',90,104,[4,4,4],5),group('pines-b',164,50,[4,4,4,4],5),group('east-road',128,-10,[6,9],4),
  group('mouth-web',148,102,[8,8,8],5,{leader:'magic',spread:3}),group('islet-guard',-24,106,[3,1,1],6,{leader:'rare',quest:true,radius:12}),group('south-hills',118,150,[7,7,10],5),group('lake-east',58,108,[8,8],4)
 ];
 return {id:'itauna',name:'Várzea de Itaúna',biome:'forest',size:{w:360,h:360},start:{x:-168,y:22},level:4,spawns,objects,terrain:closeGrid(g,rivers),style:{tint:'#e6efd8',fog:.12,grass:1.2,flowers:1.1,water:'#3b7a86'}};
}

// --- Forte da Pedra Negra ---
export function fortMap(){
 const size={w:176,h:156},grid=gridFor(size),n=grid.cols*grid.rows,x0=-(grid.cols-1)*grid.cell/2,y0=-(grid.rows-1)*grid.cell/2,h=new Float32Array(n),s=new Uint8Array(n);
 const WX=70,YS=66,YN=-66,YM=6;
 for(let j=0;j<grid.rows;j++)for(let i=0;i<grid.cols;i++){
  const x=x0+i*grid.cell,y=y0+j*grid.cell,k=j*grid.cols+i,outside=Math.max(Math.abs(x)-WX,y-YS,YN-y),inner=smooth(YM+6,YM-3,y);
  // Pátio externo baixo; pátio interno mais alto, com rampa no vão da grade; fora das muralhas o morro cai em encosta.
  h[k]=clamp(.3+inner*1.3+(fbm(x/20,y/20,83,2)-.5)*.12-smooth(1,14,outside)*.15+smooth(4,16,outside)*(fbm(x/22,y/22,87,3)*2.6),0,8);
  s[k]=outside>1?(fbm(x/18,y/18,89,2)>.5?3:0):y<YM?3:0;
 }
 const {objects,add,line}=collector('fort'),random=seeded(5119),between=(a,c)=>a+(c-a)*random();
 const wall=(x,y,along)=>add('fort_wall',x,y,along?{w:6,d:1.4,h:5}:{w:1.4,d:6,h:5});
 // Muralha externa com portaria ao sul, e muralha interna com portaria e grade.
 for(let x=-WX+3;x<-6;x+=6){wall(x,YS,true);wall(-x,YS,true);wall(x,YM,true);wall(-x,YM,true);}
 for(let x=-WX+3;x<WX;x+=6)wall(x,YN,true);
 for(let y=YS-3;y>YN;y-=6){wall(-WX,y,false);wall(WX,y,false);}
 add('fort_gatehouse',0,YS);add('fort_gatehouse',0,YM);gateJambs(add,0,YS);gateJambs(add,0,YM);
 for(const [x,y] of [[-WX,YS],[WX,YS],[-WX,YN],[WX,YN],[-WX,YM],[WX,YM],[-24,YS],[24,YS],[-WX,-30],[WX,-30],[-24,YN],[24,YN]])add('fort_tower',x,y);
 add('fort_keep',0,-46,{w:30,d:18,h:12});
 line('path',[[0,68],[0,YM+1]],3.2,{r:3.4});
 // Pátio externo: barracas a oeste, campo de treino a leste, poço e cavalariça.
 for(const [x,y] of [[-58,52],[-44,54],[-30,52],[-58,34],[-30,24],[-60,18],[-46,16]])add('tent',x,y);
 add('campfire',-44,36);add('log_pile',-34,36,{rot:80});add('hay',-52,44);add('hay',-49,46);add('crate',-22,46,{s:1.1});add('barrel',-21,44,{s:1});add('market_stall',-16,22);add('well',17,38);
 for(const [x,y] of [[30,46],[36,46],[42,46],[48,46],[30,40],[36,40],[42,40],[48,40]])add('fort_dummy',x,y,{s:1});
 for(const [x,y] of [[26,52],[33,54],[40,54],[47,52]])add('fort_rack',x,y,{s:1});
 for(let x=24;x<=54;x+=3)add('fence',x,33,{w:3});for(let y=36;y<=50;y+=3)add('fence',55,y,{w:.2,d:3});
 add('open_cart',52,22,{rot:15});add('hay',60,18);add('hay',62,21);add('log_pile',40,18,{rot:5});add('crate',32,18,{s:1});add('crate',30,20,{s:1.2});add('barrel',28,17,{s:1});
 for(const [x,y] of [[-5,YS-5],[5,YS-5],[-5,YM+6],[5,YM+6]])add('brazier',x,y);for(const [x,y] of [[-9,YS-3],[9,YS-3],[-9,YM+3],[9,YM+3]])add('banner',x,y);
 add('lamp',-12,40);add('lamp',12,40);
 // Coberturas de pedra para quem depende de distância: leitura de onde se abrigar.
 for(const [x,y,w,rot] of [[-12,32,6,0],[12,28,6,0],[-20,14,5,70],[20,14,5,110]])add('stone_wall',x,y,{w,rot});
 // Pátio interno: armaria a leste, capela partida a oeste, colunata até a torre.
 for(let y=-6;y>=-30;y-=8){add('column',-9,y,{r:.7,h:4});add('column',9,y,{r:.7,h:4});}
 for(const [x,y] of [[-5,-34],[5,-34],[-13,-30],[13,-30]])add('brazier',x,y);for(const x of [-16,16])add('banner',x,-36);
 for(const [x,y] of [[34,-12],[46,-14],[58,-10]])add('fort_rack',x,y,{s:1});for(const [x,y] of [[36,-30],[38,-28],[44,-34],[52,-30],[54,-28],[60,-34]])add('crate',x,y,{s:1.15});for(const [x,y] of [[41,-32],[48,-28],[57,-33]])add('barrel',x,y,{s:1});add('log_pile',48,-44);add('market_stall',60,-22,{rot:90});
 add('statue',-44,-34);for(const [x,y] of [[-56,-20],[-32,-20],[-56,-44],[-32,-44]])add('broken_column',x,y,{r:.8,h:2.4});add('obelisk',-44,-14);for(const [x,y] of [[-50,-30],[-38,-30]])add('brazier',x,y);add('grave_cross',-54,-34);add('grave_cross',-34,-36);add('skulls',-41,-26);
 for(const [x,y,w,rot] of [[-22,-16,6,20],[22,-16,6,160],[-24,-6,4,90],[24,-6,4,90]])add('stone_wall',x,y,{w,rot});
 // Para além das muralhas: encosta, pinheiros e pedras, sem colisão que importe ao percurso.
 for(let n=0,t=0;n<90&&t<900;t++){const x=between(-86,86),y=between(-76,76);if(Math.max(Math.abs(x)-WX,y-YS,YN-y)<5)continue;const kind=random();if(kind<.62)add('pine',x,y,{r:.45,h:r2(between(5,7))});else if(kind<.82)add('boulder',x,y,{r:r2(between(.8,1.6)),h:r2(between(1,1.8))});else add('cliff',x,y,{r:r2(between(1.5,2.6)),h:r2(between(2.6,4)),rot:Math.round(random()*360)});n++;}
 const spawns=[
  group('fort-gate',0,50,[0,0,1,6],5,{quest:true,radius:16}),group('fort-west',-44,38,[6,6,9,0,0],5,{quest:true,radius:17,spread:4}),group('fort-east',42,40,[0,0,0,1,3],5,{quest:true,radius:17,spread:4}),
  group('fort-inner-w',-34,-24,[1,9,0,3],6,{quest:true,radius:17,spread:3}),group('fort-inner-e',38,-22,[0,0,9,3],6,{quest:true,radius:17,spread:3}),group('fort-captain',0,-27,[0,1,1,3,9,0],7,{leader:'rare',quest:true,radius:17,spread:4})
 ];
 return {id:'itauna-fort',name:'Forte da Pedra Negra',biome:'forest',size,start:{x:0,y:61},level:5,spawns,objects,terrain:closeGrid({...grid,x0,y0,h,s},[]),style:{ground:'dirt',tint:'#c6baa4',fog:.1,grass:0,flowers:0,sun:3}};
}

// --- Gruta das Tecelãs ---
const ROOMS=[{x:60,y:62,r:13},{x:8,y:52,r:20},{x:-48,y:38,r:15},{x:40,y:10,r:16},{x:62,y:-36,r:19},{x:-2,y:-22,r:27},{x:-40,y:-58,r:21},{x:-66,y:-8,r:12},{x:18,y:-62,r:10}];
const TUNNELS=[[0,1],[0,3],[1,2],[1,5],[3,5],[3,4],[4,8],[8,6],[5,6],[2,7],[7,6]];
const POOL={x:-2,y:-24,rx:15,ry:11};
export function caveMap(){
 const size={w:190,h:176},X=size.w/2,Y=size.h/2,C=2,open=new Set(),key=(x,y)=>x+','+y,objects=collector('gruta');
 const {add}=objects,random=seeded(3307),between=(a,c)=>a+(c-a)*random();
 const carve=(cx,cy,r)=>{for(let x=-X+1;x<=X;x+=C)for(let y=-Y;y<=Y;y+=C){const a=Math.atan2(y-cy,x-cx),wob=1+(fbm(Math.cos(a)*2+cx*.1,Math.sin(a)*2+cy*.1,97,2)-.5)*.5;if(Math.hypot(x-cx,y-cy)<=r*wob)open.add(key(x,y));}};
 for(const r of ROOMS)carve(r.x,r.y,r.r);
 const paths=[];
 for(const [a,b] of TUNNELS){const p=ROOMS[a],q=ROOMS[b],len=Math.hypot(q.x-p.x,q.y-p.y),n=Math.ceil(len/4),nx=-(q.y-p.y)/len,ny=(q.x-p.x)/len;const pts=[];
  for(let i=0;i<=n;i++){const t=i/n,bend=Math.sin(t*Math.PI)*(fbm(a*3.1,b*2.7,101,1)-.5)*22,x=p.x+(q.x-p.x)*t+nx*bend,y=p.y+(q.y-p.y)*t+ny*bend;carve(x,y,3.8);pts.push([x,y]);}paths.push(pts);}
 carve(CAVE_POINTS.exit.x,CAVE_POINTS.exit.y,6);
 const isOpen=(x,y)=>open.has(key(Math.round(x/C)*C,Math.round(y/C)*C));
 // Parede rochosa só no contorno; o miolo é preenchido em blocos maiores, para a rocha parecer maciça sem encher o limite de peças.
 const edge=new Set();for(const cell of open){const [x,y]=cell.split(',').map(Number);for(const [dx,dy] of [[C,0],[-C,0],[0,C],[0,-C],[C,C],[-C,-C],[C,-C],[-C,C]])if(!open.has(key(x+dx,y+dy))&&Math.abs(x+dx)<=X&&Math.abs(y+dy)<=Y)edge.add(key(x+dx,y+dy));}
 for(const cell of edge){const [x,y]=cell.split(',').map(Number);add('cave_wall',x,y,{w:2,d:2,h:r2(2.6+hash(x,y,3)*1.1)});}
 for(let x=-X+3;x<=X;x+=7)for(let y=-Y+3;y<=Y;y+=7){let clear=true;for(let dx=-4;dx<=4;dx+=2)for(let dy=-4;dy<=4;dy+=2)if(isOpen(x+dx,y+dy))clear=false;if(clear)add('cave_wall',x,y,{w:7,d:7,h:r2(3+hash(x,y,5)*1.4)});}
 // Piso: leve irregularidade, lago subterrâneo e lama do covil.
 const grid=gridFor(size),n=grid.cols*grid.rows,x0=-(grid.cols-1)*grid.cell/2,y0=-(grid.rows-1)*grid.cell/2,h=new Float32Array(n),s=new Uint8Array(n);
 for(let j=0;j<grid.rows;j++)for(let i=0;i<grid.cols;i++){
  const x=x0+i*grid.cell,y=y0+j*grid.cell,k=j*grid.cols+i,e=Math.hypot((x-POOL.x)/POOL.rx,(y-POOL.y)/POOL.ry)*(1+(fbm(x/9,y/9,103,2)-.5)*.3);
  let v=.28+fbm(x/13,y/13,107,3)*.5;if(e<1.3)v=e>=1?mix(.16,v,smooth(1,1.3,e)):-1.8*(1-e*e)**.8;h[k]=v;
  if(Math.hypot(x-8,y-52)<20&&fbm(x/8,y/8,109,2)>.56)s[k]=5;
 }
 // Covil dos lobos: restos de presas, tocas e marcas de luta.
 const den=ROOMS[1];for(const [dx,dy] of [[-9,-6],[8,-8],[-3,9],[11,6],[-12,6]])add('bone_pile',den.x+dx,den.y+dy,{s:r2(between(.9,1.3))});for(const [dx,dy] of [[-4,-3],[5,4]])add('skulls',den.x+dx,den.y+dy,{s:1});add('boulder',den.x+11,den.y-9,{r:.8,h:1});add('boulder',den.x-12,den.y-3,{r:.7,h:.9});
 const gallery=ROOMS[2];for(const [dx,dy] of [[-5,-4],[6,3],[-1,7]])add('bone_pile',gallery.x+dx,gallery.y+dy,{s:r2(between(.9,1.2))});add('hideout_bedroll',gallery.x+5,gallery.y-5,{s:1});add('crate',gallery.x+7,gallery.y-7,{s:1});add('brazier',gallery.x+8,gallery.y-3);
 // Salão da bifurcação: primeiras teias.
 const fork=ROOMS[3];for(const [dx,dy,rot] of [[-9,-7,20],[9,-6,-20]])add('spider_web',fork.x+dx,fork.y+dy,{s:1,rot});add('egg_sac',fork.x+8,fork.y+6,{s:.8});add('bone_pile',fork.x-6,fork.y+6,{s:.9});
 // Berçário: casulos em toda parte e teias fechando os cantos.
 const nursery=ROOMS[4];for(let i=0;i<9;i++){const a=i*2.399,d=4+i*1.2;add('egg_sac',nursery.x+Math.cos(a)*d,nursery.y+Math.sin(a)*d,{s:r2(between(.8,1.4))});}for(let i=0;i<6;i++){const a=i*Math.PI/3+.4;add('spider_web',nursery.x+Math.cos(a)*14,nursery.y+Math.sin(a)*12,{s:r2(between(.9,1.3)),rot:Math.round(between(-25,25))});}
 // Lago subterrâneo: formações em volta e fungos na margem.
 for(let i=0;i<12;i++){const a=i*Math.PI/6+.2,rad=between(1.3,1.65);add('cave_spire',POOL.x+Math.cos(a)*POOL.rx*rad,POOL.y+Math.sin(a)*POOL.ry*rad,{r:r2(between(.45,.85)),h:r2(between(1.2,2.6))});}
 for(let i=0;i<14;i++){const a=i*Math.PI/7,rad=between(1.15,1.32);add('mushrooms',POOL.x+Math.cos(a)*POOL.rx*rad,POOL.y+Math.sin(a)*POOL.ry*rad,{s:r2(between(.9,1.5))});}
 // Câmara da Mãe-Tecelã: teias grandes, ninhos e despojos de quem veio antes.
 const queen=ROOMS[6];for(let i=0;i<7;i++){const a=i*Math.PI*2/7+.2;add('spider_web',queen.x+Math.cos(a)*15,queen.y+Math.sin(a)*13,{s:r2(between(1.1,1.6)),rot:Math.round(between(-30,30))});}for(let i=0;i<7;i++){const a=i*2.399,d=7+i*.8;add('egg_sac',queen.x+Math.cos(a)*d,queen.y+Math.sin(a)*d,{s:r2(between(.9,1.5))});}for(const [dx,dy] of [[3,-8],[-7,4],[9,5]])add('bone_pile',queen.x+dx,queen.y+dy,{s:1.2});add('hideout_cargo',queen.x-3,queen.y-11);add('crate',queen.x+1,queen.y-12,{s:1.1});add('cave_spire',queen.x+12,queen.y-8,{r:.8,h:2.4});
 // Entrada: luz de fora, restos e o primeiro aviso.
 add('boulder',ROOMS[0].x+6,ROOMS[0].y-4,{r:.7,h:.9});add('spider_web',ROOMS[0].x-7,ROOMS[0].y-8,{s:.8});add('brazier',CAVE_POINTS.exit.x-5,CAVE_POINTS.exit.y-4);add('cave_spire',ROOMS[0].x+7,ROOMS[0].y+5,{r:.6,h:1.8});
 for(const r of ROOMS)for(let k=0;k<2;k++){const a=between(0,6.28),d=r.r*between(.65,.82);add('boulder',r.x+Math.cos(a)*d,r.y+Math.sin(a)*d,{r:r2(between(.45,.8)),h:r2(between(.5,1))});}
 const spawns=[
  group('den-pack-a',8,46,[4,4,4],5,{radius:18,spread:3}),group('den-pack-b',-4,60,[4,4,4,4],5,{radius:16,spread:3}),group('gallery-pack',-48,38,[4,4,4],6,{leader:'magic',radius:16}),
  group('fork-spiders',40,8,[8,8,8],5,{radius:16,spread:3}),group('nursery-a',58,-32,[8,8,8,8],6,{radius:18,spread:4}),group('nursery-b',66,-44,[8,8,8],6,{leader:'magic',radius:16,spread:3}),
  group('lake-wolves',-24,-6,[4,4,8],6,{radius:16}),group('link-spiders',-66,-8,[8,8],6,{radius:14}),group('south-link',18,-62,[8,8,4],6,{radius:14}),group('cave-queen',-40,-56,[8,8,8,8,4,4],7,{leader:'rare',quest:true,radius:18,spread:5})
 ];
 return {id:'itauna-cave',name:'Gruta das Tecelãs',biome:'cave',size,start:{x:60,y:66},level:5,spawns,objects:objects.objects,terrain:closeGrid({...grid,x0,y0,h,s},[]),style:{ground:'stone',tint:'#ffffff',sky:'#0c0e11',sun:2.6,ambient:2,fog:.1,water:'#1f4f5c'}};
}
