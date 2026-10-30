import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface OverlayReminder {
  id: number;
  taskId: string;
  dueDate: string;
  signature: string;
  title: string;
  body: string;
  at: number;
  constant?: boolean;
  kind?: 'due' | 'advance' | 'repeat' | 'legacy';
  intervalMs?: number;
  startAt?: number;
  dueAt?: number;
}
export interface OverlayAction { key: string; taskId: string; dueDate: string }
export interface ReminderPreferences { sound: boolean; vibration: boolean; duration: 15 | 30 | 60 }
export interface OverlayStatus extends ReminderPreferences {
  supported: boolean; enabled: boolean; granted: boolean; exact: boolean;
  notifications: boolean; fullScreen: boolean; alarmChannelReady: boolean;
  channelId?: string; scheduledCount: number;
  lastEvent?: { code: string; at: number; detail?: string };
}
interface NativeOverlay {
  addListener(event: 'reminderReceived', listener: (event: { taskId: string; dueDate: string; eventId?: number }) => void): Promise<PluginListenerHandle>;
  sync(options: { reminders: OverlayReminder[] }): Promise<{ scheduledTaskIds: string[]; scheduledEventIds?: number[] }>;
  status(): Promise<OverlayStatus>;
  configure(options: Partial<ReminderPreferences> & { enabled?: boolean }): Promise<OverlayStatus>;
  openSettings(options: { kind: 'overlay' | 'fullScreen' | 'channel' | 'application' }): Promise<void>;
  test(): Promise<void>;
  dismiss(options: { taskId: string; dueDate: string; eventId?: number }): Promise<void>;
  pendingActions(): Promise<{ actions: OverlayAction[] }>;
  acknowledge(options: { keys: string[] }): Promise<void>;
}
const native = registerPlugin<NativeOverlay>('ReminderOverlay');
export const supportsReminderOverlay = () => Capacitor.getPlatform() === 'android';
export const getReminderOverlayStatus = (): Promise<OverlayStatus> => supportsReminderOverlay()
  ? native.status() : Promise.resolve({ supported: false, enabled: false, granted: false, exact: false,
    notifications: false, fullScreen: false, alarmChannelReady: false, scheduledCount: 0, sound: true, vibration: true, duration: 30 });
export const configureReminderOverlay = (settings: Partial<ReminderPreferences> & { enabled?: boolean }) => native.configure(settings);
export const openReminderSettings = (kind: 'overlay' | 'fullScreen' | 'channel' | 'application') => native.openSettings({ kind });
export const testReminderAlarm = () => native.test();
export const listenForReminderAlarm = (listener: (event: { taskId: string; dueDate: string; eventId?: number }) => void) => supportsReminderOverlay()
  ? native.addListener('reminderReceived', listener) : Promise.resolve({ remove: async () => {} });
export const dismissReminderAlarm = async (taskId: string, dueDate: string, eventId?: number) => {
  if (supportsReminderOverlay()) await native.dismiss({ taskId, dueDate, eventId });
};
export const syncReminderOverlays = async (reminders: OverlayReminder[]): Promise<{ scheduledTaskIds: string[]; scheduledEventIds?: number[] }> => {
  return supportsReminderOverlay() ? native.sync({ reminders }) : { scheduledTaskIds: [] };
};
export const pendingOverlayActions = async (): Promise<OverlayAction[]> => supportsReminderOverlay()
  ? (await native.pendingActions()).actions : [];
export const acknowledgeOverlayActions = async (keys: string[]) => {
  if (supportsReminderOverlay() && keys.length) await native.acknowledge({ keys });
};
