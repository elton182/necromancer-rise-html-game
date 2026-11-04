// Editor de mapas: caixa de diálogo em tela cheia com uma vista de cima em canvas 2D.
// Edita o documento de map-model.mjs; salvar grava na biblioteca e "Testar" salva e entra no mapa.
// Mapa base: os objetos herdados aparecem esmaecidos; clique neles para ocultar ou copiar para editar.
import {canRotate,BIOMES,PROPS,PROP_TYPES,PROP_GROUPS,LIMITS,BUILTIN_BASES,GROUND_STYLES,STYLE_PRESETS,mapRef,normalizeMap,normalizeObject,normalizeSpawn,normalizeStyle,resolveMap,analyze,detach,dependents,centered} from './map-model.mjs';
import {blankTerrain,fitTerrain,openGrid,closeGrid,applyBrush,carvedGrid,normalizeRiver,isBlockedCell,SURFACES,TERRAIN_RULES} from './map-terrain.mjs';
import {CAMPAIGN_SLOTS,checkCampaignMap,isRequiredSpawn,bakedCampaignMap} from './campaign-maps.mjs';
import {TRIGGERS,TIERS,spawnTypes} from './map-spawns.mjs';
import {createMapPreview} from './map-preview.mjs';
import {rayPick,objectBounds,handlesFor,applyHandle} from './map-handles.mjs';
import {PALETTES} from './expedition-map.mjs';

const SNAP=.5,MIN_SCALE=2,MAX_SCALE=70,HISTORY=100,PICK_MIN=.35,AUTOSAVE=700;
// Ferramentas de relevo e água: pincéis sobre a grade. `rio` é desenhado como linha.
const TERRAIN_TOOLS={raise:['Elevar','#b09a70'],lower:['Rebaixar','#7a6444'],flatten:['Aplainar','#8c8c70'],smooth:['Suavizar','#9aa088'],plateau:['Platô (penhasco)','#6e6c66']},WATER_TOOLS={lake:['Lago','#3f7d8c'],dry:['Secar','#8a7650']};
const isBrushTool=t=>t in TERRAIN_TOOLS||t in WATER_TOOLS||t.startsWith('surface-');
const hex=n=>'#'+n.toString(16).padStart(6,'0');
const snap=(v,on)=>on?Math.round(v/SNAP)*SNAP:Math.round(v*20)/20;
const clone=v=>JSON.parse(JSON.stringify(v));

