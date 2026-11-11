// Praça de recepção das guildas: encerramento do Ato I, sem encontros de combate.
// Reutiliza os kits GLB da vila e do forte. A cidade continua visualmente além da praça.
export function itaveraMap(){
 const objects=[],add=(type,x,y,extra={})=>objects.push({id:'itavera-'+objects.length,type,x,y,...extra});
 for(const x of [-24,-15,15,24])for(const y of [-25,-5,17])add('house',x,y,{h:4.5});
 for(const x of [-8,0,8])add('house',x,-28,{h:x===0?6:5});
 for(let y=-20;y<=30;y+=3)add('path',0,y,{r:5});
 for(let x=-20;x<=20;x+=3)add('path',x,-10,{r:4});
 for(const [x,y] of [[-10,-17],[10,-17],[-11,6],[11,6],[-8,24],[8,24]])add('lamp',x,y);
 for(const [x,y] of [[-20,8],[20,8],[-20,-14],[20,-14]])add('market_stall',x,y);
 for(const [x,y] of [[-17,10],[17,10],[-17,-12],[17,-12]]){add('crate',x,y);add('barrel',x+1,y+1);}
 for(const x of [-32,32])for(let y=-30;y<=30;y+=6)add('fort_wall',x,y,{w:1.4,d:6,h:4});
 for(let x=-29;x<=29;x+=6)add('fort_wall',x,-34,{w:6,d:1.4,h:4});
 for(const x of [-29,-23,-17,17,23,29])add('fort_wall',x,34,{w:6,d:1.4,h:3});
 add('fort_gatehouse',0,34);add('banner',-8,32);add('banner',8,32);
 // Edificações externas não bloqueiam a praça; dão continuidade urbana no zoom máximo.
 for(const x of [-42,-51,42,51])for(const y of [-42,-24,-6,12,30,48])add('house',x,y,{h:5});
 for(const x of [-24,-12,0,12,24])add('house',x,-44,{h:5});
 return {id:'itavera',name:'Itavera · praça das guildas',biome:'village',size:{w:64,h:68},start:{x:0,y:24},level:1,spawns:[],objects,
  style:{ground:'stone',tint:'#e8d7bb',sky:'#746d60',sun:3,ambient:1.7,fog:.15}};
}
