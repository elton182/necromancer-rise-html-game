// HTML autocontido em file://, perfil isolado, Edge/WebGL2; evidências em review/v2/archer-expansion/.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,'../../review/v2/archer-expansion');
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors=[],remote=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 const capture=async name=>{await page.evaluate(()=>NecromancerV2.world.paused=true);await page.waitForTimeout(150);await page.screenshot({path:path.join(dir,name+'.png')});await page.evaluate(()=>NecromancerV2.world.paused=false);};
 try{
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
  await page.click('[data-title="campaign"]');await page.locator('.class-choice[data-class="archer"]').click();await page.waitForSelector('.journeys-stage[data-ready="true"]');
  await page.locator('#character-name').fill('Iara');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
  await page.evaluate(()=>NecromancerV2.go('training'));await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
  await page.evaluate(()=>{const s=NecromancerV2.session,w=NecromancerV2.world;s.save.character.level=30;w.level=30;if(w.army)w.army.profile.level=30;Object.assign(w.marksmanRanks,{shot:1,pierce:1,fan:1,saraivadaSeguidora:1,saraivadaMultipla:1,leap:1,ambush:1,falcon:1,marcaDoCacador:1,impactoCeleste:1,penasVoadoras:1,impactoFeroz:1,emboscadaEmDupla:1,rain:5,fechadefogo:1,flechaExplosiva:1,chuvaDeFlechasExplosivas:1,disparoPreciso:1,rasanteRelampago:1});s.save.character.marksmanRanks={...w.marksmanRanks};});
  await page.waitForFunction(()=>!!NecromancerV2.world.falcon);
  await page.locator('#open-grimoire').click();await page.waitForSelector('[data-warrior-node]');
  for(const id of ['marcaDoCacador','disparoPreciso','rasanteRelampago','saraivadaMultipla','chuvaDeFlechasExplosivas','emboscadaEmDupla','impactoFeroz'])assert.equal(await page.locator('[data-warrior-node="'+id+'"]').count(),1,id);
  await page.locator('[data-warrior-node="disparoPreciso"]').click();await page.screenshot({path:path.join(dir,'talents.png')});await page.keyboard.press('Escape');checks.push('novos nós no painel');
  await page.waitForFunction(()=>!NecromancerV2.world.paused);
  const reset=()=>page.evaluate(()=>{
   const w=NecromancerV2.world,p=w.player;w.marksmanAction=null;w.marksmanShots=[];w.marksmanZones=[];w.effects=[];w.marksmanCooldowns={};w.falconReady=0;w.marksmanFeathersReady=Infinity;w.marksmanAmbush=0;w.marksmanDoubleAmbush=false;
   p.mp=1000;p.maxMp=1000;w.castCooldown=0;w.falcon.state='orbit';w.falcon.rush=null;w.falcon.next=Infinity;
   w.actors=w.actors.filter(a=>a===p||a===w.falcon||a.team==='enemy'&&a!==w.boss);if(w.boss)w.boss.hp=0;
   const enemies=w.actors.filter(a=>a.team==='enemy');while(enemies.length<5){const e={...enemies[0],id:w.nextId++};w.actors.push(e);enemies.push(e);}
   enemies.forEach((e,i)=>Object.assign(e,{x:p.x+(i-2)*1.5,y:p.y-8,hp:100000,maxHp:100000,dead:false,dummy:true,hunterMark:0,falconMark:0}));w.aim={x:p.x,y:p.y-8};
  });
  const cast=async id=>assert.ok(await page.evaluate(id=>{NecromancerV2.equip(5,id);return NecromancerV2.slot(5);},id),id);
  await reset();await page.evaluate(()=>NecromancerV2.stance());
  await page.waitForFunction(()=>NecromancerV2.world.actors.some(e=>e.hunterMark>NecromancerV2.world.time));await capture('hunter-mark');checks.push('marca pelo comando F');
  await reset();await cast('disparoPreciso');await page.waitForFunction(()=>NecromancerV2.world.marksmanAction?.time>.5);await capture('precise-windup');
  await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction);await page.waitForTimeout(400);assert.ok(await page.evaluate(()=>NecromancerV2.world.actors.some(e=>e.team==='enemy'&&e.hp<e.maxHp)));checks.push('Disparo Preciso prepara e causa dano');
  await reset();await cast('saraivadaMultipla');await page.waitForFunction(()=>NecromancerV2.world.marksmanShots.length>=10);await capture('multiple-volley');checks.push('Saraivada Múltipla em cinco alvos');
  await reset();await cast('rasanteRelampago');await page.waitForFunction(()=>NecromancerV2.world.falcon?.state==='rush');await capture('falcon-rush');
  await page.waitForFunction(()=>NecromancerV2.world.falcon?.state!=='rush');assert.ok(await page.evaluate(()=>NecromancerV2.world.actors.filter(e=>e.team==='enemy'&&e.hp<e.maxHp).length>1));checks.push('rasantes percorrem a área e atingem grupo');
  for(const ground of ['dark','light']){
   await page.evaluate(ground=>{for(const [id,value] of [['ground',ground],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}},ground);
   await reset();await cast('chuvaDeFlechasExplosivas');await page.waitForFunction(()=>NecromancerV2.world.marksmanZones.some(z=>z.kind==='fire'));await capture('explosive-rain-'+ground+'-low');
  }checks.push('Chuva Explosiva em chão claro/escuro e qualidade baixa');
  await reset();await page.evaluate(()=>{NecromancerV2.world.marksmanAmbush=NecromancerV2.world.time+3;});await cast('fan');
  await page.waitForFunction(()=>NecromancerV2.world.marksmanZones.some(z=>z.kind==='strike'));await capture('double-ambush');
  await page.waitForFunction(()=>NecromancerV2.world.marksmanShots.some(s=>s.def?.id==='penasVoadoras'&&!s.def.homing));await capture('fierce-impact');checks.push('Emboscada em Dupla e Impacto Feroz');
  await page.evaluate(()=>NecromancerV2.save());assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.marksmanRanks.marcaDoCacador),1);
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  const result={ok:true,checks,errors,remote};fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
