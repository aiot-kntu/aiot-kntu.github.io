import assert from 'node:assert/strict';
import test from 'node:test';
import { createRouteProgress } from '../../src/lib/route-progress.ts';

function setup(t) {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  let bar = { style: {} };
  const progress = createRouteProgress(() => bar);
  t.after(() => progress.dispose());
  return { progress, get bar() { return bar; }, replaceBar() { bar = { style: {} }; } };
}

test('a fast navigation never flashes the indicator', t => {
  const { progress, bar } = setup(t);
  const id = progress.start();
  t.mock.timers.tick(60);
  progress.finish(id);
  t.mock.timers.tick(1000);
  assert.equal(bar.style.opacity, '0');
  assert.equal(bar.style.transform, 'scaleX(0)');
});

test('a slower navigation completes, fades, and resets', t => {
  const { progress, bar } = setup(t);
  const id = progress.start();
  t.mock.timers.tick(120);
  assert.equal(bar.style.opacity, '1');
  progress.finish(id);
  assert.equal(bar.style.transform, 'scaleX(1)');
  t.mock.timers.tick(180);
  assert.equal(bar.style.opacity, '0');
  t.mock.timers.tick(180);
  assert.equal(bar.style.transform, 'scaleX(0)');
});

test('old completion and reset callbacks cannot hide a newer navigation', t => {
  const { progress, bar } = setup(t);
  const old = progress.start();
  t.mock.timers.tick(120);
  progress.finish(old);
  t.mock.timers.tick(100);
  const current = progress.start();
  t.mock.timers.tick(120);
  progress.finish(old);
  progress.cancel(old);
  t.mock.timers.tick(100);
  assert.equal(bar.style.opacity, '1');
  progress.finish(current);
  assert.equal(bar.style.transform, 'scaleX(1)');
});

test('aborted navigation clears all pending work', t => {
  const { progress, bar } = setup(t);
  const id = progress.start();
  t.mock.timers.tick(120);
  progress.cancel(id);
  t.mock.timers.tick(1000);
  assert.equal(bar.style.opacity, '0');
  assert.equal(bar.style.transform, 'scaleX(0)');
});

test('the controller updates the current element after a document swap', t => {
  const context = setup(t);
  const id = context.progress.start();
  t.mock.timers.tick(120);
  const previous = context.bar;
  context.replaceBar();
  context.progress.finish(id);
  assert.equal(context.bar.style.transform, 'scaleX(1)');
  assert.equal(previous.style.transform, 'scaleX(0.12)');
});
