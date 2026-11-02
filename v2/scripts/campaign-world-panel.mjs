import {WORLD_POINTS,WORLD_ROUTES,WORLD_PILES,worldObjectives,worldRegion} from './campaign-world-model.mjs';
import {nearbyWorldPerson,worldDialogue,worldDialogueAction,closeWorldOverlay,toggleWorldMap} from './campaign-world.mjs';

// Cartografia do terreno jogável: mesmos colisores, estradas e posições do mundo.
export function drawWorldMap(canvas,s){
 canvas.width=760;canvas.height=720;const g=canvas.getContext('2d'),w=s.world,b=w.arena.bounds;
 const scale=1.8,ox=380,oy=344,X=x=>ox+x*scale,Y=y=>oy+y*scale;
 g.fillStyle='#14221c';g.fillRect(0,0,760,720);
 g.fillStyle='#233a29';g.fillRect(X(b.minX),Y(b.minY),(b.maxX-b.minX)*scale,(b.maxY-b.minY)*scale);
 for(const o of w.arena.solids){g.fillStyle=['oak','pine'].includes(o.look)?'#40583b':o.look==='house'?'#b38a60':o.look==='rock'?'#6d6f66':'#777969';if(o.kind==='box')g.fillRect(X(o.x-o.width/2),Y(o.y-o.depth/2),Math.max(1,o.width*scale),Math.max(1,o.depth*scale));else{g.beginPath();g.arc(X(o.x),Y(o.y),Math.max(['oak','pine'].includes(o.look)?2.2:1,o.r*scale),0,Math.PI*2);g.fill();}}
 for(const path of Object.values(WORLD_ROUTES)){g.strokeStyle='#aa9465';g.lineWidth=4;g.lineJoin='round';g.beginPath();path.forEach(([x,y],i)=>i?g.lineTo(X(x),Y(y)):g.moveTo(X(x),Y(y)));g.stroke();}
 const pin=(p,label,color,dx=10,dy=-10)=>{g.fillStyle=color;g.beginPath();g.arc(X(p.x),Y(p.y),5,0,Math.PI*2);g.fill();g.font='bold 15px Georgia';g.lineWidth=4;g.strokeStyle='#14221c';g.strokeText(label,X(p.x)+dx,Y(p.y)+dy);g.fillText(label,X(p.x)+dx,Y(p.y)+dy);};
 pin(WORLD_POINTS.crypt,'Cripta','#d3c4e1');pin(WORLD_POINTS.forest,'Bosque dos Vigias','#bdd49e',-25,24);pin(WORLD_POINTS.village,'Jacarandá','#efd293',-22,30);pin(WORLD_POINTS.prison,'Posto em ruínas','#d9a584',10,4);
 pin(WORLD_POINTS.mine,'Mina de Valfundo','#c9b8a2',12,4);pin(WORLD_POINTS.mill,'Serraria do Vale','#d6b27c',-60,30);pin(WORLD_POINTS.graveyard,'Cemitério','#b9c2cc',-40,-14);
 const p=s.save.campaign.world;WORLD_PILES.forEach((pile,i)=>{if(p.lumber==='active'&&!p.piles[i]){g.fillStyle='#e0a24f';g.fillRect(X(pile.x)-4,Y(pile.y)-4,8,8);}});
 g.strokeStyle='#ffd879';g.lineWidth=2;for(const o of worldObjectives(p)){g.beginPath();g.arc(X(o.target.x),Y(o.target.y),12,0,Math.PI*2);g.stroke();}
 pin(w.player,'Você','#8df9e4',9,20);
 g.font='14px Georgia';g.fillStyle='#e2d8b9';g.fillText('N ↑',700,40);g.fillText('Círculos dourados: objetivos atuais · Quadrados: pilhas de madeira',28,700);
}
export function renderWorldPanel(s,{host,node,button,interact,merchant=()=>{}}){
 const r=s.world.adventure,p=s.save.campaign.world,objectives=worldObjectives(p),objective=objectives[0],w=s.world;
 if(r.mapOpen){host.dataset.view='world-map';node('h2','Arredores de Jacarandá');for(const o of objectives)node('p',o.title+' · '+o.text);const canvas=node('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Mapa contínuo de Jacarandá: cripta a oeste, bosque ao centro, vila a sudeste, posto e mina ao norte, serraria a sudoeste e cemitério a leste. Sua posição e os objetivos estão marcados.');drawWorldMap(canvas,s);button('Fechar mapa · continuar',()=>closeWorldOverlay(s));return;}
 if(r.dialogue){host.dataset.view='world-dialogue';const d=worldDialogue(s);node('small','CRÔNICAS DE JACARANDÁ');node('h2',d.title);node('p',d.text);
  if(d.kind==='forge')button(d.action,()=>{closeWorldOverlay(s);merchant();});else if(d.action)button(d.action,()=>worldDialogueAction(s));
  button('Fechar conversa',()=>closeWorldOverlay(s));return;}
 host.dataset.view='world';node('small',worldRegion(w.player));
 for(const [i,o] of objectives.entries()){node(i?'h4':'h3',o.title);node('p',o.text);}
 const target=objective.target,dx=target.x-w.player.x,dy=target.y-w.player.y,d=Math.hypot(dx,dy),direction=(dy<-4?'norte':dy>4?'sul':'')+(Math.abs(dx)>4?(Math.abs(dy)>4?' / ':'')+(dx>0?'leste':'oeste'):'');
 node('small',d<3.2?'G · conversar':Math.round(d)+' m · '+direction);
 const npc=nearbyWorldPerson(s);if(npc)button('G · '+npc.name,interact);
 button('Mapa da região · M',()=>toggleWorldMap(s));
}
