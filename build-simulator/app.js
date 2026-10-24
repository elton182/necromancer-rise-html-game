(function(){
'use strict';
const M=BuildModel,$=id=>document.getElementById(id),storeKey='necromancer-build-simulator-v1';
let state={version:1,level:30,ranks:{}},tree='minions',selected='zombie';
const positions=[[50,12],[23,135],[77,135],[23,258],[77,258],[23,384],[77,384]];
const units=key=>/adicionais/.test(key)?'':'%';
const format=(key,value)=>`${value>0?'+':''}${value}${units(key)}`;
function notify(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function encode(){return btoa(JSON.stringify(state));}
function decode(code){return M.validate(JSON.parse(atob(code.trim())));}
try{if(location.hash.startsWith('#build='))state=decode(decodeURIComponent(location.hash.slice(7)));else if(localStorage.getItem(storeKey))state=M.validate(JSON.parse(localStorage.getItem(storeKey)));}catch(e){notify('Não foi possível carregar a build salva. Iniciamos uma build vazia.',true);}
for(const [key,preset] of Object.entries(M.presets)){const option=document.createElement('option');option.value=key;option.textContent=preset.name;$('presets').append(option);}
function save(){try{localStorage.setItem(storeKey,JSON.stringify(state));}catch(e){notify('Build mantida nesta sessão. O navegador não permitiu salvar localmente.',true);}if(location.hash){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){/* file:// pode bloquear a atualização do endereço */}}}
function renderGraph(){
 $('tree').innerHTML='';
 for(const school of M.schools.filter(s=>s.tree===tree)){
  const list=M.nodes.filter(n=>n.school===school.id),section=document.createElement('section');section.className='school';
  section.innerHTML=`<h2 class="school-title">${school.name}</h2><div class="school-paths"><span>${school.paths[0]}</span><span>${school.paths[1]}</span></div><div class="graph"></div>`;
  const graph=section.querySelector('.graph'),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 500');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.classList.add('links');
  list.forEach((n,i)=>{if(!n.requires)return;const parent=list.findIndex(p=>p.id===n.requires),[x,y]=positions[i],[px,py]=positions[parent],path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M ${px} ${py+100} V ${y-15} H ${x} V ${y}`);if(state.ranks[n.id])path.classList.add('on');svg.append(path);});graph.append(svg);
  list.forEach((n,i)=>{
   const rank=state.ranks[n.id]||0,blocked=M.reason(n,state.ranks,state.level),button=document.createElement('button');button.type='button';button.className=['node',blocked?'locked':'available',rank?'learned':'',selected===n.id?'selected':'',n.max===1?'capstone':'',n.exclusive&&state.ranks[n.exclusive]?'excluded':''].join(' ');button.style.left=positions[i][0]+'%';button.style.top=positions[i][1]+'px';button.dataset.skill=n.id;button.setAttribute('aria-label',`${n.name}, ${rank} de ${n.max} pontos${blocked?', '+blocked:''}`);button.setAttribute('aria-pressed',String(selected===n.id));button.innerHTML=`<span class="seal"><span class="symbol" aria-hidden="true">${n.icon}</span><span class="node-rank">${rank}/${n.max}</span></span><span class="node-name">${n.name}</span>`;button.addEventListener('click',()=>{selected=n.id;render();});graph.append(button);
  });$('tree').append(section);
 }
}
function renderDetails(){
 const n=M.byId[selected],rank=state.ranks[n.id]||0,error=M.reason(n,state.ranks,state.level),school=M.schools.find(s=>s.id===n.school);
 $('skill-school').textContent=`${n.tree==='minions'?'MINIONS':'PROFANA'} / ESCOLA DE ${school.name.toUpperCase()}`;$('skill-name').textContent=n.name;$('skill-icon').textContent=n.icon;$('skill-description').textContent=n.description;$('skill-rank').textContent=`${rank} / ${n.max} pontos ${n.max===1?'· Especialização final':'· '+(n.tier===0?'Raiz da escola':'Bifurcação '+n.tier)}`;
 $('requirements').innerHTML=`<div class="requirement ${error?'blocked':''}">${error||`Nível ${n.level} · ${n.requires?'2 pontos em '+M.byId[n.requires].name:'Sem pré-requisito'}`}</div>${n.exclusive?`<div class="requirement">◇ Escolha entre esta habilidade e ${M.byId[n.exclusive].name}.</div>`:''}`;
 $('skill-effects').innerHTML=Object.entries(n.effects).map(([key,value])=>`<li>${format(key,value)} ${key.toLowerCase()}</li>`).join('');
 const synergies={zombie:'Cada ponto em Zumbis dá +4% de dano à Abominação, mesmo seguindo o caminho explosivo.',vigor:'A vida adicional também fortalece o Escudo de Carne calculado a partir do zumbi sacrificado.',abom:'Recebe +4% de dano por ponto em Zumbis e +10% de vida por ponto em Carne Reanimada.',unstable:'Ponte entre árvores: fortalece a detonação de Zumbi e Explosão Necrótica.',ritual:'Soma com Carne Instável da árvore Minions. Não gera multiplicação recursiva.',bolt:'Pontos diretos em Chuva de Ossos concedem +4% de dano ao Tiro por ponto.',rain:'Pontos diretos em Tiro de Osso concedem +4% de dano à Chuva por ponto.',shield:'Sinergia de vida: Carne Reanimada melhora o zumbi usado no sacrifício.',aura:'Fortalece qualquer escola de Minions, permitindo builds híbridas.'};
 $('synergy').textContent=synergies[n.id]||'Você pode misturar as duas bifurcações intermediárias. Apenas as duas especializações finais desta escola são exclusivas entre si.';
 $('invest').disabled=!!error||rank>=n.max||M.spent(state.ranks)>=M.budget(state.level);$('refund').disabled=!rank;
}
function isDormant(key,r){
 const needs={'Dano da Abominação':'abom','Vida da Abominação':'abom','Dano do Salto Devastador':'colossus','Dano da explosão de Zumbi':'burst','Dano do Tiro Sepulcral':'shot','Dano dos Arqueiros':'archer','Arqueiros adicionais':'archer','Dano dos Espectros':'specter','Dano da Chuva de Ossos':'rain','Dano do Tiro de Osso':'bolt','Dano da Explosão Necrótica':'nova','Duração da Muralha':'wall','Absorção do Escudo de Carne':'shield'};
 return needs[key]&&!r[needs[key]];
}
function summary(){
 const ranks=state.ranks,raw=M.effects(ranks),effective=M.effective(ranks),count=M.spent(ranks);
 const sum=t=>M.nodes.filter(n=>n.tree===t).reduce((v,n)=>v+(ranks[n.id]||0),0),min=sum('minions'),sp=sum('spells');$('minions-count').textContent=min;$('spells-count').textContent=sp;
 const caps=M.nodes.filter(n=>n.max===1&&ranks[n.id]).map(n=>n.name);$('identity').textContent=caps.length?caps.join(' + '):count?`${min&&sp?'Híbrido de invocações e magias':min?'Invocador em formação':'Conjurador em formação'} · escolha suas especializações a partir do nível 24.`:'O grimório aguarda sua primeira escolha.';
 $('distribution').innerHTML=count?`<span class="dist" style="flex:${min}" title="Minions: ${min} pontos"></span><span class="dist spells" style="flex:${sp}" title="Profana: ${sp} pontos"></span>`:'';
 let items=Object.entries(raw);
 if(ranks.abom){items=items.filter(([k])=>k!=='Dano da Abominação');items.unshift(['Dano total da Abominação',effective['Dano total da Abominação']]);}
 if(ranks.burst){items=items.filter(([k])=>k!=='Dano da explosão de Zumbi');items.unshift(['Dano total da explosão de Zumbi',effective['Dano total da explosão de Zumbi']]);}
 if(ranks.nova){items=items.filter(([k])=>k!=='Dano da Explosão Necrótica');items.unshift(['Dano total da Explosão Necrótica',effective['Dano total da Explosão Necrótica']]);}
 $('totals').innerHTML=items.length?items.map(([key,value])=>`<div class="effect-row ${isDormant(key,ranks)?'dormant':''}"><span>${key}${isDormant(key,ranks)?' <small>· dormente</small>':''}</span><strong>${format(key,value)}</strong></div>`).join(''):'<p class="micro">Invista pontos para ver os efeitos e as sinergias.</p>';
}
function render(){
 const focus=document.activeElement,skill=focus&&focus.dataset.skill;
 $('level').value=state.level;$('remaining').textContent=M.budget(state.level)-M.spent(state.ranks);$('spent').textContent=`${M.spent(state.ranks)} / ${M.budget(state.level)}`;
 document.querySelector('.tree-area').classList.toggle('spells',tree==='spells');document.querySelectorAll('[data-tree]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tree===tree)));$('tree').setAttribute('aria-labelledby','tab-'+tree);
 renderGraph();renderDetails();summary();if(skill){const replacement=document.querySelector(`[data-skill="${skill}"]`);if(replacement)replacement.focus({preventScroll:true});}
}
function changed(){ $('presets').value='';save();render(); }
document.querySelectorAll('[data-tree]').forEach(button=>button.addEventListener('click',()=>{tree=button.dataset.tree;if(M.byId[selected].tree!==tree)selected=M.nodes.find(n=>n.tree===tree).id;render();}));
$('invest').addEventListener('click',()=>{try{M.invest(state,selected);notify(`Ponto investido em ${M.byId[selected].name}.`);changed();}catch(e){notify(e.message,true);}});
$('refund').addEventListener('click',()=>{const returned=M.refund(state,selected);notify(`${returned} ponto${returned===1?' devolvido':'s devolvidos'} à build.`);changed();});
$('level').addEventListener('change',()=>{const before=M.spent(state.ranks);M.setLevel(state,$('level').value);const returned=before-M.spent(state.ranks);notify(`Nível ${state.level}: ${M.budget(state.level)} pontos totais.${returned?' '+returned+' pontos removidos para respeitar o nível e os pré-requisitos.':''}`);changed();});
$('reset').addEventListener('click',()=>{state.ranks={};notify('Build limpa. Todos os pontos estão disponíveis.');changed();});
$('presets').addEventListener('change',()=>{const key=$('presets').value;if(!key)return;try{const p=M.presets[key];state=M.validate({version:1,level:p.level,ranks:{...p.ranks}});selected=Object.keys(state.ranks)[0];tree=M.byId[selected].tree;save();render();notify(`${p.name} carregada no nível ${p.level}. Ajuste os pontos para explorar variações.`);}catch(e){notify(e.message,true);}});
async function copy(text,success){try{await navigator.clipboard.writeText(text);notify(success);}catch(e){$('code-panel').open=true;$('code').value=text;$('code').select();notify('Selecione e copie o conteúdo no campo abaixo.');}}
$('share').addEventListener('click',()=>{const url=new URL(location.href);url.hash='build='+encodeURIComponent(encode());copy(url.href,'Link da build copiado.');});
$('export').addEventListener('click',()=>{$('code-panel').open=true;$('code').value=encode();copy(encode(),'Código da build copiado.');});
$('import').addEventListener('click',()=>{$('code-panel').open=true;$('code').value='';$('code').focus();notify('Cole o código ou link da build e clique em Carregar código.');});
$('apply-code').addEventListener('click',()=>{try{let code=$('code').value.trim();if(code.includes('#build='))code=decodeURIComponent(code.split('#build=')[1]);state=decode(code);selected=Object.keys(state.ranks)[0]||'zombie';tree=M.byId[selected].tree;changed();notify('Build importada e validada.');}catch(e){notify('Não foi possível importar: '+e.message,true);}});
render();
})();
