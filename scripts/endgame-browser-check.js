'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);await page.waitForFunction(()=>typeof hasSave!=='undefined');
  await page.evaluate(()=>{
   TITLE.active=false;TITLE.paused=false;COMIC.active=false;CAMP.on=false;CAMP.map=false;CAMP.inStage=false;P.deadT=0;
   document.body.classList.remove('titling');tlShow(false,false);player.level=18;player.skillRanks={zombie:1};player.skillTutorialState='done';
   player.conquest=EndgameModel.normalize({seed:42});player.waveProgress=EquipmentModel.progress();skillSync();player.hp=player.maxHp;
   document.getElementById('hud').style.display='block';enterHub();gearOpen('conquest');
  });
  await page.getByRole('heading',{name:'Pântano da Febre Negra',exact:true}).waitFor();
  assert.equal(await page.locator('.pm').count(),0);
  assert.equal(await page.locator('#hud').evaluate(el=>getComputedStyle(el).visibility),'hidden');
  for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1440,height:1000}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(100);
   const fits=await page.evaluate(()=>{const screen=document.querySelector('.conquest-screen'),map=document.querySelector('.atlas-scroll'),footer=document.querySelector('.conquest-screen-footer').getBoundingClientRect();return screen.scrollHeight<=screen.clientHeight+1&&map.scrollHeight<=map.clientHeight+1&&map.scrollWidth<=map.clientWidth+1&&footer.bottom<=innerHeight;});
   assert.ok(fits,'dedicated screen and map fit '+viewport.width+'x'+viewport.height);
   if(viewport.width===1366)await page.screenshot({path:path.resolve(__dirname,'../review/endgame-screen-desktop.png')});
  }
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.body.classList.contains('conquest-view')),false);
  assert.equal(await page.evaluate(()=>TITLE.paused),false);await page.evaluate(()=>gearOpen('conquest'));
  const map=page.locator('.atlas-scroll canvas');
  assert.equal(await page.locator('[data-map-route]').count(),17);
  const mapBox=await map.boundingBox();
  const towerPoint=await page.evaluate(()=>({x:VALDORIA_MAP.positions[6][0][0]/VALDORIA_MAP.width,y:VALDORIA_MAP.positions[6][0][1]/VALDORIA_MAP.height}));
  await map.click({position:{x:towerPoint.x*mapBox.width,y:towerPoint.y*mapBox.height}});
  assert.match(await page.locator('.atlas-detail').innerText(),/área ligada/);
  assert.equal(await page.getByRole('button',{name:'Entrar na rota · Torre da Decomposição',exact:true}).isDisabled(),true);
  await page.getByLabel('Local do mapa').selectOption('entry');
  await page.locator('.atlas-scroll').screenshot({path:path.resolve(__dirname,'../review/endgame-map.png')});
  assert.equal(await page.getByLabel('Dificuldade regional').getAttribute('max'),null);
  await page.getByLabel('Dificuldade regional').fill('3');await page.getByLabel('Dificuldade regional').press('Enter');
  await page.getByRole('button',{name:'Entrar na rota · Entrada do Brejo',exact:true}).click();
  const skip=await page.evaluate(()=>({difficulty:ENDGAME.run.difficulty,loot:ENDGAME.run.reward.itemLevel,highest:player.conquest.highest,record:player.waveProgress.best}));
  assert.deepEqual(skip,{difficulty:3,loot:16,highest:0,record:0});
  await page.evaluate(()=>{enterHub();gearOpen('conquest');});
  await page.getByLabel('Dificuldade regional').fill('1');await page.getByLabel('Dificuldade regional').press('Enter');
  assert.equal(await page.locator('.conquest-curse').count(),4);
  const curses=await page.locator('.conquest-curse input').evaluateAll(inputs=>inputs.slice(0,3).map(i=>i.getAttribute('aria-label')));
  for(const name of curses)await page.getByRole('checkbox',{name,exact:true}).check();
  assert.equal(await page.locator('.conquest-curse input:disabled').count(),1);
  await page.screenshot({path:path.resolve(__dirname,'../review/endgame-desktop.png')});
  const before=await page.evaluate(()=>({options:EndgameModel.offer(player.conquest.seed,0,1),stats:EquipmentModel.snapshot(BuildModel,player,MINION_DEFS,COMBAT_TUNING).attributes,mods:EndgameModel.modifiers(player.conquest.offers[1].selected)}));
  await page.getByRole('button',{name:'Entrar na rota · Entrada do Brejo',exact:true}).click();
  await page.waitForFunction(()=>ENDGAME.run&&EXPEDITION.active);
  const active=await page.evaluate(()=>({biome:BIOME.id,kind:ENDGAME.run.kind,curses:ENDGAME.run.curses.length,hp:player.maxHp,mpRegen:player.mpRegen,record:player.waveProgress.best}));
  assert.equal(active.biome,'swamp');assert.equal(active.curses,3);assert.equal(active.record,0);
  assert.equal(await page.evaluate(()=>document.body.classList.contains('conquest-view')),false);
  assert.equal(active.hp,Math.round(before.stats.hp*before.mods.hp));assert.ok(Math.abs(active.mpRegen-before.stats.regen*before.mods.mpRegen)<.0001);
  const abort=await page.evaluate(()=>{skillSync();const hp=player.maxHp;enterHub();return {hp,restored:player.maxHp,cycle:player.conquest.offers[1].cycle,influence:player.conquest.influence,options:EndgameModel.offer(player.conquest.seed,0,1),active:ENDGAME.run};});
  assert.equal(abort.hp,active.hp);assert.equal(abort.restored,before.stats.hp);assert.equal(abort.influence,0);assert.equal(abort.cycle,0);assert.equal(abort.active,null);assert.deepEqual(abort.options,before.options);
  // Reload through the game's real continuation path, rather than reconstructing progression.
  await page.evaluate(()=>{saveGame();sessionStorage.setItem('nr_start','continue');});await page.reload();await page.waitForFunction(()=>typeof hasSave!=='undefined');
  assert.equal(await page.evaluate(()=>player.conquest.offers[1].selected.length),3);
  const penaltyChecks=await page.evaluate(()=>{
   const results=[];for(const curse of EndgameModel.curses){
    let seed=1;while(!EndgameModel.offer(seed,0,1).includes(curse.id))seed++;
    player.conquest=EndgameModel.normalize({seed});player.conquest.offers[1].selected=[curse.id];
    skillSync();const base={hp:player.maxHp,mana:player.mpRegen,life:player.hpRegen,horde:skillMinionStats('zombie').hp,speed:EquipmentModel.moveSpeed({})};
    endgameStart('expedition');skillSync();skillSync();
    const e=enemies.find(e=>!e.isBoss);e.hp=10000;const before=e.hp;dealDamageToEnemy(e,100);
    const mod=EndgameModel.modifiers([curse.id]);
    results.push(player.maxHp===Math.round(base.hp*mod.hp)&&Math.abs(player.mpRegen-base.mana*mod.mpRegen)<.001&&Math.abs(player.hpRegen-base.life*mod.hpRegen)<.001&&skillMinionStats('zombie').hp===Math.round(base.horde*mod.hordeHp)&&Math.abs(EquipmentModel.moveSpeed({})-base.speed*mod.move)<.001&&before-e.hp===Math.floor(100*mod.damage));
    enterHub();results.push(player.maxHp===base.hp&&Math.abs(player.mpRegen-base.mana)<.001&&skillMinionStats('zombie').hp===base.horde);
   }
   player.conquest=EndgameModel.normalize({seed:42});endgameStart('expedition');const offer=JSON.stringify(player.conquest.offers[1]);gameOver();
   results.push(!ENDGAME.run&&player.conquest.influence===0&&JSON.stringify(player.conquest.offers[1])===offer);return results;
  });assert.ok(penaltyChecks.every(Boolean),'all curse effects and death restoration');
  await page.waitForTimeout(3200);
  const finish=async kind=>page.evaluate(kind=>{
   if(gameState!=='hub')enterHub();TITLE.active=false;setPause(false);player.hp=player.maxHp;
   ENDGAME.difficulty=1;player.conquest.offers[1].selected=[];if(!endgameStart(kind))throw Error('Failed start '+kind);
   const b=EXPEDITION.boss;killEnemy(b,b.x,b.y);const gold=player.gold,xp=player.exp;expeditionBossDown();killEnemy(b,b.x,b.y);
   const result={influence:player.conquest.influence,conquered:player.conquest.conquered,fragment:player.conquest.fragment,record:player.waveProgress.best,once:player.gold===gold&&player.exp===xp,cycle:player.conquest.offers[1].cycle};
   enterHub();return result;
  },kind);
  assert.equal((await finish('expedition')).influence,20);
  const branches=await page.evaluate(()=>EndgameModel.routeGraph(player.conquest.seed).filter(n=>n.depth===1&&EndgameModel.routeAvailable(player.conquest,n)).map(n=>n.biome));
  assert.equal(branches.length,3);assert.equal(new Set(branches).size,3);
  await page.evaluate(()=>gearOpen('conquest'));
  await page.getByLabel('Local do mapa').selectOption('route-1-2');
  await page.locator('.atlas-scroll').screenshot({path:path.resolve(__dirname,'../review/endgame-routes.png')});
  await page.getByRole('button',{name:'Entrar na rota · Travessia do Rio',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>({biome:BIOME.id,route:ENDGAME.run.routeId})),{biome:'river',route:'route-1-2'});
  await page.evaluate(()=>{setPlayerAt(50,ExpeditionModel.routeY(EXPEDITION.map.route,50));expeditionCamera(1);render();});
  await page.screenshot({path:path.resolve(__dirname,'../review/endgame-river.png')});
  await page.evaluate(()=>{const b=EXPEDITION.boss;killEnemy(b,b.x,b.y);setPlayerAt(EXPEDITION.map.exit.x,EXPEDITION.map.exit.y);tryPortal();});
  assert.equal(await page.evaluate(()=>gameState==='hub'&&TITLE.paused&&PM.tab==='conquest'),true);
  await page.evaluate(()=>setPause(false));
  const apothecary=await page.evaluate(()=>{
   endgameStart('apothecary');const b=EXPEDITION.boss,objects=enemies.filter(e=>e.endgameOwner===b);b.alert=true;b.endgameCd=0;
   endgameBossAbility(b,.1);endgameBossAbility(b,2);const count=ENDGAME.hazards.length;
   const o=objects[0],gold=player.gold;killEnemy(o,o.x,o.y);const safe=o.dead&&player.gold===gold;
   killEnemy(b,b.x,b.y);enterHub();return {objects:objects.length,count,safe};
  });
  assert.deepEqual(apothecary,{objects:3,count:4,safe:true});await finish('expedition');
  // Exercise the boss through the real update loop and capture its combat warnings.
  await page.evaluate(()=>{
   endgameStart('apothecary');const b=EXPEDITION.boss;setPlayerAt(b.x-7,b.y);expeditionCamera(1);b.endgameCd=0;b.spawnT=0;
   update(.1);if(!b.endgameCast)throw Error('Boss did not use its ability through update');render();
  });
  await page.screenshot({path:path.resolve(__dirname,'../review/endgame-combat.png')});
  await page.evaluate(()=>enterHub());
  const drowned=await page.evaluate(()=>{
   endgameStart('drowned');const b=EXPEDITION.boss;setPlayerAt(b.x-8,b.y);b.endgameCd=0;endgameBossAbility(b,.1);setPlayerAt(b.x-12,b.y);endgameBossAbility(b,2);
   const adds=enemies.filter(e=>e.dummy&&!e.endgameObject).length;killEnemy(b,b.x,b.y);enterHub();return {adds,done:player.conquest.lieutenants.drowned};
  });assert.deepEqual(drowned,{adds:2,done:true});
  while(await page.evaluate(()=>player.conquest.influence<100))await finish('expedition');
  const fortress=await page.evaluate(()=>{
   endgameStart('fortress');const b=EXPEDITION.boss;b.hp=b.maxHp*.5;b.endgameCd=0;endgameBossAbility(b,.1);
   const remains=enemies.filter(e=>e.endgameCorpse&&!e.dead),hp=b.hp;for(const e of remains)killEnemy(e,e.x,e.y);endgameBossAbility(b,4.1);
   const prevented=b.hp===hp;killEnemy(b,b.x,b.y);const gold=player.gold;expeditionBossDown();
   const result={prevented,conquered:player.conquest.conquered,fragment:player.conquest.fragment,highest:player.conquest.highest,once:player.gold===gold,record:player.waveProgress.best};enterHub();return result;
  });assert.deepEqual(fortress,{prevented:true,conquered:true,fragment:true,highest:1,once:true,record:0});
  const biomes=await page.evaluate(()=>{
   const unique=[...new Set(EndgameModel.routeGraph(player.conquest.seed).map(n=>n.biome))],results=[];
   for(const biome of unique){const node=EndgameModel.routeGraph(player.conquest.seed).find(n=>n.biome===biome);if(!endgameStart(node.kind,node.id))throw Error('Failed biome '+biome);results.push(BIOME.id===biome&&props.length>0&&enemies.length>0);enterHub();}
   return results;
  });assert.ok(biomes.length>=5&&biomes.every(Boolean));
  // Force a successful special roll, then test its real projectile collision and item migration.
  const relic=await page.evaluate(()=>{
   const s=player.conquest,ids=EndgameModel.offer(s.seed,s.offers[1].cycle,1);s.offers[1].selected=ids.slice(0,3);endgameStart('expedition');
   const random=Math.random;try{Math.random=()=>0;const b=EXPEDITION.boss;killEnemy(b,b.x,b.y);}finally{Math.random=random;}
   const item=droppedItems.find(d=>d.type==='equipment'&&d.item.special==='carcomido')?.item;if(!item)throw Error('Missing special drop');
   enterHub();player.equipment.staff=item;skillSync();saveGame();
   setEndlessMode('expedition');startEndless();enemies=[];minions=[];const e=spawnEnemy(ENEMY_TYPES[0],P.x+3,P.y);e.hp=e.maxHp=10000;
   player.mp=player.maxMp;player.spellCooldowns.raio=0;castRaio(e.x,e.y);updateBolts(.3);
   const applied=!!e.endgameRot,hp=e.hp;endgameTick(1);const dot=e.hp<hp;enterHub();return {applied,dot,valid:EquipmentModel.validate(item,BuildModel).special};
  });assert.deepEqual(relic,{applied:true,dot:true,valid:'carcomido'});
  await page.evaluate(()=>{gearOpen('conquest');});await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(100);
  assert.ok(await page.evaluate(()=>{const screen=document.querySelector('.conquest-screen'),map=document.querySelector('.atlas-scroll');return screen.scrollHeight<=screen.clientHeight+1&&map.scrollHeight<=map.clientHeight+1;}));
  await page.screenshot({path:path.resolve(__dirname,'../review/endgame-screen-mobile.png')});
  await page.getByLabel('Local do mapa').selectOption('route-4-0');
  assert.match(await page.locator('.atlas-detail').innerText(),/Guardiã dos Afogados/);
  assert.ok(await page.locator('.atlas-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await page.getByRole('button',{name:'Ampliar mapa',exact:true}).click();
  assert.ok(await page.locator('.atlas-scroll').evaluate(el=>el.scrollWidth>el.clientWidth));
  await page.locator('.atlas-scroll').evaluate(el=>el.scrollLeft=el.scrollWidth);
  await page.locator('.atlas-scroll').screenshot({path:path.resolve(__dirname,'../review/endgame-map-mobile.png')});
  await page.screenshot({path:path.resolve(__dirname,'../review/endgame-mobile.png')});
  const layout=await page.locator('.conquest-panel').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert.ok(layout.scroll<=layout.width+1);
  await page.evaluate(()=>{saveGame();sessionStorage.setItem('nr_start','continue');});await page.reload();await page.waitForFunction(()=>typeof hasSave!=='undefined');
  assert.equal(await page.evaluate(()=>player.conquest.fragment),true);assert.equal(await page.evaluate(()=>player.equipment.staff.special),'carcomido');
  // Highest unlocked defaults on reopening/reload; changing levels clears only the map.
  await page.evaluate(()=>{player.conquest=EndgameModel.normalize({difficulty:21,highest:20,influence:40,fragment:true});ENDGAME.difficulty=21;saveGame();sessionStorage.setItem('nr_start','continue');});
  await page.reload();await page.waitForFunction(()=>typeof hasSave!=='undefined');await page.evaluate(()=>gearOpen('conquest'));
  assert.equal(await page.getByLabel('Dificuldade regional').inputValue(),'21');
  assert.equal(await page.evaluate(()=>player.conquest.influence),40);
  const retained=await page.evaluate(()=>({gold:player.gold,level:player.level,staff:player.equipment.staff.id}));
  await page.getByLabel('Dificuldade regional').fill('22');await page.getByLabel('Dificuldade regional').press('Enter');
  assert.deepEqual(await page.evaluate(()=>({difficulty:player.conquest.difficulty,influence:player.conquest.influence,areas:player.conquest.routes.completed.length,highest:player.conquest.highest,fragment:player.conquest.fragment})),{difficulty:22,influence:0,areas:0,highest:20,fragment:true});
  assert.deepEqual(await page.evaluate(()=>({gold:player.gold,level:player.level,staff:player.equipment.staff.id})),retained);
  await page.getByLabel('Dificuldade regional').fill('5');await page.getByLabel('Dificuldade regional').press('Enter');
  await page.keyboard.press('Escape');await page.evaluate(()=>gearOpen('conquest'));assert.equal(await page.getByLabel('Dificuldade regional').inputValue(),'22');
  await page.getByLabel('Dificuldade regional').fill('250');await page.getByLabel('Dificuldade regional').press('Enter');
  await page.getByRole('button',{name:'Entrar na rota · Entrada do Brejo',exact:true}).click();
  const regionalLoot=await page.evaluate(()=>{const b=EXPEDITION.boss;killEnemy(b,b.x,b.y);const item=droppedItems.find(d=>d.type==='equipment'&&d.item.level>1000)?.item;if(!item)throw Error('Regional loot capped');const result={id:item.id,level:item.level,valid:!!EquipmentModel.validate(item,BuildModel),finite:Number.isFinite(b.maxHp)};enterHub();saveGame();sessionStorage.setItem('nr_start','continue');return result;});
  assert.equal(regionalLoot.valid,true);assert.equal(regionalLoot.finite,true);assert.ok(regionalLoot.level>1000);
  await page.reload();await page.waitForFunction(()=>typeof hasSave!=='undefined');
  assert.equal(await page.evaluate(id=>player.gearBag.find(i=>i.id===id)?.level,regionalLoot.id),regionalLoot.level);
  assert.deepEqual(errors,[]);console.log('OK conquest UI, curses, abort/reload persistence, independent arena record, both lieutenant mechanics, fortress, unique fragment, special loot and real Podridão collision; desktop/mobile screenshots saved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
