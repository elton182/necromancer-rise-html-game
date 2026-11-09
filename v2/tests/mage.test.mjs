import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,normalizeSave,createSaveStore,CLASS_IDS} from '../scripts/save-model.mjs';
import {createWorld,step} from '../scripts/training-model.mjs';
import {snapshotFor} from '../scripts/progression.mjs';
import {beginDash} from '../scripts/combat.mjs';
import {classInfo,isMarksman,isMartial} from '../scripts/class-registry.mjs';
import {gearCatalog} from '../scripts/class-gear.mjs';
import SharedEQ from '../scripts/shared-equipment.mjs';
import {MARKSMAN_NODES,MARKSMAN_ACTIONS,marksmanRanks,marksmanSpent,marksmanBudget,canLearnMarksman,actionDamage,actionCooldown,MAGE} from '../scripts/marksman-model.mjs';
import {marksmanAction,tickMarksman,clearMarksman} from '../scripts/marksman.mjs';
import {classPreview} from '../scripts/journey-model.mjs';

const A=MARKSMAN_ACTIONS.mage;
function field(ranks={},level=20){
 const w=createWorld({horde:0,character:{classId:'mage',level,equipment:{},marksmanRanks:marksmanRanks('mage',ranks,level)}});
 w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.random=()=>.5;
 w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};w.player.mp=w.player.maxMp;
 return w;
}
function target(w,x,y=0,extra={}){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:10000,maxHp:10000,animation:'idle',animationTime:0,timer:0,...extra};w.actors.push(e);return e;}
function advance(w,dt=1/60,steps=1){for(let i=0;i<steps;i++){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);w.dash.remaining=Math.max(0,w.dash.remaining-dt);tickMarksman(w,dt);}}
const lost=e=>10000-e.hp,dmg=(w,i)=>actionDamage(A[i],w.player.spellDamage,w.marksmanRanks);

test('Mago: classe registrada, catálogo arcano, sem horda, modelo próprio e dano mágico',()=>{
 assert.deepEqual(CLASS_IDS,['necromancer','warrior','druid','archer','mercenary','mage']);
 assert.ok(isMarksman('mage'));assert.equal(isMartial('mage'),false);assert.equal(gearCatalog('mage'),SharedEQ);
 assert.equal(classInfo('mage').model,'mageHero');assert.equal(classInfo('mage').resource,'mana');
 const store=createSaveStore(new class{v=new Map();getItem(k){return this.v.get(k)??null;}setItem(k,v){this.v.set(k,v);}removeItem(k){this.v.delete(k);}}());
 const c=store.createCharacter('Merlin','mage');assert.ok(c.ok);assert.deepEqual(c.save.character.equipment,{});assert.equal(c.save.character.marksmanEquipmentVersion,undefined);
 const w=createWorld({horde:6,character:{classId:'mage',level:5,equipment:{}}});
 assert.equal(w.player.model,'mageHero');assert.equal(w.actors.filter(a=>a.team==='ally').length,0);
 assert.ok(w.player.spellDamage>0);const a=snapshotFor(w).attributes;assert.equal(a.hordeDps,0);
 const staff=SharedEQ.generate(5,null,()=>.5,'staff');
 const armed=snapshotFor({...w,equipment:{staff}},{staff},5).attributes;assert.ok(armed.spell>a.spell,'o cajado aumenta o dano mágico');
 assert.equal(classPreview('mage').model,'mageHero');assert.deepEqual(classPreview('mage').companions,[]);
});

test('árvore do Mago: orçamento, pré-requisitos e passivas',()=>{
 const full=Object.fromEntries(Object.entries(MARKSMAN_NODES.mage).map(([id,n])=>[id,n.max]));
 assert.equal(marksmanSpent('mage',marksmanRanks('mage',full,60)),Object.values(MARKSMAN_NODES.mage).reduce((s,n)=>s+n.max,0));
 assert.equal(marksmanSpent('mage',marksmanRanks('mage',full,2)),marksmanBudget(2));
 assert.equal(canLearnMarksman('mage',marksmanRanks('mage',{},6),'meteor',6),false,'Meteoro requer Bola de Fogo');
 assert.ok(canLearnMarksman('mage',marksmanRanks('mage',{fireball:1},6),'meteor',6));
 const base=snapshotFor(field({})).attributes,boosted=snapshotFor(field({intellect:5,vitality:5,wisdom:5,meditation:5,regeneration:5})).attributes;
 assert.ok(Math.abs(boosted.spell-base.spell*1.4)<1e-6);assert.equal(boosted.hp,Math.round(base.hp*1.5));assert.ok(Math.abs(boosted.regen-base.regen*1.75)<1e-9);
 const raw=freshSave();raw.character.classId='mage';raw.character.level=6;raw.character.marksmanRanks={fireball:1,meteor:1,frost:1};
 assert.deepEqual(['fireball','meteor','frost'].map(k=>normalizeSave(raw).character.marksmanRanks[k]),[1,1,1]);
});

test('Seta Arcana: projétil com dano mágico, anda enquanto conjura',()=>{
 const w=field({}),e=target(w,6);w.player.moveSpeed=6;
 assert.ok(marksmanAction(w,0));const x=w.player.x,y=w.player.y;step(w,.1,{x:1,y:0});
 assert.ok(Math.hypot(w.player.x-x,w.player.y-y)>.4,'anda');assert.equal(w.player.pose.upper,true);assert.equal(w.player.pose.anim,'cast');
 advance(w,1/60,60);assert.equal(lost(e),dmg(w,0));
});

