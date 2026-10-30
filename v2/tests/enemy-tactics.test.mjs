import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,step,dealDamage} from '../scripts/training-model.mjs';
import {spawnEnemy,R} from '../scripts/enemies.mjs';
import {roleOf,plan,ROLES,TUNING} from '../scripts/enemy-tactics.mjs';
// Jogador parado e quase imortal no centro de uma arena aberta; os inimigos entram pelo norte (y negativo).
function arena(list){
 const w=createWorld({horde:0}),p=w.player;w.actors=[p];w.arena={bounds:{minX:-30,maxX:30,minY:-30,maxY:30},solids:[]};
 Object.assign(p,{x:0,y:0,hp:1e7,maxHp:1e7,hpRegen:0});
 return {w,p,es:list.map(([i,x,y])=>spawnEnemy(w,i,x,y,{wave:1}))};
}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),ang=(c,a)=>Math.atan2(a.y-c.y,a.x-c.x);
const wrap=a=>{a=(a+Math.PI)%(Math.PI*2);if(a<0)a+=Math.PI*2;return a-Math.PI;};
function run(w,seconds,each){for(let i=0;i<Math.round(seconds/.05);i++){step(w,.05);each?.(i*.05);}}

test('papéis cobrem todos os tipos e preservam os índices',()=>{
 assert.deepEqual(Object.keys(ROLES).map(Number).sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8,9,10]);
 assert.equal(roleOf(0),'front');assert.equal(roleOf(10),'front');assert.equal(roleOf(6),'flank');assert.equal(roleOf(1),'ranged');assert.equal(roleOf(9),'ranged');
});
test('frente: poucos atacam ao mesmo tempo e o resto espera na roda',()=>{
 const {w,p,es}=arena([[0,-6,-9],[0,-2,-10],[0,2,-10],[0,6,-9],[0,0,-12],[0,-4,-12],[0,4,-12]]);
 let peak=0;run(w,10,t=>{if(t>5)peak=Math.max(peak,es.filter(e=>dist(e,p)<=2.4).length);});
 assert.ok(peak<=TUNING.meleeSlots.player,'engajados '+peak);
 const near=es.filter(e=>dist(e,p)<=2.4),wait=es.filter(e=>dist(e,p)>2.4);
 assert.equal(near.length,TUNING.meleeSlots.player);assert.ok(wait.every(e=>dist(e,p)>3&&dist(e,p)<6),'quem espera fica na roda');
 assert.ok(p.hp<1e7,'quem engaja ataca');
});
test('frente: a vaga de quem morre é ocupada por quem esperava',()=>{
 const {w,p,es}=arena([[0,-3,-7],[0,0,-8],[0,3,-7],[0,-2,-10],[0,2,-10]]);
 run(w,6,null);const engaged=es.filter(e=>dist(e,p)<=2.4);assert.equal(engaged.length,3);
 dealDamage(w,engaged[0],1e9,p);run(w,4,null);
 assert.equal(es.filter(e=>e.hp>0&&dist(e,p)<=2.4).length,3);
});
test('ladinos contornam e atacam por trás da linha de frente',()=>{
 const {w,p,es}=arena([[0,-3,-9],[0,0,-10],[0,3,-9],[6,-5,-11],[6,5,-11]]);
 const rogues=es.slice(3),first={};
 run(w,12,()=>{for(const r of rogues)if(!first[r.id]&&dist(r,p)<=1.9)first[r.id]=ang(p,r);});
 assert.equal(Object.keys(first).length,2,'os dois ladinos chegam ao alvo');
 for(const a of Object.values(first))assert.ok(Math.abs(wrap(a-ang(p,{x:0,y:-10})))>1.9,'chegou por trás, não pela frente: '+a);
 assert.ok(p.hp<1e7);
});
test('ladino já colado no alvo não perde tempo contornando',()=>{
 const {w,p}=arena([[6,0,-1.4]]);run(w,.6,null);assert.ok(p.hp<1e7);
});
test('atiradores se espalham em leque, mantêm distância e atiram',()=>{
 const {w,p,es}=arena([[0,0,-9],[1,-2,-13],[1,2,-13],[3,0,-15]]);
 let shots=0;run(w,10,()=>{shots=Math.max(shots,w.hostileShots.length);});
 const shooters=es.slice(1);
 for(const s of shooters){const range=R.ranged[s.type.rules||s.type.name];assert.ok(dist(s,p)<=range+.3&&dist(s,p)>=range*TUNING.minRatio,s.type.name+' em '+dist(s,p).toFixed(1));}
 const angles=shooters.map(s=>ang(p,s));
 for(let i=0;i<angles.length;i++)for(let j=i+1;j<angles.length;j++)assert.ok(Math.abs(wrap(angles[i]-angles[j]))>.35,'atiradores muito juntos');
 assert.ok(shots>0&&p.hp<1e7,'atiradores atiram');
});
test('atirador pressionado recua e continua atirando',()=>{
 const {w,p,es:[a]}=arena([[1,0,-1.5]]);
 run(w,2,null);assert.ok(dist(a,p)>3,'recuou até '+dist(a,p).toFixed(1));run(w,3,null);assert.ok(p.hp<1e7||w.hostileShots.length>0);
});
test('pausa congela a tática e o estado não vai para o save',()=>{
 const {w,es:[e]}=arena([[0,0,-9]]);run(w,1,null);const {x,y}=e;w.paused=true;run(w,1,null);assert.equal(e.x,x);assert.equal(e.y,y);
 assert.ok(e.tac&&!JSON.stringify(Object.keys(e.type)).includes('tac'));
});
test('plan: atirador pronto em posição fica parado; sem alvo no alcance avança',()=>{
 const t={id:1,team:'player',x:0,y:0},e={id:2,typeIndex:1,x:0,y:-6.3};
 const hold=plan(e,t,[e],{range:7.5,shoot:7.5,ready:true,lineOk:true,dt:.016});assert.equal(hold.goal,null);
 const far=plan({...e,tac:null,y:-12},t,[e],{range:7.5,shoot:7.5,ready:true,lineOk:true,dt:.016});assert.equal(far.mode,'advance');
 const blocked=plan({...e,tac:null},t,[e],{range:7.5,shoot:7.5,ready:true,lineOk:false,dt:.016});assert.equal(blocked.mode,'advance');
});
