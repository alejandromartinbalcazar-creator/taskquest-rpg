import type { Player, Task, StatType } from '../types';
import { checkAndUnlockMilestones } from '../data/heroMilestones';
import { getNextTaskDueDate } from './taskRecurrence';
import { StorageService } from './storageService';

export interface TaskCompletionAction {
  key: string; taskId: string; dueDate: string; completedAt: string; nextDueDate?: string | null;
}

/** Same mission rules for app, reminders and durable widget commands. No UI effects. */
export function completeTaskState(player: Player, tasks: Task[], taskId: string,
  options: { now?: Date; action?: TaskCompletionAction } = {}) {
  const action = options.action;
  const now = options.now || (action ? new Date(action.completedAt) : new Date());
  const task = tasks.find((item) => item.id === taskId && !item.completed);
  const receipts = player.processedWidgetActions || [];
  if (!task || !Number.isFinite(now.getTime()) || (action && (receipts.includes(action.key) || task.dueDate !== action.dueDate))) return null;
  let updatedPlayer: Player;
  let updatedTasks: Task[];
  let milestones: ReturnType<typeof checkAndUnlockMilestones>['newlyUnlocked'] = [];
  if (task.isHonorDebt) {
    const result = StorageService.redeemHonorDebt(player, tasks, taskId, false);
    updatedPlayer = result.updatedPlayer;
    updatedTasks = result.updatedTasks.map((item) => item.id === taskId ? { ...item, completedAt: now.toISOString() } : item);
  } else {
    const today = now.toISOString().slice(0, 10), last = player.lastCompletedDate?.slice(0, 10);
    const difference = last ? Math.round((new Date(today).getTime() - new Date(last).getTime()) / 86400000) : Infinity;
    const streak = !last ? 1 : difference === 1 ? (player.cleanStreakDays || 1) + 1 : difference > 1 ? 1 : player.cleanStreakDays || 1;
    const evaluation = checkAndUnlockMilestones({ ...player, cleanStreakDays: streak,
      totalTasksCompleted: (player.totalTasksCompleted || 0) + 1,
      highPriorityTasksCompleted: (player.highPriorityTasksCompleted || 0) + (['dificil', 'epica'].includes(task.difficulty) ? 1 : 0),
      lastCompletedDate: now.toISOString() });
    milestones = evaluation.newlyUnlocked;
    const stats = { ...player.stats };
    for (const stat of ['attack', 'speed', 'defense', 'knowledge'] as StatType[]) stats[stat] = (stats[stat] || 10) + (stat === task.statAffinity ? 3 : 1);
    const extraHp = task.statAffinity === 'defense' ? 2 : 0;
    updatedPlayer = { ...evaluation.updatedPlayer, stats, dungeonKeys: player.dungeonKeys + 1,
      skillPoints: evaluation.updatedPlayer.skillPoints + (task.statAffinity === 'knowledge' && stats.knowledge % 5 === 0 ? 1 : 0),
      maxHp: evaluation.updatedPlayer.maxHp + extraHp,
      currentHp: Math.min(evaluation.updatedPlayer.maxHp + extraHp, evaluation.updatedPlayer.currentHp + 10) };
    // Preserve the existing EXP/gold/level formula, including its healing rule.
    updatedPlayer = { ...updatedPlayer, exp: updatedPlayer.exp + task.expReward, gold: updatedPlayer.gold + task.goldReward,
      currentHp: Math.min(updatedPlayer.maxHp, updatedPlayer.currentHp + 10) };
    if (updatedPlayer.exp >= updatedPlayer.maxExp) {
      const level = updatedPlayer.level + 1;
      const hp = 100 + (level - 1) * 15 + (updatedPlayer.unlockedMilestones?.includes('primer_paso') ? 20 : 0);
      updatedPlayer = { ...updatedPlayer, level, exp: updatedPlayer.exp - updatedPlayer.maxExp,
        maxExp: StorageService.calculateMaxExpForLevel(level), maxHp: hp, currentHp: hp, skillPoints: updatedPlayer.skillPoints + 2 };
    }
    const next = action && 'nextDueDate' in action ? action.nextDueDate : getNextTaskDueDate(task, now);
    updatedTasks = tasks.map((item) => item.id !== taskId ? item : next
      ? { ...item, completed: false, dueDate: next, penalizedCount: 0,
        reminderType: item.reminderType === 'absolute' ? 'at_due' : item.reminderType,
        reminderStoppedDueDate: undefined,
        reminderAt: item.reminderType === 'absolute' ? undefined : item.reminderAt }
      : { ...item, completed: true, completedAt: now.toISOString() });
  }
  if (action) updatedPlayer = { ...updatedPlayer, processedWidgetActions: [...receipts, action.key].slice(-512) };
  return { player: updatedPlayer, tasks: updatedTasks, milestones, levelUp: updatedPlayer.level > player.level, redeemed: Boolean(task.isHonorDebt) };
}
