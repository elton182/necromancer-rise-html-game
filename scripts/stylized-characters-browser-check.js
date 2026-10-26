'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);
  await page.waitForFunction(()=>['necro','smith','elder','tilda','merch'].every(k=>SPR.ready(k))&&window.VillageEnvironment?.loaded);
  const metadata=await page.evaluate(()=>Object.fromEntries(['necro','smith','elder','tilda','merch'].map(key=>[key,SPR.sheets[key].meta])));
  for(const meta of Object.values(metadata))assert.equal(meta.dirs,8);
  assert.deepEqual(Object.keys(metadata.necro.anims),['idle','walk','cast','summon','hurt','death']);
  assert.deepEqual(Object.keys(metadata.smith.anims),['idle','greet','hammer','attack']);
  for(const key of ['elder','tilda','merch'])assert.deepEqual(Object.keys(metadata[key].anims),['idle','attack']);
  // The enlarged fall poses must not increase the decoded player atlas footprint.
  assert.ok(await page.evaluate(()=>SPR.sheets.necro.img.naturalWidth*SPR.sheets.necro.img.naturalHeight)<=2240*7168);
  // Decode representative frames in all directions, including the end of death/cast.
  assert.equal(await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=224;const painter=canvas.getContext('2d',{willReadFrequently:true});let checked=0;
   for(const key of ['necro','smith','elder','tilda','merch']){
    const sh=SPR.sheets[key],m=sh.meta,c=m.cell;
    for(const anim of Object.values(m.anims))for(let d=0;d<8;d++)for(const f of [0,anim.n-1]){
     painter.clearRect(0,0,c,c);painter.drawImage(sh.img,f*c,(anim.row+d)*c,c,c,0,0,c,c);
     const alpha=painter.getImageData(0,0,c,c).data;let visible=0;
     for(let i=3;i<alpha.length;i+=4)if(alpha[i]>128)visible++;
     if(visible<50)throw new Error('Missing frame '+key+'/'+d+'/'+f);checked++;
    }
   }
   return checked;
  }),Object.values(metadata).reduce((n,m)=>n+Object.keys(m.anims).length*16,0));
  await page.evaluate(()=>{TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;gameState='hub';sceneMode='hub';P.deadT=0;P.x=0;P.y=3;P.px=0;P.py=3;necroGroup.position.set(0,0,3);tlShow(false,false);document.body.classList.remove('titling','camp','camp-nosum');buildHubScene();});
  // Residents retain a readable three-quarter stance when the player walks around them.
  const poses=await page.evaluate(()=>{
   const resident=hubProps.find(p=>p.id==='bram'),original=drawSprite,records=[];
   drawSprite=function(key,ref,options){if(key==='smith')records.push({face:options.face,greet:options.attacking});return original(key,ref,options);};
   try{
    VIL.open=null;
    for(const [x,y] of [[-16,1],[-6,1],[-11,-4],[-11,6]]){P.x=x;P.y=y;drawHubProp(resident);}
    VIL.open='bram';drawHubProp(resident);
   }finally{drawSprite=original;VIL.open=null;P.x=0;P.y=3;necroGroup.position.set(0,0,3);}
   return records;
  });
  assert.ok(poses.every(p=>Math.abs(p.face-Math.PI/4)<1e-8));assert.ok(poses.slice(0,4).every(p=>!p.greet));assert.equal(poses[4].greet,true);
  const before=await page.evaluate(()=>P.x);await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');assert.ok(await page.evaluate(x=>P.x>x+.1,before));
  await page.evaluate(()=>{P.x=-9.3;P.y=3.4;P.px=P.x;P.py=P.y;necroGroup.position.set(P.x,0,P.y);cam.x=-10;cam.y=1.5;P.__s={px:P.x,py:P.y,amp:0,ang:-Math.PI*.7,sm:0,ps:0};TITLE.active=false;TITLE.paused=true;render();});
  await page.screenshot({path:path.resolve(__dirname,'../review/stylized-characters-in-game.png')});
  await page.screenshot({path:path.resolve(__dirname,'../review/stylized-characters-closeup.png'),clip:{x:450,y:220,width:350,height:390}});
  // Exercise all player render actions/directions through the actual renderer.
  await page.evaluate(()=>{
   for(const anim of ['idle','walk','cast','death'])for(let d=0;d<8;d++)drawSprite('necro',P,{anim,animTime:.25,face:d*Math.PI/4,scale:1.12});
   TITLE.active=false;TITLE.paused=false;vilOpen('bram');NpcDialogue.advance(VIL.modal);
  });
  assert.equal(await page.locator('#vil-modal').isVisible(),true);await page.locator('#vil-modal .say').click();assert.equal(await page.locator('#vm-go').isVisible(),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#vil-modal').isVisible(),false);
  assert.deepEqual(errors,[]);console.log('Stylized characters passed: 5 atlases, 8 directions, decoded action frames, bounded player texture footprint, stable three-quarter NPC stance, keyboard movement, casting/death rendering and NPC mission dialogue.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
