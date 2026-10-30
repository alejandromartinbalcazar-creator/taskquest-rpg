import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = ts.transpileModule(
  readFileSync(new URL('../src/game/elementalEngine/DungeonClock.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
).outputText;
const { DungeonClock } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('a long pause preserves cooldown, charge, boost and run elapsed time', () => {
  let realTime = 1000;
  const clock = new DungeonClock(() => realTime, 100_000);
  const castAt = clock.now();
  const boostUntil = castAt + 10_000;
  realTime += 1250;
  const cooldownRemaining = 5000 - (clock.now() - castAt);
  const boostRemaining = boostUntil - clock.now();
  const chargeElapsed = clock.performanceNow();
  clock.pause();
  realTime += 600_000;
  clock.pause(); // Repeated visibility/blur events must not reset the pause.
  assert.equal(5000 - (clock.now() - castAt), cooldownRemaining);
  assert.equal(boostUntil - clock.now(), boostRemaining);
  assert.equal(clock.performanceNow(), chargeElapsed);
  clock.resume();
  assert.equal(clock.now() - castAt, 1250);
  realTime += 16;
  assert.equal(clock.now() - castAt, 1266);
});

test('pending actions wait for their remaining active time and execute once', () => {
  let realTime = 0;
  const clock = new DungeonClock(() => realTime, 0);
  let stoppedStreams = 0;
  clock.schedule(() => stoppedStreams++, 350);
  realTime = 200;
  clock.pause();
  realTime = 60_200;
  clock.flushTimers();
  assert.equal(stoppedStreams, 0);
  clock.resume();
  clock.flushTimers();
  assert.equal(stoppedStreams, 0);
  realTime += 149;
  clock.flushTimers();
  assert.equal(stoppedStreams, 0);
  realTime += 1;
  clock.flushTimers();
  clock.flushTimers();
  assert.equal(stoppedStreams, 1);
});

test('multiple pauses exclude time once; a fresh restart has fresh timers', () => {
  let realTime = 0;
  const clock = new DungeonClock(() => realTime, 0);
  for (let i = 0; i < 3; i++) {
    realTime += 100;
    clock.pause();
    realTime += 10_000;
    clock.resume();
    clock.resume();
  }
  assert.equal(clock.now(), 300);
  let expired = false;
  const cancel = clock.schedule(() => { expired = true; }, 10);
  cancel();
  realTime += 20;
  clock.flushTimers();
  assert.equal(expired, false);
  const restartedClock = new DungeonClock(() => realTime, 0);
  assert.equal(restartedClock.now(), 0);
  assert.equal(restartedClock.isPaused, false);
});
