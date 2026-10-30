import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Player, Task, DungeonFloor, StatType, DelevelEvent, HeroMilestone } from './types';
import { StorageService } from './services/storageService';
import { sound } from './services/soundService';
import { HeroHeader } from './components/HeroHeader';
import { Navbar, TabType } from './components/Navbar';
import { TaskView } from './components/TaskView';
import { DungeonView } from './components/DungeonView';
import { StatsView } from './components/StatsView';
import { ConcentrationTreeView } from './components/ConcentrationTreeView';
import { ApkExportModal } from './components/ApkExportModal';
import { DelevelModal } from './components/DelevelModal';
import { ChangelogModal } from './components/ChangelogModal';
import { HeroProgressModal } from './components/HeroProgressModal';
import { CloudSaveSnapshot } from './services/cloudSaveService';
import { useCloudSync } from './hooks/useCloudSync';
import { syncTaskReminderNotifications, type ReminderSyncStatus } from './services/taskReminders';
import { taskIdFromReminderExtra, reminderOccurrenceTask } from './services/reminderPlan';
import { pendingOverlayActions, acknowledgeOverlayActions, listenForReminderAlarm, dismissReminderAlarm, type OverlayAction } from './services/reminderOverlay';
import { MissionReminderSheet } from './components/MissionReminderSheet';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import confetti from 'canvas-confetti';
import { completeTaskState } from './services/taskCompletion';
import { syncTasksToAndroidWidget, acknowledgeWidgetActions, actionableWidgetCommands, widgetSectionForTask, type WidgetCommand } from './services/androidWidget';

