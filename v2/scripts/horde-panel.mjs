import {ACTIONS,available,actionName} from './actions.mjs';
import {SPELL_RULES} from './spells.mjs';
import {TYPES,members} from './horde.mjs';
import R from './horde-rules.mjs';
export function createHordePanel(session,actions){
 const $=id=>document.getElementById(id);let signature='';
 $('army-demo').onclick=()=>actions.demo();$('revive').onclick=()=>actions.revive();
 $('army-range').onchange=()=>{if(session.world.army)session.world.army.range=Number($('army-range').value);};
 function update(force=false){
  const w=session.world,active=w.armyMode==='groups';$('army-mode').value=session.save.settings.armyMode;$('load-count').hidden=active;$('army-tools').hidden=!active;if(!active)return;
  const a=w.army;$('army-profile').textContent=`Perfil da horda: nível ${a.profile.level} · ${w.actors.filter(m=>m.groupType).length} integrantes · ${session.scene==='menu'?'preparo grátis':'equipar custa mana'}`;$('army-range').value=a.range;
  const next=JSON.stringify([a.profile,a.loadout]);if(force||signature!==next){signature=next;$('army-slots').replaceChildren();a.loadout.forEach((id,index)=>{
   const row=document.createElement('div');row.className='army-slot';const label=document.createElement('label');label.textContent='Slot '+(index+1);const select=document.createElement('select');select.dataset.slot=index;
   for(const type of ACTIONS){const option=document.createElement('option');option.value=type;option.textContent=actionName(type)+(type==='abom'?' (visual provisório)':'');option.disabled=!available(a,type);select.append(option);}select.value=id;select.onchange=()=>{const result=actions.equip(index,select.value);$('army-message').textContent=result.ok?'Slot atualizado.':result.message;update(true);};label.append(select);const button=document.createElement('button');button.dataset.activateSlot=index;button.textContent='Ativar '+(index+1);button.onclick=()=>actions.activate(index);row.append(label,button);$('army-slots').append(row);
  });}
  for(const b of $('army-slots').querySelectorAll('[data-activate-slot]')){const i=Number(b.dataset.activateSlot),id=a.loadout[i],cd=id==='raio'?w.castCooldown:id==='dash'?w.dash.cooldown:w.spellCooldowns[id]||a.cooldowns[id]||0;b.textContent=cd>1e-9?cd.toFixed(1)+'s':'Ativar '+(i+1);b.title=actionName(id)+(SPELL_RULES[id]?' · '+SPELL_RULES[id].cost+' MP':'');b.disabled=session.scene!=='training'||w.paused||id==='empty'||cd>1e-9;}
  const labels=TYPES.filter(t=>a.loadout.includes(t)).map(t=>{const group=members(w,t);return actionName(t)+': '+group.map(m=>m.sacrificed?'sacrificado '+Math.ceil(m.deadTimer)+'s':m.exploded?'detonado '+Math.ceil(m.deadTimer)+'s':m.possessed?m.possessedName+' · '+Math.ceil(m.possessionRemaining)+'s · '+Math.ceil(m.hp)+'/'+m.maxHp:m.hp<=0?'caído '+Math.ceil(m.deadTimer)+'s':Math.ceil(m.hp)+'/'+m.maxHp+(m.returning?' retornando':'')+(m.labelTime>0?' · '+m.abilityLabel:'')).join(', ')+((a.cooldowns[t]||0)>0?' · comando '+a.cooldowns[t].toFixed(1)+'s':'');});
  $('army-members').textContent=labels.join('\n')||'Sem evocações aprendidas/equipadas. O perfil básico começa sem exército.';$('revive').disabled=session.scene!=='training'||w.player.mp<30||!w.actors.some(m=>m.groupType&&!m.possessed&&m.hp<=0&&!m.sacrificed&&!m.exploded);
 }
 update(true);return {update};
}

export {actionName} from './actions.mjs';
