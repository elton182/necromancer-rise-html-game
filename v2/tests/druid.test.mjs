import {schoolSynergy} from '../scripts/skill-synergy.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,normalizeSave,createSaveStore} from '../scripts/save-model.mjs';
import {createSession,transition,activateSlot,stanceSession,castSession} from '../scripts/session.mjs';
import {createWorld} from '../scripts/training-model.mjs';
import {snapshotFor} from '../scripts/progression.mjs';
import {dealDamage,beginDash,moveDash} from '../scripts/combat.mjs';
import {druidRanks,canLearnDruid,druidBudget,druidSpent,WOLF,DRUID_NODES,FRANTIC,franticStacks,franticSpeed} from '../scripts/druid-model.mjs';
import {druidAction,tickDruid,toggleWolf,HUMAN_ACTIONS,WOLF_ACTIONS} from '../scripts/druid.mjs';

class MapStorage{values=new Map();getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,v);}removeItem(k){this.values.delete(k);}}
const ALL={spark:5,chain:3,storm:1,roots:3,thornbind:3,rejuvenate:1,wolf:3,leap:1,wildHeart:0,howl:1};
function field(ranks=ALL,level=20){
 const w=createWorld({horde:0,character:{classId:'druid',level,druidRanks:ranks,equipment:{}}});
 w.actors=[w.player];Object.assign(w.player,{x:0,y:0});w.aim={x:8,y:0};w.random=()=>.5;
 w.arena={bounds:{minX:-30,maxX:30,minY:-30,maxY:30},solids:[]};w.player.mp=w.player.maxMp;
 return w;
}
function target(w,x,y=0,extra={}){const e={id:w.nextId++,team:'enemy',dummy:true,x,y,radius:.3,hp:10000,maxHp:10000,animation:'idle',animationTime:0,timer:0,...extra};w.actors.push(e);return e;}
// Avança só o relógio e as regras da Druida, sem a IA dos alvos.
function advance(w,dt,steps=1){for(let i=0;i<steps;i++){w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);tickDruid(w,dt);}}
const finish=(w)=>advance(w,1/60,90);

