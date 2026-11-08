// Reutiliza o cenário isolado de combate e acrescenta deslocamentos nas quatro direções.
const fs=require('node:fs'),path=require('node:path');
let source=fs.readFileSync(path.join(__dirname,'druid-browser-check.cjs'),'utf8');
source=source.replace('../../review/v2/druid','../../review/v2/druid-direction');
const movement=`
await page.evaluate(()=>{const w=NecromancerV2.world;w.player.mp=w.player.maxMp;w.actors=w.actors.filter(a=>a===w.player);w.player.x=0;w.player.y=0;w.aim={x:0,y:12};});
const movement=[];
for(const [key,label] of [['KeyS','forward'],['KeyW','backward'],['KeyD','left'],['KeyA','right']]){
 await page.keyboard.down(key);await page.waitForTimeout(220);
 const state=await page.evaluate(()=>{const p=NecromancerV2.world.player;return {animation:p.animation,stepX:p.stepX,stepY:p.stepY,angle:p.angle};});
 assert.equal(state.animation,'walk');assert.ok(Math.hypot(state.stepX,state.stepY)>0);
 await page.screenshot({path:path.join(dir,'movement-'+label+'.png')});
 movement.push({key,label,...state});await page.keyboard.up(key);await page.waitForTimeout(150);
}
fs.writeFileSync(path.join(dir,'movement.json'),JSON.stringify(movement,null,2));
`;
if(!source.includes('const result='))throw Error('Cenário de referência mudou');
source=source.replace('const result=',movement+'\nconst result=');
new Function('require','__dirname',source)(require,__dirname);
