// Mago, segunda leva (09/11/2026): Muralha de Fogo, Imbuir Fogo/Gelo, Nova de Gelo, Chuva de Fogo, Avalanche,
// Raio Arcano e Clone Arcano. Mundo de treino com alvos parados e aleatoriedade fixa.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../scripts/training-model.mjs';
import {MARKSMAN_ACTIONS,marksmanRanks,actionDamage,cloneCopy,imbueBonus} from '../scripts/marksman-model.mjs';
import {marksmanAction,tickMarksman,marksmanCooldown,stopMarksmanChannel} from '../scripts/marksman.mjs';
import {tickCompanions,companionsOf} from '../scripts/companions.mjs';

const A=MARKSMAN_ACTIONS.mage,I=id=>A.findIndex(d=>d.id===id),D=id=>A[I(id)];
const ALL={fireball:1,combustion:1,firewall:1,imbuirFogo:1,meteor:1,chuvaDeFogo:1,frost:1,icenova:1,imbuirGelo:1,esferaDeGelo:1,golemDeGelo:1,avalanche:1,bolt:1,setasPerseguidoras:1,lazerArcano:1,blink:1,echo:1,escudoArcano:1,clone:1};
function field(ranks=ALL,level=40){
 const w=createWorld({horde:0,character:{classId:'mage',level,equipment:{},marksmanRanks:marksmanRanks('mage',ranks,level)}});
 w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.random=()=>.5;
 w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};w.player.mp=w.player.maxMp;
 return w;
}
function target(w,x,y=0,extra={}){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:10000,maxHp:10000,animation:'idle',animationTime:0,timer:0,...extra};w.actors.push(e);return e;}
function advance(w,dt=1/60,steps=1){for(let i=0;i<steps;i++){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);w.dash.remaining=Math.max(0,w.dash.remaining-dt);tickMarksman(w,dt);tickCompanions(w,dt);}}
const lost=e=>10000-e.hp,power=w=>w.player.spellDamage;
const ready=w=>{w.marksmanCooldowns={};w.player.mp=w.player.maxMp;};

test('árvore: as oito ações novas exigem o selo e estão no fim da tabela',()=>{
 for(const id of ['firewall','imbuirFogo','imbuirGelo','icenova','chuvaDeFogo','avalanche','lazerArcano','clone']){
  assert.ok(I(id)>I('golemDeGelo'),id+' depois das ações antigas');
  const w=field({fireball:1,frost:1,bolt:1,blink:1});assert.equal(marksmanAction(w,I(id)),false,id+' sem o selo');
 }
});

test('Muralha de Fogo: segmento atravessado na mira, aviso antes das chamas, dano e queimadura',()=>{
 const w=field(),d=D('firewall'),on=target(w,8,2.5),off=target(w,8,4.2),line=target(w,6,0);
 assert.ok(marksmanAction(w,I('firewall')));advance(w,1/60,Math.ceil(d.release*60)+1);
 const z=w.marksmanZones.find(z=>z.kind==='wall');assert.ok(z,'muralha criada');assert.ok(Math.abs(z.x-8)<1e-6&&Math.abs(z.ux)<1e-6,'centrada no ponto mirado, atravessada na mira');
 assert.equal(lost(on),0,'nada antes do aviso terminar');
 advance(w,1/60,Math.ceil(d.arm*60)+2);
 const hit=Math.round(actionDamage(d,power(w),w.marksmanRanks));assert.equal(lost(on),hit,'quem toca o segmento recebe 30%');assert.equal(lost(off),0,'fora do segmento');assert.equal(lost(line),0,'atrás da linha de mira, longe do segmento');
 assert.ok(on.burnUntil>w.time,'sai queimando');
 advance(w,1/60,60*6);assert.equal(w.marksmanZones.some(z=>z.kind==='wall'),false,'acaba depois de 5 s');
 advance(w,1/60,60*3);const total=lost(on);advance(w,1/60,60*3);assert.equal(lost(on),total,'queimadura não fica para sempre');
 // +0,5 s por ponto depois do primeiro.
 const w5=field({...ALL,firewall:5});marksmanAction(w5,I('firewall'));advance(w5,1/60,30);const z5=w5.marksmanZones.find(z=>z.kind==='wall');
 assert.ok(Math.abs((z5.until-z5.armAt)-7)<1e-6,'5 pontos: 7 s');
});

