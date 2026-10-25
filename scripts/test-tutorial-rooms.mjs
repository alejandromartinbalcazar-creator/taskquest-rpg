import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';

// Ejecuta la configuración real de salas con gestores mínimos; no requiere navegador/audio.
const source = readFileSync(new URL('../src/game/elementalEngine/tutorialRooms.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const sandbox = createContext({ exports: {} });
runInContext(compiled, sandbox);
const { setupTutorialRoom } = sandbox.exports;
const terrain = { obstacles: [], setupRoomTerrain(kind) { this.kind = kind; this.obstacles = [{ id: 'door', obstacleType: 'door_gate' }, { id: 'chest', obstacleType: 'relic_chest' }]; } };
const enemies = {
  enemies: [{ id: 'campaign-boss' }], currentBoss: {},
  createPyreGolem(id, x, y) { return { id, x, y, bestiaryType: 'pyre_golem' }; },
  createFrostLurker(id, x, y) { return { id, x, y, bestiaryType: 'frost_lurker' }; },
};
setupTutorialRoom(0, terrain, enemies);
assert.equal(enemies.enemies.length, 0, 'El patio debe estar vacío');
assert.equal(enemies.currentBoss, null);
assert.equal(terrain.obstacles.length, 1);
assert.equal(terrain.obstacles[0].doorDirection, 'east');
assert.equal(terrain.obstacles[0].doorLocked, true, 'El entrenamiento empieza con la salida bloqueada');
setupTutorialRoom(1, terrain, enemies);
assert.equal(enemies.enemies.length, 2);
assert.equal(enemies.enemies[0].weakness, 'ice');
assert.equal(enemies.enemies[1].weakness, 'fire');
assert.equal(enemies.currentBoss, null);
assert.equal(terrain.obstacles[0].doorDirection, 'east');
assert.equal(terrain.obstacles[0].doorLocked, true, 'La cámara se desbloquea tras derrotar a ambos enemigos');
setupTutorialRoom(2, terrain, enemies);
assert.equal(enemies.enemies.length, 0);
assert.equal(terrain.kind, 'relic_sanctuary');
assert.equal(enemies.currentBoss, null);
assert.equal(terrain.obstacles.filter((item) => item.obstacleType === 'door_gate').length, 1);
assert.equal(terrain.obstacles.find((item) => item.obstacleType === 'door_gate').doorDirection, 'east');
assert.equal(terrain.obstacles.find((item) => item.obstacleType === 'relic_chest').id, 'chest');
console.log('Tutorial: patio vacío, dos guardianes elementales, almacén sin enemigos. Correcto.');
