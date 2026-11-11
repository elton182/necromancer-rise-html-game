'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=process.env.NR_REVIEW_DIR?path.resolve(process.env.NR_REVIEW_DIR):path.resolve(__dirname,'../../review/v2/act-one-letter');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  const url=pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href;
  const ready=()=>page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  const shot=async name=>{await page.waitForTimeout(180);await page.screenshot({path:path.join(dir,name+'.png')});};
  const stage=()=>page.evaluate(()=>NecromancerV2.session.save.campaign.world.nilo);
  const go=async(x,y)=>{await page.evaluate(([x,y])=>{const n=NecromancerV2;Object.assign(n.world.player,{x,y,hp:100000,maxHp:100000});n.campaign.update();},[x,y]);await page.waitForTimeout(100);};
  const talk=async(x,y)=>{await go(x+.8,y);assert.equal(await page.evaluate(()=>NecromancerV2.campaign.interact()),true);await page.waitForSelector('#campaign-panel[data-view="world-dialogue"]');};
  const act=async text=>{await page.getByRole('button',{name:text}).click();await page.waitForTimeout(100);};
  const clear=async id=>page.evaluate(async id=>{
   const n=NecromancerV2,s=n.session,w=n.world,{tickAdventure}=await import('v2-campaign'),{dealDamage}=await import('v2-combat'),g=w.adventure.groups.find(g=>g.id===id);if(!g)throw Error('grupo '+id);
   Object.assign(w.player,{x:g.x,y:g.y,hp:100000,maxHp:100000});
   for(let i=0;i<70&&g.state!=='clear';i++){
    if(g.state==='between')g.timer=0;tickAdventure(s,.1);
    for(const e of [...w.actors])if(e.worldGroup===id&&e.hp>0)dealDamage(w,e,1e8,w.player);
    tickAdventure(s,.1);
   }
   if(g.state!=='clear')throw Error('grupo não encerrou '+id);n.campaign.update();
  },id);
  const travel=async(to,entry)=>{
   await page.evaluate(({to,entry})=>{const w=NecromancerV2.world;w.areaTravel={to,entry,name:'Percurso de teste'};w.paused=true;},{to,entry});
   await page.waitForFunction(to=>(NecromancerV2.world.adventure.area||null)===to&&!NecromancerV2.world.areaTravel&&!document.getElementById('area-fade').classList.contains('on'),to,{timeout:60000});
  };
  await page.goto(url);await ready();
  await page.click('[data-title="campaign"]');await page.fill('#character-name','Araci');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.getByRole('button',{name:'Começar a jornada',exact:false}).click();
  await page.evaluate(async()=>{const n=NecromancerV2,{nextPrologueDialogue}=await import('v2-prologue');for(let i=0;i<20&&n.world.adventure.dialogue.index<4;i++)nextPrologueDialogue(n.session);n.campaign.update();});
  await page.waitForFunction(()=>document.getElementById('campaign-panel').textContent.includes('bolsa'));await shot('caravan-bag-hint');checks.push('bolsa apresentada na caravana');
  await page.evaluate(()=>{const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',questFlow:1,smith:'available',lumber:'locked',passengerMissing:true};n.campaign.start();});
  await page.locator('.world-label[data-quest-marker="!"]').waitFor();await shot('arrival-quest-offer');
  await page.click('#open-gear');await page.click('#inventory-quests');assert.match(await page.locator('#quest-journal').innerText(),/Nenhuma missão aceita em aberto/);await shot('journal-before-acceptance');await page.keyboard.press('Escape');
  await talk(64,64);await shot('smith-offer');await act(/Aceitar missão · O ferreiro/);assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.world.smith),'active');
  assert.match(await page.locator('#campaign-panel').innerText(),/Etapa 1 de 3/);await page.click('#open-gear');await page.click('#inventory-quests');assert.equal(await page.locator('[data-quest-status="active"] [data-quest-id="smith"]').count(),1);await shot('journal-smith-active');await page.keyboard.press('Escape');
  await clear('mine-guards');await talk(30,-146);await act(/Mandar Bruno/);await talk(52,71);await act(/Reacender a forja/);await talk(64,64);await act(/Aceitar missão · Madeira/);
  for(const [id,x,y] of [['mill-a',-132,108],['mill-b',-104,150],['mill-c',-76,126]]){await clear(id);await talk(x,y);await act(/Marcar a pilha/);}
  await talk(64,64);await act(/Entregar a madeira/);await talk(56,62);await shot('marta-search');await act(/Aceitar · seguir/);assert.equal(await stage(),'road');checks.push('forja e madeira liberam a pista de Marta');
  await travel('itauna','west');await clear('camp-inner');await talk(78,-30);await shot('ledger-escape');await act(/Seguir os rastros/);assert.equal(await stage(),'cave');
  await travel('itauna-cave','mouth');await clear('cave-queen');await talk(-44,-66);await shot('joao-revelation');await act(/Libertar João/);assert.equal(await stage(),'rescued');await travel(null,'village');await talk(52,64);await shot('letter-quest-offer');await act(/Aceitar missão · A carta/);assert.equal(await stage(),'fort');checks.push('livro e resgate explicam fuga, cargo e carta');
  await travel('itauna-fort','gate');for(const id of ['fort-gate','fort-west','fort-east','fort-inner-w','fort-inner-e','fort-captain'])await clear(id);
  await talk(44,-28);await shot('bag-recovered');await act(/Recuperar a bolsa/);assert.equal(await stage(),'fort');
  await page.evaluate(()=>NecromancerV2.save());await page.reload();await ready();await page.click('[data-title="continue"]');await page.locator('.save-character').first().click();await page.click('[data-journey="continue"]');
  await page.waitForFunction(()=>NecromancerV2.world.adventure?.area==='itauna-fort');assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.world.niloLetter),true);assert.equal(await stage(),'fort');
  await talk(0,-34);await shot('contract-evidence');await act(/Guardar o contrato/);assert.equal(await stage(),'return');checks.push('bolsa e provas separadas, com recarga entre objetivos');
  await travel(null,'village');await talk(52,64);await shot('joao-letter-return');await act(/Entregar a bolsa e as provas/);assert.equal(await stage(),'done');
  const gold=await page.evaluate(()=>NecromancerV2.session.save.character.gold);await talk(52,64);await act(/Viajar com a caravana/);
  await page.waitForFunction(()=>NecromancerV2.world.adventure.area==='itavera'&&!document.getElementById('area-fade').classList.contains('on'),null,{timeout:60000});
  assert.equal(await stage(),'itavera');await shot('itavera-arrival');assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.some(a=>a.team==='enemy')),false);
  await talk(0,-12);await shot('helena-delivery');
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:/Entregar a denúncia/}).scrollIntoViewIfNeeded();await shot('helena-mobile');await act(/Entregar a denúncia/);assert.equal(await stage(),'invitation');
  await page.evaluate(()=>NecromancerV2.save());await page.reload();await ready();await page.click('[data-title="continue"]');await page.locator('.save-character').first().click();await page.click('[data-journey="continue"]');
  await page.waitForFunction(()=>NecromancerV2.world.adventure?.area==='itavera');assert.equal(await stage(),'invitation');checks.push('entrega a Helena persiste sem repetição');
  await talk(-5,-6);await page.getByRole('button',{name:/Aceitar o convite/}).scrollIntoViewIfNeeded();await shot('invitation-mobile');await act(/Aceitar o convite/);assert.equal(await stage(),'complete');
  await page.setViewportSize({width:1440,height:900});await shot('act-one-complete');
  assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.gold),gold);checks.push('convite conclui o Ato I sem repetir prêmios nem abrir Ato II');
  await page.evaluate(async()=>{const n=NecromancerV2,{useProfile}=await import('v2-session'),{TEST_PROFILE}=await import('v2-horde');useProfile(n.session,TEST_PROFILE);n.equip(1,'skeleton');n.equip(2,'zombie');n.view.zoom(9999);n.view.quality('low');n.view.ground(true);});
  await go(0,27);await shot('itavera-edge-light-low-horde');await page.evaluate(()=>NecromancerV2.view.ground(false));await shot('itavera-edge-dark-low-horde');
  await go(0,-26);await shot('itavera-north-edge');await page.keyboard.press('m');await shot('itavera-map');await page.keyboard.press('m');
  await travel(null,'village');assert.equal(await stage(),'complete');await talk(52,64);await act(/Revisitar Itavera/);await page.waitForFunction(()=>NecromancerV2.world.adventure.area==='itavera',null,{timeout:60000});assert.equal(await stage(),'complete');checks.push('retorno a Jacarandá e revisita após conclusão');
  await page.click('#open-gear');await page.click('#inventory-quests');assert.equal(await page.locator('[data-quest-status="active"] .quest-card').count(),0);assert.equal(await page.locator('[data-quest-status="done"] .quest-card').count(),7);await shot('journal-complete');
  await page.setViewportSize({width:390,height:844});await shot('journal-mobile');await page.keyboard.press('Escape');checks.push('NPCs oferecem missões, HUD só após aceitar, etapas e diário persistem');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({checks,errors,remote,limitations:['encerramentos controlados com dano injetado; não mede dificuldade','Itavera implementada como praça de recepção; Ato II ainda indisponível']},null,2));console.log('Ato I · carta e Itavera: OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
