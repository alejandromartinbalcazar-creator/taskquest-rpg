import type { Task } from '../types';

export const REMINDER_TAG = 'focusmission-task-reminder';
export const MAX_PENDING_REMINDERS = 450;

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
  for (let i = 0; i < taskId.length; i++) {
    hash ^= taskId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
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
    '5_minutes_before': 5, '30_minutes_before': 30, '1_hour_before': 60,
    '1_day_before': 1440, '2_days_before': 2880, '3_days_before': 4320,
    '1_week_before': 10080, custom: task.reminderCustomMinutes || 30,
  };
  return new Date(due.getTime() - (minutes[task.reminderType] || 0) * 60_000);
}

export function taskReminderSignature(task: Task, exact: boolean): string {
  return JSON.stringify([2, task.id, task.dueDate, task.reminderType, task.reminderAt || '',
    task.reminderCustomMinutes || '', task.title, task.description || '', exact]);
}
