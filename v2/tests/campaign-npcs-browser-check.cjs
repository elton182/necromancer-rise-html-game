// GLBs reais no HTML offline, animações e elenco da campanha; armazenamento isolado.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/campaign-npcs');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  await page.locator('#loading-start').click();await page.waitForFunction(()=>!document.getElementById('loading'));
  const report=await page.evaluate(async()=>{
   const THREE=await import('three'),{clone}=await import('skeleton-utils'),n=NecromancerV2;
   const ids=['npcJoao','npcMarta','npcHelena','npcGuard','npcMessenger','npcMayor'];
   const scene=new THREE.Scene();scene.background=new THREE.Color('#292c34');
   const camera=new THREE.OrthographicCamera(-5.8,5.8,3.6,-3.6,.1,100);camera.position.set(0,3,14);camera.lookAt(0,1.5,0);
   scene.add(new THREE.HemisphereLight(0xffffff,0x69675e,2.3));const sun=new THREE.DirectionalLight(0xffe5c0,3);sun.position.set(-4,7,6);scene.add(sun);
   const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1440,900);renderer.setPixelRatio(1);renderer.domElement.style.cssText='position:fixed;inset:0;z-index:99999';document.body.append(renderer.domElement);
   const roots=[],mixers=[],report=[];
   ids.forEach((id,i)=>{
    const asset=n.view.models[id],root=clone(asset.scene);root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root,true),height=bounds.max.y-bounds.min.y;
    root.scale.setScalar(2.25/height);root.position.set((i%3-1)*3.2,i<3?1.85:-1.8,0);root.rotation.y=.35;
    scene.add(root);roots.push(root);const mixer=new THREE.AnimationMixer(root);mixers.push(mixer);
    const clips=asset.animations.map(a=>a.name),frames={};
    for(const clip of asset.animations){mixer.stopAllAction();mixer.clipAction(clip).play();mixer.setTime(clip.duration*.45);root.updateMatrixWorld(true);let finite=true;root.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();finite&&=Array.from(o.skeleton.boneMatrices).every(Number.isFinite);}});frames[clip.name]=finite;}
    mixer.stopAllAction();mixer.clipAction(asset.animations.find(a=>a.name==='idle')).play();mixer.setTime(.3);
    report.push({id,height,clips,frames});
    const label=document.createElement('div');label.textContent=['João · capa e capuz','Marta · viajante','Helena · emissária','Guarda da caravana','Tomás · mensageiro','Joaquim · prefeito'][i];label.style.cssText=`position:fixed;z-index:100000;color:#ecdfc3;font:20px Georgia;text-align:center;left:${(i%3)*400+120}px;top:${i<3?430:875}px;width:400px;pointer-events:none`;document.body.append(label);label.className='npc-preview-label';
   });
   window.npcPreview={scene,camera,renderer,roots,mixers,render(){renderer.render(scene,camera);}};npcPreview.render();return report;
  });
  for(const r of report){assert.ok(r.height>2&&r.height<3,r.id+': altura');for(const clip of ['idle','greet','walk','death']){assert.ok(r.clips.includes(clip),r.id+': '+clip);assert.equal(r.frames[clip],true);}}
  await page.screenshot({path:path.join(dir,'cast-front.png')});
  await page.evaluate(()=>{npcPreview.roots.forEach(r=>r.rotation.y=Math.PI+.18);npcPreview.render();});await page.screenshot({path:path.join(dir,'cast-back.png')});
  for(const pose of ['greet','walk','death']){
   await page.evaluate(pose=>{const ids=['npcJoao','npcMarta','npcHelena','npcGuard','npcMessenger','npcMayor'];npcPreview.roots.forEach((root,i)=>{root.rotation.y=.35;const mixer=npcPreview.mixers[i],clip=NecromancerV2.view.models[ids[i]].animations.find(c=>c.name===pose);mixer.stopAllAction();mixer.clipAction(clip).play();mixer.setTime(clip.duration*(pose==='death'?.85:.5));});npcPreview.render();},pose);
   await page.screenshot({path:path.join(dir,'cast-'+pose+'.png')});
  }
  const lineup=await page.evaluate(()=>{const ids=['npcJoao','npcMarta','npcHelena','npcGuard','npcMessenger','npcMayor'];npcPreview.roots.forEach((root,i)=>{root.position.set((i-2.5)*1.75,0,0);root.rotation.y=0;const mixer=npcPreview.mixers[i];mixer.stopAllAction();mixer.clipAction(NecromancerV2.view.models[ids[i]].animations.find(c=>c.name==='idle')).play();mixer.setTime(0);});const c=npcPreview.camera;c.left=-5.7;c.right=5.7;c.top=1.9;c.bottom=-1.9;c.position.set(0,1.1,14);c.lookAt(0,1.1,0);c.updateProjectionMatrix();npcPreview.renderer.setSize(1440,480);npcPreview.render();return npcPreview.renderer.domElement.toDataURL('image/png').split(',')[1];});
  fs.writeFileSync(path.join(dir,'lineup-front.png'),Buffer.from(lineup,'base64'));
  await page.evaluate(()=>{npcPreview.renderer.dispose();npcPreview.renderer.domElement.remove();document.querySelectorAll('.npc-preview-label').forEach(e=>e.remove());const n=NecromancerV2,c=n.session.save.campaign;c.started=true;c.prologue={stage:'done'};c.world={stage:'complete',questFlow:1,smith:'done',lumber:'done',passengerMissing:true,nilo:'fort',cleared:[]};n.campaign.start();});
  await page.waitForTimeout(1000);
  const cast=await page.evaluate(()=>{const n=NecromancerV2,w=n.world;for(const g of w.adventure.groups||[])g.state='clear';w.actors=w.actors.filter(a=>a.team!=='enemy');Object.assign(w.player,{x:54,y:67});n.view.zoom(-9999);n.view.zoom(500);return w.actors.filter(a=>a.worldNpc).map(a=>({key:a.key,model:a.model}));});
  for(const [key,model] of [['nilo','npcJoao'],['marta','npcMarta'],['mayor','npcMayor']])assert.ok(cast.some(a=>a.key===key&&a.model===model),key);
  await page.waitForTimeout(700);
  const facing=await page.evaluate(()=>{const n=NecromancerV2;return n.world.actors.filter(a=>a.worldNpc&&a.x>=34&&a.x<=86&&a.y>=36&&a.y<=98).map(a=>({key:a.key,angle:a.angle,renderAngle:n.view.actors.get(a.id)?.root.rotation.y}));});
  assert.ok(facing.length>=5);for(const npc of facing){assert.ok(Math.abs(npc.angle-Math.PI/4)<1e-6,npc.key+': direção para a câmera');assert.ok(Math.abs(npc.renderAngle-Math.PI/4)<1e-6,npc.key+': direção renderizada');}
  await page.screenshot({path:path.join(dir,'village-dark.png')});
  await page.evaluate(()=>{NecromancerV2.view.ground(true);NecromancerV2.view.quality('low');});await page.waitForTimeout(400);await page.screenshot({path:path.join(dir,'village-light-low.png')});
  await page.evaluate(async()=>{const {spawnMember}=await import('v2-horde'),w=NecromancerV2.world;['zombie','skeleton','archer'].forEach((type,i)=>spawnMember(w,type,i));w.paused=true;});
  await page.waitForTimeout(300);await page.screenshot({path:path.join(dir,'village-horde-low.png')});
  await page.evaluate(()=>{const n=NecromancerV2,w=n.world;n.session.save.campaign.world.nilo='itavera';w.paused=true;w.areaTravel={to:'itavera',entry:'caravan',name:'Conferência de NPCs'};});
  await page.waitForFunction(()=>NecromancerV2.world.adventure.area==='itavera'&&!NecromancerV2.world.areaTravel&&!document.getElementById('area-fade').classList.contains('on'),null,{timeout:60000});
  const city=await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.worldNpc).map(a=>({key:a.key,model:a.model})));
  for(const [key,model] of [['city-joao','npcJoao'],['city-marta','npcMarta'],['helena','npcHelena']])assert.ok(city.some(a=>a.key===key&&a.model===model),key+' em Itavera');
  await page.evaluate(()=>{const n=NecromancerV2,c=n.session.save.campaign;c.prologue={stage:'ambush',introRead:true};n.campaign.start();});await page.waitForTimeout(600);
  const prologue=await page.evaluate(()=>NecromancerV2.world.actors.map(a=>({key:a.key,model:a.model})));
  for(const [key,model] of [['nilo','npcJoao'],['marta','npcMarta'],['guard','npcGuard']])assert.ok(prologue.some(a=>a.key===key&&a.model===model),key+' no prólogo');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({report,cast,facing,city,prologue,errors,remote},null,2));console.log('NPCs low poly: OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
