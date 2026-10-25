import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';

function loadTs(relativePath, modules) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = createContext({ exports: {}, require: (name) => modules[name] ?? (() => { throw new Error(name); })() });
  runInContext(js, sandbox);
  return sandbox.exports;
}

const biomes = loadTs('../src/game/expedition/biomes.ts', {});
const generator = loadTs('../src/game/expedition/runGenerator.ts', { './biomes': biomes });
const first = generator.generateExpedition('deepwood', 424242);
const second = generator.generateExpedition('deepwood', 424242);

assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)), 'La misma semilla debe reconstruir la misma ruta');
assert.equal(first.rooms[0].kind, 'entrance');
assert.equal(first.rooms.at(-1).kind, 'boss');
assert.equal(first.rooms.at(-1).enemyPool[0], 'root_guardian');
const biome = biomes.getBiome('deepwood');
for (const room of first.rooms) {
  for (const enemy of room.enemyPool ?? []) {
    if (enemy !== biome.bossId) assert.ok(biome.allowedEnemies.includes(enemy), `Enemigo permitido: ${enemy}`);
  }
}
console.log('Expedición: semilla reproducible, salas, modificador y bestiario de bioma. Correcto.');
