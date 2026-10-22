import {
  GameEnemy,
  Projectile,
  FloatingText,
  CustodianState,
  CustodianStalagmiteTelegraph,
} from './types';
import { elementalSound } from './soundEngine';

/**
 * Entidad del Jefe Final del Nivel 1: El Custodio del Umbral (The Threshold Custodian)
 * Coloso mecano-mágico ancestral con 3 fases dinámicas, rotación de escudos elementales,
 * ataques telegrafiados y renderizado procedural 100% Canvas 2D.
 */

export function createThresholdCustodian(x: number, y: number): GameEnemy {
  const maxHp = 1200;
  const initialShield = 90;

  const custodianState: CustodianState = {
    currentPhase: 1,
    shieldHp: initialShield,
    maxShieldHp: initialShield,
    isShieldBroken: false,
    shieldVulnerableTimer: 0,
    activeAttack: 'none',
    attackTimer: 0,
    nextAttackCooldown: 70,
    leftGauntlet: {
      x: x - 68,
      y: y - 15,
      targetX: x - 68,
      targetY: y - 15,
      angle: 0,
      slamProgress: 0,
    },
    rightGauntlet: {
      x: x + 68,
      y: y - 15,
      targetX: x + 68,
      targetY: y - 15,
      angle: 0,
      slamProgress: 0,
    },
    isDefeated: false,
    defeatTimer: 0,
  };

  return {
    id: `boss-custodian-${Date.now()}`,
    name: 'Custodio del Umbral',
    archetype: 'boss',
    bossType: 'threshold_custodian',
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 52, // ~2.5x escala del jugador
    hp: maxHp,
    maxHp,
    attackPower: 26,
    moveSpeed: 0.45,
    statuses: [],
    color: '#27272a',
    avatar: '🏛️⚡',
    weakness: 'ice',
    resistance: 'fire',
    attackCooldown: 40,
    attackMaxCooldown: 150,
    telegraphTimer: 0,
    telegraphMax: 48,
    isTelegraphing: false,
    hitFlash: 0,
    phase: 1,
    custodianState,
  };
}

/**
 * Actualiza la máquina de estados, transiciones de fase, telegrafiados y ataques del Custodio.
 */
