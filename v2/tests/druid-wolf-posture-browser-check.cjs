// Reusa o cenário completo da Druida e mede a postura do GLB no jogo.
const fs=require('node:fs'),path=require('node:path');
let source=fs.readFileSync(path.join(__dirname,'druid-browser-check.cjs'),'utf8');
source=source.replace('../../review/v2/druid','../../review/v2/druid-wolf-posture');
source=source.replace("channel:'msedge'","channel:process.env.NR_BROWSER_CHANNEL||'msedge'");
const marker="assert.match(await page.locator('[data-hud-slot=\"0\"]').innerText(),/Garras/);";
if(!source.includes(marker))throw Error('Cenário da Druida mudou');
source=source.replace(marker,`${marker}
await page.evaluate(()=>{NecromancerV2.world.paused=true;});
const postures=[];
for(const clip of ['idle','claw_1','claw_2','claw_cross','howl','leap','dodge','walk','strafe_left','strafe_right']){
 for(const progress of [0,.25,.48,.61,.76,.89,1]){
  const posture=await page.evaluate(({clip,progress})=>{
   const n=NecromancerV2,w=n.world,p=w.player;
   p.pose={anim:clip,progress};p.actionId++;n.view.render(w,0);
   const o=n.view.actors.get(p.id);o.body.updateMatrixWorld(true);
   const point=short=>{let b;o.body.traverse(x=>{if(x.isBone&&x.name.replace(/[^a-z]/gi,'').endsWith(short))b=x;});if(!b)throw Error('Osso ausente: '+short);return b.position.clone().setFromMatrixPosition(b.matrixWorld);};
   const hips=point('Hips'),head=point('Head'),feet=['LeftFoot','RightFoot'].map(point),hands=['LeftHand','RightHand'].map(point);
   return {clip,progress,headAboveHips:head.y-hips.y,handAboveFeet:Math.min(...hands.map(b=>b.y))-Math.max(...feet.map(b=>b.y))};
  },{clip,progress});
  const moving=['walk','strafe_left','strafe_right'].includes(clip);
  if(!moving)assert.ok(posture.handAboveFeet>.4,'Garras devem ficar fora do chão: '+JSON.stringify(posture));
  else assert.ok(posture.handAboveFeet<.4,'Locomoção deve ser quadrúpede: '+JSON.stringify(posture));
  postures.push(posture);
  if(progress===.48)await page.screenshot({path:path.join(dir,'posture-'+clip+'.png')});
  if(clip.startsWith('claw_')&&[.61,.76,.89].includes(progress))await page.screenshot({path:path.join(dir,'recovery-'+clip+'-'+progress+'.png')});
 }
}
fs.writeFileSync(path.join(dir,'postures.json'),JSON.stringify(postures,null,2));
await page.evaluate(()=>{delete NecromancerV2.world.player.pose;NecromancerV2.world.paused=false;});
`);
new Function('require','__dirname',source)(require,__dirname);
