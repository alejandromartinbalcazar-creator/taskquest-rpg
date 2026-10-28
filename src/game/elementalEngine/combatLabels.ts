import type { FloatingText } from './types';

type Rect = { left: number; top: number; right: number; bottom: number };
type Label = Rect & { text: string; x: number; y: number; size: number; color: string; alpha: number };
const overlaps = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

export function compactCombatText(text: string): string {
  if (text.includes('HECHIZO CARGADO')) return 'Cargado ×1.65';
  if (text.includes('PILAR ÍGNEO')) return text.includes('CARGADO') ? 'Pilar ígneo ×1.65' : 'Pilar ígneo';
  const clean = text.replace(/¡|!/g, '').replace(/\s+/g, ' ').trim();
  return clean.length > 32 ? `${clean.slice(0, 29)}…` : clean;
}

/** Place at most eight recent labels without covering the player or each other. */
export function layoutCombatLabels(
  texts: FloatingText[], player: Rect, viewport: Rect,
  measure: (text: string, size: number) => number,
): Label[] {
  const labels: Label[] = [];
  const seen = new Set<string>();
  for (let i = texts.length - 1; i >= 0 && labels.length < 8; i--) {
    const source = texts[i];
    if (source.opacity <= 0 || source.life <= 0) continue;
    if (source.x < viewport.left - 40 || source.x > viewport.right + 40 || source.y < viewport.top || source.y > viewport.bottom + 40) continue;
    const text = compactCombatText(source.text);
    const key = `${text}:${Math.round(source.x / 90)}:${Math.round(source.y / 90)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const size = Math.max(8, Math.min(11, Math.round(source.fontSize * 0.65)));
    const halfWidth = measure(text, size) / 2 + 4;
    const clampX = (x: number) => Math.max(viewport.left + halfWidth + 6, Math.min(viewport.right - halfWidth - 6, x));
    let x = clampX(source.x);
    let y = Math.max(viewport.top + 14, Math.min(viewport.bottom - 8, source.y - 14));
    for (let attempt = 0; attempt < 12; attempt++) {
      const rect = { left: x - halfWidth, right: x + halfWidth, top: y - size - 2, bottom: y + 3 };
      if (!overlaps(rect, player) && !labels.some((other) => overlaps(rect, other))) {
        labels.push({ ...rect, text, x, y, size, color: source.color, alpha: Math.min(1, source.opacity) });
        break;
      }
      if (attempt === 0 && overlaps(rect, player)) {
        x = clampX(source.x >= (player.left + player.right) / 2 ? player.right + halfWidth + 10 : player.left - halfWidth - 10);
      } else {
        y -= size + 8;
      }
      if (y - size < viewport.top) break;
    }
  }
  return labels;
}
