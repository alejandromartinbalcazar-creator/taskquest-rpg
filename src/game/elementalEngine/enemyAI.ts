import { GameEnemy, Projectile, FloatingText, StatusEffectType, RoomType } from './types';
import { checkCircleCollision } from './physicsAndTerrain';
import { elementalSound } from './soundEngine';
import { createThresholdCustodian, updateThresholdCustodian } from './BossCustodian';

export class EnemyManager {
  public enemies: GameEnemy[] = [];
  public currentBoss: GameEnemy | null = null;
  public totalKills = 0;

  constructor() {
    this.spawnRoomEnemies('entrance');
  }

  public createPyreGolem(id: string, x: number, y: number): GameEnemy {
    return {
      id,
      name: 'Gólem de Escoria Ígnea',
      archetype: 'brute',
      bestiaryType: 'pyre_golem',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 24,
      hp: 220,
      maxHp: 220,
      attackPower: 24,
      moveSpeed: 0.72,
      statuses: [],
      color: '#ea580c',
      avatar: '',
      weakness: 'ice',
      resistance: 'fire',
      attackCooldown: 0,
      attackMaxCooldown: 110,
      telegraphTimer: 0,
      telegraphMax: 35,
      isTelegraphing: false,
      hitFlash: 0,
      facingAngle: 0,
      cooledDownTimer: 0,
      frenzyTimer: 0,
    };
  }

  public createStormStalker(id: string, x: number, y: number): GameEnemy {
    return {
      id,
      name: 'Espectro de Tormenta',
      archetype: 'ranged',
      bestiaryType: 'storm_stalker',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: 130,
      maxHp: 130,
      attackPower: 16,
      moveSpeed: 1.05,
      statuses: [],
      color: '#06b6d4',
      avatar: '',
      weakness: 'earth',
      resistance: 'lightning',
      attackCooldown: 0,
      attackMaxCooldown: 140,
      telegraphTimer: 0,
      telegraphMax: 30,
      isTelegraphing: false,
      hitFlash: 0,
      facingAngle: 0,
      orbitAngle: Math.random() * Math.PI * 2,
      teleportCooldown: 0,
      sparkTimer: 0,
    };
  }

  public createFrostLurker(id: string, x: number, y: number): GameEnemy {
    return {
      id,
      name: 'Acechador de Escarcha',
      archetype: 'ranged',
      bestiaryType: 'frost_lurker',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 20,
      hp: 160,
      maxHp: 160,
      attackPower: 22,
      moveSpeed: 0.85,
      statuses: [],
      color: '#38bdf8',
      avatar: '',
      weakness: 'fire',
      resistance: 'ice',
      attackCooldown: 0,
      attackMaxCooldown: 160,
      telegraphTimer: 0,
      telegraphMax: 35,
      isTelegraphing: false,
      hitFlash: 0,
      facingAngle: 0,
      shieldBrokenTimer: 0,
      snipeTimer: 0,
      isSniping: false,
      snipeAngle: 0,
    };
  }

