import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

async function loadModule(name) {
  const source = ts.transpileModule(
    readFileSync(new URL(`../src/game/elementalEngine/${name}.ts`, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const { applyWindKnockback, isWindCircleWalkable, WIND_STUN_FRAMES } = await loadModule('windAttack');
const { identifyRecipe } = await loadModule('recipes');
const { drawElementalProjectile, emitProjectileImpact } = await loadModule('projectileVfx');
const enemy = () => ({ x: 0, y: 0, radius: 10, vx: 2, vy: 2, hp: 80, stunnedTimer: 0 });

test('empty element queue gives zero-damage wind and a strong push', () => {
  const recipe = identifyRecipe([]);
  assert.equal(recipe.damage, 0);
  assert.equal(recipe.name, 'Ráfaga de Viento');
  assert(recipe.knockback >= 100);
  const target = enemy();
  applyWindKnockback(target, { x: 3, y: 4 }, () => true);
  assert(Math.abs(Math.hypot(target.x, target.y) - 110) < 0.0001);
  assert.equal(target.hp, 80);
  assert.equal(target.vx, 0);
  assert.equal(target.vy, 0);
  assert.equal(target.stunnedTimer, WIND_STUN_FRAMES);
});

test('knockback stops at a thin wall and never reaches the free space behind it', () => {
  const target = enemy();
  const walkable = (x) => x < 50 || x > 51;
  applyWindKnockback(target, { x: 1, y: 0 }, (x, y, radius) => isWindCircleWalkable(x, y, radius, walkable));
  assert(target.x <= 40);
  assert(target.x > 39.8);
  assert.equal(target.y, 0);
  assert.equal(target.hp, 80);
});

test('diagonal knockback respects mask edges and circular rocks', () => {
  const target = enemy();
  applyWindKnockback(target, { x: 1, y: 1 }, (x, y, radius) =>
    isWindCircleWalkable(x, y, radius, (px, py) => px + py < 90) &&
    Math.hypot(x - 38, y - 38) >= radius + 12);
  assert(Math.hypot(target.x - 38, target.y - 38) >= 22);
  assert(target.x > 10 && target.x < 38);
  assert.equal(target.hp, 80);
});

test('repeated pushes cannot cross a wall or shorten an existing stun', () => {
  const target = enemy();
  target.stunnedTimer = 60;
  for (let cast = 0; cast < 20; cast++) {
    applyWindKnockback(target, { x: 1, y: 0 }, (x, _y, radius) => x + radius <= 60);
    assert(target.x + target.radius <= 60);
    assert.equal(target.hp, 80);
  }
  assert.equal(target.stunnedTimer, 60);
});

test('wind has three distinct flight poses and a short pooled impact', () => {
  const projectile = { spellType: 'basic_spark', isHostile: false, x: 10, y: 20 };
  const poses = [];
  for (const now of [0, 90, 180]) {
    const commands = [];
    const ctx = new Proxy({}, { set: () => true, get: (_target, key) => (...args) => { commands.push([key, ...args]); } });
    assert.equal(drawElementalProjectile(ctx, projectile, now), true);
    poses.push(JSON.stringify(commands));
  }
  assert.equal(new Set(poses).size, 3);
  const impacts = [];
  emitProjectileImpact({ spawn: (options) => impacts.push(options) }, projectile);
  assert.equal(impacts.length, 1);
  assert.equal(impacts[0].type, 'ring');
  assert(impacts[0].life <= 20);
  emitProjectileImpact({ spawn: (options) => impacts.push(options) }, { ...projectile, isHostile: true });
  assert.equal(impacts.length, 1);
});
