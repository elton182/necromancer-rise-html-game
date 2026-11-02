'use strict';
// Chão pintado de Jacarandá nos mapas abertos: grama e terra batida iguais às da vila, sem erros de shader, no claro e no escuro.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const dir=path.resolve(__dirname,'../../review/v2/painted-ground');fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=d3d11','--enable-gpu']});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
 await page.evaluate(()=>{const n=NecromancerV2;n.session.save.campaign.started=true;n.session.save.campaign.prologue={stage:'cave',introRead:true};n.campaign.start();});
 // Cada vista: mapa, ponto da câmera e nome da captura.
 const views=await page.evaluate(async()=>{
  const {builtinMap,toArena,TEMPLATES}=await import('v2-map-model'),{withIntactVillage}=await import('v2-campaign-world-map'),{expeditionArena}=await import('v2-expedition-map');
  const world=toArena(builtinMap('builtin:campaign-world')),swamp=expeditionArena(1,{biome:'swamp'}),forestExp=expeditionArena(1,{biome:'forest'});
  const prologue=TEMPLATES.find(t=>t.id==='arandu-caravan')?.make();
  window.groundViews=[
   ['village',(await import('v2-village-map')).villageArena(),{x:-7,y:-6}],
   ['world-path',world,{x:-36,y:-86}],
   ['world-village-edge',withIntactVillage(world),{x:82,y:60}],
   ['forest',(await import('v2-forest-map')).forestArena(),{x:0,y:0}],
   ['trail',(await import('v2-trail-map')).trailArena(),{x:40,y:0}],
   ['expedition-forest',forestExp,{x:forestExp.bounds.minX+30,y:(forestExp.bounds.minY+forestExp.bounds.maxY)/2}],
   ['expedition-swamp',swamp,{x:swamp.bounds.minX+30,y:(swamp.bounds.minY+swamp.bounds.maxY)/2}],
   ...(prologue?[['prologue-caravan',toArena(prologue),{x:0,y:5}]]:[])
  ];
  return window.groundViews.map(v=>v[0]);
 });
 // O mundo da campanha (360 u) é o mapa de carregar save: o chão precisa montar rápido, sem travar a página.
 const worldMs=await page.evaluate(async()=>{const {paintedGround}=await import('v2-painted-ground'),t=performance.now(),mesh=paintedGround(window.groundViews[1][1]);const ms=performance.now()-t;mesh.material.dispose();return ms;});
 assert.ok(worldMs<5000,'chão do mundo levou '+Math.round(worldMs)+' ms');
 const result=[];
 for(let i=0;i<views.length;i++){
  const info=await page.evaluate(i=>{const n=NecromancerV2,[name,a,p]=window.groundViews[i];n.world.arena=a;n.world.sceneryRevision=(n.world.sceneryRevision||0)+1;n.world.adventure=null;n.world.actors=n.world.actors.filter(x=>x===n.world.player);n.world.paused=true;Object.assign(n.world.player,p);n.view.render(n.world,0);document.querySelector('#campaign-panel').hidden=true;return {name,theme:a.theme,biome:a.biome||null};},i);
  await page.waitForTimeout(300);await page.screenshot({path:path.join(dir,info.name+'-dark.png')});
  await page.evaluate(()=>{NecromancerV2.view.ground(true);NecromancerV2.view.quality(true);NecromancerV2.view.render(NecromancerV2.world,0);});await page.waitForTimeout(150);await page.screenshot({path:path.join(dir,info.name+'-light-low.png')});
  await page.evaluate(()=>{NecromancerV2.view.ground(false);NecromancerV2.view.quality(false);});
  result.push(info);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({errors,views:result,worldMs:Math.round(worldMs),checks:['fundo claro e escuro','qualidade baixa','vila embutida no mundo','pântano com poças']},null,2));console.log('Chão pintado: OK ('+views.join(', ')+')');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
