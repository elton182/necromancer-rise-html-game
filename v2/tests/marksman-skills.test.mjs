import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,normalizeSave} from '../scripts/save-model.mjs';
import {createWorld,step} from '../scripts/training-model.mjs';
import {snapshotFor} from '../scripts/progression.mjs';
import {beginDash} from '../scripts/combat.mjs';
import {MARKSMAN_NODES,MARKSMAN_ACTIONS,marksmanRanks,marksmanBudget,marksmanSpent,canLearnMarksman,marksmanAttributes,actionDamage,actionCooldown,blastRadius,AMBUSH} from '../scripts/marksman-model.mjs';
import {marksmanAction,tickMarksman,clearMarksman,marksmanCooldown,falconCommand,falconCooldown} from '../scripts/marksman.mjs';
import {FALCON,falconDamage} from '../scripts/marksman-model.mjs';
import {stanceSession,createSession} from '../scripts/session.mjs';

const full=classId=>Object.fromEntries(Object.entries(MARKSMAN_NODES[classId]).map(([id,n])=>[id,n.max]));
function field(classId,ranks={},level=20){
 const w=createWorld({horde:0,character:{classId,level,equipment:{},marksmanRanks:marksmanRanks(classId,ranks,level)}});
 w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.random=()=>.5;
 w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};w.player.mp=w.player.maxMp;
 return w;
}
function target(w,x,y=0,extra={}){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:10000,maxHp:10000,animation:'idle',animationTime:0,timer:0,...extra};w.actors.push(e);return e;}
function advance(w,dt=1/60,steps=1){for(let i=0;i<steps;i++){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);w.dash.remaining=Math.max(0,w.dash.remaining-dt);tickMarksman(w,dt);}}
const lost=e=>10000-e.hp;
const act=(w,i)=>{const d=MARKSMAN_ACTIONS[w.classId][i];return {d,dmg:actionDamage(d,w.player.damage,w.marksmanRanks)};};

test('árvores: orçamento por nível, pré-requisitos, nível mínimo e save persistido por classe',()=>{
 for(const id of ['archer','mercenary']){
  const r=marksmanRanks(id,full(id),60),total=Object.values(MARKSMAN_NODES[id]).reduce((a,n)=>a+n.max,0);
  assert.equal(marksmanSpent(id,r),total,'nível 60 cobre a árvore inteira');
  const low=marksmanRanks(id,full(id),2);assert.equal(marksmanSpent(id,low),marksmanBudget(2));
 }
 assert.equal(canLearnMarksman('archer',marksmanRanks('archer',{},6),'rain',6),false,'Chuva requer Perfurante');
 assert.ok(canLearnMarksman('archer',marksmanRanks('archer',{pierce:1},6),'rain',6));
 assert.equal(canLearnMarksman('archer',marksmanRanks('archer',{pierce:1},5),'rain',5),false,'nível 6');
 assert.equal(canLearnMarksman('mercenary',marksmanRanks('mercenary',{},6),'mine',6),false,'Mina requer Bomba');
 const raw=freshSave();raw.character.classId='mercenary';raw.character.level=6;raw.character.marksmanRanks={bomb:1,mine:1,firebomb:1,volley:1,caliber:9};
 const saved=normalizeSave(raw).character.marksmanRanks;
 assert.deepEqual([saved.bomb,saved.mine,saved.firebomb,saved.volley,saved.caliber],[1,1,1,1,5]);
 assert.equal(normalizeSave(freshSave()).character.classId,'necromancer','saves antigos continuam Necromantes');
});

test('passivas: vida, recurso, dano, armadura e movimento; ficha lista as ações aprendidas',()=>{
 const base=marksmanAttributes('archer',10,{},{}),r=marksmanAttributes('archer',10,{},{precision:5,vitality:5,focus:5,swift:5,regeneration:5});
 assert.equal(r.hp,Math.round(base.hp*1.5));assert.equal(r.mp,Math.round(base.mp*1.5));assert.ok(Math.abs(r.damage-base.damage*1.4)<1e-9);
 assert.ok(Math.abs(r.move-base.move*1.15)<1e-9);assert.equal(r.hpRegen,base.hpRegen+2);
 const m=marksmanAttributes('mercenary',10,{},{armor:5,stamina:5,caliber:5});assert.equal(m.defense,20);
 const w=field('archer',{pierce:1});const skills=snapshotFor(w).skills;
 assert.deepEqual(skills.map(s=>[s.id,s.equipped]),[['arrow',true],['pierce',true],['leap',false],['rain',false],['fan',false],['saraivadaSeguidora',false],['impactoCeleste',false],['penasVoadoras',false]]);
});

