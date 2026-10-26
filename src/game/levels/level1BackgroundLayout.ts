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
 * Valida centro y borde del personaje. Si el siguiente paso toca un tronco,
 * muro, charco, bosque o portón cerrado, devuelve la posición anterior.
 */
export function resolveLevel1MaskMovement(
  entity: { x: number; y: number; radius: number },
  previous: { x: number; y: number },
  gateOpen: boolean,
): void {
  prepareLevel1CollisionMask();
  if (!collisionPixels) return;
  const inset = Math.max(8, entity.radius * 0.7);
  const samples = [
    [0, 0], [inset, 0], [-inset, 0], [0, inset], [0, -inset],
  ];
  if (samples.every(([dx, dy]) => canWalkAt(entity.x + dx, entity.y + dy, gateOpen))) return;

  // Conservar el último punto válido evita atravesar la decoración y hace que
  // el movimiento se sienta como un borde físico, no como un teletransporte.
  entity.x = previous.x;
  entity.y = previous.y;
}
