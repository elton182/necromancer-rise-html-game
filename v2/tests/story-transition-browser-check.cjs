'use strict';
// Transições das cenas do prólogo e Caminho de Jacarandá ampliado.
// Mede, a cada quadro, se a cena foi remontada (sceneryRevision) com a cobertura escura visível: a troca de mapa
// não pode aparecer como quadro congelado. Encerramentos de combate usam HP injetado; não mede dificuldade.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/story-transitions');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  const ready=()=>page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
  const shot=async(name,wait=200)=>{await page.waitForTimeout(wait);await page.evaluate(n=>{window.storyMark='shot:'+n;},name);await page.screenshot({path:path.join(dir,name+'.png')});await page.evaluate(()=>{window.storyMark='';});};
  const stage=key=>page.waitForFunction(key=>NecromancerV2.session.save.campaign.prologue?.stage===key,key,{timeout:20000});
  const scene=key=>page.waitForFunction(key=>document.body.dataset.storyScene===key,key,{timeout:20000});
  const uncovered=()=>page.waitForFunction(()=>!document.getElementById('story-fade').classList.contains('on')&&getComputedStyle(document.getElementById('story-fade')).opacity<.05,null,{timeout:20000});
  const talk=async()=>{for(let i=0;i<12&&await page.evaluate(()=>!!NecromancerV2.world.adventure?.dialogue);i++){await page.locator('#campaign-panel button').first().click();await page.waitForTimeout(30);}};
  const kill=(filter='true')=>page.evaluate(filter=>{const w=NecromancerV2.world,keep=new Function('a','return '+filter);for(const a of w.actors)if(a.prologueEnemy&&keep(a))a.hp=0;},filter);
  const go=(x,y)=>page.evaluate(([x,y])=>{Object.assign(NecromancerV2.world.player,{x,y});NecromancerV2.campaign.update();},[x,y]);
  const interact=()=>page.evaluate(()=>NecromancerV2.campaign.interact());
  const tough=()=>page.evaluate(()=>{const p=NecromancerV2.world.player;p.hp=p.maxHp=100000;});
  await page.goto(pathToFileURL(process.env.NR_TEST_DISTRIBUTION||path.resolve(__dirname,'../necromancer-3d.html')).href);await ready();
  await page.evaluate(()=>{const n=NecromancerV2;n.session.save.character.name='Araci';n.session.save.campaign.started=true;n.session.save.campaign.prologue={stage:'ambush',introRead:true};n.campaign.start();});
  await stage('ambush');await tough();await page.waitForTimeout(600);
  // Sonda por quadro: revisão da cena, opacidade da cobertura e intervalo entre quadros.
  await page.evaluate(()=>{const w=NecromancerV2.world,cover=document.getElementById('story-fade'),log=window.storyProbe=[];let rev=w.sceneryRevision,last=performance.now();const tick=now=>{const opacity=+getComputedStyle(cover).opacity;if(w.sceneryRevision!==rev){log.push({kind:'rebuild',opacity,stage:NecromancerV2.session.save.campaign.prologue?.stage||'world'});rev=w.sceneryRevision;}log.push({kind:'frame',gap:now-last,opacity,at:Math.round(now),stage:NecromancerV2.session.save.campaign.prologue?.stage||'world',scene:document.body.dataset.storyScene,mark:window.storyMark||''});last=now;requestAnimationFrame(tick);};requestAnimationFrame(tick);});
  // 1. Fim da emboscada: respiro em câmera lenta e conversa no mesmo mapa.
  const revision=await page.evaluate(()=>NecromancerV2.world.sceneryRevision);
  await kill();await scene('beat');
  const beat=await page.evaluate(()=>({scale:NecromancerV2.world.adventure.timeScale,hud:+getComputedStyle(document.getElementById('hud')).opacity,stage:NecromancerV2.session.save.campaign.prologue.stage}));
  assert.ok(beat.scale<1);assert.equal(beat.stage,'ambush');await shot('1-ambush-beat',450);
  await stage('farewell');await page.waitForSelector('#campaign-panel[data-view="travel-dialogue"]');await shot('2-farewell-dialogue',500);
  assert.equal(await page.evaluate(()=>NecromancerV2.world.sceneryRevision),revision,'a conversa da despedida não remonta o mapa');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('hud')).opacity),'0');
  // 2. Despedida → queda: escurece antes de remontar.
  await talk();await page.waitForSelector('#story-fade.on');await shot('3-fade-to-fall',300);await stage('fall');await uncovered();
  await stage('cave');await uncovered();await page.waitForSelector('#campaign-panel[data-view="travel-dialogue"]');await shot('4-cave-arrival',400);await talk();
  // 3. Caverna → Caminho de Jacarandá, com título do trecho.
  await page.evaluate(()=>{const p=NecromancerV2.session.save.campaign.prologue;p.caveHeard=true;p.clue=true;p.caveCleared=true;for(const a of NecromancerV2.world.actors)if(a.prologueEnemy)a.hp=0;});
  await go(0,-22);assert.ok(await interact());await talk();await page.waitForSelector('#story-fade.on');
  assert.equal(await page.locator('#story-fade').innerText(),'Caminho de Jacarandá');await shot('5-fade-trail-title',450);
  await stage('trail');await uncovered();await tough();
  const trail=await page.evaluate(()=>{const w=NecromancerV2.world,b=w.arena.bounds;return {w:b.maxX-b.minX,h:b.maxY-b.minY,player:{x:w.player.x,y:w.player.y},foes:w.actors.filter(a=>a.prologueEnemy).length,trees:w.arena.solids.filter(s=>['oak','pine'].includes(s.look)||s.look==='kit-prop').length};});
  assert.ok(trail.h>=200&&trail.w>=100);assert.ok(trail.foes>=8);await shot('6-trail-cave-mouth',600);
  await go(-18,54);await shot('7-trail-wolves',700);await kill('Math.hypot(a.home.x+25,a.home.y-47)<14');
  await go(2,18);await shot('8-trail-bridge',500);
  await go(14,-20);await shot('9-trail-cart',700);await kill('Math.hypot(a.home.x-22,a.home.y+27)<14');
  await go(17,-23);assert.ok(await interact());await page.waitForSelector('#campaign-panel[data-view="travel-dialogue"]');await shot('10-trail-satchel',600);
  await page.setViewportSize({width:390,height:844});await shot('11-trail-satchel-mobile',400);assert.equal(await page.evaluate(()=>document.querySelector('#campaign-panel').scrollWidth<=innerWidth),true);await page.setViewportSize({width:1440,height:900});await talk();
  assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.prologue.stage),'trail');
  // Borda: mata continua além do limite, em chão claro, qualidade baixa e com horda.
  await page.evaluate(async()=>{const n=NecromancerV2;const {useProfile}=await import('v2-session'),{TEST_PROFILE}=await import('v2-horde');useProfile(n.session,TEST_PROFILE);n.equip(1,'skeleton');n.equip(2,'zombie');n.view.ground(true);n.view.quality(true);});
  await go(-44,-40);await shot('12-trail-edge-light-low-horde',900);
  await page.evaluate(()=>{NecromancerV2.view.ground(false);NecromancerV2.view.quality(false);});await shot('13-trail-edge-dark',600);
  // 4. Tomás: só os perseguidores próximos bloqueiam a conversa.
  await go(0,-74);await shot('14-trail-messenger-chase',600);assert.equal(await interact(),false);
  await kill('Math.hypot(a.home.x,a.home.y+82)<16');await page.waitForTimeout(200);await go(0,-80);assert.ok(await interact());await shot('15-trail-messenger',500);await talk();
  await page.waitForSelector('#story-fade.on');await stage('defense');await uncovered();await tough();await shot('16-defense',500);
  // 5. Fim da defesa: respiro, reencontro no mesmo mapa e saída para Jacarandá com a tela escura.
  await kill();await scene('beat');await shot('17-defense-beat',400);await stage('reunion');await shot('18-reunion',500);
  await talk();await page.waitForSelector('#story-fade.on');await page.waitForFunction(()=>NecromancerV2.world.adventure?.kind==='campaign-world');await uncovered();await shot('19-jacaranda',500);
  const probe=await page.evaluate(()=>window.storyProbe);
  const hitches=probe.filter(e=>e.kind==='frame'&&e.gap>250).map(({gap,opacity,stage,scene,mark})=>({gap:Math.round(gap),opacity:+opacity.toFixed(2),stage,scene,mark}));
  const rebuilds=probe.filter(e=>e.kind==='rebuild'),exposed=rebuilds.filter(e=>e.opacity<.95);
  const frames=probe.filter(e=>e.kind==='frame'),visibleGap=Math.max(...frames.filter(e=>e.opacity<.5).map(e=>e.gap)),coveredGap=Math.max(...frames.filter(e=>e.opacity>=.5).map(e=>e.gap));
  // A troca de qualidade e o carregamento da horda pedidos pelo teste (captura 12) não são transição de cena.
  const storyHitches=hitches.filter(h=>h.opacity<.5&&h.gap>400&&!h.mark.includes('light-low'));
  assert.ok(rebuilds.length>=5,'trocas de mapa registradas');assert.deepEqual(storyHitches,[],'nenhum quadro longo com a cena descoberta');assert.deepEqual(exposed,[],'toda remontagem acontece com a tela coberta');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  const result={errors,remote,trail,beat,rebuilds,hitches,longestVisibleFrameMs:Math.round(visibleGap),longestCoveredFrameMs:Math.round(coveredGap),checks:['respiro em câmera lenta no fim da emboscada e da defesa','conversa da despedida e do reencontro sem remontar o mapa','faixas de cena e HUD recolhido','queda, caverna, trilha, defesa e Jacarandá remontados com a tela escura','título do trecho na passagem para a trilha','trilha de 100 × 204 u com lobos, vigias, bolsa opcional e Tomás','Tomás liberado só pelos perseguidores próximos','borda em chão claro/qualidade baixa/horda e escuro','390 px','offline'],limitations:['encerramentos de combate com HP injetado','tempo de quadro medido em Edge headless; varia por máquina','sem validação de dificuldade']};
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));
  console.log('Transições do prólogo conferidas no Edge',JSON.stringify({rebuilds:rebuilds.length,longestVisibleFrameMs:result.longestVisibleFrameMs,longestCoveredFrameMs:result.longestCoveredFrameMs}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
