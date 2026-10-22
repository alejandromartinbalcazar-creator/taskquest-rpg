// level1Layout.ts — Matriz estructurada del Nivel 1: "La Ruta del Umbral" (Modular Segmented Trail)
// 460 columnas x 12 filas (460 x 64px = 29,440px de ancho, 12 x 64px = 768px de alto)

import { assembleLevel1Map, LEVEL_1_SEQUENCE } from './TrailMapManager';

export const LEVEL_1_LAYOUT: string[] = assembleLevel1Map();

export { assembleLevel1Map, LEVEL_1_SEQUENCE };
