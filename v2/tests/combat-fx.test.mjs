import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,step,dealDamage} from '../scripts/training-model.mjs';
import {V2_KING} from '../scripts/fallen-king.mjs';
import King from '../scripts/shared-fallen-king.mjs';
import {fx,hitFx,MAX_ONE_SHOT} from '../scripts/vfx-events.mjs';
import {castBolt} from '../scripts/combat.mjs';
import {spawnEnemy} from '../scripts/enemies.mjs';
import {TEST_PROFILE,TYPES,normalizeHorde,equipGroup,members,revive} from '../scripts/horde.mjs';
// Efeitos visuais e a revisão do Rei Caído na v2: a simulação descreve o que aconteceu; o desenho está em vfx.mjs.
const advance=(w,t)=>{for(let n=0;n<t-1e-8;n+=1/60)step(w,Math.min(1/60,t-n));};
function arena(){const w=createWorld({horde:0});w.actors=[w.player];w.arena={bounds:{minX:-30,maxX:30,minY:-30,maxY:30},solids:[]};Object.assign(w.player,{x:0,y:0,hp:100000,maxHp:100000,hpRegen:0,defense:0});return w;}
function king(w,props={}){const e=w.boss;w.actors.push(e);Object.assign(e,{x:0,y:-8,hp:1000,maxHp:1000,kingGap:0,kingCd:{slash:99,leap:99,summon:99},kingPhase2:false,kingRoar:null,...props});return e;}
const fxOf=(w,name)=>w.effects.filter(f=>f.fx===name);

test('o modelo compartilhado do Rei não é alterado pelos ajustes da v2', () => {
 assert.ok(King.skills.leap.radius===2.6&&King.skills.slash.range===2.8&&King.ENRAGE===.5);
 assert.ok(V2_KING.leapRadius[0]>1&&V2_KING.leapRadius[1]>=V2_KING.leapRadius[0]);
});

test('Queda do Rei: raio maior que o canônico e chão em chamas que acaba sozinho', () => {
 const run=distance=>{const w=arena(),e=king(w,{x:0,y:-6,kingCd:{slash:99,leap:0,summon:99}});advance(w,.1);assert.equal(e.king.kind,'leap');w.player.x=distance;const before=w.player.hp;advance(w,1.6);return {w,e,lost:before-w.player.hp};};
 const near=run(3.4),far=run(V2_KING.leapRadius[0]*King.skills.leap.radius+.4);
 assert.ok(near.lost>0,'3,4 u fica fora do raio canônico (2,6 u), mas dentro do novo');
 assert.equal(far.lost,0);
 const zone=near.w.hostileZones.find(z=>z.source===near.e.id);
 assert.ok(zone&&zone.fire&&Math.abs(zone.radius-2.6*V2_KING.leapRadius[0]*V2_KING.fireRatio)<1e-9);
 assert.equal(zone.span,V2_KING.fireLife[0]);
 assert.ok(fxOf(near.w,'shockwave').length===1&&near.w.effects.some(f=>f.fx==='fireField'||f.hostileZone));
 near.w.player.x=0;const hp=near.w.player.hp;advance(near.w,V2_KING.fireLife[0]+.6);
 assert.ok(near.w.player.hp<hp,'o fogo causa dano a cada segundo');assert.equal(near.w.hostileZones.length,0);
});

test('Corte Real: alcance e abertura maiores, com travamento de direção preservado', () => {
 const run=distance=>{const w=arena(),e=king(w,{x:0,y:0,kingCd:{slash:0,leap:99,summon:99}});w.player.x=2.5;advance(w,.05);assert.equal(e.king.kind,'slash');w.player.x=distance;const before=w.player.hp;advance(w,1);return before-w.player.hp;};
 assert.ok(run(3.2)>0&&run(2.8*V2_KING.slashRange[0]+.2)===0);
});

