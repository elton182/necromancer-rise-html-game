import {CEDRO_POINTS} from './cedro-model.mjs';
import {WORLD_POINTS,WORLD_ROUTES,WORLD_PILES,WORLD_EXITS,WORLD_ROAD_ITAUNA,worldObjectives} from './campaign-world-model.mjs';
import {AREAS,ITAUNA_POINTS,FORT_POINTS,CAVE_POINTS,areaObjectives} from './itauna-model.mjs';
import {NILO_POINTS} from './nilo-model.mjs';
import {heightAt,TERRAIN_RULES} from './map-terrain.mjs';
const W=1160,H=850;
function locations(s){
 const area=s.world.adventure?.area,a=s.world.arena;
 const points=area==='cedro'?Object.entries(CEDRO_POINTS):area==='itauna'?Object.entries(ITAUNA_POINTS):area==='itauna-fort'?Object.entries(FORT_POINTS):area==='itauna-cave'?Object.entries(CAVE_POINTS):area==='itavera'?['helena','cityJoao','cityMarta'].map(k=>[k,NILO_POINTS[k]]):area?[]:['crypt','forest','village','prison','mine','mill','graveyard'].map(k=>[k,WORLD_POINTS[k]]);
 const out=points.map(([id,p])=>({...p,id,kind:/village/.test(id)?'village':/mine|crypt|cave|queen/.test(id)?'cave':/fort|keep|prison|tower|inner|gate/i.test(id)?'fort':/lake|mirror|ford|bridge|fishing/.test(id)?'water':'place'}));
 for(const e of a.exits||WORLD_EXITS)if(!out.some(p=>Math.hypot(p.x-e.x,p.y-e.y)<8))out.push({...e,id:'exit-'+e.id,kind:'exit'});
 return out;
}
export function drawRegionMap(canvas,s,{zoom=1,center=null,selected=null}={}){
 const markScale=Math.max(1,Math.min(2.8,850/(canvas.clientWidth||850)));canvas.width=W;canvas.height=H;const g=canvas.getContext('2d'),w=s.world,a=w.arena,b=a.bounds,area=w.adventure?.area,scale=Math.min((W-180)/(b.maxX-b.minX),(H-170)/(b.maxY-b.minY))*zoom,c=center||{x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2},X=x=>W/2+(x-c.x)*scale,Y=y=>H/2+(y-c.y)*scale;
 const paper=g.createRadialGradient(W*.45,H*.4,20,W*.5,H*.5,W*.7);paper.addColorStop(0,'#e3d6ac');paper.addColorStop(.65,'#cdbb8c');paper.addColorStop(1,'#998052');g.fillStyle=paper;g.fillRect(0,0,W,H);
 g.save();g.beginPath();g.rect(25,25,W-50,H-50);g.clip();
 const step=7,cols=Math.ceil(W/step),rows=Math.ceil(H/step),heights=[];
 for(let j=0;j<rows;j++){heights[j]=[];for(let i=0;i<cols;i++){
  const x=(i*step-W/2)/scale+c.x,y=(j*step-H/2)/scale+c.y,h=heightAt(a,x,y);heights[j][i]=h;
  const inside=x>=b.minX&&x<=b.maxX&&y>=b.minY&&y<=b.maxY;
  if(!inside)continue;
  g.fillStyle=h<TERRAIN_RULES.deep?'#739593':h<TERRAIN_RULES.wet?'#9cae9c':a.cave?'#b8ac87':h>3.4?'#a49a79':h>1.2?'#bcc19a':'#c8c9a1';g.globalAlpha=.55;g.fillRect(i*step,j*step,step,step);g.globalAlpha=1;
  if(i&&j&&h>TERRAIN_RULES.wet&&(Math.floor(h/.85)!==Math.floor(heights[j][i-1]/.85)||Math.floor(h/.85)!==Math.floor(heights[j-1][i]/.85))){g.strokeStyle='#756a4930';g.lineWidth=.7;g.beginPath();g.moveTo(i*step,j*step);g.lineTo(i*step+step,j*step+step);g.stroke();}
 }}
 // Leve granulação determinística: nenhuma imagem ou fonte externa.
 for(let i=0;i<4200;i++){const x=(i*7919%W),y=(i*3571%H);g.fillStyle=i%3?'#fff8df16':'#53432512';g.fillRect(x,y,1+(i%2),1);}
 const line=(points,color,width)=>{g.beginPath();points.forEach((p,i)=>i?g.lineTo(X(p.x??p[0]),Y(p.y??p[1])):g.moveTo(X(p.x??p[0]),Y(p.y??p[1])));g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke();};
 if(a.cave){for(const o of a.solids)if(o.look==='cave-boundary'){g.fillStyle='#776c52';g.strokeStyle='#5c513c';g.lineWidth=1;g.fillRect(X(o.x-o.width/2),Y(o.y-o.depth/2),o.width*scale,o.depth*scale);}}
 for(const o of a.solids){const x=X(o.x),y=Y(o.y);if(x<25||x>W-25||y<25||y>H-25)continue;
  if(['oak','pine'].includes(o.look)){g.strokeStyle='#52674777';g.fillStyle='#6c7e5b55';g.lineWidth=.8;g.beginPath();g.moveTo(x,y-5);g.lineTo(x-4,y+3);g.lineTo(x+4,y+3);g.closePath();g.fill();g.stroke();g.beginPath();g.moveTo(x,y+3);g.lineTo(x,y+5);g.stroke();}
  else if(o.look==='house'||o.look==='kit-prop'&&o.kind==='box'){const width=Math.max(3,Math.min(35,(o.width||2)*scale)),depth=Math.max(3,Math.min(35,(o.depth||2)*scale));g.fillStyle='#9d846157';g.strokeStyle='#74634677';g.lineWidth=.8;g.fillRect(x-width/2,y-depth/2,width,depth);g.strokeRect(x-width/2,y-depth/2,width,depth);}
 }
 if(!area)for(const route of [...Object.values(WORLD_ROUTES),WORLD_ROAD_ITAUNA]){line(route,'#756044',9);line(route,'#e9d5a3',5);line(route,'#a18a60',.8);}
 else{g.fillStyle='#785f4380';for(const p of a.decor?.path||[]){g.beginPath();g.arc(X(p.x),Y(p.y),2.2,0,7);g.fill();}}
 g.strokeStyle='#78654088';g.lineWidth=1;g.setLineDash([5,7]);g.strokeRect(X(b.minX),Y(b.minY),(b.maxX-b.minX)*scale,(b.maxY-b.minY)*scale);g.setLineDash([]);
 const pins=locations(s),labels=[];
 function symbol(p){const x=X(p.x),y=Y(p.y),chosen=selected===p.id;g.save();g.translate(x,y);g.scale(markScale,markScale);if(chosen){g.strokeStyle='#a35326';g.lineWidth=2;g.beginPath();g.arc(0,0,20,0,7);g.stroke();}g.fillStyle='#eadbb4';g.strokeStyle='#58482f';g.lineWidth=1.8;g.beginPath();g.arc(0,0,11,0,7);g.fill();g.stroke();g.beginPath();
  if(p.kind==='village'){g.moveTo(-6,1);g.lineTo(0,-6);g.lineTo(6,1);g.lineTo(6,6);g.lineTo(-6,6);g.closePath();g.moveTo(-1,6);g.lineTo(-1,2);g.lineTo(2,2);g.lineTo(2,6);}
  else if(p.kind==='fort'){g.rect(-6,-3,12,9);g.moveTo(-6,-3);g.lineTo(-6,-7);g.lineTo(-2,-7);g.lineTo(-2,-3);g.lineTo(2,-3);g.lineTo(2,-7);g.lineTo(6,-7);g.lineTo(6,-3);}
  else if(p.kind==='cave'){g.moveTo(-7,6);g.lineTo(-4,-3);g.lineTo(1,-7);g.lineTo(7,6);g.closePath();g.moveTo(-2,6);g.lineTo(0,0);g.lineTo(3,6);}
  else if(p.kind==='exit'){g.moveTo(-6,0);g.lineTo(6,0);g.moveTo(1,-5);g.lineTo(6,0);g.lineTo(1,5);}
  else if(p.kind==='water'){g.moveTo(-6,-2);g.quadraticCurveTo(-3,-5,0,-2);g.quadraticCurveTo(3,1,6,-2);g.moveTo(-6,4);g.quadraticCurveTo(-3,1,0,4);g.quadraticCurveTo(3,7,6,4);}
  else{g.moveTo(0,-6);g.lineTo(6,0);g.lineTo(0,6);g.lineTo(-6,0);g.closePath();}g.stroke();g.restore();}
 for(const p of pins)symbol(p);
 // Rótulos procuram espaço livre; conectores mantêm o ponto exato legível.
 const labelSize=Math.round(16*markScale),labelHeight=labelSize+10;g.font='bold '+labelSize+'px Georgia';for(const p of pins){const x=X(p.x),y=Y(p.y);if(x<30||x>W-30||y<30||y>H-30)continue;const width=g.measureText(p.name).width+16;let box;
  for(const [dx,dy] of [[18*markScale,-labelHeight/2],[18*markScale,15*markScale],[-width-18*markScale,-labelHeight/2],[-width-18*markScale,15*markScale],[-width/2,35*markScale],[-width/2,-40*markScale],[18*markScale,53*markScale],[-width-18*markScale,53*markScale]]){const r={x:Math.max(35,Math.min(W-width-35,x+dx)),y:Math.max(40,Math.min(H-labelHeight-35,y+dy)),w:width,h:labelHeight};if(!labels.some(o=>r.x<o.x+o.w+5&&r.x+r.w+5>o.x&&r.y<o.y+o.h+4&&r.y+r.h+4>o.y)){box=r;break;}}
  if(!box)continue;labels.push(box);g.strokeStyle='#806c4d80';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(Math.max(box.x,Math.min(box.x+box.w,x)),box.y+box.h/2);g.stroke();g.fillStyle='#e4d5aeea';g.fillRect(box.x,box.y,box.w,box.h);g.fillStyle='#4a3c28';g.fillText(p.name,box.x+8,box.y+labelSize+3);
 }
 const objectives=area?areaObjectives(area,s.save.campaign.world):worldObjectives(s.save.campaign.world);for(const o of objectives){const x=X(o.target.x),y=Y(o.target.y);g.strokeStyle='#9a6326';g.fillStyle='#e3b64c';g.lineWidth=2;g.beginPath();g.moveTo(x,y-13);g.lineTo(x+9,y);g.lineTo(x,y+13);g.lineTo(x-9,y);g.closePath();g.fill();g.stroke();}
 if(!area&&s.save.campaign.world.lumber==='active')WORLD_PILES.forEach((p,i)=>{if(!s.save.campaign.world.piles[i]){g.fillStyle='#9a6326';g.fillRect(X(p.x)-4,Y(p.y)-4,8,8);}});
 const px=X(w.player.x),py=Y(w.player.y);g.fillStyle='#244f58';g.strokeStyle='#fff1c7';g.lineWidth=3;g.beginPath();g.arc(px,py,9*markScale,0,7);g.fill();g.stroke();g.fillStyle='#244f58';g.beginPath();g.moveTo(px,py-18);g.lineTo(px-5,py-10);g.lineTo(px+5,py-10);g.closePath();g.fill();g.restore();
 g.strokeStyle='#79603b';g.lineWidth=2;g.strokeRect(18,18,W-36,H-36);g.lineWidth=.6;g.strokeRect(24,24,W-48,H-48);
 // Rosa dos ventos e escala usam a mesma projeção dos pontos.
 g.save();g.translate(W-65,72);g.strokeStyle='#675333';g.fillStyle='#675333';g.lineWidth=1;g.beginPath();g.moveTo(0,-22);g.lineTo(7,8);g.lineTo(0,3);g.lineTo(-7,8);g.closePath();g.stroke();g.fill();g.font='bold '+Math.round(17*markScale)+'px Georgia';g.fillText('N',-7,-29);g.restore();g.fillStyle='#675333';g.strokeStyle='#675333';g.lineWidth=2;g.beginPath();g.moveTo(55,H-58);g.lineTo(55+40*scale,H-58);g.stroke();g.font=Math.round(13*markScale)+'px Georgia';g.fillText('40 m',55,H-36);
 return {pins,project:p=>({x:X(p.x)/W,y:Y(p.y)/H})};
}
export function renderRegionMap(s,{host,node,button,close}){
 const area=s.world.adventure?.area,objectives=area?areaObjectives(area,s.save.campaign.world):worldObjectives(s.save.campaign.world),title=area?AREAS[area].name:'Arredores de Jacarandá';host.dataset.view='world-map';
 const localButton=(text,action,parent)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;parent.append(b);return b;};
 const el=(tag,text,parent,cls)=>{const e=node(tag,text,parent);if(cls)e.className=cls;return e;};
 const heading=el('header','',host,'region-map-heading'),intro=el('div','',heading);el('small','ATLAS DA JORNADA · ATO I',intro);el('h2',title,intro);el('p','Estradas, lugares e os próximos passos da sua jornada.',intro);const closeButton=button('Fechar mapa · M',close,false,heading);closeButton.className='region-map-close';
 const layout=el('div','',host,'region-map-layout'),sheet=el('div','',layout,'region-map-sheet'),canvas=el('canvas','',sheet);canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Mapa de '+title+'. Sua posição em azul; objetivos em dourado. Selecione um lugar na lista para destacá-lo.');
 const controls=el('div','',sheet,'region-map-controls'),sidebar=el('aside','',layout,'region-map-sidebar');let zoom=1,center=null,selected=null;
 const paint=()=>drawRegionMap(canvas,s,{zoom,center,selected});const ctl=(text,action,label)=>{const b=localButton(text,action,controls);b.setAttribute('aria-label',label||text);return b;};
 ctl('−',()=>{zoom=Math.max(1,zoom-.5);if(zoom===1)center=null;paint();},'Diminuir mapa');ctl('+',()=>{zoom=Math.min(3,zoom+.5);paint();},'Ampliar mapa');ctl('Visão geral',()=>{zoom=1;center=null;selected=null;for(const b of sidebar.querySelectorAll('[data-map-place]'))b.setAttribute('aria-pressed','false');paint();});ctl('Minha posição',()=>{center={...s.world.player};zoom=2;paint();});
 el('small','SEU DESTINO',sidebar,'map-eyebrow');for(const o of objectives){const box=el('div','',sidebar,'map-objective');el('b',o.title,box);el('p',o.text,box);}
 el('h3','Lugares da região',sidebar);const list=el('div','',sidebar,'map-places');for(const p of locations(s)){const b=localButton(p.name,()=>{selected=p.id;center=null;zoom=1;paint();for(const other of list.children)other.setAttribute('aria-pressed',String(other===b));},list);b.dataset.mapPlace=p.id;b.setAttribute('aria-pressed','false');}
 const legend=el('div','',sidebar,'map-legend');for(const [mark,label,cls] of [['●','Você','player'],['◆','Objetivo atual','objective'],['↗','Passagens','exit'],['━','Estradas','road']]){const item=el('span','',legend);el('i',mark,item,cls);el('span',label,item);}el('p','O mapa acompanha sua região atual. O jogo fica pausado enquanto você consulta o atlas.',sidebar,'map-note');paint();
}
