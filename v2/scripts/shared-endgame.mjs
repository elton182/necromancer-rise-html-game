// Gerado da fonte canônica.
const module={exports:{}};
(function(root){
'use strict';
const VERSION=3;
const validDifficulty=n=>Number.isSafeInteger(n)&&n>=1;
const curses=[
 {id:'drought',name:'Fonte Seca',text:'−40% de regeneração de mana.',weight:1,mpRegen:.6},
 {id:'frail',name:'Carne Debilitada',text:'−20% de vida máxima e −50% de regeneração de vida.',weight:2,hp:.8,hpRegen:.5},
 {id:'sealed',name:'Poder Profanado',text:'−20% de todo dano causado por Zephyr e pela horda.',weight:3,damage:.8},
 {id:'burden',name:'Lodo nos Pés',text:'−15% de velocidade de movimento de Zephyr.',weight:2,move:.85},
 {id:'brittle',name:'Horda Corroída',text:'−25% de vida máxima das invocações.',weight:2,hordeHp:.75},
 {id:'wither',name:'Vitalidade Extinta',text:'Sem regeneração de vida de Zephyr e −20% de regeneração de mana.',weight:2,hpRegen:0,mpRegen:.8}
];
const encounters={
 expedition:{name:'Expedição do Brejo',influence:20,hp:1},
 apothecary:{name:'Boticário Apodrecido',influence:10,hp:1.45,threshold:30},
 drowned:{name:'Guardiã dos Afogados',influence:10,hp:1.65,threshold:60},
 fortress:{name:'Abade da Decomposição',influence:0,hp:2.2,threshold:100}
};
const number=(v,min,max,fallback=min)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Math.floor(Number(v)))):fallback;
const routeBiomes={swamp:{name:'Pântano',label:'Brejo Sombrio',color:'#889468'},river:{name:'Rio',label:'Travessia do Rio',color:'#819f9f'},mountain:{name:'Montanha',label:'Passagem Rochosa',color:'#aaa396'},desert:{name:'Deserto',label:'Dunas Cinzentas',color:'#cbb073'},forest:{name:'Floresta',label:'Mata dos Vigias',color:'#75916c'},snow:{name:'Neve',label:'Passo Gelado',color:'#bcc8c3'}};
function routeGraph(seed){
 const nodes=[{id:'entry',depth:0,lane:1,kind:'expedition',biome:'swamp',label:'Entrada do Brejo',parents:[]}];
 for(let depth=1;depth<=5;depth++){
  const rr=random(seed+depth*8191),pool=Object.keys(routeBiomes);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(rr()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const parents=nodes.filter(n=>n.depth===depth-1).map(n=>n.id);
  for(let lane=0;lane<3;lane++){const biome=pool[lane];nodes.push({id:'route-'+depth+'-'+lane,depth,lane,kind:depth===2?'apothecary':depth===4?'drowned':'expedition',biome,label:routeBiomes[biome].label,parents});}
 }
 nodes.push({id:'tower',depth:6,lane:1,kind:'fortress',biome:'swamp',label:'Torre da Decomposição',parents:nodes.filter(n=>n.depth===5).map(n=>n.id)});return nodes;
}
function routeAvailable(state,node){return !!node&&(state.routes.completed.includes(node.id)||!node.parents.length||node.parents.some(id=>state.routes.completed.includes(id)));}
function nextRoute(state,kind){const nodes=routeGraph(state.seed).filter(n=>(!kind||n.kind===kind)&&routeAvailable(state,n)).sort((a,b)=>b.depth-a.depth||a.lane-b.lane);return nodes.find(n=>!state.routes.completed.includes(n.id))||nodes[0];}
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function offer(seed,cycle,difficulty){
 const rr=random((seed+Math.imul(cycle+1,7919)+difficulty*3571)>>>0),pool=curses.map(c=>c.id);
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(rr()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return pool.slice(0,4);
}
function normalize(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const state={version:VERSION,seed:number(raw.seed,1,4294967295,170117),influence:number(raw.influence,0,100),
  lieutenants:{apothecary:raw.lieutenants?.apothecary===true,drowned:raw.lieutenants?.drowned===true},
  conquered:raw.conquered===true,fragment:raw.fragment===true,highest:number(raw.highest,0,Number.MAX_SAFE_INTEGER-1),
  difficulty:number(raw.difficulty,1,Number.MAX_SAFE_INTEGER,Math.max(1,number(raw.highest,0,Number.MAX_SAFE_INTEGER-1))),
  attempts:number(raw.attempts,0,Number.MAX_SAFE_INTEGER-1),resolved:number(raw.resolved,0,Number.MAX_SAFE_INTEGER-1),offers:{}};
 if(state.conquered){state.influence=100;state.lieutenants={apothecary:true,drowned:true};state.fragment=true;state.highest=Math.max(state.difficulty,state.highest);}
 state.fragment=state.fragment||state.highest>0;
 state.unlocked=Math.max(state.difficulty,state.highest+1,number(raw.unlocked,1,Number.MAX_SAFE_INTEGER));
 state.resolved=Math.min(state.attempts,state.resolved);
 for(const d of new Set([1,2,3,4,5,state.difficulty])){
  const cycle=number(raw.offers?.[d]?.cycle,0,1000000),ids=offer(state.seed,cycle,d);
  const selected=Array.isArray(raw.offers?.[d]?.selected)?[...new Set(raw.offers[d].selected.filter(id=>ids.includes(id)))].slice(0,3):[];
  state.offers[d]={cycle,selected};
 }
 const graph=routeGraph(state.seed);state.routes={completed:[]};
 if(Array.isArray(raw.routes?.completed)){
  // Only accept connected paths; malformed saves cannot unlock distant areas.
  for(const n of graph)if(raw.routes.completed.includes(n.id)&&routeAvailable(state,n))state.routes.completed.push(n.id);
 }else{
  const milestones=[state.influence>=20,state.influence>=40||state.lieutenants.apothecary,state.lieutenants.apothecary,state.influence>=70||state.lieutenants.drowned,state.lieutenants.drowned,state.influence>=100&&state.lieutenants.apothecary&&state.lieutenants.drowned,state.conquered];
  for(let depth=0;depth<milestones.length&&milestones[depth];depth++)state.routes.completed.push(graph.find(n=>n.depth===depth).id);
 }
 return state;
}
function selectDifficulty(raw,difficulty){
 if(!validDifficulty(difficulty))throw Error('Escolha uma dificuldade inteira a partir de 1.');
 const state=normalize(raw);if(state.difficulty===difficulty)return state;
 state.difficulty=difficulty;state.unlocked=Math.max(state.unlocked,difficulty);
 state.influence=0;state.lieutenants={apothecary:false,drowned:false};state.conquered=false;state.routes={completed:[]};state.resolved=state.attempts;
 state.offers={};for(const d of new Set([1,2,3,4,5,difficulty]))state.offers[d]={cycle:0,selected:[]};
 return state;
}
function latestDifficulty(raw){const state=normalize(raw);return selectDifficulty(state,state.unlocked);}
function available(state,kind,difficulty){
 if(!encounters[kind]||!validDifficulty(difficulty))return false;
 if(state.difficulty!==difficulty)state=selectDifficulty(state,difficulty);
 if(!nextRoute(state,kind))return false;
 if(kind==='expedition')return true;
 if(kind==='fortress')return state.influence===100&&state.lieutenants.apothecary&&state.lieutenants.drowned&&routeAvailable(state,routeGraph(state.seed).at(-1));
 return state.influence>=encounters[kind].threshold;
}
function blockedReason(state,kind,difficulty){
 if(!encounters[kind])return 'Encontro desconhecido.';
 if(!validDifficulty(difficulty))return 'Escolha uma dificuldade inteira a partir de 1.';
 if(state.difficulty!==difficulty)state=selectDifficulty(state,difficulty);
 const missing=[];
 if(!nextRoute(state,kind))missing.push('concluir uma área anterior para abrir este encontro');
 if(state.influence<(encounters[kind].threshold||0))missing.push('alcançar '+encounters[kind].threshold+'% de influência (atual: '+state.influence+'%)');
 if(kind==='fortress')for(const id of ['apothecary','drowned'])if(!state.lieutenants[id])missing.push('derrotar '+encounters[id].name);
 if(kind==='fortress'&&!routeAvailable(state,routeGraph(state.seed).at(-1)))missing.push('concluir uma rota até a torre');
 return missing.length?'Falta '+missing.join('; ')+'.':'';
}
function nextEncounter(state){
 if(state.conquered)return 'fortress';
 const route=nextRoute(state);if(route&&!state.routes.completed.includes(route.id))return route.kind;
 if(state.influence>=30&&!state.lieutenants.apothecary)return 'apothecary';
 if(state.influence>=60&&!state.lieutenants.drowned)return 'drowned';
 if(state.influence>=100&&state.lieutenants.apothecary&&state.lieutenants.drowned)return 'fortress';
 return 'expedition';
}
function chosen(state,difficulty,ids){
 if(!Array.isArray(ids)||ids.length>3||new Set(ids).size!==ids.length)throw Error('Escolha até três maldições distintas.');
 const options=offer(state.seed,state.offers[difficulty]?.cycle||0,difficulty);
 if(ids.some(id=>!options.includes(id)))throw Error('Maldição fora da oferta atual.');
 return ids.map(id=>curses.find(c=>c.id===id));
}
function rewards(state,kind,difficulty,ids=[]){
 const selected=chosen(state,difficulty,ids),score=selected.reduce((n,c)=>n+c.weight,0),tier=score>=6?3:score>=4?2:score>=2?1:0;
 const first=kind==='expedition'||!state.lieutenants[kind];
 return {score,tier,itemLevel:4+(difficulty-1)*6+tier,influence:state.conquered?0:Math.min(100-state.influence,first?encounters[kind].influence+(kind==='expedition'?score*2:0):0),
  gold:60*difficulty+score*15,xp:180*difficulty+score*30,specialChance:tier===3?.25:tier===2?.12:0,
  epicChance:[.15,.25,.4,.6][tier]};
}
function modifiers(ids){
 const out={hp:1,hpRegen:1,mpRegen:1,damage:1,move:1,hordeHp:1};
 for(const id of ids){const c=curses.find(c=>c.id===id);if(c)for(const key of Object.keys(out))out[key]*=c[key]??1;}
 return out;
}
function combatScale(difficulty){
 const level=4+(difficulty-1)*6,power=(base,exponent)=>Math.exp(Math.min(Math.log(base)*exponent,Math.log(Number.MAX_VALUE/1e9)));
 return {hp:power(1.12,level-1),damage:power(1.08,level-1),xp:power(1.04,level-1)*(level<10?1:1.5*1.1**(Math.min(level,60)-10))};
}
function begin(raw,kind,difficulty,ids,routeId){
 const state=selectDifficulty(raw,difficulty);if(!available(state,kind,difficulty))throw Error(blockedReason(state,kind,difficulty));
 const node=routeId?routeGraph(state.seed).find(n=>n.id===routeId):nextRoute(state,kind);
 if(!node||node.kind!==kind||!routeAvailable(state,node))throw Error('Conclua uma área anterior para abrir esta rota.');
 const reward=rewards(state,kind,difficulty,ids);state.attempts++;state.offers[difficulty].selected=[...ids];
 return {state,run:{id:state.attempts,kind,difficulty,curses:[...ids],cycle:state.offers[difficulty].cycle,reward,routeId:node.id,biome:node.biome}};
}
function complete(raw,run){
 const state=normalize(raw);
 if(!run||run.difficulty!==state.difficulty||run.id!==state.attempts||run.id<=state.resolved||!available(state,run.kind,run.difficulty)||state.offers[run.difficulty].cycle!==run.cycle)return {state,applied:false};
 const node=routeGraph(state.seed).find(n=>n.id===run.routeId);if(!node||node.kind!==run.kind||!routeAvailable(state,node))return {state,applied:false};
 const previouslyOpen=new Set(routeGraph(state.seed).filter(n=>routeAvailable(state,n)).map(n=>n.id));
 const reward=rewards(state,run.kind,run.difficulty,run.curses);state.resolved=run.id;
 state.influence=Math.min(100,state.influence+reward.influence);
 if(['apothecary','drowned'].includes(run.kind))state.lieutenants[run.kind]=true;
 if(!state.routes.completed.includes(node.id))state.routes.completed.push(node.id);
 const conqueredNow=run.kind==='fortress'&&!state.conquered;
 const fragmentNow=run.kind==='fortress'&&!state.fragment;
 if(run.kind==='fortress'){state.conquered=true;state.fragment=true;state.highest=Math.max(state.highest,run.difficulty);state.unlocked=Math.max(state.unlocked,run.difficulty+1);}
 state.offers[run.difficulty]={cycle:state.offers[run.difficulty].cycle+1,selected:[]};
 const newRoutes=routeGraph(state.seed).filter(n=>routeAvailable(state,n)&&!previouslyOpen.has(n.id)).map(n=>n.id);
 return {state,applied:true,conqueredNow,fragmentNow,reward,newRoutes};
}
const api={VERSION,validDifficulty,selectDifficulty,latestDifficulty,combatScale,curses,encounters,routeBiomes,routeGraph,routeAvailable,nextRoute,normalize,offer,available,blockedReason,nextEncounter,chosen,rewards,modifiers,begin,complete};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EndgameModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);

export default module.exports;
