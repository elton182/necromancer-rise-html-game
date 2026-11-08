'use strict';
// Avisos hostis no chão (círculo, setor e linha) no HTML empacotado, em fundo escuro e claro, com a qualidade alta e a baixa.
// Avança a simulação real até o meio de cada preparação e pausa. Evidências em review/v2/hostile-warnings/.
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const SCENES=['slam','smash','area','fire','rain','pool','cut','sector','shot','feathers','web','charge','cry','howl','group'];
(async()=>{const out=path.resolve(__dirname,'../../review/v2/hostile-warnings');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||/THREE\.WebGLProgram|Efeitos visuais desativados/.test(m.text()))errors.push(m.text());});
 page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await legacy.click(page,'#enter');
 const scene=kind=>page.evaluate(async kind=>{
  const n=NecromancerV2,w=n.world,{spawnEnemy,RAIN,HOWL}=await import('v2-enemies'),{step}=await import('v2-model');
  w.actors=kind==='group'?w.actors.filter(a=>a===w.player||a.team!=='enemy'):[w.player];Object.assign(w.player,{x:0,y:4,hp:1e7,maxHp:1e7,hpRegen:0});w.effects=[];w.projectiles=[];w.hostileShots=[];w.hostileZones=[];w.arena={...w.arena,solids:[]};w.paused=false;
  const run=t=>{for(let i=0;i<Math.round(t*60);i++){step(w,1/60);n.view.render(w,1/60);}};
  const ready=(type,x,y,opts,props={})=>Object.assign(spawnEnemy(w,type,x,y,opts),{abilityCd:0,...props});
  const quiet={abilityCd:1e9,atkTimer:1e9,rainCd:1e9};
  if(kind==='slam'){ready(10,0,0);run(1);}
  if(kind==='smash'){ready(10,0,3,undefined,{abilityCd:1e9,atkTimer:0});run(.45);}
  if(kind==='area'){ready(2,0,-3,{legacy:true});run(.45);}
  if(kind==='fire'){ready(3,0,-5,{legacy:true},{atkTimer:0});run(.9);}
  if(kind==='rain'){ready(1,0,-4,undefined,{...quiet,rainCd:0});run(RAIN.wind*.7);}
  if(kind==='pool'){w.hostileZones.push({id:w.nextId++,source:null,x:2,y:3,radius:2.5,delay:.5,life:3,tick:1,damage:1});run(.8);}
  if(kind==='cut'){ready(0,0,1.5,undefined,{atkTimer:99});run(.4);}
  if(kind==='sector'){w.effects.push({id:'rei-setor',kingWarning:-1,kind:'kingWarning',fx:'dangerRune',visual:true,ground:true,fixedRadius:true,time:0,duration:10,x:0,y:0,radius:5,arc:1.6,direction:Math.PI/2,color:'#ff7a4a',progress:.55});run(.05);}
  if(kind==='shot'){ready(1,0,-5,{legacy:true},{atkTimer:1e9,rainCd:1e9});run(.4);}
  if(kind==='feathers'){ready(7,0,-1,undefined);run(.35);}
  if(kind==='web'){ready(8,0,-2,undefined,{webCd:0,atkTimer:1e9});run(.45);}
  if(kind==='charge'){ready(4,0,-3,{legacy:true},{howlCd:1e9});run(.25);}
  if(kind==='cry'){const e=spawnEnemy(w,10,0,0);Object.assign(spawnEnemy(w,1,2,0),quiet);Object.assign(e,{cryCd:0,abilityCd:99});run(.6);}
  if(kind==='howl'){ready(4,0,-3,undefined,{howlCd:0});run(HOWL.wind*.7);}
  if(kind==='group'){ready(10,-3,0);ready(10,4,-2);ready(1,0,-6,undefined,{...quiet,rainCd:0});ready(7,-5,-3);ready(2,5,3,{legacy:true});run(.75);}
  w.paused=true;n.view.render(w,0);
  const list=w.effects.filter(f=>f.enemyWarning||f.kingWarning||f.hostileZone);
  return {drawn:list.filter(f=>f.fx==='dangerRune'||f.fx==='dangerLine').map(f=>({fx:f.fx,radius:f.radius,arc:f.arc??null,length:f.length??null,progress:f.progress??null,mood:f.mood??null})),hazards:list.filter(f=>f.fx==='hazardPoint').length,loose:list.filter(f=>!f.fx).length};
 },kind);
 const results={};
 for(const kind of SCENES){
  results[kind]=await scene(kind);
  for(const [ground,quality] of [['dark','high'],['light','high'],['dark','low'],['light','low']]){await legacy.select(page,'#ground',ground);await legacy.select(page,'#quality',quality);await page.evaluate(()=>NecromancerV2.view.render(NecromancerV2.world,0));await page.screenshot({path:path.join(out,`${kind}-${ground}-${quality}.png`)});}
 }
 for(const kind of SCENES){assert.ok(results[kind].drawn.length>0,`${kind}: sem aviso desenhado ${JSON.stringify(results[kind])}`);assert.equal(results[kind].loose,0,`${kind}: aviso fora do desenho novo`);}
 assert.equal(results.slam.drawn.length,1,'a pancada desenha um círculo só');
 assert.ok(results.cut.drawn.some(f=>f.arc)&&results.sector.drawn.some(f=>f.arc));
 assert.ok(results.shot.drawn.some(f=>f.fx==='dangerLine'&&f.length===15)&&results.shot.hazards===15);
 assert.equal(results.feathers.drawn.filter(f=>f.fx==='dangerLine').length,3);
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({results,errors,remote},null,2));
 console.log('Avisos hostis no HTML empacotado: OK.');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
