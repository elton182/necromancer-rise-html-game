'use strict';
// Editor de mapas da campanha no navegador: pinta relevo e rio, muda estilo, salva sozinho, recarrega e confere no jogo.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,'../../review/v2/map-editor'),file=process.env.NR_TEST_DISTRIBUTION||path.resolve(__dirname,'../necromancer-3d.html');
(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});const result={};try{
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const boot=async()=>{await page.goto(pathToFileURL(file).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:180000});};
 const maps=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('necromancer_v2_maps')||'{"maps":[]}').maps);
 await boot();
 await page.getByRole('button',{name:'Editor de mapas',exact:true}).click();
 await page.waitForSelector('#maps-content [data-slot="trail"]');
 result.slots=await page.locator('#maps-content [data-slot]').count();assert.equal(result.slots,8,'oito mapas da campanha');
 await page.locator('#maps-content [data-slot="trail"]').getByRole('button',{name:'Editar',exact:true}).click();
 await page.waitForSelector('#map-editor[open]');
 result.tools=await page.locator('#map-editor [data-tool]').count();assert.ok(result.tools>=70,'paleta com muitas peças: '+result.tools);
 await page.waitForTimeout(500);
 const box=await page.locator('#map-editor .me-pane canvas').first().boundingBox(),at=(u,v)=>[box.x+box.width*u,box.y+box.height*v];
 const stroke=async(tool,from,to,steps=12)=>{await page.locator(`#map-editor [data-tool="${tool}"]`).click();const a=at(...from),b=at(...to);await page.mouse.move(a[0],a[1]);await page.mouse.down();await page.mouse.move(b[0],b[1],{steps});await page.mouse.up();};
 // Rio largo e fundo atravessando o mapa, morro à esquerda, lama e uma ponte.
 await page.getByLabel('Rio: largura').fill('8');await page.getByLabel('Rio: fundura').fill('1.6');
 await stroke('river',[.15,.5],[.85,.42]);
 await page.getByLabel('Força').fill('.8');await stroke('raise',[.3,.25],[.35,.3],6);
 await stroke('surface-5',[.6,.75],[.75,.78],8);
 await stroke('bridge',[.42,.42],[.55,.54]);
 // Spawn: composição com dois tipos, gatilho por proximidade e duas ondas.
 await stroke('spawn',[.5,.2],[.5,.2],1);
 await page.locator('#map-editor .me-side').getByRole('button',{name:'+ Tipo',exact:true}).click();
 await page.getByLabel('Quando').first().selectOption('near');
 await page.getByLabel('Ondas',{exact:true}).fill('2');await page.keyboard.press('Tab');
 // Estilo: predefinição de entardecer; aumentar o mapa.
 await page.locator('#map-editor .me-side select').filter({hasText:'Aplicar predefinição'}).selectOption('dusk');
 await page.locator('#map-editor .me-side').getByRole('button',{name:'+ 20 u',exact:true}).click();
 // Salvamento automático, sem clicar em Salvar.
 await page.waitForFunction(()=>{const m=JSON.parse(localStorage.getItem('necromancer_v2_maps')||'{"maps":[]}').maps.find(x=>x.id==='campaign-trail');return m&&m.style&&m.terrain&&m.size;},null,{timeout:8000});
 const saved=(await maps()).find(m=>m.id==='campaign-trail');
 result.saved={rivers:saved.terrain.rivers.length,campaign:saved.campaign,style:saved.style.sky,size:saved.size,objects:saved.objects.length,spawns:saved.spawns.length};
 assert.equal(saved.terrain.rivers.length,1);assert.equal(saved.campaign,'trail');assert.ok(saved.objects.some(o=>o.type==='bridge'),'ponte salva');assert.ok(saved.spawns.some(s=>s.waves===2&&s.trigger==='near'&&new Set(s.mix).size>=1));
 await page.waitForTimeout(1600);await page.screenshot({path:path.join(dir,'editor-terrain.png')});
 const problems=await page.locator('#map-editor .me-side').innerText();result.verification=/Verificação/i.test(problems);
 await page.locator('#map-editor').getByRole('button',{name:'Fechar',exact:true}).click();await page.waitForSelector('#map-editor',{state:'hidden'});
 // Recarrega: a edição continua e aparece na lista como editada.
 await boot();await page.getByRole('button',{name:'Editor de mapas',exact:true}).click();await page.waitForSelector('#maps-content [data-slot="trail"]');
 const row=page.locator('#maps-content .maps-row').filter({has:page.locator('[data-slot="trail"]')});assert.match(await row.innerText(),/editado/);
 assert.ok(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('necromancer_v2_maps')).maps.find(x=>x.id==='campaign-trail').terrain));
 // Testar: entra no mapa; água, altura e colisão valem em jogo.
 await page.locator('#maps-content [data-slot="trail"]').getByRole('button',{name:'Testar',exact:true}).click();
 await page.waitForFunction(()=>window.NecromancerV2?.world?.adventure?.kind==='custom-map',null,{timeout:30000});
 const game=await page.evaluate(()=>{const w=window.NecromancerV2.world,a=w.arena,b=a.terrain,find=test=>{for(let y=a.bounds.minY+1;y<a.bounds.maxY;y+=1)for(let x=a.bounds.minX+1;x<a.bounds.maxX;x+=1)if(test(x,y))return {x,y};return null;};
  const blocked=a.solids.filter(s=>s.terrainBlock).length;const ix=(x,y)=>{const i=Math.round((y-b.y0)/b.cell)*b.cols+Math.round((x-b.x0)/b.cell);return b.h[i];};
  return {blocked,hasWater:b.hasWater,bridges:b.bridges.length,kit:a.kitProps.length,style:a.style?.sky,deep:find((x,y)=>ix(x,y)<-.8),hill:find((x,y)=>ix(x,y)>.8),mud:find((x,y)=>{const i=Math.round((y-b.y0)/b.cell)*b.cols+Math.round((x-b.x0)/b.cell);return b.s[i]===5;})};});
 Object.assign(result,{game});assert.ok(game.blocked>0&&game.hasWater&&game.bridges===1,'colisão de água e ponte');assert.ok(game.hill,'morro no jogo');assert.ok(game.mud,'lama no jogo');
 await page.evaluate(p=>{const w=window.NecromancerV2.world;Object.assign(w.player,p);w.aim={x:p.x+3,y:p.y};},{x:game.deep.x-7,y:game.deep.y});await page.waitForTimeout(1500);
 await page.screenshot({path:path.join(dir,'game-river-dusk.png')});
 result.chip=await page.evaluate(p=>{const w=window.NecromancerV2.world;const b=w.arena.terrain;Object.assign(w.player,{x:p.x,y:p.y});return null;},game.mud);await page.waitForTimeout(400);result.chip=await page.locator('#terrain-chip').innerText();assert.match(result.chip,/Lama/);
 // Borda do mapa com relevo, zoom máximo, chão claro e qualidade baixa: o piso continua além dos limites.
 await page.evaluate(()=>{const n=window.NecromancerV2,w=n.world,b=w.arena.bounds;Object.assign(w.player,{x:b.maxX-3,y:b.maxY-3});n.view.zoom(1400);n.view.ground(true);n.view.quality(true);});await page.waitForTimeout(1500);await page.screenshot({path:path.join(dir,'edge-light-low.png')});
 result.frame=await page.evaluate(()=>new Promise(res=>{let n=0,t=performance.now();const f=()=>{if(++n===20)res((performance.now()-t)/20);else requestAnimationFrame(f);};requestAnimationFrame(f);}));
 result.errors=errors;assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(dir,'browser-result.json'),JSON.stringify(result,null,1));console.log(JSON.stringify(result,null,1));
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
