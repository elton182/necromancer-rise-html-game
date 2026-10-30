import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,stepSession,activateSlot,useProfile,transition} from '../scripts/session.mjs';
import {normalizeCampaign} from '../scripts/campaign-model.mjs';
import {startCampaign,nextStory,enterVillage,returnAdventure} from '../scripts/campaign.mjs';
import {launchLab,isLab,tickLab,setDummies,moveDummies,resetTest,setViewer,setClip,scrub,playAll,meterStats,history,setOptions,DUMMY_HP,MAX_DUMMIES} from '../scripts/lab.mjs';
import {TEST_PROFILE,equipGroup} from '../scripts/horde.mjs';
import {dealDamage} from '../scripts/combat.mjs';

const village=()=>{const s=createSession();s.save.campaign=normalizeCampaign({started:true,cleared:{1:1,2:1,3:1,4:1}});startCampaign(s);for(let i=0;i<200&&s.world.story;i++)nextStory(s);assert.ok(enterVillage(s));return s;};
const run=(s,t,input={})=>{for(let n=0;n<t-1e-8;n+=1/60)stepSession(s,Math.min(1/60,t-n),input);};
const dummies=w=>w.actors.filter(a=>a.labDummy);

test('Laboratório abre pela vila e pelo menu, nunca dentro de um encontro, e tem só bonecos e o personagem', () => {
 const s=village();assert.ok(launchLab(s));assert.ok(isLab(s));
 const w=s.world;assert.equal(w.actors.filter(a=>a.team==='enemy'&&!a.labDummy).length,0);assert.equal(dummies(w).length,1);
 assert.equal(launchLab(s),false,'já está no laboratório');
 returnAdventure(s);assert.equal(s.scene,'village');assert.equal(isLab(s),false);assert.equal(s.world.actors.some(a=>a.labDummy),false);
 const free=createSession();assert.ok(launchLab(free));assert.ok(isLab(free));
});

test('o boneco nunca morre, não dá recompensa e conta Tiro de Osso e a horda por origem', () => {
 const s=village();assert.ok(useProfile(s,TEST_PROFILE).ok);for(const [i,id] of ['raio','zombie','skeleton','archer'].entries())assert.ok(equipGroup(s.world,i,id,{preparation:true}).ok);assert.ok(launchLab(s));const w=s.world;
 let deaths=0;w.onEnemyDeath=()=>deaths++;
 const d=dummies(w)[0];Object.assign(w.player,{x:d.x,y:d.y+4,mp:999});w.aim={x:d.x,y:d.y};
 assert.ok(activateSlot(s,0),'Tiro de Osso');run(s,.8);
 const by=meterStats(w).by.map(x=>x.name);assert.ok(by.includes('Tiro de Osso'));
 run(s,6);const names=meterStats(w).by.map(x=>x.name);
 assert.ok(names.some(n=>['Zumbi','Esqueleto','Arqueiro Ósseo','Espectro','Abominação'].includes(n)),'a horda ataca o boneco: '+names);
 dealDamage(w,d,1e9,w.player);run(s,.1);assert.equal(d.hp,DUMMY_HP);assert.equal(deaths,0);assert.ok(w.actors.includes(d));
 assert.equal(w.drops.length,0);
});

test('teste cronometrado: arma, mede a janela, guarda o resultado uma vez e enche mana e recargas ao iniciar', () => {
 const s=village();launchLab(s);const w=s.world,d=dummies(w)[0];history.length=0;
 w.player.mp=1;w.castCooldown=3;w.spellCooldowns.chuva=5;
 resetTest(w,10);assert.equal(w.player.mp,w.player.maxMp);assert.equal(w.castCooldown,0);assert.equal(w.spellCooldowns.chuva,0);w.lab.testLabel='Build A';
 dealDamage(w,d,100,w.player,'Teste');run(s,5);dealDamage(w,d,100,w.player,'Teste');run(s,6);
 assert.equal(history.length,1);assert.equal(history[0].label,'Build A');assert.equal(history[0].duration,10);assert.equal(history[0].total,200);assert.equal(history[0].dps,20);
 run(s,2);assert.equal(history.length,1,'resultado não repete');dealDamage(w,d,999,w.player,'Teste');assert.equal(meterStats(w).total,200,'golpes depois do fim não contam');
});

test('opções: mana infinita, sem recargas, número e posição dos bonecos', () => {
 const s=village();launchLab(s);const w=s.world;
 w.player.mp=0;w.castCooldown=2;setOptions(w,{infiniteMana:true,noCooldown:true});run(s,.1);assert.equal(w.player.mp,w.player.maxMp);assert.equal(w.castCooldown,0);
 assert.equal(setDummies(w,99),MAX_DUMMIES);assert.equal(dummies(w).length,MAX_DUMMIES);assert.equal(setDummies(w,0),1);
 assert.ok(moveDummies(w,{x:6,y:-8}));assert.ok(Math.abs(dummies(w)[0].x-6)<.5);assert.equal(moveDummies(w,{x:NaN,y:0}),false);
 const x=dummies(w)[0].x;setDummies(w,3);assert.equal(dummies(w).length,3);assert.ok(Math.abs(dummies(w)[1].x-x)<1e-9,'o boneco central fica no lugar');
});

test('visualizador mostra um clipe por vez: pose, laço, arrastar, sequência e remoção', () => {
 const s=village();launchLab(s);const w=s.world,clips=[{name:'idle',duration:2},{name:'attack',duration:1},{name:'death',duration:1}];
 const v=setViewer(w,'warrior',clips);assert.equal(v.clip,'idle');assert.equal(v.actor.team,'neutral');
 run(s,.5);assert.deepEqual({a:v.actor.labPose.anim,p:v.actor.labPose.progress},{a:'idle',p:.25});
 assert.ok(setClip(w,'attack'));run(s,1.5);assert.ok(Math.abs(v.actor.labPose.progress-.5)<1e-6,'em laço');
 scrub(w,.75);run(s,1);assert.equal(v.actor.labPose.progress,.75,'arrastar pausa no quadro');
 assert.ok(playAll(w));run(s,2.05);assert.equal(v.clip,'attack');run(s,1);assert.equal(v.clip,'death');run(s,1.2);assert.equal(v.loop,true,'termina e volta ao laço');
 assert.equal(setClip(w,'inexistente'),false);
 assert.ok(!w.actors.some(a=>a.team==='enemy'&&a.labViewer),'não entra na horda como alvo');
 w.paused=true;const t=v.time;run(s,1);assert.equal(v.time,t,'pausa congela');
 w.paused=false;setViewer(w,null);assert.equal(w.actors.some(a=>a.labViewer),false);assert.equal(w.focus,null);
});

test('sair do laboratório limpa o estado e o save não recebe nada do laboratório', () => {
 const s=village();launchLab(s);setViewer(s.world,'zombie',[{name:'idle',duration:1}]);const before=JSON.stringify(s.save);
 run(s,1);transition(s,'menu');assert.equal(isLab(s),false);assert.equal(s.world.actors.some(a=>a.labDummy||a.labViewer),false);assert.equal(JSON.stringify(s.save),before);
});
