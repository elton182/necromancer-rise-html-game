import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,normalizeSave,createSaveStore} from '../scripts/save-model.mjs';
import {createSession,transition,stepSession} from '../scripts/session.mjs';
import {equip,unequip,sell,buy,forge,gearName} from '../scripts/gear.mjs';
import {gearCatalog} from '../scripts/class-gear.mjs';
import {marksmanGear,MARKSMAN_WEAPONS,starterWeapon,weaponType} from '../scripts/marksman-equipment.mjs';
import {marksmanAttributes,marksmanRanks} from '../scripts/marksman-model.mjs';
import {marksmanAction,falconCommand} from '../scripts/marksman.mjs';
import {createSoundObserver} from '../scripts/sound-events.mjs';
import WarriorGear from '../scripts/warrior-equipment.mjs';
import SharedEQ from '../scripts/shared-equipment.mjs';

class MapStorage{values=new Map();getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,v);}removeItem(k){this.values.delete(k);}}
let seed=7;const random=()=>((seed=(seed*9301+49297)%233280)/233280);

test('cada classe tem a arma própria: Arco para a Arqueira, Besta para o Mercenário',()=>{
 assert.equal(weaponType('archer'),'bow');assert.equal(weaponType('mercenary'),'crossbow');
 const A=marksmanGear('archer'),M=marksmanGear('mercenary');
 assert.equal(gearCatalog('archer'),A);assert.equal(gearCatalog('mercenary'),M);
 assert.deepEqual(Object.keys(A.slots),['bow','body','head','boots','ring1','ring2']);assert.deepEqual(Object.keys(M.slots),['crossbow','body','head','boots','ring1','ring2']);
 for(const [id,C] of [['archer',A],['mercenary',M]]){
  const w=C.generate(8,null,random,weaponType(id),false,'w-'+id);
  assert.equal(w.classId,id);assert.equal(w.base.stat,'damageFlat');assert.ok(w.affixes.every(a=>MARKSMAN_WEAPONS[id].pool.includes(a.stat)));
  assert.ok(C.allowed(w));assert.deepEqual(C.validate(w),w);
  assert.ok(gearName(w).startsWith(id==='archer'?'Arco':'Besta'));
 }
 const bow=A.generate(5,null,random,'bow');
 assert.equal(M.allowed(bow),false,'Besta e Arco não se cruzam');assert.equal(M.validate(bow),null);
 assert.equal(WarriorGear.validate(bow),null,'o Guerreiro descarta o arco');assert.equal(SharedEQ.validate(bow),null);
 assert.equal(A.validate({...bow,base:{stat:'damageFlat',value:9999}}),null,'valor impossível');
 const types=new Set();for(let i=0;i<200;i++)types.add(A.generate(5,null,random).type);assert.ok(types.has('bow')&&types.has('body'));assert.equal(types.has('sword'),false);
});

test('a arma soma dano-base e afixos ao dano físico; aprimoramento conta',()=>{
 const A=marksmanGear('archer'),bow=A.generate(10,null,()=>.5,'bow',false,'b1');
 const bare=marksmanAttributes('archer',10,{}),armed=marksmanAttributes('archer',10,{bow});
 const pct=bow.affixes.find(a=>a.stat==='damagePercent')?.value||0;
 assert.ok(Math.abs(armed.damage-(bare.damage+bow.base.value)*(1+pct/100))<1e-9);
 const forged={...bow,enhancement:2};assert.ok(marksmanAttributes('archer',10,{bow:forged}).damage>armed.damage);
 const M=marksmanGear('mercenary'),cb=M.generate(10,null,()=>.9,'crossbow',false,'c1');
 assert.ok(marksmanAttributes('mercenary',10,{crossbow:cb}).damage>marksmanAttributes('mercenary',10,{}).damage);
 assert.equal(marksmanAttributes('mercenary',10,{bow}).damage,marksmanAttributes('mercenary',10,{}).damage,'arco não vale para o Mercenário');
});

test('arma inicial no Novo Jogo e entrega única para saves anteriores da classe',()=>{
 const store=createSaveStore(new MapStorage());
 for(const id of ['archer','mercenary']){const c=store.createCharacter('T'+id,id);assert.ok(c.ok);const w=c.save.character.equipment[weaponType(id)];assert.equal(w.classId,id);assert.equal(w.level,1);}
 const raw=freshSave();raw.character.classId='archer';raw.character.slotId='slot-x';
 const once=normalizeSave(raw);assert.equal(once.character.equipment.bow.id,'starter-bow-slot-x');assert.equal(once.character.marksmanEquipmentVersion,1);
 delete once.character.equipment.bow;
 const again=normalizeSave(JSON.parse(JSON.stringify(once)));assert.equal(again.character.equipment.bow,undefined,'vendida ou guardada, não volta');
 const warrior=freshSave();warrior.character.classId='warrior';assert.equal(normalizeSave(warrior).character.marksmanEquipmentVersion,undefined);
});

