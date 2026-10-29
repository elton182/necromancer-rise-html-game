import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createSession,equipSession,transition,activateSlot,stepSession,snapshot} from '../scripts/session.mjs';
import {SPELL_TEST_PROFILE,changeRank} from '../scripts/grimoire.mjs';
import {setProfile,members} from '../scripts/horde.mjs';
import {SPELL_RULES as R,castSpell,tickSpells,blockEnemyByWalls,absorbWallProjectile} from '../scripts/spells.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {Model} from '../scripts/mastery.mjs';
const require=createRequire(import.meta.url);
// As regras destas magias são conferidas com os atributos do nível 1; os atributos reais por nível têm testes próprios.
const pin=w=>Object.assign(w.player,{maxHp:100,hp:100,maxMp:80,mp:80,spellDamage:40});
function fixture(){const s=createSession();setProfile(s.world,SPELL_TEST_PROFILE);['chuva','explosao','maos','barreira','maldicao','dash'].forEach((id,i)=>assert.ok(equipSession(s,i,id).ok));transition(s,'training');const w=s.world;pin(w);w.player.x=0;w.player.y=8;w.aim={x:0,y:5};w.random=()=>.5;for(const e of w.actors)if(e.team==='enemy'){e.x=12;e.y=-12;e.timer=999;e.hp=e.maxHp=10000;}return s;}
function enemy(w,x=0,y=5){const e=w.actors.find(a=>a.team==='enemy');e.x=x;e.y=y;return e;}
test('parâmetros das cinco magias vêm das funções e overrides atuais',()=>{assert.deepEqual(R,require('../tools/spell-source.cjs').readSpellRules());assert.equal(R.barreira.healthRatio,.25);});
test('novos slots exigem aprendizado; seis ações sem duplicatas e save restaura loadout',()=>{
 const s=createSession();assert.equal(equipSession(s,0,'chuva').ok,false);const f=fixture();assert.equal(new Set(f.world.army.loadout).size,6);const loaded=createSession(snapshot(f));assert.deepEqual(loaded.world.army.loadout,f.world.army.loadout);assert.equal(activateSlot(f,40),false);
});
test('explosão causa dano imediato uma vez; mana, pausa, alcance e recarga são atômicos',()=>{
 const s=fixture(),w=s.world,e=enemy(w),hp=e.hp;assert.equal(activateSlot(s,1),true);assert.equal(e.hp,hp-Math.floor(40*2.5*1.12));assert.equal(w.player.mp,20);assert.equal(w.spellCooldowns.explosao,8);assert.equal(castSpell(w,'explosao'),false);tickSpells(w,.5);assert.equal(e.hp,hp-112);
 for(const mode of ['paused','range','nan','mana']){const n=fixture().world;if(mode==='paused')n.paused=true;if(mode==='range')n.aim={x:100,y:100};if(mode==='nan')n.aim.x=NaN;if(mode==='mana')n.player.mp=0;const before=n.player.mp;assert.equal(castSpell(n,'explosao'),false);assert.equal(n.player.mp,before);assert.equal(n.spellCooldowns.explosao,undefined);}
});
test('trocar slot não reinicia recarga e magia falha sem passar ao dispatcher de grupo',()=>{
 const s=fixture();assert.equal(activateSlot(s,1),true);assert.equal(equipSession(s,1,'empty').ok,true);assert.equal(equipSession(s,1,'explosao').ok,true);s.world.player.mp=80;assert.equal(activateSlot(s,1),false);assert.equal(s.world.spellCooldowns.explosao,8);
});
test('chuva paga uma vez e aplica cada impacto só após atraso e queda',()=>{
 const w=fixture().world,e=enemy(w);assert.equal(castSpell(w,'chuva'),true);assert.equal(w.player.mp,40);assert.equal(w.rain.length,7);tickSpells(w,.39);assert.equal(e.hp,10000);tickSpells(w,.01);assert.equal(e.hp,10000-Math.floor(40*.7*1.28));assert.equal(w.rain.length,6);tickSpells(w,1);assert.equal(w.rain.length,0);assert.equal(e.hp,10000-7*Math.floor(40*.7*1.28));const hp=e.hp;tickSpells(w,2);assert.equal(e.hp,hp);
});
test('dano da chuva concorda em passos diferentes; pausa não avança quedas',()=>{
 function run(dt){const s=fixture(),w=s.world,e=enemy(w);castSpell(w,'chuva');w.paused=true;const before=w.rain.map(d=>d.time);stepSession(s,.25,{});assert.deepEqual(w.rain.map(d=>d.time),before);w.paused=false;for(let t=0;t<1.1-1e-6;t+=dt)tickSpells(w,dt);return e.hp;}assert.equal(run(.01),run(.11));
});
test('muralha impede travessia contínua, pulsa e tem duração; não barra tiro aliado',()=>{
 const s=fixture(),w=s.world,e=enemy(w);assert.equal(castSpell(w,'maos'),true);const wall=w.walls[0];assert.equal(wall.hp,176);assert.equal(wall.remaining,5.5);const from={x:0,y:7};Object.assign(e,{x:0,y:3});blockEnemyByWalls(w,e,from);assert.ok(e.y>=5.625-1e-4);const hp=e.hp;tickSpells(w,.01);assert.ok(e.hp<hp);tickSpells(w,6);assert.equal(w.walls.length,0);
});
test('muralha absorve o primeiro projétil hostil pelo segmento e perde resistência',()=>{
 const w=fixture().world;castSpell(w,'maos');const hp=w.walls[0].hp;assert.equal(absorbWallProjectile(w,{x:0,y:8},{x:0,y:1},20),true);assert.equal(w.walls[0].hp,hp-20);assert.equal(absorbWallProjectile(w,{x:10,y:8},{x:10,y:1},20),false);assert.equal(absorbWallProjectile(w,{x:0,y:8},{x:0,y:1},1000),true);assert.equal(w.walls.length,0);
});
test('escudo escolhe zumbi mais ferido, sacrifica sem Pacto e exige recuperação de 20 s',()=>{
 const s=fixture();transition(s,'menu');equipSession(s,5,'zombie');transition(s,'training');const w=s.world,z=members(w,'zombie');pin(w);z[0].hp=z[0].maxHp*.8;z[1].hp=z[1].maxHp*.2;w.player.hp=50;assert.equal(activateSlot(s,3),true);assert.equal(w.player.mp,65);assert.equal(w.player.hp,50);assert.equal(z[1].sacrificed,true);assert.equal(z[1].deadTimer,20);assert.equal(w.player.barrier,Math.round(Math.floor(z[1].maxHp*.7)*1.16));assert.equal(equipSession(s,5,'dash').ok,false);assert.equal(z.filter(a=>a.sacrificed).length,1);
});
test('sem zumbi, escudo cobra 15% da vida máxima sem matar; dura até absorção e respeita Dash',()=>{
 const w=fixture().world;w.player.hp=16;assert.equal(castSpell(w,'barreira'),true);assert.equal(w.player.hp,1);assert.equal(w.player.barrier,29);tickSpells(w,100);assert.equal(w.player.barrier,29);w.dash.remaining=.1;assert.equal(dealDamage(w,w.player,10).blocked,true);assert.equal(w.player.barrier,29);w.dash.remaining=0;dealDamage(w,w.player,10);assert.equal(w.player.barrier,19);
 const n=fixture().world;n.player.hp=15;assert.equal(castSpell(n,'barreira'),false);assert.equal(n.player.mp,80);
});
test('maldição afeta jogador e aliados por um caminho de dano; renovar não empilha e expira',()=>{
 const w=fixture().world,e=enemy(w);assert.equal(castSpell(w,'maldicao'),true);assert.equal(e.curse.reduction,.03);assert.equal(dealDamage(w,w.player,10,e).applied,9.7);w.spellCooldowns.maldicao=0;assert.equal(castSpell(w,'maldicao'),true);assert.equal(e.curse.reduction,.03);tickSpells(w,6);assert.equal(e.curse,undefined);assert.equal(dealDamage(w,w.player,10,e).applied,10);
});
test('maestrias alteram dano, área, duração, absorção, resistência e recarga uma vez',()=>{
 const s=fixture(),w=s.world;for(const id of ['chuva','explosao','maos','barreira','maldicao'])w.army.mastery[id]=Model.normalize(id,{level:10,ranks:{}});w.army.mastery.maos.ranks={body:2,duration:2};w.army.mastery.maldicao.ranks={curse:2};w.modifiers.gearCooldown=50;
 castSpell(w,'maos');assert.ok(w.walls[0].hp>176);assert.ok(w.walls[0].remaining>5.5);assert.equal(w.spellCooldowns.maos,6);w.player.mp=80;castSpell(w,'maldicao');assert.equal(w.spellCooldowns.maldicao,4);const e=enemy(w);w.spellCooldowns.maldicao=0;w.player.mp=80;castSpell(w,'maldicao');assert.equal(e.curse.reduction,.05);
});
test('morte, menu e reinício removem quedas, muralhas, maldição, escudo e recargas; save não guarda luta',()=>{
 const s=fixture(),w=s.world;enemy(w);for(const id of ['chuva','maos','barreira','maldicao']){w.player.mp=80;castSpell(w,id);}const saved=snapshot(s);assert.equal(saved.rain,undefined);assert.equal(saved.walls,undefined);const loaded=createSession(saved);assert.equal(loaded.world.rain.length,0);assert.equal(loaded.world.walls.length,0);assert.deepEqual(loaded.world.spellCooldowns,{});dealDamage(w,w.player,100000);assert.equal(w.rain.length,0);assert.equal(w.walls.length,0);assert.equal(w.player.barrier,0);assert.ok(w.actors.every(a=>!a.curse));transition(s,'menu');assert.deepEqual(w.spellCooldowns,{});
});
test('devolver pré-requisito remove também magia dependente equipada',()=>{
 const s=fixture();transition(s,'menu');s.save.character.gold=10000;assert.equal(changeRank(s,'bolt',{refund:true}).ok,true);assert.equal(s.world.army.profile.ranks.rain,undefined);assert.equal(s.world.army.profile.ranks.wall,undefined);assert.equal(s.world.army.loadout.includes('chuva'),false);assert.equal(s.world.army.loadout.includes('maos'),false);
});
