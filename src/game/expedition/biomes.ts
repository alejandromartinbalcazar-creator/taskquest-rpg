import { BiomeDefinition } from './types';

const smallReward = { gold: [8, 18] as [number, number], essence: [1, 3] as [number, number], heartChance: 0.12, chestChance: 0.05 };

export const BIOMES: BiomeDefinition[] = [
  {
    id: 'deepwood', name: 'Bosque Profundo', chapter: 1,
    palette: { sky: '#10263a', ground: '#263d35', accent: '#65d477' }, musicMood: 'exploration',
    recommendedElements: ['fire', 'earth'], bossId: 'root_guardian',
    modifiers: [
      { id: 'moon_blessing', name: 'Bendición lunar', kind: 'blessing', description: 'Los corazones curan un poco más.', color: '#a78bfa', allowedRooms: ['rest', 'treasure'] },
      { id: 'living_roots', name: 'Raíces vivientes', kind: 'hazard', description: 'El suelo atrapa a los imprudentes.', color: '#84cc16', allowedRooms: ['combat', 'ambush'] },
      { id: 'arcane_fog', name: 'Niebla arcana', kind: 'enemy_rule', description: 'Las emboscadas son más frecuentes.', color: '#94a3b8', allowedRooms: ['ambush', 'elite'] },
    ],
    roomTemplates: [
      { id: 'forest_skirmish', kind: 'combat', title: 'Claro de espinas', weight: 6, enemyPool: ['golem', 'stalker'], reward: smallReward, visualCue: 'Raíces iluminadas' },
      { id: 'forest_ambush', kind: 'ambush', title: 'Sendero oculto', weight: 3, enemyPool: ['stalker', 'lurker'], reward: smallReward, visualCue: 'Niebla entre árboles' },
      { id: 'forest_vessels', kind: 'treasure', title: 'Vasijas del guardabosque', weight: 2, reward: { ...smallReward, heartChance: 0.45, chestChance: 0.3 }, visualCue: 'Vasijas y cofre' },
      { id: 'forest_shrine', kind: 'rest', title: 'Santuario de musgo', weight: 2, reward: { ...smallReward, heartChance: 0.75 }, visualCue: 'Luz de santuario' },
      { id: 'forest_elite', kind: 'elite', title: 'Círculo del cazador', weight: 1, enemyPool: ['elite_stalker'], reward: { gold: [30, 45], essence: [5, 8], heartChance: 0.2, chestChance: 0.6 }, visualCue: 'Runas rojas' },
    ],
  },
];

export const getBiome = (id: string) => BIOMES.find((biome) => biome.id === id);
