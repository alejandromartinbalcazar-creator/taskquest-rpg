// Nivel 2 — Campamento Glacial, mismo tamaño panorámico que el Nivel 1.
const COLS = 56;
const ROWS = 19;

function createIceCampLevel(): string[] {
  const grid: string[][] = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, () => (row === 0 || row === ROWS - 1 ? '#' : '.'))
  );

  // El spawn está sobre el verde de la máscara. Todos los encuentros son de hielo.
  grid[12][8] = 'P';
  grid[11][18] = '3';
  grid[12][28] = '3';
  grid[12][38] = '3';
  grid[12][45] = '3';
  grid[10][51] = 'C';
  grid[9][53] = 'D';
  grid[10][53] = 'D';
  return grid.map((row) => row.join(''));
}

export const LEVEL_2_LAYOUT = createIceCampLevel();
