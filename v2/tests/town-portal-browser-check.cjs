// Portal na distribuição offline, com contexto e armazenamento isolados.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/town-portal');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  await page.evaluate(async()=>{
   const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',questFlow:1,smith:'done',lumber:'done',nilo:'fort',cleared:[]};n.campaign.start();
   Object.assign(n.world.player,{x:64.8,y:64});n.world.paused=false;n.campaign.interact();
  });
  await page.getByRole('button',{name:'Receber o Selo de Jacarandá',exact:true}).click();
  assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.world.portalUnlocked),true);
  for(const area of [null,'itauna-cave','itauna-fort']){
   await page.evaluate(async area=>{
    const n=NecromancerV2,m=await import('v2-campaign-world'),p=n.session.save.campaign.world;
    if(area){p.area=area;p.entry=area==='itauna-cave'?'mouth':'gate';}else delete p.area;
    m.launchWorld(n.session);if(!area){Object.assign(n.world.player,{x:120,y:84});n.world.adventure.inVillage=false;}
    n.world.actors=n.world.actors.filter(a=>a.team!=='enemy');for(const g of n.world.adventure.groups){g.state='clear';n.world.adventure.clearedRun.add(g.id);}
    window.portalOrigin={x:n.world.player.x,y:n.world.player.y};
   },area);
   await page.locator('#world-home:not([disabled])').click();
   await page.waitForFunction(()=>NecromancerV2.session.campaignPortal?.atHome&&!document.getElementById('area-fade').classList.contains('on'));
   await page.evaluate(()=>{const n=NecromancerV2;Object.assign(n.world.player,{x:60,y:75});n.world.paused=true;});
   await page.locator('#world-portal').waitFor({state:'visible'});
   await page.screenshot({path:path.join(dir,(area||'world')+'-village-dark.png')});
   await page.evaluate(async()=>{const n=NecromancerV2,{spawnMember}=await import('v2-horde');['zombie','skeleton','archer'].forEach((t,i)=>spawnMember(n.world,t,i));n.view.ground(true);n.view.quality('low');n.view.zoom(9999);});
   await page.waitForTimeout(300);await page.screenshot({path:path.join(dir,(area||'world')+'-village-light-low-horde.png')});
   await page.evaluate(()=>NecromancerV2.world.paused=false);await page.keyboard.press('KeyG');
   await page.waitForFunction(area=>{const n=NecromancerV2,w=n.world;return !n.session.campaignPortal?.atHome&&(w.adventure.area||null)===area&&!document.getElementById('area-fade').classList.contains('on');},area);
   const state=await page.evaluate(()=>{const n=NecromancerV2,w=n.world;w.paused=true;return {x:w.player.x,y:w.player.y,origin:portalOrigin,groupsPreserved:w.adventure.groups.every(g=>g.state==='clear'),portal:!!w.portal?.linked};});
   assert.deepEqual({x:state.x,y:state.y},state.origin);assert.equal(state.groupsPreserved,true);assert.equal(state.portal,true);
   await page.evaluate(()=>{NecromancerV2.view.ground(false);NecromancerV2.view.zoom(-9999);});await page.waitForTimeout(250);
   await page.screenshot({path:path.join(dir,(area||'world')+'-returned.png')});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({checks:['entrega pelo prefeito','botão abre portal e viagem com fade','G retorna ao mundo, gruta e forte','posição e grupos preservados','portal visível em fundo claro/escuro, horda e qualidade baixa','HTML offline'],errors,remote},null,2));console.log('Portal de Jacarandá: OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
