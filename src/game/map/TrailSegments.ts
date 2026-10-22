// TrailSegments.ts — Módulos de Sendero Ensamblables de 40x12 y 60x12 para "La Ruta del Umbral" (Nivel 1)
// Cada módulo respeta el contrato de continuidad horizontal: filas 4 a 7 transitables (.) en los bordes.
// Reconfiguración táctica de escuadrones, formaciones de enjambre y emboscadas compuestas.

/**
 * SEGMENT_START (40x12): Santuario Inicial de Partida
 * Muro oeste cerrado (col 0 en #), spawn del héroe 'P' en (col 3, fila 5).
 * Explorador inicial de tormenta ('2') en col 32 para calentamiento previo al sendero denso.
 * Salida este abierta en filas 4 a 7.
 */
export const SEGMENT_START: string[] = [
  "########################################", // 0
  "########################################", // 1
  "#####..............................#####", // 2
  "####................................####", // 3
  "#.......................................", // 4
  "#..P........................2...........", // 5 (P en col 3, Storm Stalker explorador en col 28)
  "#.......................................", // 6
  "#.......................................", // 7
  "####................................####", // 8
  "#####..............................#####", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_A (40x12): El Sendero Boscoso (Escuadrón Vanguardia y Fuego de Cobertura)
 * - Escuadrón 1 (cols 12-16): 1 Gólem en vanguardia ('1') con 2 Acechadores de Escarcha ('3') cubriendo desde los flancos traseros.
 * - Escuadrón 2 (cols 26-30): Pareja coordinada de Espectros de Tormenta ('2') en pinza lateral.
 */
export const SEGMENT_A: string[] = [
  "########################################", // 0
  "########################################", // 1
  "####.....#########........######....####", // 2
  "###.......#######..........####......###", // 3
  "............3...............2...........", // 4 (Frost Lurker flanco norte col 12, Storm Stalker col 28)
  "................1.......................", // 5 (Pyre Golem vanguardia col 16)
  "............................2...........", // 6 (Storm Stalker flanco sur col 28)
  "............3...........................", // 7 (Frost Lurker flanco sur col 12)
  "###......########..........####......###", // 8
  "####....##########........######....####", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_B (40x12): La Garganta de Piedra (Enjambre de Relámpago y Emboscada de Monolito)
 * - Escuadrón 1 (cols 12-16): Formación triangular de 3 Espectros de Tormenta ('2') entre las rocas.
 * - Escuadrón 2 (cols 24-28): Dúo táctico con Gólem ('1') y Acechador de Escarcha ('3') cubriéndose tras monolitos (###).
 */
export const SEGMENT_B: string[] = [
  "########################################", // 0
  "########################################", // 1
  "####......######################....####", // 2
  "###........####################......###", // 3
  "............2...................3.......", // 4 (Storm Stalker norte col 12, Frost Lurker col 32)
  "......###.......2....###................", // 5 (Storm Stalker centro col 16, monolitos tácticos)
  "......###............###....1...........", // 6 (Pyre Golem col 28 tras el monolito)
  "............2...........................", // 7 (Storm Stalker sur col 12)
  "###........####################......###", // 8
  "####......######################....####", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_C (40x12): Las Orillas del Río (Francotiradores Cruzados y Guardia del Puente)
 * - 2 Merodeadores de Escarcha ('3') en nichos abisales disparando a través del agua (~).
 * - 1 Gólem ('1') tapando el acceso del puente principal y 1 Espectro ('2') acosando desde el cruce.
 */
export const SEGMENT_C: string[] = [
  "########################################", // 0
  "########################################", // 1
  "####.....~~~~~~~~3~~~~~~~~.....#########", // 2 (Frost Lurker francotirador norte col 17)
  "###......~~~~~~~~~~~~~~~~~......########", // 3
  "..........~~~~~~~..~~~~~~~..............", // 4
  "....................1...................", // 5 (Pyre Golem guardapuente col 20)
  "........................2...............", // 6 (Storm Stalker flanqueador col 24)
  "..........~~~~~~~..~~~~~~~..............", // 7
  "###......~~~~~~~~~~~~~~~~~......########", // 8
  "####...................~~~~~~~~3~~######", // 9 (Frost Lurker francotirador sur col 31)
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_D (40x12): El Santuario Intermedio (Emboscada Mixta de Punto de Control)
 * - Formación densa previa al Altar Checkpoint ('C'): 2 Gólems de Escoria ('1') + 1 Espectro ('2') + 2 Acechadores ('3').
 * - Altar Checkpoint 'C' situado en col 24, fila 5 para recuperar y guardar tras la victoria táctica.
 */
export const SEGMENT_D: string[] = [
  "########################################", // 0
  "########################################", // 1
  "####................................####", // 2
  "###..................................###", // 3
  "..........3.........2...................", // 4 (Frost Lurker col 10, Storm Stalker col 20)
  "..............1.........C...............", // 5 (Pyre Golem 1 col 14, Checkpoint Altar col 24)
  "..............1.........................", // 6 (Pyre Golem 2 col 14)
  "..........3.............................", // 7 (Frost Lurker col 10)
  "###..................................###", // 8
  "####................................####", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_E (40x12): El Desfiladero Final y Portón de Hielo (Guardia Pre-Portón de Élite)
 * - Formación pesada custodiando la aproximación: 2 Gólems ('1') + 2 Espectros ('2') + 2 Acechadores ('3').
 * - Portón de Hielo ('D') en col 37, filas 5 y 6 que se desbloquea tras resolver el puzle elemental de la rueda.
 */
export const SEGMENT_E: string[] = [
  "########################################", // 0
  "########################################", // 1
  "####.....#########........######....####", // 2
  "###.......#######..........####......###", // 3
  "..................2...........2......#..", // 4 (Storm Stalkers en cols 18 y 30, muro col 37)
  "......3.......1......................D..", // 5 (Frost Lurker col 6, Pyre Golem col 14, Portón col 37)
  "..........3.......1..................D..", // 6 (Frost Lurker col 10, Pyre Golem col 18, Portón col 37)
  ".....................................#..", // 7 (Muro col 37)
  "###......########..........####......###", // 8
  "####....##########........######....####", // 9
  "########################################", // 10
  "########################################", // 11
];

/**
 * SEGMENT_BOSS (60x12): Gran Explanada del Custodio del Umbral
 * Monumental arena octagonal con celdas de arena ('B'), este completamente sellado (#).
 */
export const SEGMENT_BOSS: string[] = [
  "############################################################", // 0
  "############################################################", // 1
  "####........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB........####", // 2
  "###.......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......###", // 3
  "........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....####", // 4
  ".......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB...####", // 5
  ".......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB...####", // 6
  "........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB....####", // 7
  "###.......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.......###", // 8
  "####........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB........####", // 9
  "############################################################", // 10
  "############################################################", // 11
];
