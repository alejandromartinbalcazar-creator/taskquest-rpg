import { Capacitor, registerPlugin } from '@capacitor/core';

export interface OverlayReminder {
  id: number;
  taskId: string;
  dueDate: string;
  signature: string;
  title: string;
  body: string;
  at: number;
}
export interface OverlayAction { key: string; taskId: string; dueDate: string }
export interface OverlayStatus { supported: boolean; enabled: boolean; granted: boolean; exact: boolean }
interface NativeOverlay {
  sync(options: { reminders: OverlayReminder[] }): Promise<void>;
  status(): Promise<OverlayStatus>;
  configure(options: { enabled: boolean }): Promise<OverlayStatus>;
  pendingActions(): Promise<{ actions: OverlayAction[] }>;
  acknowledge(options: { keys: string[] }): Promise<void>;
}
const native = registerPlugin<NativeOverlay>('ReminderOverlay');
export const supportsReminderOverlay = () => Capacitor.getPlatform() === 'android';
export const getReminderOverlayStatus = (): Promise<OverlayStatus> => supportsReminderOverlay()
  ? native.status() : Promise.resolve({ supported: false, enabled: false, granted: false, exact: false });
export const configureReminderOverlay = (enabled: boolean) => native.configure({ enabled });
export const syncReminderOverlays = async (reminders: OverlayReminder[]) => {
  if (supportsReminderOverlay()) await native.sync({ reminders });
};
export const pendingOverlayActions = async (): Promise<OverlayAction[]> => supportsReminderOverlay()
  ? (await native.pendingActions()).actions : [];
export const acknowledgeOverlayActions = async (keys: string[]) => {
  if (supportsReminderOverlay() && keys.length) await native.acknowledge({ keys });
};
