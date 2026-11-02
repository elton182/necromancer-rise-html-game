import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSession,equipSession,activateSlot,releaseWarriorSlot,snapshot} from '../scripts/session.mjs';
import {freshSave} from '../scripts/save-model.mjs';
test('troca persiste, migra saves e executa tornado no novo slot',()=>{
 const save=freshSave();Object.assign(save.character,{classId:'warrior',level:6,warriorRanks:{thrust:1,tornado:1}});
 const s=createSession(save);s.scene='training';s.world.paused=false;s.world.aim={x:8,y:0};
 assert.deepEqual(s.world.warriorLoadout,[0,1,2,3,4,5]);
 assert.equal(equipSession(s,0,5).ok,false);
 assert.equal(equipSession(s,0,4).ok,true);
 assert.deepEqual(s.world.warriorLoadout,[4,1,2,3,0,5]);
 assert.equal(activateSlot(s,0),true);assert.equal(s.world.warriorAction.index,4);
 assert.equal(releaseWarriorSlot(s,4),false);assert.equal(releaseWarriorSlot(s,0),true);
 assert.deepEqual(createSession(snapshot(s)).world.warriorLoadout,[4,1,2,3,0,5]);
});
