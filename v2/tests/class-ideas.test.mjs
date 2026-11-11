// Habilidades novas da Druida (vento e lobo), do Mago (setas, esfera, familiar, golem) e do Necromante (cães,
// Cérbero, magos, Raio e Ruptura Necrótica, área das explosões). Regras em docs/habilidades/arvores.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../scripts/training-model.mjs';
import {createSession,equipSession,transition,activateSlot} from '../scripts/session.mjs';
import {setProfile,members,revive,tickHorde,order,CERBERUS,MAGE_ATTACK} from '../scripts/horde.mjs';
import {snapshot} from '../scripts/session.mjs';
import R from '../scripts/horde-rules.mjs';
import {druidAction,tickDruid,HUMAN_ACTIONS,WOLF_ACTIONS} from '../scripts/druid.mjs';
import {MARKSMAN_ACTIONS,marksmanRanks,actionDamage} from '../scripts/marksman-model.mjs';
import {marksmanAction,tickMarksman,clearMarksman} from '../scripts/marksman.mjs';
import {tickCompanions,companionsOf,clearCompanions,COMPANIONS} from '../scripts/companions.mjs';
import Build from '../scripts/full-build.mjs';
import {castSpell} from '../scripts/spells.mjs';
import {gainMastery} from '../scripts/grimoire.mjs';
import {ACTIONS} from '../scripts/actions.mjs';

const target=(w,x,y=0,extra={})=>{const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:10000,maxHp:10000,animation:'idle',animationTime:0,timer:0,...extra};w.actors.push(e);return e;};
const lost=e=>e.maxHp-e.hp;
const arena=w=>{w.arena={bounds:{minX:-30,maxX:30,minY:-30,maxY:30},solids:[]};};

// ── Druida ──
function druid(ranks,level=20){const w=createWorld({horde:0,character:{classId:'druid',level,druidRanks:ranks,equipment:{}}});w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.random=()=>.5;arena(w);w.player.mp=w.player.maxMp;return w;}
const dAdvance=(w,steps,dt=1/60)=>{for(let i=0;i<steps;i++){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);tickDruid(w,dt);}};
const human=id=>HUMAN_ACTIONS.findIndex(a=>a.id===id),wolf=id=>WOLF_ACTIONS.findIndex(a=>a.id===id);

test('Turbilhão atravessa a fila uma vez por inimigo, empurra para o lado e para no alcance',()=>{
 const w=druid({turbilhao:2}),list=[target(w,3,.3),target(w,5,-.3),target(w,7)],far=target(w,11),def=HUMAN_ACTIONS[human('turbilhao')];
 assert.ok(druidAction(w,human('turbilhao')));dAdvance(w,90);
 const dmg=Math.floor(w.player.spellDamage*def.multiplier*(1+2*.08));
 for(const e of list)assert.equal(lost(e),dmg);assert.equal(lost(far),0);
 assert.ok(list[0].y>.3+.4&&list[1].y<-.3-.4,'empurrados para os lados');
 assert.equal(w.druidWinds.length,0);
});

test('Tornado puxa e fere em pulsos por 4 s; chefe não é puxado; com Furacão cresce, dura 6 s e explode',()=>{
 const w=druid({turbilhao:1,tornado:1});w.aim={x:6,y:0};const def=HUMAN_ACTIONS[human('tornado')];
 const near=target(w,6.5,1.4),boss=target(w,6,-1.2,{isBoss:true});
 assert.ok(druidAction(w,human('tornado')));dAdvance(w,Math.ceil(def.release*60)+1);
 assert.equal(w.druidTornados.length,1);const y0=near.y;dAdvance(w,30);assert.ok(near.y<y0,'puxado ao centro');
 const by=boss.y;dAdvance(w,300);assert.equal(w.druidTornados.length,0);
 const pulse=Math.floor(w.player.spellDamage*def.multiplier);assert.ok(lost(near)>=pulse*8&&lost(near)%pulse===0,'pulsos de 25%');
 assert.ok(Math.abs(boss.y-by)<.6,'chefe só anda com o tornado por perto, sem puxão');
 const h=druid({turbilhao:1,tornado:1,furacao:1});h.aim={x:6,y:0};const e=target(h,6.5,0);
 assert.ok(druidAction(h,human('tornado')));dAdvance(h,Math.ceil(def.release*60)+1);
 assert.equal(h.druidTornados[0].radius,def.hurricane.radius);assert.ok(Math.abs(h.druidTornados[0].until-h.time-def.hurricane.time)<.05);
 dAdvance(h,400);assert.equal(h.druidTornados.length,0);assert.ok(h.effects.some(f=>f.fx==='shockwave'),'explosão final visível');
 assert.ok(lost(e)>Math.floor(h.player.spellDamage*def.hurricane.multiplier),'explosão soma ao dano dos pulsos');
});

