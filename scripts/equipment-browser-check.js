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
  assert.equal(await page.locator('.gear-cell').count(),30);assert.equal(await page.locator('.gear-slot').count(),7);assert.equal(await page.locator('.gear-silhouette').count(),1);
  await page.getByRole('button',{name:'Bolsa II',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Espaço vazio 31',exact:true}).count(),1);
  await page.getByRole('button',{name:'Bolsa I',exact:true}).click();
  const frames=[],panes=[];
  for(const name of ['PERSONAGEM','HABILIDADES','HORDA','SISTEMA','EQUIPAMENTOS','WAVES']){
   await page.getByRole('button',{name,exact:true}).click();frames.push(await page.locator('.pm').boundingBox());panes.push(await page.locator('.pmbody').boundingBox());
   if(['PERSONAGEM','HABILIDADES'].includes(name))await page.screenshot({path:path.resolve(__dirname,'../docs/concepts/menu-'+name.toLowerCase()+'-standard.png'),fullPage:true});
  }
  for(const rect of frames)for(const key of ['x','y','width','height'])assert.ok(Math.abs(rect[key]-frames[0][key])<1,'Tab frame differs: '+key);
  for(const rect of panes)for(const key of ['x','y','width','height'])assert.ok(Math.abs(rect[key]-panes[0][key])<1,'Tab content frame differs: '+key);
  await page.getByRole('button',{name:'HABILIDADES',exact:true}).click();
  const pointsBefore=await page.evaluate(()=>player.skillPoints);await page.getByRole('button',{name:'+ Investir ponto',exact:true}).click();
  assert.equal(await page.evaluate(()=>player.skillPoints),pointsBefore-1);assert.match(await page.locator('.menu-summary').innerText(),new RegExp((pointsBefore-1)+' pontos'));
  await page.getByRole('button',{name:'EQUIPAMENTOS',exact:true}).click();
  await page.getByRole('button',{name:/Comprar Cajado/}).click();
  assert.equal(await page.evaluate(()=>player.gearBag.length),1);
  const preview=await page.evaluate(()=>EquipmentModel.snapshot(BuildModel,player,MINION_DEFS,COMBAT_TUNING,{...player.equipment,staff:player.gearBag[0]}));
  assert.equal(await page.locator('.gear-stat-table [data-stat="spell"]').count(),1);assert.ok(await page.locator('.gear-skill-table [data-skill="raio"]').count());
  await page.getByRole('button',{name:'Equipar · Cajado',exact:true}).click();
  const live=await page.evaluate(()=>({hp:player.maxHp,mp:player.maxMp,spell:player.spellDmg,bolt:Math.floor(player.spellDmg+spellBonus('raio','raio_d'))}));
  assert.equal(live.hp,preview.attributes.hp);assert.equal(live.mp,preview.attributes.mp);assert.equal(live.spell,preview.attributes.spell);assert.equal(live.bolt,preview.skills.find(s=>s.id==='raio').damage);
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
  const equipmentBeforeRing=await page.evaluate(()=>JSON.stringify(player.equipment));
  await page.getByRole('button',{name:/Anel esquerdo .*Nv.12/}).click();
  await page.getByRole('button',{name:'Comparar anel direito',exact:true}).click();
  assert.match(await page.locator('.gear-stat-heading').innerText(),/anel direito/i);assert.equal(await page.evaluate(()=>JSON.stringify(player.equipment)),equipmentBeforeRing);
  await page.evaluate(()=>{gearSelected={slot:'staff'};tPause('equipment');});
  await page.screenshot({path:path.resolve(__dirname,'../docs/concepts/equipment-menu-standard.png'),fullPage:true});
  await page.locator('.gear-dps').evaluate(el=>el.scrollIntoView({block:'start'}));
  await page.screenshot({path:path.resolve(__dirname,'../docs/concepts/equipment-stats-standard.png'),fullPage:true});
  await page.getByRole('button',{name:'WAVES',exact:true}).click();
  await page.getByRole('button',{name:'Selecionar wave 2',exact:true}).click();
  assert.equal(await page.evaluate(()=>player.waveProgress.selected),2);
  await page.getByLabel('Modelo de waves').selectOption('classic');
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
  await page.screenshot({path:path.resolve(__dirname,'../docs/concepts/equipment-menu-mobile-standard.png'),fullPage:true});
  for(const name of ['PERSONAGEM','HABILIDADES','HORDA','SISTEMA','EQUIPAMENTOS','WAVES']){
   await page.getByRole('button',{name,exact:true}).click();
   const overflow=await page.locator('.pmbody').evaluate(el=>el.scrollWidth-el.clientWidth);assert.ok(overflow<=2,name+' overflows mobile width by '+overflow);
  }
  await page.evaluate(()=>{CAMP.cleared={1:1};CAMP.unlocked=2;CAMP.story={intro:1,pre1:1};tPause('status');});
  assert.equal(await page.evaluate(()=>VILLAGE()),false);
  const beforeStory=await page.evaluate(()=>({level:player.level,bag:player.gearBag.map(i=>i.id).sort(),staff:player.equipment.staff.id,gold:player.gold}));
  await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'Voltar à história',exact:true}).click()]);
  await page.waitForFunction(()=>typeof CAMP!=='undefined'&&CAMP.on&&CAMP.map);
  const afterStory=await page.evaluate(()=>({level:player.level,bag:player.gearBag.map(i=>i.id).sort(),staff:player.equipment.staff.id,gold:player.gold}));
  assert.deepEqual(afterStory,beforeStory);assert.equal(await page.evaluate(()=>CAMP.cleared[1]),1);assert.equal(await page.evaluate(()=>CAMP.unlocked),2);
  assert.deepEqual(errors,[]);
  console.log('Browser OK: gear, waves, save/load, mobile, combat and free-mode return to story before village unlock.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
