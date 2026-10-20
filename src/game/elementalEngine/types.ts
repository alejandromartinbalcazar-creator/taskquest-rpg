// Tipos y Modelos Centrales para el Motor de Combate Mágico Elemental

export type ElementType = 'fire' | 'lightning' | 'ice' | 'earth';

export type ChanneledStreamType = 'fire' | 'ice';

export interface ChanneledStreamState {
  active: boolean;
  type: ChanneledStreamType;
  aimAngle: number;
  lockedEnemyId: string | null;
  range: number;
  spreadAngle: number;
  damageIntervalMs: number;
  damagePerTick: number;
  lastDamageTimestampPerEnemy: Record<string, number>;
  lastDamageTimestampPerObstacle: Record<string, number>;
  sourceButton?: 'element' | 'attack';
}

export type StatusEffectType = 'burning' | 'frozen' | 'slowed' | 'shocked' | 'wet';

export interface ActiveStatus {
  type: StatusEffectType;
  duration: number; // en segundos o frames
  maxDuration: number;
  tickTimer?: number;
  damagePerTick?: number;
}

export type SpellCastType =
  | 'basic_spark'
  // 1 Elemento
  | 'fire_shot'
  | 'lightning_bolt'
  | 'ice_shard'
  | 'earth_toss'
  // Duplicados puros
  | 'fire_inferno'
  | 'lightning_storm'
  | 'ice_lance'
  | 'earth_megalith'
  // Las 6 Combinaciones Prioritarias de 2 Elementos
  | 'thermal_shock'     // Fuego + Hielo
  | 'magma_eruption'    // Fuego + Tierra
  | 'crystal_field'     // Rayo + Tierra
  | 'cryo_storm'        // Hielo + Rayo
  | 'permafrost_prison' // Hielo + Tierra (Rediseño: estacas glaciales + fragmentación)
  | 'explosive_overload'// Fuego + Rayo
  // Combinaciones Avanzadas de 3 Elementos
  | 'obsidian_volcano'  // Fuego + Hielo + Tierra
  | 'conductive_prison' // Hielo + Tierra + Rayo
  | 'overload_core'     // Fuego + Tierra + Rayo
  // Combinación Suprema de 4 Elementos
  | 'elemental_cataclysm'; // Fuego + Rayo + Hielo + Tierra

export interface SpellRecipe {
  id: SpellCastType;
  name: string;
  elements: ElementType[]; // Sin importar orden
  description: string;
  icon: string;
  color: string;
  secondaryColor?: string;
  damage: number;
  knockback: number;
  cooldownMs: number;
  selfDamageRisk?: number; // 0..1 si explota demasiado cerca del mago
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  opacity: number;
  vy: number;
  life: number;
}

export interface Particle {
  id?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  secondaryColor?: string;
  alpha: number;
  life: number;
  maxLife?: number;
  type?: 'spark' | 'smoke' | 'ember' | 'ice' | 'crystal' | 'ring' | 'lightning_arc' | 'dust' | 'stone_chip';
  rotation?: number;
  vRot?: number;
}

export type ProjectileShape =
  | 'fire_comet'       // Meteorito de fuego con estela y flamas deformantes
  | 'lightning_beam'   // Descarga bifurcada en zig-zag instantánea
  | 'ice_lance'        // Cristal afilado facetado que gira
  | 'earth_boulder'    // Roca pesada poligonal con fisuras y polvo
  | 'thermal_core'     // Núcleo inestable vapor/escarcha en conflicto
  | 'magma_rock'       // Roca incandescente que fractura el suelo
  | 'cryo_shard'       // Fragmento helado con halo eléctrico
  | 'permafrost_wave'  // Fractura sísmica de hielo en el suelo
  | 'plasma_sphere'    // Núcleo de plasma acelerado
  | 'boss_orb';        // Orbe hostil oscuro

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  secondaryColor?: string;
  damage: number;
  knockback: number;
  life: number;
  maxLife: number;
  pierce: number;
  piercedIds: string[];
  isHostile: boolean;
  spellType: SpellCastType;
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

