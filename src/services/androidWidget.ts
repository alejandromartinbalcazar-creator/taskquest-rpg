import { Capacitor, registerPlugin } from '@capacitor/core';
import { Task } from '../types';

interface WidgetDataPlugin {
  syncTasks(options: { tasks: string }): Promise<void>;
}

const WidgetData = registerPlugin<WidgetDataPlugin>('WidgetData');

/** Copia una versión mínima de las misiones al almacenamiento nativo del widget. */
export async function syncTasksToAndroidWidget(tasks: Task[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const widgetTasks = tasks.map(({ id, title, dueDate, completed, isFailed }) => ({
    id,
    title,
    dueDate,
    completed,
    isFailed: Boolean(isFailed),
  }));
  try {
    await WidgetData.syncTasks({ tasks: JSON.stringify(widgetTasks) });
  } catch (error) {
    // La app web funciona igualmente aunque el widget no esté disponible.
    console.warn('No se pudo actualizar el widget de Android', error);
  }
}
