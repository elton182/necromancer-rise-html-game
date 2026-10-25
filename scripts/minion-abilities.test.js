'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
 const c=vm.createContext({console});vm.runInContext(`
 let gameState='field',minions=[],enemies=[],eshots=[],minionCommand=null,hits=[],intents=0;
 const P={x:0,y:0,deadT:0},PM={tab:'status'},LEASH_DIST=16,S=32,MINION_DEFS={zombie:{name:'Zumbi'}};
 const document={querySelector:()=>null},ring=()=>{},burst=()=>{};
 let clampMobLanding=(x,y)=>({x,y});
 function dealDamageToEnemy(e,dmg){hits.push([e.id,dmg]);e.hp-=dmg;}
 function minionTargetAllowed(e,npos){return !!e&&!e.dead&&Math.hypot(e.x-npos.x,e.y-npos.z)<=LEASH_DIST;}
 function updateMinionIntent(){intents++;}function handsSpeed(){return 1;}function updateAbilities(){}function drawAllyLeapWarnings(){}function killMinion(m){m.dead=true;}function tPause(){}
 function pos(o,x,y){o.mesh={position:{x,y:0,z:y}};Object.defineProperties(o,{x:{get(){return this.mesh.position.x},set(v){this.mesh.position.x=v}},y:{get(){return this.mesh.position.z},set(v){this.mesh.position.z=v}}});return o;}
 function ally(type,x=0,y=0,atkR=1.5){return pos({type,dead:false,dmg:10,atkR,face:1},x,y);}
 function foe(id,x,y,extra={}){return pos({id,dead:false,hp:500,type:{sc:1},...extra},x,y);}
 const npos={x:0,z:0};
 `,c);vm.runInContext(fs.readFileSync(path.join(__dirname,'minion-abilities.js'),'utf8'),c);
 // Copy objects out of the VM realm so deepEqual compares plain structures.
 return s=>{const v=vm.runInContext(s,c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v;};
}
test('abilities wait for their staggered cooldown, then fire once and restart the timer',()=>{
 const run=fixture();run('var z=ally("zombie",0,0),e=foe("a",1,0);z.target=e;enemies=[e];minions=[z]');
 run('updateMinionIntent(z,0,.1,npos)');assert.equal(run('intents'),1);assert.equal(run('hits.length'),0);assert.ok(run('z._abilityCd')>0);
 run('z._abilityCd=0;updateMinionIntent(z,0,.1,npos)');assert.deepEqual(run('hits'),[['a',15]]);assert.equal(run('z._abilityCd'),7);
 assert.equal(run('e.minionSlow'),.35);assert.equal(run('handsSpeed(e)'),.65);
 run('updateMinionIntent(z,0,.1,npos)');assert.equal(run('hits.length'),1);
 run('updateAbilities(3)');assert.equal(run('handsSpeed(e)'),1);
});
test('no cast without a reachable target, while rallying or outside the field',()=>{
 const run=fixture();run('var z=ally("zombie"),e=foe("a",4,0);z.target=e;z._abilityCd=0;enemies=[e]');
 assert.equal(run('castMinionAbility(z,npos)'),false);
 run('e.x=1;minionCommand={type:"rally"}');assert.equal(run('castMinionAbility(z,npos)'),false);
 run('minionCommand=null;gameState="hub"');assert.equal(run('castMinionAbility(z,npos)'),false);
 run('gameState="field"');assert.equal(run('castMinionAbility(z,npos)'),true);
});
test('skeleton spin hits every nearby enemy and archer volley spreads over three targets',()=>{
 const run=fixture();run('var s=ally("skeleton",0,0,1.6),a=foe("a",1,0),b=foe("b",-1.5,.5),c=foe("c",5,0);s.target=a;enemies=[a,b,c]');
 assert.equal(run('castMinionAbility(s,npos)'),true);assert.deepEqual(run('hits.map(h=>h[0]).sort()'),['a','b']);assert.equal(run('hits[0][1]'),13);
 run('var r=ally("archer",0,0,7.5);r.target=c;eshots=[]');assert.equal(run('castMinionAbility(r,npos)'),true);
 assert.equal(run('eshots.length'),3);assert.deepEqual(run('eshots.map(s=>s.tgt.id).sort()'),['a','b','c']);assert.equal(run('eshots[0].dmg'),9);
});
test('specter dashes through its target and the abomination slows crowds without displacing targets',()=>{
 const run=fixture();run('var p=ally("specter",0,0,2),e=foe("a",3,0);p.target=e;enemies=[e]');
 assert.equal(run('castMinionAbility(p,npos)'),true);assert.ok(run('p.x')>3);assert.deepEqual(run('hits'),[['a',20]]);
 run('hits=[];var m=ally("abom",0,0,2.1),x=foe("x",1,0),boss=foe("boss",-1,0,{isBoss:true});m.target=x;enemies=[x,boss]');
 assert.equal(run('castMinionAbility(m,npos)'),true);assert.equal(run('hits.length'),2);assert.equal(run('x.kx'),undefined);assert.equal(run('x.ky'),undefined);assert.equal(run('boss.kx'),undefined);
 assert.equal(run('x.x'),1);assert.equal(run('x.y'),0);assert.equal(run('handsSpeed(x)'),.65);
 run('updateAbilities(2)');assert.equal(run('handsSpeed(x)'),1);
 run('minionSlowEnemy(boss,.35,3)');assert.equal(run('handsSpeed(boss)'),1);
});
