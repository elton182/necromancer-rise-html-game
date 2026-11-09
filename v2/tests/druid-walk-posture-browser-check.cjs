// Confere a entrada real em locomoção e o peso das ações no mixer.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,process.env.NR_DRUID_REVIEW_DIR||'../../review/v2/druid-walk-posture');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true'&&!document.getElementById('loading'),null,{timeout:90000});
  await page.click('[data-title="campaign"]');await page.click('.class-choice[data-class="druid"]');
  await page.locator('#character-name').fill('Flora');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();
  await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
  await page.evaluate(()=>NecromancerV2.go('training'));
  await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
  await page.evaluate(()=>{const w=NecromancerV2.world;w.actors=w.actors.filter(a=>a===w.player);w.player.x=0;w.player.y=0;w.aim={x:0,y:10};});
  await page.waitForTimeout(300);
  async function snapshot(){return page.evaluate(()=>{
   const api=NecromancerV2,p=api.world.player,o=api.view.actors.get(p.id),b=o.body.getObjectByName('mixamorigSpine');
   return {state:o.state,weights:Object.fromEntries(Object.entries(o.actions).map(([n,a])=>[n,a.getEffectiveWeight()])),
    spine:b?.quaternion.toArray(),step:[p.stepX,p.stepY]};
  });}
  const idle=await snapshot();assert.equal(idle.state,'idle');
  await page.screenshot({path:path.join(dir,'posture-idle.png')});
  await page.keyboard.down('KeyS');await page.waitForTimeout(350);
  const walking=await snapshot();assert.equal(walking.state,'walk');assert.ok(walking.weights.idle<.01,'idle deve sair da mistura');
  assert.ok(walking.weights.walk+walking.weights.strafe_left+walking.weights.strafe_right>.99,'locomoção deve ter peso completo');
  await page.screenshot({path:path.join(dir,'posture-walking.png')});
  await page.keyboard.up('KeyS');assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(dir,'posture-mixer.json'),JSON.stringify({idle,walking,errors},null,2));console.log('Postura: idle sai da mistura e locomoção entra com peso completo.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
