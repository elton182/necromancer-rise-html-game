// Página do editor de mapas (só desenvolvimento): carrega os modelos de cenário e o personagem de referência, lê e grava os mapas em arquivos.
import {GLTFLoader} from 'gltf-loader';
import {createLibrary,detach} from './map-model.mjs';
import {createMapEditor} from './map-editor.mjs';
import {createMapPanel} from './map-panel.mjs';
import {createDiskStore} from './map-disk-store.mjs';
import {useCampaignMaps} from './campaign-maps.mjs';
import {Types as ENEMY_TYPES,DISABLED_TYPES} from './enemies.mjs';

// `medievalVillage` só aparece no campo de treino antigo; a cena dos mapas não o usa.
const SCENERY=['villageKit','natureKit','swampKit','cryptArchitecture','ruinedVillageKit','caravanKit','caveFallKit','caveHideoutKit','mapKit','necromancer'];
const $=id=>document.getElementById(id),started=performance.now(),metrics={};
const say=text=>{$('me-loading').textContent=text;};
async function api(method,url,body){
 const response=await fetch(url,{method,headers:{'X-Map-Editor':'1',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const data=await response.json().catch(()=>null);
 if(!response.ok||data?.ok===false)throw Error(data?.message||'O servidor respondeu '+response.status+'.');
 return data;
}
async function loadModels(){
 const defs=await (await fetch('/v2/assets/models.json')).json(),loader=new GLTFLoader(),models={},assets={};let done=0;
 await Promise.all(SCENERY.map(async key=>{
  const response=await fetch('/'+defs[key].path);if(!response.ok)throw Error('Modelo '+key+' não encontrado: '+defs[key].path);
  models[key]=await loader.parseAsync(await response.arrayBuffer(),'');assets[key]=defs[key];say('Carregando modelos ('+(++done)+'/'+SCENERY.length+')…');
 }));
 return {models,assets};
}
async function boot(){
 const {maps,problems}=await api('GET','/api/maps');metrics.mapsMs=performance.now()-started;
 const game=await loadModels();metrics.modelsMs=performance.now()-started;
 let editor=null,panel=null;
 let failing=false;
 const store=createDiskStore(maps,{request:api,onState:({error})=>{
  if(error){failing=true;editor?.notify('Não foi possível gravar no disco: '+error+' Tentando de novo…','error');}
  else if(failing){failing=false;editor?.notify('Gravação em disco normalizada.');}
 }});
 const library=createLibrary(store,undefined,{maxBytes:Infinity});
 useCampaignMaps(library);
 // Abre a aba antes de esperar a gravação: depois disso, o navegador bloquearia a janela nova.
 async function play(target){
  const tab=window.open('about:blank','nr-map-test'),doc=typeof target==='string'?library.get(target):target;if(!doc)return;
  const saved=await store.flush();if(!saved.ok)editor.notify('O teste usa o que está no disco, e a gravação falhou: '+saved.message,'error');
  try{
   const result=await api('POST','/api/play',{doc:detach(doc,library.lookup)});
   if(tab)tab.location=result.url;else editor.notify('O navegador bloqueou a aba de teste. Permita pop-ups para este endereço.','warn');
   if(result.stale)editor.notify('Teste aberto, mas o jogo é anterior às fontes: use Publicar no jogo para incluir mudanças de código.','warn');
  }catch(error){tab?.close();editor.notify(error.message,'error');}
 }
 // Publicar no jogo: salva o que está aberto, espera chegar ao disco e roda o build no servidor. Nada é publicado pela metade.
 let publishing=false,publishState=null;
 const publishButtons=new Set();
 const notify=(text,kind='')=>{if(editor.isOpen())editor.notify(text,kind);else panel.say(text);};
 function publishLabel(){
  const state=publishState;if(publishing||state?.publishing)return 'Publicando…';if(!state)return 'Publicar no jogo';
  if(state.invalid)return 'Publicar no jogo · mapa inválido';
  const count=state.changed.length;if(count)return 'Publicar no jogo · '+count+(count>1?' mapas':' mapa');
  return 'Publicar no jogo · '+(state.stale?'código novo':'em dia');
 }
 function publishTitle(){
  const state=publishState,names=state?.changed.map(m=>m.removed?m.name+' (voltar ao original)':m.name)||[];
  return state?.invalid||((names.length?'Falta publicar: '+names.join(', ')+'. ':state?.stale?'O código mudou desde o último build. ':'')+'Gera v2/necromancer-3d.html com os mapas do disco e o código atual.');
 }
 function syncPublish(){
  for(const b of publishButtons){
   if(!b.isConnected){publishButtons.delete(b);continue;}
   b.textContent=publishLabel();b.title=publishTitle();b.disabled=publishing||!!publishState?.publishing;b.classList.toggle('pri',!!(publishState?.changed.length||publishState?.stale));
  }
 }
 async function refreshPublish(){try{publishState=await api('GET','/api/publish');}catch{publishState=null;}syncPublish();}
 async function publish(){
  if(publishing||(editor.isOpen()&&!editor.saveNow()))return;
  publishing=true;syncPublish();const began=performance.now();
  try{
   notify('Publicando no jogo… pode continuar editando.');
   const saved=await store.flush();if(!saved.ok)throw Error('a gravação em disco falhou: '+saved.message);
   publishState=await api('POST','/api/publish');
   const seconds=Math.round((performance.now()-began)/1000),waiting=publishState.changed.length;
   notify('Publicado em '+seconds+' s. Recarregue a aba do jogo para ver.'+(waiting?' Edições feitas durante a publicação ainda faltam publicar.':''),waiting?'warn':'');
  }catch(error){
   notify('A publicação falhou: '+(/Rota desconhecida/.test(error.message)?'o servidor é anterior a este botão. Reinicie node v2/tools/map-editor-server.cjs.':error.message),'error');
  }finally{publishing=false;await refreshPublish();}
 }
 const publishButton=(parent,cls='')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.dataset.publish='';b.onclick=publish;parent.append(b);publishButtons.add(b);syncPublish();return b;};
 const meter=document.createElement('span');meter.className='me-meter';meter.id='me-meter';
 const barExtra=document.createElement('span');barExtra.style.display='contents';barExtra.append(meter);
 editor=createMapEditor({standalone:true,barExtra,game,library,enemyTypes:ENEMY_TYPES.map((t,index)=>({index,name:t.name})).filter(t=>!(t.index in DISABLED_TYPES)),play,closed:()=>panel.render()});
 publishButton(barExtra);
 panel=createMapPanel({scene:'menu',world:{}},{standalone:true,library,editor,play,exit(){},focus(){},publishButton});
 panel.render();metrics.readyMs=performance.now()-started;
 $('me-loading').hidden=true;document.body.dataset.ready='true';
 if(problems.length)$('me-problems').textContent='Arquivos de mapa ignorados: '+problems.join('; ');
 setInterval(()=>{
  const s=editor.metrics();if(!s)return;Object.assign(metrics,s);
  meter.textContent=meter.title='3D: '+Math.round(s.frameMs?1000/s.frameMs:0)+' FPS · última alteração '+Math.round(s.updateMs)+' ms · chão '+Math.round(s.groundMs)+' ms · '+Math.round(s.triangles/1000)+' mil triângulos';
 },1000);
 // O mapa só chega ao disco depois da gravação automática: a situação do botão acompanha sem precisar de outro aviso.
 refreshPublish();setInterval(()=>{if(!publishing&&!document.hidden&&!store.pending())refreshPublish();},4000);
 window.addEventListener('beforeunload',e=>{if(store.pending())e.preventDefault();});
 window.NecromancerMapEditor={metrics,library,editor,store};
}
boot().catch(error=>{say('O editor não abriu: '+error.message);console.error(error);});
