// Habilidades novas da Arqueira (Tiro Seguidor, Saraivada Seguidora, Impacto Celeste, Penas Voadoras) e do
// Mercenário (Rede de Caça, Armadilha de Urso). Regras em docs/habilidades/arvores.json e marksman-model.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../scripts/training-model.mjs';
import {MARKSMAN_ACTIONS,marksmanRanks,actionDamage} from '../scripts/marksman-model.mjs';
import {marksmanAction,tickMarksman,clearMarksman,falconCommand} from '../scripts/marksman.mjs';

function field(classId,ranks={},level=20){
 const w=createWorld({horde:0,character:{classId,level,equipment:{},marksmanRanks:marksmanRanks(classId,ranks,level)}});
 w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.random=()=>.5;
 w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};w.player.mp=w.player.maxMp;
 return w;
}
function target(w,x,y=0,extra={}){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:10000,maxHp:10000,animation:'idle',animationTime:0,timer:0,...extra};w.actors.push(e);return e;}
function advance(w,dt=1/60,steps=1){for(let i=0;i<steps;i++){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);w.dash.remaining=Math.max(0,w.dash.remaining-dt);tickMarksman(w,dt);}}
const lost=e=>10000-e.hp;
const index=(classId,id)=>MARKSMAN_ACTIONS[classId].findIndex(a=>a.id===id);
const def=(classId,id)=>MARKSMAN_ACTIONS[classId][index(classId,id)];
// O falcão nasce no primeiro tick; os testes desligam os mergulhos automáticos para medir só a habilidade.
function quietFalcon(w){advance(w,1/60);assert.ok(w.falcon,'falcão presente');w.falcon.next=Infinity;}

test('ações novas entram no fim da lista e cada uma depende do seu selo',()=>{
 assert.deepEqual(MARKSMAN_ACTIONS.archer.map(a=>a.id),['arrow','pierce','leap','dodge','rain','fan','saraivadaSeguidora','impactoCeleste','penasVoadoras','fechadefogo','flechaExplosiva','disparoPreciso','rasanteRelampago','saraivadaMultipla','chuvaDeFlechasExplosivas']);
 assert.deepEqual(MARKSMAN_ACTIONS.mercenary.map(a=>a.id),['quarrel','volley','bomb','dodge','mine','firebomb','redeDeCaca','armadilhaDeUrso']);
 assert.equal(def('archer','fan').name,'Tiro Seguidor');assert.equal(def('mercenary','firebomb').name,'Molotov');
 const w=field('archer',{shot:1});assert.equal(marksmanAction(w,index('archer','saraivadaSeguidora')),false,'sem o selo');
});

test('Tiro Seguidor: as flechas curvam até um alvo fora do cone e ignoram quem está atrás',()=>{
 const w=field('archer',{shot:1,fan:1}),side=target(w,5,4),behind=target(w,-5,0),d=def('archer','fan');
 assert.ok(marksmanAction(w,index('archer','fan')));advance(w,1/60,90);
 const dmg=actionDamage(d,w.player.damage,w.marksmanRanks);
 assert.ok(lost(side)>=dmg,'ao menos uma flecha curvou até o alvo a 39° da mira');assert.equal(lost(side)%dmg,0);
 assert.equal(lost(behind),0);
 // Sem a curva, nenhuma das cinco flechas (até 25°) passaria perto desse alvo.
 const straight=field('archer',{shot:1,fan:1}),control=target(straight,5,4);const saved=d.homing;
 try{d.homing=null;marksmanAction(straight,index('archer','fan'));advance(straight,1/60,90);}finally{d.homing=saved;}
 assert.equal(lost(control),0);
});

test('Saraivada Seguidora trava no inimigo perto da mira e as cinco flechas o perseguem',()=>{
 const w=field('archer',{shot:1,fan:1,saraivadaSeguidora:1}),a=target(w,8,3),b=target(w,6,-3.8),d=def('archer','saraivadaSeguidora');
 assert.ok(marksmanAction(w,index('archer','saraivadaSeguidora')));assert.equal(w.marksmanAction.lock,a.id);
 advance(w,1/60,Math.ceil(d.release*60)+1);assert.ok(w.effects.some(f=>String(f.id).startsWith('mlock-')),'anel no alvo travado');
 advance(w,1/60,120);
 assert.equal(lost(a),5*actionDamage(d,w.player.damage,w.marksmanRanks));assert.equal(lost(b),0);
 // Alvo morto no meio da rajada: as flechas restantes buscam o mais próximo.
 const v=field('archer',{shot:1,fan:1,saraivadaSeguidora:1}),first=target(v,8,.5,{hp:1,maxHp:1}),next=target(v,9.5,1);
 assert.ok(marksmanAction(v,index('archer','saraivadaSeguidora')));advance(v,1/60,150);
 assert.ok(first.hp<=0);assert.ok(lost(next)>0);
});

