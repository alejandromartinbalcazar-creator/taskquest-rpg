import type { PhysicalObstacle } from './types';

export const VESSEL_BOOST_MS = 10_000;
export const VESSEL_HEAL = 20;
export type VesselReward = { id: string; x: number; y: number; color: string; kind: 'charged' | 'health' };

export function createTutorialVessels(): PhysicalObstacle[] {
  return [
    { x: 710, y: 255, color: '#facc15', reward: 'charged' as const },
    { x: 830, y: 300, color: '#22c55e', reward: 'health' as const },
    { x: 710, y: 490, color: '#ef4444', reward: 'health' as const },
    { x: 830, y: 535, color: '#facc15', reward: 'charged' as const },
  ].map((item, index) => ({
    id: `tutorial-vessel-${index}`, x: item.x, y: item.y, color: item.color,
    radius: 22, width: 38, height: 48, obstacleType: 'vessel',
    hp: 8, maxHp: 8, solid: true, blocksProjectiles: true, meltable: false,
    vesselReward: item.reward,
  }));
}

/** Reclama antes de retirar los objetos destruidos. Cada vasija entrega exactamente una recompensa. */
export function collectVesselRewards(obstacles: PhysicalObstacle[]): VesselReward[] {
  const rewards: VesselReward[] = [];
  for (const obstacle of obstacles) {
    if (obstacle.obstacleType !== 'vessel' || obstacle.hp > 0 || obstacle.vesselRewardClaimed || !obstacle.vesselReward) continue;
    obstacle.vesselRewardClaimed = true;
    rewards.push({ id: obstacle.id, x: obstacle.x, y: obstacle.y, color: obstacle.color, kind: obstacle.vesselReward });
  }
  return rewards;
}
