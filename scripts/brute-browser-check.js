'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href,{waitUntil:'load'});
  const result=await page.evaluate(()=>{
   window.setTimeout=()=>0;
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;P.deadT=0;
   player.level=20;player.skillRanks={zombie:5,vigor:5,abom:1};player.skillTutorialState='done';skillSync();
   gameState='hub';player.waveProgress=EquipmentModel.progress({best:26,selected:27});
   setEndlessMode('expedition');startEndless();
   enemies.forEach(e=>scene.remove(e.mesh));enemies=[];enemiesLeft=1;spawnQueue=[];solids=[];eshots=[];mobZones=[];
   player.skillEquipTutorialSeen=['zombie','abom'];equipActionSkill(1,'zombie');
   const ally=actionGroup('zombie')[0];minions=minions.filter(m=>m===ally);
   ally.x=P.x+2;ally.y=P.y;ally.hp=ally.maxHp=100000;
   const hitChecks=ENEMY_TYPES.map(type=>{
    const foe=spawnEnemy(type,P.x+5,P.y);foe.hp=foe.maxHp=100000;
    for(let i=0;i<20;i++)dealDamageToEnemy(foe,5);
    return {type:type.name,impulse:Math.hypot(foe.kx||0,foe.ky||0),hp:foe.hp};
   });
   equipActionSkill(5,'abom');const abom=actionGroup('abom')[0],roarTarget=enemies[0];
   roarTarget.spawnT=0;abom.x=roarTarget.x-1;abom.y=roarTarget.y;abom.target=roarTarget;
   const roar={cast:castMinionAbility(abom,necroGroup.position),impulse:Math.hypot(roarTarget.kx||0,roarTarget.ky||0),slow:roarTarget.minionSlow};
   enemies.forEach(e=>scene.remove(e.mesh));enemies=[];minions=[ally];
   const e=spawnEnemy(ENEMY_TYPES.find(t=>t.name==='Bruto'),P.x+5,P.y);
   e.expedition=true;e.home={x:e.x,y:e.y};e.alert=true;e.spawnT=0;e.abilityCd=999;e.hp=e.maxHp=100000;
   ally.target=e;const startX=e.x;
   for(let i=0;i<20;i++)dealDamageToEnemy(e,5);
   const impulse=e.kx||0;
   for(let i=0;i<120;i++)update(1/60);
   return {expedition:EXPEDITION.active,hitChecks,roar,impulse,advance:startX-e.x,hp:e.hp,stillAlive:!e.dead,
    ally:{x:ally.x,y:ally.y,dead:ally.dead,returning:ally.returning,target:ally.target?.type?.name,timer:ally.atkTimer,range:ally.atkR},enemy:{x:e.x,y:e.y},state:gameState};
  });
  assert.equal(result.expedition,true);assert.equal(result.impulse,0);
  for(const hit of result.hitChecks){assert.equal(hit.impulse,0,hit.type);assert.equal(hit.hp,99900,hit.type);}
  assert.equal(result.roar.cast,true);assert.equal(result.roar.impulse,0);assert.equal(result.roar.slow,.35);
  assert.ok(result.advance>.1,'Bruto deve continuar avançando em direção ao lacaio');
  assert.ok(result.hp<99900,'Ataques reais do lacaio devem continuar causando dano: '+JSON.stringify(result));assert.equal(result.stillAlive,true);
  assert.deepEqual(errors,[]);console.log('Browser OK: todos os mobs recebem golpes sem empurrão, Rugido desacelera sem dispersar e Bruto mantém combate com o lacaio na expedição.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
