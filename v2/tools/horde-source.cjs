'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const literal=(s,name)=>{const m=s.match(new RegExp('const '+name+'\\s*=([\\s\\S]*?);\\r?\\n'));if(!m)throw Error('Definição da horda ausente: '+name);return vm.runInNewContext('('+m[1]+')',{}, {timeout:1000});};
function fn(s,name){const start=s.indexOf('function '+name+'('),body=s.indexOf('{',start);if(start<0)throw Error('Função ausente: '+name);let n=1,i=body+1;for(;i<s.length&&n;i++){if(s[i]==='{')n++;if(s[i]==='}')n--;}if(n)throw Error('Função incompleta: '+name);return s.slice(start,i);}
// Tipos exclusivos da v2: os nós Cão Zumbi e Magos de docs/habilidades/arvores.json (Grimório estendido, full-build.mjs).
// Entram depois dos tipos da versão legada, que não muda. O id do tipo é o id do nó, então a barra e os saves usam o
// mesmo nome. model/tint/scale escolhem o modelo existente usado no desenho; hpKey/dmgKey são os efeitos do Grimório
// que reforçam o tipo (a fórmula de atributos fica em v2/scripts/horde.mjs). Números iniciais, sem balanceamento.
const V2_TYPES={
 caoZumbi:{def:{emoji:'🐕',name:'Cão Zumbi',hp:70,dmg:10,spd:4.4,atkR:1.4,atkRate:.9,col:0x9dbf68,unlockLv:12,spCost:20,model:'cryptHound',tint:'#9dbf68',scale:.9,v2:true,hpKey:'Vida dos Cães Zumbis',dmgKey:'Dano dos Cães Zumbis'},cost:20,
  command:{name:'Cães Zumbis',icon:'🐕',summon:true,passive:'caoZumbi',ability:'Caçada',cooldown:6},
  ability:{name:'Mordida Feroz',icon:'🦷',cooldown:6,color:'#9dbf68',desc:'Morde o alvo com 160% de dano. O Cérbero morde todos à frente (cone de 100°, até 1,9 u).'}},
 mages:{def:{emoji:'🧙',name:'Esqueleto Mago',hp:40,dmg:12,spd:3,atkR:7.5,atkRate:1.6,col:0xb58cff,unlockLv:6,spCost:30,model:'skeleton',tint:'#b58cff',scale:1,ranged:true,v2:true,hpKey:'Vida dos Magos',dmgKey:'Dano dos Magos'},cost:30,
  command:{name:'Esqueletos Magos',icon:'🧙',summon:true,passive:'mages',ability:'Descarga Sombria',cooldown:7},
  ability:{name:'Orbe Sombrio',icon:'✦',cooldown:7,color:'#b58cff',desc:'Orbe pesado: 180% de dano no alvo e 60% em quem estiver a até 1,5 u dele.'}},
};
function readHorde(repo=path.resolve(__dirname,'../..')){
 const html=fs.readFileSync(path.join(repo,'necromancer-canvas.html'),'utf8'),tree=fs.readFileSync(path.join(repo,'scripts/skill-trees.js'),'utf8'),abilities=fs.readFileSync(path.join(repo,'scripts/minion-abilities.js'),'utf8');
 const defs=literal(html,'MINION_DEFS');for(const m of html.matchAll(/MINION_DEFS\.(\w+)\.(hp|dmg|spd)\s*=\s*([\d.]+)\s*;/g))if(defs[m[1]])defs[m[1]][m[2]]=Number(m[3]);
 const abom=html.match(/Object\.defineProperty\(MINION_DEFS,'abom',\{enumerable:false,value:({[^\n]+})\}\);/);if(!abom)throw Error('Abominação ausente');defs.abom=vm.runInNewContext('('+abom[1]+')',{}, {timeout:1000});
 const costs=literal(html,'SW_COST');costs.abom=[0,25];const commands=literal(html,'ACTION_SKILLS');for(const name of ['skeleton','specter']){const m=tree.match(new RegExp('ACTION_SKILLS\\.'+name+'=({[^\\n]+});'));if(!m)throw Error('Comando ausente: '+name);commands[name]=vm.runInNewContext('('+m[1]+')',{}, {timeout:1000});}
 const legacy=['zombie','skeleton','archer','specter','abom'],tuning=literal(tree,'COMBAT_TUNING'),types=[...legacy,...Object.keys(V2_TYPES)];
 const minionAbilities=literal(abilities,'MINION_ABILITIES');for(const [id,t] of Object.entries(V2_TYPES)){defs[id]=t.def;minionAbilities[id]=t.ability;}
 return {data:{types,defs,costs:Object.fromEntries(types.map(t=>[t,V2_TYPES[t]?V2_TYPES[t].cost:costs[t][1]])),tuning,commands:Object.fromEntries(types.map(t=>[t,V2_TYPES[t]?V2_TYPES[t].command:commands[t]])),passives:literal(tree,'TREE_PASSIVES'),abilities:minionAbilities,revive:Number(html.match(/const MINION_REVIVE_TIME\s*=\s*([\d.]+)/)[1])},stats:fn(tree,'skillMinionStats'),capacity:fn(html,'summonSlotCount')};
}
module.exports={readHorde};
