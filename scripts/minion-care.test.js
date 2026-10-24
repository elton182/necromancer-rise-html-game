'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
 const c=vm.createContext({console});vm.runInContext(`
 let gameState='field',minions=[],enemies=[],eshots=[],mobZones=[],fallbacks=0;
 const player={mp:100},P={x:0,y:0,deadT:0},TITLE={active:false,paused:false},COMIC={active:false},PM={tab:'status'},LEASH_DIST=8,innerWidth=1200,innerHeight=800;
 const COMBAT_TUNING={manualReviveHealth:.6},MOB_ABILITIES={'Mago Vivo':{kind:'fire',radius:2.2},Arqueiro:{kind:'powerShot'},Guerreiro:{kind:'heavy',radius:2.1}};
 const document={querySelector:()=>null},floatMsg=()=>{},playSound=()=>{},updateMinionPanel=()=>{},menuUpdateSummary=()=>{},blockByCorpseWalls=()=>{};function updateHUD(){}
 let clampMobLanding=(x,y)=>({x,y});
 function tryReanimate(){}function updateMinionIntent(){fallbacks++;}function killMinion(m){m.dead=true;}function tPause(){}
 function ally(type='zombie',x=0,y=0){const material={opacity:.1,transparent:true},m={type,dead:false,hp:100,maxHp:300,spd:3.4,deadTimer:9,mesh:{position:{x,y:0,z:y,set(x,y,z){Object.assign(this,{x,y,z});}},traverse(cb){cb({material});}},material};Object.defineProperties(m,{x:{get(){return this.mesh.position.x},set(v){this.mesh.position.x=v}},y:{get(){return this.mesh.position.z},set(v){this.mesh.position.z=v}}});return m;}
 `,c);vm.runInContext(fs.readFileSync(path.join(__dirname,'minion-care.js'),'utf8'),c);return s=>vm.runInContext(s,c);
}
test('manual revive spends 30 mana once, restores visibility and places ally beside hero',()=>{
 const run=fixture();run('const m=ally();m.dead=true;m.mesh.position.y=-.4;minions=[m]');assert.equal(run('tryReanimate()'),true);assert.equal(run('player.mp'),70);assert.equal(run('m.hp'),180);assert.equal(run('m.deadTimer'),0);assert.equal(run('m.mesh.position.y'),.1);assert.equal(run('m.material.transparent'),false);assert.ok(run('Math.hypot(m.x-P.x,m.y-P.y)')<=2);assert.equal(run('tryReanimate()'),false);assert.equal(run('player.mp'),70);
});
test('sacrificed/exploded allies and insufficient mana cannot bypass recovery',()=>{
 const run=fixture();run('const m=ally();m.dead=true;m.sacrificed=true;minions=[m]');assert.equal(run('tryReanimate()'),false);run('m.sacrificed=false;m.exploded=true');assert.equal(run('tryReanimate()'),false);run('m.exploded=false;player.mp=29');assert.equal(run('tryReanimate()'),false);assert.equal(run('m.deadTimer'),9);assert.equal(run('m.dead'),true);assert.equal(run('player.mp'),29);
});
test('paused keyboard revive is blocked; explicit paid action in Horde menu works',()=>{
 const run=fixture();run('const m=ally();m.dead=true;minions=[m];TITLE.paused=true');assert.equal(run('tryReanimate()'),false);assert.equal(run('minionRevive(m,true)'),true);assert.equal(run('player.mp'),70);
});
test('zombies and skeletons react after a delay and move out of warned area without invulnerability',()=>{
 for(const type of ['zombie','skeleton','archer']){const run=fixture();run('const m=ally("'+type+'");minions=[m];enemies=[{type:{name:"Mago Vivo"},x:4,y:0,ability:{tx:0,ty:0,phase:"windup"}}]');assert.equal(run('minionEvade(m,0,.05,{x:0,z:0})'),false);assert.equal(run('m.x'),0);run('for(let i=0;i<15;i++)updateMinionIntent(m,0,.05,{x:0,z:0})');assert.ok(run('Math.hypot(m.x,m.y)')>2.2);assert.equal(run('m.hp'),100);assert.equal(run('m.invulnerable'),undefined);assert.ok(run('Math.hypot(m.x,m.y)')<=8);}
});
test('hostile projectiles are dodged; friendly projectiles do not trigger evasion',()=>{
 const run=fixture();run('const m=ally();eshots=[{x:-4,y:0,vx:12,vy:0,life:1,friendly:true}];');assert.equal(run('minionHazards().length'),0);run('eshots[0].friendly=false;for(let i=0;i<15;i++)updateMinionIntent(m,0,.05,{x:0,z:0})');assert.ok(run('Math.abs(m.y)')>.8);
});
test('dodge respects collision constraints and does not replace return-to-hero or leap AI',()=>{
 const run=fixture();run('const m=ally();m.returning=true;enemies=[{type:{name:"Mago Vivo"},x:4,y:0,ability:{tx:0,ty:0}}]');assert.equal(run('minionEvade(m,0,.3,{x:0,z:0})'),false);run('m.returning=false;m.allyLeap={}');assert.equal(run('minionEvade(m,0,.3,{x:0,z:0})'),false);run('m.allyLeap=null;clampMobLanding=(x,y)=>({x:Math.max(-.5,Math.min(.5,x)),y:Math.max(-.5,Math.min(.5,y))});for(let i=0;i<25;i++)updateMinionIntent(m,0,.05,{x:0,z:0})');assert.ok(run('Math.abs(m.x)')<=.5);assert.ok(run('Math.abs(m.y)')<=.5);
});
test('no hazard preserves normal AI and killing an ally clears dodge state',()=>{
 const run=fixture();run('const m=ally();updateMinionIntent(m,0,.05,{x:0,z:0});m._evade={};killMinion(m)');assert.equal(run('fallbacks'),1);assert.equal(run('m._evade'),null);assert.equal(run('m.dead'),true);
});
test('revive HUD cannot intercept clicks while hidden and explains insufficient mana',()=>{
 const run=fixture();run('const hint={style:{}};document.getElementById=()=>hint;updateHUD();');assert.equal(run('hint.style.pointerEvents'),'none');assert.equal(run('hint.disabled'),true);
 run('const m=ally();m.dead=true;minions=[m];player.mp=29;updateHUD();');assert.equal(run('hint.disabled'),true);assert.match(run('hint.textContent'),/mana insuficiente/);
 run('player.mp=30;updateHUD();');assert.equal(run('hint.disabled'),false);assert.equal(run('hint.style.pointerEvents'),'auto');
});
