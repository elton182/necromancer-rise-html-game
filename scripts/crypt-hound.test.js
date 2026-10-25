'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const H=require('./crypt-hound-model'),E=require('./expedition-model');
const types=[{name:'Guerreiro'},{name:'Arqueiro'},{name:'Bruto'},{name:'Mago Vivo'},{id:'cryptHound'}];
function scenario(target={x:6,y:0},solids=[],walls=[]){
 const dog={x:0,y:0,dmg:7,abilityCd:0},hits=[];
 const env={target:()=>target,sweep:(ax,ay,bx,by)=>H.sweep(ax,ay,bx,by,solids,walls,[target]),bound:(x,y)=>({x,y}),damage:(t,d)=>hits.push([t,d])};
 return {dog,target,hits,env,tick:dt=>H.update(dog,dt,env)};
}
test('fixed windup, straight charge, first hit and full recovery',()=>{
 const s=scenario();s.tick(.5);assert.equal(s.dog.x,0);assert.equal(s.dog.ability.tx,6);
 s.target.y=3;s.tick(.25);assert.equal(s.dog.x,0);s.tick(.5);
 assert.equal(s.dog.x,6);assert.equal(s.dog.y,0);assert.equal(s.hits.length,0);
 assert.equal(s.dog.ability.phase,'recover');s.tick(.99);assert.ok(s.dog.ability);s.tick(.01);
 assert.equal(s.dog.ability,null);assert.equal(s.dog.abilityCd,7);
 s.tick(6);assert.equal(s.dog.ability,null);assert.equal(s.dog.abilityCd,1);
});
test('swept collision is independent of frame size and damages once',()=>{
 for(const step of [1/120,1/30,.5,2]){
  const s=scenario();for(let t=0;t<2.5-1e-8;t+=step)s.tick(Math.min(step,2.5-t));
  assert.equal(s.hits.length,1);assert.equal(s.hits[0][1],11);assert.ok(Math.abs(s.dog.x-5.5)<.001);
 }
});
test('solids and corpse walls stop charge before a target; wall wins ties',()=>{
 for(const [solids,walls]of [[[{x:3,y:0,r:.5}],[]],[[],[{x:3,y:0,ux:0,uy:1,half:2,width:.4}]]]){
  const s=scenario(undefined,solids,walls);s.tick(2);assert.equal(s.hits.length,0);assert.ok(s.dog.x<3);
 }
 const hit=H.sweep(0,0,6,0,[{x:3,y:0,r:0}],[],[{x:3,y:0}]);assert.equal(hit.target,null);
});
test('earliest living target is hit even when targets are passed in reverse order',()=>{
 const near={x:2,y:0},far={x:5,y:0};assert.equal(H.sweep(0,0,6,0,[],[],[far,near]).target,near);
});
test('first availability, activation range, death and boundary stop',()=>{
 const s=scenario();delete s.dog.abilityCd;s.tick(1);assert.equal(s.dog.ability,undefined);s.tick(1);assert.equal(s.dog.ability.phase,'windup');
 s.dog.dead=true;s.tick(1);assert.equal(s.dog.ability,null);assert.equal(s.hits.length,0);
 for(const x of [2,7.1]){const q=scenario({x,y:0});assert.equal(q.tick(.1),false);}
 const q=scenario();q.env.bound=(x,y)=>({x:Math.min(3,x),y});q.tick(1.1);assert.ok(Math.abs(q.dog.x-3)<.001);assert.equal(q.dog.ability.phase,'recover');assert.equal(q.hits.length,0);
});
test('arena introduces hounds without changing totals or campaign composition',()=>{
 for(const wave of [1,2,3,4,5,6,27,1000]){
  const list=H.arenaTypes(wave,60,types,()=>.99);assert.equal(list.length,60);
  assert.equal(list.filter(t=>t.id).length,wave<4?0:wave===4?1:wave===5?2:12);
  if(wave===4){assert.equal(list[0],types[4]);assert.ok(list.slice(1).every(t=>t===types[0]));}
  assert.equal(H.arenaTypes(wave,60,types,()=>.99,true).filter(t=>t.id).length,0);
 }
});
test('expedition introductions retain seed geometry, tiers and mob counts',()=>{
 const m=E.plan(4);assert.equal(m.groups[0].mobs.filter(t=>t.type===4).length,1);assert.equal(m.groups[1].mobs.filter(t=>t.type===4).length,2);
 assert.ok(m.groups.slice(2).every(g=>g.mobs.every(t=>t.type!==4)));
 assert.ok(m.groups[0].mobs[0].x<m.groups[0].x-5);
 for(const wave of [1,2,3,5,27,1000]){
  const p=E.plan(wave);assert.deepEqual(p,E.plan(wave));assert.equal(p.groups.reduce((n,g)=>n+g.mobs.length,0),84);
  for(const g of p.groups)assert.equal(g.mobs.filter(t=>t.type===4).length,wave<4?0:Math.floor(g.mobs.length*.2));
 }
});
