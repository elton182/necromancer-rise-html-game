// Barra montável dos atiradores e da forma humana da Druida (skill-loadout.mjs), com save e sessão.
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,normalizeSave} from '../scripts/save-model.mjs';
import {createSession,equipSession,activateSlot,snapshot} from '../scripts/session.mjs';
import {classLoadout,equipLoadout,normalizeLoadout,loadoutIds} from '../scripts/skill-loadout.mjs';
import {HUMAN_ACTIONS} from '../scripts/druid.mjs';
import {DRUID_HUMAN_IDS} from '../scripts/druid-model.mjs';

function session(classId,ranks,field,level=20){
 const save=freshSave();Object.assign(save.character,{classId,level,[field]:ranks});
 const s=createSession(save);s.scene='training';s.world.paused=false;s.world.aim={x:8,y:0};Object.assign(s.world.player,{x:0,y:0});s.world.player.mp=s.world.player.maxMp;
 return s;
}

test('barra padrão: as seis primeiras ações; ataque básico e Esquiva sempre presentes',()=>{
 assert.deepEqual(classLoadout('archer'),['arrow','pierce','leap','dodge','rain','fan']);
 assert.deepEqual(classLoadout('mercenary'),['quarrel','volley','bomb','dodge','mine','firebomb']);
 assert.deepEqual(classLoadout('druid'),['spark','chain','roots','dodge','storm','rejuvenate']);
 assert.equal(classLoadout('warrior'),null);assert.equal(classLoadout('necromancer'),null);
 const ids=loadoutIds('archer');
 assert.deepEqual(normalizeLoadout(['pierce','pierce','x','leap','rain','fan'],ids),['pierce','arrow','dodge','leap','rain','fan'],'repetidos e desconhecidos saem; básico e Esquiva voltam');
 const fixed=normalizeLoadout(['saraivadaSeguidora','pierce','leap','rain','fan','impactoCeleste'],ids);
 assert.ok(fixed.includes('arrow')&&fixed.includes('dodge'),'sem básico e Esquiva, eles substituem as últimas');
 assert.equal(new Set(fixed).size,6);
 assert.deepEqual(equipLoadout('archer',undefined,5,'saraivadaSeguidora').slots,['arrow','pierce','leap','dodge','rain','saraivadaSeguidora']);
 assert.deepEqual(equipLoadout('archer',undefined,1,'rain').slots,['arrow','rain','leap','dodge','pierce','fan'],'ação da barra troca de lugar');
 assert.equal(equipLoadout('archer',undefined,0,'impactoCeleste').ok,false,'o básico não sai');
 assert.equal(equipLoadout('archer',undefined,3,'impactoCeleste').ok,false,'a Esquiva não sai');
 assert.deepEqual(DRUID_HUMAN_IDS,HUMAN_ACTIONS.map(a=>a.id),'ids na ordem das ações humanas');
});

test('atirador: equipar exige o selo, o slot ativa a ação escolhida e o save guarda a barra',()=>{
 const s=session('archer',{shot:1,fan:1,saraivadaSeguidora:1},'marksmanRanks');
 assert.equal(equipSession(s,4,'impactoCeleste').message,'Libere na árvore.');
 assert.ok(equipSession(s,4,'saraivadaSeguidora').ok);
 assert.deepEqual(s.world.skillLoadout,['arrow','pierce','leap','dodge','saraivadaSeguidora','fan']);
 assert.ok(activateSlot(s,4));assert.equal(s.world.marksmanAction.id,'saraivadaSeguidora');
 const again=createSession(snapshot(s));assert.deepEqual(again.world.skillLoadout,['arrow','pierce','leap','dodge','saraivadaSeguidora','fan']);
 assert.deepEqual(normalizeSave(snapshot(s)).character.skillLoadout,['arrow','pierce','leap','dodge','saraivadaSeguidora','fan']);
 const m=session('mercenary',{redeDeCaca:1},'marksmanRanks');assert.ok(equipSession(m,2,'redeDeCaca').ok);m.world.aim={x:5,y:0};assert.ok(activateSlot(m,2));assert.equal(m.world.marksmanAction.id,'redeDeCaca');
});

test('saves antigos e de outras classes: barra padrão para atiradores, nenhuma para o Guerreiro',()=>{
 const raw=freshSave();raw.character.classId='archer';delete raw.character.skillLoadout;
 assert.deepEqual(normalizeSave(raw).character.skillLoadout,classLoadout('archer'));
 const bad=freshSave();bad.character.classId='mercenary';bad.character.skillLoadout=['arrow','nada'];
 assert.deepEqual(normalizeSave(bad).character.skillLoadout,classLoadout('mercenary'));
 const warrior=freshSave();warrior.character.classId='warrior';warrior.character.skillLoadout=['arrow'];
 assert.equal(normalizeSave(warrior).character.skillLoadout,undefined);
});

test('Druida: a forma humana usa a barra montável; na forma de lobo a barra é fixa',()=>{
 const s=session('druid',{roots:1,storm:1,chain:1,spark:1,wolf:1},'druidRanks');
 assert.ok(equipSession(s,1,'storm').ok);assert.deepEqual(s.world.skillLoadout,['spark','storm','roots','dodge','chain','rejuvenate']);
 assert.ok(activateSlot(s,1));assert.equal(s.world.druidAction.id,'storm');
 s.world.druidAction=null;s.world.castCooldown=0;s.world.druidForm='wolf';
 assert.equal(equipSession(s,1,'roots').ok,false);
});
