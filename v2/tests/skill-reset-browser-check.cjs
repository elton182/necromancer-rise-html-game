const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/skill-reset');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
  await page.waitForFunction(()=>!document.getElementById('loading'));
  for(const classId of ['necromancer','warrior','druid','mage','archer','mercenary']){
   await page.evaluate(async id=>{
    const {applySave}=await import('v2-session'),{freshSave}=await import('v2-save');
    const api=window.NecromancerV2,save=freshSave(),menu=document.getElementById('pause-dialog');
    if(menu.open)await new Promise(resolve=>{menu.addEventListener('close',resolve,{once:true});api.ui.close();});
    save.character.classId=id;save.character.gold=1000;save.character.level=24;save.horde.profile.level=24;
    if(id==='necromancer')save.horde.profile.ranks={bolt:2};
    else{const field=id==='warrior'?'warriorRanks':id==='druid'?'druidRanks':'marksmanRanks',node={warrior:'slash',druid:'spark',mage:'bolt',archer:'shot',mercenary:'quarrel'}[id];save.character[field]={[node]:2};}
    applySave(api.session,save);api.go('training');api.ui.show('skills');
   },classId);
   const reset=page.locator('.lg-reset:visible');await reset.waitFor({state:'visible'});assert.equal(await reset.isEnabled(),true,classId);
   const before=await page.evaluate(()=>window.NecromancerV2.session.save.character.gold);
   assert.match(await reset.textContent(),/40 ouro/);
   await reset.click();assert.equal(await reset.isDisabled(),true,classId);
   assert.equal(await page.evaluate(()=>window.NecromancerV2.session.save.character.gold),before-40);
   const budget=page.locator('.wt-points b:visible');assert.equal(await budget.textContent(),'72',classId);
   await page.screenshot({path:path.join(dir,classId+'.png')});checks.push(classId);
   if(classId==='mercenary'){
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(dir,'mobile.png')});
    const rect=await reset.boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=390,'Botão visível na largura móvel');
   }
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({checks,errors},null,2));
  console.log('Redistribuição nas seis classes OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
