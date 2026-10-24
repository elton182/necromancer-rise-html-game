// Optional headless integration check. Requires Playwright in NODE_PATH, not a game dependency.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof gearEquip==='function'&&typeof hasSave!=='undefined');
  await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='hub';player.gold=10000;
   player.level=12;player.skillRanks={bolt:5,rain:2,zombie:3,vigor:2};player.skillTutorialState='done';skillSync();
   player.waveProgress=EquipmentModel.progress({best:5,selected:3});
   gearOpen();
  });
  await page.getByRole('button',{name:/Comprar Cajado/}).click();
  assert.equal(await page.evaluate(()=>player.gearBag.length),1);
  await page.getByRole('button',{name:'Equipar · Cajado',exact:true}).click();
  assert.equal(await page.evaluate(()=>Object.keys(player.equipment).length),1);
  assert.equal(await page.evaluate(()=>player.gearBag.length),0);
  await page.getByRole('button',{name:'Desequipar',exact:true}).click();
  assert.equal(await page.evaluate(()=>player.gearBag.length),1);
  await page.getByRole('button',{name:/Vender por/}).click();
  assert.equal(await page.evaluate(()=>player.gearBag.length),0);
  await page.evaluate(()=>{
   let seed=81;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
   player.gearBag=Object.keys(EquipmentModel.slots).map((type,i)=>EquipmentModel.generate(12,BuildModel,random,type,false,'preview-'+i));
   while(player.gearBag[0].rarity!=='epic')player.gearBag[0]=EquipmentModel.generate(12,BuildModel,random,'staff',false,'preview-0');
   gearSelected={id:player.gearBag[0].id};tPause('equipment');
  });
  await page.getByRole('button',{name:'Equipar · Cajado',exact:true}).click();
  await page.screenshot({path:path.resolve(__dirname,'../docs/concepts/equipment-menu.png'),fullPage:true});
  await page.getByRole('button',{name:'WAVES',exact:true}).click();
  await page.getByRole('button',{name:'Selecionar wave 2',exact:true}).click();
  assert.equal(await page.evaluate(()=>player.waveProgress.selected),2);
  await page.getByRole('button',{name:'Entrar na wave 2',exact:true}).click();
  await page.waitForFunction(()=>wave===2&&waveActive===true);
  const waveResult=await page.evaluate(()=>{
   const e=spawnEnemy(ENEMY_TYPES[0],2,2),s=EquipmentModel.waveStats(2);
   const result={hp:e.hp,expected:Math.round(ENEMY_TYPES[0].hp*s.hp),damage:e.dmg,expectedDamage:Math.round(ENEMY_TYPES[0].dmg*s.damage),speed:e.spd,attack:e.atkRate,windup:MOB_ABILITIES.Guerreiro.windup,initialSpecial:e.abilityCd};
   const original={level:player.level,skillRanks:player.skillRanks,equipment:player.equipment};
   Object.assign(player,{level:1,skillRanks:{},equipment:{}});skillSync();player.mp=80;player.spellCooldowns.raio=0;
   castRaio(P.x+2,P.y);result.nakedBoltDamage=boltsFx.at(-1).dmg;
   Object.assign(player,original);skillSync();
   // Complete a controlled wave independently of enemy AI for unlock verification.
   endWave();endWave();return {...result,progress:player.waveProgress};
  });
  assert.equal(waveResult.hp,waveResult.expected);assert.equal(waveResult.damage,waveResult.expectedDamage);
  assert.equal(waveResult.progress.best,5);
  assert.equal(waveResult.nakedBoltDamage,20);assert.equal(waveResult.speed,2.3);assert.equal(waveResult.attack,1.1);assert.equal(waveResult.windup,.5);assert.ok(waveResult.initialSpecial>=.75&&waveResult.initialSpecial<=1.25);
  await page.evaluate(()=>{setPause(true);saveGame();});
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)));
  assert.equal(saved.gearBag.length,6);assert.equal(saved.waveProgress.selected,2);assert.equal(saved.equipment.staff.rarity,'epic');
  await page.reload({waitUntil:'load'});
  const loaded=await page.evaluate(()=>{const ok=loadGame();return {ok,bag:player.gearBag.length,selected:player.waveProgress.selected,equipped:player.equipment.staff.rarity};});
  assert.deepEqual(loaded,{ok:true,bag:6,selected:2,equipped:'epic'});
  await page.evaluate(()=>{TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='hub';gearOpen();});
  await page.setViewportSize({width:390,height:844});
  const overflow=await page.evaluate(()=>{const el=document.querySelector('.pmbody');return el.scrollWidth-el.clientWidth;});
  assert.ok(overflow<=2,'Equipment panel overflows mobile width by '+overflow);
  await page.screenshot({path:path.resolve(__dirname,'../docs/concepts/equipment-menu-mobile.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('Browser OK: gear, waves, save/load, mobile, reduced bone shot and faster enemies.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
