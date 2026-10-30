'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const Model=require('./equipment-model.js'),Tree=require('../build-simulator/model.js');
let serial=0;
function item(level=12,type='staff',boss=false){return Model.generate(level,Tree,Math.random,type,boss,'test-'+(++serial));}
function fixture(options={}){
 const context=vm.createContext({EquipmentModel:Model,BuildModel:Tree,console,innerWidth:1200,innerHeight:800});
 context.storedOptions={...options};
 vm.runInContext(`
 const optsLoad=()=>({...storedOptions}),optsSave=o=>storedOptions={...o};
 const player={level:12,hp:85,maxHp:210,mp:60,maxMp:135,skillRanks:{bolt:5,zombie:2,vigor:2},skillGrants:[],gold:1000,spellDmg:84,skillPoints:0,spellCooldowns:{raio:0},minionSkillCooldowns:{},inventory:[],equipment:{},gearBag:[],waveProgress:EquipmentModel.progress()};
 const MINION_DEFS={zombie:{name:'Zumbi',hp:130,dmg:11,spd:3.4,atkR:1.5,atkRate:1.2}},ACTION_SKILLS={archer:{cooldown:7}},P={x:0,y:0,deadT:0},CAMP={on:false,map:false,stage:1},TITLE={active:false,paused:false},COMIC={active:false},PM={},ENDLESS={best:0},VIL={},playerDash={cd:0};
 const MOB_ABILITIES={Guerreiro:{windup:.65,cooldown:7},Arqueiro:{windup:.9,cooldown:7},'Mago Vivo':{windup:1,cooldown:9},Bruto:{windup:.85,cooldown:8}};
 let minions=[],enemies=[],droppedItems=[],gameState='hub',currentMission=null,wave=0,missionWave=0,waveActive=false;
 let minionHpBonus=0,minionDmgBonus=0,minionRegenBonus=0,actionSignature='',actionAvailabilitySignature='',summonSlotsSignature='',_mpSig='',saves=0,ends=0,confirmation=null,campaignReturns=0;
 const document={getElementById:()=>({textContent:'',style:{display:'none'}}),querySelector:()=>null},window={addEventListener(){}};
 const updateHUD=()=>{},updateMinionPanel=()=>{},floatMsg=()=>{},playSound=()=>{},saveGame=()=>{saves++;},setPause=()=>{},tConfirm=(text,label,action,cancel)=>{confirmation={text,action,cancel};},mkMesh2=(x,z)=>({position:{x,z}});
 function campToCampaign(){CAMP.on=true;campaignReturns++;}
 function update(dt){}
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
test('loot thresholds include higher rarities, preserve other drops and persist across reloads',()=>{
 const {run}=fixture({pauseOnBlur:false});
 for(const [index,rarity]of ['common','magic','rare','epic'].entries()){
  run(`setLootMinRarity('${rarity}')`);
  assert.equal(run('storedOptions.lootMinRarity'),rarity);assert.equal(run('storedOptions.pauseOnBlur'),false);
  for(const [rank,candidate]of ['common','magic','rare','epic'].entries())assert.equal(run(`lootDropAllowed({type:'equipment',item:{rarity:'${candidate}'}})`),rank>=index);
  for(const type of ['hp','mp','gold'])assert.equal(run(`lootDropAllowed({type:'${type}'})`),true);
 }
 assert.equal(fixture({lootMinRarity:'rare'}).run('lootMinRarity'),'rare');
 assert.equal(fixture({lootMinRarity:'invalid'}).run('lootMinRarity'),'common');
 run("setLootMinRarity('invalid')");assert.equal(run('lootMinRarity'),'common');
});

test('hidden loot skips proximity and exit collection, remains recoverable and never blocks leaving',()=>{
 const {run}=fixture();
 run("const hidden={type:'equipment',item:{...EquipmentModel.generate(1,BuildModel,()=>0,'staff'),rarity:'common'},mesh:mkMesh2(0,0),life:Infinity,t:0};droppedItems=[hidden];setLootMinRarity('rare');checkPickups(.1);gearCollectAvailable();");
 assert.equal(run('player.gearBag.length'),0);assert.equal(run('droppedItems[0]===hidden'),true);assert.equal(run('gearNoticeAt'),0);
 run('player.gearBag=Array(60).fill(hidden.item);let left=false;gearLeave(()=>left=true)');assert.equal(run('left'),true);assert.equal(run('confirmation'),null);
 run("player.gearBag=[];setLootMinRarity('common');checkPickups(.1)");assert.equal(run('player.gearBag.length'),1);assert.equal(run('droppedItems.length'),0);
});

test('generated pieces validate at every rarity, slot and level; boss never common',()=>{
 const seen=new Set();for(let n=0;n<3000;n++){const i=item(n%100+1,Object.keys(Model.slots)[n%7]);assert.deepEqual(Model.validate(i,Tree),i);seen.add(i.rarity);assert.equal(i.affixes.length,Model.rarities[i.rarity].count);assert.equal(new Set(i.affixes.map(a=>a.stat)).size,i.affixes.length);assert.notEqual(item(8,'staff',true).rarity,'common');}assert.equal(seen.size,4);
});
test('migration rejects invalid values, duplicate IDs, wrong slots and malformed bonuses',()=>{
 const a=item(),bad=structuredClone(a);bad.affixes=[null];
 const state={equipment:{staff:a,boots:a},gearBag:[a,bad,{...a,id:'invalid',base:{stat:'spell',value:1e99}}],camp:{eb:8}};
 Model.migrate(state,Tree);assert.equal(state.equipment.staff.id,a.id);assert.equal(state.equipment.boots,undefined);assert.equal(state.gearBag.length,0);assert.deepEqual(state.waveProgress,{best:8,unlocked:9,selected:1});
 const once=JSON.stringify(state);Model.migrate(state,Tree);assert.equal(JSON.stringify(state),once);
});

test('all item bases are flat; staff starts at 10–12 and scales independently of rarity',()=>{
 const seen=new Set();
 for(let n=0;n<600;n++){
  const i=Model.generate(1,Tree,()=>n%100/100,'staff');seen.add(i.base.value);
  assert.equal(i.base.stat,'spellFlat');assert.ok(i.base.value>=10&&i.base.value<=12);assert.equal(Number.isInteger(i.base.value),true);
  assert.equal(Model.attributes[i.base.stat].percent,undefined);assert.deepEqual(Model.validate(i,Tree),i);
 }
 assert.deepEqual([...seen].sort((a,b)=>a-b),[10,11,12]);
 for(const slot of Object.keys(Model.slots)){const i=item(20,slot);assert.ok(!Model.attributes[i.base.stat].percent);}
 const low=Model.generate(1,Tree,()=>.5,'staff'),high=Model.generate(20,Tree,()=>.5,'staff');assert.ok(high.base.value>low.base.value);
 assert.match(Model.describe(low.base,Tree),/\+11 Dano mágico base/);assert.doesNotMatch(Model.describe(low.base,Tree),/%/);
});

test('old saves convert percentage bases once while preserving affixes, slots and identities',()=>{
 const staff={...item(12),version:1,rarity:'magic',base:{stat:'spell',value:9.28},affixes:[{stat:'spell',value:9.28},{stat:'mp',value:10}]};
 const grimoire={...item(12,'grimoire'),version:1,rarity:'common',base:{stat:'horde',value:9.28},affixes:[]};
 const boots={...item(12,'boots'),version:1,rarity:'common',base:{stat:'move',value:2.32},affixes:[]};
 const data={equipment:{staff,boots},gearBag:[grimoire]};Model.migrate(data,Tree);
 assert.equal(data.equipmentVersion,3);assert.equal(data.equipment.staff.base.stat,'spellFlat');assert.equal(data.equipment.staff.base.value,26);assert.deepEqual(data.equipment.staff.affixes,staff.affixes);assert.equal(data.equipment.staff.id,staff.id);
 assert.equal(data.equipment.boots.base.stat,'moveFlat');assert.equal(data.gearBag[0].base.stat,'hordeFlat');assert.equal(data.gearBag[0].id,grimoire.id);
 const once=JSON.stringify(data);Model.migrate(data,Tree);assert.equal(JSON.stringify(data),once);
 assert.equal(Model.validate({...staff,base:{stat:'spell',value:1e99}},Tree),null);
});

test('staff flat damage is added before percent and skill multipliers in live combat and preview',()=>{
 const {context,run}=fixture();context.piece={...item(),rarity:'magic',base:{stat:'spellFlat',value:25},affixes:[{stat:'spell',value:10},{stat:'mp',value:10}]};
 assert.ok(Model.validate(context.piece,Tree));
 run('skillSync();const naked=player.spellDmg;player.gearBag=[piece];gearEquip(piece.id,"staff");const preview=EquipmentModel.snapshot(BuildModel,player,MINION_DEFS,COMBAT_TUNING);');
 assert.equal(run('naked'),84);assert.equal(run('player.spellDmg'),120);assert.equal(run('preview.attributes.spell'),120);
 assert.equal(run('preview.skills.find(s=>s.id==="raio").damage'),90);
 run('gearUnequip("staff")');assert.equal(run('player.spellDmg'),84);
});

test('grimoire flat damage feeds basic attacks, commanded explosions and the status preview',()=>{
 const {context,run}=fixture();context.piece={...item(12,'grimoire'),rarity:'magic',base:{stat:'hordeFlat',value:9},affixes:[{stat:'horde',value:10},{stat:'mp',value:10}]};
 run('player.skillRanks.burst=2;player.gearBag=[piece];gearEquip(piece.id,"grimoire");const s=skillMinionStats("zombie");const estimate=EquipmentModel.snapshot(BuildModel,player,MINION_DEFS,COMBAT_TUNING);');
 assert.equal(run('s.baseDmg'),31);assert.equal(run('s.dmg'),37);assert.equal(run('estimate.skills.find(s=>s.id==="zombie").damage'),111);
 assert.equal(run('estimate.skills.find(s=>s.id==="zombie-burst").damage'),154);
 assert.ok(Math.abs(Model.moveSpeed({moveFlat:.2,move:10})-4.62)<1e-10);assert.equal(Model.moveSpeed({moveFlat:9,move:30}),5.2);
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
 // From wave 10 kills pay a 50% bonus that grows 10% per wave (capped at wave 60).
 assert.equal(Model.waveStats(9).xp,1.04**8);assert.equal(Model.waveStats(10).xp,1.04**9*1.5);
 assert.ok(Model.waveStats(20).xp>8&&Model.waveStats(61).xp/Model.waveStats(60).xp<1.05);
});

test('new wave records advance the next start; replaying an earlier wave preserves the chosen start',()=>{
 let p=Model.progress({best:4,selected:5});
 for(let n=5;n<=9;n++){p=Model.complete(p,n);assert.equal(p.selected,n+1);assert.equal(p.unlocked,n+1);}
 assert.deepEqual(p,{best:9,unlocked:10,selected:10});
 p=Model.complete(p,10);assert.deepEqual(p,{best:10,unlocked:11,selected:11});
 p.selected=5;p=Model.complete(p,5);assert.deepEqual(p,{best:10,unlocked:11,selected:5});
 p=Model.complete(Model.progress({best:999,selected:1000}),1000);assert.deepEqual(p,{best:1000,unlocked:1000,selected:1000});
});

test('loading reconciles a stale wave selector with the saved arena record without trusting the global wave',()=>{
 const state={wave:99,camp:{eb:9},waveProgress:{best:4,selected:5}};
 Model.migrate(state,Tree);assert.deepEqual(state.waveProgress,{best:9,unlocked:10,selected:5});
 const once=JSON.stringify(state);Model.migrate(state,Tree);assert.equal(JSON.stringify(state),once);
 state.camp.eb=2;Model.migrate(state,Tree);assert.equal(state.waveProgress.best,9);
 const campaign={wave:99,camp:{cleared:{1:1,2:1,3:1,4:1}}};Model.migrate(campaign,Tree);assert.deepEqual(campaign.waveProgress,{best:0,unlocked:1,selected:1});
});

test('progressing from wave 5 to 10 survives saving and starts the arena at wave 10',()=>{
 const {context,run}=fixture();
 run('player.waveProgress=EquipmentModel.progress({best:4,selected:5});startEndless();for(let n=5;n<=9;n++){wave=missionWave=n;waveActive=true;endWave();}');
 assert.equal(run('player.waveProgress.selected'),10);assert.equal(run('saves'),5);
 // Arriving at wave 10 does not mark it completed; a reload resumes that unlocked wave.
 run('wave=missionWave=10;waveActive=true;');
 context.saved=JSON.parse(run('JSON.stringify({wave,camp:{eb:ENDLESS.best},waveProgress:player.waveProgress})'));
 Model.migrate(context.saved,Tree);
 run('player.waveProgress=saved.waveProgress;startEndless();wave++;missionWave++;');
 assert.equal(run('wave'),10);assert.equal(run('missionWave'),10);assert.equal(run('player.waveProgress.best'),9);
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
test('horde-life equipment increases existing allies HP and regen without restoring full health',()=>{
 const {context,run}=fixture();context.piece=Model.generate(12,Tree,()=>.65,'body',false,'horde-coat');
 run('piece.rarity="magic";piece.affixes=[{stat:"hordeHp",value:20},{stat:"mp",value:10}];const s=skillMinionStats("zombie");const m={type:"zombie",hp:150,maxHp:s.hp,dead:false,deadTimer:0};minions=[m];player.gearBag=[piece];const ratio=m.hp/m.maxHp;gearEquip(piece.id,"body")');
 assert.equal(run('m.maxHp'),381);assert.equal(run('m.hpRegen'),3.81);assert.ok(run('m.hp/m.maxHp')<=run('ratio'));assert.ok(run('m.hp')<run('m.maxHp'));assert.equal(run('m.deadTimer'),0);
});
test('rings swap either hand, full bag cannot unequip, and equipped items cannot be sold',()=>{
 const {context,run}=fixture();context.piece=item(10,'ring1');run('player.gearBag=[piece]');
 assert.equal(run('gearEquip(piece.id,"ring2")'),true);assert.equal(run('gearSell(piece.id)'),false);
 run('player.gearBag=Array(60).fill(piece)');assert.equal(run('gearUnequip("ring2")'),false);
});

test('discard all requires confirmation, preserves worn gear/consumables and only removes listed items',()=>{
 const {context,run}=fixture();context.bagItem=item();context.worn=item(12,'body');context.later=item();
 run('player.gearBag=[bagItem];player.equipment={body:worn};player.inventory=[{type:"hp",count:2}];const protectedState=JSON.stringify([player.equipment,player.inventory,player.gold]);gearSelected={id:bagItem.id};gearPage=1;');
 assert.equal(run('gearDiscardAll()'),true);assert.equal(run('player.gearBag.length'),1);
 run('confirmation.cancel()');assert.equal(run('player.gearBag.length'),1);
 run('gearDiscardAll();player.gearBag.push(later);confirmation.action()');
 assert.equal(run('player.gearBag.length'),1);assert.equal(run('player.gearBag[0].id'),context.later.id);assert.equal(run('gearSelected'),null);assert.equal(run('gearPage'),0);assert.equal(run('saves'),1);
 assert.equal(run('JSON.stringify([player.equipment,player.inventory,player.gold])'),run('protectedState'));
 run('player.gearBag=[]');assert.equal(run('gearDiscardAll()'),false);
});

test('equipment boosts primary skills without multiplying invested cross synergies',()=>{
 const piece=item();piece.affixes=[{stat:'skill',target:'abom',value:2},{stat:'skill',target:'burst',value:2}];
 const ranks={zombie:2,vigor:2,abom:2,burst:2,colossus:1};
 const base=Model.effects(Tree,ranks,{}).effects,boost=Model.effects(Tree,ranks,{staff:piece}).effects;
 for(const key of ['Dano de Zumbis','Vida de Zumbis','Dano do Salto Devastador'])assert.equal(boost[key],base[key]);
 assert.equal(boost['Dano da Abominação'],base['Dano da Abominação']+20);assert.equal(boost['Dano da explosão de Zumbi'],base['Dano da explosão de Zumbi']+24);
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
 const {run}=fixture();run('player.equipment=Object.fromEntries(Object.keys(EquipmentModel.slots).map(s=>[s,{level:8}]));const e={hp:0,dead:false,isBoss:true,gearWave:8};killEnemy(e,1,1);killEnemy(e,1,1);');assert.equal(run('droppedItems.length'),1);assert.equal(run('droppedItems[0].item.level'),8);
 // Without worn gear the catch-up roll may lift the piece above the wave, never below.
 run('player.equipment={};droppedItems=[];const r={hp:0,dead:false,isBoss:true,gearWave:8};killEnemy(r,1,1);');assert.ok(run('droppedItems[0].item.level')>=8);assert.equal(run('droppedItems[0].upgrade'),run('droppedItems[0].item.level>8'));assert.notEqual(run('droppedItems[0].item.rarity'),'common');
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
 for(const [name,file]of [['EQUIPMENT_MODEL','equipment-model.js'],['EQUIPMENT_RULES','equipment.js'],['EQUIPMENT_STYLE','equipment.css'],['MENU_STYLE','menu.css'],['MINION_CARE','minion-care.js'],['MINION_ABILITIES','minion-abilities.js'],['SPRITE_CACHE','sprite-cache.js']]){assert.equal(html.split(name+'_BEGIN').length,2);assert.ok(html.replace(/\r\n/g,'\n').includes(fs.readFileSync(path.join(__dirname,file),'utf8').replace(/\r\n/g,'\n')));}
 assert.ok(html.indexOf('/* EQUIPMENT_RULES_BEGIN */')>html.indexOf('/* SKILL_TREE_RULES_END */'));
 assert.ok(html.includes('gearBag:player.gearBag,equipment:player.equipment,waveProgress:player.waveProgress'));
});
test('free hub can resume story before village unlock, preserving campaign and equipment',()=>{
 const {context,run}=fixture();context.piece=item();run('CAMP.cleared={1:1};CAMP.unlocked=2;player.gearBag=[piece];const ranks=JSON.stringify(player.skillRanks);');
 assert.equal(run('gearReturnToStory()'),true);assert.equal(run('campaignReturns'),1);assert.equal(run('CAMP.cleared[1]'),1);assert.equal(run('CAMP.unlocked'),2);assert.equal(run('player.gearBag[0].id'),context.piece.id);assert.equal(run('JSON.stringify(player.skillRanks)'),run('ranks'));
});
test('return from a wave requires confirmation; cancel preserves free mode and success collects drops',()=>{
 const {context,run}=fixture();context.piece=item();run('gameState="field";droppedItems=[{type:"equipment",item:piece,mesh:mkMesh2(4,0)}];gearReturnToStory();');
 assert.equal(run('campaignReturns'),0);run('confirmation.cancel()');assert.equal(run('CAMP.on'),false);assert.equal(run('droppedItems.length'),1);
 run('gearReturnToStory();confirmation.action()');assert.equal(run('campaignReturns'),1);assert.equal(run('player.gearBag.length'),1);assert.equal(run('droppedItems.length'),0);
});
test('status preview matches equipped stats without changing HP, ranks, loadout or cooldowns',()=>{
 const {context,run}=fixture();context.piece=Model.generate(12,Tree,()=>.1,'staff',false,'snapshot-staff');
 run('piece.rarity="magic";piece.affixes=[{stat:"skill",target:"bolt",value:2},{stat:"cooldown",value:1}];player.actionLoadout=["raio","zombie"];skillSync();player.spellCooldowns.raio=3;const before=JSON.stringify(player);const preview=EquipmentModel.snapshot(BuildModel,player,MINION_DEFS,COMBAT_TUNING,{staff:piece});');
 assert.equal(run('JSON.stringify(player)'),run('before'));
 run('player.gearBag=[piece];gearEquip(piece.id,"staff")');
 assert.equal(run('preview.attributes.hp'),run('player.maxHp'));assert.equal(run('preview.attributes.mp'),run('player.maxMp'));assert.equal(run('preview.attributes.spell'),run('player.spellDmg'));assert.equal(run('preview.attributes.regen'),run('player.mpRegen'));
 assert.equal(run('preview.skills.find(s=>s.id==="raio").damage'),run('Math.floor(player.spellDmg*COMBAT_TUNING.boltMultiplier*skillPercent("Dano do Tiro de Osso"))'));assert.equal(run('player.spellCooldowns.raio'),3);
 assert.ok(run('preview.skills.find(s=>s.id==="raio").sustained')<run('preview.skills.find(s=>s.id==="raio").dps'));
});
test('DPS separates summon attacks, burst and revive limits; utility skills have no invented damage',()=>{
 const {run}=fixture();run('player.skillRanks={zombie:2,burst:2};player.actionLoadout=["zombie","dash"];skillSync();const estimate=EquipmentModel.snapshot(BuildModel,player,MINION_DEFS,COMBAT_TUNING);');
 assert.equal(run('estimate.attributes.hordeDps'),60);assert.equal(run('estimate.attributes.hordeHp'),831);
 assert.equal(run('estimate.skills.find(s=>s.id==="zombie-burst").damage'),102);assert.equal(run('estimate.skills.find(s=>s.id==="zombie-burst").sustained'),25.5);
 assert.equal(run('estimate.skills.find(s=>s.id==="dash").dps'),null);
});
test('catch-up drops: gear at wave level never rolls above it; lagging gear rolls higher, more often, toward the weakest slot',()=>{
 const worn=level=>Object.fromEntries(Object.keys(Model.slots).map(slot=>[slot,{level}]));
 assert.deepEqual(Model.dropRoll(worn(20),20,()=>0),{level:20,type:undefined,upgrade:false});
 assert.deepEqual(Model.dropRoll(worn(25),20,()=>0),{level:20,type:undefined,upgrade:false});
 // Average worn level ~8.9 at wave 20 (deficit ~11): 60% chance, up to +6 levels, half aimed at the weakest slot.
 const lagging={...worn(10),boots:{level:2}};
 assert.equal(Model.dropRoll(lagging,20,()=>.59).upgrade,true);assert.equal(Model.dropRoll(lagging,20,()=>.61).upgrade,false);
 const seq=values=>{let i=0;return ()=>values[i++];};
 assert.deepEqual(Model.dropRoll(lagging,20,seq([0,.99,.1])),{level:26,type:'boots',upgrade:true});
 assert.deepEqual(Model.dropRoll(lagging,20,seq([0,0,.9])),{level:21,type:undefined,upgrade:true});
 // A small deficit gives a small chance and a +1 jump; empty slots count as level 0.
 assert.equal(Model.dropRoll(worn(19),20,()=>.19).upgrade,true);assert.equal(Model.dropRoll(worn(19),20,()=>.21).upgrade,false);
 assert.equal(Model.dropRoll({},3,seq([0,.99,.9])).level,5);assert.equal(Model.dropRoll(worn(1000),1000,()=>0).level,1000);
 const upgraded=Model.generate(Model.dropRoll(lagging,20,seq([0,.99,.1])).level,Tree,Math.random,'boots',false,'catch-up');assert.ok(Model.validate(upgraded,Tree));
});

test('test settings scale existing enemies once, preserve health and restore zero damage',()=>{
 const {run}=fixture();
 run("enemies.push({hp:40,maxHp:80,dmg:12});combatTestSettings.health=200;combatTestSettings.damage=0;update(.1)");
 assert.equal(run('enemies[0].hp'),80);assert.equal(run('enemies[0].maxHp'),160);assert.equal(run('enemies[0].dmg'),0);
 run('update(.1);combatTestSettings.health=50;combatTestSettings.damage=200;update(.1)');
 assert.equal(run('enemies[0].hp'),20);assert.equal(run('enemies[0].dmg'),24);
 run('combatTestSettings.health=100;combatTestSettings.damage=100;update(.1)');
 assert.equal(run('enemies[0].hp'),40);assert.equal(run('enemies[0].dmg'),12);
});

test('armaduras sempre têm defesa inerente; sorteio só concede percentual; migração é idempotente',()=>{
 for(const type of ['body','head','boots'])for(const level of [1,8,1000])for(const roll of [0,.61,.9,.99]){
  const gear=Model.generate(level,Tree,()=>roll,type);assert.ok(Model.baseDefense(gear)>0);assert.equal(Model.baseDefense(gear),Math.round(10*(1+(level-1)*.12)*100)/100);
  assert.ok(gear.affixes.every(a=>a.stat!=='defense'));assert.deepEqual(Model.validate(gear,Tree),gear);
 }
 const old={...Model.generate(1,Tree,()=>0,'body'),version:2,rarity:'magic',affixes:[{stat:'defense',value:10},{stat:'mp',value:8}]};
 const upgraded=Model.validate(old,Tree);assert.ok(upgraded);assert.equal(upgraded.id,old.id);assert.deepEqual(upgraded.base,old.base);assert.deepEqual(upgraded.affixes,[{stat:'defensePercent',value:10},{stat:'mp',value:8}]);assert.deepEqual(Model.validate(upgraded,Tree),upgraded);
 const data={equipment:{body:upgraded,head:Model.generate(1,Tree,()=>0,'head'),boots:Model.generate(1,Tree,()=>0,'boots')}};assert.equal(Model.bonuses(data).defense,33);delete data.equipment.body;assert.equal(Model.bonuses(data).defense,20);
 for(const type of ['staff','grimoire','ring1','ring2'])assert.equal(Model.baseDefense(Model.generate(1,Tree,()=>0,type)),0);
});