test('Imbuir Fogo e Gelo: a Seta Arcana ganha dano e efeito; um encerra o outro',()=>{
 const w=field(),e=target(w,6,0),seta=Math.round(actionDamage(A[0],power(w),w.marksmanRanks));
 assert.ok(marksmanAction(w,I('imbuirFogo')));advance(w,1/60,40);
 assert.equal(w.marksmanImbue.element,'fire');
 marksmanAction(w,0);advance(w,1/60,30);
 assert.equal(lost(e),Math.round(seta*(1+imbueBonus(D('imbuirFogo'),w.marksmanRanks))),'bônus próprio mais sinergia de fogo');assert.ok(e.burnUntil>w.time,'queimando');
 const before=lost(e);advance(w,1/60,140);assert.ok(lost(e)>before,'a queimadura fere depois');
 e.hp=0;e.dead=true;ready(w);assert.ok(marksmanAction(w,I('imbuirGelo')));advance(w,1/60,40);
 assert.equal(w.marksmanImbue.element,'frost','o gelo substitui o fogo');
 const f=target(w,6,0);marksmanAction(w,0);advance(w,1/60,30);
 assert.equal(lost(f),Math.round(seta*(1+imbueBonus(D('imbuirGelo'),w.marksmanRanks))));assert.ok(f.slowTime>0&&f.frostUntil>w.time,'lento e conta para o Estilhaçar');assert.equal(f.burnUntil||0,0);
 f.hp=0;f.dead=true;advance(w,1/60,60*13);const g=target(w,6,0);marksmanAction(w,0);advance(w,1/60,30);assert.equal(lost(g),seta,'acaba em 12 s');
});

test('Nova de Gelo: onda em volta do Mago, lentidão e recarga dividida com a Rajada',()=>{
 const w=field(),front=target(w,3,0),back=target(w,-3,1),far=target(w,6,0),d=D('icenova');
 assert.ok(marksmanAction(w,I('icenova')));advance(w,1/60,40);
 const hit=Math.round(actionDamage(d,power(w),w.marksmanRanks));
 assert.equal(lost(front),hit);assert.equal(lost(back),hit,'atrás também');assert.equal(lost(far),0,'fora do raio 4,5');
 assert.ok(back.frostUntil>w.time&&back.slow===.4);
 assert.ok(marksmanCooldown(w,'frost')>0,'a Rajada entra em recarga junto');assert.equal(marksmanAction(w,I('frost')),false);
 // Usa os pontos da Rajada para o dano.
 assert.ok(actionDamage(d,100,{frost:5})>actionDamage(d,100,{frost:1}));
});

test('Chuva de Fogo: cinco quedas espalhadas, cada uma com dano em raio e chão em chamas; divide a recarga do Meteoro',()=>{
 const w=field(),d=D('chuvaDeFogo');let k=0;const seq=[.1,.2,.9,.4,.5,.75,.3,.95,.6,.05];w.random=()=>seq[k++%seq.length];
 const e=target(w,8,0);
 assert.ok(marksmanAction(w,I('chuvaDeFogo')));advance(w,1/60,Math.ceil(d.release*60)+1);
 const z=w.marksmanZones.find(z=>z.kind==='shower');assert.equal(z.drops.length,5);
 for(const p of z.drops)assert.ok(Math.hypot(p.x-8,p.y)<=d.radius,'dentro da área marcada');
 assert.ok(z.drops.every((p,i)=>i===0||Math.abs(p.at-z.drops[i-1].at-d.gap)<1e-9),'uma a cada 0,3 s');
 assert.ok(marksmanCooldown(w,'meteor')>0,'Meteoro em recarga junto');
 advance(w,1/60,60*3);assert.ok(w.marksmanZones.every(z=>z.kind!=='shower'),'todas caíram');
 assert.ok(lost(e)>0,'o alvo no meio foi atingido');
});

test('Avalanche: 10 bolas em 3 s (+1 por ponto), lentidão que conta para o Estilhaçar',()=>{
 const w=field(),d=D('avalanche'),e=target(w,8,0);w.random=()=>0;
 assert.ok(marksmanAction(w,I('avalanche')));advance(w,1/60,Math.ceil(d.release*60)+1);
 const z=w.marksmanZones.find(z=>z.kind==='shower');assert.equal(z.drops.length,10);assert.ok(Math.abs(z.drops[9].at-z.drops[0].at-2.7)<1e-9);
 advance(w,1/60,60*4);
 const each=Math.round(actionDamage(d,power(w),w.marksmanRanks));assert.equal(lost(e),each*10,'random 0: todas no centro');assert.ok(e.frostUntil>w.time);
 const w5=field({...ALL,avalanche:5});marksmanAction(w5,I('avalanche'));advance(w5,1/60,40);assert.equal(w5.marksmanZones.find(z=>z.kind==='shower').drops.length,14);
});

