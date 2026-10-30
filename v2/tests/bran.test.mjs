import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,snapshot} from '../scripts/session.mjs';
import {normalizeSave} from '../scripts/save-model.mjs';
import {forge,forgePrice,rerollPrice,equip} from '../scripts/gear.mjs';
import EQ from '../scripts/shared-equipment.mjs';
import Build from '../scripts/shared-build.mjs';
const setup=()=>{const s=createSession();s.scene='village';s.save.character.gold=100000;s.world.random=()=>.5;const i=EQ.generate(10,Build,()=>.5,'body',true,'bran-test');s.save.character.gearBag.push(i);return [s,i];};
test('Bran: limite, custo, persistência e bônus sem acumulação',()=>{
 const [s,i]=setup(),base=i.base.value,affixes=structuredClone(i.affixes),gold=s.save.character.gold;let cost=0;
 for(let n=1;n<=5;n++){cost+=forgePrice(i);assert.equal(forge(s,i.id).ok,true);assert.equal(i.enhancement,n);assert.equal(EQ.bonuses({equipment:{body:i}}).hp,base*(1+.25*n)+(i.affixes.find(a=>a.stat==='hp')?.value||0));assert.equal(EQ.baseDefense(i),Math.round(10*(1+(i.level-1)*.12)*(1+.25*n)*100)/100);}
 assert.equal(s.save.character.gold,gold-cost);assert.equal(forge(s,i.id).ok,false);assert.equal(i.base.value,base);assert.deepEqual(i.affixes,affixes);
 assert.equal(EQ.bonuses({equipment:{body:i}}).hp,(base*2.25)+(i.affixes.find(a=>a.stat==='hp')?.value||0));
 assert.equal(normalizeSave(snapshot(s)).character.gearBag[0].enhancement,5);
});
test('Bran: rolagem altera só um afixo, não repete atributos e persiste',()=>{
 const [s,i]=setup(),old=structuredClone(i),gold=s.save.character.gold,cost=rerollPrice(i);
 assert.equal(forge(s,i.id,0).ok,true);assert.notEqual(i.affixes[0].stat,old.affixes[0].stat);assert.deepEqual(i.affixes.slice(1),old.affixes.slice(1));assert.deepEqual(i.base,old.base);assert.equal(s.save.character.gold,gold-cost);assert.equal(new Set(i.affixes.map(a=>a.stat)).size,i.affixes.length);assert.ok(EQ.validate(i,Build));assert.deepEqual(normalizeSave(snapshot(s)).character.gearBag[0].affixes,i.affixes);
});
test('Bran recusa combate, ouro insuficiente e índice inválido sem mutar',()=>{
 const [s,i]=setup();for(const scene of ['training','dead','menu']){s.scene=scene;const before=JSON.stringify(s.save.character);assert.equal(forge(s,i.id).ok,false);assert.equal(JSON.stringify(s.save.character),before);}
 s.scene='village';s.save.character.gold=0;const before=JSON.stringify(i);assert.equal(forge(s,i.id).ok,false);assert.equal(forge(s,i.id,-1).ok,false);assert.equal(JSON.stringify(i),before);
});

test('Bran melhora todos os slots e atualiza equipado preservando vida proporcional',()=>{
 for(const type of Object.keys(EQ.slots)){
  const s=createSession();s.scene='village';s.save.character.gold=100000;
  const i=EQ.generate(1,Build,()=>0,type,false,'forge-'+type);s.save.character.gearBag.push(i);
  assert.equal(equip(s,i.id,type).ok,true);const p=s.world.player;p.hp=p.maxHp/2;p.mp=p.maxMp/2;const before=EQ.bonuses({equipment:s.save.character.equipment});
  assert.equal(forge(s,i.id).ok,true);const after=EQ.bonuses({equipment:s.save.character.equipment});assert.ok(after[i.base.stat]>before[i.base.stat]);assert.ok(Math.abs(p.hp/p.maxHp-.5)<.01);assert.ok(Math.abs(p.mp/p.maxMp-.5)<.01);assert.equal(normalizeSave(snapshot(s)).character.equipment[type].enhancement,1);
 }
});
