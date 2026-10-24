'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../necromancer-canvas.html'),'utf8');
function source(name){const start=html.indexOf(`function ${name}(`);assert.ok(start>=0);return html.slice(start,html.indexOf('\n}',start)+2);}
function fixture(){
 const c=vm.createContext({console});vm.runInContext(`
 let solids=[],LEASH_DIST=16,minions=[],enemies=[],minionCommand=null,stored={},pauses=0;
 const FIELD_R=60,STG={on:false},P={x:0,y:0},keys={w:true},TITLE={active:false,paused:false},COMIC={active:false};
 let gameState='field';const MINION_RETURN_DIST=3;
 const optsLoad=()=>({...stored}),optsSave=o=>stored={...o},setPause=()=>pauses++;
 const updateAllyLeap=()=>false,minionStrike=()=>{};
 function mob(x,y,sc=1){return {x,y,type:{sc}};}
 function ally(x,y){return {x,y,mesh:{position:{x,z:y},rotation:{}},spd:3,atkR:1,orbitRadius:2,orbitAngle:0};}
 `,c);
 for(const name of ['collide','terrainLineClear','terrainPath','moveEnemyTo','setHordeRange','handleGameBlur','minionTargetAllowed','localMinionTarget','moveMinionTo','updateMinionIntent'])vm.runInContext(source(name),c);
 return s=>vm.runInContext(s,c);
}
test('enemies walk around a centered tree and overlapping building colliders without crossing terrain',()=>{
 for(const layout of ['[{x:0,y:0,r:.5}]','[-1.6,0,1.6].map(x=>({x,y:0,r:1.1}))','[{x:0,y:0,r:1.2},{x:0,y:2,r:1.2},{x:2,y:2,r:1.2}]']){
  const run=fixture();run(`solids=${layout};const e=mob(0,-6);let crossed=false;for(let i=0;i<500;i++){moveEnemyTo(e,0,6,3,.03);if(solids.some(p=>Math.hypot(e.x-p.x,e.y-p.y)<p.r+.3))crossed=true;}`);
  assert.equal(run('crossed'),false);assert.ok(run('Math.hypot(e.x,e.y-6)')<.2,layout);
 }
});
test('collision recovers exact obstacle centers and large mobs take a wider route',()=>{
 const run=fixture();run('solids=[{x:0,y:0,r:1}];const q={x:0,y:0};collide(q,.4);const e=mob(-5,0,2);let crossed=false;for(let i=0;i<500;i++){moveEnemyTo(e,5,0,3,.03);if(Math.hypot(e.x,e.y)<1.6)crossed=true;}');
 assert.ok(run('Math.hypot(q.x,q.y)')>=1.4);assert.equal(run('crossed'),false);assert.ok(run('Math.hypot(e.x-5,e.y)')<.2);
});
test('route recovers after crowd displacement, target movement and a new map',()=>{
 const run=fixture();run('solids=[{x:0,y:0,r:1}];const e=mob(-5,0);moveEnemyTo(e,5,0,3,.03);e.x=-2;e.y=1;for(let i=0;i<500;i++)moveEnemyTo(e,4,-3,3,.03);');assert.ok(run('Math.hypot(e.x-4,e.y+3)')<.2);
 run('solids=[{x:5,y:-3,r:1}];for(let i=0;i<500;i++)moveEnemyTo(e,8,-3,3,.03);');assert.ok(run('Math.hypot(e.x-8,e.y+3)')<.2);
});
test('large enemies approach a target standing close to a tree instead of freezing',()=>{
 const run=fixture();run('solids=[{x:0,y:0,r:1}];const e=mob(-5,0,2);for(let i=0;i<500;i++)moveEnemyTo(e,1.36,0,3,.03);');assert.ok(run('Math.hypot(e.x-1.36,e.y)')<.4);assert.ok(run('Math.hypot(e.x,e.y)')>=1.6);
});
test('horde ranges persist, reject invalid values and recall allies outside the new range',()=>{
 const run=fixture();run('minions=[{x:18,y:0,target:{}},{x:4,y:0,target:{}}];setHordeRange(24)');assert.equal(run('stored.hordeRange'),24);assert.equal(run('minions[0].returning'),false);
 run('setHordeRange(8)');assert.equal(run('minions[0].returning'),true);assert.equal(run('minions[1].returning'),false);assert.equal(run('minions[0].target'),null);
 run('setHordeRange(999)');assert.equal(run('LEASH_DIST'),16);
});
test('each minion reacquires its own nearest enemy while explicit commands retain priority',()=>{
 const run=fixture();run('const a={mesh:{position:{x:2,z:0}}},b={mesh:{position:{x:12,z:0}}};enemies=[a,b];const m=ally(10,0);m.target=a;updateMinionIntent(m,0,.31,{x:0,z:0});');assert.equal(run('m.target===b'),true);
 run('b.mesh.position.x=15;a.mesh.position.x=9;updateMinionIntent(m,0,.31,{x:0,z:0})');assert.equal(run('m.target===a'),true);
 run("minionCommand={type:'attack',x:15,z:0};updateMinionIntent(m,0,.31,{x:0,z:0})");assert.equal(run('m.target===b'),true);
 run('enemies=[{mesh:{position:{x:20,z:0}}}];minionCommand=null;setHordeRange(24);updateMinionIntent(m,0,.31,{x:0,z:0})');assert.equal(run('m.target===enemies[0]'),true);
});
test('focus loss honors the saved preference and always clears held keyboard input',()=>{
 const run=fixture();run('handleGameBlur()');assert.equal(run('pauses'),1);assert.equal(run('keys.w'),false);
 run('stored.pauseOnBlur=false;keys.w=true;handleGameBlur()');assert.equal(run('pauses'),1);assert.equal(run('keys.w'),false);
 run('stored.pauseOnBlur=true;handleGameBlur()');assert.equal(run('pauses'),2);
});
