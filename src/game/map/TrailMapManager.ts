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
let cachedLevel1Map: string[] | null = null;

export function assembleLevel1Map(): string[] {
  if (!cachedLevel1Map) {
    cachedLevel1Map = assembleLevel(LEVEL_1_SEQUENCE);
  }
  return cachedLevel1Map;
}

/**
 * Limpia la caché si se modifica dinámicamente un segmento.
 */
export function invalidateLevelCache(): void {
  cachedLevel1Map = null;
}
