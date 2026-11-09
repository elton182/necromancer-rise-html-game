'use strict';
// Árvores de habilidades da v2 a partir de docs/habilidades/arvores.json, a fonte da verdade editada em
// tools/skill-tree-editor.html. Entram no jogo só os nós jogáveis (implementado, revisar): ideias e planos
// ficam fora até ganharem regra no código. Nome, descrição, pontos, nível, pré-requisitos, ramos e a
// posição no painel vêm daqui; a mecânica de cada nó continua nos módulos da classe.
const fs=require('node:fs'),path=require('node:path');
const FILE='docs/habilidades/arvores.json';
const PLAYABLE=new Set(['implementado','revisar']);
const ID=/^[A-Za-z][A-Za-z0-9_]*$/;

// Agrupa coordenadas do editor em faixas: valores a menos de `gap` px caem na mesma linha ou coluna.
function bands(values,gap){
 const sorted=[...new Set(values)].sort((a,b)=>a-b),out=[];
 for(const v of sorted){const last=out[out.length-1];if(last&&v-last.at(-1)<gap)last.push(v);else out.push([v]);}
 return v=>out.findIndex(b=>b.includes(v));
}
const COLUMNS={1:[50],2:[24,76],3:[16,50,84]};
// Posição no painel de talentos (x em % da coluna do ramo, y em px antes da escala do painel), derivada
// da posição no editor: linhas pela altura e, dentro da linha, a ordem horizontal. O painel comporta
// três selos por linha; uma linha mais cheia no editor continua na linha seguinte.
function panelLayout(nodes){
 const band=bands(nodes.map(n=>n.y),60),rows=[];
 for(const n of [...nodes].sort((a,b)=>band(a.y)-band(b.y)||a.x-b.x)){const r=band(n.y);(rows[r]??=[]).push(n);}
 const out=[];let line=0;
 for(const row of rows.filter(Boolean))for(let i=0;i<row.length;i+=3,line++){const chunk=row.slice(i,i+3);chunk.forEach((n,k)=>out.push([n.id,COLUMNS[chunk.length][k],18+104*line]));}
 return out;
}
// Pais antes dos filhos, preservando a ordem do arquivo entre irmãos.
function topological(nodes){
 const by=new Map(nodes.map(n=>[n.id,n])),done=new Set(),out=[];
 const visit=(n,stack=new Set())=>{if(done.has(n.id))return;if(stack.has(n.id))throw Error('Ciclo de pré-requisitos em '+n.id);stack.add(n.id);for(const r of n.requires)if(by.has(r))visit(by.get(r),stack);done.add(n.id);out.push(n);};
 for(const n of nodes)visit(n);
 return out;
}
function readSkillTrees(repo){
 const doc=JSON.parse(fs.readFileSync(path.join(repo,FILE),'utf8'));
 if(doc.format!=='necromancer-skill-trees')throw Error(FILE+': formato inesperado.');
 const out={};
 for(const c of doc.classes){
  const playable=c.nodes.filter(n=>PLAYABLE.has(n.status)),ids=new Set(playable.map(n=>n.id));
  for(const n of playable){
   if(!ID.test(n.id))throw Error(FILE+': id inválido em '+c.id+': '+n.id);
   for(const r of n.requires)if(!ids.has(r))throw Error(FILE+': '+c.id+'/'+n.id+' requer '+r+', que não está jogável (status implementado ou revisar).');
   if(!(Number(n.maxRank)>=1))throw Error(FILE+': '+c.id+'/'+n.id+' sem máximo de pontos.');
  }
  const nodes={};
  for(const n of topological(playable))nodes[n.id]={name:n.name,description:n.description,icon:n.icon||'',effects:Object.fromEntries((n.effects||[]).filter(e=>e.label).map(e=>[e.label,Number(e.value)||0])),type:n.type,tree:n.tree,branch:n.branch,max:Number(n.maxRank),level:Number(n.levelReq)||1,requires:[...n.requires],excludes:n.excludes.filter(e=>ids.has(e))};
  const trees=c.trees.map(t=>({id:t.id,name:t.name,branches:t.branches.map(b=>{const list=playable.filter(n=>n.tree===t.id&&n.branch===b.id);return {id:b.id,name:b.name,motto:b.motto||'',color:b.color,nodes:list.length?panelLayout(list):[]};}).filter(b=>b.nodes.length)}));
  out[c.id]={name:c.name,resource:c.resource,trees,nodes};
 }
 return out;
}
module.exports={readSkillTrees,FILE,PLAYABLE:[...PLAYABLE]};
