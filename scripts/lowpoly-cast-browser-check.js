// Lote 1 low-poly (zumbi, arqueiro inimigo, Bram) in the real update/render loop, isolated page storage.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const review=name=>path.resolve(__dirname,'../review',name);
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  fs.mkdirSync(path.resolve(__dirname,'../review'),{recursive:true});
  const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>['zombie','earcher','smith'].every(k=>SPR.ready(k))&&window.CharacterVisuals);
  // Record which atlas clip every drawn frame belongs to.
  await page.evaluate(()=>{
   window.__seen={zombie:new Set(),earcher:new Set(),smith:new Set()};const draw=spriteDraw;
   spriteDraw=function(sheet,col,row,...rest){
    for(const key of Object.keys(__seen))if(SPR.sheets[key]===sheet)for(const [name,a]of Object.entries(sheet.meta.anims))if(row>=a.row&&row<a.row+sheet.meta.dirs)__seen[key].add(name);
    return draw.call(this,sheet,col,row,...rest);
   };
  });
  const combat=await page.evaluate(()=>{try{
   const definitions=JSON.stringify([ENEMY_TYPES,MINION_DEFS],(k,v)=>k.startsWith('_')?undefined:v);
   // Same field setup as the brute check: summons come from an equipped action slot, waves are drained.
   window.setTimeout=()=>0;TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;
   player.level=20;player.skillRanks={zombie:5};player.skillTutorialState='done';skillSync();
   gameState='hub';player.waveProgress=EquipmentModel.progress({best:3,selected:4});setEndlessMode('expedition');startEndless();
   enemies.forEach(e=>scene.remove(e.mesh));enemies=[];enemiesLeft=99;spawnQueue=[];solids=[];eshots=[];mobZones=[];
   document.body.classList.remove('titling','camp','camp-nosum');tlShow(false,false);
   player.hp=player.maxHp=100000;player.barrier=0;player.skillEquipTutorialSeen=['zombie'];equipActionSkill(1,'zombie');
   const zombies=actionGroup('zombie');if(!zombies.length)throw new Error('Zombie summon failed');
   zombies.forEach((m,i)=>{m.x=P.x-1+(i%3);m.y=P.y-1+Math.floor(i/3)*1.4;m.hp=m.maxHp=5000;});
   const archer=ENEMY_TYPES.find(t=>t.name==='Arqueiro'),warrior=ENEMY_TYPES.find(t=>t.name==='Guerreiro');
   const foe=(type,x,y)=>{const e=spawnEnemy(type,P.x+x,P.y+y);e.spawnT=0;e.hp=e.maxHp=4000;e.home={x:e.x,y:e.y};e.alert=true;return e;};
   for(const [x,y]of [[7,-2.5],[7.5,2.5],[9,0]])foe(archer,x,y);
   foe(warrior,2.5,0);
   const step=n=>{for(let i=0;i<n;i++){update(1/30);cam.x=P.x;cam.y=P.y;render();}};
   step(40);
   for(const m of minions)m._abilityCd=0;for(const e of enemies)if(e.type.name==='Arqueiro')e.abilityCd=0;
   step(120);
   for(const m of minions)m.hit=.25;for(const e of enemies)e.hit=.25;step(4);
   return {definitions,zombies:minions.length,archers:enemies.filter(e=>e.type.name==='Arqueiro').length};
  }catch(error){return {error:error.stack};}});
  if(combat.error)throw new Error(combat.error);
  await page.screenshot({path:review('lowpoly-lote1-combat.png')});
  // Close-up for evidence only: wave banner hidden, clip around the fight at device scale 2.
  const fight=await page.evaluate(()=>{document.getElementById('wave-banner')?.style.setProperty('display','none');cam.x=P.x+3;cam.y=P.y;render();return {x:sx(P.x+3),y:sy(P.y)};});
  await page.screenshot({path:review('lowpoly-lote1-combat-closeup.png'),clip:{x:fight.x-230,y:fight.y-150,width:460,height:280}});
  await page.evaluate(()=>{QUAL.mode='low';QUAL.dpr=1;QUAL.ls=.34;resize();cam.x=P.x;cam.y=P.y;render();});
  await page.screenshot({path:review('lowpoly-lote1-combat-low.png')});
  const after=await page.evaluate(()=>{
   const step=n=>{for(let i=0;i<n;i++){update(1/30);cam.x=P.x;cam.y=P.y;render();}};
   for(const e of enemies.slice())if(!e.dead)killEnemy(e,e.x,e.y);
   const alive=minions.filter(m=>!m.dead).length;const fallen=minions.find(m=>!m.dead);fallen.hp=1;dealDamageToMinion(fallen,1e7);step(36);
   // Idle allies orbit the necromancer in the real loop; hold them still and advance only render time.
   enemies=[];for(const m of minions){m.target=null;m.swing=0;}for(let i=0;i<14*30;i++){time+=1/30;cam.x=P.x;cam.y=P.y;render();}
   return {alive,fallenDead:!!fallen.dead};
  });
  await page.screenshot({path:review('lowpoly-lote1-death-idle.png')});
  const village=await page.evaluate(()=>{
   QUAL.mode='auto';QUAL.dpr=2;QUAL.ls=.5;resize();
   enemies=[];minions=[];TITLE.active=false;TITLE.paused=true;COMIC.active=false;CAMP.on=false;CAMP.map=false;gameState='hub';sceneMode='hub';tlShow(false,false);buildHubScene();
   const bram=hubProps.find(p=>p.id==='bram');P.x=bram.x+2.2;P.y=bram.y+1.6;cam.x=bram.x+1;cam.y=bram.y+.8;
   VIL.open=null;time=3;render();time=24+11.2-(((bram.ref||bram).phase||0)%12);render();
   return {bram:[bram.x,bram.y]};
  });
  await page.screenshot({path:review('lowpoly-lote1-village-idle.png')});
  const spot=await page.evaluate(()=>{const bram=hubProps.find(p=>p.id==='bram');VIL.open='bram';time=13;render();return {x:sx(bram.x),y:sy(bram.y)};});
  await page.screenshot({path:review('lowpoly-lote1-village-talk.png'),clip:{x:spot.x-110,y:spot.y-150,width:220,height:190}});
  await page.evaluate(()=>{VIL.open=null;time=20;render();});
  await page.screenshot({path:review('lowpoly-lote1-village-idle-closeup.png'),clip:{x:spot.x-110,y:spot.y-150,width:220,height:190}});
  const seen=await page.evaluate(()=>({...Object.fromEntries(Object.entries(__seen).map(([k,v])=>[k,[...v].sort()])),definitions:JSON.stringify([ENEMY_TYPES,MINION_DEFS],(k,v)=>k.startsWith('_')?undefined:v)}));
  assert.equal(seen.definitions,combat.definitions,'combat definitions changed');
  for(const clip of ['idle','idle_variation','walk','attack','attack_secondary','spawn','hurt','death'])assert.ok(seen.zombie.includes(clip),'zombie '+clip+' '+seen.zombie);
  for(const clip of ['walk','attack','windup','hurt','death'])assert.ok(seen.earcher.includes(clip),'earcher '+clip+' '+seen.earcher);
  for(const clip of ['idle','talk'])assert.ok(seen.smith.includes(clip),'smith '+clip+' '+seen.smith);
  assert.equal(after.fallenDead,true);assert.deepEqual(errors,[]);
  console.log('Lote 1 OK:',JSON.stringify({combat:{zombies:combat.zombies,archers:combat.archers},seen:{zombie:seen.zombie,earcher:seen.earcher,smith:seen.smith},village}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
