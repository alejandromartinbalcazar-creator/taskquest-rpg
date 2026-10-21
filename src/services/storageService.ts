import { Player, Task, DungeonFloor, DelevelEvent, DelevelRecord } from '../types';
import { DEFAULT_PLAYER, INITIAL_TASKS, INITIAL_DUNGEONS } from './gameData';

const KEYS = {
  PLAYER: 'taskquest_player_v1',
  TASKS: 'taskquest_tasks_v1',
  DUNGEONS: 'taskquest_dungeons_v1',
  LAST_CHECK: 'taskquest_last_check_v1',
};

export class StorageService {
  // Cargar jugador
  public static getPlayer(): Player {
    try {
      const data = localStorage.getItem(KEYS.PLAYER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading player data', e);
    }
    return DEFAULT_PLAYER;
  }

  // Guardar jugador
  public static savePlayer(player: Player): void {
    try {
      localStorage.setItem(KEYS.PLAYER, JSON.stringify(player));
    } catch (e) {
      console.error('Error saving player data', e);
    }
  }

  // Cargar tareas
  public static getTasks(): Task[] {
    try {
      const data = localStorage.getItem(KEYS.TASKS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading tasks', e);
    }
    return INITIAL_TASKS;
  }

  // Guardar tareas
  public static saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks', e);
    }
  }

