// Painel do Laboratório: entrada pelo Relicário (aba Laboratório) e painel flutuante dentro da cena, sem pausar o jogo.
import {actionName} from './actions.mjs';
import {catalog,TEST_DURATIONS} from './lab-model.mjs';
import {isLab,setViewer,setClip,scrub,playAll,setDummies,moveDummies,resetTest,setOptions,meterStats,history,MAX_DUMMIES} from './lab.mjs';
const fmt=(n,d=0)=>Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
export function createLabPanel(s,{view,show,enter,exit,focus}){
 const w=s.world;
 const node=(tag,text,parent,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;parent?.append(e);return e;};
 const button=(text,fn,parent,cls='btn')=>{const b=node('button',text,parent,cls);b.type='button';b.onclick=()=>{fn();focus();};return b;};
 const labelled=(text,control,parent)=>{const l=node('label',undefined,parent,'lab-row');node('span',text,l);l.append(control);return l;};
 const check=(text,fn,parent)=>{const l=node('label',undefined,parent,'lab-check'),c=node('input',undefined,l);c.type='checkbox';c.onchange=()=>{fn(c.checked);focus();};node('span',text,l);return c;};

 const panel=node('aside',undefined,document.body,'lab-panel');panel.id='lab-panel';panel.hidden=true;panel.setAttribute('aria-label','Laboratório');
 const head=node('header',undefined,panel);node('strong','LABORATÓRIO',head);button('Sair',()=>exit(),head,'btn lab-exit');
 const tabs=node('nav',undefined,panel,'lab-tabs'),pages={};let tab='models';
 for(const [id,title] of [['models','Modelos'],['dps','Boneco e DPS']]){const b=button(title,()=>select(id),tabs,'btn lab-tab');b.dataset.labTab=id;pages[id]={tab:b,body:node('section',undefined,panel,'lab-page')};}
 function select(id){tab=id;for(const [key,p] of Object.entries(pages)){p.body.hidden=key!==id;p.tab.classList.toggle('on',key===id);}}

 // --- Modelos: escolher o modelo e ver cada clipe de animação ---
 const m=pages.models.body;
 const modelSel=node('select',undefined,m);modelSel.setAttribute('aria-label','Modelo');
 const none=node('option','— escolha um modelo —',modelSel);none.value='';
 for(const g of catalog(Object.keys(view.models))){const og=node('optgroup',undefined,modelSel);og.label=g.group;for(const it of g.items){const o=node('option',it.label,og);o.value=it.id;}}
 const clipBox=node('div',undefined,m,'lab-clips'),info=node('p',undefined,m,'lab-info');
 const playBtn=button('⏸ Pausar',()=>{const v=w.lab?.viewer;if(!v)return;if(!v.playing&&!v.loop&&v.time>=v.duration)v.time=0;v.sequence=false;v.playing=!v.playing;},m);
 const allBtn=button('▶▶ Todas em sequência',()=>playAll(w),m);
 const scrubber=node('input',undefined,m);scrubber.type='range';scrubber.min=0;scrubber.max=1000;scrubber.value=0;scrubber.setAttribute('aria-label','Quadro da animação');let scrubbing=false;
 scrubber.addEventListener('pointerdown',()=>{scrubbing=true;});scrubber.addEventListener('pointerup',()=>{scrubbing=false;focus();});scrubber.oninput=()=>scrub(w,Number(scrubber.value)/1000);
 const loopChk=check('Repetir clipe',on=>{const v=w.lab?.viewer;if(v){v.loop=on;v.sequence=false;if(on)v.playing=true;}},m);loopChk.checked=true;
 const speed=node('select');for(const x of [.1,.25,.5,1,1.5,2]){const o=node('option',x+'×',speed);o.value=x;}speed.value=1;speed.onchange=()=>{const v=w.lab?.viewer;if(v)v.speed=Number(speed.value);focus();};labelled('Velocidade',speed,m);
 const heading=node('input');heading.type='range';heading.min=0;heading.max=360;heading.value=45;heading.oninput=()=>{const v=w.lab?.viewer;if(v){v.spin=false;spinChk.checked=false;v.heading=Number(heading.value)*Math.PI/180;}};heading.onchange=focus;labelled('Girar',heading,m);
 const spinChk=check('Girar sozinho',on=>{const v=w.lab?.viewer;if(v)v.spin=on;},m);
 const followChk=check('Câmera acompanha o modelo',on=>{if(w.lab)w.lab.focus=on;},m);followChk.checked=true;
 const zoom=node('div',undefined,m,'lab-row');button('Aproximar',()=>view.zoom(-300),zoom);button('Afastar',()=>view.zoom(300),zoom);button('Remover modelo',()=>{setViewer(w,null);modelSel.value='';renderClips();},zoom);
 function renderClips(){
  const v=w.lab?.viewer;clipBox.replaceChildren();
  if(!v){info.textContent='Escolha um inimigo, chefe, lacaio ou o jogador para ver cada animação.';return;}
  for(const c of v.clips){const b=button(c.name+' · '+fmt(c.duration,2)+' s',()=>{setClip(w,c.name);v.sequence=false;renderClips();},clipBox,'btn lab-clip');b.classList.toggle('on',c.name===v.clip);b.dataset.clip=c.name;}
 }
 modelSel.onchange=()=>{
  const id=modelSel.value;if(!id){setViewer(w,null);renderClips();focus();return;}
  const asset=view.assets?.[id]||{},clips=view.models[id].animations.map(c=>({name:c.name,duration:asset.durations?.[c.name]||c.duration})).sort((a,b)=>a.name.localeCompare(b.name));
  setViewer(w,id,clips);const v=w.lab.viewer;v.loop=loopChk.checked;v.speed=Number(speed.value);v.spin=spinChk.checked;v.heading=Number(heading.value)*Math.PI/180;renderClips();focus();
 };

 // --- Boneco e DPS: medidor, testes cronometrados e comparação ---
 const d=pages.dps.body;
 node('p','Os acertos de Zephyr, das magias e da horda no boneco de madeira são contados aqui. Use o seu build atual: troque Grimório, equipamentos e horda pelos atalhos e compare os testes.',d,'lab-info');
 const count=node('select');for(let i=1;i<=MAX_DUMMIES;i++){const o=node('option',String(i),count);o.value=i;}count.onchange=()=>{setDummies(w,Number(count.value));focus();};labelled('Bonecos',count,d);
 const where=node('div',undefined,d,'lab-row');button('Mover para a mira',()=>moveDummies(w,w.aim),where);
 const status=node('p',undefined,d,'lab-status'),grid=node('dl',undefined,d,'lab-stats'),cells={};
 for(const [key,title] of [['average','DPS médio'],['recent','Últimos 5 s'],['peak','Pico em 1 s'],['total','Dano total'],['hits','Golpes'],['elapsed','Tempo']]){const box=node('div',undefined,grid);node('dt',title,box);cells[key]=node('dd','—',box);}
 const rows=node('div',undefined,d,'lab-by');
 const duration=node('select');for(const t of TEST_DURATIONS){const o=node('option',t?t+' s':'Livre (sem tempo)',duration);o.value=t;}labelled('Teste',duration,d);
 const name=node('input');name.type='text';name.maxLength=40;name.placeholder='Nome do teste (ex.: Build zumbis)';name.setAttribute('aria-label','Nome do teste');d.append(name);
 const run=node('div',undefined,d,'lab-row');
 const startBtn=button('Iniciar teste',()=>{const t=Number(duration.value);if(!t){resetTest(w,0);return;}resetTest(w,t);w.lab.testLabel=name.value.trim()||defaultLabel();},run);
 button('Zerar medidor',()=>resetTest(w,0),run);
 const mana=check('Mana infinita',on=>setOptions(w,{infiniteMana:on}),d),cd=check('Sem recargas',on=>setOptions(w,{noCooldown:on}),d);
 node('p','Iniciar um teste enche a mana e zera as recargas. A contagem começa no primeiro golpe e o resultado entra na lista abaixo.',d,'lab-info');
 const shortcuts=node('div',undefined,d,'lab-row');for(const [text,id] of [['Grimório','skills'],['Equipamentos','equipment'],['Horda','horde']])button(text,()=>show(id),shortcuts);
 node('h3','Testes concluídos',d);const list=node('div',undefined,d,'lab-history');button('Limpar lista',()=>{history.length=0;renderHistory();},d);
 const defaultLabel=()=>'Nv '+s.save.character.level+' · '+((w.army?.loadout||[]).filter(x=>x!=='empty').map(actionName).join(', ')||'sem habilidades');
 let shown=-1;
 function renderHistory(){
  shown=history.length;list.replaceChildren();if(!history.length){node('p','Nenhum teste concluído.',list,'lab-info');return;}
  const base=history[0].dps;
  for(const h of history){const row=node('div',undefined,list,'lab-result');node('b','#'+h.id+' '+h.label,row);const diff=h===history[0]||!base?'':' ('+(h.dps>=base?'+':'')+fmt((h.dps/base-1)*100,1)+'% vs #1)';node('span',fmt(h.dps,1)+' DPS'+diff+' · pico '+fmt(h.peak)+' · total '+fmt(h.total)+' · '+h.hits+' golpes · '+h.duration+' s · nv '+h.level,row);if(h.by)node('small',h.by,row);}
 }

 // Números de dano flutuando sobre o boneco.
 const pool=[];function floater(i){while(pool.length<=i){const e=node('div',undefined,document.body,'lab-hit');e.hidden=true;pool.push(e);}return pool[i];}
 let lastLab=null,last=0;
 function refreshUI(){const lab=w.lab;modelSel.value='';renderClips();followChk.checked=lab.focus;mana.checked=lab.infiniteMana;cd.checked=lab.noCooldown;count.value=lab.dummyCount;renderHistory();select(tab);}
 function update(){
  const active=isLab(s);panel.hidden=!active;if(!active){for(const e of pool)e.hidden=true;lastLab=null;return;}
  const lab=w.lab;if(lab!==lastLab){lastLab=lab;refreshUI();}
  const now=performance.now(),v=lab.viewer;
  if(tab==='models'&&v){
   playBtn.textContent=v.playing?'⏸ Pausar':'▶ Tocar';
   if(!scrubbing)scrubber.value=Math.round(Math.max(0,Math.min(1,v.duration?v.time/v.duration:0))*1000);
   for(const b of clipBox.children)b.classList.toggle('on',b.dataset.clip===v.clip);
   info.textContent=v.actor.type.name+' · '+v.clip+' · '+fmt(Math.min(v.time,v.duration),2)+' / '+fmt(v.duration,2)+' s'+(v.sequence?' · sequência':'');
  }
  if(tab==='dps'&&now-last>100){
   last=now;const r=meterStats(w),m=lab.meter;
   status.textContent=m.first===null?(m.test?'Teste de '+m.test.duration+' s armado: bata no boneco para começar.':'Aguardando o primeiro golpe…'):r.done?'Teste concluído: '+fmt(r.average,1)+' DPS em '+m.test.duration+' s.':m.test?'Medindo… restam '+fmt(r.remaining,1)+' s':r.running?'Medindo…':'Parado (sem golpes há 3 s).';
   cells.average.textContent=fmt(r.average,1);cells.recent.textContent=fmt(r.recent,1);cells.peak.textContent=fmt(r.peak,1);cells.total.textContent=fmt(r.total);cells.hits.textContent=fmt(r.hits);cells.elapsed.textContent=fmt(r.elapsed,1)+' s';
   rows.replaceChildren();for(const e of r.by.slice(0,8)){const row=node('div',undefined,rows,'lab-by-row');node('span',e.name,row);node('b',fmt(e.share*100,1)+'%',row);node('em',fmt(e.dps,1)+' DPS · '+e.hits+' golpes',row);}
   if(history.length!==shown)renderHistory();
  }
  // flutuantes: posição de tela do boneco, subindo e sumindo
  const recent=lab.floaters.slice(-14);
  recent.forEach((f,i)=>{const age=w.time-f.time,e=floater(i),p=view.screen(f.x,f.y,w);e.hidden=false;e.textContent=fmt(f.amount);e.style.left=(p.x+((f.id%7)-3)*7)+'px';e.style.top=(p.y-95-age*55)+'px';e.style.opacity=String(Math.max(0,1-age/1.1));});
  for(let i=recent.length;i<pool.length;i++)pool[i].hidden=true;
 }

 // Aba do Relicário: explica o modo e entra/sai.
 function renderEntry(){
  const host=document.getElementById('lab-content');if(!host)return;host.replaceChildren();
  node('h2','Laboratório',host);
  node('p','Arena vazia para testar o seu personagem atual (nível, Grimório, equipamentos e horda) sem inimigos atacando. Tem um boneco de madeira com medidor de DPS e testes cronometrados, e um visualizador de modelos para ver cada animação de inimigos, chefes, lacaios e do jogador. Nada do que acontece lá é salvo.',host);
  if(isLab(s)){button('Sair do Laboratório',()=>{exit();},host);return;}
  const ok=['village','menu'].includes(s.scene),b=button('Entrar no Laboratório',()=>{enter();},host);b.disabled=!ok;b.id='lab-enter';
  if(!ok)node('p','O Laboratório abre pela Vila de Eldrin ou pelo menu inicial.',host,'section-note');
 }
 select('models');renderClips();
 return {update,renderEntry,select};
}
