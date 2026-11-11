// Habilidades novas da Druida, do Mago e do Necromante no navegador: selos no painel (vindos de
// docs/habilidades/arvores.json), seletor da barra, cada habilidade em combate real com captura, companheiros
// com tinta e escala, chão claro e qualidade baixa, sem erros de página nem requisições externas.
// Requer Playwright e Edge com WebGL 2 (perfil isolado por classe). Evidências em review/v2/class-ideas/.
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,'../../review/v2/class-ideas');
const url=pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href;
async function open(browser,errors,remote){
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
 return {ctx,page};
}
const shotOf=(page,prefix)=>async name=>{for(let i=0;i<3;i++){try{await page.screenshot({path:path.join(dir,prefix+'-'+name+'.png')});return;}catch(e){if(i===2)throw e;await page.waitForTimeout(400);}}};
async function freeze(page,shot,name,until){
 try{await page.waitForFunction(until,null,{timeout:8000});}
 catch(e){const st=await page.evaluate(()=>{const w=NecromancerV2.world;return {time:w.time,paused:w.paused,scene:NecromancerV2.session.scene,form:w.druidForm,action:w.druidAction?.id,winds:w.druidWinds?.length,tornados:w.druidTornados?.length,mp:w.player.mp,shots:w.marksmanShots?.length};});throw Error(name+': condição não ocorreu; estado '+JSON.stringify(st));}await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot(name);await page.evaluate(()=>{NecromancerV2.world.paused=false;});}
const damage=page=>page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy').reduce((t,a)=>t+a.maxHp-a.hp,0));
// Alvos parados e resistentes à frente do personagem: o check observa as regras das habilidades, não a IA.
const stage=page=>page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;if(w.boss)w.boss.hp=0;w.actors=w.actors.filter(a=>a===p||a===w.falcon||a.groupType||a.companion||a.team==='enemy'&&a!==w.boss);p.mp=p.maxMp;w.marksmanCooldowns={};w.druidCooldowns={};w.summonReady={};w.castCooldown=0;
 w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>Object.assign(e,{x:p.x+((i%3)-1)*1.5,y:p.y-5-Math.floor(i/3)*1.3,hp:20000,maxHp:20000,dummy:true,slow:0,slowTime:0,timer:999}));w.aim={x:p.x,y:p.y-5};});

async function hero(browser,classId,name,ranks,field,checks){
 const errors=[],remote=[],{ctx,page}=await open(browser,errors,remote),shot=shotOf(page,classId);
 try{
  await page.click('[data-title="campaign"]');await page.locator('.class-choice[data-class="'+classId+'"]').click();await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
  await page.locator('#character-name').fill(name);await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
  await page.evaluate(()=>{NecromancerV2.go('training');});await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
  await page.evaluate(([ranks,field])=>{const s=NecromancerV2.session,w=NecromancerV2.world;s.save.character.level=20;w.level=20;Object.assign(w[field],ranks);s.save.character[field]={...w[field]};},[ranks,field]);
  await page.locator('#open-grimoire').click();await page.waitForSelector('[data-warrior-node]');
  for(const id of Object.keys(ranks))assert.equal(await page.locator('[data-warrior-node="'+id+'"]').count(),1,'selo '+id);
  await page.locator('[data-warrior-node="'+Object.keys(ranks).at(-1)+'"]').click();await page.waitForTimeout(150);await shot('talents');await page.keyboard.press('Escape');await page.waitForFunction(()=>!NecromancerV2.world.paused);
  checks.push(classId+': painel');
  return {ctx,page,shot,errors,remote};
 }catch(e){await ctx.close();throw e;}
}

