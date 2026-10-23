export type ChangeType = 'feature' | 'fix' | 'balance' | 'engine';

export interface VersionChange {
  type: ChangeType;
  description: string;
}

export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  changes: VersionChange[];
}

export const CHANGELOG_DATA: VersionEntry[] = [
  {
    version: '0.5.0',
    date: '2026-10-23',
    title: 'Habilidades Cuádruples Puras Tier 4 y Optimización Móvil 60 FPS',
    changes: [
      {
        type: 'engine',
        description: 'Optimización de Rendimiento Móvil: Object Pooling de memoria fija con ParticlePool (máx 250) y ProjectilePool (máx 100) para eliminar picos de Garbage Collector y micro-stuttering en Android WebView.',
      },
      {
        type: 'engine',
        description: 'Batching de Color en Canvas 2D: Agrupación de dibujado por paletas cromáticas dominantes, reduciendo cientos de llamadas a ctx.fillStyle y eliminando ctx.save() y ctx.restore() del bucle de partículas.',
      },
      {
        type: 'engine',
        description: 'Aceleración GPU en Canvas: Inclusión de will-change: transform; transform: translateZ(0) y contexto 2D desincronizado (desynchronized: true) con cache de referencia para 60 FPS estables.',
      },
      {
        type: 'feature',
        description: 'Juicio del Dios del Trueno (Rayo x4): Habilidad Cuádruple Pura Tier 4 con haz vertical colosal de 60px, desintegración de proyectiles hostiles en 120px, parálisis de 1.5s y 0 cooldown.',
      },
      {
        type: 'feature',
        description: 'Supernova Primordial (Fuego x4): Habilidad Cuádruple Pura Tier 4 con sol colosal de plasma que detona en 140px y deja el suelo cubierto de lava ardiente durante 3.5 segundos con 0 cooldown.',
      },
      {
        type: 'feature',
        description: 'Era Glacial (Hielo x4): Habilidad Cuádruple Pura Tier 4 con congelación de pantalla completa durante 3 segundos, destrucción de proyectiles y viñeta de escarcha procedural (0 cooldown).',
      },
      {
        type: 'feature',
        description: 'Cataclismo Tectónico (Tierra x4): Habilidad Cuádruple Pura Tier 4 con terremoto masivo, 4 monolitos de piedra colapsables, aturdimiento de 2 segundos y micro-empuje radial (0 cooldown).',
      },
      {
        type: 'feature',
        description: 'Megalito Volcánico Rodante (Tierra + Tierra + Fuego): Proyectil pesado que rueda 320px arrollando enemigos y estalla en fragmentos de lava (0 cooldown).',
      },
      {
        type: 'feature',
        description: 'Fortaleza Glacial de Picos (Tierra + Tierra + Hielo): Púas de permafrost radiales en 360° (110px) con rechazo frontal y ralentización del 40% (0 cooldown).',
      },
      {
        type: 'feature',
        description: 'Fisura Sísmica Resonante (Tierra + Tierra + Rayo): Tres ondas tectónicas en abanico frontal con micro-aturdimiento continuo y daño múltiple por pulsos (0 cooldown).',
      },
      {
        type: 'feature',
        description: 'Pilón de Pararrayos (Rayo + Rayo + Tierra): Monolito conductor activo durante 3s que atrae enjambres dentro de 90px y descarga rayos radiales periódicos (0 cooldown).',
      },
      {
        type: 'feature',
        description: 'Bomba de Plasma Inestable (Rayo + Rayo + Fuego): Orbe pesado que viaja y detona en supernova de plasma (radio 80px) con knockback radial masivo (0 cooldown).',
      },
      {
        type: 'feature',
        description: 'Descarga de Cero Absoluto (Rayo + Rayo + Hielo): Abanico frontal crioelectromagnético de 120° (260px) con parálisis absoluta de 1.5s (0 cooldown).',
      },
      {
        type: 'feature',
        description: 'Alud Telúrico (Hielo + Hielo + Tierra), Granizo Hirviente (Hielo + Hielo + Fuego) y Ventisca Superconductora (Hielo + Hielo + Rayo) implementadas con cooldown 0.',
      },
      {
        type: 'feature',
        description: 'Trinchera de Magma (Fuego + Fuego + Tierra), Deflagración Térmica (Fuego + Fuego + Hielo) y Haz de Fusión Solar (Fuego + Fuego + Rayo) implementadas con cooldown 0.',
      },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-10-21',
    title: 'Sistema de Penalización Severa: Deleveling y Consecuencias Reales',
    changes: [
      {
        type: 'feature',
        description: 'Deleveling directo punitivo: Pérdida inmediata de 1 nivel (-1) en tareas normales y 2 niveles (-2) en tareas difíciles o épicas.',
      },
      {
        type: 'balance',
        description: 'Degradación permanente de estadísticas: -15 HP Máximo por nivel y -2 a Ataque, Velocidad, Resistencia y Conocimiento.',
      },
      {
        type: 'feature',
        description: 'Piso mínimo seguro en Nivel 1: El personaje no puede caer a Nivel 0 ni valores negativos de vida; entra en estado de Agonía / Bancarrota.',
      },
      {
        type: 'feature',
        description: 'Maldición por Incumplimiento (24h): Debuff de -15% de experiencia ganada en mazmorras y aura de miasma morado oscuro animada en el Canvas.',
      },
      {
        type: 'feature',
        description: 'Deuda de Honor: Ventana de 24 horas para redimir el honor completando la tarea penalizada y recuperar el 50% de la EXP perdida.',
      },
      {
        type: 'engine',
        description: 'Detector de urgencia pre-expiración (<4 horas) con tarjeta en rojo sangre palpitante y alerta superior de peligro de deleveling.',
      },
      {
        type: 'feature',
        description: 'Modal dramático de fractura de poder con sonido Web Audio sawtooth/sub-bass crack y animación visual de nivel roto (Nv. X ➔ Nv. Y).',
      },
      {
        type: 'engine',
        description: 'Sellado reactivo de habilidades en el Árbol Radial: Si el héroe pierde nivel por debajo del requisito de tier, la habilidad queda bloqueada con candado rojo.',
      },
    ],
  },
  {
    version: '0.3.5',
    date: '2026-10-21',
    title: 'Cataclismo Elemental: Habilidad Definitiva de 4 Elementos',
    changes: [
      {
        type: 'feature',
        description: 'Invocación de Cataclismo Elemental: Habilidad cumbre que entrelaza Fuego + Rayo + Hielo + Tierra (🔥 + ⚡ + ❄️ + 🌍) en cualquier permutación.',
      },
      {
        type: 'engine',
        description: 'Máquina de estados coreografiada en 4 fases consecutivas: Tierra (fractura y knock-up), Fuego (erupción de magma), Hielo (congelación masiva) y Rayo (impacto terminal).',
      },
      {
        type: 'balance',
        description: 'Mecánica de Sintonía Primordial (Hold 0.6–0.8s): Expansión a pantalla completa, +50% de daño acumulado y vaporización instantánea de proyectiles enemigos.',
      },
      {
        type: 'engine',
        description: 'Renderizado vectorial optimizado a 60 FPS con distorsión por anillos alfa, sin dependencias pesadas y purgado garantizado de hitboxes.',
      },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-10-20',
    title: 'Tormenta de Plasma Glacial: Fusión Tri-Elemental Móvil',
    changes: [
      {
        type: 'feature',
        description: 'Conjuro de Tormenta de Plasma Glacial: Combinación móvil de Fuego + Rayo + Hielo (🔥 + ⚡ + ❄️).',
      },
      {
        type: 'engine',
        description: 'Vórtice autónomo que avanza aplicando acumulación de escarcha y ralentización en su trayectoria.',
      },
      {
        type: 'engine',
        description: 'Arcos voltaicos continuos que rebotan automáticamente entre los enemigos atrapados dentro del radio del vórtice.',
      },
      {
        type: 'balance',
        description: 'Implosión térmica centrífuga final: Atracción violenta al epicentro y detonación expansiva que dispersa a los supervivientes.',
      },
      {
        type: 'feature',
        description: 'Carga de condensador tri-elemental (Hold breve): +35% radio de succión, +50% daño y congelamiento garantizado post-explosión.',
      },
    ],
  },
  {
    version: '0.2.5',
    date: '2026-10-19',
    title: 'Catálogo de 18 Habilidades y Motor Isométrico 2.5D',
    changes: [
      {
        type: 'feature',
        description: 'Registro completo de 18 habilidades activas: 4 elementales puras, 6 fusiones duales, 4 combinaciones tri-elementales y 4 defensivas/soporte.',
      },
      {
        type: 'engine',
        description: 'Motor Canvas 2D isométrico a 60 FPS con cámara dinámica, zoom 1.32x, sombras elípticas y físicas de colisión circular.',
      },
      {
        type: 'feature',
        description: 'Árbol de Habilidades Radial concéntrico interactivo con 4 ramas cardinales, nodos cardinales y fusiones diagonales.',
      },
      {
        type: 'balance',
        description: 'Sistema de escalado de daño de hechizos vinculado directamente a los atributos de Ataque y Conocimiento del héroe.',
      },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-10-18',
    title: 'Gestor de Tareas RPG y Afinidades con la Vida Real',
    changes: [
      {
        type: 'feature',
        description: 'Misiones reales que otorgan EXP, Oro y Llaves de Mazmorra al completarse a tiempo.',
      },
      {
        type: 'feature',
        description: 'Afinidad de estadísticas: Cada misión fortalece un atributo clave (Ataque, Velocidad, Resistencia o Conocimiento).',
      },
      {
        type: 'feature',
        description: 'Sistema inteligente de recurrencia (diaria, semanal, mensual, días específicos de la semana) y recordatorios anticipados.',
      },
      {
        type: 'fix',
        description: 'Corrección de cálculo en fechas límite ISO y formateo de horas locales.',
      },
      {
        type: 'engine',
        description: 'Persistencia instantánea y reactiva en localStorage ante recargas y navegación.',
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-10-16',
    title: 'Fundación de TaskQuest RPG y Soporte Móvil Android',
    changes: [
      {
        type: 'engine',
        description: 'Arquitectura base con React 18, TypeScript 5, Vite 6 y Tailwind CSS.',
      },
      {
        type: 'feature',
        description: 'Integración nativa con Capacitor Android para empaquetado en APK instalable y modo PWA offline.',
      },
      {
        type: 'feature',
        description: 'Sintetizador de audio procedural Web Audio API sin dependencias de archivos de sonido externos pesados.',
      },
      {
        type: 'feature',
        description: 'Avatar animado del Mago elemental dibujado mediante Canvas vectorial.',
      },
    ],
  },
];