export function updateThresholdCustodian(
  boss: GameEnemy,
  wizard: { x: number; y: number; radius: number },
  projectiles: Projectile[],
  floatingTexts: FloatingText[],
  onPlayerDamage: (amt: number) => void,
  onScreenShake: (amt: number) => void
) {
  const cs = boss.custodianState;
  if (!cs) return;

  // 1. SECUENCIA DE DERROTA
  if (boss.hp <= 0) {
    if (!cs.isDefeated) {
      cs.isDefeated = true;
      cs.defeatTimer = 0;
      cs.activeAttack = 'none';
      cs.fissureTelegraph = undefined;
      cs.stalagmitesTelegraph = undefined;
      cs.novaTelegraph = undefined;
      cs.judgmentTelegraph = undefined;
      elementalSound.playBossIntro();
      onScreenShake(18);

      floatingTexts.push({
        id: `custodian-defeat-${Date.now()}`,
        x: boss.x,
        y: boss.y - 45,
        text: '💥 ¡EL CUSTODIO DEL UMBRAL HA CAÍDO!',
        color: '#facc15',
        fontSize: 16,
        opacity: 1,
        vy: -1.6,
        life: 60,
      });
    }
    cs.defeatTimer++;
    return;
  }

  // 2. TRANSICIONES DINÁMICAS ENTRE FASES
  const hpRatio = boss.hp / boss.maxHp;

  // Transición a FASE 3: Sobrecarga de Vacío / Modo Furia (30% HP o menos)
  if (hpRatio <= 0.3 && cs.currentPhase !== 3) {
    cs.currentPhase = 3;
    boss.phase = 3;
    boss.weakness = 'earth';
    boss.resistance = undefined;
    cs.isShieldBroken = false;
    cs.shieldVulnerableTimer = 0;
    cs.activeAttack = 'none';
    cs.fissureTelegraph = undefined;
    cs.stalagmitesTelegraph = undefined;
    cs.novaTelegraph = undefined;
    cs.judgmentTelegraph = undefined;

    // Onda expansiva de sobrecarga
    onScreenShake(20);
    elementalSound.playThermalShockBlast(true);

    const pdx = wizard.x - boss.x;
    const pdy = wizard.y - boss.y;
    const pdist = Math.max(1, Math.hypot(pdx, pdy));
    wizard.x += (pdx / pdist) * 90;
    wizard.y += (pdy / pdist) * 55;

    floatingTexts.push({
      id: `phase-3-${Date.now()}`,
      x: boss.x,
      y: boss.y - 40,
      text: '⚡ ¡SOBRECARGA DE VACÍO! MODO FURIA (+35% VELOCIDAD)',
      color: '#c084fc',
      fontSize: 15,
      opacity: 1,
      vy: -1.6,
      life: 55,
    });
  }
  // Transición a FASE 2: La Coraza Glacial (65% HP o menos, si aún está en Fase 1)
  else if (hpRatio <= 0.65 && cs.currentPhase === 1) {
    cs.currentPhase = 2;
    boss.phase = 2;
    boss.weakness = 'fire';
    boss.resistance = 'ice';
    cs.shieldHp = 100;
    cs.maxShieldHp = 100;
    cs.isShieldBroken = false;
    cs.shieldVulnerableTimer = 0;
    cs.activeAttack = 'none';
    cs.fissureTelegraph = undefined;
    cs.stalagmitesTelegraph = undefined;
    cs.novaTelegraph = undefined;
    cs.judgmentTelegraph = undefined;

    // Onda de escarcha que empuja al jugador
    onScreenShake(14);
    elementalSound.playGlacialFreezeImpact();

    const pdx = wizard.x - boss.x;
    const pdy = wizard.y - boss.y;
    const pdist = Math.max(1, Math.hypot(pdx, pdy));
    wizard.x += (pdx / pdist) * 80;
    wizard.y += (pdy / pdist) * 45;

    floatingTexts.push({
      id: `phase-2-${Date.now()}`,
      x: boss.x,
      y: boss.y - 40,
      text: '❄️ ¡CORAZA GLACIAL PURA ACTIVADA! (DEBILIDAD: 🔥 FUEGO)',
      color: '#38bdf8',
      fontSize: 15,
      opacity: 1,
      vy: -1.6,
      life: 55,
    });
  }

  // 3. GESTIÓN DEL ESTADO DE VULNERABILIDAD / ATURDIMIENTO (3.0s = 180 frames)
  if (cs.isShieldBroken && cs.shieldVulnerableTimer > 0) {
    cs.shieldVulnerableTimer--;
    boss.stunnedTimer = cs.shieldVulnerableTimer;

    // Descenso de los guanteletes hacia el suelo mientras está noqueado
    cs.leftGauntlet.targetY = boss.y + 40;
    cs.rightGauntlet.targetY = boss.y + 40;
    cs.leftGauntlet.y += (cs.leftGauntlet.targetY - cs.leftGauntlet.y) * 0.12;
    cs.rightGauntlet.y += (cs.rightGauntlet.targetY - cs.rightGauntlet.y) * 0.12;

    if (cs.shieldVulnerableTimer <= 0) {
      cs.isShieldBroken = false;
      boss.stunnedTimer = 0;

      if (cs.currentPhase === 1) {
        cs.shieldHp = cs.maxShieldHp;
        floatingTexts.push({
          id: `shield-regen-1-${Date.now()}`,
          x: boss.x,
          y: boss.y - 35,
          text: '🔥 ¡ESCUDO DE MAGMA REFORMADO!',
          color: '#ea580c',
          fontSize: 13,
          opacity: 1,
          vy: -1.3,
          life: 35,
        });
      } else if (cs.currentPhase === 2) {
        cs.shieldHp = cs.maxShieldHp;
        floatingTexts.push({
          id: `shield-regen-2-${Date.now()}`,
          x: boss.x,
          y: boss.y - 35,
          text: '❄️ ¡CORAZA GLACIAL RECONSTRUIDA!',
          color: '#38bdf8',
          fontSize: 13,
          opacity: 1,
          vy: -1.3,
          life: 35,
        });
      }
    }
    return; // No ejecuta ataques mientras está aturdido
  }

  // Si está aturdido por otros efectos
  if (boss.stunnedTimer && boss.stunnedTimer > 0) {
    boss.stunnedTimer--;
    return;
  }

  // Movimiento sutil de reposicionamiento hacia el jugador
  const dx = wizard.x - boss.x;
  const dy = wizard.y - boss.y;
  const dist = Math.hypot(dx, dy);
  boss.facingAngle = Math.atan2(dy, dx);

  // 4. ANIMACIÓN FLOTANTE DE LOS GUANTELETES
  const now = performance.now();
  const gauntletHoverY = Math.sin(now * 0.005) * 8;
  const gauntletHoverX = Math.cos(now * 0.004) * 5;

  // Si el jugador aún no ha alcanzado la arena (distancia > 850 y jefe intacto):
  // El Custodio permanece levitando majestuosamente en su runa ancestral
  if (dist > 850 && boss.hp === boss.maxHp) {
    cs.activeAttack = 'none';
    cs.leftGauntlet.targetX = boss.x - 70 + gauntletHoverX;
    cs.leftGauntlet.targetY = boss.y - 15 + gauntletHoverY;
    cs.rightGauntlet.targetX = boss.x + 70 - gauntletHoverX;
    cs.rightGauntlet.targetY = boss.y - 15 - gauntletHoverY;
    cs.leftGauntlet.x += (cs.leftGauntlet.targetX - cs.leftGauntlet.x) * 0.15;
    cs.leftGauntlet.y += (cs.leftGauntlet.targetY - cs.leftGauntlet.y) * 0.15;
    cs.rightGauntlet.x += (cs.rightGauntlet.targetX - cs.rightGauntlet.x) * 0.15;
    cs.rightGauntlet.y += (cs.rightGauntlet.targetY - cs.rightGauntlet.y) * 0.15;
    return;
  }

  const speedMult = cs.currentPhase === 3 ? 1.35 : 1.0;
  if (dist > 180 && cs.activeAttack === 'none') {
    boss.x += (dx / dist) * boss.moveSpeed * speedMult;
    boss.y += (dy / dist) * boss.moveSpeed * speedMult * 0.58;
    // Mantener al coloso confinado dentro de los límites de la arena
    boss.x = Math.max(900, Math.min(1500, boss.x));
    boss.y = Math.max(1050, Math.min(1950, boss.y));
  }

  if (cs.activeAttack === 'none') {
    cs.leftGauntlet.targetX = boss.x - 70 + gauntletHoverX;
    cs.leftGauntlet.targetY = boss.y - 15 + gauntletHoverY;
    cs.rightGauntlet.targetX = boss.x + 70 - gauntletHoverX;
    cs.rightGauntlet.targetY = boss.y - 15 - gauntletHoverY;
  }
  cs.leftGauntlet.x += (cs.leftGauntlet.targetX - cs.leftGauntlet.x) * 0.15;
  cs.leftGauntlet.y += (cs.leftGauntlet.targetY - cs.leftGauntlet.y) * 0.15;
  cs.rightGauntlet.x += (cs.rightGauntlet.targetX - cs.rightGauntlet.x) * 0.15;
  cs.rightGauntlet.y += (cs.rightGauntlet.targetY - cs.rightGauntlet.y) * 0.15;

  // 5. MÁQUINA DE ESTADOS DE ATAQUES POR FASE
  if (cs.activeAttack === 'none') {
    cs.nextAttackCooldown--;
    if (cs.nextAttackCooldown <= 0) {
      cs.attackTimer = 0;

      // Selección de ataque según la fase actual
      if (cs.currentPhase === 1) {
        // Alterna entre Barrido de Magma y Fisura Telegrafiada
        cs.activeAttack = Math.random() < 0.5 ? 'magma_sweep' : 'telegraphed_fissure';
        cs.nextAttackCooldown = 110;
      } else if (cs.currentPhase === 2) {
        // Alterna entre Lluvia de Estalagmitas y Nova Gélida
        cs.activeAttack = Math.random() < 0.5 ? 'stalagmite_rain' : 'ice_nova';
        cs.nextAttackCooldown = 105;
      } else {
        // Fase 3: Rotación de ataques de alta velocidad y El Juicio del Guardián
        const roll = Math.random();
        if (roll < 0.35) {
          cs.activeAttack = 'judgment_ultimate';
          cs.nextAttackCooldown = 180;
        } else if (roll < 0.68) {
          cs.activeAttack = 'telegraphed_fissure';
          cs.nextAttackCooldown = 70;
        } else {
          cs.activeAttack = 'magma_sweep';
          cs.nextAttackCooldown = 65;
        }
      }

      // Inicialización del ataque elegido
      initiateAttack(boss, wizard, cs);
    }
  } else {
    // Procesa el ataque activo
    processAttack(boss, wizard, cs, projectiles, floatingTexts, onPlayerDamage, onScreenShake);
  }
}

