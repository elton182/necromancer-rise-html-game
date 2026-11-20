// Marcadores de objetos, interação real e limpeza; contexto com armazenamento isolado.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/quest-objects');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  const setup=async(area,nilo,lumber='done')=>{
   await page.evaluate(async({area,nilo,lumber})=>{
    const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};
    c.world={stage:'complete',questFlow:1,smith:'done',lumber,piles:[0,0,0],passengerMissing:true,nilo,cleared:['mill-a','mill-b','mill-c','fort-captain'],...(area?{area,entry:area==='itauna'?'west':'gate'}:{})};
    n.campaign.start();for(const g of n.world.adventure.groups)g.state='clear';n.world.actors=n.world.actors.filter(a=>a.team!=='enemy');
   },{area,nilo,lumber});
  };
  const focus=async key=>{
   await page.evaluate(key=>{const n=NecromancerV2,w=n.world,l=w.landmarks.find(l=>l.key===key);if(!l)throw Error('Objeto ausente: '+key);Object.assign(w.player,{x:l.x+.8,y:l.y});w.paused=true;},key);
   await page.waitForTimeout(350);await page.locator(`[data-quest-object="${key}"]`).waitFor({state:'visible'});
   assert.equal(await page.locator(`[data-quest-object="${key}"]`).getAttribute('data-quest-marker'),'!');
   assert.match(await page.locator(`[data-quest-object="${key}"]`).innerText(),/G ·/);
  };
  const interact=async key=>{
   const kind=await page.evaluate(async()=>{const m=await import('v2-campaign-world'),s=NecromancerV2.session;s.world.paused=false;if(!m.interactWorld(s))throw Error('Interação falhou');const d=m.worldDialogue(s);if(!d.action)throw Error('Ação ausente');if(!m.worldDialogueAction(s))throw Error('Ação recusada: '+d.kind);s.world.paused=true;return d.kind;});
   await page.waitForFunction(key=>!document.querySelector(`[data-quest-object="${key}"]`),key);return kind;
  };
  await setup(null,'locked','active');await focus('pile-0');await page.screenshot({path:path.join(dir,'wood-dark.png')});
  await page.evaluate(async()=>{const n=NecromancerV2;const {spawnMember}=await import('v2-horde');['zombie','skeleton','archer'].forEach((type,i)=>spawnMember(n.world,type,i));n.view.ground(true);n.view.quality('low');n.view.zoom(9999);});
  await page.waitForTimeout(250);await page.screenshot({path:path.join(dir,'wood-light-low-horde-zoom.png')});assert.equal(await interact('pile-0'),'pile');
  assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.world.piles[0]),1);
  await setup('itauna','road');await focus('nilo-ledger');await page.screenshot({path:path.join(dir,'ledger.png')});
  await page.evaluate(()=>NecromancerV2.world.adventure.clearedRun.add('camp-inner'));assert.equal(await interact('nilo-ledger'),'nilo-ledger');
  await setup('itauna-fort','fort');await focus('nilo-bag');await page.screenshot({path:path.join(dir,'fort-bag.png')});assert.equal(await interact('nilo-bag'),'nilo-bag');
  await focus('nilo-contract');assert.equal(await interact('nilo-contract'),'nilo-contract');
  assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.world.nilo),'return');
  await page.evaluate(async()=>{const n=NecromancerV2,c=n.session.save.campaign;c.prologue={stage:'cave',introRead:true,clue:false,caveCleared:true};n.campaign.start();const {nextPrologueDialogue}=await import('v2-prologue');for(let i=0;i<20&&n.world.adventure.dialogue;i++)nextPrologueDialogue(n.session);});
  await focus('papers');await page.screenshot({path:path.join(dir,'prologue-papers.png')});
  await page.evaluate(async()=>{const n=NecromancerV2,m=await import('v2-prologue');n.world.paused=false;m.interactPrologue(n.session);for(let i=0;i<20&&n.world.adventure.dialogue;i++)m.nextPrologueDialogue(n.session);n.world.paused=true;});
  await page.waitForFunction(()=>!document.querySelector('[data-quest-object="papers"]'));
  assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.prologue.clue),true);
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({checks:['pilhas, livro, bolsa, mesa e ordens com !','interações reais removem marcadores','fundo claro e escuro, horda, qualidade baixa, zoom máximo','HTML offline sem requisições externas'],errors,remote},null,2));console.log('Objetos de missão: OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
