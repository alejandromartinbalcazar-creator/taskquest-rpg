import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

async function loadModule(path) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const sizes = await loadModule('../src/game/elementalEngine/entityScale.ts');
const { resolveMaskMovement } = await loadModule('../src/game/levels/maskMovement.ts');

test('wizard and boss use integer pixel units with a clear size hierarchy', () => {
  const wizardPixel = 2 * sizes.WIZARD_PANORAMA_SCALE;
  const bossPixel = sizes.CUSTODIAN_VISUAL_RADIUS / 16;
  assert.equal(wizardPixel, 5);
  assert.equal(bossPixel, 7);
  // The wizard spans at most 28 rows, and the Custodian torso spans 42 rows.
  assert(42 * bossPixel >= 2 * 28 * wizardPixel);
});

test('projectiles hit the enlarged torso without enlarging ground contact', () => {
  const boss = { x: 200, y: 400, radius: sizes.CUSTODIAN_GROUND_RADIUS,
    damageRadius: sizes.CUSTODIAN_DAMAGE_RADIUS, damageOffsetY: sizes.CUSTODIAN_DAMAGE_OFFSET_Y };
  assert(sizes.spellHitsEnemy(310, 260, 14, boss));
  assert(!sizes.spellHitsEnemy(380, 260, 14, boss));
  assert.equal(boss.radius, 32);
  assert.equal(sizes.getEnemyHurtbox(boss).y, 260);
});

test('common enemies keep their existing contact dimensions', () => {
  const common = { x: 100, y: 100, radius: 24 };
  assert.deepEqual(sizes.getEnemyHurtbox(common), common);
  assert(sizes.spellHitsEnemy(130, 100, 8, common));
  assert(!sizes.spellHitsEnemy(150, 100, 8, common));
});

test('the enlarged wizard still passes a narrow green lane with foot-only contact', () => {
  const wizard = { x: 0, y: 4, radius: sizes.WIZARD_GROUND_RADIUS };
  resolveMaskMovement(wizard, { x: 0, y: 0 }, (x) => Math.abs(x) < 12);
  assert(Math.abs(wizard.y - 4) < 0.000001);
  assert.equal(wizard.x, 0);
});

test('boss foot contact fits a corridor that cannot contain its whole torso', () => {
  const boss = { x: 3, y: 0, radius: sizes.CUSTODIAN_GROUND_RADIUS };
  resolveMaskMovement(boss, { x: 0, y: 0 }, (x, y) => Math.abs(x) < 50 && Math.abs(y) < 18);
  assert.equal(boss.x, 3);
  assert.equal(boss.y, 0);
});
