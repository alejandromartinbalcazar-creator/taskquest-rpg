import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/game/elementalEngine/combatLabels.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { layoutCombatLabels, compactCombatText } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const player = { left: 450, right: 555, top: 180, bottom: 320 };
const viewport = { left: 0, right: 1000, top: 90, bottom: 620 };
const measure = (text, size) => text.length * size * 0.7;
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const floatingText = (i) => ({ id: `${i}`, text: `${i + 10}`, x: 500, y: 280, life: 30, opacity: 1, fontSize: 14, color: '#fff', vy: -1 });

test('dense damage labels avoid the wizard and one another', () => {
  const labels = layoutCombatLabels(Array.from({ length: 30 }, (_, i) => floatingText(i)), player, viewport, measure);
  assert(labels.length > 0 && labels.length <= 8);
  for (let i = 0; i < labels.length; i++) {
    assert(!overlaps(labels[i], player));
    assert(labels[i].left >= viewport.left && labels[i].right <= viewport.right);
    for (let j = i + 1; j < labels.length; j++) assert(!overlaps(labels[i], labels[j]));
  }
});

test('repeated charge messages collapse into one compact notice', () => {
  const labels = layoutCombatLabels(Array.from({ length: 10 }, (_, i) => ({ ...floatingText(i), text: '⚡ ¡HECHIZO CARGADO! x1.65' })), player, viewport, measure);
  assert.equal(labels.length, 1);
  assert.equal(labels[0].text, 'Cargado ×1.65');
  assert(compactCombatText('Un aviso de estado excesivamente largo que ocupa toda la pantalla').length <= 32);
});

test('labels at the screen edge stay within the viewport without covering the player', () => {
  const edgePlayer = { left: 0, right: 100, top: 160, bottom: 320 };
  const labels = layoutCombatLabels([{ ...floatingText(0), x: 5 }], edgePlayer, viewport, measure);
  assert.equal(labels.length, 1);
  assert(labels[0].left >= 0 && labels[0].right <= 1000);
  assert(!overlaps(labels[0], edgePlayer));
});
