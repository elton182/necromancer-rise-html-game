import test from 'node:test';
import assert from 'node:assert/strict';
import EQ from '../scripts/shared-equipment.mjs';
import {reward,waveSize,spawnTimes,spawnPoint,completeWave,summary,selectWave,MODES} from '../scripts/arena-model.mjs';
import {createSession,snapshot,applySave,stepSession} from '../scripts/session.mjs';
import {normalizeCampaign} from '../scripts/campaign-model.mjs';
import {startCampaign,nextStory,enterVillage,launchArena,returnAdventure,tickAdventure,launchStage} from '../scripts/campaign.mjs';
import {importSave,normalizeSave,freshSave} from '../scripts/save-model.mjs';
import {dealDamage} from '../scripts/combat.mjs';
import {relicLevel,relicPrice,buy} from '../scripts/gear.mjs';

const village=()=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1,4:1}});startCampaign(s);for(let i=0;i<200&&s.world.story;i++)nextStory(s);assert.ok(enterVillage(s));return s;};
const advance=(s,n,dt=.25)=>{for(let i=0;i<n;i++)tickAdventure(s,dt);};
const clearField=s=>{for(const e of [...s.world.actors])if(e.team==='enemy'&&e.hp>0)dealDamage(s.world,e,1e9,s.world.player);};
// Mata tudo a cada passo até a wave em andamento concluir.
function playWave(s){const r=s.world.adventure,target=r.completed+1;for(let i=0;i<4000&&r.completed<target;i++){clearField(s);advance(s,1,.5);}assert.equal(r.completed,target);}

