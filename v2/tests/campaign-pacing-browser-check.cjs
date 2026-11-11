'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const dir=path.resolve(__dirname,'../../review/v2/campaign-pacing');fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
 const shot=async name=>{await page.waitForTimeout(200);await page.screenshot({path:path.join(dir,name+'.png')});};
 await page.evaluate(()=>{const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',smith:'found',lumber:'done',passengerMissing:true};n.campaign.start();Object.assign(n.world.player,{x:60,y:73});n.campaign.update();});
 const bruno=await page.evaluate(()=>{const a=NecromancerV2.world.actors.find(a=>a.key==='smith');return {x:a.x,y:a.y,name:a.name};});assert.deepEqual({x:bruno.x,y:bruno.y},{x:52,y:71});await page.locator('.service-label').filter({hasText:'Bruno, o ferreiro'}).waitFor();await shot('bruno-front-of-forge');
 await page.evaluate(()=>{const n=NecromancerV2;Object.assign(n.world.player,{x:52.8,y:71});n.campaign.interact();n.campaign.update();});await page.getByRole('button',{name:/Reacender a forja/}).click();assert.equal(await page.evaluate(()=>NecromancerV2.session.save.campaign.world.smith),'done');
 await page.evaluate(()=>{const n=NecromancerV2;Object.assign(n.world.player,{x:60,y:73});n.view.ground(true);n.view.quality('low');});await shot('bruno-light-low');await page.evaluate(()=>NecromancerV2.view.ground(false));await shot('bruno-dark-low');
 await page.evaluate(()=>{const n=NecromancerV2,c=n.session.save.campaign;c.prologue={stage:'trail',introRead:true};n.campaign.start();Object.assign(n.world.player,{hp:100000,maxHp:100000});n.world.paused=true;n.campaign.update();window.pacingSeen=new Set();window.pacingContacts=[];window.pacingStart=n.world.player.walkDistance;});
 const walk=async(x,y)=>page.evaluate(async([x,y])=>{
  const n=NecromancerV2,s=n.session,w=n.world,{stepSession,castSession}=await import('v2-session');let reached=false;
  for(let i=0;i<900;i++){
   const dx=x-w.player.x,dy=y-w.player.y,d=Math.hypot(dx,dy);if(d<.7){reached=true;break;}
   const e=w.actors.filter(a=>a.prologueEnemy&&a.hp>0).sort((a,b)=>Math.hypot(a.x-w.player.x,a.y-w.player.y)-Math.hypot(b.x-w.player.x,b.y-w.player.y))[0];
   w.paused=false;if(e&&Math.hypot(e.x-w.player.x,e.y-w.player.y)<15){w.aim={x:e.x,y:e.y};castSession(s);}
   stepSession(s,.05,{x:(dx-dy)/d/Math.SQRT2,y:(dx+dy)/d/Math.SQRT2});
   for(const a of w.actors)if(a.prologueEnemy&&a.alert&&!window.pacingSeen.has(a.id)){window.pacingSeen.add(a.id);window.pacingContacts.push({x:a.home.x,y:a.home.y,distance:+(w.player.walkDistance-window.pacingStart).toFixed(1)});}
  }
  w.paused=true;n.campaign.update();return {reached,x:w.player.x,y:w.player.y,distance:w.player.walkDistance-window.pacingStart};
 },[x,y]);
 for(const [name,points] of [['early',[[0,80],[-15,67],[-23,52]]],['bridge',[[-22,37],[-10,24],[0,17],[0,7]]],['cart',[[10,-3],[19,-14],[22,-28]]],['lower',[[15,-43],[3,-57],[-3,-70],[0,-82]]]]){
  for(const p of points){const moved=await walk(...p);assert.equal(moved.reached,true,name+' rota atravessável: '+JSON.stringify(moved));}await shot('trail-'+name);
 }
 const contacts=await page.evaluate(()=>window.pacingContacts);assert.ok(contacts.some(c=>c.y>65));assert.ok(contacts.some(c=>c.y>=0&&c.y<12));assert.ok(contacts.some(c=>c.y<-40&&c.y>-60));assert.ok(contacts[0].distance<30);
 await page.evaluate(()=>{const n=NecromancerV2;n.session.save.campaign.prologue={stage:'cave',introRead:true,caveHeard:true};n.campaign.start();});
 for(let i=0;i<20&&await page.evaluate(()=>!!NecromancerV2.world.adventure.dialogue);i++)await page.locator('#campaign-panel button').first().click();
 const cave=await page.evaluate(async()=>{
  const n=NecromancerV2,w=n.world,{tickAdventure}=await import('v2-campaign'),all=w.adventure.groups.map(g=>({id:g.id,count:g.count,waves:g.waves,respawn:g.respawn})),g=w.adventure.groups.find(g=>g.id==='opening-enemy-4');
  w.adventure.groups=[g];Object.assign(w.player,{x:g.x,y:g.y,hp:100000,maxHp:100000});w.paused=false;tickAdventure(n.session,.1);const count=()=>w.actors.filter(a=>a.worldGroup===g.id&&a.hp>0).length,first=count();
  for(const a of w.actors)if(a.worldGroup===g.id)a.hp=0;tickAdventure(n.session,.1);tickAdventure(n.session,9.1);const second=count();
  for(const a of w.actors)if(a.worldGroup===g.id)a.hp=0;tickAdventure(n.session,.1);w.player.x=0;w.player.y=165;tickAdventure(n.session,200);w.paused=true;n.campaign.update();return {groups:all,first,second,after:count(),state:g.state};
 });assert.ok(cave.groups.every(g=>g.waves<=2&&g.respawn===0));assert.equal(cave.groups.filter(g=>g.waves===2).length,2);assert.equal(cave.first,2);assert.equal(cave.second,2);assert.equal(cave.after,0);assert.equal(cave.state,'clear');await shot('cave-wave-limit');
 await page.evaluate(()=>{const n=NecromancerV2;n.session.save.campaign.prologue={stage:'done'};n.session.save.campaign.world={stage:'complete',smith:'done',lumber:'done',nilo:'fort',passengerMissing:true};n.campaign.start();Object.assign(n.world.player,{x:52.8,y:64});n.campaign.interact();n.campaign.update();});await shot('joao-revised-dialogue');await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Fechar conversa'}).scrollIntoViewIfNeeded();await shot('joao-mobile');
 await page.getByRole('button',{name:'Fechar conversa'}).click();await page.setViewportSize({width:1440,height:900});
 await page.evaluate(async()=>{const n=NecromancerV2,{useProfile}=await import('v2-session'),{TEST_PROFILE}=await import('v2-horde');useProfile(n.session,TEST_PROFILE);n.equip(1,'skeleton');n.equip(2,'zombie');Object.assign(n.world.player,{x:60,y:73});n.view.quality('low');n.view.ground(true);});await shot('bruno-horde-light-low');await page.evaluate(()=>NecromancerV2.view.ground(false));await shot('bruno-horde-dark-low');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);fs.writeFileSync(path.join(dir,'browser-result.json'),JSON.stringify({bruno,contacts,cave,errors,remote,limitations:['HP elevado para percorrer a trilha sem morte; caminhada, colisões e alertas reais','mortes e tempo acelerados para conferir o limite de ondas; não mede dificuldade por partida completa']},null,2));console.log('Ritmo da campanha e Bruno: OK');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
