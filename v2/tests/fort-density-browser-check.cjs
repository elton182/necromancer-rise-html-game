'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/fort-density');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  if(await page.locator('#loading-start').isVisible())await page.locator('#loading-start').click();
  await page.waitForFunction(()=>!document.getElementById('loading'));
  await page.evaluate(()=>{const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',area:'itauna-fort',entry:'gate'};n.campaign.start();});
  await page.waitForFunction(()=>NecromancerV2.world.adventure?.area==='itauna-fort');
  const density=await page.evaluate(()=>{const groups=NecromancerV2.world.adventure.groups;return {groups:groups.length,enemies:groups.reduce((n,g)=>n+g.count*g.waves,0),reinforcements:groups.filter(g=>g.waves===2).length};});
  assert.ok(density.groups>=12);assert.ok(density.enemies>=200);assert.equal(density.reinforcements,6);
  await page.evaluate(()=>{const n=NecromancerV2,w=n.world;Object.assign(w.player,{x:42,y:40,hp:1e6,maxHp:1e6});n.view.zoom(9999);});
  await page.waitForFunction(()=>NecromancerV2.world.actors.some(a=>a.worldGroup==='fort-east'&&a.typeIndex===3&&a.hp>0));
  assert.equal(await page.evaluate(()=>NecromancerV2.world.arena.gates[0].open),false);
  for(const ground of ['dark','light']){
   await page.evaluate(ground=>{for(const [id,value] of [['ground',ground],['quality','low']]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change'));}},ground);
   await page.waitForTimeout(500);await page.screenshot({path:path.join(dir,'yard-'+ground+'-low.png')});
  }
  await page.evaluate(()=>NecromancerV2.session.save.campaign.world.cleared.push('fort-gate','fort-west','fort-east'));
  await page.waitForFunction(()=>NecromancerV2.world.arena.gates[0].open);
  await page.evaluate(()=>Object.assign(NecromancerV2.world.player,{x:0,y:-18}));
  await page.waitForFunction(()=>NecromancerV2.world.actors.filter(a=>a.worldGroup==='fort-captain'&&a.hp>0).length===10);
  await page.screenshot({path:path.join(dir,'captain.png')});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({density,errors},null,2));console.log('Forte ampliado, magos, grade e qualidade baixa: OK',density);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
