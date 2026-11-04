'use strict';
// Corrida do lobo (Cão de Cripta) no HTML empacotado: tamanho, clipe, pata de apoio parada no chão e leitura em grupo. Evidências em review/v2/wolf-run/.
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const out=path.resolve(__dirname,'../../review/v2/wolf-run');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await legacy.click(page,'#enter');
 // Lobos correm atrás de um alvo distante; a simulação real avança quadro a quadro e cada pata é medida no mundo.
 const start=count=>page.evaluate(async count=>{
  const n=NecromancerV2,w=n.world,{spawnEnemy}=await import('v2-enemies');
  w.actors=[w.player];Object.assign(w.player,{x:0,y:12,hp:1e7,maxHp:1e7,hpRegen:0});w.effects=[];w.projectiles=[];w.hostileShots=[];w.hostileZones=[];w.arena={...w.arena,solids:[]};w.paused=false;
  window.__wolves=[];for(let i=0;i<count;i++){const e=spawnEnemy(w,4,(i-(count-1)/2)*2.2,-8-(i%2)*1.5);e.abilityCd=1e9;e.howlCd=1e9;e.atkTimer=1e9;window.__wolves.push(e.id);}
 },count);
 const advance=frames=>page.evaluate(async frames=>{
  const n=NecromancerV2,w=n.world,{step}=await import('v2-model');
  for(let i=0;i<frames;i++){step(w,1/60);n.view.render(w,1/60);}
  w.paused=true;n.view.render(w,0);w.paused=false;
 },frames);
 await start(1);
 const measure=await page.evaluate(async()=>{
  const n=NecromancerV2,w=n.world,{step}=await import('v2-model'),view=n.view,id=window.__wolves[0],o=view.actors.get(id),e=w.actors.find(a=>a.id===id);
  const feet={};o.body.traverse(b=>{if(b.isBone){const m=b.name.match(/(0_Left_Limb_1|0_Right_Limb_2|1_Left_Limb_3|1_Right_Limb_3)$/);if(m)feet[m[1]]=b;}});
  n.view.render(w,1/60);const size=[];let height=0;o.body.traverse(b=>{if(b.isSkinnedMesh&&!height){height=o.body.scale.x*.465;}});
  const speeds={},last={},states={},low=.13;for(let i=0;i<110;i++){step(w,1/60);view.render(w,1/60);states[o.state]=(states[o.state]||0)+1;
   for(const [k,b]of Object.entries(feet)){b.updateWorldMatrix(true,false);const p={x:b.matrixWorld.elements[12],y:b.matrixWorld.elements[13],z:b.matrixWorld.elements[14]};
    if(last[k]&&p.y<low&&last[k].y<low)(speeds[k]||=[]).push(Math.hypot(p.x-last[k].x,p.z-last[k].z)*60);last[k]=p;}}
  const med=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];
  return {scale:o.body.scale.x,height,speed:e.spd,asset:view.assets.cryptHound,clips:view.models.cryptHound.animations.map(c=>[c.name,+c.duration.toFixed(3)]),states,distance:e.walkDistance,feet:Object.keys(feet).length,stanceFootSpeed:Object.fromEntries(Object.entries(speeds).map(([k,v])=>[k,{samples:v.length,median:+med(v).toFixed(2)}]))};
 });
 assert.equal(measure.feet,4,JSON.stringify(measure));
 assert.ok(Math.abs(measure.height-1.0925)<.01,'altura '+measure.height);
 assert.equal(measure.asset.stride,2.25);
 assert.ok(Math.abs(measure.speed-5.888)<.01,'velocidade '+measure.speed);
 assert.ok(measure.states.walk>60,JSON.stringify(measure.states));
 // Uma pata de apoio arrastada pelo corpo se moveria a ~5,9 u/s; parada no chão, fica bem abaixo disso.
 for(const [k,v]of Object.entries(measure.stanceFootSpeed))assert.ok(v.median<1.5,`${k} desliza: ${JSON.stringify(v)}`);
 // Sequência de corrida em quadros reais do jogo, recortada ao redor do lobo.
 const frame=async(file,clipSize=340)=>{const c=await page.evaluate(()=>{const n=NecromancerV2,w=n.world,e=w.actors.find(a=>a.id===window.__wolves[0]);return n.view.screen(e.x,e.y,w);});await page.screenshot({path:path.join(out,file),clip:{x:Math.max(0,c.x-clipSize/2),y:Math.max(0,c.y-clipSize/2),width:clipSize,height:clipSize}});};
 await legacy.select(page,'#ground','dark');
 await start(1);await advance(60);
 for(let i=0;i<6;i++){await advance(4);await frame(`run-dark-${i}.png`);}
 await legacy.select(page,'#ground','light');await legacy.select(page,'#quality','low');
 await start(1);await advance(60);
 for(let i=0;i<3;i++){await advance(6);await frame(`run-light-low-${i}.png`);}
 await legacy.select(page,'#ground','dark');
 await start(8);await advance(90);await page.screenshot({path:path.join(out,'pack-dark-low.png')});
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({measure,errors,remote},null,2));
 console.log('Corrida do lobo no HTML empacotado: OK.',JSON.stringify(measure.stanceFootSpeed),JSON.stringify(measure.states));
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
