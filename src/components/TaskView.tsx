import React, { useEffect, useRef, useState } from 'react';
import { Task, TaskDifficulty, TaskRecurrence, StatType } from '../types';
import { openExactReminderSettings, requestTaskReminderPermission, type ReminderSyncStatus } from '../services/taskReminders';
import { hasRepeatingReminder, reminderEventsForTask, repeatIsStopped, repeatIntervalMinutes } from '../services/reminderPlan';
import { MissionReminderFields, type ReminderSettings } from './MissionReminderFields';
import { ReminderOverlaySettings } from './ReminderOverlaySettings';
import {
  CheckCircle2,
  Clock,
  Plus,
  Repeat,
  AlertTriangle,
  X,
  Award,
  Trash2,
  Swords,
  Zap,
  Shield,
  BookOpen,
  Calendar,
  Skull,
  Scale
} from 'lucide-react';

interface TaskViewProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  onAddTask: (newTask: Omit<Task, 'id' | 'completed'>) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: Omit<Task, 'id' | 'completed'>) => void;
  onFailTask?: (taskId: string) => void;
  onRedeemHonorDebt?: (taskId: string) => void;
  reminderStatus: ReminderSyncStatus;
  externalTaskId?: string | null;
  externalNewTask?: boolean;
  onExternalNewTaskHandled?: () => void;
  onExternalTaskHandled?: () => void;
}

const toLocalDateTimeValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export const TaskView: React.FC<TaskViewProps> = ({
  tasks,
  onCompleteTask,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  onFailTask,
  onRedeemHonorDebt,
  reminderStatus,
  externalTaskId,
  externalNewTask,
  onExternalNewTaskHandled,
  onExternalTaskHandled,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskToFail, setTaskToFail] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Formulario de nueva misión
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatAffinity, setNewStatAffinity] = useState<StatType>('attack');
  const [newDifficulty, setNewDifficulty] = useState<TaskDifficulty>('media');
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 4);
    return toLocalDateTimeValue(d);
  });

  // Recordatorios detallados
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({ reminderType: 'none', reminderVersion: 2, reminderCustomMinutes: 30 });
  const newReminderType = reminderSettings.reminderType || 'none';
  const [reminderFormError, setReminderFormError] = useState('');

  // Repetición detallada
  const [newRecurrence, setNewRecurrence] = useState<TaskRecurrence>('none');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [reminderPermissionNotice, setReminderPermissionNotice] = useState('');

  useEffect(() => {
    if (!tasks.some((task) => !task.completed && task.reminderType && !['none', 'at_due'].includes(task.reminderType))) return;
    try {
      if (!localStorage.getItem('focusmission-reminders-v2-explained')) {
        setReminderPermissionNotice('Tus avisos anticipados ahora incluyen también un aviso a la hora límite.');
        localStorage.setItem('focusmission-reminders-v2-explained', '1');
      }
    } catch { /* A storage restriction must not prevent editing a mission. */ }
  }, [tasks]);

  useEffect(() => {
    if (showAddModal) titleInputRef.current?.focus();
  }, [showAddModal]);

  const openEditor = (task: Task) => {
    setEditingTask(task); setNewTitle(task.title); setNewDescription(task.description || '');
    setNewStatAffinity(task.statAffinity); setNewDifficulty(task.difficulty); setNewDueDate(toLocalDateTimeValue(new Date(task.dueDate)));
    setReminderSettings({ reminderType: task.reminderType || 'none', reminderVersion: task.reminderVersion, reminderAt: task.reminderAt,
      reminderCustomMinutes: task.reminderCustomMinutes ?? 30, reminderStartMinutes: task.reminderStartMinutes,
      reminderIntervalMinutes: task.reminderIntervalMinutes, reminderStoppedDueDate: task.reminderStoppedDueDate });
    setReminderFormError('');
    setNewRecurrence(task.recurrence || 'none'); setSelectedDays(task.recurrenceDays || []); setShowAddModal(true);
  };
  const openNewMission = () => {
    setEditingTask(null); setNewTitle(''); setNewDescription(''); setNewStatAffinity('attack'); setNewDifficulty('media');
    setNewDueDate(toLocalDateTimeValue(new Date(Date.now() + 4 * 3600000)));
    setReminderSettings({ reminderType: 'none', reminderVersion: 2, reminderCustomMinutes: 30 });
    setReminderFormError(''); setNewRecurrence('none'); setSelectedDays([]); setShowAddModal(true);
  };
  useEffect(() => {
    if (!externalNewTask) return;
    openNewMission();
    onExternalNewTaskHandled?.();
  }, [externalNewTask, onExternalNewTaskHandled]);
  useEffect(() => {
    if (!externalTaskId) return;
    const task = tasks.find((item) => item.id === externalTaskId);
    if (!task) return;
    openEditor(task);
    onExternalTaskHandled?.();
  }, [externalTaskId, tasks, onExternalTaskHandled]);
  useEffect(() => {
    const fromWidget = (event: Event) => { const id = (event as CustomEvent<{ taskId: string }>).detail?.taskId; const task = tasks.find((item) => item.id === id); if (task) openEditor(task); };
    window.addEventListener('focusmission:edit-task', fromWidget);
    return () => window.removeEventListener('focusmission:edit-task', fromWidget);
  }, [tasks]);

  useEffect(() => {
    const openFromWidget = () => openNewMission();
    window.addEventListener('focusmission:new-task', openFromWidget);
    return () => window.removeEventListener('focusmission:new-task', openFromWidget);
  }, []);

  const daysOfWeek = [
    { id: 1, label: 'Lun' },
    { id: 2, label: 'Mar' },
    { id: 3, label: 'Mié' },
    { id: 4, label: 'Jue' },
    { id: 5, label: 'Vie' },
    { id: 6, label: 'Sáb' },
    { id: 0, label: 'Dom' },
  ];

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (Number.isNaN(new Date(newDueDate).getTime())) return;
    if (newRecurrence === 'custom_days' && selectedDays.length === 0) return;
    const originalReminder = editingTask?.reminderType === 'absolute' && editingTask.reminderAt === reminderSettings.reminderAt && toLocalDateTimeValue(new Date(editingTask.dueDate)) === newDueDate;
    if (newReminderType === 'absolute') {
      const reminderAt = Date.parse(reminderSettings.reminderAt || '');
      if (!Number.isFinite(reminderAt) || (!originalReminder && (reminderAt <= Date.now() || reminderAt > Date.parse(newDueDate)))) {
        setReminderFormError('Elige un aviso futuro, antes de la hora límite o a esa misma hora.');
        return;
      }
    }
    const minutes = newReminderType === 'custom' ? reminderSettings.reminderCustomMinutes : reminderSettings.reminderStartMinutes;
    if ((newReminderType === 'custom' || (newReminderType === 'constant' && reminderSettings.reminderVersion === 2)) &&
      (!Number.isInteger(minutes) || minutes! <= 0 || minutes! > 525600)) {
      setReminderFormError('Elige un tiempo válido entre 1 minuto y 365 días.'); return;
    }
    setReminderFormError('');

    setReminderPermissionNotice('');
    if (newReminderType !== 'none') {
      const permission = await requestTaskReminderPermission().catch(() => 'denied' as const);
      if (permission === 'denied') {
        setReminderPermissionNotice('La misión se guardará, pero el teléfono no tiene permiso para mostrar recordatorios.');
      } else if (permission === 'unsupported') {
        setReminderPermissionNotice('El recordatorio se guarda, pero las alertas con la app cerrada solo están disponibles en la app instalada.');
      }
    }

    let expReward = 120;
    let goldReward = 50;
    if (newDifficulty === 'facil') {
      expReward = 60;
      goldReward = 25;
    } else if (newDifficulty === 'dificil' || newDifficulty === 'epica') {
      expReward = 250;
      goldReward = 100;
    }

    const taskPayload = {
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      statAffinity: newStatAffinity,
      difficulty: newDifficulty,
      expReward,
      goldReward,
      dueDate: new Date(newDueDate).toISOString(),
      ...reminderSettings,
      reminderType: newReminderType,
      reminderAt: newReminderType === 'absolute' ? reminderSettings.reminderAt : undefined,
      recurrence: newRecurrence,
      recurrenceDays: newRecurrence === 'custom_days' ? selectedDays : undefined,
      penalizedCount: 0,
    };
    if (editingTask && onUpdateTask) onUpdateTask(editingTask.id, taskPayload);
    else onAddTask(taskPayload);

    setNewTitle('');
    setNewDescription('');
    setNewRecurrence('none');
    setReminderSettings({ reminderType: 'none', reminderVersion: 2, reminderCustomMinutes: 30 });
    setSelectedDays([]);
    setShowAddModal(false);
    setEditingTask(null);
  };

  // Ordenar tareas por vencimiento más próximo
  const [nowTime, setNowTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowTime(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const sortedPendingTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const completedTasks = tasks.filter((t) => t.completed);

  const formatDue = (isoString: string) => {
    const d = new Date(isoString);
    const isOverdue = d.getTime() < nowTime;
    return {
      text:
        d.toLocaleDateString([], { day: '2-digit', month: 'short' }) +
        ' ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOverdue,
    };
  };

  const formatRecurrenceBadge = (task: Task) => {
    if (task.recurrence === 'daily') return '🔄 Diaria';
    if (task.recurrence === 'weekly') return '🔄 Semanal';
    if (task.recurrence === 'monthly') return '🔄 Mensual';
    if (task.recurrence === 'yearly') return '🔄 Anual';
    if (task.recurrence === 'weekdays') return '🔄 Cada día de la semana';
    if (task.recurrence === 'custom_days' && task.recurrenceDays && task.recurrenceDays.length > 0) {
      const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return '🔄 ' + task.recurrenceDays.map((d) => names[d]).join(', ');
    }
    return null;
  };

  const formatReminderBadge = (task: Task) => {
    if (!task.reminderType || task.reminderType === 'none') return null;
    const events = reminderEventsForTask(task, reminderStatus.exact, nowTime).filter((row) => row.at > nowTime);
    if (hasRepeatingReminder(task) && repeatIsStopped(task)) return '🔔 Repetición detenida';
    if (reminderStatus.permission !== 'granted') return '🔔 Aviso sin activar';
    if (!events.length) return '🔔 Aviso pasado';
    if (!reminderStatus.scheduledTaskIds.includes(task.id)) return '🔔 Aviso pendiente de programar';
    if (hasRepeatingReminder(task)) return `🔔 Cada ${repeatIntervalMinutes(task)} min`;
    const at = new Date(Math.min(...events.map((row) => row.at)));
    const time = at.toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    if (task.reminderType === 'absolute') return `🔔 ${time}${reminderStatus.exact ? '' : ' · aprox.'}`;
    if (task.reminderType === 'at_due') return '🔔 Al vencer';
    if (task.reminderType === '5_minutes_before') return '🔔 5 min antes';
    if (task.reminderType === '10_minutes_before') return '🔔 10 min antes';
    if (task.reminderType === '30_minutes_before') return '🔔 30 min antes';
    if (task.reminderType === '1_hour_before') return '🔔 1 h antes';
    if (task.reminderType === '1_day_before') return '🔔 1d antes';
    if (task.reminderType === '2_days_before') return '🔔 2d antes';
    if (task.reminderType === '3_days_before') return '🔔 3d antes';
    if (task.reminderType === '1_week_before') return '🔔 1sem antes';
    if (task.reminderType === 'constant') return '🔔 Aviso anterior';
    if (task.reminderType === 'custom') return `🔔 ${task.reminderCustomMinutes || 30}m antes`;
    return null;
  };

  // Misiones a menos de 4 horas de expirar (urgencia crítica)
  const urgentTasks = sortedPendingTasks.filter((t) => {
    if (t.isFailed || t.isHonorDebt) return false;
    const diffHours = (new Date(t.dueDate).getTime() - nowTime) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 4;
  });

  return (
    <div className="w-full max-w-xl mx-auto px-3 py-4 pb-24 space-y-3">
      {/* BANNER DE PELIGRO INMINENTE POR PROCRASTINACIÓN (<4 HORAS) */}
      {urgentTasks.length > 0 && (
        <div className="retro-box-danger p-2 flex items-center gap-2">
          <div className="p-1.5 bg-red-950 border-2 border-red-500 text-red-300 shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
          </div>
          <div className="flex-1">
            <p className="font-pixel-text text-lg text-red-100 leading-tight">⚠️ <b>{urgentTasks[0].title}</b> vence en {Math.max(1, Math.ceil((new Date(urgentTasks[0].dueDate).getTime() - nowTime) / 3600000))}h.</p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CABECERA DE MISIONES Y BOTÓN NUEVA MISIÓN */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="font-pixel-title text-sm text-violet-100 flex items-center gap-2">
          📜 Misiones
        </h2>
        <span className="border border-violet-400/70 bg-violet-950/60 px-2 py-1 font-pixel-title text-[8px] text-violet-200">
          {sortedPendingTasks.length} pendiente{sortedPendingTasks.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="cute-panel p-2">
        <button
          onClick={openNewMission}
          className="cute-primary-button w-full min-h-12 px-4 py-2 flex items-center justify-center gap-2 text-base active:translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span className="font-pixel-title text-xs">Crear misión</span>
        </button>
      </div>

      {reminderPermissionNotice && (
        <p role="status" className="retro-box-gold p-2 font-pixel-text text-sm text-amber-200">
          {reminderPermissionNotice}
        </p>
      )}
      {reminderStatus.error && <p role="status" className="retro-box-danger p-2 text-sm text-rose-100">{reminderStatus.error}</p>}
      <ReminderOverlaySettings />
      {reminderStatus.permission === 'granted' && !reminderStatus.exact && tasks.some((task) => !task.completed && task.reminderType && task.reminderType !== 'none') && (
        <div className="retro-box-stone p-2 text-sm text-amber-200">
          Android puede retrasar los avisos. Activa «Alarmas y recordatorios» para mayor precisión.
          <button type="button" onClick={() => void openExactReminderSettings().catch(() => setReminderPermissionNotice('No se pudieron abrir los ajustes de alarmas.'))} className="ml-2 underline">Abrir ajustes</button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. LISTA DE TAREAS (VENCIDAS EN ROJO, CON RECORDATORIO Y REPETICIÓN) */}
      {/* ============================================================== */}
      <div className="space-y-3">
        {sortedPendingTasks.length === 0 ? (
          <div className="retro-box-stone text-center py-8 p-4">
            <Award className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
            <h4 className="font-pixel-title text-xs text-stone-200">¡Todas las Misiones Cumplidas!</h4>
            <p className="font-pixel-text text-sm text-stone-400 mt-1">
              Tu héroe está al día. Añade una nueva misión o tarea repetitiva para seguir avanzando.
            </p>
          </div>
        ) : (
          sortedPendingTasks.map((task) => {
            const dueInfo = formatDue(task.dueDate);
            const recurrenceBadge = formatRecurrenceBadge(task);
            const reminderBadge = formatReminderBadge(task);
            const diffHours = (new Date(task.dueDate).getTime() - nowTime) / (1000 * 60 * 60);
            const isUrgent = !dueInfo.isOverdue && !task.isFailed && !task.isHonorDebt && diffHours > 0 && diffHours <= 4;
            const isHonorDebt = !!task.isHonorDebt;

            let cardClass = 'retro-box-stone';
            if (isHonorDebt) {
              cardClass = 'retro-box-gold';
            } else if (dueInfo.isOverdue || task.isFailed) {
              cardClass = 'retro-box-danger animate-pulse';
            } else if (isUrgent) {
              cardClass = 'retro-box-danger animate-pulse';
            }

            return (
              <div
                key={task.id}
                onClick={() => openEditor(task)}
                className={`${cardClass} p-4 flex flex-col justify-between gap-2 task-card-soft cursor-pointer`}
              >
                {/* Banner interno de Deuda de Honor */}
                {isHonorDebt && (
                  <div className="bg-amber-950 border border-amber-500 px-2 py-1 flex items-center justify-between text-xs font-bold text-amber-200">
                    <span className="flex items-center gap-1.5 font-pixel-title text-[8px]">
                      <Scale className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>⚖️ Deuda de Honor Activa</span>
                    </span>
                    {task.honorDebtExpiresAt && (
                      <span className="font-pixel-title text-[7px] text-amber-300">
                        Expira en {Math.max(0, Math.ceil((new Date(task.honorDebtExpiresAt).getTime() - nowTime) / (1000 * 60 * 60)))}h
                      </span>
                    )}
                  </div>
                )}

                {/* Banner interno de Urgencia Crítica */}
                {isUrgent && (
                  <div className="bg-red-950 border border-red-500 px-2 py-1 flex items-center gap-1.5 font-pixel-title text-[8px] text-white animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />
                    <span>⚠️ ¡CRÍTICO! Menos de {Math.max(1, Math.ceil(diffHours))}h para deleveling</span>
                  </div>
                )}

                {/* Fila Superior: Badges de Repetición, Recordatorio y Afinidad */}
                <div className="flex items-center justify-between gap-1.5 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Badge de Repetición */}
                    {recurrenceBadge && (
                      <span className="retro-badge bg-sky-950 text-sky-200 border-sky-600 flex items-center gap-1">
                        {recurrenceBadge}
                      </span>
                    )}

                    {/* Badge de Recordatorio */}
                    {reminderBadge && (
                      <span className="retro-badge bg-amber-950 text-amber-200 border-amber-600 flex items-center gap-1">
                        {reminderBadge}
                      </span>
                    )}

                    {/* Afinidad de Estadísticas */}
                    <span className="retro-badge bg-[#0f172a] text-stone-300 border-stone-600 flex items-center gap-1">
                      {task.statAffinity === 'attack' && <Swords className="w-2.5 h-2.5 text-rose-400" />}
                      {task.statAffinity === 'speed' && <Zap className="w-2.5 h-2.5 text-amber-400" />}
                      {task.statAffinity === 'defense' && <Shield className="w-2.5 h-2.5 text-emerald-400" />}
                      {task.statAffinity === 'knowledge' && <BookOpen className="w-2.5 h-2.5 text-cyan-400" />}
                      <span className="capitalize">{task.statAffinity === 'attack' ? 'ATK (+3)' : task.statAffinity === 'speed' ? 'VEL (+3)' : task.statAffinity === 'defense' ? 'DEF (+3)' : 'KNOW (+3)'}</span>
                    </span>

                    {/* Badge de Dificultad */}
                    <span className="retro-badge bg-[#18181b] text-stone-400 uppercase border-stone-700">
                      {task.difficulty}
                    </span>
                  </div>

                  {/* Vencimiento / Fecha */}
                  <div
                    className={`retro-badge flex items-center gap-1 ${
                      dueInfo.isOverdue
                        ? 'bg-red-900 text-white border-red-500'
                        : isUrgent
                        ? 'bg-red-950 text-red-200 border-red-500'
                        : 'bg-[#181a28] text-stone-300 border-stone-700'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>{dueInfo.text}</span>
                    {dueInfo.isOverdue && <span className="ml-1 text-red-300 font-bold">¡VENCIDA!</span>}
                  </div>
                </div>

                {/* Título de la Tarea y Botones de Acción */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-pixel-title text-[10px] text-stone-100 leading-normal drop-shadow-[1px_1px_0px_#000]">
                      {task.title}
                    </h3>
                    {task.description && <p className="font-pixel-text text-sm text-stone-300 mt-1 whitespace-pre-wrap">{task.description}</p>}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {onDeleteTask && !isHonorDebt && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="retro-btn-stone p-1.5 text-stone-300 hover:text-red-400"
                        title="Eliminar Misión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Botón de Rendirse / Declarar Fallida */}
                    {onFailTask && !isHonorDebt && !task.isFailed && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setTaskToFail(task); }}
                        className="retro-btn-danger px-2 py-1 flex items-center gap-1 text-[8px]"
                        title="Declarar tarea fallida y asumir el deleveling"
                      >
                        <Skull className="w-2.5 h-2.5 text-red-300" />
                        <span>Rendirse</span>
                      </button>
                    )}

                    {/* Botón de Saldar Deuda de Honor vs Completar Estándar */}
                    {onRedeemHonorDebt && isHonorDebt ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRedeemHonorDebt(task.id); }}
                        className="retro-btn-gold px-3 py-1.5 flex items-center gap-1 text-[9px]"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Saldar (+50% EXP)</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onCompleteTask(task.id); }}
                        className="retro-btn-emerald min-h-10 px-3 py-1.5 flex items-center gap-1.5 text-[9px]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Historial de Completadas Recientes */}
      {completedTasks.length > 0 && (
        <div className="pt-2">
          <h4 className="font-pixel-title text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            Misiones Completadas Recientes ({completedTasks.length})
          </h4>
          <div className="space-y-1.5 opacity-75">
            {completedTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="retro-box-stone bg-[#0f172a] p-2 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="line-through text-stone-400 font-pixel-text text-base">{task.title}</span>
                </div>
                <span className="font-pixel-title text-[8px] text-amber-400">+{task.expReward} EXP</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* 4. MODAL CREAR NUEVA MISIÓN (RECORDATORIOS, REPETICIÓN Y STATS) */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="retro-box-stone p-4 sm:p-5 max-w-md w-full relative max-h-[92dvh] overflow-y-auto">
            <button
              onClick={() => { setShowAddModal(false); setEditingTask(null); }}
              className="absolute top-3 right-3 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-pixel-title text-xs text-amber-400 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              {editingTask ? 'Editar misión' : 'Nueva Misión'}
            </h3>
            <p className="font-pixel-text text-base text-stone-300 mb-4 leading-relaxed">
              {editingTask ? 'Actualiza los detalles de tu misión.' : 'Escribe tu misión y elige cuándo hacerla. Los detalles adicionales son opcionales.'}
            </p>

            <form onSubmit={handleCreateTask} className="space-y-3">
              {/* Título de la Tarea */}
              <div>
                <label className="block font-pixel-title text-[8px] text-stone-300 mb-1">
                  ¿Qué necesitas hacer?
                </label>
                <input
                  type="text"
                  ref={titleInputRef}
                  required
                  placeholder="Ej: Terminar proyecto, Entrenar fuerza, Leer 20 páginas..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full min-h-12 bg-[#090a10] border-2 border-slate-600 p-3 text-white font-pixel-text text-lg placeholder-stone-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="mission-description" className="block font-pixel-title text-[9px] text-stone-200 mb-1.5">
                  Descripción <span className="font-pixel-text text-sm text-stone-400">(opcional)</span>
                </label>
                <textarea
                  id="mission-description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Añade detalles o pasos para completar la misión..."
                  className="w-full resize-y bg-[#090a10] border-2 border-slate-600 p-3 text-white font-pixel-text text-base placeholder-stone-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Fecha y Hora Límite */}
              <div>
                <label htmlFor="mission-due-date" className="block font-pixel-title text-[9px] text-stone-200 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" /> Fecha y hora límite
                </label>
                <input
                  id="mission-due-date"
                  type="datetime-local"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full min-h-12 bg-[#090a10] border-2 border-slate-600 p-3 text-white font-pixel-text text-base focus:border-amber-400 focus:outline-none [color-scheme:dark]"
                />
                <p className="font-pixel-text text-sm text-stone-400 mt-1.5 flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  Recuerda que, si no completas la misión, tu personaje sufrirá consecuencias.
                </p>
              </div>

              <MissionReminderFields value={reminderSettings} dueDate={newDueDate}
                onChange={(value) => { setReminderSettings(value); setReminderFormError(''); }} />
              {reminderFormError && <p role="alert" className="text-sm text-rose-300">{reminderFormError}</p>}
              {editingTask && newReminderType === 'constant' && hasRepeatingReminder(editingTask) && onUpdateTask && <button type="button" className="min-h-11 text-sm text-violet-200 underline"
                onClick={() => {
                  const stop = !repeatIsStopped(editingTask);
                  const updated = { ...editingTask, reminderStoppedDueDate: stop ? editingTask.dueDate : undefined };
                  onUpdateTask(editingTask.id, updated); setEditingTask(updated);
                  setReminderSettings((value) => ({ ...value, reminderStoppedDueDate: updated.reminderStoppedDueDate }));
                }}>{repeatIsStopped(editingTask) ? 'Reactivar repetición' : 'Detener repetición'}</button>}

              {/* SECCIÓN REPETICIÓN (AVANZADO) */}
              <div>
                <label className="block font-pixel-title text-[9px] text-stone-200 mb-1.5 flex items-center gap-1.5">
                  <Repeat className="w-3 h-3 text-sky-400" />
                  Frecuencia
                </label>
                <select
                  value={newRecurrence}
                  onChange={(e) => setNewRecurrence(e.target.value as TaskRecurrence)}
                  className="w-full min-h-11 bg-[#090a10] border-2 border-slate-600 p-2.5 text-white font-pixel-text text-base focus:border-sky-400 focus:outline-none"
                >
                  <option value="none">Una sola vez</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensualmente</option>
                  <option value="yearly">Anualmente</option>
                  <option value="weekdays">Cada día de la semana (lunes a viernes)</option>
                  <option value="custom_days">Personalizado</option>
                </select>

                {/* SELECTOR MÚLTIPLE DE DÍAS DE LA SEMANA */}
                {newRecurrence === 'custom_days' && (
                  <div className="mt-2 p-2 bg-[#090a10] border border-[#18181b]">
                    <span className="font-pixel-title text-[9px] text-stone-300 block mb-2">
                      ¿Qué días se repite?
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {daysOfWeek.map((day) => {
                        const isSelected = selectedDays.includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleDay(day.id)}
                            className={`min-h-10 font-pixel-title text-[9px] flex items-center justify-center border-2 ${
                              isSelected
                                ? 'bg-emerald-900 border-emerald-400 text-white'
                                : 'bg-slate-900 border-slate-600 text-stone-300'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                    {selectedDays.length === 0 && <p className="font-pixel-text text-sm text-amber-300 mt-2">Selecciona al menos un día.</p>}
                  </div>
                )}
              </div>

              {/* SECCIÓN ESTADÍSTICAS DEL PERSONAJE */}
              <div>
                <label className="block font-pixel-title text-[8px] text-stone-300 mb-1">
                  Estadística principal que nutre al personaje
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    aria-pressed={newStatAffinity === 'attack'}
                    onClick={() => setNewStatAffinity('attack')}
                    className={`p-2 border text-left flex items-center gap-2 ${
                      newStatAffinity === 'attack'
                        ? 'bg-rose-950 border-rose-400 ring-2 ring-rose-400/70 text-rose-100'
                        : 'retro-box-stone text-stone-300'
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <div>
                      <div className="font-pixel-title text-[8px] text-stone-100">Ataque</div>
                      <div className="font-pixel-text text-xs text-stone-300">+3 Ataque, +1 todo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={newStatAffinity === 'speed'}
                    onClick={() => setNewStatAffinity('speed')}
                    className={`p-2 border text-left flex items-center gap-2 ${
                      newStatAffinity === 'speed'
                        ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-400/70 text-amber-100'
                        : 'retro-box-stone text-stone-300'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-pixel-title text-[8px] text-stone-100">Velocidad</div>
                      <div className="font-pixel-text text-xs text-stone-300">+3 Velocidad, +1 todo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={newStatAffinity === 'defense'}
                    onClick={() => setNewStatAffinity('defense')}
                    className={`p-2 border text-left flex items-center gap-2 ${
                      newStatAffinity === 'defense'
                        ? 'bg-emerald-950 border-emerald-400 ring-2 ring-emerald-400/70 text-emerald-100'
                        : 'retro-box-stone text-stone-300'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-pixel-title text-[8px] text-stone-100">Resistencia</div>
                      <div className="font-pixel-text text-xs text-stone-300">+3 Resistencia, +1 todo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={newStatAffinity === 'knowledge'}
                    onClick={() => setNewStatAffinity('knowledge')}
                    className={`p-2 border text-left flex items-center gap-2 ${
                      newStatAffinity === 'knowledge'
                        ? 'bg-cyan-950 border-cyan-400 ring-2 ring-cyan-400/70 text-cyan-100'
                        : 'retro-box-stone text-stone-300'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-pixel-title text-[8px] text-stone-100">Conocimiento</div>
                      <div className="font-pixel-text text-xs text-stone-300">+3 Conocimiento (SP)</div>
                    </div>
                  </button>
                </div>
                <p className="font-pixel-text text-xs text-stone-400 mt-1 italic">
                  * Cada tarea completada suma +1 a las 4 estadísticas, con +3 a la que elijas.
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex gap-2">
                {editingTask && onDeleteTask && (
                  <button type="button" onClick={() => { onDeleteTask(editingTask.id); setShowAddModal(false); setEditingTask(null); }} className="py-2 px-3 retro-btn-danger" aria-label="Eliminar misión"><Trash2 className="w-4 h-4" /></button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 retro-btn-stone"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 retro-btn-gold"
                >
                  {editingTask ? 'Guardar cambios' : 'Guardar Misión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* 5. MODAL DE CONFIRMACIÓN PARA DECLARAR TAREA FALLIDA (RENDICIÓN) */}
      {/* ============================================================== */}
      {taskToFail && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="retro-box-danger p-4 max-w-md w-full relative space-y-3">
            <div className="flex items-center gap-2.5 text-red-400">
              <div className="p-2 bg-red-950 border-2 border-red-500">
                <Skull className="w-6 h-6 text-red-500 animate-pulse" />
              </div>
              <div>
                <h3 className="font-pixel-title text-xs text-red-100 uppercase tracking-wide">
                  ¿Declarar Misión Fallida?
                </h3>
                <p className="font-pixel-text text-sm text-red-300">
                  El descuido tiene un precio tangible para tu héroe.
                </p>
              </div>
            </div>

            <p className="font-pixel-text text-base text-stone-200">
              ¿Estás seguro de que deseas rendirte en la misión{' '}
              <span className="font-bold text-amber-300">"{taskToFail.title}"</span>?
            </p>

            <div className="bg-red-950 border-2 border-red-700 p-3 space-y-1 text-red-200">
              <p className="font-pixel-title text-[8px] text-red-300 flex items-center gap-1.5 uppercase">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                Consecuencias reales inmediatas:
              </p>
              <ul className="list-disc pl-4 space-y-1 font-pixel-text text-sm text-stone-200">
                <li>
                  <span className="font-bold text-red-300">Deleveling directo:</span>{' '}
                  {taskToFail.difficulty === 'dificil' || taskToFail.difficulty === 'epica'
                    ? 'Pérdida de 2 niveles completos'
                    : 'Pérdida de 1 nivel completo'}{' '}
                  (La barra de EXP se vacía al 0%).
                </li>
                <li>
                  <span className="font-bold text-red-300">Degradación de combate:</span> Reducción de Vida Máxima (-15 HP/nivel) y stats (-2 por nivel).
                </li>
                <li>
                  <span className="font-bold text-red-300">Maldición por Incumplimiento:</span> -15% EXP en mazmorras por 24h.
                </li>
                <li>
                  <span className="font-bold text-amber-300">Deuda de Honor:</span> Ventana de 24 horas para saldar y recuperar el 50% de la EXP.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTaskToFail(null)}
                className="retro-btn-stone px-3 py-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onFailTask && taskToFail) {
                    onFailTask(taskToFail.id);
                  }
                  setTaskToFail(null);
                }}
                className="retro-btn-danger px-3 py-2 flex items-center gap-1.5"
              >
                <Skull className="w-3 h-3" />
                <span>Sí, Declarar Fallida</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
