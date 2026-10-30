import {Model as Mastery} from '../scripts/mastery.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,cast,dash,step,dealDamage} from '../scripts/training-model.mjs';
import {castSpell} from '../scripts/spells.mjs';
import Build from '../scripts/shared-build.mjs';
import {LICH,LICH_SLOTS,DEATH_NODES,DEATH_SCHOOLS,lichStats,setLichRanks,enterLich,exitLich,castLich,tickLich,canEnter,spawnSpirit,lichSlots} from '../scripts/lich-model.mjs';

const ALL={lichform:1,spinning:1,triple:1,arc:1,cyclone:1};
const close=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function field(ranks=ALL){
 const w=createWorld({horde:0});w.actors=[w.player];w.player.x=0;w.player.y=0;w.player.spellDamage=100;w.player.hp=w.player.maxHp=1000;w.aim={x:9,y:0};
 w.arena={bounds:{minX:-30,maxX:30,minY:-30,maxY:30},solids:[]};setLichRanks(w,ranks);return w;
}
function enemy(w,x,y=0,extra={}){const e={id:w.nextId++,model:'zombie',team:'enemy',x,y,hp:10000,maxHp:10000,radius:.3,animation:'idle',animationTime:0,timer:0,walkDistance:0,angle:0,actionId:0,...extra};w.actors.push(e);return e;}
// `flat` zera os bônus de dano dos nós para conferir os multiplicadores base das habilidades.
function transformed(ranks,flat=true){const w=field(ranks);assert.ok(enterLich(w));tickLich(w,1);assert.equal(w.lich.form,'lich');if(flat)for(const k of Object.keys(w.lich.stats.damage))w.lich.stats.damage[k]=1;return w;}
const run=(w,seconds,dt=1/60)=>{for(let t=0;t<seconds-1e-9;t+=dt)tickLich(w,Math.min(dt,seconds-t));};
const lost=e=>e.maxHp-e.hp;

test('árvore Morte: nós no padrão do Grimório, IDs próprios e especializações exclusivas',()=>{
 assert.equal(DEATH_NODES.length,14);assert.deepEqual(DEATH_SCHOOLS.map(s=>s.id),['scythe','harvest']);
 for(const n of DEATH_NODES)assert.ok(!Build.byId[n.id],'ID já usado pelo Grimório: '+n.id);
 const byId=Object.fromEntries(DEATH_NODES.map(n=>[n.id,n]));
 assert.equal(byId.cyclone.exclusive,'executor');assert.equal(byId.executor.exclusive,'cyclone');assert.equal(byId.reaper.exclusive,'avatar');assert.equal(byId.avatar.exclusive,'reaper');
 assert.equal(byId.lichform.level,1);assert.equal(byId.lichform.requires,null);assert.equal(byId.arc.requires,'spinning');assert.equal(byId.cyclone.level,22);assert.equal(byId.cyclone.max,1);
 const none=lichStats({});assert.equal(none.learned,false);assert.equal(none.unlocked.giratoria,false);assert.equal(none.unlocked.ceifada,true);
 const s=lichStats({lichform:5,vessel:5,hunger:5,reach:5,harvest:5,callspirit:5,avatar:1});
 assert.equal(s.maxSouls,100+25+20);close(s.drain,1.5*.7);close(s.reach,1.3);close(s.soulFactor,1.4);close(s.absorb,4.5);assert.equal(s.damageTaken,.75);
 assert.equal(lichStats({lichform:99}).maxSouls,125,'pontos acima do máximo do nó são limitados');
});

test('entrar exige o nó, mana, recarga e vida; paga a mana uma vez e suspende a regeneração',()=>{
 const unlearned=field({});assert.equal(canEnter(unlearned),false);assert.equal(enterLich(unlearned),false);assert.equal(unlearned.player.mp,80);
 const poor=field();poor.player.mp=49;assert.equal(enterLich(poor),false);assert.equal(poor.player.mp,49);
 for(const change of [w=>w.paused=true,w=>w.player.hp=0]){const w=field();change(w);assert.equal(enterLich(w),false);assert.equal(w.player.mp,80);}
 const w=field();assert.ok(enterLich(w));assert.equal(w.player.mp,30);assert.equal(enterLich(w),false);assert.equal(w.player.mp,30);
 assert.equal(w.lich.form,'transform');assert.equal(w.lich.souls,LICH.enter.start);assert.equal(w.player.mpRegen,0);
 step(w,.5);assert.equal(w.player.mp,30,'sem regeneração de mana na forma');
});

