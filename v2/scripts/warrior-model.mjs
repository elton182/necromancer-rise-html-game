// Nós da árvore: nome, texto, pontos, nível e pré-requisitos vêm de docs/habilidades/arvores.json (skill-tree.mjs).
import {treeNodes,normalizeRanks,spentRanks,fitRanks,canLearnNode} from './skill-tree.mjs';
export const PASSIVES=treeNodes('warrior');
// Ações que dependem de um selo; cortes (0) e esquiva (3) ficam sempre disponíveis.
// A Onda de Aço (7) saiu da barra: dispara sozinha no terceiro corte (warrior.mjs).
const ACTION_NODES={1:'thrust',2:'bash',4:'tornado',5:'shieldThrow',6:'warCry'};
export const WARRIOR_ACTION_COUNT=7;
export const STEEL_WAVE_ACTION=7;
export const warriorActionLearned=(index,ranks)=>!ACTION_NODES[index]||(ranks?.[ACTION_NODES[index]]||0)>0;
// Seis slots para sete ações: Cortes (0) e Esquiva (3) ficam sempre na barra, em qualquer posição.
// Barras salvas com a Onda de Aço recebem no lugar dela a primeira ação que estiver fora da barra.
export function warriorLoadout(value){const base=[0,1,2,3,4,5];if(Array.isArray(value)&&value.includes(STEEL_WAVE_ACTION)){const free=[1,2,4,5,6].find(i=>!value.includes(i));value=value.map(i=>i===STEEL_WAVE_ACTION?free:i);}return Array.isArray(value)&&value.length===6&&new Set(value).size===6&&value.every(i=>Number.isInteger(i)&&i>=0&&i<WARRIOR_ACTION_COUNT)&&value.includes(0)&&value.includes(3)?[...value]:base;}
// Ação já na barra troca de lugar; ação de fora substitui a do slot, exceto Cortes e Esquiva.
export function warriorEquipSlot(value,index,id){const slots=warriorLoadout(value),old=slots.indexOf(id);if(old>=0){[slots[index],slots[old]]=[slots[old],slots[index]];return {ok:true,slots};}if(slots[index]===0||slots[index]===3)return {ok:false,message:'Cortes e Esquiva ficam sempre na barra. Escolha outro slot.'};slots[index]=id;return {ok:true,slots};}
export const normalizeWarrior=(value={})=>normalizeRanks(PASSIVES,value);
export const warriorBudget=level=>3*Math.max(1,Math.floor(level));
export const warriorSpent=ranks=>spentRanks(PASSIVES,ranks);
export const warriorRanks=(value,level)=>fitRanks(PASSIVES,value,level,warriorBudget(level));
export const canLearn=(ranks,id,level)=>canLearnNode(PASSIVES,ranks,id,level,warriorBudget(level));
export function warriorAttributes(a,ranks){const r=normalizeWarrior(ranks);return {...a,hp:Math.round(a.hp*(1+r.vitality*.1)),damage:(a.damage??a.spell)*(1+r.strength*.08),spell:0,defense:a.defense+r.armor*4,hpRegen:(a.hpRegen||0)+r.regeneration*.4,blockChance:Math.min(75,(a.blockChance||0)+r.shieldDefense*3)};}
export const STANCE_COOLDOWN=6;
export const STANCES={
 offensive:{id:'offensive',name:'Ofensiva',damage:1.2,taken:1.15,block:-10,regen:1,vigorOnSlash:2,healOnBlock:0,color:'#d9b574'},
 defensive:{id:'defensive',name:'Defensiva',damage:.85,taken:.85,block:10,regen:1.6,vigorOnSlash:0,healOnBlock:.02,color:'#9ebbc2'},
};
export const warriorStanceId=value=>value==='offensive'?'offensive':'defensive';
// Sem o nó aprendido não há postura ativa, e nenhum efeito se aplica.
export const activeStance=w=>w?.classId==='warrior'&&(w.warriorRanks?.stance||0)>0?STANCES[warriorStanceId(w.warriorStance)]:null;
export const warriorVigorFactor=w=>w?.classId!=='warrior'?1:(activeStance(w)?.regen??1)*(w.warriorRally?.until>w.time?2:1);
export const TORNADO_VARIANTS={
 base:{id:'base',name:'Base',range:2.7,interval:.3,drain:12,turn:.6,move:.55},
 cyclone:{id:'cyclone',name:'Ciclone',node:'tornadoCyclone',range:3.7,interval:.3,drain:12,turn:.6,move:.4},
 whirl:{id:'whirl',name:'Turbilhão',node:'tornadoWhirl',range:2.7,interval:.2,drain:16,turn:.4,move:.55},
};
export function warriorTornado(id,ranks){const variant=Object.hasOwn(TORNADO_VARIANTS,id||'')?TORNADO_VARIANTS[id]:null;return variant&&(!variant.node||(ranks?.[variant.node]||0)>0)?variant:TORNADO_VARIANTS.base;}
// A variante só troca fora de combate: nenhum inimigo desperto a menos de 14 u.
export const warriorInCombat=w=>w.actors.some(a=>a.team==='enemy'&&a.hp>0&&!a.dead&&!(a.home&&!a.alert)&&Math.hypot(a.x-w.player.x,a.y-w.player.y)<14);
