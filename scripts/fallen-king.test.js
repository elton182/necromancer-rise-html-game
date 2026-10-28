'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('./fallen-king-model.js');
function scene(x=2){
 const events={cone:[],area:[],summon:[],enrage:0},e={x:0,y:0,hp:600,maxHp:600,dmg:20},target={x,y:0};let adds=0;
 const io={target:()=>target,bound:(x,y)=>({x,y}),adds:()=>adds,enrage:()=>events.enrage++,
  cone:(...v)=>events.cone.push(v),area:(...v)=>events.area.push(v),summon:(points)=>{events.summon.push(points);adds+=points.length;}};
 M.reset(e);e.kingGap=0;e.kingCd={slash:0,leap:0,summon:0};
 return {e,io,events,target,setAdds:n=>{adds=n;}};
}
test('corte trava a direção, só acerta no contato e uma única vez',()=>{
 const {e,io,events,target}=scene(2);M.update(e,.01,io);
 assert.equal(e.king.kind,'slash');target.y=5;
 M.update(e,.79,io);assert.equal(events.cone.length,0);
 M.update(e,.09,io);assert.equal(events.cone.length,0);
 M.update(e,.02,io);assert.equal(events.cone.length,1);
 assert.deepEqual(events.cone[0].slice(0,7),[0,0,1,0,2.8,Math.PI*2/3,30]);
 M.update(e,.8,io);assert.equal(events.cone.length,1);assert.equal(e.king,null);
 assert.equal(e.kingCd.slash,4.5);assert.equal(e.kingGap,M.GAP);
});
test('salto marca o ponto, voa até ele e causa o impacto ao pousar',()=>{
 const {e,io,events,target}=scene(5);e.kingCd.slash=9;M.update(e,.01,io);
 assert.equal(e.king.kind,'leap');assert.equal(e.king.tx,5);target.x=-5;
 M.update(e,1,io);assert.equal(e.x,0);
 M.update(e,.275,io);assert.ok(e.x>2&&e.x<3&&e.jumpZ>1);assert.equal(events.area.length,0);
 M.update(e,.275,io);assert.equal(events.area.length,1);assert.deepEqual(events.area[0].slice(0,4),[5,0,2.6,40]);
 assert.equal(e.x,5);assert.equal(e.jumpZ,0);
 M.update(e,.99,io);assert.ok(e.king);M.update(e,.02,io);assert.equal(e.king,null);
});
test('salto limita o alcance e um quadro longo não pula a preparação nem repete o impacto',()=>{
 const {e,io,events}=scene(8.5);e.kingCd.slash=9;M.update(e,.01,io);
 assert.equal(e.king.tx,7);M.update(e,10,io);
 assert.equal(events.area.length,1);assert.equal(e.king,null);assert.equal(e.x,7);
});
test('conjuração só começa abaixo de 50%, uma vez por fase, e respeita o limite de aliados',()=>{
 const s=scene(2),{e,io,events}=s;M.update(e,.01,io);assert.equal(e.king.kind,'slash');
 M.update(e,2,io);e.hp=300;e.kingGap=0;e.kingCd.summon=0;M.update(e,.01,io);
 assert.equal(events.enrage,1);assert.equal(e.king.kind,'summon');assert.equal(e.king.points.length,2);
 M.update(e,1.2,io);assert.equal(events.summon.length,1);
 M.update(e,1,io);assert.ok(Math.abs(e.kingCd.summon-14*.8)<1e-9);
 e.kingGap=0;e.kingCd.summon=0;s.setAdds(4);M.update(e,.01,io);assert.notEqual(e.king?.kind,'summon');
 assert.equal(events.enrage,1);
});
test('chefe morto não executa golpe armado e reset limpa salto e recargas',()=>{
 const {e,io,events}=scene(5);e.kingCd.slash=9;M.update(e,.01,io);M.update(e,1.2,io);
 assert.ok(e.jumpZ>0);e.dead=true;M.update(e,5,io);assert.equal(events.area.length,0);
 M.reset(e);assert.equal(e.king,null);assert.equal(e.jumpZ,0);assert.equal(e.kingPhase2,false);
});
test('pose acompanha a fase real e coloca o contato no quadro de impacto',()=>{
 const {e,io}=scene(2);M.update(e,.01,io);assert.equal(M.pose(e).anim,'windup');
 M.update(e,.8,io);M.update(e,.093,io);const contact=M.pose(e);
 assert.equal(contact.anim,'attack');assert.ok(Math.abs(contact.progress-4/13)<1e-6);
 assert.equal(M.hazards(e).length,0);
 const leap=scene(5);leap.e.kingCd.slash=9;M.update(leap.e,.01,leap.io);
 assert.equal(M.pose(leap.e).anim,'slam_windup');assert.deepEqual(M.hazards(leap.e).map(h=>[h.x,h.y]),[[5,0]]);
 M.update(leap.e,1.2,leap.io);assert.equal(M.pose(leap.e).anim,'slam');
});
test('fora de alcance ou sem alvo ele apenas persegue',()=>{
 const {e,io}=scene(12);assert.equal(M.update(e,.01,io),false);
 const none=scene(2);none.io.target=()=>null;assert.equal(M.update(none.e,.01,none.io),false);
});
