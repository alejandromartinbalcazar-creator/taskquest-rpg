import { GameEnemy } from './types';

/**
 * Renderizado Procedural en Canvas 2D en Pixel Art de 16 Bits de "El Custodio del Umbral" (Threshold Custodian).
 * Escala monumental (grilla virtual de 48x48 píxeles escalada), bloques de piedra rúnica,
 * metal oxidado, engranajes en píxeles, orbe central en rombo pixelado, guanteletes flotantes
 * de piedra y telegrafiados tácticos sin suavizado.
 */

export function drawThresholdCustodian(
  ctx: CanvasRenderingContext2D,
  boss: GameEnemy,
  now: number
) {
  const cs = boss.custodianState;
  const r = boss.visualRadius ?? boss.radius;
  const P = Math.max(1, Math.round(r / 16));
  const phase = cs?.currentPhase || 1;
  const isVulnerable = cs?.isShieldBroken || false;
  const isDefeated = cs?.isDefeated || false;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(boss.x), Math.round(boss.y));

  // 1. SECUENCIA DE DERROTA: COLAPSO EN ESCOMBROS
  if (isDefeated) {
    ctx.scale(2, 2);
    drawDefeatedRubble(ctx, boss, now);
    ctx.restore();
    return;
  }

  // The bottom of the torso, shadow and navigation footprint meet at boss.y.
  ctx.translate(0, -17 * P);

  // 2. RUNA DE LEVITACIÓN Y SOMBRA ISOMÉTRICA EN EL SUELO (PIXEL ART)
  ctx.save();
  // Sombra pixelada en 3 bandas de píxeles
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(-18 * P, 14 * P, 36 * P, 2 * P);
  ctx.fillRect(-22 * P, 16 * P, 44 * P, 4 * P);
  ctx.fillRect(-18 * P, 20 * P, 36 * P, 2 * P);

  // Runa concéntrica giratoria en bloques pixelados
  const runeAngle = Math.floor(now * 0.002 * 8) / 8;
  let runeStroke = '#ea580c';
  if (phase === 2) runeStroke = '#0284c7';
  if (phase === 3) runeStroke = '#7c3aed';

  ctx.fillStyle = runeStroke;
  // Anillo exterior de 8 bloques pixelados
  for (let i = 0; i < 8; i++) {
    const a = runeAngle + (i * Math.PI) / 4;
    const rx = Math.round(Math.cos(a) * (18 * P));
    const ry = Math.round(18 * P + Math.sin(a) * (9 * P));
    ctx.fillRect(rx - 2 * P, ry - 1 * P, 4 * P, 2 * P);
  }
  ctx.restore();

  // 3. FLOTACIÓN EN SALTOS RÍGIDOS DISCRETOS (Sin seno continuo suave)
  const floatStep = Math.floor(now * 0.003) % 4;
  const floatY = (floatStep === 1 ? -1 : floatStep === 3 ? 1 : 0) * P;
  ctx.translate(0, floatY);

  // 4. AURA ELEMENTAL DEL ESCUDO (Si no está quebrada)
  if (!isVulnerable) {
    drawElementalShieldAura(ctx, r, P, phase, now);
  }

  // 5. ENGRANAJES MECÁNICOS PIXELADOS EN EL CUELLO Y COSTADOS
  drawMechanicalGears(ctx, P, now);

  // 6. TORSO Y CORAZA DE ROCA ANCESTRAL Y METAL OXIDADO (48x48)
  drawArmoredTorso(ctx, boss, r, P, phase, isVulnerable, now);

  // 7. NÚCLEO ELEMENTAL CENTRAL PALPITANTE
  drawCentralCore(ctx, P, phase, isVulnerable, now);

  // 7.5 EFECTO PROCEDURAL DE ESCARCHA Y CONGELAMIENTO (Shader adaptado a la coraza de piedra)
  const isChilledOrFrozen = boss.statuses.some((s) => s.type === 'frozen' || s.type === 'slowed') || isVulnerable;
  if (isChilledOrFrozen) {
    drawCustodianFrostShader(ctx, boss, P, now);
  }

  ctx.restore();

  // 8. GUANTELETES FLOTANTES MONUMENTALES (Dibujados en sus coordenadas independientes)
  if (cs) {
    drawFloatingGauntlet(ctx, cs.leftGauntlet, phase, isVulnerable, boss.hitFlash, now, -1);
    drawFloatingGauntlet(ctx, cs.rightGauntlet, phase, isVulnerable, boss.hitFlash, now, 1);
  }
}

