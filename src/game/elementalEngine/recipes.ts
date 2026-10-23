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
    cooldownMs: 0,
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
    cooldownMs: 0,
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
    cooldownMs: 0,
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
    cooldownMs: 0,
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
    cooldownMs: 0,
  },

  // Elementos Puros Concentrados (2 o más del mismo elemento)
  fire_inferno: {
    id: 'fire_inferno',
    name: 'Pilar Ígneo',
    elements: ['fire', 'fire'],
    description: 'Proyecta una detonación a distancia que erupciona en un devastador geiser de fuego y deja un cráter de ascuas ardientes.',
    icon: '🌋🔥',
    color: '#ea580c',
    secondaryColor: '#fde047',
    damage: 38,
    knockback: 6.5,
    cooldownMs: 0,
  },
  lightning_storm: {
    id: 'lightning_storm',
    name: 'Sobrecarga Voltaica',
    elements: ['lightning', 'lightning'],
    description: 'Acumula energía eléctrica y la libera en una devastadora descarga en cadena. A carga máxima, invoca un relámpago colosal y remate voltaico.',
    icon: '⚡⚡',
    color: '#38bdf8',
    secondaryColor: '#ffffff',
    damage: 42,
    knockback: 3.5,
    cooldownMs: 0,
  },
  ice_lance: {
    id: 'ice_lance',
    name: 'Erupción Glacial',
    elements: ['ice', 'ice'],
    description: 'Desata una línea escalonada de púas de hielo gigantes que emergen del suelo, levantando enemigos y congelándolos.',
    icon: '❄️🏔️',
    color: '#06b6d4',
    secondaryColor: '#e0f7fa',
    damage: 48,
    knockback: 4.5,
    cooldownMs: 0,
  },
  earth_megalith: {
    id: 'earth_megalith',
    name: 'Puño Tectónico',
    elements: ['earth', 'earth'],
    description: 'Colosal puño de roca que brota violentamente del suelo, elevando e interrumpiendo enemigos y dejando escombros como cobertura temporal.',
    icon: '👊🌍',
    color: '#d97706',
    secondaryColor: '#78350f',
    damage: 64,
    knockback: 7.5,
    cooldownMs: 0,
  },

  // LAS 6 COMBINACIONES PRIORITARIAS DE 2 ELEMENTOS
  thermal_shock: {
    id: 'thermal_shock',
    name: 'Vórtice de Choque Térmico',
    elements: ['fire', 'ice'],
    description: 'Violenta expansión radial de vapor a alta presión que empuja a los enemigos cercanos y detona críticamente (x2.4 de daño y aturdimiento) a quienes tengan escarcha o congelación previa.',
    icon: '♨️💥',
    color: '#f43f5e',
    secondaryColor: '#38bdf8',
    damage: 56,
    knockback: 8.5,
    cooldownMs: 0,
  },
  magma_eruption: {
    id: 'magma_eruption',
    name: 'Bombardeo Volcánico',
    elements: ['fire', 'earth'],
    description: 'Abre múltiples fisuras magmáticas que erupcionan en columnas de lava y proyectan bombas balísticas incandescentes. Carga breve para +50% de daño y 5 fisuras.',
    icon: '🌋🔥',
    color: '#ea580c',
    secondaryColor: '#f97316',
    damage: 72,
    knockback: 5.5,
    cooldownMs: 0,
  },
  crystal_field: {
    id: 'crystal_field',
    name: 'Jaula de Pilares Conductores',
    elements: ['lightning', 'earth'],
    description: 'Hace brotar monolitos conductores que forman un recinto cerrado con arcos voltaicos continuos. Carga breve para 4 pilares (+50% daño y arcos cruzados).',
    icon: '⚡🏛️',
    color: '#eab308',
    secondaryColor: '#f59e0b',
    damage: 34,
    knockback: 4.5,
    cooldownMs: 0,
  },
  cryo_storm: {
    id: 'cryo_storm',
    name: 'Rayo Criogénico',
    elements: ['ice', 'lightning'],
    description: 'Haz penetrante de plasma gélido que electrocuta y congela simultáneamente. Se dispara al instante o mantén pulsado para +50% de daño.',
    icon: '❄️⚡',
    color: '#00f0ff',
    secondaryColor: '#7c4dff',
    damage: 26,
    knockback: 1.8,
    cooldownMs: 0,
  },
  permafrost_prison: {
    id: 'permafrost_prison',
    name: 'Prisión de Permafrost',
    elements: ['ice', 'earth'],
    description: 'Emerge una barricada de monolitos de roca reforzados con permafrost que bloquean proyectiles y confinan enemigos. Al quebrarse o expirar estallan en metralla radial.',
    icon: '❄️🌍',
    color: '#00e5ff',
    secondaryColor: '#38bdf8',
    damage: 48,
    knockback: 4.0,
    cooldownMs: 0,
  },
  explosive_overload: {
    id: 'explosive_overload',
    name: 'Tornado de Plasma',
    elements: ['fire', 'lightning'],
    description: 'Proyecta un torbellino acelerado de fuego y electricidad que succiona enemigos y desintegra proyectiles hostiles antes de colapsar en una detonación terminal.',
    icon: '🌪️⚡',
    color: '#00e5ff',
    secondaryColor: '#ff6d00',
    damage: 64,
    knockback: 5.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },

  // COMBINACIONES AVANZADAS DE 3 ELEMENTOS
  hell_rain: {
    id: 'hell_rain',
    name: 'Lluvia del Infierno',
    elements: ['fire', 'fire', 'fire'],
    description: 'Catástrofe aérea masiva: descarga una salva secuencial de meteoritos balísticos incandescentes que pulverizan el cuadrante y dejan cráteres de magma ardiente. Carga breve para invocar 6 meteoritos con un impacto final colosal y +50% de daño.',
    icon: '☄️🔥',
    color: '#ff3d00',
    secondaryColor: '#ffd600',
    damage: 95,
    knockback: 6.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  celestial_storm: {
    id: 'celestial_storm',
    name: 'Tormenta Celestial',
    elements: ['lightning', 'lightning', 'lightning'],
    description: 'Tempestad fulminante de alto voltaje: ioniza el cuadrante marcando el suelo y descarga relámpagos verticales en cascada que electrocutan a los objetivos y dejan charcos de estática. Carga breve para invocar 6 relámpagos con un rayo colosal final y +50% de daño.',
    icon: '⚡🌩️',
    color: '#00f0ff',
    secondaryColor: '#7c4dff',
    damage: 90,
    knockback: 5.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  devastating_glacier: {
    id: 'devastating_glacier',
    name: 'Glaciar Devastador',
    elements: ['ice', 'ice', 'ice'],
    description: 'Cataclismo ártico: desata una ventisca gélida que ralentiza severamente el área mientras caen pesados monolitos de hielo prismático, culminando en una erupción sísmica radial de agujas glaciales que congelan a los supervivientes. Carga breve para expandir el radio en un +35%, añadir 2 monolitos y +50% de daño.',
    icon: '🏔️❄️',
    color: '#00e5ff',
    secondaryColor: '#e0f7fa',
    damage: 92,
    knockback: 6.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  telluric_barrier: {
    id: 'telluric_barrier',
    name: 'Barrera Telúrica',
    elements: ['earth', 'earth', 'earth'],
    description: 'Escudo cinético móvil: invoca 3 monolitos de roca sedimentaria que orbitan durante 20s. Interceptan proyectiles hostiles y detonan contra enemigos infligiendo daño masivo e interrupción. Carga breve para mayor tamaño, +50% de daño de contacto y absorción reforzada.',
    icon: '🛡️🌍',
    color: '#78350f',
    secondaryColor: '#f59e0b',
    damage: 88,
    knockback: 7.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  obsidian_volcano: {
    id: 'obsidian_volcano',
    name: 'Volcán de Obsidiana',
    elements: ['fire', 'ice', 'earth'],
    description: 'Erupción piroclástica que vitrifica al instante en un campo de cuchillas de obsidiana negra cortante y ralentizante.',
    icon: '🌋🖤',
    color: '#0f172a',
    secondaryColor: '#ea580c',
    damage: 86,
    knockback: 7.2,
    cooldownMs: 0,
  },
  conductive_prison: {
    id: 'conductive_prison',
    name: 'Prisión Conductora',
    elements: ['lightning', 'ice', 'earth'],
    description: 'Jaula de pilares criotécnicos y valla de alto voltaje que encierra, ralentiza y detona en implosión reactiva.',
    icon: '⚡❄️🏛️',
    color: '#7c4dff',
    secondaryColor: '#00e5ff',
    damage: 82,
    knockback: 5.5,
    cooldownMs: 0,
  },
  overload_core: {
    id: 'overload_core',
    name: 'Núcleo de Sobrecarga',
    elements: ['fire', 'lightning', 'earth'],
    description: 'Artefacto inestable que acumula sobrecarga en 3 niveles y detona en una supernova geológica.',
    icon: '💣⚡',
    color: '#ff6d00',
    secondaryColor: '#ffd600',
    damage: 92,
    knockback: 8.5,
    cooldownMs: 0,
  },
  glacial_plasma_storm: {
    id: 'glacial_plasma_storm',
    name: 'Tormenta de Plasma Glacial',
    elements: ['fire', 'lightning', 'ice'],
    description: 'Vórtice móvil que combina escarcha ralentizante, filamentos voltaicos encadenados y una colosal implosión térmica con remate centrífugo.',
    icon: '🌪️❄️⚡',
    color: '#00e5ff',
    secondaryColor: '#ff6d00',
    damage: 88,
    knockback: 9.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },

  // TRIPLES MIXTAS - DOMINANCIA FUEGO (Cooldown: 0)
  magma_trench: {
    id: 'magma_trench',
    name: 'Trinchera de Magma',
    elements: ['fire', 'fire', 'earth'],
    description: 'Abre una grieta de magma en el suelo durante 2.5s que calcina continuamente e inflige una ralentización del 35%.',
    icon: '🌋🔥',
    color: '#ea580c',
    secondaryColor: '#fde047',
    damage: 34,
    knockback: 2.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  thermal_deflagration: {
    id: 'thermal_deflagration',
    name: 'Deflagración Térmica',
    elements: ['fire', 'fire', 'ice'],
    description: 'Proyectil veloz de vapor y fuego que detona en 70px, inflige daño explosivo, micro-empuje y fractura la armadura (+30% daño por 4s).',
    icon: '💥❄️',
    color: '#ef4444',
    secondaryColor: '#38bdf8',
    damage: 78,
    knockback: 4.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  solar_fusion_beam: {
    id: 'solar_fusion_beam',
    name: 'Haz de Fusión Solar',
    elements: ['fire', 'fire', 'lightning'],
    description: 'Haz penetrante continuo de plasma de 400px durante 500ms que perfora a todos los enemigos con 4 impactos ultra-rápidos.',
    icon: '☀️⚡',
    color: '#facc15',
    secondaryColor: '#ffffff',
    damage: 28,
    knockback: 1.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },

  // TRIPLES MIXTAS - DOMINANCIA HIELO (Cooldown: 0)
  glacial_avalanche: {
    id: 'glacial_avalanche',
    name: 'Alud Telúrico',
    elements: ['ice', 'ice', 'earth'],
    description: 'Emergen 3 estalagmitas colosales de hielo y roca en un cono frontal, infligiendo daño contundente masivo y microaturdimiento (0.8s).',
    icon: '🏔️🌍',
    color: '#38bdf8',
    secondaryColor: '#27272a',
    damage: 82,
    knockback: 6.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  boiling_hail: {
    id: 'boiling_hail',
    name: 'Granizo Hirviente',
    elements: ['ice', 'ice', 'fire'],
    description: 'Descarga una lluvia rápida de 6 carámbanos incandescentes en un área de 90px que dañan por frío y detonan en vapor quemante.',
    icon: '☄️❄️',
    color: '#7dd3fc',
    secondaryColor: '#ea580c',
    damage: 26,
    knockback: 2.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  superconductor_blizzard: {
    id: 'superconductor_blizzard',
    name: 'Ventisca Conductora',
    elements: ['ice', 'ice', 'lightning'],
    description: 'Vórtice crioelectrostático persistente de 80px durante 2s que ralentiza un 50%, daña por pulsos y genera arcos voltaicos entre enemigos.',
    icon: '🌪️⚡',
    color: '#bae6fd',
    secondaryColor: '#a855f7',
    damage: 24,
    knockback: 1.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },

  // TRIPLES MIXTAS - DOMINANCIA RAYO (Cooldown: 0)
  lightning_rod_pylon: {
    id: 'lightning_rod_pylon',
    name: 'Pilón de Pararrayos',
    elements: ['lightning', 'lightning', 'earth'],
    description: 'Planta un obelisco conductor que atrae magnéticamente a los enemigos en 90px y descarga rayos radiales cada 500ms durante 3s.',
    icon: '⚡🌍',
    color: '#facc15',
    secondaryColor: '#1e293b',
    damage: 34,
    knockback: 1.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  plasma_hyper_orb: {
    id: 'plasma_hyper_orb',
    name: 'Bomba de Plasma',
    elements: ['lightning', 'lightning', 'fire'],
    description: 'Lanza un pesado orbe de plasma inestable que viaja emitiendo chispas y detona en una violenta supernova de 80px con daño masivo y fuerte empuje.',
    icon: '💥⚡',
    color: '#a855f7',
    secondaryColor: '#ea580c',
    damage: 96,
    knockback: 8.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  cryo_arc_flash: {
    id: 'cryo_arc_flash',
    name: 'Descarga Cero Absoluto',
    elements: ['lightning', 'lightning', 'ice'],
    description: 'Libera un pulso electromagnético criogénico en abanico frontal de 120° y 260px, causando daño eléctrico y congelación/parálisis absoluta garantizada de 1.5s.',
    icon: '⚡❄️',
    color: '#38bdf8',
    secondaryColor: '#e0f2fe',
    damage: 48,
    knockback: 2.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },

  // TRIPLES MIXTAS - DOMINANCIA TIERRA (Cooldown: 0)
  rolling_magma_boulder: {
    id: 'rolling_magma_boulder',
    name: 'Megalito Rodante',
    elements: ['earth', 'earth', 'fire'],
    description: 'Rueda un megalito masivo de basalto y lava de 28px de radio hasta 320px que arrolla enemigos y estalla en un radio de 65px.',
    icon: '🪨🔥',
    color: '#ea580c',
    secondaryColor: '#3f3f46',
    damage: 88,
    knockback: 7.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  glacial_bastion: {
    id: 'glacial_bastion',
    name: 'Bastión Glacial',
    elements: ['earth', 'earth', 'ice'],
    description: 'Erupción radial de púas petrificadas y permafrost en 360° (radio 110px) que repele enemigos, ralentiza un 40% y mitiga daño durante 2s.',
    icon: '🏰❄️',
    color: '#7dd3fc',
    secondaryColor: '#1e293b',
    damage: 54,
    knockback: 6.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  resonant_quake: {
    id: 'resonant_quake',
    name: 'Fisura Resonante',
    elements: ['earth', 'earth', 'lightning'],
    description: 'Genera 3 ondas de choque sucesivas en abanico frontal de 90° hasta 240px que agrietan el suelo con descargas estáticas, micro-aturdiendo 0.4s y quebrando escudos.',
    icon: '⚡🌍',
    color: '#facc15',
    secondaryColor: '#78350f',
    damage: 62,
    knockback: 3.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },

  // =========================================================================
  // NIVEL 4 — CUÁDRUPLES PURAS MONOELEMENTALES (Tier 4, Cooldown: 0)
  // =========================================================================
  thundergod_judgment: {
    id: 'thundergod_judgment',
    name: 'Juicio del Trueno',
    elements: ['lightning', 'lightning', 'lightning', 'lightning'],
    description: 'Invoca un rayo colosal vertical de 60px de ancho que impacta en área (120px), desintegra proyectiles hostiles y paraliza 1.5s.',
    icon: '⚡👑',
    color: '#ffffff',
    secondaryColor: '#a855f7',
    damage: 195,
    knockback: 9.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  primordial_supernova: {
    id: 'primordial_supernova',
    name: 'Supernova Primordial',
    elements: ['fire', 'fire', 'fire', 'fire'],
    description: 'Proyecta un sol colosal que estalla en 140px de radio, infligiendo daño ígneo masivo y cubriendo el suelo de lava ardiente durante 3.5s.',
    icon: '☀️🔥',
    color: '#fde047',
    secondaryColor: '#ea580c',
    damage: 210,
    knockback: 10.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  absolute_zero_age: {
    id: 'absolute_zero_age',
    name: 'Era Glacial',
    elements: ['ice', 'ice', 'ice', 'ice'],
    description: 'Congelación expansiva en pantalla completa centrada en el mago. Congela a todos los enemigos durante 3s y destruye proyectiles en vuelo.',
    icon: '❄️🌐',
    color: '#bae6fd',
    secondaryColor: '#38bdf8',
    damage: 130,
    knockback: 3.0,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },
  tectonic_cataclysm: {
    id: 'tectonic_cataclysm',
    name: 'Cataclismo Tectónico',
    elements: ['earth', 'earth', 'earth', 'earth'],
    description: 'Terremoto en el área visible con 4 monolitos colosales que emergen y colapsan, causando daño masivo, aturdimiento de 2s y micro-empuje.',
    icon: '🌋🌍',
    color: '#78350f',
    secondaryColor: '#3f3f46',
    damage: 175,
    knockback: 8.5,
    cooldownMs: 0,
    selfDamageRisk: 0,
  },

  // COMBINACIÓN SUPREMA DE 4 ELEMENTOS (Única con Cooldown)
  elemental_cataclysm: {
    id: 'elemental_cataclysm',
    name: 'Cataclismo Elemental',
    elements: ['fire', 'lightning', 'ice', 'earth'],
    description: '¡EL PODER DEFINITIVO! Fractura tectónica, erupción de magma, cero absoluto y relámpago titánico terminal.',
    icon: '🪐✨',
    color: '#ec4899',
    secondaryColor: '#fbbf24',
    damage: 260,
    knockback: 12.0,
    cooldownMs: 14000,
    selfDamageRisk: 0,
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

  // 1.1 Nivel 4 - Cuádruples Puras Monoelementales (cooldown: 0)
  if (count('lightning') >= 4) return RECIPES.thundergod_judgment;
  if (count('fire') >= 4) return RECIPES.primordial_supernova;
  if (count('ice') >= 4) return RECIPES.absolute_zero_age;
  if (count('earth') >= 4) return RECIPES.tectonic_cataclysm;

  // 1.5 Combinaciones Triples Puras (3 o más elementos idénticos)
  if (count('fire') >= 3) {
    return RECIPES.hell_rain;
  }
  if (count('lightning') >= 3) {
    return RECIPES.celestial_storm;
  }
  if (count('ice') >= 3) {
    return RECIPES.devastating_glacier;
  }
  if (count('earth') >= 3) {
    return RECIPES.telluric_barrier;
  }

  // 2. Combinaciones de 3 Elementos Distintos
  if (hasFire && hasIce && hasEarth) {
    return RECIPES.obsidian_volcano;
  }
  if (hasLightning && hasIce && hasEarth) {
    return RECIPES.conductive_prison;
  }
  if (hasFire && hasLightning && hasEarth) {
    return RECIPES.overload_core;
  }
  // Si tiene Fuego + Rayo + Hielo (Tormenta de Plasma Glacial)
  if (hasFire && hasLightning && hasIce) {
    return RECIPES.glacial_plasma_storm;
  }

  // 2.5 Triples Mixtas - Dominancia Fuego (cooldown: 0)
  if (count('fire') === 2 && count('earth') === 1) return RECIPES.magma_trench;
  if (count('fire') === 2 && count('ice') === 1) return RECIPES.thermal_deflagration;
  if (count('fire') === 2 && count('lightning') === 1) return RECIPES.solar_fusion_beam;

  // 2.6 Triples Mixtas - Dominancia Hielo (cooldown: 0)
  if (count('ice') === 2 && count('earth') === 1) return RECIPES.glacial_avalanche;
  if (count('ice') === 2 && count('fire') === 1) return RECIPES.boiling_hail;
  if (count('ice') === 2 && count('lightning') === 1) return RECIPES.superconductor_blizzard;

  // 2.7 Triples Mixtas - Dominancia Rayo (cooldown: 0)
  if (count('lightning') === 2 && count('earth') === 1) return RECIPES.lightning_rod_pylon;
  if (count('lightning') === 2 && count('fire') === 1) return RECIPES.plasma_hyper_orb;
  if (count('lightning') === 2 && count('ice') === 1) return RECIPES.cryo_arc_flash;

  // 2.8 Triples Mixtas - Dominancia Tierra (cooldown: 0)
  if (count('earth') === 2 && count('fire') === 1) return RECIPES.rolling_magma_boulder;
  if (count('earth') === 2 && count('ice') === 1) return RECIPES.glacial_bastion;
  if (count('earth') === 2 && count('lightning') === 1) return RECIPES.resonant_quake;

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
