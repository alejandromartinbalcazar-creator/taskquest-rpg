import { ElementType, SpellRecipe, SpellCastType } from './types';

export const RECIPES: Record<SpellCastType, SpellRecipe> = {
  basic_spark: {
    id: 'basic_spark',
    name: 'Chispa Arcana',
    elements: [],
    description: 'Proyectil mágico básico rápido de energía pura.',
    icon: '✨',
    color: '#94a3b8',
    secondaryColor: '#cbd5e1',
    damage: 16,
    knockback: 1.5,
    cooldownMs: 250,
  },

  // 1 Elemento
  fire_shot: {
    id: 'fire_shot',
    name: 'Flujo de Llamas',
    elements: ['fire'],
    description: 'Canalización continua de fuego: rocía un chorro ardiente que incinera y quema en el área.',
    icon: '🔥',
    color: '#ef4444',
    secondaryColor: '#f97316',
    damage: 28,
    knockback: 2.2,
    cooldownMs: 150,
  },
  lightning_bolt: {
    id: 'lightning_bolt',
    name: 'Descarga Voltaica',
    elements: ['lightning'],
    description: 'Rayo veloz que perfora e interrumpe ataques enemigos con una sacudida eléctrica.',
    icon: '⚡',
    color: '#eab308',
    secondaryColor: '#fde047',
    damage: 24,
    knockback: 1.0,
    cooldownMs: 280,
  },
  ice_shard: {
    id: 'ice_shard',
    name: 'Chorro Criogénico',
    elements: ['ice'],
    description: 'Canalización continua de frío: haz de ventisca helada que daña periódicamente y ralentiza un 55%.',
    icon: '❄️',
    color: '#06b6d4',
    secondaryColor: '#67e8f9',
    damage: 22,
    knockback: 1.8,
    cooldownMs: 150,
  },
  earth_toss: {
    id: 'earth_toss',
    name: 'Peñasco Contundente',
    elements: ['earth'],
    description: 'Lanza una pesada roca que aplasta enemigos y deja un pequeño escombro protector.',
    icon: '🌍',
    color: '#84cc16',
    secondaryColor: '#a16207',
    damage: 32,
    knockback: 4.5,
    cooldownMs: 350,
  },

  // Elementos Puros Concentrados (2 o más del mismo elemento)
  fire_inferno: {
    id: 'fire_inferno',
    name: 'Corona Infernal',
    elements: ['fire', 'fire'],
    description: 'Onda ígnea expansiva que fija una corona de llamas persistentes en el suelo y culmina en una colosal detonación centrípeta.',
    icon: '👑🔥',
    color: '#ea580c',
    secondaryColor: '#fde047',
    damage: 32,
    knockback: 7.0,
    cooldownMs: 5000,
  },
  lightning_storm: {
    id: 'lightning_storm',
    name: 'Tormenta de Rayos',
    elements: ['lightning', 'lightning'],
    description: 'Cadena eléctrica que salta violentamente entre múltiples enemigos.',
    icon: '⚡⚡',
    color: '#facc15',
    secondaryColor: '#ffffff',
    damage: 42,
    knockback: 2.0,
    cooldownMs: 380,
  },
  ice_lance: {
    id: 'ice_lance',
    name: 'Ventisca Glacial Continua',
    elements: ['ice', 'ice'],
    description: 'Torrente de frío absoluto concentrado que ralentiza y acumula congelación profunda.',
    icon: '❄️🧊',
    color: '#38bdf8',
    secondaryColor: '#e0f2fe',
    damage: 38,
    knockback: 2.2,
    cooldownMs: 150,
  },
  earth_megalith: {
    id: 'earth_megalith',
    name: 'Megalito Terrestre',
    elements: ['earth', 'earth'],
    description: 'Erige un pilar de piedra indestructible que desvía ataques y bloquea enemigos.',
    icon: '🗿🛡️',
    color: '#65a30d',
    secondaryColor: '#78350f',
    damage: 55,
    knockback: 6.0,
    cooldownMs: 450,
  },

  // LAS 6 COMBINACIONES PRIORITARIAS DE 2 ELEMENTOS
  thermal_shock: {
    id: 'thermal_shock',
    name: 'Choque Térmico',
    elements: ['fire', 'ice'],
    description: 'Onda de vapor a alta presión. Causa daño demoledor x2.5 si el enemigo estaba congelado.',
    icon: '♨️💥',
    color: '#f43f5e',
    secondaryColor: '#38bdf8',
    damage: 58,
    knockback: 5.5,
    cooldownMs: 450,
    selfDamageRisk: 0.2,
  },
  magma_eruption: {
    id: 'magma_eruption',
    name: 'Erupción de Magma',
    elements: ['fire', 'earth'],
    description: 'Abre una fisura volcánica incandescente en el suelo que incinera el paso enemigo.',
    icon: '🌋🔥',
    color: '#ea580c',
    secondaryColor: '#b45309',
    damage: 64,
    knockback: 4.8,
    cooldownMs: 480,
  },
  crystal_field: {
    id: 'crystal_field',
    name: 'Campo de Cristales Energizados',
    elements: ['lightning', 'earth'],
    description: 'Hace brotar 3 cristales de cuarzo que transmiten arcos eléctricos letales continuos.',
    icon: '💎⚡',
    color: '#eab308',
    secondaryColor: '#84cc16',
    damage: 52,
    knockback: 2.5,
    cooldownMs: 450,
  },
  cryo_storm: {
    id: 'cryo_storm',
    name: 'Tormenta Criogénica',
    elements: ['lightning', 'ice'],
    description: 'Ventisca electrificada que congela y salta con descargas críticas entre enemigos húmedos.',
    icon: '❄️⚡',
    color: '#06b6d4',
    secondaryColor: '#eab308',
    damage: 54,
    knockback: 3.2,
    cooldownMs: 440,
  },
  permafrost_prison: {
    id: 'permafrost_prison',
    name: 'Prisión de Permafrost',
    elements: ['ice', 'earth'],
    description: 'Pilares gemelos de roca y hielo que atrapan a enemigos ligeros y bloquean proyectiles.',
    icon: '🧊🏛️',
    color: '#0284c7',
    secondaryColor: '#4d7c0f',
    damage: 45,
    knockback: 3.0,
    cooldownMs: 460,
  },
  explosive_overload: {
    id: 'explosive_overload',
    name: 'Sobrecarga Explosiva',
    elements: ['fire', 'lightning'],
    description: 'Bólido de plasma hipersónico que explota violentamente con aturdimiento y onda de choque.',
    icon: '⚡💥',
    color: '#a855f7',
    secondaryColor: '#f97316',
    damage: 68,
    knockback: 6.2,
    cooldownMs: 480,
    selfDamageRisk: 0.25,
  },

  // COMBINACIONES AVANZADAS DE 3 ELEMENTOS
  obsidian_volcano: {
    id: 'obsidian_volcano',
    name: 'Volcán de Obsidiana',
    elements: ['fire', 'ice', 'earth'],
    description: 'Erupción de vidrio volcánico cortante y rocas candentes en un radio masivo.',
    icon: '🌋💎',
    color: '#c026d3',
    secondaryColor: '#ea580c',
    damage: 85,
    knockback: 6.5,
    cooldownMs: 600,
  },
  conductive_prison: {
    id: 'conductive_prison',
    name: 'Prisión Conductora',
    elements: ['lightning', 'ice', 'earth'],
    description: 'Jaula electromagnética de roca y hielo que inmoviliza y electrocuta periódicamente.',
    icon: '⚡🧊',
    color: '#0ea5e9',
    secondaryColor: '#facc15',
    damage: 78,
    knockback: 4.0,
    cooldownMs: 580,
  },
  overload_core: {
    id: 'overload_core',
    name: 'Núcleo de Sobrecarga',
    elements: ['fire', 'lightning', 'earth'],
    description: 'Dispositivo thermo-magnético inestable que atrae monstruos antes de detonar en gran escala.',
    icon: '💣⚡',
    color: '#f97316',
    secondaryColor: '#e11d48',
    damage: 96,
    knockback: 8.0,
    cooldownMs: 650,
    selfDamageRisk: 0.35,
  },

  // COMBINACIÓN SUPREMA DE 4 ELEMENTOS
  elemental_cataclysm: {
    id: 'elemental_cataclysm',
    name: 'Cataclismo Elemental',
    elements: ['fire', 'lightning', 'ice', 'earth'],
    description: '¡EL HECHIZO DEFINITIVO! Grieta sísmica, vórtice glacial, descargas celestiales y llamarada total.',
    icon: '🪐✨',
    color: '#ec4899',
    secondaryColor: '#fbbf24',
    damage: 150,
    knockback: 10.0,
    cooldownMs: 900,
    selfDamageRisk: 0.4,
  },
};

