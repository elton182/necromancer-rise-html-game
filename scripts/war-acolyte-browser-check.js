'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>SPR.ready('warAcolyte'));
  const result=await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='field';sceneMode='field';STG.on=false;
   EXPEDITION.active=false;player.hp=player.maxHp=10000;player.barrier=0;player.armor=0;playerDash.time=0;
   solids=[];handsAreas=[];enemies=[];minions=[];wave=0;setPlayerAt(0,0);
   const type=ENEMY_TYPES.find(t=>t.id==='warAcolyte'),priest=spawnEnemy(type,4,0),soldier=spawnEnemy(ENEMY_TYPES[0],.8,0);
   priest.spawnT=soldier.spawnT=0;priest.abilityCd=0;soldier.abilityCd=999;
   const stats={hp:priest.maxHp,dmg:priest.dmg,spd:priest.spd,interval:priest.atkRate};
   updateMobAbility(priest,.5);const warning=soldier.dmg===8;
   updateMobAbility(priest,.5);const buff=soldier.dmg===10;
   const hp=player.hp;P.hit=0;update(.01);const realHit=hp-player.hp;
   const other=spawnEnemy(type,3,1);other.spawnT=0;other.abilityCd=0;updateMobAbility(other,1);
   const noStack=soldier.dmg===10&&priest.dmg===6;
   soldier.x=-4;const leftArea=soldier.dmg===8;soldier.x=.8;
   killEnemy(priest,priest.x,priest.y);const oneSource=soldier.dmg===10;
   killEnemy(other,other.x,other.y);const killed=soldier.dmg===8;
   priest.dead=false;priest.abilityCd=0;updateMobAbility(priest,1);resetAbilities();const reset=soldier.dmg===8&&!priest.ability;
   // The real melee path also handles acolytes' ordinary staff attack.
   enemies=[];const melee=spawnEnemy(type,.8,0);melee.spawnT=0;melee.abilityCd=999;const before=player.hp;P.hit=0;update(.01);const staff=before-player.hp;
   // Test real expedition entry, tier scaling and seeded introduction.
   player.waveProgress=EquipmentModel.progress({best:5,selected:6});gameState='hub';setEndlessMode('expedition');startEndless();
   const priests=enemies.filter(e=>e.type.id==='warAcolyte');
   const expeditionCount=priests.length,p=priests[0],tier=ExpeditionModel.tiers[p.lootTier],scale=EquipmentModel.waveStats(6);
   const scaling=p.maxHp===Math.round(Math.round(38*scale.hp)*tier.hp)&&p.dmg===Math.round(Math.round(6*scale.damage)*tier.damage);
   const plan=ExpeditionModel.plan(6),count=plan.groups.flatMap(g=>g.mobs).filter(m=>m.type===5).length;
   return {stats,warning,buff,realHit,noStack,leftArea,oneSource,killed,reset,staff,expeditionCount,scaling,count};
  });
  for(const k of ['warning','buff','noStack','leftArea','oneSource','killed','reset','scaling'])assert.equal(result[k],true,k+JSON.stringify(result));
  assert.equal(result.realHit,10);assert.equal(result.staff,6);assert.equal(result.expeditionCount,1);assert.equal(result.count,1);
  assert.equal(result.stats.hp,38);assert.equal(result.stats.interval,1.5);
  // A fixed showcase lets the full renderer exercise all eight directions and
  // animations with the real atlas, ground, enemies and allied horde.
  await page.evaluate(()=>{
   expeditionStop();STG.on=false;CAMP.on=false;EXPEDITION.active=false;sceneMode='field';gameState='field';
   document.body.classList.remove('titling');tlShow(false,false);solids=[];handsAreas=[];enemies=[];minions=[];wave=0;
   setPlayerAt(8,10);cam.x=12;cam.y=10;document.getElementById('wave-banner').style.opacity='0';player.hp=player.maxHp=10000;
   const p=spawnEnemy(ENEMY_TYPES[5],14,10);p.spawnT=0;p.abilityCd=0;
   for(const [x,y]of [[12,9],[13,12],[16,11]]){const e=spawnEnemy(ENEMY_TYPES[0],x,y);e.spawnT=0;}
   updateMobAbility(p,1.5);
   player.level=20;player.skillRanks={zombie:1};skillSync();player.mp=1000;equipActionSkill(1,'zombie');
   minions.forEach((m,i)=>{m.x=9;m.y=9+i;m.spawn=0;});spellFx=[];particles=[];
   render();
  });
  fs.mkdirSync(path.resolve(__dirname,'../review'),{recursive:true});
  await page.screenshot({path:path.resolve(__dirname,'../review/war-acolyte-game.png')});
  const visual=await page.evaluate(()=>{
   const p=enemies.find(e=>e.type.id==='warAcolyte'),sh=SPR.sheets.warAcolyte;
   const start=performance.now();
   for(let i=0;i<80;i++)for(const anim of Object.keys(sh.meta.anims))for(let di=0;di<8;di++){
    ctx.save();drawSprite('warAcolyte',p,{anim,animTime:i/24,face:di*Math.PI/4,scale:1});ctx.restore();
   }
   return {directions:sh.meta.dirs,animations:Object.keys(sh.meta.anims),drawMs:performance.now()-start};
  });
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{resize();render();});
  await page.screenshot({path:path.resolve(__dirname,'../review/war-acolyte-mobile.png')});
  assert.equal(visual.directions,8);assert.equal(visual.animations.length,6);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.resolve(__dirname,'../review/war-acolyte-results.json'),JSON.stringify({result,visual,errors},null,2));
  console.log(JSON.stringify({result,visual,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
