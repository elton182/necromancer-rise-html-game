// Mago no navegador: criação pelo Novo personagem, modelo com rig corrigido, Seta Arcana andando (camadas),
// árvore pela interface, Bola de Fogo, Rajada de Gelo, Teleporte, Meteoro, inventário arcano, sons,
// chão claro e qualidade baixa. Requer Playwright e Edge com WebGL 2 (perfil isolado). Evidências em review/v2/mage/.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,'../../review/v2/mage');
const shot=async(page,name)=>{for(let i=0;i<3;i++){try{await page.screenshot({path:path.join(dir,name)});return;}catch(e){if(i===2)throw e;await page.waitForTimeout(300);}}};
(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors=[],remote=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
 await page.click('[data-title="campaign"]');assert.equal(await page.locator('.class-choice').count(),6);
 await page.locator('.class-choice[data-class="mage"]').click();await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
 assert.match(await page.locator('.class-choice[data-class="mage"]').innerText(),/Mago/);await page.waitForTimeout(500);await shot(page,'selection.png');checks.push('seleção');
 await page.locator('#character-name').fill('Merlin');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
 await page.evaluate(()=>{NecromancerV2.go('training');});await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
 assert.equal(await page.evaluate(()=>NecromancerV2.world.player.model),'mageHero');
 assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='ally').length),0,'sem horda');
 assert.match(await page.locator('[data-hud-slot="0"]').innerText(),/Seta Arcana/);assert.match(await page.locator('[data-hud-slot="1"]').innerText(),/Libere na árvore/);
 assert.match(await page.locator('#mp-vessel .vessel-caption span').innerText(),/mana/i);checks.push('HUD');
 const reset=()=>page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.boss.hp=0;w.actors=w.actors.filter(a=>a===p||a.team==='enemy'&&a!==w.boss);w.marksmanCooldowns={};p.mp=p.maxMp;w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>Object.assign(e,{x:p.x+(i<4?0:(i%2?1:-1)*(1+.6*(i-4))),y:p.y-4.5-(i<4?i*1.3:1+.4*(i-4)),hp:5000,maxHp:5000,dummy:true,slow:0,slowTime:0,frostUntil:0}));w.aim={x:p.x,y:p.y-6.6};});
 const damage=()=>page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy').reduce((t,a)=>t+a.maxHp-a.hp,0));
 // Seta Arcana andando: tronco com o feitiço, pernas com a passada.
 await reset();const moved=await page.evaluate(()=>{const w=NecromancerV2.world,x=w.player.x;NecromancerV2.slot(0);return {x,started:!!w.marksmanAction};});assert.ok(moved.started);
 await page.keyboard.down('KeyD');await page.waitForFunction(x0=>{const w=NecromancerV2.world,p=w.player;return !!w.marksmanAction&&p.animation==='walk'&&Math.abs(p.x-x0)>.2;},moved.x,{timeout:3000});
 const layer=await page.evaluate(()=>{const live=x=>x?.isScheduled()?x.getEffectiveWeight():0,w=NecromancerV2.world,p=w.player,o=NecromancerV2.view.actors.get(p.id);return {state:o.state,upper:live(o.upper.cast),legs:live(o.lower.walk)+live(o.lower.strafe_left)+live(o.lower.strafe_right)};});
 await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(200);await shot(page,'cast-moving.png');await page.evaluate(()=>{NecromancerV2.world.paused=false;});await page.keyboard.up('KeyD');
 assert.equal(layer.state,'layer');assert.ok(layer.upper>.5);assert.ok(layer.legs>.5);
 await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction&&!NecromancerV2.world.marksmanShots.length,null,{timeout:5000});
 assert.ok(await damage()>0,'Seta Arcana causa dano');checks.push('Seta Arcana andando');
 // Árvore pela interface: três pontos do nível 1.
 await page.evaluate(()=>NecromancerV2.ui.show('skills'));await page.waitForSelector('[data-warrior-node="fireball"]');
 for(const [id,label] of [['fireball','Bola de Fogo'],['frost','Rajada de Gelo'],['blink','Teleporte']]){await page.locator('[data-warrior-node="'+id+'"]').click();await page.getByRole('button',{name:'Aprender '+label,exact:true}).click();}
 assert.deepEqual(await page.evaluate(()=>{const r=NecromancerV2.session.save.character.marksmanRanks;return [r.fireball,r.frost,r.blink];}),[1,1,1]);
 await page.locator('[data-warrior-node="fireball"]').click();await page.waitForTimeout(200);await shot(page,'tree.png');checks.push('árvore');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!NecromancerV2.world.paused);
 await page.evaluate(()=>{Object.assign(NecromancerV2.world.marksmanRanks,{meteor:1,combustion:2,shatter:2});});
 async function frozen(name,slot,until){
  await reset();const before=await damage();assert.ok(await page.evaluate(i=>NecromancerV2.slot(i),slot),name+' iniciou');
  await page.waitForFunction(until,null,{timeout:6000});await page.evaluate(()=>{NecromancerV2.world.paused=true;});
  await page.waitForTimeout(250);await shot(page,name+'.png');await page.evaluate(()=>{NecromancerV2.world.paused=false;});
  await page.waitForFunction(()=>{const w=NecromancerV2.world;return !w.marksmanAction&&!w.marksmanShots.length&&!w.marksmanZones.length;},null,{timeout:8000});
  await page.waitForTimeout(150);return (await damage())-before;
 }
 assert.ok(await frozen('fireball',1,()=>NecromancerV2.world.effects.some(e=>e.fx==='groundBreak'))>0,'Bola de Fogo causa dano');
 assert.ok(await frozen('frost',2,()=>NecromancerV2.world.actors.some(a=>a.frostUntil>NecromancerV2.world.time))>0,'Rajada de Gelo causa dano');
 const start=await page.evaluate(()=>({...NecromancerV2.world.player}));
 await frozen('blink',4,()=>NecromancerV2.world.marksmanAction?.released);
 const end=await page.evaluate(()=>NecromancerV2.world.player);assert.ok(start.y-end.y>4,'Teleporte avança na direção da mira');
 await page.evaluate(()=>{const p=NecromancerV2.world.player;p.y+=6;});
 assert.ok(await frozen('meteor',5,()=>NecromancerV2.world.effects.some(e=>e.fx==='groundBreak'))>0,'Meteoro causa dano');
 checks.push('Bola de Fogo','Rajada de Gelo','Teleporte','Meteoro');
 // Inventário arcano: cajado e grimório no boneco, modelo do Mago.
 await page.evaluate(()=>NecromancerV2.ui.show('equipment'));await page.waitForSelector('.inv-model[data-drawn="true"]',{timeout:20000});
 const slots=await page.evaluate(()=>[...document.querySelectorAll('[data-gear-slot]')].map(b=>b.dataset.gearSlot).sort());
 assert.deepEqual(slots,['body','boots','grimoire','head','ring1','ring2','staff']);await page.waitForTimeout(300);await shot(page,'equipment.png');checks.push('inventário arcano');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!NecromancerV2.world.paused);
 const played=await page.evaluate(()=>['arcaneBolt','frostBlast','blink'].map(id=>[id,NecromancerV2.audio.play(id)]));
 assert.deepEqual(played.filter(([,ok])=>!ok),[]);checks.push('sons');
 await page.evaluate(()=>{for(const [id,value] of [['ground','light'],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}});
 await reset();await page.evaluate(()=>NecromancerV2.slot(1));await page.waitForFunction(()=>NecromancerV2.world.marksmanShots?.length>0,null,{timeout:5000});await page.waitForTimeout(150);await shot(page,'light-low.png');checks.push('chão claro e qualidade baixa');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 const result={ok:true,checks,errors,remote};fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