test('Fase II: transição ocupa o chefe, não ataca durante o rugido e depois volta mais rápido', () => {
 const w=arena(),e=king(w,{x:0,y:-2,hp:1000,kingCd:{slash:0,leap:99,summon:99}});w.player.x=0;w.player.y=0;
 advance(w,.05);assert.equal(e.king.kind,'slash');advance(w,1.7);e.hp=490;
 const seen=new Set();let start=null;const hp=w.player.hp;
 for(let n=0;n<240;n++){step(w,1/60);for(const f of fxOf(w,'roar'))seen.add(f.id);if(e.kingRoar&&start===null)start=n;if(e.kingRoar){assert.equal(e.king,null);assert.ok(['slam_windup','slam','slam_recover'].includes(e.pose.anim));}}
 assert.equal(e.kingPhase2,true);assert.notEqual(start,null);assert.equal(seen.size,1,'um único rugido');
 assert.equal(e.kingRoar,null);
 assert.ok(w.player.hp<=hp);
});

test('Fase II: golpes ocorrem mais depressa e o Corte se encadeia em par', () => {
 const impactAt=phase2=>{const w=arena(),e=king(w,{x:0,y:-6,kingPhase2:phase2,kingCd:{slash:99,leap:0,summon:99}});let n=0;advance(w,.02);while(e.king&&e.king.index<2&&n<400){step(w,1/60);n++;}return n;};
 const slow=impactAt(false),fast=impactAt(true);
 assert.ok(fast/slow<.8&&fast/slow>.7,`${fast} vs ${slow}`);
 const starts=phase2=>{const w=arena(),e=king(w,{x:0,y:0,kingPhase2:phase2,kingCd:{slash:0,leap:99,summon:99}});w.player.x=2;const times=[];let last=null;for(let n=0;n<150;n++){step(w,1/60);if(e.king&&e.king!==last&&e.king.kind==='slash')times.push(n/60);last=e.king;}return times;};
 const one=starts(false),two=starts(true);
 assert.equal(one.length,1);assert.ok(two.length>=2&&two[1]-two[0]<1.6,'segundo corte encadeado');
});

test('Chamado da Coroa: avisos de runas acompanham a preparação e a chegada gera efeito', () => {
 const w=arena(),e=king(w,{x:0,y:-6,hp:400,kingPhase2:true,kingCd:{slash:99,leap:99,summon:0}});
 advance(w,.3);assert.equal(e.king.kind,'summon');
 const runes=w.effects.filter(f=>f.fx==='summonRune'&&f.kingWarning===e.id);
 assert.equal(runes.length,3);assert.ok(runes.every(f=>f.harmless&&f.progress>0&&f.progress<1));
 const p1=runes[0].progress;advance(w,.2);assert.ok(w.effects.find(f=>f.id===runes[0].id).progress>p1);
 advance(w,.6);assert.equal(w.actors.filter(a=>a.kingOwner===e.id).length,2);
 assert.ok(fxOf(w,'summonBurst').length>=3);assert.ok(!w.effects.some(f=>f.fx==='summonRune'&&f.kingWarning));
});

test('Salto: aviso rúnico preenche até o impacto e a morte do Rei limpa avisos, fogo e transição', () => {
 const w=arena(),e=king(w,{x:0,y:-6,kingCd:{slash:99,leap:0,summon:99}});advance(w,.5);
 const warn=w.effects.find(f=>f.kingWarning===e.id&&f.fx==='dangerRune');assert.ok(warn&&warn.progress>.2&&warn.progress<.5);
 advance(w,1.2);assert.ok(w.hostileZones.some(z=>z.source===e.id));
 e.kingRoar={time:.2};dealDamage(w,e,1e9,w.player);
 assert.equal(e.kingRoar,null);assert.equal(w.hostileZones.length,0);assert.equal(w.effects.filter(f=>f.kingWarning===e.id).length,0);
});