test('ações bloqueadas sem selo não gastam recurso nem iniciam recarga',()=>{
 const w=field('archer',{}),mp=w.player.mp;
 for(const i of [1,2,4,5])assert.equal(marksmanAction(w,i),false);
 assert.equal(w.player.mp,mp);assert.equal(marksmanCooldown(w,'pierce'),0);
});

test('Flecha Perfurante: carrega, atravessa a fila inteira com dano cheio e mostra a linha antes',()=>{
 const w=field('archer',{pierce:3}),list=[3,5,7,9,11].map(x=>target(w,x)),{d,dmg}=act(w,1);
 assert.ok(marksmanAction(w,1));assert.ok(w.effects.some(e=>e.fx==='dangerLine'),'aviso da linha');
 assert.equal(w.player.mp,w.player.maxMp-d.cost);
 advance(w,1/60,Math.floor(d.release*60)-1);assert.equal(w.marksmanShots.length,0,'ainda carregando');
 advance(w,1/60,80);
 assert.deepEqual(list.map(lost),list.map(()=>dmg));assert.equal(dmg,Math.floor(w.player.damage*2*1.3));
});

test('Recuo: salta 5 u para trás respeitando paredes, desacelera quem estava perto e arma a Emboscada',()=>{
 const w=field('archer',{leap:3,ambush:3}),near=target(w,1.5),far=target(w,6);
 assert.ok(marksmanAction(w,2));advance(w,1/60,40);
 assert.ok(Math.abs(w.player.x+5)<1e-6,'5 u para trás da mira');assert.ok(Math.abs(w.player.y)<1e-9);
 assert.equal(near.slow,.35);assert.ok(near.slowTime>0);assert.equal(far.slow,undefined);
 assert.equal(actionCooldown(MARKSMAN_ACTIONS.archer[2],w.marksmanRanks,0),4.5,'−0,5 s por ponto');
 // Emboscada: o próximo Disparo em até 3 s recebe +15% por ponto, uma vez.
 const e=target(w,0,0);w.actors=w.actors.filter(a=>a===w.player||a===e);Object.assign(e,{x:w.player.x+4,y:0});w.aim={x:w.player.x+8,y:0};
 const base=actionDamage(MARKSMAN_ACTIONS.archer[0],w.player.damage,w.marksmanRanks);
 assert.ok(marksmanAction(w,0));advance(w,1/60,60);assert.equal(lost(e),Math.round(base*(1+3*AMBUSH.perRank)));
 w.marksmanCooldowns={};marksmanAction(w,0);advance(w,1/60,60);assert.equal(lost(e),Math.round(base*(1+3*AMBUSH.perRank))+base,'consumida no primeiro tiro');
 const wall=field('archer',{leap:1});wall.arena.solids=[{kind:'box',x:-2,y:0,width:.6,depth:4}];marksmanAction(wall,2);advance(wall,1/60,40);assert.ok(wall.player.x>-2,'parede detém o salto');
});

test('Chuva de Flechas: área no ponto mirado, cinco ondas depois do aviso, só dentro do raio',()=>{
 const w=field('archer',{pierce:1,rain:1}),inside=target(w,8,1),outside=target(w,8,4.5),{d,dmg}=act(w,4);
 assert.ok(marksmanAction(w,4));advance(w,1/60,Math.ceil((d.release+d.delay)*60)-2);
 assert.equal(lost(inside),0,'antes do fim do aviso não há dano');
 assert.ok(w.effects.some(e=>e.marksmanRing),'área marcada no chão');
 advance(w,1/60,200);assert.equal(lost(inside),dmg*d.waves);assert.equal(lost(outside),0);
 assert.equal(w.marksmanZones.length,0);
});

test('Leque: cinco flechas em cone acertam alvos espalhados à frente',()=>{
 const w=field('archer',{fan:1,shot:1}),{d,dmg}=act(w,5),list=[-.4,-.2,0,.2,.4].map(a=>target(w,Math.cos(a)*5,Math.sin(a)*5));
 assert.ok(marksmanAction(w,5));advance(w,1/60,60);
 assert.equal(list.filter(e=>lost(e)===dmg).length,d.count);
});

test('Rajada: três virotes em sequência, cada um atravessa um inimigo',()=>{
 const w=field('mercenary',{volley:2}),a=target(w,4),b=target(w,6),c=target(w,8),{d,dmg}=act(w,1);
 assert.ok(marksmanAction(w,1));advance(w,1/60,Math.floor(d.release*60)+2);assert.equal(w.marksmanShots.length,1);
 advance(w,1/60,90);
 assert.equal(lost(a),dmg*3);assert.equal(lost(b),Math.round(dmg*d.falloff)*3);assert.equal(lost(c),0);
});

