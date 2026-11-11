'use strict';
// Mapas das Expedições por bioma no HTML empacotado: lançamento real pela vila (waves 1 a 5), biomas da Conquista no mesmo cenário,
// erros de página, chamadas de desenho e capturas da entrada, do meio da trilha, da borda com zoom máximo e de fundo claro com qualidade baixa.
// Evidências em review/v2/expedition-biomes/.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const dir=path.resolve(__dirname,'../../review/v2/expedition-biomes');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const shot=name=>page.screenshot({path:path.join(dir,name+'.png')});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
 // Vila com o Ato I concluído e um grupo de esqueletos, como em expedition.test.mjs.
 await page.evaluate(async()=>{const n=NecromancerV2,s=n.session,{normalizeCampaign}=await import('v2-campaign-model'),c=await import('v2-campaign'),h=await import('v2-horde'),{useProfile}=await import('v2-session');
  s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1,4:1}});c.startCampaign(s);for(let i=0;i<200&&s.world.story;i++)c.nextStory(s);c.enterVillage(s);useProfile(s,h.TEST_PROFILE);h.equipGroup(s.world,1,'skeleton',{preparation:true});});
 const stats=()=>page.evaluate(()=>{const r=NecromancerV2.view.renderer.info;return {calls:r.render.calls,triangles:r.render.triangles};});
 const look=async(x,y,zoom)=>{await page.evaluate(({x,y,zoom})=>{const n=NecromancerV2,w=n.world;Object.assign(w.player,{x,y,hp:w.player.maxHp});for(const a of w.actors)if(a.team==='ally'){a.x=x+(Math.random()-.5)*3;a.y=y+(Math.random()-.5)*3;}n.view.zoom(-9999);n.view.zoom(zoom);},{x,y,zoom});await page.waitForTimeout(900);};
 const result={biomes:{}};
 const visit=async(name)=>{
  const info=await page.evaluate(()=>{const w=NecromancerV2.world,a=w.arena,p=a.plan;return {biome:a.biome,entry:p.entry,mid:{x:p.groups[5].x,y:p.groups[5].y},boss:{x:w.boss.x,y:w.boss.y},kit:a.kitProps.length,solids:a.solids.length,enemies:w.actors.filter(e=>e.team==='enemy').length};});
  // Inimigos param (pausa) para as capturas não variarem; o cenário é o mesmo do jogo.
  await page.evaluate(()=>{NecromancerV2.world.paused=true;});
  await look(info.entry.x+3,info.entry.y+2,400);await shot(name+'-entry');const entry=await stats();
  await look(info.mid.x,info.mid.y,200);await shot(name+'-mid');
  await look(info.boss.x+2,info.boss.y+3,300);await shot(name+'-boss');
  await look(info.mid.x,2,9999);await shot(name+'-edge-max-zoom');
  await page.evaluate(()=>{NecromancerV2.view.ground(true);NecromancerV2.view.quality(true);});await page.waitForTimeout(300);await shot(name+'-light-low');
  await page.evaluate(()=>{NecromancerV2.view.ground(false);NecromancerV2.view.quality(false);NecromancerV2.world.paused=false;});
  result.biomes[name]={...info,render:entry};
 };
 for(const wave of [1,2,3,4,5]){
  const ok=await page.evaluate(async wave=>{const n=NecromancerV2,s=n.session,{launchExpedition}=await import('v2-expedition'),c=await import('v2-campaign');
   if(s.world.adventure?.kind==='expedition'){c.returnAdventure(s);c.enterVillage(s);}
   s.save.character.waveProgress.selected=wave;s.save.character.waveProgress.best=Math.max(s.save.character.waveProgress.best||0,wave-1);return launchExpedition(s);},wave);
  assert.equal(ok,true,'lançamento da wave '+wave);await page.waitForTimeout(1500);
  const name=await page.evaluate(()=>NecromancerV2.world.arena.biome);await visit(name);
  assert.equal(result.biomes[name].enemies,85);
 }
 // Biomas da Conquista: o mesmo cenário trocado no lugar, com a horda e o jogador da corrida atual.
 for(const biome of ['swamp','river','mountain']){
  await page.evaluate(async biome=>{const n=NecromancerV2,w=n.world,{expeditionArena}=await import('v2-expedition-map');w.arena=expeditionArena(1,{biome,groups:biome==='swamp'?8:6,pilot:biome==='swamp'});w.sceneryRevision++;},biome);
  await page.waitForTimeout(1500);await visit(biome);
 }
 assert.deepEqual(errors,[]);result.errors=errors;fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,1));console.log('Mapas das Expedições: OK');
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
