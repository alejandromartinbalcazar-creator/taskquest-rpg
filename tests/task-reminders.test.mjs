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
  const state = { platform: 'ios', supported: true, permission: 'granted', exact: 'granted', pending: [], delivered: [], scheduleCalls: [], cancelled: [], removed: [], overlays: [], overlayError: false, nativeEnabled: false, channelId: undefined };
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
    '@capacitor/core': { Capacitor: { isNativePlatform: () => true, getPlatform: () => state.platform } },
    '@capacitor/local-notifications': { LocalNotifications: plugin },
    './reminderPlan': plan,
    './reminderOverlay': {
      getReminderOverlayStatus: async () => ({ supported: state.supported, enabled: state.nativeEnabled, channelId: state.channelId }),
      syncReminderOverlays: async (items) => {
        if (state.overlayError) throw new Error('overlay unavailable');
        state.overlays = items;
        return { scheduledTaskIds: items.filter((item) => item.at > Date.now()).map((item) => item.taskId), scheduledEventIds: items.filter((item) => item.at > Date.now()).map((item) => item.id) };
      },
    },
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
  assert.equal(notice.extra.dueDate, original.dueDate);
  assert.equal(state.overlays.length, 0);
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
  assert.deepEqual(state.overlays, []);
});

test('an old reminder cannot complete a later recurring occurrence, a deleted or a finished mission', () => {
  const current = task();
  const action = { taskId: current.id, dueDate: current.dueDate };
  assert.equal(plan.reminderOccurrenceTask([current], action), current);
  assert.equal(plan.reminderOccurrenceTask([{ ...current, dueDate: '2027-01-01T12:00:00Z' }], action), undefined);
  assert.equal(plan.reminderOccurrenceTask([{ ...current, completed: true }], action), undefined);
  const overdue = { ...current, isFailed: true, isHonorDebt: true };
  assert.equal(plan.reminderOccurrenceTask([overdue], action), overdue);
  assert.equal(plan.reminderOccurrenceTask([], action), undefined);
});

test('denied exact permission schedules an approximate alarm and upgrades after permission changes', async () => {
  const { state, api } = harness();
  state.platform = 'android';
  state.exact = 'denied';
  let status = await api.syncTaskReminderNotifications([task()]);
  assert.equal(status.exact, false);
  assert.equal(state.overlays.length, 1);
  state.exact = 'granted';
  status = await api.syncTaskReminderNotifications([task()]);
  assert.equal(status.exact, true);
  assert.equal(state.pending.length, 0);
  assert.equal(state.overlays.length, 1);
});

test('a new launch can restore alarms removed by Android while retaining their chosen time', async () => {
  const { state, api } = harness();
  await api.syncTaskReminderNotifications([task()]);
  const previousId = state.pending[0].id;
  await api.syncTaskReminderNotifications([task()], { refreshExisting: true });
  assert.equal(state.pending.length, 1);
  assert.equal(state.pending[0].id, previousId);
  assert.equal(state.pending[0].schedule.at.toISOString(), future);
  assert.equal(state.scheduleCalls.length, 2);
});

test('denied notifications do not claim an alarm was scheduled', async () => {
  const { state, api } = harness();
  state.permission = 'denied';
  const status = await api.syncTaskReminderNotifications([task()]);
  assert.equal(status.permission, 'denied');
  assert.deepEqual(status.scheduledTaskIds, []);
  assert.equal(state.pending.length, 0);
  assert.deepEqual(state.overlays, []);
});

test('a native overlay failure keeps the ordinary reminder and its scheduling status', async () => {
  const { state, api } = harness();
  state.overlayError = true;
  const warning = console.warn;
  console.warn = () => {};
  try {
    const result = await api.syncTaskReminderNotifications([task()]);
    assert.equal(result.permission, 'granted');
    assert.equal(result.error, undefined);
    assert.equal(state.pending.length, 1);
    assert.deepEqual(result.scheduledTaskIds, [task().id]);
  } finally { console.warn = warning; }
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
  const pastAt = new Date(Date.now() - 60_000).toISOString();
  const past = { ...task('expired'), reminderAt: pastAt, dueDate: pastAt };
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
    reminderType: 'at_due', dueDate: new Date(Date.now() + (451 - index) * 60_000).toISOString() }));
  const result = await api.syncTaskReminderNotifications(tasks);
  assert.equal(state.pending.length, 450);
  assert(result.scheduledTaskIds.includes('task-450'));
  assert(!result.scheduledTaskIds.includes('task-0'));
});

