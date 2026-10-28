import { GameEnemy } from './types';
import { getCommonEnemyMetrics } from './entityScale';

/**
 * Renderizado Procedural en Pixel Art de 16 Bits para el Bestiario Elemental (Canvas 2D).
 * Cero primitivas circulares continuas: entidades formadas por bloques de píxeles,
 * contornos negros de grafito (#0F172A), animación por pasos discretos y paleta indexada.
 */

// 1. GÓLEM DE ESCORIA ÍGNEA (Pyre Golem) — Melé Pesado / Tanque en Pixel Art 16-Bit
export function drawPyreGolem(ctx: CanvasRenderingContext2D, enemy: GameEnemy, now: number) {
  const r = enemy.radius;
  const P = getCommonEnemyMetrics(enemy).pixel;
  const isCooled = (enemy.cooledDownTimer ?? 0) > 0;
  const isFrenzy = (enemy.frenzyTimer ?? 0) > 0;
  const isTelegraph = enemy.isTelegraphing;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Animación pesada al caminar: 2 pasos con caída rígida de 1 píxel
  const step = Math.floor(now * 0.005) % 2;
  const stompY = step === 1 ? P : 0;
  ctx.translate(0, stompY);

  // Paleta indexada
  const OUTLINE = '#0f172a';
  const BASALT_DARK = isCooled ? '#1e293b' : '#18181b';
  const BASALT_MID = isCooled ? '#334155' : (enemy.hitFlash > 0 ? '#ffffff' : '#27272a');
  const BASALT_LIGHT = isCooled ? '#64748b' : '#3f3f46';
  const LAVA_HOT = isCooled ? '#475569' : (isFrenzy ? '#fde047' : '#ea580c');
  const LAVA_BRIGHT = isCooled ? '#94a3b8' : (isFrenzy ? '#ffffff' : '#fbbf24');
  const EYE_COLOR = isCooled ? '#94a3b8' : (isFrenzy ? '#ef4444' : '#fbbf24');

  // A. Sombra pixelada en el suelo (escalonada)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(-10 * P, 7 * P - stompY, 20 * P, 1 * P);
  ctx.fillRect(-12 * P, 8 * P - stompY, 24 * P, 3 * P);
  ctx.fillRect(-10 * P, 11 * P - stompY, 20 * P, 1 * P);

  // B. Piernas pesadas de basalto (bloques rectangulares)
  // Pierna izquierda
  const legShift = step === 0 ? 0 : -1 * P;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-7 * P, 3 * P + legShift, 5 * P, 6 * P);
  ctx.fillStyle = BASALT_DARK;
  ctx.fillRect(-6 * P, 4 * P + legShift, 3 * P, 4 * P);

  // Pierna derecha
  const rightLegShift = step === 1 ? 0 : -1 * P;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(2 * P, 3 * P + rightLegShift, 5 * P, 6 * P);
  ctx.fillStyle = BASALT_DARK;
  ctx.fillRect(3 * P, 4 * P + rightLegShift, 3 * P, 4 * P);

  // C. Torso masivo de basalto con juntas y grietas de lava
  // Contorno exterior
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-10 * P, -9 * P, 20 * P, 13 * P);
  ctx.fillRect(-11 * P, -8 * P, 22 * P, 10 * P);
  ctx.fillRect(-8 * P, -11 * P, 16 * P, 2 * P); // Cresta hombros

  // Relleno de roca volcánica
  ctx.fillStyle = BASALT_MID;
  ctx.fillRect(-9 * P, -8 * P, 18 * P, 11 * P);
  ctx.fillStyle = BASALT_LIGHT;
  ctx.fillRect(-9 * P, -8 * P, 18 * P, 2 * P); // Luz en hombros
  ctx.fillStyle = BASALT_DARK;
  ctx.fillRect(-9 * P, 1 * P, 18 * P, 2 * P);  // Sombra cintura

  // D. Grietas de magma incandescente (#EA580C, #FBBF24)
  ctx.fillStyle = LAVA_HOT;
  // Grieta diagonal izquierda
  ctx.fillRect(-6 * P, -6 * P, 2 * P, 3 * P);
  ctx.fillRect(-4 * P, -4 * P, 2 * P, 2 * P);
  // Grieta diagonal derecha
  ctx.fillRect(3 * P, -5 * P, 3 * P, 2 * P);
  ctx.fillRect(2 * P, -3 * P, 2 * P, 3 * P);

  // Núcleo incandescente en el pecho (cuadrado de lava con centro amarillo)
  ctx.fillRect(-2 * P, -4 * P, 4 * P, 4 * P);
  ctx.fillStyle = LAVA_BRIGHT;
  ctx.fillRect(-1 * P, -3 * P, 2 * P, 2 * P);

  // E. Cabeza de bloque de roca
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-4 * P, -14 * P, 8 * P, 5 * P);
  ctx.fillStyle = BASALT_DARK;
  ctx.fillRect(-3 * P, -13 * P, 6 * P, 4 * P);
  ctx.fillStyle = BASALT_LIGHT;
  ctx.fillRect(-3 * P, -13 * P, 6 * P, 1 * P); // Ceja de piedra

  // Ojos de 2 píxeles incandescentes (#FBBF24)
  ctx.fillStyle = EYE_COLOR;
  ctx.fillRect(-2 * P, -11 * P, 1 * P, 1 * P);
  ctx.fillRect(1 * P, -11 * P, 1 * P, 1 * P);

  // F. Brazos y Puños de roca pesados
  const punchLift = isTelegraph ? -4 * P : 0;

  // Brazo izquierdo
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-13 * P, -7 * P, 4 * P, 10 * P);
  ctx.fillStyle = BASALT_DARK;
  ctx.fillRect(-12 * P, -6 * P, 2 * P, 8 * P);

  // Brazo derecho (puño pesado telegrafiado)
  ctx.fillStyle = isTelegraph ? '#ef4444' : OUTLINE;
  ctx.fillRect(9 * P, -7 * P + punchLift, 5 * P, 11 * P);
  ctx.fillStyle = isTelegraph ? '#dc2626' : BASALT_MID;
  ctx.fillRect(10 * P, -6 * P + punchLift, 3 * P, 9 * P);
  if (isTelegraph) {
    ctx.fillStyle = '#fee2e2';
    ctx.fillRect(11 * P, -4 * P + punchLift, 1 * P, 3 * P);
  }

  // Si está enfriado por hielo: escarcha de píxeles celestes sobre el torso
  if (isCooled) {
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(-8 * P, -7 * P, 2 * P, 1 * P);
    ctx.fillRect(4 * P, -6 * P, 2 * P, 1 * P);
    ctx.fillRect(-2 * P, -1 * P, 3 * P, 1 * P);
    ctx.fillRect(6 * P, 0, 2 * P, 1 * P);
  }

  ctx.restore();
}

