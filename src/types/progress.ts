export type MilestoneRequirementType = 'total_tasks' | 'streak_days' | 'high_priority_tasks';

export interface HeroMilestone {
  id: string;
  title: string;
  description: string;
  requirementType: MilestoneRequirementType;
  targetValue: number;
  rewardDescription: string;
  icon: string;
}

export interface PlayerProgressionStats {
  level: number;
  baseHp: number;
  levelHpBonus: number;
  milestoneHpBonus: number;
  maxHp: number;
  damageMultiplier: number; // e.g. 1.0 + (level - 1) * 0.04
  cooldownReduction: number; // e.g. Math.floor((level - 1) / 3) * 0.05
  fireDamageBonus: number; // e.g. 0.10 if unlocked
  holdChargeTime: number; // 0.4 if unlocked, 0.6 default
  moveSpeedMultiplier: number; // 1.15 if unlocked, 1.0 default
  hasLightningAura: boolean;
  graceShieldCharges: number;
}
