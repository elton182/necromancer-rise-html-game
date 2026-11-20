import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession} from '../scripts/session.mjs';
import {launchWorld,tickWorld,travelArea} from '../scripts/campaign-world.mjs';
import {normalizeWorld} from '../scripts/campaign-world-model.mjs';
import {cedroStage,CEDRO_POINTS,CEDRO_GATES} from '../scripts/cedro-model.mjs';
import {cedroAction,cedroDialogue} from '../scripts/cedro-quest.mjs';
import {niloAction} from '../scripts/nilo-quest.mjs';
import {builtinMap,toArena,reachable,canReach} from '../scripts/map-model.mjs';
import {gateSolid} from '../scripts/itauna-model.mjs';
import {overlaps} from '../scripts/terrain.mjs';
import {tickBento} from '../scripts/cedro-combat.mjs';
import {spawnEnemy,targets,target} from '../scripts/enemies.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {campaignQuests} from '../scripts/quest-model.mjs';

const ready=()=>{const s=createSession();s.save.campaign.started=true;s.save.campaign.world=normalizeWorld({stage:'complete',nilo:'done',smith:'done',lumber:'done',portalUnlocked:true});launchWorld(s);return s;};
const enter=s=>{assert.equal(cedroAction(s,'cedro-accept'),true);assert.equal(cedroAction(s,'cedro-travel'),true);travelArea(s);};
test('saves antigos: provas recuperadas oferecem cerco; Itavera concluída preserva progresso',()=>{
 assert.equal(cedroStage(normalizeWorld({stage:'complete',nilo:'return'})),'locked');
 assert.equal(cedroStage(normalizeWorld({stage:'complete',nilo:'done'})),'offered');
 for(const nilo of ['itavera','invitation','complete'])assert.equal(cedroStage(normalizeWorld({stage:'complete',nilo})),'done');
 assert.equal(normalizeWorld({stage:'complete',area:'cedro'}).area,undefined);
 const p=normalizeWorld({stage:'complete',nilo:'done',cedro:'active',area:'cedro',entry:'camp',cleared:['cedro-fuel','cedro-road','cedro-shortcut','fake']});
 assert.equal(p.entry,'camp');assert.deepEqual(p.cleared,['cedro-fuel','cedro-road','cedro-shortcut']);
});
test('planta: rotas alcançáveis, portões fecham o acampamento, dois vãos sem fuga lateral',()=>{
 const map=builtinMap('builtin:cedro'),arena=toArena(map);
 const open=reachable(arena,map.start,{step:1,radius:.35});
 for(const p of Object.values(CEDRO_POINTS)){assert.equal(overlaps(p,.35,arena),false,p.name);assert.equal(canReach(open,p),true,p.name);}
 const closed={...arena,solids:[...arena.solids,...CEDRO_GATES.map(gateSolid)]},reach=reachable(closed,map.start,{step:1,radius:.35});
 assert.equal(canReach(reach,CEDRO_POINTS.boss),false);
 for(const g of CEDRO_GATES){const half={...arena,solids:[...arena.solids,...CEDRO_GATES.filter(a=>a!==g).map(gateSolid)]};assert.equal(canReach(reachable(half,map.start,{step:1,radius:.35}),CEDRO_POINTS.boss),true,g.id);}
 assert.ok(map.spawns.reduce((sum,g)=>sum+g.count,0)>=120);
});
test('cerco bloqueia viagem, mantém João na vila e exige concluir objetivos antes das interações',()=>{
 const s=ready();assert.equal(niloAction(s,'nilo-travel'),false);assert.equal(cedroDialogue('nilo',s.save.campaign.world).kind,'cedro-accept');
 enter(s);const p=s.save.campaign.world;assert.equal(s.world.adventure.area,'cedro');assert.equal(s.world.landmarks.some(a=>a.key==='nilo'),false);
 assert.equal(cedroAction(s,'cedro-free'),false);assert.equal(cedroAction(s,'cedro-fuel'),false);
 p.cleared.push('cedro-prisoners','cedro-supplies');assert.equal(cedroAction(s,'cedro-free'),true);assert.equal(cedroAction(s,'cedro-free'),false);assert.equal(cedroAction(s,'cedro-fuel'),true);
 assert.equal(campaignQuests(s.save).find(q=>q.id==='cedro-siege').status,'active');
 Object.assign(s.world.player,{x:80,y:-76});tickWorld(s,.1);assert.equal(p.entry,'camp');
 launchWorld(s);assert.equal(s.world.player.y,-76);assert.ok(s.save.campaign.world.cleared.includes('cedro-shortcut'));
});
test('abates são permanentes; Bento e guarda precisam cair; prêmio final é único e libera Itavera',()=>{
 const s=ready();enter(s);const w=s.world,p=s.save.campaign.world;
 Object.assign(w.player,{x:80,y:-119});tickWorld(s,.1);
 const b=w.actors.find(a=>a.cedroBoss);assert.ok(b);assert.equal(b.type.name,'Bento Ferraz');
 dealDamage(w,b,1e8,w.player);tickWorld(s,.1);assert.equal(p.cleared.includes('cedro-bento'),false);
 for(const a of [...w.actors])if(a.worldGroup==='cedro-bento'&&a.hp>0)dealDamage(w,a,1e8,w.player);
 tickWorld(s,.1);assert.equal(p.cedro,'return');assert.ok(p.cleared.includes('cedro-bento'));
 launchWorld(s);assert.equal(s.world.adventure.groups.find(g=>g.id==='cedro-bento').state,'clear');
 s.world.areaTravel={to:null,entry:'village'};travelArea(s);const gold=s.save.character.gold;
 assert.equal(cedroAction(s,'cedro-finish'),true);assert.equal(s.save.character.gold,gold+450);assert.equal(cedroAction(s,'cedro-finish'),false);
 assert.equal(niloAction(s,'nilo-travel'),true);
});
test('Bento: ordem interrompida por dano; sinal elimina reserva; combustível muda especial',()=>{
 const s=ready();enter(s);const w=s.world;w.actors=w.actors.filter(a=>a.team!=='enemy');
 const e=spawnEnemy(w,0,80,-119,{wave:13,tier:'rare'});e.cedroBoss=true;e.hp=e.maxHp*.4;w.player.x=80;w.player.y=-115;
 const api={spawnEnemy,target,targets};tickBento(w,e,.1,api);assert.equal(e.bento.action.kind,'order');e.hp-=e.maxHp*.08;
 tickBento(w,e,1.6,api);assert.equal(w.actors.filter(a=>a.team==='enemy').length,1);
 e.bento={cooldown:0,step:3,reserve:true,action:null};tickBento(w,e,.1,api);assert.equal(e.bento.action.kind,'fire');
 w.cedroProgress.cleared.push('cedro-fuel');e.bento={cooldown:0,step:3,reserve:true,action:null};tickBento(w,e,.1,api);assert.equal(e.bento.action.kind,'sweep');
 e.bento={cooldown:0,step:0,reserve:false,action:null};w.cedroProgress.cleared.push('cedro-signal');tickBento(w,e,.1,api);tickBento(w,e,1.6,api);assert.equal(w.actors.filter(a=>a.team==='enemy').length,1);
});
test('Bento prepara antes do dano, atinge uma única vez e respeita esquiva e obstáculos',()=>{
 for(const step of [.05,.2,1.5]){
  const s=ready();enter(s);const w=s.world;w.actors=w.actors.filter(a=>a===w.player);
  const e=spawnEnemy(w,0,80,-119,{wave:13,tier:'rare'}),p=w.player;Object.assign(p,{x:80,y:-116,hp:10000,maxHp:10000,barrier:0,boneShield:false});
  const api={spawnEnemy,target,targets},sweep=()=>({kind:'sweep',time:0,wind:.85,total:4,x:80,y:-119,dx:0,dy:1,hit:false,victims:[]});
  e.bento={cooldown:0,step:0,reserve:true,action:sweep()};tickBento(w,e,.5,api);assert.equal(p.hp,10000,'preparação não causa dano');
  for(let t=.5;t<2;t+=step)tickBento(w,e,step,api);
  const after=p.hp;assert.ok(after<10000);tickBento(w,e,.1,api);assert.equal(p.hp,after,'impacto não se repete');
  e.bento.action=sweep();w.dash.remaining=1;tickBento(w,e,1,api);assert.equal(p.hp,after,'Dash protege');w.dash.remaining=0;
  e.bento.action=sweep();w.arena.solids=[...w.arena.solids,{kind:'box',x:80,y:-117.5,width:10,depth:.5,height:4}];tickBento(w,e,1,api);assert.equal(p.hp,after,'parede bloqueia dano');
 }
});
