import { ElementType, GameEnemy, FloatingText } from './types';
import { audioManager } from '../../services/AudioManager';

export interface DamageResult {
  finalDamage: number;
  multiplier: number;
  isCritical: boolean;
  isImmune: boolean;
  isAbsorbed: boolean;
  isBlocked: boolean;
  floatingText: string;
  textColor: string;
  specialReaction?: 'cooled_down' | 'frenzy' | 'grounded' | 'shield_broken';
}

/**
 * Matriz de Afinidad y Vulnerabilidad Elemental del Bestiario:
 *
 * | Enemigo               | Fuego (🔥)           | Hielo (❄️)                       | Rayo (⚡)   | Tierra (🌍)                        |
 * | Gólem de Escoria     | 0x (Inmune/Cura)     | 2.5x (Vulnerabilidad Crítica)   | 0.5x        | 1.0x (2.0x Crítico si enfriado)    |
 * | Espectro de Tormenta | 1.0x                 | 1.0x                            | 0x (Inmune) | 2.0x (Derribo/Grounding 1.5s stun) |
 * | Acechador de Escarcha| 2.5x (Derrite coraza)| 0x (Inmune)                     | 1.0x        | 1.0x (80% reducción si frontal)    |
 */
export function calculateElementalDamage(
  enemy: GameEnemy,
  rawDamage: number,
  elementType: ElementType | 'physical',
  attackSourceX?: number,
  attackSourceY?: number
): DamageResult {
  let multiplier = 1.0;
  let isCritical = false;
  let isBlocked = false;
  let specialReaction: 'cooled_down' | 'frenzy' | 'grounded' | 'shield_broken' | undefined;

  // 1. GÓLEM DE ESCORIA ÍGNEA (PYRE GOLEM)
  if (enemy.bestiaryType === 'pyre_golem') {
    if (elementType === 'fire') {
      // 0x (Inmune / Cura) + entra en Frenesí (aumento de velocidad)
      enemy.frenzyTimer = 180; // 3 segundos de frenesí
      // Curar 30% del daño recibido
      const healAmount = Math.max(1, Math.round(rawDamage * 0.3));
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
      return {
        finalDamage: 0,
        multiplier: 0,
        isCritical: false,
        isImmune: true,
        isAbsorbed: true,
        isBlocked: false,
        floatingText: `🔥 ¡ABSORBE Y FRENESÍ! (+${healAmount})`,
        textColor: '#ff6d00',
        specialReaction: 'frenzy',
      };
    } else if (elementType === 'ice') {
      // 2.5x Vulnerabilidad Crítica + Enfriamiento de Magma (3s)
      multiplier = 2.5;
      isCritical = true;
      enemy.cooledDownTimer = 180; // 3 segundos enfriado
      specialReaction = 'cooled_down';
    } else if (elementType === 'lightning') {
      // 0.5x Resistencia
      multiplier = 0.5;
    } else if (elementType === 'earth') {
      // 1.0x normalmente, o 2.0x si está enfriado por Hielo
      if (enemy.cooledDownTimer && enemy.cooledDownTimer > 0) {
        multiplier = 2.0;
        isCritical = true;
        specialReaction = 'cooled_down';
      } else {
        multiplier = 1.0;
      }
    }
  }

  // 2. ESPECTRO DE TORMENTA (STORM STALKER)
  else if (enemy.bestiaryType === 'storm_stalker') {
    if (elementType === 'lightning') {
      // 0x (Inmune)
      return {
        finalDamage: 0,
        multiplier: 0,
        isCritical: false,
        isImmune: true,
        isAbsorbed: false,
        isBlocked: false,
        floatingText: '⚡ ¡INMUNE A RAYO!',
        textColor: '#94a3b8',
      };
    } else if (elementType === 'earth') {
      // 2.0x (Derribo / Grounding) + aturdido 1.5s
      multiplier = 2.0;
      isCritical = true;
      enemy.stunnedTimer = 90; // 1.5s a 60 FPS
      specialReaction = 'grounded';
    } else {
      // Fuego e Hielo daño normal 1.0x
      multiplier = 1.0;
    }
  }

  // 3. ACECHADOR DE ESCARCHA (FROST LURKER)
  else if (enemy.bestiaryType === 'frost_lurker') {
    if (elementType === 'ice') {
      // 0x (Inmune)
      return {
        finalDamage: 0,
        multiplier: 0,
        isCritical: false,
        isImmune: true,
        isAbsorbed: false,
        isBlocked: false,
        floatingText: '❄️ ¡INMUNE A HIELO!',
        textColor: '#94a3b8',
      };
    } else if (elementType === 'fire') {
      // 2.5x (Derrite coraza)
      multiplier = 2.5;
      isCritical = true;
      enemy.shieldBrokenTimer = 240; // 4s coraza derretida
      specialReaction = 'shield_broken';
    } else {
      // Rayo, Tierra o físico: comprobar coraza frontal
      const isShieldIntact = !enemy.shieldBrokenTimer || enemy.shieldBrokenTimer <= 0;
      if (isShieldIntact && attackSourceX !== undefined && attackSourceY !== undefined) {
        // Calcular ángulo del atacante respecto a la orientación del enemigo
        const attackAngle = Math.atan2(attackSourceY - enemy.y, attackSourceX - enemy.x);
        const enemyFacing = enemy.facingAngle || 0;
        let angleDiff = Math.abs(attackAngle - enemyFacing);
        while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

        // Si el ataque viene del sector frontal (+/- 90 grados respecto a facingAngle)
        if (angleDiff < Math.PI * 0.55) {
          multiplier = 0.2; // Reducción del 80%
          isBlocked = true;
        } else {
          multiplier = 1.0;
        }
      } else {
        multiplier = 1.0;
      }
    }
  }

  // 4. EL CUSTODIO DEL UMBRAL (THRESHOLD CUSTODIAN)
  else if (enemy.bossType === 'threshold_custodian' && enemy.custodianState) {
    const cs = enemy.custodianState;
    const isVulnerable = cs.isShieldBroken && cs.shieldVulnerableTimer > 0;

    if (isVulnerable) {
      // Estado de vulnerabilidad activa: daño crítico x2.0 en cualquier ataque
      multiplier = 2.0;
      isCritical = true;
    } else if (cs.currentPhase === 1) {
      // FASE 1: ESCUDO DE MAGMA
      if (elementType === 'fire' || elementType === 'earth') {
        return {
          finalDamage: 0,
          multiplier: 0,
          isCritical: false,
          isImmune: true,
          isAbsorbed: false,
          isBlocked: false,
          floatingText: '🛡️🔥 ¡ESCUDO DE MAGMA INMUNE!',
          textColor: '#f97316',
        };
      } else if (elementType === 'ice') {
        multiplier = 1.5;
        cs.shieldHp = Math.max(0, cs.shieldHp - rawDamage * 1.5);
        if (cs.shieldHp <= 0) {
          cs.isShieldBroken = true;
          cs.shieldVulnerableTimer = 180; // 3.0s aturdido
          enemy.stunnedTimer = 180;
          return {
            finalDamage: Math.round(rawDamage * 1.5),
            multiplier: 1.5,
            isCritical: true,
            isImmune: false,
            isAbsorbed: false,
            isBlocked: false,
            floatingText: '💥❄️ ¡ESCUDO DE MAGMA QUEBRADO! ¡VULNERABLE!',
            textColor: '#00e5ff',
            specialReaction: 'shield_broken',
          };
        }
      } else {
        multiplier = 0.7;
      }
    } else if (cs.currentPhase === 2) {
      // FASE 2: LA CORAZA GLACIAL
      if (elementType === 'ice' || elementType === 'lightning') {
        return {
          finalDamage: 0,
          multiplier: 0,
          isCritical: false,
          isImmune: true,
          isAbsorbed: false,
          isBlocked: false,
          floatingText: '🛡️❄️ ¡CORAZA GLACIAL INMUNE!',
          textColor: '#38bdf8',
        };
      } else if (elementType === 'fire') {
        multiplier = 1.5;
        cs.shieldHp = Math.max(0, cs.shieldHp - rawDamage * 1.5);
        if (cs.shieldHp <= 0) {
          cs.isShieldBroken = true;
          cs.shieldVulnerableTimer = 180; // 3.0s noqueado
          enemy.stunnedTimer = 180;
          return {
            finalDamage: Math.round(rawDamage * 1.5),
            multiplier: 1.5,
            isCritical: true,
            isImmune: false,
            isAbsorbed: false,
            isBlocked: false,
            floatingText: '🔥💥 ¡CORAZA GLACIAL DERRETIDA! ¡VULNERABLE!',
            textColor: '#f59e0b',
            specialReaction: 'shield_broken',
          };
        }
      } else {
        multiplier = 0.7;
      }
    } else if (cs.currentPhase === 3) {
      // FASE 3: SOBRECARGA DE VACÍO / MODO FURIA
      if (elementType === 'earth') {
        multiplier = 1.8;
        isCritical = true;
        // Si el jefe está canalizando El Juicio del Guardián, un golpe de Tierra lo interrumpe
        if (cs.activeAttack === 'judgment_ultimate' && cs.judgmentTelegraph) {
          cs.activeAttack = 'none';
          cs.judgmentTelegraph = undefined;
          enemy.stunnedTimer = 120; // 2.0s de aturdimiento por interrupción
          return {
            finalDamage: Math.round(rawDamage * 1.8),
            multiplier: 1.8,
            isCritical: true,
            isImmune: false,
            isAbsorbed: false,
            isBlocked: false,
            floatingText: '🌍⚡ ¡JUICIO INTERRUMPIDO! ¡ATURDIDO!',
            textColor: '#facc15',
            specialReaction: 'grounded',
          };
        }
      } else {
        multiplier = 1.2;
      }
    }
  }

  // JEFES (Resistencias y debilidades elementales existentes)
  else if (enemy.archetype === 'boss') {
    if (enemy.weakness && enemy.weakness === elementType) {
      multiplier = 1.5;
      isCritical = true;
    } else if (enemy.resistance && enemy.resistance === elementType) {
      multiplier = 0.5;
    }
  }

  // Modificador por Armadura Fracturada (Deflagración Térmica: +30% de daño recibido)
  if (enemy.fracturedArmorTimer && enemy.fracturedArmorTimer > 0) {
    multiplier *= 1.30;
  }

  const finalDamage = Math.max(1, Math.round(rawDamage * multiplier));
  let floatingText = `-${finalDamage}`;
  let textColor = '#ffffff';

  if (isCritical) {
    if (enemy.bestiaryType === 'pyre_golem' && specialReaction === 'cooled_down' && elementType === 'earth') {
      floatingText = `🌍💥 -${finalDamage} [¡CRÍTICO CONTUNDENTE!]`;
      textColor = '#fbbf24';
    } else if (enemy.bestiaryType === 'storm_stalker' && specialReaction === 'grounded') {
      floatingText = `🌍⚡ -${finalDamage} [¡DERRIBO A TIERRA! x2.0]`;
      textColor = '#facc15';
    } else if (enemy.bestiaryType === 'frost_lurker' && specialReaction === 'shield_broken') {
      floatingText = `🔥💥 -${finalDamage} [¡CORAZA DERRETIDA! x2.5]`;
      textColor = '#f59e0b';
    } else {
      floatingText = `💥 -${finalDamage} [¡CRÍTICO!]`;
      textColor = '#ffd54f';
    }
  } else if (isBlocked) {
    floatingText = `🛡️ -${finalDamage} [¡BLOQUEO FRONTAL -80%!]`;
    textColor = '#38bdf8';
  } else if (multiplier < 1.0) {
    textColor = '#94a3b8'; // Reducido / Resistido
  }

  return {
    finalDamage,
    multiplier,
    isCritical,
    isImmune: false,
    isAbsorbed: false,
    isBlocked,
    floatingText,
    textColor,
    specialReaction,
  };
}

