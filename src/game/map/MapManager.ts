// MapManager.ts — Gestor Modular y Extensible de Niveles y Tilemaps para TaskQuest RPG

import { Tilemap } from './Tilemap';
import { LEVEL_1_LAYOUT } from './level1Layout';

export class MapManager {
  private activeMap: Tilemap;

  constructor(initialLayout: string[] = LEVEL_1_LAYOUT) {
    this.activeMap = new Tilemap(initialLayout);
  }

  /**
   * Carga un nuevo layout de matriz de cuadrícula (ASCII 2D).
   * Extensible: cambiar al Nivel 2 o 3 requiere simplemente pasar la nueva matriz.
   */
  public loadLevel(layout: string[]): Tilemap {
    this.activeMap = new Tilemap(layout);
    return this.activeMap;
  }

  /**
   * Obtiene la instancia activa del mapa actual.
   */
  public getMap(): Tilemap {
    return this.activeMap;
  }

  /**
   * Recarga el Nivel 1 ("El Paso de los Antiguos").
   */
  public resetLevel1(): Tilemap {
    this.activeMap = new Tilemap(LEVEL_1_LAYOUT);
    return this.activeMap;
  }
}

export const mapManager = new MapManager();
