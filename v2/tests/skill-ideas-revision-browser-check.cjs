// Revisões aprovadas de 09/11/2026. Edge/WebGL2, file://, perfis isolados, sem rede.
// Executar da raiz: node v2/tests/skill-ideas-revision-browser-check.cjs
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,process.env.NR_SKILL_REVIEW_DIR||'../../review/v2/skill-ideas-revision');
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
 const synergyNode={warrior:'thrust',druid:'spark',archer:'rain',mercenary:'mine',mage:'meteor'}[id];
 const catalog=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../docs/habilidades/arvores.json'),'utf8')).classes.find(c=>c.id===id),receiver=catalog.nodes.find(n=>n.id===synergyNode);
 const expectedSynergy=catalog.nodes.filter(n=>n.branch===receiver.branch&&n.id!==receiver.id&&n.type!=='variante').reduce((total,n)=>total+n.maxRank*2,0);
 await page.locator('[data-warrior-node="'+synergyNode+'"]').click();
 assert.match(await page.locator('[data-synergy-node="'+synergyNode+'"]').textContent(),new RegExp('\\+'+expectedSynergy+'%'));
 if(id==='mage'){
  assert.match(await page.locator('.wt-per-rank').textContent(),/10%/,'ganho próprio por ponto visível junto da sinergia');
  await page.locator('[data-warrior-node="escudoArcano"]').click();
  assert.match(await page.locator('[data-synergy-node="escudoArcano"]').textContent(),/concedem \+10%/,'suporte mostra contribuição, não dano inexistente');
  await page.locator('[data-warrior-node="'+synergyNode+'"]').click();
 }
 await page.screenshot({path:path.join(dir,id+'-synergy.png')});checks.push(id+': sinergia de escola na árvore +'+expectedSynergy+'%');
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
async function mage(browser){const {ctx,page}=await hero(browser,'mage');try{
 await stage(page);assert.ok(await page.evaluate(()=>NecromancerV2.equip(5,'escudoArcano').ok));assert.ok(await page.evaluate(()=>NecromancerV2.slot(5)));await page.waitForFunction(()=>!!NecromancerV2.world.marksmanShield);
 const split=await page.evaluate(async()=>{const w=NecromancerV2.world,p=w.player,e=w.actors.find(a=>a.team==='enemy');p.defense=0;p.barrier=0;const hp=p.hp,mp=p.mp;(await import('v2-combat')).dealDamage(w,p,100,e);return [hp-p.hp,mp-p.mp];});assert.deepEqual(split,[50,50]);await appearance(page,'mage-shield');checks.push('Escudo Arcano: 50% vida / 50% mana, bolha segue o jogador');
 await stage(page);assert.ok(await page.evaluate(()=>NecromancerV2.equip(5,'bigBang').ok));assert.ok(await page.evaluate(()=>NecromancerV2.slot(5)));await page.waitForFunction(()=>NecromancerV2.world.marksmanShots.some(s=>s.def?.id==='bigBang'));await shot(page,'mage-big-bang');await page.waitForFunction(()=>!NecromancerV2.world.marksmanShots.length);assert.ok(await damage(page)>0);checks.push('Big Bang: projétil e explosão');
 }finally{await ctx.close();}}
async function druid(browser){const {ctx,page}=await hero(browser,'druid');try{
 await stage(page);assert.ok(await page.evaluate(()=>NecromancerV2.equip(5,'lobo').ok));assert.ok(await page.evaluate(()=>NecromancerV2.slot(5)));await page.waitForFunction(()=>NecromancerV2.world.actors.filter(a=>a.companion==='druidWolf').length===4);
 await page.waitForFunction(()=>NecromancerV2.world.actors.some(a=>a.companion==='druidWolf'&&a.biteReady>NecromancerV2.world.time));await page.waitForFunction(()=>NecromancerV2.world.actors.some(a=>a.team==='enemy'&&a.hp<a.maxHp));await shot(page,'druid-pack');assert.ok(await damage(page)>0);checks.push('Alcateia de quatro lobos e Mordida Pesada automática');
 await page.waitForFunction(()=>!NecromancerV2.world.druidAction);assert.ok(await cast(page,'roots'));await page.waitForFunction(()=>NecromancerV2.world.actors.some(a=>a.companion==='carnivorousPlant'&&a.animation==='attack'));await appearance(page,'druid-plant');
 const plant=await page.evaluate(()=>{const a=NecromancerV2.world.actors.find(a=>a.companion==='carnivorousPlant');return {model:a.model,hp:a.hp,until:a.until};});assert.equal(plant.model,'carnivorousPlant');assert.ok(plant.hp>0);checks.push('Planta Carnívora: GLB animado próprio, ataque, chão claro/escuro e quatro lobos');
 }finally{await ctx.close();}}
