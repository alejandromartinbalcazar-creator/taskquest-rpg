// Renderizador de Efectos Visuales Avanzados para Hechizos (Rayo en Cadena, Bloque de Tierra, Fuego Vivo, Cristal de Hielo)

export function drawLightningArc(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = '#facc15',
  branches: boolean = true
) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const segments = Math.max(5, Math.floor(dist / 22));
  const dx = (x2 - x1) / segments;
  const dy = (y2 - y1) / segments;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x1, y1);

  let currentX = x1;
  let currentY = y1;

  for (let i = 1; i < segments; i++) {
    const normalX = -(y2 - y1) / dist;
    const normalY = (x2 - x1) / dist;
    const offset = (Math.random() - 0.5) * 24;

    const nextX = x1 + dx * i + normalX * offset;
    const nextY = y1 + dy * i + normalY * offset;
    ctx.lineTo(nextX, nextY);

    // Pequeñas ramificaciones eléctricas secundarias
    if (branches && Math.random() < 0.25) {
      const branchLen = 15 + Math.random() * 15;
      const bAng = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
      ctx.moveTo(nextX, nextY);
      ctx.lineTo(nextX + Math.cos(bAng) * branchLen, nextY + Math.sin(bAng) * branchLen);
      ctx.moveTo(nextX, nextY);
    }

    currentX = nextX;
    currentY = nextY;
  }

  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Núcleo blanco brillante en el centro del rayo
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

// Dibujar Peñasco Telúrico (Gran bloque de roca que impacta en masa)
export function drawEarthBoulder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Sombra del peñasco
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.9, radius * 1.1, radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();

  // Roca poligonal facetada
  ctx.beginPath();
  const sides = 7;
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 / sides) * i;
    const r = radius * (0.85 + Math.sin(i * 3.5) * 0.15);
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#78350f'; // Marrón roca
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Grietas en la roca
  ctx.beginPath();
  ctx.moveTo(-radius * 0.4, -radius * 0.2);
  ctx.lineTo(0, 0);
  ctx.lineTo(radius * 0.5, radius * 0.3);
  ctx.moveTo(0, 0);
  ctx.lineTo(-radius * 0.2, radius * 0.5);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Resplandor de energía de la tierra
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.fill();

  ctx.restore();
}

// Dibujar Llamas Vivas sobre un Creep que está ardiendo
export function drawCreepFlames(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  time: number
) {
  ctx.save();
  ctx.translate(x, y - radius * 0.4);

  const flameCount = 4;
  for (let i = 0; i < flameCount; i++) {
    const offsetX = (i - 1.5) * (radius * 0.45);
    const flicker = Math.sin(time * 15 + i * 2) * 5;
    const flameH = (radius * 1.1) + flicker;

    ctx.beginPath();
    ctx.moveTo(offsetX - 4, 0);
    ctx.quadraticCurveTo(offsetX + flicker * 0.5, -flameH * 0.7, offsetX, -flameH);
    ctx.quadraticCurveTo(offsetX + 3, -flameH * 0.4, offsetX + 4, 0);
    ctx.fillStyle = i % 2 === 0 ? '#ea580c' : '#f59e0b';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fill();
  }

  ctx.restore();
}

// Dibujar Bloque de Hielo 3D sobre un Creep Congelado
export function drawCreepIceCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  ctx.save();
  ctx.translate(x, y);

  const boxSize = radius * 2.3;
  const half = boxSize / 2;

  // Sombra del cubo
  ctx.beginPath();
  ctx.ellipse(0, half + 4, half * 1.1, half * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fill();

  // Cristal de hielo translúcido
  ctx.fillStyle = 'rgba(56, 189, 248, 0.55)'; // Azul cian translúcido
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.roundRect(-half, -half, boxSize, boxSize, 6);
  ctx.fill();
  ctx.stroke();

  // Facetas brillantes y reflejos angulares del hielo
  ctx.beginPath();
  ctx.moveTo(-half + 4, -half + 4);
  ctx.lineTo(half - 4, -half + 4);
  ctx.lineTo(half * 0.4, -half * 0.2);
  ctx.lineTo(-half * 0.4, -half * 0.2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  // Grieta interna del hielo
  ctx.beginPath();
  ctx.moveTo(-half * 0.6, half * 0.5);
  ctx.lineTo(-half * 0.1, 0);
  ctx.lineTo(half * 0.5, half * 0.2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Partículas de escarcha brillante en las esquinas
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-half + 5, -half + 5, 2, 0, Math.PI * 2);
  ctx.arc(half - 5, -half + 8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
