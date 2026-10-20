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
  | 'barrel'
  | 'camp_tent'
  | 'energized_crystal'
  | 'permafrost_spike' // Estaca de Hielo+Tierra rompible con fuego/tierra
  | 'door_gate'
  | 'relic_chest'
  | 'tectonic_rubble'; // Escombros temporales de Puño Tectónico (Tierra+Tierra)

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
  lifeTimer?: number;
  maxLifeTimer?: number;
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
  isCelestial?: boolean;
  widthMultiplier?: number;
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

export type InfernalCrownPhase = 'preparation' | 'expansion' | 'ring' | 'detonation' | 'finished';

export interface InfernalCrownEntity {
  id: string;
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number;
  phase: InfernalCrownPhase;
  phaseTimer: number;
  prepDurationMs: number;
  expansionDurationMs: number;
  ringDurationMs: number;
  detonationDurationMs: number;
  periodicDamage: number;
  periodicIntervalMs: number;
  detonationDamage: number;
  knockback: number;
  lastDamagePerEnemy: Record<string, number>;
  hasDetonated: boolean;
  crackAngles: number[];
  isCharged?: boolean;
}

export interface VoltaicJump {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  targetEnemyId: string;
  damage: number;
  isMaxCharge: boolean;
  delayMs: number;
  struck: boolean;
  isFinishRemate?: boolean;
}

export interface VoltaicChainEntity {
  id: string;
  sourceX: number;
  sourceY: number;
  chargeRatio: number;
  isMaxCharge: boolean;
  jumps: VoltaicJump[];
  elapsedMs: number;
  finished: boolean;
  visitedEnemyIds: string[];
}

export type GlacialEruptionPhase = 'emerging' | 'persisting' | 'shattering' | 'finished';

export interface GlacialSpikeSegment {
  index: number;
  x: number;
  y: number;
  maxHeight: number;
  currentHeight: number;
  width: number;
  rotationOffset: number;
  emerged: boolean;
  emergeDelayMs: number;
  shatterProgress: number;
}

export interface GlacialEruptionEntity {
  id: string;
  startX: number;
  startY: number;
  aimAngle: number;
  segments: GlacialSpikeSegment[];
  currentStep: number;
  totalSteps: number;
  stepIntervalMs: number;
  elapsedMs: number;
  damage: number;
  knockup: number;
  isCharged: boolean;
  phase: GlacialEruptionPhase;
  phaseTimer: number;
  persistDurationMs: number;
  shatterDurationMs: number;
  hitEnemyIds: string[];
}

export type TectonicFistPhase = 'warning' | 'eruption' | 'collapse' | 'finished';

export interface TectonicFistEntity {
  id: string;
  targetX: number;
  targetY: number;
  radius: number;
  damage: number;
  knockup: number;
  isCharged: boolean;
  phase: TectonicFistPhase;
  phaseTimer: number;
  warningDurationMs: number;
  eruptionDurationMs: number;
  collapseDurationMs: number;
  hasDealtDamage: boolean;
  fistHeight: number;
  maxFistHeight: number;
  crackAngles: number[];
  rubbleSpawned: boolean;
  rubbleCount: number;
}

export interface CryoBeamEntity {
  id: string;
  originX?: number;
  originY?: number;
  aimAngle: number;
  range: number;
  width: number;
  damagePerTick: number;
  isCharged: boolean;
  durationMs: number;
  elapsedMs: number;
  lastTickMs: number;
  tickIntervalMs: number;
  finished: boolean;
  enemyExposure: Record<string, number>;
  lastEnemyTick: Record<string, number>;
  dissipating: boolean;
  dissipateTimer: number;
}

// BOMBARDEO VOLCÁNICO (FUEGO + TIERRA: GRIETAS, COLUMNAS DE MAGMA Y BOMBAS DE LAVA BALÍSTICAS)
export type VolcanicPhase = 'warning' | 'eruption' | 'cooling' | 'finished';

export interface LavaBombEntity {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  currentHeight: number; // Elevación parabólica sobre el suelo (máx ~35-50px)
  progress: number; // 0.0 a 1.0
  durationMs: number; // ~320-400 ms
  elapsedMs: number;
  damage: number; // 40% del daño de impacto de columna
  radius: number; // radio de la bomba ~6-9px
  hasExploded: boolean;
}

export interface VolcanicFissureEntity {
  id: string;
  x: number;
  y: number;
  radius: number; // ~28-36px
  delayMs: number; // Escalonamiento orgánico entre fisuras (0, 45, 90, 135, 180 ms)
  elapsedMs: number;
  phase: VolcanicPhase;
  columnHeight: number; // 0 subiendo hasta maxColumnHeight
  maxColumnHeight: number; // ~85-115px
  warningDurationMs: number; // ~280ms
  eruptionDurationMs: number; // ~260ms
  coolingDurationMs: number; // ~260ms
  crackAngles: number[];
  hasDealtDamage: boolean;
  bombsSpawned: boolean;
  hitEnemyIds: string[];
}

export interface VolcanicBombardmentEntity {
  id: string;
  centerX: number;
  centerY: number;
  isCharged: boolean;
  totalDamage: number;
  fissures: VolcanicFissureEntity[];
  lavaBombs: LavaBombEntity[];
  finished: boolean;
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

// ARQUITECTURA DE NIVEL EXTENDIDO 2.5D, PUZLE ELEMENTAL Y CHUNKS

export interface PuzzleWheelEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  charge: number; // 0 a 100%
  rotationAngle: number; // radianes de giro
  isCompleted: boolean;
  frostVisual: number; // 0 a 1 nivel de escarcha
  hitFlash: number;
  lastHitTime: number;
  sparks: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>;
}

export interface GateDoorEntity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
  openProgress: number; // 0 (cerrado) a 1.0 (abierto)
  solid: boolean;
  pillarLeftX: number;
  pillarRightX: number;
}

export interface ForestTreeEntity {
  id: string;
  x: number; // base Y para depth sort
  y: number;
  trunkRadius: number; // collider
  canopyRadius: number; // radio de follaje
  canopyHeight: number; // elevación visual
  treeType: 'pine' | 'oak' | 'ancient';
  canopyAlpha: number; // 1.0 normal, 0.65 cuando el mago pasa debajo
  foliageColor: string;
  trunkColor: string;
}

export interface AmbientLeafParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  flutterSeed: number;
  alpha: number;
}

export interface LevelChunk {
  id: string;
  indexX: number;
  indexY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  zone: 'camp' | 'trail' | 'gate' | 'arena';
}

export interface ForestLevelData {
  worldWidth: number;
  worldHeight: number;
  chunks: LevelChunk[];
  trees: ForestTreeEntity[];
  puzzleWheel: PuzzleWheelEntity;
  gateDoor: GateDoorEntity;
  boundaryColliders: Array<{ x: number; y: number; radius: number }>;
  ambientLeaves: AmbientLeafParticle[];
  trailWaypoints: Array<{ x: number; y: number; width: number }>;
}
