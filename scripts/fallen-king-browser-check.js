'use strict';
// Rei Caído como chefe único: conversão dos encontros, golpes reais no motor,
// sprites dos dois atlas, limpeza na morte e modo ?bosses=classic.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const GAME=pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href;
function boot(){
 TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;gameState='hub';
 document.body.classList.remove('titling');tlShow(false,false);
 player.skillTutorialState='done';skillSync();
 player.hp=player.maxHp=10000;player.barrier=0;player.armor=0;player.waveProgress=EquipmentModel.progress();
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(GAME);
  await page.waitForFunction(()=>SPR.ready('fallenKing')&&SPR.ready('fallenKingSlam'));
  const result=await page.evaluate(boot=>{
   eval('('+boot+')')();
   const missions=MISSION_TEMPLATES.map(m=>m.boss.name);
   // Missão: o chefe nasce como rei, com a vida da missão.
   currentMission={...MISSION_TEMPLATES[1]};gameState='field';spawnBoss();
   const mission={name:bossEnemy.type.name,hp:bossEnemy.maxHp,sprite:ESPR[bossEnemy.def.name]};
   enemies=[];bossEnemy=null;currentMission=null;
   // Capitão: perde fases, escudo e IA própria; mantém a vida do encontro.
   CAMP.stage=4;spawnCaptain();const c=bossEnemy;
   const captain={name:c.type.name,hp:c.maxHp,cap:c.cap,xAI:c.xAI,source:c.kingSource,sprite:ESPR[c.def.name]};
   enemies=[];bossEnemy=null;CAMP.stage=0;
   // Expedição: o Carcereiro vira o rei com a mesma escala de wave.
   setEndlessMode('expedition');startEndless();
   const b=EXPEDITION.boss,expedition={name:b.type.name,source:b.kingSource,sprite:ESPR[b.def.name],
    scaled:b.maxHp===Math.round(SoulWardenModel.type.hp*EquipmentModel.waveStats(1).hp)};
   for(let i=0;i<120;i++)update(1/60);
   const dormant=!b.alert&&!b.king;
   enemies=[b];minions=[];solids=[];handsAreas=[];b.spawnT=0;b.alert=true;
   const ready=(slash,leap,summon)=>{b.king=null;b.kingGap=0;b.kingCd={slash,leap,summon};P.hit=0;playerDash.time=0;};
   // Corte: sem dano no aviso, dano no contato; atrás do rei não acerta.
   ready(0,9,9);setPlayerAt(b.x-2,b.y);let hp=player.hp;updateMobAbility(b,.01);
   const slash=b.king?.kind==='slash';updateMobAbility(b,.79);const slashWarned=player.hp===hp;
   updateMobAbility(b,.2);const slashHit=player.hp<hp;updateMobAbility(b,1);
   ready(0,9,9);setPlayerAt(b.x-2,b.y);updateMobAbility(b,.01);setPlayerAt(b.x+2.2,b.y);hp=player.hp;
   updateMobAbility(b,1.2);const slashDodged=player.hp===hp;updateMobAbility(b,1);
   // Salto: ponto travado, pouso no ponto e impacto só ao cair.
   ready(9,0,9);setPlayerAt(b.x-5,b.y);updateMobAbility(b,.01);
   const leap=b.king?.kind==='leap',tx=b.king.tx,ty=b.king.ty;
   const hazard=minionHazards().some(h=>Math.hypot(h.x-tx,h.y-ty)<1e-6);drawMobAbilityWarnings();
   hp=player.hp;updateMobAbility(b,1);updateMobAbility(b,.3);const airborne=b.jumpZ>0&&player.hp===hp;
   updateMobAbility(b,.3);const landed=Math.hypot(b.x-tx,b.y-ty)<1e-6&&player.hp<hp;updateMobAbility(b,1.1);
   ready(9,0,9);setPlayerAt(b.x-5,b.y);updateMobAbility(b,.01);setPlayerAt(b.king.tx,b.king.ty+5);hp=player.hp;
   updateMobAbility(b,1.6);const leapDodged=player.hp===hp;updateMobAbility(b,1.1);
   ready(9,0,9);setPlayerAt(b.x-5,b.y);updateMobAbility(b,.01);updateMobAbility(b,1.5);playerDash.time=.2;hp=player.hp;
   updateMobAbility(b,.1);const dashSafe=player.hp===hp;playerDash.time=0;updateMobAbility(b,1.1);
   // Conjuração: só abaixo de 50%, ergue dois guerreiros que somem com o rei.
   b.hp=b.maxHp*.4;ready(9,9,0);const left=enemiesLeft;setPlayerAt(b.x-2,b.y);updateMobAbility(b,.01);
   const summon=b.king?.kind==='summon'&&b.kingPhase2;updateMobAbility(b,1.25);
   const adds=enemies.filter(e=>e.kingOwner===b&&!e.dead);drawMobAbilityWarnings();
   const raised=adds.length===2&&enemiesLeft===left+2&&adds.every(a=>a.expedition&&a.alert&&a.lootTier==='common');
   updateMobAbility(b,1);
   // Todas as animações dos dois atlas, em oito direções.
   b.king=null;let drawn=0;
   for(const key of ['fallenKing','fallenKingSlam'])for(const name of Object.keys(SPR.sheets[key].meta.anims))
    for(let di=0;di<8;di++){drawSprite(key,b,{anim:name,animTime:.2,face:di*Math.PI/4,scale:1.5});drawn++;}
   killEnemy(b,b.x,b.y);
   const cleared=EXPEDITION.cleared&&b.king===null&&b.jumpZ===0&&adds.every(a=>a.dead);
   const loot=droppedItems.some(d=>d.type==='equipment'&&['rare','epic'].includes(d.item.rarity));
   return {missions,mission,captain,expedition,dormant,slash,slashWarned,slashHit,slashDodged,leap,hazard,
    airborne,landed,leapDodged,dashSafe,summon,raised,drawn,cleared,loot};
  },boot.toString());
  assert.deepEqual(result.missions,['Rei Caído','Rei Caído','Rei Caído']);
  assert.equal(result.mission.name,'Rei Caído');assert.equal(result.mission.sprite,'fallenKing');
  assert.equal(result.captain.name,'Rei Caído');assert.equal(result.captain.cap,false);assert.equal(result.captain.xAI,null);
  assert.equal(result.captain.source,'Capitão da Guarda');assert.equal(result.captain.sprite,'fallenKing');assert.ok(result.captain.hp>=20000);
  assert.equal(result.expedition.name,'Rei Caído');assert.equal(result.expedition.source,'Carcereiro das Almas');assert.equal(result.expedition.sprite,'fallenKing');
  for(const k of ['scaled'])assert.equal(result.expedition[k],true,k);
  for(const k of ['dormant','slash','slashWarned','slashHit','slashDodged','leap','hazard','airborne','landed','leapDodged','dashSafe','summon','raised','cleared','loot'])
   assert.equal(result[k],true,k+': '+JSON.stringify(result));
  assert.equal(result.drawn,(7+4)*8);
  // Captura no tamanho real com horda, aviso do salto e qualidade baixa.
  for(const [file,light] of [['fallen-king-game.png',false],['fallen-king-game-light.png',true]]){
   await page.evaluate(light=>{
    QUAL.mode='baixa';QUAL.dpr=1;QUAL.ls=.33;resize();
    expeditionStop();STG.on=false;CAMP.on=false;EXPEDITION.active=false;sceneMode='field';gameState='field';
    if(light)setBiome('desert');
    solids=[];handsAreas=[];enemies=[];minions=[];wave=3;eshots=[];spellFx=[];particles=[];droppedItems=[];
    setPlayerAt(-4,2);cam.x=-1;cam.y=0;document.getElementById('wave-banner').style.opacity='0';
    player.level=20;player.skillRanks={zombie:1};skillSync();player.mp=1000;equipActionSkill(1,'zombie');
    minions.forEach((m,i)=>{m.x=-3+i*.8;m.y=-1.5+(i%2);m.spawn=0;});
    currentMission={...MISSION_TEMPLATES[1]};spawnBoss();const b=bossEnemy;b.spawnT=0;b.x=3;b.y=-1;
    b.kingGap=0;b.kingCd={slash:9,leap:0,summon:9};updateMobAbility(b,.01);updateMobAbility(b,.6);
    document.querySelectorAll('.float-msg').forEach(el=>el.remove());document.getElementById('overlay-msg').style.display='none';
    document.getElementById('hud').style.display='block';updateBossHpBar();render();
   },light);
   await page.screenshot({path:path.resolve(__dirname,'../review',file)});
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{cam.x=0;render();});
  await page.screenshot({path:path.resolve(__dirname,'../review/fallen-king-mobile.png')});
  // Modo clássico: nenhum chefe é convertido.
  const classic=await context.newPage();classic.on('pageerror',e=>errors.push('classic: '+e.message));
  await classic.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await classic.goto(GAME+'?bosses=classic');await classic.waitForFunction(()=>SPR.ready('soulWarden'));
  const old=await classic.evaluate(boot=>{eval('('+boot+')')();setEndlessMode('expedition');startEndless();
   return {active:FallenKingRuntime.active,boss:EXPEDITION.boss.type.id,mission:MISSION_TEMPLATES[1].boss.name};},boot.toString());
  assert.deepEqual(old,{active:false,boss:'soulWarden',mission:'Lich Guerreiro'});
  assert.deepEqual(errors,[]);console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
