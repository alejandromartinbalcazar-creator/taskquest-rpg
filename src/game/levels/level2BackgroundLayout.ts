import { resolveMaskMovement } from './maskMovement';

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

export function canWalkAt(x: number, y: number, gateOpen: boolean): boolean {
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
  resolveMaskMovement(entity, previous, (x, y) => canWalkAt(x, y, gateOpen));
}
