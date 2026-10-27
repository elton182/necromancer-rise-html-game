// Exercise real sprite selection, lazy encounter defaults, the 2.5D Bram atlas and the low-poly Lote 1 cast (zombie, enemy archer).
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);
 await page.waitForFunction(()=>window.CharacterVisuals&&['smith','necro','skeleton','archer'].every(k=>SPR.ready(k)));
 const result=await page.evaluate(async()=>{
  const definitions=JSON.stringify([ENEMY_TYPES,MINION_DEFS]);
  TITLE.active=false;TITLE.paused=true;COMIC.active=false;CAMP.on=false;CAMP.map=false;gameState='hub';sceneMode='hub';tlShow(false,false);document.body.classList.remove('titling','camp','camp-nosum');buildHubScene();
  P.x=-9;P.y=2;P.deadT=0;P.hit=0;P.swing=0;P.__s={px:P.x,py:P.y,amp:0,ang:Math.PI/4,sm:0,ps:0};cam.x=-9;cam.y=1.9;time=2;
  // First draw schedules a default, then it is reused without an explicit set().
  const dummy={x:-7,y:3,phase:0,hit:0,swing:0};drawSprite('soldier',dummy,{});await CharacterVisuals.preload();
  for(const [role,id] of Object.entries(CharacterVisuals.defaults))if(CharacterVisuals.active()[role]!=='reference_'+id)throw new Error('Default not active: '+role);
  const rows=[],draw=spriteDraw;let watched='';spriteDraw=function(sheet,col,row,...args){rows.push({label:watched,col,row});return draw(sheet,col,row,...args);};
  const expected=[];
  try{
   for(const [name,color]of [['cast','#f1e5c4'],['nova','#ff5522'],['channel','#e8e0c0']]){
    watched=name;castAnim(P.x+1,P.y,color);P.swing=.14;drawSprite('necro',P,{attacking:true,aim:Math.PI/4});expected.push([name,SPR.sheets.necro.meta.anims[name].row]);
   }
   P.swing=0;playerDash.time=.09;playerDash.dx=1;playerDash.dy=0;watched='dash';drawSprite('necro',P,{});expected.push(['dash',SPR.sheets.necro.meta.anims.dash.row]);playerDash.time=0;
   const before=JSON.stringify([player.hp,player.mp,P.swing]);
   const talkRow=SPR.sheets.smith.meta.anims.talk.row;
   for(let i=0;i<8;i++){watched='bram'+i;drawSprite('smith',dummy,{face:i*Math.PI/4,attacking:true});}
   if(JSON.stringify([player.hp,player.mp,P.swing])!==before)throw new Error('Drawing changed actor resources');
   for(let i=0;i<8;i++)if(!rows.some(r=>r.label==='bram'+i&&r.row===talkRow+i))throw new Error('Bram talk direction '+i);
   // Mordida Pútrida: swing plus a freshly restarted ability cooldown selects the bite row.
   const zombie={x:-6,y:3,phase:0,hit:0,swing:.4,spawn:0,_abilityCd:6.8};watched='bite';drawSprite('zombie',zombie,{});expected.push(['bite',SPR.sheets.zombie.meta.anims.attack_secondary.row]);
   const archer={x:-5,y:3,phase:0,hit:0,swing:0,ability:{phase:'windup',time:.3,dx:1,dy:0}};watched='windup';drawSprite('earcher',archer,{scale:1.16});expected.push(['windup',SPR.sheets.earcher.meta.anims.windup.row]);
  }finally{spriteDraw=draw;P.swing=0;playerDash.time=0;}
  for(const [label,start]of expected)if(!rows.some(r=>r.label===label&&r.row>=start&&r.row<start+8))throw new Error('Missing clip '+label);
  const smithAnims=SPR.sheets.smith.meta.anims;
  if(SPR.sheets.smith.meta.dirs!==8||SPR.sheets.smith.meta.cell!==144||!smithAnims.idle||!smithAnims.idle_variation||!smithAnims.talk)throw new Error('Bram clips missing');
  for(const [key,clips]of [['zombie',['idle','idle_variation','walk','attack','attack_secondary','spawn','hurt','death']],['earcher',['idle','idle_variation','walk','attack','windup','hurt','death']]]){
   const m=SPR.sheets[key].meta;if(m.dirs!==8||m.cell!==224||m.ppu!==56||m.anchorY!==165||clips.some(c=>!m.anims[c]))throw new Error('Lote 1 contract '+key);
  }
  if(SPR.sheets.skeleton.meta.anims.attack.n!==8||SPR.sheets.archer.meta.anims.attack.n!==8)throw new Error('Minion clips not updated');
  if(JSON.stringify([ENEMY_TYPES,MINION_DEFS])!==definitions)throw new Error('Combat definitions changed');
  const canvas=document.createElement('canvas');canvas.width=canvas.height=224;const painter=canvas.getContext('2d',{willReadFrequently:true});let checked=0;
  for(const key of ['necro','skeleton','archer','zombie','earcher','smith',...new Set(Object.values(CharacterVisuals.active()))]){
   const sh=SPR.sheets[key],m=sh.meta,C=m.cell;
   for(const anim of Object.values(m.anims))for(let direction=0;direction<m.dirs;direction++)for(let frame=0;frame<anim.n;frame++){
    painter.clearRect(0,0,224,224);painter.drawImage(sh.img,frame*C,(anim.row+direction)*C,C,C,0,0,224,224);const rgba=painter.getImageData(0,0,224,224).data;let visible=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i]>128)visible++;if(visible<30)throw new Error('Empty frame '+key+'/'+anim.row+'/'+direction+'/'+frame);checked++;
   }
  }
  return {checked,clips:expected.map(e=>e[0]),defaults:CharacterVisuals.active()};
 });
 // Presentation fixture: existing actors and enemy classes, paused; no saved encounter.
 await page.evaluate(()=>{
  player.level=30;player.skillRanks={skeleton:3,archer:3,specter:3};skillSync();player.minionSlots=30;
  for(const [i,type]of ['skeleton','archer','specter'].entries()){const m=spawnMinion(type);if(!m)throw new Error('Summon failed '+type);m.x=-8+i*1.5;m.y=3.2;m.spawn=0;m.__s={px:m.x,py:m.y,amp:0,ang:Math.PI/4,sm:0,ps:0};}
  for(const [i,name]of ['Guerreiro','Bruto','Mago Vivo','Cão de Cripta'].entries()){const e=spawnEnemy(ENEMY_TYPES.find(t=>t.name===name),-11+i*2,6.6);e.spawnT=0;e.__s={px:e.x,py:e.y,amp:0,ang:Math.PI/4,sm:0,ps:0};}
  time=4;cam.x=-9;cam.y=3;P.__s={px:P.x,py:P.y,amp:0,ang:Math.PI/4,sm:0,ps:0};render();
 });
 await page.waitForTimeout(700);await page.evaluate(()=>render());await page.screenshot({path:path.resolve(__dirname,'../review/cast-updated-in-game.png')});
 await page.evaluate(()=>{time=5;castAnim(P.x+1,P.y,'#ff5522');P.swing=.14;render();});await page.screenshot({path:path.resolve(__dirname,'../review/zephyr-nova-in-game.png')});
 assert.deepEqual(errors,[]);console.log('Updated cast OK:',JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
