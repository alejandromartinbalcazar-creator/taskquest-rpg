import React, { useState } from 'react';
import { Player, Task, TaskDifficulty, TaskRecurrence, ReminderType, StatType } from '../types';
import { WizardAvatar } from './WizardAvatar';
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

  // Formulario de nueva misión
  const [newTitle, setNewTitle] = useState('');
  const [newStatAffinity, setNewStatAffinity] = useState<StatType>('attack');
  const [newDifficulty, setNewDifficulty] = useState<TaskDifficulty>('media');
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 4);
    return d.toISOString().slice(0, 16);
  });

  // Recordatorios detallados
  const [newReminderType, setNewReminderType] = useState<ReminderType>('at_due');
  const [newCustomReminderMinutes, setNewCustomReminderMinutes] = useState<number>(30);

  // Repetición detallada
  const [newRecurrence, setNewRecurrence] = useState<TaskRecurrence>('none');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Lunes, Miércoles, Viernes por defecto

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

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let expReward = 35;
    let goldReward = 20;
    if (newDifficulty === 'facil') {
      expReward = 25;
      goldReward = 15;
    } else if (newDifficulty === 'dificil') {
      expReward = 70;
      goldReward = 45;
    } else if (newDifficulty === 'epica') {
      expReward = 150;
      goldReward = 90;
    }

    onAddTask({
      title: newTitle.trim(),
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
    setNewRecurrence('none');
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
    if (task.recurrence === 'custom_days' && task.recurrenceDays && task.recurrenceDays.length > 0) {
      const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return '🔄 ' + task.recurrenceDays.map((d) => names[d]).join(', ');
    }
    return null;
  };

  const formatReminderBadge = (task: Task) => {
    if (!task.reminderType || task.reminderType === 'none') return null;
    if (task.reminderType === 'at_due') return '🔔 Al vencer';
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
    <div className="max-w-xl mx-auto px-3 py-3 pb-24 space-y-4">
      {/* ============================================================== */}
      {/* 1. TARJETA DEL HÉROE EN EL HOME CON BARRAS DE VIDA Y EXP */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-br from-[#161824] via-[#11121b] to-[#161824] border-2 border-stone-800 rounded-3xl p-4 shadow-xl flex items-center gap-3">
        {/* Sprite de Mago */}
        <div className="shrink-0 relative">
          <WizardAvatar
            size={95}
            scale={1.8}
            activeElement={getActiveElement()}
            isAnimated={true}
          />
        </div>

        {/* Datos y Barras de Vida / EXP */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-black text-sm text-stone-100">{player.name}</span>
              <span className="text-[10px] text-purple-400 font-bold ml-1.5">
                LV{player.level} • {player.title}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap justify-end">
              {isAgony && (
                <span className="text-[10px] font-bold text-red-300 bg-red-950 px-2 py-0.5 rounded-full border border-red-500 animate-pulse flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  Agonía
                </span>
              )}
              {isCursed && (
                <span className="text-[10px] font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-500/70 flex items-center gap-1">
                  <Skull className="w-3 h-3 text-purple-400" />
                  -15% EXP
                </span>
              )}
              {isCriticalHp ? (
                <span className="text-[10px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-500/50 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Crítico
                </span>
              ) : !isAgony && !isCursed && (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Óptimo
                </span>
              )}
            </div>
          </div>

          {/* BARRA DE VIDA (HP) */}
          <div>
            <div className="flex justify-between text-[10px] font-bold mb-0.5">
              <span className="text-rose-400 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                Vida (HP)
              </span>
              <span className={isCriticalHp ? 'text-red-400 font-mono' : 'text-stone-300 font-mono'}>
                {player.currentHp} / {player.maxHp}
              </span>
            </div>
            <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden border border-stone-800">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isCriticalHp ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-red-600 to-rose-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* BARRA DE EXPERIENCIA (EXP) */}
          <div>
            <div className="flex justify-between text-[10px] font-bold mb-0.5">
              <span className="text-cyan-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                Experiencia (Nivel {player.level})
              </span>
              <span className="text-stone-300 font-mono">
                {player.exp} / {player.maxExp}
              </span>
            </div>
            <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden border border-stone-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BANNER DE PELIGRO INMINENTE POR PROCRASTINACIÓN (<4 HORAS) */}
      {urgentTasks.length > 0 && (
        <div className="bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-2 border-red-500 rounded-2xl p-3 shadow-[0_0_22px_rgba(239,68,68,0.4)] animate-pulse flex items-center gap-3">
          <div className="p-2 bg-red-900/60 rounded-xl border border-red-400/50 text-red-300 shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-red-100 uppercase tracking-wide flex items-center gap-1.5">
              ⚠️ ¡Peligro Inminente de Deleveling!
            </h4>
            <p className="text-[11px] text-red-200 leading-tight mt-0.5">
              Tu héroe está al borde del abismo. Completa <span className="font-bold underline text-white">"{urgentTasks[0].title}"</span> en las próximas {Math.max(1, Math.ceil((new Date(urgentTasks[0].dueDate).getTime() - nowTime) / (1000 * 60 * 60)))}h para evitar la pérdida directa de nivel y degradación de atributos.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CABECERA DE MISIONES Y BOTÓN NUEVA MISIÓN */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-black text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
            ⚔️ Misiones & Tareas
          </h2>
          <p className="text-[11px] text-stone-400">
            Ordenadas por la más próxima a vencer. ¡No dejes que se pongan rojas!
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-950 active:scale-95 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Misión</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. LISTA DE TAREAS (VENCIDAS EN ROJO, CON RECORDATORIO Y REPETICIÓN) */}
      {/* ============================================================== */}
      <div className="space-y-2.5">
        {sortedPendingTasks.length === 0 ? (
          <div className="text-center py-10 bg-[#121420]/60 rounded-3xl border border-dashed border-stone-800 p-6">
            <Award className="w-10 h-10 text-amber-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-stone-200">¡Todas las Misiones Cumplidas!</h4>
            <p className="text-xs text-stone-400 mt-1">
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

            let cardClass = 'bg-[#121420] border border-stone-800 hover:border-amber-500/50 text-stone-100';
            if (isHonorDebt) {
              cardClass = 'bg-gradient-to-r from-amber-950/60 via-[#1b1522] to-amber-950/50 border-2 border-amber-500/80 shadow-[0_0_16px_rgba(245,158,11,0.25)] text-amber-100';
            } else if (dueInfo.isOverdue || task.isFailed) {
              cardClass = 'bg-red-950/70 border-2 border-red-500 text-red-100 shadow-[0_0_18px_rgba(239,68,68,0.35)] animate-pulse';
            } else if (isUrgent) {
              cardClass = 'bg-red-950/50 border-2 border-red-500 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse';
            }

            return (
              <div
                key={task.id}
                className={`rounded-2xl p-3.5 transition-all shadow-md relative overflow-hidden flex flex-col justify-between gap-2.5 ${cardClass}`}
              >
                {/* Banner interno de Deuda de Honor */}
                {isHonorDebt && (
                  <div className="bg-amber-950/90 border border-amber-500/70 rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-amber-200">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>⚖️ Deuda de Honor Activa: Saldar recupera 50% de la EXP</span>
                    </span>
                    {task.honorDebtExpiresAt && (
                      <span className="text-[10px] text-amber-300 font-mono">
                        Expira en {Math.max(0, Math.ceil((new Date(task.honorDebtExpiresAt).getTime() - nowTime) / (1000 * 60 * 60)))}h
                      </span>
                    )}
                  </div>
                )}

                {/* Banner interno de Urgencia Crítica */}
                {isUrgent && (
                  <div className="bg-red-900/80 border border-red-500 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-bold text-white animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>⚠️ ¡CRÍTICO! Menos de {Math.max(1, Math.ceil(diffHours))}h para deleveling (-{task.difficulty === 'dificil' || task.difficulty === 'epica' ? '2 niveles' : '1 nivel'})</span>
                  </div>
                )}

                {/* Fila Superior: Badges de Repetición, Recordatorio y Afinidad */}
                <div className="flex items-center justify-between gap-2 text-[11px] flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Badge de Repetición */}
                    {recurrenceBadge && (
                      <span className="bg-sky-950 text-sky-300 border border-sky-700/60 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                        {recurrenceBadge}
                      </span>
                    )}

                    {/* Badge de Recordatorio */}
                    {reminderBadge && (
                      <span className="bg-amber-950/80 text-amber-300 border border-amber-700/50 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                        {reminderBadge}
                      </span>
                    )}

                    {/* Afinidad de Estadísticas */}
                    <span className="text-stone-400 font-semibold flex items-center gap-1 text-[10px] bg-black/40 px-2 py-0.5 rounded-full border border-stone-800">
                      {task.statAffinity === 'attack' && <Swords className="w-3 h-3 text-rose-400" />}
                      {task.statAffinity === 'speed' && <Zap className="w-3 h-3 text-amber-400" />}
                      {task.statAffinity === 'defense' && <Shield className="w-3 h-3 text-emerald-400" />}
                      {task.statAffinity === 'knowledge' && <BookOpen className="w-3 h-3 text-cyan-400" />}
                      <span className="capitalize">{task.statAffinity === 'attack' ? 'Ataque (+3)' : task.statAffinity === 'speed' ? 'Velocidad (+3)' : task.statAffinity === 'defense' ? 'Resistencia (+3)' : 'Conocimiento (+3)'}</span>
                    </span>

                    {/* Badge de Dificultad */}
                    <span className="text-[10px] font-bold text-stone-400 uppercase bg-black/30 px-1.5 py-0.5 rounded border border-stone-800">
                      {task.difficulty}
                    </span>
                  </div>

                  {/* Vencimiento / Fecha */}
                  <div
                    className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-[10px] ${
                      dueInfo.isOverdue
                        ? 'bg-red-900 text-white border border-red-400'
                        : isUrgent
                        ? 'bg-red-900/90 text-red-200 border border-red-400'
                        : 'bg-[#181a28] text-stone-300'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{dueInfo.text}</span>
                    {dueInfo.isOverdue && <span className="ml-1 text-red-200 font-black">¡VENCIDA!</span>}
                  </div>
                </div>

                {/* Título de la Tarea y Botones de Acción */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <h3 className="font-bold text-sm text-stone-100 leading-snug flex-1">
                    {task.title}
                  </h3>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {onDeleteTask && !isHonorDebt && (
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-2 text-stone-500 hover:text-red-400 hover:bg-stone-800/60 rounded-xl transition"
                        title="Eliminar Misión"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Botón de Rendirse / Declarar Fallida */}
                    {onFailTask && !isHonorDebt && !task.isFailed && (
                      <button
                        type="button"
                        onClick={() => setTaskToFail(task)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 font-bold text-[11px] rounded-xl transition active:scale-95"
                        title="Declarar tarea fallida y asumir el deleveling"
                      >
                        <Skull className="w-3.5 h-3.5 text-red-400" />
                        <span>Rendirse</span>
                      </button>
                    )}

                    {/* Botón de Saldar Deuda de Honor vs Completar Estándar */}
                    {onRedeemHonorDebt && isHonorDebt ? (
                      <button
                        onClick={() => onRedeemHonorDebt(task.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-950 active:scale-95 transition"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Saldar Deuda (+50% EXP)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
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
        <div className="pt-3">
          <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
            Misiones Completadas Recientes ({completedTasks.length})
          </h4>
          <div className="space-y-1.5 opacity-60">
            {completedTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="bg-[#0f111a] p-2.5 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="line-through text-stone-400">{task.title}</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold">+{task.expReward} EXP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODAL CREAR NUEVA MISIÓN (RECORDATORIOS, REPETICIÓN Y STATS) */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121420] border-2 border-stone-800 rounded-3xl p-5 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-stone-100 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Nueva Misión
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Configura tu tarea, recordatorios, repetición y las estadísticas que fortalecerá.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              {/* Título de la Tarea */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  ¿Qué necesitas hacer?
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Terminar proyecto, Entrenar fuerza, Leer 20 páginas..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#181a28] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Fecha y Hora Límite */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  ¿Cuándo se va a hacer? (Fecha y hora límite)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-[#181a28] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Si vence sin completarse, tu personaje sufre -15 HP de daño.
                </p>
              </div>

              {/* SECCIÓN RECORDATORIO (¿CUÁNDO AVISAR?) */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  Recordatorio (Avisarme antes)
                </label>
                <select
                  value={newReminderType}
                  onChange={(e) => setNewReminderType(e.target.value as ReminderType)}
                  className="w-full bg-[#181a28] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="none">Sin recordatorio</option>
                  <option value="at_due">En el momento (al vencer)</option>
                  <option value="1_day_before">1 día antes</option>
                  <option value="2_days_before">2 días antes</option>
                  <option value="3_days_before">3 días antes</option>
                  <option value="1_week_before">1 semana antes</option>
                  <option value="constant">Recordatorio constante (persistente)</option>
                  <option value="custom">Personalizado (definir tiempo)</option>
                </select>

                {newReminderType === 'custom' && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={newCustomReminderMinutes}
                      onChange={(e) => setNewCustomReminderMinutes(Number(e.target.value))}
                      className="w-24 bg-[#181a28] border border-stone-700 rounded-xl px-3 py-1 text-xs text-white"
                    />
                    <span className="text-xs text-stone-400">minutos antes de vencer</span>
                  </div>
                )}
              </div>

              {/* SECCIÓN REPETICIÓN (AVANZADO: NINGUNO, DIARIA, SEMANAL, MENSUAL, ANUAL, DÍAS ESPECÍFICOS) */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-sky-400" />
                  Repetir Misión
                </label>
                <select
                  value={newRecurrence}
                  onChange={(e) => setNewRecurrence(e.target.value as TaskRecurrence)}
                  className="w-full bg-[#181a28] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="none">Ninguno (Única vez)</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensualmente</option>
                  <option value="yearly">Anualmente</option>
                  <option value="custom_days">Días específicos de la semana</option>
                </select>

                {/* SELECTOR MÚLTIPLE DE DÍAS DE LA SEMANA */}
                {newRecurrence === 'custom_days' && (
                  <div className="mt-2.5 p-2.5 bg-stone-900/80 rounded-2xl border border-stone-800">
                    <span className="text-[11px] text-stone-400 font-bold block mb-1.5">
                      Selecciona uno o varios días:
                    </span>
                    <div className="flex gap-1.5 justify-between">
                      {daysOfWeek.map((day) => {
                        const isSelected = selectedDays.includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleDay(day.id)}
                            className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition border ${
                              isSelected
                                ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                                : 'bg-[#181a28] border-stone-700 text-stone-400 hover:text-white'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN ESTADÍSTICAS DEL PERSONAJE (ATAQUE, VELOCIDAD, RESISTENCIA, CONOCIMIENTOS) */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Estadística principal que nutre al personaje
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewStatAffinity('attack')}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                      newStatAffinity === 'attack'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md'
                        : 'bg-[#181a28] border-stone-700 text-stone-400'
                    }`}
                  >
                    <Swords className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="font-bold text-stone-100">Ataque</div>
                      <div className="text-[10px] text-stone-400">+3 Ataque, +1 todo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatAffinity('speed')}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                      newStatAffinity === 'speed'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md'
                        : 'bg-[#181a28] border-stone-700 text-stone-400'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-stone-100">Velocidad</div>
                      <div className="text-[10px] text-stone-400">+3 Velocidad, +1 todo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatAffinity('defense')}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                      newStatAffinity === 'defense'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md'
                        : 'bg-[#181a28] border-stone-700 text-stone-400'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-stone-100">Resistencia</div>
                      <div className="text-[10px] text-stone-400">+3 Resistencia, +1 todo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatAffinity('knowledge')}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                      newStatAffinity === 'knowledge'
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md'
                        : 'bg-[#181a28] border-stone-700 text-stone-400'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-stone-100">Conocimiento</div>
                      <div className="text-[10px] text-stone-400">+3 Conocimiento (SP)</div>
                    </div>
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-1 italic">
                  * Cada tarea completada suma +1 a las 4 estadísticas, con +3 a la que elijas.
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white text-xs font-bold rounded-xl shadow-lg"
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121420] border-2 border-red-600 rounded-3xl p-5 max-w-md w-full shadow-2xl relative space-y-3.5">
            <div className="flex items-center gap-2.5 text-red-400">
              <div className="p-2 bg-red-950 rounded-xl border border-red-500/50">
                <Skull className="w-6 h-6 text-red-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-red-100 uppercase tracking-wide">
                  ¿Declarar Misión Fallida?
                </h3>
                <p className="text-[11px] text-red-300">
                  El descuido tiene un precio tangible para tu héroe.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-300">
              ¿Estás seguro de que deseas rendirte en la misión{' '}
              <span className="font-bold text-amber-300">"{taskToFail.title}"</span>?
            </p>

            <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3.5 text-xs space-y-1.5 text-red-200">
              <p className="font-bold text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Consecuencias reales inmediatas:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-200">
                <li>
                  <span className="font-bold text-red-300">Deleveling directo:</span>{' '}
                  {taskToFail.difficulty === 'dificil' || taskToFail.difficulty === 'epica'
                    ? 'Pérdida de 2 niveles completos'
                    : 'Pérdida de 1 nivel completo'}{' '}
                  (La barra de EXP se vacía al 0%).
                </li>
                <li>
                  <span className="font-bold text-red-300">Degradación de combate:</span> Reducción permanente de Vida Máxima (-15 HP/nivel) y stats (-2 a ataque, velocidad, defensa y conocimiento por nivel).
                </li>
                <li>
                  <span className="font-bold text-red-300">Maldición por Incumplimiento:</span> -15% de ganancia de EXP en mazmorras durante 24 horas.
                </li>
                <li>
                  <span className="font-bold text-amber-300">Deuda de Honor:</span> Se abrirá una ventana de 24 horas para completar la tarea y recuperar el 50% de la EXP perdida.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTaskToFail(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition"
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
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950 transition active:scale-95 flex items-center gap-1.5"
              >
                <Skull className="w-3.5 h-3.5" />
                <span>Sí, Declarar Fallida</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
