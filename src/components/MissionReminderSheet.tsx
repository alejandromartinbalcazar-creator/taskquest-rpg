import { useEffect, useRef } from 'react';
import type { Task } from '../types';

export function MissionReminderSheet({ task, onDone, onClose, onOpen }: { task: Task; onDone: () => void; onClose: () => void; onOpen: () => void }) {
  const dialog = useRef<HTMLElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!buttons?.length) return;
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [task.id, task.dueDate]);
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60" role="presentation">
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="mission-reminder-title" className="w-full max-w-lg rounded-t-3xl border border-violet-400 bg-[#171335] px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      <button type="button" onClick={onOpen} aria-label={`Ver detalle de ${task.title}`} className="block w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-violet-300">
        <span className="block text-sm font-bold text-violet-200">🔔 Recordatorio de misión</span>
        <span id="mission-reminder-title" role="heading" aria-level={2} className="mt-2 block break-words text-xl font-bold text-white">{task.title}</span>
        <span className="mt-2 block max-h-32 overflow-y-auto break-words text-sm text-slate-300">{task.description || 'Tu misión te espera.'}</span>
      </button>
      <div className="mt-6 flex gap-3">
        <button type="button" className="flex-1 rounded-xl bg-amber-400 px-4 py-3 font-bold text-slate-950" onClick={onDone}>Realizado</button>
        <button type="button" className="flex-1 rounded-xl border border-violet-300 px-4 py-3 font-bold text-white" onClick={onClose}>Cerrar</button>
      </div>
    </section>
  </div>;
}
