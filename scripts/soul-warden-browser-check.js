'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);
  await page.waitForFunction(()=>SPR.ready('soulWarden'));
  const result=await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='hub';
   document.body.classList.remove('titling');tlShow(false,false);
   player.skillTutorialState='done';skillSync();
   player.hp=player.maxHp=10000;player.barrier=0;player.armor=0;player.waveProgress=EquipmentModel.progress();
   setEndlessMode('expedition');startEndless();
   const b=EXPEDITION.boss,initial={id:b.type.id,hp:b.maxHp,dmg:b.dmg};
   for(let i=0;i<120;i++)update(1/60);
   const dormant=!b.alert&&b.ability===null;
   enemies=[b];minions=[];solids=[];handsAreas=[];b.spawnT=0;setPlayerAt(b.x-4,b.y);b.abilityCd=0;
   update(.01);const awake=b.alert&&b.ability?.kind==='slam';
   const old=player.hp;updateMobAbility(b,1.1);const warned=player.hp===old;
   updateMobAbility(b,.11);const damage=player.hp<old;
   updateMobAbility(b,1);b.abilityCd=0;b.wardenStep=0;P.hit=0;setPlayerAt(b.x-4,b.y);updateMobAbility(b,.01);
   const x=b.ability.tx,y=b.ability.ty;setPlayerAt(x,y+4);const hp=player.hp;updateMobAbility(b,1.2);const dodged=player.hp===hp;
   updateMobAbility(b,1);b.abilityCd=0;b.wardenStep=0;setPlayerAt(b.x-4,b.y);updateMobAbility(b,.01);playerDash.time=.18;P.hit=0;
   const dashHp=player.hp;updateMobAbility(b,1.2);const dashSafe=player.hp===dashHp;playerDash.time=0;
   updateMobAbility(b,1);b.hp=b.maxHp*.5;b.abilityCd=0;b.wardenStep=1;updateMobAbility(b,.01);drawMobAbilityWarnings();
   const phase=b.wardenPhase,hazards=minionHazards().length;updateMobAbility(b,1.35);const projectiles=eshots.filter(s=>s.warden).length;
   updateMobAbility(b,1);b.abilityCd=0;updateMobAbility(b,.01);const seals=b.ability.kind==='seals'&&b.ability.points.length===3;
   drawMobAbilityWarnings();
   for(const name of Object.keys(SPR.sheets.soulWarden.meta.anims))for(let di=0;di<8;di++)drawSprite('soulWarden',b,{anim:name,animTime:.3,face:di*Math.PI/4,scale:1.4});
   killEnemy(b,b.x,b.y);const cleared=EXPEDITION.cleared&&b.ability===null&&eshots.every(s=>s.owner!==b);
   const loot=droppedItems.some(d=>d.type==='equipment'&&['rare','epic'].includes(d.item.rarity));
   const gold=player.gold;endWave();const once=player.gold===gold;
   setPlayerAt(EXPEDITION.map.exit.x,EXPEDITION.map.exit.y);tryPortal();
   const next=wave===2&&EXPEDITION.boss.type.id==='soulWarden';
   const scaled=EXPEDITION.boss.maxHp===Math.round(SoulWardenModel.type.hp*EquipmentModel.waveStats(2).hp);
   return {initial,dormant,awake,warned,damage,dodged,dashSafe,phase,hazards,projectiles,seals,cleared,loot,once,next,scaled};
  });
  for(const k of ['dormant','awake','warned','damage','dodged','dashSafe','seals','cleared','loot','once','next','scaled'])assert.equal(result[k],true,k+': '+JSON.stringify(result));
  assert.equal(result.phase,2);assert.equal(result.projectiles,7);assert.ok(result.hazards>=7);
  await page.evaluate(()=>{
   const b=EXPEDITION.boss;enemies=[b];minions=[];solids=[];setPlayerAt(b.x-5,b.y+2);cam.x=b.x-2;cam.y=b.y;
   b.spawnT=0;b.alert=true;b.abilityCd=0;b.wardenStep=0;b.hp=b.maxHp*.7;updateMobAbility(b,.01);updateMobAbility(b,.65);
   document.querySelectorAll('.float-msg').forEach(el=>el.remove());document.getElementById('wave-banner').style.display='none';
   document.getElementById('overlay-msg').style.display='none';
   particles=[];droppedItems=[];shake=0;b.hit=0;expeditionUpdateHud();
   document.getElementById('hud').style.display='block';updateBossHpBar();render();
  });
  await page.screenshot({path:path.resolve(__dirname,'../review/soul-warden-game.png')});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{const b=EXPEDITION.boss;setPlayerAt(b.x-2,b.y+1.5);expeditionCamera(1);render();});
  await page.screenshot({path:path.resolve(__dirname,'../review/soul-warden-mobile.png')});
  assert.deepEqual(errors,[]);console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
