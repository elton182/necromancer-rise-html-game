import test from 'node:test';
import assert from 'node:assert/strict';
import {ATLAS,atlasNodes,atlasHit} from '../scripts/campaign-atlas.mjs';
import {D} from '../scripts/campaign.mjs';

test('atlas posiciona as quatro fases dentro do mapa e marca o estado de cada uma',()=>{
 const nodes=atlasNodes(D.stages,{unlocked:2,cleared:{1:1}});
 assert.deepEqual(nodes.map(n=>n.state),['done','open','locked','locked']);
 assert.deepEqual(nodes.map(n=>n.next),[false,true,false,false]);
 for(const n of nodes){assert.ok(n.x>0&&n.x<ATLAS.width&&n.y>0&&n.y<ATLAS.height);}
});

test('sem fases abertas além da primeira, a próxima é a fase 1; tudo concluído não marca próxima',()=>{
 assert.equal(atlasNodes(D.stages,{unlocked:1,cleared:{}}).find(n=>n.next).n,1);
 assert.equal(atlasNodes(D.stages,{unlocked:4,cleared:{1:1,2:1,3:1,4:1}}).some(n=>n.next),false);
});

test('clique no marco ou no rótulo escolhe a fase; fora deles não escolhe nada',()=>{
 const nodes=atlasNodes(D.stages,{unlocked:4,cleared:{}}),n=nodes[2];
 assert.equal(atlasHit(nodes,n.x+3,n.y-3).n,3);
 assert.equal(atlasHit(nodes,n.x,n.y+26).n,3);
 assert.equal(atlasHit(nodes,5,5),undefined);
});
