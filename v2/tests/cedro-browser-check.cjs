'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/cedro');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  if(await page.locator('#loading-start').isVisible())await page.locator('#loading-start').click();
  await page.waitForFunction(()=>!document.getElementById('loading'));
  await page.evaluate(()=>{const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',nilo:'done',smith:'done',lumber:'done',portalUnlocked:true,passengerMissing:true};n.campaign.start();});
  const shot=async name=>{await page.waitForTimeout(300);await page.screenshot({path:path.join(dir,name+'.png')});};
  const move=async(x,y)=>{await page.evaluate(({x,y})=>{const w=NecromancerV2.world;Object.assign(w.player,{x,y,hp:1e7,maxHp:1e7});}, {x,y});await page.waitForTimeout(300);};
  const talk=async(x,y)=>{await move(x,y);await page.keyboard.press('g');await page.locator('[data-view="world-dialogue"]').waitFor();};
  const accept=async name=>{await page.getByRole('button',{name}).click();await page.locator('[data-view="world-dialogue"]').waitFor({state:'detached'});};
  const kill=async id=>{await page.evaluate(async id=>{const {dealDamage}=await import('v2-combat'),{tickWorld}=await import('v2-campaign-world'),n=NecromancerV2,w=n.world,g=w.adventure.groups.find(g=>g.id===id);for(let i=0;i<5&&g.state!=='clear';i++){for(const a of [...w.actors])if(a.worldGroup===id&&a.hp>0)dealDamage(w,a,1e8,w.player);tickWorld(n.session,.1);if(g.state==='between')tickWorld(n.session,g.interval+.1);}},id);await page.waitForTimeout(250);};
  await talk(53,64);assert.match(await page.locator('[data-view="world-dialogue"]').innerText(),/Jacarandá cercada/);await shot('ultimatum');await accept(/Aceitar missão — Romper/);
  await talk(53,64);await accept(/Seguir para o Passo/);
  await page.waitForFunction(()=>NecromancerV2.world.adventure.area==='cedro'&&!NecromancerV2.world.areaTravel,null,{timeout:30000});
  const density=await page.evaluate(()=>{const w=NecromancerV2.world;return {groups:w.adventure.groups.length,enemies:w.adventure.groups.reduce((a,g)=>a+g.count,0),joao:w.actors.some(a=>a.key==='nilo')};});
  assert.ok(density.enemies>=300);assert.equal(density.joao,false);await shot('entry');
  await move(-145,150);
  for(const ground of ['dark','light']){await page.evaluate(ground=>{for(const [id,value] of [['ground',ground],['quality','low']]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change'));}NecromancerV2.view.zoom(9999);},ground);await shot('edge-'+ground+'-low');}
  await page.keyboard.press('m');await page.locator('.region-map-sheet').waitFor();assert.equal(await page.locator('[data-map-place="boss"]').count(),1);await shot('map');await page.keyboard.press('m');
  for(const [id,x,y] of [['cedro-road',-90,90],['cedro-captain',10,-42],['cedro-signal',-86,-22],['cedro-prisoners',-53,25],['cedro-supplies',68,25]]){await move(x,y);await page.waitForFunction(id=>NecromancerV2.world.actors.some(a=>a.worldGroup===id),id);await kill(id);}
  await talk(-52,25);await accept(/Libertar os moradores/);assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.world.cleared.includes('cedro-shortcut')),true);
  await talk(69,25);await accept(/Destruir o combustível/);
  await move(80,-76);await page.waitForFunction(()=>NecromancerV2.world.arena.gates.every(g=>g.open));assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.world.entry),'camp');
  await move(80,-111);await page.waitForFunction(()=>NecromancerV2.world.actors.some(a=>a.cedroBoss));await page.locator('#boss-bar:not([hidden])').waitFor();assert.match(await page.locator('#boss-bar strong').innerText(),/BENTO/);
  for(const ground of ['dark','light']){await page.evaluate(ground=>{for(const [id,value] of [['ground',ground],['quality','low']]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change'));}NecromancerV2.view.zoom(9999);},ground);await shot('boss-'+ground+'-low');}
  await page.waitForTimeout(12000); // exercita os especiais e VFX em execução real
  await shot('boss-combat');
  await page.evaluate(async()=>{const {useProfile}=await import('v2-session'),{TEST_PROFILE,equipGroup}=await import('v2-horde'),n=NecromancerV2;useProfile(n.session,TEST_PROFILE);equipGroup(n.world,0,'zombie',{preparation:true});n.world.player.hp=n.world.player.maxHp=1e7;});
  await shot('boss-horde-low');assert.ok(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='ally').length)>0);
  await kill('cedro-bento');await page.waitForFunction(()=>NecromancerV2.session.save.campaign.world.cedro==='return');
  await move(-139,148);await page.waitForTimeout(300);await move(-130,142);
  await page.waitForFunction(()=>!NecromancerV2.world.adventure.area&&!NecromancerV2.world.areaTravel,null,{timeout:30000});
  await talk(53,64);const before=await page.evaluate(()=>NecromancerV2.session.save.character.gold);await shot('return');await accept(/Concluir Romper o Cerco/);
  assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.gold),before+450);
  await talk(53,64);assert.equal(await page.getByRole('button',{name:/Viajar com a caravana/}).count(),1);await page.getByRole('button',{name:'Fechar conversa',exact:true}).click();
  await page.setViewportSize({width:390,height:844});await talk(53,64);await shot('dialogue-mobile');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({density,checks:['ultimato e aceitação','atlas','objetivos opcionais e portões','checkpoint','Bento e VFX','fundo claro/escuro, qualidade baixa, zoom máximo','retorno, prêmio e Itavera','390 px','arquivo offline'],errors,remote},null,2));
  console.log('Passo do Cedro: campanha e apresentação offline OK',density);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