test('Bola de Fogo: explode no contato, na parede ou no fim do alcance; Combustão deixa o chão em chamas',()=>{
 const w=field({fireball:1}),a=target(w,5),b=target(w,5,1.6),far=target(w,5,4);
 assert.ok(marksmanAction(w,1));advance(w,1/60,80);
 assert.equal(lost(a),dmg(w,1));assert.equal(lost(b),dmg(w,1),'na área de 2,2');assert.equal(lost(far),0);
 const end=field({fireball:1}),c=target(end,12.5,1);end.aim={x:20,y:0};marksmanAction(end,1);advance(end,1/60,120);assert.equal(lost(c),dmg(end,1),'explode no fim do alcance');
 const fire=field({fireball:1,combustion:3}),d=target(fire,4);marksmanAction(fire,1);advance(fire,1/60,40);
 assert.ok(fire.marksmanZones.some(z=>z.kind==='fire'));advance(fire,1/60,200);
 assert.ok(lost(d)>dmg(fire,1),'queima depois da explosão');assert.equal(fire.marksmanZones.length,0);
});

test('Rajada de Gelo: cone de 70°, dano e lentidão; Estilhaçar aumenta fogo e arcano nos lentos',()=>{
 const w=field({frost:1,shatter:3}),inside=target(w,4,1),behind=target(w,-3,0),side=target(w,1,5);
 assert.ok(marksmanAction(w,2));advance(w,1/60,40);
 assert.equal(lost(inside),dmg(w,2));assert.equal(lost(behind),0);assert.equal(lost(side),0,'fora do cone');
 assert.equal(inside.slow,.4);assert.ok(inside.frostUntil>w.time);assert.ok(w.effects.some(f=>String(f.id).startsWith('mfrost-')),'anel de gelo');
 w.actors=[w.player,inside];Object.assign(inside,{x:6,y:0});w.marksmanCooldowns={};const before=lost(inside);
 marksmanAction(w,0);advance(w,1/60,60);assert.equal(lost(inside)-before,Math.round(dmg(w,0)*(1+3*MAGE.shatter)));
});

test('Teleporte: salta até 7 u sem atravessar paredes, eco fere quem ficou; recarga cai por ponto',()=>{
 const w=field({blink:3,echo:2}),e=target(w,1,0);w.aim={x:20,y:0};
 assert.ok(marksmanAction(w,4));advance(w,1/60,30);
 assert.ok(Math.abs(w.player.x-7)<1e-6);assert.equal(lost(e),dmg(w,4));assert.equal(dmg(w,4),Math.floor(w.player.spellDamage*.5*1.5));
 assert.equal(actionCooldown(A[4],w.marksmanRanks,0),5);
 const wall=field({blink:1});wall.arena.solids=[{kind:'box',x:3,y:0,width:.6,depth:4}];wall.aim={x:20,y:0};marksmanAction(wall,4);advance(wall,1/60,30);assert.ok(wall.player.x<3);
 const near=field({blink:1});near.aim={x:2,y:0};marksmanAction(near,4);advance(near,1/60,30);assert.ok(Math.abs(near.player.x-2)<1e-6,'para no ponto mirado');
});

test('Meteoro: área marcada, bola de fogo caindo, 320% depois de 1 s e chão em chamas por 3 s',()=>{
 const w=field({fireball:1,meteor:1}),inside=target(w,8,1),out=target(w,8,4.5);
 assert.ok(marksmanAction(w,5));advance(w,1/60,Math.ceil(A[5].release*60)+1);
 const fall=w.effects.find(f=>f.fx==='meteor');assert.ok(fall,'bola de fogo caindo');assert.equal(fall.duration,A[5].delay);assert.deepEqual([fall.x,fall.y],[8,0]);
 advance(w,1/60,Math.ceil(A[5].delay*60)-6);
 assert.equal(lost(inside),0);assert.ok(w.effects.some(f=>f.marksmanRing));
 advance(w,1/60,10);assert.equal(lost(inside),dmg(w,5));assert.equal(lost(out),0);
 assert.ok(w.effects.some(f=>f.fx==='groundBreak'));
 assert.equal(w.marksmanZones.length,1);assert.equal(w.marksmanZones[0].kind,'fire');assert.ok(w.effects.some(f=>f.fx==='fireField'),'chão queimando visível');
 const B=A[5].burn,pulse=Math.max(1,Math.floor(w.player.spellDamage*B.multiplier));
 advance(w,1/60,Math.ceil(B.time*60)+5);assert.equal(lost(inside),dmg(w,5)+pulse*B.time/B.interval);assert.equal(lost(out),0);assert.equal(w.marksmanZones.length,0);
});

test('esquiva cancela; troca de cena limpa projéteis e chamas',()=>{
 const w=field({fireball:1,combustion:1});marksmanAction(w,1);advance(w,1/60,5);assert.ok(beginDash(w,{x:1,y:0}));assert.equal(w.marksmanAction,null);
 advance(w,1/60,60);assert.equal(w.marksmanShots.length,0);
 w.marksmanCooldowns={};w.dash.cooldown=0;target(w,4);marksmanAction(w,1);advance(w,1/60,30);clearMarksman(w);
 assert.deepEqual([w.marksmanShots.length,w.marksmanZones.length],[0,0]);
});
