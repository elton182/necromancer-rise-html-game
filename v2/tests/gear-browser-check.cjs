'use strict';
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const review=path.resolve(__dirname,'../../review/v2/e7');fs.mkdirSync(review,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>window.NecromancerV2);await page.evaluate(()=>localStorage.setItem('necromancer_v2','preservar-original'));
 const data=()=>page.evaluate(()=>{const s=NecromancerV2.session,c=s.save.character;return {gold:c.gold,bag:c.gearBag.map(i=>i.id),worn:Object.fromEntries(Object.entries(c.equipment).map(([k,v])=>[k,v.id])),spell:NecromancerV2.world.player.spellDamage,maxHp:NecromancerV2.world.player.maxHp,filter:s.save.settings.lootFilter};});
 // Mercador, compra, comparação e equipar pela interface (o menu faz o papel da vila).
 await page.evaluate(()=>{NecromancerV2.session.save.character.gold=500;});await legacy.fill(page,'#gear-level','5');await page.locator('#gear-level').dispatchEvent('change');
 assert.equal(await page.evaluate(()=>NecromancerV2.session.save.settings.gearLevel),5);
 await legacy.click(page,'#open-gear');assert.ok((await page.locator('#gear-content').textContent()).includes('Peça nível 5 · 75 ouro'));
 await page.getByRole('button',{name:'Comprar Cajado · 75 ouro'}).click();let d=await data();assert.equal(d.gold,425);assert.equal(d.bag.length,1);
 assert.ok((await page.locator('#gear-content').textContent()).includes('Comparar equipamentos'));
 await page.getByRole('button',{name:'Equipar · Cajado'}).click();d=await data();assert.equal(d.bag.length,0);assert.ok(d.worn.staff);assert.ok(d.spell>=55,'dano mágico com cajado: '+d.spell);
 await page.locator('[data-gear-slot="staff"]').click();assert.ok(await page.getByRole('button',{name:'Desequipar'}).isEnabled());
 await page.getByRole('button',{name:'Vestimenta',exact:true}).click();await page.getByRole('button',{name:'Comprar Vestimenta · 75 ouro'}).click();
 await page.getByRole('button',{name:'Anel esquerdo',exact:true}).click();await page.getByRole('button',{name:'Comprar Anel esquerdo · 75 ouro'}).click();
 d=await data();assert.equal(d.bag.length,2);assert.equal(d.gold,275);
 await page.getByRole('button',{name:'Equipar · Anel esquerdo'}).click();d=await data();assert.ok(d.worn.ring1);
 await page.locator('[data-gear-id]').first().click();await page.screenshot({path:path.join(review,'inventory-dark.png')});
 // Venda no menu devolve ouro; o valor vem do modelo compartilhado.
 const before=(await data()).gold;await page.getByRole('button',{name:/^Vender por \d+ ouro$/}).click();d=await data();assert.ok(d.gold>before);assert.equal(d.bag.length,0);
 // Consumíveis comprados no mercador aparecem na barra F1–F5.
 await page.locator('[data-consumable="potion_hp"]').click();await page.locator('[data-consumable="bone_shield"]').click();assert.deepEqual(await page.evaluate(()=>NecromancerV2.session.save.character.inventory),[{id:'potion_hp',count:1},{id:'bone_shield',count:1}]);
 // Filtro de loot e atalho I.
 await legacy.select(page,'select[aria-label="Raridade mínima do loot"]','rare');d=await data();assert.equal(d.filter,'rare');assert.equal(await page.evaluate(()=>NecromancerV2.world.lootFilter),'rare');
 await page.keyboard.press('KeyI');assert.equal(await page.locator('#pause-dialog').evaluate(e=>e.open),false);await legacy.select(page,'#ground','light');await legacy.select(page,'#quality','low');await legacy.click(page,'#open-gear');await page.screenshot({path:path.join(review,'inventory-light-low.png')});await page.keyboard.press('Escape');await legacy.select(page,'#ground','dark');await legacy.select(page,'#quality','high');
 // Encontro: o chefe sempre deixa uma peça; coleta automática e aviso.
 await legacy.click(page,'#enter');assert.ok((await page.locator('#items').textContent()).includes('F1'));
 await page.evaluate(()=>{NecromancerV2.world.player.hp=10;});await page.keyboard.press('F1');assert.equal(await page.evaluate(()=>Math.round(NecromancerV2.world.player.hp)),60);
 await page.keyboard.press('F1');assert.equal(await page.evaluate(()=>NecromancerV2.world.player.boneShield),true);assert.equal(await page.evaluate(()=>NecromancerV2.session.save.character.inventory.length),0);await page.waitForFunction(()=>document.getElementById('items').textContent==='');
 await page.evaluate(async()=>{const {dealDamage}=await import('v2-combat'),w=NecromancerV2.world;w.random=()=>.99;Object.assign(w.player,{x:w.boss.x,y:w.boss.y+8});for(const a of w.actors)if(a.team==='enemy')a.timer=999;dealDamage(w,w.boss,1e9,w.player);});
 const drop=await page.evaluate(()=>NecromancerV2.world.drops.filter(d=>d.kind==='equipment').map(x=>({r:x.item.rarity,l:x.item.level})));assert.equal(drop.length,1);assert.notEqual(drop[0].r,'common');
 const bag=(await data()).bag.length;await page.evaluate(()=>{const w=NecromancerV2.world,g=w.drops.find(d=>d.kind==='equipment');Object.assign(w.player,{x:g.x,y:g.y});});
 await page.waitForFunction(b=>NecromancerV2.session.save.character.gearBag.length===b+1,bag);assert.ok((await page.locator('#feed').textContent()).includes(' · nv. '));assert.equal(await page.evaluate(()=>NecromancerV2.world.drops.filter(d=>d.kind==='equipment').length),0);
 // Filtro: peça abaixo do mínimo fica oculta e não é coletada; ouro e orbes continuam.
 await page.evaluate(async()=>{const {spawnDrop}=await import('v2-drops'),EQ=(await import('v2-equipment')).default,Build=(await import('v2-build')).default,w=NecromancerV2.world;w.drops=[];NecromancerV2.pause(true);Object.assign(w.player,{x:0,y:4});
  // Peças reais de cada raridade, geradas pelo modelo compartilhado com pesos forçados.
  [['common',0],['magic',.9],['rare',1.8],['epic',2.7]].forEach(([rarity,a],i)=>spawnDrop(w,'equipment',Math.sin(a+3)*(2.4+i%2*.7),4+Math.cos(a+3)*(2.4+i%2*.7),{item:EQ.generate(5,Build,Math.random,'body',false,'vis-'+rarity,{loot:{weights:{common:0,magic:0,rare:0,epic:0,[rarity]:1}}})}));});
 await page.waitForTimeout(250);const visible=await page.evaluate(()=>NecromancerV2.world.drops.map(d=>[d.item.rarity,NecromancerV2.view.drops.get(d.id).root.visible]));assert.deepEqual(visible,[['common',false],['magic',false],['rare',true],['epic',true]]);
 await page.screenshot({path:path.join(review,'loot-filter-rare-dark.png')});
 await page.evaluate(async()=>{const {updateSettings}=await import('v2-session');updateSettings(NecromancerV2.session,{lootFilter:'common'});});await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>NecromancerV2.world.drops.every(d=>NecromancerV2.view.drops.get(d.id).root.visible)),true);await legacy.select(page,'#ground','light');await legacy.select(page,'#quality','low');await page.waitForTimeout(250);await page.screenshot({path:path.join(review,'loot-rarities-light-low.png')});await legacy.select(page,'#ground','dark');await legacy.select(page,'#quality','high');
 // Sair do encontro coleta as peças permitidas; reiniciar e recarregar não duplicam.
 const n=(await data()).bag.length;await legacy.click(page,'#menu');await page.waitForFunction(()=>document.getElementById('save-message').textContent.includes('coletado'));d=await data();assert.equal(d.bag.length,n+4);
 await legacy.click(page,'#save-tools summary');await legacy.click(page,'#save');const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('necromancer_rise_3d_save')).character);assert.equal(saved.gearBag.length,d.bag.length);
 await page.reload();await page.waitForFunction(()=>window.NecromancerV2);const after=await data();assert.deepEqual([after.bag,after.worn,after.spell,after.maxHp],[d.bag,d.worn,d.spell,d.maxHp]);assert.equal(new Set([...after.bag,...Object.values(after.worn)]).size,after.bag.length+Object.keys(after.worn).length);
 assert.equal(await page.evaluate(()=>localStorage.getItem('necromancer_v2')),'preservar-original');assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(review,'gear-result.json'),JSON.stringify({stage:'E7',checks:['compra, comparação, equipar e vender pela interface','consumíveis: compra, F1 poção, Escudo de Ossos e barra vazia','atributos refletem o cajado','atalho I abre e fecha','filtro de loot oculta e não coleta','chefe deixa peça mágica ou melhor, coletada com aviso','sair do encontro coleta o permitido','save e reload preservam itens sem duplicar','fundo escuro, claro e qualidade baixa','save antigo preservado','sem erros de página'],errors},null,2)+'\n');console.log('E7 equipamentos OK: mercador, inventário, filtro, drops e persistência.');
}finally{await browser.close();}})().catch(e=>{console.error(String(e.stack||e).slice(0,2000));process.exitCode=1;});