test('Bomba: arco até o ponto mirado, marca de queda durante o voo, explosão em área e empurrão',()=>{
 const w=field('mercenary',{bomb:3,shrapnel:3}),{d,dmg}=act(w,2),hit=target(w,8.5,.5),out=target(w,8,5),r=blastRadius(d,w.marksmanRanks);
 w.aim={x:8,y:0};assert.ok(marksmanAction(w,2));advance(w,1/60,Math.floor(d.release*60)+2);
 assert.equal(w.marksmanLobs.length,1);assert.ok(w.effects.some(e=>e.fx==='lob'),'bomba visível no ar');assert.ok(w.effects.some(e=>e.marksmanRing),'marca de queda');
 assert.equal(lost(hit),0,'nada antes de cair');
 advance(w,1/60,60);assert.equal(lost(hit),dmg);assert.equal(lost(out),0);
 assert.ok(Math.hypot(hit.x-8,hit.y)>Math.hypot(.5,.5),'empurrado para longe do centro');
 assert.ok(Math.abs(r-2.6*1.36)<1e-9);
 // O alcance limita o arremesso: mirando a 20 u a bomba cai a 9 u.
 const w2=field('mercenary',{bomb:1});w2.aim={x:20,y:0};marksmanAction(w2,2);advance(w2,1/60,25);assert.equal(w2.marksmanLobs[0].tx,9);
});

test('Mina: arma em 1 s, explode quando alguém chega perto, no máximo duas e expira',()=>{
 const w=field('mercenary',{bomb:1,mine:1}),{d,dmg}=act(w,4);
 assert.ok(marksmanAction(w,4));advance(w,1/60,40);assert.equal(w.marksmanMines.length,1);
 const m=w.marksmanMines[0],e=target(w,m.x+1,m.y);advance(w,1/60,30);assert.equal(lost(e),0,'desarmada');
 advance(w,1/60,40);assert.equal(lost(e),dmg);assert.equal(w.marksmanMines.length,0);
 for(let k=0;k<3;k++){w.marksmanCooldowns={};w.player.mp=w.player.maxMp;Object.assign(w.player,{x:k*10,y:20});w.actors=[w.player];marksmanAction(w,4);advance(w,1/60,40);}
 assert.equal(w.marksmanMines.length,d.max,'a mais antiga sai');
 advance(w,1,d.life+1);assert.equal(w.marksmanMines.length,0,'expiram');
});

test('Garrafa incendiária: chão em chamas por 4 s com dano em intervalos',()=>{
 const w=field('mercenary',{bomb:1,firebomb:1}),{d,dmg}=act(w,5),e=target(w,8,0,{});
 assert.ok(marksmanAction(w,5));advance(w,1/60,Math.ceil((d.release+d.flight)*60)+2);
 assert.ok(w.effects.some(f=>f.fx==='fireField'));
 advance(w,1/60,Math.ceil(d.fireTime*60)+10);
 assert.equal(lost(e),dmg*(Math.floor(d.fireTime/d.interval)+1));assert.equal(w.marksmanZones.length,0);
});

test('esquiva cancela a ação; morte e troca de cena limpam bombas, zonas e minas',()=>{
 const w=field('mercenary',{bomb:1,mine:1,firebomb:1});
 marksmanAction(w,2);advance(w,1/60,5);assert.ok(beginDash(w,{x:1,y:0}));assert.equal(w.marksmanAction,null);advance(w,1/60,60);assert.equal(w.marksmanLobs.length,0,'cancelada antes do arremesso');
 w.marksmanCooldowns={};w.dash.cooldown=0;marksmanAction(w,4);advance(w,1/60,40);w.marksmanCooldowns={};marksmanAction(w,5);advance(w,1/60,60);
 assert.ok(w.marksmanMines.length&&w.marksmanZones.length);clearMarksman(w);
 assert.deepEqual([w.marksmanMines.length,w.marksmanZones.length,w.marksmanLobs.length,w.effects.filter(f=>f.marksmanRing||f.marksmanFire).length],[0,0,0,0]);
});

test('Falcão: aparece com o selo, mergulha sozinho no inimigo mais próximo e volta à órbita',()=>{
 const none=field('archer',{});advance(none,1/60,5);assert.equal(none.falcon,null);assert.equal(none.actors.some(a=>a.falcon),false);
 const w=field('archer',{falcon:2}),e=target(w,4),far=target(w,12);
 advance(w,1/60,2);const f=w.falcon;assert.ok(f);assert.equal(f.model,'falcon');assert.equal(f.team,'neutral');assert.ok(w.actors.includes(f));
 advance(w,1/60,150);
 assert.equal(lost(e),falconDamage(w.player.damage,w.marksmanRanks)*Math.floor((150/60-1)/FALCON.interval+1));assert.equal(lost(far),0,'fora do alcance de 8 u');
 assert.equal(falconDamage(100,{falcon:2}),Math.floor(100*.35*1.2));
 assert.ok(['orbit','return','dive'].includes(f.state));assert.ok(f.jumpZ>0,'voa acima do chão');
});

