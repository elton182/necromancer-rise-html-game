// Mago, segunda leva (09/11/2026) no navegador: os 27 selos no painel, Muralha de Fogo, Imbuir Fogo e Gelo,
// Nova de Gelo, Chuva de Fogo, Avalanche, Raio Arcano segurando e soltando a tecla, e Clone Arcano repetindo
// um feitiço. Captura de cada uma, chão claro e qualidade baixa, sem erros de página nem requisições externas.
// Requer Playwright e Edge com WebGL 2 (perfil isolado). Evidências em review/v2/mage-new-skills/
// (ou NR_MAGE_NEW_REVIEW_DIR, relativo a esta pasta).
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,process.env.NR_MAGE_NEW_REVIEW_DIR||'../../review/v2/mage-new-skills');
const RANKS={bolt:1,fireball:1,combustion:1,firewall:1,imbuirFogo:1,meteor:1,familiarDeFogo:1,chuvaDeFogo:1,frost:1,icenova:1,imbuirGelo:1,shatter:1,esferaDeGelo:1,golemDeGelo:1,avalanche:1,setasPerseguidoras:1,lazerArcano:1,blink:1,echo:1,escudoArcano:1,clone:1};
const shot=async(page,name)=>{for(let i=0;i<3;i++){try{await page.screenshot({path:path.join(dir,name+'.png')});return;}catch(e){if(i===2)throw e;await page.waitForTimeout(400);}}};
async function freeze(page,name,until,timeout=8000){
 try{await page.waitForFunction(until,null,{timeout});}
 catch(e){const st=await page.evaluate(()=>{const w=NecromancerV2.world;return {time:w.time,action:w.marksmanAction?.id,zones:w.marksmanZones.map(z=>z.kind),shots:w.marksmanShots.length,mp:w.player.mp};});throw Error(name+': condição não ocorreu; estado '+JSON.stringify(st));}
 await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot(page,name);await page.evaluate(()=>{NecromancerV2.world.paused=false;});
}
const damage=page=>page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy').reduce((t,a)=>t+a.maxHp-a.hp,0));
// Alvos parados à frente do Mago, em três colunas; a mira fica no meio deles.
const stage=page=>page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;if(w.boss)w.boss.hp=0;w.actors=w.actors.filter(a=>a===p||a.companion||a.team==='enemy'&&a!==w.boss);p.mp=p.maxMp;w.marksmanCooldowns={};w.castCooldown=0;w.marksmanImbue=null;
 w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>Object.assign(e,{x:p.x+((i%3)-1)*1.5,y:p.y-5-Math.floor(i/3)*1.3,hp:20000,maxHp:20000,dummy:true,slow:0,slowTime:0,frostUntil:0,burnUntil:0,timer:999}));w.aim={x:p.x,y:p.y-5};});
const cast=(page,id)=>page.evaluate(id=>{NecromancerV2.equip(5,id);return NecromancerV2.slot(5);},id);
const idle=page=>page.waitForFunction(()=>{const w=NecromancerV2.world;return !w.marksmanAction&&!w.marksmanShots.length&&!w.marksmanZones.length;},null,{timeout:12000});

