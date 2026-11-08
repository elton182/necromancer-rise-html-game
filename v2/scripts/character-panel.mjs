// Aba Personagem do Relicário: modelo 3D da classe, origem dos atributos (nível e passivas ×
// equipamentos), resumo com Poder de Combate e barra de XP, e uma visão de detalhes das habilidades.
// Só apresenta valores calculados por progression.mjs; não cria atributos nem pontos novos.
import SharedEQ from './shared-equipment.mjs';
import WarriorEQ from './warrior-equipment.mjs';
import {gearCatalog} from './class-gear.mjs';
import {classInfo,isMartial,isMarksman,resourceName} from './class-registry.mjs';
import {snapshotFor,levelOf,xpNext,points,MAX_LEVEL} from './progression.mjs';
import {warriorBudget,warriorSpent,warriorRanks} from './warrior-model.mjs';
import {druidBudget,druidSpent,druidRanks} from './druid-model.mjs';
import {marksmanBudget,marksmanSpent,marksmanRanks} from './marksman-model.mjs';
import {glyph,combatPower,CLASS_STATS,numberText as num} from './character-stats.mjs';
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function createCharacterPanel(session,{portrait}){
 let host=null,go=()=>{},view='summary',focus=0,key='';
 const w=()=>session.world,warrior=()=>w().classId==='warrior',klass=()=>CLASS_STATS[w().classId]?w().classId:'necromancer';
 const EQ=()=>gearCatalog(w().classId),martial=()=>isMartial(w().classId);
 const spare=()=>{const level=levelOf(w());return warrior()?warriorBudget(level)-warriorSpent(warriorRanks(w().warriorRanks,level)):klass()==='druid'?druidBudget(level)-druidSpent(druidRanks(w().druidRanks,level)):isMarksman(klass())?marksmanBudget(level)-marksmanSpent(klass(),marksmanRanks(klass(),w().marksmanRanks,level)):points(level,w().army?.profile.ranks||{});};
 const value=(a,[k,,unit])=>num(a[k])+unit;
 function rows(list,a){return list.filter(Boolean).map(def=>'<li data-stat="'+def[0]+'" title="'+esc(def[4])+'">'+glyph(def[3])+'<span>'+esc(def[1])+'</span><b>'+value(a,def)+'</b></li>').join('');}
 function group(title,icon,list,a){return '<section class="chr-group"><h4>'+glyph(icon)+esc(title)+'</h4><ul>'+rows(list,a)+'</ul></section>';}
 function summary(a){
  const S=CLASS_STATS[klass()],c=session.save.character,level=levelOf(w()),next=xpNext(level),exp=next?Math.min(c.exp,next):0,equipped=Object.keys(EQ().slots).filter(slot=>c.equipment[slot]).length;
  const fourth=klass()!=='necromancer'?'<section class="chr-group"><h4>'+glyph('gear')+'Equipamento</h4><ul><li>'+glyph('all')+'<span>Peças equipadas</span><b>'+equipped+' / '+Object.keys(EQ().slots).length+'</b></li><li>'+glyph('book')+'<span>Peças na mochila</span><b>'+c.gearBag.length+'</b></li><li>'+glyph('coin')+'<span>Ouro</span><b>'+num(c.gold)+'</b></li></ul></section>':group('Horda','hordeHp',[S.hordeHp,S.hordeRegen,S.hordeDps],a);
  return '<header class="chr-head"><h3>Resumo do Personagem</h3></header>'
   +'<div class="chr-power" title="Índice de comparação calculado a partir dos atributos atuais. Não altera o combate.">'+glyph('power')+'<div><small>Poder de Combate</small><b>'+num(combatPower(a,martial()))+'</b></div></div>'
   +'<div class="chr-groups">'+group('Recursos','hp',[S.hp,S.mp,S.hpRegen,S.regen],a)+group('Combate','damage',[S.power,S.defense,S.block,S.cooldown],a)+group('Derivados','defenseMitigation',[S.mitigation,S.move],a)+fourth+'</div>'
   +'<div class="chr-xp"><div class="chr-level" aria-hidden="true"><span>'+level+'</span></div><div class="chr-xp-bar"><p><b>Nível '+level+'</b><span>'+(next?num(Math.floor(exp))+' / '+num(next)+' XP':'Nível máximo ('+MAX_LEVEL+')')+'</span></p><div role="progressbar" aria-label="Experiência" aria-valuemin="0" aria-valuemax="'+(next||1)+'" aria-valuenow="'+(next?Math.floor(exp):1)+'"><i style="width:'+(next?Math.min(100,exp/next*100):100).toFixed(1)+'%"></i></div></div></div>';
 }
 function origin(a,base){
  const S=CLASS_STATS[klass()],list=[S.hp,S.mp,S.power,S.defense,S.move],selected=list[Math.min(focus,list.length-1)],left=spare();
  const cards=list.map((def,i)=>{const [k,title,unit,icon,desc]=def,total=a[k]||0,fromBase=Math.min(total,base[k]||0),gear=total-fromBase;
   return '<button type="button" class="chr-stat'+(i===focus?' on':'')+'" data-index="'+i+'" data-stat="'+k+'" aria-pressed="'+(i===focus)+'">'+glyph(icon)+'<span class="chr-stat-text"><b>'+esc(title)+'</b><small>'+esc(desc.split('.')[0])+'.</small></span><span class="chr-stat-value"><b>'+num(total)+unit+'</b><small>'+num(fromBase)+unit+' base'+(Math.abs(gear)>=.005?' · '+(gear>0?'+':'')+num(gear)+unit+' itens':'')+'</small></span></button>';}).join('');
  return '<header class="chr-head"><h3>Atributos</h3><p>Pontos disponíveis: <b>'+left+'</b></p></header><div class="chr-stats">'+cards+'</div>'
   +'<article class="chr-info">'+glyph(selected[3])+'<div><h4>'+esc(selected[1])+'</h4><p>'+esc(selected[4])+'</p><p class="chr-info-split">Base (nível e passivas): <b>'+num(Math.min(a[selected[0]]||0,base[selected[0]]||0))+selected[2]+'</b> · Equipamentos: <b>'+num((a[selected[0]]||0)-Math.min(a[selected[0]]||0,base[selected[0]]||0))+selected[2]+'</b></p></div></article>'
   +'<div class="chr-actions"><button type="button" class="chr-go" data-go="equipment">'+glyph('equip')+'Ver equipamentos</button><button type="button" class="chr-go primary" data-go="skills">'+glyph('book')+(warrior()?'Treinamento':klass()==='druid'||isMarksman(klass())?'Caminhos':'Habilidades')+' ('+left+' pts)</button></div>';
 }
 function details(current){
  const c=session.save.character,skills=current.skills.map(sk=>'<tr><th>'+esc(sk.name)+'<small>'+(sk.equipped?'Equipada':'Não equipada')+(sk.mana!==undefined?' · '+sk.mana+(martial()?' '+resourceName(klass()):' MP'):'')+'</small></th><td>'+num(sk.damage)+'</td><td>'+num(sk.cooldown)+' s</td>'+(martial()?'':'<td>'+num(sk.dps)+'</td>')+'</tr>').join('');
  const gear=Object.entries(EQ().slots).map(([slot,def])=>{const item=c.equipment[slot],r=item&&EQ().rarities[item.rarity];return '<li>'+glyph('gear')+'<span>'+esc(def.name)+'</span><b'+(r?' style="color:'+r.color+'"':'')+'>'+(item?esc(r.name)+' · Nv. '+item.level+(item.enhancement?' · +'+item.enhancement:''):'vazio')+'</b></li>';}).join('');
  return '<header class="chr-head"><h3>Detalhes</h3><p>Valores atuais, com os equipamentos em uso.</p></header><div class="chr-details"><section class="chr-group"><h4>'+glyph('damage')+(martial()?'Golpes':'Habilidades')+'</h4><table class="chr-skill-table"><thead><tr><th>Habilidade</th><th>Dano / uso</th><th>Recarga</th>'+(martial()?'':'<th>DPS potencial</th>')+'</tr></thead><tbody>'+skills+'</tbody></table></section><section class="chr-group"><h4>'+glyph('gear')+'Equipados</h4><ul>'+gear+'</ul></section></div>';
 }
 function paint(){
  if(!host)return;const c=session.save.character,current=snapshotFor(w()),a=current.attributes,base=snapshotFor(w(),{}).attributes,level=levelOf(w());
  key=JSON.stringify([view,focus,level,c.exp,c.gold,c.name,w().classId,a,c.gearBag.length]);
  const layout=host.querySelector('.chr-layout');
  layout.querySelector('.chr-name').innerHTML=glyph(klass())+'<div><h3>'+esc(c.name||'Zephyr')+'</h3><p>'+classInfo(klass()).name+' • Nível '+level+'</p></div>';
  for(const b of layout.querySelectorAll('.chr-nav button'))b.setAttribute('aria-pressed',String(b.dataset.view===view));
  const main=layout.querySelector('.chr-main'),side=layout.querySelector('.chr-summary');
  if(view==='details'){main.innerHTML=details(current);side.innerHTML=summary(a);}else{main.innerHTML=origin(a,base);side.innerHTML=summary(a);}
  for(const b of main.querySelectorAll('.chr-stat'))b.onclick=()=>{focus=Number(b.dataset.index);paint();};
  for(const b of main.querySelectorAll('.chr-go'))b.onclick=()=>go(b.dataset.go);
  portrait.show({model:classInfo(klass()).model,shield:!warrior()||!!c.equipment.shield});
 }
 function render(target,navigate){
  host=target;if(navigate)go=navigate;host.replaceChildren();
  host.insertAdjacentHTML('beforeend','<div class="chr-layout"><div class="chr-hero inv-panel"><div class="chr-stage"><div class="inv-arch" aria-hidden="true"></div></div><div class="chr-name"></div><nav class="chr-nav" aria-label="Seções do personagem"><button type="button" data-view="summary">'+glyph('person')+'Atributos</button><button type="button" data-view="details">'+glyph('list')+'Detalhes</button></nav></div><section class="chr-main inv-panel" aria-live="polite"></section><section class="chr-summary inv-panel" aria-label="Resumo do personagem"></section></div>');
  host.querySelector('.chr-stage').append(portrait.element);
  for(const b of host.querySelectorAll('.chr-nav button'))b.onclick=()=>{view=b.dataset.view;paint();};
  paint();
 }
 // Chamado pelo relógio do menu: só redesenha quando algum valor exibido mudou.
 function update(){
  if(!host?.isConnected)return;const c=session.save.character,a=snapshotFor(w()).attributes;
  if(JSON.stringify([view,focus,levelOf(w()),c.exp,c.gold,c.name,w().classId,a,c.gearBag.length])!==key)paint();
 }
 return {render,update};
}
