// Dedicated atlas screen, sharing pause/input lifecycle with the game menu.
function endgameScreen(){
 const current=endgameEnsure(),latest=EndgameModel.latestDifficulty(current);
 if(latest.difficulty!==current.difficulty){player.conquest=latest;ENDGAME.routeSelected=null;saveGame();}
 ENDGAME.difficulty=player.conquest.difficulty;
 PM.tab='conquest';TITLE.view='pause';
 tScreen(w=>{
  document.body.classList.add('conquest-view');
  const screen=document.createElement('section');screen.className='conquest-screen';screen.setAttribute('role','dialog');screen.setAttribute('aria-modal','true');screen.setAttribute('aria-labelledby','conquest-screen-title');
  screen.innerHTML='<header class="conquest-screen-header"><div><small>CONQUISTA DE VALDORIA</small><h1 id="conquest-screen-title">Pântano da Febre Negra</h1></div><div class="conquest-screen-progress"></div><button class="btn conquest-back" type="button">Voltar à vila · Esc</button></header><div class="conquest-screen-body"></div><footer class="conquest-screen-footer"><div class="conquest-departure-summary" aria-live="polite"></div><div class="conquest-departure-action"></div></footer>';
  w.append(screen);screen.querySelector('.conquest-back').onclick=()=>setPause(false);
  endgameRender(screen.querySelector('.conquest-screen-body'));
  screen.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setPause(false);return;}
   if(e.key!=='Tab')return;
   const elements=[...screen.querySelectorAll('button:not(:disabled),input:not(:disabled),select,summary,[tabindex="0"]')].filter(el=>el.getClientRects().length),index=elements.indexOf(document.activeElement);
   if(e.shiftKey&&index<=0){e.preventDefault();elements.at(-1)?.focus();}else if(!e.shiftKey&&index===elements.length-1){e.preventDefault();elements[0]?.focus();}
  });
  screen.querySelector('.conquest-back').focus({preventScroll:true});
 });
}
function endgameScreenSelection(host,node,state,difficulty,button){
 const screen=host.closest('.conquest-screen');if(!screen)return;
 const reward=EndgameModel.rewards(state,node.kind,difficulty,state.offers[difficulty].selected);
 screen.querySelector('.conquest-departure-summary').textContent=EndgameModel.routeBiomes[node.biome].name+' · D'+difficulty+' · Intensidade '+reward.score+' · Loot nv. '+reward.itemLevel+' · +'+reward.influence+'% influência';
 screen.querySelector('.conquest-departure-action').replaceChildren(button);
 const rewards=screen.querySelector('.conquest-rewards p');if(rewards)rewards.textContent='Conclusão: +'+reward.influence+'% influência · '+reward.gold+' ouro · '+reward.xp+' XP.';
}
function endgameScreenLayout(body){
 const root=body.querySelector('.conquest-panel'),screen=body.closest('.conquest-screen');if(!root||!screen)return;
 const state=endgameEnsure(),atlas=root.querySelector('.conquest-atlas'),detail=atlas._routeDetail,settings=root.querySelector('.conquest-settings'),curses=root.querySelector('.conquest-curses'),rewards=root.querySelector('.conquest-rewards');
 const mapPane=document.createElement('div');mapPane.className='conquest-map-pane';mapPane.append(atlas);
 const toolbar=document.createElement('div');toolbar.className='conquest-map-toolbar';
 const label=document.createElement('label');label.textContent='Local ';const select=document.createElement('select');select.setAttribute('aria-label','Local do mapa');
 for(const node of EndgameModel.routeGraph(state.seed)){const option=document.createElement('option');option.value=node.id;option.textContent=(node.id==='entry'?'Entrada':node.id==='tower'?'Torre':node.depth+'.'+(node.lane+1))+' · '+node.label;select.append(option);}select.value=ENDGAME.routeSelected;
 select.onchange=()=>atlas.querySelector('[data-map-route="'+select.value+'"]').click();label.append(select);
 const zoom=document.createElement('button');zoom.type='button';zoom.className='btn';zoom.textContent='Ampliar mapa';zoom.setAttribute('aria-pressed','false');zoom.onclick=()=>{const active=atlas.querySelector('.atlas-scroll').classList.toggle('zoomed');zoom.setAttribute('aria-pressed',String(active));zoom.textContent=active?'Ajustar à tela':'Ampliar mapa';fitMap();};
 toolbar.append(label,zoom);atlas.querySelector('.atlas-title').after(toolbar);
 const side=document.createElement('aside');side.className='conquest-preparation';side.setAttribute('aria-label','Preparação da rota');
 const options=document.createElement('div');options.className='conquest-preparation-options';
 const resetHelp=document.createElement('p');resetHelp.className='conquest-difficulty-help';resetHelp.textContent='Maior liberada: '+state.unlocked+'. Trocar o nível reinicia o mapa.';
 const heading=document.createElement('h3');heading.textContent='Maldições · '+state.offers[ENDGAME.difficulty].selected.length+'/3';
 const help=document.createElement('p');help.className='conquest-curse-help';help.textContent='Escolha até três. Mais risco melhora o loot.';
 const rewardDetails=document.createElement('details');rewardDetails.className='conquest-reward-details';const summary=document.createElement('summary');summary.textContent='Recompensas e efeito especial';rewardDetails.append(summary,rewards);
 options.append(settings,resetHelp,heading,help,curses,rewardDetails);side.append(detail,options);
 root.replaceChildren(mapPane,side);
 const scroll=atlas.querySelector('.atlas-scroll'),canvas=scroll.querySelector('canvas');
 function fitMap(){canvas.style.maxWidth=scroll.classList.contains('zoomed')?'none':Math.max(1,Math.min(scroll.clientWidth,scroll.clientHeight*2))+'px';}
 ENDGAME.screenObserver=new ResizeObserver(fitMap);ENDGAME.screenObserver.observe(scroll);fitMap();
 screen.querySelector('.conquest-screen-progress').innerHTML='<b>'+state.influence+'% de influência</b><progress aria-label="Influência no pântano" max="100" value="'+state.influence+'"></progress><small>'+(state.conquered?'Torre conquistada · Fragmento obtido':state.routes.completed.length+' áreas concluídas · avance até a torre')+'</small>';
}
(function installEndgameScreen(){
 const cleanup=()=>{ENDGAME.screenObserver?.disconnect();ENDGAME.screenObserver=null;};
 const render=endgameRender;endgameRender=function(body){const scroll=body.querySelector('.conquest-preparation-options')?.scrollTop||0;cleanup();render(body);if(body.closest('.conquest-screen')){endgameScreenLayout(body);body.querySelector('.conquest-preparation-options').scrollTop=scroll;}};
 const pause=setPause;setPause=function(on){if(!on){cleanup();document.body.classList.remove('conquest-view');}return pause(on);};
 const build=tScreen;tScreen=function(...args){cleanup();document.body.classList.remove('conquest-view');return build(...args);};
})();
