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
  // Combinaciones Triples Puras y Avanzadas
  | 'hell_rain'           // Fuego + Fuego + Fuego (🔥🔥🔥) - Lluvia del Infierno
  | 'celestial_storm'     // Rayo + Rayo + Rayo (⚡⚡⚡) - Tormenta Celestial
  | 'devastating_glacier' // Hielo + Hielo + Hielo (❄️❄️❄️) - Glaciar Devastador
  | 'telluric_barrier'    // Tierra + Tierra + Tierra (🌍🌍🌍) - Barrera Telúrica
  | 'obsidian_volcano'    // Fuego + Hielo + Tierra
  | 'conductive_prison' // Hielo + Tierra + Rayo
  | 'overload_core'     // Fuego + Tierra + Rayo
  | 'glacial_plasma_storm' // Fuego + Rayo + Hielo
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

export type BossType = 'basalt_guardian' | 'storm_wraith' | 'obsidian_dragon' | 'threshold_custodian';

export type BestiaryEnemyType = 'pyre_golem' | 'storm_stalker' | 'frost_lurker';

export interface CustodianFissureTelegraph {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  timer: number;
  maxTimer: number; // 800ms / ~48 frames
  hasErupted?: boolean;
}

export interface CustodianStalagmiteTelegraph {
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number; // 700ms / ~42 frames
  detonated?: boolean;
}

export interface CustodianNovaTelegraph {
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number;
  timer: number;
  maxTimer: number; // 900ms / ~54 frames
  detonated?: boolean;
}

export interface CustodianJudgmentTelegraph {
  bossX: number;
  bossY: number;
  timer: number;
  maxTimer: number; // 2.5s / 150 frames
  safeZones: Array<{ x: number; y: number; radius: number }>;
  dangerRadius: number;
  detonated?: boolean;
}

export interface CustodianGauntlet {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  slamProgress: number; // 0..1
}

export interface CustodianState {
  currentPhase: 1 | 2 | 3;
  shieldHp: number;
  maxShieldHp: number;
  isShieldBroken: boolean;
  shieldVulnerableTimer: number; // frames aturdido / x2.0 daño
  activeAttack: 'none' | 'magma_sweep' | 'telegraphed_fissure' | 'stalagmite_rain' | 'ice_nova' | 'judgment_ultimate';
  attackTimer: number;
  nextAttackCooldown: number;
  fissureTelegraph?: CustodianFissureTelegraph;
  stalagmitesTelegraph?: CustodianStalagmiteTelegraph[];
  novaTelegraph?: CustodianNovaTelegraph;
  judgmentTelegraph?: CustodianJudgmentTelegraph;
  leftGauntlet: CustodianGauntlet;
  rightGauntlet: CustodianGauntlet;
  isDefeated: boolean;
  defeatTimer: number;
  shockwaveActive?: boolean;
  shockwaveRadius?: number;
}

