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
} from './types';
import { createLevel1Forest, LEVEL_WIDTH, LEVEL_HEIGHT } from './level1ForestMap';
import { identifyRecipe } from './recipes';
import { elementalSound } from './soundEngine';
import {
  TerrainManager,
  checkCircleCollision,
  resolveCircleObstacleCollision,
  DUNGEON_RELICS,
} from './physicsAndTerrain';
import { EnemyManager } from './enemyAI';
import { IsometricRenderer } from './renderer';
import { RotateCw, X, Volume2, VolumeX, ShieldAlert, Award, Sparkles, Compass } from 'lucide-react';

interface LandscapeCombatViewProps {
  player: Player;
  floor: DungeonFloor;
  onExit: () => void;
  onVictory: (floorNumber: number, expReward: number, goldReward: number) => void;
  onPlayerTakeDamage: (damage: number) => void;
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
    title: 'Sala 6: Guardián de Basalto',
    subtitle: '¡Jefe 1! Hazlo embestir contra los pilares de piedra para aturdirlo.',
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

  // 2. Chispas radiales
  const sparkColor = p.spellType === 'explosive_overload' ? '#c084fc' : p.color;
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
      color: sparkColor,
      alpha: 1,
      life: 16,
    });
  }

  // 3. Daño y estados a enemigos en radio
  enemies.forEach((enemy) => {
    const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
    if (dist <= aoeRadius + enemy.radius) {
      let dmg = p.damage;

      // Reacción Choque Térmico (Fuego a enemigos congelados)
      const isFrozen = enemyManager.hasStatus(enemy, 'frozen');
      if (
        isFrozen &&
        (p.spellType === 'thermal_shock' || p.spellType === 'fire_shot' || p.spellType === 'fire_inferno')
      ) {
        dmg *= 2.5;
        enemyManager.removeStatus(enemy, 'frozen');
        floatingTexts.push({
          id: `shatter-${Date.now()}-${enemy.id}`,
          x: enemy.x,
          y: enemy.y - 25,
          text: '💥 ¡CHOQUE TÉRMICO! x2.5',
          color: '#f43f5e',
          fontSize: 14,
          opacity: 1,
          vy: -1.6,
          life: 40,
        });
      }

      enemy.hp -= dmg;
      enemy.hitFlash = 8;

      if (dist > 0) {
        const pushAng = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        enemy.x += Math.cos(pushAng) * (p.knockback || 3.5);
        enemy.y += Math.sin(pushAng) * (p.knockback || 3.5);
      }

      if (p.statusToApply) {
        enemyManager.applyStatus(enemy, p.statusToApply, 140);
      }
      if (p.spellType === 'explosive_overload') {
        enemy.stunnedTimer = 45;
      }

      floatingTexts.push({
        id: `aoedmg-${Date.now()}-${enemy.id}`,
        x: enemy.x,
        y: enemy.y - 12,
        text: `-${Math.round(dmg)}`,
        color: p.color,
        fontSize: 12,
        opacity: 1,
        vy: -1.2,
        life: 28,
      });
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

export const LandscapeCombatView: React.FC<LandscapeCombatViewProps> = ({
  player,
  floor,
  onExit,
  onVictory,
  onPlayerTakeDamage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Estados del juego
  const [currentHp, setCurrentHp] = useState(player.currentHp);
  const [maxHp, setMaxHp] = useState(player.maxHp);
  const [elementQueue, setElementQueue] = useState<ElementType[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);
  const [isVictorious, setIsVictorious] = useState(false);
  const [isPortraitWarning, setIsPortraitWarning] = useState(false);

  // Progresión de salas conectadas
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const currentRoom = DUNGEON_ROOMS[currentRoomIndex];
  const [roomBanner, setRoomBanner] = useState<string | null>(DUNGEON_ROOMS[0].title);

  // Modal de Reliquias
  const [relicModalOpen, setRelicModalOpen] = useState(false);
  const [equippedRelics, setEquippedRelics] = useState<RelicReward[]>([]);

  // Estados visuales de Esquiva y Carga
  const [dashCooldownRatio, setDashCooldownRatio] = useState(0);
  const [isChargingUi, setIsChargingUi] = useState(false);
  const [chargeVisualRatio, setChargeVisualRatio] = useState(0);
  const lastCdRatioRef = useRef(0);
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
      staffOrbColor: '#94a3b8',
      isCursed: !!(player.isCursed || (player.curseExpiresAt && new Date(player.curseExpiresAt).getTime() > Date.now())),
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
    },
    camera: { x: 550, y: 560 },
    joystick: {
      active: false,
      touchId: null as number | null,
      startX: 0,
      startY: 0,
      currX: 0,
      currY: 0,
      vx: 0,
      vy: 0,
    },
    projectiles: [] as Projectile[],
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
    lastVoltaicHumTime: 0,
    lastCryoHumTime: 0,
    lastFireBarrierBurnTime: 0,
    lastExtinguishSizzleTime: 0,
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    screenShake: 0,
    terrainManager: new TerrainManager(),
    enemyManager: new EnemyManager(),
    lastAttackTime: 0,
    currentHp: player.currentHp,
    maxHp: player.maxHp,
    roomIndex: 0,
    roomCleared: false,
    forestLevel: null as ForestLevelData | null,
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
    };
  }, []);

  // Inicializar Nivel 1 del Bosque Extendido al montar
  useEffect(() => {
    const g = gameStateRef.current;
    g.roomIndex = 0;
    g.roomCleared = false;

    // Crear el nivel extendido del bosque (2400 x 8800)
    const { levelData, initialObstacles } = createLevel1Forest();
    g.forestLevel = levelData;
    g.wizard.x = 1200;
    g.wizard.y = 8100;
    g.camera.x = 1200;
    g.camera.y = 8100;
    g.terrainManager.obstacles = [...initialObstacles];

    // Generar patrullas y jefes a lo largo del sendero
    g.enemyManager.enemies = [
      // Zona 2: Sendero - Grupo 1 (Y ~ 6800)
      ...([0, 1, 2, 3].map((i) => ({
        id: `forest-g1-${i}`,
        name: 'Duende del Bosque',
        archetype: 'chaser' as const,
        x: 1040 + (i % 2 === 0 ? -60 : 60),
        y: 6800 + i * 40,
        vx: 0,
        vy: 0,
        radius: 15,
        hp: 75,
        maxHp: 75,
        attackPower: 9,
        moveSpeed: 0.95,
        statuses: [],
        color: '#16a34a',
        avatar: '👺',
        weakness: 'fire' as ElementType,
        attackCooldown: 0,
        attackMaxCooldown: 50,
        telegraphTimer: 0,
        telegraphMax: 25,
        isTelegraphing: false,
        hitFlash: 0,
      }))),
      // Zona 2: Sendero - Grupo 2 (Y ~ 5600)
      ...([0, 1, 2].map((i) => ({
        id: `forest-g2-chaser-${i}`,
        name: 'Duende Emboscador',
        archetype: 'chaser' as const,
        x: 1380 + (i % 2 === 0 ? -50 : 50),
        y: 5600 + i * 50,
        vx: 0,
        vy: 0,
        radius: 15,
        hp: 85,
        maxHp: 85,
        attackPower: 11,
        moveSpeed: 1.0,
        statuses: [],
        color: '#dc2626',
        avatar: '👹',
        weakness: 'ice' as ElementType,
        attackCooldown: 0,
        attackMaxCooldown: 45,
        telegraphTimer: 0,
        telegraphMax: 20,
        isTelegraphing: false,
        hitFlash: 0,
      }))),
      {
        id: 'forest-g2-shooter-1',
        name: 'Espectro de las Sombras',
        archetype: 'ranged' as const,
        x: 1460,
        y: 5500,
        vx: 0,
        vy: 0,
        radius: 18,
        hp: 110,
        maxHp: 110,
        attackPower: 14,
        moveSpeed: 0.65,
        statuses: [],
        color: '#a855f7',
        avatar: '👻',
        weakness: 'lightning' as ElementType,
        attackCooldown: 30,
        attackMaxCooldown: 80,
        telegraphTimer: 0,
        telegraphMax: 30,
        isTelegraphing: false,
        hitFlash: 0,
      },
      // Zona 3: Checkpoint - Guardianes del Portón (Y ~ 4150)
      ...([0, 1, 2].map((i) => ({
        id: `gate-guard-${i}`,
        name: 'Guardián del Portón',
        archetype: 'chaser' as const,
        x: 1100 + i * 90,
        y: 4180,
        vx: 0,
        vy: 0,
        radius: 18,
        hp: 140,
        maxHp: 140,
        attackPower: 16,
        moveSpeed: 0.85,
        statuses: [],
        color: '#0284c7',
        avatar: '🗿',
        weakness: 'lightning' as ElementType,
        attackCooldown: 20,
        attackMaxCooldown: 60,
        telegraphTimer: 0,
        telegraphMax: 25,
        isTelegraphing: false,
        hitFlash: 0,
      }))),
      // Zona 4: Arena - El Guardián de Basalto (Jefe, Y ~ 1600)
      {
        id: 'forest-boss-basalt',
        name: 'Guardián de Basalto',
        archetype: 'boss' as const,
        bossType: 'basalt_guardian' as const,
        x: 1200,
        y: 1600,
        vx: 0,
        vy: 0,
        radius: 36,
        hp: 550,
        maxHp: 550,
        armorShield: 140,
        maxArmorShield: 140,
        attackPower: 26,
        moveSpeed: 0.6,
        statuses: [],
        color: '#475569',
        avatar: '🗿👑',
        weakness: 'earth' as ElementType,
        attackCooldown: 40,
        attackMaxCooldown: 130,
        telegraphTimer: 0,
        telegraphMax: 45,
        isTelegraphing: false,
        hitFlash: 0,
        phase: 1,
      },
    ];

    g.enemyManager.currentBoss = g.enemyManager.enemies.find((e) => e.archetype === 'boss') || null;
    g.currentHp = player.currentHp;
    g.maxHp = player.maxHp;
    setCurrentHp(player.currentHp);
    setMaxHp(player.maxHp);
    setRoomBanner(DUNGEON_ROOMS[0].title);
    setTimeout(() => setRoomBanner(null), 3000);
  }, [player.currentHp, player.maxHp]);

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
      if (isDefeated || isVictorious) return;
      const activeStream = gameStateRef.current.wizard.channeledStream;
      if (activeStream.active && activeStream.type !== el) {
        stopChanneledAttack();
      }
      elementalSound.playElementSelect(el);

      setElementQueue((prev) => {
        if (prev.length >= 4) {
          return [...prev.slice(1), el];
        }
        return [...prev, el];
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

      // Apuntado manual inicial (hacia cursor del ratón en PC o hacia donde mira el mago)
      if (mousePosRef.current.active) {
        const dx = mousePosRef.current.x - wizard.x;
        const dy = mousePosRef.current.y - wizard.y;
        if (Math.hypot(dx, dy) > 10) {
          wizard.channeledStream.aimAngle = Math.atan2(dy, dx);
          wizard.facingAngle = wizard.channeledStream.aimAngle;
        } else {
          wizard.channeledStream.aimAngle = wizard.facingAngle;
        }
      } else {
        wizard.channeledStream.aimAngle = wizard.facingAngle;
      }

      elementalSound.startContinuousStream(type);
    },
    [isDefeated, isVictorious]
  );

  const handleClearQueue = useCallback(() => {
    stopChanneledAttack();
    setElementQueue([]);
  }, [stopChanneledAttack]);

  // Transición a la siguiente sala
  const changeToRoom = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= DUNGEON_ROOMS.length) {
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
      g.projectiles = [];
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

      if (nextIndex === 0) {
        const { levelData, initialObstacles } = createLevel1Forest();
        g.forestLevel = levelData;
        g.wizard.x = 1200;
        g.wizard.y = 8100;
        g.camera.x = 1200;
        g.camera.y = 8100;
        g.terrainManager.obstacles = [...initialObstacles];
      } else {
        g.forestLevel = null;
        g.wizard.x = 550;
        g.wizard.y = 600;
        g.camera.x = 550;
        g.camera.y = 600;
        const nextRoom = DUNGEON_ROOMS[nextIndex];
        g.terrainManager.setupRoomTerrain(nextRoom.roomType);
        g.enemyManager.spawnRoomEnemies(nextRoom.roomType);
      }

      const nextRoom = DUNGEON_ROOMS[nextIndex];
      setCurrentRoomIndex(nextIndex);
      setRoomBanner(nextRoom.title);
      setTimeout(() => setRoomBanner(null), 3500);
    },
    [floor.enemy.expReward, floor.enemy.goldReward, floor.floorNumber, onVictory]
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
    if (isDefeated || isVictorious) return;
    const g = gameStateRef.current;
    const wizard = g.wizard;
    if (wizard.dashCooldown > 0 || wizard.isDashing) return;

    stopChanneledAttack();
    elementalSound.playDash();
    wizard.isDashing = true;
    wizard.dashTimer = 11;
    wizard.dashCooldown = wizard.dashCooldownMax;

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
      if (isDefeated || isVictorious) return;
      const now = Date.now();
      const g = gameStateRef.current;

      if (now - g.lastAttackTime < activeRecipe.cooldownMs) return;
      g.lastAttackTime = now;

      const wizard = g.wizard;
      const recipe = activeRecipe;

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
      else elementalSound.playFireShot();

      // Cálculo de dirección de apuntado (Manual para Erupción Glacial / Puño Tectónico / Bombardeo Volcánico / Tornado de Plasma / Tormenta de Plasma Glacial)
      let aimAngle = wizard.facingAngle;
      let closestDist = 420;
      let targetX = wizard.x + Math.cos(aimAngle) * 110;
      let targetY = wizard.y + Math.sin(aimAngle) * 110;

      if (recipe.id === 'ice_lance' || recipe.id === 'cryo_storm' || recipe.id === 'explosive_overload' || recipe.id === 'glacial_plasma_storm') {
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
        // Auto-apuntar al enemigo más cercano o disparar hacia la dirección del mago
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

      wizard.facingAngle = aimAngle;
      wizard.staffOrbColor = recipe.color;

      const chargeMultiplier = isCharged ? 1.65 : 1.0;
      const statBonus = Math.floor(player.stats.attack * 0.45 + player.stats.knowledge * 0.45);

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
      // CORONA INFERNAL (FUEGO + FUEGO): Onda de fuego, anillo persistente con daño periódico y detonación centrípeta
      else if (recipe.id === 'fire_inferno') {
        const crackAngles = [
          0.2 + (Math.random() - 0.5) * 0.2,
          1.15 + (Math.random() - 0.5) * 0.2,
          2.25 + (Math.random() - 0.5) * 0.2,
          3.35 + (Math.random() - 0.5) * 0.2,
          4.45 + (Math.random() - 0.5) * 0.2,
          5.55 + (Math.random() - 0.5) * 0.2,
        ];
        const statBonus = Math.floor(player.stats.attack * 0.35 + player.stats.knowledge * 0.35);
        const baseRadius = isCharged ? 165 : 140;

        g.infernalCrowns.push({
          id: `infernal-crown-${now}-${Math.random()}`,
          x: wizard.x,
          y: wizard.y,
          currentRadius: 20,
          maxRadius: baseRadius,
          phase: 'preparation',
          phaseTimer: 0,
          prepDurationMs: 350,
          expansionDurationMs: 400,
          ringDurationMs: 2400,
          detonationDurationMs: 450,
          periodicDamage: (8 + statBonus * 0.25) * (isCharged ? 1.25 : 1.0),
          periodicIntervalMs: 450,
          detonationDamage: (recipe.damage + statBonus) * (isCharged ? 1.4 : 1.0),
          knockback: (recipe.knockback || 7.0) * (isCharged ? 1.4 : 1.0),
          lastDamagePerEnemy: {},
          hasDetonated: false,
          crackAngles,
          isCharged,
        });

        elementalSound.playInfernalCrownIgnition();
        g.screenShake = Math.max(g.screenShake, isCharged ? 7 : 4);

        g.floatingTexts.push({
          id: `crown-cast-${now}`,
          x: wizard.x,
          y: wizard.y - 25,
          text: isCharged ? '👑🔥 ¡CORONA INFERNAL CARGADA!' : '👑🔥 ¡CORONA INFERNAL!',
          color: '#f97316',
          fontSize: 14,
          opacity: 1,
          vy: -1.3,
          life: 38,
        });
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
            damage: recipe.damage + statBonus,
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
    [activeRecipe, isDefeated, isVictorious, player.stats, startChanneledAttack, stopChanneledAttack]
  );

  // Manejadores de Carga de Hechizo al presionar el botón de Ataque
  const startCharge = useCallback(() => {
    if (isDefeated || isVictorious) return;
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
    const wizard = gameStateRef.current.wizard;
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
    if (activeRecipe.id !== 'lightning_storm') {
      elementalSound.playChargeStart();
    }
  }, [activeRecipe.elements, activeRecipe.id, handleAttack, isDefeated, isVictorious, startChanneledAttack]);

  const finishCharge = useCallback(() => {
    const wizard = gameStateRef.current.wizard;
    if (wizard.channeledStream.active) {
      stopChanneledAttack();
      return;
    }
    if (!wizard.isCharging) return;
    const elapsed = Date.now() - (wizard.chargeStartTime || 0);
    const wasCharged = (activeRecipe.id === 'elemental_cataclysm' || activeRecipe.id === 'glacial_plasma_storm' || activeRecipe.id === 'overload_core' || activeRecipe.id === 'conductive_prison' || activeRecipe.id === 'obsidian_volcano' || activeRecipe.id === 'telluric_barrier' || activeRecipe.id === 'devastating_glacier' || activeRecipe.id === 'celestial_storm' || activeRecipe.id === 'hell_rain' || activeRecipe.id === 'explosive_overload' || activeRecipe.id === 'cryo_storm' || activeRecipe.id === 'magma_eruption' || activeRecipe.id === 'thermal_shock' || activeRecipe.id === 'crystal_field' || activeRecipe.id === 'permafrost_prison')
      ? (elapsed >= 550 || wizard.chargeRatio >= 0.95)
      : (wizard.chargeRatio >= 1.0);
    const finalRatio = wizard.chargeRatio;
    wizard.isCharging = false;
    wizard.chargeRatio = 0;
    setIsChargingUi(false);
    setChargeVisualRatio(0);
    handleAttack(wasCharged, finalRatio);
  }, [activeRecipe.id, handleAttack, stopChanneledAttack]);

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
      const angle = Math.atan2(dy, dx);
      const wizard = gameStateRef.current.wizard;
      wizard.channeledStream.aimAngle = angle;
      wizard.facingAngle = angle;
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

  // Controles de Joystick Táctil
  const handleJoystickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const g = gameStateRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    g.joystick.active = true;
    g.joystick.touchId = e.pointerId;
    g.joystick.startX = touchX;
    g.joystick.startY = touchY;
    g.joystick.currX = touchX;
    g.joystick.currY = touchY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gameStateRef.current;
    if (!g.joystick.active || g.joystick.touchId !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    g.joystick.currX = touchX;
    g.joystick.currY = touchY;

    const dx = touchX - g.joystick.startX;
    const dy = touchY - g.joystick.startY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;

    if (dist > 5) {
      const normalizedDist = Math.min(dist, maxRadius) / maxRadius;
      const angle = Math.atan2(dy, dx);
      const speed = (2.7 + player.stats.speed * 0.08) * normalizedDist;
      g.joystick.vx = Math.cos(angle) * speed;
      g.joystick.vy = Math.sin(angle) * speed;
      g.wizard.facingAngle = angle;
      g.wizard.isMoving = true;
    } else {
      g.joystick.vx = 0;
      g.joystick.vy = 0;
      g.wizard.isMoving = false;
    }
  };

  const handleJoystickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gameStateRef.current;
    if (g.joystick.touchId === e.pointerId) {
      g.joystick.active = false;
      g.joystick.touchId = null;
      g.joystick.vx = 0;
      g.joystick.vy = 0;
      g.wizard.isMoving = false;
    }
  };

  // LOOP PRINCIPAL DE COMBATE (60 FPS)
  useEffect(() => {
    let animId: number;
    let lastFrameTimestamp = performance.now();

    const gameLoop = () => {
      try {
        const frameNow = performance.now();
        const dt = Math.min(50, Math.max(1, frameNow - lastFrameTimestamp));
        lastFrameTimestamp = frameNow;

      const g = gameStateRef.current;
      const wizard = g.wizard;
      wizard.isCursed = !!(player.isCursed || (player.curseExpiresAt && new Date(player.curseExpiresAt).getTime() > Date.now()));
      const enemies = g.enemyManager.enemies;

      // 1. Dash y Movimiento del Mago (WASD / Flechas / Joystick)
      let keyVx = 0;
      let keyVy = 0;
      const keys = keysPressedRef.current;
      if (keys['KeyW'] || keys['ArrowUp']) keyVy -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) keyVy += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) keyVx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) keyVx += 1;

      if (wizard.dashCooldown > 0) {
        wizard.dashCooldown--;
        const cdRatio = wizard.dashCooldown / wizard.dashCooldownMax;
        if (Math.abs(cdRatio - lastCdRatioRef.current) > 0.04 || wizard.dashCooldown === 0) {
          lastCdRatioRef.current = cdRatio;
          setDashCooldownRatio(cdRatio);
        }
      }

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
      } else if (keyVx !== 0 || keyVy !== 0) {
        const len = Math.hypot(keyVx, keyVy);
        const speed = 3.2 + player.stats.speed * 0.08;
        wizard.x += (keyVx / len) * speed;
        wizard.y += (keyVy / len) * speed;
        wizard.facingAngle = Math.atan2(keyVy, keyVx);
        wizard.isMoving = true;
        wizard.animFrame += 0.2;
      } else if (g.joystick.active && (g.joystick.vx !== 0 || g.joystick.vy !== 0)) {
        wizard.x += g.joystick.vx;
        wizard.y += g.joystick.vy;
        wizard.animFrame += 0.2;
      } else {
        wizard.isMoving = false;
      }

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
        const maxChargeTime = (isCataclysm || isGlacialPlasma || isOverloadCore || isConductivePrison || isObsidian || isTelluric || isGlacier || isCelestial || isHellRain || isPlasma || isCryo || isVolcanic || isThermal || isConductive || isPermafrost) ? 500 : (isVoltaic ? 1800 : (isGlacial ? 1400 : (isTectonic ? 1400 : 380)));
        const elapsed = Date.now() - wizard.chargeStartTime;
        wizard.chargeRatio = Math.min(1.0, elapsed / maxChargeTime);

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
          // A. Control Direccional y Apuntado Manual (Arrastre táctil en botón de ataque, Ratón en PC o dirección de movimiento)
          if (attackAimRef.current.active && attackAimRef.current.isAiming) {
            const dx = attackAimRef.current.currX - attackAimRef.current.startX;
            const dy = attackAimRef.current.currY - attackAimRef.current.startY;
            if (Math.hypot(dx, dy) > 7) {
              const ang = Math.atan2(dy, dx);
              stream.aimAngle = ang;
              wizard.facingAngle = ang;
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
            stream.aimAngle = wizard.facingAngle;
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
                    } else if (obs.obstacleType === 'crate' || obs.obstacleType === 'permafrost_spike') {
                      obs.hp -= 20;
                    }
                  } else if (stream.type === 'ice') {
                    if (obs.obstacleType === 'crate') {
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

      // Restricción de límites del mundo
      if (g.forestLevel) {
        wizard.x = Math.max(80, Math.min(LEVEL_WIDTH - 80, wizard.x));
        wizard.y = Math.max(80, Math.min(LEVEL_HEIGHT - 80, wizard.y));
      } else {
        wizard.x = Math.max(90, Math.min(1010, wizard.x));
        wizard.y = Math.max(90, Math.min(670, wizard.y));
      }

      // Colisión con obstáculos regulares
      g.terrainManager.obstacles.forEach((obs) => {
        resolveCircleObstacleCollision(wizard, obs);

        // INTERACCIÓN CON PUERTA DESBLOQUEADA: Transición a la siguiente sala
        if (obs.obstacleType === 'door_gate' && !obs.doorLocked) {
          const distToDoor = Math.hypot(wizard.x - obs.x, wizard.y - obs.y);
          if (distToDoor < 40) {
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
            const inX = wizard.x >= barrier.x - halfW - 12 && wizard.x <= barrier.x + halfW + 12;
            const inY = Math.abs(wizard.y - barrier.y) < halfH + wizard.radius;
            if (inX && inY) {
              // Empuje físico para bloquear el paso
              if (wizard.y > barrier.y) {
                wizard.y = barrier.y + halfH + wizard.radius;
              } else {
                wizard.y = barrier.y - halfH - wizard.radius;
              }

              // Daño por quemadura periódica al tocar físicamente las llamas
              if (frameNow - (g.lastFireBarrierBurnTime || 0) >= 550) {
                g.lastFireBarrierBurnTime = frameNow;
                elementalSound.playFireBurnHurt();
                wizard.hitFlash = 10;
                g.screenShake = 3.5;
                const burnDmg = 5;
                g.currentHp = Math.max(0, g.currentHp - burnDmg);
                setCurrentHp(g.currentHp);
                onPlayerTakeDamage(burnDmg);
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
                if (g.currentHp <= 0) {
                  setIsDefeated(true);
                }
              }
            }
          });
        }
      }

      // SEGUIMIENTO DE CÁMARA CERCANA (con anticipación hacia la dirección del mago)
      const leadX = Math.cos(wizard.facingAngle) * 35;
      const leadY = Math.sin(wizard.facingAngle) * 25;
      g.camera.x += (wizard.x + leadX - g.camera.x) * 0.12;
      g.camera.y += (wizard.y + leadY - g.camera.y) * 0.12;

      // Mantener cámara dentro de los límites del escenario
      if (g.forestLevel) {
        const cCanvas = canvasRef.current;
        const viewW = cCanvas ? cCanvas.width / 1.32 : 1100;
        const viewH = cCanvas ? cCanvas.height / 1.32 : 700;
        g.camera.x = Math.max(viewW / 2, Math.min(LEVEL_WIDTH - viewW / 2, g.camera.x));
        g.camera.y = Math.max(viewH / 2, Math.min(LEVEL_HEIGHT - viewH / 2, g.camera.y));
      } else {
        g.camera.x = Math.max(340, Math.min(760, g.camera.x));
        g.camera.y = Math.max(260, Math.min(520, g.camera.y));
      }

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

      // 3. Actualizar IA de Enemigos
      g.enemyManager.update(
        wizard,
        g.projectiles,
        g.floatingTexts,
        g.terrainManager.obstacles,
        (damage) => {
          elementalSound.playPlayerHurt();
          wizard.hitFlash = 10;
          g.screenShake = 7;
          g.currentHp = Math.max(0, g.currentHp - damage);
          setCurrentHp(g.currentHp);
          onPlayerTakeDamage(damage);

          if (g.currentHp <= 0) {
            setIsDefeated(true);
          }
        }
      );

      // Colisiones de enemigos con obstáculos
      enemies.forEach((enemy) => {
        g.terrainManager.obstacles.forEach((obs) => {
          resolveCircleObstacleCollision(enemy, obs);
        });
      });

      // Colisión de enemigos contra Barreras de Fuego activas
      if (g.forestLevel && g.forestLevel.fireBarriers) {
        g.forestLevel.fireBarriers.forEach((barrier) => {
          if (barrier.isExtinguished) return;
          const halfW = barrier.width / 2;
          const halfH = barrier.height / 2;
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            if (enemy.x >= barrier.x - halfW - enemy.radius && enemy.x <= barrier.x + halfW + enemy.radius) {
              if (Math.abs(enemy.y - barrier.y) < halfH + enemy.radius) {
                if (enemy.y > barrier.y) {
                  enemy.y = barrier.y + halfH + enemy.radius;
                } else {
                  enemy.y = barrier.y - halfH - enemy.radius;
                }
              }
            }
          });
        });
      }

      // 4. Actualizar Proyectiles y Colisiones
      for (let pIdx = g.projectiles.length - 1; pIdx >= 0; pIdx--) {
        const p = g.projectiles[pIdx];
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
          g.projectiles.splice(pIdx, 1);
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
          g.projectiles.splice(pIdx, 1);
          continue;
        }

        // Si es proyectil enemigo -> Daña al jugador (¡a menos que esté en Dash invulnerable!)
        if (p.isHostile) {
          if (!wizard.isDashing && checkCircleCollision(p.x, p.y, p.radius, wizard.x, wizard.y, wizard.radius)) {
            elementalSound.playPlayerHurt();
            wizard.hitFlash = 10;
            g.screenShake = 6;
            g.currentHp = Math.max(0, g.currentHp - p.damage);
            setCurrentHp(g.currentHp);
            onPlayerTakeDamage(p.damage);

            if (g.currentHp <= 0) {
              setIsDefeated(true);
            }
            g.projectiles.splice(pIdx, 1);
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
                g.projectiles.splice(pIdx, 1);
                break;
              }

              let finalDamage = p.damage;

              // REACCIÓN CHOQUE TÉRMICO (Fuego + Hielo):
              const isFrozen = g.enemyManager.hasStatus(enemy, 'frozen');
              if (
                isFrozen &&
                (p.spellType === 'thermal_shock' || p.spellType === 'fire_shot' || p.spellType === 'fire_inferno')
              ) {
                finalDamage *= 2.5; // Multiplicador demoledor x2.5
                g.enemyManager.removeStatus(enemy, 'frozen');
                g.floatingTexts.push({
                  id: `shatter-${Date.now()}`,
                  x: enemy.x,
                  y: enemy.y - 25,
                  text: '💥 ¡CHOQUE TÉRMICO! x2.5',
                  color: '#f43f5e',
                  fontSize: 14,
                  opacity: 1,
                  vy: -1.6,
                  life: 40,
                });
              } else {
                elementalSound.playEnemyHit();
              }

              // Reducción si el Guardián de Basalto tiene armadura frontal activa
              if (enemy.bossType === 'basalt_guardian' && enemy.stunnedTimer === 0) {
                finalDamage *= 0.35;
              }

              enemy.hp -= finalDamage;
              enemy.hitFlash = 6;

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

              // Empuje físico
              const hitAng = Math.atan2(p.vy, p.vx);
              enemy.x += Math.cos(hitAng) * p.knockback;
              enemy.y += Math.sin(hitAng) * p.knockback;

              g.floatingTexts.push({
                id: `dmg-${Date.now()}-${eIdx}`,
                x: enemy.x,
                y: enemy.y - 12,
                text: `-${Math.round(finalDamage)}`,
                color: p.color,
                fontSize: 12,
                opacity: 1,
                vy: -1.2,
                life: 30,
              });

              if (p.statusToApply) {
                g.enemyManager.applyStatus(enemy, p.statusToApply, 130);
              }

              if (p.onHitSpawn === 'magma_fissure') {
                g.terrainManager.spawnMagmaFissure(enemy.x, enemy.y);
              } else if (p.onHitSpawn === 'steam_blast') {
                g.terrainManager.spawnSteamBlast(enemy.x, enemy.y);
              }

              if (p.pierce <= 0) {
                g.projectiles.splice(pIdx, 1);
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
          g.projectiles.splice(pIdx, 1);
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

      // 4.2 Actualizar Corona Infernal (Fuego + Fuego: Fases A, B, C, D)
      for (let cIdx = g.infernalCrowns.length - 1; cIdx >= 0; cIdx--) {
        const crown = g.infernalCrowns[cIdx];
        crown.phaseTimer += dt;

        // FASE A: PREPARACIÓN (350 ms)
        if (crown.phase === 'preparation') {
          // Partículas sutiles de brasas brotando de las grietas
          if (Math.random() < 0.35) {
            const rndAng = crown.crackAngles[Math.floor(Math.random() * crown.crackAngles.length)];
            const rndDist = Math.random() * 45;
            g.particles.push({
              id: `cr-ember-${frameNow}-${Math.random()}`,
              x: crown.x + Math.cos(rndAng) * rndDist,
              y: crown.y + Math.sin(rndAng) * rndDist * 0.58,
              vx: (Math.random() - 0.5) * 1.2,
              vy: -1.8 - Math.random() * 1.4,
              radius: 1.5 + Math.random() * 1.5,
              color: Math.random() < 0.6 ? '#f97316' : '#fef08a',
              alpha: 1,
              life: 20,
            });
          }

          if (crown.phaseTimer >= crown.prepDurationMs) {
            crown.phase = 'expansion';
            crown.phaseTimer = 0;
            elementalSound.playInfernalCrownExpand();
            g.screenShake = Math.max(g.screenShake, crown.isCharged ? 8 : 6);
          }
        }

        // FASE B: EXPANSIÓN EXPLOSIVA (400 ms)
        else if (crown.phase === 'expansion') {
          const progress = Math.min(1, crown.phaseTimer / crown.expansionDurationMs);
          const easeOut = 1 - Math.pow(1 - progress, 2.2);
          crown.currentRadius = 20 + (crown.maxRadius - 20) * easeOut;

          // Chispas en el frente de choque
          if (Math.random() < 0.6) {
            const pAng = Math.random() * Math.PI * 2;
            const px = crown.x + Math.cos(pAng) * crown.currentRadius;
            const py = crown.y + Math.sin(pAng) * crown.currentRadius * 0.58;
            g.particles.push({
              id: `cr-exp-${frameNow}-${Math.random()}`,
              x: px,
              y: py,
              vx: Math.cos(pAng) * 2.2,
              vy: Math.sin(pAng) * 1.3,
              radius: 2.2 + Math.random() * 2,
              color: '#f97316',
              alpha: 0.9,
              life: 16,
            });
          }

          // Contacto inicial con enemigos durante la expansión
          enemies.forEach((enemy) => {
            const d = Math.hypot(enemy.x - crown.x, (enemy.y - crown.y) / 0.58);
            if (d <= crown.currentRadius + enemy.radius && !crown.lastDamagePerEnemy[enemy.id]) {
              crown.lastDamagePerEnemy[enemy.id] = frameNow;
              const hitDmg = Math.round(crown.periodicDamage * 1.25);
              enemy.hp -= hitDmg;
              enemy.hitFlash = 8;
              g.enemyManager.applyStatus(enemy, 'burning', 180, 6);
              g.floatingTexts.push({
                id: `cr-exp-hit-${frameNow}-${enemy.id}`,
                x: enemy.x,
                y: enemy.y - 18,
                text: `🔥 -${hitDmg}`,
                color: '#f97316',
                fontSize: 12,
                opacity: 1,
                vy: -1.2,
                life: 25,
              });
            }
          });

          if (crown.phaseTimer >= crown.expansionDurationMs) {
            crown.phase = 'ring';
            crown.phaseTimer = 0;
            crown.currentRadius = crown.maxRadius;
          }
        }

        // FASE C: CORONA DE LLAMAS PERSISTENTE (2400 ms)
        else if (crown.phase === 'ring') {
          crown.currentRadius = crown.maxRadius;

          // Daño periódico cada 450 ms por enemigo dentro del área
          enemies.forEach((enemy) => {
            const dist = Math.hypot(enemy.x - crown.x, (enemy.y - crown.y) / 0.58);
            if (dist <= crown.maxRadius + enemy.radius) {
              const lastTick = crown.lastDamagePerEnemy[enemy.id] || 0;
              if (frameNow - lastTick >= crown.periodicIntervalMs) {
                crown.lastDamagePerEnemy[enemy.id] = frameNow;
                const dmg = Math.round(crown.periodicDamage);
                enemy.hp -= dmg;
                enemy.hitFlash = 7;
                g.enemyManager.applyStatus(enemy, 'burning', 200, 6);
                elementalSound.playContinuousTick('fire');
                g.floatingTexts.push({
                  id: `cr-tick-${frameNow}-${enemy.id}`,
                  x: enemy.x + (Math.random() - 0.5) * 14,
                  y: enemy.y - 18,
                  text: `🔥 -${dmg}`,
                  color: '#ea580c',
                  fontSize: 12,
                  opacity: 1,
                  vy: -1.3,
                  life: 28,
                });
              }
            }
          });

          // Emisión visual de brasas vivas desde el anillo de llamas
          if (Math.random() < 0.45) {
            const rAng = Math.random() * Math.PI * 2;
            const rx = crown.x + Math.cos(rAng) * crown.maxRadius;
            const ry = crown.y + Math.sin(rAng) * crown.maxRadius * 0.58;
            g.particles.push({
              id: `cr-flame-${frameNow}-${Math.random()}`,
              x: rx + (Math.random() - 0.5) * 6,
              y: ry + (Math.random() - 0.5) * 4,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -1.6 - Math.random() * 1.8,
              radius: 2 + Math.random() * 2,
              color: Math.random() < 0.5 ? '#f97316' : '#fef08a',
              alpha: 0.9,
              life: 22,
            });
          }

          if (crown.phaseTimer >= crown.ringDurationMs) {
            crown.phase = 'detonation';
            crown.phaseTimer = 0;
            crown.hasDetonated = false;
          }
        }

        // FASE D: CONVERGENCIA Y DETONACIÓN FINAL (450 ms)
        else if (crown.phase === 'detonation') {
          // Primeros 180 ms: Inward collapse
          if (crown.phaseTimer < 180) {
            const collapseProg = crown.phaseTimer / 180;
            crown.currentRadius = crown.maxRadius * (1 - collapseProg * 0.75);

            // Chispas succionadas hacia el centro
            if (Math.random() < 0.6) {
              const inAng = Math.random() * Math.PI * 2;
              const inDist = crown.currentRadius + 20;
              g.particles.push({
                id: `cr-implode-${frameNow}-${Math.random()}`,
                x: crown.x + Math.cos(inAng) * inDist,
                y: crown.y + Math.sin(inAng) * inDist * 0.58,
                vx: -Math.cos(inAng) * 3.5,
                vy: -Math.sin(inAng) * 2.0,
                radius: 2,
                color: '#ffffff',
                alpha: 1,
                life: 10,
              });
            }
          } else if (!crown.hasDetonated) {
            // A los 180 ms: ¡COLOSAL DETONACIÓN FINAL!
            crown.hasDetonated = true;
            elementalSound.playInfernalCrownDetonation();
            g.screenShake = crown.isCharged ? 18 : 16;

            const blastRadius = crown.maxRadius * 1.25;
            const finalDamage = Math.round(crown.detonationDamage * 2.8);

            // Daño y empuje radial a enemigos en el área
            enemies.forEach((enemy) => {
              const dist = Math.hypot(enemy.x - crown.x, (enemy.y - crown.y) / 0.58);
              if (dist <= blastRadius + enemy.radius) {
                enemy.hp -= finalDamage;
                enemy.hitFlash = 16;
                enemy.stunnedTimer = 25;
                g.enemyManager.applyStatus(enemy, 'burning', 240, 8);

                // Empuje violento hacia afuera
                const knockAng = Math.atan2((enemy.y - crown.y) / 0.58, enemy.x - crown.x);
                enemy.x += Math.cos(knockAng) * crown.knockback * 4.5;
                enemy.y += Math.sin(knockAng) * crown.knockback * 2.6;

                g.floatingTexts.push({
                  id: `cr-det-crit-${frameNow}-${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 24,
                  text: `💥 ¡ESTALLIDO INFERNAL! -${finalDamage}`,
                  color: '#fef08a',
                  fontSize: 14,
                  opacity: 1,
                  vy: -1.8,
                  life: 45,
                });
              }
            });

            // Daño a obstáculos rompibles
            g.terrainManager.obstacles.forEach((obs) => {
              const dist = Math.hypot(obs.x - crown.x, (obs.y - crown.y) / 0.58);
              if (dist <= blastRadius + obs.radius) {
                obs.hp -= finalDamage * 0.8;
              }
            });

            // Anillo de onda de choque expansivo
            g.particles.push({
              id: `cr-blast-ring-${frameNow}`,
              x: crown.x,
              y: crown.y,
              vx: 0,
              vy: 0,
              radius: 15,
              color: '#ffffff',
              alpha: 1,
              life: 18,
              maxLife: 18,
              type: 'ring',
            });

            // Ráfaga masiva de esquirlas y llamas radiales
            for (let p = 0; p < 24; p++) {
              const pAng = (p / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
              const pSpeed = 4.0 + Math.random() * 5.0;
              g.particles.push({
                id: `cr-det-burst-${frameNow}-${p}`,
                x: crown.x,
                y: crown.y,
                vx: Math.cos(pAng) * pSpeed,
                vy: Math.sin(pAng) * pSpeed * 0.58,
                radius: 3 + Math.random() * 3,
                color: p % 2 === 0 ? '#fef08a' : (p % 3 === 0 ? '#ef4444' : '#f97316'),
                alpha: 1,
                life: 25 + Math.floor(Math.random() * 15),
              });
            }
          }

          if (crown.phaseTimer >= crown.detonationDurationMs) {
            crown.phase = 'finished';
          }
        }

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
              // Absorción y desintegración del proyectil
              g.projectiles.splice(pIdx, 1);
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
              g.projectiles.splice(pIdx, 1);
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
                g.projectiles.splice(pIdx, 1);
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
              g.projectiles = g.projectiles.filter((p) => {
                if (!p.isHostile) return true;
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

      // 5. Eliminar enemigos derrotados y desbloquear puertas de la sala
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) {
          g.enemyManager.totalKills++;
          enemies.splice(i, 1);
        }
      }

      // Si no quedan enemigos en una sala de combate, desbloquea el portón
      if (enemies.length === 0 && !g.roomCleared && currentRoom.roomType !== 'entrance') {
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

      // 6.1 Actualizar y Limpiar Partículas (Garantiza 60 FPS fijos y evita acumulación en memoria)
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        pt.alpha = pt.life / (pt.maxLife || 18);
        if (pt.type === 'ring') {
          pt.radius += 3.2; // Expansión del anillo de onda de choque
        }
        if (pt.life <= 0) {
          g.particles.splice(i, 1);
        }
      }
      if (g.particles.length > 55) {
        g.particles.splice(0, g.particles.length - 55);
      }

      // 7. Renderizado en Canvas 2.5D con Cámara Cercana
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
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
            g.forestLevel ?? undefined
          );
        }
      }
    } catch (err) {
      console.error('TaskQuest gameLoop error caught:', err);
    } finally {
      if (!isDefeated && !isVictorious) {
        animId = requestAnimationFrame(gameLoop);
      }
    }
  };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
      elementalSound.stopContinuousStream();
    };
  }, [changeToRoom, currentRoom.roomType, isDefeated, isVictorious, onPlayerTakeDamage]);

  return (
    <div className="fixed inset-0 z-50 bg-[#040509] flex flex-col items-center justify-center select-none overflow-hidden touch-none font-sans">
      {/* Banner de entrada a la sala */}
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

      {/* Cabecera Superior de Combate (HUD Horizontal) */}
      <div className="absolute top-2 inset-x-3 z-40 flex items-center justify-between pointer-events-none">
        {/* Barra de Vida del Mago */}
        <div className="flex items-center gap-2 bg-[#121422]/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/60 shadow-lg pointer-events-auto">
          <div className="text-xs font-black text-rose-400">HP</div>
          <div className="w-28 sm:w-40 bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-emerald-400 transition-all duration-200"
              style={{ width: `${Math.max(0, (currentHp / maxHp) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-slate-200">
            {Math.round(currentHp)} / {maxHp}
          </span>
        </div>

        {/* Indicador de Sala y Progreso */}
        <div className="bg-[#121422]/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/60 text-xs font-bold text-slate-200 shadow-lg flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>
            {currentRoom.title} ({currentRoomIndex + 1}/{DUNGEON_ROOMS.length})
          </span>
        </div>

        {/* Botones de Salir y Silenciar */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => {
              const muted = !isMuted;
              setIsMuted(muted);
              elementalSound.setMuted(muted);
            }}
            className="p-2 bg-[#121422]/85 backdrop-blur-md text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onExit}
            className="p-2 bg-[#121422]/85 backdrop-blur-md text-slate-300 hover:text-rose-400 rounded-xl border border-slate-700/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CANVAS PRINCIPAL CON CÁMARA CERCANA */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={620}
        className="w-full h-full object-contain max-w-full max-h-full"
      />

      {/* CONTROLES TÁCTILES HORIZONTALES (DOBLE PULGAR) */}

      {/* 1. LADO IZQUIERDO: JOYSTICK VIRTUAL */}
      <div
        className="absolute bottom-4 left-4 z-40 w-36 h-36 flex items-center justify-center pointer-events-auto"
        onPointerDown={handleJoystickPointerDown}
        onPointerMove={handleJoystickPointerMove}
        onPointerUp={handleJoystickPointerUp}
        onPointerCancel={handleJoystickPointerUp}
      >
        <div className="w-32 h-32 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-slate-600/60 flex items-center justify-center relative shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-cyan-500/80 border-2 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.8)] pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] font-bold text-slate-400">
            MOVER
          </div>
        </div>
      </div>

      {/* 2. LADO DERECHO: 4 BOTONES ELEMENTALES + BOTÓN DE ATAQUE */}
      <div className="absolute bottom-3 right-3 z-40 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Vista previa de los elementos seleccionados y receta reconocida */}
        <div className="flex items-center gap-1.5 bg-[#121422]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((slot) => {
              const el = elementQueue[slot];
              return (
                <div
                  key={slot}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${
                    el === 'fire'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      : el === 'lightning'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                      : el === 'ice'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                      : el === 'earth'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'bg-slate-900/40 border-slate-800 text-slate-600'
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
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 bg-slate-800 rounded-md border border-slate-700"
            >
              Borrar
            </button>
          )}

          <div
            className="text-xs font-black px-2 py-0.5 rounded-md text-white shadow"
            style={{ backgroundColor: activeRecipe.color }}
          >
            {activeRecipe.name}
          </div>
        </div>

        {/* Panel de Controles Táctiles */}
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-2">
            {/* FUEGO */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                handleSelectElement('fire');
              }}
              className="w-13 h-13 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 active:scale-95 border-2 border-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center text-white"
            >
              <span className="text-xl">🔥</span>
              <span className="text-[9px] font-black tracking-wider">FUEGO</span>
            </button>

            {/* RAYO */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                stopChanneledAttack();
                handleSelectElement('lightning');
              }}
              className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-700 active:scale-95 border-2 border-amber-300 shadow-[0_0_12px_rgba(234,179,8,0.4)] flex flex-col items-center justify-center text-white"
            >
              <span className="text-xl">⚡</span>
              <span className="text-[9px] font-black tracking-wider">RAYO</span>
            </button>

            {/* HIELO */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                handleSelectElement('ice');
              }}
              className="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 active:scale-95 border-2 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] flex flex-col items-center justify-center text-white"
            >
              <span className="text-xl">❄️</span>
              <span className="text-[9px] font-black tracking-wider">HIELO</span>
            </button>

            {/* TIERRA */}
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                stopChanneledAttack();
                handleSelectElement('earth');
              }}
              className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-600 to-stone-800 active:scale-95 border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] flex flex-col items-center justify-center text-white"
            >
              <span className="text-xl">🌍</span>
              <span className="text-[9px] font-black tracking-wider">TIERRA</span>
            </button>
          </div>

          {/* BOTÓN DE ESQUIVA RÁPIDA (DASH) */}
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              handleDash();
            }}
            disabled={dashCooldownRatio > 0}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-90 relative overflow-hidden shadow-lg ${
              dashCooldownRatio > 0
                ? 'bg-slate-900/80 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]'
            }`}
          >
            {dashCooldownRatio > 0 && (
              <div
                className="absolute bottom-0 inset-x-0 bg-cyan-400/30 transition-all duration-75"
                style={{ height: `${dashCooldownRatio * 100}%` }}
              />
            )}
            <span className="text-xl relative z-10">⚡</span>
            <span className="text-[8px] font-black tracking-wider relative z-10">ESQUIVAR</span>
          </button>

          {/* BOTÓN PRINCIPAL DE ATAQUE / LANZAR CON CARGA Y APUNTADO TÁCTIL */}
          <button
            onPointerDown={handleAttackPointerDown}
            onPointerMove={handleAttackPointerMove}
            onPointerUp={handleAttackPointerUp}
            onPointerCancel={handleAttackPointerUp}
            className={`w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 active:scale-95 border-2 ${
              chargeVisualRatio >= 1.0
                ? (activeRecipe.id === 'lightning_storm'
                    ? 'border-cyan-300 shadow-[0_0_28px_rgba(56,189,248,0.95)] animate-pulse'
                    : activeRecipe.id === 'ice_lance'
                    ? 'border-cyan-200 shadow-[0_0_28px_rgba(6,182,212,0.95)] animate-pulse'
                    : activeRecipe.id === 'earth_megalith'
                    ? 'border-amber-300 shadow-[0_0_28px_rgba(245,158,11,0.95)] animate-pulse'
                    : activeRecipe.id === 'cryo_storm'
                    ? 'border-cyan-200 shadow-[0_0_30px_rgba(0,240,255,0.95)] animate-pulse'
                    : activeRecipe.id === 'magma_eruption'
                    ? 'border-orange-400 shadow-[0_0_30px_rgba(255,109,0,0.95)] animate-pulse'
                    : activeRecipe.id === 'thermal_shock'
                    ? 'border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.95)] animate-pulse'
                    : activeRecipe.id === 'crystal_field'
                    ? 'border-yellow-300 shadow-[0_0_30px_rgba(234,179,8,0.95)] animate-pulse'
                    : activeRecipe.id === 'permafrost_prison'
                    ? 'border-cyan-300 shadow-[0_0_30px_rgba(0,229,255,0.95)] animate-pulse'
                    : activeRecipe.id === 'explosive_overload'
                    ? 'border-cyan-300 shadow-[0_0_30px_rgba(0,229,255,0.95)] animate-pulse'
                    : activeRecipe.id === 'hell_rain'
                    ? 'border-red-400 shadow-[0_0_32px_rgba(255,61,0,0.95)] animate-pulse'
                    : activeRecipe.id === 'celestial_storm'
                    ? 'border-cyan-300 shadow-[0_0_32px_rgba(0,240,255,0.95)] animate-pulse'
                    : activeRecipe.id === 'devastating_glacier'
                    ? 'border-cyan-200 shadow-[0_0_32px_rgba(0,229,255,0.95)] animate-pulse'
                    : activeRecipe.id === 'telluric_barrier'
                    ? 'border-amber-400 shadow-[0_0_32px_rgba(245,158,11,0.95)] animate-pulse'
                    : activeRecipe.id === 'obsidian_volcano'
                    ? 'border-fuchsia-400 shadow-[0_0_32px_rgba(217,70,239,0.95)] animate-pulse'
                    : activeRecipe.id === 'conductive_prison'
                    ? 'border-indigo-400 shadow-[0_0_32px_rgba(124,77,255,0.95)] animate-pulse'
                    : activeRecipe.id === 'overload_core'
                    ? 'border-amber-400 shadow-[0_0_35px_rgba(255,109,0,0.95)] animate-pulse'
                    : activeRecipe.id === 'glacial_plasma_storm'
                    ? 'border-cyan-300 shadow-[0_0_35px_rgba(0,229,255,0.95)] animate-pulse'
                    : activeRecipe.id === 'elemental_cataclysm'
                    ? 'border-pink-400 shadow-[0_0_42px_rgba(236,72,153,1.0)] animate-pulse'
                    : 'border-amber-300 shadow-[0_0_25px_rgba(250,204,21,0.9)] animate-pulse')
                : (gameStateRef.current.overloadCores.some((c) => !c.finished && c.phase !== 'detonating')
                    ? 'border-red-500 shadow-[0_0_36px_rgba(255,23,68,1.0)] animate-pulse'
                    : activeRecipe.id === 'lightning_storm'
                    ? 'border-cyan-400 shadow-[0_0_18px_rgba(56,189,248,0.6)]'
                    : activeRecipe.id === 'ice_lance'
                    ? 'border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.6)]'
                    : activeRecipe.id === 'earth_megalith'
                    ? 'border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.6)]'
                    : activeRecipe.id === 'cryo_storm'
                    ? 'border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.7)]'
                    : activeRecipe.id === 'magma_eruption'
                    ? 'border-orange-500 shadow-[0_0_20px_rgba(255,109,0,0.7)]'
                    : activeRecipe.id === 'thermal_shock'
                    ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)]'
                    : activeRecipe.id === 'crystal_field'
                    ? 'border-amber-400 shadow-[0_0_20px_rgba(234,179,8,0.7)]'
                    : activeRecipe.id === 'permafrost_prison'
                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.7)]'
                    : activeRecipe.id === 'explosive_overload'
                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.7)]'
                    : activeRecipe.id === 'hell_rain'
                    ? 'border-red-500 shadow-[0_0_22px_rgba(255,61,0,0.75)]'
                    : activeRecipe.id === 'celestial_storm'
                    ? 'border-cyan-400 shadow-[0_0_22px_rgba(0,240,255,0.75)]'
                    : activeRecipe.id === 'devastating_glacier'
                    ? 'border-cyan-300 shadow-[0_0_22px_rgba(0,229,255,0.75)]'
                    : activeRecipe.id === 'telluric_barrier'
                    ? 'border-amber-500 shadow-[0_0_22px_rgba(217,119,6,0.75)]'
                    : activeRecipe.id === 'obsidian_volcano'
                    ? 'border-fuchsia-600 shadow-[0_0_22px_rgba(192,38,211,0.75)]'
                    : activeRecipe.id === 'conductive_prison'
                    ? 'border-indigo-500 shadow-[0_0_22px_rgba(124,77,255,0.75)]'
                    : activeRecipe.id === 'overload_core'
                    ? 'border-amber-500 shadow-[0_0_24px_rgba(255,109,0,0.8)]'
                    : activeRecipe.id === 'glacial_plasma_storm'
                    ? 'border-cyan-400 shadow-[0_0_24px_rgba(0,229,255,0.8)]'
                    : activeRecipe.id === 'elemental_cataclysm'
                    ? 'border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.9)] animate-pulse'
                    : 'border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.7)]')
            } flex flex-col items-center justify-center text-white transition-all`}
          >
            <span className="text-2xl">
              {gameStateRef.current.overloadCores.some((c) => !c.finished && c.phase !== 'detonating')
                ? '💣💥'
                : activeRecipe.icon}
            </span>
            <span className="text-[11px] font-black tracking-wider mt-0.5">
              {gameStateRef.current.overloadCores.some((c) => !c.finished && c.phase !== 'detonating')
                ? '¡DETONAR!'
                : activeRecipe.id === 'fire_shot'
                ? 'CANALIZAR'
                : activeRecipe.id === 'ice_shard'
                ? 'CANALIZAR'
                : activeRecipe.id === 'ice_lance'
                ? (chargeVisualRatio >= 1.0 ? '¡GLACIAL +50%! ❄️' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO ❄️' : 'GLACIAL ❄️❄️')
                : activeRecipe.id === 'earth_megalith'
                ? (chargeVisualRatio >= 1.0 ? '¡PUÑO +50%! 🌍' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO 🌍' : 'PUÑO 🌍🌍')
                : activeRecipe.id === 'fire_inferno'
                ? (chargeVisualRatio >= 1.0 ? '¡CORONA+!' : 'CORONA 🔥')
                : activeRecipe.id === 'lightning_storm'
                ? (chargeVisualRatio >= 1.0 ? '¡VOLTAICA +50%! ⚡' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO ⚡' : 'VOLTAICA ⚡⚡')
                : activeRecipe.id === 'cryo_storm'
                ? (chargeVisualRatio >= 1.0 ? '¡CRÍO +50%! ❄️⚡' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO ❄️⚡' : 'RAYO CRÍO ❄️⚡')
                : activeRecipe.id === 'magma_eruption'
                ? (chargeVisualRatio >= 1.0 ? '¡VOLCÁNICO +50%! 🌋🔥' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO 🌋' : 'BOMBARDEO 🌋🔥')
                : activeRecipe.id === 'thermal_shock'
                ? (chargeVisualRatio >= 1.0 ? '¡VÓRTICE +50%! ♨️💥' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO ♨️' : 'VÓRTICE ♨️💥')
                : activeRecipe.id === 'crystal_field'
                ? (chargeVisualRatio >= 1.0 ? '¡JAULA +50%! ⚡🏛️' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO ⚡🏛️' : 'JAULA ⚡🏛️')
                : activeRecipe.id === 'permafrost_prison'
                ? (chargeVisualRatio >= 1.0 ? '¡PRISIÓN +50%! ❄️🌍' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO ❄️🌍' : 'PRISIÓN ❄️🌍')
                : activeRecipe.id === 'explosive_overload'
                ? (chargeVisualRatio >= 1.0 ? '¡TORNADO +50%! 🌪️⚡' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO 🌪️⚡' : 'TORNADO 🌪️⚡')
                : activeRecipe.id === 'hell_rain'
                ? (chargeVisualRatio >= 1.0 ? '¡FURIA CÓSMICA +50%! ☄️🔥' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO ☄️🔥' : 'LLUVIA INFIERNO ☄️🔥')
                : activeRecipe.id === 'celestial_storm'
                ? (chargeVisualRatio >= 1.0 ? '¡FURIA TEMPESTAD +50%! ⚡🌩️' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO ⚡🌩️' : 'TORMENTA ⚡⚡⚡')
                : activeRecipe.id === 'devastating_glacier'
                ? (chargeVisualRatio >= 1.0 ? '¡ERA DE HIELO +50%! 🏔️❄️' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO 🏔️❄️' : 'GLACIAR ❄️❄️❄️')
                : activeRecipe.id === 'telluric_barrier'
                ? (chargeVisualRatio >= 1.0 ? '¡DENSIDAD TELÚRICA +50%! 🛡️🌍' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO 🌍' : 'BARRERA 🌍🌍🌍')
                : activeRecipe.id === 'obsidian_volcano'
                ? (chargeVisualRatio >= 1.0 ? '¡FUSIÓN VÍTREA +50%! 🌋🖤' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO 🌋' : 'VOLCÁN 🌋🖤')
                : activeRecipe.id === 'conductive_prison'
                ? (chargeVisualRatio >= 1.0 ? '¡SOBRECARGA CRIOCONDUCTORA +50%! ⚡❄️' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO ⚡' : 'PRISIÓN ⚡❄️🏛️')
                : activeRecipe.id === 'overload_core'
                ? (chargeVisualRatio >= 1.0 ? '¡MASA INESTABLE +50%! 💣⚡' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO 💣⚡' : 'NÚCLEO 💣⚡🌋')
                : activeRecipe.id === 'glacial_plasma_storm'
                ? (chargeVisualRatio >= 1.0 ? '¡SOBRECARGA TRI-ELEMENTAL +50%! 🌪️❄️⚡' : isChargingUi && chargeVisualRatio > 0.08 ? 'CARGANDO 🌪️❄️⚡' : 'TORMENTA 🌪️❄️⚡')
                : activeRecipe.id === 'elemental_cataclysm'
                ? (chargeVisualRatio >= 1.0 ? '¡SINTONÍA PRIMORDIAL +50%! 🪐✨' : isChargingUi && chargeVisualRatio > 0.08 ? 'SINTONIZANDO 🪐' : 'CATACLISMO 🪐✨')
                : chargeVisualRatio >= 1.0
                ? '¡CARGADO!'
                : 'LANZAR'}
            </span>
            {isChargingUi && chargeVisualRatio < 1.0 && (
              <div className="w-12 bg-black/50 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    activeRecipe.id === 'lightning_storm'
                      ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]'
                      : activeRecipe.id === 'ice_lance'
                      ? 'bg-cyan-300 shadow-[0_0_8px_#06b6d4]'
                      : activeRecipe.id === 'earth_megalith'
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : activeRecipe.id === 'cryo_storm'
                      ? 'bg-gradient-to-r from-cyan-400 to-purple-400 shadow-[0_0_8px_#00f0ff]'
                      : activeRecipe.id === 'magma_eruption'
                      ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 shadow-[0_0_8px_#ff6d00]'
                      : activeRecipe.id === 'thermal_shock'
                      ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-cyan-400 shadow-[0_0_8px_#f43f5e]'
                      : activeRecipe.id === 'crystal_field'
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 shadow-[0_0_8px_#eab308]'
                      : activeRecipe.id === 'permafrost_prison'
                      ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-slate-400 shadow-[0_0_8px_#00e5ff]'
                      : activeRecipe.id === 'explosive_overload'
                      ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400 shadow-[0_0_8px_#00e5ff]'
                      : activeRecipe.id === 'hell_rain'
                      ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 shadow-[0_0_8px_#ff3d00]'
                      : activeRecipe.id === 'celestial_storm'
                      ? 'bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-500 shadow-[0_0_8px_#00f0ff]'
                      : activeRecipe.id === 'devastating_glacier'
                      ? 'bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-500 shadow-[0_0_8px_#00e5ff]'
                      : activeRecipe.id === 'telluric_barrier'
                      ? 'bg-gradient-to-r from-amber-600 via-yellow-400 to-stone-600 shadow-[0_0_8px_#f59e0b]'
                      : activeRecipe.id === 'obsidian_volcano'
                      ? 'bg-gradient-to-r from-orange-600 via-fuchsia-500 to-cyan-300 shadow-[0_0_8px_#c026d3]'
                      : activeRecipe.id === 'conductive_prison'
                      ? 'bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 shadow-[0_0_8px_#7c4dff]'
                      : activeRecipe.id === 'overload_core'
                      ? 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-300 shadow-[0_0_8px_#ffd600]'
                      : activeRecipe.id === 'glacial_plasma_storm'
                      ? 'bg-gradient-to-r from-cyan-400 via-indigo-500 to-orange-500 shadow-[0_0_8px_#00e5ff]'
                      : activeRecipe.id === 'elemental_cataclysm'
                      ? 'bg-gradient-to-r from-red-600 via-amber-500 via-cyan-400 to-purple-600 shadow-[0_0_12px_#ec4899]'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${chargeVisualRatio * 100}%` }}
                />
              </div>
            )}
          </button>
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
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121422] border-2 border-amber-500 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <Award className="w-14 h-14 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-black text-amber-300">¡GRAN VICTORIA TOTAL!</h3>
            <p className="text-xs text-slate-300">
              Has atravesado todas las salas y derrotado al Guardián de Basalto, al Espectro de la Tormenta y al Dragón de Obsidiana.
            </p>
            <div className="bg-[#1a1c30] p-3 rounded-2xl border border-slate-700 flex justify-around text-xs">
              <div>
                <div className="font-bold text-cyan-400">+{floor.enemy.expReward * 2} EXP</div>
                <div className="text-[10px] text-slate-400">Experiencia</div>
              </div>
              <div>
                <div className="font-bold text-amber-400">+{floor.enemy.goldReward * 2} Oro</div>
                <div className="text-[10px] text-slate-400">Recompensa</div>
              </div>
            </div>
            <button
              onClick={onExit}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:brightness-110 active:scale-95 transition"
            >
              VOLVER AL DIARIO
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DERROTA */}
      {isDefeated && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121422] border-2 border-rose-500 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <ShieldAlert className="w-14 h-14 text-rose-400 mx-auto animate-pulse" />
            <h3 className="text-xl font-black text-rose-400">¡HÉROE CAÍDO!</h3>
            <p className="text-xs text-slate-300">
              Has caído en combate en <b>{currentRoom.title}</b>.
            </p>
            <p className="text-[11px] text-amber-300">
              Consejo: Usa <b>Hielo + Tierra</b> para atrapar a los enemigos en estacas y luego rómpelas con Fuego o Tierra para provocar metralla.
            </p>
            <button
              onClick={onExit}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl text-sm border border-slate-600 transition"
            >
              REGRESAR A LA CIUDAD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
