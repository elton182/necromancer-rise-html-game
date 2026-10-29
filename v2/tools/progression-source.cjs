'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
// Lê as regras de progressão e recompensa das fontes atuais, sem executar o runtime do jogo antigo.
function readProgression(repo=path.resolve(__dirname,'../..')){
 const html=fs.readFileSync(path.join(repo,'necromancer-canvas.html'),'utf8'),tree=fs.readFileSync(path.join(repo,'scripts/skill-trees.js'),'utf8'),gear=fs.readFileSync(path.join(repo,'scripts/equipment.js'),'utf8');
 const need=(source,regex,name)=>{const m=source.match(regex);if(!m)throw Error('Regra atual mudou; revisar adaptador E7: '+name);return m;};
 const num=(source,regex,name)=>Number(need(source,regex,name)[1]);
 const part=(source,start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a+start.length);if(a<0||b<0)throw Error('Trecho ausente; revisar adaptador E7: '+start);return source.slice(a,b);};
 const exp=need(tree,/gainExp=function\(v\)\{if\(player\.level>=(\d+)\)return;[^\n]*?player\.expNext=Math\.floor\(([\d.]+)\*Math\.pow\(([\d.]+),player\.level-1\)\)/,'curva de XP'),
  levelUp=part(tree,'onLevelUp=function(){','gainExp=function'),
  goldLine=need(tree,/Math\.max\((\d+),Math\.round\(\(e\.xp\|\|10\)\*([\d.]+)\)\)\*\(e\.isBoss\?(\d+):1\);[^\n]*?type:'gold',amount,life:(\d+)/,'ouro por abate'),
  goldPickup=need(tree,/item\.type!=='gold'\)continue;if\(Math\.hypot\([^\n]*?<([\d.]+)\)/,'raio do ouro'),
  literal=need(tree,/const COMBAT_TUNING=([^\n]+);/,'COMBAT_TUNING'),
  orbs=part(html,'function checkPickups(dt){','updateHUD();'),
  tuning=JSON.parse(JSON.stringify(vm.runInNewContext('('+literal[1]+')',{},{timeout:1000})));
 if(!/dropChance|Math\.random\(\)<e\.dropChance/.test(html))throw Error('Regra atual mudou; revisar adaptador E7: chance de orbes');
 const orbLife=num(gear,/spawnDrop=function\(x,z\)\{[^\n]*?life:(\d+)/,'duração do orbe'),spread=num(gear,/spawnDrop=function\(x,z\)\{[^\n]*?x\+\(Math\.random\(\)-\.5\)\*([\d.]+)/,'dispersão do orbe');
 if(!/life:Infinity/.test(gear)||!/Math\.hypot\(d\.mesh\.position\.x-P\.x,d\.mesh\.position\.z-P\.y\)<([\d.]+)/.test(gear))throw Error('Regra atual mudou; revisar adaptador E7: equipamento no chão');
 const gearPickup=num(gear,/Math\.hypot\(d\.mesh\.position\.x-P\.x,d\.mesh\.position\.z-P\.y\)<([\d.]+)/,'raio do equipamento');
 // Consumíveis: preço, pilha e efeito vêm de SHOP_ITEMS; o pergaminho depende de um portal que a v2 ainda não tem.
 const shop=part(html,'const SHOP_ITEMS = [','];'),items=[...shop.matchAll(/\{id:'(\w+)',\s*name:'([^']+)',\s*icon:'([^']+)',\s*desc:'([^']*)',\s*cost:(\d+),\s*maxStack:(\d+),/g)].map(m=>({id:m[1],name:m[2],icon:m[3],desc:m[4],cost:Number(m[5]),maxStack:Number(m[6])}));
 if(items.length!==5)throw Error('Regra atual mudou; revisar adaptador E7: SHOP_ITEMS');
 const use=id=>{const start=shop.indexOf("{id:'"+id+"'"),at=shop.indexOf('use:',start);if(start<0||at<0)throw Error('Regra atual mudou; revisar adaptador E7: uso de '+id);return shop.slice(at,shop.indexOf('\n',at));};
 const effects={hp:num(use('potion_hp'),/player\.hp\+(\d+)/,'poção de vida'),mp:num(use('potion_mp'),/player\.mp\+(\d+)/,'poção de mana'),bombDamage:num(use('soul_bomb'),/dealDamageToEnemy\(e,(\d+)\)/,'dano da bomba'),bombRadius:Math.sqrt(num(use('soul_bomb'),/dx\*dx\+dz\*dz<(\d+)/,'raio da bomba'))};
 if(!/player\.boneShield=true/.test(use('bone_shield')))throw Error('Regra atual mudou; revisar adaptador E7: Escudo de Ossos');
 return {
  consumables:items,consumableEffects:effects,
  xp:{base:Number(exp[2]),growth:Number(exp[3]),maxLevel:Number(exp[1])},
  levelUp:{hp:num(levelUp,/oldHp\+(\d+)/,'cura de vida'),mp:num(levelUp,/oldMp\+(\d+)/,'cura de mana')},
  gold:{min:Number(goldLine[1]),factor:Number(goldLine[2]),boss:Number(goldLine[3]),life:Number(goldLine[4]),pickup:Number(goldPickup[1])},
  orbs:{chance:tuning.orbChance,hpShare:tuning.hpOrbShare,life:orbLife,spread,pickup:Math.sqrt(num(orbs,/dz\*dz<([\d.]+)/,'raio dos orbes')),hpRestore:num(orbs,/player\.maxHp\*([\d.]+)/,'vida do orbe'),mpRestore:num(orbs,/player\.maxMp\*([\d.]+)/,'mana do orbe')},
  gear:{chance:tuning.gearChance,pickup:gearPickup}
 };
}
module.exports={readProgression};
