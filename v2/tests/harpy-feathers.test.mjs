import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,step,dealDamage} from '../scripts/training-model.mjs';
import {spawnEnemy,FEATHER} from '../scripts/enemies.mjs';
// Jogador parado no centro; a harpia (tipo 7) entra no alcance médio, com a recarga já zerada.
function setup(y=-5){const w=createWorld({horde:0}),p=w.player;w.actors=[p];w.arena={bounds:{minX:-30,maxX:30,minY:-30,maxY:30},solids:[]};Object.assign(p,{x:0,y:0,hp:1000,maxHp:1000,hpRegen:0});const e=spawnEnemy(w,7,0,y);e.abilityCd=0;return {w,p,e};}
const advance=(w,t)=>{for(let i=0;i<Math.round(t/.01);i++)step(w,.01);};
const feathers=w=>w.hostileShots.filter(s=>s.kind==='feather');
test('harpia arma, avisa três trajetos e só então lança as penas em leque',()=>{
 const {w,p,e}=setup();advance(w,.1);assert.ok(e.volley,'começou a armar');
 assert.equal(feathers(w).length,0);assert.ok(w.effects.filter(f=>f.enemyWarning===e.id).length>=3*Math.floor(FEATHER.reach),'avisos dos três trajetos');assert.equal(e.pose.anim,'feather_windup');
 advance(w,FEATHER.wind);const shots=feathers(w);assert.equal(shots.length,FEATHER.count);
 assert.equal(new Set(shots.map(s=>s.dx.toFixed(3))).size,3,'leque, não três penas iguais');assert.equal(p.hp,1000,'sem dano antes do impacto');
 advance(w,1);assert.ok(p.hp<1000,'a pena central atinge quem ficou na linha');
});
test('as penas voam retas: sair da linha durante a preparação evita todas',()=>{
 const {w,p}=setup();advance(w,.3);p.x=3;advance(w,2);assert.equal(p.hp,1000);
});
test('morte durante a preparação cancela as penas e os avisos',()=>{
 const {w,p,e}=setup();advance(w,.3);assert.ok(e.volley);dealDamage(w,e,1e9,p);advance(w,1);
 assert.equal(feathers(w).length,0);assert.ok(!e.volley);assert.equal(w.effects.filter(f=>f.enemyWarning===e.id).length,0);assert.equal(p.hp,1000);
});
test('pausa congela a preparação',()=>{
 const {w,e}=setup();advance(w,.3);const t=e.volley.time;w.paused=true;advance(w,1);assert.equal(e.volley.time,t);assert.equal(feathers(w).length,0);
});
test('recarga entre rajadas e distância média mantida',()=>{
 const {w,p,e}=setup();let volleys=0,last=false;
 for(let i=0;i<800;i++){step(w,.01);const now=!!e.volley;if(now&&!last)volleys++;last=now;if(i>300)assert.ok(Math.hypot(e.x-p.x,e.y-p.y)>FEATHER.min&&Math.hypot(e.x-p.x,e.y-p.y)<FEATHER.range+.5,'distância '+Math.hypot(e.x-p.x,e.y-p.y));}
 assert.ok(volleys>=2&&volleys<=4,'rajadas em 8 s: '+volleys);
});
test('longe demais ou colada, a harpia não lança: aproxima ou usa a garra',()=>{
 let {w,e}=setup(-20);advance(w,.3);assert.ok(!e.volley);
 ({w,e}=setup(-1));advance(w,.2);assert.ok(!e.volley);assert.ok(e.strike||w.player.hp<1000);
});
