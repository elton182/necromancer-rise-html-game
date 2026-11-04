const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const dir=path.resolve(__dirname,'../../review/v2/warrior');fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors=[],remote=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Efeitos visuais desativados'))errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
const alignment=await page.evaluate(async()=>{
 const THREE=await import('three'),{GLTFLoader}=await import('gltf-loader');
 const asset=JSON.parse(document.getElementById('assets').textContent).warrior;
 const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));const gltf=await new GLTFLoader().parseAsync(bytes.buffer,'');
 gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 const rest=new THREE.Box3().setFromObject(gltf.scene,true),scale=asset.height/(rest.max.y-rest.min.y);
 const mixer=new THREE.AnimationMixer(gltf.scene);mixer.clipAction(gltf.animations.find(a=>a.name==='idle')).play();mixer.update(0);gltf.scene.updateMatrixWorld(true);
 const feet=[];gltf.scene.traverse(o=>{if(o.isBone&&/^(mixamorig)?(Left|Right)Foot$/.test(o.name.replaceAll(':','')))feet.push(o.getWorldPosition(new THREE.Vector3()));});
 if(feet.length!==2)throw Error('Não foi possível medir os dois pés do Guerreiro.');
 const center=feet[0].add(feet[1]).multiplyScalar(.5);return {x:center.x*scale,z:center.z*scale,distance:Math.hypot(center.x,center.z)*scale};
});assert.ok(alignment.distance<.1,JSON.stringify(alignment));
await page.click('[data-title="campaign"]');await page.getByRole('button',{name:'Guerreiro / Soldado',exact:false}).click();await page.waitForSelector('.character-preview[data-ready="true"]');await page.screenshot({path:path.join(dir,'selection.png')});await page.locator('#character-name').fill('Teste Guerreiro');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.classId),'warrior');await page.evaluate(()=>{NecromancerV2.go('training');const w=NecromancerV2.world;w.actors=w.actors.filter(a=>a===w.player);w.arena={bounds:{minX:-15,maxX:15,minY:-15,maxY:15},solids:[]};w.aim={x:w.player.x,y:w.player.y-8};w.paused=false;});
assert.equal(await page.evaluate(()=>NecromancerV2.world.player.model),'warrior');
// Um clique mantido não dispara os demais cortes; depois da janela, começa do primeiro.
await page.mouse.move(950,300);await page.mouse.down();
await page.waitForFunction(()=>NecromancerV2.world.warriorAction?.stage===0);
const firstAction=await page.evaluate(()=>NecromancerV2.world.player.actionId);
await page.waitForFunction(()=>!NecromancerV2.world.warriorAction);await page.waitForFunction(()=>!NecromancerV2.world.warriorCombo);
assert.equal(await page.evaluate(()=>NecromancerV2.world.player.actionId),firstAction);await page.mouse.up();
const comboStages=[];
for(let stage=0;stage<3;stage++){
 await page.mouse.click(950,300);
 await page.waitForFunction(expected=>NecromancerV2.world.warriorAction?.stage===expected,stage);
 comboStages.push(await page.evaluate(()=>NecromancerV2.world.warriorAction.stage));
 await page.waitForFunction(()=>!NecromancerV2.world.warriorAction);
}
assert.deepEqual(comboStages,[0,1,2]);assert.equal(await page.evaluate(()=>NecromancerV2.world.warriorCombo),null);
// Personagem novo: habilidades ficam bloqueadas, e cada uma é liberada pela árvore.
await page.waitForFunction(()=>[...document.querySelectorAll('button')].filter(b=>b.textContent.includes('Libere na árvore')).length===4);
const lockedBefore=await page.evaluate(()=>{const mp=NecromancerV2.world.player.mp,results=[1,2,4,5].map(i=>NecromancerV2.slot(i));return {results,spent:mp-NecromancerV2.world.player.mp,action:NecromancerV2.world.warriorAction};});
assert.deepEqual(lockedBefore,{results:[false,false,false,false],spent:0,action:null});
await page.keyboard.press('2');await page.keyboard.press('3');assert.equal(await page.evaluate(()=>NecromancerV2.world.warriorAction),null);
await page.screenshot({path:path.join(dir,'locked-slots.png')});
await page.evaluate(()=>NecromancerV2.ui.show('skills'));
for(const [id,name] of [['thrust','Estocada'],['bash','Golpe de escudo']]){await page.locator('[data-warrior-node="'+id+'"]').click();await page.getByRole('button',{name:'Aprender '+name,exact:true}).click();}
await page.evaluate(()=>{const api=NecromancerV2;api.ui.close();api.session.scene='training';api.world.paused=false;document.getElementById('view').focus();});
await page.waitForFunction(()=>[...document.querySelectorAll('button')].filter(b=>b.textContent.includes('Libere na árvore')).length===2);
assert.equal(await page.evaluate(()=>NecromancerV2.slot(1)),true);
const thrustTargets=await page.evaluate(()=>{
 const w=NecromancerV2.world,s=w.warriorAction,ids=[];
 for(const [along,side] of [[Math.max(.1,s.travel*.5),.7],[s.travel+2.6,.8],[s.travel+1,1.4]]){
  const e={id:w.nextId++,model:'zombie',team:'enemy',dummy:true,x:s.origin.x+s.dx*along-s.dy*side,y:s.origin.y+s.dy*along+s.dx*side,radius:.3,hp:1000,maxHp:1000,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0};w.actors.push(e);ids.push(e.id);
 }
 return ids;
});
await page.waitForFunction(()=>NecromancerV2.world.effects.some(e=>e.fx==='thrust'));
const thrustHealth=await page.evaluate(ids=>ids.map(id=>NecromancerV2.world.actors.find(a=>a.id===id).hp),thrustTargets);
assert.ok(thrustHealth[0]<1000);assert.ok(thrustHealth[1]<1000);assert.equal(thrustHealth[2],1000);
await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.screenshot({path:path.join(dir,'thrust-hit.png')});await page.evaluate(()=>{NecromancerV2.world.paused=false;});await page.waitForFunction(()=>!NecromancerV2.world.warriorAction);assert.equal(await page.evaluate(()=>NecromancerV2.slot(2)),true);await page.waitForFunction(()=>!NecromancerV2.world.warriorAction);await page.screenshot({path:path.join(dir,'combat.png')});
await page.evaluate(()=>NecromancerV2.ui.show('skills'));assert.equal(await page.locator('[data-warrior-node]').count(),13);assert.equal(await page.locator('.warrior-link').count(),4);assert.ok(await page.locator('[data-warrior-node="tornado"]').evaluate(e=>e.classList.contains('locked')));await page.locator('[data-warrior-node="vitality"]').click();await page.getByRole('button',{name:'Aprender Vitalidade',exact:true}).click();assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.warriorRanks.vitality),1);await page.screenshot({path:path.join(dir,'passives.png')});await page.evaluate(()=>NecromancerV2.save());