/**
 * Inicializa los telegrafiados del ataque seleccionado.
 */
function initiateAttack(
  boss: GameEnemy,
  wizard: { x: number; y: number },
  cs: CustodianState
) {
  if (cs.activeAttack === 'telegraphed_fissure') {
    // 800ms = 48 frames de telegrafiado
    const aimAng = Math.atan2(wizard.y - boss.y, wizard.x - boss.x);
    const len = 420;
    cs.fissureTelegraph = {
      x1: boss.x,
      y1: boss.y,
      x2: boss.x + Math.cos(aimAng) * len,
      y2: boss.y + Math.sin(aimAng) * len * 0.58,
      width: 58,
      timer: 0,
      maxTimer: 48,
      hasErupted: false,
    };
  } else if (cs.activeAttack === 'stalagmite_rain') {
    // 700ms = 42 frames de telegrafiado
    const circles: CustodianStalagmiteTelegraph[] = [
      { x: wizard.x, y: wizard.y, radius: 44, timer: 0, maxTimer: 42 },
      { x: wizard.x + 90, y: wizard.y - 45, radius: 40, timer: 0, maxTimer: 42 },
      { x: wizard.x - 85, y: wizard.y + 45, radius: 40, timer: 0, maxTimer: 42 },
      { x: wizard.x + 40, y: wizard.y + 75, radius: 38, timer: 0, maxTimer: 42 },
    ];
    cs.stalagmitesTelegraph = circles;
  } else if (cs.activeAttack === 'ice_nova') {
    // 900ms = 54 frames
    cs.novaTelegraph = {
      x: boss.x,
      y: boss.y,
      currentRadius: 30,
      maxRadius: 195,
      timer: 0,
      maxTimer: 54,
      detonated: false,
    };
  } else if (cs.activeAttack === 'judgment_ultimate') {
    // El jefe se teletransporta al centro y canaliza durante 2.5s (150 frames)
    boss.x = 1200;
    boss.y = 1500;
    cs.leftGauntlet.x = boss.x - 75;
    cs.leftGauntlet.y = boss.y - 45;
    cs.rightGauntlet.x = boss.x + 75;
    cs.rightGauntlet.y = boss.y - 45;

    // 2 Zonas seguras (runas protectoras en el suelo)
    cs.judgmentTelegraph = {
      bossX: boss.x,
      bossY: boss.y,
      timer: 0,
      maxTimer: 150,
      dangerRadius: 850,
      safeZones: [
        { x: boss.x - 220, y: boss.y + 110, radius: 64 },
        { x: boss.x + 220, y: boss.y - 90, radius: 64 },
      ],
      detonated: false,
    };
    elementalSound.playOverloadCoreDeploy(true);
  }
}

