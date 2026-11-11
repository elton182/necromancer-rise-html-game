// Repouso do mago no GLB distribuído e retorno após movimento/conjuração.
// Playwright + Edge/WebGL 2, armazenamento isolado; evidências em review/v2/mage-idle/.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/mage-idle');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true'&&!document.getElementById('loading'),null,{timeout:90000});
  await page.click('[data-title="campaign"]');await page.click('.class-choice[data-class="mage"]');
  await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
  await page.locator('#character-name').fill('Mago em repouso');
  await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();
  await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
  await page.evaluate(()=>NecromancerV2.go('training'));
  await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
  await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.boss.hp=0;w.actors=w.actors.filter(a=>a!==w.boss);w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>Object.assign(e,{dummy:true,x:p.x-3+i%4*2,y:p.y-6-Math.floor(i/4)*2,hp:5000,maxHp:5000}));});
  const idle=()=>page.waitForFunction(()=>{const api=NecromancerV2,w=api.world,o=api.view.actors.get(w.player.id);return w.player.hp>0&&!w.paused&&o?.state==='idle'&&o.actions.idle.isScheduled()&&o.actions.idle.getEffectiveWeight()>.99;});
  await idle();
  const clip=await page.evaluate(()=>{const api=NecromancerV2,o=api.view.actors.get(api.world.player.id),a=o.actions.idle;return {duration:a.getClip().duration,time:a.time,fingerTracks:a.getClip().tracks.filter(t=>/RightHand(?:Thumb|Index|Middle|Ring|Pinky)[123]\.quaternion$/.test(t.name)).map(t=>t.name),castFingerTracks:o.upper.cast.getClip().tracks.filter(t=>/RightHand(?:Thumb|Index|Middle|Ring|Pinky)[123]\.quaternion$/.test(t.name)).length};});
  // O exportador NLA inclui até um frame de borda além do intervalo 1–121.
  assert.ok(Math.abs(clip.duration-4)<=1/30+1e-6,JSON.stringify(clip));
  assert.equal(clip.fingerTracks.length,15,'falanges exportadas no idle');
  assert.equal(clip.castFingerTracks,15,'falanges preservadas na camada de conjuração');
  await page.keyboard.down('KeyD');await page.waitForTimeout(350);
  assert.equal(await page.evaluate(()=>{const api=NecromancerV2;return api.view.actors.get(api.world.player.id).state;}),'walk');
  await page.keyboard.up('KeyD');await idle();
  await page.evaluate(()=>NecromancerV2.slot(0));
  await page.waitForFunction(()=>!!NecromancerV2.world.marksmanAction);
  await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction);await idle();
  // O mixer deve atravessar a emenda do ciclo mantendo o repouso.
  const start=await page.evaluate(()=>NecromancerV2.world.time);
  await page.waitForFunction(t=>NecromancerV2.world.time>t+4.2,start,{timeout:20000});await idle();
  for(const ground of ['dark','light']){
   await page.evaluate(g=>{for(const [id,value] of [['ground',g],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}},ground);
   await page.waitForTimeout(250);await idle();
   assert.ok(await page.evaluate(()=>NecromancerV2.world.player.hp>0));
   await page.screenshot({path:path.join(dir,`idle-${ground}-low.png`)});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  const result={ok:true,clip,checks:['idle de quatro segundos','retorno da caminhada','retorno da conjuração','repetição do ciclo','grupo em chão claro/escuro e qualidade baixa'],errors,remote};
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
