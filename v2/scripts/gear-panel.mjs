// Aba Equipamentos do Relicário: mochila, ficha da peça, personagem 3D com os slots, atributos,
// detalhes avançados, mercador e filtro. A lógica das trocas está em gear.mjs; aqui só há apresentação.
import SharedEQ from './shared-equipment.mjs';
import WarriorEQ from './warrior-equipment.mjs';
import {gearCatalog} from './class-gear.mjs';
import {classInfo,isMartial,isMarksman,resourceName} from './class-registry.mjs';
import {weaponType} from './marksman-equipment.mjs';
import Build from './shared-build.mjs';
import {forge,forgePrice,rerollPrice,equip,unequip,discard,discardAll,sell,buy,relicPrice,relicLevel,gearName,compatible,CAPACITY} from './gear.mjs';
import {snapshotFor,levelOf} from './progression.mjs';
import {CATALOG,definition,buyConsumable} from './consumables.mjs';
import {RARITY_ORDER} from './drops.mjs';
import {createInventoryPreview} from './inventory-preview.mjs';
import {glyph,combatPower} from './character-stats.mjs';
import {itemArt,ensureArtDefs} from './item-icons.mjs';
const FILTERS={common:'Todos os equipamentos',magic:'Mágico ou superior',rare:'Raro ou superior',epic:'Apenas épico'};
const PAGE=30;
const num=n=>n===null||n===undefined?'—':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ICONS={sword:'M10 56 35 8 38 7 38 13 17 50M8 44l15 8M8 58l8-14',shield:'M24 5 43 14 39 41 24 58 9 41 5 14ZM24 11v39',staff:'M12 56 34 12M30 15c-12-1-11-15-2-14 12 1 14 18 3 20M11 51l7 4M8 55l8 5',grimoire:'M9 12 33 8 39 13 39 51 15 56 9 51ZM15 17l24-4M15 17v39M9 12l6 5M23 26l8-2 4 8-7 10-7-7Z',body:'M18 9l6 5 7-5 12 11-6 11-5-4 5 29H11l5-29-5 4-6-11ZM18 9l6 17 7-17M18 40h13',head:'M6 43c0-24 6-35 18-38 12 3 18 14 18 38l-10 9H16ZM15 36c0-13 3-20 9-23 6 3 9 10 9 23l-9 7ZM6 43l18 15 18-15',boots:'M9 10h13v24l-7 8H6v13h20V10M29 10h13v28l-7 6h-8v12h20M9 17h13M29 17h13',ring1:'M24 13 32 21 24 29 16 21ZM18 28c-15 5-13 28 6 28s21-23 6-28M12 37c7 5 17 5 24 0',ring2:'M24 13 32 21 24 29 16 21ZM18 28c-15 5-13 28 6 28s21-23 6-28M12 37c7 5 17 5 24 0',potion:'M19 6h10M20 6v12C10 22 8 30 10 38c2 10 26 10 28 0 2-8 0-16-10-20V6M12 34h24',bag:'M14 20c0-9 4-14 10-14s10 5 10 14M8 20h32l-3 34H11ZM17 30h14'};
ICONS.bow='M14 4c18 6 26 22 22 56M14 4l22 56M8 38l32-18M40 20h-6M40 20l-2 5';ICONS.crossbow='M24 6v52M6 18c8-6 28-6 36 0M6 18l18 12 18-12M20 58h8M24 2l-3 5h6';
const icon=type=>'<svg viewBox="0 0 48 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="'+(ICONS[type]||ICONS.bag)+'"/></svg>';
// Texto de ambientação por tipo de peça; não descreve regras.
const FLAVOR={
 necromancer:{staff:'Entalhado em osso antigo, ainda vibra com o eco de quem o empunhou primeiro.',grimoire:'Páginas costuradas com fio de sepultura; algumas ainda sussurram nomes esquecidos.',body:'Tecido escuro que guarda o frio das criptas e o cheiro de vela apagada.',head:'Sob o capuz, a voz dos mortos chega mais clara.',boots:'Solas gastas por estradas que poucos voltaram para contar.',ring1:'Um aro simples que esconde mais do que mostra.',ring2:'Um aro simples que esconde mais do que mostra.'},
 mage:{staff:'O cristal do topo guarda a última faísca de cada feitiço; à noite, ele ainda brilha.',grimoire:'Três escolas na mesma capa: páginas chamuscadas, páginas geladas e uma que ninguém consegue ler duas vezes.',body:'Manto de lã encantada com bordas de ouro: pesado para o frio, leve para o fogo.',head:'Chapéu de aba larga; a ponta torta é de família.',boots:'Botas de couro que já pisaram em cinza quente e neve funda no mesmo dia.',ring1:'Um aro de prata com uma runa que muda de cor conforme o feitiço.',ring2:'Um aro de prata com uma runa que muda de cor conforme o feitiço.'},
 druid:{staff:'Galho vivo que ainda brota na primavera; o cristal guarda o eco do último trovão.',grimoire:'Folhas prensadas entre capas de casca: cada página cheira a chuva.',body:'Couro e folhas trançados, leves o bastante para não atrapalhar a transformação.',head:'Capuz de folhagem que esconde os chifres de galho e a vigília dos olhos.',boots:'Tiras de couro curtido que sabem o caminho de volta para a mata.',ring1:'Um aro de raiz endurecida, quente como seiva ao sol.',ring2:'Um aro de raiz endurecida, quente como seiva ao sol.'},
 archer:{bow:'Teixo curvado ao fogo e corda encerada: responde ao menor gesto de quem o puxa.',body:'Couro leve e capa de caçadora: nada que ranja quando a corda é puxada.',head:'O capuz guarda a sombra sobre os olhos e o vento fora da mira.',boots:'Solas macias para chegar perto sem ser ouvida.',ring1:'Um aro gasto onde a corda do arco já deixou marca.',ring2:'Um aro gasto onde a corda do arco já deixou marca.'},
 mercenary:{crossbow:'Coronha de nogueira e arco de aço temperado: devagar para armar, difícil de esquecer.',body:'Gibão de couro com bolsos para virotes, pavio e o pagamento adiantado.',head:'Chapéu de aba larga: a pena é vaidade; o resto é sombra para a mira.',boots:'Botas de estrada que já cruzaram três fronteiras e duas guerras.',ring1:'Selo de uma companhia que não existe mais.',ring2:'Selo de uma companhia que não existe mais.'},
 warrior:{sword:'Lâmina de campanha, afiada e reafiada a cada acampamento do caminho.',shield:'Madeira reforçada e ferro batido; cada amassado lembra um golpe que não chegou.',body:'Placas presas por couro velho, ajustadas ao corpo de quem não recua.',head:'Ferro frio que já desviou mais de um golpe certeiro.',boots:'Couro grosso e cravos de ferro para firmar o passo na lama da batalha.',ring1:'Um aro simples que esconde mais do que mostra.',ring2:'Um aro simples que esconde mais do que mostra.'}};
