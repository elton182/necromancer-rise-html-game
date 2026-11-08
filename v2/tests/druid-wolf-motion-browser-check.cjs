// Reutiliza o campo isolado e registra os dois golpes alternados do lobo.
const fs=require('node:fs'),path=require('node:path');
let source=fs.readFileSync(path.join(__dirname,'druid-browser-check.cjs'),'utf8');
source=source.replace('../../review/v2/druid','../../review/v2/druid-wolf-motion');
const marker='// Qualidade baixa';
if(!source.includes(marker))throw Error('Cenário de referência mudou');
source=source.replace(marker,`await frozen('wolf-other-claw.png',()=>{NecromancerV2.world.castCooldown=0;return NecromancerV2.slot(0);});
${marker}`);
source=source.replace('// Mana esgotada',`
await page.evaluate(()=>{const w=NecromancerV2.world;w.player.mp=w.player.maxMp;w.actors=w.actors.filter(a=>a===w.player);});
const wolfMovement=[];
for(const key of ['KeyW','KeyS','KeyA','KeyD']){
 await page.keyboard.down(key);await page.waitForTimeout(300);
 const movement=await page.evaluate(()=>{const a=NecromancerV2,p=a.world.player,o=a.view.actors.get(p.id);return {form:a.world.druidForm,state:o.state,idle:o.actions.idle.getEffectiveWeight(),distance:Math.hypot(p.stepX,p.stepY)};});
 assert.equal(movement.form,'wolf');assert.equal(movement.state,'walk');assert.ok(movement.idle<.01);assert.ok(movement.distance>0);
 await page.screenshot({path:path.join(dir,'wolf-move-'+key+'.png')});wolfMovement.push({key,...movement});
 await page.keyboard.up(key);await page.waitForTimeout(150);
}
fs.writeFileSync(path.join(dir,'wolf-movement.json'),JSON.stringify(wolfMovement,null,2));
// Mana esgotada`);
new Function('require','__dirname',source)(require,__dirname);
