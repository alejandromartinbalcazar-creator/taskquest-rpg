import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

function compile(path) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}
function load(code, modules = {}) {
  const module = { exports: {} };
  new Function('require', 'exports', 'module', code)((name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
  }, module.exports, module);
  return module.exports;
}
const plan = load(compile('../src/services/reminderPlan.ts'));
const serviceCode = compile('../src/services/taskReminders.ts');
const future = new Date(Date.now() + 3 * 60 * 60_000).toISOString();
const task = (id = 'mission-1') => ({ id, title: 'Estudiar', description: 'Repasar física',
  dueDate: future, reminderAt: future, reminderType: 'absolute', completed: false,
  statAffinity: 'knowledge', difficulty: 'media', expReward: 10, goldReward: 2 });

function harness() {
  const state = { permission: 'granted', exact: 'granted', pending: [], delivered: [], scheduleCalls: [], cancelled: [], removed: [] };
  const plugin = {
    checkPermissions: async () => ({ display: state.permission }),
    requestPermissions: async () => ({ display: state.permission }),
    checkExactNotificationSetting: async () => ({ exact_alarm: state.exact }),
    changeExactNotificationSetting: async () => ({ exact_alarm: state.exact }),
    getAll: async ({ state: kind }) => ({ notifications: [...(kind === 'SCHEDULED' ? state.pending : state.delivered)] }),
    cancel: async ({ notifications }) => {
      const ids = notifications.map((item) => item.id); state.cancelled.push(...ids);
      state.pending = state.pending.filter((item) => !ids.includes(item.id));
    },
    removeDeliveredNotificationsById: async ({ ids }) => {
      state.removed.push(...ids); state.delivered = state.delivered.filter((item) => !ids.includes(item.id));
    },
    schedule: async ({ notifications }) => {
      state.scheduleCalls.push(notifications);
      for (const item of notifications) {
        state.pending = state.pending.filter((existing) => existing.id !== item.id);
        state.pending.push(item);
      }
      return { notifications: notifications.map(({ id }) => ({ id })) };
    },
  };
  const api = load(serviceCode, {
    '@capacitor/core': { Capacitor: { isNativePlatform: () => true, getPlatform: () => 'android' } },
    '@capacitor/local-notifications': { LocalNotifications: plugin },
    './reminderPlan': plan,
  });
  return { state, api };
}

test('independent and due-relative dates resolve accurately, including invalid dates', () => {
  const t = task();
  assert.equal(plan.reminderDateForTask(t).toISOString(), future);
  assert.equal(plan.reminderDateForTask({ ...t, reminderType: '1_hour_before' }).getTime(), new Date(future).getTime() - 3_600_000);
  assert.equal(plan.reminderDateForTask({ ...t, reminderAt: 'bad' }), null);
  assert.equal(plan.reminderDateForTask({ ...t, reminderType: 'none' }), null);
});

test('create and edit replace just the mission alarm with complete action data', async () => {
  const { state, api } = harness();
  const original = task();
  const status = await api.syncTaskReminderNotifications([original]);
  assert.deepEqual(status.scheduledTaskIds, [original.id]);
  assert.equal(state.pending.length, 1);
  const notice = state.pending[0];
  assert.equal(notice.title, '¡Misión pendiente: Estudiar!');
  assert.equal(notice.body, 'Repasar física');
  assert.equal(notice.schedule.at.toISOString(), future);
  assert.equal(notice.schedule.allowWhileIdle, true);
  assert.equal(plan.taskIdFromReminderExtra(notice.extra), original.id);
  assert.equal(plan.taskIdFromReminderExtra({ source: 'other', taskId: original.id }), null);
  await api.syncTaskReminderNotifications([original]);
  assert.equal(state.scheduleCalls.length, 1);
  await api.syncTaskReminderNotifications([{ ...original, title: 'Estudiar mañana' }]);
  assert.equal(state.scheduleCalls.length, 2);
  assert(state.cancelled.includes(notice.id));
  assert.equal(state.pending.length, 1);
  assert.equal(state.pending[0].title, '¡Misión pendiente: Estudiar mañana!');
});

test('complete or delete removes only that task, including delivered notices', async () => {
  const { state, api } = harness();
  const a = task('a'), b = task('b');
  await api.syncTaskReminderNotifications([a, b]);
  const aNotice = state.pending.find((n) => n.extra.taskId === 'a');
  state.pending = state.pending.filter((n) => n.id !== aNotice.id);
  state.delivered.push(aNotice);
  await api.syncTaskReminderNotifications([{ ...a, completed: true }, b]);
  assert(state.removed.includes(aNotice.id));
  assert.equal(state.pending.length, 1);
  assert.equal(state.pending[0].extra.taskId, 'b');
  await api.syncTaskReminderNotifications([]);
  assert.equal(state.pending.length, 0);
});

test('denied exact permission schedules an approximate alarm and upgrades after permission changes', async () => {
  const { state, api } = harness();
  state.exact = 'denied';
  let status = await api.syncTaskReminderNotifications([task()]);
  assert.equal(status.exact, false);
  assert.equal(state.pending[0].isExactNotification, false);
  state.exact = 'granted';
  status = await api.syncTaskReminderNotifications([task()]);
  assert.equal(status.exact, true);
  assert.equal(state.pending[0].isExactNotification, true);
  assert.equal(state.pending.length, 1);
});

test('denied notifications do not claim an alarm was scheduled', async () => {
  const { state, api } = harness();
  state.permission = 'denied';
  const status = await api.syncTaskReminderNotifications([task()]);
  assert.equal(status.permission, 'denied');
  assert.deepEqual(status.scheduledTaskIds, []);
  assert.equal(state.pending.length, 0);
});

test('rapid create then delete serializes operations and leaves no alarm', async () => {
  const { state, api } = harness();
  await Promise.all([api.syncTaskReminderNotifications([task()]), api.syncTaskReminderNotifications([])]);
  assert.equal(state.pending.length, 0);
});

test('past one-shot notifications are not rescheduled and other app alerts are preserved', async () => {
  const { state, api } = harness();
  const other = { id: plan.notificationIdForTask('other'), extra: { source: 'not-a-task' } };
  state.pending.push(other);
  const past = { ...task('expired'), reminderAt: new Date(Date.now() - 60_000).toISOString() };
  const status = await api.syncTaskReminderNotifications([past]);
  assert.deepEqual(status.scheduledTaskIds, []);
  assert.deepEqual(state.pending, [other]);
});

test('an identifier collision with a different feature never cancels its alert', async () => {
  const { state, api } = harness();
  const other = { id: plan.notificationIdForTask('a'), extra: { source: 'other-feature' } };
  state.pending.push(other);
  await api.syncTaskReminderNotifications([task('a')]);
  assert.equal(state.pending.length, 2);
  assert.notEqual(state.pending.find((n) => n.extra.source === plan.REMINDER_TAG).id, other.id);
  await api.syncTaskReminderNotifications([]);
  assert.deepEqual(state.pending, [other]);
});

test('the capacity limit keeps the nearest reminders instead of the first identifiers', async () => {
  const { state, api } = harness();
  const tasks = Array.from({ length: 451 }, (_, index) => ({ ...task(`task-${index}`),
    reminderAt: new Date(Date.now() + (451 - index) * 60_000).toISOString() }));
  const result = await api.syncTaskReminderNotifications(tasks);
  assert.equal(state.pending.length, 450);
  assert(result.scheduledTaskIds.includes('task-450'));
  assert(!result.scheduledTaskIds.includes('task-0'));
});