test('transformação: invulnerável e imóvel por 0,9 s; depois vulnerável; Avatar encurta',()=>{
 const w=field(),foe=enemy(w,5);enterLich(w);
 assert.equal(dealDamage(w,w.player,50,foe).blocked,true);assert.equal(w.player.hp,1000);assert.equal(w.lich.moveFactor,0);
 run(w,.85);assert.equal(w.lich.form,'transform');run(w,.1);assert.equal(w.lich.form,'lich');assert.equal(w.lich.invuln,false);assert.equal(w.lich.moveFactor,1);
 assert.ok(dealDamage(w,w.player,50,foe).applied>0);
 const fast=field({...ALL,avatar:1});enterLich(fast);run(fast,.65);assert.equal(fast.lich.form,'lich');
 const slow=field();enterLich(slow);run(slow,.65);assert.equal(slow.lich.form,'transform');
});

test('na forma: Tiro de Osso e magias ficam bloqueados; Dash vale, exceto transformando',()=>{
 const w=field();enterLich(w);assert.equal(dash(w,{x:1,y:0}),false);
 run(w,1);assert.equal(cast(w),false);assert.equal(w.projectiles.length,0);assert.equal(w.lich.form,'lich');
 w.army={loadout:['chuva'],profile:{ranks:{rain:1}}};w.armyMode='groups';assert.equal(castSpell(w,'chuva'),false);
 assert.ok(dash(w,{x:1,y:0}));
 exitLich(w,'manual');assert.ok(cast(w),'ao sair, o Tiro de Osso volta');
});

test('almas drenam 1,5/s; zerar sai da forma, devolve a mana anterior e abre a recarga de 20 s',()=>{
 const w=transformed();const mp=w.player.mp,base=w.lich.souls;close(base,LICH.enter.start-.15);
 run(w,10);close(w.lich.souls,base-15,1e-6);assert.equal(w.lich.form,'lich');
 run(w,17);assert.equal(w.lich.form,'none');assert.equal(w.player.mp,mp);assert.equal(w.player.mpRegen,4);
 assert.equal(canEnter(w),false);assert.ok(w.lich.entryCooldown>0&&w.lich.entryCooldown<=LICH.enter.cooldown);
 run(w,20);w.player.mp=80;assert.ok(canEnter(w));
 const hungry=transformed({...ALL,hunger:5}),hb=hungry.lich.souls;run(hungry,10);close(hungry.lich.souls,hb-10.5,1e-6);
});

test('espíritos: só na forma, valor por tipo, marca Ceifado e Colheita de Almas; expiram em 8 s',()=>{
 const off=field();const e0=enemy(off,2);assert.equal(spawnSpirit(off,e0),null);off.onLichKill(e0);assert.equal(off.spirits.length,0);
 const w=transformed({...ALL,harvest:5});const f=1.4;
 const common=enemy(w,20),magic=enemy(w,21,0,{tier:'magic'}),boss=enemy(w,22,0,{isBoss:true}),marked=enemy(w,23,0,{reaped:{remaining:1}});
 for(const e of [common,magic,boss,marked]){e.hp=1;dealDamage(w,e,5,w.player);}
 assert.deepEqual(w.spirits.map(s=>+s.value.toFixed(6)),[4*f,12*f,40*f,4*f*1.5].map(v=>+v.toFixed(6)));
 const reaper=transformed({...ALL,reaper:1}),elite=enemy(reaper,20,0,{tier:'rare'}),plain=enemy(reaper,21);elite.hp=plain.hp=1;dealDamage(reaper,elite,5,reaper.player);dealDamage(reaper,plain,5,reaper.player);
 assert.deepEqual(reaper.spirits.map(s=>s.value),[24,4]);
 run(w,7.9);assert.equal(w.spirits.length,4);run(w,.2);assert.equal(w.spirits.length,0);
});

