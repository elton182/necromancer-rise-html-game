'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('./soul-warden-model.js');
function scene(){
 const hits=[],shots=[],e={x:0,y:0,hp:480,maxHp:480,dmg:20},target={x:4,y:0};let enrages=0;
 const io={target:()=>target,bound:(x,y)=>({x,y}),area:(...v)=>hits.push(v),projectile:(...v)=>shots.push(v),enrage:()=>enrages++};
 M.reset(e);e.abilityCd=0;
 return {e,io,hits,shots,target,enrages:()=>enrages};
}
test('slam locks its target, warns for 1.2s, hits once and waits through recovery',()=>{
 const s=scene(),{e,io}=s;M.update(e,.01,io);s.target.x=9;
 assert.equal(e.ability.tx,4);assert.equal(s.hits.length,0);
 M.update(e,1.19,io);assert.equal(s.hits.length,0);
 M.update(e,.02,io);assert.equal(s.hits.length,1);assert.deepEqual(s.hits[0].slice(0,4),[4,0,2.8,36]);
 M.update(e,.2,io);assert.equal(s.hits.length,1);M.update(e,1,io);assert.equal(e.ability,null);assert.equal(e.abilityCd,3.8);
});
test('phase two happens once, adds seven projectiles and three locked seals',()=>{
 const s=scene(),{e,io}=s;e.hp=240;M.update(e,.01,io);assert.equal(e.wardenPhase,2);assert.equal(s.enrages(),1);
 M.update(e,3,io);e.abilityCd=0;M.update(e,.01,io);assert.equal(e.ability.kind,'volley');M.update(e,1.35,io);
 assert.equal(s.shots.length,7);assert.ok(s.shots.every(v=>Math.abs(Math.hypot(v[2],v[3])-8)<1e-8));
 M.update(e,1,io);e.abilityCd=0;M.update(e,.01,io);assert.equal(e.ability.kind,'seals');assert.equal(e.ability.points.length,3);
 M.update(e,1.5,io);assert.equal(s.hits.length,4);assert.equal(s.enrages(),1);
});
test('dead boss cannot execute an armed hit; reset cancels it and restores the opener',()=>{
 const {e,io,hits}=scene();M.update(e,.01,io);e.dead=true;M.update(e,5,io);assert.equal(hits.length,0);
 M.reset(e);assert.equal(e.ability,null);assert.equal(e.abilityCd,2);assert.equal(e.wardenStep,0);
});
test('target range and first phase projectile count are bounded',()=>{
 const {e,io,target,shots}=scene();target.x=20;assert.equal(M.update(e,.01,io),false);
 target.x=10;M.update(e,.01,io);assert.equal(e.ability.tx,5);M.update(e,5,io);e.abilityCd=0;
 M.update(e,.01,io);M.update(e,1.35,io);assert.equal(shots.length,5);
});
