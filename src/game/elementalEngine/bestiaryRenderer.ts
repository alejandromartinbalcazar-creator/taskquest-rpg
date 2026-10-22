import { GameEnemy } from './types';

/**
 * Renderizado Procedural Vectorial del Bestiario Elemental para Canvas 2D.
 * Cero emojis. Geometría vectorial pura, facetas angulares, gradientes y trazados a 60 FPS.
 */

// 1. GÓLEM DE ESCORIA ÍGNEA (Pyre Golem) — Melé Pesado / Tanque
export function drawPyreGolem(ctx: CanvasRenderingContext2D, enemy: GameEnemy, now: number) {
  const r = enemy.radius;
  const isCooled = (enemy.cooledDownTimer ?? 0) > 0;
  const isFrenzy = (enemy.frenzyTimer ?? 0) > 0;
  const heatPulse = 0.75 + 0.25 * Math.sin(now * 0.006);

  ctx.save();

  // A. Sombra elíptica sólida en el suelo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.85, r * 1.35, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // B. Resplandor de magma / frenesí
  if (!isCooled) {
    const glowGrad = ctx.createRadialGradient(0, -r * 0.6, 5, 0, -r * 0.6, r * 1.6);
    if (isFrenzy) {
      glowGrad.addColorStop(0, 'rgba(255, 69, 0, 0.45)');
      glowGrad.addColorStop(0.6, 'rgba(255, 0, 0, 0.2)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      glowGrad.addColorStop(0, 'rgba(255, 109, 0, 0.3)');
      glowGrad.addColorStop(0.7, 'rgba(255, 69, 0, 0.1)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, -r * 0.6, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // C. Piernas de basalto pesadas
  ctx.fillStyle = '#1c1917';
  ctx.strokeStyle = isCooled ? '#334155' : '#292524';
  ctx.lineWidth = 1.5;

  // Pierna izquierda
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, -r * 0.2);
  ctx.lineTo(-r * 0.5, r * 0.7);
  ctx.lineTo(-r * 0.15, r * 0.65);
  ctx.lineTo(-r * 0.3, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pierna derecha
  ctx.beginPath();
  ctx.moveTo(r * 0.3, -r * 0.2);
  ctx.lineTo(r * 0.15, r * 0.65);
  ctx.lineTo(r * 0.5, r * 0.7);
  ctx.lineTo(r * 0.75, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // D. Torso de roca volcánica asimétrica
  ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#292524';
  ctx.beginPath();
  ctx.moveTo(-r * 0.95, -r * 0.4); // Hombro izq
  ctx.lineTo(-r * 1.25, -r * 1.1); // Púa hombro izq
  ctx.lineTo(-r * 0.5, -r * 1.4);  // Clavícula izq
  ctx.lineTo(0, -r * 1.55);        // Cuello
  ctx.lineTo(r * 0.6, -r * 1.35);  // Clavícula der
  ctx.lineTo(r * 1.2, -r * 0.95);  // Hombro der
  ctx.lineTo(r * 0.85, -r * 0.3);  // Costado der
  ctx.lineTo(r * 0.45, 0);         // Cintura der
  ctx.lineTo(-r * 0.45, 0);        // Cintura izq
  ctx.closePath();
  ctx.fill();

  // Borde biselado
  ctx.strokeStyle = isCooled ? '#475569' : '#44403c';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // E. Grietas interiores de magma (o enfriadas a gris/negro ceniza)
  const crackStroke = isCooled ? '#334155' : (isFrenzy ? '#ffd700' : '#ff4500');
  ctx.strokeStyle = crackStroke;
  ctx.lineWidth = isCooled ? 1.5 : (2.2 * heatPulse);
  ctx.lineCap = 'round';

  ctx.beginPath();
  // Grieta diagonal 1
  ctx.moveTo(-r * 0.5, -r * 1.2);
  ctx.lineTo(-r * 0.2, -r * 0.8);
  ctx.lineTo(-r * 0.35, -r * 0.4);
  // Grieta central hacia núcleo
  ctx.moveTo(r * 0.4, -r * 1.1);
  ctx.lineTo(0.1, -r * 0.75);
  ctx.lineTo(0.25, -r * 0.35);
  // Grieta inferior
  ctx.moveTo(-r * 0.1, -r * 0.4);
  ctx.lineTo(0, -r * 0.1);
  ctx.stroke();

  // F. Núcleo incandescente en el pecho
  const coreY = -r * 0.75;
  ctx.save();
  ctx.translate(0, coreY);
  const coreR = r * 0.32;
  const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coreR);
  if (isCooled) {
    coreGrad.addColorStop(0, '#64748b');
    coreGrad.addColorStop(0.7, '#334155');
    coreGrad.addColorStop(1, '#0f172a');
  } else if (isFrenzy) {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, '#ffea00');
    coreGrad.addColorStop(0.7, '#ff3d00');
    coreGrad.addColorStop(1, 'rgba(255, 0, 0, 0.4)');
  } else {
    coreGrad.addColorStop(0, '#ffd700');
    coreGrad.addColorStop(0.5, '#ff4500');
    coreGrad.addColorStop(1, '#7f1d1d');
  }
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  // Forma de rombo de piedra
  ctx.moveTo(0, -coreR);
  ctx.lineTo(coreR * 0.85, 0);
  ctx.lineTo(0, coreR);
  ctx.lineTo(-coreR * 0.85, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // G. Cabeza de roca basáltica con ojos incandescentes
  const headY = -r * 1.6;
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, headY + r * 0.25);
  ctx.lineTo(-r * 0.45, headY - r * 0.2);
  ctx.lineTo(-r * 0.2, headY - r * 0.45);
  ctx.lineTo(r * 0.25, headY - r * 0.4);
  ctx.lineTo(r * 0.4, headY - r * 0.15);
  ctx.lineTo(r * 0.3, headY + r * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isCooled ? '#475569' : '#57534e';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ojos (hendiduras brillantes)
  ctx.fillStyle = isCooled ? '#94a3b8' : (isFrenzy ? '#ff1744' : '#ffd54f');
  ctx.beginPath();
  ctx.ellipse(-r * 0.18, headY - r * 0.1, r * 0.09, r * 0.04, -0.2, 0, Math.PI * 2);
  ctx.ellipse(r * 0.18, headY - r * 0.1, r * 0.09, r * 0.04, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // H. Brazos y Puños de roca pesados
  const isTelegraph = enemy.isTelegraphing;
  const punchLift = isTelegraph ? -r * 0.5 : 0;

  // Brazo izquierdo
  ctx.fillStyle = '#292524';
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.9);
  ctx.lineTo(-r * 1.4, -r * 0.4 + punchLift);
  ctx.lineTo(-r * 1.15, 0 + punchLift);
  ctx.lineTo(-r * 0.75, -r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Brazo derecho (puño pesado telegrafiado)
  ctx.fillStyle = isTelegraph ? '#7f1d1d' : '#292524';
  ctx.beginPath();
  ctx.moveTo(r * 0.9, -r * 0.9);
  ctx.lineTo(r * 1.45, -r * 0.3 + punchLift * 1.4);
  ctx.lineTo(r * 1.2, r * 0.1 + punchLift * 1.4);
  ctx.lineTo(r * 0.75, -r * 0.4);
  ctx.closePath();
  ctx.fill();
  if (isTelegraph) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
  }
  ctx.stroke();

  // Destello de escarcha si está enfriado
  if (isCooled) {
    ctx.fillStyle = 'rgba(103, 232, 249, 0.35)';
    ctx.beginPath();
    ctx.arc(0, -r * 0.7, r * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// 2. ESPECTRO DE TORMENTA (Storm Stalker) — Hostigador Rápido / Flanqueador
export function drawStormStalker(ctx: CanvasRenderingContext2D, enemy: GameEnemy, now: number) {
  const r = enemy.radius;
  // Flotación senoidal suave
  const floatY = Math.sin(now * 0.005) * 5;
  const isChargingSpark = (enemy.sparkTimer ?? 0) > 170; // Últimos 40 frames antes de disparar

  ctx.save();
  ctx.translate(0, floatY);

  // A. Sombra flotante tenue en el suelo (se atenúa con la altura)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, r * 1.2 - floatY, r * 0.9, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // B. Aura de plasma voltaico
  const auraGrad = ctx.createRadialGradient(0, -r * 0.8, 4, 0, -r * 0.8, r * 1.6);
  auraGrad.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
  auraGrad.addColorStop(0.5, 'rgba(124, 77, 255, 0.18)');
  auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, -r * 0.8, r * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // C. Manto espectral etéreo (color zafiro oscuro sin piernas)
  ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.7); // Pico capucha
  ctx.quadraticCurveTo(-r * 0.85, -r * 1.2, -r * 0.95, -r * 0.3); // Hombro izq
  ctx.lineTo(-r * 1.1, r * 0.4); // Caída manto izq

  // Jirones inferiores ondulantes
  const wave1 = Math.sin(now * 0.008) * 3;
  const wave2 = Math.cos(now * 0.009) * 4;
  const wave3 = Math.sin(now * 0.007 + 1) * 3;

  ctx.lineTo(-r * 0.65, r * 0.8 + wave1);
  ctx.lineTo(-r * 0.3, r * 0.4);
  ctx.lineTo(0, r * 0.9 + wave2);
  ctx.lineTo(r * 0.35, r * 0.45);
  ctx.lineTo(r * 0.7, r * 0.85 + wave3);
  ctx.lineTo(r * 1.05, r * 0.35); // Caída manto der
  ctx.quadraticCurveTo(r * 0.85, -r * 1.2, 0, -r * 1.7);
  ctx.closePath();
  ctx.fill();

  // Borde exterior místico en azul zafiro luminoso
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // D. Filamentos de relámpago vertical en cian eléctrico (#00f0ff) por el torso
  ctx.save();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.6;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  // Relámpago central
  ctx.moveTo(-r * 0.15, -r * 1.2);
  ctx.lineTo(r * 0.1, -r * 0.9);
  ctx.lineTo(-r * 0.18, -r * 0.6);
  ctx.lineTo(r * 0.15, -r * 0.2);
  ctx.lineTo(-r * 0.05, r * 0.3);
  // Ramificación derecha
  ctx.moveTo(r * 0.1, -r * 0.9);
  ctx.lineTo(r * 0.4, -r * 0.7);
  ctx.lineTo(r * 0.3, -r * 0.35);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // E. Capucha sombría con ojos blancos incandescentes
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.ellipse(0, -r * 1.15, r * 0.45, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ojos blancos brillantes
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(-r * 0.16, -r * 1.15, r * 0.1, r * 0.05, -0.15, 0, Math.PI * 2);
  ctx.ellipse(r * 0.16, -r * 1.15, r * 0.1, r * 0.05, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // F. Si está canalizando orbe de chispa eléctrica: esfera de energía flotante
  if (isChargingSpark) {
    const sparkR = r * 0.35 + Math.random() * 3;
    const orbY = -r * 0.4;
    const orbGrad = ctx.createRadialGradient(0, orbY, 2, 0, orbY, sparkR);
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(0.5, '#00f0ff');
    orbGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

    ctx.save();
    ctx.fillStyle = orbGrad;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, orbY, sparkR, 0, Math.PI * 2);
    ctx.fill();

    // Chispas de arco rotando
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    for (let c = 0; c < 3; c++) {
      const ang = (c * Math.PI * 2) / 3 + now * 0.015;
      ctx.beginPath();
      ctx.moveTo(0, orbY);
      ctx.lineTo(Math.cos(ang) * sparkR * 1.4, orbY + Math.sin(ang) * sparkR * 1.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

// 3. ACECHADOR DE ESCARCHA (Frost Lurker) — Francotirador / Escudo Frontal
export function drawFrostLurker(ctx: CanvasRenderingContext2D, enemy: GameEnemy, now: number) {
  const r = enemy.radius;
  const isBroken = (enemy.shieldBrokenTimer ?? 0) > 0;
  const isSniping = !!enemy.isSniping;
  const facing = enemy.facingAngle ?? 0;

  ctx.save();

  // A. Línea de telegrafiado fino de francotirador en el suelo
  if (isSniping) {
    ctx.save();
    const aimLen = 320;
    const endX = Math.cos(facing) * aimLen;
    const endY = Math.sin(facing) * aimLen * 0.58;

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 6]);
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.5);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // B. Sombra alargada en perspectiva isométrica
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.8, r * 1.1, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // C. Rastro de vapor gélido en la base
  const mistGrad = ctx.createRadialGradient(0, r * 0.6, 2, 0, r * 0.6, r * 1.2);
  mistGrad.addColorStop(0, 'rgba(125, 211, 252, 0.25)');
  mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = mistGrad;
  ctx.beginPath();
  ctx.arc(0, r * 0.6, r * 1.2, 0, Math.PI * 2);
  ctx.fill();

  // D. Espalda con agujas de hielo que vibran al apuntar
  const spikeJitter = isSniping ? Math.sin(now * 0.05) * 2.2 : 0;
  ctx.fillStyle = '#0284c7';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;

  const needleAngles = [-0.4, -0.15, 0.15, 0.4];
  needleAngles.forEach((nAng, idx) => {
    const nLen = r * (1.1 + (idx % 2) * 0.35);
    const ang = nAng + Math.PI + facing + spikeJitter * 0.05;
    const sx = Math.cos(ang) * (r * 0.6);
    const sy = -r * 0.8 + Math.sin(ang) * (r * 0.4);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ang + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(-r * 0.12, 0);
    ctx.lineTo(0, -nLen);
    ctx.lineTo(r * 0.12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // E. Cuerpo angular de hielo translúcido (#38bdf8, 85% alpha)
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#38bdf8';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;

  // Torso cristalino multifacético
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.6);         // Vértice superior cabeza
  ctx.lineTo(-r * 0.55, -r * 1.25); // Cresta izq
  ctx.lineTo(-r * 0.85, -r * 0.6);  // Costado izq
  ctx.lineTo(-r * 0.45, r * 0.2);   // Pierna izq
  ctx.lineTo(0, r * 0.4);           // Base
  ctx.lineTo(r * 0.45, r * 0.2);    // Pierna der
  ctx.lineTo(r * 0.85, -r * 0.6);   // Costado der
  ctx.lineTo(r * 0.55, -r * 1.25);  // Cresta der
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Facetas angulares internas (prisma de cristal)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.6);
  ctx.lineTo(0, r * 0.4);
  ctx.moveTo(-r * 0.85, -r * 0.6);
  ctx.lineTo(0, -r * 0.7);
  ctx.lineTo(r * 0.85, -r * 0.6);
  ctx.stroke();
  ctx.restore();

  // F. Ojos cristalinos azul profundo
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 1.2, r * 0.08, 0, Math.PI * 2);
  ctx.arc(r * 0.22, -r * 1.2, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // G. CORAZA FRONTAL (Escudo de hielo denso que reduce 80% daño de frente salvo fuego)
  if (!isBroken) {
    ctx.save();
    // Orientado según facingAngle
    const shieldDist = r * 0.85;
    const shX = Math.cos(facing) * shieldDist;
    const shY = -r * 0.6 + Math.sin(facing) * shieldDist * 0.58;

    ctx.translate(shX, shY);
    ctx.rotate(facing + Math.PI / 2);

    const shW = r * 1.4;
    const shH = r * 0.65;

    // Escudo glacial brillante
    const shGrad = ctx.createLinearGradient(-shW / 2, 0, shW / 2, 0);
    shGrad.addColorStop(0, '#0284c7');
    shGrad.addColorStop(0.5, '#e0f2fe');
    shGrad.addColorStop(1, '#0284c7');

    ctx.fillStyle = shGrad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(-shW / 2, -shH * 0.4);
    ctx.lineTo(0, -shH);
    ctx.lineTo(shW / 2, -shH * 0.4);
    ctx.lineTo(shW * 0.35, shH * 0.6);
    ctx.lineTo(0, shH);
    ctx.lineTo(-shW * 0.35, shH * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Borde de diamante interior
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-shW * 0.2, -shH * 0.4, shW * 0.4, shH * 0.8);

    ctx.restore();
  } else {
    // Si la coraza está rota por FUEGO: gotas de agua ardiente y vapor
    ctx.fillStyle = 'rgba(255, 109, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(0, -r * 0.6, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// 4. BARRA DE SALUD SEGMENTADA CON ICONO DE DEBILIDAD ELEMENTAL (OPTIMIZADA PARA ENJAMBRES Y ESCUADRONES)
export function drawEnemyHealthBar(ctx: CanvasRenderingContext2D, enemy: GameEnemy) {
  const r = enemy.radius;
  const barW = Math.max(34, r * 2.2);
  const barH = 5;
  const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
  const iconSize = 12;

  // Escalonamiento vertical sutil basado en el ID para evitar solapamiento caótico entre escuadrones cercanos
  const verticalStagger = (enemy.id.charCodeAt(enemy.id.length - 1) % 2 === 0) ? 0 : -3;
  const barX = -barW / 2 + iconSize * 0.5;
  const barY = -r * 1.8 - 14 + verticalStagger;

  ctx.save();

  // Placa de contraste oscura para mantener legibilidad absoluta durante combates en enjambre
  const plateX = barX - iconSize - 4;
  const plateW = barW + iconSize + 6;
  const plateH = barH + 6;
  ctx.fillStyle = 'rgba(10, 15, 29, 0.88)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(plateX, barY - 3, plateW, plateH, 3);
  ctx.fill();
  ctx.stroke();

  // A. Icono de Debilidad Elemental a la izquierda
  let weaknessIcon = '⚔️';
  let weaknessBg = '#334155';
  let weaknessBorder = '#64748b';

  if (enemy.bestiaryType === 'pyre_golem' || enemy.weakness === 'ice') {
    weaknessIcon = '❄️';
    weaknessBg = '#083344';
    weaknessBorder = '#06b6d4';
  } else if (enemy.bestiaryType === 'storm_stalker' || enemy.weakness === 'earth') {
    weaknessIcon = '🌍';
    weaknessBg = '#14532d';
    weaknessBorder = '#22c55e';
  } else if (enemy.bestiaryType === 'frost_lurker' || enemy.weakness === 'fire') {
    weaknessIcon = '🔥';
    weaknessBg = '#450a0a';
    weaknessBorder = '#ef4444';
  } else if (enemy.weakness === 'lightning') {
    weaknessIcon = '⚡';
    weaknessBg = '#422006';
    weaknessBorder = '#eab308';
  }

  const iconX = barX - iconSize - 1;
  const iconY = barY + barH / 2;

  // Círculo base para el icono
  ctx.fillStyle = weaknessBg;
  ctx.strokeStyle = weaknessBorder;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(iconX, iconY, iconSize * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Glifo de debilidad
  ctx.font = '8.5px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(weaknessIcon, iconX, iconY);

  // B. Fondo de la Barra
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillRect(barX, barY, barW, barH);

  // C. Relleno segmentado de vida
  const fillW = barW * hpPct;
  const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  if (hpPct > 0.5) {
    hpGrad.addColorStop(0, '#22c55e');
    hpGrad.addColorStop(1, '#86efac');
  } else if (hpPct > 0.25) {
    hpGrad.addColorStop(0, '#f59e0b');
    hpGrad.addColorStop(1, '#fde047');
  } else {
    hpGrad.addColorStop(0, '#ef4444');
    hpGrad.addColorStop(1, '#fca5a5');
  }
  ctx.fillStyle = hpGrad;
  ctx.fillRect(barX, barY, fillW, barH);

  // D. Separadores de segmento (3 segmentos)
  ctx.fillStyle = '#0f172a';
  const segStep = barW / 3;
  ctx.fillRect(barX + segStep, barY, 1, barH);
  ctx.fillRect(barX + segStep * 2, barY, 1, barH);

  // E. Badges de estado activo
  let statusText = '';
  if (enemy.statuses.some((s) => s.type === 'frozen')) statusText += '🧊 ';
  if (enemy.statuses.some((s) => s.type === 'burning')) statusText += '🔥 ';
  if (enemy.statuses.some((s) => s.type === 'shocked')) statusText += '⚡ ';
  if (enemy.statuses.some((s) => s.type === 'slowed')) statusText += '❄️ ';
  if ((enemy.frenzyTimer ?? 0) > 0) statusText += '🔥FRENESÍ ';
  if ((enemy.cooledDownTimer ?? 0) > 0) statusText += '🧊ENFRIADO ';
  if ((enemy.shieldBrokenTimer ?? 0) > 0) statusText += '💔CORAZA ';

  if (statusText) {
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(statusText.trim(), barX + barW / 2, barY - 7);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

// 5. RENDERIZADO PROCEDURAL VECTORIAL PARA JEFES (Elimina todo emoji de Canvas)
export function drawBossVector(ctx: CanvasRenderingContext2D, enemy: GameEnemy, now: number) {
  const r = enemy.radius;
  ctx.save();

  if (enemy.bossType === 'basalt_guardian') {
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.8, r * 1.3, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo monolítico de basalto
    ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 1.5);
    ctx.lineTo(r * 0.8, -r * 1.5);
    ctx.lineTo(r * 1.1, r * 0.4);
    ctx.lineTo(-r * 1.1, r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Corona y runas doradas
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -r * 0.6, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, -r * 1.0, r * 0.08, r * 0.04, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.3, -r * 1.0, r * 0.08, r * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.bossType === 'storm_wraith') {
    // Espectro de la Tormenta
    const floatY = Math.sin(now * 0.005) * 6;
    ctx.translate(0, floatY);
    ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#1e1b4b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.6);
    ctx.lineTo(-r * 0.9, -r * 0.5);
    ctx.lineTo(-r * 0.5, r * 0.7);
    ctx.lineTo(0, r * 0.4);
    ctx.lineTo(r * 0.5, r * 0.7);
    ctx.lineTo(r * 0.9, -r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Filamentos eléctricos
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 1.0);
    ctx.lineTo(r * 0.1, -r * 0.6);
    ctx.lineTo(-r * 0.1, 0);
    ctx.stroke();
  } else {
    // Dragón de Obsidiana
    ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#1c1917';
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.5);
    ctx.lineTo(-r * 1.2, -r * 0.6);
    ctx.lineTo(-r * 0.6, r * 0.6);
    ctx.lineTo(r * 0.6, r * 0.6);
    ctx.lineTo(r * 1.2, -r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ojos y fauces de fuego
    ctx.fillStyle = '#ff3d00';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.9, r * 0.1, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.9, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
