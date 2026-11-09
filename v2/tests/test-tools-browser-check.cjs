'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/test-tools');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
 await page.waitForFunction(()=>document.body.dataset.ready==='true'&&!document.getElementById('loading'),null,{timeout:90000});
 await page.evaluate(()=>{NecromancerV2.go('training');});
 await page.click('#open-test-tools');assert.equal(await page.evaluate(()=>NecromancerV2.world.paused),true);
 const level=await page.evaluate(()=>NecromancerV2.session.save.character.level);
 await page.click('[data-test-action="level-up"]');assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.level),level+1);
 await page.click('[data-test-action="level-down"]');assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.level),level);
 const gold=await page.evaluate(()=>NecromancerV2.session.save.character.gold);
 await page.click('[data-test-action="gold-up"]');assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.gold),gold+1000);
 await page.click('[data-test-action="gold-down"]');assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.gold),gold);
 await page.evaluate(()=>{NecromancerV2.world.player.hp=1;NecromancerV2.world.player.mp=0;});
 await page.click('[data-test-action="restore"]');assert.equal(await page.evaluate(()=>NecromancerV2.world.player.hp===NecromancerV2.world.player.maxHp&&NecromancerV2.world.player.mp===NecromancerV2.world.player.maxMp),true);
 await page.screenshot({path:path.join(dir,'desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(dir,'mobile.png')});
 assert.equal(await page.evaluate(()=>{const p=document.querySelector('[data-menu-panel="tests"]');return p.scrollWidth>p.clientWidth+1;}),false);
 await page.click('#close-reliquary');assert.equal(await page.evaluate(()=>NecromancerV2.world.paused),false);
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({ok:true,errors,remote},null,2));console.log('Painel de testes: cliques, pausa, desktop, celular e arquivo offline OK.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
