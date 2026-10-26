// Branching route atlas. All markers and hit tests share map-space coordinates.
const VALDORIA_MAP={width:1040,height:520,positions:[[[310,365]],[[299,252],[408,329],[350,399]],[[381,191],[489,280],[463,385]],[[480,137],[575,242],[565,361]],[[594,104],[662,295],[660,396]],[[708,130],[746,233],[727,341]],[[640,181]]]};
function endgameMapMount(root,state,difficulty){
 const nodes=EndgameModel.routeGraph(state.seed).map(n=>{const [x,y]=VALDORIA_MAP.positions[n.depth][n.depth===0||n.depth===6?0:n.lane];return {...n,x,y};});
 const completed=id=>state.routes.completed.includes(id),open=n=>EndgameModel.routeAvailable(state,n)&&EndgameModel.available(state,n.kind,difficulty);
 const host=document.createElement('section');host.className='conquest-atlas';host.setAttribute('aria-label','Mapa de Valdoria');
 host.innerHTML='<div class="atlas-title"><span>CAMINHOS DE VALDORIA</span><small>Conclua uma área · escolha entre três rotas · alcance a torre</small></div><div class="atlas-scroll" tabindex="0" aria-label="Mapa de rotas; role horizontalmente para explorar"><canvas role="img" aria-label="Mapa com entrada, cinco etapas de três rotas com biomas diferentes e uma torre final"></canvas></div><div class="atlas-legend"><span>◇ Disponível</span><span>✓ Área concluída</span><span>× Rota bloqueada</span><span>Violeta · influência de Zephyr</span></div><p class="atlas-touch">Selecione um ponto no mapa ou nos botões. Cada vitória abre três caminhos da etapa seguinte. Deslize para explorar no celular.</p><div class="atlas-nodes" role="group" aria-label="Áreas e rotas"></div><div class="atlas-detail" aria-live="polite"></div>';
 root.querySelector('.conquest-heading').after(host);
 const canvas=host.querySelector('canvas'),c=canvas.getContext('2d'),W=VALDORIA_MAP.width,H=VALDORIA_MAP.height;
 let selected=nodes.find(n=>n.id===ENDGAME.routeSelected)||nodes.find(n=>n.id===EndgameModel.nextRoute(state)?.id)||nodes[0];
 const path=(points,closed=false)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(closed)c.closePath();};
 const line=(points,color,width=1,dash=[])=>{path(points);c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.stroke();c.setLineDash([]);};
 const text=(s,x,y,size=13,color='#4c412e')=>{c.font=size+'px Georgia';c.fillStyle=color;c.textAlign='center';c.fillText(s,x,y);};
 const rr=ExpeditionModel.random(state.seed),texture=Array.from({length:4200},()=>[rr()*W,rr()*H,rr()]);
 function draw(){
  const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=W*dpr;canvas.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);
  const bg=c.createRadialGradient(490,230,30,510,250,650);bg.addColorStop(0,'#e0d0a4');bg.addColorStop(.72,'#c4af7f');bg.addColorStop(1,'#897449');c.fillStyle=bg;c.fillRect(0,0,W,H);
  for(const [x,y,v]of texture){c.fillStyle=v>.5?'rgba(65,43,18,.06)':'rgba(255,245,192,.13)';c.fillRect(x,y,v*3+1,1);}
  const coast=[[24,55],[89,74],[112,123],[83,166],[134,196],[107,244],[165,278],[145,313],[199,345],[174,391],[223,423],[193,480],[24,496]];
  path(coast,true);c.fillStyle='rgba(82,117,117,.25)';c.fill();c.strokeStyle='#687d73';c.lineWidth=2;c.stroke();
  for(let i=0;i<18;i++)line([[35,105+i*20],[65+i%3*12,105+i*20]],'rgba(73,102,99,.3)');
  line([[130,36],[221,105],[288,102],[337,154],[390,172]],'#7d6242',1.5,[6,5]);
  line([[724,154],[818,125],[851,181],[935,195],[1015,167]],'#7d6242',1.5,[6,5]);
  line([[679,411],[744,449],[819,433],[884,476],[1005,462]],'#7d6242',1.5,[6,5]);
  for(let i=0;i<18;i++){const x=274+i*31,y=65+Math.sin(i*.7)*18;line([[x-11,y+13],[x,y-10],[x+12,y+13]],'#8d7955');line([[x-4,y-2],[x,y+2],[x+4,y-2]],'#9b825c');}
  text('TERRAS DA COROA',875,92,14,'#786446');text('BOSQUES DE ELDRIN',194,174,13,'#766447');
  text('TERRITÓRIOS',896,296,15,'#897551');text('NÃO EXPLORADOS',896,318,13,'#897551');
  c.save();c.translate(83,360);c.rotate(-Math.PI/2);text('M A R   D A S   B R U M A S',0,0,13,'#607777');c.restore();
  const land=[[256,239],[303,207],[360,218],[390,172],[457,162],[507,113],[576,126],[619,84],[694,108],[724,154],[765,179],[750,231],[791,272],[765,333],[702,363],[679,411],[601,426],[560,403],[494,431],[439,402],[370,412],[339,384],[282,374],[290,319],[250,281]];
  path(land,true);c.fillStyle='#acb184';c.fill();
  c.save();path(land,true);c.clip();
  // Biomes blend into the landscape instead of forming a grid of cells.
  for(const n of nodes){
   const biome=EndgameModel.routeBiomes[n.biome],wash=c.createRadialGradient(n.x,n.y,4,n.x,n.y,72);wash.addColorStop(0,biome.color+'b0');wash.addColorStop(1,biome.color+'00');c.fillStyle=wash;c.fillRect(n.x-72,n.y-72,144,144);
   for(let i=0;i<3;i++){
    const x=n.x-33+i*27,y=n.y-31+(i%2)*9;
    if(n.biome==='mountain')line([[x-8,y+7],[x,y-8],[x+8,y+7]],'rgba(84,79,66,.55)');
    else if(n.biome==='river')line([[x-10,y],[x-4,y-3],[x+3,y+2],[x+12,y-2]],'rgba(70,109,111,.55)',1.5);
    else if(n.biome==='desert'){c.beginPath();c.ellipse(x,y,10,4,0,Math.PI,Math.PI*2);c.strokeStyle='rgba(133,103,49,.5)';c.stroke();}
    else if(n.biome==='snow'){line([[x-4,y],[x+4,y]],'#e0e4d5',1.5);line([[x,y-4],[x,y+4]],'#e0e4d5',1.5);}
    else if(n.biome==='forest'){path([[x,y-9],[x-5,y+4],[x+5,y+4]],true);c.fillStyle='rgba(66,100,54,.5)';c.fill();}
    else{c.beginPath();c.ellipse(x,y,9,2.5,0,0,Math.PI*2);c.strokeStyle='rgba(75,108,71,.45)';c.stroke();}
   }
  }
  const influence=c.createLinearGradient(250,0,790,0);influence.addColorStop(0,'rgba(98,65,124,.45)');influence.addColorStop(1,'rgba(111,73,134,.23)');c.fillStyle=influence;c.fillRect(250,80,550*state.influence/100,365);
  line([[303,225],[351,263],[397,275],[450,312],[471,356],[540,384],[599,412]],'rgba(73,107,102,.5)',6);
  line([[303,225],[351,263],[397,275],[450,312],[471,356],[540,384],[599,412]],'#a5b5a0',2);
  c.restore();path(land,true);c.strokeStyle='#574e36';c.lineWidth=3;c.stroke();path(land,true);c.strokeStyle='#e8dbad';c.lineWidth=1;c.setLineDash([3,5]);c.stroke();c.setLineDash([]);
  function road(a,b,active){
   const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,bend=((a.lane+b.lane)%2?1:-1)*Math.min(15,length*.12);
   c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2-dy/length*bend,(a.y+b.y)/2+dx/length*bend,b.x,b.y);c.strokeStyle=active?'#705184':'rgba(100,80,47,.35)';c.lineWidth=active?2:1.2;c.setLineDash(active?[4,4]:[3,5]);c.stroke();c.setLineDash([]);
  }
  for(const n of nodes){
   const parents=nodes.filter(p=>n.parents.includes(p.id)),visited=parents.filter(p=>completed(p.id)),candidates=visited.length?visited:parents;
   const nearest=candidates.sort((a,b)=>Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y))[0];
   if(nearest)road(nearest,n,completed(nearest.id));
  }
  // The selected location exposes its three real outgoing choices.
  for(const child of nodes.filter(n=>n.parents.includes(selected.id)))road(selected,child,completed(selected.id));
  line([[200,414],[245,396],[280,389],[310,365]],'#685638',2,[5,5]);
  text('Vila de Eldrin',202,448,15);c.fillStyle='#665437';c.fillRect(193,418,18,13);path([[189,419],[202,407],[215,419]],true);c.fill();
  for(const n of nodes){
   const available=open(n),won=completed(n.id),active=selected.id===n.id,tower=n.id==='tower',size=n.depth===0?15:11;
   if(active){c.strokeStyle='#fbefc8';c.lineWidth=3;c.beginPath();c.arc(n.x,n.y,tower?25:21,0,Math.PI*2);c.stroke();}
   c.fillStyle=won?'#725086':available?'#3e5134':'#827758';c.strokeStyle='#e4d3a3';c.lineWidth=2;
   if(tower){c.fillRect(n.x-15,n.y-11,30,27);c.strokeRect(n.x-15,n.y-11,30,27);for(let i=0;i<3;i++)c.fillRect(n.x-15+i*11,n.y-19,8,10);c.fillStyle='#e3d4a3';c.fillRect(n.x-3,n.y+3,7,13);}
   else{path([[n.x,n.y-size],[n.x+size,n.y],[n.x,n.y+size],[n.x-size,n.y]],true);c.fill();c.stroke();text(won?'✓':available?'•':'×',n.x,n.y+4,14,'#eee0b3');}
   const label=tower?'Torre do Brejo':n.depth===0?'Trilhas do Brejo':EndgameModel.routeBiomes[n.biome].name;
   c.font=(tower?'bold ':'')+'11px Georgia';const tw=c.measureText(label).width;c.fillStyle='rgba(225,215,176,.89)';c.fillRect(n.x-tw/2-4,n.y+18,tw+8,16);text(label,n.x,n.y+30,11,available?'#352e24':'#6d6047');
  }
  c.fillStyle='rgba(224,214,173,.9)';c.fillRect(390,448,325,46);c.strokeStyle='#8b7652';c.strokeRect(390,448,325,46);
  text('PÂNTANO DA FEBRE NEGRA',552,467,17,'#3f482b');text('INFLUÊNCIA · '+state.influence+'%'+(state.conquered?' · CONQUISTADO':''),552,485,12,'#614276');
  c.save();c.translate(941,411);for(let i=0;i<8;i++){c.rotate(Math.PI/4);path([[0,-(i%2?18:33)],[-5,0],[0,6],[5,0]],true);c.fillStyle=i%2?'#a18a5f':'#5e5138';c.fill();}c.restore();text('N',941,368,15);text('S',941,463,12);text('O',895,416,12);text('L',987,416,12);
  c.strokeStyle='#655338';c.lineWidth=3;c.strokeRect(12,12,W-24,H-24);c.lineWidth=1;c.strokeRect(19,19,W-38,H-38);
  text('VALDORIA',110,45,17,'#5c4b32');text('CARTA DO BREJO · I',944,45,11,'#786143');
 }

 function choose(node){
  selected=node;ENDGAME.routeSelected=node.id;ENDGAME.mapSelected=node.kind;draw();
  for(const button of host.querySelectorAll('[data-map-route]'))button.setAttribute('aria-pressed',String(button.dataset.mapRoute===node.id));
  const detail=host._routeDetail||host.querySelector('.atlas-detail');host._routeDetail=detail;
  const reason=!EndgameModel.routeAvailable(state,node)?'Conclua uma área ligada à etapa anterior para abrir esta rota.':EndgameModel.blockedReason(state,node.kind,difficulty);
  const reward=EndgameModel.rewards(state,node.kind,difficulty,state.offers[difficulty].selected);
  detail.replaceChildren();const title=document.createElement('strong');title.textContent=node.label+' · '+EndgameModel.encounters[node.kind].name;
  const status=document.createElement('p');status.textContent=reason||(completed(node.id)?'Área concluída · pode ser revisitada.':'Rota disponível. Vencer abre três caminhos na próxima etapa.');
  const preview=document.createElement('small');preview.textContent=EndgameModel.routeBiomes[node.biome].name+' · Dificuldade '+difficulty+' · Intensidade '+reward.score+' · Loot nível '+reward.itemLevel;
  const button=document.createElement('button');button.className='btn';button.textContent='Entrar na rota · '+node.label;button.disabled=!open(node);button.onclick=()=>endgameStart(node.kind,node.id);
  detail.append(title,status,preview,button);
  const picker=root.querySelector('select[aria-label="Local do mapa"]');if(picker)picker.value=node.id;
  if(typeof endgameScreenSelection==='function')endgameScreenSelection(host,node,state,difficulty,button);
 }
 for(const node of nodes){
  const button=document.createElement('button');button.className='atlas-node';button.dataset.mapRoute=node.id;button.textContent=(node.depth===0?'Entrada':node.id==='tower'?'Torre':node.depth+'.'+(node.lane+1)+' '+EndgameModel.routeBiomes[node.biome].name)+(completed(node.id)?' ✓':open(node)?' ◇':' ×');
  button.setAttribute('aria-label','Rota '+node.id+' · '+node.label);button.onclick=()=>choose(node);host.querySelector('.atlas-nodes').append(button);
 }
 function hit(event){const b=canvas.getBoundingClientRect(),x=(event.clientX-b.left)*W/b.width,y=(event.clientY-b.top)*H/b.height;return nodes.find(n=>Math.hypot(n.x-x,n.y-y)<20||Math.abs(n.x-x)<32&&y>n.y+18&&y<n.y+33);}
 canvas.addEventListener('click',event=>{const node=hit(event);if(node)choose(node);});canvas.addEventListener('pointermove',event=>{canvas.style.cursor=hit(event)?'pointer':'default';});
 choose(selected);
}
