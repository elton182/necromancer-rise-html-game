import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSaveStore,freshSave,SAVE_KEY,LEGACY_KEY,CHARACTERS_KEY} from '../scripts/save-model.mjs';
function fixture(){const data=new Map();let blocked=false;const storage={getItem:k=>data.get(k)??null,removeItem(k){if(blocked)throw Error('quota');data.delete(k);},setItem(k,v){if(blocked)throw Error('quota');data.set(k,v);}};return {data,store:createSaveStore(storage),block:()=>blocked=true};}
test('preserva save anterior sem slot e personagens ao alternar',()=>{
 const {store,data}=fixture();data.set(LEGACY_KEY,'não alterar');const original=freshSave();original.character.gold=77;assert.ok(store.save(original).ok);
 const a=store.createCharacter('Aurora');assert.ok(a.ok);a.save.character.gold=123;store.save(a.save);
 const b=store.createCharacter('Bento');assert.ok(b.ok);assert.equal(store.characters().characters.length,3);
 assert.equal(store.selectCharacter(a.save.character.slotId).save.character.gold,123);
 assert.equal(store.selectCharacter('original').save.character.gold,77);assert.equal(data.get(LEGACY_KEY),'não alterar');
});
test('quota e catálogo inválido impedem troca sem perder ativo',()=>{
 const f=fixture();f.store.save(freshSave());const previous=f.data.get(SAVE_KEY);f.block();assert.equal(f.store.createCharacter('Novo').ok,false);assert.equal(f.data.get(SAVE_KEY),previous);
 const g=fixture();g.store.save(freshSave());const old=g.data.get(SAVE_KEY);g.data.set(CHARACTERS_KEY,'{corrompido');assert.equal(g.store.createCharacter('Novo').ok,false);assert.equal(g.data.get(SAVE_KEY),old);assert.equal(g.data.get(CHARACTERS_KEY),'{corrompido');
});
test('nome vazio ou muito longo não cria personagem',()=>{const {store}=fixture();assert.equal(store.createCharacter(' ').ok,false);assert.equal(store.createCharacter('a'.repeat(33)).ok,false);assert.equal(store.characters().characters.length,0);});

test('exclui ativo e arquivado sem ressuscitar ao trocar, preservando legado',()=>{
 const {store,data}=fixture();data.set(LEGACY_KEY,'preservar');
 const a=store.createCharacter('A').save.character.slotId;
 const b=store.createCharacter('B').save.character.slotId;
 assert.ok(store.deleteCharacter(a).ok);assert.equal(store.selectCharacter(a).ok,false);
 assert.equal(store.deleteCharacter(b).deletedActive,true);assert.equal(store.load().status,'empty');
 assert.equal(store.characters().characters.length,0);store.createCharacter('C');
 assert.equal(store.characters().characters.length,1);assert.equal(data.get(LEGACY_KEY),'preservar');
});
test('falha de gravação preserva personagens na exclusão',()=>{
 const f=fixture();const a=f.store.createCharacter('A').save.character.slotId;f.block();
 assert.equal(f.store.deleteCharacter(a).ok,false);assert.equal(f.store.characters().characters.length,1);
});
