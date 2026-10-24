// Inventory layout, comparison and disclosure regression. Requires Playwright in NODE_PATH.
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
   player.level=13;player.skillRanks={bolt:5,zombie:3,vigor:2};player.skillTutorialState='done';skillSync();
   const make=(id,level)=>EquipmentModel.generate(level,BuildModel,()=>.8,'staff',false,id);
   const worn=make('ui-worn',4),selected=make('ui-selected',10);
   worn.affixes=[{stat:'spell',value:5},{stat:'mp',value:20},{stat:'skill',target:'bolt',value:1}];
   selected.affixes=[{stat:'mp',value:12},{stat:'spell',value:8},{stat:'regen',value:.7}];
   player.equipment={staff:worn};player.gearBag=[selected,...Object.keys(EquipmentModel.slots).map((type,i)=>EquipmentModel.generate(8,BuildModel,()=>.7,type,false,'ui-'+i))];
   gearSelected={id:selected.id};gearOpen();
  });
  assert.equal(await page.locator('.gear-dps').evaluate(el=>el.open),false);
  const cards=page.locator('.gear-comparison-cards .gear-card');assert.equal(await cards.count(),2);
  assert.match(await cards.nth(0).innerText(),/EQUIPADO/);assert.match(await cards.nth(1).innerText(),/SELECIONADO/);
  const rows=await page.locator('.gear-item-comparison [data-affix]').evaluateAll(nodes=>nodes.map(n=>({key:n.dataset.affix,cells:n.querySelectorAll('td').length})));
  assert.equal(rows.length,4);assert.ok(rows.every(row=>row.cells===2));assert.ok(await page.locator('.gear-affix-missing').count());
  assert.ok(await page.locator('.gear-stat-changed .stat-up').count());assert.ok(await page.locator('.gear-stat-changed .stat-down').count());
  const pages=await page.locator('.gear-pages').boundingBox(),discard=await page.locator('.gear-management').boundingBox();assert.ok(discard.y>pages.y+pages.height+40);
  await page.locator('.gear-dps summary').click();assert.equal(await page.locator('.gear-dps').evaluate(el=>el.open),true);
  await page.locator('[data-gear-id="ui-0"]').click();assert.equal(await page.locator('.gear-dps').evaluate(el=>el.open),true);
  await page.locator('.gear-dps summary').click();
  await page.locator('[data-gear-id="ui-selected"]').click();
  for(const width of [1600,1440,1024,390]){
   await page.setViewportSize({width,height:width<650?844:1100});
   await page.locator('.gear-bag').scrollIntoViewIfNeeded();
   const dimensions=await page.locator('.pmbody').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
   assert.ok(dimensions.scroll<=dimensions.client+1,'Horizontal overflow at '+width);
   const layout=await page.locator('.gear-layout').boundingBox(),dps=await page.locator('.gear-dps').boundingBox();
   assert.ok(Math.abs(layout.width-dps.width)<2,'DPS must span workspace at '+width);
   for(const selector of ['.gear-bag','.gear-detail','.gear-character','.gear-stats']){
    const box=await page.locator(selector).boundingBox();assert.ok(box.width>180&&box.x>=0&&box.x+box.width<=width,selector+' outside viewport at '+width);
   }
   if(process.env.GEAR_UI_SCREENSHOTS){
    await page.screenshot({path:path.join(process.env.GEAR_UI_SCREENSHOTS,'inventory-ui-'+width+'.png')});
   }
  }
  await page.getByRole('button',{name:'Equipar · Cajado',exact:true}).click();
  assert.equal(await page.evaluate(()=>player.equipment.staff.id),'ui-selected');
  assert.deepEqual(errors,[]);console.log('Inventory UI passed: matching comparison rows, gains/losses, separated discard, persistent DPS disclosure, desktop/tablet/mobile layout and equip action.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
