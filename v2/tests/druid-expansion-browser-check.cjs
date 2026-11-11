// Perfil isolado, Edge/WebGL2, file://; não usa armazenamento do jogador.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,'../../review/v2/druid-expansion');
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors=[],remote=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 async function shot(name){await page.evaluate(()=>NecromancerV2.world.paused=true);await page.waitForTimeout(180);await page.screenshot({path:path.join(dir,name+'.png')});await page.evaluate(()=>NecromancerV2.world.paused=false);}
 async function look(name){for(const [ground,quality] of [['dark','high'],['light','low']]){await page.evaluate(([g,q])=>{for(const [id,value] of [['ground',g],['quality',q]]){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change'));}},[ground,quality]);await shot(name+'-'+ground+'-'+quality);}}
 async function cast(id){assert.ok(await page.evaluate(id=>{const api=NecromancerV2;return api.equip(5,id).ok&&api.slot(5);},id),id);}
 const idle=()=>page.waitForFunction(()=>!NecromancerV2.world.druidAction);
 async function stage(){await page.evaluate(()=>{
  const w=NecromancerV2.world,p=w.player;w.paused=false;w.druidAction=null;w.druidCooldowns={};w.druidStorms=[];w.druidTornados=[];w.druidWinds=[];w.druidHeal=null;w.druidHunt=null;w.druidLeafShield=null;w.druidPack=[];w.druidForm='human';p.model='druid';w.castCooldown=0;w.effects=[];p.mp=p.maxMp;p.hp=p.maxHp;if(w.boss)w.boss.hp=0;
  w.actors=w.actors.filter(a=>a===p||a.team==='enemy'&&a!==w.boss);
  w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>Object.assign(e,{x:p.x+(i%3-1)*1.5,y:p.y-5-Math.floor(i/3)*1.2,hp:50000,maxHp:50000,dead:false,dummy:true,timer:999,slowTime:0}));w.aim={x:p.x,y:p.y-5};
 });}
 try{
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
  await page.click('[data-title="campaign"]');await page.locator('.class-choice[data-class="druid"]').click();await page.waitForSelector('.journeys-stage[data-ready="true"]');await page.locator('#character-name').fill('Flora');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
  await page.evaluate(()=>NecromancerV2.go('training'));await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
  await page.evaluate(async()=>{const s=NecromancerV2.session,w=s.world,D=(await import('v2-skill-tree-data')).default;s.save.character.level=w.level=60;if(w.army)w.army.profile.level=60;w.druidRanks=Object.fromEntries(Object.entries(D.druid.nodes).map(([id,n])=>[id,n.max]));s.save.character.druidRanks={...w.druidRanks};(await import('v2-progression')).applyAttributes(w,{fill:true});});
  const ids=['calamidade','florestaTropical','escudoDeFolhas','liderDaMatilha'];
  await page.locator('#open-grimoire').click();await page.waitForSelector('[data-warrior-node]');for(const id of ids)assert.equal(await page.locator('[data-warrior-node="'+id+'"]').count(),1,id);
  await page.locator('[data-warrior-node="calamidade"]').click();await page.screenshot({path:path.join(dir,'talents.png')});await page.keyboard.press('Escape');await page.waitForFunction(()=>!NecromancerV2.world.paused);checks.push('quatro habilidades na árvore');
  await page.locator('[data-hud-slot="5"]').click();await page.waitForSelector('#action-picker[open]');for(const id of ids)assert.equal(await page.locator('[data-picker-skill="'+id+'"]').isDisabled(),false,id);await page.locator('[data-picker-skill="calamidade"]').click();checks.push('quatro ações disponíveis na barra montável');
  await stage();await cast('calamidade');await page.waitForFunction(()=>NecromancerV2.world.effects.some(e=>e.fx==='stormVortex'));await page.waitForTimeout(800);await look('calamity');
  assert.ok(await page.evaluate(()=>NecromancerV2.world.actors.some(e=>e.team==='enemy'&&e.hp<e.maxHp)));checks.push('Calamidade com vento, movimento e raios');
  await stage();await cast('roots');await idle();await cast('florestaTropical');await page.waitForFunction(()=>NecromancerV2.world.actors.filter(a=>a.companion==='forestPlant'&&a.hp>0).length===5);
  assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.companion==='carnivorousPlant'&&a.hp>0).length),1);await look('forest');checks.push('cinco plantas da Floresta coexistem com a planta das Raízes');
  await stage();await cast('escudoDeFolhas');await page.waitForFunction(()=>!!NecromancerV2.world.druidLeafShield);await look('leaf-shield');
  const shield=await page.evaluate(async()=>{const w=NecromancerV2.world,p=w.player;p.defense=0;p.barrier=0;const hp=p.hp,capacity=w.druidLeafShield.remaining;(await import('v2-combat')).dealDamage(w,p,capacity*.6,w.actors.find(a=>a.team==='enemy'));return {hpLost:hp-p.hp,left:w.druidLeafShield.remaining,capacity};});assert.equal(shield.hpLost,0);assert.ok(Math.abs(shield.left-shield.capacity*.4)<1);await shot('leaf-shield-damaged');checks.push('Escudo absorve e perde folhas conforme resistência');
  await stage();await cast('lobo');await idle();await page.waitForFunction(()=>NecromancerV2.world.actors.filter(a=>a.companion==='druidWolf'&&a.hp>0).length===4);await cast('liderDaMatilha');await page.waitForFunction(()=>!!NecromancerV2.world.druidHunt);await page.waitForTimeout(900);await look('pack-leader');
  assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.packLeader&&a.hp>0).length),1);await page.waitForFunction(()=>NecromancerV2.world.actors.some(e=>e.team==='enemy'&&e.hp<e.maxHp));checks.push('líder maior e matilha atacando a presa marcada');
  await page.evaluate(()=>NecromancerV2.save());for(const id of ids)assert.equal(await page.evaluate(id=>NecromancerV2.session.save.character.druidRanks[id],id),1);
  assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.skillLoadout[5]),'liderDaMatilha');checks.push('pontos e barra persistidos');
  // A mudança de cena remove as invocações temporárias e os bônus.
  await idle();await cast('escudoDeFolhas');await idle();await cast('florestaTropical');await idle();
  assert.ok(await page.evaluate(()=>NecromancerV2.world.druidLeafShield&&NecromancerV2.world.actors.some(a=>a.companion==='forestPlant')));
  await page.evaluate(()=>NecromancerV2.go('menu'));await page.waitForFunction(()=>NecromancerV2.session.scene==='menu');
  assert.ok(await page.evaluate(()=>{const w=NecromancerV2.world;return !w.druidLeafShield&&!w.druidHunt&&!w.actors.some(a=>a.companion==='forestPlant');}));checks.push('limpeza ao trocar de cena');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);const result={ok:true,checks,errors,remote};fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
