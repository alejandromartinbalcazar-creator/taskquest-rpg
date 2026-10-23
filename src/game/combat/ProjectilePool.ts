import { Projectile, SpellCastType, ElementType, ProjectileShape, StatusEffectType } from '../elementalEngine/types';

export interface PooledProjectile extends Projectile {
  active: boolean;
}

export interface ProjectileSpawnOptions {
  id?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius?: number;
  color?: string;
  secondaryColor?: string;
  damage?: number;
  knockback?: number;
  life?: number;
  maxLife?: number;
  pierce?: number;
  piercedIds?: string[];
  isHostile?: boolean;
  spellType: SpellCastType;
  element?: ElementType | 'physical';
  visualShape?: ProjectileShape;
  rotation?: number;
  vRot?: number;
  trailTimer?: number;
  statusToApply?: StatusEffectType;
  isBouncing?: boolean;
  onHitSpawn?: 'magma_fissure' | 'permafrost_spikes' | 'crystal_field' | 'steam_blast' | 'obsidian_volcano';
  beamTarget?: { x: number; y: number };
  beamForks?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  areaOfEffect?: number;
}

/**
 * ProjectilePool: Piscina de memoria fija para proyectiles y esquirlas mágicas.
 * Elimina la creación de objetos en el heap y llamadas destructivas a splice/filter.
 */
export class ProjectilePool {
  public static readonly MAX_PROJECTILES = 100;
  public readonly pool: PooledProjectile[];
  private nextFreeIndex = 0;

  constructor(maxSize: number = ProjectilePool.MAX_PROJECTILES) {
    this.pool = new Array<PooledProjectile>(maxSize);
    for (let i = 0; i < maxSize; i++) {
      this.pool[i] = {
        id: '',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 4,
        color: '#ffffff',
        damage: 10,
        knockback: 0,
        life: 0,
        maxLife: 60,
        pierce: 1,
        piercedIds: [],
        isHostile: false,
        spellType: 'fire_shot',
        active: false,
      };
    }
  }

  /**
   * Spawnea o reutiliza un proyectil en la piscina.
   */
  public spawn(opts: ProjectileSpawnOptions): PooledProjectile {
    const len = this.pool.length;
    let target: PooledProjectile | null = null;

    for (let i = 0; i < len; i++) {
      const idx = (this.nextFreeIndex + i) % len;
      const candidate = this.pool[idx];
      if (!candidate.active) {
        target = candidate;
        this.nextFreeIndex = (idx + 1) % len;
        break;
      }
    }

    if (!target) {
      // Reciclar el más antiguo o con menor vida restante
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

    const life = opts.life ?? opts.maxLife ?? 60;
    const maxLife = opts.maxLife ?? life;

    target.id = opts.id || `proj-${Date.now()}-${Math.random()}`;
    target.x = opts.x;
    target.y = opts.y;
    target.vx = opts.vx;
    target.vy = opts.vy;
    target.radius = opts.radius ?? 4;
    target.color = opts.color ?? '#ffffff';
    target.secondaryColor = opts.secondaryColor;
    target.damage = opts.damage ?? 10;
    target.knockback = opts.knockback ?? 0;
    target.life = life;
    target.maxLife = maxLife;
    target.pierce = opts.pierce ?? 1;
    target.piercedIds.length = 0;
    if (opts.piercedIds && opts.piercedIds.length > 0) {
      target.piercedIds.push(...opts.piercedIds);
    }
    target.isHostile = opts.isHostile ?? false;
    target.spellType = opts.spellType;
    target.element = opts.element;
    target.visualShape = opts.visualShape;
    target.rotation = opts.rotation;
    target.vRot = opts.vRot;
    target.trailTimer = opts.trailTimer;
    target.statusToApply = opts.statusToApply;
    target.isBouncing = opts.isBouncing;
    target.onHitSpawn = opts.onHitSpawn;
    target.beamTarget = opts.beamTarget;
    target.beamForks = opts.beamForks;
    target.areaOfEffect = opts.areaOfEffect;
    target.active = true;

    return target;
  }

  /**
   * Desactiva un proyectil sin usar splice().
   */
  public deactivate(p: PooledProjectile): void {
    p.active = false;
    p.life = 0;
  }

  /**
   * Culling estricto fuera de cámara: desactiva proyectiles que se alejen demasiado.
   */
  public culling(
    cameraX: number,
    cameraY: number,
    viewportHalfW: number = 600,
    viewportHalfH: number = 420,
    cullMargin: number = 96
  ): void {
    const len = this.pool.length;
    const minX = cameraX - viewportHalfW - cullMargin;
    const maxX = cameraX + viewportHalfW + cullMargin;
    const minY = cameraY - viewportHalfH - cullMargin;
    const maxY = cameraY + viewportHalfH + cullMargin;

    for (let i = 0; i < len; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
        p.active = false;
        p.life = 0;
      }
    }
  }

  /**
   * Filtra proyectiles hostiles en el lugar sin generar un nuevo array en memoria.
   */
  public filterHostile(predicate: (p: PooledProjectile) => boolean): void {
    const len = this.pool.length;
    for (let i = 0; i < len; i++) {
      const p = this.pool[i];
      if (p.active && p.isHostile) {
        if (!predicate(p)) {
          p.active = false;
          p.life = 0;
        }
      }
    }
  }

  /**
   * Desactiva todos los proyectiles hostiles.
   */
  public clearHostile(): void {
    const len = this.pool.length;
    for (let i = 0; i < len; i++) {
      const p = this.pool[i];
      if (p.active && p.isHostile) {
        p.active = false;
        p.life = 0;
      }
    }
  }

  /**
   * Devuelve un array con solo los proyectiles activos.
   */
  public getActive(): PooledProjectile[] {
    return this.pool.filter((p) => p.active && p.life > 0);
  }

  /**
   * Limpia toda la piscina de proyectiles.
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
