// Habilidades novas da Arqueira e do Mercenário no navegador: selos no painel de talentos (vindos de
// docs/habilidades/arvores.json), barra montável pelo seletor do HUD, cada habilidade em combate real com
// captura no momento do efeito, chão claro e qualidade baixa, sem erros de página nem requisições externas.
// Requer Playwright e Edge com WebGL 2 (perfil isolado por classe). Evidências em review/v2/marksman-new-skills/.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,'../../review/v2/marksman-new-skills');
const SKILLS={archer:['saraivadaSeguidora','impactoCeleste','penasVoadoras'],mercenary:['redeDeCaca','armadilhaDeUrso']};
const RANKS={archer:{shot:1,fan:1,saraivadaSeguidora:1,falcon:1,impactoCeleste:1,penasVoadoras:1},mercenary:{redeDeCaca:1,armadilhaDeUrso:1,bomb:1}};
async function run(browser,classId,label,name){
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors=[],remote=[],checks=[];
 const shot=async file=>{for(let i=0;i<3;i++){try{await page.screenshot({path:path.join(dir,classId+'-'+file+'.png')});return;}catch(e){if(i===2)throw e;await page.waitForTimeout(300);}}};
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 try{
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
  await page.click('[data-title="campaign"]');await page.locator('.class-choice[data-class="'+classId+'"]').click();await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
  await page.locator('#character-name').fill(name);await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
  await page.evaluate(()=>{NecromancerV2.go('training');});await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
  // Nível e selos ajustados direto no save e no mundo, só para conferir as habilidades.
  await page.evaluate(([ranks])=>{const s=NecromancerV2.session,w=NecromancerV2.world;s.save.character.level=20;w.level=20;Object.assign(w.marksmanRanks,ranks);s.save.character.marksmanRanks={...w.marksmanRanks};},[RANKS[classId]]);
  // Painel de talentos: os selos novos vêm do arvores.json.
  await page.locator('#open-grimoire').click();await page.waitForSelector('[data-warrior-node]');
  for(const id of SKILLS[classId])assert.equal(await page.locator('[data-warrior-node="'+id+'"]').count(),1,'selo '+id+' no painel');
  await page.locator('[data-warrior-node="'+SKILLS[classId][0]+'"]').click();await page.waitForTimeout(200);await shot('talents');checks.push('painel de talentos');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!NecromancerV2.world.paused);
  // Barra montável: o slot 6 abre o seletor; a habilidade nova entra no lugar da antiga.
  await page.locator('[data-hud-slot="5"]').click();await page.waitForSelector('#action-picker[open]');
  assert.equal(await page.locator('#picker-options [data-picker-skill="'+SKILLS[classId][0]+'"]').isDisabled(),false);
  await shot('picker');await page.locator('#picker-options [data-picker-skill="'+SKILLS[classId][0]+'"]').click();await page.waitForFunction(()=>!document.querySelector('#action-picker[open]'));
  assert.equal(await page.evaluate(()=>NecromancerV2.world.skillLoadout[5]),SKILLS[classId][0]);
  assert.match(await page.locator('[data-hud-slot="5"]').innerText(),classId==='archer'?/Saraivada/:/Rede/);checks.push('barra montável');
  await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.boss.hp=0;w.actors=w.actors.filter(a=>a===p||a===w.falcon||a.team==='enemy'&&a!==w.boss);});
  assert.ok(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy').length)>=3,'alvos de treino');
  const reset=()=>page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.marksmanCooldowns={};p.mp=p.maxMp;w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>Object.assign(e,{x:p.x+((i%3)-1)*1.6,y:p.y-6-Math.floor(i/3)*1.4,hp:5000,maxHp:5000,dummy:true,slow:0,slowTime:0}));w.aim={x:p.x,y:p.y-6};});
  const damage=()=>page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy').reduce((t,a)=>t+a.maxHp-a.hp,0));
  const idle=()=>page.waitForFunction(()=>{const w=NecromancerV2.world;return !w.marksmanAction&&!w.marksmanShots.length&&!w.marksmanLobs.length&&!w.marksmanZones.length;},null,{timeout:8000});
  async function frozen(id,until){
   await reset();const before=await damage();
   assert.ok(await page.evaluate(id=>{NecromancerV2.equip(5,id);return NecromancerV2.slot(5);},id),id+' iniciou');
   await page.waitForFunction(until,null,{timeout:6000});await page.evaluate(()=>{NecromancerV2.world.paused=true;});
   await page.waitForTimeout(250);await shot(id);await page.evaluate(()=>{NecromancerV2.world.paused=false;});
   await idle();await page.waitForTimeout(150);return (await damage())-before;
  }
  if(classId==='archer'){
   await page.waitForFunction(()=>!!NecromancerV2.world.falcon);
   assert.ok(await frozen('saraivadaSeguidora',()=>NecromancerV2.world.marksmanAction?.fired>=3)>0,'Saraivada causa dano');
   assert.ok(await frozen('impactoCeleste',()=>{const z=NecromancerV2.world.marksmanZones.find(z=>z.kind==='strike');return z&&z.at-NecromancerV2.world.time<.35;})>0,'Impacto Celeste causa dano');
   await reset();const feathersBefore=await damage();await page.evaluate(()=>{NecromancerV2.world.marksmanFeathersReady=0;});
   await page.waitForFunction(()=>NecromancerV2.world.marksmanShots.some(s=>s.def?.id==='penasVoadoras'));
   await page.evaluate(()=>{NecromancerV2.world.paused=true;});await shot('penasVoadoras');await page.evaluate(()=>{NecromancerV2.world.paused=false;});await idle();assert.ok(await damage()>feathersBefore,'Penas periódicas causam dano');
   // Tiro Seguidor: o mesmo id do antigo Leque, agora com flechas que curvam.
   await reset();await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.aim={x:p.x+6,y:p.y-2};NecromancerV2.equip(5,'fan');NecromancerV2.slot(5);});
   await page.waitForFunction(()=>NecromancerV2.world.marksmanShots.length===5&&NecromancerV2.world.marksmanShots[0].remaining<7);await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot('tiro-seguidor');await page.evaluate(()=>{NecromancerV2.world.paused=false;});await idle();
   checks.push('Saraivada Seguidora','Impacto Celeste','Penas Voadoras','Tiro Seguidor');
  }else{
   assert.ok(await frozen('redeDeCaca',()=>NecromancerV2.world.actors.some(a=>a.netUntil>NecromancerV2.world.time))>0,'Rede causa dano');
   assert.ok(await page.evaluate(()=>NecromancerV2.world.actors.some(a=>a.team==='enemy'&&a.slowTime>0)),'Rede deixa lentos');
   // Armadilha: assentada longe dos alvos; um deles pisa depois que ela arma.
   await reset();await page.evaluate(()=>{const w=NecromancerV2.world;w.aim={x:w.player.x,y:w.player.y+5};NecromancerV2.equip(5,'armadilhaDeUrso');NecromancerV2.slot(5);});
   await page.waitForFunction(()=>{const w=NecromancerV2.world;return w.marksmanTraps.length&&w.time>w.marksmanTraps[0].armAt+.1;},null,{timeout:5000});
   await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot('armadilha-armada');
   const before=await damage();const prey=await page.evaluate(()=>{const w=NecromancerV2.world,t=w.marksmanTraps[0],e=w.actors.find(a=>a.team==='enemy');Object.assign(e,{x:t.x+.5,y:t.y});w.paused=false;return e.id;});
   await page.waitForFunction(()=>!NecromancerV2.world.marksmanTraps.length,null,{timeout:5000});assert.ok(await damage()>before,'Armadilha fecha');
   assert.ok(await page.evaluate(id=>NecromancerV2.world.actors.find(a=>a.id===id).trapUntil>NecromancerV2.world.time,prey),'alvo preso');
   await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot('armadilha-presa');await page.evaluate(()=>{NecromancerV2.world.paused=false;});
   checks.push('Rede de Caça','Armadilha de Urso');
  }
  // Chão claro e qualidade baixa, com a habilidade principal no ar.
  await page.evaluate(()=>{for(const [id,value] of [['ground','light'],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}});
  await reset();await page.evaluate(id=>{NecromancerV2.equip(5,id);NecromancerV2.slot(5);},SKILLS[classId][0]);
  await page.waitForFunction(()=>{const w=NecromancerV2.world;return w.marksmanShots.length>1||w.marksmanLobs.length>0;},null,{timeout:5000});await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot('light-low');await page.evaluate(()=>{NecromancerV2.world.paused=false;});await idle();
  checks.push('chão claro e qualidade baixa');
  // A barra escolhida vai para o save.
  await page.evaluate(()=>NecromancerV2.save());assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.skillLoadout?.length),6);
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  return {classId,checks,errors,remote};
 }finally{await ctx.close();}
}
(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const results=[await run(browser,'archer','Arqueira','Iara'),await run(browser,'mercenary','Mercenário','Bento')];
 const result={ok:true,results};fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
