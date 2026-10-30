import { Capacitor, registerPlugin } from '@capacitor/core';
import type { Task, Player } from '../types';
import type { TaskCompletionAction } from './taskCompletion';

export interface WidgetCommand extends TaskCompletionAction { source: string; settled?: boolean }

interface WidgetDataPlugin {
  syncTasks(options: { tasks: string; source: string }): Promise<void>;
  actions(options: { source: string }): Promise<{ actions: WidgetCommand[] }>;
  acknowledge(options: { source: string; keys: string[]; tasks: string }): Promise<void>;
}

const WidgetData = registerPlugin<WidgetDataPlugin>('WidgetData');

const payload = (tasks: Task[]) => JSON.stringify(tasks.map(({ id, title, description, dueDate, completed, isFailed, isHonorDebt, recurrence, recurrenceDays, reminderType, reminderAt, reminderCustomMinutes }) => ({
  id, title, description, dueDate, completed, isFailed, isHonorDebt, recurrence, recurrenceDays, reminderType, reminderAt, reminderCustomMinutes,
})));
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work); queue = result.catch(() => undefined); return result;
}
export function syncTasksToAndroidWidget(tasks: Task[], source: string): Promise<WidgetCommand[]> {
  if (Capacitor.getPlatform() !== 'android') return Promise.resolve([]);
  const snapshot = payload(tasks);
  return serial(async () => { await WidgetData.syncTasks({ tasks: snapshot, source }); return (await WidgetData.actions({ source })).actions; });
}
export function acknowledgeWidgetActions(keys: string[], tasks: Task[], source: string): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return Promise.resolve();
  const snapshot = payload(tasks);
  return serial(() => WidgetData.acknowledge({ source, keys, tasks: snapshot }));
}
export function actionableWidgetCommands(actions: WidgetCommand[], player: Player, tasks: Task[], source: string): WidgetCommand[] {
  return actions.filter((action) => action.source === source && (!action.settled ||
    (!player.processedWidgetActions?.includes(action.key) && tasks.some((task) => !task.completed && task.id === action.taskId && task.dueDate === action.dueDate))));
}
export function widgetSectionForTask(task: Task, now = new Date()): string {
  const at = new Date(task.dueDate); if (!Number.isFinite(at.getTime())) return 'later';
  if (at < now) return 'overdue';
  if (at.toDateString() === now.toDateString()) return 'today';
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  return at.toDateString() === tomorrow.toDateString() ? 'tomorrow' : 'later';
}
