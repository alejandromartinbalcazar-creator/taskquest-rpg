import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { Task } from '../types';
import { MAX_PENDING_REMINDERS, REMINDER_TAG, notificationIdForTask, reminderDateForTask, taskReminderSignature } from './reminderPlan';

export type ReminderPermission = 'granted' | 'denied' | 'unsupported';
export interface ReminderSyncStatus {
  permission: ReminderPermission;
  exact: boolean;
  scheduledTaskIds: string[];
  error?: string;
}
const unsupported: ReminderSyncStatus = { permission: 'unsupported', exact: false, scheduledTaskIds: [] };

export const requestTaskReminderPermission = async (): Promise<ReminderPermission> => {
  if (!Capacitor.isNativePlatform()) return 'unsupported';
  const current = await LocalNotifications.checkPermissions();
  const result = current.display === 'granted' ? current : await LocalNotifications.requestPermissions();
  return result.display === 'granted' ? 'granted' : 'denied';
};

export async function openExactReminderSettings(): Promise<void> {
  if (Capacitor.getPlatform() === 'android') await LocalNotifications.changeExactNotificationSetting();
}

type Extra = { source?: string; taskId?: string; signature?: string };
const extraOf = (notification: LocalNotificationSchema): Extra => (notification.extra || {}) as Extra;
const isTaskReminder = (notification: LocalNotificationSchema) => extraOf(notification).source === REMINDER_TAG;
let syncQueue: Promise<void> = Promise.resolve();

/** Serialize changes so a rapid edit or completion cannot leave an old alarm behind. */
export function syncTaskReminderNotifications(tasks: Task[]): Promise<ReminderSyncStatus> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve(unsupported);
  const snapshot = tasks.map((task) => ({ ...task }));
  const result = syncQueue.then(async (): Promise<ReminderSyncStatus> => {
    const permission = (await LocalNotifications.checkPermissions()).display === 'granted' ? 'granted' : 'denied';
    const exact = Capacitor.getPlatform() !== 'android' ||
      (await LocalNotifications.checkExactNotificationSetting().catch(() => ({ exact_alarm: 'denied' as const }))).exact_alarm === 'granted';
    const [pendingResult, deliveredResult] = await Promise.all([
      // Android's getDeliveredNotifications() omits custom `extra`; getAll
      // retains the task identity for both pending and displayed notices.
      LocalNotifications.getAll({ state: 'SCHEDULED' }), LocalNotifications.getAll({ state: 'TRIGGERED' }),
    ]);
    const pending = pendingResult.notifications.filter(isTaskReminder);
    const delivered = deliveredResult.notifications.filter(isTaskReminder);
    const usedIds = new Set([...pendingResult.notifications, ...deliveredResult.notifications]
      .filter((item) => !isTaskReminder(item)).map((item) => item.id));
    const pendingById = new Map(pending.map((item) => [item.id, item]));
    const deliveredById = new Map(delivered.map((item) => [item.id, item]));
    const keepPending = new Set<number>();
    const keepDelivered = new Set<number>();
    const scheduledTaskIds: string[] = [];
    const desired: LocalNotificationSchema[] = [];
    const active = snapshot.filter((task) => !task.completed && task.reminderType && task.reminderType !== 'none')
      .sort((a, b) => (reminderDateForTask(a)?.getTime() ?? Infinity) - (reminderDateForTask(b)?.getTime() ?? Infinity) || a.id.localeCompare(b.id));
    let pendingCount = 0;

    for (const task of active) {
      let id = notificationIdForTask(task.id);
      while (usedIds.has(id)) id = id === 2_147_483_646 ? 1 : id + 1;
      usedIds.add(id);
      let at = reminderDateForTask(task);
      if (!at) continue;
      const signature = taskReminderSignature(task, exact);
      const current = pendingById.get(id);
      const shown = deliveredById.get(id);
      const currentMatches = current && extraOf(current).taskId === task.id && extraOf(current).signature === signature;
      const shownMatches = shown && extraOf(shown).taskId === task.id && extraOf(shown).signature === signature;
      if (shownMatches) keepDelivered.add(id);
      if (at.getTime() <= Date.now()) {
        // One-shot reminders must never fire twice. A persistent reminder that
        // was never displayed retains its prior delayed-notice behavior.
        if (task.reminderType !== 'constant' || shownMatches) continue;
        if (currentMatches) {
          keepPending.add(id);
          if (permission === 'granted') scheduledTaskIds.push(task.id);
          pendingCount++;
          continue;
        }
        at = new Date(Date.now() + 60_000);
      }
      if (pendingCount >= MAX_PENDING_REMINDERS) continue;
      pendingCount++;
      if (currentMatches) {
        keepPending.add(id);
        if (permission === 'granted') scheduledTaskIds.push(task.id);
        continue;
      }
      if (permission !== 'granted') continue;
      desired.push({
        id,
        title: `¡Misión pendiente: ${task.title}!`,
        body: task.description?.trim() || 'Tu misión te espera. ¡Completa la tarea para ganar tu recompensa!',
        schedule: { at, allowWhileIdle: true },
        isExactNotification: exact,
        ongoing: task.reminderType === 'constant',
        autoCancel: task.reminderType !== 'constant',
        extra: { source: REMINDER_TAG, taskId: task.id, signature },
      });
      scheduledTaskIds.push(task.id);
    }

    const cancelIds = pending.filter((item) => !keepPending.has(item.id)).map(({ id }) => ({ id }));
    const removeIds = delivered.filter((item) => !keepDelivered.has(item.id)).map(({ id }) => id);
    if (cancelIds.length) await LocalNotifications.cancel({ notifications: cancelIds });
    if (removeIds.length) await LocalNotifications.removeDeliveredNotificationsById({ ids: removeIds });
    if (desired.length) await LocalNotifications.schedule({ notifications: desired });
    return { permission, exact, scheduledTaskIds };
  });
  syncQueue = result.then(() => undefined, () => undefined);
  return result.catch((error) => {
    console.warn('No se pudieron sincronizar los recordatorios de misiones:', error);
    return { permission: 'denied', exact: false, scheduledTaskIds: [], error: 'No se pudieron programar los recordatorios.' };
  });
}
