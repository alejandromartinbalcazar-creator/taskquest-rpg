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

  // Selección de elemento
  const handleSelectElement = useCallback(
    (el: ElementType) => {
      if (isDefeated || isVictorious) return;
      elementalSound.playElementSelect(el);

      setElementQueue((prev) => {
        if (prev.length >= 4) {
          return [...prev.slice(1), el];
        }
        return [...prev, el];
      });
    },
    [isDefeated, isVictorious]
  );

  const handleClearQueue = useCallback(() => {
    setElementQueue([]);
  }, []);

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

  // Lanzamiento de Hechizo
  const handleAttack = useCallback(() => {
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

    // COMPORTAMIENTOS ESPECÍFICOS Y FÍSICOS DE LAS HABILIDADES:

    // 0. RAYO PURO / TORMENTA DE RAYOS (DESCARGA ELÉCTRICA INSTANTÁNEA, RAMIFICADA Y EN CADENA)
    if (recipe.id === 'lightning_bolt' || recipe.id === 'lightning_storm') {
      const isStorm = recipe.id === 'lightning_storm';
      g.screenShake = isStorm ? 9 : 5;
      elementalSound.playLightningBolt();

      const startX = wizard.x + Math.cos(aimAngle) * 22;
      const startY = wizard.y + Math.sin(aimAngle) * 22;

      // Si no hay enemigo en rango, la descarga viaja a máxima distancia en la dirección apuntada
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

      // Buscar si algún enemigo fue alcanzado directamente por el rayo
      let struckEnemy: GameEnemy | null = null;
      let minEnemyDist = Infinity;
      for (const enemy of g.enemyManager.enemies) {
        const dist = Math.hypot(enemy.x - hitTargetX, enemy.y - hitTargetY);
        if (dist <= enemy.radius + 32 && dist < minEnemyDist) {
          minEnemyDist = dist;
          struckEnemy = enemy;
        }
      }

      const statBonus = Math.floor(player.stats.attack * 0.45 + player.stats.knowledge * 0.45);
      const baseDmg = (recipe.damage + statBonus) * (isStorm ? 1.35 : 1.0);

      if (struckEnemy) {
        struckEnemy.hp -= baseDmg;
        struckEnemy.hitFlash = 12;
        struckEnemy.stunnedTimer = isStorm ? 45 : 30; // Interrupción inmediata de sus ataques
        g.enemyManager.applyStatus(struckEnemy, 'shocked', 150);

        // Retroceso físico instantáneo
        const knock = (recipe.knockback || 1.5) * 3.5;
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

        // Chispas de alta energía en el punto de impacto
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

        // CADENA DE RAYOS (Chain Lightning a enemigos cercanos)
        const maxChains = isStorm ? 4 : 2;
        let chainsCount = 0;
        for (const other of g.enemyManager.enemies) {
          if (other.id === struckEnemy.id) continue;
          const chainDist = Math.hypot(other.x - struckEnemy.x, other.y - struckEnemy.y);
          if (chainDist < 210 && chainsCount < maxChains) {
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
            other.stunnedTimer = 25;
            g.enemyManager.applyStatus(other, 'shocked', 130);

            // Empuje leve por la descarga en cadena
            const chainAngle = Math.atan2(other.y - struckEnemy.y, other.x - struckEnemy.x);
            other.x += Math.cos(chainAngle) * 3;
            other.y += Math.sin(chainAngle) * 3;

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

            // Chispas en el enemigo secundario
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
        // Chispas al golpear muro o suelo
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

      // Romper o dañar obstáculos cercanos (cajas, estacas de permafrost, cristales)
      g.terrainManager.obstacles.forEach((obs) => {
        const d = Math.hypot(obs.x - hitTargetX, obs.y - hitTargetY);
        if (d <= obs.radius + 25) {
          obs.hp -= baseDmg;
        }
      });

      // Destello en la punta del báculo
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
    // 1. HIELO + TIERRA (PRISIÓN DE PERMAFROST REDISEÑADA COMO ATAQUE OFENSIVO Y TÁCTICO)
    else if (recipe.id === 'permafrost_prison') {
      g.screenShake = 6;
      elementalSound.playPermafrostPrison();

      // Hace brotar estacas de roca y hielo directamente bajo la zona enemiga
      g.terrainManager.spawnPermafrostSpikes(targetX, targetY, 3);
      g.terrainManager.spawnFrostPatch(targetX, targetY, 45);

      // Daño físico directo y congelación a los enemigos alcanzados por las estacas
      g.enemyManager.enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - targetX, enemy.y - targetY);
        if (dist < 65) {
          enemy.hp -= recipe.damage;
          enemy.hitFlash = 10;
          g.enemyManager.applyStatus(enemy, 'frozen', 140);
          g.floatingTexts.push({
            id: `spike-hit-${now}`,
            x: enemy.x,
            y: enemy.y - 18,
            text: `🧊 -${recipe.damage} [CONGELADO]`,
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
      g.screenShake = 6;
      g.projectiles.push({
        id: `proj-${now}`,
        x: wizard.x,
        y: wizard.y,
        vx: Math.cos(aimAngle) * 8.0,
        vy: Math.sin(aimAngle) * 8.0,
        radius: 12,
        color: recipe.color,
        secondaryColor: recipe.secondaryColor,
        damage: recipe.damage,
        knockback: recipe.knockback,
        life: 45,
        maxLife: 45,
        pierce: 1,
        piercedIds: [],
        isHostile: false,
        spellType: 'thermal_shock',
        visualShape: 'thermal_core',
        onHitSpawn: 'steam_blast',
      });
    }
    // 3. FUEGO + TIERRA (ERUPCIÓN DE MAGMA)
    else if (recipe.id === 'magma_eruption') {
      g.screenShake = 6;
      g.projectiles.push({
        id: `proj-${now}`,
        x: wizard.x,
        y: wizard.y,
        vx: Math.cos(aimAngle) * 5.8,
        vy: Math.sin(aimAngle) * 5.8,
        radius: 15,
        color: recipe.color,
        secondaryColor: recipe.secondaryColor,
        damage: recipe.damage,
        knockback: recipe.knockback,
        life: 50,
        maxLife: 50,
        pierce: 1,
        piercedIds: [],
        isHostile: false,
        spellType: 'magma_eruption',
        visualShape: 'magma_rock',
        onHitSpawn: 'magma_fissure',
      });
    }
    // 4. RAYO + TIERRA (CAMPO DE CRISTALES ENERGIZADOS)
    else if (recipe.id === 'crystal_field') {
      const spawnX = wizard.x + Math.cos(aimAngle) * 95;
      const spawnY = wizard.y + Math.sin(aimAngle) * 95;
      g.terrainManager.spawnEnergizedCrystals(spawnX, spawnY);
      g.screenShake = 5;
    }
    // 5. HIELO + RAYO (TORMENTA CRIOGÉNICA)
    else if (recipe.id === 'cryo_storm') {
      g.screenShake = 5;
      g.projectiles.push({
        id: `proj-${now}`,
        x: wizard.x,
        y: wizard.y,
        vx: Math.cos(aimAngle) * 9.0,
        vy: Math.sin(aimAngle) * 9.0,
        radius: 11,
        color: recipe.color,
        secondaryColor: '#fef08a',
        damage: recipe.damage,
        knockback: recipe.knockback,
        life: 45,
        maxLife: 45,
        pierce: 2,
        piercedIds: [],
        isHostile: false,
        spellType: 'cryo_storm',
        visualShape: 'cryo_shard',
        statusToApply: 'frozen',
      });
    }
    // 6. FUEGO + RAYO (SOBRECARGA EXPLOSIVA)
    else if (recipe.id === 'explosive_overload') {
      g.screenShake = 8;
      g.projectiles.push({
        id: `proj-${now}`,
        x: wizard.x,
        y: wizard.y,
        vx: Math.cos(aimAngle) * 10.5,
        vy: Math.sin(aimAngle) * 10.5,
        radius: 12,
        color: recipe.color,
        secondaryColor: '#ffffff',
        damage: recipe.damage,
        knockback: recipe.knockback,
        life: 40,
        maxLife: 40,
        pierce: 1,
        piercedIds: [],
        isHostile: false,
        spellType: 'explosive_overload',
        visualShape: 'plasma_sphere',
      });
    }
    // 7. CATACLISMO ELEMENTAL (4 ELEMENTOS)
    else if (recipe.id === 'elemental_cataclysm') {
      g.screenShake = 18;
      for (let i = 0; i < 12; i++) {
        const ang = (Math.PI * 2 / 12) * i;
        g.projectiles.push({
          id: `cataclysm-${now}-${i}`,
          x: wizard.x,
          y: wizard.y,
          vx: Math.cos(ang) * 7.5,
          vy: Math.sin(ang) * 7.5,
          radius: 14,
          color: i % 2 === 0 ? '#ec4899' : '#facc15',
          secondaryColor: '#ffffff',
          damage: 120,
          knockback: 9.0,
          life: 55,
          maxLife: 55,
          pierce: 3,
          piercedIds: [],
          isHostile: false,
          spellType: 'elemental_cataclysm',
        });
      }
      g.terrainManager.spawnMagmaFissure(wizard.x, wizard.y, 80);
    }
    // ATAQUES INDIVIDUALES CON SILUETAS FÍSICAS RECONOCIBLES:
    else {
      let visualShape: 'fire_comet' | 'ice_lance' | 'earth_boulder' | undefined;
      let statusToApply: 'frozen' | 'burning' | 'shocked' | undefined;
      let pierce = 1;
      let speed = 7.0;

      if (recipe.id === 'fire_shot' || recipe.id === 'fire_inferno') {
        visualShape = 'fire_comet';
        statusToApply = 'burning';
        speed = 7.5;
      } else if (recipe.id === 'ice_shard' || recipe.id === 'ice_lance') {
        visualShape = 'ice_lance';
        statusToApply = 'frozen';
        speed = 8.5;
        pierce = recipe.id === 'ice_lance' ? 3 : 1;
      } else if (recipe.id === 'earth_toss' || recipe.id === 'earth_megalith') {
        visualShape = 'earth_boulder';
        speed = 5.8; // Megalito pesado con inercia aplastante
        pierce = recipe.id === 'earth_megalith' ? 2 : 1;
      }

      g.projectiles.push({
        id: `proj-${now}`,
        x: wizard.x,
        y: wizard.y,
        vx: Math.cos(aimAngle) * speed,
        vy: Math.sin(aimAngle) * speed,
        radius: visualShape === 'earth_boulder' ? 14 : 9,
        color: recipe.color,
        secondaryColor: recipe.secondaryColor,
        damage: recipe.damage + Math.floor(player.stats.attack * 0.4 + player.stats.knowledge * 0.4),
        knockback: recipe.knockback,
        life: 50,
        maxLife: 50,
        pierce,
        piercedIds: [],
        isHostile: false,
        spellType: recipe.id,
        visualShape,
        statusToApply,
      });
    }

    setElementQueue([]);
  }, [activeRecipe, isDefeated, isVictorious, player.stats]);

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

      // 1. Movimiento del Mago
      if (g.joystick.active && (g.joystick.vx !== 0 || g.joystick.vy !== 0)) {
        wizard.x += g.joystick.vx;
        wizard.y += g.joystick.vy;
        wizard.animFrame += 0.2;
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
          g.projectiles.splice(pIdx, 1);
          continue;
        }

        // Si es proyectil enemigo -> Daña al jugador
        if (p.isHostile) {
          if (checkCircleCollision(p.x, p.y, p.radius, wizard.x, wizard.y, wizard.radius)) {
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
                finalDamage *= 0.35; // Absorbe 65% de daño si no está aturdido
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
        if (pt.life <= 0) {
          g.particles.splice(i, 1);
        }
      }
      if (g.particles.length > 50) {
        g.particles.splice(0, g.particles.length - 50);
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
    return () => cancelAnimationFrame(animId);
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
                handleSelectElement('earth');
              }}
              className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-600 to-stone-800 active:scale-95 border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] flex flex-col items-center justify-center text-white"
            >
              <span className="text-xl">🌍</span>
              <span className="text-[9px] font-black tracking-wider">TIERRA</span>
            </button>
          </div>

          {/* BOTÓN PRINCIPAL DE ATAQUE / LANZAR */}
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              handleAttack();
            }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 active:scale-90 border-2 border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.7)] flex flex-col items-center justify-center text-white transition-transform"
          >
            <span className="text-2xl">{activeRecipe.icon}</span>
            <span className="text-[11px] font-black tracking-wider mt-0.5">LANZAR</span>
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
