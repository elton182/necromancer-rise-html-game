import test from 'node:test';
import assert from 'node:assert/strict';
import {gaitTarget,blendGait,advanceGaitPhase} from '../scripts/locomotion.mjs';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,a+' ≠ '+b);
// Com mira em +Y a frente é +Y e a esquerda do modelo é +X.
test('direção do passo em relação à mira escolhe o clipe',()=>{
 let g=gaitTarget(0,1,0);near(g.walk,1);near(g.left,0);near(g.right,0);assert.equal(g.reverse,false);
 g=gaitTarget(1,0,0);near(g.walk,0);near(g.left,1);near(g.right,0);assert.equal(g.reverse,false);
 g=gaitTarget(-1,0,0);near(g.walk,0);near(g.left,0);near(g.right,1);assert.equal(g.reverse,false);
 g=gaitTarget(0,-1,0);near(g.walk,1);assert.equal(g.reverse,true);
});
test('a mira gira junto a referência do passo',()=>{
 // Olhando para +X, a esquerda do modelo é -Y.
 let g=gaitTarget(0,-1,Math.PI/2);near(g.left,1);
 g=gaitTarget(1,0,Math.PI/2);near(g.walk,1);assert.equal(g.reverse,false);
});
test('diagonais dividem o peso e somam 1',()=>{
 const g=gaitTarget(1,1,0);near(g.walk,.5);near(g.left,.5);near(g.walk+g.left+g.right,1);
 for(let a=0;a<6.3;a+=.37){const q=gaitTarget(Math.cos(a),Math.sin(a),1.1);near(q.walk+q.left+q.right,1);}
});
test('de ré o lado inverte o clipe, porque o ciclo toca ao contrário',()=>{
 const g=gaitTarget(1,-1,0);assert.equal(g.reverse,true);near(g.walk,.5);near(g.left,0);near(g.right,.5);
 const h=gaitTarget(-1,-1,0);assert.equal(h.reverse,true);near(h.left,.5);near(h.right,0);
});
test('histerese evita alternar o sentido perto da perpendicular',()=>{
 const at=f=>[Math.sqrt(1-f*f),f];
 assert.equal(gaitTarget(...at(-.1),0,false).reverse,false);
 assert.equal(gaitTarget(...at(-.3),0,false).reverse,true);
 assert.equal(gaitTarget(...at(-.1),0,true).reverse,true);
 assert.equal(gaitTarget(...at(.01),0,true).reverse,false);
});
test('parado mantém o sentido e o peso de andar',()=>{
 const g=gaitTarget(0,0,1,true);near(g.walk,1);assert.equal(g.reverse,true);
});
test('a mistura converge, conserva a soma e congela sem tempo',()=>{
 const from={walk:1,left:0,right:0,reverse:false},to=gaitTarget(1,0,0);
 assert.deepEqual(blendGait(from,to,0),{...from,reverse:false});
 const half=blendGait(from,to,.05);assert.ok(half.walk>0&&half.walk<1);near(half.walk+half.left+half.right,1);
 let g=from;for(let i=0;i<120;i++)g=blendGait(g,to,1/60);assert.ok(g.walk<1e-3&&g.left>.999);
});
test('a fase avança pela passada de cada clipe e recua de ré',()=>{
 const walk={walk:1,left:0,right:0,reverse:false},side={walk:0,left:1,right:0,reverse:false};
 near(advanceGaitPhase(0,.75,walk,1.5,1),.5);near(advanceGaitPhase(0,.25,side,1.5,1),.25);
 near(advanceGaitPhase(.1,.3,{...walk,reverse:true},1.5,1),.9);
 near(advanceGaitPhase(.5,1.5,walk,1.5),.5);
});
