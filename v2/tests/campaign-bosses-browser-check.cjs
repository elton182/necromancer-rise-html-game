'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/campaign-bosses');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[],result={};
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  if(await page.locator('#loading-start').isVisible())await page.locator('#loading-start').click();await page.waitForFunction(()=>!document.getElementById('loading'));
  const shot=async name=>{await page.waitForTimeout(200);await page.screenshot({path:path.join(dir,name+'.png')});};
  const start=async area=>{await page.evaluate(area=>{const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',nilo:area==='cedro'?'done':'cave',cedro:'active',smith:'done',lumber:'done',portalUnlocked:true,passengerMissing:true,area,entry:area==='cedro'?'camp':'mouth'};n.campaign.start();Object.assign(n.world.player,{x:area==='cedro'?80:-40,y:area==='cedro'?-111:-50,hp:1e7,maxHp:1e7});n.view.zoom(9999);},area);};
  await start('itauna-cave');await page.waitForFunction(()=>NecromancerV2.world.actors.some(a=>a.caveQueen));
  result.queen=await page.evaluate(()=>{const e=NecromancerV2.world.actors.find(a=>a.caveQueen);return {hp:e.maxHp,damage:e.dmg,scale:e.scale,radius:e.radius};});assert.equal(result.queen.scale,2.6);assert.ok(result.queen.hp>2000);
  await page.waitForFunction(()=>document.querySelector('#boss-bar strong').textContent==='MÃE-TECELÃ');
  await page.evaluate(()=>Object.assign(NecromancerV2.world.player,{x:-43,y:-66}));await page.keyboard.press('g');await page.locator('[data-view="world-dialogue"]').waitFor();assert.equal(await page.getByRole('button',{name:/Libertar João/}).count(),0);await shot('rescue-blocked');await page.getByRole('button',{name:'Fechar conversa',exact:true}).click();
  await page.evaluate(()=>{const w=NecromancerV2.world,e=w.actors.find(a=>a.caveQueen);w.player.x=e.x+6;w.player.y=e.y+3;e.queen={action:null,step:1,cooldown:0,broods:0};});
  await page.waitForFunction(()=>NecromancerV2.world.hostileZones.some(z=>z.bossOwned));
  await page.evaluate(async()=>{const {useProfile}=await import('v2-session'),{TEST_PROFILE,equipGroup}=await import('v2-horde'),n=NecromancerV2;useProfile(n.session,TEST_PROFILE);equipGroup(n.world,0,'zombie',{preparation:true});n.world.player.hp=n.world.player.maxHp=1e7;n.world.paused=true;});
  for(const ground of ['dark','light']){await page.evaluate(ground=>{for(const [id,value] of [['ground',ground],['quality','low']]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change'));}},ground);await shot('queen-venom-'+ground+'-low-horde');}
  await page.evaluate(()=>{const w=NecromancerV2.world,e=w.actors.find(a=>a.caveQueen);w.actors=w.actors.filter(a=>a.team!=='ally');e.hp=e.maxHp*.45;e.queen={action:null,step:2,cooldown:0,broods:2};w.paused=false;});
  await page.waitForFunction(()=>(()=>{const a=NecromancerV2.world.actors.find(a=>a.caveQueen)?.queen?.action;return a?.kind==='web'&&a.time>.15;})());await page.evaluate(()=>NecromancerV2.world.paused=true);await shot('queen-web-fan');
  await page.evaluate(()=>{const w=NecromancerV2.world,e=w.actors.find(a=>a.caveQueen);e.hp=e.maxHp*.6;e.queen={action:null,step:0,cooldown:0,broods:0};w.paused=false;});
  await page.waitForFunction(()=>NecromancerV2.world.actors.filter(a=>a.queenOwner).length>=3);await shot('queen-brood');
  await page.evaluate(async()=>{const {dealDamage}=await import('v2-combat'),n=NecromancerV2,w=n.world;for(const e of [...w.actors])if(e.worldGroup==='cave-queen'&&e.hp>0)dealDamage(w,e,1e8,w.player);});
  await page.waitForFunction(()=>NecromancerV2.session.save.campaign.world.cleared.includes('cave-queen'));await page.waitForFunction(()=>!NecromancerV2.world.hostileZones.some(z=>z.bossOwned));
  await page.evaluate(()=>Object.assign(NecromancerV2.world.player,{x:-43,y:-66,hp:1e7,maxHp:1e7}));await page.keyboard.press('g');await page.locator('[data-view="world-dialogue"]').waitFor();await shot('rescue-unlocked');await page.getByRole('button',{name:/Libertar João/}).click();assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.world.nilo),'rescued');
  await start('cedro');await page.waitForFunction(()=>NecromancerV2.world.actors.some(a=>a.cedroBoss));
  result.bento=await page.evaluate(()=>{const w=NecromancerV2.world,e=w.actors.find(a=>a.cedroBoss);w.actors=w.actors.filter(a=>a.team!=='ally');w.player.x=e.x+12;w.player.y=e.y;e.bento={action:null,step:0,cooldown:0,reserve:true};return {hp:e.maxHp,damage:e.dmg,speed:e.spd};});
  await page.waitForFunction(()=>NecromancerV2.world.actors.find(a=>a.cedroBoss)?.bento.action?.kind==='charge');await page.evaluate(()=>NecromancerV2.world.paused=true);await shot('bento-charge');
  await page.evaluate(()=>{const w=NecromancerV2.world,e=w.actors.find(a=>a.cedroBoss);w.player.x=e.x+3;w.player.y=e.y;e.hp=e.maxHp*.6;e.bento={action:null,step:0,cooldown:0,reserve:true};w.paused=false;});
  await page.waitForFunction(()=>{const a=NecromancerV2.world.actors.find(a=>a.cedroBoss)?.bento.action;return a?.kind==='sweep'&&a.chain===0&&a.time>.15;});await page.evaluate(()=>NecromancerV2.world.paused=true);await shot('bento-second-sweep');
  await page.evaluate(()=>{const w=NecromancerV2.world,e=w.actors.find(a=>a.cedroBoss);e.hp=e.maxHp*.4;e.bento={action:null,step:0,cooldown:0,reserve:false};w.paused=false;});
  await page.waitForFunction(()=>NecromancerV2.world.actors.filter(a=>a.bentoReserve).length===6);await shot('bento-reserve');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);result.errors=errors;result.remote=remote;fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log('Bento e Mãe-Tecelã: comportamento, apresentação e resgate OK',result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
