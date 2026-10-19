import { Player, Task, DungeonFloor } from '../types';
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

  // Comprobar y penalizar tareas vencidas (Daño por procrastinación)
  public static checkProcrastinationDamage(
    player: Player,
    tasks: Task[]
  ): { updatedPlayer: Player; updatedTasks: Task[]; damageDealt: number; overdueTasks: Task[] } {
    const now = new Date().getTime();
    let damageDealt = 0;
    const overdueTasks: Task[] = [];

    const updatedTasks = tasks.map((task) => {
      if (!task.completed) {
        const dueTime = new Date(task.dueDate).getTime();
        if (dueTime < now) {
          overdueTasks.push(task);
          // Si no ha sido penalizada recientemente
          const penaltyCount = task.penalizedCount || 0;
          if (penaltyCount === 0) {
            damageDealt += 15; // 15 de daño directo por tarea vencida
            return { ...task, penalizedCount: penaltyCount + 1 };
          }
        }
      }
      return task;
    });

    let updatedPlayer = { ...player };

    if (damageDealt > 0) {
      const newHp = Math.max(0, updatedPlayer.currentHp - damageDealt);
      updatedPlayer = {
        ...updatedPlayer,
        currentHp: newHp,
        totalDamageSufferedFromProcrastination:
          updatedPlayer.totalDamageSufferedFromProcrastination + damageDealt,
        lastDamageTimestamp: new Date().toISOString(),
      };
      this.savePlayer(updatedPlayer);
      this.saveTasks(updatedTasks);
    }

    return {
      updatedPlayer,
      updatedTasks,
      damageDealt,
      overdueTasks,
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
