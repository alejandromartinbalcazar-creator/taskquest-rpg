import { EnemyManager } from './enemyAI';
import { TerrainManager } from './physicsAndTerrain';
import { createTutorialVessels } from './vessels';

/** El tutorial nunca usa el tilemap, checkpoints, patrullas ni jefes de la campaña. */
export function setupTutorialRoom(index: number, terrain: TerrainManager, enemies: EnemyManager): void {
  terrain.setupRoomTerrain(index === 2 ? 'relic_sanctuary' : 'entrance');
  enemies.enemies = [];
  enemies.currentBoss = null;
  const exit = {
    id: 'tutorial-door-east', x: 980, y: 380, radius: 30,
    width: 24, height: 80, obstacleType: 'door_gate' as const,
    hp: 9999, maxHp: 9999, color: '#facc15', solid: true,
    blocksProjectiles: false, meltable: false, doorLocked: true,
    doorDirection: 'east' as const,
  };
  if (index === 0) {
    // El primer hechizo abre la salida; el jugador camina hasta ella.
    terrain.obstacles = [exit];
  } else if (index === 1) {
    terrain.obstacles = [exit];
    const fire = enemies.createPyreGolem('tutorial-fire', 420, 300);
    const ice = enemies.createFrostLurker('tutorial-ice', 680, 300);
    Object.assign(fire, { name: 'Guardián de fuego · usa HIELO', hp: 60, maxHp: 60, weakness: 'ice', resistance: 'fire', attackPower: 2, moveSpeed: 0.35 });
    Object.assign(ice, { name: 'Guardián de hielo · usa FUEGO', hp: 60, maxHp: 60, weakness: 'fire', resistance: 'ice', attackPower: 2, moveSpeed: 0.35 });
    enemies.enemies = [fire, ice];
  } else {
    // Conserva el cofre del santuario y sustituye su salida norte por una oriental.
    terrain.obstacles = terrain.obstacles.filter((obstacle) => obstacle.obstacleType !== 'door_gate');
    terrain.obstacles.push(exit);
    terrain.obstacles.push(...createTutorialVessels());
  }
}
