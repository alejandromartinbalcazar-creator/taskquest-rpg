import { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { configureReminderOverlay, getReminderOverlayStatus, openReminderSettings, supportsReminderOverlay, testReminderAlarm, type OverlayStatus } from '../services/reminderOverlay';
import { openExactReminderSettings, requestTaskReminderPermission } from '../services/taskReminders';

const eventLabels: Record<string, string> = {
  test_scheduled: 'Prueba programada: sal de la app o bloquea la pantalla.',
  alarm_received: 'Android recibió la alarma; falta confirmar su presentación.',
  overlay_shown: 'Android abrió la ventana. Comprueba que la veas sobre el inicio u otra app.',
  alarm_requested: 'Se solicitó la pantalla de alarma; falta confirmar que se vea.',
  alarm_shown: 'La pantalla de alarma se abrió.',
  in_app: 'Se envió el aviso a FocusMission abierta. Prueba también fuera de la app.',
  full_screen_missing: 'Falta autorización para la pantalla de alarma en el bloqueo.',
  notifications_missing: 'Android no permite las notificaciones de FocusMission.',
  service_blocked: 'Android limitó el aviso en segundo plano. Revisa los permisos y ajustes del teléfono.',
  overlay_blocked: 'Android impidió la ventana sobre otras apps. Se solicitó el aviso de alarma.',
  schedule_error: 'No se pudo programar la alarma. Revisa los permisos.',
  notification_error: 'Android no pudo presentar la notificación de alarma.',
  screen_error: 'No se pudo abrir la pantalla de alarma.',
  signal_error: 'No se pudo reproducir toda la señal de sonido o vibración.',
};

export function ReminderOverlaySettings() {
  const [status, setStatus] = useState<OverlayStatus | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!supportsReminderOverlay()) return;
    let active = true;
    const refresh = () => { void getReminderOverlayStatus().then((value) => { if (active) setStatus(value); }).catch(() => { if (active) setError('No se pudo consultar la configuración de recordatorios.'); }); };
    refresh();
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => { if (isActive) refresh(); });
    const timer = expanded ? window.setInterval(refresh, 5000) : undefined;
    return () => { active = false; if (timer) window.clearInterval(timer); void listener.then((handle) => handle.remove()); };
  }, [expanded]);
  if (!status?.supported) return null;
  const ready = status.enabled && status.notifications && status.exact && status.granted && status.fullScreen && status.alarmChannelReady;
  const act = async (action: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try {
      await action(); setStatus(await getReminderOverlayStatus());
      window.dispatchEvent(new Event('focusmission:reminder-settings-changed'));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'No se pudo guardar la configuración. Inténtalo otra vez.'); }
    finally { setBusy(false); }
  };
  const permissionRow = (label: string, granted: boolean, action: () => Promise<unknown>) => <div className="flex items-center justify-between gap-3 py-1.5">
    <span className={granted ? 'text-emerald-200' : 'text-amber-200'}>{granted ? '✓' : '○'} {label}</span>
    {!granted && <button type="button" disabled={busy} onClick={() => void act(action)} className="shrink-0 rounded-md border border-violet-300/50 px-2 py-1.5 text-xs text-white">Autorizar</button>}
  </div>;
  return <section className="rounded-xl border border-violet-500/40 bg-violet-950/30 p-3 text-sm">
    <div className="flex items-center justify-between gap-3">
      <div><p className="font-bold text-violet-100">Avisos visibles de misiones</p>
        <p className="mt-1 text-xs text-slate-300">{status.enabled ? (ready ? 'Permisos listos. Comprueba el aviso fuera de la app.' : 'Revisa los permisos para avisarte fuera de la app y en el bloqueo.') : 'Activa el modo de alarma para avisarte sin abrir FocusMission.'}</p></div>
      <button type="button" disabled={busy} className="shrink-0 rounded-lg border border-violet-300 px-3 py-2 text-violet-100 disabled:opacity-50" onClick={() => {
        setExpanded(true); void act(() => configureReminderOverlay({ enabled: !status.enabled }));
      }}>{status.enabled ? 'Desactivar' : 'Activar'}</button>
    </div>
    <button type="button" aria-expanded={expanded} className="mt-2 py-2 text-xs font-bold text-violet-200 underline" onClick={() => setExpanded(!expanded)}>Personalizar recordatorios {expanded ? '▴' : '▾'}</button>
    {expanded && <div className="mt-2 space-y-4 border-t border-violet-500/30 pt-3">
      <fieldset disabled={busy} className="space-y-3">
        <legend className="mb-2 font-bold text-slate-100">Tu forma de recibir avisos</legend>
        <label className="flex min-h-11 items-center justify-between gap-3"><span>Sonido</span><input type="checkbox" className="h-5 w-5 accent-violet-400" checked={status.sound} onChange={(event) => void act(() => configureReminderOverlay({ sound: event.target.checked }))} /></label>
        <label className="flex min-h-11 items-center justify-between gap-3"><span>Vibración</span><input type="checkbox" className="h-5 w-5 accent-violet-400" checked={status.vibration} onChange={(event) => void act(() => configureReminderOverlay({ vibration: event.target.checked }))} /></label>
        <label className="flex min-h-11 items-center justify-between gap-3"><span>Duración del aviso de alarma</span><select className="rounded-lg border border-violet-300/50 bg-[#171335] px-3 py-2 text-white" value={status.duration} onChange={(event) => {
          const duration = Number(event.target.value) as 15 | 30 | 60;
          void act(() => configureReminderOverlay({ duration }));
        }}><option value={15}>15 segundos</option><option value={30}>30 segundos</option><option value={60}>1 minuto</option></select></label>
        <p className="text-xs text-slate-400">Se guarda en este teléfono. Con ambos desactivados, el aviso es visual. Se respetan el volumen, el modo silencio y No molestar; Android puede aplicar sus propios ajustes a las notificaciones habituales.</p>
      </fieldset>
      {status.enabled && <div>
        <p className="mb-1 font-bold text-slate-100">Permisos para mostrar el aviso</p>
        {permissionRow('Notificaciones', status.notifications, async () => {
          if (await requestTaskReminderPermission() !== 'granted') await openReminderSettings('application');
        })}
        {permissionRow('Alarmas a la hora elegida', status.exact, openExactReminderSettings)}
        {permissionRow('Mostrar sobre otras aplicaciones', status.granted, () => openReminderSettings('overlay'))}
        {permissionRow('Pantalla de alarma en el bloqueo', status.fullScreen, () => openReminderSettings('fullScreen'))}
        {permissionRow('Avisos destacados de Android', status.alarmChannelReady, () => openReminderSettings('channel'))}
        <p className="mt-2 text-xs text-slate-400">Sin permiso de pantalla de alarma, Android puede mostrar solo una notificación. En algunos teléfonos también debes permitir ventanas en segundo plano desde sus ajustes.</p>
      </div>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !status.enabled || !status.notifications || !status.exact} className="rounded-lg bg-amber-400 px-3 py-3 font-bold text-slate-950 disabled:opacity-40" onClick={() => void act(async () => {
          await testReminderAlarm(); setNotice('Prueba en 10 segundos. Ve al inicio, abre otra aplicación o bloquea el teléfono. Repite la prueba para cada caso.');
        })}>Probar fuera de la app en 10 s</button>
        <button type="button" disabled={busy} className="rounded-lg border border-violet-300/50 px-3 py-3 text-violet-100" onClick={() => void act(() => openReminderSettings('channel'))}>Ajustes de Android</button>
      </div>
      {notice && <p role="status" className="text-xs text-amber-100">{notice}</p>}
      {!!status.lastEvent?.at && <p className="text-xs text-slate-300">Última comprobación ({new Date(status.lastEvent.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}): {eventLabels[status.lastEvent.code] || 'Consulta los permisos y repite la prueba.'}</p>}
      <p className="text-xs text-slate-400">«Realizado» abre FocusMission para guardar el progreso; puede pedir desbloquear el teléfono. «Cerrar» detiene el aviso y no completa la misión.</p>
    </div>}
    {error && <p role="status" className="mt-2 text-xs text-rose-200">{error}</p>}
  </section>;
}
