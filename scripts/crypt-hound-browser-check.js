'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  fs.mkdirSync(path.resolve(__dirname,'../review'),{recursive:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>SPR.ready('cryptHound'));
  const result=await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='field';sceneMode='field';STG.on=false;
   player.hp=player.maxHp=1000;player.barrier=0;player.armor=0;playerDash.time=0;
   solids=[];handsAreas=[];enemies=[];minions=[];wave=0;setPlayerAt(6,0);
   const type=ENEMY_TYPES[4],e=spawnEnemy(type,0,0);e.spawnT=0;
   const stats={hp:e.hp,dmg:e.dmg,spd:e.spd,interval:e.atkRate,range:e.atkR,cd:e.abilityCd};
   e.abilityCd=0;const before=player.hp;updateMobAbility(e,.75);playerDash.time=.18;updateMobAbility(e,.5);const dashSafe=player.hp===before;playerDash.time=0;
   const stop=e.x,phase=e.ability.phase;updateMobAbility(e,1);const cooldown=e.abilityCd;
   e.x=0;e.y=0;e.abilityCd=0;setPlayerAt(6,0);updateMobAbility(e,.75);setPlayerAt(6,3);updateMobAbility(e,.5);const dodged=player.hp===before&&e.x===6;
   e.x=0;e.y=0;e.ability=null;e.abilityCd=0;setPlayerAt(6,0);handsAreas=[{x:3,y:0,ux:0,uy:1,half:2,width:.4}];updateMobAbility(e,1.3);const wall=e.x<3&&e.ability.phase==='recover';handsAreas=[];
   e.x=0;e.y=0;e.ability=null;e.abilityCd=0;solids=[{x:3,y:0,r:.5}];updateMobAbility(e,1.3);const solid=e.x<3;solids=[];
   e.ability=null;e.abilityCd=0;e.x=0;updateMobAbility(e,.3);killEnemy(e,e.x,e.y);const cancelled=e.dead&&e.ability===null;
   const queue=CryptHoundModel.arenaTypes(4,13,ENEMY_TYPES,()=>.5);const intro=queue[0].id==='cryptHound'&&queue.slice(1).every(t=>t.name==='Guerreiro');
   player.waveProgress=EquipmentModel.progress({best:3,selected:4});gameState='hub';setEndlessMode('expedition');startEndless();
   const dogs=enemies.filter(e=>e.type.id==='cryptHound'),counts=dogs.length;
   const scales=dogs.every(e=>{
    const tier=ExpeditionModel.tiers[e.lootTier],scale=EquipmentModel.waveStats(4);
    return e.atkRate===1.2&&e.atkR===1&&Math.abs(e.spd-3.2*COMBAT_TUNING.enemySpeed*tier.speed)<1e-8
     &&e.maxHp===Math.round(Math.round(32*scale.hp)*tier.hp)&&e.dmg===Math.round(Math.round(7*scale.damage)*tier.damage);
   });
   resetAbilities();const reset=dogs.every(e=>!e.ability);
   return {stats,dashSafe,stop,phase,cooldown,dodged,wall,solid,cancelled,intro,counts,scales,reset};
  });
  assert.equal(result.stats.interval,1.2);assert.equal(result.stats.cd,2);assert.equal(result.stats.hp,32);assert.equal(result.stats.dmg,7);
  for(const key of ['dashSafe','dodged','wall','solid','cancelled','intro','scales','reset'])assert.equal(result[key],true,key+': '+JSON.stringify(result));
  assert.equal(result.phase,'recover');assert.equal(result.cooldown,7);assert.equal(result.counts,3);
  // Exercise the actual update loop, including bite, separation and special suppression.
  const combat=await page.evaluate(()=>{
   EXPEDITION.active=false;STG.on=false;CAMP.on=false;sceneMode='field';gameState='field';solids=[];handsAreas=[];enemies=[];minions=[];setPlayerAt(0,0);player.hp=player.maxHp=10000;player.barrier=0;P.hit=0;
   const e=spawnEnemy(ENEMY_TYPES[4],.8,0);e.spawnT=0;e.abilityCd=999;const before=player.hp;update(.05);const bite=player.hp<before&&e.swing>0;
   e.x=5;e.y=0;e.ability=null;e.abilityCd=0;e.atkTimer=0;const hp=player.hp;update(.05);const stopped=e.x===5&&e.ability?.phase==='windup'&&player.hp===hp;
   for(let i=0;i<70;i++)update(1/60);return {bite,stopped,phase:e.ability?.phase,hp:player.hp};
  });
  assert.equal(combat.bite,true);assert.equal(combat.stopped,true);
  const allyHit=await page.evaluate(()=>{
   enemies=[];minions=[];setPlayerAt(6,0);player.level=20;player.skillRanks={zombie:1};skillSync();player.mp=1000;equipActionSkill(1,'zombie');
   const m=actionGroup('zombie')[0];minions=[m];m.x=3;m.y=0;m.hp=m.maxHp=100;
   const e=spawnEnemy(ENEMY_TYPES[4],0,0);e.abilityCd=0;e.spawnT=0;const hp=player.hp;
   updateMobAbility(e,.75);const target=e.ability.tx;updateMobAbility(e,.3);
   return {target,allyDamaged:m.hp<100,playerSafe:player.hp===hp,stopped:e.x<3};
  });
  assert.equal(allyHit.target,3);assert.equal(allyHit.allyDamaged,true);assert.equal(allyHit.playerSafe,true);assert.equal(allyHit.stopped,true);
  await page.evaluate(()=>{
   document.body.classList.remove('titling');tlShow(false,false);cam.x=P.x;cam.y=P.y;
   minions=[];setPlayerAt(0,0);cam.x=0;cam.y=0;const e=enemies.find(e=>e.type.id==='cryptHound');e.ability=null;e.abilityCd=0;e.x=5;e.y=0;updateMobAbility(e,.4);
   render();
  });
  await page.screenshot({path:path.resolve(__dirname,'../review/crypt-hound-game.png')});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result,combat,allyHit,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
