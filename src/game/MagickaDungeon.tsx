import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, DungeonFloor } from '../types';
import { MagickaElement, CastMode } from './magickaTypes';
import { resolveSpell } from './spellResolver';
import { getAvailableFusion, FusionRecipe } from './fusionRecipes';
import { drawWizardSprite } from './renderWizard';
import { drawLightningArc, drawEarthBoulder, drawCreepFlames, drawCreepIceCube } from './spellFX';
import { sound } from '../services/soundService';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Heart,
  Shield,
  Sparkles,
  Flame,
  Droplets,
  Zap,
  Snowflake,
  Mountain,
  RotateCcw,
  Target,
  Maximize2,
  UserCheck,
  Award,
  Skull,
  Compass
} from 'lucide-react';

interface MagickaDungeonProps {
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
  color: string;
  name: string;
  lastAttackTime: number;
  wetTimer: number;
  frozenTimer: number;
  burnTimer: number;
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
  life: number;
  maxLife: number;
  pierce: number;
  knockback: number;
  isEarthBoulder?: boolean;
  boulderRotation?: number;
  inflictsWet?: boolean;
  inflictsBurn?: boolean;
  inflictsFreeze?: boolean;
  inflictsShock?: boolean;
}

interface LightningChainFX {
  id: string;
  segments: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  color: string;
  life: number;
  maxLife: number;
}

interface AreaBlast {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  damage: number;
  life: number;
  maxLife: number;
  knockback: number;
  inflictsWet?: boolean;
  inflictsBurn?: boolean;
  inflictsFreeze?: boolean;
  inflictsShock?: boolean;
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

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

// DIMENSIONES DEL MAPA DE LA MAZMORRA CONTINUA (MUNDO COMPLETO)
const WORLD_WIDTH = 1100;
const WORLD_HEIGHT = 750;

export const MagickaDungeon: React.FC<MagickaDungeonProps> = ({
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
  const [playerShield, setPlayerShield] = useState(0);
  const [creepsDefeated, setCreepsDefeated] = useState(0);
  const targetCreeps = floor.isBoss ? 20 : 12;

  // Cola de elementos Magicka (hasta 3)
  const [elementQueue, setElementQueue] = useState<MagickaElement[]>([]);
  const [availableFusion, setAvailableFusion] = useState<FusionRecipe | null>(null);

  // Joystick virtual independiente para móvil
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number } | null>(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });
  const joystickTouchIdRef = useRef<number | null>(null);