async function druid(browser){
 const checks=[],h=await hero(browser,'druid','Flora',{spark:1,chain:1,storm:1,turbilhao:2,tornado:1,furacao:1,wolf:1,leap:1,corteSangrento:1,garraDeGelo:1},'druidRanks',checks),{page,shot}=h;
 try{
  await page.locator('[data-hud-slot="5"]').click();await page.waitForSelector('#action-picker[open]');
  for(const id of ['turbilhao','tornado'])assert.equal(await page.locator('#picker-options [data-picker-skill="'+id+'"]').isDisabled(),false);
  await shot('picker');await page.locator('#picker-options [data-picker-skill="turbilhao"]').click();await page.waitForFunction(()=>!document.querySelector('#action-picker[open]'));
  assert.ok(await page.evaluate(()=>NecromancerV2.equip(4,'tornado').ok));checks.push('barra humana');
  await stage(page);let before=await damage(page);assert.ok(await page.evaluate(()=>NecromancerV2.slot(5)));
  await freeze(page,shot,'turbilhao',()=>NecromancerV2.world.druidWinds.length&&NecromancerV2.world.druidWinds[0].left<6);await page.waitForFunction(()=>!NecromancerV2.world.druidWinds.length);assert.ok(await damage(page)>before,'Turbilhão');
  await stage(page);before=await damage(page);assert.ok(await page.evaluate(()=>NecromancerV2.slot(4)));
  await freeze(page,shot,'furacao',()=>NecromancerV2.world.druidTornados.length&&NecromancerV2.world.time>NecromancerV2.world.druidTornados[0].until-4.5);
  await page.waitForFunction(()=>!NecromancerV2.world.druidTornados.length,null,{timeout:12000});assert.ok(await damage(page)>before,'Tornado/Furacão');checks.push('Turbilhão','Tornado com Furacão');
  // Forma de lobo: corte e garra nos slots 5 e 6, fixos.
  await page.evaluate(()=>{NecromancerV2.world.player.mp=NecromancerV2.world.player.maxMp;NecromancerV2.world.druidFormReady=0;NecromancerV2.stance();});await page.waitForFunction(()=>NecromancerV2.world.druidForm==='wolf');
  await page.waitForFunction(()=>document.querySelector('[data-hud-slot="4"]').innerText.includes('Corte Sangrento')&&document.querySelector('[data-hud-slot="5"]').innerText.includes('Garra de Gelo'),null,{timeout:3000});
  await stage(page);await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>Object.assign(e,{x:p.x+(i-1)*.8,y:p.y-1.8}));w.castCooldown=0;});
  before=await damage(page);assert.ok(await page.evaluate(()=>NecromancerV2.slot(4)),'Corte Sangrento');
  await freeze(page,shot,'corte-sangrento',()=>NecromancerV2.world.actors.some(a=>a.druidBleed));
  await page.waitForFunction(()=>!NecromancerV2.world.druidAction);await page.evaluate(()=>{NecromancerV2.world.castCooldown=0;});assert.ok(await page.evaluate(()=>NecromancerV2.slot(5)),'Garra de Gelo');
  await freeze(page,shot,'garra-de-gelo',()=>NecromancerV2.world.actors.some(a=>a.druidChill>NecromancerV2.world.time));assert.ok(await damage(page)>before);checks.push('Corte Sangrento','Garra de Gelo');
  return await finish(h,checks);
 }finally{await h.ctx.close();}
}

async function mage(browser){
 const checks=[],h=await hero(browser,'mage','Aurelio',{bolt:1,setasPerseguidoras:1,frost:1,esferaDeGelo:1,fireball:1,combustion:1,imbuirFogo:1,familiarDeFogo:1,golemDeGelo:1},'marksmanRanks',checks),{page,shot}=h;
 try{
  const cast=async(id,name,until)=>{await stage(page);const before=await damage(page);assert.ok(await page.evaluate(id=>{NecromancerV2.equip(5,id);return NecromancerV2.slot(5);},id),id);await freeze(page,shot,name,until);return before;};
  let before=await cast('setasPerseguidoras','setas',()=>NecromancerV2.world.marksmanShots.length>=4&&NecromancerV2.world.marksmanShots[0].remaining<9);
  await page.waitForFunction(()=>!NecromancerV2.world.marksmanShots.length);assert.ok(await damage(page)>before,'Setas');
  before=await cast('esferaDeGelo','esfera',()=>{const w=NecromancerV2.world,o=w.marksmanOrbs[0];return o&&o.left<8.6&&w.marksmanShots.length>=3;});
  await page.waitForFunction(()=>!NecromancerV2.world.marksmanOrbs.length,null,{timeout:9000});assert.ok(await damage(page)>before,'Esfera');
  before=await cast('familiarDeFogo','familiar',()=>!!NecromancerV2.world.marksmanFamiliar&&NecromancerV2.world.marksmanShots.length>0);
  await page.waitForTimeout(1500);assert.ok(await damage(page)>before,'Familiar');
  before=await cast('golemDeGelo','golem',()=>NecromancerV2.world.actors.some(a=>a.companion==='iceGolem'&&a.animation==='attack'));
  await page.waitForTimeout(1500);assert.ok(await damage(page)>before,'Golem');
  assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.find(a=>a.companion==='iceGolem').tint),'#9fd8ff');
  checks.push('Setas Perseguidoras','Esfera de Gelo','Familiar de Fogo','Golem de Gelo');
  await page.evaluate(()=>{for(const [id,value] of [['ground','light'],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}});
  await page.waitForTimeout(300);await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot('light-low');await page.evaluate(()=>{NecromancerV2.world.paused=false;});checks.push('chão claro e qualidade baixa');
  return await finish(h,checks);
 }finally{await h.ctx.close();}
}