const CATEGORY={staff:'weapon',sword:'weapon',bow:'weapon',crossbow:'weapon',body:'armor',head:'armor',boots:'armor',ring1:'ring',ring2:'ring',grimoire:'offhand',shield:'offhand'};
export function createGearPanel(session,{open,changed,filter,assets,portrait:shared}){
 const EQ=new Proxy({}, {get:(_,key)=>gearCatalog(session.world.classId)[key]});
 const host=document.getElementById('gear-content'),status=document.getElementById('gear-message');
 const portrait=shared||createInventoryPreview(assets||(()=>{try{return JSON.parse(document.getElementById('assets')?.textContent||'{}');}catch{return {};}})());
 let selected=null,page=0,ring='ring1',shop='staff',confirming=false,category='all',comparing=false,advanced=false,close=()=>{};
 const node=(tag,text,parent=host,cls)=>{const el=document.createElement(tag);if(text!==undefined&&text!==null)el.textContent=text;if(cls)el.className=cls;parent.append(el);return el;};
 const html=(tag,cls,markup,parent)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.innerHTML=markup;parent?.append(el);return el;};
 const button=(text,action,parent=host)=>{const b=node('button',text,parent,'btn');b.type='button';b.onclick=action;return b;};
 const iconButton=(markup,label,action,parent,cls)=>{const b=button('',action,parent);b.innerHTML=markup;b.setAttribute('aria-label',label);b.title=label;if(cls)b.classList.add(...cls.split(' '));return b;};
 const warrior=()=>session.world.classId==='warrior',martial=()=>isMartial(session.world.classId),weaponOf=()=>warrior()?'sword':weaponType(session.world.classId)||'staff';
 const slotName=slot=>(EQ.slots[slot]||SharedEQ.slots[slot]||WarriorEQ.slots[slot])?.name||slot;
 const color=item=>EQ.rarities[item.rarity].color;
 const ranks=()=>session.world.army?.profile.ranks||{};
 const inShop=()=>['menu','village'].includes(session.scene);
 const dormant=a=>a.stat==='skill'&&!ranks()[a.target]||a.stat==='school'&&!Build.nodes.some(n=>n.school===a.target&&n.max>1&&ranks()[n.id]);
 function act(result){status.textContent=result.message;if(result.ok){confirming=false;changed();}render();return result;}
 const bag=()=>session.save.character.gearBag;
 const chosen=()=>selected?.slot?session.save.character.equipment[selected.slot]:selected?.id?bag().find(i=>i.id===selected.id):null;
 const targetSlot=(item,compare=ring)=>item.type.startsWith('ring')?compare:item.type;
 const describe=a=>EQ.describe({...a,value:0},Build).replace(/^\+0%?\s*/,'').replace(/^em /,'');
 const baseValue=item=>item.base.value*EQ.enhancementMultiplier(item);
 const percent=stat=>!!EQ.attributes[stat]?.percent;
 const inCategory=item=>category==='all'||CATEGORY[item.type]===category;
 const power=a=>combatPower(a,martial());
 const preview=(item,selection,compare)=>{const w=session.world,equipment={...session.save.character.equipment};if(item){if(selection?.slot)delete equipment[selection.slot];else equipment[targetSlot(item,compare)]=item;}return {current:snapshotFor(w),after:item?snapshotFor(w,equipment):null};};
 function statRows(){
  if(martial())return {main:[['hp','Vida máxima','','hp'],['mp',(resourceName(session.world.classId)==='foco'?'Foco':'Vigor')+' máximo','','vigor'],['damage','Dano','','damage'],['defense','Defesa','','defense']],extra:[...(warrior()?[['blockChance','Defesa de escudo','%','blockChance','Chance de anular o ataque']]:[]),['defenseMitigation','Redução por armadura','%','defenseMitigation'],['hpRegen','Recuperação de vida','/s','hpRegen'],['regen','Recuperação de '+(resourceName(session.world.classId)==='foco'?'foco':'vigor'),'/s','regen'],['move','Movimento','','move'],['cooldown','Redução de recarga','%','cooldown']]};
  const arcane={main:[['hp','Vida máxima','','hp'],['mp','Mana máxima','','mp'],['spell','Dano mágico','','spell'],['defense','Defesa','','defense']],extra:[['defenseMitigation','Mitigação','%','defenseMitigation','Contra monstro Nv. '+levelOf(session.world)+' (máx. 70%)'],['regen','Regeneração de mana','/s','regen'],['hpRegen','Regeneração de vida','/s','hpRegen'],['move','Movimento','','move'],['cooldown','Redução de recarga','%','cooldown'],['hordeHp','Vida da horda','','hordeHp'],['hordeRegen','Regeneração da horda','/s','hordeRegen'],['hordeDps','DPS básico da horda','','hordeDps']]};
  if(!classInfo(session.world.classId).horde)arcane.extra=arcane.extra.filter(r=>!r[0].startsWith('horde'));
  return arcane;
 }
 function statTable(parent,title,rows,a,b){
  node('h4',title,parent,'inv-sheet-title');
  const table=html('table','gear-stat-table'+(b?'':' inv-nopreview'),'<thead class="inv-sr"><tr><th>Atributo</th><th>Atual</th><th>Prévia</th><th>Dif.</th></tr></thead><tbody></tbody>',parent);
  for(const [key,title,unit,glyphId,hint] of rows){
   const before=a[key],after=b?b[key]:before,diff=(after??0)-(before??0),moved=!!b&&Math.abs(diff)>=.005,state=moved?(diff>0?'up':'down'):'neutral';
   const tr=node('tr',undefined,table.tBodies[0]);tr.dataset.stat=key;tr.className=moved?'gear-stat-changed changed gear-stat-'+state:'gear-stat-unchanged';
   const th=html('th',undefined,glyph(glyphId)+'<span>'+esc(title)+'</span>',tr);if(hint)th.title=hint;
   node('td',num(before)+unit,tr,'inv-cur');node('td',moved?num(after)+unit+(diff>0?' ▲':' ▼'):num(after)+unit,tr,'inv-prev');
   const d=node('td',undefined,tr,'inv-diff');node('span',b?(moved?(diff>0?'+':'')+num(diff)+(unit==='%'?' p.p.':unit):'='):'—',d,'stat-'+state);d.title=moved?(diff>0?'Melhora de ':'Redução de ')+num(Math.abs(diff))+unit:'Sem alteração';
  }
  return table;
 }
 function renderStats(parent,item,selection=selected,compare=ring){
  const w=session.world,c=session.save.character,{current,after}=preview(item,selection,compare),rows=statRows(),klass=classInfo(w.classId).id;
  parent.replaceChildren();
  html('div','inv-namecard',glyph(klass)+'<div><h3>'+esc(c.name||'Zephyr')+'</h3><p>'+classInfo(klass).name+' • Nível '+levelOf(w)+'</p></div>',parent);
  const note=node('p',item?(selection?.slot?'Prévia ao desequipar a peça.':'Prévia ao equipar em '+slotName(targetSlot(item,compare))+'.'):'Selecione uma peça para prever a troca.',parent,'gear-stat-heading inv-preview-note');
  note.dataset.active=String(!!item);
  statTable(parent,'Atributos Principais',rows.main,current.attributes,after?.attributes);
  statTable(parent,'Atributos Secundários',rows.extra,current.attributes,after?.attributes);
  if(item&&martial()&&!EQ.allowed(item))node('p',warrior()?'Esta peça é exclusiva do Necromante e não pode ser equipada pelo Guerreiro.':'Esta peça não serve a '+classInfo(session.world.classId).name+' nesta etapa.',parent,'inv-warning');
  const more=button('',()=>{advanced=!advanced;render();if(advanced)host.querySelector('.inv-advanced')?.scrollIntoView({block:'nearest',behavior:'smooth'});},parent);more.classList.add('inv-more');more.innerHTML=glyph('list')+'<span>Detalhes avançados</span>';more.setAttribute('aria-expanded',String(advanced));
  return {current,after};
 }
 function renderPower(el,current,after){
  const a=power(current.attributes),b=after?power(after.attributes):a,d=b-a;
  el.innerHTML='<small>Poder de Combate</small><b>'+glyph('power')+'<span>'+num(a)+'</span></b>'+(after&&d?'<em class="'+(d>0?'stat-up':'stat-down')+'">'+(d>0?'▲ +':'▼ ')+num(d)+'</em>':'');
  el.title='Índice de comparação calculado a partir dos atributos atuais. Não altera o combate.';
 }
 function renderAdvanced(parent,item,selection=selected,compare=ring){
  parent.replaceChildren();if(!advanced){parent.hidden=true;return;}parent.hidden=false;
  const {current,after}=preview(item,selection,compare),c=session.save.character;
  html('header','inv-advanced-head','<h3>Detalhes avançados</h3><p>'+(item?'Comparação com a peça selecionada.':'Selecione uma peça para ver o efeito da troca.')+'</p>',parent);
  const hide=button('Ocultar',()=>{advanced=false;render();},parent.firstChild);hide.classList.add('inv-advanced-close');
  const skills=node('section',undefined,parent,'gear-dps inv-skills');
  if(martial()){
   node('h4','Golpes físicos',skills);
   for(const skill of current.skills){const next=after?.skills.find(n=>n.id===skill.id),line=node('p',skill.name+' · '+num(skill.damage),skills),diff=next?next.damage-skill.damage:0;
    if(next&&Math.abs(diff)>=.005)node('span',' → '+num(next.damage)+' ('+(diff>0?'+':'')+num(diff)+')',line,diff>0?'stat-up':'stat-down');
    node('span',' de dano · '+skill.mana+' '+resourceName(session.world.classId)+(skill.id==='tornado'?' + 12/s · dano por impacto':skill.id==='shieldThrow'?' · dano por passagem':skill.id==='slash'?' · dano dos três cortes':'')+(skill.equipped?'':' · não aprendida'),line);}
  }else{
   html('div',undefined,'<h4>Dano e DPS das habilidades</h4><p class="gear-dps-note">Potencial por alvo parado, todos os acertos, cada habilidade sozinha. Não some as colunas como DPS total da build.</p><div class="gear-skill-table-wrap"><table class="gear-skill-table"><thead><tr><th>Habilidade</th><th>Dano / uso</th><th>Recarga</th><th>DPS potencial</th><th>DPS contínuo</th></tr></thead><tbody></tbody></table></div>',skills);
   const delta=(a,b,inverse)=>{const d=b-a;if(Math.abs(d)<.005)return '<span class="stat-neutral">=</span>';return '<span class="'+((inverse?d<0:d>0)?'stat-up':'stat-down')+'">'+(d>0?'+':'')+num(d)+'</span>';};
   const value=(a,b,inverse=false)=>'<span>'+num(a)+'</span>'+(after&&a!==null&&b!==null&&a!==undefined&&b!==undefined&&Math.abs(b-a)>=.005?'<span class="stat-arrow"> → </span><strong>'+num(b)+'</strong> '+delta(a,b,inverse):'');
   for(const skill of current.skills){const next=after?.skills.find(s=>s.id===skill.id)||skill;skills.querySelector('tbody').insertAdjacentHTML('beforeend','<tr data-skill="'+skill.id+'"><th>'+skill.name+'<small>'+(skill.equipped?'Equipada':'Não equipada')+(skill.mana!==undefined?' · '+skill.mana+' MP':'')+(skill.note?'<br>'+skill.note:'')+'</small></th><td>'+value(skill.damage,next.damage)+'</td><td>'+value(skill.cooldown,next.cooldown,true)+' s</td><td>'+value(skill.dps,next.dps)+'</td><td>'+value(skill.sustained,next.sustained)+'</td></tr>');}
  }
  const totals=EQ.bonuses({equipment:c.equipment}),extra=EQ.effects(Build,ranks(),c.equipment).extra,bonus=node('section',undefined,parent,'gear-totals inv-totals');
  node('h4','Bônus equipados',bonus);node('p',Object.entries(totals).filter(([,v])=>v).map(([stat,value])=>EQ.describe({stat,value},Build)).join(' · ')||'nenhum',bonus);
  const ex=Object.entries(extra).filter(([,n])=>n).map(([id,n])=>Build.byId[id].name+': '+(ranks()[id]||0)+' investidos + '+n+' de equipamento = '+((ranks()[id]||0)+n)).join(' · ');if(ex)node('p',ex,bonus);
 }
 function renderConsumable(detail,id){
  const d=definition(id),held=session.save.character.inventory.find(i=>i.id===id)?.count||0;
  detail.className='gear-detail inv-panel inv-item inv-consumable';detail.style.removeProperty('--rarity');
  html('div','inv-item-head','<div class="inv-item-icon inv-emoji">'+esc(d.icon)+'</div><div><h3>'+esc(d.name)+'</h3><p class="inv-item-kind">Consumível • '+held+'/'+d.maxStack+'</p></div>',detail);
  node('p',d.desc,detail,'inv-item-text');
  node('p','Use com F'+(session.save.character.inventory.findIndex(i=>i.id===id)+1)+' durante o encontro. Compre mais no mercador da vila.',detail,'inv-flavor');
 }
 function renderDetail(detail,item,selection=selected,compare=ring){
  const c=session.save.character;detail.replaceChildren();
  if(selection?.consumable)return renderConsumable(detail,selection.consumable);
  detail.className='gear-detail inv-panel inv-item';
  if(!item){detail.style.removeProperty('--rarity');detail.classList.add('inv-item-empty');html('div','inv-item-placeholder',icon('bag')+'<p class="gear-detail-empty">Selecione uma peça na mochila ou arraste até o personagem para comparar os atributos.</p>',detail);return;}
  const rarity=EQ.rarities[item.rarity],equipped=!!selection?.slot,slot=equipped?selection.slot:targetSlot(item,compare),current=equipped?null:c.equipment[slot];
  detail.style.setProperty('--rarity',rarity.color);detail.classList.add('inv-rarity-'+item.rarity);
  html('div','inv-item-head','<div class="inv-item-icon">'+itemArt(item.type,item.classId)+((item.enhancement||0)?'<b>+'+item.enhancement+'</b>':'')+'</div><div><h3>'+esc(gearName(item))+'</h3><p class="inv-item-kind">'+rarity.name+' • '+esc(slotName(item.type))+'</p><p class="gear-item-meta">Nível '+item.level+(equipped?' · Equipado':'')+'</p></div>',detail);
  // Atributo base em destaque, com a diferença para a peça que está no slot.
  const base=baseValue(item),unit=percent(item.base.stat)?'%':'',same=current&&current.base.stat===item.base.stat?baseValue(current):0,diff=base-same;
  html('div','inv-main',glyph(item.base.stat==='damageFlat'?'damage':item.base.stat==='spellFlat'?'spell':item.base.stat==='blockChance'?'blockChance':item.base.stat==='hp'?'hp':item.base.stat==='mp'?'mp':item.base.stat==='hordeFlat'?'hordeDps':item.base.stat==='moveFlat'?'move':item.base.stat==='hpRegen'?'hpRegen':'regen')+'<div><small>'+esc(describe(item.base))+'</small><b>'+num(base)+unit+'</b>'+(!equipped&&Math.abs(diff)>=.005?'<em class="'+(diff>0?'stat-up':'stat-down')+'">'+(diff>0?'▲ +':'▼ ')+num(diff)+unit+'</em>':'')+'</div>',detail);
  const key=a=>a.stat+':'+(a.target||''),value=v=>v?'+'+num(v.value)+(percent(v.stat)?'%':'')+(dormant(v)?'<small>inativo</small>':''):'<span class="gear-affix-missing">—</span>';
  const table=document.createElement('table');table.className='gear-item-comparison gear-compare inv-affixes';
  const showCompare=comparing&&!equipped;
  if(showCompare){
   html('div','inv-compare-head','<h4>Comparar equipamentos</h4><p>'+(current?'<span style="color:'+EQ.rarities[current.rarity].color+'">'+esc(gearName(current))+'</span> · Nível '+current.level:'Slot vazio')+' · '+esc(slotName(slot))+'</p>',detail);
   const rows=new Map();for(const i of [current,item].filter(Boolean))for(const a of i.affixes)rows.set(key(a),a);
   const cells=(a,b)=>'<td>'+value(a)+'</td><td class="'+((b?.value||0)>(a?.value||0)?'stat-up up':(b?.value||0)<(a?.value||0)?'stat-down down':'')+'">'+value(b)+'</td>';
   table.innerHTML='<thead><tr><th>Atributo</th><th>Equipado</th><th>Selecionado</th></tr></thead><tbody><tr class="gear-base-row"><th>Base · '+describe(item.base)+'</th>'+cells(current?{...current.base,value:baseValue(current)}:null,{...item.base,value:base})+'</tr>'+(EQ.baseDefense(item)?'<tr class="gear-base-row"><th>Base · Defesa garantida</th>'+cells(current?{stat:'defense',value:EQ.baseDefense(current)}:null,{stat:'defense',value:EQ.baseDefense(item)})+'</tr>':'')+[...rows].sort(([x],[y])=>x.localeCompare(y)).map(([k,a])=>'<tr data-affix="'+k+'"><th>'+describe(a)+'</th>'+cells(current?.affixes.find(v=>key(v)===k),item.affixes.find(v=>key(v)===k))+'</tr>').join('')+'</tbody>';
  }else{
   table.innerHTML='<thead class="inv-sr"><tr><th>Atributo</th><th>Valor</th></tr></thead><tbody>'+(EQ.baseDefense(item)?'<tr class="gear-base-row"><th>Defesa garantida</th><td>'+value({stat:'defense',value:EQ.baseDefense(item)})+'</td></tr>':'')+item.affixes.map(a=>'<tr data-affix="'+key(a)+'"><th>'+describe(a)+'</th><td>'+value(a)+'</td></tr>').join('')+(item.affixes.length||EQ.baseDefense(item)?'':'<tr><th>Sem atributos extras</th><td>—</td></tr>')+'</tbody>';
  }
  detail.append(table);
  if(item.special==='carcomido')html('div','inv-special conquest-special',glyph('spell')+'<div><h4>Osso Carcomido</h4><p>Tiro de Osso aplica Podridão: 12% do dano do projétil por carga por segundo, por 5 s. Até 5 cargas; novos acertos renovam a duração.</p></div>',detail);
  const flavor=(FLAVOR[session.world.classId]||FLAVOR.necromancer)[item.type]||FLAVOR.warrior[item.type]||FLAVOR.necromancer[item.type];if(flavor)node('p',flavor,detail,'inv-flavor');
  if(session.scene==='village'){
   const smith=node('section',undefined,detail,'inv-forge');node('h4','Bruno · Ferreiro',smith);node('p','Cada grau melhora a base e a defesa garantida em 25%, até +5. A rolagem substitui somente o atributo escolhido por outro aleatório.',smith);
   const b=button('Aprimorar '+(item.enhancement||0)+'/5 · '+forgePrice(item)+' ouro',()=>act(forge(session,item.id)),smith);b.disabled=(item.enhancement||0)>=5||c.gold<forgePrice(item);
   item.affixes.forEach((a,index)=>{const r=button('Trocar '+EQ.describe(a,Build)+' · '+rerollPrice(item)+' ouro',()=>act(forge(session,item.id,index)),smith);r.disabled=c.gold<rerollPrice(item);});
  }
  if(!equipped&&item.type.startsWith('ring')){const pick=node('div',undefined,detail,'inv-ring-pick gear-stat-target');node('span','Slot:',pick);for(const target of ['ring1','ring2']){const b=button(target==='ring1'?'Esquerdo':'Direito',()=>{ring=target;render();},pick);b.setAttribute('aria-label','Comparar '+slotName(target).toLowerCase());b.setAttribute('aria-pressed',String(compare===target));}}
  const actions=node('div',undefined,detail,'gear-detail-actions inv-actions');
  if(equipped){const b=iconButton(glyph('unequip')+'<span>Desequipar</span>','Desequipar',()=>act(unequip(session,slot)),actions,'inv-action gear-equip-primary');b.disabled=c.gearBag.length>=CAPACITY;}
  else{
   const e=iconButton(glyph('equip')+'<span>Equipar</span>','Equipar · '+slotName(slot),()=>{if(slot.startsWith('ring'))ring=slot;selected={slot};act(equip(session,item.id,slot));},actions,'inv-action gear-equip-primary primary');if(martial()&&!EQ.allowed(item))e.disabled=true;
   const cmp=iconButton(glyph('compare')+'<span>Comparar</span>',comparing?'Ocultar comparação':'Comparar com o equipado',()=>{comparing=!comparing;render();},actions,'inv-action');cmp.setAttribute('aria-pressed',String(comparing));
   if(inShop())iconButton(glyph('sell')+'<span>Vender</span><small>'+EQ.sellPrice(item)+' ouro</small>','Vender por '+EQ.sellPrice(item)+' ouro',()=>{selected=null;act(sell(session,item.id));},actions,'inv-action');
   else iconButton(glyph('discard')+'<span>Descartar</span>','Descartar peça',()=>{selected=null;act(discard(session,item.id));},actions,'inv-action inv-action-danger');
  }
 }
 function paint(root,item,selection=selected,compare=ring){
  const {current,after}=renderStats(root.querySelector('.gear-stats'),item,selection,compare);
  renderDetail(root.querySelector('.gear-detail'),item,selection,compare);
  renderPower(root.querySelector('.inv-power'),current,after);
  renderAdvanced(root.querySelector('.inv-advanced'),item,selection,compare);
 }
 function bindDrag(root){
  const slots=[...root.querySelectorAll('.gear-slot')],note=root.querySelector('.gear-bag-note'),hint=note.textContent;
  let dragged=null,source=null,hovered=null;
  const fits=slot=>dragged&&(!martial()||EQ.allowed(dragged))&&compatible(dragged,slot);
  const restore=()=>paint(root,chosen(),selected,ring);
  function clear(){if(!dragged)return;dragged=null;hovered=null;source?.classList.remove('gear-drag-source');source=null;root.classList.remove('gear-dragging');slots.forEach(b=>b.classList.remove('gear-drop-compatible','gear-drop-hover'));note.textContent=hint;restore();}
  for(const cell of root.querySelectorAll('.gear-cell[draggable="true"]')){
   cell.addEventListener('dragstart',e=>{const item=bag().find(i=>i.id===cell.dataset.gearId);if(!item||!e.dataTransfer){e.preventDefault();return;}
    dragged=item;source=cell;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',item.id);root.classList.add('gear-dragging');cell.classList.add('gear-drag-source');
    slots.forEach(b=>b.classList.toggle('gear-drop-compatible',!!fits(b.dataset.gearSlot)));note.textContent='Arrastando '+gearName(item)+'. Solte em um slot iluminado para equipar. Esc cancela.';paint(root,item,{id:item.id},ring);});
   cell.addEventListener('dragend',clear);
  }
  for(const target of slots){
   const over=e=>{const slot=target.dataset.gearSlot;if(!fits(slot))return;e.preventDefault();e.dataTransfer.dropEffect='move';if(hovered===target)return;hovered?.classList.remove('gear-drop-hover');hovered=target;target.classList.add('gear-drop-hover');
    note.textContent='Solte para equipar em '+slotName(slot)+(session.save.character.equipment[slot]?' e devolver a peça atual à mochila.':'.');paint(root,dragged,{id:dragged.id},slot);};
   target.addEventListener('dragenter',over);target.addEventListener('dragover',over);
   target.addEventListener('dragleave',e=>{if(target.contains(e.relatedTarget)||hovered!==target)return;hovered=null;target.classList.remove('gear-drop-hover');note.textContent='Solte em um slot iluminado para equipar. Esc cancela.';restore();});
   target.addEventListener('drop',e=>{const slot=target.dataset.gearSlot;if(!fits(slot))return;e.preventDefault();e.stopPropagation();const id=dragged.id;clear();if(slot.startsWith('ring'))ring=slot;selected={slot};act(equip(session,id,slot));});
  }
  root.ondragover=e=>{if(dragged&&!e.defaultPrevented){e.preventDefault();e.dataTransfer.dropEffect='none';}};
  root.ondrop=e=>{if(dragged){e.preventDefault();clear();}};
 }
 function renderBag(bagEl){
  const c=session.save.character,items=c.gearBag,consumables=category==='consumable';
  bagEl.innerHTML='<header class="inv-bag-head">'+icon('bag')+'<h3>Inventário</h3><b title="Peças na mochila">'+items.length+' / '+CAPACITY+'</b></header><div class="inv-cats" role="group" aria-label="Filtrar a mochila"></div><div class="gear-grid inv-grid" role="group" aria-label="Células da mochila"></div><p class="gear-bag-note" role="status">'+(consumables?'Consumíveis são usados com F1–F5 durante o encontro.':'Arraste uma peça até um slot iluminado ou clique para comparar e equipar.')+'</p><div class="gear-pages inv-pages" aria-label="Bolsas"></div><p class="inv-gold">'+glyph('coin')+'<span>'+num(c.gold)+' ouro</span></p>';
  const cats=bagEl.querySelector('.inv-cats');
  for(const [id,label,markup] of [['all','Todos','<span>Todos</span>'],['weapon','Armas',icon(weaponOf())],['armor','Armaduras',icon('body')],['ring','Anéis',icon('ring1')],...(isMarksman(session.world.classId)&&martial()?[]:[['offhand',warrior()?'Escudos':'Grimórios',icon(warrior()?'shield':'grimoire')]]),['consumable','Consumíveis',icon('potion')]]){
   const b=iconButton(markup,label,()=>{category=id;page=0;if(id==='consumable'||selected?.consumable)selected=null;render();},cats,'inv-cat'+(id==='all'?' inv-cat-all':''));b.setAttribute('aria-pressed',String(category===id));
  }
  const grid=bagEl.querySelector('.gear-grid');
  if(consumables){
   for(let i=0;i<PAGE;i++){const slot=c.inventory[i],d=slot&&definition(slot.id),label=d?d.name+' · '+slot.count+' unidade(s)':'Espaço vazio '+(i+1),b=button('',()=>{if(d){selected={consumable:d.id};render();}},grid);
    b.classList.add('gear-cell','inv-cell');b.setAttribute('aria-label',label);b.title=d?d.name+': '+d.desc:'';b.disabled=!d;if(d){b.classList.add('filled','inv-consumable-cell');b.innerHTML='<span class="inv-emoji">'+esc(d.icon)+'</span><span class="gear-item-level">'+slot.count+'</span>';if(selected?.consumable===d.id)b.setAttribute('aria-pressed','true');}}
  }else{
   const list=items.filter(inCategory),pages=Math.max(2,Math.ceil(list.length/PAGE));if(page>=pages)page=0;
   for(let i=page*PAGE;i<(page+1)*PAGE;i++){
    const item=list[i],label=item?gearName(item)+' · Nv.'+item.level:'Espaço vazio '+(i+1),b=button('',()=>{if(item){selected={id:item.id};render();}},grid);
    b.classList.add('gear-cell','inv-cell');b.setAttribute('aria-label',label);b.title=item?label:'';b.disabled=!item;b.innerHTML=item?itemArt(item.type,item.classId)+((item.enhancement||0)?'<span class="inv-enh">+'+item.enhancement+'</span>':'')+'<span class="gear-item-level">'+item.level+'</span>':'';
    if(item){b.dataset.gearId=item.id;b.dataset.rarity=item.rarity;b.draggable=true;b.style.setProperty('--gear-color',color(item));b.classList.add('filled');if(selected?.id===item.id)b.setAttribute('aria-pressed','true');}
   }
   for(let p=0;p<pages;p++){const b=button('',()=>{page=p;render();},bagEl.querySelector('.gear-pages'));b.innerHTML=icon('bag')+'<span>Bolsa '+['I','II','III','IV'][p]+'</span>';b.setAttribute('aria-pressed',String(page===p));}
  }
 }
 function renderDoll(doll){
  const c=session.save.character,weapon=weaponOf(),offhand=warrior()?'shield':'grimoire';
  doll.innerHTML='<div class="inv-slots inv-slots-left" aria-label="Equipados à esquerda"></div><div class="inv-stage"><div class="inv-arch" aria-hidden="true"></div></div><div class="inv-slots inv-slots-right" aria-label="Equipados à direita"></div><div class="inv-power" role="status"></div>';
  const columns={left:['head','body',weapon,'boots'],right:[offhand,'ring1','ring2']},known=new Set([...columns.left,...columns.right]);
  for(const slot of Object.keys(EQ.slots))if(!known.has(slot))columns.right.push(slot);
  for(const [side,list] of Object.entries(columns))for(const slot of list){
   const def=EQ.slots[slot];if(!def)continue;const item=c.equipment[slot],label=def.icon+' '+def.name+' · '+(item?EQ.rarities[item.rarity].name+' Nv.'+item.level:'vazio');
   const b=button('',()=>{selected={slot};render();},doll.querySelector('.inv-slots-'+side));b.classList.add('gear-slot','inv-slot','gear-slot-'+slot);b.dataset.gearSlot=slot;b.title=label;b.setAttribute('aria-label',label);
   b.innerHTML=(item?itemArt(item.type,item.classId):icon(slot))+'<span>'+def.name+'</span>'+(item?'<em>'+item.level+'</em>':'');
   if(item){b.classList.add('filled');b.dataset.rarity=item.rarity;b.style.setProperty('--gear-color',color(item));}if(selected?.slot===slot)b.setAttribute('aria-pressed','true');
  }
  const stage=doll.querySelector('.inv-stage');stage.append(portrait.element);
  html('p','gear-character-note inv-stage-name',esc(c.name||'Zephyr')+' · Nível '+levelOf(session.world),stage);
  portrait.show({model:classInfo(session.world.classId).model,shield:!warrior()||!!c.equipment.shield});
 }
 function render(){
  ensureArtDefs();const w=session.world,c=session.save.character,items=c.gearBag;host.replaceChildren();
  if(!EQ.slots[shop])shop=Object.keys(EQ.slots)[0];
  if(selected?.id&&!items.some(i=>i.id===selected.id))selected=null;
  if(selected?.consumable&&!c.inventory.some(i=>i.id===selected.consumable))selected=null;
  const layout=html('div','inv-layout','<section class="gear-bag inv-panel" aria-label="Mochila"></section><section class="gear-detail inv-panel inv-item" aria-live="polite"></section><section class="gear-character inv-doll" aria-label="Equipamentos do personagem"></section><section class="gear-stats inv-panel inv-sheet" aria-label="Status e prévia de equipamentos"></section>',host);
  renderBag(layout.querySelector('.gear-bag'));renderDoll(layout.querySelector('.gear-character'));
  if(martial())for(const [slot,item] of Object.entries(c.equipment).filter(([slot])=>!EQ.slots[slot])){const legacy=node('p','Equipamento antigo incompatível: '+gearName(item),layout.querySelector('.gear-bag'),'inv-warning');button('Guardar peça antiga',()=>act(unequip(session,slot)),legacy);}
  node('section',undefined,host,'inv-advanced').hidden=true;
  paint(host,chosen(),selected,ring);
  const extras=node('div',undefined,host,'inv-extras');
  const filterBox=html('section','loot-filter inv-panel','<h4>Filtro de loot</h4><label class="row"><span>Raridade mínima</span><select aria-label="Raridade mínima do loot"></select></label><p class="section-note">Equipamentos abaixo da raridade escolhida ficam ocultos no chão e não são coletados. Ouro e orbes continuam sendo coletados.</p>',extras);
  const sel=filterBox.querySelector('select');for(const r of RARITY_ORDER){const o=node('option',FILTERS[r],sel);o.value=r;}sel.value=session.save.settings.lootFilter;sel.onchange=()=>{filter(sel.value);status.textContent='Filtro atualizado. Peças abaixo dele ficam ocultas no chão e não são coletadas; ouro e orbes não são afetados.';render();};
  const manage=html('section','gear-management inv-panel','<h4>Gerenciar mochila</h4><p>O descarte pede confirmação. Equipamentos em uso ficam protegidos.</p>',extras);
  const discardBtn=button(confirming?'Confirmar: descartar '+items.length+' peças':'Descartar tudo da mochila',()=>{if(!confirming){confirming=true;status.textContent='Equipados e consumíveis são mantidos. Clique novamente para confirmar.';render();return;}act(discardAll(session));},manage);discardBtn.classList.add('gear-discard-all');discardBtn.disabled=!items.length;
  const merchant=node('section',null,extras,'gear-merchant inv-panel');
  if(!inShop())html('p','section-note','Compre relíquias e venda equipamentos na vila. O mercador atende no menu ou na vila, fora do encontro; aqui você pode descartar peças. Atalho I abre esta mochila.',merchant);
  else{
   merchant.innerHTML='<h4>Mercador de relíquias misteriosas</h4><p>Peça nível '+relicLevel(session)+' · '+relicPrice(session)+' ouro. Revelada após a compra.</p><p>Comum 60% · Mágico 28% · Raro 10% · Épico 2%</p>';
   const types=node('div',null,merchant,'gear-shop-types');for(const [type,def]of Object.entries(EQ.slots)){const b=button(def.name,()=>{shop=type;render();},types);b.setAttribute('aria-pressed',String(shop===type));}
   const b=button('Comprar '+EQ.slots[shop].name+' · '+relicPrice(session)+' ouro',()=>{const r=act(buy(session,shop));if(r.ok){selected={id:session.save.character.gearBag.at(-1).id};category='all';page=Math.floor((session.save.character.gearBag.length-1)/PAGE);}render();},merchant);b.disabled=c.gold<relicPrice(session)||items.length>=CAPACITY;
   node('h4','Consumíveis',merchant);node('p','Usados com F1–F5 durante o encontro.',merchant);
   const shelf=node('div',null,merchant,'inv-consumable-shop');
   for(const d of CATALOG){const held=c.inventory.find(i=>i.id===d.id)?.count||0,cb=button(`${d.icon} ${d.name} · ${d.cost} ouro · ${held}/${d.maxStack}`,()=>act(buyConsumable(session,d.id)),shelf);cb.title=d.desc;cb.dataset.consumable=d.id;cb.disabled=c.gold<d.cost||held>=d.maxStack;}
  }
  bindDrag(host);
 }
 return {render,isOpen:()=>false,toggle:()=>{},setClose:fn=>{close=fn;}};
}
