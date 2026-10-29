import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createSession,transition,stepSession,snapshot,useProfile} from '../scripts/session.mjs';
import {FORMAT,VERSION,importSave,normalizeSave} from '../scripts/save-model.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {TEST_PROFILE,members} from '../scripts/horde.mjs';
import {xpNext,addExp,goldFor,attributes,applyAttributes,points,MAX_LEVEL,RULES} from '../scripts/progression.mjs';
import {tickDrops} from '../scripts/drops.mjs';
import {syncSkills} from '../scripts/grimoire.mjs';
const require=createRequire(import.meta.url);
function field(){const s=createSession();transition(s,'training');return s;}
const foe=w=>w.actors.find(a=>a.team==='enemy'&&a!==w.boss&&!a.dead);
test('regras de progressão vêm das fontes atuais',()=>{
 assert.deepEqual(RULES,require('../tools/progression-source.cjs').readProgression());
 assert.deepEqual([RULES.xp.base,RULES.xp.growth,MAX_LEVEL,RULES.levelUp.hp,RULES.levelUp.mp,RULES.gold.factor,RULES.gold.boss,RULES.orbs.chance,RULES.orbs.hpShare],[100,1.4,60,20,5,.35,3,.16,.25]);
});
test('curva de XP, limite do nível 60 e quantidades inválidas',()=>{
 assert.deepEqual([1,2,5,10,12,20,24].map(xpNext),[100,140,384,2066,4049,59763,229585]);
 assert.equal(xpNext(MAX_LEVEL),0);
 assert.deepEqual(addExp({level:1,exp:0},99),{level:1,exp:99,levels:0});
 assert.deepEqual(addExp({level:1,exp:99},2),{level:2,exp:1,levels:1});
 assert.deepEqual(addExp({level:1,exp:0},100+140+1),{level:3,exp:1,levels:2});
 assert.deepEqual(addExp({level:MAX_LEVEL,exp:7},1e9),{level:MAX_LEVEL,exp:0,levels:0});
 assert.equal(addExp({level:MAX_LEVEL-1,exp:0},1e12).level,MAX_LEVEL);
 for(const bad of [0,-1,NaN,Infinity,undefined])assert.deepEqual(addExp({level:3,exp:5},bad),{level:3,exp:5,levels:0});
});
test('ouro por abate: mínimo, arredondamento e chefe',()=>{
 assert.deepEqual([goldFor(1),goldFor(12),goldFor(100,true),goldFor(10)],[2,4,105,4]);
});
test('atributos sem equipamento seguem a tabela documentada',()=>{
 const rows=[[1,100,80,40,4,0],[10,190,125,76,6.7,1.8],[30,390,225,156,12.7,5.8],[60,690,375,276,21.7,11.8]];
 for(const [level,hp,mp,spell,regen,hpRegen]of rows){const a=attributes({army:null,level,equipment:{}},level);assert.equal(a.hp,hp);assert.equal(a.mp,mp);assert.equal(a.spell,spell);assert.ok(Math.abs(a.regen-regen)<.05);assert.ok(Math.abs(a.hpRegen-hpRegen)<.05);assert.equal(a.move,4);assert.equal(a.defense,0);}
});
test('um encontro novo começa cheio e com os atributos do nível salvo',()=>{
 const s=createSession(normalizeSave({format:FORMAT,version:VERSION,character:{level:10,exp:5,gold:0}}));transition(s,'training');const p=s.world.player;
 assert.deepEqual([p.maxHp,p.hp,p.maxMp,p.mp,p.spellDamage,p.moveSpeed],[190,190,125,125,76,4]);assert.equal(s.world.army.profile.level,10);
 const b=createSession(normalizeSave({format:FORMAT,version:VERSION,settings:{armyMode:'load'},character:{level:10}}));assert.equal(b.world.player.maxHp,190);
});
test('recálculo preserva a proporção sem curar e a regeneração de vida respeita o passo',()=>{
 const s=createSession();useProfile(s,TEST_PROFILE);transition(s,'training');const w=s.world,p=w.player;p.hp=Math.floor(p.maxHp/2);p.mp=Math.floor(p.maxMp/4);
 const ratio=[p.hp/p.maxHp,p.mp/p.maxMp];w.army.profile.ranks.meditate=3;syncSkills(w);
 assert.ok(Math.abs(p.hp/p.maxHp-ratio[0])<.01);assert.ok(Math.abs(p.mp/p.maxMp-ratio[1])<.01);const settled=[p.maxHp,p.maxMp,p.hp,p.mp];for(let i=0;i<10;i++)syncSkills(w);assert.deepEqual([p.maxHp,p.maxMp,p.hp,p.mp],settled);
 const hp=p.hp;stepSession(s,.25,{});assert.ok(Math.abs(p.hp-Math.min(p.maxHp,hp+p.hpRegen*.25))<1e-6);
 p.hp=0;applyAttributes(w);assert.equal(p.hp,0);
});
test('abate paga XP, ouro e maestria uma vez, independentemente de quem causou a morte',()=>{
 const s=field(),w=s.world,e=foe(w),c=s.save.character,ally=w.actors.find(a=>a.team==='ally');
 dealDamage(w,e,1e6,ally);assert.equal(c.exp,12);assert.equal(w.drops.filter(d=>d.kind==='gold').length,1);assert.deepEqual([w.drops[0].amount,w.drops[0].x,w.drops[0].y],[4,e.x,e.y]);
 dealDamage(w,e,1e6,w.player);w.onEnemyDeath(e,w.player);assert.equal(c.exp,12);assert.equal(w.drops.filter(d=>d.kind==='gold').length,1);
 dealDamage(w,w.boss,1e6,w.player);assert.deepEqual([c.level,c.exp],[2,12]);assert.equal(w.drops.find(d=>d.x===w.boss.x&&d.y===w.boss.y&&d.kind==='gold').amount,105);
});
test('sem XP válido não há recompensa nem ouro',()=>{
 const s=field(),w=s.world,before=structuredClone(s.save.character);for(const xp of [0,-5,NaN,undefined])w.onEnemyDeath({xp,x:0,y:0},w.player);assert.deepEqual(s.save.character,before);assert.equal(w.drops.length,0);
});
test('orbes: chance e tipo seguem os sorteios e a vida útil; ouro dura mais',()=>{
 const s=field(),w=s.world,draws=seq=>{let i=0;w.random=()=>seq[i++%seq.length];},kinds=()=>w.drops.map(d=>d.kind).sort().join();
 draws([.16]);w.onEnemyDeath({xp:12,x:3,y:3},w.player);assert.equal(kinds(),'gold');
 w.drops=[];draws([.159,.24,.5,.5,.99]);w.onEnemyDeath({xp:12,x:3,y:3},w.player);assert.equal(kinds(),'gold,hp');
 w.drops=[];draws([.159,.25,.5,.5,.99]);w.onEnemyDeath({xp:12,x:3,y:3},w.player);assert.equal(kinds(),'gold,mp');
 const gold=w.drops.find(d=>d.kind==='gold'),orb=w.drops.find(d=>d.kind==='mp');assert.deepEqual([gold.life,orb.life],[45,22]);
 w.player.x=-10;w.player.y=10;tickDrops(w,22.5);assert.deepEqual(w.drops.map(d=>d.kind),['gold']);tickDrops(w,22.6);assert.equal(w.drops.length,0);
});
test('coleta por proximidade soma ouro uma vez e orbes respeitam o máximo',()=>{
 const s=field(),w=s.world,c=s.save.character,p=w.player;
 w.drops=[];w.random=()=>.99;w.onEnemyDeath({xp:12,x:p.x+1.7,y:p.y},p);w.onEnemyDeath({xp:12,x:p.x+1.9,y:p.y},p);assert.equal(w.drops.length,2);
 tickDrops(w,.1);assert.equal(c.gold,4);assert.equal(w.drops.length,1);tickDrops(w,.1);assert.equal(c.gold,4);
 w.drops=[];w.drops.push({id:900,kind:'hp',x:p.x,y:p.y,age:0,life:22},{id:901,kind:'mp',x:p.x,y:p.y,age:0,life:22});p.hp=p.maxHp-5;p.mp=10;tickDrops(w,.1);
 assert.equal(p.hp,p.maxHp);assert.equal(p.mp,10+Math.floor(p.maxMp*.4));assert.equal(w.drops.length,0);
 p.hp=0;w.drops.push({id:902,kind:'hp',x:p.x,y:p.y,age:0,life:22});tickDrops(w,.1);assert.equal(w.drops.length,1);assert.equal(p.hp,0);
});
test('pausa e menu não consomem a vida útil; reiniciar e morrer limpam o chão',()=>{
 const s=field(),w=s.world;w.random=()=>.99;w.onEnemyDeath({xp:12,x:9,y:9},w.player);const life=w.drops[0].life;w.paused=true;stepSession(s,5,{});assert.equal(w.drops[0].life,life);
 w.paused=false;transition(s,'menu');assert.equal(w.drops.length,0);assert.equal(w.feed.length,0);
 transition(s,'training');w.onEnemyDeath({xp:12,x:9,y:9},w.player);assert.equal(w.drops.length,1);w.player.hp=0;stepSession(s,.02,{});assert.equal(s.scene,'dead');assert.equal(w.drops.length,0);
});
test('subir de nível aplica pontos, atributos e cura fixa sem passar do máximo',()=>{
 const s=field(),w=s.world,c=s.save.character,p=w.player;c.exp=95;p.hp=50;p.mp=70;
 w.onEnemyDeath({xp:12,x:0,y:0},p);assert.equal(c.level,2);assert.equal(c.exp,7);assert.equal(w.army.profile.level,2);
 assert.deepEqual([p.maxHp,p.maxMp,p.spellDamage],[110,85,44]);assert.equal(p.hp,70);assert.equal(p.mp,75);assert.equal(points(2,w.army.profile.ranks),3);assert.match(w.notice,/^Nível 2/);assert.ok(w.feed.some(m=>m.text.startsWith('Nível 2')));
 p.hp=p.maxHp-5;c.exp=xpNext(2)-1;w.onEnemyDeath({xp:1+xpNext(3),x:0,y:0},p);assert.equal(c.level,4);assert.equal(p.hp,p.maxHp);assert.equal(c.exp,0);
});
test('XP de maestria usa o nível anterior ao do personagem e não é perdido no nível máximo',()=>{
 const s=field(),w=s.world,c=s.save.character;c.level=MAX_LEVEL;c.exp=0;w.army.profile.level=MAX_LEVEL;syncSkills(w);const before=w.army.mastery.raio.xp+w.army.mastery.raio.level*1e6;
 w.onEnemyDeath({xp:12,x:0,y:0},w.player);assert.equal(c.exp,0);assert.equal(c.level,MAX_LEVEL);assert.ok(w.army.mastery.raio.xp+w.army.mastery.raio.level*1e6>before);
});
test('aliado e inimigo reutilizam o mesmo caminho: nenhum crédito duplicado por aliado morto',()=>{
 const s=createSession();useProfile(s,TEST_PROFILE);transition(s,'training');const w=s.world,z=members(w,'zombie')[0]??w.actors.find(a=>a.team==='ally');const exp=s.save.character.exp;dealDamage(w,z,1e6,foe(w));assert.equal(s.save.character.exp,exp);
});
test('snapshot e recarga preservam nível, XP e ouro sem restaurar o chão',()=>{
 const s=field(),w=s.world;w.random=()=>.99;dealDamage(w,foe(w),1e6,w.player);w.player.x=foe(w).x;const gold=w.drops[0];w.player.x=gold.x;w.player.y=gold.y;tickDrops(w,.1);
 const saved=snapshot(s,5);assert.deepEqual([saved.character.level,saved.character.exp,saved.character.gold],[1,12,4]);assert.equal(saved.drops,undefined);
 const loaded=createSession(importSave(JSON.stringify(saved)));transition(loaded,'training');assert.deepEqual(loaded.save.character,saved.character);assert.equal(loaded.world.drops.length,0);
 const again=snapshot(loaded,6);assert.deepEqual(again.character,saved.character);
});
test('normalização: nível do personagem e do perfil convergem e o XP cabe no nível',()=>{
 const base={format:FORMAT,version:VERSION};
 assert.equal(normalizeSave({...base,character:{level:30}}).horde.profile.level,30);
 const profile={version:1,level:24,act1:false,ranks:{zombie:2}};
 const n=normalizeSave({...base,character:{level:3,exp:50},horde:{profile}});assert.equal(n.character.level,24);assert.equal(n.horde.profile.level,24);assert.equal(n.character.exp,50);
 assert.equal(normalizeSave({...base,character:{level:2,exp:99999}}).character.exp,xpNext(2)-1);
 assert.equal(normalizeSave({...base,character:{level:MAX_LEVEL,exp:99999}}).character.exp,0);
 assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(n))),n);
});
test('perfil de teste substitui o nível em memória e zera o XP; sem equipamento não há bônus ocultos',()=>{
 const s=createSession();s.save.character.exp=50;assert.equal(useProfile(s,TEST_PROFILE).ok,true);assert.deepEqual([s.save.character.level,s.save.character.exp,s.world.army.profile.level],[24,0,24]);
 assert.equal(snapshot(s).character.level,24);assert.equal(s.world.player.defense,0);assert.equal(s.world.modifiers.gearCooldown,0);
});
