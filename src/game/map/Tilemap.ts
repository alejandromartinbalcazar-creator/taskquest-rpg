// Tilemap.ts — Motor de Cuadrícula Procedural, Colisiones de Celda y Renderizado Vectorial 2.5D

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 64;

export enum TileType {
  EMPTY = ' ',
  WALL = '#',
  FLOOR = '.',
  CHASM = '~',
  SPAWN = 'P',
  CHECKPOINT = 'C',
  ENEMY_GOLEM = '1',
  ENEMY_STALKER = '2',
  ENEMY_LURKER = '3',
  GATE = 'D',
  BOSS_ARENA = 'B',
  TREASURE = 'T',
  REST = 'R',
  MOSS = '%',
}

export interface TilemapSpawn {
  x: number;
  y: number;
  col: number;
  row: number;
}

export interface TilemapCheckpoint {
  id: string;
  name: string;
  x: number;
  y: number;
  col: number;
  row: number;
  isActive: boolean;
  respawnX: number;
  respawnY: number;
  activationRadius: number;
}

export interface TilemapGate {
  id: string;
  x: number;
  y: number;
  col: number;
  row: number;
  isOpen: boolean;
  openProgress: number; // 0 (cerrado) a 1 (completamente abierto)
}

export interface TilemapPuzzleWheel {
  x: number;
  y: number;
  charge: number; // 0 a 100
  isCompleted: boolean;
  hitFlash: number;
  rotation: number;
}

export interface EnemySpawnPoint {
  id: string;
  type: 'golem' | 'stalker' | 'lurker';
  x: number;
  y: number;
}

export interface FrustumBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class Tilemap {
  public cols: number = 0;
  public rows: number = 0;
  public width: number = 0;
  public height: number = 0;
  public grid: TileType[][] = [];

  public spawnPoint: TilemapSpawn = { x: 96, y: 96, col: 1, row: 1 };
  public checkpoints: TilemapCheckpoint[] = [];
  public gate: TilemapGate = { id: 'frost-gate-1', x: 3040, y: 224, col: 47, row: 3, isOpen: false, openProgress: 0 };
  public puzzleWheel: TilemapPuzzleWheel = { x: 2848, y: 160, charge: 0, isCompleted: false, hitFlash: 0, rotation: 0 };
  public enemySpawns: EnemySpawnPoint[] = [];
  public bossSpawn: { x: number; y: number } = { x: 4064, y: 256 };
  public bossArenaBounds = { minX: 3712, maxX: 4416, minY: 128, maxY: 384 };
  public victoryPortal = { x: 28400, y: 384, radius: 48, isActive: false };

  constructor(layout: string[]) {
    this.loadLayout(layout);
  }

  public loadLayout(layout: string[]): void {
    this.rows = layout.length;
    this.cols = layout[0]?.length || 0;
    this.width = this.cols * TILE_WIDTH;
    this.height = this.rows * TILE_HEIGHT;
    this.grid = [];
    this.checkpoints = [];
    this.enemySpawns = [];

    let bossCellsCount = 0;
    let bossSumX = 0;
    let bossSumY = 0;
    let minBx = Infinity;
    let maxBx = -Infinity;
    let minBy = Infinity;
    let maxBy = -Infinity;

    for (let r = 0; r < this.rows; r++) {
      const rowChars = layout[r] || '';
      const rowTiles: TileType[] = [];

      for (let c = 0; c < this.cols; c++) {
        const char = (rowChars[c] || ' ') as TileType;
        const centerX = c * TILE_WIDTH + TILE_WIDTH / 2;
        const centerY = r * TILE_HEIGHT + TILE_HEIGHT / 2;

        if (char === TileType.SPAWN) {
          this.spawnPoint = { x: centerX, y: centerY, col: c, row: r };
          rowTiles.push(TileType.FLOOR);
        } else if (char === TileType.CHECKPOINT) {
          const cpIdx = this.checkpoints.length + 1;
          this.checkpoints.push({
            id: `checkpoint-trail-${cpIdx}`,
            name: `Santuario del Sendero ${cpIdx}`,
            x: centerX,
            y: centerY,
            col: c,
            row: r,
            isActive: false,
            respawnX: centerX,
            respawnY: centerY,
            activationRadius: 75,
          });
          rowTiles.push(TileType.CHECKPOINT);
        } else if (char === TileType.GATE) {
          this.gate = {
            id: `gate-pass-${c}-${r}`,
            x: centerX,
            y: centerY,
            col: c,
            row: r,
            isOpen: false,
            openProgress: 0,
          };
          rowTiles.push(TileType.GATE);
        } else if (char === TileType.ENEMY_GOLEM) {
          this.enemySpawns.push({
            id: `golem-spawn-${c}-${r}`,
            type: 'golem',
            x: centerX,
            y: centerY,
          });
          rowTiles.push(TileType.FLOOR);
        } else if (char === TileType.ENEMY_STALKER) {
          this.enemySpawns.push({
            id: `stalker-spawn-${c}-${r}`,
            type: 'stalker',
            x: centerX,
            y: centerY,
          });
          rowTiles.push(TileType.FLOOR);
        } else if (char === TileType.ENEMY_LURKER) {
          this.enemySpawns.push({
            id: `lurker-spawn-${c}-${r}`,
            type: 'lurker',
            x: centerX,
            y: centerY,
          });
          rowTiles.push(TileType.FLOOR);
        } else if (char === TileType.BOSS_ARENA) {
          bossCellsCount++;
          bossSumX += centerX;
          bossSumY += centerY;
          minBx = Math.min(minBx, c * TILE_WIDTH);
          maxBx = Math.max(maxBx, (c + 1) * TILE_WIDTH);
          minBy = Math.min(minBy, r * TILE_HEIGHT);
          maxBy = Math.max(maxBy, (r + 1) * TILE_HEIGHT);
          rowTiles.push(TileType.BOSS_ARENA);
        } else if (char === TileType.TREASURE || char === TileType.REST || char === TileType.MOSS) {
          // Marcadores decorativos de las plantillas de expedición; son transitables.
          rowTiles.push(char);
        } else {
          rowTiles.push(char);
        }
      }

      this.grid.push(rowTiles);
    }

    if (bossCellsCount > 0) {
      this.bossSpawn = {
        x: Math.round(bossSumX / bossCellsCount),
        y: Math.round(bossSumY / bossCellsCount),
      };
      this.bossArenaBounds = { minX: minBx, maxX: maxBx, minY: minBy, maxY: maxBy };
      this.victoryPortal = {
        x: this.bossSpawn.x,
        y: this.bossSpawn.y,
        radius: 52,
        isActive: false,
      };
    }

    // Ubicar la rueda elemental cerca del portón para el puzle de hielo en el sendero
    if (this.gate.col > 3) {
      this.puzzleWheel = {
        x: (this.gate.col - 3) * TILE_WIDTH + TILE_WIDTH / 2,
        y: this.gate.row * TILE_HEIGHT + TILE_HEIGHT / 2,
        charge: 0,
        isCompleted: false,
        hitFlash: 0,
        rotation: 0,
      };
    }
  }

