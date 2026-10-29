import test from 'node:test';
import assert from 'node:assert/strict';
import {progressOf,createLoading,TIPS} from '../scripts/loading.mjs';

test('o progresso dos modelos ocupa o miolo da barra e nunca sai de 0–1', () => {
  assert.equal(progressOf(0, 10), .1);
  assert.equal(progressOf(10, 10), .9);
  assert.ok(Math.abs(progressOf(5, 10) - .5) < 1e-9);
  assert.equal(progressOf(99, 10), .9);
  assert.equal(progressOf(-3, 10), .1);
  assert.equal(progressOf(0, 0), .1);
});

function fakeDoc() {
  const nodes = { 'loading-bar': { style: {} }, 'loading-label': { textContent: '' }, 'loading-tip': { textContent: '' } };
  const attrs = {}, listeners = [], classes = new Set();
  let removed = false;
  const root = {
    querySelector: selector => nodes[selector.slice(1)],
    setAttribute: (key, value) => { attrs[key] = value; },
    addEventListener: (type, fn) => listeners.push(fn),
    classList: { add: name => classes.add(name) },
    remove: () => { removed = true; },
  };
  return { doc: { getElementById: id => (id === 'loading' ? root : null) }, nodes, attrs, classes, isRemoved: () => removed };
}

test('a tela atualiza barra, rótulo e dica, e conclui uma única vez', () => {
  const fake = fakeDoc();
  const loading = createLoading(fake.doc);
  assert.ok(TIPS.includes(fake.nodes['loading-tip'].textContent));
  loading.step(.5, 'Modelos');
  assert.equal(fake.nodes['loading-bar'].style.width, '50%');
  assert.equal(fake.attrs['aria-valuenow'], '50');
  assert.equal(fake.nodes['loading-label'].textContent, 'Modelos');
  loading.done();
  assert.ok(fake.classes.has('done'));
  assert.equal(fake.nodes['loading-bar'].style.width, '100%');
  loading.step(.1, 'Ignorado');
  assert.equal(fake.nodes['loading-bar'].style.width, '100%');
  loading.fail();
});

test('sem a marcação, o carregamento é inofensivo', () => {
  const loading = createLoading({ getElementById: () => null });
  assert.doesNotThrow(() => { loading.step(.5, 'x'); loading.tip(); loading.done(); loading.fail(); });
});