  // Referencias para el bucle a 60 FPS
  const gameRef = useRef({
    wizard: {
      x: 150,
      y: 375,
      radius: 16,
      baseSpeed: 3.2,
      speedMultiplier: 1,
      speedBuffTimer: 0,
      vx: 0,
      vy: 0,
      facingAngle: 0,
      isMoving: false,
      castProgress: 0,
    },
    camera: { x: 0, y: 0 },
    creeps: [] as Creep[],
    projectiles: [] as Projectile[],
    lightningChains: [] as LightningChainFX[],
    areaBlasts: [] as AreaBlast[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    keysDown: {} as Record<string, boolean>,
    lastSpawnTime: 0,
    screenShake: 0,
    isOver: false,
    elementQueueRef: [] as MagickaElement[],
  });

  // Actualizar cola y detectar fusiones disponibles en tiempo real
  useEffect(() => {
    gameRef.current.elementQueueRef = elementQueue;
    setAvailableFusion(getAvailableFusion(elementQueue));
  }, [elementQueue]);

  // SPAWN DE CREEPS EN DIFERENTES SALAS DE LA MAZMORRA (MÁS LENTOS PARA PERMITIR PENSAR COMBOS)
  const spawnCreep = useCallback(() => {
    const wizard = gameRef.current.wizard;
    // Spawn en la sala donde se encuentra el mago o en la siguiente
    const spawnX = Math.random() < 0.5 ? wizard.x + (150 + Math.random() * 180) : wizard.x - (150 + Math.random() * 180);
    const spawnY = wizard.y + (Math.random() - 0.5) * 250;

    const clampedX = Math.max(80, Math.min(WORLD_WIDTH - 80, spawnX));
    const clampedY = Math.max(80, Math.min(WORLD_HEIGHT - 80, spawnY));

    // VELOCIDAD DE CREEPS REDUCIDA (0.65 - 0.85) para dar tiempo a elaborar combos
    const types = [
      { name: 'Duende de la Pereza', color: '#10b981', hp: 40, speed: 0.75, attack: 5, radius: 13 },
      { name: 'Espectro del Scroll', color: '#a855f7', hp: 55, speed: 0.90, attack: 8, radius: 15 },
      { name: 'Golem de la Duda', color: '#78716c', hp: 110, speed: 0.45, attack: 12, radius: 19 },
    ];
    const pick = types[Math.floor(Math.random() * types.length)];

    gameRef.current.creeps.push({
      id: `creep-${Date.now()}-${Math.random()}`,
      x: clampedX,
      y: clampedY,
      radius: pick.radius,
      hp: pick.hp,
      maxHp: pick.hp,
      speed: pick.speed,
      attack: pick.attack,
      color: pick.color,
      name: pick.name,
      lastAttackTime: 0,
      wetTimer: 0,
      frozenTimer: 0,
      burnTimer: 0,
    });
  }, []);

  // Agregar elemento
  const handleAddElement = (elem: MagickaElement) => {
    sound.playMicroStepDing();
    setElementQueue((prev) => {
      if (prev.length >= 3) return [...prev.slice(1), elem];
      return [...prev, elem];
    });
  };

  const handleClearElements = () => {
    setElementQueue([]);
  };

  // LANZAR HECHIZO
  const handleCast = (mode: CastMode) => {
    if (gameRef.current.isOver) return;

    const currentElements = gameRef.current.elementQueueRef;
    const spell = resolveSpell(currentElements, mode);
    const wizard = gameRef.current.wizard;
    wizard.castProgress = 1;

    // 1. AUTO-LANZAMIENTO (SELF)
    if (mode === 'self') {
      sound.playSpellFusion();
      if (spell.heal > 0) {
        setCurrentHp((prev) => Math.min(player.maxHp, prev + spell.heal));
        gameRef.current.floatingTexts.push({
          id: `heal-${Date.now()}`,
          x: wizard.x,
          y: wizard.y - 30,
          text: `+${spell.heal} HP`,
          color: '#34d399',
          life: 45,
        });
      }

      if (spell.shieldAmount > 0) {
        setPlayerShield((prev) => prev + spell.shieldAmount);
        gameRef.current.floatingTexts.push({
          id: `shield-${Date.now()}`,
          x: wizard.x,
          y: wizard.y - 45,
          text: `+${spell.shieldAmount} Escudo`,
          color: '#38bdf8',
          life: 45,
        });
      }

      if (spell.speedBoost > 0) {
        wizard.speedMultiplier = 1.6;
        wizard.speedBuffTimer = 180;
      }

      for (let i = 0; i < 15; i++) {
        gameRef.current.particles.push({
          x: wizard.x,
          y: wizard.y,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 3,
          radius: 3,
          color: spell.color,
          life: 30,
          maxLife: 30,
        });
      }

      setElementQueue([]);
      return;
    }

    // 2. ÁREA (NOVA)
    if (mode === 'area') {
      sound.playSpellFusion();
      gameRef.current.screenShake = 9;

      gameRef.current.areaBlasts.push({
        id: `blast-${Date.now()}`,
        x: wizard.x,
        y: wizard.y,
        radius: 12,
        maxRadius: spell.radius * 1.2,
        color: spell.color,
        damage: spell.damage + Math.floor(player.stats.knowledge * 0.6),
        life: spell.duration,
        maxLife: spell.duration,
        knockback: spell.knockback,
        inflictsWet: spell.inflictsWet,
        inflictsBurn: spell.inflictsBurn,
        inflictsFreeze: spell.inflictsFreeze,
        inflictsShock: spell.inflictsShock,
      });

      setElementQueue([]);
      return;
    }

    // 3. PROYECTIL / RAYO DINÁMICO
    // Si contiene RAYO puro o con agua/fuego: DESATA RAYO EN CADENA (CHAIN LIGHTNING)
    if (currentElements.includes('lightning') && !currentElements.includes('earth')) {
      sound.playAttackSound(true);

      // Buscar creeps cercanos para encadenar hasta 3 objetivos
      const hitCreeps: Creep[] = [];
      let currentSource = { x: wizard.x, y: wizard.y };

      for (let jump = 0; jump < 3; jump++) {
        let nearest: Creep | null = null;
        let minDist = jump === 0 ? 320 : 200;

        gameRef.current.creeps.forEach((c) => {
          if (!hitCreeps.includes(c)) {
            const d = Math.hypot(c.x - currentSource.x, c.y - currentSource.y);
            if (d < minDist) {
              minDist = d;
              nearest = c;
            }
          }
        });

        if (nearest) {
          hitCreeps.push(nearest);
          currentSource = { x: (nearest as Creep).x, y: (nearest as Creep).y };
        } else {
          break;
        }
      }

      if (hitCreeps.length > 0) {
        const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
        let prevX = wizard.x;
        let prevY = wizard.y;

        hitCreeps.forEach((creep, idx) => {
          segments.push({ x1: prevX, y1: prevY, x2: creep.x, y2: creep.y });
          prevX = creep.x;
          prevY = creep.y;

          let dmg = spell.damage - (idx * 8);
          // Combo Mojado + Rayo
          if (creep.wetTimer > 0) {
            dmg = Math.floor(dmg * 2.5);
            gameRef.current.floatingTexts.push({
              id: `electro-${Date.now()}-${idx}`,
              x: creep.x,
              y: creep.y - 25,
              text: `⚡ ELECTROCUCIÓN x2.5!`,
              color: '#facc15',
              life: 35,
            });
          }

          creep.hp -= dmg;
          creep.wetTimer = 0; // Se disipa con la descarga
          creep.burnTimer = 0;

          gameRef.current.floatingTexts.push({
            id: `dmg-${Date.now()}-${idx}`,
            x: creep.x,
            y: creep.y - 10,
            text: `-${dmg}`,
            color: '#facc15',
            life: 30,
          });

          if (creep.hp <= 0) {
            checkCreepDeath(creep);
          }
        });

        // Efecto visual de relámpago en zigzag en pantalla
        gameRef.current.lightningChains.push({
          id: `bolt-${Date.now()}`,
          segments,
          color: currentElements.includes('fire') ? '#c084fc' : '#facc15',
          life: 14,
          maxLife: 14,
        });

        setElementQueue([]);
        return;
      }
    }

    // DISPARO DIRECCIONAL (PEÑASCO DE TIERRA, METEORITO O BOLA DE FUEGO)
    let aimAngle = wizard.facingAngle;
    let closestDist = Infinity;

    gameRef.current.creeps.forEach((creep) => {
      const dx = creep.x - wizard.x;
      const dy = creep.y - wizard.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 340 && dist < closestDist) {
        closestDist = dist;
        aimAngle = Math.atan2(dy, dx);
      }
    });

    wizard.facingAngle = aimAngle;
    const baseDamage = spell.damage + Math.floor(player.stats.attack * 0.4 + player.stats.knowledge * 0.4);

    const isEarth = currentElements.includes('earth');

    gameRef.current.projectiles.push({
      id: `p-${Date.now()}`,
      x: wizard.x,
      y: wizard.y,
      vx: Math.cos(aimAngle) * (isEarth ? 5.5 : spell.projectileSpeed),
      vy: Math.sin(aimAngle) * (isEarth ? 5.5 : spell.projectileSpeed),
      radius: isEarth ? 18 : spell.radius, // ¡Bloque grande de tierra!
      color: spell.color,
      damage: baseDamage,
      life: spell.duration,
      maxLife: spell.duration,
      pierce: isEarth ? 3 : spell.pierce,
      knockback: isEarth ? 18 : spell.knockback,
      isEarthBoulder: isEarth,
      boulderRotation: 0,
      inflictsWet: spell.inflictsWet,
      inflictsBurn: spell.inflictsBurn,
      inflictsFreeze: spell.inflictsFreeze,
      inflictsShock: spell.inflictsShock,
    });

    sound.playAttackSound(isEarth || spell.damage > 45);
    setElementQueue([]);
  };