test('absorção: dentro do raio soma almas até o máximo, cura com Lamento e puxa espíritos próximos',()=>{
 const w=transformed({...ALL,wail:5});w.lich.souls=95;w.player.hp=500;
 const near=enemy(w,30);near.hp=1;w.spirits.push({id:900,x:2.5,y:0,value:4,age:0,ttl:8,source:near.id});
 tickLich(w,1/60);assert.equal(w.spirits.length,0);close(w.lich.souls,99-1.5/60,1e-6);close(w.player.hp,500+1000*.025);
 w.spirits.push({id:901,x:5,y:0,value:30,age:0,ttl:8});tickLich(w,.1);assert.ok(w.spirits[0].x<5,'espírito a 5 u é puxado');
 run(w,1);assert.equal(w.spirits.length,0);assert.ok(w.lich.souls>w.lich.stats.maxSouls-2&&w.lich.souls<=w.lich.stats.maxSouls,'excedente é perdido');
 const far=transformed();far.spirits.push({id:1,x:10,y:0,value:4,age:0,ttl:8});tickLich(far,.5);assert.equal(far.spirits[0].x,10,'fora do raio de puxar não se move');
});

test('Ceifada: arco frontal de 120° e 3,4 u, grátis, uma vez por golpe, recarga; sólidos bloqueiam',()=>{
 const w=transformed();const ahead=enemy(w,3),edge=enemy(w,3,3.2),behind=enemy(w,-2),far=enemy(w,5);
 assert.equal(castLich(w,'ceifada'),true);assert.equal(castLich(w,'ceifada'),false,'uma ação por vez');
 run(w,.27);assert.equal(lost(ahead),0,'o contato é a 0,28 s');run(w,.03);
 assert.equal(lost(ahead),90);assert.equal(lost(edge),0);assert.equal(lost(behind),0);assert.equal(lost(far),0);run(w,1);assert.equal(lost(ahead),90);
 const soulsBefore=w.lich.souls;assert.ok(castLich(w,'ceifada'));close(w.lich.souls,soulsBefore,1e-9);
 const wall=transformed();wall.arena.solids=[{kind:'box',x:1.5,y:0,width:.2,depth:6}];const hidden=enemy(wall,3);castLich(wall,'ceifada');run(wall,.6);assert.equal(lost(hidden),0);
 const reach=transformed({...ALL,reach:5},false),r=enemy(reach,4.1);castLich(reach,'ceifada');run(reach,.6);assert.equal(lost(r),Math.round(100*.9*1.3*1.25),'Foice Longa amplia alcance (4,2 u) e dano');
});

test('passo grande de tempo aplica o mesmo número de golpes que passos pequenos',()=>{
 const results=[];
 for(const dt of [1/240,1/60,.25,2]){
  const w=transformed(),a=enemy(w,3),b=enemy(w,4,.5);castLich(w,'colheita');run(w,.3,dt);const first=lost(a);
  castLich(w,'giratoria');run(w,3,dt);results.push([first,lost(a),lost(b),w.lich.form,w.lich.scythe]);
 }
 for(const r of results.slice(1))assert.deepEqual(r.slice(0,3),results[0].slice(0,3));
});

