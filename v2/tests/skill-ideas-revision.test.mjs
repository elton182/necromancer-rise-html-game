import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../scripts/training-model.mjs';
import {dealDamage,beginDash} from '../scripts/combat.mjs';
import {warriorAction,tickWarrior,stopWarriorChannel} from '../scripts/warrior.mjs';
import {warriorTornado} from '../scripts/warrior-model.mjs';
import {MARKSMAN_ACTIONS,marksmanRanks,actionDamage} from '../scripts/marksman-model.mjs';
import {druidHowlBonus} from '../scripts/druid-model.mjs';
import {marksmanAction,tickMarksman,clearMarksman} from '../scripts/marksman.mjs';
import {druidAction,tickDruid,HUMAN_ACTIONS,snapshotDruidPack} from '../scripts/druid.mjs';
import {tickCompanions} from '../scripts/companions.mjs';
import {classLoadout,loadoutIds} from '../scripts/skill-loadout.mjs';
import {freshSave,normalizeSave} from '../scripts/save-model.mjs';
import {createSession,snapshot,transition,applySave} from '../scripts/session.mjs';
import {clean,emptyArena} from '../scripts/campaign.mjs';

function field(classId,ranks={}){
 const key=classId==='warrior'?'warriorRanks':classId==='druid'?'druidRanks':'marksmanRanks';
 const w=createWorld({horde:0,character:{classId,level:40,[key]:ranks,equipment:{}}});
 w.actors=[w.player];Object.assign(w.player,{x:0,y:0,damage:100,spellDamage:100,mp:1000,maxMp:1000,defense:0});
 w.aim={x:8,y:0};w.random=()=>.5;w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};return w;
}
function target(w,x,y=0,extra={}){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:10000,maxHp:10000,animation:'idle',animationTime:0,timer:0,...extra};w.actors.push(e);return e;}
function advance(w,seconds,dt=1/60){for(let i=0;i<Math.ceil(seconds/dt);i++){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);if(w.classId==='warrior')tickWarrior(w,dt);else if(w.classId==='druid')tickDruid(w,dt);else tickMarksman(w,dt);tickCompanions(w,dt);}}
const lost=e=>e.maxHp-e.hp;
const cast=(w,id)=>marksmanAction(w,MARKSMAN_ACTIONS[w.classId].findIndex(a=>a.id===id));
const druidCast=(w,id)=>druidAction(w,HUMAN_ACTIONS.findIndex(a=>a.id===id));

