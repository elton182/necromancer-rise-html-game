'use strict';
// Confere as entradas oficiais e legadas por arquivo e HTTP, sem usar saves pessoais.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const review=path.join(root,'review/v2/version-organization');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
(async()=>{
 fs.mkdirSync(review,{recursive:true});
 const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  const relative=path.relative(root,file);
  if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 const results=[];
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const base='http://127.0.0.1:'+server.address().port;
  for(const protocol of ['http','file'])for(const version of ['v2','v1']){
   const entry=version==='v2'?'index.html':'v1/index.html';
   const url=protocol==='http'?base+'/'+entry:pathToFileURL(path.join(root,entry)).href;
   const context=await browser.newContext({viewport:{width:1280,height:800}});
   try{
    const page=await context.newPage(),errors=[],failed=[],remote=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('requestfailed',r=>failed.push(r.url()));
    page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))missing.push({url:r.url(),status:r.status()});});
    page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base+'/'))remote.push(r.url());});
    await page.goto(url,{waitUntil:'load',timeout:180000});
    if(version==='v2'){
     await page.waitForFunction(()=>!!window.NecromancerV2,null,{timeout:180000});
     assert.ok(page.url().endsWith('/v2/necromancer-3d.html'));
    }else{
     await page.waitForFunction(()=>typeof hasSave!=='undefined'&&typeof bootGame==='function',null,{timeout:180000});
     assert.ok(page.url().endsWith('/v1/necromancer-canvas.html'));
     assert.equal(await page.evaluate(()=>new URL('scripts/village-kit-data.js',document.baseURI).pathname.endsWith('/scripts/village-kit-data.js')),true);
     await page.waitForFunction(()=>!!window.VillageKitData&&!!window.ReferenceCharacterCatalog,null,{timeout:60000});
    }
    await page.screenshot({path:path.join(review,version+'-'+protocol+'.png')});
    assert.deepEqual(errors,[]);
    assert.deepEqual(failed,[]);
    assert.deepEqual(remote,[]);
    assert.deepEqual(missing,[]);
    results.push({version,protocol,url:page.url(),errors,failed,remote,missing});
   }finally{await context.close();}
  }
  fs.writeFileSync(path.join(review,'result.json'),JSON.stringify({ok:true,results},null,2)+'\n');
  console.log('OK: entradas v2 e v1 por HTTP e arquivo; sem erros, recursos ausentes ou rede externa.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{fs.writeFileSync(path.join(review,'result.json'),JSON.stringify({ok:false,error:error.stack},null,2)+'\n');console.error(error);process.exitCode=1;});