export function App() {
  const [player, setPlayer] = useState<Player>(() => StorageService.getPlayer());
  const [tasks, setTasks] = useState<Task[]>(() => StorageService.getTasks());
  const [dungeons, setDungeons] = useState<DungeonFloor[]>(() => StorageService.getDungeons());
  const [currentTab, setCurrentTab] = useState<TabType>(() => player.tutorialCompleted ? 'tasks' : 'dungeon');
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isDamagedAnimation, setIsDamagedAnimation] = useState(false);
  const [delevelModalEvent, setDelevelModalEvent] = useState<DelevelEvent | null>(null);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [levelUpToast, setLevelUpToast] = useState<{ level: number; hpGain: number; dmgGain: number } | null>(null);
  const [milestoneToast, setMilestoneToast] = useState<HeroMilestone | null>(null);
  const [reminderStatus, setReminderStatus] = useState<ReminderSyncStatus>({ permission: 'unsupported', exact: false, scheduledTaskIds: [] });
  const [reminderTaskId, setReminderTaskId] = useState<string | null>(null);
  const [reminderPrompts, setReminderPrompts] = useState<{ taskId: string; dueDate: string; eventId?: number }[]>([]);
  const [nativeOverlayActions, setNativeOverlayActions] = useState<OverlayAction[]>([]);
  const completedReminderOccurrences = useRef(new Set<string>());
  const refreshAlarmsOnLaunch = useRef(true);
  const [reminderSettingsVersion, setReminderSettingsVersion] = useState(0);
  const [widgetFilter, setWidgetFilter] = useState<string | null>(null);
  const [widgetCreateRequested, setWidgetCreateRequested] = useState(false);
  const [widgetActions, setWidgetActions] = useState<WidgetCommand[]>([]);
  const [widgetRefresh, setWidgetRefresh] = useState(0);
  const [widgetReconciling, setWidgetReconciling] = useState(Capacitor.getPlatform() === 'android');
  const [widgetError, setWidgetError] = useState('');
  const widgetProcessing = useRef(false);

  // El Home se presenta en vertical; la mazmorra cambia a horizontal al abrirse.
  useEffect(() => {
    try {
      const orientation = window.screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
      void orientation.lock?.('portrait').catch(() => {});
    } catch {
      // Algunos navegadores solo permiten bloquear orientación en modo instalado o pantalla completa.
    }
  }, []);

  // El widget abre la app directamente en Misiones; el botón + abre el formulario.
  useEffect(() => {
    const handleWidgetUrl = (url: string) => {
      if (!url.startsWith('com.taskquest.rpg://widget')) return;
      setCurrentTab('tasks');
      setWidgetFilter(null);
      const params = new URL(url).searchParams;
      if (params.get('action') === 'section' && ['today', 'overdue', 'tomorrow'].includes(params.get('section') || '')) setWidgetFilter(params.get('section'));
      if (params.get('action') === 'add-task') {
        setWidgetCreateRequested(true);
      }
      if (params.get('action') === 'edit-task' && params.get('taskId')) {
        setReminderTaskId(params.get('taskId')!);
      }
    };
    void CapacitorApp.getLaunchUrl().then((launch) => launch?.url && handleWidgetUrl(launch.url));
    const listener = CapacitorApp.addListener('appUrlOpen', ({ url }) => handleWidgetUrl(url));
    return () => { void listener.then((handle) => handle.remove()); };
  }, []);

  const localSnapshot = useMemo<CloudSaveSnapshot>(() => ({
    schemaVersion: 1,
    player,
    tasks,
    dungeons,
  }), [dungeons, player, tasks]);

  const applyCloudSnapshot = useCallback((snapshot: CloudSaveSnapshot) => {
    setPlayer(snapshot.player);
    setTasks(snapshot.tasks);
    setDungeons(snapshot.dungeons);
  }, []);

  const cloudSync = useCloudSync({
    snapshot: localSnapshot,
    onApplyCloudSave: applyCloudSnapshot,
  });

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android' || !cloudSync.widgetSourceReady) return;
    let active = true;
    const source = cloudSync.userId || 'device';
    void syncTasksToAndroidWidget(tasks, source).then((commands) => {
      if (!active) return;
      const actions = actionableWidgetCommands(commands, player, tasks, source);
      setWidgetActions((previous) => JSON.stringify(previous) === JSON.stringify(actions) ? previous : actions);
      setWidgetReconciling(actions.length > 0); setWidgetError('');
    }).catch(() => { if (active) { setWidgetError('El widget conserva sus cambios pendientes. Vuelve a abrir la app para intentar sincronizarlos.'); setWidgetReconciling(false); } });
    return () => { active = false; };
  }, [tasks, player.processedWidgetActions, cloudSync.userId, cloudSync.widgetSourceReady, widgetRefresh]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => { if (isActive) { setWidgetReconciling(true); setWidgetRefresh((version) => version + 1); } });
    return () => { void listener.then((handle) => handle.remove()); };
  }, []);

  // Auto-cerrar alertas emergentes
  useEffect(() => {
    if (levelUpToast) {
      const timer = setTimeout(() => setLevelUpToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [levelUpToast]);

  useEffect(() => {
    if (milestoneToast) {
      const timer = setTimeout(() => setMilestoneToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [milestoneToast]);

  // Guardar en Storage al cambiar estados
  useEffect(() => {
    StorageService.savePlayer(player);
  }, [player]);

  useEffect(() => {
    StorageService.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    const refresh = () => setReminderSettingsVersion((version) => version + 1);
    window.addEventListener('focusmission:reminder-settings-changed', refresh);
    return () => window.removeEventListener('focusmission:reminder-settings-changed', refresh);
  }, []);

  useEffect(() => {
    let active = true;
    const refreshExisting = refreshAlarmsOnLaunch.current;
    refreshAlarmsOnLaunch.current = false;
    void syncTaskReminderNotifications(tasks, { refreshExisting }).then((status) => { if (active) setReminderStatus(status); });
    return () => { active = false; };
  }, [tasks, reminderSettingsVersion]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
      const taskId = taskIdFromReminderExtra(notification.extra);
      if (!taskId) return;
      setCurrentTab('tasks');
      const dueDate = (notification.extra as { dueDate?: unknown })?.dueDate;
      if (typeof dueDate === 'string') {
        setReminderPrompts((previous) => previous.some((item) => item.eventId === notification.id) ? previous : [...previous, { taskId, dueDate, eventId: notification.id }]);
      } else setReminderTaskId(taskId);
    });
    return () => { void listener.then((handle) => handle.remove()); };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = LocalNotifications.addListener('localNotificationReceived', (notification) => {
      const taskId = taskIdFromReminderExtra(notification.extra);
      const extra = notification.extra as { dueDate?: unknown } | undefined;
      if (taskId && typeof extra?.dueDate === 'string' && document.visibilityState === 'visible') {
        const dueDate = extra.dueDate;
        setReminderPrompts((previous) => previous.some((item) => item.eventId === notification.id) ? previous : [...previous, { taskId, dueDate, eventId: notification.id }]);
      }
    });
    return () => { void listener.then((handle) => handle.remove()); };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = listenForReminderAlarm(({ taskId, dueDate, eventId }) => {
      setReminderPrompts((previous) => previous.some((item) => item.taskId === taskId && item.dueDate === dueDate && item.eventId === eventId) ? previous : [...previous, { taskId, dueDate, eventId }]);
    });
    return () => { void listener.then((handle) => handle.remove()); };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    const read = () => { void pendingOverlayActions().then((actions) => { if (active) setNativeOverlayActions(actions); }).catch(console.warn); };
    read();
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => { if (isActive) read(); });
    return () => { active = false; void listener.then((handle) => handle.remove()); };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void syncTaskReminderNotifications(tasks).then((status) => { if (active) setReminderStatus(status); });
    });
    return () => { active = false; void listener.then((handle) => handle.remove()); };
  }, [tasks]);

  useEffect(() => {
    StorageService.saveDungeons(dungeons);
  }, [dungeons]);

  // SISTEMA DE CASTIGO CONTRA LA PROCRASTINACIÓN:
  // Chequea periódicamente si hay tareas cuya fecha límite expiró.
  // Aplica deleveling directo, degradación de atributos, reinicio de EXP,
  // maldición (-15% EXP en mazmorras) y activa la ventana de Deuda de Honor (24h).
  const checkTaskPenalties = useCallback(() => {
    const penaltyResult = StorageService.checkOverdueTaskPenalties(player, tasks);
    if (penaltyResult.delevelEvents.length > 0) {
      sound.playDelevelCrackSound();
      setIsDamagedAnimation(true);
      setTimeout(() => setIsDamagedAnimation(false), 700);
      setPlayer(penaltyResult.updatedPlayer);
      setTasks(penaltyResult.updatedTasks);
      setDelevelModalEvent(penaltyResult.delevelEvents[0]);
    }
  }, [player, tasks]);

  useEffect(() => {
    if (widgetReconciling || !cloudSync.widgetSourceReady) return;
    checkTaskPenalties();
    const interval = setInterval(checkTaskPenalties, 15000); // Chequeo cada 15 segundos
    return () => clearInterval(interval);
  }, [checkTaskPenalties, widgetReconciling, cloudSync.widgetSourceReady]);

  // Manejador de Ganancia de EXP y Level Up
  const grantExp = (amount: number, goldAmount: number = 0) => {
    setPlayer((prev) => {
      let newExp = prev.exp + amount;
      let newLevel = prev.level;
      let newMaxExp = prev.maxExp;
      let newSP = prev.skillPoints;
      let newMaxHp = prev.maxHp;
      let newHp = Math.min(prev.maxHp, prev.currentHp + 10); // Regenera vida al completar tareas

      // Subida de nivel
      if (newExp >= newMaxExp) {
        newExp = newExp - newMaxExp;
        newLevel += 1;
        newMaxExp = StorageService.calculateMaxExpForLevel(newLevel);
        newSP += 2; // +2 Puntos de Habilidad por nivel

        // Recalcular Max HP con base en fórmula: base 100 + (nivel - 1) * 15 + bono hito
        const unlocked = prev.unlockedMilestones || [];
        const milestoneHpBonus = unlocked.includes('primer_paso') ? 20 : 0;
        newMaxHp = 100 + (newLevel - 1) * 15 + milestoneHpBonus;
        newHp = newMaxHp; // Curación completa al subir nivel al 100%

        sound.playLevelUp();
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
        });

        setLevelUpToast({
          level: newLevel,
          hpGain: 15,
          dmgGain: 4,
        });
      }

      return {
        ...prev,
        level: newLevel,
        exp: newExp,
        maxExp: newMaxExp,
        currentHp: newHp,
        maxHp: newMaxHp,
        gold: prev.gold + goldAmount,
        skillPoints: newSP,
      };
    });
  };

  // Completar Tarea
  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId && !item.completed);
    if (!task) return;
    const occurrence = JSON.stringify([task.id, task.dueDate]);
    if (completedReminderOccurrences.current.has(occurrence)) return;
    const result = completeTaskState(player, tasks, taskId);
    if (!result) return;
    try { StorageService.saveCompletion(result.player, result.tasks); }
    catch { setWidgetError('No se pudo guardar el completado. Inténtalo otra vez.'); return; }
    completedReminderOccurrences.current.add(occurrence);
    setPlayer(result.player); setTasks(result.tasks);
    sound.playTaskComplete(); confetti({ particleCount: 50, spread: 60 });
    if (result.milestones.length) { sound.playMilestoneUnlock(); setMilestoneToast(result.milestones[0]); }
    if (result.levelUp) { sound.playLevelUp(); setLevelUpToast({ level: result.player.level, hpGain: 15, dmgGain: 4 }); }
  };

  useEffect(() => {
    if (!cloudSync.widgetSourceReady || widgetProcessing.current || widgetActions.length === 0) return;
    const action = widgetActions[0], source = cloudSync.userId || 'device';
    if (action.source !== source) { setWidgetActions([]); return; }
    widgetProcessing.current = true;
    const result = completeTaskState(player, tasks, action.taskId, { action });
    const nextTasks = result?.tasks || tasks;
    let confirmed = false;
    try {
      if (result) {
        StorageService.saveCompletion(result.player, result.tasks);
        setPlayer(result.player); setTasks(result.tasks);
      }
      void acknowledgeWidgetActions([action.key], nextTasks, source).then(() => {
        confirmed = true;
        setWidgetActions((previous) => previous.filter((item) => item.key !== action.key));
        setWidgetError('');
      }).catch(() => setWidgetError('La misión está guardada. Queda pendiente confirmar el widget.'))
        .finally(() => { widgetProcessing.current = false; if (confirmed) setWidgetRefresh((value) => value + 1); });
    } catch {
      widgetProcessing.current = false;
      setWidgetError('No se pudieron guardar los cambios del widget. Sus acciones siguen pendientes.');
    }
  }, [widgetActions, tasks, player, cloudSync.userId, cloudSync.widgetSourceReady, widgetRefresh]);
  useEffect(() => {
    if (widgetReconciling || ['checking', 'syncing', 'needs_choice'].includes(cloudSync.status)) return;
    // Persisted native commands are acknowledged only after React has saved the
    // completed occurrence (or it is already stale). A crash can safely retry.
    const first = nativeOverlayActions[0];
    if (!first) return;
    const task = reminderOccurrenceTask(tasks, first);
    if (task) {
      setCurrentTab('tasks');
      handleCompleteTask(task.id);
    } else {
      void acknowledgeOverlayActions([first.key]).then(() => {
        setNativeOverlayActions((previous) => previous.filter((action) => action.key !== first.key));
      }).catch(console.warn);
    }
  }, [nativeOverlayActions, tasks, cloudSync.status, widgetReconciling]);

  // Añadir Tarea (Limpio, con recurrencia)
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const task: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      completed: false,
      penalizedCount: 0,
    };

    setTasks((prev) => [task, ...prev]);
  };

  // Eliminar Tarea
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleUpdateTask = (taskId: string, updates: Omit<Task, 'id' | 'completed'>) => {
    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, ...updates } : task));
  };


  // Victoria en Mazmorra
  const handleBattleVictory = (floorNumber: number, expReward: number, goldReward: number) => {
    // Si la maldición por incumplimiento está activa, penalización del 15% de EXP
    const isCursed = !!(player.isCursed || (player.curseExpiresAt && new Date(player.curseExpiresAt).getTime() > Date.now()));
    const finalExp = isCursed ? Math.max(1, Math.floor(expReward * 0.85)) : expReward;
    grantExp(finalExp, goldReward);
    setDungeons((prev) =>
      prev.map((d) => (d.floorNumber === floorNumber ? { ...d, cleared: true } : d))
    );
  };

  // Rendirse / Declarar Tarea Fallida (Penalización Directa)
  const handleFailTask = (taskId: string) => {
    const result = StorageService.failTaskManually(player, tasks, taskId);
    if (result.event) {
      sound.playDelevelCrackSound();
      setIsDamagedAnimation(true);
      setTimeout(() => setIsDamagedAnimation(false), 700);
      setPlayer(result.updatedPlayer);
      setTasks(result.updatedTasks);
      setDelevelModalEvent(result.event);
    }
  };

  // Saldar Deuda de Honor (Recuperar 50% de EXP perdida)
  const handleRedeemHonorDebt = (taskId: string) => {
    const result = StorageService.redeemHonorDebt(player, tasks, taskId);
    if (result.recoveredExp > 0) {
      sound.playHonorRedeemedSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setPlayer(result.updatedPlayer);
      setTasks(result.updatedTasks);
    }
  };

  // Daño en Mazmorra
  const handleTakeBattleDamage = useCallback((damage: number) => {
    setIsDamagedAnimation(true);
    setTimeout(() => setIsDamagedAnimation(false), 400);
    setPlayer((prev) => ({
      ...prev,
      currentHp: Math.max(0, prev.currentHp - damage),
    }));
  }, []);

  const handleConsumeKey = () => {
    setPlayer((prev) => ({
      ...prev,
      dungeonKeys: Math.max(0, prev.dungeonKeys - 1),
    }));
  };

  const handleUpdateHeroName = (newName: string) => {
    setPlayer((prev) => ({ ...prev, name: newName }));
  };

  const handleDataImported = () => {
    setPlayer(StorageService.getPlayer());
    setTasks(StorageService.getTasks());
    setDungeons(StorageService.getDungeons());
  };

  const handleTutorialFinished = () => {
    setPlayer((prev) => ({ ...prev, tutorialCompleted: true }));
    // La puerta final del tutorial continúa directamente hacia el Nivel 1.
    // DungeonView conserva la mazmorra activa y muestra la primera expedición.
    setCurrentTab('dungeon');
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  // Las sesiones de concentración fortalecen únicamente la afinidad elegida.
  // El tiempo se muestra al jugador, pero cada sesión completada entrega un punto claro y predecible.
  const handleCompleteFocusSession = (affinity: StatType, _minutes: number) => {
    setPlayer((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [affinity]: prev.stats[affinity] + 1,
      },
    }));
  };

  return (
    <div className="min-h-screen min-h-dvh w-full bg-[#080b20] text-slate-100 font-sans selection:bg-violet-600 selection:text-white">
      <HeroHeader
        player={player}
        onOpenChangelogModal={() => setIsChangelogModalOpen(true)}
      />

      {/* Alerta Ceremonial de Subida de Nivel */}
      {levelUpToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-bounce">
          <div className="bg-gradient-to-r from-amber-900/95 via-yellow-900/95 to-amber-900/95 border-2 border-yellow-400 p-3.5 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.6)] flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-spin">🌟</span>
              <div>
                <div className="text-xs font-black text-yellow-300 uppercase tracking-widest">
                  ¡NIVEL {levelUpToast.level} ALCANZADO!
                </div>
                <div className="text-[11px] font-bold text-yellow-100 font-mono">
                  +{levelUpToast.hpGain} Vida Máxima | +{levelUpToast.dmgGain}% Daño Global
                </div>
              </div>
            </div>
            <button
              onClick={() => setLevelUpToast(null)}
              className="text-yellow-400 hover:text-white p-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Alerta Emergente de Hito Desbloqueado */}
      {milestoneToast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-fade-in">
          <div className="bg-gradient-to-r from-purple-950/95 via-stone-900/95 to-purple-950/95 border-2 border-amber-400 p-3.5 rounded-2xl shadow-[0_0_25px_rgba(234,179,8,0.5)] flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{milestoneToast.icon}</span>
              <div>
                <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
                  ✨ ¡HITO DEL HÉROE DESBLOQUEADO!
                </div>
                <div className="text-xs font-black text-white">
                  "{milestoneToast.title}"
                </div>
                <div className="text-[10px] text-amber-200">
                  {milestoneToast.rewardDescription}
                </div>
              </div>
            </div>
            <button
              onClick={() => setMilestoneToast(null)}
              className="text-stone-400 hover:text-white p-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Vistas Principales */}
      <main className="pb-24">
        {widgetError && <p role="status" className="mx-auto max-w-xl px-4 py-2 text-sm text-amber-200">{widgetError}</p>}
        {currentTab === 'tasks' && widgetFilter && <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-2 text-sm text-violet-200">
          <span>{widgetFilter === 'today' ? 'Hoy' : widgetFilter === 'overdue' ? 'Vencidas' : 'Mañana'}</span>
          <button type="button" className="underline" onClick={() => setWidgetFilter(null)}>Ver todas las misiones</button>
        </div>}
        {currentTab === 'tasks' && (
          <TaskView
            tasks={widgetFilter ? tasks.filter((task) => !task.completed && widgetSectionForTask(task) === widgetFilter) : tasks}
            reminderStatus={reminderStatus}
            externalTaskId={cloudSync.widgetSourceReady ? reminderTaskId : null}
            externalNewTask={cloudSync.widgetSourceReady && widgetCreateRequested}
            onExternalNewTaskHandled={() => setWidgetCreateRequested(false)}
            onExternalTaskHandled={() => setReminderTaskId(null)}
            onCompleteTask={handleCompleteTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
            onFailTask={handleFailTask}
            onRedeemHonorDebt={handleRedeemHonorDebt}
          />
        )}

        {currentTab === 'focus' && (
          <ConcentrationTreeView player={player} onCompleteSession={handleCompleteFocusSession} />
        )}

        {currentTab === 'dungeon' && (
          <DungeonView
            player={player}
            dungeons={dungeons}
            onBattleVictory={handleBattleVictory}
            onTakeBattleDamage={handleTakeBattleDamage}
            onConsumeKey={handleConsumeKey}
            onTutorialFinished={handleTutorialFinished}
          />
        )}

        {currentTab === 'stats' && (
          <StatsView
            player={player}
            tasks={tasks}
            accountSync={cloudSync}
            onDataImported={handleDataImported}
            onOpenChangelogModal={() => setIsChangelogModalOpen(true)}
          />
        )}
      </main>

      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingTasksCount={pendingTasksCount}
      />

      {reminderPrompts.length > 0 && (() => {
        const prompt = reminderPrompts.find((item) => reminderOccurrenceTask(tasks, item));
        const task = prompt && reminderOccurrenceTask(tasks, prompt);
        if (!task) return null;
        const dismiss = () => {
          void dismissReminderAlarm(task.id, task.dueDate, prompt?.eventId).catch(console.warn);
          setReminderPrompts((previous) => previous.filter((item) => item !== prompt));
        };
        return (
          <MissionReminderSheet task={task} onClose={dismiss} onDone={() => { dismiss(); handleCompleteTask(task.id); }} onOpen={() => {
            dismiss(); setWidgetFilter(null); setCurrentTab('tasks'); setReminderTaskId(task.id);
          }} />
        );
      })()}

      {/* Modal para Obtener APK y Modo PWA para Android */}
      <ApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Modal de Changelog y Notas de Versión (Activado por Easter Egg) */}
      <ChangelogModal
        isOpen={isChangelogModalOpen}
        onClose={() => setIsChangelogModalOpen(false)}
      />

      {/* Modal Dramático de Deleveling y Fractura de Poder */}
      {delevelModalEvent && (
        <DelevelModal
          event={delevelModalEvent}
          onClose={() => setDelevelModalEvent(null)}
        />
      )}

      {/* Modal de Progresión Directa e Hitos del Héroe */}
      {isProgressModalOpen && (
        <HeroProgressModal
          player={player}
          onClose={() => setIsProgressModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
