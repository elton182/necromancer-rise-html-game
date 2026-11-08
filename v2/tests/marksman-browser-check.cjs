// Arqueira e Mercenário no navegador: criação pelo Novo personagem, modelo, tiro real, perfuração,
// esquiva, árvore pela interface, as quatro habilidades de cada classe, equipamento, chão claro e qualidade baixa.
// Requer Playwright e Edge com WebGL 2 (perfil isolado por classe). Evidências em review/v2/marksman/.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,'../../review/v2/marksman');
const shot=async(page,name)=>{for(let i=0;i<3;i++){try{await page.screenshot({path:path.join(dir,name)});return;}catch(e){if(i===2)throw e;await page.waitForTimeout(300);}}};
async function run(browser,classId,label,name){
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage(),errors=[],remote=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
 try{
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.waitForFunction(()=>!document.getElementById('loading'));
 // Novo personagem: cinco classes; a escolhida mostra o modelo real e os atributos do nível 1.
 await page.click('[data-title="campaign"]');assert.equal(await page.locator('.class-choice').count(),6);
 await page.locator('.class-choice[data-class="'+classId+'"]').click();await page.waitForSelector('.journeys-stage[data-ready="true"]',{timeout:30000});
 assert.match(await page.locator('.class-choice[data-class="'+classId+'"]').innerText(),new RegExp(label));
 await page.waitForTimeout(500);await shot(page,classId+'-selection.png');checks.push('seleção');
 await page.locator('#character-name').fill(name);await page.getByRole('button',{name:'Iniciar jornada',exact:false}).click();await page.waitForFunction(()=>NecromancerV2.session.scene!=='menu');
 assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.classId),classId);
 await page.evaluate(()=>{NecromancerV2.go('training');});await page.waitForFunction(()=>NecromancerV2.session.scene==='training');
 const model=classId==='archer'?'archerHero':'mercenary';
 assert.equal(await page.evaluate(()=>NecromancerV2.world.player.model),model);
 assert.equal(await page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='ally').length),0,'sem horda');
 assert.match(await page.locator('[data-hud-slot="0"]').innerText(),classId==='archer'?/Disparo/:/Virote/);
 assert.match(await page.locator('[data-hud-slot="1"]').innerText(),/Libere na árvore/);assert.equal(await page.evaluate(()=>NecromancerV2.slot(1)),false,'bloqueada sem selo');
 assert.match(await page.locator('#mp-vessel .vessel-caption span').innerText(),classId==='archer'?/foco/i:/vigor/i);checks.push('HUD');
 // Campo controlado: alvos parados e alinhados à frente do atirador.
 await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.boss.hp=0;w.actors=w.actors.filter(a=>a===p||a.team==='enemy'&&a!==w.boss);w.actors.filter(a=>a.team==='enemy').forEach((e,i)=>{Object.assign(e,{x:p.x+(i<4?0:(i-5)*1.4),y:p.y-4-(i<4?i*1.6:6),dummy:true,hp:5000,maxHp:5000});});w.aim={x:p.x,y:p.y-8};p.mp=p.maxMp;});
 const hits=()=>page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy'&&a.hp<a.maxHp).length);
 // Captura com o projétil no meio do voo (1,5 u depois da soltura), antes do primeiro alvo.
 await page.evaluate(()=>NecromancerV2.slot(0));
 await page.waitForFunction(()=>{const w=NecromancerV2.world;const flying=w.marksmanShots?.length&&w.marksmanShots[0].remaining<(w.classId==='archer'?11.5:10.5),landed=w.actors.some(a=>a.team==='enemy'&&a.hp<a.maxHp);if(flying||landed){w.paused=true;return true;}return false;},null,{timeout:5000});
 await page.waitForTimeout(250);await shot(page,classId+'-shot.png');
 const pose=await page.evaluate(()=>NecromancerV2.world.player.pose?.anim||NecromancerV2.world.player.animation);
 await page.evaluate(()=>{NecromancerV2.world.paused=false;});await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction&&!NecromancerV2.world.marksmanShots.length,null,{timeout:5000});
 assert.equal(pose,'shoot');const hit=await hits();
 assert.equal(hit,classId==='archer'?1:3,classId==='archer'?'a flecha para no primeiro':'o virote atravessa três em fila');checks.push(classId==='archer'?'flecha':'virote perfurante');
 // Movimento travado durante o tiro e esquiva cancelando antes da soltura.
 await page.waitForTimeout(900);
 const moved=await page.evaluate(()=>{const w=NecromancerV2.world,p=w.player,x=p.x;NecromancerV2.slot(0);return {x,started:!!w.marksmanAction};});assert.ok(moved.started);
 // Andando enquanto atira: o tronco toca o tiro e as pernas, a passada (camadas do renderizador).
 await page.keyboard.down('KeyD');await page.waitForFunction(x0=>{const w=NecromancerV2.world,p=w.player;return !!w.marksmanAction&&p.animation==='walk'&&Math.abs(p.x-x0)>.25;},moved.x,{timeout:3000});
 const layer=await page.evaluate(()=>{const live=x=>x?.isScheduled()?x.getEffectiveWeight():0,w=NecromancerV2.world,p=w.player,o=NecromancerV2.view.actors.get(p.id);return {x:p.x,pose:p.pose,animation:p.animation,state:o.state,upper:live(o.upper[p.pose?.anim]),full:live(o.actions.shoot),walk:live(o.lower.walk)+live(o.lower.strafe_left)+live(o.lower.strafe_right)};});
 await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(200);await shot(page,classId+'-shoot-moving.png');await page.evaluate(()=>{NecromancerV2.world.paused=false;});
 await page.keyboard.up('KeyD');
 assert.ok(Math.abs(layer.x-moved.x)>.2,'anda durante o tiro');assert.equal(layer.pose?.upper,true);assert.equal(layer.animation,'walk');assert.equal(layer.state,'layer');assert.ok(layer.upper>.5,'tronco com o tiro');assert.ok(layer.full<.05,'sem o clipe de corpo inteiro');assert.ok(layer.walk>.5,'pernas com a passada');
 checks.push('atira andando');
 // Tecla 1 (ou botão esquerdo) segurada: continua atirando no ritmo da recarga enquanto anda.
 await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction,null,{timeout:5000});await page.evaluate(()=>{NecromancerV2.world.marksmanCooldowns={};});
 const held=await page.evaluate(()=>({id:NecromancerV2.world.player.actionId,x:NecromancerV2.world.player.x,y:NecromancerV2.world.player.y}));
 await page.evaluate(()=>{const w=NecromancerV2.world;w.aim={x:w.player.x,y:w.player.y-8};});await page.keyboard.down('Digit1');await page.keyboard.down('KeyA');await page.waitForTimeout(1400);await page.keyboard.up('KeyA');await page.keyboard.up('Digit1');
 const after=await page.evaluate(()=>({id:NecromancerV2.world.player.actionId,x:NecromancerV2.world.player.x,y:NecromancerV2.world.player.y}));
 assert.ok(after.id-held.id>=2,'tiros seguidos com a tecla segurada: '+(after.id-held.id));assert.ok(Math.hypot(after.x-held.x,after.y-held.y)>2,'andou enquanto atirava');
 checks.push('tiro contínuo segurando o tiro');
 await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction,null,{timeout:5000});await page.waitForTimeout(900);
 await page.evaluate(()=>NecromancerV2.slot(0));await page.keyboard.press('KeyC');
 await page.waitForFunction(()=>NecromancerV2.world.dash.remaining>0);assert.equal(await page.evaluate(()=>NecromancerV2.world.marksmanAction),null);
 await page.waitForTimeout(160);await shot(page,classId+'-dodge.png');checks.push('esquiva');
 await page.waitForFunction(()=>NecromancerV2.world.dash.remaining<=0);
 // Relicário: equipamentos (modelo da classe, sem espada nem escudo) e aba de habilidades.
 await page.evaluate(()=>NecromancerV2.ui.show('equipment'));await page.waitForSelector('.inv-model[data-drawn="true"]',{timeout:20000});
 const slots=await page.evaluate(()=>[...document.querySelectorAll('[data-gear-slot]')].map(b=>b.dataset.gearSlot).sort());
 const weapon=classId==='archer'?'bow':'crossbow';
 assert.deepEqual(slots,['body','boots','head','ring1','ring2',weapon].sort());
 assert.equal(await page.evaluate(w=>NecromancerV2.session.save.character.equipment[w]?.classId,weapon),classId,'arma inicial equipada');
 await page.locator('[data-gear-slot="'+weapon+'"]').click();await page.waitForTimeout(200);
 assert.match(await page.locator('.gear-detail').innerText(),classId==='archer'?/Arco/:/Besta/);
 await page.waitForTimeout(300);await shot(page,classId+'-equipment.png');checks.push('equipamentos e arma inicial');
 // Árvore da classe: os três pontos do nível 1 investidos pela interface.
 const learn=classId==='archer'?[['pierce','Flecha Perfurante'],['leap','Recuo'],['shot','Disparo']]:[['volley','Rajada'],['bomb','Bomba de fragmentação'],['quarrel','Virote pesado']];
 await page.evaluate(()=>NecromancerV2.ui.show('skills'));await page.waitForSelector('[data-warrior-node="'+learn[0][0]+'"]');
 for(const [id,label] of learn){await page.locator('[data-warrior-node="'+id+'"]').click();await page.getByRole('button',{name:'Aprender '+label,exact:true}).click();}
 assert.deepEqual(await page.evaluate(ids=>ids.map(id=>NecromancerV2.session.save.character.marksmanRanks[id]),learn.map(l=>l[0])),[1,1,1]);
 await page.locator('[data-warrior-node="'+learn[1][0]+'"]').click();await page.waitForTimeout(200);await shot(page,classId+'-tree.png');checks.push('árvore');
 assert.equal(await page.locator('[data-menu-tab="horde"]').isHidden(),true);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!NecromancerV2.world.paused);
 // Selos de nível alto liberados direto no mundo, só para conferir os efeitos.
 await page.evaluate(id=>{const w=NecromancerV2.world;Object.assign(w.marksmanRanks,id==='archer'?{rain:1,fan:1,ambush:1}:{mine:1,firebomb:1,shrapnel:1});},classId);
 const reset=()=>page.evaluate(()=>{const w=NecromancerV2.world,p=w.player;w.marksmanCooldowns={};p.mp=p.maxMp;const foes=w.actors.filter(a=>a.team==='enemy');foes.forEach((e,i)=>Object.assign(e,{x:p.x+(i<4?0:(i%2?1:-1)*(1+.6*(i-4))),y:p.y-4.5-(i<4?i*1.3:1+.4*(i-4)),hp:5000,maxHp:5000,dummy:true,slow:0,slowTime:0}));w.aim={x:p.x,y:p.y-6.6};});
 const damage=()=>page.evaluate(()=>NecromancerV2.world.actors.filter(a=>a.team==='enemy').reduce((t,a)=>t+a.maxHp-a.hp,0));
 // Inicia a ação, pausa quando a condição vale e captura; depois espera tudo terminar.
 async function frozen(name,slot,until){
  await reset();const before=await damage();assert.ok(await page.evaluate(i=>NecromancerV2.slot(i),slot),name+' iniciou');
  await page.waitForFunction(until,null,{timeout:6000});await page.evaluate(()=>{NecromancerV2.world.paused=true;});
  await page.waitForTimeout(250);await shot(page,classId+'-'+name+'.png');await page.evaluate(()=>{NecromancerV2.world.paused=false;});
  await page.waitForFunction(()=>{const w=NecromancerV2.world;return !w.marksmanAction&&!w.marksmanShots.length&&!w.marksmanLobs.length&&!w.marksmanZones.length;},null,{timeout:8000});
  await page.waitForTimeout(150);return (await damage())-before;
 }
 if(classId==='archer'){
  assert.ok(await frozen('pierce',1,()=>NecromancerV2.world.marksmanShots.length>0&&NecromancerV2.world.marksmanShots[0].remaining<14)>0,'Perfurante causa dano');
  const start=await page.evaluate(()=>({...NecromancerV2.world.player}));
  await frozen('leap',2,()=>NecromancerV2.world.marksmanAction?.time>.2);
  const end=await page.evaluate(()=>NecromancerV2.world.player);assert.ok(end.y-start.y>3,'Recuo afasta da mira');
  await page.evaluate(()=>{const p=NecromancerV2.world.player;p.y-=4;});
  assert.ok(await frozen('rain',4,()=>NecromancerV2.world.marksmanZones[0]?.left<4)>0,'Chuva causa dano');
  assert.ok(await frozen('fan',5,()=>NecromancerV2.world.marksmanShots.length===5&&NecromancerV2.world.marksmanShots[0].remaining<8.5)>0,'Leque causa dano');
  // Falcão: selo pela interface não cabe no nível 1 (requer nível 2); liberado direto no mundo.
  await reset();await page.evaluate(()=>{const w=NecromancerV2.world;w.marksmanRanks.falcon=1;});
  await page.waitForFunction(()=>NecromancerV2.world.falcon&&NecromancerV2.world.falcon.state==='dive',null,{timeout:8000});
  await page.waitForTimeout(120);await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot(page,classId+'-falcon-dive.png');await page.evaluate(()=>{NecromancerV2.world.paused=false;});
  assert.equal(await page.evaluate(()=>NecromancerV2.world.player.model),'archerHero');
  assert.match(await page.locator('#warrior-stance').innerText(),/FALCÃO/);
  await page.waitForFunction(()=>NecromancerV2.world.falcon.state!=='dive',null,{timeout:5000});
  const marked=await page.evaluate(()=>{const w=NecromancerV2.world,e=w.actors.find(a=>a.team==='enemy'&&a.hp>0);w.aim={x:e.x,y:e.y};return e.id;});
  await page.keyboard.press('KeyF');await page.waitForFunction(id=>NecromancerV2.world.actors.find(a=>a.id===id)?.falconMark>NecromancerV2.world.time,marked,{timeout:5000});
  await page.waitForTimeout(150);await shot(page,classId+'-falcon-mark.png');
  checks.push('Flecha Perfurante','Recuo','Chuva de Flechas','Leque','Falcão (automático, F e marca)');
 }else{
  assert.ok(await frozen('volley',1,()=>NecromancerV2.world.marksmanAction?.fired>=2)>0,'Rajada causa dano');
  assert.ok(await frozen('bomb',2,()=>NecromancerV2.world.marksmanLobs[0]?.time>.3)>0,'Bomba causa dano');
  await reset();await page.evaluate(()=>{NecromancerV2.slot(2);});await page.waitForFunction(()=>NecromancerV2.world.effects.some(e=>e.fx==='groundBreak'),null,{timeout:5000});await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot(page,classId+'-bomb-blast.png');await page.evaluate(()=>{NecromancerV2.world.paused=false;});
  await page.waitForFunction(()=>!NecromancerV2.world.marksmanAction&&!NecromancerV2.world.marksmanLobs.length);
  // Mina: assentada longe dos alvos, arma e explode quando um deles se aproxima.
  await reset();await page.evaluate(()=>{const w=NecromancerV2.world;w.aim={x:w.player.x,y:w.player.y+5};NecromancerV2.slot(4);});
  await page.waitForFunction(()=>{const w=NecromancerV2.world;return w.marksmanMines.length&&w.time>w.marksmanMines[0].armAt+.1;},null,{timeout:5000});
  await page.evaluate(()=>{NecromancerV2.world.paused=true;});await page.waitForTimeout(250);await shot(page,classId+'-mine.png');
  const before=await damage();await page.evaluate(()=>{const w=NecromancerV2.world,m=w.marksmanMines[0],e=w.actors.find(a=>a.team==='enemy');Object.assign(e,{x:m.x+1,y:m.y});w.paused=false;});
  await page.waitForFunction(()=>!NecromancerV2.world.marksmanMines.length,null,{timeout:5000});assert.ok(await damage()>before,'Mina explode');
  assert.ok(await frozen('firebomb',5,()=>NecromancerV2.world.marksmanZones.some(z=>z.kind==='fire'&&z.next>NecromancerV2.world.time+.2))>0,'Garrafa causa dano');
  checks.push('Rajada','Bomba','Mina','Garrafa incendiária');
 }
 // Chão claro e qualidade baixa, atirando.
 await page.evaluate(()=>{for(const [id,value] of [['ground','light'],['quality','low']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}});
 await page.evaluate(()=>{const w=NecromancerV2.world;w.marksmanCooldowns={};NecromancerV2.slot(0);});
 await page.waitForFunction(()=>NecromancerV2.world.marksmanShots?.length>0,null,{timeout:5000});await page.waitForTimeout(60);await shot(page,classId+'-light-low.png');checks.push('chão claro e qualidade baixa');
 // Sons novos num contexto WebAudio real: cada efeito precisa executar sem exceção.
 const played=await page.evaluate(()=>['bowShot','crossbowShot','bombThrow','powderBlast','mineArm','fireIgnite','falconCry'].map(id=>[id,NecromancerV2.audio.play(id)]));
 assert.deepEqual(played.filter(([,ok])=>!ok),[],'todos os sons tocaram');checks.push('sons');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 return {classId,checks,errors,remote};
 }finally{await ctx.close();}
}
(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const results=[await run(browser,'archer','Arqueira','Iara'),await run(browser,'mercenary','Mercenário','Bento')];
 const result={ok:true,results};fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
