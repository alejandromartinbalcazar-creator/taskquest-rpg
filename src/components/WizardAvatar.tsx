import React, { useEffect, useRef } from 'react';
import { drawWizardSprite } from '../game/renderWizard';

interface WizardAvatarProps {
  size?: number; // ancho y alto del canvas en px
  scale?: number;
  activeElement?: 'fire' | 'lightning' | 'earth' | 'ice' | 'plasma' | 'magma';
  isAnimated?: boolean;
}

export const WizardAvatar: React.FC<WizardAvatarProps> = ({
  size = 140,
  scale = 2.4,
  activeElement = 'fire',
  isAnimated = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawWizardSprite({
        ctx,
        x: canvas.width / 2,
        y: (canvas.height / 2) + 12,
        scale,
        activeElement,
        isMoving: false,
        time: Date.now() / 1000,
      });

      if (isAnimated) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [size, scale, activeElement, isAnimated]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Resplandor místico de fondo */}
      <div className="absolute inset-0 rounded-full bg-purple-600/20 blur-xl scale-75 animate-pulse" />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="relative z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]"
      />
    </div>
  );
};
