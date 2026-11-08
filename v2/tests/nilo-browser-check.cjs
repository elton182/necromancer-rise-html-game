'use strict';
// O rastro de João no HTML empacotado: Marta na praça, livro do acampamento, casulo na gruta, contrato no forte e entrega na vila.
// Conversas abertas com G e ações pelo botão do painel; os encontros são encerrados por injeção (não mede dificuldade). Evidências em review/v2/nilo-quest/.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const dir=path.resolve(__dirname,'../../review/v2/nilo-quest');fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))requests.push(r.url());});
 const shot=name=>page.screenshot({path:path.join(dir,name+'.png')});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
 await page.evaluate(()=>{const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',smith:'done',lumber:'done',passengerMissing:true};n.campaign.start();});
 await page.waitForTimeout(800);
 const progress=()=>page.evaluate(()=>{const n=NecromancerV2,p=n.session.save.campaign.world;return {nilo:p.nilo??'locked',area:n.world.adventure.area??null,gold:n.session.save.character.gold,objective:document.querySelector('#campaign-panel h3, [data-view="world"] h3')?.textContent||''};});
 const calm=()=>page.evaluate(()=>{const w=NecromancerV2.world;for(const g of w.adventure.groups){g.state='clear';g.timer=1e9;}w.actors=w.actors.filter(a=>a.team!=='enemy');});
 const travel=(x,y,area)=>page.evaluate(async({x,y,area})=>{const w=NecromancerV2.world;w.adventure.exitLock=false;w.actors=w.actors.filter(a=>a.team!=='enemy');Object.assign(w.player,{x,y,hp:w.player.maxHp});await new Promise((ok,no)=>{const end=Date.now()+60000,t=setInterval(()=>{if(!w.areaTravel&&(w.adventure.area||null)===area&&!document.getElementById('area-fade').classList.contains('on')){clearInterval(t);ok();}else if(Date.now()>end){clearInterval(t);no(Error('passagem não terminou'));}},30);});},{x,y,area});
 // Para ao lado do ponto, olhando para ele, e conversa com G. Devolve o título da conversa.
 const talk=async(point,name)=>{await calm();await page.evaluate(({x,y})=>{const n=NecromancerV2,w=n.world;Object.assign(w.player,{x:x+1.6,y:y+.6,hp:w.player.maxHp});n.view.zoom(-9999);n.view.zoom(500);},point);await page.waitForTimeout(900);if(name)await shot(name);
  await page.keyboard.press('KeyG');await page.waitForSelector('[data-view="world-dialogue"]',{timeout:5000});await page.waitForTimeout(250);return page.evaluate(()=>document.querySelector('[data-view="world-dialogue"] h2').textContent);};
 const accept=async(label,name)=>{if(name)await shot(name);await page.getByRole('button',{name:label}).click();await page.waitForSelector('[data-view="world-dialogue"]',{state:'detached',timeout:5000});await page.waitForTimeout(300);};
 const close=()=>page.getByRole('button',{name:'Fechar conversa'}).click();
 const P={marta:{x:56,y:62},nilo:{x:52,y:64},ledger:{x:78,y:-30},cocoon:{x:-44,y:-66},contract:{x:0,y:-34}};
 const result={etapas:[]},step=async label=>result.etapas.push({label,...await progress()});
 const startGold=(await progress()).gold;

 // Jacarandá: Marta oferece a busca.
 assert.equal(await talk(P.marta,'marta-plaza'),'Marta · o rastro de João');await accept(/Aceitar · seguir o rastro/,'marta-offer');await step('aceita');
 assert.equal((await progress()).nilo,'road');
 await page.evaluate(()=>{const w=NecromancerV2.world;w.adventure.mapOpen=true;w.paused=true;});await page.waitForTimeout(400);await shot('world-map-road');await page.evaluate(()=>{const w=NecromancerV2.world;w.adventure.mapOpen=false;w.paused=false;});

 // Várzea: o livro só abre depois de vencer o bando do centro.
 await travel(174,96,'itauna');
 assert.match(await talk(P.ledger),/Livro de contas/);assert.equal(await page.getByRole('button',{name:/Seguir para a Gruta/}).count(),0,'livro bloqueado com o bando de pé');await close();
 await page.evaluate(()=>{const r=NecromancerV2.world.adventure;r.clearedRun.add('camp-inner');});
 await talk(P.ledger,'camp-ledger-point');await accept(/Seguir para a Gruta/,'camp-ledger');await step('livro');assert.equal((await progress()).nilo,'cave');

 // Gruta: João preso; a Mãe-Tecelã guarda o casulo.
 await travel(147,91,'itauna-cave');
 assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.some(a=>a.worldNpc&&a.key==='nilo-cocoon')),true);
 assert.equal(await talk(P.cocoon,'cave-cocoon'),'Prisioneiro no casulo');await close();
 await page.evaluate(()=>NecromancerV2.session.save.campaign.world.cleared.push('cave-queen'));
 assert.equal(await talk(P.cocoon),'João · Gruta das Tecelãs');await accept(/Libertar João/,'cave-rescue');await step('resgate');assert.equal((await progress()).nilo,'fort');

 // Forte: grade, capitão e contrato.
 await travel(66,75,'itauna');await travel(105,-77.5,'itauna-fort');
 await page.evaluate(()=>NecromancerV2.session.save.campaign.world.cleared.push('fort-gate','fort-west','fort-east'));await page.waitForFunction(()=>NecromancerV2.world.arena.gates[0].open,null,{timeout:5000});
 assert.equal(await talk(P.contract),'Mesa do capitão');await close();
 await page.evaluate(()=>NecromancerV2.session.save.campaign.world.cleared.push('fort-captain'));
 assert.equal(await talk(P.contract,'fort-table'),'Contrato da Pedra Negra');await accept(/Guardar o contrato/,'fort-contract');await step('contrato');assert.equal((await progress()).nilo,'return');

 // Volta a Jacarandá: João na praça.
 await travel(0,69,'itauna');await travel(-176,22,null);
 await page.evaluate(()=>{const w=NecromancerV2.world;Object.assign(w.player,{x:60,y:70});});await page.waitForTimeout(600);
 assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.some(a=>a.worldNpc&&a.key==='nilo')),true);
 assert.equal(await talk(P.nilo,'plaza-nilo'),'João · o contrato');await accept(/Entregar o contrato/,'nilo-final');await step('fim');
 const end=await progress();assert.equal(end.nilo,'done');assert.equal(end.gold-startGold,600,'três prêmios, pagos uma vez');
 assert.equal(await talk(P.nilo),'João');assert.equal(await page.getByRole('button',{name:/Entregar/}).count(),0);await close();

 // Praça com fundo claro e qualidade baixa; tela estreita com a conversa aberta.
 await page.evaluate(()=>{NecromancerV2.view.ground(true);NecromancerV2.view.quality(true);});await talk(P.marta,'plaza-light-low');await close();await page.evaluate(()=>{NecromancerV2.view.ground(false);NecromancerV2.view.quality(false);});
 await page.setViewportSize({width:390,height:844});await talk(P.nilo);await page.waitForTimeout(300);await shot('dialogue-mobile');await close();await page.setViewportSize({width:1440,height:900});

 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);result.errors=errors;result.requests=requests;
 fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result.etapas));console.log('O rastro de João: OK');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
