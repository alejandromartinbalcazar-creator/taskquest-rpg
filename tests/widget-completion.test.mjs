import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

function load(path, modules = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', code)((name) => { if (!(name in modules)) throw new Error(`Unexpected import ${name}`); return modules[name]; }, module.exports, module);
  return module.exports;
}
const data = load('../src/services/gameData.ts');
const milestones = load('../src/data/heroMilestones.ts');
const recurrence = load('../src/services/taskRecurrence.ts');
const { StorageService } = load('../src/services/storageService.ts', { './gameData': data });
const { completeTaskState } = load('../src/services/taskCompletion.ts', { '../data/heroMilestones': milestones, './taskRecurrence': recurrence, './storageService': { StorageService } });
const now = new Date('2026-10-30T15:00:00.000Z');
const task = () => ({ id: 'mission', title: 'Estudiar', dueDate: '2026-10-30T14:00:00.000Z', completed: false, statAffinity: 'knowledge', difficulty: 'media', expReward: 10, goldReward: 2 });
const player = () => structuredClone(data.DEFAULT_PLAYER);
const command = (t = task()) => ({ key: 'account:command', source: 'account', taskId: t.id, dueDate: t.dueDate, completedAt: now.toISOString(), nextDueDate: null });

test('widget and app share the same completion rules and rewards', () => {
  const p = player(), t = task();
  const app = completeTaskState(p, [t], t.id, { now });
  const widget = completeTaskState(p, [t], t.id, { action: command(t) });
  assert.equal(widget.player.gold, p.gold + t.goldReward);
  assert.equal(widget.player.totalTasksCompleted, p.totalTasksCompleted + 1);
  const { processedWidgetActions, ...withoutReceipt } = widget.player;
  assert.deepEqual(withoutReceipt, app.player); assert.deepEqual(widget.tasks, app.tasks);
  assert.deepEqual(processedWidgetActions, ['account:command']);
});

test('replayed, deleted and old occurrences never grant the next reward', () => {
  const p = player(), t = { ...task(), recurrence: 'daily' }, a = { ...command(t), nextDueDate: '2026-10-31T14:00:00.000Z' };
  const first = completeTaskState(p, [t], t.id, { action: a });
  assert.equal(first.tasks[0].completed, false);
  assert.equal(completeTaskState(first.player, first.tasks, t.id, { action: a }), null);
  assert.equal(completeTaskState(p, [], t.id, { action: a }), null);
  assert.equal(completeTaskState(p, first.tasks, t.id, { action: a }), null);
});

test('several offline recurring completions reconcile in occurrence order', () => {
  const t = { ...task(), recurrence: 'daily', reminderType: 'absolute', reminderAt: now.toISOString() };
  const a = { ...command(t), nextDueDate: '2026-10-31T14:00:00.000Z' };
  const first = completeTaskState(player(), [t], t.id, { action: a });
  const second = completeTaskState(first.player, first.tasks, t.id, { action: { ...a, key: 'account:second', dueDate: a.nextDueDate, completedAt: '2026-10-31T15:00:00.000Z', nextDueDate: '2026-11-01T14:00:00.000Z' } });
  assert.equal(second.player.totalTasksCompleted, player().totalTasksCompleted + 2);
  assert.equal(second.tasks[0].dueDate, '2026-11-01T14:00:00.000Z');
  assert.equal(second.tasks[0].reminderType, 'none');
});

test('honor debt uses redemption instead of adding normal mission rewards', () => {
  const p = player(), t = { ...task(), isHonorDebt: true, recoveredExpOnRedeem: 5 };
  const result = completeTaskState(p, [t], t.id, { action: command(t) });
  assert.equal(result.redeemed, true); assert.equal(result.player.gold, p.gold);
  assert.equal(result.player.dungeonKeys, p.dungeonKeys); assert.equal(result.tasks[0].isHonorDebt, false);
  assert.equal(result.tasks[0].completed, true);
});

test('completion journal recovers both state and receipt after a split write fails', () => {
  const values = new Map(); let failTaskWrite = true;
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, removeItem: (key) => values.delete(key),
    setItem: (key, value) => { if (failTaskWrite && key === 'taskquest_tasks_v1') throw new Error('interrupted'); values.set(key, value); } };
  const result = completeTaskState(player(), [task()], 'mission', { action: command() });
  assert.throws(() => StorageService.saveCompletion(result.player, result.tasks), /interrupted/);
  assert(values.has('taskquest_completion_journal_v1'));
  assert.equal(StorageService.getPlayer().totalTasksCompleted, result.player.totalTasksCompleted);
  assert.equal(StorageService.getTasks()[0].completed, true);
  assert(values.has('taskquest_completion_journal_v1'));
  failTaskWrite = false;
  const recovered = StorageService.getPlayer(), tasks = StorageService.getTasks();
  assert.equal(values.has('taskquest_completion_journal_v1'), false);
  assert.equal(tasks[0].completed, true);
  assert.equal(completeTaskState(recovered, tasks, 'mission', { action: command() }), null);
});

test('native and JS recurrence use identical month, leap-year, weekday and DST fixtures', () => {
  const previousZone = process.env.TZ;
  try {
    const rows = readFileSync(new URL('../android/app/src/test/resources/widget-recurrence.tsv', import.meta.url), 'utf8').trim().split(/\r?\n/);
    for (const line of rows) {
      const [zone, frequency, dueDate, completedAt, selected, expected] = line.split('\t');
      process.env.TZ = zone;
      const next = recurrence.getNextTaskDueDate({ ...task(), recurrence: frequency, dueDate, recurrenceDays: selected === '-' ? [] : selected.split(',').map(Number) }, new Date(completedAt));
      assert.equal(next, expected === 'null' ? null : expected, line);
    }
  } finally { if (previousZone === undefined) delete process.env.TZ; else process.env.TZ = previousZone; }
});

test('widget bridge serializes old snapshots, acknowledgements and newer snapshots', async () => {
  const calls = [];
  const plugin = { syncTasks: async ({ source }) => { await new Promise((resolve) => setTimeout(resolve, 5)); calls.push(`sync:${source}`); },
    actions: async () => { calls.push('read'); return { actions: [] }; }, acknowledge: async () => { calls.push('ack'); } };
  const api = load('../src/services/androidWidget.ts', { '@capacitor/core': { Capacitor: { getPlatform: () => 'android' }, registerPlugin: () => plugin } });
  await Promise.all([api.syncTasksToAndroidWidget([task()], 'account'), api.acknowledgeWidgetActions(['key'], [], 'account'), api.syncTasksToAndroidWidget([], 'account')]);
  assert.deepEqual(calls, ['sync:account', 'read', 'ack', 'sync:account', 'read']);
  const a = { ...command(), settled: true };
  assert.deepEqual(api.actionableWidgetCommands([a], player(), [task()], 'other-account'), []);
  assert.equal(api.actionableWidgetCommands([a], player(), [task()], 'account').length, 1);
  assert.deepEqual(api.actionableWidgetCommands([a], { ...player(), processedWidgetActions: [a.key] }, [task()], 'account'), []);
});
