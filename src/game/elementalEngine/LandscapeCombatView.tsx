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
} from './types';
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
    title: 'Sala 1: Atrio de Entrada',
    subtitle: 'Practica tus 4 elementos y destruye las cajas para avanzar.',
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
    lastVoltaicHumTime: 0,
    lastCryoHumTime: 0,
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

  // Inicializar Sala 1 al montar
  useEffect(() => {
    const g = gameStateRef.current;
    g.roomIndex = 0;
    g.roomCleared = false;
    g.wizard.x = 550;
    g.wizard.y = 560;
    g.terrainManager.setupRoomTerrain(DUNGEON_ROOMS[0].roomType);
    g.enemyManager.spawnRoomEnemies(DUNGEON_ROOMS[0].roomType);
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
      // Posiciona al mago en la entrada sur de la nueva sala
      g.wizard.x = 550;
      g.wizard.y = 600;
      g.camera.x = 550;
      g.camera.y = 600;
      g.projectiles = [];
      g.infernalCrowns = [];
      g.voltaicChains = [];
      g.glacialEruptions = [];
      g.tectonicFists = [];
      g.cryoBeams = [];

      const nextRoom = DUNGEON_ROOMS[nextIndex];
      g.terrainManager.setupRoomTerrain(nextRoom.roomType);
      g.enemyManager.spawnRoomEnemies(nextRoom.roomType);

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
      else if (recipe.id === 'thermal_shock') elementalSound.playThermalShock();
      else if (recipe.id === 'magma_eruption') elementalSound.playMagmaEruption();
      else if (recipe.id === 'crystal_field') elementalSound.playCrystalField();
      else if (recipe.id === 'cryo_storm') {
        // Rayo Criogénico gestiona su propio sonido de disparo / sobrecarga
      }
      else if (recipe.id === 'permafrost_prison') elementalSound.playPermafrostPrison();
      else if (recipe.id === 'explosive_overload' || recipe.id === 'overload_core') elementalSound.playExplosiveOverload();
      else if (recipe.id === 'elemental_cataclysm') elementalSound.playCataclysm();
      else elementalSound.playFireShot();

      // Cálculo de dirección de apuntado (Manual para Erupción Glacial / Puño Tectónico con auto-bloqueo)
      let aimAngle = wizard.facingAngle;
      let closestDist = 420;
      let targetX = wizard.x + Math.cos(aimAngle) * 110;
      let targetY = wizard.y + Math.sin(aimAngle) * 110;

      if (recipe.id === 'ice_lance' || recipe.id === 'cryo_storm') {
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
        }
        targetX = wizard.x + Math.cos(aimAngle) * 260;
        targetY = wizard.y + Math.sin(aimAngle) * 260;
      } else if (recipe.id === 'earth_megalith') {
        // Apuntado de Puño Tectónico: Bloqueo de zona al enemigo prioritario dentro del alcance, o puntería manual
        if (attackAimRef.current.isAiming) {
          const adx = attackAimRef.current.currX - attackAimRef.current.startX;
          const ady = attackAimRef.current.currY - attackAimRef.current.startY;
          if (Math.hypot(adx, ady) > 7) {
            aimAngle = Math.atan2(ady, adx);
            targetX = wizard.x + Math.cos(aimAngle) * 220;
            targetY = wizard.y + Math.sin(aimAngle) * 220 * 0.58;
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
      // 1. HIELO + TIERRA (PRISIÓN DE PERMAFROST: ESTACAS TÁCTICAS + CONGELACIÓN)
      else if (recipe.id === 'permafrost_prison') {
        g.screenShake = isCharged ? 9 : 6;
        elementalSound.playPermafrostPrison();

        const spikeCount = isCharged ? 5 : 3;
        g.terrainManager.spawnPermafrostSpikes(targetX, targetY, spikeCount);
        g.terrainManager.spawnFrostPatch(targetX, targetY, isCharged ? 65 : 45);

        const prisonDmg = recipe.damage * chargeMultiplier;
        g.enemyManager.enemies.forEach((enemy) => {
          const dist = Math.hypot(enemy.x - targetX, enemy.y - targetY);
          if (dist < (isCharged ? 85 : 65)) {
            enemy.hp -= prisonDmg;
            enemy.hitFlash = 10;
            g.enemyManager.applyStatus(enemy, 'frozen', 150);
            g.floatingTexts.push({
              id: `spike-hit-${now}-${enemy.id}`,
              x: enemy.x,
              y: enemy.y - 18,
              text: `🧊 -${Math.round(prisonDmg)} [CONGELADO]`,
              color: '#38bdf8',
              fontSize: 13,
              opacity: 1,
              vy: -1.3,
              life: 35,
            });
          }
        });
      }
      // 2. FUEGO + HIELO (CHOQUE TÉRMICO)
      else if (recipe.id === 'thermal_shock') {
        g.screenShake = isCharged ? 9 : 6;
        g.projectiles.push({
          id: `proj-${now}`,
          x: wizard.x,
          y: wizard.y,
          vx: Math.cos(aimAngle) * 8.0,
          vy: Math.sin(aimAngle) * 8.0,
          radius: isCharged ? 16 : 12,
          color: recipe.color,
          secondaryColor: recipe.secondaryColor,
          damage: recipe.damage * chargeMultiplier,
          knockback: recipe.knockback * (isCharged ? 1.4 : 1.0),
          life: 45,
          maxLife: 45,
          pierce: 1,
          piercedIds: [],
          isHostile: false,
          spellType: 'thermal_shock',
          visualShape: 'thermal_core',
          onHitSpawn: 'steam_blast',
          areaOfEffect: isCharged ? 90 : 65,
        });
      }
      // 3. FUEGO + TIERRA (ERUPCIÓN DE MAGMA)
      else if (recipe.id === 'magma_eruption') {
        g.screenShake = isCharged ? 9 : 6;
        g.projectiles.push({
          id: `proj-${now}`,
          x: wizard.x,
          y: wizard.y,
          vx: Math.cos(aimAngle) * 5.8,
          vy: Math.sin(aimAngle) * 5.8,
          radius: isCharged ? 18 : 15,
          color: recipe.color,
          secondaryColor: recipe.secondaryColor,
          damage: recipe.damage * chargeMultiplier,
          knockback: recipe.knockback * (isCharged ? 1.4 : 1.0),
          life: 50,
          maxLife: 50,
          pierce: 1,
          piercedIds: [],
          isHostile: false,
          spellType: 'magma_eruption',
          visualShape: 'magma_rock',
          onHitSpawn: 'magma_fissure',
          areaOfEffect: isCharged ? 80 : 60,
        });
      }
      // 4. RAYO + TIERRA (CAMPO DE CRISTALES ENERGIZADOS)
      else if (recipe.id === 'crystal_field') {
        const spawnX = wizard.x + Math.cos(aimAngle) * 95;
        const spawnY = wizard.y + Math.sin(aimAngle) * 95;
        g.terrainManager.spawnEnergizedCrystals(spawnX, spawnY);
        if (isCharged) {
          g.terrainManager.obstacles.push({
            id: `crystal-${now}-charged`,
            x: spawnX,
            y: spawnY - 35,
            radius: 15,
            width: 30,
            height: 30,
            obstacleType: 'energized_crystal',
            hp: 90,
            maxHp: 90,
            color: '#eab308',
            solid: true,
            blocksProjectiles: false,
            meltable: false,
            electrified: true,
            chargeTimer: 0,
          });
        }
        g.screenShake = isCharged ? 8 : 5;
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
      // 6. FUEGO + RAYO (SOBRECARGA EXPLOSIVA)
      else if (recipe.id === 'explosive_overload') {
        g.screenShake = isCharged ? 12 : 8;
        g.projectiles.push({
          id: `proj-${now}`,
          x: wizard.x,
          y: wizard.y,
          vx: Math.cos(aimAngle) * 11.0,
          vy: Math.sin(aimAngle) * 11.0,
          radius: isCharged ? 16 : 12,
          color: recipe.color,
          secondaryColor: '#ffffff',
          damage: recipe.damage * chargeMultiplier,
          knockback: recipe.knockback * (isCharged ? 1.5 : 1.0),
          life: 40,
          maxLife: 40,
          pierce: 1,
          piercedIds: [],
          isHostile: false,
          spellType: 'explosive_overload',
          visualShape: 'plasma_sphere',
          areaOfEffect: isCharged ? 105 : 80,
        });
      }
      // 7. CATACLISMO ELEMENTAL (4 ELEMENTOS)
      else if (recipe.id === 'elemental_cataclysm') {
        g.screenShake = 20;
        const count = isCharged ? 16 : 12;
        for (let i = 0; i < count; i++) {
          const ang = ((Math.PI * 2) / count) * i;
          g.projectiles.push({
            id: `cataclysm-${now}-${i}`,
            x: wizard.x,
            y: wizard.y,
            vx: Math.cos(ang) * 7.5,
            vy: Math.sin(ang) * 7.5,
            radius: 14,
            color: i % 2 === 0 ? '#ec4899' : '#facc15',
            secondaryColor: '#ffffff',
            damage: 120 * chargeMultiplier,
            knockback: 9.0,
            life: 55,
            maxLife: 55,
            pierce: 3,
            piercedIds: [],
            isHostile: false,
            spellType: 'elemental_cataclysm',
            areaOfEffect: 55,
          });
        }
        g.terrainManager.spawnMagmaFissure(wizard.x, wizard.y, 85);
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
    wizard.chargeType = activeRecipe.id === 'cryo_storm'
      ? 'cryo'
      : (activeRecipe.id === 'lightning_storm' || activeRecipe.elements.includes('lightning')
        ? 'lightning'
        : (activeRecipe.id === 'ice_lance' || activeRecipe.elements.includes('ice')
          ? 'ice'
          : (activeRecipe.id === 'earth_megalith' || activeRecipe.elements.includes('earth')
            ? 'earth'
            : (activeRecipe.elements.includes('fire') ? 'fire' : 'arcane'))));
    wizard.chargeSoundPlayed = false;
    setIsChargingUi(true);
    if (activeRecipe.id !== 'lightning_storm') {
      elementalSound.playChargeStart();
    }
  }, [activeRecipe.elements, activeRecipe.id, isDefeated, isVictorious, startChanneledAttack]);

  const finishCharge = useCallback(() => {
    const wizard = gameStateRef.current.wizard;
    if (wizard.channeledStream.active) {
      stopChanneledAttack();
      return;
    }
    if (!wizard.isCharging) return;
    const elapsed = Date.now() - (wizard.chargeStartTime || 0);
    const wasCharged = activeRecipe.id === 'cryo_storm'
      ? (elapsed >= 450 || wizard.chargeRatio >= 0.95)
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
      const frameNow = performance.now();
      const dt = Math.min(50, Math.max(1, frameNow - lastFrameTimestamp));
      lastFrameTimestamp = frameNow;

      const g = gameStateRef.current;
      const wizard = g.wizard;
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
        const maxChargeTime = isCryo ? 450 : (isVoltaic ? 1800 : (isGlacial ? 1400 : (isTectonic ? 1400 : 380)));
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

      // Restricción de límites de la sala
      wizard.x = Math.max(90, Math.min(1010, wizard.x));
      wizard.y = Math.max(90, Math.min(670, wizard.y));

      // Colisión con obstáculos sólidos
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

      // SEGUIMIENTO DE CÁMARA CERCANA (con anticipación hacia la dirección del mago)
      const leadX = Math.cos(wizard.facingAngle) * 35;
      const leadY = Math.sin(wizard.facingAngle) * 25;
      g.camera.x += (wizard.x + leadX - g.camera.x) * 0.12;
      g.camera.y += (wizard.y + leadY - g.camera.y) * 0.12;

      // Mantener cámara dentro de los límites del escenario
      g.camera.x = Math.max(340, Math.min(760, g.camera.x));
      g.camera.y = Math.max(260, Math.min(520, g.camera.y));

      if (g.screenShake > 0) g.screenShake *= 0.88;
      if (wizard.hitFlash > 0) wizard.hitFlash--;

      // 2. Actualizar Obstáculos y Zonas de Terreno
      g.terrainManager.update(enemies, g.floatingTexts, g.particles, g.projectiles, dt);

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
            g.cryoBeams
          );
        }
      }

      if (!isDefeated && !isVictorious) {
        animId = requestAnimationFrame(gameLoop);
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
                    : 'border-amber-300 shadow-[0_0_25px_rgba(250,204,21,0.9)] animate-pulse')
                : (activeRecipe.id === 'lightning_storm'
                    ? 'border-cyan-400 shadow-[0_0_18px_rgba(56,189,248,0.6)]'
                    : activeRecipe.id === 'ice_lance'
                    ? 'border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.6)]'
                    : activeRecipe.id === 'earth_megalith'
                    ? 'border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.6)]'
                    : activeRecipe.id === 'cryo_storm'
                    ? 'border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.7)]'
                    : 'border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.7)]')
            } flex flex-col items-center justify-center text-white transition-all`}
          >
            <span className="text-2xl">{activeRecipe.icon}</span>
            <span className="text-[11px] font-black tracking-wider mt-0.5">
              {activeRecipe.id === 'fire_shot'
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
