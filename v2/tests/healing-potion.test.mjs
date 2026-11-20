import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSession,transition,snapshot,applySave,stepSession} from '../scripts/session.mjs';
import {freshSave,normalizeSave} from '../scripts/save-model.mjs';
import {drinkPotion,tickPotion} from '../scripts/healing-potion.mjs';
import {rewardKill} from '../scripts/rewards.mjs';
import {dealDamage} from '../scripts/combat.mjs';

function session(classId='necromancer'){
 const save=freshSave();save.character.classId=classId;
 const s=createSession(save);transition(s,'training');
 s.world.actors=[s.world.player];s.world.player.hpRegen=0;
 return s;
}
test('todas as classes curam metade da vida em 5s sem empilhar goles',()=>{
 for(const id of ['necromancer','warrior','druid','mage','archer','mercenary']){
  const s=session(id),w=s.world,p=w.player;p.hp=p.maxHp*.1;
  assert.equal(drinkPotion(s),true);assert.equal(w.potionCharge,20);
  assert.equal(drinkPotion(s),false);
  for(let i=0;i<10;i++)stepSession(s,.25,{});
  assert.ok(Math.abs(p.hp-p.maxHp*.35)<1e-7,id);
  for(let i=0;i<10;i++)stepSession(s,.25,{});
  assert.ok(Math.abs(p.hp-p.maxHp*.6)<1e-7,id);assert.equal(w.potionHeal,null);
 }
});
test('não gasta goles cheios, incompletos, em pausa, morte ou cinemática',()=>{
 const s=session(),w=s.world,p=w.player;
 assert.equal(drinkPotion(s),false);p.hp=1;w.paused=true;assert.equal(drinkPotion(s),false);
 w.paused=false;w.adventure={cinematic:true};assert.equal(drinkPotion(s),false);
 w.adventure=null;w.potionCharge=9;assert.equal(drinkPotion(s),false);
 w.potionCharge=30;p.hp=0;assert.equal(drinkPotion(s),false);assert.equal(w.potionCharge,30);
});
test('pausa congela cura; dt longo não excede 50%, vida cheia nem ressuscita',()=>{
 const s=session(),w=s.world,p=w.player;p.hp=p.maxHp*.7;drinkPotion(s);
 w.paused=true;tickPotion(w,100);assert.equal(p.hp,p.maxHp*.7);
 w.paused=false;tickPotion(w,100);assert.equal(p.hp,p.maxHp);assert.equal(w.potionHeal,null);
 p.hp=1;drinkPotion(s);dealDamage(w,p,p.maxHp*100,w.boss);
 assert.equal(p.hp,0);assert.equal(w.potionHeal,null);tickPotion(w,10);assert.equal(p.hp,0);
});
test('cada abate válido restaura uma fração uma vez e respeita o limite',()=>{
 const s=session(),w=s.world;w.potionCharge=0;
 const enemy={xp:1};rewardKill(s,enemy);rewardKill(s,enemy);
 rewardKill(s,{xp:0});assert.equal(w.potionCharge,1);
 for(let i=0;i<9;i++)rewardKill(s,{xp:1});assert.equal(w.potionCharge,10);
 w.player.hp=1;assert.equal(drinkPotion(s),true);assert.equal(w.potionCharge,0);
 for(let i=0;i<40;i++)rewardKill(s,{xp:1});assert.equal(w.potionCharge,30);
});
test('carga parcial sobrevive a save e troca de cena; cura não sobrevive',()=>{
 const s=session(),w=s.world;w.player.hp=1;drinkPotion(s);rewardKill(s,{xp:1});
 const saved=JSON.parse(JSON.stringify(snapshot(s)));assert.equal(saved.character.potionCharge,21);
 transition(s,'menu');assert.equal(w.potionCharge,21);assert.equal(w.potionHeal,null);
 applySave(s,saved);transition(s,'training');assert.equal(w.potionCharge,21);assert.equal(w.potionHeal,null);
 const old=freshSave();delete old.character.potionCharge;assert.equal(normalizeSave(old).character.potionCharge,30);
 for(const [raw,expected] of [[-5,0],[999,30],[7.8,7],['bad',30]]){old.character.potionCharge=raw;assert.equal(normalizeSave(old).character.potionCharge,expected);}
});
