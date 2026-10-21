// level1ForestMap.ts — Arquitectura de Nivel Extendido 2.5D Estilo Magicka
// Corredor largo (2400 x 8800 px) con Frustum Culling, Chunks, Árboles con Canopy y Puzle de Rueda + Puerta

import {
  ForestLevelData,
  LevelChunk,
  ForestTreeEntity,
  PuzzleWheelEntity,
  GateDoorEntity,
  FireBarrierEntity,
  AmbientLeafParticle,
  PhysicalObstacle,
} from './types';

export const LEVEL_WIDTH = 2400;
export const LEVEL_HEIGHT = 8800;
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

// Genera la estructura completa del Nivel 1 del Bosque
export function createLevel1Forest(): {
  levelData: ForestLevelData;
  initialObstacles: PhysicalObstacle[];
} {
  // 1. Chunks modulares del mundo (3 columnas x 11 filas = 33 chunks)
  const chunks: LevelChunk[] = [];
  const cols = Math.ceil(LEVEL_WIDTH / CHUNK_SIZE);
  const rows = Math.ceil(LEVEL_HEIGHT / CHUNK_SIZE);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cy = r * CHUNK_SIZE;
      let zone: 'camp' | 'trail' | 'gate' | 'arena' = 'trail';
      if (cy >= 7400) zone = 'camp';
      else if (cy >= 3600 && cy < 4500) zone = 'gate';
      else if (cy < 3600) zone = 'arena';

      chunks.push({
        id: `chunk-${c}-${r}`,
        indexX: c,
        indexY: r,
        x: c * CHUNK_SIZE,
        y: cy,
        width: CHUNK_SIZE,
        height: CHUNK_SIZE,
        zone,
      });
    }
  }

  // 2. Trazado del camino sinuoso (Waypoints de referencia para suelo y renderizado)
  const trailWaypoints = [
    { x: 1200, y: 8600, width: 380 },
    { x: 1200, y: 7800, width: 350 }, // Campamento
    { x: 1060, y: 7000, width: 280 }, // Curva Oeste
    { x: 1040, y: 6400, width: 270 },
    { x: 1400, y: 5600, width: 290 }, // Curva Este
    { x: 1420, y: 5000, width: 280 },
    { x: 1200, y: 4400, width: 320 }, // Centro hacia el Checkpoint
    { x: 1200, y: 3980, width: 320 }, // Portón de Hierro
    { x: 1200, y: 3200, width: 380 }, // Camino de piedra ascendente
    { x: 1200, y: 2200, width: 700 }, // Entrada a la Arena
    { x: 1200, y: 1500, width: 850 }, // Epicentro de la Arena del Jefe
    { x: 1200, y: 700, width: 400 },  // Salida / Santuario
  ];

  // 3. Mecanismo de Rueda (`PuzzleWheel`) cerca del portón
  const puzzleWheel: PuzzleWheelEntity = {
    id: 'puzzle-wheel-main',
    x: 960,
    y: 4050,
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
    x: 1200,
    y: 3980,
    width: 280,
    height: 44,
    isOpen: false,
    openProgress: 0,
    solid: true,
    pillarLeftX: 1060,
    pillarRightX: 1340,
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

  // 4.6 Barreras de Fuego del Bosque (Requieren Magia de Hielo para ser Extinguidas)
  const fireBarriers: FireBarrierEntity[] = [
    // BARRERA 1: Curva Oeste del Sendero (Desfiladero tras salir del campamento)
    {
      id: 'fire-barrier-1',
      x: 1050,
      y: 6450,
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
    // BARRERA 2: Sendero Este aproximándose al Checkpoint / Portón
    {
      id: 'fire-barrier-2',
      x: 1320,
      y: 5050,
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
    // BARRERA 3: Camino de piedra ascendente tras el portón hacia la Arena del Jefe
    {
      id: 'fire-barrier-3',
      x: 1200,
      y: 3200,
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

  // 5. Bosque de árboles densos con Tronco (Y-Sort) y Canopy Superior
  const trees: ForestTreeEntity[] = [];
  const treeColors = ['#1e3a1e', '#163319', '#244524', '#17361b'];
  const trunkColors = ['#3e2723', '#4e342e', '#2e1c14'];

  // Función auxiliar para sembrar árboles de forma procedural controlada
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

  // 5.1 Árboles densos en los bordes izquierdo (X: 100-750) y derecho (X: 1650-2300) a lo largo de todo el mapa
  for (let y = 300; y < LEVEL_HEIGHT - 300; y += 140) {
    // Franja izquierda
    addTree(160 + (Math.sin(y * 0.01) * 60), y, y % 3 === 0 ? 'oak' : 'pine');
    addTree(380 + (Math.cos(y * 0.015) * 80), y + 60, y % 4 === 0 ? 'ancient' : 'pine');
    addTree(600 + (Math.sin(y * 0.02) * 70), y + 20, 'pine');

    // Franja derecha
    addTree(1800 + (Math.sin(y * 0.018) * 70), y + 30, 'pine');
    addTree(2020 + (Math.cos(y * 0.012) * 80), y + 80, y % 3 === 0 ? 'oak' : 'pine');
    addTree(2240 + (Math.sin(y * 0.01) * 50), y, y % 5 === 0 ? 'ancient' : 'pine');
  }

  // 5.2 Árboles que enmarcan las curvas del Gran Sendero
  const trailBorderPoints = [
    // Curva 1 (Y ~ 7000)
    { x: 800, y: 7200 }, { x: 820, y: 7000 }, { x: 840, y: 6800 },
    { x: 1300, y: 7300 }, { x: 1320, y: 7100 }, { x: 1340, y: 6900 },
    // Curva 2 (Y ~ 5800)
    { x: 1100, y: 6000 }, { x: 1120, y: 5800 }, { x: 1140, y: 5600 },
    { x: 1650, y: 5900 }, { x: 1680, y: 5700 }, { x: 1660, y: 5500 },
    // Enfoque Checkpoint (Y ~ 4400)
    { x: 920, y: 4600 }, { x: 940, y: 4400 }, { x: 950, y: 4200 },
    { x: 1460, y: 4600 }, { x: 1470, y: 4400 }, { x: 1480, y: 4200 },
  ];
  trailBorderPoints.forEach((pt) => {
    addTree(pt.x, pt.y, 'oak');
  });

  // 6. Barreras de colisión estáticas adicionales (Rocas y acantilados naturales)
  const boundaryColliders: Array<{ x: number; y: number; radius: number }> = [];
  trees.forEach((t) => {
    boundaryColliders.push({ x: t.x, y: t.y, radius: t.trunkRadius });
  });

  // Muros de piedra ciclópea a la izquierda y derecha del portón en el Checkpoint
  for (let bx = 300; bx <= 1040; bx += 50) {
    boundaryColliders.push({ x: bx, y: 3980, radius: 28 });
  }
  for (let bx = 1360; bx <= 2100; bx += 50) {
    boundaryColliders.push({ x: bx, y: 3980, radius: 28 });
  }

  // Rocas ciclópeas flanqueando los extremos laterales de cada Barrera de Fuego
  // Barrera 1 (X: 1050, Y: 6450, W: 260)
  boundaryColliders.push({ x: 1050 - 130 - 22, y: 6450, radius: 26 });
  boundaryColliders.push({ x: 1050 + 130 + 22, y: 6450, radius: 26 });
  // Barrera 2 (X: 1320, Y: 5050, W: 270)
  boundaryColliders.push({ x: 1320 - 135 - 22, y: 5050, radius: 26 });
  boundaryColliders.push({ x: 1320 + 135 + 22, y: 5050, radius: 26 });
  // Barrera 3 (X: 1200, Y: 3200, W: 300)
  boundaryColliders.push({ x: 1200 - 150 - 22, y: 3200, radius: 26 });
  boundaryColliders.push({ x: 1200 + 150 + 22, y: 3200, radius: 26 });

  // 7. Obstáculos físicos iniciales (Cajas, Barriles destructibles, Carpa, Hoguera)
  const initialObstacles: PhysicalObstacle[] = [];

  // 7.1 ZONA INICIAL: CAMPAMENTO (Y ~ 8000)
  // Carpa de expedición
  initialObstacles.push({
    id: 'camp-tent',
    x: 1020,
    y: 8140,
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
    x: 1200,
    y: 8080,
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

  // Cajas y Barriles de entrenamiento en el campamento
  initialObstacles.push(
    {
      id: 'camp-crate-1',
      x: 1100,
      y: 8180,
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
      x: 1300,
      y: 8140,
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
      x: 1330,
      y: 8180,
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
    { x: 1020, y: 6900, type: 'barrel' as const },
    { x: 1060, y: 6860, type: 'crate' as const },
    { x: 1380, y: 5700, type: 'barrel' as const },
    { x: 1420, y: 5660, type: 'crate' as const },
    { x: 1160, y: 4700, type: 'barrel' as const },
    { x: 1240, y: 4680, type: 'barrel' as const },
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
      x: 1040,
      y: 3980,
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
      x: 1360,
      y: 3980,
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

  // 7.4 ARENA DEL JEFE: Pilares basalticos perimetrales
  const arenaPillars = [
    { x: 880, y: 2200 },
    { x: 1520, y: 2200 },
    { x: 780, y: 1600 },
    { x: 1620, y: 1600 },
    { x: 880, y: 1000 },
    { x: 1520, y: 1000 },
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

  // 7.5 SALIDA DEL NIVEL 1 / PORTAL AL SANTUARIO
  initialObstacles.push({
    id: 'forest-exit-portal',
    x: 1200,
    y: 720,
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
    doorDirection: 'north',
  });

  // 8. Partículas ambientales ligeras (Pool máximo de 20 hojas flotantes con deriva suave)
  const ambientLeaves: AmbientLeafParticle[] = [];
  const leafColors = ['#4ade80', '#22c55e', '#86efac', '#facc15', '#a3e635'];

  for (let i = 0; i < 20; i++) {
    ambientLeaves.push({
      id: `leaf-${i}`,
      x: 1200 + (Math.random() - 0.5) * 1200,
      y: 8000 + (Math.random() - 0.5) * 800,
      vx: 0.6 + Math.random() * 0.8,
      vy: 0.8 + Math.random() * 0.9,
      size: 4 + Math.random() * 3,
      color: leafColors[i % leafColors.length],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.08,
      flutterSeed: Math.random() * 100,
      alpha: 0.5 + Math.random() * 0.4,
    });
  }

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
  };

  return { levelData, initialObstacles };
}
