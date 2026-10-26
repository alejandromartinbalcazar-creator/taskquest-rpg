// Nivel 1 — El Gran Sendero. Primer tramo artesanal de la campaña.
// 56 x 19 celdas de 64px = 3584 x 1216px, alineado al fondo panorámico.

const COLS = 56;
const ROWS = 19;

function createForestTrailLevel(): string[] {
  // El detalle de paso lo resuelve la máscara por píxel; esta cuadrícula solo
  // delimita el mundo y conserva spawns, portal y lógica de combate.
  const grid: string[][] = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, () => (row === 0 || row === ROWS - 1 ? '#' : '.'))
  );

  // Inicio, patrullas medidas y portón congelado al extremo derecho.
  // Punto comprobado sobre la zona verde de la máscara, no dentro del arco.
  grid[10][8] = 'P';
  grid[9][18] = '1';
  grid[10][27] = '2';
  grid[9][35] = '3';
  grid[10][43] = '1';
  grid[9][48] = 'C';
  grid[9][51] = 'D';
  grid[10][51] = 'D';
  grid[9][53] = 'B';
  grid[10][53] = 'B';

  return grid.map((row) => row.join(''));
}

export const LEVEL_1_LAYOUT: string[] = createForestTrailLevel();
