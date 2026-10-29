'use strict';
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const review=path.resolve(__dirname,'../../review/v2/e7');fs.mkdirSync(review,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>window.NecromancerV2);await page.evaluate(()=>localStorage.setItem('necromancer_v2','preservar-original'));
 await legacy.click(page,'#enter');
 // Mata um inimigo de treino com o Tiro de Osso, pela mesma entrada do jogador.
 const kill=async()=>{await page.evaluate(()=>{const w=NecromancerV2.world;for(const a of w.actors)if(a.team==='enemy')a.timer=999;const e=w.actors.find(a=>a.team==='enemy'&&a!==w.boss&&a.hp>0);Object.assign(e,{x:0,y:0});Object.assign(w.player,{x:0,y:4});w.aim={x:0,y:0};w.random=()=>.99;window.__target=e;});
  for(let i=0;i<4&&await page.evaluate(()=>window.__target.hp>0);i++){await page.evaluate(()=>NecromancerV2.cast());await page.waitForTimeout(560);}
  await page.waitForFunction(()=>window.__target.hp<=0);};
 await kill();
 assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.exp),12);assert.equal(await page.evaluate(()=>NecromancerV2.world.drops.filter(d=>d.kind==='gold').length),1);
 await page.evaluate(()=>{const w=NecromancerV2.world,d=w.drops[0];Object.assign(w.player,{x:d.x,y:d.y});});
 await page.waitForFunction(()=>NecromancerV2.session.save.character.gold===4);assert.match(await page.locator('#gold').textContent(),/^4 ouro/);assert.ok((await page.locator('#feed').textContent()).includes('+4 ouro'));
 assert.equal(await page.evaluate(()=>NecromancerV2.world.drops.length),0);
 assert.ok((await page.locator('#exp').getAttribute('value'))==='12');
 // Subida de nível: atributos, cura fixa, pontos e aviso.
 await page.evaluate(()=>{NecromancerV2.session.save.character.exp=97;const p=NecromancerV2.world.player;p.hp=50;p.mp=80;});await kill();
 assert.equal(await page.locator('#level').textContent(),'Nível 2');assert.match(await page.locator('#points').textContent(),/^3 pontos/);assert.ok((await page.locator('#feed').textContent()).includes('Nível 2'));
 const stats=await page.evaluate(()=>{const p=NecromancerV2.world.player;return {maxHp:p.maxHp,maxMp:p.maxMp,hp:Math.round(p.hp),spell:p.spellDamage,level:NecromancerV2.world.army.profile.level,exp:NecromancerV2.session.save.character.exp};});
 assert.deepEqual([stats.maxHp,stats.maxMp,stats.spell,stats.level,stats.exp],[110,85,44,2,9]);assert.ok(stats.hp>=70);
 // Itens no chão legíveis nos dois fundos; a simulação pausada preserva a vida útil.
 await page.evaluate(async()=>{const {spawnDrop}=await import('v2-drops');const w=NecromancerV2.world;w.drops=[];Object.assign(w.player,{x:0,y:4});const near=(a,r)=>[Math.sin(a)*r,4+Math.cos(a)*r];NecromancerV2.pause(true);[['gold',0],['gold',.6],['hp',1.3],['mp',1.9],['gold',2.6],['hp',3.2]].forEach(([kind,a],i)=>{const [x,y]=near(a,2.2+i%2*.9);spawnDrop(w,kind,x,y,kind==='gold'?{amount:4}:{});});});
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>NecromancerV2.world.drops.length),6);await page.screenshot({path:path.join(review,'drops-dark.png')});
 await legacy.select(page,'#ground','light');await legacy.select(page,'#quality','low');await page.waitForTimeout(300);await page.screenshot({path:path.join(review,'drops-light-low.png')});
 await legacy.select(page,'#ground','dark');await legacy.select(page,'#quality','high');
 // Persistência: nível, XP e ouro voltam; o chão e a vida do encontro não.
 await legacy.click(page,'#save-tools summary');await legacy.click(page,'#save');const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('necromancer_rise_3d_save')).character);assert.deepEqual([saved.level,saved.exp,saved.gold],[2,9,4]);
 await page.reload();await page.waitForFunction(()=>window.NecromancerV2);
 assert.deepEqual(await page.evaluate(()=>{const c=NecromancerV2.session.save.character;return [c.level,c.exp,c.gold,NecromancerV2.world.drops.length,NecromancerV2.world.player.maxHp];}),[2,9,4,0,110]);
 assert.equal(await page.locator('#level').textContent(),'Nível 2');
 // Build de teste: substitui o nível em memória e o painel deixa isso claro.
 await legacy.click(page,'#army-tools summary');await legacy.click(page,'#army-demo');
 await page.waitForFunction(()=>document.getElementById('level').textContent==='Nível 24');assert.equal(await page.evaluate(()=>NecromancerV2.world.player.maxHp),330);assert.ok((await page.locator('#save-message').textContent()).includes('substitui'));
 await page.screenshot({path:path.join(review,'hud-level-24.png')});
 assert.equal(await page.evaluate(()=>localStorage.getItem('necromancer_v2')),'preservar-original');assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(review,'progression-result.json'),JSON.stringify({stage:'E7',checks:['abate com Tiro de Osso paga XP e ouro uma vez','coleta automática de ouro e aviso','subida de nível: atributos, cura, pontos e aviso','itens no chão em fundo escuro, claro e qualidade baixa','pausa preserva o chão','save e reload preservam nível, XP e ouro sem restaurar o chão','build de teste substitui o nível e avisa','save antigo preservado','sem erros de página'],errors},null,2)+'\n');console.log('E7a progressão OK: abate, ouro, nível, drops visíveis e persistência.');
}finally{await browser.close();}})().catch(e=>{console.error(String(e.stack||e).slice(0,1800));process.exitCode=1;});
