import React, { useEffect, useRef, useState } from 'react';
import { Player, Task, TaskDifficulty, TaskRecurrence, ReminderType, StatType } from '../types';
import { WizardAvatar } from './WizardAvatar';
import { requestTaskReminderPermission } from '../services/taskReminders';
import {
  CheckCircle2,
  Clock,
  Plus,
  Repeat,
  AlertTriangle,
  X,
  Award,
  Sparkles,
  Trash2,
  Bell,
  Swords,
  Zap,
  Shield,
  BookOpen,
  Calendar,
  Heart,
  Skull,
  Scale,
  ShieldAlert
} from 'lucide-react';

interface TaskViewProps {
  player: Player;
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  onAddTask: (newTask: Omit<Task, 'id' | 'completed'>) => void;
  onDeleteTask?: (taskId: string) => void;
  onFailTask?: (taskId: string) => void;
  onRedeemHonorDebt?: (taskId: string) => void;
}

const toLocalDateTimeValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export const TaskView: React.FC<TaskViewProps> = ({
  player,
  tasks,
  onCompleteTask,
  onAddTask,
  onDeleteTask,
  onFailTask,
  onRedeemHonorDebt,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskToFail, setTaskToFail] = useState<Task | null>(null);
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
  const [newReminderType, setNewReminderType] = useState<ReminderType>('none');
  const [newCustomReminderMinutes, setNewCustomReminderMinutes] = useState<number>(30);

  // Repetición detallada
  const [newRecurrence, setNewRecurrence] = useState<TaskRecurrence>('none');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [reminderPermissionNotice, setReminderPermissionNotice] = useState('');

  useEffect(() => {
    if (showAddModal) titleInputRef.current?.focus();
  }, [showAddModal]);

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

  const getActiveElement = (): 'fire' | 'lightning' | 'earth' | 'ice' | 'plasma' | 'magma' => {
    if (player.unlockedFusions.includes('fusion-fire-lightning')) return 'plasma';
    if (player.unlockedFusions.includes('fusion-fire-earth')) return 'magma';
    if (player.equippedSpells.length > 0) {
      const sp = player.equippedSpells[0];
      if ('element' in sp) return sp.element;
    }
    return 'fire';
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (Number.isNaN(new Date(newDueDate).getTime())) return;
    if (newRecurrence === 'custom_days' && selectedDays.length === 0) return;

    setReminderPermissionNotice('');
    if (newReminderType !== 'none') {
      const permission = await requestTaskReminderPermission().catch(() => 'denied' as const);
      if (permission === 'denied') {
        setReminderPermissionNotice('La misión se guardará, pero el teléfono no tiene permiso para mostrar recordatorios.');
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

    onAddTask({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      statAffinity: newStatAffinity,
      difficulty: newDifficulty,
      expReward,
      goldReward,
      dueDate: new Date(newDueDate).toISOString(),
      reminderType: newReminderType,
      reminderCustomMinutes: newReminderType === 'custom' ? newCustomReminderMinutes : undefined,
      recurrence: newRecurrence,
      recurrenceDays: newRecurrence === 'custom_days' ? selectedDays : undefined,
      penalizedCount: 0,
    });

    setNewTitle('');
    setNewDescription('');
    setNewRecurrence('none');
    setNewReminderType('none');
    setSelectedDays([]);
    setShowAddModal(false);
  };

  // Ordenar tareas por vencimiento más próximo
  const [nowTime] = useState(() => Date.now());
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
    if (task.reminderType === 'at_due') return '🔔 Al vencer';
    if (task.reminderType === '5_minutes_before') return '🔔 5 min antes';
    if (task.reminderType === '30_minutes_before') return '🔔 30 min antes';
    if (task.reminderType === '1_hour_before') return '🔔 1 h antes';
    if (task.reminderType === '1_day_before') return '🔔 1d antes';
    if (task.reminderType === '2_days_before') return '🔔 2d antes';
    if (task.reminderType === '3_days_before') return '🔔 3d antes';
    if (task.reminderType === '1_week_before') return '🔔 1sem antes';
    if (task.reminderType === 'constant') return '🔔 Constante';
    if (task.reminderType === 'custom') return `🔔 ${task.reminderCustomMinutes || 30}m antes`;
    return null;
  };

  const hpPercent = Math.max(0, Math.min(100, (player.currentHp / player.maxHp) * 100));
  const expPercent = Math.max(0, Math.min(100, (player.exp / player.maxExp) * 100));
  const isCriticalHp = player.currentHp <= 25;
  const isCursed = !!(player.isCursed || (player.curseExpiresAt && new Date(player.curseExpiresAt).getTime() > nowTime));
  const isAgony = !!player.isAgony;

  // Misiones a menos de 4 horas de expirar (urgencia crítica)
  const urgentTasks = sortedPendingTasks.filter((t) => {
    if (t.isFailed || t.isHonorDebt) return false;
    const diffHours = (new Date(t.dueDate).getTime() - nowTime) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 4;
  });

  return (
    <div className="w-full max-w-xl mx-auto px-3 py-3 pb-24 landscape:max-w-none landscape:mx-0 landscape:h-full landscape:min-h-0 landscape:px-2 landscape:py-2 landscape:pb-2 landscape:flex landscape:gap-2 landscape:overflow-hidden">
      {/* ============================================================== */}
      {/* 1. TARJETA DEL HÉROE EN EL HOME CON BARRAS DE VIDA Y EXP (16-BIT) */}
      {/* ============================================================== */}
      <div className="retro-box-stone p-3 flex items-center gap-3 landscape:w-[32%] landscape:max-w-[250px] landscape:shrink-0 landscape:flex-col landscape:items-start landscape:justify-start landscape:gap-1.5 landscape:overflow-y-auto landscape:p-2">
        {/* Sprite de Mago en Marco de Piedra */}
        <div className="home-hero-avatar shrink-0 relative">
          <WizardAvatar
            size={90}
            scale={1.7}
            activeElement={getActiveElement()}
            isAnimated={true}
          />
        </div>

        {/* Datos y Barras de Vida / EXP */}
        <div className="w-full min-w-0 flex-1 space-y-2 landscape:space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-pixel-title text-xs text-white drop-shadow-[1px_1px_0px_#000]">{player.name}</span>
              <span className="font-pixel-title text-[8px] text-purple-400 font-bold ml-1.5">
                LV{player.level} • {player.title}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap justify-end">
              {isAgony && (
                <span className="retro-badge bg-red-950 text-red-300 border-red-500 animate-pulse flex items-center gap-1">
                  <ShieldAlert className="w-2.5 h-2.5 text-red-400" />
                  Agonía
                </span>
              )}
              {isCursed && (
                <span className="retro-badge bg-purple-950 text-purple-300 border-purple-500 flex items-center gap-1">
                  <Skull className="w-2.5 h-2.5 text-purple-400" />
                  -15% EXP
                </span>
              )}
              {isCriticalHp ? (
                <span className="retro-badge bg-red-950 text-red-400 border-red-500 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Crítico
                </span>
              ) : !isAgony && !isCursed && (
                <span className="retro-badge bg-emerald-950 text-emerald-300 border-emerald-500 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  Óptimo
                </span>
              )}
            </div>
          </div>

          {/* BARRA DE VIDA (HP) RECTANGULAR 16-BIT */}
          <div>
            <div className="flex justify-between font-pixel-title text-[8px] mb-0.5">
              <span className="text-rose-400 flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                HP
              </span>
              <span className={isCriticalHp ? 'text-red-400' : 'text-stone-300'}>
                {player.currentHp} / {player.maxHp}
              </span>
            </div>
            <div className="retro-bar-container h-3.5 w-full">
              <div
                className={`retro-bar-fill ${
                  isCriticalHp ? 'bg-red-600 animate-pulse' : 'bg-red-600'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* BARRA DE EXPERIENCIA (EXP) RECTANGULAR 16-BIT */}
          <div>
            <div className="flex justify-between font-pixel-title text-[8px] mb-0.5">
              <span className="text-cyan-400 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-cyan-400" />
                EXP (Nv.{player.level})
              </span>
              <span className="text-stone-300">
                {player.exp} / {player.maxExp}
              </span>
            </div>
            <div className="retro-bar-container h-3.5 w-full">
              <div
                className="retro-bar-fill bg-cyan-500"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 landscape:min-h-0 landscape:overflow-y-auto landscape:overscroll-contain landscape:pr-2 landscape:gap-2">
      {/* BANNER DE PELIGRO INMINENTE POR PROCRASTINACIÓN (<4 HORAS) */}
      {urgentTasks.length > 0 && (
        <div className="retro-box-danger p-3 flex items-center gap-3 animate-pulse">
          <div className="p-1.5 bg-red-950 border-2 border-red-500 text-red-300 shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="font-pixel-title text-[9px] text-red-100 uppercase tracking-wide flex items-center gap-1.5">
              ⚠️ ¡Peligro Inminente de Deleveling!
            </h4>
            <p className="font-pixel-text text-sm text-red-200 leading-tight mt-0.5">
              Tu héroe está al borde del abismo. Completa <span className="font-bold underline text-white">"{urgentTasks[0].title}"</span> en las próximas {Math.max(1, Math.ceil((new Date(urgentTasks[0].dueDate).getTime() - nowTime) / (1000 * 60 * 60)))}h para evitar la pérdida directa de nivel y degradación de atributos.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CABECERA DE MISIONES Y BOTÓN NUEVA MISIÓN */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-3 px-1 landscape:flex-row landscape:items-center landscape:justify-between landscape:gap-2">
        <div>
          <h2 className="font-pixel-title text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            ⚔️ Misiones & Tareas
          </h2>
          <p className="home-mission-subtitle font-pixel-text text-sm text-stone-300">
            Ordenadas por la más próxima a vencer. ¡No dejes que se pongan rojas!
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="retro-btn-gold w-full min-h-16 px-4 py-3 flex items-center justify-center gap-3 text-base shadow-lg hover:brightness-110 active:translate-y-0.5 landscape:w-auto landscape:min-h-10 landscape:shrink-0 landscape:px-3 landscape:py-1.5"
        >
          <Plus className="w-6 h-6" />
          <span className="font-pixel-title text-sm sm:text-base">Crear tarea o misión</span>
        </button>
      </div>

      {reminderPermissionNotice && (
        <p role="status" className="retro-box-gold p-2 font-pixel-text text-sm text-amber-200">
          {reminderPermissionNotice}
        </p>
      )}

      {/* ============================================================== */}
      {/* 3. LISTA DE TAREAS (VENCIDAS EN ROJO, CON RECORDATORIO Y REPETICIÓN) */}
      {/* ============================================================== */}
      <div className="space-y-3 landscape:space-y-2">
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
                className={`${cardClass} p-3 landscape:p-2 flex flex-col justify-between gap-2 landscape:gap-1.5`}
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
                        onClick={() => onDeleteTask(task.id)}
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
                        onClick={() => setTaskToFail(task)}
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
                        onClick={() => onRedeemHonorDebt(task.id)}
                        className="retro-btn-gold px-3 py-1.5 flex items-center gap-1 text-[9px]"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Saldar (+50% EXP)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onCompleteTask(task.id)}
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
      </div>

      {/* ============================================================== */}
      {/* 4. MODAL CREAR NUEVA MISIÓN (RECORDATORIOS, REPETICIÓN Y STATS) */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="retro-box-stone p-4 sm:p-5 max-w-md w-full relative max-h-[92dvh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-3 right-3 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-pixel-title text-xs text-amber-400 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Nueva Misión
            </h3>
            <p className="font-pixel-text text-base text-stone-300 mb-4 leading-relaxed">
              Escribe tu misión y elige cuándo hacerla. Los detalles adicionales son opcionales.
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
                  <Calendar className="w-4 h-4 text-amber-400" /> Fecha y hora
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
                  Elige el día y la hora local. Si vence sin completarse, tu personaje sufrirá consecuencias.
                </p>
              </div>

              {/* SECCIÓN RECORDATORIO (¿CUÁNDO AVISAR?) */}
              <div>
                <label className="block font-pixel-title text-[9px] text-stone-200 mb-1.5 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-400" />
                  Recordatorio
                </label>
                <select
                  value={newReminderType}
                  onChange={(e) => setNewReminderType(e.target.value as ReminderType)}
                  className="w-full min-h-11 bg-[#090a10] border-2 border-slate-600 p-2.5 text-white font-pixel-text text-base focus:border-amber-400 focus:outline-none"
                >
                  <option value="none">Sin recordatorio</option>
                  <option value="at_due">A la hora elegida</option>
                  <option value="5_minutes_before">5 minutos antes</option>
                  <option value="30_minutes_before">30 minutos antes</option>
                  <option value="1_hour_before">1 hora antes</option>
                  <option value="1_day_before">1 día antes</option>
                  <option value="constant">Persistente hasta completar</option>
                  <option value="custom">Personalizado</option>
                </select>

                {newReminderType === 'custom' && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={newCustomReminderMinutes}
                      onChange={(e) => setNewCustomReminderMinutes(Number(e.target.value))}
                      className="w-24 bg-[#090a10] border-2 border-[#18181b] p-1.5 text-white font-pixel-text text-base"
                    />
                    <span className="font-pixel-text text-sm text-stone-300">minutos antes de vencer</span>
                  </div>
                )}
                <p className="font-pixel-text text-sm text-stone-400 mt-1.5 leading-relaxed">
                  En el teléfono, el aviso aparece aunque FocusMission esté cerrada. La hora puede variar según los ajustes de ahorro de batería.
                </p>
              </div>

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
                  Guardar Misión
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
