'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const model=require('./expedition-model.js'),gear=require('./equipment-model.js'),tree=require('../build-simulator/model.js');
test('maps are reproducible, change terrain and biome, and keep the boss directly reachable',()=>{
 for(let n=1;n<=1000;n++){
  const m=model.plan(n);assert.deepEqual(m,model.plan(n));
  assert.ok(m.width>100&&m.height>56);assert.equal(m.entry.x,8);assert.equal(m.exit.x,m.width-8);
  assert.notEqual(m.biome,model.plan(n+1>1000?n-1:n+1).biome);
  assert.ok(m.groups.some(g=>g.tier==='magic'));assert.ok(m.groups.some(g=>g.tier==='rare'));
  assert.ok(m.groups.every(g=>g.mobs.length>=6&&g.mobs.length<=8));
  assert.equal(m.groups.reduce((total,g)=>total+g.mobs.length,0),84);
  assert.ok(m.groups.flatMap(g=>g.mobs).every(e=>e.x>0&&e.x<m.width&&e.y>0&&e.y<m.height));
 }
 assert.notDeepEqual(model.plan(1).route,model.plan(6).route);
});
test('magic and rare encounters trade increased attributes for higher drop rates and rarity floors',()=>{
 const {common,magic,rare}=model.tiers;
 assert.ok(common.hp<magic.hp&&magic.hp<rare.hp);assert.ok(common.damage<magic.damage&&magic.damage<rare.damage);
 assert.ok(common.chance<magic.chance&&magic.chance<rare.chance);
 const random=model.random(42);
 for(const tier of ['magic','rare'])for(let i=0;i<300;i++){
  const item=gear.generate(12,tree,random,undefined,false,'tier-'+i,{loot:{weights:model.lootWeights(tier)}});
  assert.ok(tier==='rare'?['rare','epic'].includes(item.rarity):item.rarity!=='common');
  assert.ok(gear.validate(item,tree));
 }
});
