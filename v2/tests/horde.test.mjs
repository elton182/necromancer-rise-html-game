import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createWorld,step,dealDamage} from '../scripts/training-model.mjs';
import {TEST_PROFILE,TYPES,normalizeHorde,effects,groupSize,equipGroup,members,revive,special,order,killMember,snapshotHorde} from '../scripts/horde.mjs';
import {statsFor} from '../scripts/horde-stats.mjs';
import R from '../scripts/horde-rules.mjs';
import {createSession,transition,snapshot,applySave} from '../scripts/session.mjs';
const require=createRequire(import.meta.url),{readHorde}=require('../tools/horde-source.cjs');
const army=()=>normalizeHorde({profile:TEST_PROFILE,loadout:['raio',...TYPES]});
// As regras da horda são conferidas com a vida e a mana do nível 1; os atributos reais têm testes próprios.
function field(){const w=createWorld({armyMode:'groups',army:army()});w.actors=w.actors.filter(a=>a.team!=='enemy');Object.assign(w.player,{maxHp:100,hp:100,maxMp:80,mp:80});return w;}
const advance=(w,t)=>{for(let x=0;x<t-1e-9;x+=1/60)step(w,Math.min(1/60,t-x));};
function foe(w,x=0,y=2){const a={id:w.nextId++,model:'zombie',team:'enemy',hp:100000,maxHp:100000,radius:.3,x,y,angle:0,animation:'idle',animationTime:0,walkDistance:0,timer:999,actionId:0};w.actors.push(a);return a;}
test('definições incluem overrides atuais e fórmula compartilhada produz atributos dos cinco tipos',()=>{
 assert.deepEqual(R,JSON.parse(JSON.stringify(readHorde().data)));const w=field();for(const t of TYPES){assert.equal(members(w,t).length,groupSize(w,t));const s=statsFor(t,TEST_PROFILE.level,effects(w));assert.equal(members(w,t)[0].maxHp,s.hp);assert.equal(members(w,t)[0].dmg,s.dmg);}assert.equal(w.actors.filter(a=>a.groupType).length,12);
});
test('perfil inicial não concede grupos; bloqueios, custos e troca de slots não curam ou reinvocam',()=>{
 const basic=createWorld({armyMode:'groups'});assert.equal(basic.actors.filter(a=>a.groupType).length,0);assert.equal(equipGroup(basic,1,'zombie',{preparation:true}).ok,false);
 const w=field(),a=members(w,'zombie')[0],id=a.id;a.hp=12;assert.ok(equipGroup(w,5,'zombie').ok);assert.equal(members(w,'zombie')[0].id,id);assert.equal(a.hp,12);assert.ok(equipGroup(w,1,'zombie').ok);assert.equal(w.army.loadout[1],'zombie');
 const n=createWorld({armyMode:'groups',army:normalizeHorde({profile:TEST_PROFILE})});n.player.mp=59;assert.equal(equipGroup(n,1,'zombie').ok,false);assert.equal(n.player.mp,59);n.player.mp=60;assert.ok(equipGroup(n,1,'zombie').ok);assert.equal(n.player.mp,0);const ids=members(n,'zombie').map(m=>m.id);assert.ok(equipGroup(n,1,'zombie').ok);assert.deepEqual(members(n,'zombie').map(m=>m.id),ids);
});
test('equipar no menu é grátis; reservar e restaurar mantém saúde e morte comuns',()=>{
 const w=field(),m=members(w,'zombie')[0];m.hp=17;assert.ok(equipGroup(w,1,'empty').ok);assert.ok(equipGroup(w,1,'zombie',{preparation:true}).ok);assert.equal(members(w,'zombie')[0].hp,17);
});
test('morte comum retorna com 50%, reanimação custa 30 MP e usa 60%; pausa congela recuperação',()=>{
 const w=field(),m=members(w,'zombie')[0];dealDamage(w,m,10000);assert.equal(m.deadTimer,12);w.paused=true;step(w,.25);assert.equal(m.deadTimer,12);w.paused=false;const mp=w.player.mp;assert.ok(revive(w,m.id));assert.equal(w.player.mp,mp-30);assert.equal(m.hp,Math.floor(m.maxHp*.6));dealDamage(w,m,10000);advance(w,12);assert.ok(!m.dead);assert.ok(m.hp>=Math.floor(m.maxHp*.5)&&m.hp< m.maxHp*.51);
});
test('detonação elimina um zumbi, bloqueia troca/reanimação e não permite contornar recuperação',()=>{
 const w=field();assert.ok(special(w,'zombie'));const group=members(w,'zombie'),dead=group.filter(m=>m.dead);assert.equal(dead.length,1);assert.ok(dead[0].exploded);assert.equal(revive(w,dead[0].id),false);assert.equal(equipGroup(w,1,'empty').ok,false);const remaining=dead[0].deadTimer;const state=snapshotHorde(w),restored=createWorld({armyMode:'groups',army:state});assert.equal(members(restored,'zombie').find(m=>m.exploded).deadTimer,remaining);advance(w,12);assert.ok(!dead[0].exploded);
});
test('sacrifício espera 20 segundos e não é elegível para reanimação',()=>{
 const w=field(),m=members(w,'zombie')[0];killMember(w,m,'sacrificed');assert.equal(m.deadTimer,20);assert.equal(revive(w,m.id),false);advance(w,12);assert.ok(m.dead);advance(w,8);assert.ok(!m.dead);
});
test('persistência mantém integrantes, recargas e arquivo antigo; menu não reinicia tempo de morto',()=>{
 const s=createSession();s.save.settings.armyMode='groups';s.save.horde=army();applySave(s,s.save);transition(s,'training');const m=members(s.world,'zombie')[0];killMember(s.world,m,'exploded');advance(s.world,3);const left=m.deadTimer,saved=snapshot(s,123);const restored=createSession(saved);assert.ok(Math.abs(members(restored.world,'zombie').find(m=>m.exploded).deadTimer-left)<1e-8);transition(restored,'training');assert.ok(Math.abs(members(restored.world,'zombie').find(m=>m.exploded).deadTimer-left)<1e-8);assert.equal(restored.world.allyShots.length,0);assert.equal(restored.world.command,null);
});
test('região restringe alvos e retorno usa histerese; ordem é limitada ao alcance',()=>{
 const w=field();w.army.range=8;const m=members(w,'zombie')[0],outside=foe(w,0,-12);m.x=0;m.y=13;const before=Math.hypot(m.x-w.player.x,m.y-w.player.y);advance(w,.5);assert.ok(Math.hypot(m.x-w.player.x,m.y-w.player.y)<before);assert.notEqual(m.targetId,outside.id);assert.ok(order(w,{x:1000,y:1000}));assert.ok(Math.hypot(w.command.x-w.player.x,w.command.y-w.player.y)<=8.001);advance(w,14);assert.equal(w.command,null);
});
test('automáticas por tipo usam recarga própria e chefes não recebem lentidão',()=>{
 for(const t of TYPES){const w=field(),m=members(w,t)[0];w.actors=w.actors.filter(a=>a===w.player||a===m);const target=foe(w,m.x+.7,m.y);m.abilityCooldown=0;advance(w,.1);assert.ok(m.abilityCooldown>0,t);assert.ok(target.hp<100000||w.allyShots.length>0,t);}
 const w=field(),m=members(w,'zombie')[0];w.actors=[w.player,m];const target=foe(w,m.x+.5,m.y);target.model='fallenKing';m.abilityCooldown=0;advance(w,.05);assert.equal(target.slowTime,0);
});
test('salto da Abominação tem deslocamento e impacto ao aterrissar; passo espectral tem recarga',()=>{
 const w=field(),m=members(w,'abom')[0],target=foe(w,m.x+3,m.y);w.aim={x:target.x,y:target.y};assert.ok(special(w,'abom'));advance(w,.2);assert.ok(m.jumpZ>0);assert.equal(target.hp,100000);advance(w,.3);assert.equal(m.jumpZ,0);assert.ok(target.hp<100000);w.aim={x:1,y:4};assert.ok(special(w,'specter'));assert.ok(w.army.cooldowns.specter>7&&w.army.cooldowns.specter<8);assert.equal(special(w,'specter'),false);
});
test('separação respeita terreno; esquiva não concede invulnerabilidade',()=>{
 const w=field();for(const m of w.actors.filter(a=>a.groupType)){m.x=0;m.y=4;}advance(w,1);const group=w.actors.filter(a=>a.groupType);assert.ok(group.some(m=>Math.hypot(m.x-group[0].x,m.y-group[0].y)>1));const m=members(w,'zombie')[0],hp=m.hp;dealDamage(w,m,10);assert.ok(m.hp<hp);
});
test('horda malformada e build inválida são recusadas sem alterar estado',()=>{
 assert.throws(()=>normalizeHorde({profile:{level:1,ranks:{colossus:1}}}));assert.throws(()=>normalizeHorde({loadout:['raio']}));assert.throws(()=>normalizeHorde({range:999}));assert.throws(()=>normalizeHorde({groups:{zombie:[{key:'x',hp:-1,maxHp:100}]}}));
});
test('Pacto cura apenas morte comum, sem curar detonação ou ressuscitar o jogador',()=>{
 const w=field();Object.assign(w.army.profile.ranks,{shield:2,vitality:2,pact:1});w.player.hp=50;const group=members(w,'zombie');killMember(w,group[0]);assert.equal(w.player.hp,51);killMember(w,group[1],'exploded');assert.equal(w.player.hp,51);w.player.hp=0;killMember(w,group[2]);assert.equal(w.player.hp,0);
});
test('botão do painel pode reanimar na pausa, mas atalho de campo não avança o jogo pausado',()=>{
 const w=field(),m=members(w,'skeleton')[0];killMember(w,m);w.paused=true;assert.equal(revive(w,m.id),false);const before=w.player.mp;assert.equal(revive(w,m.id,{fromMenu:true}),true);assert.equal(w.player.mp,before-30);assert.equal(w.paused,true);assert.equal(m.hp,Math.floor(m.maxHp*.6));
});