/**
 * Motor de resolución de combinaciones elementales.
 * Independiente del orden en que el jugador haya pulsado los elementos.
 */
export function identifyRecipe(elements: ElementType[]): SpellRecipe {
  if (!elements || elements.length === 0) {
    return RECIPES.basic_spark;
  }

  const count = (el: ElementType) => elements.filter((e) => e === el).length;
  const hasFire = count('fire') > 0;
  const hasLightning = count('lightning') > 0;
  const hasIce = count('ice') > 0;
  const hasEarth = count('earth') > 0;

  // 1. Cataclismo Elemental (4 elementos distintos)
  if (hasFire && hasLightning && hasIce && hasEarth) {
    return RECIPES.elemental_cataclysm;
  }

  // 2. Combinaciones de 3 Elementos
  if (hasFire && hasIce && hasEarth) {
    return RECIPES.obsidian_volcano;
  }
  if (hasLightning && hasIce && hasEarth) {
    return RECIPES.conductive_prison;
  }
  if (hasFire && hasLightning && hasEarth) {
    return RECIPES.overload_core;
  }
  // Si tiene Fuego + Rayo + Hielo (variante de Choque Sobrecargado)
  if (hasFire && hasLightning && hasIce) {
    return RECIPES.explosive_overload;
  }

  // 3. Las 6 Combinaciones Prioritarias de 2 Elementos
  if (hasFire && hasIce) {
    return RECIPES.thermal_shock;
  }
  if (hasFire && hasEarth) {
    return RECIPES.magma_eruption;
  }
  if (hasLightning && hasEarth) {
    return RECIPES.crystal_field;
  }
  if (hasLightning && hasIce) {
    return RECIPES.cryo_storm;
  }
  if (hasIce && hasEarth) {
    return RECIPES.permafrost_prison;
  }
  if (hasFire && hasLightning) {
    return RECIPES.explosive_overload;
  }

  // 4. Elementos Puros Concentrados (múltiples del mismo elemento)
  if (count('fire') >= 2) return RECIPES.fire_inferno;
  if (count('lightning') >= 2) return RECIPES.lightning_storm;
  if (count('ice') >= 2) return RECIPES.ice_lance;
  if (count('earth') >= 2) return RECIPES.earth_megalith;

  // 5. Elementos Únicos
  if (hasFire) return RECIPES.fire_shot;
  if (hasLightning) return RECIPES.lightning_bolt;
  if (hasIce) return RECIPES.ice_shard;
  if (hasEarth) return RECIPES.earth_toss;

  return RECIPES.basic_spark;
}
