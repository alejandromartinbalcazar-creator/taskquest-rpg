import { collectVesselRewards, type VesselReward } from './vessels';
import {
  PhysicalObstacle,
  TerrainZone,
  GameEnemy,
  Projectile,
  ElectricArc,
  FloatingText,
  Particle,
  RoomType,
  RelicReward,
} from './types';
import { elementalSound } from './soundEngine';

// Comprueba colisión circular simple
export function checkCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy <= (r1 + r2) * (r1 + r2);
}

// Resuelve empuje entre un círculo (jugador o enemigo) y un obstáculo sólido
export function resolveCircleObstacleCollision(
  entity: { x: number; y: number; radius: number },
  obs: PhysicalObstacle
): void {
  if (!obs.solid) return;
  // Si es una puerta desbloqueada, permite el paso
  if (obs.obstacleType === 'door_gate' && !obs.doorLocked) return;

  const dx = entity.x - obs.x;
  const dy = entity.y - obs.y;
  const dist = Math.hypot(dx, dy);
  const minDist = entity.radius + obs.radius;

  if (dist > 0 && dist < minDist) {
    const overlap = minDist - dist;
    entity.x += (dx / dist) * overlap;
    entity.y += (dy / dist) * overlap;
  }
}

// Reliquias de recompensa disponibles para las salas de descanso
export const DUNGEON_RELICS: RelicReward[] = [
  {
    id: 'relic-fire-core',
    name: 'Corazón Ígneo',
    description: 'Tus ataques de Fuego dejan pequeñas zonas incandescentes continuas en el suelo.',
    icon: '🔥',
    elementAffinity: 'fire',
    bonusType: 'fire_lingering',
    value: 15,
  },
  {
    id: 'relic-ice-prism',
    name: 'Prisma Criogénico',
    description: 'Los cristales de Hielo se fragmentan en 2 esquirlas adicionales al impactar.',
    icon: '❄️',
    elementAffinity: 'ice',
    bonusType: 'ice_shatter_split',
    value: 2,
  },
  {
    id: 'relic-tesla-coil',
    name: 'Bobina Voltaica',
    description: 'Las descargas de Rayo saltan a 1 enemigo adicional cercano con 80% de potencia.',
    icon: '⚡',
    elementAffinity: 'lightning',
    bonusType: 'lightning_extra_jump',
    value: 1,
  },
  {
    id: 'relic-seismic-plates',
    name: 'Placas Sísmicas',
    description: 'Los impactos de Tierra desprenden metralla de piedra al golpear obstáculos y paredes.',
    icon: '🌍',
    elementAffinity: 'earth',
    bonusType: 'earth_shrapnel',
    value: 4,
  },
  {
    id: 'relic-vital-flask',
    name: 'Frasco de Maná Vital',
    description: 'Aumenta tu salud máxima en +35 HP y restaura toda tu vida inmediatamente.',
    icon: '💖',
    elementAffinity: 'all',
    bonusType: 'max_hp',
    value: 35,
  },
];

// Gestor de Físicas, Terrenos y Salas de la Mazmorra
export class TerrainManager {
  public vesselRewards: VesselReward[] = [];
  public obstacles: PhysicalObstacle[] = [];
  public terrainZones: TerrainZone[] = [];
  public electricArcs: ElectricArc[] = [];

  constructor() {
    this.setupRoomTerrain('entrance');
  }

