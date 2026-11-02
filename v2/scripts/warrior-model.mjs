export const PASSIVES={
 strength:{name:'Maestria da espada',description:'+8% de dano por ponto',max:5,branch:'passives'},
 vitality:{name:'Vitalidade',description:'+10% de vida máxima por ponto',max:5,branch:'passives'},
 armor:{name:'Disciplina defensiva',description:'+4 de armadura por ponto',max:5,branch:'passives'},
 regeneration:{name:'Fôlego de batalha',description:'+0,4 de vida por segundo por ponto',max:5,branch:'passives'},
 shieldDefense:{name:'Guarda treinada',description:'+3 pontos percentuais de bloqueio com escudo por ponto',max:5,branch:'passives'},
 equipmentMastery:{name:'Domínio dos equipamentos',description:'+8% ao dano da espada e à armadura dos itens por ponto',max:5,branch:'passives'},
 slash:{name:'Slash · Três cortes',description:'+6% de dano dos cortes por ponto. O ataque básico já está disponível.',max:5,branch:'sword'},
 thrust:{name:'Estocada',description:'+10% de dano da estocada por ponto. O golpe básico já está disponível.',max:3,branch:'sword'},
 tornado:{name:'Corte tornado',description:'Segure R/5: golpes circulares com gasto contínuo de vigor.',max:1,branch:'sword',level:6,requires:'thrust'},
 bash:{name:'Golpe de escudo',description:'+10% de dano do escudo por ponto. O golpe básico já está disponível.',max:3,branch:'shield'},
 shieldThrow:{name:'Arremesso de escudo',description:'T/6: escudo atinge na ida e no retorno. Sem bloqueio enquanto está no ar.',max:1,branch:'shield',level:6,requires:'bash'},
 riposte:{name:'Retaliação',description:'Bloquear fortalece em 10% por ponto o próximo golpe de escudo, por 4 s.',max:3,branch:'shield',level:4,requires:'shieldDefense'},
 momentum:{name:'Ímpeto',description:'Completar os três cortes fortalece em 10% por ponto a próxima estocada, por 4 s.',max:3,branch:'sword',level:4,requires:'slash'},
};
export function warriorLoadout(value){const base=[0,1,2,3,4,5];return Array.isArray(value)&&value.length===6&&new Set(value).size===6&&value.every(i=>base.includes(i))?[...value]:base;}
export function normalizeWarrior(value={}){const out={};for(const [id,node]of Object.entries(PASSIVES))out[id]=Math.min(node.max,Math.max(0,Math.floor(Number(value?.[id])||0)));return out;}
export const warriorBudget=level=>3*Math.max(1,Math.floor(level));
export const warriorSpent=ranks=>Object.values(normalizeWarrior(ranks)).reduce((a,b)=>a+b,0);
export function warriorRanks(value,level){const r=normalizeWarrior(value);let left=warriorBudget(level);for(const [id,node]of Object.entries(PASSIVES)){r[id]=Math.min(r[id],left);if((node.level||1)>level||node.requires&&!r[node.requires])r[id]=0;left-=r[id];}return r;}
export function canLearn(ranks,id,level){const n=PASSIVES[id];return !!n&&(ranks[id]||0)<n.max&&level>=(n.level||1)&&(!n.requires||ranks[n.requires]>0)&&warriorSpent(ranks)<warriorBudget(level);}
export function warriorAttributes(a,ranks){const r=normalizeWarrior(ranks);return {...a,hp:Math.round(a.hp*(1+r.vitality*.1)),damage:(a.damage??a.spell)*(1+r.strength*.08),spell:0,defense:a.defense+r.armor*4,hpRegen:(a.hpRegen||0)+r.regeneration*.4,blockChance:Math.min(75,(a.blockChance||0)+r.shieldDefense*3)};}
