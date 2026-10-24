'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);
  await page.waitForFunction(()=>typeof hasSave!=='undefined');
  await page.evaluate(()=>{TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;gameState='field';setPause(true);tOptions();});
  const pause=page.getByRole('checkbox',{name:'Pausar ao perder foco'}),range=page.getByRole('combobox',{name:'Alcance da horda'});
  assert.equal(await pause.isChecked(),true);assert.equal(await range.inputValue(),'16');
  await pause.uncheck();await range.selectOption('24');
  await page.evaluate(()=>{setPause(false);keys.w=true;window.dispatchEvent(new Event('blur'));});
  assert.deepEqual(await page.evaluate(()=>({paused:TITLE.paused,moving:keys.w,range:LEASH_DIST})),{paused:false,moving:false,range:24});
  await page.evaluate(()=>{setPause(true);tPause('horde');});
  await page.getByRole('combobox',{name:'Alcance da horda'}).selectOption('8');
  await page.evaluate(()=>tOptions());assert.equal(await range.inputValue(),'8');await pause.check();
  await page.evaluate(()=>{setPause(false);window.dispatchEvent(new Event('blur'));});assert.equal(await page.evaluate(()=>TITLE.paused),true);
  await page.reload();await page.waitForFunction(()=>typeof hasSave!=='undefined');
  assert.deepEqual(await page.evaluate(()=>({range:LEASH_DIST,auto:optsLoad().pauseOnBlur})),{range:8,auto:true});
  const simulation=await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=true;COMIC.active=false;CAMP.on=false;CAMP.map=false;STG.on=false;gameState='field';setBiome('village');
   const obstacles=solids,failed=[];let reached=0,crossed=0;const start=performance.now();
   // Cross every generated tree/building from both sides using actual enemy radii and movement.
   for(const p of obstacles){
    const e={x:p.x,y:p.y-5,type:{sc:1}},goal={x:p.x,y:p.y+5};
    for(const point of [e,goal]){const d=Math.hypot(point.x,point.y),limit=FIELD_R-1.5;if(d>limit){point.x*=limit/d;point.y*=limit/d;}collide(point,.43);}
    for(let i=0;i<1000;i++){moveEnemyTo(e,goal.x,goal.y,3,.03);if(solids.some(s=>Math.hypot(e.x-s.x,e.y-s.y)<s.r+.299))crossed++;if(Math.hypot(e.x-goal.x,e.y-goal.y)<.2){reached++;break;}}
    if(Math.hypot(e.x-goal.x,e.y-goal.y)>=.2)failed.push({obstacle:p,goal,x:e.x,y:e.y,near:solids.filter(s=>Math.hypot(s.x-goal.x,s.y-goal.y)<3)});
   }
   return {obstacles:obstacles.length,reached,crossed,failed,ms:Math.round(performance.now()-start)};
  });
  assert.ok(simulation.obstacles>0);assert.equal(simulation.reached,simulation.obstacles,JSON.stringify(simulation));assert.equal(simulation.crossed,0);
  assert.deepEqual(errors,[]);console.log('Browser OK: options, focus input reset, Horde menu and reload persistence; navigation:',simulation);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
