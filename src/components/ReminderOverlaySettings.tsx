import { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { configureReminderOverlay, getReminderOverlayStatus, supportsReminderOverlay, type OverlayStatus } from '../services/reminderOverlay';
import { openExactReminderSettings } from '../services/taskReminders';

export function ReminderOverlaySettings() {
  const [status, setStatus] = useState<OverlayStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!supportsReminderOverlay()) return;
    let active = true;
    const refresh = () => { void getReminderOverlayStatus().then((value) => { if (active) setStatus(value); }).catch(() => {}); };
    refresh();
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => { if (isActive) refresh(); });
    return () => { active = false; void listener.then((handle) => handle.remove()); };
  }, []);
  if (!status?.supported) return null;
  const enabled = status.enabled && status.granted;
  const configure = async (value: boolean) => {
    setBusy(true); setError('');
    try { setStatus(await configureReminderOverlay(value)); }
    catch { setError('No se pudieron cambiar los avisos. Inténtalo otra vez desde los ajustes del teléfono.'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-xl border border-violet-500/40 bg-violet-950/30 p-3 text-sm">
    <div className="flex items-center justify-between gap-3">
      <div><p className="font-bold text-violet-100">Avisos sobre otras aplicaciones</p>
        <p className="mt-1 text-xs text-slate-300">Una tarjeta con «Realizado» y «Cerrar» cuando llegue tu recordatorio.</p></div>
      <button type="button" disabled={busy} className="shrink-0 rounded-lg border border-violet-300 px-3 py-2 text-violet-100 disabled:opacity-50" onClick={() => void configure(!enabled)}>
        {enabled ? 'Desactivar' : 'Activar'}
      </button>
    </div>
    {status.enabled && !status.granted && <p className="mt-2 text-xs text-amber-200">Autoriza «Mostrar sobre otras aplicaciones» en los ajustes de Android para ver la tarjeta.</p>}
    {enabled && !status.exact && <p className="mt-2 text-xs text-amber-200">Activa «Alarmas y recordatorios» para mostrar la tarjeta a la hora elegida.
      <button type="button" className="ml-2 underline" onClick={() => void openExactReminderSettings().catch(() => setError('No se pudieron abrir los ajustes de alarmas.'))}>Abrir ajustes</button>
    </p>}
    {enabled && status.exact && <p className="mt-2 text-xs text-slate-300">Activos. Con el teléfono bloqueado se mantiene la notificación. «Realizado» abre FocusMission para guardar el progreso.</p>}
    {error && <p role="status" className="mt-2 text-xs text-rose-200">{error}</p>}
  </section>;
}
