import { HeroMilestone, Player, PlayerProgressionStats } from '../types';

export const HERO_MILESTONES: HeroMilestone[] = [
  {
    id: 'primer_paso',
    title: 'Primer Paso',
    description: 'Completa 5 tareas de tu vida real.',
    requirementType: 'total_tasks',
    targetValue: 5,
    rewardDescription: 'Aura de Vigor (+20 HP permanente)',
    icon: '🌱',
  },
  {
    id: 'disciplina_fuego',
    title: 'Disciplina de Fuego',
    description: 'Mantén una racha de 3 días seguidos completando tareas.',
    requirementType: 'streak_days',
    targetValue: 3,
    rewardDescription: 'Bono Ígneo (+10% daño a habilidades de Fuego)',
    icon: '🔥',
  },
  {
    id: 'constancia_hierro',
    title: 'Constancia de Hierro',
    description: 'Mantén una racha de 7 días consecutivos.',
    requirementType: 'streak_days',
    targetValue: 7,
    rewardDescription: 'Escudo de Gracia (absorbe 1 fallo de tarea sin deleveling)',
    icon: '🛡️',
  },
  {
    id: 'maestro_enfoque',
    title: 'Maestro del Enfoque',
    description: 'Completa 10 tareas de prioridad Difícil o Épica.',
    requirementType: 'high_priority_tasks',
    targetValue: 10,
    rewardDescription: 'Tiempo de carga de Hold reducido de 0.6s a 0.4s',
    icon: '⚡',
  },
  {
    id: 'mente_inquebrantable',
    title: 'Mente Inquebrantable',
    description: 'Alcanza una racha legendaria de 14 días seguidos.',
    requirementType: 'streak_days',
    targetValue: 14,
    rewardDescription: '+15% velocidad en combate y aura de relámpago sutil',
    icon: '✨',
  },
];

/**
 * Calcula todas las estadísticas derivadas de la progresión y los hitos del héroe.
 */
export function calculatePlayerProgressionStats(player: Player): PlayerProgressionStats {
  const level = Math.max(1, player.level || 1);
  const baseHp = 100;
  const levelHpBonus = (level - 1) * 15;

  const unlocked = player.unlockedMilestones || [];
  const milestoneHpBonus = unlocked.includes('primer_paso') ? 20 : 0;
  const maxHp = baseHp + levelHpBonus + milestoneHpBonus;

  // +4% daño global por nivel
  const damageMultiplier = 1.0 + (level - 1) * 0.04;

  // Cada 3 niveles, -5% de cooldown
  const cooldownReduction = Math.floor((level - 1) / 3) * 0.05;

  // Bono de fuego +10%
  const fireDamageBonus = unlocked.includes('disciplina_fuego') ? 0.10 : 0;

  // Hold reducido a 0.4s vs 0.6s
  const holdChargeTime = unlocked.includes('maestro_enfoque') ? 0.4 : 0.6;

  // Velocidad de movimiento +15%
  const moveSpeedMultiplier = unlocked.includes('mente_inquebrantable') ? 1.15 : 1.0;
  const hasLightningAura = unlocked.includes('mente_inquebrantable');

  const graceShieldCharges = player.graceShieldCharges || 0;

  return {
    level,
    baseHp,
    levelHpBonus,
    milestoneHpBonus,
    maxHp,
    damageMultiplier,
    cooldownReduction,
    fireDamageBonus,
    holdChargeTime,
    moveSpeedMultiplier,
    hasLightningAura,
    graceShieldCharges,
  };
}

/**
 * Obtiene el progreso numérico de un hito específico para el jugador.
 */
export function getMilestoneProgress(
  milestone: HeroMilestone,
  player: Player
): { current: number; target: number; percentage: number; isUnlocked: boolean } {
  const unlocked = player.unlockedMilestones || [];
  const isUnlocked = unlocked.includes(milestone.id);

  let current = 0;
  if (milestone.requirementType === 'total_tasks') {
    current = player.totalTasksCompleted || 0;
  } else if (milestone.requirementType === 'streak_days') {
    current = player.cleanStreakDays || 0;
  } else if (milestone.requirementType === 'high_priority_tasks') {
    current = player.highPriorityTasksCompleted || 0;
  }

  const target = milestone.targetValue;
  const percentage = Math.min(100, Math.round((current / target) * 100));

  return {
    current: Math.min(current, target),
    target,
    percentage,
    isUnlocked,
  };
}

/**
 * Evalúa si el jugador ha alcanzado nuevos hitos y aplica sus recompensas.
 */
export function checkAndUnlockMilestones(player: Player): {
  updatedPlayer: Player;
  newlyUnlocked: HeroMilestone[];
} {
  const currentUnlocked = new Set(player.unlockedMilestones || []);
  const newlyUnlocked: HeroMilestone[] = [];
  let graceShieldCharges = player.graceShieldCharges || 0;

  for (const milestone of HERO_MILESTONES) {
    if (!currentUnlocked.has(milestone.id)) {
      let satisfied = false;
      if (milestone.requirementType === 'total_tasks') {
        satisfied = (player.totalTasksCompleted || 0) >= milestone.targetValue;
      } else if (milestone.requirementType === 'streak_days') {
        satisfied = (player.cleanStreakDays || 0) >= milestone.targetValue;
      } else if (milestone.requirementType === 'high_priority_tasks') {
        satisfied = (player.highPriorityTasksCompleted || 0) >= milestone.targetValue;
      }

      if (satisfied) {
        currentUnlocked.add(milestone.id);
        newlyUnlocked.push(milestone);

        // Si es Constancia de Hierro, otorga 1 carga de Escudo de Gracia
        if (milestone.id === 'constancia_hierro') {
          graceShieldCharges = Math.max(1, graceShieldCharges + 1);
        }
      }
    } else if (milestone.id === 'constancia_hierro') {
      // Recarga adicional si alcanza múltiplos de 7 días de racha
      const streak = player.cleanStreakDays || 0;
      if (streak >= 7 && streak % 7 === 0 && graceShieldCharges === 0) {
        graceShieldCharges += 1;
      }
    }
  }

  const stats = calculatePlayerProgressionStats({
    ...player,
    unlockedMilestones: Array.from(currentUnlocked),
    graceShieldCharges,
  });

  const updatedPlayer: Player = {
    ...player,
    unlockedMilestones: Array.from(currentUnlocked),
    graceShieldCharges,
    maxHp: stats.maxHp,
    // Asegurar que la vida actual no exceda el nuevo Max HP ni se quede desfasada
    currentHp: Math.min(stats.maxHp, player.currentHp),
  };

  return { updatedPlayer, newlyUnlocked };
}
