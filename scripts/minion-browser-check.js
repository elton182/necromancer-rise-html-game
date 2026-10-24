'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof minionRevive==='function'&&typeof hasSave!=='undefined');
  await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;CAMP.noWaves=true;P.deadT=0;gameState='hub';
   player.level=12;player.gold=1000;player.skillRanks={zombie:2,vigor:2,bolt:2};player.skillTutorialState='done';player.skillEquipTutorialSeen=['zombie'];skillSync();player.mp=player.maxMp;
   equipActionSkill(1,'zombie');gearOpen('skills');skillTreeTab='spells';skillTreeSelected='bolt';buildSkillTree();
  });
  const before=await page.evaluate(()=>({rank:skillRank('bolt'),gold:player.gold,points:player.skillPoints}));
  await page.getByRole('button',{name:/Devolver ponto de Tiro de Osso/}).click();
  assert.deepEqual(await page.evaluate(()=>({rank:skillRank('bolt'),gold:player.gold,points:player.skillPoints})),{rank:before.rank-1,gold:before.gold-20,points:before.points+1});
  await page.evaluate(()=>{player.gold=0;buildSkillTree();});
  assert.equal(await page.getByRole('button',{name:/Devolver ponto de Tiro de Osso/}).isDisabled(),true);assert.match(await page.locator('.lg-refund-feedback').innerText(),/Ouro insuficiente/);
  await page.evaluate(()=>{player.gold=1000;setPause(false);gameState='field';waveActive=false;enemies=[];spawnQueue=[];gearOpen('skills');});
  assert.equal(await page.getByRole('button',{name:/Devolver ponto de Tiro de Osso/}).isEnabled(),true);
  await page.evaluate(()=>{const m=actionGroup('zombie')[0];killMinion(m);tPause('horde');});
  assert.equal(await page.locator('#reanimate-hint').innerText(),'V · Reanimar agora (30 MP)');
  const mp=await page.evaluate(()=>player.mp);await page.getByRole('button',{name:'Reanimar #1 · 30 MP',exact:true}).click();
  const revived=await page.evaluate(()=>{const m=actionGroup('zombie')[0];return {mp:player.mp,dead:m.dead,hp:m.hp,maxHp:m.maxHp,height:m.mesh.position.y};});
  assert.equal(revived.mp,mp-30);assert.equal(revived.dead,false);assert.equal(revived.hp,Math.floor(revived.maxHp*.6));assert.equal(revived.height,.1);
  const equipment=await page.evaluate(()=>{
   const m=actionGroup('zombie')[0],oldHp=m.maxHp,ratio=m.hp/m.maxHp;
   const coat=EquipmentModel.generate(12,BuildModel,()=>.65,'body',false,'browser-horde-coat');coat.rarity='magic';coat.affixes=[{stat:'hordeHp',value:20},{stat:'mp',value:10}];player.gearBag.push(coat);gearEquip(coat.id,'body');
   return {oldHp,hp:m.maxHp,regen:m.hpRegen,ratio,newRatio:m.hp/m.maxHp};
  });assert.ok(equipment.hp>equipment.oldHp);assert.equal(equipment.regen,equipment.hp*.01);assert.ok(equipment.newRatio<=equipment.ratio);
  const protectedAlly=await page.evaluate(()=>{const m=actionGroup('zombie')[0];killMinion(m);m.sacrificed=true;const mp=player.mp;const result=minionRevive(m,true);return {result,mpBefore:mp,mpAfter:player.mp,dead:m.dead};});assert.equal(protectedAlly.result,false);assert.equal(protectedAlly.mpBefore,protectedAlly.mpAfter);assert.equal(protectedAlly.dead,true);
  const hubRecovery=await page.evaluate(()=>{setPause(false);gameState='hub';const m=actionGroup('zombie')[0];m.deadTimer=.05;update(.1);return {dead:m.dead,hp:m.hp,maxHp:m.maxHp};});assert.equal(hubRecovery.dead,false);assert.equal(hubRecovery.hp,Math.floor(hubRecovery.maxHp*.5));
  await page.evaluate(()=>{gameState='field';const m=actionGroup('zombie')[0];killMinion(m);player.mp=player.maxMp;updateHUD();});await page.keyboard.press('v');
  assert.equal(await page.evaluate(()=>actionGroup('zombie')[0].dead),false);
  const dodge=await page.evaluate(()=>{
   gameState='field';CAMP.noWaves=true;const m=actionGroup('zombie')[0];m.x=0;m.y=0;P.x=0;P.y=0;m._evade=null;m._evadeCooldown=0;
   const e=spawnEnemy(ENEMY_TYPES[3],4,0);e.ability={phase:'windup',time:0,tx:0,ty:0};enemies=[e];const hp=m.hp;for(let i=0;i<15;i++)updateMinionIntent(m,0,.05,{x:0,z:0});return {distance:Math.hypot(m.x,m.y),hpBefore:hp,hpAfter:m.hp};
  });assert.ok(dodge.distance>2.2);assert.equal(dodge.hpAfter,dodge.hpBefore);
  assert.deepEqual(errors,[]);console.log('Browser OK: refund/disabled reasons, paid early revive, horde gear HP/regen, protected recovery in hub and real minion evasion.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