/**
 * Dibuja el aura protectora elemental del coloso en bloques pixelados.
 */
function drawElementalShieldAura(
  ctx: CanvasRenderingContext2D,
  _r: number,
  P: number,
  phase: 1 | 2 | 3,
  now: number
) {
  ctx.save();
  const auraStep = Math.floor(now * 0.006) % 3;

  if (phase === 1) {
    // Escudo de Magma: brasas cuadradas de 2x2
    ctx.fillStyle = auraStep === 0 ? '#f97316' : '#fde047';
    ctx.fillRect(-22 * P, -12 * P, 3 * P, 3 * P);
    ctx.fillRect(20 * P, -10 * P, 3 * P, 3 * P);
    ctx.fillRect(-18 * P, 4 * P, 2 * P, 2 * P);
    ctx.fillRect(16 * P, 6 * P, 2 * P, 2 * P);
  } else if (phase === 2) {
    // Coraza Glacial: diamantes de hielo en píxeles
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-23 * P, -14 * P, 4 * P, 4 * P);
    ctx.fillRect(20 * P, -12 * P, 4 * P, 4 * P);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(-22 * P, -13 * P, 2 * P, 2 * P);
    ctx.fillRect(21 * P, -11 * P, 2 * P, 2 * P);
  } else {
    // Sobrecarga de Vacío: chispas púrpuras
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(-24 * P, -8 * P, 3 * P, 3 * P);
    ctx.fillRect(22 * P, -6 * P, 3 * P, 3 * P);
    ctx.fillRect(0, -28 * P, 3 * P, 3 * P);
  }
  ctx.restore();
}

/**
 * Dibuja los engranajes mecánicos en bloques pixelados.
 */
function drawMechanicalGears(ctx: CanvasRenderingContext2D, P: number, now: number) {
  ctx.save();
  const gearStep = Math.floor(now * 0.004) % 4;

  const drawPixelGear = (gx: number, gy: number) => {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(gx - 3 * P, gy - 3 * P, 6 * P, 6 * P);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(gx - 2 * P, gy - 2 * P, 4 * P, 4 * P);
    // Dientes angulares
    if (gearStep % 2 === 0) {
      ctx.fillRect(gx - 4 * P, gy - 1 * P, 8 * P, 2 * P);
      ctx.fillRect(gx - 1 * P, gy - 4 * P, 2 * P, 8 * P);
    } else {
      ctx.fillRect(gx - 3 * P, gy - 3 * P, 2 * P, 2 * P);
      ctx.fillRect(gx + 1 * P, gy - 3 * P, 2 * P, 2 * P);
      ctx.fillRect(gx - 3 * P, gy + 1 * P, 2 * P, 2 * P);
      ctx.fillRect(gx + 1 * P, gy + 1 * P, 2 * P, 2 * P);
    }
  };

  drawPixelGear(-9 * P, -16 * P);
  drawPixelGear(9 * P, -16 * P);
  ctx.restore();
}

/**
 * Dibuja el torso colosal de roca rúnica biselada y placas metálicas en Pixel Art 16-Bit.
 */
