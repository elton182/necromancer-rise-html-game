// Aba Equipamentos do Relicário: mochila, boneco, comparação, status, mercador e filtro.
// Estrutura e classes seguem scripts/equipment.js (jogo anterior); a lógica está em gear.mjs.
import EQ from './shared-equipment.mjs';
import Build from './shared-build.mjs';
import {forge,forgePrice,rerollPrice,equip,unequip,discard,discardAll,sell,buy,relicPrice,relicLevel,gearName,compatible,CAPACITY} from './gear.mjs';
import {snapshotFor,levelOf} from './progression.mjs';
import {CATALOG,buyConsumable} from './consumables.mjs';
import {RARITY_ORDER} from './drops.mjs';
const FILTERS={common:'Todos os equipamentos',magic:'Mágico ou superior',rare:'Raro ou superior',epic:'Apenas épico'};
const num=n=>n===null||n===undefined?'—':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
const ICONS={staff:'M12 56 34 12M30 15c-12-1-11-15-2-14 12 1 14 18 3 20M11 51l7 4M8 55l8 5',grimoire:'M9 12 33 8 39 13 39 51 15 56 9 51ZM15 17l24-4M15 17v39M9 12l6 5M23 26l8-2 4 8-7 10-7-7Z',body:'M18 9l6 5 7-5 12 11-6 11-5-4 5 29H11l5-29-5 4-6-11ZM18 9l6 17 7-17M18 40h13',head:'M6 43c0-24 6-35 18-38 12 3 18 14 18 38l-10 9H16ZM15 36c0-13 3-20 9-23 6 3 9 10 9 23l-9 7ZM6 43l18 15 18-15',boots:'M9 10h13v24l-7 8H6v13h20V10M29 10h13v28l-7 6h-8v12h20M9 17h13M29 17h13',ring1:'M24 13 32 21 24 29 16 21ZM18 28c-15 5-13 28 6 28s21-23 6-28M12 37c7 5 17 5 24 0',ring2:'M24 13 32 21 24 29 16 21ZM18 28c-15 5-13 28 6 28s21-23 6-28M12 37c7 5 17 5 24 0'};
const icon=type=>'<svg viewBox="0 0 48 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="'+ICONS[type]+'"/></svg>';
const SILHOUETTE='<svg class="gear-silhouette" viewBox="0 0 240 380" aria-hidden="true"><g fill="#28302a" stroke="#777759" stroke-width="1.5"><path d="M82 81Q80 29 120 15q40 14 38 66l-18 30H100Z"/><path d="M100 87 62 108 42 197 61 211 82 143 75 270 55 344q65 30 130 0l-20-74-7-127 21 68 19-14-20-89-38-21-20 19Z"/><path d="m84 144 10 125-20 69m82-194-10 125 20 69M100 104l20 158 20-158M76 219q44 15 88 0"/><path d="m61 205-16 29-10-4 7-33m137 8 16 29 10-4-7-33M91 347v22h24l5-19m29-3v22h-24l-5-19"/><ellipse cx="120" cy="66" rx="21" ry="27" fill="#111711"/><path d="m107 63 8 2m10 0 8-2m-18 15h10" stroke="#c4c69a"/></g><circle cx="120" cy="181" r="63" fill="none" stroke="#8a8055" stroke-dasharray="2 7" opacity=".25"/></svg>';
export function createGearPanel(session,{open,changed,filter}){
 const host=document.getElementById('gear-content'),status=document.getElementById('gear-message');
 let selected=null,page=0,ring='ring1',shop='staff',confirming=false,dpsOpen=false,close=()=>{};
 const node=(tag,text,parent=host,cls)=>{const el=document.createElement(tag);if(text!==undefined&&text!==null)el.textContent=text;if(cls)el.className=cls;parent.append(el);return el;};
 const html=(tag,cls,markup,parent)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.innerHTML=markup;parent?.append(el);return el;};
 const button=(text,action,parent=host)=>{const b=node('button',text,parent,'btn');b.type='button';b.onclick=action;return b;};
 const color=item=>EQ.rarities[item.rarity].color;
 const ranks=()=>session.world.army?.profile.ranks||{};
 const inShop=()=>['menu','village'].includes(session.scene);
 const dormant=a=>a.stat==='skill'&&!ranks()[a.target]||a.stat==='school'&&!Build.nodes.some(n=>n.school===a.target&&n.max>1&&ranks()[n.id]);
 function act(result){status.textContent=result.message;if(result.ok){confirming=false;changed();}render();return result;}
 const bag=()=>session.save.character.gearBag;
 const chosen=()=>selected?.slot?session.save.character.equipment[selected.slot]:bag().find(i=>i.id===selected?.id);
 const targetSlot=item=>item.type.startsWith('ring')?ring:item.type;
 const describe=a=>EQ.describe({...a,value:0},Build).replace(/^\+0%?\s*/,'').replace(/^em /,'');
 function renderStats(parent,item,selection=selected,compare=ring){
  const w=session.world,c=session.save.character,current=snapshotFor(w),next={...c.equipment};let comparison='Selecione uma peça para prever a troca.';
  if(item){if(selection?.slot){delete next[selection.slot];comparison='Prévia ao desequipar '+EQ.slots[selection.slot].name+'.';}else{const slot=item.type.startsWith('ring')?compare:item.type;next[slot]=item;comparison='Prévia ao equipar em '+EQ.slots[slot].name+'.';}}
  const preview=item?snapshotFor(w,next):current;
  const delta=(a,b,inverse=false)=>{if(a===null||b===null||a===undefined||b===undefined||!item)return '';const d=b-a;if(Math.abs(d)<.005)return '<span class="stat-neutral">=</span>';return '<span class="'+((inverse?d<0:d>0)?'stat-up':'stat-down')+'">'+(d>0?'+':'')+num(d)+'</span>';};
  parent.innerHTML='<div class="gear-stat-heading"><h3>Status do personagem</h3><span>'+comparison+'</span></div><div class="gear-stat-target"></div><table class="gear-stat-table"><thead><tr><th>Atributo</th><th>Atual</th><th>Prévia</th><th>Dif.</th></tr></thead><tbody></tbody></table><details class="gear-dps"><summary>Dano e DPS das habilidades <small>Ver análise</small></summary><p class="gear-dps-note">Potencial por alvo parado, todos os acertos, cada habilidade sozinha. Não some as colunas como DPS total da build.</p><div class="gear-skill-table-wrap"><table class="gear-skill-table"><thead><tr><th>Habilidade</th><th>Dano / uso</th><th>Recarga</th><th>DPS potencial</th><th>DPS contínuo</th></tr></thead><tbody></tbody></table></div></details>';
  const dps=parent.querySelector('.gear-dps');dps.open=dpsOpen;dps.ontoggle=()=>{if(dps.isConnected)dpsOpen=dps.open;};
  if(item&&!selection?.slot&&item.type.startsWith('ring'))for(const slot of ['ring1','ring2']){const b=button('Comparar '+EQ.slots[slot].name.toLowerCase(),()=>{ring=slot;render();},parent.querySelector('.gear-stat-target'));b.setAttribute('aria-pressed',String(compare===slot));}
  const labels={defense:['Defesa',''],defenseMitigation:['Mitigação contra monstro Nv. '+levelOf(w)+' (máx. 70%)','%'],hp:['Vida máxima',''],mp:['Mana máxima',''],spell:['Base de dano mágico',''],regen:['Regeneração de mana','/s'],hpRegen:['Regeneração de vida','/s'],move:['Movimento',' u/s'],cooldown:['Redução de recarga dos itens','%'],hordeHp:['Vida da horda equipada',''],hordeRegen:['Regeneração da horda equipada','/s'],hordeDps:['DPS básico da horda equipada','']};
  const body=parent.querySelector('.gear-stat-table tbody');
  for(const [key,[label,unit]]of Object.entries(labels)){const a=current.attributes[key],b=preview.attributes[key];body.insertAdjacentHTML('beforeend','<tr class="'+(item&&Math.abs(b-a)>=.005?'gear-stat-changed changed':'gear-stat-unchanged')+'" data-stat="'+key+'"><th>'+label+'</th><td>'+num(a)+unit+'</td><td>'+num(b)+unit+(item&&Math.abs(b-a)>=.005?(b>a?' ▲':' ▼'):'')+'</td><td>'+delta(a,b)+'</td></tr>');}
  const value=(a,b,inverse=false)=>'<span>'+num(a)+'</span>'+(item&&a!==null&&b!==null&&Math.abs(b-a)>=.005?'<span class="stat-arrow"> → </span><strong>'+num(b)+'</strong> '+delta(a,b,inverse):'');
  for(const skill of current.skills){const after=preview.skills.find(s=>s.id===skill.id)||skill;parent.querySelector('.gear-skill-table tbody').insertAdjacentHTML('beforeend','<tr data-skill="'+skill.id+'"><th>'+skill.name+'<small>'+(skill.equipped?'Equipada':'Não equipada')+(skill.mana!==undefined?' · '+skill.mana+' MP':'')+(skill.note?'<br>'+skill.note:'')+'</small></th><td>'+value(skill.damage,after.damage)+'</td><td>'+value(skill.cooldown,after.cooldown,true)+' s</td><td>'+value(skill.dps,after.dps)+'</td><td>'+value(skill.sustained,after.sustained)+'</td></tr>');}
 }
 function renderDetail(detail,item,selection=selected,compare=ring){
  const c=session.save.character;detail.innerHTML='<h3>Comparar equipamentos</h3>';
  if(!item){detail.insertAdjacentHTML('beforeend','<p class="gear-detail-empty">Selecione uma peça na mochila ou arraste até o personagem para comparar os atributos.</p>');return;}
  const equipped=!!selection?.slot,slot=equipped?selection.slot:item.type.startsWith('ring')?compare:item.type,current=equipped?null:c.equipment[slot];
  const key=a=>a.stat+':'+(a.target||''),rows=new Map();for(const i of [current,item].filter(Boolean))for(const a of i.affixes)rows.set(key(a),a);
  const card=(it,title)=>{const rarity=it&&EQ.rarities[it.rarity];return '<article class="gear-card"'+(rarity?' style="border-color:'+rarity.color+'"':'')+'><small>'+title+'</small><h3'+(rarity?' style="color:'+rarity.color+'"':'')+'>'+(it?gearName(it):'Slot vazio')+'</h3><p class="gear-item-meta">'+(it?'Nível '+it.level+' · '+rarity.name:EQ.slots[slot].name)+'</p></article>';};
  detail.insertAdjacentHTML('beforeend','<p class="gear-comparison-target">'+EQ.slots[slot].name+'</p><div class="gear-comparison-cards">'+(equipped?card(item,'EQUIPADO'):card(current,'EQUIPADO')+card(item,'SELECIONADO'))+'</div><div class="gear-detail-actions"></div>');
  const value=v=>v?'+'+num(v.value)+(EQ.attributes[v.stat]?.percent?'%':'')+(dormant(v)?'<small>inativo</small>':''):'<span class="gear-affix-missing">—</span>';
  const cells=(a,b)=>equipped?'<td>'+value(b)+'</td>':'<td>'+value(a)+'</td><td class="'+((b?.value||0)>(a?.value||0)?'stat-up up':(b?.value||0)<(a?.value||0)?'stat-down down':'')+'">'+value(b)+'</td>';
  const table=document.createElement('table');table.className='gear-item-comparison gear-compare';
  table.innerHTML='<thead><tr><th>Atributo</th>'+(equipped?'<th>Equipado</th>':'<th>Equipado</th><th>Selecionado</th>')+'</tr></thead><tbody><tr class="gear-base-row"><th>Base · '+describe(item.base)+'</th>'+cells(current?{...current.base,value:current.base.value*EQ.enhancementMultiplier(current)}:null,{...item.base,value:item.base.value*EQ.enhancementMultiplier(item)})+'</tr>'+(EQ.baseDefense(item)?'<tr class="gear-base-row"><th>Base · Defesa garantida</th>'+cells(current?{stat:'defense',value:EQ.baseDefense(current)}:null,{stat:'defense',value:EQ.baseDefense(item)})+'</tr>':'')+[...rows].sort(([x],[y])=>x.localeCompare(y)).map(([k,a])=>'<tr data-affix="'+k+'"><th>'+describe(a)+'</th>'+cells(current?.affixes.find(v=>key(v)===k),item.affixes.find(v=>key(v)===k))+'</tr>').join('')+'</tbody>';
  const actions=detail.querySelector('.gear-detail-actions');
  if(session.scene==='village'){
   node('h3','Bran · Ferreiro',actions);node('p','Cada grau melhora a base e a defesa garantida em 25%, até +5. A rolagem substitui somente o atributo escolhido por outro aleatório.',actions);
   const b=button('Aprimorar '+(item.enhancement||0)+'/5 · '+forgePrice(item)+' ouro',()=>act(forge(session,item.id)),actions);b.disabled=(item.enhancement||0)>=5||c.gold<forgePrice(item);
   item.affixes.forEach((a,index)=>{const b=button('Trocar '+EQ.describe(a,Build)+' · '+rerollPrice(item)+' ouro',()=>act(forge(session,item.id,index)),actions);b.disabled=c.gold<rerollPrice(item);});
  }
 detail.insertBefore(table,actions);
  if(item.special==='carcomido')detail.insertBefore(Object.assign(document.createElement('p'),{className:'conquest-special',textContent:'Osso Carcomido · Tiro de Osso aplica Podridão: 12% do dano do projétil por carga por segundo, por 5 s. Até 5 cargas; novos acertos renovam a duração.'}),actions);
  if(equipped)button('Desequipar',()=>act(unequip(session,slot)),actions).disabled=c.gearBag.length>=CAPACITY;
  else{
   for(const target of item.type.startsWith('ring')?['ring1','ring2']:[item.type]){const b=button('Equipar · '+EQ.slots[target].name,()=>{if(target.startsWith('ring'))ring=target;selected={slot:target};act(equip(session,item.id,target));},actions);if(target===slot)b.classList.add('gear-equip-primary','primary');}
   if(inShop())button('Vender por '+EQ.sellPrice(item)+' ouro',()=>{selected=null;act(sell(session,item.id));},actions);
   else button('Descartar peça',()=>{selected=null;act(discard(session,item.id));},actions);
  }
 }
 function bindDrag(root){
  const slots=[...root.querySelectorAll('.gear-slot')],layout=root.querySelector('.gear-layout'),note=root.querySelector('.gear-bag-note'),hint=note.textContent;
  let dragged=null,source=null,hovered=null;
  const fits=slot=>dragged&&compatible(dragged,slot);
  function preview(item,selection,slot){
   const stats=layout.querySelector('.gear-stats'),old=layout.querySelector(':scope > .gear-dps');renderStats(stats,item,selection,slot);renderDetail(layout.querySelector('.gear-detail'),item,selection,slot);
   const dps=stats.querySelector('.gear-dps');if(old)old.replaceWith(dps);else layout.insertBefore(dps,layout.querySelector('.gear-detail'));
  }
  const restore=()=>{const item=chosen();preview(item,selected,ring);};
  function clear(){if(!dragged)return;dragged=null;hovered=null;source?.classList.remove('gear-drag-source');source=null;root.classList.remove('gear-dragging');slots.forEach(b=>b.classList.remove('gear-drop-compatible','gear-drop-hover'));note.textContent=hint;restore();}
  for(const cell of root.querySelectorAll('.gear-cell[draggable="true"]')){
   cell.addEventListener('dragstart',e=>{const item=bag().find(i=>i.id===cell.dataset.gearId);if(!item||!e.dataTransfer){e.preventDefault();return;}
    dragged=item;source=cell;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',item.id);root.classList.add('gear-dragging');cell.classList.add('gear-drag-source');
    slots.forEach(b=>b.classList.toggle('gear-drop-compatible',!!fits(b.dataset.gearSlot)));note.textContent='Arrastando '+gearName(item)+'. Solte em um slot iluminado para equipar. Esc cancela.';preview(item,{id:item.id},ring);});
   cell.addEventListener('dragend',clear);
  }
  for(const target of slots){
   const over=e=>{const slot=target.dataset.gearSlot;if(!fits(slot))return;e.preventDefault();e.dataTransfer.dropEffect='move';if(hovered===target)return;hovered?.classList.remove('gear-drop-hover');hovered=target;target.classList.add('gear-drop-hover');
    note.textContent='Solte para equipar em '+EQ.slots[slot].name+(session.save.character.equipment[slot]?' e devolver a peça atual à mochila.':'.');preview(dragged,{id:dragged.id},slot);};
   target.addEventListener('dragenter',over);target.addEventListener('dragover',over);
   target.addEventListener('dragleave',e=>{if(target.contains(e.relatedTarget)||hovered!==target)return;hovered=null;target.classList.remove('gear-drop-hover');note.textContent='Solte em um slot iluminado para equipar. Esc cancela.';restore();});
   target.addEventListener('drop',e=>{const slot=target.dataset.gearSlot;if(!fits(slot))return;e.preventDefault();e.stopPropagation();const id=dragged.id;clear();if(slot.startsWith('ring'))ring=slot;selected={slot};act(equip(session,id,slot));});
  }
  root.ondragover=e=>{if(dragged&&!e.defaultPrevented){e.preventDefault();e.dataTransfer.dropEffect='none';}};
  root.ondrop=e=>{if(dragged){e.preventDefault();clear();}};
 }
 function render(){
  const w=session.world,c=session.save.character,items=c.gearBag;host.replaceChildren();
  const header=html('div','gear-header','<div><small>RELICÁRIO DE ZEPHYR</small><h2>Inventário</h2></div><span>'+items.length+'/'+CAPACITY+' peças · '+c.gold+' ouro · Nível '+levelOf(w)+'</span>',host);
  const closer=button('Fechar · I',()=>close(),header);closer.classList.add('gear-close');
  const layout=html('div','gear-layout','<section class="gear-bag gear-frame" aria-label="Mochila"></section><section class="gear-character gear-frame" aria-label="Equipamentos do personagem"><h3>Personagem</h3><div class="gear-paperdoll">'+SILHOUETTE+'<div class="gear-slots" aria-label="Equipados"></div></div><p class="gear-character-note">ZEPHYR · NÍVEL '+levelOf(w)+'</p></section><section class="gear-detail" aria-live="polite"></section>',host);
  const slots=layout.querySelector('.gear-slots'),bagEl=layout.querySelector('.gear-bag'),detail=layout.querySelector('.gear-detail');
  bagEl.innerHTML='<h3>Mochila <small>'+items.length+'/'+CAPACITY+'</small></h3><div class="gear-grid" role="group" aria-label="Células da mochila"></div><div class="gear-pages" aria-label="Bolsas"></div>';
  for(const [slot,def]of Object.entries(EQ.slots)){
   const item=c.equipment[slot],b=button('',()=>{selected={slot};render();},slots),label=def.icon+' '+def.name+' · '+(item?EQ.rarities[item.rarity].name+' Nv.'+item.level:'vazio');
   b.classList.add('gear-slot','gear-slot-'+slot);b.dataset.gearSlot=slot;b.title=label;b.setAttribute('aria-label',label);b.innerHTML=icon(slot)+'<span>'+def.name+'</span>'+(item?'<em>'+item.level+'</em>':'');
   if(item){b.classList.add('filled');b.style.setProperty('--gear-color',color(item));}if(selected?.slot===slot)b.setAttribute('aria-pressed','true');
  }
  const grid=bagEl.querySelector('.gear-grid');
  for(let i=page*30;i<(page+1)*30;i++){
   const item=items[i],label=item?gearName(item)+' · Nv.'+item.level:'Espaço vazio '+(i+1),b=button('',()=>{if(item){selected={id:item.id};render();}},grid);
   b.classList.add('gear-cell');b.setAttribute('aria-label',label);b.title=item?label:'';b.disabled=!item;b.innerHTML=item?icon(item.type)+'<span class="gear-item-level">'+item.level+'</span>':'';
   if(item){b.dataset.gearId=item.id;b.draggable=true;b.style.setProperty('--gear-color',color(item));b.classList.add('filled');if(selected?.id===item.id)b.setAttribute('aria-pressed','true');}
  }
  for(let p=0;p<2;p++){const b=button('Bolsa '+(p?'II':'I'),()=>{page=p;selected=null;render();},bagEl.querySelector('.gear-pages'));b.setAttribute('aria-pressed',String(page===p));}
  bagEl.insertAdjacentHTML('beforeend','<p class="gear-bag-note" role="status">Arraste uma peça até um slot iluminado ou clique para comparar e equipar.</p>');
  const filterBox=html('div','loot-filter','<label class="row"><span>Filtro de loot</span><select aria-label="Raridade mínima do loot"></select></label><p class="section-note">Equipamentos abaixo da raridade escolhida ficam ocultos no chão e não são coletados. Altere o filtro para exibi-los novamente. Ouro e orbes continuam sendo coletados.</p>',bagEl);
  const sel=filterBox.querySelector('select');for(const r of RARITY_ORDER){const o=node('option',FILTERS[r],sel);o.value=r;}sel.value=session.save.settings.lootFilter;sel.onchange=()=>{filter(sel.value);status.textContent='Filtro atualizado. Peças abaixo dele ficam ocultas no chão e não são coletadas; ouro e orbes não são afetados.';render();};
  const item=chosen(),stats=document.createElement('section');stats.className='gear-stats gear-frame';stats.setAttribute('aria-label','Status e prévia de equipamentos');layout.insertBefore(stats,detail);renderStats(stats,item);layout.insertBefore(stats.querySelector('.gear-dps'),detail);renderDetail(detail,item);
  const totals=EQ.bonuses({equipment:c.equipment}),extra=EQ.effects(Build,ranks(),c.equipment).extra;
  const bonus=html('div','gear-totals','<h3>Bônus equipados</h3>',host);
  node('p',Object.entries(totals).filter(([,v])=>v).map(([stat,value])=>EQ.describe({stat,value},Build)).join(' · ')||'nenhum',bonus);
  const ex=Object.entries(extra).filter(([,n])=>n).map(([id,n])=>Build.byId[id].name+': '+(ranks()[id]||0)+' investidos + '+n+' de equipamento = '+((ranks()[id]||0)+n)).join(' · ');if(ex)node('p',ex,bonus);
  const manage=html('section','gear-management','<h3>Gerenciar mochila</h3><p>O descarte pede confirmação. Equipamentos em uso ficam protegidos.</p>',host);
  const discardBtn=button(confirming?'Confirmar: descartar '+items.length+' peças':'Descartar tudo da mochila',()=>{if(!confirming){confirming=true;status.textContent='Equipados e consumíveis são mantidos. Clique novamente para confirmar.';render();return;}act(discardAll(session));},manage);discardBtn.classList.add('gear-discard-all');discardBtn.disabled=!items.length;
  const merchant=node('section',null,host,'gear-merchant');
  if(!inShop())html('p','section-note','Compre relíquias e venda equipamentos na vila. O mercador atende no menu ou na vila, fora do encontro; aqui você pode descartar peças. Atalho I abre esta mochila.',merchant);
  else{
   merchant.innerHTML='<h3>Mercador de relíquias misteriosas</h3><p>Peça nível '+relicLevel(session)+' · '+relicPrice(session)+' ouro. Revelada após a compra.</p><p>Comum 60% · Mágico 28% · Raro 10% · Épico 2%</p>';
   const types=node('div',null,merchant,'gear-shop-types');for(const [type,def]of Object.entries(EQ.slots)){const b=button(def.name,()=>{shop=type;render();},types);b.setAttribute('aria-pressed',String(shop===type));}
   const b=button('Comprar '+EQ.slots[shop].name+' · '+relicPrice(session)+' ouro',()=>{const r=act(buy(session,shop));if(r.ok)selected={id:session.save.character.gearBag.at(-1).id};render();},merchant);b.disabled=c.gold<relicPrice(session)||items.length>=CAPACITY;
   node('h3','Consumíveis',merchant);node('p','Usados com F1–F5 durante o encontro.',merchant);
   for(const d of CATALOG){const held=c.inventory.find(i=>i.id===d.id)?.count||0,cb=button(`${d.icon} ${d.name} · ${d.cost} ouro · ${held}/${d.maxStack}`,()=>act(buyConsumable(session,d.id)),merchant);cb.title=d.desc;cb.dataset.consumable=d.id;cb.disabled=c.gold<d.cost||held>=d.maxStack;}
  }
  bindDrag(host);
 }
 return {render,isOpen:()=>false,toggle:()=>{},setClose:fn=>{close=fn;}};
}
