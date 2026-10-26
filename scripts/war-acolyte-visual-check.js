'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://war-acolyte.test/**',route=>{
   const root=path.resolve(__dirname,'..'),file=path.resolve(root,'.'+new URL(route.request().url()).pathname);
   if(!file.startsWith(root+path.sep))return route.abort();
   return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':'application/octet-stream'});
  });
  await page.goto('http://war-acolyte.test/tools/combat-lab.html');await page.waitForFunction(()=>CombatLab.ready);
  await page.selectOption('#skill','acolyte');await page.selectOption('#enemy','warAcolyte');await page.selectOption('#quality','baixa');await page.selectOption('#zoom','24');
  await page.uncheck('#repeat');
  for(const background of ['dark','light']){
   await page.selectOption('#background',background);await page.selectOption('#crowd','32');
   for(const [phase,t]of [['windup',.6],['channel',1.6],['interrupted',3]]){
    await page.locator('#scrub').evaluate((el,t)=>{el.value=t/6;el.dispatchEvent(new Event('input'));},t);
    await page.waitForTimeout(80);
    await page.screenshot({path:path.resolve(__dirname,`../review/war-acolyte-${background}-${phase}.png`),fullPage:true});
   }
  }
  await page.selectOption('#crowd','0');await page.selectOption('#zoom','36');
  await page.locator('#scrub').evaluate(el=>{el.value=.5;el.dispatchEvent(new Event('input'));});await page.waitForTimeout(80);
  await page.screenshot({path:path.resolve(__dirname,'../review/war-acolyte-isolated.png'),fullPage:true});
  const metrics=await page.evaluate(async()=>{
   const c=document.getElementById('after').getContext('2d'),config={...CombatLab.settings(),u:24,crowd:32,low:true},samples={active:[],interrupted:[]};
   for(let i=0;i<150;i++){
    await new Promise(requestAnimationFrame);
    for(const [key,version]of [['active','old'],['interrupted','new']]){
     const start=performance.now();CombatLab.drawScene(c,version,3,config);
     if(i>=30)samples[key].push(performance.now()-start);
    }
   }
   const report={scene:'42 characters per panel: 32 enemies, 6 allies, priest, 2 supported soldiers and player; 24 px/u, low quality, Edge headless. CPU draw dispatch; excludes GPU completion and full game update.',samples:120};
   for(const [key,values]of Object.entries(samples)){values.sort((a,b)=>a-b);report[key]={medianMs:values[60],p95Ms:values[114]};}
   return report;
  });
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.resolve(__dirname,'../review/war-acolyte-performance.json'),JSON.stringify({metrics,errors},null,2));console.log(JSON.stringify({metrics,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
