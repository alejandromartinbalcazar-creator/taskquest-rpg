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
    (isCharged: boolean = false) => {
      if (isDefeated || isVictorious) return;
      const now = Date.now();
      const g = gameStateRef.current;

      if (now - g.lastAttackTime < activeRecipe.cooldownMs) return;
      g.lastAttackTime = now;

      const wizard = g.wizard;
      const recipe = activeRecipe;

      // Reproducir sonido característico de cada hechizo
      if (recipe.id === 'basic_spark') elementalSound.playBasicSpark();
      else if (recipe.id === 'fire_shot' || recipe.id === 'fire_inferno') elementalSound.playFireShot();
      else if (recipe.id === 'lightning_bolt' || recipe.id === 'lightning_storm') elementalSound.playLightningBolt();
      else if (recipe.id === 'ice_shard' || recipe.id === 'ice_lance') elementalSound.playIceShard();
      else if (recipe.id === 'earth_toss' || recipe.id === 'earth_megalith') elementalSound.playEarthToss();
      else if (recipe.id === 'thermal_shock') elementalSound.playThermalShock();
      else if (recipe.id === 'magma_eruption') elementalSound.playMagmaEruption();
      else if (recipe.id === 'crystal_field') elementalSound.playCrystalField();
      else if (recipe.id === 'cryo_storm') elementalSound.playCryoStorm();
      else if (recipe.id === 'permafrost_prison') elementalSound.playPermafrostPrison();
      else if (recipe.id === 'explosive_overload' || recipe.id === 'overload_core') elementalSound.playExplosiveOverload();
      else if (recipe.id === 'elemental_cataclysm') elementalSound.playCataclysm();
      else elementalSound.playFireShot();

      // Auto-apuntar al enemigo más cercano o disparar hacia la dirección del mago
      let aimAngle = wizard.facingAngle;
      let closestDist = 420;
      let targetX = wizard.x + Math.cos(aimAngle) * 110;
      let targetY = wizard.y + Math.sin(aimAngle) * 110;

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

      // 0. RAYO (DESCARGA ELÉCTRICA INSTANTÁNEA, RAMIFICADA Y EN CADENA)
      if (recipe.id === 'lightning_bolt' || recipe.id === 'lightning_storm') {
        const isStorm = recipe.id === 'lightning_storm';
        g.screenShake = (isStorm ? 9 : 5) * (isCharged ? 1.5 : 1.0);
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

        const baseDmg = (recipe.damage + statBonus) * (isStorm ? 1.35 : 1.0) * chargeMultiplier;

        if (struckEnemy) {
          struckEnemy.hp -= baseDmg;
          struckEnemy.hitFlash = 12;
          struckEnemy.stunnedTimer = isCharged ? 50 : isStorm ? 45 : 30;
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

          const maxChains = isCharged ? 5 : isStorm ? 4 : 2;
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
      // 5. HIELO + RAYO (TORMENTA CRIOGÉNICA)
      else if (recipe.id === 'cryo_storm') {
        g.screenShake = isCharged ? 7 : 5;
        g.projectiles.push({
          id: `proj-${now}`,
          x: wizard.x,
          y: wizard.y,
          vx: Math.cos(aimAngle) * 9.0,
          vy: Math.sin(aimAngle) * 9.0,
          radius: isCharged ? 14 : 11,
          color: recipe.color,
          secondaryColor: '#fef08a',
          damage: recipe.damage * chargeMultiplier,
          knockback: recipe.knockback,
          life: 45,
          maxLife: 45,
          pierce: isCharged ? 3 : 2,
          piercedIds: [],
          isHostile: false,
          spellType: 'cryo_storm',
          visualShape: 'cryo_shard',
          statusToApply: 'frozen',
        });
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
      // ATAQUES INDIVIDUALES:
      else {
        const isFire = recipe.id === 'fire_shot' || recipe.id === 'fire_inferno';
        const isIce = recipe.id === 'ice_shard' || recipe.id === 'ice_lance';
        const isEarth = recipe.id === 'earth_toss' || recipe.id === 'earth_megalith';

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
            pierce: isCharged ? 3 : (recipe.id === 'earth_megalith' ? 2 : 1),
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
    if (activeRecipe.id === 'fire_shot' || activeRecipe.id === 'fire_inferno') {
      startChanneledAttack('fire', 'attack');
      return;
    }
    if (activeRecipe.id === 'ice_shard' || activeRecipe.id === 'ice_lance') {
      startChanneledAttack('ice', 'attack');
      return;
    }
    const wizard = gameStateRef.current.wizard;
    wizard.isCharging = true;
    wizard.chargeStartTime = Date.now();
    wizard.chargeRatio = 0;
    wizard.chargeSoundPlayed = false;
    setIsChargingUi(true);
    elementalSound.playChargeStart();
  }, [activeRecipe.id, isDefeated, isVictorious, startChanneledAttack]);

  const finishCharge = useCallback(() => {
    const wizard = gameStateRef.current.wizard;
    if (wizard.channeledStream.active) {
      stopChanneledAttack();
      return;
    }
    if (!wizard.isCharging) return;
    const wasCharged = wizard.chargeRatio >= 1.0;
    wizard.isCharging = false;
    wizard.chargeRatio = 0;
    setIsChargingUi(false);
    setChargeVisualRatio(0);
    handleAttack(wasCharged);
  }, [handleAttack, stopChanneledAttack]);

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
        const isFire = activeRecipe.id === 'fire_shot' || activeRecipe.id === 'fire_inferno';
        const isIce = activeRecipe.id === 'ice_shard' || activeRecipe.id === 'ice_lance';
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

    const gameLoop = () => {
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
        const elapsed = Date.now() - wizard.chargeStartTime;
        wizard.chargeRatio = Math.min(1.0, elapsed / 380);
        if (wizard.chargeRatio >= 1.0 && !wizard.chargeSoundPlayed) {
          wizard.chargeSoundPlayed = true;
          elementalSound.playChargeReady();
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
      g.terrainManager.update(enemies, g.floatingTexts, g.particles, g.projectiles);

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
            g.enemyManager.currentBoss
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
                ? 'border-amber-300 shadow-[0_0_25px_rgba(250,204,21,0.9)] animate-pulse'
                : 'border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.7)]'
            } flex flex-col items-center justify-center text-white transition-all`}
          >
            <span className="text-2xl">{activeRecipe.icon}</span>
            <span className="text-[11px] font-black tracking-wider mt-0.5">
              {activeRecipe.id === 'fire_shot' || activeRecipe.id === 'fire_inferno'
                ? 'CANALIZAR'
                : activeRecipe.id === 'ice_shard' || activeRecipe.id === 'ice_lance'
                ? 'CANALIZAR'
                : chargeVisualRatio >= 1.0
                ? '¡CARGADO!'
                : 'LANZAR'}
            </span>
            {isChargingUi && chargeVisualRatio < 1.0 && (
              <div className="w-12 bg-black/50 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
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
