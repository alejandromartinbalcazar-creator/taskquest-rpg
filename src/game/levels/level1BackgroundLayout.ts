/**
 * Nivel 1 artesanal. El arte visible y su máscara de navegación comparten el
 * mismo tamaño: no hay que adivinar hitboxes a partir de una ilustración.
 */
export const LEVEL_1_BACKGROUND = '/assets/levels/level1-background.jpeg';
export const LEVEL_1_COLLISION_MASK = '/assets/levels/level1-collision.jpeg';

export const LEVEL_1_BACKGROUND_SIZE = {
  width: 3584,
  height: 1184,
} as const;

let collisionPixels: ImageData | null = null;
let loadingMask = false;

/** Carga la máscara fuera del bucle de combate. Es segura de invocar más de una vez. */
export function prepareLevel1CollisionMask(): void {
  if (collisionPixels || loadingMask || typeof document === 'undefined') return;
  loadingMask = true;
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = LEVEL_1_BACKGROUND_SIZE.width;
    canvas.height = LEVEL_1_BACKGROUND_SIZE.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(image, 0, 0);
      collisionPixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    loadingMask = false;
  };
  image.onerror = () => { loadingMask = false; };
  image.src = LEVEL_1_COLLISION_MASK;
}

function canWalkAt(x: number, y: number, gateOpen: boolean): boolean {
  if (!collisionPixels || x < 0 || y < 0 || x >= LEVEL_1_BACKGROUND_SIZE.width || y >= LEVEL_1_BACKGROUND_SIZE.height) return false;
  const pixel = (Math.floor(y) * LEVEL_1_BACKGROUND_SIZE.width + Math.floor(x)) * 4;
  const { data } = collisionPixels;
  const r = data[pixel];
  const g = data[pixel + 1];
  const b = data[pixel + 2];

  // La máscara es JPEG, por eso se usan rangos y no igualdad exacta de color.
  const isWalkableGreen = g > 125 && g > r * 1.35 && g > b * 1.35;
  const isGateYellow = r > 150 && g > 125 && b < 105;
  return isWalkableGreen || (gateOpen && isGateYellow);
}

/**
 * Valida centro y borde del personaje. Cuando un movimiento diagonal toca un
 * límite, resuelve X e Y por separado para conservar el componente paralelo
 * al muro: el mago se desliza, en lugar de quedar detenido en seco.
 */
export function resolveLevel1MaskMovement(
  entity: { x: number; y: number; radius: number },
  previous: { x: number; y: number },
  gateOpen: boolean,
): void {
  prepareLevel1CollisionMask();
  if (!collisionPixels) return;
  // El punto físico del mago es el apoyo de sus pies. La parte alta del sprite
  // puede pasar visualmente frente a ramas y salientes si el suelo bajo él es válido.
  const inset = Math.max(6, entity.radius * 0.48);
  const samples = [
    [0, entity.radius * 0.34],
    [inset, entity.radius * 0.34], [-inset, entity.radius * 0.34],
    [0, entity.radius * 0.34 + inset * 0.65], [0, entity.radius * 0.34 - inset * 0.45],
  ];
  const isWalkablePosition = (x: number, y: number) =>
    samples.every(([dx, dy]) => canWalkAt(x + dx, y + dy, gateOpen));

  // Movimiento libre completo.
  if (isWalkablePosition(entity.x, entity.y)) return;

  // Wall sliding: intentar cada eje por separado desde la última posición
  // válida. Esto es idéntico para teclado y joystick porque ambos ya dejaron
  // su resultado en entity.x/entity.y.
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
    // En una esquina ambos ejes por sí solos funcionan. Mantener el de mayor
    // intención evita rebotes y micro-atascos al rozar salientes.
    if (Math.abs(entity.x - previous.x) >= Math.abs(entity.y - previous.y)) entity.y = previous.y;
    else entity.x = previous.x;
    return;
  }

  // Superficies diagonales y puntas: probar pequeños desvíos perpendiculares
  // al vector solicitado. Esto encuentra la cara libre de una roca triangular
  // sin teletransportar al jugador ni anular el impulso de avance.
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

    // Corner nudging: cuando el centro toca exactamente un vértice, buscar una
    // corrección corta ligeramente hacia delante para redondearlo con suavidad.
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
