import {CLASS_IDS,classInfo,resourceName} from './class-registry.mjs';
import {createTitlePreview,renderPortrait} from './title-preview.mjs';
import {journeySummary,classPreview} from './journey-model.mjs';
// Tela inicial da v2, portada de tMain/tOptions/tCredits em necromancer-canvas.html.
// Arte e estilos vêm de shared-title.css (gerado pelo build); aqui ficam estrutura e ligações.
const IW=1536,IH=1024;
// Retângulos dos botões sobre a arte (coordenadas da imagem), iguais aos do jogo anterior.
const RECTS={continue:[120,486,386,54],campaign:[120,408,418,58],free:[120,558,390,52],options:[122,648,352,52],credits:[122,718,352,50],maps:[122,613,352,32],exit:[122,786,348,50]};
export function createTitle(s,h){
 const $=id=>document.getElementById(id),root=$('tl'),wrap=$('tl-wrap'),cv=$('tl-cv');
 let disposePreview=null;
 let view='main',anim=0,particles=[],wasOn=false,padTime=0;
 const el=(tag,cls,html,parent)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;parent?.append(e);return e;};
 const btn=(label,fn,o={})=>{const b=el('button','tb'+(o.pri?' pri':'')+(o.dng?' dng':''),label+(o.sub?'<small>'+o.sub+'</small>':''));b.type='button';if(o.dis)b.disabled=true;else b.onclick=fn;return b;};
 function screen(build){
  disposePreview?.();disposePreview=null;wrap._lay=null;wrap.replaceChildren();wrap.className='wrap';root.classList.remove('journeys');root.classList.add('dim');build(wrap);
  const first=wrap.querySelector('button.tb:not(:disabled)');if(first)setTimeout(()=>first.focus({preventScroll:true}),30);
 }
 const menuEl=w=>el('div','menu',undefined,w),msg=t=>{const m=$('tl-msg');if(m)m.textContent=t;};
 const setSelect=(id,value)=>{const e=$(id);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
 function confirm(html,okLabel,ok,cancel){
  view='confirm';
  screen(w=>{el('div','msg',html,w).style.cssText='font-size:15px;margin:0 0 6px';const m=menuEl(w);m.append(btn('✕ CANCELAR',cancel),btn(okLabel,ok,{dng:true}));});
 }
 function brand(parent,small=false){const logo=el('div','arandu-brand'+(small?' small':''),undefined,parent);logo.textContent='ARANDU';el('span','brand-rule','◇',logo);}
 function main(){
  view='main';screen(w=>{
   w.classList.add('arandu-main');brand(w);
   const nav=el('nav','arandu-nav',undefined,w);nav.setAttribute('aria-label','Menu principal');
   const item=(key,label,fn)=>{const b=btn(label,fn);b.dataset.title=key;nav.append(b);};
   item('campaign','Novo Jogo',character);
   item('continue','Carregar',loadCharacters);
   item('options','Configurações',options);item('credits','Créditos',credits);
   item('exit','Sair',()=>confirm('Deseja sair de Arandu?','SAIR',()=>{try{window.close();}catch{}screen(x=>{el('div','pt','Até a próxima',x);el('p','msg','Você já pode fechar esta aba.',x);x.append(btn('Voltar',main));});},main));
   const tools=el('div','arandu-tools',undefined,w);
   tools.append(btn('Modo livre',()=>h.free()));if(h.maps)tools.append(btn('Editor de mapas',()=>h.maps()));
   el('p','arandu-foot','UM NOVO CAMINHO COMEÇA ALÉM DAS MURALHAS',w);
  });root.classList.remove('dim');
 }
 // Novo Personagem: mesmo esqueleto de Suas jornadas. Classes à esquerda, modelo real no centro,
 // atributos iniciais da classe e o nome à direita. O nome digitado sobrevive à troca de classe.
 const CLASS_INFO={
  necromancer:{tagline:'Vida, morte e almas',traits:'Invocações · Magias · Controle',description:'Comande uma horda de mortos-vivos, lance feitiços de ossos e domine o poder das almas. Seu poder não decide quem você será.'},
  druid:{tagline:'Raio, raiz e fera',traits:'Magias de raio · Plantas · Forma de lobo',description:'Derrube raios a distância, prenda os inimigos com raízes e, quando eles chegarem perto, torne-se o lobo.',help:'1/clique — Faísca; C — esquiva. Corrente de Raios, Raízes, Tempestade e a Forma de Lobo (F) são liberadas na árvore.'},
  archer:{tagline:'Arco e flecha',traits:'Distância · Recuo · Chuva de Flechas',description:'Mantenha os inimigos longe: flechas rápidas, um salto para trás e outra flecha antes que eles alcancem você.',help:'1/clique — Disparo; C — esquiva. Flecha Perfurante, Recuo, Chuva de Flechas e Leque são liberados na árvore.'},
  mercenary:{tagline:'Besta e pólvora',traits:'Virotes perfurantes · Bombas · Minas',description:'Cada virote pesado atravessa até três inimigos em fila. Para quem chega perto, pólvora: bombas, minas e fogo.',help:'1/clique — Virote pesado; C — esquiva. Rajada, Bomba de fragmentação, Mina de pólvora e Garrafa incendiária são liberadas na árvore.'},
  mage:{tagline:'Fogo, gelo e arcano',traits:'Feitiços à distância · Área · Teleporte',description:'Setas arcanas para o ritmo, fogo para os grupos e gelo para quem chega perto demais. Quando apertar, um passo pelo arcano.',help:'1/clique — Seta Arcana; C — esquiva. Bola de Fogo, Rajada de Gelo, Teleporte e Meteoro são liberados na árvore.'},
  warrior:{tagline:'Espada e escudo',traits:'Corpo a corpo · Estocada · Escudo',description:'Encadeie três cortes, avance com a ponta da espada e abra espaço com o escudo.',help:'1/clique — Três cortes; C — esquiva. Estocada, Golpe de escudo e outras habilidades são liberadas na árvore. Combate próximo, sem invocações iniciais.'}
 };
 function character(){
  view='character';screen(w=>{
   root.classList.add('journeys');w.classList.add('arandu-journeys','arandu-new');
   const top=el('header','journeys-top',undefined,w);el('div','journeys-logo',svg('emblem')+'<span>ARANDU</span>',top);el('h1',null,'Novo personagem',top);
   const list=el('div','journeys-list',undefined,w);list.setAttribute('role','group');list.setAttribute('aria-label','Escolha seu caminho');
   el('p','journeys-kicker','Escolha seu caminho',list);
   const stage=el('div','journeys-stage',undefined,w);
   const panel=el('form','journeys-panel',undefined,w);panel.id='character-form';panel.noValidate=true;
   const info=el('div','journey-class-info',undefined,panel);
   const field=el('div','journey-name',undefined,panel);const label=el('label',null,'Nome do personagem',field);label.htmlFor='character-name';
   const name=el('input',null,undefined,field);name.id='character-name';name.name='characterName';name.placeholder='Como você será conhecido?';name.maxLength=32;name.required=true;name.autocomplete='off';
   const error=el('p','character-error',undefined,field);error.setAttribute('role','alert');
   const actions=el('div','journeys-actions',undefined,w);
   const back=btn(svg('back')+'<span>Voltar</span>',main);back.classList.add('journey-back');
   const begin=btn(svg('play')+'<span>Iniciar jornada</span>',()=>{},{pri:true});begin.type='submit';begin.setAttribute('form','character-form');begin.classList.add('journey-start');
   actions.append(back,el('span','journeys-gap'),begin);
   let classId=null;const cards=new Map(),previews={};
   for(const id of CLASS_IDS){
    const j=previews[id]=classPreview(id),c=CLASS_INFO[id];
    const card=btn('',()=>{if(classId!==id)select(id,j);});card.classList.add('class-choice');card.dataset.class=id;card.setAttribute('aria-pressed','false');
    card.onfocus=()=>{if(classId!==id)select(id,j);};
    const face=el('span','journey-face',undefined,card),img=el('img',null,undefined,face);img.alt='';el('span','journey-badge',svg(classIcon(id)),face);
    renderPortrait(j.model).then(url=>{img.src=url;},()=>face.classList.add('empty'));
    const text=el('span','journey-text',undefined,card);el('strong',null,j.className,text);el('span',null,c.tagline,text);el('small',null,c.traits,text);
    list.append(card);cards.set(id,card);
   }
   function select(id,j){
    classId=id;const c=CLASS_INFO[id];
    for(const [key,card] of cards){card.classList.toggle('on',key===id);card.setAttribute('aria-pressed',String(key===id));}
    disposePreview?.();stage.replaceChildren();stage.removeAttribute('data-ready');stage.setAttribute('aria-label','Modelo 3D do '+j.className+(j.companions.length?' com a horda':''));
    disposePreview=createTitlePreview(stage,j.model,{companions:j.companions});
    info.replaceChildren();
    const head=el('header','journey-head',undefined,info);el('span','journey-crest',svg(classIcon(id)),head);const ht=el('div',null,undefined,head);el('h2',null,j.className,ht);el('p',null,'<span>'+c.tagline+'</span>',ht);
    el('blockquote',null,'“'+j.quote+'”',info);
    el('p','journey-description',c.description,info);
    const stats=el('dl','journey-stats',undefined,info);el('span','journey-label','Atributos no nível 1',stats);
    for(const st of j.stats){const row=el('div',null,undefined,stats);el('dt',null,svg(st.id==='mp'?(resourceName(id)==='mana'?'mana':'vigor'):st.id==='hp'?'heart':st.id),row).append(st.label);el('dd',null,st.value,row);}
    if(c.help)el('p','class-help',c.help,info);
   }
   panel.onsubmit=e=>{e.preventDefault();const value=name.value.trim();if(!value){error.textContent='Escolha um nome para iniciar sua jornada.';name.focus();return;}const result=h.createCharacter(value,classId);if(!result.ok)error.textContent=result.message;};
   name.oninput=()=>{error.textContent='';};
   select('necromancer',previews.necromancer);
  });
 }
 // Ícones em traço dourado (24×24) da tela de jornadas.
 const ICON={
  emblem:'<path d="M12 1.5 18.5 12 12 22.5 5.5 12Z"/><path d="M12 5v14M8.5 9.5c2 1 5 1 7 0M9.5 13.5h5M3 12h2.5M18.5 12H21"/><circle cx="12" cy="12" r="2.2"/>',
  pin:'<path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11Z"/><circle cx="12" cy="10" r="2.2"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  heart:'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" fill="currentColor"/>',
  mana:'<path d="M12 3.5s6 6.6 6 10.6a6 6 0 0 1-12 0C6 10.1 12 3.5 12 3.5Z" fill="currentColor"/>',
  vigor:'<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.6 3.4-5.6 3.9-9.4 2.4 1.5 3.4 3.7 3.1 5.8 1.2-.6 2-1.8 2.2-3.2 2 1.9 3.8 4.3 3.8 6.8 0 3.5-2.6 6.1-6.5 6.1Z" fill="currentColor"/>',
  damage:'<path d="m4 4 9.5 9.5M20 4l-9.5 9.5M3.5 15.5l5 5M15.5 20.5l5-5M6 18l-2.5 2.5M18 18l2.5 2.5"/>',
  defense:'<path d="M12 3 19 6v5.5c0 4.5-3 7.6-7 9.5-4-1.9-7-5-7-9.5V6Z" fill="currentColor" fill-opacity=".85"/>',
  skull:'<path d="M12 3.5c-4.1 0-7 2.8-7 6.6 0 2.3 1.1 3.8 2.4 4.7v2.7h9.2v-2.7c1.3-.9 2.4-2.4 2.4-4.7 0-3.8-2.9-6.6-7-6.6Z"/><circle cx="9.2" cy="10.6" r="1.6" fill="currentColor"/><circle cx="14.8" cy="10.6" r="1.6" fill="currentColor"/><path d="M10 17.5v2.5M12 17.5v2.5M14 17.5v2.5"/>',
  leaf:'<path d="M5 19C5 10 11 5 19 5c0 8-6 14-14 14ZM5 19l9-9M10 16l-3-1M13 13l-1-3"/>',
  staff:'<path d="M6.5 20.5 15 9.5M13.5 4.5l3.5.8.8 3.5-2.6 1.9-2.9-2.2ZM4 15.5l3.5 1M3 12l2.6 2.6M18.5 12.5c.8 2-.2 3.8-2 4.6"/>',
  bow:'<path d="M7 3.5c6.5 2 10.5 8 10.5 17M7 3.5v17M7 20.5h10.5M3.5 12h15M15.5 9.5 18.5 12l-3 2.5"/>',
  crossbow:'<path d="M3.5 9c5-3.8 12-3.8 17 0M12 5.5v14M9.5 19.5h5M3.5 9l8.5 4 8.5-4M12 3l-1.8 2.5h3.6Z"/>',
  swords:'<path d="m5 4 10 10M19 4 9 14M7.5 16.5 4 20M16.5 16.5 20 20M3.5 13.5l7 7M20.5 13.5l-7 7"/>',
  plus:'<path d="M12 6v12M6 12h12"/>',
  back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
  trash:'<path d="M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 13.5h9l1-13.5M10 10v7M14 10v7"/>',
  play:'<path d="M7 4.5 19 12 7 19.5Z" fill="currentColor" fill-opacity=".25"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'
 };
 const svg=(name,cls='icon')=>'<svg class="'+cls+'" viewBox="0 0 24 24" aria-hidden="true">'+ICON[name]+'</svg>';
 const classIcon=id=>classInfo(id).icon;
 // Suas jornadas: lista à esquerda, o modelo real (com a horda do Necromante) no centro e o resumo à direita.
 // Clicar seleciona; Continuar ou duplo clique carrega a jornada.
 function loadCharacters(selectedId){
  view='load';screen(w=>{
   root.classList.add('journeys');w.classList.add('arandu-journeys');
   const top=el('header','journeys-top',undefined,w);el('div','journeys-logo',svg('emblem')+'<span>ARANDU</span>',top);el('h1',null,'Suas jornadas',top);
   const list=el('div','journeys-list',undefined,w);list.setAttribute('role','group');list.setAttribute('aria-label','Personagens salvos');
   const stage=el('div','journeys-stage',undefined,w),panel=el('section','journeys-panel',undefined,w);panel.setAttribute('aria-live','polite');
   const actions=el('div','journeys-actions',undefined,w),status=el('p','journeys-error',undefined,w);status.setAttribute('role','alert');
   const result=h.characters(),journeys=[];
   if(!result.ok)el('p','msg',undefined,list).textContent=result.message;
   else for(const save of result.characters){try{journeys.push(journeySummary(save.id,result.saves.get(save.id)));}catch(error){console.warn('Jornada '+save.id+': '+error.message);}}
   if(result.ok&&!journeys.length)el('p','msg','Nenhuma jornada salva. Seu primeiro caminho espera por você.',list);
   let selected=null;const cards=new Map();
   for(const j of journeys){
    const card=btn('',()=>{if(selected!==j)select(j);});card.classList.add('save-character');card.dataset.id=j.id;card.dataset.class=j.classId;card.setAttribute('aria-pressed','false');card.ondblclick=()=>play();
    card.onfocus=()=>{if(selected!==j)select(j);};
    const face=el('span','journey-face',undefined,card),img=el('img',null,undefined,face);img.alt='';el('span','journey-badge',svg(classIcon(j.classId)),face);
    renderPortrait(j.model).then(url=>{img.src=url;},()=>face.classList.add('empty'));
    const text=el('span','journey-text',undefined,card);el('strong',null,undefined,text).textContent=j.name;
    el('span','journey-class',undefined,text).textContent=j.className+' · Nível '+j.level;
    el('small',null,svg('pin'),text).append(j.location.name);el('small',null,svg('clock'),text).append(j.time);
    list.append(card);cards.set(j.id,card);
   }
   const fresh=btn('',character);fresh.classList.add('journey-new');el('span','journey-plus',svg('plus'),fresh);const ft=el('span','journey-text',undefined,fresh);el('strong',null,'Novo Personagem',ft);el('span',null,'Crie uma nova jornada',ft);list.append(fresh);
   const back=btn(svg('back')+'<span>Voltar</span>',main);back.classList.add('journey-back');
   const remove=btn(svg('trash')+'<span>Excluir</span>',()=>{if(!selected)return;const j=selected;confirm('Excluir esta jornada? Todo o progresso deste personagem será perdido.','EXCLUIR',()=>{const r=h.deleteCharacter(j.id);loadCharacters();if(!r.ok)wrap.querySelector('[role=alert]').textContent=r.message;},()=>loadCharacters(j.id));const label=el('p','msg',undefined,wrap);label.textContent=j.name;},{dng:true});
   const go=btn(svg('play')+'<span>Continuar</span>',()=>play(),{pri:true});go.dataset.journey='continue';
   const opts=btn(svg('gear')+'<span>Configurações</span>',()=>options(()=>loadCharacters(selected?.id)));
   actions.append(back,el('span','journeys-gap'),remove,go,opts);
   function play(){if(!selected)return;const r=h.loadCharacter(selected.id);if(!r.ok)status.textContent=r.message;}
   function select(j){
    selected=j;for(const [id,c] of cards){c.classList.toggle('on',id===j.id);c.setAttribute('aria-pressed',String(id===j.id));}
    disposePreview?.();stage.replaceChildren();stage.removeAttribute('data-ready');stage.setAttribute('aria-label','Modelo 3D de '+j.name+(j.companions.length?' com a horda':''));
    disposePreview=createTitlePreview(stage,j.model,{companions:j.companions});
    panel.replaceChildren();
    const head=el('header','journey-head',undefined,panel);el('span','journey-crest',svg(classIcon(j.classId)),head);const ht=el('div',null,undefined,head);el('h2',null,undefined,ht).textContent=j.name;el('p',null,'<span>'+j.className+'</span><span>Nível '+j.level+'</span>',ht);
    el('blockquote',null,undefined,panel).textContent='“'+j.quote+'”';
    const stats=el('dl','journey-stats',undefined,panel);
    for(const st of j.stats){const row=el('div',null,undefined,stats);el('dt',null,svg(st.id==='mp'?(resourceName(j.classId)==='mana'?'mana':'vigor'):st.id==='hp'?'heart':st.id),row).append(st.label);el('dd',null,undefined,row).textContent=st.value;}
    const xp=el('div','journey-xp',undefined,panel);el('span','journey-label','Progresso',xp);
    const track=el('div','journey-track',undefined,xp);el('span',null,undefined,track).style.width=Math.round(j.progress*100)+'%';el('span','journey-level',String(j.level),xp);
    el('small',null,j.next?j.exp.toLocaleString('pt-BR')+' / '+j.next.toLocaleString('pt-BR')+' XP':'Nível máximo',xp);
    const where=el('div','journey-where',undefined,panel);el('span','journey-label',svg('pin')+'Localização',where);el('strong',null,undefined,where).textContent=j.location.name;el('small',null,undefined,where).textContent=j.location.detail;
    remove.disabled=false;go.disabled=false;
   }
   const initial=journeys.find(j=>j.id===selectedId)||journeys[0];
   if(initial)select(initial);else{remove.disabled=true;go.disabled=true;panel.hidden=true;stage.hidden=true;}
  });
 }
 function credits(){
  view='credits';
  screen(w=>{el('div','pt','CRÉDITOS',w);const c=el('div','card','<b>ARANDU</b><br>Um jogo da <b>InnovareTI</b><br><br>Direção e design: InnovareTI<br>Código: HTML5, Canvas 2D e Three.js (v2 em 3D)<br>Modelos 3D: Blender<br>Música da tela inicial: “The Shadow’s Oath”<br>Ilustrações e HQs: arte gerada por IA sob direção da InnovareTI<br><br><span style="color:#777">Obrigado por jogar.</span>',w);c.style.lineHeight='1.9';menuEl(w).append(btn('← VOLTAR',main));});
 }
 function options(back=main){
  view='options';const d=h.info();
  screen(w=>{
   el('div','pt','OPÇÕES',w);const m=menuEl(w),card=el('div','card',undefined,m);card.style.margin='0';
   const row=(label,id,options,current)=>{const r=el('div','row','<span>'+label+'</span>',card);const sel=el('select',null,options.map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join(''),r);sel.id=id;sel.value=current;sel.onchange=()=>setSelect(id==='o-q'?'quality':'ground',sel.value);return r;};
   row('Gráficos','o-q',[['high','Alta · sombras'],['low','Baixa · sem sombras (mais FPS)']],$('quality').value);
   el('div','row','',card).style.height='8px';
   row('Ambiente','o-g',[['dark','Pedra escura'],['light','Pedra clara']],$('ground').value);
   const sound=h.audio;
   if(sound){
    el('div','row','',card).style.height='8px';
    const slider=(label,get,set)=>{const r=el('div','row','<span>'+label+'</span>',card),i=el('input',null,undefined,r);i.type='range';i.min=0;i.max=100;i.value=Math.round(get()*100);i.setAttribute('aria-label',label);i.oninput=()=>set(i.value/100);return i;};
    slider('Volume',()=>sound.volume,v=>sound.setVolume(v));slider('Música',()=>sound.music,v=>sound.setMusicVolume(v));
   }
   el('div','msg','Calibração de controle entra no acabamento (E11).',card).style.cssText='font-size:11px;margin-top:10px;color:#776a8f';
   if(sound)m.append(btn(sound.muted?'🔇 SOM: DESLIGADO':'🔊 SOM: LIGADO',()=>{sound.toggleMute();options();}));
   m.append(btn('⛶ TELA CHEIA',()=>{try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}catch{}}));
   m.append(btn('↻ ATUALIZAR MODELOS',()=>location.reload()));
   el('div','msg','Reabre o HTML atualizado. Salve mapas em edição antes de atualizar.',m);
   m.append(btn('📂 IMPORTAR SAVE',()=>h.importFile()));
   m.append(btn('💾 EXPORTAR SAVE',()=>{msg(h.exportSave()?'✓ Save exportado.':'Nenhum save para exportar.');},{dis:!d}));
   m.append(btn('← VOLTAR',()=>back()));el('div','msg',undefined,w).id='tl-msg';
  });
 }
 function loop(){
  if(!root.classList.contains('on')){anim=0;return;}
  const w=cv.clientWidth,hh=cv.clientHeight;if(cv.width!==w||cv.height!==hh){cv.width=w;cv.height=hh;}
  const g=cv.getContext('2d');g.clearRect(0,0,w,hh);
  while(particles.length<70)particles.push({x:Math.random()*w,y:Math.random()*hh,v:10+Math.random()*30,r:.8+Math.random()*2.2,ph:Math.random()*6.28,c:Math.random()<.6?'255,176,98':'204,98,65'});
  g.globalCompositeOperation='lighter';
  for(const p of particles){p.y-=p.v*.016;p.x+=Math.sin(p.ph+=.012)*.35;if(p.y<-10){p.y=hh+10;p.x=Math.random()*w;}
   const gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*5);gr.addColorStop(0,'rgba('+p.c+',.7)');gr.addColorStop(1,'rgba('+p.c+',0)');g.fillStyle=gr;g.fillRect(p.x-p.r*5,p.y-p.r*5,p.r*10,p.r*10);}
  anim=requestAnimationFrame(loop);
 }
 function set(on){
  root.classList.toggle('on',on);root.classList.toggle('art',on);document.body.classList.toggle('titling',on);
  if(on&&!wasOn)main();if(!on){disposePreview?.();disposePreview=null;}
  if(on&&!anim)anim=requestAnimationFrame(loop);
  wasOn=on;
 }
 window.addEventListener('resize',()=>{if(view==='main'&&wrap._lay)wrap._lay();});
 const isOpen=()=>root.classList.contains('on');
 function update(){const on=s.scene==='menu';if(on!==isOpen()||(on&&!wasOn))set(on);}
 function handleControls(c){
  const items=[...wrap.querySelectorAll('button:not(:disabled),select')].filter(e=>e.getClientRects().length),now=performance.now();
  if(Math.hypot(c.x,c.y)>.5&&now-padTime>180){padTime=now;const i=items.indexOf(document.activeElement),dir=(Math.abs(c.y)>Math.abs(c.x)?c.y:c.x)>0?1:-1;items[(i+dir+items.length)%items.length]?.focus();}
  if(c.confirm){const t=document.activeElement;if(t?.tagName==='BUTTON')t.click();else items[0]?.focus();}
  if(c.pause&&view!=='main')main();
 }
 root.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&view!=='main'){e.preventDefault();main();return;}
  if(e.target.matches('input,textarea'))return;
  if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
  const items=[...wrap.querySelectorAll('button:not(:disabled)')].filter(x=>x.getClientRects().length),i=items.indexOf(document.activeElement);
  if(!items.length)return;e.preventDefault();items[(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();
 });
 return {update,handleControls,blocksInput:()=>isOpen()&&!document.querySelector('dialog[open]'),show:main,view:()=>view};
}