function drawArmoredTorso(
  ctx: CanvasRenderingContext2D,
  boss: GameEnemy,
  _r: number,
  P: number,
  phase: 1 | 2 | 3,
  isVulnerable: boolean,
  now: number
) {
  ctx.save();

  // Color de roca base con destello de golpe
  const OUTLINE = '#0f172a';
  const BASE_ROCK = boss.hitFlash > 0 ? '#ffffff' : '#27272a';
  const LIGHT_ROCK = boss.hitFlash > 0 ? '#ffffff' : '#3f3f46';
  const HIGHLIGHT_ROCK = boss.hitFlash > 0 ? '#ffffff' : '#52525b';
  const BRASS_TRIM = '#b45309';
  const BRASS_LIGHT = '#d97706';

  // 1. Contorno Monumental Exterior (Bloques escalonados de 48x48 píxeles)
  ctx.fillStyle = OUTLINE;
  // Hombros y corona
  ctx.fillRect(-20 * P, -20 * P, 40 * P, 6 * P);
  ctx.fillRect(-22 * P, -17 * P, 44 * P, 10 * P);
  // Pecho y costillas
  ctx.fillRect(-17 * P, -7 * P, 34 * P, 14 * P);
  // Quilla inferior (estrechamiento hacia abajo)
  ctx.fillRect(-12 * P, 7 * P, 24 * P, 6 * P);
  ctx.fillRect(-7 * P, 13 * P, 14 * P, 4 * P);

  // 2. Relleno de roca ancestral
  ctx.fillStyle = BASE_ROCK;
  ctx.fillRect(-19 * P, -19 * P, 38 * P, 5 * P);
  ctx.fillRect(-21 * P, -16 * P, 42 * P, 8 * P);
  ctx.fillRect(-16 * P, -6 * P, 32 * P, 12 * P);
  ctx.fillRect(-11 * P, 6 * P, 22 * P, 6 * P);
  ctx.fillRect(-6 * P, 12 * P, 12 * P, 4 * P);

  // 3. Biseles de luz superior (efecto de volumen 16-bit)
  ctx.fillStyle = HIGHLIGHT_ROCK;
  ctx.fillRect(-19 * P, -19 * P, 38 * P, 1 * P);
  ctx.fillRect(-21 * P, -16 * P, 42 * P, 1 * P);
  ctx.fillRect(-16 * P, -6 * P, 32 * P, 1 * P);

  // 4. Hombreras de piedra biselada con borde de bronce
  ctx.fillStyle = BRASS_TRIM;
  ctx.fillRect(-22 * P, -16 * P, 6 * P, 7 * P);
  ctx.fillRect(16 * P, -16 * P, 6 * P, 7 * P);

  ctx.fillStyle = BRASS_LIGHT;
  ctx.fillRect(-21 * P, -15 * P, 4 * P, 5 * P);
  ctx.fillRect(17 * P, -15 * P, 4 * P, 5 * P);

  // 5. Glifos rúnicos tallados en bajo relieve pixelado
  ctx.fillStyle = phase === 1 ? '#ea580c' : phase === 2 ? '#38bdf8' : '#c084fc';
  // Glifo hombro izq
  ctx.fillRect(-14 * P, -14 * P, 2 * P, 4 * P);
  ctx.fillRect(-16 * P, -12 * P, 6 * P, 1 * P);
  // Glifo hombro der
  ctx.fillRect(12 * P, -14 * P, 2 * P, 4 * P);
  ctx.fillRect(10 * P, -12 * P, 6 * P, 1 * P);
  // Glifos laterales del torso
  ctx.fillRect(-14 * P, 0, 3 * P, 2 * P);
  ctx.fillRect(11 * P, 0, 3 * P, 2 * P);

  // 6. Corona / Yelmo central con Visera Oscura
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-6 * P, -25 * P, 12 * P, 7 * P);
  ctx.fillStyle = LIGHT_ROCK;
  ctx.fillRect(-5 * P, -24 * P, 10 * P, 5 * P);
  ctx.fillStyle = BRASS_TRIM;
  ctx.fillRect(-2 * P, -26 * P, 4 * P, 3 * P); // Cresta superior

  // Visera oscura
  ctx.fillStyle = '#090a10';
  ctx.fillRect(-4 * P, -22 * P, 8 * P, 3 * P);

  // Ojos rúnicos brillantes de 2 píxeles
  let eyeColor = '#ea580c';
  if (phase === 2) eyeColor = '#00f0ff';
  if (phase === 3) eyeColor = '#c084fc';
  if (isVulnerable) eyeColor = '#64748b';

  ctx.fillStyle = eyeColor;
  ctx.fillRect(-3 * P, -21 * P, 2 * P, 1 * P);
  ctx.fillRect(1 * P, -21 * P, 2 * P, 1 * P);

  // 7. Grietas fracturadas en Fase 3
  if (phase === 3) {
    const crackBlink = Math.floor(now * 0.008) % 2 === 0;
    ctx.fillStyle = crackBlink ? '#c084fc' : '#ffffff';
    ctx.fillRect(-10 * P, -10 * P, 2 * P, 3 * P);
    ctx.fillRect(-8 * P, -7 * P, 2 * P, 2 * P);
    ctx.fillRect(7 * P, -9 * P, 2 * P, 4 * P);
    ctx.fillRect(5 * P, -5 * P, 2 * P, 2 * P);
  }

  ctx.restore();
}

