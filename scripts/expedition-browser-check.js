'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.stack));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);
  await page.waitForFunction(()=>typeof hasSave!=='undefined');
  await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='hub';
   document.body.classList.remove('titling');tlShow(false,false);
   player.level=12;player.skillRanks={zombie:1};player.skillTutorialState='done';skillSync();player.hp=player.maxHp;
   document.getElementById('hud').style.display='block';
   player.waveProgress=EquipmentModel.progress();setEndlessMode('expedition');gearOpen('waves');
  });
  assert.equal(await page.getByLabel('Modelo de waves').inputValue(),'expedition');
  await page.getByRole('button',{name:'Entrar na wave 1',exact:true}).click();
  await page.waitForFunction(()=>EXPEDITION.active&&wave===1&&waveActive);
  await page.waitForTimeout(600);
  assert.deepEqual(errors,[]);
  const first=await page.evaluate(()=>({count:enemies.length,queue:spawnQueue.length,width:EXPEDITION.map.width,boss:!!bossEnemy,biome:BIOME.id}));
  assert.equal(first.count,85);assert.equal(first.queue,0);assert.equal(first.boss,true);assert.ok(first.width>100);
  // A distant boss stays at its home while world time advances. All mobs exist from map entry.
  const dormant=await page.evaluate(()=>{const b=EXPEDITION.boss,x=b.x,y=b.y;for(let i=0;i<120;i++)update(1/60);return {distance:Math.hypot(b.x-x,b.y-y),alert:b.alert,count:enemies.length};});
  assert.equal(dormant.distance,0);assert.equal(dormant.alert,false);assert.equal(dormant.count,85);
  await page.screenshot({path:path.resolve(__dirname,'../review/expedition-entry.png')});
  const progress=await page.evaluate(()=>{
   const survivor=spawnMinion('zombie');const ally=minions.find(m=>!m.dead);ally.hp=17;ally.testCarry=true;
   const b=EXPEDITION.boss;setPlayerAt(b.x-6,b.y);cam.x=P.x;cam.y=P.y;
   for(let i=0;i<10;i++)update(1/60);
   const awake=b.alert;endWave();const locked=waveActive&&player.waveProgress.best===0;
   killEnemy(b,b.x,b.y);const best=player.waveProgress.best,gold=player.gold;endWave();
   const once=player.gold===gold,loot=droppedItems.filter(d=>d.type==='equipment').at(-1).item.rarity;
   ally.hp=17;setPlayerAt(EXPEDITION.map.exit.x,EXPEDITION.map.exit.y);tryPortal();
   return {awake,locked,best,once,loot,wave,biome:BIOME.id,carry:minions.includes(ally)&&ally.testCarry&&ally.hp===17,queue:spawnQueue.length,active:waveActive};
  });
  assert.equal(progress.awake,true);assert.equal(progress.locked,true);assert.equal(progress.best,1);assert.equal(progress.once,true);assert.ok(['rare','epic'].includes(progress.loot));
  assert.equal(progress.wave,2);assert.notEqual(progress.biome,first.biome);assert.equal(progress.carry,true);assert.equal(progress.queue,0);assert.equal(progress.active,true);
  // Dashing, projectiles and path finding work well outside the old circular arena.
  const movement=await page.evaluate(()=>{
   setPlayerAt(100,40);cam.x=100;cam.y=40;keys.d=true;playerDash.cd=0;castDash();for(let i=0;i<20;i++)update(1/60);keys.d=false;
   const moved=P.x>100&&P.x<156;
   player.mp=player.maxMp;player.spellCooldowns.raio=0;castRaio(P.x+8,P.y);updateBolts(.1);const bolt=boltsFx.length>0;
   const old=solids;solids=[{x:100,y:40,r:1}];const route=terrainPath(96,40,104,40,.4);solids=old;
   return {moved,bolt,path:route.length>0};
  });
  assert.deepEqual(movement,{moved:true,bolt:true,path:true});
  await page.waitForTimeout(3300);
  await page.screenshot({path:path.resolve(__dirname,'../review/expedition-biome.png')});
  for(const n of [3,4,5]){
   await page.evaluate(n=>{expeditionStartMap(n);setPlayerAt(74,40);expeditionCamera(1);render();},n);
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>render());
  await page.screenshot({path:path.resolve(__dirname,'../review/expedition-mobile.png')});
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>expeditionStartMap(2));
  await page.evaluate(()=>{enterHub();gearOpen('waves');});
  await page.getByLabel('Modelo de waves').selectOption('classic');
  await page.getByRole('button',{name:'Entrar na wave 2',exact:true}).click();
  await page.waitForFunction(()=>!EXPEDITION.active&&wave===2&&waveActive);
  assert.equal(await page.evaluate(()=>STG.on),false);
  assert.ok(await page.evaluate(()=>spawnQueue.length>0));
  await page.evaluate(()=>{enterHub();saveGame();});await page.reload();
  assert.equal(await page.evaluate(()=>endlessMode),'classic');
  assert.deepEqual(errors,[]);console.log('OK expedition maps, dormant encounters, boss, loot, progression, surviving army, movement, classic mode and preference persistence');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
