// Locomoção do mago, passos laterais, ré, transição diagonal e conjuração andando.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/mage-gait');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],remote=[],movement=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true'&&!document.getElementById('loading'),null,{timeout:90000});
  await page.click('[data-title="campaign"]');await page.click('.class-choice[data-class="mage"]');
  await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
  await page.locator('#character-name').fill('Mago em marcha');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();
  await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');await page.evaluate(()=>NecromancerV2.go('training'));
  await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
  await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.boss.hp=0;w.gaitDummies=w.actors.filter(a=>a.team==='enemy'&&a!==w.boss);w.actors=[p];});
  await page.waitForTimeout(250);
  // Mira com o ponteiro real: cliques do menu deixam uma direção anterior na entrada.
  const aimPoint=await page.evaluate(()=>{const api=NecromancerV2,w=api.world,p=w.player,r=document.getElementById('view').getBoundingClientRect();let best=null;
   for(let y=r.top+90;y<r.bottom-150;y+=32)for(let x=r.left+32;x<r.right-32;x+=32){const q=api.view.aim(x,y,w);if(!q||q.y>p.y-3)continue;const score=Math.abs(q.x-p.x)+.05*Math.abs(q.y-p.y+7);if(!best||score<best.score)best={x,y,score};}return best;});
  assert.ok(aimPoint);await page.mouse.move(aimPoint.x,aimPoint.y);await page.waitForTimeout(150);
  // A entrada é relativa à tela isométrica: pares de teclas produzem os eixos do mundo.
  for(const [keys,label] of [[['KeyW','KeyD'],'forward'],[['KeyW','KeyA'],'left'],[['KeyS','KeyD'],'right'],[['KeyS','KeyA'],'backward']]){
   for(const key of keys)await page.keyboard.down(key);await page.waitForTimeout(450);
   const state=await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player,o=NecromancerV2.view.actors.get(p.id),weight=a=>a.isScheduled()?a.getEffectiveWeight():0;return {state:o.state,gait:o.gait,phase:o.gaitPhase,idle:weight(o.actions.idle),weights:['walk','strafe_left','strafe_right'].map(n=>weight(o.actions[n])),distance:p.walkDistance};});
   assert.equal(state.state,'walk');assert.ok(state.idle<.01);assert.ok(state.weights.reduce((a,b)=>a+b,0)>.99);assert.ok(Number.isFinite(state.phase));
   movement.push({label,...state});await page.evaluate(()=>{NecromancerV2.world.paused=true;});
   await page.screenshot({path:path.join(dir,label+'.png')});for(const key of keys)await page.keyboard.up(key);await page.evaluate(()=>{NecromancerV2.world.paused=false;});await page.waitForTimeout(180);
  }
  await page.keyboard.down('KeyW');await page.waitForTimeout(400);
  const diagonal=await page.evaluate(()=>{const w=NecromancerV2.world,o=NecromancerV2.view.actors.get(w.player.id),p=w.player;return {gait:o.gait,angle:p.angle,step:[p.stepX,p.stepY],position:[p.x,p.y],aim:w.aim};});
  fs.writeFileSync(path.join(dir,'movement.json'),JSON.stringify({movement,diagonal,aimPoint},null,2));
  assert.ok(diagonal.gait.walk>.1&&diagonal.gait.left+diagonal.gait.right>.1,JSON.stringify(diagonal));movement.push({label:'diagonal',...diagonal});
  await page.evaluate(()=>NecromancerV2.slot(0));
  await page.waitForFunction(()=>{const w=NecromancerV2.world,o=NecromancerV2.view.actors.get(w.player.id);return o.state==='layer'&&o.upper.cast.isScheduled();});
  await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.screenshot({path:path.join(dir,'cast-walking.png')});await page.keyboard.up('KeyW');
  await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.paused=false;w.actors=[p,...w.gaitDummies];w.gaitDummies.forEach((e,i)=>Object.assign(e,{x:p.x-2+(i%4),y:p.y-5-Math.floor(i/4),dummy:true,hp:5000,maxHp:5000}));for(const [id,value] of [['ground','light'],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}});
  await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction);await page.keyboard.down('KeyD');await page.waitForTimeout(400);
  await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.screenshot({path:path.join(dir,'group-light-low.png')});await page.keyboard.up('KeyD');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({ok:true,movement,errors,remote},null,2));console.log(JSON.stringify({ok:true,checks:['frente','esquerda','direita','ré','diagonal','conjuração andando'],errors,remote}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
