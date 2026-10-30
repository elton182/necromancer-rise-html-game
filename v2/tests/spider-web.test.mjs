import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,step,dealDamage} from '../scripts/training-model.mjs';
import {spawnEnemy,shoot} from '../scripts/enemies.mjs';
import {beginDash} from '../scripts/combat.mjs';
function setup(){const w=createWorld({horde:0});w.actors=[w.player];Object.assign(w.player,{x:0,y:0,hp:1000,maxHp:1000,hpRegen:0});w.arena={bounds:{minX:-30,maxX:30,minY:-30,maxY:30},solids:[]};const e=spawnEnemy(w,8,0,-5);e.webCd=0;return {w,e,p:w.player};}
function advance(w,t,input={}){for(let i=0;i<Math.round(t/.01);i++)step(w,.01,input);}
test('teia avisa, trava a direcao e imobiliza por dois segundos',()=>{const {w,e,p}=setup();advance(w,.2);assert.ok(e.web);assert.ok(w.effects.some(f=>f.enemyWarning===e.id));advance(w,1.2);assert.ok(p.rootTime>1.7);dealDamage(w,e,1e9,p);const x=p.x,y=p.y;assert.equal(beginDash(w,{x:1}),false);advance(w,1.6,{x:1});assert.equal(p.x,x);assert.equal(p.y,y);advance(w,.5,{x:1});assert.ok(Math.hypot(p.x-x,p.y-y)>0);});
test('sair da trajetoria evita a teia e morte cancela a preparacao',()=>{let {w,e,p}=setup();advance(w,.2);p.x=4;advance(w,1.3);assert.ok(!p.rootTime);({w,e,p}=setup());advance(w,.2);dealDamage(w,e,1e9,p);advance(w,1);assert.ok(!e.web);assert.ok(!w.hostileShots.some(s=>s.kind==='web'));});
test('dash evita a imobilizacao no impacto',()=>{const {w,e,p}=setup();e.webCd=99;shoot(w,e,0,1,1,10,.9,'web');w.hostileShots[0].y=-.1;w.dash.remaining=.2;advance(w,.01);assert.ok(!p.rootTime);});
