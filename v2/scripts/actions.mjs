import R from './horde-rules.mjs';
export const SPELL_NODES={raio:'bolt',dash:'dash',chuva:'rain',explosao:'nova',maos:'wall',barreira:'shield',maldicao:'curse'};
export const SPELL_NAMES={raio:'Tiro de Osso',dash:'Dash',chuva:'Chuva de Ossos',explosao:'Explosão Necrótica',maos:'Muralha de Corpos',barreira:'Escudo de Carne',maldicao:'Maldição da Fraqueza'};
export const ACTIONS=['empty','raio','dash',...R.types,'chuva','explosao','maos','barreira','maldicao'];
export function available(army,id){const p=army.profile,g=p.grants||[];if(p.campaign&&!['empty','dash','maldicao'].includes(id)&&!g.includes(id)&&!(R.types.includes(id)&&g.includes('summon')&&(id==='zombie'||p.ranks[id])))return false;return ACTIONS.includes(id)&&(id==='empty'||id==='raio'||id==='dash'||p.campaign&&(g.includes(id)||id==='zombie'&&g.includes('summon'))||!!army.profile.ranks[SPELL_NODES[id]||id]);}
export function actionName(id){return SPELL_NAMES[id]||R.defs[id]?.name||(id==='empty'?'Vazio':id);}