test('Raio Arcano: canalizado, atravessa a fila, gasta mana por segundo e recarrega ao soltar',()=>{
 const w=field(),d=D('lazerArcano'),a=target(w,4,0),b=target(w,8,0),side=target(w,6,2);
 assert.ok(marksmanAction(w,I('lazerArcano')));const mp0=w.player.mp;
 advance(w,1/60,Math.ceil(d.release*60)+60);
 assert.ok(lost(a)>0&&lost(b)>0,'atravessa');assert.equal(lost(side),0,'só na linha');
 assert.ok(Math.abs(mp0-w.player.mp-d.drain)<1,'12 mana por segundo');
 assert.ok(w.marksmanAction,'continua enquanto segura');
 assert.ok(stopMarksmanChannel(w));assert.equal(w.marksmanAction,null);assert.ok(Math.abs(marksmanCooldown(w,'lazerArcano')-d.cooldown)<1e-6,'recarga começa ao soltar');
 // Tempo máximo: 4 s.
 ready(w);marksmanAction(w,I('lazerArcano'));advance(w,1/60,60*5);assert.equal(w.marksmanAction,null,'encerra sozinho');
 // Sem mana, encerra.
 ready(w);marksmanAction(w,I('lazerArcano'));w.player.mp=3;advance(w,1/60,60);assert.equal(w.marksmanAction,null,'sem mana');
});

test('Clone Arcano: parado no ponto mirado, repete o feitiço com 50% do dano e some em 12 s',()=>{
 const w=field();w.aim={x:4,y:4};
 assert.ok(marksmanAction(w,I('clone')));advance(w,1/60,40);
 const c=companionsOf(w,'arcaneClone')[0];assert.ok(c,'clone criado');assert.ok(Math.hypot(c.x-4,c.y-4)<.6,'no ponto mirado');assert.equal(c.maxHp,Math.round(w.player.maxHp*.5));
 const e=target(w,4,-2);w.aim={x:4,y:-2};ready(w);
 const x=c.x,y=c.y;marksmanAction(w,I('frost'));advance(w,1/60,40);
 const full=Math.round(actionDamage(D('frost'),power(w),w.marksmanRanks)),half=Math.round(actionDamage(D('frost'),power(w)*cloneCopy(D('clone'),w.marksmanRanks),w.marksmanRanks));
 assert.equal(lost(e),full+half,'Mago + clone (50%)');assert.ok(c.x===x&&c.y===y,'o clone não anda');
 assert.ok(w.player.x===0&&w.player.y===0,'o Mago fica onde estava');
 // Não repete o Teleporte.
 ready(w);marksmanAction(w,I('blink'));advance(w,1/60,30);assert.ok(Math.hypot(c.x-x,c.y-y)<1e-9);
 advance(w,1/60,60*13);assert.ok(!companionsOf(w,'arcaneClone').some(a=>a.hp>0),'some depois de 12 s');
 // +10% do dano copiado por ponto depois do primeiro.
 assert.ok(Math.abs(cloneCopy(D('clone'),{clone:5})-.9)<1e-9);assert.equal(cloneCopy(D('clone'),{clone:1}),.5);
});

test('tabela de dano do painel: todas as ações do Mago têm número (ou nota, no Clone)',async()=>{
 const {snapshotFor}=await import('../scripts/progression.mjs');
 const skills=snapshotFor(field()).skills;
 for(const s of skills){if(s.id==='escudoArcano'){assert.equal(s.damage,null);assert.match(s.note,/10%/);continue;}if(s.id==='clone'){assert.equal(s.damage,null);assert.match(s.note,new RegExp(Math.round(cloneCopy(D('clone'),field().marksmanRanks)*100)+'%'));continue;}assert.ok(Number.isFinite(s.damage)&&s.damage>0,s.id+': '+s.damage);}
 assert.match(skills.find(s=>s.id==='imbuirFogo').note,/a mais por Seta/);
});