test('Impacto Celeste marca a área, o falcão desce e o dano vem depois do atraso, com empurrão',()=>{
 const w=field('archer',{falcon:1,impactoCeleste:1});quietFalcon(w);w.aim={x:10,y:0};
 const center=target(w,10,0),out=target(w,10,5.6),d=def('archer','impactoCeleste');
 assert.ok(marksmanAction(w,index('archer','impactoCeleste')));
 advance(w,1/60,Math.ceil(d.release*60)+1);
 assert.equal(w.falcon.state,'strike');assert.ok(w.effects.some(f=>String(f.id).startsWith('mstrike-')),'anel de aviso');
 assert.equal(falconCommand(w,{x:10,y:0}),false,'falcão ocupado');
 advance(w,1/60,Math.floor(d.delay*60)-3);assert.equal(lost(center),0,'ainda no ar');
 advance(w,1/60,10);
 assert.equal(lost(center),actionDamage(d,w.player.damage,w.marksmanRanks));assert.equal(lost(out),0);
 assert.ok(center.x>10.5,'empurrado a partir do centro');assert.equal(w.falcon.state,'return');
 assert.equal(w.marksmanZones.length,0);
});

test('Penas Voadoras: uma pena por inimigo perto da Arqueira, saindo do falcão',()=>{
 const w=field('archer',{falcon:1,penasVoadoras:1});quietFalcon(w);
 const near=[target(w,3,3),target(w,-4,1),target(w,0,-5)],far=target(w,-13,0),d=def('archer','penasVoadoras');
 assert.equal(marksmanAction(w,index('archer','penasVoadoras')),false);const mp=w.player.mp;advance(w,1/60);assert.equal(w.player.mp,mp);
 assert.equal(w.marksmanShots.length,d.count);
 advance(w,1/60,60);
 const dmg=actionDamage(d,w.player.damage,w.marksmanRanks);
 for(const e of near)assert.equal(lost(e),dmg);assert.equal(lost(far),0);
});

test('Rede de Caça deixa lentos por 3 s (+0,5 s por ponto) e só fere os chefes',()=>{
 const w=field('mercenary',{redeDeCaca:1});w.aim={x:6,y:0};
 const inside=target(w,6,0),boss=target(w,6,1,{isBoss:true}),out=target(w,6,3.5),d=def('mercenary','redeDeCaca');
 assert.ok(marksmanAction(w,index('mercenary','redeDeCaca')));advance(w,1/60,Math.ceil((d.release+d.flight)*60)+2);
 const dmg=actionDamage(d,w.player.damage,w.marksmanRanks);
 assert.equal(lost(inside),dmg);assert.equal(inside.slow,d.slow);assert.equal(inside.slowTime,d.slowTime);
 assert.equal(lost(boss),dmg);assert.ok(!boss.slow,'chefe não fica lento');assert.equal(lost(out),0);
 assert.ok(w.effects.some(f=>String(f.id)==='mnet-'+inside.id),'anel em quem está na rede');
 const v=field('mercenary',{redeDeCaca:3});v.aim={x:6,y:0};const e=target(v,6,0);
 marksmanAction(v,index('mercenary','redeDeCaca'));advance(v,1/60,60);assert.equal(e.slowTime,d.slowTime+2*d.slowPerRank);
});

test('Armadilha de Urso arma depois de um instante, prende quem pisa e no máximo duas ficam no chão',()=>{
 const w=field('mercenary',{redeDeCaca:1,armadilhaDeUrso:1}),d=def('mercenary','armadilhaDeUrso'),slot=index('mercenary','armadilhaDeUrso');
 assert.ok(marksmanAction(w,slot));advance(w,1/60,Math.ceil(d.release*60)+1);
 assert.equal(w.marksmanTraps.length,1);const trap=w.marksmanTraps[0],prey=target(w,trap.x,trap.y+.5);
 advance(w,1/60,Math.floor(d.arm*60)-3);assert.equal(lost(prey),0,'ainda armando');
 advance(w,1/60,6);
 assert.equal(lost(prey),actionDamage(d,w.player.damage,w.marksmanRanks));assert.equal(prey.slow,1);assert.equal(prey.slowTime,d.root);
 assert.equal(w.marksmanTraps.length,0,'a armadilha fecha uma vez');
 const b=field('mercenary',{redeDeCaca:1,armadilhaDeUrso:1});marksmanAction(b,slot);advance(b,1/60,60);
 const boss=target(b,b.marksmanTraps[0].x,b.marksmanTraps[0].y,{isBoss:true});advance(b,1/60,2);assert.equal(boss.slow,d.bossSlow,'chefe só fica lento');
 const m=field('mercenary',{redeDeCaca:1,armadilhaDeUrso:1});
 for(let i=0;i<3;i++){m.marksmanCooldowns={};m.player.x=i*3;assert.ok(marksmanAction(m,slot));advance(m,1/60,40);}
 assert.equal(m.marksmanTraps.length,d.max,'a mais antiga sai');
 clearMarksman(m);assert.equal(m.marksmanTraps.length,0);
 assert.ok(!m.effects.some(f=>f.marksmanRing));
});
