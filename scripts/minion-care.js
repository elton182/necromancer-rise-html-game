// Living allies react to visible warnings; they still take damage and obey terrain/leash.
function minionRevive(target=null,fromMenu=false){
 if(!['field','hub'].includes(gameState)||TITLE.active||COMIC.active||P.deadT>0||TITLE.paused&&!fromMenu)return false;
 const eligible=minions.filter(m=>m.dead&&!m.sacrificed&&!m.exploded);
 const m=target?eligible.find(m=>m===target):eligible.sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
 if(!m){floatMsg(minions.some(m=>m.dead)?'Detonados e sacrificados aguardam a recuperação normal.':'Nenhum aliado caído para reanimar.',innerWidth/2,innerHeight*.4,'#d7ba88');return false;}
 if(player.mp<30){floatMsg('Reanimar custa 30 MP · mana insuficiente.',innerWidth/2,innerHeight*.4,'#b49bd5');return false;}
 const index=minions.indexOf(m),angle=index*2.4,q=clampMobLanding(P.x+Math.cos(angle)*1.8,P.y+Math.sin(angle)*1.8,{type:{sc:1}});
 player.mp-=30;m.dead=false;m.hp=Math.max(1,Math.floor(m.maxHp*COMBAT_TUNING.manualReviveHealth));m.deadTimer=0;m.fadeOut=false;m.returning=false;m._lastReviveMsg=null;m._evade=null;m._evadeReaction=0;m.target=null;
 m.mesh.position.set(q.x,.1,q.y);m.mesh.traverse(c=>{if(c.material){c.material.opacity=1;c.material.transparent=false;}});
 playSound('revive');floatMsg('Aliado reanimado · 60% de vida',innerWidth/2,innerHeight*.4,'#b6d69c');updateHUD();updateMinionPanel();menuUpdateSummary();return true;
}
function minionHazards(){
 const hazards=[];
 for(const e of enemies){
  if(e.dead)continue;const a=e.ability,d=MOB_ABILITIES[e.type?.name];
  if(a&&d){if(d.kind==='charge'){if(a.phase!=='recover')hazards.push({x:a.sx,y:a.sy,bx:a.tx,by:a.ty,r:d.width/2+.45});}else if(d.kind==='powerShot')hazards.push({x:e.x,y:e.y,bx:e.x+a.dx*15,by:e.y+a.dy*15,r:.85});else hazards.push({x:a.tx,y:a.ty,r:d.radius+.45});}
  if(e.cap&&['tele','dash'].includes(e.cs))hazards.push({x:e.x,y:e.y,bx:e.x+e.dx*13,by:e.y+e.dy*13,r:1.1});
  if(e.cap&&e.cs==='slam'){hazards.push({x:e.sx,y:e.sy,r:3.75});for(const p of e.ex||[])hazards.push({x:p[0],y:p[1],r:3.45});}
 }
 for(const z of mobZones)if(z.life>0)hazards.push({x:z.x,y:z.y,r:z.radius+.45});
 for(const sh of eshots)if(!sh.friendly&&sh.life>0&&Number.isFinite(sh.vx)&&Number.isFinite(sh.vy))hazards.push({x:sh.x,y:sh.y,bx:sh.x+sh.vx*Math.min(.6,sh.life),by:sh.y+sh.vy*Math.min(.6,sh.life),r:.8});
 return hazards;
}
function minionDanger(x,y,hazards){
 let danger=0;for(const h of hazards){let cx=h.x,cy=h.y;if(h.bx!==undefined){const dx=h.bx-h.x,dy=h.by-h.y,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((x-h.x)*dx+(y-h.y)*dy)/len)):0;cx+=dx*t;cy+=dy*t;}const distance=Math.hypot(x-cx,y-cy);if(distance<h.r)danger+=(h.r-distance+.1)*100;}
 return danger;
}
function minionEvade(m,index,dt,npos){
 if(gameState!=='field'||m.dead||m.returning||m.allyLeap||!['zombie','skeleton','archer'].includes(m.type)||Math.hypot(m.x-npos.x,m.y-npos.z)>LEASH_DIST)return false;
 m._evadeCooldown=Math.max(0,(m._evadeCooldown||0)-dt);const hazards=minionHazards(),danger=minionDanger(m.x,m.y,hazards);
 if(!m._evade&&danger<=0){m._evadeReaction=0;if(m.target&&!m.target.dead){const dx=m.target.x-m.x,dy=m.target.y-m.y,d=Math.hypot(dx,dy)||1;if(minionDanger(m.x+dx/d*.7,m.y+dy/d*.7,hazards)>0)return true;}return false;}
 if(!m._evade&&danger>0){
  if(m._evadeCooldown>0)return false;
  m._evadeReaction=(m._evadeReaction||0)+dt;if(m._evadeReaction<.12+(index%3)*.02)return false;
  let best=null,bestScore=Infinity;
  for(const length of [2.2,3.5])for(let i=0;i<16;i++){
   const a=i*Math.PI/8+index*.7;let x=m.x+Math.cos(a)*length,y=m.y+Math.sin(a)*length;
   const dx=x-npos.x,dy=y-npos.z,d=Math.hypot(dx,dy),limit=LEASH_DIST-.8;if(d>limit){x=npos.x+dx/d*limit;y=npos.z+dy/d*limit;}
   const q=clampMobLanding(x,y,{type:{sc:1}}),travel=Math.hypot(q.x-m.x,q.y-m.y);if(travel<.2)continue;
   const score=minionDanger(q.x,q.y,hazards)*10+travel+Math.hypot(q.x-npos.x,q.y-npos.z)*.03;
   if(score<bestScore){best={x:q.x,y:q.y,left:.85};bestScore=score;}
  }
  m._evadeReaction=0;if(!best||minionDanger(best.x,best.y,hazards)>=danger)return false;m._evade=best;m._evadeCooldown=1.35;m.target=null;
 }
 if(!m._evade)return false;
 const goal=m._evade;goal.left-=dt;const dx=goal.x-m.x,dy=goal.y-m.y,d=Math.hypot(dx,dy);
 if(d<.001||(d<.15&&danger<=0)||goal.left<=0){m._evade=null;return true;}
 const step=Math.min(d,m.spd*1.35*dt),q=clampMobLanding(m.x+dx/d*step,m.y+dy/d*step,{type:{sc:1}});m.mesh.position.x=q.x;m.mesh.position.z=q.y;if(dx)m.face=dx>0?1:-1;
 if(typeof blockByCorpseWalls==='function')blockByCorpseWalls(m,.35);return true;
}
function minionCarePanel(){
 const body=document.querySelector('.pmbody');if(PM.tab!=='horde'||!body)return;
 const section=document.createElement('section');section.className='minion-care';section.innerHTML='<h3>Vida e reanimação</h3><p>V ou o aviso no campo: reanima um caído comum por 30 MP, com 60% de vida. O retorno automático traz 50%. Detonados e sacrificados aguardam seus próprios tempos. A regeneração cresce com a vida máxima, inclusive a recebida dos equipamentos.</p><div class="minion-care-members"></div>';
 for(const [index,m]of minions.entries()){
  const row=document.createElement('div');row.className='minion-care-row';const label=document.createElement('span');label.textContent=(m.def?.name||m.type)+' #'+(index+1)+' · '+Math.ceil(m.hp)+' / '+m.maxHp+' HP · '+Number((m.hpRegen||0).toFixed(2))+' HP/s';row.append(label);
  if(m.dead){if(m.sacrificed||m.exploded){const pending=document.createElement('span');pending.textContent='Recupera em '+Math.ceil(m.deadTimer)+' s · tempo avança fora da pausa';row.append(pending);}else{const b=document.createElement('button');b.className='btn';b.textContent='Reanimar #'+(index+1)+' · 30 MP';b.disabled=player.mp<30;b.onclick=()=>{minionRevive(m,true);tPause('horde');};row.append(b);}}
  section.querySelector('.minion-care-members').append(row);
 }
 if(!minions.length)section.insertAdjacentHTML('beforeend','<p>Equipe uma evocação para trazer seu grupo.</p>');body.append(section);
}
(function installMinionCare(){
 const damage=dealDamageToMinion;dealDamageToMinion=function(m,amount){
  const frontline=['zombie','skeleton','abom'].includes(m.type),multiplier=COMBAT_TUNING.frontlineDamageTaken??1;
  return damage(m,frontline&&amount>0?Math.max(1,Math.round(amount*multiplier)):amount);
 };
 tryReanimate=()=>minionRevive();
 const hud=updateHUD;updateHUD=function(){const result=hud(),hint=document.getElementById?.('reanimate-hint');if(hint){const ready=gameState==='field'&&minions.some(m=>m.dead&&!m.sacrificed&&!m.exploded);hint.disabled=!ready||player.mp<30;hint.style.pointerEvents=ready?'auto':'none';hint.textContent='V · Reanimar agora (30 MP)'+(ready&&player.mp<30?' · mana insuficiente':'');}return result;};
 const intent=updateMinionIntent;updateMinionIntent=function(m,index,dt,npos){if(!minionEvade(m,index,dt,npos))return intent(m,index,dt,npos);};
 const kill=killMinion;killMinion=function(m){m._evade=null;m._evadeReaction=0;return kill(m);};
 const pause=tPause;tPause=function(tab){pause(tab);minionCarePanel();};
})();
