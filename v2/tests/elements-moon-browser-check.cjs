// Interface real em perfil isolado; efeitos novos, Lua por botão/Y, pilhas no Mago.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/elements-moon');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.NR_BROWSER_CHANNEL||'msedge',headless:true});
 const errors=[],remote=[],checks=[];
 try{
  async function start(classId){
   const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
   await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
   await page.waitForFunction(()=>document.body.dataset.ready==='true'&&!document.getElementById('loading'),null,{timeout:90000});
   await page.click('[data-title="campaign"]');await page.click('.class-choice[data-class="'+classId+'"]');await page.locator('#character-name').fill(classId==='druid'?'Flora':'Bento');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();
   await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');await page.evaluate(()=>NecromancerV2.go('training'));
   await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
   await page.evaluate(async classId=>{
    const n=NecromancerV2,w=n.world,p=w.player,{treeNodes}=await import('v2-skill-tree');
    const ranks=Object.fromEntries(Object.keys(treeNodes(classId)).map(id=>[id,1]));
    Object.assign(n.session.save.character,{level:60,[classId==='druid'?'druidRanks':'marksmanRanks']:ranks});
    w[classId==='druid'?'druidRanks':'marksmanRanks']=ranks;
    const enemies=w.actors.filter(a=>a.team==='enemy'&&a!==w.boss).slice(0,5);
    w.actors=[p,...enemies];Object.assign(p,{x:0,y:0,maxMp:4000,mp:4000});
    enemies.forEach((e,i)=>Object.assign(e,{x:(i%3-1)*.75,y:-4.1-Math.floor(i/3)*1.1,dummy:true,hp:100000,maxHp:100000}));
    w.aim={x:0,y:-6};w.effects=[];
   },classId);
   return page;
  }
  const druid=await start('druid');
  await druid.evaluate(()=>NecromancerV2.ui.show('skills'));await druid.waitForSelector('[data-warrior-node="luaPrateada"]');await druid.screenshot({path:path.join(dir,'moon-tree.png')});await druid.keyboard.press('Escape');
  await druid.evaluate(()=>{const w=NecromancerV2.world;w.druidFormReady=0;w.castCooldown=0;NecromancerV2.stance();});await druid.waitForFunction(()=>NecromancerV2.world.druidForm==='wolf');await druid.waitForTimeout(500);
  async function wolfCast(index){
   assert.ok(await druid.evaluate(index=>{const n=NecromancerV2,w=n.world;w.paused=false;w.druidAction=null;w.castCooldown=0;w.druidCooldowns={};w.player.mp=w.player.maxMp;w.effects=[];return n.slot(index);},index));
   await druid.waitForFunction(()=>{const w=NecromancerV2.world;if(w.druidAction?.released){w.paused=true;return true;}return false;},null,{timeout:5000});
  }
  await druid.evaluate(()=>{const p=NecromancerV2.world.player;p.hp=p.maxHp*.4;});
  const before=await druid.evaluate(()=>NecromancerV2.world.player.hp);await wolfCast(4);
  const blood=await druid.evaluate(()=>{const w=NecromancerV2.world,e=w.effects.find(e=>e.fx==='wolfClaws');e.time=.06;NecromancerV2.view.render(w,0);return {radius:e.radius,element:e.element,hp:w.player.hp};});assert.equal(blood.radius,6);assert.equal(blood.element,'blood');assert.ok(blood.hp>before);
  await druid.screenshot({path:path.join(dir,'blood-claws.png')});
  await wolfCast(5);const ice=await druid.evaluate(()=>{const w=NecromancerV2.world,e=w.effects.find(e=>e.fx==='wolfClaws');e.time=.06;NecromancerV2.view.render(w,0);return {radius:e.radius,element:e.element,stacks:w.actors.filter(a=>a.team==='enemy').map(a=>a.frostStacks||0)};});assert.equal(ice.radius,4.5);assert.equal(ice.element,'frost');assert.ok(ice.stacks.some(v=>v>0));await druid.screenshot({path:path.join(dir,'ice-claws.png')});
  await druid.evaluate(()=>{const w=NecromancerV2.world;w.paused=false;w.druidAction=null;w.castCooldown=0;w.druidCooldowns={};w.player.mp=w.player.maxMp;});await druid.waitForTimeout(150);
  await druid.locator('#druid-moon').click();await druid.waitForFunction(()=>NecromancerV2.world.druidMoonUntil>NecromancerV2.world.time);
  await druid.waitForTimeout(350);await druid.screenshot({path:path.join(dir,'silver-moon.png')});
  await wolfCast(0);const falls=await druid.evaluate(()=>NecromancerV2.world.druidMoonMeteors.length);assert.equal(falls,1);await druid.screenshot({path:path.join(dir,'ice-meteor.png')});
  await druid.evaluate(()=>{const w=NecromancerV2.world;w.paused=false;w.druidAction=null;w.castCooldown=0;w.druidCooldowns={};w.druidMoonUntil=0;w.player.mp=w.player.maxMp;});await druid.keyboard.press('KeyY');await druid.waitForFunction(()=>NecromancerV2.world.druidMoonUntil>NecromancerV2.world.time);
  await druid.evaluate(()=>{for(const [id,value]of [['ground','light'],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}});await wolfCast(5);await druid.screenshot({path:path.join(dir,'moon-ice-light-low.png')});
  checks.push({blood,ice,meteorsPerAttack:falls,moonButton:true,moonKey:true});await druid.close();
  const mage=await start('mage');
  async function mageCast(index){assert.ok(await mage.evaluate(index=>{const n=NecromancerV2,w=n.world;w.paused=false;w.marksmanAction=null;w.castCooldown=0;w.marksmanCooldowns={};w.player.mp=w.player.maxMp;return n.slot(index);},index));await mage.waitForTimeout(800);}
  for(let i=0;i<5;i++)await mageCast(1);
  const fire=await mage.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy').map(a=>a.fireStacks||0));assert.ok(fire.some(v=>v===5));await mage.screenshot({path:path.join(dir,'mage-fire-stacks.png')});
  for(let i=0;i<5;i++){assert.ok(await mage.evaluate(()=>{const n=NecromancerV2,w=n.world;w.marksmanAction=null;w.marksmanCooldowns={};w.player.mp=w.player.maxMp;return n.slot(2);}));await mage.waitForTimeout(300);}
  const frozen=await mage.evaluate(()=>NecromancerV2.world.actors.some(a=>a.team==='enemy'&&a.freezeUntil>NecromancerV2.world.time));assert.ok(frozen);await mage.screenshot({path:path.join(dir,'mage-frozen.png')});checks.push({fire,frozen});
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);fs.writeFileSync(path.join(dir,'browser-result.json'),JSON.stringify({ok:true,checks,errors,remote},null,2));console.log(JSON.stringify({ok:true,checks,errors,remote}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