/**
 * Dibuja el orbe central incrustado en el pecho del Custodio en Pixel Art.
 */
function drawCentralCore(
  ctx: CanvasRenderingContext2D,
  P: number,
  phase: 1 | 2 | 3,
  isVulnerable: boolean,
  now: number
) {
  ctx.save();
  const OUTLINE = '#0f172a';
  const coreY = -5 * P;

  // Cavidad metálica biselada (octágono pixelado)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-8 * P, coreY - 6 * P, 16 * P, 12 * P);
  ctx.fillRect(-9 * P, coreY - 4 * P, 18 * P, 8 * P);

  ctx.fillStyle = '#18181b';
  ctx.fillRect(-7 * P, coreY - 5 * P, 14 * P, 10 * P);
  ctx.fillRect(-8 * P, coreY - 3 * P, 16 * P, 6 * P);

  if (isVulnerable) {
    // Núcleo apagado o parpadeante
    const warnBlink = Math.floor(now * 0.01) % 2 === 0;
    ctx.fillStyle = warnBlink ? '#facc15' : '#71717a';
    ctx.fillRect(-4 * P, coreY - 3 * P, 8 * P, 6 * P);
    ctx.restore();
    return;
  }

  // Paleta de la gema elemental central
  let coreDark = '#ea580c';
  let coreMid = '#f97316';
  let coreLight = '#fde047';

  if (phase === 2) {
    coreDark = '#0284c7';
    coreMid = '#38bdf8';
    coreLight = '#e0f2fe';
  } else if (phase === 3) {
    coreDark = '#7c3aed';
    coreMid = '#c084fc';
    coreLight = '#faf5ff';
  }

  // Gema en rombo/octágono de píxeles
  ctx.fillStyle = coreDark;
  ctx.fillRect(-5 * P, coreY - 4 * P, 10 * P, 8 * P);
  ctx.fillRect(-6 * P, coreY - 2 * P, 12 * P, 4 * P);

  ctx.fillStyle = coreMid;
  ctx.fillRect(-3 * P, coreY - 3 * P, 6 * P, 6 * P);

  // Destello en 2 estados discretos
  const pulse = Math.floor(now * 0.005) % 2 === 0;
  if (pulse) {
    ctx.fillStyle = coreLight;
    ctx.fillRect(-1 * P, coreY - 2 * P, 3 * P, 3 * P);
  }

  ctx.restore();
}

/**
 * Renderiza el efecto procedural de escarcha y congelamiento sobre el coloso.
 * Cubre el coloso con fragmentos y picos cuadrados celestes respetando su contorno sin cajas sólidas.
 */