export interface TerrainZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  width?: number;
  height?: number;
  angle?: number;
  zoneType: 'magma' | 'frost' | 'water' | 'steam' | 'electric_field' | 'boss_hazard';
  life: number;
  maxLife: number;
  color: string;
  damagePerSec: number;
  slowFactor: number;
  isHazardForPlayer: boolean;
  tickTimer: number;
}

export type ObstacleType =
  | 'rock_pillar'
  | 'ice_wall'
  | 'crate'
  | 'energized_crystal'
  | 'permafrost_spike' // Estaca de Hielo+Tierra rompible con fuego/tierra
  | 'door_gate'
  | 'relic_chest';

export interface PhysicalObstacle {
  id: string;
  x: number;
  y: number;
  radius: number;
  width: number;
  height: number;
  obstacleType: ObstacleType;
  hp: number;
  maxHp: number;
  color: string;
  solid: boolean;
  blocksProjectiles: boolean;
  meltable: boolean;
  electrified?: boolean;
  chargeTimer?: number;
  // Para puertas y cofres
  doorLocked?: boolean;
  doorTargetRoomId?: string;
  doorDirection?: 'north' | 'south' | 'east' | 'west';
  isOpened?: boolean;
  chestReward?: RelicReward;
}

export interface ElectricArc {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  life: number;
}

export interface LightningBoltEffect {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
  glowColor: string;
  points: Array<{ x: number; y: number }>;
  branches: Array<Array<{ x: number; y: number }>>;
  chainLines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  life: number;
  maxLife: number;
}

export type EnemyArchetype = 'chaser' | 'ranged' | 'brute' | 'boss';

export type BossType = 'basalt_guardian' | 'storm_wraith' | 'obsidian_dragon';

export interface GameEnemy {
  id: string;
  name: string;
  archetype: EnemyArchetype;
  bossType?: BossType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  attackPower: number;
  moveSpeed: number;
  statuses: ActiveStatus[];
  color: string;
  avatar: string;
  weakness?: ElementType;
  resistance?: ElementType;
  attackCooldown: number;
  attackMaxCooldown: number;
  telegraphTimer: number;
  telegraphMax: number;
  isTelegraphing: boolean;
  aimAngle?: number;
  phase?: number;
  hitFlash: number;
  // Mecánicas de jefes
  isCharging?: boolean;
  chargeTarget?: { x: number; y: number };
  stunnedTimer?: number;
  armorShield?: number;
  maxArmorShield?: number;
  breathAngle?: number;
  breathActive?: boolean;
  teleportTimer?: number;
}

export interface OverloadCoreEntity {
  id: string;
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
  radius: number;
  damage: number;
}

// Estructura de Mazmorra con Múltiples Salas Conectadas
export type RoomType =
  | 'entrance'
  | 'combat_swarm'
  | 'hazard_traps'
  | 'crossfire'
  | 'relic_sanctuary'
  | 'boss_basalt'
  | 'boss_storm'
  | 'boss_dragon';

export interface DungeonRoom {
  id: string;
  title: string;
  subtitle: string;
  roomType: RoomType;
  cleared: boolean;
  enemiesSpawned: boolean;
  ambientColor?: string;
  doors: Doorway[];
}

export interface Doorway {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetRoomId: string;
  targetSpawnX: number;
  targetSpawnY: number;
  direction: 'north' | 'south' | 'east' | 'west';
  locked: boolean;
}

export interface RelicReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  elementAffinity: ElementType | 'all';
  bonusType:
    | 'fire_lingering'
    | 'ice_shatter_split'
    | 'lightning_extra_jump'
    | 'earth_shrapnel'
    | 'max_hp'
    | 'cooldown_reduct';
  value: number;
}
