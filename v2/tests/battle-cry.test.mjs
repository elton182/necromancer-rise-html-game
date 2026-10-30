import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,step,dealDamage} from '../scripts/training-model.mjs';
import {spawnEnemy,shoot,CRY,warBuffActive,Types} from '../scripts/enemies.mjs';
function setup(){const w=createWorld({horde:0});w.actors=[w.player];Object.assign(w.player,{x:0,y:0,hp:1e6,maxHp:1e6,hpRegen:0});w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};const orc=spawnEnemy(w,10,0,-6),ally=spawnEnemy(w,1,2,-6);orc.cryCd=0;orc.abilityCd=99;ally.atkTimer=99;ally.abilityCd=99;ally.rainCd=99;return {w,orc,ally};}
const run=(w,t)=>{for(let i=0;i<Math.round(t/.01);i++)step(w,.01);};
test('grito prepara e aplica bonus temporario sem alterar atributos base',()=>{const {w,orc,ally}=setup();const base=ally.dmg;run(w,.3);assert.ok(orc.cry);assert.ok(!ally.warBuff);run(w,1);assert.ok(warBuffActive(w,ally));assert.equal(ally.dmg,base);assert.ok(w.effects.some(f=>f.warAura));shoot(w,ally,0,1,100,10,1);assert.equal(w.hostileShots.at(-1).damage,Math.round(100*CRY.damage));assert.ok(w.combatEvents.some(e=>e.kind==='orcCry'));assert.ok(w.effects.some(f=>f.fx==='roar'));orc.cryCd=99;run(w,6.1);assert.ok(!warBuffActive(w,ally));});
test('morte cancela preparacao e encerra o bonus concedido',()=>{let {w,orc,ally}=setup();run(w,.3);dealDamage(w,orc,1e9,w.player);run(w,1);assert.ok(!warBuffActive(w,ally));({w,orc,ally}=setup());run(w,1.2);assert.ok(warBuffActive(w,ally));dealDamage(w,orc,1e9,w.player);assert.ok(!warBuffActive(w,ally));});
test('vida maior e flechas do ladino carregam sinal de rastro',()=>{const {w,ally}=setup();assert.equal(Types[0].hp,60);assert.equal(Types[10].hp,110);shoot(w,ally,0,1,1,10,1);assert.ok(w.hostileShots.at(-1).rogueTrail);});