// Árvore e arsenal exclusivos; comandos mantidos e projétil com o escudo real.
await page.evaluate(()=>{const api=NecromancerV2,w=api.world;api.session.save.character.level=20;w.level=20;if(w.army)w.army.profile.level=20;api.ui.show('skills');});
assert.equal(await page.locator('.warrior-tree > section').count(),3);
for(const [id,name] of [['thrust','Estocada'],['tornado','Corte tornado'],['bash','Golpe de escudo'],['shieldThrow','Arremesso de escudo'],['shieldDefense','Guarda treinada'],['riposte','Retaliação'],['slash','Slash · Três cortes'],['momentum','Ímpeto']]){await page.locator('[data-warrior-node="'+id+'"]').click();await page.getByRole('button',{name:'Aprender '+name,exact:true}).click();}
await page.evaluate(()=>document.getElementById('menu-body').scrollTop=0);await page.screenshot({path:path.join(dir,'skill-tree.png')});await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Escudo',exact:true}).click();assert.equal(await page.locator('.warrior-school:visible').count(),1);await page.locator('[data-warrior-node="riposte"]').click();await page.evaluate(()=>document.getElementById('menu-body').scrollTop=0);await page.screenshot({path:path.join(dir,'skill-tree-mobile.png')});await page.locator('.warrior-detail').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,'skill-detail-mobile.png')});await page.setViewportSize({width:1440,height:900});
await page.evaluate(()=>{NecromancerV2.session.scene='village';NecromancerV2.session.save.character.gold=10000;NecromancerV2.ui.show('equipment');});
const stats=await page.locator('.gear-stats').innerText();assert.ok(stats.includes('Dano'));assert.ok(stats.includes('Defesa de escudo'));assert.ok(!/horda|dano mágico|mana máxima/i.test(stats));
assert.equal(await page.locator('[data-gear-slot="sword"]').count(),1);assert.equal(await page.locator('[data-gear-slot="shield"]').count(),1);assert.equal(await page.locator('[data-gear-slot="staff"]').count(),0);
await page.getByRole('button',{name:/^Comprar Espada de uma mão/}).click();
assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.gearBag.at(-1).classId),'warrior');
await page.evaluate(()=>document.getElementById('menu-body').scrollTop=0);await page.screenshot({path:path.join(dir,'equipment.png')});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(dir,'equipment-mobile.png')});await page.setViewportSize({width:1440,height:900});
await page.evaluate(()=>{const api=NecromancerV2;api.ui.close();api.session.scene='training';api.world.paused=false;api.world.warriorCooldowns=[];api.world.actors=api.world.actors.filter(a=>a===api.world.player);document.getElementById('view').focus();});
await page.keyboard.down('r');await page.waitForFunction(()=>NecromancerV2.world.warriorAction?.index===4);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>NecromancerV2.world.warriorAction?.index),4);await page.screenshot({path:path.join(dir,'tornado.png')});await page.keyboard.up('r');await page.waitForFunction(()=>!NecromancerV2.world.warriorAction);
await page.keyboard.press('t');await page.waitForFunction(()=>!!NecromancerV2.world.warriorShieldFlight);await page.screenshot({path:path.join(dir,'shield-throw.png')});await page.waitForFunction(()=>!NecromancerV2.world.warriorShieldFlight);
await page.evaluate(()=>NecromancerV2.save());

for(const ground of ['dark','light']){await page.evaluate(g=>{NecromancerV2.session.save.settings.ground=g;NecromancerV2.view.ground(g==='light');},ground);await page.screenshot({path:path.join(dir,ground+'.png')});}
await page.evaluate(()=>{NecromancerV2.view.quality(true);const w=NecromancerV2.world;w.paused=true;for(let i=0;i<16;i++)w.actors.push({...w.player,id:w.nextId++,model:'skeleton',team:'ally',x:w.player.x+(i%4-1.5)*1.5,y:w.player.y+3+Math.floor(i/4)*1.5});});await page.screenshot({path:path.join(dir,'group-low.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(dir,'mobile.png')});assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({errors,remote,alignment,comboStages,thrustHealth,checks:['warrior selection','skills locked until invested','three attacks render','thrust capsule visual','swept and tip targets hit','outside target missed','one click per cut','hold does not chain','timeout restarts combo','passive investment','offline','isolated storage','three skill branches','13 selectable seals and four prerequisite connections','locked and learned states','mobile branch selector','martial shop and equipment','no magical or horde stats','held tornado release','shield projectile render and return']},null,2));console.log('Guerreiro: seleção, três ações, passiva e render offline OK');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
