type Position = { x: number; y: number };
type MaskEntity = Position & { radius: number };

const preferredSides = new WeakMap<MaskEntity, number>();

/** Swept foot contact: every slide spends the same distance budget as walking. */
export function resolveMaskMovement(
  entity: MaskEntity,
  previous: Position,
  canWalkAt: (x: number, y: number) => boolean,
): void {
  const dx = entity.x - previous.x;
  const dy = entity.y - previous.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.0001) return;

  const inset = Math.max(6, entity.radius * 0.48);
  const feetY = entity.radius * 0.34;
  const fits = (x: number, y: number) =>
    canWalkAt(x, y + feetY) &&
    canWalkAt(x + inset, y + feetY) &&
    canWalkAt(x - inset, y + feetY) &&
    canWalkAt(x, y + feetY + inset * 0.65) &&
    canWalkAt(x, y + feetY - inset * 0.45);

  // Subpixel steps also test the route, including dashes, instead of checking
  // only a distant destination on the other side of an obstacle.
  const steps = Math.ceil(distance / 0.75);
  const stepX = dx / steps;
  const stepY = dy / steps;
  let x = previous.x;
  let y = previous.y;
  let preferredSide = preferredSides.get(entity) ?? 1;

  for (let step = 0; step < steps; step++) {
    if (fits(x + stepX, y + stepY)) {
      x += stepX;
      y += stepY;
      continue;
    }

    let bestX = 0;
    let bestY = 0;
    let bestProgress = 0;
    let bestSide = preferredSide;
    const consider = (slideX: number, slideY: number, side: number) => {
      const progress = slideX * stepX + slideY * stepY;
      if (progress > bestProgress + 0.000001 && fits(x + slideX, y + slideY)) {
        bestX = slideX;
        bestY = slideY;
        bestProgress = progress;
        bestSide = side;
      }
    };

    // Preserve the unblocked component at its original speed on straight walls.
    consider(stepX, 0, preferredSide);
    consider(0, stepY, preferredSide);
    const hasFreeAxis = bestProgress > 0;

    // Project onto nearby directions to follow sloped faces and round tips.
    // Projection removes blocked momentum; it never adds lateral speed.
    // Prefer the previous side on ties so symmetric vertices do not alternate.
    for (let degrees = 15; !hasFreeAxis && degrees <= 75; degrees += 15) {
      const angle = degrees * Math.PI / 180;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      for (const side of [preferredSide, -preferredSide]) {
        consider(
          (stepX * cosine - stepY * sine * side) * cosine,
          (stepX * sine * side + stepY * cosine) * cosine,
          side,
        );
      }
    }

    if (bestProgress === 0) break;
    x += bestX;
    y += bestY;
    preferredSide = bestSide;
  }

  preferredSides.set(entity, preferredSide);
  entity.x = x;
  entity.y = y;
}