/**
 * Resuelve el elemento asociado a un tipo de hechizo, considerando debilidades si se evalúa contra un enemigo del Bestiario.
 */
export function getSpellElement(spellType: string, enemy?: GameEnemy): ElementType | 'physical' {
  if (!spellType) return 'physical';

  // Si se evalúa contra el Custodio del Umbral, resolver con el contra-elemento de la fase activa
  if (enemy?.bossType === 'threshold_custodian') {
    const phase = enemy.custodianState?.currentPhase || 1;
    if (phase === 1) {
      if (
        spellType.includes('ice') ||
        spellType.includes('cryo') ||
        spellType === 'devastating_glacier' ||
        spellType === 'thermal_shock' ||
        spellType === 'glacial_plasma_storm'
      ) {
        return 'ice';
      }
    } else if (phase === 2) {
      if (
        spellType.includes('fire') ||
        spellType.includes('inferno') ||
        spellType === 'hell_rain' ||
        spellType === 'thermal_shock' ||
        spellType === 'magma_eruption'
      ) {
        return 'fire';
      }
    } else if (phase === 3) {
      if (
        spellType.includes('earth') ||
        spellType.includes('tectonic') ||
        spellType === 'telluric_barrier' ||
        spellType === 'magma_eruption' ||
        spellType === 'obsidian_volcano'
      ) {
        return 'earth';
      }
    }
  }

  // Si se evalúa contra un enemigo del Bestiario, hechizos combinados pueden activar la afinidad prioritaria
  if (enemy?.bestiaryType) {
    if (enemy.bestiaryType === 'pyre_golem') {
      if (
        spellType.includes('ice') ||
        spellType.includes('cryo') ||
        spellType === 'devastating_glacier' ||
        spellType === 'thermal_shock' ||
        spellType === 'glacial_plasma_storm' ||
        spellType === 'conductive_prison'
      ) {
        return 'ice';
      }
      if (
        spellType.includes('earth') ||
        spellType.includes('tectonic') ||
        spellType === 'telluric_barrier' ||
        spellType === 'magma_eruption' ||
        spellType === 'obsidian_volcano'
      ) {
        return 'earth';
      }
      if (spellType.includes('fire') || spellType.includes('inferno') || spellType === 'hell_rain') {
        return 'fire';
      }
    } else if (enemy.bestiaryType === 'storm_stalker') {
      if (
        spellType.includes('earth') ||
        spellType.includes('tectonic') ||
        spellType === 'telluric_barrier' ||
        spellType === 'magma_eruption' ||
        spellType === 'obsidian_volcano' ||
        spellType === 'conductive_prison' ||
        spellType === 'overload_core' ||
        spellType === 'crystal_field'
      ) {
        return 'earth';
      }
      if (
        spellType.includes('lightning') ||
        spellType.includes('voltaic') ||
        spellType === 'celestial_storm' ||
        spellType === 'basic_spark'
      ) {
        return 'lightning';
      }
    } else if (enemy.bestiaryType === 'frost_lurker') {
      if (
        spellType.includes('fire') ||
        spellType.includes('inferno') ||
        spellType === 'hell_rain' ||
        spellType === 'thermal_shock' ||
        spellType === 'magma_eruption' ||
        spellType === 'explosive_overload' ||
        spellType === 'obsidian_volcano' ||
        spellType === 'glacial_plasma_storm'
      ) {
        return 'fire';
      }
      if (spellType.includes('ice') || spellType.includes('cryo') || spellType === 'devastating_glacier') {
        return 'ice';
      }
    }
  }

  // Hechizos puros / directos
  if (spellType.includes('fire') || spellType.includes('inferno') || spellType === 'hell_rain') return 'fire';
  if (spellType.includes('ice') || spellType.includes('cryo') || spellType === 'devastating_glacier') return 'ice';
  if (
    spellType.includes('lightning') ||
    spellType.includes('voltaic') ||
    spellType === 'celestial_storm' ||
    spellType === 'basic_spark'
  )
    return 'lightning';
  if (spellType.includes('earth') || spellType.includes('tectonic') || spellType === 'telluric_barrier')
    return 'earth';

  if (
    spellType === 'thermal_shock' ||
    spellType === 'magma_eruption' ||
    spellType === 'explosive_overload' ||
    spellType === 'magma_trench' ||
    spellType === 'thermal_deflagration' ||
    spellType === 'solar_fusion_beam'
  )
    return 'fire';
  if (spellType === 'crystal_field') return 'lightning';
  if (spellType === 'permafrost_prison') return 'ice';
  if (spellType === 'obsidian_volcano') return 'earth';
  if (spellType === 'conductive_prison') return 'lightning';
  if (spellType === 'overload_core') return 'lightning';
  if (spellType === 'glacial_plasma_storm') return 'ice';
  if (spellType === 'elemental_cataclysm') return 'fire';

  return 'physical';
}

/**
 * Aplica daño elemental a un enemigo gestionando afinidades, mitigación,
 * reacciones especiales y generación de texto flotante.
 */
export function applyDamageToEnemy(
  enemy: GameEnemy,
  rawDamage: number,
  elementType: ElementType | 'physical',
  floatingTexts: FloatingText[],
  attackSourceX?: number,
  attackSourceY?: number
): DamageResult {
  const res = calculateElementalDamage(enemy, rawDamage, elementType, attackSourceX, attackSourceY);

  if (res.specialReaction === 'shield_broken') {
    audioManager.playBossShieldBreak();
  }

  if (res.isImmune || res.isAbsorbed) {
    enemy.hitFlash = 4;
  } else {
    enemy.hp = Math.max(0, enemy.hp - res.finalDamage);
    enemy.hitFlash = res.isCritical ? 10 : 6;
  }

  floatingTexts.push({
    id: `el-dmg-${Date.now()}-${Math.random()}`,
    x: enemy.x,
    y: enemy.y - 18,
    text: res.floatingText,
    color: res.textColor,
    fontSize: res.isCritical ? 14 : 12,
    opacity: 1,
    vy: -1.3,
    life: 36,
  });

  return res;
}
