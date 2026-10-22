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
          this.checkpoints.push({
            id: `checkpoint-ancient-step-${this.checkpoints.length + 1}`,
            name: 'Altar de los Antiguos',
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
          rowTiles.push(TileType.BOSS_ARENA);
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
    }

    // Ubicar la rueda elemental cerca del portón para el puzle de hielo
    if (this.gate.col > 3) {
      this.puzzleWheel = {
        x: (this.gate.col - 3) * TILE_WIDTH + TILE_WIDTH / 2,
        y: 2 * TILE_HEIGHT + TILE_HEIGHT / 2,
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
    // 1. Color base de losas
    ctx.fillStyle = isArena ? '#1a101f' : '#141724';
    ctx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

    // 2. Líneas de mortero y subdivisiones de baldosas de piedra (4 losas por celda)
    ctx.strokeStyle = isArena ? 'rgba(88, 28, 135, 0.35)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 1, y + 1, TILE_WIDTH - 2, TILE_HEIGHT - 2);

    ctx.beginPath();
    ctx.moveTo(x + TILE_WIDTH / 2, y);
    ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT);
    ctx.moveTo(x, y + TILE_HEIGHT / 2);
    ctx.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2);
    ctx.stroke();

    // 3. Biselado sutil de iluminación en borde superior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.fillRect(x + 2, y + 2, TILE_WIDTH - 4, 2);
    ctx.fillRect(x + 2, y + 2, 2, TILE_HEIGHT - 4);

    // 4. Glifos rúnicos arcanos aleatorios según semilla de celda
    const seed = (col * 17 + row * 31) % 100;
    if (seed < 16) {
      ctx.save();
      ctx.strokeStyle = isArena ? 'rgba(244, 63, 94, 0.28)' : 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 1;
      const rx = x + 16 + (seed % 32);
      const ry = y + 16 + ((seed * 3) % 32);
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, Math.PI * 2);
      ctx.moveTo(rx - 8, ry);
      ctx.lineTo(rx + 8, ry);
      ctx.stroke();
      ctx.restore();
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
    ctx.fillRect(x - 2, y + TILE_HEIGHT - 4, TILE_WIDTH + 4, 10);

    // 2. Cara frontal del bloque de piedra (Sombra/Relieve)
    ctx.fillStyle = '#171a28';
    ctx.fillRect(x, y + TILE_HEIGHT - wallHeight, TILE_WIDTH, wallHeight);

    // Juntas de sillería en el frente
    ctx.strokeStyle = '#0f111a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y + TILE_HEIGHT - wallHeight, TILE_WIDTH, wallHeight);

    // 3. Cara superior del muro (Iluminada y transitable visualmente por encima)
    ctx.fillStyle = '#2b3147';
    ctx.fillRect(x, y - wallHeight, TILE_WIDTH, TILE_HEIGHT);

    // Borde biselado superior con luz
    ctx.fillStyle = '#414a6b';
    ctx.fillRect(x, y - wallHeight, TILE_WIDTH, 2);
    ctx.fillRect(x, y - wallHeight, 2, TILE_HEIGHT);

    // Borde oscuro inferior de la cara superior
    ctx.fillStyle = '#1e2233';
    ctx.fillRect(x, y - wallHeight + TILE_HEIGHT - 2, TILE_WIDTH, 2);
    ctx.fillRect(x + TILE_WIDTH - 2, y - wallHeight, 2, TILE_HEIGHT);

    // Grietas y runas antiguas grabadas en algunos bloques
    const seed = (col * 23 + row * 41) % 100;
    if (seed < 22) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 4;
      ctx.globalAlpha = 0.35 + Math.sin(time * 2 + col) * 0.15;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 18, y - wallHeight + 14);
      ctx.lineTo(x + 28, y - wallHeight + 28);
      ctx.lineTo(x + 44, y - wallHeight + 20);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawChasmTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Fondo abisal profundo
    ctx.fillStyle = '#05070e';
    ctx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

    // Gradiente de borde de acantilado
    const grad = ctx.createRadialGradient(
      x + TILE_WIDTH / 2,
      y + TILE_HEIGHT / 2,
      4,
      x + TILE_WIDTH / 2,
      y + TILE_HEIGHT / 2,
      TILE_WIDTH / 2
    );
    grad.addColorStop(0, '#020308');
    grad.addColorStop(1, '#0e1220');
    ctx.fillStyle = grad;
    ctx.fillRect(x + 2, y + 2, TILE_WIDTH - 4, TILE_HEIGHT - 4);

    // Dientes de roca fracturada en los bordes
    ctx.fillStyle = '#1c2236';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 14, y + 6);
    ctx.lineTo(x + 28, y);
    ctx.lineTo(x + 46, y + 8);
    ctx.lineTo(x + TILE_WIDTH, y);
    ctx.lineTo(x + TILE_WIDTH, y + 4);
    ctx.lineTo(x, y + 4);
    ctx.closePath();
    ctx.fill();
  }

  private drawCheckpointAltar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    isActive: boolean,
    time: number
  ): void {
    ctx.save();

    // 1. Aura circular pulsante en el suelo
    const pulse = Math.sin(time * 3) * 3;
    const ringRadius = 24 + pulse;

    ctx.strokeStyle = isActive ? '#fbbf24' : '#64748b';
    ctx.shadowColor = isActive ? '#f59e0b' : '#334155';
    ctx.shadowBlur = isActive ? 14 : 4;
    ctx.lineWidth = isActive ? 2.5 : 1.5;

    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Glifo rúnico interior giratorio
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.4);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      ctx.moveTo(Math.cos(ang) * 6, Math.sin(ang) * 6);
      ctx.lineTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Cristal flotante central
    const floatY = cy - 12 + Math.sin(time * 4) * 4;
    ctx.fillStyle = isActive ? '#fef08a' : '#94a3b8';
    ctx.shadowColor = isActive ? '#facc15' : '#475569';
    ctx.shadowBlur = isActive ? 16 : 4;
    ctx.beginPath();
    ctx.moveTo(cx, floatY - 9);
    ctx.lineTo(cx + 6, floatY);
    ctx.lineTo(cx, floatY + 9);
    ctx.lineTo(cx - 6, floatY);
    ctx.closePath();
    ctx.fill();

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
}
