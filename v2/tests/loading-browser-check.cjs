'use strict';
// Tela de carregamento: progresso real até sumir, sem requisições externas, e a arte com a barra alinhada em vários formatos.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const url=pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href,dir=path.resolve(__dirname,'../../review/v2/loading');
(async()=>{fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),result={views:[]};
try{
 // 1) carregamento real: a porcentagem acompanha a barra e a tela sai sozinha.
 {const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.goto(url);const samples=[];
  for(let i=0;i<400&&await page.$('#loading');i++){const s=await page.evaluate(()=>{const r=document.getElementById('loading');return r&&{bar:r.querySelector('#loading-bar').style.width,pct:r.querySelector('#loading-percent').textContent,label:r.querySelector('#loading-label').textContent,tip:r.querySelector('#loading-tip').textContent};}).catch(()=>null);if(s&&(!samples.length||samples.at(-1).pct!==s.pct))samples.push(s);await page.waitForTimeout(50);}
  await page.waitForFunction(()=>document.body.dataset.ready==='true'&&!document.getElementById('loading'),null,{timeout:90000});
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  for(const s of samples){if(s.bar)assert.equal(s.pct,s.bar);assert.ok(s.tip.length>10);}
  result.samples=samples;await context.close();}
 // 2) tela congelada em vários formatos para conferir o alinhamento sobre a arte.
 for(const [name,width,height] of [['desktop',1440,900],['native',1672,941],['ultrawide',2560,1080],['square',1000,1000],['mobile',375,812]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();
  await page.addInitScript(()=>{const remove=Element.prototype.remove;Element.prototype.remove=function(){if(this.id!=='loading')return remove.call(this);};});
  await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
  const view=await page.evaluate(()=>{const r=document.getElementById('loading');r.classList.remove('done');r.style.transition='none';
   r.querySelector('#loading-bar').style.transition='none';r.querySelector('#loading-bar').style.width='72%';r.querySelector('#loading-percent').textContent='72%';
   r.querySelector('#loading-label').textContent='Carregando o mundo…';r.querySelector('#loading-tip').textContent='Use o Dash para se reposicionar rapidamente e evitar ataques em área.';
   const box=e=>{const b=e.getBoundingClientRect();return {left:Math.round(b.left),top:Math.round(b.top),right:Math.round(b.right),bottom:Math.round(b.bottom)};};
   return {stage:box(r.querySelector('.loading-stage')),track:box(r.querySelector('.loading-track')),label:box(r.querySelector('#loading-label')),percent:box(r.querySelector('#loading-percent')),hint:box(r.querySelector('.loading-hint')),scrollX:document.documentElement.scrollWidth>innerWidth};});
  for(const key of ['track','label','percent','hint']){const b=view[key];assert.ok(b.left>=0&&b.right<=width&&b.top>=0&&b.bottom<=height,`${name}: ${key} fora da tela ${JSON.stringify(b)}`);}
  await page.screenshot({path:path.join(dir,`${name}.png`)});result.views.push({name,width,height,...view});await context.close();}
 fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,1));console.log('loading ok:',result.samples.length,'amostras de progresso;',result.views.map(v=>v.name).join(', '));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
