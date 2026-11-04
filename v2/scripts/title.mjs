import {createTitlePreview} from './title-preview.mjs';
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
  disposePreview?.();disposePreview=null;wrap._lay=null;wrap.replaceChildren();wrap.className='wrap';root.classList.add('dim');build(wrap);
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
 function character(){
  view='character';screen(w=>{
   w.classList.add('arandu-character');brand(w,true);
   const head=el('header','character-heading',undefined,w);el('small',null,'NOVO JOGO',head);el('h1',null,'Escolha seu caminho',head);
   const layout=el('div','character-layout',undefined,w),portrait=el('div','character-preview',undefined,layout);
   portrait.setAttribute('aria-label','Modelo 3D animado do Necromante');el('div','character-rune','◇',portrait);
   disposePreview=createTitlePreview(portrait);
   const panel=el('form','character-details',undefined,layout);
   let classId='necromancer';
   const choice=btn('☠  Necromante',()=>{});choice.classList.add('class-choice');choice.setAttribute('aria-pressed','true');panel.append(choice);
   const warrior=btn('⚔ Guerreiro / Soldado',()=>{classId='warrior';classHelp.hidden=false;panel.querySelector('h2').textContent='Aço, coragem e disciplina';panel.querySelector('.character-kicker').textContent='ESPADA E ESCUDO';panel.querySelector('.character-description').textContent='Encadeie três cortes, avance com a ponta da espada e abra espaço com o escudo.';panel.querySelector('.class-traits').textContent='Corpo a corpo · Estocada · Escudo';choice.setAttribute('aria-pressed','false');warrior.setAttribute('aria-pressed','true');disposePreview?.();disposePreview=createTitlePreview(portrait,'warrior');portrait.setAttribute('aria-label','Modelo 3D do Guerreiro');});warrior.classList.add('class-choice');warrior.setAttribute('aria-pressed','false');panel.append(warrior);choice.onclick=()=>{classId='necromancer';classHelp.hidden=true;portrait.setAttribute('aria-label','Modelo 3D animado do Necromante');panel.querySelector('h2').textContent='O poder além do fim';panel.querySelector('.character-kicker').textContent='VIDA, MORTE E ALMAS';panel.querySelector('.character-description').textContent='Comande uma horda de mortos-vivos e lance feitiços de ossos.';panel.querySelector('.class-traits').textContent='Invocações · Magias · Controle';choice.setAttribute('aria-pressed','true');warrior.setAttribute('aria-pressed','false');disposePreview?.();disposePreview=createTitlePreview(portrait);};
   const classHelp=el('p','class-help','Guerreiro: 1/clique — Três cortes; C — esquiva. Estocada, Golpe de escudo e outras habilidades são liberadas na árvore. Combate próximo, sem invocações iniciais.',panel);classHelp.hidden=true;
   el('small','character-kicker','VIDA, MORTE E ALMAS',panel);el('h2',null,'O poder além do fim',panel);
   el('p','character-description','Comande uma horda de mortos-vivos, lance feitiços de ossos e domine o poder das almas. Seu poder não decide quem você será.',panel);
   const traits=el('div','class-traits',undefined,panel);for(const t of ['Invocações','Magias','Controle'])el('span',null,t,traits);
   const label=el('label',null,'Nome do personagem',panel);label.htmlFor='character-name';
   const name=el('input',null,undefined,panel);name.id='character-name';name.name='characterName';name.placeholder='Como você será conhecido?';name.maxLength=32;name.required=true;name.autocomplete='off';
   const error=el('p','character-error',undefined,panel);error.setAttribute('role','alert');
   const actions=el('div','character-actions',undefined,panel);actions.append(btn('Voltar',main));
   const begin=btn('Iniciar jornada  →',()=>{});begin.type='submit';begin.classList.add('journey-start');actions.append(begin);
   panel.onsubmit=e=>{e.preventDefault();const value=name.value.trim();if(!value){error.textContent='Escolha um nome para iniciar sua jornada.';name.focus();return;}const result=h.createCharacter(value,classId);if(!result.ok)error.textContent=result.message;};
  });
 }
 function loadCharacters(){
  view='load';screen(w=>{
   w.classList.add('arandu-load');brand(w,true);el('h1','pt','Suas jornadas',w);
   const result=h.characters(),list=el('div','save-list',undefined,w);
   if(!result.ok)el('p','msg',result.message,list);
   else if(!result.characters.length)el('p','msg','Nenhuma jornada salva. Seu primeiro caminho espera por você.',list);
   else for(const save of result.characters){const b=btn('',()=>{const r=h.loadCharacter(save.id);if(!r.ok)status.textContent=r.message;});b.classList.add('save-character');const title=el('strong',null,undefined,b);title.textContent=save.name;el('span',null,(save.classId==='warrior'?'Guerreiro':'Necromante')+' · Nível '+save.level,b);el('small',null,save.savedAt?new Date(save.savedAt).toLocaleString('pt-BR'):'Jornada recém-iniciada',b);const row=el('div','save-character-row',undefined,list);row.append(b);const remove=btn('Excluir',()=>{confirm('Excluir esta jornada? Todo o progresso deste personagem será perdido.','EXCLUIR',()=>{const r=h.deleteCharacter(save.id);loadCharacters();if(!r.ok)wrap.querySelector('[role=alert]').textContent=r.message;},loadCharacters);const label=el('p','msg',undefined,wrap);label.textContent=save.name;},{dng:true});remove.setAttribute('aria-label','Excluir '+save.name);row.append(remove);}
   const status=el('p','character-error',undefined,w);status.setAttribute('role','alert');const actions=el('div','character-actions',undefined,w);actions.append(btn('Voltar',main),btn('Novo Jogo',character));
  });
 }
 function credits(){
  view='credits';
  screen(w=>{el('div','pt','CRÉDITOS',w);const c=el('div','card','<b>ARANDU</b><br>Um jogo da <b>InnovareTI</b><br><br>Direção e design: InnovareTI<br>Código: HTML5, Canvas 2D e Three.js (v2 em 3D)<br>Modelos 3D: Blender<br>Música da tela inicial: “The Shadow’s Oath”<br>Ilustrações e HQs: arte gerada por IA sob direção da InnovareTI<br><br><span style="color:#777">Obrigado por jogar.</span>',w);c.style.lineHeight='1.9';menuEl(w).append(btn('← VOLTAR',main));});
 }
 function options(){
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
   m.append(btn('← VOLTAR',main));el('div','msg',undefined,w).id='tl-msg';
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
