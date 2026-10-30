'use strict';
// Pancada do Orc, Saraivada dos arqueiros e Uivo do Cão no HTML empacotado. Evidências em review/v2/special-attacks/.
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const out=path.resolve(__dirname,'../../review/v2/cut-leap-howl');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await legacy.click(page,'#enter');
 // Cena: um especial por vez, jogador parado; avança a simulação real até o instante de cada captura e pausa.
 const scene=(kind)=>page.evaluate(async kind=>{
  const n=NecromancerV2,w=n.world,{spawnEnemy,SLAM,RAIN,HOWL}=await import('v2-enemies'),{step}=await import('v2-model');
  w.actors=[w.player];Object.assign(w.player,{x:0,y:4,hp:1e7,maxHp:1e7,hpRegen:0});w.effects=[];w.projectiles=[];w.hostileShots=[];w.hostileZones=[];w.arena={...w.arena,solids:[]};w.paused=false;
  const run=t=>{for(let i=0;i<Math.round(t*60);i++)step(w,1/60);};const info={};
  if(kind==='slam'){const e=spawnEnemy(w,10,0,0);e.abilityCd=0;run(.7);info.warn=w.effects.some(f=>f.enemyWarning===e.id&&f.radius===SLAM.radius);info.pose=e.pose?.anim;}
  if(kind==='cut'){const e=spawnEnemy(w,0,0,2);e.abilityCd=0;e.atkTimer=99;run(1);info.warn=w.effects.some(f=>f.enemyWarning===e.id&&f.arc);info.pose=e.pose?.anim;}
  if(kind==='leap'){const e=spawnEnemy(w,10,0,-4);e.abilityCd=0;run(SLAM.wind+.3);info.height=e.jumpZ;}
  if(kind==='impact'){const e=spawnEnemy(w,10,0,-4);e.abilityCd=0;run(SLAM.wind+SLAM.flight+.1);info.fx=w.effects.some(f=>f.fx==='groundBreak');}
  if(kind==='rain'){const e=spawnEnemy(w,1,0,-4);e.atkTimer=1e9;e.abilityCd=1e9;e.rainCd=0;run(RAIN.wind+.55);info.zone=w.hostileZones.length;info.fx=w.effects.some(f=>f.fx==='arrowRain');info.hp=w.player.hp<1e7;}
  if(kind==='howl'){const e=spawnEnemy(w,4,0,-3);e.howlCd=0;run(HOWL.wind-.2);info.preWolves=w.actors.filter(a=>a.typeIndex===4).length;run(.35);info.wolves=w.actors.filter(a=>a.typeIndex===4).length;info.pose=e.pose?.anim;}
  w.paused=true;n.view.render(w,0);info.clips=n.view.models.cryptHound.animations.map(c=>c.name);return info;
 },kind);
 const results={};
 for(const kind of ['cut','leap','impact','slam','rain','howl']){
  results[kind]=await scene(kind);
  for(const ground of ['dark','light']){await legacy.select(page,'#ground',ground);await legacy.select(page,'#quality','low');await page.evaluate(()=>NecromancerV2.view.render(NecromancerV2.world,0));await page.screenshot({path:path.join(out,`${kind}-${ground}-low.png`)});}
 }
 assert.ok(results.slam.warn&&results.slam.pose==='smash_windup',JSON.stringify(results.slam));
 assert.ok(results.rain.zone>=1&&results.rain.fx&&!results.rain.hp,JSON.stringify(results.rain));
 assert.ok(results.howl.preWolves===1&&results.howl.wolves===3&&results.howl.pose==='howl'&&results.howl.clips.includes('howl'),JSON.stringify(results.howl));
 assert.ok(results.cut.warn);assert.ok(results.leap.height>0);assert.ok(results.impact.fx);
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({results,errors,remote},null,2));
 console.log('Pancada do Orc, Saraivada e Uivo no HTML empacotado: OK.');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
