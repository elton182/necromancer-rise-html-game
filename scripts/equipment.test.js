'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const Model=require('./equipment-model.js'),Tree=require('../build-simulator/model.js');
let serial=0;
function item(level=12,type='staff',boss=false){return Model.generate(level,Tree,Math.random,type,boss,'test-'+(++serial));}
function fixture(){
 const context=vm.createContext({EquipmentModel:Model,BuildModel:Tree,console,innerWidth:1200,innerHeight:800});
 vm.runInContext(`
 const player={level:12,hp:85,maxHp:210,mp:60,maxMp:135,skillRanks:{bolt:5,zombie:2,vigor:2},skillGrants:[],gold:1000,spellDmg:84,skillPoints:0,spellCooldowns:{raio:0},minionSkillCooldowns:{},inventory:[],equipment:{},gearBag:[],waveProgress:EquipmentModel.progress()};
 const MINION_DEFS={zombie:{hp:130,dmg:11,spd:3.4,atkR:1.5}},ACTION_SKILLS={archer:{cooldown:7}},P={x:0,y:0,deadT:0},CAMP={on:false,map:false,stage:1},TITLE={active:false,paused:false},COMIC={active:false},PM={},ENDLESS={best:0},VIL={},playerDash={cd:0};
 const MOB_ABILITIES={Guerreiro:{windup:.65,cooldown:7},Arqueiro:{windup:.9,cooldown:7},'Mago Vivo':{windup:1,cooldown:9},Bruto:{windup:.85,cooldown:8}};
 let minions=[],enemies=[],droppedItems=[],gameState='hub',currentMission=null,wave=0,missionWave=0,waveActive=false;
 let minionHpBonus=0,minionDmgBonus=0,minionRegenBonus=0,actionSignature='',actionAvailabilitySignature='',summonSlotsSignature='',_mpSig='',saves=0,ends=0;
 const document={getElementById:()=>({textContent:'',style:{display:'none'}}),querySelector:()=>null},window={addEventListener(){}};
 const updateHUD=()=>{},updateMinionPanel=()=>{},floatMsg=()=>{},playSound=()=>{},saveGame=()=>{saves++;},setPause=()=>{},tConfirm=()=>{},mkMesh2=(x,z)=>({position:{x,z}});
 function tPause(){}function pmControlsHtml(){return '';}function buildSkillTree(){}function buildShopGrid(){}function closeHubOverlay(){}function campNewChar(){}function loadGame(){return false;}function enterHub(){gameState='hub';droppedItems=[];}function campMapOpen(){}function vilOpen(){}function vilClose(){}
 function startEndless(){wave=0;missionWave=0;currentMission={endless:true};gameState='field';}
 function endWave(){ends++;waveActive=false;player.gold+=10;}
 function spawnEnemy(type,x,z){const e={type,hp:type.hp*99,maxHp:type.hp*99,dmg:type.dmg*99,xp:type.xp,mesh:mkMesh2(x,z),dead:false};enemies.push(e);return e;}
 function killEnemy(e){e.dead=true;}function spawnDrop(){}
 function checkPickups(){for(const d of droppedItems)if(d.type!=='hp'&&d.type!=='mp')throw Error('Equipment reached potion collector');}
 function castRaio(){if(player.mp<20||player.spellCooldowns.raio>0)return;player.mp-=20;player.spellCooldowns.raio=.5;}
 function castHands(){}function castChuva(){}function castExplosao(){}function castBarrier(){}function castDash(){playerDash.cd=3;return true;}function activateSummonSkill(){return true;}
 `,context);
 const trees=fs.readFileSync(path.join(__dirname,'skill-trees.js'),'utf8');
 vm.runInContext(trees.slice(0,trees.indexOf('// Install the new progression')),context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'equipment.js'),'utf8'),context);
 return {context,run:code=>vm.runInContext(code,context)};
}
test('generated pieces validate at every rarity, slot and level; boss never common',()=>{
 const seen=new Set();for(let n=0;n<3000;n++){const i=item(n%100+1,Object.keys(Model.slots)[n%7]);assert.deepEqual(Model.validate(i,Tree),i);seen.add(i.rarity);assert.equal(i.affixes.length,Model.rarities[i.rarity].count);assert.equal(new Set(i.affixes.map(a=>a.stat)).size,i.affixes.length);assert.notEqual(item(8,'staff',true).rarity,'common');}assert.equal(seen.size,4);
});
test('migration rejects invalid values, duplicate IDs, wrong slots and malformed bonuses',()=>{
 const a=item(),bad=structuredClone(a);bad.affixes=[null];
 const state={equipment:{staff:a,boots:a},gearBag:[a,bad,{...a,id:'invalid',base:{stat:'spell',value:1e99}}],camp:{eb:8}};
 Model.migrate(state,Tree);assert.equal(state.equipment.staff.id,a.id);assert.equal(state.equipment.boots,undefined);assert.equal(state.gearBag.length,0);assert.deepEqual(state.waveProgress,{best:8,unlocked:9,selected:1});
 const once=JSON.stringify(state);Model.migrate(state,Tree);assert.equal(JSON.stringify(state),once);
});
test('temporary skill and school ranks stack; no unlock, budget change, finals or direct synergies',()=>{
 const a=item();a.affixes=[{stat:'skill',target:'bolt',value:2},{stat:'school',target:'osso',value:1}];
 const ranks={bolt:5,rain:2,storm:1},result=Model.effects(Tree,ranks,{staff:a});
 assert.equal(result.extra.bolt,3);assert.equal(result.extra.rain,1);assert.equal(result.extra.storm,undefined);assert.equal(result.extra.pierce,undefined);
 assert.equal(result.effects['Dano do Tiro de Osso'],88);assert.equal(result.effects['Dano da Chuva de Ossos'],85);
 assert.equal(Tree.spent(ranks),8);assert.equal(Model.effects(Tree,ranks,{}).effects['Dano do Tiro de Osso'],58);
});
test('waves unlock only on valid completion; regression preserves best and lowers loot and threat',()=>{
 let p=Model.progress();p=Model.complete(p,9);assert.equal(p.best,0);p=Model.complete(p,1);assert.equal(p.unlocked,2);
 p=Model.complete(p,2);p.selected=1;p=Model.progress(p);assert.equal(p.best,2);assert.equal(p.selected,1);
 assert.ok(Model.waveStats(1).hp<Model.waveStats(3).hp);assert.equal(Model.waveStats(1).itemLevel,1);
});
test('equip and unequip affect actual skill stats without healing or altering ranks/cooldowns',()=>{
 const {context,run}=fixture();context.piece=item(12,'body');
 run('skillSync();player.hp=90;player.mp=40;player.spellCooldowns.raio=4;player.gearBag=[piece];');
 const old=run('player.maxHp'),ranks=run('JSON.stringify(player.skillRanks)');
 assert.equal(run('gearEquip(piece.id,"body")'),true);assert.ok(run('player.maxHp')>old);assert.ok(run('player.hp/player.maxHp')<=90/old+1e-8);
 const ratio=run('player.hp/player.maxHp');assert.equal(run('gearUnequip("body")'),true);assert.ok(run('player.hp/player.maxHp')<=ratio+1e-8);
 assert.equal(run('player.maxHp'),old);assert.equal(run('JSON.stringify(player.skillRanks)'),ranks);assert.equal(run('player.spellCooldowns.raio'),4);
});
test('existing dead minions stay dead and retain recovery on equipment changes',()=>{
 const {context,run}=fixture();context.piece=item();run('minions=[{type:"zombie",hp:0,maxHp:130,dead:true,deadTimer:9,exploded:true}];player.gearBag=[piece];gearEquip(piece.id,"staff");');
 assert.equal(run('minions[0].hp'),0);assert.equal(run('minions[0].deadTimer'),9);assert.equal(run('minions[0].exploded'),true);
});
test('rings swap either hand, full bag cannot unequip, and equipped items cannot be sold',()=>{
 const {context,run}=fixture();context.piece=item(10,'ring1');run('player.gearBag=[piece]');
 assert.equal(run('gearEquip(piece.id,"ring2")'),true);assert.equal(run('gearSell(piece.id)'),false);
 run('player.gearBag=Array(60).fill(piece)');assert.equal(run('gearUnequip("ring2")'),false);
});
test('shop checks village, gold and capacity before payment; buy/sell never creates profit',()=>{
 const {run}=fixture();run('player.gold=0');assert.equal(run('gearBuy("staff")'),false);
 run('player.gold=1000;gameState="field"');assert.equal(run('gearBuy("staff")'),false);
 run('gameState="hub";player.waveProgress=EquipmentModel.progress({best:9,selected:1})');assert.equal(run('gearBuy("staff")'),true);
 assert.equal(run('player.gearBag[0].level'),10);assert.equal(run('player.gold'),875);assert.equal(run('gearSell(player.gearBag[0].id)'),true);assert.ok(run('player.gold')<1000);
});
test('spawn replaces legacy multipliers exactly once with active wave difficulty',()=>{
 const {run}=fixture();run('player.waveProgress=EquipmentModel.progress({best:7,selected:3});startEndless();wave++;missionWave++;const e=spawnEnemy({hp:40,dmg:8,xp:12},0,0)');
 assert.equal(run('wave'),3);assert.equal(run('missionWave'),3);assert.equal(run('e.hp'),Math.round(40*Model.waveStats(3).hp));assert.equal(run('e.dmg'),Math.round(8*Model.waveStats(3).damage));assert.equal(run('e.gearWave'),3);
});
test('completion updates record and guards duplicate rewards',()=>{
 const {run}=fixture();run('currentMission={endless:true};wave=missionWave=1;waveActive=true;endWave();endWave();');assert.equal(run('player.waveProgress.best'),1);assert.equal(run('player.waveProgress.unlocked'),2);assert.equal(run('ends'),1);
});
test('normal enemies move and attack faster and prepare specials earlier without touching damage',()=>{
 const {run}=fixture();run('currentMission={endless:true};wave=1;const warrior=spawnEnemy({name:"Guerreiro",hp:40,dmg:8,spd:2,xp:12},0,0);const archer=spawnEnemy({name:"Arqueiro",hp:25,dmg:12,spd:2.8,xp:15},0,0)');
 assert.equal(run('warrior.spd'),2.3);assert.equal(run('warrior.atkRate'),1.1);assert.equal(run('archer.atkRate'),1.3);assert.equal(run('warrior.dmg'),8);assert.ok(run('warrior.abilityCd')>=.75&&run('warrior.abilityCd')<=1.25);
 assert.equal(run('MOB_ABILITIES.Guerreiro.windup'),.5);assert.equal(run('MOB_ABILITIES.Bruto.cooldown'),6);
});
test('boss drops exactly one magical-or-better piece and repeat deaths never duplicate it',()=>{
 const {run}=fixture();run('const e={hp:0,dead:false,isBoss:true,gearWave:8};killEnemy(e,1,1);killEnemy(e,1,1);');assert.equal(run('droppedItems.length'),1);assert.equal(run('droppedItems[0].item.level'),8);assert.notEqual(run('droppedItems[0].item.rarity'),'common');
});
test('equipment chance doubles while orb rules favor mana and suppress extra campaign rolls',()=>{
 const {run}=fixture();assert.equal(run('COMBAT_TUNING.gearChance'),.16);assert.equal(run('COMBAT_TUNING.orbChance*COMBAT_TUNING.hpOrbShare'),.04);assert.equal(run('COMBAT_TUNING.orbChance*(1-COMBAT_TUNING.hpOrbShare)'),.12);
 run('CAMP.on=true;const normal={dead:false,gearWave:1};killEnemy(normal,0,0)');assert.equal(run('normal.dropChance'),.16);
 run('droppedItems=[];const originalRandom=Math.random;Math.random=()=>.1;spawnDrop(0,0);Math.random=()=>.5;spawnDrop(0,0);Math.random=originalRandom;');assert.equal(run('droppedItems[0].type'),'hp');assert.equal(run('droppedItems[1].type'),'mp');
 const html=fs.readFileSync(path.join(__dirname,'../necromancer-canvas.html'),'utf8');assert.equal(html.includes('Math.max(e.dropChance||0,.55)'),false);assert.equal(html.includes('Math.random()<.7) spawnDrop(hx,hz)'),false);
});
test('collector isolates equipment from potions; full bags leave items on ground',()=>{
 const {context,run}=fixture();context.piece=item();run('droppedItems=[{type:"equipment",item:piece,mesh:mkMesh2(0,0),life:Infinity,t:0}];checkPickups(.1)');assert.equal(run('player.gearBag.length'),1);assert.equal(run('droppedItems.length'),0);
 run('player.gearBag=Array(60).fill(piece);droppedItems=[{type:"equipment",item:piece,mesh:mkMesh2(0,0),life:Infinity,t:0}];checkPickups(.1)');assert.equal(run('droppedItems.length'),1);assert.equal(run('droppedItems[0].life'),Infinity);
});
test('cooldown applies only to successful casts and never resets an existing cooldown',()=>{
 const {context,run}=fixture();context.piece=item();run('piece.affixes=[{stat:"cooldown",value:20}];player.equipment={staff:piece};player.mp=80;castRaio();');assert.equal(run('player.spellCooldowns.raio'),.4);run('castRaio()');assert.equal(run('player.spellCooldowns.raio'),.4);
});
test('save migration recomputes equipped stats without accumulating bonuses',()=>{
 const {context,run}=fixture();context.piece=item(10,'body');run('const d={level:12,skillTreeVersion:1,skillRanks:{bolt:5},equipment:{body:piece},hp:100,maxHp:210,mp:80,maxMp:135};skillMigrateSave(d);const first=JSON.stringify(d);skillMigrateSave(d);');assert.equal(run('JSON.stringify(d)'),run('first'));assert.ok(run('d.maxHp')>210);
});
test('released HTML embeds sources once, orders equipment after trees, and has save bridges',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../necromancer-canvas.html'),'utf8');
 for(const [name,file]of [['EQUIPMENT_MODEL','equipment-model.js'],['EQUIPMENT_RULES','equipment.js'],['EQUIPMENT_STYLE','equipment.css']]){assert.equal(html.split(name+'_BEGIN').length,2);assert.ok(html.includes(fs.readFileSync(path.join(__dirname,file),'utf8')));}
 assert.ok(html.indexOf('/* EQUIPMENT_RULES_BEGIN */')>html.indexOf('/* SKILL_TREE_RULES_END */'));
 assert.ok(html.includes('gearBag:player.gearBag,equipment:player.equipment,waveProgress:player.waveProgress'));
});