test('regras: recompensa, tamanho da wave e cadência de nascimento',()=>{
 assert.deepEqual(reward(1),{gold:5,xp:28});assert.deepEqual(reward(10),{gold:23,xp:100});
 assert.equal(waveSize(1),6);assert.equal(waveSize(500),60);assert.ok(waveSize(30)<=60);
 const t=spawnTimes(30,Math.random);assert.equal(t[0],0);for(let i=1;i<t.length;i++){const d=t[i]-t[i-1];assert.ok(d>=.6-1e-9&&d<=1.2+1e-9);}
 for(let i=0;i<50;i++){const p=spawnPoint(Math.random,{x:0,y:10});assert.ok(Math.abs(Math.hypot(p.x,p.y)-16)<1e-9);assert.ok(Math.hypot(p.x,p.y-10)>=9-1e-9);}
 assert.deepEqual(MODES,['expedition','classic']);
});
test('seleção só aceita waves liberadas e conclusão libera a seguinte uma vez',()=>{
 const p=EQ.progress({best:3,selected:2});assert.equal(p.unlocked,4);assert.equal(selectWave(p,4).selected,4);assert.equal(selectWave(p,5),null);assert.equal(selectWave(p,0),null);assert.equal(selectWave(p,1.5).selected,1);assert.equal(selectWave(p,NaN),null);
 const a=completeWave(p,4);assert.equal(a.progress.best,4);assert.equal(a.progress.selected,5);assert.equal(a.record,true);
 const b=completeWave(a.progress,2);assert.equal(b.progress.best,4);assert.equal(b.record,false);assert.equal(completeWave(p,9).progress.best,3);
 assert.match(summary({start:2,completed:0},p),/antes de concluir/);
});
test('Pedra do Infinito: ponto na vila; sem vila liberada a arena não abre',()=>{
 const s=village();assert.ok(s.world.landmarks.some(l=>l.id==='endless'&&l.name==='Pedra do Infinito'));
 const fresh=createSession();assert.equal(launchArena(fresh),false);assert.equal(fresh.scene,'menu');
});
test('arena: waves sucessivas pagam uma vez, sobem o recorde e escalam por wave',()=>{
 const s=village();s.save.character.gold=0;assert.ok(launchArena(s));const w=s.world,r=w.adventure;assert.equal(s.scene,'training');assert.equal(r.kind,'arena');assert.equal(w.arena.id,'arena');w.player.hp=w.player.maxHp=1e8;
 advance(s,20,.25);assert.equal(r.wave,1);assert.ok(r.active);
 const e=w.actors.find(a=>a.team==='enemy');assert.ok(e);assert.equal(e.gearWave,1);assert.equal(w.gearLevel,1);
 playWave(s);
 assert.equal(s.save.character.waveProgress.best,1);assert.equal(s.save.character.waveProgress.selected,2);
 const gold=s.save.character.gold;advance(s,2,.1);assert.equal(s.save.character.gold,gold,'sem pagamento duplicado');
 playWave(s);assert.equal(s.save.character.waveProgress.best,2);assert.equal(r.wave,2);assert.equal(w.gearLevel,2);
});
test('arena começa na wave escolhida e uma repetição não reduz o recorde',()=>{
 const s=village();s.save.character.waveProgress=EQ.progress({best:4,selected:2});assert.ok(launchArena(s));const r=s.world.adventure;s.world.player.hp=s.world.player.maxHp=1e8;advance(s,20,.25);assert.equal(r.wave,2);
 const e=s.world.actors.find(a=>a.team==='enemy');assert.ok(e);assert.equal(e.gearWave,2);assert.equal(e.maxHp,Math.round(e.type.hp*1.12));
 playWave(s);assert.equal(s.save.character.waveProgress.best,4);assert.equal(s.save.character.waveProgress.selected,2);
});
test('sair pelo portal ou morrer encerra a corrida, limpa o campo e mantém o recorde',()=>{
 const s=village();assert.ok(launchArena(s));const w=s.world;w.player.hp=w.player.maxHp=1e8;advance(s,10,.25);playWave(s);const best=s.save.character.waveProgress.best;
 advance(s,40,.25);assert.ok(w.actors.some(a=>a.team==='enemy'));
 returnAdventure(s);assert.equal(s.scene,'village');assert.equal(w.adventure,null);assert.ok(!w.actors.some(a=>a.team==='enemy'));assert.match(w.notice,/Arena Infinita/);assert.equal(s.save.character.waveProgress.best,best);
 assert.ok(launchArena(s));s.world.player.hp=0;stepSession(s,.1,{});assert.equal(s.scene,'dead');returnAdventure(s);assert.equal(s.scene,'village');assert.equal(s.save.character.waveProgress.best,best);assert.equal(s.world.hostileShots.length,0);
});
test('recorde persiste no save e na importação do arquivo antigo (inclusive camp.eb)',()=>{
 const s=village();s.save.character.waveProgress=EQ.progress({best:7,selected:3});const saved=snapshot(s);assert.deepEqual(saved.character.waveProgress,{best:7,unlocked:8,selected:3});
 const again=createSession(saved);assert.equal(again.save.character.waveProgress.best,7);applySave(s,saved);assert.equal(s.save.character.waveProgress.selected,3);
 const old=importSave(JSON.stringify({level:5,maxHp:200,learnedSkills:[],waveProgress:{best:2,selected:1},camp:{eb:9}}));assert.equal(old.character.waveProgress.best,9);assert.equal(old.character.waveProgress.selected,1);
 assert.deepEqual(freshSave().character.waveProgress,{best:0,unlocked:1,selected:1});assert.equal(freshSave().settings.waveMode,'expedition');
 assert.throws(()=>normalizeSave({...freshSave(),settings:{waveMode:'x'}}),/waves/i);assert.throws(()=>normalizeSave({...freshSave(),character:{waveProgress:[]}}),/Progresso/);
 const clamp=normalizeSave({...freshSave(),character:{waveProgress:{best:99999,selected:-4}}});assert.equal(clamp.character.waveProgress.best,1000);assert.equal(clamp.character.waveProgress.selected,1);
});
test('mercador da vila vende peças do nível da maior wave liberada; o menu mantém a configuração',()=>{
 const s=village();s.save.character.waveProgress=EQ.progress({best:11});s.save.settings.gearLevel=3;s.save.character.gold=10000;
 assert.equal(relicLevel(s),12);assert.equal(relicPrice(s),EQ.price(12));assert.ok(buy(s,'staff').ok);assert.equal(s.save.character.gearBag.at(-1).level,12);
 const menu=createSession();menu.save.settings.gearLevel=3;menu.save.character.waveProgress=EQ.progress({best:11});assert.equal(relicLevel(menu),3);
});
test('campanha comum não é afetada: fase não usa waves da arena',()=>{
 const s=village();s.save.character.waveProgress=EQ.progress({best:5});assert.ok(launchStage(s,2));assert.notEqual(s.world.adventure.kind,'arena');assert.equal(s.save.character.waveProgress.best,5);
});
