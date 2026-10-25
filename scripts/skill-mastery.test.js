'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('./skill-mastery-model.js'),Equipment=require('./equipment-model.js'),Build=require('../build-simulator/model.js');
test('standalone release embeds current mastery sources and persists the progression fields',()=>{
 const fs=require('node:fs'),path=require('node:path'),html=fs.readFileSync(path.join(__dirname,'../necromancer-canvas.html'),'utf8').replace(/\r\n/g,'\n');
 for(const file of ['skill-mastery-model.js','skill-mastery.js','skill-mastery.css'])assert.ok(html.includes(fs.readFileSync(path.join(__dirname,file),'utf8').replace(/\r\n/g,'\n').trim()),'Missing embedded source: '+file);
 assert.ok(html.includes('skillMastery:player.skillMastery'));assert.ok(html.includes('skillMastery:d.skillMastery'));
});
test('all 12 skills start unchanged and each can spend 19 separate points',()=>{
 assert.equal(M.ids.length,12);
 for(const id of M.ids){
  const fresh=M.normalize(id);assert.equal(fresh.level,1);assert.equal(M.points(fresh),0);
  assert.ok(Object.values(M.bonus(id,fresh)).every(v=>v===0));
  const state=M.gain(id,fresh,1e8).state;assert.equal(state.level,20);assert.equal(state.xp,0);assert.equal(M.points(state),19);
  for(const n of M.skills[id].nodes)while(!M.reason(id,state,n.id))M.invest(id,state,n.id);
  assert.equal(M.spent(state),19);assert.equal(M.points(state),0);assert.ok(M.bonus(id,state).cooldown<=50);
 }
});
test('XP remains independent, crosses several levels and catches up without overshooting bonus XP',()=>{
 const save=M.migrate();save.zombie=M.gain('zombie',save.zombie,80).state;
 assert.equal(save.zombie.level,2);assert.equal(save.raio.level,1);assert.equal(M.points(save.zombie),1);
 assert.equal(M.gain('zombie',M.normalize('zombie'),40,60).state.level,2);
 const amount=5000,one=M.gain('dash',{},amount,30).state;
 let many=M.normalize('dash');for(let i=0;i<100;i++)many=M.gain('dash',many,amount/100,30).state;
 assert.equal(one.level,many.level);assert.ok(Math.abs(one.xp-many.xp)<1e-6);
 for(const bad of [NaN,Infinity,-20,0])assert.deepEqual(M.gain('dash',{},bad).state,M.normalize('dash'));
});
test('save migration is idempotent, caps corrupted budgets and enforces dependencies',()=>{
 const input={zombie:{level:8,xp:999999,ranks:{power:500,power_deep:500,body:500,command:500}},raio:{level:1,ranks:{power_deep:5}},bogus:{level:20}};
 const save=M.migrate(input);assert.deepEqual(M.migrate(save),save);assert.equal(M.spent(save.zombie),7);assert.ok(save.zombie.xp<M.xpNext(8));assert.deepEqual(save.raio.ranks,{});assert.equal(save.bogus,undefined);
 const state=M.normalize('zombie',{level:6});assert.throws(()=>M.invest('zombie',state,'power_deep'),/2 pontos/);
 M.invest('zombie',state,'power');M.invest('zombie',state,'power');M.invest('zombie',state,'power_deep');assert.equal(state.ranks.power_deep,1);
 assert.throws(()=>M.invest('zombie',state,'bogus'),/desconhecida/);
 assert.equal(M.normalize('zombie',{level:5,ranks:{power:2,power_deep:2}}).ranks.power_deep,undefined);
});
test('equipment previews include mastery without consuming or modifying either point pool',()=>{
 const defs={zombie:{name:'Zumbi',hp:130,dmg:11,spd:3.4,atkRate:1.2}},tuning={boltMultiplier:.5,minionHpMultiplier:1.5,minionHpPerLevel:6,minionRegen:.01,zombieBurstMultiplier:3.5,zombieBurstRadius:3.5};
 const data={level:12,skillRanks:{bolt:3,zombie:3},actionLoadout:['raio','zombie'],skillMastery:M.migrate()},baseline=Equipment.snapshot(Build,data,defs,tuning);
 data.skillMastery.raio=M.normalize('raio',{level:10,ranks:{power:5,rhythm:4}});data.skillMastery.zombie=M.normalize('zombie',{level:10,ranks:{body:5,body_deep:4}});
 const before=JSON.stringify(data),preview=Equipment.snapshot(Build,data,defs,tuning);
 assert.ok(preview.skills.find(s=>s.id==='raio').damage>baseline.skills.find(s=>s.id==='raio').damage);
 assert.ok(preview.skills.find(s=>s.id==='raio').cooldown<baseline.skills.find(s=>s.id==='raio').cooldown);
 assert.ok(preview.attributes.hordeHp>baseline.attributes.hordeHp);assert.ok(preview.attributes.hordeRegen>baseline.attributes.hordeRegen);
 assert.equal(JSON.stringify(data),before);
});