export interface GameEnemy {
  id: string;
  name: string;
  archetype: EnemyArchetype;
  bossType?: BossType;
  bestiaryType?: BestiaryEnemyType;
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
  facingAngle?: number;
  phase?: number;
  hitFlash: number;
  // Mecánicas especiales del Gólem de Escoria (Pyre Golem)
  cooledDownTimer?: number;    // Magma enfriado por Hielo (3s) -> grietas grises/ceniza, -50% vel, Tierra hace crítico contundente
  frenzyTimer?: number;        // Frenesí al recibir Fuego -> aumento temporal de velocidad
  // Mecánicas especiales del Espectro de Tormenta (Storm Stalker)
  orbitAngle?: number;          // Ángulo de órbita alrededor del mago
  teleportCooldown?: number;    // Enfriamiento de micro-dash evasivo lateral
  sparkTimer?: number;          // Temporizador de canalización de orbe de chispa eléctrica (cada 3.5s)
  // Mecánicas especiales del Acechador de Escarcha (Frost Lurker)
  shieldBrokenTimer?: number;   // Coraza frontal derretida por Fuego
  snipeTimer?: number;          // Temporizador de canalización de aguja de hielo rápida
  isSniping?: boolean;          // Indica si está canalizando la aguja de hielo telegrafiada
  snipeAngle?: number;          // Ángulo telegrafiado para el disparo recto
  // Mecánicas de jefes
  isCharging?: boolean;
  chargeTarget?: { x: number; y: number };
  stunnedTimer?: number;
  armorShield?: number;
  maxArmorShield?: number;
  breathAngle?: number;
  breathActive?: boolean;
  teleportTimer?: number;
  custodianState?: CustodianState;
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

// VÓRTICE DE CHOQUE TÉRMICO (FUEGO + HIELO: EXPANSIÓN RADIAL DE VAPOR, EMPUJE Y DETONACIÓN REACTIVA)
export type ThermalVortexPhase = 'expanding' | 'dissipating' | 'finished';

export interface ThermalVortexEntity {
  id: string;
  x: number;
  y: number;
  currentRadius: number;
  maxRadius: number; // base ~105px (3.0 unidades), cargado ~150px (4.2 unidades)
  damage: number;
  knockback: number;
  isCharged: boolean;
  phase: ThermalVortexPhase;
  phaseTimer: number;
  expandDurationMs: number; // ~260ms
  dissipateDurationMs: number; // ~240ms
  hasDealtDamage: boolean;
  hitEnemyIds: string[];
  ringSeed: number;
}

// JAULA DE PILARES CONDUCTORES (RAYO + TIERRA: MONOLITOS CONDUCTORES, VALLA VOLTAICA Y COLAPSO SÍSMICO)
export type ConductiveCagePhase = 'erupting' | 'igniting' | 'active' | 'collapsing' | 'finished';

export interface ConductivePillarNode {
  id: string;
  x: number;
  y: number;
  height: number;
  maxHeight: number; // ~60-75px
  radius: number; // ~14-16px radio de colisión
  crackAngles: number[];
  pulseTimer: number;
}

export interface ConductiveFenceSegment {
  p1Index: number;
  p2Index: number;
  isDiagonal?: boolean;
}

export interface ConductiveCageEntity {
  id: string;
  centerX: number;
  centerY: number;
  radius: number;
  isCharged: boolean;
  pillars: ConductivePillarNode[];
  segments: ConductiveFenceSegment[];
  phase: ConductiveCagePhase;
  phaseTimer: number;
  eruptDurationMs: number; // ~220ms
  igniteDurationMs: number; // ~140ms
  activeDurationMs: number; // ~3200ms
  collapseDurationMs: number; // ~280ms
  tickIntervalMs: number; // ~180ms
  lastTickPerEnemy: Record<string, number>;
  contactDamage: number;
  implosionDamage: number;
  hasImploded: boolean;
  hitImplosionEnemyIds: string[];
  finished: boolean;
}

// PRISIÓN DE PERMAFROST (HIELO + TIERRA: MONOLITOS DE ROCA/HIELO, ABSORCIÓN DE PROYECTILES Y METRALLA RADIAL)
export type PermafrostPhase = 'erupting' | 'active' | 'shattering' | 'finished';

export interface PermafrostMonolithNode {
  id: string;
  x: number;
  y: number;
  height: number;
  maxHeight: number; // ~60-75px
  radius: number; // ~15px collider
  hp: number;
  maxHp: number; // ~120 tap, 180 charged
  crackProgress: number; // 0..1
  shattered: boolean;
  shatterTimer: number;
  hitFlash: number;
  angles: number[];
}

export interface PermafrostPrisonEntity {
  id: string;
  centerX: number;
  centerY: number;
  radius: number;
  isCharged: boolean;
  monoliths: PermafrostMonolithNode[];
  phase: PermafrostPhase;
  phaseTimer: number;
  eruptDurationMs: number; // ~220ms
  activeDurationMs: number; // ~3500ms
  shatterDurationMs: number; // ~260ms
  fragmentationDamage: number; // ~48 tap, ~72 charged
  impactDamage: number; // ~16
  hitEruptionEnemyIds: string[];
  finished: boolean;
}

// TORNADO DE PLASMA (FUEGO + RAYO: VÓRTICE MÓVIL, SUCCIÓN, ABSORCIÓN DE PROYECTILES Y DETONACIÓN FINAL)
export type PlasmaTornadoPhase = 'moving' | 'collapsing' | 'detonating' | 'finished';

export interface PlasmaTornadoEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  startX: number;
  startY: number;
  travelDistance: number;
  maxDistance: number; // ~280px (8 unidades)
  isCharged: boolean;
  scale: number; // 1.0 tap, 1.35 charged
  radius: number; // ~28px tap, ~38px charged (daño y absorción)
  suctionRadius: number; // ~75px tap, ~102px charged (atracción gravitatoria)
  phase: PlasmaTornadoPhase;
  phaseTimer: number;
  movingDurationMs: number; // ~2400ms max
  collapseDurationMs: number; // ~140ms
  detonateDurationMs: number; // ~260ms
  tickIntervalMs: number; // 200ms
  lastTickPerEnemy: Record<string, number>;
  tickDamage: number; // ~24 tap, ~36 charged
  terminalDamage: number; // ~60 tap, ~90 charged (2.5x tickDamage)
  hasDetonated: boolean;
  hitDetonationEnemyIds: string[];
  swirlAngle: number;
  finished: boolean;
}