// 2. ESPECTRO DE TORMENTA (Storm Stalker) — Hostigador Rápido / Flanqueador en Pixel Art 16-Bit
export function drawStormStalker(ctx: CanvasRenderingContext2D, enemy: GameEnemy, now: number) {
  const r = enemy.radius;
  const P = getCommonEnemyMetrics(enemy).pixel;
  const isChargingSpark = (enemy.sparkTimer ?? 0) > 170;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Flotación escalonada rígida en 3 niveles de píxeles
  const floatStep = Math.floor(now * 0.006) % 4;
  const floatY = (floatStep === 1 ? -1 : floatStep === 3 ? 1 : 0) * P;
  ctx.translate(0, floatY);

  // Paleta de color indexada
  const OUTLINE = '#0f172a';
  const GHOST_DEEP = '#0f172a';
  const ELECTRIC_BLUE = '#0284c7';
  const CYAN_BRIGHT = '#38bdf8';
  const VOLT_CYAN = '#00f0ff';
  const WHITE = '#ffffff';

  // A. Sombra pixelada tenue en el suelo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(-7 * P, 9 * P - floatY, 14 * P, 1 * P);
  ctx.fillRect(-8 * P, 10 * P - floatY, 16 * P, 2 * P);
  ctx.fillRect(-7 * P, 12 * P - floatY, 14 * P, 1 * P);

  // B. Silueta etérea dentada con base deshilachada que oscila rítmicamente
  const fringeShift = Math.floor(now * 0.008) % 2 === 0 ? 0 : 1;

  // Capucha y pico superior
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-1 * P, -16 * P, 3 * P, 3 * P);
  ctx.fillRect(-4 * P, -13 * P, 9 * P, 4 * P);

  // Cuerpo dentado
  ctx.fillRect(-6 * P, -9 * P, 13 * P, 12 * P);
  ctx.fillRect(-7 * P, -6 * P, 15 * P, 8 * P);

  // Relleno del manto espectral
  ctx.fillStyle = GHOST_DEEP;
  ctx.fillRect(-5 * P, -8 * P, 11 * P, 11 * P);
  ctx.fillRect(-6 * P, -5 * P, 13 * P, 7 * P);

  // Borde dentado exterior en cian / azul eléctrico (#0284C7, #38BDF8)
  ctx.fillStyle = ELECTRIC_BLUE;
  ctx.fillRect(-6 * P, -8 * P, 1 * P, 10 * P);
  ctx.fillRect(6 * P, -8 * P, 1 * P, 10 * P);
  ctx.fillStyle = CYAN_BRIGHT;
  ctx.fillRect(-5 * P, -12 * P, 1 * P, 4 * P);
  ctx.fillRect(5 * P, -12 * P, 1 * P, 4 * P);

  // Base deshilachada en picos de píxeles que oscilan de izquierda a derecha
  ctx.fillStyle = ELECTRIC_BLUE;
  // Pico 1
  ctx.fillRect((-5 + fringeShift) * P, 4 * P, 2 * P, 3 * P);
  ctx.fillRect((-5 + fringeShift) * P, 7 * P, 1 * P, 2 * P);
  // Pico 2 (central)
  ctx.fillRect((0 - fringeShift) * P, 4 * P, 2 * P, 4 * P);
  ctx.fillRect((0 - fringeShift) * P, 8 * P, 1 * P, 2 * P);
  // Pico 3
  ctx.fillRect((4 + fringeShift) * P, 4 * P, 2 * P, 3 * P);
  ctx.fillRect((4 + fringeShift) * P, 7 * P, 1 * P, 2 * P);

  // C. Filamentos de relámpago vertical en cian eléctrico (#00F0FF) por el torso
  ctx.fillStyle = VOLT_CYAN;
  ctx.fillRect(-1 * P, -7 * P, 1 * P, 2 * P);
  ctx.fillRect(0 * P, -5 * P, 2 * P, 1 * P);
  ctx.fillRect(1 * P, -4 * P, 1 * P, 3 * P);
  ctx.fillRect(0 * P, -1 * P, 1 * P, 2 * P);
  ctx.fillRect(-2 * P, 0 * P, 2 * P, 1 * P);
  ctx.fillRect(-2 * P, 1 * P, 1 * P, 2 * P);

  // D. Capucha sombría con ojos blancos de 2 píxeles
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-3 * P, -12 * P, 7 * P, 4 * P);

  ctx.fillStyle = WHITE;
  ctx.fillRect(-2 * P, -11 * P, 1 * P, 1 * P);
  ctx.fillRect(2 * P, -11 * P, 1 * P, 1 * P);

  // E. Partículas de chispa: pequeños cuadrados de 2x2 píxeles que parpadean
  const sparkPhase = Math.floor(now * 0.015) % 3;
  ctx.fillStyle = VOLT_CYAN;
  if (sparkPhase === 0) {
    ctx.fillRect(7 * P, -4 * P, 2 * P, 2 * P);
    ctx.fillRect(-8 * P, 1 * P, 2 * P, 2 * P);
  } else if (sparkPhase === 1) {
    ctx.fillRect(-7 * P, -7 * P, 2 * P, 2 * P);
    ctx.fillRect(6 * P, 3 * P, 2 * P, 2 * P);
  } else {
    ctx.fillRect(0 * P, -15 * P, 2 * P, 2 * P);
    ctx.fillRect(-6 * P, 6 * P, 2 * P, 2 * P);
  }

  // F. Carga de orbe de plasma eléctrico (cubo de energía pixelada)
  if (isChargingSpark) {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(-3 * P, -4 * P, 7 * P, 7 * P);
    ctx.fillStyle = VOLT_CYAN;
    ctx.fillRect(-2 * P, -3 * P, 5 * P, 5 * P);
    ctx.fillStyle = WHITE;
    ctx.fillRect(-1 * P, -2 * P, 3 * P, 3 * P);
  }

  ctx.restore();
}

