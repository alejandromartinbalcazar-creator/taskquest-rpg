import type { GameEnemy } from './types';

export const WIND_KNOCKBACK_DISTANCE = 110;
export const WIND_STUN_FRAMES = 15; // 0.25 seconds at the combat engine's fixed 60 Hz.

/** Sweep the complete knockback route so even thin obstacles stop the impulse. */
export function applyWindKnockback(
  enemy: Pick<GameEnemy, 'x' | 'y' | 'radius' | 'vx' | 'vy' | 'stunnedTimer'>,
  velocity: { x: number; y: number },
  canOccupy: (x: number, y: number, radius: number) => boolean,
  distance = WIND_KNOCKBACK_DISTANCE,
): void {
  enemy.stunnedTimer = Math.max(enemy.stunnedTimer || 0, WIND_STUN_FRAMES);
  enemy.vx = 0;
  enemy.vy = 0;
  const length = Math.hypot(velocity.x, velocity.y);
  if (length < 0.0001) return;
  const steps = Math.ceil(distance / 1.5);
  const dx = velocity.x / length * distance / steps;
  const dy = velocity.y / length * distance / steps;
  for (let step = 0; step < steps; step++) {
    if (!canOccupy(enemy.x + dx, enemy.y + dy, enemy.radius)) {
      // Finish at contact rather than snapping back or sliding through a corner.
      let low = 0;
      let high = 1;
      for (let iteration = 0; iteration < 5; iteration++) {
        const middle = (low + high) / 2;
        if (canOccupy(enemy.x + dx * middle, enemy.y + dy * middle, enemy.radius)) low = middle;
        else high = middle;
      }
      enemy.x += dx * low;
      enemy.y += dy * low;
      break;
    }
    enemy.x += dx;
    enemy.y += dy;
  }
}

/** Center and a dense perimeter for mask boundaries, including pointed corners. */
export function isWindCircleWalkable(
  x: number, y: number, radius: number,
  canWalkAt: (x: number, y: number) => boolean,
): boolean {
  if (!canWalkAt(x, y)) return false;
  for (let sample = 0; sample < 16; sample++) {
    const angle = sample * Math.PI / 8;
    if (!canWalkAt(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)) return false;
  }
  return true;
}
