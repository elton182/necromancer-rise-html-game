// Gerado da fonte canônica.
const module={exports:{}};
(function(root){
'use strict';
const biomes=['grave','forest','desert','snow','village'];
const tiers={
 common:{name:'Comum',color:'#c7c9c2',hp:1,damage:1,speed:1,xp:1,chance:.16},
 magic:{name:'Mágico',color:'#73b5ff',hp:1.9,damage:1.3,speed:1.08,xp:2,chance:.55},
 rare:{name:'Raro',color:'#ecd16b',hp:3.4,damage:1.65,speed:1.12,xp:4,chance:1}
};
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function plan(wave){
 wave=Math.max(1,Math.min(1000,Math.floor(Number(wave)||1)));
 const rr=random(wave*7919),width=156,height=80;
 const route=[{x:8,y:40},{x:36,y:26+rr()*28},{x:72,y:22+rr()*36},{x:110,y:26+rr()*28},{x:148,y:40}];
 const groups=[];
 for(let i=0;i<12;i++){
  const x=25+i*9.5,side=i%2?1:-1,y=Math.max(12,Math.min(68,routeY(route,x)+side*(7+rr()*14)));
  const tier=i===4||i===9?'rare':i%3===1?'magic':'common';
  groups.push({x,y,tier,mobs:Array.from({length:6+(i%2)*2},(_,j)=>({x:x+Math.cos(j*2.4)*2.8,y:y+Math.sin(j*2.4)*2.8,type:Math.floor(rr()*Math.min(4,2+Math.floor(wave/2)))}))});
 }
 // Retain the original RNG draws and geometry before replacing composition.
 if(wave===4){
  groups[0].mobs.forEach((m,j)=>{m.type=j===0?4:0;});
  groups[0].mobs[0].x=groups[0].x-7;groups[0].mobs[0].y=routeY(route,groups[0].mobs[0].x);
  groups[1].mobs.forEach((m,j)=>{m.type=j<2?4:0;});
 }else if(wave>=5){for(const g of groups)for(let j=0;j<Math.floor(g.mobs.length*.2);j++)g.mobs[j].type=4;}
 return {wave,width,height,biome:biomes[(wave-1)%biomes.length],route,entry:route[0],exit:route.at(-1),groups};
}
function routeY(route,x){let i=1;while(i<route.length-1&&x>route[i].x)i++;const a=route[i-1],b=route[i],t=Math.max(0,Math.min(1,(x-a.x)/(b.x-a.x)));return a.y+(b.y-a.y)*t;}
function lootWeights(tier){return tier==='rare'?{common:0,magic:0,rare:85,epic:15}:tier==='magic'?{common:0,magic:75,rare:22,epic:3}:undefined;}
const api={biomes,tiers,random,plan,routeY,lootWeights};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ExpeditionModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);

export default module.exports;
