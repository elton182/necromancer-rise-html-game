// Automatic minion abilities: each type casts its own move on a cooldown while its prey is in reach.
// Commanded specials (explosion, strong shot, leap, step) stay on the action slots; these need no input.
const MINION_ABILITIES={
 zombie:{name:'Mordida Pútrida',icon:'🦷',cooldown:7,color:'#9dbf68',desc:'Morde o alvo: 150% de dano e 35% de lentidão por 3 s (chefes não ficam lentos).'},
 skeleton:{name:'Golpe Giratório',icon:'⚔',cooldown:6,color:'#e5d397',desc:'Gira a lâmina: 130% de dano em todos os inimigos a até 2,2 u.'},
 archer:{name:'Rajada Tripla',icon:'🏹',cooldown:8,color:'#e8e0c0',desc:'Dispara 3 flechas de 90% de dano em até 3 alvos diferentes.'},
 specter:{name:'Investida Fantasma',icon:'👻',cooldown:9,color:'#b6c4ec',desc:'Atravessa o alvo a até 5 u e reaparece atrás dele: 200% de dano.'},
 abom:{name:'Rugido Pútrido',icon:'👹',cooldown:10,color:'#aac679',desc:'Ruge contra quem está perto: 100% de dano a até 3 u e 35% de lentidão por 2 s (chefes só sofrem o dano).'}
};
let minionAbilityLabels=[];
function minionAbilityDamage(m,multiplier){return Math.max(1,Math.round((typeof skillDamage==='function'?skillDamage(m):m.dmg)*multiplier));}
function minionAbilityFoes(x,y,radius){return enemies.filter(e=>!e.dead&&!(e.spawnT>0)&&Math.hypot(e.x-x,e.y-y)<=radius);}
function minionSlowEnemy(e,amount,duration){
 if(e.isBoss||e.cap)return; // Bosses keep their scripted pacing.
 e.minionSlow=Math.max(e.minionSlowT>0?e.minionSlow||0:0,amount);e.minionSlowT=Math.max(e.minionSlowT||0,duration);
}
function minionAbilityReady(m,npos){
 const t=m.target;
 if(gameState!=='field'||m.dead||m.allyLeap||m.returning||m._evade||P.deadT>0)return null;
 if(minionCommand&&minionCommand.type==='rally')return null;
 if(!t||t.dead||t.spawnT>0||!enemies.includes(t)||!minionTargetAllowed(t,npos))return null;
 return {t,d:Math.hypot(t.x-m.x,t.y-m.y),reach:m.atkR+.3*(t.type?.sc||1)+.2};
}
// Returns true when the ability fired; the cooldown only starts on a real cast.
function castMinionAbility(m,npos){
 const ready=minionAbilityReady(m,npos);if(!ready)return false;
 const {t,d,reach}=ready,def=MINION_ABILITIES[m.type];
 if(m.type==='zombie'){
  if(d>reach)return false;
  dealDamageToEnemy(t,minionAbilityDamage(m,1.5));minionSlowEnemy(t,.35,3);burst(t.x,t.y,def.color,12,2);
 }else if(m.type==='skeleton'){
  const foes=minionAbilityFoes(m.x,m.y,2.2);if(d>reach||!foes.length)return false;
  const damage=minionAbilityDamage(m,1.3);foes.forEach(e=>dealDamageToEnemy(e,damage));ring(m.x,m.y,2.2,def.color,.45);
 }else if(m.type==='archer'){
  if(d>reach)return false;
  const others=minionAbilityFoes(m.x,m.y,m.atkR+1).filter(e=>e!==t&&minionTargetAllowed(e,npos)).sort((a,b)=>Math.hypot(a.x-m.x,a.y-m.y)-Math.hypot(b.x-m.x,b.y-m.y));
  const targets=[t,others[0]||t,others[1]||others[0]||t],damage=minionAbilityDamage(m,.9);
  targets.forEach((e,i)=>{const dx=e.x-m.x,dy=e.y-m.y,len=Math.hypot(dx,dy)||1;eshots.push({friendly:true,tgt:e,x:m.x+(m.face||1)*.5,y:m.y+(i-1)*.2,vx:dx/len*15,vy:dy/len*15,dmg:damage,kind:'arrow',life:1.6,z:1.1});});
 }else if(m.type==='specter'){
  if(d>5)return false;
  const dx=t.x-m.x,dy=t.y-m.y,len=d||1,sx0=m.x,sy0=m.y;let x=t.x+dx/len*1.2,y=t.y+dy/len*1.2;
  const fx=x-npos.x,fy=y-npos.z,far=Math.hypot(fx,fy),limit=LEASH_DIST-.5;if(far>limit){x=npos.x+fx/far*limit;y=npos.z+fy/far*limit;}
  const q=clampMobLanding(x,y,{type:{sc:1}});ring(sx0,sy0,.7,def.color,.4);m.mesh.position.x=q.x;m.mesh.position.z=q.y;
  dealDamageToEnemy(t,minionAbilityDamage(m,2));ring(q.x,q.y,.9,def.color,.5);burst(t.x,t.y,def.color,14,2);
 }else if(m.type==='abom'){
  const foes=minionAbilityFoes(m.x,m.y,3);if(!foes.length||(foes.length<2&&d>reach))return false;
  const damage=minionAbilityDamage(m,1);
  foes.forEach(e=>{dealDamageToEnemy(e,damage);if(e.dead||e.dummy)return;minionSlowEnemy(e,.35,2);});
  ring(m.x,m.y,3,def.color,.6);burst(m.x,m.y,def.color,20,3);
 }else return false;
 m.swing=m.type==='zombie'||m.type==='abom'?.5:.28;m._pa=m.atkTimer||0;
 m._abilityCd=def.cooldown;minionAbilityLabels.push({m,text:def.icon+' '+def.name,color:def.color,t:.9});
 return true;
}
function minionAbilityTick(m,index,dt,npos){
 if(!MINION_ABILITIES[m.type]||m.dead)return;
 // Stagger the first cast so a fresh group does not fire in unison.
 if(m._abilityCd===undefined)m._abilityCd=MINION_ABILITIES[m.type].cooldown*(.3+.15*(index%4));
 m._abilityCd=Math.max(0,m._abilityCd-dt);
 if(m._abilityCd<=0)castMinionAbility(m,npos);
}
function minionAbilityStatus(dt){
 for(const e of enemies)if(e.minionSlowT>0){e.minionSlowT=Math.max(0,e.minionSlowT-dt);if(e.minionSlowT<=0)e.minionSlow=0;}
 for(const l of minionAbilityLabels)l.t-=dt;minionAbilityLabels=minionAbilityLabels.filter(l=>l.t>0&&!l.m.dead);
}
function drawMinionAbilities(){
 ctx.save();ctx.textAlign='center';ctx.font='bold 11px Georgia';ctx.lineWidth=3;ctx.strokeStyle='#080e08';
 for(const e of enemies)if(!e.dead&&e.minionSlowT>0){ctx.globalAlpha=.55;ctx.strokeStyle='#9dbf68';ctx.beginPath();ctx.ellipse(sx(e.x),sy(e.y),.55*S*(e.type?.sc||1),.3*S*(e.type?.sc||1),0,0,Math.PI*2);ctx.stroke();}
 ctx.strokeStyle='#080e08';
 for(const l of minionAbilityLabels){const x=sx(l.m.x),y=sy(l.m.y)-S*(1.6+(.9-l.t)*.6);ctx.globalAlpha=Math.min(1,l.t*2.5);ctx.strokeText(l.text,x,y);ctx.fillStyle=l.color;ctx.fillText(l.text,x,y);}
 ctx.restore();
}
function minionAbilityPanel(){
 const body=document.querySelector('.pmbody');if(PM.tab!=='horde'||!body)return;
 const section=document.createElement('section');section.className='minion-care minion-abilities';section.innerHTML='<h3>Habilidades automáticas</h3><p>Cada aliado usa a sua sozinho quando o alvo está ao alcance. A recarga é individual e só começa quando a habilidade é usada.</p>';
 for(const [type,a] of Object.entries(MINION_ABILITIES)){
  const row=document.createElement('div');row.className='minion-care-row';const label=document.createElement('span');
  label.textContent=a.icon+' '+(MINION_DEFS[type]?.name||type)+' · '+a.name+' · recarga '+a.cooldown+' s — '+a.desc;row.append(label);section.append(row);
 }
 body.append(section);
}
(function installMinionAbilities(){
 const intent=updateMinionIntent;updateMinionIntent=function(m,index,dt,npos){const result=intent(m,index,dt,npos);minionAbilityTick(m,index,dt,npos);return result;};
 const speed=handsSpeed;handsSpeed=function(e){return speed(e)*(e.minionSlowT>0?1-(e.minionSlow||0):1);};
 const abilities=updateAbilities;updateAbilities=function(dt){abilities(dt);minionAbilityStatus(dt);};
 const warnings=drawAllyLeapWarnings;drawAllyLeapWarnings=function(){warnings();drawMinionAbilities();};
 const kill=killMinion;killMinion=function(m){m._abilityCd=undefined;return kill(m);};
 const pause=tPause;tPause=function(tab){pause(tab);minionAbilityPanel();};
})();