  // Disparar Fusión Directa
  const handleTriggerFusion = () => {
    handleCast('shoot');
  };

  const checkCreepDeath = (creep: Creep) => {
    sound.playMicroStepDing();
    const idx = gameRef.current.creeps.indexOf(creep);
    if (idx !== -1) {
      gameRef.current.creeps.splice(idx, 1);
    }

    setCreepsDefeated((prev) => {
      const next = prev + 1;
      if (next >= targetCreeps && !gameRef.current.isOver) {
        gameRef.current.isOver = true;
        sound.playLevelUp();
        confetti({ particleCount: 120, spread: 90 });
        setGameState('won');
        setTimeout(() => onVictory(floor.floorNumber, floor.enemy.expReward, floor.enemy.goldReward), 0);
      }
      return next;
    });
  };

  // ==========================================
  // MULTI-TOUCH AISLADO PARA JOYSTICK
  // ==========================================
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    joystickTouchIdRef.current = touch.identifier;
    joystickCenterRef.current = { x: touchX, y: touchY };
    setJoystickPos({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
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
          const clamped = Math.min(dist, maxRadius);
          setJoystickPos({
            x: Math.cos(angle) * clamped,
            y: Math.sin(angle) * clamped,
          });

          const intensity = clamped / maxRadius;
          const speed = gameRef.current.wizard.baseSpeed * gameRef.current.wizard.speedMultiplier;
          gameRef.current.wizard.vx = Math.cos(angle) * speed * intensity;
          gameRef.current.wizard.vy = Math.sin(angle) * speed * intensity;
          gameRef.current.wizard.facingAngle = angle;
          gameRef.current.wizard.isMoving = true;
        }
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setJoystickPos(null);
        gameRef.current.wizard.vx = 0;
        gameRef.current.wizard.vy = 0;
        gameRef.current.wizard.isMoving = false;
        break;
      }
    }
  };

  // TECLADO PARA PC / LAPTOP
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      gameRef.current.keysDown[k] = true;

      if (k === 'q' || k === '1') handleAddElement('fire');
      else if (k === 'w' || k === '2') handleAddElement('water');
      else if (k === 'e' || k === '3') handleAddElement('lightning');
      else if (k === 'r' || k === '4') handleAddElement('ice');
      else if (k === 'a' || k === '5') handleAddElement('earth');
      else if (k === 's' || k === '6') handleAddElement('shield');

      else if (k === ' ' || k === 'j') handleCast('shoot');
      else if (k === 'k') handleCast('area');
      else if (k === 'l') handleCast('self');
      else if (k === 'c') handleClearElements();
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

  // BUCLE DE FÍSICA Y RENDERIZADO CON CÁMARA SUAVE Y MAZMORRA CONTINUA
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;

    let animId: number;

    const loop = () => {
      const now = Date.now();
      const state = gameRef.current;
      const wizard = state.wizard;

      // Movimiento teclado si no hay joystick
      if (joystickTouchIdRef.current === null) {
        let kx = 0;
        let ky = 0;
        if (state.keysDown['w'] || state.keysDown['arrowup']) ky -= 1;
        if (state.keysDown['s'] || state.keysDown['arrowdown']) ky += 1;
        if (state.keysDown['a'] || state.keysDown['arrowleft']) kx -= 1;
        if (state.keysDown['d'] || state.keysDown['arrowright']) kx += 1;

        if (kx !== 0 || ky !== 0) {
          const ang = Math.atan2(ky, kx);
          const spd = wizard.baseSpeed * wizard.speedMultiplier;
          wizard.vx = Math.cos(ang) * spd;
          wizard.vy = Math.sin(ang) * spd;
          wizard.facingAngle = ang;
          wizard.isMoving = true;
        } else {
          wizard.vx = 0;
          wizard.vy = 0;
          wizard.isMoving = false;
        }
      }

      if (wizard.speedBuffTimer > 0) {
        wizard.speedBuffTimer -= 1;
        if (wizard.speedBuffTimer <= 0) wizard.speedMultiplier = 1;
      }

      // Mover mago en los límites del gran mundo de la mazmorra
      wizard.x = Math.max(50, Math.min(WORLD_WIDTH - 50, wizard.x + wizard.vx));
      wizard.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, wizard.y + wizard.vy));

      if (wizard.castProgress > 0) wizard.castProgress = Math.max(0, wizard.castProgress - 0.05);

      // CÁMARA SUAVE (SIGUE AL MAGO POR LAS SALAS Y PASILLOS)
      const targetCamX = wizard.x - canvas.width / 2;
      const targetCamY = wizard.y - canvas.height / 2;
      state.camera.x += (targetCamX - state.camera.x) * 0.1;
      state.camera.y += (targetCamY - state.camera.y) * 0.1;

      // Limitar cámara a los bordes del mapa
      state.camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, state.camera.x));
      state.camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, state.camera.y));

      // Spawn de creeps
      if (!state.isOver && now - state.lastSpawnTime > 2400 && state.creeps.length < 9) {
        spawnCreep();
        state.lastSpawnTime = now;
      }

      // ACTUALIZAR CREEPS
      state.creeps.forEach((creep) => {
        if (creep.frozenTimer > 0) {
          creep.frozenTimer -= 1;
          return; // Totalmente congelado
        }

        if (creep.burnTimer > 0) {
          creep.burnTimer -= 1;
          if (creep.burnTimer % 25 === 0) {
            creep.hp -= 4;
            state.floatingTexts.push({
              id: `burn-${now}-${Math.random()}`,
              x: creep.x,
              y: creep.y - 15,
              text: `-4`,
              color: '#ea580c',
              life: 25,
            });
            if (creep.hp <= 0) checkCreepDeath(creep);
          }
        }

        if (creep.wetTimer > 0) creep.wetTimer -= 1;

        // Movimiento deliberadamente más lento para no atosigar al jugador
        const dx = wizard.x - creep.x;
        const dy = wizard.y - creep.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          const spd = creep.speed * (creep.wetTimer > 0 ? 0.7 : 1);
          creep.x += (dx / dist) * spd;
          creep.y += (dy / dist) * spd;
        }

        // Ataque al mago
        if (dist < wizard.radius + creep.radius && now - creep.lastAttackTime > 1200) {
          creep.lastAttackTime = now;
          sound.playProcrastinationDamage();
          state.screenShake = 7;

          let dmg = creep.attack;
          setPlayerShield((sh) => {
            if (sh > 0) {
              const absorbed = Math.min(sh, dmg);
              dmg -= absorbed;
              return sh - absorbed;
            }
            return 0;
          });

          if (dmg > 0) {
            setTimeout(() => onPlayerTakeDamage(dmg), 0);
            setCurrentHp((prev) => {
              const next = Math.max(0, prev - dmg);
              if (next <= 0 && !state.isOver) {
                state.isOver = true;
                setGameState('lost');
              }
              return next;
            });
          }
        }
      });

      // ACTUALIZAR PROYECTILES
      for (let pIdx = state.projectiles.length - 1; pIdx >= 0; pIdx--) {
        const p = state.projectiles[pIdx];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;

        if (p.isEarthBoulder) {
          p.boulderRotation = (p.boulderRotation || 0) + 0.15;
          // Polvo del peñasco
          if (Math.random() < 0.4) {
            state.particles.push({
              x: p.x,
              y: p.y + 10,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              radius: 4,
              color: '#a16207',
              life: 15,
              maxLife: 15,
            });
          }
        }

        let hit = false;
        for (let cIdx = state.creeps.length - 1; cIdx >= 0; cIdx--) {
          const creep = state.creeps[cIdx];
          const dist = Math.hypot(creep.x - p.x, creep.y - p.y);

          if (dist < creep.radius + p.radius) {
            hit = true;
            let finalDmg = p.damage;

            // COMBOS:
            if (creep.wetTimer > 0 && p.inflictsShock) {
              finalDmg = Math.floor(finalDmg * 2.5);
              state.floatingTexts.push({
                id: `electro-${now}`,
                x: creep.x,
                y: creep.y - 25,
                text: `⚡ ELECTROCUCIÓN x2.5!`,
                color: '#facc15',
                life: 35,
              });
            }

            if (creep.wetTimer > 0 && p.inflictsFreeze) {
              creep.frozenTimer = 180; // Congelado en cubo de hielo
              state.floatingTexts.push({
                id: `frz-${now}`,
                x: creep.x,
                y: creep.y - 25,
                text: `❄️ CONGELADO!`,
                color: '#38bdf8',
                life: 35,
              });
            }

            if (p.inflictsWet) creep.wetTimer = 200;
            if (p.inflictsBurn) creep.burnTimer = 150; // Comienza a arder
            if (p.inflictsFreeze && creep.wetTimer === 0) creep.frozenTimer = 80;

            creep.hp -= finalDmg;

            // Empuje
            const ang = Math.atan2(p.vy, p.vx);
            creep.x += Math.cos(ang) * p.knockback;
            creep.y += Math.sin(ang) * p.knockback;

            state.floatingTexts.push({
              id: `cdmg-${now}-${cIdx}`,
              x: creep.x,
              y: creep.y - 12,
              text: `-${finalDmg}`,
              color: p.color,
              life: 30,
            });

            if (creep.hp <= 0) {
              checkCreepDeath(creep);
            }

            p.pierce -= 1;
            if (p.pierce <= 0) break;
          }
        }

        if (p.life <= 0 || (hit && p.pierce <= 0)) {
          state.projectiles.splice(pIdx, 1);
        }
      }

      // ACTUALIZAR ONDAS EN ÁREA
      for (let bIdx = state.areaBlasts.length - 1; bIdx >= 0; bIdx--) {
        const b = state.areaBlasts[bIdx];
        b.radius += (b.maxRadius - b.radius) * 0.25;
        b.life -= 1;

        state.creeps.forEach((creep) => {
          const dist = Math.hypot(creep.x - b.x, creep.y - b.y);
          if (dist < b.radius + creep.radius && b.damage > 0) {
            creep.hp -= b.damage;
            const ang = Math.atan2(creep.y - b.y, creep.x - b.x);
            creep.x += Math.cos(ang) * b.knockback;
            creep.y += Math.sin(ang) * b.knockback;
            if (creep.hp <= 0) checkCreepDeath(creep);
          }
        });

        b.damage = 0;
        if (b.life <= 0) state.areaBlasts.splice(bIdx, 1);
      }

      // ACTUALIZAR RAYOS EN CADENA (LIGHTNING FX)
      for (let lIdx = state.lightningChains.length - 1; lIdx >= 0; lIdx--) {
        const l = state.lightningChains[lIdx];
        l.life -= 1;
        if (l.life <= 0) state.lightningChains.splice(lIdx, 1);
      }

      // Textos y partículas
      for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.floatingTexts[i];
        ft.y -= 0.7;
        ft.life -= 1;
        if (ft.life <= 0) state.floatingTexts.splice(i, 1);
      }

      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 1;
        if (pt.life <= 0) state.particles.splice(i, 1);
      }

      // ==========================================
      // RENDERIZADO CON PERSPECTIVA Y CÁMARA MÓVIL
      // ==========================================
      ctx.save();

      if (state.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * state.screenShake, (Math.random() - 0.5) * state.screenShake);
        state.screenShake *= 0.85;
        if (state.screenShake < 0.5) state.screenShake = 0;
      }

      // APLICAR TRANSFORMACIÓN DE CÁMARA
      ctx.translate(-state.camera.x, -state.camera.y);

      // 1. Suelo de baldosas de piedra del mundo completo
      ctx.fillStyle = '#0f1017';
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Baldosas diagonales de la mazmorra
      ctx.strokeStyle = '#181a28';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = -WORLD_HEIGHT; x < WORLD_WIDTH + WORLD_HEIGHT; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + WORLD_HEIGHT * 0.8, WORLD_HEIGHT);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - WORLD_HEIGHT * 0.8, WORLD_HEIGHT);
        ctx.stroke();
      }

      // 2. Muros perimetrales y divisiones de salas (Pasillos de aventura)
      ctx.fillStyle = '#1c1917'; // Ladrillo exterior
      const wall = 30;
      ctx.fillRect(0, 0, WORLD_WIDTH, wall);
      ctx.fillRect(0, WORLD_HEIGHT - wall, WORLD_WIDTH, wall);
      ctx.fillRect(0, 0, wall, WORLD_HEIGHT);
      ctx.fillRect(WORLD_WIDTH - wall, 0, wall, WORLD_HEIGHT);

      // Muro divisorio central con abertura de puerta/pasillo
      // Muro superior e inferior de la sala 1
      ctx.fillRect(380, wall, 25, 230); // pilar superior
      ctx.fillRect(380, 480, 25, WORLD_HEIGHT - wall - 480); // pilar inferior

      // Muro de mortero y ladrillos decorativos
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 3;
      ctx.strokeRect(wall, wall, WORLD_WIDTH - wall * 2, WORLD_HEIGHT - wall * 2);
      ctx.strokeRect(380, wall, 25, 230);
      ctx.strokeRect(380, 480, 25, WORLD_HEIGHT - wall - 480);

      // Pilares de piedra en la sala central (cobertura táctica)
      ctx.fillStyle = '#292524';
      ctx.fillRect(650, 220, 45, 45);
      ctx.fillRect(650, 480, 45, 45);
      ctx.strokeStyle = '#44403c';
      ctx.strokeRect(650, 220, 45, 45);
      ctx.strokeRect(650, 480, 45, 45);

      // Portal rúnico de salida al final del mapa
      ctx.save();
      ctx.translate(WORLD_WIDTH - 65, WORLD_HEIGHT / 2);
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fillStyle = creepsDefeated >= targetCreeps ? 'rgba(34, 197, 94, 0.4)' : 'rgba(168, 85, 247, 0.2)';
      ctx.strokeStyle = creepsDefeated >= targetCreeps ? '#22c55e' : '#a855f7';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(creepsDefeated >= targetCreeps ? '¡ABIERTO!' : 'SELLADO', 0, 4);
      ctx.restore();

      // Antorchas con resplandor cálido en las paredes
      const flicker = Math.sin(now / 150) * 4;
      [
        { x: 120, y: wall },
        { x: 300, y: wall },
        { x: 500, y: wall },
        { x: 800, y: wall },
        { x: 120, y: WORLD_HEIGHT - wall },
        { x: 500, y: WORLD_HEIGHT - wall },
        { x: 800, y: WORLD_HEIGHT - wall },
      ].forEach((torch) => {
        const glow = ctx.createRadialGradient(torch.x, torch.y, 2, torch.x, torch.y, 45 + flicker);
        glow.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
        glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(torch.x - 50, torch.y - 50, 100, 100);

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(torch.x, torch.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Dibujar Ondas en Área
      state.areaBlasts.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 4;
        ctx.fillStyle = b.color + '22';
        ctx.fill();
        ctx.stroke();
      });

      // 4. Dibujar Rayos en Cadena (Chain Lightning Procedural)
      state.lightningChains.forEach((bolt) => {
        bolt.segments.forEach((seg) => {
          drawLightningArc(ctx, seg.x1, seg.y1, seg.x2, seg.y2, bolt.color, true);
        });
      });

      // 5. Dibujar Creeps con Efectos Visuales (Llamas vivas o Cubos de Hielo 3D)
      state.creeps.forEach((creep) => {
        ctx.save();
        ctx.translate(creep.x, creep.y);

        // Sombra
        ctx.beginPath();
        ctx.ellipse(0, creep.radius * 0.8, creep.radius * 0.9, creep.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();

        // Cuerpo base del creep
        ctx.beginPath();
        ctx.arc(0, 0, creep.radius, 0, Math.PI * 2);
        ctx.fillStyle = creep.frozenTimer > 0 ? '#38bdf8' : creep.color;
        ctx.fill();
        ctx.strokeStyle = creep.wetTimer > 0 ? '#0284c7' : '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Ojos
        ctx.fillStyle = '#fecaca';
        ctx.beginPath();
        ctx.arc(-creep.radius * 0.35, -creep.radius * 0.2, 2.5, 0, Math.PI * 2);
        ctx.arc(creep.radius * 0.35, -creep.radius * 0.2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Barra de vida
        const barW = creep.radius * 2;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-barW / 2, -creep.radius - 6, barW, 3.5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-barW / 2, -creep.radius - 6, barW * (creep.hp / creep.maxHp), 3.5);

        ctx.restore();

        // EFECTO VISUAL DE FUEGO VIVO SI ESTÁ ARDIENDO
        if (creep.burnTimer > 0) {
          drawCreepFlames(ctx, creep.x, creep.y, creep.radius, now / 1000);
        }

        // EFECTO VISUAL DE CUBO DE HIELO REAL SI ESTÁ CONGELADO
        if (creep.frozenTimer > 0) {
          drawCreepIceCube(ctx, creep.x, creep.y, creep.radius);
        }
      });

      // 6. Dibujar Proyectiles (Peñasco de Tierra o Proyectil Normal)
      state.projectiles.forEach((p) => {
        if (p.isEarthBoulder) {
          drawEarthBoulder(ctx, p.x, p.y, p.radius, p.boulderRotation || 0);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 7. Dibujar Partículas
      state.particles.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius * (pt.life / pt.maxLife), 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
      });

      // 8. Dibujar Mago Sprite
      drawWizardSprite({
        ctx,
        x: wizard.x,
        y: wizard.y,
        scale: 1.25,
        facingAngle: wizard.facingAngle,
        isMoving: wizard.isMoving,
        castAnimProgress: wizard.castProgress,
        activeElement: 'fire',
        time: now / 1000,
      });

      // 9. Orbes flotantes sobre el Mago
      if (state.elementQueueRef.length > 0) {
        ctx.save();
        ctx.translate(wizard.x, wizard.y - 42);
        const elemIcons: Record<MagickaElement, { char: string; color: string }> = {
          fire: { char: '🔥', color: '#ef4444' },
          water: { char: '💧', color: '#0284c7' },
          lightning: { char: '⚡', color: '#facc15' },
          ice: { char: '❄️', color: '#38bdf8' },
          earth: { char: '🌍', color: '#854d0e' },
          shield: { char: '🛡️', color: '#06b6d4' },
        };

        const totalW = state.elementQueueRef.length * 18;
        state.elementQueueRef.forEach((el, idx) => {
          const itemX = -totalW / 2 + idx * 18 + 9;
          ctx.beginPath();
          ctx.arc(itemX, 0, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = elemIcons[el].color;
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();

          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(elemIcons[el].char, itemX, 0.5);
        });
        ctx.restore();
      }

      // 10. Textos Flotantes
      state.floatingTexts.forEach((ft) => {
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
      });

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [spawnCreep, onPlayerTakeDamage, onVictory, floor, targetCreeps]);

  const elementIcons: Record<MagickaElement, { icon: any; label: string; color: string }> = {
    fire: { icon: Flame, label: 'Fuego', color: 'text-rose-400 bg-rose-950/60 border-rose-600' },
    water: { icon: Droplets, label: 'Agua', color: 'text-sky-400 bg-sky-950/60 border-sky-600' },
    lightning: { icon: Zap, label: 'Rayo', color: 'text-amber-300 bg-amber-950/60 border-amber-500' },
    ice: { icon: Snowflake, label: 'Hielo', color: 'text-cyan-300 bg-cyan-950/60 border-cyan-400' },
    earth: { icon: Mountain, label: 'Tierra', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-600' },
    shield: { icon: Shield, label: 'Escudo', color: 'text-teal-300 bg-teal-950/60 border-teal-500' },
  };

  return (
    <div className="max-w-xl mx-auto px-2 py-2 space-y-2 pb-24 select-none">
      {/* Cabecera de la Mazmorra */}
      <div className="bg-[#121420] border border-stone-800 rounded-2xl p-2.5 flex items-center justify-between shadow-lg">
        <button
          onClick={onExit}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#1a1f33] hover:bg-[#232945] rounded-xl text-xs font-bold text-stone-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Salir</span>
        </button>

        {/* Salud & Escudo */}
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span className="text-xs font-mono font-bold text-rose-300">
            {currentHp}/{player.maxHp}
          </span>
          {playerShield > 0 && (
            <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
              +{playerShield} Escudo
            </span>
          )}
        </div>

        {/* Progreso hacia el Portal de Salida */}
        <div className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-700/40 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>{creepsDefeated}/{targetCreeps} Creeps</span>
        </div>
      </div>

      {/* ÁREA DE JUEGO (CANVAS CON CÁMARA MÓVIL Y JOYSTICK INDEPENDIENTE) */}
      <div
        className="relative w-full aspect-square bg-[#0a0b12] retro-box-stone overflow-hidden touch-none"
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

        {/* JOYSTICK VIRTUAL */}
        {joystickPos && (
          <div
            className="absolute pointer-events-none rounded-full border-2 border-amber-400/50 bg-amber-950/40"
            style={{
              width: 90,
              height: 90,
              left: joystickCenterRef.current.x - 45,
              top: joystickCenterRef.current.y - 45,
            }}
          >
            <div
              className="absolute w-10 h-10 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b] border border-white"
              style={{
                left: 45 - 20 + joystickPos.x,
                top: 45 - 20 + joystickPos.y,
              }}
            />
          </div>
        )}

        {/* Indicador de Mazmorra Continua */}
        <div className="absolute top-2 left-2 text-[10px] text-stone-300 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-stone-700 pointer-events-none">
          🏰 Explora la mazmorra y avanza por los pasillos hacia el portal
        </div>

        {/* OVERLAYS DE VICTORIA O DERROTA */}
        {gameState === 'won' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <Award className="w-16 h-16 text-amber-400 mb-2 animate-bounce" />
            <h3 className="font-black text-xl text-emerald-400">¡PORTAL RÚNICO CRUZADO!</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              Has limpiado los pasillos de la mazmorra con tus combinaciones mágicas.
            </p>
            <div className="flex gap-4 my-4 font-bold text-sm">
              <span className="text-cyan-300">+{floor.enemy.expReward} EXP</span>
              <span className="text-amber-300">+{floor.enemy.goldReward} Oro</span>
            </div>
            <button
              onClick={onExit}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg"
            >
              Avanzar Siguiente Zona
            </button>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <Skull className="w-16 h-16 text-rose-500 mb-2" />
            <h3 className="font-black text-xl text-rose-400">¡EL MAGO HA CAÍDO!</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              Cumple tareas pendientes en tu vida real para sanar a tu héroe y reintentar.
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

      {/* ============================================================== */}
      {/* BOTÓN DINÁMICO DE FUSIÓN (APARECE CUANDO HAY UN COMBO VÁLIDO) */}
      {/* ============================================================== */}
      {availableFusion && (
        <div className="animate-bounce">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              handleTriggerFusion();
            }}
            className="w-full py-2.5 px-4 rounded-2xl font-black text-xs text-white shadow-xl flex items-center justify-between border-2 transition active:scale-95"
            style={{
              backgroundColor: availableFusion.color,
              borderColor: '#ffffff',
              boxShadow: `0 0 20px ${availableFusion.glow}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{availableFusion.icon}</span>
              <span className="tracking-wide">¡FUSIÓN ACTIVA: {availableFusion.name.toUpperCase()}!</span>
            </div>
            <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full border border-white/50">
              Toca para Lanzar
            </span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* PANEL DE MAGIA MODULAR (6 ELEMENTOS Y MODOS DE LANZAMIENTO) */}
      {/* ============================================================== */}
      <div className="bg-[#121420] border-2 border-stone-800 rounded-3xl p-3 shadow-2xl space-y-2">
        {/* Barra de Cola */}
        <div className="flex items-center justify-between bg-[#181a28] px-3 py-1.5 rounded-2xl border border-stone-700">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
              Cola:
            </span>
            <div className="flex items-center gap-1.5 min-h-[26px]">
              {elementQueue.length === 0 ? (
                <span className="text-[11px] text-stone-500 italic">
                  Selecciona elementos para combinar
                </span>
              ) : (
                elementQueue.map((el, i) => {
                  const item = elementIcons[el];
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-xl border text-xs font-bold animate-scale-in ${item.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{item.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {elementQueue.length > 0 && (
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                handleClearElements();
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-800"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* 6 ELEMENTOS */}
        <div className="grid grid-cols-6 gap-1.5">
          {(['fire', 'water', 'lightning', 'ice', 'earth', 'shield'] as MagickaElement[]).map(
            (elem) => {
              const item = elementIcons[elem];
              const Icon = item.icon;

              return (
                <button
                  key={elem}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handleAddElement(elem);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all active:scale-90 shadow-md ${item.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-1">{item.label}</span>
                </button>
              );
            }
          )}
        </div>

        {/* FORMAS DE LANZAR */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-800">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              handleCast('shoot');
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-bold text-xs shadow-lg active:scale-95 transition"
          >
            <Target className="w-4 h-4 text-cyan-300" />
            <span>Disparar</span>
          </button>

          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              handleCast('area');
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white font-bold text-xs shadow-lg active:scale-95 transition"
          >
            <Maximize2 className="w-4 h-4 text-amber-200" />
            <span>Área (Nova)</span>
          </button>

          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              handleCast('self');
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95 transition"
          >
            <UserCheck className="w-4 h-4 text-emerald-200" />
            <span>Yo / Escudo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