test('native alarm mode migrates scheduled tasks without leaving a duplicate Capacitor alarm', async () => {
  const { state, api } = harness();
  await api.syncTaskReminderNotifications([task()]);
  assert.equal(state.pending.length, 1);
  state.nativeEnabled = true;
  state.platform = 'android';
  const result = await api.syncTaskReminderNotifications([task()]);
  assert.equal(state.pending.length, 0);
  assert.equal(state.overlays.length, 1);
  assert.deepEqual(result.scheduledTaskIds, [task().id]);
  assert.equal(state.scheduleCalls.length, 1);
  await api.syncTaskReminderNotifications([{ ...task(), completed: true }]);
  assert.deepEqual(state.overlays, []);
});

test('both Android presentations share one native plan without racing Capacitor alarms', async () => {
  const { state, api } = harness(); state.nativeEnabled = true; state.platform = 'android';
  await api.syncTaskReminderNotifications([task()]);
  assert.equal(state.pending.length, 0);
  state.nativeEnabled = false; state.channelId = 'silent-vibrate';
  await api.syncTaskReminderNotifications([task()]);
  assert.equal(state.pending.length, 0);
  assert.equal(state.overlays.length, 1);
  state.channelId = 'sound-still';
  await api.syncTaskReminderNotifications([task()]);
  assert.equal(state.pending.length, 0);
  assert.equal(state.overlays.length, 1);
  assert.equal(state.scheduleCalls.length, 0);
});

test('native planning uses task dates without any delivered callback and keeps future missions first', () => {
  const tasks = Array.from({ length: 450 }, (_, index) => ({ ...task(`past-${index}`), reminderType: 'at_due', dueDate: new Date(Date.now() - 60000).toISOString() }));
  tasks.push(task('next'));
  const rows = plan.nativeReminderPlan(tasks, true);
  assert.equal(rows.length, 450);
  assert.equal(rows[0].taskId, 'next');
  assert.equal(rows[0].at, new Date(future).getTime());
  assert.equal(rows[0].title, 'Estudiar');
  assert.equal(rows[0].dueDate, future);
  assert.deepEqual(plan.nativeReminderPlan([{ ...task(), completed: true }, { ...task('none'), reminderType: 'none' }], true), []);
});

test('alarm mode failure reports the limitation while retaining the ordinary fallback', async () => {
  const { state, api } = harness(); state.nativeEnabled = true; state.overlayError = true; state.platform = 'android';
  const warning = console.warn; console.warn = () => {};
  try {
    const result = await api.syncTaskReminderNotifications([task()]);
    assert.match(result.error, /planificador de Android/i);
    assert.equal(state.pending.length, 1);
    assert.equal(result.permission, 'granted');
  } finally { console.warn = warning; }
});

test('every advance retains an independent deadline, deduplicating equal instants', () => {
  const now = Date.parse('2026-10-30T12:00:00Z');
  const due = '2026-11-02T20:00:00Z';
  for (const reminderType of ['5_minutes_before', '10_minutes_before', '30_minutes_before', '1_hour_before', '1_day_before', '2_days_before', 'custom', 'absolute']) {
    const rows = plan.reminderEventsForTask({ ...task(), dueDate: due, reminderType, reminderAt: '2026-11-01T20:00:00Z', reminderCustomMinutes: 10 }, true, now);
    assert.equal(rows.length, 2, reminderType);
    assert.equal(rows.find((row) => row.kind === 'due').at, Date.parse(due));
    assert.notEqual(rows[0].id, rows[1].id);
  }
  assert.equal(plan.reminderEventsForTask(task(), true, now).length, 1);
});

test('past advances do not suppress a future deadline or become catch-up alarms', () => {
  const now = Date.parse(future) - 60000;
  const rows = plan.nativeReminderPlan([{ ...task(), reminderType: '1_day_before' }], true, now);
  assert.equal(rows.filter((row) => row.at > now).length, 1);
  assert.equal(rows[0].kind, 'due');
  assert.equal(rows[0].at, Date.parse(future));
});