/**
 * Ejecuta y concluye los ataques activos del Custodio.
 */
function processAttack(
  boss: GameEnemy,
  wizard: { x: number; y: number; radius: number },
  cs: CustodianState,
  projectiles: Projectile[],
  floatingTexts: FloatingText[],
  onPlayerDamage: (amt: number) => void,
  onScreenShake: (amt: number) => void
) {
  cs.attackTimer++;

  // 1. BARRIDO DE MAGMA
  if (cs.activeAttack === 'magma_sweep') {
    // Animación de azotar los guanteletes hacia adelante
    if (cs.attackTimer === 20) {
      cs.leftGauntlet.targetY = boss.y + 35;
      cs.rightGauntlet.targetY = boss.y + 35;
      elementalSound.playFireShot();
      onScreenShake(6);

      // Dispara 3 proyectiles de fuego en abanico
      const baseAngle = Math.atan2(wizard.y - boss.y, wizard.x - boss.x);
      const angles = [baseAngle - 0.28, baseAngle, baseAngle + 0.28];

      angles.forEach((ang, idx) => {
        projectiles.push({
          id: `custodian-magma-${Date.now()}-${idx}`,
          x: boss.x + Math.cos(ang) * 45,
          y: boss.y + Math.sin(ang) * 45 * 0.58,
          vx: Math.cos(ang) * 5.2,
          vy: Math.sin(ang) * 5.2,
          radius: 12,
          color: '#ea580c',
          secondaryColor: '#ffedd5',
          damage: 18,
          knockback: 3.5,
          life: 140,
          maxLife: 140,
          pierce: 1,
          piercedIds: [],
          isHostile: true,
          spellType: 'fire_shot',
          visualShape: 'fire_comet',
          element: 'fire',
        });
      });
    }

    if (cs.attackTimer >= 40) {
      cs.activeAttack = 'none';
    }
  }

  // 2. FISURA TELEGRAFIADA (800ms)
  else if (cs.activeAttack === 'telegraphed_fissure' && cs.fissureTelegraph) {
    const ft = cs.fissureTelegraph;
    ft.timer++;

    if (ft.timer >= ft.maxTimer && !ft.hasErupted) {
      ft.hasErupted = true;
      elementalSound.playMagmaEruption();
      onScreenShake(12);

      // Comprobar si el jugador está dentro de la línea de fisura
      const isHit = checkLineCollision(wizard.x, wizard.y, wizard.radius, ft.x1, ft.y1, ft.x2, ft.y2, ft.width);
      if (isHit) {
        onPlayerDamage(24);
        floatingTexts.push({
          id: `fissure-dmg-${Date.now()}`,
          x: wizard.x,
          y: wizard.y - 20,
          text: '🔥 ¡FISURA DE MAGMA! -24 HP',
          color: '#f97316',
          fontSize: 14,
          opacity: 1,
          vy: -1.5,
          life: 38,
        });
      }
    }

    if (ft.timer >= ft.maxTimer + 25) {
      cs.fissureTelegraph = undefined;
      cs.activeAttack = 'none';
    }
  }

  // 3. LLUVIA DE ESTALAGMITAS (700ms)
  else if (cs.activeAttack === 'stalagmite_rain' && cs.stalagmitesTelegraph) {
    let allFinished = true;
    cs.stalagmitesTelegraph.forEach((st) => {
      st.timer++;
      if (st.timer >= st.maxTimer && !st.detonated) {
        st.detonated = true;
        elementalSound.playGlacialShatter();
        onScreenShake(6);

        const d = Math.hypot(wizard.x - st.x, (wizard.y - st.y) / 0.58);
        if (d <= st.radius + wizard.radius) {
          onPlayerDamage(22);
          floatingTexts.push({
            id: `stalagmite-dmg-${Date.now()}`,
            x: wizard.x,
            y: wizard.y - 20,
            text: '❄️ ¡IMPACTO DE ESTALAGMITA! -22 HP',
            color: '#38bdf8',
            fontSize: 14,
            opacity: 1,
            vy: -1.5,
            life: 38,
          });
        }
      }
      if (st.timer < st.maxTimer + 20) {
        allFinished = false;
      }
    });

    if (allFinished) {
      cs.stalagmitesTelegraph = undefined;
      cs.activeAttack = 'none';
    }
  }

  // 4. NOVA GÉLIDA (900ms)
  else if (cs.activeAttack === 'ice_nova' && cs.novaTelegraph) {
    const nt = cs.novaTelegraph;
    nt.timer++;
    nt.currentRadius = (nt.timer / nt.maxTimer) * nt.maxRadius;

    if (nt.timer >= nt.maxTimer && !nt.detonated) {
      nt.detonated = true;
      elementalSound.playGlacialFreezeImpact();
      onScreenShake(14);

      const d = Math.hypot(wizard.x - nt.x, (wizard.y - nt.y) / 0.58);
      if (d <= nt.maxRadius + wizard.radius) {
        onPlayerDamage(28);
        const pdx = wizard.x - nt.x;
        const pdy = wizard.y - nt.y;
        const pdist = Math.max(1, Math.hypot(pdx, pdy));
        wizard.x += (pdx / pdist) * 65;
        wizard.y += (pdy / pdist) * 35;

        floatingTexts.push({
          id: `nova-dmg-${Date.now()}`,
          x: wizard.x,
          y: wizard.y - 20,
          text: '❄️ ¡NOVA GÉLIDA! -28 HP',
          color: '#00e5ff',
          fontSize: 15,
          opacity: 1,
          vy: -1.6,
          life: 40,
        });
      }
    }

    if (nt.timer >= nt.maxTimer + 20) {
      cs.novaTelegraph = undefined;
      cs.activeAttack = 'none';
    }
  }

  // 5. EL JUICIO DEL GUARDIÁN (ULTIMATE - 2.5s = 150 frames)
  else if (cs.activeAttack === 'judgment_ultimate' && cs.judgmentTelegraph) {
    const jt = cs.judgmentTelegraph;
    jt.timer++;

    // Pulso de alarma durante la canalización
    if (jt.timer % 30 === 0) {
      elementalSound.playOverloadCorePulse(2);
      onScreenShake(4);
    }

    if (jt.timer >= jt.maxTimer && !jt.detonated) {
      jt.detonated = true;
      elementalSound.playCataclysmPhase4Lightning(true);
      onScreenShake(24);

      // Comprobar si el jugador está protegido dentro de alguna de las 2 zonas seguras
      const isSafe = jt.safeZones.some((zone) => {
        const d = Math.hypot(wizard.x - zone.x, (wizard.y - zone.y) / 0.58);
        return d <= zone.radius;
      });

      if (isSafe) {
        floatingTexts.push({
          id: `safe-zone-${Date.now()}`,
          x: wizard.x,
          y: wizard.y - 25,
          text: '🛡️ ¡ZONA SEGURA PROTEGIDA! [0 DAÑO]',
          color: '#4ade80',
          fontSize: 15,
          opacity: 1,
          vy: -1.6,
          life: 45,
        });
      } else {
        onPlayerDamage(45);
        floatingTexts.push({
          id: `judgment-dmg-${Date.now()}`,
          x: wizard.x,
          y: wizard.y - 25,
          text: '💥⚡ ¡EL JUICIO DEL GUARDIÁN! -45 HP',
          color: '#ef4444',
          fontSize: 16,
          opacity: 1,
          vy: -1.8,
          life: 45,
        });
      }
    }

    if (jt.timer >= jt.maxTimer + 30) {
      cs.judgmentTelegraph = undefined;
      cs.activeAttack = 'none';
    }
  }
}

/**
 * Comprueba colisión circular con un segmento de línea ancha (para la fisura telegrafiada).
 */
function checkLineCollision(
  px: number,
  py: number,
  pr: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lineWidth: number
): boolean {
  const ldx = x2 - x1;
  const ldy = y2 - y1;
  const lenSq = ldx * ldx + ldy * ldy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1) <= pr + lineWidth / 2;

  let t = ((px - x1) * ldx + (py - y1) * ldy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * ldx;
  const projY = y1 + t * ldy;
  const dist = Math.hypot(px - projX, (py - projY) / 0.58);

  return dist <= pr + lineWidth / 2;
}