  // Genera enemigos según la sala actual de la mazmorra
  public spawnRoomEnemies(roomType: RoomType) {
    this.enemies = [];
    this.currentBoss = null;

    if (roomType === 'entrance' || roomType === 'relic_sanctuary') {
      // Salas pacíficas de descanso y reliquias
      return;
    }

    // 1. SALA DE ENJAMBRE (SWARM) - Gólems de Escoria Ígnea y Espectros de Tormenta
    if (roomType === 'combat_swarm') {
      // 2 Gólems de Escoria avanzando de frente
      this.enemies.push(
        this.createPyreGolem(`swarm-golem-1-${Date.now()}`, 480, 260),
        this.createPyreGolem(`swarm-golem-2-${Date.now()}`, 640, 260),
        // 2 Espectros de Tormenta hostigando desde los flancos
        this.createStormStalker(`swarm-storm-1-${Date.now()}`, 380, 420),
        this.createStormStalker(`swarm-storm-2-${Date.now()}`, 720, 420)
      );
    }
    // 2. SALA DE TRAMPAS Y RIESGOS ELEMENTALES - Acechadores de Escarcha y Gólem
    else if (roomType === 'hazard_traps') {
      this.enemies.push(
        this.createFrostLurker(`hazard-lurker-1-${Date.now()}`, 400, 220),
        this.createFrostLurker(`hazard-lurker-2-${Date.now()}`, 700, 220),
        this.createPyreGolem(`hazard-golem-${Date.now()}`, 550, 360)
      );
    }
    // 3. SALA DE FUEGO CRUZADO (CROSSFIRE) - Triada Táctica Completa del Bestiario
    else if (roomType === 'crossfire') {
      this.enemies.push(
        // 2 Acechadores francotiradores protegiéndose tras coberturas
        this.createFrostLurker(`crossfire-lurker-1-${Date.now()}`, 340, 210),
        this.createFrostLurker(`crossfire-lurker-2-${Date.now()}`, 760, 210),
        // 1 Espectro orbital hostigador
        this.createStormStalker(`crossfire-storm-${Date.now()}`, 550, 180),
        // 1 Gólem pesado de primera línea
        this.createPyreGolem(`crossfire-golem-${Date.now()}`, 550, 440)
      );
    }
    // 4. JEFE 1: EL CUSTODIO DEL UMBRAL (BOSS FINAL DEL NIVEL 1)
    else if (roomType === 'boss_basalt') {
      const boss = createThresholdCustodian(550, 260);
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
    onPlayerDamage: (amount: number) => void,
    onScreenShake?: (amount: number) => void
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

      // Temporizadores mecánicos del Bestiario
      if (e.cooledDownTimer && e.cooledDownTimer > 0) e.cooledDownTimer--;
      if (e.frenzyTimer && e.frenzyTimer > 0) e.frenzyTimer--;
      if (e.shieldBrokenTimer && e.shieldBrokenTimer > 0) e.shieldBrokenTimer--;
      if (e.teleportCooldown && e.teleportCooldown > 0) e.teleportCooldown--;

      // Modificadores de velocidad por reacciones del Bestiario
      if (e.frenzyTimer && e.frenzyTimer > 0) {
        speedMult *= 1.75; // Frenesí de velocidad por fuego en Gólem de Escoria
      }
      if (e.cooledDownTimer && e.cooledDownTimer > 0) {
        speedMult *= 0.5; // -50% velocidad por enfriamiento de magma
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

      // JEFE FINAL DEL NIVEL 1: EL CUSTODIO DEL UMBRAL (3 FASES, ROTACIÓN DE BARRERAS Y TELEGRAFIADOS)
      if (e.bossType === 'threshold_custodian') {
        updateThresholdCustodian(e, wizard, projectiles, floatingTexts, onPlayerDamage, onScreenShake || (() => {}));
        continue;
      }

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

      // 3. IA TÁCTICA DEL BESTIARIO ELEMENTAL
      // Rango de alerta/patrulla: si el jugador está a más de 750px (en otra sección del mapa extendido),
      // el enemigo monta guardia en su sector sin desplazarse fuera de su área
      if (distToPlayer > 750) {
        e.vx *= 0.6;
        e.vy *= 0.6;
        e.isTelegraphing = false;
        if (e.bestiaryType === 'frost_lurker') {
          e.isSniping = false;
          e.snipeTimer = 0;
        }
        continue;
      }

      if (e.bestiaryType === 'pyre_golem') {
        e.facingAngle = Math.atan2(dy, dx);

        // Si está en rango de melé o ya telegrafiando el puñetazo pesado
        if (distToPlayer <= 75 || e.isTelegraphing) {
          e.attackCooldown++;
          if (e.attackCooldown >= e.attackMaxCooldown - e.telegraphMax) {
            e.isTelegraphing = true;
          }

          if (e.attackCooldown >= e.attackMaxCooldown) {
            e.attackCooldown = 0;
            e.isTelegraphing = false;
            // Al terminar la telegrafía en zona roja, si el jugador sigue en rango
            if (distToPlayer <= 90) {
              onPlayerDamage(e.attackPower);
              elementalSound.playBasaltCrash();
              floatingTexts.push({
                id: `pyre-slam-${Date.now()}`,
                x: wizard.x,
                y: wizard.y - 20,
                text: `💥 ¡PUÑETAZO ÍGNEO! -${e.attackPower} HP`,
                color: '#ea580c',
                fontSize: 14,
                opacity: 1,
                vy: -1.6,
                life: 40,
              });
            }
          }
        } else {
          // Persecución implacable directa hacia el héroe
          e.vx = (dx / distToPlayer) * e.moveSpeed * speedMult;
          e.vy = (dy / distToPlayer) * e.moveSpeed * speedMult;
          e.x += e.vx;
          e.y += e.vy;
        }
      } else if (e.bestiaryType === 'storm_stalker') {
        e.facingAngle = Math.atan2(dy, dx);

        // A. Micro-dash lateral evasivo si detecta proyectiles frontales entrantes del jugador
        if ((!e.teleportCooldown || e.teleportCooldown <= 0) && (!e.stunnedTimer || e.stunnedTimer <= 0)) {
          const incoming = projectiles.find((p) => {
            if (p.isHostile) return false;
            const pdx = e.x - p.x;
            const pdy = e.y - p.y;
            const pdist = Math.hypot(pdx, pdy);
            if (pdist < 130) {
              const dot = p.vx * pdx + p.vy * pdy;
              return dot > 0;
            }
            return false;
          });

          if (incoming) {
            const pAngle = Math.atan2(incoming.vy, incoming.vx);
            const side = Math.random() > 0.5 ? 1 : -1;
            const dashAngle = pAngle + (Math.PI / 2) * side;
            e.x += Math.cos(dashAngle) * 60;
            e.y += Math.sin(dashAngle) * 35;
            e.teleportCooldown = 150; // 2.5s cooldown
            elementalSound.playBasicSpark();
            floatingTexts.push({
              id: `evade-${Date.now()}`,
              x: e.x,
              y: e.y - 20,
              text: '⚡ ¡DASH EVASIVO!',
              color: '#38bdf8',
              fontSize: 12,
              opacity: 1,
              vy: -1.4,
              life: 30,
            });
          }
        }

        // B. Posicionamiento orbital a media distancia (180–210px)
        e.orbitAngle = (e.orbitAngle ?? 0) + 0.022;
        const targetOrbitX = wizard.x + Math.cos(e.orbitAngle) * 195;
        const targetOrbitY = wizard.y + Math.sin(e.orbitAngle) * 195 * 0.58;
        const odx = targetOrbitX - e.x;
        const ody = targetOrbitY - e.y;
        const odist = Math.hypot(odx, ody);

        if (odist > 12) {
          e.vx = (odx / odist) * (e.moveSpeed * 1.3 * speedMult);
          e.vy = (ody / odist) * (e.moveSpeed * 1.3 * speedMult);
          e.x += e.vx;
          e.y += e.vy;
        }

        // C. Canaliza orbe de chispa eléctrica cada 3.5s (210 frames)
        e.sparkTimer = (e.sparkTimer ?? 0) + 1;
        if (e.sparkTimer >= 210) {
          e.sparkTimer = 0;
          const aimAngle = Math.atan2(dy, dx);
          elementalSound.playBasicSpark();
          projectiles.push({
            id: `storm-spark-${Date.now()}-${Math.random()}`,
            x: e.x,
            y: e.y,
            vx: Math.cos(aimAngle) * 4.8,
            vy: Math.sin(aimAngle) * 4.8,
            radius: 9,
            color: '#00f0ff',
            secondaryColor: '#7c4dff',
            damage: e.attackPower,
            knockback: 2.2,
            life: 160,
            maxLife: 160,
            pierce: 1,
            piercedIds: [],
            isHostile: true,
            spellType: 'basic_spark',
            visualShape: 'plasma_sphere',
            element: 'lightning',
          });
        }
      } else if (e.bestiaryType === 'frost_lurker') {
        // Siempre orienta la coraza frontal hacia el jugador para mitigar ataques frontales
        e.facingAngle = Math.atan2(dy, dx);

        // Kiting: Si el jugador se aproxima a menos de 160px, retrocede manteniendo el frente
        if (distToPlayer < 160) {
          e.vx = (-dx / distToPlayer) * (e.moveSpeed * 1.1 * speedMult);
          e.vy = (-dy / distToPlayer) * (e.moveSpeed * 1.1 * speedMult);
          e.x += e.vx;
          e.y += e.vy;
          e.isSniping = false;
          e.snipeTimer = 0;
        } else {
          // A distancia segura, se detiene y canaliza la aguja de hielo rápida
          e.vx *= 0.6;
          e.vy *= 0.6;
          e.snipeTimer = (e.snipeTimer ?? 0) + 1;

          // Telegrafía con haz láser azul en el suelo
          if (e.snipeTimer >= 35) {
            e.isSniping = true;
            e.snipeAngle = Math.atan2(dy, dx);
          }

          // Disparo de aguja de hielo de alta velocidad
          if (e.snipeTimer >= 95) {
            e.snipeTimer = 0;
            e.isSniping = false;
            const snipeAng = e.snipeAngle ?? Math.atan2(dy, dx);
            elementalSound.playIceShard();
            projectiles.push({
              id: `frost-snipe-${Date.now()}-${Math.random()}`,
              x: e.x,
              y: e.y,
              vx: Math.cos(snipeAng) * 7.5,
              vy: Math.sin(snipeAng) * 7.5,
              radius: 6,
              color: '#38bdf8',
              secondaryColor: '#0284c7',
              damage: Math.round(e.attackPower * 1.25),
              knockback: 3.5,
              life: 140,
              maxLife: 140,
              pierce: 1,
              piercedIds: [],
              isHostile: true,
              spellType: 'ice_lance',
              visualShape: 'ice_lance',
              element: 'ice',
            });
          }
        }
      } else if (e.archetype === 'chaser') {
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

      // Respetar colisiones con obstáculos físicos del mapa (rocas, portón, pilares)
      for (let oIdx = 0; oIdx < obstacles.length; oIdx++) {
        const obs = obstacles[oIdx];
        if (!obs.solid) continue;
        const obDx = e.x - obs.x;
        const obDy = e.y - obs.y;
        const obDist = Math.hypot(obDx, obDy);
        const minObsDist = e.radius + obs.radius;
        if (obDist > 0 && obDist < minObsDist) {
          const push = minObsDist - obDist;
          e.x += (obDx / obDist) * push;
          e.y += (obDy / obDist) * push;
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
