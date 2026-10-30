import type { Task } from '../types';
import type { OverlayReminder } from './reminderOverlay';

export const REMINDER_TAG = 'focusmission-task-reminder';
export const MAX_PENDING_REMINDERS = 450;
export const REPEAT_INTERVALS = [15, 30, 60] as const;
export const hasRepeatingReminder = (task: Task) => task.reminderType === 'constant' && task.reminderVersion === 2;
export const repeatIsStopped = (task: Task) => Date.parse(task.reminderStoppedDueDate || '') === Date.parse(task.dueDate);
export const repeatIntervalMinutes = (task: Task) => REPEAT_INTERVALS.includes(task.reminderIntervalMinutes as 15 | 30 | 60) ? task.reminderIntervalMinutes! : 30;

export function reminderOccurrenceTask(tasks: Task[], action: { taskId: string; dueDate: string }): Task | undefined {
  return tasks.find((task) => task.id === action.taskId && task.dueDate === action.dueDate && !task.completed);
}
export function taskIdFromReminderExtra(extra: unknown): string | null {
  if (!extra || typeof extra !== 'object') return null;
  const value = extra as { source?: unknown; taskId?: unknown };
  return value.source === REMINDER_TAG && typeof value.taskId === 'string' && value.taskId.length > 0 ? value.taskId : null;
}
export function notificationIdForTask(taskId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < taskId.length; i++) { hash ^= taskId.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) % 2_147_483_646 + 1;
}
export function reminderDateForTask(task: Task): Date | null {
  if (!task.reminderType || task.reminderType === 'none') return null;
  if (task.reminderType === 'absolute') {
    const time = new Date(task.reminderAt || '');
    return Number.isFinite(time.getTime()) ? time : null;
  }
  const due = new Date(task.dueDate);
  if (!Number.isFinite(due.getTime())) return null;
  const minutes: Partial<Record<NonNullable<Task['reminderType']>, number>> = {
    '5_minutes_before': 5, '10_minutes_before': 10, '30_minutes_before': 30, '1_hour_before': 60,
    '1_day_before': 1440, '2_days_before': 2880, '3_days_before': 4320, '1_week_before': 10080,
    custom: task.reminderCustomMinutes || 30,
    constant: hasRepeatingReminder(task) ? Math.max(1, task.reminderStartMinutes || 60) : 0,
  };
  return new Date(due.getTime() - (minutes[task.reminderType] || 0) * 60_000);
}
/** Next grid instant, skipping missed ticks and the separately owned due instant. */
export function nextRepeatAt(start: number, interval: number, due: number, now: number): number {
  let at = start > now ? start : start + (Math.floor((now - start) / interval) + 1) * interval;
  if (at === due) at += interval;
  return at;
}
export function taskReminderSignature(task: Task, exact: boolean): string {
  return JSON.stringify([3, task.id, task.dueDate, task.reminderType, task.reminderAt || '',
    task.reminderCustomMinutes || '', task.reminderVersion || '', task.reminderStartMinutes || '',
    task.reminderIntervalMinutes || '', task.reminderStoppedDueDate || '', task.title, task.description || '', exact]);
}
/** Includes past one-shots as receipts, never as catch-up alarms. */
export function reminderEventsForTask(task: Task, exact: boolean, now = Date.now()): OverlayReminder[] {
  const at = reminderDateForTask(task)?.getTime(), due = Date.parse(task.dueDate);
  if (task.completed || !task.reminderType || task.reminderType === 'none' || !Number.isFinite(due)) return [];
  const base = { taskId: task.id, dueDate: task.dueDate, dueAt: due, title: task.title,
    body: task.description?.trim() || 'Tu misión te espera.' };
  const row = (kind: NonNullable<OverlayReminder['kind']>, time: number): OverlayReminder => ({ ...base, kind, at: time,
    id: notificationIdForTask(JSON.stringify([task.id, task.dueDate, kind])),
    signature: taskReminderSignature(task, exact) + ':' + kind });
  const rows = [row('due', due)];
  if (hasRepeatingReminder(task) && at !== undefined && Number.isFinite(at)) {
    if (!repeatIsStopped(task)) {
      const intervalMs = repeatIntervalMinutes(task) * 60_000;
      rows.push({ ...row('repeat', nextRepeatAt(at, intervalMs, due, now)), startAt: at, dueAt: due, intervalMs });
    }
  } else if (at !== undefined && Number.isFinite(at) && at !== due) rows.push(row('advance', at));
  return rows;
}
/** Due alarms win capacity; past receipts never crowd out future delivery. */
export function nativeReminderPlan(tasks: Task[], exact: boolean, now = Date.now()): OverlayReminder[] {
  const rows = tasks.flatMap((task) => reminderEventsForTask(task, exact, now));
  rows.sort((a, b) => Number(a.at <= now) - Number(b.at <= now) ||
    Number(a.kind !== 'due') - Number(b.kind !== 'due') || a.at - b.at || a.taskId.localeCompare(b.taskId));
  const used = new Set<number>();
  return rows.slice(0, MAX_PENDING_REMINDERS).map((row) => {
    while (used.has(row.id)) row.id = row.id === 2_147_483_646 ? 1 : row.id + 1;
    used.add(row.id); return row;
  });
}
