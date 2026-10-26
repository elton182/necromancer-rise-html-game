'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const m=require('./endgame-model'),gear=require('./equipment-model'),tree=require('../build-simulator/model');
function finish(state,kind='expedition',difficulty=1,curses=[]){const next=m.begin(state,kind,difficulty,curses);return m.complete(next.state,next.run);}
test('100% influence identifies missing leaders and leads directly to fortress after both victories',()=>{
 let s=m.normalize({influence:100,difficulty:3});
 assert.equal(m.nextEncounter(s),'apothecary');
 assert.match(m.blockedReason(s,'fortress',3),/Boticário Apodrecido/);assert.match(m.blockedReason(s,'fortress',3),/Guardiã dos Afogados/);
 assert.throws(()=>m.begin(s,'fortress',3,[]),/Boticário Apodrecido/);
 s=finish(s,'apothecary',3).state;assert.equal(m.nextEncounter(s),'expedition');assert.doesNotMatch(m.blockedReason(s,'fortress',3),/Boticário/);
 s=finish(s,'expedition',3).state;assert.equal(m.nextEncounter(s),'drowned');
 s=finish(s,'drowned',3).state;s=finish(s,'expedition',3).state;assert.equal(m.nextEncounter(s),'fortress');assert.equal(m.blockedReason(s,'fortress',3),'');
 const roundtrip=m.normalize(JSON.parse(JSON.stringify(s)));assert.equal(m.available(roundtrip,'fortress',3),true);assert.equal(finish(roundtrip,'fortress',3).state.conquered,true);
});
test('legacy and malformed saves normalize safely and conquered saves retain their fragment',()=>{
 for(const raw of [undefined,null,{},false,{offers:{1:{selected:'bad'}},seed:NaN,influence:Infinity}]){
  const s=m.normalize(raw);assert.equal(s.influence,0);assert.equal(s.fragment,false);assert.deepEqual(m.normalize(s),s);
 }
 const s=m.normalize({conquered:true,fragment:false});assert.equal(s.fragment,true);assert.equal(s.influence,100);assert.equal(s.lieutenants.drowned,true);
});
test('curse offers persist, contain four distinct options and reject off-offer or duplicate selections',()=>{
 for(let seed=1;seed<100;seed++){
  const s=m.normalize({seed}),ids=m.offer(seed,0,1);assert.equal(new Set(ids).size,4);
  s.offers[1].selected=ids.slice(0,3);assert.deepEqual(m.normalize(JSON.parse(JSON.stringify(s))),s);
  assert.throws(()=>m.begin(s,'expedition',1,[ids[0],ids[0]]));assert.throws(()=>m.begin(s,'expedition',1,ids));
  assert.throws(()=>m.begin(s,'expedition',1,[m.curses.find(c=>!ids.includes(c.id)).id]));
 }
});
test('uncursed conquest reveals leaders, requires both for fortress and grants fragment only on victory',()=>{
 let s=m.normalize({seed:42});assert.equal(m.available(s,'apothecary',1),false);
 s=finish(s).state;s=finish(s).state;assert.equal(s.influence,40);assert.equal(m.available(s,'apothecary',1),true);
 s=finish(s,'apothecary').state;assert.equal(s.influence,50);s=finish(s).state;
 assert.equal(m.available(s,'drowned',1),true);s=finish(s).state;assert.equal(m.available(s,'drowned',1),true);s=finish(s).state;
 assert.equal(s.influence,100);assert.equal(m.available(s,'fortress',1),false);
 s=finish(s,'drowned').state;s=finish(s).state;assert.equal(m.available(s,'fortress',1),true);assert.equal(s.fragment,false);
 const victory=finish(s,'fortress');assert.equal(victory.conqueredNow,true);s=victory.state;
 assert.equal(s.fragment,true);assert.equal(s.highest,1);assert.equal(m.available(s,'expedition',2),true);assert.equal(m.available(s,'expedition',3),true);
 const repeat=finish(s,'fortress');assert.equal(repeat.conqueredNow,false);assert.equal(repeat.state.influence,100);
 const next=m.latestDifficulty(s);assert.equal(next.difficulty,2);assert.equal(next.influence,0);assert.equal(next.highest,1);assert.equal(next.fragment,true);assert.equal(m.available(next,'fortress',2),false);
});
test('each cleared area opens three distinct biome routes, persists branches and converges at the tower',()=>{
 let s=m.normalize({seed:88});const graph=m.routeGraph(s.seed);
 assert.equal(graph.length,17);assert.deepEqual(graph.filter(n=>m.routeAvailable(s,n)).map(n=>n.id),['entry']);
 assert.throws(()=>m.begin(s,'expedition',1,[],'route-3-0'),/área anterior/);
 for(let depth=0;depth<6;depth++){
  const options=graph.filter(n=>n.depth===depth&&m.routeAvailable(s,n));assert.equal(options.length,depth===0?1:3);
  if(depth)assert.equal(new Set(options.map(n=>n.biome)).size,3);
  const node=options[depth%options.length],run=m.begin(s,node.kind,1,[],node.id),result=m.complete(run.state,run.run);
  assert.equal(result.applied,true);assert.equal(result.newRoutes.length,depth===5?1:3);s=m.normalize(JSON.parse(JSON.stringify(result.state)));
  assert.ok(s.routes.completed.includes(node.id));assert.equal(m.complete(s,run.run).applied,false);
 }
 assert.equal(s.influence,100);assert.equal(m.available(s,'fortress',1),true);
 const run=m.begin(s,'fortress',1,[],'tower');assert.equal(m.complete(run.state,run.run).state.fragment,true);
 assert.equal(m.nextEncounter(m.complete(run.state,run.run).state),'fortress');
});
test('fresh and existing characters can skip difficulties while regional objectives remain required',()=>{
 for(const raw of [{},{conquered:true,highest:1}]){
  const s=m.normalize(raw);
  for(const d of [1,2,6,25,500])assert.equal(m.available(s,'expedition',d),true);
  const result=finish(s,'expedition',5);assert.equal(result.applied,true);assert.equal(result.reward.itemLevel,28);
  if(!s.conquered){assert.equal(m.available(s,'apothecary',5),false);assert.equal(m.available(s,'fortress',5),false);assert.equal(result.state.fragment,false);}
 }
 for(const d of [0,Infinity,1.5,NaN])assert.equal(m.available(m.normalize(),'expedition',d),false);
 const s=m.normalize({difficulty:5,influence:100,lieutenants:{apothecary:true,drowned:true}}),won=finish(s,'fortress',5);
 assert.equal(won.state.highest,5);assert.equal(won.state.fragment,true);assert.equal(m.selectDifficulty(won.state,1).highest,5);
});
test('difficulty changes clear map progress in either direction and preserve permanent records',()=>{
 const s=m.normalize({difficulty:12,highest:11,fragment:true,influence:70,lieutenants:{apothecary:true}}),run=m.begin(s,'expedition',12,[]);
 assert.ok(s.routes.completed.length>0);assert.deepEqual(m.selectDifficulty(s,12),s);
 const changed=m.selectDifficulty(run.state,28);assert.equal(changed.difficulty,28);assert.equal(changed.unlocked,28);assert.equal(changed.influence,0);assert.equal(changed.conquered,false);assert.deepEqual(changed.routes.completed,[]);assert.deepEqual(changed.lieutenants,{apothecary:false,drowned:false});assert.equal(changed.highest,11);assert.equal(changed.fragment,true);
 assert.equal(m.complete(changed,run.run).applied,false);
 assert.equal(m.begin(changed,'expedition',28,[]).run.difficulty,28);
 const lower=m.selectDifficulty(changed,2);assert.equal(lower.influence,0);assert.equal(lower.routes.completed.length,0);
 const latest=m.latestDifficulty(JSON.parse(JSON.stringify(lower)));assert.equal(latest.difficulty,28);assert.equal(latest.highest,11);
 const huge=m.selectDifficulty(latest,100000);assert.equal(huge.difficulty,100000);assert.ok(Object.keys(huge.offers).length<=6);
});
test('aborted attempts cannot reward, victories apply once and reset only their difficulty offer',()=>{
 const s=m.normalize({seed:99}),old=m.begin(s,'expedition',1,[]),retry=m.begin(old.state,'expedition',1,[]);
 assert.equal(m.complete(retry.state,old.run).applied,false);
 const won=m.complete(retry.state,retry.run);assert.equal(won.applied,true);assert.equal(m.complete(won.state,retry.run).applied,false);
 assert.equal(won.state.offers[1].cycle,1);assert.equal(won.state.offers[2].cycle,0);
 assert.equal(old.state.offers[1].cycle,0);assert.equal(old.state.influence,0);
});
test('risk increases loot, influence and special access, with bounded penalties',()=>{
 const s=m.normalize({seed:33}),ids=m.offer(s.seed,0,1).sort((a,b)=>m.curses.find(c=>c.id===b).weight-m.curses.find(c=>c.id===a).weight).slice(0,3);
 const plain=m.rewards(s,'expedition',1,[]),risk=m.rewards(s,'expedition',1,ids);
 assert.ok(risk.itemLevel>plain.itemLevel);assert.ok(risk.influence>plain.influence);assert.ok(risk.specialChance>0);assert.ok(risk.epicChance>plain.epicChance);
 const mods=m.modifiers(m.curses.map(c=>c.id));for(const value of Object.values(mods))assert.ok(value>=0&&value<=1);
 assert.ok(mods.hp>0&&mods.damage>0&&mods.move>0&&mods.hordeHp>0);
});
test('regional difficulty and loot continue beyond the arena ceiling and survive migration',()=>{
 const s=m.selectDifficulty(m.normalize(),250),reward=m.rewards(s,'expedition',250,[]);
 assert.ok(reward.itemLevel>gear.MAX_WAVE);
 const item=gear.generate(reward.itemLevel,tree,()=>.5,'staff',true,'regional-high',{loot:{unboundedLevel:true}});
 assert.equal(item.level,reward.itemLevel);assert.equal(gear.validate(item,tree).level,item.level);
 assert.equal(gear.migrate({gearBag:[item]},tree).gearBag[0].level,item.level);
 assert.ok(m.combatScale(250).hp>m.combatScale(200).hp);assert.ok(Number.isFinite(m.combatScale(100000).hp));
 assert.equal(gear.generate(2000,tree,()=>.5,'staff').level,gear.MAX_WAVE);
});
test('Osso Carcomido survives equipment migration only on valid rare or epic staves',()=>{
 const item=gear.generate(7,tree,()=>.5,'staff',true,'rot-staff',{loot:{weights:{common:0,magic:0,rare:100,epic:0}}});item.special='carcomido';
 assert.equal(gear.validate(item,tree).special,'carcomido');
 const data=gear.migrate({gearBag:[item]},tree);assert.equal(data.gearBag[0].special,'carcomido');
 const ring=gear.generate(7,tree,()=>.5,'ring1',true,'rot-ring');ring.special='carcomido';assert.equal(gear.validate(ring,tree).special,undefined);
 item.special='unknown';assert.equal(gear.validate(item,tree).special,undefined);
});
