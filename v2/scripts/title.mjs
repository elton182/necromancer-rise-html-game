// Tela inicial da v2, portada de tMain/tOptions/tCredits em necromancer-canvas.html.
// Arte e estilos vêm de shared-title.css (gerado pelo build); aqui ficam estrutura e ligações.
const IW=1536,IH=1024;
// Retângulos dos botões sobre a arte (coordenadas da imagem), iguais aos do jogo anterior.
const RECTS={continue:[120,486,386,54],campaign:[120,408,418,58],free:[120,558,390,52],options:[122,648,352,52],credits:[122,718,352,50],maps:[122,613,352,32],exit:[122,786,348,50]};
export function createTitle(s,h){
 const $=id=>document.getElementById(id),root=$('tl'),wrap=$('tl-wrap'),cv=$('tl-cv');
 let view='main',anim=0,particles=[],wasOn=false,padTime=0;
 const el=(tag,cls,html,parent)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;parent?.append(e);return e;};
 const btn=(label,fn,o={})=>{const b=el('button','tb'+(o.pri?' pri':'')+(o.dng?' dng':''),label+(o.sub?'<small>'+o.sub+'</small>':''));b.type='button';if(o.dis)b.disabled=true;else b.onclick=fn;return b;};
 function screen(build){
  wrap.replaceChildren();wrap.className='wrap';root.classList.add('dim');build(wrap);
  const first=wrap.querySelector('button.tb:not(:disabled)');if(first)setTimeout(()=>first.focus({preventScroll:true}),30);
 }
 const menuEl=w=>el('div','menu',undefined,w),msg=t=>{const m=$('tl-msg');if(m)m.textContent=t;};
 const setSelect=(id,value)=>{const e=$(id);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
 function confirm(html,okLabel,ok,cancel){
  view='confirm';
  screen(w=>{el('div','msg',html,w).style.cssText='font-size:15px;margin:0 0 6px';const m=menuEl(w);m.append(btn('✕ CANCELAR',cancel),btn(okLabel,ok,{dng:true}));});
 }
 function main(){
  view='main';const d=h.info();
  screen(w=>{
   w.classList.add('tmw');
   const mk=(key,label,fn,o={})=>{const b=btn(label,fn,o);b.classList.add('tm');b.dataset.title=key;b.setAttribute('aria-label',label);b._r=RECTS[key];w.append(b);return b;};
   mk('continue','CONTINUAR',()=>h.resume(),{dis:!d});
   mk('campaign','NOVA CAMPANHA',()=>{if(d?.campaign)confirm('Já existe uma campanha (Nível '+d.level+').<br>Uma nova campanha <b>reinicia o personagem e a campanha</b>; o save atual da v2 fica guardado como cópia anterior.','REINICIAR E COMEÇAR',()=>{h.newCampaign();},main);else h.startCampaign();});
   mk('free','MODO LIVRE',()=>{if(d?.campaign)confirm('Abrir o <b>Modo Livre</b> com o personagem da campanha?<br>O progresso da campanha permanece salvo.','ABRIR',()=>h.free(),main);else h.free();});
   // Fora da arte da tela inicial: o texto fica visível (as demais opções já vêm desenhadas).
   if(h.maps)mk('maps','🗺 EDITOR DE MAPAS',()=>h.maps()).classList.add('tm-text');
   mk('options','OPÇÕES',options);mk('credits','CRÉDITOS',credits);
   mk('exit','SAIR',()=>confirm('Sair do jogo?','SAIR',()=>{try{window.close();}catch{}setTimeout(()=>screen(x=>{el('div','pt','ATÉ A PRÓXIMA',x);el('div','msg','Você já pode fechar esta aba.',x);menuEl(x).append(btn('← VOLTAR AO MENU',main));}),150);},main));
   const c=el('div','tcard',d?'<b>'+(d.campaign?'Campanha — Ato I (fase '+Math.min(4,d.unlocked||1)+'/4)':'Modo Livre')+'</b><br>Nível '+d.level+'<br>🪙 '+d.gold:'<span style="color:#777;font-style:italic">Nenhum save neste navegador.</span>',w);c.id='tl-card';
   el('div','tmsg',undefined,w).id='tl-msg';
   w._lay=()=>{const W=innerWidth,H=innerHeight,k=Math.min(H/860,W/900),ox=W>IW*k?(W-IW*k)/2:0;root.style.backgroundSize=IW*k+'px '+IH*k+'px';root.style.backgroundPosition=ox+'px 0px';
    for(const b of w.querySelectorAll('button.tm')){const r=b._r;b.style.left=ox+r[0]*k+'px';b.style.top=r[1]*k+'px';b.style.width=r[2]*k+'px';b.style.height=r[3]*k+'px';}};
   w._lay();
  });
  root.classList.remove('dim');
 }
 function credits(){
  view='credits';
  screen(w=>{el('div','pt','CRÉDITOS',w);const c=el('div','card','<b>Zephyr — O Despertar do Necromante</b><br>Um jogo da <b>InnovareTI</b><br><br>Direção e design: InnovareTI<br>Código: HTML5, Canvas 2D e Three.js (v2 em 3D)<br>Modelos 3D: Blender<br>Música da tela inicial: “The Shadow’s Oath”<br>Ilustrações e HQs: arte gerada por IA sob direção da InnovareTI<br><br><span style="color:#777">Obrigado por jogar.</span>',w);c.style.lineHeight='1.9';menuEl(w).append(btn('← VOLTAR',main));});
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
   m.append(btn('📂 IMPORTAR SAVE',()=>h.importFile()));
   m.append(btn('💾 EXPORTAR SAVE',()=>{msg(h.exportSave()?'✓ Save exportado.':'Nenhum save para exportar.');},{dis:!d}));
   m.append(btn('← VOLTAR',main));el('div','msg',undefined,w).id='tl-msg';
  });
 }
 function loop(){
  if(!root.classList.contains('on')){anim=0;return;}
  const w=cv.clientWidth,hh=cv.clientHeight;if(cv.width!==w||cv.height!==hh){cv.width=w;cv.height=hh;}
  const g=cv.getContext('2d');g.clearRect(0,0,w,hh);
  while(particles.length<70)particles.push({x:Math.random()*w,y:Math.random()*hh,v:10+Math.random()*30,r:.8+Math.random()*2.2,ph:Math.random()*6.28,c:Math.random()<.6?'120,255,190':'170,110,255'});
  g.globalCompositeOperation='lighter';
  for(const p of particles){p.y-=p.v*.016;p.x+=Math.sin(p.ph+=.012)*.35;if(p.y<-10){p.y=hh+10;p.x=Math.random()*w;}
   const gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*5);gr.addColorStop(0,'rgba('+p.c+',.7)');gr.addColorStop(1,'rgba('+p.c+',0)');g.fillStyle=gr;g.fillRect(p.x-p.r*5,p.y-p.r*5,p.r*10,p.r*10);}
  anim=requestAnimationFrame(loop);
 }
 function set(on){
  root.classList.toggle('on',on);root.classList.toggle('art',on);document.body.classList.toggle('titling',on);
  if(on&&!wasOn)main();
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
  if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
  const items=[...wrap.querySelectorAll('button:not(:disabled)')].filter(x=>x.getClientRects().length),i=items.indexOf(document.activeElement);
  if(!items.length)return;e.preventDefault();items[(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();
 });
 return {update,handleControls,blocksInput:()=>isOpen()&&!document.querySelector('dialog[open]'),show:main,view:()=>view};
}
