// Revisão de animação do Mago: impacto do clipe no release de cada feitiço, 8 direções, esquiva e morte deitada.
// Playwright + Edge/Chrome (BROWSER_CHANNEL), perfil isolado, arquivo local sem servidor.
// Evidências em review/v2/mage-anim-review/game (ou NR_MAGE_REVIEW_DIR, relativo a este arquivo).
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const dir=path.resolve(__dirname,process.env.NR_MAGE_REVIEW_DIR||'../../review/v2/mage-anim-review/game');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
 const report={sync:[],directions:[],dodge:null,death:null};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  const shot=name=>page.screenshot({path:path.join(dir,name+'.png')});
  const setting=(id,value)=>page.evaluate(([id,value])=>{const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));},[id,value]);
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
  await page.locator('#loading-start').click();await page.waitForFunction(()=>!document.getElementById('loading'));
  await page.click('[data-title="campaign"]');await page.click('.class-choice[data-class="mage"]');
  await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
  await page.locator('#character-name').fill('Mago em revisão');await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();
  await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');await page.evaluate(()=>NecromancerV2.go('training'));
  await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
  // Arena limpa com uma horda de bonecos à frente (não atacam), todos os feitiços liberados.
  await page.evaluate(async()=>{const n=NecromancerV2,w=n.world,p=w.player,M=await import('v2-marksman-model');w.boss.hp=0;
   w.horde=w.actors.filter(a=>a.team==='enemy'&&a!==w.boss).slice(0,10);w.actors=[p,...w.horde];
   w.home={x:p.x,y:p.y};w.horde.forEach((e,i)=>{const a=i/w.horde.length*Math.PI*2,r=i%2?3.2:4.6;Object.assign(e,{x:p.x+Math.sin(a)*r,y:p.y+Math.cos(a)*r,dummy:true,hp:1e6,maxHp:1e6,speed:0});});
   for(const d of M.marksmanActions('mage'))if(d.node)w.marksmanRanks[d.node]=Math.max(1,w.marksmanRanks[d.node]||0);});
  const aim=await page.evaluate(()=>{const api=NecromancerV2,w=api.world,p=w.player,r=document.getElementById('view').getBoundingClientRect();let best=null;
   for(let y=r.top+90;y<r.bottom-150;y+=24)for(let x=r.left+32;x<r.right-32;x+=24){const q=api.view.aim(x,y,w);if(!q||q.y>p.y-3)continue;const s=Math.abs(q.x-p.x)+.05*Math.abs(q.y-p.y+6);if(!best||s<best.s)best={x,y,s};}return best;});
  assert.ok(aim);await page.mouse.move(aim.x,aim.y);await page.waitForTimeout(150);

  // 1. Sincronia: amostra a posição real do clipe (mixer) a cada quadro e confere o impacto no release.
  const spells=await page.evaluate(async()=>{const M=await import('v2-marksman-model');return M.marksmanActions('mage').map((d,i)=>({i,id:d.id,clip:d.clip,release:d.release,duration:d.duration,kind:d.kind,passive:!!d.passive})).filter(d=>['cast','cast_up'].includes(d.clip)&&!d.passive);});
  const impact=await page.evaluate(()=>NecromancerV2.view.assets?.mageHero?.impact||null);
  for(const [n,spell] of spells.entries()){
   const ground=n%2?'light':'dark',quality=n%3===2?'low':'high';await setting('ground',ground);await setting('quality',quality);
   const sample=await page.evaluate(async({spell,capture})=>{const n=NecromancerV2,w=n.world,p=w.player,S=await import('v2-marksman');
    w.marksmanCooldowns={};p.mp=p.maxMp;w.marksmanAction=null;w.paused=false;Object.assign(p,w.home);
    if(!S.marksmanAction(w,spell.i))return {started:false};
    const samples=[];
    return await new Promise(done=>{let pausedAt=null;const step=()=>{const s=w.marksmanAction,o=n.view.actors.get(p.id);
      if(!s||s.index!==spell.i){done({started:true,samples,pausedAt});return;}
      const layered=o.state==='layer',action=layered?o.upper?.[spell.clip]:o.actions?.[spell.clip];
      if(action)samples.push({t:s.time,u:action.time/action.getClip().duration,layered});
      if(capture&&!pausedAt&&s.time>=spell.release){pausedAt=s.time;w.paused=true;done({started:true,samples,pausedAt});return;}
      if(s.time>2.5){w.marksmanAction=null;}
      requestAnimationFrame(step);};requestAnimationFrame(step);});},{spell,capture:['arcane','fireball','frost','meteor','bigBang','escudoArcano'].includes(spell.id)});
   assert.ok(sample.started,spell.id+' não iniciou');
   if(sample.pausedAt!=null){await page.waitForTimeout(120);await shot(`impact-${spell.id}-${ground}-${quality}`);await page.evaluate(()=>NecromancerV2.view.zoom(-1000));await page.waitForTimeout(150);await shot(`impact-${spell.id}-${ground}-${quality}-zoommin`);await page.evaluate(()=>NecromancerV2.view.zoom(400));await page.evaluate(()=>{NecromancerV2.world.paused=false;});
    await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction,null,{timeout:6000}).catch(()=>page.evaluate(()=>{NecromancerV2.world.marksmanAction=null;}));}
   const k=impact[spell.clip],before=sample.samples.filter(x=>x.t<=spell.release+1e-6).pop(),after=sample.samples.find(x=>x.t>spell.release+1e-6);
   // O quadro anterior ao release nunca passou do impacto, e o primeiro depois dele já o alcançou.
   assert.ok(before&&before.u<=k+.02,spell.id+' passou do impacto antes do release '+JSON.stringify(before));
   if(after&&sample.pausedAt==null)assert.ok(after.u>=k-.02,spell.id+' impacto atrasado '+JSON.stringify(after));
   const nearest=sample.samples.reduce((a,b)=>Math.abs(b.t-spell.release)<Math.abs(a.t-spell.release)?b:a);
   report.sync.push({id:spell.id,clip:spell.clip,release:spell.release,duration:spell.duration,impact:k,nearest,before,after:after||null,frames:sample.samples.length});
   await page.waitForTimeout(80);
  }
  await setting('quality','high');

  // 2. Oito direções com a mira fixa à frente: mistura walk/strafe sem idle e fase finita.
  for(const [keys,label] of [[['KeyW'],'n'],[['KeyW','KeyD'],'ne'],[['KeyD'],'e'],[['KeyS','KeyD'],'se'],[['KeyS'],'s'],[['KeyS','KeyA'],'so'],[['KeyA'],'o'],[['KeyW','KeyA'],'no']]){
   for(const key of keys)await page.keyboard.down(key);await page.waitForTimeout(500);
   const state=await page.evaluate(()=>{const w=NecromancerV2.world,o=NecromancerV2.view.actors.get(w.player.id),live=a=>a?.isScheduled()?a.getEffectiveWeight():0;return {state:o.state,gait:o.gait,phase:o.gaitPhase,idle:live(o.actions.idle)};});
   assert.equal(state.state,'walk',label);assert.ok(state.idle<.01,label);assert.ok(Number.isFinite(state.phase),label);
   report.directions.push({label,...state});await page.evaluate(()=>{NecromancerV2.world.paused=true;});await shot('walk-'+label);
   for(const key of keys)await page.keyboard.up(key);await page.evaluate(()=>{NecromancerV2.world.paused=false;});await page.waitForTimeout(200);
  }

  // 3. Esquiva no meio do passo: clipe dodge acompanha a janela real.
  await page.keyboard.down('KeyD');await page.waitForTimeout(250);
  report.dodge=await page.evaluate(()=>new Promise(done=>{const n=NecromancerV2,w=n.world;n.dash({x:1,y:0});const out=[];const step=()=>{const o=n.view.actors.get(w.player.id),a=o.actions.dodge;
    if(w.dash.remaining>0){out.push({remaining:w.dash.remaining,u:a.time/a.getClip().duration,weight:a.getEffectiveWeight()});if(out.length===8){w.paused=true;done(out);return;}requestAnimationFrame(step);}else done(out);};requestAnimationFrame(step);}));
  await shot('dodge-mid-step');await page.evaluate(()=>{NecromancerV2.world.paused=false;});await page.keyboard.up('KeyD');
  assert.ok(report.dodge.length>=4,'esquiva amostrada');
  for(const s of report.dodge)assert.ok(Math.abs(s.u-(1-s.remaining/.5))<.08,'dodge fora da janela '+JSON.stringify(s));
  await page.waitForTimeout(600);

  // 4. Morte no meio de um feitiço: deita no chão (sem ficar suspensa) em zoom mínimo e máximo, chão claro e escuro.
  report.death=await page.evaluate(async()=>{const n=NecromancerV2,w=n.world,p=w.player,S=await import('v2-marksman'),THREE=await import('three');
   Object.assign(p,w.home);w.marksmanCooldowns={};p.mp=p.maxMp;S.marksmanAction(w,0);await new Promise(r=>setTimeout(r,120));p.hp=0;
   await new Promise(r=>setTimeout(r,1600));const o=n.view.actors.get(p.id),box=new THREE.Box3().setFromObject(o.body),bones={};
   o.body.updateMatrixWorld(true);o.body.traverse(b=>{if(b.isBone){const k=b.name.replace(/[^a-z]/gi,'').replace(/^mixamorig/,'');if(['Hips','Head'].includes(k))bones[k]=new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).y;}});
   return {state:o.state,minY:box.min.y,maxY:box.max.y,ground:o.root.position.y,height:n.view.assets.mageHero.height,hipsY:bones.Hips,headY:bones.Head};});
  assert.equal(report.death.state,'death');
  // Deitado: quadril e cabeça junto ao chão (no Blender: 0,10 e 0,14 de 0,98), não escorados pelas botas ou pelo manto.
  const lying=report.death,ground=lying.ground,h=lying.height;
  assert.ok(lying.minY-ground>-.01&&lying.hipsY-ground<h*.14&&lying.headY-ground<h*.17,'corpo suspenso '+JSON.stringify(lying));
  for(const [ground,zoom] of [['dark',-1000],['light',1000]]){await setting('ground',ground);await page.evaluate(z=>NecromancerV2.view.zoom(z),zoom);await page.waitForTimeout(250);await shot(`death-${ground}-zoom${zoom<0?'min':'max'}`);}
  fs.writeFileSync(path.join(dir,'animation-check.json'),JSON.stringify({...report,errors,remote},null,2));
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  console.log(JSON.stringify({ok:true,spells:report.sync.length,directions:report.directions.length,dodge:report.dodge.length,death:report.death,errors,remote}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
