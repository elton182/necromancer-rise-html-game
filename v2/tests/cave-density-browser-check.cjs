'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/cave-density');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true'&&!document.getElementById('loading'),null,{timeout:90000});
  await page.evaluate(()=>{const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',area:'itauna-cave',entry:'mouth'};n.campaign.start();});
  await page.waitForFunction(()=>NecromancerV2.world.adventure?.area==='itauna-cave');
  const density=await page.evaluate(()=>{const groups=NecromancerV2.world.adventure.groups;return {groups:groups.length,enemies:groups.reduce((n,g)=>n+g.count*g.waves,0),reinforcements:groups.filter(g=>g.waves===2).length};});
  assert.ok(density.groups>=18);assert.ok(density.enemies>=90);assert.equal(density.reinforcements,5);
  await page.evaluate(()=>{const n=NecromancerV2,w=n.world;Object.assign(w.player,{x:60,y:-28,hp:1e6,maxHp:1e6});n.view.zoom(9999);});
  await page.waitForFunction(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy'&&a.hp>0).length>=4);
  for(const ground of ['dark','light']){
   await page.evaluate(ground=>{for(const [id,value] of [['ground',ground],['quality','low']]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change'));}},ground);
   await page.waitForTimeout(500);await page.screenshot({path:path.join(dir,'nursery-'+ground+'-low.png')});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({density,errors},null,2));console.log('Gruta ampliada, combate e qualidade baixa: OK',density);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
