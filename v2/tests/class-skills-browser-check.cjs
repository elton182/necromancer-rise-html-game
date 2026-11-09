const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
 const dir=path.resolve(__dirname,'../../review/v2/class-skills');
 fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage(),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
  await page.waitForFunction(()=>!document.getElementById('loading'));
  // Renderiza o Grimório antes de trocar de personagem: seu conteúdo permanece no DOM.
  for(const classId of ['necromancer','warrior','druid','mage','archer','mercenary','necromancer']){
   await page.evaluate(async classId=>{
    const {applySave}=await import('v2-session');
    const {freshSave}=await import('v2-save');
    const api=window.NecromancerV2,save=freshSave();
    const menu=document.getElementById('pause-dialog');
    if(menu.open)await new Promise(resolve=>{menu.addEventListener('close',resolve,{once:true});api.ui.close();});
    save.character.classId=classId;
    applySave(api.session,save);api.go('training');api.ui.show('skills');
   },classId);
   const necro=page.locator('#grimoire-content');
   if(classId==='necromancer'){
    await necro.waitFor({state:'visible'});
    assert.equal(await page.locator('[data-warrior-node]:visible').count(),0);
   }else{
    assert.equal(await necro.isVisible(),false,`${classId}: Grimório do Necromante deve ficar oculto`);
    await page.locator('[data-warrior-node]:visible').first().waitFor({state:'visible'});
    assert.equal(await page.locator('[data-menu-panel="skills"] .wt-side h2:visible').textContent(),
     {warrior:'Guerreiro',druid:'Druida',mage:'Mago',archer:'Arqueira',mercenary:'Mercenário'}[classId]);
   }
   checks.push(classId);
   if(classId==='warrior')await page.screenshot({path:path.join(dir,'warrior-skills.png')});
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({checks,errors},null,2));
  console.log('Árvores por classe e troca de personagens OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

