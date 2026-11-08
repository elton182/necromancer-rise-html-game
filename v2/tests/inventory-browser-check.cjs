'use strict';
// Inventário (aba Equipamentos): mochila 5×6, ficha da peça, prévia de atributos, arrastar para
// equipar, categorias, consumíveis e o modelo 3D real da classe; aba Personagem com o mesmo
// modelo, origem dos atributos, resumo e detalhes. Capturas em review/v2/inventory.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const dir=path.resolve(__dirname,'../../review/v2/inventory');fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>window.NecromancerV2);
 await page.evaluate(async()=>{const EQ=(await import('v2-equipment')).default,Build=(await import('v2-build')).default,s=NecromancerV2.session;
  for(const [type,rarity] of [['staff','epic'],['body','rare'],['ring1','magic']])s.save.character.gearBag.push(EQ.generate(5,Build,Math.random,type,false,'eq-ui-'+type,{loot:{weights:{common:0,magic:0,rare:0,epic:0,[rarity]:1}}}));
  s.save.character.inventory=[{id:'potion_hp',count:2}];NecromancerV2.ui.show('equipment');});
 await page.waitForSelector('#pause-dialog[open][data-tab="equipment"]');
 assert.equal(await page.locator('.gear-slot').count(),7);assert.equal(await page.locator('.gear-cell').count(),30);assert.equal(await page.locator('.gear-cell.filled').count(),3);
 await page.waitForSelector('.inv-model[data-ready="true"]',{timeout:30000});
 await page.locator('[data-gear-id="eq-ui-staff"]').click();await page.waitForSelector('.gear-stat-table th:has-text("Dif.")',{state:'attached'});
 assert.ok(await page.locator('.gear-item-comparison').isVisible());assert.ok(await page.locator('.inv-item.inv-rarity-epic').isVisible());
 assert.ok(await page.locator('tr[data-stat="spell"]').evaluate(e=>e.classList.contains('gear-stat-up')));assert.match(await page.locator('.inv-power').innerText(),/Poder de Combate/);
 await page.screenshot({path:path.join(dir,'inventory-selected.png')});
 await page.getByRole('button',{name:'Comparar com o equipado'}).click();assert.ok((await page.locator('.gear-detail').innerText()).includes('Comparar equipamentos'));
 await page.locator('[data-gear-id="eq-ui-staff"]').dragTo(page.locator('[data-gear-slot="staff"]'));await page.waitForFunction(()=>NecromancerV2.session.save.character.equipment.staff?.id==='eq-ui-staff');
 assert.equal(await page.locator('.gear-cell.filled').count(),2);assert.ok(await page.getByRole('button',{name:'Desequipar'}).isEnabled());
 await page.getByRole('button',{name:'Anéis'}).click();assert.equal(await page.locator('.gear-cell.filled').count(),1);
 await page.getByRole('button',{name:'Consumíveis'}).click();await page.locator('.inv-consumable-cell').click();assert.ok((await page.locator('.gear-detail').innerText()).includes('Poção'));
 await page.getByRole('button',{name:'Todos'}).click();await page.getByRole('button',{name:'Detalhes avançados'}).click();assert.ok(await page.locator('.inv-advanced .gear-skill-table').isVisible());
 await page.screenshot({path:path.join(dir,'inventory-advanced.png'),fullPage:true});
 await page.getByRole('button',{name:'Ocultar'}).click();await page.locator('[data-gear-slot="staff"]').click();
 await page.waitForSelector('.inv-model[data-drawn="true"]',{state:'attached',timeout:10000});const size=await page.locator('.inv-model canvas').evaluate(c=>[c.width,c.height]);assert.ok(size[0]>100&&size[1]>300,'palco 3D: '+size);
 await page.screenshot({path:path.join(dir,'inventory-equipped.png')});
 await page.click('[data-menu-tab="character"]');await page.waitForSelector('.chr-stage .inv-model[data-drawn="true"]',{state:'attached',timeout:10000});
 assert.equal(await page.locator('.chr-stat').count(),5);assert.equal(await page.locator('#gear-content .inv-model').count(),0,'um único modelo 3D, movido entre as abas');
 const spell=await page.evaluate(()=>NecromancerV2.world.player.spellDamage);assert.match(await page.locator('.chr-stat[data-stat="spell"] .chr-stat-value b').innerText(),new RegExp('^'+String(Math.round(spell*100)/100).replace('.',',')));
 assert.match(await page.locator('.chr-power').innerText(),/Poder de Combate/);assert.match(await page.locator('.chr-xp').innerText(),/XP/);
 await page.locator('.chr-stat[data-stat="defense"]').click();assert.match(await page.locator('.chr-info h4').innerText(),/Defesa/);await page.screenshot({path:path.join(dir,'character.png')});
 await page.getByRole('button',{name:'Detalhes'}).click();assert.ok(await page.locator('.chr-skill-table').isVisible());await page.screenshot({path:path.join(dir,'character-details.png')});
 await page.getByRole('button',{name:'Atributos'}).click();await page.locator('.chr-go[data-go="equipment"]').click();await page.waitForSelector('#pause-dialog[data-tab="equipment"] #gear-content .inv-model[data-drawn="true"]',{state:'attached'});await page.click('[data-menu-tab="character"]');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'sem rolagem horizontal no celular');await page.screenshot({path:path.join(dir,'character-mobile.png')});await page.click('[data-menu-tab="equipment"]');await page.waitForTimeout(300);await page.screenshot({path:path.join(dir,'inventory-mobile.png')});
 await page.setViewportSize({width:1600,height:900});await page.keyboard.press('Escape');await page.waitForSelector('#pause-dialog:not([open])',{state:'attached'});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({checks:['7 slots, 30 células, 3 peças','modelo 3D desenhado','prévia e Poder de Combate','comparação','arrastar para equipar','categorias e consumíveis','detalhes avançados','aba Personagem: 5 atributos, resumo, XP, detalhes e atalho','celular sem rolagem horizontal','sem erros de página'],canvas:size,errors},null,2)+'\n');
 console.log('Inventário e Personagem OK: mochila, ficha, prévia, comparação, arrastar, categorias, consumíveis, atributos e modelo 3D.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
