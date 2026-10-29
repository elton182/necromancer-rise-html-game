import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FORMAT,VERSION,SAVE_KEY,BACKUP_KEY,LEGACY_KEY,freshSave,normalizeSave,importSave,serializeSave,createSaveStore,MAX_BYTES} from '../scripts/save-model.mjs';
import {createSession,transition,pauseSession,castSession,stepSession,applySave,updateSettings,snapshot} from '../scripts/session.mjs';
const legacy=()=>({level:12,maxHp:240,hp:71,maxMp:135,mp:31,exp:222,gold:450,mode:'campaign',learnedSkills:['raio','dash','skeleton'],skillRanks:{skeleton:4},equipment:{staff:{id:'relic-1',version:2}},gearBag:[{id:'bag-1'}],camp:{cleared:{1:true,2:true},unlocked:3},conquest:{future:{value:17}},skillMastery:{raio:{level:5}},actionLoadout:['raio','skeleton','dash','empty','empty','empty'],summonGroups:[{slot:1,members:[{hp:22,sacrificed:true}]}],futureSystem:{unknown:[1,'keep',null]}});
function memory(initial={}){const map=new Map(Object.entries(initial));return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),map};}
test('save antigo inteiro é preservado durante importação, normalização e exportação repetidas',()=>{
 const old=legacy(),text=JSON.stringify(old),s=importSave(text);assert.deepEqual(s.legacy.data,old);assert.equal(s.character.level,12);assert.equal(s.settings.horde,6);const exported=importSave(serializeSave(s));assert.deepEqual(exported.legacy.data,old);assert.equal(JSON.stringify(old),text);s.legacy.data.equipment.staff.id='changed';assert.equal(old.equipment.staff.id,'relic-1');
});
test('saves com campos opcionais ausentes recebem defaults; extensões e IDs futuros permanecem',()=>{
 const s=normalizeSave({format:FORMAT,version:VERSION,character:{level:3,futureId:'specter-v9'},extensions:{region:'next'}});assert.equal(s.settings.quality,'high');assert.equal(s.character.gold,0);assert.equal(s.character.futureId,'specter-v9');assert.deepEqual(importSave(serializeSave(s)).extensions,{region:'next'});
});
test('rejeita JSON, formatos, versões, tipos e números inválidos sem gravar',()=>{
 for(const raw of ['{','null','[]','{}',JSON.stringify({...legacy(),level:Infinity}),JSON.stringify({...legacy(),maxHp:0}),JSON.stringify({...legacy(),learnedSkills:[42]}),JSON.stringify({format:FORMAT,version:999}),JSON.stringify({format:FORMAT,version:1,character:{level:'12'}}),JSON.stringify({format:FORMAT,version:1,settings:{horde:1.5}}),' '.repeat(MAX_BYTES+1)])assert.throws(()=>importSave(raw));
});
test('armazenamento próprio não altera chave antiga; importação mantém backup do save v2 anterior',()=>{
 const old=JSON.stringify(legacy()),m=memory({[LEGACY_KEY]:old}),store=createSaveStore(m);assert.equal(store.load().status,'empty');assert.ok(store.save(freshSave()).ok);const before=m.getItem(SAVE_KEY);const imported=store.legacy();assert.ok(imported.ok);assert.ok(store.save(imported.save,{backup:true}).ok);assert.equal(m.getItem(BACKUP_KEY),before);assert.equal(m.getItem(LEGACY_KEY),old);assert.equal(store.load().save.character.gold,450);
});
test('save corrompido não é substituído por salvar; importação explícita faz cópia do conteúdo bruto',()=>{
 const m=memory({[SAVE_KEY]:'corrompido'}),store=createSaveStore(m);assert.equal(store.load().status,'invalid');assert.equal(store.save(freshSave()).ok,false);assert.equal(m.getItem(SAVE_KEY),'corrompido');assert.ok(store.save(freshSave(),{backup:true}).ok);assert.equal(store.backup(),'corrompido');
});
test('quota e falha de backup preservam o save anterior; armazenamento indisponível é tratado',()=>{
 const before=serializeSave(freshSave()),m=memory({[SAVE_KEY]:before});const broken={getItem:m.getItem,setItem(){throw Error('QuotaExceededError');}},store=createSaveStore(broken);assert.equal(store.save(importSave(JSON.stringify(legacy())),{backup:true}).ok,false);assert.equal(m.getItem(SAVE_KEY),before);const noAccess=createSaveStore({getItem(){throw Error('SecurityError');}});assert.equal(noAccess.load().status,'unavailable');assert.equal(noAccess.save(freshSave()).ok,false);
});
test('falha na gravação principal após copiar backup mantém os dois conteúdos recuperáveis',()=>{
 const before=serializeSave(freshSave()),m=memory({[SAVE_KEY]:before,[LEGACY_KEY]:JSON.stringify(legacy())});
 const store=createSaveStore({getItem:m.getItem,setItem(key,value){if(key===SAVE_KEY)throw Error('QuotaExceededError');m.setItem(key,value);}});
 assert.equal(store.save(importSave(JSON.stringify(legacy())),{backup:true}).ok,false);assert.equal(m.getItem(SAVE_KEY),before);assert.equal(m.getItem(BACKUP_KEY),before);assert.deepEqual(JSON.parse(m.getItem(LEGACY_KEY)),legacy());
 assert.throws(()=>normalizeSave({format:FORMAT,version:VERSION,settings:{horde:7}}));
});
test('somente opções e personagem persistem: arena, saúde, recargas e efeitos são transitórios',()=>{
 const s=createSession(importSave(JSON.stringify(legacy())));transition(s,'training');castSession(s);s.world.player.hp=2;updateSettings(s,{horde:32,ground:'light'});const saved=snapshot(s,123);assert.equal(saved.savedAt,123);assert.equal(saved.character.level,12);assert.equal(saved.settings.horde,32);assert.equal(saved.legacy.data.hp,71);assert.equal(saved.world,undefined);assert.equal(saved.effects,undefined);const restored=createSession(saved);assert.equal(restored.scene,'menu');assert.equal(restored.world.player.hp,210);assert.equal(restored.world.effects.length,0);assert.equal(restored.world.horde,32);
});
test('menu não simula ou conjura; transições limpam efeitos, identificadores e recargas',()=>{
 const s=createSession();assert.equal(castSession(s),false);stepSession(s,.2,{x:1});assert.equal(s.world.time,0);transition(s,'training');assert.ok(castSession(s));const id=s.world.player.id;transition(s,'menu');assert.equal(s.world.effects.length,0);assert.equal(s.world.castCooldown,0);assert.notEqual(s.world.player.id,id);assert.ok(s.world.paused);transition(s,'training');assert.equal(s.world.paused,false);
});
test('morte interrompe simulação e limpa ataques; pausa é retomável apenas no treino',()=>{
 const s=createSession();transition(s,'training');castSession(s);pauseSession(s,true);const time=s.world.time;stepSession(s,.2);assert.equal(s.world.time,time);pauseSession(s,false);s.world.player.hp=0;stepSession(s,.02);assert.equal(s.scene,'dead');assert.equal(s.world.effects.length,0);assert.ok(s.world.actors.every(a=>a.timer===0));pauseSession(s,false);assert.ok(s.world.paused);transition(s,'training');assert.equal(s.world.player.hp,100);assert.throws(()=>transition(s,'campaign'));assert.throws(()=>transition(s,'dead'));
});
test('aplicação inválida é atômica e opções/importações não alteram o arquivo preservado',()=>{
 const s=createSession(importSave(JSON.stringify(legacy()))),original=JSON.stringify(s.save),w=s.world.player.id;assert.throws(()=>applySave(s,{format:FORMAT,version:50}));assert.equal(JSON.stringify(s.save),original);assert.equal(s.world.player.id,w);updateSettings(s,{quality:'low'});assert.deepEqual(s.save.legacy.data,legacy());
});
