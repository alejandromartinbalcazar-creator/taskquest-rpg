// Camera.ts — Sistema de Cámara con Adelanto Dinámico (Lookahead / Lead Offset)
// Diseñado para vista 2.5D Magicka con cero asignaciones de memoria por fotograma

export interface CameraLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class CameraSystem {
  public x: number = 0;
  public y: number = 0;

  // Adelanto dinámico suave (Lookahead / Lead Offset)
  public currentOffsetX: number = 0;
  public currentOffsetY: number = 0;
  public targetOffsetX: number = 0;
  public targetOffsetY: number = 0;

  // Calibración de distancias óptimas según especificación
  public lookaheadDistX: number = 105; // 80 a 120 px hacia adelante
  public lookaheadDistY: number = 60;  // 50 a 70 px hacia adelante
  public lerpFactor: number = 0.10;    // 0.08 a 0.12 para fluidez sin retraso excesivo

  constructor(initialX: number = 0, initialY: number = 0) {
    this.x = initialX;
    this.y = initialY;
  }

  /**
   * Restablece la posición de la cámara inmediatamente (sin interpolación al reaparecer o cambiar de sala)
   */
  public reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.currentOffsetX = 0;
    this.currentOffsetY = 0;
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
  }

  /**
   * Actualiza la posición de la cámara aplicando Lookahead dinámico en base al vector de velocidad del jugador.
   * Evita cualquier asignación de objetos (new Vector) para garantizar 60 FPS fijos.
   */
  public update(
    playerX: number,
    playerY: number,
    vx: number,
    vy: number,
    facingAngle: number,
    dt: number,
    viewportWidth: number,
    viewportHeight: number,
    worldWidth: number,
    worldHeight: number,
    zoom: number = 1.32
  ): void {
    const speedSq = vx * vx + vy * vy;
    const isMoving = speedSq > 0.04;

    if (isMoving) {
      // Normalización matemática sin asignación de memoria
      const invSpeed = 1 / Math.sqrt(speedSq);
      const dirX = vx * invSpeed;
      const dirY = vy * invSpeed;

      this.targetOffsetX = dirX * this.lookaheadDistX;
      this.targetOffsetY = dirY * this.lookaheadDistY;
    } else {
      // Al detenerse: conserva una anticipación suave en la dirección de la mirada del héroe
      this.targetOffsetX = Math.cos(facingAngle) * 30;
      this.targetOffsetY = Math.sin(facingAngle) * 20;
    }

    // Suavizado del offset de adelanto
    const offsetRate = (isMoving ? 0.085 : 0.045) * Math.min(3, dt * 60);
    this.currentOffsetX += (this.targetOffsetX - this.currentOffsetX) * offsetRate;
    this.currentOffsetY += (this.targetOffsetY - this.currentOffsetY) * offsetRate;

    // Posición deseada
    const targetCamX = playerX + this.currentOffsetX;
    const targetCamY = playerY + this.currentOffsetY;

    // Interpolación LERP de la cámara hacia la posición anticipada
    const camRate = this.lerpFactor * Math.min(3, dt * 60);
    this.x += (targetCamX - this.x) * camRate;
    this.y += (targetCamY - this.y) * camRate;

    // Confinar a los límites del mapa evitando ver el vacío negro
    const halfViewW = (viewportWidth / zoom) / 2;
    const halfViewH = (viewportHeight / zoom) / 2;

    if (worldWidth > viewportWidth / zoom) {
      this.x = Math.max(halfViewW, Math.min(worldWidth - halfViewW, this.x));
    } else {
      this.x = worldWidth / 2;
    }

    if (worldHeight > viewportHeight / zoom) {
      this.y = Math.max(halfViewH, Math.min(worldHeight - halfViewH, this.y));
    } else {
      this.y = worldHeight / 2;
    }
  }
}
