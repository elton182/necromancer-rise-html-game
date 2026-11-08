'use strict';
// Esquiva no jogo: necromante, guerreiro e Lich tocam o próprio clipe `dodge`, sem mudar distância, duração ou proteção. Grava pranchas em review/v2/dodge/.
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const MODELS=['necromancer','warrior','lich'],PROGRESS=[0,.08,.16,.28,.4,.52,.64,.76,.88,1];
(async()=>{const out=path.resolve(__dirname,'../../review/v2/dodge');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await legacy.click(page,'#enter');
 await page.addStyleTag({content:'#pause-dialog{display:none!important}#pause-dialog::backdrop{background:transparent!important;backdrop-filter:none!important}'});
 await page.evaluate(()=>{const n=NecromancerV2;n.go('training');const w=n.world;n.pause(true);w.actors=[w.player];w.effects=[];w.projectiles=[];w.hostileShots=[];w.hostileZones=[];w.arena={...w.arena,solids:[],bounds:{minX:-30,maxX:30,minY:-30,maxY:30}};w.player.x=0;w.player.y=0;w.player.hp=w.player.maxHp;});
 // Esquiva real em cada modelo: distância e duração da regra, pose do clipe certo durante toda a janela e proteção contra dano.
 const live=[];for(const model of MODELS){
  const result=await page.evaluate(async model=>{const n=NecromancerV2,w=n.world,{dealDamage}=await import('v2-combat');
   w.player.x=0;w.player.y=0;w.dash.cooldown=0;w.dash.remaining=0;w.player.model=model;w.aim={x:0,y:-8};w.player.angle=Math.PI;if(w.lich&&model==='lich'){w.lich.form='lich';w.lich.souls=99;w.lich.invuln=false;}
   w.paused=false;await new Promise(requestAnimationFrame);
   const ok=n.dash({x:1,y:0});if(!ok)return {model,ok,scene:n.session.scene,paused:w.paused,cooldown:w.dash.cooldown,root:w.player.rootTime,hp:w.player.hp,adventure:w.adventure?.kind};
   const window=w.dash.remaining,states=new Set(),clips=new Set();let first=null,max=0,protectedHit=null;
   while(w.dash.remaining>0){await new Promise(requestAnimationFrame);if(w.dash.remaining<=0)break;const o=n.view.actors.get(w.player.id);states.add(o.state);clips.add(Object.keys(o.actions).includes('dodge'));first??=o.root.rotation.y;max=Math.max(max,Math.abs(Math.atan2(Math.sin(o.root.rotation.y-w.player.angle),Math.cos(o.root.rotation.y-w.player.angle))));if(protectedHit===null&&w.dash.remaining<.3){const before=w.player.hp;protectedHit=dealDamage(w,w.player,50,null,'teste').blocked===true&&w.player.hp===before;}}
   const distance=Math.hypot(w.player.x-w.dash.origin.x,w.player.y-w.dash.origin.y);
   await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
   const o=n.view.actors.get(w.player.id),after=o.state;n.pause(true);if(w.lich&&model==='lich'){w.lich.form='none';w.lich.invuln=false;}
   return {model,ok,states:[...states],window,distance,protectedHit,after,hasClip:[...clips][0],yawLag:max};
  },model);
  live.push(result);assert.equal(result.ok,true,model+': a esquiva não começou '+JSON.stringify(result));assert.equal(result.hasClip,true,model+' sem o clipe dodge');assert.deepEqual(result.states,['dodge'],model+': clipe durante a esquiva');
  assert.ok(Math.abs(result.distance-4.5)<.35,model+': distância '+result.distance);assert.equal(result.window,.5,model+': duração');assert.equal(result.protectedHit,true,model+': proteção durante a esquiva');assert.notEqual(result.after,'dodge',model+': o clipe precisa terminar');
 }
 // Pranchas: pose congelada em cada fase, na câmera do jogo, com a direção alternando entre os lados que a câmera mais mostra.
 const shot=()=>page.screenshot({clip:{x:400,y:200,width:400,height:400}}).then(b=>b.toString('base64'));
 const sheets={};for(const model of MODELS){const frames=[];
  await page.evaluate(model=>{const n=NecromancerV2,w=n.world;n.view.zoom(-700);w.player.x=0;w.player.y=0;w.player.model=model;w.player.angle=Math.PI/2;w.dash.dx=1;w.dash.dy=0;w.dash.origin={x:-3,y:0};w.dash.remaining=.25;n.view.render(w,0);},model);
  for(const progress of PROGRESS){const bones=await page.evaluate(([progress])=>{const n=NecromancerV2,w=n.world;w.dash.remaining=Math.max(1e-6,(1-progress)*.5);w.player.angle=Math.PI/2;n.view.render(w,0);const o=n.view.actors.get(w.player.id),list=[];o.body.updateMatrixWorld(true);o.body.traverse(x=>{if(x.isBone)list.push(...x.matrixWorld.elements);});return {state:o.state,sum:list.reduce((s,v)=>s+Math.abs(v),0),finite:list.every(Number.isFinite)};},[progress]);assert.equal(bones.state,'dodge');assert.ok(bones.finite);frames.push({progress,image:await shot(),sum:bones.sum});}
  assert.ok(new Set(frames.map(f=>f.sum.toFixed(2))).size>=PROGRESS.length-2,model+': clipe sem movimento');sheets[model]=frames;}
 // Leitura: fundo claro e escuro, qualidade baixa e com horda.
 for(const ground of ['dark','light'])for(const model of MODELS){await legacy.select(page,'#ground',ground);await legacy.select(page,'#quality','low');await page.evaluate(model=>{const n=NecromancerV2,w=n.world;w.player.model=model;w.dash.remaining=.25;n.view.render(w,0);},model);await page.screenshot({path:path.join(out,`${ground}-low-${model}.png`)});}
 await page.evaluate(async()=>{const n=NecromancerV2,{createWorld,step}=await import('v2-model');Object.assign(n.world,createWorld({horde:32,encounterWave:13}));const w=n.world;w.player.hp=10000;w.player.maxHp=10000;for(let i=0;i<120;i++)step(w,1/60);w.player.model='warrior';w.paused=true;Object.assign(w.dash,{remaining:.25,dx:1,dy:0,origin:{x:w.player.x-2,y:w.player.y}});w.player.angle=Math.PI/2;n.view.render(w,0);});await page.screenshot({path:path.join(out,'group-horde-light-low.png')});
 const sheet=await browser.newPage({viewport:{width:1500,height:300}});
 for(const model of MODELS){await sheet.setContent(`<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(5,300px);gap:0;font:15px sans-serif;color:#fff">${sheets[model].map(f=>`<div style="position:relative"><img width=300 height=300 src="data:image/png;base64,${f.image}"><span style="position:absolute;left:6px;top:4px">${Math.round(f.progress*100)}%</span></div>`).join('')}</body>`);await sheet.setViewportSize({width:1500,height:600});await sheet.waitForFunction(()=>[...document.images].every(i=>i.complete));await sheet.screenshot({path:path.join(out,`sheet-${model}.png`)});}
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({live,errors,remote,checks:['clipe dodge em cada modelo','distância, duração e proteção da regra','pranchas por fase','fundos claro e escuro em qualidade baixa','grupo com horda']},null,2));console.log(JSON.stringify(live,null,1));console.log('Esquiva dos três personagens OK.');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
