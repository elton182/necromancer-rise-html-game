'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);
  await page.evaluate(()=>{TITLE.active=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;gameState='hub';tlShow(false,false);});
  const modal=page.locator('#vil-modal'),quote=modal.locator('.say');
  async function checkLayout(){
   const portrait=await modal.locator('img').boundingBox(),speech=await quote.boundingBox(),shell=await modal.locator('.vc').boundingBox();
   const viewport=page.viewportSize();
   assert.ok(portrait.x+portrait.width<=speech.x,'Portrait must be left of the speech');
   assert.ok(shell.y>viewport.height*.35,'Conversation must remain near the bottom');
   assert.ok(viewport.height-shell.y-shell.height<=22,'Panel must sit against the bottom margin');
  }
  await page.waitForFunction(()=>['smith','elder','tilda','merch'].every(key=>SPR.ready(key)));
  for(const id of ['bram','lysa','tilda','merchant']){
   const bank=await page.evaluate(id=>NpcDialogue.lines[id],id);assert.equal(new Set(bank).size,7);
   await page.evaluate(id=>vilOpen(id),id);
   await page.waitForFunction(()=>{const i=document.querySelector('#vil-modal img');return i&&i.complete&&i.naturalWidth>0;});
   assert.equal(await page.locator('#npc-dialogue-next,#npc-dialogue-request').count(),0);
   assert.equal(await page.locator('#vm-go').isVisible(),false);
   await quote.click();assert.equal(await quote.textContent(),bank[0]);
   await page.waitForTimeout(160);assert.equal(await quote.textContent(),bank[0]);
   assert.equal(await modal.getAttribute('data-dialogue-phase'),'ambient');
   if(id==='bram')await checkLayout();
   // The next click goes straight to the mission/service, never to another social line.
   await quote.click();assert.equal(await modal.getAttribute('data-dialogue-phase'),'ready');
   assert.equal(await page.locator('#vm-go').isVisible(),true);assert.equal(await modal.locator('.offer').isVisible(),true);
   await quote.click();assert.ok((await quote.textContent()).length>20);
   if(id==='lysa'){
    await page.locator('#vm-re').click();assert.equal(await modal.getAttribute('data-dialogue-phase'),'ready');
    assert.equal(await page.locator('#vm-go').isVisible(),true);
   }
   await page.keyboard.press('Escape');assert.equal(await modal.isVisible(),false);
  }
  // All seven lines are available on separate visits, with no repeat before cycling.
  const seen=[];
  for(let i=0;i<7;i++){
   await page.evaluate(()=>vilOpen('bram'));await quote.click();seen.push(await quote.textContent());await page.keyboard.press('Escape');
  }
  assert.equal(new Set(seen).size,7);
  await page.evaluate(()=>vilOpen('merchant'));await page.waitForTimeout(120);assert.ok((await quote.textContent()).length>0);
  await page.waitForFunction(()=>document.getElementById('vil-modal').dataset.typing==='false');
  const complete=await quote.textContent();await page.waitForTimeout(160);assert.equal(await quote.textContent(),complete);
  await quote.click();await page.locator('#vm-go').click();
  assert.equal(await modal.isVisible(),false);assert.equal(await page.locator('#hub-overlay').isVisible(),true);
  await page.evaluate(()=>closeHubOverlay());
  await page.evaluate(()=>{vilOpen('bram');vilClose();vilOpen('tilda');});
  await quote.click();const text=await quote.textContent();await page.waitForTimeout(150);assert.equal(await quote.textContent(),text);
  await page.setViewportSize({width:390,height:740});await checkLayout();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await quote.focus();await page.keyboard.press('Enter');assert.equal(await modal.getAttribute('data-dialogue-phase'),'ready');
  await page.keyboard.press('Enter');assert.equal(await modal.getAttribute('data-typing'),'false');
  await page.locator('#vm-go').click();assert.equal(await modal.isVisible(),false);
  // A villager without a request closes after the single completed greeting.
  await page.evaluate(()=>{vilOpen('lysa');NpcDialogue.mount(VIL.modal,'lysa',{hasQuest:false});});
  await quote.click();await quote.click();assert.equal(await modal.isVisible(),false);
  assert.deepEqual(errors,[]);console.log('NPC dialogues passed: one greeting per visit, 7-line rotation, direct quest/service, no Next speech button, typewriter clicks, no-quest close, keyboard, mobile and mission acceptance.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