test('Corte Espacial: cada corte dispara 230%, sem recarga, 14 u e sem atravessar parede',()=>{
 const w=field('warrior',{slash:1,momentum:1,steelWave:3,corteEspacial:1}),e=target(w,10),far=target(w,16);
 for(let i=0;i<3;i++){assert.ok(warriorAction(w,0));advance(w,.6);}
 advance(w,1);assert.equal(lost(e),759);assert.equal(lost(far),0);assert.equal(w.player.mp,1000);
 const v=field('warrior',{corteEspacial:1}),hidden=target(v,7);v.arena.solids=[{kind:'box',x:4,y:0,width:1,depth:10}];
 warriorAction(v,0);advance(v,1.5);assert.equal(lost(hidden),0);
});
test('giro acumula Ciclone e Furacão; ranks alteram área, ritmo, dano e gasto',()=>{
 const ranks={tornado:5,tornadoCyclone:5,tornadoWhirl:5};
 const t=warriorTornado('base',ranks);assert.equal(t.range,4.7);assert.ok(Math.abs(t.interval-.16)<1e-9);assert.equal(t.drain,20);assert.equal(t.move,.4);assert.ok(t.damage>1.4);
 assert.deepEqual(warriorTornado('cyclone',ranks),warriorTornado('whirl',ranks));
 const w=field('warrior',{tornado:1,tornadoCyclone:1,tornadoWhirl:1,tornado2:1}),e=target(w,5);
 assert.ok(warriorAction(w,4));advance(w,1);assert.ok(w.warriorWaves.some(a=>a.wind));assert.equal(w.warriorAction.tornado.range,3.7);
 stopWarriorChannel(w);advance(w,1);assert.ok(lost(e)>0);w.player.hp=0;advance(w,.1);assert.deepEqual(w.warriorWaves,[]);
});
test('Impacto e Cadência: até cinco avanços extras, presas únicas, parede e esquiva interrompem',()=>{
 for(const dt of [1/60,.1]){
  const w=field('warrior',{thrust:1,impacto:1,cadencia:1});target(w,6);for(let i=0;i<7;i++)target(w,8+i*2,2+(i%2));
  assert.ok(warriorAction(w,1));advance(w,4,dt);assert.equal(w.warriorAction,null);assert.ok(w.player.x<=20);assert.ok(w.player.mp===980);
  assert.ok(w.actors.filter(e=>e.team==='enemy'&&lost(e)>0).length>=3,'encadeia presas');
 }
 const v=field('warrior',{thrust:1,impacto:1,cadencia:1}),hidden=target(v,5);v.arena.solids=[{kind:'box',x:3,y:0,width:1,depth:10}];warriorAction(v,1);advance(v,2);assert.equal(lost(hidden),0);assert.ok(v.player.x<3);
 const d=field('warrior',{thrust:1,cadencia:1});target(d,6);target(d,9,3);warriorAction(d,1);advance(d,.4);assert.ok(beginDash(d,{x:1}));assert.equal(d.warriorAction,null);
});
test('Rastro não soma manchas sobrepostas e some ao morrer',()=>{
 const w=field('warrior',{thrust:1,impacto:1,cadencia:1,rastro:1});target(w,6);warriorAction(w,1);advance(w,.4);
 assert.ok(w.warriorFireTrails.length>2);w.warriorAction=null;const e=target(w,2);advance(w,.1);const first=lost(e);assert.equal(first,15);
 advance(w,.2);assert.equal(lost(e),first);advance(w,.4);assert.equal(lost(e),30);
 w.player.hp=0;advance(w,.1);assert.deepEqual(w.warriorFireTrails,[]);
});
test('Espinhos usa dano na vida, ignora absorção e não reflete golpes esquivados',()=>{
 const w=field('warrior',{armaduraDeEspinhos:5}),e=target(w,2);w.player.barrier=40;
 const hit=dealDamage(w,w.player,100,e);assert.equal(hit.applied,60);assert.equal(lost(e),24);
 w.dash.remaining=.2;dealDamage(w,w.player,100,e);assert.equal(lost(e),24);
});
test('Escudo Arcano desvia de 10% a 50%, após mitigação, com excedente na vida e sem custo oculto',()=>{
 for(const rank of [1,5]){
  const w=field('mage',{escudoArcano:rank}),e=target(w,2);assert.ok(cast(w,'escudoArcano'));advance(w,.7);
  const hp=w.player.hp,mp=w.player.mp;dealDamage(w,w.player,100,e);
  assert.equal(hp-w.player.hp,100-rank*10);assert.equal(mp-w.player.mp,rank*10);
  w.player.mp=7;const before=w.player.hp;dealDamage(w,w.player,100,e);assert.equal(before-w.player.hp,93);assert.equal(w.player.mp,0);
  w.player.mp=100;w.player.barrier=50;const hp2=w.player.hp;const hit=dealDamage(w,w.player,100,e);assert.equal(hp2-w.player.hp,50*(1-rank*.1));assert.equal(hit.absorbed,50+rank*5);
  advance(w,13);assert.equal(w.marksmanShield,null);
 }
 const w=field('mage',{escudoArcano:5});cast(w,'escudoArcano');advance(w,.6);clearMarksman(w);assert.equal(w.marksmanShield,null);
});
test('Big Bang explode no contato uma vez; fogo da Arqueira queima sem acumular',()=>{
 const w=field('mage',{bigBang:1}),a=target(w,5),b=target(w,5,3),out=target(w,5,6);cast(w,'bigBang');advance(w,2);
 assert.equal(lost(a),360);assert.equal(lost(b),360);assert.equal(lost(out),0);assert.equal(w.marksmanShots.length,0);
 const v=field('archer',{fechadefogo:1,flechaExplosiva:1}),e=target(v,5);cast(v,'fechadefogo');advance(v,1);assert.ok(e.burnUntil>v.time);const tick=e.burnDamage;
 v.marksmanCooldowns={};cast(v,'fechadefogo');advance(v,.7);assert.equal(e.burnDamage,tick);assert.equal(tick,15);
 v.marksmanCooldowns={};const side=target(v,5,2);cast(v,'flechaExplosiva');advance(v,1);assert.equal(lost(side),163);
});
test('Penas Voadoras é periódica, sem slot/custo; pausa e mergulho adiam o disparo',()=>{
 const w=field('archer',{falcon:1,penasVoadoras:1});advance(w,.02);w.falcon.next=Infinity;target(w,5);const mp=w.player.mp;
 advance(w,.02);assert.equal(w.marksmanShots.length,6);assert.equal(w.player.mp,mp);assert.ok(!loadoutIds('archer').includes('penasVoadoras'));assert.equal(cast(w,'penasVoadoras'),false);
 assert.ok(!classLoadout('archer',['arrow','pierce','leap','dodge','rain','penasVoadoras']).includes('penasVoadoras'));
 const ready=w.marksmanFeathersReady;advance(w,1);w.paused=true;w.time=ready;tickMarksman(w,.1);assert.equal(w.marksmanFeathersReady,ready);
 w.paused=false;w.falcon.state='strike';w.falcon.strike={x:8,y:0,at:w.time+10};advance(w,.1);assert.equal(w.marksmanFeathersReady,ready);
 w.falcon.state='orbit';w.falcon.next=Infinity;advance(w,.02);assert.ok(w.marksmanFeathersReady>ready);
});
test('lobos permanentes: limite quatro, mordida automática e sem cura/ressurreição gratuitos',()=>{
 const w=field('druid',{lobo:1,mordidaPesada:3,alcateia:3});assert.ok(druidCast(w,'lobo'));advance(w,.8);
 const wolves=w.actors.filter(a=>a.companion==='druidWolf');assert.equal(wolves.length,4);assert.ok(wolves.every(a=>a.until===null));
 const e=target(w,wolves[0].x+1,wolves[0].y);advance(w,.9);assert.ok(lost(e)>0);assert.ok(wolves.some(a=>a.biteReady>w.time));
 wolves[0].hp/=2;wolves[1].hp=0;advance(w,3);assert.equal(w.actors.filter(a=>a.companion==='druidWolf'&&a.hp>0).length,3);
 const hp=wolves[0].hp;w.druidCooldowns={};assert.ok(druidCast(w,'lobo'));advance(w,.8);assert.equal(w.actors.filter(a=>a.companion==='druidWolf'&&a.hp>0).length,4);assert.equal(wolves[0].hp,hp);
 advance(w,35);assert.equal(w.actors.filter(a=>a.companion==='druidWolf'&&a.hp>0).length,4);assert.equal(druidCast(w,'lobo'),false);
});
test('alcateia salva ferimentos e mortos, restaura nos mapas e aceita saves antigos',()=>{
 const save=freshSave();Object.assign(save.character,{classId:'druid',level:40,druidRanks:{lobo:1,mordidaPesada:1,alcateia:3},druidPack:[.5,0,1,1]});
 const s=createSession(save);transition(s,'training');advance(s.world,.1);assert.equal(s.world.actors.filter(a=>a.companion==='druidWolf'&&a.hp>0).length,3);
 assert.deepEqual(snapshot(s).character.druidPack,[.5,0,1,1]);clean(s,emptyArena('next'));advance(s.world,.1);assert.deepEqual(snapshotDruidPack(s.world),[.5,0,1,1]);
 const loaded=createSession(snapshot(s));transition(loaded,'training');advance(loaded.world,.1);assert.deepEqual(snapshotDruidPack(loaded.world),[.5,0,1,1]);assert.equal(loaded.world.actors.filter(a=>a.companion==='druidWolf').length,3);
 const imported=snapshot(s);imported.character.druidPack=[1,.5,0,1];applySave(loaded,imported);transition(loaded,'training');advance(loaded.world,.1);assert.deepEqual(snapshotDruidPack(loaded.world),[1,.5,0,1],'importar não sobrescreve a alcateia carregada com o estado anterior');
 assert.deepEqual(normalizeSave({...save,character:{...save.character,druidPack:undefined}}).character.druidPack,[]);
 assert.deepEqual(normalizeSave({...save,character:{...save.character,druidPack:[NaN,4,-1]}}).character.druidPack,[0,1,0]);
});
test('Planta Carnívora nasce com Raízes, ataca sem andar, respeita paredes e dura oito segundos',()=>{
 const w=field('druid',{roots:1,thornbind:1,plantaCarnivora:1}),e=target(w,10);
 assert.ok(druidCast(w,'roots'));advance(w,.8);let plant=w.actors.find(a=>a.companion==='carnivorousPlant');assert.ok(plant);
 const pos=[plant.x,plant.y];advance(w,1.5);assert.ok(lost(e)>0);assert.deepEqual([plant.x,plant.y],pos);
 w.druidCooldowns={};druidCast(w,'roots');advance(w,.8);assert.equal(w.actors.filter(a=>a.companion==='carnivorousPlant').length,1);
 plant=w.actors.find(a=>a.companion==='carnivorousPlant');const hidden=target(w,plant.x+2,plant.y);w.arena.solids=[{kind:'box',x:plant.x+1,y:plant.y,width:.5,depth:10}];advance(w,2);assert.equal(lost(hidden),0);
 advance(w,10);assert.ok(!w.actors.some(a=>a.companion==='carnivorousPlant'&&a.hp>0));
});
test('novos nós e precondições entram no build, sem alterar ids persistidos',()=>{
 const r=marksmanRanks('mage',{bolt:1,blink:1,echo:1,escudoArcano:5,clone:1,setasPerseguidoras:1,lazerArcano:1,bigBang:5},40);
 assert.equal(r.escudoArcano,5);assert.equal(r.clone,1);assert.equal(r.bigBang,5);
});

