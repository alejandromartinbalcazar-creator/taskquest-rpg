import React, { useState, useEffect, useCallback } from 'react';
import { Player, Task, DungeonFloor, StatType, ElementSkillNode, FusedSpell, DelevelEvent } from './types';
import { StorageService } from './services/storageService';
import { sound } from './services/soundService';
import { HeroHeader } from './components/HeroHeader';
import { Navbar, TabType } from './components/Navbar';
import { TaskView } from './components/TaskView';
import { SkillsView } from './components/SkillsView';
import { DungeonView } from './components/DungeonView';
import { CharacterView } from './components/CharacterView';
import { StatsView } from './components/StatsView';
import { ApkExportModal } from './components/ApkExportModal';
import { DelevelModal } from './components/DelevelModal';
import confetti from 'canvas-confetti';

export function App() {
  const [player, setPlayer] = useState<Player>(() => StorageService.getPlayer());
  const [tasks, setTasks] = useState<Task[]>(() => StorageService.getTasks());
  const [dungeons, setDungeons] = useState<DungeonFloor[]>(() => StorageService.getDungeons());
  const [currentTab, setCurrentTab] = useState<TabType>('tasks');
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isDamagedAnimation, setIsDamagedAnimation] = useState(false);
  const [delevelModalEvent, setDelevelModalEvent] = useState<DelevelEvent | null>(null);

  // Guardar en Storage al cambiar estados
  useEffect(() => {
    StorageService.savePlayer(player);
  }, [player]);

  useEffect(() => {
    StorageService.saveTasks(tasks);
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
      let newHp = Math.min(prev.maxHp, prev.currentHp + 10); // Regenera vida al completar tareas
      let newMaxHp = prev.maxHp;

      // Subida de nivel
      if (newExp >= newMaxExp) {
        newExp = newExp - newMaxExp;
        newLevel += 1;
        newMaxExp = Math.floor(newMaxExp * 1.4);
        newSP += 2; // +2 Puntos de Habilidad por nivel
        newMaxHp += 15;
        newHp = newMaxHp; // Curación completa al subir nivel

        sound.playLevelUp();
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
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
        totalTasksCompleted: prev.totalTasksCompleted + 1,
      };
    });
  };

  // Completar Tarea
  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.completed) return;

    sound.playTaskComplete();
    confetti({ particleCount: 50, spread: 60 });

    // Ganar EXP, Oro y 1 Llave de Mazmorra
    grantExp(task.expReward, task.goldReward);

    // Distribución de estadísticas:
    // "cada que se completa una actividad da puntos a las 4 categorias, pero más del específico"
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
        ...prev,
        dungeonKeys: prev.dungeonKeys + 1,
        skillPoints: prev.skillPoints + extraSP,
        maxHp: prev.maxHp + extraMaxHp,
        currentHp: Math.min(prev.maxHp + extraMaxHp, prev.currentHp + 10),
        stats,
      };
    });

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          if (t.recurrence === 'daily') {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 1);
            return { ...t, completed: false, dueDate: nextDate.toISOString(), penalizedCount: 0 };
          } else if (t.recurrence === 'weekly') {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 7);
            return { ...t, completed: false, dueDate: nextDate.toISOString(), penalizedCount: 0 };
          } else if (t.recurrence === 'monthly') {
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 1);
            return { ...t, completed: false, dueDate: nextDate.toISOString(), penalizedCount: 0 };
          } else if (t.recurrence === 'yearly') {
            const nextDate = new Date();
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            return { ...t, completed: false, dueDate: nextDate.toISOString(), penalizedCount: 0 };
          } else if (t.recurrence === 'custom_days' && t.recurrenceDays && t.recurrenceDays.length > 0) {
            // Buscar el próximo día seleccionado de la semana
            const todayDay = new Date().getDay();
            let daysToAdd = 1;
            while (daysToAdd <= 7) {
              const targetDay = (todayDay + daysToAdd) % 7;
              if (t.recurrenceDays.includes(targetDay)) break;
              daysToAdd++;
            }
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + daysToAdd);
            return { ...t, completed: false, dueDate: nextDate.toISOString(), penalizedCount: 0 };
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

  // Desbloquear Habilidad en el Árbol
  const handleUnlockSkill = (skillId: string, costSP: number) => {
    if (player.skillPoints < costSP) return;

    sound.playTaskComplete();
    setPlayer((prev) => ({
      ...prev,
      skillPoints: prev.skillPoints - costSP,
      unlockedSkills: [...prev.unlockedSkills, skillId],
    }));
  };

  // Desbloquear Fusión Elemental
  const handleUnlockFusion = (fusionId: string) => {
    setPlayer((prev) => {
      if (prev.unlockedFusions.includes(fusionId)) return prev;
      return {
        ...prev,
        unlockedFusions: [...prev.unlockedFusions, fusionId],
      };
    });
  };

  // Equipar Hechizo (hasta 3 slots)
  const handleEquipSpell = (spell: ElementSkillNode | FusedSpell) => {
    setPlayer((prev) => {
      const alreadyEquipped = prev.equippedSpells.some((s) => s.id === spell.id);
      if (alreadyEquipped) {
        return {
          ...prev,
          equippedSpells: prev.equippedSpells.filter((s) => s.id !== spell.id),
        };
      }
      // Mantener máximo 3
      const updated = [spell, ...prev.equippedSpells.slice(0, 2)];
      return {
        ...prev,
        equippedSpells: updated,
      };
    });
  };

  // Asignar Puntos de Atributo (Ataque, Velocidad, Resistencia, Conocimiento)
  const handleAllocateStat = (stat: StatType) => {
    if (player.skillPoints <= 0) return;
    sound.playMicroStepDing();
    setPlayer((prev) => ({
      ...prev,
      skillPoints: prev.skillPoints - 1,
      stats: {
        ...prev.stats,
        [stat]: prev.stats[stat] + 1,
      },
      maxHp: stat === 'defense' ? prev.maxHp + 10 : prev.maxHp,
      currentHp: stat === 'defense' ? prev.currentHp + 10 : prev.currentHp,
    }));
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
  const handleTakeBattleDamage = (damage: number) => {
    setIsDamagedAnimation(true);
    setTimeout(() => setIsDamagedAnimation(false), 400);
    setPlayer((prev) => ({
      ...prev,
      currentHp: Math.max(0, prev.currentHp - damage),
    }));
  };

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

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-[#090a10] text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* Cabecera Superior del Héroe */}
      <HeroHeader
        player={player}
        tasks={tasks}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        isDamagedAnimation={isDamagedAnimation}
      />

      {/* Vistas Principales */}
      <main>
        {currentTab === 'tasks' && (
          <TaskView
            player={player}
            tasks={tasks}
            onCompleteTask={handleCompleteTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onFailTask={handleFailTask}
            onRedeemHonorDebt={handleRedeemHonorDebt}
          />
        )}

        {currentTab === 'skills' && (
          <SkillsView
            player={player}
            onUnlockSkill={handleUnlockSkill}
            onUnlockFusion={handleUnlockFusion}
            onEquipSpell={handleEquipSpell}
          />
        )}

        {currentTab === 'dungeon' && (
          <DungeonView
            player={player}
            dungeons={dungeons}
            onBattleVictory={handleBattleVictory}
            onTakeBattleDamage={handleTakeBattleDamage}
            onConsumeKey={handleConsumeKey}
          />
        )}

        {currentTab === 'character' && (
          <CharacterView
            player={player}
            onUpdateName={handleUpdateHeroName}
            onAllocateStat={handleAllocateStat}
          />
        )}

        {currentTab === 'stats' && (
          <StatsView
            player={player}
            tasks={tasks}
            onDataImported={handleDataImported}
          />
        )}
      </main>

      {/* Barra de Navegación Inferior */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingTasksCount={pendingTasksCount}
        availableSp={player.skillPoints}
      />

      {/* Modal para Obtener APK y Modo PWA para Android */}
      <ApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Modal Dramático de Deleveling y Fractura de Poder */}
      {delevelModalEvent && (
        <DelevelModal
          event={delevelModalEvent}
          onClose={() => setDelevelModalEvent(null)}
        />
      )}
    </div>
  );
}

export default App;
