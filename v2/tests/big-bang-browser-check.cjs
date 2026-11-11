// Big Bang: preparação, voo e explosão em Edge/WebGL2, file:// e perfil isolado.
// Executar da raiz: node v2/tests/big-bang-browser-check.cjs
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,'../../review/v2/big-bang');
const errors=[],remote=[],checks=[];
async function shot(page,name){await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(180);await page.screenshot({path:path.join(dir,name+'.png')});await page.evaluate(()=>{NecromancerV2.world.paused=false;});}
async function hero(browser,id){
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(id+': '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push(id+': '+m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
 await page.click('[data-title="campaign"]');await page.locator('.class-choice[data-class="'+id+'"]').click();await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
 await page.locator('#character-name').fill('Revisão '+id);await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
 await page.evaluate(()=>NecromancerV2.go('training'));await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
 await page.evaluate(async id=>{const s=NecromancerV2.session,w=s.world,D=(await import('v2-skill-tree-data')).default,key=id==='warrior'?'warriorRanks':id==='druid'?'druidRanks':'marksmanRanks';s.save.character.level=w.level=60;if(w.army)w.army.profile.level=60;if(s.save.horde)s.save.horde.profile.level=60;w[key]=Object.fromEntries(Object.entries(D[id].nodes).map(([id,n])=>[id,n.max]));s.save.character[key]={...w[key]};(await import('v2-progression')).applyAttributes(w,{fill:true});},id);
 await page.locator('#open-grimoire').click();await page.waitForSelector('[data-warrior-node]');
 const expected=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../docs/habilidades/arvores.json'),'utf8')).classes.find(c=>c.id===id).nodes.length;
 assert.equal(await page.locator('[data-warrior-node]').count(),expected);
 const scaled={warrior:['shieldThrow','cadencia','corteEspacial','warCry'],druid:['storm','leap','corteSangrento','plantaCarnivora','furacao'],archer:['fan','rain','penasVoadoras','fechadefogo','flechaExplosiva'],mercenary:['mine','firebomb','armadilhaDeUrso']};
 for(const node of scaled[id]||[])assert.equal(await page.locator('[data-warrior-node="'+node+'"] em').textContent(),'5/5',node+' aceita cinco pontos no painel');
 await page.screenshot({path:path.join(dir,id+'-tree.png')});await page.keyboard.press('Escape');await page.waitForFunction(()=>!NecromancerV2.world.paused);
 checks.push(id+': árvore completa');return {ctx,page};
}
async function stage(page){await page.evaluate(()=>{
 const w=NecromancerV2.world,p=w.player;w.paused=false;w.warriorAction=null;w.warriorCombo=null;w.warriorWaves=[];w.warriorFireTrails=[];w.marksmanAction=null;w.marksmanShots=[];w.marksmanZones=[];w.marksmanOrbs=[];w.marksmanLobs=[];w.marksmanMines=[];w.marksmanTraps=[];w.marksmanFamiliar=null;w.marksmanImbue=null;w.marksmanShield=null;w.marksmanFeathersReady=Infinity;w.warriorCooldowns=[];w.warriorWaveReady=0;w.marksmanCooldowns={};w.druidCooldowns={};w.druidAction=null;w.castCooldown=0;w.effects=[];
 p.mp=p.maxMp;p.hp=p.maxHp;if(w.boss)w.boss.hp=0;
 w.actors=w.actors.filter(a=>a===p||a===w.falcon||a.companion||a.team==='enemy'&&a!==w.boss);
 w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>Object.assign(e,{x:p.x+(i%3-1)*1.6,y:p.y-5-Math.floor(i/3)*1.5,hp:50000,maxHp:50000,dead:false,dummy:true,timer:999,slowTime:0,burnUntil:0}));
 if(w.falcon){w.falcon.state='orbit';w.falcon.next=Infinity;}w.aim={x:p.x,y:p.y-5};
 });}
const damage=page=>page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy').reduce((s,a)=>s+a.maxHp-a.hp,0));
async function cast(page,id){return page.evaluate(async id=>{const w=NecromancerV2.world;if(w.classId==='warrior')return (await import('v2-warrior')).warriorAction(w,id);if(w.classId==='druid'){const d=await import('v2-druid');return d.druidAction(w,d.HUMAN_ACTIONS.findIndex(a=>a.id===id));}const M=await import('v2-marksman-model');return (await import('v2-marksman')).marksmanAction(w,M.marksmanActions(w.classId).findIndex(a=>a.id===id));},id);}
async function appearance(page,name){
 for(const [ground,quality] of [['dark','high'],['light','low']]){await page.evaluate(([ground,quality])=>{for(const [id,v]of [['ground',ground],['quality',quality]]){const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change'));}},[ground,quality]);await shot(page,name+'-'+ground+'-'+quality);}
}

async function capture(page,name,phase){
 await page.waitForFunction(phase,null,{timeout:6000});
 await page.waitForTimeout(120);
 assert.equal(await page.evaluate(()=>NecromancerV2.view.vfx.stats().failed),false);
 await page.screenshot({path:path.join(dir,name+'.png')});
 await page.evaluate(()=>{NecromancerV2.world.paused=false;});
}
(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const {ctx,page}=await hero(browser,'mage');
 for(const [ground,quality]of [['dark','high'],['light','low']]){
  await stage(page);
  await page.evaluate(([ground,quality])=>{for(const [id,v]of [['ground',ground],['quality',quality]]){const el=document.getElementById(id);el.value=v;el.dispatchEvent(new Event('change'));}},[ground,quality]);
  assert.ok(await cast(page,'bigBang'));
  await capture(page,'charge-'+ground,()=>{const w=NecromancerV2.world;if(w.marksmanAction?.id==='bigBang'&&w.marksmanAction.time>.25&&!w.marksmanAction.released){w.paused=true;return true;}return false;});
  await capture(page,'orb-'+ground,()=>{const w=NecromancerV2.world;if(w.marksmanShots.some(s=>s.def?.id==='bigBang'&&s.remaining<13)){w.paused=true;return true;}return false;});
  await capture(page,'blast-'+ground,()=>{const w=NecromancerV2.world;if(w.effects.some(e=>e.fx==='bigBangBlast'&&e.time>.12&&e.time<.4)){w.paused=true;return true;}return false;});
  assert.ok(await damage(page)>0);
  await page.waitForFunction(()=>!NecromancerV2.world.effects.some(e=>e.fx==='bigBangBlast'));
  checks.push('concentração, voo e explosão: '+ground+'/'+quality);
 }
 await page.evaluate(async()=>{const w=NecromancerV2.world;(await import('v2-marksman')).clearMarksman(w);});
 await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>NecromancerV2.view.vfx.stats().failed),false);
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({ok:true,checks,errors,remote},null,2));
 console.log(JSON.stringify({ok:true,checks}));await ctx.close();
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