test('Druida é uma classe válida, com árvore própria persistida e saves antigos intactos',()=>{
 const store=createSaveStore(new MapStorage()),created=store.createCharacter('Flora','druid');
 assert.ok(created.ok);assert.equal(created.save.character.classId,'druid');assert.deepEqual(Object.keys(created.save.character.druidRanks),Object.keys(DRUID_NODES));
 assert.equal(store.createCharacter('X','bardo').ok,false);
 const raw=freshSave();raw.character.classId='druid';raw.character.level=4;raw.character.druidRanks={spark:5,chain:3,storm:1,roots:3,wolf:3};
 const saved=normalizeSave(raw).character.druidRanks;
 assert.equal(druidSpent(saved),druidBudget(4));assert.equal(saved.storm,0,'Tempestade exige nível 6');
 assert.equal(normalizeSave(freshSave()).character.classId,'necromancer');
});
test('orçamento, nível e pré-requisitos da árvore',()=>{
 const r=druidRanks({},6);assert.equal(canLearnDruid(r,'storm',6),false,'requer Corrente');
 r.chain=1;assert.ok(canLearnDruid(r,'storm',6));assert.equal(canLearnDruid(r,'storm',5),false);
 assert.equal(canLearnDruid({...r,leap:0},'leap',8),false,'Salto requer Forma de Lobo');
 const full=druidRanks(Object.fromEntries(Object.entries(DRUID_NODES).map(([id,n])=>[id,n.max])),60);
 assert.equal(druidSpent(full),Object.values(DRUID_NODES).reduce((a,n)=>a+n.max,0));
});
test('atributos mágicos sem horda; passivas e itens do catálogo do Necromante',()=>{
 const base=snapshotFor({classId:'druid',level:10,druidRanks:{}},{},10).attributes,necro=snapshotFor({classId:'necromancer',level:10,army:{profile:{level:10,ranks:{}},loadout:[],mastery:{}}},{},10).attributes;
 assert.equal(base.hp,Math.round(necro.hp*1.1));assert.equal(base.spell,necro.spell);assert.equal(base.hordeDps,0);assert.ok(base.move>necro.move);
 const strong=snapshotFor({classId:'druid',level:10,druidRanks:{vitality:5,attunement:5,wisdom:5}},{},10).attributes;
 assert.equal(strong.hp,Math.round(necro.hp*1.1*1.5));assert.ok(Math.abs(strong.spell-necro.spell*1.4)<1e-9);assert.equal(strong.mp,Math.round(necro.mp*1.5));
});
test('mundo da Druida: modelo próprio e nenhum aliado da horda',()=>{
 const w=createWorld({horde:6,armyMode:'groups',army:freshSave().horde,character:{classId:'druid',level:3,druidRanks:{},equipment:{}}});
 assert.equal(w.player.model,'druid');assert.equal(w.actors.filter(a=>a.team==='ally').length,0);assert.equal(w.druidForm,'human');
});
test('Faísca atinge só o primeiro inimigo na linha, sem custo, e respeita a recarga',()=>{
 const w=field(),near=target(w,4),far=target(w,7),mp=w.player.mp;
 assert.ok(druidAction(w,0,{x:10,y:0}));assert.equal(druidAction(w,0,{x:10,y:0}),false,'uma ação por vez');
 finish(w);assert.ok(near.hp<10000);assert.equal(far.hp,10000);assert.equal(w.player.mp,mp);
 const expected=Math.floor(w.player.spellDamage*HUMAN_ACTIONS[0].multiplier*(1+5*.06+schoolSynergy('druid',w.druidRanks,'spark')));assert.equal(10000-near.hp,expected);
 const side=field(),off=target(side,5,2);druidAction(side,0,{x:10,y:0});finish(side);assert.equal(off.hp,10000,'fora da linha');
});
test('Corrente salta para inimigos próximos, um salto extra por ponto, com perda por salto',()=>{
 const w=field({...ALL,chain:1}),list=[target(w,5),target(w,7),target(w,9),target(w,11)];
 assert.ok(druidAction(w,1,{x:5,y:0}));finish(w);
 const hit=list.filter(e=>e.hp<10000);assert.equal(hit.length,3,'primeiro alvo + 2 saltos');
 assert.ok(10000-list[0].hp>10000-list[1].hp);assert.equal(list[3].hp,10000);
 const locked=field({spark:1});target(locked,5);assert.equal(druidAction(locked,1,{x:5,y:0}),false,'precisa do nó');
});
test('Raízes prendem no lugar, poupam chefes e a Casca de Espinhos aumenta o dano recebido',()=>{
 const w=field(),a=target(w,6),boss=target(w,6.5,0,{isBoss:true}),out=target(w,12);
 assert.ok(druidAction(w,2,{x:6,y:0}));finish(w);
 assert.ok(a.druidRoot>w.time);assert.equal(a.slow,1);assert.ok(a.slowTime>2);assert.ok(a.hp<10000);
 assert.equal(boss.druidRoot,undefined);assert.ok(boss.hp<10000);assert.equal(out.hp,10000);
 const before=a.hp;dealDamage(w,a,100,w.player);assert.equal(before-a.hp,Math.floor(100*1.3));
});
test('Tempestade derruba raios só dentro da área, enquanto ela dura',()=>{
 const w=field(),inside=target(w,8),outside=target(w,14);
 assert.ok(druidAction(w,4,{x:8,y:0}));advance(w,1/30,30);
 assert.equal(w.druidStorms.length,1);const after=inside.hp;assert.ok(after<10000);assert.equal(outside.hp,10000);
 advance(w,1/30,150);assert.equal(w.druidStorms.length,0);const done=inside.hp;advance(w,1/30,30);assert.equal(inside.hp,done);
});
test('Rejuvenescer cura 30% da vida ao longo de 5 s',()=>{
 const w=field(),p=w.player;p.hp=1;assert.ok(druidAction(w,5,{x:3,y:0}));advance(w,1/30,30*6);
 assert.ok(Math.abs(p.hp-(1+p.maxHp*.3))<1,'cura total de 30%');
});
test('Forma de Lobo: troca de modelo, garras devolvem mana e a forma não consome mana',()=>{
 const w=field(),p=w.player;
 const locked=field({spark:1});assert.equal(toggleWolf(locked),false,'precisa do nó');
 assert.ok(toggleWolf(w));assert.equal(p.model,'druidWolf');assert.equal(w.druidForm,'wolf');
 assert.equal(druidAction(w,4,{x:3,y:0}),false,'sem magias na forma de lobo');
 p.mp=60;const e=target(w,1.5);advance(w,1/60,30);const mp=p.mp;assert.ok(druidAction(w,0,{x:3,y:0}));advance(w,1/60,40);
 assert.ok(e.hp<10000);assert.ok(Math.abs(p.mp-(mp+WOLF.hitRestore))<.05,'sem consumo; devolve 3 por acerto');
 const before=p.hp;dealDamage(w,p,100,e);assert.equal(before-p.hp,60,'lobo recebe 40% menos');
 p.mp=0;advance(w,1/60,240);assert.equal(w.druidForm,'wolf','sem mana continua lobo');assert.equal(p.mp,0,'sem regeneração na forma de lobo');
 advance(w,1/60,120);assert.ok(toggleWolf(w));assert.equal(w.druidForm,'human');assert.equal(p.model,'druid');
});
test('Garras ampliam o rastro visual sem ampliar o dano e alternam a diagonal',()=>{
 const w=field();toggleWolf(w);advance(w,1/60,30);
 const near=target(w,2),far=target(w,WOLF_ACTIONS[0].range+.4);
 assert.ok(druidAction(w,0,{x:6,y:0}));advance(w,1/60,13);
 const first=w.effects.find(e=>e.fx==='wolfClaws');assert.ok(first?.visual&&first.oneShot);
 assert.ok(first.radius>far.x);assert.ok(near.hp<near.maxHp);assert.equal(far.hp,far.maxHp,'rastro maior não concede alcance de dano');
 advance(w,1/60,20);assert.ok(druidAction(w,0,{x:6,y:0}));advance(w,1/60,13);
 const second=w.effects.filter(e=>e.fx==='wolfClaws').at(-1);assert.equal(second.sweep,-first.sweep);
});

