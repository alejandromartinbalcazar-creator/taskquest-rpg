export interface PooledParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  size: number;
  color: string;
  secondaryColor?: string;
  alpha: number;
  life: number;
  maxLife: number;
  type?: 'spark' | 'smoke' | 'ember' | 'ice' | 'crystal' | 'ring' | 'lightning_arc' | 'dust' | 'stone_chip';
  rotation?: number;
  vRot?: number;
  active: boolean;
}

export interface ParticleSpawnOptions {
  id?: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  radius?: number;
  size?: number;
  color?: string;
  secondaryColor?: string;
  alpha?: number;
  life?: number;
  maxLife?: number;
  type?: PooledParticle['type'];
  rotation?: number;
  vRot?: number;
}

/**
 * ParticlePool: Piscina de memoria fija con CERO asignación dinámica durante el combate.
 * Diseñada para sostener 60 FPS estables en Android/Capacitor sin disparar el Garbage Collector de V8.
 */
export class ParticlePool {
  public static readonly MAX_PARTICLES = 250;
  public readonly pool: PooledParticle[];
  private nextFreeIndex = 0;

  constructor(maxSize: number = ParticlePool.MAX_PARTICLES) {
    this.pool = new Array<PooledParticle>(maxSize);
    for (let i = 0; i < maxSize; i++) {
      this.pool[i] = {
        id: '',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 2,
        size: 3,
        color: '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 18,
        active: false,
      };
    }
  }

  /**
   * Spawnea o recicla una partícula en la piscina sin invocar 'new Object()'.
   */
  public spawn(opts: ParticleSpawnOptions): PooledParticle | null {
    const len = this.pool.length;
    let target: PooledParticle | null = null;

    // 1. Búsqueda rápida desde el puntero libre
    for (let i = 0; i < len; i++) {
      const idx = (this.nextFreeIndex + i) % len;
      const candidate = this.pool[idx];
      if (!candidate.active) {
        target = candidate;
        this.nextFreeIndex = (idx + 1) % len;
        break;
      }
    }

    // 2. Si la piscina está 100% saturada, reciclar la partícula con menor vida restante
    if (!target) {
      let lowestLife = Infinity;
      let lowestIdx = 0;
      for (let i = 0; i < len; i++) {
        if (this.pool[i].life < lowestLife) {
          lowestLife = this.pool[i].life;
          lowestIdx = i;
        }
      }
      target = this.pool[lowestIdx];
    }

    const rad = opts.radius ?? 2;
    const sz = opts.size ?? Math.max(2, Math.round(rad * 1.8));
    const maxLife = opts.maxLife ?? opts.life ?? 18;
    const life = opts.life ?? maxLife;

    target.id = opts.id || '';
    target.x = opts.x;
    target.y = opts.y;
    target.vx = opts.vx ?? 0;
    target.vy = opts.vy ?? 0;
    target.radius = rad;
    target.size = sz;
    target.color = opts.color ?? '#ffffff';
    target.secondaryColor = opts.secondaryColor;
    target.alpha = opts.alpha ?? 1;
    target.life = life;
    target.maxLife = maxLife;
    target.type = opts.type;
    target.rotation = opts.rotation;
    target.vRot = opts.vRot;
    target.active = true;

    return target;
  }

  /**
   * Actualiza el ciclo de vida, físicas y aplica culling estricto fuera de cámara.
   * Sin llamadas a splice() ni mutaciones de array.
   */
  public update(
    cameraX: number,
    cameraY: number,
    viewportHalfW: number = 550,
    viewportHalfH: number = 380,
    cullMargin: number = 64
  ): void {
    const len = this.pool.length;
    const minX = cameraX - viewportHalfW - cullMargin;
    const maxX = cameraX + viewportHalfW + cullMargin;
    const minY = cameraY - viewportHalfH - cullMargin;
    const maxY = cameraY + viewportHalfH + cullMargin;

    for (let i = 0; i < len; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      // 1. Culling Estricto: Desactivar de inmediato si sale del área de cámara
      if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
        p.active = false;
        continue;
      }

      // 2. Físicas y Tiempo de Vida
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'ring') {
        p.radius += 1.5;
        p.size = Math.max(2, Math.round(p.radius * 1.8));
      }

      if (p.vRot) {
        p.rotation = (p.rotation || 0) + p.vRot;
      }
    }
  }

  /**
   * Devuelve la cantidad de partículas activas en este cuadro.
   */
  public getActiveCount(): number {
    let count = 0;
    const len = this.pool.length;
    for (let i = 0; i < len; i++) {
      if (this.pool[i].active) count++;
    }
    return count;
  }

  /**
   * Resetea todas las partículas a estado inactivo al cambiar de sala o reiniciar.
   */
  public clear(): void {
    const len = this.pool.length;
    for (let i = 0; i < len; i++) {
      this.pool[i].active = false;
      this.pool[i].life = 0;
    }
    this.nextFreeIndex = 0;
  }
}
