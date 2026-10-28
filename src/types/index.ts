export * from './progress';

export type StatType = 'attack' | 'speed' | 'defense' | 'knowledge';

export type TaskDifficulty = 'facil' | 'media' | 'dificil' | 'epica';

export type ReminderType =
  | 'none'
  | 'absolute'
  | 'at_due'
  | '5_minutes_before'
  | '30_minutes_before'
  | '1_hour_before'
  | '1_day_before'
  | '2_days_before'
  | '3_days_before'
  | '1_week_before'
  | 'constant'
  | 'custom';

export type TaskRecurrence =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'weekdays'
  | 'custom_days';

export interface Task {
  id: string;
  title: string;
  description?: string;
  statAffinity: StatType;
  difficulty: TaskDifficulty;
  expReward: number;
  goldReward: number;
  dueDate: string; // ISO string
  reminderType?: ReminderType;
  reminderCustomMinutes?: number;
  /** Independent local reminder time in ISO format. */
  reminderAt?: string;
  recurrence?: TaskRecurrence;
  recurrenceDays?: number[]; // [1, 2, 3, 4, 5, 6, 0] donde 1=Lunes, 2=Martes... 0=Domingo
  completed: boolean;
  completedAt?: string;
  isFailed?: boolean;
  failedAt?: string;
  isHonorDebt?: boolean;
  honorDebtExpiresAt?: string;
  recoveredExpOnRedeem?: number;
  penalizedCount?: number; // Veces que ha causado daño por vencimiento
  penalizedDelevelCount?: number; // Veces que ha causado deleveling directo
}

export type BaseElement = 'fire' | 'lightning' | 'earth' | 'ice';

export type SkillNodeType = 'core' | 'fire' | 'lightning' | 'earth' | 'ice' | 'fusion';

export interface RadialSkillNode {
  id: string;
  name: string;
  nodeType: SkillNodeType;
  element?: BaseElement;
  tier: number; // 0 = centro, 1..3 = ramas, 2 = fusión
  angleDeg: number; // Ángulo en grados desde el centro (0=Norte, 90=Este, etc.)
  radiusPx: number; // Distancia en px desde el centro
  costSP: number;
  unlocked: boolean;
  requires: string[]; // IDs de nodos necesarios
  description: string;
  damageBonus?: string;
  icon: string;
  isFusion?: boolean;
  fusionElements?: [BaseElement, BaseElement];
}

export interface ElementSkillNode {
  id: string;
  element: BaseElement;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  costSP: number;
  unlocked: boolean;
  damageMultiplier: number;
  defenseBonus?: number;
  icon: string;
}

export interface FusedSpell {
  id: string;
  name: string;
  elements: [BaseElement, BaseElement];
  description: string;
  icon: string;
  color: string;
  power: number;
  cooldownTurns: number;
  specialEffect: string;
}

export interface PlayerStats {
  attack: number;    // Ataque (fuerza de hechizos y combate)
  speed: number;     // Velocidad (agilidad, movimiento y esquiva)
  defense: number;   // Resistencia (absorción de daño, armadura y HP)
  knowledge: number; // Conocimiento (puntos de skill SP y sabiduría)
}

export interface Player {
  name: string;
  title: string;
  level: number;
  exp: number;
  maxExp: number;
  currentHp: number;
  maxHp: number;
  gold: number;
  dungeonKeys: number;
  skillPoints: number;
  stats: PlayerStats;
  unlockedSkills: string[];
  equippedSpells: (ElementSkillNode | FusedSpell)[];
  unlockedFusions: string[];
  totalTasksCompleted: number;
  totalDamageSufferedFromProcrastination: number;
  cleanStreakDays: number;
  lastDamageTimestamp?: string;
  // Sistema de Deleveling y Consecuencias Severas
  isAgony?: boolean; // Estado de Bancarrota / Agonía (cuando falla en Nivel 1)
  curseExpiresAt?: string; // Fin de la Maldición por Incumplimiento (-15% EXP)
  isCursed?: boolean;
  totalDelevelsSuffered?: number;
  delevelHistory?: DelevelRecord[];
  // Sistema de Progresión Directa e Hitos del Héroe
  unlockedMilestones?: string[];
  graceShieldCharges?: number;
  highPriorityTasksCompleted?: number;
  lastCompletedDate?: string;
  tutorialCompleted?: boolean;
}

export interface DelevelRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  timestamp: string;
  previousLevel: number;
  newLevel: number;
  levelsLost: number;
  hpLost: number;
  statsLost: {
    attack: number;
    speed: number;
    defense: number;
    knowledge: number;
  };
  isAgonyTriggered?: boolean;
  redeemed?: boolean;
}

export interface DelevelEvent {
  task: Task;
  previousLevel: number;
  newLevel: number;
  levelsLost: number;
  hpLost: number;
  statsLost: {
    attack: number;
    speed: number;
    defense: number;
    knowledge: number;
  };
  isAgony: boolean;
  isGraceShieldAbsorbed?: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  title: string;
  avatar: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  weakness: BaseElement | 'fusion';
  expReward: number;
  goldReward: number;
}

export interface DungeonFloor {
  floorNumber: number;
  name: string;
  description: string;
  recommendedLevel: number;
  enemy: Enemy;
  isBoss: boolean;
  cleared: boolean;
}