  // Cargar mazmorras
  public static getDungeons(): DungeonFloor[] {
    try {
      const data = localStorage.getItem(KEYS.DUNGEONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading dungeons', e);
    }
    return INITIAL_DUNGEONS;
  }

  // Guardar mazmorras
  public static saveDungeons(dungeons: DungeonFloor[]): void {
    try {
      localStorage.setItem(KEYS.DUNGEONS, JSON.stringify(dungeons));
    } catch (e) {
      console.error('Error saving dungeons', e);
    }
  }

  // Calcular EXP máxima para un nivel dado de forma determinista y reversible
  public static calculateMaxExpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.4, Math.max(0, level - 1)));
  }

  // Aplicar penalización severa y deleveling por tarea fallida o expirada
  public static applyTaskDelevelPenalty(
    player: Player,
    task: Task
  ): { updatedPlayer: Player; updatedTask: Task; event: DelevelEvent } {
    const isCritical = task.difficulty === 'epica' || task.difficulty === 'dificil';
    const levelsToLose = isCritical ? 2 : 1;
    const prevLevel = player.level;
    const nowIso = new Date().toISOString();
    const curseEndIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const honorDebtEndIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    let targetLevel = prevLevel;
    let actualLevelsLost = 0;
    let hpLost = 0;
    let isAgony = false;
    let newMaxHp = player.maxHp;
    let newCurrentHp = player.currentHp;
    let statsLost = { attack: 0, speed: 0, defense: 0, knowledge: 0 };
    let newStats = { ...player.stats };

    if (prevLevel <= 1) {
      // PISO MÍNIMO SEGURO: Si está en Nivel 1, entra en BANCARROTA / AGONÍA
      targetLevel = 1;
      actualLevelsLost = 0;
      isAgony = true;
      hpLost = 35;
      newCurrentHp = Math.max(15, player.currentHp - 35);
      statsLost = { attack: 2, speed: 2, defense: 1, knowledge: 1 };
      newStats = {
        attack: Math.max(5, player.stats.attack - 2),
        speed: Math.max(5, player.stats.speed - 2),
        defense: Math.max(5, player.stats.defense - 1),
        knowledge: Math.max(5, player.stats.knowledge - 1),
      };
    } else {
      // DELEVELING DIRECTO (Pérdida de 1 o 2 niveles)
      targetLevel = Math.max(1, prevLevel - levelsToLose);
      actualLevelsLost = prevLevel - targetLevel;
      hpLost = actualLevelsLost * 15;
      newMaxHp = Math.max(70, player.maxHp - hpLost);
      newCurrentHp = Math.min(newMaxHp, Math.max(15, player.currentHp - hpLost));

      const statDeduction = actualLevelsLost * 2;
      statsLost = {
        attack: Math.min(player.stats.attack - 5, statDeduction),
        speed: Math.min(player.stats.speed - 5, statDeduction),
        defense: Math.min(player.stats.defense - 5, statDeduction),
        knowledge: Math.min(player.stats.knowledge - 5, statDeduction),
      };
      newStats = {
        attack: Math.max(5, player.stats.attack - statDeduction),
        speed: Math.max(5, player.stats.speed - statDeduction),
        defense: Math.max(5, player.stats.defense - statDeduction),
        knowledge: Math.max(5, player.stats.knowledge - statDeduction),
      };
    }

    const newMaxExp = this.calculateMaxExpForLevel(targetLevel);
    const expLostForDebt = Math.floor(this.calculateMaxExpForLevel(prevLevel) * 0.5);

    const delevelRecord: DelevelRecord = {
      id: `delevel-${Date.now()}-${Math.random()}`,
      taskId: task.id,
      taskTitle: task.title,
      timestamp: nowIso,
      previousLevel: prevLevel,
      newLevel: targetLevel,
      levelsLost: actualLevelsLost,
      hpLost,
      statsLost,
      isAgonyTriggered: isAgony,
      redeemed: false,
    };

    const updatedTask: Task = {
      ...task,
      isFailed: true,
      failedAt: nowIso,
      isHonorDebt: true,
      honorDebtExpiresAt: honorDebtEndIso,
      recoveredExpOnRedeem: expLostForDebt,
      penalizedDelevelCount: (task.penalizedDelevelCount || 0) + 1,
      penalizedCount: (task.penalizedCount || 0) + 1,
    };

    // Desequipar habilidades cuyo requisito de nivel supere el nuevo nivel del héroe
    // Nivel 6: Tier 3 | Nivel 4: Fusión | Nivel 3: Tier 2 | Nivel 1: Tier 1
    const safeEquippedSpells = player.equippedSpells.filter((spell) => {
      if ('elements' in spell) {
        return targetLevel >= 4;
      } else if ('tier' in spell) {
        if (spell.tier === 3) return targetLevel >= 6;
        if (spell.tier === 2) return targetLevel >= 3;
      }
      return true;
    });

    const updatedPlayer: Player = {
      ...player,
      level: targetLevel,
      exp: 0, // Vaciado de la barra de XP
      maxExp: newMaxExp,
      maxHp: newMaxHp,
      currentHp: newCurrentHp,
      stats: newStats,
      skillPoints: Math.max(0, player.skillPoints - actualLevelsLost * 2),
      equippedSpells: safeEquippedSpells,
      isAgony,
      isCursed: true,
      curseExpiresAt: curseEndIso,
      totalDelevelsSuffered: (player.totalDelevelsSuffered || 0) + actualLevelsLost,
      delevelHistory: [delevelRecord, ...(player.delevelHistory || [])],
      totalDamageSufferedFromProcrastination:
        player.totalDamageSufferedFromProcrastination + hpLost,
      lastDamageTimestamp: nowIso,
    };

    const event: DelevelEvent = {
      task: updatedTask,
      previousLevel: prevLevel,
      newLevel: targetLevel,
      levelsLost: actualLevelsLost,
      hpLost,
      statsLost,
      isAgony,
    };

    return { updatedPlayer, updatedTask, event };
  }

  // Comprobar y ejecutar deducciones acumuladas de deleveling por tareas vencidas
  public static checkOverdueTaskPenalties(
    player: Player,
    tasks: Task[]
  ): {
    updatedPlayer: Player;
    updatedTasks: Task[];
    delevelEvents: DelevelEvent[];
    urgentTasks: Task[];
    overdueTasks: Task[];
    damageDealt: number;
  } {
    const now = Date.now();
    const delevelEvents: DelevelEvent[] = [];
    const urgentTasks: Task[] = [];
    const overdueTasks: Task[] = [];
    let currentPlayer = { ...player };
    let damageDealt = 0;

    // Actualizar estado de maldición si ha expirado
    if (currentPlayer.curseExpiresAt && new Date(currentPlayer.curseExpiresAt).getTime() <= now) {
      currentPlayer.isCursed = false;
      currentPlayer.curseExpiresAt = undefined;
    }

    const updatedTasks = tasks.map((task) => {
      if (!task.completed) {
        const dueTime = new Date(task.dueDate).getTime();
        const hoursRemaining = (dueTime - now) / (1000 * 3600);

        // Tarea en urgencia (< 4 horas para vencer)
        if (hoursRemaining > 0 && hoursRemaining <= 4) {
          urgentTasks.push(task);
        }

        // Tarea vencida
        if (dueTime < now) {
          overdueTasks.push(task);

          // Si aún no ha sufrido el deleveling directo
          if (!task.penalizedDelevelCount || task.penalizedDelevelCount === 0) {
            const result = StorageService.applyTaskDelevelPenalty(currentPlayer, task);
            currentPlayer = result.updatedPlayer;
            delevelEvents.push(result.event);
            damageDealt += result.event.hpLost;
            return result.updatedTask;
          }
        }
      }
      return task;
    });

    if (delevelEvents.length > 0) {
      this.savePlayer(currentPlayer);
      this.saveTasks(updatedTasks);
    }

    return {
      updatedPlayer: currentPlayer,
      updatedTasks,
      delevelEvents,
      urgentTasks,
      overdueTasks,
      damageDealt,
    };
  }

  // Marcar manualmente una tarea como fallida (Rendirse / Asumir fallo con deleveling)
  public static failTaskManually(
    player: Player,
    tasks: Task[],
    taskId: string
  ): { updatedPlayer: Player; updatedTasks: Task[]; event: DelevelEvent | null } {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.completed) {
      return { updatedPlayer: player, updatedTasks: tasks, event: null };
    }

    const result = this.applyTaskDelevelPenalty(player, targetTask);
    const updatedTasks = tasks.map((t) => (t.id === taskId ? result.updatedTask : t));

    this.savePlayer(result.updatedPlayer);
    this.saveTasks(updatedTasks);

    return {
      updatedPlayer: result.updatedPlayer,
      updatedTasks,
      event: result.event,
    };
  }

  // Redención: Saldar una Deuda de Honor dentro de las 24 horas y recuperar el 50% de la XP perdida
  public static redeemHonorDebt(
    player: Player,
    tasks: Task[],
    taskId: string
  ): { updatedPlayer: Player; updatedTasks: Task[]; recoveredExp: number } {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.isHonorDebt) {
      return { updatedPlayer: player, updatedTasks: tasks, recoveredExp: 0 };
    }

    const recoveredExp = task.recoveredExpOnRedeem || Math.floor(this.calculateMaxExpForLevel(player.level) * 0.5);
    let newExp = player.exp + recoveredExp;
    let newLevel = player.level;
    let newMaxExp = player.maxExp;
    let newMaxHp = player.maxHp;
    let newHp = Math.min(player.maxHp, player.currentHp + 25);

    // Si la recuperación de XP alcanza para volver a subir de nivel
    if (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newMaxExp = this.calculateMaxExpForLevel(newLevel);
      newMaxHp += 15;
      newHp = newMaxHp;
    }

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: true,
          completedAt: new Date().toISOString(),
          isHonorDebt: false,
          honorDebtExpiresAt: undefined,
        };
      }
      return t;
    });

    // Actualizar historial marcando redención
    const updatedHistory = (player.delevelHistory || []).map((rec) => {
      if (rec.taskId === taskId) {
        return { ...rec, redeemed: true };
      }
      return rec;
    });

    const updatedPlayer: Player = {
      ...player,
      level: newLevel,
      exp: newExp,
      maxExp: newMaxExp,
      maxHp: newMaxHp,
      currentHp: newHp,
      isAgony: false, // Saldar deuda cura la agonía
      delevelHistory: updatedHistory,
      totalTasksCompleted: player.totalTasksCompleted + 1,
    };

    this.savePlayer(updatedPlayer);
    this.saveTasks(updatedTasks);

    return { updatedPlayer, updatedTasks, recoveredExp };
  }

  // Mantener compatibilidad con llamadas existentes
  public static checkProcrastinationDamage(
    player: Player,
    tasks: Task[]
  ): { updatedPlayer: Player; updatedTasks: Task[]; damageDealt: number; overdueTasks: Task[] } {
    const res = this.checkOverdueTaskPenalties(player, tasks);
    return {
      updatedPlayer: res.updatedPlayer,
      updatedTasks: res.updatedTasks,
      damageDealt: res.damageDealt,
      overdueTasks: res.overdueTasks,
    };
  }

  // Exportar todos los datos a JSON
  public static exportData(): string {
    const backup = {
      player: this.getPlayer(),
      tasks: this.getTasks(),
      dungeons: this.getDungeons(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  }

  // Importar datos desde JSON
  public static importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.player && data.tasks) {
        this.savePlayer(data.player);
        this.saveTasks(data.tasks);
        if (data.dungeons) this.saveDungeons(data.dungeons);
        return true;
      }
    } catch (e) {
      console.error('Invalid import data', e);
    }
    return false;
  }
}
