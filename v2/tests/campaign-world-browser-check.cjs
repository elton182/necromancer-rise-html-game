'use strict';
// Mundo contínuo de Eldrin: regiões ampliadas, encontros, mapa (M) e as quests do ferreiro e da madeira no jogo real.
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/campaign-world');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=d3d11','--enable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
  // Exercita o fluxo de saves anteriores, sem o prólogo dos personagens novos.
  await page.evaluate(()=>{NecromancerV2.session.save.campaign.started=true;NecromancerV2.session.save.campaign.world={};});
  await legacy.click(page,'#campaign-start');
  const shot=async(name,ms=900)=>{await page.waitForTimeout(ms);await page.screenshot({path:path.join(dir,name+'.png')});};
  // Teleporta, deixa os encontros acordarem e mede o tempo de quadro no ponto.
  const visit=(x,y)=>page.evaluate(async([x,y])=>{const n=NecromancerV2,w=n.world;Object.assign(w.player,{x,y});w.player.hp=w.player.maxHp=1e7;w.paused=false;
   const t=[];let last=performance.now();await new Promise(done=>{let k=0;const f=now=>{t.push(now-last);last=now;if(++k<90)requestAnimationFrame(f);else done();};requestAnimationFrame(f);});
   t.sort((a,b)=>a-b);n.campaign.update();return {median:+t[45].toFixed(1),p90:+t[81].toFixed(1),enemies:w.actors.filter(a=>a.team==='enemy'&&a.hp>0).length};},[x,y]);
  const start=await page.evaluate(()=>{const n=NecromancerV2,w=n.world;return {kind:w.adventure?.kind,x:w.player.x,y:w.player.y,solids:w.arena.solids.length,bounds:w.arena.bounds};});
  assert.equal(start.kind,'campaign-world');assert.equal(start.bounds.maxX,180);
  const perf={};
  perf.crypt=await visit(-98,-86);await shot('crypt');
  perf.forest=await visit(-34,-4);await shot('forest-ruins');
  perf.mineRoad=await visit(46,-96);await shot('mine-road');
  perf.mine=await visit(30,-122);await shot('mine');
  perf.mill=await visit(-100,120);await shot('mill');
  perf.graveyard=await visit(130,32);await shot('graveyard');
  // Progresso controlado: rescue concluído, quests abertas, mina limpa e conversa com Bruno.
  const quest=await page.evaluate(async()=>{
   const n=NecromancerV2,s=n.session,w=n.world,{tickAdventure}=await import('v2-campaign'),{dealDamage}=await import('v2-combat'),W=await import('v2-campaign-world'),M=await import('v2-campaign-world-model');
   const go=p=>{Object.assign(w.player,{x:p.x,y:p.y});tickAdventure(s,.1);},clear=id=>{const kill=()=>{for(const e of [...w.actors])if(e.worldGroup===id&&e.hp>0)dealDamage(w,e,1e9,w.player);tickAdventure(s,.1);},g=()=>w.adventure.groups.find(g=>g.id===id);kill();for(let i=0;i<30&&g()?.state==='between';i++){g().timer=0;tickAdventure(s,.1);kill();}};
   go(M.WORLD_POINTS.child);W.interactWorld(s);W.worldDialogueAction(s);go(M.WORLD_POINTS.prison);clear('prison-guards');W.interactWorld(s);W.worldDialogueAction(s);go(M.WORLD_POINTS.mayor);W.interactWorld(s);W.worldDialogueAction(s);
   const opened={smith:s.save.campaign.world.smith,lumber:s.save.campaign.world.lumber};
   go({x:30,y:-140});clear('mine-guards');go(M.WORLD_POINTS.mine);W.interactWorld(s);n.campaign.update();return {opened,dialogue:W.worldDialogue(s).title};
  });
  assert.deepEqual(quest.opened,{smith:'active',lumber:'active'});
  await shot('bran-dialogue',500);
  await page.getByRole('button',{name:'Mandar Bruno para a vila',exact:true}).click();
  await page.evaluate(()=>{const w=NecromancerV2.world;Object.assign(w.player,{x:-100,y:122});w.paused=false;NecromancerV2.campaign.update();});
  await page.locator('#view').focus();await page.keyboard.press('KeyM');await page.waitForSelector('#campaign-panel[data-view="world-map"] canvas');await shot('world-map',400);
  await page.keyboard.press('KeyM');
  perf.village=await visit(54,76);
  const forge=await page.evaluate(async()=>{const n=NecromancerV2,s=n.session,W=await import('v2-campaign-world'),M=await import('v2-campaign-world-model'),{tickAdventure}=await import('v2-campaign');Object.assign(n.world.player,M.WORLD_POINTS.forge);tickAdventure(s,.1);W.interactWorld(s);n.campaign.update();return W.worldDialogue(s).kind;});
  assert.equal(forge,'smith');await shot('forge-dialogue',500);
  await page.getByRole('button',{name:/Reacender a forja/}).click();
  const state=await page.evaluate(()=>NecromancerV2.session.save.campaign.world);assert.equal(state.smith,'done');
  await legacy.select(page,'#ground','light');await legacy.select(page,'#quality','low');perf.villageLow=await visit(58,70);await shot('village-light-low');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  const result={start,perf,quest,state,errors,remote,limits:'Teleporte e abates injetados para validar regiões, encontros, quests e interface; tempos de quadro no Edge headless (GPU do ambiente), não equivalem a medição no navegador do jogador nem a validação de dificuldade.'};
  fs.writeFileSync(path.join(dir,'campaign-world-browser-result.json'),JSON.stringify(result,null,2));
  console.log('Mundo de Eldrin OK',JSON.stringify(perf));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
