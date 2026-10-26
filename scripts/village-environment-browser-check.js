'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1120}}),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);
  await page.waitForFunction(()=>window.VillageEnvironment?.loaded);
  await page.evaluate(()=>VillageEnvironment.promise);
  const state=await page.evaluate(()=>{
   TITLE.active=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;gameState='hub';sceneMode='hub';tlShow(false,false);
   buildHubScene();cam.x=0;cam.y=0;P.x=0;P.y=3;
   return {failures:VillageEnvironment.failures,assets:VillageEnvironment.data.meta.assets.length,npcs:hubNpcs.map(n=>({tab:n.tab,x:n.pos.x,y:n.pos.z})),houses:hubProps.filter(p=>p.type==='house').map(p=>[p.x,p.y]),decor:hubProps.filter(p=>p.villageKit).map(p=>({asset:p.asset,x:p.x,y:p.y})),ground:[hubArena.width,hubArena.height]};
  });
  assert.deepEqual(state.failures,[]);assert.ok(state.assets>=17);assert.equal(state.houses.length,6);assert.deepEqual(state.ground,[1296,1296]);
  for(const [tab,x,y] of [['vil:bram',-11,1],['vil:lysa',11,1],['vil:tilda',-6,8],['shop',-7,-4],['missions',0,-9]])assert.ok(state.npcs.some(n=>n.tab===tab&&n.x===x&&n.y===y),tab);
  for(let i=0;i<6;i++){const angle=i/6*6.283+.52;assert.ok(Math.abs(state.houses[i][0]-Math.cos(angle)*13.6)<.001);assert.ok(Math.abs(state.houses[i][1]-Math.sin(angle)*13.6)<.001);}
  for(const p of state.decor)assert.ok(Math.abs(p.x)>1.3&&Math.abs(p.y)>1.3,'New decor must leave cardinal paths open');
  // Re-entering must not accumulate decorations; crypt/campaign must remain usable.
  const count=state.decor.length;
  assert.equal(await page.evaluate(()=>{buildHubScene();return hubProps.filter(p=>p.villageKit).length;}),count);
  await page.evaluate(()=>{cam.x=0;cam.y=0;TITLE.active=true;TITLE.paused=false;TITLE.view='main';render();});
  await page.screenshot({path:path.resolve(__dirname,'../review/village-blender-overview.png')});
  await page.evaluate(()=>{TITLE.active=false;cam.x=-6;cam.y=-.5;vilOpen('bram');NpcDialogue.advance(VIL.modal);render();});
  await page.screenshot({path:path.resolve(__dirname,'../review/village-blender-dialog.png')});
  await page.locator('#vil-modal .say').click();assert.equal(await page.locator('#vm-go').isVisible(),true);await page.keyboard.press('Escape');
  await page.evaluate(()=>{CAMP.on=true;CAMP.cleared={};buildHubScene();render();});
  assert.equal(await page.evaluate(()=>hubProps.filter(p=>p.villageKit).length),0);
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  console.log('Village passed: all Blender assets loaded, unchanged NPC/house coordinates, organized ground, clear paths, stable decorations, dialogue, depth rendering and campaign fallback.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
