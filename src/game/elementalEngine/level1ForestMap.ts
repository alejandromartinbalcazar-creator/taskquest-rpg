// level1ForestMap.ts — Arquitectura de Nivel Extendido 2.5D Estilo Magicka
// Corredor longitudinal horizontal/diagonal (8800 x 2400 px) de Izquierda a Derecha
// Amplio campo de visión panorámico 16:9/20:9 con Frustum Culling, Chunks, Canopy y Puzle

import {
  ForestLevelData,
  LevelChunk,
  ForestTreeEntity,
  PuzzleWheelEntity,
  GateDoorEntity,
  FireBarrierEntity,
  AmbientLeafParticle,
  PhysicalObstacle,
  LevelCheckpoint,
} from './types';

export const LEVEL_WIDTH = 8800;
export const LEVEL_HEIGHT = 2400;
export const CHUNK_SIZE = 800;

export interface FrustumBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Calcula el rectángulo visible de la cámara en coordenadas del mundo
export function getCameraFrustum(
  camera: { x: number; y: number },
  viewportWidth: number,
  viewportHeight: number,
  zoom: number = 1.32,
  margin: number = 240
): FrustumBounds {
  const halfW = (viewportWidth / zoom) / 2;
  const halfH = (viewportHeight / zoom) / 2;
  return {
    left: camera.x - halfW - margin,
    right: camera.x + halfW + margin,
    top: camera.y - halfH - margin,
    bottom: camera.y + halfH + margin,
  };
}

// Comprueba si un rectángulo o punto intersecta el frustum
export function isInFrustum(
  x: number,
  y: number,
  radius: number,
  frustum: FrustumBounds
): boolean {
  return (
    x + radius >= frustum.left &&
    x - radius <= frustum.right &&
    y + radius >= frustum.top &&
    y - radius <= frustum.bottom
  );
}

