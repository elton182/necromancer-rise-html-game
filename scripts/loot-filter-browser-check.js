'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);
  await page.waitForFunction(()=>typeof hasSave!=='undefined');
  await page.evaluate(()=>tOptions());
  const select=page.getByRole('combobox',{name:'Raridade mínima do loot'});
  await select.selectOption('rare');
  assert.equal(await page.evaluate(()=>optsLoad().lootMinRarity),'rare');
  await page.reload();await page.waitForFunction(()=>typeof hasSave!=='undefined');
  await page.evaluate(()=>tOptions());assert.equal(await select.inputValue(),'rare');
  await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='hub';
   player.skillTutorialState='done';gearOpen();
  });
  assert.equal(await select.inputValue(),'rare');
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:width===390?844:1000});
   await select.scrollIntoViewIfNeeded();
   const box=await select.boundingBox();assert.ok(box.width>100&&box.x>=0&&box.x+box.width<=width);
   assert.equal(await page.locator('.pmbody').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  }
  await select.selectOption('magic');
  assert.deepEqual(await page.evaluate(()=>{
   setPause(false);gameState='field';player.gearBag=[];
   droppedItems=['common','magic','rare','epic'].map((rarity,i)=>({type:'equipment',item:{...EquipmentModel.generate(1,BuildModel,()=>0,'staff',false,'filter-'+i),rarity},mesh:mkMesh2(P.x,P.y),life:Infinity,t:0}));
   checkPickups(.01);
   return {collected:player.gearBag.map(i=>i.rarity),remaining:droppedItems.map(d=>d.item.rarity)};
  }),{collected:['magic','rare','epic'],remaining:['common']});
  assert.deepEqual(errors,[]);console.log('OK loot filter: options, inventory, reload, desktop/mobile layout and proximity collection');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
