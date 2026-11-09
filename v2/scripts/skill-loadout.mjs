// Barra montável dos atiradores (Arqueira, Mercenário, Mago) e da forma humana da Druida: seis slots
// com ids de ação. O ataque básico (primeira ação da classe) e a Esquiva ficam sempre na barra, em
// qualquer posição; as demais trocam livremente. A forma de lobo da Druida mantém a barra fixa.
// O Guerreiro usa warriorLoadout (índices), anterior a este módulo. Regras puras, sem DOM.
import {marksmanActions,marksmanLearned} from './marksman-model.mjs';
import {DRUID_HUMAN_IDS,druidActionLearned} from './druid-model.mjs';
import {isMarksman} from './class-registry.mjs';

export const LOADOUT_SLOTS=6;
// Ações equipáveis da classe, na ordem da tabela; as seis primeiras formam a barra padrão.
export function loadoutIds(classId){
 if(classId==='druid')return DRUID_HUMAN_IDS;
 if(isMarksman(classId))return marksmanActions(classId).map(a=>a.id);
 return null;
}
const fixedOf=ids=>[ids[0],'dodge'];
// Barra válida a partir do valor salvo: ids desconhecidos ou repetidos saem; ataque básico e Esquiva
// voltam se faltarem; slots vazios recebem as ações padrão que estão fora da barra.
export function normalizeLoadout(value,ids){
 const defaults=ids.slice(0,LOADOUT_SLOTS),fixed=fixedOf(ids);
 const out=Array.isArray(value)&&value.length===LOADOUT_SLOTS?value.map(v=>ids.includes(v)?v:null):[...defaults];
 const seen=new Set();for(let i=0;i<out.length;i++){if(out[i]&&seen.has(out[i]))out[i]=null;else if(out[i])seen.add(out[i]);}
 for(const id of fixed)if(!out.includes(id)){let i=out.indexOf(null);if(i<0)i=out.findLastIndex(v=>!fixed.includes(v));out[i]=id;}
 const pool=[...defaults,...ids].filter((id,i,list)=>list.indexOf(id)===i&&!out.includes(id));
 return out.map(v=>v??pool.shift());
}
// Índice da ação na tabela da classe (o que o runtime usa) e se o selo dela já foi aprendido.
export function loadoutAction(classId,id){return classId==='druid'?DRUID_HUMAN_IDS.indexOf(id):isMarksman(classId)?marksmanActions(classId).findIndex(a=>a.id===id):-1;}
export function loadoutLearned(classId,id,ranks){const i=loadoutAction(classId,id);return i>=0&&(classId==='druid'?druidActionLearned('human',i,ranks):marksmanLearned(classId,i,ranks));}
export const classLoadout=(classId,value)=>{const ids=loadoutIds(classId);return ids?normalizeLoadout(value,ids):null;};
// Ação já na barra troca de lugar; ação de fora substitui a do slot, exceto o ataque básico e a Esquiva.
export function equipLoadout(classId,value,index,id){
 const ids=loadoutIds(classId);
 if(!ids||!Number.isInteger(index)||index<0||index>=LOADOUT_SLOTS||!ids.includes(id))return {ok:false,message:'Slot inválido.'};
 const slots=normalizeLoadout(value,ids),old=slots.indexOf(id);
 if(old>=0){[slots[index],slots[old]]=[slots[old],slots[index]];return {ok:true,slots};}
 if(fixedOf(ids).includes(slots[index]))return {ok:false,message:'O ataque básico e a Esquiva ficam sempre na barra. Escolha outro slot.'};
 slots[index]=id;return {ok:true,slots};
}