test('atiradores: cada habilidade ofensiva revista ganha dano do primeiro ao quinto rank',()=>{
 const ids={archer:['fan','rain','saraivadaSeguidora','impactoCeleste','penasVoadoras','fechadefogo','flechaExplosiva'],mercenary:['mine','firebomb','armadilhaDeUrso']};
 for(const [classId,list] of Object.entries(ids))for(const id of list){
  const def=MARKSMAN_ACTIONS[classId].find(a=>a.id===id),values=[1,2,3,4,5].map(rank=>actionDamage(def,1000,{[id]:rank}));
  for(let i=1;i<5;i++)assert.ok(values[i]>values[i-1],classId+'/'+id+' cresce a cada ponto');
  assert.ok(Math.abs(values[4]-values[0]*1.4)<=1,id+' mantém base e soma 40% no máximo');
 }
 // O impacto e a queimadura usam o mesmo rank, não só o valor mostrado no painel.
 const burns=[];
 for(const rank of [1,5]){const w=field('archer',{fechadefogo:rank});const e=target(w,5);cast(w,'fechadefogo');advance(w,1);burns.push(e.burnDamage);}
 assert.deepEqual(burns,[15,21]);
});
test('Druida: Tempestade, Tornado e explosão do Furacão escalam no runtime sem multiplicação entre ranks',()=>{
 const values=[];
 for(const rank of [1,5]){
  const w=field('druid',{storm:rank,tornado:rank,furacao:rank});target(w,8);druidCast(w,'storm');advance(w,.5);const storm=w.druidStorms[0].damage;
  w.druidAction=null;w.castCooldown=0;druidCast(w,'tornado');advance(w,.5);const tornado=w.druidTornados[0];values.push([storm,tornado.damage,tornado.hurricane.damage]);
 }
 assert.deepEqual(values[0],[62,26,124]);assert.deepEqual(values[1],[96,50,240]);
});
test('Druida: golpes da forma de lobo e sangramento recebem o próprio rank além da transformação',()=>{
 for(const id of ['leap','garraDeGelo','corteSangrento']){
  const values=[];
  for(const rank of [1,5]){const w=field('druid',{wolf:1,[id]:rank});w.druidForm='wolf';const e=target(w,id==='leap'?6:2);const ids={leap:1,garraDeGelo:5,corteSangrento:4};assert.ok(druidAction(w,ids[id]));advance(w,.5);values.push([lost(e),e.druidBleed?.damage||0]);}
  assert.ok(values[1][0]>values[0][0],id+' aumenta o impacto');if(id==='corteSangrento')assert.ok(values[1][1]>values[0][1],'sangramento cresce também');
 }
});
test('Planta, cura, Uivo e Brado recebem progressão adequada à função',()=>{
 const plants=[],heals=[];
 for(const rank of [1,5]){
  const w=field('druid',{roots:1,plantaCarnivora:rank,rejuvenate:rank});druidCast(w,'roots');advance(w,.7);const p=w.actors.find(a=>a.companion==='carnivorousPlant');plants.push([p.maxHp,p.damage]);
  w.player.hp=1;druidCast(w,'rejuvenate');advance(w,.4);heals.push(w.druidHeal.rate*5/w.player.maxHp);
 }
 assert.ok(plants[1][0]>plants[0][0]);assert.deepEqual(plants.map(p=>p[1]),[46,68]);
 assert.ok(Math.abs(heals[0]-.3)<1e-9);assert.ok(Math.abs(heals[1]-.5)<1e-9);assert.equal(druidHowlBonus({howl:5}),.45);
 const w=field('warrior',{warCry:5}),e=target(w,2);warriorAction(w,6);advance(w,.25);assert.equal(e.slowTime,6);assert.ok(Math.abs(w.warriorRally.until-w.time-8)<.1);
});
test('Guerreiro: Arremesso, Corte Espacial e Cadência escalam, mantendo 230% no primeiro ponto',()=>{
 const waves=[],shields=[],chains=[];
 for(const rank of [1,5]){
  const w=field('warrior',{corteEspacial:rank});warriorAction(w,0);advance(w,.4);waves.push(w.warriorWaves[0].damage);
  const s=field('warrior',{shieldThrow:rank});s.equipment.shield={};warriorAction(s,5);advance(s,.2);shields.push(s.warriorShieldFlight.damage);
  const c=field('warrior',{thrust:1,cadencia:rank});target(c,6);target(c,9,3);warriorAction(c,1);advance(c,.5);assert.equal(c.warriorAction.hops,1);chains.push(c.warriorAction.damageFactor);
 }
 assert.deepEqual(waves,[230,322]);assert.deepEqual(shields,[120,168]);assert.ok(Math.abs(chains[0]-.6)<1e-9);assert.ok(Math.abs(chains[1]-.84)<1e-9);
});
