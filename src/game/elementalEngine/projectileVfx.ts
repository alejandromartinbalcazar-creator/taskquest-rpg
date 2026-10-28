import type { Projectile } from './types';
import type { ParticlePool } from '../combat/ParticlePool';

export function emitProjectileImpact(pool: ParticlePool, p: Projectile): void {
  if (p.isHostile) return;
  const fire = p.spellType === 'fire_shot' || p.spellType === 'fire_inferno';
  const ice = p.spellType === 'ice_shard' || p.spellType === 'ice_lance';
  const earth = p.spellType === 'earth_toss' || p.spellType === 'earth_megalith';
  const wind = p.spellType === 'basic_spark';
  if (!fire && !ice && !earth && !wind) return;
  pool.spawn({ x: p.x, y: p.y, radius: wind ? 13 : 9, life: wind ? 18 : 25, type: 'ring',
    color: wind ? '#a5f3fc' : fire ? '#fb923c' : ice ? '#7dd3fc' : '#a8a29e',
    secondaryColor: wind ? '#f1f5f9' : fire ? '#fef08a' : ice ? '#e0f2fe' : '#57534e' });
}

/** Detailed silhouettes share world coordinates with gameplay; drawing adds no hitboxes. */
export function drawElementalProjectile(ctx: CanvasRenderingContext2D, p: Projectile, now: number): boolean {
  if (p.spellType === 'basic_spark' && !p.isHostile) {
    ctx.save();
    const frame = Math.floor(now / 90) % 3;
    ctx.fillStyle = 'rgba(207, 250, 254, 0.18)';
    ctx.beginPath();
    for (let vertex = 0; vertex < 12; vertex++) {
      const angle = vertex * Math.PI / 6;
      const x = Math.round(Math.cos(angle) * 20);
      const y = Math.round(Math.sin(angle) * 17);
      if (vertex === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    // Three discrete poses rotate broken currents around a transparent center.
    for (let current = 0; current < 3; current++) {
      ctx.strokeStyle = current % 2 ? 'rgba(241,245,249,0.9)' : 'rgba(165,243,252,0.85)';
      ctx.lineWidth = current === 0 ? 3 : 2;
      ctx.beginPath();
      for (let segment = 0; segment < 6; segment++) {
        const angle = frame * Math.PI * 2 / 9 + current * Math.PI * 2 / 3 + segment * 0.24;
        const radius = 8 + segment * 2;
        const x = Math.round(Math.cos(angle) * radius);
        const y = Math.round(Math.sin(angle) * radius * 0.85);
        if (segment === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(226,232,240,0.65)';
    ctx.lineWidth = 2;
    for (let ribbon = 0; ribbon < 2; ribbon++) {
      const side = ribbon === 0 ? -1 : 1;
      ctx.beginPath(); ctx.moveTo(-12, side * 8);
      ctx.lineTo(-23, side * (10 + frame)); ctx.lineTo(-34, side * 5);
      ctx.lineTo(-44 - frame * 2, side * 7); ctx.stroke();
    }
    ctx.restore();
    return true;
  }
  const fire = p.spellType === 'fire_shot' || p.spellType === 'fire_inferno';
  const ice = p.spellType === 'ice_shard' || p.spellType === 'ice_lance';
  const earth = p.spellType === 'earth_toss' || p.spellType === 'earth_megalith';
  if (!fire && !ice && !earth) return false;

  ctx.save();
  const large = p.spellType === 'fire_inferno' || p.spellType === 'ice_lance' || p.spellType === 'earth_megalith';
  const scale = ice ? (large ? 1.9 : 1.6) : (large ? 1.35 : 1);
  ctx.scale(scale, scale);
  const phase = now * 0.012 + (p.maxLife - p.life) * 0.09;

  if (fire) {
    // Three interwoven ribbons give a fireball an irregular, living silhouette.
    for (let layer = 0; layer < 3; layer++) {
      const length = 46 - layer * 10;
      const width = 12 - layer * 3.5;
      ctx.fillStyle = layer === 0 ? '#b91c1c' : layer === 1 ? '#f97316' : '#fef08a';
      ctx.beginPath();
      ctx.moveTo(16 - layer * 2, 0);
      ctx.quadraticCurveTo(12, -width * 1.4, -9, -width);
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const wave = Math.sin(phase + i * 1.8 + layer) * 4 * t;
        ctx.lineTo(-10 - t * length, -width * (1 - t) + wave);
      }
      for (let i = 5; i >= 0; i--) {
        const t = i / 5;
        ctx.lineTo(-10 - t * length, width * (1 - t) + Math.cos(phase + i * 1.6) * 3 * t);
      }
      ctx.quadraticCurveTo(12, width * 1.4, 16 - layer * 2, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath();
    ctx.ellipse(6, -1, 7, 4, -0.1, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      const t = ((now * 0.0015 + i * 0.23) % 1);
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = i % 2 ? '#facc15' : '#fb923c';
      ctx.fillRect(-18 - t * 47, Math.sin(i * 2.2 + phase) * (6 + t * 8), 3, 3);
    }
  } else if (ice) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.beginPath();
    ctx.moveTo(29, 0); ctx.lineTo(-28, -12); ctx.lineTo(-18, 0); ctx.lineTo(-28, 12);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(27, 0); ctx.lineTo(-10, -9); ctx.lineTo(-22, -3);
    ctx.lineTo(-17, 8); ctx.lineTo(-7, 10); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.moveTo(25, 0); ctx.lineTo(-10, -7); ctx.lineTo(-16, -2); ctx.lineTo(-5, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(25, 0); ctx.lineTo(-5, 0); ctx.lineTo(-16, 6); ctx.lineTo(-7, 8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-13, -2); ctx.lineTo(21, 0); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const t = (now * 0.001 + i / 3) % 1;
      const x = -25 - t * 23;
      const y = Math.sin(phase * 0.4 + i * 2) * 11;
      ctx.globalAlpha = (1 - t) * 0.8;
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath(); ctx.moveTo(x + 5, y); ctx.lineTo(x - 4, y - 2);
      ctx.lineTo(x - 1, y + 3); ctx.closePath(); ctx.fill();
    }
  } else {
    // Rotate the facets, not the travel direction or the dust wake.
    ctx.save();
    ctx.rotate((p.maxLife - p.life) * 0.065);
    ctx.strokeStyle = '#292524'; ctx.lineWidth = 2;
    ctx.fillStyle = '#57534e';
    ctx.beginPath();
    ctx.moveTo(17, -5); ctx.lineTo(8, -15); ctx.lineTo(-7, -17);
    ctx.lineTo(-17, -7); ctx.lineTo(-15, 9); ctx.lineTo(-3, 16);
    ctx.lineTo(12, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a8a29e';
    ctx.beginPath(); ctx.moveTo(-7, -14); ctx.lineTo(7, -12); ctx.lineTo(10, -2);
    ctx.lineTo(-2, 1); ctx.lineTo(-14, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#78716c';
    ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(11, -1); ctx.lineTo(10, 10);
    ctx.lineTo(-3, 13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#292524'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-7, -13); ctx.lineTo(-3, -5); ctx.lineTo(-8, 1);
    ctx.lineTo(-4, 8); ctx.moveTo(-3, -5); ctx.lineTo(5, -3); ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const t = (now * 0.0012 + i / 4) % 1;
      ctx.globalAlpha = (1 - t) * 0.55;
      ctx.fillStyle = i % 2 ? '#a8a29e' : '#57534e';
      ctx.fillRect(-20 - t * 28, Math.sin(i * 2.4) * (4 + t * 9), 4 + t * 3, 3 + t * 2);
    }
  }
  ctx.restore();
  return true;
}

/** Low-cost ground reflections: painted before actors, so light stays on the floor. */
export function drawProjectileGroundLight(ctx: CanvasRenderingContext2D, projectiles: Projectile[]): void {
  ctx.save();
  for (const p of projectiles) {
    if ((p as Projectile & { active?: boolean }).active === false || p.life <= 0 || p.isHostile) continue;
    const fire = p.spellType === 'fire_shot' || p.spellType === 'fire_inferno';
    const ice = p.spellType === 'ice_shard' || p.spellType === 'ice_lance';
    const earth = p.spellType === 'earth_toss' || p.spellType === 'earth_megalith';
    if (!fire && !ice && !earth) continue;
    ctx.fillStyle = fire ? 'rgba(249,115,22,0.12)' : ice ? 'rgba(56,189,248,0.10)' : 'rgba(15,23,42,0.24)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 13, earth ? 18 : 30, earth ? 7 : 13, 0, 0, Math.PI * 2); ctx.fill();
    if (!earth) {
      ctx.fillStyle = fire ? 'rgba(251,191,36,0.13)' : 'rgba(186,230,253,0.12)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 13, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