// LLUVIA DEL INFIERNO (FUEGO + FUEGO + FUEGO: BOMBARDERO SECUENCIAL DE METEORITOS Y CRÁTERES DE MAGMA)
export interface HellMeteorInstance {
  id: string;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  delayMs: number;          // Tiempo de espera escalonado antes de iniciar el vuelo
  flightProgress: number;   // 0.0 a 1.0
  flightDurationMs: number; // ~200-240ms
  isColossal: boolean;      // Sexto meteorito en versión cargada (+80% radio y +80% daño)
  impactRadius: number;     // ~42px estándar, ~76px colosal
  impactDamage: number;     // Daño de impacto directo
  hasImpacted: boolean;
  hitEnemyIds: string[];
}

export interface HellCraterInstance {
  id: string;
  x: number;
  y: number;
  radius: number;           // ~36px estándar, ~64px colosal
  lifeTimerMs: number;      // Tiempo restante (~2400ms)
  maxLifeMs: number;        // ~2400ms
  tickIntervalMs: number;   // 250ms
  lastTickPerEnemy: Record<string, number>;
  dpsPerTick: number;       // Daño periódico por quemadura de magma
  isColossal: boolean;
}

export interface HellRainEntity {
  id: string;
  centerX: number;
  centerY: number;
  areaRadius: number;       // ~150px tap, ~190px charged
  isCharged: boolean;
  meteors: HellMeteorInstance[];
  craters: HellCraterInstance[];
  elapsedMs: number;
  finished: boolean;
}

// TORMENTA CELESTIAL (RAYO + RAYO + RAYO: TEMPESTAD IONIZADA, RELÁMPAGOS VERTICALES EN CASCADA Y CHARCOS DE ESTÁTICA)
export interface CelestialLightningStrikeInstance {
  id: string;
  targetX: number;
  targetY: number;
  delayMs: number;             // Retardo escalonado (~120ms entre rayos)
  warningDurationMs: number;   // Marca/runa en el suelo previa al rayo (~140ms)
  strikeDurationMs: number;    // Duración activa visible del destello del rayo (~80ms)
  strikeProgress: number;      // 0.0 a 1.0 (mientras el destello está activo)
  isColossal: boolean;         // Relámpago final colosal en versión cargada (+80% radio y daño)
  impactRadius: number;        // ~38px estándar, ~74px colosal
  impactDamage: number;        // Daño de impacto directo
  hasStruck: boolean;          // Si ya impactó y generó daño / charco
  boltSegments: Array<{ x1: number; y1: number; x2: number; y2: number; branch?: boolean }>; // Trazado procedural persistente
}

export interface IonizedPuddleInstance {
  id: string;
  x: number;
  y: number;
  radius: number;              // ~32px estándar, ~58px colosal
  lifeTimerMs: number;         // ~1800ms
  maxLifeMs: number;           // ~1800ms
  tickIntervalMs: number;      // 200ms
  lastTickPerEnemy: Record<string, number>;
  dpsPerTick: number;          // Daño continuo por estática
  isColossal: boolean;
  detonated: boolean;          // Cuando el rayo colosal final sobrecarga y hace explotar los charcos
}

export interface CelestialStormEntity {
  id: string;
  centerX: number;
  centerY: number;
  areaRadius: number;          // ~155px tap, ~195px charged
  isCharged: boolean;
  strikes: CelestialLightningStrikeInstance[];
  puddles: IonizedPuddleInstance[];
  elapsedMs: number;
  terminalDetonated: boolean;
  finished: boolean;
}

