/** Arte y máscara navegable del Nivel 2: Campamento Glacial. */
export const LEVEL_2_BACKGROUND = '/assets/levels/level2-background.jpeg';
export const LEVEL_2_COLLISION_MASK = '/assets/levels/level2-collision.jpg';
export const LEVEL_2_BACKGROUND_SIZE = { width: 3584, height: 1184 } as const;

let collisionPixels: ImageData | null = null;
let loadingMask = false;

export function prepareLevel2CollisionMask(): void {
  if (collisionPixels || loadingMask || typeof document === 'undefined') return;
  loadingMask = true;
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = LEVEL_2_BACKGROUND_SIZE.width;
    canvas.height = LEVEL_2_BACKGROUND_SIZE.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(image, 0, 0);
      collisionPixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    loadingMask = false;
  };
  image.onerror = () => { loadingMask = false; };
  image.src = LEVEL_2_COLLISION_MASK;
}

function canWalkAt(x: number, y: number, gateOpen: boolean): boolean {
  if (!collisionPixels || x < 0 || y < 0 || x >= LEVEL_2_BACKGROUND_SIZE.width || y >= LEVEL_2_BACKGROUND_SIZE.height) return false;
  const pixel = (Math.floor(y) * LEVEL_2_BACKGROUND_SIZE.width + Math.floor(x)) * 4;
  const data = collisionPixels.data;
  const r = data[pixel]; const g = data[pixel + 1]; const b = data[pixel + 2];
  const green = g > 125 && g > r * 1.35 && g > b * 1.35;
  const yellow = r > 150 && g > 125 && b < 105;
  return green || (gateOpen && yellow);
}

export function resolveLevel2MaskMovement(
  entity: { x: number; y: number; radius: number },
  previous: { x: number; y: number },
  gateOpen: boolean,
): void {
  prepareLevel2CollisionMask();
  if (!collisionPixels) return;
  // Solo los pies del mago participan en la máscara. Su sombrero y báculo no
  // deben engancharse a decoración alta del fondo.
  const inset = Math.max(6, entity.radius * 0.48);
  const samples = [
    [0, entity.radius * 0.34],
    [inset, entity.radius * 0.34], [-inset, entity.radius * 0.34],
    [0, entity.radius * 0.34 + inset * 0.65], [0, entity.radius * 0.34 - inset * 0.45],
  ];
  const isWalkablePosition = (x: number, y: number) =>
    samples.every(([dx, dy]) => canWalkAt(x + dx, y + dy, gateOpen));
  if (isWalkablePosition(entity.x, entity.y)) return;

  // La misma resolución independiente de ejes del Nivel 1: el jugador sigue
  // avanzando paralelo al hielo, las rocas o las carpas al caminar en diagonal.
  const allowX = isWalkablePosition(entity.x, previous.y);
  const allowY = isWalkablePosition(previous.x, entity.y);
  if (allowX && !allowY) {
    entity.y = previous.y;
    return;
  }
  if (allowY && !allowX) {
    entity.x = previous.x;
    return;
  }
  if (allowX && allowY) {
    if (Math.abs(entity.x - previous.x) >= Math.abs(entity.y - previous.y)) entity.y = previous.y;
    else entity.x = previous.x;
    return;
  }

  // Deslizamiento sobre caras oblicuas y redirección alrededor de vértices.
  // Se prueba a ambos lados del rumbo, siempre manteniendo avance hacia donde
  // el jugador empuja, para que joystick y teclado se sientan iguales.
  const dx = entity.x - previous.x;
  const dy = entity.y - previous.y;
  const intendedLength = Math.hypot(dx, dy);
  if (intendedLength > 0.01) {
    const forwardX = dx / intendedLength;
    const forwardY = dy / intendedLength;
    const sideX = -forwardY;
    const sideY = forwardX;
    let best: { x: number; y: number; score: number } | null = null;
    for (const distance of [4, 8, 12, 18, 26]) {
      for (const side of [-1, 1]) {
        const candidateX = entity.x + sideX * distance * side;
        const candidateY = entity.y + sideY * distance * side;
        const progress = (candidateX - previous.x) * forwardX + (candidateY - previous.y) * forwardY;
        if (progress < intendedLength * 0.35 || !isWalkablePosition(candidateX, candidateY)) continue;
        const score = distance + Math.abs(progress - intendedLength) * 0.25;
        if (!best || score < best.score) best = { x: candidateX, y: candidateY, score };
      }
    }
    if (!best) {
      for (const distance of [5, 10, 16]) {
        for (const side of [-1, 1]) {
          const candidateX = previous.x + forwardX * Math.max(1, intendedLength * 0.6) + sideX * distance * side;
          const candidateY = previous.y + forwardY * Math.max(1, intendedLength * 0.6) + sideY * distance * side;
          const progress = (candidateX - previous.x) * forwardX + (candidateY - previous.y) * forwardY;
          if (progress <= 0 || !isWalkablePosition(candidateX, candidateY)) continue;
          const score = distance + Math.abs(progress - intendedLength) * 0.4;
          if (!best || score < best.score) best = { x: candidateX, y: candidateY, score };
        }
      }
    }
    if (best) {
      entity.x = best.x;
      entity.y = best.y;
      return;
    }
  }
  entity.x = previous.x;
  entity.y = previous.y;
}
