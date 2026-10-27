// Renderizador de Sprite de Mago en Pixel Art 16-Bits para Canvas 2D
// Basado en matrices de píxeles, contorno de grafito (#0F172A), animación por pasos discretos y cero curvas suaves.

export interface WizardRenderOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  scale?: number;
  facingAngle?: number; // en radianes
  isMoving?: boolean;
  vx?: number; // velocidad horizontal
  vy?: number;
  castAnimProgress?: number; // 0 a 1 si está lanzando hechizo
  recoilX?: number; // desplazamiento por retroceso de ataque
  recoilY?: number;
  castFlashColor?: string; // tinte o destello elemental al castear
  activeElement?: 'fire' | 'lightning' | 'earth' | 'ice' | 'plasma' | 'magma' | 'wind';
  time?: number; // para ciclos de animación escalonados
}

export function drawWizardSprite({
  ctx,
  x,
  y,
  scale = 1,
  facingAngle = 0,
  isMoving = false,
  vx = 0,
  vy = 0,
  castAnimProgress = 0,
  recoilX = 0,
  recoilY = 0,
  castFlashColor,
  activeElement = 'fire',
  time = Date.now() / 1000,
}: WizardRenderOptions) {
  ctx.save();

  // Asegurar que no haya suavizado de imágenes en este contexto
  ctx.imageSmoothingEnabled = false;
  (ctx as any).webkitImageSmoothingEnabled = false;
  (ctx as any).mozImageSmoothingEnabled = false;
  (ctx as any).msImageSmoothingEnabled = false;

  // Tamaño de píxel virtual (2x escalado por defecto con respecto al zoom del juego)
  const P = Math.max(1, Math.round(2 * scale));

  // Posicionamiento de base entera para evitar subpíxeles borrosos
  const baseX = Math.round(x + recoilX);
  const baseY = Math.round(y + recoilY);
  ctx.translate(baseX, baseY);

  // Orientación horizontal izquierda / derecha (Flip en eje X)
  const isFacingLeft = Math.cos(facingAngle) < -0.15;
  if (isFacingLeft) {
    ctx.scale(-1, 1);
  }

  // 1. SOMBRA PIXELADA EN EL SUELO (Óvalo escalonado con rectángulos de píxeles)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  // Sombra en 3 bandas de píxeles
  ctx.fillRect(-6 * P, 8 * P, 12 * P, 1 * P);
  ctx.fillRect(-7 * P, 9 * P, 14 * P, 2 * P);
  ctx.fillRect(-6 * P, 11 * P, 12 * P, 1 * P);

  // 2. CICLO DE ANIMACIÓN RETRO DISCRETO (Sin interpolación suave)
  let torsoOffY = 0;
  let staffTilt = 0; // Inclinación en píxeles del báculo
  let robeWalkShift = 0;

  if (isMoving) {
    // Al caminar: 3 cuadros rígidos (paso izq, medio arriba, paso der)
    const walkStep = Math.floor(time * 7) % 3;
    if (walkStep === 0) {
      torsoOffY = 0;
      staffTilt = 1;
      robeWalkShift = -1;
    } else if (walkStep === 1) {
      torsoOffY = -1; // Levantamiento de paso
      staffTilt = 0;
      robeWalkShift = 0;
    } else {
      torsoOffY = 0;
      staffTilt = -1;
      robeWalkShift = 1;
    }
  } else {
    // En reposo (Idle): respiración en 2 cuadros (el torso sube/baja 1 píxel cada 600 ms)
    const idleFrame = Math.floor(time / 0.6) % 2;
    torsoOffY = idleFrame === 0 ? 0 : -1;
    staffTilt = 0;
  }

  // Paleta de Color Indexada 16-Bit
  const OUTLINE = '#0f172a';      // Contorno fino negro grafito
  const ROBE_LIGHT = '#7e22ce';   // Púrpura frontal claro
  const ROBE_MID = '#581c87';     // Violeta túnica principal
  const ROBE_DARK = '#3b0764';    // Sombra trasera rígida
  const GOLD_TRIM = '#f59e0b';    // Ribete dorado
  const GOLD_BRIGHT = '#fbbf24';  // Brillo dorado
  const FACE_DARK = '#090a10';    // Penumbra bajo la capucha
  const STAFF_WOOD = '#78350f';   // Madera báculo
  const STAFF_WOOD_DARK = '#451a03';

  // Paleta elemental del orbe rúnico del báculo
  const elementGemColors: Record<string, { gemLight: string; gemDark: string; eyeColor: string }> = {
    fire: { gemLight: '#fde047', gemDark: '#ea580c', eyeColor: '#fde047' },
    lightning: { gemLight: '#ffffff', gemDark: '#facc15', eyeColor: '#facc15' },
    earth: { gemLight: '#86efac', gemDark: '#15803d', eyeColor: '#4ade80' },
    ice: { gemLight: '#e0f2fe', gemDark: '#0284c7', eyeColor: '#67e8f9' },
    plasma: { gemLight: '#f5d0fe', gemDark: '#a855f7', eyeColor: '#c084fc' },
    magma: { gemLight: '#fef08a', gemDark: '#dc2626', eyeColor: '#f87171' },
    wind: { gemLight: '#f8fafc', gemDark: '#a5f3fc', eyeColor: '#cffafe' },
  };
  const gemInfo = elementGemColors[activeElement] || elementGemColors.fire;

  // Estado del pulso del orbe (2 estados discretos cada 350 ms)
  const isOrbPulsing = Math.floor(time / 0.35) % 2 === 1 || castAnimProgress > 0;

  // 3. TÚNICA Y CUERPO (Con sombra lateral rígida y ribete dorado)
  const ty = torsoOffY * P;

  // A. Contorno del cuerpo
  ctx.fillStyle = OUTLINE;
  ctx.fillRect((-5 + robeWalkShift) * P, ty + 1 * P, (10 - robeWalkShift) * P, 8 * P);
  ctx.fillRect((-6 + robeWalkShift) * P, ty + 7 * P, (12 - robeWalkShift) * P, 2 * P);

  // B. Relleno de túnica con sombra lateral rígida (bloque claro al frente, oscuro atrás)
  // Sombra trasera rígida (izquierda / atrás)
  ctx.fillStyle = ROBE_DARK;
  ctx.fillRect(-4 * P, ty + 2 * P, 4 * P, 6 * P);
  // Bloque claro al frente (derecha / frontal)
  ctx.fillStyle = ROBE_LIGHT;
  ctx.fillRect(0 * P, ty + 2 * P, 4 * P, 6 * P);
  // Zona central de volumen
  ctx.fillStyle = ROBE_MID;
  ctx.fillRect(-2 * P, ty + 2 * P, 3 * P, 6 * P);

  // C. Ribete dorado inferior escalonado
  ctx.fillStyle = GOLD_TRIM;
  ctx.fillRect((-4 + robeWalkShift) * P, ty + 7 * P, 8 * P, 1 * P);
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.fillRect((0 + robeWalkShift) * P, ty + 7 * P, 3 * P, 1 * P);

  // 4. ROSTRO EN PENUMBRA Y OJOS BRILLANTES (Bajo el ala)
  // Cara oscura
  ctx.fillStyle = FACE_DARK;
  ctx.fillRect(-3 * P, ty - 3 * P, 6 * P, 4 * P);

  // Ojos luminosos estilo 16-Bit (1 o 2 píxeles luminosos según orientación)
  ctx.fillStyle = gemInfo.eyeColor;
  // Ojo frontal (más visible y definido)
  ctx.fillRect(1 * P, ty - 2 * P, 1 * P, 1 * P);
  // Ojo trasero (1 píxel)
  ctx.fillRect(-1 * P, ty - 2 * P, 1 * P, 1 * P);

  // 5. SOMBRERO PUNTIAGUDO CON QUIEBRE ANGULAR Y ALA ANCHA
  // A. Ala ancha del sombrero (borde exterior negro)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-7 * P, ty - 5 * P, 14 * P, 3 * P);

  // B. Ala del sombrero (Púrpura medio con sombra rígida)
  ctx.fillStyle = ROBE_DARK;
  ctx.fillRect(-6 * P, ty - 4 * P, 6 * P, 1 * P);
  ctx.fillStyle = ROBE_LIGHT;
  ctx.fillRect(0 * P, ty - 4 * P, 6 * P, 1 * P);

  // C. Cinta dorada del sombrero
  ctx.fillStyle = GOLD_TRIM;
  ctx.fillRect(-4 * P, ty - 6 * P, 8 * P, 1 * P);
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.fillRect(0 * P, ty - 6 * P, 3 * P, 1 * P);

  // D. Cono del sombrero con quiebre angular (doblado hacia atrás)
  // Base del cono
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-4 * P, ty - 8 * P, 8 * P, 2 * P);
  ctx.fillStyle = ROBE_MID;
  ctx.fillRect(-3 * P, ty - 8 * P, 6 * P, 2 * P);
  ctx.fillStyle = ROBE_LIGHT;
  ctx.fillRect(0 * P, ty - 8 * P, 3 * P, 2 * P);

  // Sección media del sombrero
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-3 * P, ty - 11 * P, 6 * P, 3 * P);
  ctx.fillStyle = ROBE_MID;
  ctx.fillRect(-2 * P, ty - 11 * P, 4 * P, 3 * P);
  ctx.fillStyle = ROBE_LIGHT;
  ctx.fillRect(0 * P, ty - 11 * P, 2 * P, 3 * P);

  // Quiebre angular superior (inclinado a la izquierda/atrás)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-5 * P, ty - 13 * P, 4 * P, 2 * P);
  ctx.fillStyle = ROBE_LIGHT;
  ctx.fillRect(-4 * P, ty - 13 * P, 2 * P, 2 * P);

  // Punta angular doblada
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-7 * P, ty - 14 * P, 3 * P, 2 * P);
  ctx.fillStyle = GOLD_BRIGHT; // Pequeño remate o estrella en la punta
  ctx.fillRect(-6 * P, ty - 13 * P, 1 * P, 1 * P);

  // 6. BÁCULO RÚNICO CON GEMA ARDIENTE CUADRADA QUE PULSA EN 2 ESTADOS
  // Al castear, el báculo da un golpe corto hacia delante y vuelve a su postura.
  const castStaffShift = castAnimProgress > 0 ? Math.round((1 - castAnimProgress) * 5) + 2 : 0;
  const staffX = 5 * P + staffTilt * P + castStaffShift * P;
  const staffY = ty + 1 * P - (castAnimProgress > 0 ? Math.round((1 - castAnimProgress) * 2) * P : 0);

  // A. Mango de madera oscura (bloques de 1 píxel de ancho con sombra)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(staffX - 1 * P, staffY - 9 * P, 3 * P, 16 * P);

  ctx.fillStyle = STAFF_WOOD;
  ctx.fillRect(staffX, staffY - 8 * P, 1 * P, 14 * P);

  // Engaste / corona del báculo
  ctx.fillStyle = STAFF_WOOD_DARK;
  ctx.fillRect(staffX - 1 * P, staffY - 9 * P, 3 * P, 1 * P);

  // B. Gema elemental cuadrada (remate del báculo)
  // En estado 1: 2x2 píxeles
  // En estado 2 (pulsación): 3x3 píxeles con halo de píxeles
  if (isOrbPulsing) {
    // Halo cuadrado exterior
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(staffX - 2 * P, staffY - 14 * P, 5 * P, 5 * P);
    // Gema base
    ctx.fillStyle = gemInfo.gemDark;
    ctx.fillRect(staffX - 1 * P, staffY - 13 * P, 3 * P, 3 * P);
    // Núcleo brillante
    ctx.fillStyle = gemInfo.gemLight;
    ctx.fillRect(staffX, staffY - 12 * P, 1 * P, 1 * P);
  } else {
    // Estado normal compacto
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(staffX - 1 * P, staffY - 13 * P, 3 * P, 4 * P);
    ctx.fillStyle = gemInfo.gemDark;
    ctx.fillRect(staffX, staffY - 12 * P, 2 * P, 2 * P);
    ctx.fillStyle = gemInfo.gemLight;
    ctx.fillRect(staffX, staffY - 12 * P, 1 * P, 1 * P);
  }

  // Small stepped air currents unfurl from the staff during a wind cast.
  if (activeElement === 'wind' && castAnimProgress > 0) {
    const frame = Math.min(2, Math.floor((1 - castAnimProgress) * 3));
    ctx.globalAlpha = castAnimProgress * 0.8;
    ctx.strokeStyle = '#cffafe';
    ctx.lineWidth = P;
    for (let ribbon = 0; ribbon < 2; ribbon++) {
      const y = staffY - (12 + ribbon * 2) * P;
      ctx.beginPath(); ctx.moveTo(staffX + 2 * P, y);
      ctx.lineTo(staffX + (4 + frame) * P, y - P);
      ctx.lineTo(staffX + (7 + frame) * P, y - P);
      ctx.lineTo(staffX + (9 + frame) * P, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // 7. DESTELLO ELEMENTAL AL CASTEAR (Flash angular en píxeles, sin degradado difuminado)
  if (castFlashColor) {
    ctx.fillStyle = castFlashColor;
    ctx.globalAlpha = 0.6;
    // Anillo exterior de bloques pixelados en cruz
    ctx.fillRect(-8 * P, ty - 6 * P, 2 * P, 2 * P);
    ctx.fillRect(7 * P, ty - 6 * P, 2 * P, 2 * P);
    ctx.fillRect(staffX - 1 * P, staffY - 16 * P, 3 * P, 2 * P);
    ctx.fillRect(-1 * P, ty + 8 * P, 2 * P, 2 * P);
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();
}
