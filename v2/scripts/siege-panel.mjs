import {TOWERS,PADS,LANES,MODIFIERS,WAVES,normalizeSiege,activeLanes,towerCost,runeCost} from './siege-model.mjs';
import {launchSiege,buildTower,upgradeTower,startSiegeWave,attuneRune,siegeAccess} from './siege.mjs';
import {returnAdventure} from './campaign.mjs';
export function createSiegePanel(s,{changed=()=>{}}={}){
 const host=document.createElement('section');host.id='siege-panel';host.className='campaign-panel siege-panel';host.hidden=true;document.body.append(host);
 let selected=null,tier=1,modifier='none',signature='',message='';
 const node=(tag,text,parent=host)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;parent.append(e);return e;};
 const act=fn=>{const result=fn();if(result?.message)message=result.message;signature='';changed();update();};
 const button=(text,fn,disabled=false,parent=host)=>{const b=node('button',text,parent);b.type='button';b.disabled=disabled;b.onclick=()=>act(fn);return b;};
 function update(){
  const w=s.world,r=w.adventure,inRun=s.scene==='training'&&r?.kind==='siege',inMenu=s.scene==='village'&&w.siegeMenu;
  const nearby=inRun&&!r.done?PADS.filter(p=>Math.hypot(p.x-w.player.x,p.y-w.player.y)<=3.2).sort((a,b)=>Math.hypot(a.x-w.player.x,a.y-w.player.y)-Math.hypot(b.x-w.player.x,b.y-w.player.y))[0]:null;
  if(selected!==(nearby?.id??null)){selected=nearby?.id??null;message='';host.scrollTop=0;}
  w.siegeSelectedPad=selected;
  host.hidden=!(inMenu||inRun&&(r.done||nearby||!r.active));
  host.dataset.mode=inMenu?'menu':r?.done?'result':nearby?'tower':'briefing';
  if(host.hidden){signature='';return inRun;}
  const p=normalizeSiege(s.save.character.siege),key=JSON.stringify([inRun,p,r?.wave,r?.active,r?.done,r?.integrity,r?.essence,r?.towers?.map(t=>[t.pad,t.rank]),selected,tier,modifier,message,w.paused]);if(key===signature)return true;signature=key;const scroll=host.scrollTop;host.replaceChildren();
  node('small',nearby?'CONSTRUÇÃO · ESSÊNCIA DO RITUAL':'ENDGAME · DEFESA DO OBELISCO');node('h2',nearby?'Pedestal '+selected:'Cerco ao Ritual');
  if(inMenu){
   node('p','Proteja o Obelisco de Almas durante oito ondas. Construa em pedestais numerados; Zephyr e a horda também combatem.');
   if(!siegeAccess(s))node('p','Conclua o Ato I para liberar este ritual.');
   const label=node('label','Grau do cerco '),select=node('select',undefined,label);select.setAttribute('aria-label','Grau do cerco');tier=Math.min(tier,p.unlocked);
   for(let i=1;i<=p.unlocked;i++){const o=node('option',String(i),select);o.value=i;}select.value=tier;select.onchange=()=>{tier=Number(select.value);signature='';update();};
   node('p','Melhor grau: '+p.best+' · Vitórias: '+p.wins+' · Fragmentos: '+p.shards);
   const mods=node('div');mods.className='siege-choices';for(const [id,m]of Object.entries(MODIFIERS)){const b=button(m.name,()=>{modifier=id;},false,mods);b.setAttribute('aria-pressed',String(modifier===id));}
   node('p',modifier==='none'?'Sem modificador adicional.':modifier==='armored'?'+30% de vida dos invasores; +25% ouro/XP e 2 fragmentos na vitória.':'+20% de velocidade dos invasores; +25% ouro/XP e 2 fragmentos na vitória.');
   button('Iniciar cerco',()=>launchSiege(s,tier,modifier),!siegeAccess(s));
   node('h3','Runas de cerco');node('p','Equipe uma runa: +12% de potência por nível para sua torre. Guardiões retornam mais rápido. Progresso exclusivo deste modo.');
   for(const [id,d]of Object.entries(TOWERS)){const row=node('div');row.className='siege-rune';const b=button(d.name+' · '+p.runes[id]+'/3',()=>attuneRune(s,id),!siegeAccess(s),row);b.setAttribute('aria-pressed',String(p.rune===id));button('Evoluir · '+runeCost(p.runes[id])+' fragmentos',()=>attuneRune(s,id,true),!siegeAccess(s)||p.runes[id]>=3||p.shards<runeCost(p.runes[id]),row);}
   button('Voltar à vila',()=>{w.siegeMenu=false;w.paused=false;});
  }else{
   if(r.done){node('h3',r.won?'Vitória!':'Ritual interrompido');node('p',r.result);button('Voltar à vila',()=>returnAdventure(s));return true;}
   if(nearby){
    const health=node('p','Essência: '+r.essence);health.className='siege-status';
    const t=r.towers.find(t=>t.pad===selected);
    if(t){node('h3',TOWERS[t.kind].name);node('p','Grau '+t.rank+'/3');node('small',TOWERS[t.kind].desc);button(t.rank===3?'Grau máximo':'Melhorar · '+towerCost(t)+' essência',()=>upgradeTower(s,selected),t.rank===3||r.essence<towerCost(t));}
    else for(const [id,d]of Object.entries(TOWERS)){const b=button(d.name+' · '+d.cost+' essência',()=>buildTower(s,selected,id),r.essence<d.cost);b.title=d.desc;node('small',d.desc);}
    node('small','Afaste-se do pedestal para fechar.');
   }else node('p','Prepare suas defesas. Aproxime-se de um pedestal para construir ou melhorar.');
   if(!r.active){
    const wave=Math.min(WAVES,r.wave+1);node('p','Próxima onda: '+wave+'/'+WAVES+' · '+activeLanes(wave).map(i=>LANES[i].name+' (resiste a '+TOWERS[LANES[i].resist].name+')').join(' · ')+(wave===WAVES?' · Chefe na rota '+LANES[activeLanes(wave)[(8+wave*2-1)%activeLanes(wave).length]].name+'.':''));
    button('Iniciar onda '+wave,()=>startSiegeWave(s));
   }
   button('Abandonar e voltar à vila',()=>returnAdventure(s));
  }
  if(message){const m=node('p',message);m.setAttribute('role','status');}host.scrollTop=scroll;return true;
 }
 return {update,open(){s.world.siegeMenu=true;s.world.paused=true;message='';signature='';update();}};
}
