'use strict';
// Verifica a IA tática dos inimigos no HTML empacotado: papéis, flanco, leque de atiradores e capturas nos dois fundos.
// Requer Playwright (NODE_PATH) e Edge, como os demais checks. Evidências em review/v2/enemy-tactics/.
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const out=path.resolve(__dirname,'../../review/v2/enemy-tactics');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await legacy.click(page,'#enter');
 // Grupo misto vindo do norte: 4 guerreiros, 2 ladrões, 2 arqueiros e 1 mago, contra o jogador parado.
 const result=await page.evaluate(async()=>{
  const n=NecromancerV2,w=n.world,{spawnEnemy}=await import('v2-enemies'),{step}=await import('v2-model');
  n.pause(false);w.actors=[w.player];Object.assign(w.player,{x:0,y:4,hp:1e7,maxHp:1e7,hpRegen:0});w.effects=[];w.projectiles=[];w.hostileShots=[];w.hostileZones=[];w.arena={...w.arena,solids:[]};w.paused=false;
  const list=[[0,-4,-4],[0,-1,-5],[0,2,-5],[0,5,-4],[6,-5,-7],[6,5,-7],[1,-3,-9],[1,3,-9],[3,0,-11]];
  const es=list.map(([i,x,y])=>spawnEnemy(w,i,x,y+4,{wave:1})),p=w.player;
  const d=e=>Math.hypot(e.x-p.x,e.y-p.y),ang=e=>Math.atan2(e.y-p.y,e.x-p.x),wrap=a=>{a=(a+Math.PI)%(Math.PI*2);if(a<0)a+=Math.PI*2;return a-Math.PI;};
  const front=-Math.PI/2,first={},peak={melee:0},t0=w.time;
  for(let i=0;i<900;i++){step(w,1/60);for(const e of es.slice(4,6))if(!first[e.id]&&d(e)<=1.9)first[e.id]=Math.abs(wrap(ang(e)-front));if(i>400)peak.melee=Math.max(peak.melee,es.slice(0,4).filter(e=>d(e)<=2.4).length);}
  w.paused=true;n.view.render(w,0);
  return {first:Object.values(first),peak:peak.melee,shooters:es.slice(6).map(e=>({name:e.type.name,d:d(e),a:ang(e),mode:e.tac?.mode})),hp:p.hp<1e7};
 });
 assert.equal(result.first.length,2,'os dois ladrões alcançam o jogador');
 assert.ok(result.first.every(a=>a>1.9),'ladrões chegam por trás: '+result.first);
 assert.ok(result.peak<=3,'no máximo três atacantes da frente: '+result.peak);
 assert.ok(result.shooters.every(s=>s.d>3&&s.d<8),'atiradores à distância: '+JSON.stringify(result.shooters));
 assert.ok(result.hp);
 for(const ground of ['dark','light']){await legacy.select(page,'#ground',ground);await legacy.select(page,'#quality','low');await page.evaluate(()=>NecromancerV2.view.render(NecromancerV2.world,0));await page.screenshot({path:path.join(out,`tactics-${ground}-low.png`)});}
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({...result,errors,remote},null,2));
 console.log('IA tática no HTML empacotado: flanco por trás, vagas de ataque e leque de atiradores OK.');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
