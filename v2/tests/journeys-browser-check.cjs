'use strict';
// Suas jornadas: personagens semeados em armazenamento isolado, retratos e palco com os modelos reais,
// seleção, painel de resumo, continuar e layout em desktop, tela estreita e celular.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),url=pathToFileURL(path.join(root,'necromancer-3d.html')).href,dir=path.resolve(root,'../review/v2/journeys');
(async()=>{
 const {freshSave,normalizeSave,SAVE_KEY,CHARACTERS_KEY}=await import(pathToFileURL(path.join(root,'scripts/save-model.mjs')).href);
 const {TEST_PROFILE}=await import(pathToFileURL(path.join(root,'scripts/horde.mjs')).href);
 const make=(name,classId,patch)=>{const s=freshSave();Object.assign(s.character,{name,classId,slotId:name.toLowerCase()});patch(s);return normalizeSave(s);};
 const leo=make('Léo','necromancer',s=>{s.character.level=24;s.character.exp=4746;s.character.playTime=45*3600+12*60;s.horde={profile:TEST_PROFILE,loadout:['raio','skeleton','dash','zombie','archer','empty']};s.campaign={started:true,world:{stage:'complete',area:'itauna-fort',entry:'gate'}};s.savedAt=Date.now();});
 const bento=make('Bento','warrior',s=>{s.character.level=12;s.character.exp=900;s.character.playTime=18*3600+27*60;s.campaign={started:true,prologue:{stage:'defense'}};s.savedAt=Date.now()-3600e3;});
 const mira=make('<Mira>','necromancer',s=>{s.savedAt=Date.now()-7200e3;});
 const seed={[SAVE_KEY]:JSON.stringify(leo),[CHARACTERS_KEY]:JSON.stringify({bento,['<mira>']:mira})};
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),result={views:[]};
 try{
  const context=await browser.newContext({viewport:{width:1672,height:941}}),page=await context.newPage(),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.addInitScript(seed=>{if(!sessionStorage.getItem('seeded')){localStorage.clear();for(const [k,v] of Object.entries(seed))localStorage.setItem(k,v);sessionStorage.setItem('seeded','1');}},seed);
  await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true'&&!document.getElementById('loading'),null,{timeout:90000});
  await page.waitForSelector('#tl.on');await page.click('[data-title="continue"]');
  await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
  await page.waitForFunction(()=>[...document.querySelectorAll('.journey-face img')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:30000});
  assert.equal(await page.locator('.save-character').count(),3);
  assert.equal(await page.locator('.save-character.on strong').textContent(),'Léo');
  assert.equal(await page.locator('.save-character strong').filter({hasText:'<Mira>'}).count(),1);
  const panel=await page.locator('.journeys-panel').innerText();
  for(const text of ['Léo','Necromante','Nível 24','Vida','Mana','Dano mágico','Defesa','Forte da Pedra Negra','4.746'])assert.ok(panel.includes(text),'painel sem '+text);
  assert.ok((await page.locator('.save-character.on').innerText()).includes('45h 12min'));
  await page.waitForTimeout(600);await page.screenshot({path:path.join(dir,'necromancer.png')});
  await page.locator('.save-character').filter({hasText:'Bento'}).click();await page.waitForSelector('.journeys-stage[data-ready="true"]');
  const warrior=await page.locator('.journeys-panel').innerText();for(const text of ['Guerreiro','Vigor','Dano','Vila de Jacarandá'])assert.ok(warrior.includes(text),'painel do guerreiro sem '+text);
  await page.waitForTimeout(600);await page.screenshot({path:path.join(dir,'warrior.png')});
  for(const [name,width,height] of [['desktop',1440,900],['narrow',1024,768],['mobile',390,844]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(500);
   const overflow=await page.evaluate(()=>document.querySelector('#tl-wrap').scrollWidth>innerWidth+1);assert.equal(overflow,false,name+': rolagem horizontal');
   await page.screenshot({path:path.join(dir,name+'.png'),fullPage:true});result.views.push(name);
  }
  // Novo Personagem, aberto pela última carta: mesmo layout, nome preservado ao trocar de classe.
  await page.setViewportSize({width:1672,height:941});await page.click('.journey-new');await page.waitForSelector('.journeys-stage[data-ready="true"]');
  assert.equal(await page.locator('.class-choice').count(),6);assert.equal(await page.locator('.class-choice.on').getAttribute('data-class'),'necromancer');
  await page.fill('#character-name','Iara');await page.waitForTimeout(600);await page.screenshot({path:path.join(dir,'new-necromancer.png')});
  await page.click('.class-choice[data-class="warrior"]');await page.waitForSelector('.journeys-stage[data-ready="true"]');
  assert.equal(await page.inputValue('#character-name'),'Iara');const fresh=await page.locator('.journeys-panel').innerText();for(const text of ['Guerreiro','Atributos no nível 1','Vigor','Dano'])assert.ok(fresh.includes(text),'novo personagem sem '+text);
  await page.waitForTimeout(600);await page.screenshot({path:path.join(dir,'new-warrior.png')});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>document.querySelector('#tl-wrap').scrollWidth>innerWidth+1),false,'novo personagem: rolagem horizontal');
  await page.screenshot({path:path.join(dir,'new-mobile.png'),fullPage:true});result.views.push('novo personagem');
  await page.fill('#character-name','');await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:'Iniciar jornada'}).click();
  assert.equal(await page.locator('.character-error').textContent(),'Escolha um nome para iniciar sua jornada.');
  await page.getByRole('button',{name:'Voltar',exact:true}).click();await page.click('[data-title="continue"]');await page.waitForSelector('.journeys-stage[data-ready="true"]');
  await page.locator('.save-character').filter({hasText:'Bento'}).click();await page.click('[data-journey="continue"]');
  await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.name),'Bento');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);result.errors=errors;result.remote=remote;
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,1));console.log('jornadas ok:',result.views.join(', '));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