function drawCustodianFrostShader(
  ctx: CanvasRenderingContext2D,
  _boss: GameEnemy,
  P: number,
  _now: number
) {
  ctx.save();

  // Fragmentos y picos cuadrados celestes (#38BDF8, #E0F2FE) siguiendo las aristas de la armadura
  ctx.fillStyle = '#38bdf8';
  // Picos en hombrera izquierda
  ctx.fillRect(-24 * P, -16 * P, 3 * P, 3 * P);
  ctx.fillRect(-22 * P, -18 * P, 2 * P, 2 * P);
  ctx.fillRect(-20 * P, -21 * P, 2 * P, 2 * P);

  // Picos en hombrera derecha
  ctx.fillRect(21 * P, -16 * P, 3 * P, 3 * P);
  ctx.fillRect(20 * P, -18 * P, 2 * P, 2 * P);
  ctx.fillRect(18 * P, -21 * P, 2 * P, 2 * P);

  // Escarcha dispersa sobre placas de roca
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(-15 * P, -15 * P, 2 * P, 2 * P);
  ctx.fillRect(-12 * P, -8 * P, 3 * P, 2 * P);
  ctx.fillRect(10 * P, -14 * P, 2 * P, 2 * P);
  ctx.fillRect(12 * P, -7 * P, 3 * P, 2 * P);
  ctx.fillRect(-4 * P, 2 * P, 3 * P, 2 * P);
  ctx.fillRect(2 * P, 3 * P, 3 * P, 2 * P);
  ctx.fillRect(-2 * P, 8 * P, 4 * P, 2 * P);

  ctx.restore();
}

/**
 * Dibuja un guantelete monumental flotante e independiente en Pixel Art 16-Bit.
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
  ctx.translate(Math.round(g.x), Math.round(g.y));
  ctx.rotate(g.angle);
  ctx.scale(2, 2);

  const OUTLINE = '#0f172a';
  const STONE_DARK = hitFlash > 0 ? '#ffffff' : '#27272a';
  const STONE_MID = hitFlash > 0 ? '#ffffff' : '#3f3f46';
  const BRASS = '#b45309';

  // Sombra del guantelete en el suelo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(-14, 40, 28, 6);
  ctx.fillRect(-10, 46, 20, 4);

  // Antebrazo de piedra (bloque rectangular biselado)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-16, -20, 32, 42);

  ctx.fillStyle = STONE_MID;
  ctx.fillRect(-14, -18, 28, 38);

  // Brazalete de bronce
  ctx.fillStyle = BRASS;
  ctx.fillRect(-14, -18, 28, 8);

  // Nudillos cuadrados de piedra rúnica
  ctx.fillStyle = STONE_DARK;
  for (let k = 0; k < 3; k++) {
    const kx = -13 + k * 9;
    ctx.fillRect(kx, 14, 8, 10);
  }

  // Gema rúnica en el dorso que pulsa en 2 estados
  let gemColor = '#ea580c';
  if (phase === 2) gemColor = '#38bdf8';
  if (phase === 3) gemColor = '#c084fc';
  if (isVulnerable) gemColor = '#64748b';

  const isGemPulsing = Math.floor(now * 0.007) % 2 === 0;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-5, -4, 10, 10);
  ctx.fillStyle = gemColor;
  ctx.fillRect(-3, -2, 6, 6);
  if (isGemPulsing) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, 0, 2, 2);
  }

  ctx.restore();
}

/**
 * Animación de colapso en escombros de piedra tras la derrota en Pixel Art.
 */
function drawDefeatedRubble(ctx: CanvasRenderingContext2D, boss: GameEnemy, _now: number) {
  ctx.save();
  const cs = boss.custodianState;
  const dt = cs ? Math.min(60, cs.defeatTimer) : 30;
  const collapseProg = dt / 60;

  // Sombra
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(-28, 20, 56, 12);

  // Fragmentos de roca derrumbados
  const rockOffsets = [
    { x: -30, y: 12, w: 24, h: 18 },
    { x: 26, y: 16, w: 26, h: 20 },
    { x: -8, y: 24, w: 34, h: 22 },
    { x: -44, y: 22, w: 18, h: 14 },
    { x: 38, y: 22, w: 20, h: 16 },
  ];

  ctx.fillStyle = '#0f172a';
  rockOffsets.forEach((rock) => {
    ctx.fillRect(rock.x * collapseProg - rock.w / 2 - 1, rock.y * collapseProg - rock.h / 2 - 1, rock.w + 2, rock.h + 2);
  });

  ctx.fillStyle = '#27272a';
  rockOffsets.forEach((rock) => {
    ctx.fillRect(rock.x * collapseProg - rock.w / 2, rock.y * collapseProg - rock.h / 2, rock.w, rock.h);
  });

  // Núcleo apagado en el centro
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-8, 12, 16, 16);
  ctx.fillStyle = '#18181b';
  ctx.fillRect(-6, 14, 12, 12);

  ctx.restore();
}