test('Colheita Tripla: gratuita, janela de 0,6 s entre golpes, finalizador em área e onda marcam Ceifado',()=>{
 const w=transformed();const near=enemy(w,2),line=enemy(w,5.5,.2),side=enemy(w,0,3.9),out=enemy(w,0,6);
 const souls=w.lich.souls;assert.ok(castLich(w,'colheita'));close(w.lich.souls,souls);assert.equal(castLich(w,'colheita'),false,'durante o golpe não continua');
 run(w,.31);assert.equal(lost(near),100);assert.equal(lost(side),0,'passo 1 só no arco frontal');run(w,.3);
 assert.equal(w.lich.combo.window>0,true);assert.equal(castLich(w,'ceifada'),false,'a janela só aceita a Colheita');
 const after=w.lich.souls;assert.ok(castLich(w,'colheita'));close(w.lich.souls,after,1e-9);run(w,.31);assert.equal(lost(near),100+110);run(w,.3);
 assert.ok(castLich(w,'colheita'));run(w,.79);assert.equal(lost(near),210);run(w,.02);
 assert.equal(lost(near),410,'finalizador ×2,0');assert.equal(lost(line),200,'onda de 6 u');assert.equal(lost(side),200,'giro de 360° a 4,2 u');assert.equal(lost(out),0);
 for(const e of [near,line,side]){assert.ok(e.reaped,'marcado');assert.equal(e.slow,.3);}
 run(w,.3);assert.equal(w.lich.cooldowns.colheita,0);assert.ok(castLich(w,'colheita'),'novo combo sem recarga');
 run(w,2.1);assert.equal(near.reaped,undefined,'a marca dura 2 s');
});

test('Colheita: janela expirada permite reiniciar o combo; Executor aumenta dano em alvo fraco e a marca',()=>{
 const w=transformed();castLich(w,'colheita');run(w,.6+.65);assert.equal(w.lich.combo,null);assert.equal(w.lich.cooldowns.colheita,0);assert.ok(castLich(w,'colheita'));
 const ex=transformed({...ALL,cyclone:0,executor:1}),weak=enemy(ex,2,0,{hp:1000,maxHp:10000}),strong=enemy(ex,2,.4);
 ex.player.spellDamage=10;castLich(ex,'colheita');run(ex,.6+.01);castLich(ex,'colheita');run(ex,.6);castLich(ex,'colheita');run(ex,1.01);
 assert.equal(lost(strong)-0,10+11+20);assert.equal(lost(weak)-9000,10+11+30);assert.equal(strong.reaped.remaining>3.5,true,'Executor marca por 4 s');
});

test('Foice Giratória: 15 almas, vai e volta acertando cada alvo uma vez por perna, bloqueia outras habilidades e pousa em catch',()=>{
 const w=transformed();const near=enemy(w,4),far=enemy(w,10.5),behind=enemy(w,-3);
 const souls=w.lich.souls;assert.ok(castLich(w,'giratoria'));close(w.lich.souls,souls-15);run(w,.38);assert.equal(w.lich.scythe,null,'sai da mão em 0,39 s');run(w,.02);
 assert.ok(w.lich.scythe);assert.equal(castLich(w,'ceifada'),false);assert.equal(castLich(w,'arco'),false);
 run(w,.9);assert.equal(lost(near),240,'ida + volta');assert.equal(lost(far),240);assert.equal(lost(behind),0);
 assert.ok(w.lich.scythe===null||w.lich.scythe.leg==='back');run(w,.4);assert.equal(w.lich.scythe,null);
 assert.equal(w.lich.action?.id,'catch');assert.equal(castLich(w,'ceifada'),false);run(w,.42);assert.equal(w.lich.action,null);assert.ok(castLich(w,'ceifada'));
 const wall=transformed();wall.arena.solids=[{kind:'box',x:3,y:0,width:.2,depth:6}];const protectedFoe=enemy(wall,6);castLich(wall,'giratoria');run(wall,2);assert.equal(lost(protectedFoe),0,'sólido faz a foice voltar');assert.equal(wall.lich.scythe,null);
});

test('Foice Giratória não existe sem o nó; Libertar Forma funciona a qualquer momento',()=>{
 const w=transformed({lichform:1});assert.equal(castLich(w,'giratoria'),false);assert.equal(castLich(w,'arco'),false);assert.equal(castLich(w,'ciclone'),false);
 assert.deepEqual(lichSlots(w).map(s=>[s.id,s.unlocked]),[['ceifada',true],['giratoria',false],['colheita',false],['arco',false],['ciclone',false],['libertar',true]]);
 castLich(w,'ceifada');assert.ok(castLich(w,'libertar'));assert.equal(w.lich.form,'none');assert.equal(w.lich.action,null);assert.ok(w.lich.entryCooldown>19);
 assert.deepEqual(LICH_SLOTS,['ceifada','giratoria','colheita','arco','ciclone','libertar']);
});

