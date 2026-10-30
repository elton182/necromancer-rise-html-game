'use strict';
// Harpia no HTML empacotado: clipes de arremesso, penas 3D em voo e capturas nos dois fundos. Evidências em review/v2/harpy-feathers/.
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const out=path.resolve(__dirname,'../../review/v2/harpy-feathers');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await legacy.click(page,'#enter');
 const result=await page.evaluate(async()=>{
  const n=NecromancerV2,w=n.world,{spawnEnemy}=await import('v2-enemies'),{step}=await import('v2-model');
  w.actors=[w.player];Object.assign(w.player,{x:0,y:4,hp:1e7,maxHp:1e7,hpRegen:0});w.effects=[];w.projectiles=[];w.hostileShots=[];w.hostileZones=[];w.arena={...w.arena,solids:[]};w.paused=false;
  const e=spawnEnemy(w,7,0,-1,{wave:1});e.abilityCd=0;const clips=n.view.models.enemyGriffin.animations.map(c=>c.name);
  const seen={windup:false,throw:false,feathers:0,meshes:0};
  const frame=()=>{n.view.render(w,0);};
  for(let i=0;i<150;i++){step(w,1/60);if(e.pose?.anim==='feather_windup')seen.windup=true;if(e.pose?.anim==='feather')seen.throw=true;const f=w.hostileShots.filter(s=>s.kind==='feather').length;seen.feathers=Math.max(seen.feathers,f);}
  // Captura 1: penas em voo (rajada recém-lançada).
  const shots=()=>w.hostileShots.filter(s=>s.kind==='feather').length;
  for(let i=0;i<400&&!shots();i++)step(w,1/60);for(let i=0;i<10;i++)step(w,1/60);frame();seen.meshes=n.view.featherShots?.size??-1;
  w.paused=true;return {clips,seen,shots:shots()};
 });
 assert.ok(result.clips.includes('feather_windup')&&result.clips.includes('feather'));
 assert.ok(result.seen.windup&&result.seen.throw&&result.seen.feathers===3,JSON.stringify(result.seen));
 assert.ok(result.shots>0,'penas em voo na captura');
 for(const ground of ['dark','light']){await legacy.select(page,'#ground',ground);await legacy.select(page,'#quality','low');await page.evaluate(()=>NecromancerV2.view.render(NecromancerV2.world,0));await page.screenshot({path:path.join(out,`feathers-${ground}-low.png`)});}
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({...result,errors,remote},null,2));
 console.log('Harpia: clipes de arremesso, três penas em voo e render offline OK.');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
