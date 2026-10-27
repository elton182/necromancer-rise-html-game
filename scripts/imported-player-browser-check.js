const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const rigged=process.argv.includes('--rigged');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  const url=pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href;
  await page.goto(url);await page.waitForFunction(()=>SPR.ready('necro'),null,{polling:50});
  await page.waitForFunction(()=>window.GameVisualBoot?.ready,null,{polling:50});
  assert.equal(await page.evaluate(()=>SPR.sheets.necro.meta.source),'purple_hooded_mage.glb');
  assert.equal(await page.evaluate(()=>!!SPR.sheets.necro.meta.staticPrototype),false);
  await page.goto(url+'?playerModel='+(rigged?'purple_mage':'necromancer_1'));
  await page.waitForFunction(()=>SPR.ready('necro'),null,{polling:50});
  await page.waitForFunction(()=>window.GameVisualBoot?.ready,null,{polling:50});
  if(rigged)await page.waitForFunction(()=>SPR.ready('playerStaff')&&window.RiggedPlayerTest,null,{polling:50});
  const result=await page.evaluate(()=>{
   const sh=SPR.sheets.necro;let calls=0;
   const original=spriteDraw;
   spriteDraw=function(...args){if(args[0]===sh)calls++;return original.apply(this,args);};
   try{for(let di=0;di<8;di++)for(const anim of ['idle','walk','cast','death'])
    drawSprite('necro',{x:0,y:0},{face:di*Math.PI/4,anim,animTime:0});
   }finally{spriteDraw=original;}
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;
   gameState='field';sceneMode='field';STG.on=false;enemies=[];minions=[];solids=[];
   setPlayerAt(6,3);cam.x=6;cam.y=3;P.deadT=0;
   document.body.classList.remove('titling');tlShow(false,false);
   player.level=20;player.skillRanks={zombie:1,archer:1};skillSync();player.mp=1000;
   equipActionSkill(1,'zombie');equipActionSkill(2,'archer');
   minions=[...actionGroup('zombie'),...actionGroup('archer')];
   minions.forEach((m,i)=>{m.x=P.x+(i-2)*1.2;m.y=P.y+1.8;m.spawn=0;m.mesh.position.x=m.x;m.mesh.position.z=m.y;});
   render();
   return {calls,static:sh.meta.staticPrototype,width:sh.img.naturalWidth,height:sh.img.naturalHeight,horde:minions.length,frames:Object.values(sh.meta.anims).map(a=>a.n),artVersion:sh.meta.artVersion};
  });
  assert.equal(result.calls,32);assert.equal(result.static,!rigged);
  assert.equal(result.width,rigged?1792:224);assert.equal(result.height,rigged?7168:1792);
  if(rigged){assert.deepEqual(result.frames,[4,8,6,6]);assert.equal(result.artVersion,'black-outline-layered-staff-v4');}
  assert.ok(result.horde>0);
  if(rigged){
   const weapon=await page.evaluate(()=>{
    const before=localStorage.getItem('necromancer_v2'),sh=SPR.sheets.necro,counts=[];
    for(const id of ['none','original']){
     RiggedPlayerTest.setWeapon(id);let n=0;const draw=ctx.drawImage;
     ctx.drawImage=function(...args){n++;return draw.apply(this,args);};
     try{spriteDraw(sh,0,2,100,100,224);}finally{ctx.drawImage=draw;}
     counts.push(n);
    }
    return {counts,invalid:RiggedPlayerTest.setWeapon('invalida'),unchanged:localStorage.getItem('necromancer_v2')===before};
   });
   assert.deepEqual(weapon.counts,[1,2]);assert.equal(weapon.invalid,false);assert.equal(weapon.unchanged,true);
   await page.getByLabel('Arma do teste').selectOption('none');
   assert.equal(await page.evaluate(()=>RiggedPlayerTest.weapon),'none');
   await page.getByLabel('Arma do teste').selectOption('original');
   const selected=await page.evaluate(()=>{
    const rows={},original=spriteDraw,ref={x:0,y:0,phase:0};
    spriteDraw=function(sh,col,row,...rest){if(sh===SPR.sheets.necro)(rows[row]??=[]).push(col);return original(sh,col,row,...rest);};
    try{
     for(let i=0;i<16;i++){time=i*.15;drawSprite('necro',ref,{face:0});}
     for(let i=0;i<16;i++){ref.x+=.1;ref.phase=i*.5;drawSprite('necro',ref,{face:0});}
     for(let i=0;i<6;i++)drawSprite('necro',ref,{face:0,attacking:true,prog:i/5});
     for(let i=0;i<6;i++)drawSprite('necro',ref,{face:0,deadT:(i+.1)*.8/6});
    }finally{spriteDraw=original;}
    return Object.fromEntries(Object.entries(rows).map(([r,c])=>[r,new Set(c).size]));
   });
   for(const row of [0,8,16,24])assert.ok(selected[row]>1,JSON.stringify(selected));
   await page.evaluate(()=>{applyQuality('baixa');render();});
  }
  fs.mkdirSync(path.resolve(__dirname,'../review'),{recursive:true});
  await page.screenshot({path:path.resolve(__dirname,rigged?'../review/rigged-player-game.png':'../review/imported-player-game.png')});
  await page.evaluate(()=>{SPR.on=false;render();});
  await page.screenshot({path:path.resolve(__dirname,rigged?'../review/rigged-player-fallback.png':'../review/imported-player-fallback.png')});
  assert.equal(await page.evaluate(()=>SPR.ready('necro')),false);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
