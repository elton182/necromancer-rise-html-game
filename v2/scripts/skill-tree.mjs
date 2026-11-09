// Árvores de talentos do Guerreiro, da Druida e dos atiradores. Nós e ramos vêm de skill-tree-data.mjs,
// gerado de docs/habilidades/arvores.json (fonte da verdade, editada em tools/skill-tree-editor.html).
// Aqui ficam as regras de investimento comuns: limite por nó, orçamento, nível, pré-requisitos e exclusões.
// Regras puras, sem DOM nem Three.js.
import DATA from './skill-tree-data.mjs';

export function treeNodes(classId){
 const tree=DATA[classId];if(!tree)throw Error('Árvore de habilidades ausente: '+classId);
 return Object.fromEntries(Object.entries(tree.nodes).map(([id,n])=>[id,{...n,requires:[...n.requires],excludes:[...n.excludes]}]));
}
// Ramos do painel de talentos: [id, x em % da coluna, y em px] por selo.
export const treeBranches=classId=>DATA[classId]?.trees[0]?.branches||[];
export const requirementsMet=(node,ranks)=>node.requires.every(id=>(ranks?.[id]||0)>0);
export const excludedBy=(node,ranks)=>node.excludes.find(id=>(ranks?.[id]||0)>0)||null;
export function normalizeRanks(nodes,value={}){const out={};for(const [id,node]of Object.entries(nodes))out[id]=Math.min(node.max,Math.max(0,Math.floor(Number(value?.[id])||0)));return out;}
export const spentRanks=(nodes,ranks)=>Object.values(normalizeRanks(nodes,ranks)).reduce((a,b)=>a+b,0);
// Pontos válidos para o nível: a tabela vem com os pais antes dos filhos, então um nó só fica com
// pontos se os pré-requisitos já ficaram. Sem orçamento, perdem pontos os nós do fim da tabela.
export function fitRanks(nodes,value,level,budget){
 const r=normalizeRanks(nodes,value);let left=budget;
 for(const [id,node]of Object.entries(nodes)){r[id]=Math.min(r[id],left);if(node.level>level||!requirementsMet(node,r)||excludedBy(node,r))r[id]=0;left-=r[id];}
 return r;
}
export function canLearnNode(nodes,ranks,id,level,budget){
 const n=nodes[id];
 return !!n&&(ranks?.[id]||0)<n.max&&level>=n.level&&requirementsMet(n,ranks)&&!excludedBy(n,ranks)&&spentRanks(nodes,ranks)<budget;
}
