import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createWorld,cast,dash,step,dealDamage} from '../scripts/training-model.mjs';
import {updateProjectiles,RULES,boltCost,BOLT_COST_MIN} from '../scripts/combat.mjs';
import {MAX_LEVEL} from '../scripts/progression.mjs';
import {transition,createSession} from '../scripts/session.mjs';
import {corpseSink} from '../scripts/enemies.mjs';
const require=createRequire(import.meta.url),{readCombatRules}=require('../tools/combat-source.cjs'),Equipment=require('../../scripts/equipment-model.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function field(){const w=createWorld({horde:0});w.actors=[w.player];w.player.x=0;w.player.y=0;w.aim={x:9,y:0};w.arena={bounds:{minX:-15,maxX:15,minY:-15,maxY:15},solids:[]};return w;}
function enemy(w,x,y=0){const e={id:w.nextId++,model:'zombie',team:'enemy',x,y,hp:60,maxHp:60,radius:.3,animation:'idle',animationTime:0,timer:0,walkDistance:0,angle:0,actionId:0};w.actors.push(e);return e;}
test('regras geradas correspondem às fontes atuais; atributos usam modelo compartilhado',()=>{
 assert.deepEqual(RULES,readCombatRules());const w=field();assert.equal(w.player.spellDamage,Equipment.spellDamage(1));assert.equal(w.player.moveSpeed,Equipment.moveSpeed());assert.equal(w.player.mp,80);
});
test('tiro custa mana e recarga uma vez; pausa, morte, mira inválida e mana insuficiente não cobram',()=>{
 const w=field();assert.ok(cast(w));assert.equal(w.player.mp,75);assert.equal(w.castCooldown,.5);assert.equal(cast(w),false);assert.equal(w.player.mp,75);
 for(const change of [w=>w.player.mp=4,w=>w.paused=true,w=>w.player.hp=0,w=>w.aim.x=NaN]){const a=field();change(a);const mp=a.player.mp;assert.equal(cast(a),false);assert.equal(a.player.mp,mp);assert.equal(a.castCooldown,0);}
});
test('colisão contínua acerta primeiro alvo no segmento mesmo com lista invertida e passo longo',()=>{
 const w=field(),far=enemy(w,7),near=enemy(w,3);cast(w);updateProjectiles(w,1);assert.equal(near.hp,40);assert.equal(far.hp,60);assert.equal(w.projectiles.length,0);assert.equal(w.hits,1);
});
test('trajetória máxima não ultrapassa nove unidades; sólidos não bloqueiam tiro, como na fonte atual',()=>{
 const w=field(),far=enemy(w,12);cast(w);const b=w.projectiles[0];updateProjectiles(w,10);close(b.x,9);assert.equal(far.hp,60);assert.equal(w.projectiles.length,0);
 const a=field();a.arena.solids=[{kind:'box',x:2,y:0,width:.1,depth:6}];const target=enemy(a,4);cast(a);updateProjectiles(a,1);assert.equal(target.hp,40);
});
test('perfuração e estilhaços compartilham acertos e não multiplicam dano num mesmo alvo',()=>{
 const w=field(),a=enemy(w,2),b=enemy(w,6);w.modifiers.extraPierce=1;cast(w);updateProjectiles(w,1);assert.equal(a.hp,40);assert.equal(b.hp,40);
 const s=field(),target=enemy(s,2);s.modifiers.shards=true;s.modifiers.extraPierce=5;cast(s);assert.equal(s.projectiles.length,3);assert.equal(s.projectiles[0].hitIds,s.projectiles[2].hitIds);updateProjectiles(s,.3);updateProjectiles(s,.3);assert.equal(target.hp,40);assert.equal(s.hits,1);
});
test('regeneração e cooldown respeitam tempo, sem avançar na pausa',()=>{
 const w=field();cast(w);step(w,.25);close(w.player.mp,76);w.paused=true;const state=JSON.stringify(w);step(w,.25);assert.equal(JSON.stringify(w),state);w.paused=false;step(w,.25);assert.ok(cast(w));close(w.player.mp,72);
});
test('Dash percorre 4,5 unidades em 0,18 s sem mana; usa movimento antes da mira',()=>{
 const w=field();w.aim={x:0,y:-9};assert.ok(dash(w,{x:1,y:1}));assert.equal(dash(w),false);step(w,.18);close(w.player.x,4.5);close(w.player.y,0);close(w.dash.remaining,0);close(w.dash.cooldown,2.82);assert.equal(w.player.mp,80);
});
test('Dash para no primeiro sólido e não desliza ou atravessa paredes e limites',()=>{
 const w=field();w.player.x=-2;w.arena.solids=[{kind:'box',x:0,y:0,width:.1,depth:6}];dash(w,{x:1});step(w,.18);assert.equal(w.dash.remaining,0);assert.ok(w.player.x<=-.5);assert.ok(w.player.y> -2);
 const b=field();b.player.x=14;dash(b,{x:1,y:1});step(b,.18);assert.ok(b.player.x<=14.55);assert.equal(b.dash.remaining,0);
});
test('proteção do Dash termina ao acabar o deslocamento e não consome barreira',()=>{
 const w=field();w.player.barrier=5;dash(w,{x:1,y:1});assert.equal(dealDamage(w,w.player,20).blocked,true);assert.equal(w.player.barrier,5);step(w,.1);assert.equal(dealDamage(w,w.player,20).blocked,true);step(w,.08);const r=dealDamage(w,w.player,20);assert.equal(r.absorbed,5);assert.equal(r.applied,15);assert.equal(w.player.hp,85);
});
test('defesa compartilhada, barreira, bloqueio ósseo e morte seguem um único caminho',()=>{
 const w=field();w.player.defense=20;w.player.barrier=5;const r=dealDamage(w,w.player,20,{level:1});assert.equal(r.applied,5);assert.equal(r.absorbed,5);assert.equal(w.player.hp,95);
 w.player.boneShield=true;assert.ok(dealDamage(w,w.player,20,{level:1}).blocked);assert.equal(w.player.boneShield,false);assert.equal(w.player.hp,95);
 w.player.hp=1;cast(w);dealDamage(w,w.player,100);assert.equal(w.projectiles.length,0);assert.equal(w.effects.length,0);assert.equal(w.combatEvents.filter(e=>e.kind==='death').length,1);dealDamage(w,w.player,100);assert.equal(w.combatEvents.length,1);
});
test('dano da linha de frente arredonda uma vez; inimigos usam piso e mortes têm crédito único',()=>{
 const w=field(),a={id:98,team:'ally',model:'skeleton',hp:100};assert.equal(dealDamage(w,a,12).applied,10);const e=enemy(w,3);assert.equal(dealDamage(w,e,2.9).applied,2);dealDamage(w,e,100,w.player);dealDamage(w,e,100,w.player);assert.equal(w.combatEvents.filter(e=>e.kind==='death').length,1);assert.equal(w.combatEvents[0].source,w.player.id);
});
test('pisos de recarga são aplicados antes de maestria, e Véu não empilha defesa permanentemente',()=>{
 const w=field();w.modifiers={gearCooldown:50,dashCooldownPercent:-50,boltMasteryCooldown:10,dashMasteryCooldown:10};cast(w);close(w.castCooldown,.225);dash(w,{x:1,y:1});close(w.dash.cooldown,1.35);w.dash.remaining=0;w.player.veilTime=.1;close(dealDamage(w,w.player,20).applied,15);step(w,.1);close(dealDamage(w,w.player,20).applied,20);
});
test('morte e transição removem projéteis, recargas e proteções sem persistir combate',()=>{
 const s=createSession();transition(s,'training');s.world.aim={x:9,y:4};cast(s.world);dash(s.world);s.world.player.barrier=100;transition(s,'menu');assert.equal(s.world.projectiles.length,0);assert.equal(s.world.dash.remaining,0);assert.equal(s.world.dash.cooldown,0);assert.equal(s.world.player.barrier,0);assert.equal(s.save.world,undefined);
});
test('área hostil passa pelo dano comum para jogador e aliado, incluindo morte durante o impacto',()=>{
 const w=createWorld({horde:6}),ally=w.actors.find(a=>a.team==='ally');w.actors=[w.player,w.boss,ally];w.player.x=0;w.player.y=4;w.boss.x=0;w.boss.y=2;Object.assign(w.boss,{kingGap:0,kingCd:{slash:0,leap:99,summon:99}});ally.x=.5;ally.y=4;ally.timer=99;
 for(let i=0;i<55;i++)step(w,1/60);assert.equal(w.player.hp,71);assert.equal(ally.hp,77);
 const a=field(),source=enemy(a,0);a.player.hp=1;a.effects=[{id:50,source:source.id,target:a.player.id,kind:'danger',x:0,y:0,radius:2,time:.84,delay:.85},{id:51,source:source.id,target:a.player.id,kind:'danger',x:0,y:0,radius:2,time:.84,delay:.85}];assert.doesNotThrow(()=>step(a,.1));assert.equal(a.player.hp,0);assert.equal(a.effects.length,0);assert.equal(a.combatEvents.filter(e=>e.target===a.player.id).length,1);
});



test('custo do Tiro de Osso sobe de 5 MP no nível 1 até o custo das regras no nível máximo',()=>{
 const at=level=>boltCost({level});assert.equal(at(1),BOLT_COST_MIN);assert.equal(BOLT_COST_MIN,5);assert.equal(at(MAX_LEVEL),RULES.bolt.cost);assert.equal(at(MAX_LEVEL+10),RULES.bolt.cost);assert.equal(at(0),5);
 let previous=0;for(let level=1;level<=MAX_LEVEL;level++){assert.ok(at(level)>=previous);previous=at(level);}
});
test('corpo de inimigo some após o tempo de decomposição; aliados e jogador permanecem',()=>{
 const w=field(),foe=enemy(w,5),keep=enemy(w,6);dealDamage(w,foe,1e6);assert.ok(foe.dead);
 for(let i=0;i<1.5*60;i++)step(w,1/60);assert.ok(w.actors.includes(foe));assert.ok(corpseSink(foe)<.9);
 for(let i=0;i<.6*60;i++)step(w,1/60);assert.ok(!w.actors.includes(foe));assert.ok(w.actors.includes(keep));assert.ok(w.actors.includes(w.player));
});
