import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,step,dealDamage} from '../scripts/training-model.mjs';
import {spawnEnemy,SLAM,RAIN,HOWL,CUT} from '../scripts/enemies.mjs';
// Jogador parado no centro de uma arena aberta com vida de sobra para medir dano.
function setup(index,x,y){const w=createWorld({horde:0}),p=w.player;w.actors=[p];w.arena={bounds:{minX:-30,maxX:30,minY:-30,maxY:30},solids:[]};Object.assign(p,{x:0,y:0,hp:1e5,maxHp:1e5,hpRegen:0});const e=spawnEnemy(w,index,x,y);return {w,p,e};}
const quiet=e=>{e.atkTimer=1e9;e.abilityCd=1e9;return e;};
const advance=(w,t)=>{for(let i=0;i<Math.round(t/.01);i++)step(w,.01);};
const warnings=(w,e)=>w.effects.filter(f=>f.enemyWarning===e.id);
// ---- Orc: Pancada no Chão
test('Orc: pancada no chão trava o ponto, avisa a área e só causa dano no impacto',()=>{
 const {w,p,e}=setup(10,0,-3);e.abilityCd=0;advance(w,.05);assert.ok(e.slam,'começou a armar');
 const {px,py}=e.slam;p.x=0;advance(w,.5);assert.equal(p.hp,1e5,'sem dano antes do impacto');
 assert.ok(warnings(w,e).some(f=>f.radius===SLAM.radius&&f.x===px&&f.y===py),'aviso do tamanho da área, no ponto travado');
 advance(w,SLAM.wind+SLAM.flight);assert.ok(p.hp<1e5,'o impacto acerta quem ficou na área');const hp=p.hp;advance(w,.3);assert.equal(p.hp,hp,'dano único');
});
test('Orc: sair da área durante a preparação evita a pancada; morte e pausa cancelam',()=>{
 let {w,p,e}=setup(10,0,-3);e.abilityCd=0;advance(w,.3);p.x=SLAM.radius+3;advance(w,2);assert.equal(p.hp,1e5);
 ({w,p,e}=setup(10,0,-3));e.abilityCd=0;advance(w,.3);dealDamage(w,e,1e9,p);advance(w,1.5);assert.equal(p.hp,1e5);assert.equal(e.slam,null);assert.equal(warnings(w,e).length,0);
 ({w,p,e}=setup(10,0,-3));e.abilityCd=0;advance(w,.3);const t=e.slam.time;w.paused=true;advance(w,1);assert.equal(e.slam.time,t);
});
test('Orc: pancada em área atinge também a horda e tem recarga',()=>{
 const {w,p,e}=setup(10,0,-3);const ally={id:w.nextId++,model:'skeleton',team:'ally',x:1.5,y:-1.2,radius:.35,hp:500,maxHp:500,angle:0,animation:'idle',animationTime:0,walkDistance:0,actionId:0,timer:0,phase:0};w.actors.push(ally);
 e.abilityCd=0;advance(w,SLAM.total+.1);assert.ok(ally.hp<500||p.hp<1e5);assert.ok(e.abilityCd>SLAM.cooldown-1,'recarga iniciada');
});
// ---- Arqueiros: Saraivada
for(const index of [1,9])test('Saraivada: trava a área, avisa e só causa dano quando as flechas caem — tipo '+index,()=>{
 const {w,p,e}=setup(index,0,-7);quiet(e).rainCd=0;advance(w,.05);assert.ok(e.rain);const {tx,ty}=e.rain;
 advance(w,.5);assert.ok(warnings(w,e).some(f=>f.radius===RAIN.radius&&f.x===tx),'aviso da área');assert.equal(p.hp,1e5);
 advance(w,RAIN.wind-.45);assert.ok(w.hostileZones.some(z=>z.delay>0),'zona de queda criada, ainda sem dano');assert.ok(w.effects.some(f=>f.fx==='arrowRain'),'chuva visual');assert.equal(p.hp,1e5);
 advance(w,RAIN.fall+.2);assert.ok(p.hp<1e5,'acertou quem ficou na área');const hp=p.hp;advance(w,.5);assert.equal(p.hp,hp,'dano único');
});
test('Saraivada: sair da área evita o dano; a queda continua após a morte do arqueiro, a preparação não',()=>{
 let {w,p,e}=setup(1,0,-7);quiet(e).rainCd=0;advance(w,.3);p.x=RAIN.radius+3;advance(w,3);assert.equal(p.hp,1e5);
 ({w,p,e}=setup(1,0,-7));quiet(e).rainCd=0;advance(w,.3);dealDamage(w,e,1e9,p);advance(w,3);assert.equal(p.hp,1e5,'preparação cancelada');
 ({w,p,e}=setup(1,0,-7));quiet(e).rainCd=0;advance(w,RAIN.wind+.1);dealDamage(w,e,1e9,p);advance(w,2);assert.ok(p.hp<1e5,'flechas já lançadas caem');
});
test('Saraivada: recarga e distância mínima',()=>{
 let {w,p,e}=setup(1,0,-7);quiet(e).rainCd=0;advance(w,RAIN.total+.2);assert.ok(e.rainCd>RAIN.cooldown-2);
 ({w,p,e}=setup(1,0,-1.5));quiet(e).rainCd=0;advance(w,.3);assert.ok(!e.rain,'muito perto: usa o recuo e o tiro comum');
 ({w,p,e}=setup(1,0,-20));quiet(e).rainCd=0;advance(w,.2);assert.ok(!e.rain,'muito longe');
});
// ---- Cão de Cripta: Uivo
test('Uivo: chama reforços sem XP nem loot, com limite por cão e que não uivam',()=>{
 const {w,p,e}=setup(4,0,-9);e.howlCd=0;advance(w,.05);assert.ok(e.howl,'começou a uivar');assert.equal(w.actors.filter(a=>a.typeIndex===4).length,1);
 advance(w,HOWL.wind+.05);const pups=w.actors.filter(a=>a.summoned===e.id);assert.equal(pups.length,HOWL.count);
 assert.ok(pups.every(a=>a.rewarded&&a.xp===0&&a.hp>0));
 for(let round=0;round<6;round++){e.howlCd=0;e.howl=null;e.ability=null;advance(w,HOWL.total+.2);}
 assert.ok(w.actors.filter(a=>a.summoned===e.id&&a.hp>0).length<=HOWL.cap,'limite por cão');
 assert.ok(w.actors.filter(a=>a.summoned&&a.howl).length===0,'reforços não uivam');
});
test('Uivo: morte durante o chamado cancela os reforços; reforços não dão recompensa ao morrer',()=>{
 let {w,p,e}=setup(4,0,-9);e.howlCd=0;advance(w,.5);dealDamage(w,e,1e9,p);advance(w,2);assert.equal(w.actors.filter(a=>a.summoned).length,0);
 ({w,p,e}=setup(4,0,-9));e.howlCd=0;advance(w,HOWL.wind+.1);const pup=w.actors.find(a=>a.summoned);dealDamage(w,pup,1e9,p);assert.equal(pup.rewarded,true);
 ({w,p,e}=setup(4,0,-9));e.howlCd=0;advance(w,.3);const t=e.howl.time;w.paused=true;advance(w,1);assert.equal(e.howl.time,t);
});
test('Uivo: pose do uivo usa o clipe howl e não ocorre com o alvo longe demais',()=>{
 let {w,e}=setup(4,0,-9);e.howlCd=0;advance(w,.4);assert.equal(e.pose.anim,'howl');
 ({w,e}=setup(4,0,-25));e.howlCd=0;advance(w,.3);assert.ok(!e.howl);
});

