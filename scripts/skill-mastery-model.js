// Shared, deterministic mastery rules. No character/Grimoire points are consumed here.
(function(root){
'use strict';
const VERSION=1,MAX_LEVEL=20;
const labels={damage:'dano',hp:'vida dos aliados',regen:'regeneração dos aliados',speed:'movimento dos aliados',cooldown:'redução de recarga',area:'área',duration:'duração',absorb:'absorção',distance:'distância do Dash',pierce:'alvos perfurados adicionais',resistance:'resistência da muralha',curse:'redução de dano inimigo'};
function branch(id,name,stat,value,childName,childStat,childValue,max=5){return [
 {id,name,stat,value,max,level:1},
 {id:id+'_deep',name:childName,stat:childStat,value:childValue,max:5,level:6,requires:id}
];}
function define(name,automatic,branches){return {name,automatic,nodes:branches.flat()};}
const skills={};
for(const [id,name,power,body,motion] of [
 ['zombie','Zumbis','Fome dos Mortos','Carne Recomposta','Marcha Pútrida'],
 ['skeleton','Esqueletos Guerreiros','Lâminas Antigas','Ossos Reforçados','Marcha de Guerra'],
 ['archer','Arqueiros','Flechas Fúnebres','Ossos Firmes','Caçada Sepulcral'],
 ['specter','Espectros','Toque do Além','Essência Persistente','Travessia Espectral'],
 ['abom','Abominação','Força Monstruosa','Massa Reanimada','Avanço Implacável']
])skills[id]=define(name,{damage:3,hp:4},[
 branch('power',power,'damage',4,'Ferocidade','damage',6),
 branch('body',body,'hp',6,'Reconstituição','regen',12),
 branch('command',motion,'cooldown',3,'Perseguição','speed',4)
]);
skills.raio=define('Tiro de Osso',{damage:3},[
 branch('power','Osso Afiado','damage',4,'Fragmento Mortal','damage',6),
 branch('rhythm','Ritmo Fúnebre','cooldown',2,'Disparo Instintivo','cooldown',3),
 branch('pierce','Perfuração','pierce',1,'Medula Cruel','damage',6,2)
]);
for(const [id,name,power,area] of [['chuva','Chuva de Ossos','Queda Violenta','Tempestade Óssea'],['explosao','Explosão Necrótica','Núcleo Necrótico','Onda de Ruína']])skills[id]=define(name,{damage:3},[
 branch('power',power,'damage',4,'Devastação','damage',6),
 branch('area',area,'area',5,'Epicentro','damage',5),
 branch('rhythm','Ritual Ágil','cooldown',2,'Fluxo Profano','cooldown',3)
]);
skills.maos=define('Muralha de Corpos',{damage:3,resistance:4},[
 branch('power','Garras dos Mortos','damage',5,'Aperto Cruel','damage',6),
 branch('body','Corpos Entrelaçados','resistance',8,'Bastião Cadavérico','resistance',10),
 branch('duration','Vigília Fúnebre','duration',5,'Ritual Persistente','cooldown',3)
]);
skills.barreira=define('Escudo de Carne',{absorb:4},[
 branch('body','Carne Densa','absorb',6,'Couraça Viva','absorb',8),
 branch('rhythm','Sacrifício Ágil','cooldown',2,'Ritual de Sangue','cooldown',3),
 branch('pact','Pacto de Proteção','absorb',4,'Reserva de Carne','absorb',7)
]);
skills.dash=define('Dash',{distance:1,cooldown:.5},[
 branch('distance','Passo Longo','distance',3,'Travessia Sombria','distance',4),
 branch('rhythm','Passo Ligeiro','cooldown',2,'Cadência Noturna','cooldown',3),
 branch('escape','Rota de Fuga','distance',2,'Retorno Ágil','cooldown',2)
]);
skills.maldicao=define('Maldição da Fraqueza',{duration:2},[
 branch('curse','Palavra Debilitante','curse',1,'Fraqueza Profunda','curse',1),
 branch('area','Sussurro Coletivo','area',6,'Eco Persistente','duration',6),
 branch('rhythm','Liturgia Breve','cooldown',2,'Condenação Contínua','cooldown',3)
]);
const ids=Object.keys(skills),integer=(v,min,max)=>Math.max(min,Math.min(max,Math.floor(Number(v)||0)));
function xpNext(level){return level>=MAX_LEVEL?0:Math.floor(80*Math.pow(Math.max(1,level),1.65));}
function spent(state){return Object.values(state.ranks||{}).reduce((sum,n)=>sum+n,0);}
function points(state){return Math.max(0,state.level-1-spent(state));}
function normalize(id,input={}){
 const def=skills[id];if(!def||!ids.includes(id))throw Error('Habilidade desconhecida.');
 input=input&&typeof input==='object'?input:{};
 const level=integer(input.level,1,MAX_LEVEL),state={level,xp:level===MAX_LEVEL?0:Math.max(0,Math.min(xpNext(level)-.001,Number(input.xp)||0)),ranks:{}};
 // Roots precede dependents; invalid ranks cannot create points or bypass gates.
 for(const n of def.nodes){
  if(level<n.level||n.requires&&(state.ranks[n.requires]||0)<2)continue;
  const rank=integer(input.ranks?.[n.id],0,Math.min(n.max,points(state)));
  if(rank)state.ranks[n.id]=rank;
 }
 return state;
}
function migrate(input){return Object.fromEntries(ids.map(id=>[id,normalize(id,input?.[id])]));}
function reason(id,state,nodeId){
 const n=skills[id]?.nodes.find(n=>n.id===nodeId);if(!n)return 'Melhoria desconhecida.';
 if(state.level<n.level)return 'Requer maestria nível '+n.level+'.';
 if(n.requires&&(state.ranks[n.requires]||0)<2)return 'Requer 2 pontos em '+skills[id].nodes.find(p=>p.id===n.requires).name+'.';
 if((state.ranks[n.id]||0)>=n.max)return 'Melhoria no máximo.';
 if(points(state)<1)return 'Ganhe um nível nesta habilidade para receber um ponto.';
 return '';
}
function invest(id,state,nodeId){const error=reason(id,state,nodeId);if(error)throw Error(error);state.ranks[nodeId]=(state.ranks[nodeId]||0)+1;return state;}
function bonus(id,state){
 state=normalize(id,state);const result={};
 for(const [key,value]of Object.entries(skills[id].automatic))result[key]=value*(state.level-1);
 for(const n of skills[id].nodes)result[n.stat]=(result[n.stat]||0)+n.value*(state.ranks[n.id]||0);
 result.cooldown=Math.min(50,result.cooldown||0);return result;
}
function gain(id,input,amount,characterLevel=1){
 const state=normalize(id,input),before=state.level,target=Math.min(MAX_LEVEL,Math.ceil(characterLevel/3));
 if(!Number.isFinite(amount)||amount<=0||state.level===MAX_LEVEL)return {state,levels:0};
 // Apply catch-up only to the XP required to reach the target, including large rewards.
 let remaining=amount;
 while(remaining>0&&state.level<MAX_LEVEL){
  const rate=state.level<target?2:1,need=xpNext(state.level)-state.xp,used=Math.min(remaining,need/rate);
  state.xp+=used*rate;remaining-=used;
  if(state.xp+1e-8>=xpNext(state.level)){state.level++;state.xp=0;}else break;
 }
 if(state.level===MAX_LEVEL)state.xp=0;return {state,levels:state.level-before};
}
const api={VERSION,MAX_LEVEL,skills,ids,labels,xpNext,spent,points,normalize,migrate,reason,invest,bonus,gain};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SkillMasteryModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
