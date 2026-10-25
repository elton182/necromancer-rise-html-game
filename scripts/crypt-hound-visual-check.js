'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Serve repository files in-process so this check needs no listening server.
  await page.route('http://crypt-hound.test/**',route=>{
   const pathname=new URL(route.request().url()).pathname,root=path.resolve(__dirname,'..'),file=path.resolve(root,'.'+pathname);
   if(!file.startsWith(root+path.sep))return route.abort();
   const contentType=file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':'application/octet-stream';
   return route.fulfill({contentType,body:fs.readFileSync(file)});
  });
  await page.goto('http://crypt-hound.test/tools/combat-lab.html');await page.waitForFunction(()=>CombatLab.ready);
  await page.selectOption('#skill','hound');await page.selectOption('#enemy','cryptHound');await page.selectOption('#crowd','32');await page.selectOption('#quality','baixa');await page.selectOption('#zoom','24');
  await page.uncheck('#repeat');
  for(const background of ['dark','light']){
   await page.selectOption('#background',background);
   for(const [phase,t]of [['windup',.5],['charge',.95],['recovery',1.5]]){
    await page.locator('#scrub').evaluate((el,t)=>{el.value=t/2.7;el.dispatchEvent(new Event('input'));},t);
    await page.waitForTimeout(60);
    await page.screenshot({path:path.resolve(__dirname,`../review/crypt-hound-${background}-${phase}.png`),fullPage:true});
   }
  }
  await page.selectOption('#crowd','0');await page.selectOption('#background','dark');await page.locator('#scrub').evaluate(el=>{el.value=.2;el.dispatchEvent(new Event('input'));});await page.waitForTimeout(60);
  await page.screenshot({path:path.resolve(__dirname,'../review/crypt-hound-isolated.png'),fullPage:true});
  const metrics=await page.evaluate(async()=>{
   const ctx=document.getElementById('after').getContext('2d'),config={...CombatLab.settings(),light:false,skill:'bolt',crowd:32,u:24,low:true};
   const samples={before:[],after:[]};
   for(let i=0;i<150;i++){await new Promise(requestAnimationFrame);for(const version of ['before','after']){
    const start=performance.now();CombatLab.drawScene(ctx,'new',i/60,{...config,hounds:version==='after'});
    if(i>=30)samples[version].push(performance.now()-start);}
   }
   const report={scene:'32 enemies + 6 allies + 2 main characters, 24 px/u, low quality, Edge headless; one panel, draw dispatch only, excludes GPU completion and full game update',samples:120};
   for(const key of ['before','after']){const s=samples[key].sort((a,b)=>a-b);report[key]={medianMs:s[60],p95Ms:s[114]};}
   return report;
  });
  assert.deepEqual(errors,[]);fs.writeFileSync(path.resolve(__dirname,'../review/crypt-hound-performance.json'),JSON.stringify({metrics,errors},null,2));
  console.log(JSON.stringify({metrics,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
