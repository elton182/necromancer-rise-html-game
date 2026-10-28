// Keep the released game standalone. Re-run after editing equipment or skill sources.
'use strict';
const fs=require('node:fs'),path=require('node:path');
require('./sync-skill-trees.js');
const root=path.resolve(__dirname,'..'),target=path.join(root,'necromancer-canvas.html');
let html=fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n');
function patch(before,after){if(html.includes(after))return;if(html.includes(before))html=html.replace(before,after);else throw Error('Equipment bridge missing: '+before.slice(0,90));}
patch('gold:player.gold,inventory:player.inventory,ts:Date.now(),','gold:player.gold,inventory:player.inventory,ts:Date.now(),\n    equipmentVersion:EquipmentModel.VERSION,gearBag:player.gearBag,equipment:player.equipment,waveProgress:player.waveProgress,');
patch('    campLoad(d); wave=d.wave||0;', '    Object.assign(player,{gearBag:d.gearBag,equipment:d.equipment,waveProgress:d.waveProgress,conquest:d.conquest});\n    campLoad(d); wave=d.wave||0;');
patch('waveProgress:player.waveProgress,\n    mode:', 'waveProgress:player.waveProgress,\n    conquest:player.conquest,\n    mode:');
patch('Object.assign(player,{gearBag:d.gearBag,equipment:d.equipment,waveProgress:d.waveProgress});','Object.assign(player,{gearBag:d.gearBag,equipment:d.equipment,waveProgress:d.waveProgress,conquest:d.conquest});');
patch('dealDamageToEnemy(e,Math.floor(b.dmg));','dealDamageToEnemy(e,Math.floor(b.dmg));\n      if(typeof endgameBoneHit===\'function\')endgameBoneHit(e,b);');
if(html.includes('const spd=4*(PAD.mx||PAD.mz?PAD.spdk:1);'))html=html.replace('const spd=4*(PAD.mx||PAD.mz?PAD.spdk:1);',"const spd=EquipmentModel.moveSpeed(EquipmentModel.bonuses(player))*(PAD.mx||PAD.mz?PAD.spdk:1);");
patch("const spd=4*(PAD.mx||PAD.mz?PAD.spdk:1)*(1+gearBonus('move')/100);","const spd=EquipmentModel.moveSpeed(EquipmentModel.bonuses(player))*(PAD.mx||PAD.mz?PAD.spdk:1);");
patch('e.atkTimer=1.9; e.swing=.28;', 'e.atkTimer=e.atkRate; e.swing=.28;');
patch("if(signature===actionSignature)return;actionSignature=signature;roots.forEach(r=>r.innerHTML='');", "if(signature===actionSignature)return;actionSignature=signature; // Preserve slot buttons across HUD refreshes.");
patch("const b=document.createElement('button');b.className='action-equipped'", "const host=roots[i<3?0:1];let b=host.querySelector('[data-action-slot=\"'+i+'\"]');if(!b){b=document.createElement('button');b.type='button';b.dataset.actionSlot=String(i);b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls','summon-wheel');b.onclick=e=>{e.preventDefault();e.stopPropagation();openActionPicker(i);};b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')e.stopPropagation();});host.appendChild(b);}b.className='action-equipped'");
patch("b.onclick=()=>openActionPicker(i);roots[i<3?0:1].appendChild(b);", "// Keep the same button between pointerdown and click while mana/cooldowns refresh.");
patch('<div id="reanimate-hint">R — reanimar agora (30 MP)</div>','<button type="button" id="reanimate-hint" onclick="tryReanimate()" aria-label="Reanimar aliado caído por 30 MP">V · Reanimar agora (30 MP)</button>');
patch("if(e.key.toLowerCase()==='v') tryReanimate();","if(e.key.toLowerCase()==='v'&&!e.repeat) tryReanimate();");
patch('const dead=minions.some(m=>m.dead&&!m.sacrificed);','const dead=minions.some(m=>m.dead&&!m.sacrificed&&!m.exploded);');
patch("      if(m.sacrificed&&gameState!=='field') return;","      // Recovery continues in the village; pause still freezes world time.");
patch('m.hp=Math.floor(m.maxHp*.3); m.deadTimer=0;','m.hp=Math.floor(m.maxHp*COMBAT_TUNING.autoReviveHealth); m.deadTimer=0;');
patch("if(gameState!=='hub'||!VILLAGE())return false;", "if(gameState!=='hub')return false;");
patch("if(gameState==='hub'&&VILLAGE())m.appendChild(tBtn('🗺 MAPA DA CAMPANHA',openCampaignFromVillage));", "if(gameState==='hub'&&!CAMP.on)m.appendChild(tBtn('🗺 MAPA DA CAMPANHA',gearReturnToStory));");
// Sprite sheets draw through cached per-row strips (scripts/sprite-cache.js).
patch('  ctx.drawImage(sh.img,f*C,(A[an].row+di)*C,C,C,x-m.anchorX*k,y-m.anchorY*k,C*k,C*k);','  spriteDraw(sh,f,A[an].row+di,x-m.anchorX*k,y-m.anchorY*k,C*k);');
// Raise boss base damage once; their existing level/stage and special multipliers still apply.
patch('hp:350,dmg:15,spd:1.6', 'hp:350,dmg:19.5,spd:1.6');
patch('hp:600,dmg:25,spd:2.0', 'hp:600,dmg:32.5,spd:2.0');
patch('hp:950,dmg:38,spd:1.3', 'hp:950,dmg:49.4,spd:1.3');
patch('hp:20000,dmg:27.5,spd:2.0', 'hp:20000,dmg:35.75,spd:2.0');
patch('if(CAMP.on&&!e.isBoss){ e.dropChance=e.dummy?1:Math.max(e.dropChance||0,.55); if(!e.dummy&&(e.maxHp||e.hp)>=100&&Math.random()<.7) spawnDrop(hx,hz); }', '// Orb chance is applied once by the final combat rules, including campaign enemies.');
patch('const count = Math.floor((4+wave*2+Math.floor(wave/3))*mult);','let count = Math.floor((4+wave*2+Math.floor(wave/3))*mult);\n  if(currentMission&&currentMission.endless)count=Math.min(count,EquipmentModel.waveStats(wave).maxEnemies);');
patch("c=d.type==='gold'?'#e4be58':d.type==='hp'?'#e74c3c':'#6c6cff'","c=d.type==='equipment'?EquipmentModel.rarities[d.item.rarity].color:d.type==='gold'?'#e4be58':d.type==='hp'?'#e74c3c':'#6c6cff'");
patch("ctx.fillRect(dx-2,y-3,2,2); ctx.globalAlpha=1;","ctx.fillRect(dx-2,y-3,2,2); ctx.globalAlpha=1;\n    if(d.type==='equipment'){ctx.save();ctx.font='bold 12px Georgia';ctx.textAlign='center';ctx.strokeStyle='#080e08';ctx.lineWidth=3;const label=EquipmentModel.slots[d.item.type].icon+' '+EquipmentModel.rarities[d.item.rarity].name+' Nv.'+d.item.level+(d.upgrade?' ▲':'');ctx.strokeText(label,dx,y-15);ctx.fillStyle=c;ctx.fillText(label,dx,y-15);ctx.restore();}");
patch("  {id:'cryptHound',name:'Cão de Cripta',col:0x786450,hCol:0xe4ad64,hp:32,dmg:7,spd:3.2,xp:16,souls:10,dropChance:.3,sc:.85},", "  {id:'cryptHound',name:'Cão de Cripta',col:0x786450,hCol:0xe4ad64,hp:32,dmg:7,spd:3.2,xp:16,souls:10,dropChance:.3,sc:.85},\n  {id:'warAcolyte',name:'Acólito de Guerra',col:0x9a4543,hCol:0xe9b46b,hp:38,dmg:6,spd:1.8,xp:22,souls:12,dropChance:.35,sc:1.0},");
patch('spawnQueue=CryptHoundModel.arenaTypes(wave,count,ENEMY_TYPES,Math.random,CAMP.on);','spawnQueue=WarAcolyteModel.arenaTypes(wave,CryptHoundModel.arenaTypes(wave,count,ENEMY_TYPES,Math.random,CAMP.on),ENEMY_TYPES,CAMP.on);');
for(const [name,content,anchor,runtime]of [
 ['EQUIPMENT_MODEL','<script>\n'+fs.readFileSync(path.join(__dirname,'equipment-model.js'),'utf8')+'\n</script>','</head>',false],
 ['EQUIPMENT_STYLE','<style>\n'+fs.readFileSync(path.join(__dirname,'equipment.css'),'utf8')+'\n</style>','</head>',false],
 ['MENU_STYLE','<style>\n'+fs.readFileSync(path.join(__dirname,'menu.css'),'utf8')+'\n</style>','</head>',false],
 ['ENDGAME_STYLE','<style>\n'+fs.readFileSync(path.join(__dirname,'endgame.css'),'utf8')+'\n</style>','</head>',false],
 ['EQUIPMENT_RULES',fs.readFileSync(path.join(__dirname,'equipment.js'),'utf8'),'const hasSave=bootGame();',true],
 ['MINION_CARE',fs.readFileSync(path.join(__dirname,'minion-care.js'),'utf8'),'const hasSave=bootGame();',true],
 ['MINION_ABILITIES',fs.readFileSync(path.join(__dirname,'minion-abilities.js'),'utf8'),'const hasSave=bootGame();',true],
 ['SPRITE_CACHE',fs.readFileSync(path.join(__dirname,'sprite-cache.js'),'utf8'),'const hasSave=bootGame();',true],
 ['EXPEDITION_MODEL',fs.readFileSync(path.join(__dirname,'expedition-model.js'),'utf8'),'const hasSave=bootGame();',true],
 ['SOUL_WARDEN_MODEL',fs.readFileSync(path.join(__dirname,'soul-warden-model.js'),'utf8'),'const hasSave=bootGame();',true],
 ['EXPEDITION_RULES',fs.readFileSync(path.join(__dirname,'expedition.js'),'utf8'),'const hasSave=bootGame();',true],
 ['CRYPT_HOUND_MODEL',fs.readFileSync(path.join(__dirname,'crypt-hound-model.js'),'utf8'),'const hasSave=bootGame();',true],
 ['CRYPT_HOUND_RULES',fs.readFileSync(path.join(__dirname,'crypt-hound.js'),'utf8'),'const hasSave=bootGame();',true],
 ['SOUL_WARDEN_RULES',fs.readFileSync(path.join(__dirname,'soul-warden.js'),'utf8'),'const hasSave=bootGame();',true],
 ['WAR_ACOLYTE_MODEL',fs.readFileSync(path.join(__dirname,'war-acolyte-model.js'),'utf8'),'const hasSave=bootGame();',true],
 ['WAR_ACOLYTE_RULES',fs.readFileSync(path.join(__dirname,'war-acolyte.js'),'utf8'),'const hasSave=bootGame();',true],
 ['SKILL_MASTERY_RULES',fs.readFileSync(path.join(__dirname,'skill-mastery.js'),'utf8'),'const hasSave=bootGame();',true],
 ['ENDGAME_MODEL',fs.readFileSync(path.join(__dirname,'endgame-model.js'),'utf8'),'const hasSave=bootGame();',true],
 ['ENDGAME_MAP',fs.readFileSync(path.join(__dirname,'endgame-map.js'),'utf8'),'const hasSave=bootGame();',true],
 ['ENDGAME_RULES',fs.readFileSync(path.join(__dirname,'endgame.js'),'utf8'),'const hasSave=bootGame();',true],
 ['ENDGAME_SCREEN',fs.readFileSync(path.join(__dirname,'endgame-screen.js'),'utf8'),'const hasSave=bootGame();',true],
 // Por último: o Rei Caído envolve as IAs de chefe de todos os módulos acima.
 ['FALLEN_KING_MODEL',fs.readFileSync(path.join(__dirname,'fallen-king-model.js'),'utf8'),'const hasSave=bootGame();',true],
 ['FALLEN_KING_RULES',fs.readFileSync(path.join(__dirname,'fallen-king.js'),'utf8'),'const hasSave=bootGame();',true]
]){
 const start=runtime?'/* '+name+'_BEGIN */':'<!-- '+name+'_BEGIN -->',end=runtime?'/* '+name+'_END */':'<!-- '+name+'_END -->';
 const block=start+'\n'+content+'\n'+end+'\n',a=html.indexOf(start),b=html.indexOf(end);
 if(a>=0&&b>=a)html=html.slice(0,a)+block+html.slice(b+end.length).replace(/^\r?\n/,'');
 else {if(!html.includes(anchor))throw Error('Missing anchor '+anchor);html=html.replace(anchor,()=>block+anchor);}
}
if(fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n')!==html.replace(/\r\n/g,'\n')){const temporary=target+'.sync-'+process.pid+'.tmp';fs.writeFileSync(temporary,html);try{try{fs.renameSync(temporary,target);}catch(error){if(!['EPERM','EACCES'].includes(error.code))throw error;const fd=fs.openSync(target,'r+');try{fs.writeFileSync(fd,html);fs.ftruncateSync(fd,Buffer.byteLength(html));}finally{fs.closeSync(fd);}}}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}}console.log('Embedded equipment and wave progression updated.');