// Último modo de visualização escolhido, lembrado enquanto a página estiver aberta.
let lastMode=null;
// `game`: renderizador do jogo, só para reaproveitar o modelo do personagem na pré-visualização 3D.
// `standalone`: página própria do editor; Testar abre o jogo em outra aba e o editor continua aberto. `barExtra`: elemento a mais na barra superior.
export function createMapEditor({library,enemyTypes,play,closed,game,standalone=false,barExtra=null}){
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
 if(barExtra)bar.append(barExtra);
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
 const foldGroup=(title,open=false)=>{const d=el('details',null,undefined,tools);d.open=open;d.dataset.group=title;el('summary',null,title,d);return el('div','me-group',undefined,d);};
 let g=toolGroup('Ferramentas');addTool('select','Selecionar',null,g,'V');addTool('erase','Apagar',null,g,'E');
 // Pincel: vale para qualquer peça redonda (colisores, enfeites e chão); muros e troncos são desenhados como retângulo.
 g=toolGroup('Ao arrastar');
 const brushMode=el('select');for(const [value,text] of [['row','Fileira ao longo do traço'],['scatter','Espalhar com pincel'],['single','Um por clique']])el('option',null,text,brushMode).value=value;
 brushMode.setAttribute('aria-label','O que fazer ao arrastar com uma peça');g.append(brushMode);
 const spacingIn=input('number',{min:0,max:20,step:.1,value:0,title:'Distância entre peças. 0 = automática, pelo tamanho da peça.'}),radiusIn=input('number',{min:.5,max:30,step:.5,value:3,title:'Raio do pincel ao espalhar.'});
 label('Espaço',spacingIn,g);label('Raio',radiusIn,g);
 el('p','me-note','Segure e arraste para criar várias peças de uma vez. Ctrl+Z desfaz o traço inteiro.',g);
 g=toolGroup('Marcadores');addTool('start','Início do jogador','#6fb7ff',g);addTool('spawn','Inimigos','#e0605a',g);
 g=toolGroup('Relevo');for(const [id,[text,color]] of Object.entries(TERRAIN_TOOLS))addTool(id,text,color,g);
 g=toolGroup('Água');addTool('river','Rio (desenhar)','#3f7d8c',g);for(const [id,[text,color]] of Object.entries(WATER_TOOLS))addTool(id,text,color,g);
 g=toolGroup('Superfície');for(const [id,s] of Object.entries(SURFACES))addTool('surface-'+id,s.label,s.color,g);addTool('surface-0','Limpar superfície','#2c4a2f',g);
 g=toolGroup('Pincel de terreno');
 const terrainRadius=input('number',{min:1,max:40,step:.5,value:5}),terrainStrength=input('number',{min:.02,max:2,step:.02,value:.25,title:'Quanto cada passada muda, em unidades.'}),terrainTarget=input('number',{min:TERRAIN_RULES.minHeight,max:TERRAIN_RULES.maxHeight,step:.1,value:2,title:'Altura do platô e do aplainar; profundidade do lago.'}),riverWidth=input('number',{min:2,max:40,step:.5,value:6}),riverDepth=input('number',{min:.2,max:3,step:.1,value:1.2,title:'Até 0,7 dá pé; mais fundo que isso barra quem anda no meio do rio.'});
 label('Raio',terrainRadius,g);label('Força',terrainStrength,g);label('Altura',terrainTarget,g);label('Rio: largura',riverWidth,g);label('Rio: fundura',riverDepth,g);
 el('p','me-note','Abaixo da cota 0 é água. Até '+(-TERRAIN_RULES.deep).toString().replace('.',',')+' u dá pé, mas atrasa; mais fundo ou íngreme demais barra quem anda. Pontes abrem passagem.',g);
 const search=input('search',{placeholder:'Buscar peça…'});search.className='me-search';search.setAttribute('aria-label','Buscar peça');el('h3',null,'Peças',tools);tools.append(search);
 const OPEN_GROUPS=new Set(['Colisores','Água','Enfeites','Chão']);
 for(const group of PROP_GROUPS){g=foldGroup(group,OPEN_GROUPS.has(group));for(const type of PROP_TYPES)if(PROPS[type].group===group)addTool(type,PROPS[type].label,PROPS[type].color,g);}
 search.oninput=()=>{const q=search.value.trim().toLowerCase();for(const d of tools.querySelectorAll('details')){let any=false;for(const b of d.querySelectorAll('.me-tool')){const hit=!q||b.textContent.toLowerCase().includes(q);b.hidden=!hit;any||=hit;}d.hidden=!any;if(q)d.open=true;}};

 // --- Estado ---
 let doc=null,resolved=null,tool='select',selection=null,dirty=false,undo=[],redo=[],view={cx:0,cy:0,scale:12},hover=null,drag=null,spaceDown=false,lastEnemyType=0,analysisTimer=0,saveTimer=0,problems=[],slot=null,terrainView=null;
 const lookup=id=>doc&&id===doc.id?null:library.get(id);
 const flat=()=>resolved.map;
 const isOpen=()=>dlg.open;

 function open(target){
  const source=typeof target==='string'?library.get(target):target;if(!source)return false;
  doc=clone(source);undo=[];redo=[];slot=CAMPAIGN_SLOTS[doc.campaign]||null;dirty=!library.get(doc.id)&&!slot;selection=null;tool='select';banner.hidden=true;terrainView=null;syncSlotTools();
  if(!dlg.open)dlg.showModal();
  syncResolved();nameInput.value=doc.name;fit();inspectorKey=null;setTool('select');syncHeader();say(dirty?'Novo mapa (ainda não salvo)':'Salvo');runAnalysis();setViewMode(lastMode||(standalone?'3d':innerWidth>=1100?'split':'2d'),true);draw();
  return true;
 }
 function close(){clearTimeout(analysisTimer);clearTimeout(saveTimer);preview?.stop();if(dlg.open)dlg.close();doc=null;resolved=null;}
 const say=(text,kind='')=>{status.textContent=text;status.dataset.kind=kind;};
 function syncResolved(){resolved=resolveMap(doc,lookup);}

 // --- Pré-visualização 3D ---
 const preview=game?createMapPreview({models:game.models,assets:game.assets,freeByDefault:standalone,hooks:{down:i=>hooks3d.down(i),move:i=>hooks3d.move(i),up:()=>hooks3d.up(),hover:i=>hooks3d.hover(i),leave:()=>hooks3d.leave(),handleDown:(h,i)=>hooks3d.handleDown(h,i),keepKey:c=>hooks3d.keepKey(c),toolActive:()=>hooks3d.toolActive()}}):null;if(preview)pane3d.append(preview.root);
 let previewQueued=0,mode='2d';
 // O mapa resolvido vai para a cena 3D no próximo quadro; vários eventos seguidos (arrastar) viram uma só atualização, e a cena refaz só o que mudou.
 function syncPreview(){if(!preview?.running()||!doc)return;preview.setMap({flat:resolveMap(doc,lookup).map,points:slot?.points||[],solo:selection?.kind==='object'||selection?.kind==='base'?selection.id:null});pushOverlay();}
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
  to.push(json());doc=JSON.parse(from.pop());dirty=true;terrainView=null;
  if(selection&&!exists(selection))selection=null;changed();
 }
 function changed(){if(status.dataset.kind==='error'||status.dataset.kind==='warn')status.dataset.kind='';syncResolved();terrainView=null;syncHeader();syncSide();syncSelectionFields();scheduleAnalysis();scheduleSave();draw();queuePreview();}

 // --- Dados do documento ---
 const ownObject=id=>doc.objects.find(o=>o.id===id);
 const baseObject=id=>flat().baseObjects.find(o=>o.id===id);
 const exists=sel=>sel.kind==='object'?!!ownObject(sel.id):sel.kind==='base'?!!baseObject(sel.id):sel.kind==='spawn'?flat().spawns.some(s=>s.id===sel.id):sel.kind==='river'?!!riverOf(sel.id):true;
 // Campos herdados (null) viram próprios no primeiro uso.
 function adopt(field){
  if(doc[field]==null)doc[field]=clone(flat()[field]);
 }
 const spawnsList=()=>doc.spawns??flat().spawns;
 const riverOf=id=>(doc.terrain??flat().terrain)?.rivers.find(r=>r.id===id);
 // Terreno próprio do mapa, criado na primeira edição (a partir da base, quando houver) e na grade do tamanho atual.
 function ownTerrain(){doc.terrain=fitTerrain(doc.terrain||(flat().terrain?clone(flat().terrain):blankTerrain(flat().size)),flat().size);return doc.terrain;}
 function addObject(type,x,y,extra={}){
  if(doc.objects.length>=LIMITS.maxObjects){say('Limite de '+LIMITS.maxObjects+' objetos.','warn');return null;}
  const taken=new Set([...doc.objects.map(o=>o.id),...flat().baseObjects.map(o=>o.id)]),o=normalizeObject({type,x,y,...extra},taken);
  doc.objects.push(o);return o;
 }
 function addSpawn(x,y){
  adopt('spawns');if(doc.spawns.length>=LIMITS.maxSpawns){say('Limite de '+LIMITS.maxSpawns+' pontos de inimigos.','warn');return null;}
  const s=normalizeSpawn({x,y,count:4,type:lastEnemyType,...(slot?.triggers?{trigger:'near',idle:true,spread:2.2}:{})},new Set(doc.spawns.map(v=>v.id)));doc.spawns.push(s);return s;
 }
 function removeSelection(){
  if(!selection)return;
  if(selection.kind==='spawn'&&isRequiredSpawn(doc.campaign,selection.id)){say('Este grupo é parte de uma missão: pode ser movido e configurado, mas não removido.','warn');return;}
  mutate(d=>{
   if(selection.kind==='river'){ownTerrain();d.terrain.rivers=d.terrain.rivers.filter(r=>r.id!==selection.id);return;}
   if(selection.kind==='object')d.objects=d.objects.filter(o=>o.id!==selection.id);
   else if(selection.kind==='spawn'){adopt('spawns');d.spawns=d.spawns.filter(s=>s.id!==selection.id);}
   else if(selection.kind==='base'&&!d.hidden.includes(selection.id))d.hidden.push(selection.id);
  });
  selection=selection?.kind==='base'?selection:null;syncSide();syncSelectionFields();draw();
 }
 function duplicateSelection(){
  if(!selection||selection.kind==='start'||selection.kind==='river')return;
  mutate(d=>{
   if(selection.kind==='spawn'){adopt('spawns');const s=d.spawns.find(v=>v.id===selection.id);if(!s)return;const c=addSpawn(s.x+1,s.y+1);if(c){Object.assign(c,{...s,id:c.id,x:c.x,y:c.y,quest:false});selection={kind:'spawn',id:c.id};}return;}
   const src=selection.kind==='base'?baseObject(selection.id):ownObject(selection.id);if(!src)return;
   const {id,inherited,...rest}=src,c=addObject(src.type,src.x+1,src.y+1,rest);if(c)selection={kind:'object',id:c.id};
  });
 }
 function nudge(dx,dy){
  if(!selection||selection.kind==='base')return;
  mutate(d=>{
   if(selection.kind==='river'){ownTerrain();const r=d.terrain.rivers.find(v=>v.id===selection.id);if(r)r.points=r.points.map(([x,y])=>[x+dx,y+dy]);return;}
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

 // Aumentar ou reduzir o objeto selecionado, mantendo as proporções.
 function scaleSelection(k){
  if(selection?.kind!=='object')return;
  mutate(d=>{const i=d.objects.findIndex(o=>o.id===selection.id);if(i<0)return;const o={...d.objects[i]};for(const f of ['r','w','d','h','s'])if(o[f]!==undefined)o[f]*=k;d.objects[i]=normalizeObject(o,new Set());});
 }

 function turnSelection(degrees){
  if(selection?.kind!=='object')return;
  mutate(d=>{const i=d.objects.findIndex(o=>o.id===selection.id);if(i>=0)d.objects[i]=normalizeObject({...d.objects[i],rot:(d.objects[i].rot||0)+degrees},new Set());});
 }

 // --- Relevo no canvas ---
 // Imagem da grade: encostas sombreadas, água por profundidade, trechos intransitáveis em tom próprio e superfícies pintadas.
 const terrainCanvas=document.createElement('canvas');
 function paintTerrain(t,rivers){
  const b=carvedGrid(t,rivers),w=b.cols,h=b.rows;if(terrainCanvas.width!==w||terrainCanvas.height!==h){terrainCanvas.width=w;terrainCanvas.height=h;}
  const g=terrainCanvas.getContext('2d'),image=g.createImageData(w,h),px=image.data,hex2=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)],colors=Object.fromEntries(Object.entries(SURFACES).map(([k,s])=>[k,hex2(s.color)]));
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
   const k=j*w+i,v=b.h[k],a=k*4,xm=b.h[j*w+Math.max(0,i-1)],xp=b.h[j*w+Math.min(w-1,i+1)],ym=b.h[Math.max(0,j-1)*w+i],yp=b.h[Math.min(h-1,j+1)*w+i],light=((xm-xp)+(ym-yp))/(2*b.cell),s=colors[b.s[k]];
   let r=0,gr=0,bl=0,al=0;
   if(s){[r,gr,bl]=s;al=170;}
   if(v<TERRAIN_RULES.wet){const deep=v<TERRAIN_RULES.deep;r=deep?24:76;gr=deep?62:142;bl=deep?96:160;al=deep?235:200;}
   else if(isBlockedCell(b,b.x0+i*b.cell,b.y0+j*b.cell)){r=70;gr=58;bl=48;al=230;}
   else if(Math.abs(light)>.02||v>.05){const shade=Math.max(-1,Math.min(1,light*1.6))*.5+.5,up=Math.min(1,v/6);const m=al?.5:0;r=r*m+(shade*255)*(1-m);gr=gr*m+(shade*235+up*20)*(1-m);bl=bl*m+(shade*190)*(1-m);al=Math.max(al,Math.min(200,40+Math.abs(light)*220+up*80));}
   px[a]=r;px[a+1]=gr;px[a+2]=bl;px[a+3]=al;
  }
  g.putImageData(image,0,0);return b;
 }
 function currentTerrain(){
  if(drag?.mode==='terrain')return drag.grid;
  const t=flat().terrain;if(!t)return null;
  if(!terrainView||terrainView.source!==t){terrainView={source:t,grid:openGrid(t)};terrainView.painted=false;}
  return terrainView.grid;
 }
 function drawTerrain(X,Y,S){
  const g=currentTerrain();if(!g)return;const rivers=(drag?.mode==='terrain'?doc.terrain:flat().terrain).rivers;
  if(drag?.mode==='terrain'||!terrainView.painted){paintTerrain(g,rivers);if(terrainView)terrainView.painted=drag?.mode!=='terrain';}
  ctx.imageSmoothingEnabled=true;ctx.drawImage(terrainCanvas,X(g.x0-g.cell/2),Y(g.y0-g.cell/2),g.cols*g.cell*S,g.rows*g.cell*S);
 }
 function drawRivers(X,Y){
  const t=flat().terrain;if(!t&&drag?.mode!=='river')return;
  const line=(points,on)=>{ctx.strokeStyle=on?'#ffe27a':'#bfe6ff99';ctx.lineWidth=on?2:1;ctx.setLineDash(on?[]:[6,5]);ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y)));ctx.stroke();ctx.setLineDash([]);
   // Seta no meio do trecho: o sentido da correnteza.
   const m=Math.floor(points.length/2),a=points[Math.max(0,m-1)],b=points[m];if(!b)return;const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(X(b[0])+Math.cos(ang)*8,Y(b[1])+Math.sin(ang)*8);ctx.lineTo(X(b[0])+Math.cos(ang+2.5)*7,Y(b[1])+Math.sin(ang+2.5)*7);ctx.lineTo(X(b[0])+Math.cos(ang-2.5)*7,Y(b[1])+Math.sin(ang-2.5)*7);ctx.fill();};
  for(const r of t?.rivers||[])line(r.points,selection?.kind==='river'&&selection.id===r.id);
  if(drag?.mode==='river')line(drag.points,true);
 }
 function drawPoints(X,Y){
  // Lugares que a história da campanha usa: referência fixa, não editável.
  ctx.font='11px Georgia,serif';ctx.textAlign='left';ctx.textBaseline='middle';
  for(const p of slot?.points||[]){const x=X(p.x),y=Y(p.y);ctx.fillStyle='#d4af37';ctx.strokeStyle='#0008';ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+6,y);ctx.lineTo(x,y+6);ctx.lineTo(x-6,y);ctx.closePath();ctx.fill();ctx.stroke();if(view.scale>=4){ctx.fillStyle='#f3e3a8';ctx.fillText(p.name,x+9,y);}}
 }

 // --- Desenho ---
 function drawObject(o,{alpha=1,dash=false,outline=null,min=3}={}){
  const def=PROPS[o.type];if(!def)return;const S=view.scale,s=size();
  const px=(o.x-view.cx)*S+s.w/2,py=(o.y-view.cy)*S+s.h/2;
  ctx.globalAlpha=alpha;ctx.fillStyle=def.color;ctx.strokeStyle=outline||'#0006';ctx.lineWidth=outline?2:1;ctx.setLineDash(dash?[4,3]:[]);
  if(def.shape==='box'){const w=Math.max(o.w*S,min),h=Math.max(o.d*S,min);ctx.save();ctx.translate(px,py);ctx.rotate(-(o.rot||0)*Math.PI/180);ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeRect(-w/2,-h/2,w,h);ctx.restore();}
  else{ctx.beginPath();ctx.arc(px,py,Math.max(o.r*S,min),0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.globalAlpha=1;ctx.setLineDash([]);
 }
 function draw(){
  pushOverlay();if(!doc||!dlg.open||mode==='3d')return;const dpr=resize(),s=size(),S=view.scale,f=flat(),b=centered(f.size);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#070b08';ctx.fillRect(0,0,s.w,s.h);
  const X=x=>(x-view.cx)*S+s.w/2,Y=y=>(y-view.cy)*S+s.h/2;
  ctx.fillStyle=hex((PALETTES[f.biome]||PALETTES.forest).dark.ground);ctx.fillRect(X(b.minX),Y(b.minY),f.size.w*S,f.size.h*S);
  // Grade: linhas a cada 1 u (se couber) e destaque a cada 5 u.
  ctx.lineWidth=1;
  for(let x=Math.ceil(b.minX);x<=b.maxX;x++){const major=x%5===0;if(!major&&S<10)continue;ctx.strokeStyle=major?'#ffffff26':'#ffffff0f';ctx.beginPath();ctx.moveTo(X(x),Y(b.minY));ctx.lineTo(X(x),Y(b.maxY));ctx.stroke();}
  for(let y=Math.ceil(b.minY);y<=b.maxY;y++){const major=y%5===0;if(!major&&S<10)continue;ctx.strokeStyle=major?'#ffffff26':'#ffffff0f';ctx.beginPath();ctx.moveTo(X(b.minX),Y(y));ctx.lineTo(X(b.maxX),Y(y));ctx.stroke();}
  drawTerrain(X,Y,S);
  ctx.strokeStyle='#d4af37';ctx.lineWidth=2;ctx.strokeRect(X(b.minX),Y(b.minY),f.size.w*S,f.size.h*S);
  // Camadas: chão, enfeites, colisores. Herdados esmaecidos; ocultos tracejados em vermelho.
  const layer=o=>PROPS[o.type]?.group==='Chão'?0:PROPS[o.type]?.group==='Enfeites'?1:2,hidden=new Set(doc.hidden);
  const selId=selection&&(selection.kind==='object'||selection.kind==='base')?selection.id:null;
  for(const level of [0,1,2]){
   for(const o of f.baseObjects)if(layer(o)===level){const h=hidden.has(o.id);drawObject(o,{alpha:h?.18:.42,dash:true,outline:o.id===selId?'#ffe27a':h?'#e0605a':'#ffffff55'});}
   for(const o of doc.objects)if(layer(o)===level)drawObject(o,{outline:o.id===selId?'#ffe27a':null});
  }
  drawRivers(X,Y);drawPoints(X,Y);
  // Marcadores
  const sp=f.spawns;
  for(const sv of sp){
   const x=X(sv.x),y=Y(sv.y),on=selection?.kind==='spawn'&&selection.id===sv.id,spread=(.55*Math.sqrt(sv.count)+.4)*S;
   ctx.strokeStyle=on?'#ffe27a':'#e0605a';ctx.lineWidth=on?2:1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(x,y,Math.max(spread,10),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
   ctx.fillStyle=doc.spawns?'#e0605a':'#e0605a88';ctx.beginPath();ctx.arc(x,y,Math.max(.6*S,9),0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#fff';ctx.font='bold 11px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(sv.count),x,y);
   if(sv.trigger==='near'&&on){ctx.strokeStyle='#e0605a66';ctx.setLineDash([2,5]);ctx.beginPath();ctx.arc(x,y,sv.radius*S,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
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
  else if(hover&&isBrushTool(tool)){ctx.strokeStyle='#ffffffaa';ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(X(hover.x),Y(hover.y),Number(terrainRadius.value)*S,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  else if(hover&&(tool==='start'||tool==='spawn')){ctx.globalAlpha=.55;ctx.fillStyle=tool==='start'?'#6fb7ff':'#e0605a';ctx.beginPath();ctx.arc(X(hover.x),Y(hover.y),Math.max(.5*S,8),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  // Coordenadas sob o cursor
  if(hover){ctx.fillStyle='#e8e5c5cc';ctx.font='11px Georgia,serif';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillText(hover.x.toFixed(1)+' , '+hover.y.toFixed(1)+'  ·  zoom '+Math.round(S*10)/10,8,s.h-8);}
 }

 // --- Seleção por clique ---
 function pick(p){
  const f=flat(),near=(o,r)=>Math.hypot(p.x-o.x,p.y-o.y)<=Math.max(r,PICK_MIN);
  for(const s of [...f.spawns].reverse())if(near(s,.6))return {kind:'spawn',id:s.id};
  const nearRiver=r=>r.points.some((b,i)=>{if(!i)return false;const a=r.points[i-1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a[0]-dx*t,p.y-a[1]-dy*t)<=r.width/2;});
  if(near(f.start,.5))return {kind:'start'};
  const hit=o=>{const d=PROPS[o.type];if(d.shape!=='box')return near(o,o.r);const a=(o.rot||0)*Math.PI/180,dx=p.x-o.x,dy=p.y-o.y;return Math.abs(dx*Math.cos(a)-dy*Math.sin(a))<=o.w/2+.15&&Math.abs(dx*Math.sin(a)+dy*Math.cos(a))<=o.d/2+.15;};
  // Sólidos antes de enfeites e chão; dentro de cada camada, o mais recente primeiro.
  const order=[2,1,0],layer=o=>PROPS[o.type].group==='Chão'?0:PROPS[o.type].group==='Enfeites'?1:2;
  for(const lv of order){
   for(const o of [...doc.objects].reverse())if(layer(o)===lv&&hit(o))return {kind:'object',id:o.id};
   for(const o of [...f.baseObjects].reverse())if(layer(o)===lv&&hit(o))return {kind:'base',id:o.id};
  }
  for(const r of f.terrain?.rivers||[])if(nearRiver(r))return {kind:'river',id:r.id};
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

 // Uma passada do pincel de terreno na grade em edição; a imagem é refeita no próximo desenho.
 function stamp(p){
  const surface=tool.startsWith('surface-')?Number(tool.slice(8)):0,kind=tool.startsWith('surface-')?'surface':tool;
  applyBrush(drag.grid,kind,p.x,p.y,{radius:Number(terrainRadius.value)||5,strength:Number(terrainStrength.value)||.25,target:kind==='lake'?Math.abs(Number(terrainTarget.value))||1:Number(terrainTarget.value)||0,surface});
 }

 // --- Ferramentas: a mesma lógica nas duas vistas. `find` diz o que está sob o ponteiro em cada uma. ---
 // Peça herdada vira peça do mapa ao ser mexida: a da base fica oculta e a cópia assume o lugar.
 function adoptBase(id){
  const o=baseObject(id);if(!o)return null;
  const {id:old,inherited,...rest}=o,c=addObject(o.type,o.x,o.y,rest);if(!c)return null;
  if(!doc.hidden.includes(old))doc.hidden.push(old);selection={kind:'object',id:c.id};syncResolved();return c;
 }
 function toolDown(w,find){
  const on=snapChk.checked,point={x:snap(w.x,on),y:snap(w.y,on)},before=json();
  if(isBrushTool(tool)){ownTerrain();const grid=openGrid(doc.terrain);drag={mode:'terrain',before,grid,last:point};stamp(point);draw();return true;}
  if(tool==='river'){drag={mode:'river',before,points:[[point.x,point.y]]};draw();return true;}
  if(tool==='select'){
   const hit=find();selection=hit;
   if(hit?.kind==='river'){ownTerrain();const r=doc.terrain.rivers.find(v=>v.id===hit.id);if(r){drag={mode:'moveRiver',before,river:r,from:w,points:r.points.map(p=>[...p])};}}
   else if(hit?.kind==='base')drag={mode:'adopt',before,id:hit.id,from:w};
   else if(hit){
    if(hit.kind==='spawn')adopt('spawns');if(hit.kind==='start')adopt('start');
    const target=hit.kind==='object'?ownObject(hit.id):hit.kind==='spawn'?doc.spawns.find(s=>s.id===hit.id):doc.start;
    drag={mode:'move',before,target,dx:target.x-w.x,dy:target.y-w.y};
   }
   syncSide();syncSelectionFields();draw();return !!hit;
  }
  if(tool==='erase'){
   // Arrastar apaga tudo o que o ponteiro tocar; o traço inteiro é um passo do histórico.
   drag={mode:'erase',before,mark:undo.length};const hit=find();if(hit&&hit.kind!=='start'){selection=hit;removeSelection();selection=null;syncSelectionFields();draw();}return true;
  }
  if(tool==='start'){mutate(d=>{d.start={x:point.x,y:point.y};});selection={kind:'start'};syncSelectionFields();return true;}
  if(tool==='spawn'){let s;mutate(()=>{s=addSpawn(point.x,point.y);});if(s){selection={kind:'spawn',id:s.id};syncSelectionFields();}return true;}
  const def=PROPS[tool];
  if(def?.shape==='box'){drag={mode:'rect',before,from:point,to:point,rect(){const x0=Math.min(this.from.x,this.to.x),x1=Math.max(this.from.x,this.to.x),y0=Math.min(this.from.y,this.to.y),y1=Math.max(this.from.y,this.to.y);return {x:(x0+x1)/2,y:(y0+y1)/2,w:x1-x0,d:y1-y0};}};return true;}
  if(def){
   // Qualquer peça redonda pode ser pintada arrastando (fileira ao longo do traço ou espalhada pelo pincel).
   const kind=brushMode.value;
   drag={mode:'paint',before,kind,last:point,placed:[],spacing:brushSpacing(def),limitSaid:false};
   if(kind==='scatter')scatter(point);else paintAt(point);
   if(drag.placed.length)changed();
  }
  return true;
 }
 function toolMove(w,find,info){
  const on=snapChk.checked;hover={x:snap(w.x,on),y:snap(w.y,on)};
  if(drag?.mode==='adopt'&&Math.hypot(w.x-drag.from.x,w.y-drag.from.y)>.15){
   const c=adoptBase(drag.id);
   drag=c?{mode:'move',before:drag.before,target:c,dx:c.x-drag.from.x,dy:c.y-drag.from.y}:null;syncSide();syncSelectionFields();
  }
  if(drag?.mode==='move'){drag.target.x=snap(w.x+drag.dx,on);drag.target.y=snap(w.y+drag.dy,on);drag.moved=true;syncSelectionFields();queuePreview();}
  else if(drag?.mode==='handle'){
   const i=doc.objects.findIndex(o=>o.id===drag.start.id);
   if(i>=0){doc.objects[i]=normalizeObject(applyHandle(drag.start,drag.handle,w,{snap:on?SNAP:0,lift:(drag.py-info.py)*(preview?.upPerPixel()||0),steps:info.shift}),new Set());syncResolved();syncSelectionFields();queuePreview();}
  }
  else if(drag?.mode==='rect')drag.to=hover;
  else if(drag?.mode==='paint')paintTo(hover);
  else if(drag?.mode==='erase'){const hit=find();if(hit&&hit.kind!=='start'&&(hit.kind!=='base'||!doc.hidden.includes(hit.id))){selection=hit;removeSelection();selection=null;}}
  else if(drag?.mode==='terrain'){const step=Math.max(.5,Number(terrainRadius.value)*.35),dx=hover.x-drag.last.x,dy=hover.y-drag.last.y,dist=Math.hypot(dx,dy);for(let t=step;t<=dist;t+=step)stamp({x:drag.last.x+dx/dist*t,y:drag.last.y+dy/dist*t});if(dist>=step)drag.last=hover;}
  else if(drag?.mode==='river'){const last=drag.points[drag.points.length-1];if(Math.hypot(hover.x-last[0],hover.y-last[1])>=2.5&&drag.points.length<TERRAIN_RULES.maxRiverPoints)drag.points.push([hover.x,hover.y]);}
  else if(drag?.mode==='moveRiver'){const dx=w.x-drag.from.x,dy=w.y-drag.from.y;drag.river.points=drag.points.map(([x,y])=>[x+dx,y+dy]);drag.moved=true;}
  draw();
 }
 function toolUp(){
  if(!drag)return;const d=drag;drag=null;
  if(d.mode==='erase'){if(undo.length>d.mark){undo.length=d.mark;undo.push(d.before);}}
  else if(d.mode==='adopt'){/* clique simples em peça herdada: só seleciona */}
  else if(d.mode==='terrain'){doc.terrain=closeGrid(d.grid,doc.terrain.rivers);commit(d.before);}
  else if(d.mode==='river'){
   const taken=new Set((doc.terrain??flat().terrain)?.rivers.map(r=>r.id)),r=normalizeRiver({points:d.points,width:Number(riverWidth.value),depth:Number(riverDepth.value)},taken);
   if(r){ownTerrain();doc.terrain.rivers.push(r);selection={kind:'river',id:r.id};commit(d.before);}else say('Arraste para desenhar o curso do rio.','warn');
  }
  else if(d.mode==='moveRiver'){if(d.moved)commit(d.before);}
  else if(d.mode==='rect'){
   const r=d.rect(),tiny=r.w<.4&&r.d<.4;
   mutate(()=>{if(doc.objects.length<LIMITS.maxObjects){const o=addObject(tool,r.x,r.y,tiny?{}:{w:Math.max(r.w,.5),d:Math.max(r.d,.5)});if(o)selection={kind:'object',id:o.id};}});
  }else if(d.before!==undefined)commit(d.before);
  syncSide();syncSelectionFields();draw();
 }

 // --- Vista de cima ---
 const pointer=e=>{const r=canvas.getBoundingClientRect();return {px:e.clientX-r.left,py:e.clientY-r.top};};
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('wheel',e=>{
  e.preventDefault();const {px,py}=pointer(e),before=toWorld(px,py);
  view.scale=Math.max(MIN_SCALE,Math.min(MAX_SCALE,view.scale*Math.exp(-e.deltaY*.0015)));
  const after=toWorld(px,py);view.cx+=before.x-after.x;view.cy+=before.y-after.y;draw();
 },{passive:false});
 canvas.addEventListener('pointerdown',e=>{
  if(!doc)return;try{canvas.setPointerCapture(e.pointerId);}catch{}canvas.focus({preventScroll:true});
  const {px,py}=pointer(e),w=toWorld(px,py);
  if(e.button===1||e.button===2||spaceDown){drag={mode:'pan',px,py,cx:view.cx,cy:view.cy};return;}
  if(e.button===0)toolDown(w,()=>pick(w));
 });
 canvas.addEventListener('pointermove',e=>{
  if(!doc)return;const {px,py}=pointer(e),w=toWorld(px,py);
  if(drag?.mode==='pan'){view.cx=drag.cx-(px-drag.px)/view.scale;view.cy=drag.cy-(py-drag.py)/view.scale;draw();return;}
  toolMove(w,()=>pick(w));
 });
 canvas.addEventListener('pointerleave',()=>{hover=null;draw();});
 const endDrag=e=>{if(!drag)return;try{canvas.releasePointerCapture(e.pointerId);}catch{}if(drag.mode==='pan'){drag=null;return;}toolUp();};
 canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);

 // --- Vista 3D ---
 // Rio só existe no chão: entra quando o raio não tocou nenhuma peça.
 function pick3D(info){
  const f=flat(),hit=rayPick(info.ray,f,(x,y)=>preview.groundY(x,y));if(hit)return hit;
  const p=info.point,near=r=>r.points.some((b,i)=>{if(!i)return false;const a=r.points[i-1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a[0]-dx*t,p.y-a[1]-dy*t)<=r.width/2;});
  const river=(f.terrain?.rivers||[]).find(near);return river?{kind:'river',id:river.id}:null;
 }
 const hooks3d={
  down:info=>doc?toolDown(info.point,()=>pick3D(info)):false,
  move:info=>{if(doc)toolMove(info.point,()=>pick3D(info),info);},
  up:()=>{if(doc)toolUp();},
  hover:info=>{if(!doc)return;const on=snapChk.checked;hover={x:snap(info.point.x,on),y:snap(info.point.y,on)};hoverHit=tool==='select'||tool==='erase'?pick3D(info):null;pushOverlay();},
  leave:()=>{hover=null;hoverHit=null;pushOverlay();},
  handleDown(handle,info){
   // Alça só com Selecionar: com outra ferramenta, o clique é da ferramenta, mesmo perto da peça selecionada.
   if(tool!=='select'||selection?.kind!=='object'&&selection?.kind!=='base')return false;
   const before=json();if(selection.kind==='base'&&!adoptBase(selection.id))return false;
   const o=ownObject(selection.id);if(!o)return false;
   drag={mode:'handle',before,handle:handle.id,start:{...o},py:info.py};syncSide();syncSelectionFields();return true;
  },
  // Com peça selecionada, as setas a empurram; sem seleção, movem a câmera.
  keepKey:code=>code.startsWith('Arrow')&&!!selection,
  toolActive:()=>tool!=='select'
 };
 let hoverHit=null;
 function objectBy(sel){return sel?.kind==='object'?ownObject(sel.id):sel?.kind==='base'?baseObject(sel.id):null;}
 const boundsOf=sel=>{const o=objectBy(sel);if(o)return objectBounds(o,PROPS[o.type],PROPS[o.type]?.float?0:preview.groundY(o.x,o.y));
  const p=sel?.kind==='start'?flat().start:sel?.kind==='spawn'?flat().spawns.find(s=>s.id===sel.id):null;if(!p)return null;const up=preview.groundY(p.x,p.y);return {x0:p.x-.7,x1:p.x+.7,z0:p.y-.7,z1:p.y+.7,y0:up,y1:up+2.6};};
 // O que a vista 3D desenha por cima do mapa: contornos, alças, fantasma da peça e guias do traço.
 function pushOverlay(){
  if(!preview?.running()||!doc)return;
  const o=objectBy(selection),placing=!!PROPS[tool]&&!drag,state={selection:selection?{bounds:boundsOf(selection),handles:o&&tool==='select'?handlesFor(o):[]}:null,hoverBounds:hoverHit&&(hoverHit.id!==selection?.id||hoverHit.kind!==selection?.kind)?boundsOf(hoverHit):null};
  if(hover){
   if(isBrushTool(tool))state.ring={x:hover.x,y:hover.y,r:Number(terrainRadius.value)||5};
   else if(placing)state.ghost={type:tool,x:hover.x,y:hover.y};
   if(placing&&PROPS[tool].shape!=='box'&&brushMode.value==='scatter')state.ring={x:hover.x,y:hover.y,r:brushRadius()};
  }
  if(drag?.mode==='rect')state.rect=drag.rect();
  if(drag?.mode==='river')state.line=drag.points;
  else if(selection?.kind==='river')state.line=riverOf(selection.id)?.points;
  preview.setOverlay(state);
 }

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
  if(key==='['||key===']'){e.preventDefault();scaleSelection(key===']'?1.1:1/1.1);return;}
  if(key==='r'&&selection?.kind==='object'&&canRotate(PROPS[ownObject(selection.id)?.type])){e.preventDefault();turnSelection(e.shiftKey?-15:15);return;}
  const step=e.shiftKey?2:SNAP,arrows={arrowleft:[-step,0],arrowright:[step,0],arrowup:[0,-step],arrowdown:[0,step]};
  if(arrows[key]&&selection){e.preventDefault();nudge(...arrows[key]);}
 });
 dlg.addEventListener('keyup',e=>{if(e.code==='Space')spaceDown=false;});
 dlg.addEventListener('cancel',e=>{e.preventDefault();if(tool!=='select'||selection){setTool('select');selection=null;syncSide();syncSelectionFields();draw();}else requestClose();});

 function setTool(id){
  tool=id;for(const [key,b] of toolButtons)b.classList.toggle('on',key===id);
  canvas.style.cursor=id==='select'?'default':id==='erase'?'not-allowed':'crosshair';
  if(id==='spawn'&&slot?.noSpawns)return setTool('select');
  if(id!=='select'&&selection?.kind==='base')selection=null;
  syncSide();syncSelectionFields();draw();
 }

 // --- Barra, lateral e inspetor ---
 const baseSelect=el('select');
 const sideCampaign=el('section','me-sec',undefined,side),sideBase=el('section','me-sec',undefined,side),sideSel=el('section','me-sec',undefined,side),sideMap=el('section','me-sec',undefined,side),sideStyle=el('section','me-sec',undefined,side),sideProblems=el('section','me-sec',undefined,side);
 // Mapas da campanha: a planta é fixa como base, e o que a cena não usa sai da paleta.
 function syncSlotTools(){
  for(const id of ['river','surface-1','surface-2','surface-3','surface-4','surface-5','surface-0',...Object.keys(TERRAIN_TOOLS),...Object.keys(WATER_TOOLS)])if(toolButtons.get(id))toolButtons.get(id).hidden=!!slot?.noTerrain;
  if(toolButtons.get('spawn'))toolButtons.get('spawn').hidden=!!slot?.noSpawns;
  if(toolButtons.get('start'))toolButtons.get('start').hidden=!!slot?.fixedStart;
 }
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
  queuePreview();
  if(inspectorKeyNow()!==inspectorKey)return buildInspector();
  const t=selectionTarget();if(!t||!selectionFields||selection.kind==='river')return;
  for(const [k,i] of Object.entries(selectionFields))if(document.activeElement!==i)i.value=+(+(t[k]??0)).toFixed(2);
 }
 function selectionTarget(){
  if(!selection)return null;
  if(selection.kind==='object')return ownObject(selection.id);
  if(selection.kind==='spawn')return spawnsList().find(s=>s.id===selection.id);
  if(selection.kind==='start')return flat().start;
  if(selection.kind==='river')return riverOf(selection.id);
  return null;
 }
 function buildInspector(){
  inspectorKey=inspectorKeyNow();
  sideSel.replaceChildren();selectionFields=null;fillInspector();
  if(selection&&(selection.kind==='object'||selection.kind==='spawn')){button('Duplicar',duplicateSelection,sideSel);const del=button('Excluir',removeSelection,sideSel,'danger');if(selection.kind==='spawn'&&isRequiredSpawn(doc.campaign,selection.id))del.disabled=true;}
 }
 function fillInspector(){
  el('h3',null,'Seleção',sideSel);
  if(!selection){
   el('p','me-note',tool==='select'?'Clique em um objeto para editar, arraste para mover. Escolha uma peça na paleta à esquerda para posicioná-la; colisores de caixa (muro, tronco) são desenhados arrastando.':'Ferramenta ativa: '+(PROPS[tool]?.label||toolButtons.get(tool)?.textContent||tool)+'. Esc volta para Selecionar.',sideSel);
   return;
  }
  if(selection.kind==='river'){
   const r=riverOf(selection.id);if(!r){selection=null;return fillInspector();}
   el('p','me-note','Rio com '+r.points.length+' pontos. A seta mostra a correnteza: a favor acelera, contra atrasa. Fundura acima de '+(-TERRAIN_RULES.deep).toString().replace('.',',')+' barra a travessia; use uma ponte ou deixe um trecho raso.',sideSel);
   const setRiver=(k,v)=>mutate(d=>{ownTerrain();const i=d.terrain.rivers.findIndex(x=>x.id===selection.id);if(i>=0)d.terrain.rivers[i]=normalizeRiver({...d.terrain.rivers[i],[k]:v},new Set());});
   field(sideSel,'Largura',r.width,{min:2,max:40,step:.5,onChange:v=>setRiver('width',v)});field(sideSel,'Fundura',r.depth,{min:.2,max:3,step:.1,onChange:v=>setRiver('depth',v)});
   button('Inverter correnteza',()=>setRiver('points',[...r.points].reverse()),sideSel);button('Excluir rio',removeSelection,sideSel,'danger');
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
   const required=isRequiredSpawn(doc.campaign,t.id);
   el('p','me-note',required?'Grupo de missão: pode ser movido e configurado, mas não removido, e não volta depois de derrotado.':'Grupo de inimigos. Monte a composição e diga quando e como ele aparece.',sideSel);
   add('x','X');add('y','Y');
   // Composição: linhas de tipo e quantidade, gravadas como a lista de integrantes.
   const rows=[];for(const type of spawnTypes(t)){const last=rows[rows.length-1];if(last?.type===type)last.count++;else rows.push({type,count:1});}
   const setRows=list=>{const mix=list.flatMap(r=>Array(Math.max(0,r.count)).fill(r.type)).slice(0,LIMITS.maxCount);if(mix.length){apply('mix',mix);buildInspector();}};
   el('h3',null,'Composição',sideSel);const mixHost=el('div','me-mix',undefined,sideSel);
   rows.forEach((row,i)=>{
    const type=el('select',undefined,undefined,mixHost);type.setAttribute('aria-label','Tipo de inimigo');for(const e of enemyTypes){const o=el('option',null,e.name,type);o.value=e.index;}type.value=row.type;type.onchange=()=>{lastEnemyType=Number(type.value);row.type=lastEnemyType;setRows(rows);};
    const count=input('number',{min:1,max:LIMITS.maxCount,step:1,value:row.count});count.setAttribute('aria-label','Quantidade');count.onchange=()=>{row.count=Math.max(1,Math.floor(Number(count.value))||1);setRows(rows);};mixHost.append(count);
    const drop=button('×',()=>{rows.splice(i,1);setRows(rows);},mixHost);drop.disabled=rows.length<2;drop.title='Remover da composição';
   });
   button('+ Tipo',()=>{rows.push({type:enemyTypes[0].index,count:1});setRows(rows);},sideSel);
   const leader=el('select');for(const [v,text] of [['','Sem líder'],['magic','Líder '+TIERS.magic],['rare','Líder '+TIERS.rare]])el('option',null,text,leader).value=v;leader.value=t.leader||'';leader.onchange=()=>apply('leader',leader.value||null);label('Líder',leader,sideSel);
   field(sideSel,'Nível (0: do mapa)',t.level||0,{min:0,max:LIMITS.maxLevel,step:1,onChange:v=>apply('level',v>0?v:null)});
   field(sideSel,'Dispersão',t.spread,{min:0,max:20,step:.5,onChange:v=>apply('spread',v)});
   if(slot&&!slot.triggers){el('p','me-note','Nesta cena os grupos nascem ao entrar; gatilho e ondas não se aplicam.',sideSel);return;}
   el('h3',null,'Spawn',sideSel);
   const trigger=el('select');for(const [v,text] of Object.entries(TRIGGERS))el('option',null,text,trigger).value=v;trigger.value=t.trigger;trigger.onchange=()=>{apply('trigger',trigger.value);buildInspector();};label('Quando',trigger,sideSel);
   if(t.trigger==='near')field(sideSel,'Raio de ativação',t.radius,{min:2,max:80,step:.5,onChange:v=>{apply('radius',v);draw();}});
   if(t.trigger==='timer')field(sideSel,'Atraso (s)',t.delay,{min:0,max:600,step:1,onChange:v=>apply('delay',v)});
   field(sideSel,'Ondas',t.waves,{min:1,max:20,step:1,onChange:v=>{apply('waves',v);buildInspector();}});
   if(t.waves>1)field(sideSel,'Entre ondas (s)',t.interval,{min:0,max:120,step:1,onChange:v=>apply('interval',v)});
   if(!required)field(sideSel,'Volta após (s, 0: não)',t.respawn,{min:0,max:600,step:5,onChange:v=>apply('respawn',v)});
   const idle=input('checkbox',{checked:t.idle});idle.onchange=()=>apply('idle',idle.checked);label('Espera parado até ver o jogador',idle,sideSel).className='me-check';
   return;
  }
  const def=PROPS[t.type];el('p','me-note',def.label+(def.solid?' · colisor':def.bridge?' · passagem sobre água':' · só visual'),sideSel);
  const resize=el('div','me-inline',undefined,sideSel);button('− Reduzir',()=>scaleSelection(1/1.1),resize);button('+ Aumentar',()=>scaleSelection(1.1),resize);
  if(canRotate(def))button('Girar 90°',()=>turnSelection(90),resize);
  add('x','X');add('y','Y');
  if(def.shape==='box'){add('w','Largura',{min:.2,max:60});add('d','Profundidade',{min:.2,max:60});}else if(def.dims.includes('r'))add('r','Raio',{min:.1,max:12});
  if(def.dims.includes('h'))add('h','Altura',{min:.1,max:12});if(def.dims.includes('s'))add('s','Escala',{min:.2,max:6});
  if(canRotate(def))selectionFields.rot=field(sideSel,'Giro (graus)',t.rot||0,{min:0,max:359,step:1,onChange:v=>apply('rot',v)});
 }
 function syncSide(){
  // Campanha
  sideCampaign.replaceChildren();sideCampaign.hidden=!slot;
  if(slot){
   const box=el('div','me-campaign',undefined,sideCampaign);el('strong',null,'Mapa da campanha · '+slot.name,box);el('p','me-note',slot.note+' As edições são salvas automaticamente'+(standalone?' em v2/assets/maps/ e entram no jogo com «Publicar no jogo»':' e valem na próxima vez que a cena abrir')+'. Losangos dourados marcam lugares que a história usa.',box);
   const restore=button('Restaurar original',()=>{if(!library.get(doc.id)&&!bakedCampaignMap(doc.campaign)){say('Este mapa já está como o original.','warn');return;}if(restore.dataset.confirm!=='1'){restore.dataset.confirm='1';restore.textContent='Confirmar: apagar a edição deste mapa';return;}library.remove(doc.id);const fresh=bakedCampaignMap(doc.campaign);const base=fresh||normalizeMap({id:doc.id,name:slot.name,base:slot.ref,campaign:doc.campaign,objects:[],hidden:[],biome:null,size:null,start:null,spawns:null}).map;clearTimeout(saveTimer);open(clone(base));say(fresh?'Edição local removida: voltou a edição embutida no jogo.':'Mapa restaurado para o original.');},box,'danger');
  }
  // Mapa base
  sideBase.replaceChildren();sideBase.hidden=!!slot;el('h3',null,'Mapa base',sideBase);
  const options=[['','Sem base (independente)'],...Object.entries(BUILTIN_BASES).map(([k,v])=>[k,'Jogo · '+v]),...library.list().filter(m=>!m.campaign&&m.id!==doc.id&&!dependents(doc.id,library.list()).includes(m.id)).map(m=>[mapRef(m.id),m.name])];
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
  biome.onchange=()=>mutate(d=>{d.biome=biome.value;});label('Bioma',biome,sideMap);if(!slot)inherit('biome','o bioma');else biome.disabled=false;
  const dis=doc.size==null&&!!doc.base&&!slot,setSize=(k,v)=>mutate(d=>{adopt('size');d.size=normalizeMap({...d,size:{...d.size,[k]:v}}).map.size;if(d.terrain)d.terrain=fitTerrain(d.terrain,d.size);});
  field(sideMap,'Largura',flat().size.w,{min:LIMITS.minSize,max:LIMITS.maxSize,step:1,disabled:dis,onChange:v=>setSize('w',v)});
  field(sideMap,'Altura',flat().size.h,{min:LIMITS.minSize,max:LIMITS.maxSize,step:1,disabled:dis,onChange:v=>setSize('h',v)});
  const grow=el('div','me-inline',undefined,sideMap);button('− 20 u',()=>mutate(d=>{adopt('size');d.size=normalizeMap({...d,size:{w:d.size.w-20,h:d.size.h-20}}).map.size;if(d.terrain)d.terrain=fitTerrain(d.terrain,d.size);}),grow).title='Reduz o mapa nos dois eixos, a partir do centro';button('+ 20 u',()=>mutate(d=>{adopt('size');d.size=normalizeMap({...d,size:{w:d.size.w+20,h:d.size.h+20}}).map.size;if(d.terrain)d.terrain=fitTerrain(d.terrain,d.size);}),grow).title='Aumenta o mapa nos dois eixos, a partir do centro';
  if(!slot){inherit('size','o tamanho');inherit('start','o início');inherit('spawns','os inimigos');}
  field(sideMap,'Nível dos inimigos',doc.level,{min:1,max:LIMITS.maxLevel,step:1,onChange:v=>mutate(d=>{d.level=normalizeMap({...d,level:v}).map.level;})});
  if(!slot?.noSpawns){
   field(sideMap,'Vida dos inimigos (×)',doc.enemyHp??1,{min:.1,max:10,step:.1,onChange:v=>mutate(d=>{d.enemyHp=normalizeMap({...d,enemyHp:v}).map.enemyHp;})});
   field(sideMap,'Experiência dos inimigos (×)',doc.enemyXp??1,{min:.1,max:10,step:.05,onChange:v=>mutate(d=>{d.enemyXp=normalizeMap({...d,enemyXp:v}).map.enemyXp;})});
  }
  el('p','me-note',flat().objects.length+' objeto(s) · '+flat().spawns.reduce((n,s)=>n+s.count,0)+' inimigo(s)'+(flat().terrain?' · '+flat().terrain.rivers.length+' rio(s)':''),sideMap);
  if(flat().terrain&&!slot?.noTerrain)button('Limpar relevo e água',()=>mutate(d=>{d.terrain=blankTerrain(flat().size);}),sideMap);
  syncStyle();
  renderProblems();
 }
 // Estilo do mapa: predefinições e ajustes finos. Vazio mantém o padrão do bioma.
 function syncStyle(){
  sideStyle.replaceChildren();el('h3',null,'Estilo',sideStyle);
  const st=flat().style||{},set=patchValue=>mutate(d=>{d.style=normalizeStyle({...(d.style||flat().style||{}),...patchValue});});
  const preset=el('select');el('option',null,'Aplicar predefinição…',preset).value='';for(const [id,p] of Object.entries(STYLE_PRESETS))el('option',null,p.name,preset).value=id;
  preset.onchange=()=>{const p=STYLE_PRESETS[preset.value];if(!p)return;const {name,...values}=p;mutate(d=>{d.style=normalizeStyle(values);});};label('Clima e hora',preset,sideStyle);
  const ground=el('select');el('option',null,'Do bioma',ground).value='';for(const [id,text] of Object.entries(GROUND_STYLES))el('option',null,text,ground).value=id;ground.value=st.ground||'';ground.onchange=()=>set({ground:ground.value||null});label('Chão',ground,sideStyle);
  const colorField=(text,k,fallback)=>{const c=input('color',{value:st[k]||fallback});c.onchange=()=>set({[k]:c.value});label(text,c,sideStyle);};
  colorField('Céu e névoa','sky','#182428');colorField('Tom do chão','tint','#ffffff');colorField('Cor do sol','sunColor','#ffe2b0');colorField('Cor da água','water','#3f7d8c');
  const slider=(text,k,min,max,fallback,step=.05)=>{const r=input('range',{min,max,step,value:st[k]??fallback});r.onchange=()=>set({[k]:Number(r.value)});label(text,r,sideStyle);};
  slider('Sol','sun',0,6,3);slider('Luz ambiente','ambient',0,4,2);slider('Névoa','fog',0,1,0);slider('Grama','grass',0,2,1);slider('Flores','flowers',0,2,1);
  if(flat().style)button('Limpar estilo',()=>mutate(d=>{d.style=null;}),sideStyle);
 }
 function renderProblems(){
  sideProblems.replaceChildren();el('h3',null,'Verificação',sideProblems);
  if(!problems.length){el('p','me-note','Nenhum problema encontrado.',sideProblems);return;}
  for(const p of problems)el('p','me-note '+p.level,p.text,sideProblems);
 }
 function runAnalysis(){problems=doc?[...analyze(doc,lookup),...checkCampaignMap(doc,lookup)]:[];renderProblems();}
 function scheduleAnalysis(){clearTimeout(analysisTimer);analysisTimer=setTimeout(()=>{if(doc)runAnalysis();},flat().objects.length>600?1000:350);}
 // Toda alteração é guardada sozinha, pouco depois do último toque; Salvar e Testar continuam gravando na hora.
 function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{if(doc&&dirty&&save())say('Salvo automaticamente');},AUTOSAVE);}

 // --- Salvar, testar, fechar ---
 function save(){
  if(!doc)return false;const result=library.save(doc);
  if(!result.ok){say(result.message,'error');return false;}
  clearTimeout(saveTimer);doc.updated=result.map.updated;dirty=false;say('Salvo','');syncHeader();return true;
 }
 function test(){
  if(!save())return;const id=doc.id;if(!standalone)close();play(id);
 }
 function requestClose(){
  if(!dirty||save()){close();return;}
  banner.hidden=false;banner.replaceChildren();el('span',null,'Há alterações não salvas neste mapa.',banner);
  button('Salvar e fechar',()=>{if(save())close();},banner,'pri');button('Descartar',()=>close(),banner,'danger');button('Continuar editando',()=>{banner.hidden=true;},banner);
 }
 dlg.addEventListener('close',()=>{cancelAnimationFrame(previewQueued);previewQueued=0;preview?.stop();doc=null;resolved=null;clearTimeout(analysisTimer);clearTimeout(saveTimer);closed?.();});

 return {open,close,isOpen,blocksInput:isOpen,saveNow:()=>!doc||!dirty||save(),notify:(text,kind='')=>{if(doc)say(text,kind);},metrics:()=>preview?.running()?preview.stats():null,project:(x,y,up)=>preview?.project(x,y,up),setTop:on=>preview?.setTop(on),get current(){return doc;},get selection(){return selection;}};
}
