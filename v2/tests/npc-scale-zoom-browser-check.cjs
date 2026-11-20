// Escala renderizada, marcadores e limites da roda no HTML offline; save isolado.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/npc-scale-zoom');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_EXECUTABLE_PATH?undefined:'msedge',executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,headless:true,args:['--use-angle=d3d11','--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  await page.locator('#loading-start').click();
  await page.waitForFunction(()=>!document.getElementById('loading'));
  await page.evaluate(async()=>{
   const n=NecromancerV2,T=await import('three'),render=n.view.renderer.render;
   n.view.renderer.render=function(scene,camera){if(n.view.actors.get(n.world.player.id)?.root.parent===scene)window.testCameraSpan=camera.top;return render.call(this,scene,camera);};
   const c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',questFlow:1,smith:'done',lumber:'done',passengerMissing:true,nilo:'fort',cleared:[]};n.campaign.start();
   const w=n.world;w.actors=w.actors.filter(a=>a.team!=='enemy');Object.assign(w.player,{x:54,y:67});w.paused=true;
   // Elenco junto ao jogador, sem alterar as fontes de posição da campanha.
   const ids=['npcJoao','npcMarta','npcHelena','npcGuard','npcMessenger','npcMayor','npcBruno','npcLili'];
   ids.forEach((model,i)=>w.actors.push({id:w.nextId++,key:'scale-'+model,model,name:model,showName:true,serviceTitle:'Escala',team:'neutral',x:47+i*2,y:63,radius:.35,hp:1,maxHp:1,animation:'idle',animationTime:0,actionId:0,visualScale:model==='npcLili'?.65:1}));
   window.measureNpcScale=()=>w.actors.filter(a=>a.key?.startsWith('scale-')).map(a=>{const o=n.view.actors.get(a.id),box=new T.Box3();o.root.updateMatrixWorld(true);o.body.traverse(m=>{if(m.isSkinnedMesh){m.skeleton.update();box.union(new T.Box3().setFromObject(m,true));}});return {model:a.model,height:box.max.y-box.min.y,target:o.height*o.root.scale.y,feet:box.min.y-o.root.position.y};});
   n.view.zoom(-99999);
  });
  await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>testCameraSpan),8);
  const cast=await page.evaluate(()=>measureNpcScale());
  for(const npc of cast){assert.ok(Math.abs(npc.height-npc.target)<.08,npc.model+': escala real acompanha referência');assert.ok(Math.abs(npc.feet)<.08,npc.model+': pés no chão');}
  const adult=cast.find(a=>a.model==='npcMayor'),child=cast.find(a=>a.model==='npcLili');assert.ok(adult.height>2.5&&adult.height<2.7);assert.ok(child.height/adult.height>.6&&child.height/adult.height<.7);
  await page.screenshot({path:path.join(dir,'cast-near-dark.png')});
  await page.evaluate(()=>{NecromancerV2.view.zoom(99999);});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>testCameraSpan),18);
  await page.screenshot({path:path.join(dir,'cast-far-dark.png')});
  await page.evaluate(async()=>{const n=NecromancerV2,{spawnMember}=await import('v2-horde');['zombie','skeleton','archer'].forEach((type,i)=>spawnMember(n.world,type,i));n.view.ground(true);n.view.quality(true);});await page.waitForTimeout(400);
  await page.screenshot({path:path.join(dir,'cast-far-light-low-horde.png')});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({cast,zoom:{near:8,far:18},errors},null,2));console.log('Escala dos NPCs e zoom: OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