test('lobo: Corte Sangrento sangra por 4 s sem somar; Garra de Gelo desacelera (chefes não)',()=>{
 const w=druid({wolf:1,leap:1,corteSangrento:1,garraDeGelo:1});w.druidForm='wolf';
 const e=target(w,2,0),def=WOLF_ACTIONS[wolf('corteSangrento')];
 assert.ok(druidAction(w,wolf('corteSangrento')));dAdvance(w,Math.ceil(def.release*60)+1);
 const hit=lost(e);assert.ok(e.druidBleed,'sangrando');dAdvance(w,60*4+10);
 const tick=e.druidBleed?0:Math.floor((lost(e)-hit)/(def.bleed.time/def.bleed.interval));assert.ok(tick>0);assert.equal(lost(e)-hit,tick*8);
 const g=druid({wolf:1,leap:1,garraDeGelo:1});g.druidForm='wolf';const foe=target(g,2.5,0),boss=target(g,2.6,.3,{isBoss:true}),G=WOLF_ACTIONS[wolf('garraDeGelo')];
 assert.ok(druidAction(g,wolf('garraDeGelo')));dAdvance(g,Math.ceil(G.release*60)+1);
 assert.equal(foe.slow,G.slow);assert.equal(foe.slowTime,G.slowTime);assert.ok(lost(boss)>0);assert.ok(!boss.slow);
 assert.ok(g.effects.some(f=>String(f.id)==='druid-chill-'+foe.id),'anel de gelo');
});

// ── Mago ──
function mage(ranks,level=20){const w=createWorld({horde:0,character:{classId:'mage',level,equipment:{},marksmanRanks:marksmanRanks('mage',ranks,level)}});w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.random=()=>.5;arena(w);w.player.mp=w.player.maxMp;return w;}
const mAdvance=(w,steps,dt=1/60)=>{for(let i=0;i<steps;i++){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);tickMarksman(w,dt);tickCompanions(w,dt);}};
const mIndex=id=>MARKSMAN_ACTIONS.mage.findIndex(a=>a.id===id),mDef=id=>MARKSMAN_ACTIONS.mage[mIndex(id)];

test('Setas Perseguidoras curvam até um alvo fora do leque',()=>{
 const w=mage({bolt:1,setasPerseguidoras:1}),side=target(w,4,4.5),d=mDef('setasPerseguidoras');
 assert.ok(marksmanAction(w,mIndex('setasPerseguidoras')));mAdvance(w,90);
 const dmg=actionDamage(d,w.player.spellDamage,w.marksmanRanks);assert.ok(lost(side)>=dmg);assert.equal(lost(side)%dmg,0);
});

test('Esfera de Gelo: planeta lento que fere quem toca e solta cristais em espiral que desaceleram',()=>{
 // O alvo de lado fica mais perto da esfera no começo do trajeto: recebe os cristais; o do caminho, o contato.
 const w=mage({frost:1,esferaDeGelo:1}),side=target(w,2,3),path=target(w,8,0),d=mDef('esferaDeGelo');
 assert.ok(marksmanAction(w,mIndex('esferaDeGelo')));mAdvance(w,Math.ceil(d.release*60)+1);
 assert.equal(w.marksmanOrbs.length,1);assert.equal(d.cooldown,4);
 const start=w.marksmanOrbs[0].x,fired=new Set();for(let i=0;i<30;i++){mAdvance(w,1);for(const s of w.marksmanShots)fired.add(s.id);}
 assert.ok(Math.abs(w.marksmanOrbs[0].x-start-d.speed*.5)<.1,'2 u/s');
 assert.ok(fired.size>=6,'dois cristais a cada 0,15 s (0,5 s: 3 pulsos ou mais)');assert.ok(w.effects.some(f=>f.fx==='iceOrb'),'planeta visível');
 mAdvance(w,60);assert.ok(lost(side)>0,'cristais');assert.ok(side.frostUntil>w.time,'cristal desacelera e conta para o Estilhaçar');assert.ok(side.slowTime>0);
 mAdvance(w,180);const orb=actionDamage(d,w.player.spellDamage,w.marksmanRanks);assert.ok(lost(path)>=orb,'contato');
 mAdvance(w,150);assert.equal(w.marksmanOrbs.length,0,'some no fim do alcance (5 s)');
});

test('Familiar de Fogo acompanha por 20 s e lança bolas de fogo; recarga impede outro antes do tempo',()=>{
 const w=mage({fireball:1,combustion:1,imbuirFogo:1,familiarDeFogo:1}),e=target(w,6,0),d=mDef('familiarDeFogo');
 assert.ok(marksmanAction(w,mIndex('familiarDeFogo')));mAdvance(w,Math.ceil(d.release*60)+1);
 assert.ok(w.marksmanFamiliar);mAdvance(w,60*3);assert.ok(lost(e)>0,'bolas de fogo');
 assert.ok(w.effects.some(f=>f.id==='mfamiliar'),'espírito visível');
 mAdvance(w,60*18);assert.equal(w.marksmanFamiliar,null,'some depois de 20 s');
 clearMarksman(w);assert.equal(w.marksmanOrbs.length,0);
});

