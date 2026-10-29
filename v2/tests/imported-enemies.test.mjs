import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,step,dealDamage} from '../scripts/training-model.mjs';
import {Types,composition,spawnEnemy,flightHeight} from '../scripts/enemies.mjs';
function setup(index){const w=createWorld({horde:0}),p=w.player;w.actors=[p];w.arena={bounds:{minX:-20,maxX:20,minY:-20,maxY:20},solids:[]};Object.assign(p,{x:0,y:0,hp:1000,maxHp:1000,hpRegen:0});const e=spawnEnemy(w,index,0,-1);return {w,p,e};}
const advance=(w,t)=>{for(let i=0;i<Math.round(t/.01);i++)step(w,.01);};
test('voo baixo oscila, permanece vulnerável e desce ao morrer',()=>{
 const {w,e}=setup(7);assert.equal(flightHeight(e,0),.85);assert.ok(flightHeight(e,.25)>.85);assert.equal(flightHeight({...e,model:'warrior'},1),0);
 const hp=e.hp;dealDamage(w,e,1,w.player);assert.ok(e.hp<hp);
 e.hp=0;e.animationTime=0;assert.equal(flightHeight(e,0),.85);e.animationTime=.8;assert.equal(flightHeight(e,0),0);
});
test('extensão da v2 preserva os seis índices e introduz novos tipos progressivamente',()=>{
 assert.deepEqual(Types.slice(0,6).map(t=>t.name),['Guerreiro','Arqueiro','Bruto','Mago Vivo','Cão de Cripta','Acólito de Guerra']);
 for(const wave of [1,8])assert.ok(composition(wave,8,()=>.5).every(i=>i<6));
 for(const [wave,index] of [[9,6],[11,7],[13,8]])assert.ok(composition(wave,8,()=>.5).includes(index));
});
for(const index of [6,7,8])test('ataque preparado: dano único, evasão e morte cancelam — '+index,()=>{
 let {w,p,e}=setup(index);advance(w,.2);assert.equal(p.hp,1000);assert.ok(e.strike);advance(w,.15);assert.ok(p.hp<1000);const hp=p.hp;advance(w,.3);assert.equal(p.hp,hp);
 ({w,p,e}=setup(index));advance(w,.1);p.x=8;advance(w,.3);assert.equal(p.hp,1000);
 ({w,p,e}=setup(index));advance(w,.1);dealDamage(w,e,99999,p);advance(w,.4);assert.equal(p.hp,1000);
 ({w,p,e}=setup(index));advance(w,.1);w.paused=true;const elapsed=e.strike.time;step(w,.25);assert.equal(e.strike.time,elapsed);assert.equal(p.hp,1000);
});
