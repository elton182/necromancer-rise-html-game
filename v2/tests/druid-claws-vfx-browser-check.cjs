// Golpes reais, alternância das mãos, alcance visual, qualidade baixa e descarte.
const fs=require('node:fs'),path=require('node:path');
let source=fs.readFileSync(path.join(__dirname,'druid-browser-check.cjs'),'utf8');
source=source.replace('../../review/v2/druid','../../review/v2/druid-claws-vfx');
source=source.replace("channel:'msedge'","channel:process.env.NR_BROWSER_CHANNEL||'msedge'");
const marker="assert.match(await page.locator('[data-hud-slot=\"0\"]').innerText(),/Garras/);";
if(!source.includes(marker))throw Error('Cenário da Druida mudou');
source=source.replace(marker,`${marker}
const clawVfxChecks=[];
for(const [ground,quality] of [['dark','high'],['light','low']]){
 await page.evaluate(({ground,quality})=>{
  for(const [id,value] of [['ground',ground],['quality',quality]]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change'));}
 },{ground,quality});
 for(let hand=0;hand<3;hand++){
  await page.evaluate(()=>{
   const n=NecromancerV2,w=n.world,p=w.player;w.paused=false;w.druidAction=null;w.castCooldown=0;w.druidCooldowns.claws=0;w.effects=[];
   p.mp=p.maxMp;w.aim={x:p.x,y:p.y-6};n.slot(0);
  });
  await page.waitForFunction(()=>{const w=NecromancerV2.world;if(w.druidAction?.released){w.paused=true;return true;}return false;},null,{timeout:5000});
  const detail=await page.evaluate(()=>{
   const n=NecromancerV2,w=n.world,e=w.effects.find(e=>e.fx==='wolfClaws');
   if(!e)throw Error('Garras não emitiram o efeito próprio');
   e.time=e.duration*.25;w.player.pose={anim:w.druidAction.clip,progress:.6};n.view.render(w,0);
   const meshes=[];n.view.vfx.each(m=>{if(m.userData.wolfClaw)meshes.push(m);});
   const core=meshes.filter(m=>m.name.endsWith('core')),points=core.flatMap(m=>{
    const a=m.geometry.attributes.position;return Array.from({length:a.count},(_,i)=>[a.getX(i),a.getY(i),a.getZ(i)]);
   });
   return {clip:w.druidAction.clip,cross:!!e.cross,sweep:e.sweep,radius:e.radius,count:meshes.length,cores:core.length,minForward:Math.min(...points.map(p=>p[2])),maxForward:Math.max(...points.map(p=>p[2])),minHeight:Math.min(...points.map(p=>p[1])),stats:n.view.vfx.stats()};
  });
  assert.equal(detail.clip,['claw_1','claw_2','claw_cross'][hand]);assert.equal(detail.cross,hand===2);
  assert.equal(detail.count,detail.cross?12:6);assert.equal(detail.cores,detail.cross?6:3);assert.ok(detail.maxForward>2.9);assert.ok(detail.minForward>0);assert.ok(detail.minHeight>.7);assert.equal(detail.stats.failed,false);
  await page.waitForTimeout(150);await page.screenshot({path:path.join(dir,'claws-'+ground+'-'+hand+'.png')});
  const gone=await page.evaluate(()=>{const n=NecromancerV2,w=n.world;w.effects=[];delete w.player.pose;w.druidAction=null;n.view.render(w,0);let count=0;n.view.vfx.each(m=>{if(m.userData.wolfClaw)count++;});w.paused=false;return count;});
  assert.equal(gone,0,'Faixas removidas quando o evento termina');clawVfxChecks.push({ground,quality,...detail});
 }
}
assert.equal(clawVfxChecks[0].sweep,-clawVfxChecks[1].sweep,'Garras devem espelhar a varredura');
fs.writeFileSync(path.join(dir,'claws-vfx.json'),JSON.stringify(clawVfxChecks,null,2));
await page.evaluate(()=>{const w=NecromancerV2.world;w.castCooldown=0;w.druidCooldowns.claws=0;w.player.mp=w.player.maxMp;});
`);
new Function('require','__dirname',source)(require,__dirname);
