// Aba "Mapas" do Relicário: lista da biblioteca, jogar, editar, criar variações (mapas base), importar e exportar.
import {BIOMES,BUILTIN_BASES,TEMPLATES,LIMITS,blankMap,builtinMap,dependents,resolveMap} from './map-model.mjs';
import {isCustomMap,populateMap} from './map-play.mjs';
import {CAMPAIGN_SLOTS,campaignDocument,savedCampaignMap,bakedCampaignMap,campaignMapId} from './campaign-maps.mjs';

// `standalone`: página própria do editor, em que os mapas ficam em arquivos do projeto.
export function createMapPanel(s,{library,editor,play,exit,focus,standalone=false,publishButton=null}){
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
  node('p','Crie mapas com o editor, jogue neles e use qualquer mapa como base de outros: a variação herda objetos, bioma, tamanho, início e inimigos e muda junto com a base. '+(standalone?'Os mapas ficam em v2/assets/maps/, no projeto; os da campanha entram no jogo com «Publicar no jogo».':'Os mapas ficam neste navegador; exporte para guardar ou compartilhar.'),host);
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
  const refresh=button('↻ Atualizar modelos',()=>location.reload(),create);refresh.id='maps-refresh-models';refresh.title=standalone?'Recarrega fontes e modelos. As edições já estão no disco.':'Recarrega o HTML atualizado. Salve o mapa antes; alterações não salvas serão perdidas.';
  button('Revisar campanha integrada',()=>editor.open(TEMPLATES.find(t=>t.id==='campaign-world').make()),create).id='maps-campaign-world';
  node('h3','Mapas da campanha',host);
  node('p','Edite as fases da campanha: estilo, tamanho, relevo, água, peças e inimigos. Cada edição é salva sozinha '+(standalone?'em v2/assets/maps/ e entra no jogo com «Publicar no jogo»':'neste navegador e vale na próxima vez que a cena abrir')+'; «Restaurar» volta à planta original. A história continua igual: lugares e grupos de missão ficam marcados e protegidos.',host,'section-note');
  const camp=node('ul',undefined,host,'maps-list');
  for(const [slot,def] of Object.entries(CAMPAIGN_SLOTS)){
   const li=node('li',undefined,camp,'maps-row'),info=node('div',undefined,li,'maps-info'),edit=savedCampaignMap(slot),baked=bakedCampaignMap(slot),flat=resolveMap(campaignDocument(slot),library.lookup).map;
   node('strong',def.name,info);node('small',BIOMES[flat.biome]+' · '+flat.size.w+'×'+flat.size.h+' · '+flat.objects.length+' objetos · '+flat.spawns.reduce((n,p)=>n+p.count,0)+' inimigos · '+(edit?'editado'+(edit.updated?' em '+when(edit.updated):''):baked?'edição embutida no jogo':'original'),info);
   const a=node('div',undefined,li,'maps-actions');a.dataset.slot=slot;
   button('Editar',()=>editor.open(campaignDocument(slot)),a,'btn pri');
   button('Testar',()=>play(campaignDocument(slot)),a);
   if(edit&&confirming==='slot:'+slot){
    button('Confirmar: apagar a edição',()=>{confirming=null;const r=library.remove(campaignMapId(slot));say(r.ok?def.name+': edição removida.':r.message);},a,'btn danger');
    button('Cancelar',()=>{confirming=null;render();},a);
   }else if(edit)button('Restaurar',()=>{confirming='slot:'+slot;render();},a);
  }
  const pack=node('div',undefined,host,'maps-create');
  if(standalone)publishButton?.(pack,'btn');
  else{
   button('Exportar edições da campanha',()=>{const json=library.exportCampaign();if(!json)return say('Nenhuma edição da campanha para exportar.');download('campaign-maps.json',json);say('Arquivo exportado. Para levá-las ao projeto, use Importar… no editor de mapas (node v2/tools/map-editor-server.cjs).');},pack).id='maps-export-campaign';
  }
  node('h3','Seus mapas',host);
  const maps=library.list().filter(m=>!m.campaign);
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
 return {render,say};
}
