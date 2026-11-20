'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/assault-pacing');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[],result={};
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  if(await page.locator('#loading-start').isVisible())await page.locator('#loading-start').click();
  await page.waitForFunction(()=>!document.getElementById('loading'));
  const start=async area=>{
   await page.evaluate(area=>{const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',nilo:area==='cedro'?'done':'fort',cedro:'active',smith:'done',lumber:'done',portalUnlocked:true,passengerMissing:true,area,entry:area==='cedro'?'village':'gate'};n.campaign.start();n.world.player.hp=n.world.player.maxHp=1e7;n.view.zoom(9999);},area);
   await page.waitForFunction(area=>NecromancerV2.world.adventure.area===area,area);
  };
  const shot=async name=>{await page.waitForTimeout(250);await page.screenshot({path:path.join(dir,name+'.png')});};
  const move=async(x,y)=>{await page.evaluate(({x,y})=>{const w=NecromancerV2.world;Object.assign(w.player,{x,y,hp:1e7,maxHp:1e7});}, {x,y});await page.waitForTimeout(250);};
  const density=()=>page.evaluate(()=>{const gs=NecromancerV2.world.adventure.groups;return {groups:gs.length,enemies:gs.reduce((n,g)=>n+g.count*g.waves,0),reinforcements:gs.filter(g=>g.waves>1).length};});
  const killCurrent=async id=>page.evaluate(async id=>{const {dealDamage}=await import('v2-combat'),{tickWorld}=await import('v2-campaign-world'),n=NecromancerV2;for(const a of [...n.world.actors])if(a.worldGroup===id&&a.hp>0)dealDamage(n.world,a,1e8,n.world.player);tickWorld(n.session,.05);},id);
  const clear=async id=>{
   await page.evaluate(id=>{const w=NecromancerV2.world,g=w.adventure.groups.find(g=>g.id===id);w.player.x=g.x;w.player.y=g.y;},id);
   await page.waitForFunction(id=>NecromancerV2.world.adventure.groups.find(g=>g.id===id)?.state==='active',id);
   await page.evaluate(async id=>{const {dealDamage}=await import('v2-combat'),{tickWorld}=await import('v2-campaign-world'),n=NecromancerV2,w=n.world,g=w.adventure.groups.find(g=>g.id===id);for(let i=0;i<5&&g.state!=='clear';i++){for(const a of [...w.actors])if(a.worldGroup===id&&a.hp>0)dealDamage(w,a,1e8,w.player);tickWorld(n.session,.05);if(g.state==='between')tickWorld(n.session,g.interval+.1);}},id);
   assert.equal(await page.evaluate(id=>NecromancerV2.world.adventure.groups.find(g=>g.id===id).state,id),'clear');
  };
  const target=()=>page.evaluate(async()=>{const {areaObjectives}=await import('v2-itauna-model'),n=NecromancerV2;return areaObjectives(n.world.adventure.area,n.session.save.campaign.world)[0].target;});
  const collect=async(x,y,label)=>{await move(x+1,y);await page.keyboard.press('g');await page.locator('[data-view="world-dialogue"]').waitFor();await page.getByRole('button',{name:label}).click();await page.locator('[data-view="world-dialogue"]').waitFor({state:'detached'});};
  await start('itauna-fort');result.fort=await density();assert.ok(result.fort.enemies>=200);assert.equal((await target()).id,'fort-gate');await page.waitForFunction(()=>document.querySelector('[data-quest-marker="⚔"]'));assert.ok(await page.locator('#campaign-panel>p').first().evaluate(e=>e.scrollHeight<=e.clientHeight+2),'instrução da grade sem truncar');await shot('fort-entry');
  await killCurrent('fort-gate');await page.waitForFunction(()=>NecromancerV2.world.adventure.groups.find(g=>g.id==='fort-gate').state==='between');
  await page.waitForFunction(()=>document.querySelector('#campaign-panel').textContent.includes('Contra-ataque chegando'));
  await shot('fort-counterattack');await page.waitForFunction(()=>NecromancerV2.world.adventure.groups.find(g=>g.id==='fort-gate').waveNumber===2,null,{timeout:15000});
  assert.equal((await target()).id,'fort-gate');await clear('fort-gate');assert.equal((await target()).id,'fort-west');
  await clear('fort-west');assert.equal((await target()).id,'fort-east');await clear('fort-east');
  await page.waitForFunction(()=>NecromancerV2.world.arena.gates[0].open);await move(0,12);await shot('fort-gate-open');
  await clear('fort-captain');assert.equal((await target()).name,'Mesa do capitão');await shot('fort-contract-objective');
  await collect(0,-34,/Guardar o contrato/);assert.match((await target()).name,/Bolsa/);await collect(44,-28,/Recuperar a bolsa/);
  assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.world.nilo),'return');
  await start('cedro');result.cedro=await density();assert.ok(result.cedro.enemies>=300);await shot('cedro-entry-battle');
  await clear('cedro-road');assert.equal(await page.evaluate(()=>NecromancerV2.world.adventure.groups.find(g=>g.id==='cedro-road').waveNumber),3);
  await move(0,5);await shot('cedro-village');await clear('cedro-captain');await move(80,-76);await page.waitForFunction(()=>NecromancerV2.world.arena.gates[0].open);
  await move(80,-111);await page.waitForFunction(()=>NecromancerV2.world.actors.some(a=>a.cedroBoss));
  await page.evaluate(async()=>{const {useProfile}=await import('v2-session'),{TEST_PROFILE,equipGroup}=await import('v2-horde'),n=NecromancerV2;useProfile(n.session,TEST_PROFILE);equipGroup(n.world,0,'zombie',{preparation:true});n.world.player.hp=n.world.player.maxHp=1e7;});
  for(const ground of ['dark','light']){await page.evaluate(ground=>{for(const [id,value] of [['ground',ground],['quality','low']]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change'));}},ground);await shot('cedro-boss-'+ground+'-low-horde');}
  await page.setViewportSize({width:390,height:844});await shot('mobile-combat');assert.ok(await page.locator('#campaign-panel').evaluate(e=>e.scrollWidth<=e.clientWidth+2));
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);result.errors=errors;result.remote=remote;
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log('Forte e Cedro: objetivos, contra-ataques e densidade OK',result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
