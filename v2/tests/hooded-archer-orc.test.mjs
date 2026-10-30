import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,step,dealDamage} from '../scripts/training-model.mjs';
import {Types,models,composition,spawnEnemy,unlockedTypes,withNewTypes,DISABLED_TYPES} from '../scripts/enemies.mjs';
function setup(index,distance=1){const w=createWorld({horde:0}),p=w.player;w.actors=[p];w.arena={bounds:{minX:-20,maxX:20,minY:-20,maxY:20},solids:[]};Object.assign(p,{x:0,y:0,hp:1000,maxHp:1000,hpRegen:0});const e=spawnEnemy(w,index,0,-distance);return {w,p,e};}
const advance=(w,t)=>{for(let i=0;i<Math.round(t/.01);i++)step(w,.01);};
const warnings=(w,e)=>w.effects.filter(f=>f.enemyWarning===e.id);
test('Ladino Arqueiro e Orc são tipos novos com modelo próprio e preservam os índices anteriores',()=>{
 assert.equal(Types[9].name,'Ladino Arqueiro');assert.equal(Types[10].name,'Orc');assert.equal(models[9],'enemyRogue');assert.equal(models[10],'enemyOrc');
 assert.deepEqual(Types.slice(0,9).map(t=>t.name),['Guerreiro','Arqueiro','Bruto','Mago Vivo','Cão de Cripta','Acólito de Guerra','Ladrão','Humanoide Grifo','Aranha']);
 for(const [wave,index] of [[11,9],[13,10]])assert.ok(composition(wave,8,()=>.5).includes(index));
 assert.deepEqual([9,10,12].map(l=>unlockedTypes(l)),[[6,7,8],[6,7,8,9],[6,7,8,9,10]]);
 assert.deepEqual(withNewTypes([0,0,0,0,0,0,0,0,0,0],12).filter(i=>i>0),[6,7,8,9,10].slice(0,5));
});
test('Ladino Arqueiro atira à distância com as regras do Arqueiro e usa o clipe de ataque',()=>{
 const {w,p,e}=setup(9,7);assert.equal(e.model,'enemyRogue');let shots=0;
 for(let i=0;i<500;i++){step(w,.01);shots=Math.max(shots,w.hostileShots.length);}
 assert.ok(shots>0||p.hp<1000,'nenhum disparo em 5 s');assert.ok(Math.hypot(e.x-p.x,e.y-p.y)>2.5,'deve manter distância');
});
test('Orc: golpe de maça avisa a área, causa dano uma vez e pode ser evitado',()=>{
 let {w,p,e}=setup(10);advance(w,.3);assert.equal(p.hp,1000);assert.ok(e.strike);assert.ok(warnings(w,e).length>0);assert.equal(e.pose.anim,'smash_windup');
 advance(w,.5);assert.ok(p.hp<1000);const hp=p.hp;assert.equal(warnings(w,e).length,0);advance(w,.3);assert.equal(p.hp,hp);
 ({w,p,e}=setup(10));advance(w,.1);p.x=8;advance(w,1.3);assert.equal(p.hp,1000);
 ({w,p,e}=setup(10));advance(w,.1);dealDamage(w,e,99999,p);advance(w,.9);assert.equal(p.hp,1000);assert.equal(warnings(w,e).length,0);
 ({w,p,e}=setup(10));advance(w,.1);w.paused=true;const elapsed=e.strike.time;step(w,.5);assert.equal(e.strike.time,elapsed);assert.equal(p.hp,1000);
});
test('Bruto e Acólito de Guerra estão desativados: índices preservados, mas nenhum modo os gera',()=>{
 assert.deepEqual(DISABLED_TYPES,{2:10,5:9});assert.equal(Types[2].name,'Bruto');assert.equal(Types[5].name,'Acólito de Guerra');
 for(let wave=1;wave<=60;wave++)assert.ok(composition(wave,8,()=>.5).every(i=>i!==2&&i!==5),'onda '+wave);
 const {w}=setup(0);assert.equal(spawnEnemy(w,2,3,3).typeIndex,10);assert.equal(spawnEnemy(w,5,3,3).typeIndex,9);
 assert.equal(spawnEnemy(w,2,3,3,{legacy:true}).typeIndex,2);assert.equal(spawnEnemy(w,5,3,3,{legacy:true}).typeIndex,5);
});