test('Golem de Gelo: companheiro com 120% da vida, golpeia e desacelera; só um por vez; some em 25 s',()=>{
 const w=mage({frost:1,esferaDeGelo:1,golemDeGelo:1}),e=target(w,4,0),d=mDef('golemDeGelo'),spec=COMPANIONS.iceGolem;
 assert.ok(marksmanAction(w,mIndex('golemDeGelo')));mAdvance(w,Math.ceil(d.release*60)+1);
 const g=companionsOf(w,'iceGolem');assert.equal(g.length,1);assert.equal(g[0].maxHp,Math.round(w.player.maxHp*spec.hp));assert.equal(g[0].tint,spec.tint);
 mAdvance(w,60*4);assert.ok(lost(e)>=g[0].damage,'golpeou');assert.equal(lost(e)%g[0].damage,0);assert.equal(e.slow,spec.slow);
 w.marksmanCooldowns={};w.player.mp=w.player.maxMp;assert.ok(marksmanAction(w,mIndex('golemDeGelo')));mAdvance(w,40);
 assert.equal(companionsOf(w,'iceGolem').filter(a=>a.hp>0).length,1,'o novo substitui o antigo');
 mAdvance(w,60*26);assert.equal(companionsOf(w,'iceGolem').filter(a=>a.hp>0).length,0,'expira');
 clearCompanions(w);assert.equal(companionsOf(w,'iceGolem').length,0);
});

// ── Necromante ──
function necro(ranks,slots){
 const s=createSession(),r=setProfile(s.world,{version:1,level:24,act1:false,ranks});assert.ok(r.ok,r.message);
 slots.forEach((id,i)=>assert.ok(equipSession(s,i,id).ok,id));transition(s,'training');
 const w=s.world;w.actors=w.actors.filter(a=>a===w.player||a.groupType);Object.assign(w.player,{x:0,y:0});w.aim={x:0,y:5};w.random=()=>.5;arena(w);w.player.mp=w.player.maxMp;
 return s;
}

test('Grimório: os nós novos vêm do arquivo, exigem 2 pontos no pai e o Cão Zumbi exclui a Abominação',()=>{
 for(const id of ['caoZumbi','cerberus','mages','raioNecrotico','rupturaNecrotica'])assert.ok(Build.byId[id],id);
 assert.match(Build.reason(Build.byId.abom,{zombie:2,vigor:2,caoZumbi:1},24),/Incompatível/);
 assert.match(Build.reason(Build.byId.caoZumbi,{zombie:2,vigor:2,abom:1},24),/Incompatível/);
 assert.match(Build.reason(Build.byId.raioNecrotico,{skeleton:2,mages:1},24),/2 pontos/);
 assert.equal(Build.reason(Build.byId.mages,{skeleton:2},5),'Requer nível 6.');
});

const nAdvance=(w,steps,dt=1/60)=>{for(let i=0;i<steps;i++){w.time+=dt;tickHorde(w,dt);}};
const hp=ranks=>members(necro(ranks,['caoZumbi']).world,'caoZumbi')[0].maxHp;

test('Cão Zumbi é um grupo da horda: dois cães permanentes, atributos do Grimório, morte, reanimação e save',()=>{
 const s=necro({zombie:2,vigor:2,caoZumbi:2},['caoZumbi']),w=s.world,dogs=members(w,'caoZumbi');
 assert.equal(dogs.length,2);assert.equal(dogs[0].model,'cryptHound');assert.equal(dogs[0].tint,R.defs.caoZumbi.tint);
 assert.ok(hp({zombie:2,vigor:2,caoZumbi:5})>hp({zombie:2,vigor:2,caoZumbi:2}),'pontos dão vida');
 dogs[0].hp=0;nAdvance(w,2);assert.ok(dogs[0].dead&&dogs[0].deadTimer>0,'caiu e espera reanimar');
 const mp=w.player.mp;assert.ok(revive(w));assert.equal(w.player.mp,mp-30);assert.ok(!dogs[0].dead&&dogs[0].hp>0,'reanimado pelo Necromante');
 dogs[1].hp=0;nAdvance(w,2);nAdvance(w,Math.ceil(R.revive*60)+5);assert.ok(!dogs[1].dead,'reanima sozinho depois do tempo da horda');
 const saved=snapshot(s);assert.equal(saved.horde.groups.caoZumbi.length,2);assert.equal(members(createSession(saved).world,'caoZumbi').length,2,'volta do save');
 // Comando Caçada: os cães saltam no alvo perto da mira.
 const e=target(w,0,4);w.aim={x:0,y:4};assert.ok(activateSlot(s,0));assert.ok(dogs.every(d=>d.leap));nAdvance(w,40);assert.ok(lost(e)>0);
});

