const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const out=path.resolve(__dirname,'../../review/v2/village-services');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Efeitos visuais desativados'))errors.push(m.text());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
  await page.click('[data-title="campaign"]');await page.locator('.class-choice[data-class="warrior"]').click();await page.locator('#character-name').fill('Comparação e vila');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
  await page.evaluate(async()=>{
   const api=NecromancerV2,s=api.session,{launchWorld}=await import('v2-campaign-world');s.save.campaign.prologue.stage='done';s.save.campaign.world={stage:'village'};launchWorld(s);api.campaign.update();
   const EQ=(await import('v2-warrior-equipment')).default;
   for(const [id,value]of [['better-sword',.95],['worse-sword',.05]])s.save.character.gearBag.push(EQ.generate(1,null,()=>value,'sword',false,id));api.ui.show('equipment');
  });
  const damage=page.locator('.gear-stat-table tr[data-stat="damage"]');
  await page.locator('[data-gear-id="better-sword"]').click();assert.ok(await damage.evaluate(e=>e.classList.contains('gear-stat-up')));assert.match(await damage.locator('td:last-child').innerText(),/^\+/);await page.screenshot({path:path.join(out,'equipment-gain.png')});
  await page.locator('[data-gear-id="worse-sword"]').click();assert.ok(await damage.evaluate(e=>e.classList.contains('gear-stat-down')));assert.match(await damage.locator('td:last-child').innerText(),/^-/);await page.screenshot({path:path.join(out,'equipment-loss.png')});
  await page.evaluate(()=>NecromancerV2.ui.close());await page.waitForTimeout(80);
  async function approach(id){await page.evaluate(id=>{const api=NecromancerV2,npc=api.world.landmarks.find(n=>n.service===id);if(!npc)throw Error('NPC ausente: '+id);Object.assign(api.world.player,{x:npc.x,y:npc.y});api.world.paused=false;api.campaign.update();document.getElementById('view').focus();},id);await page.keyboard.press('g');}
  await approach('endless');await page.waitForSelector('#pause-dialog[open][data-tab="waves"]');await page.screenshot({path:path.join(out,'waves-npc.png')});await page.getByLabel('Modelo de waves').selectOption('classic');await page.locator('#waves-enter').click();await page.waitForFunction(()=>NecromancerV2.world.adventure?.kind==='arena');
  async function back(){await page.evaluate(async()=>{const api=NecromancerV2,{returnAdventure}=await import('v2-campaign');returnAdventure(api.session);api.campaign.update();});await page.waitForFunction(()=>NecromancerV2.world.adventure?.kind==='campaign-world');}
  await back();await approach('valdoria');await page.waitForSelector('#pause-dialog[open][data-tab="valdoria"]');await page.screenshot({path:path.join(out,'conquest-npc.png')});await page.getByRole('button',{name:/^Entrar na rota ·/}).click();await page.waitForFunction(()=>!!NecromancerV2.world.adventure?.conquest);
  await back();await approach('siege');await page.waitForSelector('#siege-panel[data-mode="menu"]:visible');assert.ok(await page.getByRole('button',{name:'Iniciar cerco',exact:true}).isEnabled());await page.screenshot({path:path.join(out,'siege-npc.png')});await page.getByRole('button',{name:'Iniciar cerco',exact:true}).click();await page.waitForFunction(()=>NecromancerV2.world.adventure?.kind==='siege');await back();
  await page.evaluate(()=>{const api=NecromancerV2;Object.assign(api.world.player,{x:60,y:71});api.world.paused=true;api.campaign.update();});await page.waitForTimeout(150);assert.equal(await page.locator('.service-label').count(),3);await page.screenshot({path:path.join(out,'village-npcs.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);const state=await page.evaluate(()=>({services:NecromancerV2.world.actors.filter(n=>n.service).map(n=>n.service),quests:NecromancerV2.session.save.campaign.world.stage,cleared:NecromancerV2.session.save.campaign.cleared}));
  assert.equal(state.services.length,3);assert.equal(state.quests,'village');assert.ok(!state.cleared[4]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({errors,remote,state,checks:['positive equipment difference','negative equipment difference','waves NPC starts arena','cartographer starts conquest route','siege NPC starts tower defence','return to Jacarandá','no artificial Act I completion','offline']},null,2));console.log('Comparação de equipamentos e três NPCs da vila: OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
