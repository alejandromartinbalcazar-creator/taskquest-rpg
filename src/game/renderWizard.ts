// Renderizador de Sprite de Mago 2D para Canvas (Vista Top-Down y Vista de Perfil)

export interface WizardRenderOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  scale?: number;
  facingAngle?: number; // en radianes
  isMoving?: boolean;
  castAnimProgress?: number; // 0 a 1 si está lanzando hechizo
  activeElement?: 'fire' | 'lightning' | 'earth' | 'ice' | 'plasma' | 'magma';
  time?: number; // para animaciones de flotación y brillo
}

export function drawWizardSprite({
  ctx,
  x,
  y,
  scale = 1,
  facingAngle = 0,
  isMoving = false,
  castAnimProgress = 0,
  activeElement = 'fire',
  time = Date.now() / 1000,
}: WizardRenderOptions) {
  ctx.save();
  ctx.translate(x, y);

  // Animación de flotar / caminar
  const bob = isMoving ? Math.sin(time * 12) * 3 : Math.sin(time * 3) * 2;
  const shadowScale = isMoving ? 1 + Math.sin(time * 12) * 0.1 : 1 - (bob / 20);

  // 1. Sombra en el suelo de la mazmorra
  ctx.beginPath();
  ctx.ellipse(0, 18 * scale, 14 * scale * shadowScale, 6 * scale * shadowScale, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fill();

  ctx.translate(0, bob);

  // 2. Aura de Hechizo / Elemento
  const elementColors: Record<string, { orb: string; glow: string }> = {
    fire: { orb: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' },
    lightning: { orb: '#facc15', glow: 'rgba(250, 204, 21, 0.5)' },
    earth: { orb: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)' },
    ice: { orb: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)' },
    plasma: { orb: '#c084fc', glow: 'rgba(192, 132, 252, 0.6)' },
    magma: { orb: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' },
  };

  const elem = elementColors[activeElement] || elementColors.fire;

  // 3. Túnica del Mago (Cuerpo)
  ctx.beginPath();
  ctx.moveTo(-10 * scale, 14 * scale);
  ctx.lineTo(10 * scale, 14 * scale);
  ctx.lineTo(8 * scale, -2 * scale);
  ctx.lineTo(-8 * scale, -2 * scale);
  ctx.closePath();
  ctx.fillStyle = '#2e1065'; // Púrpura oscuro místico
  ctx.fill();
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

  // Borde dorado inferior de la túnica
  ctx.beginPath();
  ctx.moveTo(-10 * scale, 13 * scale);
  ctx.lineTo(10 * scale, 13 * scale);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2 * scale;
  ctx.stroke();

  // Capa / Cuello
  ctx.beginPath();
  ctx.ellipse(0, -1 * scale, 9 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3b0764';
  ctx.fill();

  // 4. Cabeza con Capucha Oscura
  ctx.beginPath();
  ctx.arc(0, -6 * scale, 7 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a'; // Oscuridad bajo la capucha
  ctx.fill();

  // Ojos Brillantes Místicos (Tipo Black Mage)
  const eyeColor = activeElement === 'fire' ? '#fde047' : '#67e8f9';
  const eyeOffset = Math.sin(facingAngle) * 2 * scale;
  ctx.fillStyle = eyeColor;
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = 6 * scale;
  ctx.beginPath();
  ctx.arc(-3 * scale + eyeOffset, -6 * scale, 1.8 * scale, 0, Math.PI * 2);
  ctx.arc(3 * scale + eyeOffset, -6 * scale, 1.8 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0; // reset

  // 5. Sombrero de Mago Puntiagudo
  // Ala del sombrero
  ctx.beginPath();
  ctx.ellipse(0, -9 * scale, 13 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1e1b4b';
  ctx.fill();
  ctx.strokeStyle = '#3b0764';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

  // Cinta dorada del sombrero
  ctx.beginPath();
  ctx.ellipse(0, -11 * scale, 7 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();

  // Cono del sombrero inclinado con pliegue místico
  ctx.beginPath();
  ctx.moveTo(-7 * scale, -11 * scale);
  ctx.quadraticCurveTo(-2 * scale, -22 * scale, 8 * scale, -28 * scale); // Punta doblada
  ctx.quadraticCurveTo(3 * scale, -20 * scale, 7 * scale, -11 * scale);
  ctx.closePath();
  ctx.fillStyle = '#2e1065';
  ctx.fill();
  ctx.stroke();

  // Estrella brillante en la punta del sombrero
  ctx.beginPath();
  ctx.arc(8 * scale, -28 * scale, 2 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();

  // 6. Bastón Mágico del Mago
  const staffAngle = isMoving ? Math.sin(time * 10) * 0.2 : 0;
  const staffX = 12 * scale;
  const staffY = 2 * scale;

  ctx.save();
  ctx.translate(staffX, staffY);
  ctx.rotate(staffAngle);

  // Mango de madera
  ctx.beginPath();
  ctx.moveTo(-1 * scale, -20 * scale);
  ctx.lineTo(1 * scale, 14 * scale);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Corona del bastón
  ctx.beginPath();
  ctx.arc(0, -22 * scale, 4 * scale, Math.PI * 0.2, Math.PI * 1.8);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2 * scale;
  ctx.stroke();

  // Orbe Elemental Brillante
  const pulse = Math.sin(time * 6) * 1.5 * scale;
  const castBoost = castAnimProgress > 0 ? 6 * scale : 0;
  ctx.beginPath();
  ctx.arc(0, -22 * scale, (4 * scale) + pulse + castBoost, 0, Math.PI * 2);
  ctx.fillStyle = elem.orb;
  ctx.shadowColor = elem.glow;
  ctx.shadowBlur = (12 * scale) + (castAnimProgress * 20);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Pequeñas chispas del orbe
  if (Math.random() < 0.3) {
    const sparkX = (Math.random() - 0.5) * 10 * scale;
    const sparkY = -22 * scale + (Math.random() - 0.5) * 10 * scale;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 1 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  ctx.restore();

  ctx.restore();
}