  // Configura la arquitectura y obstáculos de una sala específica
  public setupRoomTerrain(roomType: RoomType) {
    this.vesselRewards = [];
    this.obstacles = [];
    this.terrainZones = [];
    this.electricArcs = [];

    // 1. SALA DE ENTRADA Y ENTRENAMIENTO
    if (roomType === 'entrance') {
      // Puerta Norte de salida
      this.obstacles.push({
        id: 'door-north',
        x: 550,
        y: 80,
        radius: 36,
        width: 72,
        height: 20,
        obstacleType: 'door_gate',
        hp: 9999,
        maxHp: 9999,
        color: '#facc15',
        solid: true,
        blocksProjectiles: false,
        meltable: false,
        doorLocked: false, // Abierta por ser tutorial
        doorDirection: 'north',
      });

      // Cajas de entrenamiento destruibles
      this.obstacles.push(
        {
          id: 'crate-1',
          x: 420,
          y: 350,
          radius: 18,
          width: 36,
          height: 36,
          obstacleType: 'crate',
          hp: 35,
          maxHp: 35,
          color: '#854d0e',
          solid: true,
          blocksProjectiles: true,
          meltable: false,
        },
        {
          id: 'crate-2',
          x: 680,
          y: 350,
          radius: 18,
          width: 36,
          height: 36,
          obstacleType: 'crate',
          hp: 35,
          maxHp: 35,
          color: '#854d0e',
          solid: true,
          blocksProjectiles: true,
          meltable: false,
        }
      );

      // Pilares de piedra decorativos
      this.spawnRockPillar(320, 260);
      this.spawnRockPillar(780, 260);
    }
    // 2. SALA DE COMBATE ENJAMBRE (SWARM)
    else if (roomType === 'combat_swarm') {
      this.obstacles.push({
        id: 'door-north',
        x: 550,
        y: 80,
        radius: 36,
        width: 72,
        height: 20,
        obstacleType: 'door_gate',
        hp: 9999,
        maxHp: 9999,
        color: '#dc2626',
        solid: true,
        blocksProjectiles: false,
        meltable: false,
        doorLocked: true, // Se bloquea durante el combate
        doorDirection: 'north',
      });

      // Pilares esquineros para kitear y maniobrar
      this.spawnRockPillar(340, 260);
      this.spawnRockPillar(760, 260);
      this.spawnRockPillar(340, 520);
      this.spawnRockPillar(760, 520);
    }
    // 3. SALA DE TRAMPAS Y RIESGOS ELEMENTALES
    else if (roomType === 'hazard_traps') {
      this.obstacles.push({
        id: 'door-north',
        x: 550,
        y: 80,
        radius: 36,
        width: 72,
        height: 20,
        obstacleType: 'door_gate',
        hp: 9999,
        maxHp: 9999,
        color: '#dc2626',
        solid: true,
        blocksProjectiles: false,
        meltable: false,
        doorLocked: true,
        doorDirection: 'north',
      });

      // Muros de hielo que bloquean pasillos laterales
      this.spawnIceWall(380, 360);
      this.spawnIceWall(720, 360);

      // Zonas de escarcha resbaladiza y magma latente
      this.spawnFrostPatch(550, 420, 65);
      this.spawnMagmaFissure(350, 220, 45);
      this.spawnMagmaFissure(750, 220, 45);
    }
    // 4. SALA DE FUEGO CRUZADO (CROSSFIRE)
    else if (roomType === 'crossfire') {
      this.obstacles.push({
        id: 'door-north',
        x: 550,
        y: 80,
        radius: 36,
        width: 72,
        height: 20,
        obstacleType: 'door_gate',
        hp: 9999,
        maxHp: 9999,
        color: '#dc2626',
        solid: true,
        blocksProjectiles: false,
        meltable: false,
        doorLocked: true,
        doorDirection: 'north',
      });

      // Dos barreras centrales sólidas para cubrirse de los proyectiles a distancia
      this.spawnRockPillar(460, 360);
      this.spawnRockPillar(640, 360);
      this.spawnRockPillar(550, 220);
    }
    // 5. SALA DE RELIQUIAS Y DESCANSO (SANCTUARY)
    else if (roomType === 'relic_sanctuary') {
      this.obstacles.push({
        id: 'door-north',
        x: 550,
        y: 80,
        radius: 36,
        width: 72,
        height: 20,
        obstacleType: 'door_gate',
        hp: 9999,
        maxHp: 9999,
        color: '#facc15',
        solid: true,
        blocksProjectiles: false,
        meltable: false,
        doorLocked: false,
        doorDirection: 'north',
      });

      // Gran Cofre de Reliquias en el centro
      this.obstacles.push({
        id: 'relic-chest',
        x: 550,
        y: 380,
        radius: 26,
        width: 52,
        height: 52,
        obstacleType: 'relic_chest',
        hp: 1,
        maxHp: 1,
        color: '#fbbf24',
        solid: true,
        blocksProjectiles: false,
        meltable: false,
        isOpened: false,
        chestReward: DUNGEON_RELICS[Math.floor(Math.random() * DUNGEON_RELICS.length)],
      });
    }
    // 6. ARENA DE JEFE 1: GUARDIÁN DE BASALTO
    else if (roomType === 'boss_basalt') {
      this.obstacles.push({
        id: 'door-north',
        x: 550,
        y: 80,
        radius: 36,
        width: 72,
        height: 20,
        obstacleType: 'door_gate',
        hp: 9999,
        maxHp: 9999,
        color: '#dc2626',
        solid: true,
        blocksProjectiles: false,
        meltable: false,
        doorLocked: true,
        doorDirection: 'north',
      });

      // 4 Pilares pesados fundamentales para hacer chocar y aturdir al Guardián de Basalto
      this.spawnRockPillar(360, 260);
      this.spawnRockPillar(740, 260);
      this.spawnRockPillar(360, 480);
      this.spawnRockPillar(740, 480);
    }
    // 7. ARENA DE JEFE 2: ESPECTRO DE LA TORMENTA
    else if (roomType === 'boss_storm') {
      this.obstacles.push({
        id: 'door-north',
        x: 550,
        y: 80,
        radius: 36,
        width: 72,
        height: 20,
        obstacleType: 'door_gate',
        hp: 9999,
        maxHp: 9999,
        color: '#dc2626',
        solid: true,
        blocksProjectiles: false,
        meltable: false,
        doorLocked: true,
        doorDirection: 'north',
      });

      // Pilones de cuarzo electrificados que cargan la sala
      this.spawnEnergizedCrystals(340, 240);
      this.spawnEnergizedCrystals(760, 240);
      this.spawnEnergizedCrystals(550, 520);
    }
    // 8. ARENA DE JEFE 3: DRAGÓN DE OBSIDIANA (FINAL)
    else if (roomType === 'boss_dragon') {
      this.obstacles.push({
        id: 'door-north',
        x: 550,
        y: 80,
        radius: 36,
        width: 72,
        height: 20,
        obstacleType: 'door_gate',
        hp: 9999,
        maxHp: 9999,
        color: '#dc2626',
        solid: true,
        blocksProjectiles: false,
        meltable: false,
        doorLocked: true,
        doorDirection: 'north',
      });

      // Pilares de obsidiana y fisuras de magma
      this.spawnRockPillar(320, 360);
      this.spawnRockPillar(780, 360);
      this.spawnMagmaFissure(550, 480, 55);
    }
  }

