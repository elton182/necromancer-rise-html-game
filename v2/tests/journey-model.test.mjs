import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,normalizeSave} from '../scripts/save-model.mjs';
import {journeySummary,journeyLocation,formatPlayTime,hordeCompanions} from '../scripts/journey-model.mjs';
import {TEST_PROFILE} from '../scripts/horde.mjs';

const save=patch=>{const s=freshSave();patch?.(s);return normalizeSave(s);};

test('o tempo de jogo aparece em horas e minutos e saves antigos começam em zero', () => {
  assert.equal(formatPlayTime(45 * 3600 + 12 * 60 + 40), '45h 12min');
  assert.equal(formatPlayTime(9 * 60 + 59), '9min');
  assert.equal(formatPlayTime(30), 'menos de 1min');
  assert.equal(save().character.playTime, 0);
  assert.throws(() => save(s => { s.character.playTime = -1; }), /Tempo de jogo/);
});

test('o local acompanha prólogo, áreas de Itaúna, Jacarandá, Ato I e modo livre', () => {
  assert.deepEqual(journeyLocation(save()), { name: 'Modo livre', detail: 'Arena de treino' });
  assert.equal(journeyLocation(save(s => { s.campaign = { started: true, prologue: { stage: 'ambush' } }; })).detail, 'Prólogo · Proteja a caravana');
  assert.equal(journeyLocation(save(s => { s.campaign = { started: true, world: { stage: 'complete', area: 'itauna-cave', entry: 'mouth' } }; })).name, 'Gruta das Tecelãs');
  assert.equal(journeyLocation(save(s => { s.campaign = { started: true, world: { stage: 'village' } }; })).name, 'Vila de Jacarandá');
  assert.equal(journeyLocation(save(s => { s.campaign = { started: true, cleared: { 1: 1, 2: 1, 3: 1, 4: 1 } }; })).name, 'Vila de Eldrin');
});

test('o resumo usa os atributos da classe e a barra de XP do nível atual', () => {
  const necro = journeySummary('a', save(s => { s.character.name = 'Léo'; s.character.exp = 50; }));
  assert.equal(necro.className, 'Necromante');
  assert.deepEqual(necro.stats.map(s => s.label), ['Vida', 'Mana', 'Dano mágico', 'Defesa']);
  assert.equal(necro.progress, .5);
  const warrior = journeySummary('b', save(s => { s.character.classId = 'warrior'; s.character.level = 12; }));
  assert.deepEqual(warrior.stats.map(s => s.label), ['Vida', 'Vigor', 'Dano', 'Defesa']);
  assert.deepEqual(warrior.companions, []);
});

test('a horda do palco segue o loadout e só usa tipos com modelo', () => {
  const s = save(x => { x.character.level = 24; x.horde = { profile: TEST_PROFILE, loadout: ['raio', 'zombie', 'dash', 'archer', 'empty', 'empty'] }; });
  assert.deepEqual(hordeCompanions(s), ['zombie', 'archer']);
  assert.deepEqual(hordeCompanions(save()), ['skeleton', 'zombie']);
});
