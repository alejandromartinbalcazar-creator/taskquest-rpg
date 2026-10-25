import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { Task } from '../types';

const REMINDER_TAG = 'focusmission-task-reminder';
const MAX_PENDING_REMINDERS = 450;

export type ReminderPermission = 'granted' | 'denied' | 'unsupported';

export const requestTaskReminderPermission = async (): Promise<ReminderPermission> => {
  if (!Capacitor.isNativePlatform()) return 'unsupported';

  const current = await LocalNotifications.checkPermissions();
  const permission = current.display === 'granted'
    ? current
    : await LocalNotifications.requestPermissions();

  return permission.display === 'granted' ? 'granted' : 'denied';
};

const notificationIdForTask = (taskId: string) => {
  let hash = 2166136261;
  for (let i = 0; i < taskId.length; i++) {
    hash ^= taskId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2_147_483_646 + 1;
};

const reminderDateForTask = (task: Task) => {
  const dueDate = new Date(task.dueDate);
  const minutesBefore: Partial<Record<NonNullable<Task['reminderType']>, number>> = {
    '5_minutes_before': 5,
    '30_minutes_before': 30,
    '1_hour_before': 60,
    '1_day_before': 24 * 60,
    '2_days_before': 2 * 24 * 60,
    '3_days_before': 3 * 24 * 60,
    '1_week_before': 7 * 24 * 60,
    custom: task.reminderCustomMinutes || 30,
  };
  const offset = minutesBefore[task.reminderType || 'none'] || 0;
  return new Date(dueDate.getTime() - offset * 60_000);
};

const taskReminderSignature = (task: Task) => [
  task.dueDate,
  task.reminderType,
  task.reminderCustomMinutes || '',
  task.title,
  task.description || '',
].join('|');

const isTaskReminder = (notification: LocalNotificationSchema) =>
  (notification.extra as { source?: string } | undefined)?.source === REMINDER_TAG;

let syncQueue = Promise.resolve();

export const syncTaskReminderNotifications = (tasks: Task[]) => {
  if (!Capacitor.isNativePlatform()) return Promise.resolve();

  const activeTasks = tasks.filter((task) => !task.completed && task.reminderType && task.reminderType !== 'none');
  syncQueue = syncQueue.then(async () => {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') return;

    const [pendingResult, deliveredResult] = await Promise.all([
      LocalNotifications.getPending(),
      LocalNotifications.getDeliveredNotifications(),
    ]);
    const existing = [...pendingResult.notifications, ...deliveredResult.notifications].filter(isTaskReminder);
    const existingById = new Map(existing.map((notification) => [notification.id, notification]));
    const desired: LocalNotificationSchema[] = [];
    const keepIds = new Set<number>();

    for (const task of activeTasks) {
      if (desired.length >= MAX_PENDING_REMINDERS) break;
      const id = notificationIdForTask(task.id);
      const signature = taskReminderSignature(task);
      const current = existingById.get(id);
      const currentExtra = current?.extra as { signature?: string } | undefined;
      if (currentExtra?.signature === signature) {
        keepIds.add(id);
        continue;
      }

      const at = reminderDateForTask(task);
      if (at.getTime() <= Date.now() && task.reminderType !== 'constant') continue;
      desired.push({
        id,
        title: 'Recordatorio de misión',
        body: task.title,
        schedule: { at: at.getTime() <= Date.now() ? new Date(Date.now() + 60_000) : at, allowWhileIdle: true },
        ongoing: task.reminderType === 'constant',
        autoCancel: task.reminderType !== 'constant',
        extra: { source: REMINDER_TAG, taskId: task.id, signature },
      });
      keepIds.add(id);
    }

    const stale = existing.filter((notification) => !keepIds.has(notification.id));
    if (stale.length > 0) {
      await LocalNotifications.cancel({ notifications: stale.map(({ id }) => ({ id })) });
      await LocalNotifications.removeDeliveredNotificationsById({ ids: stale.map(({ id }) => id) });
    }

    if (desired.length > 0) await LocalNotifications.schedule({ notifications: desired });
  }).catch((error) => {
    console.warn('No se pudieron sincronizar los recordatorios de misiones:', error);
  });

  return syncQueue;
};