test('Cérbero: o grupo vira um só cão, maior, com o triplo da vida e mordida em cone',()=>{
 const s=necro({zombie:2,vigor:2,caoZumbi:2,cerberus:1},['caoZumbi']),w=s.world,c=members(w,'caoZumbi');
 assert.equal(c.length,1);assert.equal(c[0].scale,CERBERUS.scale);assert.equal(c[0].tint,CERBERUS.tint);
 assert.ok(Math.abs(c[0].maxHp/hp({zombie:2,vigor:2,caoZumbi:2})-CERBERUS.hp)<.05);
 Object.assign(c[0],{x:0,y:0,abilityCooldown:0,angle:0});const a=target(w,0,1.6),b=target(w,.7,1.5);nAdvance(w,30);
 assert.ok(lost(a)>0&&lost(b)>0,'três cabeças, dois alvos');
});

test('cães e magos preservam morte na reserva e no save, recebem ordens e não ganham maestria inexistente',()=>{
 assert.deepEqual(ACTIONS.slice(0,-2),['empty','raio','dash','zombie','skeleton','archer','specter','abom','chuva','explosao','maos','barreira','maldicao','lich']);
 for(const type of ['caoZumbi','mages']){
  const s=necro({zombie:2,vigor:2,caoZumbi:2,skeleton:2,mages:2},[type]),w=s.world,m=members(w,type)[0];
  m.hp=0;nAdvance(w,2);const timer=m.deadTimer;
  assert.ok(equipSession(s,0,'empty').ok);assert.ok(equipSession(s,0,type).ok);
  const restored=members(w,type)[0];assert.ok(restored.dead);assert.equal(restored.deadTimer,timer);
  const loadedSession=createSession(snapshot(s));transition(loadedSession,'training');
  const loaded=loadedSession.world,fallen=members(loaded,type)[0];
  assert.ok(fallen.dead);assert.equal(fallen.hp,0);assert.equal(fallen.deadTimer,timer);
  loaded.player.mp=loaded.player.maxMp;assert.ok(revive(loaded));assert.ok(fallen.hp>0);
  assert.ok(order(loaded,{x:5,y:0}));const before=fallen.x;nAdvance(loaded,30);assert.ok(fallen.x>before,'segue reunião');
  assert.doesNotThrow(()=>gainMastery(loadedSession,100));
  assert.equal(loaded.army.mastery[type],undefined);
 }
});

test('Magos: orbe roxo à distância; Raio Necrótico atravessa a linha; Ruptura explode quem cai',()=>{
 const s=necro({skeleton:2,mages:2},['mages']),w=s.world,m=members(w,'mages');assert.equal(m.length,2);assert.ok(m[0].ranged);
 for(const x of m)Object.assign(x,{x:0,y:0});const e=target(w,0,6);let colored=false;
 for(let i=0;i<180;i++){nAdvance(w,1);if(w.allyShots.some(s=>s.color===MAGE_ATTACK.color))colored=true;}
 assert.ok(colored,'orbe na cor dos magos');assert.ok(lost(e)>0);
 const r=necro({skeleton:2,mages:2,raioNecrotico:2,rupturaNecrotica:1},['mages']).world,mages=members(r,'mages');
 for(const x of mages)Object.assign(x,{x:0,y:0});
 const a=target(r,0,3),b=target(r,0,5),weak=target(r,.2,7,{hp:5,maxHp:5}),side=target(r,1.6,7.2);
 nAdvance(r,180);
 assert.ok(lost(a)>0&&lost(b)>0,'o raio atravessa a linha');assert.ok(weak.hp<=0);assert.ok(lost(side)>=Math.floor(r.player.spellDamage*MAGE_ATTACK.rupture.mult),'ruptura do corpo que caiu');
 assert.equal(r.allyShots.length,0,'com o raio não há orbes');
});

test('Explosão Cadavérica e Carne Instável aumentam a área da Explosão Necrótica',()=>{
 const radius=ranks=>{const s=necro(ranks,['explosao']),w=s.world;target(w,0,5);assert.ok(castSpell(w,'explosao'));return Math.max(...w.effects.filter(f=>f.radius&&f.color==='#c17cdd').map(f=>f.radius));};
 const base=radius({zombie:2,shield:2,nova:1}),wide=radius({zombie:2,burst:5,shield:2,nova:1});
 assert.ok(Math.abs(wide/base-1.15)<.01,'+3% por ponto (5 pontos)');
});
