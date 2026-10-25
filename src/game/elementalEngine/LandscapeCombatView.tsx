import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Player, DungeonFloor } from '../../types';
import {
  ElementType,
  Projectile,
  Particle,
  FloatingText,
  RoomType,
  RelicReward,
  GameEnemy,
  LightningBoltEffect,
  ChanneledStreamState,
  InfernalCrownEntity,
  VoltaicChainEntity,
  VoltaicJump,
  GlacialEruptionEntity,
  GlacialSpikeSegment,
  TectonicFistEntity,
  CryoBeamEntity,
  VolcanicBombardmentEntity,
  VolcanicFissureEntity,
  LavaBombEntity,
  ThermalVortexEntity,
  ConductiveCageEntity,
  ConductivePillarNode,
  PermafrostPrisonEntity,
  PermafrostMonolithNode,
  PlasmaTornadoEntity,
  HellRainEntity,
  HellMeteorInstance,
  HellCraterInstance,
  CelestialStormEntity,
  CelestialLightningStrikeInstance,
  IonizedPuddleInstance,
  DevastatingGlacierEntity,
  IceMonolithInstance,
  RadialIceSpike,
  TelluricBarrierEntity,
  TelluricRockInstance,
  ObsidianVolcanoEntity,
  ObsidianBladeInstance,
  ConductivePrisonEntity,
  ConductivePrisonPillarNode,
  OverloadCoreEntity,
  OverloadCoreLevel,
  GlacialPlasmaStormEntity,
  ElementalCataclysmEntity,
  CataclysmFissure,
  CataclysmRockSlab,
  ForestLevelData,
  MagmaTrenchEntity,
  SolarFusionBeamEntity,
  GlacialAvalancheEntity,
  GlacialAvalancheSpike,
  BoilingHailEntity,
  BoilingHailIcicle,
  SuperconductorBlizzardEntity,
  LightningRodPylonEntity,
  PlasmaHyperOrbEntity,
  CryoArcFlashEntity,
  RollingMagmaBoulderEntity,
  GlacialBastionEntity,
  ResonantQuakeEntity,
  ResonantQuakeWave,
  ThundergodJudgmentEntity,
  PrimordialSupernovaEntity,
  PrimordialSupernovaLavaPatch,
  AbsoluteZeroAgeEntity,
  AbsoluteZeroSpike,
  TectonicCataclysmEntity,
  TectonicCataclysmMonolith,
  KineticPlasmaMeteorEntity,
  FrostburnCometEntity,
  CalderaCataclysmEntity,
  SolarArcTempestEntity,
  SolarArcTempestPlasmaColumn,
  CryoLightningStormEntity,
  CryoLightningStrikePoint,
  TectonicLightningHammerEntity,
  MoltenBlizzardEntity,
  SuperconductingNeedleStormEntity,
  SuperconductingNeedle,
  TectonicGlacierWallEntity,
  TectonicGlacierWallBlock,
  PrimordialMagmaBastionEntity,
  EternalPermafrostFortressEntity,
  MagneticTelluricSpireEntity,
} from './types';
import { ParticlePool, PooledParticle } from '../combat/ParticlePool';
import { ProjectilePool, PooledProjectile } from '../combat/ProjectilePool';
import { createLevel1Forest, LEVEL_WIDTH, LEVEL_HEIGHT } from './level1ForestMap';
import { mapManager, Tilemap, LEVEL_1_LAYOUT } from '../map';
import { identifyRecipe } from './recipes';
import { elementalSound } from './soundEngine';
import { audioManager } from '../../services/AudioManager';
import { setDungeonFullscreen } from '../../services/androidFullscreen';
import { haptics } from '../../services/haptics';
import { CameraSystem } from './Camera';
import {
  TerrainManager,
  checkCircleCollision,
  resolveCircleObstacleCollision,
  DUNGEON_RELICS,
} from './physicsAndTerrain';
import { EnemyManager } from './enemyAI';
import { setupTutorialRoom } from './tutorialRooms';
import { collectVesselRewards, VESSEL_BOOST_MS, VESSEL_HEAL } from './vessels';
import { createThresholdCustodian } from './BossCustodian';
import { ENEMY_PHYSICS_CONFIG } from './EnemyStats';
import { calculateElementalDamage, getSpellElement, applyDamageToEnemy } from './elementalMatrix';
import { IsometricRenderer } from './renderer';
import { RotateCw, X, Volume2, VolumeX, ShieldAlert, Award, Sparkles, Compass } from 'lucide-react';

interface LandscapeCombatViewProps {
  player: Player;
  floor: DungeonFloor;
  onExit: () => void;
  onVictory: (floorNumber: number, expReward: number, goldReward: number) => void;
  onPlayerTakeDamage: (damage: number) => void;
  isTutorial?: boolean;
}

// Estructura de Salas Conectadas para la Gran Mazmorra
interface RoomConfig {
  id: string;
  title: string;
  subtitle: string;
  roomType: RoomType;
}

const DUNGEON_ROOMS: RoomConfig[] = [
  {
    id: 'room-1',
    title: 'Nivel 1: El Gran Sendero y el Portón Congelado',
    subtitle: 'Explora el bosque, derrota a las patrullas y acciona la rueda con Hielo para abrir el portón.',
    roomType: 'entrance',
  },
  {
    id: 'room-2',
    title: 'Sala 2: Enjambre de la Desidia',
    subtitle: 'Derrota a los duendes para desbloquear el portón norte.',
    roomType: 'combat_swarm',
  },
  {
    id: 'room-3',
    title: 'Sala 3: Caverna del Deshielo',
    subtitle: 'Cuidado con la escarcha resbaladiza y las grietas de magma.',
    roomType: 'hazard_traps',
  },
  {
    id: 'room-4',
    title: 'Sala 4: Fuego Cruzado',
    subtitle: 'Usa los pilares como cobertura contra los proyectiles a distancia.',
    roomType: 'crossfire',
  },
  {
    id: 'room-5',
    title: 'Sala 5: Santuario de las Reliquias',
    subtitle: 'Abre el gran cofre sagrado y elige una reliquia para potenciar tu magia.',
    roomType: 'relic_sanctuary',
  },
  {
    id: 'room-6',
    title: 'Sala 6: El Custodio del Umbral',
    subtitle: '¡Jefe del Nivel 1! Rompe sus barreras elementales y evade El Juicio del Guardián.',
    roomType: 'boss_basalt',
  },
  {
    id: 'room-7',
    title: 'Sala 7: Espectro de la Tormenta',
    subtitle: '¡Jefe 2! Esquiva sus rayos telegrafiados y rompe sus cristales.',
    roomType: 'boss_storm',
  },
  {
    id: 'room-8',
    title: 'Sala 8: Dragón de Obsidiana',
    subtitle: '¡Jefe Final! Destruye su armadura volcánica y esquiva su aliento de fuego.',
    roomType: 'boss_dragon',
  },
];

const TUTORIAL_ROOMS: RoomConfig[] = [
  { id: 'tutorial-movement', title: 'Tutorial 1: Patio de entrenamiento', subtitle: 'Muévete, usa el ataque básico y prueba un hechizo. No hay enemigos aquí.', roomType: 'entrance' },
  { id: 'tutorial-affinity', title: 'Tutorial 2: Cámara de afinidades', subtitle: 'Dos enemigos: usa hielo contra fuego y fuego contra hielo.', roomType: 'combat_swarm' },
  { id: 'tutorial-vessels', title: 'Tutorial 3: Almacén del explorador', subtitle: 'Rompe vasijas, recoge un corazón y busca el portal al Nivel 1.', roomType: 'relic_sanctuary' },
];

// Generador procedural de descargas eléctricas ramificadas e instantáneas
function generateLightningBolt(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  color: string = '#facc15',
  glowColor: string = '#67e8f9'
): LightningBoltEffect {
  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.hypot(dx, dy);
  const segments = Math.max(8, Math.min(20, Math.floor(dist / 20)));

  const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const branches: Array<Array<{ x: number; y: number }>> = [];

  // Vector normal perpendicular a la trayectoria
  const nx = dist > 0 ? -dy / dist : 0;
  const ny = dist > 0 ? dx / dist : 1;

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const bx = startX + dx * t;
    const by = startY + dy * t;
    // Envolvente parabólica: máximo zig-zag en el centro, cero en los extremos
    const envelope = Math.sin(t * Math.PI);
    const jitter = (Math.random() - 0.5) * 55 * envelope;
    const px = bx + nx * jitter;
    const py = by + ny * jitter;
    points.push({ x: px, y: py });

    // Bifurcaciones secundarias en los nodos intermedios
    if (i > 1 && i < segments - 1 && Math.random() < 0.45 && branches.length < 4) {
      const branchPoints: Array<{ x: number; y: number }> = [{ x: px, y: py }];
      const branchLength = (25 + Math.random() * 45) * envelope;
      const branchAngle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * (0.55 + Math.random() * 0.4);
      const branchSteps = 3;
      let currBx = px;
      let currBy = py;
      for (let b = 1; b <= branchSteps; b++) {
        currBx += Math.cos(branchAngle) * (branchLength / branchSteps) + (Math.random() - 0.5) * 12;
        currBy += Math.sin(branchAngle) * (branchLength / branchSteps) + (Math.random() - 0.5) * 12;
        branchPoints.push({ x: currBx, y: currBy });
      }
      branches.push(branchPoints);
    }
  }

  points.push({ x: targetX, y: targetY });

  return {
    id: `bolt-${Date.now()}-${Math.random()}`,
    startX,
    startY,
    targetX,
    targetY,
    color,
    glowColor,
    points,
    branches,
    chainLines: [],
    life: 7,
    maxLife: 7,
  };
}

// Relámpago celestial masivo que desciende desde lo alto (Sobrecarga Voltaica a Carga Máxima)
function generateCelestialLightningBolt(targetX: number, targetY: number): LightningBoltEffect {
  const startX = targetX + (Math.random() - 0.5) * 20;
  const startY = targetY - 320;
  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.hypot(dx, dy);
  const segments = 14;

  const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const branches: Array<Array<{ x: number; y: number }>> = [];

  const nx = dist > 0 ? -dy / dist : 0;
  const ny = dist > 0 ? dx / dist : 1;

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const bx = startX + dx * t;
    const by = startY + dy * t;
    const envelope = Math.sin(t * Math.PI);
    const jitter = (Math.random() - 0.5) * 48 * envelope;
    const px = bx + nx * jitter;
    const py = by + ny * jitter;
    points.push({ x: px, y: py });

    if (i > 1 && i < segments - 1 && Math.random() < 0.6 && branches.length < 5) {
      const branchPoints: Array<{ x: number; y: number }> = [{ x: px, y: py }];
      const branchLength = (35 + Math.random() * 50) * envelope;
      const branchAngle = Math.PI / 2 + (Math.random() > 0.5 ? 0.6 : -0.6);
      const branchSteps = 3;
      let currBx = px;
      let currBy = py;
      for (let b = 1; b <= branchSteps; b++) {
        currBx += Math.cos(branchAngle) * (branchLength / branchSteps) + (Math.random() - 0.5) * 12;
        currBy += Math.sin(branchAngle) * (branchLength / branchSteps) + (Math.random() - 0.5) * 12;
        branchPoints.push({ x: currBx, y: currBy });
      }
      branches.push(branchPoints);
    }
  }

  points.push({ x: targetX, y: targetY });

  return {
    id: `celestial-${Date.now()}-${Math.random()}`,
    startX,
    startY,
    targetX,
    targetY,
    color: '#ffffff',
    glowColor: '#38bdf8',
    points,
    branches,
    chainLines: [],
    life: 12,
    maxLife: 12,
    isCelestial: true,
    widthMultiplier: 2.0,
  };
}

// Detonador de explosión radial en área (AoE) con interacción física elemental
function triggerAoEExplosion(
  p: Projectile,
  enemies: GameEnemy[],
  enemyManager: EnemyManager,
  terrainManager: TerrainManager,
  particles: Particle[],
  floatingTexts: FloatingText[],
  onShake: (amt: number) => void
) {
  if (!p.areaOfEffect) return;
  const aoeRadius = p.areaOfEffect;
  onShake(Math.max(6, Math.min(14, aoeRadius / 7)));
  elementalSound.playAoEExplosion();

  // 1. Anillo de onda de choque expansivo
  particles.push({
    id: `ring-${Date.now()}-${Math.random()}`,
    x: p.x,
    y: p.y,
    vx: 0,
    vy: 0,
    radius: 12,
    color: p.color,
    alpha: 1,
    life: 14,
    maxLife: 14,
    type: 'ring',
  });

  // 2. Chispas radiales y partículas temáticas según el hechizo
  const sparkColor = p.spellType === 'explosive_overload'
    ? '#c084fc'
    : (p.spellType === 'thermal_deflagration' ? '#38bdf8' : p.color);
  for (let s = 0; s < 14; s++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 2.5 + Math.random() * 4.0;
    particles.push({
      id: `aoespk-${Date.now()}-${s}`,
      x: p.x,
      y: p.y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      radius: 2 + Math.random() * 2,
      color: p.spellType === 'thermal_deflagration' && s % 2 === 0 ? '#ffffff' : sparkColor,
      alpha: 1,
      life: 16,
    });
  }

  // Si es Deflagración Térmica: Nube densa de vapor pixelado (cian y blanco) que se disipa rápido
  if (p.spellType === 'thermal_deflagration') {
    for (let v = 0; v < 16; v++) {
      const vAng = Math.random() * Math.PI * 2;
      const vSpd = 1.0 + Math.random() * 3.5;
      particles.push({
        id: `steam-pix-${Date.now()}-${v}`,
        x: p.x + (Math.random() - 0.5) * 20,
        y: p.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(vAng) * vSpd,
        vy: Math.sin(vAng) * vSpd - 0.6,
        radius: 3 + Math.random() * 2.5,
        color: v % 2 === 0 ? '#38bdf8' : '#e0f2fe',
        alpha: 0.85,
        life: 18,
      });
    }
  }

  // 3. Daño elemental y estados a enemigos en radio según la matriz del Bestiario
  enemies.forEach((enemy) => {
    const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
    if (dist <= aoeRadius + enemy.radius) {
      const spellElem = p.element || getSpellElement(p.spellType, enemy);
      const res = applyDamageToEnemy(enemy, p.damage, spellElem, floatingTexts, p.x, p.y);

      if (dist > 0 && !res.isBlocked) {
        const pushAng = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        enemy.x += Math.cos(pushAng) * (p.knockback || 3.5);
        enemy.y += Math.sin(pushAng) * (p.knockback || 3.5);
      }

      if (p.statusToApply && !res.isImmune && !res.isAbsorbed) {
        enemyManager.applyStatus(enemy, p.statusToApply, 140);
      }
      if (p.spellType === 'explosive_overload') {
        enemy.stunnedTimer = 45;
      }
      if (p.spellType === 'thermal_deflagration') {
        // Fractura de armadura: reciben +30% de daño durante 4 segundos (240 frames)
        enemy.fracturedArmorTimer = 240;
        floatingTexts.push({
          id: `fracture-${Date.now()}-${enemy.id}`,
          x: enemy.x,
          y: enemy.y - 28,
          text: '🛡️💥 ¡ARMADURA FRACTURADA! (+30%)',
          color: '#38bdf8',
          fontSize: 12,
          opacity: 1,
          vy: -1.3,
          life: 42,
        });
      }
    }
  });

  // 4. Terreno y obstáculos
  if (p.onHitSpawn === 'magma_fissure') {
    terrainManager.spawnMagmaFissure(p.x, p.y, aoeRadius);
  } else if (p.onHitSpawn === 'steam_blast') {
    terrainManager.spawnSteamBlast(p.x, p.y, aoeRadius);
  }

  // Si es fuego y hay hielo derretible en el radio de la explosión, lo derrite
  if (p.spellType === 'fire_shot' || p.spellType === 'fire_inferno' || p.spellType === 'thermal_shock') {
    terrainManager.obstacles.forEach((obs) => {
      if (obs.meltable && obs.obstacleType === 'ice_wall') {
        const d = Math.hypot(obs.x - p.x, obs.y - p.y);
        if (d <= aoeRadius + obs.radius) {
          obs.hp = 0;
          terrainManager.spawnWaterPuddle(obs.x, obs.y, 45);
        }
      }
    });
  }
}

/**
 * Inicializa las patrullas del Bestiario Elemental a lo largo del Sendero del Bosque y la Arena del Jefe.
 * 100% Vectorial, IA táctica especializada y afinidades elementales estrictas.
 */
function createLevel1ForestEnemies(enemyManager: EnemyManager): GameEnemy[] {
  return [
    // Zona 1: Salida del Campamento (X ~ 1400 - 1650)
    // El jugador sale de la fogata e inmediatamente descubre el Bestiario Elemental
    enemyManager.createPyreGolem('forest-golem-intro', 1450, 1100),
    enemyManager.createStormStalker('forest-storm-intro', 1580, 1260),

    // Zona 2: Curva Sur del Sendero (X ~ 2150 - 2450)
    // Tanques ígneos flanqueados por un francotirador de escarcha
    enemyManager.createPyreGolem('forest-golem-west-1', 2150, 1320),
    enemyManager.createPyreGolem('forest-golem-west-2', 2280, 1440),
    enemyManager.createFrostLurker('forest-lurker-west-1', 2440, 1340),

    // Zona 3: Curva Norte del Sendero (X ~ 3000 - 3350)
    // Espectros de tormenta ágiles y acechador gélido a media distancia
    enemyManager.createStormStalker('forest-storm-east-1', 3050, 1060),
    enemyManager.createStormStalker('forest-storm-east-2', 3180, 1190),
    enemyManager.createFrostLurker('forest-lurker-east-1', 3320, 1100),

    // Zona 4: Checkpoint del Portón y Rueda Elemental de Hielo (X ~ 4100 - 4450)
    // Guardianes de élite protegiendo el mecanismo del portón
    enemyManager.createPyreGolem('gate-golem-guard', 4180, 1250),
    enemyManager.createStormStalker('gate-storm-guard', 4300, 1120),
    enemyManager.createFrostLurker('gate-lurker-guard', 4420, 1220),

    // Zona 5: Sendero Alto y Entrada Previa a la Arena (X ~ 5800 - 6250)
    // Última línea defensiva antes del coloso
    enemyManager.createPyreGolem('arena-entry-golem', 5850, 1200),
    enemyManager.createFrostLurker('arena-entry-lurker', 6020, 1100),
    enemyManager.createStormStalker('arena-entry-storm', 6180, 1290),

    // Zona 6: Arena Monumental - El Custodio del Umbral (Jefe Final del Nivel 1, X = 7400, Y = 1200)
    createThresholdCustodian(7400, 1200),
  ];
}

/**
 * Inicializa las patrullas del Bestiario y el jefe del Nivel 1 a partir de las celdas
 * de spawn del Tilemap ('1' Pyre Golem, '2' Storm Stalker, '3' Frost Lurker, 'B' Custodio del Umbral).
 */
function createLevel1TilemapEnemies(enemyManager: EnemyManager, tilemap: Tilemap): GameEnemy[] {
  const enemies: GameEnemy[] = [];
  tilemap.enemySpawns.forEach((spawn) => {
    if (spawn.type === 'golem') {
      enemies.push(enemyManager.createPyreGolem(spawn.id, spawn.x, spawn.y));
    } else if (spawn.type === 'stalker') {
      enemies.push(enemyManager.createStormStalker(spawn.id, spawn.x, spawn.y));
    } else if (spawn.type === 'lurker') {
      enemies.push(enemyManager.createFrostLurker(spawn.id, spawn.x, spawn.y));
    }
  });

  if (tilemap.bossSpawn) {
    enemies.push(createThresholdCustodian(tilemap.bossSpawn.x, tilemap.bossSpawn.y));
  }
  return enemies;
}

export interface CombatTargetInfo {
  x: number;
  y: number;
  angle: number;
  dist: number;
  id: string;
}

export function findNearestCombatTarget(
  wizard: { x: number; y: number },
  enemies: GameEnemy[],
  type: 'fire' | 'ice',
  puzzleWheel?: { x: number; y: number; isCompleted: boolean } | null,
  maxRange: number = 550,
  preferredAngle?: number | null,
  angleTolerance: number = Math.PI
): CombatTargetInfo | null {
  let bestTarget: CombatTargetInfo | null = null;
  let bestScore = Infinity;

  // 1. Considerar enemigos vivos dentro del rango de alcance
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.hp <= 0) continue;
    const dx = e.x - wizard.x;
    const dy = e.y - wizard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRange) continue;

    const angle = Math.atan2(dy, dx);
    let angleDiff = 0;
    if (preferredAngle !== undefined && preferredAngle !== null) {
      angleDiff = Math.abs(angle - preferredAngle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
      if (angleDiff > angleTolerance) continue;
    }

    const score = preferredAngle !== undefined && preferredAngle !== null
      ? dist * (1 + angleDiff * 0.9)
      : dist;

    if (score < bestScore) {
      bestScore = score;
      bestTarget = { x: e.x, y: e.y, angle, dist, id: e.id };
    }
  }

  // 2. Si es hielo, incluir la rueda elemental del puzle de hielo si aún no está resuelta
  if (type === 'ice' && puzzleWheel && !puzzleWheel.isCompleted) {
    const wdx = puzzleWheel.x - wizard.x;
    const wdy = puzzleWheel.y - wizard.y;
    const wdist = Math.hypot(wdx, wdy);
    if (wdist <= maxRange) {
      const wAngle = Math.atan2(wdy, wdx);
      let angleDiff = 0;
      let inCone = true;
      if (preferredAngle !== undefined && preferredAngle !== null) {
        angleDiff = Math.abs(wAngle - preferredAngle);
        while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
        if (angleDiff > angleTolerance) inCone = false;
      }
      if (inCone) {
        const score = preferredAngle !== undefined && preferredAngle !== null
          ? wdist * (1 + angleDiff * 0.9)
          : wdist;
        if (score < bestScore) {
          bestScore = score;
          bestTarget = { x: puzzleWheel.x, y: puzzleWheel.y, angle: wAngle, dist: wdist, id: 'puzzle_wheel' };
        }
      }
    }
  }

  return bestTarget;
}

export const LandscapeCombatView: React.FC<LandscapeCombatViewProps> = ({
  player,
  floor,
  onExit,
  onVictory,
  onPlayerTakeDamage,
  isTutorial = false,
}) => {
  // En Android la mazmorra usa toda la pantalla; un deslizamiento desde el borde muestra los controles del sistema temporalmente.
  useEffect(() => {
    void setDungeonFullscreen(true);
    return () => { void setDungeonFullscreen(false); };
  }, []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onPlayerTakeDamageRef = useRef(onPlayerTakeDamage);
  useEffect(() => {
    onPlayerTakeDamageRef.current = onPlayerTakeDamage;
  }, [onPlayerTakeDamage]);

  // Estados del juego
  const [currentHp, setCurrentHp] = useState(() => Math.max(1, player.currentHp > 0 ? player.currentHp : player.maxHp));
  const [maxHp, setMaxHp] = useState(player.maxHp);
  const [elementQueue, setElementQueue] = useState<ElementType[]>([]);
  const [isMuted, setIsMuted] = useState(() => audioManager.isMuted());
  const [isDefeated, setIsDefeated] = useState(false);
  const [isVictorious, setIsVictorious] = useState(false);
  const victoryCommittedRef = useRef(false);
  const chargedBoostUntilRef = useRef(0);
  const [chargedBoostSeconds, setChargedBoostSeconds] = useState(0);
  const [vesselsRemaining, setVesselsRemaining] = useState(4);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setChargedBoostSeconds(Math.max(0, Math.ceil((chargedBoostUntilRef.current - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(timer);
  }, []);
  const [finalRunTimeSec, setFinalRunTimeSec] = useState(0);
  const [totalKillsCount, setTotalKillsCount] = useState(0);
  const [isPortraitWarning, setIsPortraitWarning] = useState(false);

  // Progresión de salas conectadas
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(isTutorial ? 1 : 5);
  const tutorialStepRef = useRef(tutorialStep);
  tutorialStepRef.current = tutorialStep;
  const tutorialStartRef = useRef<{ x: number; y: number } | null>(null);
  const roomSet = isTutorial ? TUTORIAL_ROOMS : DUNGEON_ROOMS;
  const currentRoom = roomSet[currentRoomIndex];
  const [roomBanner, setRoomBanner] = useState<string | null>(roomSet[0].title);

  // Modal de Reliquias
  const [relicModalOpen, setRelicModalOpen] = useState(false);
  const [equippedRelics, setEquippedRelics] = useState<RelicReward[]>([]);

  // Estados visuales de Esquiva y Carga
  const [dashCooldownRatio, setDashCooldownRatio] = useState(0);
  const [attackCooldownRatio, setAttackCooldownRatio] = useState(0);
  const [attackCooldownSec, setAttackCooldownSec] = useState(0);
  const [isChargingUi, setIsChargingUi] = useState(false);
  const [chargeVisualRatio, setChargeVisualRatio] = useState(0);
  const lastCdRatioRef = useRef(0);
  const lastAttackCdRatioRef = useRef(0);
  const runStartTimeRef = useRef<number>(Date.now());
  const suctionStateRef = useRef<{ isSuctioning: boolean; startTime: number }>({ isSuctioning: false, startTime: 0 });

  // Reducción de enfriamiento por progresión de nivel: solo la habilidad suprema de 4 elementos tiene cooldown
  const getEffectiveCooldown = useCallback(
    (cooldownMs: number, recipeId?: string) => {
      if (recipeId && recipeId !== 'elemental_cataclysm') return 0;
      if (cooldownMs <= 0) return 0;
      const cooldownReduction = Math.floor(Math.max(0, (player.level || 1) - 1) / 3) * 0.05;
      return Math.round(cooldownMs * (1 - cooldownReduction));
    },
    [player.level]
  );
  const keysPressedRef = useRef<Record<string, boolean>>({});
  const attackAimRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    currX: number;
    currY: number;
    isAiming: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0,
    isAiming: false,
  });
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  // Hechizo activo identificado
  const activeRecipe = identifyRecipe(elementQueue);
  const activeRecipeRef = useRef(activeRecipe);
  activeRecipeRef.current = activeRecipe;

  useEffect(() => {
    if (!isTutorial) return;
    const timer = window.setInterval(() => {
      const wizard = gameStateRef.current.wizard;
      if (!tutorialStartRef.current) tutorialStartRef.current = { x: wizard.x, y: wizard.y };
      const start = tutorialStartRef.current;
      if (tutorialStep === 1 && Math.hypot(wizard.x - start.x, wizard.y - start.y) > 45) setTutorialStep(2);
    }, 150);
    return () => window.clearInterval(timer);
  }, [isTutorial, tutorialStep]);

  // Optimización móvil: Cache del contexto 2D y Object Pools de memoria fija (Cero GC Stutter)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlePoolRef = useRef(new ParticlePool(250));
  const projectilePoolRef = useRef(new ProjectilePool(100));

  const particlePool = particlePoolRef.current;
  const projectilePool = projectilePoolRef.current;

  // Interceptar .push en las piscinas para compatibilidad transparente y CERO asignación en heap
  if (!(particlePool.pool as any).__pooled) {
    (particlePool.pool as any).__pooled = true;
    (particlePool.pool as any).push = (...items: any[]) => {
      for (let i = 0; i < items.length; i++) {
        particlePool.spawn(items[i]);
      }
      return particlePool.getActiveCount();
    };
  }

  if (!(projectilePool.pool as any).__pooled) {
    (projectilePool.pool as any).__pooled = true;
    (projectilePool.pool as any).push = (...items: any[]) => {
      for (let i = 0; i < items.length; i++) {
        projectilePool.spawn(items[i]);
      }
      return projectilePool.getActive().length;
    };
  }

  // Referencias mutables para el bucle a 60 FPS
  const gameStateRef = useRef({
    wizard: {
      x: 550,
      y: 560,
      radius: 18,
      facingAngle: -Math.PI / 2,
      isMoving: false,
      animFrame: 0,
      hitFlash: 0,
      invulnerableTimer: 0,
      isRespawning: false,
      respawnFadeTimer: 0,
      vx: 0,
      vy: 0,
      recoilX: 0,
      recoilY: 0,
      recoilTimer: 0,
      castFlashColor: undefined as string | undefined,
      castFlashTimer: 0,
      staffCastTimer: 0,
      activeElement: 'fire' as 'fire' | 'lightning' | 'earth' | 'ice' | 'plasma' | 'magma',
      staffOrbColor: '#94a3b8',
      isCursed: !!(player.isCursed || (player.curseExpiresAt && new Date(player.curseExpiresAt).getTime() > Date.now())),
      hasLightningAura: (player.unlockedMilestones || []).includes('mente_inquebrantable'),
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      dashCooldownMax: 90,
      dashVx: 0,
      dashVy: 0,
      dashTrail: [] as Array<{ x: number; y: number; facingAngle: number; alpha: number }>,
      isCharging: false,
      chargeStartTime: 0,
      chargeRatio: 0,
      chargeType: 'arcane' as string,
      chargeSoundPlayed: false,
      channelLockTimer: 0,
      channeledStream: {
        active: false,
        type: 'fire' as 'fire' | 'ice',
        aimAngle: -Math.PI / 2,
        lockedEnemyId: null as string | null,
        range: 230,
        spreadAngle: 0.58,
        damageIntervalMs: 160,
        damagePerTick: 14,
        lastDamageTimestampPerEnemy: {} as Record<string, number>,
        lastDamageTimestampPerObstacle: {} as Record<string, number>,
      } as ChanneledStreamState,
      isEnteringVictoryPortal: false,
      victoryScale: 1.0,
    },
    isBossDefeated: false,
    camera: { x: 550, y: 560 },
    cameraSystem: new CameraSystem(550, 560),
    prevWizardX: 550,
    prevWizardY: 560,
    joystick: {
      active: false,
      touchId: null as number | null,
      startX: 0,
      startY: 0,
      baseX: 0,
      baseY: 0,
      currX: 0,
      currY: 0,
      knobX: 0,
      knobY: 0,
      vx: 0,
      vy: 0,
      opacity: 0,
      isPressing: false,
    },
    particlePool,
    projectilePool,
    projectiles: projectilePool.pool as unknown as Projectile[],
    lightningBolts: [] as LightningBoltEffect[],
    infernalCrowns: [] as InfernalCrownEntity[],
    voltaicChains: [] as VoltaicChainEntity[],
    glacialEruptions: [] as GlacialEruptionEntity[],
    tectonicFists: [] as TectonicFistEntity[],
    cryoBeams: [] as CryoBeamEntity[],
    volcanicBombardments: [] as VolcanicBombardmentEntity[],
    thermalVortices: [] as ThermalVortexEntity[],
    conductiveCages: [] as ConductiveCageEntity[],
    permafrostPrisons: [] as PermafrostPrisonEntity[],
    plasmaTornadoes: [] as PlasmaTornadoEntity[],
    hellRains: [] as HellRainEntity[],
    celestialStorms: [] as CelestialStormEntity[],
    devastatingGlaciers: [] as DevastatingGlacierEntity[],
    telluricBarriers: [] as TelluricBarrierEntity[],
    obsidianVolcanoes: [] as ObsidianVolcanoEntity[],
    conductivePrisons: [] as ConductivePrisonEntity[],
    overloadCores: [] as OverloadCoreEntity[],
    glacialPlasmaStorms: [] as GlacialPlasmaStormEntity[],
    elementalCataclysms: [] as ElementalCataclysmEntity[],
    magmaTrenches: [] as MagmaTrenchEntity[],
    solarFusionBeams: [] as SolarFusionBeamEntity[],
    glacialAvalanches: [] as GlacialAvalancheEntity[],
    boilingHails: [] as BoilingHailEntity[],
    superconductorBlizzards: [] as SuperconductorBlizzardEntity[],
    lightningRodPylons: [] as LightningRodPylonEntity[],
    plasmaHyperOrbs: [] as PlasmaHyperOrbEntity[],
    cryoArcFlashes: [] as CryoArcFlashEntity[],
    rollingMagmaBoulders: [] as RollingMagmaBoulderEntity[],
    glacialBastions: [] as GlacialBastionEntity[],
    resonantQuakes: [] as ResonantQuakeEntity[],
    thundergodJudgments: [] as ThundergodJudgmentEntity[],
    primordialSupernovas: [] as PrimordialSupernovaEntity[],
    absoluteZeroAges: [] as AbsoluteZeroAgeEntity[],
    tectonicCataclysms: [] as TectonicCataclysmEntity[],
    kineticPlasmaMeteors: [] as KineticPlasmaMeteorEntity[],
    frostburnComets: [] as FrostburnCometEntity[],
    calderaCataclysms: [] as CalderaCataclysmEntity[],
    solarArcTempests: [] as SolarArcTempestEntity[],
    cryoLightningStorms: [] as CryoLightningStormEntity[],
    tectonicLightningHammers: [] as TectonicLightningHammerEntity[],
    moltenBlizzards: [] as MoltenBlizzardEntity[],
    superconductingNeedleStorms: [] as SuperconductingNeedleStormEntity[],
    tectonicGlacierWalls: [] as TectonicGlacierWallEntity[],
    primordialMagmaBastions: [] as PrimordialMagmaBastionEntity[],
    eternalPermafrostFortresses: [] as EternalPermafrostFortressEntity[],
    magneticTelluricSpires: [] as MagneticTelluricSpireEntity[],
    lastVoltaicHumTime: 0,
    lastCryoHumTime: 0,
    lastFireBarrierBurnTime: 0,
    lastExtinguishSizzleTime: 0,
    particles: particlePool.pool as unknown as Particle[],
    floatingTexts: [] as FloatingText[],
    screenShake: 0,
    terrainManager: new TerrainManager(),
    enemyManager: new EnemyManager(),
    lastAttackTime: 0,
    recipeCooldowns: {} as Record<string, number>,
    currentHp: Math.max(1, player.currentHp > 0 ? player.currentHp : player.maxHp),
    maxHp: player.maxHp,
    roomIndex: 0,
    roomCleared: false,
    isRespawning: false,
    respawnFadeTimer: 0,
    lastCheckpointId: 'checkpoint-0-camp',
    forestLevel: null as ForestLevelData | null,
    tilemap: null as Tilemap | null,
  });

  // Chequeo de orientación
  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortraitWarning(isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    try {
      const orientation = screen.orientation as unknown as { lock?: (type: string) => Promise<void> };
      if (orientation?.lock) {
        orientation.lock('landscape').catch(() => {});
      }
    } catch {
      // Ignorar si no está soportado
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      try {
        const orientation = screen.orientation as unknown as { lock?: (type: string) => Promise<void> };
        void orientation?.lock?.('portrait').catch(() => {});
      } catch {
        // Ignorar si el navegador no expone el bloqueo de orientación.
      }
    };
  }, []);

  // Inicializar Nivel 1 del Bosque Extendido al montar
  useEffect(() => {
    const g = gameStateRef.current;
    g.roomIndex = 0;
    g.roomCleared = false;

    if (isTutorial) {
      g.tilemap = null;
      g.forestLevel = null;
      setupTutorialRoom(0, g.terrainManager, g.enemyManager);
      g.wizard.x = g.prevWizardX = 180;
      g.wizard.y = g.prevWizardY = 380;
      g.camera.x = 180;
      g.camera.y = 380;
      g.cameraSystem.reset(180, 380);
      tutorialStartRef.current = { x: 180, y: 380 };
      setTutorialStep(1);
      setRoomBanner(TUTORIAL_ROOMS[0].title);
      const bannerTimer = window.setTimeout(() => setRoomBanner(null), 3000);
      audioManager.startAmbient('exploration');
      return () => { window.clearTimeout(bannerTimer); audioManager.stopAmbient(); audioManager.stopCharge(); };
    }

    // Recuperar último punto de control persistido en localStorage
    let savedCheckpointId: string | null = null;
    try {
      savedCheckpointId = localStorage.getItem('taskquest_level1_last_checkpoint');
    } catch {
      // Ignorar error de sandbox / storage
    }

    // Inicializar el Nivel 1 con motor de Tilemap procedural estructurado
    const tilemap = mapManager.loadLevel(LEVEL_1_LAYOUT);
    g.tilemap = tilemap;
    g.forestLevel = null;

    let spawnX = tilemap.spawnPoint.x;
    let spawnY = tilemap.spawnPoint.y;

    if (savedCheckpointId) {
      g.lastCheckpointId = savedCheckpointId;
      const targetCp = tilemap.checkpoints.find((c) => c.id === savedCheckpointId);
      if (targetCp) {
        spawnX = targetCp.respawnX;
        spawnY = targetCp.respawnY;
        targetCp.isActive = true;

        // Si el checkpoint está después del portón, mantener el portón abierto
        if (targetCp.col >= tilemap.gate.col) {
          tilemap.openGate();
        }
      }
    } else {
      g.lastCheckpointId = tilemap.checkpoints[0]?.id || 'checkpoint-0-start';
    }

    g.wizard.x = spawnX;
    g.wizard.y = spawnY;
    g.prevWizardX = spawnX;
    g.prevWizardY = spawnY;
    g.wizard.invulnerableTimer = 1.0; // Gracia de 1.0s de i-frames al entrar al nivel
    g.camera.x = spawnX;
    g.camera.y = spawnY;
    g.cameraSystem.reset(spawnX, spawnY);
    g.terrainManager.obstacles = [];

    // Generar patrullas del Bestiario y jefe a lo largo de las celdas del Tilemap
    g.enemyManager.enemies = createLevel1TilemapEnemies(g.enemyManager, tilemap);

    g.enemyManager.currentBoss = g.enemyManager.enemies.find((e) => e.archetype === 'boss') || null;
    const initialHp = Math.max(1, player.currentHp > 0 ? player.currentHp : player.maxHp);
    g.currentHp = initialHp;
    g.maxHp = player.maxHp;
    setCurrentHp(initialHp);
    setMaxHp(player.maxHp);
    setRoomBanner(roomSet[0].title);
    setTimeout(() => setRoomBanner(null), 3000);

    // Iniciar atmósfera y paisaje sonoro procedural
    audioManager.startAmbient(currentRoom.roomType.startsWith('boss_') ? 'boss' : 'exploration');

    return () => {
      audioManager.stopAmbient();
      audioManager.stopCharge();
    };
  }, [isTutorial]);

  // Manejo de derrota y reaparición en el último punto de control (400ms fade -> 100% HP -> 1.5s i-frames)
  const triggerPlayerDefeatAndRespawn = useCallback(() => {
    const g = gameStateRef.current;
    const wizard = g.wizard;
    if (g.isRespawning) return;

    g.isRespawning = true;
    g.respawnFadeTimer = 0.4; // 400ms de desvanecimiento
    wizard.isMoving = false;
    wizard.channeledStream.active = false;
    wizard.isDashing = false;
    wizard.isCharging = false;
    audioManager.stopCharge();
    wizard.isRespawning = true;
    wizard.respawnFadeTimer = 0.4;

    elementalSound.playPlayerHurt();
    g.floatingTexts.push({
      id: `hero-fallen-${Date.now()}`,
      x: wizard.x,
      y: wizard.y - 30,
      text: '💀 ¡HÉROE CAÍDO! REAPARECIENDO...',
      color: '#f43f5e',
      fontSize: 15,
      opacity: 1,
      vy: -1.4,
      life: 45,
    });
  }, []);

  // Sistema centralizado de daño con frames de invulnerabilidad (i-frames 800ms) y micro-knockback
  const applyDamageToPlayer = useCallback(
    (damage: number, sourceX?: number, sourceY?: number) => {
      const g = gameStateRef.current;
      const wizard = g.wizard;

      // 1. Si está en i-frames, en Dash invulnerable o en proceso de respawn: ignorar daño
      if ((wizard.invulnerableTimer && wizard.invulnerableTimer > 0) || wizard.isDashing || g.isRespawning) {
        return;
      }

      const permafrostDome = g.eternalPermafrostFortresses.find((dome) => !dome.finished && !dome.burst);
      if (permafrostDome) {
        permafrostDome.absorbedHits = (permafrostDome.absorbedHits || 0) + 1;
        g.particlePool.spawn({ x: wizard.x + (Math.random() - 0.5) * 36, y: wizard.y - 8, vx: (Math.random() - 0.5) * 2, vy: -1, radius: 3, color: '#7dd3fc', life: 16 });
        return;
      }

      // 2. Aplicar daño una sola vez por impacto
      g.currentHp = Math.max(0, g.currentHp - damage);
      setCurrentHp(g.currentHp);
      onPlayerTakeDamageRef.current(damage);

      // 3. Activar i-frames temporales (0.8s = 800ms)
      wizard.invulnerableTimer = 0.8;
      wizard.hitFlash = 10;
      g.screenShake = 6;
      elementalSound.playPlayerHurt();
      haptics.heavy();

      // 4. Micro-empuje sutil (knockback de 0.2 unidades / ~12px) en dirección opuesta al daño
      if (sourceX !== undefined && sourceY !== undefined) {
        const kdx = wizard.x - sourceX;
        const kdy = wizard.y - sourceY;
        const kdist = Math.max(1, Math.hypot(kdx, kdy));
        wizard.x += (kdx / kdist) * 12;
        wizard.y += (kdy / kdist) * 12;
      }

      // 5. Si la vida llega a 0: Iniciar flujo de derrota y respawn en checkpoint
      if (g.currentHp <= 0) {
        triggerPlayerDefeatAndRespawn();
      }
    },
    [triggerPlayerDefeatAndRespawn]
  );

  const stopChanneledAttack = useCallback((type?: 'fire' | 'ice') => {
    const g = gameStateRef.current;
    const wizard = g.wizard;
    if (!wizard.channeledStream.active) return;
    if (type && wizard.channeledStream.type !== type) return;

    wizard.channeledStream.active = false;
    wizard.channeledStream.lockedEnemyId = null;
    wizard.channeledStream.lastDamageTimestampPerEnemy = {};
    wizard.channeledStream.lastDamageTimestampPerObstacle = {};
    elementalSound.stopContinuousStream();
  }, []);

  // Selección de elemento
  const handleSelectElement = useCallback(
    (el: ElementType) => {
      if (isDefeated || isVictorious || gameStateRef.current.wizard.isEnteringVictoryPortal) return;
      const activeStream = gameStateRef.current.wizard.channeledStream;
      if (activeStream.active && activeStream.type !== el) {
        stopChanneledAttack();
      }
      elementalSound.playElementSelect(el);
      haptics.light();

      setElementQueue((prev) => {
        const nextQueue = prev.length >= 4 ? [...prev.slice(1), el] : [...prev, el];
        // Si se selecciona un único poder de fuego o hielo, orientar al mago de inmediato al objetivo más cercano
        if (nextQueue.length === 1 && (el === 'fire' || el === 'ice')) {
          const g = gameStateRef.current;
          const target = findNearestCombatTarget(
            g.wizard,
            g.enemyManager.enemies,
            el,
            g.tilemap?.puzzleWheel,
            550
          );
          if (target) {
            g.wizard.facingAngle = target.angle;
          }
        }
        return nextQueue;
      });
    },
    [isDefeated, isVictorious, stopChanneledAttack]
  );

  const startChanneledAttack = useCallback(
    (type: 'fire' | 'ice', sourceButton: 'element' | 'attack' = 'element') => {
      if (isDefeated || isVictorious) return;
      const g = gameStateRef.current;
      const wizard = g.wizard;
      if (wizard.isDashing) return;
      wizard.staffCastTimer = 190;

      const isFire = type === 'fire';
      const range = isFire ? 230 : 215;
      const spreadAngle = isFire ? 0.58 : 0.48;
      const damagePerTick = isFire ? 15 : 13;

      wizard.channeledStream.active = true;
      wizard.channeledStream.type = type;
      wizard.channeledStream.range = range;
      wizard.channeledStream.spreadAngle = spreadAngle;
      wizard.channeledStream.damageIntervalMs = 160;
      wizard.channeledStream.damagePerTick = damagePerTick;
      wizard.channeledStream.sourceButton = sourceButton;
      wizard.staffOrbColor = isFire ? '#ef4444' : '#06b6d4';
      wizard.channeledStream.lockedEnemyId = null;

      // Apuntado inteligente automático hacia el objetivo más cercano (o manual si hay ratón o arrastre activo)
      const tmWheel = g.tilemap?.puzzleWheel;
      let targetAngle = wizard.facingAngle;

      if (mousePosRef.current.active) {
        const dx = mousePosRef.current.x - wizard.x;
        const dy = mousePosRef.current.y - wizard.y;
        if (Math.hypot(dx, dy) > 10) {
          targetAngle = Math.atan2(dy, dx);
        }
      } else if (attackAimRef.current.active && attackAimRef.current.isAiming) {
        const adx = attackAimRef.current.currX - attackAimRef.current.startX;
        const ady = attackAimRef.current.currY - attackAimRef.current.startY;
        const rawAngle = Math.atan2(ady, adx);
        const target = findNearestCombatTarget(wizard, g.enemyManager.enemies, type, tmWheel, 550, rawAngle, Math.PI * 0.45);
        if (target) {
          targetAngle = target.angle;
          wizard.channeledStream.lockedEnemyId = target.id;
        } else {
          targetAngle = rawAngle;
        }
      } else {
        // Auto-aim prioritario: Snap al objetivo vivo más cercano o engranaje de hielo
        const target = findNearestCombatTarget(wizard, g.enemyManager.enemies, type, tmWheel, 550);
        if (target) {
          targetAngle = target.angle;
          wizard.channeledStream.lockedEnemyId = target.id;
        }
      }

      wizard.channeledStream.aimAngle = targetAngle;
      wizard.facingAngle = targetAngle;

      elementalSound.startContinuousStream(type);
    },
    [isDefeated, isVictorious]
  );

  const handleClearQueue = useCallback(() => {
    stopChanneledAttack();
    setElementQueue([]);
    haptics.selection();
  }, [stopChanneledAttack]);

  // Transición a la siguiente sala
  const changeToRoom = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= roomSet.length) {
        if (victoryCommittedRef.current) return;
        victoryCommittedRef.current = true;
        stopChanneledAttack();
        audioManager.stopAmbient();
        // Mazmorra completada al salir del último jefe
        setIsVictorious(true);
        elementalSound.playVictory();
        onVictory(floor.floorNumber, floor.enemy.expReward * 2, floor.enemy.goldReward * 2);
        return;
      }

      const g = gameStateRef.current;
      stopChanneledAttack();
      g.roomIndex = nextIndex;
      g.roomCleared = false;
      g.projectilePool.clear();
      chargedBoostUntilRef.current = 0;
      setChargedBoostSeconds(0);
      g.particlePool.clear();
      g.infernalCrowns = [];
      g.voltaicChains = [];
      g.glacialEruptions = [];
      g.tectonicFists = [];
      g.cryoBeams = [];
      g.volcanicBombardments = [];
      g.thermalVortices = [];
      g.conductiveCages = [];
      g.permafrostPrisons = [];
      g.plasmaTornadoes = [];
      g.hellRains = [];
      g.celestialStorms = [];
      g.devastatingGlaciers = [];
      g.telluricBarriers = [];
      g.obsidianVolcanoes = [];
      g.conductivePrisons = [];
      g.overloadCores = [];
      g.glacialPlasmaStorms = [];
      g.elementalCataclysms = [];
      g.magmaTrenches = [];
      g.solarFusionBeams = [];
      g.glacialAvalanches = [];
      g.boilingHails = [];
      g.superconductorBlizzards = [];
      g.lightningRodPylons = [];
      g.plasmaHyperOrbs = [];
      g.cryoArcFlashes = [];
      g.rollingMagmaBoulders = [];
      g.glacialBastions = [];
      g.resonantQuakes = [];
      g.thundergodJudgments = [];
      g.primordialSupernovas = [];
      g.absoluteZeroAges = [];
      g.tectonicCataclysms = [];
      g.kineticPlasmaMeteors = [];
      g.frostburnComets = [];
      g.calderaCataclysms = [];
      g.solarArcTempests = [];
      g.cryoLightningStorms = [];
      g.tectonicLightningHammers = [];
      g.moltenBlizzards = [];
      g.superconductingNeedleStorms = [];
      g.tectonicGlacierWalls = [];
      g.primordialMagmaBastions = [];
      g.eternalPermafrostFortresses = [];
      g.magneticTelluricSpires = [];

      if (isTutorial) {
        g.tilemap = null;
        g.forestLevel = null;
        g.wizard.x = g.prevWizardX = 180;
        g.wizard.y = g.prevWizardY = 380;
        g.camera.x = 180;
        g.camera.y = 380;
        g.cameraSystem.reset(180, 380);
        setupTutorialRoom(nextIndex, g.terrainManager, g.enemyManager);
        if (nextIndex === 2) setVesselsRemaining(g.terrainManager.obstacles.filter((obs) => obs.obstacleType === 'vessel').length);
        setTutorialStep(nextIndex === 1 ? 4 : 5);
      } else if (nextIndex === 0) {
        const tilemap = mapManager.loadLevel(LEVEL_1_LAYOUT);
        g.tilemap = tilemap;
        g.forestLevel = null;
        let savedCpId: string | null = null;
        try {
          savedCpId = localStorage.getItem('taskquest_level1_last_checkpoint');
        } catch {}
        let rx = tilemap.spawnPoint.x;
        let ry = tilemap.spawnPoint.y;
        if (savedCpId) {
          g.lastCheckpointId = savedCpId;
          const cp = tilemap.checkpoints.find((c) => c.id === savedCpId);
          if (cp) {
            rx = cp.respawnX;
            ry = cp.respawnY;
            cp.isActive = true;
            if (cp.col >= tilemap.gate.col) {
              tilemap.openGate();
            }
          }
        }
        g.wizard.x = rx;
        g.wizard.y = ry;
        g.prevWizardX = rx;
        g.prevWizardY = ry;
        g.wizard.invulnerableTimer = 1.0;
        g.camera.x = rx;
        g.camera.y = ry;
        g.cameraSystem.reset(rx, ry);
        g.terrainManager.obstacles = [];
        g.enemyManager.enemies = createLevel1TilemapEnemies(g.enemyManager, tilemap);
        g.enemyManager.currentBoss = g.enemyManager.enemies.find((e) => e.archetype === 'boss') || null;
      } else {
        g.tilemap = null;
        g.forestLevel = null;
        g.wizard.x = 550;
        g.wizard.y = 600;
        g.prevWizardX = 550;
        g.prevWizardY = 600;
        g.camera.x = 550;
        g.camera.y = 600;
        g.cameraSystem.reset(550, 600);
        const nextRoom = roomSet[nextIndex];
        g.terrainManager.setupRoomTerrain(nextRoom.roomType);
        g.enemyManager.spawnRoomEnemies(nextRoom.roomType);
      }

      const nextRoom = roomSet[nextIndex];
      setCurrentRoomIndex(nextIndex);
      setRoomBanner(nextRoom.title);
      setTimeout(() => setRoomBanner(null), 3500);

      // Conmutar el modo de música procedural según el tipo de sala
      const isBossRoom = nextRoom?.roomType ? nextRoom.roomType.startsWith('boss_') : false;
      audioManager.startAmbient(isBossRoom ? 'boss' : 'exploration');
    },
    [floor.enemy.expReward, floor.enemy.goldReward, floor.floorNumber, isTutorial, onVictory, roomSet]
  );

  // Equipar reliquia elegida en el Santuario
  const handleSelectRelic = (relic: RelicReward) => {
    setEquippedRelics((prev) => [...prev, relic]);
    setRelicModalOpen(false);

    if (relic.bonusType === 'max_hp') {
      const newMax = maxHp + relic.value;
      setMaxHp(newMax);
      setCurrentHp(newMax);
      gameStateRef.current.maxHp = newMax;
      gameStateRef.current.currentHp = newMax;
    }

    gameStateRef.current.floatingTexts.push({
      id: `relic-equipped-${Date.now()}`,
      x: gameStateRef.current.wizard.x,
      y: gameStateRef.current.wizard.y - 25,
      text: `✨ ${relic.name.toUpperCase()} EQUIPADA`,
      color: '#fbbf24',
      fontSize: 13,
      opacity: 1,
      vy: -1.4,
      life: 45,
    });
  };

  // Esquiva Rápida (Dash / Glide)
  const handleDash = useCallback(() => {
    if (isDefeated || isVictorious || gameStateRef.current.wizard.isEnteringVictoryPortal) return;
    const g = gameStateRef.current;
    const wizard = g.wizard;
    if (wizard.dashCooldown > 0 || wizard.isDashing) return;

    stopChanneledAttack();
    if (wizard.isCharging) {
      wizard.isCharging = false;
      audioManager.stopCharge();
    }
    elementalSound.playDash();
    haptics.medium();
    wizard.isDashing = true;
    wizard.dashTimer = 11;
    const cooldownReduction = Math.floor(Math.max(0, (player.level || 1) - 1) / 3) * 0.05;
    wizard.dashCooldown = Math.round(wizard.dashCooldownMax * (1 - cooldownReduction));

    // Si se está moviendo con el joystick, dashea en esa dirección; si no, hacia facingAngle
    let dashAngle = wizard.facingAngle;
    if (g.joystick.active && (g.joystick.vx !== 0 || g.joystick.vy !== 0)) {
      dashAngle = Math.atan2(g.joystick.vy, g.joystick.vx);
      wizard.facingAngle = dashAngle;
    }
    const dashSpeed = 13.5;
    wizard.dashVx = Math.cos(dashAngle) * dashSpeed;
    wizard.dashVy = Math.sin(dashAngle) * dashSpeed;

    // Chispas de velocidad en el punto inicial
    for (let s = 0; s < 8; s++) {
      const ang = dashAngle + Math.PI + (Math.random() - 0.5) * 0.9;
      g.particles.push({
        id: `dash-${Date.now()}-${s}`,
        x: wizard.x,
        y: wizard.y,
        vx: Math.cos(ang) * (3 + Math.random() * 3),
        vy: Math.sin(ang) * (3 + Math.random() * 3),
        radius: 2,
        color: '#67e8f9',
        alpha: 1,
        life: 14,
      });
    }
  }, [isDefeated, isVictorious]);

  // Lanzamiento de Hechizo (con soporte para variante Cargada)
  const handleAttack = useCallback(
    (isCharged: boolean = false, chargeRatio?: number) => {
      if (isDefeated || isVictorious || gameStateRef.current.wizard.isEnteringVictoryPortal) return;
      const now = Date.now();
      const g = gameStateRef.current;
      if (chargedBoostUntilRef.current > now) { isCharged = true; chargeRatio = 1; }
      const rawRecipe = activeRecipe;
      if (isTutorial) {
        if (tutorialStepRef.current === 2 && rawRecipe.id === 'basic_spark') setTutorialStep(3);
        else if (tutorialStepRef.current === 3 && rawRecipe.elements.length > 0) {
          setElementQueue([]);
          setTutorialStep(4);
          g.roomCleared = true;
          g.terrainManager.unlockRoomDoors(g.floatingTexts);
        }
      }

      // Cooldown individual por receta/hechizo con reducción por nivel (solo Cataclismo de 4 elementos tiene cooldown)
      const lastCast = g.recipeCooldowns[rawRecipe.id] || 0;
      const effectiveCooldownMs = getEffectiveCooldown(rawRecipe.cooldownMs, rawRecipe.id);
      const recipeCdRemaining = Math.max(0, effectiveCooldownMs - (now - lastCast));
      if (recipeCdRemaining > 0) {
        const secsRemaining = (recipeCdRemaining / 1000).toFixed(1);
        elementalSound.playCooldownWarning();
        g.floatingTexts.push({
          id: `cd_${now}_${rawRecipe.id}`,
          x: g.wizard.x,
          y: g.wizard.y - 32,
          text: `⏳ ${rawRecipe.name}: ${secsRemaining}s`,
          color: '#f472b6',
          fontSize: 13,
          opacity: 1,
          vy: -1.3,
          life: 38,
        });
        return;
      }

      // PROGRESIÓN DIRECTA POR TAREAS & HITOS:
      // +4% de daño global a todos los ataques por nivel del personaje
      const globalDmgMult = 1.0 + Math.max(0, (player.level || 1) - 1) * 0.04;
      // Bono Ígneo (+10% si desbloqueó el Hito "Disciplina de Fuego" y el hechizo usa Fuego)
      const isFireSpell = rawRecipe.elements.includes('fire') || rawRecipe.id === 'fire_shot' || rawRecipe.id === 'fire_inferno' || rawRecipe.id === 'magma_eruption' || rawRecipe.id === 'hell_rain' || rawRecipe.id === 'thermal_shock' || rawRecipe.id === 'obsidian_volcano' || rawRecipe.id === 'elemental_cataclysm';
      const fireBonus = (isFireSpell && (player.unlockedMilestones || []).includes('disciplina_fuego')) ? 1.10 : 1.0;
      const heroDamageMultiplier = globalDmgMult * fireBonus;

      const recipe = {
        ...rawRecipe,
        damage: Math.round(rawRecipe.damage * heroDamageMultiplier),
      };

      // Intervalo mínimo de seguridad global entre lanzamientos (120 ms)
      if (now - g.lastAttackTime < 120) return;
      g.lastAttackTime = now;
      g.recipeCooldowns[recipe.id] = now;

      const wizard = g.wizard;

      // Retroceso de Ataque (Attack Recoil: 4px en dirección opuesta a facingAngle por 80ms)
      wizard.recoilX = -Math.cos(wizard.facingAngle) * 4;
      wizard.recoilY = -Math.sin(wizard.facingAngle) * 4;
      wizard.recoilTimer = 80;

      // Destello Elemental al Castear (60ms)
      const primaryElem = recipe.elements[0] || 'fire';
      const flashMap: Record<string, string> = {
        fire: 'rgba(249, 115, 22, 0.45)',
        lightning: 'rgba(250, 204, 21, 0.45)',
        ice: 'rgba(56, 189, 248, 0.45)',
        earth: 'rgba(34, 197, 94, 0.45)',
      };
      wizard.castFlashColor = flashMap[primaryElem] || 'rgba(255, 255, 255, 0.4)';
      wizard.castFlashTimer = 60;
      wizard.staffCastTimer = 190;
      wizard.activeElement = (recipe.elements[0] || 'fire') as 'fire' | 'lightning' | 'earth' | 'ice' | 'plasma' | 'magma';

      // Feedback Háptico
      if (recipe.id === 'elemental_cataclysm') {
        haptics.heavy();
      } else {
        haptics.medium();
      }

      // Reactivación anticipada: si ya hay un Núcleo de Sobrecarga activo en el terreno, detonarlo inmediatamente
      const existingOverloadCore = g.overloadCores.find((c) => !c.finished && c.phase !== 'detonating');
      if (existingOverloadCore) {
        existingOverloadCore.phase = 'detonating';
        existingOverloadCore.phaseTimer = 0;
        return;
      }

      // Reproducir sonido característico de cada hechizo
      if (recipe.id === 'basic_spark') elementalSound.playBasicSpark();
      else if (recipe.id === 'fire_shot') elementalSound.playFireShot();
      else if (recipe.id === 'lightning_bolt') elementalSound.playLightningBolt();
      else if (recipe.id === 'ice_shard') elementalSound.playIceShard();
      else if (recipe.id === 'ice_lance') {
        // Erupción Glacial tiene su propio sonido de invocación
      }
      else if (recipe.id === 'earth_toss') elementalSound.playEarthToss();
      else if (recipe.id === 'earth_megalith') {
        // Puño Tectónico tiene su propio rugido sísmico de invocación
      }
      else if (recipe.id === 'thermal_shock') {
        // Vórtice de Choque Térmico gestiona sus propios sonidos de descompresión sónica y fractura
      }
      else if (recipe.id === 'magma_eruption') {
        // Bombardeo Volcánico gestiona sus propios sonidos de rugido sísmico, géiseres y splat
      }
      else if (recipe.id === 'crystal_field') {
        // Jaula de Pilares Conductores gestiona sus propios sonidos de erupción telúrica y zaps
      }
      else if (recipe.id === 'cryo_storm') {
        // Rayo Criogénico gestiona su propio sonido de disparo / sobrecarga
      }
      else if (recipe.id === 'permafrost_prison') {
        // Prisión de Permafrost gestiona sus propios sonidos de erupción telúrica y fragmentación
      }
      else if (recipe.id === 'explosive_overload') {
        // Tornado de Plasma gestiona sus propios sonidos de ignición de vórtice, desintegración y detonación
      }
      else if (recipe.id === 'hell_rain') {
        // Lluvia del Infierno gestiona sus propios sonidos de invocación cósmica, silbido y detonaciones
      }
      else if (recipe.id === 'celestial_storm') {
        // Tormenta Celestial gestiona sus propios sonidos de tempestad, relámpagos y truenos
      }
      else if (recipe.id === 'devastating_glacier') {
        // Glaciar Devastador gestiona sus propios sonidos de ventisca, monolitos y erupción radial
      }
      else if (recipe.id === 'telluric_barrier') {
        // Barrera Telúrica gestiona sus propios sonidos de invocación, absorción y detonación
      }
      else if (recipe.id === 'obsidian_volcano') {
        // Volcán de Obsidiana gestiona sus propios sonidos sintetizados (cast, erupción, vitrificación, corte y shatter)
      }
      else if (recipe.id === 'conductive_prison') {
        // Prisión Conductora gestiona sus propios sonidos de invocación, choque perimetral, impacto e implosión
      }
      else if (recipe.id === 'overload_core') {
        // Núcleo de Sobrecarga gestiona sus propios sonidos de despliegue, pulsos periódicos, alarma crítica y detonación
      }
      else if (recipe.id === 'glacial_plasma_storm') {
        // Tormenta de Plasma Glacial gestiona sus propios sonidos sintetizados de lanzamiento, arcos, implosión y detonación
      }
      else if (recipe.id === 'elemental_cataclysm') elementalSound.playCataclysm();
      else if (recipe.id === 'magma_trench') elementalSound.playEarthToss();
      else if (recipe.id === 'thermal_deflagration') elementalSound.playFireShot();
      else if (recipe.id === 'solar_fusion_beam') elementalSound.playLightningBolt();
      else if (recipe.id === 'glacial_avalanche') elementalSound.playEarthToss();
      else if (recipe.id === 'boiling_hail') elementalSound.playIceShard();
      else if (recipe.id === 'superconductor_blizzard') elementalSound.playLightningBolt();
      else elementalSound.playFireShot();

      // Cálculo de dirección de apuntado (Manual para Erupción Glacial / Puño Tectónico / Bombardeo Volcánico / Tornado de Plasma / Tormenta de Plasma Glacial)
      let aimAngle = wizard.facingAngle;
      let closestDist = 420;
      let targetX = wizard.x + Math.cos(aimAngle) * 110;
      let targetY = wizard.y + Math.sin(aimAngle) * 110;

      if (
        recipe.id === 'ice_lance' ||
        recipe.id === 'cryo_storm' ||
        recipe.id === 'explosive_overload' ||
        recipe.id === 'glacial_plasma_storm' ||
        recipe.id === 'magma_trench' ||
        recipe.id === 'thermal_deflagration' ||
        recipe.id === 'solar_fusion_beam' ||
        recipe.id === 'glacial_avalanche' ||
        recipe.id === 'boiling_hail' ||
        recipe.id === 'superconductor_blizzard'
      ) {
        // Puntería manual prioritaria mediante arrastre táctil en botón de ataque o ratón en PC
        if (attackAimRef.current.isAiming) {
          const adx = attackAimRef.current.currX - attackAimRef.current.startX;
          const ady = attackAimRef.current.currY - attackAimRef.current.startY;
          if (Math.hypot(adx, ady) > 7) {
            aimAngle = Math.atan2(ady, adx);
          }
        } else if (mousePosRef.current.active) {
          const mdx = mousePosRef.current.x - wizard.x;
          const mdy = mousePosRef.current.y - wizard.y;
          if (Math.hypot(mdx, mdy) > 10) {
            aimAngle = Math.atan2(mdy, mdx);
          }
        } else {
          // Si no hay arrastre manual ni puntero de ratón, orientar automáticamente hacia el enemigo más cercano
          for (const enemy of g.enemyManager.enemies) {
            const dx = enemy.x - wizard.x;
            const dy = enemy.y - wizard.y;
            const dist = Math.hypot(dx, dy);
            if (dist < closestDist) {
              closestDist = dist;
              aimAngle = Math.atan2(dy, dx);
            }
          }
        }
        targetX = wizard.x + Math.cos(aimAngle) * 260;
        targetY = wizard.y + Math.sin(aimAngle) * 260;
      } else if (recipe.id === 'thermal_shock' || recipe.id === 'telluric_barrier') {
        // Vórtice de Choque Térmico / Barrera Telúrica: Centrado en el jugador por defecto (botón de pánico/defensivo)
        if (attackAimRef.current.isAiming) {
          const adx = attackAimRef.current.currX - attackAimRef.current.startX;
          const ady = attackAimRef.current.currY - attackAimRef.current.startY;
          if (Math.hypot(adx, ady) > 7) {
            aimAngle = Math.atan2(ady, adx);
            targetX = wizard.x + Math.cos(aimAngle) * 95;
            targetY = wizard.y + Math.sin(aimAngle) * 95 * 0.58;
          } else {
            targetX = wizard.x;
            targetY = wizard.y;
          }
        } else if (mousePosRef.current.active && Math.hypot(mousePosRef.current.x - wizard.x, mousePosRef.current.y - wizard.y) > 40) {
          targetX = mousePosRef.current.x;
          targetY = mousePosRef.current.y;
          aimAngle = Math.atan2(targetY - wizard.y, targetX - wizard.x);
        } else {
          targetX = wizard.x;
          targetY = wizard.y;
        }
      } else if (recipe.id === 'earth_megalith' || recipe.id === 'magma_eruption' || recipe.id === 'crystal_field' || recipe.id === 'permafrost_prison' || recipe.id === 'hell_rain' || recipe.id === 'celestial_storm' || recipe.id === 'devastating_glacier' || recipe.id === 'obsidian_volcano' || recipe.id === 'conductive_prison' || recipe.id === 'overload_core' || recipe.id === 'elemental_cataclysm') {
        // Apuntado de Puño Tectónico / Bombardeo Volcánico / Jaula Conductora / Prisión de Permafrost / Lluvia del Infierno / Tormenta Celestial / Glaciar Devastador / Volcán de Obsidiana / Prisión Conductora / Núcleo de Sobrecarga / Cataclismo Elemental: Bloqueo de zona al enemigo prioritario dentro del alcance, o puntería manual
        const targetDist = (recipe.id === 'elemental_cataclysm' || recipe.id === 'hell_rain' || recipe.id === 'celestial_storm' || recipe.id === 'devastating_glacier' || recipe.id === 'obsidian_volcano' || recipe.id === 'conductive_prison' || recipe.id === 'overload_core') ? 175 : (recipe.id === 'magma_eruption' ? 180 : ((recipe.id === 'crystal_field' || recipe.id === 'permafrost_prison') ? 140 : 220));
        if (attackAimRef.current.isAiming) {
          const adx = attackAimRef.current.currX - attackAimRef.current.startX;
          const ady = attackAimRef.current.currY - attackAimRef.current.startY;
          if (Math.hypot(adx, ady) > 7) {
            aimAngle = Math.atan2(ady, adx);
            targetX = wizard.x + Math.cos(aimAngle) * targetDist;
            targetY = wizard.y + Math.sin(aimAngle) * targetDist * 0.58;
          }
        } else if (mousePosRef.current.active) {
          targetX = mousePosRef.current.x;
          targetY = mousePosRef.current.y;
          aimAngle = Math.atan2(targetY - wizard.y, targetX - wizard.x);
        } else {
          for (const enemy of g.enemyManager.enemies) {
            const dx = enemy.x - wizard.x;
            const dy = enemy.y - wizard.y;
            const dist = Math.hypot(dx, dy);
            if (dist < closestDist) {
              closestDist = dist;
              aimAngle = Math.atan2(dy, dx);
              targetX = enemy.x;
              targetY = enemy.y;
            }
          }
        }
      } else {
        // Auto-apuntar al enemigo más cercano o rueda del puzle de hielo, o disparar hacia la dirección del mago
        const tmWheel = g.tilemap?.puzzleWheel;
        const isIceSpell = (recipe.id as string) === 'ice_shard' || (recipe.id as string) === 'ice_lance';
        const isFireSpell = recipe.id === 'fire_shot';
        if (isIceSpell || isFireSpell) {
          const target = findNearestCombatTarget(
            wizard,
            g.enemyManager.enemies,
            isFireSpell ? 'fire' : 'ice',
            tmWheel,
            460
          );
          if (target) {
            aimAngle = target.angle;
            targetX = target.x;
            targetY = target.y;
          }
        } else {
          for (const enemy of g.enemyManager.enemies) {
            const dx = enemy.x - wizard.x;
            const dy = enemy.y - wizard.y;
            const dist = Math.hypot(dx, dy);
            if (dist < closestDist) {
              closestDist = dist;
              aimAngle = Math.atan2(dy, dx);
              targetX = enemy.x;
              targetY = enemy.y;
            }
          }
        }
      }

      if (!attackAimRef.current.isAiming && !mousePosRef.current.active && !g.enemyManager.enemies.some((enemy) => enemy.hp > 0)) {
        const vessel = g.terrainManager.obstacles
          .filter((obs) => obs.obstacleType === 'vessel' && obs.hp > 0 && Math.hypot(obs.x - wizard.x, obs.y - wizard.y) < 460)
          .sort((a, b) => Math.hypot(a.x - wizard.x, a.y - wizard.y) - Math.hypot(b.x - wizard.x, b.y - wizard.y))[0];
        if (vessel) { targetX = vessel.x; targetY = vessel.y; aimAngle = Math.atan2(targetY - wizard.y, targetX - wizard.x); }
      }
      wizard.facingAngle = aimAngle;
      wizard.staffOrbColor = recipe.color;

      const chargeMultiplier = isCharged ? 1.65 : 1.0;
      const statBonus = Math.floor((player.stats.attack * 0.45 + player.stats.knowledge * 0.45) * heroDamageMultiplier);

      if (isCharged) {
        g.screenShake = Math.max(g.screenShake, 8);
        g.floatingTexts.push({
          id: `charged-${now}`,
          x: wizard.x,
          y: wizard.y - 28,
          text: '⚡ ¡HECHIZO CARGADO! x1.65',
          color: '#fef08a',
          fontSize: 13,
          opacity: 1,
          vy: -1.5,
          life: 35,
        });
      }

      // COMPORTAMIENTOS ESPECÍFICOS Y FÍSICOS DE LAS HABILIDADES:

      // 0. RAYO (DESCARGA ELÉCTRICA BÁSICA)
      if (recipe.id === 'lightning_bolt') {
        g.screenShake = 5 * (isCharged ? 1.5 : 1.0);
        elementalSound.playLightningBolt();

        const startX = wizard.x + Math.cos(aimAngle) * 22;
        const startY = wizard.y + Math.sin(aimAngle) * 22;

        let hitTargetX = targetX;
        let hitTargetY = targetY;
        if (closestDist >= 420) {
          hitTargetX = wizard.x + Math.cos(aimAngle) * 400;
          hitTargetY = wizard.y + Math.sin(aimAngle) * 400;
        }

        const bolt = generateLightningBolt(
          startX,
          startY,
          hitTargetX,
          hitTargetY,
          recipe.color || '#facc15',
          recipe.secondaryColor || '#ffffff'
        );

        let struckEnemy: GameEnemy | null = null;
        let minEnemyDist = Infinity;
        for (const enemy of g.enemyManager.enemies) {
          const dist = Math.hypot(enemy.x - hitTargetX, enemy.y - hitTargetY);
          if (dist <= enemy.radius + 32 && dist < minEnemyDist) {
            minEnemyDist = dist;
            struckEnemy = enemy;
          }
        }

        const baseDmg = (recipe.damage + statBonus) * chargeMultiplier;

        if (struckEnemy) {
          struckEnemy.hp -= baseDmg;
          struckEnemy.hitFlash = 12;
          struckEnemy.stunnedTimer = isCharged ? 50 : 30;
          g.enemyManager.applyStatus(struckEnemy, 'shocked', 150);

          const knock = (recipe.knockback || 1.5) * (isCharged ? 5.0 : 3.5);
          struckEnemy.x += Math.cos(aimAngle) * knock;
          struckEnemy.y += Math.sin(aimAngle) * knock;

          g.floatingTexts.push({
            id: `lightning-hit-${now}`,
            x: struckEnemy.x,
            y: struckEnemy.y - 18,
            text: `⚡ -${Math.round(baseDmg)} [ELECTROCUTADO]`,
            color: '#facc15',
            fontSize: 13,
            opacity: 1,
            vy: -1.4,
            life: 35,
          });

          for (let s = 0; s < 14; s++) {
            const sparkAng = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 4.5;
            g.particles.push({
              id: `spark-${now}-${s}`,
              x: struckEnemy.x,
              y: struckEnemy.y,
              vx: Math.cos(sparkAng) * spd,
              vy: Math.sin(sparkAng) * spd,
              radius: 1.5 + Math.random() * 2,
              color: Math.random() > 0.4 ? '#facc15' : '#e0f2fe',
              alpha: 1,
              life: 18,
            });
          }

          const maxChains = isCharged ? 3 : 1;
          let chainsCount = 0;
          for (const other of g.enemyManager.enemies) {
            if (other.id === struckEnemy.id) continue;
            const chainDist = Math.hypot(other.x - struckEnemy.x, other.y - struckEnemy.y);
            if (chainDist < 230 && chainsCount < maxChains) {
              chainsCount++;
              bolt.chainLines.push({
                x1: struckEnemy.x,
                y1: struckEnemy.y,
                x2: other.x,
                y2: other.y,
              });

              const chainDmg = Math.round(baseDmg * 0.65);
              other.hp -= chainDmg;
              other.hitFlash = 10;
              other.stunnedTimer = isCharged ? 35 : 25;
              g.enemyManager.applyStatus(other, 'shocked', 130);

              const chainAngle = Math.atan2(other.y - struckEnemy.y, other.x - struckEnemy.x);
              other.x += Math.cos(chainAngle) * 3.5;
              other.y += Math.sin(chainAngle) * 3.5;

              g.floatingTexts.push({
                id: `chain-hit-${now}-${chainsCount}`,
                x: other.x,
                y: other.y - 14,
                text: `⚡ -${chainDmg}`,
                color: '#38bdf8',
                fontSize: 12,
                opacity: 1,
                vy: -1.2,
                life: 30,
              });

              for (let cs = 0; cs < 6; cs++) {
                const cAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  id: `cspark-${now}-${chainsCount}-${cs}`,
                  x: other.x,
                  y: other.y,
                  vx: Math.cos(cAng) * 3,
                  vy: Math.sin(cAng) * 3,
                  radius: 1.6,
                  color: '#38bdf8',
                  alpha: 1,
                  life: 14,
                });
              }
            }
          }
        } else {
          for (let s = 0; s < 8; s++) {
            const sparkAng = Math.random() * Math.PI * 2;
            g.particles.push({
              id: `wallspark-${now}-${s}`,
              x: hitTargetX,
              y: hitTargetY,
              vx: Math.cos(sparkAng) * 3,
              vy: Math.sin(sparkAng) * 3,
              radius: 1.8,
              color: '#facc15',
              alpha: 1,
              life: 14,
            });
          }
        }

        // Romper o sobrecargar obstáculos cercanos (incluyendo cristales energizados)
        g.terrainManager.obstacles.forEach((obs) => {
          const d = Math.hypot(obs.x - hitTargetX, obs.y - hitTargetY);
          if (d <= obs.radius + 30) {
            obs.hp -= baseDmg;
            if (obs.obstacleType === 'energized_crystal') {
              obs.hp = 0;
              elementalSound.playAoEExplosion();
              g.enemyManager.enemies.forEach((en) => {
                if (Math.hypot(en.x - obs.x, en.y - obs.y) < 85) {
                  en.hp -= 46 * chargeMultiplier;
                  en.hitFlash = 12;
                  en.stunnedTimer = 35;
                }
              });
              g.floatingTexts.push({
                id: `cry-overload-${now}`,
                x: obs.x,
                y: obs.y - 20,
                text: '⚡ ¡SOBRECARGA DE CRISTAL!',
                color: '#facc15',
                fontSize: 13,
                opacity: 1,
                vy: -1.4,
                life: 35,
              });
            }
          }
        });

        for (let s = 0; s < 6; s++) {
          const staffAng = Math.random() * Math.PI * 2;
          g.particles.push({
            id: `staffspark-${now}-${s}`,
            x: startX,
            y: startY,
            vx: Math.cos(staffAng) * 2,
            vy: Math.sin(staffAng) * 2,
            radius: 1.5,
            color: '#ffffff',
            alpha: 1,
            life: 12,
          });
        }

        g.lightningBolts.push(bolt);
      }
      // 0.1 SOBRECARGA VOLTAICA (RAYO + RAYO): Lanzamiento directo con toque normal y +50% de daño al mantener presionado
      else if (recipe.id === 'lightning_storm') {
        const isMaxCharge = isCharged || (chargeRatio !== undefined && chargeRatio >= 0.95);
        const ratio = chargeRatio !== undefined ? Math.max(0, Math.min(1.0, chargeRatio)) : (isCharged ? 1.0 : 0);
        // Daño base al 100% en toque normal, y +50% adicional si el usuario decide mantener presionado
        const chargeDamageBoost = 1.0 + 0.50 * (isMaxCharge ? 1.0 : ratio);

        const staffX = wizard.x + Math.cos(aimAngle) * 22;
        const staffY = wizard.y + Math.sin(aimAngle) * 22;

        // Seleccionar enemigo principal mediante regla de proximidad y alcance de Rayo (~420px)
        let primaryTarget: GameEnemy | null = null;
        let minTargetDist = 420;
        for (const enemy of g.enemyManager.enemies) {
          if (enemy.hp <= 0) continue;
          const dist = Math.hypot(enemy.x - wizard.x, enemy.y - wizard.y);
          if (dist < minTargetDist) {
            minTargetDist = dist;
            primaryTarget = enemy;
          }
        }

        // Si NO hay enemigos válidos al liberar: descarga al aire en dirección de apuntado (sin daño fantasma)
        if (!primaryTarget) {
          elementalSound.playVoltaicDischarge(false);
          const fizzleEndX = wizard.x + Math.cos(aimAngle) * 320;
          const fizzleEndY = wizard.y + Math.sin(aimAngle) * 320;
          const fizzleBolt = generateLightningBolt(staffX, staffY, fizzleEndX, fizzleEndY, '#38bdf8', '#ffffff');
          fizzleBolt.life = 6;
          fizzleBolt.maxLife = 6;
          g.lightningBolts.push(fizzleBolt);

          for (let s = 0; s < 8; s++) {
            const spAng = Math.random() * Math.PI * 2;
            g.particles.push({
              id: `fizzle-sp-${now}-${s}`,
              x: fizzleEndX,
              y: fizzleEndY,
              vx: Math.cos(spAng) * 3,
              vy: Math.sin(spAng) * 3,
              radius: 1.5,
              color: '#38bdf8',
              alpha: 1,
              life: 14,
            });
          }

          setElementQueue([]);
          return;
        }

        // Si HAY enemigo: liberar descarga con nivel de carga
        elementalSound.playVoltaicDischarge(isMaxCharge);
        g.screenShake = isMaxCharge ? 14 : 7;

        // Daño principal (100% de daño base en toque normal, 150% si se mantiene presionado a carga máxima)
        const baseDmg = recipe.damage + statBonus;
        const primaryDmg = Math.round(baseDmg * chargeDamageBoost);

        const visited = new Set<string>();
        visited.add(primaryTarget.id);

        const jumps: VoltaicJump[] = [];
        const jumpInterval = 55; // 55 ms entre saltos para lectura clara

        // Salto 0: Desde el mago hacia el primer objetivo
        jumps.push({
          fromX: staffX,
          fromY: staffY,
          toX: primaryTarget.x,
          toY: primaryTarget.y,
          targetEnemyId: primaryTarget.id,
          damage: primaryDmg,
          isMaxCharge,
          delayMs: 0,
          struck: false,
        });

        // Saltos subsecuentes entre enemigos cercanos (distancia máxima de salto ~240px)
        const maxJumpsCount = isMaxCharge ? 7 : (ratio > 0.4 ? 5 : 4);
        const maxJumpDist = 240;

        let currentSource = primaryTarget;
        let currentDmg = primaryDmg;

        for (let j = 1; j < maxJumpsCount; j++) {
          let nextTarget: GameEnemy | null = null;
          let nextDist = maxJumpDist;

          for (const cand of g.enemyManager.enemies) {
            if (cand.hp <= 0 || visited.has(cand.id)) continue;
            const d = Math.hypot(cand.x - currentSource.x, cand.y - currentSource.y);
            if (d < nextDist) {
              nextDist = d;
              nextTarget = cand;
            }
          }

          if (!nextTarget) break;

          visited.add(nextTarget.id);
          currentDmg = Math.round(currentDmg * 0.78);

          jumps.push({
            fromX: currentSource.x,
            fromY: currentSource.y,
            toX: nextTarget.x,
            toY: nextTarget.y,
            targetEnemyId: nextTarget.id,
            damage: Math.max(14, currentDmg),
            isMaxCharge,
            delayMs: j * jumpInterval,
            struck: false,
            isFinishRemate: false,
          });

          currentSource = nextTarget;
        }

        // Marcar último salto si fue a Carga Máxima para el remate
        if (isMaxCharge && jumps.length > 0) {
          jumps[jumps.length - 1].isFinishRemate = true;
        }

        g.voltaicChains.push({
          id: `volt-chain-${now}-${Math.random()}`,
          sourceX: staffX,
          sourceY: staffY,
          chargeRatio: ratio,
          isMaxCharge,
          jumps,
          elapsedMs: 0,
          finished: false,
          visitedEnemyIds: Array.from(visited),
        });

        g.floatingTexts.push({
          id: `volt-cast-${now}`,
          x: wizard.x,
          y: wizard.y - 25,
          text: isMaxCharge ? '⚡⚡ ¡SOBRECARGA VOLTAICA +50%!' : '⚡⚡ ¡SOBRECARGA VOLTAICA!',
          color: isMaxCharge ? '#ffffff' : '#38bdf8',
          fontSize: 14,
          opacity: 1,
          vy: -1.3,
          life: 38,
        });
      }
      // 0.2 ERUPCIÓN GLACIAL (HIELO + HIELO): Línea escalonada de púas gigantes en 2.5D, apuntado manual, elevación y congelación
      else if (recipe.id === 'ice_lance') {
        const isMaxCharge = isCharged || (chargeRatio !== undefined && chargeRatio >= 0.95);
        const ratio = chargeRatio !== undefined ? Math.max(0, Math.min(1.0, chargeRatio)) : (isCharged ? 1.0 : 0);
        // Daño base al 100% en toque normal, y +50% adicional si el usuario decide mantener presionado
        const chargeDamageBoost = 1.0 + 0.50 * (isMaxCharge ? 1.0 : ratio);

        const baseDmg = recipe.damage + statBonus;
        const finalDmg = Math.round(baseDmg * chargeDamageBoost);

        elementalSound.playGlacialEruptionCast(isMaxCharge);
        g.screenShake = isMaxCharge ? 12 : 7;

        const totalSteps = isMaxCharge ? 8 : 6;
        const stepDist = isMaxCharge ? 40 : 38;
        const stepIntervalMs = 55; // 55 ms entre la emersión de cada púa

        const squish = 0.58;
        const segments: GlacialSpikeSegment[] = [];

        for (let i = 0; i < totalSteps; i++) {
          const dist = (i + 1) * stepDist;
          // Coordenadas fijas en el mundo (no giran con el mago al moverse)
          const segX = wizard.x + Math.cos(aimAngle) * dist;
          const segY = wizard.y + Math.sin(aimAngle) * dist * squish;

          // Escala progresiva: las primeras son agujas medianas, las últimas son monolitos masivos
          const heightProgress = i / (totalSteps - 1);
          const baseH = isMaxCharge ? (34 + heightProgress * 32) : (26 + heightProgress * 24);
          const baseW = isMaxCharge ? (16 + heightProgress * 12) : (13 + heightProgress * 9);

          // Variación angular sutil para aspecto orgánico de cúmulo de cristal
          const rotationOffset = ((i % 3) - 1) * 0.14 + (Math.random() - 0.5) * 0.08;

          segments.push({
            index: i,
            x: segX,
            y: segY,
            maxHeight: baseH,
            currentHeight: 0,
            width: baseW,
            rotationOffset,
            emerged: false,
            emergeDelayMs: i * stepIntervalMs,
            shatterProgress: 0,
          });
        }

        g.glacialEruptions.push({
          id: `glacial-${now}-${Math.random()}`,
          startX: wizard.x,
          startY: wizard.y,
          aimAngle,
          segments,
          currentStep: 0,
          totalSteps,
          stepIntervalMs,
          elapsedMs: 0,
          damage: finalDmg,
          knockup: (recipe.knockback || 4.5) * (isMaxCharge ? 1.4 : 1.0),
          isCharged: isMaxCharge,
          phase: 'emerging',
          phaseTimer: 0,
          persistDurationMs: 1400,
          shatterDurationMs: 320,
          hitEnemyIds: [],
        });

        g.floatingTexts.push({
          id: `ice-cast-${now}`,
          x: wizard.x,
          y: wizard.y - 25,
          text: isMaxCharge ? '❄️🏔️ ¡ERUPCIÓN GLACIAL +50%!' : '❄️🏔️ ¡ERUPCIÓN GLACIAL!',
          color: isMaxCharge ? '#ffffff' : '#06b6d4',
          fontSize: 14,
          opacity: 1,
          vy: -1.3,
          life: 38,
        });

        setElementQueue([]);
        return;
      }
      // 0.3 PUÑO TECTÓNICO (TIERRA + TIERRA): Impacto vertical masivo, elevación, interrupción y escombros temporales
      else if (recipe.id === 'earth_megalith') {
        const isMaxCharge = isCharged || (chargeRatio !== undefined && chargeRatio >= 0.95);
        const ratio = chargeRatio !== undefined ? Math.max(0, Math.min(1.0, chargeRatio)) : (isCharged ? 1.0 : 0);
        // Daño base al 100% en toque normal, y +50% adicional si el usuario decide mantener presionado
        const chargeDamageBoost = 1.0 + 0.50 * (isMaxCharge ? 1.0 : ratio);

        const baseDmg = recipe.damage + statBonus;
        const finalDmg = Math.round(baseDmg * chargeDamageBoost);

        elementalSound.playTectonicRumble(isMaxCharge);
        g.screenShake = isMaxCharge ? 10 : 6;

        const impactRadius = isMaxCharge ? 54 : 42;
        const maxFistH = isMaxCharge ? 95 : 78;
        const rubbleCount = isMaxCharge ? 4 : 3;

        // Generar 5 ángulos de fractura para las grietas telúricas en el suelo
        const crackAngles = [
          0.3 + (Math.random() - 0.5) * 0.25,
          1.5 + (Math.random() - 0.5) * 0.25,
          2.7 + (Math.random() - 0.5) * 0.25,
          3.9 + (Math.random() - 0.5) * 0.25,
          5.1 + (Math.random() - 0.5) * 0.25,
        ];

        g.tectonicFists.push({
          id: `fist-${now}-${Math.random()}`,
          targetX,
          targetY,
          radius: impactRadius,
          damage: finalDmg,
          knockup: (recipe.knockback || 7.5) * (isMaxCharge ? 1.4 : 1.0),
          isCharged: isMaxCharge,
          phase: 'warning',
          phaseTimer: 0,
          warningDurationMs: 220,
          eruptionDurationMs: 260,
          collapseDurationMs: 200,
          hasDealtDamage: false,
          fistHeight: 0,
          maxFistHeight: maxFistH,
          crackAngles,
          rubbleSpawned: false,
          rubbleCount,
        });

        g.floatingTexts.push({
          id: `fist-cast-${now}`,
          x: wizard.x,
          y: wizard.y - 25,
          text: isMaxCharge ? '👊🌍 ¡PUÑO TECTÓNICO +50%!' : '👊🌍 ¡PUÑO TECTÓNICO!',
          color: isMaxCharge ? '#fef08a' : '#d97706',
          fontSize: 14,
          opacity: 1,
          vy: -1.3,
          life: 38,
        });

        setElementQueue([]);
        return;
      }
      // 1. HIELO + TIERRA (PRISIÓN DE PERMAFROST: MONOLITOS DE ROCA/HIELO, ABSORCIÓN DE PROYECTILES Y METRALLA RADIAL)
      else if (recipe.id === 'permafrost_prison') {
        const isOverloaded = isCharged || (chargeRatio !== undefined && chargeRatio >= 0.95);
        const baseDmg = recipe.damage + statBonus;
        const fragmentationDmg = Math.round(baseDmg * (isOverloaded ? 1.5 : 1.0));
        const impactDmg = Math.round(16 * (isOverloaded ? 1.5 : 1.0));
        const prisonRadius = isOverloaded ? 90 : 64;
        const squish = 0.58;
        const monolithHp = isOverloaded ? 180 : 120; // +50% durabilidad
        const monolithMaxHeight = isOverloaded ? 74 : 62;

        g.screenShake = isOverloaded ? 8.5 : 5.5;
        elementalSound.playPermafrostErupt(isOverloaded);

        const monoliths: PermafrostMonolithNode[] = [];

        if (!isOverloaded) {
          // 4 Monolitos: Rombo / Cuadrado perimetral
          const offsets = [
            { x: 0, y: -prisonRadius * squish },
            { x: prisonRadius, y: 0 },
            { x: 0, y: prisonRadius * squish },
            { x: -prisonRadius, y: 0 },
          ];
          offsets.forEach((off, idx) => {
            monoliths.push({
              id: `perma_mono_${now}_${idx}`,
              x: targetX + off.x,
              y: targetY + off.y,
              height: 0,
              maxHeight: monolithMaxHeight,
              radius: 15,
              hp: monolithHp,
              maxHp: monolithHp,
              crackProgress: 0,
              shattered: false,
              shatterTimer: 0,
              hitFlash: 0,
              angles: [idx * 1.5, idx * 1.5 + 2.1],
            });
          });
        } else {
          // 6 Monolitos: Hexágono regular reforzado
          for (let i = 0; i < 6; i++) {
            const ang = (i * Math.PI) / 3 - Math.PI / 2;
            monoliths.push({
              id: `perma_mono_${now}_${i}`,
              x: targetX + prisonRadius * Math.cos(ang),
              y: targetY + prisonRadius * Math.sin(ang) * squish,
              height: 0,
              maxHeight: monolithMaxHeight,
              radius: 16,
              hp: monolithHp,
              maxHp: monolithHp,
              crackProgress: 0,
              shattered: false,
              shatterTimer: 0,
              hitFlash: 0,
              angles: [i * 1.05, i * 1.05 + 2.4],
            });
          }
        }

        // Si algún enemigo común está justo en el punto de brote de un monolito, recibe daño de impacto y es empujado hacia el centro
        const hitEnemyIds: string[] = [];
        monoliths.forEach((m) => {
          for (const enemy of g.enemyManager.enemies) {
            if (enemy.hp <= 0) continue;
            const dist = Math.hypot(enemy.x - m.x, (enemy.y - m.y) / squish);
            if (dist < m.radius + enemy.radius) {
              if (!hitEnemyIds.includes(enemy.id)) {
                hitEnemyIds.push(enemy.id);
                enemy.hp -= impactDmg;
                enemy.hitFlash = 12;
                // Empujar hacia el centro de la prisión
                const pushAng = Math.atan2(targetY - enemy.y, targetX - enemy.x);
                enemy.x += Math.cos(pushAng) * 22;
                enemy.y += Math.sin(pushAng) * 22 * squish;
                g.enemyManager.applyStatus(enemy, 'slowed', 90);
                g.floatingTexts.push({
                  id: `perma_impact_${now}_${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 15,
                  text: `-${impactDmg} ❄️`,
                  color: '#00e5ff',
                  fontSize: 13,
                  opacity: 1,
                  vy: -1.0,
                  life: 25,
                });
              }
            }
          }
        });

        // Crear la entidad Prisión de Permafrost
        const prisonEntity: PermafrostPrisonEntity = {
          id: `permafrost_prison_${now}_${Math.random().toString(36).substring(2, 6)}`,
          centerX: targetX,
          centerY: targetY,
          radius: prisonRadius,
          isCharged: isOverloaded,
          monoliths,
          phase: 'erupting',
          phaseTimer: 0,
          eruptDurationMs: 220,
          activeDurationMs: 3500,
          shatterDurationMs: 260,
          fragmentationDamage: fragmentationDmg,
          impactDamage: impactDmg,
          hitEruptionEnemyIds: hitEnemyIds,
          finished: false,
        };

        g.permafrostPrisons.push(prisonEntity);

        // Polvo de escarcha y fragmentos de permafrost al brotar
        monoliths.forEach((m) => {
          for (let i = 0; i < 7; i++) {
            const pAng = Math.random() * Math.PI * 2;
            const pSpd = 1.4 + Math.random() * 2.6;
            g.particles.push({
              x: m.x,
              y: m.y,
              vx: Math.cos(pAng) * pSpd,
              vy: Math.sin(pAng) * pSpd * squish,
              radius: 1.6 + Math.random() * 2.0,
              color: i % 2 === 0 ? '#00e5ff' : (i % 3 === 0 ? '#ffffff' : '#37474f'),
              alpha: 0.9,
              life: 25 + Math.random() * 15,
              type: i % 2 === 0 ? 'ice' : 'stone_chip',
            });
          }
        });

        // Notificación de texto flotante
        g.floatingTexts.push({
          id: `ft_perma_${now}`,
          x: targetX,
          y: targetY - 45,
          text: isOverloaded ? '❄️🌍 ¡PRISIÓN DE PERMAFROST +50%!' : '❄️🌍 PRISIÓN DE PERMAFROST',
          color: isOverloaded ? '#80d8ff' : '#00e5ff',
          fontSize: isOverloaded ? 16 : 14,
          opacity: 1,
          vy: -1.2,
          life: 42,
        });

        setElementQueue([]);
        return;
      }
      // 2. FUEGO + HIELO (VÓRTICE DE CHOQUE TÉRMICO: ONDA EXPANSIVA DE VAPOR, EMPUJE Y DETONACIÓN REACTIVA)
      else if (recipe.id === 'thermal_shock') {
        const isMaxCharge = isCharged || (chargeRatio !== undefined && chargeRatio >= 0.95);
        const ratio = chargeRatio !== undefined ? Math.max(0, Math.min(1.0, chargeRatio)) : (isCharged ? 1.0 : 0);
        // Daño base al 100% en toque normal, y +50% adicional en sobrecarga (1.5x)
        const chargeDamageBoost = 1.0 + 0.50 * (isMaxCharge ? 1.0 : ratio);

        const baseDmg = recipe.damage + statBonus;
        const finalDmg = Math.round(baseDmg * chargeDamageBoost);
        const maxRadius = isMaxCharge ? 150 : 105;
        const knockbackForce = (recipe.knockback || 8.5) * (isMaxCharge ? 1.35 : 1.0);

        elementalSound.playThermalShockBlast(isMaxCharge);
        g.screenShake = isMaxCharge ? 10 : 6;

        g.thermalVortices.push({
          id: `vortex-${now}-${Math.random()}`,
          x: targetX,
          y: targetY,
          currentRadius: 0,
          maxRadius,
          damage: finalDmg,
          knockback: knockbackForce,
          isCharged: isMaxCharge,
          phase: 'expanding',
          phaseTimer: 0,
          expandDurationMs: 260,
          dissipateDurationMs: 240,
          hasDealtDamage: false,
          hitEnemyIds: [],
          ringSeed: Math.random(),
        });

        // Partículas iniciales de condensación violenta (chispa ígnea y cristales árticos)
        for (let p = 0; p < (isMaxCharge ? 16 : 10); p++) {
          const pAng = Math.random() * Math.PI * 2;
          const pDist = Math.random() * 20;
          const pSpd = 2.0 + Math.random() * 3.5;
          g.particles.push({
            id: `vortex-init-${now}-${p}`,
            x: targetX + Math.cos(pAng) * pDist,
            y: targetY + Math.sin(pAng) * pDist * 0.58,
            vx: Math.cos(pAng) * pSpd,
            vy: Math.sin(pAng) * pSpd * 0.58 - 0.5,
            radius: 1.8 + Math.random() * 1.8,
            color: p % 2 === 0 ? '#ff6d00' : '#80d8ff',
            alpha: 1,
            life: 20,
          });
        }

        g.floatingTexts.push({
          id: `vortex-text-${now}`,
          x: wizard.x,
          y: wizard.y - 25,
          text: isMaxCharge ? '♨️ ¡SOBRECARGA TÉRMICA +50%!' : '♨️ ¡VÓRTICE DE CHOQUE TÉRMICO!',
          color: isMaxCharge ? '#80d8ff' : '#f43f5e',
          fontSize: 14,
          opacity: 1,
          vy: -1.3,
          life: 38,
        });

        setElementQueue([]);
        return;
      }
      // 3. FUEGO + TIERRA (BOMBARDEO VOLCÁNICO: RETARDO, FISURAS MAGMÁTICAS, GÉISERES Y BOMBAS BALÍSTICAS)
      else if (recipe.id === 'magma_eruption') {
        const isMaxCharge = isCharged || (chargeRatio !== undefined && chargeRatio >= 0.95);
        const ratio = chargeRatio !== undefined ? Math.max(0, Math.min(1.0, chargeRatio)) : (isCharged ? 1.0 : 0);
        // Daño base al 100% en toque normal, y +50% adicional si el usuario decide mantener presionado (1.5x)
        const chargeDamageBoost = 1.0 + 0.50 * (isMaxCharge ? 1.0 : ratio);

        const baseDmg = recipe.damage + statBonus;
        const finalDmg = Math.round(baseDmg * chargeDamageBoost);

        elementalSound.playVolcanicRumble(isMaxCharge);
        g.screenShake = isMaxCharge ? 12 : 7;

        // Distribución espacial anclada en el mundo (no giran con el mago)
        const squish = 0.58;
        const fissureRadius = isMaxCharge ? 36 : 30;
        const maxColHeight = isMaxCharge ? 115 : 95;

        // Fissure offsets: 3 en toque normal (tap), 5 si se mantiene cargado
        const fissureConfigs: Array<{ dx: number; dy: number; delayMs: number }> = isMaxCharge
          ? [
              { dx: 0, dy: 0, delayMs: 0 },
              { dx: Math.cos(0.3) * 62, dy: Math.sin(0.3) * 62 * squish, delayMs: 45 },
              { dx: Math.cos(1.8) * 62, dy: Math.sin(1.8) * 62 * squish, delayMs: 90 },
              { dx: Math.cos(3.4) * 62, dy: Math.sin(3.4) * 62 * squish, delayMs: 135 },
              { dx: Math.cos(4.9) * 62, dy: Math.sin(4.9) * 62 * squish, delayMs: 180 },
            ]
          : [
              { dx: 0, dy: 0, delayMs: 0 },
              { dx: Math.cos(2.2) * 48, dy: Math.sin(2.2) * 48 * squish, delayMs: 50 },
              { dx: Math.cos(-2.2) * 48, dy: Math.sin(-2.2) * 48 * squish, delayMs: 100 },
            ];

        const fissures: VolcanicFissureEntity[] = fissureConfigs.map((cfg, fIdx) => ({
          id: `fissure-${now}-${fIdx}-${Math.random()}`,
          x: targetX + cfg.dx,
          y: targetY + cfg.dy,
          radius: fissureRadius,
          delayMs: cfg.delayMs,
          elapsedMs: 0,
          phase: 'warning',
          columnHeight: 0,
          maxColumnHeight: maxColHeight,
          warningDurationMs: 280,
          eruptionDurationMs: 260,
          coolingDurationMs: 240,
          crackAngles: [
            0.4 + (Math.random() - 0.5) * 0.3,
            1.6 + (Math.random() - 0.5) * 0.3,
            2.9 + (Math.random() - 0.5) * 0.3,
            4.2 + (Math.random() - 0.5) * 0.3,
            5.4 + (Math.random() - 0.5) * 0.3,
          ],
          hasDealtDamage: false,
          bombsSpawned: false,
          hitEnemyIds: [],
        }));

        g.volcanicBombardments.push({
          id: `bombardment-${now}-${Math.random()}`,
          centerX: targetX,
          centerY: targetY,
          isCharged: isMaxCharge,
          totalDamage: finalDmg,
          fissures,
          lavaBombs: [],
          finished: false,
        });

        // Partículas iniciales de fractura en el terreno
        for (let p = 0; p < (isMaxCharge ? 16 : 10); p++) {
          const pAng = Math.random() * Math.PI * 2;
          const pDist = Math.random() * (isMaxCharge ? 70 : 50);
          g.particles.push({
            id: `volc-init-${now}-${p}`,
            x: targetX + Math.cos(pAng) * pDist,
            y: targetY + Math.sin(pAng) * pDist * squish,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -1.2 - Math.random() * 2.0,
            radius: 2 + Math.random() * 2,
            color: p % 2 === 0 ? '#ff6d00' : '#fff176',
            alpha: 1,
            life: 24,
          });
        }

        g.floatingTexts.push({
          id: `volc-text-${now}`,
          x: wizard.x,
          y: wizard.y - 25,
          text: isMaxCharge ? '🌋🔥 ¡BOMBARDEO VOLCÁNICO +50%!' : '🌋🔥 ¡BOMBARDEO VOLCÁNICO!',
          color: isMaxCharge ? '#fff176' : '#ff6d00',
          fontSize: 14,
          opacity: 1,
          vy: -1.3,
          life: 38,
        });

        setElementQueue([]);
        return;
      }
      // 4. RAYO + TIERRA (JAULA DE PILARES CONDUCTORES: MONOLITOS, VALLAS VOLTAICAS Y COLAPSO FINAL)
      else if (recipe.id === 'crystal_field') {
        const isOverloaded = isCharged;
        const baseDmg = recipe.damage + statBonus;
        const contactDamage = Math.round(baseDmg * (isOverloaded ? 1.5 : 1.0));
        const implosionDamage = Math.round(contactDamage * 1.7);
        const cageRadius = isOverloaded ? 102 : 68;
        const squish = 0.58;

        g.screenShake = isOverloaded ? 8 : 5;
        elementalSound.playConductivePillarErupt(isOverloaded);

        const pillars: ConductivePillarNode[] = [];
        const segments: { p1Index: number; p2Index: number; isDiagonal?: boolean }[] = [];

        if (!isOverloaded) {
          // 3 Pilares (Triángulo Equilátero)
          pillars.push({
            id: `pillar_${now}_0`,
            x: targetX,
            y: targetY - cageRadius * squish,
            height: 0,
            maxHeight: 62,
            radius: 15,
            crackAngles: [0.3, 2.1, 4.2],
            pulseTimer: 0,
          });
          pillars.push({
            id: `pillar_${now}_1`,
            x: targetX + cageRadius * Math.cos(Math.PI / 6),
            y: targetY + cageRadius * Math.sin(Math.PI / 6) * squish,
            height: 0,
            maxHeight: 62,
            radius: 15,
            crackAngles: [1.1, 3.2, 5.0],
            pulseTimer: 1.2,
          });
          pillars.push({
            id: `pillar_${now}_2`,
            x: targetX - cageRadius * Math.cos(Math.PI / 6),
            y: targetY + cageRadius * Math.sin(Math.PI / 6) * squish,
            height: 0,
            maxHeight: 62,
            radius: 15,
            crackAngles: [0.8, 2.7, 4.6],
            pulseTimer: 2.4,
          });

          segments.push({ p1Index: 0, p2Index: 1 });
          segments.push({ p1Index: 1, p2Index: 2 });
          segments.push({ p1Index: 2, p2Index: 0 });
        } else {
          // 4 Pilares (Rombo / Cuadrilátero expandido con arcos diagonales cruzados)
          pillars.push({
            id: `pillar_${now}_0`,
            x: targetX,
            y: targetY - cageRadius * squish,
            height: 0,
            maxHeight: 74,
            radius: 16,
            crackAngles: [0.2, 1.9, 3.8],
            pulseTimer: 0,
          });
          pillars.push({
            id: `pillar_${now}_1`,
            x: targetX + cageRadius,
            y: targetY,
            height: 0,
            maxHeight: 74,
            radius: 16,
            crackAngles: [0.9, 2.8, 4.9],
            pulseTimer: 0.9,
          });
          pillars.push({
            id: `pillar_${now}_2`,
            x: targetX,
            y: targetY + cageRadius * squish,
            height: 0,
            maxHeight: 74,
            radius: 16,
            crackAngles: [0.5, 2.3, 4.1],
            pulseTimer: 1.8,
          });
          pillars.push({
            id: `pillar_${now}_3`,
            x: targetX - cageRadius,
            y: targetY,
            height: 0,
            maxHeight: 74,
            radius: 16,
            crackAngles: [1.2, 3.1, 5.3],
            pulseTimer: 2.7,
          });

          // Perímetro
          segments.push({ p1Index: 0, p2Index: 1 });
          segments.push({ p1Index: 1, p2Index: 2 });
          segments.push({ p1Index: 2, p2Index: 3 });
          segments.push({ p1Index: 3, p2Index: 0 });
          // Diagonales cruzadas (+50% daño y densidad de arcos)
          segments.push({ p1Index: 0, p2Index: 2, isDiagonal: true });
          segments.push({ p1Index: 1, p2Index: 3, isDiagonal: true });
        }

        // Crear la entidad de Jaula Conductora
        const cageEntity: ConductiveCageEntity = {
          id: `conductive_cage_${now}_${Math.random().toString(36).substring(2, 6)}`,
          centerX: targetX,
          centerY: targetY,
          radius: cageRadius,
          isCharged: isOverloaded,
          pillars,
          segments,
          phase: 'erupting',
          phaseTimer: 0,
          eruptDurationMs: 220,
          igniteDurationMs: 140,
          activeDurationMs: 3200,
          collapseDurationMs: 280,
          tickIntervalMs: 180,
          lastTickPerEnemy: {},
          contactDamage,
          implosionDamage,
          hasImploded: false,
          hitImplosionEnemyIds: [],
          finished: false,
        };

        g.conductiveCages.push(cageEntity);

        // Polvo y esquirlas de roca en la base de cada pilar al brotar
        pillars.forEach((p) => {
          for (let i = 0; i < 8; i++) {
            const pAng = Math.random() * Math.PI * 2;
            const pSpd = 1.2 + Math.random() * 2.5;
            g.particles.push({
              x: p.x,
              y: p.y,
              vx: Math.cos(pAng) * pSpd,
              vy: Math.sin(pAng) * pSpd * squish,
              radius: 1.5 + Math.random() * 2,
              color: i % 2 === 0 ? '#eab308' : '#78716c',
              alpha: 0.9,
              life: 25 + Math.random() * 15,
              type: i % 2 === 0 ? 'spark' : 'stone_chip',
            });
          }
        });

        // Notificación de texto flotante
        g.floatingTexts.push({
          id: `ft_cage_${now}`,
          x: targetX,
          y: targetY - 45,
          text: isOverloaded ? '⚡🏛️ ¡JAULA CONDUCTORA +50%!' : '⚡🏛️ JAULA CONDUCTORA',
          color: isOverloaded ? '#fef08a' : '#eab308',
          fontSize: isOverloaded ? 16 : 14,
          opacity: 1,
          vy: -1.2,
          life: 42,
        });

        setElementQueue([]);
        return;
      }
      // 5. HIELO + RAYO (RAYO CRIOGÉNICO: HAZ PENETRANTE CONTINUO CON CERO ABSOLUTO Y ESPIRALES VOLTAICAS)
      else if (recipe.id === 'cryo_storm') {
        const isOverloaded = isCharged;
        const baseDmg = recipe.damage + statBonus;
        const tickDamage = Math.round(baseDmg * (isOverloaded ? 1.5 : 1.0));

        g.screenShake = isOverloaded ? 6 : 3.5;
        elementalSound.playCryoBeamStart(isOverloaded);

        // Generar la entidad del Rayo Criogénico
        const cryoBeam: CryoBeamEntity = {
          id: `cryo_beam_${now}_${Math.random().toString(36).substring(2, 6)}`,
          aimAngle: aimAngle,
          range: 400,
          width: isOverloaded ? 20 : 14,
          damagePerTick: tickDamage,
          isCharged: isOverloaded,
          durationMs: 1300,
          elapsedMs: 0,
          lastTickMs: 0,
          tickIntervalMs: 150,
          finished: false,
          enemyExposure: {},
          lastEnemyTick: {},
          dissipating: false,
          dissipateTimer: 0,
        };
        g.cryoBeams.push(cryoBeam);

        // Partículas de estallido inicial en el báculo
        const staffX = wizard.x + Math.cos(aimAngle) * 16;
        const staffY = wizard.y - 12 + Math.sin(aimAngle) * 10;
        for (let p = 0; p < (isOverloaded ? 14 : 9); p++) {
          const pAng = aimAngle + (Math.random() - 0.5) * 1.2;
          const pSpd = 2.5 + Math.random() * 4.0;
          g.particles.push({
            id: `cryo-cast-${now}-${p}`,
            x: staffX,
            y: staffY,
            vx: Math.cos(pAng) * pSpd,
            vy: Math.sin(pAng) * pSpd,
            radius: 2 + Math.random() * 2,
            color: p % 2 === 0 ? '#00f0ff' : '#a855f7',
            alpha: 1,
            life: 18,
          });
        }

        g.floatingTexts.push({
          id: `cryo-text-${now}`,
          x: wizard.x,
          y: wizard.y - 25,
          text: isOverloaded ? '❄️⚡ ¡RAYO CRÍO +50%!' : '❄️⚡ ¡RAYO CRIOGÉNICO!',
          color: isOverloaded ? '#00f0ff' : '#7c4dff',
          fontSize: 14,
          opacity: 1,
          vy: -1.3,
          life: 38,
        });

        setElementQueue([]);
        return;
      }
      // 6. FUEGO + RAYO: TORNADO DE PLASMA (Tap vs Carga Opcional +50%)
      else if (recipe.id === 'explosive_overload') {
        const scale = isCharged ? 1.35 : 1.0;
        const radius = Math.round(28 * scale);
        const suctionRadius = Math.round(75 * scale);
        const maxDist = 280;
        const speed = 3.6;

        // Velocidad en el plano isométrico 2.5D (squish 0.58)
        const vx = Math.cos(aimAngle) * speed;
        const vy = Math.sin(aimAngle) * speed * 0.58;

        // Daño: Tap vs Carga Opcional (+50% de daño total)
        // Base tick: ~24 tap, ~36 charged (+ stats)
        // Terminal detonation: ~60 tap, ~90 charged (+ stats)
        const statScaledBonus = Math.floor(statBonus * (isCharged ? 1.5 : 1.0));
        const tickDamage = Math.round((isCharged ? 36 : 24) + statScaledBonus * 0.35);
        const terminalDamage = Math.round((isCharged ? 92 : 60) + statScaledBonus * 0.9);

        // Sonido de ignición de vórtice de plasma y sacudida de cámara
        elementalSound.playPlasmaTornadoLaunch(isCharged);
        g.screenShake = isCharged ? 10 : 6;

        g.plasmaTornadoes.push({
          id: `plasma_tornado_${now}`,
          x: wizard.x + Math.cos(aimAngle) * 20,
          y: wizard.y + Math.sin(aimAngle) * 20 * 0.58,
          vx,
          vy,
          startX: wizard.x,
          startY: wizard.y,
          travelDistance: 0,
          maxDistance: maxDist,
          isCharged,
          scale,
          radius,
          suctionRadius,
          phase: 'moving',
          phaseTimer: 0,
          movingDurationMs: 2400,
          collapseDurationMs: 140,
          detonateDurationMs: 260,
          tickIntervalMs: 200,
          lastTickPerEnemy: {},
          tickDamage,
          terminalDamage,
          hasDetonated: false,
          hitDetonationEnemyIds: [],
          swirlAngle: 0,
          finished: false,
        });

        // Partículas iniciales de lanzamiento
        for (let p = 0; p < (isCharged ? 18 : 12); p++) {
          const pAng = aimAngle + (Math.random() - 0.5) * 1.2;
          const pSpd = 2.0 + Math.random() * 4.0;
          g.particles.push({
            id: `plasma_launch_${now}_${p}`,
            x: wizard.x + Math.cos(aimAngle) * 16,
            y: wizard.y + Math.sin(aimAngle) * 16 * 0.58,
            vx: Math.cos(pAng) * pSpd,
            vy: Math.sin(pAng) * pSpd * 0.58,
            radius: 1.8 + Math.random() * 2.0,
            color: p % 2 === 0 ? '#00e5ff' : '#ff6d00',
            alpha: 1,
            life: 18,
          });
        }

        // Mensaje flotante al lanzar con sobrecarga
        if (isCharged) {
          g.floatingTexts.push({
            id: `tornado_charged_${now}`,
            x: wizard.x,
            y: wizard.y - 28,
            text: '🌪️⚡ ¡TORNADO DE PLASMA +50%!',
            color: '#00e5ff',
            fontSize: 14,
            opacity: 1,
            vy: -1.2,
            life: 35,
          });
        }

        setElementQueue([]);
        return;
      }
      // 6.5 LLUVIA DEL INFIERNO (FUEGO + FUEGO + FUEGO: Salva secuencial de meteoritos balísticos y cráteres de magma)
      else if (recipe.id === 'hell_rain') {
        const meteorCount = isCharged ? 6 : 4;
        const areaRadius = isCharged ? 190 : 150;
        const baseDmg = recipe.damage + statBonus;
        const chargeMultiplierTotal = isCharged ? 1.5 : 1.0;
        const directDmg = Math.round(baseDmg * 0.65 * chargeMultiplierTotal);
        const colossalDmg = Math.round(baseDmg * 1.25 * chargeMultiplierTotal);

        const meteors: HellMeteorInstance[] = [];
        for (let i = 0; i < meteorCount; i++) {
          const isColossal = isCharged && i === meteorCount - 1;
          let mTargetX = targetX;
          let mTargetY = targetY;

          if (!isColossal) {
            // Distribución áurea radial alrededor del centro de impacto
            const mAng = i * 2.39996 + (Math.random() - 0.5) * 0.6;
            const mDist = (0.2 + (i / meteorCount) * 0.7) * areaRadius;
            mTargetX = targetX + Math.cos(mAng) * mDist;
            mTargetY = targetY + Math.sin(mAng) * mDist * 0.58;
          }

          // Posición de inicio en el cielo superior izquierdo (trayectoria isométrica diagonal)
          const startOffsetX = -135 - (Math.random() - 0.5) * 30;
          const startOffsetY = -300 - (Math.random() - 0.5) * 40;

          meteors.push({
            id: `hell_meteor_${now}_${i}`,
            targetX: mTargetX,
            targetY: mTargetY,
            startX: mTargetX + startOffsetX,
            startY: mTargetY + startOffsetY,
            currentX: mTargetX + startOffsetX,
            currentY: mTargetY + startOffsetY,
            delayMs: isColossal ? 880 : i * (isCharged ? 160 : 180),
            flightProgress: 0,
            flightDurationMs: isColossal ? 240 : 210,
            isColossal,
            impactRadius: isColossal ? 76 : 42,
            impactDamage: isColossal ? colossalDmg : directDmg,
            hasImpacted: false,
            hitEnemyIds: [],
          });
        }

        g.hellRains.push({
          id: `hell_rain_${now}`,
          centerX: targetX,
          centerY: targetY,
          areaRadius,
          isCharged,
          meteors,
          craters: [],
          elapsedMs: 0,
          finished: false,
        });

        elementalSound.playHellRainCast(isCharged);
        g.screenShake = isCharged ? 9 : 5;

        // Partículas ígneas iniciales de conjuración
        for (let p = 0; p < (isCharged ? 22 : 14); p++) {
          const pAng = Math.random() * Math.PI * 2;
          const pSpd = 2.0 + Math.random() * 3.8;
          g.particles.push({
            id: `hell_cast_${now}_${p}`,
            x: wizard.x,
            y: wizard.y - 12,
            vx: Math.cos(pAng) * pSpd,
            vy: Math.sin(pAng) * pSpd * 0.58 - 1.5,
            radius: 1.8 + Math.random() * 2.2,
            color: p % 2 === 0 ? '#ff3d00' : '#ffd600',
            alpha: 1,
            life: 20,
          });
        }

        if (isCharged) {
          g.floatingTexts.push({
            id: `hell_charged_${now}`,
            x: wizard.x,
            y: wizard.y - 28,
            text: '☄️🔥 ¡FURIA CÓSMICA +50%!',
            color: '#ffd600',
            fontSize: 14,
            opacity: 1,
            vy: -1.3,
            life: 38,
          });
        }

        setElementQueue([]);
        return;
      }
      // 6.6 TORMENTA CELESTIAL (RAYO + RAYO + RAYO: Tempestad fulminante, relámpagos verticales y charcos de estática)
      else if (recipe.id === 'celestial_storm') {
        const strikeCount = isCharged ? 6 : 4;
        const areaRadius = isCharged ? 195 : 155;
        const baseDmg = recipe.damage + statBonus;
        const chargeMultiplierTotal = isCharged ? 1.5 : 1.0;
        const directDmg = Math.round(baseDmg * 0.7 * chargeMultiplierTotal);
        const colossalDmg = Math.round(baseDmg * 1.35 * chargeMultiplierTotal);

        // Identificar enemigos prioritarios dentro de la zona de la tormenta para centrar los rayos
        const enemiesInArea = g.enemyManager.enemies.filter((e) => {
          if (e.hp <= 0) return false;
          const edist = Math.hypot(e.x - targetX, (e.y - targetY) / 0.58);
          return edist <= areaRadius * 1.05;
        });

        const strikes: CelestialLightningStrikeInstance[] = [];
        for (let i = 0; i < strikeCount; i++) {
          const isColossal = isCharged && i === strikeCount - 1;
          let sTargetX = targetX;
          let sTargetY = targetY;

          if (isColossal) {
            // El rayo colosal final impacta SIEMPRE en el epicentro exacto de la tormenta
            sTargetX = targetX;
            sTargetY = targetY;
          } else if (i < enemiesInArea.length) {
            // Asignar el relámpago directamente sobre un enemigo prioritario dentro del área
            sTargetX = enemiesInArea[i].x;
            sTargetY = enemiesInArea[i].y;
          } else {
            // Si hay menos enemigos que rayos, distribuir radialmente alrededor del centro
            const sAng = i * 2.39996 + (Math.random() - 0.5) * 0.5;
            const sDist = (0.2 + ((i % 4) / 4) * 0.7) * areaRadius;
            sTargetX = targetX + Math.cos(sAng) * sDist;
            sTargetY = targetY + Math.sin(sAng) * sDist * 0.58;
          }

          strikes.push({
            id: `celestial_strike_${now}_${i}`,
            targetX: sTargetX,
            targetY: sTargetY,
            delayMs: isColossal ? 540 : i * (isCharged ? 100 : 120),
            warningDurationMs: 140,
            strikeDurationMs: 80,
            strikeProgress: 0,
            isColossal,
            impactRadius: isColossal ? 74 : 38,
            impactDamage: isColossal ? colossalDmg : directDmg,
            hasStruck: false,
            boltSegments: [],
          });
        }

        g.celestialStorms.push({
          id: `celestial_storm_${now}`,
          centerX: targetX,
          centerY: targetY,
          areaRadius,
          isCharged,
          strikes,
          puddles: [],
          elapsedMs: 0,
          terminalDetonated: false,
          finished: false,
        });

        elementalSound.playCelestialStormCast(isCharged);
        g.screenShake = isCharged ? 8 : 4;

        // Partículas iniciales de ionización ascendente
        for (let p = 0; p < (isCharged ? 24 : 14); p++) {
          const pAng = Math.random() * Math.PI * 2;
          const pSpd = 2.2 + Math.random() * 3.5;
          g.particles.push({
            id: `celestial_cast_${now}_${p}`,
            x: wizard.x,
            y: wizard.y - 10,
            vx: Math.cos(pAng) * pSpd,
            vy: Math.sin(pAng) * pSpd * 0.58 - 1.8,
            radius: 1.6 + Math.random() * 2.0,
            color: p % 3 === 0 ? '#ffffff' : (p % 3 === 1 ? '#00f0ff' : '#7c4dff'),
            alpha: 1,
            life: 18,
          });
        }

        if (isCharged) {
          g.floatingTexts.push({
            id: `celestial_charged_${now}`,
            x: wizard.x,
            y: wizard.y - 28,
            text: '⚡🌩️ ¡FURIA DE LA TEMPESTAD +50%!',
            color: '#00f0ff',
            fontSize: 14,
            opacity: 1,
            vy: -1.3,
            life: 38,
          });
        }

        setElementQueue([]);
        return;
      }
      // 6.7 GLACIAR DEVASTADOR (HIELO + HIELO + HIELO: Ventisca masiva, lluvia de monolitos y erupción radial congelante)
      else if (recipe.id === 'devastating_glacier') {
        const monolithCount = isCharged ? 6 : 4;
        const areaRadius = isCharged ? 210 : 155; // +35% de radio en modo cargado
        const baseDmg = recipe.damage + statBonus;
        const chargeMultiplierTotal = isCharged ? 1.5 : 1.0;
        const monolithDmg = Math.round(baseDmg * 0.75 * chargeMultiplierTotal);
        const eruptionDmg = Math.round(baseDmg * 1.45 * chargeMultiplierTotal);

        // Identificar enemigos prioritarios dentro de la ventisca para fijar el impacto de los monolitos
        const enemiesInArea = g.enemyManager.enemies.filter((e) => {
          if (e.hp <= 0) return false;
          const edist = Math.hypot(e.x - targetX, (e.y - targetY) / 0.58);
          return edist <= areaRadius * 1.05;
        });

        const monoliths: IceMonolithInstance[] = [];
        for (let i = 0; i < monolithCount; i++) {
          let mTargetX = targetX;
          let mTargetY = targetY;

          if (i < enemiesInArea.length) {
            // Posicionar sobre enemigos dentro del cuadrante
            mTargetX = enemiesInArea[i].x;
            mTargetY = enemiesInArea[i].y;
          } else {
            // Distribuir en espiral áurea radial alrededor del centro
            const mAng = i * 2.39996 + (Math.random() - 0.5) * 0.5;
            const mDist = (0.2 + ((i % 4) / 4) * 0.68) * areaRadius;
            mTargetX = targetX + Math.cos(mAng) * mDist;
            mTargetY = targetY + Math.sin(mAng) * mDist * 0.58;
          }

          // Inicio en el cielo superior izquierdo en proyección isométrica 2.5D
          const startOffsetX = -110 - (Math.random() - 0.5) * 24;
          const startOffsetY = -280 - (Math.random() - 0.5) * 35;

          monoliths.push({
            id: `glacier_monolith_${now}_${i}`,
            targetX: mTargetX,
            targetY: mTargetY,
            startX: mTargetX + startOffsetX,
            startY: mTargetY + startOffsetY,
            currentX: mTargetX + startOffsetX,
            currentY: mTargetY + startOffsetY,
            delayMs: i * (isCharged ? 200 : 230),
            flightDurationMs: 220,
            flightProgress: 0,
            impactRadius: 40,
            impactDamage: monolithDmg,
            hasImpacted: false,
            shatterProgress: 0,
          });
        }

        // Pre-generar agujas y cristales de la erupción radial (en 2 o 3 anillos concéntricos)
        const spikes: RadialIceSpike[] = [];
        const ringSteps = isCharged ? [0.35, 0.65, 0.95] : [0.45, 0.9];
        ringSteps.forEach((ringRatio, rIdx) => {
          const spikeCountOnRing = (rIdx + 1) * (isCharged ? 8 : 6);
          for (let sp = 0; sp < spikeCountOnRing; sp++) {
            const spAng = (sp * Math.PI * 2) / spikeCountOnRing + (rIdx * 0.35);
            spikes.push({
              angle: spAng,
              dist: ringRatio * areaRadius,
              height: 0,
              maxHeight: (38 + Math.random() * 24) * (isCharged ? 1.3 : 1.0),
              width: (18 + Math.random() * 8) * (isCharged ? 1.25 : 1.0),
              eruptProgress: 0,
            });
          }
        });

        g.devastatingGlaciers.push({
          id: `devastating_glacier_${now}`,
          centerX: targetX,
          centerY: targetY,
          areaRadius,
          isCharged,
          monoliths,
          elapsedMs: 0,
          totalDurationMs: isCharged ? 2800 : 2500,
          eruptionTriggered: false,
          eruptionProgress: 0,
          eruptionDurationMs: 450,
          eruptionMaxRadius: areaRadius,
          eruptionDamage: eruptionDmg,
          eruptionHitEnemyIds: [],
          spikes,
          finished: false,
        });

        elementalSound.playGlacierCast(isCharged);
        g.screenShake = isCharged ? 7 : 4;

        // Partículas de ventisca ártica y copos de nieve
        for (let p = 0; p < (isCharged ? 24 : 14); p++) {
          const pAng = Math.random() * Math.PI * 2;
          const pSpd = 2.0 + Math.random() * 3.2;
          g.particles.push({
            id: `glacier_cast_${now}_${p}`,
            x: wizard.x,
            y: wizard.y - 10,
            vx: Math.cos(pAng) * pSpd,
            vy: Math.sin(pAng) * pSpd * 0.58 - 1.2,
            radius: 1.5 + Math.random() * 1.8,
            color: p % 2 === 0 ? '#ffffff' : '#00e5ff',
            alpha: 1,
            life: 20,
          });
        }

        if (isCharged) {
          g.floatingTexts.push({
            id: `glacier_charged_${now}`,
            x: wizard.x,
            y: wizard.y - 28,
            text: '🏔️❄️ ¡ERA DE HIELO +50%!',
            color: '#00e5ff',
            fontSize: 14,
            opacity: 1,
            vy: -1.3,
            life: 38,
          });
        }

        setElementQueue([]);
        return;
      }
      // 6.8 BARRERA TELÚRICA (TIERRA + TIERRA + TIERRA: 3 Rocas orbitales defensivas y destructivas)
      else if (recipe.id === 'telluric_barrier') {
        const baseDmg = recipe.damage + statBonus;
        const damagePerRock = isCharged ? Math.floor(baseDmg * 1.5) : baseDmg;
        const rockRadius = isCharged ? 18 : 15;
        const hitPointsPerRock = isCharged ? 2 : 1;

        const rocks: TelluricRockInstance[] = [0, 1, 2].map((idx) => {
          const ang = (idx * Math.PI * 2) / 3;
          return {
            id: `telluric_rock_${now}_${idx}`,
            baseAngleOffset: ang,
            currentAngleOffset: ang,
            currentAngle: ang,
            x: wizard.x + Math.cos(ang) * 62,
            y: wizard.y + Math.sin(ang) * 36,
            height: 19,
            radius: rockRadius,
            hitPoints: hitPointsPerRock,
            maxHitPoints: hitPointsPerRock,
            destroyed: false,
            facetSeed: Math.random() * 100 + idx * 37.1,
            rotationAngle: Math.random() * Math.PI * 2,
            pulseTimer: Math.random() * 10,
            hitFlash: 0,
          };
        });

        // Reemplaza o renueva cualquier barrera previa limpiamente
        g.telluricBarriers = [{
          id: `telluric_barrier_${now}`,
          centerX: wizard.x,
          centerY: wizard.y,
          isCharged,
          rocks,
          orbitRadiusX: 62,
          orbitRadiusY: 36,
          orbitAngle: 0,
          rotationSpeed: 2.3, // ~2.3 rad/s
          damagePerRock,
          knockback: recipe.knockback || 7.0,
          durationMs: 20000, // 20.0s completos
          elapsedMs: 0,
          finished: false,
          realignSpeed: 0.12,
        }];

        elementalSound.playTelluricCast(isCharged);
        g.screenShake = isCharged ? 6 : 4;

        // Partículas de erupción telúrica
        for (let i = 0; i < (isCharged ? 24 : 16); i++) {
          const pAng = Math.random() * Math.PI * 2;
          const pDist = 15 + Math.random() * 35;
          g.particles.push({
            id: `telluric_burst_${now}_${i}`,
            x: wizard.x + Math.cos(pAng) * pDist,
            y: wizard.y + Math.sin(pAng) * pDist * 0.58,
            vx: (Math.random() - 0.5) * 2.8,
            vy: -1.8 - Math.random() * 2.5,
            radius: 1.5 + Math.random() * 2.5,
            color: i % 2 === 0 ? '#78350f' : (isCharged ? '#fde047' : '#f59e0b'),
            alpha: 1,
            life: 25,
            type: 'stone_chip',
          });
        }

        if (isCharged) {
          g.floatingTexts.push({
            id: `txt_telluric_charge_${now}`,
            x: wizard.x,
            y: wizard.y - 32,
            text: '🛡️🌍 ¡DENSIDAD TELÚRICA +50%!',
            color: '#f59e0b',
            fontSize: 14,
            opacity: 1,
            vy: -1.3,
            life: 38,
          });
        }

        setElementQueue([]);
        return;
      }
      // 6.9 VOLCÁN DE OBSIDIANA (FUEGO + HIELO + TIERRA: Erupción Piroclástica, Vitrificación y Cuchillas Cortantes)
      else if (recipe.id === 'obsidian_volcano') {
        const baseDmg = recipe.damage + statBonus;
        const eruptionDamage = isCharged ? Math.floor(baseDmg * 1.5) : baseDmg;
        const sliceDamagePerTick = isCharged ? Math.floor((baseDmg * 0.22) * 1.5) : Math.floor(baseDmg * 0.22);
        const areaRadius = isCharged ? 168 : 122;
        const bladeCount = isCharged ? 10 : 7;

        // Distribución angular y radial de las cuchillas monumentales de obsidiana
        const blades: ObsidianBladeInstance[] = [];
        for (let b = 0; b < bladeCount; b++) {
          const bAngle = (b * Math.PI * 2) / bladeCount + (Math.random() - 0.5) * 0.5;
          const bDist = (0.2 + (b / bladeCount) * 0.65) * areaRadius;
          const relX = Math.cos(bAngle) * bDist;
          const relY = Math.sin(bAngle) * (bDist * 0.58);
          const bladeHeight = (isCharged ? 54 : 38) + Math.random() * (isCharged ? 22 : 16);
          const bladeWidth = (isCharged ? 22 : 16) + Math.random() * (isCharged ? 8 : 6);
          const tiltAngle = (Math.random() - 0.5) * 0.42;

          blades.push({
            id: `obs_blade_${now}_${b}`,
            relX,
            relY,
            x: targetX + relX,
            y: targetY + relY,
            height: bladeHeight,
            width: bladeWidth,
            tiltAngle,
            growthProgress: 0,
            shatterProgress: 0,
            shinePhase: Math.random() * Math.PI * 2,
            facetSeed: Math.random() * 100 + b * 23.7,
          });
        }

        // Fisuras sísmicas radiantes de magma en el suelo
        const fissures: Array<{ angle: number; length: number; width: number; glowAlpha: number }> = [];
        const fissureCount = isCharged ? 6 : 5;
        for (let f = 0; f < fissureCount; f++) {
          const fAngle = (f * Math.PI * 2) / fissureCount + (Math.random() - 0.5) * 0.4;
          fissures.push({
            angle: fAngle,
            length: areaRadius * (0.65 + Math.random() * 0.28),
            width: isCharged ? 3.6 : 2.6,
            glowAlpha: 0.85,
          });
        }

        g.obsidianVolcanoes.push({
          id: `obsidian_volcano_${now}`,
          centerX: targetX,
          centerY: targetY,
          areaRadius,
          isCharged,
          phase: 'fracture',
          phaseTimer: 0,
          elapsedMs: 0,
          totalDurationMs: 4800,
          eruptionDamage,
          eruptionDealt: false,
          eruptionProgress: 0,
          sliceDamagePerTick,
          tickIntervalMs: 250,
          tickTimer: 0,
          slowFactor: 0.4,
          blades,
          fissures,
          shatterPlayed: false,
          finished: false,
        });

        elementalSound.playObsidianCast(isCharged);
        g.screenShake = isCharged ? 5.0 : 3.5;

        // Vapor y chispas iniciales en la fractura del terreno
        for (let i = 0; i < (isCharged ? 20 : 14); i++) {
          const pAng = Math.random() * Math.PI * 2;
          const pDist = Math.random() * areaRadius * 0.5;
          g.particles.push({
            id: `obs_fissure_steam_${now}_${i}`,
            x: targetX + Math.cos(pAng) * pDist,
            y: targetY + Math.sin(pAng) * pDist * 0.58,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -2.0 - Math.random() * 2.2,
            radius: 1.8 + Math.random() * 2.2,
            color: i % 2 === 0 ? '#ffedd5' : '#e0f2fe',
            alpha: 0.85,
            life: 20,
            type: 'smoke',
          });
        }

        if (isCharged) {
          g.floatingTexts.push({
            id: `txt_obs_charge_${now}`,
            x: wizard.x,
            y: wizard.y - 32,
            text: '🌋🖤 ¡FUSIÓN VÍTREA +50%!',
            color: '#f43f5e',
            fontSize: 14,
            opacity: 1,
            vy: -1.3,
            life: 38,
          });
        }

        setElementQueue([]);
        return;
      }
      // 6.10 PRISIÓN CONDUCTORA (RAYO + HIELO + TIERRA: Pilares Criotécnicos, Malla de Alto Voltaje e Implosión Reactiva)
      else if (recipe.id === 'conductive_prison') {
        const baseDmg = recipe.damage + statBonus;
        const contactDamagePerTick = isCharged ? Math.floor((baseDmg * 0.2) * 1.5) : Math.floor(baseDmg * 0.2);
        const implosionDamage = isCharged ? Math.floor(baseDmg * 1.5) : baseDmg;
        const radius = isCharged ? 122 : 88;
        const implosionRadius = isCharged ? 190 : 95; // Radio duplicado al cargar
        const pillarCount = isCharged ? 6 : 4;
        const pillarHp = isCharged ? 210 : 140;

        // Distribución regular de los pilares criotécnicos
        const pillars: ConductivePrisonPillarNode[] = [];
        for (let i = 0; i < pillarCount; i++) {
          const ang = (i * Math.PI * 2) / pillarCount + (isCharged ? 0 : Math.PI / 4);
          const px = targetX + Math.cos(ang) * radius;
          const py = targetY + Math.sin(ang) * radius * 0.58;

          pillars.push({
            id: `cp_pillar_${now}_${i}`,
            x: px,
            y: py,
            height: 0,
            maxHeight: isCharged ? 78 : 65,
            radius: isCharged ? 18 : 15,
            hp: pillarHp,
            maxHp: pillarHp,
            hitFlash: 0,
            destroyed: false,
            facetSeed: Math.random() * 100 + i * 29.4,
          });
        }

        g.conductivePrisons.push({
          id: `conductive_prison_${now}`,
          centerX: targetX,
          centerY: targetY,
          radius,
          isCharged,
          phase: 'fracture',
          phaseTimer: 0,
          totalDurationMs: 4000,
          elapsedMs: 0,
          pillars,
          eruptDurationMs: 220,
          activeDurationMs: 3500,
          implosionDurationMs: 260,
          contactDamagePerTick,
          implosionDamage,
          implosionRadius,
          tickIntervalMs: 200,
          tickTimer: 0,
          slowFactor: 0.35,
          hasImploded: false,
          hitImplosionEnemyIds: [],
          finished: false,
        });

        elementalSound.playConductivePrisonCast(isCharged);
        g.screenShake = isCharged ? 5.5 : 4.0;

        // Partículas de escarcha y chispas eléctricas en el suelo
        for (let i = 0; i < (isCharged ? 22 : 16); i++) {
          const pAng = Math.random() * Math.PI * 2;
          const pDist = Math.random() * radius * 0.7;
          g.particles.push({
            id: `cp_spark_${now}_${i}`,
            x: targetX + Math.cos(pAng) * pDist,
            y: targetY + Math.sin(pAng) * pDist * 0.58,
            vx: (Math.random() - 0.5) * 2.2,
            vy: -1.5 - Math.random() * 2.5,
            radius: 1.4 + Math.random() * 1.8,
            color: i % 2 === 0 ? '#00e5ff' : '#b388ff',
            alpha: 1,
            life: 20,
            type: i % 2 === 0 ? 'ice' : 'spark',
          });
        }

        if (isCharged) {
          g.floatingTexts.push({
            id: `txt_cp_charge_${now}`,
            x: wizard.x,
            y: wizard.y - 32,
            text: '⚡❄️🏛️ ¡SOBRECARGA CRIOCONDUCTORA +50%!',
            color: '#b388ff',
            fontSize: 14,
            opacity: 1,
            vy: -1.3,
            life: 38,
          });
        }

        setElementQueue([]);
        return;
      }
      // 6.11 NÚCLEO DE SOBRECARGA (FUEGO + RAYO + TIERRA: Artefacto Desplegable Inestable, Acumulación Temporal y Detonación Masiva)
      else if (recipe.id === 'overload_core') {
        // Si se invocó cargado: Inicia directamente en Nivel 2 (Masa Inestable, elapsedMs = 1500) con 3 fragmentos orbitales
        const startLvl: OverloadCoreLevel = isCharged ? 2 : 1;
        const initialElapsedMs = isCharged ? 1500 : 0;
        const initialDetR = isCharged ? 157 : 105;
        const initialPulseR = isCharged ? 95 : 70;
        const initialInterval = isCharged ? 350 : 500;

        const initialFrags = [];
        if (isCharged) {
          for (let f = 0; f < 3; f++) {
            initialFrags.push({
              id: `frag-${f}`,
              orbitAngle: (f * Math.PI * 2) / 3,
              orbitRadius: 36,
              orbitSpeed: 3.5,
              height: 12,
              size: 5,
              roughPoints: [
                { x: -4, y: -2 },
                { x: 0, y: -5 },
                { x: 4, y: -2 },
                { x: 3, y: 4 },
                { x: -3, y: 3 },
              ],
              burnGlow: 0.8,
            });
          }
        }

        g.overloadCores.push({
          id: `overload_core_${now}`,
          startX: wizard.x,
          startY: wizard.y,
          targetX,
          targetY,
          currentX: wizard.x,
          currentY: wizard.y,
          height: 10,
          phase: 'launching',
          phaseTimer: 0,
          elapsedMs: initialElapsedMs,
          isCharged,
          level: startLvl,
          lastLevel: startLvl,
          pulseTimer: 0,
          pulseInterval: initialInterval,
          pulseCount: 0,
          detonationRadius: initialDetR,
          pulseRadius: initialPulseR,
          rotationAngle: 0,
          vibrationOffset: { x: 0, y: 0 },
          rockFragments: initialFrags,
          finished: false,
        });

        elementalSound.playOverloadCoreDeploy(isCharged);
        g.screenShake = isCharged ? 5.0 : 3.5;

        if (isCharged) {
          g.floatingTexts.push({
            id: `txt_oc_charge_${now}`,
            x: wizard.x,
            y: wizard.y - 32,
            text: '💣⚡🌋 ¡DESPLIEGUE EN NIVEL 2 (+50% DAÑO)!',
            color: '#ffd600',
            fontSize: 14,
            opacity: 1,
            vy: -1.3,
            life: 38,
          });
        }

        setElementQueue([]);
        return;
      }
      // 6.12 TORMENTA DE PLASMA GLACIAL (FUEGO + RAYO + HIELO: Vórtice Móvil Tri-Elemental, Congelación, Encadenamiento Voltaico e Implosión)
      else if (recipe.id === 'glacial_plasma_storm') {
        const speed = 190;
        const vx = Math.cos(aimAngle) * speed;
        const vy = Math.sin(aimAngle) * speed * 0.58;
        const scale = isCharged ? 1.35 : 1.0;
        const radius = Math.round(70 * scale);
        const implosionRadius = Math.round(125 * scale);
        const statBonus = Math.floor(player.stats.attack * 0.35 + player.stats.knowledge * 0.35);
        const baseDmg = recipe.damage + statBonus;
        const transitDamagePerTick = isCharged ? Math.floor((baseDmg * 0.25) * 1.5) : Math.floor(baseDmg * 0.25);
        const finisherDamage = isCharged ? Math.floor((baseDmg * 0.75) * 1.5) : Math.floor(baseDmg * 0.75);

        g.glacialPlasmaStorms.push({
          id: `glacial_plasma_${now}`,
          x: wizard.x + Math.cos(aimAngle) * 22,
          y: wizard.y - 6 + Math.sin(aimAngle) * 22 * 0.58,
          vx,
          vy,
          moveAngle: aimAngle,
          startX: wizard.x,
          startY: wizard.y,
          travelDistance: 0,
          maxDistance: 290,
          isCharged,
          scale,
          radius,
          implosionRadius,
          phase: 'moving',
          phaseTimer: 0,
          elapsedMs: 0,
          movingDurationMs: 2300,
          implosionDurationMs: 180,
          detonationDurationMs: 280,
          tickIntervalMs: 200,
          lastTickPerEnemy: {},
          lastArcTime: 0,
          transitDamagePerTick,
          finisherDamage,
          hasDetonated: false,
          swirlAngle: 0,
          frostLayerAngle: 0,
          plasmaCoreAngle: 0,
          arcs: [],
          finished: false,
        });

        elementalSound.playGlacialPlasmaStormLaunch(isCharged);
        g.screenShake = isCharged ? 6.0 : 4.0;

        if (isCharged) {
          g.floatingTexts.push({
            id: `txt_gps_charge_${now}`,
            x: wizard.x,
            y: wizard.y - 32,
            text: '🌪️❄️⚡ ¡SOBRECARGA TRI-ELEMENTAL +50%!',
            color: '#00e5ff',
            fontSize: 14,
            opacity: 1,
            vy: -1.3,
            life: 38,
          });
        }

        setElementQueue([]);
        return;
      }
      // 7. CATACLISMO ELEMENTAL (FUEGO + RAYO + HIELO + TIERRA: Habilidad Definitiva Tetra-Elemental)
      else if (recipe.id === 'elemental_cataclysm') {
        const isMaxCharge = isCharged || (chargeRatio !== undefined && chargeRatio >= 0.95);
        const catRadius = isMaxCharge ? 340 : 240;
        const multiplier = isMaxCharge ? 1.5 : 1.0;
        const statBonus = Math.floor(player.stats.attack * 0.4 + player.stats.knowledge * 0.4);

        // Canalización inicial: Durante los primeros 300 ms de lanzamiento, el personaje canaliza quieto (vulnerable táctica)
        wizard.channelLockTimer = 18; // 18 frames a 60 FPS = 300 ms
        wizard.isMoving = false;

        // Sonidos de conjuración inicial y Fase 1 (Tierra)
        elementalSound.playCataclysmCast(isMaxCharge);
        elementalSound.playCataclysmPhase1Earth(isMaxCharge);
        g.screenShake = isMaxCharge ? 20 : 16;

        // Generar 4 fisuras diagonales en perspectiva isométrica con segmentos fracturados y placas de roca
        const fissureAngles = [
          Math.PI * 0.25 + (Math.random() - 0.5) * 0.18,
          Math.PI * 0.75 + (Math.random() - 0.5) * 0.18,
          Math.PI * 1.25 + (Math.random() - 0.5) * 0.18,
          Math.PI * 1.75 + (Math.random() - 0.5) * 0.18,
        ];

        const fissures: CataclysmFissure[] = [];
        const magmaCols: Array<{ x: number; y: number; height: number; maxHeight: number; width: number }> = [];

        fissureAngles.forEach((ang) => {
          const segCount = isMaxCharge ? 7 : 5;
          const fissureLen = catRadius * (0.85 + Math.random() * 0.15);
          const segLen = fissureLen / segCount;
          const segments: Array<{ x: number; y: number }> = [{ x: targetX, y: targetY }];
          const slabs: CataclysmRockSlab[] = [];

          let currX = targetX;
          let currY = targetY;

          for (let s = 1; s <= segCount; s++) {
            const jitterAng = ang + (Math.random() - 0.5) * 0.35;
            currX += Math.cos(jitterAng) * segLen;
            currY += Math.sin(jitterAng) * segLen * 0.58;
            segments.push({ x: currX, y: currY });

            // Placas de roca tectónicas que emergen en cada segmento
            if (s >= 2 && Math.random() < 0.85) {
              const relX = currX - targetX;
              const relY = currY - targetY;
              const slabWidth = 14 + Math.random() * 12;
              const slabHeight = 10 + Math.random() * 8;
              const maxElev = (isMaxCharge ? 26 : 20) + Math.random() * 6;
              slabs.push({
                relX,
                relY,
                width: slabWidth,
                height: slabHeight,
                maxElevation: maxElev,
                elevation: 0,
                angle: jitterAng,
                tilt: (Math.random() - 0.5) * 0.4,
                color: Math.random() < 0.5 ? '#3e2723' : '#263238',
              });

              // Columnas de magma en las fisuras para Fase 2
              magmaCols.push({
                x: currX,
                y: currY,
                height: 0,
                maxHeight: (isMaxCharge ? 90 : 65) + Math.random() * 20,
                width: slabWidth * 0.85,
              });
            }
          }

          fissures.push({
            angle: ang,
            length: fissureLen,
            segments,
            slabs,
          });
        });

        g.elementalCataclysms.push({
          id: `cataclysm_${now}`,
          x: targetX,
          y: targetY,
          isCharged: isMaxCharge,
          radius: catRadius,
          phase: 'earth_fissure',
          phaseTimer: 0,
          elapsedMs: 0,
          totalDurationMs: 2800,
          earthDurationMs: 600,
          fireDurationMs: 600,
          iceDurationMs: 600,
          lightningDurationMs: 1000,
          totalBaseDamage: recipe.damage,
          chargeMultiplier: multiplier,
          statBonus,
          earthHitIds: new Set<string>(),
          fireLastTickTime: 0,
          fireTickCount: 0,
          iceHitIds: new Set<string>(),
          lightningHitIds: new Set<string>(),
          fissures,
          magmaColumns: magmaCols,
          magmaEruptionProgress: 0,
          iceWaveProgress: 0,
          lightningStrikeProgress: 0,
          shockwaveRadius: 0,
          shockwaveMaxRadius: catRadius,
          shockwaveAlpha: 1,
          finished: false,
          hasDetonated: false,
        });

        // Partículas sutiles de conjuración tetra-elemental
        for (let p = 0; p < 12; p++) {
          const pAng = (p * Math.PI * 2) / 12;
          const pCol = p % 4 === 0 ? '#ff6d00' : (p % 4 === 1 ? '#ffd600' : (p % 4 === 2 ? '#00e5ff' : '#ffb300'));
          g.particles.push({
            id: `cataclysm_cast_${now}_${p}`,
            x: targetX,
            y: targetY,
            vx: Math.cos(pAng) * 3.5,
            vy: Math.sin(pAng) * 3.5 * 0.58,
            radius: 3,
            color: pCol,
            alpha: 1,
            life: 25,
          });
        }

        setElementQueue([]);
        return;
      }
      // PILAR ÍGNEO / IGNICIÓN A DISTANCIA (FUEGO + FUEGO):
      // Detonación telegrafiada a distancia en dirección del apuntado o bajo el enemigo más próximo
      else if (recipe.id === 'fire_inferno') {
        const crackAngles = [
          0.2 + (Math.random() - 0.5) * 0.2,
          1.15 + (Math.random() - 0.5) * 0.2,
          2.25 + (Math.random() - 0.5) * 0.2,
          3.35 + (Math.random() - 0.5) * 0.2,
          4.45 + (Math.random() - 0.5) * 0.2,
          5.55 + (Math.random() - 0.5) * 0.2,
        ];
        const statBonus = Math.floor(player.stats.attack * 0.4 + player.stats.knowledge * 0.4);
        const pillarRadius = isCharged ? 65 : 55; // Radio táctico del impacto (55px estándar)

        // 1. Cálculo de Posicionamiento a Distancia (3.5 a 4.5 unidades ~ 185px)
        const CAST_DISTANCE = 190;
        let targetX = wizard.x;
        let targetY = wizard.y;

        // Buscar enemigo cercano prioritario en el cono de apuntado o en radio de combate (~380px)
        const nearestEnemy = findNearestCombatTarget(
          wizard,
          g.enemyManager.enemies,
          'fire',
          g.tilemap?.puzzleWheel,
          380,
          wizard.isMoving ? wizard.facingAngle : null,
          wizard.isMoving ? Math.PI * 0.6 : Math.PI
        );

        if (nearestEnemy) {
          targetX = nearestEnemy.x;
          targetY = nearestEnemy.y;
        } else {
          const ang = wizard.facingAngle;
          targetX = wizard.x + Math.cos(ang) * CAST_DISTANCE;
          targetY = wizard.y + Math.sin(ang) * CAST_DISTANCE;
        }

        // Si hay mapa de tiles, verificar que no quede atrapado dentro de un muro sólido
        if (g.tilemap) {
          const resolved = g.tilemap.resolveEntityCollision({ x: targetX, y: targetY, radius: 24 });
          targetX = resolved.x;
          targetY = resolved.y;
        }

        g.infernalCrowns.push({
          id: `fire-pillar-${now}-${Math.random()}`,
          x: targetX,
          y: targetY,
          currentRadius: 10,
          maxRadius: pillarRadius,
          phase: 'preparation', // 0 a 250 ms: Runa en suelo
          phaseTimer: 0,
          prepDurationMs: 250, // 250 ms de conjuración y telegrafiado rúnico
          expansionDurationMs: 0,
          detonationDurationMs: 350, // 250 a 600 ms: Detonación del geiser / columna de fuego
          ringDurationMs: 2400, // 600 a 3000 ms: Suelo ardiente residual (2.4s ~ 2.5s)
          periodicDamage: (14 + statBonus * 0.28) * (isCharged ? 1.3 : 1.0), // Daño por tick de quemadura cada 400ms
          periodicIntervalMs: 400,
          detonationDamage: (recipe.damage + statBonus * 1.2) * (isCharged ? 1.45 : 1.15), // Daño explosivo inicial de alto impacto
          knockback: (recipe.knockback || 6.5) * (isCharged ? 1.4 : 1.1),
          lastDamagePerEnemy: {},
          hasDetonated: false,
          crackAngles,
          isCharged,
        });

        // Audio: Conjuración sutil de viento caliente
        audioManager.playFirePillarConjure();
        elementalSound.playInfernalCrownIgnition();
        g.screenShake = Math.max(g.screenShake, isCharged ? 5 : 3);

        g.floatingTexts.push({
          id: `pillar-cast-${now}`,
          x: targetX,
          y: targetY - 30,
          text: isCharged ? '🌋🔥 ¡PILAR ÍGNEO CARGADO!' : '🌋🔥 ¡PILAR ÍGNEO!',
          color: '#fbbf24',
          fontSize: 14,
          opacity: 1,
          vy: -1.3,
          life: 35,
        });
      }
      // TRINCHERA DE MAGMA (FUEGO + FUEGO + TIERRA):
      // Grieta lineal de 300px en el suelo durante 2.5s con daño ígneo continuo (250ms) y -35% velocidad
      else if (recipe.id === 'magma_trench') {
        g.screenShake = Math.max(g.screenShake, 5);
        elementalSound.playEarthToss();
        const trenchLength = 300;
        const trenchWidth = 32;
        const tickDmg = Math.round((recipe.damage + statBonus * 0.35) * chargeMultiplier);

        const segments: MagmaTrenchEntity['segments'] = [];
        const segCount = 8;
        for (let s = 0; s < segCount; s++) {
          segments.push({
            dist: (s / segCount) * trenchLength,
            w: 36,
            h: 24,
            seed: Math.random() * 100,
          });
        }

        g.magmaTrenches.push({
          id: `trench-${now}-${Math.random()}`,
          startX: wizard.x + Math.cos(aimAngle) * 16,
          startY: wizard.y + Math.sin(aimAngle) * 16,
          angle: aimAngle,
          length: trenchLength,
          width: trenchWidth,
          durationMs: 2500,
          elapsedMs: 0,
          damagePerTick: tickDmg,
          tickIntervalMs: 250,
          lastEnemyTick: {},
          finished: false,
          segments,
        });

        g.floatingTexts.push({
          id: `trench-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 70,
          y: wizard.y + Math.sin(aimAngle) * 70 - 22,
          text: '🌋 Trinchera de Magma',
          color: '#ea580c',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // DEFLAGRACIÓN TÉRMICA (FUEGO + FUEGO + HIELO):
      // Proyectil veloz (~250px) que estalla en radio 70px, micro-empuja y fractura la armadura (+30% daño por 4s)
      else if (recipe.id === 'thermal_deflagration') {
        g.screenShake = Math.max(g.screenShake, 4);
        elementalSound.playFireShot();
        const speed = 9.5;
        const maxDist = 250;
        const lifeFrames = Math.round(maxDist / speed);
        const deflagDmg = Math.round((recipe.damage + statBonus) * chargeMultiplier);

        g.projectiles.push({
          id: `deflag-${now}-${Math.random()}`,
          x: wizard.x + Math.cos(aimAngle) * 18,
          y: wizard.y + Math.sin(aimAngle) * 18,
          vx: Math.cos(aimAngle) * speed,
          vy: Math.sin(aimAngle) * speed,
          radius: 12,
          color: '#ef4444',
          secondaryColor: '#38bdf8',
          damage: deflagDmg,
          knockback: recipe.knockback || 4.5,
          life: lifeFrames,
          maxLife: lifeFrames,
          pierce: 1,
          piercedIds: [],
          isHostile: false,
          spellType: 'thermal_deflagration',
          areaOfEffect: 70,
        });

        g.floatingTexts.push({
          id: `deflag-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 45,
          y: wizard.y + Math.sin(aimAngle) * 45 - 20,
          text: '💥 Deflagración Térmica',
          color: '#ef4444',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // HAZ DE FUSIÓN SOLAR (FUEGO + FUEGO + RAYO):
      // Línea de plasma instantánea de 400px x 24px durante 500ms con 4 ticks perforantes continuos
      else if (recipe.id === 'solar_fusion_beam') {
        g.screenShake = Math.max(g.screenShake, 6);
        elementalSound.playLightningBolt();
        const beamLength = 400;
        const beamWidth = 24;
        const tickDmg = Math.round((recipe.damage + statBonus * 0.28) * chargeMultiplier);

        g.solarFusionBeams.push({
          id: `solar-beam-${now}-${Math.random()}`,
          originX: wizard.x + Math.cos(aimAngle) * 16,
          originY: wizard.y + Math.sin(aimAngle) * 16,
          aimAngle,
          length: beamLength,
          width: beamWidth,
          durationMs: 500,
          elapsedMs: 0,
          damagePerTick: tickDmg,
          tickIntervalMs: 125,
          lastEnemyTick: {},
          finished: false,
        });

        g.floatingTexts.push({
          id: `solar-beam-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 80,
          y: wizard.y + Math.sin(aimAngle) * 80 - 24,
          text: '☀️ Haz de Fusión Solar',
          color: '#facc15',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // ALUD DE AGUJAS TELÚRICAS (HIELO + HIELO + TIERRA):
      // Emergen 3 estalagmitas colosales de hielo y roca en cono frontal con daño masivo y freeze/stun de 0.8s
      else if (recipe.id === 'glacial_avalanche') {
        g.screenShake = Math.max(g.screenShake, 7);
        elementalSound.playEarthToss();
        const baseDmg = Math.round((recipe.damage + statBonus) * chargeMultiplier);

        const distFront = 160;
        const angles = [aimAngle - 0.28, aimAngle, aimAngle + 0.28];
        const dists = [distFront * 0.85, distFront * 1.05, distFront * 0.85];
        const spikes: GlacialAvalancheSpike[] = [];

        for (let i = 0; i < 3; i++) {
          const spkX = wizard.x + Math.cos(angles[i]) * dists[i];
          const spkY = wizard.y + Math.sin(angles[i]) * dists[i] * 0.58;
          spikes.push({
            x: spkX,
            y: spkY,
            height: 0,
            maxHeight: 52 + i * 4,
            width: 24,
            delayMs: i * 60,
            erupted: false,
          });
        }

        g.glacialAvalanches.push({
          id: `avalanche-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          angle: aimAngle,
          durationMs: 1200,
          elapsedMs: 0,
          damage: baseDmg,
          spikes,
          hitEnemyIds: new Set<string>(),
          finished: false,
        });

        g.floatingTexts.push({
          id: `avalanche-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 70,
          y: wizard.y + Math.sin(aimAngle) * 70 - 20,
          text: '🏔️ Alud Telúrico',
          color: '#38bdf8',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // LLUVIA DE GRANIZO HIRVIENTE (HIELO + HIELO + FUEGO):
      // Caída rápida de 6 carámbanos incandescentes en área de 90px con daño gélido y estallidos de calor quemante
      else if (recipe.id === 'boiling_hail') {
        g.screenShake = Math.max(g.screenShake, 5);
        elementalSound.playIceShard();
        const targetCenterX = wizard.x + Math.cos(aimAngle) * 200;
        const targetCenterY = wizard.y + Math.sin(aimAngle) * 200 * 0.58;
        const impactDmg = Math.round((recipe.damage + statBonus * 0.25) * chargeMultiplier);

        const icicles: BoilingHailIcicle[] = [];
        for (let i = 0; i < 6; i++) {
          const rAng = Math.random() * Math.PI * 2;
          const rDist = Math.random() * 75;
          const tx = targetCenterX + Math.cos(rAng) * rDist;
          const ty = targetCenterY + Math.sin(rAng) * rDist * 0.58;
          icicles.push({
            targetX: tx,
            targetY: ty,
            currentX: tx + 80,
            currentY: ty - 160,
            delayMs: i * 65,
            flightDurationMs: 140,
            hasImpacted: false,
          });
        }

        g.boilingHails.push({
          id: `hail-${now}-${Math.random()}`,
          centerX: targetCenterX,
          centerY: targetCenterY,
          radius: 90,
          durationMs: 700,
          elapsedMs: 0,
          impactDamage: impactDmg,
          icicles,
          finished: false,
        });

        g.floatingTexts.push({
          id: `hail-cast-${now}`,
          x: targetCenterX,
          y: targetCenterY - 30,
          text: '☄️ Granizo Hirviente',
          color: '#7dd3fc',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // TORMENTA CRIOELECTROSTÁTICA (HIELO + HIELO + RAYO):
      // Vórtice centrado a 160px durante 2s: -50% vel, daño por pulsos y arcos voltaicos entre enemigos contiguos
      else if (recipe.id === 'superconductor_blizzard') {
        g.screenShake = Math.max(g.screenShake, 6);
        elementalSound.playLightningBolt();
        const vortexCenterX = wizard.x + Math.cos(aimAngle) * 160;
        const vortexCenterY = wizard.y + Math.sin(aimAngle) * 160 * 0.58;
        const tickDmg = Math.round((recipe.damage + statBonus * 0.3) * chargeMultiplier);

        g.superconductorBlizzards.push({
          id: `sc-blizzard-${now}-${Math.random()}`,
          centerX: vortexCenterX,
          centerY: vortexCenterY,
          radius: 80,
          durationMs: 2000,
          elapsedMs: 0,
          damagePerTick: tickDmg,
          tickIntervalMs: 250,
          lastEnemyTick: {},
          finished: false,
          angle: 0,
        });

        g.floatingTexts.push({
          id: `blizzard-cast-${now}`,
          x: vortexCenterX,
          y: vortexCenterY - 30,
          text: '🌪️ Ventisca Conductora',
          color: '#bae6fd',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // PILÓN DE PARARRAYOS (RAYO + RAYO + TIERRA):
      // Obelisco conductor a 180px que dura 3s, atrae enemigos en 90px y descarga rayos radiales cada 500ms
      else if (recipe.id === 'lightning_rod_pylon') {
        g.screenShake = Math.max(g.screenShake, 7);
        elementalSound.playLightningBolt();
        elementalSound.playEarthToss();
        const targetX = wizard.x + Math.cos(aimAngle) * 180;
        const targetY = wizard.y + Math.sin(aimAngle) * 180 * 0.58;
        const pulseDmg = Math.round((recipe.damage + statBonus * 0.3) * chargeMultiplier);

        g.lightningRodPylons.push({
          id: `pylon-${now}-${Math.random()}`,
          x: targetX,
          y: targetY,
          durationMs: 3000,
          elapsedMs: 0,
          pulseIntervalMs: 500,
          lastPulseMs: 0,
          pullRadius: 90,
          damagePerPulse: pulseDmg,
          pulseWaveAlpha: 0,
          finished: false,
        });

        g.floatingTexts.push({
          id: `pylon-cast-${now}`,
          x: targetX,
          y: targetY - 40,
          text: '⚡ Pilón de Pararrayos',
          color: '#facc15',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // BOMBA DE PLASMA INESTABLE (RAYO + RAYO + FUEGO):
      // Orbe pesado a media velocidad (~220px alcance) que detona en supernova de 80px con daño masivo y gran empuje radial
      else if (recipe.id === 'plasma_hyper_orb') {
        g.screenShake = Math.max(g.screenShake, 8);
        elementalSound.playLightningBolt();
        elementalSound.playFireShot();
        const baseDmg = Math.round((recipe.damage + statBonus) * chargeMultiplier);
        const speed = 5.5;

        g.plasmaHyperOrbs.push({
          id: `plasma-orb-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          currentX: wizard.x,
          currentY: wizard.y,
          vx: Math.cos(aimAngle) * speed,
          vy: Math.sin(aimAngle) * speed * 0.58,
          travelDist: 0,
          maxDist: 220,
          damage: baseDmg,
          radius: 14,
          explosionRadius: 80,
          exploded: false,
          explosionProgress: 0,
          explosionDurationMs: 320,
          elapsedMs: 0,
          finished: false,
        });

        g.floatingTexts.push({
          id: `plasma-orb-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 50,
          y: wizard.y + Math.sin(aimAngle) * 50 - 20,
          text: '💥 Bomba de Plasma',
          color: '#a855f7',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // DESCARGA DE CERO ABSOLUTO (RAYO + RAYO + HIELO):
      // Pulso electromagnético criogénico instantáneo en abanico frontal de 120° y 260px con parálisis de 1.5s
      else if (recipe.id === 'cryo_arc_flash') {
        g.screenShake = Math.max(g.screenShake, 9);
        elementalSound.playLightningBolt();
        elementalSound.playGlacialFreezeImpact();
        const baseDmg = Math.round((recipe.damage + statBonus * 0.4) * chargeMultiplier);
        const coneAngle = (Math.PI * 2) / 3; // 120°
        const range = 260;

        g.cryoArcFlashes.push({
          id: `cryo-flash-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          aimAngle,
          coneAngle,
          range,
          durationMs: 360,
          elapsedMs: 0,
          damage: baseDmg,
          freezeDurationFrames: 90, // 1.5s a 60fps
          finished: false,
        });

        // Aplicación inmediata a los enemigos dentro del cono frontal
        g.enemyManager.enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const dx = enemy.x - wizard.x;
          const dy = (enemy.y - wizard.y) / 0.58;
          const dist = Math.hypot(dx, dy);
          if (dist <= range + enemy.radius) {
            const enemyAng = Math.atan2(dy, dx);
            const diff = Math.atan2(Math.sin(enemyAng - aimAngle), Math.cos(enemyAng - aimAngle));
            if (Math.abs(diff) <= coneAngle / 2) {
              applyDamageToEnemy(enemy, baseDmg, 'lightning', g.floatingTexts, wizard.x, wizard.y);
              enemy.hitFlash = 14;
              enemy.stunnedTimer = 90; // 1.5s parálisis absoluta
              g.enemyManager.applyStatus(enemy, 'frozen', 90);
              g.floatingTexts.push({
                id: `cryo-stun-${now}-${enemy.id}`,
                x: enemy.x,
                y: enemy.y - 25,
                text: '⚡❄️ ¡PARÁLISIS CERO ABSOLUTO 1.5s!',
                color: '#38bdf8',
                fontSize: 12,
                opacity: 1,
                vy: -1.2,
                life: 40,
              });
            }
          }
        });

        g.floatingTexts.push({
          id: `cryo-flash-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 80,
          y: wizard.y + Math.sin(aimAngle) * 80 - 25,
          text: '⚡❄️ Descarga Cero Absoluto',
          color: '#38bdf8',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // MEGALITO VOLCÁNICO RODANTE (TIERRA + TIERRA + FUEGO):
      // Proyectil masivo de 28px de radio que rueda 320px arrollando y estalla en 65px
      else if (recipe.id === 'rolling_magma_boulder') {
        g.screenShake = Math.max(g.screenShake, 8);
        elementalSound.playEarthToss();
        elementalSound.playFireShot();
        const baseDmg = Math.round((recipe.damage + statBonus) * chargeMultiplier);
        const speed = 4.2;

        g.rollingMagmaBoulders.push({
          id: `boulder-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          currentX: wizard.x,
          currentY: wizard.y,
          vx: Math.cos(aimAngle) * speed,
          vy: Math.sin(aimAngle) * speed * 0.58,
          angle: aimAngle,
          rollAngle: 0,
          radius: 28,
          travelDist: 0,
          maxDist: 320,
          damage: baseDmg,
          exploded: false,
          explosionRadius: 65,
          explosionProgress: 0,
          explosionDurationMs: 320,
          elapsedMs: 0,
          hitEnemyIds: new Set<string>(),
          finished: false,
        });

        g.floatingTexts.push({
          id: `boulder-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 55,
          y: wizard.y + Math.sin(aimAngle) * 55 - 25,
          text: '🪨 Megalito Rodante',
          color: '#ea580c',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // FORTALEZA GLACIAL DE PICOS (TIERRA + TIERRA + HIELO):
      // Erupción radial de púas petrificadas en 360° (110px), escudo de absorción de 2s y 40% slow
      else if (recipe.id === 'glacial_bastion') {
        g.screenShake = Math.max(g.screenShake, 8);
        elementalSound.playEarthToss();
        elementalSound.playGlacialFreezeImpact();
        const baseDmg = Math.round((recipe.damage + statBonus * 0.35) * chargeMultiplier);
        const bastionRadius = 110;

        // Otorga mitigación/escudo temporal por 2 segundos (120 frames)
        wizard.invulnerableTimer = Math.max(wizard.invulnerableTimer || 0, 120);

        g.glacialBastions.push({
          id: `bastion-${now}-${Math.random()}`,
          centerX: wizard.x,
          centerY: wizard.y,
          radius: bastionRadius,
          durationMs: 1200,
          elapsedMs: 0,
          damage: baseDmg,
          spikeProgress: 0,
          finished: false,
        });

        // Golpe radial y rechazo frontal a todos los atacantes en 110px
        g.enemyManager.enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const d = Math.hypot(enemy.x - wizard.x, (enemy.y - wizard.y) / 0.58);
          if (d <= bastionRadius + enemy.radius) {
            const kAng = Math.atan2(enemy.y - wizard.y, enemy.x - wizard.x);
            enemy.x += Math.cos(kAng) * 26;
            enemy.y += Math.sin(kAng) * 15;
            applyDamageToEnemy(enemy, baseDmg, 'earth', g.floatingTexts, wizard.x, wizard.y);
            enemy.hitFlash = 10;
            g.enemyManager.applyStatus(enemy, 'slowed', 120); // 40% slow por 2 segundos
          }
        });

        g.floatingTexts.push({
          id: `bastion-cast-${now}`,
          x: wizard.x,
          y: wizard.y - 45,
          text: '🏰 Bastión Glacial (🛡️ Escudo 2s)',
          color: '#7dd3fc',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 35,
        });
      }
      // FISURA SÍSMICA RESONANTE (TIERRA + TIERRA + RAYO):
      // 3 ondas de choque sucesivas en abanico frontal (90° hasta 240px) con micro-aturdimiento (0.4s) y quiebre de escudos
      else if (recipe.id === 'resonant_quake') {
        g.screenShake = Math.max(g.screenShake, 9);
        elementalSound.playEarthToss();
        elementalSound.playLightningBolt();
        const waveDmg = Math.round((recipe.damage * 0.45 + statBonus * 0.25) * chargeMultiplier);
        const coneAngle = Math.PI / 2; // 90°
        const maxRange = 240;

        const waves: ResonantQuakeWave[] = [
          { distance: 80, delayMs: 0, discharged: false, hitEnemyIds: new Set<string>() },
          { distance: 160, delayMs: 140, discharged: false, hitEnemyIds: new Set<string>() },
          { distance: 240, delayMs: 280, discharged: false, hitEnemyIds: new Set<string>() },
        ];

        g.resonantQuakes.push({
          id: `quake-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          aimAngle,
          coneAngle,
          maxRange,
          durationMs: 800,
          elapsedMs: 0,
          damagePerWave: waveDmg,
          waves,
          finished: false,
        });

        g.floatingTexts.push({
          id: `quake-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 75,
          y: wizard.y + Math.sin(aimAngle) * 75 - 25,
          text: '⚡🌍 Fisura Resonante',
          color: '#facc15',
          fontSize: 13,
          opacity: 1,
          vy: -1.2,
          life: 30,
        });
      }
      // JUICIO DEL DIOS DEL TRUENO (RAYO x4 — TIER 4):
      // Columna de rayo colosal de 60px, desintegra proyectiles hostiles en 120px y paraliza 1.5s
      else if (recipe.id === 'thundergod_judgment') {
        g.screenShake = Math.max(g.screenShake, 14);
        elementalSound.playLightningBolt();
        const baseDmg = Math.round((recipe.damage + statBonus * 0.7) * chargeMultiplier);

        // El objetivo debe caber en cámara para que el pilar y la onda se vean completos.
        const canvas = canvasRef.current;
        const halfViewWidth = (canvas?.width ?? 1000) / (2 * 1.32);
        const halfViewHeight = (canvas?.height ?? 620) / (2 * 1.32);
        const safeHalfWidth = Math.max(0, halfViewWidth - 120);
        const safeHalfHeight = Math.max(0, halfViewHeight - 70);
        const isImpactVisible = (x: number, y: number) =>
          Math.abs(x - g.camera.x) <= safeHalfWidth && Math.abs(y - g.camera.y) <= safeHalfHeight;
        const clampToCamera = (value: number, center: number, halfExtent: number) =>
          Math.max(center - halfExtent, Math.min(value, center + halfExtent));

        // Sin enemigo visible, centrar el golpe 200 px delante del mago y dentro de cámara.
        let targetX = clampToCamera(wizard.x + Math.cos(aimAngle) * 200, g.camera.x, safeHalfWidth);
        let targetY = clampToCamera(wizard.y + Math.sin(aimAngle) * 200 * 0.58, g.camera.y, safeHalfHeight);
        const visibleEnemies = g.enemyManager.enemies.filter((enemy) => {
          if (enemy.hp <= 0 || !isImpactVisible(enemy.x, enemy.y)) return false;
          const distance = Math.hypot(enemy.x - wizard.x, (enemy.y - wizard.y) / 0.58);
          return distance <= 380;
        });
        const boss = visibleEnemies.find((enemy) => enemy.archetype === 'boss');
        const target = boss || visibleEnemies.reduce<typeof visibleEnemies[number] | null>((nearest, enemy) => {
          if (!nearest) return enemy;
          const distance = Math.hypot(enemy.x - wizard.x, (enemy.y - wizard.y) / 0.58);
          const nearestDistance = Math.hypot(nearest.x - wizard.x, (nearest.y - wizard.y) / 0.58);
          return distance < nearestDistance ? enemy : nearest;
        }, null);
        if (target) {
          targetX = target.x;
          targetY = target.y;
        }

        // Desintegrar proyectiles hostiles en 120px sin asignación en memoria
        g.projectilePool.filterHostile((p) => {
          const d = Math.hypot(p.x - targetX, (p.y - targetY) / 0.58);
          return d > 120;
        });

        // Aplicar daño masivo y parálisis 1.5s a todos en 120px
        g.enemyManager.enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const d = Math.hypot(enemy.x - targetX, (enemy.y - targetY) / 0.58);
          if (d <= 120 + enemy.radius) {
            applyDamageToEnemy(enemy, baseDmg, 'lightning', g.floatingTexts, targetX, targetY);
            enemy.hitFlash = 16;
            enemy.stunnedTimer = 90; // 1.5s de parálisis
            g.enemyManager.applyStatus(enemy, 'shocked', 120);
          }
        });

        g.thundergodJudgments.push({
          id: `tg-judgment-${now}-${Math.random()}`,
          targetX,
          targetY,
          strikeWidth: 60,
          impactRadius: 120,
          durationMs: 850,
          elapsedMs: 0,
          damage: baseDmg,
          struck: true,
          finished: false,
        });

        g.floatingTexts.push({
          id: `tg-cast-${now}`,
          x: targetX,
          y: targetY - 50,
          text: '⚡👑 ¡JUICIO DEL DIOS DEL TRUENO!',
          color: '#ffffff',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // SUPERNOVA PRIMORDIAL (FUEGO x4 — TIER 4):
      // Sol colosal de 36px que avanza y detona en 140px, cubriendo el suelo de lava ardiente durante 3.5s
      else if (recipe.id === 'primordial_supernova') {
        g.screenShake = Math.max(g.screenShake, 14);
        elementalSound.playAoEExplosion();
        const baseDmg = Math.round((recipe.damage + statBonus * 0.8) * chargeMultiplier);
        const speed = 4.8;

        g.primordialSupernovas.push({
          id: `supernova-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          currentX: wizard.x,
          currentY: wizard.y,
          vx: Math.cos(aimAngle) * speed,
          vy: Math.sin(aimAngle) * speed * 0.58,
          travelDist: 0,
          maxDist: 180,
          damage: baseDmg,
          orbRadius: 36,
          explosionRadius: 140,
          exploded: false,
          explosionProgress: 0,
          explosionDurationMs: 400,
          lavaDurationMs: 3500,
          elapsedMs: 0,
          lavaPatches: [],
          lastBurnTickMs: 0,
          finished: false,
        });

        g.floatingTexts.push({
          id: `supernova-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 60,
          y: wizard.y + Math.sin(aimAngle) * 60 - 30,
          text: '☀️🔥 ¡SUPERNOVA PRIMORDIAL!',
          color: '#fde047',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // ERA GLACIAL (HIELO x4 — TIER 4):
      // Congelación expansiva en pantalla completa (3s), estalagmitas y destrucción de proyectiles
      else if (recipe.id === 'absolute_zero_age') {
        g.screenShake = Math.max(g.screenShake, 12);
        elementalSound.playGlacialFreezeImpact();
        const baseDmg = Math.round((recipe.damage + statBonus * 0.5) * chargeMultiplier);

        // Destruir todos los proyectiles hostiles en vuelo sin asignaciones de heap
        g.projectilePool.clearHostile();

        // Congelar a todos los enemigos en el viewport durante 3 segundos (180 frames)
        const spikes: AbsoluteZeroSpike[] = [];
        g.enemyManager.enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          applyDamageToEnemy(enemy, baseDmg, 'ice', g.floatingTexts, wizard.x, wizard.y);
          enemy.hitFlash = 16;
          enemy.stunnedTimer = 180; // 3 segundos de congelación absoluta
          g.enemyManager.applyStatus(enemy, 'frozen', 180);
          spikes.push({
            x: enemy.x,
            y: enemy.y,
            height: 0,
            maxHeight: 38 + Math.random() * 12,
          });
        });

        g.absoluteZeroAges.push({
          id: `az-age-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          durationMs: 3000,
          elapsedMs: 0,
          spikes,
          frostOverlayAlpha: 1.0,
          finished: false,
        });

        g.floatingTexts.push({
          id: `az-cast-${now}`,
          x: wizard.x,
          y: wizard.y - 50,
          text: '❄️🌐 ¡ERA GLACIAL (3s Congelación Total)!',
          color: '#bae6fd',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 45,
        });
      }
      // CATACLISMO TECTÓNICO (TIERRA x4 — TIER 4):
      // Terremoto con 4 monolitos colosales que emergen y colapsan, daño masivo, aturdimiento de 2s y micro-empuje
      else if (recipe.id === 'tectonic_cataclysm') {
        g.screenShake = Math.max(g.screenShake, 15);
        elementalSound.playEarthToss();
        const baseDmg = Math.round((recipe.damage + statBonus * 0.7) * chargeMultiplier);

        // 4 monolitos masivos en cruz/cuadrantes alrededor del mago
        const monoliths: TectonicCataclysmMonolith[] = [
          { x: wizard.x - 110, y: wizard.y - 45, height: 0, maxHeight: 60, width: 28, collapsed: false, delayMs: 60 },
          { x: wizard.x + 110, y: wizard.y - 45, height: 0, maxHeight: 60, width: 28, collapsed: false, delayMs: 140 },
          { x: wizard.x - 65, y: wizard.y + 60, height: 0, maxHeight: 68, width: 32, collapsed: false, delayMs: 220 },
          { x: wizard.x + 65, y: wizard.y + 60, height: 0, maxHeight: 68, width: 32, collapsed: false, delayMs: 300 },
        ];

        // Daño, aturdimiento de 2 segundos (120 frames) y micro-empuje a todos los enemigos visibles
        g.enemyManager.enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const kAng = Math.atan2(enemy.y - wizard.y, enemy.x - wizard.x);
          enemy.x += Math.cos(kAng) * 20;
          enemy.y += Math.sin(kAng) * 12;
          applyDamageToEnemy(enemy, baseDmg, 'earth', g.floatingTexts, wizard.x, wizard.y);
          enemy.hitFlash = 14;
          enemy.stunnedTimer = 120; // 2 segundos de aturdimiento
        });

        g.tectonicCataclysms.push({
          id: `tc-cataclysm-${now}-${Math.random()}`,
          centerX: wizard.x,
          centerY: wizard.y,
          durationMs: 2400,
          elapsedMs: 0,
          damage: baseDmg,
          monoliths,
          finished: false,
        });

        g.floatingTexts.push({
          id: `tc-cast-${now}`,
          x: wizard.x,
          y: wizard.y - 50,
          text: '🌋🌍 ¡CATACLISMO TECTÓNICO (2s Aturdimiento)!',
          color: '#78350f',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 45,
        });
      }
      // METEORO DE PLASMA CINÉTICO (FUEGO x3 + RAYO — TIER 4):
      // Impacto supersónico telegrafiado (150ms) a 260px o sobre el grupo enemigo más denso, explosión de 90px y barrido de proyectiles
      else if (recipe.id === 'kinetic_plasma_meteor') {
        const baseDmg = Math.round((recipe.damage + statBonus * 0.75) * chargeMultiplier);

        // Elegir objetivo: grupo enemigo más denso o hacia el apuntado a 260px
        let targetX = wizard.x + Math.cos(aimAngle) * 260;
        let targetY = wizard.y + Math.sin(aimAngle) * 260 * 0.58;

        let bestScore = -1;
        for (const e of g.enemyManager.enemies) {
          if (e.hp <= 0) continue;
          const d = Math.hypot(e.x - wizard.x, (e.y - wizard.y) / 0.58);
          if (d <= 360) {
            let neighbors = 0;
            for (const other of g.enemyManager.enemies) {
              if (other.hp > 0 && Math.hypot(other.x - e.x, (other.y - e.y) / 0.58) <= 90) {
                neighbors++;
              }
            }
            const angDiff = Math.abs(Math.atan2((e.y - wizard.y) / 0.58, e.x - wizard.x) - aimAngle);
            const score = neighbors * 100 - d * 0.15 - (angDiff < Math.PI / 2.5 ? 0 : 60);
            if (score > bestScore) {
              bestScore = score;
              targetX = e.x;
              targetY = e.y;
            }
          }
        }

        elementalSound.playLightningBolt();

        g.kineticPlasmaMeteors.push({
          id: `kpm-${now}-${Math.random()}`,
          startX: targetX - 160,
          startY: targetY - 240,
          targetX,
          targetY,
          currentX: targetX - 160,
          currentY: targetY - 240,
          impactRadius: 90,
          damage: baseDmg,
          durationMs: 450,
          elapsedMs: 0,
          telegraphDurationMs: 150,
          exploded: false,
          finished: false,
        });

        g.floatingTexts.push({
          id: `kpm-cast-${now}`,
          x: targetX,
          y: targetY - 50,
          text: '⚡☄️ ¡METEORO DE PLASMA!',
          color: '#facc15',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // COMETA DE FRÍO ABRASADOR (FUEGO x3 + HIELO — TIER 4):
      // Proyectil parabólico masivo con choque térmico, congelación 1.2s y quemadura simultánea 3s en radio 80px
      else if (recipe.id === 'frostburn_comet') {
        const baseDmg = Math.round((recipe.damage + statBonus * 0.75) * chargeMultiplier);

        let targetX = wizard.x + Math.cos(aimAngle) * 240;
        let targetY = wizard.y + Math.sin(aimAngle) * 240 * 0.58;

        let nearestDist = 9999;
        for (const e of g.enemyManager.enemies) {
          if (e.hp <= 0) continue;
          const d = Math.hypot(e.x - wizard.x, (e.y - wizard.y) / 0.58);
          if (d <= 340) {
            const angDiff = Math.abs(Math.atan2((e.y - wizard.y) / 0.58, e.x - wizard.x) - aimAngle);
            if (angDiff < Math.PI / 2.5 && d < nearestDist) {
              nearestDist = d;
              targetX = e.x;
              targetY = e.y;
            }
          }
        }

        elementalSound.playIceShard();

        g.frostburnComets.push({
          id: `fbc-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          targetX,
          targetY,
          currentX: wizard.x,
          currentY: wizard.y,
          currentZ: 0,
          impactRadius: 80,
          damage: baseDmg,
          durationMs: 520,
          elapsedMs: 0,
          exploded: false,
          finished: false,
        });

        g.floatingTexts.push({
          id: `fbc-cast-${now}`,
          x: targetX,
          y: targetY - 50,
          text: '❄️🔥 ¡COMETA ABRASADOR!',
          color: '#38bdf8',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // CALDERA VOLCÁNICA PROFUNDA (FUEGO x3 + TIERRA — TIER 4):
      // Cráter magmático a 180px activo durante 3.5s, succión leve y daño por tick continuo
      else if (recipe.id === 'caldera_cataclysm') {
        g.screenShake = Math.max(g.screenShake, 10);
        elementalSound.playAoEExplosion();
        const baseDmg = Math.round((recipe.damage + statBonus * 0.8) * chargeMultiplier);

        const centerX = wizard.x + Math.cos(aimAngle) * 180;
        const centerY = wizard.y + Math.sin(aimAngle) * 180 * 0.58;

        g.calderaCataclysms.push({
          id: `cc-${now}-${Math.random()}`,
          centerX,
          centerY,
          radius: 100,
          durationMs: 3500,
          elapsedMs: 0,
          damagePerTick: Math.max(12, Math.round(baseDmg / 7)),
          lastTickMs: 0,
          finished: false,
        });

        g.floatingTexts.push({
          id: `cc-cast-${now}`,
          x: centerX,
          y: centerY - 50,
          text: '🌋🔥 ¡CALDERA VOLCÁNICA!',
          color: '#f97316',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // TEMPESTAD SOLAR (RAYO x3 + FUEGO — TIER 4):
      // Rectángulo frontal de 350x140px con cascada continua de rayos, daño acelerado y columnas de plasma
      else if (recipe.id === 'solar_arc_tempest') {
        const baseDmg = Math.round((recipe.damage + statBonus * 0.75) * chargeMultiplier);
        g.screenShake = Math.max(g.screenShake, 11);
        elementalSound.playLightningBolt();

        const plasmaColumns: SolarArcTempestPlasmaColumn[] = [];
        for (let c = 1; c <= 4; c++) {
          const cDist = c * 75;
          const colX = wizard.x + Math.cos(aimAngle) * cDist + (Math.random() - 0.5) * 30;
          const colY = wizard.y + Math.sin(aimAngle) * cDist * 0.58 + (Math.random() - 0.5) * 20;
          plasmaColumns.push({
            x: colX,
            y: colY,
            radius: 18 + Math.random() * 8,
            height: 40 + Math.random() * 15,
          });
        }

        g.solarArcTempests.push({
          id: `sat-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          aimAngle,
          length: 350,
          width: 140,
          durationMs: 800,
          elapsedMs: 0,
          damagePerTick: Math.max(14, Math.round(baseDmg / 6)),
          lastTickMs: 0,
          plasmaColumns,
          finished: false,
        });

        g.floatingTexts.push({
          id: `sat-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 120,
          y: wizard.y + Math.sin(aimAngle) * 120 * 0.58 - 40,
          text: '☀️⚡ ¡TEMPESTAD SOLAR!',
          color: '#fde047',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // RAYO CRIOGÉNICO PURO (RAYO x3 + HIELO — TIER 4):
      // Descarga vertical instantánea en abanico sobre los 4 enemigos más cercanos con parálisis y congelación 1.8s
      else if (recipe.id === 'cryo_lightning_storm') {
        const baseDmg = Math.round((recipe.damage + statBonus * 0.75) * chargeMultiplier);
        g.screenShake = Math.max(g.screenShake, 13);
        elementalSound.playGlacialFreezeImpact();

        // Buscar hasta los 4 enemigos más cercanos en el cono de apuntado
        const candidates: { enemy: GameEnemy; dist: number }[] = [];
        for (const e of g.enemyManager.enemies) {
          if (e.hp <= 0) continue;
          const d = Math.hypot(e.x - wizard.x, (e.y - wizard.y) / 0.58);
          if (d <= 360) {
            const angDiff = Math.abs(Math.atan2((e.y - wizard.y) / 0.58, e.x - wizard.x) - aimAngle);
            if (angDiff < Math.PI / 2.2 || d < 120) {
              candidates.push({ enemy: e, dist: d });
            }
          }
        }
        candidates.sort((a, b) => a.dist - b.dist);
        const picked = candidates.slice(0, 4);

        const strikes: CryoLightningStrikePoint[] = [];
        if (picked.length > 0) {
          picked.forEach(({ enemy: e }) => {
            strikes.push({ targetX: e.x, targetY: e.y, spikeHeight: 32 + Math.random() * 8 });
            applyDamageToEnemy(e, baseDmg, 'lightning', g.floatingTexts, e.x, e.y);
            e.hitFlash = 16;
            e.stunnedTimer = 108; // 1.8s de congelamiento/parálisis total
            g.enemyManager.applyStatus(e, 'frozen', 108);
            g.enemyManager.applyStatus(e, 'shocked', 108);
          });
        } else {
          // Si no hay enemigos en rango, proyectar abanico en suelo
          for (let i = 0; i < 4; i++) {
            const fanAng = aimAngle - 0.45 + i * 0.3;
            const tx = wizard.x + Math.cos(fanAng) * 180;
            const ty = wizard.y + Math.sin(fanAng) * 180 * 0.58;
            strikes.push({ targetX: tx, targetY: ty, spikeHeight: 28 });
          }
        }

        // Destruir proyectiles hostiles en las zonas de impacto
        g.projectilePool.filterHostile((p) => {
          for (const s of strikes) {
            if (Math.hypot(p.x - s.targetX, (p.y - s.targetY) / 0.58) <= 60) return false;
          }
          return true;
        });

        g.cryoLightningStorms.push({
          id: `cls-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          aimAngle,
          radius: 100,
          durationMs: 450,
          elapsedMs: 0,
          strikes,
          struck: true,
          finished: false,
        });

        const leadTarget = strikes[0] || { targetX: wizard.x + Math.cos(aimAngle) * 180, targetY: wizard.y + Math.sin(aimAngle) * 180 * 0.58 };
        g.floatingTexts.push({
          id: `cls-cast-${now}`,
          x: leadTarget.targetX,
          y: leadTarget.targetY - 50,
          text: '❄️⚡ ¡RAYO CRIOGÉNICO PURO!',
          color: '#38bdf8',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // MARTILLO DE THOR TECTÓNICO (RAYO x3 + TIERRA — TIER 4):
      // Rayo colosal que fractura la tierra a 200px: 120px de choque, aturdimiento 1.5s, empuje y quiebre de defensa (+35%)
      else if (recipe.id === 'tectonic_lightning_hammer') {
        const baseDmg = Math.round((recipe.damage + statBonus * 0.85) * chargeMultiplier);
        g.screenShake = Math.max(g.screenShake, 15);
        elementalSound.playEarthToss();

        const targetX = wizard.x + Math.cos(aimAngle) * 200;
        const targetY = wizard.y + Math.sin(aimAngle) * 200 * 0.58;

        // Daño masivo, aturdimiento 1.5s, empuje radial y quiebre de defensas
        g.enemyManager.enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const d = Math.hypot(enemy.x - targetX, (enemy.y - targetY) / 0.58);
          if (d <= 120 + enemy.radius) {
            applyDamageToEnemy(enemy, baseDmg, 'lightning', g.floatingTexts, targetX, targetY);
            enemy.hitFlash = 16;
            enemy.stunnedTimer = 90; // 1.5s de aturdimiento

            const kAng = Math.atan2(enemy.y - targetY, enemy.x - targetX);
            enemy.x += Math.cos(kAng) * 28;
            enemy.y += Math.sin(kAng) * 16;

            // Quiebre de defensas (+35% de daño recibido durante 4 segundos = 240 frames)
            enemy.defenseBrokenTimer = 240;
            g.floatingTexts.push({
              id: `def-break-${now}-${enemy.id}`,
              x: enemy.x,
              y: enemy.y - 28,
              text: '🛡️💔 ¡DEFENSA ROTA! (+35%)',
              color: '#facc15',
              fontSize: 12,
              opacity: 1,
              vy: -1.1,
              life: 45,
            });
          }
        });

        g.tectonicLightningHammers.push({
          id: `tlh-${now}-${Math.random()}`,
          targetX,
          targetY,
          impactRadius: 120,
          pillarWidth: 40,
          durationMs: 600,
          elapsedMs: 0,
          damage: baseDmg,
          fissures: [
            { angle: 0.35, length: 115 },
            { angle: 1.85, length: 110 },
            { angle: 3.45, length: 120 },
            { angle: 5.05, length: 105 },
          ],
          struck: true,
          finished: false,
        });

        g.floatingTexts.push({
          id: `tlh-cast-${now}`,
          x: targetX,
          y: targetY - 60,
          text: '🔨⚡ ¡MARTILLO TECTÓNICO!',
          color: '#fde047',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // VENTISCA ÍGNEA (HIELO x3 + FUEGO — TIER 4):
      // Tormenta en área circular de 110px a 200px con lluvia rápida de hielo candente, 60% slow y quemadura crítica
      else if (recipe.id === 'molten_blizzard') {
        const baseDmg = Math.round((recipe.damage + statBonus * 0.75) * chargeMultiplier);
        g.screenShake = Math.max(g.screenShake, 11);
        elementalSound.playIceShard();

        const targetX = wizard.x + Math.cos(aimAngle) * 200;
        const targetY = wizard.y + Math.sin(aimAngle) * 200 * 0.58;

        g.moltenBlizzards.push({
          id: `mb-${now}-${Math.random()}`,
          centerX: targetX,
          centerY: targetY,
          radius: 110,
          durationMs: 1000,
          elapsedMs: 0,
          damagePerTick: Math.max(15, Math.round(baseDmg / 7)),
          lastTickMs: 0,
          finished: false,
        });

        g.floatingTexts.push({
          id: `mb-cast-${now}`,
          x: targetX,
          y: targetY - 50,
          text: '❄️🔥 ¡VENTISCA ÍGNEA!',
          color: '#38bdf8',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // AGUJAS SUPERCONDUCTORAS (HIELO x3 + RAYO — TIER 4):
      // Abanico frontal de 140° (280px): inmovilización total de 1.5s y arcos voltaicos continuos en cadena
      else if (recipe.id === 'superconducting_needle_storm') {
        const baseDmg = Math.round((recipe.damage + statBonus * 0.8) * chargeMultiplier);
        g.screenShake = Math.max(g.screenShake, 13);
        elementalSound.playGlacialFreezeImpact();

        const needleCount = 14;
        const needles: SuperconductingNeedle[] = [];
        for (let n = 0; n < needleCount; n++) {
          const nDist = 70 + Math.random() * 200;
          const nAng = aimAngle - 1.22 + Math.random() * 2.44;
          needles.push({
            x: wizard.x + Math.cos(nAng) * nDist,
            y: wizard.y + Math.sin(nAng) * nDist * 0.58,
            height: 0,
            maxHeight: 28 + Math.random() * 14,
            angle: nAng,
          });
        }

        // Daño e inmovilización a todos los enemigos en el abanico
        g.enemyManager.enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const dx = enemy.x - wizard.x;
          const dy = (enemy.y - wizard.y) / 0.58;
          const d = Math.hypot(dx, dy);
          if (d <= 280 + enemy.radius) {
            const angToEnemy = Math.atan2(dy, dx);
            let diff = Math.abs(angToEnemy - aimAngle);
            while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
            if (diff <= 1.25) {
              applyDamageToEnemy(enemy, baseDmg, 'ice', g.floatingTexts, wizard.x, wizard.y);
              enemy.hitFlash = 16;
              enemy.stunnedTimer = 90; // 1.5s de inmovilización
              g.enemyManager.applyStatus(enemy, 'frozen', 90);
              g.enemyManager.applyStatus(enemy, 'shocked', 90);
            }
          }
        });

        g.superconductingNeedleStorms.push({
          id: `sns-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          aimAngle,
          coneAngle: 2.44,
          maxRange: 280,
          durationMs: 1500,
          elapsedMs: 0,
          damage: baseDmg,
          needles,
          lastArcTickMs: 0,
          finished: false,
        });

        g.floatingTexts.push({
          id: `sns-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 160,
          y: wizard.y + Math.sin(aimAngle) * 160 * 0.58 - 45,
          text: '⚡❄️ ¡AGUJAS SUPERCONDUCTORAS!',
          color: '#bae6fd',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // GLACIAR TECTÓNICO (HIELO x3 + TIERRA — TIER 4):
      // Cordillera frontal de 160px que avanza 300px arrollando monstruos, empuje masivo y aturdimiento de 1.2s
      else if (recipe.id === 'tectonic_glacier_wall') {
        const baseDmg = Math.round((recipe.damage + statBonus * 0.85) * chargeMultiplier);
        g.screenShake = Math.max(g.screenShake, 15);
        elementalSound.playEarthToss();

        const blockCount = 10;
        const blocks: TectonicGlacierWallBlock[] = [];
        for (let b = 0; b < blockCount; b++) {
          const offsetDist = -72 + b * 16;
          blocks.push({
            offsetDist,
            height: 38 + Math.random() * 16,
            isRock: b % 2 === 0,
          });
        }

        g.tectonicGlacierWalls.push({
          id: `tgw-${now}-${Math.random()}`,
          originX: wizard.x,
          originY: wizard.y,
          aimAngle,
          width: 160,
          maxTravelDist: 300,
          currentDist: 25,
          speed: 260,
          durationMs: 1200,
          elapsedMs: 0,
          damage: baseDmg,
          blocks,
          hitEnemyIds: new Set<string>(),
          finished: false,
        });

        g.floatingTexts.push({
          id: `tgw-cast-${now}`,
          x: wizard.x + Math.cos(aimAngle) * 120,
          y: wizard.y + Math.sin(aimAngle) * 120 * 0.58 - 40,
          text: '🏔️❄️ ¡GLACIAR TECTÓNICO!',
          color: '#0284c7',
          fontSize: 14,
          opacity: 1,
          vy: -1.4,
          life: 40,
        });
      }
      // Set 4: Tierra x3 + elemento secundario (una entidad activa por hechizo).
      else if (recipe.id === 'primordial_magma_bastion') {
        g.primordialMagmaBastions = g.primordialMagmaBastions.filter((entity) => !entity.finished);
        const existing = g.primordialMagmaBastions[0];
        if (existing) {
          existing.elapsedMs = 0;
          existing.orbitAngle = 0;
          existing.lastTickMs = 0;
        } else {
          g.primordialMagmaBastions.push({
            id: `magma-bastion-${now}`, radius: 80, durationMs: 3500, elapsedMs: 0,
            damagePerTick: Math.max(8, Math.round(recipe.damage * 0.42)), lastTickMs: 0, orbitAngle: 0,
            monoliths: [{ angleOffset: 0, height: 28, width: 18 }, { angleOffset: (Math.PI * 2) / 3, height: 24, width: 16 }, { angleOffset: (Math.PI * 4) / 3, height: 26, width: 17 }], finished: false,
          });
        }
      }
      else if (recipe.id === 'eternal_permafrost_fortress') {
        const existing = g.eternalPermafrostFortresses.find((entity) => !entity.finished && !entity.burst);
        if (existing) {
          existing.burst = true;
          existing.burstProgress = 0;
        } else {
          g.eternalPermafrostFortresses = g.eternalPermafrostFortresses.filter((entity) => !entity.finished);
          g.eternalPermafrostFortresses.push({
            id: `permafrost-fortress-${now}`, radius: 100, durationMs: 3000, elapsedMs: 0,
            damage: Math.round(recipe.damage * 1.2), burst: false, burstProgress: 0,
            shards: Array.from({ length: 16 }, (_, i) => ({ angle: (i / 16) * Math.PI * 2, dist: 20, speed: 210, isRock: i % 2 === 0 })),
            hitEnemyIds: new Set<string>(), absorbedHits: 0, finished: false,
          });
        }
      }
      else if (recipe.id === 'magnetic_telluric_spire') {
        const candidates = g.enemyManager.enemies.filter((enemy) => enemy.hp > 0 && Math.hypot(enemy.x - wizard.x, enemy.y - wizard.y) < 520);
        let cluster: GameEnemy[] = [];
        for (const candidate of candidates) {
          const group = candidates.filter((enemy) => Math.hypot(enemy.x - candidate.x, enemy.y - candidate.y) <= 150);
          if (group.length > cluster.length) cluster = group;
        }
        const targetX = cluster.length ? cluster.reduce((sum, enemy) => sum + enemy.x, 0) / cluster.length : wizard.x + Math.cos(wizard.facingAngle) * 220;
        const targetY = cluster.length ? cluster.reduce((sum, enemy) => sum + enemy.y, 0) / cluster.length : wizard.y + Math.sin(wizard.facingAngle) * 220 * 0.58;
        g.magneticTelluricSpires = [{ id: `telluric-spire-${now}`, targetX, targetY, radius: 340, durationMs: 4000, elapsedMs: 0, damagePerTick: Math.max(12, Math.round(recipe.damage * 0.65)), lastArcTickMs: 0, obeliskHeight: 100, finished: false }];
      }
      // ATAQUES INDIVIDUALES:
      else {
        const isFire = recipe.id === 'fire_shot';
        const isIce = recipe.id === 'ice_shard';
        const isEarth = recipe.id === 'earth_toss';

        if (isFire) {
          // Flujo de Llamas Continuo: no genera proyectiles individuales
          startChanneledAttack('fire', 'attack');
          setTimeout(() => {
            stopChanneledAttack('fire');
          }, 350);
          return;
        } else if (isIce) {
          // Chorro Criogénico Continuo: no genera proyectiles individuales
          startChanneledAttack('ice', 'attack');
          setTimeout(() => {
            stopChanneledAttack('ice');
          }, 350);
          return;
        } else if (isEarth) {
          g.screenShake = isCharged ? 11 : 7;
          g.projectiles.push({
            id: `proj-${now}`,
            x: wizard.x,
            y: wizard.y,
            vx: Math.cos(aimAngle) * 5.8,
            vy: Math.sin(aimAngle) * 5.8,
            radius: isCharged ? 20 : 14,
            color: recipe.color,
            secondaryColor: recipe.secondaryColor,
            damage: (recipe.damage + statBonus) * chargeMultiplier,
            knockback: (recipe.knockback || 4.5) * (isCharged ? 1.5 : 1.1),
            life: 55,
            maxLife: 55,
            pierce: isCharged ? 3 : 1,
            piercedIds: [],
            isHostile: false,
            spellType: recipe.id,
            visualShape: 'earth_boulder',
            vRot: 0.18,
            rotation: 0,
          });
        } else {
          // Chispa básica
          g.projectiles.push({
            id: `proj-${now}`,
            x: wizard.x,
            y: wizard.y,
            vx: Math.cos(aimAngle) * 7.0,
            vy: Math.sin(aimAngle) * 7.0,
            radius: 8,
            color: recipe.color,
            secondaryColor: recipe.secondaryColor,
            damage: recipe.id === 'basic_spark'
              ? Math.max(1, Math.round((recipe.damage + statBonus * 0.35) * 0.55))
              : recipe.damage + statBonus,
            knockback: recipe.knockback,
            life: 45,
            maxLife: 45,
            pierce: 1,
            piercedIds: [],
            isHostile: false,
            spellType: recipe.id,
          });
        }
      }

      setElementQueue([]);
    },
    [activeRecipe, changeToRoom, isTutorial, getEffectiveCooldown, isDefeated, isVictorious, player.level, player.stats, player.unlockedMilestones, startChanneledAttack, stopChanneledAttack]
  );

  // Manejadores de Carga de Hechizo al presionar el botón de Ataque
  const startCharge = useCallback(() => {
    if (isDefeated || isVictorious || gameStateRef.current.wizard.isEnteringVictoryPortal) return;
    if (chargedBoostUntilRef.current > Date.now()) {
      handleAttack(true, 1);
      return;
    }
    const hasActiveOverloadCore = gameStateRef.current.overloadCores.some((c) => !c.finished && c.phase !== 'detonating');
    if (hasActiveOverloadCore) {
      handleAttack();
      return;
    }
    if (activeRecipe.id === 'fire_shot') {
      startChanneledAttack('fire', 'attack');
      return;
    }
    if (activeRecipe.id === 'ice_shard') {
      startChanneledAttack('ice', 'attack');
      return;
    }

    const g = gameStateRef.current;
    const now = Date.now();
    const lastCast = g.recipeCooldowns[activeRecipe.id] || 0;
    const effectiveCooldownMs = getEffectiveCooldown(activeRecipe.cooldownMs, activeRecipe.id);
    const recipeCdRemaining = Math.max(0, effectiveCooldownMs - (now - lastCast));
    if (recipeCdRemaining > 0) {
      const secsRemaining = (recipeCdRemaining / 1000).toFixed(1);
      elementalSound.playCooldownWarning();
      g.floatingTexts.push({
        id: `cd_charge_${now}_${activeRecipe.id}`,
        x: g.wizard.x,
        y: g.wizard.y - 32,
        text: `⏳ ${activeRecipe.name}: ${secsRemaining}s`,
        color: '#f472b6',
        fontSize: 13,
        opacity: 1,
        vy: -1.3,
        life: 38,
      });
      return;
    }

    const wizard = g.wizard;
    wizard.isCharging = true;
    wizard.chargeStartTime = Date.now();
    wizard.chargeRatio = 0;
    let cType = 'arcane';
    if (activeRecipe.id === 'elemental_cataclysm') cType = 'cataclysm';
    else if (activeRecipe.id === 'glacial_plasma_storm') cType = 'glacial_plasma';
    else if (activeRecipe.id === 'overload_core') cType = 'overload_core';
    else if (activeRecipe.id === 'conductive_prison') cType = 'conductive_prison';
    else if (activeRecipe.id === 'obsidian_volcano') cType = 'obsidian';
    else if (activeRecipe.id === 'telluric_barrier') cType = 'telluric';
    else if (activeRecipe.id === 'devastating_glacier') cType = 'glacier';
    else if (activeRecipe.id === 'celestial_storm') cType = 'celestial';
    else if (activeRecipe.id === 'hell_rain') cType = 'hell_rain';
    else if (activeRecipe.id === 'explosive_overload') cType = 'plasma';
    else if (activeRecipe.id === 'permafrost_prison') cType = 'permafrost';
    else if (activeRecipe.id === 'crystal_field') cType = 'conductive';
    else if (activeRecipe.id === 'thermal_shock') cType = 'thermal';
    else if (activeRecipe.id === 'magma_eruption') cType = 'volcanic';
    else if (activeRecipe.id === 'cryo_storm') cType = 'cryo';
    else if (activeRecipe.id === 'lightning_storm' || activeRecipe.elements.includes('lightning')) cType = 'lightning';
    else if (activeRecipe.id === 'ice_lance' || activeRecipe.elements.includes('ice')) cType = 'ice';
    else if (activeRecipe.id === 'earth_megalith' || activeRecipe.elements.includes('earth')) cType = 'earth';
    else if (activeRecipe.elements.includes('fire')) cType = 'fire';
    wizard.chargeType = cType;
    wizard.chargeSoundPlayed = false;
    setIsChargingUi(true);
    audioManager.startCharge();
  }, [activeRecipe.elements, activeRecipe.id, getEffectiveCooldown, handleAttack, isDefeated, isVictorious, startChanneledAttack]);

  const finishCharge = useCallback(() => {
    const wizard = gameStateRef.current.wizard;
    if (wizard.channeledStream.active) {
      stopChanneledAttack();
      return;
    }
    if (!wizard.isCharging) return;
    const elapsed = Date.now() - (wizard.chargeStartTime || 0);
    const hasFocusMilestone = (player.unlockedMilestones || []).includes('maestro_enfoque');
    const holdThreshold = hasFocusMilestone ? 370 : 550;
    const wasCharged = (activeRecipe.id === 'elemental_cataclysm' || activeRecipe.id === 'glacial_plasma_storm' || activeRecipe.id === 'overload_core' || activeRecipe.id === 'conductive_prison' || activeRecipe.id === 'obsidian_volcano' || activeRecipe.id === 'telluric_barrier' || activeRecipe.id === 'devastating_glacier' || activeRecipe.id === 'celestial_storm' || activeRecipe.id === 'hell_rain' || activeRecipe.id === 'explosive_overload' || activeRecipe.id === 'cryo_storm' || activeRecipe.id === 'magma_eruption' || activeRecipe.id === 'thermal_shock' || activeRecipe.id === 'crystal_field' || activeRecipe.id === 'permafrost_prison')
      ? (elapsed >= holdThreshold || wizard.chargeRatio >= 0.95)
      : (wizard.chargeRatio >= 1.0);
    const finalRatio = wizard.chargeRatio;
    wizard.isCharging = false;
    wizard.chargeRatio = 0;
    setIsChargingUi(false);
    setChargeVisualRatio(0);
    if (wasCharged) {
      audioManager.playChargeRelease();
      haptics.medium();
    } else {
      audioManager.stopCharge();
    }
    handleAttack(wasCharged, finalRatio);
  }, [activeRecipe.id, handleAttack, player.unlockedMilestones, stopChanneledAttack]);

  // Manejo de puntería manual y arrastre táctil en el botón de Ataque
  const handleAttackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Ignorar si no está soportado
      }
      attackAimRef.current = {
        active: true,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        currX: e.clientX,
        currY: e.clientY,
        isAiming: false,
      };
      startCharge();
    },
    [startCharge]
  );

  const handleAttackPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const aim = attackAimRef.current;
    if (!aim.active || aim.pointerId !== e.pointerId) return;

    aim.currX = e.clientX;
    aim.currY = e.clientY;
    const dx = e.clientX - aim.startX;
    const dy = e.clientY - aim.startY;
    const dist = Math.hypot(dx, dy);

    if (dist > 7) {
      aim.isAiming = true;
      const rawAngle = Math.atan2(dy, dx);
      const g = gameStateRef.current;
      const wizard = g.wizard;

      let finalAngle = rawAngle;
      if (wizard.channeledStream.active && (wizard.channeledStream.type === 'fire' || wizard.channeledStream.type === 'ice')) {
        const tmWheel = g.tilemap?.puzzleWheel;
        const target = findNearestCombatTarget(wizard, g.enemyManager.enemies, wizard.channeledStream.type, tmWheel, 550, rawAngle, Math.PI * 0.45);
        if (target) {
          finalAngle = target.angle;
          wizard.channeledStream.lockedEnemyId = target.id;
        } else {
          wizard.channeledStream.lockedEnemyId = null;
        }
      }
      wizard.channeledStream.aimAngle = finalAngle;
      wizard.facingAngle = finalAngle;
    }
  }, []);

  const handleAttackPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      attackAimRef.current.active = false;
      attackAimRef.current.pointerId = null;
      attackAimRef.current.isAiming = false;
      finishCharge();
    },
    [finishCharge]
  );

  // Soporte de Teclado y Ratón Completo para PC / Navegador Chrome (WASD, Flechas, 1-4, Espacio, J/Enter)
  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = 1000 / rect.width;
        const scaleY = 620 / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        const g = gameStateRef.current;
        const zoom = 1.32;
        const cx = 1000 / 2;
        const cy = 620 / 2;
        const worldX = (canvasX - cx) / zoom + g.camera.x;
        const worldY = (canvasY - cy) / zoom + g.camera.y;
        mousePosRef.current = { x: worldX, y: worldY, active: true };

        if (g.wizard.channeledStream.active) {
          const dx = worldX - g.wizard.x;
          const dy = worldY - g.wizard.y;
          if (Math.hypot(dx, dy) > 10) {
            const ang = Math.atan2(dy, dx);
            g.wizard.channeledStream.aimAngle = ang;
            g.wizard.facingAngle = ang;
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = true;

      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        handleDash();
      } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
        stopChanneledAttack();
        handleSelectElement('fire');
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        stopChanneledAttack();
        handleSelectElement('lightning');
      } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
        stopChanneledAttack();
        handleSelectElement('ice');
      } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
        stopChanneledAttack();
        handleSelectElement('earth');
      } else if (e.code === 'Backspace' || e.code === 'KeyC') {
        stopChanneledAttack();
        handleClearQueue();
      } else if (e.code === 'KeyJ' || e.code === 'Enter') {
        const isFire = activeRecipe.id === 'fire_shot';
        const isIce = activeRecipe.id === 'ice_shard';
        if (isFire) {
          startChanneledAttack('fire', 'attack');
        } else if (isIce) {
          startChanneledAttack('ice', 'attack');
        } else if (!gameStateRef.current.wizard.isCharging) {
          startCharge();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
      if (e.code === 'KeyJ' || e.code === 'Enter') {
        if (gameStateRef.current.wizard.channeledStream.active) {
          stopChanneledAttack();
        } else {
          finishCharge();
        }
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    activeRecipe.id,
    handleDash,
    handleSelectElement,
    handleClearQueue,
    startCharge,
    finishCharge,
    startChanneledAttack,
    stopChanneledAttack,
  ]);

  // Referencias para el renderizado vectorial del Joystick Dinámico Flotante y Swipe Casting
  const joystickDOMRef = useRef<HTMLDivElement | null>(null);
  const joystickKnobDOMRef = useRef<HTMLDivElement | null>(null);
  const joystickRayDOMRef = useRef<SVGLineElement | null>(null);
  const swipeActiveRef = useRef(false);
  const lastSwipedElementRef = useRef<ElementType | null>(null);

  const updateJoystickVisual = (baseX: number, baseY: number, knobX: number, knobY: number, opacity: number, pressing: boolean) => {
    const el = joystickDOMRef.current;
    if (el) {
      el.style.transform = `translate3d(${baseX - 55}px, ${baseY - 55}px, 0)`;
      el.style.opacity = `${opacity}`;
    }
    const knobEl = joystickKnobDOMRef.current;
    if (knobEl) {
      const kx = knobX - baseX;
      const ky = knobY - baseY;
      knobEl.style.transform = `translate3d(${kx}px, ${ky}px, 0) scale(${pressing ? 0.92 : 1.0})`;
    }
    const rayEl = joystickRayDOMRef.current;
    if (rayEl) {
      const kx = 55 + (knobX - baseX);
      const ky = 55 + (knobY - baseY);
      rayEl.setAttribute('x2', `${kx}`);
      rayEl.setAttribute('y2', `${ky}`);
      rayEl.setAttribute('opacity', `${Math.hypot(knobX - baseX, knobY - baseY) > 8 ? 0.85 : 0}`);
    }
  };

  // Controles de Joystick Flotante Dinámico (Mano Izquierda)
  const handleJoystickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const g = gameStateRef.current;
    if (g.wizard.isEnteringVictoryPortal || isDefeated || isVictorious) return;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignorar si no está soportado en el entorno
    }

    // Margen mínimo en X para asegurar rango físico completo hacia la izquierda
    const clampedBaseX = Math.max(55, e.clientX);

    g.joystick.active = true;
    g.joystick.touchId = e.pointerId;
    g.joystick.baseX = clampedBaseX;
    g.joystick.baseY = e.clientY;
    g.joystick.currX = e.clientX;
    g.joystick.currY = e.clientY;
    g.joystick.knobX = e.clientX;
    g.joystick.knobY = e.clientY;
    g.joystick.opacity = 1;
    g.joystick.isPressing = true;

    const el = joystickDOMRef.current;
    if (el) {
      el.style.transition = 'none';
    }
    updateJoystickVisual(clampedBaseX, e.clientY, e.clientX, e.clientY, 1, true);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gameStateRef.current;
    if (g.wizard.isEnteringVictoryPortal || isDefeated || isVictorious) return;
    if (!g.joystick.active || g.joystick.touchId !== e.pointerId) return;

    let dx = e.clientX - g.joystick.baseX;
    const dy = e.clientY - g.joystick.baseY;

    // Inversión rápida: si el jugador cambia drásticamente de dirección izquierda/derecha, recentrar la base
    if ((dx < -12 && g.joystick.vx > 0.5) || (dx > 12 && g.joystick.vx < -0.5)) {
      g.joystick.baseX = e.clientX - (dx > 0 ? 12 : -12);
      dx = e.clientX - g.joystick.baseX;
    }

    const dist = Math.hypot(dx, dy);
    const maxRadius = 42; // Radio de acción optimizado para respuesta táctil inmediata

    if (dist > maxRadius) {
      const dirX = dx / dist;
      const dirY = dy / dist;
      g.joystick.knobX = g.joystick.baseX + dirX * maxRadius;
      g.joystick.knobY = g.joystick.baseY + dirY * maxRadius;
      // Arrastre suave de la base (Follow-thumb drag)
      const overflow = dist - maxRadius;
      g.joystick.baseX += dirX * overflow * 0.35;
      g.joystick.baseY += dirY * overflow * 0.35;
    } else {
      g.joystick.knobX = e.clientX;
      g.joystick.knobY = e.clientY;
    }

    updateJoystickVisual(g.joystick.baseX, g.joystick.baseY, g.joystick.knobX, g.joystick.knobY, 1, true);

    const effDx = g.joystick.knobX - g.joystick.baseX;
    const effDy = g.joystick.knobY - g.joystick.baseY;
    const effDist = Math.hypot(effDx, effDy);

    // Zona muerta mínima de 5px para respuesta inmediata
    if (effDist < 5) {
      g.joystick.vx = 0;
      g.joystick.vy = 0;
      g.wizard.isMoving = false;
    } else {
      // Alcanza el 100% de velocidad a solo 30px de desplazamiento en cualquier dirección (izquierda/derecha simétricos)
      const normalizedDist = Math.min(1.0, (effDist - 5) / 25);
      const angle = Math.atan2(effDy, effDx);
      const moveMultiplier = (player.unlockedMilestones || []).includes('mente_inquebrantable') ? 1.15 : 1.0;
      const speed = (3.4 + player.stats.speed * 0.08) * normalizedDist * moveMultiplier;
      g.joystick.vx = Math.cos(angle) * speed;
      g.joystick.vy = Math.sin(angle) * speed;
      if (!g.wizard.channeledStream.active) {
        g.wizard.facingAngle = angle;
      }
      g.wizard.isMoving = true;
    }
  };

  const handleJoystickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gameStateRef.current;
    if (g.joystick.touchId === e.pointerId) {
      g.joystick.active = false;
      g.joystick.touchId = null;
      g.joystick.isPressing = false;
      const el = joystickDOMRef.current;
      if (el) {
        el.style.transition = 'opacity 150ms ease-out';
        el.style.opacity = '0';
      }
    }
  };

  // Manejo de Swipe-Casting (Barrido táctil continuo entre runas elementales)
  const handleElementTouchStart = (el: ElementType, e: React.PointerEvent) => {
    e.stopPropagation();
    swipeActiveRef.current = true;
    lastSwipedElementRef.current = el;
    handleSelectElement(el);
    try {
      (e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const handleArcPadPointerMove = (e: React.PointerEvent) => {
    if (!swipeActiveRef.current) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target) return;
    const btn = target.closest('[data-element]');
    if (btn) {
      const el = btn.getAttribute('data-element') as ElementType;
      if (el && el !== lastSwipedElementRef.current) {
        lastSwipedElementRef.current = el;
        handleSelectElement(el);
        haptics.selection();
      }
    }
  };

  const handleArcPadPointerUp = (e?: React.PointerEvent) => {
    swipeActiveRef.current = false;
    lastSwipedElementRef.current = null;
    if (e) {
      try {
        (e.currentTarget as HTMLElement)?.releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  // LOOP PRINCIPAL DE COMBATE (60 FPS)
  useEffect(() => {
    if (isDefeated || isVictorious || victoryCommittedRef.current) return;
    let animId: number;
    let lastFrameTimestamp = performance.now();

    const gameLoop = () => {
      try {
        const frameNow = performance.now();
        if (victoryCommittedRef.current) return;
        // El motor tiene contadores por frame: 120 Hz no debe duplicar su velocidad.
        const frameInterval = 1000 / 60;
        const elapsedFrame = frameNow - lastFrameTimestamp;
        if (elapsedFrame < frameInterval) return;
        const dt = Math.min(50, Math.max(1, elapsedFrame));
        lastFrameTimestamp = frameNow - (elapsedFrame % frameInterval);
        const dtSeconds = dt / 1000;

        const g = gameStateRef.current;
        const wizard = g.wizard;
        wizard.isCursed = !!(player.isCursed || (player.curseExpiresAt && new Date(player.curseExpiresAt).getTime() > Date.now()));
        const enemies = g.enemyManager.enemies;

        // Decrementar temporizador de frames de invulnerabilidad (i-frames) con deltaTime real
        if (wizard.invulnerableTimer && wizard.invulnerableTimer > 0) {
          wizard.invulnerableTimer = Math.max(0, wizard.invulnerableTimer - dtSeconds);
        }

        // PROCESAR ANIMACIÓN DE DERROTA Y RESPAWN EN CHECKPOINT (400ms)
        if (g.isRespawning) {
          if (g.respawnFadeTimer > 0) {
            g.respawnFadeTimer = Math.max(0, g.respawnFadeTimer - dtSeconds);
            wizard.respawnFadeTimer = g.respawnFadeTimer;
          }

          if (g.respawnFadeTimer <= 0) {
            // 1. Obtener el último checkpoint alcanzado
            const cpId = g.lastCheckpointId || 'checkpoint-0-start';
            let respawnX = 96;
            let respawnY = 96;
            let cpName = 'PUNTO DE CONTROL';

            if (g.tilemap) {
              const cp = g.tilemap.checkpoints.find((c) => c.id === cpId) || g.tilemap.checkpoints[0];
              if (cp) {
                respawnX = cp.respawnX;
                respawnY = cp.respawnY;
                cpName = cp.name;
              } else {
                respawnX = g.tilemap.spawnPoint.x;
                respawnY = g.tilemap.spawnPoint.y;
              }
            } else if (g.forestLevel) {
              const cp = g.forestLevel.checkpoints?.find((c) => c.id === cpId) || g.forestLevel.checkpoints?.[0];
              respawnX = cp ? cp.respawnX : 350;
              respawnY = cp ? cp.respawnY : 1200;
              cpName = cp ? cp.name : 'CAMPAMENTO';
            }

            // 2. Reubicar al jugador y cámara suavemente
            wizard.x = respawnX;
            wizard.y = respawnY;
            g.prevWizardX = respawnX;
            g.prevWizardY = respawnY;
            g.camera.x = respawnX;
            g.camera.y = respawnY;
            g.cameraSystem.reset(respawnX, respawnY);

            // 3. Restaurar Vida Máxima al 100%
            g.currentHp = g.maxHp;
            setCurrentHp(g.maxHp);
            player.currentHp = g.maxHp;

            // 4. Invulnerabilidad inicial de 1.5 segundos
            wizard.invulnerableTimer = 1.5;
            wizard.hitFlash = 0;
            wizard.isRespawning = false;
            wizard.respawnFadeTimer = 0;

            // 5. Limpieza de proyectiles hostiles en vuelo y efectos de daño periódico
            g.projectilePool.clear();
            g.particlePool.clear();
            g.lastFireBarrierBurnTime = 0;
            g.infernalCrowns = [];
            g.glacialEruptions = [];
            g.tectonicFists = [];
            g.cryoBeams = [];
            g.volcanicBombardments = [];
            g.thermalVortices = [];
            g.conductiveCages = [];
            g.permafrostPrisons = [];
            g.plasmaTornadoes = [];
            g.hellRains = [];
            g.celestialStorms = [];
            g.devastatingGlaciers = [];
            g.telluricBarriers = [];
            g.obsidianVolcanoes = [];
            g.conductivePrisons = [];
            g.overloadCores = [];
            g.glacialPlasmaStorms = [];
            g.elementalCataclysms = [];
            g.magmaTrenches = [];
            g.solarFusionBeams = [];
            g.glacialAvalanches = [];
            g.boilingHails = [];
            g.superconductorBlizzards = [];
            g.lightningRodPylons = [];
            g.plasmaHyperOrbs = [];
            g.cryoArcFlashes = [];
            g.rollingMagmaBoulders = [];
            g.glacialBastions = [];
            g.resonantQuakes = [];
            g.thundergodJudgments = [];
            g.primordialSupernovas = [];
            g.absoluteZeroAges = [];
            g.tectonicCataclysms = [];
            g.kineticPlasmaMeteors = [];
            g.frostburnComets = [];
            g.calderaCataclysms = [];
            g.solarArcTempests = [];
            g.cryoLightningStorms = [];
            g.tectonicLightningHammers = [];
            g.moltenBlizzards = [];
            g.superconductingNeedleStorms = [];
            g.tectonicGlacierWalls = [];
            g.primordialMagmaBastions = [];
            g.eternalPermafrostFortresses = [];
            g.magneticTelluricSpires = [];
            g.lightningBolts = [];

            // 6. Respawn de enemigos manteniendo elementos permanentes (portón abierto, rueda resuelta)
            if (g.tilemap) {
              g.enemyManager.enemies = createLevel1TilemapEnemies(g.enemyManager, g.tilemap);
            } else {
              g.enemyManager.enemies = createLevel1ForestEnemies(g.enemyManager);
            }
            g.enemyManager.currentBoss = g.enemyManager.enemies.find((e) => e.archetype === 'boss') || null;

            g.floatingTexts.push({
              id: `respawn-chime-${Date.now()}`,
              x: wizard.x,
              y: wizard.y - 30,
              text: `🛡️ ¡REAPARICIÓN EN ${cpName.toUpperCase()}! [+1.5s INVULNERABLE]`,
              color: '#38bdf8',
              fontSize: 14,
              opacity: 1,
              vy: -1.4,
              life: 55,
            });

            g.isRespawning = false;
          }
        }

        // 1. Dash y Movimiento del Mago (WASD / Flechas / Joystick)
        let keyVx = 0;
        let keyVy = 0;
        if (!g.isRespawning) {
          const keys = keysPressedRef.current;
          if (keys['KeyW'] || keys['ArrowUp']) keyVy -= 1;
          if (keys['KeyS'] || keys['ArrowDown']) keyVy += 1;
          if (keys['KeyA'] || keys['ArrowLeft']) keyVx -= 1;
          if (keys['KeyD'] || keys['ArrowRight']) keyVx += 1;
        }

      if (wizard.dashCooldown > 0) {
        wizard.dashCooldown--;
        const cdRatio = wizard.dashCooldown / wizard.dashCooldownMax;
        if (Math.abs(cdRatio - lastCdRatioRef.current) > 0.04 || wizard.dashCooldown === 0) {
          lastCdRatioRef.current = cdRatio;
          setDashCooldownRatio(cdRatio);
        }
      }

      // 1.05 Actualizar Cooldown en tiempo real del Ataque / Habilidad Activa
      wizard.hasLightningAura = (player.unlockedMilestones || []).includes('mente_inquebrantable');
      const currentRecipe = activeRecipeRef.current;
      const nowTs = Date.now();
      const lastCast = g.recipeCooldowns[currentRecipe.id] || 0;
      const effectiveCooldownMs = getEffectiveCooldown(currentRecipe.cooldownMs, currentRecipe.id);
      const attackCdRemaining = Math.max(0, effectiveCooldownMs - (nowTs - lastCast));
      const attackCdRatio = (effectiveCooldownMs > 0 && attackCdRemaining > 0)
        ? attackCdRemaining / effectiveCooldownMs
        : 0;

      if (Math.abs(attackCdRatio - lastAttackCdRatioRef.current) > 0.015 || (attackCdRatio === 0 && lastAttackCdRatioRef.current > 0)) {
        lastAttackCdRatioRef.current = attackCdRatio;
        setAttackCooldownRatio(attackCdRatio);
        setAttackCooldownSec(Math.ceil(attackCdRemaining / 100) / 10);
      }

      g.prevWizardX = wizard.x;
      g.prevWizardY = wizard.y;

      if (wizard.isDashing) {
        wizard.x += wizard.dashVx;
        wizard.y += wizard.dashVy;
        wizard.dashTimer--;

        // Guardar silueta para la estela fantasmal (Afterimages)
        if (wizard.dashTimer % 2 === 0) {
          wizard.dashTrail.push({
            x: wizard.x,
            y: wizard.y,
            facingAngle: wizard.facingAngle,
            alpha: 1.0,
          });
        }

        if (wizard.dashTimer <= 0) {
          wizard.isDashing = false;
        }
      } else if (wizard.channelLockTimer && wizard.channelLockTimer > 0) {
        wizard.channelLockTimer--;
        wizard.isMoving = false;
        wizard.vx = 0;
        wizard.vy = 0;
      } else if (keyVx !== 0 || keyVy !== 0) {
        const len = Math.hypot(keyVx, keyVy);
        const moveMultiplier = (player.unlockedMilestones || []).includes('mente_inquebrantable') ? 1.15 : 1.0;
        const speed = (3.4 + player.stats.speed * 0.08) * moveMultiplier;
        const curVx = (keyVx / len) * speed;
        const curVy = (keyVy / len) * speed;
        wizard.x += curVx;
        wizard.y += curVy;
        wizard.vx = curVx;
        wizard.vy = curVy;
        if (!wizard.channeledStream.active) {
          wizard.facingAngle = Math.atan2(keyVy, keyVx);
        }
        wizard.isMoving = true;
        wizard.animFrame += 0.2;
      } else if (g.joystick.vx !== 0 || g.joystick.vy !== 0) {
        // Desaceleración suave del joystick cuando no está presionado
        if (!g.joystick.active) {
          g.joystick.vx *= 0.82;
          g.joystick.vy *= 0.82;
          if (Math.hypot(g.joystick.vx, g.joystick.vy) < 0.06) {
            g.joystick.vx = 0;
            g.joystick.vy = 0;
          }
        }
        if (g.joystick.vx !== 0 || g.joystick.vy !== 0) {
          wizard.x += g.joystick.vx;
          wizard.y += g.joystick.vy;
          wizard.vx = g.joystick.vx;
          wizard.vy = g.joystick.vy;
          wizard.isMoving = true;
          wizard.animFrame += 0.2;
        } else {
          wizard.vx = 0;
          wizard.vy = 0;
          wizard.isMoving = false;
        }
      } else {
        wizard.vx = 0;
        wizard.vy = 0;
        wizard.isMoving = false;
      }

      // Temporizadores de Retroceso de Ataque (Recoil) y Destello Elemental (Flash)
      if (wizard.recoilTimer > 0) {
        wizard.recoilTimer -= 16.6;
        if (wizard.recoilTimer <= 0) {
          wizard.recoilX = 0;
          wizard.recoilY = 0;
        }
      }
      if (wizard.castFlashTimer > 0) {
        wizard.castFlashTimer -= 16.6;
        if (wizard.castFlashTimer <= 0) {
          wizard.castFlashColor = undefined;
        }
      }
      if (wizard.staffCastTimer > 0) wizard.staffCastTimer = Math.max(0, wizard.staffCastTimer - dt);

      // Desvanecer estela fantasmal del dash
      for (let t = wizard.dashTrail.length - 1; t >= 0; t--) {
        wizard.dashTrail[t].alpha -= 0.12;
        if (wizard.dashTrail[t].alpha <= 0) {
          wizard.dashTrail.splice(t, 1);
        }
      }

      // Actualizar Carga Mágica del Mago
      if (wizard.isCharging) {
        const isVoltaic = activeRecipe.id === 'lightning_storm';
        const isGlacial = activeRecipe.id === 'ice_lance';
        const isTectonic = activeRecipe.id === 'earth_megalith';
        const isCryo = activeRecipe.id === 'cryo_storm';
        const isVolcanic = activeRecipe.id === 'magma_eruption';
        const isThermal = activeRecipe.id === 'thermal_shock';
        const isConductive = activeRecipe.id === 'crystal_field';
        const isPermafrost = activeRecipe.id === 'permafrost_prison';
        const isPlasma = activeRecipe.id === 'explosive_overload';
        const isHellRain = activeRecipe.id === 'hell_rain';
        const isCelestial = activeRecipe.id === 'celestial_storm';
        const isGlacier = activeRecipe.id === 'devastating_glacier';
        const isTelluric = activeRecipe.id === 'telluric_barrier';
        const isObsidian = activeRecipe.id === 'obsidian_volcano';
        const isConductivePrison = activeRecipe.id === 'conductive_prison';
        const isOverloadCore = activeRecipe.id === 'overload_core';
        const isGlacialPlasma = activeRecipe.id === 'glacial_plasma_storm';
        const isCataclysm = activeRecipe.id === 'elemental_cataclysm';
        const hasFocusMilestone = (player.unlockedMilestones || []).includes('maestro_enfoque');
        const chargeSpeedMult = hasFocusMilestone ? (0.4 / 0.6) : 1.0;
        const baseChargeTime = (isCataclysm || isGlacialPlasma || isOverloadCore || isConductivePrison || isObsidian || isTelluric || isGlacier || isCelestial || isHellRain || isPlasma || isCryo || isVolcanic || isThermal || isConductive || isPermafrost) ? 500 : (isVoltaic ? 1800 : (isGlacial ? 1400 : (isTectonic ? 1400 : 380)));
        const maxChargeTime = baseChargeTime * chargeSpeedMult;
        const elapsed = Date.now() - wizard.chargeStartTime;
        wizard.chargeRatio = Math.min(1.0, elapsed / maxChargeTime);
        audioManager.updateCharge(wizard.chargeRatio);

        // Zumbido eléctrico progresivo y partículas hacia el báculo para Sobrecarga Voltaica
        if (isVoltaic) {
          if (frameNow - (g.lastVoltaicHumTime || 0) >= 75) {
            g.lastVoltaicHumTime = frameNow;
            elementalSound.playVoltaicChargeHum(wizard.chargeRatio);
          }

          if (Math.random() < 0.4 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 26;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 10 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `volt-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.0 + wizard.chargeRatio * 2.2),
              vy: -Math.sin(pAng) * (1.2 + wizard.chargeRatio * 1.3),
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.6 ? '#38bdf8' : '#ffffff',
              alpha: 1,
              life: 14,
            });
          }
        }
        // Vórtice de escarcha y cristales gélidos convergentes para Erupción Glacial
        else if (isGlacial) {
          if (Math.random() < 0.35 + wizard.chargeRatio * 0.4) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 16 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `ice-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (1.8 + wizard.chargeRatio * 2.0),
              vy: -Math.sin(pAng) * (1.0 + wizard.chargeRatio * 1.2),
              radius: 1.4 + Math.random() * 1.4,
              color: Math.random() < 0.6 ? '#e0f7fa' : '#06b6d4',
              alpha: 1,
              life: 16,
            });
          }
        }
        // Esquirlas de roca y polvo telúrico convergente para Puño Tectónico
        else if (isTectonic) {
          if (Math.random() < 0.35 + wizard.chargeRatio * 0.4) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 16 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `earth-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (1.8 + wizard.chargeRatio * 2.0),
              vy: -Math.sin(pAng) * (1.0 + wizard.chargeRatio * 1.2),
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.6 ? '#f59e0b' : '#78350f',
              alpha: 1,
              life: 16,
            });
          }
        }
        // Partículas bicolores convergentes (escarcha cian y plasma violeta) para Rayo Criogénico
        else if (isCryo) {
          if (frameNow - (g.lastCryoHumTime || 0) >= 120) {
            g.lastCryoHumTime = frameNow;
            elementalSound.playCryoBeamHum(wizard.chargeRatio >= 0.95);
          }
          if (Math.random() < 0.4 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `cryo-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.2 + wizard.chargeRatio * 2.2),
              vy: -Math.sin(pAng) * (1.2 + wizard.chargeRatio * 1.3),
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.5 ? '#00f0ff' : '#a855f7',
              alpha: 1,
              life: 14,
            });
          }
        }
        // Partículas ígneas y fragmentos de roca ardiente convergentes para Bombardeo Volcánico
        else if (isVolcanic) {
          if (Math.random() < 0.4 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `volc-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.2 + wizard.chargeRatio * 2.2),
              vy: -Math.sin(pAng) * (1.2 + wizard.chargeRatio * 1.3),
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.5 ? '#ff6d00' : '#fff176',
              alpha: 1,
              life: 14,
            });
          }
        }
        // Filamentos entrelazados de fuego y escarcha ártica convergentes para Vórtice de Choque Térmico
        else if (isThermal) {
          if (Math.random() < 0.4 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `thermal-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.2 + wizard.chargeRatio * 2.2),
              vy: -Math.sin(pAng) * (1.2 + wizard.chargeRatio * 1.3),
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.5 ? '#ff6d00' : '#80d8ff',
              alpha: 1,
              life: 14,
            });
          }
        }
        // Fragmentos de cuarzo y chispas piezoeléctricas convergentes para Jaula de Pilares Conductores
        else if (isConductive) {
          if (Math.random() < 0.4 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `conductive-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.2 + wizard.chargeRatio * 2.2),
              vy: -Math.sin(pAng) * (1.2 + wizard.chargeRatio * 1.3),
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.5 ? '#fde047' : '#38bdf8',
              alpha: 1,
              life: 14,
            });
          }
        }
        // Cristales de hielo y gravilla de pizarra convergentes para Prisión de Permafrost
        else if (isPermafrost) {
          if (Math.random() < 0.4 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `perma-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.2 + wizard.chargeRatio * 2.2),
              vy: -Math.sin(pAng) * (1.2 + wizard.chargeRatio * 1.3),
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.5 ? '#00e5ff' : '#ffffff',
              alpha: 1,
              life: 14,
            });
          }
        }
        // Torbellino de chispas de plasma y ascuas incandescentes convergentes para Tornado de Plasma
        else if (isPlasma) {
          if (Math.random() < 0.45 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `plasma-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.4 + wizard.chargeRatio * 2.4),
              vy: -Math.sin(pAng) * (1.3 + wizard.chargeRatio * 1.4),
              radius: 1.5 + Math.random() * 1.6,
              color: Math.random() < 0.5 ? '#00e5ff' : (Math.random() < 0.75 ? '#ff6d00' : '#ffffff'),
              alpha: 1,
              life: 14,
            });
          }
        }
        // Torbellino de fuego cósmico y chispas ascendentes para Lluvia del Infierno
        else if (isHellRain) {
          if (Math.random() < 0.5 + wizard.chargeRatio * 0.4) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 20 + Math.random() * 26;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `hell-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.6 + wizard.chargeRatio * 2.5),
              vy: -Math.sin(pAng) * (1.4 + wizard.chargeRatio * 1.5) - 0.8,
              radius: 1.6 + Math.random() * 1.8,
              color: Math.random() < 0.5 ? '#ff3d00' : (Math.random() < 0.8 ? '#ffd600' : '#ffffff'),
              alpha: 1,
              life: 14,
            });
          }
        }
        // Chispas eléctricas de alta tensión y arcos convergentes para Tormenta Celestial
        else if (isCelestial) {
          if (Math.random() < 0.5 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `celestial-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.8 + wizard.chargeRatio * 2.6),
              vy: -Math.sin(pAng) * (1.5 + wizard.chargeRatio * 1.5) - 0.5,
              radius: 1.5 + Math.random() * 1.7,
              color: Math.random() < 0.45 ? '#ffffff' : (Math.random() < 0.75 ? '#00f0ff' : '#7c4dff'),
              alpha: 1,
              life: 14,
            });
          }
        }
        // Copos de nieve y fragmentos de escarcha convergentes para Glaciar Devastador
        else if (isGlacier) {
          if (Math.random() < 0.5 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `glacier-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.6 + wizard.chargeRatio * 2.4),
              vy: -Math.sin(pAng) * (1.4 + wizard.chargeRatio * 1.4) - 0.4,
              radius: 1.5 + Math.random() * 1.6,
              color: Math.random() < 0.5 ? '#ffffff' : '#00e5ff',
              alpha: 1,
              life: 14,
            });
          }
        }
        // Guijarros geománticos y polvo dorado convergentes para Barrera Telúrica
        else if (isTelluric) {
          if (Math.random() < 0.5 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 24;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            g.particles.push({
              id: `telluric-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.6 + wizard.chargeRatio * 2.4),
              vy: -Math.sin(pAng) * (1.4 + wizard.chargeRatio * 1.4) - 0.4,
              radius: 1.5 + Math.random() * 1.6,
              color: Math.random() < 0.5 ? '#f59e0b' : '#fde047',
              alpha: 1,
              life: 14,
              type: 'stone_chip',
            });
          }
        }
        // Chispas de magma, escarcha gélida y polvo de obsidiana convergentes para Volcán de Obsidiana
        else if (isObsidian) {
          if (Math.random() < 0.55 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 26;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            const isFire = Math.random() < 0.45;
            const isIce = !isFire && Math.random() < 0.65;
            g.particles.push({
              id: `obs-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.8 + wizard.chargeRatio * 2.5),
              vy: -Math.sin(pAng) * (1.5 + wizard.chargeRatio * 1.5) - 0.4,
              radius: 1.5 + Math.random() * 1.8,
              color: isFire ? '#ea580c' : (isIce ? '#38bdf8' : '#09090b'),
              alpha: 1,
              life: 14,
              type: isIce ? 'ice' : (isFire ? 'ember' : 'stone_chip'),
            });
          }
        }
        // Chispas de alta tensión, fragmentos de escarcha y polvo de roca para Prisión Conductora
        else if (isConductivePrison) {
          if (Math.random() < 0.55 + wizard.chargeRatio * 0.45) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 26;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            const isLightning = Math.random() < 0.45;
            const isIce = !isLightning && Math.random() < 0.65;
            g.particles.push({
              id: `cp-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.8 + wizard.chargeRatio * 2.5),
              vy: -Math.sin(pAng) * (1.5 + wizard.chargeRatio * 1.5) - 0.4,
              radius: 1.5 + Math.random() * 1.8,
              color: isLightning ? '#b388ff' : (isIce ? '#00e5ff' : '#263238'),
              alpha: 1,
              life: 14,
              type: isIce ? 'ice' : (isLightning ? 'spark' : 'stone_chip'),
            });
          }
        }
        // Esquirlas de roca magnética, chispas eléctricas y fuego magmático hacia el báculo para Núcleo de Sobrecarga
        else if (isOverloadCore) {
          if (Math.random() < 0.6 + wizard.chargeRatio * 0.4) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 26;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            const pTypeRand = Math.random();
            const pType = pTypeRand < 0.35 ? 'spark' : (pTypeRand < 0.7 ? 'ember' : 'stone_chip');
            const pColor = pType === 'spark' ? '#ffd600' : (pType === 'ember' ? '#ff6d00' : '#263238');
            g.particles.push({
              id: `oc-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (3.0 + wizard.chargeRatio * 2.8),
              vy: -Math.sin(pAng) * (1.6 + wizard.chargeRatio * 1.6) - 0.4,
              radius: 1.5 + Math.random() * 2.0,
              color: pColor,
              alpha: 1,
              life: 14,
              type: pType,
            });
          }
        }
        // Niebla gélida cian, ascuas de fuego y chispas violetas hacia el báculo para Tormenta de Plasma Glacial
        else if (isGlacialPlasma) {
          if (Math.random() < 0.65 + wizard.chargeRatio * 0.35) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 18 + Math.random() * 26;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 12 + Math.sin(wizard.facingAngle) * 10;
            const randEl = Math.random();
            const pType = randEl < 0.33 ? 'ice' : (randEl < 0.66 ? 'ember' : 'spark');
            const pColor = pType === 'ice' ? '#00e5ff' : (pType === 'ember' ? '#ff6d00' : '#b388ff');
            g.particles.push({
              id: `gps-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (3.0 + wizard.chargeRatio * 2.8),
              vy: -Math.sin(pAng) * (1.6 + wizard.chargeRatio * 1.6) - 0.4,
              radius: 1.5 + Math.random() * 2.0,
              color: pColor,
              alpha: 1,
              life: 14,
              type: pType,
            });
          }
        }
        // Torbellino de convergencia tetra-elemental (Fuego, Rayo, Hielo, Tierra) hacia el báculo para Cataclismo Elemental
        else if (isCataclysm) {
          if (Math.random() < 0.75 + wizard.chargeRatio * 0.25) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 20 + Math.random() * 30;
            const staffX = wizard.x + Math.cos(wizard.facingAngle) * 16;
            const staffY = wizard.y - 14 + Math.sin(wizard.facingAngle) * 10;
            const col = Math.random() < 0.25 ? '#ff6d00' : (Math.random() < 0.5 ? '#ffd600' : (Math.random() < 0.75 ? '#00e5ff' : '#ffb300'));
            g.particles.push({
              id: `cat-inward-${frameNow}-${Math.random()}`,
              x: staffX + Math.cos(pAng) * pDist,
              y: staffY + Math.sin(pAng) * pDist * 0.58,
              vx: -Math.cos(pAng) * (2.8 + wizard.chargeRatio * 3.5),
              vy: -Math.sin(pAng) * (1.6 + wizard.chargeRatio * 2.0),
              radius: 1.8 + Math.random() * 2.0,
              color: col,
              alpha: 1,
              life: 14,
            });
          }
        }

        if (wizard.chargeRatio >= 1.0 && !wizard.chargeSoundPlayed) {
          wizard.chargeSoundPlayed = true;
          if (isVoltaic) {
            elementalSound.playVoltaicMaxChargeReady();
            g.screenShake = 6;
            g.particles.push({
              id: `volt-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 12,
              color: '#38bdf8',
              alpha: 1,
              life: 15,
              maxLife: 15,
              type: 'ring',
            });
          } else if (isGlacial) {
            elementalSound.playChargeReady();
            g.screenShake = 6;
            g.particles.push({
              id: `ice-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 12,
              color: '#e0f7fa',
              alpha: 1,
              life: 15,
              maxLife: 15,
              type: 'ring',
            });
          } else if (isTectonic) {
            elementalSound.playChargeReady();
            g.screenShake = 6;
            g.particles.push({
              id: `earth-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 12,
              color: '#f59e0b',
              alpha: 1,
              life: 15,
              maxLife: 15,
              type: 'ring',
            });
          } else if (isCryo) {
            elementalSound.playChargeReady();
            g.screenShake = 6.5;
            g.particles.push({
              id: `cryo-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 14,
              color: '#00f0ff',
              alpha: 1,
              life: 16,
              maxLife: 16,
              type: 'ring',
            });
          } else if (isVolcanic) {
            elementalSound.playChargeReady();
            g.screenShake = 6.5;
            g.particles.push({
              id: `volc-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 14,
              color: '#ff6d00',
              alpha: 1,
              life: 16,
              maxLife: 16,
              type: 'ring',
            });
          } else if (isThermal) {
            elementalSound.playChargeReady();
            g.screenShake = 6.5;
            g.particles.push({
              id: `thermal-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 14,
              color: '#80d8ff',
              alpha: 1,
              life: 16,
              maxLife: 16,
              type: 'ring',
            });
          } else if (isConductive) {
            elementalSound.playChargeReady();
            g.screenShake = 6.5;
            g.particles.push({
              id: `conductive-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 14,
              color: '#fde047',
              alpha: 1,
              life: 16,
              maxLife: 16,
              type: 'ring',
            });
          } else if (isPermafrost) {
            elementalSound.playChargeReady();
            g.screenShake = 6.5;
            g.particles.push({
              id: `perma-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 14,
              color: '#00e5ff',
              alpha: 1,
              life: 16,
              maxLife: 16,
              type: 'ring',
            });
          } else if (isPlasma) {
            elementalSound.playChargeReady();
            g.screenShake = 6.5;
            g.particles.push({
              id: `plasma-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 15,
              color: '#00e5ff',
              alpha: 1,
              life: 16,
              maxLife: 16,
              type: 'ring',
            });
          } else if (isHellRain) {
            elementalSound.playChargeReady();
            g.screenShake = 7.0;
            g.particles.push({
              id: `hell-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 16,
              color: '#ff3d00',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });
          } else if (isCelestial) {
            elementalSound.playChargeReady();
            g.screenShake = 7.0;
            g.particles.push({
              id: `celestial-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 16,
              color: '#00f0ff',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });
          } else if (isGlacier) {
            elementalSound.playChargeReady();
            g.screenShake = 7.0;
            g.particles.push({
              id: `glacier-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 16,
              color: '#00e5ff',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });
          } else if (isTelluric) {
            elementalSound.playChargeReady();
            g.screenShake = 7.0;
            g.particles.push({
              id: `telluric-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 16,
              color: '#f59e0b',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });
          } else if (isObsidian) {
            elementalSound.playChargeReady();
            g.screenShake = 7.5;
            g.particles.push({
              id: `obsidian-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 17,
              color: '#c026d3',
              secondaryColor: '#ea580c',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });
          } else if (isConductivePrison) {
            elementalSound.playChargeReady();
            g.screenShake = 7.5;
            g.particles.push({
              id: `cp-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 17,
              color: '#b388ff',
              secondaryColor: '#00e5ff',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });
          } else if (isOverloadCore) {
            elementalSound.playChargeReady();
            g.screenShake = 8.0;
            g.particles.push({
              id: `oc-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 18,
              color: '#ffd600',
              secondaryColor: '#ff6d00',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });
          } else if (isGlacialPlasma) {
            elementalSound.playChargeReady();
            g.screenShake = 8.0;
            g.particles.push({
              id: `gps-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 18,
              color: '#00e5ff',
              secondaryColor: '#ff6d00',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });
          } else if (isCataclysm) {
            elementalSound.playChargeReady();
            g.screenShake = 12.0;
            g.particles.push({
              id: `cat-pulse-${frameNow}`,
              x: wizard.x,
              y: wizard.y,
              vx: 0,
              vy: 0,
              radius: 36,
              color: '#ffffff',
              secondaryColor: '#ec4899',
              alpha: 1,
              life: 22,
              maxLife: 22,
              type: 'ring',
            });
          } else {
            elementalSound.playChargeReady();
          }
        }
        setChargeVisualRatio(wizard.chargeRatio);
      }

      // 1.5 Actualizar Ataque Continuo Canalizado (Fuego y Hielo)
      if (wizard.channeledStream && wizard.channeledStream.active) {
        const stream = wizard.channeledStream;
        const now = performance.now();
        const originX = wizard.x + Math.cos(stream.aimAngle) * 18;
        const originY = wizard.y - 6 + Math.sin(stream.aimAngle) * 18;

        if (wizard.isDashing) {
          stopChanneledAttack();
        } else {
          // A. Control Direccional y Apuntado Inteligente Auto-Lock
          if (attackAimRef.current.active && attackAimRef.current.isAiming) {
            const dx = attackAimRef.current.currX - attackAimRef.current.startX;
            const dy = attackAimRef.current.currY - attackAimRef.current.startY;
            if (Math.hypot(dx, dy) > 7) {
              const rawAng = Math.atan2(dy, dx);
              const tmWheel = g.tilemap?.puzzleWheel;
              const target = findNearestCombatTarget(wizard, enemies, stream.type, tmWheel, 550, rawAng, Math.PI * 0.45);
              const finalAng = target ? target.angle : rawAng;
              stream.aimAngle = finalAng;
              wizard.facingAngle = finalAng;
              if (target) stream.lockedEnemyId = target.id;
            }
          } else if (mousePosRef.current.active) {
            const dx = mousePosRef.current.x - wizard.x;
            const dy = mousePosRef.current.y - wizard.y;
            if (Math.hypot(dx, dy) > 10) {
              const ang = Math.atan2(dy, dx);
              stream.aimAngle = ang;
              wizard.facingAngle = ang;
            }
          } else {
            // Auto-aim continuo: Mantener seguimiento del objetivo bloqueado o buscar el objetivo vivo más cercano
            const tmWheel = g.tilemap?.puzzleWheel;
            let currentTarget: CombatTargetInfo | null = null;
            if (stream.lockedEnemyId) {
              if (stream.lockedEnemyId === 'puzzle_wheel' && stream.type === 'ice' && tmWheel && !tmWheel.isCompleted) {
                const wDist = Math.hypot(tmWheel.x - wizard.x, tmWheel.y - wizard.y);
                if (wDist <= 550) {
                  currentTarget = { x: tmWheel.x, y: tmWheel.y, angle: Math.atan2(tmWheel.y - wizard.y, tmWheel.x - wizard.x), dist: wDist, id: 'puzzle_wheel' };
                }
              } else {
                const lockedEnemy = enemies.find((e) => e.id === stream.lockedEnemyId && e.hp > 0);
                if (lockedEnemy) {
                  const eDist = Math.hypot(lockedEnemy.x - wizard.x, lockedEnemy.y - wizard.y);
                  if (eDist <= 550) {
                    currentTarget = { x: lockedEnemy.x, y: lockedEnemy.y, angle: Math.atan2(lockedEnemy.y - wizard.y, lockedEnemy.x - wizard.x), dist: eDist, id: lockedEnemy.id };
                  }
                }
              }
            }

            const target = currentTarget || findNearestCombatTarget(wizard, enemies, stream.type, tmWheel, 550);
            if (target) {
              stream.aimAngle = target.angle;
              wizard.facingAngle = target.angle;
              stream.lockedEnemyId = target.id;
            } else {
              stream.aimAngle = wizard.facingAngle;
              stream.lockedEnemyId = null;
            }
          }

          // B. Detección de Colisión Cónica y Daño Periódico Multi-Objetivo
          const halfArc = stream.spreadAngle / 2;
          const currentEnemiesInHitbox = new Set<string>();

          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const dx = enemy.x - originX;
            const dy = enemy.y - originY;
            const dist = Math.hypot(dx, dy);

            if (dist <= stream.range + enemy.radius) {
              const angleToEnemy = Math.atan2(dy, dx);
              let angleDiff = angleToEnemy - stream.aimAngle;
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

              const angularTolerance = halfArc + Math.asin(Math.min(0.9, enemy.radius / Math.max(dist, 1)));
              if (Math.abs(angleDiff) <= angularTolerance) {
                // Comprobar obstáculos sólidos que bloqueen la línea de visión
                let isBlocked = false;
                for (const obs of g.terrainManager.obstacles) {
                  if (!obs.solid || !obs.blocksProjectiles) continue;
                  if (obs.obstacleType === 'door_gate' && !obs.doorLocked) continue;
                  const obsDist = Math.hypot(obs.x - originX, obs.y - originY);
                  if (obsDist < dist - 15) {
                    const obsAng = Math.atan2(obs.y - originY, obs.x - originX);
                    let obsDiff = obsAng - stream.aimAngle;
                    while (obsDiff < -Math.PI) obsDiff += Math.PI * 2;
                    while (obsDiff > Math.PI) obsDiff -= Math.PI * 2;
                    if (Math.abs(obsDiff) < halfArc * 0.75) {
                      isBlocked = true;
                      break;
                    }
                  }
                }

                if (!isBlocked) {
                  currentEnemiesInHitbox.add(enemy.id);

                  // Aplicar daño a intervalos de simulación controlados
                  const lastDamage = stream.lastDamageTimestampPerEnemy[enemy.id] || 0;
                  if (now - lastDamage >= stream.damageIntervalMs) {
                    stream.lastDamageTimestampPerEnemy[enemy.id] = now;

                    const statBonus = Math.floor(player.stats.attack * 0.25 + player.stats.knowledge * 0.25);
                    const dmg = stream.damagePerTick + statBonus;
                    enemy.hp -= dmg;
                    enemy.hitFlash = 7;
                    elementalSound.playContinuousTick(stream.type);

                    if (stream.type === 'fire') {
                      g.enemyManager.applyStatus(enemy, 'burning', 150, 5);
                      g.floatingTexts.push({
                        id: `fire-tick-${now}-${enemy.id}`,
                        x: enemy.x + (Math.random() - 0.5) * 16,
                        y: enemy.y - 18,
                        text: `🔥 -${Math.round(dmg)}`,
                        color: '#f97316',
                        fontSize: 12,
                        opacity: 1,
                        vy: -1.2,
                        life: 25,
                      });
                    } else {
                      // Hielo: Aplica y refresca ralentización
                      g.enemyManager.applyStatus(enemy, 'slowed', 130);
                      if (Math.random() < 0.2) {
                        g.enemyManager.applyStatus(enemy, 'frozen', 60);
                      }
                      g.floatingTexts.push({
                        id: `ice-tick-${now}-${enemy.id}`,
                        x: enemy.x + (Math.random() - 0.5) * 16,
                        y: enemy.y - 18,
                        text: `❄️ -${Math.round(dmg)} [LENTO]`,
                        color: '#38bdf8',
                        fontSize: 12,
                        opacity: 1,
                        vy: -1.2,
                        life: 25,
                      });
                    }

                    for (let p = 0; p < 2; p++) {
                      const spAng = Math.random() * Math.PI * 2;
                      g.particles.push({
                        id: `hit-p-${now}-${enemy.id}-${p}`,
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(spAng) * 2.5,
                        vy: Math.sin(spAng) * 2.5,
                        radius: 2,
                        color: stream.type === 'fire' ? '#fdba74' : '#bae6fd',
                        alpha: 1,
                        life: 12,
                        type: stream.type === 'fire' ? 'ember' : 'ice',
                      });
                    }
                  }
                }
              }
            }
          });

          // Retirar daño periódico inmediatamente si el enemigo sale del cono
          Object.keys(stream.lastDamageTimestampPerEnemy).forEach((id) => {
            if (!currentEnemiesInHitbox.has(id)) {
              delete stream.lastDamageTimestampPerEnemy[id];
            }
          });

          // Interacción con obstáculos en el cono
          g.terrainManager.obstacles.forEach((obs) => {
            if (obs.hp <= 0) return;
            const dx = obs.x - originX;
            const dy = obs.y - originY;
            const dist = Math.hypot(dx, dy);
            if (dist <= stream.range + obs.radius) {
              const ang = Math.atan2(dy, dx);
              let diff = ang - stream.aimAngle;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              if (Math.abs(diff) <= halfArc + 0.15) {
                const lastDmg = stream.lastDamageTimestampPerObstacle[obs.id] || 0;
                if (now - lastDmg >= stream.damageIntervalMs) {
                  stream.lastDamageTimestampPerObstacle[obs.id] = now;
                  if (stream.type === 'fire') {
                    if (obs.meltable || obs.obstacleType === 'ice_wall') {
                      obs.hp = 0;
                      g.terrainManager.spawnWaterPuddle(obs.x, obs.y, 45);
                      g.floatingTexts.push({
                        id: `melt-${now}-${obs.id}`,
                        x: obs.x,
                        y: obs.y - 15,
                        text: '💧 ¡HIELO DERRETIDO!',
                        color: '#38bdf8',
                        fontSize: 12,
                        opacity: 1,
                        vy: -1.1,
                        life: 30,
                      });
                    } else if (obs.obstacleType === 'crate' || obs.obstacleType === 'permafrost_spike' || obs.obstacleType === 'vessel') {
                      obs.hp -= 20;
                    }
                  } else if (stream.type === 'ice') {
                    if (obs.obstacleType === 'crate' || obs.obstacleType === 'vessel') {
                      obs.hp -= 12;
                    }
                  }
                }
              }
            }
          });

          // Emisión continua de partículas visuales del chorro
          for (let sp = 0; sp < 2; sp++) {
            const pAng = stream.aimAngle + (Math.random() - 0.5) * stream.spreadAngle * 0.85;
            const speed = 5.5 + Math.random() * 4.0;
            g.particles.push({
              id: `stream-p-${now}-${sp}`,
              x: originX,
              y: originY,
              vx: Math.cos(pAng) * speed,
              vy: Math.sin(pAng) * speed,
              radius: stream.type === 'fire' ? 3 + Math.random() * 3.5 : 2.5 + Math.random() * 3,
              color: stream.type === 'fire' ? (Math.random() > 0.5 ? '#f97316' : '#ef4444') : (Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe'),
              alpha: 0.9,
              life: 15,
              maxLife: 15,
              type: stream.type === 'fire' ? 'ember' : 'ice',
              rotation: Math.random() * Math.PI,
              vRot: (Math.random() - 0.5) * 0.25,
            });
          }
        }
      }

      // Restricción de límites del mundo y resolución de colisiones del Tilemap
      if (g.tilemap) {
        const resolved = g.tilemap.resolveEntityCollision(wizard, 0, 0);
        wizard.x = resolved.x;
        wizard.y = resolved.y;
      } else if (g.forestLevel) {
        wizard.x = Math.max(80, Math.min(LEVEL_WIDTH - 80, wizard.x));
        wizard.y = Math.max(80, Math.min(LEVEL_HEIGHT - 80, wizard.y));
      } else {
        wizard.x = Math.max(90, Math.min(1010, wizard.x));
        wizard.y = Math.max(90, Math.min(670, wizard.y));
      }

      // Colisión con obstáculos regulares
      g.terrainManager.obstacles.forEach((obs) => {
        resolveCircleObstacleCollision(wizard, obs);

        // INTERACCIÓN CON PUERTA / PORTAL DESBLOQUEADO: Transición o Victoria
        if (obs.obstacleType === 'door_gate' && !obs.doorLocked) {
          const distToDoor = Math.hypot(wizard.x - obs.x, wizard.y - obs.y);
          if (distToDoor < 45) {
            if (obs.id === 'forest-exit-portal') {
              if (victoryCommittedRef.current) return;
              victoryCommittedRef.current = true;
              audioManager.stopAmbient();
              setIsVictorious(true);
              elementalSound.playVictory();
              onVictory(floor.floorNumber, floor.enemy.expReward * 2, floor.enemy.goldReward * 2);
              return;
            }
            changeToRoom(g.roomIndex + 1);
          }
        }

        // INTERACCIÓN CON COFRE DE RELIQUIAS EN EL SANTUARIO
        if (obs.obstacleType === 'relic_chest' && !obs.isOpened) {
          const distToChest = Math.hypot(wizard.x - obs.x, wizard.y - obs.y);
          if (distToChest < 42) {
            obs.isOpened = true;
            elementalSound.playRelicChestOpen();
            setRelicModalOpen(true);
          }
        }
      });

      // Físicas específicas del Nivel 1 del Bosque
      if (g.forestLevel) {
        const forest = g.forestLevel;

        // Troncos de árboles cercanos
        forest.trees.forEach((tree) => {
          const dx = wizard.x - tree.x;
          const dy = wizard.y - tree.y;
          const dist = Math.hypot(dx, dy);
          const minDist = wizard.radius + tree.trunkRadius;
          if (dist > 0 && dist < minDist) {
            const overlap = minDist - dist;
            wizard.x += (dx / dist) * overlap;
            wizard.y += (dy / dist) * overlap;
          }
        });

        // Muros de piedra y acantilados laterales
        forest.boundaryColliders.forEach((col) => {
          const dx = wizard.x - col.x;
          const dy = wizard.y - col.y;
          const dist = Math.hypot(dx, dy);
          const minDist = wizard.radius + col.radius;
          if (dist > 0 && dist < minDist) {
            const overlap = minDist - dist;
            wizard.x += (dx / dist) * overlap;
            wizard.y += (dy / dist) * overlap;
          }
        });

        // Colisión sólida con el Portón de Hierro cerrado
        if (forest.gateDoor.solid) {
          const gate = forest.gateDoor;
          for (let gx = gate.pillarLeftX + 20; gx <= gate.pillarRightX - 20; gx += 35) {
            const dx = wizard.x - gx;
            const dy = wizard.y - gate.y;
            const dist = Math.hypot(dx, dy);
            const minDist = wizard.radius + 20;
            if (dist > 0 && dist < minDist) {
              const overlap = minDist - dist;
              wizard.x += (dx / dist) * overlap;
              wizard.y += (dy / dist) * overlap;
            }
          }
        }

        // Colisión física y daño por fuego con las Barreras de Fuego activas
        if (forest.fireBarriers) {
          forest.fireBarriers.forEach((barrier) => {
            if (barrier.isExtinguished) return;
            const halfW = barrier.width / 2;
            const halfH = barrier.height / 2;
            const inX = Math.abs(wizard.x - barrier.x) < halfW + wizard.radius;
            const inY = Math.abs(wizard.y - barrier.y) < halfH + wizard.radius;
            if (inX && inY) {
              const overlapX = (halfW + wizard.radius) - Math.abs(wizard.x - barrier.x);
              const overlapY = (halfH + wizard.radius) - Math.abs(wizard.y - barrier.y);
              if (overlapX < overlapY) {
                wizard.x = wizard.x > barrier.x ? barrier.x + halfW + wizard.radius : barrier.x - halfW - wizard.radius;
              } else {
                wizard.y = wizard.y > barrier.y ? barrier.y + halfH + wizard.radius : barrier.y - halfH - wizard.radius;
              }

              // Daño por quemadura periódica al tocar físicamente las llamas
              if (frameNow - (g.lastFireBarrierBurnTime || 0) >= 600) {
                g.lastFireBarrierBurnTime = frameNow;
                applyDamageToPlayer(5, barrier.x, barrier.y);
                g.floatingTexts.push({
                  id: `burn_${frameNow}`,
                  x: wizard.x,
                  y: wizard.y - 24,
                  text: '-5 🔥 ¡QUEMADURA!',
                  color: '#ff4500',
                  fontSize: 13,
                  opacity: 1,
                  vy: -1.0,
                  life: 25,
                });
              }
            }
          });
        }
      }

      // SEGUIMIENTO DE CÁMARA CON ADELANTO DINÁMICO (Dynamic Lookahead / Lead Offset)
      const cCanvas = canvasRef.current;
      const viewW = cCanvas ? cCanvas.width : 1100;
      const viewH = cCanvas ? cCanvas.height : 700;
      const worldW = g.tilemap ? g.tilemap.width : g.forestLevel ? LEVEL_WIDTH : 1100;
      const worldH = g.tilemap ? g.tilemap.height : g.forestLevel ? LEVEL_HEIGHT : 800;
      const actualVx = wizard.x - g.prevWizardX;
      const actualVy = wizard.y - g.prevWizardY;

      g.cameraSystem.update(
        wizard.x,
        wizard.y,
        actualVx,
        actualVy,
        wizard.facingAngle,
        dt,
        viewW,
        viewH,
        worldW,
        worldH,
        1.32
      );

      g.camera.x = g.cameraSystem.x;
      g.camera.y = g.cameraSystem.y;

      if (g.screenShake > 0) g.screenShake *= 0.88;
      if (wizard.hitFlash > 0) wizard.hitFlash--;

      // 2. Actualizar Obstáculos y Zonas de Terreno
      g.terrainManager.update(enemies, g.floatingTexts, g.particles, g.projectiles, dt);

      // ACTUALIZAR MECÁNICAS DEL NIVEL 1 DEL BOSQUE (Puzle de Rueda + Portón + Canopy + Hojas)
      if (g.forestLevel) {
        const forest = g.forestLevel;
        const wheel = forest.puzzleWheel;
        const gate = forest.gateDoor;

        if (wheel.hitFlash > 0) wheel.hitFlash--;

        // Oclusión de Canopy de árboles (suavizado alfa al pasar por debajo)
        forest.trees.forEach((tree) => {
          const distToCanopy = Math.hypot(wizard.x - tree.x, wizard.y - (tree.y - tree.canopyHeight * 0.7));
          if (distToCanopy < tree.canopyRadius * 0.95) {
            tree.canopyAlpha += (0.65 - tree.canopyAlpha) * 0.15;
          } else if (tree.canopyAlpha < 1.0) {
            tree.canopyAlpha += (1.0 - tree.canopyAlpha) * 0.1;
          }
        });

        // Deriva de hojas ambientales
        forest.ambientLeaves.forEach((leaf) => {
          leaf.x += leaf.vx;
          leaf.y += leaf.vy + Math.sin(frameNow * 0.003 + leaf.flutterSeed) * 0.4;
          leaf.rotation += leaf.vRot;
          if (leaf.y > g.camera.y + 600) leaf.y = g.camera.y - 600;
          if (leaf.x > g.camera.x + 800) leaf.x = g.camera.x - 800;
        });

        // ACTUALIZAR Y COMPROBAR PUNTOS DE CONTROL (CHECKPOINTS DEL NIVEL 1)
        if (forest.checkpoints) {
          forest.checkpoints.forEach((cp) => {
            // Animación de partículas ascendentes doradas si está activo
            if (cp.isActive) {
              if (!cp.particles) cp.particles = [];
              if (Math.random() < 0.25 && cp.particles.length < 12) {
                cp.particles.push({
                  x: cp.x + (Math.random() - 0.5) * 24,
                  y: cp.y + 10,
                  vy: -0.6 - Math.random() * 0.8,
                  life: 35,
                  maxLife: 35,
                });
              }
              for (let pIdx = cp.particles.length - 1; pIdx >= 0; pIdx--) {
                const part = cp.particles[pIdx];
                part.y += part.vy;
                part.life--;
                if (part.life <= 0) cp.particles.splice(pIdx, 1);
              }
            }

            // Detección de proximidad para activación automática (2.0 unidades ~ 65-75px)
            const distToCp = Math.hypot(wizard.x - cp.x, wizard.y - cp.y);
            if (distToCp <= cp.activationRadius && !cp.isActive) {
              cp.isActive = true;
              g.lastCheckpointId = cp.id;
              try {
                localStorage.setItem('taskquest_level1_last_checkpoint', cp.id);
              } catch {}

              elementalSound.playRelicChestOpen();
              g.screenShake = 3;

              // Feedback visual: texto flotante
              g.floatingTexts.push({
                id: `cp-active-${Date.now()}`,
                x: cp.x,
                y: cp.y - 65,
                text: `✨ ¡PUNTO DE CONTROL GUARDADO! (${cp.name})`,
                color: '#f59e0b',
                fontSize: 14,
                opacity: 1,
                vy: -1.4,
                life: 55,
              });

              // Bono: Restaura inmediatamente el 50% de la vida faltante
              const missingHp = g.maxHp - g.currentHp;
              if (missingHp > 0) {
                const healAmt = Math.round(missingHp * 0.5);
                g.currentHp = Math.min(g.maxHp, g.currentHp + healAmt);
                setCurrentHp(g.currentHp);
                g.floatingTexts.push({
                  id: `cp-heal-${Date.now()}`,
                  x: wizard.x,
                  y: wizard.y - 25,
                  text: `💚 +${healAmt} HP RESTAURADOS (50%)`,
                  color: '#4ade80',
                  fontSize: 13,
                  opacity: 1,
                  vy: -1.2,
                  life: 45,
                });
              }
            }
          });
        }

        // INTERACCIÓN CON HIELO SOBRE LA RUEDA DENTADA
        if (!wheel.isCompleted) {
          // A. Proyectiles de Hielo (Hielo básico 'ice_shard', 'ice_lance', 'cryo_storm', etc.)
          g.projectiles.forEach((p) => {
            if (p.isHostile || p.life <= 0) return;
            const isIce = p.spellType === 'ice_shard' || p.spellType === 'ice_lance' || p.spellType === 'cryo_storm' || p.statusToApply === 'frozen';
            if (!isIce) return;

            const distToWheel = Math.hypot(p.x - wheel.x, p.y - wheel.y);
            if (distToWheel <= p.radius + wheel.radius) {
              p.life = 0; // Se consume el proyectil
              const boost = p.spellType === 'ice_lance' ? 35 : 18;
              wheel.charge = Math.min(100, wheel.charge + boost);
              wheel.rotationAngle += 0.55;
              wheel.frostVisual = Math.min(1.0, wheel.frostVisual + 0.35);
              wheel.hitFlash = 8;
              wheel.lastHitTime = frameNow;
              elementalSound.playWheelTurn(wheel.charge / 100);

              g.floatingTexts.push({
                id: `wheel-hit-${frameNow}`,
                x: wheel.x,
                y: wheel.y - 30,
                text: `+${boost}% ENGRANAJE ❄️`,
                color: '#00f0ff',
                fontSize: 13,
                opacity: 1,
                vy: -1.2,
                life: 30,
              });

              for (let sp = 0; sp < 6; sp++) {
                const spAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  id: `wheel-p-${frameNow}-${sp}`,
                  x: wheel.x,
                  y: wheel.y - 8,
                  vx: Math.cos(spAng) * 2.5,
                  vy: Math.sin(spAng) * 2.5,
                  radius: 2,
                  color: '#00f0ff',
                  alpha: 1,
                  life: 16,
                });
              }
            }
          });

          // B. Chorro Continuo de Hielo canalizado
          if (wizard.channeledStream.active && wizard.channeledStream.type === 'ice') {
            const distToWheel = Math.hypot(wheel.x - wizard.x, wheel.y - wizard.y);
            if (distToWheel <= wizard.channeledStream.range + wheel.radius) {
              let angDiff = Math.abs(Math.atan2(wheel.y - wizard.y, wheel.x - wizard.x) - wizard.channeledStream.aimAngle);
              while (angDiff > Math.PI) angDiff = Math.abs(angDiff - Math.PI * 2);
              if (angDiff <= wizard.channeledStream.spreadAngle / 2 + 0.25) {
                wheel.charge = Math.min(100, wheel.charge + dt * 0.05);
                wheel.rotationAngle += 0.05;
                wheel.frostVisual = Math.min(1.0, wheel.frostVisual + 0.01);
                wheel.lastHitTime = frameNow;
                if (Math.random() < 0.2) {
                  elementalSound.playWheelTurn(wheel.charge / 100);
                }
              }
            }
          }

          // C. Rayo Criogénico continuo
          g.cryoBeams.forEach((beam) => {
            const bx1 = wizard.x + Math.cos(beam.aimAngle) * 16;
            const by1 = wizard.y - 12 + Math.sin(beam.aimAngle) * 10;
            const bx2 = bx1 + Math.cos(beam.aimAngle) * beam.range;
            const by2 = by1 + Math.sin(beam.aimAngle) * beam.range * 0.72;
            const bdx = bx2 - bx1;
            const bdy = by2 - by1;
            const blenSq = bdx * bdx + bdy * bdy;
            const t = Math.max(0, Math.min(1, ((wheel.x - bx1) * bdx + (wheel.y - by1) * bdy) / (blenSq || 1)));
            const px = bx1 + t * bdx;
            const py = by1 + t * bdy;
            if (Math.hypot(wheel.x - px, wheel.y - py) <= beam.width * 1.5 + wheel.radius) {
              wheel.charge = Math.min(100, wheel.charge + dt * 0.08);
              wheel.rotationAngle += 0.08;
              wheel.frostVisual = Math.min(1.0, wheel.frostVisual + 0.02);
              wheel.lastHitTime = frameNow;
              if (Math.random() < 0.25) {
                elementalSound.playWheelTurn(wheel.charge / 100);
              }
            }
          });

          // D. Púas de Erupción Glacial
          g.glacialEruptions.forEach((eruption) => {
            eruption.segments.forEach((seg) => {
              if (seg.emerged && Math.hypot(seg.x - wheel.x, seg.y - wheel.y) < wheel.radius + 40) {
                wheel.charge = Math.min(100, wheel.charge + dt * 0.15);
                wheel.rotationAngle += 0.15;
                wheel.frostVisual = 1.0;
                wheel.lastHitTime = frameNow;
              }
            });
          });

          // Comprobación de completitud al 100%
          if (wheel.charge >= 100) {
            wheel.charge = 100;
            wheel.isCompleted = true;
            wheel.frostVisual = 1.0;
            elementalSound.playWheelComplete();
            elementalSound.playGateOpen();
            g.screenShake = 12;
            gate.isOpen = true;

            g.floatingTexts.push({
              id: `wheel-done-${frameNow}`,
              x: wheel.x,
              y: wheel.y - 45,
              text: '❄️ ¡MECANISMO CONGELADO! PORTÓN ABIERTO 🚪',
              color: '#38bdf8',
              fontSize: 14,
              opacity: 1,
              vy: -1.4,
              life: 50,
            });

            for (let burst = 0; burst < 16; burst++) {
              const bAng = Math.random() * Math.PI * 2;
              g.particles.push({
                id: `wheel-done-p-${frameNow}-${burst}`,
                x: wheel.x,
                y: wheel.y - 8,
                vx: Math.cos(bAng) * (2 + Math.random() * 3),
                vy: Math.sin(bAng) * (2 + Math.random() * 3),
                radius: 2.5,
                color: burst % 2 === 0 ? '#38bdf8' : '#ffffff',
                alpha: 1,
                life: 25,
              });
            }
          }
        }

        // Animación suave de apertura del Portón de Hierro
        if (gate.isOpen && gate.openProgress < 1.0) {
          gate.openProgress = Math.min(1.0, gate.openProgress + dt / 1300);
          if (gate.openProgress >= 0.85) {
            gate.solid = false; // El paso queda desbloqueado
          }
          if (Math.random() < 0.25) {
            g.particles.push({
              id: `gate-dust-${frameNow}-${Math.random()}`,
              x: gate.x + (Math.random() - 0.5) * gate.width * 0.8,
              y: gate.y + 4,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -Math.random() * 1.5,
              radius: 2,
              color: '#94a3b8',
              alpha: 0.8,
              life: 18,
            });
          }
        }

        // INTERACCIÓN CON MAGIA DE HIELO SOBRE LAS BARRERAS DE FUEGO
        if (forest.fireBarriers) {
          forest.fireBarriers.forEach((barrier) => {
            if (barrier.hitFlash > 0) barrier.hitFlash--;

            if (!barrier.isExtinguished) {
              const halfW = barrier.width / 2;
              const halfH = barrier.height / 2;

              // A. Proyectiles amigables de Hielo (ice_shard, ice_lance, cryo_storm, etc.)
              g.projectiles.forEach((p) => {
                if (p.isHostile || p.life <= 0) return;
                const isIce = p.spellType === 'ice_shard' || p.spellType === 'ice_lance' || p.spellType === 'cryo_storm' || p.statusToApply === 'frozen';
                if (!isIce) return;

                const inX = p.x >= barrier.x - halfW - p.radius && p.x <= barrier.x + halfW + p.radius;
                const inY = Math.abs(p.y - barrier.y) <= halfH + p.radius;
                if (inX && inY) {
                  p.life = 0; // Se extingue al chocar contra las llamas
                  const dmg = p.spellType === 'ice_lance' ? 55 : (p.spellType === 'cryo_storm' ? 35 : 25);
                  barrier.health = Math.max(0, barrier.health - dmg);
                  barrier.hitFlash = 12;
                  barrier.lastDamageTime = frameNow;
                  elementalSound.playFireExtinguishSizzle();

                  g.floatingTexts.push({
                    id: `ext_hit_${frameNow}_${p.id}`,
                    x: p.x,
                    y: barrier.y - 28,
                    text: `-${dmg} ❄️ ENFRIANDO`,
                    color: '#00f0ff',
                    fontSize: 13,
                    opacity: 1,
                    vy: -1.1,
                    life: 25,
                  });

                  for (let s = 0; s < 8; s++) {
                    const sAng = Math.random() * Math.PI * 2;
                    g.particles.push({
                      id: `steam_p_${frameNow}_${Math.random()}`,
                      x: p.x,
                      y: p.y,
                      vx: Math.cos(sAng) * 2.0,
                      vy: Math.sin(sAng) * 1.5 - 1.2,
                      radius: 2.5 + Math.random() * 2.0,
                      color: s % 2 === 0 ? '#e0f7fa' : '#ffffff',
                      alpha: 0.85,
                      life: 18,
                    });
                  }
                }
              });

              // B. Chorro Continuo de Hielo (Orbe de Hielo / Habilidad Canalizada)
              if (wizard.channeledStream.active && wizard.channeledStream.type === 'ice') {
                const stream = wizard.channeledStream;
                const distToBarrier = Math.hypot(barrier.x - wizard.x, (barrier.y - wizard.y) / 0.58);
                if (distToBarrier <= stream.range + halfW) {
                  const angToBarrier = Math.atan2((barrier.y - wizard.y) / 0.58, barrier.x - wizard.x);
                  let angDiff = Math.abs(angToBarrier - stream.aimAngle);
                  while (angDiff > Math.PI) angDiff = Math.abs(angDiff - Math.PI * 2);

                  if (angDiff <= stream.spreadAngle / 2 + 0.35) {
                    barrier.health = Math.max(0, barrier.health - dt * 0.08);
                    barrier.hitFlash = 5;
                    barrier.lastDamageTime = frameNow;

                    if (frameNow - (g.lastExtinguishSizzleTime || 0) >= 140) {
                      g.lastExtinguishSizzleTime = frameNow;
                      elementalSound.playFireExtinguishSizzle();
                    }

                    if (Math.random() < 0.45) {
                      g.particles.push({
                        id: `steam_c_${frameNow}_${Math.random()}`,
                        x: barrier.x + (Math.random() - 0.5) * barrier.width * 0.7,
                        y: barrier.y - 10 + (Math.random() - 0.5) * 10,
                        vx: (Math.random() - 0.5) * 1.8,
                        vy: -1.8 - Math.random() * 2.2,
                        radius: 3.0 + Math.random() * 2.5,
                        color: '#e0f7fa',
                        alpha: 0.8,
                        life: 20,
                      });
                    }
                  }
                }
              }

              // C. Rayo Criogénico continuo
              g.cryoBeams.forEach((beam) => {
                const bx1 = wizard.x + Math.cos(beam.aimAngle) * 16;
                const by1 = wizard.y - 12 + Math.sin(beam.aimAngle) * 10;
                const bx2 = bx1 + Math.cos(beam.aimAngle) * beam.range;
                const by2 = by1 + Math.sin(beam.aimAngle) * beam.range * 0.72;
                const minX = Math.min(bx1, bx2);
                const maxX = Math.max(bx1, bx2);
                if (barrier.x + halfW >= minX && barrier.x - halfW <= maxX) {
                  const bdx = bx2 - bx1;
                  const bdy = by2 - by1;
                  const t = Math.max(0, Math.min(1, ((barrier.y - by1) / (bdy || 1))));
                  const px = bx1 + t * bdx;
                  if (Math.abs(px - barrier.x) <= halfW + 15) {
                    barrier.health = Math.max(0, barrier.health - dt * 0.12);
                    barrier.hitFlash = 6;
                    barrier.lastDamageTime = frameNow;
                    if (frameNow - (g.lastExtinguishSizzleTime || 0) >= 120) {
                      g.lastExtinguishSizzleTime = frameNow;
                      elementalSound.playFireExtinguishSizzle();
                    }
                  }
                }
              });

              // D. Púas de Erupción Glacial
              g.glacialEruptions.forEach((eruption) => {
                eruption.segments.forEach((seg) => {
                  if (seg.emerged && Math.abs(seg.x - barrier.x) <= halfW + 25 && Math.abs(seg.y - barrier.y) <= halfH + 25) {
                    barrier.health = Math.max(0, barrier.health - dt * 0.18);
                    barrier.hitFlash = 8;
                    barrier.lastDamageTime = frameNow;
                  }
                });
              });

              // E. Vórtice de Choque Térmico
              g.thermalVortices.forEach((vortex) => {
                if (Math.hypot(vortex.x - barrier.x, (vortex.y - barrier.y) / 0.58) <= vortex.currentRadius + halfW) {
                  barrier.health = Math.max(0, barrier.health - dt * 0.15);
                  barrier.hitFlash = 8;
                }
              });

              // Comprobación de Extinción Total de la Barrera de Fuego
              if (barrier.health <= 0) {
                barrier.health = 0;
                barrier.isExtinguished = true;
                elementalSound.playFireBarrierExtinguished();
                g.screenShake = 9;

                g.floatingTexts.push({
                  id: `ext_done_${frameNow}_${barrier.id}`,
                  x: barrier.x,
                  y: barrier.y - 42,
                  text: '❄️ ¡BARRERA DE FUEGO EXTINTA! PASO LIBRE',
                  color: '#38bdf8',
                  fontSize: 14,
                  opacity: 1,
                  vy: -1.3,
                  life: 55,
                });

                // Erupción voluminosa de vapor blanco y chispas disipadas
                for (let s = 0; s < 26; s++) {
                  const sAng = Math.random() * Math.PI * 2;
                  const sSpd = 1.6 + Math.random() * 3.6;
                  g.particles.push({
                    id: `steam_blast_${frameNow}_${s}`,
                    x: barrier.x + (Math.random() - 0.5) * barrier.width,
                    y: barrier.y - 8,
                    vx: Math.cos(sAng) * sSpd,
                    vy: Math.sin(sAng) * sSpd * 0.58 - 1.4,
                    radius: 3.5 + Math.random() * 3.5,
                    color: s % 3 === 0 ? '#38bdf8' : (s % 2 === 0 ? '#e0f7fa' : '#ffffff'),
                    alpha: 0.95,
                    life: 28,
                  });
                }
              }
            } else {
              // Si ya está extinguida, animar extinguishProgress hacia 1.0
              if (barrier.extinguishProgress < 1.0) {
                barrier.extinguishProgress = Math.min(1.0, barrier.extinguishProgress + dt / 800);
              }
            }
          });
        }
      }

      // ACTUALIZAR MECÁNICAS DEL TILEMAP PROCEDURAL (Puzle de Hielo, Portón y Checkpoints)
      if (g.tilemap) {
        const tm = g.tilemap;
        tm.update(dtSeconds);

        // A. Puntos de control (Checkpoints)
        tm.checkpoints.forEach((cp) => {
          const distToCp = Math.hypot(wizard.x - cp.x, wizard.y - cp.y);
          if (distToCp <= cp.activationRadius && !cp.isActive) {
            cp.isActive = true;
            g.lastCheckpointId = cp.id;
            try {
              localStorage.setItem('taskquest_level1_last_checkpoint', cp.id);
            } catch {}

            elementalSound.playRelicChestOpen();
            g.screenShake = 3;

            g.floatingTexts.push({
              id: `tm-cp-active-${Date.now()}`,
              x: cp.x,
              y: cp.y - 45,
              text: `✨ ¡ALTAR RÚNICO VINCULADO! (${cp.name})`,
              color: '#f59e0b',
              fontSize: 14,
              opacity: 1,
              vy: -1.4,
              life: 55,
            });

            // Regeneración de vida faltante (50%)
            const missingHp = g.maxHp - g.currentHp;
            if (missingHp > 0) {
              const healAmt = Math.round(missingHp * 0.5);
              g.currentHp = Math.min(g.maxHp, g.currentHp + healAmt);
              setCurrentHp(g.currentHp);
              g.floatingTexts.push({
                id: `tm-cp-heal-${Date.now()}`,
                x: wizard.x,
                y: wizard.y - 25,
                text: `💚 +${healAmt} HP RESTAURADOS (50%)`,
                color: '#4ade80',
                fontSize: 13,
                opacity: 1,
                vy: -1.2,
                life: 45,
              });
            }
          }
        });

        // B. Rueda elemental de hielo del Tilemap
        const wheel = tm.puzzleWheel;
        if (!wheel.isCompleted) {
          // 1. Proyectiles de hielo
          g.projectiles.forEach((p) => {
            if (p.isHostile || p.life <= 0) return;
            const isIce = p.spellType === 'ice_shard' || p.spellType === 'ice_lance' || p.spellType === 'cryo_storm' || p.statusToApply === 'frozen';
            if (!isIce) return;

            const distToWheel = Math.hypot(p.x - wheel.x, p.y - wheel.y);
            if (distToWheel <= p.radius + 36) {
              p.life = 0;
              const boost = p.spellType === 'ice_lance' ? 35 : 20;
              wheel.charge = Math.min(100, wheel.charge + boost);
              wheel.rotation += 0.55;
              wheel.hitFlash = 8;
              elementalSound.playWheelTurn(wheel.charge / 100);

              g.floatingTexts.push({
                id: `tm-wheel-hit-${frameNow}`,
                x: wheel.x,
                y: wheel.y - 30,
                text: `+${boost}% ENGRANAJE GLACIAL ❄️`,
                color: '#00f0ff',
                fontSize: 13,
                opacity: 1,
                vy: -1.2,
                life: 30,
              });

              if (wheel.charge >= 100) {
                wheel.charge = 100;
                wheel.isCompleted = true;
                tm.openGate();
                elementalSound.playWheelComplete();
                elementalSound.playGateOpen();
                g.screenShake = 10;
                g.floatingTexts.push({
                  id: `tm-gate-unlocked-${frameNow}`,
                  x: tm.gate.col * 64 + 32,
                  y: tm.gate.row * 64 + 32,
                  text: '🔓 ¡PORTÓN DE HIELO DESBLOQUEADO!',
                  color: '#38bdf8',
                  fontSize: 16,
                  opacity: 1,
                  vy: -1.5,
                  life: 60,
                });
              }
            }
          });

          // 2. Chorro continuo de hielo canalizado
          if (wizard.channeledStream.active && wizard.channeledStream.type === 'ice') {
            const distToWheel = Math.hypot(wheel.x - wizard.x, wheel.y - wizard.y);
            if (distToWheel <= wizard.channeledStream.range + 36) {
              let angDiff = Math.abs(Math.atan2(wheel.y - wizard.y, wheel.x - wizard.x) - wizard.channeledStream.aimAngle);
              while (angDiff > Math.PI) angDiff = Math.abs(angDiff - Math.PI * 2);
              if (angDiff <= wizard.channeledStream.spreadAngle / 2 + 0.25) {
                wheel.charge = Math.min(100, wheel.charge + dt * 0.08);
                wheel.rotation += 0.05;
                if (Math.random() < 0.2) {
                  elementalSound.playWheelTurn(wheel.charge / 100);
                }
                if (wheel.charge >= 100) {
                  wheel.charge = 100;
                  wheel.isCompleted = true;
                  tm.openGate();
                  elementalSound.playWheelComplete();
                  elementalSound.playGateOpen();
                  g.screenShake = 10;
                  g.floatingTexts.push({
                    id: `tm-gate-unlocked-${frameNow}`,
                    x: tm.gate.col * 64 + 32,
                    y: tm.gate.row * 64 + 32,
                    text: '🔓 ¡PORTÓN DE HIELO DESBLOQUEADO!',
                    color: '#38bdf8',
                    fontSize: 16,
                    opacity: 1,
                    vy: -1.5,
                    life: 60,
                  });
                }
              }
            }
          }

          // 3. Rayo Criogénico continuo
          g.cryoBeams.forEach((beam) => {
            const bx1 = wizard.x + Math.cos(beam.aimAngle) * 16;
            const by1 = wizard.y - 12 + Math.sin(beam.aimAngle) * 10;
            const bx2 = bx1 + Math.cos(beam.aimAngle) * beam.range;
            const by2 = by1 + Math.sin(beam.aimAngle) * beam.range * 0.72;
            const bdx = bx2 - bx1;
            const bdy = by2 - by1;
            const blenSq = bdx * bdx + bdy * bdy;
            const t = Math.max(0, Math.min(1, ((wheel.x - bx1) * bdx + (wheel.y - by1) * bdy) / (blenSq || 1)));
            const px = bx1 + t * bdx;
            const py = by1 + t * bdy;
            if (Math.hypot(wheel.x - px, wheel.y - py) <= beam.width * 1.5 + 36) {
              wheel.charge = Math.min(100, wheel.charge + dt * 0.12);
              wheel.rotation += 0.08;
              if (Math.random() < 0.25) {
                elementalSound.playWheelTurn(wheel.charge / 100);
              }
              if (wheel.charge >= 100) {
                wheel.charge = 100;
                wheel.isCompleted = true;
                tm.openGate();
                elementalSound.playWheelComplete();
                elementalSound.playGateOpen();
                g.screenShake = 10;
                g.floatingTexts.push({
                  id: `tm-gate-unlocked-${frameNow}`,
                  x: tm.gate.col * 64 + 32,
                  y: tm.gate.row * 64 + 32,
                  text: '🔓 ¡PORTÓN DE HIELO DESBLOQUEADO!',
                  color: '#38bdf8',
                  fontSize: 16,
                  opacity: 1,
                  vy: -1.5,
                  life: 60,
                });
              }
            }
          });

          // 4. Púas de Erupción Glacial
          g.glacialEruptions.forEach((eruption) => {
            eruption.segments.forEach((seg) => {
              if (seg.emerged && Math.hypot(seg.x - wheel.x, seg.y - wheel.y) < 60) {
                wheel.charge = Math.min(100, wheel.charge + dt * 0.18);
                wheel.rotation += 0.15;
                if (wheel.charge >= 100) {
                  wheel.charge = 100;
                  wheel.isCompleted = true;
                  tm.openGate();
                  elementalSound.playWheelComplete();
                  elementalSound.playGateOpen();
                  g.screenShake = 10;
                  g.floatingTexts.push({
                    id: `tm-gate-unlocked-${frameNow}`,
                    x: tm.gate.col * 64 + 32,
                    y: tm.gate.row * 64 + 32,
                    text: '🔓 ¡PORTÓN DE HIELO DESBLOQUEADO!',
                    color: '#38bdf8',
                    fontSize: 16,
                    opacity: 1,
                    vy: -1.5,
                    life: 60,
                  });
                }
              }
            });
          });
        }
      }

      // 3. Actualizar IA de Enemigos
      g.enemyManager.update(
        wizard,
        g.projectiles,
        g.floatingTexts,
        g.terrainManager.obstacles,
        (damage, sourceX, sourceY) => {
          applyDamageToPlayer(damage, sourceX, sourceY);
        },
        (shake) => {
          g.screenShake = Math.max(g.screenShake, shake);
        }
      );

      // Colisiones de enemigos con obstáculos
      enemies.forEach((enemy) => {
        g.terrainManager.obstacles.forEach((obs) => {
          resolveCircleObstacleCollision(enemy, obs);
        });
      });

      // Repulsión física suave entre monstruos (Flocking / Soft Push) para evitar amontonamiento y superposición
      const activeEnemiesCount = enemies.length;
      for (let i = 0; i < activeEnemiesCount; i++) {
        const e1 = enemies[i];
        if (e1.hp <= 0) continue;
        for (let j = i + 1; j < activeEnemiesCount; j++) {
          const e2 = enemies[j];
          if (e2.hp <= 0) continue;

          const dx = e2.x - e1.x;
          const dy = e2.y - e1.y;
          const dist = Math.hypot(dx, dy);
          const minSeparation = e1.radius + e2.radius + ENEMY_PHYSICS_CONFIG.minSeparationPadding;

          if (dist < minSeparation && dist > 0.001) {
            const overlap = minSeparation - dist;
            const force = Math.min(overlap * ENEMY_PHYSICS_CONFIG.damping, ENEMY_PHYSICS_CONFIG.maxRepulsionForce);
            const nx = dx / dist;
            const ny = dy / dist;

            e1.x -= nx * force * 0.5;
            e1.y -= ny * force * 0.5;
            e2.x += nx * force * 0.5;
            e2.y += ny * force * 0.5;
          } else if (dist <= 0.001) {
            // Desplazar aleatoriamente si se inicializan exactamente en la misma coordenada
            const angle = Math.random() * Math.PI * 2;
            e1.x -= Math.cos(angle) * 4;
            e1.y -= Math.sin(angle) * 4;
            e2.x += Math.cos(angle) * 4;
            e2.y += Math.sin(angle) * 4;
          }
        }
      }

      // Colisión de enemigos con muros ancestrales del Tilemap
      if (g.tilemap) {
        const tm = g.tilemap;
        enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const resolved = tm.resolveEntityCollision(enemy, 0, 0);
          enemy.x = resolved.x;
          enemy.y = resolved.y;
        });

        // GESTIÓN DINÁMICA DE BGM (Exploración en sendero vs Combate heroico en arena del Custodio)
        const inArena = wizard.x >= (tm.bossArenaBounds.minX - 100);
        const targetMood = inArena && !g.isBossDefeated ? 'boss' : 'exploration';
        if (audioManager.getCurrentMood() !== targetMood) {
          audioManager.startAmbient(targetMood);
        }

        // COMPROBACIÓN DE DERROTA DEL JEFE FINAL Y ACTIVACIÓN DEL PORTAL DE VICTORIA
        const bossEnemy = enemies.find((e) => e.bossType === 'threshold_custodian');
        if (bossEnemy && (bossEnemy.hp <= 0 || bossEnemy.custodianState?.isDefeated)) {
          g.isBossDefeated = true;
          tm.victoryPortal.isActive = true;
        }

        if (g.isBossDefeated) {
          tm.victoryPortal.isActive = true;
        }

        // TRIGGER Y ANIMACIÓN DE SUCCIÓN DEL VÓRTICE DE VICTORIA (400ms)
        if (tm.victoryPortal.isActive && !isVictorious) {
          const distToPortal = Math.hypot(wizard.x - tm.victoryPortal.x, wizard.y - tm.victoryPortal.y);

          // Si el jugador entra en el radio de activación (<= 96px ~ 1.5 unidades de proximidad)
          if (distToPortal <= 96 && !wizard.isEnteringVictoryPortal) {
            wizard.isEnteringVictoryPortal = true;
            wizard.isMoving = false;
            g.joystick.active = false;
            g.joystick.vx = 0;
            g.joystick.vy = 0;
            suctionStateRef.current = {
              isSuctioning: true,
              startTime: performance.now(),
            };
          }

          // Cinemática de absorción espiralada (400ms)
          if (suctionStateRef.current.isSuctioning) {
            const elapsed = performance.now() - suctionStateRef.current.startTime;
            const progress = Math.min(1.0, elapsed / 900);

            // Reducción proporcional de escala 1.0 -> 0.0
            wizard.victoryScale = Math.max(0, 1.0 - progress);

            // Atracción continua hacia el centro exacto del vórtice
            wizard.x += (tm.victoryPortal.x - wizard.x) * 0.18;
            wizard.y += (tm.victoryPortal.y - wizard.y) * 0.18;

            // Partículas de absorción espiraladas doradas y cian
            for (let p = 0; p < 2; p++) {
              const pAngle = Math.random() * Math.PI * 2;
              const pDist = 32 * (1.0 - progress);
              g.particles.push({
                x: wizard.x + Math.cos(pAngle) * pDist,
                y: wizard.y + Math.sin(pAngle) * pDist,
                vx: -Math.sin(pAngle) * 3,
                vy: Math.cos(pAngle) * 3,
                color: Math.random() > 0.4 ? '#38bdf8' : '#fbbf24',
                radius: Math.random() * 2.5 + 1.2,
                life: 18,
                maxLife: 18,
                alpha: 1,
                type: 'spark',
              });
            }

            // Al completarse los 400ms: detonar fanfarria triunfal y abrir modal de estadísticas
            if (progress >= 1.0) {
              if (victoryCommittedRef.current) return;
              victoryCommittedRef.current = true;
              audioManager.stopAmbient();
              suctionStateRef.current.isSuctioning = false;
              wizard.victoryScale = 0;
              audioManager.playVictoryFanfare();
              elementalSound.playVictory();

              const elapsedSec = Math.max(1, Math.floor((Date.now() - runStartTimeRef.current) / 1000));
              setFinalRunTimeSec(elapsedSec);
              setTotalKillsCount(g.enemyManager.totalKills || 0);
              setIsVictorious(true);
              onVictory(floor.floorNumber, floor.enemy.expReward * 2, floor.enemy.goldReward * 2);
            }
          }
        }
      }

      // Colisión de enemigos con troncos de árboles del bosque
      if (g.forestLevel) {
        const forestTrees = g.forestLevel.trees;
        enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          forestTrees.forEach((tree) => {
            const tdx = enemy.x - tree.x;
            const tdy = enemy.y - tree.y;
            const tdist = Math.hypot(tdx, tdy);
            const minDist = enemy.radius + tree.trunkRadius;
            if (tdist > 0 && tdist < minDist) {
              const overlap = minDist - tdist;
              enemy.x += (tdx / tdist) * overlap;
              enemy.y += (tdy / tdist) * overlap;
            }
          });
        });
      }

      // Colisión física entre el mago y los monstruos (separación de círculos y daño de contacto controlado con i-frames)
      if (!g.isRespawning) {
        enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const edx = wizard.x - enemy.x;
          const edy = wizard.y - enemy.y;
          const edist = Math.hypot(edx, edy);
          const minDist = wizard.radius + enemy.radius;
          if (edist > 0 && edist < minDist) {
            const push = minDist - edist;
            const angle = Math.atan2(edy, edx);
            // Empujar a ambos suavemente para separar hitboxes y evitar superposiciones
            wizard.x += Math.cos(angle) * push * 0.55;
            wizard.y += Math.sin(angle) * push * 0.55;
            enemy.x -= Math.cos(angle) * push * 0.45;
            enemy.y -= Math.sin(angle) * push * 0.45;

            // Daño de contacto controlado (~10% HP base) si el mago no está en i-frames
            const contactDmg = Math.max(8, Math.round(enemy.attackPower * 0.5));
            applyDamageToPlayer(contactDmg, enemy.x, enemy.y);
          }
        });
      }

      // Colisión de enemigos contra Barreras de Fuego activas
      if (g.forestLevel && g.forestLevel.fireBarriers) {
        g.forestLevel.fireBarriers.forEach((barrier) => {
          if (barrier.isExtinguished) return;
          const halfW = barrier.width / 2;
          const halfH = barrier.height / 2;
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const inX = Math.abs(enemy.x - barrier.x) < halfW + enemy.radius;
            const inY = Math.abs(enemy.y - barrier.y) < halfH + enemy.radius;
            if (inX && inY) {
              const overlapX = (halfW + enemy.radius) - Math.abs(enemy.x - barrier.x);
              const overlapY = (halfH + enemy.radius) - Math.abs(enemy.y - barrier.y);
              if (overlapX < overlapY) {
                enemy.x = enemy.x > barrier.x ? barrier.x + halfW + enemy.radius : barrier.x - halfW - enemy.radius;
              } else {
                enemy.y = enemy.y > barrier.y ? barrier.y + halfH + enemy.radius : barrier.y - halfH - enemy.radius;
              }
            }
          });
        });
      }

      // 4. Actualizar Proyectiles y Colisiones (con Culling y Object Pooling)
      g.projectilePool.culling(g.camera.x, g.camera.y, 600, 420, 96);

      for (let pIdx = g.projectiles.length - 1; pIdx >= 0; pIdx--) {
        const p = g.projectiles[pIdx] as PooledProjectile;
        if (!p.active || p.life <= 0) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.vRot) {
          p.rotation = (p.rotation || 0) + p.vRot;
        }

        // Estelas de partículas en vuelo según el elemento
        if (p.spellType === 'fire_shot' || p.spellType === 'fire_inferno') {
          if (Math.random() < 0.65) {
            g.particles.push({
              id: `ftrail-${Date.now()}-${Math.random()}`,
              x: p.x - p.vx * 0.4 + (Math.random() - 0.5) * 6,
              y: p.y - p.vy * 0.4 + (Math.random() - 0.5) * 6,
              vx: -p.vx * 0.15 + (Math.random() - 0.5) * 1.0,
              vy: -p.vy * 0.15 + (Math.random() - 0.5) * 1.0,
              radius: Math.random() * 3 + 2,
              color: Math.random() > 0.4 ? '#f97316' : '#ea580c',
              alpha: 0.85,
              life: 14,
            });
          }
        } else if (p.spellType === 'ice_shard' || p.spellType === 'ice_lance') {
          if (Math.random() < 0.5) {
            g.particles.push({
              id: `itrail-${Date.now()}-${Math.random()}`,
              x: p.x - p.vx * 0.3 + (Math.random() - 0.5) * 5,
              y: p.y - p.vy * 0.3 + (Math.random() - 0.5) * 5,
              vx: -p.vx * 0.1 + (Math.random() - 0.5) * 0.8,
              vy: -p.vy * 0.1 + (Math.random() - 0.5) * 0.8,
              radius: Math.random() * 2 + 1.5,
              color: '#bae6fd',
              alpha: 0.75,
              life: 12,
            });
          }
        } else if (p.spellType === 'earth_toss' || p.spellType === 'earth_megalith') {
          if (Math.random() < 0.45) {
            g.particles.push({
              id: `etrail-${Date.now()}-${Math.random()}`,
              x: p.x - p.vx * 0.3 + (Math.random() - 0.5) * 8,
              y: p.y - p.vy * 0.3 + (Math.random() - 0.5) * 8,
              vx: (Math.random() - 0.5) * 1.2,
              vy: (Math.random() - 0.5) * 1.2,
              radius: Math.random() * 3.5 + 2,
              color: '#78716c',
              alpha: 0.6,
              life: 15,
            });
          }
        } else if (p.spellType === 'cryo_storm') {
          if (Math.random() < 0.6) {
            g.particles.push({
              id: `ctrail-${Date.now()}-${Math.random()}`,
              x: p.x + (Math.random() - 0.5) * 6,
              y: p.y + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              radius: 1.8,
              color: Math.random() > 0.5 ? '#facc15' : '#38bdf8',
              alpha: 0.9,
              life: 12,
            });
          }
        }

        // Comprobar colisión con muros ancestrales o portón cerrado del Tilemap
        if (g.tilemap && g.tilemap.blocksProjectilesAt(p.x, p.y)) {
          if (p.areaOfEffect) {
            triggerAoEExplosion(
              p,
              enemies,
              g.enemyManager,
              g.terrainManager,
              g.particles,
              g.floatingTexts,
              (amt) => {
                g.screenShake = Math.max(g.screenShake, amt);
              }
            );
          }
          if (p.spellType === 'earth_toss' || p.spellType === 'earth_megalith') {
            g.screenShake = Math.max(g.screenShake, 6);
          } else if (p.spellType === 'ice_shard' || p.spellType === 'ice_lance') {
            g.terrainManager.spawnFrostPatch(p.x, p.y, 40);
          }
          for (let s = 0; s < 6; s++) {
            const spkAng = Math.random() * Math.PI * 2;
            g.particles.push({
              id: `tm-wall-hit-${Date.now()}-${s}`,
              x: p.x,
              y: p.y,
              vx: Math.cos(spkAng) * (1.5 + Math.random() * 2),
              vy: Math.sin(spkAng) * (1.5 + Math.random() * 2),
              radius: 2,
              color: '#94a3b8',
              alpha: 1,
              life: 14,
            });
          }
          g.projectilePool.deactivate(p);
          continue;
        }

        // Comprobar colisión con obstáculos (muros, rocas, estacas)
        const hitObstacle = g.terrainManager.handleProjectileHit(
          p,
          g.floatingTexts,
          g.particles,
          enemies,
          g.projectiles
        );
        if (hitObstacle) {
          if (p.areaOfEffect) {
            triggerAoEExplosion(
              p,
              enemies,
              g.enemyManager,
              g.terrainManager,
              g.particles,
              g.floatingTexts,
              (amt) => {
                g.screenShake = Math.max(g.screenShake, amt);
              }
            );
          }
          if (p.spellType === 'earth_toss' || p.spellType === 'earth_megalith') {
            g.screenShake = Math.max(g.screenShake, 6);
            for (let s = 0; s < 8; s++) {
              const spkAng = Math.random() * Math.PI * 2;
              g.particles.push({
                id: `espk-obs-${Date.now()}-${s}`,
                x: p.x,
                y: p.y,
                vx: Math.cos(spkAng) * (2 + Math.random() * 3),
                vy: Math.sin(spkAng) * (2 + Math.random() * 3),
                radius: 3,
                color: '#78716c',
                alpha: 1,
                life: 16,
              });
            }
          } else if (p.spellType === 'ice_shard' || p.spellType === 'ice_lance') {
            g.terrainManager.spawnFrostPatch(p.x, p.y, 40);
          }
          g.projectilePool.deactivate(p);
          continue;
        }

        // Comprobar colisión e interceptación con monolitos de Prisión de Permafrost
        let hitPermafrost = false;
        for (const prison of g.permafrostPrisons) {
          if (prison.phase !== 'active' && prison.phase !== 'erupting') continue;
          for (const m of prison.monoliths) {
            if (m.shattered) continue;
            if (checkCircleCollision(p.x, p.y, p.radius, m.x, m.y, m.radius + 3)) {
              m.hp -= p.damage;
              m.hitFlash = 12;
              elementalSound.playPermafrostBlock();
              hitPermafrost = true;

              // Chispas de impacto sobre el permafrost
              for (let s = 0; s < 5; s++) {
                const sAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  x: p.x,
                  y: p.y,
                  vx: Math.cos(sAng) * 2.4,
                  vy: Math.sin(sAng) * 2.4 * 0.58,
                  radius: 1.6,
                  color: s % 2 === 0 ? '#00e5ff' : '#ffffff',
                  alpha: 1,
                  life: 14,
                  type: 'ice',
                });
              }
              break;
            }
          }
          if (hitPermafrost) break;
        }

        if (hitPermafrost) {
          g.projectilePool.deactivate(p);
          continue;
        }

        // Si es proyectil enemigo -> Daña al jugador (¡a menos que esté en Dash o i-frames!)
        if (p.isHostile) {
          if (!wizard.isDashing && checkCircleCollision(p.x, p.y, p.radius, wizard.x, wizard.y, wizard.radius)) {
            applyDamageToPlayer(p.damage, p.x, p.y);
            g.projectilePool.deactivate(p);
            continue;
          }
        }
        // Si es proyectil del jugador -> Daña a los enemigos
        else {
          for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
            const enemy = enemies[eIdx];
            if (p.piercedIds.includes(enemy.id)) continue;

            if (checkCircleCollision(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) {
              p.piercedIds.push(enemy.id);
              p.pierce--;

              // Si tiene detonación en área radial (AoE):
              if (p.areaOfEffect) {
                triggerAoEExplosion(
                  p,
                  enemies,
                  g.enemyManager,
                  g.terrainManager,
                  g.particles,
                  g.floatingTexts,
                  (amt) => {
                    g.screenShake = Math.max(g.screenShake, amt);
                  }
                );
                g.projectilePool.deactivate(p);
                break;
              }

              // Resolver elemento del proyectil según su tipo y afinidad
              const spellElem = p.element || getSpellElement(p.spellType, enemy);

              let initialDmg = p.damage;
              // Reducción si el Guardián de Basalto tiene armadura frontal activa
              if (enemy.bossType === 'basalt_guardian' && enemy.stunnedTimer === 0) {
                initialDmg *= 0.35;
              }

              // Aplicar daño elemental con matriz estricta del Bestiario
              const res = applyDamageToEnemy(enemy, initialDmg, spellElem, g.floatingTexts, p.x, p.y);

              if (res.isCritical) {
                elementalSound.playThermalShatterCrit();
              } else {
                elementalSound.playEnemyHit();
              }

              // Partículas de impacto según el elemento del proyectil
              if (p.spellType === 'fire_shot' || p.spellType === 'fire_inferno') {
                for (let s = 0; s < 10; s++) {
                  const spkAng = Math.random() * Math.PI * 2;
                  g.particles.push({
                    id: `fspk-${Date.now()}-${s}`,
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(spkAng) * (2 + Math.random() * 3),
                    vy: Math.sin(spkAng) * (2 + Math.random() * 3),
                    radius: 2 + Math.random() * 2,
                    color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
                    alpha: 1,
                    life: 16,
                  });
                }
              } else if (p.spellType === 'ice_shard' || p.spellType === 'ice_lance') {
                g.terrainManager.spawnFrostPatch(enemy.x, enemy.y, 40);
                for (let s = 0; s < 8; s++) {
                  const spkAng = Math.random() * Math.PI * 2;
                  g.particles.push({
                    id: `ispk-${Date.now()}-${s}`,
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(spkAng) * (2 + Math.random() * 3),
                    vy: Math.sin(spkAng) * (2 + Math.random() * 3),
                    radius: 2,
                    color: '#67e8f9',
                    alpha: 1,
                    life: 18,
                  });
                }
              } else if (p.spellType === 'earth_toss' || p.spellType === 'earth_megalith') {
                g.screenShake = 6;
                enemy.stunnedTimer = 25;
                for (let s = 0; s < 8; s++) {
                  const spkAng = Math.random() * Math.PI * 2;
                  g.particles.push({
                    id: `espk-${Date.now()}-${s}`,
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(spkAng) * (1.5 + Math.random() * 2.5),
                    vy: Math.sin(spkAng) * (1.5 + Math.random() * 2.5),
                    radius: 3,
                    color: '#a8a29e',
                    alpha: 0.9,
                    life: 18,
                  });
                }
              }

              // Empuje físico (mitigado si el escudo frontal bloqueó el impacto)
              if (!res.isBlocked) {
                const hitAng = Math.atan2(p.vy, p.vx);
                enemy.x += Math.cos(hitAng) * (p.knockback || 3.5);
                enemy.y += Math.sin(hitAng) * (p.knockback || 3.5);
              }

              if (p.statusToApply && !res.isImmune && !res.isAbsorbed) {
                g.enemyManager.applyStatus(enemy, p.statusToApply, 130);
              }

              if (p.onHitSpawn === 'magma_fissure') {
                g.terrainManager.spawnMagmaFissure(enemy.x, enemy.y);
              } else if (p.onHitSpawn === 'steam_blast') {
                g.terrainManager.spawnSteamBlast(enemy.x, enemy.y);
              }

              if (p.pierce <= 0) {
                g.projectilePool.deactivate(p);
                break;
              }
            }
          }
        }

        if (p.life <= 0) {
          if (p.areaOfEffect) {
            triggerAoEExplosion(
              p,
              enemies,
              g.enemyManager,
              g.terrainManager,
              g.particles,
              g.floatingTexts,
              (amt) => {
                g.screenShake = Math.max(g.screenShake, amt);
              }
            );
          }
          g.projectilePool.deactivate(p);
        }
      }

      // 4.1 Actualizar Rayos Eléctricos Instantáneos
      for (let bIdx = g.lightningBolts.length - 1; bIdx >= 0; bIdx--) {
        const bolt = g.lightningBolts[bIdx];
        bolt.life--;
        if (bolt.life <= 0) {
          g.lightningBolts.splice(bIdx, 1);
        }
      }

      // 4.2 Actualizar Pilar Ígneo (Fuego + Fuego: Runa -> Detonación Columna -> Suelo Ardiente)
      for (let cIdx = g.infernalCrowns.length - 1; cIdx >= 0; cIdx--) {
        const crown = g.infernalCrowns[cIdx];
        crown.phaseTimer += dt;

        // FASE 1: CONJURACIÓN Y RUNA (0 a 250 ms)
        if (crown.phase === 'preparation') {
          const prog = Math.min(1, crown.phaseTimer / crown.prepDurationMs);
          crown.currentRadius = 15 + (crown.maxRadius - 15) * prog;

          // Partículas sutiles de ascuas ascendentes que anticipan el estallido
          if (Math.random() < 0.4) {
            const rndAng = Math.random() * Math.PI * 2;
            const rndDist = Math.random() * crown.currentRadius;
            g.particles.push({
              id: `cr-prep-ember-${frameNow}-${Math.random()}`,
              x: crown.x + Math.cos(rndAng) * rndDist,
              y: crown.y + Math.sin(rndAng) * rndDist * 0.58,
              vx: (Math.random() - 0.5) * 0.9,
              vy: -2.0 - Math.random() * 2.2,
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.6 ? '#f97316' : '#fef08a',
              alpha: 1,
              life: 18,
            });
          }

          if (crown.phaseTimer >= crown.prepDurationMs) {
            // ¡DETONACIÓN INSTANTÁNEA DEL PILAR ÍGNEO!
            crown.phase = 'detonation';
            crown.phaseTimer = 0;
            crown.hasDetonated = true;
            crown.currentRadius = crown.maxRadius;

            // Audio: detonación sorda y profunda de combustión
            audioManager.playFirePillarDetonation();
            elementalSound.playInfernalCrownDetonation();
            g.screenShake = Math.max(g.screenShake, crown.isCharged ? 14 : 11);

            const blastRadius = crown.maxRadius;
            const initialDamage = Math.round(crown.detonationDamage);

            // Impacto explosivo a enemigos en el radio
            enemies.forEach((enemy) => {
              const dist = Math.hypot(enemy.x - crown.x, (enemy.y - crown.y) / 0.58);
              if (dist <= blastRadius + enemy.radius) {
                crown.lastDamagePerEnemy[enemy.id] = frameNow;

                // Afinidad: Gólem de Escoria Ígnea
                if (enemy.bestiaryType === 'pyre_golem' || enemy.avatar === '🔥🪨') {
                  enemy.frenzyTimer = 180; // Aceleración / frenesí
                  const heal = Math.max(1, Math.round(initialDamage * 0.35));
                  enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
                  enemy.hitFlash = 6;
                  g.floatingTexts.push({
                    id: `cr-absorb-${frameNow}-${enemy.id}`,
                    x: enemy.x,
                    y: enemy.y - 24,
                    text: `🔥 ¡ABSORBE! (+${heal})`,
                    color: '#ff6d00',
                    fontSize: 14,
                    opacity: 1,
                    vy: -1.6,
                    life: 40,
                  });
                }
                // Afinidad: Acechador de Escarcha (Quiebre de armadura y daño crítico de vulnerabilidad)
                else if (enemy.bestiaryType === 'frost_lurker' || enemy.avatar === '❄️🕷️' || enemy.weakness === 'fire') {
                  enemy.shieldBrokenTimer = 240; // Quiebre de coraza
                  const critDmg = Math.round(initialDamage * 1.85);
                  enemy.hp -= critDmg;
                  enemy.hitFlash = 16;
                  enemy.stunnedTimer = 20;
                  g.enemyManager.applyStatus(enemy, 'burning', 240, 8);
                  g.floatingTexts.push({
                    id: `cr-frost-crit-${frameNow}-${enemy.id}`,
                    x: enemy.x,
                    y: enemy.y - 26,
                    text: `💥 ¡ARMADURA QUEBRADA! -${critDmg}`,
                    color: '#fef08a',
                    fontSize: 15,
                    opacity: 1,
                    vy: -1.8,
                    life: 45,
                  });
                }
                // Enemigos ligeros (Espectro de Tormenta, etc.) y estándar
                else {
                  enemy.hp -= initialDamage;
                  enemy.hitFlash = 14;
                  enemy.stunnedTimer = 18;
                  g.enemyManager.applyStatus(enemy, 'burning', 240, 7);

                  // Micro-knockback radial que dispersa a los enemigos
                  const knockAng = Math.atan2((enemy.y - crown.y) / 0.58, enemy.x - crown.x);
                  const knockForce = crown.knockback * 3.5;
                  enemy.x += Math.cos(knockAng) * knockForce;
                  enemy.y += Math.sin(knockAng) * knockForce * 0.58;

                  g.floatingTexts.push({
                    id: `cr-det-hit-${frameNow}-${enemy.id}`,
                    x: enemy.x,
                    y: enemy.y - 22,
                    text: `💥 -${initialDamage}`,
                    color: '#f97316',
                    fontSize: 14,
                    opacity: 1,
                    vy: -1.5,
                    life: 35,
                  });
                }
              }
            });

            // Daño a obstáculos rompibles
            g.terrainManager.obstacles.forEach((obs) => {
              const dist = Math.hypot(obs.x - crown.x, (obs.y - crown.y) / 0.58);
              if (dist <= blastRadius + obs.radius) {
                obs.hp -= initialDamage * 0.8;
              }
            });

            // Anillo de onda de choque expansivo
            g.particles.push({
              id: `cr-shockwave-${frameNow}`,
              x: crown.x,
              y: crown.y,
              vx: 0,
              vy: 0,
              radius: 12,
              color: '#ffffff',
              alpha: 1,
              life: 16,
              maxLife: 16,
              type: 'ring',
            });

            // Partículas explosivas iniciales de llamas
            for (let p = 0; p < 18; p++) {
              const pAng = (p / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
              const pSpeed = 3.5 + Math.random() * 4.5;
              g.particles.push({
                id: `cr-pillar-burst-${frameNow}-${p}`,
                x: crown.x,
                y: crown.y,
                vx: Math.cos(pAng) * pSpeed,
                vy: Math.sin(pAng) * pSpeed * 0.58 - (2.0 + Math.random() * 2.5),
                radius: 2.5 + Math.random() * 2.5,
                color: p % 2 === 0 ? '#fef08a' : (p % 3 === 0 ? '#ef4444' : '#f97316'),
                alpha: 1,
                life: 22 + Math.floor(Math.random() * 12),
              });
            }
          }
        }

        // FASE 2: DETONACIÓN DEL PILAR (250 a 600 ms, duración 350 ms)
        else if (crown.phase === 'detonation') {
          crown.currentRadius = crown.maxRadius;

          // Ascuas y chispas ascendentes a gran velocidad mientras la columna está activa
          if (Math.random() < 0.75) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = Math.random() * (crown.maxRadius * 0.7);
            g.particles.push({
              id: `cr-geyser-ember-${frameNow}-${Math.random()}`,
              x: crown.x + Math.cos(pAng) * pDist,
              y: crown.y + Math.sin(pAng) * pDist * 0.58,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -4.5 - Math.random() * 4.0,
              radius: 2 + Math.random() * 2.5,
              color: Math.random() < 0.5 ? '#fef08a' : '#ea580c',
              alpha: 1,
              life: 20,
            });
          }

          // Si un enemigo nuevo entra al pilar durante la erupción, recibe impacto
          enemies.forEach((enemy) => {
            const dist = Math.hypot(enemy.x - crown.x, (enemy.y - crown.y) / 0.58);
            if (dist <= crown.maxRadius + enemy.radius && !crown.lastDamagePerEnemy[enemy.id]) {
              crown.lastDamagePerEnemy[enemy.id] = frameNow;
              const hitDmg = Math.round(crown.detonationDamage * 0.8);
              enemy.hp -= hitDmg;
              enemy.hitFlash = 10;
              g.enemyManager.applyStatus(enemy, 'burning', 200, 6);
              g.floatingTexts.push({
                id: `cr-pillar-enter-${frameNow}-${enemy.id}`,
                x: enemy.x,
                y: enemy.y - 20,
                text: `🔥 -${hitDmg}`,
                color: '#f97316',
                fontSize: 13,
                opacity: 1,
                vy: -1.3,
                life: 30,
              });
            }
          });

          if (crown.phaseTimer >= crown.detonationDurationMs) {
            crown.phase = 'ring'; // Transición al suelo ardiente residual
            crown.phaseTimer = 0;
          }
        }

        // FASE 3: SUELO ARDIENTE RESIDUAL (600 a 3000 ms, duración 2400 ms)
        else if (crown.phase === 'ring') {
          crown.currentRadius = crown.maxRadius;

          // Daño periódico cada periodicIntervalMs (400 ms) a enemigos dentro del cráter
          enemies.forEach((enemy) => {
            const dist = Math.hypot(enemy.x - crown.x, (enemy.y - crown.y) / 0.58);
            if (dist <= crown.maxRadius + enemy.radius) {
              const lastTick = crown.lastDamagePerEnemy[enemy.id] || 0;
              if (frameNow - lastTick >= crown.periodicIntervalMs) {
                crown.lastDamagePerEnemy[enemy.id] = frameNow;

                if (enemy.bestiaryType === 'pyre_golem' || enemy.avatar === '🔥🪨') {
                  enemy.hp = Math.min(enemy.maxHp, enemy.hp + 6);
                } else {
                  const dmg = Math.round(crown.periodicDamage);
                  enemy.hp -= dmg;
                  enemy.hitFlash = 7;
                  g.enemyManager.applyStatus(enemy, 'burning', 180, 5);
                  elementalSound.playContinuousTick('fire');
                  g.floatingTexts.push({
                    id: `cr-crater-tick-${frameNow}-${enemy.id}`,
                    x: enemy.x + (Math.random() - 0.5) * 12,
                    y: enemy.y - 18,
                    text: `🔥 -${dmg}`,
                    color: '#ea580c',
                    fontSize: 12,
                    opacity: 1,
                    vy: -1.2,
                    life: 26,
                  });
                }
              }
            }
          });

          // Pavesas flotantes sutiles del suelo caliente
          if (Math.random() < 0.35) {
            const rAng = Math.random() * Math.PI * 2;
            const rDist = Math.random() * (crown.maxRadius * 0.85);
            g.particles.push({
              id: `cr-residual-ember-${frameNow}-${Math.random()}`,
              x: crown.x + Math.cos(rAng) * rDist,
              y: crown.y + Math.sin(rAng) * rDist * 0.58,
              vx: (Math.random() - 0.5) * 0.7,
              vy: -1.2 - Math.random() * 1.5,
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.6 ? '#f97316' : '#78350f',
              alpha: 0.8,
              life: 24,
            });
          }

          if (crown.phaseTimer >= crown.ringDurationMs) {
            crown.phase = 'finished';
          }
        }

        // Remoción al completar el ciclo de vida
        if (crown.phase === 'finished') {
          g.infernalCrowns.splice(cIdx, 1);
        }
      }

      // 4.3 Actualizar Sobrecarga Voltaica (Rayo + Rayo: Rayos Encadenados Secuenciales y Remate)
      for (let cIdx = g.voltaicChains.length - 1; cIdx >= 0; cIdx--) {
        const chain = g.voltaicChains[cIdx];
        chain.elapsedMs += dt;

        let allStruck = true;

        for (let jIdx = 0; jIdx < chain.jumps.length; jIdx++) {
          const jump = chain.jumps[jIdx];
          if (jump.struck) continue;

          if (chain.elapsedMs >= jump.delayMs) {
            jump.struck = true;

            const enemy = g.enemyManager.enemies.find((e) => e.id === jump.targetEnemyId);
            const targetX = enemy ? enemy.x : jump.toX;
            const targetY = enemy ? enemy.y : jump.toY;
            const isPrimary = jIdx === 0;

            // 1. Generación de rayos y efectos visuales
            if (isPrimary && jump.isMaxCharge) {
              // Relámpago celestial colosal
              const celestialBolt = generateCelestialLightningBolt(targetX, targetY);
              g.lightningBolts.push(celestialBolt);

              // Rayo directo desde el báculo
              const primaryBolt = generateLightningBolt(jump.fromX, jump.fromY, targetX, targetY, '#ffffff', '#38bdf8');
              primaryBolt.life = 10;
              primaryBolt.maxLife = 10;
              g.lightningBolts.push(primaryBolt);

              elementalSound.playVoltaicThunderFinish();
              g.screenShake = Math.max(g.screenShake, 14);

              // Anillo de choque eléctrico
              g.particles.push({
                id: `volt-ring-${frameNow}`,
                x: targetX,
                y: targetY,
                vx: 0,
                vy: 0,
                radius: 14,
                color: '#38bdf8',
                alpha: 1,
                life: 16,
                maxLife: 16,
                type: 'ring',
              });
            } else {
              // Salto encadenado o primario normal
              const jumpBolt = generateLightningBolt(
                jump.fromX,
                jump.fromY,
                targetX,
                targetY,
                jump.isMaxCharge ? '#38bdf8' : '#facc15',
                jump.isMaxCharge ? '#ffffff' : '#67e8f9'
              );
              jumpBolt.life = 8;
              jumpBolt.maxLife = 8;
              g.lightningBolts.push(jumpBolt);

              elementalSound.playVoltaicChainZap(jIdx);
            }

            // 2. Aplicar Daño y Efectos al Objetivo si continúa vivo
            if (enemy && enemy.hp > 0) {
              enemy.hp -= jump.damage;
              enemy.hitFlash = 12;
              enemy.stunnedTimer = jump.isMaxCharge ? 45 : 30;
              g.enemyManager.applyStatus(enemy, 'shocked', 160);

              const kAng = Math.atan2(targetY - jump.fromY, targetX - jump.fromX);
              const knockAmt = jump.isMaxCharge ? 4.5 : 2.5;
              enemy.x += Math.cos(kAng) * knockAmt;
              enemy.y += Math.sin(kAng) * knockAmt;

              g.floatingTexts.push({
                id: `volt-txt-${frameNow}-${jIdx}`,
                x: enemy.x + (Math.random() - 0.5) * 12,
                y: enemy.y - 18,
                text: isPrimary && jump.isMaxCharge ? `⚡ ¡TRUENO +50%! -${jump.damage}` : `⚡ -${jump.damage}`,
                color: jump.isMaxCharge ? '#ffffff' : '#38bdf8',
                fontSize: isPrimary && jump.isMaxCharge ? 14 : 12,
                opacity: 1,
                vy: -1.3,
                life: 35,
              });

              const sparkCount = isPrimary && jump.isMaxCharge ? 18 : 8;
              for (let s = 0; s < sparkCount; s++) {
                const sAng = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * (jump.isMaxCharge ? 5 : 3);
                g.particles.push({
                  id: `volt-spark-${frameNow}-${jIdx}-${s}`,
                  x: targetX,
                  y: targetY,
                  vx: Math.cos(sAng) * spd,
                  vy: Math.sin(sAng) * spd,
                  radius: 1.5 + Math.random() * 2,
                  color: s % 2 === 0 ? '#ffffff' : '#38bdf8',
                  alpha: 1,
                  life: 16,
                });
              }
            }

            // 3. Remate de Carga Máxima en el último salto alcanzado
            if (jump.isFinishRemate) {
              g.screenShake = Math.max(g.screenShake, 8);
              elementalSound.playVoltaicThunderFinish();

              for (let fs = 0; fs < 14; fs++) {
                const fsAng = (fs / 14) * Math.PI * 2;
                const fsSpeed = 3.5 + Math.random() * 3.5;
                g.particles.push({
                  id: `volt-finish-${frameNow}-${fs}`,
                  x: targetX,
                  y: targetY,
                  vx: Math.cos(fsAng) * fsSpeed,
                  vy: Math.sin(fsAng) * fsSpeed,
                  radius: 2.5 + Math.random() * 2,
                  color: '#facc15',
                  alpha: 1,
                  life: 20,
                });
              }

              g.floatingTexts.push({
                id: `volt-remate-${frameNow}`,
                x: targetX,
                y: targetY - 30,
                text: '⚡ ¡REMATE VOLTAICO!',
                color: '#38bdf8',
                fontSize: 13,
                opacity: 1,
                vy: -1.5,
                life: 35,
              });
            }
          } else {
            allStruck = false;
          }
        }

        const lastJumpDelay = chain.jumps.length > 0 ? chain.jumps[chain.jumps.length - 1].delayMs : 0;
        if (allStruck && chain.elapsedMs >= lastJumpDelay + 120) {
          chain.finished = true;
        }

        if (chain.finished) {
          g.voltaicChains.splice(cIdx, 1);
        }
      }

      // 4.4 Actualizar Erupción Glacial (Hielo + Hielo: Púas escalonadas, congelación progresiva y shatter)
      for (let gIdx = g.glacialEruptions.length - 1; gIdx >= 0; gIdx--) {
        const eruption = g.glacialEruptions[gIdx];
        eruption.elapsedMs += dt;
        eruption.phaseTimer += dt;

        // FASE 1: EMERGING (Emersión secuencial de púas con hitbox e impulso)
        if (eruption.phase === 'emerging') {
          let allEmerged = true;

          for (let s = 0; s < eruption.segments.length; s++) {
            const seg = eruption.segments[s];

            if (!seg.emerged) {
              if (eruption.elapsedMs >= seg.emergeDelayMs) {
                seg.emerged = true;
                elementalSound.playGlacialSpikeErupt(seg.index);
                g.screenShake = Math.max(g.screenShake, eruption.isCharged ? 5.5 : 3.5);

                // Partículas de estallido del suelo
                for (let p = 0; p < 7; p++) {
                  const pAng = Math.random() * Math.PI * 2;
                  const pSpd = 1.5 + Math.random() * 3.5;
                  g.particles.push({
                    id: `gsp-${frameNow}-${s}-${p}`,
                    x: seg.x,
                    y: seg.y,
                    vx: Math.cos(pAng) * pSpd,
                    vy: Math.sin(pAng) * pSpd * 0.58 - (2 + Math.random() * 2),
                    radius: 1.5 + Math.random() * 1.8,
                    color: Math.random() < 0.5 ? '#ffffff' : (Math.random() < 0.5 ? '#e0f7fa' : '#38bdf8'),
                    alpha: 1,
                    life: 20,
                  });
                }

                // Detección de impacto en enemigos dentro del radio de esta púa
                const hitRadius = seg.width * 1.5 + 20;
                for (const enemy of g.enemyManager.enemies) {
                  if (enemy.hp <= 0 || eruption.hitEnemyIds.includes(enemy.id)) continue;
                  const d = Math.hypot(enemy.x - seg.x, (enemy.y - seg.y) / 0.58);
                  if (d <= enemy.radius + hitRadius) {
                    eruption.hitEnemyIds.push(enemy.id);
                    enemy.hp -= eruption.damage;
                    enemy.hitFlash = 12;

                    // Impulso y elevación en la dirección de la erupción
                    const pushDist = eruption.knockup * (eruption.isCharged ? 4.8 : 3.6);
                    enemy.x += Math.cos(eruption.aimAngle) * pushDist;
                    enemy.y += Math.sin(eruption.aimAngle) * pushDist * 0.58;

                    // Acumulación de Congelación:
                    // Si ya tenía slowed o frozen, alcanza 100% y se congela en un bloque sólido
                    const hasSlowOrFreeze = enemy.statuses.some((st) => st.type === 'slowed' || st.type === 'frozen');
                    if (hasSlowOrFreeze) {
                      g.enemyManager.applyStatus(enemy, 'frozen', 95);
                      elementalSound.playGlacialFreezeImpact();
                      g.floatingTexts.push({
                        id: `gl-fz-${frameNow}-${enemy.id}`,
                        x: enemy.x,
                        y: enemy.y - 20,
                        text: `🧊 -${eruption.damage} [¡CONGELADO TOTAL!]`,
                        color: '#e0f7fa',
                        fontSize: 13,
                        opacity: 1,
                        vy: -1.3,
                        life: 38,
                      });
                    } else {
                      g.enemyManager.applyStatus(enemy, 'slowed', 160);
                      enemy.stunnedTimer = 25;
                      g.floatingTexts.push({
                        id: `gl-sl-${frameNow}-${enemy.id}`,
                        x: enemy.x,
                        y: enemy.y - 18,
                        text: `❄️ -${eruption.damage} [RALENTIZADO]`,
                        color: '#38bdf8',
                        fontSize: 12,
                        opacity: 1,
                        vy: -1.2,
                        life: 34,
                      });
                    }

                    // Chispas de impacto helado
                    for (let h = 0; h < 6; h++) {
                      const hAng = Math.random() * Math.PI * 2;
                      g.particles.push({
                        id: `ghit-${frameNow}-${enemy.id}-${h}`,
                        x: enemy.x,
                        y: enemy.y - 10,
                        vx: Math.cos(hAng) * 3,
                        vy: Math.sin(hAng) * 3,
                        radius: 1.8,
                        color: '#06b6d4',
                        alpha: 1,
                        life: 16,
                      });
                    }
                  }
                }

                // Dañar o destruir obstáculos físicos
                g.terrainManager.obstacles.forEach((obs) => {
                  const d = Math.hypot(obs.x - seg.x, (obs.y - seg.y) / 0.58);
                  if (d <= obs.radius + hitRadius) {
                    obs.hp -= eruption.damage;
                  }
                });
              } else {
                allEmerged = false;
              }
            }

            // Animación de crecimiento de altura
            if (seg.emerged && seg.currentHeight < seg.maxHeight) {
              seg.currentHeight = Math.min(seg.maxHeight, seg.currentHeight + (seg.maxHeight / 5));
            }
          }

          // Si todas las púas han emergido y alcanzado altura completa
          const allGrown = eruption.segments.every((s) => s.emerged && s.currentHeight >= s.maxHeight * 0.95);
          if (allEmerged && allGrown) {
            eruption.phase = 'persisting';
            eruption.phaseTimer = 0;
          }
        }

        // FASE 2: PERSISTING (Púas firmes y niebla gélida)
        else if (eruption.phase === 'persisting') {
          // Vaho gélido sutil
          if (Math.random() < 0.25 && eruption.segments.length > 0) {
            const randSeg = eruption.segments[Math.floor(Math.random() * eruption.segments.length)];
            g.particles.push({
              id: `gm-mist-${frameNow}-${Math.random()}`,
              x: randSeg.x + (Math.random() - 0.5) * 16,
              y: randSeg.y - randSeg.currentHeight * 0.4,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -0.6 - Math.random() * 0.8,
              radius: 2 + Math.random() * 2.5,
              color: '#e0f7fa',
              alpha: 0.6,
              life: 25,
            });
          }

          if (eruption.phaseTimer >= eruption.persistDurationMs) {
            eruption.phase = 'shattering';
            eruption.phaseTimer = 0;
            elementalSound.playGlacialShatter();
            g.screenShake = Math.max(g.screenShake, 5);

            // Explosión de esquirlas de cristal
            eruption.segments.forEach((seg) => {
              for (let s = 0; s < 4; s++) {
                const sAng = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 3.5;
                g.particles.push({
                  id: `shatter-${frameNow}-${seg.index}-${s}`,
                  x: seg.x,
                  y: seg.y - seg.currentHeight * 0.5,
                  vx: Math.cos(sAng) * spd,
                  vy: Math.sin(sAng) * spd * 0.6 - 1.5,
                  radius: 1.5 + Math.random() * 1.5,
                  color: Math.random() < 0.6 ? '#ffffff' : '#38bdf8',
                  alpha: 1,
                  life: 18,
                });
              }
            });
          }
        }

        // FASE 3: SHATTERING (Desintegración en esquirlas brillantes)
        else if (eruption.phase === 'shattering') {
          const prog = Math.min(1, eruption.phaseTimer / eruption.shatterDurationMs);
          eruption.segments.forEach((seg) => {
            seg.shatterProgress = prog;
          });

          if (eruption.phaseTimer >= eruption.shatterDurationMs) {
            eruption.phase = 'finished';
          }
        }

        if (eruption.phase === 'finished') {
          g.glacialEruptions.splice(gIdx, 1);
        }
      }

      // 4.5 Actualizar Puño Tectónico (Tierra + Tierra: Advertencia, Golpe Uppercut, Elevación y Escombros)
      for (let fIdx = g.tectonicFists.length - 1; fIdx >= 0; fIdx--) {
        const fist = g.tectonicFists[fIdx];
        fist.phaseTimer += dt;

        // FASE A: ADVERTENCIA SÍSMICA (220 ms)
        if (fist.phase === 'warning') {
          // Partículas sutiles de polvo levantándose del suelo agrietado
          if (Math.random() < 0.4) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = Math.random() * fist.radius * 0.8;
            g.particles.push({
              id: `fist-warn-${frameNow}-${Math.random()}`,
              x: fist.targetX + Math.cos(pAng) * pDist,
              y: fist.targetY + Math.sin(pAng) * pDist * 0.58,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -0.8 - Math.random() * 1.2,
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.6 ? '#d97706' : '#fef08a',
              alpha: 0.8,
              life: 18,
            });
          }

          if (fist.phaseTimer >= fist.warningDurationMs) {
            fist.phase = 'eruption';
            fist.phaseTimer = 0;
            elementalSound.playTectonicFistUppercut(fist.isCharged);
            g.screenShake = Math.max(g.screenShake, fist.isCharged ? 13 : 8);

            // Explosión de polvo y rocas en la base al brotar
            for (let b = 0; b < 14; b++) {
              const bAng = Math.random() * Math.PI * 2;
              const bSpd = 2.5 + Math.random() * 5.0;
              g.particles.push({
                id: `fist-base-${frameNow}-${b}`,
                x: fist.targetX,
                y: fist.targetY,
                vx: Math.cos(bAng) * bSpd,
                vy: Math.sin(bAng) * bSpd * 0.58 - (2 + Math.random() * 3),
                radius: 2 + Math.random() * 2.5,
                color: Math.random() < 0.5 ? '#5d4037' : (Math.random() < 0.5 ? '#d97706' : '#a1887f'),
                alpha: 1,
                life: 22,
              });
            }
          }
        }

        // FASE B: EMERGENCIA VIOLENTA DEL PUÑO (260 ms)
        else if (fist.phase === 'eruption') {
          const prog = Math.min(1, fist.phaseTimer / fist.eruptionDurationMs);
          const easeOut = Math.sin(prog * Math.PI * 0.5);
          fist.fistHeight = fist.maxFistHeight * easeOut;

          // Impacto y detección de daño en el ápice (se aplica exactamente una vez)
          if (!fist.hasDealtDamage && prog >= 0.45) {
            fist.hasDealtDamage = true;

            for (const enemy of g.enemyManager.enemies) {
              if (enemy.hp <= 0) continue;
              const d = Math.hypot(enemy.x - fist.targetX, (enemy.y - fist.targetY) / 0.58);
              if (d <= enemy.radius + fist.radius) {
                enemy.hp -= fist.damage;
                enemy.hitFlash = 14;

                // Interrupción garantizada de ataque y cancelación de telegráfico
                enemy.isTelegraphing = false;
                enemy.telegraphTimer = 0;
                enemy.attackCooldown = 0;
                enemy.stunnedTimer = fist.isCharged ? 65 : 45;

                // Elevación vertical (Knock-up) y desplazamiento radial
                const isBoss = enemy.archetype === 'boss';
                if (!isBoss) {
                  // Catapultar hacia arriba en Y y ligeramente hacia afuera
                  const pushAng = Math.atan2(enemy.y - fist.targetY, enemy.x - fist.targetX);
                  const pushDist = fist.knockup * (fist.isCharged ? 4.8 : 3.5);
                  enemy.x += Math.cos(pushAng) * pushDist;
                  enemy.y -= (fist.knockup * 3.8); // Elevación en el eje vertical
                } else {
                  // Jefes pesados: micro-aturdimiento sin desplazamiento forzado grande
                  enemy.stunnedTimer = 25;
                }

                g.floatingTexts.push({
                  id: `fist-hit-${frameNow}-${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 28,
                  text: fist.isCharged ? `👊 -${fist.damage} [¡PUÑO TECTÓNICO +50%!]` : `👊 -${fist.damage} [¡GOLPE TECTÓNICO!]`,
                  color: fist.isCharged ? '#fef08a' : '#d97706',
                  fontSize: 14,
                  opacity: 1,
                  vy: -1.6,
                  life: 40,
                });

                // Chispas de impacto telúrico
                for (let h = 0; h < 8; h++) {
                  const hAng = Math.random() * Math.PI * 2;
                  g.particles.push({
                    id: `fist-spark-${frameNow}-${enemy.id}-${h}`,
                    x: enemy.x,
                    y: enemy.y - 12,
                    vx: Math.cos(hAng) * 3.5,
                    vy: Math.sin(hAng) * 3.5,
                    radius: 2,
                    color: '#f59e0b',
                    alpha: 1,
                    life: 18,
                  });
                }
              }
            }

            // Dañar o destruir obstáculos existentes en el epicentro
            g.terrainManager.obstacles.forEach((obs) => {
              if (obs.obstacleType === 'tectonic_rubble') return;
              const d = Math.hypot(obs.x - fist.targetX, (obs.y - fist.targetY) / 0.58);
              if (d <= obs.radius + fist.radius) {
                obs.hp -= fist.damage;
              }
            });
          }

          if (fist.phaseTimer >= fist.eruptionDurationMs) {
            fist.phase = 'collapse';
            fist.phaseTimer = 0;
            elementalSound.playTectonicCollapse();
            g.screenShake = Math.max(g.screenShake, 6);
          }
        }

        // FASE C: COLAPSO Y GENERACIÓN DE ESCOMBROS (200 ms)
        else if (fist.phase === 'collapse') {
          // Generar los obstáculos de escombros en el terreno exactamente una vez al inicio del colapso
          if (!fist.rubbleSpawned) {
            fist.rubbleSpawned = true;
            g.terrainManager.spawnTectonicRubble(fist.targetX, fist.targetY, fist.rubbleCount, 2400);

            // Explosión de escombros y polvo
            for (let r = 0; r < 12; r++) {
              const rAng = Math.random() * Math.PI * 2;
              const rSpd = 2 + Math.random() * 4;
              g.particles.push({
                id: `rubble-burst-${frameNow}-${r}`,
                x: fist.targetX,
                y: fist.targetY - fist.fistHeight * 0.5,
                vx: Math.cos(rAng) * rSpd,
                vy: Math.sin(rAng) * rSpd * 0.58 - 1.5,
                radius: 2 + Math.random() * 2,
                color: Math.random() < 0.6 ? '#4e342e' : '#f59e0b',
                alpha: 1,
                life: 20,
              });
            }
          }

          if (fist.phaseTimer >= fist.collapseDurationMs) {
            fist.phase = 'finished';
          }
        }

        if (fist.phase === 'finished') {
          g.tectonicFists.splice(fIdx, 1);
        }
      }

      // 4.6 Actualizar Rayo Criogénico (Hielo + Rayo: Haz continuo direccionable, electrocución, congelación progresiva y arcos menores)
      for (let bIdx = g.cryoBeams.length - 1; bIdx >= 0; bIdx--) {
        const beam = g.cryoBeams[bIdx];
        beam.elapsedMs += dt;

        // Puntería en tiempo real: si el jugador arrastra la mira o mueve el ratón, el rayo se reorienta suavemente
        if (attackAimRef.current.isAiming) {
          const aimDx = attackAimRef.current.currX - attackAimRef.current.startX;
          const aimDy = attackAimRef.current.currY - attackAimRef.current.startY;
          if (Math.hypot(aimDx, aimDy) > 8) {
            const targetAng = Math.atan2(aimDy, aimDx);
            let diff = targetAng - beam.aimAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            beam.aimAngle += diff * 0.25;
            wizard.facingAngle = beam.aimAngle;
          }
        } else if (mousePosRef.current.active) {
          const mCanvas = canvasRef.current;
          if (mCanvas) {
            const rect = mCanvas.getBoundingClientRect();
            const mouseX = mousePosRef.current.x - rect.left - rect.width / 2;
            const mouseY = mousePosRef.current.y - rect.top - rect.height / 2;
            const targetAng = Math.atan2(mouseY, mouseX);
            let diff = targetAng - beam.aimAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            beam.aimAngle += diff * 0.25;
            wizard.facingAngle = beam.aimAngle;
          }
        }

        // Zumbido continuo de plasma gélido cada 280ms
        if (frameNow - (g.lastCryoHumTime || 0) >= 280) {
          g.lastCryoHumTime = frameNow;
          elementalSound.playCryoBeamHum(beam.isCharged);
        }

        // Comprobar finalización
        if (beam.elapsedMs >= beam.durationMs) {
          beam.finished = true;
          elementalSound.playCryoBeamEnd();
          g.cryoBeams.splice(bIdx, 1);
          continue;
        }

        // Ticks periódicos de daño cada 150 ms
        if (beam.elapsedMs - beam.lastTickMs >= beam.tickIntervalMs) {
          beam.lastTickMs = beam.elapsedMs;

          // Origen en el báculo
          const startX = wizard.x + Math.cos(beam.aimAngle) * 16;
          const startY = wizard.y - 12 + Math.sin(beam.aimAngle) * 10;
          const endX = startX + Math.cos(beam.aimAngle) * beam.range;
          const endY = startY + Math.sin(beam.aimAngle) * beam.range * 0.72;

          const beamDx = endX - startX;
          const beamDy = endY - startY;
          const beamLenSq = beamDx * beamDx + beamDy * beamDy;
          const effectiveBeamWidth = beam.width * 1.8;

          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;

            // Proyección ortogonal del enemigo sobre el segmento del rayo
            const t = Math.max(0, Math.min(1, ((enemy.x - startX) * beamDx + (enemy.y - startY) * beamDy) / (beamLenSq || 1)));
            const projX = startX + t * beamDx;
            const projY = startY + t * beamDy;
            const dist = Math.hypot(enemy.x - projX, enemy.y - projY);

            if (dist <= effectiveBeamWidth + enemy.radius) {
              // Impacto directo en el enemigo
              enemy.hp -= beam.damagePerTick;
              enemy.hitFlash = 8;

              // Ralentización inmediata (-35% de velocidad)
              g.enemyManager.applyStatus(enemy, 'slowed', 120);

              // Acumulación de exposición térmica bajo cero
              beam.enemyExposure[enemy.id] = (beam.enemyExposure[enemy.id] || 0) + beam.tickIntervalMs;

              // Si acumula >= 750 ms expuesto al rayo, congelación sólida
              const hasFrozen = enemy.statuses.some((s) => s.type === 'frozen');
              if (beam.enemyExposure[enemy.id] >= 750 && !hasFrozen) {
                g.enemyManager.applyStatus(enemy, 'frozen', 75);
                g.floatingTexts.push({
                  id: `cryo-freeze-${frameNow}-${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 28,
                  text: '🧊 ¡CONGELADO!',
                  color: '#00f0ff',
                  fontSize: 13,
                  opacity: 1,
                  vy: -1.3,
                  life: 35,
                });
                for (let fc = 0; fc < 8; fc++) {
                  const fcAng = Math.random() * Math.PI * 2;
                  g.particles.push({
                    id: `freeze-burst-${frameNow}-${fc}`,
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(fcAng) * 2.5,
                    vy: Math.sin(fcAng) * 2.5,
                    radius: 2,
                    color: Math.random() < 0.6 ? '#ffffff' : '#00f0ff',
                    alpha: 1,
                    life: 16,
                  });
                }
              }

              // Texto flotante de daño electro-gélido
              g.floatingTexts.push({
                id: `cryo-hit-${frameNow}-${enemy.id}`,
                x: enemy.x + (Math.random() - 0.5) * 14,
                y: enemy.y - 14,
                text: `-${beam.damagePerTick}`,
                color: beam.isCharged ? '#00f0ff' : '#a855f7',
                fontSize: 12,
                opacity: 1,
                vy: -1.2,
                life: 25,
              });

              // Micro-empuje transversal o en la dirección del rayo
              const pushAng = beam.aimAngle;
              enemy.vx += Math.cos(pushAng) * 0.8;
              enemy.vy += Math.sin(pushAng) * 0.8;

              // Salto menor de arco voltaico a 1 enemigo cercano (25% del daño, radio 85px)
              const jumpCandidate = enemies.find(
                (other) => other.id !== enemy.id && other.hp > 0 && Math.hypot(other.x - enemy.x, other.y - enemy.y) <= 85
              );
              if (jumpCandidate) {
                const jumpDmg = Math.max(1, Math.round(beam.damagePerTick * 0.25));
                jumpCandidate.hp -= jumpDmg;
                jumpCandidate.hitFlash = 6;
                elementalSound.playCryoBeamArcJump();

                // Arco eléctrico visible entre ambos enemigos
                g.terrainManager.electricArcs.push({
                  x1: enemy.x,
                  y1: enemy.y,
                  x2: jumpCandidate.x,
                  y2: jumpCandidate.y,
                  color: '#00f0ff',
                  life: 8,
                });

                g.floatingTexts.push({
                  id: `cryo-arc-${frameNow}-${jumpCandidate.id}`,
                  x: jumpCandidate.x,
                  y: jumpCandidate.y - 12,
                  text: `⚡ -${jumpDmg}`,
                  color: '#c084fc',
                  fontSize: 11,
                  opacity: 1,
                  vy: -1.0,
                  life: 22,
                });
              }

              // Partículas de chispa de impacto
              for (let cp = 0; cp < 3; cp++) {
                const cpAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  id: `cryo-hit-p-${frameNow}-${cp}`,
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(cpAng) * 2.0,
                  vy: Math.sin(cpAng) * 2.0,
                  radius: 1.5,
                  color: cp % 2 === 0 ? '#00f0ff' : '#c084fc',
                  alpha: 1,
                  life: 12,
                });
              }
            }
          });

          // Daño a obstáculos destructibles en el haz (cajas, cristales)
          g.terrainManager.obstacles.forEach((obs) => {
            if (obs.solid && obs.hp !== undefined && obs.hp > 0) {
              const t = Math.max(0, Math.min(1, ((obs.x - startX) * beamDx + (obs.y - startY) * beamDy) / (beamLenSq || 1)));
              const projX = startX + t * beamDx;
              const projY = startY + t * beamDy;
              const dist = Math.hypot(obs.x - projX, obs.y - projY);
              if (dist <= effectiveBeamWidth + obs.radius) {
                obs.hp -= beam.damagePerTick * 0.6;
              }
            }
          });
        }
      }

      // 4.7 Actualizar Bombardeo Volcánico (Fuego + Tierra: Fracturas, Columnas de Magma y Bombas de Lava Balísticas)
      for (let bmbIdx = g.volcanicBombardments.length - 1; bmbIdx >= 0; bmbIdx--) {
        const bombardment = g.volcanicBombardments[bmbIdx];
        let allFissuresDone = true;

        // Actualizar cada fisura volcánica
        bombardment.fissures.forEach((fissure) => {
          fissure.elapsedMs += dt;
          if (fissure.elapsedMs < fissure.delayMs) {
            allFissuresDone = false;
            return;
          }

          const localElapsed = fissure.elapsedMs - fissure.delayMs;

          // FASE A: ADVERTENCIA (280 ms)
          if (fissure.phase === 'warning') {
            allFissuresDone = false;

            // Chispas y brasas emergentes durante la fractura
            if (Math.random() < 0.35) {
              const pAng = Math.random() * Math.PI * 2;
              const pDist = Math.random() * fissure.radius * 0.7;
              g.particles.push({
                id: `volc-warn-${frameNow}-${Math.random()}`,
                x: fissure.x + Math.cos(pAng) * pDist,
                y: fissure.y + Math.sin(pAng) * pDist * 0.58,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -0.9 - Math.random() * 1.4,
                radius: 1.4 + Math.random() * 1.5,
                color: Math.random() < 0.6 ? '#ff6d00' : '#fff176',
                alpha: 0.85,
                life: 18,
              });
            }

            if (localElapsed >= fissure.warningDurationMs) {
              fissure.phase = 'eruption';
              elementalSound.playMagmaGeyser();
              g.screenShake = Math.max(g.screenShake, bombardment.isCharged ? 8 : 5);

              // Estallido de magma y rocas en la base de la columna
              for (let b = 0; b < 12; b++) {
                const bAng = Math.random() * Math.PI * 2;
                const bSpd = 2.0 + Math.random() * 4.5;
                g.particles.push({
                  id: `volc-erupt-${frameNow}-${b}`,
                  x: fissure.x,
                  y: fissure.y,
                  vx: Math.cos(bAng) * bSpd,
                  vy: Math.sin(bAng) * bSpd * 0.58 - (2.5 + Math.random() * 3.5),
                  radius: 2 + Math.random() * 2.5,
                  color: Math.random() < 0.4 ? '#ffffff' : (Math.random() < 0.5 ? '#ff6d00' : '#d50000'),
                  alpha: 1,
                  life: 22,
                });
              }
            }
          }

          // FASE B: ERUPCIÓN VIOLENTA (260 ms)
          else if (fissure.phase === 'eruption') {
            allFissuresDone = false;
            const eruptElapsed = localElapsed - fissure.warningDurationMs;
            const prog = Math.min(1.0, eruptElapsed / fissure.eruptionDurationMs);
            const easeOut = Math.sin(prog * Math.PI * 0.5);
            fissure.columnHeight = fissure.maxColumnHeight * easeOut;

            // Detección de daño directo de la columna de magma (1 solo impacto por enemigo por columna)
            if (!fissure.hasDealtDamage && prog >= 0.35) {
              fissure.hasDealtDamage = true;

              for (const enemy of g.enemyManager.enemies) {
                if (enemy.hp <= 0) continue;
                const dist = Math.hypot(enemy.x - fissure.x, (enemy.y - fissure.y) / 0.58);
                if (dist <= enemy.radius + fissure.radius) {
                  enemy.hp -= bombardment.totalDamage;
                  enemy.hitFlash = 12;

                  // Interrupción táctica leve y quemadura
                  enemy.isTelegraphing = false;
                  enemy.attackCooldown = 0;
                  g.enemyManager.applyStatus(enemy, 'burning', 180);

                  // Knock-up sutil y desplazamiento ligero
                  const isBoss = enemy.archetype === 'boss';
                  if (!isBoss) {
                    const pushAng = Math.atan2(enemy.y - fissure.y, enemy.x - fissure.x);
                    enemy.x += Math.cos(pushAng) * 14;
                    enemy.y -= 12; // Elevación vertical
                  }

                  g.floatingTexts.push({
                    id: `volc-hit-${frameNow}-${enemy.id}`,
                    x: enemy.x,
                    y: enemy.y - 25,
                    text: `🌋 -${bombardment.totalDamage} [MAGMA]`,
                    color: bombardment.isCharged ? '#fff176' : '#ff6d00',
                    fontSize: 14,
                    opacity: 1,
                    vy: -1.5,
                    life: 38,
                  });

                  // Chispas ígneas al impactar
                  for (let h = 0; h < 6; h++) {
                    const hAng = Math.random() * Math.PI * 2;
                    g.particles.push({
                      id: `volc-hit-spark-${frameNow}-${enemy.id}-${h}`,
                      x: enemy.x,
                      y: enemy.y - 10,
                      vx: Math.cos(hAng) * 3.5,
                      vy: Math.sin(hAng) * 3.5,
                      radius: 2,
                      color: '#fff176',
                      alpha: 1,
                      life: 16,
                    });
                  }
                }
              }

              // Daño a obstáculos en el epicentro de la columna
              g.terrainManager.obstacles.forEach((obs) => {
                const dist = Math.hypot(obs.x - fissure.x, (obs.y - fissure.y) / 0.58);
                if (dist <= obs.radius + fissure.radius) {
                  obs.hp -= bombardment.totalDamage;
                }
              });
            }

            // Expulsión balística de bombas de lava al alcanzar el ápice
            if (!fissure.bombsSpawned && prog >= 0.55) {
              fissure.bombsSpawned = true;
              const bombCount = bombardment.isCharged ? 3 : 2;
              const bombDmg = Math.max(1, Math.round(bombardment.totalDamage * 0.40));

              for (let b = 0; b < bombCount; b++) {
                const bAng = (b * ((Math.PI * 2) / bombCount)) + (Math.random() - 0.5) * 0.6;
                const bDist = 55 + Math.random() * 50;
                const bombTargetX = fissure.x + Math.cos(bAng) * bDist;
                const bombTargetY = fissure.y + Math.sin(bAng) * bDist * 0.58;

                bombardment.lavaBombs.push({
                  id: `lava_bomb_${frameNow}_${b}_${Math.random().toString(36).substring(2, 5)}`,
                  startX: fissure.x,
                  startY: fissure.y,
                  targetX: bombTargetX,
                  targetY: bombTargetY,
                  currentX: fissure.x,
                  currentY: fissure.y,
                  currentHeight: 0,
                  progress: 0,
                  durationMs: 340 + Math.random() * 60,
                  elapsedMs: 0,
                  damage: bombDmg,
                  radius: 7,
                  hasExploded: false,
                });
              }
            }

            if (eruptElapsed >= fissure.eruptionDurationMs) {
              fissure.phase = 'cooling';
            }
          }

          // FASE C: ENFRIAMIENTO Y DISIPACIÓN (240 ms)
          else if (fissure.phase === 'cooling') {
            const coolElapsed = localElapsed - fissure.warningDurationMs - fissure.eruptionDurationMs;
            const prog = Math.min(1.0, coolElapsed / fissure.coolingDurationMs);
            fissure.columnHeight = fissure.maxColumnHeight * (1.0 - prog);

            if (coolElapsed >= fissure.coolingDurationMs) {
              fissure.phase = 'finished';
            } else {
              allFissuresDone = false;
            }
          }
        });

        // Actualizar bombas de lava balísticas
        let allBombsDone = true;
        bombardment.lavaBombs.forEach((bomb) => {
          if (bomb.hasExploded) return;
          allBombsDone = false;

          bomb.elapsedMs += dt;
          bomb.progress = Math.min(1.0, bomb.elapsedMs / bomb.durationMs);

          // Interpolación lineal horizontal y arco parabólico vertical
          bomb.currentX = bomb.startX + (bomb.targetX - bomb.startX) * bomb.progress;
          bomb.currentY = bomb.startY + (bomb.targetY - bomb.startY) * bomb.progress;
          bomb.currentHeight = Math.sin(bomb.progress * Math.PI) * 46;

          // Estela de humo y chispas durante el vuelo balístico
          if (Math.random() < 0.45) {
            g.particles.push({
              id: `bomb-trail-${frameNow}-${Math.random()}`,
              x: bomb.currentX + (Math.random() - 0.5) * 4,
              y: bomb.currentY - bomb.currentHeight + (Math.random() - 0.5) * 4,
              vx: (Math.random() - 0.5) * 0.6,
              vy: 0.3 + Math.random() * 0.6,
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.6 ? '#ff6d00' : '#261c14',
              alpha: 0.85,
              life: 14,
            });
          }

          // Impacto en el suelo al completar la trayectoria
          if (bomb.progress >= 1.0) {
            bomb.hasExploded = true;
            elementalSound.playLavaSplat();
            g.screenShake = Math.max(g.screenShake, 3.5);

            // Generar charco de magma residual en el punto de aterrizaje
            g.terrainManager.spawnMagmaFissure(bomb.targetX, bomb.targetY, 24);

            // Daño en área de salpicadura (splash) y quemadura
            const splashRadius = 38;
            for (const enemy of g.enemyManager.enemies) {
              if (enemy.hp <= 0) continue;
              const dist = Math.hypot(enemy.x - bomb.targetX, (enemy.y - bomb.targetY) / 0.58);
              if (dist <= enemy.radius + splashRadius) {
                enemy.hp -= bomb.damage;
                enemy.hitFlash = 10;
                g.enemyManager.applyStatus(enemy, 'burning', 140);

                g.floatingTexts.push({
                  id: `bomb-hit-${frameNow}-${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 18,
                  text: `🔥 -${bomb.damage} [LAVA]`,
                  color: '#f97316',
                  fontSize: 12,
                  opacity: 1,
                  vy: -1.2,
                  life: 30,
                });
              }
            }

            // Gotas de magma salpicadas hacia afuera al reventar
            for (let s = 0; s < 8; s++) {
              const sAng = Math.random() * Math.PI * 2;
              const sSpd = 1.8 + Math.random() * 3.5;
              g.particles.push({
                id: `splat-p-${frameNow}-${s}`,
                x: bomb.targetX,
                y: bomb.targetY,
                vx: Math.cos(sAng) * sSpd,
                vy: Math.sin(sAng) * sSpd * 0.58 - 1.2,
                radius: 1.8 + Math.random() * 1.8,
                color: Math.random() < 0.5 ? '#fff176' : '#ff6d00',
                alpha: 1,
                life: 18,
              });
            }
          }
        });

        // Limpieza de bombardeos que han terminado todas sus fases y bombas
        if (allFissuresDone && allBombsDone) {
          bombardment.finished = true;
          g.volcanicBombardments.splice(bmbIdx, 1);
        }
      }

      // 4.8 Actualizar Vórtice de Choque Térmico (Fuego + Hielo: Onda expansiva, empuje radial y detonación crítica)
      for (let vIdx = g.thermalVortices.length - 1; vIdx >= 0; vIdx--) {
        const vortex = g.thermalVortices[vIdx];
        vortex.phaseTimer += dt;

        // FASE A / B: EXPANSIÓN DE LA ONDA DE VAPOR (260 ms)
        if (vortex.phase === 'expanding') {
          const prog = Math.min(1.0, vortex.phaseTimer / vortex.expandDurationMs);
          vortex.currentRadius = vortex.maxRadius * Math.sin(prog * Math.PI * 0.5);

          // Detección de colisión, empuje y daño a enemigos en el frente de choque
          for (const enemy of g.enemyManager.enemies) {
            if (enemy.hp <= 0) continue;
            if (vortex.hitEnemyIds.includes(enemy.id)) continue;

            const dist = Math.hypot(enemy.x - vortex.x, (enemy.y - vortex.y) / 0.58);
            if (dist <= enemy.radius + vortex.currentRadius) {
              vortex.hitEnemyIds.push(enemy.id);

              // Comprobar sinergia reactiva: ¿Tiene acumulación de congelación o escarcha previa?
              const hasFrozenStatus = enemy.statuses.some((s) => s.type === 'frozen' || s.type === 'slowed');

              if (hasFrozenStatus) {
                // DETONACIÓN CRÍTICA POR CHOQUE TÉRMICO (x2.4 de daño masivo)
                const critDmg = Math.round(vortex.damage * 2.4);
                enemy.hp -= critDmg;
                enemy.hitFlash = 15;

                // Consumir el estado de congelación inmediatamente
                enemy.statuses = enemy.statuses.filter((s) => s.type !== 'frozen' && s.type !== 'slowed');

                // Aturdimiento garantizado (1.0 segundo = 60 frames)
                enemy.stunnedTimer = 60;
                enemy.isTelegraphing = false;
                enemy.attackCooldown = 0;

                elementalSound.playThermalShatterCrit();
                g.screenShake = Math.max(g.screenShake, 8.5);

                // Estallido secundario localizado sobre el enemigo (esquirlas de hielo y vapor a presión)
                for (let sc = 0; sc < 14; sc++) {
                  const sAng = Math.random() * Math.PI * 2;
                  const sSpd = 2.5 + Math.random() * 4.5;
                  g.particles.push({
                    id: `shatter-${frameNow}-${enemy.id}-${sc}`,
                    x: enemy.x,
                    y: enemy.y - 12,
                    vx: Math.cos(sAng) * sSpd,
                    vy: Math.sin(sAng) * sSpd * 0.58 - 1.0,
                    radius: 1.8 + Math.random() * 2.0,
                    color: sc % 3 === 0 ? '#ffffff' : (sc % 3 === 1 ? '#80d8ff' : '#e0f7fa'),
                    alpha: 1,
                    life: 22,
                  });
                }

                g.floatingTexts.push({
                  id: `vortex-crit-${frameNow}-${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 28,
                  text: `♨️💥 -${critDmg} [¡DETONACIÓN TÉRMICA!]`,
                  color: '#38bdf8',
                  fontSize: 14,
                  opacity: 1,
                  vy: -1.6,
                  life: 42,
                });
              } else {
                // Daño estándar de la onda de vapor
                enemy.hp -= vortex.damage;
                enemy.hitFlash = 10;
                enemy.isTelegraphing = false;
                enemy.attackCooldown = 0;

                g.floatingTexts.push({
                  id: `vortex-hit-${frameNow}-${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 20,
                  text: `♨️ -${vortex.damage} [VAPOR]`,
                  color: '#f43f5e',
                  fontSize: 12,
                  opacity: 1,
                  vy: -1.2,
                  life: 30,
                });
              }

              // Empuje violento radial hacia afuera (Radial Knockback)
              const isBoss = enemy.archetype === 'boss';
              if (!isBoss) {
                let pushAng = Math.atan2(enemy.y - vortex.y, enemy.x - vortex.x);
                if (Math.abs(enemy.x - vortex.x) < 2 && Math.abs(enemy.y - vortex.y) < 2) {
                  pushAng = Math.random() * Math.PI * 2;
                }
                const pushDist = vortex.knockback * (vortex.isCharged ? 4.8 : 3.6);
                enemy.vx += Math.cos(pushAng) * (pushDist * 0.45);
                enemy.vy += Math.sin(pushAng) * (pushDist * 0.45 * 0.58);
                enemy.x += Math.cos(pushAng) * (pushDist * 0.55);
                enemy.y += Math.sin(pushAng) * (pushDist * 0.55 * 0.58);
              } else {
                enemy.stunnedTimer = 22; // Micro-interrupción para jefes
              }

              // Salpicadura de vapor al impactar a cada enemigo
              for (let sp = 0; sp < 4; sp++) {
                const spAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  id: `vortex-steam-${frameNow}-${enemy.id}-${sp}`,
                  x: enemy.x,
                  y: enemy.y - 10,
                  vx: Math.cos(spAng) * 2.0,
                  vy: Math.sin(spAng) * 2.0 - 0.8,
                  radius: 2.2,
                  color: '#eceff1',
                  alpha: 0.7,
                  life: 16,
                });
              }
            }
          }

          // Daño y derretimiento de obstáculos en el área
          g.terrainManager.obstacles.forEach((obs) => {
            if (obs.hp !== undefined && obs.hp > 0) {
              const dist = Math.hypot(obs.x - vortex.x, (obs.y - vortex.y) / 0.58);
              if (dist <= obs.radius + vortex.currentRadius) {
                // El calor del vapor derrite estacas de hielo y muros gélidos rápidamente
                const meltBonus = (obs.obstacleType === 'ice_wall' || obs.obstacleType === 'permafrost_spike') ? 2.5 : 1.0;
                obs.hp -= vortex.damage * meltBonus;
              }
            }
          });

          if (vortex.phaseTimer >= vortex.expandDurationMs) {
            vortex.phase = 'dissipating';
            vortex.phaseTimer = 0;
          }
        }
        // FASE D: DISIPACIÓN DE LA NIEBLA DE VAPOR (240 ms)
        else if (vortex.phase === 'dissipating') {
          if (vortex.phaseTimer >= vortex.dissipateDurationMs) {
            vortex.phase = 'finished';
          }
        }

        if (vortex.phase === 'finished') {
          g.thermalVortices.splice(vIdx, 1);
        }
      }

      // 4.9 Actualizar Jaula de Pilares Conductores (Rayo + Tierra: Erupción, Valla Voltaica, Daño Continuo, Repulsión y Colapso)
      for (let cIdx = g.conductiveCages.length - 1; cIdx >= 0; cIdx--) {
        const cage = g.conductiveCages[cIdx];
        cage.phaseTimer += dt;

        // FASE 1: ERUPCIÓN TELÚRICA (220 ms)
        if (cage.phase === 'erupting') {
          const prog = Math.min(1.0, cage.phaseTimer / cage.eruptDurationMs);
          // Crecimiento vertical de cada pilar con efecto resorte suave
          cage.pillars.forEach((p) => {
            p.height = p.maxHeight * Math.sin(prog * Math.PI * 0.5);
          });

          if (cage.phaseTimer >= cage.eruptDurationMs) {
            cage.phase = 'igniting';
            cage.phaseTimer = 0;
            cage.pillars.forEach((p) => {
              p.height = p.maxHeight;
            });
            elementalSound.playConductiveFenceZap();
          }
        }
        // FASE 2: IGNICIÓN DE VALLA VOLTAICA (140 ms)
        else if (cage.phase === 'igniting') {
          if (cage.phaseTimer >= cage.igniteDurationMs) {
            cage.phase = 'active';
            cage.phaseTimer = 0;
          }
        }
        // FASE 3: VALLA ACTIVA Y REJILLA ELECTRIFICADA (3200 ms)
        else if (cage.phase === 'active') {
          // A. Colisión sólida de los monolitos con el Mago
          cage.pillars.forEach((p) => {
            const dx = wizard.x - p.x;
            const dy = (wizard.y - p.y) / 0.58;
            const dist = Math.hypot(dx, dy);
            const minDist = p.radius + 14;
            if (dist < minDist && dist > 0.01) {
              const overlap = minDist - dist;
              wizard.x += (dx / dist) * overlap;
              wizard.y += (dy / dist) * overlap * 0.58;
            }
          });

          // B. Colisión física y daño por contacto con valla para cada enemigo
          for (const enemy of g.enemyManager.enemies) {
            if (enemy.hp <= 0) continue;

            // B.1 Obstáculo físico: separar enemigo si colisiona con el monolito
            cage.pillars.forEach((p) => {
              const dx = enemy.x - p.x;
              const dy = (enemy.y - p.y) / 0.58;
              const dist = Math.hypot(dx, dy);
              const minDist = p.radius + enemy.radius;
              if (dist < minDist && dist > 0.01) {
                const overlap = minDist - dist;
                enemy.x += (dx / dist) * overlap;
                enemy.y += (dy / dist) * overlap * 0.58;
              }
            });

            // B.2 Detección de contacto con los segmentos de valla electrificada
            const lastHit = cage.lastTickPerEnemy[enemy.id] || 0;
            const canTick = frameNow - lastHit >= cage.tickIntervalMs;

            for (const seg of cage.segments) {
              const p1 = cage.pillars[seg.p1Index];
              const p2 = cage.pillars[seg.p2Index];
              if (!p1 || !p2) continue;

              // Distancia punto a segmento de recta en espacio 2.5D
              const dx = p2.x - p1.x;
              const dy = (p2.y - p1.y) / 0.58;
              const l2 = dx * dx + dy * dy;
              let distToFence = 999;
              let projX = p1.x;
              let projY = p1.y;

              if (l2 === 0) {
                distToFence = Math.hypot(enemy.x - p1.x, (enemy.y - p1.y) / 0.58);
              } else {
                const t = Math.max(0, Math.min(1, ((enemy.x - p1.x) * dx + ((enemy.y - p1.y) / 0.58) * dy) / l2));
                projX = p1.x + t * dx;
                projY = p1.y + t * (p2.y - p1.y);
                distToFence = Math.hypot(enemy.x - projX, (enemy.y - projY) / 0.58);
              }

              const hitThreshold = 14 + enemy.radius;
              if (distToFence < hitThreshold) {
                // Electro-repulsión: Empujar hacia afuera del segmento para impedir cruzar impunemente
                let repulseX = enemy.x - projX;
                let repulseY = (enemy.y - projY) / 0.58;
                const repDist = Math.hypot(repulseX, repulseY);
                if (repDist > 0.01) {
                  repulseX /= repDist;
                  repulseY /= repDist;
                } else {
                  const cdx = enemy.x - cage.centerX;
                  const cdy = (enemy.y - cage.centerY) / 0.58;
                  const cDist = Math.hypot(cdx, cdy) || 1;
                  repulseX = cdx / cDist;
                  repulseY = cdy / cDist;
                }

                // Aplicar separación física instantánea
                enemy.x += repulseX * 8;
                enemy.y += repulseY * 8 * 0.58;

                // Si ha pasado el intervalo de tick (~180 ms), aplicar daño y electrocución
                if (canTick) {
                  cage.lastTickPerEnemy[enemy.id] = frameNow;
                  enemy.hp -= cage.contactDamage;
                  enemy.hitFlash = 12;

                  // Micro-aturdimiento e interrupción de ataques
                  enemy.stunnedTimer = Math.max(enemy.stunnedTimer || 0, 18);
                  enemy.isTelegraphing = false;

                  // Estado electrocutado (shocked)
                  const existingShock = enemy.statuses.find((s) => s.type === 'shocked');
                  if (existingShock) {
                    existingShock.duration = 120;
                  } else {
                    enemy.statuses.push({
                      type: 'shocked',
                      duration: 120,
                      maxDuration: 120,
                    });
                  }

                  elementalSound.playConductiveFenceZap();

                  // Chispas voltaicas y texto de daño
                  for (let sp = 0; sp < 6; sp++) {
                    const spAng = Math.random() * Math.PI * 2;
                    const spSpd = 2.0 + Math.random() * 3.5;
                    g.particles.push({
                      x: enemy.x,
                      y: enemy.y - 10,
                      vx: Math.cos(spAng) * spSpd,
                      vy: Math.sin(spAng) * spSpd * 0.58,
                      radius: 1.5 + Math.random() * 1.5,
                      color: sp % 2 === 0 ? '#fef08a' : '#38bdf8',
                      alpha: 1,
                      life: 18,
                      type: 'spark',
                    });
                  }

                  g.floatingTexts.push({
                    id: `cage_hit_${frameNow}_${enemy.id}`,
                    x: enemy.x,
                    y: enemy.y - 20,
                    text: `-${cage.contactDamage} ⚡`,
                    color: '#fde047',
                    fontSize: 14,
                    opacity: 1,
                    vy: -1.0,
                    life: 25,
                  });
                }
                break; // Un impacto de segmento por frame
              }
            }
          }

          if (cage.phaseTimer >= cage.activeDurationMs) {
            cage.phase = 'collapsing';
            cage.phaseTimer = 0;
          }
        }
        // FASE 4: IMPLOSIÓN Y COLAPSO SÍSMICO (280 ms)
        else if (cage.phase === 'collapsing') {
          const prog = Math.min(1.0, cage.phaseTimer / cage.collapseDurationMs);

          // Hundimiento y fragmentación de los pilares
          cage.pillars.forEach((p) => {
            p.height = p.maxHeight * (1.0 - prog);
          });

          // Implosión instantánea en el primer tick del colapso
          if (!cage.hasImploded) {
            cage.hasImploded = true;
            elementalSound.playConductiveCageImplosion(cage.isCharged);
            g.screenShake = Math.max(g.screenShake, cage.isCharged ? 9 : 6);

            // Daño y vórtice de implosión para todos los enemigos atrapados dentro o cerca
            const implosionRadius = cage.radius + 18;
            for (const enemy of g.enemyManager.enemies) {
              if (enemy.hp <= 0) continue;
              const dist = Math.hypot(enemy.x - cage.centerX, (enemy.y - cage.centerY) / 0.58);
              if (dist <= implosionRadius) {
                enemy.hp -= cage.implosionDamage;
                enemy.hitFlash = 18;
                enemy.stunnedTimer = Math.max(enemy.stunnedTimer || 0, 35);
                enemy.isTelegraphing = false;

                // Succión gravitatoria / atracción hacia el centro
                const pullAngle = Math.atan2(cage.centerY - enemy.y, cage.centerX - enemy.x);
                const pullDist = Math.min(30, dist * 0.4);
                enemy.x += Math.cos(pullAngle) * pullDist;
                enemy.y += Math.sin(pullAngle) * pullDist * 0.58;

                g.floatingTexts.push({
                  id: `cage_implode_${frameNow}_${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 25,
                  text: `-${cage.implosionDamage} ¡COLAPSO! 💥⚡`,
                  color: '#ffffff',
                  fontSize: 16,
                  opacity: 1,
                  vy: -1.4,
                  life: 38,
                });
              }
            }

            // Partículas masivas de escombros y relámpagos inward
            for (let p = 0; p < 24; p++) {
              const pAng = Math.random() * Math.PI * 2;
              const pDist = cage.radius * (0.5 + Math.random() * 0.7);
              const px = cage.centerX + Math.cos(pAng) * pDist;
              const py = cage.centerY + Math.sin(pAng) * pDist * 0.58;
              const inwardAng = Math.atan2(cage.centerY - py, cage.centerX - px);
              const pSpd = 3.0 + Math.random() * 4.0;

              g.particles.push({
                x: px,
                y: py,
                vx: Math.cos(inwardAng) * pSpd,
                vy: Math.sin(inwardAng) * pSpd * 0.58,
                radius: 2 + Math.random() * 2.5,
                color: p % 2 === 0 ? '#fef08a' : (p % 3 === 0 ? '#38bdf8' : '#78716c'),
                alpha: 1,
                life: 25,
                type: p % 3 === 0 ? 'spark' : 'stone_chip',
              });
            }
          }

          if (cage.phaseTimer >= cage.collapseDurationMs) {
            cage.phase = 'finished';
          }
        }

        if (cage.phase === 'finished') {
          g.conductiveCages.splice(cIdx, 1);
        }
      }

      // 4.10 Actualizar Prisión de Permafrost (Hielo + Tierra: Barrera, Bloqueo, Ralentización y Detonación por Metralla)
      for (let prIdx = g.permafrostPrisons.length - 1; prIdx >= 0; prIdx--) {
        const prison = g.permafrostPrisons[prIdx];
        prison.phaseTimer += dt;

        // FASE 1: ERUPCIÓN (220 ms)
        if (prison.phase === 'erupting') {
          const prog = Math.min(1.0, prison.phaseTimer / prison.eruptDurationMs);
          prison.monoliths.forEach((m) => {
            m.height = m.maxHeight * Math.sin(prog * Math.PI * 0.5);
          });
          if (prison.phaseTimer >= prison.eruptDurationMs) {
            prison.phase = 'active';
            prison.phaseTimer = 0;
            prison.monoliths.forEach((m) => {
              m.height = m.maxHeight;
            });
          }
        }
        // FASE 2: ACTIVA (BARRERA FÍSICA, COBERTURA Y RALENTIZACIÓN)
        else if (prison.phase === 'active') {
          const isExpired = prison.phaseTimer >= prison.activeDurationMs;

          // A. Colisión sólida de monolitos con el Mago
          prison.monoliths.forEach((m) => {
            if (m.shattered) return;
            const dx = wizard.x - m.x;
            const dy = (wizard.y - m.y) / 0.58;
            const dist = Math.hypot(dx, dy);
            const minDist = m.radius + 14;
            if (dist < minDist && dist > 0.01) {
              const overlap = minDist - dist;
              wizard.x += (dx / dist) * overlap;
              wizard.y += (dy / dist) * overlap * 0.58;
            }
          });

          // B. Colisión y ralentización por proximidad con cada enemigo
          for (const enemy of g.enemyManager.enemies) {
            if (enemy.hp <= 0) continue;

            for (const m of prison.monoliths) {
              if (m.shattered) continue;

              const dx = enemy.x - m.x;
              const dy = (enemy.y - m.y) / 0.58;
              const dist = Math.hypot(dx, dy);

              // B.1 Obstáculo físico: separar enemigo si intenta atravesar el monolito
              const minDist = m.radius + enemy.radius;
              if (dist < minDist && dist > 0.01) {
                const overlap = minDist - dist;
                enemy.x += (dx / dist) * overlap;
                enemy.y += (dy / dist) * overlap * 0.58;
              }

              // B.2 Ralentización por proximidad fría (30% de slow continuo)
              if (dist < m.radius + 30) {
                g.enemyManager.applyStatus(enemy, 'slowed', 45);
              }
            }
          }

          // C. Comprobar destrucción por daño o expiración de tiempo
          prison.monoliths.forEach((m) => {
            if (m.shattered) return;
            if (m.hitFlash > 0) m.hitFlash--;

            if (m.hp <= 0 || isExpired) {
              // DETONACIÓN Y FRAGMENTACIÓN EXPLOSIVA
              m.shattered = true;
              m.shatterTimer = 0;
              elementalSound.playPermafrostShatter(prison.isCharged);
              g.screenShake = Math.max(g.screenShake, prison.isCharged ? 8.5 : 5.5);

              // Daño de fragmentación radial (~75px) a los enemigos circundantes
              for (const enemy of g.enemyManager.enemies) {
                if (enemy.hp <= 0) continue;
                const dist = Math.hypot(enemy.x - m.x, (enemy.y - m.y) / 0.58);
                if (dist <= 75) {
                  enemy.hp -= prison.fragmentationDamage;
                  enemy.hitFlash = 14;
                  g.enemyManager.applyStatus(enemy, 'slowed', 120);

                  // Empuje radial hacia afuera
                  const knockAng = Math.atan2((enemy.y - m.y) / 0.58, enemy.x - m.x);
                  enemy.x += Math.cos(knockAng) * 16;
                  enemy.y += Math.sin(knockAng) * 16 * 0.58;

                  g.floatingTexts.push({
                    id: `frag_${frameNow}_${enemy.id}_${m.id}`,
                    x: enemy.x,
                    y: enemy.y - 20,
                    text: `-${prison.fragmentationDamage} ❄️ METRALLA`,
                    color: '#80d8ff',
                    fontSize: 14,
                    opacity: 1,
                    vy: -1.2,
                    life: 30,
                  });
                }
              }

              // Proyectar esquirlas afiladas de hielo y fragmentos de roca
              for (let s = 0; s < 16; s++) {
                const sAng = Math.random() * Math.PI * 2;
                const sSpd = 2.5 + Math.random() * 4.5;
                g.particles.push({
                  x: m.x,
                  y: m.y - m.height * 0.4,
                  vx: Math.cos(sAng) * sSpd,
                  vy: Math.sin(sAng) * sSpd * 0.58 - 1.0,
                  radius: 1.8 + Math.random() * 2.2,
                  color: s % 2 === 0 ? '#00e5ff' : (s % 3 === 0 ? '#ffffff' : '#37474f'),
                  alpha: 1,
                  life: 22,
                  type: s % 3 === 0 ? 'stone_chip' : 'ice',
                });
              }
            }
          });

          // Si todos los monolitos están destruidos o expiró el tiempo, pasar a fase de fragmentación
          const allShattered = prison.monoliths.every((m) => m.shattered);
          if (allShattered) {
            prison.phase = 'shattering';
            prison.phaseTimer = 0;
          }
        }
        // FASE 3: SHATTERING (animación final de disolución y limpieza limpia)
        else if (prison.phase === 'shattering') {
          if (prison.phaseTimer >= prison.shatterDurationMs) {
            prison.phase = 'finished';
          }
        }

        if (prison.phase === 'finished') {
          g.permafrostPrisons.splice(prIdx, 1);
        }
      }

      // 4.10 Actualizar Tornado de Plasma (Fuego + Rayo: Vórtice Móvil, Succión Gravitatoria, Absorción de Proyectiles y Detonación)
      for (let ptIdx = g.plasmaTornadoes.length - 1; ptIdx >= 0; ptIdx--) {
        const tornado = g.plasmaTornadoes[ptIdx];
        tornado.phaseTimer += 16.6;
        tornado.swirlAngle += 0.28;

        // FASE 1: DESPLAZAMIENTO LINEAL Y VÓRTICE ACTIVO
        if (tornado.phase === 'moving') {
          // A. Movimiento continuo
          tornado.x += tornado.vx;
          tornado.y += tornado.vy;
          tornado.travelDistance = Math.hypot(tornado.x - tornado.startX, (tornado.y - tornado.startY) / 0.58);

          // Spawn de partículas de estela en el suelo y chispas
          if (Math.random() < 0.65) {
            const trAng = Math.random() * Math.PI * 2;
            const trDist = Math.random() * tornado.radius * 0.8;
            g.particles.push({
              id: `tornado_trail_${frameNow}_${Math.random()}`,
              x: tornado.x + Math.cos(trAng) * trDist,
              y: tornado.y + Math.sin(trAng) * trDist * 0.58,
              vx: -tornado.vx * 0.2 + (Math.random() - 0.5) * 1.5,
              vy: -tornado.vy * 0.2 + (Math.random() - 0.5) * 1.0,
              radius: 1.5 + Math.random() * 2.0,
              color: Math.random() < 0.5 ? '#00e5ff' : (Math.random() < 0.7 ? '#ff6d00' : '#ffffff'),
              alpha: 0.9,
              life: 14,
            });
          }

          // B. Detección de colisión contra obstáculos sólidos o límites del terreno
          const hitObstacle = g.terrainManager.obstacles.some((obs) => {
            if (!obs.solid) return false;
            const odx = tornado.x - obs.x;
            const ody = (tornado.y - obs.y) / 0.58;
            return Math.hypot(odx, ody) < tornado.radius * 0.65 + obs.radius;
          });

          // Si colisiona con obstáculo, llega a maxDistance o expira movingDurationMs -> colapsar e iniciar detonación
          if (hitObstacle || tornado.travelDistance >= tornado.maxDistance || tornado.phaseTimer >= tornado.movingDurationMs) {
            tornado.phase = 'collapsing';
            tornado.phaseTimer = 0;
          }

          // C. Intercepción y desintegración de proyectiles hostiles
          for (let pIdx = g.projectiles.length - 1; pIdx >= 0; pIdx--) {
            const p = g.projectiles[pIdx];
            if (!p.isHostile) continue;
            const pdx = p.x - tornado.x;
            const pdy = (p.y - tornado.y) / 0.58;
            const pDist = Math.hypot(pdx, pdy);
            if (pDist <= tornado.radius + p.radius + 6) {
              // Absorción y desintegración del proyectil sin mutación de array
              g.projectilePool.deactivate(p as PooledProjectile);
              elementalSound.playPlasmaDisintegrate();

              // Chispas de ionización por proyectil absorbido
              for (let s = 0; s < 5; s++) {
                const sAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  id: `disintegrate_${frameNow}_${Math.random()}`,
                  x: p.x,
                  y: p.y,
                  vx: Math.cos(sAng) * (2.0 + Math.random() * 2.5),
                  vy: Math.sin(sAng) * (1.2 + Math.random() * 1.5),
                  radius: 1.4 + Math.random() * 1.4,
                  color: s % 2 === 0 ? '#00e5ff' : '#ffea00',
                  alpha: 1,
                  life: 12,
                });
              }

              g.floatingTexts.push({
                id: `disint_txt_${frameNow}_${pIdx}`,
                x: p.x,
                y: p.y - 12,
                text: '⚡ DISUELTO',
                color: '#00e5ff',
                fontSize: 11,
                opacity: 0.9,
                vy: -0.9,
                life: 20,
              });
            }
          }

          // D. Atracción gravitatoria de enemigos (Succión hacia el ojo del vórtice)
          for (const enemy of g.enemyManager.enemies) {
            if (enemy.hp <= 0) continue;
            const edx = tornado.x - enemy.x;
            const edy = (tornado.y - enemy.y) / 0.58;
            const eDist = Math.hypot(edx, edy);

            if (eDist <= tornado.suctionRadius) {
              const pullAngle = Math.atan2(edy, edx);
              const isBoss = enemy.archetype === 'boss' || enemy.maxHp > 250;
              // Fuerza gravitatoria: más intensa cerca del núcleo
              const normalizedDist = Math.max(0, 1 - eDist / (tornado.suctionRadius + 15));
              const basePull = (1.5 + normalizedDist * 3.5) * (isBoss ? 0.25 : 1.0);
              const tangentialPull = (1.2 * normalizedDist) * (isBoss ? 0.15 : 1.0);

              // Vector de succión con componente tangencial para generar espiral
              const pullVx = (Math.cos(pullAngle) * basePull - Math.sin(pullAngle) * tangentialPull);
              const pullVy = (Math.sin(pullAngle) * basePull + Math.cos(pullAngle) * tangentialPull) * 0.58;

              enemy.x += pullVx;
              enemy.y += pullVy;

              // Micro-ralentización para que no escapen fácilmente
              if (!isBoss) {
                g.enemyManager.applyStatus(enemy, 'slowed', 20);
              }

              // E. Daño periódico por contacto (ticks cada tickIntervalMs)
              if (eDist <= tornado.radius + enemy.radius) {
                const lastTick = tornado.lastTickPerEnemy[enemy.id] || 0;
                if (frameNow - lastTick >= tornado.tickIntervalMs) {
                  tornado.lastTickPerEnemy[enemy.id] = frameNow;
                  enemy.hp -= tornado.tickDamage;
                  enemy.hitFlash = 8;

                  g.floatingTexts.push({
                    id: `tornado_tick_${frameNow}_${enemy.id}`,
                    x: enemy.x,
                    y: enemy.y - 16,
                    text: `-${tornado.tickDamage} ⚡`,
                    color: Math.random() < 0.5 ? '#00e5ff' : '#ff6d00',
                    fontSize: 13,
                    opacity: 1,
                    vy: -1.0,
                    life: 22,
                  });

                  // Chispas de impacto de plasma
                  for (let sp = 0; sp < 4; sp++) {
                    const spAng = Math.random() * Math.PI * 2;
                    g.particles.push({
                      id: `plasma_hit_${frameNow}_${Math.random()}`,
                      x: enemy.x,
                      y: enemy.y - 10,
                      vx: Math.cos(spAng) * 2.5,
                      vy: Math.sin(spAng) * 1.5,
                      radius: 1.5,
                      color: sp % 2 === 0 ? '#00e5ff' : '#ffb74d',
                      alpha: 1,
                      life: 12,
                    });
                  }
                }
              }
            }
          }
        }
        // FASE 2: COLAPSO (contracción previa a la detonación final)
        else if (tornado.phase === 'collapsing') {
          // Desacelera y se contrae rápidamente (~140ms)
          tornado.scale = Math.max(0.6, (tornado.isCharged ? 1.35 : 1.0) * (1 - (tornado.phaseTimer / tornado.collapseDurationMs) * 0.4));
          tornado.swirlAngle += 0.45; // Acelera rotación en el colapso

          if (tornado.phaseTimer >= tornado.collapseDurationMs) {
            tornado.phase = 'detonating';
            tornado.phaseTimer = 0;
          }
        }
        // FASE 3: DETONACIÓN TERMINAL DE PLASMA
        else if (tornado.phase === 'detonating') {
          if (!tornado.hasDetonated) {
            tornado.hasDetonated = true;
            elementalSound.playPlasmaTornadoDetonate(tornado.isCharged);
            g.screenShake = Math.max(g.screenShake, tornado.isCharged ? 14 : 9);

            const blastRadius = tornado.isCharged ? 98 : 72;

            // Onda de choque explosiva radial sobre todos los enemigos en alcance
            for (const enemy of g.enemyManager.enemies) {
              if (enemy.hp <= 0) continue;
              const bdx = enemy.x - tornado.x;
              const bdy = (enemy.y - tornado.y) / 0.58;
              const bDist = Math.hypot(bdx, bdy);

              if (bDist <= blastRadius) {
                tornado.hitDetonationEnemyIds.push(enemy.id);
                enemy.hp -= tornado.terminalDamage;
                enemy.hitFlash = 16;

                // Empuje explosivo masivo hacia afuera
                const knockAngle = Math.atan2(bdy, bdx);
                const knockDist = (tornado.isCharged ? 22 : 15) * Math.max(0.4, 1 - bDist / (blastRadius + 20));
                enemy.x += Math.cos(knockAngle) * knockDist;
                enemy.y += Math.sin(knockAngle) * knockDist * 0.58;

                // Aturdimiento breve por conmoción plasmática y choque eléctrico
                enemy.stunnedTimer = tornado.isCharged ? 65 : 40;
                g.enemyManager.applyStatus(enemy, 'shocked', tornado.isCharged ? 70 : 45);

                g.floatingTexts.push({
                  id: `tornado_det_${frameNow}_${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 24,
                  text: `💥 -${tornado.terminalDamage} PLASMA!`,
                  color: '#00e5ff',
                  fontSize: 15,
                  opacity: 1,
                  vy: -1.3,
                  life: 34,
                });
              }
            }

            // Anillo expansivo de onda de choque
            g.particles.push({
              id: `plasma_ring_${frameNow}`,
              x: tornado.x,
              y: tornado.y,
              vx: 0,
              vy: 0,
              radius: 12,
              color: '#00e5ff',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });

            // Explosión de chispas de plasma y rayos
            const blastParticles = tornado.isCharged ? 28 : 18;
            for (let bp = 0; bp < blastParticles; bp++) {
              const bpAng = Math.random() * Math.PI * 2;
              const bpSpd = 3.0 + Math.random() * 5.5;
              g.particles.push({
                id: `plasma_blast_pt_${frameNow}_${bp}`,
                x: tornado.x,
                y: tornado.y - 8,
                vx: Math.cos(bpAng) * bpSpd,
                vy: Math.sin(bpAng) * bpSpd * 0.58,
                radius: 1.8 + Math.random() * 2.5,
                color: bp % 3 === 0 ? '#00e5ff' : (bp % 3 === 1 ? '#ff6d00' : '#ffffff'),
                alpha: 1,
                life: 20 + Math.floor(Math.random() * 8),
              });
            }
          }

          if (tornado.phaseTimer >= tornado.detonateDurationMs) {
            tornado.phase = 'finished';
          }
        }

        // Limpieza de tornados terminados
        if (tornado.phase === 'finished') {
          g.plasmaTornadoes.splice(ptIdx, 1);
        }
      }

      // 4.11 Actualizar Lluvia del Infierno (Fuego + Fuego + Fuego: Salva de Meteoritos Balísticos, Detonación de Área y Cráteres de Magma)
      for (let hrIdx = g.hellRains.length - 1; hrIdx >= 0; hrIdx--) {
        const rain = g.hellRains[hrIdx];
        rain.elapsedMs += 16.6;

        let allMeteorsImpacted = true;

        // A. Actualizar meteoritos individuales
        for (const meteor of rain.meteors) {
          if (meteor.hasImpacted) continue;

          // Esperar retardo escalonado de invocación
          if (rain.elapsedMs < meteor.delayMs) {
            allMeteorsImpacted = false;
            continue;
          }

          // Comenzar silbido atmosférico al iniciar descenso
          if (meteor.flightProgress === 0) {
            elementalSound.playHellMeteorWhistle();
          }

          meteor.flightProgress = Math.min(1.0, meteor.flightProgress + 16.6 / meteor.flightDurationMs);

          // Interpolación de posición de vuelo (desde startX, startY hasta targetX, targetY)
          const fp = meteor.flightProgress;
          meteor.currentX = meteor.startX + (meteor.targetX - meteor.startX) * fp;
          meteor.currentY = meteor.startY + (meteor.targetY - meteor.startY) * fp;

          // Estela de fuego, humo y brasas durante la reentrada balística
          if (Math.random() < 0.65) {
            g.particles.push({
              id: `hell_trail_${frameNow}_${Math.random()}`,
              x: meteor.currentX + (Math.random() - 0.5) * 8,
              y: meteor.currentY + (Math.random() - 0.5) * 8,
              vx: (meteor.startX - meteor.targetX) * 0.02 + (Math.random() - 0.5) * 1.5,
              vy: (meteor.startY - meteor.targetY) * 0.02 + (Math.random() - 0.5) * 1.5,
              radius: (meteor.isColossal ? 3.4 : 2.2) * (1 - fp * 0.4),
              color: Math.random() < 0.35 ? '#ffffff' : (Math.random() < 0.7 ? '#ffd600' : '#ff3d00'),
              alpha: 0.9,
              life: 14,
            });
          }

          // ¿Llegó al punto de impacto en el suelo?
          if (fp >= 1.0) {
            meteor.hasImpacted = true;
            meteor.currentX = meteor.targetX;
            meteor.currentY = meteor.targetY;

            // Sonido detonante sísmico y sacudida de pantalla
            elementalSound.playHellMeteorExplosion(meteor.isColossal);
            g.screenShake = meteor.isColossal ? 15 : 7.5;

            // Anillo expansivo de onda de choque
            g.particles.push({
              id: `hell_shock_${frameNow}_${meteor.id}`,
              x: meteor.targetX,
              y: meteor.targetY,
              vx: 0,
              vy: 0,
              radius: meteor.isColossal ? 26 : 14,
              color: meteor.isColossal ? '#ffd600' : '#ff3d00',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });

            // Metralla y fragmentos de roca volcánica ardiente
            const debrisCount = meteor.isColossal ? 20 : 12;
            for (let d = 0; d < debrisCount; d++) {
              const dAng = Math.random() * Math.PI * 2;
              const dSpd = 2.5 + Math.random() * (meteor.isColossal ? 5.5 : 3.8);
              g.particles.push({
                id: `hell_debris_${frameNow}_${d}`,
                x: meteor.targetX,
                y: meteor.targetY,
                vx: Math.cos(dAng) * dSpd,
                vy: Math.sin(dAng) * dSpd * 0.58 - 1.2,
                radius: 1.8 + Math.random() * (meteor.isColossal ? 2.8 : 1.8),
                color: d % 3 === 0 ? '#ffffff' : (d % 3 === 1 ? '#ffd600' : '#ff3d00'),
                alpha: 1,
                life: 20,
              });
            }

            // Daño directo, retroceso e ignición a enemigos en el radio de impacto
            for (const enemy of enemies) {
              const dist = Math.hypot(enemy.x - meteor.targetX, (enemy.y - meteor.targetY) / 0.58);
              if (dist <= meteor.impactRadius) {
                const finalImpactDmg = Math.round(meteor.impactDamage * (meteor.isColossal ? 1.0 : (0.85 + Math.random() * 0.3)));
                enemy.hp -= finalImpactDmg;
                enemy.hitFlash = 14;
                g.enemyManager.applyStatus(enemy, 'burning', meteor.isColossal ? 180 : 120, 6);

                // Knockback radial
                const kbAng = Math.atan2(enemy.y - meteor.targetY, enemy.x - meteor.targetX);
                const kbForce = meteor.isColossal ? 7.5 : 4.5;
                enemy.vx = (enemy.vx || 0) + Math.cos(kbAng) * kbForce;
                enemy.vy = (enemy.vy || 0) + Math.sin(kbAng) * kbForce * 0.58;

                // Texto flotante de impacto
                g.floatingTexts.push({
                  id: `hell_hit_${frameNow}_${enemy.id}_${Math.random()}`,
                  x: enemy.x + (Math.random() - 0.5) * 16,
                  y: enemy.y - 18,
                  text: meteor.isColossal ? `💥 ¡${finalImpactDmg}! 🔥` : `-${finalImpactDmg} ☄️`,
                  color: meteor.isColossal ? '#ffd600' : '#ff5722',
                  fontSize: meteor.isColossal ? 16 : 13,
                  opacity: 1,
                  vy: -1.4,
                  life: 34,
                });
              }
            }

            // Crear cráter de magma persistente en el suelo
            rain.craters.push({
              id: `crater_${meteor.id}`,
              x: meteor.targetX,
              y: meteor.targetY,
              radius: meteor.isColossal ? 58 : 34,
              lifeTimerMs: meteor.isColossal ? 2600 : 2200,
              maxLifeMs: meteor.isColossal ? 2600 : 2200,
              tickIntervalMs: 250,
              lastTickPerEnemy: {},
              dpsPerTick: Math.round((meteor.isColossal ? 24 : 16) + (player.stats.attack + player.stats.knowledge) * 0.1),
              isColossal: meteor.isColossal,
            });
          } else {
            allMeteorsImpacted = false;
          }
        }

        // B. Actualizar cráteres de magma (daño continuo a enemigos que pisen el magma)
        for (let cIdx = rain.craters.length - 1; cIdx >= 0; cIdx--) {
          const crater = rain.craters[cIdx];
          crater.lifeTimerMs -= 16.6;

          // Chispas y burbujas de lava esporádicas
          if (Math.random() < 0.22) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = Math.random() * crater.radius * 0.75;
            g.particles.push({
              id: `magma_bubble_${frameNow}_${Math.random()}`,
              x: crater.x + Math.cos(pAng) * pDist,
              y: crater.y + Math.sin(pAng) * pDist * 0.58,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -0.6 - Math.random() * 0.8,
              radius: 1.2 + Math.random() * 1.5,
              color: Math.random() < 0.6 ? '#ffd600' : '#ff3d00',
              alpha: 0.9,
              life: 14,
            });
          }

          // Chequeo de daño de magma cada 250ms
          for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - crater.x, (enemy.y - crater.y) / 0.58);
            if (dist <= crater.radius) {
              const lastTick = crater.lastTickPerEnemy[enemy.id] || 0;
              if (rain.elapsedMs - lastTick >= crater.tickIntervalMs) {
                crater.lastTickPerEnemy[enemy.id] = rain.elapsedMs;

                enemy.hp -= crater.dpsPerTick;
                enemy.hitFlash = 6;
                g.enemyManager.applyStatus(enemy, 'burning', 75, 5);

                if (Math.random() < 0.35) {
                  elementalSound.playMagmaCraterSizzle();
                }

                g.floatingTexts.push({
                  id: `crater_burn_${frameNow}_${enemy.id}_${Math.random()}`,
                  x: enemy.x + (Math.random() - 0.5) * 14,
                  y: enemy.y - 14,
                  text: `-${crater.dpsPerTick} 🔥`,
                  color: '#ff6d00',
                  fontSize: 11,
                  opacity: 0.9,
                  vy: -1.0,
                  life: 20,
                });
              }
            }
          }

          if (crater.lifeTimerMs <= 0) {
            rain.craters.splice(cIdx, 1);
          }
        }

        // C. Limpieza cuando todos los meteoritos impactaron y los cráteres se extinguieron
        if (allMeteorsImpacted && rain.craters.length === 0) {
          g.hellRains.splice(hrIdx, 1);
        }
      }

      // 4.12 Actualizar Tormenta Celestial (Rayo + Rayo + Rayo: Tempestad Ionizada, Relámpagos Verticales en Cascada y Charcos de Estática)
      for (let csIdx = g.celestialStorms.length - 1; csIdx >= 0; csIdx--) {
        const storm = g.celestialStorms[csIdx];
        storm.elapsedMs += 16.6;

        let allStrikesFinished = true;

        // A. Actualizar relámpagos individuales
        for (const strike of storm.strikes) {
          // Si aún no ha llegado el momento del rayo
          if (!strike.hasStruck) {
            if (storm.elapsedMs >= strike.delayMs) {
              // ¡IMPACTO DEL RELÁMPAGO VERTICAL!
              strike.hasStruck = true;
              strike.strikeProgress = 0.01;

              // Generar trazado procedural quebrado del rayo vertical
              const startX = strike.targetX + (Math.random() - 0.5) * 26;
              const startY = strike.targetY - 450;
              const segments: Array<{ x1: number; y1: number; x2: number; y2: number; branch?: boolean }> = [];
              const steps = 8;
              let currX = startX;
              let currY = startY;

              for (let s = 1; s <= steps; s++) {
                const nextT = s / steps;
                const nextX = startX + (strike.targetX - startX) * nextT + (s < steps ? (Math.random() - 0.5) * (strike.isColossal ? 34 : 22) : 0);
                const nextY = startY + (strike.targetY - startY) * nextT;
                segments.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });

                // Ramificaciones laterales secundarias esporádicas
                if (s > 2 && s < steps - 1 && Math.random() < 0.5) {
                  const bAng = Math.PI * 0.5 + (Math.random() - 0.5) * 1.2;
                  const bLen = 16 + Math.random() * (strike.isColossal ? 35 : 22);
                  segments.push({
                    x1: nextX,
                    y1: nextY,
                    x2: nextX + Math.cos(bAng) * bLen,
                    y2: nextY + Math.sin(bAng) * bLen,
                    branch: true,
                  });
                }

                currX = nextX;
                currY = nextY;
              }
              strike.boltSegments = segments;

              // Sonido detonante y sacudida de pantalla
              elementalSound.playCelestialLightningStrike(strike.isColossal);
              g.screenShake = strike.isColossal ? 14 : 7;

              // Anillo de impacto electromagnético
              g.particles.push({
                id: `celestial_ring_${frameNow}_${strike.id}`,
                x: strike.targetX,
                y: strike.targetY,
                vx: 0,
                vy: 0,
                radius: strike.isColossal ? 24 : 14,
                color: strike.isColossal ? '#7c4dff' : '#00f0ff',
                alpha: 1,
                life: 16,
                maxLife: 16,
                type: 'ring',
              });

              // Chispas radiales de alta tensión
              const sparkCount = strike.isColossal ? 22 : 12;
              for (let sp = 0; sp < sparkCount; sp++) {
                const spAng = Math.random() * Math.PI * 2;
                const spSpd = 3.0 + Math.random() * (strike.isColossal ? 5.5 : 3.8);
                g.particles.push({
                  id: `celestial_spark_${frameNow}_${sp}`,
                  x: strike.targetX,
                  y: strike.targetY,
                  vx: Math.cos(spAng) * spSpd,
                  vy: Math.sin(spAng) * spSpd * 0.58 - 1.2,
                  radius: 1.6 + Math.random() * (strike.isColossal ? 2.5 : 1.6),
                  color: sp % 3 === 0 ? '#ffffff' : (sp % 3 === 1 ? '#00f0ff' : '#7c4dff'),
                  alpha: 1,
                  life: 18,
                });
              }

              // Daño directo, micro-aturdimiento (micro-stagger 200ms) e interrupción a enemigos
              for (const enemy of enemies) {
                const dist = Math.hypot(enemy.x - strike.targetX, (enemy.y - strike.targetY) / 0.58);
                if (dist <= strike.impactRadius) {
                  const finalStrikeDmg = Math.round(strike.impactDamage * (strike.isColossal ? 1.0 : (0.85 + Math.random() * 0.3)));
                  enemy.hp -= finalStrikeDmg;
                  enemy.hitFlash = 12;
                  enemy.stunnedTimer = 14; // Micro-stagger de ~230ms
                  enemy.attackCooldown = Math.max(enemy.attackCooldown || 0, 16); // Interrupción de ataques en curso
                  g.enemyManager.applyStatus(enemy, 'shocked', strike.isColossal ? 160 : 100, 5);

                  // Knockback radial
                  const kbAng = Math.atan2(enemy.y - strike.targetY, enemy.x - strike.targetX);
                  const kbForce = strike.isColossal ? 7.0 : 4.0;
                  enemy.vx = (enemy.vx || 0) + Math.cos(kbAng) * kbForce;
                  enemy.vy = (enemy.vy || 0) + Math.sin(kbAng) * kbForce * 0.58;

                  // Texto flotante de daño
                  g.floatingTexts.push({
                    id: `celestial_hit_${frameNow}_${enemy.id}_${Math.random()}`,
                    x: enemy.x + (Math.random() - 0.5) * 16,
                    y: enemy.y - 18,
                    text: strike.isColossal ? `⚡ ¡${finalStrikeDmg}! 🌩️` : `-${finalStrikeDmg} ⚡`,
                    color: strike.isColossal ? '#7c4dff' : '#00f0ff',
                    fontSize: strike.isColossal ? 16 : 13,
                    opacity: 1,
                    vy: -1.4,
                    life: 34,
                  });
                }
              }

              // Crear charco de estática ionizada residual en el suelo
              storm.puddles.push({
                id: `puddle_${strike.id}`,
                x: strike.targetX,
                y: strike.targetY,
                radius: strike.isColossal ? 58 : 34,
                lifeTimerMs: strike.isColossal ? 2200 : 1800,
                maxLifeMs: strike.isColossal ? 2200 : 1800,
                tickIntervalMs: 200,
                lastTickPerEnemy: {},
                dpsPerTick: Math.round((strike.isColossal ? 22 : 14) + (player.stats.attack + player.stats.knowledge) * 0.1),
                isColossal: strike.isColossal,
                detonated: false,
              });

              // Si es el rayo colosal final, detonar todos los charcos ionizados restantes al mismo tiempo
              if (strike.isColossal && !storm.terminalDetonated) {
                storm.terminalDetonated = true;
                elementalSound.playCelestialTerminalDetonation();
                g.screenShake = 16;

                storm.puddles.forEach((puddle) => {
                  if (puddle.id !== `puddle_${strike.id}` && !puddle.detonated) {
                    puddle.detonated = true;

                    // Anillo de detonación sobre el charco
                    g.particles.push({
                      id: `detonation_ring_${frameNow}_${puddle.id}`,
                      x: puddle.x,
                      y: puddle.y,
                      vx: 0,
                      vy: 0,
                      radius: puddle.radius * 1.2,
                      color: '#00f0ff',
                      alpha: 1,
                      life: 16,
                      maxLife: 16,
                      type: 'ring',
                    });

                    // Daño explosivo de sobrecarga a los enemigos adyacentes al charco
                    for (const enemy of enemies) {
                      const pDist = Math.hypot(enemy.x - puddle.x, (enemy.y - puddle.y) / 0.58);
                      if (pDist <= puddle.radius * 1.3) {
                        const detDmg = Math.round(38 + (player.stats.attack + player.stats.knowledge) * 0.25);
                        enemy.hp -= detDmg;
                        enemy.hitFlash = 10;
                        enemy.stunnedTimer = 16;
                        g.floatingTexts.push({
                          id: `puddle_det_${frameNow}_${enemy.id}_${Math.random()}`,
                          x: enemy.x + (Math.random() - 0.5) * 14,
                          y: enemy.y - 20,
                          text: `💥 ¡${detDmg}! ⚡`,
                          color: '#00f0ff',
                          fontSize: 13,
                          opacity: 1,
                          vy: -1.3,
                          life: 30,
                        });
                      }
                    }
                  }
                });
              }
            } else {
              allStrikesFinished = false;
            }
          } else if (strike.strikeProgress > 0 && strike.strikeProgress <= 1.0) {
            // Avanzar progreso del destello visible
            strike.strikeProgress += 16.6 / strike.strikeDurationMs;
            if (strike.strikeProgress <= 1.0) {
              allStrikesFinished = false;
            }
          }
        }

        // B. Actualizar charcos de estática (daño periódico cada 200ms a quienes pisen el charco)
        for (let pIdx = storm.puddles.length - 1; pIdx >= 0; pIdx--) {
          const puddle = storm.puddles[pIdx];
          puddle.lifeTimerMs -= 16.6;

          // Chispas de estática continuas
          if (Math.random() < 0.22) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = Math.random() * puddle.radius * 0.7;
            g.particles.push({
              id: `puddle_spark_${frameNow}_${Math.random()}`,
              x: puddle.x + Math.cos(pAng) * pDist,
              y: puddle.y + Math.sin(pAng) * pDist * 0.58,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -0.8 - Math.random() * 1.0,
              radius: 1.2 + Math.random() * 1.4,
              color: Math.random() < 0.6 ? '#00f0ff' : '#ffffff',
              alpha: 0.9,
              life: 14,
            });
          }

          // Chequeo de daño de estática cada 200ms
          for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - puddle.x, (enemy.y - puddle.y) / 0.58);
            if (dist <= puddle.radius) {
              const lastTick = puddle.lastTickPerEnemy[enemy.id] || 0;
              if (storm.elapsedMs - lastTick >= puddle.tickIntervalMs) {
                puddle.lastTickPerEnemy[enemy.id] = storm.elapsedMs;

                enemy.hp -= puddle.dpsPerTick;
                enemy.hitFlash = 6;
                g.enemyManager.applyStatus(enemy, 'shocked', 70, 4);

                if (Math.random() < 0.35) {
                  elementalSound.playIonizedPuddleBuzz();
                }

                g.floatingTexts.push({
                  id: `puddle_shock_${frameNow}_${enemy.id}_${Math.random()}`,
                  x: enemy.x + (Math.random() - 0.5) * 14,
                  y: enemy.y - 14,
                  text: `-${puddle.dpsPerTick} ⚡`,
                  color: '#00f0ff',
                  fontSize: 11,
                  opacity: 0.9,
                  vy: -1.0,
                  life: 20,
                });
              }
            }
          }

          if (puddle.lifeTimerMs <= 0) {
            storm.puddles.splice(pIdx, 1);
          }
        }

        // C. Limpieza cuando todos los relámpagos terminaron y los charcos se disiparon
        if (allStrikesFinished && storm.puddles.length === 0) {
          g.celestialStorms.splice(csIdx, 1);
        }
      }

      // 4.13 Actualizar Glaciar Devastador (Hielo + Hielo + Hielo: Ventisca Continua, Ralentización -50%, Monolitos y Erupción Radial Congelante)
      for (let dgIdx = g.devastatingGlaciers.length - 1; dgIdx >= 0; dgIdx--) {
        const glacier = g.devastatingGlaciers[dgIdx];
        glacier.elapsedMs += 16.6;

        // A. Ventisca Continua y Ralentización Severa (-50% inmediata en toda la zona)
        for (const enemy of enemies) {
          if (enemy.hp <= 0) continue;
          const dist = Math.hypot(enemy.x - glacier.centerX, (enemy.y - glacier.centerY) / 0.58);
          if (dist <= glacier.areaRadius) {
            // Ralentización severa continua (-50% velocidad)
            g.enemyManager.applyStatus(enemy, 'slowed', 35);
          }
        }

        // B. Caída Secuencial de Monolitos Prismáticos
        let allMonolithsDone = true;
        for (const monolith of glacier.monoliths) {
          if (!monolith.hasImpacted) {
            if (glacier.elapsedMs >= monolith.delayMs) {
              monolith.flightProgress = Math.min(1.0, monolith.flightProgress + 16.6 / monolith.flightDurationMs);
              const fp = monolith.flightProgress;
              monolith.currentX = monolith.startX + (monolith.targetX - monolith.startX) * fp;
              monolith.currentY = monolith.startY + (monolith.targetY - monolith.startY) * fp;

              // Estela de cristales y vapor gélido
              if (Math.random() < 0.6) {
                g.particles.push({
                  id: `ice_trail_${frameNow}_${Math.random()}`,
                  x: monolith.currentX + (Math.random() - 0.5) * 12,
                  y: monolith.currentY + (Math.random() - 0.5) * 12,
                  vx: (monolith.startX - monolith.targetX) * 0.02 + (Math.random() - 0.5) * 1.2,
                  vy: (monolith.startY - monolith.targetY) * 0.02 + (Math.random() - 0.5) * 1.2,
                  radius: 1.8 + Math.random() * 2.2,
                  color: Math.random() < 0.5 ? '#ffffff' : '#00e5ff',
                  alpha: 0.85,
                  life: 14,
                });
              }

              // ¿Impacto del monolito contra el suelo?
              if (fp >= 1.0) {
                monolith.hasImpacted = true;
                monolith.currentX = monolith.targetX;
                monolith.currentY = monolith.targetY;

                elementalSound.playIceMonolithImpact();
                g.screenShake = 8;

                // Anillo de choque de vapor blanco
                g.particles.push({
                  id: `ice_shock_${frameNow}_${monolith.id}`,
                  x: monolith.targetX,
                  y: monolith.targetY,
                  vx: 0,
                  vy: 0,
                  radius: 16,
                  color: '#e0f7fa',
                  alpha: 1,
                  life: 16,
                  maxLife: 16,
                  type: 'ring',
                });

                // Metralla de fragmentos de hielo fracturados
                for (let d = 0; d < 14; d++) {
                  const dAng = Math.random() * Math.PI * 2;
                  const dSpd = 2.5 + Math.random() * 4.2;
                  g.particles.push({
                    id: `ice_debris_${frameNow}_${d}`,
                    x: monolith.targetX,
                    y: monolith.targetY,
                    vx: Math.cos(dAng) * dSpd,
                    vy: Math.sin(dAng) * dSpd * 0.58 - 1.2,
                    radius: 1.6 + Math.random() * 2.2,
                    color: d % 2 === 0 ? '#ffffff' : '#00e5ff',
                    alpha: 1,
                    life: 18,
                  });
                }

                // Daño contundente y ralentización en el punto de contacto
                for (const enemy of enemies) {
                  const dist = Math.hypot(enemy.x - monolith.targetX, (enemy.y - monolith.targetY) / 0.58);
                  if (dist <= monolith.impactRadius) {
                    const finalMonolithDmg = Math.round(monolith.impactDamage * (0.85 + Math.random() * 0.3));
                    enemy.hp -= finalMonolithDmg;
                    enemy.hitFlash = 12;
                    g.enemyManager.applyStatus(enemy, 'slowed', 120);

                    // Knockback radial
                    const kbAng = Math.atan2(enemy.y - monolith.targetY, enemy.x - monolith.targetX);
                    enemy.vx = (enemy.vx || 0) + Math.cos(kbAng) * 4.5;
                    enemy.vy = (enemy.vy || 0) + Math.sin(kbAng) * 4.5 * 0.58;

                    g.floatingTexts.push({
                      id: `ice_hit_${frameNow}_${enemy.id}_${Math.random()}`,
                      x: enemy.x + (Math.random() - 0.5) * 16,
                      y: enemy.y - 18,
                      text: `-${finalMonolithDmg} ❄️`,
                      color: '#00e5ff',
                      fontSize: 13,
                      opacity: 1,
                      vy: -1.3,
                      life: 30,
                    });
                  }
                }
              } else {
                allMonolithsDone = false;
              }
            } else {
              allMonolithsDone = false;
            }
          } else if (monolith.shatterProgress < 1.0) {
            monolith.shatterProgress += 16.6 / 180;
          }
        }

        // C. Erupción Radial Terminal (brota desde el centro hacia los bordes)
        if (allMonolithsDone && !glacier.eruptionTriggered) {
          glacier.eruptionTriggered = true;
          glacier.eruptionProgress = 0.01;
          elementalSound.playGlacialEruptionBurst(glacier.isCharged);
          g.screenShake = glacier.isCharged ? 16 : 10;

          // Anillo inicial expansivo de la erupción
          g.particles.push({
            id: `glacier_radial_wave_${frameNow}`,
            x: glacier.centerX,
            y: glacier.centerY,
            vx: 0,
            vy: 0,
            radius: 20,
            color: '#00e5ff',
            alpha: 1,
            life: 22,
            maxLife: 22,
            type: 'ring',
          });
        }

        if (glacier.eruptionTriggered && glacier.eruptionProgress <= 1.0) {
          glacier.eruptionProgress += 16.6 / glacier.eruptionDurationMs;
          const currentEruptRadius = glacier.eruptionMaxRadius * Math.min(1.0, glacier.eruptionProgress * 1.15);

          // Animar el crecimiento y despliegue de las agujas de hielo
          glacier.spikes.forEach((spike) => {
            if (spike.dist <= currentEruptRadius) {
              if (spike.eruptProgress < 1.0) {
                spike.eruptProgress = Math.min(1.0, spike.eruptProgress + 0.16);
                spike.height = spike.maxHeight * Math.sin(spike.eruptProgress * Math.PI * 0.5);
              }
            }
          });

          // Daño masivo y CONGELACIÓN GARANTIZADA a enemigos alcanzados por la onda expansiva
          for (const enemy of enemies) {
            if (glacier.eruptionHitEnemyIds.includes(enemy.id)) continue;
            const dist = Math.hypot(enemy.x - glacier.centerX, (enemy.y - glacier.centerY) / 0.58);
            if (dist <= currentEruptRadius + 14) {
              glacier.eruptionHitEnemyIds.push(enemy.id);

              const finalEruptDmg = Math.round(glacier.eruptionDamage * (0.9 + Math.random() * 0.2));
              enemy.hp -= finalEruptDmg;
              enemy.hitFlash = 16;

              // CONGELACIÓN TOTAL GARANTIZADA (110 frames ~ 1.83 segundos de inmovilización absoluta)
              g.enemyManager.applyStatus(enemy, 'frozen', 110, 4);
              enemy.stunnedTimer = 110;
              enemy.attackCooldown = Math.max(enemy.attackCooldown || 0, 110);
              elementalSound.playFrostSlowPulse();

              // Efecto de empalamiento vertical leve
              enemy.vy = (enemy.vy || 0) - 1.8;

              g.floatingTexts.push({
                id: `glacier_erupt_hit_${frameNow}_${enemy.id}_${Math.random()}`,
                x: enemy.x + (Math.random() - 0.5) * 16,
                y: enemy.y - 24,
                text: `💥 ¡${finalEruptDmg}! ❄️ ¡CONGELADO!`,
                color: '#80d8ff',
                fontSize: 15,
                opacity: 1,
                vy: -1.4,
                life: 38,
              });
            }
          }
        }

        // D. Finalización y Limpieza de Entidad
        if (glacier.elapsedMs >= glacier.totalDurationMs) {
          g.devastatingGlaciers.splice(dgIdx, 1);
        }
      }

      // 4.14 Actualizar Barrera Telúrica (Tierra + Tierra + Tierra: 3 Rocas Orbitales Consumibles)
      for (let tbIdx = g.telluricBarriers.length - 1; tbIdx >= 0; tbIdx--) {
        const barrier = g.telluricBarriers[tbIdx];
        const dtSec = dt / 1000;
        barrier.elapsedMs += dt; // dt ya está en milisegundos (~16.6ms)

        // Anclar el centro de la órbita exactamente al jugador
        barrier.centerX = wizard.x;
        barrier.centerY = wizard.y;

        // A. Avanzar ángulo de rotación orbital constante (~2.3 rad/s)
        barrier.orbitAngle += barrier.rotationSpeed * dtSec;

        // B. Rebalancear simétricamente los ángulos de las rocas activas
        const activeRocks = barrier.rocks.filter((r) => !r.destroyed);
        const activeCount = activeRocks.length;

        if (activeCount === 0 || barrier.elapsedMs >= barrier.durationMs) {
          // Si expira por tiempo o se consumieron las 3 rocas: finalizar
          if (activeCount > 0) {
            // Si expiró por tiempo con rocas aún flotando: desmoronar pacíficamente
            elementalSound.playTelluricCrumble();
            activeRocks.forEach((r) => {
              r.destroyed = true;
              for (let p = 0; p < 8; p++) {
                const pAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  id: `telluric_crumble_${frameNow}_${Math.random()}`,
                  x: r.x,
                  y: r.y - r.height,
                  vx: Math.cos(pAng) * (1.2 + Math.random() * 1.5),
                  vy: Math.sin(pAng) * 0.8 + 0.5,
                  radius: 1.2 + Math.random() * 1.8,
                  color: '#78350f',
                  alpha: 1,
                  life: 20,
                  type: 'stone_chip',
                });
              }
            });
            g.floatingTexts.push({
              id: `telluric_disperse_${frameNow}`,
              x: wizard.x,
              y: wizard.y - 25,
              text: '🛡️ BARRERA DISIPADA',
              color: '#d97706',
              fontSize: 11,
              opacity: 1,
              vy: -0.9,
              life: 30,
            });
          }

          barrier.finished = true;
          // Activar cooldown una vez concluida la habilidad
          g.lastAttackTime = performance.now();
          g.telluricBarriers.splice(tbIdx, 1);
          continue;
        }

        // C. Suavizado y redistribución angular simétrica de rocas supervivientes
        activeRocks.forEach((rock, idx) => {
          const targetOffset = (idx * Math.PI * 2) / activeCount;
          let diff = targetOffset - rock.currentAngleOffset;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          rock.currentAngleOffset += diff * barrier.realignSpeed;

          // Actualizar ángulo absoluto y coordenadas siguiendo fluidamente al jugador sin desfase
          rock.currentAngle = barrier.orbitAngle + rock.currentAngleOffset;
          rock.x = wizard.x + Math.cos(rock.currentAngle) * barrier.orbitRadiusX;
          rock.y = wizard.y + Math.sin(rock.currentAngle) * barrier.orbitRadiusY;
          rock.rotationAngle += 0.035;
          rock.pulseTimer += dtSec;
          if (rock.hitFlash > 0) rock.hitFlash--;
        });

        // D. Intercepción y destrucción de proyectiles hostiles
        for (let pIdx = g.projectiles.length - 1; pIdx >= 0; pIdx--) {
          const p = g.projectiles[pIdx];
          if (!p.isHostile || p.life <= 0) continue;

          for (let rIdx = 0; rIdx < activeRocks.length; rIdx++) {
            const rock = activeRocks[rIdx];
            if (rock.destroyed) continue;

            // Detección física en la órbita de la roca
            if (checkCircleCollision(rock.x, rock.y, rock.radius + 6, p.x, p.y, p.radius)) {
              // 1. Destruir proyectil hostil
              g.projectilePool.deactivate(p as PooledProjectile);
              elementalSound.playTelluricDeflect();

              // Chispas de impacto cinético y fragmentos de piedra
              for (let s = 0; s < 6; s++) {
                const sAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  id: `rock_deflect_${frameNow}_${Math.random()}`,
                  x: p.x,
                  y: p.y,
                  vx: Math.cos(sAng) * (2.2 + Math.random() * 2.0),
                  vy: Math.sin(sAng) * (1.5 + Math.random() * 1.5),
                  radius: 1.2 + Math.random() * 1.6,
                  color: s % 2 === 0 ? '#f59e0b' : '#ffffff',
                  alpha: 1,
                  life: 14,
                  type: 'spark',
                });
              }

              // Flash visual en la roca
              rock.hitFlash = 8;
              rock.hitPoints--;

              // Si se agota su durabilidad frente a proyectiles:
              if (rock.hitPoints <= 0) {
                rock.destroyed = true;
                elementalSound.playTelluricCrumble();
                for (let d = 0; d < 10; d++) {
                  const dAng = Math.random() * Math.PI * 2;
                  g.particles.push({
                    id: `rock_shatter_${frameNow}_${Math.random()}`,
                    x: rock.x,
                    y: rock.y - rock.height,
                    vx: Math.cos(dAng) * (2.0 + Math.random() * 2.5),
                    vy: Math.sin(dAng) * 1.5,
                    radius: 1.5 + Math.random() * 2.0,
                    color: '#78350f',
                    alpha: 1,
                    life: 22,
                    type: 'stone_chip',
                  });
                }
                g.floatingTexts.push({
                  id: `rock_broken_${frameNow}_${rock.id}`,
                  x: rock.x,
                  y: rock.y - rock.height - 12,
                  text: '🛡️ ROCA FRACTURADA',
                  color: '#f59e0b',
                  fontSize: 10,
                  opacity: 1,
                  vy: -1.0,
                  life: 25,
                });
              } else {
                g.floatingTexts.push({
                  id: `deflect_txt_${frameNow}_${pIdx}`,
                  x: p.x,
                  y: p.y - 12,
                  text: '🛡️ RECHAZADO',
                  color: '#f59e0b',
                  fontSize: 11,
                  opacity: 1,
                  vy: -1.0,
                  life: 20,
                });
              }

              break; // Proyectil eliminado, saltar al siguiente proyectil
            }
          }
        }

        // E. Detección y Detonación al chocar contra enemigos (Consumo destructivo)
        for (let rIdx = 0; rIdx < activeRocks.length; rIdx++) {
          const rock = activeRocks[rIdx];
          if (rock.destroyed) continue;

          for (let eIdx = 0; eIdx < enemies.length; eIdx++) {
            const enemy = enemies[eIdx];
            if (enemy.hp <= 0) continue;

            if (checkCircleCollision(rock.x, rock.y, rock.radius + 2, enemy.x, enemy.y, enemy.radius)) {
              // 1. Impacto seco inmediato: destruir esta roca individual
              rock.destroyed = true;

              // 2. Daño contundente masivo + stats (+50% si fue cargada)
              const finalRockDmg = barrier.damagePerRock;
              enemy.hp -= finalRockDmg;
              enemy.hitFlash = 12;

              // 3. Micro-aturdimiento e interrupción de 300 ms (~18 frames)
              enemy.isTelegraphing = false;
              enemy.telegraphTimer = 0;
              enemy.attackCooldown = Math.max(enemy.attackCooldown || 0, 18);
              enemy.stunnedTimer = Math.max(enemy.stunnedTimer || 0, 18);

              // Empuje contundente
              const kx = enemy.x - wizard.x;
              const ky = enemy.y - wizard.y;
              const kDist = Math.hypot(kx, ky) || 1;
              enemy.vx = (kx / kDist) * barrier.knockback;
              enemy.vy = (ky / kDist) * (barrier.knockback * 0.58);

              // Efectos de sonido y cámara
              elementalSound.playTelluricRockDetonation(barrier.isCharged);
              g.screenShake = barrier.isCharged ? 8 : 5;

              // Explosión de fragmentos de roca, polvo y esquirlas
              for (let p = 0; p < (barrier.isCharged ? 22 : 14); p++) {
                const pAng = Math.random() * Math.PI * 2;
                const pSpeed = 2.5 + Math.random() * 3.5;
                g.particles.push({
                  id: `telluric_detonate_${frameNow}_${Math.random()}`,
                  x: rock.x,
                  y: rock.y - rock.height,
                  vx: Math.cos(pAng) * pSpeed,
                  vy: Math.sin(pAng) * (pSpeed * 0.6) - 1.2,
                  radius: 1.8 + Math.random() * 2.8,
                  color: p % 3 === 0 ? '#fde047' : (p % 2 === 0 ? '#78350f' : '#3e2723'),
                  alpha: 1,
                  life: 25,
                  type: 'stone_chip',
                });
              }

              // Texto flotante de daño
              g.floatingTexts.push({
                id: `txt_rock_dmg_${frameNow}_${enemy.id}_${Math.random()}`,
                x: enemy.x + (Math.random() - 0.5) * 16,
                y: enemy.y - 28,
                text: barrier.isCharged ? `💥 ¡${finalRockDmg}! 🌍` : `💥 ${finalRockDmg}`,
                color: '#f59e0b',
                fontSize: barrier.isCharged ? 16 : 14,
                opacity: 1,
                vy: -1.4,
                life: 36,
              });

              break; // Esta roca ya explotó, no puede colisionar con otro enemigo
            }
          }
        }
      }

      // 4.15 Actualizar Volcán de Obsidiana (Fuego + Hielo + Tierra: Erupción Piroclástica, Vitrificación y Campo de Cuchillas)
      for (let ovIdx = g.obsidianVolcanoes.length - 1; ovIdx >= 0; ovIdx--) {
        const volcano = g.obsidianVolcanoes[ovIdx];
        volcano.elapsedMs += dt;
        volcano.phaseTimer += dt;

        // FASE A: Fractura térmica subterránea (0 - 180ms)
        if (volcano.phase === 'fracture') {
          // Partículas de vapor blanco a alta presión brotando de las fisuras
          if (Math.random() < 0.45) {
            const f = volcano.fissures[Math.floor(Math.random() * volcano.fissures.length)];
            const dist = f.length * (0.3 + Math.random() * 0.7);
            const fx = volcano.centerX + Math.cos(f.angle) * dist;
            const fy = volcano.centerY + Math.sin(f.angle) * (dist * 0.58);
            g.particles.push({
              id: `steam_puff_${frameNow}_${Math.random()}`,
              x: fx,
              y: fy,
              vx: (Math.random() - 0.5) * 1.4,
              vy: -2.6 - Math.random() * 2.4,
              radius: 2 + Math.random() * 3,
              color: '#f0fdfa',
              alpha: 0.75,
              life: 18,
              type: 'smoke',
            });
          }

          if (volcano.phaseTimer >= 180) {
            volcano.phase = 'eruption';
            volcano.phaseTimer = 0;
            volcano.eruptionProgress = 0;
          }
        }
        // FASE B: Erupción piroclástica explosiva (180 - 430ms, 250ms de duración)
        else if (volcano.phase === 'eruption') {
          volcano.eruptionProgress = Math.min(1.0, volcano.phaseTimer / 250);
          g.screenShake = Math.max(g.screenShake, volcano.isCharged ? 9.5 : 6.5);

          // Impacto explosivo inicial al detonar la columna
          if (!volcano.eruptionDealt) {
            volcano.eruptionDealt = true;
            elementalSound.playObsidianEruptionBurst(volcano.isCharged);

            // Daño y derribo a todos los enemigos en el área del volcán
            enemies.forEach((enemy) => {
              const dx = enemy.x - volcano.centerX;
              const dy = (enemy.y - volcano.centerY) / 0.58;
              const dist = Math.hypot(dx, dy);

              if (dist <= volcano.areaRadius) {
                const finalEruptDmg = volcano.eruptionDamage;
                enemy.hp -= finalEruptDmg;

                // Levantamiento vertical y empuje radial
                const pushAngle = Math.atan2(enemy.y - volcano.centerY, enemy.x - volcano.centerX);
                const pushForce = volcano.isCharged ? 11.5 : 8.5;
                enemy.x += Math.cos(pushAngle) * pushForce;
                enemy.y += Math.sin(pushAngle) * pushForce * 0.58;

                // Texto flotante de impacto piroclástico
                g.floatingTexts.push({
                  id: `txt_obs_erupt_${frameNow}_${enemy.id}`,
                  x: enemy.x + (Math.random() - 0.5) * 16,
                  y: enemy.y - 32,
                  text: volcano.isCharged ? `🌋 ¡ERUPCIÓN VÍTREA! -${finalEruptDmg}` : `🌋 -${finalEruptDmg}`,
                  color: volcano.isCharged ? '#f43f5e' : '#ea580c',
                  fontSize: volcano.isCharged ? 17 : 14,
                  opacity: 1,
                  vy: -1.6,
                  life: 38,
                });

                // Chispas de magma e impacto
                for (let k = 0; k < 8; k++) {
                  const sAng = Math.random() * Math.PI * 2;
                  g.particles.push({
                    id: `erupt_burst_${frameNow}_${k}`,
                    x: enemy.x,
                    y: enemy.y - 12,
                    vx: Math.cos(sAng) * (2.8 + Math.random() * 2.5),
                    vy: Math.sin(sAng) * (1.8 + Math.random() * 1.8) - 1.5,
                    radius: 1.6 + Math.random() * 1.8,
                    color: k % 2 === 0 ? '#ffedd5' : '#ea580c',
                    alpha: 1,
                    life: 20,
                    type: 'ember',
                  });
                }
              }
            });

            // Partículas masivas de la columna eruptiva
            for (let p = 0; p < (volcano.isCharged ? 35 : 24); p++) {
              const pAng = Math.random() * Math.PI * 2;
              const pDist = Math.random() * volcano.areaRadius * 0.6;
              g.particles.push({
                id: `erupt_col_${frameNow}_${p}`,
                x: volcano.centerX + Math.cos(pAng) * pDist,
                y: volcano.centerY + Math.sin(pAng) * pDist * 0.58,
                vx: (Math.random() - 0.5) * 3.5,
                vy: -3.8 - Math.random() * 4.5,
                radius: 2.0 + Math.random() * 3.0,
                color: p % 3 === 0 ? '#ffffff' : (p % 3 === 1 ? '#ea580c' : '#1e293b'),
                alpha: 1,
                life: 24,
                type: 'smoke',
              });
            }
          }

          if (volcano.phaseTimer >= 250) {
            volcano.phase = 'vitrification';
            volcano.phaseTimer = 0;
            elementalSound.playObsidianVitrifyHiss();
            g.screenShake = Math.max(g.screenShake, 3.5);

            // Explosión de vapor frío al solidificarse las cuchillas
            for (let v = 0; v < volcano.blades.length; v++) {
              const blade = volcano.blades[v];
              for (let s = 0; s < 4; s++) {
                g.particles.push({
                  id: `vitrify_steam_${frameNow}_${v}_${s}`,
                  x: blade.x,
                  y: blade.y,
                  vx: (Math.random() - 0.5) * 2.0,
                  vy: -1.2 - Math.random() * 2.2,
                  radius: 2.2 + Math.random() * 2.5,
                  color: '#e0f2fe',
                  alpha: 0.8,
                  life: 20,
                  type: 'smoke',
                });
              }
            }
          }
        }
        // FASE C: Vitrificación y crecimiento de las cuchillas (430 - 580ms, 150ms)
        else if (volcano.phase === 'vitrification') {
          const prog = Math.min(1.0, volcano.phaseTimer / 150);
          volcano.blades.forEach((b) => {
            b.growthProgress = prog;
          });

          if (volcano.phaseTimer >= 150) {
            volcano.phase = 'active_field';
            volcano.phaseTimer = 0;
            volcano.blades.forEach((b) => {
              b.growthProgress = 1.0;
            });
          }
        }
        // FASE D: Campo de cuchillas activo (4000ms de persistencia territorial)
        else if (volcano.phase === 'active_field') {
          // Pulso periódico de daño cortante cada 250ms
          volcano.tickTimer += dt;
          if (volcano.tickTimer >= volcano.tickIntervalMs) {
            volcano.tickTimer = 0;
            let soundTriggered = false;

            enemies.forEach((enemy) => {
              const dx = enemy.x - volcano.centerX;
              const dy = (enemy.y - volcano.centerY) / 0.58;
              const dist = Math.hypot(dx, dy);

              if (dist <= volcano.areaRadius) {
                // Daño cortante de filo de obsidiana
                const sliceDmg = volcano.sliceDamagePerTick;
                enemy.hp -= sliceDmg;

                // Ralentización severa del 40%
                g.enemyManager.applyStatus(enemy, 'slowed', 35);

                // Sonido de corte vítreo
                if (!soundTriggered) {
                  soundTriggered = true;
                  elementalSound.playObsidianSliceTick();
                }

                // Texto flotante de laceración
                g.floatingTexts.push({
                  id: `txt_slice_${frameNow}_${enemy.id}_${Math.random()}`,
                  x: enemy.x + (Math.random() - 0.5) * 14,
                  y: enemy.y - 24,
                  text: `🩸 -${sliceDmg}`,
                  color: volcano.isCharged ? '#f43f5e' : '#f87171',
                  fontSize: 12,
                  opacity: 1,
                  vy: -1.2,
                  life: 26,
                });

                // Fragmentos de cristal cortante
                for (let c = 0; c < 3; c++) {
                  g.particles.push({
                    id: `slice_chip_${frameNow}_${Math.random()}`,
                    x: enemy.x,
                    y: enemy.y - 8,
                    vx: (Math.random() - 0.5) * 1.8,
                    vy: -1.0 - Math.random() * 1.5,
                    radius: 1.2 + Math.random() * 1.4,
                    color: Math.random() < 0.5 ? '#09090b' : '#334155',
                    alpha: 0.9,
                    life: 14,
                  });
                }
              }
            });
          }

          // Partículas ambientales de vapor saliendo del suelo vítreo
          if (Math.random() < 0.25) {
            const b = volcano.blades[Math.floor(Math.random() * volcano.blades.length)];
            g.particles.push({
              id: `field_steam_${frameNow}_${Math.random()}`,
              x: b.x + (Math.random() - 0.5) * 8,
              y: b.y - 6,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -1.2 - Math.random() * 1.0,
              radius: 1.8 + Math.random() * 2.0,
              color: '#f8fafc',
              alpha: 0.45,
              life: 18,
              type: 'smoke',
            });
          }

          if (volcano.phaseTimer >= 4000) {
            volcano.phase = 'shattering';
            volcano.phaseTimer = 0;
          }
        }
        // FASE E: Ruptura vítrea y colapso de las cuchillas (250ms)
        else if (volcano.phase === 'shattering') {
          const prog = Math.min(1.0, volcano.phaseTimer / 250);
          volcano.blades.forEach((b) => {
            b.shatterProgress = prog;
          });

          if (!volcano.shatterPlayed) {
            volcano.shatterPlayed = true;
            elementalSound.playObsidianShatter();
            g.screenShake = Math.max(g.screenShake, 3.0);

            // Expulsión de esquirlas de obsidiana
            volcano.blades.forEach((b) => {
              for (let s = 0; s < 5; s++) {
                const sAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  id: `shatter_shard_${frameNow}_${b.id}_${s}`,
                  x: b.x,
                  y: b.y - b.height * 0.4,
                  vx: Math.cos(sAng) * (2.2 + Math.random() * 2.2),
                  vy: Math.sin(sAng) * (1.5 + Math.random() * 1.5) - 1.0,
                  radius: 1.4 + Math.random() * 1.8,
                  color: s % 2 === 0 ? '#09090b' : (volcano.isCharged ? '#c026d3' : '#64748b'),
                  alpha: 1,
                  life: 20,
                  type: 'stone_chip',
                });
              }
            });
          }

          if (volcano.phaseTimer >= 250) {
            volcano.phase = 'finished';
            volcano.finished = true;
            g.obsidianVolcanoes.splice(ovIdx, 1);
            continue;
          }
        }
      }

      // 4.16 Actualizar Prisión Conductora (Rayo + Hielo + Tierra: Pilares Criotécnicos, Valla de Relámpagos e Implosión)
      for (let cpIdx = g.conductivePrisons.length - 1; cpIdx >= 0; cpIdx--) {
        const prison = g.conductivePrisons[cpIdx];
        prison.elapsedMs += dt;
        prison.phaseTimer += dt;

        // FASE A: Fractura electrificada y escarcha en el suelo (0 - 180ms)
        if (prison.phase === 'fracture') {
          if (Math.random() < 0.4) {
            const p = prison.pillars[Math.floor(Math.random() * prison.pillars.length)];
            g.particles.push({
              id: `cp_frost_${frameNow}_${Math.random()}`,
              x: p.x + (Math.random() - 0.5) * 10,
              y: p.y + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 1.2,
              vy: -1.2 - Math.random() * 1.5,
              radius: 1.4 + Math.random() * 1.6,
              color: Math.random() < 0.5 ? '#00e5ff' : '#b388ff',
              alpha: 0.9,
              life: 16,
              type: 'spark',
            });
          }

          if (prison.phaseTimer >= prison.eruptDurationMs) {
            prison.phase = 'erupting';
            prison.phaseTimer = 0;
          }
        }
        // FASE B: Emergencia criotécnica de los pilares (180 - 400ms, 220ms)
        else if (prison.phase === 'erupting') {
          const prog = Math.min(1.0, prison.phaseTimer / prison.eruptDurationMs);
          prison.pillars.forEach((p) => {
            p.height = p.maxHeight * prog;
          });

          if (prison.phaseTimer >= prison.eruptDurationMs) {
            prison.phase = 'active';
            prison.phaseTimer = 0;
            prison.pillars.forEach((p) => {
              p.height = p.maxHeight;
            });
          }
        }
        // FASE C: Malla voltaica activa, ralentización e intercepción (3500ms)
        else if (prison.phase === 'active') {
          const actPillars = prison.pillars.filter((p) => !p.destroyed);

          // 1. Detección y bloqueo físico de pilares contra jugador y enemigos
          actPillars.forEach((pillar) => {
            if (pillar.hitFlash > 0) pillar.hitFlash--;

            // Bloqueo de Mago (Jugador)
            const pdx = wizard.x - pillar.x;
            const pdy = wizard.y - pillar.y;
            const pDist = Math.hypot(pdx, pdy);
            const minP = pillar.radius + 14;
            if (pDist < minP && pDist > 0.1) {
              wizard.x = pillar.x + (pdx / pDist) * minP;
              wizard.y = pillar.y + (pdy / pDist) * minP;
            }

            // Bloqueo de Enemigos
            enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              const edx = enemy.x - pillar.x;
              const edy = enemy.y - pillar.y;
              const eDist = Math.hypot(edx, edy);
              const minE = pillar.radius + enemy.radius;
              if (eDist < minE && eDist > 0.1) {
                enemy.x = pillar.x + (edx / eDist) * minE;
                enemy.y = pillar.y + (edy / eDist) * minE;
              }
            });

            // Intercepción de proyectiles hostiles por la masa sólida del pilar
            for (let pIdx = g.projectiles.length - 1; pIdx >= 0; pIdx--) {
              const p = g.projectiles[pIdx];
              if (!p.isHostile || p.life <= 0) continue;
              if (checkCircleCollision(pillar.x, pillar.y, pillar.radius + 4, p.x, p.y, p.radius)) {
                g.projectilePool.deactivate(p as PooledProjectile);
                pillar.hitFlash = 6;
                pillar.hp -= 30;
                elementalSound.playConductivePrisonPillarHit();

                // Chispas de absorción
                for (let s = 0; s < 5; s++) {
                  const sAng = Math.random() * Math.PI * 2;
                  g.particles.push({
                    id: `cp_hit_${frameNow}_${Math.random()}`,
                    x: p.x,
                    y: p.y,
                    vx: Math.cos(sAng) * 2.2,
                    vy: Math.sin(sAng) * 1.5,
                    radius: 1.4,
                    color: s % 2 === 0 ? '#00e5ff' : '#b388ff',
                    alpha: 1,
                    life: 14,
                    type: 'spark',
                  });
                }

                // Si un pilar es destruido: colapso anticipado reactivo
                if (pillar.hp <= 0) {
                  pillar.destroyed = true;
                  prison.phase = 'imploding';
                  prison.phaseTimer = 0;
                  break;
                }
              }
            }
          });

          // 2. Ralentización del 35% a todos los enemigos dentro del recinto de la prisión
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const edx = enemy.x - prison.centerX;
            const edy = (enemy.y - prison.centerY) / 0.58;
            const distCenter = Math.hypot(edx, edy);
            if (distCenter <= prison.radius + 12) {
              g.enemyManager.applyStatus(enemy, 'slowed', 35);
            }
          });

          // 3. Ticks de daño eléctrico de la valla perimetral entre pilares adyacentes
          prison.tickTimer += dt;
          if (prison.tickTimer >= prison.tickIntervalMs && actPillars.length >= 2) {
            prison.tickTimer = 0;
            let shockTriggered = false;

            for (let i = 0; i < actPillars.length; i++) {
              const p1 = actPillars[i];
              const p2 = actPillars[(i + 1) % actPillars.length];

              enemies.forEach((enemy) => {
                if (enemy.hp <= 0) return;
                // Distancia punto a segmento de línea
                const segDx = p2.x - p1.x;
                const segDy = p2.y - p1.y;
                const lenSq = segDx * segDx + segDy * segDy;
                let t = lenSq > 0 ? ((enemy.x - p1.x) * segDx + (enemy.y - p1.y) * segDy) / lenSq : 0;
                t = Math.max(0, Math.min(1, t));
                const closeX = p1.x + t * segDx;
                const closeY = p1.y + t * segDy;
                const distFence = Math.hypot(enemy.x - closeX, enemy.y - closeY);

                if (distFence <= enemy.radius + 14) {
                  const shockDmg = prison.contactDamagePerTick;
                  enemy.hp -= shockDmg;

                  // Micro-interrupción y rechazo perimetral
                  const pushAng = Math.atan2(enemy.y - closeY, enemy.x - closeX);
                  enemy.x += Math.cos(pushAng) * 3.5;
                  enemy.y += Math.sin(pushAng) * 3.5 * 0.58;

                  if (!shockTriggered) {
                    shockTriggered = true;
                    elementalSound.playConductivePrisonPerimeterShock();
                  }

                  g.floatingTexts.push({
                    id: `txt_cp_shock_${frameNow}_${enemy.id}_${Math.random()}`,
                    x: enemy.x + (Math.random() - 0.5) * 12,
                    y: enemy.y - 24,
                    text: `⚡ -${shockDmg}`,
                    color: '#b388ff',
                    fontSize: 12,
                    opacity: 1,
                    vy: -1.2,
                    life: 24,
                  });

                  // Chispas eléctricas
                  for (let s = 0; s < 3; s++) {
                    g.particles.push({
                      id: `cp_shock_spk_${frameNow}_${Math.random()}`,
                      x: enemy.x,
                      y: enemy.y - 10,
                      vx: (Math.random() - 0.5) * 2.2,
                      vy: -1.0 - Math.random() * 1.8,
                      radius: 1.3,
                      color: Math.random() < 0.5 ? '#ffffff' : '#7c4dff',
                      alpha: 1,
                      life: 14,
                      type: 'spark',
                    });
                  }
                }
              });
            }
          }

          if (prison.phaseTimer >= prison.activeDurationMs) {
            prison.phase = 'imploding';
            prison.phaseTimer = 0;
          }
        }
        // FASE D: Implosión reactiva terminal y detonación en el epicentro (260ms)
        else if (prison.phase === 'imploding') {
          if (!prison.hasImploded) {
            prison.hasImploded = true;
            elementalSound.playConductivePrisonImplosion(prison.isCharged);
            g.screenShake = Math.max(g.screenShake, prison.isCharged ? 12.0 : 8.0);

            // Daño de remate a todos los enemigos en el radio de implosión
            enemies.forEach((enemy) => {
              const edx = enemy.x - prison.centerX;
              const edy = (enemy.y - prison.centerY) / 0.58;
              const distCenter = Math.hypot(edx, edy);

              if (distCenter <= prison.implosionRadius) {
                const finalImpDmg = prison.implosionDamage;
                enemy.hp -= finalImpDmg;

                // Atracción hacia el epicentro por la implosión de succión
                const pullAng = Math.atan2(prison.centerY - enemy.y, prison.centerX - enemy.x);
                enemy.x += Math.cos(pullAng) * 6.5;
                enemy.y += Math.sin(pullAng) * 6.5 * 0.58;

                g.floatingTexts.push({
                  id: `txt_cp_implode_${frameNow}_${enemy.id}`,
                  x: enemy.x + (Math.random() - 0.5) * 16,
                  y: enemy.y - 32,
                  text: prison.isCharged ? `💥 ¡SOBRECARGA CRIOCONDUCTORA! -${finalImpDmg}` : `💥 ¡IMPLOSIÓN! -${finalImpDmg}`,
                  color: prison.isCharged ? '#b388ff' : '#00e5ff',
                  fontSize: prison.isCharged ? 17 : 14,
                  opacity: 1,
                  vy: -1.6,
                  life: 38,
                });
              }
            });

            // Metralla de fragmentos de hielo y piedra disparados hacia el centro
            prison.pillars.forEach((p) => {
              p.destroyed = true;
              const inAng = Math.atan2(prison.centerY - p.y, prison.centerX - p.x);
              for (let s = 0; s < 6; s++) {
                const spd = 3.0 + Math.random() * 3.5;
                const sprAng = inAng + (Math.random() - 0.5) * 0.8;
                g.particles.push({
                  id: `cp_debris_${frameNow}_${p.id}_${s}`,
                  x: p.x,
                  y: p.y - p.maxHeight * 0.4,
                  vx: Math.cos(sprAng) * spd,
                  vy: Math.sin(sprAng) * spd * 0.58 - 1.2,
                  radius: 1.5 + Math.random() * 2.0,
                  color: s % 3 === 0 ? '#00e5ff' : (s % 2 === 0 ? '#b388ff' : '#263238'),
                  alpha: 1,
                  life: 22,
                  type: s % 2 === 0 ? 'ice' : 'stone_chip',
                });
              }
            });
          }

          if (prison.phaseTimer >= prison.implosionDurationMs) {
            prison.phase = 'finished';
            prison.finished = true;
            g.conductivePrisons.splice(cpIdx, 1);
            continue;
          }
        }
      }

      // 4.17 Actualizar Núcleo de Sobrecarga (Fuego + Rayo + Tierra: Artefacto Desplegable Inestable, Pulsos Radiales y Detonación Masiva Escalada)
      for (let coreIdx = g.overloadCores.length - 1; coreIdx >= 0; coreIdx--) {
        const core = g.overloadCores[coreIdx];
        core.elapsedMs += dt;
        core.phaseTimer += dt;
        core.rotationAngle += 0.04;

        // FASE A: LANZAMIENTO PARABÓLICO HACIA LA ZONA OBJETIVO (~180ms)
        if (core.phase === 'launching') {
          const launchDuration = 180;
          const prog = Math.min(1.0, core.phaseTimer / launchDuration);
          core.currentX = core.startX + (core.targetX - core.startX) * prog;
          core.currentY = core.startY + (core.targetY - core.startY) * prog;
          core.height = Math.sin(prog * Math.PI) * 45;

          // Estela de chispas y humo volcánico durante el vuelo
          if (Math.random() < 0.6) {
            g.particles.push({
              id: `core-flight-${frameNow}-${Math.random()}`,
              x: core.currentX,
              y: core.currentY - core.height,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              radius: 1.5 + Math.random() * 2.0,
              color: Math.random() < 0.5 ? '#ff6d00' : '#ffd600',
              alpha: 0.9,
              life: 14,
              type: 'spark',
            });
          }

          if (core.phaseTimer >= launchDuration) {
            core.phase = 'pulsing';
            core.phaseTimer = 0;
            core.height = 14;
            g.screenShake = 4.5;
            for (let i = 0; i < 10; i++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 3;
              g.particles.push({
                id: `core-land-${frameNow}-${i}`,
                x: core.currentX,
                y: core.currentY,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd * 0.58 - 1.0,
                radius: 1.5 + Math.random() * 2,
                color: i % 2 === 0 ? '#ff9100' : '#263238',
                alpha: 1,
                life: 18,
                type: 'stone_chip',
              });
            }
          }
          continue;
        }

        // FASE B: FASE ACTIVA / PULSANTE (Acumulación temporal de sobrecarga, pulsos periódicos y vibración)
        if (core.phase === 'pulsing') {
          // 1. Progresión de niveles de sobrecarga
          let curLvl: OverloadCoreLevel = 1;
          if (core.elapsedMs >= 3000) {
            curLvl = 3;
          } else if (core.elapsedMs >= 1500) {
            curLvl = 2;
          }
          core.level = curLvl;

          // Actualizar parámetros según nivel
          if (core.level === 1) {
            core.pulseInterval = 500;
            core.pulseRadius = 70;
            core.detonationRadius = 105;
            core.vibrationOffset = {
              x: (Math.random() - 0.5) * 1.2,
              y: (Math.random() - 0.5) * 1.0,
            };
          } else if (core.level === 2) {
            core.pulseInterval = 350;
            core.pulseRadius = 95;
            core.detonationRadius = 157;
            core.vibrationOffset = {
              x: (Math.random() - 0.5) * 2.8,
              y: (Math.random() - 0.5) * 2.2,
            };

            // Si entra al Nivel 2, generar 3 fragmentos de roca magnética orbitales
            if (core.lastLevel < 2) {
              core.lastLevel = 2;
              g.screenShake = 6.0;
              elementalSound.playOverloadCorePulse(2);
              core.rockFragments = [];
              for (let f = 0; f < 3; f++) {
                core.rockFragments.push({
                  id: `frag-${f}`,
                  orbitAngle: (f * Math.PI * 2) / 3,
                  orbitRadius: 36,
                  orbitSpeed: 3.5,
                  height: 12,
                  size: 5,
                  roughPoints: [
                    { x: -4, y: -2 },
                    { x: 0, y: -5 },
                    { x: 4, y: -2 },
                    { x: 3, y: 4 },
                    { x: -3, y: 3 },
                  ],
                  burnGlow: 0.8,
                });
              }
              g.floatingTexts.push({
                id: `txt_core_lvl2_${frameNow}`,
                x: core.currentX,
                y: core.currentY - 45,
                text: '⚡⚡ ¡MASA INESTABLE (NIVEL 2)!',
                color: '#ffd600',
                fontSize: 13,
                opacity: 1,
                vy: -1.2,
                life: 30,
              });
            }
          } else if (core.level === 3) {
            core.pulseInterval = 200;
            core.pulseRadius = 130;
            core.detonationRadius = 210;
            core.vibrationOffset = {
              x: (Math.random() - 0.5) * 5.2,
              y: (Math.random() - 0.5) * 4.2,
            };

            // Si entra al Nivel 3, alarma crítica sonora y expandir a 5 fragmentos
            if (core.lastLevel < 3) {
              core.lastLevel = 3;
              g.screenShake = 9.0;
              if (!core.criticalAlarmPlayed) {
                core.criticalAlarmPlayed = true;
                elementalSound.playOverloadCoreCriticalAlarm();
              }
              if (core.rockFragments.length < 5) {
                for (let f = core.rockFragments.length; f < 5; f++) {
                  core.rockFragments.push({
                    id: `frag-${f}`,
                    orbitAngle: (f * Math.PI * 2) / 5,
                    orbitRadius: 48,
                    orbitSpeed: 5.5,
                    height: 14,
                    size: 6,
                    roughPoints: [
                      { x: -5, y: -3 },
                      { x: 0, y: -6 },
                      { x: 5, y: -3 },
                      { x: 4, y: 5 },
                      { x: -4, y: 4 },
                    ],
                    burnGlow: 1.0,
                  });
                }
              }
              g.floatingTexts.push({
                id: `txt_core_crit_${frameNow}`,
                x: core.currentX,
                y: core.currentY - 50,
                text: '⚠️ ¡SOBRECARGA CRÍTICA (NIVEL 3)! 💣',
                color: '#ff1744',
                fontSize: 14,
                opacity: 1,
                vy: -1.4,
                life: 32,
              });
            }
          }

          // 2. Rotación de fragmentos orbitales
          if (core.rockFragments && core.rockFragments.length > 0) {
            core.rockFragments.forEach((frag) => {
              frag.orbitAngle += frag.orbitSpeed * (dt / 1000);
            });
          }

          // 3. Emisión periódica de pulsos radiales
          core.pulseTimer += dt;
          if (core.pulseTimer >= core.pulseInterval) {
            core.pulseTimer = 0;
            core.pulseCount++;
            elementalSound.playOverloadCorePulse(core.level);

            const statBonus = Math.floor(player.stats.attack * 0.35 + player.stats.knowledge * 0.35);
            const baseDmg = identifyRecipe(['fire', 'lightning', 'earth']).damage + statBonus;
            const pulseDmgRatio = core.level === 1 ? 0.16 : (core.level === 2 ? 0.24 : 0.35);
            const pulseDmg = Math.max(8, Math.floor(baseDmg * pulseDmgRatio));

            enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              const edx = enemy.x - core.currentX;
              const edy = (enemy.y - core.currentY) / 0.58;
              const edist = Math.hypot(edx, edy);

              if (edist <= core.pulseRadius) {
                enemy.hp -= pulseDmg;
                enemy.hitFlash = 120;
                if (core.level >= 2) {
                  const existingSlow = enemy.statuses.find((s) => s.type === 'slowed' || s.type === 'shocked');
                  if (existingSlow) {
                    existingSlow.duration = Math.max(existingSlow.duration, core.level === 3 ? 140 : 80);
                  } else {
                    enemy.statuses.push({
                      type: 'slowed',
                      duration: core.level === 3 ? 140 : 80,
                      maxDuration: core.level === 3 ? 140 : 80,
                    });
                  }
                }
                if (core.level === 3) {
                  const existingBurn = enemy.statuses.find((s) => s.type === 'burning');
                  if (existingBurn) {
                    existingBurn.duration = Math.max(existingBurn.duration, 2000);
                  } else {
                    enemy.statuses.push({
                      type: 'burning',
                      duration: 2000,
                      maxDuration: 2000,
                      damagePerTick: 10,
                    });
                  }
                }

                g.floatingTexts.push({
                  id: `pulse-dmg-${frameNow}-${enemy.id}-${Math.random()}`,
                  x: enemy.x + (Math.random() - 0.5) * 12,
                  y: enemy.y - 18,
                  text: `-${pulseDmg}`,
                  color: core.level === 3 ? '#ff1744' : (core.level === 2 ? '#ffd600' : '#ff9100'),
                  fontSize: 12,
                  opacity: 1,
                  vy: -1.2,
                  life: 22,
                });

                for (let sp = 0; sp < 4; sp++) {
                  g.particles.push({
                    id: `pulse-spk-${frameNow}-${Math.random()}`,
                    x: enemy.x,
                    y: enemy.y - 12,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    radius: 1.2 + Math.random() * 1.5,
                    color: core.level === 3 ? '#ff5252' : '#ffd600',
                    alpha: 1,
                    life: 14,
                    type: 'spark',
                  });
                }
              }
            });

            // Partículas de descarga radial
            const sparkCount = core.level === 3 ? 16 : (core.level === 2 ? 10 : 6);
            for (let sp = 0; sp < sparkCount; sp++) {
              const spkAng = (sp * Math.PI * 2) / sparkCount + Math.random() * 0.3;
              const spkSpd = 2.5 + Math.random() * (core.level * 1.8);
              g.particles.push({
                id: `pulse-wave-spk-${frameNow}-${sp}`,
                x: core.currentX,
                y: core.currentY,
                vx: Math.cos(spkAng) * spkSpd,
                vy: Math.sin(spkAng) * spkSpd * 0.58,
                radius: 1.5 + Math.random() * 1.6,
                color: core.level === 3 ? '#ff1744' : (core.level === 2 ? '#ffd600' : '#ff9100'),
                alpha: 1,
                life: 16,
                type: 'spark',
              });
            }
          }

          // 4. Auto-detonación al alcanzar tiempo límite (3500ms)
          if (core.elapsedMs >= 3500) {
            core.phase = 'detonating';
            core.phaseTimer = 0;
          }
        }

        // FASE C: DETONACIÓN MASIVA ESCALADA (Anticipada o al expirar tiempo límite)
        if (core.phase === 'detonating') {
          elementalSound.playOverloadCoreDetonation(core.level, core.isCharged);
          g.screenShake = core.level === 3 ? 18.0 : (core.level === 2 ? 12.0 : 8.0);

          const statBonus = Math.floor(player.stats.attack * 0.35 + player.stats.knowledge * 0.35);
          const baseRecipeDmg = identifyRecipe(['fire', 'lightning', 'earth']).damage + statBonus;
          const multiplier = core.level === 1 ? 1.0 : (core.level === 2 ? 1.5 : 2.2);
          const chargeExtra = core.isCharged ? 1.15 : 1.0;
          const finalDetonationDmg = Math.floor(baseRecipeDmg * multiplier * chargeExtra);
          const detRadius = core.detonationRadius;

          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const edx = enemy.x - core.currentX;
            const edy = (enemy.y - core.currentY) / 0.58;
            const edist = Math.hypot(edx, edy);

            if (edist <= detRadius) {
              enemy.hp -= finalDetonationDmg;
              enemy.hitFlash = 180;

              const pushAngle = Math.atan2(enemy.y - core.currentY, enemy.x - core.currentX);
              const pushForce = core.level === 3 ? 16.0 : (core.level === 2 ? 11.5 : 8.0);
              enemy.x += Math.cos(pushAngle) * pushForce;
              enemy.y += Math.sin(pushAngle) * pushForce * 0.58;

              if (core.level === 3) {
                const existingBurn = enemy.statuses.find((s) => s.type === 'burning');
                if (existingBurn) {
                  existingBurn.duration = Math.max(existingBurn.duration, 4000);
                  existingBurn.damagePerTick = 14;
                } else {
                  enemy.statuses.push({
                    type: 'burning',
                    duration: 4000,
                    maxDuration: 4000,
                    damagePerTick: 14,
                  });
                }
                const existingSlow = enemy.statuses.find((s) => s.type === 'frozen' || s.type === 'slowed');
                if (existingSlow) {
                  existingSlow.duration = Math.max(existingSlow.duration, 220);
                } else {
                  enemy.statuses.push({
                    type: 'slowed',
                    duration: 220,
                    maxDuration: 220,
                  });
                }
              } else if (core.level === 2) {
                const existingBurn = enemy.statuses.find((s) => s.type === 'burning');
                if (existingBurn) {
                  existingBurn.duration = Math.max(existingBurn.duration, 2200);
                  existingBurn.damagePerTick = 9;
                } else {
                  enemy.statuses.push({
                    type: 'burning',
                    duration: 2200,
                    maxDuration: 2200,
                    damagePerTick: 9,
                  });
                }
                const existingSlow = enemy.statuses.find((s) => s.type === 'slowed');
                if (existingSlow) {
                  existingSlow.duration = Math.max(existingSlow.duration, 100);
                } else {
                  enemy.statuses.push({
                    type: 'slowed',
                    duration: 100,
                    maxDuration: 100,
                  });
                }
              }

              g.floatingTexts.push({
                id: `det-dmg-${frameNow}-${enemy.id}-${Math.random()}`,
                x: enemy.x + (Math.random() - 0.5) * 16,
                y: enemy.y - 28,
                text: `-${finalDetonationDmg} 💣💥`,
                color: core.level === 3 ? '#ff1744' : (core.level === 2 ? '#ffd600' : '#ff9100'),
                fontSize: core.level === 3 ? 18 : 15,
                opacity: 1,
                vy: -1.8,
                life: 38,
              });
            }
          });

          g.terrainManager.obstacles.forEach((obs) => {
            if (obs.hp <= 0) return;
            const odx = obs.x - core.currentX;
            const ody = (obs.y - core.currentY) / 0.58;
            if (Math.hypot(odx, ody) <= detRadius) {
              obs.hp = Math.max(0, obs.hp - finalDetonationDmg);
            }
          });

          g.terrainManager.spawnMagmaFissure(core.currentX, core.currentY, core.level === 3 ? 75 : 55);

          const particleCount = core.level === 3 ? 42 : (core.level === 2 ? 28 : 18);
          for (let p = 0; p < particleCount; p++) {
            const pAng = Math.random() * Math.PI * 2;
            const pSpd = 3.5 + Math.random() * (core.level * 3.5);
            const pType = p % 3 === 0 ? 'spark' : (p % 3 === 1 ? 'stone_chip' : 'ember');
            g.particles.push({
              id: `det-part-${frameNow}-${p}`,
              x: core.currentX,
              y: core.currentY,
              vx: Math.cos(pAng) * pSpd,
              vy: Math.sin(pAng) * pSpd * 0.58 - (pType === 'spark' ? 2.5 : 1.2),
              radius: 2.0 + Math.random() * 3.0,
              color: pType === 'spark' ? (core.level === 3 ? '#ffffff' : '#ffd600') : (pType === 'ember' ? '#ff3d00' : '#263238'),
              alpha: 1,
              life: 25 + Math.floor(Math.random() * 15),
              type: pType,
            });
          }

          g.particles.push({
            id: `det-shockwave-${frameNow}`,
            x: core.currentX,
            y: core.currentY,
            vx: 0,
            vy: 0,
            radius: detRadius,
            color: core.level === 3 ? '#ff1744' : (core.level === 2 ? '#ffd600' : '#ff9100'),
            secondaryColor: '#ffffff',
            alpha: 1,
            life: 22,
            maxLife: 22,
            type: 'ring',
          });

          core.phase = 'finished';
          core.finished = true;
          g.overloadCores.splice(coreIdx, 1);
          continue;
        }
      }

      // 4.18 Actualizar Tormenta de Plasma Glacial (Fuego + Rayo + Hielo: Vórtice Móvil Tri-Elemental, Congelación, Encadenamiento Voltaico e Implosión)
      for (let stormIdx = g.glacialPlasmaStorms.length - 1; stormIdx >= 0; stormIdx--) {
        const storm = g.glacialPlasmaStorms[stormIdx];
        storm.elapsedMs += dt;
        storm.phaseTimer += dt;
        storm.swirlAngle += 0.05;
        storm.frostLayerAngle += 0.04;
        storm.plasmaCoreAngle -= 0.06;

        // FASE A: VÓRTICE EN DESPLAZAMIENTO (2.0s a 2.5s)
        if (storm.phase === 'moving') {
          // 1. Avance continuo
          const stepDist = Math.hypot(storm.vx, storm.vy) * (dt / 1000);
          storm.x += storm.vx * (dt / 1000);
          storm.y += storm.vy * (dt / 1000);
          storm.travelDistance += stepDist;

          // 2. Comprobar colisión contra muros u obstáculos sólidos para detonación prematura segura
          let hitSolidObstacle = false;
          for (const obs of g.terrainManager.obstacles) {
            if (!obs.solid) continue;
            if (obs.obstacleType === 'door_gate' && !obs.doorLocked) continue;
            const odx = obs.x - storm.x;
            const ody = (obs.y - storm.y) / 0.58;
            if (Math.hypot(odx, ody) <= obs.radius + (storm.radius * 0.4)) {
              hitSolidObstacle = true;
              break;
            }
          }

          // Bordes del mapa de bosque si existe nivel
          if (g.forestLevel) {
            if (storm.x < 100 || storm.x > 2300 || storm.y < 100 || storm.y > 8300) {
              hitSolidObstacle = true;
            }
          }

          if (hitSolidObstacle || storm.travelDistance >= storm.maxDistance || storm.phaseTimer >= storm.movingDurationMs) {
            storm.phase = 'imploding';
            storm.phaseTimer = 0;
            storm.vx = 0;
            storm.vy = 0;
            elementalSound.playGlacialPlasmaImplosion(storm.isCharged);
            continue;
          }

          // 3. Estela visual gélida-ígnea en tránsito
          if (Math.random() < 0.55) {
            const isFrost = Math.random() < 0.5;
            g.particles.push({
              id: `gps-trail-${frameNow}-${Math.random()}`,
              x: storm.x + (Math.random() - 0.5) * (storm.radius * 0.6),
              y: storm.y + (Math.random() - 0.5) * (storm.radius * 0.4),
              vx: (Math.random() - 0.5) * 1.5 - storm.vx * 0.15,
              vy: (Math.random() - 0.5) * 1.5 - storm.vy * 0.15,
              radius: 1.5 + Math.random() * 2.2,
              color: isFrost ? '#00e5ff' : '#ff6d00',
              alpha: 0.85,
              life: 16,
              type: isFrost ? 'ice' : 'ember',
            });
          }

          // 4. Hielo + Fuego: Detección de enemigos dentro del radio del vórtice
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const edx = enemy.x - storm.x;
            const edy = (enemy.y - storm.y) / 0.58;
            const edist = Math.hypot(edx, edy);

            if (edist <= storm.radius) {
              // Atracción suave continua hacia el centro del torbellino
              const pullAng = Math.atan2(storm.y - enemy.y, storm.x - enemy.x);
              enemy.x += Math.cos(pullAng) * 2.4;
              enemy.y += Math.sin(pullAng) * 2.4 * 0.58;

              // Capa Gélida: Aplica ralentización continua (-40% vel)
              const existingSlow = enemy.statuses.find((s) => s.type === 'slowed');
              if (existingSlow) {
                existingSlow.duration = Math.max(existingSlow.duration, 400);
              } else {
                enemy.statuses.push({
                  type: 'slowed',
                  duration: 400,
                  maxDuration: 400,
                });
              }

              // Núcleo de Fuego: Ticks de daño térmico cada 200ms
              const lastTick = storm.lastTickPerEnemy[enemy.id] || 0;
              if (storm.elapsedMs - lastTick >= storm.tickIntervalMs) {
                storm.lastTickPerEnemy[enemy.id] = storm.elapsedMs;
                const dmg = storm.transitDamagePerTick;
                enemy.hp -= dmg;
                enemy.hitFlash = 120;

                g.floatingTexts.push({
                  id: `gps-tick-${frameNow}-${enemy.id}-${Math.random()}`,
                  x: enemy.x + (Math.random() - 0.5) * 12,
                  y: enemy.y - 18,
                  text: `-${dmg}`,
                  color: storm.isCharged ? '#ffd600' : '#00e5ff',
                  fontSize: 12,
                  opacity: 1,
                  vy: -1.2,
                  life: 20,
                });
              }
            }
          });

          // 5. Filamentos Eléctricos (Rayo): Arcos voltaicos continuos entre enemigos adyacentes
          storm.arcs = [];
          if (storm.elapsedMs - storm.lastArcTime >= 100) {
            storm.lastArcTime = storm.elapsedMs;

            const enemiesInElectricZone = enemies.filter((e) => {
              if (e.hp <= 0) return false;
              const edx = e.x - storm.x;
              const edy = (e.y - storm.y) / 0.58;
              return Math.hypot(edx, edy) <= storm.radius + 35;
            });

            if (enemiesInElectricZone.length >= 2) {
              elementalSound.playGlacialPlasmaArcZap();
              for (let i = 0; i < Math.min(3, enemiesInElectricZone.length - 1); i++) {
                const e1 = enemiesInElectricZone[i];
                const e2 = enemiesInElectricZone[(i + 1) % enemiesInElectricZone.length];
                const arcDmg = Math.max(6, Math.floor(storm.transitDamagePerTick * 0.45));

                e2.hp -= arcDmg;
                e2.hitFlash = 100;

                const existingShock = e2.statuses.find((s) => s.type === 'shocked');
                if (existingShock) {
                  existingShock.duration = Math.max(existingShock.duration, 150);
                } else {
                  e2.statuses.push({
                    type: 'shocked',
                    duration: 150,
                    maxDuration: 150,
                  });
                }

                storm.arcs.push({
                  x1: e1.x,
                  y1: e1.y - 12,
                  x2: e2.x,
                  y2: e2.y - 12,
                  color: '#b388ff',
                  life: 8,
                });

                g.particles.push({
                  id: `gps-zap-${frameNow}-${i}`,
                  x: e2.x,
                  y: e2.y - 12,
                  vx: (Math.random() - 0.5) * 2.5,
                  vy: (Math.random() - 0.5) * 2.5,
                  radius: 1.5,
                  color: '#ffffff',
                  alpha: 1,
                  life: 10,
                  type: 'spark',
                });
              }
            }
          }
          continue;
        }

        // FASE B: IMPLOSIÓN DE VACÍO (150ms - 220ms)
        if (storm.phase === 'imploding') {
          // Succión centrípeta violenta: jala de golpe a los enemigos al epicentro
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const edx = enemy.x - storm.x;
            const edy = (enemy.y - storm.y) / 0.58;
            const dist = Math.hypot(edx, edy);

            if (dist <= storm.implosionRadius) {
              const pullAng = Math.atan2(storm.y - enemy.y, storm.x - enemy.x);
              const pullStrength = 7.5;
              enemy.x += Math.cos(pullAng) * pullStrength;
              enemy.y += Math.sin(pullAng) * pullStrength * 0.58;
            }
          });

          if (storm.phaseTimer >= storm.implosionDurationMs) {
            storm.phase = 'detonating';
            storm.phaseTimer = 0;
            elementalSound.playGlacialPlasmaDetonation(storm.isCharged);
            g.screenShake = storm.isCharged ? 14.0 : 9.0;
          }
          continue;
        }

        // FASE C: DETONACIÓN EXPANSIVA Y REMATE CENTRÍFUGO (250ms - 350ms)
        if (storm.phase === 'detonating') {
          if (!storm.hasDetonated) {
            storm.hasDetonated = true;

            const finalDamage = storm.finisherDamage;
            const detRadius = storm.implosionRadius;

            // Daño masivo de remate a enemigos agrupados y dispersión radial (knockback)
            enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              const edx = enemy.x - storm.x;
              const edy = (enemy.y - storm.y) / 0.58;
              const dist = Math.hypot(edx, edy);

              if (dist <= detRadius) {
                enemy.hp -= finalDamage;
                enemy.hitFlash = 180;

                // Knockback radial exterior potente
                const pushAng = Math.atan2(enemy.y - storm.y, enemy.x - storm.x);
                const pushForce = storm.isCharged ? 15.0 : 10.5;
                enemy.x += Math.cos(pushAng) * pushForce;
                enemy.y += Math.sin(pushAng) * pushForce * 0.58;

                // Versión Hold (Cargada): Congela instantáneamente a los supervivientes por 1.2 segundos (1200ms)
                if (storm.isCharged) {
                  const existingFreeze = enemy.statuses.find((s) => s.type === 'frozen');
                  if (existingFreeze) {
                    existingFreeze.duration = Math.max(existingFreeze.duration, 1200);
                  } else {
                    enemy.statuses.push({
                      type: 'frozen',
                      duration: 1200,
                      maxDuration: 1200,
                    });
                  }
                }

                g.floatingTexts.push({
                  id: `gps-finisher-${frameNow}-${enemy.id}-${Math.random()}`,
                  x: enemy.x + (Math.random() - 0.5) * 16,
                  y: enemy.y - 28,
                  text: storm.isCharged ? `💥❄️ ¡REMATE GLACIAL! -${finalDamage}` : `💥 -${finalDamage}`,
                  color: storm.isCharged ? '#00e5ff' : '#ffd600',
                  fontSize: storm.isCharged ? 17 : 14,
                  opacity: 1,
                  vy: -1.6,
                  life: 36,
                });
              }
            });

            // Daño a obstáculos
            g.terrainManager.obstacles.forEach((obs) => {
              if (obs.hp <= 0) return;
              const odx = obs.x - storm.x;
              const ody = (obs.y - storm.y) / 0.58;
              if (Math.hypot(odx, ody) <= detRadius) {
                obs.hp = Math.max(0, obs.hp - finalDamage);
              }
            });

            g.terrainManager.spawnWaterPuddle(storm.x, storm.y, storm.isCharged ? 65 : 45);

            // Pool reducido de partículas (15 a 18 partículas como exige la restricción)
            const particleCount = storm.isCharged ? 18 : 15;
            for (let p = 0; p < particleCount; p++) {
              const pAng = Math.random() * Math.PI * 2;
              const pSpd = 3.5 + Math.random() * 4.0;
              const pType = p % 3 === 0 ? 'spark' : (p % 3 === 1 ? 'ice' : 'ember');
              g.particles.push({
                id: `gps-det-p-${frameNow}-${p}`,
                x: storm.x,
                y: storm.y,
                vx: Math.cos(pAng) * pSpd,
                vy: Math.sin(pAng) * pSpd * 0.58 - 1.2,
                radius: 1.6 + Math.random() * 2.2,
                color: pType === 'ice' ? '#00e5ff' : (pType === 'spark' ? '#b388ff' : '#ff6d00'),
                alpha: 1,
                life: 20 + Math.floor(Math.random() * 10),
                type: pType,
              });
            }

            g.particles.push({
              id: `gps-shockwave-${frameNow}`,
              x: storm.x,
              y: storm.y,
              vx: 0,
              vy: 0,
              radius: detRadius,
              color: '#00e5ff',
              secondaryColor: '#ff6d00',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });
          }

          if (storm.phaseTimer >= storm.detonationDurationMs) {
            storm.phase = 'finished';
            storm.finished = true;
            g.glacialPlasmaStorms.splice(stormIdx, 1);
            continue;
          }
        }
      }

      // 4.19 Actualizar Cataclismo Elemental (Fuego + Rayo + Hielo + Tierra: Devastación en 4 Fases Consecutivas)
      for (let cIdx = g.elementalCataclysms.length - 1; cIdx >= 0; cIdx--) {
        const cataclysm = g.elementalCataclysms[cIdx];
        cataclysm.elapsedMs += dt;
        cataclysm.phaseTimer += dt;

        const totalDmg = Math.round((cataclysm.totalBaseDamage + cataclysm.statBonus) * cataclysm.chargeMultiplier);
        const elapsed = cataclysm.elapsedMs;
        const cx = cataclysm.x;
        const cy = cataclysm.y;
        const isCharged = cataclysm.isCharged;

        // FASE 1: TIERRA — FISURA TECTÓNICA (0.0s – 0.6s / 0 - 600 ms)
        if (elapsed < cataclysm.earthDurationMs) {
          cataclysm.phase = 'earth_fissure';
          const earthProg = Math.min(1.0, elapsed / cataclysm.earthDurationMs);

          // Placas tectónicas se elevan progresivamente
          cataclysm.fissures.forEach((fissure) => {
            fissure.slabs.forEach((slab) => {
              slab.elevation = slab.maxElevation * Math.sin(earthProg * Math.PI * 0.5);
            });
          });

          // Impacto inicial de Tierra: Daño contundente (15% del total), elevación (Knock-up) e interrupción garantizada
          const earthDmg = Math.max(1, Math.round(totalDmg * 0.15));

          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const ed = Math.hypot(enemy.x - cx, (enemy.y - cy) / 0.58);
            if (ed <= cataclysm.radius && !cataclysm.earthHitIds.has(enemy.id)) {
              cataclysm.earthHitIds.add(enemy.id);

              enemy.hp -= earthDmg;
              enemy.hitFlash = 15;

              // Interrupción de ataque y telegráfico
              enemy.isTelegraphing = false;
              enemy.telegraphTimer = 0;
              enemy.attackCooldown = 0;
              enemy.stunnedTimer = Math.max(enemy.stunnedTimer || 0, isCharged ? 65 : 45);

              // Elevación vertical (Knock-up) para enemigos comunes
              if (enemy.archetype !== 'boss') {
                enemy.y -= (isCharged ? 30 : 22);
                enemy.x += (Math.random() - 0.5) * 8;
              }

              g.floatingTexts.push({
                id: `cat_earth_${frameNow}_${enemy.id}`,
                x: enemy.x,
                y: enemy.y - 24,
                text: isCharged ? `🌍 -${earthDmg} [¡FISURA TECTÓNICA +50%!]` : `🌍 -${earthDmg} [FISURA TECTÓNICA]`,
                color: '#f59e0b',
                fontSize: 14,
                opacity: 1,
                vy: -1.6,
                life: 38,
              });
            }
          });
        }

        // FASE 2: FUEGO — ERUPCIÓN ÍGNEA (0.6s – 1.2s / 600 - 1200 ms)
        else if (elapsed < cataclysm.earthDurationMs + cataclysm.fireDurationMs) {
          if (cataclysm.phase !== 'fire_eruption') {
            cataclysm.phase = 'fire_eruption';
            cataclysm.phaseTimer = 0;
            elementalSound.playCataclysmPhase2Fire(isCharged);
            g.screenShake = Math.max(g.screenShake, isCharged ? 14 : 10);
          }

          // Daño periódico por magma (25% del daño total distribuido en 3 ticks rápidos de 200ms)
          const fireTickInterval = 200;
          if (elapsed - cataclysm.fireLastTickTime >= fireTickInterval && cataclysm.fireTickCount < 3) {
            cataclysm.fireLastTickTime = elapsed;
            cataclysm.fireTickCount++;

            const fireTickDmg = Math.max(1, Math.round((totalDmg * 0.25) / 3));

            enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              const ed = Math.hypot(enemy.x - cx, (enemy.y - cy) / 0.58);
              if (ed <= cataclysm.radius) {
                enemy.hp -= fireTickDmg;
                enemy.hitFlash = 12;

                // Acumulación/renovación de estado quemado (burning)
                const existingBurn = enemy.statuses.find((s) => s.type === 'burning');
                if (existingBurn) {
                  existingBurn.duration = Math.max(existingBurn.duration, 3500);
                  existingBurn.damagePerTick = Math.max(existingBurn.damagePerTick || 0, Math.round(16 * cataclysm.chargeMultiplier));
                } else {
                  enemy.statuses.push({
                    type: 'burning',
                    duration: 3500,
                    maxDuration: 3500,
                    damagePerTick: Math.round(16 * cataclysm.chargeMultiplier),
                  });
                }

                g.floatingTexts.push({
                  id: `cat_fire_${frameNow}_${enemy.id}_${cataclysm.fireTickCount}`,
                  x: enemy.x + (Math.random() - 0.5) * 12,
                  y: enemy.y - 20,
                  text: `🔥 -${fireTickDmg}`,
                  color: '#ff6d00',
                  fontSize: 13,
                  opacity: 1,
                  vy: -1.3,
                  life: 30,
                });
              }
            });

            // Destrucción de obstáculos destructibles en el área
            for (const obs of g.terrainManager.obstacles) {
              if (obs.hp > 0) {
                const od = Math.hypot(obs.x - cx, (obs.y - cy) / 0.58);
                if (od <= cataclysm.radius) {
                  obs.hp -= fireTickDmg;
                }
              }
            }
          }
        }

        // FASE 3: HIELO — ONDA POLAR DE CERO ABSOLUTO (1.2s – 1.8s / 1200 - 1800 ms)
        else if (elapsed < cataclysm.earthDurationMs + cataclysm.fireDurationMs + cataclysm.iceDurationMs) {
          if (cataclysm.phase !== 'ice_wave') {
            cataclysm.phase = 'ice_wave';
            cataclysm.phaseTimer = 0;
            elementalSound.playCataclysmPhase3Ice(isCharged);
            g.screenShake = Math.max(g.screenShake, 8);
          }

          // Daño de impacto polar (15% del total) y 100% CONGELACIÓN GARANTIZADA
          const iceDmg = Math.max(1, Math.round(totalDmg * 0.15));

          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const ed = Math.hypot(enemy.x - cx, (enemy.y - cy) / 0.58);
            if (ed <= cataclysm.radius && !cataclysm.iceHitIds.has(enemy.id)) {
              cataclysm.iceHitIds.add(enemy.id);

              enemy.hp -= iceDmg;
              enemy.hitFlash = 14;

              // Congelación garantizada al 100% por 1.2 segundos (1200 ms)
              const existingFreeze = enemy.statuses.find((s) => s.type === 'frozen');
              if (existingFreeze) {
                existingFreeze.duration = Math.max(existingFreeze.duration, 1200);
              } else {
                enemy.statuses.push({
                  type: 'frozen',
                  duration: 1200,
                  maxDuration: 1200,
                });
              }

              enemy.isTelegraphing = false;
              enemy.stunnedTimer = Math.max(enemy.stunnedTimer || 0, 72);

              g.floatingTexts.push({
                id: `cat_ice_${frameNow}_${enemy.id}`,
                x: enemy.x,
                y: enemy.y - 24,
                text: `❄️ -${iceDmg} [¡CERO ABSOLUTO!]`,
                color: '#00e5ff',
                fontSize: 14,
                opacity: 1,
                vy: -1.5,
                life: 38,
              });
            }
          });
        }

        // FASE 4: RAYO — RELÁMPAGO TITÁNICO Y DETONACIÓN RADIAL (1.8s – 2.8s / 1800 - 2800 ms)
        else {
          if (cataclysm.phase !== 'lightning_detonation') {
            cataclysm.phase = 'lightning_detonation';
            cataclysm.phaseTimer = 0;
          }

          // A los 1900 ms (100 ms tras el relámpago inicial): Gran detonación terminal con shatter (ejecución única garantizada)
          if (elapsed >= 1900 && !cataclysm.hasDetonated) {
            cataclysm.hasDetonated = true;
            elementalSound.playCataclysmPhase4Lightning(isCharged);
            g.screenShake = isCharged ? 24 : 18;

            const lightningDmg = Math.max(1, Math.round(totalDmg * 0.45));

            enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              const ed = Math.hypot(enemy.x - cx, (enemy.y - cy) / 0.58);
              if (ed <= cataclysm.radius) {
                cataclysm.lightningHitIds.add(enemy.id);

                enemy.hp -= lightningDmg;
                enemy.hitFlash = 18;

                // Consumir congelación en Shatter reactivo masivo
                enemy.statuses = (enemy.statuses || []).filter((s) => s.type !== 'frozen');

                // Fuerte empuje radial centrífugo hacia afuera
                const dx = enemy.x - cx;
                const dy = (enemy.y - cy) / 0.58;
                const dist = Math.max(1, Math.hypot(dx, dy));
                const pushForce = isCharged ? 22 : 16;
                enemy.x += (dx / dist) * pushForce;
                enemy.y += (dy / dist) * pushForce * 0.58;

                g.floatingTexts.push({
                  id: `cat_bolt_${frameNow}_${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 28,
                  text: isCharged ? `⚡💥 -${lightningDmg} [¡DETONACIÓN CATACLÍSMICA +50%!]` : `⚡💥 -${lightningDmg} [¡DETONACIÓN FINAL!]`,
                  color: '#ffffff',
                  fontSize: 15,
                  opacity: 1,
                  vy: -1.8,
                  life: 45,
                });

                // Si es versión cargada y es esbirro básico con HP <= 0: desintegración total
                if (isCharged && enemy.hp <= 0 && enemy.archetype !== 'boss') {
                  for (let d = 0; d < 6; d++) {
                    const dAng = Math.random() * Math.PI * 2;
                    g.particles.push({
                      id: `cat_disintegrate_${frameNow}_${enemy.id}_${d}`,
                      x: enemy.x,
                      y: enemy.y,
                      vx: Math.cos(dAng) * (3 + Math.random() * 4),
                      vy: Math.sin(dAng) * (2 + Math.random() * 3),
                      radius: 2.5,
                      color: Math.random() < 0.5 ? '#ec4899' : '#00e5ff',
                      alpha: 1,
                      life: 25,
                    });
                  }
                }
              }
            });

            // En versión cargada (Hold): Vaporiza proyectiles hostiles enemigos en toda la arena
            if (isCharged) {
              g.projectilePool.filterHostile((p) => {
                const pd = Math.hypot(p.x - cx, (p.y - cy) / 0.58);
                if (pd <= cataclysm.radius) {
                  // Partícula de vaporización
                  g.particles.push({
                    id: `cat_vap_${frameNow}_${Math.random()}`,
                    x: p.x,
                    y: p.y,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -2,
                    radius: 3,
                    color: '#e0f7fa',
                    alpha: 0.9,
                    life: 15,
                  });
                  return false;
                }
                return true;
              });
            }

            // Anillo de onda de choque radial expansivo (partícula tipo 'ring')
            g.particles.push({
              id: `cat_shockring_${frameNow}`,
              x: cx,
              y: cy,
              vx: 0,
              vy: 0,
              radius: cataclysm.radius,
              color: '#ffffff',
              secondaryColor: '#ec4899',
              alpha: 1,
              life: 22,
              maxLife: 22,
              type: 'ring',
            });
          }

          // Limpieza final al agotar los 2800 ms de la secuencia completa
          if (elapsed >= cataclysm.totalDurationMs) {
            cataclysm.phase = 'finished';
            cataclysm.finished = true;
            g.elementalCataclysms.splice(cIdx, 1);
            continue;
          }
        }
      }

      // 4.95 Actualizar Trincheras de Magma (Fuego + Fuego + Tierra: Grieta 300px, 2.5s, daño cada 250ms, -35% vel)
      for (let tIdx = g.magmaTrenches.length - 1; tIdx >= 0; tIdx--) {
        const trench = g.magmaTrenches[tIdx];
        trench.elapsedMs += dt;
        if (trench.elapsedMs >= trench.durationMs) {
          trench.finished = true;
          g.magmaTrenches.splice(tIdx, 1);
          continue;
        }

        // Partículas de ceniza y humo que ascienden verticalmente
        if (Math.random() < 0.65) {
          const pDist = Math.random() * trench.length;
          const px = trench.startX + Math.cos(trench.angle) * pDist + (Math.random() - 0.5) * (trench.width * 0.7);
          const py = trench.startY + Math.sin(trench.angle) * pDist + (Math.random() - 0.5) * (trench.width * 0.7);
          g.particles.push({
            id: `trench-smoke-${frameNow}-${Math.random()}`,
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 0.7,
            vy: -1.2 - Math.random() * 1.5,
            radius: Math.random() > 0.4 ? 2.5 : 1.8,
            color: Math.random() > 0.35 ? '#ea580c' : '#71717a',
            alpha: 0.85,
            life: 18,
          });
        }

        // Daño continuo y ralentización a enemigos en la línea
        const cosA = Math.cos(trench.angle);
        const sinA = Math.sin(trench.angle);
        enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const ex = enemy.x - trench.startX;
          const ey = enemy.y - trench.startY;
          const proj = ex * cosA + ey * sinA;
          if (proj >= -10 && proj <= trench.length + 10) {
            const perpDist = Math.abs(-ex * sinA + ey * cosA);
            if (perpDist <= trench.width * 0.5 + enemy.radius) {
              enemy.moveSpeed = Math.min(enemy.moveSpeed, 1.25);

              const lastTick = trench.lastEnemyTick[enemy.id] || 0;
              if (frameNow - lastTick >= trench.tickIntervalMs) {
                trench.lastEnemyTick[enemy.id] = frameNow;
                applyDamageToEnemy(enemy, trench.damagePerTick, 'fire', g.floatingTexts, enemy.x, enemy.y);
                enemy.hitFlash = 6;
              }
            }
          }
        });
      }

      // 4.96 Actualizar Haz de Fusión Solar (Fuego + Fuego + Rayo: 400px x 24px, 500ms, 4 ticks perforantes)
      for (let sIdx = g.solarFusionBeams.length - 1; sIdx >= 0; sIdx--) {
        const beam = g.solarFusionBeams[sIdx];
        beam.elapsedMs += dt;
        if (beam.elapsedMs >= beam.durationMs) {
          beam.finished = true;
          g.solarFusionBeams.splice(sIdx, 1);
          continue;
        }

        // Chispas cuadradas rojas que parpadean a lo largo del rayo
        for (let s = 0; s < 2; s++) {
          const pDist = Math.random() * beam.length;
          const px = beam.originX + Math.cos(beam.aimAngle) * pDist + (Math.random() - 0.5) * beam.width;
          const py = beam.originY + Math.sin(beam.aimAngle) * pDist + (Math.random() - 0.5) * beam.width;
          g.particles.push({
            id: `solar-spk-${frameNow}-${s}`,
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            radius: 2,
            color: '#ef4444',
            alpha: 0.9,
            life: 10,
          });
        }

        // Colisión y 4 ticks perforantes
        const cosA = Math.cos(beam.aimAngle);
        const sinA = Math.sin(beam.aimAngle);
        enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const ex = enemy.x - beam.originX;
          const ey = enemy.y - beam.originY;
          const proj = ex * cosA + ey * sinA;
          if (proj >= -5 && proj <= beam.length + 5) {
            const perpDist = Math.abs(-ex * sinA + ey * cosA);
            if (perpDist <= beam.width * 0.5 + enemy.radius) {
              const lastTick = beam.lastEnemyTick[enemy.id] || 0;
              if (frameNow - lastTick >= beam.tickIntervalMs) {
                beam.lastEnemyTick[enemy.id] = frameNow;
                applyDamageToEnemy(enemy, beam.damagePerTick, 'fire', g.floatingTexts, enemy.x, enemy.y);
                enemy.hitFlash = 8;
                g.screenShake = Math.max(g.screenShake, 3);
              }
            }
          }
        });
      }

      // 4.97 Actualizar Alud de Agujas Telúricas (Hielo + Hielo + Tierra: 3 estalagmitas, daño masivo, freeze/stun 0.8s)
      for (let aIdx = g.glacialAvalanches.length - 1; aIdx >= 0; aIdx--) {
        const ava = g.glacialAvalanches[aIdx];
        ava.elapsedMs += dt;
        if (ava.elapsedMs >= ava.durationMs) {
          ava.finished = true;
          g.glacialAvalanches.splice(aIdx, 1);
          continue;
        }

        ava.spikes.forEach((spike) => {
          if (ava.elapsedMs >= spike.delayMs) {
            const growProg = Math.min(1.0, (ava.elapsedMs - spike.delayMs) / 180);
            spike.height = spike.maxHeight * growProg;

            if (!spike.erupted && growProg >= 0.8) {
              spike.erupted = true;
              g.screenShake = Math.max(g.screenShake, 5);
              elementalSound.playGlacialFreezeImpact();

              // Esquirlas de hielo que saltan hacia arriba
              for (let s = 0; s < 6; s++) {
                const sAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  id: `ava-spk-${frameNow}-${Math.random()}`,
                  x: spike.x,
                  y: spike.y,
                  vx: Math.cos(sAng) * 2.5,
                  vy: -2.5 - Math.random() * 2.5,
                  radius: 2.2,
                  color: s % 2 === 0 ? '#38bdf8' : '#ffffff',
                  alpha: 1,
                  life: 16,
                });
              }

              // Colisión con enemigos en la estalagmita
              enemies.forEach((enemy) => {
                if (enemy.hp <= 0 || ava.hitEnemyIds.has(enemy.id)) return;
                const d = Math.hypot(enemy.x - spike.x, (enemy.y - spike.y) / 0.58);
                if (d <= spike.width + enemy.radius) {
                  ava.hitEnemyIds.add(enemy.id);
                  applyDamageToEnemy(enemy, ava.damage, 'ice', g.floatingTexts, spike.x, spike.y);
                  enemy.hitFlash = 12;
                  enemy.stunnedTimer = 48; // microaturdimiento / congelamiento de 0.8s
                  g.enemyManager.applyStatus(enemy, 'frozen', 48);
                  g.floatingTexts.push({
                    id: `ava-stun-${frameNow}-${enemy.id}`,
                    x: enemy.x,
                    y: enemy.y - 25,
                    text: '❄️ ¡CONGELADO 0.8s!',
                    color: '#38bdf8',
                    fontSize: 12,
                    opacity: 1,
                    vy: -1.2,
                    life: 35,
                  });
                }
              });
            }
          }
        });
      }

      // 4.98 Actualizar Lluvia de Granizo Hirviente (Hielo + Hielo + Fuego: 6 carámbanos, daño gélido y estallidos de calor)
      for (let hIdx = g.boilingHails.length - 1; hIdx >= 0; hIdx--) {
        const hail = g.boilingHails[hIdx];
        hail.elapsedMs += dt;
        if (hail.elapsedMs >= hail.durationMs) {
          hail.finished = true;
          g.boilingHails.splice(hIdx, 1);
          continue;
        }

        hail.icicles.forEach((icicle) => {
          if (hail.elapsedMs >= icicle.delayMs && !icicle.hasImpacted) {
            const flightElapsed = hail.elapsedMs - icicle.delayMs;
            const prog = Math.min(1.0, flightElapsed / icicle.flightDurationMs);
            const startX = icicle.targetX + 80;
            const startY = icicle.targetY - 160;
            icicle.currentX = startX + (icicle.targetX - startX) * prog;
            icicle.currentY = startY + (icicle.targetY - startY) * prog;

            if (prog >= 1.0) {
              icicle.hasImpacted = true;
              g.screenShake = Math.max(g.screenShake, 3);
              elementalSound.playEnemyHit();

              // Vapor blanco y chispas rojas al tocar el suelo
              for (let p = 0; p < 5; p++) {
                const pAng = Math.random() * Math.PI * 2;
                g.particles.push({
                  id: `hail-steam-${frameNow}-${Math.random()}`,
                  x: icicle.targetX,
                  y: icicle.targetY,
                  vx: Math.cos(pAng) * 2,
                  vy: -1.0 - Math.random() * 1.5,
                  radius: 2.5,
                  color: p % 2 === 0 ? '#ffffff' : '#ea580c',
                  alpha: 0.9,
                  life: 14,
                });
              }

              // Daño en área de 40px por carámbano y quemadura
              enemies.forEach((enemy) => {
                if (enemy.hp <= 0) return;
                const d = Math.hypot(enemy.x - icicle.targetX, (enemy.y - icicle.targetY) / 0.58);
                if (d <= 40 + enemy.radius) {
                  applyDamageToEnemy(enemy, hail.impactDamage, 'ice', g.floatingTexts, icicle.targetX, icicle.targetY);
                  g.enemyManager.applyStatus(enemy, 'burning', 120);
                  enemy.hitFlash = 6;
                }
              });
            }
          }
        });
      }

      // 4.99 Actualizar Tormenta Crioelectrostática (Hielo + Hielo + Rayo: 80px radio, 2s, -50% vel, daño por pulsos, arcos)
      for (let bIdx = g.superconductorBlizzards.length - 1; bIdx >= 0; bIdx--) {
        const blizz = g.superconductorBlizzards[bIdx];
        blizz.elapsedMs += dt;
        blizz.angle += 0.08;
        if (blizz.elapsedMs >= blizz.durationMs) {
          blizz.finished = true;
          g.superconductorBlizzards.splice(bIdx, 1);
          continue;
        }

        // Partículas de copos y bloques de escarcha
        if (Math.random() < 0.6) {
          const rAng = Math.random() * Math.PI * 2;
          const rDist = Math.random() * blizz.radius;
          g.particles.push({
            id: `sc-part-${frameNow}-${Math.random()}`,
            x: blizz.centerX + Math.cos(rAng) * rDist,
            y: blizz.centerY + Math.sin(rAng) * rDist * 0.58,
            vx: -Math.sin(rAng) * 2.2,
            vy: Math.cos(rAng) * 1.3,
            radius: Math.random() > 0.4 ? 2.2 : 1.6,
            color: Math.random() > 0.5 ? '#bae6fd' : '#a855f7',
            alpha: 0.85,
            life: 15,
          });
        }

        // Enemigos dentro del vórtice
        const trappedEnemies: GameEnemy[] = [];
        enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const d = Math.hypot(enemy.x - blizz.centerX, (enemy.y - blizz.centerY) / 0.58);
          if (d <= blizz.radius + enemy.radius) {
            trappedEnemies.push(enemy);
            enemy.moveSpeed = Math.min(enemy.moveSpeed, 1.0); // -50% velocidad

            const lastTick = blizz.lastEnemyTick[enemy.id] || 0;
            if (frameNow - lastTick >= blizz.tickIntervalMs) {
              blizz.lastEnemyTick[enemy.id] = frameNow;
              applyDamageToEnemy(enemy, blizz.damagePerTick, 'ice', g.floatingTexts, enemy.x, enemy.y);
              enemy.hitFlash = 6;
              g.enemyManager.applyStatus(enemy, 'shocked', 60);
            }
          }
        });

        // Arcos de corriente entre enemigos contiguos atrapados
        if (trappedEnemies.length >= 2 && Math.random() < 0.35) {
          const e1 = trappedEnemies[Math.floor(Math.random() * trappedEnemies.length)];
          const e2 = trappedEnemies[Math.floor(Math.random() * trappedEnemies.length)];
          if (e1.id !== e2.id) {
            g.lightningBolts.push({
              id: `sc-arc-${frameNow}`,
              startX: e1.x,
              startY: e1.y,
              targetX: e2.x,
              targetY: e2.y,
              color: '#00f0ff',
              glowColor: '#a855f7',
              points: [
                { x: e1.x, y: e1.y },
                { x: (e1.x + e2.x) / 2 + (Math.random() - 0.5) * 20, y: (e1.y + e2.y) / 2 + (Math.random() - 0.5) * 20 },
                { x: e2.x, y: e2.y }
              ],
              branches: [],
              chainLines: [],
              life: 4,
              maxLife: 4,
            });
            applyDamageToEnemy(e2, Math.round(blizz.damagePerTick * 0.6), 'lightning', g.floatingTexts, e2.x, e2.y);
          }
        }
      }

      // 4.991 Actualizar Pilón de Pararrayos (Rayo + Rayo + Tierra: atracción en 90px y rayos cada 500ms durante 3s)
      for (let pIdx = g.lightningRodPylons.length - 1; pIdx >= 0; pIdx--) {
        const pylon = g.lightningRodPylons[pIdx];
        pylon.elapsedMs += dt;
        if (pylon.pulseWaveAlpha > 0) {
          pylon.pulseWaveAlpha = Math.max(0, pylon.pulseWaveAlpha - 0.05);
        }
        if (pylon.elapsedMs >= pylon.durationMs) {
          pylon.finished = true;
          g.lightningRodPylons.splice(pIdx, 1);
          continue;
        }

        // Chispas flotantes alrededor del obelisco
        if (Math.random() < 0.4) {
          g.particles.push({
            id: `pylon-spk-${frameNow}-${Math.random()}`,
            x: pylon.x + (Math.random() - 0.5) * 20,
            y: pylon.y - 10 - Math.random() * 30,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -1.0 - Math.random() * 1.5,
            radius: 1.8,
            color: '#facc15',
            alpha: 1,
            life: 14,
          });
        }

        // Atracción magnética suave constante en 90px
        enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const d = Math.hypot(enemy.x - pylon.x, (enemy.y - pylon.y) / 0.58);
          if (d <= pylon.pullRadius + enemy.radius) {
            const pullAng = Math.atan2(pylon.y - enemy.y, pylon.x - enemy.x);
            enemy.x += Math.cos(pullAng) * 0.9;
            enemy.y += Math.sin(pullAng) * 0.52;
          }
        });

        // Pulso radial de rayo cada 500ms
        if (pylon.elapsedMs - pylon.lastPulseMs >= pylon.pulseIntervalMs) {
          pylon.lastPulseMs = pylon.elapsedMs;
          pylon.pulseWaveAlpha = 1.0;
          g.screenShake = Math.max(g.screenShake, 4);
          elementalSound.playLightningBolt();

          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const d = Math.hypot(enemy.x - pylon.x, (enemy.y - pylon.y) / 0.58);
            if (d <= pylon.pullRadius + enemy.radius) {
              applyDamageToEnemy(enemy, pylon.damagePerPulse, 'lightning', g.floatingTexts, pylon.x, pylon.y);
              enemy.hitFlash = 8;
              g.enemyManager.applyStatus(enemy, 'shocked', 60);

              // Rayo desde la punta del pilón (y - 36) hasta el monstruo
              g.lightningBolts.push({
                id: `pylon-arc-${frameNow}-${enemy.id}`,
                startX: pylon.x,
                startY: pylon.y - 36,
                targetX: enemy.x,
                targetY: enemy.y,
                color: '#facc15',
                glowColor: '#fef08a',
                points: [
                  { x: pylon.x, y: pylon.y - 36 },
                  { x: (pylon.x + enemy.x) / 2 + (Math.random() - 0.5) * 16, y: (pylon.y - 36 + enemy.y) / 2 + (Math.random() - 0.5) * 16 },
                  { x: enemy.x, y: enemy.y }
                ],
                branches: [],
                chainLines: [],
                life: 5,
                maxLife: 5,
              });
            }
          });
        }
      }

      // 4.992 Actualizar Bomba de Plasma Inestable (Rayo + Rayo + Fuego: orbe pesado con supernova de 80px y knockback)
      for (let oIdx = g.plasmaHyperOrbs.length - 1; oIdx >= 0; oIdx--) {
        const orb = g.plasmaHyperOrbs[oIdx];

        if (!orb.exploded) {
          orb.currentX += orb.vx;
          orb.currentY += orb.vy;
          orb.travelDist += Math.hypot(orb.vx, orb.vy / 0.58);

          // Chispas de plasma violeta y fuego naranja en la estela
          if (Math.random() < 0.8) {
            g.particles.push({
              id: `plasma-tr-${frameNow}-${Math.random()}`,
              x: orb.currentX + (Math.random() - 0.5) * 12,
              y: orb.currentY + (Math.random() - 0.5) * 12,
              vx: -orb.vx * 0.2 + (Math.random() - 0.5),
              vy: -orb.vy * 0.2 + (Math.random() - 0.5),
              radius: Math.random() > 0.5 ? 2.5 : 1.8,
              color: Math.random() > 0.4 ? '#a855f7' : '#ea580c',
              alpha: 0.9,
              life: 14,
            });
          }

          // Detección de colisión con enemigos o alcance máximo (220px)
          let collided = orb.travelDist >= orb.maxDist;
          if (!collided) {
            for (const enemy of enemies) {
              if (enemy.hp <= 0) continue;
              const ed = Math.hypot(enemy.x - orb.currentX, (enemy.y - orb.currentY) / 0.58);
              if (ed <= orb.radius + enemy.radius) {
                collided = true;
                break;
              }
            }
          }

          if (collided) {
            orb.exploded = true;
            g.screenShake = Math.max(g.screenShake, 10);
            elementalSound.playAoEExplosion();

            // Daño masivo mixto y fuerte empuje radial (knockback 8.0) a enemigos en 80px
            enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              const dist = Math.hypot(enemy.x - orb.currentX, (enemy.y - orb.currentY) / 0.58);
              if (dist <= orb.explosionRadius + enemy.radius) {
                const kAng = Math.atan2(enemy.y - orb.currentY, enemy.x - orb.currentX);
                enemy.x += Math.cos(kAng) * 24;
                enemy.y += Math.sin(kAng) * 14;
                applyDamageToEnemy(enemy, orb.damage, 'lightning', g.floatingTexts, orb.currentX, orb.currentY);
                enemy.hitFlash = 12;
                g.enemyManager.applyStatus(enemy, 'burning', 120);
                g.enemyManager.applyStatus(enemy, 'shocked', 90);
              }
            });

            // Partículas de supernova desintegrándose en bloques individuales
            for (let p = 0; p < 18; p++) {
              const pAng = (p / 18) * Math.PI * 2;
              const spd = 3.5 + Math.random() * 3.5;
              g.particles.push({
                id: `sn-part-${frameNow}-${p}`,
                x: orb.currentX,
                y: orb.currentY,
                vx: Math.cos(pAng) * spd,
                vy: Math.sin(pAng) * spd * 0.58,
                radius: 3.2,
                color: p % 3 === 0 ? '#ffffff' : (p % 3 === 1 ? '#a855f7' : '#ea580c'),
                alpha: 1,
                life: 20,
              });
            }
          }
        } else {
          orb.elapsedMs += dt;
          orb.explosionProgress = Math.min(1.0, orb.elapsedMs / orb.explosionDurationMs);
          if (orb.explosionProgress >= 1.0) {
            orb.finished = true;
            g.plasmaHyperOrbs.splice(oIdx, 1);
          }
        }
      }

      // 4.993 Actualizar Descarga de Cero Absoluto (Rayo + Rayo + Hielo: ciclo visual de 360ms)
      for (let cIdx = g.cryoArcFlashes.length - 1; cIdx >= 0; cIdx--) {
        const flash = g.cryoArcFlashes[cIdx];
        flash.elapsedMs += dt;
        if (flash.elapsedMs >= flash.durationMs) {
          flash.finished = true;
          g.cryoArcFlashes.splice(cIdx, 1);
        }
      }

      // 4.994 Actualizar Megalito Volcánico Rodante (Tierra + Tierra + Fuego: radio 28px, 320px, arrolla y estalla en 65px)
      for (let bIdx = g.rollingMagmaBoulders.length - 1; bIdx >= 0; bIdx--) {
        const boulder = g.rollingMagmaBoulders[bIdx];

        if (!boulder.exploded) {
          boulder.currentX += boulder.vx;
          boulder.currentY += boulder.vy;
          boulder.rollAngle += 0.14;
          boulder.travelDist += Math.hypot(boulder.vx, boulder.vy / 0.58);

          // Estela de cenizas y ascuas cuadradas en el suelo
          if (Math.random() < 0.6) {
            g.particles.push({
              id: `boulder-tr-${frameNow}-${Math.random()}`,
              x: boulder.currentX + (Math.random() - 0.5) * 16,
              y: boulder.currentY + (Math.random() - 0.5) * 10,
              vx: -boulder.vx * 0.15 + (Math.random() - 0.5),
              vy: -boulder.vy * 0.15 + (Math.random() - 0.5),
              radius: 2.2,
              color: Math.random() > 0.4 ? '#ea580c' : '#3f3f46',
              alpha: 0.8,
              life: 16,
            });
          }

          // Arrolla y empuja a todos los enemigos a su paso
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const ed = Math.hypot(enemy.x - boulder.currentX, (enemy.y - boulder.currentY) / 0.58);
            if (ed <= boulder.radius + enemy.radius) {
              // Empuje frontal
              enemy.x += Math.cos(boulder.angle) * 14;
              enemy.y += Math.sin(boulder.angle) * 8;
              if (!boulder.hitEnemyIds.has(enemy.id)) {
                boulder.hitEnemyIds.add(enemy.id);
                applyDamageToEnemy(enemy, Math.round(boulder.damage * 0.45), 'earth', g.floatingTexts, boulder.currentX, boulder.currentY);
                enemy.hitFlash = 8;
                g.screenShake = Math.max(g.screenShake, 4);
              }
            }
          });

          // Choque con obstáculos sólidos o límite de alcance (320px)
          let hitObstacle = boulder.travelDist >= boulder.maxDist;
          if (!hitObstacle) {
            for (const obs of g.terrainManager.obstacles) {
              if (obs.blocksProjectiles) {
                const od = Math.hypot(obs.x - boulder.currentX, (obs.y - boulder.currentY) / 0.58);
                if (od <= boulder.radius + obs.radius) {
                  hitObstacle = true;
                  break;
                }
              }
            }
          }

          if (hitObstacle) {
            boulder.exploded = true;
            g.screenShake = Math.max(g.screenShake, 9);
            elementalSound.playAoEExplosion();

            // Daño ígneo en área al estallar (radio 65px)
            enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              const ed = Math.hypot(enemy.x - boulder.currentX, (enemy.y - boulder.currentY) / 0.58);
              if (ed <= boulder.explosionRadius + enemy.radius) {
                applyDamageToEnemy(enemy, boulder.damage, 'fire', g.floatingTexts, boulder.currentX, boulder.currentY);
                enemy.hitFlash = 12;
                g.enemyManager.applyStatus(enemy, 'burning', 120);
              }
            });

            // Fragmentos de roca y bloques naranjas proyectados hacia afuera
            for (let p = 0; p < 16; p++) {
              const pAng = (p / 16) * Math.PI * 2;
              const spd = 3.0 + Math.random() * 3.5;
              g.particles.push({
                id: `bld-sh-${frameNow}-${p}`,
                x: boulder.currentX,
                y: boulder.currentY,
                vx: Math.cos(pAng) * spd,
                vy: Math.sin(pAng) * spd * 0.58,
                radius: 3.0,
                color: p % 2 === 0 ? '#ea580c' : '#3f3f46',
                alpha: 1,
                life: 18,
              });
            }
          }
        } else {
          boulder.elapsedMs += dt;
          boulder.explosionProgress = Math.min(1.0, boulder.elapsedMs / boulder.explosionDurationMs);
          if (boulder.explosionProgress >= 1.0) {
            boulder.finished = true;
            g.rollingMagmaBoulders.splice(bIdx, 1);
          }
        }
      }

      // 4.995 Actualizar Fortaleza Glacial de Picos (Tierra + Tierra + Hielo: 110px radio, erupción y repliegue de púas)
      for (let fIdx = g.glacialBastions.length - 1; fIdx >= 0; fIdx--) {
        const bastion = g.glacialBastions[fIdx];
        bastion.elapsedMs += dt;
        if (bastion.elapsedMs < 200) {
          bastion.spikeProgress = bastion.elapsedMs / 200;
        } else if (bastion.elapsedMs > bastion.durationMs - 300) {
          bastion.spikeProgress = Math.max(0, (bastion.durationMs - bastion.elapsedMs) / 300);
        } else {
          bastion.spikeProgress = 1.0;
        }

        if (bastion.elapsedMs >= bastion.durationMs) {
          bastion.finished = true;
          g.glacialBastions.splice(fIdx, 1);
        }
      }

      // 4.996 Actualizar Fisura Sísmica Resonante (Tierra + Tierra + Rayo: 3 ondas concéntricas en 90° con micro-stun 0.4s)
      for (let qIdx = g.resonantQuakes.length - 1; qIdx >= 0; qIdx--) {
        const quake = g.resonantQuakes[qIdx];
        quake.elapsedMs += dt;

        quake.waves.forEach((wave) => {
          if (quake.elapsedMs >= wave.delayMs && !wave.discharged) {
            wave.discharged = true;
            g.screenShake = Math.max(g.screenShake, 5);
            elementalSound.playLightningBolt();

            enemies.forEach((enemy) => {
              if (enemy.hp <= 0 || wave.hitEnemyIds.has(enemy.id)) return;
              const dx = enemy.x - quake.originX;
              const dy = (enemy.y - quake.originY) / 0.58;
              const dist = Math.hypot(dx, dy);
              if (Math.abs(dist - wave.distance) <= 40 + enemy.radius) {
                const enemyAng = Math.atan2(dy, dx);
                const diff = Math.atan2(Math.sin(enemyAng - quake.aimAngle), Math.cos(enemyAng - quake.aimAngle));
                if (Math.abs(diff) <= quake.coneAngle / 2) {
                  wave.hitEnemyIds.add(enemy.id);
                  applyDamageToEnemy(enemy, quake.damagePerWave, 'earth', g.floatingTexts, quake.originX, quake.originY);
                  enemy.hitFlash = 8;
                  enemy.stunnedTimer = 24; // micro-aturdimiento 0.4s (24 frames)
                  enemy.shieldBrokenTimer = 60; // quiebre de escudo
                  g.enemyManager.applyStatus(enemy, 'shocked', 60);
                }
              }
            });
          }
        });

        if (quake.elapsedMs >= quake.durationMs) {
          quake.finished = true;
          g.resonantQuakes.splice(qIdx, 1);
        }
      }

      // 4.997 Actualizar Juicio del Dios del Trueno (Rayo x4: rayo colosal de 60px y chispas descendentes)
      for (let jIdx = g.thundergodJudgments.length - 1; jIdx >= 0; jIdx--) {
        const jd = g.thundergodJudgments[jIdx];
        jd.elapsedMs += dt;

        // Chispas cuadradas descendentes dentro de la columna de 60px
        if (Math.random() < 0.8) {
          const sx = jd.targetX + (Math.random() - 0.5) * jd.strikeWidth;
          const sy = jd.targetY - Math.random() * 220;
          g.particles.push({
            id: `tg-spk-${frameNow}-${Math.random()}`,
            x: sx,
            y: sy,
            vx: (Math.random() - 0.5) * 2,
            vy: 4 + Math.random() * 4,
            radius: 2.5,
            color: Math.random() > 0.4 ? '#ffffff' : '#a855f7',
            alpha: 1,
            life: 12,
          });
        }

        if (jd.elapsedMs >= jd.durationMs) {
          jd.finished = true;
          g.thundergodJudgments.splice(jIdx, 1);
        }
      }

      // 4.998 Actualizar Supernova Primordial (Fuego x4: sol colosal, estallido en 140px y lava durante 3.5s)
      for (let sIdx = g.primordialSupernovas.length - 1; sIdx >= 0; sIdx--) {
        const sn = g.primordialSupernovas[sIdx];

        if (!sn.exploded) {
          sn.currentX += sn.vx;
          sn.currentY += sn.vy;
          sn.travelDist += Math.hypot(sn.vx, sn.vy / 0.58);

          // Llamaradas solares en la trayectoria
          if (Math.random() < 0.9) {
            g.particles.push({
              id: `sn-trail-${frameNow}-${Math.random()}`,
              x: sn.currentX + (Math.random() - 0.5) * 28,
              y: sn.currentY + (Math.random() - 0.5) * 20,
              vx: -sn.vx * 0.2 + (Math.random() - 0.5) * 2,
              vy: -sn.vy * 0.2 + (Math.random() - 0.5) * 2,
              radius: 3.5,
              color: Math.random() > 0.4 ? '#fde047' : '#ea580c',
              alpha: 0.9,
              life: 16,
            });
          }

          let collided = sn.travelDist >= sn.maxDist;
          if (!collided) {
            for (const enemy of enemies) {
              if (enemy.hp <= 0) continue;
              const ed = Math.hypot(enemy.x - sn.currentX, (enemy.y - sn.currentY) / 0.58);
              if (ed <= sn.orbRadius + enemy.radius) {
                collided = true;
                break;
              }
            }
          }

          if (collided) {
            sn.exploded = true;
            g.screenShake = Math.max(g.screenShake, 14);
            elementalSound.playAoEExplosion();

            // Daño masivo instantáneo en 140px y quemadura
            enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              const ed = Math.hypot(enemy.x - sn.currentX, (enemy.y - sn.currentY) / 0.58);
              if (ed <= sn.explosionRadius + enemy.radius) {
                applyDamageToEnemy(enemy, sn.damage, 'fire', g.floatingTexts, sn.currentX, sn.currentY);
                enemy.hitFlash = 16;
                g.enemyManager.applyStatus(enemy, 'burning', 240); // 4s quemadura
              }
            });

            // Generar parches de lava ardiente sobre el suelo
            for (let p = 0; p < 10; p++) {
              const pAng = Math.random() * Math.PI * 2;
              const pDist = Math.random() * 115;
              sn.lavaPatches.push({
                x: sn.currentX + Math.cos(pAng) * pDist,
                y: sn.currentY + Math.sin(pAng) * pDist * 0.58,
                radius: 18 + Math.random() * 14,
              });
            }

            // Anillo masivo de ascuas en bloques
            for (let b = 0; b < 24; b++) {
              const bAng = (b / 24) * Math.PI * 2;
              const spd = 4 + Math.random() * 4;
              g.particles.push({
                id: `sn-exp-${frameNow}-${b}`,
                x: sn.currentX,
                y: sn.currentY,
                vx: Math.cos(bAng) * spd,
                vy: Math.sin(bAng) * spd * 0.58,
                radius: 4,
                color: b % 3 === 0 ? '#fde047' : (b % 3 === 1 ? '#ea580c' : '#7f1d1d'),
                alpha: 1,
                life: 24,
              });
            }
          }
        } else {
          sn.elapsedMs += dt;
          sn.explosionProgress = Math.min(1.0, sn.elapsedMs / sn.explosionDurationMs);

          // Daño continuo por lava cada 500ms
          if (sn.elapsedMs - sn.lastBurnTickMs >= 500) {
            sn.lastBurnTickMs = sn.elapsedMs;
            enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              for (const patch of sn.lavaPatches) {
                const pd = Math.hypot(enemy.x - patch.x, (enemy.y - patch.y) / 0.58);
                if (pd <= patch.radius + enemy.radius) {
                  applyDamageToEnemy(enemy, 24, 'fire', g.floatingTexts, patch.x, patch.y);
                  enemy.hitFlash = 6;
                  g.enemyManager.applyStatus(enemy, 'burning', 90);
                  break;
                }
              }
            });
          }

          if (sn.elapsedMs >= sn.lavaDurationMs) {
            sn.finished = true;
            g.primordialSupernovas.splice(sIdx, 1);
          }
        }
      }

      // 4.999 Actualizar Era Glacial (Hielo x4: congelación de 3s, estalagmitas y destrucción de proyectiles)
      for (let aIdx = g.absoluteZeroAges.length - 1; aIdx >= 0; aIdx--) {
        const az = g.absoluteZeroAges[aIdx];
        az.elapsedMs += dt;
        az.frostOverlayAlpha = Math.max(0, 1 - az.elapsedMs / az.durationMs);

        // Crecer estalagmitas bajo los enemigos
        az.spikes.forEach((spike) => {
          const prog = Math.min(1, az.elapsedMs / 250);
          spike.height = spike.maxHeight * prog;
        });

        // Asegurar que ningún proyectil hostil vuele durante la Era Glacial
        g.projectilePool.clearHostile();

        if (az.elapsedMs >= az.durationMs) {
          az.finished = true;
          g.absoluteZeroAges.splice(aIdx, 1);
        }
      }

      // 5.000 Actualizar Cataclismo Tectónico (Tierra x4: 4 monolitos colosales que emergen y colapsan en 2.4s)
      for (let tIdx = g.tectonicCataclysms.length - 1; tIdx >= 0; tIdx--) {
        const tc = g.tectonicCataclysms[tIdx];
        tc.elapsedMs += dt;

        tc.monoliths.forEach((m) => {
          if (tc.elapsedMs >= m.delayMs) {
            const growProg = Math.min(1, (tc.elapsedMs - m.delayMs) / 250);
            m.height = m.maxHeight * growProg;
          }

          // Colapso en escombros a los 1600ms
          if (tc.elapsedMs >= 1600 && !m.collapsed) {
            m.collapsed = true;
            g.screenShake = Math.max(g.screenShake, 7);

            // Escombros pixelados cayendo
            for (let r = 0; r < 8; r++) {
              g.particles.push({
                id: `tc-rubble-${frameNow}-${Math.random()}`,
                x: m.x + (Math.random() - 0.5) * m.width,
                y: m.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 3,
                vy: -2 + Math.random() * 4,
                radius: 3.2,
                color: r % 2 === 0 ? '#3f3f46' : '#78350f',
                alpha: 1,
                life: 20,
              });
            }
          }
        });

        if (tc.elapsedMs >= tc.durationMs) {
          tc.finished = true;
          g.tectonicCataclysms.splice(tIdx, 1);
        }
      }

      // 5.001 Actualizar Meteoro de Plasma Cinético (Fuego x3 + Rayo)
      for (let mIdx = g.kineticPlasmaMeteors.length - 1; mIdx >= 0; mIdx--) {
        const kpm = g.kineticPlasmaMeteors[mIdx];
        kpm.elapsedMs += dt;

        if (kpm.elapsedMs < kpm.telegraphDurationMs) {
          // Fase de caída supersónica
          const flightProg = Math.min(1, kpm.elapsedMs / kpm.telegraphDurationMs);
          kpm.currentX = kpm.startX + (kpm.targetX - kpm.startX) * flightProg;
          kpm.currentY = kpm.startY + (kpm.targetY - kpm.startY) * flightProg;
        } else if (!kpm.exploded) {
          // Detonación instantánea
          kpm.exploded = true;
          kpm.currentX = kpm.targetX;
          kpm.currentY = kpm.targetY;
          g.screenShake = Math.max(g.screenShake, 14);
          elementalSound.playAoEExplosion();

          // Barrido de proyectiles hostiles en radio de 90px
          g.projectilePool.filterHostile((p) => {
            const d = Math.hypot(p.x - kpm.targetX, (p.y - kpm.targetY) / 0.58);
            return d > kpm.impactRadius;
          });

          // Daño, micro-empuje radial y choque voltaico
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const d = Math.hypot(enemy.x - kpm.targetX, (enemy.y - kpm.targetY) / 0.58);
            if (d <= kpm.impactRadius + enemy.radius) {
              applyDamageToEnemy(enemy, kpm.damage, 'fire', g.floatingTexts, kpm.targetX, kpm.targetY);
              enemy.hitFlash = 14;
              const pushAng = Math.atan2(enemy.y - kpm.targetY, enemy.x - kpm.targetX);
              enemy.x += Math.cos(pushAng) * 22;
              enemy.y += Math.sin(pushAng) * 12;
              g.enemyManager.applyStatus(enemy, 'shocked', 90);
            }
          });

          // Partículas en pool de memoria
          for (let p = 0; p < 16; p++) {
            const pAng = (p / 16) * Math.PI * 2;
            const spd = 3.5 + Math.random() * 3.5;
            g.particlePool.spawn({
              x: kpm.targetX,
              y: kpm.targetY,
              vx: Math.cos(pAng) * spd,
              vy: Math.sin(pAng) * spd * 0.58,
              radius: 3,
              color: p % 3 === 0 ? '#ffffff' : (p % 3 === 1 ? '#facc15' : '#a855f7'),
              life: 20,
            });
          }
        }

        if (kpm.elapsedMs >= kpm.durationMs) {
          kpm.finished = true;
          g.kineticPlasmaMeteors.splice(mIdx, 1);
        }
      }

      // 5.002 Actualizar Cometa de Frío Abrasador (Fuego x3 + Hielo)
      for (let cIdx = g.frostburnComets.length - 1; cIdx >= 0; cIdx--) {
        const fbc = g.frostburnComets[cIdx];
        fbc.elapsedMs += dt;
        const flightDuration = Math.max(100, fbc.durationMs - 160);

        if (fbc.elapsedMs < flightDuration) {
          const prog = Math.min(1, fbc.elapsedMs / flightDuration);
          fbc.currentX = fbc.originX + (fbc.targetX - fbc.originX) * prog;
          fbc.currentY = fbc.originY + (fbc.targetY - fbc.originY) * prog;
          fbc.currentZ = Math.sin(prog * Math.PI) * 95;
        } else if (!fbc.exploded) {
          fbc.exploded = true;
          fbc.currentX = fbc.targetX;
          fbc.currentY = fbc.targetY;
          fbc.currentZ = 0;
          g.screenShake = Math.max(g.screenShake, 13);
          elementalSound.playAoEExplosion();
          elementalSound.playGlacialFreezeImpact();

          // Daño, 1.2s de congelamiento (72 frames) y 3s de quemadura simultánea (180 frames)
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const d = Math.hypot(enemy.x - fbc.targetX, (enemy.y - fbc.targetY) / 0.58);
            if (d <= fbc.impactRadius + enemy.radius) {
              applyDamageToEnemy(enemy, fbc.damage, 'fire', g.floatingTexts, fbc.targetX, fbc.targetY);
              enemy.hitFlash = 14;
              enemy.stunnedTimer = 72; // 1.2s de congelación / aturdimiento
              g.enemyManager.applyStatus(enemy, 'frozen', 72);
              g.enemyManager.applyStatus(enemy, 'burning', 180); // 3s de quemadura continua
            }
          });

          // Nube densa de vapor blanco y esquirlas en pool
          for (let p = 0; p < 18; p++) {
            const pAng = (p / 18) * Math.PI * 2;
            const spd = 2.5 + Math.random() * 3.5;
            g.particlePool.spawn({
              x: fbc.targetX,
              y: fbc.targetY,
              vx: Math.cos(pAng) * spd,
              vy: Math.sin(pAng) * spd * 0.58,
              radius: 3.5,
              color: p % 3 === 0 ? '#ffffff' : (p % 3 === 1 ? '#38bdf8' : '#ea580c'),
              life: 24,
            });
          }
        }

        if (fbc.elapsedMs >= fbc.durationMs) {
          fbc.finished = true;
          g.frostburnComets.splice(cIdx, 1);
        }
      }

      // 5.003 Actualizar Caldera Volcánica Profunda (Fuego x3 + Tierra)
      for (let vIdx = g.calderaCataclysms.length - 1; vIdx >= 0; vIdx--) {
        const cc = g.calderaCataclysms[vIdx];
        cc.elapsedMs += dt;

        // Tirón leve continuo hacia el centro del cráter para enemigos en el radio
        enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const dx = cc.centerX - enemy.x;
          const dy = (cc.centerY - enemy.y) / 0.58;
          const d = Math.hypot(dx, dy);
          if (d <= cc.radius + enemy.radius && d > 8) {
            const pullAng = Math.atan2(cc.centerY - enemy.y, cc.centerX - enemy.x);
            const pullForce = 0.85;
            enemy.x += Math.cos(pullAng) * pullForce;
            enemy.y += Math.sin(pullAng) * pullForce * 0.58;
          }
        });

        // Daño por tick ígneo cada 400ms
        if (cc.elapsedMs - cc.lastTickMs >= 400) {
          cc.lastTickMs = cc.elapsedMs;
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const d = Math.hypot(enemy.x - cc.centerX, (enemy.y - cc.centerY) / 0.58);
            if (d <= cc.radius + enemy.radius) {
              applyDamageToEnemy(enemy, cc.damagePerTick, 'fire', g.floatingTexts, cc.centerX, cc.centerY);
              enemy.hitFlash = 6;
              g.enemyManager.applyStatus(enemy, 'burning', 120);
            }
          });

          // Burbujas y chispas magmáticas en pool
          for (let b = 0; b < 3; b++) {
            const bAng = Math.random() * Math.PI * 2;
            const bDist = Math.random() * (cc.radius * 0.7);
            g.particlePool.spawn({
              x: cc.centerX + Math.cos(bAng) * bDist,
              y: cc.centerY + Math.sin(bAng) * bDist * 0.58,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -1 - Math.random() * 2,
              radius: 2.5,
              color: Math.random() > 0.5 ? '#f97316' : '#fde047',
              life: 18,
            });
          }
        }

        if (cc.elapsedMs >= cc.durationMs) {
          cc.finished = true;
          g.calderaCataclysms.splice(vIdx, 1);
        }
      }

      // 5.004 Actualizar Tempestad Solar (Rayo x3 + Fuego)
      for (let sIdx = g.solarArcTempests.length - 1; sIdx >= 0; sIdx--) {
        const sat = g.solarArcTempests[sIdx];
        sat.elapsedMs += dt;

        // Daño múltiple acelerado cada 120ms a enemigos en el área rectangular
        if (sat.elapsedMs - sat.lastTickMs >= 120) {
          sat.lastTickMs = sat.elapsedMs;
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const dx = enemy.x - sat.originX;
            const dy = (enemy.y - sat.originY) / 0.58;
            const localX = dx * Math.cos(sat.aimAngle) + dy * Math.sin(sat.aimAngle);
            const localY = -dx * Math.sin(sat.aimAngle) + dy * Math.cos(sat.aimAngle);

            if (localX >= -20 && localX <= sat.length && Math.abs(localY) <= (sat.width / 2) + enemy.radius) {
              applyDamageToEnemy(enemy, sat.damagePerTick, 'lightning', g.floatingTexts, enemy.x, enemy.y);
              enemy.hitFlash = 5;
              g.enemyManager.applyStatus(enemy, 'burning', 120);
            }
          });

          // Ascuas y chispas de plasma usando ParticlePool
          for (let p = 0; p < 4; p++) {
            const pDist = Math.random() * sat.length;
            const pOffset = (Math.random() - 0.5) * sat.width;
            const px = sat.originX + Math.cos(sat.aimAngle) * pDist - Math.sin(sat.aimAngle) * pOffset;
            const py = sat.originY + (Math.sin(sat.aimAngle) * pDist + Math.cos(sat.aimAngle) * pOffset) * 0.58;
            g.particlePool.spawn({
              x: px,
              y: py,
              vx: (Math.random() - 0.5) * 2,
              vy: -2 - Math.random() * 3,
              radius: 3,
              color: p % 2 === 0 ? '#fde047' : '#ea580c',
              life: 16,
            });
          }
        }

        if (sat.elapsedMs >= sat.durationMs) {
          sat.finished = true;
          g.solarArcTempests.splice(sIdx, 1);
        }
      }

      // 5.005 Actualizar Rayo Criogénico Puro (Rayo x3 + Hielo)
      for (let cIdx = g.cryoLightningStorms.length - 1; cIdx >= 0; cIdx--) {
        const cls = g.cryoLightningStorms[cIdx];
        cls.elapsedMs += dt;

        // Barrer proyectiles hostiles en vuelo en los puntos de impacto durante la duración
        if (cls.elapsedMs < cls.durationMs * 0.8) {
          g.projectilePool.filterHostile((p) => {
            for (const s of cls.strikes) {
              if (Math.hypot(p.x - s.targetX, (p.y - s.targetY) / 0.58) <= 60) return false;
            }
            return true;
          });
        }

        // Chispas crioelectrostáticas
        if (Math.random() < 0.3) {
          const s = cls.strikes[Math.floor(Math.random() * cls.strikes.length)];
          if (s) {
            g.particlePool.spawn({
              x: s.targetX + (Math.random() - 0.5) * 20,
              y: s.targetY + (Math.random() - 0.5) * 12,
              vx: (Math.random() - 0.5) * 2,
              vy: -1 - Math.random() * 2,
              radius: 2.5,
              color: Math.random() > 0.5 ? '#38bdf8' : '#ffffff',
              life: 14,
            });
          }
        }

        if (cls.elapsedMs >= cls.durationMs) {
          cls.finished = true;
          g.cryoLightningStorms.splice(cIdx, 1);
        }
      }

      // 5.006 Actualizar Martillo de Thor Tectónico (Rayo x3 + Tierra)
      for (let hIdx = g.tectonicLightningHammers.length - 1; hIdx >= 0; hIdx--) {
        const tlh = g.tectonicLightningHammers[hIdx];
        tlh.elapsedMs += dt;

        // Esquirlas de roca y polvo tectónico durante el estallido
        if (tlh.elapsedMs <= 180) {
          for (let r = 0; r < 2; r++) {
            const rAng = Math.random() * Math.PI * 2;
            const rDist = Math.random() * (tlh.impactRadius * 0.8);
            g.particlePool.spawn({
              x: tlh.targetX + Math.cos(rAng) * rDist,
              y: tlh.targetY + Math.sin(rAng) * rDist * 0.58,
              vx: (Math.random() - 0.5) * 3,
              vy: -2 - Math.random() * 3,
              radius: 3,
              color: r % 2 === 0 ? '#fde047' : '#52525b',
              life: 18,
            });
          }
        }

        if (tlh.elapsedMs >= tlh.durationMs) {
          tlh.finished = true;
          g.tectonicLightningHammers.splice(hIdx, 1);
        }
      }

      // 5.007 Actualizar Ventisca Ígnea (Hielo x3 + Fuego)
      for (let mbIdx = g.moltenBlizzards.length - 1; mbIdx >= 0; mbIdx--) {
        const mb = g.moltenBlizzards[mbIdx];
        mb.elapsedMs += dt;

        // Daño continuo por quemadura crítica y 60% slow cada 140ms
        if (mb.elapsedMs - mb.lastTickMs >= 140) {
          mb.lastTickMs = mb.elapsedMs;
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const d = Math.hypot(enemy.x - mb.centerX, (enemy.y - mb.centerY) / 0.58);
            if (d <= mb.radius + enemy.radius) {
              applyDamageToEnemy(enemy, mb.damagePerTick, 'ice', g.floatingTexts, mb.centerX, mb.centerY);
              enemy.hitFlash = 6;
              g.enemyManager.applyStatus(enemy, 'slowed', 60);
              g.enemyManager.applyStatus(enemy, 'burning', 120);
            }
          });

          // Gotas de magma naranja y fragmentos de hielo en ParticlePool
          for (let p = 0; p < 4; p++) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = Math.random() * mb.radius;
            g.particlePool.spawn({
              x: mb.centerX + Math.cos(pAng) * pDist,
              y: mb.centerY + Math.sin(pAng) * pDist * 0.58,
              vx: (Math.random() - 0.5) * 2,
              vy: 3 + Math.random() * 4,
              radius: 3,
              color: p % 2 === 0 ? '#38bdf8' : '#ea580c',
              life: 14,
            });
          }
        }

        if (mb.elapsedMs >= mb.durationMs) {
          mb.finished = true;
          g.moltenBlizzards.splice(mbIdx, 1);
        }
      }

      // 5.008 Actualizar Agujas Superconductoras (Hielo x3 + Rayo)
      for (let sIdx = g.superconductingNeedleStorms.length - 1; sIdx >= 0; sIdx--) {
        const sns = g.superconductingNeedleStorms[sIdx];
        sns.elapsedMs += dt;

        // Crecimiento de agujas en los primeros 200ms
        const growProg = Math.min(1, sns.elapsedMs / 200);
        sns.needles.forEach((n) => {
          n.height = n.maxHeight * growProg;
        });

        // Arcos voltaicos en cadena cada 250ms
        if (sns.elapsedMs - sns.lastArcTickMs >= 250) {
          sns.lastArcTickMs = sns.elapsedMs;
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const dx = enemy.x - sns.originX;
            const dy = (enemy.y - sns.originY) / 0.58;
            const d = Math.hypot(dx, dy);
            if (d <= sns.maxRange + enemy.radius) {
              const angToEnemy = Math.atan2(dy, dx);
              let diff = Math.abs(angToEnemy - sns.aimAngle);
              while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
              if (diff <= 1.25) {
                applyDamageToEnemy(enemy, 16, 'lightning', g.floatingTexts, enemy.x, enemy.y);
                enemy.hitFlash = 5;
                g.enemyManager.applyStatus(enemy, 'shocked', 60);
              }
            }
          });

          // Chispas violetas
          if (sns.needles.length > 0) {
            const rndNeedle = sns.needles[Math.floor(Math.random() * sns.needles.length)];
            g.particlePool.spawn({
              x: rndNeedle.x,
              y: rndNeedle.y - rndNeedle.height,
              vx: (Math.random() - 0.5) * 2,
              vy: -1 - Math.random() * 2,
              radius: 2.5,
              color: '#a855f7',
              life: 14,
            });
          }
        }

        if (sns.elapsedMs >= sns.durationMs) {
          sns.finished = true;
          g.superconductingNeedleStorms.splice(sIdx, 1);
        }
      }

      // 5.009 Actualizar Glaciar Tectónico (Hielo x3 + Tierra)
      for (let wIdx = g.tectonicGlacierWalls.length - 1; wIdx >= 0; wIdx--) {
        const tgw = g.tectonicGlacierWalls[wIdx];
        tgw.elapsedMs += dt;

        // Avance hacia adelante de la pared
        const moveDist = (tgw.speed * dt) / 1000;
        tgw.currentDist = Math.min(tgw.maxTravelDist, tgw.currentDist + moveDist);

        const wallFrontX = tgw.originX + Math.cos(tgw.aimAngle) * tgw.currentDist;
        const wallFrontY = tgw.originY + Math.sin(tgw.aimAngle) * tgw.currentDist * 0.58;

        // Empujar y dañar monstruos
        enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;
          const dx = enemy.x - tgw.originX;
          const dy = (enemy.y - tgw.originY) / 0.58;
          const projDist = dx * Math.cos(tgw.aimAngle) + dy * Math.sin(tgw.aimAngle);
          const perpDist = -dx * Math.sin(tgw.aimAngle) + dy * Math.cos(tgw.aimAngle);

          // Si el enemigo está en la línea del muro
          if (Math.abs(projDist - tgw.currentDist) <= 28 + enemy.radius && Math.abs(perpDist) <= (tgw.width / 2) + enemy.radius) {
            // Empujar hacia adelante a la velocidad del muro
            enemy.x += Math.cos(tgw.aimAngle) * (moveDist + 4);
            enemy.y += Math.sin(tgw.aimAngle) * (moveDist + 4) * 0.58;

            if (!tgw.hitEnemyIds.has(enemy.id)) {
              tgw.hitEnemyIds.add(enemy.id);
              applyDamageToEnemy(enemy, tgw.damage, 'ice', g.floatingTexts, wallFrontX, wallFrontY);
              enemy.hitFlash = 16;
              enemy.stunnedTimer = 72; // 1.2s aturdimiento
            }
          }
        });

        // Polvo y trozos de hielo
        if (Math.random() < 0.4) {
          const perp = (Math.random() - 0.5) * tgw.width;
          const px = wallFrontX - Math.sin(tgw.aimAngle) * perp;
          const py = wallFrontY + Math.cos(tgw.aimAngle) * perp * 0.58;
          g.particlePool.spawn({
            x: px,
            y: py,
            vx: -Math.cos(tgw.aimAngle) * 2 + (Math.random() - 0.5) * 2,
            vy: -1 - Math.random() * 2,
            radius: 3,
            color: Math.random() > 0.5 ? '#0284c7' : '#1e293b',
            life: 16,
          });
        }

        if (tgw.currentDist >= tgw.maxTravelDist || tgw.elapsedMs >= tgw.durationMs) {
          tgw.finished = true;
          g.tectonicGlacierWalls.splice(wIdx, 1);
        }
      }

      // 5.010 Bastión de Magma: monolitos orbitan al mago, queman a corta distancia y destruyen proyectiles.
      for (let i = g.primordialMagmaBastions.length - 1; i >= 0; i--) {
        const bastion = g.primordialMagmaBastions[i];
        bastion.elapsedMs += dt;
        bastion.orbitAngle += dtSeconds * 3.6;
        for (const monolith of bastion.monoliths) {
          const angle = bastion.orbitAngle + monolith.angleOffset;
          const mx = wizard.x + Math.cos(angle) * bastion.radius;
          const my = wizard.y + Math.sin(angle) * bastion.radius * 0.58;
          for (let pIdx = g.projectiles.length - 1; pIdx >= 0; pIdx--) {
            const projectile = g.projectiles[pIdx];
            if (projectile.isHostile && Math.hypot(projectile.x - mx, projectile.y - my) < monolith.width + (projectile.radius || 0)) g.projectilePool.deactivate(projectile as PooledProjectile);
          }
          if (bastion.elapsedMs - bastion.lastTickMs >= 300) {
            for (const enemy of enemies) {
              if (enemy.hp > 0 && Math.hypot(enemy.x - mx, (enemy.y - my) / 0.58) < 34 + enemy.radius) {
                applyDamageToEnemy(enemy, bastion.damagePerTick, 'fire', g.floatingTexts, mx, my);
                enemy.hitFlash = 8;
              }
            }
          }
        }
        if (bastion.elapsedMs - bastion.lastTickMs >= 300) bastion.lastTickMs = bastion.elapsedMs;
        if (bastion.elapsedMs >= bastion.durationMs) g.primordialMagmaBastions.splice(i, 1);
      }

      // 5.011 Fortaleza de Permafrost: absorbe daño y luego estalla congelando en 360 grados.
      for (let i = g.eternalPermafrostFortresses.length - 1; i >= 0; i--) {
        const fortress = g.eternalPermafrostFortresses[i];
        fortress.elapsedMs += dt;
        if (!fortress.burst && fortress.elapsedMs >= fortress.durationMs) fortress.burst = true;
        if (fortress.burst) {
          fortress.burstProgress = Math.min(1, fortress.burstProgress + dt / 420);
          const burstRadius = 30 + fortress.burstProgress * 230;
          for (const shard of fortress.shards) shard.dist = Math.min(125, shard.dist + (shard.speed * dtSeconds));
          for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            const dist = Math.hypot(enemy.x - wizard.x, (enemy.y - wizard.y) / 0.58);
            if (dist <= burstRadius + enemy.radius) {
              if (!fortress.hitEnemyIds.has(enemy.id)) {
                fortress.hitEnemyIds.add(enemy.id);
                applyDamageToEnemy(enemy, fortress.damage, 'ice', g.floatingTexts, wizard.x, wizard.y);
                enemy.hitFlash = 16;
                enemy.stunnedTimer = Math.max(enemy.stunnedTimer || 0, 120);
                g.enemyManager.applyStatus(enemy, 'frozen', 120);
                const angle = Math.atan2(enemy.y - wizard.y, enemy.x - wizard.x);
                enemy.x += Math.cos(angle) * 42;
                enemy.y += Math.sin(angle) * 42 * 0.58;
              }
            }
          }
          if (fortress.burstProgress >= 1) g.eternalPermafrostFortresses.splice(i, 1);
        }
      }

      // 5.012 Espira Telúrica Imantada: atrae enemigos y descarga un arco cada 400 ms.
      for (let i = g.magneticTelluricSpires.length - 1; i >= 0; i--) {
        const spire = g.magneticTelluricSpires[i];
        spire.elapsedMs += dt;
        for (const enemy of enemies) {
          if (enemy.hp <= 0) continue;
          const dx = spire.targetX - enemy.x;
          const dy = (spire.targetY - enemy.y) / 0.58;
          const dist = Math.hypot(dx, dy);
          if (dist > 22 && dist < spire.radius) {
            const pull = Math.min(dist - 18, (90 + (1 - dist / spire.radius) * 150) * dtSeconds);
            enemy.x += (dx / dist) * pull;
            enemy.y += (dy / dist) * pull * 0.58;
          }
        }
        if (spire.elapsedMs - spire.lastArcTickMs >= 400) {
          spire.lastArcTickMs = spire.elapsedMs;
          const targets = enemies.filter((enemy) => enemy.hp > 0 && Math.hypot(enemy.x - spire.targetX, (enemy.y - spire.targetY) / 0.58) < 95).slice(0, 8);
          for (const enemy of targets) {
            applyDamageToEnemy(enemy, spire.damagePerTick, 'lightning', g.floatingTexts, enemy.x, enemy.y);
            enemy.hitFlash = 10;
            g.particlePool.spawn({ x: enemy.x, y: enemy.y - 8, vx: (Math.random() - 0.5) * 2, vy: -1, radius: 3, color: '#a855f7', life: 18 });
          }
        }
        if (spire.elapsedMs >= spire.durationMs) g.magneticTelluricSpires.splice(i, 1);
      }

      // 5. Eliminar enemigos derrotados y desbloquear puertas / portales
      for (let i = enemies.length - 1; i >= 0; i--) {
        const deadEnemy = enemies[i];
        if (deadEnemy.hp <= 0) {
          // Si es el Custodio del Umbral, esperar que concluya la animación de colapso en escombros (60 frames)
          if (deadEnemy.bossType === 'threshold_custodian') {
            g.isBossDefeated = true;
            if (g.tilemap) {
              g.tilemap.victoryPortal.isActive = true;
            }
            const cs = deadEnemy.custodianState;
            if (cs && cs.defeatTimer < 60) {
              continue; // Mantener visible mientras los bloques de roca caen al suelo en escombros
            }
            // Al finalizar el colapso, asegurar que el vórtice final esté activo en el centro de la arena
            if (g.tilemap) {
              g.tilemap.victoryPortal.isActive = true;
            }
            const exitPortal = g.terrainManager.obstacles.find((o) => o.id === 'forest-exit-portal');
            if (exitPortal) {
              exitPortal.doorLocked = false;
              exitPortal.color = '#38bdf8';
              g.floatingTexts.push({
                id: `portal-open-${Date.now()}`,
                x: exitPortal.x,
                y: exitPortal.y - 30,
                text: '✨ ¡EL PORTAL DEL SANTUARIO HA SIDO DESBLOQUEADO!',
                color: '#38bdf8',
                fontSize: 14,
                opacity: 1,
                vy: -1.4,
                life: 50,
              });
            }
          }
          audioManager.playMonsterDeath();
          g.enemyManager.totalKills++;
          enemies.splice(i, 1);
        }
      }

      // Recompensas de vasijas: también recoge las que hayan destruido hechizos de área en este frame.
      const vesselRewards = g.terrainManager.vesselRewards.splice(0);
      vesselRewards.push(...collectVesselRewards(g.terrainManager.obstacles));
      for (const reward of vesselRewards) {
        if (reward.kind === 'charged') {
          chargedBoostUntilRef.current = Date.now() + VESSEL_BOOST_MS;
          setChargedBoostSeconds(10);
        } else {
          g.currentHp = Math.min(g.maxHp, g.currentHp + VESSEL_HEAL);
          setCurrentHp(g.currentHp);
        }
        g.floatingTexts.push({ id: `vessel-reward-${reward.id}`, x: reward.x, y: reward.y - 40,
          text: reward.kind === 'charged' ? '¡CARGA INSTANTÁNEA! 10s' : `+${VESSEL_HEAL} VIDA`,
          color: reward.color, fontSize: 14, opacity: 1, vy: -0.6, life: 90 });
        for (let i = 0; i < 10; i++) {
          const angle = i * Math.PI / 5;
          g.particles.push({ x: reward.x, y: reward.y - 14, vx: Math.cos(angle) * 2.5, vy: Math.sin(angle) * 2 - 1,
            radius: 3, color: reward.color, life: 30, maxLife: 30, alpha: 1 });
        }
      }
      if (vesselRewards.length > 0 && isTutorial && g.roomIndex === 2) {
        const remaining = g.terrainManager.obstacles.filter((obs) => obs.obstacleType === 'vessel' && obs.hp > 0).length;
        setVesselsRemaining(remaining);
        if (remaining === 0 && !g.roomCleared) {
          g.roomCleared = true;
          g.terrainManager.unlockRoomDoors(g.floatingTexts);
        }
      }

      // Si no quedan enemigos en una sala de combate, desbloquea el portón
      if (enemies.length === 0 && !g.roomCleared && currentRoom.roomType !== 'entrance' && !(isTutorial && g.roomIndex === 2)) {
        g.roomCleared = true;
        g.terrainManager.unlockRoomDoors(g.floatingTexts);
      }

      // 6. Textos Flotantes
      for (let i = g.floatingTexts.length - 1; i >= 0; i--) {
        const t = g.floatingTexts[i];
        t.y += t.vy;
        t.life--;
        t.opacity = t.life / 30;
        if (t.life <= 0) g.floatingTexts.splice(i, 1);
      }

      // 6.1 Actualizar y Limpiar Partículas con Object Pooling (Cero Asignación Dinámica + Culling Fuera de Cámara)
      g.particlePool.update(g.camera.x, g.camera.y, 550, 380, 64);

      // 7. Renderizado en Canvas 2.5D con Cámara Cercana y Hardware Acceleration
      const canvas = canvasRef.current;
      if (canvas) {
        let ctx = ctxRef.current;
        if (!ctx) {
          ctx = (canvas.getContext('2d', { alpha: false, desynchronized: true }) || canvas.getContext('2d')) as CanvasRenderingContext2D | null;
          ctxRef.current = ctx;
          if (ctx) {
            ctx.imageSmoothingEnabled = false;
            (ctx as any).webkitImageSmoothingEnabled = false;
            (ctx as any).mozImageSmoothingEnabled = false;
            (ctx as any).msImageSmoothingEnabled = false;
          }
        }
        if (ctx) {

          IsometricRenderer.render(
            ctx,
            canvas.width,
            canvas.height,
            g.camera,
            wizard,
            enemies,
            g.projectiles,
            g.lightningBolts,
            g.particles,
            g.floatingTexts,
            g.terrainManager.terrainZones,
            g.terrainManager.obstacles,
            g.terrainManager.electricArcs,
            g.screenShake,
            currentRoom.roomType,
            g.enemyManager.currentBoss,
            g.infernalCrowns,
            g.glacialEruptions,
            g.tectonicFists,
            g.cryoBeams,
            g.volcanicBombardments,
            g.thermalVortices,
            g.conductiveCages,
            g.permafrostPrisons,
            g.plasmaTornadoes,
            g.hellRains,
            g.celestialStorms,
            g.devastatingGlaciers,
            g.telluricBarriers,
            g.obsidianVolcanoes,
            g.conductivePrisons,
            g.overloadCores,
            g.glacialPlasmaStorms,
            g.elementalCataclysms,
            g.forestLevel ?? undefined,
            g.tilemap ?? undefined,
            g.magmaTrenches,
            g.solarFusionBeams,
            g.glacialAvalanches,
            g.boilingHails,
            g.superconductorBlizzards,
            g.lightningRodPylons,
            g.plasmaHyperOrbs,
            g.cryoArcFlashes,
            g.rollingMagmaBoulders,
            g.glacialBastions,
            g.resonantQuakes,
            g.thundergodJudgments,
            g.primordialSupernovas,
            g.absoluteZeroAges,
            g.tectonicCataclysms,
            g.kineticPlasmaMeteors,
            g.frostburnComets,
            g.calderaCataclysms,
            g.solarArcTempests,
            g.cryoLightningStorms,
            g.tectonicLightningHammers,
            g.moltenBlizzards,
            g.superconductingNeedleStorms,
            g.tectonicGlacierWalls,
            g.primordialMagmaBastions,
            g.eternalPermafrostFortresses,
            g.magneticTelluricSpires
          );
        }
      }
    } catch (err) {
      console.error('TaskQuest gameLoop error caught:', err);
    } finally {
      if (!isDefeated && !isVictorious && !victoryCommittedRef.current) {
        animId = requestAnimationFrame(gameLoop);
      }
    }
  };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
      elementalSound.stopContinuousStream();
    };
  }, [changeToRoom, currentRoom.roomType, isTutorial, isDefeated, isVictorious]);

  return (
    <div className="fixed inset-0 z-50 bg-[#040509] flex flex-col items-center justify-center select-none overflow-hidden touch-none font-sans">
      {isTutorial && (
        <div className="absolute top-20 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none">
          <div className="w-full max-w-md border-2 border-amber-300 bg-[#10142d]/95 p-2 shadow-[4px_4px_0_#000]">
            <p className="font-pixel-title text-[9px] text-amber-300">{currentRoom.title}</p>
            <p className="mt-1 font-pixel-text text-lg leading-tight text-slate-100">
              {currentRoomIndex === 0 && tutorialStep === 4
                ? '¡Bien! Se abrió la puerta de la derecha. Camina hasta ella para entrar a la sala 2.'
                : currentRoomIndex === 1
                ? (gameStateRef.current.roomCleared ? 'Sala despejada. Camina hacia la puerta de la derecha.' : 'Usa hielo contra el guardián de fuego y fuego contra el de hielo.')
                : currentRoomIndex === 2
                ? (vesselsRemaining > 0 ? `Rompe las ${vesselsRemaining} vasijas de la derecha: oro = carga instantánea 10s; verde/rojo = +20 vida.` : '¡Todas rotas! La salida de la derecha está abierta. Puedes probar tu impulso o recoger la reliquia.')
                : [
                '',
                'Usa el joystick izquierdo o toca el suelo para mover al mago.',
                'Sin esferas seleccionadas, pulsa atacar a la derecha para lanzar el proyectil verde.',
                'Selecciona una esfera a la derecha y lanza tu primer hechizo para entrar a la sala 2.',
                'Solo dos guardianes: usa hielo contra fuego y fuego contra hielo.',
                'Acércate al cofre para elegir una reliquia. Después busca la puerta dorada al norte.',
              ][tutorialStep]}
            </p>
          </div>
        </div>
      )}
      {/* Banner de entrada a la sala */}
      {chargedBoostSeconds > 0 && !isVictorious && (
        <div role="status" className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[60] pointer-events-none border-2 border-amber-300 bg-amber-950/95 px-3 py-2 text-amber-200 font-pixel-text text-lg">
          ⚡ Carga instantánea · {chargedBoostSeconds}s
        </div>
      )}
      {roomBanner && (
        <div className="absolute top-12 z-50 bg-gradient-to-r from-amber-600/90 via-purple-600/90 to-amber-600/90 text-white px-6 py-2 rounded-2xl shadow-2xl border border-amber-300/40 backdrop-blur-md animate-pulse text-center">
          <div className="text-sm font-black tracking-wider uppercase">{roomBanner}</div>
          <div className="text-[11px] text-amber-200">{currentRoom.subtitle}</div>
        </div>
      )}

      {/* Aviso flotante de rotación en móviles */}
      {isPortraitWarning && (
        <div className="absolute top-2 inset-x-2 z-50 bg-amber-500/90 text-slate-950 px-4 py-2 rounded-2xl flex items-center justify-between shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold">
            <RotateCw className="w-4 h-4 animate-spin" />
            <span>Gira tu teléfono a horizontal para la mejor vista de combate</span>
          </div>
          <button
            onClick={() => setIsPortraitWarning(false)}
            className="p-1 hover:bg-black/10 rounded-lg text-xs font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cabecera Superior de Combate (HUD Horizontal 16-Bit) */}
      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] inset-x-3 z-40 flex items-center justify-between pointer-events-none">
        {/* Barra de Vida del Mago */}
        <div className="flex items-center gap-2 retro-box-stone px-2.5 py-1 pointer-events-auto">
          <div className="font-pixel-title text-[8px] text-rose-400">HP</div>
          <div className="w-24 sm:w-36 retro-bar-container h-3.5">
            <div
              className="retro-bar-fill bg-rose-600"
              style={{ width: `${Math.max(0, (currentHp / maxHp) * 100)}%` }}
            />
          </div>
          <span className="font-pixel-title text-[8px] text-slate-200">
            {Math.round(currentHp)}/{maxHp}
          </span>
        </div>

        {/* Indicador compacto: el nombre aparece solamente al entrar en sala. */}
        <div className="retro-box-stone px-2.5 py-1 text-xs font-bold text-slate-200 flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-pixel-title text-[8px]">
            Sala {currentRoomIndex + 1}/{roomSet.length}
          </span>
        </div>

        {/* Botones de Salir y Silenciar */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {isTutorial && (
            <button onClick={onExit} className="retro-btn-stone px-2 py-1.5 text-[8px] text-slate-100">OMITIR</button>
          )}
          <button
            onClick={() => {
              const nextMuted = audioManager.toggleMute();
              setIsMuted(nextMuted);
            }}
            className="retro-btn-stone p-1.5 text-slate-300 hover:text-white"
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onExit}
            className="retro-btn-danger p-1.5 text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CANVAS PRINCIPAL CON CÁMARA CERCANA (Aceleración por Hardware GPU para WebView Android) */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={620}
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        className="w-full h-full object-contain max-w-full max-h-full pixelated"
      />

      {/* CONTROLES TÁCTILES HORIZONTALES (DOBLE PULGAR) */}

      {/* 1. LADO IZQUIERDO: SUPERFICIE TÁCTIL INVISIBLE PARA JOYSTICK DINÁMICO FLOTANTE (45vw x 60vh) */}
      <div
        className="absolute bottom-0 left-0 w-[45vw] h-[60vh] z-30 touch-none pointer-events-auto"
        onPointerDown={handleJoystickPointerDown}
        onPointerMove={handleJoystickPointerMove}
        onPointerUp={handleJoystickPointerUp}
        onPointerCancel={handleJoystickPointerUp}
      />

      {/* RENDERIZADO VECTORIAL DEL JOYSTICK FLOTANTE DINÁMICO */}
      <div
        ref={joystickDOMRef}
        className="fixed top-0 left-0 z-40 pointer-events-none opacity-0 select-none will-change-transform"
        style={{ width: 110, height: 110 }}
      >
        <div className="w-[110px] h-[110px] rounded-full bg-slate-900/65 backdrop-blur-md border-2 border-slate-500/50 shadow-[0_0_24px_rgba(0,0,0,0.7)] relative flex items-center justify-center">
          {/* Ticks rúnicos a 90 grados */}
          <div className="absolute top-1 w-1 h-2 bg-slate-400/60 rounded-full pointer-events-none" />
          <div className="absolute bottom-1 w-1 h-2 bg-slate-400/60 rounded-full pointer-events-none" />
          <div className="absolute left-1 w-2 h-1 bg-slate-400/60 rounded-full pointer-events-none" />
          <div className="absolute right-1 w-2 h-1 bg-slate-400/60 rounded-full pointer-events-none" />

          {/* Vector de dirección de luz tenue */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <linearGradient id="joystickRayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <line
              ref={joystickRayDOMRef}
              x1="55"
              y1="55"
              x2="55"
              y2="55"
              stroke="url(#joystickRayGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0"
            />
          </svg>

          {/* Pomo interior brillante con escala al presionar */}
          <div
            ref={joystickKnobDOMRef}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 border-2 border-cyan-200 shadow-[0_0_18px_rgba(56,189,248,0.9)] flex items-center justify-center will-change-transform pointer-events-none"
          >
            <div className="w-4 h-4 rounded-full bg-white/40 shadow-inner" />
          </div>
        </div>
      </div>

      {/* 2. LADO DERECHO: PAD RADIAL ERGONÓMICO EN ABANICO MOBA COMPACTO + BOTÓN DE ATAQUE Y DASH */}
      <div className="absolute bottom-0 right-0 z-40 pointer-events-none select-none touch-none w-[205px] h-[175px]">
        {/* FUEGO (🔥) — Posición media-izquierda del arco radial */}
        <div
          className="absolute z-10 pointer-events-auto"
          style={{ right: '122px', bottom: '60px' }}
        >
          <button
            data-element="fire"
            onPointerDown={(e) => handleElementTouchStart('fire', e)}
            onPointerMove={handleArcPadPointerMove}
            onPointerUp={handleArcPadPointerUp}
            onPointerCancel={handleArcPadPointerUp}
            className={`w-[46px] h-[46px] rounded-full bg-slate-900/80 backdrop-blur-sm active:scale-90 border-[1.5px] transition-all flex items-center justify-center text-white relative shadow-md ${
              elementQueue.includes('fire')
                ? 'border-orange-300 ring-2 ring-orange-400/70 shadow-[0_0_14px_rgba(249,115,22,0.8)]'
                : 'border-orange-500/80 shadow-[0_0_8px_rgba(249,115,22,0.35)]'
            }`}
            title="Fuego"
          >
            <span className="text-xl pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">🔥</span>
            {elementQueue.filter((e) => e === 'fire').length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-orange-500 text-white text-[9px] font-black rounded-full border border-orange-200 shadow flex items-center justify-center pointer-events-none">
                x{elementQueue.filter((e) => e === 'fire').length}
              </span>
            )}
          </button>
        </div>

        {/* RAYO (⚡) — Posición superior-izquierda del arco radial */}
        <div
          className="absolute z-10 pointer-events-auto"
          style={{ right: '80px', bottom: '98px' }}
        >
          <button
            data-element="lightning"
            onPointerDown={(e) => {
              stopChanneledAttack();
              handleElementTouchStart('lightning', e);
            }}
            onPointerMove={handleArcPadPointerMove}
            onPointerUp={handleArcPadPointerUp}
            onPointerCancel={handleArcPadPointerUp}
            className={`w-[46px] h-[46px] rounded-full bg-slate-900/80 backdrop-blur-sm active:scale-90 border-[1.5px] transition-all flex items-center justify-center text-white relative shadow-md ${
              elementQueue.includes('lightning')
                ? 'border-amber-200 ring-2 ring-amber-400/70 shadow-[0_0_14px_rgba(251,191,36,0.8)]'
                : 'border-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.35)]'
            }`}
            title="Rayo"
          >
            <span className="text-xl pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">⚡</span>
            {elementQueue.filter((e) => e === 'lightning').length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-400 text-slate-950 text-[9px] font-black rounded-full border border-amber-200 shadow flex items-center justify-center pointer-events-none">
                x{elementQueue.filter((e) => e === 'lightning').length}
              </span>
            )}
          </button>
        </div>

        {/* HIELO (❄️) — Posición superior del arco radial */}
        <div
          className="absolute z-10 pointer-events-auto"
          style={{ right: '24px', bottom: '110px' }}
        >
          <button
            data-element="ice"
            onPointerDown={(e) => handleElementTouchStart('ice', e)}
            onPointerMove={handleArcPadPointerMove}
            onPointerUp={handleArcPadPointerUp}
            onPointerCancel={handleArcPadPointerUp}
            className={`w-[46px] h-[46px] rounded-full bg-slate-900/80 backdrop-blur-sm active:scale-90 border-[1.5px] transition-all flex items-center justify-center text-white relative shadow-md ${
              elementQueue.includes('ice')
                ? 'border-cyan-200 ring-2 ring-cyan-400/70 shadow-[0_0_14px_rgba(56,189,248,0.8)]'
                : 'border-cyan-400/80 shadow-[0_0_8px_rgba(56,189,248,0.35)]'
            }`}
            title="Hielo"
          >
            <span className="text-xl pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">❄️</span>
            {elementQueue.filter((e) => e === 'ice').length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-cyan-400 text-slate-950 text-[9px] font-black rounded-full border border-cyan-100 shadow flex items-center justify-center pointer-events-none">
                x{elementQueue.filter((e) => e === 'ice').length}
              </span>
            )}
          </button>
        </div>

        {/* TIERRA (🌍) — Posición inferior-izquierda del arco radial */}
        <div
          className="absolute z-10 pointer-events-auto"
          style={{ right: '140px', bottom: '8px' }}
        >
          <button
            data-element="earth"
            onPointerDown={(e) => {
              stopChanneledAttack();
              handleElementTouchStart('earth', e);
            }}
            onPointerMove={handleArcPadPointerMove}
            onPointerUp={handleArcPadPointerUp}
            onPointerCancel={handleArcPadPointerUp}
            className={`w-[46px] h-[46px] rounded-full bg-slate-900/80 backdrop-blur-sm active:scale-90 border-[1.5px] transition-all flex items-center justify-center text-white relative shadow-md ${
              elementQueue.includes('earth')
                ? 'border-emerald-200 ring-2 ring-emerald-400/70 shadow-[0_0_14px_rgba(16,185,129,0.8)]'
                : 'border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.35)]'
            }`}
            title="Tierra"
          >
            <span className="text-xl pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">🌍</span>
            {elementQueue.filter((e) => e === 'earth').length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-emerald-500 text-white text-[9px] font-black rounded-full border border-emerald-200 shadow flex items-center justify-center pointer-events-none">
                x{elementQueue.filter((e) => e === 'earth').length}
              </span>
            )}
          </button>
        </div>

        {/* BOTÓN DE ESQUIVA RÁPIDA (DASH) — Lateral interior del arco */}
        <div
          className="absolute z-20 pointer-events-auto"
          style={{ right: '92px', bottom: '16px' }}
        >
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              handleDash();
            }}
            disabled={dashCooldownRatio > 0}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center border-[1.5px] transition-all active:scale-90 relative overflow-hidden shadow-md ${
              dashCooldownRatio > 0
                ? 'bg-slate-950/90 border-slate-700/80 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900/80 backdrop-blur-sm border-cyan-400/80 text-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
            }`}
            title="Esquivar"
          >
            {dashCooldownRatio > 0 && (
              <div
                className="absolute bottom-0 inset-x-0 bg-cyan-400/30 transition-all duration-75"
                style={{ height: `${dashCooldownRatio * 100}%` }}
              />
            )}
            <span className="text-sm relative z-10 pointer-events-none">⚡</span>
          </button>
        </div>

        {/* BOTÓN PRINCIPAL DE ATAQUE / LANZAR — Círculo grande (~70px) estilo MOBA */}
        <div
          className="absolute z-20 pointer-events-auto"
          style={{ right: '24px', bottom: '24px' }}
        >
          <button
            onPointerDown={handleAttackPointerDown}
            onPointerMove={handleAttackPointerMove}
            onPointerUp={handleAttackPointerUp}
            onPointerCancel={handleAttackPointerUp}
            className={`w-[70px] h-[70px] rounded-full relative overflow-hidden transition-all active:scale-92 border-[2px] flex flex-col items-center justify-center text-white shadow-xl ${
              attackCooldownRatio > 0
                ? 'bg-slate-950/90 border-slate-700/80 text-slate-400 opacity-80 cursor-not-allowed shadow-none'
                : 'bg-slate-900/65 backdrop-blur-md border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.45)]'
            }`}
            style={{
              borderColor: attackCooldownRatio === 0 && elementQueue.length > 0 ? activeRecipe.color : undefined,
              boxShadow: attackCooldownRatio === 0 && elementQueue.length > 0 ? `0 0 20px ${activeRecipe.color}66` : undefined,
            }}
            title="Lanzar / Atacar"
          >
            {/* Overlay de enfriamiento (Cooldown) */}
            {attackCooldownRatio > 0 && (
              <div
                className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-[1px] transition-all duration-75 pointer-events-none"
                style={{ height: `${attackCooldownRatio * 100}%` }}
              />
            )}

            <span className={`text-2xl relative z-10 transition-transform ${attackCooldownRatio > 0 ? 'opacity-35 scale-90 grayscale' : ''}`}>
              {gameStateRef.current.overloadCores.some((c) => !c.finished && c.phase !== 'detonating')
                ? '💣'
                : activeRecipe.icon}
            </span>

            {attackCooldownRatio > 0 && (
              <span className="text-[10px] font-bold text-pink-300 animate-pulse font-mono relative z-10 mt-0.5">
                {attackCooldownSec.toFixed(1)}s
              </span>
            )}

            {isChargingUi && chargeVisualRatio < 1.0 && attackCooldownRatio === 0 && (
              <div className="w-8 bg-black/60 h-1 rounded-full mt-0.5 overflow-hidden relative z-10">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${chargeVisualRatio * 100}%` }}
                />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 3. PARTE INFERIOR CENTRAL: RECÁMARA DE ESFERAS (SLOTS 24x24) Y TEXTO DE HECHIZO */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none select-none">
        {/* Texto del Hechizo Preparado con desvanecimiento si está vacío */}
        <div
          className={`mb-1.5 px-3 py-0.5 rounded-full backdrop-blur-sm border transition-all duration-200 text-center ${
            elementQueue.length > 0
              ? 'opacity-100 scale-100 bg-black/60 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <span className="text-[11px] font-black tracking-wider text-amber-200 uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {activeRecipe.name}
          </span>
        </div>

        {/* Cápsula de 4 slots de 24x24 px */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((slot) => {
              const el = elementQueue[slot];
              return (
                <div
                  key={slot}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition-all duration-150 ${
                    el === 'fire'
                      ? 'bg-gradient-to-br from-rose-500 to-red-600 border border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.7)] text-white scale-105'
                      : el === 'lightning'
                      ? 'bg-gradient-to-br from-amber-400 to-yellow-600 border border-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.7)] text-slate-950 scale-105'
                      : el === 'ice'
                      ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border border-cyan-200 shadow-[0_0_10px_rgba(56,189,248,0.7)] text-white scale-105'
                      : el === 'earth'
                      ? 'bg-gradient-to-br from-emerald-500 to-stone-700 border border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.7)] text-white scale-105'
                      : 'border border-dashed border-white/20 bg-white/5'
                  }`}
                >
                  {el === 'fire' && '🔥'}
                  {el === 'lightning' && '⚡'}
                  {el === 'ice' && '❄️'}
                  {el === 'earth' && '🌍'}
                </div>
              );
            })}
          </div>

          {elementQueue.length > 0 && (
            <button
              onClick={handleClearQueue}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-[10px] text-slate-300 hover:text-white flex items-center justify-center border border-white/20 transition-all ml-0.5"
              title="Vaciar recámara"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE ELECCIÓN DE RELIQUIA (SALA DE SANTUARIO) */}
      {relicModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121422] border-2 border-amber-400 p-5 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="text-center">
              <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-1 animate-spin" />
              <h3 className="text-base font-black text-amber-300">SANTUARIO DE RELIQUIAS</h3>
              <p className="text-xs text-slate-300 mt-1">
                Elige un artefacto antiguo para potenciar tu magia en los siguientes combates:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {DUNGEON_RELICS.slice(0, 3).map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRelic(r)}
                  className="p-3 bg-[#1a1c30] hover:bg-[#252847] border border-slate-700 hover:border-amber-400/80 rounded-2xl flex items-center gap-3 text-left transition group active:scale-98"
                >
                  <span className="text-2xl p-2 bg-slate-900 rounded-xl group-hover:scale-110 transition">
                    {r.icon}
                  </span>
                  <div>
                    <div className="font-bold text-xs text-slate-100 group-hover:text-amber-300">
                      {r.name}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      {r.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VICTORIA TOTAL */}
      {isVictorious && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none">
          <div className="retro-box-gold p-4 max-w-sm w-full text-center space-y-3">
            <div className="relative inline-block">
              <Award className="w-10 h-10 text-amber-400 mx-auto filter drop-shadow-[2px_2px_0px_#000]" />
            </div>

            <div>
              <h3 className="font-pixel-title text-sm font-black text-amber-300 tracking-wide uppercase drop-shadow-[2px_2px_0px_#000]">
                {isTutorial ? '¡TUTORIAL COMPLETADO!' : '¡NIVEL 1 COMPLETADO!'}
              </h3>
              <p className="font-pixel-text text-sm text-stone-200 mt-1">
                {isTutorial ? 'Ya sabes moverte y combinar elementos. Tu aventura está por comenzar.' : '¡Has derrotado al colosal Custodio del Umbral!'}
              </p>
            </div>

            {/* Tarjetas de Estadísticas Detalladas de la Incursión */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="retro-box-stone p-2 flex flex-col items-center">
                <span className="font-pixel-text text-xs text-stone-300">Monstruos</span>
                <span className="font-pixel-title text-[9px] text-rose-400 mt-0.5">
                  ⚔️ {totalKillsCount}
                </span>
              </div>
              <div className="retro-box-stone p-2 flex flex-col items-center">
                <span className="font-pixel-text text-xs text-stone-300">Tiempo</span>
                <span className="font-pixel-title text-[9px] text-cyan-300 mt-0.5">
                  ⏱️ {Math.floor(finalRunTimeSec / 60).toString().padStart(2, '0')}:{(finalRunTimeSec % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="retro-box-stone p-2 flex flex-col items-center">
                <span className="font-pixel-text text-xs text-stone-300">EXP</span>
                <span className="font-pixel-title text-[9px] text-cyan-400 mt-0.5">
                  +{floor.enemy.expReward * 2}
                </span>
              </div>
              <div className="retro-box-stone p-2 flex flex-col items-center">
                <span className="font-pixel-text text-xs text-stone-300">Oro</span>
                <span className="font-pixel-title text-[9px] text-amber-400 mt-0.5">
                  +{floor.enemy.goldReward * 2}
                </span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-2.5 retro-btn-gold text-xs uppercase"
            >
              Volver a la Base
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DERROTA */}
      {isDefeated && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
          <div className="retro-box-danger p-4 max-w-sm w-full text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto animate-pulse" />
            <h3 className="font-pixel-title text-sm font-black text-rose-300">¡HÉROE CAÍDO!</h3>
            <p className="font-pixel-text text-base text-slate-200">
              Has caído en combate en <b>{currentRoom.title}</b>.
            </p>
            <p className="font-pixel-text text-sm text-amber-300">
              Consejo: Usa <b>Hielo + Tierra</b> para atrapar a los enemigos en estacas y rómpelas con Fuego.
            </p>
            <button
              onClick={onExit}
              className="w-full py-2.5 retro-btn-danger text-xs uppercase"
            >
              REGRESAR A LA CIUDAD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
