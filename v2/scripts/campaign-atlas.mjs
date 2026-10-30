// Mapa da Campanha: atlas em pergaminho, no mesmo estilo da carta de Valdoria (conquest-panel.mjs).
// `atlasNodes` é a parte calculável (posição e estado de cada fase); `drawCampaignAtlas` só desenha em Canvas 2D.
export const ATLAS={width:1040,height:520,village:{x:128,y:452},castle:{x:944,y:228}};
const LAND=[[96,330],[104,276],[150,248],[196,206],[250,150],[318,126],[372,104],[440,96],[502,116],[560,98],[640,84],[716,102],[786,86],[858,76],[918,92],[972,128],[992,186],[966,236],[984,292],[950,352],[968,408],[918,452],[846,468],[786,444],[716,462],[648,440],[582,468],[510,448],[444,470],[372,450],[300,474],[226,462],[160,490],[104,462],[92,400]];
// Cor de cada tipo de fase: cripta (salas), floresta (arena), trilha (side-scroller) e posto do chefe.
const WASH={rooms:'#6d6382',arena:'#4d8a3d',strip:'#b58c45',boss:'#9a3f35'};
const round=n=>+n.toFixed(1);
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// Estado de cada fase: `done` (concluída), `open` (liberada) ou `locked`. `next` marca a primeira liberada ainda não concluída.
export function atlasNodes(stages,campaign){
 const list=stages.filter(Boolean).map(s=>({n:s.n,id:'stage'+s.n,kind:s.kind,name:s.name,x:round(s.pos[0]*ATLAS.width/100),y:round(s.pos[1]*ATLAS.height/100),state:campaign.cleared[s.n]?'done':s.n<=campaign.unlocked?'open':'locked'}));
 const next=list.find(n=>n.state==='open');for(const n of list)n.next=n===next;
 return list;
}
export function atlasHit(nodes,x,y){return nodes.find(n=>Math.hypot(n.x-x,n.y-y)<24||Math.abs(n.x-x)<50&&y>n.y+18&&y<n.y+34);}

