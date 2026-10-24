'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const base=process.env.COMBAT_LAB_URL||'http://127.0.0.1:4173';
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const output=path.resolve(__dirname,'../docs/concepts');fs.mkdirSync(output,{recursive:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Serve repository files in-process: tests need no network or running server.
    await page.route(base+'/**',async route=>{
      const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);
      const root=path.resolve(__dirname,'..'),file=path.resolve(root,relative);
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
      const contentType=file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream';
      await route.fulfill({path:file,contentType});
    });
    await page.goto(base+'/tools/combat-lab.html');await page.waitForFunction(()=>window.CombatLab?.ready);
    await page.locator('#repeat').uncheck();
    await page.locator('#scrub').evaluate(el=>{el.value='0.23';el.dispatchEvent(new Event('input'));});
    await page.screenshot({path:path.join(output,'tiro-osso-comparacao.png'),fullPage:true});
    for(const enemy of ['soldier','earcher','brute','mage'])await page.selectOption('#enemy',enemy);
    await page.selectOption('#crowd','32');await page.selectOption('#quality','baixa');
    await page.selectOption('#zoom','24');await page.selectOption('#background','light');
    await page.locator('#repeat').check();
    await page.waitForFunction(()=>CombatLab.samples.length>=100);
    const performanceSample=await page.evaluate(()=>{const s=CombatLab.samples.sort((a,b)=>a-b);return {p95:s[Math.floor((s.length-1)*.95)],samples:s.length,...CombatLab.settings()};});
    await page.locator('#scrub').evaluate(el=>{el.value='0.23';el.dispatchEvent(new Event('input'));});
    await page.screenshot({path:path.join(output,'tiro-osso-grupo-distante.png'),fullPage:true});
    await page.locator('#scrub').evaluate(el=>{el.value='0.41';el.dispatchEvent(new Event('input'));});
    await page.screenshot({path:path.join(output,'tiro-osso-impacto.png'),fullPage:true});
    assert.equal(performanceSample.crowd,32);assert.equal(performanceSample.low,true);
    const directions=await page.evaluate(()=>{
      const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d');
      for(let i=0;i<8;i++){
        ctx.clearRect(0,0,128,128);ctx.globalAlpha=.7;ctx.globalCompositeOperation='source-over';
        BoneBoltVFX.projectile(ctx,{x:64,y:64,angle:i*Math.PI/4,scale:36,travel:.8,low:i%2===0});
        if(ctx.globalAlpha<.69||ctx.globalCompositeOperation!=='source-over')return false;
        const data=ctx.getImageData(0,0,128,128).data;let count=0;for(let p=3;p<data.length;p+=4)if(data[p])count++;
        if(count<50)return false;
      }return true;
    });assert.equal(directions,true);
    // Exercise the actual standalone game: visuals must not change its combat contract.
    await page.goto(base+'/necromancer-canvas.html');
    await page.waitForFunction(()=>typeof BoneBoltVFX==='object'&&typeof hasSave!=='undefined');
    const combat=await page.evaluate(()=>{
      TITLE.active=false;TITLE.paused=true;COMIC.active=false;CAMP.on=false;CAMP.map=false;STG.on=false;gameState='field';
      P.x=0;P.y=0;P.deadT=0;cam.x=0;cam.y=0;
      player.skillRanks={};player.gearBag=[];player.equipment={};skillSync();player.spellDmg=40;player.mp=80;
      player.spellCooldowns.raio=0;boltsFx=[];spellFx=[];enemies=[];
      const e=spawnEnemy({...ENEMY_TYPES[0],hp:100},3,0);e.hp=100;e.maxHp=100;
      castRaio(9,0);
      const initial={mp:player.mp,cooldown:player.spellCooldowns.raio,damage:boltsFx[0].dmg,launch:spellFx.some(f=>f.kind==='boneLaunch')};
      castRaio(9,0);initial.bolts=boltsFx.length;
      updateSpellFx(.25);
      const hit={hp:e.hp,bolts:boltsFx.length,impact:spellFx.some(f=>f.kind==='boneImpact')};
      updateSpellFx(.3);
      const remaining=spellFx.filter(f=>f.kind==='boneLaunch'||f.kind==='boneImpact').length;
      enemies=[];player.spellCooldowns.raio=0;castRaio(50,0);const bolt=boltsFx[0];updateBolts(2);
      return {initial,hit,remaining,distance:bolt.mesh.position.x,expired:boltsFx.length};
    });
    assert.deepEqual(combat.initial,{mp:60,cooldown:.5,damage:20,launch:true,bolts:1});
    assert.deepEqual(combat.hit,{hp:80,bolts:0,impact:true});
    assert.equal(combat.remaining,0);assert.equal(combat.distance,9);assert.equal(combat.expired,0);
    const queue=await page.evaluate(()=>{const fx=[{kind:'bone',dmg:123}];for(let i=0;i<100;i++)BoneBoltVFX.emit(fx,'boneImpact',0,0,1,0);return {length:fx.length,gameplay:fx[0].dmg};});
    assert.deepEqual(queue,{length:49,gameplay:123});
    assert.deepEqual(errors,[]);
    console.log('Browser OK: lab controls and real sprites; live cost/cooldown/damage/range; launch/impact expiry; bounded effects.');
    console.log('Lab draw measurement (both panels, headless Chrome): '+JSON.stringify(performanceSample));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