async function necro(browser){
 const errors=[],remote=[],checks=[],{ctx,page}=await open(browser,errors,remote),shot=shotOf(page,'necromancer');
 try{
  await legacy.click(page,'#army-tools summary');await legacy.click(page,'#spell-demo');
  // Perfil de teste com os nós novos (o perfil da demo só tem as magias).
  const setup=ranks=>page.evaluate(async ranks=>{const {setProfile}=await import('v2-horde');const r=setProfile(NecromancerV2.world,{version:1,level:24,act1:false,ranks});NecromancerV2.session.save.character.level=24;return r.ok?['caoZumbi','mages'].map((id,i)=>NecromancerV2.equip(i,id).ok):r.message;},ranks);
  assert.deepEqual(await setup({zombie:2,vigor:2,caoZumbi:2,skeleton:2,mages:2,raioNecrotico:2,rupturaNecrotica:1}),[true,true]);
  await page.evaluate(()=>NecromancerV2.ui.show('skills'));await page.waitForSelector('[data-node="caoZumbi"]');assert.equal(await page.locator('[data-node="mages"]').count(),1);await page.locator('[data-node="caoZumbi"]').click();await page.waitForTimeout(150);await shot('grimoire');
  await page.evaluate(()=>NecromancerV2.ui.close());checks.push('Grimório com os nós novos');
  await legacy.click(page,'#enter');await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
  await stage(page);let before=await damage(page);assert.ok(await page.evaluate(()=>NecromancerV2.slot(0)),'Cão Zumbi');
  assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.groupType==='caoZumbi').length),2);
  await freeze(page,shot,'caes',()=>NecromancerV2.world.actors.some(a=>a.groupType==='caoZumbi'&&a.animation==='attack'));
  await page.waitForTimeout(1200);assert.ok(await damage(page)>before,'cães mordem');
  before=await damage(page);assert.ok(await page.evaluate(()=>NecromancerV2.slot(1)),'Magos');
  await freeze(page,shot,'magos-raio',()=>NecromancerV2.world.effects.some(e=>e.fx==='lightning'&&e.color==='#b58cff'));
  await page.waitForTimeout(1200);assert.ok(await damage(page)>before,'raio dos magos');checks.push('Cão Zumbi','Magos com Raio Necrótico');
  // Os dois grupos já existem ao equipar; o slot é comando, e os caídos aparecem no painel da horda.
  await page.evaluate(()=>{const w=NecromancerV2.world;w.actors.filter(a=>a.groupType==='caoZumbi'||a.groupType==='mages').forEach(a=>{a.hp=0;});});
  await page.waitForFunction(()=>NecromancerV2.world.actors.filter(a=>a.groupType==='caoZumbi'||a.groupType==='mages').every(a=>a.dead&&a.deadTimer>0));
  await page.evaluate(()=>{NecromancerV2.ui.show('horde');document.getElementById('army-tools').open=true;});await page.waitForTimeout(200);
  assert.match(await page.locator('#army-members').innerText(),/Cão Zumbi:.*caído/);
  assert.match(await page.locator('#army-members').innerText(),/Magos:.*caído/);
  await shot('horda-caidos');await legacy.click(page,'#revive');
  assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.groupType&&a.hp>0).length),1);
  await page.evaluate(()=>NecromancerV2.ui.close());
  await page.waitForFunction(()=>NecromancerV2.world.actors.filter(a=>a.groupType==='caoZumbi'||a.groupType==='mages').every(a=>a.hp>0&&!a.dead),null,{timeout:18000});
  await page.evaluate(()=>NecromancerV2.save());await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
  assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.groupType==='caoZumbi').length),2);
  assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.groupType==='mages').length),2);
  checks.push('painel da horda','reanimação manual e automática','persistência após recarregar');
  // Cérbero: outra build, mesmo slot.
  await page.evaluate(()=>NecromancerV2.go('menu'));await page.waitForFunction(()=>NecromancerV2.session.scene==='menu');
  assert.deepEqual(await setup({zombie:2,vigor:2,caoZumbi:2,cerberus:1,skeleton:2,mages:2}),[true,true]);
  await legacy.click(page,'#enter');await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
  await stage(page);before=await damage(page);assert.ok(await page.evaluate(()=>NecromancerV2.slot(0)),'Cérbero');
  assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.groupType==='caoZumbi').length),1);
  await freeze(page,shot,'cerbero',()=>NecromancerV2.world.actors.some(a=>a.groupType==='caoZumbi'&&a.animation==='attack'));
  await page.waitForTimeout(1200);assert.ok(await damage(page)>before,'Cérbero morde');checks.push('Cérbero');
  await page.evaluate(()=>{for(const [id,value] of [['ground','light'],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}});
  await page.waitForTimeout(300);await page.evaluate(()=>{NecromancerV2.world.paused=true;});await shot('horda-light-low');
  checks.push('horda em chão claro e qualidade baixa');
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  return {classId:'necromancer',checks,errors,remote};
 }finally{await ctx.close();}
}
async function finish(h,checks){assert.deepEqual(h.errors,[]);assert.deepEqual(h.remote,[]);return {checks,errors:h.errors,remote:h.remote};}

(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const results=[await druid(browser),await mage(browser),await necro(browser)];
 const result={ok:true,results};fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