// 3. ACECHADOR DE ESCARCHA (Frost Lurker) — Francotirador / Escudo Frontal en Pixel Art 16-Bit
export function drawFrostLurker(ctx: CanvasRenderingContext2D, enemy: GameEnemy, now: number) {
  const r = enemy.radius;
  const P = getCommonEnemyMetrics(enemy).pixel;
  const isBroken = (enemy.shieldBrokenTimer ?? 0) > 0;
  const isSniping = !!enemy.isSniping;
  const facing = enemy.facingAngle ?? 0;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Paleta indexada
  const OUTLINE = '#0f172a';
  const ICE_ARCTIC = '#7dd3fc'; // Azul ártico
  const ICE_DEEP = '#0284c7';   // Azul profundo
  const ICE_WHITE = '#f8fafc';  // Blanco nieve
  const ICE_CYAN = '#38bdf8';

  // A. Línea de telegrafiado fino de francotirador en el suelo (escalonada)
  if (isSniping) {
    ctx.save();
    const aimLen = 300;
    const endX = Math.cos(facing) * aimLen;
    const endY = Math.sin(facing) * aimLen * 0.58;

    ctx.strokeStyle = ICE_ARCTIC;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, -5 * P);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // B. Sombra pixelada en el suelo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(-8 * P, 6 * P, 16 * P, 1 * P);
  ctx.fillRect(-10 * P, 7 * P, 20 * P, 2 * P);
  ctx.fillRect(-8 * P, 9 * P, 16 * P, 1 * P);

  // C. Cuernos o espinas de hielo con quiebres estrictos de 45 grados
  ctx.fillStyle = OUTLINE;
  // Espina superior izquierda (diagonal 45°)
  ctx.fillRect(-7 * P, -14 * P, 2 * P, 2 * P);
  ctx.fillRect(-6 * P, -12 * P, 2 * P, 2 * P);
  ctx.fillRect(-5 * P, -10 * P, 2 * P, 2 * P);

  // Espina superior derecha (diagonal 45°)
  ctx.fillRect(6 * P, -14 * P, 2 * P, 2 * P);
  ctx.fillRect(5 * P, -12 * P, 2 * P, 2 * P);
  ctx.fillRect(4 * P, -10 * P, 2 * P, 2 * P);

  // Relleno de espinas
  ctx.fillStyle = ICE_WHITE;
  ctx.fillRect(-6 * P, -13 * P, 1 * P, 1 * P);
  ctx.fillRect(-5 * P, -11 * P, 1 * P, 1 * P);
  ctx.fillRect(5 * P, -13 * P, 1 * P, 1 * P);
  ctx.fillRect(4 * P, -11 * P, 1 * P, 1 * P);

  // D. Caparazón angular tipo cristal de escarcha en azul ártico (#7DD3FC) y blanco nieve (#F8FAFC)
  // Contorno del cuerpo cristalino
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-6 * P, -9 * P, 12 * P, 13 * P);
  ctx.fillRect(-8 * P, -6 * P, 16 * P, 8 * P);
  ctx.fillRect(-4 * P, -12 * P, 8 * P, 3 * P); // Vértice superior

  // Relleno angular del cristal
  ctx.fillStyle = ICE_ARCTIC;
  ctx.fillRect(-5 * P, -8 * P, 10 * P, 11 * P);
  ctx.fillRect(-7 * P, -5 * P, 14 * P, 6 * P);

  // Faceta interna iluminada (blanco nieve)
  ctx.fillStyle = ICE_WHITE;
  ctx.fillRect(-3 * P, -11 * P, 6 * P, 2 * P);
  ctx.fillRect(-2 * P, -8 * P, 2 * P, 7 * P);
  ctx.fillRect(-5 * P, -5 * P, 2 * P, 4 * P);

  // Faceta interna de sombra (azul profundo)
  ctx.fillStyle = ICE_DEEP;
  ctx.fillRect(2 * P, -5 * P, 4 * P, 6 * P);
  ctx.fillRect(0 * P, 1 * P, 4 * P, 2 * P);

  // E. Ojos cristalinos azul profundo (1 o 2 píxeles)
  ctx.fillStyle = ICE_DEEP;
  ctx.fillRect(-3 * P, -7 * P, 2 * P, 1 * P);
  ctx.fillRect(2 * P, -7 * P, 2 * P, 1 * P);

  // F. CORAZA FRONTAL (Escudo de hielo denso en Pixel Art)
  if (!isBroken) {
    ctx.save();
    const shieldDist = 6 * P;
    const shX = Math.cos(facing) * shieldDist;
    const shY = -4 * P + Math.sin(facing) * shieldDist * 0.58;
    ctx.translate(shX, shY);

    // Escudo romboidal facetado en píxeles
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(-6 * P, -6 * P, 12 * P, 12 * P);
    ctx.fillRect(-7 * P, -4 * P, 14 * P, 8 * P);

    // Cara frontal brillante
    ctx.fillStyle = ICE_WHITE;
    ctx.fillRect(-5 * P, -5 * P, 5 * P, 10 * P);
    ctx.fillStyle = ICE_CYAN;
    ctx.fillRect(0 * P, -5 * P, 5 * P, 10 * P);

    // Runa o cresta central de diamante
    ctx.fillStyle = ICE_DEEP;
    ctx.fillRect(-2 * P, -2 * P, 4 * P, 4 * P);
    ctx.fillStyle = ICE_WHITE;
    ctx.fillRect(-1 * P, -1 * P, 2 * P, 2 * P);

    ctx.restore();
  } else {
    // Si la coraza está rota por fuego: gotas y esquirlas calientes dispersas
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-4 * P, -4 * P, 2 * P, 2 * P);
    ctx.fillRect(3 * P, -2 * P, 2 * P, 2 * P);
    ctx.fillRect(0, 3 * P, 2 * P, 2 * P);
  }

  ctx.restore();
}

