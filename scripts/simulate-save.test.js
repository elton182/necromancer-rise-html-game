'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {options,validateSave,summarize}=require('./simulate-save');
test('CLI requires an export and bounds expensive or invalid scenarios',()=>{
  assert.throws(()=>options([]),/Uso/);
  assert.throws(()=>options(['--save','test.json','--waves','0']),/Waves/);
  assert.throws(()=>options(['--save','test.json','--runs','101']),/Limites/);
  assert.throws(()=>options(['--save','test.json','--profiles','teleport']),/Perfis/);
  assert.throws(()=>options(['--save','test.json','--frontline-damage-taken','0']),/Multiplicador/);
  assert.equal(options(['--save','test.json','--frontline-damage-taken','0.8']).frontlineDamageTaken,.8);
  assert.deepEqual(options(['--save','test.json','--waves','24,27']).waves,[24,27]);
  assert.throws(()=>validateSave({level:20}),/Exporte/);
});
test('summary distinguishes no minion death from a late death and caps no invented duration',()=>{
  const base={wave:27,profile:'hold',seconds:10,deaths:[],damage:{horde:30,player:70},kills:2,surroundedSeconds:3,outcome:'death'};
  assert.equal(summarize([base])[0].firstMinionDeathSeconds,null);
  const [s]=summarize([base,{...base,outcome:'clear',deaths:[{seconds:5}]}]);
  assert.equal(s.firstMinionDeathSeconds,5);
  assert.equal(s.runsWithMinionDeaths,1);
  assert.equal(s.clears,1);
  assert.equal(s.hordeDamagePercent,30);
});
