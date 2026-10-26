// Nivel 1 — El Gran Sendero. Primer tramo artesanal de la campaña.
// 43 x 16 celdas de 64px = 2752 x 1024px, alineado al fondo panorámico.

const COLS = 43;
const ROWS = 16;

function createForestTrailLevel(): string[] {
  const grid: string[][] = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, () => (row >= 6 && row <= 9 ? '.' : '#'))
  );

  // Inicio, patrullas medidas y portón congelado al extremo derecho.
  grid[7][3] = 'P';
  grid[7][13] = '1';
  grid[8][20] = '2';
  grid[7][27] = '3';
  grid[8][34] = '1';
  grid[7][39] = 'C';
  grid[7][40] = 'D';
  grid[8][40] = 'D';
  grid[7][41] = 'B';
  grid[8][41] = 'B';

  return grid.map((row) => row.join(''));
}

export const LEVEL_1_LAYOUT: string[] = createForestTrailLevel();
