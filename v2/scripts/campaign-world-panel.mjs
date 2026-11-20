import {campaignQuests} from './quest-model.mjs';
import {worldObjectives,worldRegion} from './campaign-world-model.mjs';
import {nearbyWorldPerson,nearbyWorldPortal,useWorldPortal,nearbyExit,homeTeleport,teleportHome,worldDialogue,worldDialogueAction,closeWorldOverlay,toggleWorldMap} from './campaign-world.mjs';
import {AREAS,areaObjectives,areaRegion} from './itauna-model.mjs';
import {renderRegionMap} from './region-map.mjs';

export {drawRegionMap as drawWorldMap} from './region-map.mjs';

// Painel de objetivos recolhido ou aberto: preferência só desta sessão de jogo.
let trackerCollapsed=false;
export function renderWorldPanel(s,{host,node,button,interact,merchant=()=>{}}){
 const r=s.world.adventure,p=s.save.campaign.world,area=r.area,objectives=area?areaObjectives(area,p):worldObjectives(p),objective=objectives[0],w=s.world;
 if(r.mapOpen){renderRegionMap(s,{host,node,button,close:()=>closeWorldOverlay(s)});return;}
 if(r.dialogue){host.dataset.view='world-dialogue';const d=worldDialogue(s);node('small',area==='itavera'?'CRÔNICAS DE ITAVERA':'CRÔNICAS DE JACARANDÁ');node('h2',d.title);for(const paragraph of d.text.split('\n\n'))node('p',paragraph);
  if(d.kind==='forge')button(d.action,()=>{closeWorldOverlay(s);merchant();});else if(d.action)button(d.action,()=>worldDialogueAction(s));
  button('Fechar conversa',()=>closeWorldOverlay(s));return;}
 host.dataset.view='world';host.dataset.assault=String(['itauna-fort','cedro'].includes(area));node('small',area?areaRegion(area,w.player):worldRegion(w.player));
 for(const [i,o] of objectives.entries()){node(i?'h4':'h3',o.title);const q=campaignQuests(s.save).find(q=>q.status==='active'&&(q.id===o.questId||q.title===o.title));if(q)node('small','Etapa '+(q.current+1)+' de '+q.steps.length);node('p',o.text);}
 const battles=r.groups.filter(g=>['active','between'].includes(g.state)&&Math.hypot(g.x-w.player.x,g.y-w.player.y)<40),ids=new Set(battles.map(g=>g.id));
 if(['itauna-fort','cedro'].includes(area)&&battles.length){const enemies=w.actors.filter(a=>a.hp>0&&ids.has(a.worldGroup)).length,reserves=battles.reduce((n,g)=>n+g.wavesLeft,0);node('small',enemies+' inimigos em combate'+(reserves?' · '+reserves+(reserves===1?' leva de reforços restante':' levas de reforços restantes'):''));const waiting=battles.find(g=>g.state==='between');if(waiting)node('p','Contra-ataque chegando em '+Math.ceil(waiting.timer)+' s. Prepare-se!');}
 const target=objective.target,dx=target.x-w.player.x,dy=target.y-w.player.y,d=Math.hypot(dx,dy),direction=(dy<-4?'norte':dy>4?'sul':'')+(Math.abs(dx)>4?(Math.abs(dy)>4?' / ':'')+(dx>0?'leste':'oeste'):'');
 node('small',d<3.2?(area?'Você chegou':'G · conversar'):Math.round(d)+' m · '+direction);
 const exit=nearbyExit(w);if(exit)node('p','Caminho à frente · '+exit.name+' · pise no anel');
 const npc=nearbyWorldPerson(s);if(npc)button('G · '+npc.name,interact);
 if(nearbyWorldPortal(s))button(s.campaignPortal.atHome?'G — Voltar à aventura':'G — Portal para Jacarandá',()=>useWorldPortal(s)).id='world-portal';
 const home=homeTeleport(s);if(p.portalUnlocked&&p.checkpoint==='village'&&!(r.inVillage&&!area)){button('Abrir portal para a vila',()=>teleportHome(s),!home.ok).id='world-home';if(!home.ok&&home.reason)node('small',home.reason);}
 button('Mapa da região · M',()=>toggleWorldMap(s)).classList.add('world-map-button');
 host.dataset.collapsed=String(trackerCollapsed);
 const toggle=button(trackerCollapsed?'›':'‹',()=>{trackerCollapsed=!trackerCollapsed;});toggle.classList.add('tracker-toggle');toggle.setAttribute('aria-expanded',String(!trackerCollapsed));toggle.setAttribute('aria-label',trackerCollapsed?'Mostrar objetivos':'Recolher objetivos');toggle.title=toggle.getAttribute('aria-label');
}
