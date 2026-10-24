// Verify the embedded Blender sheets decode and the game's renderer uses them.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const page=await browser.newPage();
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-canvas.html')).href);
    await page.waitForFunction(()=>SPR.sheets.archer?.ok&&SPR.sheets.specter?.ok);
    const results=await page.evaluate(()=>{
      SPR.on=true;
      const results=[];
      for(const kind of ['archer','specter']) {
        const sh=SPR.sheets[kind],meta=sh.meta;
        let calls=0;
        const original=ctx.drawImage;
        ctx.drawImage=function(...args){if(args[0]===sh.img)calls++;return original.apply(this,args);};
        try {
          const ref={x:0,y:0,phase:1,hit:0,swing:0};
          drawSprite(kind,ref,{});
          ref.x=.1; ref.__s.amp=1; drawSprite(kind,ref,{});
          ref.swing=.2;drawSprite(kind,ref,{attacking:true,prog:.5,aim:0});
          drawSprite(kind,ref,{dead:true});
        } finally {ctx.drawImage=original;}
        results.push({kind,calls,width:sh.img.naturalWidth,height:sh.img.naturalHeight,anims:Object.keys(meta.anims)});
      }
      SPR.on=false;
      const fallback=!SPR.ready('archer')&&!SPR.ready('specter');
      SPR.on=true;
      return {results,fallback};
    });
    for(const result of results.results){
      assert.equal(result.calls,4,result.kind);
      assert.equal(result.width,2240); assert.equal(result.height,7168);
      assert.deepEqual(result.anims,['idle','walk','attack','death']);
    }
    assert.equal(results.fallback,true);
    assert.deepEqual(errors,[]);
    console.log('Browser OK: both embedded sheets decode; idle, walk, attack and death render; sprite toggle preserves fallback.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