// GLACIAR DEVASTADOR (HIELO + HIELO + HIELO: VENTISCA MASIVA, MONOLITOS PRISMÁTICOS Y ERUPCIÓN RADIAL CONGELANTE)
export interface IceMonolithInstance {
  id: string;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  delayMs: number;            // Momento en que comienza a descender
  flightDurationMs: number;   // ~220ms
  flightProgress: number;     // 0.0 a 1.0
  impactRadius: number;       // ~40px
  impactDamage: number;       // Daño de impacto contundente
  hasImpacted: boolean;
  shatterProgress: number;    // 0.0 a 1.0 (tras el impacto, fracturas visuales que se disuelven en 180ms)
}

export interface RadialIceSpike {
  angle: number;
  dist: number;               // Distancia desde el centro (expande concéntricamente)
  height: number;             // Altura actual de la aguja glacial
  maxHeight: number;
  width: number;
  eruptProgress: number;      // 0.0 a 1.0
}

export interface DevastatingGlacierEntity {
  id: string;
  centerX: number;
  centerY: number;
  areaRadius: number;          // ~155px tap, ~210px charged (+35%)
  isCharged: boolean;
  monoliths: IceMonolithInstance[];
  elapsedMs: number;
  totalDurationMs: number;     // ~2600ms
  eruptionTriggered: boolean;
  eruptionProgress: number;    // 0.0 a 1.0
  eruptionDurationMs: number;  // ~450ms
  eruptionMaxRadius: number;
  eruptionDamage: number;      // Daño muy alto de remate
  eruptionHitEnemyIds: string[];
  spikes: RadialIceSpike[];    // Espículas y agujas de hielo de la erupción radial
  finished: boolean;
}

// BARRERA TELÚRICA (TIERRA + TIERRA + TIERRA: 3 ROCAS ORBITALES, INTERCEPCIÓN DE PROYECTILES Y DETONACIÓN)
export interface TelluricRockInstance {
  id: string;
  baseAngleOffset: number;     // Ángulo base según número de rocas activas (ej. 0, 2π/3, 4π/3)
  currentAngleOffset: number;  // Ángulo de fase dinámico interpolado suavemente
  currentAngle: number;        // Ángulo absoluto actual en la elipse
  x: number;                   // Posición mundial X
  y: number;                   // Posición mundial Y
  height: number;              // Elevación flotante a la altura del pecho (~16-20px)
  radius: number;              // Radio del collider (~13px tap, ~16px cargado)
  hitPoints: number;           // Absorción de proyectiles (1 en tap, 2 en cargado)
  maxHitPoints: number;
  destroyed: boolean;
  facetSeed: number;           // Semilla pseudo-aleatoria para caras poligonales
  rotationAngle: number;       // Rotación axial propia del monolito
  pulseTimer: number;          // Temporizador de pulso de runas
  hitFlash: number;            // Flash blanco-dorado al interceptar proyectil
}

export interface TelluricBarrierEntity {
  id: string;
  centerX: number;             // Posición X del jugador (centro de la órbita)
  centerY: number;             // Posición Y del jugador (centro de la órbita)
  isCharged: boolean;
  rocks: TelluricRockInstance[];
  orbitRadiusX: number;        // ~63px (1.8 unidades)
  orbitRadiusY: number;        // ~38.5px (1.1 unidades en perspectiva isométrica)
  orbitAngle: number;          // Ángulo acumulado de rotación orbital
  rotationSpeed: number;       // ~2.3 rad/s
  damagePerRock: number;       // Daño masivo al impactar contra un enemigo
  knockback: number;           // Empuje contundente
  durationMs: number;          // 20000ms (20.0 segundos)
  elapsedMs: number;
  finished: boolean;
  realignSpeed: number;        // Velocidad de reajuste simétrico entre rocas supervivientes
}

// VOLCÁN DE OBSIDIANA (FUEGO + HIELO + TIERRA: ERUPCIÓN PIROCLÁSTICA, VITRIFICACIÓN INSTANTÁNEA Y CAMPO DE CUCHILLAS CORTANTES)
export type ObsidianVolcanoPhase = 'fracture' | 'eruption' | 'vitrification' | 'active_field' | 'shattering' | 'finished';