  // Desbloquea las puertas de la sala actual cuando se derrotan los enemigos
  public unlockRoomDoors(floatingTexts: FloatingText[]) {
    let unlockedAny = false;
    this.obstacles.forEach((obs) => {
      if (obs.obstacleType === 'door_gate' && obs.doorLocked) {
        obs.doorLocked = false;
        obs.color = '#22c55e'; // Verde de puerta abierta
        unlockedAny = true;
      }
    });

    if (unlockedAny) {
      elementalSound.playDoorOpen();
      floatingTexts.push({
        id: `door-unlock-${Date.now()}`,
        x: 550,
        y: 130,
        text: '🔓 ¡SALA DESPEJADA! PASO ABIERTO',
        color: '#22c55e',
        fontSize: 14,
        opacity: 1,
        vy: -1.4,
        life: 45,
      });
    }
  }

  // Genera estacas de Hielo + Tierra (Prisión de Permafrost Rediseñada)
  public spawnPermafrostSpikes(x: number, y: number, count = 3) {
    for (let i = 0; i < count; i++) {
      const offX = (Math.random() - 0.5) * 45;
      const offY = (Math.random() - 0.5) * 45;
      this.obstacles.push({
        id: `permafrost-${Date.now()}-${i}`,
        x: x + offX,
        y: y + offY,
        radius: 18,
        width: 36,
        height: 36,
        obstacleType: 'permafrost_spike',
        hp: 85,
        maxHp: 85,
        color: '#0284c7',
        solid: true,
        blocksProjectiles: true,
        meltable: true,
      });
    }
  }

  // Genera escombros temporales tras el colapso de Puño Tectónico (Tierra + Tierra)
  public spawnTectonicRubble(x: number, y: number, count = 3, durationMs = 2200) {
    const squish = 0.58;
    const ringRadius = 38;
    const angleStep = (Math.PI * 2) / count;
    const baseAngle = Math.random() * Math.PI * 2;

    for (let i = 0; i < count; i++) {
      const ang = baseAngle + i * angleStep + (Math.random() - 0.5) * 0.35;
      const dist = ringRadius * (0.85 + Math.random() * 0.3);
      const rx = x + Math.cos(ang) * dist;
      const ry = y + Math.sin(ang) * dist * squish;

      this.obstacles.push({
        id: `rubble-${Date.now()}-${i}-${Math.random()}`,
        x: rx,
        y: ry,
        radius: 17,
        width: 34,
        height: 34,
        obstacleType: 'tectonic_rubble',
        hp: 95,
        maxHp: 95,
        color: '#4e342e',
        solid: true,
        blocksProjectiles: true,
        meltable: false,
        lifeTimer: durationMs,
        maxLifeTimer: durationMs,
      });
    }
  }

