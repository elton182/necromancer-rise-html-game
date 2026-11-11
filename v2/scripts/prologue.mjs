import {CAVE_ROOMS,PAPERS_GUARD_RADIUS,MESSENGER_GUARD_RADIUS,TRAIL_START} from './prologue-map-data.mjs';
import {clean} from './campaign.mjs';
import {launchWorld} from './campaign-world.mjs';
import {spawnEnemy} from './enemies.mjs';
import {makeGroups,tickGroups} from './map-spawns.mjs';
import {resolvePosition} from './terrain.mjs';
import {grantExperience} from './rewards.mjs';
import {PROLOGUE_TEXT,PROLOGUE_INTRO,prologueObjective,travelLine,caveTitle} from './prologue-model.mjs';
import {prologueArena,PROLOGUE_POINTS} from './prologue-map.mjs';

const speechState=new WeakMap();
export function updatePrologueSpeech(s,dt,play=()=>{}){
 const d=s.world.adventure?.dialogue,host=document.getElementById('campaign-panel');
 if(!d||host?.hidden||s.world.adventure.intro||document.hidden)return;
 const state=speechState.get(d);if(!state)return;
 const before=state.count;state.elapsed+=dt;state.count=Math.min(state.text.length,Math.floor(state.elapsed*35));
 const text=host.querySelector('[data-speech]');if(text)text.textContent=state.text.slice(0,state.count);
 if(state.count>before&&Math.floor(state.count/3)>Math.floor(before/3)&&/\S/.test(state.text.slice(before,state.count)))play('click');
}
function speech(node,d,text){
 let state=speechState.get(d);if(!state||state.index!==d.index){state={index:d.index,text,elapsed:0,count:0};speechState.set(d,state);}
 const p=node('p',text.slice(0,state.count));p.dataset.speech='';
}
export const isPrologue=s=>s.world.adventure?.kind==='prologue';
const near=(a,b,r=3.2)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
function person(w,key,model,name,x,y,extra={}){const a={id:w.nextId++,key,model,name,team:'neutral',x,y,radius:.4,hp:100,maxHp:100,angle:Math.PI,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,...extra};Object.assign(a,resolvePosition(a,a.radius,w.arena));w.actors.push(a);return a;}
function markEnemy(w,e){e.prologueEnemy=true;if(w.adventure.stage==='cave'&&e.typeIndex===0){e.name='Capitão dos bandidos';e.hp=e.maxHp=e.maxHp*3;e.prologueBoss=true;}if(['cave','trail'].includes(w.adventure.stage))Object.assign(e,{home:{x:e.x,y:e.y},alert:false});}
function enemies(w,positions){for(const [type,x,y]of positions){const e=spawnEnemy(w,type,x,y,{wave:1,tier:'common'});Object.assign(e,resolvePosition(e,e.radius,w.arena));markEnemy(w,e);}}
// Grupos do mapa editado: gatilho, ondas e composição do editor. Sem edição, cada ponto da planta é um inimigo presente desde a entrada.
function tickSceneGroups(w,dt){const r=w.adventure;if(r.groups)tickGroups(w,r.groups,dt,{onRelease:g=>{for(const a of w.actors)if(a.worldGroup===g.id&&!a.prologueEnemy)markEnemy(w,a);}});}
function placeEnemies(w,arena,fallback){if(!arena.prologueGroups)return enemies(w,fallback);w.adventure.groups=makeGroups(arena.prologueGroups);tickSceneGroups(w,0);}
function dialogue(s,key){const r=s.world.adventure;r.dialogue={key,index:0};s.world.paused=key!=='travel';s.world.boltCharge=null;}
// Troca de mapa entre cenas: o aplicativo registra quem escurece a tela e só monta o mapa seguinte com ela escura.
// Sem registro (testes de regra), a troca é imediata.
let storyFade=null;
export const useStoryFade=fn=>{storyFade=fn;};
// Respiro depois do último inimigo: o combate desacelera e as faixas de cena entram antes da conversa.
export const STORY_BEAT=1.3,BEAT_SLOW=.35;
const SCENE_TITLES={ambush:'O bloqueio',fall:'',cave:'Sob a estrada',trail:'Caminho de Jacarandá',defense:'Jacarandá sob ataque'};
function sceneChange(s,title,run){
 const w=s.world,r=w.adventure;
 if(!storyFade||!r)return run();
 if(r.leaving)return;r.leaving=true;r.dialogue=null;r.beat=null;r.timeScale=1;w.paused=true;
 storyFade({title,run:()=>{if(s.world.adventure===r)run();}});
}
function advance(s,stage){sceneChange(s,SCENE_TITLES[stage]??'',()=>{s.save.campaign.prologue.stage=stage;launchPrologue(s);s.world.progressChanged=true;});}
// Vitória na emboscada ou na praça: a conversa abre no mesmo mapa, com quem já está em cena.
function settleBeat(s){
 const w=s.world,r=w.adventure,p=s.save.campaign.prologue,next=r.stage==='ambush'?'farewell':'reunion';
 r.beat=null;r.timeScale=1;p.stage=r.stage=next;
 if(next==='reunion')for(const a of w.actors)if(a.key==='guard')a.team='neutral';
 dialogue(s,next);w.notice=prologueObjective(p).join(' · ');w.progressChanged=true;
}
// Estado que a interface usa para as faixas de cena: respiro, conversa ou cinemática.
export function storyScene(s){
 const r=s.world.adventure;if(r?.kind!=='prologue'||s.scene!=='training'||r.intro)return '';
 return r.leaving?'leaving':r.beat?'beat':r.dialogue?'dialogue':r.cinematic?'cinematic':'';
}
export function launchPrologue(s){
 const p=s.save.campaign.prologue;if(!p||p.stage==='done')return launchWorld(s);
 const stage=p.stage,w=s.world,arena=prologueArena(stage);
 const start=stage==='travel'?{x:0,y:80}:stage==='cave'?{x:0,y:165}:stage==='trail'?TRAIL_START:['defense','reunion'].includes(stage)?{x:0,y:12}:{x:0,y:10};
 clean(s,arena,['ambush','cave','trail'].includes(stage)&&arena.prologueStart||start);s.scene='training';w.paused=false;w.gearLevel=1;w.aim={x:0,y:0};
 w.adventure={kind:'prologue',name:stage==='cave'?caveTitle(p):arena.name||'Jacarandá',stage,done:false,queue:[],zones:[],dialogue:null,cinematic:['travel','fall'].includes(stage),elapsed:0,wave:0};
 if(['travel','ambush','farewell','fall'].includes(stage)){
  person(w,'marta','npcLysa','Marta',1,6);person(w,'nilo','npcBram','João',-1,-1);
  person(w,'guard','npcLysa','Guarda da caravana',-5,0);
  if(stage==='travel'){
   w.actors=w.actors.filter(a=>a===w.player||a.key==='marta'||a.key==='nilo');
   person(w,'driver','npcMerchant','Cocheiro',0,78);
   Object.assign(w.player,{ride:{x:.6,y:.65},visualScale:.7,angle:-Math.PI/2});
   for(const a of w.actors)if(a.key==='marta')Object.assign(a,{ride:{x:-.6,y:-.6},visualScale:.7,angle:Math.PI/2});else if(a.key==='nilo')Object.assign(a,{ride:{x:-.6,y:.65},visualScale:.7,angle:Math.PI/2});else if(a.key==='driver')Object.assign(a,{ride:{x:0,y:-1.95},visualScale:.7,angle:Math.PI});
   person(w,'horse','caravanHorse','Cavalo da caravana',0,76,{animation:'walk',angle:Math.PI,journeyHorse:true});
   w.adventure.journey={y:80,distance:0,speed:1.6,bob:0,braking:false};dialogue(s,'travel');placeRiders(w);
   if(!p.introRead){w.adventure.intro=true;w.paused=true;}
  }
  if(stage==='ambush')placeEnemies(w,arena,arena.prologueSpawns.map(e=>[e.type,e.x,e.y]));
  if(stage==='farewell')dialogue(s,'farewell');
  if(stage==='fall'){
   /* Só o necromante tem a variante com animação de queda; o guerreiro cai com o próprio modelo (inclinação e afundamento do renderer). */
   if(w.player.model==='necromancer')w.player.model='necromancerFalling';
   person(w,'archer','enemyRogue','Arqueiro na encosta',7,-5,{animation:'attack'});
   w.adventure.shot={from:{x:7,y:-5},to:{x:0,y:10},x:7,y:-5,visible:false};
  }
 }
 if(stage==='cave'){
  if(!p.caveCleared)placeEnemies(w,arena,arena.prologueSpawns.map(e=>[e.type,e.x,e.y]));
  w.landmarks=[...[2,4,6].map(i=>({key:'cargo',name:'Investigar a carga lateral',x:CAVE_ROOMS[i].x+8,y:CAVE_ROOMS[i].y+3})),{key:'papers',name:'Examinar as ordens',...PROLOGUE_POINTS.papers},{key:'cargo',name:'Examinar a carga roubada',x:7,y:7},{key:'exit',name:'Saída da caverna',...PROLOGUE_POINTS.exit}];
  if(!p.clue)dialogue(s,'cave');
 }
 if(stage==='trail'){
  const m=PROLOGUE_POINTS.messenger;person(w,'messenger','npcBram','Tomás · mensageiro ferido',m.x,m.y,{visualScale:.9});
  placeEnemies(w,arena,arena.prologueSpawns.map(e=>[e.type,e.x,e.y]));w.landmarks=[{key:'satchel',name:'Examinar a bolsa caída',...PROLOGUE_POINTS.satchel},{key:'messenger',name:'Ajudar Tomás',...m}];
 }
 if(['defense','reunion'].includes(stage)){
  person(w,'marta','npcLysa','Marta',1,7);person(w,'oren','npcBram','Joaquim',-3,5);
  person(w,'guard','npcLysa','Guarda da caravana',3,5,{team:stage==='defense'?'ally':'neutral',hp:1000,maxHp:1000,phase:0});
  if(stage==='defense'){enemies(w,[[6,-5,0],[9,5,-5],[6,0,-8],[0,-9,-3]]);w.notice='Marta: Você está vivo! Precisamos de ajuda na praça!';}
  else dialogue(s,'reunion');
 }
 w.notice=prologueObjective(p).join(' · ');return true;
}
// Grupo que ainda vai nascer conta como inimigo: a cena não avança antes dele.
const living=w=>w.actors.some(a=>a.prologueEnemy&&a.hp>0)||!!w.adventure.groups?.some(g=>g.state==='dormant'||g.state==='between'||g.state==='active');
// Inimigo vivo conta pela posição de guarda, não por onde está agora: quem saiu correndo atrás do jogador continua guardando.
function guarding(w,at,radius){
 const close=p=>Math.hypot(p.x-at.x,p.y-at.y)<radius;
 return w.actors.some(a=>a.prologueEnemy&&a.hp>0&&close(a.home||a))||!!w.adventure.groups?.some(g=>g.state!=='clear'&&close(g));
}
function placeRiders(w){const j=w.adventure.journey;for(const a of w.actors)if(a.ride){a.x=a.ride.x;a.y=j.y+a.ride.y;a.jumpZ=.99+j.bob;a.animationTime=w.time;}else if(a.journeyHorse){a.x=0;a.y=j.y-4.4;a.jumpZ=j.bob*.2;a.walkDistance=j.distance;a.animationTime=w.time;a.animation=j.speed>.01?'walk':'idle';}}
export function tickPrologue(s,dt){
 if(!isPrologue(s)||s.world.paused||s.world.player.hp<=0)return;
 const w=s.world,r=w.adventure,p=s.save.campaign.prologue;
 if(r.intro)return;
 tickSceneGroups(w,dt);
 if(r.stage==='travel'){
  r.elapsed+=dt;w.time+=dt;const j=r.journey;
  if(j.braking)j.speed=Math.max(0,j.speed-dt*1.2);
  const distance=Math.min(j.speed*dt,Math.max(0,180-j.distance));j.distance+=distance;j.y=80-j.distance;j.bob=Math.sin(j.distance*7)*.025*Math.min(1,j.speed);
  placeRiders(w);return;
 }
 // `timeScale` desacelera a simulação comum (session.mjs) enquanto o respiro dura.
 if(['ambush','defense'].includes(r.stage)&&!r.beat&&!living(w)){r.beat={t:0};r.timeScale=BEAT_SLOW;}
 if(r.beat){r.beat.t+=dt;if(r.beat.t>=STORY_BEAT)settleBeat(s);return;}
 if(r.stage==='cave'&&!guarding(w,PROLOGUE_POINTS.papers,PAPERS_GUARD_RADIUS)&&!p.caveCleared){p.caveCleared=true;w.progressChanged=true;}
 if(r.stage==='cave'){
  r.name=caveTitle(p);
  if(!p.caveHeard&&!p.caveCleared&&(w.player.x < -25 || w.player.y < 105)){dialogue(s,'cave_whispers');return;}
 }
 if(r.stage==='fall'){
  r.elapsed+=dt;w.time+=dt;const t=r.elapsed; r.phase=t<1.35?'shot':t<2?'stagger':t<2.6?'collapse':'descent';const shot=r.shot,k=Math.max(0,Math.min(1,(t-.8)/.55));
  shot.visible=t>=.8&&t<1.35;shot.x=shot.from.x+(shot.to.x-shot.from.x)*k;shot.y=shot.from.y+(shot.to.y-shot.from.y)*k;
  const stagger=Math.max(0,Math.min(1,(t-1.35)/.65));w.player.y=10+stagger*2;
  r.holeRadius=1.78*Math.max(0,Math.min(1,(t-2)/.4));r.fall=Math.max(0,Math.min(1,(t-2.25)/2));
  w.player.jumpZ=-r.fall*r.fall*5.5;w.player.pose=t>=1.35?{anim:'fall',progress:Math.min(1,(t-1.35)/2)}:{anim:'idle',progress:(t%2)/2};
  if(t>=5.2)advance(s,'cave');
 }
}
export function interactPrologue(s){
 if(!isPrologue(s)||s.scene!=='training'||s.world.player.hp<=0)return false;
 const w=s.world,r=w.adventure,p=s.save.campaign.prologue;
 if(r.dialogue)return nextPrologueDialogue(s);
 if(w.paused||r.cinematic)return false;
 const l=w.landmarks.find(l=>near(l,w.player));if(!l)return false;
 if(l.key==='cargo'){dialogue(s,'cargo');return true;}
 if(l.key==='papers'){
  if(!p.caveCleared){w.notice='Derrote os bandidos que guardam os papéis.';return false;}
  dialogue(s,'clue');return true;
 }
 if(l.key==='exit'){
  if(!p.clue){w.notice='Os papéis no esconderijo podem revelar o que aconteceu com a caravana.';return false;}
  dialogue(s,'cave_exit');return true;
 }
 if(l.key==='satchel'){dialogue(s,'satchel');return true;}
 if(l.key==='messenger'){
  if(guarding(w,PROLOGUE_POINTS.messenger,MESSENGER_GUARD_RADIUS)){w.notice='Afaste os perseguidores antes de ajudar o mensageiro.';return false;}
  dialogue(s,'messenger');return true;
 }
 return false;
}
export function nextPrologueDialogue(s){
 if(!isPrologue(s))return false;const w=s.world,r=w.adventure,d=r.dialogue;
 if(r.intro){s.save.campaign.prologue.introRead=true;r.intro=false;w.paused=false;w.progressChanged=true;return true;}
 if(!d||(!w.paused&&r.stage!=='travel')||(r.stage==='travel'&&w.paused))return false;
 const state=speechState.get(d);if(state&&state.count<state.text.length){state.count=state.text.length;state.elapsed=state.text.length/35;return true;}
 const pages=PROLOGUE_TEXT[d.key];if(++d.index<pages.length){
  if(d.key==='travel'&&pages[d.index][2]==='driver'&&!r.journey.braking){r.journey.braking=true;r.journey.blockY=r.journey.y-9;}
  return true;
 }
 if(d.key==='travel')advance(s,'ambush');
 else if(d.key==='farewell')advance(s,'fall');
 else if(d.key==='cave_exit')advance(s,'trail');
 else if(d.key==='messenger')advance(s,'defense');
 else if(d.key==='reunion'){
  const p=s.save.campaign.prologue;if(p.stage!=='reunion')return false;p.stage='done';
  // A defesa substitui o antigo resgate de Joaquim somente nas campanhas novas.
  s.save.campaign.world={stage:'complete',questFlow:1,smith:'available',lumber:'locked',passengerMissing:true};
  s.save.character.gold+=90;grantExperience(s,120);w.progressChanged=true;sceneChange(s,'Jacarandá',()=>{launchWorld(s);s.world.progressChanged=true;});
 }else {if(d.key==='clue'){s.save.campaign.prologue.clue=true;w.progressChanged=true;}if(d.key==='cave_whispers'){s.save.campaign.prologue.caveHeard=true;w.progressChanged=true;}if(r.stage==='cave')r.name=caveTitle(s.save.campaign.prologue);r.dialogue=null;w.paused=false;}
 return true;
}
export function renderProloguePanel(s,{host,node,button,interact}){
 const r=s.world.adventure,p=s.save.campaign.prologue;host.dataset.view=r.dialogue?'prologue-dialogue':r.cinematic?'prologue-cinematic':'prologue';
 if(r.intro){
  host.dataset.view='prologue-intro';const text=node('article');text.className='intro-text';node('small','PRÓLOGO',text);node('h1','ARANDU',text);node('h2','Além das muralhas',text);
  for(const paragraph of PROLOGUE_INTRO)node('p',paragraph,text);
  button('Começar a jornada →',()=>nextPrologueDialogue(s),false,text);return;
 }
 if(r.stage==='travel'&&r.dialogue){
  host.dataset.view='travel-dialogue';const line=travelLine(r.dialogue.index,s.save.character.name||'Zephyr');host.dataset.speaker=line.actor;
  node('small',line.speaker);speech(node,r.dialogue,line.text);button(r.dialogue.index===PROLOGUE_TEXT.travel.length-1?'Ver o bloqueio →':'Continuar · G',()=>nextPrologueDialogue(s));
  const caption=node('div','A CAMINHO DE ITAVERA');caption.className='journey-caption';return;
 }
 if(r.dialogue){const pages=PROLOGUE_TEXT[r.dialogue.key],[speaker,text]=pages[r.dialogue.index];
  host.dataset.view='travel-dialogue';host.dataset.speaker=speaker.startsWith('Marta')?'marta':speaker==='João'?'nilo':speaker.startsWith('Tomás')?'messenger':'player';
  node('small',speaker==='Você'?(s.save.character.name||'Você'):speaker);speech(node,r.dialogue,text);button('Continuar · G',()=>nextPrologueDialogue(s));return;}

 if(r.stage==='fall'){
  const [title,text]=({shot:['O último disparo','João: Cuidado! Na encosta!'],stagger:['O chão está cedendo','Uma rachadura se abre sob seus pés.'],collapse:['A estrada desaba','Terra e pedras cedem de uma vez.'],descent:['Sob a estrada','A luz da superfície se afasta…']})[r.phase||'shot'];
  node('h3',title);node('p',text);return;
 }
 const [title,text]=prologueObjective(p);node('small',r.name);node('h3',title);node('p',text);
 if(r.cinematic){node('small','A caravana segue viagem…');return;}
 const l=s.world.landmarks.find(l=>near(l,s.world.player));if(l)button('G · '+l.name,interact);
 if(r.stage==='cave'){node('small',p.clue?'A ordem não identifica quem pagou pela captura.':p.caveHeard?'Os guardas falavam em capturar um passageiro vivo.':'Tochas acesas. Marcas de botas. Você não está sozinho.');}
}
