const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.bootReveal=[];
   window.bootProgress=[];
   let release;const barrier=new Promise(resolve=>{release=resolve;});window.releaseVisualDecode=release;
   const decode=HTMLImageElement.prototype.decode;
   HTMLImageElement.prototype.decode=function(){return decode.call(this).then(()=>barrier);};
   document.addEventListener('DOMContentLoaded',()=>new MutationObserver(()=>{
    if(window.GameVisualBoot)window.bootProgress.push(GameVisualBoot.progress);
    if(window.GameVisualBoot?.ready&&!window.bootReveal.length)
     window.bootReveal.push({player:SPR.sheets.necro.meta.artVersion,staff:SPR.sheets.playerStaff?.ok,
      village:VillageEnvironment.loaded,roles:Object.keys(CharacterVisuals.active()).length});
   }).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['class','value']}),{once:true});
  });
  await page.goto(pathToFileURL(path.resolve(process.env.NR_GAME_HTML||path.resolve(__dirname,'../necromancer-canvas.html'))).href);
  const bar=page.getByRole('progressbar',{name:'Carregamento do jogo'});
  await bar.waitFor({state:'visible'});
  const pending=await page.evaluate(()=>({ready:GameVisualBoot.ready,value:document.querySelector('#visual-boot-progress').value,total:GameVisualBoot.total}));
  assert.equal(pending.ready,false);assert.ok(pending.value>=0&&pending.value<100);assert.ok(pending.total>2);
  await page.screenshot({path:path.resolve(__dirname,'../review/visual-loading-progress.png')});
  await page.evaluate(()=>releaseVisualDecode());
  await page.waitForFunction(()=>window.GameVisualBoot?.ready&&window.bootReveal?.length).catch(async error=>{
   console.log(JSON.stringify({errors,state:await page.evaluate(()=>({boot:window.GameVisualBoot,
    text:document.getElementById('visual-boot')?.textContent,village:window.VillageEnvironment?.loaded,
    roles:window.CharacterVisuals?.active(),ready:typeof SPR==='undefined'?null:SPR.sheets.necro?.ok}))}));throw error;
  });
  const initial=await page.evaluate(()=>({reveal:bootReveal,errors:GameVisualBoot.errors,
   overlay:!!document.getElementById('visual-boot'),selector:!!document.querySelector('[aria-label="Arma do teste"]'),
   weapon:RiggedPlayerTest.weapon,visible:!document.documentElement.classList.contains('visual-loading'),
   progress:GameVisualBoot.progress,completed:GameVisualBoot.completed,total:GameVisualBoot.total,history:bootProgress}));
  assert.equal(initial.reveal[0].player,'black-outline-layered-staff-v4');
  assert.equal(initial.reveal[0].staff,true);assert.equal(initial.reveal[0].village,true);
  assert.equal(initial.reveal[0].roles,5);assert.deepEqual(initial.errors,[]);
  assert.equal(initial.overlay,false);assert.equal(initial.selector,false);assert.equal(initial.weapon,'original');assert.equal(initial.visible,true);
  assert.equal(initial.progress,100);assert.equal(initial.completed,initial.total);
  assert.ok(initial.history.every((n,i,a)=>n>=0&&n<=100&&(i===0||n>=a[i-1])));
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>SPR.sheets.necro.meta.artVersion),initial.reveal[0].player);
  await page.screenshot({path:path.resolve(__dirname,'../review/default-player-ready.png')});
  assert.deepEqual(errors,[]);console.log(JSON.stringify(initial));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
