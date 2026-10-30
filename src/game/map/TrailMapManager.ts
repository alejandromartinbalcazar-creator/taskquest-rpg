// TrailMapManager.ts — Gestor y Ensamblador Modular de Senderos Segmentados para TaskQuest RPG

import {
  SEGMENT_START,
  SEGMENT_A,
  SEGMENT_B,
  SEGMENT_C,
  SEGMENT_D,
  SEGMENT_E,
  SEGMENT_BOSS,
} from './TrailSegments';
import type { RoomKind, RoomTemplate } from '../expedition/types';

/**
 * Secuencia canónica de 11 módulos para "La Ruta del Umbral" (Nivel 1):
 * Longitud total: 10 módulos de 40 cols + 1 de 60 cols = 460 columnas (~29,440 píxeles de mundo).
 */
export const LEVEL_1_SEQUENCE: string[][] = [
  SEGMENT_START, // Cols 0 - 39: Spawn P en col 3
  SEGMENT_A,     // Cols 40 - 79: Sendero Boscoso 1 (Pyre Golems)
  SEGMENT_B,     // Cols 80 - 119: Garganta de Piedra 1 (Storm Stalkers & Monolitos)
  SEGMENT_D,     // Cols 120 - 159: Santuario Intermedio 1 (Altar Checkpoint 1 en col 140)
  SEGMENT_C,     // Cols 160 - 199: Orillas del Río 1 (Puente & Frost Lurkers)
  SEGMENT_A,     // Cols 200 - 239: Sendero Boscoso 2 (Emboscada)
  SEGMENT_B,     // Cols 240 - 279: Garganta de Piedra 2 (Tormenta eléctrica)
  SEGMENT_D,     // Cols 280 - 319: Santuario Intermedio 2 (Altar Checkpoint 2 en col 300)
  SEGMENT_C,     // Cols 320 - 359: Orillas del Río 2 (Trincheras de escarcha)
  SEGMENT_E,     // Cols 360 - 399: Desfiladero y Portón de Hielo (D en col 397)
  SEGMENT_BOSS,  // Cols 400 - 459: Gran Explanada del Custodio del Umbral (Arena B cols 410-452)
];

/**
 * Ensambla horizontalmente una lista ordenada de módulos de cuadrícula (matriz 2D).
 * Cada fila `r` del resultado es la concatenación de las filas `r` de todos los módulos en la secuencia.
 */
export function assembleLevel(sequence: string[][]): string[] {
  if (!sequence || sequence.length === 0) return [];

  const rowCount = sequence[0].length;
  const assembledRows: string[] = [];

  for (let r = 0; r < rowCount; r++) {
    let combinedRow = '';
    for (let sIdx = 0; sIdx < sequence.length; sIdx++) {
      const segment = sequence[sIdx];
      combinedRow += (segment[r] || '');
    }
    assembledRows.push(combinedRow);
  }

  return assembledRows;
}

/**
 * Genera la matriz completa ensamblada de "La Ruta del Umbral" (Nivel 1).
 */
export function assembleLevel1Map(): string[] {
  return assembleLevel(LEVEL_1_SEQUENCE);
}

const ROOM_WIDTH = 40;
const ROOM_HEIGHT = 12;

/**
 * Crea una sala de campaña legible visualmente. Cada tipo conserva un lenguaje
 * propio: combate abierto, emboscada de río, tesoro dorado, santuario y élite.
 * Los símbolos T/R/% son decoraciones que Tilemap renderiza sin alterar el paso.
 */
function createCampaignRoom(kind: RoomKind, index: number): string[] {
  const grid: string[][] = Array.from({ length: ROOM_HEIGHT }, (_, row) =>
    Array.from({ length: ROOM_WIDTH }, () => (row <= 1 || row >= 10 ? '#' : '.'))
  );
  const set = (x: number, y: number, value: string) => { if (x >= 0 && x < ROOM_WIDTH && y >= 0 && y < ROOM_HEIGHT) grid[y][x] = value; };
  const wallCluster = (x: number, y: number) => [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => set(x + dx, y + dy, '#'));

  // Bordes de bosque, sin cerrar las filas centrales que conectan las salas.
  for (let x = 3; x < ROOM_WIDTH - 3; x += 7) {
    set(x, 2, '#'); set(x + 1, 2, '#'); set(x, 9, '#'); set(x + 1, 9, '#');
  }

  if (kind === 'combat') {
    wallCluster(12, 3); wallCluster(27, 6);
    ['1', '2', '3', '1'].forEach((enemy, enemyIndex) => set(8 + enemyIndex * 7, enemyIndex % 2 ? 6 : 5, enemy));
  } else if (kind === 'ambush') {
    for (let x = 10; x < 30; x += 1) if (x !== 19 && x !== 20) { set(x, 4, '~'); set(x, 7, '~'); }
    ['3', '2', '3'].forEach((enemy, enemyIndex) => set(11 + enemyIndex * 9, enemyIndex === 1 ? 5 : 6, enemy));
  } else if (kind === 'treasure') {
    set(20, 5, 'T'); set(20, 6, 'T'); set(15, 5, '%'); set(25, 6, '%'); set(30, 5, 'C');
  } else if (kind === 'rest') {
    for (let x = 10; x <= 30; x += 2) { set(x, 4, '%'); set(x, 7, '%'); }
    set(20, 5, 'R'); set(20, 6, 'R'); set(30, 5, 'C');
  } else if (kind === 'elite') {
    wallCluster(15, 3); wallCluster(23, 6);
    set(20, 5, '2'); set(20, 6, '2'); set(12, 6, '1'); set(29, 5, '3');
  }

  // Un único portón separa la primera mitad de la expedición de la segunda.
  if (index === 2) { set(37, 5, 'D'); set(37, 6, 'D'); }
  return grid.map((row) => row.join(''));
}

function createCampaignStart(): string[] {
  const grid = createCampaignRoom('entrance', -1).map((row) => row.split(''));
  grid[5][3] = 'P';
  // El campamento inicial se reconoce inmediatamente: santuario verde, musgo y sin enemigos.
  grid[5][9] = 'R'; grid[6][9] = 'R';
  [6, 12, 16, 21, 27, 32].forEach((x) => { grid[4][x] = '%'; grid[7][x] = '%'; });
  return grid.map((row) => row.join(''));
}

/** Ensambla una expedición visible: la semilla decide el orden de estas salas. */
export function assembleLevel1CampaignMap(rooms: Pick<RoomTemplate, 'kind'>[]): string[] {
  const middleRooms = rooms.filter((room) => room.kind !== 'entrance' && room.kind !== 'boss');
  const sequence = [createCampaignStart(), ...middleRooms.map((room, index) => createCampaignRoom(room.kind, index)), SEGMENT_BOSS];
  return assembleLevel(sequence);
}

export function invalidateLevelCache(): void {
  // Sin caché para asegurar recargas siempre actualizadas con HMR
}
