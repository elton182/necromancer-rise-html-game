'use strict';
// Necromante repintado ao lado do guerreiro no jogo: material iluminado (toon) em vez de emissão chapada, olhos/cristal emissivos.
// Capturas em chão escuro e claro e na qualidade baixa; confere que o material do jogador tem mapa de cor e que a emissão é só um mapa de brilho.
const legacy=require('./legacy-controls.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const out=path.resolve(__dirname,'../../review/v2/necromancer-look');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../necromancer-3d.html')).href);await page.waitForFunction(()=>window.NecromancerV2);
 await legacy.click(page,'#army-tools summary');await legacy.click(page,'#army-demo');await legacy.click(page,'#enter');
 const materials=await page.evaluate(()=>{
  const n=NecromancerV2,w=n.world;n.pause(true);w.player.x=0;
  document.getElementById('pause-dialog').style.visibility='hidden';  // pausar abre o Relicário; só some da captura, a simulação segue pausadaw.player.y=0;w.effects=[];w.projectiles=[];w.allyShots=[];
  const buddy=w.actors.find(a=>a!==w.player&&a.groupType==='skeleton');buddy.model='warrior';
  w.actors=[w.player,buddy];n.view.zoom(-2000);
  const c=n.view.screen(w.player.x,w.player.y,w);Object.assign(buddy,n.view.aim(c.x+150,c.y,w));
  for(const a of w.actors){a.angle=Math.PI/4;a.timer=0;a.pose={anim:'idle',progress:.1};a.animationTime=0;a.actionId++;}
  n.view.render(w,0);
  const o=n.view.actors.get(w.player.id),mats=[];o.body.traverse(m=>{if(m.isMesh&&!m.userData.outline)mats.push({type:m.material.type,map:!!m.material.map,emissiveMap:!!m.material.emissiveMap,color:m.material.color.getHex()});});return mats;});
 assert.ok(materials.length>=2,'necromante sem malhas');
 for(const m of materials){assert.equal(m.type,'MeshToonMaterial');assert.ok(m.map,'cor base sem textura: a textura voltou para a emissão?');assert.notEqual(m.color,0,'cor base preta (material só emissivo)');assert.ok(m.emissiveMap,'mapa de brilho ausente');}
 const shot=async name=>{await page.evaluate(()=>NecromancerV2.view.render(NecromancerV2.world,0));const c=await page.evaluate(()=>{const n=NecromancerV2;return n.view.screen(n.world.player.x,n.world.player.y,n.world);});
  await page.screenshot({path:path.join(out,name+'.png'),clip:{x:Math.max(0,c.x-110),y:Math.max(0,c.y-230),width:400,height:280}});};
 await legacy.select(page,'#ground','dark');await shot('dark');
 await legacy.select(page,'#ground','light');await shot('light');
 await legacy.select(page,'#quality','low');await shot('light-low');
 await legacy.select(page,'#ground','dark');await shot('dark-low');
 await page.evaluate(()=>{const n=NecromancerV2;n.world.player.pose={anim:'cast',progress:.6};n.world.player.actionId++;});await shot('cast-low');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'browser-result.json'),JSON.stringify({checks:['necromante e guerreiro lado a lado','materiais do necromante com mapa de cor e cor base não preta','emissão só por mapa de brilho','chão escuro e claro, qualidade alta e baixa','sem erros de página'],materials,errors},null,2)+'\n');
 console.log('Necromante repintado OK: material iluminado, brilho só em olhos/gema/cristal; capturas em review/v2/necromancer-look.');
}finally{await browser.close();}})().catch(e=>{console.error(String(e).slice(0,1500));process.exitCode=1;});
