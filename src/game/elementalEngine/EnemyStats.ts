// EnemyStats.ts — Configuración Centralizada de Estadísticas, Salud Base y Físicas del Bestiario
// Rebalance de dificultad para escuadrones del sendero extendido (Nivel 1)

export interface EnemyStatConfig {
  name: string;
  maxHp: number;
  attackPower: number;
  moveSpeed: number;
  radius: number;
  weakness: 'fire' | 'ice' | 'lightning' | 'earth';
  resistance: 'fire' | 'ice' | 'lightning' | 'earth';
  attackMaxCooldown: number;
  telegraphMax: number;
  description: string;
}

export const ENEMY_BASE_STATS: Record<'pyre_golem' | 'storm_stalker' | 'frost_lurker', EnemyStatConfig> = {
  /**
   * Gólem de Escoria Ígnea (Tanque Melé Pesado)
   * HP Anterior: 120 - 150 HP (o 220)
   * Nuevo HP Base: 320 HP
   * Propósito táctico: Soportar la aproximación obligando a lanzar Hielo (❄️) para enfriar su magma y asestar críticos.
   */
  pyre_golem: {
    name: 'Gólem de Escoria Ígnea',
    maxHp: 320,
    attackPower: 28,
    moveSpeed: 0.72,
    radius: 24,
    weakness: 'ice',
    resistance: 'fire',
    attackMaxCooldown: 110,
    telegraphMax: 35,
    description: 'Tanque ígneo de alta armadura. Requiere Hielo para fracturar su coraza magmática.',
  },

  /**
   * Espectro de Tormenta (Flanqueador Rápido)
   * HP Anterior: 60 - 80 HP (o 130)
   * Nuevo HP Base: 160 HP
   * Propósito táctico: Resistir chispas accidentales y forzar el uso de Tierra (🌍) para derribarlo y frenar su traslación.
   */
  storm_stalker: {
    name: 'Espectro de Tormenta',
    maxHp: 160,
    attackPower: 14,
    moveSpeed: 1.05,
    radius: 18,
    weakness: 'earth',
    resistance: 'lightning',
    attackMaxCooldown: 140,
    telegraphMax: 30,
    description: 'Hostigador eléctrico ágil. Susceptible al impacto sístmico de Tierra.',
  },

  /**
   * Acechador de Escarcha (Francotirador a Distancia)
   * HP Anterior: 70 - 90 HP (o 160)
   * Nuevo HP Base: 180 HP
   * Propósito táctico: Obligar a utilizar cobertura o proyectiles de Fuego (🔥) para disolver su barrera gélida frontal.
   */
  frost_lurker: {
    name: 'Acechador de Escarcha',
    maxHp: 180,
    attackPower: 14,
    moveSpeed: 0.85,
    radius: 20,
    weakness: 'fire',
    resistance: 'ice',
    attackMaxCooldown: 160,
    telegraphMax: 35,
    description: 'Francotirador gélido con escudo frontal refractario. Débil ante el Fuego continuo.',
  },
};

/**
 * Constantes de Físicas de Separación (Flocking / Soft Push)
 */
export const ENEMY_PHYSICS_CONFIG = {
  repulsionRadius: 24,         // Radio base de repulsión entre centros de masa
  minSeparationPadding: 8,     // Margen adicional entre radios físicos
  maxRepulsionForce: 3.5,      // Velocidad máxima de deslizamiento de separación por fotograma
  damping: 0.5,                // Factor de amortiguación para evitar oscilaciones
};
