'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const dir=path.resolve(__dirname,'../../review/v2/map-horizon');fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
 await page.evaluate(()=>{const n=NecromancerV2;n.session.save.campaign.started=true;n.session.save.campaign.prologue={stage:'cave',introRead:true};n.campaign.start();});
 const maps=await page.evaluate(async()=>{const n=NecromancerV2;window.horizonMaps=[n.world.arena];for(const [module,fn] of [['forest','forestArena'],['village','villageArena'],['crypt','cryptArena'],['trail','trailArena'],['outpost','outpostArena']])window.horizonMaps.push((await import('v2-'+module+'-map'))[fn]());window.horizonMaps.push((await import('v2-expedition-map')).expeditionArena(1));return window.horizonMaps.map(a=>a.id);});
 const border=await page.evaluate(async()=>{const a=window.horizonMaps[1],original=JSON.stringify(a),{forestBorderTrees}=await import('v2-forest-border'),trees=forestBorderTrees(a),b=a.bounds;return {count:trees.length,unchanged:JSON.stringify(a)===original,outside:trees.every(t=>t.x<=b.minX-4||t.x>=b.maxX+4||t.y<=b.minY-4||t.y>=b.maxY+4),sides:[trees.some(t=>t.x<b.minX-60),trees.some(t=>t.x>b.maxX+60),trees.some(t=>t.y<b.minY-60),trees.some(t=>t.y>b.maxY+60)]};});
 assert.ok(border.count>1000);assert.equal(border.unchanged,true);assert.equal(border.outside,true);assert.ok(border.sides.every(Boolean));
 for(let index=0;index<maps.length;index++){
  const before=await page.evaluate(index=>{const n=NecromancerV2,a=window.horizonMaps[index];n.world.arena=a;n.world.sceneryRevision=(n.world.sceneryRevision||0)+1;n.world.adventure=null;n.world.actors=n.world.actors.filter(a=>a===n.world.player);n.world.paused=true;Object.assign(n.world.player,{x:a.bounds.minX+.5,y:a.bounds.maxY-.5});n.view.zoom(9999);n.view.render(n.world,0);document.querySelector('#campaign-panel').hidden=true;return JSON.stringify(a.bounds);},index);
  await page.waitForTimeout(250);await page.screenshot({path:path.join(dir,index+'-edge-dark.png')});
  await page.evaluate(()=>{NecromancerV2.view.ground(true);NecromancerV2.view.quality(true);});await page.waitForTimeout(120);await page.screenshot({path:path.join(dir,index+'-edge-light-low.png')});
  assert.equal(await page.evaluate(()=>JSON.stringify(NecromancerV2.world.arena.bounds)),before);
  await page.evaluate(()=>{NecromancerV2.view.ground(false);NecromancerV2.view.quality(false);});
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.screenshot({path:path.join(dir,'mobile.png')});assert.deepEqual(errors,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({errors,maps,checks:['limites preservados','borda com zoom máximo','fundo claro e escuro','qualidade baixa','390px']},null,2));console.log('Horizonte dos mapas: OK');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
