'use strict';
// Construção direto no 3D, pelo mouse: colocar, selecionar, mover, esticar, girar, desfazer e copiar peça herdada; a cena refaz só o que mudou.
// Usa uma pasta temporária de mapas, sem tocar em v2/assets/maps/.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createEditorServer}=require('../tools/map-editor-server.cjs');
const review=path.resolve(__dirname,'../../review/v2/map-editor-3d');
(async()=>{
 fs.mkdirSync(review,{recursive:true});
 const mapsDir=fs.mkdtempSync(path.join(os.tmpdir(),'nr-editor-')),instance=createEditorServer({mapsDir}),port=await instance.listen(0);
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}),result={};
 try{
  const page=await (await browser.newContext({viewport:{width:1440,height:900}})).newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:'+port+'/');await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:180000});
  const E='window.NecromancerMapEditor.editor';
  const doc=()=>page.evaluate(E+'.current'),selection=()=>page.evaluate(E+'.selection'),stats=()=>page.evaluate(E+'.metrics()');
  const at=(x,y,up=0)=>page.evaluate(([x,y,up])=>window.NecromancerMapEditor.editor.project(x,y,up),[x,y,up]);
  const settle=async()=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));};
  const click=async p=>{await page.mouse.move(p.x,p.y);await settle();await page.mouse.down();await page.mouse.up();await settle();};
  const dragTo=async(from,to,button='left')=>{await page.mouse.move(from.x,from.y);await settle();await page.mouse.down({button});await page.mouse.move((from.x+to.x)/2,(from.y+to.y)/2,{steps:3});await page.mouse.move(to.x,to.y,{steps:3});await page.mouse.up({button});await settle();};
  const tool=async id=>{const b=page.locator(`#map-editor [data-tool="${id}"]`);if(!await b.isVisible()){await page.getByLabel('Buscar peça').fill(await b.evaluate(e=>e.querySelector('span').textContent));}await b.click();await page.getByLabel('Buscar peça').fill('');};
  const open=async slot=>{await page.locator(`#maps-content [data-slot="${slot}"]`).getByRole('button',{name:'Editar',exact:true}).click();await page.waitForSelector('#map-editor[open]');await page.waitForFunction(E+'.metrics()?.updateMs>0',null,{timeout:180000});await settle();};
  const findOwn=async type=>(await doc()).objects.find(o=>o.type===type);

  await open('trail');
  assert.equal(await page.locator('.me-stage').getAttribute('data-view'),'3d','o cliente abre direto no 3D');
  // A câmera começa no início do mapa, (0,20): trabalha ao redor dele, em área livre da planta.
  const X=4,Y=26;
  // Colocar: clique no 3D põe a peça no ponto do chão.
  await tool('tent');await click(await at(X,Y));
  const tent=await findOwn('tent');assert.ok(tent,'a tenda foi colocada');assert.ok(Math.hypot(tent.x-X,tent.y-Y)<.6,'no ponto clicado: '+tent.x+','+tent.y);
  await tool('select');
  // Selecionar e mover arrastando.
  await click(await at(tent.x,tent.y,.8));assert.deepEqual(await selection(),{kind:'object',id:tent.id});
  await dragTo(await at(tent.x,tent.y,.8),await at(tent.x-3,tent.y,.8));
  const moved=await findOwn('tent');assert.ok(Math.abs(moved.x-(tent.x-3))<.6,'moveu: '+moved.x);assert.ok(Math.abs(moved.y-tent.y)<.6);
  // Alças: raio, altura e giro.
  await dragTo(await at(moved.x+moved.r,moved.y,.3),await at(moved.x+moved.r+1,moved.y,.3));
  const wider=await findOwn('tent');assert.ok(wider.r>moved.r+.5,'raio cresceu: '+wider.r);assert.ok(Math.abs(wider.x-moved.x)<.01,'o centro fica');
  const top=await at(wider.x,wider.y,wider.h);await dragTo(top,{x:top.x,y:top.y-50});
  const taller=await findOwn('tent');assert.ok(taller.h>wider.h+.3,'altura cresceu: '+taller.h);
  const reach=taller.r+.9;await dragTo(await at(taller.x+reach,taller.y,.3),await at(taller.x,taller.y-reach,.3));
  const turned=await findOwn('tent');assert.ok(Math.abs(turned.rot-90)<=4,'girou cerca de um quarto de volta: '+turned.rot);
  await page.screenshot({path:path.join(review,'selection-handles.png')});
  // Desfazer volta um passo por gesto.
  await page.keyboard.press('Control+z');assert.ok(!(await findOwn('tent')).rot,'Ctrl+Z desfaz o giro');await page.keyboard.press('Control+y');assert.equal((await findOwn('tent')).rot,turned.rot);
  // Muro desenhado arrastando; a alça estica um lado, com o oposto parado.
  await tool('wall');await dragTo(await at(-6,31),await at(0,31));
  const wall=await findOwn('wall');assert.ok(wall&&wall.w>4,'muro desenhado: '+wall?.w);await tool('select');
  await click(await at(wall.x,wall.y,.4));assert.equal((await selection()).id,wall.id);
  const left=wall.x-wall.w/2;await dragTo(await at(wall.x+wall.w/2,wall.y,.3),await at(wall.x+wall.w/2+3,wall.y,.3));
  const longer=await findOwn('wall');assert.ok(longer.w>wall.w+2,'esticou: '+longer.w);assert.ok(Math.abs(longer.x-longer.w/2-left)<.3,'o lado oposto ficou parado');
  // Giro livre em peça retangular, em qualquer ângulo: colisão e alças acompanham.
  const knob=await at(longer.x+longer.w/2+.9,longer.y,.3),aim=await at(longer.x+Math.cos(.55)*(longer.w/2+.9),longer.y-Math.sin(.55)*(longer.w/2+.9),.3);await dragTo(knob,aim);
  const diagonal=await findOwn('wall');assert.ok(diagonal.rot>15&&diagonal.rot<50,'muro em diagonal: '+diagonal.rot);assert.notEqual(diagonal.rot%15,0,'sem passos: '+diagonal.rot);
  const collision=await page.evaluate(async o=>{const m=await import('/v2/scripts/map-model.mjs'),t=await import('/v2/scripts/terrain.mjs'),a=m.toArena(m.normalizeMap({id:'t',name:'T',size:{w:200,h:200},objects:[o]}).map,{cover:false}),rad=o.rot*Math.PI/180,tip={x:o.x+Math.cos(rad)*(o.w/2-.2),y:o.y-Math.sin(rad)*(o.w/2-.2)},flat={x:o.x+o.w/2-.2,y:o.y};return {tip:t.overlaps(tip,.1,a),flat:t.overlaps(flat,.1,a)};},diagonal);assert.deepEqual(collision,{tip:true,flat:false},'a colisão segue o giro');
  await page.waitForTimeout(300);await page.screenshot({path:path.join(review,'wall-rotated.png')});
  // Com a tecla Shift, passos de 15°; a tecla R gira a selecionada.
  await page.keyboard.press('r');assert.equal((await findOwn('wall')).rot,diagonal.rot+15,'R gira 15°');await page.keyboard.press('Control+z');
  // Peça herdada: arrastar cria a cópia do mapa e oculta a da planta. Clique simples só seleciona.
  const inherited=await page.evaluate(async()=>{const m=await import('/v2/scripts/map-model.mjs');return m.builtinMap('builtin:arandu-trail').objects.filter(o=>o.type==='bush'&&o.y>14&&o.y<30)[0];});
  await page.keyboard.press('Escape');await click(await at(inherited.x,inherited.y,.3));const picked=await selection();assert.equal(picked?.id,inherited.id,'pega a peça herdada');assert.equal(picked.kind,'base');assert.ok(!(await doc()).hidden.includes(inherited.id),'selecionar não muda nada');
  const count=(await doc()).objects.length;await dragTo(await at(inherited.x,inherited.y,.3),await at(inherited.x+1.5,inherited.y,.3));
  const after=await doc();assert.ok(after.hidden.includes(inherited.id),'a da planta fica oculta');assert.equal(after.objects.length,count+1,'a cópia entra no mapa');
  // Botão direito gira a câmera sem tocar na seleção.
  const before=await page.evaluate(E+'.selection');const canvasBox=await page.locator('.mp-canvas').boundingBox();await dragTo({x:canvasBox.x+canvasBox.width/2,y:canvasBox.y+200},{x:canvasBox.x+canvasBox.width/2+80,y:canvasBox.y+200},'right');assert.deepEqual(await selection(),before);
  // Trilha de cantos retos: desenhada arrastando, com alças e giro como as demais peças retangulares.
  await tool('path_square');await dragTo(await at(-5,10),await at(-1,14));const trail=await findOwn('path_square');assert.ok(trail&&trail.w>3&&trail.d>3,'trilha desenhada: '+trail?.w+'x'+trail?.d);await tool('select');
  await click(await at(trail.x-trail.w/2+.6,trail.y));assert.equal((await selection()).id,trail.id);await page.keyboard.press('r');assert.equal((await findOwn('path_square')).rot,15,'gira');await page.keyboard.press('Control+z');await page.keyboard.press('Escape');
  await tool('erase');await click(await at(longer.x,longer.y,.4));assert.ok(!await findOwn('wall'),'a borracha remove a peça clicada');await page.keyboard.press('Control+z');assert.ok(await findOwn('wall'),'e o Ctrl+Z traz de volta');await tool('select');
  await page.evaluate(()=>{window.NecromancerMapEditor.editor.setTop(true);});await settle();await page.waitForTimeout(400);await page.screenshot({path:path.join(review,'top-view.png')});await page.evaluate(()=>{window.NecromancerMapEditor.editor.setTop(false);});await settle();
  await page.locator('#map-editor').getByRole('button',{name:'Fechar',exact:true}).click();await page.waitForSelector('#map-editor',{state:'hidden'});
  // O arquivo guarda o resultado.
  await page.waitForFunction(()=>!window.NecromancerMapEditor.store.pending());
  const file=JSON.parse(fs.readFileSync(path.join(mapsDir,'campaign-trail.json'),'utf8'));assert.equal(file.objects.find(o=>o.type==='tent').rot,turned.rot);assert.ok(file.hidden.includes(inherited.id));
  // Mundo de 360 u: mexer em uma peça não repinta o chão e custa uma fração da abertura.
  await open('world');const opened=await stats();
  const world=await page.evaluate(async()=>(await import('/v2/scripts/map-model.mjs')).builtinMap('builtin:campaign-world').start);
  await tool('rock');await click(await at(world.x+3,world.y+1));await tool('select');await settle();await page.waitForTimeout(200);
  const placed=await findOwn('rock');assert.ok(placed,'peça colocada no mundo');const add=await stats();
  await dragTo(await at(placed.x,placed.y,.4),await at(placed.x+2,placed.y,.4));await settle();await page.waitForTimeout(200);const drag=await stats();
  result.world={groundMs:Math.round(opened.groundMs),openUpdateMs:Math.round(opened.updateMs),addMs:Math.round(add.updateMs),dragMs:Math.round(drag.updateMs),dragLayers:drag.layers};
  assert.ok(add.layers<=2,'colocar refaz só a camada da peça: '+add.layers);assert.ok(drag.layers<=2,'só a camada da peça: '+drag.layers);assert.ok(drag.updateMs<opened.updateMs/3,'muito mais barato que abrir: '+drag.updateMs+' de '+opened.updateMs);
  await page.screenshot({path:path.join(review,'world-3d.png')});
  // A sombra de contato chega depois que a edição assenta.
  await page.waitForFunction(n=>window.NecromancerMapEditor.editor.metrics().groundBuilds>n,opened.groundBuilds,{timeout:120000});result.contactRefreshMs=Math.round((await stats()).groundMs);
  result.errors=errors;assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(review,'browser-result.json'),JSON.stringify(result,null,1));console.log(JSON.stringify(result,null,1));
 }finally{await browser.close();await instance.close();fs.rmSync(mapsDir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