test('Gancho do Túmulo: linha frontal, puxão ampliado por Ceifado e chefes imóveis com lentidão',()=>{
 const w=transformed(),normal=enemy(w,6),marked=enemy(w,6,.6,{reaped:{remaining:3}}),side=enemy(w,0,5),boss=enemy(w,5,-.5,{isBoss:true});
 const souls=w.lich.souls;assert.ok(castLich(w,'arco'));close(w.lich.souls,souls-25);run(w,1.7);
 assert.ok(normal.x<5);assert.ok(marked.x<normal.x);assert.equal(side.hp,side.maxHp);assert.equal(boss.x,5);assert.ok(boss.slowTime>0);assert.equal(w.lich.scythe,null);
 const wall=transformed();wall.arena.solids=[{kind:'box',x:3,y:0,width:.2,depth:6}];const protectedFoe=enemy(wall,6);castLich(wall,'arco');run(wall,2);assert.equal(lost(protectedFoe),0);
});

test('sinergia: Giratória prolonga marca e Ciclone consome uma vez por alvo',()=>{
 const w=transformed(),e=enemy(w,4,0,{reaped:{remaining:1.5}});castLich(w,'giratoria');run(w,.7);assert.ok(e.reaped.remaining>1.5-.7);
 const a=transformed(),b=transformed();a.lich.souls=b.lich.souls=100;const marked=enemy(a,4.4,0,{reaped:{remaining:3}}),plain=enemy(b,4.4);castLich(a,'ciclone');castLich(b,'ciclone');run(a,1.6);run(b,1.6);assert.equal(lost(marked)-lost(plain),60);assert.equal(marked.reaped,undefined);
});

test('Ciclone da Morte: órbita de 360° por 1,4 s, até duas passagens por alvo, lentidão de 40% e ordem de sentido',()=>{
 const w=transformed();w.lich.souls=100;const ring=enemy(w,4.4,0),near=enemy(w,.8,0),out=enemy(w,7.5,0);
 const souls=w.lich.souls;assert.ok(castLich(w,'ciclone'));close(w.lich.souls,souls-40);run(w,.1);assert.equal(w.lich.moveFactor,.6);assert.equal(w.lich.scythe.kind,'ciclone');
 run(w,1.6);assert.equal(lost(ring),160,'duas passagens ×0,8');assert.equal(lost(near),0);assert.equal(lost(out),0);assert.equal(w.lich.moveFactor,1);assert.equal(w.lich.scythe,null);
 const slow=transformed(),p=slow.player;slow.lich.souls=100;castLich(slow,'ciclone');step(slow,.2,{x:1,y:1});assert.ok(Math.hypot(p.x,p.y)<p.moveSpeed*.2*.65);
});

test('recarga por habilidade, custo insuficiente e mira inválida não cobram almas',()=>{
 const w=transformed();w.lich.souls=14;assert.equal(castLich(w,'giratoria'),false);close(w.lich.souls,14);
 w.lich.souls=100;w.aim={x:NaN,y:0};assert.equal(castLich(w,'ceifada'),false);w.aim={x:9,y:0};
 assert.ok(castLich(w,'giratoria'));run(w,2);assert.equal(w.lich.action,null);const cd=w.lich.cooldowns.giratoria;assert.ok(cd>3&&cd<=4.01);assert.equal(castLich(w,'giratoria'),false);
 const gear=transformed();gear.modifiers.gearCooldown=50;castLich(gear,'giratoria');close(gear.lich.cooldowns.giratoria,3);
});

