'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function readCombatRules(repo=path.resolve(__dirname,'../..')){
 const html=fs.readFileSync(path.join(repo,'necromancer-canvas.html'),'utf8'),tree=fs.readFileSync(path.join(repo,'scripts/skill-trees.js'),'utf8');
 const value=(source,regex,name)=>{const m=source.match(regex);if(!m)throw Error('Regra atual mudou; revisar adaptador E4: '+name);return Number(m[1]);};
 const part=(start,end)=>{const a=html.indexOf(start),b=html.indexOf(end,a+start.length);if(a<0||b<0)throw Error('Função de combate ausente: '+start);return html.slice(a,b);};
 const bolt=part('function castRaio(','// ── Chuva de Ossos'),dash=part('function castDash(','function mobSkillTarget(');
 const literal=tree.match(/const COMBAT_TUNING=([^\n]+);/);if(!literal)throw Error('COMBAT_TUNING ausente');
 const tuning=JSON.parse(JSON.stringify(vm.runInNewContext('('+literal[1]+')',{}, {timeout:1000})));
 for(const guard of ['b.hitEnemies.add(e)','sort((a,b)=>a.t-b.t)','dealDamageToEnemy(e,Math.floor(b.dmg))'])if(!bolt.includes(guard))throw Error('Colisão de projétil mudou: '+guard);
 return {bolt:{cost:value(bolt,/const cost=(\d+)/,'mana'),cooldown:value(bolt,/spellCooldowns.raio=([\d.]+)/,'recarga'),speed:value(bolt,/vx:ux\*([\d.]+)/,'velocidade'),range:value(bolt,/remaining:([\d.]+)/,'alcance'),hitRadius:value(bolt,/h.d<([\d.]+)/,'colisão'),spread:value(bolt,/\(i-\(count-1\)\/2\)\*([\d.]+)/,'leque'),multiplier:tuning.boltMultiplier},
  dash:{distance:value(dash, /\?([\d.]+)\*skillPercent\('Distância do Dash'\)/,'distância'),duration:value(dash,/playerDash.time=([\d.]+)/,'duração'),cooldown:value(tree,/playerDash.cd=([\d.]+)\*skillPercent\('Recarga do Dash'\)/,'recarga dash'),radius:value(dash,/collide\(q,([\d.]+)\)/,'raio dash')},
  // Treino até a E8: zumbis valem o Guerreiro (ENEMY_TYPES[0], invocado pelo Rei Caído); o chefe, o Rei Caído do Extermínio.
  rewards:{enemyXp:value(part('const ENEMY_TYPES=[','];'),/^const ENEMY_TYPES=\[\s*\{name:'Guerreiro'[^}]*?xp:(\d+)/,'XP do Guerreiro'),bossXp:value(part("{id:'ext'",'}},'),/boss:\{[^}]*?xp:(\d+)/,'XP do chefe do Extermínio')},
  base:{hp:value(tree,/d.maxHp=Math.round\(\(([\d.]+)\+/,'vida'),mp:value(tree,/d.maxMp=Math.round\(\(([\d.]+)\+/,'mana base'),regen:value(tree,/d.mpRegen=\(([\d.]+)\+/,'regeneração')},frontlineDamageTaken:tuning.frontlineDamageTaken};
}
module.exports={readCombatRules};
