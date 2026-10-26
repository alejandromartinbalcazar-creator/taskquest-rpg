/**
 * Geometría del fondo de Nivel 1. El arte y la física viven separados:
 * cambiar una ilustración no crea hitboxes accidentales.
 */
export const LEVEL_1_BACKGROUND = '/assets/levels/level1-background.jpeg';

export const LEVEL_1_BACKGROUND_SIZE = {
  width: 2752,
  height: 979,
} as const;

export interface WalkableLane {
  /** Límite inclusivo de la zona por la que se puede caminar. */
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * La calzada central del fondo. Las franjas verdes, muros, árboles, charcos
 * y portón permanecen fuera de estos límites. Más adelante, cada sala puede
 * recortar o ampliar este carril sin editar la imagen.
 */
export const LEVEL_1_WALKABLE_LANES: readonly WalkableLane[] = [
  { minX: 36, maxX: 2400, minY: 382, maxY: 617 },
] as const;

export interface Level1DecorationCollider {
  x: number;
  y: number;
  width: number;
  height: number;
  label: 'trunk' | 'puddle' | 'frozen-gate';
}

/**
 * Obstáculos visibles del fondo. Se mantienen explícitos, pequeños y
 * auditables: nunca se deducen por el color de los píxeles de la imagen.
 */
export const LEVEL_1_DECORATION_COLLIDERS: readonly Level1DecorationCollider[] = [
  { x: 660, y: 282, width: 82, height: 72, label: 'trunk' },
  { x: 1764, y: 286, width: 88, height: 72, label: 'trunk' },
  { x: 670, y: 594, width: 96, height: 85, label: 'trunk' },
  { x: 1758, y: 598, width: 96, height: 85, label: 'trunk' },
  { x: 1116, y: 324, width: 192, height: 52, label: 'puddle' },
  { x: 1108, y: 642, width: 198, height: 56, label: 'puddle' },
  { x: 2412, y: 0, width: 340, height: 979, label: 'frozen-gate' },
] as const;

/** Desliza un círculo fuera de los objetos pintados en el fondo. */
export function resolveLevel1DecorationCollisions(entity: { x: number; y: number; radius: number }): void {
  for (const collider of LEVEL_1_DECORATION_COLLIDERS) {
    const left = collider.x;
    const top = collider.y;
    const right = collider.x + collider.width;
    const bottom = collider.y + collider.height;
    const closestX = Math.max(left, Math.min(entity.x, right));
    const closestY = Math.max(top, Math.min(entity.y, bottom));
    const dx = entity.x - closestX;
    const dy = entity.y - closestY;
    const distance = Math.hypot(dx, dy);

    if (distance >= entity.radius) continue;

    if (distance > 0.001) {
      const overlap = entity.radius - distance + 0.1;
      entity.x += (dx / distance) * overlap;
      entity.y += (dy / distance) * overlap;
      continue;
    }

    // Centro dentro del rectángulo: expulsar por el borde más cercano.
    const distances = [entity.x - left, right - entity.x, entity.y - top, bottom - entity.y];
    const side = distances.indexOf(Math.min(...distances));
    if (side === 0) entity.x = left - entity.radius - 0.1;
    else if (side === 1) entity.x = right + entity.radius + 0.1;
    else if (side === 2) entity.y = top - entity.radius - 0.1;
    else entity.y = bottom + entity.radius + 0.1;
  }
}

export function isInsideLevel1Walkway(x: number, y: number, radius = 0): boolean {
  return LEVEL_1_WALKABLE_LANES.some((lane) => (
    x - radius >= lane.minX
    && x + radius <= lane.maxX
    && y - radius >= lane.minY
    && y + radius <= lane.maxY
  ));
}
