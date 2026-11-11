import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolSynergy,schoolSynergySources} from '../scripts/skill-synergy.mjs';
import {MARKSMAN_ACTIONS,actionDamage,cloneCopy} from '../scripts/marksman-model.mjs';
import {marksmanAction,tickMarksman} from '../scripts/marksman.mjs';
import {createWorld} from '../scripts/training-model.mjs';
import {druidAction,tickDruid,HUMAN_ACTIONS} from '../scripts/druid.mjs';
import {tickCompanions} from '../scripts/companions.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {warriorAction,tickWarrior} from '../scripts/warrior.mjs';
import {snapshotFor} from '../scripts/progression.mjs';
import Build from '../scripts/shared-build.mjs';

function field(classId,ranks){const key=classId==='druid'?'druidRanks':classId==='warrior'?'warriorRanks':'marksmanRanks';const w=createWorld({horde:0,character:{classId,level:40,[key]:ranks,equipment:{}}});w.actors=[w.player];Object.assign(w.player,{x:0,y:0,damage:1000,spellDamage:1000,mp:10000,maxMp:10000,hp:50000,maxHp:50000,defense:0});w.aim={x:8,y:0};w.random=()=>.5;w.arena={bounds:{minX:-40,maxX:40,minY:-40,maxY:40},solids:[]};return w;}
function target(w,x=5){const a={id:w.nextId++,team:'enemy',dummy:true,x,y:0,radius:.3,hp:1e7,maxHp:1e7,animation:'idle',animationTime:0,timer:0};w.actors.push(a);return a;}
function advance(w,time){for(let i=0;i<Math.ceil(time*60);i++){const dt=1/60;w.time+=dt;w.castCooldown=Math.max(0,w.castCooldown-dt);if(w.classId==='warrior')tickWarrior(w,dt);else if(w.classId==='druid')tickDruid(w,dt);else tickMarksman(w,dt);tickCompanions(w,dt);}}
const def=(classId,id)=>MARKSMAN_ACTIONS[classId].find(d=>d.id===id);
const cast=(w,id)=>marksmanAction(w,MARKSMAN_ACTIONS[w.classId].findIndex(d=>d.id===id));
const dcast=(w,id)=>druidAction(w,HUMAN_ACTIONS.findIndex(d=>d.id===id));

