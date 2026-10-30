import { getBiome } from './biomes';
import { generateExpedition } from './runGenerator';
import type { CampaignRoute, ExpeditionRun } from './types';

export const LEVEL_1_BIOME_ID = 'deepwood';
const LEVEL_1_SEED_KEY = 'focusmission_level1_route_seed';

/**
 * Una semilla se guarda una sola vez. Así una partida puede reabrirse sin que el
 * mapa, las salas ni sus recompensas cambien por accidente entre sesiones.
 */
export function getPersistentLevel1Seed(storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof window === 'undefined' ? null : window.localStorage): number {
  const previous = storage?.getItem(LEVEL_1_SEED_KEY);
  const parsed = Number(previous);
  if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;

  const seed = Math.floor(Date.now() % 2_000_000_000) || 1;
  try { storage?.setItem(LEVEL_1_SEED_KEY, String(seed)); } catch { /* modo privado: conserva la ruta de esta sesión */ }
  return seed;
}

export function createLevel1CampaignRoute(seed = getPersistentLevel1Seed()): CampaignRoute {
  const run = generateExpedition(LEVEL_1_BIOME_ID, seed);
  return { run, seedLabel: `#${seed.toString(36).toUpperCase()}` };
}

export function getRouteSummary(run: ExpeditionRun): string {
  const biome = getBiome(run.biomeId);
  return `${biome?.name ?? run.biomeId} · ${run.modifier.name}`;
}
