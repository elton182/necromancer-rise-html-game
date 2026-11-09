// Druida (Flora): árvore, atributos, barra e formas. Regras puras, sem DOM nem Three.js.
// Guia: docs/v2-druida.md. Valores iniciais, ainda sem balanceamento de campanha completa.
import {treeNodes,normalizeRanks,spentRanks,fitRanks,canLearnNode} from './skill-tree.mjs';
// Nós da árvore: vêm de docs/habilidades/arvores.json (skill-tree.mjs).
export const DRUID_NODES=treeNodes('druid');
export const normalizeDruid=(value={})=>normalizeRanks(DRUID_NODES,value);
export const druidBudget=level=>3*Math.max(1,Math.floor(level));
export const druidSpent=ranks=>spentRanks(DRUID_NODES,ranks);
export const druidRanks=(value,level)=>fitRanks(DRUID_NODES,value,level,druidBudget(level));
export const canLearnDruid=(ranks,id,level)=>canLearnNode(DRUID_NODES,ranks,id,level,druidBudget(level));

// A base mágica vem do mesmo modelo do Necromante (nível e itens); a Druida anda um pouco mais rápido e é mais resistente.
export const DRUID_BASE={hp:1.1,move:1.125};
export function druidAttributes(a,ranks){const r=normalizeDruid(ranks);return {...a,hp:Math.round(a.hp*DRUID_BASE.hp*(1+r.vitality*.1)),mp:Math.round(a.mp*(1+r.wisdom*.1)),spell:a.spell*(1+r.attunement*.08),move:a.move*DRUID_BASE.move,hpRegen:(a.hpRegen||0)+r.sap*.4,hordeDps:0,hordeHp:0,hordeRegen:0};}

// Ações por forma, por índice na tabela. A forma humana usa a barra montável (skill-loadout.mjs);
// a de lobo continua fixa.
// Humana: 0 Faísca, 1 Corrente, 2 Raízes, 3 Esquiva, 4 Tempestade, 5 Rejuvenescer, 6 Turbilhão, 7 Tornado.
// Lobo: 0 Garras, 1 Salto, 2 Uivo, 3 Esquiva, 4 Corte Sangrento, 5 Garra de Gelo.
export const HUMAN_NODES={1:'chain',2:'roots',4:'storm',5:'rejuvenate',6:'turbilhao',7:'tornado'};
// Ids das ações humanas, na ordem de HUMAN_ACTIONS (druid.mjs): a barra montável guarda estes ids.
export const DRUID_HUMAN_IDS=['spark','chain','roots','dodge','storm','rejuvenate','turbilhao','tornado'];
export const WOLF_NODES={1:'leap',2:'howl',4:'corteSangrento',5:'garraDeGelo'};
export const druidActionLearned=(form,index,ranks)=>{const node=(form==='wolf'?WOLF_NODES:HUMAN_NODES)[index];return !node||(ranks?.[node]||0)>0;};
export const WOLF={drain:4,hitRestore:3,taken:.8,move:1.35,toggleCooldown:2,exhaustedCooldown:4,shift:.35,damagePerRank:.08};
export const wolfDrain=ranks=>Math.max(1,WOLF.drain-(ranks?.wildHeart||0));
export const isWolf=w=>w?.classId==='druid'&&w.druidForm==='wolf';
// Raízes: presos recebem dano extra pela Casca de Espinhos.
export const rootedBonus=(w,target)=>w?.classId==='druid'&&target?.druidRoot>w.time?1+(w.druidRanks?.thornbind||0)*.1:1;
