import { MagickaElement, CastMode, SpellOutcome } from './magickaTypes';

export interface FusionRecipe {
  id: string;
  name: string;
  required: [MagickaElement, MagickaElement];
  icon: string;
  badge: string;
  color: string;
  glow: string;
}

export const KNOWN_FUSIONS: FusionRecipe[] = [
  {
    id: 'plasma',
    name: 'Haz de Plasma',
    required: ['fire', 'lightning'],
    icon: '⚡🔥',
    badge: 'PLASMA',
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.7)',
  },
  {
    id: 'magma',
    name: 'Meteorito de Magma',
    required: ['fire', 'earth'],
    icon: '🌋🔥',
    badge: 'MAGMA',
    color: '#ea580c',
    glow: 'rgba(234, 88, 12, 0.7)',
  },
  {
    id: 'hydro-zap',
    name: 'Tormenta Conductora',
    required: ['water', 'lightning'],
    icon: '⚡💧',
    badge: 'ELECTRO-AGUA',
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.7)',
  },
  {
    id: 'permafrost',
    name: 'Glaciar Ártico',
    required: ['water', 'ice'],
    icon: '❄️💧',
    badge: 'CONGELACIÓN',
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.7)',
  },
  {
    id: 'steam',
    name: 'Vapor Abrasador',
    required: ['fire', 'water'],
    icon: '💨🔥',
    badge: 'VAPOR',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.7)',
  },
  {
    id: 'electrorock',
    name: 'Peñasco Electrificado',
    required: ['earth', 'lightning'],
    icon: '🗿⚡',
    badge: 'ELECTRO-TIERRA',
    color: '#ca8a04',
    glow: 'rgba(202, 138, 4, 0.7)',
  },
  {
    id: 'stone-shield',
    name: 'Bastión Telúrico',
    required: ['earth', 'shield'],
    icon: '🛡️🌍',
    badge: 'PIEDRA VITAL',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.7)',
  },
];

// Detectar qué fusión está disponible según los elementos encolados
export function getAvailableFusion(elements: MagickaElement[]): FusionRecipe | null {
  for (const recipe of KNOWN_FUSIONS) {
    const [reqA, reqB] = recipe.required;
    const hasA = elements.includes(reqA);
    const hasB = elements.includes(reqB);

    if (hasA && hasB) {
      // Si son iguales, asegurar que hay al menos 2
      if (reqA === reqB && elements.filter((e) => e === reqA).length < 2) continue;
      return recipe;
    }
  }
  return null;
}
