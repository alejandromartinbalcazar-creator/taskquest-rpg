import { GameEnemy, Projectile, FloatingText, StatusEffectType, RoomType } from './types';
import { checkCircleCollision } from './physicsAndTerrain';
import { elementalSound } from './soundEngine';

export class EnemyManager {
  public enemies: GameEnemy[] = [];
  public currentBoss: GameEnemy | null = null;
  public totalKills = 0;

  constructor() {
    this.spawnRoomEnemies('entrance');
  }

  // Genera enemigos según la sala actual de la mazmorra
  public spawnRoomEnemies(roomType: RoomType) {
    this.enemies = [];
    this.currentBoss = null;

    if (roomType === 'entrance' || roomType === 'relic_sanctuary') {
      // Salas pacíficas de descanso y reliquias
      return;
    }

    // 1. SALA DE ENJAMBRE (SWARM)
    if (roomType === 'combat_swarm') {
      for (let i = 0; i < 5; i++) {
        const ang = (Math.PI * 2 / 5) * i;
        this.enemies.push({
          id: `swarm-${Date.now()}-${i}`,
          name: 'Duende de la Pereza',
          archetype: 'chaser',
          x: 550 + Math.cos(ang) * 220,
          y: 360 + Math.sin(ang) * 160,
          vx: 0,
          vy: 0,
          radius: 15,
          hp: 70,
          maxHp: 70,
          attackPower: 8,
          moveSpeed: 0.95,
          statuses: [],
          color: '#ef4444',
          avatar: '👺',
          weakness: 'fire',
          attackCooldown: 0,
          attackMaxCooldown: 55,
          telegraphTimer: 0,
          telegraphMax: 25,
          isTelegraphing: false,
          hitFlash: 0,
        });
      }
    }
    // 2. SALA DE TRAMPAS Y RIESGOS ELEMENTALES
    else if (roomType === 'hazard_traps') {
      for (let i = 0; i < 3; i++) {
        this.enemies.push({
          id: `hazard-creep-${Date.now()}-${i}`,
          name: 'Duende Glacial',
          archetype: 'chaser',
          x: 420 + i * 130,
          y: 280,
          vx: 0,
          vy: 0,
          radius: 15,
          hp: 85,
          maxHp: 85,
          attackPower: 10,
          moveSpeed: 0.9,
          statuses: [],
          color: '#06b6d4',
          avatar: '🥶',
          weakness: 'fire',
          attackCooldown: 0,
          attackMaxCooldown: 50,
          telegraphTimer: 0,
          telegraphMax: 25,
          isTelegraphing: false,
          hitFlash: 0,
        });
      }

      this.enemies.push({
        id: `shooter-${Date.now()}`,
        name: 'Espectro del Scroll',
        archetype: 'ranged',
        x: 550,
        y: 190,
        vx: 0,
        vy: 0,
        radius: 18,
        hp: 110,
        maxHp: 110,
        attackPower: 14,
        moveSpeed: 0.65,
        statuses: [],
        color: '#a855f7',
        avatar: '👻',
        weakness: 'lightning',
        attackCooldown: 40,
        attackMaxCooldown: 120,
        telegraphTimer: 0,
        telegraphMax: 40,
        isTelegraphing: false,
        hitFlash: 0,
      });
    }
    // 3. SALA DE FUEGO CRUZADO (CROSSFIRE)
    else if (roomType === 'crossfire') {
      // 2 Espectros a distancia detrás de coberturas
      this.enemies.push(
        {
          id: `shooter-1-${Date.now()}`,
          name: 'Espectro del Foco Roto',
          archetype: 'ranged',
          x: 320,
          y: 220,
          vx: 0,
          vy: 0,
          radius: 18,
          hp: 105,
          maxHp: 105,
          attackPower: 15,
          moveSpeed: 0.65,
          statuses: [],
          color: '#a855f7',
          avatar: '👻',
          weakness: 'lightning',
          attackCooldown: 30,
          attackMaxCooldown: 110,
          telegraphTimer: 0,
          telegraphMax: 40,
          isTelegraphing: false,
          hitFlash: 0,
        },
        {
          id: `shooter-2-${Date.now()}`,
          name: 'Espectro de la Indecisión',
          archetype: 'ranged',
          x: 780,
          y: 220,
          vx: 0,
          vy: 0,
          radius: 18,
          hp: 105,
          maxHp: 105,
          attackPower: 15,
          moveSpeed: 0.65,
          statuses: [],
          color: '#a855f7',
          avatar: '👻',
          weakness: 'fire',
          attackCooldown: 60,
          attackMaxCooldown: 110,
          telegraphTimer: 0,
          telegraphMax: 40,
          isTelegraphing: false,
          hitFlash: 0,
        }
      );

      // 1 Golem pesado de avanzada
      this.enemies.push({
        id: `golem-crossfire-${Date.now()}`,
        name: 'Golem Pesado',
        archetype: 'brute',
        x: 550,
        y: 450,
        vx: 0,
        vy: 0,
        radius: 26,
        hp: 200,
        maxHp: 200,
        attackPower: 22,
        moveSpeed: 0.5,
        statuses: [],
        color: '#64748b',
        avatar: '🗿',
        weakness: 'earth',
        attackCooldown: 50,
        attackMaxCooldown: 140,
        telegraphTimer: 0,
        telegraphMax: 45,
        isTelegraphing: false,
        hitFlash: 0,
      });
    }
    // 4. JEFE 1: GUARDIÁN DE BASALTO
    else if (roomType === 'boss_basalt') {
      const boss: GameEnemy = {
        id: `boss-basalt-${Date.now()}`,
        name: 'Guardián de Basalto',
        archetype: 'boss',
        bossType: 'basalt_guardian',
        x: 550,
        y: 260,
        vx: 0,
        vy: 0,
        radius: 36,
        hp: 480,
        maxHp: 480,
        armorShield: 120,
        maxArmorShield: 120,
        attackPower: 26,
        moveSpeed: 0.55,
        statuses: [],
        color: '#475569',
        avatar: '🗿👑',
        weakness: 'earth',
        attackCooldown: 40,
        attackMaxCooldown: 140,
        telegraphTimer: 0,
        telegraphMax: 50,
        isTelegraphing: false,
        hitFlash: 0,
        phase: 1,
      };
      this.enemies.push(boss);
      this.currentBoss = boss;
      elementalSound.playBossIntro();
    }
    // 5. JEFE 2: ESPECTRO DE LA TORMENTA
    else if (roomType === 'boss_storm') {
      const boss: GameEnemy = {
        id: `boss-storm-${Date.now()}`,
        name: 'Espectro de la Tormenta',
        archetype: 'boss',
        bossType: 'storm_wraith',
        x: 550,
        y: 250,
        vx: 0,
        vy: 0,
        radius: 30,
        hp: 520,
        maxHp: 520,
        attackPower: 22,
        moveSpeed: 0.85,
        statuses: [],
        color: '#facc15',
        avatar: '⚡👻',
        weakness: 'ice',
        resistance: 'lightning',
        attackCooldown: 30,
        attackMaxCooldown: 110,
        telegraphTimer: 0,
        telegraphMax: 40,
        isTelegraphing: false,
        hitFlash: 0,
        phase: 1,
        teleportTimer: 180,
      };
      this.enemies.push(boss);
      this.currentBoss = boss;
      elementalSound.playBossIntro();
    }
    // 6. JEFE 3: DRAGÓN DE OBSIDIANA (FINAL)
    else if (roomType === 'boss_dragon') {
      const boss: GameEnemy = {
        id: `boss-dragon-${Date.now()}`,
        name: 'Dragón de Obsidiana',
        archetype: 'boss',
        bossType: 'obsidian_dragon',
        x: 550,
        y: 240,
        vx: 0,
        vy: 0,
        radius: 44,
        hp: 750,
        maxHp: 750,
        armorShield: 150,
        maxArmorShield: 150,
        attackPower: 32,
        moveSpeed: 0.65,
        statuses: [],
        color: '#1c1917',
        avatar: '🐉🔥',
        weakness: 'ice',
        resistance: 'fire',
        attackCooldown: 40,
        attackMaxCooldown: 130,
        telegraphTimer: 0,
        telegraphMax: 50,
        isTelegraphing: false,
        hitFlash: 0,
        phase: 1,
        breathAngle: 0,
      };
      this.enemies.push(boss);
      this.currentBoss = boss;
      elementalSound.playBossIntro();
    }
  }