export function drawCampaignAtlas(canvas,nodes,{selected,village=false}){
 const c=canvas.getContext('2d'),W=ATLAS.width,H=ATLAS.height,dpr=Math.min(2,window.devicePixelRatio||1),done=nodes.filter(n=>n.state==='done').length;
 canvas.width=W*dpr;canvas.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);
 const path=(pts,closed=false)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(closed)c.closePath();};
 const text=(s,x,y,size=13,color='#4c412e',bold=false)=>{c.font=(bold?'bold ':'')+size+'px Georgia';c.fillStyle=color;c.textAlign='center';c.fillText(s,x,y);};
 const plate=(s,x,y,size,color,bold=false)=>{c.font=(bold?'bold ':'')+size+'px Georgia';const w=c.measureText(s).width;c.fillStyle='rgba(225,215,176,.89)';c.fillRect(x-w/2-4,y-size,w+8,size+5);text(s,x,y,size,color,bold);};
 // Pergaminho com fibras e o mar em volta da terra.
 const bg=c.createRadialGradient(490,230,30,510,250,650);bg.addColorStop(0,'#e0d0a4');bg.addColorStop(.72,'#c4af7f');bg.addColorStop(1,'#897449');c.fillStyle=bg;c.fillRect(0,0,W,H);
 const random=rng(0x3A7E1D);for(let i=0;i<4200;i++){const x=random()*W,y=random()*H,v=random();c.fillStyle=v>.5?'rgba(65,43,18,.06)':'rgba(255,245,192,.13)';c.fillRect(x,y,v*3+1,1);}
 c.fillStyle='rgba(82,117,117,.25)';c.fillRect(0,0,W,H);
 path(LAND,true);c.lineJoin='round';for(const [w,a] of [[26,.07],[15,.1],[7,.13]]){c.strokeStyle='rgba(60,96,96,'+a+')';c.lineWidth=w;c.stroke();}
 c.fillStyle='#acb184';c.fill();
 c.save();path(LAND,true);c.clip();
 for(const n of nodes){const wash=c.createRadialGradient(n.x,n.y,4,n.x,n.y,95);wash.addColorStop(0,WASH[n.kind]+'b0');wash.addColorStop(1,WASH[n.kind]+'00');c.fillStyle=wash;c.fillRect(n.x-95,n.y-95,190,190);}
 // Relevo e vegetação: montanhas ao norte, bosque em volta da floresta, lápides na cripta.
 const peak=(x,y,s)=>{path([[x-s,y+s*.8],[x-s*.2,y-s*.7],[x+s*.15,y-s*.2],[x+s*.5,y-s],[x+s*1.1,y+s*.8]]);c.strokeStyle='rgba(87,78,54,.55)';c.lineWidth=1.4;c.stroke();};
 for(let i=0;i<9;i++)peak(430+i*38+random()*14,126+random()*22,9+random()*7);
 const forest=nodes.find(n=>n.kind==='arena')||nodes[1];
 for(let i=0;i<70;i++){const a=random()*Math.PI*2,d=22+random()*88,x=forest.x+Math.cos(a)*d*1.3,y=forest.y+Math.sin(a)*d*.9,s=5+random()*4;c.fillStyle=random()>.5?'rgba(52,90,45,.75)':'rgba(66,106,52,.7)';path([[x,y-s*1.6],[x+s*.8,y+s*.4],[x-s*.8,y+s*.4]],true);c.fill();c.fillStyle='rgba(70,52,30,.7)';c.fillRect(x-.6,y+s*.4,1.2,s*.5);}
 const crypt=nodes.find(n=>n.kind==='rooms');
 if(crypt)for(let i=0;i<9;i++){const x=crypt.x-48+random()*96,y=crypt.y-34+random()*68;if(Math.hypot(x-crypt.x,y-crypt.y)<28)continue;c.fillStyle='rgba(76,68,92,.6)';c.fillRect(x-2,y-6,4,7);c.fillRect(x-4,y-4,8,1.4);}
 c.restore();path(LAND,true);c.strokeStyle='#574e36';c.lineWidth=3;c.stroke();
 // Estradas entre as fases (tracejadas; roxas quando a fase de origem já foi concluída) e o caminho final ao castelo.
 const road=(a,b,active,bend)=>{const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2-dy/length*bend,(a.y+b.y)/2+dx/length*bend,b.x,b.y);c.strokeStyle=active?'#705184':'rgba(100,80,47,.4)';c.lineWidth=active?2.2:1.4;c.setLineDash(active?[5,4]:[3,5]);c.stroke();c.setLineDash([]);};
 nodes.forEach((n,i)=>{if(i)road(nodes[i-1],n,nodes[i-1].state==='done',i%2?16:-16);});
 const last=nodes[nodes.length-1];if(last)road(last,ATLAS.castle,last.state==='done',-10);
 if(village&&nodes[0]){const v=ATLAS.village;road({x:v.x,y:v.y},nodes[0],true,10);}
 // Castelo de Valdoria: destino da campanha, além do Posto do Capitão.
 {const {x,y}=ATLAS.castle,open=last?.state==='done';c.fillStyle=open?'#5e4a74':'#7c7156';c.strokeStyle='#e4d3a3';c.lineWidth=1.6;c.fillRect(x-17,y-12,34,24);c.strokeRect(x-17,y-12,34,24);for(let i=0;i<4;i++){c.fillRect(x-17+i*9.5,y-19,6.5,8);}c.fillRect(x-4,y-32,8,22);c.beginPath();c.moveTo(x-6,y-32);c.lineTo(x,y-42);c.lineTo(x+6,y-32);c.closePath();c.fill();c.fillStyle='#e4d3a3';c.fillRect(x-3,y-3,6,15);plate('Castelo de Valdoria',x,y+31,10,'#5a4c33');}
 // Vila de Eldrin: telhados e fumaça no canto sudoeste.
 if(village){const {x,y}=ATLAS.village;for(const [dx,dy,s] of [[-14,4,9],[0,-3,11],[14,5,8]]){c.fillStyle='#e0d1a1';c.fillRect(x+dx-s/2,y+dy,s,s*.7);c.fillStyle='#8a4b3a';c.beginPath();c.moveTo(x+dx-s*.65,y+dy);c.lineTo(x+dx,y+dy-s*.6);c.lineTo(x+dx+s*.65,y+dy);c.closePath();c.fill();}plate('Vila de Eldrin',x,y+28,12,'#352e24');}
 // Fases.
 for(const n of nodes){
  const won=n.state==='done',available=n.state==='open',active=selected===n.n,tower=n.kind==='boss',size=n.n===1?14:12;
  if(n.next&&!won){c.strokeStyle='rgba(212,175,55,.9)';c.lineWidth=2;c.setLineDash([3,3]);c.beginPath();c.arc(n.x,n.y,tower?31:26,0,Math.PI*2);c.stroke();c.setLineDash([]);}
  if(active){c.strokeStyle='#fbefc8';c.lineWidth=3;c.beginPath();c.arc(n.x,n.y,tower?25:21,0,Math.PI*2);c.stroke();}
  c.fillStyle=won?'#725086':available?'#3e5134':'#827758';c.strokeStyle='#e4d3a3';c.lineWidth=2;
  if(tower){c.fillRect(n.x-15,n.y-11,30,27);c.strokeRect(n.x-15,n.y-11,30,27);for(let i=0;i<3;i++)c.fillRect(n.x-15+i*11,n.y-19,8,10);text(won?'✓':available?'•':'×',n.x,n.y+9,15,'#eee0b3');}
  else{path([[n.x,n.y-size],[n.x+size,n.y],[n.x,n.y+size],[n.x-size,n.y]],true);c.fill();c.stroke();text(won?'✓':available?String(n.n):'×',n.x,n.y+5,14,'#eee0b3');}
  plate(n.name,n.x,n.y+(tower?36:30),11,available||won?'#352e24':'#6d6047',tower);
 }
 // Legenda: títulos, bússola e progresso.
 text('BOSQUES DE ELDRIN',560,226,13,'#766447');c.save();c.translate(54,400);c.rotate(-Math.PI/2);text('MAR DE CINZAS',0,0,12,'#5f7a76');c.restore();
 c.save();c.translate(112,118);c.strokeStyle='#655338';c.fillStyle='rgba(101,83,56,.55)';c.lineWidth=1.2;c.beginPath();c.arc(0,0,22,0,Math.PI*2);c.stroke();path([[0,-30],[6,0],[0,30],[-6,0]],true);c.fill();path([[-30,0],[0,-6],[30,0],[0,6]],true);c.stroke();text('N',0,-36,11,'#5c4b32');c.restore();
 c.fillStyle='rgba(224,214,173,.9)';c.fillRect(390,476,260,26);c.strokeStyle='#8b7652';c.lineWidth=1;c.strokeRect(390,476,260,26);
 text('FASES CONCLUÍDAS · '+done+' / '+nodes.length,520,494,12,'#614276');
 c.strokeStyle='#655338';c.lineWidth=3;c.strokeRect(12,12,W-24,H-24);text('VALDORIA',110,45,17,'#5c4b32');text('CARTA DE ELDRIN · ATO I',920,45,11,'#786143');
}
