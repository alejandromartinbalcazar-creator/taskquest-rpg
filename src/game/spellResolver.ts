import { MagickaElement, CastMode, SpellOutcome } from './magickaTypes';

export function resolveSpell(elements: MagickaElement[], mode: CastMode): SpellOutcome {
  // Si no hay elementos, lanzamiento básico
  if (elements.length === 0) {
    if (mode === 'shoot') {
      return {
        name: 'Chispa Débil',
        description: 'Un pequeño destello mágico sin afinidad.',
        castMode: 'shoot',
        damage: 15,
        heal: 0,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 6,
        color: '#94a3b8',
        projectileSpeed: 7,
        pierce: 1,
        duration: 40,
        knockback: 2,
      };
    } else if (mode === 'area') {
      return {
        name: 'Onda Arcana Menor',
        description: 'Empuja ligeramente a los enemigos cercanos.',
        castMode: 'area',
        damage: 10,
        heal: 0,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 40,
        color: '#94a3b8',
        projectileSpeed: 0,
        pierce: 99,
        duration: 15,
        knockback: 6,
      };
    } else {
      return {
        name: 'Meditación Breve',
        description: 'Regenera una pizca de energía vital.',
        castMode: 'self',
        damage: 0,
        heal: 8,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 20,
        color: '#38bdf8',
        projectileSpeed: 0,
        pierce: 0,
        duration: 20,
        knockback: 0,
      };
    }
  }

  // Contar cuántas instancias de cada elemento hay en la cola
  const has = (elem: MagickaElement) => elements.includes(elem);
  const count = (elem: MagickaElement) => elements.filter((e) => e === elem).length;

  const hasFire = has('fire');
  const hasWater = has('water');
  const hasLightning = has('lightning');
  const hasIce = has('ice');
  const hasEarth = has('earth');
  const hasShield = has('shield');

  // ==========================================
  // MODO 1: AUTO-LANZAMIENTO / SELF-CAST
  // ==========================================
  if (mode === 'self') {
    if (hasShield) {
      if (hasFire) {
        return {
          name: 'Armadura Ígnea',
          description: 'Crea un escudo de llamas que quema a quien te toque.',
          castMode: 'self',
          damage: 0,
          heal: 0,
          shieldAmount: 25,
          speedBoost: 0,
          radius: 25,
          color: '#f97316',
          projectileSpeed: 0,
          pierce: 0,
          duration: 30,
          knockback: 0,
          inflictsBurn: true,
        };
      }
      if (hasEarth) {
        return {
          name: 'Piel de Granito',
          description: 'Otorga una barrera telúrica que absorbe daño masivo.',
          castMode: 'self',
          damage: 0,
          heal: 0,
          shieldAmount: 45,
          speedBoost: -0.5,
          radius: 28,
          color: '#84cc16',
          projectileSpeed: 0,
          pierce: 0,
          duration: 30,
          knockback: 0,
        };
      }
      if (hasLightning) {
        return {
          name: 'Sobrecarga de Velocidad',
          description: 'La estática impulsa tus piernas aumentando tu velocidad.',
          castMode: 'self',
          damage: 0,
          heal: 0,
          shieldAmount: 15,
          speedBoost: 2.5,
          radius: 20,
          color: '#facc15',
          projectileSpeed: 0,
          pierce: 0,
          duration: 40,
          knockback: 0,
        };
      }
      return {
        name: 'Barrera Mágica',
        description: 'Crea una cúpula protectora y restaura vitalidad.',
        castMode: 'self',
        damage: 0,
        heal: 20 + count('shield') * 10,
        shieldAmount: 30,
        speedBoost: 0,
        radius: 25,
        color: '#22d3ee',
        projectileSpeed: 0,
        pierce: 0,
        duration: 30,
        knockback: 0,
      };
    }

    if (hasWater) {
      return {
        name: 'Purificación de Manantial',
        description: 'Lava quemaduras y restaura vida.',
        castMode: 'self',
        damage: 0,
        heal: 22,
        shieldAmount: 5,
        speedBoost: 0,
        radius: 20,
        color: '#0284c7',
        projectileSpeed: 0,
        pierce: 0,
        duration: 25,
        knockback: 0,
      };
    }

    // Default self cast
    return {
      name: 'Infusión Elemental',
      description: 'Armonizas tu túnica con los elementos invocados.',
      castMode: 'self',
      damage: 0,
      heal: 15,
      shieldAmount: 15,
      speedBoost: 0,
      radius: 20,
      color: '#a855f7',
      projectileSpeed: 0,
      pierce: 0,
      duration: 20,
      knockback: 0,
    };
  }

  // ==========================================
  // MODO 2: ÁREA / NOVA DETONATION
  // ==========================================
  if (mode === 'area') {
    if (hasShield) {
      return {
        name: 'Cúpula de Repulsión',
        description: 'Detona una onda cinética que repele a todos los creeps lejos.',
        castMode: 'area',
        damage: 20,
        heal: 0,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 75,
        color: '#38bdf8',
        projectileSpeed: 0,
        pierce: 99,
        duration: 20,
        knockback: 18, // Knockback brutal
      };
    }

    if (hasFire && hasLightning) {
      return {
        name: 'Cataclismo de Plasma',
        description: 'Explosión masiva de plasma en 360 grados.',
        castMode: 'area',
        damage: 65,
        heal: 0,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 80,
        color: '#c084fc',
        projectileSpeed: 0,
        pierce: 99,
        duration: 25,
        knockback: 12,
        inflictsBurn: true,
        inflictsShock: true,
      };
    }

    if (hasFire && hasEarth) {
      return {
        name: 'Erupción Volcánica',
        description: 'Fisuras de magma y roca fundida emergen del suelo.',
        castMode: 'area',
        damage: 55,
        heal: 0,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 70,
        color: '#ea580c',
        projectileSpeed: 0,
        pierce: 99,
        duration: 25,
        knockback: 8,
        inflictsBurn: true,
      };
    }

    if (hasWater && hasLightning) {
      return {
        name: 'Tormenta de Charco Eléctrico',
        description: 'Moja a todos los enemigos y desata un arco eléctrico continuo.',
        castMode: 'area',
        damage: 50,
        heal: 0,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 75,
        color: '#eab308',
        projectileSpeed: 0,
        pierce: 99,
        duration: 25,
        knockback: 5,
        inflictsWet: true,
        inflictsShock: true,
      };
    }

    if (hasWater && hasIce) {
      return {
        name: 'Anillo de Congelación Profunda',
        description: 'Empapa y congela instantáneamente a los monstruos cercanos.',
        castMode: 'area',
        damage: 40,
        heal: 0,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 65,
        color: '#06b6d4',
        projectileSpeed: 0,
        pierce: 99,
        duration: 25,
        knockback: 4,
        inflictsFreeze: true,
      };
    }

    if (hasFire) {
      return {
        name: 'Nova Ígnea',
        description: 'Anillo de fuego expansivo que incinera a los enemigos.',
        castMode: 'area',
        damage: 38 + count('fire') * 10,
        heal: 0,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 60,
        color: '#ef4444',
        projectileSpeed: 0,
        pierce: 99,
        duration: 20,
        knockback: 7,
        inflictsBurn: true,
      };
    }

    if (hasIce) {
      return {
        name: 'Estallido Glacial',
        description: 'Onda de escarcha helada que congela y ralentiza.',
        castMode: 'area',
        damage: 35,
        heal: 0,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 55,
        color: '#38bdf8',
        projectileSpeed: 0,
        pierce: 99,
        duration: 20,
        knockback: 4,
        inflictsFreeze: true,
      };
    }

    if (hasEarth) {
      return {
        name: 'Terremoto Telúrico',
        description: 'Fractura el suelo con rocas que aturden en área.',
        castMode: 'area',
        damage: 42,
        heal: 0,
        shieldAmount: 0,
        speedBoost: 0,
        radius: 65,
        color: '#a16207',
        projectileSpeed: 0,
        pierce: 99,
        duration: 20,
        knockback: 12,
      };
    }

    // Default Area
    return {
      name: 'Onda Arcana Elemental',
      description: 'Expansión de magia elemental en todas direcciones.',
      castMode: 'area',
      damage: 35,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 55,
      color: '#6366f1',
      projectileSpeed: 0,
      pierce: 99,
      duration: 20,
      knockback: 8,
    };
  }

  // ==========================================
  // MODO 3: PROYECTIL / SHOOT CAST
  // ==========================================
  // Sinergias Avanzadas de Proyectil:

  // FUEGO + RAYO: PLASMA BEAM
  if (hasFire && hasLightning) {
    return {
      name: 'Haz de Plasma',
      description: 'Rayo incandescente ultra veloz que perfora todos los enemigos.',
      castMode: 'shoot',
      damage: 55 + count('fire') * 10,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 9,
      color: '#c084fc',
      secondaryColor: '#facc15',
      projectileSpeed: 10,
      pierce: 4, // Perfora hasta 4 creeps
      duration: 45,
      knockback: 4,
      inflictsBurn: true,
      inflictsShock: true,
    };
  }

  // FUEGO + TIERRA: METEORITO / MAGMA
  if (hasFire && hasEarth) {
    return {
      name: 'Meteorito de Magma',
      description: 'Roca volcánica ardiente que estalla con gran impacto.',
      castMode: 'shoot',
      damage: 60,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 14,
      color: '#ea580c',
      secondaryColor: '#78350f',
      projectileSpeed: 6.5,
      pierce: 1,
      duration: 50,
      knockback: 10,
      inflictsBurn: true,
    };
  }

  // AGUA + RAYO: RAYO ACUÁTICO CONDUCTOR
  if (hasWater && hasLightning) {
    return {
      name: 'Rayo Conductor Acuático',
      description: 'Moja al enemigo y descarga electricidad letal (x3 de daño si está mojado).',
      castMode: 'shoot',
      damage: 48,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 7,
      color: '#eab308',
      secondaryColor: '#0284c7',
      projectileSpeed: 9,
      pierce: 2,
      duration: 45,
      knockback: 4,
      inflictsWet: true,
      inflictsShock: true,
    };
  }

  // AGUA + HIELO: LANZA DE CARÁMBANO
  if (hasWater && hasIce) {
    return {
      name: 'Lanza de Carámbano',
      description: 'Proyectil gélido súper afilado que congela a los objetivos empapados.',
      castMode: 'shoot',
      damage: 44,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 8,
      color: '#06b6d4',
      secondaryColor: '#ffffff',
      projectileSpeed: 8.5,
      pierce: 2,
      duration: 50,
      knockback: 5,
      inflictsFreeze: true,
    };
  }

  // FUEGO + AGUA: CHORRO DE VAPOR
  if (hasFire && hasWater) {
    return {
      name: 'Chorro de Vapor Hirviente',
      description: 'Presión térmica extrema que ciega y empuja a los monstruos.',
      castMode: 'shoot',
      damage: 38,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 11,
      color: '#38bdf8',
      secondaryColor: '#f97316',
      projectileSpeed: 7,
      pierce: 3,
      duration: 35,
      knockback: 12,
      inflictsBurn: true,
    };
  }

  // TIERRA + RAYO: PEÑASCO ELECTRIFICADO
  if (hasEarth && hasLightning) {
    return {
      name: 'Peñasco Electrificado',
      description: 'Roca imbuida en voltaje que aplasta y aturde al impactar.',
      castMode: 'shoot',
      damage: 50,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 12,
      color: '#ca8a04',
      secondaryColor: '#fef08a',
      projectileSpeed: 6.8,
      pierce: 1,
      duration: 45,
      knockback: 9,
      inflictsShock: true,
    };
  }

  // Elementos Puros Individuales:
  if (hasFire) {
    return {
      name: count('fire') > 1 ? 'Gran Bola de Fuego' : 'Orbe de Fuego',
      description: 'Lanza una flama que quema a los enemigos.',
      castMode: 'shoot',
      damage: 30 + count('fire') * 12,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 8 + count('fire') * 2,
      color: '#ef4444',
      secondaryColor: '#f97316',
      projectileSpeed: 7.5,
      pierce: 1,
      duration: 45,
      knockback: 5,
      inflictsBurn: true,
    };
  }

  if (hasWater) {
    return {
      name: 'Chorro de Agua',
      description: 'Empapa a los enemigos (los vuelve vulnerables a Rayo y Hielo).',
      castMode: 'shoot',
      damage: 22 + count('water') * 8,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 9,
      color: '#0284c7',
      secondaryColor: '#38bdf8',
      projectileSpeed: 8,
      pierce: 2,
      duration: 40,
      knockback: 6,
      inflictsWet: true,
    };
  }

  if (hasLightning) {
    return {
      name: 'Rayo Eléctrico',
      description: 'Descarga de alta velocidad que inflige daño instantáneo.',
      castMode: 'shoot',
      damage: 32 + count('lightning') * 10,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 6,
      color: '#facc15',
      secondaryColor: '#ffffff',
      projectileSpeed: 10,
      pierce: count('lightning'),
      duration: 35,
      knockback: 3,
      inflictsShock: true,
    };
  }

  if (hasIce) {
    return {
      name: 'Daga de Hielo',
      description: 'Proyectil filoso que ralentiza y congela.',
      castMode: 'shoot',
      damage: 28 + count('ice') * 9,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 7,
      color: '#38bdf8',
      secondaryColor: '#e0f2fe',
      projectileSpeed: 8,
      pierce: 1,
      duration: 45,
      knockback: 4,
      inflictsFreeze: true,
    };
  }

  if (hasEarth) {
    return {
      name: 'Peñasco Telúrico',
      description: 'Pesada roca que empuja fuertemente a los enemigos.',
      castMode: 'shoot',
      damage: 40 + count('earth') * 10,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 13,
      color: '#854d0e',
      secondaryColor: '#451a03',
      projectileSpeed: 6,
      pierce: 1,
      duration: 50,
      knockback: 14,
    };
  }

  if (hasShield) {
    return {
      name: 'Orbe de Protección',
      description: 'Dispara una burbuja que repele al contacto.',
      castMode: 'shoot',
      damage: 20,
      heal: 0,
      shieldAmount: 0,
      speedBoost: 0,
      radius: 10,
      color: '#06b6d4',
      projectileSpeed: 7,
      pierce: 1,
      duration: 40,
      knockback: 10,
    };
  }

  // Fallback
  return {
    name: 'Disparo Mágico',
    description: 'Proyectil arcano básico.',
    castMode: 'shoot',
    damage: 25,
    heal: 0,
    shieldAmount: 0,
    speedBoost: 0,
    radius: 7,
    color: '#818cf8',
    projectileSpeed: 7.5,
    pierce: 1,
    duration: 40,
    knockback: 4,
  };
}
