import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,transition,equipSession,snapshot} from '../scripts/session.mjs';
import {freshSave} from '../scripts/save-model.mjs';
import {Build,Model,changeRank,changeMastery,resetRanks,syncSkills,gainMastery} from '../scripts/grimoire.mjs';
import {TEST_PROFILE,setProfile,members,killMember,recalculateHorde} from '../scripts/horde.mjs';
import {masteryBonus} from '../scripts/mastery.mjs';
function fixture(){const s=createSession();setProfile(s.world,TEST_PROFILE);equipSession(s,0,'raio');equipSession(s,1,'zombie');equipSession(s,2,'dash');s.save.character.gold=1000;return s;}
test('Grimório aplica pré-requisitos, pontos diretos e limites sem mutação em falha',()=>{
 const s=createSession(),before=snapshot(s);assert.equal(changeRank(s,'zombie').ok,false);assert.deepEqual(snapshot(s).horde,before.horde);
 const t=fixture();assert.equal(changeRank(t,'storm').ok,false);assert.equal(changeRank(t,'bolt').ok,true);assert.equal(t.world.army.profile.ranks.bolt,1);
 assert.equal(t.world.modifiers.boltDamagePercent,10.000000000000009);assert.ok(Build.spent(t.world.army.profile.ranks)<=Build.budget(24));
});
test('devolução custa por ponto inclusive dependentes; falha por ouro preserva build e grupos',()=>{
 const s=fixture();s.save.character.gold=0;const before=snapshot(s).horde;assert.equal(changeRank(s,'zombie',{refund:true}).ok,false);assert.deepEqual(snapshot(s).horde,before);
 s.save.character.gold=1000;const initial=Build.spent(s.world.army.profile.ranks);assert.equal(changeRank(s,'zombie',{refund:true}).ok,true);const after=Build.spent(s.world.army.profile.ranks);assert.equal(s.save.character.gold,1000-(initial-after)*20);assert.equal(s.world.army.profile.ranks.zombie,1);assert.equal(s.world.army.profile.ranks.vigor,undefined);
});
test('combate, morte e indisponibilidade bloqueiam edição e redistribuição',()=>{
 const s=fixture();transition(s,'training');assert.equal(changeRank(s,'bolt').ok,false);transition(s,'menu');killMember(s.world,members(s.world,'zombie')[0],'sacrificed');assert.equal(changeRank(s,'bolt').ok,false);assert.equal(changeMastery(s,'raio','power',{reset:true}).ok,false);
});
test('no treino a edição só vale com o Relicário aberto e preserva a vida dos integrantes',()=>{
 const s=fixture();transition(s,'training');const m=members(s.world,'zombie')[0];m.hp=Math.floor(m.maxHp/2);const ratio=m.hp/m.maxHp;
 assert.equal(changeRank(s,'bolt').ok,false);s.world.paused=true;
 assert.equal(changeRank(s,'bolt').ok,true);assert.equal(s.world.army.profile.ranks.bolt,1);const n=members(s.world,'zombie')[0];assert.ok(Math.abs(n.hp/n.maxHp-ratio)<.01);
 s.world.paused=false;assert.equal(changeRank(s,'bolt').ok,false);s.world.player.hp=0;transition(s,'dead');s.world.paused=true;assert.equal(changeRank(s,'bolt').ok,false);
});
test('recálculo preserva proporção da saúde e recuperação, sem multiplicadores cumulativos',()=>{
 const s=fixture(),m=members(s.world,'zombie')[0];m.hp=Math.floor(m.maxHp/2);const ratio=m.hp/m.maxHp;assert.equal(changeRank(s,'vigor').ok,true);const n=members(s.world,'zombie')[0];assert.ok(Math.abs(n.hp/n.maxHp-ratio)<.01);const stats=[n.maxHp,n.baseDmg,n.spd,n.regen];for(let i=0;i<10;i++)recalculateHorde(s.world);assert.deepEqual([n.maxHp,n.baseDmg,n.spd,n.regen],stats);
});
test('maestria só recebe XP e aplica bônus quando equipada; progressão persiste ao sair da barra',()=>{
 const s=fixture();assert.equal(gainMastery(s,NaN),false);gainMastery(s,100);assert.ok(s.world.army.mastery.raio.level>1);assert.equal(s.world.army.mastery.archer.level,1);const state=structuredClone(s.world.army.mastery.raio);assert.equal(changeMastery(s,'raio','power').ok,true);assert.ok(s.world.modifiers.boltDamagePercent>0);equipSession(s,0,'empty');assert.deepEqual(masteryBonus(s.world,'raio'),{});assert.equal(s.world.modifiers.boltDamagePercent,0);assert.equal(s.world.army.mastery.raio.xp,state.xp);equipSession(s,0,'raio');assert.ok(s.world.modifiers.boltDamagePercent>0);
});
test('bônus de tiro e Dash combinam árvore e maestria uma vez; save e menu preservam resultado',()=>{
 const s=fixture();s.world.army.mastery.raio=Model.normalize('raio',{level:8,ranks:{power:2,pierce:1}});s.world.army.mastery.dash=Model.normalize('dash',{level:5,ranks:{distance:2}});syncSkills(s.world);const mods={...s.world.modifiers};for(let i=0;i<10;i++)syncSkills(s.world);assert.deepEqual(s.world.modifiers,mods);const saved=snapshot(s),loaded=createSession(saved);assert.deepEqual(loaded.world.modifiers,mods);transition(loaded,'training');assert.deepEqual(loaded.world.modifiers,mods);assert.equal(loaded.world.modifiers.extraPierce,1);
});
test('maestria dos aliados aumenta atributos sem curar proporcionalmente e reset não consome pontos do Grimório',()=>{
 const s=fixture();gainMastery(s,600);const m=members(s.world,'zombie')[0];m.hp=Math.floor(m.maxHp*.4);const ratio=m.hp/m.maxHp,spent=Build.spent(s.world.army.profile.ranks),before=m.maxHp;assert.equal(changeMastery(s,'zombie','body').ok,true);const n=members(s.world,'zombie')[0];assert.ok(n.maxHp>before);assert.ok(Math.abs(n.hp/n.maxHp-ratio)<.01);assert.equal(changeMastery(s,'zombie',null,{reset:true}).ok,true);assert.equal(Build.spent(s.world.army.profile.ranks),spent);assert.equal(s.world.army.mastery.zombie.level,Model.gain('zombie',{},600,24).state.level);
});
test('campos de maestria são opcionais nos saves anteriores e normalizados pelo modelo canônico',()=>{
 const old=freshSave();delete old.horde.mastery;const s=createSession(old);assert.equal(s.world.army.mastery.raio.level,1);assert.equal(Model.points(s.world.army.mastery.raio),0);assert.equal(changeMastery(s,'raio','power').ok,false);
});
test('abate concede uma vez o XP lido das fontes às ações equipadas, inclusive por aliado',async()=>{
 const {RULES,dealDamage}=await import('../scripts/combat.mjs');assert.deepEqual(RULES.rewards,{enemyXp:12,bossXp:100});
 const s=fixture();transition(s,'training');const w=s.world,foe=w.actors.find(a=>a.team==='enemy'&&a!==w.boss),ally=members(w,'zombie')[0];
 assert.equal(foe.xp,12);assert.equal(w.boss.xp,100);
 const expected=id=>Model.gain(id,structuredClone(w.army.mastery[id]),12,w.army.profile.level).state,raio=expected('raio'),zombie=expected('zombie'),archer=structuredClone(w.army.mastery.archer);
 dealDamage(w,foe,1e6,w.player);assert.deepEqual(w.army.mastery.raio,raio);assert.deepEqual(w.army.mastery.zombie,zombie);assert.deepEqual(w.army.mastery.archer,archer);
 dealDamage(w,foe,1e6,w.player);assert.deepEqual(w.army.mastery.raio,raio);
 const other=w.actors.find(a=>a.team==='enemy'&&!a.dead&&a!==w.boss),next=expected('raio');dealDamage(w,other,1e6,ally);assert.deepEqual(w.army.mastery.raio,next);
 // Ao voltar ao menu o XP fica no save; o encontro recomeça sem perder progresso.
 transition(s,'menu');assert.deepEqual(s.save.horde.mastery.raio,next);assert.deepEqual(createSession(snapshot(s)).world.army.mastery.raio,next);
});
test('XP de abate sem novo nível não recalcula horda; subida de nível avisa e aplica pontos',()=>{
 const s=fixture();transition(s,'training');const w=s.world,ally=members(w,'zombie')[0];ally.hp=Math.floor(ally.maxHp*.5);const hp=ally.hp;
 const foe=w.actors.find(a=>a.team==='enemy'&&a!==w.boss);foe.xp=1;w.onEnemyDeath(foe,w.player);assert.equal(ally.hp,hp);assert.equal(w.notice,undefined);
 w.boss.xp=Model.xpNext(1)*3;w.onEnemyDeath(w.boss,w.player);assert.ok(w.army.mastery.raio.level>1);assert.match(w.notice,/^Maestria ↑ .*Tiro de Osso/);
 assert.ok(Math.abs(ally.hp/ally.maxHp-.5)<.01);
});
test('modo de carga e XP inválido não concedem maestria',()=>{
 const s=createSession();transition(s,'training');const w=s.world;if(w.armyMode!=='groups'){const foe=w.actors.find(a=>a.team==='enemy');assert.equal(w.onEnemyDeath(foe,w.player),false);}
 const t=fixture();transition(t,'training');const before=structuredClone(t.world.army.mastery);for(const xp of [0,-5,NaN,undefined])t.world.onEnemyDeath({xp},t.world.player);assert.deepEqual(t.world.army.mastery,before);
});

test('redistribuição total devolve todos os pontos por 20 ouro cada e falha sem ouro sem alterar a build',()=>{
 const s=fixture(),spent=Build.spent(s.world.army.profile.ranks);assert.ok(spent>0);
 s.save.character.gold=spent*20-1;const before=snapshot(s).horde;assert.equal(resetRanks(s).ok,false);assert.deepEqual(snapshot(s).horde,before);assert.equal(s.save.character.gold,spent*20-1);
 s.save.character.gold=spent*20+5;assert.equal(resetRanks(s).ok,true);assert.equal(Build.spent(s.world.army.profile.ranks),0);assert.equal(s.save.character.gold,5);
 assert.equal(resetRanks(s).ok,false);
});
