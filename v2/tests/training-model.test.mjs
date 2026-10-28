import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,resetWorld,step,cast,setPaused} from '../scripts/training-model.mjs';
const advance=(w,seconds,input)=>{for(let t=0;t<seconds-1e-9;t+=1/60)step(w,Math.min(1/60,seconds-t),input);};
function bossEncounter(){const w=createWorld({horde:0});w.actors=w.actors.filter(a=>a===w.player||a===w.boss);w.boss.x=0;w.boss.y=2;return w;}

test('simulação pura: serializável, sem objetos de renderização; reset limpa efeitos e usa novas identidades',()=>{
 const w=createWorld();cast(w);const ids=w.actors.map(a=>a.id);assert.ok(w.effects.length);resetWorld(w,{horde:32});assert.equal(w.effects.length,0);assert.equal(w.castCooldown,0);assert.ok(w.actors.every(a=>!ids.includes(a.id)));assert.doesNotThrow(()=>JSON.stringify(w));assert.equal(w.actors.filter(a=>a.team==='ally').length,32);
});
test('pausa congela preparação e movimento e impede novas magias',()=>{
 const w=bossEncounter();step(w,.2);setPaused(w,true);const before=JSON.stringify(w);step(w,.25,{x:1});assert.equal(cast(w),false);assert.equal(JSON.stringify(w),before);setPaused(w,false);advance(w,1);assert.ok(w.player.hp<100);
});
test('magia resolve dano uma vez e reiniciar remove o impacto antigo',()=>{
 const w=createWorld({horde:0});const target=w.actors.find(a=>a.model==='zombie');w.actors=[w.player,target];target.x=0;target.y=0;w.aim={x:0,y:0};assert.equal(cast(w),true);assert.equal(cast(w),false);advance(w,.5);assert.equal(w.hits,1);assert.equal(target.hp,25);advance(w,.5);assert.equal(target.hp,25);cast(w);resetWorld(w);advance(w,.5);assert.equal(w.hits,0);
});
test('morte do atacante durante a preparação cancela o golpe pendente',()=>{
 const w=bossEncounter();advance(w,.2);assert.ok(w.effects.some(e=>e.kind==='danger'));w.boss.hp=0;advance(w,1);assert.equal(w.player.hp,100);assert.equal(w.effects.length,0);assert.equal(w.boss.animation,'death');
});
test('aviso travado permite esquiva e mantém o impacto no local original',()=>{
 const w=bossEncounter();advance(w,.2);const e=w.effects[0];w.player.x=8;advance(w,.8);assert.equal(e.x,0);assert.equal(w.player.hp,100);
});
test('subpassos resolvem impacto igualmente em passos diferentes',()=>{
 const a=bossEncounter(),b=bossEncounter();for(let i=0;i<6;i++)step(a,.2);advance(b,1.2);assert.equal(a.player.hp,b.player.hp);assert.ok(a.player.hp<100);assert.equal(a.effects.length,b.effects.length);
});
test('limites, diagonal normalizada, valores inválidos e alvo fora do alcance',()=>{
 const a=createWorld({horde:0}),b=createWorld({horde:0});step(a,.2,{x:1});step(b,.2,{x:1,y:1});assert.ok(Math.abs(Math.hypot(a.player.x,a.player.y-4)-Math.hypot(b.player.x,b.player.y-4))<1e-9);advance(a,8,{x:1});assert.ok(a.player.x<=15&&a.player.y>=-15);assert.throws(()=>resetWorld(a,{horde:Infinity}));const t=a.time;step(a,NaN);assert.equal(a.time,t);a.aim={x:NaN,y:0};assert.equal(cast(a),false);a.aim={x:1000,y:1000};cast(a);assert.ok(Math.hypot(a.effects.at(-1).x-a.player.x,a.effects.at(-1).y-a.player.y)<=10+1e-9);
});
