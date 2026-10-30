// Cerco ao Ritual: regras puras, sem mundo, DOM ou armazenamento.
export const WAVES=8,MAX_TIER=20;
export const CORE={x:0,y:8,hp:20};
export const TOWERS={
 bone:{name:'Torre de Ossos',model:'siegeBone',cost:80,range:7,interval:.9,damage:28,color:'#e9d9ae',desc:'Projétil contra um alvo. Bom alcance e dano direto.'},
 frost:{name:'Sepultura Gélida',model:'siegeFrost',cost:70,range:5.5,interval:1.2,damage:5,color:'#83e5ff',desc:'Pulso em área: desacelera 45% por 1,5 s.'},
 plague:{name:'Caldeirão da Peste',model:'siegePlague',cost:100,range:5,interval:.6,damage:9,color:'#a3e76d',desc:'Nuvem causa dano contínuo em todos no alcance.'},
 crypt:{name:'Cripta dos Guardiões',model:'siegeCrypt',cost:90,range:5,interval:12,damage:16,color:'#c29aff',desc:'Dois guardiões seguram a rota; reanima os caídos a cada 12 s.'}
};
export const LANES=[
 {name:'Oeste',from:1,resist:'frost',points:[{x:-21,y:-12},{x:-12,y:-12},{x:-10,y:-2},{x:-5,y:4},CORE]},
 {name:'Norte',from:3,resist:'bone',points:[{x:0,y:-22},{x:0,y:-12},{x:3,y:-5},{x:0,y:2},CORE]},
 {name:'Leste',from:5,resist:'plague',points:[{x:21,y:-12},{x:12,y:-12},{x:10,y:-2},{x:5,y:4},CORE]}
];
export const PADS=[[-14,-7],[-7,-5],[-4,-14],[5,-12],[14,-7],[7,-5],[-5,7],[5,7]].map(([x,y],i)=>({id:i+1,x,y}));
export const MODIFIERS={none:{name:'Ritual estável',hp:1,speed:1,reward:1},armored:{name:'Legião couraçada',hp:1.3,speed:1,reward:1.25},haste:{name:'Marcha implacável',hp:1,speed:1.2,reward:1.25}};
const int=(v,d,max)=>Number.isSafeInteger(v)&&v>=0?Math.min(max,v):d;
export function normalizeSiege(raw={}){return {unlocked:Math.max(1,int(raw?.unlocked,1,MAX_TIER)),best:int(raw?.best,0,MAX_TIER),wins:int(raw?.wins,0,1e6),shards:int(raw?.shards,0,1e6),rune:Object.hasOwn(TOWERS,raw?.rune)?raw.rune:'bone',runes:Object.fromEntries(Object.keys(TOWERS).map(k=>[k,int(raw?.runes?.[k],0,3)]))};}
export function guardianStats(t,r){const rune=r.rune==='crypt'?1+.12*r.runeRank:1;return {maxHp:Math.round(80*t.rank*(1+.15*(r.tier-1))*rune),power:(16+10*(t.rank-1))*(1+.18*(r.tier-1))*rune};}
export const activeLanes=wave=>LANES.map((l,i)=>l.from<=wave?i:-1).filter(i=>i>=0);
export const towerCost=t=>TOWERS[t.kind].cost*(t.rank+1);
export const runeCost=rank=>2+rank;
export function wavePlan(tier,wave,modifier='none'){
 const mod=MODIFIERS[modifier],lanes=activeLanes(wave),count=8+wave*2;
 return Array.from({length:count},(_,i)=>({lane:lanes[i%lanes.length],time:i*.75,type:[0,0,6,2,8][i%5],boss:wave===WAVES&&i===count-1,hp:Math.round((58+wave*15)*(1+.22*(tier-1))*mod.hp),speed:(1.1+wave*.035)*mod.speed,damage:Math.round((9+wave)*(1+.15*(tier-1)))}));
}
export function victoryReward(tier,modifier){const m=MODIFIERS[modifier].reward;return {gold:Math.round((180+120*tier)*m),xp:Math.round((240+160*tier)*m),shards:modifier==='none'?1:2};}
export function siegeArena(){return {id:'siege',theme:'siege',bounds:{minX:-24,maxX:24,minY:-25,maxY:18},solids:[],palette:{dark:{ground:0x2d3036,background:0x16141f},light:{ground:0x74777d,background:0x7d7c86}},lanes:LANES,pads:PADS};}
