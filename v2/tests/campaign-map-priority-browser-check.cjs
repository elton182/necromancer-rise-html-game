'use strict';
// Prioridade entre a edição do navegador e a publicada, no jogo real: a mais recente vale na campanha e a aba Mapas avisa a diferença.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const dir=path.resolve(__dirname,'../../review/v2/campaign-map-priority'),file=process.env.NR_TEST_DISTRIBUTION||path.resolve(__dirname,'../necromancer-3d.html');
const FAR_FUTURE=4102444800000;
const localCopy=updated=>({format:'necromancer-rise-map',version:1,id:'campaign-world',name:'Cópia do navegador',base:'builtin:campaign-world',campaign:'world',objects:[],hidden:[],biome:null,size:null,start:null,spawns:null,level:1,updated});
(async()=>{
 fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=d3d11','--enable-gpu']}),result={};
 try{
  async function scenario(name,updated,check){
   // Contexto novo a cada cenário: o armazenamento do navegador do jogador nunca é tocado.
   const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(([key,body])=>{if(body&&!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem(key,body);}},['necromancer_v2_maps',updated?JSON.stringify({version:1,maps:[localCopy(updated)]}):null]);
   await page.goto(pathToFileURL(file).href);
   await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:180000});
   await page.getByRole('button',{name:'Editor de mapas',exact:true}).click();
   await page.waitForSelector('#maps-content [data-slot="world"]');
   const row=page.locator('#maps-content .maps-row').filter({has:page.locator('[data-slot="world"]')});
   const world=()=>page.evaluate(async()=>{
    const n=NecromancerV2,s=n.session,W=await import('v2-campaign-world');
    s.save.campaign.started=true;s.save.campaign.world={};W.launchWorld(s);
    return {terrain:!!n.world.arena.terrain,rivers:n.world.arena.terrain?.rivers?.length||0};
   });
   await check({page,row,world,shot:()=>page.screenshot({path:path.join(dir,name+'.png')})});
   assert.deepEqual(errors,[],name+': erros de página');
   await context.close();
  }
  // O projeto publicou um mundo com rio: é por ele que se reconhece a versão publicada.
  await scenario('sem-copia-local',null,async({row,world,shot})=>{
   const text=await row.innerText();await shot();
   assert.match(text,/edição embutida no jogo/);assert.equal(await row.locator('.maps-warn').count(),0);
   const w=await world();assert.ok(w.terrain&&w.rivers>0,'vale a publicada');result.semCopia={text,...w};
  });
  await scenario('copia-antiga',1,async({page,row,world,shot})=>{
   const text=await row.innerText();await shot();
   assert.match(text,/Valendo a versão publicada/);
   const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('necromancer_v2_maps')).maps.some(m=>m.id==='campaign-world'));
   assert.equal(await stored(),true,'a cópia antiga continua guardada');
   await row.getByRole('button',{name:'Apagar cópia local',exact:true}).click();
   await row.getByRole('button',{name:'Confirmar: apagar a edição',exact:true}).click();
   await page.waitForFunction(()=>!document.querySelector('#maps-content .maps-warn'));
   assert.equal(await stored(),false,'apagar remove só a cópia local');
   const w=await world();assert.ok(w.terrain&&w.rivers>0,'a publicada vence a cópia antiga');result.copiaAntiga={text,...w};
  });
  await scenario('copia-nova',FAR_FUTURE,async({row,world,shot})=>{
   const text=await row.innerText();await shot();
   assert.match(text,/usando a própria edição/);
   const w=await world();assert.ok(!w.terrain,'a edição posterior vence a publicada');result.copiaNova={text,...w};
  });
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));
  console.log('Prioridade dos mapas da campanha: OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
