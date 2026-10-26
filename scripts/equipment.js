// Embedded after the skill rules, before bootGame(). Source of runtime equipment integration.
let gearSelected=null,gearShopType='staff',gearSerial=0,gearNoticeAt=0,gearPage=0,gearCompareSlot='ring1',gearDpsOpen=false;
const lootRarityOrder=['common','magic','rare','epic'];
let lootMinRarity=lootRarityOrder.includes(optsLoad()?.lootMinRarity)?optsLoad().lootMinRarity:'common';
function lootDropAllowed(drop){
 return drop.type!=='equipment'||lootRarityOrder.indexOf(drop.item.rarity)>=lootRarityOrder.indexOf(lootMinRarity);
}
function setLootMinRarity(rarity){
 lootMinRarity=lootRarityOrder.includes(rarity)?rarity:'common';
 const saved=optsLoad()||{};saved.lootMinRarity=lootMinRarity;optsSave(saved);
}
function lootFilterControl(){
 const host=document.createElement('div');host.className='loot-filter';
 host.innerHTML='<label class="row"><span>Filtro de loot</span><select aria-label="Raridade mínima do loot"><option value="common">Todos os equipamentos</option><option value="magic">Mágico ou superior</option><option value="rare">Raro ou superior</option><option value="epic">Apenas épico</option></select></label><p class="section-note">Equipamentos abaixo da raridade escolhida ficam ocultos no chão e não são coletados. Altere o filtro para exibi-los novamente. Ouro e orbes continuam sendo coletados.</p>';
 const select=host.querySelector('select');select.value=lootMinRarity;select.onchange=()=>setLootMinRarity(select.value);
 return host;
}
const gearVillage=()=>gameState==='hub'&&!CAMP.on;
const gearBonus=key=>EquipmentModel.bonuses(player)[key]||0;
function menuUpdateSummary(){const summary=document.querySelector('.menu-summary');if(summary){const portrait=typeof PORT!=='undefined'&&PORT.zt?PORT.zt.img.src:'';summary.innerHTML=(portrait?'<img class="menu-portrait" src="'+portrait+'" alt="Retrato de Zephyr">':'')+'<b>ZEPHYR · NÍVEL '+player.level+'</b><span>Vida '+Math.ceil(player.hp)+' / '+player.maxHp+'</span><span>Mana '+Math.ceil(player.mp)+' / '+player.maxMp+'</span><span>'+player.gold+' ouro</span><span>'+player.skillPoints+' pontos</span>';}}
function gearEnsure(){player.equipment||={};player.gearBag||=[];player.waveProgress||=EquipmentModel.progress();}
function gearName(item){return EquipmentModel.slots[item.type].name+' '+EquipmentModel.rarities[item.rarity].name;}
function gearCurrentWave(){return EquipmentModel.waveNumber(currentMission?.endless?wave:CAMP.on?CAMP.stage:currentMission?.difficulty||1);}
function gearRefresh(){
 const hp=player.hp/player.maxHp,mp=player.mp/player.maxMp,allies=minions.map(m=>({m,hp:m.hp/maxHpSafe(m)}));
 skillSync();player.hp=hp<=0?0:Math.max(1,Math.floor(player.maxHp*hp+1e-8));player.mp=Math.max(0,Math.floor(player.maxMp*mp+1e-8));
 for(const {m,hp:ratio}of allies)m.hp=m.dead?0:Math.max(1,Math.floor(m.maxHp*ratio+1e-8));
 updateHUD();updateMinionPanel();buildSkillTree();menuUpdateSummary();saveGame();
}
function maxHpSafe(m){return Math.max(1,m.maxHp||1);}
function gearEquip(id,slot){
 gearEnsure();const index=player.gearBag.findIndex(i=>i.id===id),item=player.gearBag[index];if(!item||!EquipmentModel.slots[slot])return false;
 if(item.type!==slot&&!(item.type.startsWith('ring')&&slot.startsWith('ring')))return false;
 const old=player.equipment[slot];player.gearBag.splice(index,1);if(old)player.gearBag.push(old);player.equipment[slot]=item;gearSelected={slot};gearRefresh();return true;
}
function gearUnequip(slot){gearEnsure();if(!player.equipment[slot]||player.gearBag.length>=EquipmentModel.CAPACITY)return false;const item=player.equipment[slot];player.gearBag.push(item);gearPage=Math.floor((player.gearBag.length-1)/30);delete player.equipment[slot];gearSelected={id:item.id};gearRefresh();return true;}
function gearSell(id){if(!gearVillage())return false;const index=player.gearBag.findIndex(i=>i.id===id);if(index<0)return false;player.gold+=EquipmentModel.sellPrice(player.gearBag[index]);player.gearBag.splice(index,1);gearSelected=null;updateHUD();saveGame();return true;}
function gearDiscardAll(){
 gearEnsure();if(!player.gearBag.length)return false;const ids=new Set(player.gearBag.map(i=>i.id)),count=ids.size;
 tConfirm('Descartar '+count+' equipamento(s) da mochila? Esta ação não pode ser desfeita. Itens equipados e consumíveis serão mantidos.','DESCARTAR '+count+' PEÇAS',()=>{player.gearBag=player.gearBag.filter(i=>!ids.has(i.id));if(gearSelected?.id&&ids.has(gearSelected.id))gearSelected=null;gearPage=0;saveGame();tPause('equipment');},()=>tPause('equipment'));return true;
}
function gearBuy(type){
 gearEnsure();if(!gearVillage()||!EquipmentModel.slots[type]||player.gearBag.length>=EquipmentModel.CAPACITY)return false;
 const level=player.waveProgress.unlocked,cost=EquipmentModel.price(level);if(player.gold<cost)return false;
 const item=EquipmentModel.generate(level,BuildModel,Math.random,type,false,'eq-'+Date.now().toString(36)+'-'+(++gearSerial));
 player.gold-=cost;player.gearBag.push(item);gearPage=Math.floor((player.gearBag.length-1)/30);gearSelected={id:item.id};updateHUD();saveGame();playSound('pickupMp');return true;
}
function gearPickup(drop){gearEnsure();if(!lootDropAllowed(drop)||player.gearBag.length>=EquipmentModel.CAPACITY)return false;player.gearBag.push(drop.item);floatMsg('+'+gearName(drop.item),innerWidth/2,innerHeight*.42,EquipmentModel.rarities[drop.item.rarity].color);playSound('pickupMp');return true;}
function gearCollectAvailable(){let collected=false;for(let i=droppedItems.length-1;i>=0;i--)if(droppedItems[i].type==='equipment'&&gearPickup(droppedItems[i])){droppedItems.splice(i,1);collected=true;}if(collected)saveGame();}
function gearLeave(next){
 if(player.hp<=0||P.deadT>0)return next();
 gearCollectAvailable();const remaining=droppedItems.filter(d=>d.type==='equipment'&&lootDropAllowed(d)).length;
 if(!remaining)return next();
 if(CAMP.on&&!CAMP.inStage)CAMP.noWaves=true;
 setPause(true);tConfirm(remaining+' equipamento(s) ficarão no chão porque a mochila está cheia. Sair mesmo assim?','SAIR',()=>{setPause(false);next();},()=>tPause('equipment'));
}
function gearSelectWave(n){gearEnsure();if(!gearVillage())return false;n=Math.floor(Number(n));if(!Number.isFinite(n)||n<1||n>player.waveProgress.unlocked)return false;player.waveProgress.selected=n;saveGame();return true;}
function gearOpen(tab='equipment'){if(TITLE.active||COMIC.active||CAMP.map||P.deadT>0)return;setPause(true);tPause(tab);}
function gearReturnToStory(){
 if(CAMP.on||TITLE.active||COMIC.active||P.deadT>0||!['hub','field'].includes(gameState))return false;
 const resume=()=>gearLeave(()=>campToCampaign());
 if(gameState==='field')tConfirm('Voltar à história encerra a tentativa atual. Seu personagem, equipamentos e progresso da campanha serão preservados.','VOLTAR À HISTÓRIA',resume,()=>tPause());
 else resume();
 return true;
}
function gearIcon(type){
 const paths={staff:'M12 56 34 12M30 15c-12-1-11-15-2-14 12 1 14 18 3 20M11 51l7 4M8 55l8 5',grimoire:'M9 12 33 8 39 13 39 51 15 56 9 51ZM15 17l24-4M15 17v39M9 12l6 5M23 26l8-2 4 8-7 10-7-7Z',body:'M18 9l6 5 7-5 12 11-6 11-5-4 5 29H11l5-29-5 4-6-11ZM18 9l6 17 7-17M18 40h13',head:'M6 43c0-24 6-35 18-38 12 3 18 14 18 38l-10 9H16ZM15 36c0-13 3-20 9-23 6 3 9 10 9 23l-9 7ZM6 43l18 15 18-15',boots:'M9 10h13v24l-7 8H6v13h20V10M29 10h13v28l-7 6h-8v12h20M9 17h13M29 17h13',ring1:'M24 13 32 21 24 29 16 21ZM18 28c-15 5-13 28 6 28s21-23 6-28M12 37c7 5 17 5 24 0',ring2:'M24 13 32 21 24 29 16 21ZM18 28c-15 5-13 28 6 28s21-23 6-28M12 37c7 5 17 5 24 0'};
 return '<svg viewBox="0 0 48 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[type]+'"/></svg>';
}
function gearSilhouette(){return '<svg class="gear-silhouette" viewBox="0 0 240 380" aria-hidden="true"><g fill="#28302a" stroke="#777759" stroke-width="1.5"><path d="M82 81Q80 29 120 15q40 14 38 66l-18 30H100Z"/><path d="M100 87 62 108 42 197 61 211 82 143 75 270 55 344q65 30 130 0l-20-74-7-127 21 68 19-14-20-89-38-21-20 19Z"/><path d="m84 144 10 125-20 69m82-194-10 125 20 69M100 104l20 158 20-158M76 219q44 15 88 0"/><path d="m61 205-16 29-10-4 7-33m137 8 16 29 10-4-7-33M91 347v22h24l5-19m29-3v22h-24l-5-19"/><ellipse cx="120" cy="66" rx="21" ry="27" fill="#111711"/><path d="m107 63 8 2m10 0 8-2m-18 15h10" stroke="#c4c69a"/></g><circle cx="120" cy="181" r="63" fill="none" stroke="#8a8055" stroke-dasharray="2 7" opacity=".25"/></svg>';}
function gearRenderStats(host,chosen,selection=gearSelected,compareSlot=gearCompareSlot){
 const current=EquipmentModel.snapshot(BuildModel,player,MINION_DEFS,COMBAT_TUNING),next={...player.equipment};let comparison='Selecione uma peça para prever a troca.';
 if(chosen){if(selection?.slot){delete next[selection.slot];comparison='Prévia ao desequipar '+EquipmentModel.slots[selection.slot].name+'.';}else{const slot=chosen.type.startsWith('ring')?compareSlot:chosen.type;next[slot]=chosen;comparison='Prévia ao equipar em '+EquipmentModel.slots[slot].name+'.';}}
 const preview=chosen?EquipmentModel.snapshot(BuildModel,player,MINION_DEFS,COMBAT_TUNING,next):current;
 const num=n=>n===null||n===undefined?'—':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
 const delta=(a,b,inverse=false)=>{if(a===null||b===null||!chosen)return '';const d=b-a;if(Math.abs(d)<.005)return '<span class="stat-neutral">=</span>';return '<span class="'+((inverse?d<0:d>0)?'stat-up':'stat-down')+'">'+(d>0?'+':'')+num(d)+'</span>';};
 host.innerHTML='<div class="gear-stat-heading"><h3>Status do personagem</h3><span>'+comparison+'</span></div><div class="gear-stat-target"></div><table class="gear-stat-table"><thead><tr><th>Atributo</th><th>Atual</th><th>Prévia</th><th>Dif.</th></tr></thead><tbody></tbody></table><details class="gear-dps"><summary>Dano e DPS das habilidades <small>Ver análise</small></summary><p class="gear-dps-note">Potencial por alvo, sem erro ou resistência. Cada skill é avaliada sozinha. DPS por recarga usa mana disponível; DPS contínuo usa apenas a regeneração. Chuva considera os 7 fragmentos acertando; horda considera todos vivos e próximos. Não some estas colunas como DPS total da build.</p><div class="gear-skill-table-wrap"><table class="gear-skill-table"><thead><tr><th>Habilidade</th><th>Dano / uso</th><th>Recarga</th><th>DPS potencial</th><th>DPS contínuo</th></tr></thead><tbody></tbody></table></div></details>';
 const dps=host.querySelector('.gear-dps');dps.open=gearDpsOpen;dps.ontoggle=()=>{if(dps.isConnected)gearDpsOpen=dps.open;};
 if(chosen&&!selection?.slot&&chosen.type.startsWith('ring'))for(const slot of ['ring1','ring2']){const b=document.createElement('button');b.className='btn';b.textContent='Comparar '+EquipmentModel.slots[slot].name.toLowerCase();b.setAttribute('aria-pressed',String(compareSlot===slot));b.onclick=()=>{gearCompareSlot=slot;tPause('equipment');};host.querySelector('.gear-stat-target').append(b);}
 const labels={defense:['Defesa',''],defenseMitigation:['Mitigação contra monstro Nv. '+player.level+' (máx. 70%)','%'],hp:['Vida máxima',''],mp:['Mana máxima',''],spell:['Base de dano mágico',''],regen:['Regeneração de mana','/s'],hpRegen:['Regeneração de vida','/s'],move:['Movimento',' u/s'],cooldown:['Redução de recarga dos itens','%'],hordeHp:['Vida da horda equipada',''],hordeRegen:['Regeneração da horda equipada','/s'],hordeDps:['DPS básico da horda equipada','']};
 for(const [key,[label,unit]]of Object.entries(labels)){const a=current.attributes[key],b=preview.attributes[key];host.querySelector('.gear-stat-table tbody').insertAdjacentHTML('beforeend','<tr class="'+(chosen&&Math.abs(b-a)>=.005?'gear-stat-changed':'gear-stat-unchanged')+'" data-stat="'+key+'"><th>'+label+'</th><td>'+num(a)+unit+'</td><td>'+num(b)+unit+'</td><td>'+delta(a,b)+'</td></tr>');}
 const value=(a,b,inverse=false)=>'<span>'+num(a)+'</span>'+(chosen&&a!==null&&b!==null&&Math.abs(b-a)>=.005?'<span class="stat-arrow"> → </span><strong>'+num(b)+'</strong> '+delta(a,b,inverse):'');
 for(const skill of current.skills){const after=preview.skills.find(s=>s.id===skill.id)||skill;host.querySelector('.gear-skill-table tbody').insertAdjacentHTML('beforeend','<tr data-skill="'+skill.id+'"><th>'+skill.name+'<small>'+(skill.equipped?'Equipada':'Não equipada')+' · '+skill.mana+' MP<br>'+skill.note+'</small></th><td>'+value(skill.damage,after.damage)+'</td><td>'+value(skill.cooldown,after.cooldown,true)+' s</td><td>'+value(skill.dps,after.dps)+'</td><td>'+value(skill.sustained,after.sustained)+'</td></tr>');}
}
function gearRender(body){
 gearEnsure();body.innerHTML='<div class="gear-header"><div><small>RELICÁRIO DE ZEPHYR</small><h2>Inventário</h2></div><span>'+player.gearBag.length+'/'+EquipmentModel.CAPACITY+' peças · '+player.gold+' ouro</span></div><div class="gear-layout"><section class="gear-bag gear-frame" aria-label="Mochila"></section><section class="gear-character gear-frame" aria-label="Equipamentos do personagem"><h3>Personagem</h3><div class="gear-paperdoll">'+gearSilhouette()+'<div class="gear-slots" aria-label="Equipados"></div></div><p class="gear-character-note">ZEPHYR · NÍVEL '+player.level+'</p></section><section class="gear-detail" aria-live="polite"></section></div><div class="gear-totals"></div><section class="gear-merchant"></section>';
 const button=(host,text,action,disabled=false)=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=text;b.disabled=disabled;b.onclick=()=>{action();tPause('equipment');};host.append(b);return b;};
 const slots=body.querySelector('.gear-slots'),bag=body.querySelector('.gear-bag'),detail=body.querySelector('.gear-detail');
 const close=document.createElement('button');close.className='btn gear-close';close.textContent='Fechar · I';close.onclick=()=>setPause(false);body.querySelector('.gear-header').append(close);
 const title=document.querySelector('.pt');if(title)title.textContent='— INVENTÁRIO —';
 bag.innerHTML='<h3>Mochila <small>'+player.gearBag.length+'/'+EquipmentModel.CAPACITY+'</small></h3><div class="gear-grid" role="group" aria-label="Células da mochila"></div><div class="gear-pages" aria-label="Bolsas"></div>';
 for(const [slot,def]of Object.entries(EquipmentModel.slots)){
  const item=player.equipment[slot],b=button(slots,def.icon+' '+def.name+' · '+(item?EquipmentModel.rarities[item.rarity].name+' Nv.'+item.level:'vazio'),()=>{gearSelected={slot};});
  b.classList.add('gear-slot','gear-slot-'+slot);b.dataset.gearSlot=slot;b.title=b.textContent;b.setAttribute('aria-label',b.textContent);b.innerHTML=gearIcon(slot)+'<span>'+def.name+'</span>'+(item?'<em>'+item.level+'</em>':'');
  if(item){b.classList.add('filled');b.style.setProperty('--gear-color',EquipmentModel.rarities[item.rarity].color);}if(gearSelected?.slot===slot)b.setAttribute('aria-pressed','true');
 }
 gearPage=Math.max(0,Math.min(1,gearPage));const grid=bag.querySelector('.gear-grid');
 for(let index=gearPage*30;index<(gearPage+1)*30;index++){
  const item=player.gearBag[index],b=button(grid,item?gearName(item)+' · Nv.'+item.level:'Espaço vazio '+(index+1),()=>{if(item)gearSelected={id:item.id};},!item);
  b.classList.add('gear-cell');b.setAttribute('aria-label',b.textContent);b.title=item?b.textContent:'';b.innerHTML=item?gearIcon(item.type)+'<span class="gear-item-level">'+item.level+'</span>':'';
  if(item){b.dataset.gearId=item.id;b.draggable=true;b.style.setProperty('--gear-color',EquipmentModel.rarities[item.rarity].color);b.classList.add('filled');if(gearSelected?.id===item.id)b.setAttribute('aria-pressed','true');}
 }
 for(let page=0;page<2;page++){const b=button(bag.querySelector('.gear-pages'),'Bolsa '+(page===0?'I':'II'),()=>{gearPage=page;gearSelected=null;});b.setAttribute('aria-pressed',String(gearPage===page));}
 const discard=document.createElement('button');discard.type='button';discard.className='btn gear-discard-all';discard.textContent='Descartar tudo da mochila';discard.disabled=!player.gearBag.length;discard.onclick=gearDiscardAll;const management=document.createElement('section');management.className='gear-management';management.innerHTML='<h3>Gerenciar mochila</h3><p>O descarte pede confirmação. Equipamentos em uso ficam protegidos.</p>';management.append(discard);body.append(management);
 bag.insertAdjacentHTML('beforeend','<p class="gear-bag-note" role="status">Arraste uma peça até um slot iluminado ou clique para comparar e equipar.</p>');
 bag.append(lootFilterControl());
 const chosen=gearSelected?.slot?player.equipment[gearSelected.slot]:player.gearBag.find(i=>i.id===gearSelected?.id);
 const stats=document.createElement('section');stats.className='gear-stats gear-frame';stats.setAttribute('aria-label','Status e prévia de equipamentos');body.querySelector('.gear-layout').insertBefore(stats,detail);gearRenderStats(stats,chosen);body.querySelector('.gear-layout').insertBefore(stats.querySelector('.gear-dps'),detail);
 gearRenderDetail(detail,chosen);
 const totals=EquipmentModel.bonuses(player),extra=EquipmentModel.effects(BuildModel,player.skillRanks||{},player.equipment).extra;
 body.querySelector('.gear-totals').innerHTML='<h3>Bônus equipados</h3><p>'+Object.entries(totals).filter(([,v])=>v).map(([stat,value])=>EquipmentModel.describe({stat,value},BuildModel)).join(' · ')+'</p><p>'+Object.entries(extra).filter(([,n])=>n).map(([id,n])=>BuildModel.byId[id].name+': '+skillRank(id)+' investidos + '+n+' de equipamento = '+(skillRank(id)+n)).join(' · ')+'</p>';
 const merchant=body.querySelector('.gear-merchant');
 if(gearVillage()){
  const level=player.waveProgress.unlocked,cost=EquipmentModel.price(level);
  merchant.innerHTML='<h3>Mercador de relíquias misteriosas</h3><p>Peça nível '+level+' · '+cost+' ouro. Revelada após a compra.</p><p>Comum 60% · Mágico 28% · Raro 10% · Épico 2%</p>';
  const choose=document.createElement('div');choose.className='gear-shop-types';merchant.append(choose);
  for(const [type,def]of Object.entries(EquipmentModel.slots)){const b=button(choose,def.name,()=>{gearShopType=type;});b.setAttribute('aria-pressed',String(gearShopType===type));}
  button(merchant,'Comprar '+EquipmentModel.slots[gearShopType].name+' · '+cost+' ouro',()=>gearBuy(gearShopType),player.gold<cost||player.gearBag.length>=EquipmentModel.CAPACITY);
 }else merchant.innerHTML='<p class="section-note">Compre relíquias e venda equipamentos na vila. Atalho I abre esta mochila.</p>';
 gearBindDrag(body);
}
function gearRenderDetail(detail,chosen,selection=gearSelected,compareSlot=gearCompareSlot){
 const button=(text,action,disabled=false)=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=text;b.disabled=disabled;b.onclick=()=>{action();tPause('equipment');};detail.querySelector('.gear-detail-actions').append(b);return b;};
 detail.innerHTML='<h3>Comparar equipamentos</h3>';
 if(!chosen){detail.insertAdjacentHTML('beforeend','<p class="gear-detail-empty">Selecione uma peça na mochila ou arraste até o personagem para comparar os atributos.</p>');return;}
 const equipped=!!selection?.slot,slot=equipped?selection.slot:chosen.type.startsWith('ring')?compareSlot:chosen.type,current=equipped?null:player.equipment[slot];
 const key=a=>a.stat+':'+(a.target||''),rows=new Map();
 for(const item of [current,chosen].filter(Boolean))for(const a of item.affixes)rows.set(key(a),a);
 const ordered=[...rows.entries()].sort(([a],[b])=>a.localeCompare(b));
 const dormant=a=>a.stat==='skill'&&!skillRank(a.target)||a.stat==='school'&&!BuildModel.nodes.some(n=>n.school===a.target&&n.max>1&&skillRank(n.id));
 function card(item,title){
  const rarity=item&&EquipmentModel.rarities[item.rarity];
  return '<article class="gear-card"'+(rarity?' style="border-color:'+rarity.color+'"':'')+'><small>'+title+'</small><h3'+(rarity?' style="color:'+rarity.color+'"':'')+'>'+(item?gearName(item):'Slot vazio')+'</h3><p class="gear-item-meta">'+(item?'Nível '+item.level+' · '+rarity.name:EquipmentModel.slots[slot].name)+'</p></article>';
 }
 detail.insertAdjacentHTML('beforeend','<p class="gear-comparison-target">'+EquipmentModel.slots[slot].name+'</p><div class="gear-comparison-cards">'+(equipped?card(chosen,'EQUIPADO'):card(current,'EQUIPADO')+card(chosen,'SELECIONADO'))+'</div><div class="gear-detail-actions"></div>');
 const values=(a,b)=>{
  const value=v=>v?'+'+Number(v.value).toLocaleString('pt-BR',{maximumFractionDigits:2})+(EquipmentModel.attributes[v.stat]?.percent?'%':'')+(dormant(v)?'<small>inativo</small>':''):'<span class="gear-affix-missing">—</span>';
  return equipped?'<td>'+value(b)+'</td>':'<td>'+value(a)+'</td><td class="'+((b?.value||0)>(a?.value||0)?'stat-up':(b?.value||0)<(a?.value||0)?'stat-down':'')+'">'+value(b)+'</td>';
 };
 const label=a=>EquipmentModel.describe({...a,value:0},BuildModel).replace(/^\+0%?\s*/, '').replace(/^em /,'');
 const table=document.createElement('table');table.className='gear-item-comparison';table.innerHTML='<thead><tr><th>Atributo</th>'+(equipped?'<th>Equipado</th>':'<th>Equipado</th><th>Selecionado</th>')+'</tr></thead><tbody><tr class="gear-base-row"><th>Base · '+label(chosen.base)+'</th>'+values(current?.base,chosen.base)+'</tr>'+ordered.map(([k,a])=>'<tr data-affix="'+k+'"><th>'+label(a)+'</th>'+values(current?.affixes.find(v=>key(v)===k),chosen.affixes.find(v=>key(v)===k))+'</tr>').join('')+'</tbody>';
 detail.insertBefore(table,detail.querySelector('.gear-detail-actions'));
 if(equipped)button('Desequipar',()=>gearUnequip(slot),player.gearBag.length>=EquipmentModel.CAPACITY);
 else{
  const targets=chosen.type.startsWith('ring')?['ring1','ring2']:[chosen.type];
  for(const target of targets){const b=button('Equipar · '+EquipmentModel.slots[target].name,()=>gearEquip(chosen.id,target));if(target===slot)b.classList.add('gear-equip-primary');}
  if(gearVillage())button('Vender por '+EquipmentModel.sellPrice(chosen)+' ouro',()=>gearSell(chosen.id));
  else button('Descartar peça',()=>{player.gearBag=player.gearBag.filter(i=>i.id!==chosen.id);gearSelected=null;saveGame();});
 }
}
function gearBindDrag(body){
 const slots=[...body.querySelectorAll('.gear-slot')],stats=body.querySelector('.gear-stats'),note=body.querySelector('.gear-bag-note'),hint=note.textContent;
 let dragged=null,source=null,hovered=null;
 const compatible=slot=>dragged&&(dragged.type===slot||dragged.type.startsWith('ring')&&slot.startsWith('ring'));
 function preview(item,selection,slot){
  const oldDps=body.querySelector('.gear-layout > .gear-dps');
  gearRenderStats(stats,item,selection,slot);
  gearRenderDetail(body.querySelector('.gear-detail'),item,selection,slot);
  const dps=stats.querySelector('.gear-dps');
  if(oldDps)oldDps.replaceWith(dps);else body.querySelector('.gear-layout').insertBefore(dps,body.querySelector('.gear-detail'));
 }
 function restorePreview(){const item=gearSelected?.slot?player.equipment[gearSelected.slot]:player.gearBag.find(i=>i.id===gearSelected?.id);preview(item,gearSelected,gearCompareSlot);}
 function clear(){
  if(!dragged)return;
  dragged=null;hovered=null;source?.classList.remove('gear-drag-source');source=null;
  body.classList.remove('gear-dragging');
  slots.forEach(b=>b.classList.remove('gear-drop-compatible','gear-drop-hover'));
  note.textContent=hint;restorePreview();
 }
 for(const cell of body.querySelectorAll('.gear-cell[draggable="true"]')){
  cell.addEventListener('dragstart',e=>{
   const item=player.gearBag.find(i=>i.id===cell.dataset.gearId);
   if(!item||!e.dataTransfer){e.preventDefault();return;}
   dragged=item;source=cell;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',item.id);
   body.classList.add('gear-dragging');cell.classList.add('gear-drag-source');
   slots.forEach(b=>b.classList.toggle('gear-drop-compatible',!!compatible(b.dataset.gearSlot)));
   note.textContent='Arrastando '+gearName(item)+'. Solte em um slot iluminado para equipar. Esc cancela.';
   preview(item,{id:item.id},gearCompareSlot);
  });
  cell.addEventListener('dragend',clear);
 }
 for(const target of slots){
  function over(e){
   const slot=target.dataset.gearSlot;if(!compatible(slot))return;
   e.preventDefault();e.dataTransfer.dropEffect='move';
   if(hovered===target)return;
   hovered?.classList.remove('gear-drop-hover');hovered=target;target.classList.add('gear-drop-hover');
   note.textContent='Solte para equipar em '+EquipmentModel.slots[slot].name+(player.equipment[slot]?' e devolver a peça atual à mochila.':'.');
   preview(dragged,{id:dragged.id},slot);
  }
  target.addEventListener('dragenter',over);target.addEventListener('dragover',over);
  target.addEventListener('dragleave',e=>{
   if(target.contains(e.relatedTarget)||hovered!==target)return;
   hovered=null;target.classList.remove('gear-drop-hover');note.textContent='Solte em um slot iluminado para equipar. Esc cancela.';restorePreview();
  });
  target.addEventListener('drop',e=>{
   const slot=target.dataset.gearSlot;if(!compatible(slot))return;
   e.preventDefault();e.stopPropagation();const id=dragged.id;clear();
   if(gearEquip(id,slot)){if(slot.startsWith('ring'))gearCompareSlot=slot;tPause('equipment');}
  });
 }
 body.ondragover=e=>{if(dragged&&!e.defaultPrevented){e.preventDefault();e.dataTransfer.dropEffect='none';}};
 body.ondrop=e=>{if(dragged){e.preventDefault();clear();}};
}
function gearRenderWaves(body){
 gearEnsure();const p=player.waveProgress;
 body.innerHTML='<div class="gear-header"><h2>Pedra do Infinito</h2><span>Recorde concluído: '+p.best+'</span></div><p>Escolha uma wave desbloqueada. Repetir waves anteriores mantém seu recorde e reduz a dificuldade e o nível do loot.</p><div class="gear-wave-picker"></div><div class="gear-wave-info"></div>';
 const picker=body.querySelector('.gear-wave-picker');
 for(let n=1;n<=p.unlocked;n++){const b=document.createElement('button');b.className='btn';b.textContent=String(n);b.disabled=!gearVillage();b.setAttribute('aria-label','Selecionar wave '+n);b.setAttribute('aria-pressed',String(p.selected===n));b.onclick=()=>{gearSelectWave(n);tPause('waves');};picker.append(b);}
 const s=EquipmentModel.waveStats(p.selected),info=body.querySelector('.gear-wave-info');
 info.innerHTML='<h3>Wave '+p.selected+'</h3><p>Vida dos monstros ×'+s.hp.toFixed(2)+' · dano ×'+s.damage.toFixed(2)+' · loot nível '+s.itemLevel+'</p><p>Conclusão: +'+(20+p.selected*8)+' XP e +'+(3+p.selected*2)+' ouro, além dos monstros. Loja: peças nível '+p.unlocked+'.</p>';
 const b=document.createElement('button');b.className='btn';b.textContent='Entrar na wave '+p.selected;b.disabled=!gearVillage();b.onclick=()=>{setPause(false);startEndless();};info.append(b);
}
function installEquipment(){
 gearEnsure();
 for(const [name,values]of Object.entries(COMBAT_TUNING.specials))Object.assign(MOB_ABILITIES[name],values);
 const pause=tPause;tPause=function(tab){pause(tab);const tabs=document.querySelector('.pmtabs'),body=document.querySelector('.pmbody');if(!tabs||!body)return;
  for(const [id,name]of [['equipment','EQUIPAMENTOS'],['waves','WAVES']]){if(id==='waves'&&!gearVillage())continue;const b=document.createElement('button');b.className='pmtab'+(PM.tab===id?' on':'');b.textContent=name;b.onclick=()=>tPause(id);tabs.append(b);}
  if(PM.tab==='equipment')gearRender(body);if(PM.tab==='waves')gearRenderWaves(body);
  if(!CAMP.on&&['hub','field'].includes(gameState)){const b=document.createElement('button');b.className='btn';b.textContent='Voltar à história';b.onclick=gearReturnToStory;document.querySelector('.pmside')?.append(b);}
  if(currentMission?.endless){const b=document.createElement('button');b.className='btn';b.textContent='Voltar à vila';b.onclick=()=>{setPause(false);enterHub();};document.querySelector('.pmside')?.append(b);}
  const root=document.querySelector('.pm');if(root){
   root.classList.add('menu-standard');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','pause-dialog-title');
   const title=root.querySelector('.pt');if(title){title.id='pause-dialog-title';title.textContent='— RELICÁRIO DE ZEPHYR —';}
   const summary=document.createElement('div');summary.className='menu-summary';root.insertBefore(summary,root.querySelector('.pmmain'));menuUpdateSummary();
   const side=root.querySelector('.pmside'),actions=document.createElement('div');actions.className='menu-actions';if(side){for(const child of [...side.children])if(child.tagName==='BUTTON')actions.append(child);side.remove();}root.append(actions);
  }
 };
 const refreshSkills=skillRefresh;skillRefresh=function(){const result=refreshSkills();menuUpdateSummary();return result;};
 const controls=pmControlsHtml;pmControlsHtml=function(){return controls()+'<p class="section-note">I · Equipamentos. Na vila, abra WAVES para escolher a dificuldade e EQUIPAMENTOS para comprar ou vender.</p>';};
 const shop=buildShopGrid;buildShopGrid=function(){shop();const host=document.getElementById('shop-grid');if(!host||!gearVillage()||host.querySelector?.('.gear-world-shop'))return;const b=document.createElement('button');b.className='btn gear-world-shop';b.textContent='Relíquias · Comprar equipamentos';b.onclick=()=>{closeHubOverlay();gearOpen('equipment');};host.prepend(b);};
 const tree=buildSkillTree;buildSkillTree=function(){tree();const detail=document.querySelector('.lg-detail');if(!detail)return;const rank=skillRank(skillTreeSelected),n=EquipmentModel.effects(BuildModel,player.skillRanks||{},player.equipment).extra[skillTreeSelected]||0;const p=document.createElement('p');p.className='gear-skill-bonus';p.textContent=rank+' investidos + '+n+' de equipamento = '+(rank+n)+' efetivos. Equipamentos não liberam pré-requisitos.';detail.prepend(p);};
 const newChar=campNewChar;campNewChar=function(){player.equipment={};player.gearBag=[];player.waveProgress=EquipmentModel.progress();ENDLESS.best=0;gearSelected=null;return newChar();};
 const load=loadGame;loadGame=function(){const result=load();if(result)ENDLESS.best=player.waveProgress.best;return result;};
 const spawn=spawnEnemy;spawnEnemy=function(type,x,z){const e=spawn(type,x,z);e.gearWave=gearCurrentWave();if(!e.isBoss){e.spd=(e.spd??type.spd??0)*COMBAT_TUNING.enemySpeed;e.atkRate=['Arqueiro','Mago Vivo'].includes(type.name)?COMBAT_TUNING.rangedInterval:COMBAT_TUNING.meleeInterval;e.abilityCd=COMBAT_TUNING.specialDelayMin+Math.random()*(COMBAT_TUNING.specialDelayMax-COMBAT_TUNING.specialDelayMin);}if(currentMission?.endless&&!CAMP.on){const s=EquipmentModel.waveStats(wave);e.hp=e.maxHp=Math.round(type.hp*s.hp);e.dmg=Math.round(type.dmg*s.damage);e.xp=Math.round(type.xp*s.xp);}return e;};
 spawnDrop=function(x,z){const hp=Math.random()<COMBAT_TUNING.hpOrbShare;droppedItems.push({mesh:mkMesh2(x+(Math.random()-.5)*.6,z+(Math.random()-.5)*.6),type:hp?'hp':'mp',life:22,t:0});};
 const death=killEnemy;killEnemy=function(e,x,z){
  if(e.dead)return;e.dropChance=COMBAT_TUNING.orbChance;
  const tier=e.expedition?ExpeditionModel.tiers[e.lootTier]:null;
  const reward=!e.dummy&&(e.isBoss||Math.random()<(tier?.chance??COMBAT_TUNING.gearChance)),level=e.gearWave||gearCurrentWave();
  if(reward){
   const roll=EquipmentModel.dropRoll(player.equipment,level),weights=e.expeditionBoss?{common:0,magic:0,rare:75,epic:25}:tier?ExpeditionModel.lootWeights(e.lootTier):undefined;
   const regional=typeof endgameLootConfig==='function'?endgameLootConfig(e,roll):null;
   const item=EquipmentModel.generate(regional?.level??roll.level,BuildModel,Math.random,regional?.type??roll.type,!!e.isBoss,'eq-'+Date.now().toString(36)+'-'+(++gearSerial),{loot:{weights:regional?.weights??weights,unboundedLevel:!!regional}});
   if(regional?.special)item.special='carcomido';
   droppedItems.push({type:'equipment',item,upgrade:roll.upgrade,mesh:mkMesh2(x,z),life:Infinity,t:0});
  }
  return death(e,x,z);
 };
 const pickup=checkPickups;checkPickups=function(dt){
  const equipment=droppedItems.filter(d=>d.type==='equipment');droppedItems=droppedItems.filter(d=>d.type!=='equipment');pickup(dt);let changed=false;
  for(const d of equipment){d.t+=dt;if(lootDropAllowed(d)&&Math.hypot(d.mesh.position.x-P.x,d.mesh.position.z-P.y)<1.8){if(gearPickup(d)){changed=true;continue;}if(Date.now()>gearNoticeAt){floatMsg('Mochila cheia · I para equipamentos',innerWidth/2,innerHeight*.4,'#e8c777');gearNoticeAt=Date.now()+3000;}}droppedItems.push(d);}if(changed)saveGame();
 };
 const hub=enterHub;enterHub=function(){return gearLeave(()=>hub());};
 const map=campMapOpen;campMapOpen=function(){return gearLeave(()=>map());};
 const start=startEndless;startEndless=function(){gearEnsure();const selected=player.waveProgress.selected;start();wave=selected-1;missionWave=selected-1;};
 const end=endWave;endWave=function(){const endless=!!currentMission?.endless,finished=missionWave;if(endless&&!waveActive)return;if(endless){player.waveProgress=EquipmentModel.complete(player.waveProgress,finished);ENDLESS.best=player.waveProgress.best;}const result=end();if(endless)saveGame();return result;};
 const offer=vilOpen;vilOpen=function(id){offer(id);if(id==='endless'){const card=VIL.modal?.querySelector('.offer');if(!card)return;const p=player.waveProgress,b=document.createElement('button');b.className='btn';b.textContent='Escolher wave · atual '+p.selected+' / liberada '+p.unlocked;b.onclick=()=>{vilClose();gearOpen('waves');};card.append(b);}};
 for(const [name,key,base]of [['castRaio','raio',.5],['castHands','maos',12],['castChuva','chuva',5],['castExplosao','explosao',8],['skillCastCurse','maldicao',8]]){
  // Global function declarations in this script share the browser global object.
  const original=globalThis[name];globalThis[name]=function(...args){const mp=player.mp,result=original(...args);if(player.mp<mp)player.spellCooldowns[key]=Math.max(base*.5,(player.spellCooldowns[key]||0)*(1-gearBonus('cooldown')/100));return result;};
 }
 const barrier=castBarrier;castBarrier=function(...args){const mp=player.mp,result=barrier(...args);if(player.mp<mp)player.barrierCd=Math.max(6,player.barrierCd*(1-gearBonus('cooldown')/100));return result;};
 const dash=castDash;castDash=function(...args){const result=dash(...args);if(result)playerDash.cd=Math.max(1.5,playerDash.cd*(1-gearBonus('cooldown')/100));return result;};
 const command=activateSummonSkill;activateSummonSkill=function(type,...args){const result=command(type,...args);if(result)player.minionSkillCooldowns[type]=Math.max(ACTION_SKILLS[type].cooldown*.5,player.minionSkillCooldowns[type]*(1-gearBonus('cooldown')/100));return result;};
 window.addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='i'||e.repeat||TITLE.active||COMIC.active||CAMP.map||document.getElementById('hub-overlay')?.style.display==='flex'||VIL.open)return;if(['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;e.preventDefault();e.stopImmediatePropagation();if(TITLE.paused&&PM.tab==='equipment')setPause(false);else gearOpen();},true);
}
installEquipment();
