import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { checkAndUnlockMilestones } from './data/heroMilestones';
import { CloudSaveSnapshot } from './services/cloudSaveService';
import { useCloudSync } from './hooks/useCloudSync';
import { syncTaskReminderNotifications } from './services/taskReminders';
import { getNextTaskDueDate } from './services/taskRecurrence';
import { App as CapacitorApp } from '@capacitor/app';
import confetti from 'canvas-confetti';

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
      const params = new URL(url).searchParams;
      if (params.get('action') === 'add-task') {
        window.setTimeout(() => window.dispatchEvent(new Event('focusmission:new-task')), 100);
      }
      if (params.get('action') === 'edit-task' && params.get('taskId')) {
        const taskId = params.get('taskId')!;
        window.setTimeout(() => window.dispatchEvent(new CustomEvent('focusmission:edit-task', { detail: { taskId } })), 100);
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
    void syncTaskReminderNotifications(tasks);
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
    checkTaskPenalties();
    const interval = setInterval(checkTaskPenalties, 15000); // Chequeo cada 15 segundos
    return () => clearInterval(interval);
  }, [checkTaskPenalties]);

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
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.completed) return;

    sound.playTaskComplete();
    confetti({ particleCount: 50, spread: 60 });

    // Actualizar racha y contadores de progreso
    const todayStr = new Date().toISOString().slice(0, 10);
    let streak = player.cleanStreakDays || 1;
    if (!player.lastCompletedDate) {
      streak = 1;
    } else {
      const lastDateStr = player.lastCompletedDate.slice(0, 10);
      if (lastDateStr !== todayStr) {
        const diffDays = Math.round(
          (new Date(todayStr).getTime() - new Date(lastDateStr).getTime()) / (24 * 3600 * 1000)
        );
        if (diffDays === 1) {
          streak += 1;
        } else if (diffDays > 1) {
          streak = 1;
        }
      }
    }

    const isHighPriority = task.difficulty === 'dificil' || task.difficulty === 'epica';
    const nextTotalTasks = (player.totalTasksCompleted || 0) + 1;
    const nextHighPriorityTasks = (player.highPriorityTasksCompleted || 0) + (isHighPriority ? 1 : 0);

    // Evaluar Hitos del Héroe
    const milestoneEval = checkAndUnlockMilestones({
      ...player,
      cleanStreakDays: streak,
      totalTasksCompleted: nextTotalTasks,
      highPriorityTasksCompleted: nextHighPriorityTasks,
      lastCompletedDate: new Date().toISOString(),
    });

    if (milestoneEval.newlyUnlocked.length > 0) {
      sound.playMilestoneUnlock();
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.4 },
      });
      setMilestoneToast(milestoneEval.newlyUnlocked[0]);
    }

    // Actualizar jugador con hitos y progreso
    setPlayer((prev) => {
      const stats = { ...prev.stats };
      const chosen = task.statAffinity;

      (['attack', 'speed', 'defense', 'knowledge'] as StatType[]).forEach((s) => {
        if (s === chosen) {
          stats[s] = (stats[s] || 10) + 3;
        } else {
          stats[s] = (stats[s] || 10) + 1;
        }
      });

      // Bono de Conocimiento -> Skill Points
      const extraSP = chosen === 'knowledge' && stats.knowledge % 5 === 0 ? 1 : 0;
      // Bono de Resistencia -> Max HP
      const extraMaxHp = chosen === 'defense' ? 2 : 0;

      return {
        ...milestoneEval.updatedPlayer,
        dungeonKeys: prev.dungeonKeys + 1,
        skillPoints: milestoneEval.updatedPlayer.skillPoints + extraSP,
        maxHp: milestoneEval.updatedPlayer.maxHp + extraMaxHp,
        currentHp: Math.min(milestoneEval.updatedPlayer.maxHp + extraMaxHp, milestoneEval.updatedPlayer.currentHp + 10),
        stats,
      };
    });

    // Otorgar EXP y Oro
    grantExp(task.expReward, task.goldReward);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextDueDate = getNextTaskDueDate(t);
          if (nextDueDate) {
            return { ...t, completed: false, dueDate: nextDueDate, penalizedCount: 0 };
          }
          return { ...t, completed: true, completedAt: new Date().toISOString() };
        }
        return t;
      })
    );
  };

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
    setCurrentTab('tasks');
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
        {currentTab === 'tasks' && (
          <TaskView
            tasks={tasks}
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
