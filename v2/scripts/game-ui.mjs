import {ACTIONS,available,actionName} from './actions.mjs';
import R from './horde-rules.mjs';
import {boltCost} from './combat.mjs';
import {SPELL_RULES} from './spells.mjs';
import {levelOf,points,snapshotFor,xpNext} from './progression.mjs';
import {returnAdventure,D} from './campaign.mjs';
import Endgame from './shared-endgame.mjs';
import portrait from './shared-portrait.mjs';
const ICON={empty:'—',raio:'⚡',dash:'➶',zombie:'🧟',skeleton:'💀',archer:'🏹',specter:'👻',abom:'👹',chuva:'🦴',explosao:'💥',maos:'🖐',barreira:'🛡',maldicao:'🕯'};
const KEYS=['M1 · 1','M2 · 2','3 · Q','4 · E','5 · R','6 · T'];
export function createGameUI(s,handlers){
 const $=id=>document.getElementById(id),w=s.world,menu=$('pause-dialog'),picker=$('action-picker'),help=$('help-dialog');let tab='character',lastUpdate=0,pickerSlot=0,previousPause=true,overlayPause=true,overlayScene=s.scene,padTime=0;
 const node=(tag,text,parent)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;parent?.append(e);return e;};
 const button=(text,fn,parent)=>{const b=node('button',text,parent);b.type='button';b.onclick=fn;return b;};
 $('menu-system').append($('legacy-settings'));
 $('menu-army').append($('army-tools'));$('army-tools').open=true;
 $('menu-character').prepend(document.querySelector('.resources'));
 $('inv-bar').append($('items'));
 $('menu-shortcuts').append($('open-gear'),$('open-grimoire'));
 $('game-nav').prepend($('pause'));
 $('legacy-actions').append($('reset'),$('menu'));
 $('cast').hidden=true;$('dash').hidden=true;
 const skills=node('section',undefined,$('menu-body'));skills.dataset.menuPanel='skills';skills.hidden=true;skills.append($('grimoire-warning'),$('grimoire-content'),$('grimoire-message'));
 const equipment=node('section',undefined,$('menu-body'));equipment.dataset.menuPanel='equipment';equipment.hidden=true;equipment.append($('gear-content'),$('gear-message'));
 const wavesSection=node('section',undefined,$('menu-body'));wavesSection.dataset.menuPanel='waves';wavesSection.hidden=true;wavesSection.id='waves-content';
 const valdoriaSection=node('section',undefined,$('menu-body'));valdoriaSection.dataset.menuPanel='valdoria';valdoriaSection.hidden=true;valdoriaSection.id='valdoria-content';
 const defs=[['character','Personagem'],['skills','Habilidades'],['horde','Horda'],['equipment','Equipamentos'],['waves','Waves'],['valdoria','Valdoria'],['system','Sistema']];
 for(const [id,title] of defs){const b=button(title,()=>selectTab(id),$('menu-tabs'));b.dataset.menuTab=id;b.setAttribute('role','tab');}
 function selectTab(id){tab=id;menu.dataset.tab=id;for(const p of menu.querySelectorAll('[data-menu-panel]'))p.hidden=p.dataset.menuPanel!==id;for(const b of $('menu-tabs').children){b.setAttribute('aria-selected',String(b.dataset.menuTab===id));b.classList.toggle('on',b.dataset.menuTab===id);}if(id==='skills')handlers.grimoire.render();if(id==='equipment')handlers.gear.render();if(id==='waves')handlers.waves.render();if(id==='valdoria')handlers.valdoria.render();handlers.army.update(true);update(true);}
 function show(id='character'){
  if(picker.open||help.open)return;if((id==='waves'||id==='valdoria')&&s.scene!=='village')id='character';previousPause=w.paused;overlayScene=s.scene;handlers.setPaused(true);selectTab(id);if(!menu.open)menu.showModal();$('close-reliquary').focus();
 }
 function close(){if(menu.open)menu.close();}
 menu.addEventListener('close',()=>{if(s.scene===overlayScene)handlers.setPaused(previousPause&&s.scene!=='training'&&s.scene!=='village');handlers.focus();});
 menu.addEventListener('cancel',e=>{e.preventDefault();close();});
 $('close-reliquary').onclick=close;$('resume-game').onclick=close;
 $('open-reliquary').onclick=()=>show('system');
 $('menu-campaign-return').onclick=()=>{returnAdventure(s);menu.close();handlers.changed();};
 $('open-gear').onclick=()=>show('equipment');$('open-grimoire').onclick=()=>show('skills');
 handlers.gear.setClose?.(close);handlers.gear.isOpen=()=>menu.open&&tab==='equipment';handlers.gear.toggle=()=>handlers.gear.isOpen()?close():show('equipment');handlers.grimoire.isOpen=()=>menu.open&&tab==='skills';
 function showHelp(){if(help.open){help.close();return;}if(picker.open)return;overlayPause=w.paused;overlayScene=s.scene;handlers.setPaused(true);help.showModal();}
 $('open-help').onclick=showHelp;$('footer-help').onclick=showHelp;$('close-help').onclick=()=>help.close();help.addEventListener('close',()=>{if(!menu.open&&s.scene===overlayScene)handlers.setPaused(overlayPause);handlers.focus();});help.addEventListener('cancel',e=>{e.preventDefault();help.close();});
 $('close-picker').onclick=()=>picker.close();picker.addEventListener('close',()=>{if(!menu.open&&s.scene===overlayScene)handlers.setPaused(overlayPause);handlers.focus();});picker.addEventListener('cancel',e=>{e.preventDefault();picker.close();});
 function chooseSlot(i){if(w.armyMode!=='groups'){show('horde');return;}overlayPause=w.paused;overlayScene=s.scene;handlers.setPaused(true);pickerSlot=i;$('picker-title').textContent='Slot '+(i+1)+' · '+KEYS[i];$('picker-options').replaceChildren();$('picker-message').textContent='';
  for(const id of ACTIONS){const b=button('',()=>{const result=handlers.equip(pickerSlot,id);$('picker-message').textContent=result.message||'Habilidade equipada.';if(result.ok){picker.close();update(true);}},$('picker-options'));b.className='group-choice';b.dataset.pickerSkill=id;b.disabled=!available(w.army,id);node('span',ICON[id],b);const description=node('div',undefined,b);node('b',actionName(id),description);node('small',id==='empty'?'Liberar este slot':cost(id)?cost(id)+' MP':id==='dash'?'Sem mana · recarga própria':'Grupo da horda',description);if(w.army.loadout[i]===id)b.classList.add('equipped');}
  picker.showModal();
 }
 const slotButtons=[];for(let i=0;i<6;i++){const b=button('',()=>chooseSlot(i),$(i<3?'skill-slots-left':'skill-slots-right'));b.className='action-equipped';b.dataset.hudSlot=i;const key=node('small',KEYS[i],b),icon=node('span','',b),name=node('b','',b),state=node('em','',b),cd=node('i','',b);cd.className='action-cd';slotButtons.push({b,icon,name,state,cd});}
 $('sp-pts-txt').setAttribute('role','button');$('sp-pts-txt').tabIndex=0;$('sp-pts-txt').onclick=()=>show('skills');$('sp-pts-txt').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show('skills');}};
 $('reanimate-hint').onclick=()=>{handlers.revive();update(true);};
 function cost(id){return id==='raio'?boltCost(w):SPELL_RULES[id]?.cost||0;}
 function cooldown(id){return id==='raio'?w.castCooldown:id==='dash'?w.dash.cooldown:w.spellCooldowns[id]||w.army?.cooldowns[id]||0;}
 function map(){const canvas=$('hud-minimap'),ctx=canvas.getContext('2d'),b=w.arena.bounds,pad=6,scale=Math.min((canvas.width-pad*2)/(b.maxX-b.minX),(canvas.height-pad*2)/(b.maxY-b.minY)),ox=(canvas.width-(b.maxX-b.minX)*scale)/2-b.minX*scale,oy=(canvas.height-(b.maxY-b.minY)*scale)/2-b.minY*scale;
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#0b140fee';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#7f805b';ctx.strokeRect(b.minX*scale+ox,b.minY*scale+oy,(b.maxX-b.minX)*scale,(b.maxY-b.minY)*scale);
  for(const r of w.arena.walk||[]){ctx.fillStyle='#53644a';ctx.fillRect(r.x0*scale+ox,r.y0*scale+oy,(r.x1-r.x0)*scale,(r.y1-r.y0)*scale);}
  for(const solid of w.arena.solids){ctx.fillStyle=solid.door?'#c67b61':'#273a2b';if(solid.kind==='circle'){ctx.beginPath();ctx.arc(solid.x*scale+ox,solid.y*scale+oy,solid.r*scale,0,Math.PI*2);ctx.fill();}else ctx.fillRect((solid.x-solid.width/2)*scale+ox,(solid.y-solid.depth/2)*scale+oy,solid.width*scale,solid.depth*scale);}
  for(const a of w.actors){if(a.hp<=0)continue;ctx.fillStyle=a===w.player?'#d7fff1':a.team==='enemy'?'#f47d68':a.team==='neutral'?'#e1c47a':'#8dc58b';ctx.beginPath();ctx.arc(a.x*scale+ox,a.y*scale+oy,a===w.player?3:a===w.boss?3:1.8,0,Math.PI*2);ctx.fill();}if(w.portal){ctx.strokeStyle='#bd8ce3';ctx.beginPath();ctx.arc(w.portal.x*scale+ox,w.portal.y*scale+oy,3.5,0,Math.PI*2);ctx.stroke();}
 }
 function update(force=false){const now=performance.now();if(!force&&now-lastUpdate<100)return;lastUpdate=now;const p=w.player,c=s.save.character,level=levelOf(w),next=xpNext(level),run=w.adventure;
  document.body.dataset.story=String(!!w.story);document.body.dataset.adventureDone=String(!!run?.done);
  $('hp-vessel').style.setProperty('--fill',Math.max(0,Math.min(100,p.hp/p.maxHp*100))+'%');$('mp-vessel').style.setProperty('--fill',Math.max(0,Math.min(100,p.mp/p.maxMp*100))+'%');$('hp-val').textContent=Math.ceil(Math.max(0,p.hp))+'/'+p.maxHp;$('mp-val').textContent=Math.floor(p.mp)+'/'+p.maxMp;
  $('level-txt').textContent='NV. '+level;$('hud-level').textContent='NV. '+level;$('gold-txt').textContent=c.gold+' ouro';$('sp-pts-txt').textContent='✦ '+points(level,w.army?.profile.ranks||{})+' pts';$('exp-fill').style.width=(next?Math.min(100,c.exp/next*100):100)+'%';$('exp-val').textContent=next?Math.floor(c.exp)+' / '+next+' XP':'Nível máximo';
  const location=s.scene==='village'?'Vila de Eldrin':run?.kind==='stage'?D.stages[run.n].name:run?.mission?.label||'Campo de treino';$('wave-txt').textContent=location;$('hud-location').textContent=location;$('minimap-caption').textContent=s.scene==='village'?'ELDRIN':run?.conquest?'VALDORIA':run?.kind==='expedition'?'EXPEDIÇÃO':run?.kind==='arena'?'ARENA':run?.zones?.length?'TRILHA':run?.n===1?'CRIPTA':'VALDORIA';$('hud-objective').textContent=run?.conquest?Endgame.encounters[run.conquest.kind].name+' · D'+run.conquest.difficulty+' · maldições '+run.conquest.reward.score+' · influência '+c.conquest.influence+'% · '+(run.cleared?'líder derrotado':'líder a '+Math.round(Math.hypot(run.exit.x-p.x,run.exit.y-p.y))+' u'):run?.kind==='expedition'?'Wave '+run.wave+' · '+(run.cleared?'boss derrotado · G no portal final':'boss a '+Math.round(Math.hypot(run.exit.x-p.x,run.exit.y-p.y))+' u')+' · recorde '+c.waveProgress.best:run?.kind==='arena'?(run.done?'Waves concluídas':'Wave '+Math.max(run.wave,run.start)+' · recorde '+c.waveProgress.best):run?.done?'Encontro concluído':run?.wave?'Onda '+run.wave:run?.n===1?'Limpe as salas para abrir as portas':'';
  const loadout=w.army?.loadout||['raio','empty','dash','empty','empty','empty'];for(let i=0;i<6;i++){const id=loadout[i],o=slotButtons[i],cd=cooldown(id),group=w.actors.filter(a=>a.groupType===id),alive=group.filter(a=>a.hp>0).length,needed=cost(id),locked=id==='empty'||w.army&&!available(w.army,id),low=p.mp<needed;o.icon.textContent=ICON[id];o.name.textContent=actionName(id);o.state.textContent=locked?'Vazio':group.length?alive+'/'+group.length+' vivos':needed?needed+' MP':id==='dash'?'Sem mana':'Habilidade';o.b.classList.toggle('locked',!!locked);o.b.classList.toggle('no-mana',low);o.b.title=actionName(id)+' · '+KEYS[i]+' · '+(cd>0?cd.toFixed(1)+' s de recarga':low?'Mana insuficiente':'Clique para trocar');o.b.setAttribute('aria-label','Slot '+(i+1)+': '+o.b.title);o.cd.hidden=cd<=1e-9;o.cd.textContent=cd>0?cd.toFixed(1)+'s':'';}
  const allies=w.actors.filter(a=>a.groupType),live=allies.filter(a=>a.hp>0).length;$('hud-slots').textContent='HORDA · '+live+'/'+allies.length+' integrantes';$('horde-status').replaceChildren();for(const type of R.types){const group=allies.filter(a=>a.groupType===type);if(!group.length)continue;const b=button(ICON[type]+' '+group.filter(a=>a.hp>0).length+'/'+group.length,()=>show('horde'),$('horde-status'));b.title=R.defs[type].name+' · gerenciar horda';}
  $('reanimate-hint').hidden=s.scene!=='training'||!allies.some(a=>a.hp<=0&&!a.sacrificed&&!a.exploded);$('reanimate-hint').disabled=p.mp<30||w.paused;
  const boss=w.boss,bossAlive=w.actors.includes(boss)&&boss.hp>0&&!(boss.home&&!boss.alert);$('boss-bar').hidden=!bossAlive;if(bossAlive){$('boss-fill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';$('boss-numbers').textContent=Math.ceil(boss.hp)+' / '+boss.maxHp;$('boss-phase').textContent=boss.kingPhase2?'FASE II · A COROA DESPERTA':'FASE I';}
  $('menu-campaign-return').hidden=!s.save.campaign.started||s.scene==='menu';$('menu-campaign-return').textContent=s.save.campaign.village?'Voltar à vila':'Voltar ao mapa';$('open-reliquary').hidden=s.scene==='training';$('pause').hidden=s.scene!=='training';if(s.scene==='training')$('pause').textContent='☰ Relicário · Esc';if(menu.open&&!w.paused&&['training','village'].includes(s.scene))menu.close();
  if(menu.open){summary(level,p,c);if(tab==='character'){const a=snapshotFor(w).attributes;$('character-summary').replaceChildren();node('h3','Atributos de Zephyr',$('character-summary'));const list=node('dl',undefined,$('character-summary'));for(const [key,title] of [['hp','Vida máxima'],['mp','Mana máxima'],['spell','Dano mágico'],['defense','Defesa'],['move','Movimento'],['regen','Regeneração de mana'],['hpRegen','Regeneração de vida']]){node('dt',title,list);node('dd',Number(a[key]||0).toLocaleString('pt-BR',{maximumFractionDigits:2}),list);}}}
  for(const name of ['waves','valdoria']){const wt=$('menu-tabs').querySelector('[data-menu-tab="'+name+'"]');if(wt)wt.hidden=s.scene!=='village';}if((tab==='waves'||tab==='valdoria')&&s.scene!=='village')selectTab('character');
  map();
 }
 function summary(level,p,c){const box=$('menu-summary');box.replaceChildren();const img=node('img',undefined,box);img.className='menu-portrait';img.src=portrait;img.alt='Retrato de Zephyr';node('b','ZEPHYR · NÍVEL '+level,box);node('span','Vida '+Math.ceil(p.hp)+' / '+p.maxHp,box);node('span','Mana '+Math.floor(p.mp)+' / '+p.maxMp,box);node('span',c.gold+' ouro',box);node('span',points(level,w.army?.profile.ranks||{})+' pontos',box);}
 function reflectPause(value){if(value&&!menu.open)show('character');else if(!value&&menu.open)close();}
 function blocksInput(){return menu.open||picker.open||help.open;}
 function handleControls(c){if(c.pause){if(help.open)help.close();else if(picker.open)picker.close();else close();return;}const active=help.open?help:picker.open?picker:menu;if(!active.open)return;const elements=[...active.querySelectorAll('button:not(:disabled),select,input,summary')].filter(e=>e.getClientRects().length),now=performance.now();if(Math.hypot(c.x,c.y)>.5&&now-padTime>180){padTime=now;const index=elements.indexOf(document.activeElement),direction=(Math.abs(c.y)>Math.abs(c.x)?c.y:c.x)>0?1:-1;elements[(index+direction+elements.length)%elements.length]?.focus();}if(c.confirm){const target=document.activeElement;if(target?.tagName==='BUTTON'||target?.tagName==='SUMMARY')target.click();else elements[0]?.focus();}}
 selectTab('character');update(true);return {update,show,close,showHelp,reflectPause,blocksInput,handleControls,chooseSlot};
}
