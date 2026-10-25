// Run with Playwright supplied through NODE_PATH; no dependency is shipped with the game.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof masteryInvest==='function'&&typeof hasSave!=='undefined');
  await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='hub';
   player.level=12;player.skillRanks={bolt:3,zombie:3,vigor:2,burst:2};player.skillTutorialState='done';skillSync();
   player.actionLoadout=['raio','zombie','dash','empty','empty','empty'];reconcileActionSummons();
   gainExp(600);setPause(true);tPause('skills');
  });
  await page.getByRole('tab',{name:'✦ Maestrias',exact:true}).click();
  assert.equal(await page.locator('.mastery-branch').count(),3);assert.equal(await page.locator('.mastery-node').count(),6);
  const before=await page.evaluate(()=>({points:player.skillPoints,damage:skillMinionStats('zombie').dmg,life:skillMinionStats('zombie').hp,mastery:masteryState('zombie').level}));
  assert.ok(before.mastery>1);assert.equal(await page.evaluate(()=>masteryState('maldicao').level),1);
  await page.locator('[data-mastery-node="power"]').click();
  assert.equal(await page.evaluate(()=>player.skillPoints),before.points);assert.equal(await page.evaluate(()=>masteryState('zombie').ranks.power),1);
  assert.ok(await page.evaluate(()=>skillMinionStats('zombie').dmg)>before.damage);
  await page.screenshot({path:path.resolve(__dirname,'../review/skill-mastery-desktop.png'),fullPage:true});
  await page.getByRole('button',{name:/Maldição da Fraqueza · 1/}).click();
  assert.equal(await page.locator('.mastery-invest:enabled').count(),0);assert.ok(await page.locator('.mastery-locked').isVisible());
  await page.getByRole('button',{name:/Zumbis · /}).click();
  await page.getByRole('button',{name:'Redistribuir maestria · grátis',exact:true}).click();
  assert.equal(await page.evaluate(()=>SkillMasteryModel.spent(masteryState('zombie'))),0);assert.equal(await page.evaluate(()=>masteryState('zombie').level),before.mastery);
  await page.locator('[data-mastery-node="body"]').click();
  assert.ok(await page.evaluate(()=>skillMinionStats('zombie').hp)>before.life);
  await page.getByRole('tab',{name:'☠ Minions',exact:true}).click();assert.equal(await page.locator('.lg-school').count(),3);
  await page.getByRole('tab',{name:'✦ Maestrias',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.resolve(__dirname,'../review/skill-mastery-mobile.png'),fullPage:true});
  const overflow=await page.locator('.mastery-panel').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(overflow,false);
  const state=await page.evaluate(()=>{saveGame();return JSON.stringify(player.skillMastery);});
  await page.reload({waitUntil:'load'});assert.equal(await page.evaluate(()=>loadGame()),true);assert.equal(await page.evaluate(()=>JSON.stringify(player.skillMastery)),state);
  const legacy=await page.evaluate(()=>{
   const saved=JSON.parse(localStorage.getItem(SAVE_KEY)),ranks=JSON.stringify(saved.skillRanks);delete saved.skillMastery;delete saved.skillMasteryVersion;
   localStorage.setItem(SAVE_KEY,JSON.stringify(saved));const loaded=loadGame();
   return {loaded,ranksPreserved:JSON.stringify(player.skillRanks)===ranks,freshMasteries:SkillMasteryModel.ids.every(id=>masteryState(id).level===1)};
  });assert.deepEqual(legacy,{loaded:true,ranksPreserved:true,freshMasteries:true});
  // Existing level-60 characters must keep progressing skills. Duplicate slots cannot award twice.
  const result=await page.evaluate(()=>{
   player.level=60;player.actionLoadout=['raio','raio','dash','empty','empty','empty'];player.skillMastery=SkillMasteryModel.migrate();gainExp(40);
   const result={bolt:masteryState('raio').level,dash:masteryState('dash').level,zombie:masteryState('zombie').level};
   const old={level:12,skillTreeVersion:1,skillRanks:{zombie:2},actionLoadout:['raio','zombie','dash','empty','empty','empty']};
   const migrated=skillMigrateSave(old);result.legacy=migrated.skillMastery.zombie.level;result.grimoire=migrated.skillRanks.zombie;
   return result;
  });assert.deepEqual(result,{bolt:2,dash:2,zombie:1,legacy:1,grimoire:2});
  await page.evaluate(()=>{
   const check=(condition,message)=>{if(!condition)throw Error(message);};
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.map=false;P.deadT=0;gameState='field';player.level=30;
   player.skillRanks={bolt:3,rain:2,nova:2,wall:2,shield:2,curse:2,zombie:2,burst:2};player.actionLoadout=['raio','chuva','explosao','maos','barreira','dash'];player.skillMastery=SkillMasteryModel.migrate();skillSync();
   const make=(id,ranks)=>{player.skillMastery[id]=SkillMasteryModel.normalize(id,{level:20,ranks});};
   const start=()=>{player.mp=player.maxMp;player.spellCooldowns={};player.barrierCd=0;playerDash.cd=0;};
   const baseline=player.spellDmg+spellBonus('raio','raio_d');make('raio',{power:5,power_deep:5,rhythm:5,pierce:2});start();castRaio(P.x+2,P.y);
   const bolt=boltsFx.at(-1);check(bolt.dmg>baseline,'Mastery must scale live bolt damage');check(bolt.maxPierce>=3,'Mastery piercing must affect projectiles');check(player.spellCooldowns.raio<.5,'Mastery must reduce successful cast cooldown');
   const cd=player.spellCooldowns.raio;castRaio(P.x+2,P.y);check(player.spellCooldowns.raio===cd,'Failed cast must not shorten an active cooldown');
   make('chuva',{power:5,rhythm:5,rhythm_deep:5,area:4});start();castChuva(P.x+2,P.y);check(spellFx.filter(f=>f.kind==='bone').at(-1).dmg>player.spellDmg*.7,'Rain damage');check(player.spellCooldowns.chuva<5,'Rain cooldown');
   make('maos',{power:5,duration:5,duration_deep:5,body:4});start();castHands(P.x+2,P.y);const wall=handsAreas.at(-1);check(wall.hp>160&&wall.life>5&&wall.dmg>Math.round(player.spellDmg*.4),'Wall mastery must scale resistance, duration and damage');
   make('barreira',{body:5,rhythm:5,rhythm_deep:5,pact:4});start();player.hp=player.maxHp;castBarrier();check(player.barrier>player.maxHp*.25,'Shield mastery absorption');check(player.barrierCd<12,'Shield cooldown');
   make('dash',{distance:5,rhythm:5,rhythm_deep:5,escape:4});start();check(castDash(),'Dash success');check(playerDash.cd<3&&skillPercent('Distância do Dash')>1,'Dash mastery');
   make('maldicao',{curse:5,curse_deep:5,area:5,area_deep:4});start();const foe=spawnEnemy(ENEMY_TYPES[0],P.x+4.5,P.y);foe.hp=foe.maxHp=100000;foe.dmg=100;
   skillCastCurse(P.x,P.y);check(foe.skillCurseT>6&&foe.dmg<100,'Curse radius, duration and strength');
   make('explosao',{power:5,power_deep:5,area:5,rhythm:4});start();const hp=foe.hp;castExplosao(P.x,P.y);check(foe.hp<hp&&player.spellCooldowns.explosao<8,'Nova live damage and cooldown');
   const snap=EquipmentModel.snapshot(BuildModel,player,MINION_DEFS,COMBAT_TUNING),preview=snap.skills.find(s=>s.id==='raio');
   check(preview.damage===Math.floor(bolt.dmg),'Equipment preview must match live mastered bolt');
   player.skillMastery.zombie=SkillMasteryModel.normalize('zombie',{level:8,ranks:{power:2,power_deep:2}});skillSync();
   const z=player.skillMastery.zombie;player.skillRanks={};skillRemoveUnavailable();check(player.skillMastery.zombie===z,'Grimoire refund must preserve mastery');
   player.skillRanks={zombie:2};skillSync();check(masteryState('zombie').level===8,'Relearning must preserve mastery');
   campNewChar();check(SkillMasteryModel.ids.every(id=>masteryState(id).level===1&&SkillMasteryModel.spent(masteryState(id))===0),'New character must reset mastery');
  });
  assert.deepEqual(errors,[]);console.log('Mastery UI, separate points, combat stats, locked skills, respec, mobile, saves, legacy migration and max-level XP passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