(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors=[],remote=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
 await page.click('[data-title="campaign"]');await page.locator('.class-choice[data-class="mage"]').click();await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
 await page.locator('#character-name').fill('Aurelio');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
 await page.evaluate(()=>{NecromancerV2.go('training');});await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
 await page.evaluate(ranks=>{const s=NecromancerV2.session,w=NecromancerV2.world;s.save.character.level=30;w.level=30;Object.assign(w.marksmanRanks,ranks);s.save.character.marksmanRanks={...w.marksmanRanks};},RANKS);
 // Painel: os 27 selos do Mago, incluindo os oito novos.
 await page.locator('#open-grimoire').click();await page.waitForSelector('[data-warrior-node]');
 assert.equal(await page.locator('[data-warrior-node]').count(),27,'27 selos no painel');
 for(const id of ['firewall','imbuirFogo','imbuirGelo','icenova','chuvaDeFogo','avalanche','lazerArcano','clone'])assert.equal(await page.locator('[data-warrior-node="'+id+'"]').count(),1,'selo '+id);
 await page.locator('[data-warrior-node="lazerArcano"]').click();await page.waitForTimeout(200);await shot(page,'talents');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!NecromancerV2.world.paused);checks.push('painel com 27 selos');
 // Barra: as ações novas aparecem no seletor do slot.
 await page.locator('[data-hud-slot="5"]').click();await page.waitForSelector('#action-picker[open]');
 for(const id of ['firewall','imbuirFogo','imbuirGelo','icenova','chuvaDeFogo','avalanche','lazerArcano','clone'])assert.equal(await page.locator('#picker-options [data-picker-skill="'+id+'"]').isDisabled(),false,'seletor '+id);
 await shot(page,'picker');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#action-picker[open]'));await page.waitForFunction(()=>!NecromancerV2.world.paused);checks.push('seletor da barra');

 // Muralha de Fogo: chamas atravessadas na mira, inimigos queimando.
 await stage(page);let before=await damage(page);assert.ok(await cast(page,'firewall'),'Muralha');
 await freeze(page,'muralha',()=>{const w=NecromancerV2.world;return w.marksmanZones.some(z=>z.kind==='wall'&&w.time>z.armAt+.6)&&w.actors.some(a=>a.burnUntil>w.time);});
 assert.ok(await damage(page)>before,'Muralha fere');await idle(page);checks.push('Muralha de Fogo');
 // Imbuir Fogo e Gelo: a Seta muda de cor e aplica o efeito.
 for(const [id,name,flag] of [['imbuirFogo','imbuir-fogo','burnUntil'],['imbuirGelo','imbuir-gelo','frostUntil']]){
  await stage(page);assert.ok(await cast(page,id),id);await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction&&NecromancerV2.world.marksmanImbue);
  before=await damage(page);assert.ok(await page.evaluate(()=>NecromancerV2.slot(0)),'Seta imbuída');
  await freeze(page,name,()=>NecromancerV2.world.marksmanShots.some(s=>s.imbue));
  await page.waitForFunction(f=>NecromancerV2.world.actors.some(a=>a[f]>NecromancerV2.world.time),flag,{timeout:4000});assert.ok(await damage(page)>before,name);
  await idle(page);
 }
 checks.push('Imbuir Fogo','Imbuir Gelo');
 // Nova de Gelo: onda em volta do Mago (alvos aproximados).
 await stage(page);await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>{const a=i*1.1;e.x=p.x+Math.cos(a)*3;e.y=p.y+Math.sin(a)*3;});});
 before=await damage(page);assert.ok(await cast(page,'icenova'),'Nova');
 await freeze(page,'nova',()=>NecromancerV2.world.effects.some(e=>e.fx==='shockwave'&&e.time>.1));
 assert.ok(await damage(page)>before,'Nova fere');assert.ok(await page.evaluate(()=>NecromancerV2.world.marksmanCooldowns.frost>NecromancerV2.world.time),'divide a recarga com a Rajada');await idle(page);checks.push('Nova de Gelo');
 // Chuva de Fogo e Avalanche: várias quedas com sombra, depois o chão.
 await stage(page);before=await damage(page);assert.ok(await cast(page,'chuvaDeFogo'),'Chuva');
 await freeze(page,'chuva',()=>{const w=NecromancerV2.world,z=w.marksmanZones.find(z=>z.kind==='shower');return !!z&&z.drops.some(d=>d.done)&&w.effects.filter(e=>e.fx==='meteor').length>=2;});
 await idle(page);assert.ok(await damage(page)>before,'Chuva fere');checks.push('Chuva de Fogo');
 await stage(page);before=await damage(page);assert.ok(await cast(page,'avalanche'),'Avalanche');
 await freeze(page,'avalanche',()=>{const w=NecromancerV2.world,z=w.marksmanZones.find(z=>z.kind==='shower');return !!z&&z.drops.filter(d=>d.done).length>=3&&w.effects.some(e=>e.fx==='meteor'&&e.snow);});
 await idle(page);assert.ok(await damage(page)>before,'Avalanche fere');checks.push('Avalanche');
 // Raio Arcano: segurando a tecla do slot 6, o raio continua; soltando, para e entra em recarga.
 await stage(page);await page.evaluate(()=>NecromancerV2.equip(5,'lazerArcano'));before=await damage(page);
 await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction);
 await page.keyboard.down('Digit6');
 await page.waitForFunction(()=>{const w=NecromancerV2.world;return w.marksmanAction?.id==='lazerArcano'&&w.marksmanAction.time>1;},null,{timeout:4000});
 await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot(page,'raio');await page.evaluate(()=>{NecromancerV2.world.paused=false;});
 await page.keyboard.up('Digit6');await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction,null,{timeout:2000});
 const beam=await page.evaluate(()=>{const w=NecromancerV2.world;return {cd:w.marksmanCooldowns.lazerArcano-w.time};});
 assert.ok(beam.cd>6&&beam.cd<=8.01,'recarga começa ao soltar: '+beam.cd);assert.ok(await damage(page)>before,'Raio fere');checks.push('Raio Arcano segurando e soltando');
 // Clone Arcano: ao lado, repete a Bola de Fogo.
 await stage(page);await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.aim={x:p.x+4,y:p.y-1.5};});assert.ok(await cast(page,'clone'),'Clone');
 await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction&&NecromancerV2.world.actors.some(a=>a.companion==='arcaneClone'));
 const clone=await page.evaluate(()=>{const a=NecromancerV2.world.actors.find(a=>a.companion==='arcaneClone');return {model:a.model,tint:a.tint,drawn:!!NecromancerV2.view.actors.get(a.id)};});
 assert.deepEqual(clone,{model:'mageHero',tint:'#b78cff',drawn:true});
 await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.aim={x:p.x,y:p.y-5};});before=await damage(page);assert.ok(await page.evaluate(()=>NecromancerV2.slot(1)),'Bola de Fogo com o clone');
 await freeze(page,'clone',()=>NecromancerV2.world.marksmanShots.length>=2&&NecromancerV2.world.marksmanShots.every(s=>s.remaining<10.5));
 await page.waitForFunction(()=>!NecromancerV2.world.marksmanShots.length,null,{timeout:4000});assert.ok(await damage(page)>before,'Clone fere');checks.push('Clone Arcano');
 // Chão claro e qualidade baixa com a Muralha e a Avalanche.
 await page.evaluate(()=>{for(const [id,value] of [['ground','light'],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}});
 await stage(page);assert.ok(await cast(page,'firewall'));await page.waitForFunction(()=>{const w=NecromancerV2.world;return w.marksmanZones.some(z=>z.kind==='wall'&&w.time>z.armAt+.4);});
 await page.evaluate(()=>{NecromancerV2.world.marksmanCooldowns={};NecromancerV2.world.player.mp=NecromancerV2.world.player.maxMp;});assert.ok(await cast(page,'avalanche'));
 await freeze(page,'light-low',()=>NecromancerV2.world.effects.some(e=>e.fx==='meteor'&&e.snow));checks.push('chão claro e qualidade baixa');
 // Por último (depois disso a mira segue o ponteiro). No slot do botão direito: segurar o botão mantém o raio; soltar encerra. A mira segue o mouse.
 await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction);await stage(page);await page.evaluate(()=>{NecromancerV2.equip(1,'lazerArcano');});before=await damage(page);
 await page.mouse.move(890,260);await page.mouse.down({button:'right'});
 await page.waitForFunction(()=>{const w=NecromancerV2.world;return w.marksmanAction?.id==='lazerArcano'&&w.marksmanAction.time>1;},null,{timeout:4000});
 await page.mouse.up({button:'right'});await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction,null,{timeout:2000});
 assert.ok(await page.evaluate(()=>NecromancerV2.world.marksmanCooldowns.lazerArcano-NecromancerV2.world.time>6),'recarga ao soltar o botão');assert.ok(await damage(page)>before,'Raio pelo mouse fere');
 await page.evaluate(()=>{NecromancerV2.equip(1,'fireball');});checks.push('Raio Arcano no botão direito');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 const result={ok:true,checks,errors,remote};fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