// Genera la estructura completa del Nivel 1 del Bosque en progresión horizontal (Oeste a Este)
export function createLevel1Forest(): {
  levelData: ForestLevelData;
  initialObstacles: PhysicalObstacle[];
} {
  // 1. Chunks modulares del mundo (11 columnas x 3 filas = 33 chunks)
  const chunks: LevelChunk[] = [];
  const cols = Math.ceil(LEVEL_WIDTH / CHUNK_SIZE);
  const rows = Math.ceil(LEVEL_HEIGHT / CHUNK_SIZE);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * CHUNK_SIZE;
      let zone: 'camp' | 'trail' | 'gate' | 'arena' = 'trail';
      if (cx < 1400) zone = 'camp';
      else if (cx >= 3800 && cx < 5200) zone = 'gate';
      else if (cx >= 6400) zone = 'arena';

      chunks.push({
        id: `chunk-${c}-${r}`,
        indexX: c,
        indexY: r,
        x: cx,
        y: r * CHUNK_SIZE,
        width: CHUNK_SIZE,
        height: CHUNK_SIZE,
        zone,
      });
    }
  }

  // 2. Trazado del camino sinuoso horizontal con ondulación suave (Oeste a Este)
  const trailWaypoints = [
    { x: 250,  y: 1200, width: 380 }, // Desembarco / Inicio
    { x: 800,  y: 1200, width: 360 }, // Campamento Base
    { x: 1500, y: 1020, width: 300 }, // Curva Norte 1
    { x: 2300, y: 1380, width: 300 }, // Curva Sur 1 (Barrera de Fuego 1)
    { x: 3100, y: 1040, width: 310 }, // Curva Norte 2
    { x: 3600, y: 1250, width: 320 }, // Enfoque Manantial
    { x: 4150, y: 1200, width: 350 }, // Checkpoint 1: El Manantial (Pre-Puzle)
    { x: 4500, y: 1100, width: 320 }, // Plaza del Portón de Hierro
    { x: 5200, y: 1250, width: 340 }, // Sendero Alto tras el Portón
    { x: 6000, y: 1100, width: 350 }, // Desfiladero rocoso
    { x: 6500, y: 1200, width: 500 }, // Checkpoint 2: La Antesala del Umbral
    { x: 7400, y: 1200, width: 850 }, // Gran Arena del Custodio del Umbral
    { x: 8350, y: 1200, width: 400 }, // Salida / Portal del Santuario
  ];

  // 3. Mecanismo de Rueda (`PuzzleWheel`) cerca del portón
  const puzzleWheel: PuzzleWheelEntity = {
    id: 'puzzle-wheel-main',
    x: 4320,
    y: 1180,
    radius: 34,
    charge: 0,
    rotationAngle: 0,
    isCompleted: false,
    frostVisual: 0,
    hitFlash: 0,
    lastHitTime: 0,
    sparks: [],
  };

  // 4. Portón Colosal de Hierro (`GateDoor`)
  const gateDoor: GateDoorEntity = {
    id: 'gate-door-main',
    x: 4500,
    y: 1100,
    width: 280,
    height: 44,
    isOpen: false,
    openProgress: 0,
    solid: true,
    pillarLeftX: 4360,
    pillarRightX: 4640,
  };

  // 4.5 Función auxiliar para crear lengüetas de fuego animadas en las barreras
  const createFlamePillars = (width: number) => {
    const pillars: Array<{ relX: number; relY: number; size: number; phaseOffset: number }> = [];
    const count = Math.max(8, Math.floor(width / 20));
    for (let i = 0; i < count; i++) {
      const relX = -width / 2 + (i + 0.5) * (width / count);
      const relY = Math.sin(i * 1.6) * 5;
      const size = 18 + Math.cos(i * 2.1) * 5;
      const phaseOffset = i * 0.45;
      pillars.push({ relX, relY, size, phaseOffset });
    }
    return pillars;
  };

  // 4.6 Barreras de Fuego del Bosque distribuidas horizontalmente a lo largo del camino
  const fireBarriers: FireBarrierEntity[] = [
    // BARRERA 1: Desfiladero tras salir del campamento (X ~ 2300)
    {
      id: 'fire-barrier-1',
      x: 2300,
      y: 1380,
      width: 260,
      height: 44,
      flameHeight: 58,
      maxHealth: 100,
      health: 100,
      isExtinguished: false,
      extinguishProgress: 0,
      hitFlash: 0,
      lastDamageTime: 0,
      flamePillars: createFlamePillars(260),
    },
    // BARRERA 2: Aproximándose al Manantial / Checkpoint 1 (X ~ 3500)
    {
      id: 'fire-barrier-2',
      x: 3500,
      y: 1220,
      width: 270,
      height: 44,
      flameHeight: 58,
      maxHealth: 100,
      health: 100,
      isExtinguished: false,
      extinguishProgress: 0,
      hitFlash: 0,
      lastDamageTime: 0,
      flamePillars: createFlamePillars(270),
    },
    // BARRERA 3: Sendero alto de piedra hacia la Arena del Jefe (X ~ 5500)
    {
      id: 'fire-barrier-3',
      x: 5500,
      y: 1200,
      width: 300,
      height: 44,
      flameHeight: 62,
      maxHealth: 100,
      health: 100,
      isExtinguished: false,
      extinguishProgress: 0,
      hitFlash: 0,
      lastDamageTime: 0,
      flamePillars: createFlamePillars(300),
    },
  ];

  // 5. Bosque de árboles densos en los límites norte y sur del mapa
  const trees: ForestTreeEntity[] = [];
  const treeColors = ['#1e3a1e', '#163319', '#244524', '#17361b'];
  const trunkColors = ['#3e2723', '#4e342e', '#2e1c14'];

  const addTree = (
    x: number,
    y: number,
    type: 'pine' | 'oak' | 'ancient' = 'pine'
  ) => {
    const isOak = type === 'oak';
    const isAncient = type === 'ancient';
    const trunkR = isAncient ? 26 : isOak ? 20 : 16;
    const canopyR = isAncient ? 75 : isOak ? 58 : 46;
    const canopyH = isAncient ? 110 : isOak ? 90 : 80;

    trees.push({
      id: `tree-${trees.length}`,
      x,
      y,
      trunkRadius: trunkR,
      canopyRadius: canopyR,
      canopyHeight: canopyH,
      treeType: type,
      canopyAlpha: 1.0,
      foliageColor: isAncient ? '#143820' : treeColors[trees.length % treeColors.length],
      trunkColor: trunkColors[trees.length % trunkColors.length],
    });
  };

  // 5.1 Límites boscosos densos en franjas norte (Y: 100 a 700) y sur (Y: 1700 a 2300)
  for (let x = 150; x < LEVEL_WIDTH - 150; x += 135) {
    // Franja norte
    addTree(x + (Math.sin(x * 0.01) * 60), 220 + (Math.cos(x * 0.015) * 60), x % 3 === 0 ? 'oak' : 'pine');
    addTree(x + 50, 430 + (Math.sin(x * 0.02) * 80), x % 4 === 0 ? 'ancient' : 'pine');
    addTree(x + 90, 640 + (Math.cos(x * 0.01) * 70), 'pine');

    // Franja sur
    addTree(x + (Math.sin(x * 0.018) * 70), 1780 + (Math.cos(x * 0.01) * 60), 'pine');
    addTree(x + 60, 1990 + (Math.sin(x * 0.012) * 80), x % 3 === 0 ? 'oak' : 'pine');
    addTree(x + 20, 2200 + (Math.cos(x * 0.015) * 50), x % 5 === 0 ? 'ancient' : 'pine');
  }

  // 5.2 Árboles que enmarcan las curvas y claros del sendero
  const trailBorderPoints = [
    // Curva Norte 1 (X ~ 1500)
    { x: 1400, y: 840 }, { x: 1520, y: 820 }, { x: 1640, y: 850 },
    { x: 1400, y: 1220 }, { x: 1520, y: 1240 }, { x: 1640, y: 1220 },
    // Curva Sur 1 (X ~ 2300)
    { x: 2180, y: 1180 }, { x: 2300, y: 1170 }, { x: 2420, y: 1190 },
    { x: 2180, y: 1580 }, { x: 2300, y: 1600 }, { x: 2420, y: 1570 },
    // Checkpoint 1 (X ~ 4200)
    { x: 4000, y: 980 }, { x: 4160, y: 970 }, { x: 4320, y: 990 },
    { x: 4000, y: 1420 }, { x: 4160, y: 1430 }, { x: 4320, y: 1410 },
  ];
  trailBorderPoints.forEach((pt) => {
    addTree(pt.x, pt.y, 'oak');
  });

  // 6. Barreras de colisión estáticas adicionales
  const boundaryColliders: Array<{ x: number; y: number; radius: number }> = [];
  trees.forEach((t) => {
    boundaryColliders.push({ x: t.x, y: t.y, radius: t.trunkRadius });
  });

  // Muros de piedra ciclópea a la izquierda y derecha del portón
  for (let bx = 4050; bx <= 4340; bx += 45) {
    boundaryColliders.push({ x: bx, y: 1100, radius: 28 });
  }
  for (let bx = 4660; bx <= 4950; bx += 45) {
    boundaryColliders.push({ x: bx, y: 1100, radius: 28 });
  }

  // Rocas ciclópeas flanqueando los extremos laterales de cada Barrera de Fuego
  boundaryColliders.push({ x: 2300 - 130 - 22, y: 1380, radius: 26 });
  boundaryColliders.push({ x: 2300 + 130 + 22, y: 1380, radius: 26 });

  boundaryColliders.push({ x: 3500 - 135 - 22, y: 1220, radius: 26 });
  boundaryColliders.push({ x: 3500 + 135 + 22, y: 1220, radius: 26 });

  boundaryColliders.push({ x: 5500 - 150 - 22, y: 1200, radius: 26 });
  boundaryColliders.push({ x: 5500 + 150 + 22, y: 1200, radius: 26 });

  // 7. Obstáculos físicos iniciales
  const initialObstacles: PhysicalObstacle[] = [];

  // 7.1 ZONA INICIAL: CAMPAMENTO (X ~ 800, Y ~ 1200)
  // Carpa de expedición
  initialObstacles.push({
    id: 'camp-tent',
    x: 680,
    y: 1280,
    radius: 42,
    width: 84,
    height: 70,
    obstacleType: 'camp_tent',
    hp: 9999,
    maxHp: 9999,
    color: '#3b82f6',
    solid: true,
    blocksProjectiles: true,
    meltable: false,
  });

  // Hoguera central del campamento
  initialObstacles.push({
    id: 'camp-fire',
    x: 800,
    y: 1200,
    radius: 20,
    width: 40,
    height: 40,
    obstacleType: 'rock_pillar',
    hp: 9999,
    maxHp: 9999,
    color: '#ea580c',
    solid: true,
    blocksProjectiles: false,
    meltable: false,
  });

  // Cajas y Barriles en el campamento
  initialObstacles.push(
    {
      id: 'camp-crate-1',
      x: 740,
      y: 1140,
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
      id: 'camp-barrel-1',
      x: 890,
      y: 1140,
      radius: 16,
      width: 32,
      height: 38,
      obstacleType: 'barrel',
      hp: 25,
      maxHp: 25,
      color: '#78350f',
      solid: true,
      blocksProjectiles: true,
      meltable: false,
    },
    {
      id: 'camp-barrel-2',
      x: 890,
      y: 1260,
      radius: 16,
      width: 32,
      height: 38,
      obstacleType: 'barrel',
      hp: 25,
      maxHp: 25,
      color: '#78350f',
      solid: true,
      blocksProjectiles: true,
      meltable: false,
    }
  );

  // 7.2 EL GRAN SENDERO: Barriles y rocas destructibles esparcidos por el camino
  const trailProps = [
    { x: 1600, y: 1000, type: 'barrel' as const },
    { x: 1650, y: 1040, type: 'crate' as const },
    { x: 2850, y: 1200, type: 'barrel' as const },
    { x: 2900, y: 1160, type: 'crate' as const },
    { x: 3750, y: 1280, type: 'barrel' as const },
    { x: 5300, y: 1220, type: 'barrel' as const },
  ];

  trailProps.forEach((p, idx) => {
    initialObstacles.push({
      id: `trail-prop-${idx}`,
      x: p.x,
      y: p.y,
      radius: p.type === 'crate' ? 18 : 16,
      width: p.type === 'crate' ? 36 : 32,
      height: p.type === 'crate' ? 36 : 38,
      obstacleType: p.type,
      hp: 30,
      maxHp: 30,
      color: '#854d0e',
      solid: true,
      blocksProjectiles: true,
      meltable: false,
    });
  });

  // 7.3 CHECKPOINT: Pilares de piedra ciclópea flanqueando el portón
  initialObstacles.push(
    {
      id: 'gate-pillar-left',
      x: 4340,
      y: 1100,
      radius: 30,
      width: 60,
      height: 60,
      obstacleType: 'rock_pillar',
      hp: 9999,
      maxHp: 9999,
      color: '#475569',
      solid: true,
      blocksProjectiles: true,
      meltable: false,
    },
    {
      id: 'gate-pillar-right',
      x: 4660,
      y: 1100,
      radius: 30,
      width: 60,
      height: 60,
      obstacleType: 'rock_pillar',
      hp: 9999,
      maxHp: 9999,
      color: '#475569',
      solid: true,
      blocksProjectiles: true,
      meltable: false,
    }
  );

  // 7.4 ARENA DEL JEFE: Pilares basalticos perimetrales en círculo alrededor de (7400, 1200)
  const arenaPillars = [
    { x: 7400 - 380, y: 1200 - 240 },
    { x: 7400 + 380, y: 1200 - 240 },
    { x: 7400 - 460, y: 1200 },
    { x: 7400 + 460, y: 1200 },
    { x: 7400 - 380, y: 1200 + 240 },
    { x: 7400 + 380, y: 1200 + 240 },
  ];
  arenaPillars.forEach((p, idx) => {
    initialObstacles.push({
      id: `arena-pillar-${idx}`,
      x: p.x,
      y: p.y,
      radius: 32,
      width: 64,
      height: 64,
      obstacleType: 'rock_pillar',
      hp: 9999,
      maxHp: 9999,
      color: '#334155',
      solid: true,
      blocksProjectiles: true,
      meltable: false,
    });
  });

  // 7.5 SALIDA DEL NIVEL 1 / PORTAL AL SANTUARIO (Extremo derecho, X: 8350, Y: 1200)
  initialObstacles.push({
    id: 'forest-exit-portal',
    x: 8350,
    y: 1200,
    radius: 36,
    width: 72,
    height: 72,
    obstacleType: 'door_gate',
    hp: 9999,
    maxHp: 9999,
    color: '#38bdf8',
    solid: false,
    blocksProjectiles: false,
    meltable: false,
    doorLocked: true,
    doorDirection: 'east',
  });

  // 8. Partículas ambientales ligeras (Pool máximo de 20 hojas flotantes con deriva suave)
  const ambientLeaves: AmbientLeafParticle[] = [];
  const leafColors = ['#4ade80', '#22c55e', '#86efac', '#facc15', '#a3e635'];

  for (let i = 0; i < 20; i++) {
    ambientLeaves.push({
      id: `leaf-${i}`,
      x: 800 + (Math.random() - 0.5) * 1200,
      y: 1200 + (Math.random() - 0.5) * 800,
      vx: 0.8 + Math.random() * 0.9,
      vy: 0.4 + (Math.random() - 0.5) * 0.6,
      size: 4 + Math.random() * 3,
      color: leafColors[i % leafColors.length],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.08,
      flutterSeed: Math.random() * 100,
      alpha: 0.5 + Math.random() * 0.4,
    });
  }

  // 8.5 Puntos de Control Rúnicos (Checkpoints del Nivel 1) orientados de Oeste a Este
  const checkpoints: LevelCheckpoint[] = [
    // Checkpoint 0: Zona de desembarco e inicio del bosque / campamento
    {
      id: 'checkpoint-0-camp',
      name: 'Campamento del Bosque',
      x: 750,
      y: 1200,
      respawnX: 800,
      respawnY: 1200,
      isActive: true, // Siempre activo al iniciar
      activationRadius: 85,
    },
    // Checkpoint 1: El Manantial (Pre-Puzle), justo antes de la rueda y el portón de hielo
    {
      id: 'checkpoint-1-spring',
      name: 'El Manantial (Pre-Puzle)',
      x: 4100,
      y: 1200,
      respawnX: 4150,
      respawnY: 1200,
      isActive: false,
      activationRadius: 85,
    },
    // Checkpoint 2: La Antesala del Umbral, tras cruzar el portón, antes de la arena del Jefe
    {
      id: 'checkpoint-2-threshold',
      name: 'La Antesala del Umbral',
      x: 6450,
      y: 1200,
      respawnX: 6500,
      respawnY: 1200,
      isActive: false,
      activationRadius: 85,
    },
  ];

  const levelData: ForestLevelData = {
    worldWidth: LEVEL_WIDTH,
    worldHeight: LEVEL_HEIGHT,
    chunks,
    trees,
    puzzleWheel,
    gateDoor,
    fireBarriers,
    boundaryColliders,
    ambientLeaves,
    trailWaypoints,
    checkpoints,
  };

  return { levelData, initialObstacles };
}
