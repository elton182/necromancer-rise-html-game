import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,step,dash,resetWorld} from '../scripts/training-model.mjs';
import {warriorAction,tickWarrior,warriorPose,COMBO_WINDOW,WARRIOR_ACTIONS,THRUST_TIMING} from '../scripts/warrior.mjs';
import {normalizeSave,freshSave,createSaveStore} from '../scripts/save-model.mjs';
import EQ from '../scripts/warrior-equipment.mjs';
import {normalizeWarrior} from '../scripts/warrior-model.mjs';
import {applyAttributes} from '../scripts/progression.mjs';
function field(){const w=createWorld({horde:0,character:{classId:'warrior',equipment:{shield:EQ.generate(1,null,()=>.2,'shield')}}});w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:9,y:0};w.arena={bounds:{minX:-15,maxX:15,minY:-15,maxY:15},solids:[]};return w;}
function enemy(w,x,y=0){const e={id:w.nextId++,team:'enemy',x,y,radius:.3,hp:1000,maxHp:1000,animation:'idle'};w.actors.push(e);return e;}
const durations=WARRIOR_ACTIONS[0].durations;
function advance(w,dt){if(w.paused)return;w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);tickWarrior(w,dt);}
test('um clique executa somente um corte; três cliques aplicam os três danos uma vez',()=>{
 const w=field(),e=enemy(w,2),damage=w.player.damage;
 assert.ok(warriorAction(w));assert.equal(warriorPose(w).anim,'slash_1');advance(w,.15);assert.equal(e.hp,1000);advance(w,.45);
 assert.equal(e.hp,1000-Math.floor(damage*.55));assert.equal(w.warriorAction,null);advance(w,.1);assert.equal(e.hp,1000-Math.floor(damage*.55));
 assert.ok(warriorAction(w));assert.equal(warriorPose(w).anim,'slash_2');advance(w,durations[1]);
 assert.ok(warriorAction(w));assert.equal(warriorPose(w).anim,'slash_3');advance(w,durations[2]);
 assert.equal(e.hp,1000-[.55,.65,.9].reduce((s,n)=>s+Math.floor(damage*n),0));assert.equal(w.warriorCombo,null);advance(w,2);assert.ok(warriorAction(w));assert.equal(w.warriorAction.stage,0);
});
test('janela expira e reinicia no primeiro; clique na recuperação reserva apenas um próximo corte',()=>{
 const w=field();warriorAction(w);advance(w,.1);assert.equal(warriorAction(w),false);advance(w,.3);assert.ok(warriorAction(w));assert.equal(warriorAction(w),false);
 advance(w,.2);assert.equal(w.warriorAction.stage,1);advance(w,durations[1]);assert.equal(w.warriorAction,null);assert.equal(w.warriorCombo.next,2);
 advance(w,COMBO_WINDOW+.01);warriorAction(w);assert.equal(w.warriorAction.stage,0);
 const v=field();warriorAction(v);advance(v,durations[0]);advance(v,COMBO_WINDOW-.01);warriorAction(v);assert.equal(v.warriorAction.stage,1);
});
test('pausa congela a janela; esquiva, outra habilidade, morte e reset encerram o combo',()=>{
 const w=field();warriorAction(w);advance(w,durations[0]);w.paused=true;advance(w,3);assert.equal(w.warriorCombo.next,1);w.paused=false;assert.ok(warriorAction(w));assert.equal(w.warriorAction.stage,1);
 const v=field();warriorAction(v);advance(v,durations[0]);assert.ok(warriorAction(v,2));assert.equal(v.warriorCombo,null);
 const d=field();warriorAction(d);advance(d,.2);warriorAction(d);assert.ok(dash(d));assert.equal(d.warriorAction,null);assert.equal(d.warriorCombo,null);resetWorld(w,{horde:0,character:{classId:'warrior'}});assert.equal(w.warriorCombo,null);
 const a=field();warriorAction(a);advance(a,.2);a.player.hp=0;advance(a,1);assert.equal(a.warriorAction,null);assert.equal(a.warriorCombo,null);
});
test('buffer respeita o instante de conclusão mesmo em um passo longo',()=>{const w=field(),e=enemy(w,2);warriorAction(w);advance(w,.4);warriorAction(w);advance(w,1);assert.equal(w.warriorAction,null);assert.equal(e.hp,1000-Math.floor(w.player.damage*.55)-Math.floor(w.player.damage*.65));});
test('arco e paredes impedem acertos; estocada para antes do obstáculo',()=>{const w=field(),behind=enemy(w,-2),front=enemy(w,4);w.arena.solids=[{kind:'box',x:2,y:0,width:1,depth:6}];assert.ok(warriorAction(w,1));tickWarrior(w,.8);assert.ok(w.player.x<1.1);assert.equal(front.hp,1000);assert.equal(behind.hp,1000);});
test('estocada atinge com a ponta e escudo empurra com custo único',()=>{const w=field(),e=enemy(w,7);w.aim={x:7,y:0};const mp=w.player.mp;assert.ok(warriorAction(w,1));assert.equal(w.player.mp,mp-20);assert.equal(warriorAction(w,1),false);tickWarrior(w,.8);assert.ok(e.hp<1000);assert.ok(Math.abs(e.x-w.player.x-2.2)<1e-6);const v=field(),f=enemy(v,1);warriorAction(v,2);tickWarrior(v,.8);assert.ok(f.x>1);});
test('passivas não acumulam em recálculos e não curam; saves antigos e classe persistem',()=>{const w=field();w.player.hp=w.player.maxHp/2;w.warriorRanks={strength:1,vitality:1,armor:1};w.level=3;applyAttributes(w);const a={hp:w.player.hp,max:w.player.maxHp,damage:w.player.damage,def:w.player.defense};applyAttributes(w);assert.deepEqual({hp:w.player.hp,max:w.player.maxHp,damage:w.player.damage,def:w.player.defense},a);assert.ok(w.player.hp<=w.player.maxHp/2+1);assert.equal(freshSave().character.classId,'necromancer');const value=freshSave();value.character.classId='warrior';value.character.level=3;value.character.warriorRanks={strength:1,vitality:1,armor:1};assert.deepEqual(normalizeSave(value).character.warriorRanks,normalizeWarrior(value.character.warriorRanks));});

test('estocada cobre o trajeto e a ponta com largura maior, uma vez por alvo',()=>{
 const w=field(),crossed=enemy(w,1,.7),tip=enemy(w,8,.8),outside=enemy(w,4,1.3),behind=enemy(w,-2);
 assert.ok(warriorAction(w,1));advance(w,THRUST_TIMING.impact-.01);
 assert.equal(crossed.hp,1000);assert.equal(tip.hp,1000);advance(w,.01);
 const hit=1000-Math.floor(w.player.damage*2.2);
 assert.equal(crossed.hp,hit);assert.equal(tip.hp,hit);assert.equal(outside.hp,1000);assert.equal(behind.hp,1000);
 assert.equal(warriorPose(w).progress,1);assert.ok(w.warriorAction);advance(w,THRUST_TIMING.recovery+.01);
 assert.equal(w.warriorAction,null);assert.equal(crossed.hp,hit);assert.equal(tip.hp,hit);
});