test('Salto Feroz avança com colisão e atinge a área de pouso',()=>{
 const w=field(),p=w.player;toggleWolf(w);advance(w,1/60,30);const e=target(w,5.5);
 assert.ok(druidAction(w,1,{x:6,y:0}));finish(w);assert.ok(p.x>4.5&&p.x<6);assert.ok(e.hp<10000);
 const wall=field();toggleWolf(wall);advance(wall,1/60,30);wall.arena.solids=[{kind:'box',x:3,y:0,width:1,depth:6,angle:0}];
 druidAction(wall,1,{x:6,y:0});finish(wall);assert.ok(wall.player.x<2.6,'não atravessa parede');
});

test('Garras seguem direita, esquerda, cruzado e direita, com dano único mesmo em passos longos',()=>{
 for(const dt of [1/60,.3]){
  const w=field();toggleWolf(w);advance(w,1/60,30);const e=target(w,1.5);let damage;
  for(const clip of ['claw_1','claw_2','claw_cross','claw_1']){
   const hp=e.hp;assert.ok(druidAction(w,0,{x:6,y:0}));assert.equal(w.druidAction.clip,clip);
   assert.equal(druidAction(w,0,{x:6,y:0}),false,'comando bloqueado não avança a sequência');
   advance(w,dt,Math.ceil(.42/dt));
   damage??=hp-e.hp;assert.ok(damage>0);assert.equal(hp-e.hp,damage,'cruzado não duplica o dano');
   assert.equal(w.effects.filter(e=>e.fx==='wolfClaws').at(-1).cross,clip==='claw_cross');
  }
 }
});

test('Combo das Garras reinicia por pausa, outra habilidade, esquiva, troca de forma e cena',()=>{
 const w=field();toggleWolf(w);advance(w,1/60,30);
 const strike=()=>{assert.ok(druidAction(w,0,{x:6,y:0}));assert.equal(w.druidAction.clip,'claw_1');advance(w,1/60,26);};
 strike();advance(w,1/60,60);strike();
 assert.ok(druidAction(w,2,{x:6,y:0}));advance(w,1/60,43);strike();
 assert.ok(beginDash(w,{x:0,y:1}));moveDash(w,.5);advance(w,.5);strike();
 w.druidFormReady=0;assert.ok(toggleWolf(w));w.druidFormReady=0;advance(w,1/60,22);assert.ok(toggleWolf(w));advance(w,1/60,22);strike();
 const raw=freshSave();raw.character.classId='druid';raw.character.level=20;raw.character.druidRanks=ALL;
 const s=createSession(normalizeSave(raw));transition(s,'training');s.world.druidClawSide=2;s.world.druidComboUntil=999;
 transition(s,'training');assert.equal(s.world.druidClawSide,0);assert.equal(s.world.druidComboUntil,0);
});
test('sessão: barra fixa por forma, F alterna, esquiva no slot 4 e troca de cena volta à forma humana',()=>{
 const raw=freshSave();raw.character.classId='druid';raw.character.level=20;raw.character.druidRanks=ALL;
 const s=createSession(normalizeSave(raw));transition(s,'training');const w=s.world;w.aim={x:w.player.x+5,y:w.player.y};
 assert.ok(castSession(s));assert.equal(w.druidAction.id,'spark');w.druidAction=null;w.castCooldown=0;
 assert.ok(activateSlot(s,3,{x:1,y:0}));assert.ok(w.dash.remaining>0);w.dash.remaining=0;
 assert.ok(stanceSession(s));assert.equal(w.druidForm,'wolf');assert.equal(activateSlot(s,0),false,'troca de forma leva 0,35 s');w.castCooldown=0;assert.ok(activateSlot(s,0));assert.equal(w.druidAction.id,'claws');
 transition(s,'training');assert.equal(s.world.druidForm,'human');assert.equal(s.world.player.model,'druid');
 assert.equal(WOLF_ACTIONS[3].id,'dodge');
});

