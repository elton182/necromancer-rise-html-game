'use strict';
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const review=path.resolve(__dirname,'../../review/v2/e7');fs.mkdirSync(review,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],shot=name=>page.screenshot({path:path.join(review,name)});page.on('pageerror',e=>errors.push(e.message.slice(0,200)));
 await page.addInitScript(()=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('necromancer_v2','original-intacto');sessionStorage.setItem('seeded','1');}});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>window.NecromancerV2&&document.body.dataset.ready==='true');
 await legacy.click(page,'#army-tools summary');await legacy.click(page,'#spell-demo');
 assert.deepEqual(await page.evaluate(()=>NecromancerV2.world.army.loadout),['chuva','explosao','maos','barreira','maldicao','dash']);
 await legacy.click(page,'#enter');
 // Inimigos parados e resistentes: o check observa a regra das magias, não a IA.
 const stage=()=>page.evaluate(()=>{const w=NecromancerV2.world;w.player.x=0;w.player.y=6;w.player.mp=w.player.maxMp;w.aim={x:0,y:2};w.spellCooldowns={};const foes=w.actors.filter(a=>a.team==='enemy');foes.forEach((e,i)=>{e.hp=e.maxHp=100000;e.timer=999;e.x=i?14:0;e.y=i?-14+i:2;});return foes[0].id;});
 // A mira real vem do mouse a cada quadro; o check posiciona o cursor sobre o ponto do chão.
 const aimAt=async(x,y)=>{const p=await page.evaluate(([x,y])=>NecromancerV2.view.screen(x,y,NecromancerV2.world),[x,y]);await page.mouse.move(p.x,p.y);await page.waitForFunction(([x,y])=>Math.hypot(NecromancerV2.world.aim.x-x,NecromancerV2.world.aim.y-y)<.05,[x,y]);};
 const target=await stage();await aimAt(0,2);const hp=()=>page.evaluate(id=>NecromancerV2.world.actors.find(a=>a.id===id).hp,target);
 // Explosão pelo atalho 2: dano imediato no mesmo quadro lógico, uma única vez.
 let before=await hp();await page.keyboard.press('2');const nova=await page.evaluate(id=>{const w=NecromancerV2.world;return {hp:w.actors.find(a=>a.id===id).hp,mp:w.player.mp,maxMp:w.player.maxMp,cd:w.spellCooldowns.explosao,ring:w.effects.some(e=>e.kind==='spellArea')};},target);
 assert.ok(nova.hp<before);assert.ok(nova.mp>=nova.maxMp-60&&nova.mp<nova.maxMp-59);assert.ok(nova.cd>7.9);assert.ok(nova.ring);await page.waitForTimeout(120);await shot('nova-dark.png');await page.waitForTimeout(500);assert.equal(await hp(),nova.hp);
 assert.ok((await page.locator('#spell-status').textContent()).includes('Explosão Necrótica'));
 await page.waitForFunction(()=>/\d+\.\ds$/.test(document.querySelector('[data-activate-slot="1"]').textContent),null,{timeout:2000});
 // Abates pela Explosão concedem XP de maestria uma vez: zumbi de treino (Guerreiro) e chefe.
 await stage();await aimAt(0,2);const prior=await page.evaluate(()=>{const w=NecromancerV2.world,[,zombie]=w.actors.filter(a=>a.team==='enemy'&&a!==w.boss);Object.assign(zombie,{x:.5,y:2,hp:50});Object.assign(w.boss,{x:-.5,y:2,hp:50});return {explosao:structuredClone(w.army.mastery.explosao),raio:structuredClone(w.army.mastery.raio),xp:[zombie.xp,w.boss.xp]};});
 assert.deepEqual(prior.xp,[12,100]);await page.keyboard.press('2');
 const gained=await page.evaluate(async()=>{const w=NecromancerV2.world;return {state:structuredClone(w.army.mastery.explosao),raio:w.army.mastery.raio,dead:w.actors.filter(a=>a.team==='enemy'&&a.dead).length};});
 const expected=await page.evaluate(async b=>{const {default:Model}=await import('v2-mastery-model'),level=NecromancerV2.world.army.profile.level;let s=b.explosao;for(const xp of b.xp)s=Model.gain('explosao',s,xp,level).state;return s;},prior);
 assert.equal(gained.dead,2);assert.deepEqual(gained.state,expected);assert.ok(expected.level>prior.explosao.level);assert.deepEqual(gained.raio,prior.raio);
 await page.waitForFunction(()=>document.getElementById('save-message').textContent.startsWith('Maestria ↑')&&document.getElementById('save-message').textContent.includes('Explosão Necrótica'),null,{timeout:2000});await page.waitForTimeout(300);assert.deepEqual(await page.evaluate(()=>NecromancerV2.world.army.mastery.explosao),expected);
 // Mana insuficiente não paga nem inicia recarga.
 await page.evaluate(()=>{const w=NecromancerV2.world;w.player.mp=0;w.spellCooldowns={};});assert.equal(await page.evaluate(()=>NecromancerV2.slot(1)),false);assert.equal(await page.evaluate(()=>NecromancerV2.world.spellCooldowns.explosao),undefined);
 // Chuva pelo botão do slot: ossos aparecem antes do impacto.
 await stage();await aimAt(0,2);before=await hp();await page.$eval('[data-activate-slot="0"]',b=>b.click());const drops=await page.evaluate(id=>{const w=NecromancerV2.world,e=w.actors.find(a=>a.id===id);return w.rain.filter(d=>Math.hypot(d.x-e.x,d.y-e.y)<d.radius).length;},target);await page.waitForFunction(()=>NecromancerV2.world.rain.some(d=>d.time>d.delay+.1));await page.evaluate(()=>NecromancerV2.pause(true));
 assert.ok(await page.evaluate(()=>NecromancerV2.world.rain.length>0));await shot('rain-fall-dark.png');await page.evaluate(()=>NecromancerV2.pause(false));await page.waitForFunction(()=>NecromancerV2.world.rain.length===0);assert.equal(await hp()<before,drops>0);
 // Muralha: corpos visíveis e inimigo empurrado contra a face próxima não atravessa.
 await stage();await aimAt(0,2);await page.keyboard.press('3');const wall=await page.evaluate(()=>{const w=NecromancerV2.world;return {count:w.walls.length,y:w.walls[0]?.y,width:w.walls[0]?.width};});assert.equal(wall.count,1);
 const crossed=await page.evaluate(async id=>{const w=NecromancerV2.world,e=w.actors.find(a=>a.id===id),{blockEnemyByWalls}=await import('v2-spells');e.x=0;e.y=0;const from={x:0,y:0};e.y=4;blockEnemyByWalls(w,e,from);return e.y;},target);
 assert.ok(crossed<=wall.y-wall.width/2+1e-3);await page.waitForTimeout(150);await shot('corpse-wall-dark.png');
 // Escudo sem zumbi: custo de vida, halo e HUD.
 await stage();const shield=await page.evaluate(()=>{const w=NecromancerV2.world,hp=w.player.hp;NecromancerV2.slot(3);return {hp,after:w.player.hp,barrier:w.player.barrier};});assert.ok(shield.barrier>0);assert.ok(shield.after<shield.hp);await page.waitForFunction(()=>document.getElementById('spell-status').textContent.includes('Escudo'),null,{timeout:2000});
 // Maldição: rótulo sobre o inimigo e redução no caminho comum de dano.
 await aimAt(0,2);await page.keyboard.press('5');assert.ok(await page.evaluate(id=>!!NecromancerV2.world.actors.find(a=>a.id===id).curse,target));await page.waitForFunction(()=>[...document.querySelectorAll('.world-label')].some(e=>e.textContent.startsWith('Fraqueza')),null,{timeout:2000});await shot('curse-shield-dark.png');
 // Morte limpa efeitos persistentes da luta.
 await page.keyboard.press('1');const dead=await page.evaluate(async()=>{const w=NecromancerV2.world,{dealDamage}=await import('v2-model');w.player.barrier=0;dealDamage(w,w.player,1e6);await new Promise(r=>setTimeout(r,120));return {scene:NecromancerV2.session.scene,rain:w.rain.length,walls:w.walls.length,curse:w.actors.some(a=>a.curse),barrier:w.player.barrier};});
 assert.deepEqual(dead,{scene:'dead',rain:0,walls:0,curse:false,barrier:0});
 // Sacrifício com horda, fundo claro e qualidade baixa.
 await legacy.click(page,'#menu');assert.ok((await page.evaluate(()=>NecromancerV2.equip(5,'zombie'))).ok);await legacy.select(page,'#ground','light');await legacy.select(page,'#quality','low');await legacy.click(page,'#enter');await stage();await aimAt(0,2);
 const sacrifice=await page.evaluate(()=>{const w=NecromancerV2.world,hp=w.player.hp;NecromancerV2.slot(3);return {hp,after:w.player.hp,sacrificed:w.actors.filter(a=>a.sacrificed).length,barrier:w.player.barrier};});assert.equal(sacrifice.after,sacrifice.hp);assert.equal(sacrifice.sacrificed,1);assert.ok(sacrifice.barrier>0);
 await page.evaluate(()=>{const w=NecromancerV2.world;w.player.mp=w.player.maxMp;NecromancerV2.slot(2);w.player.mp=w.player.maxMp;NecromancerV2.slot(0);});await page.waitForFunction(()=>NecromancerV2.world.rain.some(d=>d.time>d.delay+.1));await page.evaluate(()=>NecromancerV2.pause(true));await shot('spells-light-horde-low.png');
 // Save guarda loadout e recuperação do sacrificado, não as entidades da luta.
 await legacy.click(page,'#menu');await legacy.click(page,'#save-tools summary');await legacy.click(page,'#save');await page.reload();await page.waitForFunction(()=>window.NecromancerV2&&document.body.dataset.ready==='true');
 const loaded=await page.evaluate(()=>{const w=NecromancerV2.world;return {loadout:w.army.loadout,rain:w.rain.length,walls:w.walls.length,cds:Object.keys(w.spellCooldowns).length,sacrificed:w.actors.filter(a=>a.sacrificed).length,legacy:localStorage.getItem('necromancer_v2')};});
 assert.deepEqual(loaded,{loadout:['chuva','explosao','maos','barreira','maldicao','zombie'],rain:0,walls:0,cds:0,sacrificed:1,legacy:'original-intacto'});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(review,'spells-result.json'),JSON.stringify({stage:'E7',checks:['build de magias equipa seis slots','abates pela Explosão concedem XP de maestria uma vez e avisam a subida de nível','explosão pelo atalho 2 com dano imediato único, mana e recarga no HUD','mana insuficiente não paga nem inicia recarga','chuva pelo botão do slot com ossos visíveis antes do impacto','muralha renderizada e travessia bloqueada','escudo sem zumbi cobra vida e aparece no HUD','maldição marca o inimigo com rótulo','morte limpa quedas, muralhas, maldições e escudo','sacrifício de zumbi sem custo de vida em fundo claro e qualidade baixa','save/reload preserva loadout e recuperação sem entidades da luta','save antigo preservado','sem erros de página'],explosion:nova,shield,sacrifice,errors},null,2)+'\n');
 console.log('E7 magias OK: explosão, chuva, muralha, escudo, maldição, limpeza e persistência.');
}finally{await browser.close();}})().catch(e=>{console.error(String(e.stack||e).slice(0,1800));process.exitCode=1;});
