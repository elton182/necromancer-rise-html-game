const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
(async()=>{
 const out=path.resolve(__dirname,'../../review/v2/siege');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.$eval('#enter',e=>e.click());
  await page.evaluate(async()=>{const n=NecromancerV2,{enterVillage}=await import('v2-campaign');Object.assign(n.session.save.campaign,{started:true,village:true,cleared:{1:1,2:1,3:1,4:1}});enterVillage(n.session);const {useProfile}=await import('v2-session'),{TEST_PROFILE,equipGroup}=await import('v2-horde');useProfile(n.session,TEST_PROFILE);for(const [i,id]of ['raio','skeleton','zombie','abom','archer','dash'].entries())equipGroup(n.world,i,id,{preparation:true});n.campaign.update();});
  await page.getByRole('button',{name:'Cerco ao Ritual',exact:true}).click();await page.screenshot({path:path.join(out,'entry.png')});
  await page.getByRole('button',{name:'Iniciar cerco',exact:true}).click();
  await page.evaluate(()=>{const n=NecromancerV2;n.world.adventure.essence=2000;Object.assign(n.world.player,{x:0,y:-3});n.world.random=()=>.8;n.campaign.update();});
  for(const [pad,name]of [[1,'Torre de Ossos'],[2,'Sepultura Gélida'],[6,'Caldeirão da Peste'],[7,'Cripta dos Guardiões']]){
   await page.evaluate(async id=>{const n=NecromancerV2,{PADS}=await import('v2-siege-model'),p=PADS.find(p=>p.id===id);Object.assign(n.world.player,{x:p.x,y:p.y+1.8});n.campaign.update();},pad);await page.getByRole('heading',{name:'Pedestal '+pad,exact:true}).waitFor();await page.getByRole('button',{name:new RegExp('^'+name+' ·')}).click();
  }
  await page.getByRole('button',{name:/^Melhorar ·/}).click();
  await page.getByRole('button',{name:'Iniciar onda 1',exact:true}).click();
  await page.evaluate(async()=>{const n=NecromancerV2,{stepSession}=await import('v2-session');Object.assign(n.world.player,{x:0,y:-3});for(let i=0;i<40;i++)stepSession(n.session,.25,{});n.world.paused=true;n.campaign.update();});
  await page.waitForTimeout(300);assert.equal(await page.locator('#siege-panel').isVisible(),false);assert.equal(await page.locator('#campaign-panel').isVisible(),false);assert.equal(await page.evaluate(()=>NecromancerV2.world.siegeSelectedPad),null);await page.screenshot({path:path.join(out,'active-dark.png')});
  await page.evaluate(()=>{const n=NecromancerV2;Object.assign(n.world.player,{x:-7,y:-3.2});n.campaign.update();});await page.getByRole('heading',{name:'Pedestal 2',exact:true}).waitFor();assert.equal(await page.locator('#siege-panel .siege-pads').count(),0);await page.getByRole('button',{name:/^Melhorar ·/}).click();await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'tower-near-dark.png')});await page.evaluate(()=>{const n=NecromancerV2;Object.assign(n.world.player,{x:0,y:-3});n.campaign.update();});assert.equal(await page.locator('#siege-panel').isVisible(),false);
  const active=await page.evaluate(()=>{const w=NecromancerV2.world;return {towers:w.adventure.towers.length,guards:w.actors.filter(a=>a.siegeGuard&&a.hp>0).length,invaders:w.actors.filter(a=>a.siegeLane!==undefined&&a.hp>0).length,integrity:w.adventure.integrity};});assert.equal(active.towers,4);assert.equal(active.guards,2);
  await page.evaluate(()=>{for(const [id,value]of [['ground','light'],['quality','low']]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change'));}});await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'active-light-low.png')});
  const completed=await page.evaluate(async()=>{
   const n=NecromancerV2,{stepSession}=await import('v2-session'),{startSiegeWave,endSiege}=await import('v2-siege'),{dealDamage}=await import('v2-combat');const r=n.world.adventure;
   Object.assign(n.world.player,{x:22,y:16});n.world.paused=false;
   for(let limit=0;!r.done&&limit<2000;limit++){
    if(!r.active)startSiegeWave(n.session);stepSession(n.session,.1,{});
    for(const e of n.world.actors.filter(a=>a.siegeLane!==undefined&&a.hp>0))dealDamage(n.world,e,1e9,n.world.player);
   }
   const gold=n.session.save.character.gold;endSiege(n.session,true);n.campaign.update();return {won:r.won,wave:r.wave,unlocked:n.session.save.character.siege.unlocked,singleReward:gold===n.session.save.character.gold};
  });assert.deepEqual(completed,{won:true,wave:8,unlocked:2,singleReward:true});await page.screenshot({path:path.join(out,'victory.png')});
  await page.getByRole('button',{name:'Voltar à vila',exact:true}).click();
  await page.evaluate(async()=>{const n=NecromancerV2,{launchSiege}=await import('v2-siege'),{stepSession}=await import('v2-session');launchSiege(n.session);n.world.adventure.integrity=0;stepSession(n.session,.1,{});n.campaign.update();});
  await page.getByRole('heading',{name:'Ritual interrompido'}).waitFor();await page.screenshot({path:path.join(out,'defeat.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({errors,remote,active,completed,proximity:{hiddenAway:true,opensNearby:true,autoSelectsNearest:true,closesOnLeave:true,remotePickerRemoved:true},limits:'Perfil e recursos isolados em memória; vitória acelerada com dano de teste. Valida integração, não dificuldade de uma partida normal.'},null,2));
  console.log('Cerco: entrada, quatro torres, guardiões, combate, vitória, derrota, offline e qualidade baixa OK.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
