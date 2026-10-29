// Aba Valdoria do Relicário: dificuldade, maldições, recompensas, encontros e o mapa de rotas (Canvas 2D).
// Textos e desenho do mapa seguem scripts/endgame.js e scripts/endgame-map.js; a tela dedicada de tela cheia fica para a E11.
import Endgame from './shared-endgame.mjs';
import Expedition from './shared-expedition.mjs';
const MAP={width:1040,height:520,positions:[[[310,365]],[[299,252],[408,329],[350,399]],[[381,191],[489,280],[463,385]],[[480,137],[575,242],[565,361]],[[594,104],[662,295],[660,396]],[[708,130],[746,233],[727,341]],[[640,181]]]};
const LAND=[[256,239],[303,207],[360,218],[390,172],[457,162],[507,113],[576,126],[619,84],[694,108],[724,154],[765,179],[750,231],[791,272],[765,333],[702,363],[679,411],[601,426],[560,403],[494,431],[439,402],[370,412],[339,384],[282,374],[290,319],[250,281]];
const COAST=[[24,55],[89,74],[112,123],[83,166],[134,196],[107,244],[165,278],[145,313],[199,345],[174,391],[223,423],[193,480],[24,496]];
// Desenha o pergaminho: costa, terras, biomas, influência, estradas e marcos. Retorna a lista de nós em coordenadas do mapa.
function drawAtlas(canvas,state,nodes,selected,open){
 const c=canvas.getContext('2d'),W=MAP.width,H=MAP.height,dpr=Math.min(2,window.devicePixelRatio||1),done=id=>state.routes.completed.includes(id);
 canvas.width=W*dpr;canvas.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);
 const path=(pts,closed=false)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(closed)c.closePath();};
 const line=(pts,color,width=1,dash=[])=>{path(pts);c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.stroke();c.setLineDash([]);};
 const text=(s,x,y,size=13,color='#4c412e')=>{c.font=size+'px Georgia';c.fillStyle=color;c.textAlign='center';c.fillText(s,x,y);};
 const bg=c.createRadialGradient(490,230,30,510,250,650);bg.addColorStop(0,'#e0d0a4');bg.addColorStop(.72,'#c4af7f');bg.addColorStop(1,'#897449');c.fillStyle=bg;c.fillRect(0,0,W,H);
 const rr=Expedition.random(state.seed);for(let i=0;i<4200;i++){const x=rr()*W,y=rr()*H,v=rr();c.fillStyle=v>.5?'rgba(65,43,18,.06)':'rgba(255,245,192,.13)';c.fillRect(x,y,v*3+1,1);}
 path(COAST,true);c.fillStyle='rgba(82,117,117,.25)';c.fill();c.strokeStyle='#687d73';c.lineWidth=2;c.stroke();
 text('TERRAS DA COROA',875,92,14,'#786446');text('BOSQUES DE ELDRIN',194,174,13,'#766447');text('TERRITÓRIOS',896,296,15,'#897551');text('NÃO EXPLORADOS',896,318,13,'#897551');
 path(LAND,true);c.fillStyle='#acb184';c.fill();
 c.save();path(LAND,true);c.clip();
 for(const n of nodes){const biome=Endgame.routeBiomes[n.biome],wash=c.createRadialGradient(n.x,n.y,4,n.x,n.y,72);wash.addColorStop(0,biome.color+'b0');wash.addColorStop(1,biome.color+'00');c.fillStyle=wash;c.fillRect(n.x-72,n.y-72,144,144);}
 const influence=c.createLinearGradient(250,0,790,0);influence.addColorStop(0,'rgba(98,65,124,.45)');influence.addColorStop(1,'rgba(111,73,134,.23)');c.fillStyle=influence;c.fillRect(250,80,550*state.influence/100,365);
 c.restore();path(LAND,true);c.strokeStyle='#574e36';c.lineWidth=3;c.stroke();
 const road=(a,b,active)=>{const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,bend=((a.lane+b.lane)%2?1:-1)*Math.min(15,length*.12);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2-dy/length*bend,(a.y+b.y)/2+dx/length*bend,b.x,b.y);c.strokeStyle=active?'#705184':'rgba(100,80,47,.35)';c.lineWidth=active?2:1.2;c.setLineDash(active?[4,4]:[3,5]);c.stroke();c.setLineDash([]);};
 for(const n of nodes){const parents=nodes.filter(p=>n.parents.includes(p.id)),visited=parents.filter(p=>done(p.id)),list=visited.length?visited:parents,near=[...list].sort((a,b)=>Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y))[0];if(near)road(near,n,done(near.id));}
 for(const child of nodes.filter(n=>n.parents.includes(selected.id)))road(selected,child,done(selected.id));
 line([[200,414],[245,396],[280,389],[310,365]],'#685638',2,[5,5]);text('Vila de Eldrin',202,448,15);
 for(const n of nodes){
  const available=open(n),won=done(n.id),active=selected.id===n.id,tower=n.id==='tower',size=n.depth===0?15:11;
  if(active){c.strokeStyle='#fbefc8';c.lineWidth=3;c.beginPath();c.arc(n.x,n.y,tower?25:21,0,Math.PI*2);c.stroke();}
  c.fillStyle=won?'#725086':available?'#3e5134':'#827758';c.strokeStyle='#e4d3a3';c.lineWidth=2;
  if(tower){c.fillRect(n.x-15,n.y-11,30,27);c.strokeRect(n.x-15,n.y-11,30,27);for(let i=0;i<3;i++)c.fillRect(n.x-15+i*11,n.y-19,8,10);}
  else{path([[n.x,n.y-size],[n.x+size,n.y],[n.x,n.y+size],[n.x-size,n.y]],true);c.fill();c.stroke();text(won?'✓':available?'•':'×',n.x,n.y+4,14,'#eee0b3');}
  const label=tower?'Torre do Brejo':n.depth===0?'Trilhas do Brejo':Endgame.routeBiomes[n.biome].name;
  c.font=(tower?'bold ':'')+'11px Georgia';const tw=c.measureText(label).width;c.fillStyle='rgba(225,215,176,.89)';c.fillRect(n.x-tw/2-4,n.y+18,tw+8,16);text(label,n.x,n.y+30,11,available?'#352e24':'#6d6047');
 }
 c.fillStyle='rgba(224,214,173,.9)';c.fillRect(390,448,325,46);c.strokeStyle='#8b7652';c.strokeRect(390,448,325,46);
 text('PÂNTANO DA FEBRE NEGRA',552,467,17,'#3f482b');text('INFLUÊNCIA · '+state.influence+'%'+(state.conquered?' · CONQUISTADO':''),552,485,12,'#614276');
 c.strokeStyle='#655338';c.lineWidth=3;c.strokeRect(12,12,W-24,H-24);text('VALDORIA',110,45,17,'#5c4b32');text('CARTA DO BREJO · I',944,45,11,'#786143');
}
export function createConquestPanel(s,{enter,changed}){
 const host=document.getElementById('valdoria-content');
 let routeSelected=null,message='';
 const node=(tag,text,parent,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;parent?.append(e);return e;};
 const state=()=>s.save.character.conquest,set=value=>{s.save.character.conquest=value;changed();};
 // Ao abrir, a maior dificuldade liberada já fica selecionada; se diferir do mapa atual, o novo mapa começa do zero.
 function open(){const latest=Endgame.latestDifficulty(state());if(latest.difficulty!==state().difficulty){set(latest);routeSelected=null;}message='';render();}
 function start(kind,routeId){const result=enter(kind,routeId);if(!result.ok){message=result.message;render();}}
 function render(){
  const st=state(),d=st.difficulty,selected=st.offers[d].selected,r=Endgame.rewards(st,'expedition',d,selected),next=Endgame.nextEncounter(st);host.replaceChildren();
  const sec=node('section',undefined,host,'conquest-panel');
  const head=node('div',undefined,sec,'conquest-heading');node('small','CONQUISTA DE VALDORIA · TERRITÓRIO I',head);node('h2','Pântano da Febre Negra',head);node('p','Domine a decomposição. Revele os tenentes, tome a fortaleza e obtenha o Fragmento da Pestilência.',head);
  const prog=node('div',undefined,sec,'conquest-progress');node('b',st.conquered?'TERRITÓRIO CONQUISTADO':st.influence+'% de influência',prog);const bar=node('progress',undefined,prog);bar.max=100;bar.value=st.influence;bar.setAttribute('aria-label','Influência no pântano');node('span','30% · Boticário   60% · Guardiã   100% + tenentes · Fortaleza',prog);
  if(message)node('p',message,sec,'conquest-error').setAttribute('role','alert');
  const nb=node('section',undefined,sec,'conquest-next');nb.setAttribute('aria-label','Próximo objetivo da conquista');node('h3',st.conquered?'Revisitar a fortaleza':'Próximo objetivo',nb);
  node('p',st.influence===100&&!st.conquered?(Endgame.blockedReason(st,'fortress',d)||'Influência completa e tenentes derrotados. A fortaleza está liberada!'):next==='expedition'?'Conclua expedições para aumentar sua influência.':next==='fortress'?'A fortaleza está disponível na dificuldade escolhida.':'Tenente revelado. Derrote '+Endgame.encounters[next].name+' para avançar rumo à fortaleza.',nb);
  const go=node('button',(st.conquered?'Revisitar agora · ':'Avançar agora · ')+Endgame.encounters[next].name,nb,'btn');go.type='button';go.onclick=()=>start(next);
  const settings=node('div',undefined,sec,'conquest-settings'),label=node('label','Dificuldade regional ',settings),input=node('input',undefined,label);input.type='number';input.min=1;input.step=1;input.value=d;input.setAttribute('aria-label','Dificuldade regional');
  const apply=node('button','Aplicar',label,'btn conquest-apply-difficulty');apply.type='button';
  node('span','Recomendado: nível '+(8+(d-1)*6)+' ou build equivalente. Maior liberada: '+st.unlocked+'.',settings);node('p','Sem limite de dificuldade. Trocar o nível reinicia influência, rotas e tenentes.',sec);
  const doApply=()=>{const value=Number(input.value);if(!Endgame.validDifficulty(value)){input.setCustomValidity('Use um número inteiro a partir de 1.');input.reportValidity();return;}input.setCustomValidity('');set(Endgame.selectDifficulty(st,value));routeSelected=null;render();};
  apply.onclick=doApply;input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();doApply();}};
  mountAtlas(sec,st,d);
  node('h3','Escolha suas maldições · '+selected.length+'/3',sec);node('p','Quatro ofertas sorteadas. A oferta muda ao vencer um encontro; morte, saída e recarga preservam as opções.',sec);
  const curses=node('div',undefined,sec,'conquest-curses');
  for(const id of Endgame.offer(st.seed,st.offers[d].cycle,d)){
   const c=Endgame.curses.find(c=>c.id===id),lab=node('label',undefined,curses,'conquest-curse'+(selected.includes(id)?' selected':'')),box=node('input',undefined,lab);box.type='checkbox';box.checked=selected.includes(id);box.disabled=!box.checked&&selected.length>=3;box.setAttribute('aria-label',c.name);
   const body=node('span',undefined,lab);node('b',c.name,body);node('em',c.text,body);node('small','Intensidade +'+c.weight,body);
   box.onchange=()=>{const copy=Endgame.normalize(st);copy.offers[d].selected=box.checked?[...selected,id]:selected.filter(v=>v!==id);set(copy);render();host.querySelector('input[aria-label="'+c.name+'"]')?.focus();};
  }
  const rw=node('div',undefined,sec,'conquest-rewards');rw.setAttribute('aria-live','polite');node('b','Intensidade '+r.score+' · Patamar '+r.tier,rw);
  node('p','Expedição: +'+r.influence+'% influência · '+r.gold+' ouro · '+r.xp+' XP.',rw);node('p','Todos os equipamentos: nível '+r.itemLevel+'. Chefe garante raro ou épico ('+Math.round(r.epicChance*100)+'% épico).',rw);
  node('p',r.specialChance?'Chefe: '+Math.round(r.specialChance*100)+'% de chance do cajado Osso Carcomido.':'Intensidade 4: libera 12% de chance de Osso Carcomido; intensidade 6: aumenta para 25%.',rw);node('small','Osso Carcomido: Tiro de Osso aplica Podridão por 5 s, até 5 cargas.',rw);
  node('h3','Avanço no território',sec);const list=node('div',undefined,sec,'conquest-encounters');
  for(const [kind,e] of Object.entries(Endgame.encounters)){
   const ok=Endgame.available(st,kind,d),reward=Endgame.rewards(st,kind,d,selected),done=kind==='fortress'?st.conquered:st.lieutenants[kind],reason=Endgame.blockedReason(st,kind,d),card=node('article',undefined,list,'conquest-encounter');card.dataset.conquestKind=kind;
   node('h4',e.name,card);node('p',ok?(done?(kind==='fortress'?'Território conquistado · fortaleza disponível para revisitar.':'Derrotado · disponível para repetir.'):'Disponível para enfrentar.'):reason,card);node('small','+'+reward.influence+'% influência · '+reward.gold+' ouro · '+reward.xp+' XP',card);
   const b=node('button',(done?'Revisitar · ':'Entrar · ')+e.name,card,'btn');b.type='button';b.disabled=!ok;if(!ok)b.title=reason;b.onclick=()=>start(kind);
  }
  const frag=node('div',undefined,sec,'conquest-fragment');
  if(st.fragment){node('b','Fragmento da Pestilência obtido',frag);node('p','Conquista permanente. Maior dificuldade vencida na fortaleza: '+st.highest+'. Todas as dificuldades podem ser escolhidas livremente.',frag);node('p','Os outros territórios e o chefe dos fragmentos serão adicionados em uma próxima etapa.',frag);}
  else node('p','Conquiste a fortaleza em qualquer dificuldade para obter o Fragmento da Pestilência.',frag);
 }
 function mountAtlas(root,st,d){
  const nodes=Endgame.routeGraph(st.seed).map(n=>{const [x,y]=MAP.positions[n.depth][n.depth===0||n.depth===6?0:n.lane];return {...n,x,y};});
  const done=id=>st.routes.completed.includes(id),opened=n=>Endgame.routeAvailable(st,n)&&Endgame.available(st,n.kind,d);
  let selected=nodes.find(n=>n.id===routeSelected)||nodes.find(n=>n.id===Endgame.nextRoute(st)?.id)||nodes[0];
  const atlas=node('section',undefined,root,'conquest-atlas');atlas.setAttribute('aria-label','Mapa de Valdoria');
  const title=node('div',undefined,atlas,'atlas-title');node('span','CAMINHOS DE VALDORIA',title);node('small','Conclua uma área · escolha entre três rotas · alcance a torre',title);
  const scroll=node('div',undefined,atlas,'atlas-scroll'),canvas=node('canvas',undefined,scroll);canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Mapa com entrada, cinco etapas de três rotas com biomas diferentes e uma torre final');
  const buttons=node('div',undefined,atlas,'atlas-nodes'),detail=node('div',undefined,atlas,'atlas-detail');
  const choose=n=>{
   selected=n;routeSelected=n.id;drawAtlas(canvas,st,nodes,selected,opened);for(const b of buttons.children)b.setAttribute('aria-pressed',String(b.dataset.mapRoute===n.id));
   const reason=!Endgame.routeAvailable(st,n)?'Conclua uma área ligada à etapa anterior para abrir esta rota.':Endgame.blockedReason(st,n.kind,d),reward=Endgame.rewards(st,n.kind,d,st.offers[d].selected);
   detail.replaceChildren();node('strong',n.label+' · '+Endgame.encounters[n.kind].name,detail);node('p',reason||(done(n.id)?'Área concluída · pode ser revisitada.':'Rota disponível. Vencer abre três caminhos na próxima etapa.'),detail);
   node('small',Endgame.routeBiomes[n.biome].name+' · Dificuldade '+d+' · Intensidade '+reward.score+' · Loot nível '+reward.itemLevel,detail);
   const b=node('button','Entrar na rota · '+n.label,detail,'btn');b.type='button';b.disabled=!opened(n);b.onclick=()=>start(n.kind,n.id);
  };
  for(const n of nodes){const b=node('button',(n.depth===0?'Entrada':n.id==='tower'?'Torre':n.depth+'.'+(n.lane+1)+' '+Endgame.routeBiomes[n.biome].name)+(done(n.id)?' ✓':opened(n)?' ◇':' ×'),buttons,'btn atlas-node');b.type='button';b.dataset.mapRoute=n.id;b.setAttribute('aria-label','Rota '+n.id+' · '+n.label);b.onclick=()=>choose(n);}
  const hit=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*MAP.width/r.width,y=(e.clientY-r.top)*MAP.height/r.height;return nodes.find(n=>Math.hypot(n.x-x,n.y-y)<20||Math.abs(n.x-x)<32&&y>n.y+18&&y<n.y+33);};
  canvas.addEventListener('click',e=>{const n=hit(e);if(n)choose(n);});canvas.addEventListener('pointermove',e=>{canvas.style.cursor=hit(e)?'pointer':'default';});
  choose(selected);
 }
 return {render:open};
}
