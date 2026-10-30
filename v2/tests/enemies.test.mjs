import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import King from '../scripts/shared-fallen-king.mjs';
const require=createRequire(import.meta.url);
const canonical=require('../../scripts/fallen-king-model.js');
const {readEnemyTypes}=require('../tools/enemy-source.cjs');
test('catálogo preserva índices, IDs modulares e recompensas válidas',()=>{
 const types=readEnemyTypes();assert.equal(types[4].id,'cryptHound');assert.equal(types[5].id,'warAcolyte');
 for(const t of types)for(const k of ['hp','dmg','spd','xp'])assert.ok(t[k]>0);
});
test('Rei compartilhado preserva fases e morte cancela o avanço',()=>{
 assert.deepEqual(King.skills,canonical.skills);
 const e={x:0,y:0,hp:100,maxHp:100,dmg:20};let hits=0;
 const io={target:()=>({x:1,y:0}),bound:(x,y)=>({x,y}),cone:()=>hits++,area:()=>hits++,summon:()=>{}};
 King.reset(e);King.update(e,2,io);assert.ok(e.king);e.dead=true;
 King.update(e,10,io);assert.equal(hits,0);assert.deepEqual(King.hazards(e),[]);
});
import {createWorld,step,dealDamage} from '../scripts/training-model.mjs';
test('integração: corte atinge uma vez, morte remove avisos e reforços sem loot',()=>{
 const w=createWorld({horde:0}),e=w.boss;w.actors=[w.player,e];Object.assign(w.player,{x:1,y:0,hp:1000,maxHp:1000,hpRegen:0});Object.assign(e,{x:0,y:0,kingGap:0,kingCd:{slash:0,leap:99,summon:99},kingPhase2:false});
 const hp=w.player.hp;step(w,.1);assert.equal(e.king.kind,'slash');assert.equal(w.player.hp,hp);assert.ok(w.effects.some(f=>f.kingWarning===e.id));
 for(let i=0;i<4;i++)step(w,.25);assert.ok(w.player.hp<hp);const after=w.player.hp;step(w,.25);assert.equal(w.player.hp,after);
 let rewards=0;w.onEnemyDeath=()=>rewards++;w.actors.push({id:999,kingOwner:e.id,hp:10,team:'enemy'});dealDamage(w,e,99999,w.player);assert.equal(rewards,1);assert.equal(w.actors.at(-1).hp,0);assert.ok(!w.effects.some(f=>f.kingWarning===e.id));assert.equal(e.jumpZ,0);
});
import {spawnEnemy,composition,tickEnemy,tickHostiles,shoot,Types,R,Acolyte,Expedition} from '../scripts/enemies.mjs';
import EQ from '../scripts/shared-equipment.mjs';
function field8(){const w=createWorld({horde:0});w.actors=[w.player];w.arena={bounds:{minX:-20,maxX:20,minY:-20,maxY:20},solids:[]};Object.assign(w.player,{x:0,y:0,hp:10000,maxHp:10000,hpRegen:0});return w;}
const advance=(w,t)=>{for(let n=0;n<t-1e-8;n+=1/60)step(w,Math.min(1/60,t-n));};
test('composição apresenta cão isolado e, no lugar do acólito desativado, o Ladino Arqueiro, sem mudar índices',()=>{
 assert.deepEqual(new Set(composition(1,8,()=>.9)),new Set([0]));assert.equal(composition(4,8,()=>.9).filter(x=>x===4).length,1);assert.equal(composition(4,8,()=>.9).filter(x=>x!==0&&x!==4).length,0);assert.equal(composition(6,8,()=>.9).filter(x=>x===5).length,0);assert.equal(composition(6,8,()=>.9).filter(x=>x===9).length,1);assert.ok(composition(12,8,()=>.7).includes(4));
});
test('escala e raridade aplicadas uma vez; acólitos vivos reforçam sem empilhar',()=>{
 const w=field8(),e=spawnEnemy(w,0,0,2,{wave:7,tier:'rare'}),s=EQ.waveStats(7);assert.equal(e.hp,Math.round(Types[0].hp*s.hp*Expedition.tiers.rare.hp));
 const a=spawnEnemy(w,5,0,3,{legacy:true}),b=spawnEnemy(w,5,0,3,{legacy:true});for(const x of [a,b])x.ability={phase:'channel',time:0};assert.equal(Acolyte.damage(10,e,[a,b]),13);dealDamage(w,a,99999);dealDamage(w,b,99999);assert.equal(Acolyte.damage(10,e,[a,b]),10);
});
for(const index of [0,1,2,3,4,5])test('especial integrado: '+Types[index].name,()=>{
 const w=field8(),e=spawnEnemy(w,index,0,index===4||index===2?-4:-2,{legacy:true});e.abilityCd=0;e.atkTimer=99;
 if(index===5)spawnEnemy(w,0,1,-2).atkTimer=99;
 const hp=w.player.hp;advance(w,.1);assert.ok(e.ability);assert.equal(w.player.hp,hp);
 if(index===5){advance(w,1.1);assert.equal(e.ability.phase,'channel');assert.ok(Acolyte.supported(w.actors.at(-1),[e]));}
 else{advance(w,2);assert.ok(w.player.hp<hp,Types[index].name+' causou dano');}
 dealDamage(w,e,999999,w.player);assert.equal(e.ability,null);assert.ok(!w.effects.some(f=>f.enemyWarning===e.id));
});
test('projétil varre alvo e muro; Muralha absorve antes do alvo e é destruída',()=>{
 const w=field8(),e=spawnEnemy(w,1,-6,0);w.walls=[{x:-3,y:0,ux:0,uy:1,half:2,width:.5,hp:5,remaining:5}];shoot(w,e,1,0,12,100,1);tickHostiles(w,.1);assert.equal(w.player.hp,10000);assert.equal(w.walls.length,0);assert.equal(w.hostileShots.length,0);
 shoot(w,e,1,0,12,100,1);tickHostiles(w,.1);assert.equal(w.player.hp,9988);assert.equal(w.hostileShots.length,0);
});
test('morte durante salto/investida impede impactos e limpa altura',()=>{
 for(const i of [2,4]){const w=field8(),e=spawnEnemy(w,i,0,-4,{legacy:true});e.abilityCd=0;advance(w,.1);dealDamage(w,e,99999);const hp=w.player.hp;advance(w,2);assert.equal(w.player.hp,hp);assert.equal(e.jumpZ,0);}
});
test('Rei: salto trava destino, invoca até limite, morte desfaz reforços sem crédito',()=>{
 const w=field8(),e=w.boss;w.actors.push(e);Object.assign(e,{x:0,y:-5,hp:500,maxHp:1000,kingGap:0,kingCd:{slash:99,leap:0,summon:99},kingPhase2:true});advance(w,.1);assert.equal(e.king.kind,'leap');w.player.x=10;advance(w,1.7);assert.equal(w.player.hp,10000);assert.ok(Math.abs(e.y)<.01);e.king=null;e.kingGap=0;e.kingCd.leap=99;e.kingCd.summon=0;advance(w,1.5);assert.equal(w.actors.filter(a=>a.kingOwner===e.id).length,2);advance(w,1);e.kingGap=0;e.kingCd.summon=0;advance(w,1.5);assert.equal(w.actors.filter(a=>a.kingOwner===e.id).length,4);let count=0;w.onEnemyDeath=()=>count++;dealDamage(w,e,99999);assert.equal(count,1);assert.equal(w.actors.filter(a=>a.kingOwner===e.id&&a.hp>0).length,0);
});
import {createSession,transition,snapshot,updateSettings} from '../scripts/session.mjs';
import {normalizeSave} from '../scripts/save-model.mjs';
test('encontro persistido, save antigo com padrão e troca de cena limpa os efeitos hostis',()=>{
 const s=createSession();assert.equal(s.save.settings.encounterWave,1);updateSettings(s,{encounterWave:8});transition(s,'training');assert.ok(s.world.actors.some(a=>a.typeIndex===9));s.world.hostileShots.push({id:999});s.world.hostileZones.push({id:999});const saved=snapshot(s);assert.equal(saved.settings.encounterWave,8);assert.equal(saved.hostileShots,undefined);transition(s,'menu');assert.equal(s.world.hostileShots.length,0);assert.equal(s.world.hostileZones.length,0);const old=structuredClone(saved);delete old.settings.encounterWave;assert.equal(normalizeSave(old).settings.encounterWave,1);assert.throws(()=>normalizeSave({...saved,settings:{...saved.settings,encounterWave:0}}));
});
test('elite raro concede equipamento com os pesos compartilhados, sem repetir recompensa',()=>{
 const s=createSession();s.world.random=()=>.5;const e=spawnEnemy(s.world,0,0,0,{tier:'rare'});dealDamage(s.world,e,99999,s.world.player);const items=s.world.drops.filter(d=>d.kind==='equipment');assert.equal(items.length,1);assert.ok(['rare','epic'].includes(items[0].item.rarity));dealDamage(s.world,e,99999,s.world.player);assert.equal(s.world.drops.filter(d=>d.kind==='equipment').length,1);
});
test('flecha já lançada sobrevive à morte da fonte, como no motor atual',()=>{
 const w=field8(),e=spawnEnemy(w,1,-6,0);shoot(w,e,1,0,12,100,1);dealDamage(w,e,99999);tickHostiles(w,.1);assert.equal(w.player.hp,9988);assert.equal(w.hostileShots.length,0);
});
test('aura é arredondada antes do multiplicador do especial, como o getter canônico',()=>{
 const w=field8(),e=spawnEnemy(w,2,0,-4,{legacy:true}),a=spawnEnemy(w,5,1,-4,{legacy:true});e.abilityCd=0;e.atkTimer=99;a.ability={phase:'channel',time:0};a.atkTimer=99;const expected=Math.round(Acolyte.damage(e.dmg,e,[a])*R.abilities.Bruto.mult);advance(w,1.3);assert.equal(10000-w.player.hp,expected);
});
