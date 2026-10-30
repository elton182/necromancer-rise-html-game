// Editor de mapas: caixa de diálogo em tela cheia com uma vista de cima em canvas 2D.
// Edita o documento de map-model.mjs; salvar grava na biblioteca e "Testar" salva e entra no mapa.
// Mapa base: os objetos herdados aparecem esmaecidos; clique neles para ocultar ou copiar para editar.
import {BIOMES,PROPS,PROP_TYPES,LIMITS,BUILTIN_BASES,mapRef,normalizeMap,normalizeObject,normalizeSpawn,resolveMap,toArena,analyze,detach,dependents,centered} from './map-model.mjs';
import {createMapPreview} from './map-preview.mjs';
import {PALETTES} from './expedition-map.mjs';

const SNAP=.5,MIN_SCALE=4,MAX_SCALE=70,HISTORY=100,PICK_MIN=.35;
const hex=n=>'#'+n.toString(16).padStart(6,'0');
const snap=(v,on)=>on?Math.round(v/SNAP)*SNAP:Math.round(v*20)/20;
const clone=v=>JSON.parse(JSON.stringify(v));

// Último modo de visualização escolhido, lembrado enquanto a página estiver aberta.
let lastMode=null;
// `game`: renderizador do jogo, só para reaproveitar o modelo do personagem na pré-visualização 3D.
export function createMapEditor({library,enemyTypes,play,closed,game}){
 const el=(tag,cls,text,parent)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;parent?.append(e);return e;};
 const button=(text,fn,parent,cls='')=>{const b=el('button',cls,text,parent);b.type='button';b.onclick=fn;return b;};
 const label=(text,control,parent)=>{const l=el('label','me-row',undefined,parent);el('span',null,text,l);l.append(control);return l;};
 const input=(type,attrs={})=>{const i=el('input');i.type=type;Object.assign(i,attrs);return i;};

 // --- Estrutura ---
 const dlg=el('dialog','me',undefined,document.body);dlg.id='map-editor';dlg.setAttribute('aria-label','Editor de mapas');
 const bar=el('header','me-bar',undefined,dlg),body=el('div','me-body',undefined,dlg);
 const nameInput=input('text',{maxLength:LIMITS.maxName,placeholder:'Nome do mapa'});nameInput.className='me-name';nameInput.setAttribute('aria-label','Nome do mapa');bar.append(nameInput);
 const undoBtn=button('↶ Desfazer',()=>history(-1),bar),redoBtn=button('↷ Refazer',()=>history(1),bar);
 const snapChk=input('checkbox',{checked:true});label('Grade',snapChk,bar).className='me-check';
 const modes=el('div','me-modes',undefined,bar),modeButtons=new Map();
 for(const [id,text,title] of [['2d','2D','Só a vista de cima'],['split','2D + 3D','Vista de cima e pré-visualização 3D lado a lado'],['3d','3D','Só a pré-visualização 3D']]){const b=button(text,()=>setViewMode(id),modes);b.title=title;b.dataset.mode=id;modeButtons.set(id,b);}
 const status=el('span','me-status',undefined,bar);
 const saveBtn=button('Salvar',()=>save(),bar,'pri'),testBtn=button('Testar ▶',()=>test(),bar,'pri'),closeBtn=button('Fechar',()=>requestClose(),bar);
 // `div`, não `aside`: a v2 posiciona qualquer `aside` como painel fixo.
 const tools=el('div','me-tools',undefined,body),stage=el('div','me-stage',undefined,body),side=el('div','me-side',undefined,body);
 const pane2d=el('div','me-pane',undefined,stage),pane3d=el('div','me-pane me-pane3d',undefined,stage);
 const canvas=el('canvas',null,undefined,pane2d);canvas.setAttribute('aria-label','Vista de cima do mapa');
 const help=el('p','me-help','Esquerdo: usar a ferramenta · Direito/meio ou Espaço+arrastar: mover a vista · Roda: zoom · Del: apagar · Ctrl+Z/Y · Ctrl+D: duplicar · Setas: ajustar',pane2d);
 const banner=el('div','me-banner',undefined,stage);banner.hidden=true;
 const ctx=canvas.getContext('2d');

 // Ferramentas
 const toolButtons=new Map();
 function addTool(id,text,color,parent,key){const b=button('',()=>setTool(id),parent,'me-tool');if(color)el('i',null,undefined,b).style.background=color;el('span',null,text,b);if(key)el('kbd',null,key,b);b.dataset.tool=id;toolButtons.set(id,b);}
 const toolGroup=title=>{el('h3',null,title,tools);return el('div','me-group',undefined,tools);};
 let g=toolGroup('Ferramentas');addTool('select','Selecionar',null,g,'V');addTool('erase','Apagar',null,g,'E');
 // Pincel: vale para qualquer peça redonda (colisores, enfeites e chão); muros e troncos são desenhados como retângulo.
 g=toolGroup('Ao arrastar');
 const brushMode=el('select');for(const [value,text] of [['row','Fileira ao longo do traço'],['scatter','Espalhar com pincel'],['single','Um por clique']])el('option',null,text,brushMode).value=value;
 brushMode.setAttribute('aria-label','O que fazer ao arrastar com uma peça');g.append(brushMode);
 const spacingIn=input('number',{min:0,max:20,step:.1,value:0,title:'Distância entre peças. 0 = automática, pelo tamanho da peça.'}),radiusIn=input('number',{min:.5,max:30,step:.5,value:3,title:'Raio do pincel ao espalhar.'});
 label('Espaço',spacingIn,g);label('Raio',radiusIn,g);
 el('p','me-note','Segure e arraste para criar várias peças de uma vez. Ctrl+Z desfaz o traço inteiro.',g);
 g=toolGroup('Marcadores');addTool('start','Início do jogador','#6fb7ff',g);addTool('spawn','Inimigos','#e0605a',g);
 for(const group of ['Colisores','Enfeites','Chão']){g=toolGroup(group);for(const type of PROP_TYPES)if(PROPS[type].group===group)addTool(type,PROPS[type].label,PROPS[type].color,g);}

 // --- Estado ---
 let doc=null,resolved=null,tool='select',selection=null,dirty=false,undo=[],redo=[],view={cx:0,cy:0,scale:12},hover=null,drag=null,spaceDown=false,lastEnemyType=0,analysisTimer=0,problems=[];
 const lookup=id=>doc&&id===doc.id?null:library.get(id);
 const flat=()=>resolved.map;
 const isOpen=()=>dlg.open;

 function open(target){
  const source=typeof target==='string'?library.get(target):target;if(!source)return false;
  doc=clone(source);undo=[];redo=[];dirty=!library.get(doc.id);selection=null;tool='select';banner.hidden=true;
  if(!dlg.open)dlg.showModal();
  syncResolved();nameInput.value=doc.name;fit();inspectorKey=null;setTool('select');syncHeader();say(dirty?'Novo mapa (ainda não salvo)':'Salvo');runAnalysis();setViewMode(lastMode||(innerWidth>=1100?'split':'2d'),true);draw();
  return true;
 }
 function close(){clearTimeout(analysisTimer);preview?.stop();if(dlg.open)dlg.close();doc=null;resolved=null;}
 const say=(text,kind='')=>{status.textContent=text;status.dataset.kind=kind;};
 function syncResolved(){resolved=resolveMap(doc,lookup);}

 // --- Pré-visualização 3D ---
 const preview=game?createMapPreview({models:game.models,assets:game.assets}):null;if(preview)pane3d.append(preview.root);
 let previewQueued=0,mode='2d';
 // O mapa resolvido vira arena e vai para a cena 3D no próximo quadro; vários eventos seguidos (arrastar) viram uma só atualização.
 function syncPreview(){if(!preview?.running()||!doc)return;const f=resolveMap(doc,lookup).map;preview.setScene({arena:toArena(f),start:f.start,spawns:f.spawns});}
 function queuePreview(){if(previewQueued||!preview?.running())return;previewQueued=requestAnimationFrame(()=>{previewQueued=0;syncPreview();});}
 function setViewMode(next,force=false){
  if(!preview&&next!=='2d')next='2d';
  const was2d=mode!=='3d';if(next===mode&&!force)return;mode=next;lastMode=next;stage.dataset.view=next;
  for(const [id,b] of modeButtons)b.classList.toggle('on',id===next);
  if(next==='2d')preview?.stop();else if(preview?.start())syncPreview();
  // Depois do novo layout: reajusta a vista 2D (se estava oculta) e o tamanho da cena 3D.
  requestAnimationFrame(()=>{if(!doc)return;if(!was2d&&next!=='3d')fit();draw();preview?.resize();});
 }

 // --- Alterações com histórico ---
 const json=()=>JSON.stringify(doc);
 function commit(before){if(before===json())return false;undo.push(before);if(undo.length>HISTORY)undo.shift();redo=[];dirty=true;changed();return true;}
 function mutate(fn){const before=json();fn(doc);return commit(before);}
 function history(direction){
  const from=direction<0?undo:redo,to=direction<0?redo:undo;if(!from.length)return;
  to.push(json());doc=JSON.parse(from.pop());dirty=true;
  if(selection&&!exists(selection))selection=null;changed();
 }
 function changed(){if(status.dataset.kind==='error'||status.dataset.kind==='warn')status.dataset.kind='';syncResolved();syncHeader();syncSide();syncSelectionFields();scheduleAnalysis();draw();queuePreview();}

 // --- Dados do documento ---
 const ownObject=id=>doc.objects.find(o=>o.id===id);
 const baseObject=id=>flat().baseObjects.find(o=>o.id===id);
 const exists=sel=>sel.kind==='object'?!!ownObject(sel.id):sel.kind==='base'?!!baseObject(sel.id):sel.kind==='spawn'?flat().spawns.some(s=>s.id===sel.id):true;
 // Campos herdados (null) viram próprios no primeiro uso.
 function adopt(field){
  if(doc[field]==null)doc[field]=clone(flat()[field]);
 }
 const spawnsList=()=>doc.spawns??flat().spawns;
 function addObject(type,x,y,extra={}){
  if(doc.objects.length>=LIMITS.maxObjects){say('Limite de '+LIMITS.maxObjects+' objetos.','warn');return null;}
  const taken=new Set([...doc.objects.map(o=>o.id),...flat().baseObjects.map(o=>o.id)]),o=normalizeObject({type,x,y,...extra},taken);
  doc.objects.push(o);return o;
 }
 function addSpawn(x,y){
  adopt('spawns');if(doc.spawns.length>=LIMITS.maxSpawns){say('Limite de '+LIMITS.maxSpawns+' pontos de inimigos.','warn');return null;}
  const s=normalizeSpawn({x,y,count:4,type:lastEnemyType},new Set(doc.spawns.map(v=>v.id)));doc.spawns.push(s);return s;
 }
 function removeSelection(){
  if(!selection)return;
  mutate(d=>{
   if(selection.kind==='object')d.objects=d.objects.filter(o=>o.id!==selection.id);
   else if(selection.kind==='spawn'){adopt('spawns');d.spawns=d.spawns.filter(s=>s.id!==selection.id);}
   else if(selection.kind==='base'&&!d.hidden.includes(selection.id))d.hidden.push(selection.id);
  });
  selection=selection.kind==='base'?selection:null;syncSide();syncSelectionFields();draw();
 }
 function duplicateSelection(){
  if(!selection||selection.kind==='start')return;
  mutate(d=>{
   if(selection.kind==='spawn'){adopt('spawns');const s=d.spawns.find(v=>v.id===selection.id);if(!s)return;const c=addSpawn(s.x+1,s.y+1);if(c){Object.assign(c,{count:s.count,type:s.type});selection={kind:'spawn',id:c.id};}return;}
   const src=selection.kind==='base'?baseObject(selection.id):ownObject(selection.id);if(!src)return;
   const {id,inherited,...rest}=src,c=addObject(src.type,src.x+1,src.y+1,rest);if(c)selection={kind:'object',id:c.id};
  });
 }
 function nudge(dx,dy){
  if(!selection||selection.kind==='base')return;
  mutate(d=>{
   if(selection.kind==='start'){adopt('start');d.start.x+=dx;d.start.y+=dy;}
   else if(selection.kind==='spawn'){adopt('spawns');const s=d.spawns.find(v=>v.id===selection.id);if(s){s.x+=dx;s.y+=dy;}}
   else{const o=d.objects.find(v=>v.id===selection.id);if(o){o.x+=dx;o.y+=dy;}}
  });
 }

 // --- Vista ---
 const size=()=>({w:canvas.clientWidth,h:canvas.clientHeight});
 const toWorld=(px,py)=>{const s=size();return {x:(px-s.w/2)/view.scale+view.cx,y:(py-s.h/2)/view.scale+view.cy};};
 function fit(){const s=size(),m=flat().size;view={cx:0,cy:0,scale:Math.max(MIN_SCALE,Math.min(MAX_SCALE,Math.min((s.w-40)/m.w,(s.h-40)/m.h)))};}
 function resize(){
  const dpr=Math.min(2,window.devicePixelRatio||1),w=canvas.clientWidth,h=canvas.clientHeight;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  return dpr;
 }
 new ResizeObserver(()=>{if(doc){draw();}}).observe(pane2d);

 // --- Desenho ---
 function drawObject(o,{alpha=1,dash=false,outline=null,min=3}={}){
  const def=PROPS[o.type];if(!def)return;const S=view.scale,s=size();
  const px=(o.x-view.cx)*S+s.w/2,py=(o.y-view.cy)*S+s.h/2;
  ctx.globalAlpha=alpha;ctx.fillStyle=def.color;ctx.strokeStyle=outline||'#0006';ctx.lineWidth=outline?2:1;ctx.setLineDash(dash?[4,3]:[]);
  if(def.shape==='box'){const w=Math.max(o.w*S,min),h=Math.max(o.d*S,min);ctx.fillRect(px-w/2,py-h/2,w,h);ctx.strokeRect(px-w/2,py-h/2,w,h);}
  else{ctx.beginPath();ctx.arc(px,py,Math.max(o.r*S,min),0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.globalAlpha=1;ctx.setLineDash([]);
 }
 function draw(){
  if(!doc||!dlg.open)return;const dpr=resize(),s=size(),S=view.scale,f=flat(),b=centered(f.size);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#070b08';ctx.fillRect(0,0,s.w,s.h);
  const X=x=>(x-view.cx)*S+s.w/2,Y=y=>(y-view.cy)*S+s.h/2;
  ctx.fillStyle=hex((PALETTES[f.biome]||PALETTES.forest).dark.ground);ctx.fillRect(X(b.minX),Y(b.minY),f.size.w*S,f.size.h*S);
  // Grade: linhas a cada 1 u (se couber) e destaque a cada 5 u.
  ctx.lineWidth=1;
  for(let x=Math.ceil(b.minX);x<=b.maxX;x++){const major=x%5===0;if(!major&&S<10)continue;ctx.strokeStyle=major?'#ffffff26':'#ffffff0f';ctx.beginPath();ctx.moveTo(X(x),Y(b.minY));ctx.lineTo(X(x),Y(b.maxY));ctx.stroke();}
  for(let y=Math.ceil(b.minY);y<=b.maxY;y++){const major=y%5===0;if(!major&&S<10)continue;ctx.strokeStyle=major?'#ffffff26':'#ffffff0f';ctx.beginPath();ctx.moveTo(X(b.minX),Y(y));ctx.lineTo(X(b.maxX),Y(y));ctx.stroke();}
  ctx.strokeStyle='#d4af37';ctx.lineWidth=2;ctx.strokeRect(X(b.minX),Y(b.minY),f.size.w*S,f.size.h*S);
  // Camadas: chão, enfeites, colisores. Herdados esmaecidos; ocultos tracejados em vermelho.
  const layer=o=>PROPS[o.type]?.group==='Chão'?0:PROPS[o.type]?.group==='Enfeites'?1:2,hidden=new Set(doc.hidden);
  const selId=selection&&(selection.kind==='object'||selection.kind==='base')?selection.id:null;
  for(const level of [0,1,2]){
   for(const o of f.baseObjects)if(layer(o)===level){const h=hidden.has(o.id);drawObject(o,{alpha:h?.18:.42,dash:true,outline:o.id===selId?'#ffe27a':h?'#e0605a':'#ffffff55'});}
   for(const o of doc.objects)if(layer(o)===level)drawObject(o,{outline:o.id===selId?'#ffe27a':null});
  }
  // Marcadores
  const sp=f.spawns;
  for(const sv of sp){
   const x=X(sv.x),y=Y(sv.y),on=selection?.kind==='spawn'&&selection.id===sv.id,spread=(.55*Math.sqrt(sv.count)+.4)*S;
   ctx.strokeStyle=on?'#ffe27a':'#e0605a';ctx.lineWidth=on?2:1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(x,y,Math.max(spread,10),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
   ctx.fillStyle=doc.spawns?'#e0605a':'#e0605a88';ctx.beginPath();ctx.arc(x,y,Math.max(.6*S,9),0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#fff';ctx.font='bold 11px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(sv.count),x,y);
  }
  const st=f.start,sx=X(st.x),sy=Y(st.y),onStart=selection?.kind==='start';
  ctx.fillStyle=doc.start?'#6fb7ff':'#6fb7ff88';ctx.strokeStyle=onStart?'#ffe27a':'#fff';ctx.lineWidth=onStart?3:1.5;ctx.beginPath();ctx.arc(sx,sy,Math.max(.45*S,8),0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#06223a';ctx.font='bold 11px Georgia,serif';ctx.fillText('J',sx,sy);
  // Pré-visualização da ferramenta
  if(drag?.mode==='rect'){
   const r=drag.rect(),def=PROPS[tool];ctx.globalAlpha=.55;ctx.fillStyle=def.color;ctx.fillRect(X(r.x-r.w/2),Y(r.y-r.d/2),r.w*S,r.d*S);ctx.globalAlpha=1;
  }else if(hover&&PROPS[tool]){
   const def=PROPS[tool];drawObject({type:tool,x:hover.x,y:hover.y,r:def.r,w:def.w,d:def.d},{alpha:.5,outline:'#ffffffaa'});
   if(def.shape!=='box'&&brushMode.value==='scatter'){ctx.strokeStyle='#ffffff88';ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(X(hover.x),Y(hover.y),brushRadius()*S,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  }
  else if(hover&&(tool==='start'||tool==='spawn')){ctx.globalAlpha=.55;ctx.fillStyle=tool==='start'?'#6fb7ff':'#e0605a';ctx.beginPath();ctx.arc(X(hover.x),Y(hover.y),Math.max(.5*S,8),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  // Coordenadas sob o cursor
  if(hover){ctx.fillStyle='#e8e5c5cc';ctx.font='11px Georgia,serif';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillText(hover.x.toFixed(1)+' , '+hover.y.toFixed(1)+'  ·  zoom '+Math.round(S*10)/10,8,s.h-8);}
 }

 // --- Seleção por clique ---
 function pick(p){
  const f=flat(),near=(o,r)=>Math.hypot(p.x-o.x,p.y-o.y)<=Math.max(r,PICK_MIN);
  for(const s of [...f.spawns].reverse())if(near(s,.6))return {kind:'spawn',id:s.id};
  if(near(f.start,.5))return {kind:'start'};
  const hit=o=>{const d=PROPS[o.type];return d.shape==='box'?Math.abs(p.x-o.x)<=o.w/2+.15&&Math.abs(p.y-o.y)<=o.d/2+.15:near(o,o.r);};
  // Sólidos antes de enfeites e chão; dentro de cada camada, o mais recente primeiro.
  const order=[2,1,0],layer=o=>PROPS[o.type].group==='Chão'?0:PROPS[o.type].group==='Enfeites'?1:2;
  for(const lv of order){
   for(const o of [...doc.objects].reverse())if(layer(o)===lv&&hit(o))return {kind:'object',id:o.id};
   for(const o of [...f.baseObjects].reverse())if(layer(o)===lv&&hit(o))return {kind:'base',id:o.id};
  }
  return null;
 }

 // --- Pincel: criar vários elementos arrastando ---
 // Colisores ocupam o diâmetro inteiro; enfeites e chão se sobrepõem um pouco, como antes.
 const brushSpacing=def=>{const v=Number(spacingIn.value);return v>0?Math.max(.3,v):Math.max(.6,(def.r||1)*(def.solid?2.2:1.1));};
 const brushRadius=()=>Math.max(.5,Math.min(30,Number(radiusIn.value)||3));
 function paintAt(p){
  const d=drag;if(!d)return null;
  if(doc.objects.length>=LIMITS.maxObjects){if(!d.limitSaid){say('Limite de '+LIMITS.maxObjects+' objetos.','warn');d.limitSaid=true;}return null;}
  if(d.placed.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<.05))return null;
  const o=addObject(tool,p.x,p.y);if(o){d.placed.push({x:p.x,y:p.y});selection={kind:'object',id:o.id};}
  return o;
 }
 // Espalha peças em um círculo de raio R ao redor do ponto, sem encostar nas que já foram pintadas neste traço.
 function scatter(center){
  const d=drag,def=PROPS[tool],R=brushRadius(),gap=Math.max(d.spacing,(def.r||.5)*2),count=Math.max(1,Math.round(R*R/(gap*gap)*.5));
  for(let k=0;k<count;k++)for(let attempt=0;attempt<10;attempt++){
   const a=Math.random()*Math.PI*2,m=R*Math.sqrt(Math.random()),on=snapChk.checked,p={x:snap(center.x+Math.cos(a)*m,on),y:snap(center.y+Math.sin(a)*m,on)};
   if(d.placed.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<gap))continue;
   paintAt(p);break;
  }
  d.last=center;
 }
 function paintTo(to){
  const d=drag;if(d.kind==='single')return;
  const before=d.placed.length;
  if(d.kind==='scatter'){
   // Um jato a cada meio raio de caminho, inclusive entre dois eventos distantes do ponteiro.
   const step=Math.max(.5,brushRadius()*.5);let dx=to.x-d.last.x,dy=to.y-d.last.y,dist=Math.hypot(dx,dy);
   while(dist>=step&&doc.objects.length<LIMITS.maxObjects){scatter({x:d.last.x+dx/dist*step,y:d.last.y+dy/dist*step});dx=to.x-d.last.x;dy=to.y-d.last.y;dist=Math.hypot(dx,dy);}
  }
  else{
   // Fileira: uma peça a cada `spacing` ao longo do caminho, mesmo que o ponteiro ande depressa.
   let dx=to.x-d.last.x,dy=to.y-d.last.y,dist=Math.hypot(dx,dy);
   while(dist>=d.spacing&&doc.objects.length<LIMITS.maxObjects){
    const t=d.spacing/dist,on=snapChk.checked,p={x:snap(d.last.x+dx*t,on),y:snap(d.last.y+dy*t,on)};
    d.last={x:d.last.x+dx*t,y:d.last.y+dy*t};paintAt(p);dx=to.x-d.last.x;dy=to.y-d.last.y;dist=Math.hypot(dx,dy);
   }
   if(doc.objects.length>=LIMITS.maxObjects)paintAt(to);
  }
  if(d.placed.length!==before){syncResolved();queuePreview();}
 }

 // --- Entrada do ponteiro ---
 const pointer=e=>{const r=canvas.getBoundingClientRect();return {px:e.clientX-r.left,py:e.clientY-r.top};};
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('wheel',e=>{
  e.preventDefault();const {px,py}=pointer(e),before=toWorld(px,py);
  view.scale=Math.max(MIN_SCALE,Math.min(MAX_SCALE,view.scale*Math.exp(-e.deltaY*.0015)));
  const after=toWorld(px,py);view.cx+=before.x-after.x;view.cy+=before.y-after.y;draw();
 },{passive:false});
 canvas.addEventListener('pointerdown',e=>{
  if(!doc)return;try{canvas.setPointerCapture(e.pointerId);}catch{}canvas.focus({preventScroll:true});
  const {px,py}=pointer(e),w=toWorld(px,py),on=snapChk.checked;
  if(e.button===1||e.button===2||spaceDown){drag={mode:'pan',px,py,cx:view.cx,cy:view.cy};return;}
  if(e.button!==0)return;
  const point={x:snap(w.x,on),y:snap(w.y,on)},before=json();
  if(tool==='select'){
   const hit=pick(w);selection=hit;
   if(hit&&(hit.kind==='object'||hit.kind==='spawn'||hit.kind==='start')){
    if(hit.kind==='spawn')adopt('spawns');if(hit.kind==='start')adopt('start');
    const target=hit.kind==='object'?ownObject(hit.id):hit.kind==='spawn'?doc.spawns.find(s=>s.id===hit.id):doc.start;
    drag={mode:'move',before,target,dx:target.x-w.x,dy:target.y-w.y};
   }
   syncSide();syncSelectionFields();draw();return;
  }
  if(tool==='erase'){
   const hit=pick(w);if(hit&&hit.kind!=='start'){selection=hit;removeSelection();selection=null;syncSelectionFields();draw();}return;
  }
  if(tool==='start'){mutate(d=>{d.start={x:point.x,y:point.y};});selection={kind:'start'};syncSelectionFields();return;}
  if(tool==='spawn'){let s;mutate(()=>{s=addSpawn(point.x,point.y);});if(s){selection={kind:'spawn',id:s.id};syncSelectionFields();}return;}
  const def=PROPS[tool];
  if(def?.shape==='box'){drag={mode:'rect',before,from:point,to:point,rect(){const x0=Math.min(this.from.x,this.to.x),x1=Math.max(this.from.x,this.to.x),y0=Math.min(this.from.y,this.to.y),y1=Math.max(this.from.y,this.to.y);return {x:(x0+x1)/2,y:(y0+y1)/2,w:x1-x0,d:y1-y0};}};return;}
  if(def){
   // Qualquer peça redonda pode ser pintada arrastando (fileira ao longo do traço ou espalhada pelo pincel).
   const kind=brushMode.value;
   drag={mode:'paint',before,kind,last:point,placed:[],spacing:brushSpacing(def),limitSaid:false};
   if(kind==='scatter')scatter(point);else paintAt(point);
   if(drag.placed.length)changed();
  }
 });
 canvas.addEventListener('pointermove',e=>{
  if(!doc)return;const {px,py}=pointer(e),w=toWorld(px,py),on=snapChk.checked;hover={x:snap(w.x,on),y:snap(w.y,on)};
  if(drag?.mode==='pan'){view.cx=drag.cx-(px-drag.px)/view.scale;view.cy=drag.cy-(py-drag.py)/view.scale;}
  else if(drag?.mode==='move'){drag.target.x=snap(w.x+drag.dx,on);drag.target.y=snap(w.y+drag.dy,on);drag.moved=true;syncSelectionFields();queuePreview();}
  else if(drag?.mode==='rect')drag.to=hover;
  else if(drag?.mode==='paint')paintTo(hover);
  draw();
 });
 canvas.addEventListener('pointerleave',()=>{hover=null;draw();});
 const endDrag=e=>{
  if(!drag)return;const d=drag;drag=null;try{canvas.releasePointerCapture(e.pointerId);}catch{}
  if(d.mode==='rect'){
   const r=d.rect(),tiny=r.w<.4&&r.d<.4;
   mutate(()=>{if(doc.objects.length<LIMITS.maxObjects){const o=addObject(tool,r.x,r.y,tiny?{}:{w:Math.max(r.w,.5),d:Math.max(r.d,.5)});if(o)selection={kind:'object',id:o.id};}});
  }else if(d.before!==undefined)commit(d.before);
  syncSide();syncSelectionFields();draw();
 };
 canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);

 // --- Teclado ---
 const typing=e=>/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)&&e.target.type!=='checkbox';
 dlg.addEventListener('keydown',e=>{
  if(e.code==='Space'&&(e.target===canvas||e.target===dlg)){spaceDown=true;e.preventDefault();return;}
  const key=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
  if(mod&&key==='z'){e.preventDefault();history(e.shiftKey?1:-1);return;}
  if(mod&&key==='y'){e.preventDefault();history(1);return;}
  if(mod&&key==='s'){e.preventDefault();save();return;}
  if(typing(e))return;
  if(mod&&key==='d'){e.preventDefault();duplicateSelection();return;}
  if(key==='delete'||key==='backspace'){e.preventDefault();removeSelection();return;}
  if(key==='v')setTool('select');else if(key==='e')setTool('erase');
  const step=e.shiftKey?2:SNAP,arrows={arrowleft:[-step,0],arrowright:[step,0],arrowup:[0,-step],arrowdown:[0,step]};
  if(arrows[key]&&selection){e.preventDefault();nudge(...arrows[key]);}
 });
 dlg.addEventListener('keyup',e=>{if(e.code==='Space')spaceDown=false;});
 dlg.addEventListener('cancel',e=>{e.preventDefault();if(tool!=='select'||selection){setTool('select');selection=null;syncSide();syncSelectionFields();draw();}else requestClose();});

 function setTool(id){
  tool=id;for(const [key,b] of toolButtons)b.classList.toggle('on',key===id);
  canvas.style.cursor=id==='select'?'default':id==='erase'?'not-allowed':'crosshair';
  if(id!=='select'&&selection?.kind==='base')selection=null;
  syncSide();syncSelectionFields();draw();
 }

 // --- Barra, lateral e inspetor ---
 const baseSelect=el('select');
 const sideBase=el('section','me-sec',undefined,side),sideSel=el('section','me-sec',undefined,side),sideMap=el('section','me-sec',undefined,side),sideProblems=el('section','me-sec',undefined,side);
 function syncHeader(){
  if(document.activeElement!==nameInput)nameInput.value=doc.name;
  undoBtn.disabled=!undo.length;redoBtn.disabled=!redo.length;
  if(!status.dataset.kind||status.dataset.kind==='dirty')say(dirty?'● alterações não salvas':'Salvo',dirty?'dirty':'');
 }
 nameInput.onchange=()=>mutate(d=>{d.name=normalizeMap({...d,name:nameInput.value}).map.name;});

 function field(parent,text,value,{min,max,step=.05,onChange,disabled=false}){
  const i=input('number',{value:+(+value).toFixed(2),step,disabled});if(min!==undefined)i.min=min;if(max!==undefined)i.max=max;
  i.onchange=()=>{const v=Number(i.value);if(Number.isFinite(v))onChange(v);else i.value=value;};label(text,i,parent);return i;
 }
 let selectionFields=null,inspectorKey=null;
 // O inspetor só é recriado quando muda o que ele mostra: seleção, estado de oculto ou, sem seleção, a ferramenta.
 const inspectorKeyNow=()=>selection?selection.kind+':'+(selection.id||'')+':'+doc.hidden.includes(selection.id):'none:'+tool;
 // Atualiza só os valores dos campos do inspetor durante um arraste, sem recriar os controles.
 function syncSelectionFields(){
  if(inspectorKeyNow()!==inspectorKey)return buildInspector();
  const t=selectionTarget();if(!t||!selectionFields)return;
  for(const [k,i] of Object.entries(selectionFields))if(document.activeElement!==i&&t[k]!==undefined)i.value=+(+t[k]).toFixed(2);
 }
 function selectionTarget(){
  if(!selection)return null;
  if(selection.kind==='object')return ownObject(selection.id);
  if(selection.kind==='spawn')return spawnsList().find(s=>s.id===selection.id);
  if(selection.kind==='start')return flat().start;
  return null;
 }
 function buildInspector(){
  inspectorKey=inspectorKeyNow();
  sideSel.replaceChildren();selectionFields=null;fillInspector();
  if(selection&&(selection.kind==='object'||selection.kind==='spawn')){button('Duplicar',duplicateSelection,sideSel);button('Excluir',removeSelection,sideSel,'danger');}
 }
 function fillInspector(){
  el('h3',null,'Seleção',sideSel);
  if(!selection){
   el('p','me-note',tool==='select'?'Clique em um objeto para editar, arraste para mover. Escolha uma peça na paleta à esquerda para posicioná-la; colisores de caixa (muro, tronco) são desenhados arrastando.':'Ferramenta ativa: '+(PROPS[tool]?.label||toolButtons.get(tool)?.textContent||tool)+'. Esc volta para Selecionar.',sideSel);
   return;
  }
  if(selection.kind==='base'){
   const o=baseObject(selection.id);if(!o){selection=null;return fillInspector();}
   const hidden=doc.hidden.includes(o.id);
   el('p','me-note',(PROPS[o.type]?.label||o.type)+' herdado da base em '+o.x.toFixed(1)+' , '+o.y.toFixed(1)+(hidden?' (oculto neste mapa).':'.'),sideSel);
   button(hidden?'Restaurar da base':'Ocultar neste mapa',()=>{mutate(d=>{d.hidden=hidden?d.hidden.filter(v=>v!==o.id):[...d.hidden,o.id];});},sideSel);
   if(!hidden)button('Copiar para editar',()=>{mutate(d=>{if(!d.hidden.includes(o.id))d.hidden.push(o.id);const {id,inherited,...rest}=o,c=addObject(o.type,o.x,o.y,rest);if(c)selection={kind:'object',id:c.id};});},sideSel);
   return;
  }
  const t=selectionTarget();if(!t){selection=null;return fillInspector();}
  selectionFields={};
  const apply=(k,v)=>mutate(d=>{
   if(selection.kind==='start'){adopt('start');d.start[k]=Math.round(v*20)/20;return;}
   if(selection.kind==='spawn'){adopt('spawns');const s=d.spawns.find(x=>x.id===selection.id);Object.assign(s,normalizeSpawn({...s,[k]:v},new Set()));return;}
   const i=d.objects.findIndex(x=>x.id===selection.id);d.objects[i]=normalizeObject({...d.objects[i],[k]:v},new Set());
  });
  const add=(k,text,opts={})=>{selectionFields[k]=field(sideSel,text,t[k],{...opts,onChange:v=>apply(k,v)});};
  if(selection.kind==='start'){el('p','me-note','Início do jogador'+(doc.start?'':' (herdado da base; ao mover, passa a ser deste mapa)')+'. Arraste o marcador azul ou digite as coordenadas.',sideSel);add('x','X');add('y','Y');return;}
  if(selection.kind==='spawn'){
   el('p','me-note','Ponto de inimigos. Os inimigos surgem em espiral ao redor dele.',sideSel);
   add('x','X');add('y','Y');add('count','Quantidade',{min:1,max:LIMITS.maxCount,step:1});
   const type=el('select');for(const e of enemyTypes){const o=el('option',null,e.name,type);o.value=e.index;}type.value=t.type;type.onchange=()=>{lastEnemyType=Number(type.value);apply('type',lastEnemyType);};label('Tipo',type,sideSel);return;
  }
  const def=PROPS[t.type];el('p','me-note',def.label+(def.solid?' · colisor':' · só visual'),sideSel);
  add('x','X');add('y','Y');
  if(def.shape==='box'){add('w','Largura',{min:.2,max:60});add('d','Profundidade',{min:.2,max:60});}else if(def.dims.includes('r'))add('r','Raio',{min:.1,max:12});
  if(def.dims.includes('h'))add('h','Altura',{min:.1,max:12});if(def.dims.includes('s'))add('s','Escala',{min:.4,max:3});
 }
 function syncSide(){
  // Mapa base
  sideBase.replaceChildren();el('h3',null,'Mapa base',sideBase);
  const options=[['','Sem base (independente)'],...Object.entries(BUILTIN_BASES).map(([k,v])=>[k,'Jogo · '+v]),...library.list().filter(m=>m.id!==doc.id&&!dependents(doc.id,library.list()).includes(m.id)).map(m=>[mapRef(m.id),m.name])];
  baseSelect.replaceChildren(...options.map(([v,t])=>{const o=el('option',null,t);o.value=v;return o;}));baseSelect.value=doc.base||'';
  if(doc.base&&!options.some(o=>o[0]===doc.base)){const o=el('option',null,'(base indisponível)');o.value=doc.base;baseSelect.append(o);baseSelect.value=doc.base;}
  baseSelect.onchange=()=>{
   if(!baseSelect.value){mutate(d=>{Object.assign(d,detach(d,lookup));});say('Base copiada para o mapa e desvinculada.');return;}
   mutate(d=>{d.base=baseSelect.value;d.hidden=[];});
  };
  sideBase.append(baseSelect);
  el('p','me-note',doc.base?'Objetos esmaecidos vêm da base e mudam junto com ela. Para trocar um deles, clique e use «Ocultar» ou «Copiar para editar».':'Escolha uma base para herdar objetos, bioma, tamanho, início e inimigos; este mapa guarda só as diferenças.',sideBase);
  for(const w of resolved.warnings)el('p','me-note warn',w,sideBase);
  // Configurações do mapa
  sideMap.replaceChildren();el('h3',null,'Mapa',sideMap);
  const inherit=(name,text)=>{if(!doc.base)return;const c=input('checkbox',{checked:doc[name]==null});c.onchange=()=>mutate(d=>{if(c.checked)d[name]=null;else adopt(name);});label('Herdar '+text+' da base',c,sideMap).className='me-check';};
  const biome=el('select');for(const [k,v] of Object.entries(BIOMES)){const o=el('option',null,v,biome);o.value=k;}biome.value=flat().biome;biome.disabled=doc.biome==null&&!!doc.base;
  biome.onchange=()=>mutate(d=>{d.biome=biome.value;});label('Bioma',biome,sideMap);inherit('biome','o bioma');
  const dis=doc.size==null&&!!doc.base,setSize=(k,v)=>mutate(d=>{adopt('size');d.size=normalizeMap({...d,size:{...d.size,[k]:v}}).map.size;});
  field(sideMap,'Largura',flat().size.w,{min:LIMITS.minSize,max:LIMITS.maxSize,step:1,disabled:dis,onChange:v=>setSize('w',v)});
  field(sideMap,'Altura',flat().size.h,{min:LIMITS.minSize,max:LIMITS.maxSize,step:1,disabled:dis,onChange:v=>setSize('h',v)});
  inherit('size','o tamanho');inherit('start','o início');inherit('spawns','os inimigos');
  field(sideMap,'Nível dos inimigos',doc.level,{min:1,max:LIMITS.maxLevel,step:1,onChange:v=>mutate(d=>{d.level=normalizeMap({...d,level:v}).map.level;})});
  el('p','me-note',flat().objects.length+' objeto(s) · '+flat().spawns.reduce((n,s)=>n+s.count,0)+' inimigo(s)',sideMap);
  renderProblems();
 }
 function renderProblems(){
  sideProblems.replaceChildren();el('h3',null,'Verificação',sideProblems);
  if(!problems.length){el('p','me-note','Nenhum problema encontrado.',sideProblems);return;}
  for(const p of problems)el('p','me-note '+p.level,p.text,sideProblems);
 }
 function runAnalysis(){problems=doc?analyze(doc,lookup):[];renderProblems();}
 function scheduleAnalysis(){clearTimeout(analysisTimer);analysisTimer=setTimeout(()=>{if(doc)runAnalysis();},350);}

 // --- Salvar, testar, fechar ---
 function save(){
  if(!doc)return false;const result=library.save(doc);
  if(!result.ok){say(result.message,'error');return false;}
  doc.updated=result.map.updated;dirty=false;say('Salvo','');syncHeader();return true;
 }
 function test(){
  if(!save())return;const id=doc.id;close();play(id);
 }
 function requestClose(){
  if(!dirty){close();return;}
  banner.hidden=false;banner.replaceChildren();el('span',null,'Há alterações não salvas neste mapa.',banner);
  button('Salvar e fechar',()=>{if(save())close();},banner,'pri');button('Descartar',()=>close(),banner,'danger');button('Continuar editando',()=>{banner.hidden=true;},banner);
 }
 dlg.addEventListener('close',()=>{preview?.stop();doc=null;resolved=null;clearTimeout(analysisTimer);closed?.();});

 return {open,close,isOpen,blocksInput:isOpen,get current(){return doc;}};
}
