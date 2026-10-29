// Cripta Esquecida (fase 1): enriquece o mapa de salas/corredores de roomArena().
// Paredes continuam sendo os mesmos blocos de colisão; `look`/`tall` só orientam o desenho.
// Pilares e sarcófagos são colisores novos, afastados do centro das salas onde as ondas nascem.
import {roomArena} from './campaign-model.mjs';
export const CRYPT_ID='campaign-crypt';
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick=(r,a,b)=>a+(b-a)*r();

export function cryptArena(){
 const arena=roomArena(),random=rng(0xC4B7),rooms=arena.walk.filter(r=>r.id),rects=arena.walk;
 // Paredes ao norte e ao oeste ficam altas; as voltadas para a câmera (sul/leste) ficam baixas para não ocultar a sala.
 const walls=arena.solids.map((s,i)=>({...s,look:'wall',tall:s.y<-1||s.x<0,tone:+random().toFixed(2),index:i}));
 const solids=[...walls];
 for(const r of rooms.filter(r=>r.id!=='A')){
  const cx=(r.x0+r.x1)/2,dx=Math.min(6.8,(r.x1-r.x0)/2-3.6),dy=Math.min(5.6,(r.y1-r.y0)/2-2.6);
  // Quatro pilares emoldurando o campo central; sarcófagos encostados à parede norte.
  for(const sx of [-1,1])for(const sy of [-1,1])solids.push({kind:'circle',look:'pillar',x:+(cx+sx*dx).toFixed(2),y:+(sy*dy).toFixed(2),r:.6,height:3.2});
  for(const sx of [-1,1])solids.push({kind:'box',look:'sarcophagus',x:+(cx+sx*(dx+.7)).toFixed(2),y:+(r.y0+.65).toFixed(2),width:2.4,depth:1,height:.8,tone:random()});
 }
 const decor={tiles:[],torches:[],banners:[],bones:[],rugs:[{x0:-8,x1:109,y:0,w:1.7}]};
 // Lajes: grade de ~2 u por retângulo caminhável, com tom variável; a fresta mostra o chão escuro.
 for(const r of rects){const nx=Math.ceil((r.x1-r.x0)/2),ny=Math.ceil((r.y1-r.y0)/2),w=(r.x1-r.x0)/nx,d=(r.y1-r.y0)/ny;
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)decor.tiles.push({x:+(r.x0+(i+.5)*w).toFixed(2),y:+(r.y0+(j+.5)*d).toFixed(2),w:+(w-.1).toFixed(2),d:+(d-.1).toFixed(2),tone:+random().toFixed(2)});}
 for(const r of rooms){const cx=(r.x0+r.x1)/2,half=(r.x1-r.x0)/2;
  for(const k of r.id==='A'?[-.5,.5]:[-.7,0,.7])decor.torches.push({x:+(cx+k*half).toFixed(2),y:+(r.y0+.03).toFixed(2),face:'s'});
  if(r.id!=='A')decor.banners.push({x:+cx.toFixed(2),y:+(r.y0+.04).toFixed(2),tone:random()});
  for(const y of [-3.5,3.5])decor.torches.push({x:+(r.x0+.03).toFixed(2),y,face:'e'});
  for(let n=0;n<14;n++)decor.bones.push({x:+pick(random,r.x0+1,r.x1-1).toFixed(2),y:+pick(random,r.y0+1,r.y1-1).toFixed(2),size:+pick(random,.18,.38).toFixed(2),tone:+random().toFixed(2)});}
 for(const c of rects.filter(r=>!r.id))decor.torches.push({x:+((c.x0+c.x1)/2).toFixed(2),y:+(c.y0+.03).toFixed(2),face:'s'});
 return {...arena,id:CRYPT_ID,theme:'crypt',solids,decor};
}
