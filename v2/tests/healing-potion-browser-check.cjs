const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/healing-potion');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
  await page.waitForFunction(()=>!document.getElementById('loading'));
  await page.evaluate(async()=>{
   const api=window.NecromancerV2;api.go('training');
   const w=api.session.world;w.actors=w.actors.filter(a=>a.team!=='enemy');w.player.hpRegen=0;w.player.hp=w.player.maxHp*.1;
  });
  const button=page.locator('#healing-potion');await button.waitFor({state:'visible'});
  await page.keyboard.press('b');
  await page.waitForFunction(()=>document.getElementById('potion-sips').textContent==='2/3');
  assert.equal(await button.isDisabled(),true);
  await page.keyboard.press('b');
  assert.equal(await page.evaluate(()=>window.NecromancerV2.session.world.potionCharge),20);
  await page.waitForFunction(()=>!window.NecromancerV2.session.world.potionHeal,null,{timeout:15000});
  const fraction=await page.evaluate(()=>{const p=window.NecromancerV2.session.world.player;return p.hp/p.maxHp;});
  assert.ok(Math.abs(fraction-.6)<.002,'cura real de 50% em cinco segundos');
  await button.click();
  assert.equal(await page.evaluate(()=>window.NecromancerV2.session.world.potionCharge),10);
  await page.evaluate(async()=>{
   const s=window.NecromancerV2.session;const {rewardKill}=await import('v2-rewards');
   for(let i=0;i<7;i++){const enemy={xp:1};rewardKill(s,enemy);rewardKill(s,enemy);}
   s.world.potionHeal=null;s.world.player.hp=s.world.player.maxHp*.4;
  });
  await page.waitForFunction(()=>document.getElementById('potion-status').textContent==='7/10 para +1 gole');
  assert.equal(await page.evaluate(()=>window.NecromancerV2.session.world.potionCharge),17);
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   await page.setViewportSize(viewport);
   for(const ground of ['light','dark']){
    await page.evaluate(async ground=>{
     const api=window.NecromancerV2,{updateSettings}=await import('v2-session');
     updateSettings(api.session,{ground,quality:'low'});
     document.getElementById('ground').value=ground;document.getElementById('ground').dispatchEvent(new Event('change'));
     document.getElementById('quality').value='low';document.getElementById('quality').dispatchEvent(new Event('change'));
    },ground);
    const bounds=await button.evaluate(el=>{
     const r=el.getBoundingClientRect(),h=document.getElementById('hud').getBoundingClientRect();
     const point=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
     return {x:r.x,y:r.y,width:r.width,height:r.height,insideHud:r.top>=h.top&&r.bottom<=h.bottom,clickable:point===el||el.contains(point)};
    });
    assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width&&bounds.y+bounds.height<=viewport.height);
    assert.ok(bounds.clickable,'botão sem sobreposição');assert.ok(bounds.insideHud,'encaixado dentro do HUD');
    await page.screenshot({path:path.join(dir,viewport.width+'-'+ground+'.png')});checks.push({viewport,ground,bounds});
   }
  }
  await page.evaluate(()=>{window.NecromancerV2.session.world.player.hp=window.NecromancerV2.session.world.player.maxHp;});
  await page.waitForFunction(()=>document.getElementById('healing-potion').disabled);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({fraction,checks,errors},null,2));
  console.log('Poção: tecla, clique, cura, recarga e HUD desktop/mobile OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
