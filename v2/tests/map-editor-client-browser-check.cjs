'use strict';
// Cliente separado do editor: edita pela página própria, grava em arquivo, recarrega e abre o jogo real com o mapa atual.
// Usa uma pasta temporária de mapas, sem tocar em v2/assets/maps/ nem no save pessoal do navegador.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createEditorServer}=require('../tools/map-editor-server.cjs');
const review=path.resolve(__dirname,'../../review/v2/map-editor-client');
(async()=>{
 fs.mkdirSync(review,{recursive:true});
 const mapsDir=fs.mkdtempSync(path.join(os.tmpdir(),'nr-editor-')),published=[],instance=createEditorServer({mapsDir,publish:async()=>{published.push(JSON.parse(fs.readFileSync(path.join(mapsDir,'campaign-trail.json'),'utf8')).size);return published.length===2?{ok:false,message:'build quebrado'}:{ok:true};}}),port=await instance.listen(0),base='http://127.0.0.1:'+port;
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}),result={};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+' '+(m.location().url||''));});page.on('response',r=>{if(r.status()===404)errors.push('404: '+r.url());});
  const open=async()=>{await page.goto(base+'/');await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:180000});};
  await open();
  const requested=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).map(r=>r.name.split('/').pop()));
  result.models=requested.length;assert.ok(!requested.some(n=>/medieval|lich|enemy|fallen/i.test(n)),'só cenário e personagem de referência: '+requested);
  result.metrics=await page.evaluate(()=>({mapsMs:Math.round(NecromancerMapEditor.metrics.mapsMs),modelsMs:Math.round(NecromancerMapEditor.metrics.modelsMs),readyMs:Math.round(NecromancerMapEditor.metrics.readyMs)}));
  assert.equal(await page.locator('#maps-content [data-slot]').count(),5);
  // Edita pelos controles reais.
  await page.locator('#maps-content [data-slot="trail"]').getByRole('button',{name:'Editar',exact:true}).click();await page.waitForSelector('#map-editor[open]');assert.equal(await page.locator('.me-stage').getAttribute('data-view'),'3d');await page.locator('#map-editor [data-mode="split"]').click();await page.waitForTimeout(800);
  const box=await page.locator('#map-editor .me-pane canvas').first().boundingBox(),at=(u,v)=>[box.x+box.width*u,box.y+box.height*v];
  await page.locator('#map-editor [data-tool="river"]').click();await page.mouse.move(...at(.15,.5));await page.mouse.down();await page.mouse.move(...at(.85,.45),{steps:12});await page.mouse.up();
  await page.getByLabel('Buscar peça').fill('Tenda');await page.locator('#map-editor [data-tool="tent"]').click();assert.equal(await page.locator('#map-editor [data-tool="campfire"]').isVisible(),false,'a busca esconde as outras peças');assert.equal(await page.getByText('Mapa base',{exact:true}).isVisible(),false,'mapa da campanha não troca de base');await page.mouse.click(...at(.3,.25));
  const file=path.join(mapsDir,'campaign-trail.json');
  // Sem clicar em Salvar: espera o arquivo trazer as duas edições (o WebGL por software atrasa os temporizadores da página).
  const hasEdits=()=>{try{const m=JSON.parse(fs.readFileSync(file,'utf8'));return m.terrain?.rivers?.length===1&&m.objects.some(o=>o.type==='tent');}catch{return false;}};
  const deadline=Date.now()+90000;while(Date.now()<deadline&&!hasEdits())await page.waitForTimeout(300);assert.ok(hasEdits(),'a edição chega ao disco sem clicar em Salvar');
  const disk=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(disk.campaign,'trail');assert.equal(disk.base,'builtin:arandu-trail');assert.equal(disk.terrain.rivers.length,1);assert.ok(disk.objects.some(o=>o.type==='tent'));
  result.fileBytes=fs.statSync(file).size;assert.ok(fs.readFileSync(file,'utf8').split('\n').length>5,'arquivo legível, por linhas');
  await page.screenshot({path:path.join(review,'editor.png')});
  // Vida e experiência do mapa: pelo campo real, chegam ao arquivo e ao jogo.
  await page.getByLabel('Vida dos inimigos (×)').fill('2');await page.getByLabel('Vida dos inimigos (×)').blur();await page.waitForTimeout(300);await page.getByLabel('Experiência dos inimigos (×)').fill('0.5');await page.getByLabel('Experiência dos inimigos (×)').blur();
  const scaled=()=>{try{const m=JSON.parse(fs.readFileSync(file,'utf8'));return m.enemyHp===2&&m.enemyXp===.5;}catch{return false;}};
  const scaleDeadline=Date.now()+60000;while(Date.now()<scaleDeadline&&!scaled())await page.waitForTimeout(300);assert.ok(scaled(),'os ajustes chegam ao disco');
  // Testar abre o jogo em outra aba, com o editor ainda aberto.
  const [tab]=await Promise.all([context.waitForEvent('page'),page.locator('#map-editor').getByRole('button',{name:'Testar ▶',exact:true}).click()]);
  tab.on('pageerror',e=>errors.push('jogo: '+e.message));
  await tab.waitForFunction(()=>window.NecromancerV2?.world?.adventure?.kind==='custom-map',null,{timeout:240000});
  const game=await tab.evaluate(()=>{const w=NecromancerV2.world,bundle=JSON.parse(document.getElementById('campaign-maps').textContent);return {name:w.adventure.name,rivers:w.arena.terrain?.hasWater,tents:w.arena.kitProps.filter(p=>p.part==='tent').length,bundle:bundle.maps.map(m=>m.id),scene:NecromancerV2.session.scene,enemyHp:w.arena.enemyHp,enemyXp:w.arena.enemyXp};});
  Object.assign(result,{game});assert.equal(game.rivers,true);assert.equal(game.tents,1);assert.deepEqual(game.bundle,['campaign-trail'],'o jogo recebe o mapa do disco');assert.equal(game.scene,'training');
  await tab.waitForTimeout(1200);await tab.screenshot({path:path.join(review,'game-test.png')});await tab.close();
  assert.ok(await page.locator('#map-editor[open]').count(),'o editor continua aberto');
  // Publicar: a edição recém-feita chega ao disco antes do build (o servidor é falso aqui e não toca a distribuição).
  const publishBar=page.locator('#map-editor [data-publish]'),barStatus=page.locator('#map-editor .me-status');
  await page.waitForFunction(()=>/\d+ mapas?/.test(document.querySelector('#map-editor [data-publish]').textContent),null,{timeout:60000});result.publishLabel=await publishBar.textContent();
  const widthBefore=JSON.parse(fs.readFileSync(file,'utf8')).size?.w||0;
  await page.locator('#map-editor').getByRole('button',{name:'+ 20 u',exact:true}).click();await publishBar.click();
  await page.waitForFunction(()=>/Publicado em/.test(document.querySelector('#map-editor .me-status').textContent),null,{timeout:90000});
  assert.equal(published.length,1);assert.ok(published[0]?.w>widthBefore,'o build vê a edição que acabou de ser feita, sem esperar a gravação automática');result.publishedWidth=published[0].w;
  await publishBar.click();await page.waitForFunction(()=>/A publicação falhou: build quebrado/.test(document.querySelector('#map-editor .me-status').textContent),null,{timeout:90000});await page.waitForFunction(()=>!document.querySelector('#map-editor [data-publish]').disabled,null,{timeout:30000});result.publishFailure=await barStatus.textContent();
  // Recarrega: o que está no disco volta; Restaurar apaga o arquivo.
  await page.locator('#map-editor').getByRole('button',{name:'Fechar',exact:true}).click();await page.waitForSelector('#map-editor',{state:'hidden'});
  await open();const row=page.locator('#maps-content .maps-row').filter({has:page.locator('[data-slot="trail"]')});assert.match(await row.innerText(),/editado/);
  await page.locator('#maps-content [data-publish]').click();await page.waitForFunction(()=>/Publicado em/.test(document.querySelector('#maps-content .maps-message')?.textContent||''),null,{timeout:90000});assert.equal(published.length,3,'a lista de mapas também publica');
  // Falha de gravação aparece e não perde a edição.
  await row.getByRole('button',{name:'Editar',exact:true}).click();await page.waitForSelector('#map-editor[open]');await page.waitForTimeout(400);
  await page.route('**/api/maps/**',r=>r.fulfill({status:500,contentType:'application/json',body:'{"ok":false,"message":"disco cheio"}'}));
  await page.locator('#map-editor').getByRole('button',{name:'+ 20 u',exact:true}).click();
  await page.waitForFunction(()=>/disco cheio/.test(document.querySelector('#map-editor .me-status').textContent),null,{timeout:90000});result.errorShown=true;
  await page.unroute('**/api/maps/**');await page.waitForFunction(()=>!NecromancerMapEditor.store.pending()&&/normalizada/.test(document.querySelector('#map-editor .me-status').textContent),null,{timeout:90000});
  const grown=JSON.parse(fs.readFileSync(file,'utf8')).size;assert.ok(grown&&grown.w>40,'a edição foi gravada depois da falha');result.retried=grown;
  await page.locator('#map-editor').getByRole('button',{name:'Fechar',exact:true}).click();await page.waitForSelector('#map-editor',{state:'hidden'});
  await row.getByRole('button',{name:'Restaurar',exact:true}).click();await page.getByRole('button',{name:'Confirmar: apagar a edição',exact:true}).click();
  await page.waitForFunction(()=>!NecromancerMapEditor.store.pending());await page.waitForTimeout(300);assert.ok(!fs.existsSync(file),'Restaurar apaga o arquivo');
  result.errors=errors.filter(e=>!/500|disco cheio/.test(e));assert.deepEqual(result.errors,[]);
  fs.writeFileSync(path.join(review,'browser-result.json'),JSON.stringify(result,null,1));console.log(JSON.stringify(result,null,1));
 }finally{await browser.close();await instance.close();fs.rmSync(mapsDir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
