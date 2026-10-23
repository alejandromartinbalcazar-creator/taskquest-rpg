import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, DungeonFloor, FusedSpell, ElementSkillNode } from '../types';
import { drawWizardSprite } from './renderWizard';
import { sound } from '../services/soundService';
import confetti from 'canvas-confetti';
import { ArrowLeft, Sparkles, Flame, Zap, Shield, Snowflake, Heart, Award, Skull } from 'lucide-react';

interface ActionDungeonProps {
  player: Player;
  floor: DungeonFloor;
  onExit: () => void;
  onVictory: (floorNumber: number, expReward: number, goldReward: number) => void;
  onPlayerTakeDamage: (damage: number) => void;
}

interface Creep {
  id: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  attack: number;
  type: 'slime' | 'specter' | 'golem' | 'boss';
  color: string;
  name: string;
  lastAttackTime: number;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  element: 'fire' | 'lightning' | 'earth' | 'ice' | 'plasma' | 'magma';
  life: number;
  maxLife: number;
  pierce: number;
  isAoe?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface DamageNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export const ActionDungeon: React.FC<ActionDungeonProps> = ({
  player,
  floor,
  onExit,
  onVictory,
  onPlayerTakeDamage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Estados del juego
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [currentHp, setCurrentHp] = useState(player.currentHp);
  const [creepsDefeated, setCreepsDefeated] = useState(0);
  const targetCreeps = floor.isBoss ? 20 : 12;

  // Estado del Joystick virtual móvil
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 }); // Posición actual del stick relativo al centro
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef({ x: 70, y: 70 });

