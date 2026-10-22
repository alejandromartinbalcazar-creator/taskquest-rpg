// TrailSegments.ts — Módulos de Sendero Ensamblables de 40x12 y 60x12 para "La Ruta del Umbral" (Nivel 1)
// Cada módulo respeta el contrato de continuidad horizontal: filas 4 a 7 transitables (.) en los bordes.
// Alta densidad de enemigos: patrullas continuas, enjambres y emboscadas tácticas frecuentes.

/**
 * SEGMENT_START (40x12): Santuario Inicial de Partida
 * Muro oeste cerrado (col 0 en #), spawn del héroe 'P' en (col 3, fila 5).
 * Encuentros introductorios progresivos en cols 16, 24 y 32.
 * Salida este abierta en filas 4 a 7.
 */
export const SEGMENT_START: string[] = [
  "########################################", // 0
  "########################################", // 1
  "#####..............................#####", // 2
  "####................................####", // 3
  "##..............2.......................", // 4 (Storm Stalker explorador col 16)
  "##.P................2...........2.......", // 5 (Spawn P en col 3, contenido a la izquierda por muros sólidos)
  "##..............1.......3...............", // 6 (Pyre Golem col 16, Frost Lurker col 24)
  "##..............................2.......", // 7 (Storm Stalker col 32)
  "####................................####", // 8
  "#####..............................#####", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_A (40x12): El Sendero Boscoso (Escuadrones Continuos)
 * - Escuadrón 1 (cols 8-12): Vanguardia Gólem ('1') con 2 Acechadores ('3') en flancos.
 * - Escuadrón 2 (cols 18-22): 2 Gólems ('1') + 2 Espectros ('2') de flanqueo.
 * - Escuadrón 3 (cols 28-32): Pinza de Acechadores ('3') con apoyo de Espectro ('2').
 * - Escuadrón 4 (cols 36-38): Dúo de Gólem ('1') y Espectro ('2').
 */
export const SEGMENT_A: string[] = [
  "########################################", // 0
  "########################################", // 1
  "####.....#########........######....####", // 2
  "###.......#######..........####......###", // 3
  "........3...........2.......3.......2...", // 4
  "............1...1.......3.......1.......", // 5
  "............1...........2...........1...", // 6
  "........3...........2.......3...........", // 7
  "###......########..........####......###", // 8
  "####....##########........######....####", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_B (40x12): La Garganta de Piedra (Enjambres y Monolitos de Cobertura)
 * - Escuadrón 1 (cols 6-12): Trío de Espectros ('2') en abanico relámpago.
 * - Escuadrón 2 (cols 18-24): 2 Gólems ('1') tras monolitos y 2 Acechadores ('3').
 * - Escuadrón 3 (cols 28-36): Pinza mixta de Espectros ('2'), Acechador ('3') y Gólem ('1').
 */
export const SEGMENT_B: string[] = [
  "########################################", // 0
  "########################################", // 1
  "####......######################....####", // 2
  "###........####################......###", // 3
  "......2.....2.......3.......2.......3...", // 4
  "......###.......2...###.1...........2...", // 5
  "......###...........###.1.......1.......", // 6
  "......2.............3.......2...........", // 7
  "###........####################......###", // 8
  "####......######################....####", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_C (40x12): Las Orillas del Río (Francotiradores de Zanja y Tapón de Puente)
 * - Escuadrón 1 (cols 4-8): 2 Acechadores ('3') en vanguardia de agua.
 * - Escuadrón 2 (cols 18-22): 2 Gólems ('1') y 2 Espectros ('2') cerrando el paso del puente.
 * - Escuadrón 3 (cols 28-36): Francotiradores a través del abismo ('3') con patrulla de refuerzo.
 */
export const SEGMENT_C: string[] = [
  "########################################", // 0
  "########################################", // 1
  "####.....~~~~~~~~3~~~~~~~~.....#########", // 2
  "###......~~~~~~~~~~~~~~~~~......########", // 3
  "..........~~~~~~~..~~~~~~~..2.......3...", // 4
  "....3...............1...1...............", // 5
  "....3...............2...2.......1.......", // 6
  "..........~~~~~~~..~~~~~~~..........3...", // 7
  "###......~~~~~~~~~~~~~~~~~......########", // 8
  "####...................~~~~~~~~3~~######", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_D (40x12): El Santuario Intermedio (Emboscada Masiva de Checkpoint)
 * - Escuadrón 1 (cols 6-10): Guardia pesada de entrada (2 Gólems '1' + 1 Espectro '2').
 * - Escuadrón 2 (cols 12-16): Emboscada densa de Altar (2 Gólems '1' + 2 Acechadores '3' + 2 Espectros '2').
 * - Altar Checkpoint 'C' en col 24 para vincular punto de control tras el combate.
 * - Escuadrón 3 (cols 32-36): Retaguardia mixta (2 Espectros '2' + 1 Acechador '3').
 */
export const SEGMENT_D: string[] = [
  "########################################", // 0
  "########################################", // 1
  "####................................####", // 2
  "###..................................###", // 3
  "......1...3.........2...............2...", // 4
  "......1.......1.........C...........3...", // 5
  "..........3...1.....................2...", // 6
  "......2.............2...................", // 7
  "###..................................###", // 8
  "####................................####", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_E (40x12): El Desfiladero Final y Portón de Hielo (Guardia Masiva de Élite)
 * - 4 oleadas consecutivas de escuadrones custodiando la aproximación al Portón ('D') y la rueda elemental.
 * - Portón de Hielo ('D') en col 37, filas 5 y 6.
 */
export const SEGMENT_E: string[] = [
  "########################################", // 0
  "########################################", // 1
  "####.....#########........######....####", // 2
  "###.......#######..........####......###", // 3
  "......1.......3.....2.......3...1....#..", // 4
  "......1...2.......1.....1.......2....D..", // 5
  "..........2...3...1.....1.......1....D..", // 6
  "......2.......3.....2.......3...2....#..", // 7
  "###......########..........####......###", // 8
  "####....##########........######....####", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_BOSS (60x12): Gran Explanada del Custodio del Umbral
 * Monumental arena octagonal con celdas de arena ('B'), este completamente sellado (#).
 * Centinelas de honor a la entrada ('2' y '3') y centro ceremonial del Coloso.
 */
export const SEGMENT_BOSS: string[] = [
  "############################################################", // 0
  "############################################################", // 1
  "####........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB........####", // 2
  "###.......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......###", // 3
  "....2...BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....####", // 4
  "....3..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB...####", // 5
  "....2..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB...####", // 6
  "....3...BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....####", // 7
  "###.......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......###", // 8
  "####........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB........####", // 9
  "############################################################", // 10
  "############################################################", // 11
];