export interface ObsidianBladeInstance {
  id: string;
  relX: number;                // Desplazamiento X relativo al epicentro
  relY: number;                // Desplazamiento Y relativo al epicentro (en plano isométrico)
  x: number;                   // Coordenada absoluta X
  y: number;                   // Coordenada absoluta Y
  height: number;              // Altura visual de la cuchilla (~40-75px según carga)
  width: number;               // Anchura en la base (~16-28px)
  tiltAngle: number;           // Inclinación angular (-0.28 a 0.28 rad)
  growthProgress: number;      // 0.0 a 1.0 (crecimiento durante vitrificación)
  shatterProgress: number;     // 0.0 a 1.0 (vibración y colapso al terminar)
  shinePhase: number;          // Fase de oscilación para el brillo especular vítreo
  facetSeed: number;           // Semilla geométrica para caras facetadas
}

export interface ObsidianVolcanoEntity {
  id: string;
  centerX: number;             // Coordenada X del epicentro
  centerY: number;             // Coordenada Y del epicentro
  areaRadius: number;          // Radio isométrico (~122px tap, ~168px cargado)
  isCharged: boolean;          // Carga Fusión Vítrea (+50% daño, mayor radio y densidad)
  phase: ObsidianVolcanoPhase;
  phaseTimer: number;          // Tiempo acumulado en la fase actual (ms)
  elapsedMs: number;           // Tiempo total transcurrido (ms)
  totalDurationMs: number;     // ~4800ms
  eruptionDamage: number;      // Daño de impacto explosivo inicial
  eruptionDealt: boolean;      // Si ya aplicó el daño y levantamiento piroclástico
  eruptionProgress: number;    // 0.0 a 1.0 (columna de fuego y vapor)
  sliceDamagePerTick: number;  // Daño cortante periódico al pisar las cuchillas
  tickIntervalMs: number;      // 250ms
  tickTimer: number;           // Acumulador de tiempo entre pulsos de corte
  slowFactor: number;          // 0.40 (40% de ralentización continua)
  blades: ObsidianBladeInstance[];
  fissures: Array<{
    angle: number;
    length: number;
    width: number;
    glowAlpha: number;
  }>;
  shatterPlayed: boolean;
  finished: boolean;
}

// PRISIÓN CONDUCTORA (RAYO + HIELO + TIERRA: PILARES CRIOTÉCNICOS, MALLA DE ALTO VOLTAJE, RALENTIZACIÓN E IMPLOSIÓN REACTIVA)
export type ConductivePrisonPhase = 'fracture' | 'erupting' | 'active' | 'imploding' | 'finished';

export interface ConductivePrisonPillarNode {
  id: string;
  x: number;
  y: number;
  height: number;
  maxHeight: number;        // ~65-80px
  radius: number;           // ~15-18px collider físico
  hp: number;
  maxHp: number;            // ~140 tap, ~210 cargado
  hitFlash: number;
  destroyed: boolean;
  facetSeed: number;
}

export interface ConductivePrisonEntity {
  id: string;
  centerX: number;
  centerY: number;
  radius: number;           // ~88px tap (4 pilares), ~122px cargado (6 pilares)
  isCharged: boolean;
  phase: ConductivePrisonPhase;
  phaseTimer: number;
  totalDurationMs: number;  // ~4000ms
  elapsedMs: number;
  pillars: ConductivePrisonPillarNode[];
  eruptDurationMs: number;  // ~220ms
  activeDurationMs: number; // ~3500ms
  implosionDurationMs: number; // ~260ms
  contactDamagePerTick: number; // ~14 base, ~21 cargado (+50%)
  implosionDamage: number;  // ~75 base, ~112 cargado (+50%)
  implosionRadius: number;  // ~95px tap, ~190px cargado (duplica radio)
  tickIntervalMs: number;   // 200ms
  tickTimer: number;
  slowFactor: number;       // 0.35 (-35% de velocidad en el recinto)
  hasImploded: boolean;
  hitImplosionEnemyIds: string[];
  finished: boolean;
}

// NÚCLEO DE SOBRECARGA (FUEGO + RAYO + TIERRA: ARTEFACTO DESPLEGABLE, ESCALADO EN 3 NIVELES Y DETONACIÓN MANUAL/AUTOMÁTICA)
export type OverloadCorePhase = 'launching' | 'pulsing' | 'detonating' | 'finished';
export type OverloadCoreLevel = 1 | 2 | 3;

