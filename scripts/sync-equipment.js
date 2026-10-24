// Keep the released game standalone. Re-run after editing equipment or skill sources.
'use strict';
const fs=require('node:fs'),path=require('node:path');
require('./sync-skill-trees.js');
const root=path.resolve(__dirname,'..'),target=path.join(root,'necromancer-canvas.html');
let html=fs.readFileSync(target,'utf8');
function patch(before,after){if(html.includes(after))return;if(html.includes(before))html=html.replace(before,after);else throw Error('Equipment bridge missing: '+before.slice(0,90));}
patch('gold:player.gold,inventory:player.inventory,ts:Date.now(),','gold:player.gold,inventory:player.inventory,ts:Date.now(),\n    equipmentVersion:EquipmentModel.VERSION,gearBag:player.gearBag,equipment:player.equipment,waveProgress:player.waveProgress,');
patch('    campLoad(d); wave=d.wave||0;', '    Object.assign(player,{gearBag:d.gearBag,equipment:d.equipment,waveProgress:d.waveProgress});\n    campLoad(d); wave=d.wave||0;');
patch('const spd=4*(PAD.mx||PAD.mz?PAD.spdk:1);','const spd=4*(PAD.mx||PAD.mz?PAD.spdk:1)*(1+gearBonus(\'move\')/100);');
patch('e.atkTimer=1.9; e.swing=.28;', 'e.atkTimer=e.atkRate; e.swing=.28;');
// Raise boss base damage once; their existing level/stage and special multipliers still apply.
patch('hp:350,dmg:15,spd:1.6', 'hp:350,dmg:19.5,spd:1.6');
patch('hp:600,dmg:25,spd:2.0', 'hp:600,dmg:32.5,spd:2.0');
patch('hp:950,dmg:38,spd:1.3', 'hp:950,dmg:49.4,spd:1.3');
patch('hp:20000,dmg:27.5,spd:2.0', 'hp:20000,dmg:35.75,spd:2.0');
patch('if(CAMP.on&&!e.isBoss){ e.dropChance=e.dummy?1:Math.max(e.dropChance||0,.55); if(!e.dummy&&(e.maxHp||e.hp)>=100&&Math.random()<.7) spawnDrop(hx,hz); }', '// Orb chance is applied once by the final combat rules, including campaign enemies.');
patch('const count = Math.floor((4+wave*2+Math.floor(wave/3))*mult);','let count = Math.floor((4+wave*2+Math.floor(wave/3))*mult);\n  if(currentMission&&currentMission.endless)count=Math.min(count,EquipmentModel.waveStats(wave).maxEnemies);');
patch("c=d.type==='gold'?'#e4be58':d.type==='hp'?'#e74c3c':'#6c6cff'","c=d.type==='equipment'?EquipmentModel.rarities[d.item.rarity].color:d.type==='gold'?'#e4be58':d.type==='hp'?'#e74c3c':'#6c6cff'");
patch("ctx.fillRect(dx-2,y-3,2,2); ctx.globalAlpha=1;","ctx.fillRect(dx-2,y-3,2,2); ctx.globalAlpha=1;\n    if(d.type==='equipment'){ctx.save();ctx.font='bold 12px Georgia';ctx.textAlign='center';ctx.strokeStyle='#080e08';ctx.lineWidth=3;const label=EquipmentModel.slots[d.item.type].icon+' '+EquipmentModel.rarities[d.item.rarity].name+' Nv.'+d.item.level;ctx.strokeText(label,dx,y-15);ctx.fillStyle=c;ctx.fillText(label,dx,y-15);ctx.restore();}");
for(const [name,content,anchor,runtime]of [
 ['EQUIPMENT_MODEL','<script>\n'+fs.readFileSync(path.join(__dirname,'equipment-model.js'),'utf8')+'\n</script>','</head>',false],
 ['EQUIPMENT_STYLE','<style>\n'+fs.readFileSync(path.join(__dirname,'equipment.css'),'utf8')+'\n</style>','</head>',false],
 ['EQUIPMENT_RULES',fs.readFileSync(path.join(__dirname,'equipment.js'),'utf8'),'const hasSave=bootGame();',true]
]){
 const start=runtime?'/* '+name+'_BEGIN */':'<!-- '+name+'_BEGIN -->',end=runtime?'/* '+name+'_END */':'<!-- '+name+'_END -->';
 const block=start+'\n'+content+'\n'+end+'\n',a=html.indexOf(start),b=html.indexOf(end);
 if(a>=0&&b>=a)html=html.slice(0,a)+block+html.slice(b+end.length).replace(/^\r?\n/,'');
 else {if(!html.includes(anchor))throw Error('Missing anchor '+anchor);html=html.replace(anchor,()=>block+anchor);}
}
fs.writeFileSync(target,html);console.log('Embedded equipment and wave progression updated.');