test('Fogo: pontos nas outras magias somam 2% ao dano base; os próprios não realimentam',()=>{
 const meteor=def('mage','meteor');
 assert.equal(schoolSynergy('mage',{meteor:5},'meteor'),0);
 assert.equal(schoolSynergy('mage',{meteor:1,fireball:3,combustion:5},'meteor'),.16);
 assert.equal(actionDamage(meteor,1000,{meteor:5,fireball:3,combustion:5}),4992); // 3200 × (1 + 0,40 + 0,16)
 assert.equal(schoolSynergy('mage',{meteor:5},'fireball'),.1);
 assert.equal(schoolSynergy('mage',{fireball:3},'meteor'),.06);
});
test('sinergias não atravessam elementos, classes ou passivas globais; pontos inválidos não criam bônus',()=>{
 const r={fireball:3,intellect:5,wisdom:5,vitality:5,naoExiste:1000};
 assert.equal(schoolSynergy('mage',r,'frost'),0);assert.equal(schoolSynergy('mage',r,'bolt'),0);
 assert.equal(schoolSynergy('archer',r,'shot'),0);assert.equal(schoolSynergy('mage',{fireball:999},'meteor'),.06,'limita ao máximo do nó');
 assert.equal(schoolSynergy('mage',{fireball:-4},'meteor'),0);assert.equal(schoolSynergy('mage',{fireball:NaN},'meteor'),0);
});
test('variantes herdam os pontos da origem sem duplicar doações; Echo não conta duas vezes no Teleporte',()=>{
 const r={meteor:5,fireball:3,chuvaDeFogo:1};
 assert.equal(schoolSynergy('mage',r,'chuvaDeFogo'),.06);
 assert.equal(schoolSynergy('mage',r,'fireball'),.1,'variante não doa o mesmo investimento outra vez');
 assert.equal(schoolSynergy('mage',{blink:3,echo:3},'blink'),0);
 assert.equal(schoolSynergy('mage',{blink:3,echo:3,lazerArcano:5},'blink'),.1);
});
test('cinco classes têm sinergias entre ações e fontes legíveis; Necromante mantém o modelo explícito',()=>{
 for(const [classId,donor,receiver]of [['warrior','slash','thrust'],['druid','storm','spark'],['archer','rain','fan'],['mercenary','mine','firebomb'],['mage','meteor','fireball']]){
  assert.equal(schoolSynergy(classId,{[donor]:5},receiver),.1,classId);
  assert.deepEqual(schoolSynergySources(classId,{[donor]:5},receiver).map(s=>[s.id,s.points,s.bonus]),[[donor,5,.1]]);
 }
 assert.equal(schoolSynergy('necromancer',{bolt:5},'rain'),0,'não sobrepõe regra genérica');
 assert.equal(Build.effects({bolt:5})['Dano da Chuva de Ossos'],20,'preserva +4% por ponto');
 assert.equal(Build.effects({rain:5})['Dano do Tiro de Osso'],20);
});
test('Meteoro aplica sinergia ao impacto e ao chão em chamas',()=>{
 const results=[];
 for(const rank of [1,3]){const w=field('mage',{meteor:1,fireball:rank,firewall:1}),e=target(w,8);assert.ok(cast(w,'meteor'));advance(w,.8);const z=w.marksmanZones.find(z=>z.kind==='rain');assert.ok(z);const pulse=z.burn.damage;advance(w,1.4);results.push([z.damage,pulse,e.maxHp-e.hp]);}
 assert.ok(results[1].every((n,i)=>n>results[0][i]));
});
test('Combustão e Familiar recebem investimento de Fogo sem fortalecer a Seta Arcana',()=>{
 const results=[];
 for(const rank of [1,3]){
  const r={fireball:rank,combustion:1,familiarDeFogo:1},w=field('mage',r);target(w);cast(w,'fireball');advance(w,.9);const burn=w.marksmanZones.find(z=>z.kind==='fire').damage;
  w.marksmanAction=null;w.marksmanCooldowns={};cast(w,'familiarDeFogo');advance(w,1);const shot=w.marksmanShots.find(s=>s.def?.name==='Familiar de Fogo');assert.ok(shot);results.push([burn,shot.damage,actionDamage(def('mage','arcane'),1000,r)]);
 }
 assert.ok(results[1][0]>results[0][0]);assert.ok(results[1][1]>results[0][1]);assert.equal(results[1][2],results[0][2]);
});
test('Gelo fortalece dano do Golem sem inflar sua vida; Arcano fortalece o dano copiado pelo Clone',()=>{
 const results=[];
 for(const rank of [1,5]){const w=field('mage',{frost:rank,esferaDeGelo:1,golemDeGelo:1});cast(w,'golemDeGelo');advance(w,.6);const a=w.actors.find(a=>a.companion==='iceGolem');results.push([a.maxHp,a.damage]);}
 assert.equal(results[0][0],results[1][0]);assert.ok(results[1][1]>results[0][1]);
 const clone=def('mage','clone');assert.equal(cloneCopy(clone,{clone:1}),.5);assert.equal(cloneCopy(clone,{clone:1,lazerArcano:5}),.55);assert.equal(cloneCopy(clone,{clone:1,fireball:3}),.5);
});
test('Natureza fortalece ataques dos lobos e da planta sem cura ou duplicação de vida',()=>{
 const results=[];
 for(const rank of [1,3]){const w=field('druid',{lobo:1,roots:rank,plantaCarnivora:1});dcast(w,'lobo');advance(w,.8);const a=w.actors.find(a=>a.companion==='druidWolf');dcast(w,'roots');advance(w,.8);const p=w.actors.find(a=>a.companion==='carnivorousPlant');results.push([a.maxHp,a.damage,p.maxHp,p.damage]);}
 assert.equal(results[0][0],results[1][0]);assert.equal(results[0][2],results[1][2]);assert.ok(results[1][1]>results[0][1]);assert.ok(results[1][3]>results[0][3]);
});
test('sinergias de Escudo entram no arremesso/reflexão, não alteram bloqueio ou custo',()=>{
 const values=[];
 for(const rank of [1,3]){const w=field('warrior',{bash:rank,shieldThrow:1,armaduraDeEspinhos:1});w.equipment.shield={};assert.ok(warriorAction(w,5));advance(w,.2);const shield=w.warriorShieldFlight.damage,e=target(w);const before=e.hp;dealDamage(w,w.player,1000,e);values.push([shield,before-e.hp,w.player.mp]);}
 assert.ok(values[1][0]>values[0][0]);assert.ok(values[1][1]>values[0][1]);assert.equal(values[1][2],values[0][2]);
});
test('ficha do Mago usa o mesmo dano e sinergia que o combate',()=>{
 const w=field('mage',{fireball:3,firewall:1,meteor:1});const snap=snapshotFor(w,{},40),r=w.marksmanRanks;
 assert.equal(snap.skills.find(s=>s.id==='meteor').damage,actionDamage(def('mage','meteor'),snap.attributes.spell,r));
});
