// docs/habilidades/arvores.json é a fonte da verdade das árvores. Estes testes conferem que o módulo gerado
// está em dia com o arquivo, que só nós jogáveis entram no jogo e que o Necromante (cujas regras ainda vivem
// em build-simulator/model.js e death-tree.mjs) não divergiu do arquivo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import DATA from '../scripts/skill-tree-data.mjs';
import Build from '../scripts/shared-build.mjs';
import {DEATH_NODES} from '../scripts/death-tree.mjs';
import FullBuild,{EXTRA_NODES} from '../scripts/full-build.mjs';
import {MARKSMAN_ACTIONS,MARKSMAN_NODES} from '../scripts/marksman-model.mjs';
import {PASSIVES} from '../scripts/warrior-model.mjs';
import {DRUID_NODES} from '../scripts/druid-model.mjs';

const require=createRequire(import.meta.url);
const {readSkillTrees,FILE,PLAYABLE}=require('../tools/skill-tree-source.cjs');
const repo=new URL('../..',import.meta.url),doc=JSON.parse(fs.readFileSync(new URL(FILE,repo),'utf8'));

test('módulo gerado está em dia com o arvores.json (rode node v2/tools/build.cjs depois de editar)',()=>{
 assert.deepEqual(DATA,readSkillTrees(new URL('.',repo).pathname.replace(/^\/([A-Za-z]:)/,'$1')));
});

test('só nós jogáveis entram no jogo; ideias e planos ficam fora',()=>{
 for(const c of doc.classes){
  const ids=Object.keys(DATA[c.id].nodes);
  for(const n of c.nodes)assert.equal(ids.includes(n.id),PLAYABLE.includes(n.status),c.id+'/'+n.id+' ('+n.status+')');
 }
 assert.deepEqual(Object.keys(PASSIVES),Object.keys(DATA.warrior.nodes));
 assert.deepEqual(Object.keys(DRUID_NODES),Object.keys(DATA.druid.nodes));
 for(const id of ['archer','mercenary','mage'])assert.deepEqual(Object.keys(MARKSMAN_NODES[id]),Object.keys(DATA[id].nodes));
});

test('cada ação que depende de selo tem o nó correspondente na árvore da classe',()=>{
 for(const [classId,list] of Object.entries(MARKSMAN_ACTIONS))for(const a of list)if(a.node)assert.ok(MARKSMAN_NODES[classId][a.node],classId+': '+a.id+' sem nó '+a.node);
});

test('painel: no máximo três selos por linha de cada ramo e pais acima dos filhos',()=>{
 for(const [classId,c] of Object.entries(DATA))for(const t of c.trees)for(const b of t.branches){
  const rows={};for(const [,,y] of b.nodes)rows[y]=(rows[y]||0)+1;
  assert.ok(Object.values(rows).every(n=>n<=3),classId+'/'+b.id);
  const y=Object.fromEntries(b.nodes.map(([id,,yy])=>[id,yy]));
  for(const [id] of b.nodes)for(const r of c.nodes[id].requires)if(y[r]!==undefined)assert.ok(y[r]<y[id],classId+': '+r+' acima de '+id);
 }
});

test('Necromante: nome, pontos, nível e pré-requisito do arquivo batem com o Grimório do código',()=>{
 // Os nós exclusivos da v2 (EXTRA_NODES) vêm do próprio arquivo; os do modelo compartilhado precisam bater com ele.
 assert.deepEqual(EXTRA_NODES.map(n=>n.id).sort(),['caoZumbi','cerberus','mages','raioNecrotico','rupturaNecrotica']);
 assert.equal(FullBuild.byId.abom.exclusive,'caoZumbi','exclusão de mão dupla com o Cão Zumbi');
 assert.equal(FullBuild.effects({burst:2,unstable:1})['Tamanho da área de explosão'],9,'área das explosões vinda do arquivo');
 const code=new Map([...Build.nodes,...DEATH_NODES,...EXTRA_NODES].map(n=>[n.id,n])),file=DATA.necromancer.nodes;
 assert.deepEqual(Object.keys(file).sort(),[...code.keys()].sort());
 for(const [id,n] of Object.entries(file)){
  const c=code.get(id);
  assert.deepEqual([n.name,n.max,n.level,n.requires],[c.name,c.max,c.level,c.requires?[c.requires]:[]],id);
 }
});