// 4. BARRA DE SALUD SEGMENTADA EN PIXEL ART 16-BIT
export function drawEnemyHealthBar(ctx: CanvasRenderingContext2D, enemy: GameEnemy) {
  const r = enemy.radius;
  const metrics = getCommonEnemyMetrics(enemy);
  const barW = Math.min(76, Math.max(46, Math.round(metrics.width * metrics.pixel * 0.65)));
  const barH = 5;
  const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
  const iconSize = 12;

  const barX = Math.round(-barW / 2 + iconSize * 0.5);
  const barY = metrics.head * metrics.pixel - 14;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // A. Icono de debilidad elemental
  let weaknessIcon = '⚔️';
  let weaknessColor = '#f59e0b';
  if (enemy.weakness === 'fire') {
    weaknessIcon = '🔥';
    weaknessColor = '#ef4444';
  } else if (enemy.weakness === 'ice') {
    weaknessIcon = '❄️';
    weaknessColor = '#38bdf8';
  } else if (enemy.weakness === 'lightning') {
    weaknessIcon = '⚡';
    weaknessColor = '#facc15';
  } else if (enemy.weakness === 'earth') {
    weaknessIcon = '🌍';
    weaknessColor = '#84cc16';
  }

  const iconX = barX - iconSize - 2;
  const iconY = barY + barH / 2;

  // Borde pixel del icono
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(iconX - 7, barY - 1, 14, barH + 2);
  ctx.fillStyle = weaknessColor;
  ctx.fillRect(iconX - 6, barY, 12, barH);

  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(weaknessIcon, iconX, iconY);

  // B. Fondo de la barra con doble borde pixel (#0F172A exterior)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#18181b';
  ctx.fillRect(barX, barY, barW, barH);

  // C. Relleno segmentado de vida
  const fillW = Math.round(barW * hpPct);
  if (fillW > 0) {
    if (hpPct > 0.5) {
      ctx.fillStyle = '#22c55e';
    } else if (hpPct > 0.25) {
      ctx.fillStyle = '#f59e0b';
    } else {
      ctx.fillStyle = '#ef4444';
    }
    ctx.fillRect(barX, barY, fillW, barH);

    // Brillo superior de 1 píxel
    ctx.fillStyle = hpPct > 0.5 ? '#86efac' : hpPct > 0.25 ? '#fde047' : '#fca5a5';
    ctx.fillRect(barX, barY, fillW, 1);
  }

  // D. Separadores de segmento rígidos (3 bloques de vida)
  ctx.fillStyle = '#0f172a';
  const segStep = Math.round(barW / 3);
  ctx.fillRect(barX + segStep, barY, 1, barH);
  ctx.fillRect(barX + segStep * 2, barY, 1, barH);

  // E. Badges de estado activo en tipografía bitmap
  let statusText = '';
  if (enemy.statuses.some((s) => s.type === 'frozen')) statusText += '🧊 ';
  if (enemy.statuses.some((s) => s.type === 'burning')) statusText += '🔥 ';
  if (enemy.statuses.some((s) => s.type === 'shocked')) statusText += '⚡ ';
  if (enemy.statuses.some((s) => s.type === 'slowed')) statusText += '❄️ ';
  if ((enemy.frenzyTimer ?? 0) > 0) statusText += 'FRENESI ';
  if ((enemy.cooledDownTimer ?? 0) > 0) statusText += 'ENFRIADO ';
  if ((enemy.shieldBrokenTimer ?? 0) > 0) statusText += 'CORAZA ';

  if (statusText) {
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.fillText(statusText.trim(), barX + barW / 2 + 1, barY - 5);
    ctx.fillStyle = '#fde047';
    ctx.fillText(statusText.trim(), barX + barW / 2, barY - 6);
  }

  ctx.restore();
}

