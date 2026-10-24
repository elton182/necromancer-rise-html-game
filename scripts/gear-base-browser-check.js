// Actual spell hit and saved-item migration regression. Requires Playwright in NODE_PATH.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof hasSave!=='undefined');
  const result=await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='hub';
   player.level=12;player.skillRanks={bolt:5,zombie:2,vigor:2,burst:2};player.skillTutorialState='done';player.equipment={};skillSync();
   const staff={...EquipmentModel.generate(12,BuildModel,()=>.65,'staff',false,'flat-staff'),base:{stat:'spellFlat',value:25},affixes:[{stat:'spell',value:10},{stat:'mp',value:10}]};
   player.gearBag=[staff];gearSelected={id:staff.id};gearOpen();
   const preview=EquipmentModel.snapshot(BuildModel,player,MINION_DEFS,COMBAT_TUNING,{staff});
   gearEquip(staff.id,'staff');setPause(false);gameState='field';player.mp=player.maxMp;player.spellCooldowns.raio=0;castRaio(P.x+2,P.y);gameState='hub';
   return {spell:player.spellDmg,hit:boltsFx.at(-1).dmg,preview:preview.skills.find(s=>s.id==='raio').damage};
  });
  assert.deepEqual(result,{spell:120,hit:90,preview:90});
  await page.evaluate(()=>{gearSelected={slot:'staff'};tPause('equipment');});
  assert.match(await page.locator('.gear-base').innerText(),/\+25 Dano mágico base/);
  assert.match(await page.locator('.gear-detail').innerText(),/\+10% Dano mágico/);
  const migrated=await page.evaluate(()=>{
   const legacy={...player.equipment.staff,version:1,base:{stat:'spell',value:9.28}};
   player.equipment.staff=legacy;saveGame();loadGame();
   const first=JSON.stringify(player.equipment);saveGame();loadGame();
   return {same:first===JSON.stringify(player.equipment),id:player.equipment.staff.id,base:player.equipment.staff.base,affixes:player.equipment.staff.affixes.length,spell:player.spellDmg};
  });
  assert.deepEqual(migrated,{same:true,id:'flat-staff',base:{stat:'spellFlat',value:26},affixes:2,spell:121});
  assert.deepEqual(errors,[]);console.log('Browser OK: flat + percent base produces actual 90-damage hit, comparison and old-save conversion agree.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