async function archer(browser){const {ctx,page}=await hero(browser,'archer');try{
 await stage(page);assert.ok(await cast(page,'fechadefogo'));await page.waitForFunction(()=>NecromancerV2.world.actors.some(a=>a.burnUntil>NecromancerV2.world.time));await shot(page,'archer-fire-arrow');checks.push('Flecha de Fogo aplica queimadura');
 await stage(page);assert.ok(await cast(page,'flechaExplosiva'));await page.waitForFunction(()=>NecromancerV2.world.effects.some(f=>f.fx==='groundBreak'));await shot(page,'archer-explosive-arrow');assert.ok(await damage(page)>0);checks.push('Flecha Explosiva');
 await stage(page);await page.evaluate(()=>{const w=NecromancerV2.world;w.marksmanFeathersReady=0;});await page.waitForFunction(()=>NecromancerV2.world.marksmanShots.some(s=>s.def?.id==='penasVoadoras'));await appearance(page,'archer-feathers');
 await page.locator('[data-hud-slot="5"]').click();await page.waitForSelector('#action-picker[open]');assert.equal(await page.locator('[data-picker-skill="penasVoadoras"]').count(),0);for(const id of ['fechadefogo','flechaExplosiva'])assert.equal(await page.locator('[data-picker-skill="'+id+'"]').isDisabled(),false);await page.screenshot({path:path.join(dir,'archer-picker.png')});checks.push('Penas periódicas fora da barra e flechas equipáveis');
 }finally{await ctx.close();}}
async function warrior(browser){const {ctx,page}=await hero(browser,'warrior');try{
 await stage(page);assert.ok(await cast(page,0));await page.waitForFunction(()=>NecromancerV2.world.warriorWaves?.length>0);await shot(page,'warrior-spatial');await page.waitForFunction(()=>!NecromancerV2.world.warriorAction);checks.push('Corte Espacial no ataque básico');
 await stage(page);assert.ok(await cast(page,1));await page.waitForFunction(()=>NecromancerV2.world.warriorFireTrails?.length>3);await shot(page,'warrior-thrust-trail');await page.waitForFunction(()=>!NecromancerV2.world.warriorAction,null,{timeout:8000});assert.ok(await damage(page)>0);checks.push('Estocada, Impacto, Cadência e Rastro');
 await stage(page);assert.ok(await cast(page,4));await page.waitForFunction(()=>NecromancerV2.world.warriorWaves?.some(o=>o.wind));await appearance(page,'warrior-hurricane');
 const spin=await page.evaluate(()=>NecromancerV2.world.warriorAction.tornado);assert.equal(spin.range,4.7);assert.ok(Math.abs(spin.interval-.16)<1e-9);await page.evaluate(async()=>{(await import('v2-warrior')).stopWarriorChannel(NecromancerV2.world);});checks.push('Ciclone e Furacão cumulativos, tornados menores');
 }finally{await ctx.close();}}
async function mercenary(browser){const {ctx,page}=await hero(browser,'mercenary');try{
 await stage(page);assert.ok(await cast(page,'mine'));await page.waitForFunction(()=>NecromancerV2.world.marksmanMines.length>0);const before=await damage(page);await page.evaluate(()=>{const w=NecromancerV2.world,m=w.marksmanMines[0],e=w.actors.find(a=>a.team==='enemy');e.x=m.x;e.y=m.y;});await page.waitForFunction(()=>!NecromancerV2.world.marksmanMines.length);assert.ok(await damage(page)>before);await shot(page,'mercenary-mine');checks.push('Mina revisada e Estilhaços');
 }finally{await ctx.close();}}
const selected=process.argv.slice(2),runs={mage,druid,archer,warrior,mercenary},resultFile=selected.length?'browser-result-'+selected.join('-')+'.json':'browser-result.json';
(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const id of selected.length?selected:Object.keys(runs)){assert.ok(runs[id],'classe válida');await runs[id](browser);}
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);const result={ok:true,checks,errors,remote};fs.writeFileSync(path.join(dir,resultFile),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}catch(e){fs.writeFileSync(path.join(dir,resultFile),JSON.stringify({ok:false,error:e.stack,checks,errors,remote},null,2)+'\n');throw e;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
