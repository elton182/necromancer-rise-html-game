import {available} from './actions.mjs';
import Build from './full-build.mjs';
import {Model,masteryBonus,masteryFactor} from './mastery.mjs';
import {TYPES,snapshotHorde,initializeHorde,locked,recalculateHorde,effects} from './horde.mjs';
import {applyAttributes} from './progression.mjs';
import {setLichRanks} from './lich-model.mjs';
import {LICH_ABILITIES} from './lich-mastery.mjs';
export {Build,Model};
export const SPELL_TEST_PROFILE={version:1,level:24,act1:false,ranks:{bolt:2,rain:2,wall:1,shield:2,nova:1,dash:2,meditate:2,curse:1,zombie:2,vigor:2}};
// A edição vale no menu, na vila e no mapa; no treino, só com o Relicário aberto (mundo pausado), pois o refresh preserva vida e recuperação dos integrantes.
export function editReason(s){return s.world.armyMode!=='groups'?'Ative os grupos reais.':!(['menu','village','map'].includes(s.scene)||s.scene==='training'&&s.world.paused)?'Volte ao menu para preparar o Grimório.':TYPES.some(t=>locked(s.world,t))?'Aguarde a recuperação dos integrantes.':'';}
// Recalcula tudo o que deriva de nível, árvore, maestria e equipamento, sem curar nem acumular bônus.
export function syncSkills(w){
 applyAttributes(w);
 if(w.armyMode!=='groups')return;
 setLichRanks(w,w.army.profile.ranks);
 const e=effects(w),bolt=masteryBonus(w,'raio'),dash=masteryBonus(w,'dash');
 w.modifiers={...w.modifiers,boltDamagePercent:100*((1+(e['Dano do Tiro de Osso']||0)/100)*(1+(bolt.damage||0)/100)-1),extraPierce:(e['Alvos perfurados adicionais']||0)+(bolt.pierce||0),lance:!!w.army.profile.ranks.lance,shards:!!w.army.profile.ranks.shards,boltMasteryCooldown:bolt.cooldown||0,dashCooldownPercent:e['Recarga do Dash']||0,dashDistancePercent:100*((1+(e['Distância do Dash']||0)/100)*masteryFactor(w,'dash','distance')-1),dashMasteryCooldown:dash.cooldown||0,veilDuration:w.army.profile.ranks.veil ? .18+1+(e['Duração da proteção após Dash']||0)/100:0};
}
function refresh(s,state){
 const w=s.world;w.actors=w.actors.filter(a=>!a.groupType);initializeHorde(w,state);syncSkills(w);s.save.horde=snapshotHorde(w);
}
export function changeRank(s,id,{refund=false}={}){
 const error=editReason(s);if(error)return {ok:false,message:error};
 try{
  const state=snapshotHorde(s.world),profile=structuredClone(state.profile),before=Build.spent(profile.ranks);
  if(refund)Build.refund(profile,id);else Build.invest(profile,id);
  Build.validate(profile);const cost=refund?(before-Build.spent(profile.ranks))*20:0;
  if((s.save.character.gold||0)<cost)throw Error('Ouro insuficiente: '+cost+' ouro.');
  state.profile=profile;state.loadout=state.loadout.map(t=>!available({profile},t)?'empty':t);
  // Remover uma evocação aprendida também remove sua reserva para impedir recuperar bônus devolvidos.
  for(const bag of [state.groups,state.reserve])for(const type of Object.keys(bag))if(!profile.ranks[type])delete bag[type];
  refresh(s,state);s.save.character.gold-=cost;return {ok:true,message:refund?'Pontos devolvidos · '+cost+' ouro.':'Ponto investido.'};
 }catch(error){return {ok:false,message:error.message};}
}
// Redistribuição total: devolve todos os pontos por 20 ouro cada, como "Redistribuir" do jogo anterior.
export function resetRanks(s){
 const error=editReason(s);if(error)return {ok:false,message:error};
 try{
  const state=snapshotHorde(s.world),profile=structuredClone(state.profile),before=Build.spent(profile.ranks);
  for(const n of Build.nodes)while(profile.ranks[n.id])Build.refund(profile,n.id);
  Build.validate(profile);const cost=before*20;
  if(!before)throw Error('Nenhum ponto investido.');
  if((s.save.character.gold||0)<cost)throw Error('Ouro insuficiente: '+cost+' ouro.');
  state.profile=profile;state.loadout=state.loadout.map(t=>!available({profile},t)?'empty':t);
  for(const bag of [state.groups,state.reserve])for(const type of Object.keys(bag))if(!profile.ranks[type])delete bag[type];
  refresh(s,state);s.save.character.gold-=cost;return {ok:true,message:'Todos os pontos devolvidos · '+cost+' ouro.'};
 }catch(error){return {ok:false,message:error.message};}
}
export function changeMastery(s,id,node,{reset=false}={}){
 const error=editReason(s);if(error)return {ok:false,message:error};
 if(!(s.world.army.loadout.includes(id)||LICH_ABILITIES.includes(id)&&s.world.army.loadout.includes('lich'))||!Model.ids.includes(id))return {ok:false,message:'Equipe a habilidade para aprimorar sua maestria.'};
 try{const state=snapshotHorde(s.world),m=Model.normalize(id,state.mastery[id]);if(reset)m.ranks={};else Model.invest(id,m,node);state.mastery[id]=m;refresh(s,state);return {ok:true,message:reset?'Maestria redistribuída.':'Ponto de maestria investido.'};}catch(error){return {ok:false,message:error.message};}
}
// Recebe XP pelo contrato compartilhado, como o wrapper de gainExp do jogo atual.
export function gainMastery(s,amount){
 if(!Number.isFinite(amount)||amount<=0)return false;
 const w=s.world;if(w.armyMode!=='groups')return false;
 const raised=[];
 const ids=Model.specializations(w.army.loadout,[]);if(ids.includes('lich'))for(const id of LICH_ABILITIES)if(w.lich?.stats.unlocked[id]!==false)ids.push(id);
 for(const id of ids)if(id){const result=Model.gain(id,w.army.mastery[id],amount,w.army.profile.level);w.army.mastery[id]=result.state;if(result.levels)raised.push(Model.skills[id].name+' '+result.state.level);}
 // XP sem novo nível não altera bônus; evita recalcular a horda a cada abate.
 if(raised.length){syncSkills(w);recalculateHorde(w);}
 return {raised};
}