  // Genera muro de roca / pilar de tierra
  public spawnRockPillar(x: number, y: number) {
    this.obstacles.push({
      id: `rock-${Date.now()}-${Math.random()}`,
      x,
      y,
      radius: 22,
      width: 44,
      height: 44,
      obstacleType: 'rock_pillar',
      hp: 240,
      maxHp: 240,
      color: '#475569',
      solid: true,
      blocksProjectiles: true,
      meltable: false,
    });
  }

  // Genera muro de hielo (derretible)
  public spawnIceWall(x: number, y: number) {
    this.obstacles.push({
      id: `ice-${Date.now()}-${Math.random()}`,
      x,
      y,
      radius: 20,
      width: 40,
      height: 40,
      obstacleType: 'ice_wall',
      hp: 120,
      maxHp: 120,
      color: '#38bdf8',
      solid: true,
      blocksProjectiles: true,
      meltable: true,
    });
  }

  // Genera cristales energizados (conecta arcos eléctricos)
  public spawnEnergizedCrystals(x: number, y: number) {
    const offsets = [
      { dx: -35, dy: -25 },
      { dx: 35, dy: -25 },
      { dx: 0, dy: 35 },
    ];

    offsets.forEach((off, i) => {
      this.obstacles.push({
        id: `crystal-${Date.now()}-${i}`,
        x: x + off.dx,
        y: y + off.dy,
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
    });
  }

  // Genera fisura de magma en el suelo
  public spawnMagmaFissure(x: number, y: number, radius = 55) {
    this.terrainZones.push({
      id: `magma-${Date.now()}`,
      x,
      y,
      radius,
      zoneType: 'magma',
      life: 360,
      maxLife: 360,
      color: '#ea580c',
      damagePerSec: 24,
      slowFactor: 0.8,
      isHazardForPlayer: false,
      tickTimer: 0,
    });
  }

  // Genera zona de escarcha/hielo resbaladizo
  public spawnFrostPatch(x: number, y: number, radius = 55) {
    this.terrainZones.push({
      id: `frost-${Date.now()}`,
      x,
      y,
      radius,
      zoneType: 'frost',
      life: 320,
      maxLife: 320,
      color: '#38bdf8',
      damagePerSec: 5,
      slowFactor: 0.45,
      isHazardForPlayer: false,
      tickTimer: 0,
    });
  }

  // Genera charco de agua (conduce electricidad)
  public spawnWaterPuddle(x: number, y: number, radius = 55) {
    this.terrainZones.push({
      id: `water-${Date.now()}`,
      x,
      y,
      radius,
      zoneType: 'water',
      life: 450,
      maxLife: 450,
      color: '#0284c7',
      damagePerSec: 0,
      slowFactor: 0.9,
      isHazardForPlayer: false,
      tickTimer: 0,
    });
  }

  // Genera nube de vapor térmico (cegadora / daño de choque)
  public spawnSteamBlast(x: number, y: number, radius = 70) {
    this.terrainZones.push({
      id: `steam-${Date.now()}`,
      x,
      y,
      radius,
      zoneType: 'steam',
      life: 180,
      maxLife: 180,
      color: '#94a3b8',
      damagePerSec: 16,
      slowFactor: 0.6,
      isHazardForPlayer: false,
      tickTimer: 0,
    });
  }

  // Actualiza física, derretimientos y conducción por frame
  public update(
    enemies: GameEnemy[],
    floatingTexts: FloatingText[],
    particles: Particle[],
    projectiles: Projectile[],
    dt = 16
  ) {
    // 0. Temporizador de vida de obstáculos temporales (Escombros Tectónicos)
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.lifeTimer !== undefined) {
        obs.lifeTimer -= dt;
        if (obs.lifeTimer <= 0) {
          obs.hp = 0;
          elementalSound.playTectonicCrumble();
          // Partículas de desmoronamiento
          for (let p = 0; p < 7; p++) {
            const pAng = Math.random() * Math.PI * 2;
            const pSpd = 1 + Math.random() * 2.5;
            particles.push({
              id: `crumble-${Date.now()}-${p}`,
              x: obs.x,
              y: obs.y - 6,
              vx: Math.cos(pAng) * pSpd,
              vy: Math.sin(pAng) * pSpd * 0.58 - 1,
              radius: 1.5 + Math.random() * 2,
              color: Math.random() < 0.6 ? '#5d4037' : '#d97706',
              alpha: 1,
              life: 18,
            });
          }
        }
      }
    }

    // 1. Limpieza de obstáculos destruidos
    this.vesselRewards.push(...collectVesselRewards(this.obstacles));
    this.obstacles = this.obstacles.filter((obs) => obs.hp > 0);

    // 2. Cristales energizados conectando arcos eléctricos entre sí
    this.electricArcs = [];
    const crystals = this.obstacles.filter(
      (o) => o.obstacleType === 'energized_crystal' && o.electrified
    );

    for (let i = 0; i < crystals.length; i++) {
      for (let j = i + 1; j < crystals.length; j++) {
        const c1 = crystals[i];
        const c2 = crystals[j];
        const dist = Math.hypot(c2.x - c1.x, c2.y - c1.y);

        if (dist < 210) {
          this.electricArcs.push({
            x1: c1.x,
            y1: c1.y,
            x2: c2.x,
            y2: c2.y,
            color: '#facc15',
            life: 1,
          });

          // Daña enemigos cercanos a la línea del arco
          enemies.forEach((enemy) => {
            const lineDist = pointToSegmentDistance(
              enemy.x,
              enemy.y,
              c1.x,
              c1.y,
              c2.x,
              c2.y
            );
            if (lineDist < enemy.radius + 12) {
              enemy.hp -= 0.7; // Daño continuo por choque eléctrico
              enemy.hitFlash = 3;
            }
          });
        }
      }
    }

    // 3. Actualizar zonas de terreno (Magma, Hielo, Agua)
    for (let i = this.terrainZones.length - 1; i >= 0; i--) {
      const zone = this.terrainZones[i];
      zone.life--;
      zone.tickTimer++;

      if (zone.life <= 0) {
        this.terrainZones.splice(i, 1);
        continue;
      }

      // Interacción con enemigos dentro de la zona
      enemies.forEach((enemy) => {
        if (checkCircleCollision(enemy.x, enemy.y, enemy.radius, zone.x, zone.y, zone.radius)) {
          // Zona de Magma: quema continua
          if (zone.zoneType === 'magma') {
            if (zone.tickTimer % 20 === 0) {
              enemy.hp -= zone.damagePerSec * 0.33;
              enemy.hitFlash = 5;
            }
          }
          // Zona de Frost: ralentización
          else if (zone.zoneType === 'frost') {
            enemy.vx *= 0.82;
            enemy.vy *= 0.82;
          }
          // Zona de Agua: conduce si hay electricidad cercana
          else if (zone.zoneType === 'water' && this.electricArcs.length > 0) {
            enemy.hp -= 0.9;
            enemy.hitFlash = 4;
          }
        }
      });
    }
  }

