// Aba "Mapas" do Relicário: lista da biblioteca, jogar, editar, criar variações (mapas base), importar e exportar.
import {BIOMES,BUILTIN_BASES,TEMPLATES,LIMITS,blankMap,builtinMap,dependents,resolveMap} from './map-model.mjs';
import {isCustomMap,populateMap} from './map-play.mjs';

export function createMapPanel(s,{library,editor,play,exit,focus}){
 let message='',confirming=null;
 const node=(tag,text,parent,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;parent?.append(e);return e;};
 const button=(text,fn,parent,cls='btn')=>{const b=node('button',text,parent,cls);b.type='button';b.onclick=fn;return b;};
 const say=text=>{message=text;render();};
 const when=t=>t?new Date(t).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'';

 function download(name,textValue){
  const url=URL.createObjectURL(new Blob([textValue],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 const fileName=map=>'mapa-'+map.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.json';
 function importFile(){
  const picker=document.createElement('input');picker.type='file';picker.accept='.json,application/json';
  picker.onchange=async()=>{
   const file=picker.files[0];if(!file)return;
   if(file.size>LIMITS.maxBytes)return say('Arquivo grande demais para ser um mapa.');
   const result=library.importJson(await file.text());
   say(result.ok?result.message+(result.problems.length?' Avisos: '+[...new Set(result.problems)].join(' '):''):result.message);
  };
  picker.click();
 }
 const baseName=map=>!map.base?'':map.base.startsWith('builtin:')?BUILTIN_BASES[map.base]:library.get(map.base.slice(4))?.name||'(base ausente)';

 function row(map,parent){
  const li=node('li',undefined,parent,'maps-row'),info=node('div',undefined,li,'maps-info');
  node('strong',map.name,info);
  const flat=resolveMap(map,library.lookup).map,users=dependents(map.id,library.list()).length;
  node('small',BIOMES[flat.biome]+' · '+flat.size.w+'×'+flat.size.h+' · '+flat.objects.length+' objetos · '+flat.spawns.reduce((n,p)=>n+p.count,0)+' inimigos'+(map.base?' · base: '+baseName(map):'')+(users?' · base de '+users:'')+(map.updated?' · '+when(map.updated):''),info);
  const actions=node('div',undefined,li,'maps-actions');
  button('Jogar',()=>play(map),actions,'btn pri');
  button('Editar',()=>editor.open(map.id),actions);
  button('Variação',()=>{const r=library.variant(map.id);if(r.ok){say('Variação criada: herda deste mapa e muda junto com ele.');editor.open(r.map.id);}else say(r.message);},actions).title='Cria um mapa novo que herda este como base';
  button('Duplicar',()=>{const r=library.duplicate(map.id);say(r.ok?'Mapa duplicado.':r.message);},actions);
  button('Exportar',()=>{const json=library.exportJson(map.id);if(json){download(fileName(map),json);say('Mapa exportado'+(map.base&&!map.base.startsWith('builtin:')?' junto com as bases de que depende.':'.'));}},actions);
  if(confirming===map.id){
   button('Confirmar exclusão',()=>{confirming=null;const r=library.remove(map.id);say(r.ok?'Mapa excluído.':r.message);},actions,'btn danger');
   button('Cancelar',()=>{confirming=null;render();},actions);
  }else button('Excluir',()=>{confirming=map.id;render();},actions);
 }

 function render(){
  const host=document.getElementById('maps-content');if(!host)return;host.replaceChildren();
  node('h2','Mapas',host);
  node('p','Crie mapas com o editor, jogue neles e use qualquer mapa como base de outros: a variação herda objetos, bioma, tamanho, início e inimigos e muda junto com a base. Os mapas ficam neste navegador; exporte para guardar ou compartilhar.',host);
  if(library.status()!=='ok')node('p',library.status()==='invalid'?'A biblioteca guardada está corrompida. Ela não será sobrescrita; exporte o arquivo do navegador antes de limpar.':'O navegador bloqueou o armazenamento: os mapas não poderão ser salvos.',host,'section-note');
  if(message)node('p',message,host,'maps-message');
  if(isCustomMap(s)){
   const run=s.world.adventure,box=node('div',undefined,host,'maps-current');
   node('strong','Mapa atual: '+run.name,box);node('span',run.enemies+' inimigo(s) no início · nível '+run.level,box);
   const a=node('div',undefined,box,'maps-actions');
   button('Reiniciar inimigos',()=>{populateMap(s.world);s.world.notice='Inimigos reposicionados.';focus();say('Inimigos reposicionados.');},a);
   if(library.get(run.mapId))button('Editar este mapa',()=>editor.open(run.mapId),a);
   button('Sair do mapa',()=>exit(),a,'btn danger');
  }
  const create=node('div',undefined,host,'maps-create'),template=node('select',undefined,create);
  template.setAttribute('aria-label','Modelo do novo mapa');
  for(const t of TEMPLATES){const o=node('option',t.name,template);o.value=t.id;}
  button('Novo mapa',()=>{const map=TEMPLATES.find(t=>t.id===template.value).make();editor.open(map);},create,'btn pri').id='maps-new';
  button('Importar…',importFile,create);
  node('h3','Seus mapas',host);
  const maps=library.list();
  if(!maps.length)node('p','Nenhum mapa ainda. Escolha um modelo e clique em «Novo mapa».',host,'section-note');
  else{const ul=node('ul',undefined,host,'maps-list');for(const m of maps)row(m,ul);}
  node('h3','Mapas do jogo (use como base)',host);
  const ul=node('ul',undefined,host,'maps-list');
  for(const [ref,name] of Object.entries(BUILTIN_BASES)){
   const li=node('li',undefined,ul,'maps-row'),info=node('div',undefined,li,'maps-info'),doc=builtinMap(ref);
   node('strong',name,info);node('small',BIOMES[doc.biome]+' · '+doc.size.w+'×'+doc.size.h+' · '+doc.objects.length+' objetos',info);
   const a=node('div',undefined,li,'maps-actions');
   button('Jogar',()=>play(blankMap(name,{base:ref})),a,'btn pri');
   button('Criar variação',()=>{const r=library.variant(ref);if(r.ok){say('Variação criada.');editor.open(r.map.id);}else say(r.message);},a);
  }
 }
 return {render};
}