test('Falcão: F manda ao alvo da mira, marca por 4 s e as flechas causam +15% no marcado',()=>{
 const w=field('archer',{falcon:1,shot:0}),a=target(w,6,0),b=target(w,6,3);advance(w,1/60,2);
 w.falcon.next=Infinity;w.aim={x:6,y:3.2};const mp=w.player.mp;
 assert.ok(falconCommand(w));assert.equal(w.player.mp,mp-FALCON.command.cost);assert.ok(falconCooldown(w)>7.9);
 assert.equal(falconCommand(w),false,'em recarga');
 advance(w,1/60,90);assert.equal(lost(b),falconDamage(w.player.damage,w.marksmanRanks,true));assert.equal(lost(a),0);assert.ok(b.falconMark>w.time);
 assert.ok(w.effects.some(f=>f.marksmanRing&&String(f.id).startsWith('mmark-')),'marca visível');
 const before=lost(b);w.aim={x:6,y:3};Object.assign(w.player,{x:0,y:3});w.marksmanCooldowns={};marksmanAction(w,0);advance(w,1/60,60);
 const base=actionDamage(MARKSMAN_ACTIONS.archer[0],w.player.damage,w.marksmanRanks);assert.equal(lost(b)-before,Math.round(base*(1+FALCON.mark.bonus)));
 // Sem alvo perto da mira, o comando não gasta foco.
 const w2=field('archer',{falcon:1});advance(w2,1/60,2);w2.aim={x:8,y:8};const m2=w2.player.mp;assert.equal(falconCommand(w2),false);assert.equal(w2.player.mp,m2);
});

test('Falcão: F pela sessão; morte e troca de cena removem o falcão; volta ao continuar',()=>{
 const raw=freshSave();raw.character.classId='archer';raw.character.level=4;raw.character.marksmanRanks={falcon:1};
 const s=createSession(raw);s.world=field('archer',{falcon:1});s.scene='training';advance(s.world,1/60,2);
 target(s.world,3,0);s.world.aim={x:3,y:0};assert.ok(stanceSession(s));
 clearMarksman(s.world);assert.equal(s.world.falcon,null);assert.equal(s.world.actors.some(a=>a.falcon),false);
 advance(s.world,1/60,2);assert.ok(s.world.falcon,'reaparece com o selo');
 assert.equal(normalizeSave(raw).character.marksmanRanks.falcon,1);
});

test('atirar andando: fator de movimento por ação; Recuo e Mina travam e usam o corpo inteiro',()=>{
 const expect={archer:{arrow:.85,pierce:.5,leap:0,rain:.6,fan:.75},mercenary:{quarrel:.7,volley:.7,bomb:.8,mine:0,firebomb:.8}};
 for(const [classId,list] of Object.entries(expect))for(const [id,move] of Object.entries(list))assert.equal(MARKSMAN_ACTIONS[classId].find(a=>a.id===id).move,move,id);
 const w=field('mercenary',{bomb:1,mine:1});w.player.moveSpeed=6;
 assert.ok(marksmanAction(w,4));const x=w.player.x,y=w.player.y;
 step(w,.1,{x:1,y:0});assert.deepEqual([w.player.x,w.player.y],[x,y],'parado ao assentar a mina');assert.equal(w.player.pose.upper,false);
 const a=field('archer',{pierce:1});a.player.moveSpeed=6;assert.ok(marksmanAction(a,1));const ax=a.player.x,ay=a.player.y;step(a,.1,{x:0,y:1});
 assert.ok(Math.abs(Math.hypot(a.player.x-ax,a.player.y-ay)-.6*.5)<1e-6,'Perfurante: metade da velocidade');
});

test('tolerância do tiro: inimigo a até `hit` da linha é atingido, como no Tiro de Osso; além disso, não',()=>{
 for(const [classId,i] of [['archer',0],['mercenary',0]]){
  const def=MARKSMAN_ACTIONS[classId][i],w=field(classId,{}),near=target(w,6,def.hit-.05),far=target(w,6,-(def.hit+.15));
  assert.ok(def.hit>=.9,'perto do Tiro de Osso (1,1)');
  marksmanAction(w,0);advance(w,1/60,80);assert.ok(lost(near)>0,classId+' acerta de raspão');assert.equal(lost(far),0);
 }
 const w=field('archer',{}),big=target(w,6,1.1,{radius:.6});marksmanAction(w,0);advance(w,1/60,80);assert.ok(lost(big)>0,'alvos grandes somam o raio extra');
});
