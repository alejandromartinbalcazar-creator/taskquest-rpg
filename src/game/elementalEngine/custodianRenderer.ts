import { GameEnemy } from './types';

/**
 * Renderizado Procedural en Canvas 2D de "El Custodio del Umbral" (Threshold Custodian).
 * Cero sprites externos: torso colosal de roca rúnica, metal oxidado, engranajes visibles,
 * orbe central reactivo a fases, guanteletes flotantes desacoplados y telegrafiados tácticos.
 */

export function drawThresholdCustodian(
  ctx: CanvasRenderingContext2D,
  boss: GameEnemy,
  now: number
) {
  const cs = boss.custodianState;
  const r = boss.radius;
  const phase = cs?.currentPhase || 1;
  const isVulnerable = cs?.isShieldBroken || false;
  const isDefeated = cs?.isDefeated || false;

  ctx.save();
  ctx.translate(boss.x, boss.y);

  // 1. SECUENCIA DE DERROTA: COLAPSO EN ESCOMBROS
  if (isDefeated) {
    drawDefeatedRubble(ctx, boss, now);
    ctx.restore();
    return;
  }

  // 2. RUNA DE LEVITACIÓN Y SOMBRA ISOMÉTRICA EN EL SUELO
  ctx.save();
  ctx.scale(1, 0.58); // Proyección isométrica

  // Sombra elíptica
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, r * 1.2, r * 1.55, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Runa concéntrica giratoria
  const runeAngle = (now * 0.001) % (Math.PI * 2);
  let runeStroke = '#ea580c';
  if (phase === 2) runeStroke = '#0284c7';
  if (phase === 3) runeStroke = '#7c3aed';

  ctx.strokeStyle = runeStroke;
  ctx.lineWidth = 2.0;
  ctx.shadowColor = runeStroke;
  ctx.shadowBlur = 10;

  // Círculo exterior con marcas rúnicas
  ctx.beginPath();
  ctx.arc(0, r * 1.15, r * 1.35, 0, Math.PI * 2);
  ctx.stroke();

  // Rayos rúnicos giratorios
  for (let i = 0; i < 8; i++) {
    const a = runeAngle + (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r * 1.05), r * 1.15 + Math.sin(a) * (r * 1.05));
    ctx.lineTo(Math.cos(a) * (r * 1.35), r * 1.15 + Math.sin(a) * (r * 1.35));
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  // 3. FLOTACIÓN SENOIDAL DEL TORSO
  const floatY = Math.sin(now * 0.004) * 8;
  ctx.translate(0, floatY);

  // 4. AURA ELEMENTAL DEL ESCUDO (Si no está quebrada)
  if (!isVulnerable) {
    drawElementalShieldAura(ctx, r, phase, now);
  }

  // 5. ENGRANAJES MECÁNICOS VISIBLES EN EL CUELLO Y COSTADOS
  drawMechanicalGears(ctx, r, now);

  // 6. TORSO Y CORAZA DE ROCA ANCESTRAL Y METAL OXIDADO
  drawArmoredTorso(ctx, boss, r, phase, isVulnerable, now);

  // 7. NÚCLEO ELEMENTAL CENTRAL PALPITANTE
  drawCentralCore(ctx, r, phase, isVulnerable, now);

  ctx.restore();

  // 8. GUANTELETES FLOTANTES MONUMENTALES (Dibujados en sus coordenadas independientes)
  if (cs) {
    drawFloatingGauntlet(ctx, cs.leftGauntlet, phase, isVulnerable, boss.hitFlash, now, -1);
    drawFloatingGauntlet(ctx, cs.rightGauntlet, phase, isVulnerable, boss.hitFlash, now, 1);
  }
}

/**
 * Dibuja el aura protectora elemental del coloso.
 */
