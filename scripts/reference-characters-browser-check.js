// Real game integration: embedded frames, lazy cosmetics, combat identity, and village captures.
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);
 await page.waitForFunction(()=>typeof hasSave!=='undefined'&&window.CharacterVisuals&&['smith','necro','skeleton','archer'].every(k=>SPR.ready(k)));
 assert.deepEqual(await page.evaluate(()=>CharacterVisuals.active()),{});
 assert.equal(await page.evaluate(()=>Object.keys(SPR.sheets).some(k=>k.startsWith('reference_'))),false);
 const result=await page.evaluate(async()=>{
  const types=JSON.stringify(ENEMY_TYPES),minionDefs=JSON.stringify(MINION_DEFS);
  TITLE.active=false;TITLE.paused=true;COMIC.active=false;CAMP.on=false;CAMP.map=false;gameState='hub';sceneMode='hub';tlShow(false,false);document.body.classList.remove('titling','camp','camp-nosum');buildHubScene();
  player.level=30;player.skillTutorialState='done';player.skillRanks={skeleton:3,archer:3,specter:3};skillSync();player.minionSlots=30;
  P.x=-9;P.y=3;P.px=P.x;P.py=P.y;P.deadT=0;P.hit=0;necroGroup.position.set(P.x,0,P.y);cam.x=-9;cam.y=1.9;
  const warrior=spawnMinion('skeleton'),archer=spawnMinion('archer');
  if(!warrior||!archer)throw new Error('Existing summoning failed');
  for(const [i,m]of [warrior,archer].entries()){m.x=-7.4+i*1.4;m.y=2.7;m.spawn=0;m.__s={px:m.x,py:m.y,amp:0,ang:Math.PI/4,sm:0,ps:0};}
  // Exercise real actor animation selection without changing its attack or death state.
  let rows=[];const draw=spriteDraw;spriteDraw=function(sheet,col,row,...args){rows.push({sheet:sheet===SPR.sheets.skeleton?'skeleton':sheet===SPR.sheets.necro?'necro':'other',row});return draw(sheet,col,row,...args);};
  try{
   warrior.spawn=.3;drawSprite('skeleton',warrior,{});warrior.spawn=0;
   warrior.hit=.2;drawSprite('skeleton',warrior,{});warrior.hit=0;
   drawSprite('necro',P,{});
  }finally{spriteDraw=draw;}
  if(!rows.some(r=>r.sheet==='skeleton'&&r.row>=40&&r.row<48))throw new Error('Summon emergence not rendered');
  if(!rows.some(r=>r.sheet==='skeleton'&&r.row>=24&&r.row<32))throw new Error('Damage reaction not rendered');
  if(!rows.some(r=>r.sheet==='necro'&&r.row>=24&&r.row<32))throw new Error('Player summoning not rendered');
  time+=1;P.swing=0;P.__s={px:P.x,py:P.y,amp:0,ang:Math.PI/4,sm:0,ps:0};render();
  return {types,minionDefs,actors:2};
 });
 await page.screenshot({path:path.resolve(__dirname,'../review/reference-village-primary.png')});
 await page.evaluate(async()=>{await CharacterVisuals.set('specter','skeleton_mage');await CharacterVisuals.set('soldier','raider');await CharacterVisuals.set('brute','corrupted');await CharacterVisuals.set('cryptHound','shadow_wolf');});
 assert.equal(await page.evaluate(()=>JSON.stringify(ENEMY_TYPES)),result.types);assert.equal(await page.evaluate(()=>JSON.stringify(MINION_DEFS)),result.minionDefs);
 const decoded=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=224;const painter=canvas.getContext('2d',{willReadFrequently:true});let checked=0;
  for(const key of ['smith','necro','skeleton','archer',...Object.values(CharacterVisuals.active())]){
   const sh=SPR.sheets[key],m=sh.meta,C=m.cell;canvas.width=canvas.height=C;
   for(const anim of Object.values(m.anims))for(let direction=0;direction<m.dirs;direction++)for(const frame of [0,anim.n-1]){
    painter.clearRect(0,0,C,C);painter.drawImage(sh.img,frame*C,(anim.row+direction)*C,C,C,0,0,C,C);
    const rgba=painter.getImageData(0,0,C,C).data;let visible=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i]>128)visible++;if(visible<30)throw new Error('Missing visual frame '+key+'/'+direction+'/'+frame);checked++;
   }
  }return checked;
 });
 await page.evaluate(()=>{
  const mage=spawnMinion('specter');mage.x=-4.8;mage.y=2.7;mage.spawn=0;
  const before=enemies.length;
  for(const [index,name]of ['Guerreiro','Bruto','Cão de Cripta'].entries()){
   const type=ENEMY_TYPES.find(t=>t.name===name);const e=spawnEnemy(type,-7.5+index*1.6,5.7);e.spawnT=0;
  }
  // This is a paused presentation of existing types, never a new encounter or save change.
  cam.x=-7.5;cam.y=3;time+=1;render();
 });
 await page.screenshot({path:path.resolve(__dirname,'../review/reference-village-variants.png')});
 // Player navigation and NPC interaction still use the original systems.
 await page.evaluate(()=>{CharacterVisuals.reset('soldier');CharacterVisuals.reset('brute');CharacterVisuals.reset('cryptHound');enemies=[];TITLE.paused=false;P.x=0;P.y=3;necroGroup.position.set(0,0,3);});
 const before=await page.evaluate(()=>P.x);await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');assert.ok(await page.evaluate(x=>P.x>x+.05,before));
 await page.evaluate(()=>vilOpen('bram'));assert.equal(await page.locator('#vil-modal').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#vil-modal').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('Reference characters OK:',decoded,'decoded endpoints; lazy variants, emergence/hurt/summon, original combat definitions, movement and Bram interaction.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