test('Frenético: garras que acertam somam acúmulos de velocidade, que expiram e somem ao trocar de forma',()=>{
 const w=field({...ALL,frenetico:1}),p=w.player;assert.ok(toggleWolf(w));advance(w,1/60,30);
 const e=target(w,1.5),swing=()=>{w.druidCooldowns.claws=0;w.castCooldown=0;assert.ok(druidAction(w,0,{x:3,y:0}));const d=w.druidAction.duration;advance(w,1/60,Math.ceil(d*60)+1);return d;};
 const first=swing();assert.equal(w.druidFrantic.stacks,1);
 for(let i=0;i<6;i++)swing();assert.equal(w.druidFrantic.stacks,FRANTIC.max,'limite de acúmulos');
 const fast=swing();assert.ok(Math.abs(first/fast-franticSpeed({frenetico:1},FRANTIC.max))<.06,'garras 60% mais rápidas com 5 acúmulos');
 assert.ok(w.druidCooldowns.claws-w.time<WOLF_ACTIONS[0].cooldown/1.5,'recarga acelerada');
 assert.ok(franticSpeed({frenetico:3},5)>franticSpeed({frenetico:1},5),'pontos extras aceleram mais');
 assert.equal(franticSpeed({},5),1,'sem o nó não acelera');
 advance(w,1/60,Math.ceil(FRANTIC.expire*60)+2);assert.equal(franticStacks(w),0,'expira sem acertar');
 swing();assert.equal(franticStacks(w),1,'recomeça do zero');
 w.druidFormReady=0;assert.ok(toggleWolf(w));assert.equal(w.druidFrantic,null,'forma humana zera');
 e.hp=0;
});
test('Frenético: com 3 acúmulos, Garras sem alvo ao alcance saltam até o inimigo mais próximo da mira e continuam',()=>{
 const w=field({...ALL,frenetico:1}),p=w.player;assert.ok(toggleWolf(w));advance(w,1/60,30);
 const far=target(w,5,0),other=target(w,0,5.5);
 w.druidFrantic={stacks:2,until:w.time+2,pounceReady:0};
 assert.ok(druidAction(w,0,{x:5,y:0}));assert.notEqual(w.druidAction.pounce,true,'com 2 acúmulos não salta');finish(w);
 w.druidFrantic={stacks:3,until:w.time+2,pounceReady:0};w.druidCooldowns.claws=0;
 const hp=far.hp;assert.ok(druidAction(w,0,{x:4.5,y:.5}));assert.equal(w.druidAction.pounce,true);assert.equal(w.druidAction.clip,'leap');
 finish(w);assert.ok(Math.hypot(p.x-far.x,p.y-far.y)<far.radius+FRANTIC.land+.05,'cai junto do alvo');assert.ok(far.hp<hp,'golpeia ao cair');assert.equal(other.hp,10000);
 assert.equal(franticStacks(w),4,'o bote também acumula');
 w.druidCooldowns.claws=0;assert.ok(druidAction(w,0,{x:far.x+1,y:0}));assert.notEqual(w.druidAction.pounce,true,'com inimigo ao alcance, golpe normal');finish(w);
 Object.assign(p,{x:-6,y:0});w.druidFrantic.pounceReady=w.time+.5;w.druidCooldowns.claws=0;
 assert.ok(druidAction(w,0,{x:0,y:0}));assert.notEqual(w.druidAction.pounce,true,'bote espera a própria recarga');finish(w);
 Object.assign(p,{x:-20,y:0});w.druidFrantic={stacks:5,until:w.time+2,pounceReady:0};w.druidCooldowns.claws=0;
 assert.ok(druidAction(w,0,{x:0,y:0}));assert.notEqual(w.druidAction.pounce,true,'fora de 6 u não salta');finish(w);
 const wall=field({...ALL,frenetico:1});assert.ok(toggleWolf(wall));advance(wall,1/60,30);target(wall,4,0);wall.arena.solids=[{id:'wall',kind:'box',x:2,y:0,width:.4,depth:4,height:1}];
 wall.druidFrantic={stacks:5,until:wall.time+2,pounceReady:0};assert.ok(druidAction(wall,0,{x:4,y:0}));assert.notEqual(wall.druidAction.pounce,true,'parede bloqueia o bote');
});