test('Soldado: corte frontal prepara dois segundos, trava direcao e atinge uma unica vez',()=>{
 const {w,p,e}=setup(0,0,-2);e.abilityCd=0;e.atkTimer=99;advance(w,.1);assert.ok(e.cut);advance(w,1.7);assert.equal(p.hp,1e5);assert.ok(warnings(w,e).some(f=>f.arc===CUT.arc));advance(w,.3);assert.ok(p.hp<1e5);const hp=p.hp;advance(w,.2);assert.equal(p.hp,hp);assert.equal(w.combatEvents.filter(x=>x.kind==='soldierCut').length,1);
});
test('Soldado: sair do arco evita corte; morte cancela preparacao',()=>{
 let {w,p,e}=setup(0,0,-2);e.abilityCd=0;e.atkTimer=99;advance(w,.2);p.y=-4;advance(w,2);assert.equal(p.hp,1e5);
 ({w,p,e}=setup(0,0,-2));e.abilityCd=0;advance(w,.2);dealDamage(w,e,1e9,p);advance(w,2);assert.equal(p.hp,1e5);assert.ok(!e.cut);
});
test('Orc: salta de longe para ponto travado, ganha altura e causa impacto so ao pousar',()=>{
 const {w,p,e}=setup(10,0,-8);e.abilityCd=0;advance(w,.1);assert.ok(e.slam);const {px,py}=e.slam;advance(w,SLAM.wind+.15);assert.ok(e.jumpZ>0);assert.equal(p.hp,1e5);p.x=6;advance(w,SLAM.flight);assert.equal(p.hp,1e5);assert.equal(e.jumpZ,0);assert.equal(e.x,px);assert.equal(e.y,py);assert.ok(w.effects.some(f=>f.fx==='groundBreak'));assert.equal(w.combatEvents.filter(x=>x.kind==='orcSlam').length,1);
});