  // Interacción de Proyectil con Obstáculos (incluyendo ruptura de estacas de Permafrost)
  public handleProjectileHit(
    p: Projectile,
    floatingTexts: FloatingText[],
    particles: Particle[],
    enemies: GameEnemy[],
    projectiles: Projectile[]
  ): boolean {
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];

      // Ignora puertas abiertas
      if (obs.obstacleType === 'door_gate' && !obs.doorLocked) continue;

      if (checkCircleCollision(p.x, p.y, p.radius, obs.x, obs.y, obs.radius)) {
        obs.hp -= p.damage;

        // RUPTURA / SUBLIMACIÓN DE ESTACAS DE PERMAFROST:
        if (obs.obstacleType === 'permafrost_spike') {
          const isFire = p.spellType === 'fire_shot' || p.spellType === 'fire_inferno' || p.spellType === 'thermal_shock' || p.spellType === 'magma_eruption';
          const isEarth = p.spellType === 'earth_toss' || p.spellType === 'earth_megalith';

          if (isFire) {
            obs.hp = 0;
            elementalSound.playThermalShock();
            this.spawnSteamBlast(obs.x, obs.y, 75);

            // Daño radial por golpe térmico a enemigos alrededor
            enemies.forEach((enemy) => {
              const dist = Math.hypot(enemy.x - obs.x, enemy.y - obs.y);
              if (dist <= 75) {
                enemy.hp -= 42;
                enemy.hitFlash = 10;
              }
            });

            floatingTexts.push({
              id: `sublime-${Date.now()}`,
              x: obs.x,
              y: obs.y - 18,
              text: '♨️ ¡SUBLIMACIÓN EXPLOSIVA!',
              color: '#f43f5e',
              fontSize: 13,
              opacity: 1,
              vy: -1.5,
              life: 35,
            });
          } else if (isEarth) {
            obs.hp = 0;
            elementalSound.playPermafrostShatter();

            // Libera 6 esquirlas perforantes de hielo y piedra en 360 grados
            for (let s = 0; s < 6; s++) {
              const ang = (Math.PI * 2 / 6) * s;
              projectiles.push({
                id: `shrapnel-${Date.now()}-${s}`,
                x: obs.x,
                y: obs.y,
                vx: Math.cos(ang) * 7.0,
                vy: Math.sin(ang) * 7.0,
                radius: 6,
                color: '#38bdf8',
                secondaryColor: '#65a30d',
                damage: 35,
                knockback: 4.8,
                life: 30,
                maxLife: 30,
                pierce: 1,
                piercedIds: [],
                isHostile: false,
                spellType: 'ice_shard',
                visualShape: 'ice_lance',
              });
            }

            floatingTexts.push({
              id: `shatter-${Date.now()}`,
              x: obs.x,
              y: obs.y - 18,
              text: '💥 ¡FRACTURA DE PERMAFROST!',
              color: '#38bdf8',
              fontSize: 13,
              opacity: 1,
              vy: -1.4,
              life: 35,
            });
          }
        }

        // DETONACIÓN DE CRISTALES ENERGIZADOS POR FUEGO O TIERRA:
        if (obs.obstacleType === 'energized_crystal') {
          const isFire = p.spellType === 'fire_shot' || p.spellType === 'fire_inferno' || p.spellType === 'magma_eruption';
          const isEarth = p.spellType === 'earth_toss' || p.spellType === 'earth_megalith';

          if (isFire || isEarth) {
            obs.hp = 0;
            elementalSound.playLightningBolt();
            elementalSound.playAoEExplosion();

            // Descarga eléctrica radial que electrocuta enemigos cercanos
            enemies.forEach((enemy) => {
              const dist = Math.hypot(enemy.x - obs.x, enemy.y - obs.y);
              if (dist <= 85) {
                enemy.hp -= 46;
                enemy.hitFlash = 12;
                enemy.stunnedTimer = 35;
              }
            });

            // Chispas de alta energía
            for (let s = 0; s < 16; s++) {
              const spkAng = Math.random() * Math.PI * 2;
              particles.push({
                id: `crspk-${Date.now()}-${s}`,
                x: obs.x,
                y: obs.y,
                vx: Math.cos(spkAng) * (3 + Math.random() * 4),
                vy: Math.sin(spkAng) * (3 + Math.random() * 4),
                radius: 2,
                color: Math.random() > 0.4 ? '#facc15' : '#e0f2fe',
                alpha: 1,
                life: 18,
              });
            }

            floatingTexts.push({
              id: `cry-overload-${Date.now()}`,
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

        // DESHIELO DE MURO DE HIELO:
        if (p.spellType === 'fire_shot' || p.spellType === 'fire_inferno' || p.spellType === 'magma_eruption') {
          if (obs.meltable && obs.obstacleType === 'ice_wall') {
            obs.hp = 0;
            this.spawnWaterPuddle(obs.x, obs.y, 45);
            floatingTexts.push({
              id: `melt-${Date.now()}`,
              x: obs.x,
              y: obs.y - 15,
              text: '💧 ¡HIELO DERRETIDO!',
              color: '#38bdf8',
              fontSize: 12,
              opacity: 1,
              vy: -1.2,
              life: 35,
            });
          }
        }

        // Si el obstáculo bloquea proyectiles, detiene el proyectil
        if (obs.blocksProjectiles) {
          return true;
        }
      }
    }
    return false;
  }
}

// Distancia de un punto a un segmento de línea
function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}
