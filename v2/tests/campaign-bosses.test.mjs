import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession} from '../scripts/session.mjs';
import {launchWorld,tickWorld} from '../scripts/campaign-world.mjs';
import {spawnEnemy,targets,target,shoot,tickHostiles} from '../scripts/enemies.mjs';
import {tickBento} from '../scripts/cedro-combat.mjs';
import {prepareCaveQueen,tickCaveQueen} from '../scripts/cave-queen.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {niloAction,niloDialogue} from '../scripts/nilo-quest.mjs';
const api={targets,target,spawnEnemy,shoot};
function empty(){const s=createSession(),w=s.world;w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};w.actors=w.actors.filter(a=>a===w.player);Object.assign(w.player,{x:4,y:0,hp:10000,maxHp:10000,defense:0,barrier:0,boneShield:false});return w;}
function queen(){const w=empty(),e=spawnEnemy(w,8,0,0,{wave:11,tier:'rare'});e.worldGroup='cave-queen';prepareCaveQueen(w,e);return {w,e};}
test('Mãe-Tecelã vira gigante uma única vez e o resgate depende de vencer chefe e guarda',()=>{
 const s=createSession();s.save.campaign.started=true;s.save.campaign.world={stage:'complete',nilo:'cave',area:'itauna-cave',entry:'mouth',questFlow:1};launchWorld(s);const w=s.world,p=s.save.campaign.world;
 Object.assign(w.player,{x:-40,y:-56});tickWorld(s,.1);const e=w.actors.find(a=>a.caveQueen);assert.ok(e);assert.equal(e.model,'enemySpider');assert.equal(e.isBoss,true);assert.equal(e.scale,2.6);assert.equal(e.radius,1.15);
 const hp=e.maxHp;prepareCaveQueen(w,e);assert.equal(e.maxHp,hp);
 assert.equal(niloAction(s,'nilo-rescue'),false);dealDamage(w,e,1e8,w.player);tickWorld(s,.1);assert.equal(niloAction(s,'nilo-rescue'),false);
 for(const a of [...w.actors])if(a.worldGroup==='cave-queen'&&a.hp>0)dealDamage(w,a,1e8,w.player);tickWorld(s,.1);
 assert.equal(niloDialogue('nilo-cocoon',p).kind,'nilo-rescue');assert.equal(niloAction(s,'nilo-rescue'),true);launchWorld(s);assert.equal(w.adventure.groups.find(g=>g.id==='cave-queen').state,'clear');
});
test('veneno tem preparação, dura no chão e desaparece junto com os projéteis quando a rainha morre',()=>{
 const {w,e}=queen();e.queen={action:null,step:1,cooldown:0,broods:0};tickCaveQueen(w,e,.1,api);assert.equal(e.queen.action.kind,'venom');tickCaveQueen(w,e,.5,api);assert.equal(w.hostileZones.length,0);
 tickCaveQueen(w,e,.7,api);assert.equal(w.hostileZones.length,3);const hp=w.player.hp;tickHostiles(w,.1);assert.ok(w.player.hp<hp);
 shoot(w,e,1,0,10,10,1,'web');w.hostileShots.at(-1).bossOwned=true;e.hp=0;const before=w.player.hp;tickHostiles(w,.1);assert.equal(w.player.hp,before);assert.equal(w.hostileZones.length,0);assert.equal(w.hostileShots.length,0);
});
test('teias em leque respeitam o Dash e os filhotes são finitos e não dão XP',()=>{
 const {w,e}=queen();w.player.x=8;e.queen={action:null,step:2,cooldown:0,broods:0};tickCaveQueen(w,e,.1,api);assert.equal(e.queen.action.kind,'web');tickCaveQueen(w,e,1.2,api);assert.equal(w.hostileShots.length,3);
 w.dash.remaining=1;tickHostiles(w,1);assert.equal(w.player.rootTime||0,0);w.dash.remaining=0;
 e.queen={action:null,step:0,cooldown:0,broods:0};
 for(const hp of [.6,.25]){e.hp=e.maxHp*hp;tickCaveQueen(w,e,.1,api);assert.equal(e.queen.action.kind,'brood');tickCaveQueen(w,e,1.5,api);tickCaveQueen(w,e,1,api);}
 const children=w.actors.filter(a=>a.queenOwner===e.id);assert.equal(children.length,8);assert.ok(children.every(a=>a.rewarded&&a.xp===0&&a.worldGroup==='cave-queen'));assert.equal(e.queen.broods,2);
 e.hp=e.maxHp*.1;tickCaveQueen(w,e,10,api);assert.notEqual(e.queen.action.kind,'brood');
});
test('Bento alcança alvos distantes e encadeia dois golpes com preparação separada',()=>{
 const w=empty(),e=spawnEnemy(w,0,0,0,{wave:13,tier:'rare'});w.player.x=15;e.bento={cooldown:0,step:0,reserve:true,action:null};tickBento(w,e,.1,api);assert.equal(e.bento.action.kind,'charge');
 w.player.x=3;e.hp=e.maxHp*.6;e.bento={cooldown:0,step:0,reserve:true,action:null};tickBento(w,e,.1,api);const first=e.bento.action;assert.equal(first.kind,'sweep');assert.equal(first.chain,1);
 tickBento(w,e,first.total+.01,api);assert.notEqual(e.bento.action,first);assert.equal(e.bento.action.kind,'sweep');assert.equal(e.bento.action.time,0);assert.equal(e.bento.action.chain,0);const hp=w.player.hp;tickBento(w,e,.2,api);assert.equal(w.player.hp,hp,'segundo golpe ainda está preparando');
});
test('Bento tem mais resistência e dano sem mudar soldados comuns',()=>{
 const s=createSession();s.save.campaign.started=true;s.save.campaign.world={stage:'complete',nilo:'done',cedro:'active',area:'cedro',entry:'camp'};launchWorld(s);const w=s.world;Object.assign(w.player,{x:80,y:-119});tickWorld(s,.1);const e=w.actors.find(a=>a.cedroBoss),base=spawnEnemy(w,0,80,-119,{wave:e.gearWave,tier:'rare'});
 assert.equal(e.isBoss,true);assert.equal(e.maxHp,Math.round(base.maxHp*7.5));assert.equal(e.dmg,Math.round(base.dmg*1.45));
});
