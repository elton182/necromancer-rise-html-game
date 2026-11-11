import {campaignQuests} from './quest-model.mjs';
import {WORLD_POINTS,WORLD_ROUTES,WORLD_PILES,WORLD_EXITS,WORLD_ROAD_ITAUNA,worldObjectives,worldRegion} from './campaign-world-model.mjs';
import {nearbyWorldPerson,nearbyExit,homeTeleport,teleportHome,worldDialogue,worldDialogueAction,closeWorldOverlay,toggleWorldMap} from './campaign-world.mjs';
import {AREAS,areaObjectives,areaRegion} from './itauna-model.mjs';
import {heightAt,TERRAIN_RULES} from './map-terrain.mjs';

// Cartografia de uma área: cor do relevo e da água lida do próprio terreno, trilhas, passagens e objetivos.
function drawAreaMap(canvas,s){
 canvas.width=760;canvas.height=720;const g=canvas.getContext('2d'),w=s.world,a=w.arena,b=a.bounds,scale=Math.min(720/(b.maxX-b.minX),680/(b.maxY-b.minY)),ox=380-(b.minX+b.maxX)/2*scale,oy=348-(b.minY+b.maxY)/2*scale,X=x=>ox+x*scale,Y=y=>oy+y*scale,step=4;
 g.fillStyle='#14221c';g.fillRect(0,0,760,720);
 for(let py=Y(b.minY);py<Y(b.maxY);py+=step)for(let px=X(b.minX);px<X(b.maxX);px+=step){const h=heightAt(a,(px-ox)/scale,(py-oy)/scale);g.fillStyle=h<TERRAIN_RULES.deep?'#24505c':h<TERRAIN_RULES.wet?'#3b7a86':h>3.4?'#6f6e66':h>1.2?'#3f5a38':a.cave?'#26282a':'#2c4630';g.fillRect(px,py,step,step);}
 if(a.cave)for(const o of a.solids)if(o.look==='cave-boundary'){g.fillStyle='#55534d';g.fillRect(X(o.x-o.width/2),Y(o.y-o.depth/2),o.width*scale,o.depth*scale);}
 for(const o of a.solids)if(['oak','pine'].includes(o.look)){g.fillStyle='#1f3524';g.beginPath();g.arc(X(o.x),Y(o.y),1.8,0,Math.PI*2);g.fill();}else if(o.look==='kit-prop'&&o.kind==='box'){g.fillStyle='#a09c90';g.fillRect(X(o.x-o.width/2),Y(o.y-o.depth/2),Math.max(1,o.width*scale),Math.max(1,o.depth*scale));}
 g.fillStyle='#aa9465';for(const p of a.decor.path)g.fillRect(X(p.x)-1.5,Y(p.y)-1.5,3,3);
 const pin=(p,label,color,dx=10,dy=-10)=>{g.fillStyle=color;g.beginPath();g.arc(X(p.x),Y(p.y),5,0,Math.PI*2);g.fill();g.font='bold 15px Georgia';g.lineWidth=4;g.strokeStyle='#14221c';g.strokeText(label,X(p.x)+dx,Y(p.y)+dy);g.fillText(label,X(p.x)+dx,Y(p.y)+dy);};
 for(const e of a.exits||[])pin(e,e.name,'#a9ddc9',X(e.x)>560?-150:10,Y(e.y)<40?20:-10);
 g.strokeStyle='#ffd879';g.lineWidth=2;for(const o of areaObjectives(w.adventure.area,s.save.campaign.world)){g.beginPath();g.arc(X(o.target.x),Y(o.target.y),12,0,Math.PI*2);g.stroke();}
 pin(w.player,'Você','#8df9e4',9,20);
 g.font='14px Georgia';g.fillStyle='#e2d8b9';g.fillText('N ↑',700,40);g.fillText('Círculos dourados: objetivos · Verde-água: passagens',28,706);
}
// Cartografia do terreno jogável: mesmos colisores, estradas e posições do mundo.
export function drawWorldMap(canvas,s){
 if(s.world.adventure?.area)return drawAreaMap(canvas,s);
 canvas.width=760;canvas.height=720;const g=canvas.getContext('2d'),w=s.world,b=w.arena.bounds;
 const scale=1.8,ox=380,oy=344,X=x=>ox+x*scale,Y=y=>oy+y*scale;
 g.fillStyle='#14221c';g.fillRect(0,0,760,720);
 g.fillStyle='#233a29';g.fillRect(X(b.minX),Y(b.minY),(b.maxX-b.minX)*scale,(b.maxY-b.minY)*scale);
 for(const o of w.arena.solids){g.fillStyle=['oak','pine'].includes(o.look)?'#40583b':o.look==='house'?'#b38a60':o.look==='rock'?'#6d6f66':'#777969';if(o.kind==='box')g.fillRect(X(o.x-o.width/2),Y(o.y-o.depth/2),Math.max(1,o.width*scale),Math.max(1,o.depth*scale));else{g.beginPath();g.arc(X(o.x),Y(o.y),Math.max(['oak','pine'].includes(o.look)?2.2:1,o.r*scale),0,Math.PI*2);g.fill();}}
 for(const path of [...Object.values(WORLD_ROUTES),WORLD_ROAD_ITAUNA]){g.strokeStyle='#aa9465';g.lineWidth=4;g.lineJoin='round';g.beginPath();path.forEach(([x,y],i)=>i?g.lineTo(X(x),Y(y)):g.moveTo(X(x),Y(y)));g.stroke();}
 const pin=(p,label,color,dx=10,dy=-10)=>{g.fillStyle=color;g.beginPath();g.arc(X(p.x),Y(p.y),5,0,Math.PI*2);g.fill();g.font='bold 15px Georgia';g.lineWidth=4;g.strokeStyle='#14221c';g.strokeText(label,X(p.x)+dx,Y(p.y)+dy);g.fillText(label,X(p.x)+dx,Y(p.y)+dy);};
 pin(WORLD_POINTS.crypt,'Cripta','#d3c4e1');pin(WORLD_POINTS.forest,'Bosque dos Vigias','#bdd49e',-25,24);pin(WORLD_POINTS.village,'Jacarandá','#efd293',-22,30);pin(WORLD_POINTS.prison,'Posto em ruínas','#d9a584',10,4);
 pin(WORLD_POINTS.mine,'Mina de Valfundo','#c9b8a2',12,4);pin(WORLD_POINTS.mill,'Serraria do Vale','#d6b27c',-60,30);pin(WORLD_POINTS.graveyard,'Cemitério','#b9c2cc',-40,-14);
 for(const e of WORLD_EXITS)pin(e,e.name,'#a9ddc9',-128,22);
 const p=s.save.campaign.world;WORLD_PILES.forEach((pile,i)=>{if(p.lumber==='active'&&!p.piles[i]){g.fillStyle='#e0a24f';g.fillRect(X(pile.x)-4,Y(pile.y)-4,8,8);}});
 g.strokeStyle='#ffd879';g.lineWidth=2;for(const o of worldObjectives(p)){g.beginPath();g.arc(X(o.target.x),Y(o.target.y),12,0,Math.PI*2);g.stroke();}
 pin(w.player,'Você','#8df9e4',9,20);
 g.font='14px Georgia';g.fillStyle='#e2d8b9';g.fillText('N ↑',700,40);g.fillText('Círculos dourados: objetivos atuais · Quadrados: pilhas de madeira',28,700);
}
// Painel de objetivos recolhido ou aberto: preferência só desta sessão de jogo.
let trackerCollapsed=false;
export function renderWorldPanel(s,{host,node,button,interact,merchant=()=>{}}){
 const r=s.world.adventure,p=s.save.campaign.world,area=r.area,objectives=area?areaObjectives(area,p):worldObjectives(p),objective=objectives[0],w=s.world;
 if(r.mapOpen){host.dataset.view='world-map';node('h2',area?AREAS[area].name:'Arredores de Jacarandá');for(const o of objectives)node('p',o.title+' · '+o.text);const canvas=node('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',area?'Mapa de '+AREAS[area].name+': relevo, água, trilhas e passagens. Sua posição e os objetivos estão marcados.':'Mapa contínuo de Jacarandá: cripta a oeste, bosque ao centro, vila a sudeste, posto e mina ao norte, serraria a sudoeste, cemitério a leste e a estrada para a Várzea de Itaúna. Sua posição e os objetivos estão marcados.');drawWorldMap(canvas,s);button('Fechar mapa · continuar',()=>closeWorldOverlay(s));return;}
 if(r.dialogue){host.dataset.view='world-dialogue';const d=worldDialogue(s);node('small',area==='itavera'?'CRÔNICAS DE ITAVERA':'CRÔNICAS DE JACARANDÁ');node('h2',d.title);for(const paragraph of d.text.split('\n\n'))node('p',paragraph);
  if(d.kind==='forge')button(d.action,()=>{closeWorldOverlay(s);merchant();});else if(d.action)button(d.action,()=>worldDialogueAction(s));
  button('Fechar conversa',()=>closeWorldOverlay(s));return;}
 host.dataset.view='world';node('small',area?areaRegion(area,w.player):worldRegion(w.player));
 for(const [i,o] of objectives.entries()){node(i?'h4':'h3',o.title);const q=campaignQuests(s.save).find(q=>q.status==='active'&&(q.id===o.questId||q.title===o.title));if(q)node('small','Etapa '+(q.current+1)+' de '+q.steps.length);node('p',o.text);}
 const target=objective.target,dx=target.x-w.player.x,dy=target.y-w.player.y,d=Math.hypot(dx,dy),direction=(dy<-4?'norte':dy>4?'sul':'')+(Math.abs(dx)>4?(Math.abs(dy)>4?' / ':'')+(dx>0?'leste':'oeste'):'');
 node('small',d<3.2?(area?'Você chegou':'G · conversar'):Math.round(d)+' m · '+direction);
 const exit=nearbyExit(w);if(exit)node('p','Caminho à frente · '+exit.name+' · pise no anel');
 const npc=nearbyWorldPerson(s);if(npc)button('G · '+npc.name,interact);
 const home=homeTeleport(s);if(p.checkpoint==='village'&&!(r.inVillage&&!area)){button('Teleporte à vila',()=>teleportHome(s),!home.ok).id='world-home';if(!home.ok&&home.reason)node('small',home.reason);}
 button('Mapa da região · M',()=>toggleWorldMap(s)).classList.add('world-map-button');
 host.dataset.collapsed=String(trackerCollapsed);
 const toggle=button(trackerCollapsed?'›':'‹',()=>{trackerCollapsed=!trackerCollapsed;});toggle.classList.add('tracker-toggle');toggle.setAttribute('aria-expanded',String(!trackerCollapsed));toggle.setAttribute('aria-label',trackerCollapsed?'Mostrar objetivos':'Recolher objetivos');toggle.title=toggle.getAttribute('aria-label');
}
