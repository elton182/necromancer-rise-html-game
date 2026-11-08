'use strict';
// Várzea de Itaúna no HTML empacotado: passagem real pela estrada, forte, gruta, grade, inimigos e save em armazenamento isolado. Evidências em review/v2/itauna/.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const dir=path.resolve(__dirname,'../../review/v2/itauna');fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});try{
 // Testar do editor: a mesma planta, por outro caminho de entrada. Caminha de verdade, com o teclado, até o anel.
 {const test=await browser.newPage({viewport:{width:1440,height:900}}),testErrors=[];test.on('pageerror',e=>testErrors.push(e.message));
  await test.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await test.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  await test.evaluate(async()=>{const n=NecromancerV2,{campaignDocument}=await import('v2-campaign-maps');n.playMap(campaignDocument('world'));Object.assign(n.world.player,{x:165,y:96});});
  await test.waitForTimeout(1500);await test.screenshot({path:path.join(dir,'test-mode-ring.png')});
  assert.equal(await test.evaluate(()=>NecromancerV2.world.arena.exits.length),1,'Testar recebe as passagens');
  await test.keyboard.down('KeyD');await test.keyboard.down('KeyS');
  await test.waitForFunction(()=>NecromancerV2.world.adventure?.mapId==='campaign-itauna'&&!document.getElementById('area-fade').classList.contains('on'),null,{timeout:30000});
  await test.keyboard.up('KeyD');await test.keyboard.up('KeyS');
  assert.equal(await test.evaluate(()=>NecromancerV2.world.adventure.kind),'custom-map');await test.waitForTimeout(600);await test.screenshot({path:path.join(dir,'test-mode-arrival.png')});
  assert.deepEqual(testErrors,[]);await test.close();}
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const shot=name=>page.screenshot({path:path.join(dir,name+'.png')});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
 await page.evaluate(()=>{const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',smith:'active',lumber:'active'};n.campaign.start();});
 await page.waitForTimeout(600);
 const stats=()=>page.evaluate(()=>{const r=NecromancerV2.view.renderer.info;return {calls:r.render.calls,triangles:r.render.triangles};});
 // Atravessa pisando no anel e mede do pedido até a tela clarear, já com a cena nova montada.
 const travel=(x,y,area)=>page.evaluate(async({x,y,area})=>{const n=NecromancerV2,w=n.world;w.adventure.exitLock=false;w.actors=w.actors.filter(a=>a.team!=='enemy');Object.assign(w.player,{x,y,hp:w.player.maxHp});const t=performance.now();await new Promise((ok,no)=>{const end=Date.now()+60000,check=setInterval(()=>{if(!w.areaTravel&&(w.adventure.area||null)===area&&!document.getElementById('area-fade').classList.contains('on')){clearInterval(check);ok();}else if(Date.now()>end){clearInterval(check);no(Error('passagem não terminou: '+w.adventure.area));}},30);});return Math.round(performance.now()-t);},{x,y,area});
 const look=async(x,y,zoom=0)=>{await page.evaluate(({x,y,zoom})=>{const n=NecromancerV2,w=n.world;Object.assign(w.player,{x,y,hp:w.player.maxHp});n.view.zoom(-9999);n.view.zoom(zoom*100+300);},{x,y,zoom});await page.waitForTimeout(900);};
 const release=(id,x,y)=>page.evaluate(({id,x,y})=>{const w=NecromancerV2.world;for(const g of w.adventure.groups)if(g.id===id){g.state='dormant';g.wavesLeft=1;}Object.assign(w.player,{x,y,hp:1e6,maxHp:1e6});},{id,x,y}).then(()=>page.waitForFunction(id=>NecromancerV2.world.actors.some(a=>a.worldGroup===id),id,{timeout:8000})).then(()=>page.waitForTimeout(800));
 const silence=()=>page.evaluate(()=>{const w=NecromancerV2.world;for(const g of w.adventure.groups){g.state='clear';g.timer=1e9;}w.actors=w.actors.filter(a=>a.team!=='enemy');});
 const result={passagens:{},render:{}};
 // Relevo e regiões de Jacarandá; densidade dos encontros e tempo de quadro com um grupo inteiro em combate.
 await silence();
 for(const [name,x,y,z] of [['world-crypt-hills',-130,-30,10],['world-north',40,-110,13],['world-peaks',130,-120,13],['world-marsh',-130,140,10],['world-graveyard',140,30,10],['world-forest',-10,0,6]]){await look(x,y,z);await shot(name);result.render[name]=await stats();}
 await page.evaluate(()=>{const w=NecromancerV2.world;for(const g of w.adventure.groups)if(g.id!=='forest-b'){g.state='clear';g.timer=1e9;}w.actors=w.actors.filter(a=>a.team!=='enemy');});await release('forest-b',0,-14);await page.evaluate(()=>{const p=NecromancerV2.world.player;p.maxHp=p.hp=1e6;});
 await page.waitForTimeout(1500);await shot('world-density');
 result.densidade=await page.evaluate(async()=>{const w=NecromancerV2.world,g=w.adventure.groups.find(g=>g.id==='forest-b'),t=[];let last=performance.now();for(let i=0;i<90;i++){await new Promise(r=>requestAnimationFrame(r));const now=performance.now();t.push(now-last);last=now;}t.sort((a,b)=>a-b);return {inimigos:w.actors.filter(a=>a.worldGroup==='forest-b'&&a.hp>0).length,ondas:g.waves,nivel:w.actors.find(a=>a.worldGroup==='forest-b').gearWave,mediana:+t[45].toFixed(1),p90:+t[81].toFixed(1)};});
 await page.evaluate(()=>{const w=NecromancerV2.world;w.actors=w.actors.filter(a=>a.team!=='enemy');w.player.maxHp=w.player.hp=100;});
 // Da estrada de Jacarandá até a várzea.
 await look(160,96);await shot('road-world');
 await page.evaluate(()=>{const w=NecromancerV2.world;w.adventure.exitLock=false;w.actors=w.actors.filter(a=>a.team!=='enemy');for(const g of w.adventure.groups)g.state='clear';Object.assign(w.player,{x:165,y:96,hp:w.player.maxHp});});
 {const t=Date.now();await page.keyboard.down('KeyD');await page.keyboard.down('KeyS');await page.waitForFunction(()=>NecromancerV2.world.adventure.area==='itauna'&&!document.getElementById('area-fade').classList.contains('on'),null,{timeout:30000});await page.keyboard.up('KeyD');await page.keyboard.up('KeyS');result.passagens.varzea=Date.now()-t;}
 let state=await page.evaluate(()=>{const w=NecromancerV2.world,p=NecromancerV2.session.save.campaign.world;return {area:w.adventure.area,saved:p.area,x:w.player.x,y:w.player.y,paused:w.paused,exits:w.arena.exits.length,caption:document.getElementById('minimap-caption').textContent};});
 assert.deepEqual(state,{area:'itauna',saved:'itauna',x:-168,y:22,paused:false,exits:3,caption:'VÁRZEA DE ITAÚNA'});
 await look(-160,22);await shot('entry');await silence();
 for(const [name,x,y,z] of [['bridge',8,-4,13],['ford',7,48,0],['lake-pier',-30,84,13],['camp',72,-22,6],['ramp',108,-50,6],['fort-facade',105,-66,13],['mirror',-98,-60,8],['shrine',-60,-62,4],['tower',-128,105,6],['butte',118,104,13],['mountains',40,-136,13],['cave-mouth',152,96,4],['map-edge',-176,160,13]]){await look(x,y,z);await shot(name);result.render[name]=await stats();}
 // Fundo claro e qualidade baixa, com zoom máximo na borda.
 await page.evaluate(()=>{NecromancerV2.view.ground(true);NecromancerV2.view.quality(true);});await look(-176,120,13);await shot('edge-light-low');await page.evaluate(()=>{NecromancerV2.view.ground(false);NecromancerV2.view.quality(false);});
 // Mapa da área.
 await page.evaluate(()=>{const w=NecromancerV2.world;Object.assign(w.player,{x:-120,y:24});w.adventure.mapOpen=true;w.paused=true;});await page.waitForTimeout(500);await shot('area-map');await page.evaluate(()=>{const w=NecromancerV2.world;w.adventure.mapOpen=false;w.paused=false;});
 // Inimigos reais da várzea.
 await release('camp-inner',74,-24);await shot('camp-combat');
 // Forte: grade fechada, entra, vence o pátio, a grade sobe.
 result.passagens.forte=await travel(105,-77.5,'itauna-fort');
 await silence();await look(0,20,6);await shot('fort-yard-closed');
 state=await page.evaluate(()=>{const w=NecromancerV2.world;return {open:w.arena.gates[0].open,solid:w.arena.solids.some(o=>o.gateId==='fort-portcullis'),types:[...new Set(w.adventure.groups.flatMap(g=>g.mix))].sort()};});
 assert.deepEqual(state,{open:false,solid:true,types:[0,1,3,6,9]});
 await page.evaluate(()=>{const n=NecromancerV2;for(const id of ['fort-gate','fort-west','fort-east'])n.session.save.campaign.world.cleared.push(id);});await page.waitForFunction(()=>NecromancerV2.world.arena.gates[0].open,null,{timeout:5000});
 await page.waitForTimeout(4600);assert.equal(await page.evaluate(()=>NecromancerV2.world.arena.solids.some(o=>o.gateId==='fort-portcullis')),false);await look(0,14,4);await shot('fort-gate-open');
 for(const [name,x,y,z] of [['fort-entry',0,56,6],['fort-camp',-44,30,6],['fort-training',38,34,6],['fort-inner',0,-10,8],['fort-keep',0,-22,4]]){await look(x,y,z);await shot(name);result.render[name]=await stats();}
 await release('fort-captain',0,-14);await shot('fort-captain');
 assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.find(a=>a.worldGroup==='fort-captain'&&a.lootTier==='rare')?.name),'Capitão da Pedra Negra');
 // De volta à várzea e para a gruta.
 result.passagens.saidaForte=await travel(0,69,'itauna');
 assert.deepEqual(await page.evaluate(()=>({x:NecromancerV2.world.player.x,y:NecromancerV2.world.player.y})),{x:105,y:-68});
 result.passagens.gruta=await travel(147,91,'itauna-cave');
 assert.deepEqual(await page.evaluate(()=>{const w=NecromancerV2.world;return {cave:w.arena.cave,types:[...new Set(w.adventure.groups.flatMap(g=>g.mix))].sort()};}),{cave:true,types:[4,8]});
 await silence();
 for(const [name,x,y,z] of [['cave-entry',60,64,2],['cave-den',8,50,4],['cave-lake',-2,-38,6],['cave-nursery',60,-34,4],['cave-queen',-40,-52,4]]){await look(x,y,z);await shot(name);result.render[name]=await stats();}
 await release('den-pack-a',8,42);await shot('cave-wolves');
 assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.find(a=>a.worldGroup==='den-pack-a').name),'Lobo');
 await silence();await release('nursery-a',58,-24);await shot('cave-spiders');
 // Passagem de volta: a saída leva à várzea, e a estrada oeste ao mundo, esquecendo a área no save.
 result.passagens.saidaGruta=await travel(66,75,'itauna');
 await page.setViewportSize({width:390,height:844});await look(-160,22);await shot('mobile');await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(300);
 result.passagens.volta=await travel(-176,22,null);
 assert.deepEqual(await page.evaluate(()=>{const n=NecromancerV2,w=n.world;return {area:w.adventure.area??null,saved:n.session.save.campaign.world.area??null,x:w.player.x,y:w.player.y};}),{area:null,saved:null,x:166,y:95});
 // Teleporte à vila pelo botão do painel: com inimigo alerta perto fica desligado; longe, leva à praça.
 await page.evaluate(()=>NecromancerV2.campaign.update?.());
 await page.evaluate(()=>{const n=NecromancerV2,w=n.world;w.actors=w.actors.filter(a=>a.team!=='enemy');Object.assign(w.player,{x:120,y:84,hp:w.player.maxHp});});await page.waitForTimeout(500);
 await page.waitForSelector('#world-home:not([disabled])',{timeout:8000});await page.screenshot({path:path.join(dir,'home-button.png')});
 {const t=Date.now();await page.click('#world-home');await page.waitForFunction(()=>{const w=NecromancerV2.world;return w.adventure.inVillage&&Math.hypot(w.player.x-60,w.player.y-64)<1&&!document.getElementById('area-fade').classList.contains('on');},null,{timeout:30000});result.passagens.teleporteVila=Date.now()-t;}
 await page.waitForTimeout(800);await shot('home-arrival');assert.equal(await page.evaluate(()=>!!document.getElementById('world-home')),false,'na vila o botão some');
 assert.deepEqual(errors,[]);result.errors=errors;fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result.passagens),JSON.stringify(result.densidade));console.log('Várzea de Itaúna: OK');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
