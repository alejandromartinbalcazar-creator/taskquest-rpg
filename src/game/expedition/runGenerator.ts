import { getBiome } from './biomes';
import { ExpeditionRun, RoomTemplate } from './types';

// Generador reproducible: una misma semilla siempre crea la misma expedición.
const seededRandom = (seed: number) => () => {
  let value = seed += 0x6D2B79F5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

function weightedPick<T extends { weight: number }>(items: T[], random: () => number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let point = random() * total;
  for (const item of items) { point -= item.weight; if (point <= 0) return item; }
  return items[items.length - 1];
}

export function generateExpedition(biomeId: string, seed = Date.now()): ExpeditionRun {
  const biome = getBiome(biomeId);
  if (!biome) throw new Error(`Bioma desconocido: ${biomeId}`);
  const random = seededRandom(seed);
  const rooms: RoomTemplate[] = [{ id: 'entrance', kind: 'entrance', title: biome.name, weight: 1, reward: { gold: [0, 0], essence: [0, 0], heartChance: 0, chestChance: 0 }, visualCue: 'Portal de entrada' }];
  for (let i = 0; i < 5; i += 1) rooms.push(weightedPick(biome.roomTemplates, random));
  rooms.push({ id: `${biome.id}_boss`, kind: 'boss', title: 'Guardián del capítulo', weight: 1, enemyPool: [biome.bossId], reward: { gold: [80, 120], essence: [12, 18], heartChance: 1, chestChance: 1 }, visualCue: 'Arena del jefe' });
  return { seed, biomeId, modifier: biome.modifiers[Math.floor(random() * biome.modifiers.length)], rooms };
}
