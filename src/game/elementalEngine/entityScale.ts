import type { GameEnemy } from './types';

// Integer virtual pixels: wizard P=5; monumental Custodian P=7.
export const WIZARD_PANORAMA_SCALE = 2.5;
export const WIZARD_ROOM_SCALE = 1.5;
export const WIZARD_GROUND_RADIUS = 22;
export const CUSTODIAN_VISUAL_RADIUS = 112;
export const CUSTODIAN_GROUND_RADIUS = 32;
export const CUSTODIAN_DAMAGE_RADIUS = 140;
export const CUSTODIAN_DAMAGE_OFFSET_Y = -140;
export const CUSTODIAN_ARM_SPACING = 180;
export const CUSTODIAN_ARM_HEIGHT = -130;

/** Spell contact uses the body; navigation, separation and knockback use radius. */
export function getEnemyHurtbox(enemy: Pick<GameEnemy, 'x' | 'y' | 'radius' | 'damageRadius' | 'damageOffsetY'>) {
  return { x: enemy.x, y: enemy.y + (enemy.damageOffsetY ?? 0), radius: enemy.damageRadius ?? enemy.radius };
}

export function spellHitsEnemy(x: number, y: number, radius: number, enemy: GameEnemy): boolean {
  const body = getEnemyHurtbox(enemy);
  return Math.hypot(x - body.x, y - body.y) <= radius + body.radius;
}