test('mochila: equipar, guardar, vender, comprar e forjar o arco',()=>{
 const raw=freshSave();raw.character.classId='archer';raw.character.gold=100000;const s=createSession(raw);
 const starter=s.save.character.equipment.bow;assert.ok(starter);
 const extra=marksmanGear('archer').generate(4,null,random,'bow',false,'eq-extra',{loot:{weights:{common:0,magic:0,rare:1,epic:0}}});assert.equal(extra.rarity,'rare');s.save.character.gearBag.push(extra);
 assert.ok(equip(s,'eq-extra','bow').ok);assert.equal(s.save.character.equipment.bow.id,'eq-extra');assert.ok(s.save.character.gearBag.some(i=>i.id===starter.id));
 const sword=WarriorGear.generate(4,null,random,'sword',false,'eq-sword');s.save.character.gearBag.push(sword);assert.equal(equip(s,'eq-sword','bow').ok,false);
 assert.ok(unequip(s,'bow').ok);
 s.scene='village';assert.ok(buy(s,'bow').ok);assert.equal(s.save.character.gearBag.at(-1).type,'bow');
 assert.ok(forge(s,'eq-extra').ok);assert.equal(s.save.character.gearBag.find(i=>i.id==='eq-extra').enhancement,1);
 assert.ok(forge(s,'eq-extra',0).ok,'rerrolar afixo usa a lista do arco');
 s.scene='menu';assert.ok(sell(s,starter.id).ok);
 assert.equal(buy(s,'sword').ok,false);
});

test('sons próprios: corda, besta, arremesso, explosão, mina, fogo e falcão; sem o som do Tiro de Osso',()=>{
 const sounds=(classId,ranks,act)=>{
  const raw=freshSave();raw.character.classId=classId;raw.character.level=20;raw.character.marksmanRanks=ranks;
  const s=createSession(raw);transition(s,'training');const w=s.world;w.actors=w.actors.filter(a=>a===w.player);
  Object.assign(w.player,{x:0,y:0});w.player.mp=w.player.maxMp;w.aim={x:0,y:-6};
  w.actors.push({id:w.nextId++,team:'enemy',dummy:true,x:0,y:-6,radius:.3,hp:1e6,maxHp:1e6,animation:'idle',animationTime:0,timer:0});
  const ob=createSoundObserver();ob.observe(s);const out=[];act(w);for(let i=0;i<200;i++){stepSession(s,1/60,{});out.push(...ob.observe(s));}return out;
 };
 const archer=sounds('archer',{shot:1},w=>marksmanAction(w,0));assert.ok(archer.includes('bowShot'));assert.equal(archer.includes('raio'),false);
 const merc=sounds('mercenary',{bomb:1},w=>marksmanAction(w,0));assert.ok(merc.includes('crossbowShot'));
 const bomb=sounds('mercenary',{bomb:1},w=>marksmanAction(w,2));assert.ok(bomb.includes('bombThrow'));assert.ok(bomb.includes('powderBlast'));
 const mine=sounds('mercenary',{bomb:1,mine:1},w=>{w.aim={x:0,y:6};marksmanAction(w,4);});assert.ok(mine.includes('mineArm'));
 const fire=sounds('mercenary',{bomb:1,firebomb:1},w=>marksmanAction(w,5));assert.ok(fire.includes('fireIgnite'));
 const falcon=sounds('archer',{falcon:1},w=>{});assert.ok(falcon.includes('windCut'),'mergulho do falcão');
 const raw=freshSave();raw.character.classId='archer';raw.character.level=4;raw.character.marksmanRanks=marksmanRanks('archer',{falcon:1},4);
 const s=createSession(raw);transition(s,'training');const w=s.world;w.actors=w.actors.filter(a=>a===w.player);Object.assign(w.player,{x:0,y:0});w.player.mp=w.player.maxMp;
 w.actors.push({id:w.nextId++,team:'enemy',dummy:true,x:0,y:-12,radius:.3,hp:1e6,maxHp:1e6,animation:'idle',animationTime:0,timer:0});w.aim={x:0,y:-12};
 const ob=createSoundObserver();ob.observe(s);stepSession(s,1/60,{});assert.ok(falconCommand(w));const out=[];for(let i=0;i<5;i++){stepSession(s,1/60,{});out.push(...ob.observe(s));}
 assert.ok(out.includes('falconCry'));
});