  // Cooldowns de hechizos
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // Referencias mutables para el ciclo de animación a 60FPS
  const gameRef = useRef({
    wizard: {
      x: 300,
      y: 350,
      radius: 16,
      speed: 3.2,
      vx: 0,
      vy: 0,
      facingAngle: -Math.PI / 2, // mirando hacia arriba por defecto
      isMoving: false,
      castProgress: 0,
    },
    creeps: [] as Creep[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    damageNumbers: [] as DamageNumber[],
    keysDown: {} as Record<string, boolean>,
    lastSpawnTime: 0,
    activeElement: 'fire' as 'fire' | 'lightning' | 'earth' | 'ice' | 'plasma' | 'magma',
    screenShake: 0,
    isOver: false,
  });

  // Determinar elemento activo
  useEffect(() => {
    if (player.unlockedFusions.length > 0) {
      if (player.unlockedFusions.includes('fusion-fire-lightning')) gameRef.current.activeElement = 'plasma';
      else if (player.unlockedFusions.includes('fusion-fire-earth')) gameRef.current.activeElement = 'magma';
    } else if (player.equippedSpells.length > 0) {
      const first = player.equippedSpells[0];
      if ('element' in first) {
        gameRef.current.activeElement = first.element;
      }
    }
  }, [player]);

  // Manejador de teclado para PC / Laptop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameRef.current.keysDown[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === '1') {
        handleCastSpell('basic');
      } else if (e.key === '2') {
        handleCastSpell('spell-1');
      } else if (e.key === '3') {
        handleCastSpell('spell-2');
      } else if (e.key === '4') {
        handleCastSpell('fusion');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keysDown[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Función para spawnear creeps en la mazmorra
  const spawnCreep = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Aparecen desde los bordes de la mazmorra (puertas o esquinas de ladrillo)
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (side === 0) { x = Math.random() * canvas.width; y = 50; } // arriba
    else if (side === 1) { x = canvas.width - 50; y = Math.random() * canvas.height; } // derecha
    else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height - 50; } // abajo
    else { x = 50; y = Math.random() * canvas.height; } // izquierda

    const creepTypes: Array<{ type: Creep['type']; color: string; name: string; hp: number; speed: number; attack: number; radius: number }> = [
      { type: 'slime', color: '#10b981', name: 'Duende de la Pereza', hp: 35, speed: 1.6, attack: 6, radius: 14 },
      { type: 'specter', color: '#a855f7', name: 'Espectro del Scroll', hp: 50, speed: 1.9, attack: 9, radius: 15 },
      { type: 'golem', color: '#64748b', name: 'Golem de la Duda', hp: 100, speed: 1.0, attack: 14, radius: 20 },
    ];

    const pick = creepTypes[Math.floor(Math.random() * creepTypes.length)];

    gameRef.current.creeps.push({
      id: `creep-${Date.now()}-${Math.random()}`,
      x,
      y,
      radius: pick.radius,
      hp: pick.hp,
      maxHp: pick.hp,
      speed: pick.speed,
      attack: pick.attack,
      type: pick.type,
      color: pick.color,
      name: pick.name,
      lastAttackTime: 0,
    });
  }, []);

  // DISPARAR HECHIZOS
  const handleCastSpell = (slot: 'basic' | 'spell-1' | 'spell-2' | 'fusion') => {
    if (gameRef.current.isOver) return;

    const wizard = gameRef.current.wizard;
    wizard.castProgress = 1;

    // Buscar el creep más cercano para auto-apuntar (estilo móvil moderno) o disparar en el ángulo que mira
    let targetAngle = wizard.facingAngle;
    let nearestDist = Infinity;

    gameRef.current.creeps.forEach((creep) => {
      const dx = creep.x - wizard.x;
      const dy = creep.y - wizard.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 320 && dist < nearestDist) {
        nearestDist = dist;
        targetAngle = Math.atan2(dy, dx);
      }
    });

    wizard.facingAngle = targetAngle;

    if (slot === 'basic') {
      sound.playAttackSound(false);
      const speed = 7;
      gameRef.current.projectiles.push({
        id: `p-${Date.now()}`,
        x: wizard.x,
        y: wizard.y,
        vx: Math.cos(targetAngle) * speed,
        vy: Math.sin(targetAngle) * speed,
        radius: 6,
        color: '#38bdf8',
        damage: 18 + Math.floor(player.stats.attack * 0.4),
        element: 'fire',
        life: 50,
        maxLife: 50,
        pierce: 1,
      });
    } else if (slot === 'spell-1') {
      // Hechizo Ígneo / Explosivo
      sound.playAttackSound(true);
      const speed = 6.5;
      gameRef.current.projectiles.push({
        id: `p-${Date.now()}`,
        x: wizard.x,
        y: wizard.y,
        vx: Math.cos(targetAngle) * speed,
        vy: Math.sin(targetAngle) * speed,
        radius: 10,
        color: '#f97316',
        damage: 35 + Math.floor(player.stats.knowledge * 0.6),
        element: 'fire',
        life: 60,
        maxLife: 60,
        pierce: 1,
        isAoe: true,
      });
    } else if (slot === 'spell-2') {
      // Hechizo Eléctrico / Perforante
      sound.playAttackSound(true);
      const speed = 9;
      // Dispara 3 rayos en abanico
      [-0.2, 0, 0.2].forEach((offset) => {
        const ang = targetAngle + offset;
        gameRef.current.projectiles.push({
          id: `p-${Date.now()}-${offset}`,
          x: wizard.x,
          y: wizard.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          radius: 5,
          color: '#facc15',
          damage: 28 + Math.floor(player.stats.defense * 0.5),
          element: 'lightning',
          life: 45,
          maxLife: 45,
          pierce: 3, // Atraviesa enemigos
        });
      });
    } else if (slot === 'fusion') {
      // HECHIZO DE FUSIÓN SUPREMO (ej. Plasma Tormentoso / Cataclismo de Magma)
      sound.playSpellFusion();
      gameRef.current.screenShake = 12;

      // Desata explosión radial de 8 orbes fusionados
      for (let i = 0; i < 8; i++) {
        const ang = (Math.PI * 2 / 8) * i;
        const speed = 6;
        gameRef.current.projectiles.push({
          id: `fusion-${Date.now()}-${i}`,
          x: wizard.x,
          y: wizard.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          radius: 12,
          color: '#c084fc',
          damage: 60 + player.stats.knowledge,
          element: 'plasma',
          life: 60,
          maxLife: 60,
          pierce: 2,
          isAoe: true,
        });
      }
    }
  };

  // TOUCH CONTROLS PARA JOYSTICK VIRTUAL MÓVIL
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // Si toca en la mitad izquierda de la pantalla, activa el joystick
    if (touchX < rect.width * 0.5) {
      joystickTouchIdRef.current = touch.identifier;
      joystickCenterRef.current = { x: touchX, y: touchY };
      setJoystickPos({ x: 0, y: 0 });
      setJoystickActive(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickActive) return;
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        const dx = touchX - joystickCenterRef.current.x;
        const dy = touchY - joystickCenterRef.current.y;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 45;

        if (dist > 0) {
          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(dist, maxRadius);
          const stickX = Math.cos(angle) * clampedDist;
          const stickY = Math.sin(angle) * clampedDist;

          setJoystickPos({ x: stickX, y: stickY });

          // Actualizar velocidad del mago
          const intensity = clampedDist / maxRadius;
          gameRef.current.wizard.vx = Math.cos(angle) * gameRef.current.wizard.speed * intensity;
          gameRef.current.wizard.vy = Math.sin(angle) * gameRef.current.wizard.speed * intensity;
          gameRef.current.wizard.facingAngle = angle;
          gameRef.current.wizard.isMoving = true;
        }
        break;
      }
    }
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    gameRef.current.wizard.vx = 0;
    gameRef.current.wizard.vy = 0;
    gameRef.current.wizard.isMoving = false;
    joystickTouchIdRef.current = null;
  };

  // BUCLE PRINCIPAL DE JUEGO (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;

    let animId: number;

    const gameLoop = () => {
      const now = Date.now();
      const state = gameRef.current;
      const wizard = state.wizard;

      // 1. Control de teclado para movimiento en Laptop / PC
      if (!joystickActive) {
        let kx = 0;
        let ky = 0;
        if (state.keysDown['w'] || state.keysDown['arrowup']) ky -= 1;
        if (state.keysDown['s'] || state.keysDown['arrowdown']) ky += 1;
        if (state.keysDown['a'] || state.keysDown['arrowleft']) kx -= 1;
        if (state.keysDown['d'] || state.keysDown['arrowright']) kx += 1;

        if (kx !== 0 || ky !== 0) {
          const angle = Math.atan2(ky, kx);
          wizard.vx = Math.cos(angle) * wizard.speed;
          wizard.vy = Math.sin(angle) * wizard.speed;
          wizard.facingAngle = angle;
          wizard.isMoving = true;
        } else {
          wizard.vx = 0;
          wizard.vy = 0;
          wizard.isMoving = false;
        }
      }

      // 2. Mover mago respetando paredes de la mazmorra
      wizard.x = Math.max(35, Math.min(canvas.width - 35, wizard.x + wizard.vx));
      wizard.y = Math.max(35, Math.min(canvas.height - 35, wizard.y + wizard.vy));

      if (wizard.castProgress > 0) {
        wizard.castProgress = Math.max(0, wizard.castProgress - 0.05);
      }

      // 3. Spawnear oleadas de creeps
      if (!state.isOver && now - state.lastSpawnTime > 2200 && state.creeps.length < 9) {
        spawnCreep();
        state.lastSpawnTime = now;
      }

      // 4. Mover Creeps hacia el mago
      state.creeps.forEach((creep) => {
        const dx = wizard.x - creep.x;
        const dy = wizard.y - creep.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          creep.x += (dx / dist) * creep.speed;
          creep.y += (dy / dist) * creep.speed;
        }

        // Ataque al mago al contacto
        if (dist < wizard.radius + creep.radius) {
          if (now - creep.lastAttackTime > 1200) {
            creep.lastAttackTime = now;
            sound.playProcrastinationDamage();
            state.screenShake = 8;
            onPlayerTakeDamage(creep.attack);

            setCurrentHp((prev) => {
              const next = Math.max(0, prev - creep.attack);
              if (next <= 0 && !state.isOver) {
                state.isOver = true;
                setGameState('lost');
              }
              return next;
            });

            // Número de daño rojo en el mago
            state.damageNumbers.push({
              id: `dmg-${now}`,
              x: wizard.x + (Math.random() - 0.5) * 20,
              y: wizard.y - 20,
              text: `-${creep.attack}`,
              color: '#ef4444',
              life: 40,
            });
          }
        }
      });

      // 5. Actualizar Proyectiles y Colisiones
      for (let pIdx = state.projectiles.length - 1; pIdx >= 0; pIdx--) {
        const p = state.projectiles[pIdx];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;

        // Partículas de estela
        if (Math.random() < 0.6) {
          state.particles.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            radius: p.radius * 0.4,
            color: p.color,
            life: 15,
            maxLife: 15,
          });
        }

        // Colisión con creeps
        let hit = false;
        for (let cIdx = state.creeps.length - 1; cIdx >= 0; cIdx--) {
          const creep = state.creeps[cIdx];
          const dist = Math.hypot(creep.x - p.x, creep.y - p.y);

          if (dist < creep.radius + p.radius) {
            creep.hp -= p.damage;
            hit = true;

            // Chispas de impacto
            for (let i = 0; i < 6; i++) {
              state.particles.push({
                x: creep.x,
                y: creep.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: 3,
                color: p.color,
                life: 20,
                maxLife: 20,
              });
            }

            // Texto de daño
            state.damageNumbers.push({
              id: `c-dmg-${now}-${cIdx}`,
              x: creep.x,
              y: creep.y - 15,
              text: `-${p.damage}`,
              color: p.color,
              life: 30,
            });

            // Si el creep muere
            if (creep.hp <= 0) {
              sound.playMicroStepDing();
              state.creeps.splice(cIdx, 1);
              setCreepsDefeated((prev) => {
                const next = prev + 1;
                if (next >= targetCreeps && !state.isOver) {
                  state.isOver = true;
                  sound.playLevelUp();
                  confetti({ particleCount: 100, spread: 80 });
                  setGameState('won');
                  onVictory(floor.floorNumber, floor.enemy.expReward, floor.enemy.goldReward);
                }
                return next;
              });
            }

            p.pierce -= 1;
            if (p.pierce <= 0) break;
          }
        }

        if (p.life <= 0 || (hit && p.pierce <= 0)) {
          state.projectiles.splice(pIdx, 1);
        }
      }

      // 6. Actualizar partículas y números flotantes
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 1;
        if (pt.life <= 0) state.particles.splice(i, 1);
      }

      for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
        const dn = state.damageNumbers[i];
        dn.y -= 0.8;
        dn.life -= 1;
        if (dn.life <= 0) state.damageNumbers.splice(i, 1);
      }

      // 7. DIBUJAR TODO EN EL CANVAS (ESTÉTICA DE MAZMORRA CON LADRILLOS Y ANTORCHAS)
      ctx.save();

      // Screen shake al recibir daño
      if (state.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * state.screenShake, (Math.random() - 0.5) * state.screenShake);
        state.screenShake *= 0.85;
        if (state.screenShake < 0.5) state.screenShake = 0;
      }

      // A. Suelo de baldosas de piedra de mazmorra
      ctx.fillStyle = '#11131a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const tileSize = 40;
      ctx.strokeStyle = '#1b1e2c';
      ctx.lineWidth = 1;
      for (let tx = 0; tx < canvas.width; tx += tileSize) {
        for (let ty = 0; ty < canvas.height; ty += tileSize) {
          ctx.strokeRect(tx, ty, tileSize, tileSize);
        }
      }

      // B. Muros de ladrillo y enredaderas/plantas alrededor
      const wallThickness = 24;
      ctx.fillStyle = '#1c1917'; // Ladrillo oscuro
      // Muro superior e inferior
      ctx.fillRect(0, 0, canvas.width, wallThickness);
      ctx.fillRect(0, canvas.height - wallThickness, canvas.width, wallThickness);
      // Muro izquierdo y derecho
      ctx.fillRect(0, 0, wallThickness, canvas.height);
      ctx.fillRect(canvas.width - wallThickness, 0, wallThickness, canvas.height);

      // Líneas de mortero de ladrillo
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2;
      ctx.strokeRect(wallThickness, wallThickness, canvas.width - wallThickness * 2, canvas.height - wallThickness * 2);

      // Enredaderas verdes en las esquinas de los muros
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(wallThickness + 10, wallThickness + 10, 12, 0, Math.PI * 2);
      ctx.arc(canvas.width - wallThickness - 10, wallThickness + 10, 14, 0, Math.PI * 2);
      ctx.arc(wallThickness + 10, canvas.height - wallThickness - 10, 15, 0, Math.PI * 2);
      ctx.arc(canvas.width - wallThickness - 10, canvas.height - wallThickness - 10, 12, 0, Math.PI * 2);
      ctx.fill();

      // C. Antorchas con brillo cálido parpadeante
      const torchTime = now / 200;
      const torchFlicker = Math.sin(torchTime) * 3;
      const torchPositions = [
        { x: 80, y: wallThickness },
        { x: canvas.width - 80, y: wallThickness },
        { x: 80, y: canvas.height - wallThickness },
        { x: canvas.width - 80, y: canvas.height - wallThickness },
      ];

      torchPositions.forEach((tp) => {
        // Resplandor de luz de antorcha
        const glow = ctx.createRadialGradient(tp.x, tp.y, 2, tp.x, tp.y, 45 + torchFlicker);
        glow.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
        glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(tp.x - 50, tp.y - 50, 100, 100);

        // Fuego de antorcha
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // D. Dibujar Creeps / Enemigos en Pixel Art 16-Bit
      state.creeps.forEach((creep) => {
        ctx.save();
        ctx.translate(Math.round(creep.x), Math.round(creep.y));

        const cr = Math.round(creep.radius);

        // Sombra pixelada
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(-cr, Math.round(cr * 0.7), cr * 2, 4);

        // Cuerpo en bloques de píxeles
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-cr - 1, -cr - 1, (cr * 2) + 2, (cr * 2) + 2);
        ctx.fillStyle = creep.color;
        ctx.fillRect(-cr, -cr, cr * 2, cr * 2);

        // Ojos de píxeles
        const eyeOffset = Math.round(cr * 0.35);
        const eyeY = Math.round(-cr * 0.2);
        ctx.fillStyle = '#fee2e2';
        ctx.fillRect(-eyeOffset - 1, eyeY - 1, 3, 3);
        ctx.fillRect(eyeOffset - 1, eyeY - 1, 3, 3);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-eyeOffset, eyeY, 1, 1);
        ctx.fillRect(eyeOffset, eyeY, 1, 1);

        // Barra de vida del creep
        const barW = cr * 2;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-barW / 2 - 1, -cr - 9, barW + 2, 5);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(-barW / 2, -cr - 8, barW, 3);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-barW / 2, -cr - 8, Math.round(barW * (creep.hp / creep.maxHp)), 3);

        ctx.restore();
      });

      // E. Dibujar Proyectiles
      state.projectiles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // F. Dibujar Partículas
      state.particles.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius * (pt.life / pt.maxLife), 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
      });

      // G. Dibujar Sprite del Mago
      drawWizardSprite({
        ctx,
        x: wizard.x,
        y: wizard.y,
        scale: 1.2,
        facingAngle: wizard.facingAngle,
        isMoving: wizard.isMoving,
        castAnimProgress: wizard.castProgress,
        activeElement: state.activeElement,
        time: now / 1000,
      });

      // H. Dibujar Números de Daño Flotantes
      state.damageNumbers.forEach((dn) => {
        ctx.font = 'bold 13px system-ui';
        ctx.fillStyle = dn.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(dn.text, dn.x, dn.y);
        ctx.fillText(dn.text, dn.x, dn.y);
      });

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [joystickActive, spawnCreep, onPlayerTakeDamage, onVictory, floor, targetCreeps]);

  return (
    <div className="max-w-xl mx-auto px-2 py-2 space-y-3 pb-24 select-none">
      {/* Cabecera de la Mazmorra */}
      <div className="bg-[#121420] border border-[#2b3352] rounded-2xl p-2.5 flex items-center justify-between shadow-lg">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#1a1f33] hover:bg-[#232945] rounded-xl text-xs font-bold text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Salir</span>
        </button>

        {/* Barra HP del Héroe */}
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <div className="w-24 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all"
              style={{ width: `${Math.max(0, Math.min(100, (currentHp / player.maxHp) * 100))}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-rose-300">
            {currentHp}/{player.maxHp}
          </span>
        </div>

        {/* Progreso de Creeps */}
        <div className="flex items-center gap-1.5 bg-[#171b2d] px-2.5 py-1 rounded-xl border border-purple-500/30 text-xs font-bold text-purple-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{creepsDefeated}/{targetCreeps} Creeps</span>
        </div>
      </div>

      {/* ÁREA DE JUEGO (CANVAS INTERACTIVO) */}
      <div
        className="relative w-full aspect-square bg-[#0b0c12] retro-box-stone overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full block pixelated"
        />

        {/* JOYSTICK VIRTUAL MÓVIL EN PANTALLA (Abajo a la Izquierda) */}
        {joystickActive && (
          <div
            className="absolute pointer-events-none rounded-full border-2 border-cyan-400/50 bg-cyan-950/40"
            style={{
              width: 90,
              height: 90,
              left: joystickCenterRef.current.x - 45,
              top: joystickCenterRef.current.y - 45,
            }}
          >
            {/* Stick Knob */}
            <div
              className="absolute w-10 h-10 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] border border-white"
              style={{
                left: 45 - 20 + joystickPos.x,
                top: 45 - 20 + joystickPos.y,
              }}
            />
          </div>
        )}

        {/* Indicador de Ayuda para Laptop */}
        <div className="absolute top-2 left-2 text-[10px] text-slate-400 bg-black/60 px-2 py-0.5 rounded-lg border border-slate-800 backdrop-blur-sm pointer-events-none">
          Móvil: Arrastra para mover | PC: W,A,S,D
        </div>

        {/* OVERLAYS DE VICTORIA O DERROTA */}
        {gameState === 'won' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <Award className="w-16 h-16 text-amber-400 mb-2 animate-bounce" />
            <h3 className="font-black text-xl text-emerald-400">¡MAZMORRA PURIFICADA!</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              Has derrotado a la horda de la inacción y fortalecido tu concentración.
            </p>
            <div className="flex gap-4 my-4 font-bold text-sm">
              <span className="text-cyan-300">+{floor.enemy.expReward} EXP</span>
              <span className="text-amber-300">+{floor.enemy.goldReward} Oro</span>
            </div>
            <button
              onClick={onExit}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg"
            >
              Reclamar Victoria
            </button>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <Skull className="w-16 h-16 text-rose-500 mb-2" />
            <h3 className="font-black text-xl text-rose-400">¡EL MAGO HA CAÍDO!</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              La procrastinación ha ganado esta ronda. Cumple tus tareas pendientes para reponer fuerzas.
            </p>
            <button
              onClick={onExit}
              className="mt-4 px-6 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg"
            >
              Volver al Refugio
            </button>
          </div>
        )}
      </div>

      {/* BOTONERA DE PODERES Y HECHIZOS (A la Derecha / Ergonómica para el pulgar) */}
      <div className="bg-[#121420] border border-[#2b3352] rounded-3xl p-3 shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
          <span className="font-bold uppercase tracking-wider text-[10px]">Poderes Mágicos</span>
          <span className="text-[10px] text-cyan-400">Toca para disparar al creep más cercano</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Poder 1: Ataque Básico Rápido */}
          <button
            onClick={() => handleCastSpell('basic')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#1a1f33] border border-[#2e375a] hover:bg-[#252c48] active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-200 mt-1">Orbe</span>
            <span className="text-[9px] text-cyan-300">Rápido</span>
          </button>

          {/* Poder 2: Fuego Explosivo */}
          <button
            onClick={() => handleCastSpell('spell-1')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/40 active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-900 flex items-center justify-center text-rose-300 border border-rose-700">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-rose-200 mt-1">Fuego</span>
            <span className="text-[9px] text-rose-400">Área</span>
          </button>

          {/* Poder 3: Rayo Perforante */}
          <button
            onClick={() => handleCastSpell('spell-2')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/40 active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-900 flex items-center justify-center text-amber-300 border border-amber-700">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-amber-200 mt-1">Rayo</span>
            <span className="text-[9px] text-amber-400">Triple</span>
          </button>

          {/* Poder 4: Hechizo Supremo de Fusión */}
          <button
            onClick={() => handleCastSpell('fusion')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-500 shadow-md shadow-purple-950 active:scale-95 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-700 flex items-center justify-center text-white border border-purple-400 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-purple-200 mt-1">FUSIÓN</span>
            <span className="text-[9px] text-purple-300 font-bold">Cataclismo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
