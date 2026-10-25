import { EnemyManager } from './enemyAI';
import { TerrainManager } from './physicsAndTerrain';

/** El tutorial nunca usa el tilemap, checkpoints, patrullas ni jefes de la campaña. */
export function setupTutorialRoom(index: number, terrain: TerrainManager, enemies: EnemyManager): void {
  terrain.setupRoomTerrain(index === 2 ? 'relic_sanctuary' : 'entrance');
  enemies.enemies = [];
  enemies.currentBoss = null;
  if (index === 0) {
    // Patio despejado: el paso al siguiente escenario lo activa el primer hechizo.
    terrain.obstacles = [];
  } else if (index === 1) {
    terrain.obstacles = [];
    const fire = enemies.createPyreGolem('tutorial-fire', 420, 300);
    const ice = enemies.createFrostLurker('tutorial-ice', 680, 300);
    Object.assign(fire, { name: 'Guardián de fuego · usa HIELO', hp: 60, maxHp: 60, weakness: 'ice', resistance: 'fire', attackPower: 2, moveSpeed: 0.35 });
    Object.assign(ice, { name: 'Guardián de hielo · usa FUEGO', hp: 60, maxHp: 60, weakness: 'fire', resistance: 'ice', attackPower: 2, moveSpeed: 0.35 });
    enemies.enemies = [fire, ice];
  }
}
