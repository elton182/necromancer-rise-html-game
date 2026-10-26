'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('./war-acolyte-model'),H=require('./crypt-hound-model'),E=require('./expedition-model');
const types=Array.from({length:6},(_,i)=>({id:['soldier','archer','brute','mage','cryptHound','warAcolyte'][i]}));
function scenario(){
 const priest={type:types[5],x:0,y:0,abilityCd:0},ally={type:types[0],x:3,y:0};
 const enemies=[priest,ally],env={target:()=>({x:6,y:0}),allies:()=>enemies};
 return {priest,ally,enemies,tick:dt=>M.update(priest,dt,env)};
}
test('windup grants no bonus, channel lasts four seconds, cooldown begins after it',()=>{
 const s=scenario();s.tick(.99);assert.equal(M.damage(10,s.ally,s.enemies),10);
 s.tick(.01);assert.equal(s.priest.ability.phase,'channel');assert.equal(M.damage(10,s.ally,s.enemies),13);
 s.tick(3.99);assert.equal(M.damage(10,s.ally,s.enemies),13);
 s.tick(.01);assert.equal(M.damage(10,s.ally,s.enemies),10);assert.equal(s.priest.abilityCd,7);
});
test('phase boundaries survive long frames and do not cast multiple times',()=>{
 for(const step of [1/120,1/30,.5,6]){
  const s=scenario();for(let t=0;t<6-1e-8;t+=step)s.tick(Math.min(step,6-t));
  assert.equal(s.priest.ability,null);assert.ok(s.priest.abilityCd>=6-1e-8);
 }
});
test('source death, departure, disengagement and reset end live bonus immediately',()=>{
 const s=scenario();s.tick(1);s.priest.dead=true;assert.equal(M.damage(10,s.ally,s.enemies),10);
 s.priest.dead=false;s.ally.x=5.51;assert.equal(M.damage(10,s.ally,s.enemies),10);
 s.ally.x=5.5;assert.equal(M.damage(10,s.ally,s.enemies),13);
 s.priest.expedition=true;s.priest.alert=false;assert.equal(M.damage(10,s.ally,s.enemies),10);
 s.priest.alert=true;assert.equal(M.damage(10,s.ally,s.enemies),13);
 M.reset(s.priest);assert.equal(M.damage(10,s.ally,s.enemies),10);
});
test('auras never stack and never buff self, other acolytes, bosses or dummies',()=>{
 const s=scenario();s.tick(1);s.enemies.push({...s.priest});
 for(let i=0;i<100;i++)assert.equal(M.damage(10,s.ally,s.enemies),13);
 assert.equal(M.damage(10,s.priest,s.enemies),10);
 for(const target of [{...s.ally,isBoss:true},{...s.ally,dummy:true},{...s.ally,dead:true}])assert.equal(M.damage(10,target,s.enemies),10);
 assert.equal(M.damage(10,s.ally,[]),10);
});
test('no ritual without allies or nearby threat; death during windup cancels',()=>{
 const s=scenario();s.ally.dead=true;assert.equal(s.tick(1),false);s.ally.dead=false;
 s.tick(.5);s.priest.dead=true;assert.equal(s.tick(.5),false);assert.equal(s.priest.ability,null);
 const p={type:types[5],x:0,y:0,abilityCd:0};
 assert.equal(M.update(p,1,{target:()=>({x:11,y:0}),allies:()=>[s.ally]}),false);
});
test('arena introduction preserves dog quota, old waves, campaign and list size',()=>{
 for(const wave of [1,4,5,6,7,8,40]){
  const base=H.arenaTypes(wave,30,types,()=>.5),list=M.arenaTypes(wave,base,types);
  assert.equal(list.length,30);assert.equal(list.filter(t=>t.id==='cryptHound').length,base.filter(t=>t.id==='cryptHound').length);
  assert.equal(list.filter(t=>t.id==='warAcolyte').length,wave<6?0:wave===6?1:wave===7?2:3);
  assert.deepEqual(M.arenaTypes(wave,base,types,true),base);
 }
});
test('expedition introduction preserves geometry, tiers and seeded original plans',()=>{
 for(const wave of [4,6,7,50]){
  const base=E.plan(wave),plan=M.expeditionPlan(E.plan(wave));
  assert.deepEqual(plan.route,base.route);
  assert.equal(plan.groups.flatMap(g=>g.mobs).filter(m=>m.type===5).length,wave<6?0:wave===6?1:4);
  for(let i=0;i<plan.groups.length;i++){
   assert.equal(plan.groups[i].tier,base.groups[i].tier);
   assert.deepEqual(plan.groups[i].mobs.map(m=>[m.x,m.y]),base.groups[i].mobs.map(m=>[m.x,m.y]));
  }
 }
});
