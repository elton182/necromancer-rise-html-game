'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/cave-balance');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
  await page.locator('#loading-start').click();await page.waitForFunction(()=>!document.getElementById('loading'));
  for(const id of ['necromancer','warrior','druid','archer','mercenary','mage','druid-wolf']){
   const result=await page.evaluate(async id=>{
    const n=NecromancerV2,{applySave,castSession}=await import('v2-session'),{startCampaign,tickAdventure}=await import('v2-campaign'),{launchPrologue}=await import('v2-prologue'),{spawnEnemy}=await import('v2-enemies'),{step}=await import('v2-model'),{toggleWolf}=await import('v2-druid');
    const made=n.store.createCharacter('Teste '+id,id==='druid-wolf'?'druid':id);if(!made.ok)throw Error(made.message);
    const save=made.save;save.campaign.started=true;save.campaign.prologue={stage:'cave',introRead:true,caveHeard:true};if(id==='druid-wolf')save.character.druidRanks={wolf:1};
    applySave(n.session,save);startCampaign(n.session,{opening:false});
    const w=n.world;w.adventure.dialogue=null;w.paused=false;
    if(id==='druid-wolf'){toggleWolf(w);for(let i=0;i<30;i++)step(w,1/60,{});}
    w.actors=[w.player];w.onEnemyDeath=null;const e=spawnEnemy(w,4,w.player.x+2,w.player.y);e.dummy=true;let casts=0;
    for(let frame=0;frame<1200&&e.hp>0;frame++){w.aim={x:e.x,y:e.y};if(castSession(n.session))casts++;step(w,1/60,{});if(!w.warriorAction&&!w.druidAction){e.x=w.player.x+2;e.y=w.player.y;}}
    const result={id,casts,hp:e.maxHp,killed:e.hp<=0};
    launchPrologue(n.session);w.adventure.dialogue=null;w.paused=false;
    if(id==='druid-wolf'){toggleWolf(w);for(let i=0;i<30;i++)step(w,1/60,{});}
    const g=w.adventure.groups[0];Object.assign(w.player,{x:g.x-5,y:g.y});tickAdventure(n.session,0);w.aim={x:g.x,y:g.y};n.cast();
    return result;
   },id);
   assert.ok(result.killed&&result.casts>=5&&result.casts<=7,JSON.stringify(result));checks.push(result);
   await page.waitForTimeout(450);await page.evaluate(()=>{NecromancerV2.world.paused=true;});
   if(id==='necromancer')await page.evaluate(async()=>{const n=NecromancerV2,{equipSession}=await import('v2-session');equipSession(n.session,5,'zombie');n.view.zoom(9999);});
   for(const ground of ['dark','light']){
    await page.evaluate(ground=>{for(const [id,value]of [['ground',ground],['quality','low']]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change'));}},ground);
    await page.waitForTimeout(150);await page.screenshot({path:path.join(dir,id+'-'+ground+'-low.png')});
   }
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(dir,'browser-result.json'),JSON.stringify({checks,errors},null,2));console.table(checks);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
