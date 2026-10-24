// Native mouse drag regression. Requires Playwright in NODE_PATH.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof hasSave!=='undefined');
  await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='hub';
   player.level=12;player.skillRanks={bolt:5,zombie:2,vigor:2};player.skillTutorialState='done';player.equipment={};skillSync();
   player.gearBag=['staff','ring1','boots'].map((type,i)=>EquipmentModel.generate(12,BuildModel,()=>.65,type,false,'drag-'+i));
   player.equipment.staff=EquipmentModel.generate(2,BuildModel,()=>.1,'staff',false,'old-staff');
   player.equipment.ring2=EquipmentModel.generate(2,BuildModel,()=>.1,'ring2',false,'old-ring');
   gearSelected=null;gearOpen();
  });
  const state=()=>page.evaluate(()=>JSON.stringify([player.gearBag,player.equipment]));
  const start=async id=>{
   const cell=page.locator('[data-gear-id="'+id+'"]');await cell.scrollIntoViewIfNeeded();const b=await cell.boundingBox();
   await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
   await page.mouse.move(b.x+b.width/2+14,b.y+b.height/2,{steps:5});
   await page.waitForSelector('.gear-dragging');
  };
  const hover=async slot=>{
   const b=await page.locator('[data-gear-slot="'+slot+'"]').boundingBox();
   await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});
  };
  const clean=async()=>{
   assert.equal(await page.locator('.gear-dragging,.gear-drop-compatible,.gear-drop-hover,.gear-drag-source').count(),0);
   assert.equal(await page.locator('.gear-dps').count(),1);
  };
  let before=await state();
  await start('drag-0');assert.equal(await page.locator('.gear-drop-compatible').count(),1);
  await hover('boots');assert.equal(await page.locator('.gear-drop-hover').count(),0);
  await page.mouse.up();await clean();assert.equal(await state(),before);
  await start('drag-0');await hover('staff');
  assert.equal(await page.locator('.gear-drop-hover').getAttribute('data-gear-slot'),'staff');
  assert.match(await page.locator('.gear-stat-heading').innerText(),/equipar em Cajado/);
  assert.equal(await state(),before); // Hover only previews.
  await page.mouse.up();await clean();
  assert.equal(await page.evaluate(()=>player.equipment.staff.id),'drag-0');
  assert.equal(await page.locator('[data-gear-id="old-staff"]').count(),1);
  before=await state();await start('drag-1');
  assert.equal(await page.locator('.gear-drop-compatible').count(),2);
  await hover('ring1');assert.match(await page.locator('.gear-stat-heading').innerText(),/anel esquerdo/i);
  await hover('ring2');assert.match(await page.locator('.gear-stat-heading').innerText(),/anel direito/i);
  if(process.env.GEAR_DRAG_SCREENSHOT)await page.screenshot({path:process.env.GEAR_DRAG_SCREENSHOT});
  assert.equal(await state(),before);await page.mouse.up();await clean();
  assert.equal(await page.evaluate(()=>player.equipment.ring2.id),'drag-1');
  assert.equal(await page.locator('[data-gear-id="old-ring"]').count(),1);
  before=await state();const heading=await page.locator('.gear-stat-heading').innerText();
  await start('drag-2');await hover('boots');await page.keyboard.press('Escape');await page.mouse.up();await clean();
  assert.equal(await state(),before);assert.equal(await page.locator('.gear-stat-heading').innerText(),heading);
  await start('drag-2');await page.mouse.move(3,3,{steps:10});await page.mouse.up();await clean();assert.equal(await state(),before);
  // Both ring types can target either hand; replacement works even with a full bag and from Bolsa II.
  await page.evaluate(()=>{
   player.gearBag=Array.from({length:60},(_,i)=>EquipmentModel.generate(3,BuildModel,()=>.1,i===59?'ring2':'head',false,'full-'+i));
   player.equipment.ring1=EquipmentModel.generate(2,BuildModel,()=>.1,'ring1',false,'full-old-ring');
   gearPage=1;tPause('equipment');
  });
  await start('full-59');await hover('ring1');await page.mouse.up();await clean();
  assert.equal(await page.evaluate(()=>player.equipment.ring1.id),'full-59');
  assert.equal(await page.evaluate(()=>player.gearBag.length),60);
  assert.equal(await page.evaluate(()=>player.gearBag.some(i=>i.id==='full-old-ring')),true);
  await start('full-58');await hover('head');await page.mouse.up();await clean();
  assert.equal(await page.evaluate(()=>player.equipment.head.id),'full-58');
  // Existing click-to-equip remains available.
  await page.locator('[data-gear-id="full-57"]').click();
  await page.getByRole('button',{name:'Equipar · Capuz',exact:true}).click();
  assert.equal(await page.evaluate(()=>player.equipment.head.id),'full-57');
  assert.deepEqual(errors,[]);console.log('Equipment drag: compatible targets, previews, swaps, rings, cancellation, full bag, Bolsa II and click fallback passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