// 5. RENDERIZADO EN PIXEL ART PARA JEFES FALLBACK (Basalt Guardian, Storm Wraith, Obsidian Dragon)
export function drawBossVector(ctx: CanvasRenderingContext2D, enemy: GameEnemy, now: number) {
  const r = enemy.radius;
  const P = Math.max(1, Math.round(r / 12));
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const OUTLINE = '#0f172a';

  if (enemy.bossType === 'basalt_guardian') {
    // Sombra pixelada
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-14 * P, 8 * P, 28 * P, 3 * P);

    // Cuerpo monolítico de basalto
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(-12 * P, -16 * P, 24 * P, 26 * P);
    ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#334155';
    ctx.fillRect(-10 * P, -14 * P, 20 * P, 22 * P);

    // Placas de armadura y runas doradas
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-8 * P, -12 * P, 16 * P, 4 * P);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-3 * P, -6 * P, 6 * P, 6 * P);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1 * P, -4 * P, 2 * P, 2 * P);
  } else if (enemy.bossType === 'storm_wraith') {
    // Espectro de la Tormenta
    const floatY = (Math.floor(now * 0.005) % 2 === 0 ? 0 : 2) * P;
    ctx.translate(0, floatY);

    ctx.fillStyle = OUTLINE;
    ctx.fillRect(-12 * P, -18 * P, 24 * P, 28 * P);
    ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#1e1b4b';
    ctx.fillRect(-10 * P, -16 * P, 20 * P, 24 * P);

    // Filamentos eléctricos de píxeles
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-3 * P, -10 * P, 2 * P, 4 * P);
    ctx.fillRect(1 * P, -8 * P, 4 * P, 2 * P);
    ctx.fillRect(-1 * P, 0 * P, 3 * P, 5 * P);

    // Ojos
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5 * P, -12 * P, 2 * P, 2 * P);
    ctx.fillRect(3 * P, -12 * P, 2 * P, 2 * P);
  } else {
    // Dragón de Obsidiana
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(-14 * P, -16 * P, 28 * P, 26 * P);
    ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#1c1917';
    ctx.fillRect(-12 * P, -14 * P, 24 * P, 22 * P);

    // Grietas de lava pura
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-6 * P, -10 * P, 12 * P, 2 * P);
    ctx.fillRect(-2 * P, -6 * P, 4 * P, 8 * P);

    // Ojos y fauces de fuego
    ctx.fillStyle = '#ff3d00';
    ctx.fillRect(-6 * P, -12 * P, 3 * P, 2 * P);
    ctx.fillRect(3 * P, -12 * P, 3 * P, 2 * P);
  }

  ctx.restore();
}
