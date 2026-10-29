'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function readEnemyTypes(repo=path.resolve(__dirname,'../..')){
 const html=fs.readFileSync(path.join(repo,'necromancer-canvas.html'),'utf8'),match=html.match(/const ENEMY_TYPES=(\[[\s\S]*?\n\]);/);
 if(!match)throw Error('ENEMY_TYPES mudou; revisar adaptador E8.');
 const types=JSON.parse(JSON.stringify(vm.runInNewContext(match[1],{},{timeout:1000}))),names=['Guerreiro','Arqueiro','Bruto','Mago Vivo','Cão de Cripta','Acólito de Guerra'];
 if(types.length!==names.length||types.some((t,i)=>t.name!==names[i]))throw Error('Índices de ENEMY_TYPES mudaram; revisar consumidores E8.');return types;
}
function readEnemyRules(repo=path.resolve(__dirname,'../..')){
 const html=fs.readFileSync(path.join(repo,'necromancer-canvas.html'),'utf8'),tree=fs.readFileSync(path.join(repo,'scripts/skill-trees.js'),'utf8');
 const literal=(source,re,label)=>{const m=source.match(re);if(!m)throw Error('Fonte E8 mudou: '+label);return JSON.parse(JSON.stringify(vm.runInNewContext('('+m[1]+')',{},{timeout:1000})));};
 const abilities=literal(html,/const MOB_ABILITIES=(\{[\s\S]*?\n\});/,'habilidades'),tuning=literal(tree,/const COMBAT_TUNING=([^\n]+);/,'ajustes');
 for(const [name,values] of Object.entries(tuning.specials))Object.assign(abilities[name],values);
 const bossMatch=html.match(/id:'ext'[\s\S]*?boss:(\{[^}]+\})/);if(!bossMatch)throw Error('Chefe de referência E8 ausente');const boss=literal(bossMatch[1],/(.*)/,'chefe');
 const dog=fs.readFileSync(path.join(repo,'scripts/crypt-hound.js'),'utf8'),acolyte=fs.readFileSync(path.join(repo,'scripts/war-acolyte.js'),'utf8');
 const value=(source,re)=>{const m=source.match(re);if(!m)throw Error('Override de ataque E8 mudou: '+re);return Number(m[1]);};
 const basic={rangedInterval:value(html,/e.atkTimer=([\d.]+); e.swing=.28; const kind=/),hound:{range:value(dog,/e.atkR=([\d.]+)/),interval:value(dog,/e.atkRate=([\d.]+)/),initial:value(dog,/e.abilityCd=([\d.]+)/)},acolyte:{range:value(acolyte,/e.atkR=([\d.]+)/),interval:value(acolyte,/e.atkRate=([\d.]+)/)}};
 return {basic,boss,abilities,tuning,ranged:literal(html,/const RANGED=(\{[^\n]+\});/,'alcances')};
}
module.exports={readEnemyTypes,readEnemyRules};
