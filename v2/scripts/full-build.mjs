// Grimório estendido da v2: o modelo canônico (shared-build.mjs, compartilhado com a versão legada) mais a árvore Morte.
// Mesmas regras de nível, pré-requisito, exclusividade e orçamento; as funções são refeitas sobre o conjunto completo de nós.
import Base from './shared-build.mjs';
import {DEATH_NODES,DEATH_SCHOOLS} from './death-tree.mjs';
const possessionText={lance:['Lança Sepulcral','Segure o clique para montar ossos em V; solte para disparar em linha reta. A carga aumenta dano, alcance e largura. Exclui Tempestade Óssea.'],procession:['Cortejo dos Mortos','Especialização: permite mais 2 corpos possuídos e reduz a recarga da Possessão em 25%. Exclui Ceifadores Vitais.'],specter:['Possessão','O Espectro possui um cadáver próximo da mira por 60 s. Custa 45 MP; até 2 corpos, ampliados pela árvore. Aumenta o dano dos possuídos.'],ethereal:['Essência Etérea','Aumenta a vida e o dano dos corpos possuídos.'],step:['Passo Espectral','Reduz a recarga da Possessão.']};
const nodes=[...Base.nodes.map(n=>possessionText[n.id]?{...n,name:possessionText[n.id][0],description:possessionText[n.id][1]}:n),...DEATH_NODES],schools=[...Base.schools,...DEATH_SCHOOLS],byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
const {budget,spent}=Base;
function reason(n,r,level){
 if(level<n.level)return `Requer nível ${n.level}.`;
 if(n.requires&&(r[n.requires]||0)<2)return `Requer 2 pontos em ${byId[n.requires].name}.`;
 if(n.exclusive&&r[n.exclusive])return `Incompatível com ${byId[n.exclusive].name}.`;
 return '';
}
function validate(state){
 if(!state||state.version!==1||!Number.isInteger(state.level)||state.level<1||state.level>60||!state.ranks||typeof state.ranks!=='object'||Array.isArray(state.ranks))throw Error('Código de build inválido.');
 const ranks={};
 for(const [id,rank] of Object.entries(state.ranks)){
  if(!Object.hasOwn(byId,id)||!Number.isInteger(rank)||rank<0||rank>byId[id].max)throw Error('Habilidade ou quantidade de pontos inválida.');
  if(rank)ranks[id]=rank;
 }
 if(spent(ranks)>budget(state.level))throw Error('A build excede os pontos do nível.');
 for(const id of Object.keys(ranks)){const error=reason(byId[id],ranks,state.level);if(error)throw Error(error);}
 return {version:1,level:state.level,ranks};
}
function invest(state,id){const n=byId[id];if(!n)throw Error('Skill inválida.');const error=reason(n,state.ranks,state.level);if(error)throw Error(error);if((state.ranks[id]||0)>=n.max)throw Error('Habilidade no máximo.');if(spent(state.ranks)>=budget(state.level))throw Error('Sem pontos disponíveis.');state.ranks[id]=(state.ranks[id]||0)+1;}
function prune(state){let changed=true;while(changed){changed=false;for(const n of nodes){if(state.ranks[n.id]&&reason(n,state.ranks,state.level)){delete state.ranks[n.id];changed=true;}}}}
function refund(state,id){const before=spent(state.ranks);if(state.ranks[id]){state.ranks[id]--;if(!state.ranks[id])delete state.ranks[id];prune(state);}return before-spent(state.ranks);}
function setLevel(state,level){state.level=Math.max(1,Math.min(60,Math.round(Number(level)||1)));prune(state);for(const n of [...nodes].reverse()){while(state.ranks[n.id]&&spent(state.ranks)>budget(state.level))refund(state,n.id);}return state;}
function deathEffects(ranks){const out={};for(const n of DEATH_NODES)for(const [key,value] of Object.entries(n.effects)){if(ranks[n.id])out[key]=(out[key]||0)+value*ranks[n.id];}return out;}
const effects=ranks=>({...Base.effects(ranks),...deathEffects(ranks)});
const effective=ranks=>({...Base.effective(ranks),...deathEffects(ranks)});
export default {...Base,nodes,schools,byId,reason,validate,invest,prune,refund,setLevel,effects,effective};