test('golpes de inimigos geram faíscas só quando causam dano', () => {
 const w=arena(),e=spawnEnemy(w,0,1,0);
 dealDamage(w,w.player,30,e);const hit=fxOf(w,'impact');assert.equal(hit.length,1);
 assert.ok(Math.abs(Math.hypot(hit[0].dx,hit[0].dy)-1)<1e-9&&hit[0].x===w.player.x&&/^#/.test(hit[0].color));
 w.dash.remaining=.1;dealDamage(w,w.player,30,e);assert.equal(fxOf(w,'impact').length,1,'Dash bloqueia o dano e o efeito');
 w.dash.remaining=0;dealDamage(w,e,30,w.player);assert.equal(fxOf(w,'impact').length,1,'dano do jogador não gera faísca hostil');
 assert.equal(hitFx(w,null,e),null);
});

test('ataques corpo a corpo e à distância mostram rastro, disparo e área', () => {
 const melee=arena(),e=spawnEnemy(melee,0,1,0);e.abilityCd=99;advance(melee,.2);
 assert.ok(fxOf(melee,'slash').length>=1&&fxOf(melee,'impact').length>=1);
 const shooter=arena(),a=spawnEnemy(shooter,1,0,-6);a.abilityCd=99;a.atkTimer=0;advance(shooter,.1);
 assert.ok(fxOf(shooter,'muzzle').length>=1);assert.ok(shooter.effects.some(f=>f.fx==='projectile'&&f.shot==='arrow'));
 const brute=arena(),b=spawnEnemy(brute,2,0,-4,{legacy:true});b.abilityCd=0;advance(brute,.3);
 assert.ok(brute.effects.some(f=>f.enemyWarning===b.id&&f.fx==='dangerRune'));advance(brute,.95);assert.ok(fxOf(brute,'shockwave').length>=1);
});

test('Tiro de Osso mostra o lançamento no jogador e o impacto no alvo', () => {
 const w=arena(),e=spawnEnemy(w,0,5,0);e.abilityCd=99;e.atkTimer=99;w.aim={x:10,y:0};w.player.mp=80;w.castCooldown=0;
 assert.ok(castBolt(w));const cast=fxOf(w,'boltCast')[0];assert.equal(cast.dx,1);assert.equal(cast.dy,0);assert.ok(cast.duration>=.4);
 advance(w,.5);assert.ok(w.effects.some(f=>f.fx==='impact'&&f.kind==='boneImpact'));
});

test('invocar, equipar e levantar integrantes mostra círculos de runas na cor do grupo', () => {
 const w=createWorld({armyMode:'groups',army:normalizeHorde({profile:TEST_PROFILE,loadout:['raio',...TYPES]})});w.actors=w.actors.filter(a=>a.team!=='enemy');
 assert.equal(fxOf(w,'summonRune').length,0,'a formação inicial não repete o ritual');
 equipGroup(w,1,'empty');equipGroup(w,1,'zombie',{preparation:true});
 const zombies=members(w,'zombie'),runes=fxOf(w,'summonRune');
 assert.equal(runes.length,zombies.length);assert.ok(runes.every(f=>f.color==='#9dbf68'&&f.radius>1));
 const m=zombies[0];dealDamage(w,m,10000);w.effects=[];assert.ok(revive(w,m.id));
 assert.equal(fxOf(w,'summonRune').length,1);
});

test('efeitos pontuais têm teto, expiram sozinhos e não contam os avisos contínuos', () => {
 const w=arena();for(let i=0;i<MAX_ONE_SHOT+30;i++)fx(w,'impact',{x:0,y:0});
 assert.equal(fxOf(w,'impact').length,MAX_ONE_SHOT);
 w.effects.push({id:'aviso',fx:'dangerRune',visual:true,time:0,duration:10});assert.equal(fx(w,'impact',{x:0,y:0}),null);
 advance(w,1);assert.equal(fxOf(w,'impact').length,0);assert.ok(w.effects.some(f=>f.id==='aviso'));
});
