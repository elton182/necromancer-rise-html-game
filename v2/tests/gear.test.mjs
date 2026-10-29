import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,transition,stepSession,snapshot,applySave,updateSettings,useProfile} from '../scripts/session.mjs';
import {FORMAT,VERSION,importSave,normalizeSave} from '../scripts/save-model.mjs';
import {dealDamage,castBolt} from '../scripts/combat.mjs';
import {TEST_PROFILE,members} from '../scripts/horde.mjs';
import {tickDrops,spawnDrop,lootAllowed} from '../scripts/drops.mjs';
import {equip,unequip,discard,discardAll,sell,buy,collectAll,CAPACITY} from '../scripts/gear.mjs';
import {CATALOG,normalizeInventory,buyConsumable,useConsumable} from '../scripts/consumables.mjs';
import EQ from '../scripts/shared-equipment.mjs';
import Build from '../scripts/shared-build.mjs';
let serial=0;
// Peças fixas e válidas segundo o modelo compartilhado; a validação garante que os testes não inventam formatos.
const BASE={staff:12,grimoire:4,body:12,head:8,boots:.05,ring1:.4,ring2:.4};
function piece(type,rarity='common',base=BASE[type],affixes=[],level=1){const stat=EQ.slots[type].base,item={version:2,id:'t-'+type+'-'+(++serial),type,level,originWave:level,rarity,base:{stat,value:base},affixes};assert.ok(EQ.validate(item,Build),JSON.stringify(item));return item;}
const staff=(spell=0)=>piece('staff',spell?'magic':'common',12,spell?[{stat:'spell',value:spell},{stat:'cooldown',value:1}]:[]);
function fresh(options={}){const s=createSession(normalizeSave({format:FORMAT,version:VERSION,...options}));return s;}
function give(s,...items){s.save.character.gearBag.push(...items);return items;}
const foe=w=>w.actors.find(a=>a.team==='enemy'&&a!==w.boss&&!a.dead);
test('equipar e desequipar movem a peça sem duplicar e respeitam tipo, anéis e mochila cheia',()=>{
 const s=fresh(),c=s.save.character,[a,b,r1,r2]=give(s,staff(),staff(5),piece('ring1'),piece('ring2'));
 assert.equal(equip(s,a.id,'body').ok,false);assert.equal(equip(s,'inexistente','staff').ok,false);
 assert.equal(equip(s,a.id,'staff').ok,true);assert.deepEqual([c.equipment.staff.id,c.gearBag.length],[a.id,3]);
 assert.equal(equip(s,b.id,'staff').ok,true);assert.deepEqual(c.gearBag.map(i=>i.id).sort(),[a.id,r1.id,r2.id].sort());assert.equal(c.equipment.staff.id,b.id);
 assert.equal(equip(s,r1.id,'ring2').ok,true);assert.equal(equip(s,r2.id,'ring1').ok,true);assert.deepEqual([c.equipment.ring1.id,c.equipment.ring2.id],[r2.id,r1.id]);
 assert.equal(new Set([...Object.values(c.equipment),...c.gearBag].map(i=>i.id)).size,4);
 c.gearBag.length=0;c.gearBag.push(...Array.from({length:CAPACITY},()=>staff()));assert.equal(unequip(s,'staff').ok,false);assert.equal(c.equipment.staff.id,b.id);
 c.gearBag.pop();assert.equal(unequip(s,'staff').ok,true);assert.equal(c.equipment.staff,undefined);assert.equal(unequip(s,'staff').ok,false);
});
test('atributos seguem as fórmulas documentadas com itens e preservam proporção sem curar',()=>{
 const s=fresh({character:{level:12}});transition(s,'training');const w=s.world,p=w.player;
 const [weapon,robe,boots]=give(s,piece('staff','magic',12,[{stat:'spell',value:5},{stat:'cooldown',value:1}]),piece('body','magic',12,[{stat:'defense',value:10},{stat:'mp',value:8}]),piece('boots','common',.05));
 p.hp=Math.floor(p.maxHp/2);p.mp=Math.floor(p.maxMp/4);const ratio=[p.hp/p.maxHp,p.mp/p.maxMp];
 assert.equal(equip(s,weapon.id,'staff').ok,true);assert.equal(p.spellDamage,Math.round((40+4*11+12)*1.05));assert.equal(w.modifiers.gearCooldown,1);
 assert.equal(equip(s,robe.id,'body').ok,true);assert.equal(p.defense,10);assert.equal(p.maxHp,210+12);assert.equal(p.maxMp,135+8);
 assert.equal(equip(s,boots.id,'boots').ok,true);assert.equal(p.moveSpeed,4.05);
 assert.ok(Math.abs(p.hp/p.maxHp-ratio[0])<.02);assert.ok(Math.abs(p.mp/p.maxMp-ratio[1])<.02);
 const before=[p.hp,p.mp],cooldown=w.castCooldown;assert.equal(unequip(s,'body').ok,true);assert.equal(p.defense,0);assert.ok(p.hp<=before[0]);assert.equal(w.castCooldown,cooldown);
 const mean=snapshot(s).character.equipment;assert.deepEqual(Object.keys(mean).sort(),['boots','staff']);
});
test('defesa de itens entra no caminho comum de dano e recargas respeitam o piso do tiro',()=>{
 const s=fresh();const [robe]=give(s,piece('body','magic',12,[{stat:'defense',value:10},{stat:'cooldown',value:1}]));equip(s,robe.id,'body');transition(s,'training');const w=s.world;
 const enemy={level:1},before=w.player.hp;dealDamage(w,w.player,100,enemy);assert.equal(Math.round(before-w.player.hp),Math.round(100*(1-EQ.defenseReduction(10,1))));
 w.modifiers.gearCooldown=50;w.aim={x:0,y:0};assert.equal(castBolt(w),true);assert.equal(w.castCooldown,.25);
});
test('itens de horda alteram atributos dos aliados sem curar e deixam a vida proporcional',()=>{
 const s=createSession();useProfile(s,TEST_PROFILE);s.world.army.loadout[1]='zombie';transition(s,'menu');transition(s,'training');
 const z=members(s.world,'zombie')[0],[book]=give(s,piece('grimoire','magic',4,[{stat:'horde',value:4},{stat:'hordeHp',value:12}]));z.hp=Math.floor(z.maxHp/2);const ratio=z.hp/z.maxHp,hp=z.maxHp,dmg=z.dmg;
 assert.equal(equip(s,book.id,'grimoire').ok,true);assert.ok(z.maxHp>hp);assert.ok(z.dmg>dmg);assert.ok(Math.abs(z.hp/z.maxHp-ratio)<.02);
 const stats=[z.maxHp,z.baseDmg,z.dmg];for(let i=0;i<5;i++)equip(s,book.id,'grimoire');assert.deepEqual([z.maxHp,z.baseDmg,z.dmg],stats);
 assert.equal(unequip(s,'grimoire').ok,true);assert.equal(z.maxHp,hp);
});
test('pontos de habilidade dos itens reforçam apenas nós investidos e não liberam pré-requisitos',()=>{
 const s=createSession();useProfile(s,TEST_PROFILE);const ranks=s.world.army.profile.ranks,node=Build.nodes.find(n=>n.max>1&&ranks[n.id]&&Object.keys(n.effects).length&&!(Build.directSynergies?.[n.id]||[]).length);assert.ok(node);
 const item={...piece('staff','magic',15,[{stat:'skill',value:1,target:node.id},{stat:'cooldown',value:1}],4)};assert.ok(EQ.validate(item,Build));
 const base=EQ.effects(Build,ranks,{}).effects,withGear=EQ.effects(Build,ranks,{staff:item}).effects,key=Object.keys(node.effects)[0];
 assert.ok(Math.abs((withGear[key]-base[key])-node.effects[key])<1e-9);
 const empty={...ranks};delete empty[node.id];assert.deepEqual(EQ.effects(Build,empty,{staff:item}).effects,EQ.effects(Build,empty,{}).effects);
});
test('drops: chefe sempre deixa peça mágica ou melhor; comum segue a chance e o nível configurado',()=>{
 const s=fresh({settings:{gearLevel:5}});transition(s,'training');const w=s.world;
 const seq=a=>{let i=0;w.random=()=>a[i++%a.length];};
 seq([.99]);w.onEnemyDeath({xp:12,x:2,y:2},w.player);assert.equal(w.drops.filter(d=>d.kind==='equipment').length,0);
 w.drops=[];seq([.99,.15,.5]);w.onEnemyDeath({xp:12,x:2,y:2},w.player);
 const common=w.drops.find(d=>d.kind==='equipment');assert.ok(common);assert.ok(EQ.validate(common.item,Build));assert.deepEqual([common.item.level,common.upgrade],[5,false]);
 w.drops=[];seq([.99]);dealDamage(w,w.boss,1e9,w.player);const boss=w.drops.find(d=>d.kind==='equipment');assert.ok(boss);assert.notEqual(boss.item.rarity,'common');assert.ok(EQ.validate(boss.item,Build));
 assert.equal(w.drops.filter(d=>d.kind==='equipment').length,1);
});
test('recuperação de nível eleva parte dos drops quando o equipamento está atrasado',()=>{
 const s=fresh({settings:{gearLevel:20}});transition(s,'training');const w=s.world;w.random=()=>.0;w.onEnemyDeath({xp:12,x:2,y:2},w.player);
 const drop=w.drops.find(d=>d.kind==='equipment');assert.equal(drop.upgrade,true);assert.ok(drop.item.level>20);
 for(const slot of Object.keys(EQ.slots))w.equipment[slot]={level:30};w.drops=[];w.onEnemyDeath({xp:12,x:2,y:2},w.player);assert.equal(w.drops.find(d=>d.kind==='equipment').upgrade,false);
});
test('coleta: filtro oculta e preserva no chão, mochila cheia recusa com aviso único e nada duplica',()=>{
 const s=fresh();transition(s,'training');const w=s.world,c=s.save.character,p=w.player,common=piece('staff'),rare=piece('body','rare',12,[{stat:'hp',value:12},{stat:'mp',value:8},{stat:'defense',value:10}]);
 w.lootFilter='rare';const a=spawnDrop(w,'equipment',p.x,p.y,{item:common}),b=spawnDrop(w,'equipment',p.x,p.y,{item:rare});assert.equal(lootAllowed(a,w.lootFilter),false);
 tickDrops(w,.1);assert.deepEqual(c.gearBag.map(i=>i.id),[rare.id]);assert.deepEqual(w.drops.map(d=>d.id),[a.id]);
 w.lootFilter='common';tickDrops(w,.1);assert.equal(c.gearBag.length,2);assert.equal(w.drops.length,0);
 c.gearBag.length=0;c.gearBag.push(...Array.from({length:CAPACITY},()=>staff()));spawnDrop(w,'equipment',p.x,p.y,{item:piece('head')});tickDrops(w,.1);tickDrops(w,.1);assert.equal(w.drops.length,1);assert.equal(c.gearBag.length,CAPACITY);assert.equal(w.feed.filter(m=>m.text.startsWith('Mochila cheia')).length,1);
 c.gearBag.pop();tickDrops(w,.1);assert.equal(w.drops.length,0);assert.equal(c.gearBag.length,CAPACITY);
});
test('sair do encontro coleta o permitido; morrer e carregar não levam peças do chão',()=>{
 const s=fresh();transition(s,'training');let w=s.world;spawnDrop(w,'equipment',20,20,{item:piece('staff')});s.save.settings.lootFilter='common';
 transition(s,'menu');assert.equal(s.save.character.gearBag.length,1);assert.match(s.world.notice,/1 equipamento\(s\) coletado\(s\)/);assert.equal(s.world.drops.length,0);
 transition(s,'training');spawnDrop(s.world,'equipment',20,20,{item:piece('head')});s.world.player.hp=0;stepSession(s,.02,{});assert.equal(s.scene,'dead');assert.equal(s.save.character.gearBag.length,1);assert.match(s.world.notice,/foram perdidos/);
 const t=fresh();transition(t,'training');spawnDrop(t.world,'equipment',20,20,{item:piece('head')});updateSettings(t,{lootFilter:'epic'});transition(t,'menu');assert.equal(t.save.character.gearBag.length,0);
 const u=fresh();transition(u,'training');spawnDrop(u.world,'equipment',20,20,{item:piece('head')});applySave(u,snapshot(fresh()));assert.equal(u.save.character.gearBag.length,0);
 const v=fresh();v.save.character.gearBag.push(...Array.from({length:CAPACITY},()=>staff()));transition(v,'training');spawnDrop(v.world,'equipment',20,20,{item:piece('head')});transition(v,'menu');assert.match(v.world.notice,/ficaram no chão/);
});
test('mercador e venda só no menu; preço, ouro e capacidade são validados e atômicos',()=>{
 const s=fresh({character:{gold:35},settings:{gearLevel:1}}),c=s.save.character;
 assert.equal(buy(s,'staff').ok,true);assert.deepEqual([c.gold,c.gearBag.length],[0,1]);assert.ok(EQ.validate(c.gearBag[0],Build));assert.equal(buy(s,'staff').ok,false);assert.equal(c.gearBag.length,1);assert.equal(buy(s,'inválido').ok,false);
 const item=c.gearBag[0],price=EQ.sellPrice(item);assert.equal(sell(s,item.id).ok,true);assert.equal(c.gold,price);assert.equal(c.gearBag.length,0);assert.equal(sell(s,item.id).ok,false);
 c.gold=500;give(s,...Array.from({length:CAPACITY},()=>staff()));assert.equal(buy(s,'body').ok,false);assert.equal(c.gold,500);
 transition(s,'training');assert.equal(sell(s,c.gearBag[0].id).ok,false);assert.equal(buy(s,'body').ok,false);assert.equal(discard(s,c.gearBag[0].id).ok,true);assert.equal(c.gearBag.length,CAPACITY-1);
 assert.equal(discardAll(s).ok,true);assert.equal(c.gearBag.length,0);assert.equal(discardAll(s).ok,false);
 const rich=fresh({character:{gold:1000},settings:{gearLevel:20}});assert.equal(buy(rich,'ring1').ok,true);assert.equal(rich.save.character.gold,1000-EQ.price(20));assert.equal(rich.save.character.gearBag[0].level,20);
});
test('morte bloqueia alterações da mochila',()=>{
 const s=fresh(),[a]=give(s,staff());transition(s,'training');s.world.player.hp=0;stepSession(s,.02,{});assert.equal(s.scene,'dead');
 for(const r of [equip(s,a.id,'staff'),discard(s,a.id),discardAll(s),sell(s,a.id)])assert.equal(r.ok,false);assert.equal(s.save.character.gearBag.length,1);
});
test('save preserva equipamento e mochila, descarta inválidos e duplicados e recarregar não duplica',()=>{
 const s=fresh(),[a,b]=give(s,staff(5),piece('head'));equip(s,a.id,'staff');
 const saved=snapshot(s,1),again=normalizeSave(JSON.parse(JSON.stringify(saved)));assert.deepEqual(again.character.equipment,saved.character.equipment);assert.deepEqual(again.character.gearBag,saved.character.gearBag);
 const loaded=createSession(again);transition(loaded,'training');assert.equal(loaded.world.player.spellDamage,Math.round(52*1.05));
 const raw=JSON.parse(JSON.stringify(saved));raw.character.gearBag=[a,b,{...b},{id:'quebrado'},null];raw.character.equipment.body=piece('staff');
 const clean=normalizeSave(raw);assert.deepEqual(Object.keys(clean.character.equipment),['staff']);assert.deepEqual(clean.character.gearBag.map(i=>i.id),[b.id]);
 assert.throws(()=>normalizeSave({...raw,character:{...raw.character,gearBag:'x'}}));assert.throws(()=>normalizeSave({format:FORMAT,version:VERSION,settings:{lootFilter:'lendario'}}));assert.throws(()=>normalizeSave({format:FORMAT,version:VERSION,settings:{gearLevel:0}}));
 assert.deepEqual(normalizeSave({format:FORMAT,version:VERSION}).settings.lootFilter,'common');
 const first=snapshot(loaded,2),second=snapshot(createSession(first),3);assert.deepEqual(second.character,first.character);
});
test('importação do save antigo aplica equipamentos válidos e mantém o arquivo intacto',()=>{
 const good=piece('staff','magic',11,[{stat:'spell',value:4},{stat:'regen',value:.4}]),legacy={level:12,maxHp:240,exp:5,gold:50,learnedSkills:['raio'],equipment:{staff:good,body:{id:'ruim'}},gearBag:[piece('head'),{id:'invalida'}]},text=JSON.stringify(legacy),s=importSave(text);
 assert.deepEqual(Object.keys(s.character.equipment),['staff']);assert.equal(s.character.gearBag.length,1);assert.equal(JSON.stringify(s.legacy.data),JSON.stringify(legacy));
 const play=createSession(s);transition(play,'training');assert.equal(play.world.player.spellDamage,Math.round((40+44+11)*1.04));assert.equal(play.world.player.maxHp,210);
 assert.equal(importSave(JSON.stringify({level:3,maxHp:100,learnedSkills:[]})).character.gearBag.length,0);
});
test('inventário de consumíveis normaliza entradas e recusa formatos inválidos',()=>{
 assert.deepEqual(CATALOG.map(i=>i.id),['potion_hp','potion_mp','bone_shield','soul_bomb','recall_scroll']);
 assert.deepEqual(normalizeInventory([{id:'potion_hp',count:9},{id:'potion_hp',count:1},{id:'recall_scroll',count:2},{id:'x',count:1},{id:'potion_mp',count:0},{id:'bone_shield',count:1.5},null,{id:'soul_bomb',count:2}]),[{id:'potion_hp',count:5},{id:'recall_scroll',count:2},{id:'soul_bomb',count:2}]);
 assert.deepEqual(normalizeInventory(undefined),[]);assert.throws(()=>normalizeInventory('x'));assert.throws(()=>normalizeSave({format:FORMAT,version:VERSION,character:{inventory:{}}}));
});
test('compra de consumíveis: só no menu, com ouro e respeitando a pilha',()=>{
 const s=fresh({character:{gold:100}}),c=s.save.character;
 assert.equal(buyConsumable(s,'unknown').ok,false);assert.equal(buyConsumable(s,'potion_hp').ok,true);assert.deepEqual([c.gold,c.inventory],[70,[{id:'potion_hp',count:1}]]);
 for(let i=0;i<4;i++){c.gold=100;assert.equal(buyConsumable(s,'potion_hp').ok,true);}c.gold=100;assert.equal(buyConsumable(s,'potion_hp').ok,false);assert.equal(c.gold,100);assert.equal(c.inventory[0].count,5);
 c.gold=10;assert.equal(buyConsumable(s,'soul_bomb').ok,false);assert.equal(c.gold,10);transition(s,'training');c.gold=100;assert.equal(buyConsumable(s,'soul_bomb').ok,false);
});
test('poções, escudo e bomba seguem as regras atuais e só funcionam em combate ativo',()=>{
 const s=fresh({character:{inventory:[{id:'potion_hp',count:2},{id:'potion_mp',count:1},{id:'bone_shield',count:1},{id:'soul_bomb',count:1}]}}),c=s.save.character;
 assert.equal(useConsumable(s,0),false);transition(s,'training');const w=s.world,p=w.player;
 w.paused=true;assert.equal(useConsumable(s,0),false);w.paused=false;assert.equal(useConsumable(s,9),false);
 p.hp=10;assert.equal(useConsumable(s,0),true);assert.equal(p.hp,60);assert.equal(c.inventory[0].count,1);p.hp=p.maxHp-1;assert.equal(useConsumable(s,0),true);assert.equal(p.hp,p.maxHp);assert.equal(c.inventory[0].id,'potion_mp');
 p.mp=0;assert.equal(useConsumable(s,0),true);assert.equal(p.mp,40);
 assert.equal(useConsumable(s,0),true);assert.equal(p.boneShield,true);assert.equal(dealDamage(w,p,50,{level:1}).blocked,true);assert.equal(p.boneShield,false);assert.equal(p.hp,p.maxHp);
 const [near,far]=w.actors.filter(a=>a.team==='enemy'&&a!==w.boss);Object.assign(near,{x:p.x+4.9,y:p.y});Object.assign(far,{x:p.x+5.1,y:p.y});near.hp=far.hp=1000;near.maxHp=far.maxHp=1000;const boss=w.boss.hp;w.boss.x=40;w.boss.y=40;
 assert.equal(useConsumable(s,0),true);assert.deepEqual([near.hp,far.hp,w.boss.hp],[920,1000,boss]);assert.equal(c.inventory.length,0);assert.equal(useConsumable(s,0),false);assert.ok(w.effects.some(e=>e.kind==='bomb'&&e.radius===5));
 p.hp=0;c.inventory.push({id:'potion_hp',count:1});assert.equal(useConsumable(s,0),false);
});
test('bomba de almas abate pelo caminho comum: XP e ouro uma vez',()=>{
 const s=fresh({character:{inventory:[{id:'soul_bomb',count:1}]}});transition(s,'training');const w=s.world,p=w.player,e=foe(w),c=s.save.character;Object.assign(e,{x:p.x+1,y:p.y,hp:50,maxHp:50});
 assert.equal(useConsumable(s,0),true);assert.equal(e.hp,0);assert.equal(c.exp,12);assert.equal(w.drops.filter(d=>d.kind==='gold').length,1);
});
test('consumíveis persistem sem duplicar e o save antigo os importa; o arquivo permanece intacto',()=>{
 const s=fresh({character:{inventory:[{id:'potion_mp',count:3}]}}),saved=snapshot(s,1);assert.deepEqual(saved.character.inventory,[{id:'potion_mp',count:3}]);assert.deepEqual(snapshot(createSession(saved),2).character.inventory,saved.character.inventory);
 const legacy={level:5,maxHp:140,learnedSkills:[],inventory:[{id:'potion_hp',name:'Poção de Vida',icon:'x',desc:'x',count:2},{id:'recall_scroll',count:1}]},text=JSON.stringify(legacy),imported=importSave(text);
 assert.deepEqual(imported.character.inventory,[{id:'potion_hp',count:2},{id:'recall_scroll',count:1}]);assert.equal(JSON.stringify(imported.legacy.data),text);
});