test('constant is opt-in and holds only one next interval plus its deadline', () => {
  const t = { ...task(), reminderType: 'constant', reminderVersion: 2, reminderStartMinutes: 60, reminderIntervalMinutes: 30 };
  const due = Date.parse(t.dueDate), before = due - 7200000;
  const rows = plan.reminderEventsForTask(t, true, before);
  assert.equal(rows.length, 2);
  assert.equal(rows.find((row) => row.kind === 'repeat').at, due - 3600000);
  assert.equal(rows.find((row) => row.kind === 'repeat').intervalMs, 1800000);
  const after = plan.reminderEventsForTask(t, true, due + 1).find((row) => row.kind === 'repeat');
  assert.equal(after.at, due + 1800000);
  assert.equal(plan.reminderEventsForTask({ ...t, reminderVersion: undefined }, true, before).length, 1);
  const stopped = { ...t, reminderStoppedDueDate: t.dueDate };
  assert.deepEqual(plan.reminderEventsForTask(stopped, true, before).map((row) => row.kind), ['due']);
  assert.equal(plan.reminderEventsForTask({ ...stopped, dueDate: '2026-11-09T20:00:00Z' }, true, before).length, 2);
  assert.equal(plan.repeatIsStopped({ ...stopped, dueDate: '2026-11-02T20:00:00.000Z', reminderStoppedDueDate: '2026-11-02T15:00:00-05:00' }), true);
});

test('repeat intervals match native fixtures, never replay missed ticks or duplicate the deadline', () => {
  const rows = readFileSync(new URL('../android/app/src/test/resources/reminder-intervals.tsv', import.meta.url), 'utf8').trim().split(/\r?\n/);
  for (const line of rows) {
    const [start, interval, due, now, expected] = line.split('\t').map(Number);
    assert.equal(plan.nextRepeatAt(start, interval, due, now), expected, line);
  }
});

test('capacity prioritizes deadlines over advances and reports missing slots', async () => {
  const { state, api } = harness(); state.platform = 'android';
  const tasks = Array.from({ length: 300 }, (_, index) => ({ ...task(`t-${index}`), reminderType: '1_hour_before' }));
  const result = await api.syncTaskReminderNotifications(tasks);
  assert.equal(state.overlays.length, 450);
  assert.equal(state.overlays.filter((row) => row.kind === 'due').length, 300);
  assert.match(result.error, /demasiados avisos/);
});

test('Android serializes create/edit/delete across both events without a duplicate legacy alarm', async () => {
  const { state, api } = harness(); state.platform = 'android';
  state.pending.push({ id: 19, extra: { source: plan.REMINDER_TAG, taskId: task().id } });
  const t = { ...task(), reminderType: '1_hour_before' };
  await api.syncTaskReminderNotifications([t]);
  assert.equal(state.overlays.length, 2);
  assert.equal(state.pending.length, 0);
  assert.equal(state.scheduleCalls.length, 0);
  await api.syncTaskReminderNotifications([{ ...t, completed: true }]);
  assert.deepEqual(state.overlays, []);
  await Promise.all([api.syncTaskReminderNotifications([t]), api.syncTaskReminderNotifications([])]);
  assert.deepEqual(state.overlays, []);
});

test('occurrence identity prevents old actions reaching a new task deadline', () => {
  const t = { ...task(), reminderType: '1_hour_before' };
  const old = plan.reminderEventsForTask(t, true);
  const next = plan.reminderEventsForTask({ ...t, dueDate: '2027-01-01T15:00:00Z' }, true);
  for (const row of old) assert(!next.some((event) => event.id === row.id));
});

test('Android 7 retains ordinary reminders without claiming periodic native support', async () => {
  const { state, api } = harness(); state.platform = 'android'; state.supported = false;
  const t = { ...task(), reminderType: 'constant', reminderVersion: 2, reminderStartMinutes: 60, reminderIntervalMinutes: 30 };
  const result = await api.syncTaskReminderNotifications([t]);
  assert.equal(state.pending.length, 1);
  assert.equal(state.pending[0].schedule.at.toISOString(), t.dueDate);
  assert.equal(state.overlays.length, 0);
  assert.match(result.error, /Android 8/);
});
