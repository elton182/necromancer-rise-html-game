'use strict';
const fs=require('node:fs'),path=require('node:path');
function readSpellRules(repo=path.resolve(__dirname,'../..')){
 const html=fs.readFileSync(path.join(repo,'necromancer-canvas.html'),'utf8'),tree=fs.readFileSync(path.join(repo,'scripts/skill-trees.js'),'utf8');
 const part=(start,end)=>{const a=html.indexOf('function '+start+'('),b=html.indexOf('function '+end+'(',a+1);if(a<0||b<0)throw Error('Fonte de magia mudou: '+start);return html.slice(a,b);};
 const val=(s,re,key)=>{const m=s.match(re);if(!m)throw Error('Revisar regra de magia: '+key);return Number(m[1]);};
 const rain=part('castChuva','castExplosao'),nova=part('castExplosao','castSpell'),wall=part('castHands','handsSpeed'),shield=part('castBarrier','minionStrike'),curse=tree.slice(tree.indexOf('function skillCastCurse('),tree.indexOf('function skillWallAbsorb('));
 const cooldown=id=>val(tree,new RegExp('spellCooldowns\\.'+id+'=([\\d.]+)'),id+' recarga'),cost=s=>val(s,/(?:const cost=|abilityReady\('\w+',)([\d.]+)/,'custo');
 return {radius:val(tree,/d.spellRadius=([\d.]+)/,'raio base'),range:val(curse,/Math.hypot\(x-P.x,y-P.y\)>([\d.]+)/,'alcance'),
  chuva:{cost:cost(rain),cooldown:cooldown('chuva'),count:val(rain,/COUNT=(\d+)/,'fragmentos'),damage:val(rain,/chuvaFragDmg=player.spellDmg\*([\d.]+)/,'dano chuva'),spread:val(rain,/radius\*([\d.]+)/,'dispersão'),delay:val(rain,/delay:([\d.]+)/,'atraso'),interval:val(rain,/delay:[\d.]+\+i\*([\d.]+)/,'intervalo'),fall:val(rain,/fall:([\d.]+)/,'queda'),hitRadius:val(part('updateSpellFx','dealDamageToEnemy'),/dx\*dx\+dz\*dz<(\d+)/,'colisão chuva')},
  explosao:{cost:cost(nova),cooldown:cooldown('explosao'),radius:val(nova,/exp_r'\)\)\*([\d.]+)/,'raio nova'),damage:val(nova,/expDmg=player.spellDmg\*([\d.]+)/,'dano nova')},
  maos:{cost:cost(wall),cooldown:val(wall,/spellCooldowns.maos=([\d.]+)/,'recarga muralha'),half:val(wall,/half:([\d.]+)/,'comprimento'),width:val(wall,/width:([\d.]+)/,'largura'),damage:val(wall,/player.spellDmg\*([\d.]+)/,'dano muralha'),duration:val(tree,/wall.life=([\d.]+)\*skillPercent/,'duração muralha'),hp:val(tree,/wall.hp=([\d.]+)\*skillPercent/,'resistência'),interval:val(part('tickCorpseWalls','blockByCorpseWalls'),/w.tick\+=([\d.]+)/,'pulso')},
  barreira:{cost:val(shield,/player.mp-=(\d+)/,'mana escudo'),cooldown:val(shield,/barrierCd=(\d+)/,'recarga escudo'),healthCost:val(shield,/player.maxHp\*([\d.]+)/,'vida escudo'),healthRatio:val(shield,/:player.maxHp\*([\d.]+)\);/,'escudo sem zumbi'),zombieRatio:val(shield,/\?100:(\d+)/,'escudo zumbi')/100},
  maldicao:{cost:val(curse,/player.mp-=(\d+)/,'mana maldição'),cooldown:cooldown('maldicao'),radius:val(curse,/radius=([\d.]+)/,'área maldição'),duration:val(curse,/duration=([\d.]+)/,'duração maldição')}};
}
module.exports={readSpellRules};
