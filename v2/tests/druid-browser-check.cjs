// Druida no navegador: criação pela tela de Novo personagem, árvore própria, magias, forma de lobo e capturas.
// Requer Playwright e Edge com WebGL 2 (perfil isolado). Evidências em review/v2/druid/.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const dir=path.resolve(__dirname,'../../review/v2/druid');fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors=[],remote=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
// Novo personagem: a terceira classe aparece com prévia 3D e atributos.
await page.click('[data-title="campaign"]');await page.locator('.class-choice[data-class="druid"]').click();await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
assert.match(await page.locator('.class-choice[data-class="druid"]').innerText(),/Druida/);await page.waitForTimeout(400);await page.screenshot({path:path.join(dir,'selection.png')});
await page.locator('#character-name').fill('Flora');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.classId),'druid');
await page.evaluate(()=>{NecromancerV2.go('training');});await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
assert.equal(await page.evaluate(()=>NecromancerV2.world.player.model),'druid');
assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='ally').length),0,'sem horda');
// Sem pontos investidos: só Faísca e Esquiva funcionam; o resto pede a árvore.
const locked=await page.evaluate(()=>[1,2,4,5].map(i=>NecromancerV2.slot(i)));assert.deepEqual(locked,[false,false,false,false]);
// Árvore própria: três pontos do nível 1 em Corrente, Raízes e Forma de Lobo.
await page.evaluate(()=>NecromancerV2.ui.show('skills'));await page.waitForSelector('[data-warrior-node="chain"]');
for(const [id,name] of [['chain','Corrente de Raios'],['roots','Raízes'],['wolf','Forma de Lobo']]){await page.locator('[data-warrior-node="'+id+'"]').click();await page.getByRole('button',{name:'Aprender '+name,exact:true}).click();}
assert.deepEqual(await page.evaluate(()=>{const r=NecromancerV2.session.save.character.druidRanks;return [r.chain,r.roots,r.wolf];}),[1,1,1]);
await page.locator('[data-branch="wild"]').first().click();await page.screenshot({path:path.join(dir,'tree.png')});
await page.keyboard.press('Escape');await page.waitForFunction(()=>!NecromancerV2.world.paused);
// Campo controlado: alvos parados à frente da Druida.
await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.boss.hp=0;w.actors=w.actors.filter(a=>a===p||a.team==='enemy'&&a!==w.boss);w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>{Object.assign(e,{x:p.x-1.5+(i%4)*1.1,y:p.y-6-Math.floor(i/4)*1.4,dummy:true,hp:5000,maxHp:5000});});w.aim={x:p.x,y:p.y-6};p.mp=p.maxMp;});
// Pausa o mundo logo após a liberação (ou \`after\` segundos depois, para efeitos que crescem) e captura.
async function frozen(name,start,after=0){
 await page.evaluate(start);
 await page.waitForFunction(after=>{const w=NecromancerV2.world;if(w.druidAction?.released)w.releasedAt??=w.time;if(w.releasedAt!==undefined&&w.time-w.releasedAt>=after){w.paused=true;delete w.releasedAt;return true;}return false;},after,{timeout:5000});
 await page.waitForTimeout(250);await page.screenshot({path:path.join(dir,name)});
 await page.evaluate(()=>{NecromancerV2.world.paused=false;});await page.waitForFunction(()=>!NecromancerV2.world.druidAction&&NecromancerV2.world.castCooldown<=0);await page.waitForTimeout(150);
}
const hp=()=>page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy').map(a=>a.hp).reduce((a,b)=>a+b,0));
let before=await hp();await frozen('spark.png',()=>NecromancerV2.slot(0));assert.ok(await hp()<before,'Faísca causa dano');
before=await hp();await frozen('chain.png',()=>{NecromancerV2.world.castCooldown=0;return NecromancerV2.slot(1);});assert.ok(await hp()<before,'Corrente causa dano');
await frozen('roots.png',()=>NecromancerV2.slot(2),.3);
assert.ok(await page.evaluate(()=>NecromancerV2.world.actors.some(a=>a.druidRoot>NecromancerV2.world.time)),'alvos presos');
// Nós de nível alto liberados direto no mundo, só para conferir os efeitos.
await page.evaluate(()=>{const w=NecromancerV2.world;Object.assign(w.druidRanks,{storm:1,rejuvenate:1,leap:1,howl:1});w.player.mp=w.player.maxMp;});
before=await hp();await frozen('storm.png',()=>{NecromancerV2.world.castCooldown=0;return NecromancerV2.slot(4);},1.1);assert.ok(await hp()<before,'Tempestade causa dano');
await page.evaluate(()=>{const p=NecromancerV2.world.player;p.hp=Math.floor(p.maxHp/2);});await frozen('rejuvenate.png',()=>NecromancerV2.slot(5),.4);
await page.waitForTimeout(5200);assert.ok(await page.evaluate(()=>{const p=NecromancerV2.world.player;return p.hp>=Math.floor(p.maxHp/2)+Math.floor(p.maxHp*.3)-1;}),'Rejuvenescer cura 30%');
await page.evaluate(()=>{const w=NecromancerV2.world;w.player.mp=w.player.maxMp;w.druidFormReady=0;});
// Forma de lobo pelo F: troca o modelo e a barra.
await page.waitForTimeout(400);await page.keyboard.press('KeyF');await page.waitForFunction(()=>NecromancerV2.world.druidForm==='wolf');
assert.equal(await page.evaluate(()=>NecromancerV2.world.player.model),'druidWolf');
await page.waitForTimeout(600);await page.screenshot({path:path.join(dir,'wolf.png')});
assert.match(await page.locator('[data-hud-slot="0"]').innerText(),/Garras/);
await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player,e=w.actors.find(a=>a.team==='enemy'&&a.hp>0);p.x=e.x;p.y=e.y+1.6;w.aim={x:e.x,y:e.y};});
await frozen('wolf-claws.png',()=>{NecromancerV2.world.castCooldown=0;return NecromancerV2.slot(0);});
await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player,e=w.actors.find(a=>a.team==='enemy'&&a.hp>0);p.x=e.x;p.y=e.y+6;w.aim={x:e.x,y:e.y};p.mp=p.maxMp;});
await frozen('wolf-leap.png',()=>NecromancerV2.slot(1));
assert.ok(await page.evaluate(()=>{const w=NecromancerV2.world,e=w.actors.find(a=>a.team==='enemy'&&a.hp>0);return Math.hypot(w.player.x-e.x,w.player.y-e.y)<3;}),'Salto aproxima');
await frozen('wolf-howl.png',()=>NecromancerV2.slot(2),.15);
assert.ok(await page.evaluate(()=>NecromancerV2.world.druidFrenzy>NecromancerV2.world.time),'Uivo ativa o frenesi');
// Qualidade baixa e chão claro, ainda na forma de lobo.
await page.evaluate(()=>{for(const [id,value] of [['ground','light'],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}});
assert.deepEqual(await page.evaluate(()=>[NecromancerV2.session.save.settings.ground,NecromancerV2.session.save.settings.quality]),['light','low']);
await page.evaluate(()=>{const w=NecromancerV2.world;w.castCooldown=0;});await page.evaluate(()=>NecromancerV2.slot(0));
await page.waitForTimeout(500);await page.screenshot({path:path.join(dir,'wolf-light-low.png')});
// Mana esgotada: volta à forma humana e espera para transformar de novo.
await page.evaluate(()=>{NecromancerV2.world.player.mp=0;});await page.waitForFunction(()=>NecromancerV2.world.druidForm==='human');
assert.equal(await page.evaluate(()=>NecromancerV2.world.player.model),'druid');
assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
const result={ok:true,checks:['seleção da classe','árvore própria','Faísca','Corrente','Raízes','Tempestade','Rejuvenescer','Forma de Lobo','Garras','Salto Feroz','Uivo','qualidade baixa e chão claro','volta ao esgotar'],errors,remote};
fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