  /**
   * Obtiene el tipo de tile en una coordenada de celda (col, row).
   * Celdas fuera de los límites retornan WALL por seguridad física perimetral.
   */
  public getTile(col: number, row: number): TileType {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return TileType.WALL;
    }
    return this.grid[row][col] || TileType.WALL;
  }

  /**
   * Determina si una celda bloquea el movimiento terrestre del jugador y monstruos.
   */
  public isCellSolid(col: number, row: number): boolean {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return true;
    }
    const tile = this.grid[row][col];
    if (tile === TileType.WALL) return true;
    if (tile === TileType.CHASM) return true;
    if (tile === TileType.EMPTY) return true;
    if (tile === TileType.GATE) return !this.gate.isOpen;
    return false;
  }

  /**
   * Determina si una celda bloquea proyectiles mágicos.
   * Los abismos (CHASM) permiten el vuelo de proyectiles; los muros y portón cerrado no.
   */
  public blocksProjectiles(col: number, row: number): boolean {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return true;
    }
    const tile = this.grid[row][col];
    if (tile === TileType.WALL) return true;
    if (tile === TileType.GATE) return !this.gate.isOpen;
    return false;
  }

  /**
   * Comprueba si una coordenada de píxeles (x, y) choca con un muro que bloquea proyectiles.
   */
  public blocksProjectilesAt(x: number, y: number): boolean {
    const col = Math.floor(x / TILE_WIDTH);
    const row = Math.floor(y / TILE_HEIGHT);
    return this.blocksProjectiles(col, row);
  }

  /**
   * Abre el portón de hielo y actualiza su estado sólido.
   */
  public openGate(): void {
    this.gate.isOpen = true;
    this.puzzleWheel.isCompleted = true;
    this.puzzleWheel.charge = 100;
  }

  /**
   * Actualiza transiciones dinámicas (apertura suave del portón, rotación de rueda).
   */
  public update(dtSeconds: number): void {
    if (this.gate.isOpen && this.gate.openProgress < 1.0) {
      this.gate.openProgress = Math.min(1.0, this.gate.openProgress + dtSeconds * 1.8);
    }
    if (this.puzzleWheel.hitFlash > 0) {
      this.puzzleWheel.hitFlash--;
    }
    if (this.puzzleWheel.isCompleted) {
      this.puzzleWheel.rotation += dtSeconds * 1.2;
    }
  }

  /**
   * Resolución de colisiones por celda con deslizamiento independiente por ejes X e Y.
   * Elimina atascos y permite correr fluidamente rozando los muros.
   */
  public resolveEntityCollision(
    entity: { x: number; y: number; radius: number },
    vx: number = 0,
    vy: number = 0
  ): { x: number; y: number; collidedX: boolean; collidedY: boolean } {
    let nextX = entity.x + vx;
    let nextY = entity.y + vy;
    let collidedX = false;
    let collidedY = false;
    const r = entity.radius;

    // 1. Eje X independiente
    if (vx !== 0) {
      const minCol = Math.floor((nextX - r) / TILE_WIDTH);
      const maxCol = Math.floor((nextX + r) / TILE_WIDTH);
      const minRow = Math.floor((entity.y - r) / TILE_HEIGHT);
      const maxRow = Math.floor((entity.y + r) / TILE_HEIGHT);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          if (this.isCellSolid(col, row)) {
            const tileLeft = col * TILE_WIDTH;
            const tileRight = tileLeft + TILE_WIDTH;
            const tileTop = row * TILE_HEIGHT;
            const tileBottom = tileTop + TILE_HEIGHT;

            const closestX = Math.max(tileLeft, Math.min(nextX, tileRight));
            const closestY = Math.max(tileTop, Math.min(entity.y, tileBottom));
            const distSq = (nextX - closestX) ** 2 + (entity.y - closestY) ** 2;

            if (distSq < r * r) {
              collidedX = true;
              if (vx > 0) {
                nextX = tileLeft - r - 0.05;
              } else if (vx < 0) {
                nextX = tileRight + r + 0.05;
              }
            }
          }
        }
      }
    }

    // 2. Eje Y independiente (usando el nextX ya resuelto)
    if (vy !== 0) {
      const minCol = Math.floor((nextX - r) / TILE_WIDTH);
      const maxCol = Math.floor((nextX + r) / TILE_WIDTH);
      const minRow = Math.floor((nextY - r) / TILE_HEIGHT);
      const maxRow = Math.floor((nextY + r) / TILE_HEIGHT);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          if (this.isCellSolid(col, row)) {
            const tileLeft = col * TILE_WIDTH;
            const tileRight = tileLeft + TILE_WIDTH;
            const tileTop = row * TILE_HEIGHT;
            const tileBottom = tileTop + TILE_HEIGHT;

            const closestX = Math.max(tileLeft, Math.min(nextX, tileRight));
            const closestY = Math.max(tileTop, Math.min(nextY, tileBottom));
            const distSq = (nextX - closestX) ** 2 + (nextY - closestY) ** 2;

            if (distSq < r * r) {
              collidedY = true;
              if (vy > 0) {
                nextY = tileTop - r - 0.05;
              } else if (vy < 0) {
                nextY = tileBottom + r + 0.05;
              }
            }
          }
        }
      }
    }

    // 3. Resolución estática de penetración (para cuando vx=0, vy=0 o tras empujes/knockback)
    const curMinCol = Math.floor((nextX - r) / TILE_WIDTH);
    const curMaxCol = Math.floor((nextX + r) / TILE_WIDTH);
    const curMinRow = Math.floor((nextY - r) / TILE_HEIGHT);
    const curMaxRow = Math.floor((nextY + r) / TILE_HEIGHT);

    for (let row = curMinRow; row <= curMaxRow; row++) {
      for (let col = curMinCol; col <= curMaxCol; col++) {
        if (this.isCellSolid(col, row)) {
          const tileLeft = col * TILE_WIDTH;
          const tileRight = tileLeft + TILE_WIDTH;
          const tileTop = row * TILE_HEIGHT;
          const tileBottom = tileTop + TILE_HEIGHT;

          const closestX = Math.max(tileLeft, Math.min(nextX, tileRight));
          const closestY = Math.max(tileTop, Math.min(nextY, tileBottom));
          const diffX = nextX - closestX;
          const diffY = nextY - closestY;
          const distSq = diffX * diffX + diffY * diffY;

          if (distSq < r * r && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const overlap = r - dist;
            nextX += (diffX / dist) * overlap;
            nextY += (diffY / dist) * overlap;
          } else if (distSq <= 0.0001) {
            const dL = Math.abs(nextX - tileLeft);
            const dR = Math.abs(nextX - tileRight);
            const dT = Math.abs(nextY - tileTop);
            const dB = Math.abs(nextY - tileBottom);
            const minD = Math.min(dL, dR, dT, dB);
            if (minD === dL) nextX = tileLeft - r - 0.05;
            else if (minD === dR) nextX = tileRight + r + 0.05;
            else if (minD === dT) nextY = tileTop - r - 0.05;
            else nextY = tileBottom + r + 0.05;
          }
        }
      }
    }

    // 4. Delimitación estricta de bordes del mapa
    nextX = Math.max(r + 1, Math.min(this.width - r - 1, nextX));
    nextY = Math.max(r + 1, Math.min(this.height - r - 1, nextY));

    return { x: nextX, y: nextY, collidedX, collidedY };
  }

  // ==========================================
  // RENDERIZADO PROCEDURAL VECTORIAL EN CANVAS
  // ==========================================

  /**
   * Dibuja la capa base de suelo, losas, abismos, runas de arena y altares de checkpoint.
   */
  public renderFloor(ctx: CanvasRenderingContext2D, frustum: FrustumBounds, time: number): void {
    const minCol = Math.max(0, Math.floor(frustum.left / TILE_WIDTH) - 1);
    const maxCol = Math.min(this.cols - 1, Math.ceil(frustum.right / TILE_WIDTH) + 1);
    const minRow = Math.max(0, Math.floor(frustum.top / TILE_HEIGHT) - 1);
    const maxRow = Math.min(this.rows - 1, Math.ceil(frustum.bottom / TILE_HEIGHT) + 1);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = this.grid[r][c];
        const tx = c * TILE_WIDTH;
        const ty = r * TILE_HEIGHT;

        if (tile === TileType.EMPTY) {
          // Vacío exterior
          continue;
        }

        if (tile === TileType.CHASM) {
          this.drawChasmTile(ctx, tx, ty);
          continue;
        }

        // Suelo de losas estándar o arena del jefe
        const isArena = tile === TileType.BOSS_ARENA;
        this.drawFloorTile(ctx, tx, ty, c, r, isArena, time);

        // Decoraciones de suelo adicionales
        if (tile === TileType.CHECKPOINT) {
          const cp = this.checkpoints.find((item) => item.col === c && item.row === r);
          this.drawCheckpointAltar(ctx, tx + TILE_WIDTH / 2, ty + TILE_HEIGHT / 2, cp?.isActive || false, time);
        } else if (tile === TileType.TREASURE) {
          this.drawTreasureCache(ctx, tx + TILE_WIDTH / 2, ty + TILE_HEIGHT / 2, time);
        } else if (tile === TileType.REST) {
          this.drawRestShrine(ctx, tx + TILE_WIDTH / 2, ty + TILE_HEIGHT / 2, time);
        } else if (tile === TileType.MOSS) {
          this.drawMossPatch(ctx, tx, ty);
        }
      }
    }

    // Dibujar el mecanismo de la Rueda Elemental de Hielo si está en rango visible
    if (
      this.puzzleWheel.x >= frustum.left - 100 &&
      this.puzzleWheel.x <= frustum.right + 100 &&
      this.puzzleWheel.y >= frustum.top - 100 &&
      this.puzzleWheel.y <= frustum.bottom + 100
    ) {
      this.drawPuzzleWheel(ctx, this.puzzleWheel, time);
    }

    // Dibujar el Portal de Salida / Fin de Nivel si está en rango visible
    if (
      this.victoryPortal.x >= frustum.left - 120 &&
      this.victoryPortal.x <= frustum.right + 120 &&
      this.victoryPortal.y >= frustum.top - 120 &&
      this.victoryPortal.y <= frustum.bottom + 120
    ) {
      this.drawVictoryPortal(ctx, this.victoryPortal, time);
    }
  }

  /**
   * Dibuja los muros de piedra ancestral con relieve 2.5D, sombras y el portón de hielo.
   * Se invoca en la pasada de ordenamiento en profundidad (Y-sorting).
   */
  public renderWallsAndGates(ctx: CanvasRenderingContext2D, frustum: FrustumBounds, time: number): void {
    const minCol = Math.max(0, Math.floor(frustum.left / TILE_WIDTH) - 1);
    const maxCol = Math.min(this.cols - 1, Math.ceil(frustum.right / TILE_WIDTH) + 1);
    const minRow = Math.max(0, Math.floor(frustum.top / TILE_HEIGHT) - 1);
    const maxRow = Math.min(this.rows - 1, Math.ceil(frustum.bottom / TILE_HEIGHT) + 1);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = this.grid[r][c];
        const tx = c * TILE_WIDTH;
        const ty = r * TILE_HEIGHT;

        if (tile === TileType.WALL) {
          this.drawWallTile(ctx, tx, ty, c, r, time);
        } else if (tile === TileType.GATE) {
          this.drawGate(ctx, tx, ty, this.gate, time);
        }
      }
    }
  }

  /**
   * Inserta cada muro y el portón visible en el renderList de Depth Sorting (Y-sorting),
   * utilizando su base inferior (ty + TILE_HEIGHT) como clave de ordenación.
   */
  public addWallsToRenderList(
    ctx: CanvasRenderingContext2D,
    frustum: FrustumBounds,
    renderList: Array<{ y: number; draw: () => void }>,
    time: number
  ): void {
    const minCol = Math.max(0, Math.floor(frustum.left / TILE_WIDTH) - 1);
    const maxCol = Math.min(this.cols - 1, Math.ceil(frustum.right / TILE_WIDTH) + 1);
    const minRow = Math.max(0, Math.floor(frustum.top / TILE_HEIGHT) - 1);
    const maxRow = Math.min(this.rows - 1, Math.ceil(frustum.bottom / TILE_HEIGHT) + 1);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = this.grid[r][c];
        const tx = c * TILE_WIDTH;
        const ty = r * TILE_HEIGHT;

        if (tile === TileType.WALL) {
          renderList.push({
            y: ty + TILE_HEIGHT,
            draw: () => this.drawWallTile(ctx, tx, ty, c, r, time),
          });
        } else if (tile === TileType.GATE) {
          renderList.push({
            y: ty + TILE_HEIGHT,
            draw: () => this.drawGate(ctx, tx, ty, this.gate, time),
          });
        }
      }
    }
  }

  // --- Sub-renderers de tipos de celda ---

  private drawFloorTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    col: number,
    row: number,
    isArena: boolean,
    time: number
  ): void {
    if (isArena) {
      // 1. Color base de arena abisal del Custodio del Umbral (Losa de piedra abisal)
      ctx.fillStyle = '#18181b';
      ctx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

      // Líneas de mortero de 1 píxel oscuro con resplandor púrpura
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, TILE_WIDTH, TILE_HEIGHT);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.strokeRect(x + 1, y + 1, TILE_WIDTH - 2, TILE_HEIGHT - 2);

      const seed = (col * 17 + row * 31) % 100;
      if (seed < 25) {
        // Runa angular pixelada grabada en el suelo
        ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
        const rx = x + 16 + (seed % 24);
        const ry = y + 16 + ((seed * 3) % 24);
        ctx.fillRect(rx, ry, 6, 2);
        ctx.fillRect(rx + 2, ry - 2, 2, 6);
      }
      return;
    }

    // --- Sendero Natural "La Ruta del Umbral" en Pixel Art 16-Bit ---
    // Losas de piedra y tierra con borde de mortero de 1 píxel oscuro
    const baseHash = (col * 37 + row * 19) % 100;
    ctx.fillStyle = baseHash % 2 === 0 ? '#27272a' : '#3f3f46';
    ctx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

    // Borde de mortero de 1 píxel oscuro (#18181B / #0F172A)
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, TILE_WIDTH, TILE_HEIGHT);

    // Bisel de luz superior interno de 1 píxel en las losas
    ctx.fillStyle = baseHash % 2 === 0 ? '#3f3f46' : '#52525b';
    ctx.fillRect(x + 1, y + 1, TILE_WIDTH - 2, 1);
    ctx.fillRect(x + 1, y + 1, 1, TILE_HEIGHT - 2);

    // Puntos de textura (Dithering) sutiles simulando polvo y pequeñas piedras cuadradas
    // Piedras cuadradas pequeñas (3x3 px)
    if (baseHash < 42) {
      const px = x + 6 + (baseHash % 48);
      const py = y + 6 + ((baseHash * 7) % 48);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 1, py - 1, 5, 5);
      ctx.fillStyle = '#52525b';
      ctx.fillRect(px, py, 3, 3);
      ctx.fillStyle = '#71717a';
      ctx.fillRect(px, py, 1, 1);
    }
    if (baseHash > 55) {
      const px = x + 10 + ((baseHash * 3) % 42);
      const py = y + 10 + ((baseHash * 5) % 42);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 1, py - 1, 4, 4);
      ctx.fillStyle = '#71717a';
      ctx.fillRect(px, py, 2, 2);
    }

    // Dithering de grano de polvo (1x1 px)
    const dustX1 = x + ((col * 13 + row * 7) % 56) + 4;
    const dustY1 = y + ((col * 9 + row * 17) % 56) + 4;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(dustX1, dustY1, 1, 1);
    ctx.fillRect(dustX1 + 4, dustY1 + 6, 1, 1);

    // Briznas de hierba silvestre en escalones de píxeles (sin curvas suaves)
    if (baseHash % 4 === 0) {
      const gx = x + 8 + (baseHash % 44);
      const gy = y + 18 + ((baseHash * 4) % 32);
      ctx.fillStyle = '#14532d';
      ctx.fillRect(gx, gy, 2, 6);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(gx - 2, gy - 2, 2, 4);
      ctx.fillRect(gx + 2, gy - 3, 2, 5);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(gx - 2, gy - 4, 1, 2);
      ctx.fillRect(gx + 3, gy - 5, 1, 2);
    }

    // Faroles Rúnicos Guía: Cada 60 columnas a lo largo del sendero
    if (col > 0 && col % 60 === 0 && (row === 4 || row === 7)) {
      this.drawLanternWaypoint(ctx, x, y, col, row, time);
    }
  }

  /**
   * Dibuja faroles rúnicos protectores en bloques de Pixel Art 16-Bit.
   */
  private drawLanternWaypoint(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    col: number,
    row: number,
    time: number
  ): void {
    const cx = x + TILE_WIDTH / 2;
    const cy = y + TILE_HEIGHT / 2;

    // Pedestal de piedra rúnica
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 7, cy + 1, 14, 14);
    ctx.fillStyle = '#27272a';
    ctx.fillRect(cx - 6, cy + 2, 12, 12);

    // Poste vertical en bloques de 2 píxeles
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 3, cy - 15, 6, 18);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(cx - 2, cy - 14, 4, 16);

    // Corona metálica del farol
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 6, cy - 22, 12, 12);
    ctx.fillStyle = '#78716c';
    ctx.fillRect(cx - 5, cy - 21, 10, 10);

    // Fuego rúnico azul en píxeles (pulso en 2 estados)
    const pulse = Math.floor(time * 6 + col) % 2 === 0;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx - 3, cy - 19, 6, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 2, cy - 18, 4, 4);
    if (pulse) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 1, cy - 17, 2, 2);
    }
  }

  private drawWallTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    col: number,
    row: number,
    time: number
  ): void {
    const wallHeight = 22; // Elevación isométrica 2.5D hacia arriba

    // 1. Sombra de oclusión ambiental en la base
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x - 2, y + TILE_HEIGHT - 4, TILE_WIDTH + 4, 8);

    // 2. Base de mampostería de roca ancestral (Relieve 2.5D con juntas pixeladas)
    ctx.fillStyle = '#171a28';
    ctx.fillRect(x, y + TILE_HEIGHT - wallHeight, TILE_WIDTH, wallHeight);

    // Juntas de sillería en el frente (bloques rectangulares)
    ctx.strokeStyle = '#0f111a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y + TILE_HEIGHT - wallHeight, TILE_WIDTH, wallHeight);
    ctx.beginPath();
    ctx.moveTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT - wallHeight);
    ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT);
    ctx.stroke();

    // 3. Cara superior del muro
    ctx.fillStyle = '#2b3147';
    ctx.fillRect(x, y - wallHeight, TILE_WIDTH, TILE_HEIGHT);

    // Borde biselado superior con luz (1-2 píxeles)
    ctx.fillStyle = '#414a6b';
    ctx.fillRect(x, y - wallHeight, TILE_WIDTH, 2);
    ctx.fillRect(x, y - wallHeight, 2, TILE_HEIGHT);

    // Borde oscuro inferior de la cara superior
    ctx.fillStyle = '#1e2233';
    ctx.fillRect(x, y - wallHeight + TILE_HEIGHT - 2, TILE_WIDTH, 2);
    ctx.fillRect(x + TILE_WIDTH - 2, y - wallHeight, 2, TILE_HEIGHT);

    // 4. Copas de árboles escalonadas en pirámide con 3 verdes delimitados
    // Cero bolas verdes circulares: pirámide escalonada en 3 verdes y tronco de madera oscura
    const seed = (col * 23 + row * 41) % 100;
    const isPerimeter = row <= 2 || row >= this.rows - 3 || col === 0 || col === this.cols - 1;

    if (isPerimeter || seed < 65) {
      // Tronco visible de madera oscura en bloques de 2 píxeles
      ctx.fillStyle = '#0f172a'; // Contorno tronco
      const trunkW = 10;
      const trunkX = x + TILE_WIDTH / 2 - trunkW / 2 + ((seed % 11) - 5);
      const trunkY = y - wallHeight + 4;
      ctx.fillRect(trunkX - 1, trunkY, trunkW + 2, 18);

      ctx.fillStyle = '#1c1917';
      ctx.fillRect(trunkX, trunkY, trunkW, 17);
      ctx.fillStyle = '#451a03'; // Núcleo madera
      ctx.fillRect(trunkX + 2, trunkY, 4, 17);

      // Copas de follaje escalonadas en pirámide de 3 niveles superpuestos
      const treeCx = x + TILE_WIDTH / 2 + ((seed % 15) - 7);
      const treeBaseY = y - wallHeight;

      // Nivel 1: Verde sombra base (#14532D) - Escalonado ancho
      ctx.fillStyle = '#0f172a'; // Contorno
      ctx.fillRect(treeCx - 23, treeBaseY - 15, 46, 17);
      ctx.fillStyle = '#14532d';
      ctx.fillRect(treeCx - 22, treeBaseY - 14, 44, 15);
      // Detalle escalonado en bordes
      ctx.fillRect(treeCx - 20, treeBaseY - 16, 40, 2);

      // Nivel 2: Verde medio (#15803D) - Escalonado medio
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(treeCx - 17, treeBaseY - 27, 34, 15);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(treeCx - 16, treeBaseY - 26, 32, 13);
      ctx.fillRect(treeCx - 14, treeBaseY - 28, 28, 2);

      // Nivel 3: Puntos de luz en la cresta (#22C55E) - Cúspide piramidal
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(treeCx - 11, treeBaseY - 37, 22, 12);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(treeCx - 10, treeBaseY - 36, 20, 10);
      // Cresta luminosa
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(treeCx - 6, treeBaseY - 35, 12, 4);
      ctx.fillRect(treeCx - 3, treeBaseY - 38, 6, 3);
      ctx.fillRect(treeCx - 1, treeBaseY - 40, 2, 2);
    } else if (seed < 85) {
      // En monolitos internos de piedra, runas doradas ancestrales en escalones de píxeles
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      const runeBlink = Math.floor(time * 3 + col) % 2 === 0;
      if (runeBlink) {
        ctx.fillRect(x + 20, y - wallHeight + 14, 8, 2);
        ctx.fillRect(x + 24, y - wallHeight + 16, 2, 8);
        ctx.fillRect(x + 20, y - wallHeight + 24, 10, 2);
      }
      ctx.restore();
    }
  }

  private drawChasmTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Fondo abisal profundo
    ctx.fillStyle = '#05070e';
    ctx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

    // Borde de acantilado en escalón pixelado
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, TILE_WIDTH, 6);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, TILE_WIDTH, 3);

    // Dientes de roca fracturada en escalones de píxeles
    ctx.fillStyle = '#27272a';
    ctx.fillRect(x + 4, y + 2, 10, 4);
    ctx.fillRect(x + 22, y + 2, 14, 6);
    ctx.fillRect(x + 44, y + 2, 12, 4);
  }

  private drawTreasureCache(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number): void {
    const blink = Math.floor(time / 260) % 2 === 0;
    ctx.save();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.16)';
    ctx.fillRect(cx - 26, cy - 22, 52, 42);
    ctx.fillStyle = '#151525';
    ctx.fillRect(cx - 18, cy - 8, 36, 22);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(cx - 16, cy - 6, 32, 18);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 17, cy - 10, 34, 7);
    ctx.fillRect(cx - 2, cy - 8, 4, 22);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(cx - 14, cy - 8, 28, 2);
    if (blink) { ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 1, cy - 16, 3, 3); }
    ctx.restore();
  }

  private drawRestShrine(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number): void {
    const pulse = 0.45 + (Math.sin(time / 280) + 1) * 0.18;
    ctx.save();
    ctx.fillStyle = `rgba(74, 222, 128, ${pulse})`;
    ctx.fillRect(cx - 16, cy - 24, 32, 36);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 12, cy - 14, 24, 26);
    ctx.fillStyle = '#166534';
    ctx.fillRect(cx - 10, cy - 12, 20, 22);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(cx - 3, cy - 20, 6, 28);
    ctx.fillRect(cx - 9, cy - 4, 18, 4);
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(cx - 1, cy - 14, 2, 14);
    ctx.restore();
  }

  private drawMossPatch(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#14532d';
    ctx.fillRect(x + 10, y + 32, 42, 12);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + 15, y + 28, 8, 7);
    ctx.fillRect(x + 31, y + 25, 7, 10);
    ctx.fillRect(x + 43, y + 30, 5, 6);
  }

  private drawCheckpointAltar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    isActive: boolean,
    time: number
  ): void {
    ctx.save();

    // 1. Santuario octagonal de bloques de piedra en el suelo
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 24, cy - 14, 48, 28);
    ctx.fillRect(cx - 20, cy - 18, 40, 36);

    ctx.fillStyle = isActive ? '#14532d' : '#1e293b';
    ctx.fillRect(cx - 22, cy - 12, 44, 24);
    ctx.fillRect(cx - 18, cy - 16, 36, 32);

    // Borde de runa dorada
    ctx.fillStyle = isActive ? '#facc15' : '#475569';
    ctx.fillRect(cx - 16, cy - 10, 32, 2);
    ctx.fillRect(cx - 16, cy + 8, 32, 2);
    ctx.fillRect(cx - 16, cy - 10, 2, 20);
    ctx.fillRect(cx + 14, cy - 10, 2, 20);

    // 2. Cristal flotante central en diamante de píxeles (pulso en 2 estados)
    const floatStep = Math.floor(time * 4) % 2 === 0 ? 0 : 2;
    const crystalY = cy - 14 + floatStep;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 7, crystalY - 11, 14, 22);
    ctx.fillRect(cx - 10, crystalY - 7, 20, 14);

    ctx.fillStyle = isActive ? '#fef08a' : '#94a3b8';
    ctx.fillRect(cx - 5, crystalY - 9, 10, 18);
    ctx.fillRect(cx - 8, crystalY - 5, 16, 10);

    // Núcleo brillante
    ctx.fillStyle = isActive ? '#ffffff' : '#e2e8f0';
    ctx.fillRect(cx - 2, crystalY - 3, 4, 6);

    ctx.restore();
  }

  private drawGate(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    gate: TilemapGate,
    time: number
  ): void {
    ctx.save();
    const cx = x + TILE_WIDTH / 2;
    const cy = y + TILE_HEIGHT / 2;

    // 1. Pilares de piedra a los costados del portón
    ctx.fillStyle = '#1e2233';
    ctx.strokeStyle = '#3b4261';
    ctx.lineWidth = 2;

    // Pilar Superior
    ctx.fillRect(x + 2, y - 16, 12, 32);
    ctx.strokeRect(x + 2, y - 16, 12, 32);

    // Pilar Inferior
    ctx.fillRect(x + 2, y + TILE_HEIGHT - 16, 12, 32);
    ctx.strokeRect(x + 2, y + TILE_HEIGHT - 16, 12, 32);

    // 2. Rejas / Barrera de Hielo del Portón
    const openOffset = gate.openProgress * (TILE_HEIGHT - 8);

    if (gate.openProgress < 1.0) {
      // Bloque de hielo y barrotes
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.rect(x + 14, y + 4 + openOffset, TILE_WIDTH - 28, TILE_HEIGHT - 8 - openOffset);
      ctx.fill();
      ctx.stroke();

      // Barrotes verticales rúnicos
      for (let bx = x + 20; bx <= x + TILE_WIDTH - 20; bx += 8) {
        ctx.beginPath();
        ctx.moveTo(bx, y + 4 + openOffset);
        ctx.lineTo(bx, y + TILE_HEIGHT - 4);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Cerradura rúnica en el centro
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(cx, cy + openOffset / 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Portón abierto: halo místico invitando al paso
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawPuzzleWheel(
    ctx: CanvasRenderingContext2D,
    wheel: TilemapPuzzleWheel,
    time: number
  ): void {
    ctx.save();
    ctx.translate(wheel.x, wheel.y);

    // 1. Base de piedra en el suelo
    ctx.fillStyle = '#1e2235';
    ctx.strokeStyle = '#38415f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Anillo de progreso de congelación
    const progressAngle = (wheel.charge / 100) * Math.PI * 2;
    ctx.strokeStyle = wheel.isCompleted ? '#38bdf8' : '#0284c7';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = wheel.hitFlash > 0 ? 20 : (wheel.isCompleted ? 14 : 6);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + progressAngle);
    ctx.stroke();

    // 3. Rueda dentada interior
    ctx.rotate(wheel.rotation);
    ctx.strokeStyle = wheel.isCompleted ? '#e0f2fe' : '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
    }
    ctx.stroke();

    // Orbe de escarcha en el centro
    ctx.fillStyle = wheel.isCompleted ? '#38bdf8' : '#0369a1';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Dibuja el Portal Ancestral de Victoria y Fin del Nivel al final del sendero del jefe.
   */
  private drawVictoryPortal(
    ctx: CanvasRenderingContext2D,
    portal: { x: number; y: number; radius: number; isActive: boolean },
    time: number
  ): void {
    const px = portal.x;
    const py = portal.y;

    ctx.save();

    // 1. Base ceremonial octagonal de piedra
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = portal.isActive ? '#f59e0b' : '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, portal.radius + 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Anillo de runas de teletransporte
    const ringPulse = portal.isActive ? Math.sin(time * 3) * 0.15 + 0.85 : 0.4;
    ctx.strokeStyle = portal.isActive ? 'rgba(56, 189, 248, 0.85)' : 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, py, portal.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Vórtice etéreo giratorio
    const rotSpeed = portal.isActive ? time * 1.8 : time * 0.4;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rotSpeed);

    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, portal.radius * ringPulse);
    if (portal.isActive) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.85)');
      grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.6)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    } else {
      grad.addColorStop(0, '#334155');
      grad.addColorStop(0.6, 'rgba(30, 41, 59, 0.5)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, portal.radius * ringPulse, 0, Math.PI * 2);
    ctx.fill();

    // Rayos en espiral
    const rays = 6;
    for (let i = 0; i < rays; i++) {
      const angle = (Math.PI * 2 / rays) * i;
      ctx.strokeStyle = portal.isActive ? 'rgba(253, 224, 71, 0.7)' : 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(
        Math.cos(angle + 0.5) * (portal.radius * 0.6),
        Math.sin(angle + 0.5) * (portal.radius * 0.6),
        Math.cos(angle) * (portal.radius * ringPulse),
        Math.sin(angle) * (portal.radius * ringPulse)
      );
      ctx.stroke();
    }
    ctx.restore();

    // Partículas vectoriales doradas y cian absorbidas hacia el centro del vórtice
    if (portal.isActive) {
      const partCount = 14;
      for (let p = 0; p < partCount; p++) {
        const pProg = ((time * 1.6 + p / partCount) % 1.0);
        const pDist = portal.radius * (1.0 - pProg);
        const pAngle = time * 3.4 + p * (Math.PI * 2 / partCount);
        const pxp = px + Math.cos(pAngle) * pDist;
        const pyp = py + Math.sin(pAngle) * pDist * 0.58;
        ctx.fillStyle = p % 2 === 0 ? '#38bdf8' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(pxp, pyp, 2.2 + (1.0 - pProg) * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Cartel flotante indicador de Fin del Nivel
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (portal.isActive) {
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.fillText('✨ ¡PORTAL DE VICTORIA ACTIVO! ✨', px, py - portal.radius - 16);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Pisa el vórtice para terminar el nivel', px, py - portal.radius - 4);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('🔒 PORTAL ANCESTRAL (FIN DE NIVEL)', px, py - portal.radius - 12);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Derrota al Custodio del Umbral para abrirlo', px, py - portal.radius - 2);
    }

    ctx.restore();
  }
}
