import {createRenderer} from 'v2-renderer';
import {createInput} from 'v2-input';
import {createSaveStore,importSave,serializeSave,MAX_BYTES} from 'v2-save';
import {createSession,transition,pauseSession,castSession,stepSession,applySave,updateSettings,snapshot} from 'v2-session';
const $=id=>document.getElementById(id);
let view,input;
function fail(error){$('status').textContent='Falha ao iniciar';$('failure').hidden=false;$('failure-message').textContent=error.message||String(error);$('retry').onclick=()=>location.reload();view?.dispose();input?.dispose();console.error(error);}
try{await boot();}catch(error){fail(error);}
async function boot(){
 let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Armazenamento indisponível.');},setItem(){throw Error('Armazenamento indisponível.');}};}
 const store=createSaveStore(storage),loaded=store.load(),session=createSession(loaded.status==='ok'?loaded.save:undefined),world=session.world;
 let pending=null,hasSaved=loaded.status==='ok',mousePoint=null,aimMode='mouse',padDirection={x:0,y:-1};
 const message=text=>{$('save-message').textContent=text;};
 const summary=save=>`Nível ${save.character.level} · ${save.character.gold} ouro · ${save.character.mode==='campaign'?'Campanha':'Modo Livre'}`;
 view=await createRenderer($('view'),JSON.parse($('assets').textContent),key=>{$('status').textContent='Carregando '+key+'…';});
 function settings(){const s=session.save.settings;$('horde').value=s.horde;$('ground').value=s.ground;$('quality').value=s.quality;view.ground(s.ground==='light');view.quality(s.quality==='low');}
 function ui(){
  document.body.dataset.scene=session.scene;const inTraining=session.scene==='training';
  $('scene-panel').hidden=inTraining;$('scene-title').textContent=session.scene==='dead'?'Você caiu':'O despertar de Valdoria';$('enter').textContent=session.scene==='dead'?'Tentar novamente':'Entrar no treino';
  $('continue').hidden=session.scene!=='menu'||!hasSaved;$('pause').disabled=!inTraining;$('cast').disabled=!inTraining;
  $('pause').textContent=world.paused?'Retomar [Esc]':'Pausar [Esc]';$('paused').hidden=!inTraining||!world.paused;
  $('profile').textContent=summary(session.save)+(session.save.legacy?' · Personagem antigo preservado':'');
  $('backup').disabled=!store.backup();
 }
 function go(scene){transition(session,scene);input?.clear();ui();}
 function pause(value=!world.paused){if($('import-dialog').open)return;pauseSession(session,value);input?.clear();ui();}
 function restart(){updateSettings(session,{horde:Number($('horde').value)});go('training');}
 function saveNow(){const value=snapshot(session),result=store.save(value);if(result.ok){session.save=value;hasSaved=true;message('Save da v2 gravado. O treino recomeça ao continuar; dados do personagem são preservados.');}else message(result.message);ui();return result.ok;}
 function download(text,name){const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);}
 function preview(value){pauseSession(session,true);input.clear();pending=value;$('preview-profile').textContent=summary(value);$('preview-kind').textContent=value.legacy?'O arquivo antigo completo será preservado, incluindo equipamentos, habilidades e progresso dos modos. O treino 3D ainda não usa esses atributos.':'As configurações e os dados arquivados deste save da v2 serão restaurados. A luta recomeça em uma arena limpa.';$('import-error').textContent='';ui();$('import-dialog').showModal();}
 function refreshAim(controls){
  if(controls?.aim&&Math.hypot(controls.aim.x,controls.aim.y)>.01){aimMode='pad';const d=Math.hypot(controls.aim.x,controls.aim.y);padDirection={x:controls.aim.x/d,y:controls.aim.y/d};}
  if(aimMode==='pad'){const r=$('view').getBoundingClientRect(),p=view.aim(r.left+r.width/2+padDirection.x*150,r.top+r.height/2+padDirection.y*150,world);if(p){const dx=p.x-world.player.x,dy=p.y-world.player.y,d=Math.hypot(dx,dy)||1;world.aim={x:world.player.x+dx/d*9,y:world.player.y+dy/d*9};}}
  else if(mousePoint){const p=view.aim(mousePoint.x,mousePoint.y,world);if(p)world.aim=p;}
 }
 function aimCast(){refreshAim();return castSession(session);}
 input=createInput($('view'),{aim(x,y){mousePoint={x,y};aimMode='mouse';refreshAim();},cast:aimCast,pause:()=>pause(),zoom:d=>{view.zoom(d);refreshAim();},blur:()=>pause(true)});
 $('enter').onclick=restart;$('reset').onclick=restart;$('menu').onclick=()=>go('menu');$('pause').onclick=()=>pause();$('cast').onclick=aimCast;
 $('colliders').onchange=()=>view.colliders($('colliders').checked);
 $('continue').onclick=()=>{const result=store.load();if(result.status!=='ok'){message(result.message||'Nenhum save disponível.');return;}applySave(session,result.save);settings();go('training');message('Configurações restauradas. O encontro começou novamente.');};
 $('horde').onchange=()=>{updateSettings(session,{horde:Number($('horde').value)});if(session.scene==='training')restart();else go('menu');};
 $('ground').onchange=()=>{updateSettings(session,{ground:$('ground').value});view.ground($('ground').value==='light');};
 $('quality').onchange=()=>{updateSettings(session,{quality:$('quality').value});view.quality($('quality').value==='low');};
 $('save').onclick=saveNow;
 $('export').onclick=()=>{try{download(serializeSave(snapshot(session)),'necromancer-v2-save.json');message('Arquivo da v2 exportado.');}catch(error){message(error.message);}};
 $('backup').onclick=()=>{const raw=store.backup();if(raw!==null)download(raw,'necromancer-v2-save-anterior.json');};
 $('import-file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>MAX_BYTES)throw Error('Arquivo muito grande (limite de 5 MB).');preview(importSave(await file.text()));}catch(error){message(error.message);}};
 $('import-browser').onclick=()=>{const result=store.legacy();if(result.ok)preview(result.save);else message(result.message);};
 $('cancel-import').onclick=()=>$('import-dialog').close();$('import-dialog').addEventListener('close',()=>{pending=null;ui();});
 $('confirm-import').onclick=()=>{if(!pending)return;const value={...pending,savedAt:Date.now()},result=store.save(value,{backup:true});if(!result.ok){$('import-error').textContent=result.message;return;}applySave(session,value);hasSaved=true;settings();$('import-dialog').close();message('Save importado na v2. O save do jogo anterior permanece intacto.');input.clear();ui();};
 const resize=()=>{view.resize();refreshAim();};window.addEventListener('resize',resize);settings();ui();
 if(loaded.status==='invalid'||loaded.status==='unavailable')message(loaded.message);else if(loaded.status==='ok')message('Save da v2 encontrado. Use Continuar para abrir um novo treino com as opções salvas.');
 let previous=performance.now(),frames=0,frameTime=0;
 view.render(world,0);
 function frame(now){const elapsed=Math.max(0,(now-previous)/1000);previous=now;const dt=Math.min(elapsed,.25),scene=session.scene,controls=input.read();refreshAim(controls);if(!$('import-dialog').open){if(controls.pause)pause();if(controls.confirm){if(session.scene==='training')aimCast();else restart();}if(controls.fire)aimCast();}stepSession(session,dt,controls);refreshAim();if(scene!==session.scene){input.clear();ui();}view.render(world,dt,{animateWhilePaused:session.scene==='dead'});frames++;frameTime+=elapsed;
  if(frameTime>=.5){const fps=Math.round(frames/frameTime),r=view.renderer.info.render;frames=0;frameTime=0;$('stats').textContent=`${fps} FPS · ${world.actors.length} personagens · ${r.calls} desenhos · ${r.triangles.toLocaleString('pt-BR')} triângulos`;}
  $('health').textContent=world.player.hp>0?`Vida do treino · ${world.player.hp} / 100`:'Você caiu';$('boss-health').textContent=`Rei Caído · ${Math.max(0,world.boss.hp)} / 1000`;
 }
 view.renderer.setAnimationLoop(now=>{try{frame(now);}catch(error){fail(error);}});$('status').textContent='Pronto · 4 modelos carregados';document.body.dataset.ready='true';
 window.NecromancerV2={stage:'E3',session,world,view,store,cast:()=>castSession(session),pause,restart,go,save:saveNow,preview};
 window.addEventListener('pagehide',()=>{input.dispose();view.dispose();window.removeEventListener('resize',resize);},{once:true});
}