/**
 * Renderizado de todos los telegrafiados del Custodio (Fisura, Estalagmitas, Nova y Juicio).
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
    const dx = ft.x2 - ft.x1;
    const dy = ft.y2 - ft.y1;
    const angle = Math.atan2(dy, dx);
    const len = Math.hypot(dx, dy);

    ctx.translate(ft.x1, ft.y1);
    ctx.rotate(angle);

    const flash = Math.floor(now * 0.02) % 2 === 0;
    ctx.fillStyle = ft.hasErupted ? 'rgba(239, 68, 68, 0.85)' : flash ? 'rgba(234, 88, 12, 0.55)' : 'rgba(234, 88, 12, 0.35)';
    ctx.fillRect(0, -ft.width / 2, len, ft.width);

    ctx.strokeStyle = ft.hasErupted ? '#ffffff' : '#ea580c';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, -ft.width / 2, len, ft.width);

    // Llamaradas verticales de bloques si ha brotado
    if (ft.hasErupted) {
      for (let s = 0; s < 10; s++) {
        const lx = s * (len / 10);
        const flameH = 40 + (s % 3) * 12;
        ctx.fillStyle = s % 2 === 0 ? '#fde047' : '#ea580c';
        ctx.fillRect(lx, -ft.width / 2 - flameH, len / 10 - 2, flameH);
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

      // Bloques de advertencia en octágono
      ctx.fillStyle = `rgba(2, 132, 199, ${0.2 + prog * 0.35})`;
      ctx.fillRect(-st.radius, -st.radius * 0.58, st.radius * 2, st.radius * 1.16);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(-st.radius, -st.radius * 0.58, st.radius * 2, st.radius * 1.16);

      // Si ha detonado: aguja de hielo en bloque angular clavada en el suelo
      if (st.detonated) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-11, -62, 22, 64);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(-9, -60, 18, 60);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-4, -55, 8, 50);
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

    // Área delimitada
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-nt.maxRadius, -nt.maxRadius * 0.58, nt.maxRadius * 2, nt.maxRadius * 1.16);

    // Onda expansiva en crecimiento de píxeles
    ctx.fillStyle = `rgba(6, 182, 212, ${0.15 + prog * 0.35})`;
    ctx.fillRect(-nt.currentRadius, -nt.currentRadius * 0.58, nt.currentRadius * 2, nt.currentRadius * 1.16);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-nt.currentRadius, -nt.currentRadius * 0.58, nt.currentRadius * 2, nt.currentRadius * 1.16);
    ctx.restore();
  }

  // 4. EL JUICIO DEL GUARDIÁN (ULTIMATE - 2.5s)
  if (cs.judgmentTelegraph) {
    const jt = cs.judgmentTelegraph;
    const prog = Math.min(1.0, jt.timer / jt.maxTimer);

    ctx.save();
    const flashDanger = Math.floor(now * 0.015) % 2 === 0;
    ctx.fillStyle = flashDanger ? 'rgba(239, 68, 68, 0.35)' : 'rgba(185, 28, 28, 0.2)';
    ctx.fillRect(jt.bossX - jt.dangerRadius, jt.bossY - jt.dangerRadius * 0.58, jt.dangerRadius * 2, jt.dangerRadius * 1.16);

    // Zonas Seguras Rúnicas
    jt.safeZones.forEach((zone) => {
      ctx.save();
      ctx.translate(zone.x, zone.y);

      // Borde de piedra verde
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-zone.radius - 2, (-zone.radius * 0.58) - 2, (zone.radius * 2) + 4, (zone.radius * 1.16) + 4);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.fillRect(-zone.radius, -zone.radius * 0.58, zone.radius * 2, zone.radius * 1.16);
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.strokeRect(-zone.radius, -zone.radius * 0.58, zone.radius * 2, zone.radius * 1.16);

      // Texto en tipografía bitmap
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ZONA SEGURA', 0, 0);
      ctx.restore();
    });

    ctx.restore();
  }
}

/**
 * Renderizado de la barra de salud dedicada superior del Custodio del Umbral en 16-Bit Pixel Art.
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

  const barW = Math.min(width * 0.45, 340);
  const barH = 10;
  const barX = Math.round(width / 2 - barW / 2);
  const barY = 66;

  const hpPct = Math.max(0, boss.hp / boss.maxHp);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // 1. Marco y fondo oscuro con doble borde de píxeles y sombra de bloque sólido
  ctx.fillStyle = '#000000';
  ctx.fillRect(barX + 3, barY + 3, barW, barH); // Sombra bloque sólido

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

  // Bisel de piedra exterior
  let phaseBorder = '#ea580c';
  if (phase === 2) phaseBorder = '#0284c7';
  if (phase === 3) phaseBorder = '#7c3aed';
  if (isVulnerable) phaseBorder = Math.floor(now * 0.01) % 2 === 0 ? '#facc15' : '#ffffff';

  ctx.fillStyle = phaseBorder;
  ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

  ctx.fillStyle = '#18181b';
  ctx.fillRect(barX, barY, barW, barH);

  // 2. Relleno de vida segmentado
  const fillW = Math.round(barW * hpPct);
  if (fillW > 0) {
    if (isVulnerable) {
      ctx.fillStyle = '#facc15';
    } else if (phase === 1) {
      ctx.fillStyle = '#ea580c';
    } else if (phase === 2) {
      ctx.fillStyle = '#0284c7';
    } else {
      ctx.fillStyle = '#7c3aed';
    }
    ctx.fillRect(barX, barY, fillW, barH);

    // Brillo superior de 2 píxeles
    ctx.fillStyle = isVulnerable ? '#fef08a' : phase === 1 ? '#fbbf24' : phase === 2 ? '#7dd3fc' : '#c084fc';
    ctx.fillRect(barX, barY, fillW, 2);
  }

  // Separadores de fase (3 fases)
  ctx.fillStyle = '#0f172a';
  const third = Math.round(barW / 3);
  ctx.fillRect(barX + third, barY, 2, barH);
  ctx.fillRect(barX + third * 2, barY, 2, barH);

  // 3. Título del Jefe en 'Press Start 2P'
  ctx.font = '9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.fillText('CUSTODIO DEL UMBRAL', Math.round(width / 2) + 1.5, barY - 9);
  ctx.fillStyle = '#fde047';
  ctx.fillText('CUSTODIO DEL UMBRAL', Math.round(width / 2), barY - 10);

  // 4. Subtítulo con estado del escudo y contra-elemento en 'VT323'
  let statusText = '';
  let statusColor = '#ffffff';

  if (isVulnerable) {
    statusText = 'Vulnerable ×2';
    statusColor = '#facc15';
  } else if (phase === 1) {
    statusText = `Escudo ${Math.round(cs?.shieldHp || 0)} · Usa hielo`;
    statusColor = '#38bdf8';
  } else if (phase === 2) {
    statusText = `Coraza ${Math.round(cs?.shieldHp || 0)} · Usa fuego`;
    statusColor = '#fb923c';
  } else {
    statusText = 'Furia · Usa tierra';
    statusColor = '#e879f9';
  }

  ctx.font = '16px "VT323", monospace';
  ctx.fillStyle = '#000000';
  ctx.fillText(statusText, Math.round(width / 2) + 1, barY + barH + 15);
  ctx.fillStyle = statusColor;
  ctx.fillText(statusText, Math.round(width / 2), barY + barH + 14);

  ctx.restore();
}