export interface OverloadCoreRockFragment {
  id: string;
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  height: number;
  size: number;
  roughPoints: { x: number; y: number }[];
  burnGlow: number;
}

export interface OverloadCoreEntity {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  height: number;
  phase: OverloadCorePhase;
  phaseTimer: number;
  elapsedMs: number;
  isCharged: boolean;
  level: OverloadCoreLevel;
  lastLevel: OverloadCoreLevel;
  pulseTimer: number;
  pulseInterval: number;
  pulseCount: number;
  detonationRadius: number;
  pulseRadius: number;
  rotationAngle: number;
  vibrationOffset: { x: number; y: number };
  rockFragments: OverloadCoreRockFragment[];
  finished: boolean;
  criticalAlarmPlayed?: boolean;
}

// TORMENTA DE PLASMA GLACIAL (FUEGO + RAYO + HIELO: VÓRTICE MÓVIL TRI-ELEMENTAL, CONGELACIÓN, ENCADENAMIENTO VOLTAICO E IMPLOSIÓN CENTRÍFUGA)
export type GlacialPlasmaStormPhase = 'moving' | 'imploding' | 'detonating' | 'finished';

export interface GlacialPlasmaArc {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  life: number;
}

export interface GlacialPlasmaStormEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  moveAngle: number;
  startX: number;
  startY: number;
  travelDistance: number;
  maxDistance: number;
  isCharged: boolean;
  scale: number;
  radius: number;
  implosionRadius: number;
  phase: GlacialPlasmaStormPhase;
  phaseTimer: number;
  elapsedMs: number;
  movingDurationMs: number;
  implosionDurationMs: number;
  detonationDurationMs: number;
  tickIntervalMs: number;
  lastTickPerEnemy: Record<string, number>;
  lastArcTime: number;
  transitDamagePerTick: number;
  finisherDamage: number;
  hasDetonated: boolean;
  swirlAngle: number;
  frostLayerAngle: number;
  plasmaCoreAngle: number;
  arcs: GlacialPlasmaArc[];
  finished: boolean;
}

export type ElementalCataclysmPhase =
  | 'earth_fissure'
  | 'fire_eruption'
  | 'ice_wave'
  | 'lightning_detonation'
  | 'finished';

export interface CataclysmRockSlab {
  relX: number;
  relY: number;
  width: number;
  height: number;
  maxElevation: number;
  elevation: number;
  angle: number;
  tilt: number;
  color: string;
}

export interface CataclysmFissure {
  angle: number;
  length: number;
  segments: Array<{ x: number; y: number }>;
  slabs: CataclysmRockSlab[];
}

export interface ElementalCataclysmEntity {
  id: string;
  x: number;
  y: number;
  isCharged: boolean;
  radius: number;
  phase: ElementalCataclysmPhase;
  phaseTimer: number;
  elapsedMs: number;
  totalDurationMs: number;
  earthDurationMs: number;
  fireDurationMs: number;
  iceDurationMs: number;
  lightningDurationMs: number;
  totalBaseDamage: number;
  chargeMultiplier: number;
  statBonus: number;
  earthHitIds: Set<string>;
  fireLastTickTime: number;
  fireTickCount: number;
  iceHitIds: Set<string>;
  lightningHitIds: Set<string>;
  fissures: CataclysmFissure[];
  magmaColumns: Array<{
    x: number;
    y: number;
    height: number;
    maxHeight: number;
    width: number;
  }>;
  magmaEruptionProgress: number;
  iceWaveProgress: number;
  lightningStrikeProgress: number;
  shockwaveRadius: number;
  shockwaveMaxRadius: number;
  shockwaveAlpha: number;
  finished: boolean;
  hasDetonated?: boolean;
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

export interface FireBarrierEntity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  flameHeight: number;
  maxHealth: number;
  health: number;
  isExtinguished: boolean;
  extinguishProgress: number; // 0 (ardiendo) a 1.0 (totalmente extinta)
  hitFlash: number;
  lastDamageTime: number;
  flamePillars: Array<{
    relX: number;
    relY: number;
    size: number;
    phaseOffset: number;
  }>;
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
  fireBarriers: FireBarrierEntity[];
  boundaryColliders: Array<{ x: number; y: number; radius: number }>;
  ambientLeaves: AmbientLeafParticle[];
  trailWaypoints: Array<{ x: number; y: number; width: number }>;
}