test('morte do jogador, troca de cena e pausa limpam a forma sem deixar foice, espíritos nem marcas',()=>{
 const w=transformed();const foe=enemy(w,3);castLich(w,'giratoria');run(w,.6);w.spirits.push({id:5,x:8,y:0,value:4,age:0,ttl:8});foe.reaped={remaining:1};
 dealDamage(w,w.player,5000,foe);assert.equal(w.player.hp,0);assert.equal(w.lich.form,'none');assert.equal(w.lich.scythe,null);assert.equal(w.spirits.length,0);assert.equal(foe.reaped,undefined);assert.equal(w.lich.entryCooldown,0);assert.equal(w.player.mpRegen,4);
 const scene=transformed();assert.ok(exitLich(scene,'scene'));assert.equal(scene.lich.entryCooldown,0);assert.equal(exitLich(scene,'scene'),false);
 const paused=transformed();paused.paused=true;assert.equal(castLich(paused,'ceifada'),false);const frozen=paused.lich.souls;step(paused,1);assert.equal(paused.lich.souls,frozen);
 const reset=createWorld({horde:0});assert.equal(reset.lich.form,'none');
 const lost=transformed();setLichRanks(lost,{});assert.equal(lost.lich.form,'none');
});

test('dano recebido na forma: Avatar reduz em 25% e o dano já passa pelo caminho comum de defesa',()=>{
 const w=transformed({...ALL,avatar:1}),plain=transformed(),foe=enemy(w,6);
 const a=dealDamage(w,w.player,100,foe).applied,b=dealDamage(plain,plain.player,100,enemy(plain,6)).applied;assert.ok(a<b);close(a/b,.75,.02);
});

test('simulação integrada: step() avança a forma, espíritos e golpes sem outro caminho de dano',()=>{
 const adv=(w,t)=>{for(let left=t;left>1e-9;left-=.25)step(w,Math.min(.25,left));};
 const w=field();enemy(w,3,0,{hp:300,maxHp:300});enterLich(w);adv(w,1);assert.equal(w.lich.form,'lich');
 const foe=w.actors.find(a=>a.team==='enemy');assert.ok(castLich(w,'ceifada'));adv(w,.6);assert.equal(foe.hp,187);
 assert.ok(castLich(w,'ceifada'));adv(w,.6);assert.equal(foe.hp,74);assert.ok(castLich(w,'ceifada'));adv(w,.7);
 const absorbed=w.lich.events.filter(e=>e.kind==='absorb');assert.equal(absorbed.length,1);assert.equal(absorbed[0].value,4);assert.equal(w.spirits.length,0);assert.ok(w.hits>=3);
});

 test('bônus base da forma: dano e defesa +25%, sem alterar atributos permanentes',()=>{
 const stats=lichStats({lichform:1});close(stats.damage.ceifada,1.25);close(stats.defenseFactor,1.25);
 const w=transformed(ALL,false),e=enemy(w,2);w.player.defense=20;
 castLich(w,'ceifada');run(w,.3);assert.equal(lost(e),Math.round(100*.9*1.25));
 const foe=enemy(w,8),hp=w.player.hp;dealDamage(w,w.player,100,foe);close(hp-w.player.hp,100*(1-25/(25+20)));assert.equal(w.player.defense,20);
 exitLich(w);const before=w.player.hp;dealDamage(w,w.player,100,foe);close(before-w.player.hp,50);assert.equal(w.player.defense,20);
 });

test('Colheita herda maestrias da Ceifada e ritmo acelera preparação junto do contato',()=>{
 const w=transformed(),plain=transformed();w.army={loadout:['lich'],mastery:{ceifada:Mastery.normalize('ceifada',{level:8,ranks:{power:2,reach:2,rhythm:2}}),colheita:Mastery.normalize('colheita',{level:5,ranks:{rhythm:2}})}};
 const target=enemy(w,3.8),outside=enemy(plain,3.8);castLich(w,'colheita');castLich(plain,'colheita');assert.ok(w.lich.action.duration<plain.lich.action.duration);assert.ok(w.lich.action.contact<plain.lich.action.contact);run(w,.32);run(plain,.32);assert.ok(lost(target)>100);assert.equal(lost(outside),0);assert.equal(w.army.mastery.ceifada.ranks.rhythm,2);
});
