// Deterministic HUD click regression and inventory safeguards. Requires Playwright in NODE_PATH.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof gearDiscardAll==='function'&&typeof hasSave!=='undefined');
  await page.evaluate(()=>{
   TITLE.active=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='hub';setPause(false);tlShow(false,false);document.body.classList.remove('titling','camp','camp-nosum');
   player.level=30;player.skillRanks={zombie:3,vigor:2,abom:3,burst:2,colossus:1};player.skillTutorialState='done';skillSync();
   player.actionLoadout=['raio','zombie','dash','abom','empty','empty'];renderActionSlots();
  });
  for(let i=0;i<6;i++){
   const slot=page.locator('[data-action-slot="'+i+'"]');
   const box=await slot.boundingBox();assert.ok(box);
   await page.evaluate(i=>{window.testSlot=document.querySelector('[data-action-slot="'+i+'"]');},i);
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   await page.evaluate(()=>{player.mp-=1;player.spellCooldowns.raio=3;renderActionSlots();});
   assert.equal(await page.evaluate(i=>window.testSlot===document.querySelector('[data-action-slot="'+i+'"]'),i),true);
   await page.mouse.up();
   assert.equal(await page.evaluate(()=>summonWheelOpen),true);assert.equal(await page.evaluate(()=>actionSelection),i);
   await page.evaluate(()=>closeSummonPicker());
  }
  for(const key of ['Enter','Space']){
   await page.locator('[data-action-slot="0"]').focus();await page.keyboard.press(key);
   assert.equal(await page.evaluate(()=>summonWheelOpen),true);await page.evaluate(()=>closeSummonPicker());
  }
  await page.evaluate(()=>{
   player.gearBag=['staff','boots'].map((type,i)=>EquipmentModel.generate(12,BuildModel,()=>.5,type,false,'discard-'+i));
   player.equipment={body:EquipmentModel.generate(12,BuildModel,()=>.5,'body',false,'keep-body')};
   player.inventory=[{type:'hp',count:2}];window.keepInventory=JSON.stringify(player.inventory);gearOpen();
  });
  await page.waitForFunction(()=>{const img=document.querySelector('.menu-portrait');return img&&img.complete&&img.naturalWidth>0;});
  await page.getByRole('button',{name:'Descartar tudo da mochila',exact:true}).click();
  assert.equal(await page.evaluate(()=>player.gearBag.length),2);
  await page.getByRole('button',{name:'✕ CANCELAR',exact:true}).click();
  assert.equal(await page.evaluate(()=>player.gearBag.length),2);
  await page.getByRole('button',{name:'Descartar tudo da mochila',exact:true}).click();
  await page.getByRole('button',{name:'DESCARTAR 2 PEÇAS',exact:true}).click();
  assert.equal(await page.evaluate(()=>player.gearBag.length),0);
  assert.equal(await page.evaluate(()=>player.equipment.body.id),'keep-body');
  assert.equal(await page.evaluate(()=>JSON.stringify(player.inventory)===window.keepInventory),true);
  assert.equal(await page.getByRole('button',{name:'Descartar tudo da mochila',exact:true}).isDisabled(),true);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).gearBag.length),0);
  assert.deepEqual(errors,[]);
  console.log('Browser OK: all six slots survive HUD refresh during clicks; keyboard, portrait and discard safeguards pass.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
