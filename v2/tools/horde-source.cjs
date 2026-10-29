'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const literal=(s,name)=>{const m=s.match(new RegExp('const '+name+'\\s*=([\\s\\S]*?);\\r?\\n'));if(!m)throw Error('Definição da horda ausente: '+name);return vm.runInNewContext('('+m[1]+')',{}, {timeout:1000});};
function fn(s,name){const start=s.indexOf('function '+name+'('),body=s.indexOf('{',start);if(start<0)throw Error('Função ausente: '+name);let n=1,i=body+1;for(;i<s.length&&n;i++){if(s[i]==='{')n++;if(s[i]==='}')n--;}if(n)throw Error('Função incompleta: '+name);return s.slice(start,i);}
function readHorde(repo=path.resolve(__dirname,'../..')){
 const html=fs.readFileSync(path.join(repo,'necromancer-canvas.html'),'utf8'),tree=fs.readFileSync(path.join(repo,'scripts/skill-trees.js'),'utf8'),abilities=fs.readFileSync(path.join(repo,'scripts/minion-abilities.js'),'utf8');
 const defs=literal(html,'MINION_DEFS');for(const m of html.matchAll(/MINION_DEFS\.(\w+)\.(hp|dmg|spd)\s*=\s*([\d.]+)\s*;/g))if(defs[m[1]])defs[m[1]][m[2]]=Number(m[3]);
 const abom=html.match(/Object\.defineProperty\(MINION_DEFS,'abom',\{enumerable:false,value:({[^\n]+})\}\);/);if(!abom)throw Error('Abominação ausente');defs.abom=vm.runInNewContext('('+abom[1]+')',{}, {timeout:1000});
 const costs=literal(html,'SW_COST');costs.abom=[0,25];const commands=literal(html,'ACTION_SKILLS');for(const name of ['skeleton','specter']){const m=tree.match(new RegExp('ACTION_SKILLS\\.'+name+'=({[^\\n]+});'));if(!m)throw Error('Comando ausente: '+name);commands[name]=vm.runInNewContext('('+m[1]+')',{}, {timeout:1000});}
 const types=['zombie','skeleton','archer','specter','abom'],tuning=literal(tree,'COMBAT_TUNING');
 return {data:{types,defs,costs:Object.fromEntries(types.map(t=>[t,costs[t][1]])),tuning,commands:Object.fromEntries(types.map(t=>[t,commands[t]])),passives:literal(tree,'TREE_PASSIVES'),abilities:literal(abilities,'MINION_ABILITIES'),revive:Number(html.match(/const MINION_REVIVE_TIME\s*=\s*([\d.]+)/)[1])},stats:fn(tree,'skillMinionStats'),capacity:fn(html,'summonSlotCount')};
}
module.exports={readHorde};
