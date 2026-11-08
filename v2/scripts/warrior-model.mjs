export const PASSIVES={
 strength:{name:'Maestria da espada',description:'+8% de dano por ponto',max:5,branch:'passives'},
 vitality:{name:'Vitalidade',description:'+10% de vida máxima por ponto',max:5,branch:'passives'},
 armor:{name:'Disciplina defensiva',description:'+4 de armadura por ponto',max:5,branch:'passives'},
 regeneration:{name:'Fôlego de batalha',description:'+0,4 de vida por segundo por ponto',max:5,branch:'passives'},
 shieldDefense:{name:'Guarda treinada',description:'+3 pontos percentuais de bloqueio com escudo por ponto',max:5,branch:'passives'},
 equipmentMastery:{name:'Domínio dos equipamentos',description:'+8% ao dano da espada e à armadura dos itens por ponto',max:5,branch:'passives'},
 slash:{name:'Slash · Três cortes',description:'+6% de dano dos cortes por ponto. O ataque básico já está disponível.',max:5,branch:'sword'},
 thrust:{name:'Estocada',description:'Libera a estocada (botão direito / 2). +10% de dano por ponto.',max:3,branch:'sword'},
 tornado:{name:'Corte tornado',description:'Segure R/5: golpes circulares com gasto contínuo de vigor.',max:1,branch:'sword',level:6,requires:'thrust'},
 bash:{name:'Golpe de escudo',description:'Libera o golpe de escudo (3 / Q). +10% de dano por ponto.',max:3,branch:'shield'},
 shieldThrow:{name:'Arremesso de escudo',description:'T/6: escudo atinge na ida e no retorno. Sem bloqueio enquanto está no ar.',max:1,branch:'shield',level:6,requires:'bash'},
 riposte:{name:'Retaliação',description:'Bloquear fortalece em 10% por ponto o próximo golpe de escudo, por 4 s.',max:3,branch:'shield',level:4,requires:'shieldDefense'},
 momentum:{name:'Ímpeto',description:'Completar os três cortes fortalece em 10% por ponto a próxima estocada, por 4 s.',max:3,branch:'sword',level:4,requires:'slash'},
 // Nós novos entram sempre no fim: warriorRanks distribui o orçamento na ordem desta tabela.
 ricochet:{name:'Ricochete',description:'O Arremesso salta para o inimigo mais próximo em até 6 u: um salto por ponto, com 20% menos dano a cada salto. Mais saltos deixam você mais tempo sem escudo.',max:3,branch:'shield',level:8,requires:'shieldThrow'},
 steelWave:{name:'Onda de Aço',description:'Um corte lança uma onda em linha reta de 7 u, com 180% de dano. Atravessa inimigos e para em paredes. Equipe em um slot da barra.',max:1,branch:'sword',level:10,requires:'slash'},
 tornadoCyclone:{name:'Ciclone',description:'Variante do Tornado: raio de 3,7 em vez de 2,7, mas movimento de 40% em vez de 55%. Só uma variante fica ativa.',max:1,branch:'sword',level:12,requires:'tornado'},
 tornadoWhirl:{name:'Turbilhão',description:'Variante do Tornado: acerta a cada 0,2 s em vez de 0,3 s, mas gasta 16 vigor/s em vez de 12. Só uma variante fica ativa.',max:1,branch:'sword',level:12,requires:'tornado'},
 stance:{name:'Postura de Batalha',description:'F: alterna entre Ofensiva e Defensiva, com só uma ativa e recarga de 6 s. Ofensiva: +20% de dano causado, +15% de dano recebido, -10 de bloqueio, cortes devolvem 2 de vigor. Defensiva: -15% de dano causado, -15% de dano recebido, +10 de bloqueio, vigor ×1,6, bloquear cura 2% da vida.',max:1,branch:'veteran',level:10},
 warCry:{name:'Brado de Guerra',description:'Reduz em 30% a velocidade dos inimigos em raio de 6 por 4 s e dobra a recuperação de vigor por 6 s. Recarga de 18 s. Equipe em um slot da barra.',max:1,branch:'veteran',level:14},
};
// Ações que dependem de um selo; cortes (0) e esquiva (3) ficam sempre disponíveis.
const ACTION_NODES={1:'thrust',2:'bash',4:'tornado',5:'shieldThrow',6:'warCry',7:'steelWave'};
export const WARRIOR_ACTION_COUNT=8;
export const warriorActionLearned=(index,ranks)=>!ACTION_NODES[index]||(ranks?.[ACTION_NODES[index]]||0)>0;
// Seis slots para oito ações: Cortes (0) e Esquiva (3) ficam sempre na barra, em qualquer posição.
export function warriorLoadout(value){const base=[0,1,2,3,4,5];return Array.isArray(value)&&value.length===6&&new Set(value).size===6&&value.every(i=>Number.isInteger(i)&&i>=0&&i<WARRIOR_ACTION_COUNT)&&value.includes(0)&&value.includes(3)?[...value]:base;}
// Ação já na barra troca de lugar; ação de fora substitui a do slot, exceto Cortes e Esquiva.
export function warriorEquipSlot(value,index,id){const slots=warriorLoadout(value),old=slots.indexOf(id);if(old>=0){[slots[index],slots[old]]=[slots[old],slots[index]];return {ok:true,slots};}if(slots[index]===0||slots[index]===3)return {ok:false,message:'Cortes e Esquiva ficam sempre na barra. Escolha outro slot.'};slots[index]=id;return {ok:true,slots};}
export function normalizeWarrior(value={}){const out={};for(const [id,node]of Object.entries(PASSIVES))out[id]=Math.min(node.max,Math.max(0,Math.floor(Number(value?.[id])||0)));return out;}
export const warriorBudget=level=>3*Math.max(1,Math.floor(level));
export const warriorSpent=ranks=>Object.values(normalizeWarrior(ranks)).reduce((a,b)=>a+b,0);
export function warriorRanks(value,level){const r=normalizeWarrior(value);let left=warriorBudget(level);for(const [id,node]of Object.entries(PASSIVES)){r[id]=Math.min(r[id],left);if((node.level||1)>level||node.requires&&!r[node.requires])r[id]=0;left-=r[id];}return r;}
export function canLearn(ranks,id,level){const n=PASSIVES[id];return !!n&&(ranks[id]||0)<n.max&&level>=(n.level||1)&&(!n.requires||ranks[n.requires]>0)&&warriorSpent(ranks)<warriorBudget(level);}
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