function drawElementalShieldAura(
  ctx: CanvasRenderingContext2D,
  r: number,
  phase: 1 | 2 | 3,
  now: number
) {
  ctx.save();
  const pulse = 0.85 + 0.15 * Math.sin(now * 0.006);

  if (phase === 1) {
    // Escudo de Magma: brasas y calor distorsionado
    const grad = ctx.createRadialGradient(0, -r * 0.7, r * 0.5, 0, -r * 0.7, r * 1.8 * pulse);
    grad.addColorStop(0, 'rgba(234, 88, 12, 0.35)');
    grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -r * 0.7, r * 1.8 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Brasas flotantes
    for (let i = 0; i < 4; i++) {
      const spkAng = (now * 0.003 + (i * Math.PI) / 2) % (Math.PI * 2);
      const spkDist = r * 1.25 + Math.sin(now * 0.008 + i) * 12;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(Math.cos(spkAng) * spkDist, -r * 0.7 + Math.sin(spkAng) * spkDist * 0.6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (phase === 2) {
    // Coraza Glacial: halo ártico y cristales afilados
    const grad = ctx.createRadialGradient(0, -r * 0.7, r * 0.5, 0, -r * 0.7, r * 1.7 * pulse);
    grad.addColorStop(0, 'rgba(2, 132, 199, 0.4)');
    grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -r * 0.7, r * 1.7 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Fragmentos de hielo flotantes
    for (let i = 0; i < 4; i++) {
      const cAng = (now * -0.0025 + (i * Math.PI) / 2) % (Math.PI * 2);
      const cx = Math.cos(cAng) * (r * 1.3);
      const cy = -r * 0.7 + Math.sin(cAng) * (r * 0.8);
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx + 4, cy);
      ctx.lineTo(cx, cy + 6);
      ctx.lineTo(cx - 4, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // Sobrecarga de Vacío: arcos eléctricos púrpuras
    const grad = ctx.createRadialGradient(0, -r * 0.7, r * 0.5, 0, -r * 0.7, r * 1.8 * pulse);
    grad.addColorStop(0, 'rgba(124, 58, 237, 0.45)');
    grad.addColorStop(0.7, 'rgba(192, 132, 252, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -r * 0.7, r * 1.8 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Descargas eléctricas instantáneas
    ctx.strokeStyle = '#f3e8ff';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      const arcAng = now * 0.005 + i * 2.1;
      const ax = Math.cos(arcAng) * (r * 1.15);
      const ay = -r * 0.7 + Math.sin(arcAng) * (r * 0.85);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + (Math.random() - 0.5) * 16, ay + (Math.random() - 0.5) * 16);
      ctx.lineTo(ax * 1.15, ay * 1.15);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Dibuja los engranajes mecánicos en las cavidades del coloso.
 */
function drawMechanicalGears(ctx: CanvasRenderingContext2D, r: number, now: number) {
  ctx.save();
  const gearAng1 = (now * 0.002) % (Math.PI * 2);
  const gearAng2 = -gearAng1 * 1.4;

  // Engranaje clavícula izquierda
  drawCog(ctx, -r * 0.55, -r * 1.15, 14, 8, gearAng1, '#78350f', '#d97706');
  // Engranaje clavícula derecha
  drawCog(ctx, r * 0.55, -r * 1.15, 14, 8, gearAng2, '#78350f', '#d97706');
  // Engranaje central inferior
  drawCog(ctx, 0, -r * 0.15, 18, 10, gearAng1 * 0.8, '#451a03', '#b45309');
  ctx.restore();
}

function drawCog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  teeth: number,
  angle: number,
  fillColor: string,
  strokeColor: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = (i * Math.PI * 2) / teeth;
    const aNext = ((i + 0.5) * Math.PI * 2) / teeth;
    const aStep = ((i + 1) * Math.PI * 2) / teeth;

    ctx.lineTo(Math.cos(a) * (radius * 0.78), Math.sin(a) * (radius * 0.78));
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    ctx.lineTo(Math.cos(aNext) * radius, Math.sin(aNext) * radius);
    ctx.lineTo(Math.cos(aNext) * (radius * 0.78), Math.sin(aNext) * (radius * 0.78));
    ctx.lineTo(Math.cos(aStep) * (radius * 0.78), Math.sin(aStep) * (radius * 0.78));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Eje central
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Dibuja el torso colosal de roca rúnica biselada y placas metálicas.
 */
function drawArmoredTorso(
  ctx: CanvasRenderingContext2D,
  boss: GameEnemy,
  r: number,
  phase: 1 | 2 | 3,
  isVulnerable: boolean,
  now: number
) {
  ctx.save();

  // Color de roca base con destello de golpe
  const baseRock = boss.hitFlash > 0 ? '#ffffff' : '#27272a';
  const rimColor = boss.hitFlash > 0 ? '#ffffff' : '#52525b';
  const brassTrim = '#b45309';

  ctx.fillStyle = baseRock;
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 2.5;

  // 1. Placa de Hombros y Cuello Monumental
  ctx.beginPath();
  ctx.moveTo(-r * 1.25, -r * 1.1); // Hombro izq
  ctx.lineTo(-r * 0.85, -r * 1.7); // Borde superior izq
  ctx.lineTo(-r * 0.35, -r * 1.9); // Cuello izq
  ctx.lineTo(0, -r * 2.05);        // Cima yelmo/corona
  ctx.lineTo(r * 0.35, -r * 1.9);  // Cuello der
  ctx.lineTo(r * 0.85, -r * 1.7);  // Borde superior der
  ctx.lineTo(r * 1.25, -r * 1.1);  // Hombro der
  ctx.lineTo(r * 0.95, -r * 0.5);  // Clavícula baja der
  ctx.lineTo(r * 0.65, -r * 0.3);  // Costillar der
  ctx.lineTo(r * 0.45, 0.1 * r);   // Cintura der
  ctx.lineTo(0, 0.45 * r);         // Quilla inferior (sin piernas)
  ctx.lineTo(-r * 0.45, 0.1 * r);  // Cintura izq
  ctx.lineTo(-r * 0.65, -r * 0.3); // Costillar izq
  ctx.lineTo(-r * 0.95, -r * 0.5); // Clavícula baja izq
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Hombreras de piedra biselada
  ctx.fillStyle = '#3f3f46';
  ctx.strokeStyle = brassTrim;
  ctx.lineWidth = 2.0;

  // Hombrera Izquierda
  ctx.beginPath();
  ctx.moveTo(-r * 1.35, -r * 1.15);
  ctx.lineTo(-r * 1.1, -r * 1.6);
  ctx.lineTo(-r * 0.6, -r * 1.45);
  ctx.lineTo(-r * 0.85, -r * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hombrera Derecha
  ctx.beginPath();
  ctx.moveTo(r * 1.35, -r * 1.15);
  ctx.lineTo(r * 1.1, -r * 1.6);
  ctx.lineTo(r * 0.6, -r * 1.45);
  ctx.lineTo(r * 0.85, -r * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Corona / Visera con Ojos Rúnicos
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = rimColor;
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, -r * 1.75);
  ctx.lineTo(0, -r * 1.95);
  ctx.lineTo(r * 0.35, -r * 1.75);
  ctx.lineTo(r * 0.25, -r * 1.5);
  ctx.lineTo(-r * 0.25, -r * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ojos rúnicos brillantes
  let eyeColor = '#ea580c';
  if (phase === 2) eyeColor = '#00f0ff';
  if (phase === 3) eyeColor = '#c084fc';
  if (isVulnerable) eyeColor = '#64748b';

  ctx.fillStyle = eyeColor;
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.ellipse(-r * 0.12, -r * 1.62, 3.5, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.12, -r * 1.62, 3.5, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 4. Grietas de armadura fracturada en FASE 3 (Sobrecarga de Vacío)
  if (phase === 3) {
    const crackPulse = 0.75 + 0.25 * Math.sin(now * 0.008);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.2 * crackPulse;
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 6 * crackPulse;
    ctx.beginPath();
    // Grieta hombro izq
    ctx.moveTo(-r * 0.8, -r * 1.4);
    ctx.lineTo(-r * 0.5, -r * 1.1);
    ctx.lineTo(-r * 0.3, -r * 0.85);
    // Grieta costado der
    ctx.moveTo(r * 0.75, -r * 1.0);
    ctx.lineTo(r * 0.45, -r * 0.75);
    ctx.lineTo(r * 0.3, -r * 0.45);
    // Grieta inferior
    ctx.moveTo(-r * 0.2, -r * 0.35);
    ctx.lineTo(0, 0.15 * r);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/**
 * Dibuja el orbe central incrustado en el pecho del Custodio.
 */
function drawCentralCore(
  ctx: CanvasRenderingContext2D,
  r: number,
  phase: 1 | 2 | 3,
  isVulnerable: boolean,
  now: number
) {
  ctx.save();
  const coreY = -r * 0.85;
  const coreR = r * 0.38;

  // Cavidad metálica biselada
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.arc(0, coreY, coreR * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Si está vulnerable / noqueado: núcleo apagado con humo
  if (isVulnerable) {
    const pulseWarn = 0.5 + 0.5 * Math.sin(now * 0.015);
    ctx.fillStyle = `rgba(234, 179, 8, ${0.4 * pulseWarn})`;
    ctx.beginPath();
    ctx.arc(0, coreY, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Gradiente radial del núcleo según la fase activa
  const coreGrad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, coreR);

  if (phase === 1) {
    // Fase 1: Magma incandescente
    coreGrad.addColorStop(0, '#fff7ed');
    coreGrad.addColorStop(0.35, '#f97316');
    coreGrad.addColorStop(0.85, '#ea580c');
    coreGrad.addColorStop(1, '#9a3412');
    ctx.shadowColor = '#ea580c';
  } else if (phase === 2) {
    // Fase 2: Glaciar ártico
    coreGrad.addColorStop(0, '#f0f9ff');
    coreGrad.addColorStop(0.35, '#38bdf8');
    coreGrad.addColorStop(0.85, '#0284c7');
    coreGrad.addColorStop(1, '#0369a1');
    ctx.shadowColor = '#38bdf8';
  } else {
    // Fase 3: Vacío inestable
    coreGrad.addColorStop(0, '#faf5ff');
    coreGrad.addColorStop(0.35, '#c084fc');
    coreGrad.addColorStop(0.85, '#7c3aed');
    coreGrad.addColorStop(1, '#581c87');
    ctx.shadowColor = '#c084fc';
  }

  ctx.shadowBlur = 14;
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, coreY, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Borde rúnico del orbe
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, coreY, coreR * 0.65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();
}

/**
 * Dibuja un guantelete monumental flotante e independiente.
 */
function drawFloatingGauntlet(
  ctx: CanvasRenderingContext2D,
  g: { x: number; y: number; angle: number; slamProgress: number },
  phase: 1 | 2 | 3,
  isVulnerable: boolean,
  hitFlash: number,
  now: number,
  _side: -1 | 1
) {
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.angle);

  const gw = 28;
  const gh = 38;

  // Sombra proyectada del guantelete en el suelo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 48, gw * 1.1, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Base del guantelete
  ctx.fillStyle = hitFlash > 0 ? '#ffffff' : '#3f3f46';
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 2.0;

  // Bloque principal del antebrazo
  ctx.beginPath();
  ctx.roundRect(-gw / 2, -gh / 2, gw, gh, [6, 6, 4, 4]);
  ctx.fill();
  ctx.stroke();

  // Brazalete de bronce/oro
  ctx.fillStyle = '#b45309';
  ctx.fillRect(-gw / 2, -gh / 2, gw, 8);

  // Nudillos tallados en piedra rúnica
  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = '#52525b';
  ctx.lineWidth = 1.5;

  const knuckleY = gh / 2 - 6;
  for (let k = 0; k < 3; k++) {
    const kx = -gw / 2 + 5 + k * 9;
    ctx.beginPath();
    ctx.roundRect(kx, knuckleY, 8, 12, 3);
    ctx.fill();
    ctx.stroke();
  }

  // Gemas rúnicas en el dorso de la mano que brillan según la fase
  let gemColor = '#ea580c';
  if (phase === 2) gemColor = '#38bdf8';
  if (phase === 3) gemColor = '#c084fc';
  if (isVulnerable) gemColor = '#64748b';

  const gemPulse = 0.8 + 0.2 * Math.sin(now * 0.007);
  ctx.fillStyle = gemColor;
  ctx.shadowColor = gemColor;
  ctx.shadowBlur = 8 * gemPulse;
  ctx.beginPath();
  ctx.arc(0, -2, 5 * gemPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

/**
 * Animación de colapso en escombros tras la derrota.
 */
function drawDefeatedRubble(ctx: CanvasRenderingContext2D, boss: GameEnemy, now: number) {
  ctx.save();
  const cs = boss.custodianState;
  const dt = cs ? Math.min(60, cs.defeatTimer) : 30;
  const collapseProg = dt / 60; // 0..1

  // Sombra en dispersión
  ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * (1 - collapseProg * 0.5)})`;
  ctx.beginPath();
  ctx.ellipse(0, 30, boss.radius * 1.6, boss.radius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fragmentos de roca derrumbados en el suelo
  const rockOffsets = [
    { x: -35, y: 15, w: 28, h: 22, rot: 0.3 },
    { x: 30, y: 20, w: 32, h: 24, rot: -0.4 },
    { x: -10, y: 35, w: 40, h: 26, rot: 0.1 },
    { x: -50, y: 30, w: 20, h: 18, rot: 0.6 },
    { x: 45, y: 28, w: 24, h: 20, rot: -0.5 },
  ];

  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = '#52525b';
  ctx.lineWidth = 2.0;

  rockOffsets.forEach((rock) => {
    ctx.save();
    ctx.translate(rock.x * collapseProg, rock.y * collapseProg);
    ctx.rotate(rock.rot);
    ctx.beginPath();
    ctx.rect(-rock.w / 2, -rock.h / 2, rock.w, rock.h);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Núcleo apagado en el centro entre escombros
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#3f3f46';
  ctx.beginPath();
  ctx.arc(0, 20, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Humo disipándose
  ctx.fillStyle = 'rgba(100, 116, 139, 0.25)';
  ctx.beginPath();
  ctx.arc(Math.sin(now * 0.002) * 10, -collapseProg * 25, 25 + collapseProg * 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Renderizado de todos los telegrafiados del Custodio (Fisura, Estalagmitas, Nova y Juicio).
 * Se dibujan sobre la capa de suelo antes de las entidades.
 */
export function drawCustodianTelegraphs(
  ctx: CanvasRenderingContext2D,
  boss: GameEnemy,
  now: number
) {
  const cs = boss.custodianState;
  if (!cs) return;

  // 1. FISURA DE MAGMA TELEGRAFIADA (800ms)
  if (cs.fissureTelegraph) {
    const ft = cs.fissureTelegraph;
    const prog = Math.min(1.0, ft.timer / ft.maxTimer);

    ctx.save();
    // Banda telegrafiada en perspectiva
    const dx = ft.x2 - ft.x1;
    const dy = ft.y2 - ft.y1;
    const angle = Math.atan2(dy, dx);
    const len = Math.hypot(dx, dy);

    ctx.translate(ft.x1, ft.y1);
    ctx.rotate(angle);

    // Fondo brillante que parpadea
    const flash = 0.25 + 0.25 * Math.sin(now * 0.02);
    ctx.fillStyle = ft.hasErupted ? 'rgba(239, 68, 68, 0.75)' : `rgba(234, 88, 12, ${flash + prog * 0.35})`;
    ctx.fillRect(0, -ft.width / 2, len, ft.width);

    // Borde de peligro
    ctx.strokeStyle = ft.hasErupted ? '#ffffff' : '#ea580c';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(0, -ft.width / 2, len, ft.width);

    // Si ha brotado la columna de lava: llamaradas verticales
    if (ft.hasErupted) {
      for (let s = 0; s < 12; s++) {
        const lx = (s + 0.5) * (len / 12);
        const flameH = 45 + Math.sin(now * 0.02 + s) * 20;
        ctx.fillStyle = s % 2 === 0 ? '#ffedd5' : '#f97316';
        ctx.beginPath();
        ctx.moveTo(lx - 12, -ft.width / 4);
        ctx.lineTo(lx, -flameH);
        ctx.lineTo(lx + 12, -ft.width / 4);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 2. LLUVIA DE ESTALAGMITAS (4 CÍRCULOS AZULES - 700ms)
  if (cs.stalagmitesTelegraph) {
    cs.stalagmitesTelegraph.forEach((st) => {
      const prog = Math.min(1.0, st.timer / st.maxTimer);
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.scale(1, 0.58);

      // Círculo base de advertencia
      ctx.fillStyle = `rgba(2, 132, 199, ${0.15 + prog * 0.3})`;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, st.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Indicador radial de cuenta atrás
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, st.radius * (1 - prog), 0, Math.PI * 2);
      ctx.fill();

      // Si ha detonado: aguja de hielo clavada en el suelo
      if (st.detonated) {
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(0, -60);
        ctx.lineTo(10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // 3. NOVA GÉLIDA (900ms)
  if (cs.novaTelegraph) {
    const nt = cs.novaTelegraph;
    const prog = Math.min(1.0, nt.timer / nt.maxTimer);

    ctx.save();
    ctx.translate(nt.x, nt.y);
    ctx.scale(1, 0.58);

    // Área máxima delimitada
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, nt.maxRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Onda expansiva en crecimiento
    ctx.fillStyle = `rgba(6, 182, 212, ${0.15 + prog * 0.35})`;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, 0, nt.currentRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 4. EL JUICIO DEL GUARDIÁN (ULTIMATE - 2.5s)
  if (cs.judgmentTelegraph) {
    const jt = cs.judgmentTelegraph;
    const prog = Math.min(1.0, jt.timer / jt.maxTimer);

    ctx.save();
    // Cuadrícula roja de peligro en toda la arena
    const pulseDanger = 0.15 + 0.15 * Math.sin(now * 0.015);
    ctx.fillStyle = `rgba(239, 68, 68, ${pulseDanger + prog * 0.15})`;
    ctx.beginPath();
    ctx.arc(jt.bossX, jt.bossY, jt.dangerRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2 Zonas Seguras Rúnicas Resplandecientes
    jt.safeZones.forEach((zone) => {
      ctx.save();
      ctx.translate(zone.x, zone.y);
      ctx.scale(1, 0.58);

      // Fondo dorado/azul protector
      ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3.0;
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(0, 0, zone.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Círculo rúnico interior giratorio
      const zRot = (now * 0.003) % (Math.PI * 2);
      ctx.save();
      ctx.rotate(zRot);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, zone.radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Texto de auxilio táctico en la zona segura
      ctx.scale(1, 1 / 0.58);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡️ ZONA SEGURA', 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    ctx.restore();
  }
}

/**
 * Renderizado de la barra de salud dedicada superior del Custodio del Umbral.
 */
export function drawCustodianHUD(
  ctx: CanvasRenderingContext2D,
  width: number,
  boss: GameEnemy
) {
  const cs = boss.custodianState;
  const phase = cs?.currentPhase || 1;
  const isVulnerable = cs?.isShieldBroken || false;
  const now = performance.now();

  const barW = Math.min(width * 0.72, 460);
  const barH = 16;
  const barX = width / 2 - barW / 2;
  const barY = 36;

  const hpPct = Math.max(0, boss.hp / boss.maxHp);

  ctx.save();

  // 1. Marco y fondo oscuro
  ctx.fillStyle = '#090a12';
  ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);

  // Borde interactivo (parpadea en amarillo si está vulnerable)
  if (isVulnerable) {
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.015);
    ctx.strokeStyle = `rgba(250, 204, 21, ${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;
  } else {
    let phaseBorder = '#ea580c';
    if (phase === 2) phaseBorder = '#0284c7';
    if (phase === 3) phaseBorder = '#7c3aed';
    ctx.strokeStyle = phaseBorder;
    ctx.lineWidth = 2.0;
    ctx.shadowBlur = 0;
  }
  ctx.strokeRect(barX - 4, barY - 4, barW + 8, barH + 8);
  ctx.shadowBlur = 0;

  // 2. Relleno de vida con gradiente temático de fase
  const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  if (isVulnerable) {
    hpGrad.addColorStop(0, '#facc15');
    hpGrad.addColorStop(1, '#fef08a');
  } else if (phase === 1) {
    hpGrad.addColorStop(0, '#ef4444');
    hpGrad.addColorStop(1, '#f97316');
  } else if (phase === 2) {
    hpGrad.addColorStop(0, '#0284c7');
    hpGrad.addColorStop(1, '#38bdf8');
  } else {
    hpGrad.addColorStop(0, '#7c3aed');
    hpGrad.addColorStop(1, '#c084fc');
  }
  ctx.fillStyle = hpGrad;
  ctx.fillRect(barX, barY, barW * hpPct, barH);

  // 3. Título del Jefe
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 6;
  ctx.textAlign = 'center';
  ctx.fillText('👑 CUSTODIO DEL UMBRAL — GUARDIÁN PRIMORDIAL', width / 2, barY - 10);
  ctx.shadowBlur = 0;

  // 4. Subtítulo con estado del escudo y contra-elemento requerido
  let statusText = '';
  let statusColor = '#ffffff';

  if (isVulnerable) {
    statusText = '💥 ¡ESCUDO QUEBRADO! ¡VULNERABLE A DAÑO CRÍTICO x2.0!';
    statusColor = '#facc15';
  } else if (phase === 1) {
    statusText = `🛡️ Escudo de Magma Activo (${Math.round(cs?.shieldHp || 0)}/${cs?.maxShieldHp || 90}) — Contrarresta con: ❄️ Hielo`;
    statusColor = '#38bdf8';
  } else if (phase === 2) {
    statusText = `🛡️ Coraza Glacial Activa (${Math.round(cs?.shieldHp || 0)}/${cs?.maxShieldHp || 100}) — Contrarresta con: 🔥 Fuego`;
    statusColor = '#fb923c';
  } else {
    statusText = '⚡ Sobrecarga de Vacío (Furia) — ¡Ataca con 🌍 Tierra para Romper Postura!';
    statusColor = '#e879f9';
  }

  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = statusColor;
  ctx.fillText(statusText, width / 2, barY + barH + 14);

  ctx.restore();
}
