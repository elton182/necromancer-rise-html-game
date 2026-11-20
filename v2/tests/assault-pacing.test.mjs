import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession} from '../scripts/session.mjs';
import {launchWorld,tickWorld} from '../scripts/campaign-world.mjs';
import {builtinMap,toArena,reachable,canReach} from '../scripts/map-model.mjs';
import {tuneGroups,addRouteEncounters} from '../scripts/area-tuning.mjs';
import {FORT_ASSAULT_POINTS,fortAssaultCast,areaObjectives} from '../scripts/itauna-model.mjs';
import {CEDRO_GROUPS} from '../scripts/cedro-model.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {campaignQuests} from '../scripts/quest-model.mjs';
import {normalizeWorld} from '../scripts/campaign-world-model.mjs';

const enter=area=>{const s=createSession();s.save.campaign.started=true;s.save.campaign.world={stage:'complete',nilo:area==='cedro'?'done':'fort',cedro:'active',area,entry:area==='cedro'?'village':'gate',portalUnlocked:true};launchWorld(s);return s;};
test('forte guia as três posições, depois capitão, contrato e bolsa, sem apontar para a grade fechada',()=>{
 const p={nilo:'fort',cleared:[]};
 for(const [index,g] of FORT_ASSAULT_POINTS.entries()){
  const o=areaObjectives('itauna-fort',p)[0];assert.equal(o.target.id,g.id);assert.match(o.text,new RegExp(index+'/3'));
  assert.ok(fortAssaultCast(p).some(a=>a.key===g.key&&a.questMarker==='⚔'));p.cleared.push(g.id);
  assert.equal(fortAssaultCast(p).some(a=>a.key===g.key),false);
 }
 assert.deepEqual(fortAssaultCast(p),[]);assert.match(areaObjectives('itauna-fort',p)[0].text,/capitão/);
 p.cleared.push('fort-captain');assert.equal(areaObjectives('itauna-fort',p)[0].target.name,'Mesa do capitão');
 p.niloEvidence=true;assert.match(areaObjectives('itauna-fort',p)[0].text,/depósito.*G/);
});
test('densidade: combate cobre o caminho central; grupos e levas são finitos, com mais tropas nos dois mapas',()=>{
 for(const [area,minimum,points] of [['itauna-fort',200,[[0,61],[0,40],[0,25],[0,12],[0,-5],[0,-18],[0,-27]]],['cedro',300,[[-126,134],[-90,90],[-55,65],[0,5],[10,-42],[48,-60],[80,-119]]]]){
  const map=builtinMap('builtin:'+area),groups=tuneGroups(addRouteEncounters(map.spawns,area),{area,mapLevel:map.level});
  assert.ok(groups.reduce((n,g)=>n+g.count*g.waves,0)>=minimum);assert.ok(groups.every(g=>g.respawn===0&&g.waves<=3&&!g.idle));
  for(const [x,y] of points)assert.ok(groups.some(g=>Math.hypot(g.x-x,g.y-y)<g.radius),area+' '+x+','+y);
  const arena=toArena(map),path=reachable(arena,map.start,{step:1});for(const g of groups)assert.ok(canReach(path,g),g.id);
 }
});
test('contra-ataque chega de outra posição, sem duplicar capitão ou concluir antes da última leva',()=>{
 const s=enter('itauna-fort'),w=s.world,g=w.adventure.groups.find(g=>g.id==='fort-captain');
 for(const other of w.adventure.groups)if(other!==g)other.state='clear';Object.assign(w.player,{x:g.x,y:g.y});tickWorld(s,.1);
 const first=w.actors.filter(a=>a.worldGroup===g.id);assert.equal(first.filter(a=>a.lootTier==='rare').length,1);assert.ok(first.every(a=>!a.home));
 for(const a of first)dealDamage(w,a,1e8,w.player);tickWorld(s,.1);assert.equal(g.state,'between');assert.equal(s.save.campaign.world.cleared.includes(g.id),false);
 tickWorld(s,5);const second=w.actors.filter(a=>a.worldGroup===g.id&&a.hp>0);assert.equal(g.waveNumber,2);assert.ok(second.every(a=>a.lootTier==='common'));assert.match(w.notice,/Contra-ataque/);
 assert.ok(second.reduce((n,a)=>n+a.y,0)/second.length>first.reduce((n,a)=>n+a.y,0)/first.length+2);
 for(const a of second)dealDamage(w,a,1e8,w.player);tickWorld(s,.1);assert.equal(g.state,'clear');assert.ok(s.save.campaign.world.cleared.includes(g.id));
 tickWorld(s,100);assert.equal(w.actors.some(a=>a.worldGroup===g.id&&a.hp>0),false);
});
test('saves com Cedro já vencido preservam abates e recebem os encontros novos',()=>{
 const s=enter('cedro'),p=s.save.campaign.world;
 p.cleared=CEDRO_GROUPS.filter(id=>!/^cedro-patrol-(19|2\d|30)$/.test(id));p.cedro='done';launchWorld(s);
 const groups=s.world.adventure.groups;assert.equal(groups.find(g=>g.id==='cedro-bento').state,'clear');
 assert.equal(groups.filter(g=>g.state!=='clear').length,12);assert.ok(groups.filter(g=>g.state!=='clear').every(g=>g.id.startsWith('cedro-patrol-')));
});
test('diário de save antigo com provas recuperadas não exige tomar novamente as posições do forte',()=>{
 const world=normalizeWorld({stage:'complete',nilo:'return'}),q=campaignQuests({campaign:{world}}).find(q=>q.id==='joao-letter');
 assert.ok(q.steps.slice(0,6).every(s=>s.done));assert.match(q.summary,/Entregar/);
});
