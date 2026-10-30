import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,stepSession,snapshot,applySave} from '../scripts/session.mjs';
import {normalizeSave} from '../scripts/save-model.mjs';
import {launchSiege,buildTower,upgradeTower,startSiegeWave,endSiege,attuneRune} from '../scripts/siege.mjs';
import {normalizeSiege,wavePlan,LANES,CORE,PADS} from '../scripts/siege-model.mjs';
import {tickSiegeCombat,tickSiegeEnemy} from '../scripts/siege-combat.mjs';
import {spawnEnemy} from '../scripts/enemies.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {returnAdventure} from '../scripts/campaign.mjs';
const fresh=()=>{const s=createSession();s.scene='village';s.save.campaign.started=true;s.save.campaign.village=true;s.save.campaign.cleared[4]=1;s.world.random=()=>.99;return s;};
const run=()=>{const s=fresh();assert.equal(launchSiege(s).ok,true);return s;};
const enemy=(s,lane=0,pos={x:-12,y:-12})=>Object.assign(spawnEnemy(s.world,0,pos.x,pos.y),{siegeLane:lane,siegeNode:1,spd:1.5,hp:100,maxHp:100,xp:12});
test('acesso exige fim do Ato I, vila, grau e modificador válidos; saves antigos ganham padrões',()=>{
 const s=createSession();assert.equal(launchSiege(s).ok,false);const v=fresh();assert.equal(launchSiege(v,2).ok,false);assert.equal(launchSiege(v,1,'fake').ok,false);
 assert.deepEqual(normalizeSave(snapshot(s)).character.siege,normalizeSiege());assert.equal(normalizeSiege({runes:{bone:999},unlocked:999,shards:-10}).runes.bone,3);
});
test('construção é atômica e limitada a pedestais; melhorias até grau 3, sem ouro nem duplicação',()=>{
 const s=run(),r=s.world.adventure,gold=s.save.character.gold;assert.equal(buildTower(s,999,'bone').ok,false);assert.equal(buildTower(s,1,'invalid').ok,false);
 assert.equal(buildTower(s,1,'bone').ok,true);assert.equal(r.essence,160);assert.equal(buildTower(s,1,'frost').ok,false);
 assert.equal(upgradeTower(s,1).ok,true);assert.equal(r.essence,0);assert.equal(upgradeTower(s,1).ok,false);r.essence=1000;assert.equal(upgradeTower(s,1).ok,true);const essence=r.essence;assert.equal(upgradeTower(s,1).ok,false);assert.equal(r.essence,essence);assert.equal(s.save.character.gold,gold);
});
test('rotas e chefe são anunciados pelo plano; modificadores escalam vida e velocidade',()=>{
 assert.deepEqual([...new Set(wavePlan(1,1).map(q=>q.lane))],[0]);assert.equal(new Set(wavePlan(1,3).map(q=>q.lane)).size,2);assert.equal(new Set(wavePlan(1,5).map(q=>q.lane)).size,3);assert.equal(wavePlan(1,8).filter(q=>q.boss).length,1);
 assert.ok(wavePlan(1,1,'armored')[0].hp>wavePlan(1,1)[0].hp);assert.ok(wavePlan(1,1,'haste')[0].speed>wavePlan(1,1)[0].speed);
});
test('dano das torres usa morte e recompensa comuns uma vez; resistência não dá imunidade',()=>{
 const s=run(),r=s.world.adventure;s.world.player.x=20;s.world.player.y=15;buildTower(s,1,'bone');const e=enemy(s,1,{x:-14,y:-8});e.hp=1;const essence=r.essence;tickSiegeCombat(s.world,.1);assert.equal(e.dead,true);assert.equal(e.rewarded,true);assert.equal(r.essence,essence+12);tickSiegeCombat(s.world,2);assert.equal(r.essence,essence+12);
 const a=enemy(s,1,{x:-14,y:-8});r.towers[0].cd=0;tickSiegeCombat(s.world,.1);assert.equal(a.hp,86);
});
test('gelo desacelera, peste atinge grupo e cripta reanima somente guardiões caídos',()=>{
 const s=run(),r=s.world.adventure;r.essence=2000;buildTower(s,1,'frost');const e=enemy(s,0,{x:-14,y:-8});tickSiegeCombat(s.world,.1);assert.equal(e.slow,.225);assert.ok(e.hp<100);
 buildTower(s,2,'plague');const a=enemy(s,0,{x:-7,y:-6}),b=enemy(s,0,{x:-7,y:-7});tickSiegeCombat(s.world,.1);assert.ok(a.hp<100&&b.hp<100);
 buildTower(s,7,'crypt');tickSiegeCombat(s.world,.1);let guards=s.world.actors.filter(a=>a.siegeGuard);assert.equal(guards.length,2);const livingId=guards[1].id;dealDamage(s.world,guards[0],999,s.world.player);r.towers.find(t=>t.kind==='crypt').cd=0;tickSiegeCombat(s.world,.1);guards=s.world.actors.filter(a=>a.siegeGuard);assert.equal(guards.length,2);assert.ok(guards.some(a=>a.id===livingId));
});
test('invasores seguem pontos e vazamentos ferem obelisco uma vez sem essência ou XP',()=>{
 const s=run(),r=s.world.adventure;Object.assign(s.world.player,{x:20,y:15});const e=enemy(s);tickSiegeEnemy(s.world,e,.25);tickSiegeEnemy(s.world,e,.25);assert.ok(e.y>-12);e.x=CORE.x;e.y=CORE.y;e.siegeNode=LANES[0].points.length-1;const essence=r.essence,exp=s.save.character.exp;tickSiegeEnemy(s.world,e,.1);tickSiegeEnemy(s.world,e,.1);assert.equal(r.integrity,19);assert.equal(e.rewarded,true);assert.equal(r.essence,essence);assert.equal(s.save.character.exp,exp);
});
test('pausa bloqueia simulação e derrota congela o combate; retorno limpa estruturas',()=>{
 const s=run(),r=s.world.adventure;startSiegeWave(s);s.world.paused=true;stepSession(s,.25,{});assert.equal(r.queue.length,10);assert.equal(r.elapsed,0);s.world.paused=false;r.integrity=0;stepSession(s,.1,{});assert.equal(r.done,true);assert.equal(r.won,false);assert.equal(r.queue.length,0);const time=s.world.time;s.world.paused=false;stepSession(s,.2,{});assert.equal(s.world.time,time);returnAdventure(s);assert.equal(s.scene,'village');assert.equal(s.world.adventure,null);assert.equal(s.world.actors.some(a=>a.siegeLane!==undefined||a.pad||a.siegeGuard),false);
});
test('oito ondas vencidas encerram uma vez, pagam e liberam grau; runas persistem sem salvar partida',()=>{
 const s=run(),w=s.world,r=w.adventure;Object.assign(w.player,{x:22,y:16});
 for(let wave=1;wave<=8;wave++){assert.equal(startSiegeWave(s),true);assert.equal(startSiegeWave(s),false);let limit=0;while(r.active&&!r.done&&limit++<400){stepSession(s,.1,{});for(const e of w.actors.filter(a=>a.siegeLane!==undefined&&a.hp>0))dealDamage(w,e,1e9,w.player);}assert.ok(limit<400);assert.equal(r.wave,wave);}
 assert.equal(r.done,true);assert.equal(r.won,true);assert.equal(s.save.character.siege.unlocked,2);const gold=s.save.character.gold;assert.equal(endSiege(s,true),false);assert.equal(s.save.character.gold,gold);
 returnAdventure(s);s.save.character.siege.shards=4;assert.equal(attuneRune(s,'frost',true).ok,true);assert.equal(s.save.character.siege.runes.frost,1);assert.equal(s.save.character.siege.shards,2);const saved=snapshot(s);applySave(s,saved);assert.equal(s.save.character.siege.rune,'frost');assert.equal(s.save.character.siege.unlocked,2);assert.equal(s.world.adventure,null);assert.equal(s.world.actors.some(a=>a.pad),false);
});
test('melhorar a Cripta reforça guardiões vivos sem curar; runa é aplicada no início da partida',()=>{
 const s=fresh();s.save.character.siege={...normalizeSiege(),rune:'crypt',runes:{crypt:2}};launchSiege(s);const r=s.world.adventure;r.essence=1000;buildTower(s,7,'crypt');tickSiegeCombat(s.world,.1);
 const guard=s.world.actors.find(a=>a.siegeGuard);guard.hp=guard.maxHp/2;const oldMax=guard.maxHp,oldPower=guard.power;
 assert.equal(upgradeTower(s,7).ok,true);assert.ok(guard.maxHp>oldMax);assert.ok(guard.power>oldPower);assert.ok(Math.abs(guard.hp/guard.maxHp-.5)<.01);assert.equal(r.runeRank,2);
 const count=s.world.actors.filter(a=>a.siegeGuard).length;tickSiegeCombat(s.world,.1);assert.equal(s.world.actors.filter(a=>a.siegeGuard).length,count);
});

test('runa gélida reforça controle com limite e sem imunidade da rota resistente',()=>{
 const s=fresh();s.save.character.siege={...normalizeSiege(),rune:'frost',runes:{frost:3}};launchSiege(s);buildTower(s,1,'frost');const e=enemy(s,0,{x:-14,y:-8});tickSiegeCombat(s.world,.1);assert.ok(Math.abs(e.slow-.306)<1e-9);assert.ok(e.hp<100);
});
