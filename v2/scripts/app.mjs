import {createLoading,progressOf} from 'v2-loading';
import {createTitle} from 'v2-title';
import {createGameUI} from 'v2-game-ui';
import {createCampaignPanel} from 'v2-campaign-panel';
import {startCampaign,enterVillage,campaignMap,launchStage,launchMission,launchArena,returnAdventure} from 'v2-campaign';
import {launchExpedition,launchConquest} from 'v2-expedition';
import {launchLab} from 'v2-lab';
import {createLabPanel} from 'v2-lab-panel';
import {createLibrary} from 'v2-map-model';
import {launchMap,isCustomMap} from 'v2-map-play';
import {createMapEditor} from 'v2-map-editor';
import {createMapPanel} from 'v2-map-panel';
import {Types as ENEMY_TYPES,DISABLED_TYPES} from 'v2-enemies';
import {createConquestPanel} from 'v2-conquest-panel';
import {createWavesPanel} from 'v2-waves-panel';
import {SPELL_TEST_PROFILE} from 'v2-grimoire';
import {createGrimoirePanel} from 'v2-grimoire-panel';
import {createGearPanel} from 'v2-gear-panel';
import {createRenderer} from 'v2-renderer';
import {boltCost} from 'v2-combat';
import {createInput} from 'v2-input';
import {createSaveStore,importSave,serializeSave,freshSave,MAX_BYTES} from 'v2-save';
import {createSession,transition,pauseSession,castSession,beginChargeSession,releaseChargeSession,dashSession,activateSlot,reviveSession,orderSession,equipSession,stepSession,applySave,updateSettings,snapshot,useProfile} from 'v2-session';
import {xpNext,points} from 'v2-progression';
import {levelOf} from 'v2-rewards';
import {useConsumable,definition} from 'v2-consumables';
import {createHordePanel,actionName} from 'v2-horde-panel';
import {TEST_PROFILE,TYPES} from 'v2-horde';
import {createAudio,base64Bytes,PAUSE_DUCK} from 'v2-audio';
import {createSoundObserver,musicTheme,pickupSound,CONSUMABLE_SOUNDS} from 'v2-sound-events';
const $=id=>document.getElementById(id);
let view,input;
const loading=createLoading();
function fail(error){loading.fail();$('status').textContent='Falha ao iniciar';$('failure').hidden=false;$('failure-message').textContent=error.message||String(error);$('retry').onclick=()=>location.reload();view?.dispose();input?.dispose();console.error(error);}
try{await boot();}catch(error){fail(error);}
async function boot(){
 loading.step(.03,'Lendo o grimório e o save…');
 let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Armazenamento indisponível.');},setItem(){throw Error('Armazenamento indisponível.');}};}
 const store=createSaveStore(storage),loaded=store.load(),session=createSession(loaded.status==='ok'?loaded.save:undefined),world=session.world;
 let pending=null,hasSaved=loaded.status==='ok',mousePoint=null,aimMode='mouse',padDirection={x:0,y:-1},armyPanel,grimoirePanel,gearPanel,campaignPanel,gameUI,title;
 const message=text=>{$('save-message').textContent=text;};
// Áudio: o navegador só libera o som após um gesto; sons de interface valem para qualquer botão.
 const music=JSON.parse($('music')?.textContent||'{}'),loaders=kind=>Object.fromEntries(Object.entries(music).filter(([,t])=>(t.kind||'music')===kind).map(([id,t])=>[id,()=>base64Bytes(t.data)])),tracks=loaders('music'),effects=loaders('sfx');
 const audio=createAudio({storage,tracks,effects}),sounds=createSoundObserver(),unlockAudio=()=>audio.unlock();
 for(const type of ['pointerdown','keydown','touchstart'])window.addEventListener(type,unlockAudio,{capture:true,passive:true});
 document.addEventListener('click',e=>{if(e.target.closest?.('button:not(:disabled)'))audio.play('click');},true);
 document.addEventListener('visibilitychange',()=>audio.suspend(document.hidden));
 const pickup=world.onPickup;world.onPickup=drop=>{const result=pickup(drop);if(result!==false)audio.play(pickupSound(drop));return result;};
 const equip=(i,id)=>{const result=equipSession(session,i,id);if(result?.ok)audio.play('summon');return result;};
 const consume=index=>{const id=session.save.character.inventory[index]?.id,used=useConsumable(session,index);if(used)audio.play(CONSUMABLE_SOUNDS[id]);return used;};
 const summary=save=>`Nível ${save.character.level} · ${save.character.gold} ouro · ${save.character.mode==='campaign'?'Campanha':'Modo Livre'}`;
 loading.step(.08,'Despertando os modelos 3D…');
 const assets=JSON.parse($('assets').textContent),total=Object.keys(assets).length;let modelsDone=0;
 view=await createRenderer($('view'),assets,key=>{$('status').textContent='Carregando '+key+'…';loading.step(progressOf(modelsDone,total),`Despertando os modelos 3D (${Math.min(++modelsDone,total)}/${total})…`);});
 loading.step(.92,'Preparando o campo de batalha…');
 function settings(){const s=session.save.settings;$('horde').value=s.horde;$('encounter-wave').value=s.encounterWave;$('gear-level').value=s.gearLevel;$('ground').value=s.ground;$('quality').value=s.quality;view.ground(s.ground==='light');view.quality(s.quality==='low');}
// Progresso do personagem e mensagens de recompensa; o chão e o save vêm do mundo e da sessão.
 let feedKey='',itemsKey='';
 function hud(){
  const level=levelOf(world),c=session.save.character,next=xpNext(level);
  $('level').textContent='Nível '+level;$('exp').max=next||1;$('exp').value=next?Math.min(c.exp,next):1;$('exp').title=next?Math.floor(c.exp)+' / '+next+' XP':'Nível máximo';
  $('gold').textContent=c.gold+' ouro';$('points').textContent=world.army?points(level,world.army.profile.ranks)+' pontos de habilidade':'';
  const items=c.inventory.map(i=>i.id+i.count).join()+session.scene+world.paused;if(items!==itemsKey){itemsKey=items;$('items').replaceChildren(...c.inventory.map((slot,index)=>{const d=definition(slot.id),b=document.createElement('button');b.type='button';b.textContent=`F${index+1} ${d.icon} ${slot.count}`;b.title=d.name+': '+d.desc;b.setAttribute('aria-label',`${d.name} (F${index+1}), ${slot.count} unidade(s)`);b.disabled=session.scene!=='training'||world.paused;b.onclick=()=>{consume(index);hud();};return b;}));}
  const key=world.feed.map(m=>m.id).join();if(key!==feedKey){feedKey=key;$('feed').replaceChildren(...world.feed.map(m=>{const li=document.createElement('li');li.textContent=m.text;li.style.color=m.color;return li;}));}
 }
 function ui(){
  document.body.dataset.scene=session.scene;const adventureActive=session.save.campaign.started&&session.scene!=='menu';for(const id of ['encounter-wave','army-mode','gear-level'])$(id).closest('label').hidden=adventureActive;for(const id of ['army-demo','spell-demo'])$(id).hidden=adventureActive;const inTraining=session.scene==='training';
  $('scene-panel').hidden=session.scene!=='dead'||session.save.campaign.started;$('scene-title').textContent=session.scene==='dead'?'Você caiu':'O despertar de Valdoria';$('enter').textContent=session.scene==='dead'?'Tentar novamente':'Entrar no treino';
  $('continue').hidden=session.scene!=='menu'||!hasSaved;$('pause').disabled=!inTraining;$('cast').disabled=!inTraining;
  $('pause').textContent=world.paused?'Retomar [Esc]':'Pausar [Esc]';$('paused').hidden=!inTraining||!world.paused;
  $('profile').textContent=summary(session.save)+(session.save.legacy?' · Personagem antigo preservado':'');
  $('backup').disabled=!store.backup();
  armyPanel?.update(true);
 }
 function go(scene){transition(session,scene);input?.clear();ui();}
 function pause(value=!world.paused,showMenu=true){if($('import-dialog').open||grimoirePanel?.isOpen()||gearPanel?.isOpen())return;pauseSession(session,value);input?.clear();ui();if(showMenu)gameUI?.reflectPause(value);}
 function restart(){if(session.save.campaign.started&&session.scene!=='menu'){const r=world.adventure;if(r?.kind==='stage')launchStage(session,r.n);else if(r?.kind==='mission')launchMission(session,r.mission);else if(session.save.campaign.village)enterVillage(session);else campaignMap(session);input.clear();ui();$('view').focus({preventScroll:true});return;}updateSettings(session,{horde:Number($('horde').value)});go('training');$('view').focus({preventScroll:true});}
 function saveNow(){const value=snapshot(session),result=store.save(value);if(result.ok){session.save=value;hasSaved=true;message('Save da v2 gravado. O treino recomeça ao continuar; dados do personagem são preservados.');}else message(result.message);ui();return result.ok;}
 function download(text,name){const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);}
 function preview(value){pauseSession(session,true);input.clear();pending=value;$('preview-profile').textContent=summary(value);$('preview-kind').textContent=value.legacy?'O arquivo antigo completo será preservado, incluindo equipamentos, habilidades e progresso dos modos. Nível, XP, ouro, equipamentos e consumíveis serão usados; campanha antiga, árvore e maestrias seguem arquivadas.':'As configurações e os dados arquivados deste save da v2 serão restaurados. O combate começa em uma cena limpa.';$('import-error').textContent='';ui();$('import-dialog').showModal();}
 function refreshAim(controls){
  if(controls?.aim&&Math.hypot(controls.aim.x,controls.aim.y)>.01){aimMode='pad';const d=Math.hypot(controls.aim.x,controls.aim.y);padDirection={x:controls.aim.x/d,y:controls.aim.y/d};}
  if(aimMode==='pad'){const r=$('view').getBoundingClientRect(),p=view.aim(r.left+r.width/2+padDirection.x*150,r.top+r.height/2+padDirection.y*150,world);if(p){const dx=p.x-world.player.x,dy=p.y-world.player.y,d=Math.hypot(dx,dy)||1;world.aim={x:world.player.x+dx/d*9,y:world.player.y+dy/d*9};}}
  else if(mousePoint){const p=view.aim(mousePoint.x,mousePoint.y,world);if(p)world.aim=p;}
 }
 function aimCast(){refreshAim();return activateSlot(session,0,input?.read());}
 function aimSlot(index){refreshAim();return activateSlot(session,index,input?.read());}
 function armyOrder(){refreshAim();return orderSession(session,world.aim);}
 function aimDash(controls={}){refreshAim();return dashSession(session,controls);}
 input=createInput($('view'),{aim(x,y){mousePoint={x,y};aimMode='mouse';refreshAim();},cast:aimCast,beginCast:()=>{refreshAim();return beginChargeSession(session);},releaseCast:()=>{refreshAim();return releaseChargeSession(session);},cancelCast:()=>{world.boltCharge=null;},dash:aimDash,slot:aimSlot,revive:()=>reviveSession(session),order:armyOrder,pause:()=>{if($('import-dialog').open)return;if(gameUI?.blocksInput())gameUI.handleControls({pause:true});else pause();return true;},help:()=>gameUI?.showHelp(),barrier:()=>{const i=world.army?.loadout.indexOf('barreira');if(i>=0)return aimSlot(i);return false;},zoom:d=>{view.zoom(d);refreshAim();},blur:()=>pause(true),interact:()=>campaignPanel?.interact(),inventory:()=>{if(!$('import-dialog').open&&!grimoirePanel.isOpen())gearPanel.toggle();},consumable:index=>!$('import-dialog').open&&!grimoirePanel.isOpen()&&!gearPanel.isOpen()&&consume(index)});
 armyPanel=createHordePanel(session,{equip:(i,id)=>equip(i,id),activate:aimSlot,revive:()=>reviveSession(session,null,{fromMenu:true}),demo:()=>{go('menu');const result=useProfile(session,TEST_PROFILE);if(result.ok){['raio',...TYPES].forEach((id,i)=>equip(i,id));message('Build de teste nível 24: cinco grupos e Tiro. O nível de teste substitui o progresso em memória; salvar o grava. Para usar Dash, troque um grupo por Dash.');}else message(result.message);ui();}});
 grimoirePanel=createGrimoirePanel(session,{open:()=>pause(true,false),changed:()=>ui(),equip:(i,id)=>equip(i,id)});
 gearPanel=createGearPanel(session,{open:()=>pause(true),changed:()=>{hud();ui();},filter:rarity=>updateSettings(session,{lootFilter:rarity})});
 for(const id of ['gear-dialog','grimoire-dialog'])$(id).addEventListener('close',()=>{if(session.scene==='village'&&!gameUI?.blocksInput())pauseSession(session,false);});
 campaignPanel=createCampaignPanel(session,{changed:()=>{input.clear();saveNow();ui();},merchant:()=>gearPanel.toggle(),waves:()=>gameUI.show('waves'),valdoria:()=>gameUI.show('valdoria')});
 title=createTitle(session,{audio,info:()=>hasSaved?{level:levelOf(world),gold:session.save.character.gold,campaign:session.save.campaign.started,unlocked:session.save.campaign.unlocked}:null,resume:()=>$('continue').click(),startCampaign:()=>$('campaign-start').click(),free:()=>$('enter').click(),maps:()=>gameUI.show('maps'),newCampaign(){const value=freshSave(),result=store.save(value,{backup:true});if(!result.ok){title.show();message(result.message);return;}applySave(session,value);hasSaved=true;settings();$('campaign-start').click();},importFile:()=>$('import-file').click(),exportSave(){if(!hasSaved)return false;$('export').click();return true;}});
 gameUI=createGameUI(session,{gear:gearPanel,grimoire:grimoirePanel,army:armyPanel,lab:{render:()=>labPanel.renderEntry()},maps:{render:()=>mapPanel.render(),canEdit:id=>!!mapLibrary.get(id),edit:id=>{if(!mapLibrary.get(id))return;gameUI.close();leaveMap();input.clear();ui();mapEditor.open(id);}},waves:{render:()=>wavesPanel.render()},valdoria:{render:()=>conquestPanel.render()},equip:(i,id)=>equip(i,id),revive:()=>reviveSession(session),setPaused:value=>{pauseSession(session,value);input.clear();ui();},changed:()=>{input.clear();ui();},focus:()=>{if(!document.querySelector('dialog[open]'))$('view').focus({preventScroll:true});}});
 const labPanel=createLabPanel(session,{view,show:id=>gameUI.show(id),focus:()=>$('view').focus({preventScroll:true}),enter:()=>{if(launchLab(session)){gameUI.close();input.clear();ui();$('view').focus({preventScroll:true});}},exit:()=>{gameUI.close();if(session.save.campaign.started)returnAdventure(session);else go('menu');input.clear();ui();}});
 // Mapas personalizados: biblioteca no navegador (chave própria), editor em tela cheia e aba no Relicário.
 const mapLibrary=createLibrary(storage);
 const leaveMap=()=>{if(session.save.campaign.started)returnAdventure(session);else go('menu');};
 const enterMap=map=>{if(isCustomMap(session))leaveMap();const result=launchMap(session,map,mapLibrary.lookup);if(!result.ok){message(result.message);return;}gameUI.close();input.clear();ui();$('view').focus({preventScroll:true});};
 const mapEditor=createMapEditor({game:view,library:mapLibrary,enemyTypes:ENEMY_TYPES.map((t,index)=>({index,name:t.name})).filter(t=>!(t.index in DISABLED_TYPES)),play:id=>{const map=mapLibrary.get(id);if(map)enterMap(map);},closed:()=>mapPanel.render()});
 const mapPanel=createMapPanel(session,{library:mapLibrary,editor:mapEditor,play:enterMap,exit:()=>{gameUI.close();leaveMap();input.clear();ui();},focus:()=>$('view').focus({preventScroll:true})});
 const conquestPanel=createConquestPanel(session,{changed:()=>{saveNow();ui();},enter:(kind,routeId)=>{const result=launchConquest(session,kind,routeId);if(result.ok){gameUI.close();input.clear();saveNow();ui();$('view').focus({preventScroll:true});}return result;}});
 const wavesPanel=createWavesPanel(session,{valdoria:()=>gameUI.show('valdoria'),available:{expedition:true,classic:true},changed:()=>{saveNow();ui();},mode:value=>{updateSettings(session,{waveMode:value});wavesPanel.render();},enter:()=>{gameUI.close();if((session.save.settings.waveMode==='expedition'?launchExpedition:launchArena)(session)){input.clear();saveNow();ui();$('view').focus({preventScroll:true});}}});
 $('spell-demo').onclick=()=>{go('menu');if(world.armyMode!=='groups'){message('Ative Grupos reais para testar magias.');return;}const r=useProfile(session,SPELL_TEST_PROFILE);if(r.ok){['chuva','explosao','maos','barreira','maldicao','dash'].forEach((id,i)=>equip(i,id));message('Build de magias nível 24 equipada nos seis slots; ela substitui o nível em memória. Para testar sacrifício, troque Dash por Zumbis.');}else message(r.message);ui();};
 $('encounter-wave').onchange=()=>{updateSettings(session,{encounterWave:Number($('encounter-wave').value)});go('menu');};
 $('army-mode').onchange=()=>{updateSettings(session,{armyMode:$('army-mode').value});go('menu');};
 $('enter').onclick=restart;$('reset').onclick=restart;$('menu').onclick=()=>{gameUI?.close();go('menu');};$('pause').onclick=()=>pause();$('cast').onclick=aimCast;
 $('colliders').onchange=()=>view.colliders($('colliders').checked);
 $('dash').onclick=()=>aimDash(input.read());
 $('continue').onclick=()=>{const result=store.load();if(result.status!=='ok'){message(result.message||'Nenhum save disponível.');return;}applySave(session,result.save);settings();if(session.save.campaign.started){if(session.save.campaign.resume==='village')enterVillage(session);else campaignMap(session);ui();}else go('training');message('Personagem e progresso restaurados em uma cena limpa.');};
 $('horde').onchange=()=>{updateSettings(session,{horde:Number($('horde').value)});if(session.scene==='training')restart();else go('menu');};
 $('gear-level').onchange=()=>{const level=Math.max(1,Math.min(60,Math.floor(Number($('gear-level').value))||1));updateSettings(session,{gearLevel:level});$('gear-level').value=level;message('Nível dos itens do treino: '+level+'. Vale para novos drops e para o mercador; troca definitiva virá com as waves da Arena.');};
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
 if(loaded.status==='invalid'||loaded.status==='unavailable')message(loaded.message);else if(loaded.status==='ok')message('Save da v2 encontrado. Use Continuar para retomar personagem e progresso em uma cena limpa.');
 let previous=performance.now(),frames=0,frameTime=0,padFiring=false;
 view.render(world,0);
 function frame(now){const elapsed=Math.max(0,(now-previous)/1000);previous=now;const dt=Math.min(elapsed,.25),scene=session.scene,controls=input.read();refreshAim(controls);if(title?.blocksInput())title.handleControls(controls);else if(gameUI?.blocksInput())gameUI.handleControls(controls);else if(!$('import-dialog').open&&!grimoirePanel.isOpen()&&!gearPanel.isOpen()){if(controls.pause)pause();if(controls.confirm){if(session.scene==='training')aimCast();else restart();}if(controls.fire){if(world.modifiers.lance&&world.lich?.form==='none'&&(world.armyMode!=='groups'||world.army.loadout[0]==='raio')){if(!padFiring)beginChargeSession(session);}else aimCast();}else if(padFiring)releaseChargeSession(session);padFiring=controls.fire;if(controls.dash)aimDash(controls);if(controls.revive)reviveSession(session);if(controls.order)armyOrder();}stepSession(session,dt,controls);for(const name of sounds.observe(session))audio.play(name);audio.setMusic(musicTheme(session,{title:$('tl').classList.contains('on')}));audio.setDuck(world.paused&&['training','village'].includes(session.scene)?PAUSE_DUCK:1);refreshAim();if(scene!==session.scene){input.clear();ui();if(session.scene==='dead'&&session.save.campaign.started)saveNow();}view.render(world,dt,{animateWhilePaused:session.scene==='dead'});frames++;frameTime+=elapsed;
  if(frameTime>=.5){const fps=Math.round(frames/frameTime),r=view.renderer.info.render;frames=0;frameTime=0;$('stats').textContent=`${fps} FPS · ${world.actors.length} personagens · ${r.calls} desenhos · ${r.triangles.toLocaleString('pt-BR')} triângulos`;armyPanel.update();}
  if(world.progressChanged){world.progressChanged=false;saveNow();}campaignPanel?.update();title?.update();gameUI?.update();hud();labPanel.update();
  $('health').textContent=world.player.hp>0?`Vida · ${Math.ceil(world.player.hp)} / ${world.player.maxHp}`:'Você caiu';$('boss-health').hidden=!world.actors.includes(world.boss)||world.boss.hp<=0||!!(world.boss.home&&!world.boss.alert);$('boss-health').textContent=`Rei Caído · ${Math.max(0,world.boss.hp)} / ${world.boss.maxHp}`;
  $('spell-status').textContent=(world.player.barrier>0?'Escudo · '+Math.ceil(world.player.barrier)+' / '+world.player.barrierMax+' · ':'')+Object.entries(world.spellCooldowns).filter(([,t])=>t>1e-9).map(([id,t])=>actionName(id)+' · '+t.toFixed(1)+'s').join(' | ');
  if(world.notice){message(world.notice);world.notice=null;}
  $('mana').textContent=`Mana · ${Math.floor(world.player.mp)} / ${world.player.maxMp}`;$('bolt-cd').textContent=world.castCooldown>1e-9?`Tiro · ${world.castCooldown.toFixed(1)} s`:`Tiro de Osso · ${boltCost(world)} MP`;$('dash-cd').textContent=world.dash.remaining>0?'Dash · protegido':world.dash.cooldown>1e-9?`Dash · ${world.dash.cooldown.toFixed(1)} s`:'Dash pronto · C';const hasDash=world.armyMode!=='groups'||world.army.loadout.includes('dash');if(!hasDash)$('dash-cd').textContent='Dash não equipado';$('dash').disabled=!hasDash||session.scene!=='training'||world.paused||world.dash.cooldown>1e-9;if(world.armyMode==='groups')$('cast').textContent='Slot 1 · '+actionName(world.army.loadout[0]);else $('cast').textContent='Tiro de Osso [1]';
 }
 view.renderer.setAnimationLoop(now=>{try{frame(now);}catch(error){fail(error);}});$('status').textContent='Pronto · '+Object.keys(view.models).length+' modelos carregados';document.body.dataset.ready='true';loading.done();
 window.NecromancerV2={audio,ui:gameUI,campaign:campaignPanel,stage:'E10c',gear:gearPanel,session,world,view,store,cast:()=>castSession(session),dash:controls=>dashSession(session,controls),slot:i=>activateSlot(session,i),equip:(i,id)=>equip(i,id),revive:()=>reviveSession(session),order:p=>orderSession(session,p),pause,restart,go,save:saveNow,preview};
 window.addEventListener('pagehide',()=>{audio.dispose();input.dispose();view.dispose();window.removeEventListener('resize',resize);},{once:true});
}
