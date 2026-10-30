import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { Task } from '../types';
import { getReminderOverlayStatus, syncReminderOverlays } from './reminderOverlay';
import { REMINDER_TAG, nativeReminderPlan, reminderEventsForTask } from './reminderPlan';

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
export function syncTaskReminderNotifications(tasks: Task[], options: { refreshExisting?: boolean } = {}): Promise<ReminderSyncStatus> {
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
    const presentation = await getReminderOverlayStatus().catch(() => null);
    let deliveryError: string | undefined;
    const now = Date.now();
    const plan = nativeReminderPlan(snapshot, exact, now);
    const futureEvents = snapshot.flatMap((task) => reminderEventsForTask(task, exact, now)).filter((row) => row.at > now);
    const capacityError = futureEvents.length > plan.filter((row) => row.at > now).length
      ? 'Hay demasiados avisos. Se priorizaron los de la hora límite; algunos anticipos no se programaron.' : undefined;
    if (Capacitor.getPlatform() === 'android' && presentation?.supported !== false) {
      try {
        // Native delivery owns the alarm, notification and presentation together.
        // No second Capacitor alarm is left racing the same reminder.
        const native = await syncReminderOverlays(permission === 'granted' ? plan : []);
        if (pending.length) await LocalNotifications.cancel({ notifications: pending.map(({ id }) => ({ id })) });
        const obsolete = delivered.filter((notice) => !snapshot.some((task) => !task.completed && task.id === extraOf(notice).taskId));
        if (obsolete.length) await LocalNotifications.removeDeliveredNotificationsById({ ids: obsolete.map(({ id }) => id) });
        const armed = new Set(native.scheduledTaskIds);
        const eventIds = native.scheduledEventIds && new Set(native.scheduledEventIds);
        const failed = permission === 'granted' && plan.some((row) => row.at > now && (eventIds ? !eventIds.has(row.id) : !armed.has(row.taskId)));
        return { permission, exact, scheduledTaskIds: [...armed], error: failed ? 'Algunos avisos no se pudieron programar. Revisa los permisos de Android.' : capacityError };
      } catch (error) {
        console.warn('No se pudo programar el modo de alarma:', error);
        deliveryError = 'El planificador de Android falló. Se usarán avisos únicos; la repetición requiere reintentar la programación.';
      }
    }
    if (!deliveryError && plan.some((row) => row.kind === 'repeat')) {
      deliveryError = 'La repetición requiere Android 8 o posterior. Se conserva el aviso de la hora límite.';
    }
    const usedIds = new Set([...pendingResult.notifications, ...deliveredResult.notifications]
      .filter((item) => !isTaskReminder(item)).map((item) => item.id));
    const pendingById = new Map(pending.map((item) => [item.id, item]));
    const deliveredById = new Map(delivered.map((item) => [item.id, item]));
    const keepPending = new Set<number>();
    const keepDelivered = new Set<number>();
    const scheduledTaskIds: string[] = [];
    const desired: LocalNotificationSchema[] = [];
    // One-shot fallback only; Android periodic delivery belongs to its native receiver.
    for (const event of plan.filter((row) => row.kind !== 'repeat')) {
      let id = event.id;
      while (usedIds.has(id)) id = id === 2_147_483_646 ? 1 : id + 1;
      usedIds.add(id);
      const at = new Date(event.at);
      const signature = event.signature + (presentation?.channelId || '');
      const current = pendingById.get(id);
      const shown = deliveredById.get(id);
      const currentMatches = current && extraOf(current).taskId === event.taskId && extraOf(current).signature === signature;
      const shownMatches = shown && extraOf(shown).taskId === event.taskId && extraOf(shown).signature === signature;
      if (shownMatches) keepDelivered.add(id);
      if (at.getTime() <= now) continue;
      if (currentMatches && !options.refreshExisting) {
        keepPending.add(id);
        if (permission === 'granted') scheduledTaskIds.push(event.taskId);
        continue;
      }
      if (permission !== 'granted') continue;
      desired.push({
        id,
        title: `¡Misión pendiente: ${event.title}!`,
        body: event.body,
        channelId: presentation?.channelId,
        schedule: { at, allowWhileIdle: true },
        isExactNotification: exact,
        ongoing: false,
        autoCancel: true,
        extra: { source: REMINDER_TAG, taskId: event.taskId, dueDate: event.dueDate, signature },
      });
      scheduledTaskIds.push(event.taskId);
    }

    const cancelIds = pending.filter((item) => !keepPending.has(item.id)).map(({ id }) => ({ id }));
    const removeIds = delivered.filter((item) => !keepDelivered.has(item.id)).map(({ id }) => id);
    if (cancelIds.length) await LocalNotifications.cancel({ notifications: cancelIds });
    if (removeIds.length) await LocalNotifications.removeDeliveredNotificationsById({ ids: removeIds });
    if (desired.length) await LocalNotifications.schedule({ notifications: desired });
    return { permission, exact, scheduledTaskIds: [...new Set(scheduledTaskIds)], error: deliveryError || capacityError };
  });
  syncQueue = result.then(() => undefined, () => undefined);
  return result.catch((error) => {
    console.warn('No se pudieron sincronizar los recordatorios de misiones:', error);
    return { permission: 'denied', exact: false, scheduledTaskIds: [], error: 'No se pudieron programar los recordatorios.' };
  });
}