  // Actualiza la IA y mecánicas de cada enemigo
  public update(
    wizard: { x: number; y: number; radius: number },
    projectiles: Projectile[],
    floatingTexts: FloatingText[],
    obstacles: Array<{ x: number; y: number; radius: number; obstacleType: string; solid: boolean }>,
    onPlayerDamage: (amount: number) => void
  ) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.hitFlash > 0) e.hitFlash--;

      // 1. Efectos de estado elementales
      let isFrozen = false;
      let speedMult = 1.0;

      for (let sIdx = e.statuses.length - 1; sIdx >= 0; sIdx--) {
        const s = e.statuses[sIdx];
        s.duration--;

        if (s.type === 'frozen') {
          isFrozen = true;
        } else if (s.type === 'slowed') {
          speedMult *= 0.45;
        } else if (s.type === 'burning') {
          if (!s.tickTimer) s.tickTimer = 0;
          s.tickTimer++;
          if (s.tickTimer % 20 === 0) {
            e.hp -= s.damagePerTick || 5;
            e.hitFlash = 4;
          }
        } else if (s.type === 'shocked') {
          if (Math.random() < 0.18) {
            speedMult *= 0.2; // Breve contracción por shock
          }
        }

        if (s.duration <= 0) {
          e.statuses.splice(sIdx, 1);
        }
      }

      // Si está aturdido o congelado, no se mueve
      if (isFrozen) continue;
      if (e.stunnedTimer && e.stunnedTimer > 0) {
        e.stunnedTimer--;
        continue;
      }

      const dx = wizard.x - e.x;
      const dy = wizard.y - e.y;
      const distToPlayer = Math.hypot(dx, dy);

      // 2. IA DE JEFES ESPECÍFICOS

      // JEFE 1: GUARDIÁN DE BASALTO
      if (e.bossType === 'basalt_guardian') {
        // Mecánica de Embestida (Charge)
        if (e.isCharging && e.chargeTarget) {
          const cdx = e.chargeTarget.x - e.x;
          const cdy = e.chargeTarget.y - e.y;
          const cdist = Math.hypot(cdx, cdy);

          if (cdist > 15) {
            e.x += (cdx / cdist) * 6.5;
            e.y += (cdy / cdist) * 6.5;

            // Daño al jugador si es arrollado por la embestida
            if (checkCircleCollision(e.x, e.y, e.radius, wizard.x, wizard.y, wizard.radius)) {
              onPlayerDamage(e.attackPower);
              e.isCharging = false;
            }

            // ¡VULNERABILIDAD! Si choca contra un pilar de piedra durante la embestida
            obstacles.forEach((obs) => {
              if (obs.solid && obs.obstacleType === 'rock_pillar') {
                if (checkCircleCollision(e.x, e.y, e.radius, obs.x, obs.y, obs.radius)) {
                  e.isCharging = false;
                  e.stunnedTimer = 190; // ¡Aturdido 3.2 segundos!
                  e.hp -= 65; // Daño que se autoinflige por chocar
                  e.hitFlash = 15;
                  elementalSound.playBasaltCrash();

                  floatingTexts.push({
                    id: `basalt-stun-${Date.now()}`,
                    x: e.x,
                    y: e.y - 35,
                    text: '💫 ¡COLISIÓN CONTRA PILAR! ATURDIDO',
                    color: '#facc15',
                    fontSize: 14,
                    opacity: 1,
                    vy: -1.6,
                    life: 50,
                  });
                }
              }
            });
          } else {
            e.isCharging = false;
          }
          continue;
        }

        // Movimiento pesado normal
        if (distToPlayer > 80 && !e.isTelegraphing) {
          e.x += (dx / distToPlayer) * e.moveSpeed * speedMult;
          e.y += (dy / distToPlayer) * e.moveSpeed * speedMult;
        }

        e.attackCooldown++;
        if (e.attackCooldown >= e.attackMaxCooldown - e.telegraphMax) {
          e.isTelegraphing = true;
        }

        if (e.attackCooldown >= e.attackMaxCooldown) {
          e.attackCooldown = 0;
          e.isTelegraphing = false;

          // Alterna entre Embestida y Golpe Sísmico
          if (distToPlayer > 130) {
            // Embestida hacia el jugador
            e.isCharging = true;
            // Proyecta el objetivo más allá del jugador para que choque contra pilares/paredes
            const angle = Math.atan2(dy, dx);
            e.chargeTarget = {
              x: wizard.x + Math.cos(angle) * 120,
              y: wizard.y + Math.sin(angle) * 120,
            };
          } else {
            // Golpe Sísmico en área
            onPlayerDamage(e.attackPower);
            floatingTexts.push({
              id: `slam-${Date.now()}`,
              x: wizard.x,
              y: wizard.y - 20,
              text: `💥 ¡GOLPE SÍSMICO! -${e.attackPower} HP`,
              color: '#f97316',
              fontSize: 14,
              opacity: 1,
              vy: -1.5,
              life: 40,
            });
          }
        }
        continue;
      }

      // JEFE 2: ESPECTRO DE LA TORMENTA
      if (e.bossType === 'storm_wraith') {
        // Teletransporte / Desplazamiento rápido
        if (!e.teleportTimer) e.teleportTimer = 180;
        e.teleportTimer--;

        if (e.teleportTimer <= 0) {
          e.teleportTimer = 180;
          // Se teletransporta a un punto estratégico de la sala
          e.x = 280 + Math.random() * 540;
          e.y = 180 + Math.random() * 340;
          elementalSound.playLightningBolt();
          floatingTexts.push({
            id: `tp-${Date.now()}`,
            x: e.x,
            y: e.y - 20,
            text: '⚡ ¡DESPLAZAMIENTO RELÁMPAGO!',
            color: '#fde047',
            fontSize: 12,
            opacity: 1,
            vy: -1.2,
            life: 30,
          });
        }

        e.attackCooldown++;
        if (e.attackCooldown >= e.attackMaxCooldown - e.telegraphMax) {
          e.isTelegraphing = true;
        }

        if (e.attackCooldown >= e.attackMaxCooldown) {
          e.attackCooldown = 0;
          e.isTelegraphing = false;

          // Descarga de 3 rayos rápidos dirigidos
          const baseAng = Math.atan2(dy, dx);
          [-0.25, 0, 0.25].forEach((offset, idx) => {
            const angle = baseAng + offset;
            projectiles.push({
              id: `storm-proj-${Date.now()}-${idx}`,
              x: e.x,
              y: e.y,
              vx: Math.cos(angle) * 6.5,
              vy: Math.sin(angle) * 6.5,
              radius: 9,
              color: '#facc15',
              secondaryColor: '#ffffff',
              damage: e.attackPower,
              knockback: 2.5,
              life: 100,
              maxLife: 100,
              pierce: 1,
              piercedIds: [],
              isHostile: true,
              spellType: 'lightning_bolt',
              visualShape: 'lightning_beam',
            });
          });
        }
        continue;
      }

      // JEFE 3: DRAGÓN DE OBSIDIANA (FINAL)
      if (e.bossType === 'obsidian_dragon') {
        // Fases según salud
        if (e.hp < e.maxHp * 0.3) {
          e.phase = 3;
        } else if (e.hp < e.maxHp * 0.6) {
          e.phase = 2;
        }

        // Movimiento imponente en el centro superior
        e.x += Math.sin(Date.now() * 0.0018) * 1.2;
        e.y += Math.cos(Date.now() * 0.0012) * 0.6;

        e.attackCooldown++;
        if (e.attackCooldown >= e.attackMaxCooldown - e.telegraphMax) {
          e.isTelegraphing = true;
          e.breathAngle = Math.atan2(dy, dx);
        }

        if (e.attackCooldown >= e.attackMaxCooldown) {
          e.attackCooldown = 0;
          e.isTelegraphing = false;
          elementalSound.playDragonBreath();

          // Aliento de fuego en cono amplio (5 a 7 proyectiles ardientes)
          const baseAng = e.breathAngle || Math.atan2(dy, dx);
          const count = e.phase === 3 ? 7 : 5;
          const spread = 0.8;
          for (let pIdx = 0; pIdx < count; pIdx++) {
            const angle = baseAng - spread / 2 + (spread / (count - 1)) * pIdx;
            projectiles.push({
              id: `dragon-fire-${Date.now()}-${pIdx}`,
              x: e.x,
              y: e.y + 10,
              vx: Math.cos(angle) * 4.8,
              vy: Math.sin(angle) * 4.8,
              radius: 13,
              color: '#ea580c',
              secondaryColor: '#facc15',
              damage: e.attackPower,
              knockback: 4.0,
              life: 90,
              maxLife: 90,
              pierce: 1,
              piercedIds: [],
              isHostile: true,
              spellType: 'fire_shot',
              visualShape: 'fire_comet',
            });
          }
        }
        continue;
      }

      // 3. IA DE ENEMIGOS ESTÁNDAR (Chaser, Ranged, Brute)
      if (e.archetype === 'chaser') {
        if (distToPlayer > wizard.radius + e.radius + 2) {
          e.vx = (dx / distToPlayer) * e.moveSpeed * speedMult;
          e.vy = (dy / distToPlayer) * e.moveSpeed * speedMult;
          e.x += e.vx;
          e.y += e.vy;
        } else {
          e.attackCooldown++;
          if (e.attackCooldown >= e.attackMaxCooldown) {
            e.attackCooldown = 0;
            onPlayerDamage(e.attackPower);
            floatingTexts.push({
              id: `dmg-p-${Date.now()}`,
              x: wizard.x,
              y: wizard.y - 15,
              text: `-${e.attackPower} HP`,
              color: '#ef4444',
              fontSize: 13,
              opacity: 1,
              vy: -1.2,
              life: 30,
            });
          }
        }
      } else if (e.archetype === 'ranged') {
        const idealDist = 240;
        if (distToPlayer < idealDist - 30) {
          e.vx = (-dx / distToPlayer) * e.moveSpeed * speedMult;
          e.vy = (-dy / distToPlayer) * e.moveSpeed * speedMult;
        } else if (distToPlayer > idealDist + 30) {
          e.vx = (dx / distToPlayer) * e.moveSpeed * speedMult;
          e.vy = (dy / distToPlayer) * e.moveSpeed * speedMult;
        } else {
          e.vx *= 0.8;
          e.vy *= 0.8;
        }
        e.x += e.vx;
        e.y += e.vy;

        e.attackCooldown++;
        if (e.attackCooldown >= e.attackMaxCooldown - e.telegraphMax) {
          e.isTelegraphing = true;
          e.aimAngle = Math.atan2(dy, dx);
        }

        if (e.attackCooldown >= e.attackMaxCooldown) {
          e.attackCooldown = 0;
          e.isTelegraphing = false;
          const angle = e.aimAngle || Math.atan2(dy, dx);
          projectiles.push({
            id: `enemy-proj-${Date.now()}`,
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * 4.2,
            vy: Math.sin(angle) * 4.2,
            radius: 8,
            color: '#a855f7',
            secondaryColor: '#6b21a8',
            damage: e.attackPower,
            knockback: 2.5,
            life: 140,
            maxLife: 140,
            pierce: 1,
            piercedIds: [],
            isHostile: true,
            spellType: 'basic_spark',
            visualShape: 'boss_orb',
          });
        }
      } else if (e.archetype === 'brute') {
        if (distToPlayer > 80 && !e.isTelegraphing) {
          e.vx = (dx / distToPlayer) * e.moveSpeed * speedMult;
          e.vy = (dy / distToPlayer) * e.moveSpeed * speedMult;
          e.x += e.vx;
          e.y += e.vy;
        }

        e.attackCooldown++;
        if (e.attackCooldown >= e.attackMaxCooldown - e.telegraphMax) {
          e.isTelegraphing = true;
        }

        if (e.attackCooldown >= e.attackMaxCooldown) {
          e.attackCooldown = 0;
          e.isTelegraphing = false;
          if (distToPlayer < 95) {
            onPlayerDamage(e.attackPower);
            floatingTexts.push({
              id: `slam-p-${Date.now()}`,
              x: wizard.x,
              y: wizard.y - 18,
              text: `💥 ¡GOLPE PESADO! -${e.attackPower} HP`,
              color: '#f97316',
              fontSize: 14,
              opacity: 1,
              vy: -1.5,
              life: 40,
            });
          }
        }
      }

      // Separación entre enemigos
      for (let j = i - 1; j >= 0; j--) {
        const other = this.enemies[j];
        const sepDx = other.x - e.x;
        const sepDy = other.y - e.y;
        const sepDist = Math.hypot(sepDx, sepDy);
        const minSep = e.radius + other.radius;
        if (sepDist > 0 && sepDist < minSep) {
          const push = (minSep - sepDist) * 0.5;
          e.x -= (sepDx / sepDist) * push;
          e.y -= (sepDy / sepDist) * push;
          other.x += (sepDx / sepDist) * push;
          other.y += (sepDy / sepDist) * push;
        }
      }
    }
  }

  public applyStatus(
    enemy: GameEnemy,
    type: StatusEffectType,
    durationFrames: number,
    damagePerTick = 4
  ) {
    const existing = enemy.statuses.find((s) => s.type === type);
    if (existing) {
      existing.duration = Math.max(existing.duration, durationFrames);
    } else {
      enemy.statuses.push({
        type,
        duration: durationFrames,
        maxDuration: durationFrames,
        damagePerTick,
      });
    }
  }

  public hasStatus(enemy: GameEnemy, type: StatusEffectType): boolean {
    return enemy.statuses.some((s) => s.type === type);
  }

  public removeStatus(enemy: GameEnemy, type: StatusEffectType) {
    enemy.statuses = enemy.statuses.filter((s) => s.type !== type);
  }
}
