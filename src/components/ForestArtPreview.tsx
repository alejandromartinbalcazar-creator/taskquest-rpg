import { useEffect, useRef } from 'react';
import { LEVEL_1_BACKGROUND, LEVEL_1_BACKGROUND_SIZE } from '../game/levels/level1BackgroundLayout';

/**
 * Maqueta visual aislada del Gran Sendero. No cambia la mazmorra jugable:
 * permite aprobar el encuadre artístico antes de conectar esta escena con el
 * mapa de colisiones, enemigos y cámara del nivel 1.
 */
export function ForestArtPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const background = new Image();
    background.onload = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // El marco identifica la maqueta sin cubrir el arte. Los carriles se
      // conservan como datos y son invisibles para el jugador final.
      ctx.fillStyle = 'rgba(3, 10, 14, 0.82)';
      ctx.fillRect(18, 16, 330, 38);
      ctx.strokeStyle = '#9cc9d6';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 16, 330, 38);
      ctx.fillStyle = '#ecfeff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('NIVEL 1 · PRUEBA DE FONDO', 34, 41);
    };
    background.src = LEVEL_1_BACKGROUND;
  }, []);

  return (
    <main className="min-h-screen bg-[#07110f] p-4 flex items-center justify-center">
      <section className="w-full max-w-[1280px]">
        <canvas
          ref={canvasRef}
          width={LEVEL_1_BACKGROUND_SIZE.width}
          height={LEVEL_1_BACKGROUND_SIZE.height}
          className="w-full border-2 border-emerald-900 shadow-2xl"
        />
        <p className="mt-3 text-center text-sm text-emerald-100/80">
          Máscara verde: caminar · rojo y azul: bloqueo · amarillo: portón.
        </p>
      </section>
    </main>
  );
}
