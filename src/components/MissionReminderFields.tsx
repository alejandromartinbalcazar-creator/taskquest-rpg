import { useState } from 'react';
import type { Task, ReminderType } from '../types';
import { hasRepeatingReminder, reminderEventsForTask, repeatIntervalMinutes, repeatIsStopped } from '../services/reminderPlan';

export type ReminderSettings = Pick<Task, 'reminderType' | 'reminderAt' | 'reminderCustomMinutes' | 'reminderVersion' | 'reminderStartMinutes' | 'reminderIntervalMinutes' | 'reminderStoppedDueDate'>;
const inputClass = 'w-full min-h-11 rounded-lg border border-slate-600 bg-[#090a10] p-2.5 text-base text-white focus:border-amber-400 focus:outline-none [color-scheme:dark]';
export const reminderChoices: [ReminderType, string][] = [
  ['none', 'Ninguno'], ['at_due', 'A la hora límite'], ['5_minutes_before', '5 minutos antes'],
  ['10_minutes_before', '10 minutos antes'], ['30_minutes_before', '30 minutos antes'],
  ['1_hour_before', '1 hora antes'], ['1_day_before', '1 día antes'], ['2_days_before', '2 días antes'],
  ['constant', 'Constante'], ['custom', 'Personalizado…'],
];
const timeLabel = (at: number) => new Date(at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function DurationInput({ minutes, onChange, label }: { minutes: number; onChange: (minutes: number) => void; label: string }) {
  const [unit, setUnit] = useState(1);
  return <fieldset className="min-w-0"><legend className="mb-1 text-sm text-stone-200">{label}</legend>
    <div className="flex gap-2">
      <input aria-label={`Cantidad: ${label}`} type="number" min="1" max="525600" required value={Number.isFinite(minutes) ? minutes / unit : ''}
        onChange={(event) => onChange(Number(event.target.value) * unit)} className={`${inputClass} min-w-0 flex-1`} />
      <select aria-label={`Unidad: ${label}`} value={unit} onChange={(event) => { const next = Number(event.target.value); onChange(Math.max(1, Math.round(minutes / unit)) * next); setUnit(next); }} className={`${inputClass} !w-auto`}>
        <option value={1}>minutos</option><option value={60}>horas</option><option value={1440}>días</option>
      </select>
    </div>
  </fieldset>;
}

export function MissionReminderFields({ value, dueDate, onChange }: { value: ReminderSettings; dueDate: string; onChange: (value: ReminderSettings) => void }) {
  const kind = value.reminderType || 'none';
  const legacy = kind === 'constant' && value.reminderVersion !== 2;
  const previewTask = { ...value, id: '__preview__', title: '', dueDate } as Task;
  const now = Date.now(), due = Date.parse(dueDate);
  const rows = reminderEventsForTask(previewTask, true, now).filter((row) => row.at > now).sort((a, b) => a.at - b.at);
  const stopped = repeatIsStopped(previewTask);
  const patch = (updates: ReminderSettings) => onChange({ ...value, ...updates });
  const selected = legacy ? 'legacy' : kind === 'absolute' ? 'custom' : kind;
  const summary = kind === 'none' ? 'Sin avisos.' : hasRepeatingReminder(previewTask) && !stopped
    ? `Cada ${repeatIntervalMinutes(previewTask)} min, hasta completar o detener.`
    : rows.length > 1 ? (kind === 'absolute' && Date.parse(value.reminderAt || '') > due ? 'Aviso personalizado y hora límite.' : 'Antes del límite y al vencer.')
    : rows.length ? `Te avisaremos: ${timeLabel(rows[0].at)}` : 'Sin avisos futuros.';
  const localValue = value.reminderAt && Number.isFinite(Date.parse(value.reminderAt))
    ? new Date(Date.parse(value.reminderAt) - new Date(value.reminderAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
  return <section className="space-y-2 rounded-xl border border-slate-600 bg-slate-950/40 p-3">
    <label htmlFor="mission-reminder" className="block text-base font-bold text-stone-100">Recordatorios</label>
    <select id="mission-reminder" aria-label="¿Cuándo quieres que te avisemos?" value={selected} className={inputClass}
      onChange={(event) => patch({ reminderType: event.target.value as ReminderType, reminderVersion: 2,
        reminderStoppedDueDate: undefined, reminderStartMinutes: value.reminderStartMinutes || 60, reminderIntervalMinutes: value.reminderIntervalMinutes || 30 })}>
      {reminderChoices.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
      {legacy && <option value="legacy">Aviso persistente anterior</option>}
      {(['3_days_before', '1_week_before'] as ReminderType[]).includes(kind) && <option value={kind}>{kind === '3_days_before' ? '3 días antes' : '1 semana antes'}</option>}
    </select>
    {(kind === 'custom' || kind === 'absolute') && <div className="space-y-2">
      <select aria-label="Tipo de aviso personalizado" value={kind} onChange={(event) => patch({ reminderType: event.target.value as ReminderType })} className={inputClass}>
        <option value="custom">Tiempo antes del límite</option><option value="absolute">Elegir fecha y hora</option>
      </select>
      {kind === 'custom' ? <DurationInput label="Avisarme antes del límite" minutes={value.reminderCustomMinutes ?? 30} onChange={(minutes) => patch({ reminderCustomMinutes: minutes })} />
        : <label className="block text-sm text-stone-200">Fecha y hora del aviso<input type="datetime-local" required value={localValue} className={`${inputClass} mt-1`}
          onChange={(event) => patch({ reminderAt: Number.isFinite(Date.parse(event.target.value)) ? new Date(event.target.value).toISOString() : undefined })} /></label>}
    </div>}
    {hasRepeatingReminder(previewTask) && <div className="space-y-2">
      <DurationInput label="Empezar antes del límite" minutes={value.reminderStartMinutes ?? 60} onChange={(minutes) => patch({ reminderStartMinutes: minutes })} />
      <label className="block text-sm text-stone-200">Repetir cada
        <select value={repeatIntervalMinutes(previewTask)} className={`${inputClass} mt-1`} onChange={(event) => patch({ reminderIntervalMinutes: Number(event.target.value) })}>
          {[15, 30, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutos</option>)}
        </select>
      </label>
      <p className="text-xs text-stone-400">Cerrar descarta solo ese aviso. También te avisaremos al vencer.</p>
      {stopped && <p className="text-sm text-amber-200">Repetición detenida para esta misión.</p>}
    </div>}
    <p aria-live="polite" className="text-sm text-violet-200">{summary}</p>
    {kind !== 'none' && <details className="text-sm text-stone-300"><summary className="cursor-pointer py-1 text-violet-200">Ver horarios</summary>
      <ul className="space-y-1 py-2">{rows.map((row) => <li key={row.kind}>{timeLabel(row.at)} · {row.kind === 'due' ? 'Hora límite' : row.kind === 'repeat' ? 'Próximo aviso; continuará repitiéndose' : kind === 'absolute' ? 'Aviso personalizado' : 'Aviso anticipado'}</li>)}</ul>
      {due <= now && <p>La fecha límite ya pasó.{!hasRepeatingReminder(previewTask) || stopped ? ' Reprograma la misión para recibir un nuevo aviso.' : ' Los avisos constantes continúan.'}</p>}
      {rows.length === 1 && rows[0].kind === 'due' && kind !== 'at_due' && kind !== 'constant' && <p>El aviso anticipado ya pasó; se conserva el de la hora límite.</p>}
      {legacy && <p>Esta configuración anterior no repite avisos. Elige Constante para activar intervalos.</p>}
    </details>}
  </section>;
}
