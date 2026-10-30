import type { GameEnemy } from './types';

// Integer virtual pixels: wizard P=5, Custodian P=5 on a taller silhouette.
export const WIZARD_PANORAMA_SCALE = 2.5;
export const WIZARD_ROOM_SCALE = 1.5;
export const WIZARD_GROUND_RADIUS = 22;
export const CUSTODIAN_VISUAL_RADIUS = 80;
export const CUSTODIAN_GROUND_RADIUS = 32;
export const CUSTODIAN_DAMAGE_RADIUS = 100;
export const CUSTODIAN_DAMAGE_OFFSET_Y = -100;
export const CUSTODIAN_ARM_SPACING = 140;
export const CUSTODIAN_ARM_HEIGHT = -90;
export const PROJECTILE_VISUAL_SCALE = 1.4;
export const WIZARD_VISUAL_HEIGHT = 24 * 5;

/** Pixel sizes are chosen per silhouette, never inferred from the movement radius. */
export function getCommonEnemyMetrics(enemy: Pick<GameEnemy, 'bestiaryType' | 'radius'>) {
  if (enemy.bestiaryType === 'pyre_golem') return { pixel: 5, head: -11, feet: 9, width: 24 };
  if (enemy.bestiaryType === 'storm_stalker') return { pixel: 4, head: -16, feet: 10, width: 17 };
  if (enemy.bestiaryType === 'frost_lurker') return { pixel: 6, head: -14, feet: 4, width: 20 };
  return { pixel: Math.max(1, Math.round(enemy.radius / 10)), head: -14, feet: 0, width: 20 };
}

/** Spell contact uses the body; navigation, separation and knockback use radius. */
export function getEnemyHurtbox(enemy: Pick<GameEnemy, 'x' | 'y' | 'radius' | 'damageRadius' | 'damageOffsetY'>) {
  return { x: enemy.x, y: enemy.y + (enemy.damageOffsetY ?? 0), radius: enemy.damageRadius ?? enemy.radius };
}

export function spellHitsEnemy(x: number, y: number, radius: number, enemy: GameEnemy): boolean {
  const body = getEnemyHurtbox(enemy);
  return Math.hypot(x - body.x, y - body.y) <= radius + body.radius;
}
