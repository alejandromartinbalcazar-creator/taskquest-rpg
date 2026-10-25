import {
  GameEnemy,
  Projectile,
  Particle,
  FloatingText,
  TerrainZone,
  PhysicalObstacle,
  ElectricArc,
  LightningBoltEffect,
  RoomType,
  ChanneledStreamState,
  InfernalCrownEntity,
  GlacialEruptionEntity,
  GlacialSpikeSegment,
  TectonicFistEntity,
  CryoBeamEntity,
  VolcanicBombardmentEntity,
  VolcanicFissureEntity,
  LavaBombEntity,
  ThermalVortexEntity,
  ConductiveCageEntity,
  ConductivePillarNode,
  PermafrostPrisonEntity,
  PermafrostMonolithNode,
  PlasmaTornadoEntity,
  HellRainEntity,
  HellMeteorInstance,
  HellCraterInstance,
  CelestialStormEntity,
  CelestialLightningStrikeInstance,
  IonizedPuddleInstance,
  DevastatingGlacierEntity,
  IceMonolithInstance,
  RadialIceSpike,
  TelluricBarrierEntity,
  TelluricRockInstance,
  ObsidianVolcanoEntity,
  ObsidianBladeInstance,
  ConductivePrisonEntity,
  ConductivePrisonPillarNode,
  OverloadCoreEntity,
  GlacialPlasmaStormEntity,
  ElementalCataclysmEntity,
  CataclysmFissure,
  CataclysmRockSlab,
  ForestLevelData,
  ForestTreeEntity,
  PuzzleWheelEntity,
  GateDoorEntity,
  FireBarrierEntity,
  AmbientLeafParticle,
  LevelCheckpoint,
  MagmaTrenchEntity,
  SolarFusionBeamEntity,
  GlacialAvalancheEntity,
  GlacialAvalancheSpike,
  BoilingHailEntity,
  BoilingHailIcicle,
  SuperconductorBlizzardEntity,
  LightningRodPylonEntity,
  PlasmaHyperOrbEntity,
  CryoArcFlashEntity,
  RollingMagmaBoulderEntity,
  GlacialBastionEntity,
  ResonantQuakeEntity,
  ResonantQuakeWave,
  ThundergodJudgmentEntity,
  PrimordialSupernovaEntity,
  AbsoluteZeroAgeEntity,
  TectonicCataclysmEntity,
  KineticPlasmaMeteorEntity,
  FrostburnCometEntity,
  CalderaCataclysmEntity,
  SolarArcTempestEntity,
  CryoLightningStormEntity,
  TectonicLightningHammerEntity,
  MoltenBlizzardEntity,
  SuperconductingNeedleStormEntity,
  TectonicGlacierWallEntity,
  PrimordialMagmaBastionEntity,
  EternalPermafrostFortressEntity,
  MagneticTelluricSpireEntity,
} from './types';
import { PooledParticle } from '../combat/ParticlePool';
import { getCameraFrustum, isInFrustum, FrustumBounds } from './level1ForestMap';
import { drawWizardSprite } from '../renderWizard';
import {
  drawPyreGolem,
  drawStormStalker,
  drawFrostLurker,
  drawEnemyHealthBar,
  drawBossVector,
} from './bestiaryRenderer';
import {
  drawThresholdCustodian,
  drawCustodianTelegraphs,
  drawCustodianHUD,
} from './custodianRenderer';
import { Tilemap } from '../map/Tilemap';

export class IsometricRenderer {
  // Renderiza el frame completo del juego con CÁMARA CERCANA (Zoom 1.32x) y siluetas físicas únicas
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: { x: number; y: number },
    wizard: {
      x: number;
      y: number;
      facingAngle: number;
      isMoving: boolean;
      animFrame: number;
      hitFlash: number;
      staffOrbColor: string;
      isDashing?: boolean;
      dashTimer?: number;
      dashTrail?: Array<{ x: number; y: number; facingAngle: number; alpha: number }>;
      isCharging?: boolean;
      chargeRatio?: number;
      chargeType?: string;
      channelLockTimer?: number;
      channeledStream?: ChanneledStreamState | null;
      isCursed?: boolean;
      hasLightningAura?: boolean;
      invulnerableTimer?: number;
      isRespawning?: boolean;
      respawnFadeTimer?: number;
      victoryScale?: number;
      staffCastTimer?: number;
    },
    enemies: GameEnemy[],
    projectiles: Projectile[],
    lightningBolts: LightningBoltEffect[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    terrainZones: TerrainZone[],
    obstacles: PhysicalObstacle[],
    electricArcs: ElectricArc[],
    screenShake: number,
    roomType: RoomType,
    currentBoss: GameEnemy | null,
    infernalCrowns: InfernalCrownEntity[] = [],
    glacialEruptions: GlacialEruptionEntity[] = [],
    tectonicFists: TectonicFistEntity[] = [],
    cryoBeams: CryoBeamEntity[] = [],
    volcanicBombardments: VolcanicBombardmentEntity[] = [],
    thermalVortices: ThermalVortexEntity[] = [],
    conductiveCages: ConductiveCageEntity[] = [],
    permafrostPrisons: PermafrostPrisonEntity[] = [],
    plasmaTornadoes: PlasmaTornadoEntity[] = [],
    hellRains: HellRainEntity[] = [],
    celestialStorms: CelestialStormEntity[] = [],
    devastatingGlaciers: DevastatingGlacierEntity[] = [],
    telluricBarriers: TelluricBarrierEntity[] = [],
    obsidianVolcanoes: ObsidianVolcanoEntity[] = [],
    conductivePrisons: ConductivePrisonEntity[] = [],
    overloadCores: OverloadCoreEntity[] = [],
    glacialPlasmaStorms: GlacialPlasmaStormEntity[] = [],
    elementalCataclysms: ElementalCataclysmEntity[] = [],
    forestLevel?: ForestLevelData,
    tilemap?: Tilemap,
    exploredTiles?: ReadonlySet<string>,
    magmaTrenches: MagmaTrenchEntity[] = [],
    solarFusionBeams: SolarFusionBeamEntity[] = [],
    glacialAvalanches: GlacialAvalancheEntity[] = [],
    boilingHails: BoilingHailEntity[] = [],
    superconductorBlizzards: SuperconductorBlizzardEntity[] = [],
    lightningRodPylons: LightningRodPylonEntity[] = [],
    plasmaHyperOrbs: PlasmaHyperOrbEntity[] = [],
    cryoArcFlashes: CryoArcFlashEntity[] = [],
    rollingMagmaBoulders: RollingMagmaBoulderEntity[] = [],
    glacialBastions: GlacialBastionEntity[] = [],
    resonantQuakes: ResonantQuakeEntity[] = [],
    thundergodJudgments: ThundergodJudgmentEntity[] = [],
    primordialSupernovas: PrimordialSupernovaEntity[] = [],
    absoluteZeroAges: AbsoluteZeroAgeEntity[] = [],
    tectonicCataclysms: TectonicCataclysmEntity[] = [],
    kineticPlasmaMeteors: KineticPlasmaMeteorEntity[] = [],
    frostburnComets: FrostburnCometEntity[] = [],
    calderaCataclysms: CalderaCataclysmEntity[] = [],
    solarArcTempests: SolarArcTempestEntity[] = [],
    cryoLightningStorms: CryoLightningStormEntity[] = [],
    tectonicLightningHammers: TectonicLightningHammerEntity[] = [],
    moltenBlizzards: MoltenBlizzardEntity[] = [],
    superconductingNeedleStorms: SuperconductingNeedleStormEntity[] = [],
    tectonicGlacierWalls: TectonicGlacierWallEntity[] = [],
    primordialMagmaBastions: PrimordialMagmaBastionEntity[] = [],
    eternalPermafrostFortresses: EternalPermafrostFortressEntity[] = [],
    magneticTelluricSpires: MagneticTelluricSpireEntity[] = []
  ) {
    ctx.save();

    // Desactivar suavizado de imágenes para estética Pixel Art de 16 bits
    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;

    // 1. Efecto de Sacudida de Pantalla (Screen Shake)
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 2;
      const shakeY = (Math.random() - 0.5) * screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    // Limpiar pantalla con fondo de mazmorra oscura
    ctx.fillStyle = '#06070c';
    ctx.fillRect(0, 0, width, height);

    // CÁMARA CERCANA: Aplicar factor de Zoom 1.35x para apreciar claramente las siluetas,
    // animaciones y reacciones de los personajes sin perder visibilidad táctica
    ctx.save();
    const zoom = 1.32;
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x, -camera.y);

    const frustum = getCameraFrustum(camera, width, height, zoom, 260);

    // 2. Dibujar Suelo (Tilemap procedural estructurado, o Bosque Extendido 2.5D, o Suelo de Mazmorra clásica)
    if (tilemap) {
      tilemap.renderFloor(ctx, frustum, performance.now());
    } else if (forestLevel) {
      this.drawForestGround(ctx, frustum, forestLevel);
    } else {
      this.drawDungeonFloor(ctx, roomType);
    }

    // 3. Dibujar Zonas de Terreno (Magma, Hielo, Charcos de Agua, Vapor)
    this.drawTerrainZones(ctx, terrainZones);

    // 3.5 Dibujar Suelo y Grietas de Corona Infernal (Fuego + Fuego)
    this.drawInfernalCrownFloor(ctx, infernalCrowns);

    // 3.6 Dibujar Falla y Surco de Permafrost de Erupción Glacial (Hielo + Hielo)
    this.drawGlacialEruptionFloor(ctx, glacialEruptions);

    // 3.7 Dibujar Cráter y Runa Sísmica de Puño Tectónico (Tierra + Tierra)
    this.drawTectonicFistFloor(ctx, tectonicFists);

    // 3.75 Dibujar Suelo, Grietas y Sombras de Bombardeo Volcánico (Fuego + Tierra)
    this.drawVolcanicBombardmentFloor(ctx, volcanicBombardments);

    // 3.76 Dibujar Vórtices de Choque Térmico (Fuego + Hielo: Ondas radiales de vapor y micro-anillos concéntricos)
    this.drawThermalVortices(ctx, thermalVortices);

    // 3.77 Dibujar Suelo, Glifos y Arcos Voltaicos de la Jaula de Pilares Conductores (Rayo + Tierra)
    this.drawConductiveCageFloor(ctx, conductiveCages);

    // 3.78 Dibujar Suelo, Fracturas y Escarcha de la Prisión de Permafrost (Hielo + Tierra)
    this.drawPermafrostPrisonFloor(ctx, permafrostPrisons);

    // 3.79 Dibujar Sombras, Suelo y Remolino de Succión del Tornado de Plasma (Fuego + Rayo)
    this.drawPlasmaTornadoGround(ctx, plasmaTornadoes);

    // 3.80 Dibujar Suelo, Advertencias y Cráteres de Magma de la Lluvia del Infierno (Fuego + Fuego + Fuego)
    this.drawHellRainGround(ctx, hellRains);

    // 3.81 Dibujar Suelo, Advertencias y Charcos Ionizados de Tormenta Celestial (Rayo + Rayo + Rayo)
    this.drawCelestialStormGround(ctx, celestialStorms);

    // 3.82 Dibujar Suelo, Ventisca, Sombras de Monolitos y Niebla de Glaciar Devastador (Hielo + Hielo + Hielo)
    this.drawGlacierGround(ctx, devastatingGlaciers);

    // 3.83 Dibujar Halo Gravitatorio y Sombras en el Suelo de la Barrera Telúrica (Tierra + Tierra + Tierra)
    this.drawTelluricGround(ctx, telluricBarriers);

    // 3.84 Dibujar Suelo, Fisuras de Magma, Vapor y Columna Eruptiva de Volcán de Obsidiana (Fuego + Hielo + Tierra)
    this.drawObsidianVolcanoGround(ctx, obsidianVolcanoes);

    // 3.85 Dibujar Suelo, Escarcha, Valla de Relámpagos e Implosión de Prisión Conductora (Rayo + Hielo + Tierra)
    this.drawConductivePrisonFloor(ctx, conductivePrisons);

    // 3.86 Dibujar Suelo, Glifos de Imán Telúrico y Ondas de Pulso de Núcleo de Sobrecarga (Fuego + Rayo + Tierra)
    this.drawOverloadCoreFloor(ctx, overloadCores);

    // 3.87 Dibujar Suelo, Halo de Escarcha, Estela Térmica e Implosión de Tormenta de Plasma Glacial (Fuego + Rayo + Hielo)
    this.drawGlacialPlasmaStormGround(ctx, glacialPlasmaStorms);

    // 3.88 Dibujar Suelo, Runa Primordial Tetra-Elemental, Fisuras Tectónicas y Escarcha de Cataclismo Elemental (Fuego + Rayo + Hielo + Tierra)
    this.drawElementalCataclysmGround(ctx, elementalCataclysms);

    // 3.885 Dibujar Trincheras de Magma en el Suelo (Fuego + Fuego + Tierra)
    this.drawMagmaTrenches(ctx, magmaTrenches);

    // 3.886 Dibujar Grietas y Escarcha de Alud Telúrico en el Suelo (Hielo + Hielo + Tierra)
    this.drawGlacialAvalancheGround(ctx, glacialAvalanches);

    // 3.887 Dibujar Runas de Impacto y Vapor de Granizo Hirviente en el Suelo (Hielo + Hielo + Fuego)
    this.drawBoilingHailGround(ctx, boilingHails);

    // 3.888 Dibujar Anillo y Glifo de Tormenta Crioelectrostática en el Suelo (Hielo + Hielo + Rayo)
    this.drawSuperconductorBlizzardGround(ctx, superconductorBlizzards);

    // 3.889 Dibujar Suelo y Campo Magnético de Pilón de Pararrayos (Rayo + Rayo + Tierra)
    this.drawLightningRodPylonGround(ctx, lightningRodPylons);

    // 3.890 Dibujar Escarcha Residual de Descarga Cero Absoluto (Rayo + Rayo + Hielo)
    this.drawCryoArcFlashGround(ctx, cryoArcFlashes);

    // 3.891 Dibujar Glifo Rúnico de Bastión Glacial en el Suelo (Tierra + Tierra + Hielo)
    this.drawGlacialBastionGround(ctx, glacialBastions);

    // 3.892 Dibujar Fisuras Tectónicas y Chispas en el Suelo de Fisura Resonante (Tierra + Tierra + Rayo)
    this.drawResonantQuakeGround(ctx, resonantQuakes);

    // 3.893 Dibujar Impacto en Suelo de Juicio del Dios del Trueno (Rayo x4)
    this.drawThundergodJudgmentGround(ctx, thundergodJudgments);

    // 3.894 Dibujar Parches de Lava Ardiente de Supernova Primordial (Fuego x4)
    this.drawPrimordialSupernovaLava(ctx, primordialSupernovas);

    // 3.895 Dibujar Escarcha y Estalagmitas en Suelo de Era Glacial (Hielo x4)
    this.drawAbsoluteZeroAgeGround(ctx, absoluteZeroAges);

    // 3.896 Dibujar Fisuras Transversales y Escombros de Cataclismo Tectónico (Tierra x4)
    this.drawTectonicCataclysmGround(ctx, tectonicCataclysms);

    // 3.897 Dibujar Cráter de Magma y Vetas Vivas de Caldera Volcánica Profunda (Fuego x3 + Tierra)
    this.drawCalderaCataclysmGround(ctx, calderaCataclysms);

    // 3.898 Dibujar Retícula de Telegrafiado y Estallido en Suelo de Meteoro de Plasma Cinético (Fuego x3 + Rayo)
    this.drawKineticPlasmaMeteorGround(ctx, kineticPlasmaMeteors);

    // 3.899 Dibujar Suelo Quemado y Columnas de Plasma de Tempestad Solar (Rayo x3 + Fuego)
    this.drawSolarArcTempestGround(ctx, solarArcTempests);

    // 3.900 Dibujar Impactos y Cristales en Suelo de Rayo Criogénico Puro (Rayo x3 + Hielo)
    this.drawCryoLightningStormGround(ctx, cryoLightningStorms);

    // 3.901 Dibujar Grietas Tectónicas y Cráter de Martillo de Thor (Rayo x3 + Tierra)
    this.drawTectonicLightningHammerGround(ctx, tectonicLightningHammers);

    // 3.902 Dibujar Zona de Suelo Fundido y Vapor de Ventisca Ígnea (Hielo x3 + Fuego)
    this.drawMoltenBlizzardGround(ctx, moltenBlizzards);

    // 3.903 Dibujar Agujas Clavadas en Suelo y Arcos de Agujas Superconductoras (Hielo x3 + Rayo)
    this.drawSuperconductingNeedleStormGround(ctx, superconductingNeedleStorms);

    // 3.89 Dibujar Áreas de Advertencia y Telegrafiados del Custodio del Umbral (Fisura, Estalagmitas, Nova y Juicio)
    if (currentBoss && currentBoss.bossType === 'threshold_custodian') {
      drawCustodianTelegraphs(ctx, currentBoss, performance.now());
    }

    // 3.8 Líneas de trayectoria y retículas tácticas al cargar o apuntar
    if (wizard.isCharging && wizard.chargeType === 'ice') {
      this.drawGlacialAimTrajectory(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'earth') {
      this.drawTectonicAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'cryo') {
      this.drawCryoAimTrajectory(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'volcanic') {
      this.drawVolcanicAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'thermal') {
      this.drawThermalAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'conductive') {
      this.drawConductiveAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'permafrost') {
      this.drawPermafrostAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'plasma') {
      this.drawPlasmaTornadoAimTrajectory(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'hell_rain') {
      this.drawHellRainAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'celestial') {
      this.drawCelestialAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'glacier') {
      this.drawGlacierAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'telluric') {
      this.drawTelluricAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'obsidian') {
      this.drawObsidianAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'conductive_prison') {
      this.drawConductivePrisonAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'overload_core') {
      this.drawOverloadCoreAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'glacial_plasma') {
      this.drawGlacialPlasmaStormAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'cataclysm') {
      this.drawElementalCataclysmAimIndicator(ctx, wizard);
    }

    // 4. Dibujar Arcos Eléctricos entre Cristales
    this.drawElectricArcs(ctx, electricArcs);

    // 5. Ordenamiento de Profundidad Y (Depth Sorting)
    const renderList: Array<{
      y: number;
      draw: () => void;
    }> = [];

    // Obstáculos físicos (Muros, Rocas, Cristales, Puertas, Estacas de Permafrost, Escombros Tectónicos)
    obstacles.forEach((obs) => {
      if ((forestLevel || tilemap) && !isInFrustum(obs.x, obs.y, obs.radius + 30, frustum)) return;
      renderList.push({
        y: obs.y,
        draw: () => this.drawObstacle(ctx, obs),
      });
    });

    // Si hay un Tilemap activo: añadir muros de piedra ancestral 2.5D y el portón al Y-Sorting
    if (tilemap) {
      tilemap.addWallsToRenderList(ctx, frustum, renderList, performance.now());
    }

    // Si hay nivel de bosque: añadir Troncos de Árboles, Rueda Elemental, Portón y Checkpoints al Y-Sorting
    if (forestLevel) {
      if (forestLevel.checkpoints) {
        forestLevel.checkpoints.forEach((cp) => {
          if (isInFrustum(cp.x, cp.y, 100, frustum)) {
            renderList.push({
              y: cp.y,
              draw: () => this.drawCheckpointMonolith(ctx, cp, performance.now()),
            });
          }
        });
      }

      forestLevel.trees.forEach((tree) => {
        if (!isInFrustum(tree.x, tree.y, tree.canopyRadius + 60, frustum)) return;
        renderList.push({
          y: tree.y,
          draw: () => this.drawTreeTrunk(ctx, tree),
        });
      });

      if (isInFrustum(forestLevel.puzzleWheel.x, forestLevel.puzzleWheel.y, 80, frustum)) {
        renderList.push({
          y: forestLevel.puzzleWheel.y,
          draw: () => this.drawPuzzleWheel(ctx, forestLevel.puzzleWheel, wizard),
        });
      }

      if (isInFrustum(forestLevel.gateDoor.x, forestLevel.gateDoor.y, 180, frustum)) {
        renderList.push({
          y: forestLevel.gateDoor.y,
          draw: () => this.drawGateDoor(ctx, forestLevel.gateDoor),
        });
      }

      if (forestLevel.fireBarriers) {
        forestLevel.fireBarriers.forEach((barrier) => {
          if (!isInFrustum(barrier.x, barrier.y, barrier.width + 120, frustum)) return;
          renderList.push({
            y: barrier.y,
            draw: () => this.drawFireBarrier(ctx, barrier, wizard),
          });
        });
      }
    }

    // Púas de Hielo de Erupción Glacial (Hielo + Hielo) integradas en el Depth Sorting
    glacialEruptions.forEach((eruption) => {
      eruption.segments.forEach((seg) => {
        if (seg.emerged) {
          renderList.push({
            y: seg.y,
            draw: () => this.drawGlacialSpikeSegment(ctx, seg, eruption),
          });
        }
      });
    });

    // Colosal Puño Tectónico (Tierra + Tierra) integrado en el Depth Sorting
    tectonicFists.forEach((fist) => {
      if (fist.phase === 'eruption' || fist.phase === 'collapse') {
        renderList.push({
          y: fist.targetY,
          draw: () => this.drawTectonicFist(ctx, fist),
        });
      }
    });

    // Columnas de Magma y Bombas Balísticas de Bombardeo Volcánico (Fuego + Tierra)
    volcanicBombardments.forEach((bombardment) => {
      bombardment.fissures.forEach((fissure) => {
        if (fissure.phase === 'eruption' || fissure.phase === 'cooling') {
          renderList.push({
            y: fissure.y,
            draw: () => this.drawVolcanicMagmaColumn(ctx, fissure),
          });
        }
      });
      bombardment.lavaBombs.forEach((bomb) => {
        if (!bomb.hasExploded) {
          renderList.push({
            y: bomb.currentY,
            draw: () => this.drawLavaBomb(ctx, bomb),
          });
        }
      });
    });

    // Monolitos conductores de Jaula de Pilares (Rayo + Tierra) integrados en el Depth Sorting
    conductiveCages.forEach((cage) => {
      if (cage.phase !== 'finished') {
        cage.pillars.forEach((pillar) => {
          renderList.push({
            y: pillar.y,
            draw: () => this.drawConductivePillar(ctx, pillar, cage),
          });
        });
      }
    });

    // Monolitos de Prisión de Permafrost (Hielo + Tierra) integrados en el Depth Sorting
    permafrostPrisons.forEach((prison) => {
      if (prison.phase !== 'finished') {
        prison.monoliths.forEach((mono) => {
          if (!mono.shattered) {
            renderList.push({
              y: mono.y,
              draw: () => this.drawPermafrostMonolith(ctx, mono, prison),
            });
          }
        });
      }
    });

    // Tornado de Plasma (Fuego + Rayo) integrado en el Depth Sorting
    plasmaTornadoes.forEach((tornado) => {
      if (tornado.phase !== 'finished') {
        renderList.push({
          y: tornado.y,
          draw: () => this.drawPlasmaTornadoBody(ctx, tornado),
        });
      }
    });

    // Bólidos incandescentes cayendo de la Lluvia del Infierno (Fuego + Fuego + Fuego)
    hellRains.forEach((rain) => {
      rain.meteors.forEach((meteor) => {
        if (meteor.flightProgress > 0 && !meteor.hasImpacted) {
          renderList.push({
            y: meteor.currentY,
            draw: () => this.drawHellMeteorBody(ctx, meteor),
          });
        }
      });
    });

    // Monolitos de hielo prismático y agujas de la erupción de Glaciar Devastador (Hielo + Hielo + Hielo)
    devastatingGlaciers.forEach((glacier) => {
      glacier.monoliths.forEach((monolith) => {
        if (monolith.flightProgress > 0 && !monolith.hasImpacted) {
          renderList.push({
            y: monolith.currentY,
            draw: () => this.drawIceMonolithBody(ctx, monolith),
          });
        }
      });

      if (glacier.eruptionTriggered && glacier.spikes.length > 0) {
        glacier.spikes.forEach((spike) => {
          if (spike.height > 0) {
            const sy = glacier.centerY + Math.sin(spike.angle) * spike.dist * 0.58;
            renderList.push({
              y: sy,
              draw: () => this.drawRadialIceSpike(ctx, glacier.centerX, glacier.centerY, spike),
            });
          }
        });
      }
    });

    // Monolitos de roca orbitales de la Barrera Telúrica (Tierra + Tierra + Tierra) integrados en el Depth Sorting
    telluricBarriers.forEach((barrier) => {
      if (!barrier.finished) {
        barrier.rocks.forEach((rock) => {
          if (!rock.destroyed) {
            renderList.push({
              y: rock.y,
              draw: () => this.drawTelluricRockBody(ctx, rock, barrier),
            });
          }
        });
      }
    });

    // Cuchillas monumentales de vidrio volcánico de Volcán de Obsidiana (Fuego + Hielo + Tierra) integradas en Depth Sorting
    obsidianVolcanoes.forEach((volcano) => {
      if (!volcano.finished && (volcano.phase === 'vitrification' || volcano.phase === 'active_field' || volcano.phase === 'shattering')) {
        volcano.blades.forEach((blade) => {
          renderList.push({
            y: blade.y,
            draw: () => this.drawObsidianBladeBody(ctx, blade, volcano),
          });
        });
      }
    });

    // Pilares criotécnicos de Prisión Conductora (Rayo + Hielo + Tierra) integrados en Depth Sorting
    conductivePrisons.forEach((prison) => {
      if (prison.phase !== 'finished') {
        prison.pillars.forEach((pillar) => {
          if (!pillar.destroyed) {
            renderList.push({
              y: pillar.y,
              draw: () => this.drawConductivePrisonPillar(ctx, pillar, prison),
            });
          }
        });
      }
    });

    // Núcleos de Sobrecarga (Fuego + Rayo + Tierra) integrados en Depth Sorting
    overloadCores.forEach((core) => {
      if (core.phase !== 'finished') {
        renderList.push({
          y: core.currentY,
          draw: () => this.drawOverloadCoreEntity(ctx, core),
        });
      }
    });

    // Tormentas de Plasma Glacial (Fuego + Rayo + Hielo) integradas en Depth Sorting
    glacialPlasmaStorms.forEach((storm) => {
      if (storm.phase !== 'finished') {
        renderList.push({
          y: storm.y,
          draw: () => this.drawGlacialPlasmaStormBody(ctx, storm),
        });
      }
    });

    // Cataclismo Elemental (Fuego + Rayo + Hielo + Tierra: 4 Fases Devastadoras)
    elementalCataclysms.forEach((cataclysm) => {
      if (cataclysm.phase !== 'finished') {
        renderList.push({
          y: cataclysm.y,
          draw: () => this.drawElementalCataclysmBody(ctx, cataclysm),
        });
      }
    });

    // Alud de Agujas Telúricas (Hielo + Hielo + Tierra) integradas en Depth Sorting
    glacialAvalanches.forEach((avalanche) => {
      if (!avalanche.finished) {
        avalanche.spikes.forEach((spike) => {
          if (spike.height > 0) {
            renderList.push({
              y: spike.y,
              draw: () => this.drawGlacialAvalancheSpike(ctx, spike, avalanche),
            });
          }
        });
      }
    });

    // Carámbanos cayendo de la Lluvia de Granizo Hirviente (Hielo + Hielo + Fuego) integrados en Depth Sorting
    boilingHails.forEach((hail) => {
      if (!hail.finished) {
        hail.icicles.forEach((icicle) => {
          if (!icicle.hasImpacted && hail.elapsedMs >= icicle.delayMs) {
            renderList.push({
              y: icicle.currentY,
              draw: () => this.drawBoilingHailIcicle(ctx, icicle),
            });
          }
        });
      }
    });

    // Pilón de Pararrayos (Rayo + Rayo + Tierra) integrado en Depth Sorting
    lightningRodPylons.forEach((pylon) => {
      if (!pylon.finished) {
        renderList.push({
          y: pylon.y,
          draw: () => this.drawLightningRodPylonObelisk(ctx, pylon),
        });
      }
    });

    // Bomba de Plasma Inestable (Rayo + Rayo + Fuego) integrada en Depth Sorting
    plasmaHyperOrbs.forEach((orb) => {
      if (!orb.finished) {
        renderList.push({
          y: orb.currentY,
          draw: () => this.drawPlasmaHyperOrb(ctx, orb),
        });
      }
    });

    // Megalito Volcánico Rodante (Tierra + Tierra + Fuego) integrado en Depth Sorting
    rollingMagmaBoulders.forEach((boulder) => {
      if (!boulder.finished) {
        renderList.push({
          y: boulder.currentY,
          draw: () => this.drawRollingMagmaBoulder(ctx, boulder),
        });
      }
    });

    // Fortaleza Glacial de Picos (Tierra + Tierra + Hielo) integrada en Depth Sorting
    glacialBastions.forEach((bastion) => {
      if (!bastion.finished) {
        renderList.push({
          y: bastion.centerY,
          draw: () => this.drawGlacialBastionSpikes(ctx, bastion),
        });
      }
    });

    // Supernova Primordial (Fuego x4) en Depth Sorting
    primordialSupernovas.forEach((sn) => {
      if (!sn.finished) {
        renderList.push({
          y: sn.currentY,
          draw: () => this.drawPrimordialSupernovaOrb(ctx, sn),
        });
      }
    });

    // Cataclismo Tectónico (Tierra x4) en Depth Sorting
    tectonicCataclysms.forEach((tc) => {
      if (!tc.finished) {
        renderList.push({
          y: tc.centerY,
          draw: () => this.drawTectonicCataclysmMonoliths(ctx, tc),
        });
      }
    });

    // Meteoro de Plasma Cinético (Fuego x3 + Rayo) en Depth Sorting
    kineticPlasmaMeteors.forEach((m) => {
      if (!m.finished) {
        renderList.push({
          y: m.currentY,
          draw: () => this.drawKineticPlasmaMeteor(ctx, m),
        });
      }
    });

    // Cometa de Frío Abrasador (Fuego x3 + Hielo) en Depth Sorting
    frostburnComets.forEach((c) => {
      if (!c.finished) {
        renderList.push({
          y: c.currentY,
          draw: () => this.drawFrostburnComet(ctx, c),
        });
      }
    });

    // Tempestad Solar (Rayo x3 + Fuego) en Depth Sorting
    solarArcTempests.forEach((sat) => {
      if (!sat.finished) {
        renderList.push({
          y: sat.originY,
          draw: () => this.drawSolarArcTempestBeams(ctx, sat),
        });
      }
    });

    // Rayo Criogénico Puro (Rayo x3 + Hielo) en Depth Sorting
    cryoLightningStorms.forEach((cls) => {
      if (!cls.finished) {
        renderList.push({
          y: cls.originY,
          draw: () => this.drawCryoLightningStormStrikes(ctx, cls),
        });
      }
    });

    // Martillo de Thor Tectónico (Rayo x3 + Tierra) en Depth Sorting
    tectonicLightningHammers.forEach((tlh) => {
      if (!tlh.finished) {
        renderList.push({
          y: tlh.targetY,
          draw: () => this.drawTectonicLightningHammerPillar(ctx, tlh),
        });
      }
    });

    // Ventisca Ígnea (Hielo x3 + Fuego) en Depth Sorting
    moltenBlizzards.forEach((mb) => {
      if (!mb.finished) {
        renderList.push({
          y: mb.centerY,
          draw: () => this.drawMoltenBlizzardWeather(ctx, mb),
        });
      }
    });

    // Glaciar Tectónico (Hielo x3 + Tierra) en Depth Sorting
    tectonicGlacierWalls.forEach((tgw) => {
      if (!tgw.finished) {
        const wallY = tgw.originY + Math.sin(tgw.aimAngle) * tgw.currentDist * 0.58;
        renderList.push({
          y: wallY,
          draw: () => this.drawTectonicGlacierWallMoving(ctx, tgw),
        });
      }
    });

    // Mago (Jugador)
    primordialMagmaBastions.forEach((entity) => {
      renderList.push({ y: wizard.y + 1, draw: () => this.drawPrimordialMagmaBastion(ctx, wizard.x, wizard.y, entity) });
    });
    eternalPermafrostFortresses.forEach((entity) => {
      renderList.push({ y: wizard.y - 2, draw: () => this.drawEternalPermafrostFortress(ctx, wizard.x, wizard.y, entity) });
    });
    magneticTelluricSpires.forEach((entity) => {
      renderList.push({ y: entity.targetY, draw: () => this.drawMagneticTelluricSpire(ctx, entity) });
    });

    // Mago (Jugador)
    renderList.push({
      y: wizard.y,
      draw: () => this.drawWizard(ctx, wizard),
    });

    // Enemigos y Jefes (Frustum Culling optimizado con margen de seguridad de 100px)
    enemies.forEach((enemy) => {
      if ((forestLevel || tilemap) && !isInFrustum(enemy.x, enemy.y, enemy.radius + 100, frustum)) return;
      renderList.push({
        y: enemy.y,
        draw: () => this.drawEnemy(ctx, enemy),
      });
    });

    // Ordenar por coordenada Y ascendente
    renderList.sort((a, b) => a.y - b.y);

    // Ejecutar dibujo ordenado de entidades con aislamiento seguro
    renderList.forEach((item) => {
      try {
        item.draw();
      } catch (err) {
        console.error('TaskQuest renderer: error drawing entity in renderList:', err);
      }
    });

    // 5.5 Dibujar Chorro Elemental Continuo (Flujo de Llamas / Chorro Criogénico)
    if (wizard.channeledStream && wizard.channeledStream.active) {
      this.drawChanneledStream(ctx, wizard, wizard.channeledStream);
    }

    // 5.6 Dibujar Llamas Vivas de Corona Infernal en 2.5D (Fuego + Fuego)
    this.drawInfernalCrownFlames(ctx, infernalCrowns);

    // 6. Dibujar Proyectiles con SILUETAS FÍSICAS DIFERENCIADAS (Fuego, Rayo, Hielo, Tierra, etc.)
    this.drawProjectiles(ctx, projectiles);

    // Dibujar Rayos Eléctricos Instantáneos y Ramificados con Chispas
    this.drawLightningBolts(ctx, lightningBolts);

    // 6.2 Dibujar Relámpagos Verticales y Destellos de Tormenta Celestial (Rayo + Rayo + Rayo)
    this.drawCelestialStormStrikes(ctx, celestialStorms);

    // 6.5 Dibujar Rayos Criogénicos (Hielo + Rayo) Penetrantes con Núcleo Gélido y Espirales Voltaicas
    this.drawCryoBeams(ctx, wizard, cryoBeams);

    // 6.6 Dibujar Haz de Fusión Solar (Fuego + Fuego + Rayo) de Plasma Instantáneo
    this.drawSolarFusionBeams(ctx, solarFusionBeams);

    // 6.7 Dibujar Tormenta Crioelectrostática (Hielo + Hielo + Rayo): Anillo Giratorio de Copos y Relámpagos
    this.drawSuperconductorBlizzardVortex(ctx, superconductorBlizzards);

    // 6.8 Dibujar Arcos Radiales de Pilón de Pararrayos (Rayo + Rayo + Tierra)
    this.drawLightningRodPylonArcs(ctx, lightningRodPylons);

    // 6.9 Dibujar Rayos Dentados y Esquirlas de Descarga Cero Absoluto (Rayo + Rayo + Hielo)
    this.drawCryoArcFlashVortex(ctx, cryoArcFlashes);

    // 6.91 Dibujar Crestas Concéntricas y Relámpagos de Fisura Resonante (Tierra + Tierra + Rayo)
    this.drawResonantQuakeArches(ctx, resonantQuakes);

    // 7. Dibujar Partículas
    this.drawParticles(ctx, particles);

    // 8. Dibujar Textos Flotantes
    this.drawFloatingTexts(ctx, floatingTexts);

    // 8.5 Capa Superior: Canopy de Árboles (Oclusión suave al pasar por debajo) y Hojas Ambientales
    if (forestLevel) {
      this.drawCanopyLayer(ctx, frustum, forestLevel.trees);
      this.drawAmbientLeaves(ctx, frustum, forestLevel.ambientLeaves);
    }

    // Niebla de guerra sobre todo lo no explorado: bloques opacos de borde escalonado.
    // Se dibuja al final de la escena para ocultar también enemigos y objetos a distancia.
    if (tilemap && exploredTiles) {
      this.drawFogOfWar(ctx, tilemap, frustum, exploredTiles);
    }

    // El pilar se dibuja sobre la escena y las copas para que no quede oculto en el bosque.
    this.drawThundergodJudgmentBeam(ctx, thundergodJudgments);

    ctx.restore(); // Fin del espacio transformado con Zoom

    // 8.6 Capa de Escarcha Pantalla Completa de Era Glacial (Hielo x4)
    this.drawAbsoluteZeroAgeOverlay(ctx, width, height, absoluteZeroAges);

    // 8.8 Indicadores de Peligro en el Borde de Pantalla (Off-Screen Danger Clamps)
    this.drawOffScreenDangerClamps(ctx, camera, width, height, 1.32, wizard, projectiles, enemies);

    // 9. Barra de Salud Superior del Jefe (si hay un jefe activo en la sala o cerca del jugador en mapa abierto)
    if (currentBoss && currentBoss.hp > 0) {
      const showHUD = (!forestLevel && !tilemap) || currentBoss.hp < currentBoss.maxHp || Math.hypot(currentBoss.x - wizard.x, currentBoss.y - wizard.y) < 1300;
      if (showHUD) {
        this.drawBossHUD(ctx, width, currentBoss);
      }
    }

    ctx.restore(); // Fin de screen shake
  }

  private static drawFogOfWar(
    ctx: CanvasRenderingContext2D,
    tilemap: Tilemap,
    frustum: FrustumBounds,
    exploredTiles: ReadonlySet<string>
  ): void {
    const tileSize = 64;
    const minCol = Math.max(0, Math.floor(frustum.left / tileSize) - 1);
    const maxCol = Math.min(tilemap.cols - 1, Math.ceil(frustum.right / tileSize) + 1);
    const minRow = Math.max(0, Math.floor(frustum.top / tileSize) - 1);
    const maxRow = Math.min(tilemap.rows - 1, Math.ceil(frustum.bottom / tileSize) + 1);

    ctx.save();
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (exploredTiles.has(`${col}:${row}`)) continue;
        const x = col * tileSize;
        const y = row * tileSize;
        ctx.fillStyle = '#05070b';
        ctx.fillRect(x, y, tileSize, tileSize);
        // Escalones morados mínimos en el borde: retro 16 bits, sin degradados costosos.
        const leftSeen = exploredTiles.has(`${col - 1}:${row}`);
        const topSeen = exploredTiles.has(`${col}:${row - 1}`);
        ctx.fillStyle = '#121827';
        if (leftSeen) { ctx.fillRect(x, y + 8, 5, 48); ctx.fillRect(x + 5, y + 16, 3, 32); }
        if (topSeen) { ctx.fillRect(x + 8, y, 48, 5); ctx.fillRect(x + 16, y + 5, 32, 3); }
      }
    }
    ctx.restore();
  }

  /**
   * Indicadores de Advertencia Perimetral (Off-Screen Danger Clamps):
   * Proyectiles rápidos y ataques telegrafiados fuera de pantalla se proyectan en el borde del Canvas
   * con chevrons parpadeantes y badges de exclamación '!'.
   * Desaparecen de inmediato cuando la amenaza entra al campo visual normal.
   */
  private static drawOffScreenDangerClamps(
    ctx: CanvasRenderingContext2D,
    camera: { x: number; y: number },
    width: number,
    height: number,
    zoom: number,
    wizard: { x: number; y: number },
    projectiles: Projectile[],
    enemies: GameEnemy[]
  ): void {
    const cx = width / 2;
    const cy = height / 2;
    const pad = 28;
    const minX = pad;
    const maxX = width - pad;
    const minY = pad;
    const maxY = height - pad;
    const now = Date.now();
    const pulse = 0.65 + 0.35 * Math.sin(now * 0.018);

    // 1. Proyectiles hostiles fuera del encuadre
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.isHostile) continue;

      const sx = (p.x - camera.x) * zoom + cx;
      const sy = (p.y - camera.y) * zoom + cy;

      // Si ya está visible en pantalla, no dibujar marcador
      if (sx >= 14 && sx <= width - 14 && sy >= 14 && sy <= height - 14) continue;

      // Distancia máxima de amenaza (~1300 px de mundo)
      const dist = Math.hypot(p.x - wizard.x, p.y - wizard.y);
      if (dist > 1300) continue;

      const dx = sx - cx;
      const dy = sy - cy;
      if (dx === 0 && dy === 0) continue;

      let tX = Infinity;
      if (dx > 0) tX = (maxX - cx) / dx;
      else if (dx < 0) tX = (minX - cx) / dx;

      let tY = Infinity;
      if (dy > 0) tY = (maxY - cy) / dy;
      else if (dy < 0) tY = (minY - cy) / dy;

      const t = Math.min(tX, tY);
      const clampX = cx + t * dx;
      const clampY = cy + t * dy;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(clampX, clampY);
      ctx.rotate(angle);

      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;

      // Chevron afilado apuntando hacia la amenaza fuera de pantalla
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-7, -8);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-7, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // 2. Ataques telegrafiados pesados fuera del encuadre
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isTelegraphing || e.hp <= 0) continue;

      const sx = (e.x - camera.x) * zoom + cx;
      const sy = (e.y - camera.y) * zoom + cy;

      if (sx >= 14 && sx <= width - 14 && sy >= 14 && sy <= height - 14) continue;

      const dist = Math.hypot(e.x - wizard.x, e.y - wizard.y);
      if (dist > 1400) continue;

      const dx = sx - cx;
      const dy = sy - cy;
      if (dx === 0 && dy === 0) continue;

      let tX = Infinity;
      if (dx > 0) tX = (maxX - cx) / dx;
      else if (dx < 0) tX = (minX - cx) / dx;

      let tY = Infinity;
      if (dy > 0) tY = (maxY - cy) / dy;
      else if (dy < 0) tY = (minY - cy) / dy;

      const t = Math.min(tX, tY);
      const clampX = cx + t * dx;
      const clampY = cy + t * dy;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(clampX, clampY);

      // Chevron dorado/ámbar telegrafiado
      ctx.save();
      ctx.rotate(angle);
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(245, 158, 11, ${pulse})`;
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(-8, -9);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-8, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Badge circular con '!' de peligro inminente (orientado verticalmente)
      ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.beginPath();
      ctx.arc(0, -14, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, -14);

      ctx.restore();
    }
  }

  // Suelo de baldosas de piedra con límites y ambientación según sala
  private static drawDungeonFloor(ctx: CanvasRenderingContext2D, roomType: RoomType) {
    const minX = 70;
    const maxX = 1030;
    const minY = 70;
    const maxY = 690;

    // Color del suelo según la atmósfera de la sala
    const floorColors: Record<string, string> = {
      entrance: '#131522',
      combat_swarm: '#151724',
      hazard_traps: '#0e1624',
      crossfire: '#161426',
      relic_sanctuary: '#1a1829',
      boss_basalt: '#1a1816',
      boss_storm: '#161928',
      boss_dragon: '#201210',
    };

    ctx.fillStyle = floorColors[roomType] || '#11131f';
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

    // Baldosas de piedra con relieve sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const tileSize = 45;
    for (let x = minX; x <= maxX; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
      ctx.stroke();
    }
    for (let y = minY; y <= maxY; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();
    }

    // Muros exteriores de piedra maciza con runas
    ctx.strokeStyle = roomType.startsWith('boss') ? '#7c2d12' : '#2b314a';
    ctx.lineWidth = 10;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    // Antorchas en las esquinas
    const torches = [
      { x: minX + 30, y: minY + 30 },
      { x: maxX - 30, y: minY + 30 },
      { x: minX + 30, y: maxY - 30 },
      { x: maxX - 30, y: maxY - 30 },
    ];
    torches.forEach((t) => {
      const grad = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, 50);
      grad.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
      grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Dibuja Zonas de Terreno (Magma, Hielo, Charcos, Vapor)
  private static drawTerrainZones(ctx: CanvasRenderingContext2D, zones: TerrainZone[]) {
    zones.forEach((z) => {
      const alpha = Math.min(1, z.life / 30);
      ctx.save();
      ctx.globalAlpha = alpha;

      if (z.zoneType === 'magma') {
        const grad = ctx.createRadialGradient(z.x, z.y, 5, z.x, z.y, z.radius);
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.6, '#ea580c');
        grad.addColorStop(1, 'rgba(180, 83, 9, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(z.x - z.radius * 0.6, z.y - z.radius * 0.3);
        ctx.lineTo(z.x, z.y + z.radius * 0.2);
        ctx.lineTo(z.x + z.radius * 0.7, z.y - z.radius * 0.2);
        ctx.stroke();
      } else if (z.zoneType === 'frost') {
        const grad = ctx.createRadialGradient(z.x, z.y, 5, z.x, z.y, z.radius);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
        grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (z.zoneType === 'water') {
        const grad = ctx.createRadialGradient(z.x, z.y, 5, z.x, z.y, z.radius);
        grad.addColorStop(0, 'rgba(2, 132, 199, 0.65)');
        grad.addColorStop(1, 'rgba(3, 105, 161, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (z.zoneType === 'steam') {
        ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // Dibuja Arcos Eléctricos entre Cristales
  private static drawElectricArcs(ctx: CanvasRenderingContext2D, arcs: ElectricArc[]) {
    arcs.forEach((arc) => {
      ctx.save();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(arc.x1, arc.y1);
      const segments = 4;
      for (let s = 1; s < segments; s++) {
        const ratio = s / segments;
        const mx = arc.x1 + (arc.x2 - arc.x1) * ratio;
        const my = arc.y1 + (arc.y2 - arc.y1) * ratio;
        const offset = (Math.random() - 0.5) * 14;
        ctx.lineTo(mx + offset, my + offset);
      }
      ctx.lineTo(arc.x2, arc.y2);
      ctx.stroke();

      ctx.restore();
    });
  }

  // Dibuja el suelo rúnico, estallido y cráter calcinado del Pilar Ígneo (Fases 1, 2, 3)
  private static drawInfernalCrownFloor(ctx: CanvasRenderingContext2D, crowns: InfernalCrownEntity[]) {
    if (!crowns || crowns.length === 0) return;

    crowns.forEach((crown) => {
      ctx.save();
      ctx.translate(crown.x, crown.y);

      const squish = 0.58;

      if (crown.phase === 'preparation') {
        const prog = Math.min(1, crown.phaseTimer / crown.prepDurationMs);
        const r = 15 + (crown.maxRadius - 15) * prog;
        const pulse = Math.sin(crown.phaseTimer * 0.025);
        const alpha = 0.45 + pulse * 0.25;

        // 1. Resplandor radial naranja cálido en perspectiva isométrica (#FBBF24 / rgba(245, 158, 11))
        const glowGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, r * 1.15);
        glowGrad.addColorStop(0, `rgba(254, 240, 138, ${alpha * 0.85})`);
        glowGrad.addColorStop(0.5, `rgba(245, 158, 11, ${alpha * 0.6})`);
        glowGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.15, r * 1.15 * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Anillo rúnico exterior
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * squish, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Anillo interior punteado concéntrico
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.72, r * 0.72 * squish, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4. Glifo rúnico interior giratorio (estrella triangular de ignición)
        const rot = crown.phaseTimer * 0.006;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a1 = rot + (i / 3) * Math.PI * 2;
          const a2 = rot + ((i + 1) / 3) * Math.PI * 2;
          const x1 = Math.cos(a1) * (r * 0.55);
          const y1 = Math.sin(a1) * (r * 0.55) * squish;
          const x2 = Math.cos(a2) * (r * 0.55);
          const y2 = Math.sin(a2) * (r * 0.55) * squish;
          if (i === 0) ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.stroke();

        // Glifo triangular invertido entrelazado
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a1 = -rot + Math.PI / 3 + (i / 3) * Math.PI * 2;
          const a2 = -rot + Math.PI / 3 + ((i + 1) / 3) * Math.PI * 2;
          const x1 = Math.cos(a1) * (r * 0.55);
          const y1 = Math.sin(a1) * (r * 0.55) * squish;
          const x2 = Math.cos(a2) * (r * 0.55);
          const y2 = Math.sin(a2) * (r * 0.55) * squish;
          if (i === 0) ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.stroke();

        // 5. Núcleo incandescente central
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4 + prog * 4, (4 + prog * 4) * squish, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (crown.phase === 'detonation') {
        // FASE 2 DETONACIÓN: Destello explosivo blanco-oro en el suelo y onda de choque
        const prog = Math.min(1, crown.phaseTimer / crown.detonationDurationMs);
        const flashAlpha = Math.max(0, 1 - prog * 0.9);
        const r = crown.maxRadius;

        // Flash central
        const flashGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.3);
        flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
        flashGrad.addColorStop(0.35, `rgba(254, 240, 138, ${flashAlpha * 0.9})`);
        flashGrad.addColorStop(0.7, `rgba(234, 88, 12, ${flashAlpha * 0.6})`);
        flashGrad.addColorStop(1, 'rgba(153, 27, 27, 0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.3, r * 1.3 * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Anillo de choque expansivo en suelo
        const ringProg = Math.min(1, crown.phaseTimer / 200);
        const shockR = r * (0.6 + ringProg * 0.75);
        ctx.strokeStyle = `rgba(254, 240, 138, ${Math.max(0, 1 - ringProg)})`;
        ctx.lineWidth = 3.5 * (1 - ringProg * 0.6);
        ctx.beginPath();
        ctx.ellipse(0, 0, shockR, shockR * squish, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Suelo agrietado fundiéndose
        crown.crackAngles.forEach((ang) => {
          const len = r * 0.9;
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len * squish);
          ctx.stroke();
        });
      } else if (crown.phase === 'ring') {
        // FASE 3: CRÁTER DE SUELO ARDIENTE RESIDUAL (600 a 3000 ms)
        const r = crown.maxRadius;
        const totalDuration = crown.ringDurationMs;
        const remainProg = Math.max(0, (totalDuration - crown.phaseTimer) / totalDuration);
        const alpha = Math.min(1, remainProg * 1.4); // Desvanecimiento suave al final

        ctx.globalAlpha = alpha;

        // 1. Superficie de suelo tiznada/calcinada (#1C1917)
        const ashGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, r * 1.1);
        ashGrad.addColorStop(0, 'rgba(28, 25, 23, 0.92)'); // #1C1917
        ashGrad.addColorStop(0.65, 'rgba(41, 37, 36, 0.78)');
        ashGrad.addColorStop(0.9, 'rgba(68, 64, 60, 0.4)');
        ashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = ashGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.1, r * 1.1 * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Núcleo de magma incandescente enfriándose progresivamente
        const coolFactor = Math.max(0, remainProg);
        const magmaColor = coolFactor > 0.5 ? '#f97316' : '#ea580c';
        const innerMagma = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.7);
        innerMagma.addColorStop(0, coolFactor > 0.6 ? 'rgba(254, 240, 138, 0.85)' : 'rgba(249, 115, 22, 0.6)');
        innerMagma.addColorStop(0.5, `rgba(234, 88, 12, ${0.4 * coolFactor})`);
        innerMagma.addColorStop(1, 'rgba(28, 25, 23, 0)');
        ctx.fillStyle = innerMagma;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.7, r * 0.7 * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Grietas de magma residual al rojo vivo
        crown.crackAngles.forEach((ang, idx) => {
          const len = r * (0.45 + (idx % 3) * 0.2);
          ctx.strokeStyle = magmaColor;
          ctx.lineWidth = 2.2 * coolFactor;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * (r * 0.1), Math.sin(ang) * (r * 0.1) * squish);
          const midX = Math.cos(ang + 0.1) * (len * 0.5);
          const midY = Math.sin(ang + 0.1) * (len * 0.5) * squish;
          const endX = Math.cos(ang - 0.05) * len;
          const endY = Math.sin(ang - 0.05) * len * squish;
          ctx.lineTo(midX, midY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Filamento brillante si aún está caliente
          if (coolFactor > 0.4) {
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.0 * coolFactor;
            ctx.stroke();
          }
        });

        // 4. Borde del cráter tiznado
        ctx.strokeStyle = `rgba(120, 53, 15, ${0.4 * coolFactor})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * squish, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  // Dibuja Obstáculos Físicos (Pilares, Estacas de Permafrost, Puertas, Cofres)
  private static drawObstacle(ctx: CanvasRenderingContext2D, obs: PhysicalObstacle) {
    ctx.save();

    // Sombra en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(obs.x, obs.y + obs.radius * 0.7, obs.radius * 1.1, obs.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. PUERTA DE LA SALA (DOOR GATE)
    if (obs.obstacleType === 'vessel') {
      // Cerámica en bloques con cuello, borde y asas. Doradas: rayo; curativas: corazón.
      const x = Math.round(obs.x), y = Math.round(obs.y);
      ctx.fillStyle = '#151525';
      ctx.fillRect(x - 12, y - 38, 24, 10);
      ctx.fillRect(x - 20, y - 27, 40, 27);
      ctx.fillRect(x - 14, y, 28, 6);
      ctx.fillStyle = obs.color;
      ctx.fillRect(x - 8, y - 34, 16, 12);
      ctx.fillRect(x - 16, y - 24, 32, 25);
      ctx.fillRect(x - 10, y + 1, 20, 3);
      ctx.fillRect(x - 23, y - 24, 5, 16);
      ctx.fillRect(x + 18, y - 24, 5, 16);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x - 12, y - 33, 24, 4);
      ctx.fillRect(x - 12, y - 21, 4, 16);
      ctx.fillStyle = '#172033';
      if (obs.vesselReward === 'charged') {
        ctx.fillRect(x + 1, y - 22, 5, 8);
        ctx.fillRect(x - 3, y - 15, 8, 4);
        ctx.fillRect(x - 3, y - 12, 4, 7);
      } else {
        ctx.fillRect(x - 4, y - 20, 5, 5); ctx.fillRect(x + 3, y - 20, 5, 5);
        ctx.fillRect(x - 4, y - 15, 12, 4); ctx.fillRect(x, y - 11, 4, 4);
      }
    }
    else if (obs.obstacleType === 'door_gate') {
      const isLocked = obs.doorLocked;
      ctx.fillStyle = isLocked ? '#7f1d1d' : '#14532d';
      ctx.fillRect(obs.x - obs.width / 2, obs.y - 12, obs.width, 24);

      ctx.strokeStyle = isLocked ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 3;
      ctx.strokeRect(obs.x - obs.width / 2, obs.y - 12, obs.width, 24);

      // Icono / Símbolo de la puerta
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isLocked ? '🔒' : '🚪✨', obs.x, obs.y);
    }
    // 2. COFRE DE RELIQUIAS (RELIC CHEST)
    else if (obs.obstacleType === 'relic_chest') {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(obs.x - 22, obs.y - 20, 44, 32);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.strokeRect(obs.x - 22, obs.y - 20, 44, 32);

      // Cerradura dorada brillante
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(obs.x, obs.y - 4, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎁', obs.x, obs.y - 28);
    }
    // 3. ESTACA GLACIAL DE PERMAFROST (HIELO + TIERRA)
    else if (obs.obstacleType === 'permafrost_spike') {
      // Roca basal cubierta de cristales puntiagudos
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(obs.x - 16, obs.y + 6);
      ctx.lineTo(obs.x, obs.y - 32);
      ctx.lineTo(obs.x + 16, obs.y + 6);
      ctx.closePath();
      ctx.fill();

      // Capa de hielo afilada
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(obs.x - 12, obs.y + 2);
      ctx.lineTo(obs.x, obs.y - 36);
      ctx.lineTo(obs.x + 12, obs.y + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // 4. PILAR DE ROCA MACIZA (ROCK PILLAR)
    else if (obs.obstacleType === 'rock_pillar') {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(obs.x, obs.y - 14, obs.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(obs.x - obs.radius, obs.y - 14, obs.radius * 2, 22);
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(obs.x, obs.y - 24, obs.radius * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    // 5. CRISTALES ENERGIZADOS
    else if (obs.obstacleType === 'energized_crystal') {
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y - 30);
      ctx.lineTo(obs.x + 13, obs.y - 8);
      ctx.lineTo(obs.x, obs.y + 6);
      ctx.lineTo(obs.x - 13, obs.y - 8);
      ctx.closePath();
      ctx.fill();
    }
    // 6. CAJAS DE MADERA DESTRUCTIBLES
    else if (obs.obstacleType === 'crate') {
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(obs.x - obs.radius, obs.y - obs.radius - 8, obs.radius * 2, obs.radius * 2);
      ctx.strokeStyle = '#ca8a04';
      ctx.strokeRect(obs.x - obs.radius, obs.y - obs.radius - 8, obs.radius * 2, obs.radius * 2);
      ctx.beginPath();
      ctx.moveTo(obs.x - obs.radius, obs.y - obs.radius - 8);
      ctx.lineTo(obs.x + obs.radius, obs.y + obs.radius - 8);
      ctx.stroke();
    }
    // 7. ESCOMBROS TEMPORALES DE PUÑO TECTÓNICO (TIERRA + TIERRA)
    else if (obs.obstacleType === 'tectonic_rubble') {
      const isExpiring = obs.lifeTimer !== undefined && obs.lifeTimer < 450;
      const jitter = isExpiring ? (Math.random() - 0.5) * 3 : 0;
      const rx = obs.x + jitter;
      const ry = obs.y;
      const r = obs.radius;

      // Roca angular poliédrica
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.moveTo(rx - r * 0.9, ry + 2);
      ctx.lineTo(rx - r * 0.7, ry - r * 1.2);
      ctx.lineTo(rx + r * 0.1, ry - r * 1.5);
      ctx.lineTo(rx + r * 0.85, ry - r * 0.9);
      ctx.lineTo(rx + r * 0.95, ry + 2);
      ctx.closePath();
      ctx.fill();

      // Faceta frontal iluminada
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.moveTo(rx - r * 0.7, ry - r * 1.2);
      ctx.lineTo(rx + r * 0.1, ry - r * 1.5);
      ctx.lineTo(rx + r * 0.2, ry - 2);
      ctx.lineTo(rx - r * 0.5, ry + 2);
      ctx.closePath();
      ctx.fill();

      // Borde de cresta superior
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(rx - r * 0.7, ry - r * 1.2);
      ctx.lineTo(rx + r * 0.1, ry - r * 1.5);
      ctx.lineTo(rx + r * 0.85, ry - r * 0.9);
      ctx.stroke();

      // Veta sísmica de energía telúrica (ámbar / oro)
      const pulseAlpha = isExpiring ? (0.6 + 0.4 * Math.sin(Date.now() * 0.03)) : 0.75;
      ctx.strokeStyle = `rgba(245, 158, 11, ${pulseAlpha})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(rx - 2, ry - r * 1.3);
      ctx.lineTo(rx + 4, ry - r * 0.7);
      ctx.lineTo(rx - 3, ry);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    // 8. BARRILES DESTRUCTIBLES DEL BOSQUE
    else if (obs.obstacleType === 'barrel') {
      const bx = obs.x;
      const by = obs.y - 10;
      const bw = obs.radius * 1.8;
      const bh = obs.radius * 2.2;
      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(bx, obs.y + 2, obs.radius * 1.1, obs.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cuerpo del barril (madera oscura con duelas)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 5);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Aros metálicos de hierro
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(bx - bw / 2 + 1, by - bh * 0.25);
      ctx.lineTo(bx + bw / 2 - 1, by - bh * 0.25);
      ctx.moveTo(bx - bw / 2 + 1, by + bh * 0.25);
      ctx.lineTo(bx + bw / 2 - 1, by + bh * 0.25);
      ctx.stroke();
      // Tapa superior de madera
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.ellipse(bx, by - bh / 2, bw * 0.44, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 9. CARPA DE EXPEDICIÓN DEL CAMPAMENTO
    else if (obs.obstacleType === 'camp_tent') {
      const tx = obs.x;
      const ty = obs.y;
      // Sombra proyectada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(tx, ty + 10, obs.width * 0.55, obs.height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      // Carpa triangular de lona
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(tx - obs.width / 2, ty + 12);
      ctx.lineTo(tx, ty - obs.height + 12);
      ctx.lineTo(tx + obs.width / 2, ty + 12);
      ctx.closePath();
      ctx.fill();
      // Cara iluminada izquierda
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(tx - obs.width / 2, ty + 12);
      ctx.lineTo(tx, ty - obs.height + 12);
      ctx.lineTo(tx, ty + 12);
      ctx.closePath();
      ctx.fill();
      // Entrada de la carpa
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(tx - 12, ty + 12);
      ctx.lineTo(tx, ty - 18);
      ctx.lineTo(tx + 12, ty + 12);
      ctx.closePath();
      ctx.fill();
      // Cuerdas de sujeción
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, ty - obs.height + 12);
      ctx.lineTo(tx - obs.width * 0.65, ty + 16);
      ctx.moveTo(tx, ty - obs.height + 12);
      ctx.lineTo(tx + obs.width * 0.65, ty + 16);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Dibuja al Mago (Jugador)
  private static drawWizard(
    ctx: CanvasRenderingContext2D,
    wizard: {
      x: number;
      y: number;
      facingAngle: number;
      isMoving: boolean;
      animFrame: number;
      hitFlash: number;
      staffOrbColor: string;
      isDashing?: boolean;
      dashTimer?: number;
      dashTrail?: Array<{ x: number; y: number; facingAngle: number; alpha: number }>;
      isCharging?: boolean;
      chargeRatio?: number;
      chargeType?: string;
      channelLockTimer?: number;
      channeledStream?: ChanneledStreamState | null;
      isCursed?: boolean;
      hasLightningAura?: boolean;
      invulnerableTimer?: number;
      isRespawning?: boolean;
      respawnFadeTimer?: number;
      victoryScale?: number;
      vx?: number;
      vy?: number;
      recoilX?: number;
      recoilY?: number;
      castFlashColor?: string;
      activeElement?: 'fire' | 'lightning' | 'earth' | 'ice' | 'plasma' | 'magma';
      staffCastTimer?: number;
    }
  ) {
    // 1. Estela fantasmal durante la esquiva (Dash Afterimages)
    if (wizard.dashTrail && wizard.dashTrail.length > 0) {
      wizard.dashTrail.forEach((trail) => {
        ctx.save();
        ctx.translate(trail.x, trail.y);
        ctx.globalAlpha = Math.max(0, trail.alpha * 0.45);
        drawWizardSprite({
          ctx,
          x: 0,
          y: 0,
          scale: 1.15,
          facingAngle: trail.facingAngle,
          isMoving: true,
        });
        ctx.restore();
      });
    }

    ctx.save();
    ctx.translate(wizard.x, wizard.y);

    // 2. Aura y Runa de Carga Mágica a los pies del mago
    if (wizard.isCharging) {
      const ratio = wizard.chargeRatio || 0;
      const isReady = ratio >= 1.0;
      const isLightning = wizard.chargeType === 'lightning' || wizard.staffOrbColor === '#38bdf8' || wizard.staffOrbColor === '#facc15';
      ctx.save();
      const auraColor = isReady ? (isLightning ? '#38bdf8' : '#facc15') : wizard.staffOrbColor || '#38bdf8';
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = isReady ? 3.5 : 2;
      ctx.shadowColor = auraColor;
      ctx.shadowBlur = isReady ? 18 : 8;

      // Anillo rúnico en el suelo
      ctx.beginPath();
      ctx.ellipse(0, 8, 22 + ratio * 10, 11 + ratio * 5, Date.now() * 0.003, 0, Math.PI * 2);
      ctx.stroke();

      // Círculo secundario interior
      ctx.beginPath();
      ctx.ellipse(0, 8, 12 + ratio * 6, 6 + ratio * 3, -Date.now() * 0.004, 0, Math.PI * 2);
      ctx.stroke();

      // Destellos mágicos que convergen hacia el báculo
      const numSparks = isReady ? (isLightning ? 8 : 6) : 4;
      for (let i = 0; i < numSparks; i++) {
        const ang = Date.now() * (isLightning ? 0.009 : 0.006) + (i * Math.PI * 2) / numSparks;
        const progress = ((Date.now() * (isLightning ? 0.006 : 0.004) + i * 0.2) % 1);
        const r = (1 - progress) * (26 + ratio * 12);
        ctx.fillStyle = isReady ? (isLightning ? '#ffffff' : '#facc15') : '#38bdf8';
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * r, -10 + Math.sin(ang) * r * 0.4, 2 + (isReady ? 1.5 : 0), 0, Math.PI * 2);
        ctx.fill();
      }

      // Arcos eléctricos específicos de Sobrecarga Voltaica
      if (isLightning) {
        ctx.shadowBlur = 0;
        const arcCount = isReady ? 5 : Math.max(1, Math.floor(ratio * 3.5));
        for (let a = 0; a < arcCount; a++) {
          const aAng = Date.now() * 0.008 + a * 1.5;
          const aDist = 14 + (a % 3) * 8;
          const ax1 = Math.cos(aAng) * aDist;
          const ay1 = -10 + Math.sin(aAng) * (aDist * 0.6);
          const ax2 = ax1 + (Math.random() - 0.5) * 14;
          const ay2 = ay1 + (Math.random() - 0.5) * 14;
          const midAx = (ax1 + ax2) / 2 + (Math.random() - 0.5) * 8;
          const midAy = (ay1 + ay2) / 2 + (Math.random() - 0.5) * 8;

          ctx.strokeStyle = isReady ? '#ffffff' : '#38bdf8';
          ctx.lineWidth = isReady ? 2.2 : 1.4;
          ctx.beginPath();
          ctx.moveTo(ax1, ay1);
          ctx.lineTo(midAx, midAy);
          ctx.lineTo(ax2, ay2);
          ctx.stroke();
        }

        // Esfera de plasma en el báculo al alcanzar carga máxima
        if (isReady) {
          const staffX = Math.cos(wizard.facingAngle) * 16;
          const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
          const pulseR = 7 + Math.sin(Date.now() * 0.02) * 2;
          const plasmaGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2);
          plasmaGrad.addColorStop(0, '#ffffff');
          plasmaGrad.addColorStop(0.35, '#38bdf8');
          plasmaGrad.addColorStop(0.7, '#0284c7');
          plasmaGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
          ctx.fillStyle = plasmaGrad;
          ctx.beginPath();
          ctx.arc(staffX, staffY, pulseR * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Cristales de escarcha y aura glacial específicos de Erupción Glacial
      const isIce = wizard.chargeType === 'ice' || wizard.staffOrbColor === '#06b6d4';
      if (isIce) {
        ctx.shadowBlur = 0;
        const iceCount = isReady ? 6 : Math.max(2, Math.floor(ratio * 5));
        for (let ic = 0; ic < iceCount; ic++) {
          const icAng = Date.now() * 0.005 + (ic * Math.PI * 2) / iceCount;
          const icDist = 18 + ratio * 8;
          const ix = Math.cos(icAng) * icDist;
          const iy = 8 + Math.sin(icAng) * (icDist * 0.58);

          ctx.save();
          ctx.translate(ix, iy);
          ctx.rotate(icAng + Math.PI / 2);
          ctx.fillStyle = isReady ? '#e0f7fa' : '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(0, -7);
          ctx.lineTo(2.5, 3);
          ctx.lineTo(0, 5);
          ctx.lineTo(-2.5, 3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Esfera de hielo puro y escarcha en el báculo al alcanzar carga máxima
        if (isReady) {
          const staffX = Math.cos(wizard.facingAngle) * 16;
          const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
          const pulseR = 7 + Math.sin(Date.now() * 0.02) * 2;
          const frostGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.2);
          frostGrad.addColorStop(0, '#ffffff');
          frostGrad.addColorStop(0.4, '#e0f7fa');
          frostGrad.addColorStop(0.75, '#06b6d4');
          frostGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          ctx.fillStyle = frostGrad;
          ctx.beginPath();
          ctx.arc(staffX, staffY, pulseR * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Esquirlas de roca y runa sísmica ámbar para Puño Tectónico (Tierra + Tierra)
      const isEarth = wizard.chargeType === 'earth' || wizard.staffOrbColor === '#d97706';
      if (isEarth) {
        ctx.shadowBlur = 0;
        const stoneCount = isReady ? 6 : Math.max(2, Math.floor(ratio * 5));
        for (let sc = 0; sc < stoneCount; sc++) {
          const scAng = Date.now() * 0.004 + (sc * Math.PI * 2) / stoneCount;
          const scDist = 18 + ratio * 8;
          const sx = Math.cos(scAng) * scDist;
          const sy = 8 + Math.sin(scAng) * (scDist * 0.58);

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(scAng + Math.PI / 4);
          ctx.fillStyle = isReady ? '#fef08a' : '#d97706';
          ctx.fillRect(-3, -3, 6, 6);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1;
          ctx.strokeRect(-3, -3, 6, 6);
          ctx.restore();
        }

        // Esfera de energía telúrica y ámbar dorado en el báculo al alcanzar carga máxima
        if (isReady) {
          const staffX = Math.cos(wizard.facingAngle) * 16;
          const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
          const pulseR = 7 + Math.sin(Date.now() * 0.02) * 2;
          const earthGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.2);
          earthGrad.addColorStop(0, '#ffffff');
          earthGrad.addColorStop(0.35, '#fef08a');
          earthGrad.addColorStop(0.75, '#d97706');
          earthGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
          ctx.fillStyle = earthGrad;
          ctx.beginPath();
          ctx.arc(staffX, staffY, pulseR * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Escarcha boreal y chispas de plasma violeta/cobalto para Rayo Criogénico (Hielo + Rayo)
      const isCryo = wizard.chargeType === 'cryo';
      if (isCryo) {
        ctx.shadowBlur = 0;
        const cryoCount = isReady ? 8 : Math.max(3, Math.floor(ratio * 6));
        for (let cc = 0; cc < cryoCount; cc++) {
          const ccAng = Date.now() * 0.007 + (cc * Math.PI * 2) / cryoCount;
          const ccDist = 20 + ratio * 10;
          const cx = Math.cos(ccAng) * ccDist;
          const cy = 8 + Math.sin(ccAng) * (ccDist * 0.58);

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(ccAng);
          // Alternar entre fragmento de hielo cyan y chispa de plasma violeta
          if (cc % 2 === 0) {
            ctx.fillStyle = isReady ? '#ffffff' : '#00f0ff';
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(3, 2);
            ctx.lineTo(0, 4);
            ctx.lineTo(-3, 2);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = isReady ? '#e0e7ff' : '#a855f7';
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Esfera binaria de plasma helado en el báculo al cargar
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 9 : 5 + ratio * 3) + Math.sin(Date.now() * 0.02) * 1.5;
        const cryoGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.2);
        cryoGrad.addColorStop(0, '#ffffff');
        cryoGrad.addColorStop(0.3, '#00f0ff');
        cryoGrad.addColorStop(0.65, isReady ? '#7c4dff' : '#0284c7');
        cryoGrad.addColorStop(1, 'rgba(124, 77, 255, 0)');
        ctx.fillStyle = cryoGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Si está en sobrecarga completa (listo para +50% de daño), micro-chispas de plasma
        if (isReady) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          for (let sp = 0; sp < 3; sp++) {
            const spAng = Math.random() * Math.PI * 2;
            const spR1 = pulseR * 0.8;
            const spR2 = pulseR * 1.6;
            ctx.beginPath();
            ctx.moveTo(staffX + Math.cos(spAng) * spR1, staffY + Math.sin(spAng) * spR1);
            ctx.lineTo(staffX + Math.cos(spAng + 0.3) * spR2, staffY + Math.sin(spAng + 0.3) * spR2);
            ctx.stroke();
          }
        }
      }

      // Magma incandescente y esquirlas volcánicas para Bombardeo Volcánico (Fuego + Tierra)
      const isVolcanic = wizard.chargeType === 'volcanic';
      if (isVolcanic) {
        ctx.shadowBlur = 0;
        const magmaCount = isReady ? 8 : Math.max(3, Math.floor(ratio * 7));
        for (let mc = 0; mc < magmaCount; mc++) {
          const mcAng = Date.now() * 0.006 + (mc * Math.PI * 2) / magmaCount;
          const mcDist = 18 + ratio * 10;
          const mx = Math.cos(mcAng) * mcDist;
          const my = 8 + Math.sin(mcAng) * (mcDist * 0.58);

          ctx.save();
          ctx.translate(mx, my);
          ctx.rotate(mcAng + Math.PI / 4);
          ctx.fillStyle = isReady ? '#fff176' : (mc % 2 === 0 ? '#ff6d00' : '#d50000');
          ctx.fillRect(-2.5, -2.5, 5, 5);
          ctx.strokeStyle = '#261c14';
          ctx.lineWidth = 1;
          ctx.strokeRect(-2.5, -2.5, 5, 5);
          ctx.restore();
        }

        // Esfera de magma solar en el báculo al cargar
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 9 : 5 + ratio * 3) + Math.sin(Date.now() * 0.02) * 1.5;
        const magmaGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.2);
        magmaGrad.addColorStop(0, '#ffffff');
        magmaGrad.addColorStop(0.25, '#fff176');
        magmaGrad.addColorStop(0.65, '#ff6d00');
        magmaGrad.addColorStop(0.9, '#d50000');
        magmaGrad.addColorStop(1, 'rgba(213, 0, 0, 0)');
        ctx.fillStyle = magmaGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Chispas ígneas y micro-destellos alrededor del báculo si está en sobrecarga
        if (isReady) {
          ctx.strokeStyle = '#fff176';
          ctx.lineWidth = 1.3;
          for (let sp = 0; sp < 3; sp++) {
            const spAng = Math.random() * Math.PI * 2;
            const spR1 = pulseR * 0.8;
            const spR2 = pulseR * 1.6;
            ctx.beginPath();
            ctx.moveTo(staffX + Math.cos(spAng) * spR1, staffY + Math.sin(spAng) * spR1);
            ctx.lineTo(staffX + Math.cos(spAng + 0.3) * spR2, staffY + Math.sin(spAng + 0.3) * spR2);
            ctx.stroke();
          }
        }
      }

      // Resplandor dual de fuego y hielo para Vórtice de Choque Térmico (Fuego + Hielo)
      const isThermal = wizard.chargeType === 'thermal';
      if (isThermal) {
        ctx.shadowBlur = 0;
        const sparkCount = isReady ? 8 : Math.max(3, Math.floor(ratio * 7));
        for (let sc = 0; sc < sparkCount; sc++) {
          const scAng = Date.now() * (sc % 2 === 0 ? 0.007 : -0.007) + (sc * Math.PI * 2) / sparkCount;
          const scDist = 18 + ratio * 10;
          const sx = Math.cos(scAng) * scDist;
          const sy = 8 + Math.sin(scAng) * (scDist * 0.58);

          ctx.save();
          ctx.translate(sx, sy);
          ctx.fillStyle = sc % 2 === 0 ? (isReady ? '#ffffff' : '#ff6d00') : (isReady ? '#80d8ff' : '#06b6d4');
          ctx.beginPath();
          ctx.arc(0, 0, isReady ? 2.8 : 2.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Esfera dual de colisión térmica en el báculo al cargar
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 9 : 5 + ratio * 3) + Math.sin(Date.now() * 0.02) * 1.5;
        const thermalGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.2);
        thermalGrad.addColorStop(0, '#ffffff');
        thermalGrad.addColorStop(0.3, '#80d8ff');
        thermalGrad.addColorStop(0.65, '#ff6d00');
        thermalGrad.addColorStop(0.9, '#f43f5e');
        thermalGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.fillStyle = thermalGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        if (isReady) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          for (let sp = 0; sp < 3; sp++) {
            const spAng = Math.random() * Math.PI * 2;
            const spR1 = pulseR * 0.8;
            const spR2 = pulseR * 1.6;
            ctx.beginPath();
            ctx.moveTo(staffX + Math.cos(spAng) * spR1, staffY + Math.sin(spAng) * spR1);
            ctx.lineTo(staffX + Math.cos(spAng + 0.3) * spR2, staffY + Math.sin(spAng + 0.3) * spR2);
            ctx.stroke();
          }
        }
      }

      // Resplandor telúrico y electro-magnético para Jaula de Pilares Conductores (Rayo + Tierra)
      const isConductive = wizard.chargeType === 'conductive';
      if (isConductive) {
        ctx.shadowBlur = 0;
        const sparkCount = isReady ? 8 : Math.max(3, Math.floor(ratio * 7));
        for (let sc = 0; sc < sparkCount; sc++) {
          const scAng = Date.now() * (sc % 2 === 0 ? 0.008 : -0.008) + (sc * Math.PI * 2) / sparkCount;
          const scDist = 18 + ratio * 10;
          const sx = Math.cos(scAng) * scDist;
          const sy = 8 + Math.sin(scAng) * (scDist * 0.58);

          ctx.save();
          ctx.translate(sx, sy);
          ctx.fillStyle = sc % 2 === 0 ? (isReady ? '#fef08a' : '#eab308') : (isReady ? '#ffffff' : '#38bdf8');
          ctx.beginPath();
          ctx.rect(-1.5, -1.5, isReady ? 3.2 : 2.2, isReady ? 3.2 : 2.2);
          ctx.fill();
          ctx.restore();
        }

        // Esfera de resonancia de cuarzo y arcos en la punta del báculo
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 9 : 5 + ratio * 3) + Math.sin(Date.now() * 0.02) * 1.5;
        const condGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.2);
        condGrad.addColorStop(0, '#ffffff');
        condGrad.addColorStop(0.3, '#fde047');
        condGrad.addColorStop(0.65, '#eab308');
        condGrad.addColorStop(0.9, '#38bdf8');
        condGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = condGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Micro-arcos voltaicos alrededor de la gema del báculo
        ctx.strokeStyle = isReady ? '#ffffff' : '#fef08a';
        ctx.lineWidth = 1.2;
        const arcCount = isReady ? 4 : 2;
        for (let sp = 0; sp < arcCount; sp++) {
          const spAng = Math.random() * Math.PI * 2;
          const spR1 = pulseR * 0.7;
          const spR2 = pulseR * 1.7;
          ctx.beginPath();
          ctx.moveTo(staffX + Math.cos(spAng) * spR1, staffY + Math.sin(spAng) * spR1);
          ctx.lineTo(staffX + Math.cos(spAng + 0.35) * spR2, staffY + Math.sin(spAng + 0.35) * spR2);
          ctx.stroke();
        }
      }

      // Resplandor glacio-tectónico para Prisión de Permafrost (Hielo + Tierra)
      const isPermafrost = wizard.chargeType === 'permafrost';
      if (isPermafrost) {
        ctx.shadowBlur = 0;
        const crystalCount = isReady ? 8 : Math.max(3, Math.floor(ratio * 7));
        for (let sc = 0; sc < crystalCount; sc++) {
          const scAng = Date.now() * (sc % 2 === 0 ? 0.007 : -0.007) + (sc * Math.PI * 2) / crystalCount;
          const scDist = 18 + ratio * 10;
          const sx = Math.cos(scAng) * scDist;
          const sy = 8 + Math.sin(scAng) * (scDist * 0.58);

          ctx.save();
          ctx.translate(sx, sy);
          ctx.fillStyle = sc % 2 === 0 ? (isReady ? '#ffffff' : '#00e5ff') : (isReady ? '#80d8ff' : '#37474f');
          ctx.beginPath();
          ctx.moveTo(0, -3.2);
          ctx.lineTo(2.2, 0);
          ctx.lineTo(0, 3.2);
          ctx.lineTo(-2.2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Esfera de permafrost y escarcha densa en la punta del báculo
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 9.5 : 5.5 + ratio * 3) + Math.sin(Date.now() * 0.02) * 1.5;
        const frostGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.2);
        frostGrad.addColorStop(0, '#ffffff');
        frostGrad.addColorStop(0.3, '#00e5ff');
        frostGrad.addColorStop(0.7, '#0284c7');
        frostGrad.addColorStop(0.9, '#37474f');
        frostGrad.addColorStop(1, 'rgba(55, 71, 79, 0)');
        ctx.fillStyle = frostGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Destellos de hielo gélido
        if (isReady) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          for (let sp = 0; sp < 4; sp++) {
            const spAng = Math.random() * Math.PI * 2;
            const spR1 = pulseR * 0.6;
            const spR2 = pulseR * 1.6;
            ctx.beginPath();
            ctx.moveTo(staffX + Math.cos(spAng) * spR1, staffY + Math.sin(spAng) * spR1);
            ctx.lineTo(staffX + Math.cos(spAng + 0.25) * spR2, staffY + Math.sin(spAng + 0.25) * spR2);
            ctx.stroke();
          }
        }
      }

      // Resplandor de plasma ígneo y vórtice de sobrecalentamiento para Tornado de Plasma (Fuego + Rayo)
      const isPlasma = wizard.chargeType === 'plasma';
      if (isPlasma) {
        ctx.shadowBlur = 0;
        const sparkCount = isReady ? 8 : Math.max(3, Math.floor(ratio * 7));
        for (let sc = 0; sc < sparkCount; sc++) {
          const scAng = Date.now() * (sc % 2 === 0 ? 0.01 : -0.01) + (sc * Math.PI * 2) / sparkCount;
          const scDist = 18 + ratio * 10;
          const sx = Math.cos(scAng) * scDist;
          const sy = 8 + Math.sin(scAng) * (scDist * 0.58);

          ctx.save();
          ctx.translate(sx, sy);
          ctx.fillStyle = sc % 2 === 0 ? (isReady ? '#ffffff' : '#00e5ff') : (isReady ? '#ffea00' : '#ff6d00');
          ctx.beginPath();
          ctx.arc(0, 0, isReady ? 2.8 : 2.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Núcleo de plasma en la punta del báculo
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 9.5 : 5.5 + ratio * 3) + Math.sin(Date.now() * 0.02) * 1.5;
        const plasmaGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.2);
        plasmaGrad.addColorStop(0, '#ffffff');
        plasmaGrad.addColorStop(0.35, '#00e5ff');
        plasmaGrad.addColorStop(0.7, '#ff6d00');
        plasmaGrad.addColorStop(0.95, '#7c4dff');
        plasmaGrad.addColorStop(1, 'rgba(124, 77, 255, 0)');
        ctx.fillStyle = plasmaGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Filamentos helicoidales de arco voltaico
        ctx.strokeStyle = isReady ? '#ffffff' : '#ffea00';
        ctx.lineWidth = 1.2;
        const arcCount = isReady ? 4 : 2;
        for (let sp = 0; sp < arcCount; sp++) {
          const spAng = Math.random() * Math.PI * 2;
          const spR1 = pulseR * 0.7;
          const spR2 = pulseR * 1.7;
          ctx.beginPath();
          ctx.moveTo(staffX + Math.cos(spAng) * spR1, staffY + Math.sin(spAng) * spR1);
          ctx.lineTo(staffX + Math.cos(spAng + 0.35) * spR2, staffY + Math.sin(spAng + 0.35) * spR2);
          ctx.stroke();
        }
      }

      // Ascensión ígnea y chispas cósmicas para Lluvia del Infierno (Fuego + Fuego + Fuego)
      const isHellRain = wizard.chargeType === 'hell_rain';
      if (isHellRain) {
        ctx.shadowBlur = 0;
        const sparkCount = isReady ? 10 : Math.max(4, Math.floor(ratio * 9));
        for (let sc = 0; sc < sparkCount; sc++) {
          const scAng = Date.now() * (sc % 2 === 0 ? 0.012 : -0.012) + (sc * Math.PI * 2) / sparkCount;
          const scDist = 20 + ratio * 12;
          const sx = Math.cos(scAng) * scDist;
          const sy = 8 + Math.sin(scAng) * (scDist * 0.58);

          ctx.save();
          ctx.translate(sx, sy);
          ctx.fillStyle = sc % 2 === 0 ? '#ffd600' : '#ff3d00';
          ctx.beginPath();
          ctx.arc(0, 0, isReady ? 3.0 : 2.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Foco cósmico incandescente en la punta del báculo
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 10.5 : 6.0 + ratio * 3.5) + Math.sin(Date.now() * 0.02) * 1.5;
        const hellGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.4);
        hellGrad.addColorStop(0, '#ffffff');
        hellGrad.addColorStop(0.35, '#ffd600');
        hellGrad.addColorStop(0.75, '#ff3d00');
        hellGrad.addColorStop(1, 'rgba(255, 61, 0, 0)');
        ctx.fillStyle = hellGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Descargas celestiales y chispas de alta tensión para Tormenta Celestial (Rayo + Rayo + Rayo)
      const isCelestial = wizard.chargeType === 'celestial';
      if (isCelestial) {
        ctx.shadowBlur = 0;
        const sparkCount = isReady ? 12 : Math.max(5, Math.floor(ratio * 10));
        for (let sc = 0; sc < sparkCount; sc++) {
          const scAng = Date.now() * (sc % 2 === 0 ? 0.015 : -0.015) + (sc * Math.PI * 2) / sparkCount;
          const scDist = 18 + ratio * 14;
          const sx = Math.cos(scAng) * scDist;
          const sy = 6 + Math.sin(scAng) * (scDist * 0.58);

          ctx.save();
          ctx.translate(sx, sy);
          ctx.fillStyle = sc % 2 === 0 ? '#ffffff' : (sc % 3 === 0 ? '#7c4dff' : '#00f0ff');
          ctx.beginPath();
          ctx.arc(0, 0, isReady ? 2.8 : 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Foco de plasma electromagnético en la punta del báculo
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 11 : 6.0 + ratio * 4.0) + Math.sin(Date.now() * 0.025) * 1.5;
        const celGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.5);
        celGrad.addColorStop(0, '#ffffff');
        celGrad.addColorStop(0.35, '#00f0ff');
        celGrad.addColorStop(0.7, '#7c4dff');
        celGrad.addColorStop(1, 'rgba(124, 77, 255, 0)');
        ctx.fillStyle = celGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mini arcos voltaicos parpadeantes alrededor del mago
        if (Math.random() < 0.6) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          const arcAng = Math.random() * Math.PI * 2;
          const r1 = 10 + Math.random() * 8;
          const r2 = 20 + Math.random() * 8;
          ctx.moveTo(staffX + Math.cos(arcAng) * r1, staffY + Math.sin(arcAng) * r1 * 0.58);
          ctx.lineTo(staffX + Math.cos(arcAng + 0.35) * r2, staffY + Math.sin(arcAng + 0.35) * r2 * 0.58);
          ctx.stroke();
        }
      }

      // Vórtice de escarcha ártica y cristales para Glaciar Devastador (Hielo + Hielo + Hielo)
      const isGlacier = wizard.chargeType === 'glacier';
      if (isGlacier) {
        ctx.shadowBlur = 0;
        const flakeCount = isReady ? 12 : Math.max(5, Math.floor(ratio * 10));
        for (let fc = 0; fc < flakeCount; fc++) {
          const fcAng = Date.now() * (fc % 2 === 0 ? 0.014 : -0.014) + (fc * Math.PI * 2) / flakeCount;
          const fcDist = 19 + ratio * 13;
          const fx = Math.cos(fcAng) * fcDist;
          const fy = 6 + Math.sin(fcAng) * (fcDist * 0.58);

          ctx.save();
          ctx.translate(fx, fy);
          ctx.fillStyle = fc % 2 === 0 ? '#ffffff' : '#00e5ff';
          ctx.beginPath();
          ctx.arc(0, 0, isReady ? 2.6 : 1.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Foco de hielo puro brillante en la punta del báculo
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 11 : 6.0 + ratio * 3.8) + Math.sin(Date.now() * 0.02) * 1.5;
        const iceGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.5);
        iceGrad.addColorStop(0, '#ffffff');
        iceGrad.addColorStop(0.35, '#80d8ff');
        iceGrad.addColorStop(0.75, '#00e5ff');
        iceGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = iceGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Torbellino geomántico de rocas y runas doradas para Barrera Telúrica (Tierra + Tierra + Tierra)
      const isTelluric = wizard.chargeType === 'telluric';
      if (isTelluric) {
        ctx.shadowBlur = 0;
        const pebbleCount = isReady ? 12 : Math.max(5, Math.floor(ratio * 10));
        for (let pc = 0; pc < pebbleCount; pc++) {
          const pcAng = Date.now() * (pc % 2 === 0 ? 0.013 : -0.013) + (pc * Math.PI * 2) / pebbleCount;
          const pcDist = 18 + ratio * 14;
          const px = Math.cos(pcAng) * pcDist;
          const py = 6 + Math.sin(pcAng) * (pcDist * 0.58);

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(pcAng);
          ctx.fillStyle = pc % 2 === 0 ? (isReady ? '#fef08a' : '#f59e0b') : (isReady ? '#d97706' : '#3e2723');
          ctx.beginPath();
          ctx.rect(-2, -2, isReady ? 4 : 2.8, isReady ? 4 : 2.8);
          ctx.fill();
          ctx.strokeStyle = isReady ? '#fffbeb' : '#78350f';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        }

        // Foco de energía telúrica y oro arcano en la punta del báculo
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 11 : 6.0 + ratio * 3.8) + Math.sin(Date.now() * 0.02) * 1.5;
        const telluricGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.5);
        telluricGrad.addColorStop(0, '#ffffff');
        telluricGrad.addColorStop(0.35, '#fde047');
        telluricGrad.addColorStop(0.7, '#d97706');
        telluricGrad.addColorStop(0.95, '#451a03');
        telluricGrad.addColorStop(1, 'rgba(69, 26, 3, 0)');
        ctx.fillStyle = telluricGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Choque térmico y vórtice de vidrio volcánico para Volcán de Obsidiana (Fuego + Hielo + Tierra)
      const isObsidian = wizard.chargeType === 'obsidian';
      if (isObsidian) {
        ctx.shadowBlur = 0;
        const shardCount = isReady ? 14 : Math.max(6, Math.floor(ratio * 12));
        for (let sc = 0; sc < shardCount; sc++) {
          const isFire = sc % 3 === 0;
          const isIce = sc % 3 === 1;
          const shardAng = Date.now() * (sc % 2 === 0 ? 0.014 : -0.014) + (sc * Math.PI * 2) / shardCount;
          const shardDist = 20 + ratio * 16;
          const sx = Math.cos(shardAng) * shardDist;
          const sy = 6 + Math.sin(shardAng) * (shardDist * 0.58);

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(shardAng);

          if (isFire) {
            ctx.fillStyle = isReady ? '#ffedd5' : '#ea580c';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 4;
          } else if (isIce) {
            ctx.fillStyle = isReady ? '#e0f2fe' : '#38bdf8';
            ctx.shadowColor = '#0284c7';
            ctx.shadowBlur = 4;
          } else {
            // Fragmento de obsidiana negra
            ctx.fillStyle = '#09090b';
            ctx.strokeStyle = isReady ? '#c026d3' : '#71717a';
            ctx.lineWidth = 0.9;
          }

          ctx.beginPath();
          ctx.moveTo(0, -3.5);
          ctx.lineTo(2.5, 0);
          ctx.lineTo(0, 3.5);
          ctx.lineTo(-2.5, 0);
          ctx.closePath();
          ctx.fill();
          if (!isFire && !isIce) ctx.stroke();
          ctx.restore();
        }

        // Foco térmico en la punta del báculo (magma + permafrost vitrificando)
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 12 : 7.0 + ratio * 4.0) + Math.sin(Date.now() * 0.025) * 1.6;
        const obsGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.6);
        obsGrad.addColorStop(0, '#ffffff');
        obsGrad.addColorStop(0.3, isReady ? '#fbcfe8' : '#fed7aa');
        obsGrad.addColorStop(0.6, isReady ? '#c026d3' : '#ea580c');
        obsGrad.addColorStop(0.85, '#0f172a');
        obsGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = obsGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Malla crioconductora y arcos voltaicos para Prisión Conductora (Rayo + Hielo + Tierra)
      const isConductivePrison = wizard.chargeType === 'conductive_prison';
      if (isConductivePrison) {
        ctx.shadowBlur = 0;
        const nodeCount = isReady ? 6 : 4;
        const arcPhase = Date.now() * 0.008;

        for (let nc = 0; nc < nodeCount; nc++) {
          const nAng = arcPhase + (nc * Math.PI * 2) / nodeCount;
          const nDist = 20 + ratio * 14;
          const nx = Math.cos(nAng) * nDist;
          const ny = 6 + Math.sin(nAng) * (nDist * 0.58);

          // Mini pilar holográfico en la base
          ctx.save();
          ctx.translate(nx, ny);
          ctx.fillStyle = nc % 2 === 0 ? (isReady ? '#80d8ff' : '#00e5ff') : (isReady ? '#b388ff' : '#7c4dff');
          ctx.shadowColor = nc % 2 === 0 ? '#00e5ff' : '#7c4dff';
          ctx.shadowBlur = isReady ? 6 : 3;

          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(2.5, 0);
          ctx.lineTo(0, 3);
          ctx.lineTo(-2.5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Rayo en zig-zag conectando con el siguiente nodo
          const nextAng = arcPhase + ((nc + 1) * Math.PI * 2) / nodeCount;
          const nextNx = Math.cos(nextAng) * nDist;
          const nextNy = 6 + Math.sin(nextAng) * (nDist * 0.58);

          ctx.strokeStyle = isReady ? '#ffffff' : '#80d8ff';
          ctx.lineWidth = isReady ? 1.4 : 0.9;
          ctx.beginPath();
          ctx.moveTo(nx, ny - 4);
          const midX = (nx + nextNx) * 0.5 + (Math.random() - 0.5) * 4;
          const midY = (ny + nextNy) * 0.5 - 4 + (Math.random() - 0.5) * 3;
          ctx.lineTo(midX, midY);
          ctx.lineTo(nextNx, nextNy - 4);
          ctx.stroke();
        }

        // Foco de energía de alto voltaje en la punta del báculo
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 12 : 6.5 + ratio * 4.0) + Math.sin(Date.now() * 0.03) * 1.5;
        const cpGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.5);
        cpGrad.addColorStop(0, '#ffffff');
        cpGrad.addColorStop(0.3, isReady ? '#e0f7fa' : '#80d8ff');
        cpGrad.addColorStop(0.65, isReady ? '#b388ff' : '#7c4dff');
        cpGrad.addColorStop(0.9, '#263238');
        cpGrad.addColorStop(1, 'rgba(38, 50, 56, 0)');
        ctx.fillStyle = cpGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Vórtice de plasma ígneo, magnetismo y esquirlas orbitales de Núcleo de Sobrecarga (Fuego + Rayo + Tierra)
      const isOverloadCore = wizard.chargeType === 'overload_core';
      if (isOverloadCore) {
        ctx.shadowBlur = 0;
        const shardCount = isReady ? 5 : 3;
        const orbitPhase = Date.now() * 0.009;
        for (let sc = 0; sc < shardCount; sc++) {
          const sAng = orbitPhase + (sc * Math.PI * 2) / shardCount;
          const sDist = 18 + ratio * 16;
          const sx = Math.cos(sAng) * sDist;
          const sy = 4 + Math.sin(sAng) * (sDist * 0.58);

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(sAng + Math.PI / 4);
          ctx.fillStyle = sc % 2 === 0 ? '#ff6d00' : '#ffd600';
          ctx.shadowColor = sc % 2 === 0 ? '#ff3d00' : '#ffff00';
          ctx.shadowBlur = isReady ? 8 : 4;
          ctx.beginPath();
          ctx.moveTo(0, -4);
          ctx.lineTo(3, 0);
          ctx.lineTo(0, 4);
          ctx.lineTo(-3, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Arco de descarga eléctrica al mago
          if (Math.random() < 0.35) {
            ctx.strokeStyle = isReady ? '#fff59d' : '#ffab00';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo((Math.random() - 0.5) * 6, -8 + (Math.random() - 0.5) * 6);
            ctx.stroke();
          }
        }

        // Foco de energía de plasma sobrecalentado en el báculo
        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;
        const pulseR = (isReady ? 13 : 7.0 + ratio * 4.5) + Math.sin(Date.now() * 0.035) * 1.8;
        const ocGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.6);
        ocGrad.addColorStop(0, '#ffffff');
        ocGrad.addColorStop(0.25, isReady ? '#ffff8d' : '#ffe082');
        ocGrad.addColorStop(0.6, isReady ? '#ff6d00' : '#ff9100');
        ocGrad.addColorStop(0.85, '#d50000');
        ocGrad.addColorStop(1, 'rgba(213, 0, 0, 0)');
        ctx.fillStyle = ocGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Vórtice tri-elemental y orbes entrelazados para Tormenta de Plasma Glacial (Fuego + Rayo + Hielo)
      const isGlacialPlasma = wizard.chargeType === 'glacial_plasma';
      if (isGlacialPlasma) {
        ctx.shadowBlur = 0;
        const triadCount = 3;
        const orbitPhase = Date.now() * 0.008;
        const orbColors = ['#00e5ff', '#ff6d00', '#b388ff'];
        const orbGlows = ['#80d8ff', '#ffab00', '#7c4dff'];

        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -12 + Math.sin(wizard.facingAngle) * 10;

        for (let tc = 0; tc < triadCount; tc++) {
          const tAng = orbitPhase + (tc * Math.PI * 2) / triadCount;
          const tDist = 20 + ratio * 16;
          const tx = Math.cos(tAng) * tDist;
          const ty = 4 + Math.sin(tAng) * (tDist * 0.58);

          ctx.save();
          ctx.translate(tx, ty);
          ctx.fillStyle = orbColors[tc];
          ctx.shadowColor = orbGlows[tc];
          ctx.shadowBlur = isReady ? 10 : 5;
          ctx.beginPath();
          ctx.arc(0, 0, isReady ? 5.5 : 3.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Arco de plasma saltando al báculo
          if (Math.random() < 0.45) {
            ctx.strokeStyle = tc === 0 ? '#80d8ff' : (tc === 1 ? '#ffd54f' : '#ffffff');
            ctx.lineWidth = isReady ? 1.4 : 0.9;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            const midX = (tx + staffX) * 0.5 + (Math.random() - 0.5) * 5;
            const midY = (ty + staffY) * 0.5 + (Math.random() - 0.5) * 5;
            ctx.lineTo(midX, midY);
            ctx.lineTo(staffX, staffY);
            ctx.stroke();
          }
        }

        // Foco de energía tri-elemental en la punta del báculo
        const pulseR = (isReady ? 14 : 7.5 + ratio * 4.5) + Math.sin(Date.now() * 0.035) * 1.8;
        const gpsGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, pulseR * 2.7);
        gpsGrad.addColorStop(0, '#ffffff');
        gpsGrad.addColorStop(0.25, isReady ? '#e0f7fa' : '#80d8ff');
        gpsGrad.addColorStop(0.55, isReady ? '#ff6d00' : '#ff9100');
        gpsGrad.addColorStop(0.85, '#7c4dff');
        gpsGrad.addColorStop(1, 'rgba(124, 77, 255, 0)');
        ctx.fillStyle = gpsGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, pulseR * 2.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Torbellino tetra-elemental y runa primordial de Cataclismo Elemental (Fuego + Rayo + Hielo + Tierra)
      const isCataclysm = wizard.chargeType === 'cataclysm' || (wizard.channelLockTimer && wizard.channelLockTimer > 0);
      if (isCataclysm) {
        ctx.shadowBlur = 0;
        const quadCount = 4;
        const orbitPhase = Date.now() * 0.009;
        const orbColors = ['#ff6d00', '#ffd600', '#00e5ff', '#ffb300'];
        const orbGlows = ['#d50000', '#d500f9', '#80d8ff', '#8d6e63'];

        const staffX = Math.cos(wizard.facingAngle) * 16;
        const staffY = -14 + Math.sin(wizard.facingAngle) * 10;

        // Runa tetra-elemental girando a los pies del mago
        const runeR = 26 + ratio * 14;
        ctx.save();
        ctx.translate(0, 8);
        ctx.scale(1, 0.58);
        ctx.rotate(Date.now() * 0.004);
        ctx.strokeStyle = isReady ? 'rgba(236, 72, 153, 0.85)' : 'rgba(251, 191, 36, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, runeR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 4 orbes elementales en órbita
        for (let qc = 0; qc < quadCount; qc++) {
          const qAng = orbitPhase + (qc * Math.PI * 2) / quadCount;
          const qDist = 24 + ratio * 18;
          const qx = Math.cos(qAng) * qDist;
          const qy = 2 + Math.sin(qAng) * (qDist * 0.58);

          ctx.save();
          ctx.translate(qx, qy);
          ctx.fillStyle = orbColors[qc];
          ctx.shadowColor = orbGlows[qc];
          ctx.shadowBlur = isReady ? 12 : 7;
          ctx.beginPath();
          ctx.arc(0, 0, isReady ? 6 : 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Filamento de arco de plasma al báculo
          if (Math.random() < 0.5) {
            ctx.strokeStyle = orbColors[qc];
            ctx.lineWidth = isReady ? 1.5 : 1.0;
            ctx.beginPath();
            ctx.moveTo(qx, qy);
            const mx = (qx + staffX) * 0.5 + (Math.random() - 0.5) * 6;
            const my = (qy + staffY) * 0.5 + (Math.random() - 0.5) * 6;
            ctx.lineTo(mx, my);
            ctx.lineTo(staffX, staffY);
            ctx.stroke();
          }
        }

        // Foco de energía cósmico en la cúspide del báculo
        const catPulseR = (isReady ? 16 : 9 + ratio * 5) + Math.sin(Date.now() * 0.04) * 2;
        const catGrad = ctx.createRadialGradient(staffX, staffY, 1, staffX, staffY, catPulseR * 2.8);
        catGrad.addColorStop(0, '#ffffff');
        catGrad.addColorStop(0.25, '#ec4899');
        catGrad.addColorStop(0.55, '#00e5ff');
        catGrad.addColorStop(0.85, '#ffb300');
        catGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = catGrad;
        ctx.beginPath();
        ctx.arc(staffX, staffY, catPulseR * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    if (wizard.hitFlash > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.beginPath();
      ctx.arc(0, -10, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    // Aura de Maldición por Incumplimiento (Miasma sutil morado/oscuro al pie y cuerpo del mago)
    if (wizard.isCursed) {
      ctx.save();
      const curseTime = performance.now() * 0.003;
      const pulse = Math.sin(curseTime * 2) * 3;
      
      // Halo radial espectral oscuro
      const auraGrad = ctx.createRadialGradient(0, -10, 6, 0, -10, 26 + pulse);
      auraGrad.addColorStop(0, 'rgba(126, 34, 206, 0.45)');
      auraGrad.addColorStop(0.5, 'rgba(88, 28, 135, 0.28)');
      auraGrad.addColorStop(0.85, 'rgba(24, 9, 39, 0.15)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -10, 28 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Esferas oscuras giratorias de remordimiento
      for (let i = 0; i < 3; i++) {
        const orbitAngle = curseTime * 1.5 + (i * Math.PI * 2) / 3;
        const ox = Math.cos(orbitAngle) * (18 + Math.sin(curseTime * 3 + i) * 3);
        const oy = -10 + Math.sin(orbitAngle) * (11 + Math.cos(curseTime * 2 + i) * 2);
        ctx.fillStyle = 'rgba(192, 132, 252, 0.55)';
        ctx.beginPath();
        ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    const isLevitating = !!(wizard.channelLockTimer && wizard.channelLockTimer > 0);
    const levY = isLevitating ? -9 : 0;

    // Aura de relámpago sutil del Hito: Mente Inquebrantable
    if (wizard.hasLightningAura) {
      ctx.save();
      const t = Date.now() * 0.005;
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.3;

      for (let i = 0; i < 3; i++) {
        const a = t * 1.5 + (i * Math.PI * 2) / 3;
        const rad = 18 + Math.sin(t * 3 + i) * 4;
        const sx = Math.cos(a) * rad;
        const sy = levY - 8 + Math.sin(a) * rad * 0.6;
        const ex = sx + Math.sin(t * 7 + i * 2) * 8;
        const ey = sy + Math.cos(t * 7 + i * 2) * 8;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo((sx + ex) / 2 + Math.sin(t * 9 + i) * 3, (sy + ey) / 2 + Math.cos(t * 9 + i) * 3);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex, ey, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Feedback de desvanecimiento por muerte/respawn o parpadeo por i-frames de invulnerabilidad
    if (wizard.isRespawning && wizard.respawnFadeTimer !== undefined) {
      ctx.globalAlpha = Math.max(0, wizard.respawnFadeTimer / 0.4);
    } else if (wizard.invulnerableTimer && wizard.invulnerableTimer > 0) {
      const time = performance.now() * 0.001;
      ctx.globalAlpha = Math.sin(time * 25) > 0 ? 0.3 : 0.8;
    }

    drawWizardSprite({
      ctx,
      x: 0,
      y: levY,
      scale: 1.15 * (wizard.victoryScale !== undefined ? wizard.victoryScale : 1.0), // Mago con presencia visual y absorción en vórtice
      facingAngle: wizard.facingAngle,
      isMoving: wizard.isMoving,
      vx: wizard.vx,
      vy: wizard.vy,
      recoilX: wizard.recoilX,
      recoilY: wizard.recoilY,
      castFlashColor: wizard.castFlashColor,
      activeElement: wizard.activeElement,
      castAnimProgress: wizard.staffCastTimer ? Math.min(1, wizard.staffCastTimer / 190) : 0,
    });

    ctx.globalAlpha = 1.0;

    ctx.restore();
  }

  // Dibuja Enemigos y Jefes con renderizado vectorial procedural del Bestiario (cero emojis)
  private static drawEnemy(ctx: CanvasRenderingContext2D, enemy: GameEnemy) {
    const now = performance.now();
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    // 1. Telégrafo de Ataque Rojo (para ataques en carga o melé)
    if (enemy.isTelegraphing) {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 2. Renderizado Vectorial Procedural según afinidad y tipo del Bestiario
    if (enemy.bossType === 'threshold_custodian') {
      ctx.restore();
      ctx.save();
      drawThresholdCustodian(ctx, enemy, now);
      ctx.restore();
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
    } else if (enemy.bestiaryType === 'pyre_golem') {
      drawPyreGolem(ctx, enemy, now);
    } else if (enemy.bestiaryType === 'storm_stalker') {
      drawStormStalker(ctx, enemy, now);
    } else if (enemy.bestiaryType === 'frost_lurker') {
      drawFrostLurker(ctx, enemy, now);
    } else if (enemy.archetype === 'boss') {
      drawBossVector(ctx, enemy, now);
    } else {
      // Fallback vectorial sin emojis para entidades genéricas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, enemy.radius * 0.7, enemy.radius, enemy.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;
      ctx.beginPath();
      ctx.arc(0, -enemy.radius * 0.6, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 3. Efecto procedural de escarcha y congelamiento (sin rectángulos planos)
    const isFrozen = enemy.statuses.some((s) => s.type === 'frozen' || s.type === 'slowed');
    if (isFrozen && enemy.bossType !== 'threshold_custodian') {
      ctx.save();
      const r = enemy.radius;
      const frostGrad = ctx.createRadialGradient(0, -r, 2, 0, -r, r * 1.35);
      frostGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      frostGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.35)');
      frostGrad.addColorStop(0.85, 'rgba(14, 165, 233, 0.25)');
      frostGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

      ctx.fillStyle = frostGrad;
      ctx.beginPath();
      ctx.ellipse(0, -r, r * 1.15, r * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Púas o cristales vectoriales afilados en los bordes
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.6;
      ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
      const crystalCount = 6;
      for (let c = 0; c < crystalCount; c++) {
        const cAng = (Math.PI * 2 / crystalCount) * c + 0.3;
        const bx = Math.cos(cAng) * (r * 0.95);
        const by = -r + Math.sin(cAng) * (r * 0.95);
        const tipX = Math.cos(cAng) * (r * 1.35);
        const tipY = -r + Math.sin(cAng) * (r * 1.35);
        const p1x = Math.cos(cAng - 0.2) * (r * 0.95);
        const p1y = -r + Math.sin(cAng - 0.2) * (r * 0.95);
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(bx, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Si está aturdido (Stunned): Estrellas doradas vectoriales orbitando
    if (enemy.stunnedTimer && enemy.stunnedTimer > 0) {
      const starAng = (now * 0.008) % (Math.PI * 2);
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      for (let s = 0; s < 3; s++) {
        const a = starAng + (s * Math.PI * 2) / 3;
        const sx = Math.cos(a) * (enemy.radius * 1.1);
        const sy = -enemy.radius * 2 - 20 + Math.sin(a) * (enemy.radius * 0.35);
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Barra de vida segmentada con icono de debilidad elemental
    if (enemy.archetype !== 'boss') {
      drawEnemyHealthBar(ctx, enemy);
    }

    ctx.restore();
  }

  // DIBUJO DE DESCARGAS ELÉCTRICAS REALES Y RAMIFICADAS (OPTIMIZADO PARA 60 FPS ULTRA FLUIDO)
  private static drawLightningBolts(ctx: CanvasRenderingContext2D, bolts: LightningBoltEffect[]) {
    ctx.save();
    ctx.shadowBlur = 0; // Desactivar desenfoques gaussianos pesados para máximo rendimiento

    bolts.forEach((bolt) => {
      ctx.save();
      const alpha = Math.min(1, bolt.life / 2.5);
      const widthMult = bolt.isCelestial ? (bolt.widthMultiplier || 1.85) : 1.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Impacto radiante en el suelo si es un relámpago celestial masivo
      if (bolt.isCelestial) {
        const squish = 0.58;
        const groundGrad = ctx.createRadialGradient(bolt.targetX, bolt.targetY, 4, bolt.targetX, bolt.targetY, 44);
        groundGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        groundGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.85)');
        groundGrad.addColorStop(0.7, 'rgba(2, 132, 199, 0.35)');
        groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = groundGrad;
        ctx.beginPath();
        ctx.ellipse(bolt.targetX, bolt.targetY, 44, 44 * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(bolt.targetX, bolt.targetY, 26, 26 * squish, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (bolt.points.length > 1) {
        // 1. Resplandor exterior amplio translúcido (Ultra rápido, 0 lag de GPU)
        ctx.globalAlpha = alpha * (bolt.isCelestial ? 0.45 : 0.35);
        ctx.strokeStyle = bolt.glowColor || '#38bdf8';
        ctx.lineWidth = 11 * widthMult;
        ctx.beginPath();
        ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
        for (let i = 1; i < bolt.points.length; i++) {
          ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
        }
        ctx.stroke();

        // 2. Trazo eléctrico medio vibrante
        ctx.globalAlpha = alpha * 0.85;
        ctx.strokeStyle = bolt.color || '#facc15';
        ctx.lineWidth = 5 * widthMult;
        ctx.beginPath();
        ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
        for (let i = 1; i < bolt.points.length; i++) {
          ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
        }
        ctx.stroke();

        // 3. Núcleo interior blanco candente de alta energía
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2 * widthMult;
        ctx.beginPath();
        ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
        for (let i = 1; i < bolt.points.length; i++) {
          const jitter = (Math.random() - 0.5) * (bolt.isCelestial ? 5 : 3);
          ctx.lineTo(bolt.points[i].x + jitter, bolt.points[i].y + jitter);
        }
        ctx.stroke();
      }

      // 4. Ramificaciones secundarias que se bifurcan
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha * 0.75;
      bolt.branches.forEach((branch) => {
        if (branch.length > 1) {
          ctx.beginPath();
          ctx.moveTo(branch[0].x, branch[0].y);
          for (let b = 1; b < branch.length; b++) {
            ctx.lineTo(branch[b].x, branch[b].y);
          }
          ctx.stroke();
        }
      });

      // 5. Arcos de encadenamiento entre enemigos (Chain Lightning)
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.8;
      bolt.chainLines.forEach((chain) => {
        ctx.beginPath();
        ctx.moveTo(chain.x1, chain.y1);
        const midX = (chain.x1 + chain.x2) / 2 + (Math.random() - 0.5) * 16;
        const midY = (chain.y1 + chain.y2) / 2 + (Math.random() - 0.5) * 16;
        ctx.lineTo(midX, midY);
        ctx.lineTo(chain.x2, chain.y2);
        ctx.stroke();
      });

      // 6. Destellos circulares en origen e impacto
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(bolt.startX, bolt.startY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bolt.color || '#facc15';
      ctx.beginPath();
      ctx.arc(bolt.targetX, bolt.targetY, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bolt.targetX, bolt.targetY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    ctx.restore();
  }

  // DIBUJO DE PROYECTILES EN PIXEL ART 16-BIT (Bloques geométricos, estelas en dientes de sierra y cero arcos suaves)
  private static drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
    projectiles.forEach((p) => {
      // Ignorar proyectiles inactivos de la piscina de memoria
      if ((p as any).active === false || p.life <= 0) return;

      ctx.save();
      ctx.translate((p.x) | 0, (p.y) | 0);

      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(p.rotation !== undefined ? p.rotation : angle);

      const OUTLINE = '#0f172a';

      // A. FUEGO: Cometa de llamas en bloques rectangulares escalonados
      if (p.spellType === 'fire_shot' || p.spellType === 'fire_inferno') {
        const scale = p.spellType === 'fire_inferno' ? 1.4 : 1.1;
        const timeStep = Math.floor(Date.now() * 0.015) % 2;

        // Estela dentada de fuego exterior (#EA580C)
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-18 * scale, -10 * scale, 30 * scale, 20 * scale);

        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-16 * scale, -8 * scale, 26 * scale, 16 * scale);
        // Dientes de sierra en la estela
        ctx.fillRect(-22 * scale, (-6 + timeStep * 2) * scale, 8 * scale, 4 * scale);
        ctx.fillRect(-20 * scale, (2 - timeStep * 2) * scale, 6 * scale, 4 * scale);

        // Bloque central naranja (#F97316)
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-8 * scale, -6 * scale, 18 * scale, 12 * scale);

        // Núcleo caliente amarillo/blanco (#FEF08A)
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(0 * scale, -3 * scale, 10 * scale, 6 * scale);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4 * scale, -1 * scale, 4 * scale, 2 * scale);
      }
      // B. HIELO: Lanza / Cristal puntiagudo con quiebres a 45 grados en píxeles
      else if (p.spellType === 'ice_shard' || p.spellType === 'ice_lance') {
        const scale = p.spellType === 'ice_lance' ? 1.3 : 1.0;

        // Contorno
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-18 * scale, -7 * scale, 36 * scale, 14 * scale);
        ctx.fillRect(16 * scale, -3 * scale, 6 * scale, 6 * scale); // Punta

        // Cristal ártico (#7DD3FC)
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(-16 * scale, -5 * scale, 32 * scale, 10 * scale);
        ctx.fillRect(14 * scale, -2 * scale, 6 * scale, 4 * scale);

        // Faceta frontal blanco nieve (#F8FAFC)
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-8 * scale, -3 * scale, 24 * scale, 3 * scale);
        ctx.fillRect(6 * scale, -1 * scale, 12 * scale, 2 * scale);

        // Faceta inferior azul profundo (#0284C7)
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-14 * scale, 1 * scale, 26 * scale, 3 * scale);
      }
      // C. TIERRA: Megalito de piedra maciza en bloques rectangulares
      else if (p.spellType === 'earth_toss' || p.spellType === 'earth_megalith') {
        const scale = p.spellType === 'earth_megalith' ? 1.4 : 1.1;

        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-15 * scale, -13 * scale, 30 * scale, 26 * scale);

        ctx.fillStyle = '#78716c';
        ctx.fillRect(-13 * scale, -11 * scale, 26 * scale, 22 * scale);

        // Bloques de relieve y fracturas
        ctx.fillStyle = '#a8a29e';
        ctx.fillRect(-11 * scale, -9 * scale, 10 * scale, 8 * scale);
        ctx.fillStyle = '#44403c';
        ctx.fillRect(-2 * scale, -3 * scale, 12 * scale, 10 * scale);
        ctx.fillRect(-8 * scale, 1 * scale, 6 * scale, 6 * scale);
      }
      // D. CHOQUE TÉRMICO (FUEGO + HIELO): Bloque dual mitad fuego / mitad hielo
      else if (p.spellType === 'thermal_shock') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-14, -14, 28, 28);

        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(-12, -12, 24, 12);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-12, 0, 24, 12);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -4, 8, 8);
      }
      // D.2 DEFLAGRACIÓN TÉRMICA (FUEGO + FUEGO + HIELO): Bloque entrelazado rojo y celeste
      else if (p.spellType === 'thermal_deflagration') {
        const pr = 13;
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-pr - 1, -pr - 1, pr * 2 + 2, pr * 2 + 2);

        // Píxeles rojos (#EF4444) y celestes (#38BDF8) entrelazados en patrón de bloques
        const cSize = 6;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            const isRed = (r + c) % 2 === 0;
            ctx.fillStyle = isRed ? '#ef4444' : '#38bdf8';
            ctx.fillRect(-pr + c * cSize, -pr + r * cSize, cSize, cSize);
          }
        }
        // Núcleo blanco brillante de alta temperatura
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -3, 6, 6);
      }
      // E. ERUPCIÓN DE MAGMA: Bloques de roca volcánica y fuego
      else if (p.spellType === 'magma_eruption') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-14, -14, 28, 28);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-12, -12, 24, 24);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-4, -4, 12, 8);
      }
      // F. SOBRECARGA EXPLOSIVA: Cubo de plasma violeta
      else if (p.spellType === 'explosive_overload') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-14, -14, 28, 28);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-12, -12, 24, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -4, 8, 8);
      }
      // G. TORMENTA CRIOGÉNICA (HIELO + RAYO): Diamante de escarcha con borde eléctrico
      else if (p.spellType === 'cryo_storm') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-15, -9, 30, 18);
        ctx.fillRect(-9, -15, 18, 30);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(-13, -7, 26, 14);
        ctx.fillRect(-7, -13, 14, 26);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -1, 2, 2);
      }
      // H. CATACLISMO ELEMENTAL: Matriz tetracromática pixelada
      else if (p.spellType === 'elemental_cataclysm') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-16, -16, 32, 32);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(-14, -14, 14, 14);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(0, -14, 14, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-14, 0, 14, 14);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, 0, 14, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -4, 8, 8);
      }
      // Chispa Arcana: proyectil verde de baja potencia con estela breve y pixelada.
      else if (p.spellType === 'basic_spark') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-7, -5, 12, 10);
        ctx.fillRect(-11, -3, 4, 6);
        ctx.fillStyle = '#86efac';
        ctx.fillRect(-3, -3, 8, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1, -1, 3, 2);
      }
      // I. PROYECTIL ENEMIGO (HOSTIL): Bloque de sombra umbría con núcleo carmesí
      else if (p.isHostile) {
        const pr = Math.round(p.radius);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-pr - 1, -pr - 1, pr * 2 + 2, pr * 2 + 2);
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-pr, -pr, pr * 2, pr * 2);
        ctx.fillStyle = '#dc2626';
        const inR = Math.max(2, Math.round(pr * 0.55));
        ctx.fillRect(-inR, -inR, inR * 2, inR * 2);
      }
      // J. Tajos del Básico / Chispa Arcana: Estela de arco escalonada en dientes de sierra
      else {
        const pr = Math.max(3, Math.round(p.radius));
        const color = p.color || '#94a3b8';

        // Estela en dientes de sierra (Sawtooth stepped trail) detrás del proyectil
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(-pr * 3.5, -pr * 0.8, pr * 1.5, pr * 1.6);
        ctx.fillRect(-pr * 2.2, -pr * 1.2, pr * 1.2, pr * 0.8);
        ctx.fillRect(-pr * 2.2, pr * 0.4, pr * 1.2, pr * 0.8);

        // Bloque exterior
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(-pr - 1, -pr - 1, pr * 2 + 2, pr * 2 + 2);

        // Cuerpo cuadrado del proyectil
        ctx.fillStyle = color;
        ctx.fillRect(-pr, -pr, pr * 2, pr * 2);

        // Núcleo brillante blanco
        const coreSize = Math.max(2, Math.round(pr * 0.6));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-coreSize / 2, -coreSize / 2, coreSize, coreSize);
      }

      ctx.restore();
    });
  }

  // =========================================================================
  // DIBUJO DE PARTÍCULAS BATCHED POR COLOR (Cero Save/Restore + Coordenadas Truncadas | 0)
  // Optimización móvil para eliminar microcongelamientos (GC) y reducir Draw Calls en Canvas 2D
  // =========================================================================
  private static drawParticles(ctx: CanvasRenderingContext2D, particles: (Particle | PooledParticle)[]) {
    if (!particles || particles.length === 0) return;

    // Paletas cromáticas dominantes de TaskQuest RPG para un único fillStyle por lote
    const DOMINANT_PALETTES = [
      '#ffffff', // Chispas puras y destellos
      '#facc15', // Rayo primario
      '#fde047', // Rayo brillante / amarillo
      '#38bdf8', // Hielo ártico
      '#bae6fd', // Escarcha celeste
      '#7dd3fc', // Cristal de hielo
      '#ea580c', // Fuego primario
      '#f97316', // Fuego naranja
      '#ef4444', // Fuego rojo
      '#7f1d1d', // Roca volcánica oscura
      '#a855f7', // Plasma violeta
      '#c084fc', // Plasma núcleo
      '#ec4899', // Cataclismo rosa/magenta
      '#78716c', // Polvo / tierra gris
      '#78350f', // Tierra ámbar / roca
      '#94a3b8', // Muros / esquirlas de piedra
      '#0f172a', // Humo oscuro
    ];

    const len = particles.length;

    // 1. Lotes por color dominante (Omisión de save/restore y coordenadas enteras bitwise | 0)
    for (let c = 0; c < DOMINANT_PALETTES.length; c++) {
      const targetColor = DOMINANT_PALETTES[c];
      let styleApplied = false;

      for (let i = 0; i < len; i++) {
        const pt = particles[i] as PooledParticle;
        if (pt.active === false || pt.life <= 0) continue;
        if (pt.type === 'ring') continue;

        if (pt.color === targetColor || pt.color?.toLowerCase() === targetColor) {
          if (!styleApplied) {
            ctx.fillStyle = targetColor;
            styleApplied = true;
          }
          const sz = pt.size || Math.max(2, (pt.radius * 1.8) | 0);
          const halfSz = sz >> 1;
          ctx.fillRect((pt.x - halfSz) | 0, (pt.y - halfSz) | 0, sz, sz);
        }
      }
    }

    // 2. Pase residual: anillos de choque y partículas fuera de la paleta dominante
    for (let i = 0; i < len; i++) {
      const pt = particles[i] as PooledParticle;
      if (pt.active === false || pt.life <= 0) continue;

      if (pt.type === 'ring') {
        ctx.strokeStyle = pt.color || '#38bdf8';
        ctx.lineWidth = 2;
        const r = pt.radius | 0;
        ctx.strokeRect((pt.x - r) | 0, (pt.y - r) | 0, r << 1, r << 1);
      } else {
        const col = pt.color?.toLowerCase();
        let wasBatched = false;
        for (let c = 0; c < DOMINANT_PALETTES.length; c++) {
          if (col === DOMINANT_PALETTES[c]) {
            wasBatched = true;
            break;
          }
        }
        if (!wasBatched) {
          ctx.fillStyle = pt.color || '#ffffff';
          const sz = pt.size || Math.max(2, (pt.radius * 1.8) | 0);
          const halfSz = sz >> 1;
          ctx.fillRect((pt.x - halfSz) | 0, (pt.y - halfSz) | 0, sz, sz);
        }
      }
    }
  }

  // Dibuja Textos Flotantes (Tipografía Bitmap 'Press Start 2P' y Sombra de Bloque Sólido)
  private static drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
    texts.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.opacity);
      const pixelSize = Math.max(8, Math.round(t.fontSize * 0.8));
      ctx.font = `bold ${pixelSize}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';

      // Sombra sólida de bloque pixelado (sin difuminar)
      ctx.fillStyle = '#000000';
      ctx.fillText(t.text, Math.round(t.x + 1.5), Math.round(t.y + 1.5));

      // Texto de color principal
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, Math.round(t.x), Math.round(t.y));
      ctx.restore();
    });
  }

  // DIBUJO DE FLUJO CONTINUO CANALIZADO (FUEGO Y HIELO)
  private static drawChanneledStream(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number },
    stream: ChanneledStreamState
  ) {
    ctx.save();
    const originX = wizard.x + Math.cos(stream.aimAngle) * 20;
    const originY = wizard.y - 6 + Math.sin(stream.aimAngle) * 20;
    const range = stream.range || 230;
    const halfArc = (stream.spreadAngle || 0.55) / 2;
    const now = Date.now();
    const t = now * 0.008;

    if (stream.type === 'fire') {
      // 1. Resplandor cálido en el suelo
      ctx.save();
      ctx.translate(originX, originY);
      ctx.rotate(stream.aimAngle);

      const groundGlow = ctx.createRadialGradient(0, 0, 10, range * 0.7, 0, range);
      groundGlow.addColorStop(0, 'rgba(239, 68, 68, 0.28)');
      groundGlow.addColorStop(0.5, 'rgba(249, 115, 22, 0.16)');
      groundGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = groundGlow;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, range, -halfArc * 1.25, halfArc * 1.25);
      ctx.closePath();
      ctx.fill();

      // 2. Cono principal de fuego continuo con gradiente radial multicapa
      const fireGrad = ctx.createRadialGradient(0, 0, 6, range * 0.65, 0, range);
      fireGrad.addColorStop(0, 'rgba(255, 255, 245, 0.96)');
      fireGrad.addColorStop(0.15, 'rgba(254, 240, 138, 0.90)');
      fireGrad.addColorStop(0.42, 'rgba(249, 115, 22, 0.72)');
      fireGrad.addColorStop(0.8, 'rgba(220, 38, 38, 0.42)');
      fireGrad.addColorStop(1, 'rgba(153, 27, 27, 0)');

      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);

      const steps = 14;
      for (let i = 1; i <= steps; i++) {
        const prog = i / steps;
        const curR = range * prog;
        const wave = Math.sin(t * 5 + prog * 8) * (8 * prog);
        const curAng = -halfArc + (wave / curR);
        ctx.lineTo(Math.cos(curAng) * curR, Math.sin(curAng) * curR);
      }

      for (let a = -halfArc; a <= halfArc; a += 0.08) {
        const pulse = Math.sin(t * 6 + a * 10) * 9;
        ctx.lineTo(Math.cos(a) * (range + pulse), Math.sin(a) * (range + pulse));
      }

      for (let i = steps; i >= 1; i--) {
        const prog = i / steps;
        const curR = range * prog;
        const wave = Math.cos(t * 5 + prog * 8) * (8 * prog);
        const curAng = halfArc + (wave / curR);
        ctx.lineTo(Math.cos(curAng) * curR, Math.sin(curAng) * curR);
      }

      ctx.closePath();
      ctx.fill();

      // 3. Lenguas de fuego centrales
      ctx.lineWidth = 4.5;
      for (let l = 0; l < 4; l++) {
        const lProg = l / 3;
        const lAng = -halfArc * 0.65 + lProg * halfArc * 1.3;
        const lLen = range * (0.75 + Math.sin(t * 4 + l * 2) * 0.2);

        ctx.strokeStyle = l % 2 === 0 ? '#fef08a' : '#fb923c';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const cp1x = lLen * 0.35;
        const cp1y = Math.sin(t * 7 + l * 3) * 14;
        const cp2x = lLen * 0.7;
        const cp2y = Math.cos(t * 6 + l * 2) * 18;
        const endX = Math.cos(lAng) * lLen;
        const endY = Math.sin(lAng) * lLen;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();
      }

      // 4. Núcleo incandescente en el báculo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 7 + Math.sin(t * 8) * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else {
      // HIELO (Flujo Continuo de Ventisca / Chorro Criogénico)
      ctx.save();
      ctx.translate(originX, originY);
      ctx.rotate(stream.aimAngle);

      // 1. Escarcha resplandeciente en el suelo
      const iceGroundGrad = ctx.createRadialGradient(0, 0, 10, range * 0.6, 0, range);
      iceGroundGrad.addColorStop(0, 'rgba(186, 230, 253, 0.35)');
      iceGroundGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.18)');
      iceGroundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = iceGroundGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, range, -halfArc * 1.15, halfArc * 1.15);
      ctx.closePath();
      ctx.fill();

      // 2. Haz Cónico Glacial con niebla sub-cero
      const iceGrad = ctx.createRadialGradient(0, 0, 5, range * 0.7, 0, range);
      iceGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      iceGrad.addColorStop(0.18, 'rgba(224, 242, 254, 0.85)');
      iceGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.65)');
      iceGrad.addColorStop(0.85, 'rgba(2, 132, 199, 0.32)');
      iceGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');

      ctx.fillStyle = iceGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);

      const iceSteps = 12;
      for (let i = 1; i <= iceSteps; i++) {
        const prog = i / iceSteps;
        const curR = range * prog;
        const jagg = (i % 2 === 0 ? 3 : -3) * prog;
        const curAng = -halfArc + (jagg / curR);
        ctx.lineTo(Math.cos(curAng) * curR, Math.sin(curAng) * curR);
      }

      for (let a = -halfArc; a <= halfArc; a += 0.07) {
        const rimJagg = Math.sin(t * 8 + a * 14) * 6;
        ctx.lineTo(Math.cos(a) * (range + rimJagg), Math.sin(a) * (range + rimJagg));
      }

      for (let i = iceSteps; i >= 1; i--) {
        const prog = i / iceSteps;
        const curR = range * prog;
        const jagg = (i % 2 === 0 ? -3 : 3) * prog;
        const curAng = halfArc + (jagg / curR);
        ctx.lineTo(Math.cos(curAng) * curR, Math.sin(curAng) * curR);
      }

      ctx.closePath();
      ctx.fill();

      // 3. Frentes de choque criogénicos
      ctx.lineWidth = 2.2;
      for (let w = 0; w < 3; w++) {
        const wProg = ((t * 1.5 + w * 0.33) % 1.0);
        const wDist = range * wProg;
        const wAlpha = (1 - wProg) * 0.75;
        ctx.strokeStyle = `rgba(224, 242, 254, ${wAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, wDist, -halfArc * 0.9, halfArc * 0.9);
        ctx.stroke();
      }

      // 4. Filamentos de escarcha
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#ffffff';
      for (let s = 0; s < 5; s++) {
        const sProg = s / 4;
        const sAng = -halfArc * 0.7 + sProg * halfArc * 1.4;
        const sLen = range * (0.8 + Math.cos(t * 5 + s) * 0.15);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sAng) * sLen, Math.sin(sAng) * sLen);
        ctx.stroke();

        const tipX = Math.cos(sAng) * sLen;
        const tipY = Math.sin(sAng) * sLen;
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(tipX + 4, tipY);
        ctx.lineTo(tipX, tipY - 2.5);
        ctx.lineTo(tipX - 4, tipY);
        ctx.lineTo(tipX, tipY + 2.5);
        ctx.closePath();
        ctx.fill();
      }

      // 5. Destello gélido en la punta del báculo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  // Dibuja el pilar de fuego eruptivo (geiser vertical 2.5D), ascuas y lenguas residuales del Pilar Ígneo
  private static drawInfernalCrownFlames(ctx: CanvasRenderingContext2D, crowns: InfernalCrownEntity[]) {
    if (!crowns || crowns.length === 0) return;

    const squish = 0.58;

    crowns.forEach((crown) => {
      ctx.save();

      if (crown.phase === 'preparation') {
        // FASE 1: Chispas ascendentes y pequeño núcleo brillante de ignición
        const prog = Math.min(1, crown.phaseTimer / crown.prepDurationMs);
        const pulse = Math.sin(crown.phaseTimer * 0.04);
        const coreR = 4 + prog * 6 + pulse * 1.5;

        const coreGrad = ctx.createRadialGradient(crown.x, crown.y - 4, 1, crown.x, crown.y - 4, coreR * 2);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.35, '#fef08a');
        coreGrad.addColorStop(0.7, '#f97316');
        coreGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(crown.x, crown.y - 4, coreR * 2, 0, Math.PI * 2);
        ctx.fill();

        // 4 filamentos verticales sutiles de fuego ascendente
        for (let f = 0; f < 4; f++) {
          const fAng = (f / 4) * Math.PI * 2 + crown.phaseTimer * 0.01;
          const fx = crown.x + Math.cos(fAng) * (crown.currentRadius * 0.5);
          const fy = crown.y + Math.sin(fAng) * (crown.currentRadius * 0.5) * squish;
          const fH = (12 + prog * 20) + Math.sin(crown.phaseTimer * 0.02 + f) * 5;
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + (Math.random() - 0.5) * 3, fy - fH);
          ctx.stroke();
        }
      } else if (crown.phase === 'detonation') {
        // FASE 2: PILAR DE FUEGO RETRO (Columna de bloques rectangulares superpuestos de amarillo, naranja y rojo en saltos rígidos)
        const stepAnim = Math.floor(crown.phaseTimer * 0.05) % 4;
        const eruptionHeight = 160 + stepAnim * 8;
        const cx = Math.round(crown.x);
        const cy = Math.round(crown.y);
        const baseW = Math.round(crown.maxRadius * 0.95);

        // 1. Sombra / base en el suelo en bloques pixelados
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - baseW - 2, cy - 6, (baseW * 2) + 4, 12);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(cx - baseW, cy - 4, baseW * 2, 8);

        // 2. Columna exterior de bloques rectangulares superpuestos en rojo carmesí (#991B1B / #DC2626)
        const levels = 8;
        const levelH = Math.round(eruptionHeight / levels);

        for (let l = 0; l < levels; l++) {
          const lRatio = l / levels;
          const curW = Math.max(12, Math.round(baseW * (1 - lRatio * 0.55)));
          const curY = cy - (l + 1) * levelH;
          const jitterX = ((l + stepAnim) % 3 - 1) * 3;

          // Bloque exterior rojo
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(cx - curW / 2 + jitterX - 1, curY - 1, curW + 2, levelH + 2);
          ctx.fillStyle = l > levels - 3 ? '#991b1b' : '#dc2626';
          ctx.fillRect(cx - curW / 2 + jitterX, curY, curW, levelH);

          // Bloque intermedio naranja (#EA580C / #F97316)
          const midW = Math.max(6, Math.round(curW * 0.65));
          ctx.fillStyle = l > levels - 3 ? '#ea580c' : '#f97316';
          ctx.fillRect(cx - midW / 2 + jitterX, curY, midW, levelH);

          // Bloque núcleo incandescente amarillo/blanco (#FEF08A / #FFFFFF)
          if (l < levels - 1) {
            const coreW = Math.max(3, Math.round(midW * 0.5));
            ctx.fillStyle = l < 3 ? '#ffffff' : '#fef08a';
            ctx.fillRect(cx - coreW / 2 + jitterX, curY, coreW, levelH);
          }
        }

        // Picos de fuego superiores en saltos de píxeles
        const crestY = cy - eruptionHeight;
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx - 3, crestY - 8, 6, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 1, crestY - 12, 2, 4);

        // Chispas cuadradas ascendentes (2x2 px)
        ctx.fillStyle = '#fde047';
        for (let p = 0; p < 6; p++) {
          const t = ((crown.phaseTimer * 0.006 + p * 0.16) % 1.0);
          const spX = cx + ((p % 3 - 1) * 16);
          const spY = cy - Math.round(t * (eruptionHeight + 20));
          ctx.fillRect(spX, spY, 3, 3);
        }
      } else if (crown.phase === 'ring') {
        // FASE 3: LENGUAS DE FUEGO BAJAS Y BRASAS VIVAS EN EL CRÁTER RESIDUAL
        const r = crown.maxRadius;
        const totalDuration = crown.ringDurationMs;
        const remainProg = Math.max(0, (totalDuration - crown.phaseTimer) / totalDuration);
        const alpha = Math.min(1, remainProg * 1.3);

        ctx.globalAlpha = alpha;

        // Llamas bajas lamiendo el suelo calcinado (6 a 8 pequeñas lenguas)
        const flameCount = 7;
        for (let i = 0; i < flameCount; i++) {
          const fAng = (i / flameCount) * Math.PI * 2 + crown.phaseTimer * 0.0008;
          const fDist = r * (0.35 + (i % 3) * 0.2);
          const bx = crown.x + Math.cos(fAng) * fDist;
          const by = crown.y + Math.sin(fAng) * fDist * squish;

          const fWave = Math.sin(crown.phaseTimer * 0.015 + i * 2.2);
          const flameH = (12 + fWave * 5) * Math.min(1, remainProg * 1.2);
          const flameW = 4 + (i % 2) * 2;

          ctx.fillStyle = 'rgba(234, 88, 12, 0.75)';
          ctx.beginPath();
          ctx.moveTo(bx - flameW, by);
          ctx.quadraticCurveTo(bx - flameW * 0.5, by - flameH * 0.6, bx + fWave * 2, by - flameH);
          ctx.quadraticCurveTo(bx + flameW * 0.5, by - flameH * 0.6, bx + flameW, by);
          ctx.closePath();
          ctx.fill();

          // Núcleo amarillo pequeño
          ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
          ctx.beginPath();
          ctx.moveTo(bx - flameW * 0.4, by);
          ctx.quadraticCurveTo(bx, by - flameH * 0.4, bx, by - flameH * 0.6);
          ctx.quadraticCurveTo(bx, by - flameH * 0.4, bx + flameW * 0.4, by);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();
    });
  }

  // BARRA DE SALUD SUPERIOR DEL JEFE (HUD)
  private static drawBossHUD(ctx: CanvasRenderingContext2D, width: number, boss: GameEnemy) {
    if (boss.bossType === 'threshold_custodian') {
      drawCustodianHUD(ctx, width, boss);
      return;
    }
    ctx.save();
    const barW = Math.min(width * 0.55, 340);
    const barH = 14;
    const barX = width / 2 - barW / 2;
    const barY = 32;

    const hpPct = Math.max(0, boss.hp / boss.maxHp);

    // Fondo y borde
    ctx.fillStyle = '#090a12';
    ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX - 4, barY - 4, barW + 8, barH + 8);

    // Relleno de vida del jefe
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(1, '#f97316');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    // Nombre y Título del Jefe
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'center';
    ctx.fillText(`👑 ${boss.name.toUpperCase()} (Fase ${boss.phase || 1})`, width / 2, barY - 9);

    ctx.restore();
  }

  // Dibuja el surco de permafrost, fracturas heladas y niebla de frío en el suelo para Erupción Glacial
  private static drawGlacialEruptionFloor(ctx: CanvasRenderingContext2D, eruptions: GlacialEruptionEntity[]) {
    if (!eruptions || eruptions.length === 0) return;

    const squish = 0.58;

    eruptions.forEach((eruption) => {
      ctx.save();

      const alpha = eruption.phase === 'shattering'
        ? Math.max(0, 1 - eruption.phaseTimer / eruption.shatterDurationMs)
        : 1.0;

      // 1. Surco de escarcha y permafrost en el suelo a lo largo de los segmentos emergidos
      const emergedSegs = eruption.segments.filter((s) => s.emerged);
      if (emergedSegs.length > 0) {
        const lastSeg = emergedSegs[emergedSegs.length - 1];
        const furGrad = ctx.createLinearGradient(eruption.startX, eruption.startY, lastSeg.x, lastSeg.y);
        furGrad.addColorStop(0, `rgba(6, 182, 212, ${0.45 * alpha})`);
        furGrad.addColorStop(0.5, `rgba(56, 189, 248, ${0.35 * alpha})`);
        furGrad.addColorStop(1, `rgba(224, 247, 250, ${0.15 * alpha})`);

        ctx.strokeStyle = furGrad;
        ctx.lineWidth = eruption.isCharged ? 38 : 28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(eruption.startX, eruption.startY);
        emergedSegs.forEach((seg) => {
          ctx.lineTo(seg.x, seg.y);
        });
        ctx.stroke();

        // 2. Línea de fractura sísmica en zigzag blanco-celeste en el eje central
        ctx.strokeStyle = `rgba(240, 249, 255, ${0.85 * alpha})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(eruption.startX, eruption.startY);
        emergedSegs.forEach((seg, idx) => {
          const zigX = (idx % 2 === 0 ? 3 : -3) * Math.sin(eruption.aimAngle);
          const zigY = (idx % 2 === 0 ? -3 : 3) * Math.cos(eruption.aimAngle) * squish;
          ctx.lineTo(seg.x + zigX, seg.y + zigY);
        });
        ctx.stroke();

        // 3. Pequeñas grietas radiales secundarias bajo cada púa emergida
        emergedSegs.forEach((seg, sIdx) => {
          const crackRadius = (16 + (sIdx % 3) * 6) * (eruption.isCharged ? 1.3 : 1.0);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 * alpha})`;
          ctx.lineWidth = 1.4;
          for (let k = 0; k < 3; k++) {
            const kAng = eruption.aimAngle + Math.PI / 2 + (k - 1) * 0.7 + (seg.rotationOffset || 0);
            const kLen = crackRadius * (0.6 + ((sIdx + k) % 3) * 0.25);
            ctx.beginPath();
            ctx.moveTo(seg.x, seg.y);
            ctx.lineTo(seg.x + Math.cos(kAng) * kLen, seg.y + Math.sin(kAng) * kLen * squish);
            ctx.stroke();
          }
        });

        // 4. Niebla gélida persistente (aura de frío absoluto)
        if (eruption.phase === 'persisting') {
          const mistCount = emergedSegs.length;
          for (let m = 0; m < mistCount; m++) {
            const seg = emergedSegs[m];
            const wave = Math.sin(Date.now() * 0.003 + m * 1.5) * 6;
            const mistGrad = ctx.createRadialGradient(seg.x + wave, seg.y, 4, seg.x + wave, seg.y, 24);
            mistGrad.addColorStop(0, 'rgba(224, 247, 250, 0.28)');
            mistGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.12)');
            mistGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
            ctx.fillStyle = mistGrad;
            ctx.beginPath();
            ctx.ellipse(seg.x + wave, seg.y, 24, 24 * squish, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    });
  }

  // Dibuja una púa o aguja de hielo gigante facetada en 2.5D con caras poligonales e iluminación especular
  private static drawGlacialSpikeSegment(
    ctx: CanvasRenderingContext2D,
    seg: GlacialSpikeSegment,
    eruption: GlacialEruptionEntity
  ) {
    const squish = 0.58;
    const h = seg.currentHeight;
    if (h <= 1) return;

    ctx.save();

    let alpha = 1.0;
    let jitterX = 0;
    let jitterY = 0;

    if (eruption.phase === 'shattering') {
      const prog = Math.min(1, eruption.phaseTimer / eruption.shatterDurationMs);
      alpha = Math.max(0, 1 - prog);
      jitterX = (Math.random() - 0.5) * 5 * (1 - prog);
      jitterY = (Math.random() - 0.5) * 4 * (1 - prog);
    }

    const bx = seg.x + jitterX;
    const by = seg.y + jitterY;
    const w = seg.width;

    // Vértice superior (Punta afilada de la púa)
    const tipX = bx + Math.sin(seg.rotationOffset) * (h * 0.22);
    const tipY = by - h;

    // Vértices de la base en el suelo con perspectiva isométrica
    const bLeftX = bx - w * 0.52;
    const bLeftY = by - w * 0.15 * squish;
    const bRightX = bx + w * 0.52;
    const bRightY = by - w * 0.15 * squish;
    const bFrontX = bx;
    const bFrontY = by + w * 0.38 * squish;
    const bBackX = bx;
    const bBackY = by - w * 0.38 * squish;

    // 1. Sombra de contacto en el suelo
    ctx.fillStyle = `rgba(3, 30, 48, ${0.45 * alpha})`;
    ctx.beginPath();
    ctx.ellipse(bx, by, w * 0.65, w * 0.65 * squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Cara Trasera Profunda (Shadow Facet posterior)
    ctx.fillStyle = `rgba(12, 74, 110, ${0.75 * alpha})`;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(bLeftX, bLeftY);
    ctx.lineTo(bBackX, bBackY);
    ctx.lineTo(bRightX, bRightY);
    ctx.closePath();
    ctx.fill();

    // 3. Cara Izquierda Iluminada (Light / Specular Facet)
    // Recibe luz cenital-izquierda: gradiente blanco hielo a cyan cristalino
    const leftGrad = ctx.createLinearGradient(tipX, tipY, bLeftX, bLeftY);
    leftGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * alpha})`);
    leftGrad.addColorStop(0.25, `rgba(224, 247, 250, ${0.9 * alpha})`);
    leftGrad.addColorStop(0.7, `rgba(56, 189, 248, ${0.85 * alpha})`);
    leftGrad.addColorStop(1, `rgba(14, 116, 144, ${0.85 * alpha})`);

    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(bLeftX, bLeftY);
    ctx.lineTo(bFrontX, bFrontY);
    ctx.closePath();
    ctx.fill();

    // 4. Cara Derecha Sombreada (Deep Crystal Facet)
    // Sombra proyectada del cristal: gradiente cyan profundo a azul zafiro
    const rightGrad = ctx.createLinearGradient(tipX, tipY, bRightX, bRightY);
    rightGrad.addColorStop(0, `rgba(224, 247, 250, ${0.9 * alpha})`);
    rightGrad.addColorStop(0.35, `rgba(2, 132, 199, ${0.85 * alpha})`);
    rightGrad.addColorStop(0.85, `rgba(3, 105, 161, ${0.9 * alpha})`);
    rightGrad.addColorStop(1, `rgba(12, 74, 110, ${0.92 * alpha})`);

    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(bFrontX, bFrontY);
    ctx.lineTo(bRightX, bRightY);
    ctx.closePath();
    ctx.fill();

    // 5. Arista Central Especular (Línea de cresta afilada con destello blanco)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * alpha})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(bFrontX, bFrontY);
    ctx.stroke();

    // Arista lateral izquierda nítida
    ctx.strokeStyle = `rgba(224, 247, 250, ${0.7 * alpha})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(bLeftX, bLeftY);
    ctx.stroke();

    // 6. Destello estelar en la punta de las púas grandes
    if (seg.index >= 3 && h > 35 && alpha > 0.4) {
      const glintPulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.008 + seg.index);
      ctx.fillStyle = `rgba(255, 255, 255, ${glintPulse * alpha})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Grietas internas en fase de Shatter
    if (eruption.phase === 'shattering') {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY + h * 0.3);
      ctx.lineTo(bx - w * 0.2, by - h * 0.5);
      ctx.lineTo(bx + w * 0.25, by - h * 0.3);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Línea de trayectoria táctica previa al lanzar Erupción Glacial
  private static drawGlacialAimTrajectory(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ang = wizard.facingAngle;
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const length = isReady ? 330 : 250;
    const squish = 0.58;

    ctx.save();

    // Línea discontinua luminosa
    ctx.strokeStyle = isReady ? 'rgba(224, 247, 250, 0.75)' : 'rgba(6, 182, 212, 0.5)';
    ctx.lineWidth = isReady ? 2.5 : 1.8;
    ctx.setLineDash([10, 8]);

    const endX = wizard.x + Math.cos(ang) * length;
    const endY = wizard.y + Math.sin(ang) * length * squish;

    ctx.beginPath();
    ctx.moveTo(wizard.x, wizard.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Marcadores de impacto de púas a lo largo de la trayectoria
    const numMarkers = isReady ? 8 : 6;
    const stepDist = length / numMarkers;
    for (let i = 1; i <= numMarkers; i++) {
      const mx = wizard.x + Math.cos(ang) * (i * stepDist);
      const my = wizard.y + Math.sin(ang) * (i * stepDist) * squish;
      const pulse = 2.5 + Math.sin(Date.now() * 0.01 + i) * 1;

      ctx.fillStyle = isReady ? '#ffffff' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(mx, my, pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Dibuja la runa de advertencia sísmica, grietas telúricas y el cráter para Puño Tectónico
  private static drawTectonicFistFloor(ctx: CanvasRenderingContext2D, fists: TectonicFistEntity[]) {
    if (!fists || fists.length === 0) return;

    const squish = 0.58;

    fists.forEach((fist) => {
      ctx.save();
      ctx.translate(fist.targetX, fist.targetY);

      if (fist.phase === 'warning') {
        const prog = Math.min(1, fist.phaseTimer / fist.warningDurationMs);
        const r = fist.radius * (0.6 + prog * 0.4);

        // 1. Disco rúnico ámbar en el suelo
        const discGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
        discGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
        discGrad.addColorStop(0.7, 'rgba(217, 119, 6, 0.2)');
        discGrad.addColorStop(1, 'rgba(120, 53, 15, 0)');
        ctx.fillStyle = discGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Anillo de advertencia discontinua con temblor
        const ringAlpha = 0.4 + 0.4 * Math.sin(fist.phaseTimer * 0.04);
        ctx.strokeStyle = `rgba(251, 191, 36, ${ringAlpha})`;
        ctx.lineWidth = 2.0;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.ellipse(0, 0, fist.radius, fist.radius * squish, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Grietas telúricas incandescentes que se ramifican
        fist.crackAngles.forEach((ang, idx) => {
          const crackLen = (fist.radius * 0.85) * (0.5 + prog * 0.5) * (0.85 + (idx % 3) * 0.15);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const midX = Math.cos(ang + 0.1) * (crackLen * 0.5);
          const midY = Math.sin(ang + 0.1) * (crackLen * 0.5) * squish;
          const endX = Math.cos(ang - 0.08) * crackLen;
          const endY = Math.sin(ang - 0.08) * crackLen * squish;
          ctx.lineTo(midX, midY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Filamento central dorado brillante
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        });
      } else if (fist.phase === 'eruption' || fist.phase === 'collapse') {
        const r = fist.radius;

        // Cráter abierto de roca partida
        ctx.fillStyle = '#1c1311';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.75, r * 0.75 * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Borde fracturado del cráter con roca expuesta
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.8, r * 0.8 * squish, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Fisuras permanentes brillantes
        fist.crackAngles.forEach((ang) => {
          const cLen = r * 1.1;
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * cLen, Math.sin(ang) * cLen * squish);
          ctx.stroke();
        });
      }

      ctx.restore();
    });
  }

  // Dibuja el colosal Puño Tectónico en 2.5D con estratos minerales, 4 nudillos angulares y geodas
  private static drawTectonicFist(ctx: CanvasRenderingContext2D, fist: TectonicFistEntity) {
    const h = fist.fistHeight;
    if (h <= 2) return;

    ctx.save();
    const bx = fist.targetX;
    const by = fist.targetY;
    const isCharged = fist.isCharged;
    const w = isCharged ? 48 : 38;
    const squish = 0.58;

    let alpha = 1.0;
    let jitterX = 0;
    let jitterY = 0;

    if (fist.phase === 'collapse') {
      const prog = Math.min(1, fist.phaseTimer / fist.collapseDurationMs);
      alpha = Math.max(0, 1 - prog * 0.8);
      jitterX = (Math.random() - 0.5) * 6;
      jitterY = (Math.random() - 0.5) * 4;
    }

    ctx.translate(bx + jitterX, by + jitterY);

    // 1. Sombra de masa en el suelo
    ctx.fillStyle = 'rgba(26, 15, 13, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.8, w * 0.8 * squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vértices clave del Puño Tectónico (Golpe Uppercut vertical):
    // Muñeca / Columna de antebrazo de roca
    const wristH = h * 0.42;
    const knuckleBaseH = h * 0.72;
    const apexH = h;

    // 2. Columna del antebrazo (Estratos de roca sedimentaria)
    const armGrad = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, -wristH);
    armGrad.addColorStop(0, `rgba(45, 27, 24, ${alpha})`);
    armGrad.addColorStop(0.5, `rgba(62, 39, 35, ${alpha})`);
    armGrad.addColorStop(1, `rgba(93, 64, 55, ${alpha})`);

    ctx.fillStyle = armGrad;
    ctx.beginPath();
    ctx.moveTo(-w * 0.45, 0);
    ctx.lineTo(-w * 0.38, -wristH);
    ctx.lineTo(w * 0.38, -wristH);
    ctx.lineTo(w * 0.45, 0);
    ctx.closePath();
    ctx.fill();

    // Estratos horizontales en el antebrazo
    ctx.strokeStyle = `rgba(120, 53, 15, ${0.7 * alpha})`;
    ctx.lineWidth = 1.5;
    [-wristH * 0.3, -wristH * 0.65].forEach((ly) => {
      ctx.beginPath();
      ctx.moveTo(-w * 0.42, ly);
      ctx.lineTo(w * 0.42, ly);
      ctx.stroke();
    });

    // 3. Bloque Central de la Palma y Mano Cerrada
    const palmGrad = ctx.createLinearGradient(-w * 0.55, -wristH, w * 0.55, -knuckleBaseH);
    palmGrad.addColorStop(0, `rgba(109, 76, 65, ${alpha})`);
    palmGrad.addColorStop(0.4, `rgba(93, 64, 55, ${alpha})`);
    palmGrad.addColorStop(1, `rgba(62, 39, 35, ${alpha})`);

    ctx.fillStyle = palmGrad;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -wristH);
    ctx.lineTo(-w * 0.54, -knuckleBaseH);
    ctx.lineTo(w * 0.54, -knuckleBaseH);
    ctx.lineTo(w * 0.42, -wristH);
    ctx.closePath();
    ctx.fill();

    // Arista biselada de la palma
    ctx.strokeStyle = `rgba(161, 136, 127, ${0.75 * alpha})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -wristH);
    ctx.lineTo(-w * 0.54, -knuckleBaseH);
    ctx.stroke();

    // 4. Pulgar cerrado y trabado sobre los dedos laterales
    const thumbGrad = ctx.createLinearGradient(-w * 0.6, -wristH * 0.7, -w * 0.2, -knuckleBaseH * 0.85);
    thumbGrad.addColorStop(0, `rgba(78, 52, 46, ${alpha})`);
    thumbGrad.addColorStop(1, `rgba(141, 110, 99, ${alpha})`);

    ctx.fillStyle = thumbGrad;
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, -wristH * 0.6);
    ctx.lineTo(-w * 0.62, -wristH * 0.95);
    ctx.lineTo(-w * 0.45, -knuckleBaseH * 0.9);
    ctx.lineTo(-w * 0.2, -wristH * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(188, 170, 164, ${0.7 * alpha})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 5. Los 4 Nudillos Angulares de Roca (Índice, Medio, Anular, Meñique)
    // El nudillo del medio es el más elevado en el golpe uppercut
    const knuckleOffsets = [
      { xPct: -0.38, wPct: 0.24, hDelta: -h * 0.08 },
      { xPct: -0.12, wPct: 0.28, hDelta: 0 },         // Nudillo central (Ápice)
      { xPct: 0.16, wPct: 0.26, hDelta: -h * 0.05 },
      { xPct: 0.40, wPct: 0.22, hDelta: -h * 0.12 },
    ];

    knuckleOffsets.forEach((k) => {
      const kx = k.xPct * w;
      const kw = k.wPct * w;
      const topY = -apexH + k.hDelta;
      const baseY = -knuckleBaseH;

      // Faceta frontal izquierda del nudillo (Iluminada)
      const kGrad = ctx.createLinearGradient(kx - kw * 0.5, topY, kx + kw * 0.5, baseY);
      kGrad.addColorStop(0, `rgba(215, 204, 200, ${alpha})`);
      kGrad.addColorStop(0.35, `rgba(141, 110, 99, ${alpha})`);
      kGrad.addColorStop(1, `rgba(78, 52, 46, ${alpha})`);

      ctx.fillStyle = kGrad;
      ctx.beginPath();
      ctx.moveTo(kx - kw * 0.48, baseY);
      ctx.lineTo(kx - kw * 0.35, topY + 4);
      ctx.lineTo(kx, topY);
      ctx.lineTo(kx + kw * 0.48, baseY);
      ctx.closePath();
      ctx.fill();

      // Arista biselada de impacto en el nudillo
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(kx, topY);
      ctx.lineTo(kx - kw * 0.35, topY + 4);
      ctx.stroke();
    });

    // 6. Vetas de Energía Telúrica y Geodas Sísmicas (Ámbar / Oro brillante)
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.9 * alpha})`;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -wristH * 0.2);
    ctx.lineTo(-w * 0.1, -wristH * 0.7);
    ctx.lineTo(w * 0.08, -knuckleBaseH * 0.95);
    ctx.lineTo(-w * 0.05, -apexH + 6);
    ctx.stroke();

    // Núcleo blanco-dorado
    ctx.strokeStyle = `rgba(254, 240, 138, ${0.95 * alpha})`;
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 7. En fase de colapso: fracturas adicionales que parten el puño
    if (fist.phase === 'collapse') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, -apexH * 0.6);
      ctx.lineTo(w * 0.35, -apexH * 0.4);
      ctx.lineTo(-w * 0.1, -wristH * 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Previsualización de retícula de impacto para Puño Tectónico al apuntar / cargar
  private static drawTectonicAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ang = wizard.facingAngle;
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const dist = 220;
    const squish = 0.58;
    const tx = wizard.x + Math.cos(ang) * dist;
    const ty = wizard.y + Math.sin(ang) * dist * squish;
    const r = isReady ? 52 : 40;

    ctx.save();
    ctx.translate(tx, ty);

    // Círculo de impacto punteado en el suelo
    ctx.strokeStyle = isReady ? 'rgba(254, 240, 138, 0.85)' : 'rgba(217, 119, 6, 0.65)';
    ctx.lineWidth = isReady ? 2.5 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * squish, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cruz de mira telúrica
    ctx.strokeStyle = isReady ? '#fef08a' : '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, 0);
    ctx.lineTo(r * 0.4, 0);
    ctx.moveTo(0, -r * 0.4 * squish);
    ctx.lineTo(0, r * 0.4 * squish);
    ctx.stroke();

    ctx.restore();
  }

  // Previsualización de retícula / rayo de puntería para Rayo Criogénico al cargar
  private static drawCryoAimTrajectory(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ang = wizard.facingAngle;
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const length = 400;
    const squish = 0.72;

    ctx.save();

    const startX = wizard.x + Math.cos(ang) * 16;
    const startY = wizard.y - 12 + Math.sin(ang) * 10;
    const endX = startX + Math.cos(ang) * length;
    const endY = startY + Math.sin(ang) * length * squish;

    // Haz guía láser dual (cian gélido + violeta voltaico)
    ctx.strokeStyle = isReady ? 'rgba(0, 240, 255, 0.85)' : 'rgba(124, 77, 255, 0.45)';
    ctx.lineWidth = isReady ? 3.0 : 1.8;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Línea interior brillante
    ctx.strokeStyle = isReady ? '#ffffff' : 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = isReady ? 1.5 : 0.8;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Partículas de plasma a lo largo de la guía
    const numDots = isReady ? 10 : 6;
    for (let i = 1; i <= numDots; i++) {
      const prog = (i / numDots + (Date.now() * 0.002) % 1) % 1;
      const px = startX + (endX - startX) * prog;
      const py = startY + (endY - startY) * prog;
      ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#a855f7';
      ctx.beginPath();
      ctx.arc(px, py, isReady ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Retícula de impacto en el extremo
    ctx.save();
    ctx.translate(endX, endY);
    const pulse = 1 + Math.sin(Date.now() * 0.015) * 0.15;
    const r = (isReady ? 28 : 20) * pulse;

    ctx.strokeStyle = isReady ? '#00f0ff' : '#7c4dff';
    ctx.lineWidth = isReady ? 2.2 : 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (isReady) {
      // Indicador de sobrecarga +50%
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+50% CRÍO', 0, -r * 0.7);
    }
    ctx.restore();

    ctx.restore();
  }

  // DIBUJO DE RAYO CRIOGÉNICO (HIELO + RAYO) CON NÚCLEO PENETRANTE Y ESPIRALES VOLTAICAS
  private static drawCryoBeams(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number },
    beams: CryoBeamEntity[]
  ) {
    if (!beams || beams.length === 0) return;

    beams.forEach((beam) => {
      if (beam.finished) return;

      ctx.save();

      // Origen: anclado al jugador / báculo en tiempo real para permitir movimiento mientras dispara
      const originX = beam.originX ?? (wizard.x + Math.cos(beam.aimAngle) * 16);
      const originY = beam.originY ?? (wizard.y - 12 + Math.sin(beam.aimAngle) * 10);
      const angle = beam.aimAngle;
      const range = beam.range || 400;
      const squish = 0.72; // Factor isométrico de perspectiva para el suelo y el haz

      const endX = originX + Math.cos(angle) * range;
      const endY = originY + Math.sin(angle) * range * squish;

      // Cálculo de desvanecimiento suave (fade out)
      const remainingMs = beam.durationMs - beam.elapsedMs;
      const alpha = remainingMs < 180 ? Math.max(0, remainingMs / 180) : (beam.elapsedMs < 80 ? beam.elapsedMs / 80 : 1.0);
      const isOverloaded = beam.isCharged;
      const baseWidth = (beam.width || (isOverloaded ? 20 : 14)) * (isOverloaded ? 1.25 : 1.0);

      const dx = endX - originX;
      const dy = endY - originY;
      const len = Math.hypot(dx, dy);
      const ux = dx / (len || 1);
      const uy = dy / (len || 1);
      // Vector perpendicular para el grosor y las hélices
      const nx = -uy;
      const ny = ux;

      const now = Date.now();

      // 1. Aura de permafrost y resplandor eléctrico en el suelo bajo el rayo
      ctx.save();
      ctx.globalAlpha = 0.35 * alpha;
      const floorGrad = ctx.createLinearGradient(originX, originY, endX, endY);
      floorGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
      floorGrad.addColorStop(0.5, 'rgba(124, 77, 255, 0.3)');
      floorGrad.addColorStop(1, 'rgba(0, 240, 255, 0.1)');
      ctx.strokeStyle = floorGrad;
      ctx.lineWidth = baseWidth * 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(originX, originY + 14);
      ctx.lineTo(endX, endY + 14);
      ctx.stroke();
      ctx.restore();

      // 2. Funda exterior de plasma gélido (Outer Sheath)
      ctx.save();
      ctx.globalAlpha = 0.85 * alpha;
      const sheathGrad = ctx.createLinearGradient(originX, originY, endX, endY);
      sheathGrad.addColorStop(0, isOverloaded ? '#00f0ff' : '#0284c7');
      sheathGrad.addColorStop(0.4, isOverloaded ? '#7c4dff' : '#00e5ff');
      sheathGrad.addColorStop(0.8, isOverloaded ? '#a855f7' : '#0284c7');
      sheathGrad.addColorStop(1, '#00f0ff');
      ctx.strokeStyle = sheathGrad;
      ctx.lineWidth = baseWidth * 1.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = isOverloaded ? '#7c4dff' : '#00f0ff';
      ctx.shadowBlur = isOverloaded ? 22 : 14;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // 3. Flujo interior de Frío Cero Absoluto (Core Frost Stream con micro-ondulación)
      ctx.strokeStyle = '#e0f7fa';
      ctx.lineWidth = baseWidth * 0.75;
      ctx.shadowBlur = isOverloaded ? 16 : 8;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      const waveSteps = 24;
      ctx.moveTo(originX, originY);
      for (let w = 1; w <= waveSteps; w++) {
        const prog = w / waveSteps;
        const wx = originX + dx * prog;
        const wy = originY + dy * prog;
        const waveAmp = (1 - prog * 0.5) * (isOverloaded ? 3.5 : 2.0);
        const waveOffset = Math.sin(now * 0.025 + prog * 16) * waveAmp;
        ctx.lineTo(wx + nx * waveOffset, wy + ny * waveOffset);
      }
      ctx.stroke();

      // 4. Espina central blanca incandescente (White Incandescent Spine)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = baseWidth * (isOverloaded ? 0.42 : 0.28);
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();

      // 5. Espirales Voltaicas Orbitantes (Helical Plasma Currents)
      ctx.save();
      ctx.globalAlpha = 0.9 * alpha;
      const helixSteps = 36;
      const helixRadius = baseWidth * (isOverloaded ? 1.6 : 1.25);
      const speed = now * 0.018;

      // Hélice 1: Plasma Violeta (#a855f7 / #c084fc)
      ctx.strokeStyle = isOverloaded ? '#c084fc' : '#a855f7';
      ctx.lineWidth = isOverloaded ? 2.5 : 1.8;
      ctx.beginPath();
      for (let h = 0; h <= helixSteps; h++) {
        const hp = h / helixSteps;
        const hx = originX + dx * hp;
        const hy = originY + dy * hp;
        const phase = hp * 18 - speed;
        const offset = Math.sin(phase) * helixRadius;
        if (h === 0) ctx.moveTo(hx + nx * offset, hy + ny * offset);
        else ctx.lineTo(hx + nx * offset, hy + ny * offset);
      }
      ctx.stroke();

      // Hélice 2: Plasma Cobalto / Cian Eléctrico (#00f0ff) en contrafase
      ctx.strokeStyle = isOverloaded ? '#ffffff' : '#00f0ff';
      ctx.lineWidth = isOverloaded ? 2.2 : 1.6;
      ctx.beginPath();
      for (let h = 0; h <= helixSteps; h++) {
        const hp = h / helixSteps;
        const hx = originX + dx * hp;
        const hy = originY + dy * hp;
        const phase = hp * 18 - speed + Math.PI;
        const offset = Math.sin(phase) * helixRadius;
        if (h === 0) ctx.moveTo(hx + nx * offset, hy + ny * offset);
        else ctx.lineTo(hx + nx * offset, hy + ny * offset);
      }
      ctx.stroke();

      // Chispas y micro-descargas transversales entre hélices
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.2;
      const sparkCount = isOverloaded ? 6 : 4;
      for (let s = 0; s < sparkCount; s++) {
        const spProg = ((now * 0.003 + s * 0.23) % 0.9) + 0.05;
        const spX = originX + dx * spProg;
        const spY = originY + dy * spProg;
        const spOffset = (Math.sin(spProg * 22 + speed) * helixRadius);
        const jx = (Math.random() - 0.5) * 8;
        const jy = (Math.random() - 0.5) * 8;
        ctx.beginPath();
        ctx.moveTo(spX, spY);
        ctx.lineTo(spX + nx * spOffset + jx, spY + ny * spOffset + jy);
        ctx.stroke();
      }
      ctx.restore();

      // 6. Destello de boca en estrella de diamante en la punta del báculo (Muzzle Flare)
      ctx.save();
      ctx.translate(originX, originY);
      ctx.globalAlpha = alpha;
      const starR = (isOverloaded ? 22 : 15) + Math.sin(now * 0.03) * 3;

      // Resplandor radial
      const flareGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, starR * 1.5);
      flareGrad.addColorStop(0, '#ffffff');
      flareGrad.addColorStop(0.35, '#00f0ff');
      flareGrad.addColorStop(0.7, '#7c4dff');
      flareGrad.addColorStop(1, 'rgba(124, 77, 255, 0)');
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(0, 0, starR * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Estrella diamante de 4 puntas
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -starR);
      ctx.lineTo(starR * 0.25, -starR * 0.25);
      ctx.lineTo(starR, 0);
      ctx.lineTo(starR * 0.25, starR * 0.25);
      ctx.lineTo(0, starR);
      ctx.lineTo(-starR * 0.25, starR * 0.25);
      ctx.lineTo(-starR, 0);
      ctx.lineTo(-starR * 0.25, -starR * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 7. Salpicadura de impacto terminal y ondas de choque gélidas (Terminal Impact)
      ctx.save();
      ctx.translate(endX, endY);
      ctx.globalAlpha = 0.85 * alpha;
      const termPulse = (isOverloaded ? 28 : 20) + Math.sin(now * 0.02) * 4;

      // Halo de impacto
      const impactGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, termPulse);
      impactGrad.addColorStop(0, '#ffffff');
      impactGrad.addColorStop(0.4, '#00f0ff');
      impactGrad.addColorStop(0.8, 'rgba(124, 77, 255, 0.4)');
      impactGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = impactGrad;
      ctx.beginPath();
      ctx.arc(0, 0, termPulse, 0, Math.PI * 2);
      ctx.fill();

      // Anillo de escarcha expansivo
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(0, 0, termPulse * 0.85, termPulse * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Fragmentos de hielo expulsados hacia afuera
      const shardCount = isOverloaded ? 6 : 4;
      for (let sc = 0; sc < shardCount; sc++) {
        const scAng = angle + Math.PI + (sc - shardCount / 2) * 0.5 + Math.sin(now * 0.01 + sc) * 0.2;
        const scDist = termPulse * (0.6 + (sc % 2) * 0.4);
        ctx.fillStyle = sc % 2 === 0 ? '#e0f7fa' : '#a855f7';
        ctx.beginPath();
        ctx.arc(Math.cos(scAng) * scDist, Math.sin(scAng) * scDist * 0.6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.restore();
    });
  }

  // =========================================================================
  // TRINCHERA DE MAGMA (FUEGO + FUEGO + TIERRA: GRIETA SEGMENTADA Y LAVA)
  // =========================================================================
  private static drawMagmaTrenches(ctx: CanvasRenderingContext2D, trenches: MagmaTrenchEntity[]) {
    if (!trenches || trenches.length === 0) return;

    trenches.forEach((trench) => {
      if (trench.finished) return;

      ctx.save();
      ctx.translate(Math.round(trench.startX), Math.round(trench.startY));
      ctx.rotate(trench.angle);

      const lifeRatio = Math.max(0, 1 - trench.elapsedMs / trench.durationMs);
      const alpha = Math.min(1, lifeRatio * 1.4);
      ctx.globalAlpha = alpha;

      const len = trench.length;
      const halfW = Math.round(trench.width / 2);

      // 1. Bordes de roca carbonizada (#18181B)
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, -halfW - 3, len, trench.width + 6);

      // Bloques escalonados de roca volcánica en los bordes para estilo pixel art
      ctx.fillStyle = '#27272a';
      for (let x = 0; x < len; x += 14) {
        const stepTop = ((x / 14) % 2 === 0) ? 2 : 0;
        const stepBot = ((x / 14) % 3 === 0) ? 2 : 0;
        ctx.fillRect(x, -halfW - 3 - stepTop, 10, stepTop);
        ctx.fillRect(x, halfW + 3, 10, stepBot);
      }

      // 2. Fondo profundo de hendidura de magma
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(2, -halfW, len - 4, trench.width);

      // 3. Grietas y bloques de lava en naranja (#EA580C)
      ctx.fillStyle = '#ea580c';
      for (let x = 4; x < len - 6; x += 12) {
        const wobble = Math.floor(Math.sin(x * 0.2 + trench.elapsedMs * 0.006) * 3);
        ctx.fillRect(x, -halfW + 3 + wobble, 9, trench.width - 6);
      }

      // 4. Grietas angulares en amarillo puro (#FDE047)
      ctx.fillStyle = '#fde047';
      for (let x = 8; x < len - 10; x += 16) {
        const wobbleY = Math.floor(Math.cos(x * 0.25 + trench.elapsedMs * 0.009) * 2);
        ctx.fillRect(x, -2 + wobbleY, 7, 4);
        ctx.fillRect(x + 3, -4 + wobbleY, 4, 8);
      }

      // 5. Núcleos incandescentes blanco puro
      ctx.fillStyle = '#ffffff';
      for (let x = 16; x < len - 16; x += 28) {
        ctx.fillRect(x, -1, 4, 3);
      }

      ctx.restore();
    });
  }

  // =========================================================================
  // HAZ DE FUSIÓN SOLAR (FUEGO + FUEGO + RAYO: HAZ DE PLASMA INSTANTÁNEO)
  // =========================================================================
  private static drawSolarFusionBeams(ctx: CanvasRenderingContext2D, beams: SolarFusionBeamEntity[]) {
    if (!beams || beams.length === 0) return;

    beams.forEach((beam) => {
      if (beam.finished) return;

      ctx.save();
      ctx.translate(Math.round(beam.originX), Math.round(beam.originY));
      ctx.rotate(beam.aimAngle);

      const remainingRatio = Math.max(0, 1 - beam.elapsedMs / beam.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.5);
      ctx.globalAlpha = alpha;

      const len = beam.length;
      const halfW = Math.round(beam.width / 2);
      const pulse = Math.floor(beam.elapsedMs * 0.05) % 2;

      // 1. Contorno pixel art oscuro exterior
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -halfW - 2, len, beam.width + 4);

      // 2. Franja exterior de bordes amarillos (#FACC15)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, -halfW, len, beam.width);

      // Dientes de sierra / escalonado de plasma naranja (#F97316) en los límites
      ctx.fillStyle = '#f97316';
      for (let x = 0; x < len; x += 10) {
        const h = ((x / 10 + pulse) % 2 === 0) ? 3 : 1;
        ctx.fillRect(x, -halfW - h, 7, h);
        ctx.fillRect(x, halfW, 7, h);
      }

      // 3. Franja central de píxeles blanco puro (#FFFFFF)
      ctx.fillStyle = '#ffffff';
      const centerH = Math.round(beam.width * 0.45);
      ctx.fillRect(0, -Math.round(centerH / 2), len, centerH);

      // 4. Chispas cuadradas rojas que parpadean a lo largo del rayo (#EF4444)
      ctx.fillStyle = '#ef4444';
      for (let x = 8; x < len - 12; x += 20) {
        const spkOffset = ((x / 20 + pulse) % 3 - 1) * (halfW - 3);
        ctx.fillRect(x, spkOffset - 2, 4, 4);
        ctx.fillRect(x + 2, spkOffset - 4, 2, 8);
      }

      // 5. Orbe de ignición solar concentrado en el origen
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-9, -5, 2, 10);
      ctx.fillRect(7, -5, 2, 10);
      ctx.fillRect(-5, -9, 10, 2);
      ctx.fillRect(-5, 7, 10, 2);

      ctx.restore();
    });
  }

  // =========================================================================
  // ALUD DE AGUJAS TELÚRICAS (HIELO + HIELO + TIERRA: FISURAS Y ESCARCHA EN SUELO)
  // =========================================================================
  private static drawGlacialAvalancheGround(
    ctx: CanvasRenderingContext2D,
    avalanches: GlacialAvalancheEntity[]
  ) {
    if (!avalanches || avalanches.length === 0) return;

    avalanches.forEach((ava) => {
      if (ava.finished) return;

      const lifeRatio = Math.max(0, 1 - ava.elapsedMs / ava.durationMs);
      const alpha = Math.min(1, lifeRatio * 1.5);

      ctx.save();
      ctx.globalAlpha = alpha;

      ava.spikes.forEach((spike) => {
        if (ava.elapsedMs < spike.delayMs) return;

        const bx = Math.round(spike.x);
        const by = Math.round(spike.y);

        // Base de roca fracturada (#18181B)
        ctx.fillStyle = '#18181b';
        ctx.fillRect(bx - 16, by - 6, 32, 12);
        ctx.fillRect(bx - 12, by - 8, 24, 16);

        // Bloques escalonados de roca telúrica (#27272A)
        ctx.fillStyle = '#27272a';
        ctx.fillRect(bx - 14, by - 5, 28, 10);
        ctx.fillRect(bx - 10, by - 7, 20, 14);

        // Fracturas de escarcha ártica (#38BDF8)
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(bx - 11, by - 2, 8, 3);
        ctx.fillRect(bx + 3, by - 1, 9, 3);
        ctx.fillRect(bx - 3, by - 5, 4, 10);

        // Runa de hielo blanco puro (#FFFFFF) en el punto de brote
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx - 2, by - 2, 4, 4);
      });

      ctx.restore();
    });
  }

  // =========================================================================
  // ALUD DE AGUJAS TELÚRICAS (HIELO + HIELO + TIERRA: PICO TRIANGULAR ESCALONADO)
  // =========================================================================
  private static drawGlacialAvalancheSpike(
    ctx: CanvasRenderingContext2D,
    spike: GlacialAvalancheSpike,
    avalanche: GlacialAvalancheEntity
  ) {
    const h = Math.round(spike.height);
    if (h <= 2) return;

    const bx = Math.round(spike.x);
    const by = Math.round(spike.y);

    const lifeRatio = Math.max(0, 1 - avalanche.elapsedMs / avalanche.durationMs);
    const alpha = Math.min(1, lifeRatio * 1.5);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Dibujamos el pico como una pirámide/aguja escalonada en tramos de 4px de alto
    const stepHeight = 4;
    const totalSteps = Math.ceil(h / stepHeight);
    const baseHalfW = Math.round(spike.width / 2);

    for (let step = 0; step < totalSteps; step++) {
      const stepY = by - (step + 1) * stepHeight;
      const progress = step / totalSteps; // 0 en base, 1 en punta
      const curHalfW = Math.max(2, Math.round(baseHalfW * (1 - progress * 0.85)));

      // 1. Contorno oscuro (#0F172A)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bx - curHalfW - 2, stepY, (curHalfW + 2) * 2, stepHeight);

      // 2. Base y cara sombreada de roca oscura (#27272A)
      if (progress < 0.35) {
        ctx.fillStyle = '#27272a';
      } else {
        ctx.fillStyle = '#1e293b';
      }
      ctx.fillRect(bx - curHalfW, stepY, curHalfW * 2, stepHeight);

      // 3. Faceta lateral en azul glaciar (#0284C7)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(bx - curHalfW, stepY, Math.round(curHalfW * 0.8), stepHeight);

      // 4. Arista central en azul ártico brillante (#38BDF8)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(bx - 1, stepY, Math.max(2, Math.round(curHalfW * 0.6)), stepHeight);

      // 5. Brillo superior y puntas filosas en blanco puro (#FFFFFF)
      if (progress >= 0.7) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx - 2, stepY, 4, stepHeight);
      }
    }

    // Punta filosa terminal en blanco puro
    const tipY = by - h;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 2, tipY - 3, 4, 4);
    ctx.fillRect(bx - 1, tipY - 5, 2, 3);

    // Esquirlas cuadradas de hielo que saltan hacia arriba
    if (spike.erupted) {
      const shardAnim = Math.floor(avalanche.elapsedMs * 0.02) % 3;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(bx - 6 - shardAnim * 2, tipY - 6 - shardAnim * 3, 3, 3);
      ctx.fillRect(bx + 5 + shardAnim * 2, tipY - 4 - shardAnim * 4, 3, 3);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx - 3 + shardAnim, tipY - 9 - shardAnim * 2, 2, 2);
      ctx.fillRect(bx + 2 - shardAnim, tipY - 8 - shardAnim * 3, 2, 2);
    }

    ctx.restore();
  }

  // =========================================================================
  // LLUVIA DE GRANIZO HIRVIENTE (HIELO + HIELO + FUEGO: RUNAS DE IMPACTO Y VAPOR)
  // =========================================================================
  private static drawBoilingHailGround(
    ctx: CanvasRenderingContext2D,
    hails: BoilingHailEntity[]
  ) {
    if (!hails || hails.length === 0) return;

    hails.forEach((hail) => {
      if (hail.finished) return;

      const remainingRatio = Math.max(0, 1 - hail.elapsedMs / hail.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.4);

      ctx.save();
      ctx.globalAlpha = alpha;

      const cx = Math.round(hail.centerX);
      const cy = Math.round(hail.centerY);
      const rad = hail.radius; // 90px
      const squish = 0.58;

      // 1. Círculo de runa térmica/escarcha exterior discontinuo en pixel art
      ctx.fillStyle = '#38bdf8';
      const steps = 16;
      for (let i = 0; i < steps; i++) {
        const ang = (i / steps) * Math.PI * 2 + hail.elapsedMs * 0.002;
        const px = Math.round(cx + Math.cos(ang) * rad);
        const py = Math.round(cy + Math.sin(ang) * rad * squish);
        ctx.fillRect(px - 3, py - 2, 6, 4);
      }

      // 2. Anillo interior térmico naranja incandescente (#EA580C)
      ctx.fillStyle = '#ea580c';
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 - hail.elapsedMs * 0.003;
        const px = Math.round(cx + Math.cos(ang) * (rad * 0.5));
        const py = Math.round(cy + Math.sin(ang) * (rad * 0.5) * squish);
        ctx.fillRect(px - 2, py - 2, 5, 4);
      }

      // 3. Impactos en suelo de carámbanos ya estrellados: vapor blanco y chispas rojas
      hail.icicles.forEach((icicle) => {
        if (!icicle.hasImpacted) return;

        const ix = Math.round(icicle.targetX);
        const iy = Math.round(icicle.targetY);

        // Cráter gélido/ardiente
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(ix - 8, iy - 4, 16, 8);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(ix - 6, iy - 3, 12, 6);
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(ix - 3, iy - 2, 6, 4);

        // Nubes cuadradas de vapor blanco disipándose (#FFFFFF)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix - 10, iy - 8, 5, 5);
        ctx.fillRect(ix + 6, iy - 10, 6, 6);
        ctx.fillRect(ix - 2, iy - 14, 5, 5);

        // Chispas rojas (#EF4444)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(ix - 12, iy - 4, 3, 3);
        ctx.fillRect(ix + 10, iy - 6, 3, 3);
        ctx.fillRect(ix + 3, iy - 16, 3, 3);
      });

      ctx.restore();
    });
  }

  // =========================================================================
  // LLUVIA DE GRANIZO HIRVIENTE (HIELO + HIELO + FUEGO: ROMBOIDE PIXELADO EN CAÍDA)
  // =========================================================================
  private static drawBoilingHailIcicle(
    ctx: CanvasRenderingContext2D,
    icicle: BoilingHailIcicle
  ) {
    const cx = Math.round(icicle.currentX);
    const cy = Math.round(icicle.currentY);

    ctx.save();
    // Inclinación diagonal hacia la diana
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI * 0.22);

    // 1. Contorno oscuro exterior (#0F172A)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -14, 4, 28);
    ctx.fillRect(-5, -10, 10, 20);
    ctx.fillRect(-7, -6, 14, 12);

    // 2. Cuerpo gélido celeste (#7DD3FC)
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(-1, -12, 2, 24);
    ctx.fillRect(-4, -8, 8, 16);
    ctx.fillRect(-6, -4, 12, 8);

    // 3. Facetas en azul ártico (#38BDF8)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-3, -6, 6, 12);

    // 4. Núcleo incandescente térmico rojo/naranja (#EA580C)
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-2, -3, 4, 6);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-1, -2, 2, 4);

    // 5. Destello central blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -1, 2, 2);

    // Estela de vapor blanco y chispas rojas tras el carámbano
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -18, 3, 3);
    ctx.fillRect(2, -22, 2, 2);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-3, -24, 2, 2);

    ctx.restore();
  }

  // =========================================================================
  // TORMENTA CRIOELECTROSTÁTICA (HIELO + HIELO + RAYO: SUELO Y GLIFOS CONDUCTORES)
  // =========================================================================
  private static drawSuperconductorBlizzardGround(
    ctx: CanvasRenderingContext2D,
    blizzards: SuperconductorBlizzardEntity[]
  ) {
    if (!blizzards || blizzards.length === 0) return;

    blizzards.forEach((blizz) => {
      if (blizz.finished) return;

      const remainingRatio = Math.max(0, 1 - blizz.elapsedMs / blizz.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.4);

      ctx.save();
      ctx.globalAlpha = alpha;

      const cx = Math.round(blizz.centerX);
      const cy = Math.round(blizz.centerY);
      const rad = blizz.radius; // 80px
      const squish = 0.58;

      // 1. Fondo sombreado de vórtice magnético en suelo
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(cx - rad, cy - Math.round(rad * squish), rad * 2, Math.round(rad * squish * 2));

      // 2. Anillo exterior de escarcha superconductora (#BAE6FD)
      ctx.fillStyle = '#bae6fd';
      const steps = 18;
      for (let i = 0; i < steps; i++) {
        const ang = (i / steps) * Math.PI * 2 + blizz.angle;
        const px = Math.round(cx + Math.cos(ang) * rad);
        const py = Math.round(cy + Math.sin(ang) * rad * squish);
        ctx.fillRect(px - 3, py - 2, 6, 4);
      }

      // 3. Anillo intermedio violeta superconductor (#A855F7)
      ctx.fillStyle = '#a855f7';
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 - blizz.angle * 1.5;
        const px = Math.round(cx + Math.cos(ang) * (rad * 0.65));
        const py = Math.round(cy + Math.sin(ang) * (rad * 0.65) * squish);
        ctx.fillRect(px - 2, py - 2, 5, 4);
      }

      // 4. Glifo en cruz de condensador magnético en el centro
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(cx - 8, cy - 2, 16, 4);
      ctx.fillRect(cx - 2, cy - Math.round(8 * squish), 4, Math.round(16 * squish));

      ctx.restore();
    });
  }

  // =========================================================================
  // TORMENTA CRIOELECTROSTÁTICA (HIELO + HIELO + RAYO: ANILLO GIRATORIO Y RELÁMPAGOS)
  // =========================================================================
  private static drawSuperconductorBlizzardVortex(
    ctx: CanvasRenderingContext2D,
    blizzards: SuperconductorBlizzardEntity[]
  ) {
    if (!blizzards || blizzards.length === 0) return;

    blizzards.forEach((blizz) => {
      if (blizz.finished) return;

      const remainingRatio = Math.max(0, 1 - blizz.elapsedMs / blizz.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.4);

      ctx.save();
      ctx.globalAlpha = alpha;

      const cx = Math.round(blizz.centerX);
      const cy = Math.round(blizz.centerY);
      const rad = blizz.radius; // 80px
      const squish = 0.58;
      const ang = blizz.angle;

      // 1. Bloques cuadrados y copos giratorios de escarcha (#BAE6FD)
      const flakeCount = 14;
      for (let i = 0; i < flakeCount; i++) {
        const fAng = ang + (i / flakeCount) * Math.PI * 2;
        const fDist = rad * (0.45 + 0.5 * ((i % 3) / 2));
        const fx = Math.round(cx + Math.cos(fAng) * fDist);
        const fy = Math.round(cy + Math.sin(fAng) * fDist * squish - 12 - (i % 4) * 5);
        const size = (i % 2 === 0) ? 5 : 4;

        // Contorno oscuro de píxel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fx - 1, fy - 1, size + 2, size + 2);

        // Copo de hielo
        ctx.fillStyle = i % 2 === 0 ? '#bae6fd' : '#7dd3fc';
        ctx.fillRect(fx, fy, size, size);

        // Núcleo brillante
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx + 1, fy + 1, 2, 2);
      }

      // 2. Líneas quebradas de relámpago pixelado en violeta (#A855F7) y cian brillante (#00F0FF)
      const boltBranches = 4;
      for (let b = 0; b < boltBranches; b++) {
        const branchAng = -ang * 2 + (b / boltBranches) * Math.PI * 2;
        const color = (b % 2 === 0) ? '#a855f7' : '#00f0ff';
        ctx.fillStyle = color;

        let curX = cx;
        let curY = cy - 10;
        const segs = 4;

        for (let s = 0; s < segs; s++) {
          const nextDist = (rad * 0.85) * ((s + 1) / segs);
          const jitterAng = branchAng + ((s % 2 === 0) ? 0.25 : -0.25);
          const nextX = Math.round(cx + Math.cos(jitterAng) * nextDist);
          const nextY = Math.round(cy + Math.sin(jitterAng) * nextDist * squish - 10);

          // Trazar línea escalonada pixelada (Manhattan / 90° segments)
          ctx.fillRect(curX - 1, curY - 1, (nextX - curX) + 2, 2);
          ctx.fillRect(nextX - 1, curY - 1, 2, (nextY - curY) + 2);

          // Chispa cuadrada en el quiebre
          ctx.fillRect(nextX - 2, nextY - 2, 4, 4);

          curX = nextX;
          curY = nextY;
        }
      }

      // 3. Chispas cuadradas flotantes violetas y cian en el torbellino
      for (let s = 0; s < 6; s++) {
        const sAng = ang * 3 + s * 1.1;
        const sDist = rad * 0.35 + (s * 8);
        const sx = Math.round(cx + Math.cos(sAng) * sDist);
        const sy = Math.round(cy + Math.sin(sAng) * sDist * squish - 8);

        ctx.fillStyle = s % 2 === 0 ? '#a855f7' : '#00f0ff';
        ctx.fillRect(sx, sy, 3, 3);
      }

      ctx.restore();
    });
  }

  // =========================================================================
  // PILÓN DE PARARRAYOS (RAYO + RAYO + TIERRA: SUELO Y CAMPO MAGNÉTICO)
  // =========================================================================
  private static drawLightningRodPylonGround(
    ctx: CanvasRenderingContext2D,
    pylons: LightningRodPylonEntity[]
  ) {
    if (!pylons || pylons.length === 0) return;

    pylons.forEach((pylon) => {
      if (pylon.finished) return;

      const remainingRatio = Math.max(0, 1 - pylon.elapsedMs / pylon.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.5);

      ctx.save();
      ctx.globalAlpha = alpha;

      const px = Math.round(pylon.x);
      const py = Math.round(pylon.y);
      const rad = pylon.pullRadius; // 90px
      const squish = 0.58;

      // 1. Sombra isométrica y losa base en el suelo (#0F172A)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 16, py - 6, 32, 12);
      ctx.fillRect(px - 12, py - 9, 24, 18);

      // Plinto de piedra tallada (#1E293B)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - 14, py - 5, 28, 10);
      ctx.fillRect(px - 10, py - 7, 20, 14);

      // Grietas de anclaje telúrico (#FACC15)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 11, py - 2, 7, 3);
      ctx.fillRect(px + 4, py - 2, 7, 3);
      ctx.fillRect(px - 2, py - 6, 4, 12);

      // 2. Anillo magnético perimetral de 90px con trazos discontinuos
      ctx.fillStyle = '#facc15';
      const steps = 18;
      for (let i = 0; i < steps; i++) {
        const ang = (i / steps) * Math.PI * 2 + pylon.elapsedMs * 0.003;
        const bx = Math.round(px + Math.cos(ang) * rad);
        const by = Math.round(py + Math.sin(ang) * rad * squish);
        ctx.fillRect(bx - 3, by - 2, 6, 4);
      }

      // 3. Onda expansiva de pulso magnético radial
      if (pylon.pulseWaveAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = pylon.pulseWaveAlpha * alpha;
        ctx.fillStyle = '#fef08a';
        const waveRad = Math.round(rad * (1 - pylon.pulseWaveAlpha * 0.7));
        for (let i = 0; i < 16; i++) {
          const ang = (i / 16) * Math.PI * 2;
          const wx = Math.round(px + Math.cos(ang) * waveRad);
          const wy = Math.round(py + Math.sin(ang) * waveRad * squish);
          ctx.fillRect(wx - 2, wy - 2, 5, 4);
        }
        ctx.restore();
      }

      ctx.restore();
    });
  }

  // =========================================================================
  // PILÓN DE PARARRAYOS (RAYO + RAYO + TIERRA: OBELISCO Y RUNAS)
  // =========================================================================
  private static drawLightningRodPylonObelisk(
    ctx: CanvasRenderingContext2D,
    pylon: LightningRodPylonEntity
  ) {
    const px = Math.round(pylon.x);
    const py = Math.round(pylon.y);

    const remainingRatio = Math.max(0, 1 - pylon.elapsedMs / pylon.durationMs);
    const alpha = Math.min(1, remainingRatio * 1.5);

    ctx.save();
    ctx.globalAlpha = alpha;

    const obeliskHeight = 46;
    const stepHeight = 4;
    const totalSteps = Math.ceil(obeliskHeight / stepHeight);
    const baseHalfW = 10;

    // Dibujar obelisco escalonado de piedra gris grafito (#1E293B)
    for (let step = 0; step < totalSteps; step++) {
      const stepY = py - (step + 1) * stepHeight;
      const progress = step / totalSteps;
      const curHalfW = Math.max(3, Math.round(baseHalfW * (1 - progress * 0.65)));

      // Contorno oscuro exterior (#0F172A)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - curHalfW - 2, stepY, (curHalfW + 2) * 2, stepHeight);

      // Bloques de piedra grafito (#1E293B)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - curHalfW, stepY, curHalfW * 2, stepHeight);

      // Faceta iluminada en grafito claro (#334155)
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - curHalfW, stepY, Math.round(curHalfW * 0.7), stepHeight);

      // Runa central incandescente (#FACC15)
      if (step >= 2 && step <= totalSteps - 2 && step % 2 === 0) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px - 2, stepY + 1, 4, stepHeight - 2);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px - 1, stepY + 1, 2, 2);
      }
    }

    // Cúpula conductora y vara de pararrayos
    const topY = py - obeliskHeight;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - 4, topY - 12, 8, 14);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px - 3, topY - 3, 6, 4);

    // Vara metálica vertical en blanco puro y amarillo (#FFFFFF / #FACC15)
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px - 2, topY - 10, 4, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px - 1, topY - 14, 2, 6);

    ctx.restore();
  }

  // =========================================================================
  // PILÓN DE PARARRAYOS (RAYO + RAYO + TIERRA: RAYOS RADIALES EN LÍNEAS QUEBRADAS)
  // =========================================================================
  private static drawLightningRodPylonArcs(
    ctx: CanvasRenderingContext2D,
    pylons: LightningRodPylonEntity[]
  ) {
    if (!pylons || pylons.length === 0) return;

    pylons.forEach((pylon) => {
      if (pylon.finished) return;

      const remainingRatio = Math.max(0, 1 - pylon.elapsedMs / pylon.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.5);

      ctx.save();
      ctx.globalAlpha = alpha;

      const px = Math.round(pylon.x);
      const tipY = Math.round(pylon.y - 58);

      // Chispas permanentes en la punta
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 2, tipY - 2, 4, 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 4, tipY, 2, 2);
      ctx.fillRect(px + 3, tipY, 2, 2);
      ctx.fillRect(px, tipY - 4, 2, 2);

      // Rayos radiales en líneas quebradas de 2px de ancho
      const branches = 3;
      for (let b = 0; b < branches; b++) {
        const branchAng = (b / branches) * Math.PI * 2 + pylon.elapsedMs * 0.01;
        ctx.fillStyle = b % 2 === 0 ? '#facc15' : '#ffffff';

        let curX = px;
        let curY = tipY;
        const segs = 3;

        for (let s = 0; s < segs; s++) {
          const dist = 16 + s * 14;
          const jitter = (s % 2 === 0 ? 0.3 : -0.3);
          const nextX = Math.round(px + Math.cos(branchAng + jitter) * dist);
          const nextY = Math.round(tipY + Math.sin(branchAng + jitter) * dist * 0.7);

          ctx.fillRect(curX, curY, nextX - curX + 2, 2);
          ctx.fillRect(nextX, curY, 2, nextY - curY + 2);

          curX = nextX;
          curY = nextY;
        }
      }

      ctx.restore();
    });
  }

  // =========================================================================
  // BOMBA DE PLASMA INESTABLE (RAYO + RAYO + FUEGO: ORBE Y SUPERNOVA DETONANTE)
  // =========================================================================
  private static drawPlasmaHyperOrb(
    ctx: CanvasRenderingContext2D,
    orb: PlasmaHyperOrbEntity
  ) {
    const ox = Math.round(orb.currentX);
    const oy = Math.round(orb.currentY);

    ctx.save();

    if (!orb.exploded) {
      // 1. Orbe pesado en vuelo: Núcleo cuadrado escalonado blanco con capas violeta y fuego naranja
      const pulse = Math.floor(orb.travelDist * 0.2) % 2;

      // Capa exterior naranja fuego (#EA580C) con contorno
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ox - 10, oy - 10, 20, 20);

      ctx.fillStyle = '#ea580c';
      ctx.fillRect(ox - 9, oy - 9, 18, 18);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(ox - 11 + pulse * 2, oy - 6, 3, 12);
      ctx.fillRect(ox + 8 - pulse * 2, oy - 6, 3, 12);

      // Capa media violeta brillante (#A855F7)
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(ox - 7, oy - 7, 14, 14);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(ox - 5, oy - 5, 10, 10);

      // Núcleo cuadrado escalonado en blanco puro (#FFFFFF)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox - 3, oy - 3, 6, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(ox - 1, oy - 1, 2, 2);
    } else {
      // 2. Supernova de Plasma: Anillo expansivo de bloques de energía desintegrándose en píxeles individuales
      const prog = orb.explosionProgress;
      const alpha = Math.max(0, 1 - prog);
      ctx.globalAlpha = alpha;

      const curRad = Math.round(orb.explosionRadius * Math.sin(prog * Math.PI / 2));
      const squish = 0.58;

      // Anillo de bloques de energía (4x4 px)
      const blockCount = 20;
      for (let i = 0; i < blockCount; i++) {
        const ang = (i / blockCount) * Math.PI * 2;
        const bx = Math.round(ox + Math.cos(ang) * curRad);
        const by = Math.round(oy + Math.sin(ang) * curRad * squish);

        ctx.fillStyle = i % 3 === 0 ? '#ffffff' : (i % 3 === 1 ? '#a855f7' : '#ea580c');
        ctx.fillRect(bx - 2, by - 2, 5, 4);

        // Píxeles individuales desintegrándose hacia los bordes
        const scatterDist = curRad * (1 + (i % 3) * 0.18 * prog);
        const sx = Math.round(ox + Math.cos(ang + 0.1) * scatterDist);
        const sy = Math.round(oy + Math.sin(ang + 0.1) * scatterDist * squish);
        ctx.fillRect(sx - 1, sy - 1, 3, 3);
      }

      // Núcleo inicial blanco intenso
      if (prog < 0.4) {
        ctx.fillStyle = '#ffffff';
        const coreSize = Math.round(18 * (1 - prog / 0.4));
        ctx.fillRect(ox - Math.round(coreSize / 2), oy - Math.round(coreSize * squish / 2), coreSize, Math.round(coreSize * squish));
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // DESCARGA DE CERO ABSOLUTO (RAYO + RAYO + HIELO: SUELO Y ESCARCHA RESIDUAL)
  // =========================================================================
  private static drawCryoArcFlashGround(
    ctx: CanvasRenderingContext2D,
    flashes: CryoArcFlashEntity[]
  ) {
    if (!flashes || flashes.length === 0) return;

    flashes.forEach((flash) => {
      if (flash.finished) return;

      const remainingRatio = Math.max(0, 1 - flash.elapsedMs / flash.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.5);

      ctx.save();
      ctx.globalAlpha = alpha;

      const ox = Math.round(flash.originX);
      const oy = Math.round(flash.originY);
      const cone = flash.coneAngle; // 120°
      const range = flash.range; // 260px
      const squish = 0.58;

      // Arco de escarcha residual y huella táctica en suelo
      ctx.fillStyle = '#38bdf8';
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const ang = flash.aimAngle - cone / 2 + (i / steps) * cone;
        const dist = range * 0.85;
        const px = Math.round(ox + Math.cos(ang) * dist);
        const py = Math.round(oy + Math.sin(ang) * dist * squish);
        ctx.fillRect(px - 3, py - 2, 7, 4);

        // Bloques escalonados de hielo azul glaciar (#E0F2FE)
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(px - 1, py - 4, 3, 2);
      }

      ctx.restore();
    });
  }

  // =========================================================================
  // DESCARGA DE CERO ABSOLUTO (RAYO + RAYO + HIELO: RELÁMPAGOS DENTADOS Y ESQUIRLAS)
  // =========================================================================
  private static drawCryoArcFlashVortex(
    ctx: CanvasRenderingContext2D,
    flashes: CryoArcFlashEntity[]
  ) {
    if (!flashes || flashes.length === 0) return;

    flashes.forEach((flash) => {
      if (flash.finished) return;

      const remainingRatio = Math.max(0, 1 - flash.elapsedMs / flash.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.6);

      ctx.save();
      ctx.globalAlpha = alpha;

      const ox = Math.round(flash.originX);
      const oy = Math.round(flash.originY - 14);
      const cone = flash.coneAngle; // 120°
      const range = flash.range; // 260px
      const squish = 0.58;

      // 1. Relámpagos dentados en cian eléctrico (#38BDF8) y blanco puro (#FFFFFF)
      const rays = 8;
      for (let r = 0; r < rays; r++) {
        const rayAng = flash.aimAngle - cone / 2 + (r / (rays - 1)) * cone;
        ctx.fillStyle = r % 2 === 0 ? '#38bdf8' : '#ffffff';

        let curX = ox;
        let curY = oy;
        const segs = 5;

        for (let s = 0; s < segs; s++) {
          const segDist = (range / segs) * (s + 1);
          const jitter = (s % 2 === 0 ? 0.18 : -0.18);
          const nextX = Math.round(ox + Math.cos(rayAng + jitter) * segDist);
          const nextY = Math.round(oy + Math.sin(rayAng + jitter) * segDist * squish);

          // Trazos escalonados en ángulo recto / pixel outline
          ctx.fillRect(curX - 1, curY - 1, nextX - curX + 2, 3);
          ctx.fillRect(nextX - 1, curY - 1, 3, nextY - curY + 2);

          // Chispa cuadrada en el nudo
          ctx.fillRect(nextX - 2, nextY - 2, 5, 4);

          curX = nextX;
          curY = nextY;
        }
      }

      // 2. Fragmentos y esquirlas de hielo en blanco (#FFFFFF) y azul glaciar (#E0F2FE)
      const shardCount = 12;
      for (let i = 0; i < shardCount; i++) {
        const sAng = flash.aimAngle - cone / 2 + ((i + 0.5) / shardCount) * cone;
        const sDist = range * (0.35 + 0.55 * ((i % 4) / 3));
        const sx = Math.round(ox + Math.cos(sAng) * sDist);
        const sy = Math.round(oy + Math.sin(sAng) * sDist * squish - 8);

        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#e0f2fe';
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
        ctx.fillRect(sx - 1, sy - 3, 2, 6);
      }

      ctx.restore();
    });
  }

  // =========================================================================
  // MEGALITO VOLCÁNICO RODANTE (TIERRA + TIERRA + FUEGO: BASALTO Y LAVA RODANTE)
  // =========================================================================
  private static drawRollingMagmaBoulder(
    ctx: CanvasRenderingContext2D,
    boulder: RollingMagmaBoulderEntity
  ) {
    const bx = Math.round(boulder.currentX);
    const by = Math.round(boulder.currentY);

    ctx.save();

    if (!boulder.exploded) {
      // 1. Sombra elíptica en el suelo (#0F172A)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.fillRect(bx - 22, by + 12, 44, 14);

      // 2. Esfera poligonal de roca en bloques de basalto gris (#3F3F46 / #27272A)
      ctx.translate(bx, by);
      ctx.rotate(boulder.rollAngle);

      const r = boulder.radius; // 28px
      const halfR = Math.round(r);

      // Contorno exterior pixel art (#18181B)
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-halfR, -halfR + 4, halfR * 2, (halfR - 4) * 2);
      ctx.fillRect(-halfR + 4, -halfR, (halfR - 4) * 2, halfR * 2);
      ctx.fillRect(-halfR + 2, -halfR + 2, (halfR - 2) * 2, (halfR - 2) * 2);

      // Cuerpo de basalto (#3f3f46)
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(-halfR + 2, -halfR + 6, (halfR - 2) * 2, (halfR - 6) * 2);
      ctx.fillRect(-halfR + 6, -halfR + 2, (halfR - 6) * 2, (halfR - 2) * 2);

      // Facetas sombreadas (#27272a)
      ctx.fillStyle = '#27272a';
      ctx.fillRect(-halfR + 2, 0, halfR, halfR - 2);
      ctx.fillRect(0, halfR - 8, halfR - 4, 6);

      // Facetas iluminadas (#52525b)
      ctx.fillStyle = '#52525b';
      ctx.fillRect(-halfR + 6, -halfR + 3, halfR, 5);
      ctx.fillRect(-halfR + 4, -halfR + 7, 6, 8);

      // 3. Grietas de lava encendida (#EA580C y #FDE047)
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-12, -4, 24, 6);
      ctx.fillRect(-4, -14, 8, 28);
      ctx.fillRect(-14, 6, 12, 5);
      ctx.fillRect(4, -12, 10, 5);

      ctx.fillStyle = '#fde047';
      ctx.fillRect(-8, -2, 16, 3);
      ctx.fillRect(-2, -10, 4, 20);
      ctx.fillRect(-10, 8, 6, 2);
      ctx.fillRect(6, -10, 6, 2);

      // Núcleos blancos incandescentes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -1, 4, 2);
      ctx.fillRect(-1, -6, 2, 4);
    } else {
      // Supernova de basalto y fragmentos de lava al estallar (radio 65px)
      const prog = boulder.explosionProgress;
      const alpha = Math.max(0, 1 - prog);
      ctx.globalAlpha = alpha;

      const curRad = Math.round(boulder.explosionRadius * Math.sin(prog * Math.PI / 2));
      const squish = 0.58;

      ctx.translate(bx, by);

      // Anillo de fragmentos proyectados hacia afuera
      const shardCount = 16;
      for (let i = 0; i < shardCount; i++) {
        const ang = (i / shardCount) * Math.PI * 2;
        const dist = curRad * (0.8 + 0.3 * ((i % 3) / 2));
        const sx = Math.round(Math.cos(ang) * dist);
        const sy = Math.round(Math.sin(ang) * dist * squish);
        const size = (i % 2 === 0) ? 6 : 4;

        // Fragmento de roca volcánica
        ctx.fillStyle = '#18181b';
        ctx.fillRect(sx - 1, sy - 1, size + 2, size + 2);
        ctx.fillStyle = i % 2 === 0 ? '#ea580c' : '#3f3f46';
        ctx.fillRect(sx, sy, size, size);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(sx + 1, sy + 1, 2, 2);
      }

      // Destello central ígneo inicial
      if (prog < 0.35) {
        ctx.fillStyle = '#fde047';
        const cSize = Math.round(20 * (1 - prog / 0.35));
        ctx.fillRect(-Math.round(cSize / 2), -Math.round(cSize * squish / 2), cSize, Math.round(cSize * squish));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-Math.round(cSize / 4), -Math.round(cSize * squish / 4), Math.round(cSize / 2), Math.round(cSize * squish / 2));
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // FORTALEZA GLACIAL DE PICOS (TIERRA + TIERRA + HIELO: GLIFO RÚNICO EN SUELO)
  // =========================================================================
  private static drawGlacialBastionGround(
    ctx: CanvasRenderingContext2D,
    bastions: GlacialBastionEntity[]
  ) {
    if (!bastions || bastions.length === 0) return;

    bastions.forEach((bastion) => {
      if (bastion.finished) return;

      const remainingRatio = Math.max(0, 1 - bastion.elapsedMs / bastion.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.5);

      ctx.save();
      ctx.globalAlpha = alpha;

      const cx = Math.round(bastion.centerX);
      const cy = Math.round(bastion.centerY);
      const rad = bastion.radius; // 110px
      const squish = 0.58;

      // 1. Sombra tenue bajo el bastión
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(cx - rad + 10, cy - Math.round((rad - 10) * squish), (rad - 10) * 2, Math.round((rad - 10) * squish * 2));

      // 2. Glifo rúnico octogonal tenue en el piso
      const sides = 8;
      ctx.fillStyle = '#1e293b';
      for (let i = 0; i < sides; i++) {
        const a1 = (i / sides) * Math.PI * 2 + bastion.elapsedMs * 0.001;
        const a2 = ((i + 1) / sides) * Math.PI * 2 + bastion.elapsedMs * 0.001;
        const x1 = Math.round(cx + Math.cos(a1) * (rad * 0.85));
        const y1 = Math.round(cy + Math.sin(a1) * (rad * 0.85) * squish);
        const x2 = Math.round(cx + Math.cos(a2) * (rad * 0.85));
        const y2 = Math.round(cy + Math.sin(a2) * (rad * 0.85) * squish);

        // Segmento pixelado entre nodos octogonales
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1) + 2, 2);
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), 2, Math.abs(y2 - y1) + 2);

        // Nodo rúnico en azul glaciar (#7DD3FC)
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(x1 - 2, y1 - 2, 5, 4);
      }

      // Runa central bajo los pies
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(cx - 6, cy - 2, 12, 4);
      ctx.fillRect(cx - 2, cy - 6, 4, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, cy - 2, 4, 4);

      ctx.restore();
    });
  }

  // =========================================================================
  // FORTALEZA GLACIAL DE PICOS (TIERRA + TIERRA + HIELO: PÚAS EN 360° EN DEPTH SORTING)
  // =========================================================================
  private static drawGlacialBastionSpikes(
    ctx: CanvasRenderingContext2D,
    bastion: GlacialBastionEntity
  ) {
    if (bastion.spikeProgress <= 0.05) return;

    const cx = Math.round(bastion.centerX);
    const cy = Math.round(bastion.centerY);
    const rad = bastion.radius; // 110px
    const squish = 0.58;
    const maxSpikeH = 36;
    const curH = Math.round(maxSpikeH * bastion.spikeProgress);

    const remainingRatio = Math.max(0, 1 - bastion.elapsedMs / bastion.durationMs);
    const alpha = Math.min(1, remainingRatio * 1.5);

    ctx.save();
    ctx.globalAlpha = alpha;

    // 16 púas triangulares escalonadas en 360°
    const spikeCount = 16;
    for (let i = 0; i < spikeCount; i++) {
      const ang = (i / spikeCount) * Math.PI * 2;
      const px = Math.round(cx + Math.cos(ang) * rad);
      const py = Math.round(cy + Math.sin(ang) * rad * squish);

      // Dibujar púa triangular escalonada
      const steps = 6;
      const stepH = Math.max(2, Math.round(curH / steps));
      const baseW = 12;

      for (let s = 0; s < steps; s++) {
        const sy = py - (s + 1) * stepH;
        const prog = s / steps;
        const curW = Math.max(2, Math.round(baseW * (1 - prog * 0.8)));

        // Contorno (#0F172A)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - Math.round(curW / 2) - 1, sy, curW + 2, stepH);

        // Base de piedra oscura (#1E293B)
        if (prog < 0.4) {
          ctx.fillStyle = '#1e293b';
        } else {
          // Aristas superiores en azul ártico (#7DD3FC)
          ctx.fillStyle = '#7dd3fc';
        }
        ctx.fillRect(px - Math.round(curW / 2), sy, curW, stepH);

        // Punta filosa superior en blanco nieve (#FFFFFF)
        if (prog >= 0.7) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - 1, sy, 3, stepH);
        }
      }

      // Ápice blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, py - curH - 2, 3, 3);
    }

    ctx.restore();
  }

  // =========================================================================
  // FISURA SÍSMICA RESONANTE (TIERRA + TIERRA + RAYO: SUELO Y GRIETAS TECTÓNICAS)
  // =========================================================================
  private static drawResonantQuakeGround(
    ctx: CanvasRenderingContext2D,
    quakes: ResonantQuakeEntity[]
  ) {
    if (!quakes || quakes.length === 0) return;

    quakes.forEach((quake) => {
      if (quake.finished) return;

      const remainingRatio = Math.max(0, 1 - quake.elapsedMs / quake.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.5);

      ctx.save();
      ctx.globalAlpha = alpha;

      const ox = Math.round(quake.originX);
      const oy = Math.round(quake.originY);
      const cone = quake.coneAngle; // 90°
      const squish = 0.58;

      // Dibujar las 3 fisuras tectónicas concéntricas en el suelo
      quake.waves.forEach((wave) => {
        if (quake.elapsedMs < wave.delayMs) return;

        const wDist = wave.distance;
        const arcSteps = 12;

        for (let i = 0; i <= arcSteps; i++) {
          const a = quake.aimAngle - cone / 2 + (i / arcSteps) * cone;
          const fx = Math.round(ox + Math.cos(a) * wDist);
          const fy = Math.round(oy + Math.sin(a) * wDist * squish);

          // Hendidura de tierra profunda (#451A03)
          ctx.fillStyle = '#451a03';
          ctx.fillRect(fx - 4, fy - 2, 8, 4);

          // Borde de roca fracturada (#78350F)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(fx - 3, fy - 3, 6, 2);
          ctx.fillRect(fx - 3, fy + 1, 6, 2);

          // Chispas de relámpago amarillas (#FACC15) zigzagüeando entre grietas
          if (wave.discharged && Math.random() < 0.45) {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(fx - 2, fy - 1, 4, 3);
          }
        }
      });

      ctx.restore();
    });
  }

  // =========================================================================
  // FISURA SÍSMICA RESONANTE (TIERRA + TIERRA + RAYO: CRESTAS ELEVADAS Y RELÁMPAGOS)
  // =========================================================================
  private static drawResonantQuakeArches(
    ctx: CanvasRenderingContext2D,
    quakes: ResonantQuakeEntity[]
  ) {
    if (!quakes || quakes.length === 0) return;

    quakes.forEach((quake) => {
      if (quake.finished) return;

      const remainingRatio = Math.max(0, 1 - quake.elapsedMs / quake.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.5);

      ctx.save();
      ctx.globalAlpha = alpha;

      const ox = Math.round(quake.originX);
      const oy = Math.round(quake.originY);
      const cone = quake.coneAngle; // 90°
      const squish = 0.58;

      quake.waves.forEach((wave) => {
        if (!wave.discharged) return;

        const wDist = wave.distance;
        const arcSteps = 10;

        for (let i = 0; i < arcSteps; i++) {
          const a = quake.aimAngle - cone / 2 + (i / (arcSteps - 1)) * cone;
          const px = Math.round(ox + Math.cos(a) * wDist);
          const py = Math.round(oy + Math.sin(a) * wDist * squish);

          // Losa elevada en bloques de tierra (#78350F / #92400E)
          const slabH = 8;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px - 5, py - slabH - 1, 10, slabH + 2);

          ctx.fillStyle = '#78350f';
          ctx.fillRect(px - 4, py - slabH, 8, slabH);

          ctx.fillStyle = '#92400e';
          ctx.fillRect(px - 4, py - slabH, 8, 2);

          // Chispas de relámpago amarillas y blancas (#FACC15 / #FFFFFF)
          if (i % 2 === 0) {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(px - 2, py - slabH - 4, 4, 3);
            ctx.fillRect(px - 1, py - slabH - 6, 2, 2);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px, py - slabH - 3, 2, 2);
          }
        }
      });

      ctx.restore();
    });
  }

  // =========================================================================
  // JUICIO DEL DIOS DEL TRUENO (RAYO X4: SUELO Y HAZ VERTICAL COLOSAL)
  // =========================================================================
  private static drawThundergodJudgmentGround(
    ctx: CanvasRenderingContext2D,
    judgments: ThundergodJudgmentEntity[]
  ) {
    if (!judgments || judgments.length === 0) return;

    judgments.forEach((j) => {
      if (j.finished) return;

      const progress = j.elapsedMs / j.durationMs;
      const alpha = progress < 0.2 ? progress / 0.2 : Math.max(0, 1 - (progress - 0.2) / 0.8);
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = alpha;

      const tx = Math.round(j.targetX);
      const ty = Math.round(j.targetY);
      const squish = 0.58;
      const rad = j.impactRadius; // 120px

      // 1. Cráter elíptico calcinado en el suelo (#0F172A)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(tx - Math.round(rad * 0.7), ty - Math.round(rad * 0.7 * squish), Math.round(rad * 1.4), Math.round(rad * 1.4 * squish));

      // 2. Anillo de ionización y fracturas electromagnéticas (#3B82F6)
      const sides = 12;
      for (let i = 0; i < sides; i++) {
        const a1 = (i / sides) * Math.PI * 2;
        const a2 = ((i + 1) / sides) * Math.PI * 2;
        const x1 = Math.round(tx + Math.cos(a1) * (rad * 0.85));
        const y1 = Math.round(ty + Math.sin(a1) * (rad * 0.85) * squish);
        const x2 = Math.round(tx + Math.cos(a2) * (rad * 0.85));
        const y2 = Math.round(ty + Math.sin(a2) * (rad * 0.85) * squish);

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1) + 2, 2);
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), 2, Math.abs(y2 - y1) + 2);

        // Nodos de descarga amarillos (#FACC15)
        if (i % 2 === 0) {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(x1 - 2, y1 - 2, 5, 4);
        }
      }

      // 3. Arcos de relámpago radiales quebrados en el suelo hacia el exterior
      const arcs = 8;
      for (let i = 0; i < arcs; i++) {
        const ang = (i / arcs) * Math.PI * 2 + (j.elapsedMs * 0.003);
        const midDist = rad * 0.5;
        const endDist = rad * (0.8 + 0.2 * Math.sin(i * 3 + j.elapsedMs * 0.02));

        const mx = Math.round(tx + Math.cos(ang + 0.15) * midDist);
        const my = Math.round(ty + Math.sin(ang + 0.15) * midDist * squish);
        const ex = Math.round(tx + Math.cos(ang) * endDist);
        const ey = Math.round(ty + Math.sin(ang) * endDist * squish);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.min(tx, mx), Math.min(ty, my), Math.abs(mx - tx) + 2, 2);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(Math.min(mx, ex), Math.min(my, ey), Math.abs(ex - mx) + 2, 2);
      }

      ctx.restore();
    });
  }

  private static drawThundergodJudgmentBeam(
    ctx: CanvasRenderingContext2D,
    judgments: ThundergodJudgmentEntity[]
  ) {
    if (!judgments || judgments.length === 0) return;

    judgments.forEach((j) => {
      if (j.finished) return;

      const progress = j.elapsedMs / j.durationMs;
      const alpha = progress < 0.15 ? progress / 0.15 : Math.max(0, 1 - (progress - 0.15) / 0.85);
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = alpha;

      const tx = Math.round(j.targetX);
      const ty = Math.round(j.targetY);
      const beamW = j.strikeWidth; // 60px
      const halfW = Math.round(beamW / 2);
      const topY = ty - 650;
      const totalH = ty - topY;

      // Parpadeo de alta frecuencia de relámpago
      const flicker = (Math.floor(j.elapsedMs / 40) % 2 === 0) ? 1.0 : 0.88;
      ctx.globalAlpha = alpha * flicker;

      // 1. Capa externa de plasma violeta (#7C3AED / #A855F7) de 64px
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(tx - halfW - 4, topY, beamW + 8, totalH);

      // 2. Capa intermedia de arco voltaico (#A855F7)
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(tx - halfW, topY, beamW, totalH);

      // 3. Núcleo violeta brillante (#C084FC) de 36px
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(tx - 18, topY, 36, totalH);

      // 4. Núcleo incandescente blanco puro (#FFFFFF) de 16px
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tx - 8, topY, 16, totalH);

      // 5. Filamentos y arcos en líneas quebradas de 2px en los laterales del haz
      const stepCount = 14;
      const stepH = Math.round(totalH / stepCount);
      for (let s = 0; s < stepCount; s++) {
        const sy = topY + s * stepH;
        const seed = (s * 37 + Math.floor(j.elapsedMs * 0.05)) % 7;
        const offsetLeft = 4 + (seed % 4) * 6;
        const offsetRight = 4 + ((seed + 2) % 4) * 6;

        // Filamento izquierdo
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(tx - halfW - offsetLeft, sy, offsetLeft, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tx - halfW - offsetLeft, sy - 2, 3, 5);

        // Filamento derecho
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(tx + halfW, sy + 4, offsetRight, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tx + halfW + offsetRight - 2, sy + 2, 3, 5);

        // Chispas cuadradas flotantes de plasma
        if (s % 3 === 0) {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(tx - halfW - offsetLeft - 6, sy - 4, 4, 4);
          ctx.fillRect(tx + halfW + offsetRight + 4, sy + 8, 4, 4);
        }
      }

      ctx.restore();
    });
  }

  // =========================================================================
  // SUPERNOVA PRIMORDIAL (FUEGO X4: SUELO DE LAVA Y SOL COLOSAL / DETONACIÓN)
  // =========================================================================
  private static drawPrimordialSupernovaLava(
    ctx: CanvasRenderingContext2D,
    supernovas: PrimordialSupernovaEntity[]
  ) {
    if (!supernovas || supernovas.length === 0) return;

    supernovas.forEach((sn) => {
      if (sn.finished || !sn.exploded || !sn.lavaPatches || sn.lavaPatches.length === 0) return;

      const lavaElapsed = sn.elapsedMs - sn.explosionDurationMs;
      if (lavaElapsed < 0 || lavaElapsed >= sn.lavaDurationMs) return;

      const remainingRatio = Math.max(0, 1 - lavaElapsed / sn.lavaDurationMs);
      const alpha = Math.min(1, remainingRatio * 1.4);

      ctx.save();
      ctx.globalAlpha = alpha;

      const squish = 0.58;

      sn.lavaPatches.forEach((patch, idx) => {
        const px = Math.round(patch.x);
        const py = Math.round(patch.y);
        const rad = Math.round(patch.radius);

        // 1. Borde de roca volcánica chamuscada (#7F1D1D)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(px - rad, py - Math.round(rad * squish), rad * 2, Math.round(rad * squish * 2));

        // 2. Masa de magma incandescente (#EA580C)
        const innerRad = Math.max(2, Math.round(rad * 0.75));
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(px - innerRad, py - Math.round(innerRad * squish), innerRad * 2, Math.round(innerRad * squish * 2));

        // 3. Núcleo fundido y burbujas ardientes (#FDE047 / #FFFFFF)
        const pulse = Math.sin(sn.elapsedMs * 0.008 + idx * 1.5);
        if (pulse > 0) {
          ctx.fillStyle = '#fde047';
          ctx.fillRect(px - 3, py - 2, 7, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - 1, py - 1, 3, 2);
        }
      });

      ctx.restore();
    });
  }

  private static drawPrimordialSupernovaOrb(
    ctx: CanvasRenderingContext2D,
    sn: PrimordialSupernovaEntity
  ) {
    if (sn.finished) return;

    const ox = Math.round(sn.currentX);
    const oy = Math.round(sn.currentY);

    if (!sn.exploded) {
      // 1. Proyectil Solar Colosal en Vuelo (Radio 36px)
      const rad = sn.orbRadius; // 36px

      ctx.save();

      // Halo exterior en rojo volcánico oscuro (#7F1D1D)
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(ox - rad, oy - rad, rad * 2, rad * 2);

      // Corona de fuego naranja intenso (#EA580C)
      const rOrange = Math.round(rad * 0.8);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(ox - rOrange, oy - rOrange, rOrange * 2, rOrange * 2);

      // Manto solar amarillo brillante (#FDE047)
      const rYellow = Math.round(rad * 0.55);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(ox - rYellow, oy - rYellow, rYellow * 2, rYellow * 2);

      // Núcleo blanco cegador (#FFFFFF)
      const rWhite = Math.round(rad * 0.3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox - rWhite, oy - rWhite, rWhite * 2, rWhite * 2);

      // 8 llamaradas solares pixeladas que brotan en cruz y diagonales
      const flareLen = 10;
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(ox - rad - flareLen, oy - 2, flareLen, 4);
      ctx.fillRect(ox + rad, oy - 2, flareLen, 4);
      ctx.fillRect(ox - 2, oy - rad - flareLen, 4, flareLen);
      ctx.fillRect(ox - 2, oy + rad, 4, flareLen);

      // Diagonales
      ctx.fillStyle = '#fde047';
      ctx.fillRect(ox - rad - 4, oy - rad - 4, 6, 6);
      ctx.fillRect(ox + rad - 2, oy - rad - 4, 6, 6);
      ctx.fillRect(ox - rad - 4, oy + rad - 2, 6, 6);
      ctx.fillRect(ox + rad - 2, oy + rad - 2, 6, 6);

      ctx.restore();
    } else {
      // 2. Detonación de Supernova Primordial (Radio hasta 140px)
      const prog = sn.explosionProgress; // 0..1
      const alpha = Math.max(0, 1 - prog);
      const curR = Math.round(sn.explosionRadius * prog);

      if (curR <= 2) return;

      ctx.save();
      ctx.globalAlpha = alpha;

      const squish = 0.58;

      // Anillo de choque exterior en rojo oscuro (#7F1D1D)
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(ox - curR, oy - Math.round(curR * squish), curR * 2, Math.round(curR * squish * 2));

      // Manto expansivo de plasma naranja (#EA580C)
      const midR = Math.round(curR * 0.75);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(ox - midR, oy - Math.round(midR * squish), midR * 2, Math.round(midR * squish * 2));

      // Núcleo de supernova amarillo solar (#FDE047)
      const inR = Math.round(curR * 0.45);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(ox - inR, oy - Math.round(inR * squish), inR * 2, Math.round(inR * squish * 2));

      // Centro blanco puro (#FFFFFF)
      const coreR = Math.round(curR * 0.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox - coreR, oy - Math.round(coreR * squish), coreR * 2, Math.round(coreR * squish * 2));

      // 12 rayos de eyección de masa coronal pixelados
      const rays = 12;
      for (let r = 0; r < rays; r++) {
        const ang = (r / rays) * Math.PI * 2;
        const rx = Math.round(ox + Math.cos(ang) * (curR * 1.1));
        const ry = Math.round(oy + Math.sin(ang) * (curR * 1.1) * squish);

        ctx.fillStyle = r % 2 === 0 ? '#fde047' : '#ea580c';
        ctx.fillRect(rx - 3, ry - 3, 6, 6);
      }

      ctx.restore();
    }
  }

  // =========================================================================
  // ERA GLACIAL (HIELO X4: ESTALAGMITAS EN SUELO Y VIÑETA DE ESCARCHA PANTALLA)
  // =========================================================================
  private static drawAbsoluteZeroAgeGround(
    ctx: CanvasRenderingContext2D,
    ages: AbsoluteZeroAgeEntity[]
  ) {
    if (!ages || ages.length === 0) return;

    ages.forEach((age) => {
      if (age.finished) return;

      const alpha = Math.max(0, 1 - age.elapsedMs / age.durationMs);
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.4);

      const ox = Math.round(age.originX);
      const oy = Math.round(age.originY);
      const squish = 0.58;

      // 1. Anillos concéntricos expansivos de escarcha en el suelo (#38BDF8 / #BAE6FD)
      const maxGroundR = 360;
      const groundProg = Math.min(1, age.elapsedMs / 400);
      const curGroundR = Math.round(maxGroundR * groundProg);

      // Círculo base de suelo congelado
      ctx.fillStyle = 'rgba(186, 230, 253, 0.18)';
      ctx.fillRect(ox - curGroundR, oy - Math.round(curGroundR * squish), curGroundR * 2, Math.round(curGroundR * squish * 2));

      // Anillo octogonal de cristales
      const nodes = 8;
      for (let i = 0; i < nodes; i++) {
        const a = (i / nodes) * Math.PI * 2;
        const nx = Math.round(ox + Math.cos(a) * (curGroundR * 0.9));
        const ny = Math.round(oy + Math.sin(a) * (curGroundR * 0.9) * squish);

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(nx - 4, ny - 3, 8, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(nx - 2, ny - 1, 4, 3);
      }

      // 2. Estalagmitas y agujas de hielo que brotan del suelo
      age.spikes.forEach((spike) => {
        const sx = Math.round(spike.x);
        const sy = Math.round(spike.y);
        const curH = Math.round(spike.height);
        if (curH <= 2) return;

        const baseW = 10;
        const steps = 5;
        const stepH = Math.max(2, Math.round(curH / steps));

        // Sombra en el suelo
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(sx - 5, sy - 2, 10, 4);

        for (let s = 0; s < steps; s++) {
          const stepY = sy - (s + 1) * stepH;
          const prog = s / steps;
          const curW = Math.max(2, Math.round(baseW * (1 - prog * 0.8)));

          // Base azul glaciar profundo (#0284C7)
          if (prog < 0.4) {
            ctx.fillStyle = '#0284c7';
          } else {
            // Arista azul celeste (#38BDF8)
            ctx.fillStyle = '#38bdf8';
          }
          ctx.fillRect(sx - Math.round(curW / 2), stepY, curW, stepH);

          // Faceta iluminada (#BAE6FD)
          if (prog >= 0.5) {
            ctx.fillStyle = '#bae6fd';
            ctx.fillRect(sx - 1, stepY, 2, stepH);
          }
        }

        // Punta filosa en blanco puro (#FFFFFF)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1, sy - curH - 2, 3, 3);
      });

      ctx.restore();
    });
  }

  private static drawAbsoluteZeroAgeOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ages: AbsoluteZeroAgeEntity[]
  ) {
    if (!ages || ages.length === 0) return;

    let maxAlpha = 0;
    ages.forEach((age) => {
      if (!age.finished && age.frostOverlayAlpha > maxAlpha) {
        maxAlpha = age.frostOverlayAlpha;
      }
    });

    if (maxAlpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = Math.min(0.85, maxAlpha);

    // 1. Bordes de pantalla congelados (friso de hielo de 6px)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, width, 6);
    ctx.fillRect(0, height - 6, width, 6);
    ctx.fillRect(0, 0, 6, height);
    ctx.fillRect(width - 6, 0, 6, height);

    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(0, 0, width, 3);
    ctx.fillRect(0, height - 3, width, 3);
    ctx.fillRect(0, 0, 3, height);
    ctx.fillRect(width - 3, 0, 3, height);

    // 2. Cristales geométricos 16-bit en las cuatro esquinas
    const cornerSize = 75;
    const corners = [
      { x: 0, y: 0, dx: 1, dy: 1 },
      { x: width, y: 0, dx: -1, dy: 1 },
      { x: 0, y: height, dx: 1, dy: -1 },
      { x: width, y: height, dx: -1, dy: -1 },
    ];

    corners.forEach((c) => {
      // Escalones de hielo
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const segW = Math.round((cornerSize * (steps - i)) / steps);
        const segH = Math.round((cornerSize * (steps - i)) / steps);

        ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#bae6fd';
        const startX = c.dx > 0 ? c.x : c.x - segW;
        const startY = c.dy > 0 ? c.y : c.y - segH;
        ctx.fillRect(startX, startY, segW, 4);
        ctx.fillRect(startX, startY, 4, segH);
      }

      // Cristales dendríticos en blanco puro (#FFFFFF)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(c.x + c.dx * 16, c.y + c.dy * 16, 6, 6);
      ctx.fillRect(c.x + c.dx * 32, c.y + c.dy * 12, 5, 5);
      ctx.fillRect(c.x + c.dx * 12, c.y + c.dy * 32, 5, 5);
    });

    ctx.restore();
  }

  // =========================================================================
  // CATACLISMO TECTÓNICO (TIERRA X4: SUELO CON FISURAS Y 4 MONOLITOS MASIVOS)
  // =========================================================================
  private static drawTectonicCataclysmGround(
    ctx: CanvasRenderingContext2D,
    cataclysms: TectonicCataclysmEntity[]
  ) {
    if (!cataclysms || cataclysms.length === 0) return;

    cataclysms.forEach((tc) => {
      if (tc.finished) return;

      const alpha = Math.max(0, 1 - tc.elapsedMs / tc.durationMs);
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.5);

      const cx = Math.round(tc.centerX);
      const cy = Math.round(tc.centerY);
      const squish = 0.58;

      // 4 fisuras tectónicas masivas transversales en ángulos de 35°, 125°, 215°, 305°
      const fissureAngles = [0.6, 2.18, 3.75, 5.32];
      fissureAngles.forEach((ang) => {
        const length = 180;
        const segments = 9;

        for (let s = 0; s < segments; s++) {
          const d1 = (s / segments) * length;
          const d2 = ((s + 1) / segments) * length;
          const fx1 = Math.round(cx + Math.cos(ang) * d1);
          const fy1 = Math.round(cy + Math.sin(ang) * d1 * squish);
          const fx2 = Math.round(cx + Math.cos(ang) * d2);
          const fy2 = Math.round(cy + Math.sin(ang) * d2 * squish);

          // Hendidura abisal profunda (#27272A)
          ctx.fillStyle = '#27272a';
          ctx.fillRect(Math.min(fx1, fx2) - 4, Math.min(fy1, fy2) - 2, Math.abs(fx2 - fx1) + 8, Math.abs(fy2 - fy1) + 4);

          // Labio de roca fracturada (#78350F)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(Math.min(fx1, fx2) - 3, Math.min(fy1, fy2) - 3, Math.abs(fx2 - fx1) + 6, 2);
          ctx.fillRect(Math.min(fx1, fx2) - 3, Math.min(fy1, fy2) + 2, Math.abs(fx2 - fx1) + 6, 2);

          // Escombros rocosos de pizarra (#52525B)
          if (s % 2 === 0) {
            ctx.fillStyle = '#52525b';
            ctx.fillRect(fx1 - 5, fy1 - 5, 4, 4);
            ctx.fillRect(fx2 + 3, fy2 + 2, 5, 4);
          }
        }
      });

      ctx.restore();
    });
  }

  private static drawTectonicCataclysmMonoliths(
    ctx: CanvasRenderingContext2D,
    tc: TectonicCataclysmEntity
  ) {
    if (tc.finished) return;

    const alpha = Math.max(0, 1 - tc.elapsedMs / tc.durationMs);
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.5);

    tc.monoliths.forEach((m) => {
      const mx = Math.round(m.x);
      const my = Math.round(m.y);
      const w = m.width; // 32px
      const halfW = Math.round(w / 2);
      const curH = Math.round(m.height);

      if (curH <= 2) return;

      if (!m.collapsed) {
        // Monolito en pie (32px de ancho, hasta 80px de alto)
        // 1. Sombra elíptica en el suelo
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.fillRect(mx - halfW - 4, my - 4, w + 8, 8);

        // 2. Cara lateral izquierda sombreada (#27272A)
        ctx.fillStyle = '#27272a';
        ctx.fillRect(mx - halfW, my - curH, halfW, curH);

        // 3. Cara lateral derecha iluminada (#52525B)
        ctx.fillStyle = '#52525b';
        ctx.fillRect(mx, my - curH, halfW, curH);

        // 4. Estrías de roca arcillosa (#78350F)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(mx - 4, my - Math.round(curH * 0.7), 8, 4);
        ctx.fillRect(mx - 6, my - Math.round(curH * 0.4), 12, 4);

        // 5. Runa de tierra encendida en el corazón del monolito (#D97706)
        if (curH >= 30) {
          ctx.fillStyle = '#d97706';
          ctx.fillRect(mx - 2, my - Math.round(curH * 0.55), 4, 14);
          ctx.fillRect(mx - 5, my - Math.round(curH * 0.55) + 4, 10, 4);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(mx - 1, my - Math.round(curH * 0.55) + 5, 2, 2);
        }

        // 6. Coronamiento superior biselado (#71717A / #A1A1AA)
        ctx.fillStyle = '#71717a';
        ctx.fillRect(mx - halfW + 2, my - curH - 3, w - 4, 3);
        ctx.fillStyle = '#a1a1aa';
        ctx.fillRect(mx - 2, my - curH - 4, 4, 2);
      } else {
        // Monolito colapsado: fragmentos de losas rotas y polvo tectónico
        ctx.fillStyle = '#27272a';
        ctx.fillRect(mx - halfW - 6, my - 8, halfW + 4, 12);
        ctx.fillStyle = '#52525b';
        ctx.fillRect(mx - 2, my - 6, halfW + 6, 10);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(mx - halfW + 2, my - 12, 10, 6);
        ctx.fillRect(mx + 4, my - 10, 8, 5);

        // Nube de polvo de escombros
        ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
        ctx.fillRect(mx - halfW - 8, my - 16, w + 16, 14);
      }
    });

    ctx.restore();
  }

  // =========================================================================
  // METEORO DE PLASMA CINÉTICO (FUEGO x3 + RAYO: TELEGRAFIADO Y ANILLO EXPANSIVO)
  // =========================================================================
  private static drawKineticPlasmaMeteorGround(
    ctx: CanvasRenderingContext2D,
    meteors: KineticPlasmaMeteorEntity[]
  ) {
    if (!meteors || meteors.length === 0) return;

    meteors.forEach((m) => {
      if (m.finished) return;

      const tx = Math.round(m.targetX);
      const ty = Math.round(m.targetY);
      const squish = 0.58;

      if (!m.exploded) {
        // 1. Retícula de telegrafiado supersónico (150ms)
        const prog = Math.min(1, m.elapsedMs / m.telegraphDurationMs);
        const radius = Math.round(m.impactRadius * (0.8 + 0.2 * Math.sin(prog * Math.PI * 4)));

        ctx.save();
        ctx.globalAlpha = 0.75 + 0.25 * Math.sin(prog * Math.PI * 6);

        // Anillo exterior dentado en amarillo eléctrico (#FACC15)
        const nodes = 12;
        for (let i = 0; i < nodes; i++) {
          const ang = (i / nodes) * Math.PI * 2;
          const px = Math.round(tx + Math.cos(ang) * radius);
          const py = Math.round(ty + Math.sin(ang) * radius * squish);
          ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#a855f7';
          ctx.fillRect(px - 3, py - 2, 6, 4);
        }

        // Cruz de retícula pixelada en el centro
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tx - 8, ty - 1, 16, 2);
        ctx.fillRect(tx - 1, ty - 8 * squish, 2, Math.round(16 * squish));

        ctx.restore();
      } else {
        // 2. Estallido en anillo expansivo de píxeles combinados
        const explosionDuration = m.durationMs - m.telegraphDurationMs;
        const elapsedSinceExp = m.elapsedMs - m.telegraphDurationMs;
        if (elapsedSinceExp < 0 || elapsedSinceExp > explosionDuration) return;

        const prog = Math.min(1, elapsedSinceExp / explosionDuration);
        const alpha = Math.max(0, 1 - prog);
        const curR = Math.round(m.impactRadius * prog);

        if (curR <= 2) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Anillo de choque de píxeles escalados
        const segments = 20;
        for (let i = 0; i < segments; i++) {
          const ang = (i / segments) * Math.PI * 2;
          const px = Math.round(tx + Math.cos(ang) * curR);
          const py = Math.round(ty + Math.sin(ang) * curR * squish);

          // Píxeles combinados: blanco, amarillo, violeta y naranja
          const colorMod = i % 4;
          ctx.fillStyle = colorMod === 0 ? '#ffffff' : (colorMod === 1 ? '#facc15' : (colorMod === 2 ? '#a855f7' : '#ea580c'));
          ctx.fillRect(px - 4, py - 3, 8, 6);

          // Chispas periféricas adicionales
          if (prog < 0.65 && i % 2 === 0) {
            const sparkDist = curR * 1.15;
            const sx = Math.round(tx + Math.cos(ang + 0.1) * sparkDist);
            const sy = Math.round(ty + Math.sin(ang + 0.1) * sparkDist * squish);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(sx - 2, sy - 2, 4, 4);
          }
        }

        // Cráter central quemado
        if (prog < 0.8) {
          ctx.fillStyle = 'rgba(24, 24, 27, 0.45)';
          const craterR = Math.round(m.impactRadius * 0.45);
          ctx.fillRect(tx - craterR, ty - Math.round(craterR * squish), craterR * 2, Math.round(craterR * squish * 2));
        }

        ctx.restore();
      }
    });
  }

  private static drawKineticPlasmaMeteor(
    ctx: CanvasRenderingContext2D,
    m: KineticPlasmaMeteorEntity
  ) {
    if (m.finished || m.exploded) return;

    const mx = Math.round(m.currentX);
    const my = Math.round(m.currentY);
    const dx = m.targetX - m.startX;
    const dy = m.targetY - m.startY;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    ctx.save();

    // 1. Estela escalonada en violeta eléctrico (#A855F7)
    const trailSteps = 5;
    for (let t = 1; t <= trailSteps; t++) {
      const trailOffset = t * 14;
      const tx = Math.round(mx - dirX * trailOffset);
      const ty = Math.round(my - dirY * trailOffset);
      const tSize = Math.max(3, 14 - t * 2);
      const halfT = Math.round(tSize / 2);

      ctx.fillStyle = t % 2 === 0 ? '#a855f7' : '#c084fc';
      ctx.fillRect(tx - halfT, ty - halfT, tSize, tSize);

      // Píxeles de chispas a los costados de la estela
      const perpX = -dirY * (4 + t * 2);
      const perpY = dirX * (4 + t * 2);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(Math.round(tx + perpX - 1), Math.round(ty + perpY - 1), 3, 3);
      ctx.fillRect(Math.round(tx - perpX - 1), Math.round(ty - perpY - 1), 3, 3);
    }

    // 2. Bordes amarillos (#FACC15)
    const outerSize = 22;
    const halfOuter = 11;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(mx - halfOuter, my - halfOuter, outerSize, outerSize);

    // Detalle de plasma naranja en las aristas (#EA580C)
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(mx - halfOuter + 2, my - halfOuter + 2, outerSize - 4, outerSize - 4);

    // 3. Núcleo cuadrado blanco (#FFFFFF)
    const coreSize = 10;
    const halfCore = 5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx - halfCore, my - halfCore, coreSize, coreSize);

    // Arcos voltaicos menores cruzando el bólido
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(mx - halfOuter - 4, my - 2, 4, 4);
    ctx.fillRect(mx + halfOuter, my - 2, 4, 4);
    ctx.fillRect(mx - 2, my - halfOuter - 4, 4, 4);
    ctx.fillRect(mx - 2, my + halfOuter, 4, 4);

    ctx.restore();
  }

  // =========================================================================
  // COMETA DE FRÍO ABRASADOR (FUEGO x3 + HIELO: ESFERA PARTIDA Y VAPOR TÉRMICO)
  // =========================================================================
  private static drawFrostburnComet(
    ctx: CanvasRenderingContext2D,
    c: FrostburnCometEntity
  ) {
    if (c.finished) return;

    const squish = 0.58;

    if (!c.exploded) {
      const cx = Math.round(c.currentX);
      const cy = Math.round(c.currentY);
      const cz = Math.round(c.currentZ);
      const drawY = cy - cz;

      ctx.save();

      // 1. Sombra en el suelo (se achica con la elevación Z)
      const shadowR = Math.max(6, Math.round(20 - cz * 0.1));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(cx - shadowR, cy - Math.round(shadowR * squish), shadowR * 2, Math.round(shadowR * squish * 2));

      // 2. Estela doble en vuelo: llamas a la izquierda, hielo a la derecha
      const trailOffset = 12;
      // Fuego estela (#EA580C / #F97316)
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(cx - 10, drawY + trailOffset, 6, 6);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(cx - 8, drawY + trailOffset + 6, 4, 4);

      // Hielo estela (#38BDF8 / #BAE6FD)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx + 4, drawY + trailOffset, 6, 6);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(cx + 4, drawY + trailOffset + 6, 4, 4);

      // 3. Esfera pixelada de 16px partida en dos mitades
      const halfSize = 8;

      // Mitad Izquierda: Rojo Fuego (#EA580C)
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(cx - halfSize, drawY - halfSize + 2, halfSize, halfSize * 2 - 4);
      ctx.fillRect(cx - halfSize + 2, drawY - halfSize, halfSize - 2, 2);
      ctx.fillRect(cx - halfSize + 2, drawY + halfSize - 2, halfSize - 2, 2);

      // Sombra ígnea interior (#C2410C)
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(cx - halfSize + 1, drawY - 2, 3, 4);

      // Mitad Derecha: Azul Glaciar (#38BDF8)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx, drawY - halfSize + 2, halfSize, halfSize * 2 - 4);
      ctx.fillRect(cx, drawY - halfSize, halfSize - 2, 2);
      ctx.fillRect(cx, drawY + halfSize - 2, halfSize - 2, 2);

      // Sombra glaciar interior (#0284C7)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(cx + halfSize - 4, drawY - 2, 3, 4);

      // 4. Costura central blanca (#FFFFFF) con choque térmico
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 1, drawY - halfSize, 2, halfSize * 2);

      // Coronamiento de esquirlas térmicas
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 3, drawY - halfSize - 2, 2, 2);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(cx + 1, drawY - halfSize - 2, 2, 2);

      ctx.restore();
    } else {
      // Detonación: Nube densa de vapor blanco y esquirlas cuadradas
      const detonationDuration = 180;
      const elapsedSinceExp = c.elapsedMs - (c.durationMs - detonationDuration);
      const prog = Math.min(1, Math.max(0, elapsedSinceExp / detonationDuration));
      const alpha = Math.max(0, 1 - prog);
      const curR = Math.round(c.impactRadius * (0.3 + 0.7 * prog));

      ctx.save();
      ctx.globalAlpha = alpha;

      const tx = Math.round(c.targetX);
      const ty = Math.round(c.targetY);

      // Bloques de vapor denso (#FFFFFF / #BAE6FD)
      const cloudClusters = 12;
      for (let i = 0; i < cloudClusters; i++) {
        const ang = (i / cloudClusters) * Math.PI * 2;
        const dist = curR * 0.75;
        const bx = Math.round(tx + Math.cos(ang) * dist);
        const by = Math.round(ty + Math.sin(ang) * dist * squish);
        const bSize = Math.max(6, Math.round(14 * (1 - prog * 0.4)));

        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#bae6fd';
        ctx.fillRect(bx - Math.round(bSize / 2), by - Math.round((bSize * squish) / 2), bSize, Math.round(bSize * squish));
      }

      // Esquirlas cuadradas lanzadas radialmente (rojo fuego y azul glaciar)
      const shardCount = 14;
      for (let s = 0; s < shardCount; s++) {
        const sAng = (s / shardCount) * Math.PI * 2 + 0.2;
        const sDist = curR * (0.9 + (s % 3) * 0.15);
        const sx = Math.round(tx + Math.cos(sAng) * sDist);
        const sy = Math.round(ty + Math.sin(sAng) * sDist * squish);

        ctx.fillStyle = s % 2 === 0 ? '#ea580c' : '#38bdf8';
        ctx.fillRect(sx - 3, sy - 2, 6, 4);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
      }

      ctx.restore();
    }
  }

  // =========================================================================
  // CALDERA VOLCÁNICA PROFUNDA (FUEGO x3 + TIERRA: ELIPSE, BASALTO Y LAVA VIVA)
  // =========================================================================
  private static drawCalderaCataclysmGround(
    ctx: CanvasRenderingContext2D,
    calderas: CalderaCataclysmEntity[]
  ) {
    if (!calderas || calderas.length === 0) return;

    calderas.forEach((cc) => {
      if (cc.finished) return;

      const remainingRatio = Math.max(0, (cc.durationMs - cc.elapsedMs) / cc.durationMs);
      const alpha = Math.min(1, remainingRatio * 1.5);
      if (alpha <= 0.01) return;

      const cx = Math.round(cc.centerX);
      const cy = Math.round(cc.centerY);
      const rad = cc.radius; // 100px
      const squish = 0.58;

      ctx.save();
      ctx.globalAlpha = alpha;

      // 1. Fondo del cráter magmático hundido
      ctx.fillStyle = '#18181b';
      ctx.fillRect(cx - rad, cy - Math.round(rad * squish), rad * 2, Math.round(rad * squish * 2));

      // 2. Lago de lava interior (#EA580C)
      const innerRad = Math.round(rad * 0.82);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(cx - innerRad, cy - Math.round(innerRad * squish), innerRad * 2, Math.round(innerRad * squish * 2));

      // 3. Vetas de lava viva fundida (#F97316 y #FEF08A)
      const veinBranches = 8;
      for (let v = 0; v < veinBranches; v++) {
        const vAng = (v / veinBranches) * Math.PI * 2 + (v % 2 === 0 ? 0.15 : -0.15);
        const vLen = Math.round(innerRad * 0.95);
        const vx1 = cx;
        const vy1 = cy;
        const vx2 = Math.round(cx + Math.cos(vAng) * vLen);
        const vy2 = Math.round(cy + Math.sin(vAng) * vLen * squish);

        ctx.fillStyle = '#f97316';
        ctx.fillRect(Math.min(vx1, vx2) - 2, Math.min(vy1, vy2) - 1, Math.abs(vx2 - vx1) + 4, Math.abs(vy2 - vy1) + 2);

        // Centro brillante de la veta
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(Math.min(vx1, vx2), Math.min(vy1, vy2), Math.max(2, Math.abs(vx2 - vx1)), Math.max(2, Math.abs(vy2 - vy1)));
      }

      // 4. Losas de basalto negro fracturadas en el perímetro (#18181B y #27272A)
      const slabCount = 16;
      for (let s = 0; s < slabCount; s++) {
        const sAng = (s / slabCount) * Math.PI * 2;
        const slabDist = rad * 0.9;
        const sx = Math.round(cx + Math.cos(sAng) * slabDist);
        const sy = Math.round(cy + Math.sin(sAng) * slabDist * squish);

        const slabW = 16 + (s % 3) * 4;
        const slabH = Math.round((10 + (s % 2) * 3) * squish);

        ctx.fillStyle = s % 2 === 0 ? '#18181b' : '#27272a';
        ctx.fillRect(sx - Math.round(slabW / 2), sy - Math.round(slabH / 2), slabW, slabH);

        // Borde chamuscado (#7F1D1D)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(sx - Math.round(slabW / 2) + 1, sy - Math.round(slabH / 2) + 1, slabW - 2, 2);
      }

      // 5. Burbujas cuadradas que estallan proceduralmente
      const bubbleCount = 7;
      for (let b = 0; b < bubbleCount; b++) {
        // Ciclo de vida de cada burbuja: 600ms
        const bubbleTime = (cc.elapsedMs + b * 190) % 600;
        const bProg = bubbleTime / 600;

        const bAng = ((b * 3.7) % 6.28);
        const bDist = (rad * 0.25) + ((b * 19) % Math.round(rad * 0.45));
        const bx = Math.round(cx + Math.cos(bAng) * bDist);
        const by = Math.round(cy + Math.sin(bAng) * bDist * squish);

        if (bProg < 0.75) {
          // Burbuja cuadrada creciendo
          const bSize = Math.max(2, Math.round(3 + bProg * 5));
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(bx - Math.round(bSize / 2), by - Math.round(bSize / 2), bSize, bSize);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx - 1, by - 1, 2, 2);
        } else {
          // Estallido: 4 píxeles que se separan
          const popProg = (bProg - 0.75) / 0.25;
          const spread = Math.round(popProg * 7);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(bx - spread - 1, by - spread - 1, 2, 2);
          ctx.fillRect(bx + spread - 1, by - spread - 1, 2, 2);
          ctx.fillRect(bx - spread - 1, by + spread - 1, 2, 2);
          ctx.fillRect(bx + spread - 1, by + spread - 1, 2, 2);
        }
      }

      ctx.restore();
    });
  }

  // =========================================================================
  // TEMPESTAD SOLAR (RAYO x3 + FUEGO: CASCADA DE RAYOS Y PLASMA SOLAR)
  // =========================================================================
  private static drawSolarArcTempestGround(
    ctx: CanvasRenderingContext2D,
    tempests: SolarArcTempestEntity[]
  ) {
    if (!tempests || tempests.length === 0) return;

    tempests.forEach((sat) => {
      if (sat.finished) return;

      const alpha = Math.max(0, 1 - sat.elapsedMs / sat.durationMs);
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.3);

      const squish = 0.58;

      // 1. Columnas de plasma solar residuales en el suelo
      sat.plasmaColumns.forEach((col, idx) => {
        const cx = Math.round(col.x);
        const cy = Math.round(col.y);
        const rad = Math.round(col.radius);

        // Suelo chamuscado
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(cx - rad, cy - Math.round(rad * squish), rad * 2, Math.round(rad * squish * 2));

        // Núcleo de plasma solar (#EA580C y #FDE047)
        const innerRad = Math.round(rad * 0.65);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(cx - innerRad, cy - Math.round(innerRad * squish), innerRad * 2, Math.round(innerRad * squish * 2));

        const pulse = Math.sin(sat.elapsedMs * 0.015 + idx);
        if (pulse > 0) {
          ctx.fillStyle = '#fde047';
          ctx.fillRect(cx - 3, cy - 2, 6, 4);
        }
      });

      ctx.restore();
    });
  }

  private static drawSolarArcTempestBeams(
    ctx: CanvasRenderingContext2D,
    sat: SolarArcTempestEntity
  ) {
    if (sat.finished) return;

    const alpha = Math.max(0, 1 - sat.elapsedMs / sat.durationMs);
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.4);

    // Rayos verticales quebrados descendiendo en cada columna de plasma
    sat.plasmaColumns.forEach((col, idx) => {
      const cx = Math.round(col.x);
      const groundY = Math.round(col.y);
      const skyY = groundY - 180;
      const steps = 10;
      const stepH = (groundY - skyY) / steps;

      // Rayo principal en zig-zag 16-bit
      let curX = cx;
      for (let s = 0; s < steps; s++) {
        const segY = Math.round(skyY + s * stepH);
        const jitter = Math.sin(sat.elapsedMs * 0.02 + idx * 2 + s * 1.5) * 8;
        const nextX = Math.round(cx + jitter);

        // Filamento exterior de fuego naranja (#EA580C)
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(Math.min(curX, nextX) - 3, segY, Math.abs(nextX - curX) + 6, Math.round(stepH) + 1);

        // Capa intermedia amarillo eléctrico (#FDE047)
        ctx.fillStyle = '#fde047';
        ctx.fillRect(Math.min(curX, nextX) - 1, segY, Math.abs(nextX - curX) + 3, Math.round(stepH) + 1);

        // Núcleo blanco puro (#FFFFFF)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.min(curX, nextX), segY, Math.max(2, Math.abs(nextX - curX)), Math.round(stepH) + 1);

        curX = nextX;
      }

      // Columna de plasma solar ascendente (altura ~40px)
      const colH = Math.round(col.height);
      const colW = Math.round(col.radius * 0.8);
      ctx.fillStyle = 'rgba(234, 88, 12, 0.6)';
      ctx.fillRect(cx - Math.round(colW / 2), groundY - colH, colW, colH);

      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - Math.round(colW / 4), groundY - Math.round(colH * 0.7), Math.round(colW / 2), Math.round(colH * 0.7));

      // Ascuas cuadradas flotantes
      const emberTime = (sat.elapsedMs + idx * 100) * 0.05;
      for (let e = 0; e < 3; e++) {
        const ex = Math.round(cx + Math.sin(emberTime + e) * (colW * 0.8));
        const ey = Math.round(groundY - ((emberTime * 8 + e * 14) % colH));
        ctx.fillStyle = e % 2 === 0 ? '#fde047' : '#ea580c';
        ctx.fillRect(ex - 1, ey - 1, 3, 3);
      }
    });

    ctx.restore();
  }

  // =========================================================================
  // RAYO CRIOGÉNICO PURO (RAYO x3 + HIELO: ARCOS VOLTAICOS Y CRISTALES)
  // =========================================================================
  private static drawCryoLightningStormGround(
    ctx: CanvasRenderingContext2D,
    storms: CryoLightningStormEntity[]
  ) {
    if (!storms || storms.length === 0) return;

    storms.forEach((cls) => {
      if (cls.finished) return;

      const alpha = Math.max(0, 1 - cls.elapsedMs / cls.durationMs);
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.5);

      const squish = 0.58;

      cls.strikes.forEach((s) => {
        const sx = Math.round(s.targetX);
        const sy = Math.round(s.targetY);

        // Parche de escarcha circular en suelo (#0284C7)
        const rad = 26;
        ctx.fillStyle = 'rgba(2, 132, 199, 0.45)';
        ctx.fillRect(sx - rad, sy - Math.round(rad * squish), rad * 2, Math.round(rad * squish * 2));

        // Púas y cristales de hielo cuadrados que brotan en el suelo
        const spikeCount = 5;
        for (let sp = 0; sp < spikeCount; sp++) {
          const spAng = (sp / spikeCount) * Math.PI * 2;
          const spDist = 12 + (sp % 2) * 6;
          const spX = Math.round(sx + Math.cos(spAng) * spDist);
          const spY = Math.round(sy + Math.sin(spAng) * spDist * squish);
          const spH = Math.round(12 + (sp % 3) * 6);

          // Púa de hielo (#0284C7 / #38BDF8 / #FFFFFF)
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(spX - 2, spY - spH, 4, spH);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(spX - 1, spY - spH, 2, spH - 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(spX - 1, spY - spH - 1, 2, 2);
        }
      });

      ctx.restore();
    });
  }

  private static drawCryoLightningStormStrikes(
    ctx: CanvasRenderingContext2D,
    cls: CryoLightningStormEntity
  ) {
    if (cls.finished) return;

    const alpha = Math.max(0, 1 - cls.elapsedMs / cls.durationMs);
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.5);

    // 1. Rayos verticales en cian brillante (#38BDF8) y azul glacial (#0284C7)
    cls.strikes.forEach((s, idx) => {
      const tx = Math.round(s.targetX);
      const groundY = Math.round(s.targetY);
      const skyY = groundY - 210;
      const steps = 9;
      const stepH = (groundY - skyY) / steps;

      let curX = tx;
      for (let st = 0; st < steps; st++) {
        const segY = Math.round(skyY + st * stepH);
        const jitter = Math.sin(cls.elapsedMs * 0.03 + idx * 3 + st * 1.8) * 10;
        const nextX = Math.round(tx + jitter);

        // Borde azul glacial (#0284C7)
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(Math.min(curX, nextX) - 3, segY, Math.abs(nextX - curX) + 6, Math.round(stepH) + 1);

        // Cuerpo cian brillante (#38BDF8)
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(Math.min(curX, nextX) - 1, segY, Math.abs(nextX - curX) + 3, Math.round(stepH) + 1);

        // Núcleo blanco (#FFFFFF)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.min(curX, nextX), segY, Math.max(2, Math.abs(nextX - curX)), Math.round(stepH) + 1);

        curX = nextX;
      }
    });

    // 2. Arcos voltaicos horizontales conectando puntos adyacentes
    if (cls.strikes.length >= 2) {
      for (let i = 0; i < cls.strikes.length - 1; i++) {
        const s1 = cls.strikes[i];
        const s2 = cls.strikes[i + 1];
        const midX = Math.round((s1.targetX + s2.targetX) / 2);
        const midY = Math.round((s1.targetY + s2.targetY) / 2) - 15;

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(Math.min(s1.targetX, midX), Math.min(s1.targetY, midY), Math.abs(midX - s1.targetX) + 2, 2);
        ctx.fillRect(Math.min(midX, s2.targetX), Math.min(midY, s2.targetY), Math.abs(s2.targetX - midX) + 2, 2);
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // MARTILLO DE THOR TECTÓNICO (RAYO x3 + TIERRA: COLUMNA RUNAS Y GRIETAS)
  // =========================================================================
  private static drawTectonicLightningHammerGround(
    ctx: CanvasRenderingContext2D,
    hammers: TectonicLightningHammerEntity[]
  ) {
    if (!hammers || hammers.length === 0) return;

    hammers.forEach((tlh) => {
      if (tlh.finished) return;

      const alpha = Math.max(0, 1 - tlh.elapsedMs / tlh.durationMs);
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.5);

      const tx = Math.round(tlh.targetX);
      const ty = Math.round(tlh.targetY);
      const squish = 0.58;

      // 1. Onda de choque radial expansiva (hasta 120px)
      const prog = Math.min(1, tlh.elapsedMs / 200);
      const curR = Math.round(tlh.impactRadius * prog);

      ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
      ctx.fillRect(tx - curR, ty - Math.round(curR * squish), curR * 2, Math.round(curR * squish * 2));

      // 2. Grietas de roca gris (#27272A) que se abren en el suelo
      tlh.fissures.forEach((f) => {
        const fLen = Math.round(f.length * prog);
        const segments = 6;
        for (let s = 0; s < segments; s++) {
          const d1 = (s / segments) * fLen;
          const d2 = ((s + 1) / segments) * fLen;
          const fx1 = Math.round(tx + Math.cos(f.angle) * d1);
          const fy1 = Math.round(ty + Math.sin(f.angle) * d1 * squish);
          const fx2 = Math.round(tx + Math.cos(f.angle) * d2);
          const fy2 = Math.round(ty + Math.sin(f.angle) * d2 * squish);

          // Hendidura abisal (#27272A)
          ctx.fillStyle = '#27272a';
          ctx.fillRect(Math.min(fx1, fx2) - 3, Math.min(fy1, fy2) - 2, Math.abs(fx2 - fx1) + 6, Math.abs(fy2 - fy1) + 4);

          // Borde de roca (#78350F)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(Math.min(fx1, fx2) - 2, Math.min(fy1, fy2) - 2, Math.abs(fx2 - fx1) + 4, 1);
        }
      });

      // 3. Esquirlas cuadradas de roca gris (#52525B)
      const shardProg = Math.min(1, tlh.elapsedMs / 250);
      for (let sh = 0; sh < 8; sh++) {
        const shAng = (sh / 8) * Math.PI * 2;
        const shDist = Math.round((40 + (sh % 3) * 25) * shardProg);
        const shX = Math.round(tx + Math.cos(shAng) * shDist);
        const shY = Math.round(ty + Math.sin(shAng) * shDist * squish);

        ctx.fillStyle = sh % 2 === 0 ? '#52525b' : '#27272a';
        ctx.fillRect(shX - 2, shY - 2, 5, 4);
      }

      ctx.restore();
    });
  }

  private static drawTectonicLightningHammerPillar(
    ctx: CanvasRenderingContext2D,
    tlh: TectonicLightningHammerEntity
  ) {
    if (tlh.finished) return;

    const alpha = Math.max(0, 1 - tlh.elapsedMs / tlh.durationMs);
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.5);

    const tx = Math.round(tlh.targetX);
    const groundY = Math.round(tlh.targetY);
    const skyY = groundY - 320;
    const pillarH = groundY - skyY;
    const halfW = Math.round(tlh.pillarWidth / 2); // 20px

    // 1. Columna de luz vertical de 40px de ancho:
    // Borde exterior ámbar (#F59E0B)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fillRect(tx - halfW, skyY, tlh.pillarWidth, pillarH);

    // Manto intermedio amarillo (#FDE047)
    const midW = 26;
    ctx.fillStyle = 'rgba(253, 224, 71, 0.7)';
    ctx.fillRect(tx - Math.round(midW / 2), skyY, midW, pillarH);

    // Núcleo blanco puro (#FFFFFF)
    const coreW = 12;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tx - Math.round(coreW / 2), skyY, coreW, pillarH);

    // 2. Runas amarillas grabadas en la columna
    const runeCount = 5;
    for (let r = 0; r < runeCount; r++) {
      const runeY = Math.round(skyY + 40 + r * 50);

      // Símbolo rúnico 16-bit
      ctx.fillStyle = '#fde047';
      ctx.fillRect(tx - 6, runeY, 12, 3);
      ctx.fillRect(tx - 2, runeY - 6, 4, 15);
      ctx.fillRect(tx - 5, runeY + 6, 10, 3);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tx - 1, runeY, 2, 3);
    }

    ctx.restore();
  }

  // =========================================================================
  // VENTISCA ÍGNEA (HIELO x3 + FUEGO: HIELO CANDENTE, MAGMA Y VAPOR)
  // =========================================================================
  private static drawMoltenBlizzardGround(
    ctx: CanvasRenderingContext2D,
    blizzards: MoltenBlizzardEntity[]
  ) {
    if (!blizzards || blizzards.length === 0) return;

    blizzards.forEach((mb) => {
      if (mb.finished) return;

      const alpha = Math.max(0, 1 - mb.elapsedMs / mb.durationMs);
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.4);

      const cx = Math.round(mb.centerX);
      const cy = Math.round(mb.centerY);
      const rad = mb.radius;
      const squish = 0.58;

      // 1. Suelo escarchado con fracturas térmicas
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.fillRect(cx - rad, cy - Math.round(rad * squish), rad * 2, Math.round(rad * squish * 2));

      // Centro magmático incandescente
      const innerR = Math.round(rad * 0.55);
      ctx.fillStyle = 'rgba(234, 88, 12, 0.35)';
      ctx.fillRect(cx - innerR, cy - Math.round(innerR * squish), innerR * 2, Math.round(innerR * squish * 2));

      // 2. Nubes de vapor blanco (#F8FAFC) al tocar el suelo
      const vaporPuffs = 8;
      for (let v = 0; v < vaporPuffs; v++) {
        const vAng = (v / vaporPuffs) * Math.PI * 2 + (mb.elapsedMs * 0.003);
        const vDist = (rad * 0.3) + ((v * 17) % Math.round(rad * 0.5));
        const vx = Math.round(cx + Math.cos(vAng) * vDist);
        const vy = Math.round(cy + Math.sin(vAng) * vDist * squish) - Math.round((mb.elapsedMs * 0.04 + v * 8) % 24);
        const vSize = 10 + (v % 3) * 4;

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(vx - Math.round(vSize / 2), vy - Math.round((vSize * squish) / 2), vSize, Math.round(vSize * squish));
      }

      ctx.restore();
    });
  }

  private static drawMoltenBlizzardWeather(
    ctx: CanvasRenderingContext2D,
    mb: MoltenBlizzardEntity
  ) {
    if (mb.finished) return;

    const alpha = Math.max(0, 1 - mb.elapsedMs / mb.durationMs);
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.5);

    const cx = Math.round(mb.centerX);
    const cy = Math.round(mb.centerY);
    const rad = mb.radius;
    const squish = 0.58;

    // Lluvia de partículas cuadradas cian (#38BDF8) y gotas de magma (#EA580C)
    const dropCount = 24;
    for (let d = 0; d < dropCount; d++) {
      const dropOffset = (mb.elapsedMs * 0.5 + d * 35) % 220;
      const dAng = (d * 1.95) % 6.28;
      const dDist = (d * 13) % Math.round(rad * 0.85);

      const dx = Math.round(cx + Math.cos(dAng) * dDist);
      const dy = Math.round(cy + Math.sin(dAng) * dDist * squish - 180 + dropOffset);

      if (dy <= cy + 10) {
        if (d % 2 === 0) {
          // Partícula cuadrada cian de hielo (#38BDF8)
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(dx - 2, dy - 2, 4, 4);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(dx - 1, dy - 1, 2, 2);
        } else {
          // Gota de magma naranja brillante (#EA580C)
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(dx - 2, dy - 3, 5, 6);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(dx - 1, dy - 1, 2, 3);
        }
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // AGUJAS SUPERCONDUCTORAS (HIELO x3 + RAYO: PÚAS ÁRTICAS Y RAYO VIOLETA)
  // =========================================================================
  private static drawSuperconductingNeedleStormGround(
    ctx: CanvasRenderingContext2D,
    storms: SuperconductingNeedleStormEntity[]
  ) {
    if (!storms || storms.length === 0) return;

    storms.forEach((sns) => {
      if (sns.finished) return;

      const alpha = Math.max(0, 1 - sns.elapsedMs / sns.durationMs);
      if (alpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.5);

      // 1. Dibujar líneas quebradas de 2px de rayo violeta (#A855F7) entre agujas
      if (sns.needles.length >= 2) {
        ctx.fillStyle = '#a855f7';
        for (let i = 0; i < sns.needles.length - 1; i++) {
          const n1 = sns.needles[i];
          const n2 = sns.needles[i + 1];
          const midX = Math.round((n1.x + n2.x) / 2);
          const midY = Math.round(((n1.y - n1.height) + (n2.y - n2.height)) / 2) - 8;

          const top1Y = Math.round(n1.y - n1.height);
          const top2Y = Math.round(n2.y - n2.height);

          // Segmentos de 2px en zig-zag violeta
          ctx.fillRect(Math.min(n1.x, midX), Math.min(top1Y, midY), Math.abs(midX - n1.x) + 2, 2);
          ctx.fillRect(Math.min(midX, n2.x), Math.min(midY, top2Y), Math.abs(n2.x - midX) + 2, 2);
        }
      }

      // 2. Dibujar púas geométricas afiladas en blanco y azul ártico (#BAE6FD) clavadas
      sns.needles.forEach((needle) => {
        const nx = Math.round(needle.x);
        const ny = Math.round(needle.y);
        const curH = Math.round(needle.height);

        if (curH <= 2) return;

        // Base de roca fracturada en suelo
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(nx - 6, ny - 3, 12, 6);

        // Aguja geométrica escalonada (ancho base 8px hasta punta 2px)
        const steps = 6;
        const stepH = Math.max(2, Math.round(curH / steps));
        for (let st = 0; st < steps; st++) {
          const segY = ny - (st + 1) * stepH;
          const wProg = (steps - st) / steps;
          const curW = Math.max(2, Math.round(8 * wProg));
          const halfW = Math.round(curW / 2);

          // Sombra azul ártico profundo (#0284C7)
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(nx - halfW, segY, halfW, stepH);

          // Cara frontal azul ártico brillante (#BAE6FD)
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(nx, segY, halfW, stepH);
        }

        // Punta afilada en blanco puro (#FFFFFF)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(nx - 1, ny - curH - 2, 3, 3);
      });

      ctx.restore();
    });
  }

  // =========================================================================
  // GLACIAR TECTÓNICO (HIELO x3 + TIERRA: MURO PIEDRA 1E293B Y HIELO 0284C7)
  // =========================================================================
  private static drawTectonicGlacierWallMoving(
    ctx: CanvasRenderingContext2D,
    tgw: TectonicGlacierWallEntity
  ) {
    if (tgw.finished) return;

    const alpha = Math.max(0, 1 - tgw.elapsedMs / tgw.durationMs);
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.5);

    const squish = 0.58;
    const wallCenterX = tgw.originX + Math.cos(tgw.aimAngle) * tgw.currentDist;
    const wallCenterY = tgw.originY + Math.sin(tgw.aimAngle) * tgw.currentDist * squish;

    const perpAngle = tgw.aimAngle + Math.PI / 2;
    const perpCos = Math.cos(perpAngle);
    const perpSin = Math.sin(perpAngle) * squish;

    // Sombra del glaciar en el suelo
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(Math.round(wallCenterX - tgw.width / 2), Math.round(wallCenterY - 6), tgw.width, 12);

    // Muro escalonado de bloques de piedra gris (#1E293B) y hielo azul profundo (#0284C7)
    tgw.blocks.forEach((block) => {
      const bx = Math.round(wallCenterX + perpCos * block.offsetDist);
      const by = Math.round(wallCenterY + perpSin * block.offsetDist);
      const blockW = 16;
      const halfW = 8;
      const blockH = Math.round(block.height);

      if (block.isRock) {
        // Bloque de roca sólida (#1E293B y #334155)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx - halfW, by - blockH, blockW, blockH);

        // Aristas iluminadas de pizarra
        ctx.fillStyle = '#334155';
        ctx.fillRect(bx - halfW, by - blockH, 3, blockH);
        ctx.fillRect(bx + halfW - 3, by - blockH, 3, blockH);

        // Cresta blanca de nieve dura (#FFFFFF)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx - halfW + 1, by - blockH - 3, blockW - 2, 3);
      } else {
        // Bloque de hielo azul profundo (#0284C7 y #38BDF8)
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(bx - halfW, by - blockH, blockW, blockH);

        // Faceta de cristal gélido
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(bx - 2, by - blockH + 3, 5, blockH - 6);

        // Cresta glaciar afilada en blanco puro (#FFFFFF)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx - halfW, by - blockH - 4, blockW, 4);
      }
    });

    ctx.restore();
  }

  // =========================================================================
  // BOMBARDEO VOLCÁNICO (FUEGO + TIERRA: SUELO, FISURAS, COLUMNAS Y BOMBAS)
  // =========================================================================

  // 1. Suelo: Fracturas magmáticas incandescentes, calderas de lava y sombras de proyectiles
  private static drawVolcanicBombardmentFloor(
    ctx: CanvasRenderingContext2D,
    bombardments: VolcanicBombardmentEntity[]
  ) {
    if (!bombardments || bombardments.length === 0) return;

    bombardments.forEach((bombardment) => {
      // Dibujar fisuras y calderas
      bombardment.fissures.forEach((fissure) => {
        if (fissure.phase === 'finished') return;
        if (fissure.elapsedMs < fissure.delayMs) return;

        const localElapsed = fissure.elapsedMs - fissure.delayMs;
        const squish = 0.58;

        // FASE A: ADVERTENCIA Y FRACTURA MAGMÁTICA (0 a warningDurationMs)
        if (fissure.phase === 'warning') {
          const prog = Math.min(1.0, localElapsed / fissure.warningDurationMs);
          const pulse = 0.85 + Math.sin(Date.now() * 0.015 + fissure.x) * 0.15;
          const currentR = fissure.radius * (0.6 + 0.4 * prog);

          ctx.save();
          ctx.translate(fissure.x, fissure.y);

          // Resplandor térmico subterráneo pulsante
          const heatGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, currentR * 1.3);
          heatGrad.addColorStop(0, `rgba(255, 241, 118, ${0.7 * prog * pulse})`);
          heatGrad.addColorStop(0.35, `rgba(255, 109, 0, ${0.85 * prog * pulse})`);
          heatGrad.addColorStop(0.7, `rgba(213, 0, 0, ${0.45 * prog * pulse})`);
          heatGrad.addColorStop(1, 'rgba(213, 0, 0, 0)');
          ctx.fillStyle = heatGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, currentR * 1.3, currentR * 1.3 * squish, 0, 0, Math.PI * 2);
          ctx.fill();

          // Grietas telúricas fracturadas que se abren desde el centro
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          fissure.crackAngles.forEach((ang, idx) => {
            const crackLen = currentR * (0.8 + 0.3 * Math.sin(idx * 2));
            const midX1 = Math.cos(ang) * (crackLen * 0.35) + Math.sin(idx) * 4;
            const midY1 = Math.sin(ang) * (crackLen * 0.35 * squish) + Math.cos(idx) * 2;
            const midX2 = Math.cos(ang) * (crackLen * 0.7) - Math.sin(idx) * 3;
            const midY2 = Math.sin(ang) * (crackLen * 0.7 * squish) - Math.cos(idx) * 2;
            const endX = Math.cos(ang) * crackLen;
            const endY = Math.sin(ang) * crackLen * squish;

            // Trazo exterior de roca basáltica carbonizada
            ctx.strokeStyle = '#261c14';
            ctx.lineWidth = 3.6;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(midX1, midY1);
            ctx.lineTo(midX2, midY2);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Núcleo incandescente de magma líquido
            ctx.strokeStyle = idx % 2 === 0 ? '#fff176' : '#ff9100';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(midX1, midY1);
            ctx.lineTo(midX2, midY2);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          });

          ctx.restore();
        }

        // FASE B: ERUPCIÓN VIOLENTA (CALDERA DE LAVA ACTIVA)
        else if (fissure.phase === 'eruption') {
          const currentR = fissure.radius;

          ctx.save();
          ctx.translate(fissure.x, fissure.y);

          // Borde carbonizado de roca volcánica
          ctx.fillStyle = '#1b120c';
          ctx.beginPath();
          ctx.ellipse(0, 0, currentR * 1.25, currentR * 1.25 * squish, 0, 0, Math.PI * 2);
          ctx.fill();

          // Cráter ardiente con lava fundida
          const lavaGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, currentR);
          lavaGrad.addColorStop(0, '#ffffff');
          lavaGrad.addColorStop(0.25, '#fff176');
          lavaGrad.addColorStop(0.6, '#ff6d00');
          lavaGrad.addColorStop(0.85, '#d50000');
          lavaGrad.addColorStop(1, '#3e2723');
          ctx.fillStyle = lavaGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, currentR, currentR * squish, 0, 0, Math.PI * 2);
          ctx.fill();

          // Burbujas incandescentes en el cráter
          const now = Date.now();
          for (let b = 0; b < 3; b++) {
            const bAng = now * 0.004 + b * 2.1;
            const bDist = currentR * 0.45;
            const bx = Math.cos(bAng) * bDist;
            const by = Math.sin(bAng) * bDist * squish;
            const bR = 2.5 + Math.sin(now * 0.01 + b) * 1.5;

            ctx.fillStyle = '#fffde7';
            ctx.beginPath();
            ctx.arc(bx, by, Math.max(1, bR), 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        // FASE C: ENFRIAMIENTO Y SOLIDIFICACIÓN (Lava endureciéndose en basalto)
        else if (fissure.phase === 'cooling') {
          const coolElapsed = localElapsed - fissure.warningDurationMs - fissure.eruptionDurationMs;
          const prog = Math.min(1.0, coolElapsed / fissure.coolingDurationMs);
          const currentR = fissure.radius;
          const alpha = 1.0 - prog;

          ctx.save();
          ctx.translate(fissure.x, fissure.y);

          // Costra basáltica oscura enfriada
          ctx.fillStyle = '#212121';
          ctx.beginPath();
          ctx.ellipse(0, 0, currentR * 1.15, currentR * 1.15 * squish, 0, 0, Math.PI * 2);
          ctx.fill();

          // Resto de calor residual desvaneciéndose
          if (alpha > 0.05) {
            const residualGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, currentR * 0.8);
            residualGrad.addColorStop(0, `rgba(255, 109, 0, ${0.6 * alpha})`);
            residualGrad.addColorStop(0.6, `rgba(213, 0, 0, ${0.4 * alpha})`);
            residualGrad.addColorStop(1, 'rgba(33, 33, 33, 0)');
            ctx.fillStyle = residualGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, currentR * 0.8, currentR * 0.8 * squish, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      });

      // Dibujar sombras de las bombas de lava balísticas en el suelo
      bombardment.lavaBombs.forEach((bomb) => {
        if (bomb.hasExploded) return;

        const hRatio = Math.max(0, Math.min(1.0, bomb.currentHeight / 48));
        const shadowRx = bomb.radius * (1.3 - 0.45 * hRatio);
        const shadowRy = shadowRx * 0.55;
        const shadowAlpha = Math.max(0.12, 0.55 - 0.35 * hRatio);

        ctx.save();
        ctx.fillStyle = `rgba(18, 12, 10, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(bomb.currentX, bomb.currentY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });
  }

  // 2. Columna de Magma Eruptivo en Y-Sorting (Fluidos, crestas incandescentes y vapor volcánico)
  private static drawVolcanicMagmaColumn(
    ctx: CanvasRenderingContext2D,
    fissure: VolcanicFissureEntity
  ) {
    if (fissure.columnHeight <= 2) return;

    const height = fissure.columnHeight;
    const baseW = fissure.radius * 0.95;
    const midW = fissure.radius * 0.75 + Math.sin(Date.now() * 0.02 + fissure.x) * 3;
    const topW = fissure.radius * 0.5;

    // Calcular alpha si está en fase de enfriamiento
    let alpha = 1.0;
    if (fissure.phase === 'cooling') {
      const localElapsed = fissure.elapsedMs - fissure.delayMs;
      const coolElapsed = localElapsed - fissure.warningDurationMs - fissure.eruptionDurationMs;
      const prog = Math.min(1.0, coolElapsed / fissure.coolingDurationMs);
      alpha = Math.max(0, 1.0 - prog);
    }

    ctx.save();
    ctx.translate(fissure.x, fissure.y);
    ctx.globalAlpha = alpha;

    // A. Halo exterior incandescente
    const auraGrad = ctx.createLinearGradient(0, 0, 0, -height);
    auraGrad.addColorStop(0, 'rgba(255, 109, 0, 0.6)');
    auraGrad.addColorStop(0.6, 'rgba(255, 61, 0, 0.4)');
    auraGrad.addColorStop(1, 'rgba(255, 241, 118, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.moveTo(-baseW * 1.35, 0);
    ctx.lineTo(-midW * 1.3, -height * 0.5);
    ctx.lineTo(-topW * 1.4, -height * 1.08);
    ctx.lineTo(topW * 1.4, -height * 1.08);
    ctx.lineTo(midW * 1.3, -height * 0.5);
    ctx.lineTo(baseW * 1.35, 0);
    ctx.closePath();
    ctx.fill();

    // B. Cuerpo principal de la columna de roca líquida
    const columnGrad = ctx.createLinearGradient(0, 0, 0, -height);
    columnGrad.addColorStop(0, '#d50000');
    columnGrad.addColorStop(0.3, '#ff6d00');
    columnGrad.addColorStop(0.7, '#ff9100');
    columnGrad.addColorStop(0.95, '#fff176');
    columnGrad.addColorStop(1, '#ffffff');

    ctx.fillStyle = columnGrad;
    ctx.strokeStyle = '#ff3d00';
    ctx.lineWidth = 1.6;

    // Silueta orgánica sinuosa con lóbulos de magma
    const wave1 = Math.sin(Date.now() * 0.015) * 4;
    const wave2 = Math.cos(Date.now() * 0.018) * 3;

    ctx.beginPath();
    ctx.moveTo(-baseW, 4);
    // Borde izquierdo con curvaturas
    ctx.quadraticCurveTo(-midW + wave1, -height * 0.45, -topW + wave2, -height);
    // Corona eruptiva en el ápice (3 espículas de lava)
    ctx.lineTo(-topW * 0.5, -height * 1.07);
    ctx.lineTo(0, -height * 1.15);
    ctx.lineTo(topW * 0.5, -height * 1.07);
    ctx.lineTo(topW - wave2, -height);
    // Borde derecho con curvaturas
    ctx.quadraticCurveTo(midW + wave1, -height * 0.45, baseW, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // C. Núcleo interior supercaliente (White-Hot Core)
    const coreGrad = ctx.createLinearGradient(0, 0, 0, -height);
    coreGrad.addColorStop(0, 'rgba(255, 109, 0, 0.4)');
    coreGrad.addColorStop(0.5, 'rgba(255, 241, 118, 0.9)');
    coreGrad.addColorStop(1, '#ffffff');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(-baseW * 0.4, 0);
    ctx.quadraticCurveTo(-midW * 0.35 + wave1 * 0.5, -height * 0.45, -topW * 0.3, -height * 0.95);
    ctx.lineTo(0, -height * 1.05);
    ctx.lineTo(topW * 0.3, -height * 0.95);
    ctx.quadraticCurveTo(midW * 0.35 + wave1 * 0.5, -height * 0.45, baseW * 0.4, 0);
    ctx.closePath();
    ctx.fill();

    // D. Gotas y chorros de magma ascendente
    ctx.fillStyle = '#fffde7';
    for (let d = 0; d < 3; d++) {
      const dropProg = ((Date.now() * 0.003 + d * 0.33) % 1.0);
      const dy = -dropProg * height;
      const dx = Math.sin(dropProg * 8 + d) * (midW * 0.5);
      const dr = 2 + (1 - dropProg) * 2;
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 3. Bomba de Lava Balística en Y-Sorting (Proyectil parabólico incandescente con estela)
  private static drawLavaBomb(
    ctx: CanvasRenderingContext2D,
    bomb: LavaBombEntity
  ) {
    if (bomb.hasExploded) return;

    const drawX = bomb.currentX;
    const drawY = bomb.currentY - bomb.currentHeight;
    const r = bomb.radius;

    ctx.save();
    ctx.translate(drawX, drawY);

    // Halo térmico exterior de la bomba
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.2);
    glow.addColorStop(0, 'rgba(255, 241, 118, 0.9)');
    glow.addColorStop(0.4, 'rgba(255, 109, 0, 0.7)');
    glow.addColorStop(0.8, 'rgba(213, 0, 0, 0.35)');
    glow.addColorStop(1, 'rgba(213, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo rocoso fundido irregular (polígono deformado que rota ligeramente)
    const rot = bomb.progress * Math.PI * 4;
    ctx.rotate(rot);

    ctx.fillStyle = '#ff6d00';
    ctx.strokeStyle = '#fff176';
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    const vertices = 7;
    for (let v = 0; v < vertices; v++) {
      const vAng = (v * Math.PI * 2) / vertices;
      const wobble = 0.82 + 0.28 * Math.sin(v * 3 + bomb.id.charCodeAt(v % bomb.id.length));
      const vx = Math.cos(vAng) * r * wobble;
      const vy = Math.sin(vAng) * r * wobble;
      if (v === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Núcleo blanco-dorado en el centro
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 4. Previsualización de retícula táctica y fisuras proyectadas para Bombardeo Volcánico
  private static drawVolcanicAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ang = wizard.facingAngle;
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const dist = 180;
    const squish = 0.58;
    const tx = wizard.x + Math.cos(ang) * dist;
    const ty = wizard.y + Math.sin(ang) * dist * squish;
    const areaRadius = isReady ? 75 : 55;

    ctx.save();

    // Línea directriz punteada desde el báculo hacia la zona de bombardeo
    ctx.strokeStyle = isReady ? 'rgba(255, 241, 118, 0.65)' : 'rgba(255, 109, 0, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(wizard.x, wizard.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.translate(tx, ty);

    // Círculo exterior de cobertura de bombardeo
    ctx.strokeStyle = isReady ? '#fff176' : '#ff6d00';
    ctx.lineWidth = isReady ? 2.2 : 1.6;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(0, 0, areaRadius, areaRadius * squish, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Previsualización de las fisuras (3 en toque normal, 5 si está sobrecargado)
    const fissureOffsets: Array<{ dx: number; dy: number }> = isReady
      ? [
          { dx: 0, dy: 0 },
          { dx: Math.cos(0.3) * 58, dy: Math.sin(0.3) * 58 * squish },
          { dx: Math.cos(1.8) * 58, dy: Math.sin(1.8) * 58 * squish },
          { dx: Math.cos(3.4) * 58, dy: Math.sin(3.4) * 58 * squish },
          { dx: Math.cos(4.9) * 58, dy: Math.sin(4.9) * 58 * squish },
        ]
      : [
          { dx: 0, dy: 0 },
          { dx: Math.cos(2.2) * 44, dy: Math.sin(2.2) * 44 * squish },
          { dx: Math.cos(-2.2) * 44, dy: Math.sin(-2.2) * 44 * squish },
        ];

    fissureOffsets.forEach((fo) => {
      ctx.save();
      ctx.translate(fo.dx, fo.dy);

      // Micro-cráter proyectado
      ctx.strokeStyle = isReady ? '#fef08a' : '#f97316';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 14 * squish, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Cruz o fractura central
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(7, 0);
      ctx.moveTo(0, -7 * squish);
      ctx.lineTo(0, 7 * squish);
      ctx.stroke();

      ctx.restore();
    });

    // Texto de HUD táctico flotante sobre la retícula
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#fff176' : '#ff9100';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(
      isReady ? '¡SOBRECARGA VOLCÁNICA +50%! 🌋 (5 FISURAS)' : 'BOMBARDEO VOLCÁNICO 🌋 (3 FISURAS)',
      0,
      -areaRadius * squish - 12
    );

    ctx.restore();
  }

  // =========================================================================
  // VÓRTICE DE CHOQUE TÉRMICO (FUEGO + HIELO: EXPANSIÓN DE VAPOR Y ANILLOS)
  // =========================================================================

  // 1. Onda expansiva de vapor a alta presión, núcleo térmico y micro-anillos de distorsión
  private static drawThermalVortices(
    ctx: CanvasRenderingContext2D,
    vortices: ThermalVortexEntity[]
  ) {
    if (!vortices || vortices.length === 0) return;

    vortices.forEach((vortex) => {
      if (vortex.phase === 'finished') return;

      const squish = 0.58;
      const r = vortex.currentRadius;
      if (r <= 2) return;

      let alpha = 1.0;
      let prog = 1.0;

      if (vortex.phase === 'expanding') {
        prog = Math.min(1.0, vortex.phaseTimer / vortex.expandDurationMs);
        alpha = 1.0;
      } else if (vortex.phase === 'dissipating') {
        const disProg = Math.min(1.0, vortex.phaseTimer / vortex.dissipateDurationMs);
        alpha = Math.max(0, 1.0 - disProg);
        prog = 1.0;
      }

      ctx.save();
      ctx.translate(vortex.x, vortex.y);

      // A. Núcleo central térmico anaranjado que se consume y disuelve rápidamente
      if (prog < 0.85 && alpha > 0.05) {
        const coreAlpha = Math.max(0, (1.0 - prog * 1.18) * alpha * 0.7);
        const coreR = r * 0.45;
        const heatGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coreR);
        heatGrad.addColorStop(0, `rgba(255, 241, 118, ${coreAlpha})`);
        heatGrad.addColorStop(0.4, `rgba(255, 109, 0, ${coreAlpha * 0.85})`);
        heatGrad.addColorStop(0.85, `rgba(244, 63, 94, ${coreAlpha * 0.5})`);
        heatGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');

        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, coreR, coreR * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pavesas incandescentes centrales que se apagan al contacto con la niebla
        const now = Date.now();
        for (let eb = 0; eb < 5; eb++) {
          const ebAng = now * 0.005 + eb * 1.25;
          const ebDist = coreR * (0.3 + 0.5 * ((now * 0.002 + eb * 0.2) % 1.0));
          const ebx = Math.cos(ebAng) * ebDist;
          const eby = Math.sin(ebAng) * ebDist * squish;
          ctx.fillStyle = `rgba(255, 241, 118, ${coreAlpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(ebx, eby, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // B. Anillo denso de vapor translúcido (Mezcla de blanco nieve y gris ceniza suave)
      const steamGrad = ctx.createRadialGradient(0, 0, r * 0.28, 0, 0, r * 1.04);
      steamGrad.addColorStop(0, `rgba(255, 109, 0, ${0.15 * alpha})`);
      steamGrad.addColorStop(0.32, `rgba(255, 255, 255, ${0.60 * alpha})`);
      steamGrad.addColorStop(0.68, `rgba(236, 239, 241, ${0.46 * alpha})`);
      steamGrad.addColorStop(0.88, `rgba(128, 216, 255, ${0.40 * alpha})`);
      steamGrad.addColorStop(1, 'rgba(128, 216, 255, 0)');

      ctx.fillStyle = steamGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // C. Micro-anillos concéntricos de distorsión sónica y choque a alta presión
      // Anillo 1 (interno blanco)
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.52 * alpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.72, r * 0.72 * squish, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Anillo 2 (medio cian de escarcha pulverizada)
      ctx.strokeStyle = `rgba(128, 216, 255, ${0.62 * alpha})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.88, r * 0.88 * squish, 0, 0, Math.PI * 2);
      ctx.stroke();

      // D. Borde frontal de condensación sónica (Perímetro exterior)
      ctx.strokeStyle = vortex.isCharged
        ? `rgba(128, 216, 255, ${0.92 * alpha})`
        : `rgba(128, 216, 255, ${0.78 * alpha})`;
      ctx.lineWidth = vortex.isCharged ? 3.2 : 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * squish, 0, 0, Math.PI * 2);
      ctx.stroke();

      // E. Filamentos de vapor radiales arremolinados
      const wisps = 6;
      for (let w = 0; w < wisps; w++) {
        const wAng = (w * Math.PI * 2) / wisps + (vortex.ringSeed * 2);
        const wx1 = Math.cos(wAng) * (r * 0.65);
        const wy1 = Math.sin(wAng) * (r * 0.65 * squish);
        const wx2 = Math.cos(wAng + 0.18) * (r * 0.95);
        const wy2 = Math.sin(wAng + 0.18) * (r * 0.95 * squish);

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * alpha})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(wx1, wy1);
        ctx.quadraticCurveTo((wx1 + wx2) / 2 + 3, (wy1 + wy2) / 2 - 2, wx2, wy2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  // 2. Previsualización de retícula táctica para Vórtice de Choque Térmico
  private static drawThermalAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;
    const areaRadius = isReady ? 150 : 105;

    ctx.save();
    ctx.translate(wizard.x, wizard.y);

    // Círculo de cobertura de onda de choque térmico
    ctx.strokeStyle = isReady ? '#80d8ff' : '#f43f5e';
    ctx.lineWidth = isReady ? 2.4 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(0, 0, areaRadius, areaRadius * squish, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Anillo secundario interno
    ctx.strokeStyle = isReady ? 'rgba(255, 109, 0, 0.7)' : 'rgba(128, 216, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, areaRadius * 0.6, areaRadius * 0.6 * squish, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Cruz sónica central
    ctx.strokeStyle = isReady ? '#ffffff' : '#f43f5e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.moveTo(0, -16 * squish);
    ctx.lineTo(0, 16 * squish);
    ctx.stroke();

    // Texto de HUD táctico flotante sobre la retícula
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#80d8ff' : '#f43f5e';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(
      isReady ? '¡SOBRECARGA TÉRMICA +50%! ♨️💥 (RADIO 4.2)' : 'VÓRTICE DE CHOQUE TÉRMICO ♨️💥 (RADIO 3.0)',
      0,
      -areaRadius * squish - 12
    );

    ctx.restore();
  }

  // CAPA 1: SUELO DEL BOSQUE EXTENDIDO (Chunks con Frustum Culling + Sendero Sinuoso + Plazas)
  private static drawForestGround(
    ctx: CanvasRenderingContext2D,
    frustum: FrustumBounds,
    levelData: ForestLevelData
  ) {
    // 1. Chunks de hierba del bosque (solo los visibles dentro del frustum)
    levelData.chunks.forEach((chunk) => {
      if (
        chunk.x + chunk.width < frustum.left ||
        chunk.x > frustum.right ||
        chunk.y + chunk.height < frustum.top ||
        chunk.y > frustum.bottom
      ) {
        return; // Frustum culling descartando chunks fuera de cámara
      }

      // Tonalidad del pasto según la zona
      let grassColor = '#132819';
      if (chunk.zone === 'camp') grassColor = '#162e1c';
      else if (chunk.zone === 'gate') grassColor = '#15241b';
      else if (chunk.zone === 'arena') grassColor = '#101c15';

      ctx.fillStyle = grassColor;
      ctx.fillRect(chunk.x, chunk.y, chunk.width, chunk.height);

      // Micro-detalles de textura en el pasto del chunk
      ctx.fillStyle = '#0f2014';
      const seed = (chunk.indexX * 17 + chunk.indexY * 31);
      for (let d = 0; d < 6; d++) {
        const dx = chunk.x + ((seed * (d + 1) * 73) % chunk.width);
        const dy = chunk.y + ((seed * (d + 2) * 97) % chunk.height);
        ctx.fillRect(dx, dy, 18, 10);
      }
    });

    // 2. El Gran Sendero de Tierra Sinuoso entre Waypoints
    const waypoints = levelData.trailWaypoints;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];

      // Culling bidimensional del segmento del sendero
      const minX = Math.min(p1.x, p2.x) - 200;
      const maxX = Math.max(p1.x, p2.x) + 200;
      const minY = Math.min(p1.y, p2.y) - 200;
      const maxY = Math.max(p1.y, p2.y) + 200;
      if (maxX < frustum.left || minX > frustum.right || maxY < frustum.top || minY > frustum.bottom) continue;

      // Base del sendero (suelo de tierra compacta)
      ctx.strokeStyle = '#453221';
      ctx.lineWidth = (p1.width + p2.width) / 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Centro del camino desgastado (tono más claro)
      ctx.strokeStyle = '#5a422d';
      ctx.lineWidth = ((p1.width + p2.width) / 2) * 0.65;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // 3. Plaza de Adoquines en el Checkpoint del Portón (dinámico alrededor de gateDoor)
    const gx = levelData.gateDoor.x;
    const gy = levelData.gateDoor.y;
    if (isInFrustum(gx, gy, 400, frustum)) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(gx - 300, gy - 120, 600, 240);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      for (let sy = gy - 100; sy < gy + 120; sy += 30) {
        ctx.beginPath();
        ctx.moveTo(gx - 280, sy);
        ctx.lineTo(gx + 280, sy);
        ctx.stroke();
      }

      // Runa / Conducto Criogénico en el suelo entre la Rueda y el Portón
      const wheel = levelData.puzzleWheel;
      const hasCharge = wheel.charge > 0;
      ctx.strokeStyle = hasCharge ? 'rgba(0, 240, 255, 0.75)' : 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = hasCharge ? 3.5 : 2.0;
      if (hasCharge) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.moveTo(wheel.x, wheel.y);
      ctx.lineTo(wheel.x + 80, wheel.y);
      ctx.lineTo(levelData.gateDoor.x, levelData.gateDoor.y + 10);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pulsos de energía criogénica corriendo hacia la puerta
      if (hasCharge && !wheel.isCompleted) {
        const pulseProg = (Date.now() * 0.002) % 1;
        const px = wheel.x + (levelData.gateDoor.x - wheel.x) * pulseProg;
        const py = wheel.y + (levelData.gateDoor.y + 10 - wheel.y) * pulseProg;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Gran Arena del Jefe / Santuario Megalítico (Epicentro X ~ 7400, Y ~ 1200)
    const arenaCenterX = 7400;
    const arenaCenterY = 1200;
    const arenaRadius = 450;
    if (isInFrustum(arenaCenterX, arenaCenterY, arenaRadius + 150, frustum)) {
      // Círculo exterior de piedra antigua
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(arenaCenterX, arenaCenterY, arenaRadius, arenaRadius * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Círculo interior rúnico
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(arenaCenterX, arenaCenterY, arenaRadius * 0.65, arenaRadius * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Suelo calcinado y cenizas para las Barreras de Fuego
    if (levelData.fireBarriers) {
      this.drawFireBarriersGround(ctx, frustum, levelData.fireBarriers);
    }
  }

  // CAPA 2 (Y-SORTED): Tronco de árbol y raíces en el suelo en Pixel Art 16-Bit
  private static drawTreeTrunk(ctx: CanvasRenderingContext2D, tree: ForestTreeEntity) {
    const tx = Math.round(tree.x);
    const ty = Math.round(tree.y);
    const r = Math.round(tree.trunkRadius);
    const OUTLINE = '#0f172a';

    // Sombra del tronco en escalones pixelados
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(tx - r * 1.5, ty + 1, r * 3, 4);
    ctx.fillRect(tx - r * 1.2, ty + 5, r * 2.4, 3);

    // Contorno del tronco
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(tx - r - 1, ty - tree.canopyHeight * 0.75 - 1, (r * 2) + 2, tree.canopyHeight * 0.75 + 3);
    ctx.fillRect(tx - r * 1.4 - 1, ty - 1, (r * 2.8) + 2, 5); // Raíces

    // Tronco de madera oscura en bloques de 2 píxeles
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(tx - r, ty - tree.canopyHeight * 0.75, r * 2, tree.canopyHeight * 0.75);
    ctx.fillRect(tx - r * 1.4, ty, r * 2.8, 4);

    // Vetas de madera iluminada en el centro
    ctx.fillStyle = '#451a03';
    ctx.fillRect(tx - r * 0.3, ty - tree.canopyHeight * 0.7, r * 0.8, tree.canopyHeight * 0.7);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(tx - r * 0.1, ty - tree.canopyHeight * 0.65, 2, tree.canopyHeight * 0.6);
  }

  // CAPA 2 (Y-SORTED): Monolito Rúnico de Punto de Control (Checkpoint)
  private static drawCheckpointMonolith(
    ctx: CanvasRenderingContext2D,
    cp: LevelCheckpoint,
    now: number
  ) {
    ctx.save();
    ctx.translate(cp.x, cp.y);

    const isActive = cp.isActive;
    const pulse = 0.8 + 0.2 * Math.sin(now * 0.005);
    const goldColor = '#f59e0b';

    // 1. Sombra elíptica en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 32, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Runa concéntrica giratoria en la base si está activo
    if (isActive) {
      ctx.save();
      ctx.scale(1, 0.58);
      ctx.strokeStyle = `rgba(245, 158, 11, ${0.45 * pulse})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = goldColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 16, 34, 0, Math.PI * 2);
      ctx.stroke();

      const rAngle = (now * 0.001) % (Math.PI * 2);
      for (let i = 0; i < 4; i++) {
        const a = rAngle + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 34, 16 + Math.sin(a) * 34, 3, 0, Math.PI * 2);
        ctx.fillStyle = goldColor;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // 3. Pedestal escalonado de piedra rúnica
    // Escalón inferior
    ctx.fillStyle = isActive ? '#1c1917' : '#18181b';
    ctx.strokeStyle = isActive ? '#78350f' : '#27272a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-26, 0, 52, 14, 4);
    ctx.fill();
    ctx.stroke();

    // Escalón superior
    ctx.fillStyle = isActive ? '#292524' : '#27272a';
    ctx.strokeStyle = isActive ? '#b45309' : '#3f3f46';
    ctx.beginPath();
    ctx.roundRect(-20, -8, 40, 12, 3);
    ctx.fill();
    ctx.stroke();

    // 4. Eje vertical del monolito / obelisco
    const obeliskGrad = ctx.createLinearGradient(-14, -58, 14, 0);
    if (isActive) {
      obeliskGrad.addColorStop(0, '#44403c');
      obeliskGrad.addColorStop(0.5, '#292524');
      obeliskGrad.addColorStop(1, '#1c1917');
    } else {
      obeliskGrad.addColorStop(0, '#3f3f46');
      obeliskGrad.addColorStop(0.5, '#27272a');
      obeliskGrad.addColorStop(1, '#18181b');
    }
    ctx.fillStyle = obeliskGrad;
    ctx.strokeStyle = isActive ? '#d97706' : '#52525b';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(-14, -8);
    ctx.lineTo(-10, -56);
    ctx.lineTo(0, -68); // Cúspide piramidal
    ctx.lineTo(10, -56);
    ctx.lineTo(14, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arista central para relieve 3D
    ctx.strokeStyle = isActive ? '#78350f' : '#3f3f46';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -68);
    ctx.lineTo(0, -8);
    ctx.stroke();

    // 5. Glifos rúnicos verticales grabados
    if (isActive) {
      ctx.shadowColor = goldColor;
      ctx.shadowBlur = 10 * pulse;
      ctx.fillStyle = goldColor;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;

      // Glifo superior
      ctx.beginPath();
      ctx.arc(0, -50, 3, 0, Math.PI * 2);
      ctx.fill();

      // Glifo rúnico angular central
      ctx.beginPath();
      ctx.moveTo(-5, -40);
      ctx.lineTo(0, -44);
      ctx.lineTo(5, -40);
      ctx.lineTo(0, -32);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Glifo inferior
      ctx.beginPath();
      ctx.moveTo(-4, -24);
      ctx.lineTo(4, -24);
      ctx.moveTo(0, -28);
      ctx.lineTo(0, -18);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // 6. Cristal de ámbar flotante sobre la cúspide
      const crystalY = -78 + Math.sin(now * 0.006) * 4;
      ctx.save();
      ctx.translate(0, crystalY);
      ctx.rotate(Math.PI / 4 + Math.sin(now * 0.003) * 0.2);
      ctx.fillStyle = goldColor;
      ctx.shadowColor = goldColor;
      ctx.shadowBlur = 14 * pulse;
      ctx.fillRect(-5, -5, 10, 10);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-5, -5, 10, 10);
      ctx.restore();

      // 7. Partículas ascendentes doradas
      if (cp.particles && cp.particles.length > 0) {
        cp.particles.forEach((part) => {
          const alpha = part.life / part.maxLife;
          ctx.fillStyle = `rgba(245, 158, 11, ${alpha * 0.85})`;
          ctx.beginPath();
          ctx.arc(part.x - cp.x, part.y - cp.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    } else {
      // Glifos inactivos tenues
      ctx.fillStyle = 'rgba(156, 163, 175, 0.35)';
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.25)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.arc(0, -50, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-4, -40);
      ctx.lineTo(0, -43);
      ctx.lineTo(4, -40);
      ctx.lineTo(0, -33);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-3, -22);
      ctx.lineTo(3, -22);
      ctx.moveTo(0, -25);
      ctx.lineTo(0, -17);
      ctx.stroke();
    }

    ctx.restore();
  }

  // CAPA 2 (Y-SORTED): Mecanismo de Rueda Elemental accionado por Hielo
  private static drawPuzzleWheel(
    ctx: CanvasRenderingContext2D,
    wheel: PuzzleWheelEntity,
    wizard: { x: number; y: number }
  ) {
    ctx.save();
    const wx = wheel.x;
    const wy = wheel.y;
    const r = wheel.radius;

    // 1. Sombra en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(wx, wy + 4, r * 1.2, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Pedestal de piedra basal
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(wx, wy, r * 1.1, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // 3. Rueda Dentada giratoria
    ctx.save();
    ctx.translate(wx, wy - 8);
    ctx.rotate(wheel.rotationAngle);

    // Dientes del engranaje
    const teeth = 8;
    ctx.fillStyle = wheel.isCompleted ? '#0284c7' : '#475569';
    for (let i = 0; i < teeth; i++) {
      const tAng = (i * Math.PI * 2) / teeth;
      ctx.save();
      ctx.rotate(tAng);
      ctx.fillRect(-r * 0.18, -r * 0.95, r * 0.36, r * 0.35);
      ctx.restore();
    }

    // Disco central del engranaje
    ctx.fillStyle = wheel.isCompleted ? '#0369a1' : '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = wheel.isCompleted ? '#38bdf8' : '#64748b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Buje central con cristal de hielo
    ctx.fillStyle = wheel.isCompleted ? '#ffffff' : (wheel.frostVisual > 0.3 ? '#7dd3fc' : '#94a3b8');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Fin rotación engranaje

    // 4. Capa de Escarcha y Cristales Glaciales
    if (wheel.frostVisual > 0.05) {
      ctx.save();
      ctx.translate(wx, wy - 8);
      ctx.globalAlpha = Math.min(1.0, wheel.frostVisual * 1.2);
      ctx.fillStyle = '#e0f7fa';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      for (let s = 0; s < 6; s++) {
        const sAng = s * (Math.PI / 3);
        const sLen = r * (0.4 + wheel.frostVisual * 0.55);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sAng - 0.2) * (sLen * 0.4), Math.sin(sAng - 0.2) * (sLen * 0.4));
        ctx.lineTo(Math.cos(sAng) * sLen, Math.sin(sAng) * sLen);
        ctx.lineTo(Math.cos(sAng + 0.2) * (sLen * 0.4), Math.sin(sAng + 0.2) * (sLen * 0.4));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. Destello de impacto (Hit Flash)
    if (wheel.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(wx, wy - 8, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. HUD / Indicador Flotante sobre la Rueda
    const distToPlayer = Math.hypot(wizard.x - wx, wizard.y - wy);
    if (distToPlayer < 240 || wheel.charge > 0) {
      ctx.save();
      ctx.translate(wx, wy - 46);

      if (wheel.isCompleted) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✔ MECANISMO DESBLOQUEADO ❄️', 0, 0);
      } else {
        // Anillo de progreso semicircular
        const pct = Math.round(wheel.charge);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, -6, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, -6, 14, -Math.PI / 2, -Math.PI / 2 + (wheel.charge / 100) * Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${pct}% ❄️`, 0, -2);

        if (pct < 100 && distToPlayer < 180) {
          ctx.fillStyle = '#7dd3fc';
          ctx.font = '9px sans-serif';
          ctx.fillText('DISPARA HIELO', 0, 14);
        }
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // CAPA 2 (Y-SORTED): Portón Colosal de Hierro con Rejas Levadizas
  private static drawGateDoor(ctx: CanvasRenderingContext2D, gate: GateDoorEntity) {
    ctx.save();
    const gx = gate.x;
    const gy = gate.y;
    const w = gate.width;

    // 1. Umbral de piedra en el suelo
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(gx - w / 2, gy - 6, w, 12);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(gx - w / 2, gy - 6, w, 12);

    // 2. Rejas de hierro del portón (Se elevan según openProgress)
    const liftY = -gate.openProgress * 88;
    const barsCount = 14;
    const barSpacing = w / (barsCount + 1);

    ctx.save();
    // Recorte de visualización para que las rejas desaparezcan dentro del dintel superior
    ctx.beginPath();
    ctx.rect(gx - w / 2 - 10, gy - 120, w + 20, 140);
    ctx.clip();

    ctx.translate(0, liftY);

    // Vigas horizontales de hierro
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(gx - w / 2 + 8, gy - 75, w - 16, 10);
    ctx.fillRect(gx - w / 2 + 8, gy - 40, w - 16, 10);
    ctx.fillRect(gx - w / 2 + 8, gy - 10, w - 16, 10);

    // Remaches de hierro y barrotes verticales
    for (let i = 1; i <= barsCount; i++) {
      const bx = gx - w / 2 + i * barSpacing;
      ctx.fillStyle = '#334155';
      ctx.fillRect(bx - 3, gy - 85, 6, 85);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 3, gy - 85, 6, 85);

      // Puntas de lanza afiladas en el extremo inferior
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(bx - 5, gy);
      ctx.lineTo(bx, gy + 12);
      ctx.lineTo(bx + 5, gy);
      ctx.closePath();
      ctx.fill();

      // Remaches
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(bx - 1.5, gy - 72, 3, 3);
      ctx.fillRect(bx - 1.5, gy - 37, 3, 3);
    }

    ctx.restore(); // Fin recorte rejas

    // 3. Pilares de mampostería ciclópea a izquierda y derecha
    const drawPillar = (px: number) => {
      // Base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - 22, gy - 95, 44, 100);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(px - 22, gy - 95, 44, 100);
      // Capitel
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 26, gy - 105, 52, 14);
      ctx.strokeRect(px - 26, gy - 105, 52, 14);
      // Gárgola / Relieve
      ctx.fillStyle = gate.isOpen ? '#38bdf8' : '#ef4444';
      ctx.beginPath();
      ctx.arc(px, gy - 70, 7, 0, Math.PI * 2);
      ctx.fill();
    };

    drawPillar(gate.pillarLeftX);
    drawPillar(gate.pillarRightX);

    ctx.restore();
  }

  // CAPA DE SUELO: Suelo calcinado y cenizas para las Barreras de Fuego
  private static drawFireBarriersGround(
    ctx: CanvasRenderingContext2D,
    frustum: FrustumBounds,
    barriers: FireBarrierEntity[]
  ) {
    const squish = 0.58;
    barriers.forEach((barrier) => {
      if (!isInFrustum(barrier.x, barrier.y, barrier.width + 60, frustum)) return;

      const bx = barrier.x;
      const by = barrier.y;
      const bw = barrier.width;
      const bh = barrier.height;

      ctx.save();
      if (!barrier.isExtinguished) {
        // Suelo calcinado bajo las llamas
        ctx.fillStyle = 'rgba(20, 10, 5, 0.72)';
        ctx.beginPath();
        ctx.ellipse(bx, by, bw * 0.54, (bh + 14) * 0.54 * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Resplandor térmico de magma en el suelo
        const magmaGrad = ctx.createRadialGradient(bx, by, 10, bx, by, bw * 0.52);
        magmaGrad.addColorStop(0, 'rgba(255, 109, 0, 0.45)');
        magmaGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.22)');
        magmaGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = magmaGrad;
        ctx.beginPath();
        ctx.ellipse(bx, by, bw * 0.52, (bh + 10) * 0.52 * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fisuras de lava brillantes en el terreno
        ctx.strokeStyle = 'rgba(255, 180, 0, 0.6)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        const crackSteps = 8;
        for (let c = 0; c <= crackSteps; c++) {
          const cx = bx - bw * 0.44 + (c / crackSteps) * (bw * 0.88);
          const cy = by + (Math.sin(c * 2.2 + Date.now() * 0.002) * 5) * squish;
          if (c === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      } else {
        // Suelo de ceniza fría y hollín extinto
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.beginPath();
        ctx.ellipse(bx, by, bw * 0.52, (bh + 8) * 0.5 * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Escarcha helada y cristales disipados
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(bx, by, bw * 0.48, (bh + 4) * 0.46 * squish, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // CAPA Y-SORTED: Barrera de Fuego Llameante y Reactiva al Hielo
  private static drawFireBarrier(
    ctx: CanvasRenderingContext2D,
    barrier: FireBarrierEntity,
    wizard: { x: number; y: number }
  ) {
    ctx.save();
    const bx = barrier.x;
    const by = barrier.y;
    const bw = barrier.width;
    const squish = 0.58;
    const nowTime = Date.now() * 0.003;

    if (!barrier.isExtinguished) {
      // 1. Resplandor e iluminación ambiental de calor
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glowGrad = ctx.createRadialGradient(bx, by - 24, 20, bx, by - 24, bw * 0.55);
      glowGrad.addColorStop(0, 'rgba(255, 109, 0, 0.35)');
      glowGrad.addColorStop(0.6, 'rgba(234, 88, 12, 0.15)');
      glowGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(bx, by - 24, bw * 0.55, 60, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Columnas y lengüetas de llamas entrelazadas
      const healthRatio = Math.max(0.1, barrier.health / barrier.maxHealth);
      const isCooling = barrier.hitFlash > 0;

      barrier.flamePillars.forEach((pillar, pIdx) => {
        const px = bx + pillar.relX;
        const py = by + pillar.relY * squish;
        const flamePulse = Math.sin(nowTime * 3.5 + pillar.phaseOffset);
        const flameH = (barrier.flameHeight + flamePulse * 10) * healthRatio;
        const sway = Math.cos(nowTime * 2.8 + pillar.phaseOffset) * 5;
        const flameW = pillar.size * (0.8 + healthRatio * 0.4);

        ctx.save();

        // Gradiente vertical de la llama
        const flameGrad = ctx.createLinearGradient(px, py, px + sway, py - flameH);
        if (isCooling) {
          // Destello de escarcha/enfriamiento al ser impactada por hielo
          flameGrad.addColorStop(0, '#ffffff');
          flameGrad.addColorStop(0.35, '#bae6fd');
          flameGrad.addColorStop(0.7, '#38bdf8');
          flameGrad.addColorStop(1, '#0284c7');
        } else {
          // Fuego ardiente estándar
          flameGrad.addColorStop(0, '#ffffff');
          flameGrad.addColorStop(0.2, '#fef08a');
          flameGrad.addColorStop(0.55, '#ff6d00');
          flameGrad.addColorStop(0.85, '#ea580c');
          flameGrad.addColorStop(1, '#b91c1c');
        }

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(px - flameW, py);
        ctx.quadraticCurveTo(px - flameW * 0.5 + sway * 0.6, py - flameH * 0.55, px + sway, py - flameH);
        ctx.quadraticCurveTo(px + flameW * 0.5 + sway * 0.6, py - flameH * 0.55, px + flameW, py);
        ctx.closePath();
        ctx.fill();

        // Núcleo blanco incandescente en la base
        ctx.fillStyle = isCooling ? 'rgba(255, 255, 255, 0.85)' : 'rgba(254, 240, 138, 0.85)';
        ctx.beginPath();
        ctx.ellipse(px, py - 4, flameW * 0.45, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Ascuas y chispas flotando verticalmente
        if ((pIdx + Math.floor(nowTime * 4)) % 3 === 0) {
          const sparkY = py - flameH - ((nowTime * 40 + pillar.phaseOffset * 20) % 35);
          const sparkX = px + Math.sin(nowTime * 4 + pillar.phaseOffset) * 6;
          ctx.fillStyle = isCooling ? '#38bdf8' : '#fde047';
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Destello de impacto global al recibir daño de hielo
      if (barrier.hitFlash > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(224, 247, 250, 0.35)';
        ctx.beginPath();
        ctx.ellipse(bx, by - barrier.flameHeight * 0.4, bw * 0.5, barrier.flameHeight * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. HUD / Indicador Táctico flotante al aproximarse el mago
      const distToWizard = Math.hypot(wizard.x - bx, (wizard.y - by) / squish);
      if (distToWizard < 240 || barrier.health < barrier.maxHealth) {
        ctx.save();
        const hudY = by - barrier.flameHeight - 24;
        ctx.translate(bx, hudY);

        // Fondo oscuro translúcido
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 1.5;
        const bW = 160;
        const bH = 32;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-bW / 2, -bH / 2, bW, bH, 8);
        } else {
          ctx.rect(-bW / 2, -bH / 2, bW, bH);
        }
        ctx.fill();
        ctx.stroke();

        // Título del obstáculo
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BARRERA DE FUEGO ❄️', 0, -4);

        // Barra de salud / extinción (de Rojo fuego a Cian hielo)
        const barW = 136;
        const barH = 5;
        const barX = -barW / 2;
        const barY = 4;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(barX, barY, barW, barH);

        const fillW = Math.max(0, barW * (barrier.health / barrier.maxHealth));
        const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
        barGrad.addColorStop(0, '#ef4444');
        barGrad.addColorStop(0.5, '#f97316');
        barGrad.addColorStop(1, '#00e5ff');
        ctx.fillStyle = barGrad;
        ctx.fillRect(barX, barY, fillW, barH);

        ctx.restore();
      }
    } else {
      // Estado Extinguido: Humo tenue y cenizas frías
      const smokeAlpha = Math.max(0, (1 - barrier.extinguishProgress) * 0.6);
      if (smokeAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = smokeAlpha;
        for (let s = 0; s < 5; s++) {
          const sx = bx + (Math.sin(s * 1.5) * bw * 0.35);
          const sy = by - 14 - (s * 8);
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(sx, sy, 8 + s * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Insignia discreta de camino despejado al acercarse
      const distToWizard = Math.hypot(wizard.x - bx, (wizard.y - by) / squish);
      if (distToWizard < 180) {
        ctx.save();
        ctx.translate(bx, by - 26);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✔ FUEGO EXTINTO — PASO LIBRE', 0, 0);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // CAPA 3: CANOPY SUPERIOR (Copas de árboles con transparencia por oclusión)
  private static drawCanopyLayer(
    ctx: CanvasRenderingContext2D,
    frustum: FrustumBounds,
    trees: ForestTreeEntity[]
  ) {
    trees.forEach((tree) => {
      // Frustum culling para copas de árboles
      if (!isInFrustum(tree.x, tree.y - tree.canopyHeight, tree.canopyRadius + 30, frustum)) {
        return;
      }
      this.drawTreeCanopy(ctx, tree);
    });
  }

  private static drawTreeCanopy(ctx: CanvasRenderingContext2D, tree: ForestTreeEntity) {
    ctx.save();
    ctx.globalAlpha = tree.canopyAlpha; // 1.0 normal, 0.65 cuando el jugador pasa por debajo
    const cx = Math.round(tree.x);
    const cy = Math.round(tree.y - tree.canopyHeight);
    const r = Math.round(tree.canopyRadius);
    const OUTLINE = '#0f172a';

    // Copas de follaje escalonadas en pirámide o capas superpuestas con 3 verdes delimitados:
    // Verde sombra base (#14532D)
    // Verde medio (#15803D)
    // Puntos de luz en la cresta (#22C55E)

    // NIVEL 1 (BASE INFERIOR): Verde sombra base (#14532D)
    const baseW = Math.round(r * 2.2);
    const baseH = Math.round(r * 0.7);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(cx - baseW / 2 - 1, cy + Math.round(r * 0.1) - 1, baseW + 2, baseH + 2);
    ctx.fillStyle = '#14532d';
    ctx.fillRect(cx - baseW / 2, cy + Math.round(r * 0.1), baseW, baseH);

    // NIVEL 2 (CAPA MEDIA): Verde medio (#15803D)
    const midW = Math.round(r * 1.6);
    const midH = Math.round(r * 0.65);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(cx - midW / 2 - 1, cy - Math.round(r * 0.45) - 1, midW + 2, midH + 2);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(cx - midW / 2, cy - Math.round(r * 0.45), midW, midH);

    // NIVEL 3 (CÚSPIDE Y CRESTA): Puntos de luz en la cresta (#22C55E)
    const topW = Math.round(r * 1.0);
    const topH = Math.round(r * 0.6);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(cx - topW / 2 - 1, cy - Math.round(r * 0.95) - 1, topW + 2, topH + 2);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(cx - topW / 2, cy - Math.round(r * 0.95), topW, topH);

    // Cresta luminosa
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(cx - Math.round(topW * 0.35), cy - Math.round(r * 0.9), Math.round(topW * 0.7), 4);
    ctx.fillRect(cx - 3, cy - Math.round(r * 1.05), 6, 4);
    ctx.fillRect(cx - 1, cy - Math.round(r * 1.12), 2, 2);

    ctx.restore();
  }

  // CAPA 4: PARTÍCULAS AMBIENTALES LIGERAS (Pool de 20 hojas flotantes con deriva suave)
  private static drawAmbientLeaves(
    ctx: CanvasRenderingContext2D,
    frustum: FrustumBounds,
    leaves: AmbientLeafParticle[]
  ) {
    leaves.forEach((leaf) => {
      if (!isInFrustum(leaf.x, leaf.y, 20, frustum)) return;

      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotation);
      ctx.globalAlpha = leaf.alpha;

      ctx.fillStyle = leaf.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size, leaf.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vena central de la hoja
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-leaf.size * 0.9, 0);
      ctx.lineTo(leaf.size * 0.9, 0);
      ctx.stroke();

      ctx.restore();
    });
  }

  // =========================================================================
  // JAULA DE PILARES CONDUCTORES (RAYO + TIERRA: SUELO, VALLA VOLTAICA Y MONOLITOS)
  // =========================================================================

  // 1. Dibuja el suelo, glifos electromagnéticos, enlaces voltaicos y muros de energía de la Jaula
  private static drawConductiveCageFloor(
    ctx: CanvasRenderingContext2D,
    cages: ConductiveCageEntity[]
  ) {
    if (!cages || cages.length === 0) return;

    const squish = 0.58;

    cages.forEach((cage) => {
      if (cage.phase === 'finished') return;

      const now = Date.now();
      let cageAlpha = 1.0;
      if (cage.phase === 'erupting') {
        cageAlpha = Math.min(1.0, 0.4 + (cage.phaseTimer / cage.eruptDurationMs) * 0.6);
      } else if (cage.phase === 'collapsing') {
        cageAlpha = Math.max(0, 1.0 - cage.phaseTimer / cage.collapseDurationMs);
      }

      ctx.save();

      // A. Suelo Rúnico y Calcinación Central
      const r = cage.radius;
      const groundGrad = ctx.createRadialGradient(cage.centerX, cage.centerY, 10, cage.centerX, cage.centerY, r * 1.15);
      groundGrad.addColorStop(0, `rgba(45, 30, 10, ${0.45 * cageAlpha})`);
      groundGrad.addColorStop(0.7, `rgba(234, 179, 8, ${0.18 * cageAlpha})`);
      groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = groundGrad;
      ctx.beginPath();
      ctx.ellipse(cage.centerX, cage.centerY, r * 1.15, r * 1.15 * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // Círculo magnético perimetral rúnico en el suelo
      ctx.strokeStyle = `rgba(234, 179, 8, ${0.4 * cageAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.ellipse(cage.centerX, cage.centerY, r, r * squish, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Grietas de energía desde el centro hacia la base de cada pilar
      cage.pillars.forEach((p) => {
        ctx.strokeStyle = `rgba(253, 224, 71, ${0.65 * cageAlpha})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cage.centerX, cage.centerY);
        const midX = (cage.centerX + p.x) * 0.5 + Math.sin(now * 0.005 + p.pulseTimer) * 4;
        const midY = (cage.centerY + p.y) * 0.5 + Math.cos(now * 0.005 + p.pulseTimer) * 2;
        ctx.lineTo(midX, midY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });

      // B. Vallas y Arcos Voltaicos entre Segmentos Conectados
      if (cage.phase !== 'erupting' || cage.phaseTimer > cage.eruptDurationMs * 0.6) {
        cage.segments.forEach((seg) => {
          const p1 = cage.pillars[seg.p1Index];
          const p2 = cage.pillars[seg.p2Index];
          if (!p1 || !p2) return;

          const isDiag = seg.isDiagonal;
          const segAlpha = isDiag ? cageAlpha * 0.75 : cageAlpha;

          // B.1 Cortina o Muro de Energía Láser / Reja Voltaica translúcida
          const wallGrad = ctx.createLinearGradient(0, p1.y, 0, p1.y - p1.height);
          wallGrad.addColorStop(0, `rgba(234, 179, 8, ${0.2 * segAlpha})`);
          wallGrad.addColorStop(0.5, `rgba(56, 189, 248, ${0.16 * segAlpha})`);
          wallGrad.addColorStop(1, `rgba(254, 240, 138, ${0.32 * segAlpha})`);

          ctx.fillStyle = wallGrad;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p2.x, p2.y - p2.height * 0.9);
          ctx.lineTo(p1.x, p1.y - p1.height * 0.9);
          ctx.closePath();
          ctx.fill();

          // Líneas de escaneo horizontal sutiles en la valla
          const scanOffset = (now * 0.04) % 18;
          ctx.strokeStyle = `rgba(254, 240, 138, ${0.22 * segAlpha})`;
          ctx.lineWidth = 1;
          for (let step = 0; step < 3; step++) {
            const hRatio = ((step * 14 + scanOffset) % (p1.maxHeight || 60)) / (p1.maxHeight || 60);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y - p1.height * hRatio);
            ctx.lineTo(p2.x, p2.y - p2.height * hRatio);
            ctx.stroke();
          }

          // B.2 Arcos Eléctricos en Zig-Zag Superior e Inferior
          // Arco superior (conecta las puntas de cuarzo)
          const top1X = p1.x;
          const top1Y = p1.y - p1.height * 0.85;
          const top2X = p2.x;
          const top2Y = p2.y - p2.height * 0.85;

          ctx.strokeStyle = `rgba(234, 179, 8, ${0.85 * segAlpha})`;
          ctx.lineWidth = isDiag ? 2.0 : 2.8;
          ctx.beginPath();
          ctx.moveTo(top1X, top1Y);
          const segSteps = 5;
          for (let s = 1; s < segSteps; s++) {
            const frac = s / segSteps;
            const mx = top1X + (top2X - top1X) * frac;
            const my = top1Y + (top2Y - top1Y) * frac;
            const jitterSeed = Math.sin(now * 0.03 + s * 13 + seg.p1Index * 7);
            const jitter = jitterSeed * (isDiag ? 5 : 7);
            ctx.lineTo(mx + jitter * 0.7, my + jitter * 0.5);
          }
          ctx.lineTo(top2X, top2Y);
          ctx.stroke();

          // Núcleo blanco brillante del rayo superior
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * segAlpha})`;
          ctx.lineWidth = isDiag ? 0.9 : 1.3;
          ctx.stroke();

          // Arco inferior rasante al suelo
          const bot1Y = p1.y - 4;
          const bot2Y = p2.y - 4;
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.7 * segAlpha})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(p1.x, bot1Y);
          for (let s = 1; s < 4; s++) {
            const frac = s / 4;
            const mx = p1.x + (p2.x - p1.x) * frac;
            const my = bot1Y + (bot2Y - bot1Y) * frac;
            const jitter = Math.cos(now * 0.04 + s * 17) * 4;
            ctx.lineTo(mx, my + jitter * squish);
          }
          ctx.lineTo(p2.x, bot2Y);
          ctx.stroke();
        });
      }

      // C. Implosión Inward durante el colapso final
      if (cage.phase === 'collapsing') {
        const collapseProg = Math.min(1.0, cage.phaseTimer / cage.collapseDurationMs);
        const implosionR = Math.max(4, r * (1.0 - collapseProg));

        const implGrad = ctx.createRadialGradient(cage.centerX, cage.centerY, 1, cage.centerX, cage.centerY, implosionR);
        implGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        implGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.85)');
        implGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.5)');
        implGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = implGrad;
        ctx.beginPath();
        ctx.ellipse(cage.centerX, cage.centerY, implosionR, implosionR * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rayos convergentes hacia el centro
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI) / 3 + now * 0.01;
          const startDist = implosionR * 1.6;
          ctx.beginPath();
          ctx.moveTo(cage.centerX + Math.cos(ang) * startDist, cage.centerY + Math.sin(ang) * startDist * squish);
          ctx.lineTo(cage.centerX, cage.centerY);
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }

  // 2. Dibuja un Monolito Conductor (columna facetada de roca, vetas de cuarzo y corona eléctrica)
  private static drawConductivePillar(
    ctx: CanvasRenderingContext2D,
    pillar: ConductivePillarNode,
    cage: ConductiveCageEntity
  ) {
    const squish = 0.58;
    const now = Date.now();

    ctx.save();

    // Temblor en fase de implosión / erupción
    let shakeX = 0;
    let shakeY = 0;
    if (cage.phase === 'collapsing') {
      const shakeAmt = (cage.phaseTimer / cage.collapseDurationMs) * 4;
      shakeX = (Math.random() - 0.5) * shakeAmt;
      shakeY = (Math.random() - 0.5) * shakeAmt;
    } else if (cage.phase === 'erupting') {
      shakeX = (Math.random() - 0.5) * 2.5;
      shakeY = (Math.random() - 0.5) * 2.5;
    }

    ctx.translate(pillar.x + shakeX, pillar.y + shakeY);

    // A. Sombra proyectada en el suelo
    const baseR = pillar.radius;
    const shadowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, baseR * 1.5);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    shadowGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.35)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, baseR * 1.5, baseR * 1.5 * squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // B. Collar de grietas terrestres alrededor de la base
    pillar.crackAngles.forEach((ang) => {
      const crackLen = baseR * 1.6;
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * (baseR * 0.7), Math.sin(ang) * (baseR * 0.7) * squish);
      ctx.lineTo(Math.cos(ang) * crackLen, Math.sin(ang) * crackLen * squish);
      ctx.stroke();
    });

    const h = pillar.height;
    if (h > 4) {
      const halfW = baseR * 0.95;
      const topHalfW = baseR * 0.75;
      const topY = -h;

      // C. Prisma monolítico facetado de 3 caras visibles (Izquierda: sombra, Centro: medio, Derecha: luz)
      // Cara izquierda (sombra oscura)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-halfW, 0);
      ctx.lineTo(0, 3);
      ctx.lineTo(0, topY + 2);
      ctx.lineTo(-topHalfW, topY);
      ctx.closePath();
      ctx.fill();

      // Cara derecha (iluminación de roca)
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.lineTo(halfW, 0);
      ctx.lineTo(topHalfW, topY);
      ctx.lineTo(0, topY + 2);
      ctx.closePath();
      ctx.fill();

      // Borde de bisel central vertical
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.lineTo(0, topY + 2);
      ctx.stroke();

      // D. Vetas de Cuarzo Conductor Incrustadas (pulsantes con luz electromagnética)
      const pulseGlow = 0.6 + Math.sin(now * 0.008 + pillar.pulseTimer) * 0.35;
      ctx.strokeStyle = `rgba(253, 224, 71, ${pulseGlow})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.45, -2);
      ctx.lineTo(-halfW * 0.2, topY * 0.4);
      ctx.lineTo(-topHalfW * 0.35, topY * 0.85);
      ctx.stroke();

      ctx.strokeStyle = `rgba(56, 189, 248, ${pulseGlow * 0.9})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfW * 0.35, -2);
      ctx.lineTo(halfW * 0.5, topY * 0.5);
      ctx.lineTo(topHalfW * 0.25, topY * 0.9);
      ctx.stroke();

      // E. Capitel / Corona de Cristales de Cuarzo en la Cúspide
      const crystalTopY = topY - 14;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(0, topY + 2);
      ctx.lineTo(-topHalfW, topY);
      ctx.lineTo(0, crystalTopY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, topY + 2);
      ctx.lineTo(topHalfW, topY);
      ctx.lineTo(0, crystalTopY);
      ctx.closePath();
      ctx.fill();

      // Resplandor de corona piezoeléctrica
      const haloGrad = ctx.createRadialGradient(0, crystalTopY + 4, 1, 0, crystalTopY + 4, 18);
      haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      haloGrad.addColorStop(0.35, 'rgba(253, 224, 71, 0.7)');
      haloGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.4)');
      haloGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(0, crystalTopY + 4, 18, 0, Math.PI * 2);
      ctx.fill();

      // Chispas de descarga en la punta del monolito
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      for (let sp = 0; sp < 2; sp++) {
        const sparkAng = Math.random() * Math.PI * 2;
        const sDist1 = 3;
        const sDist2 = 9 + Math.random() * 5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(sparkAng) * sDist1, crystalTopY + 4 + Math.sin(sparkAng) * sDist1);
        ctx.lineTo(Math.cos(sparkAng + 0.3) * sDist2, crystalTopY + 4 + Math.sin(sparkAng + 0.3) * sDist2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // 3. Previsualización de retícula táctica para Jaula de Pilares Conductores
  private static drawConductiveAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;
    const targetDist = 135;
    const cx = wizard.x + Math.cos(wizard.facingAngle) * targetDist;
    const cy = wizard.y + Math.sin(wizard.facingAngle) * targetDist * squish;
    const r = isReady ? 102 : 68;

    ctx.save();
    ctx.translate(cx, cy);

    // Perímetro poligonal y postes proyectados
    const pillarPoints: Array<{ x: number; y: number }> = [];
    if (!isReady) {
      // 3 Pilares: Triángulo equilátero
      pillarPoints.push({ x: 0, y: -r * squish });
      pillarPoints.push({ x: r * Math.cos(Math.PI / 6), y: r * Math.sin(Math.PI / 6) * squish });
      pillarPoints.push({ x: -r * Math.cos(Math.PI / 6), y: r * Math.sin(Math.PI / 6) * squish });
    } else {
      // 4 Pilares: Rombo / Cuadrilátero expandido (+50% daño y arcos cruzados)
      pillarPoints.push({ x: 0, y: -r * squish });
      pillarPoints.push({ x: r, y: 0 });
      pillarPoints.push({ x: 0, y: r * squish });
      pillarPoints.push({ x: -r, y: 0 });
    }

    // Líneas perimetrales punteadas
    ctx.strokeStyle = isReady ? '#fef08a' : '#eab308';
    ctx.lineWidth = isReady ? 2.4 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    pillarPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();

    // Diagonales internas en modo cargado
    if (isReady) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(pillarPoints[0].x, pillarPoints[0].y);
      ctx.lineTo(pillarPoints[2].x, pillarPoints[2].y);
      ctx.moveTo(pillarPoints[1].x, pillarPoints[1].y);
      ctx.lineTo(pillarPoints[3].x, pillarPoints[3].y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Puntos de ubicación de los monolitos con halo
    pillarPoints.forEach((pt) => {
      ctx.fillStyle = isReady ? '#ffffff' : '#fef08a';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isReady ? 5.5 : 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isReady ? '#38bdf8' : '#eab308';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isReady ? 9 : 7, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Cruz y texto de HUD táctico flotante
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#fef08a' : '#eab308';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(
      isReady ? '¡JAULA DE 4 PILARES (+50% DAÑO)!' : 'JAULA CONDUCTORA (3 PILARES)',
      0,
      -r * squish - 14
    );

    ctx.restore();
  }

  // =========================================================================
  // PRISIÓN DE PERMAFROST (HIELO + TIERRA: SUELO, MONOLITOS Y RETÍCULA TÁCTICA)
  // =========================================================================

  // 1. Dibuja el suelo, cráter de escarcha, niebla gélida y fracturas de la Prisión de Permafrost
  private static drawPermafrostPrisonFloor(
    ctx: CanvasRenderingContext2D,
    prisons: PermafrostPrisonEntity[]
  ) {
    if (!prisons || prisons.length === 0) return;

    const squish = 0.58;

    prisons.forEach((prison) => {
      if (prison.phase === 'finished') return;

      const now = Date.now();
      let alpha = 1.0;
      if (prison.phase === 'erupting') {
        alpha = Math.min(1.0, 0.4 + (prison.phaseTimer / prison.eruptDurationMs) * 0.6);
      } else if (prison.phase === 'shattering') {
        alpha = Math.max(0, 1.0 - prison.phaseTimer / prison.shatterDurationMs);
      }

      ctx.save();

      // A. Cráter de permafrost y escarcha fría en el suelo
      const r = prison.radius;
      const groundGrad = ctx.createRadialGradient(prison.centerX, prison.centerY, 10, prison.centerX, prison.centerY, r * 1.25);
      groundGrad.addColorStop(0, `rgba(0, 229, 255, ${0.28 * alpha})`);
      groundGrad.addColorStop(0.5, `rgba(2, 132, 199, ${0.16 * alpha})`);
      groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = groundGrad;
      ctx.beginPath();
      ctx.ellipse(prison.centerX, prison.centerY, r * 1.25, r * 1.25 * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // Anillo perimetral de escarcha y barrera cristalina
      ctx.strokeStyle = `rgba(128, 216, 255, ${0.55 * alpha})`;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(prison.centerX, prison.centerY, r, r * squish, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Grietas de hielo desde el centro hacia cada monolito activo
      prison.monoliths.forEach((m) => {
        if (m.shattered) return;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 * alpha})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(prison.centerX, prison.centerY);
        const midX = (prison.centerX + m.x) * 0.5 + Math.sin(now * 0.006 + m.angles[0]) * 3;
        const midY = (prison.centerY + m.y) * 0.5 + Math.cos(now * 0.006 + m.angles[0]) * 1.5;
        ctx.lineTo(midX, midY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        // Núcleo cian de la grieta
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.9 * alpha})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      });

      // Niebla de vaho helado flotando sobre el suelo
      const mistPulse = Math.sin(now * 0.003) * 4;
      const mistGrad = ctx.createRadialGradient(prison.centerX, prison.centerY, 1, prison.centerX, prison.centerY, (r * 0.75) + mistPulse);
      mistGrad.addColorStop(0, `rgba(224, 247, 250, ${0.2 * alpha})`);
      mistGrad.addColorStop(1, 'rgba(224, 247, 250, 0)');
      ctx.fillStyle = mistGrad;
      ctx.beginPath();
      ctx.ellipse(prison.centerX, prison.centerY, (r * 0.75) + mistPulse, ((r * 0.75) + mistPulse) * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  // 2. Dibuja un Monolito de Permafrost (roca angular oscura revestida de permafrost cristalino y fracturas)
  private static drawPermafrostMonolith(
    ctx: CanvasRenderingContext2D,
    mono: PermafrostMonolithNode,
    prison: PermafrostPrisonEntity
  ) {
    const squish = 0.58;
    const now = Date.now();

    ctx.save();

    // Temblor al recibir impactos o al detonar
    let shakeX = 0;
    let shakeY = 0;
    if (mono.hitFlash > 0) {
      shakeX = (Math.random() - 0.5) * 3;
      shakeY = (Math.random() - 0.5) * 3;
    } else if (mono.shattered) {
      const shakeAmt = (mono.shatterTimer / prison.shatterDurationMs) * 7;
      shakeX = (Math.random() - 0.5) * shakeAmt;
      shakeY = (Math.random() - 0.5) * shakeAmt;
    }

    ctx.translate(mono.x + shakeX, mono.y + shakeY);

    // A. Sombra proyectada en el suelo
    const baseR = mono.radius;
    const shadowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, baseR * 1.5);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    shadowGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.35)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, baseR * 1.5, baseR * 1.5 * squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // B. Collar de estacas de hielo en la base
    mono.angles.forEach((ang) => {
      const spkLen = baseR * 1.45;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * (baseR * 0.7), Math.sin(ang) * (baseR * 0.7) * squish);
      ctx.lineTo(Math.cos(ang) * spkLen, Math.sin(ang) * spkLen * squish);
      ctx.stroke();
    });

    const h = mono.height;
    if (h > 4) {
      const halfW = baseR * 0.95;
      const topHalfW = baseR * 0.72;
      const topY = -h;

      // C. Núcleo de Roca Angular (Pizarra oscura)
      // Cara izquierda (sombra profunda)
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.moveTo(-halfW, 0);
      ctx.lineTo(0, 3);
      ctx.lineTo(0, topY + 2);
      ctx.lineTo(-topHalfW, topY);
      ctx.closePath();
      ctx.fill();

      // Cara derecha (roca iluminada)
      ctx.fillStyle = '#455a64';
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.lineTo(halfW, 0);
      ctx.lineTo(topHalfW, topY);
      ctx.lineTo(0, topY + 2);
      ctx.closePath();
      ctx.fill();

      // D. Coraza Exterior de Permafrost Translúcido (Placas de hielo cristalino)
      // Capa de hielo izquierda
      ctx.fillStyle = 'rgba(0, 229, 255, 0.42)';
      ctx.beginPath();
      ctx.moveTo(-halfW - 2, 0);
      ctx.lineTo(0, 4);
      ctx.lineTo(0, topY);
      ctx.lineTo(-topHalfW - 2, topY - 2);
      ctx.closePath();
      ctx.fill();

      // Capa de hielo derecha
      ctx.fillStyle = 'rgba(128, 216, 255, 0.65)';
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(halfW + 2, 0);
      ctx.lineTo(topHalfW + 2, topY - 2);
      ctx.lineTo(0, topY);
      ctx.closePath();
      ctx.fill();

      // Aristas afiladas de permafrost brillante
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(0, topY);
      ctx.moveTo(-halfW - 2, 0);
      ctx.lineTo(-topHalfW - 2, topY - 2);
      ctx.moveTo(halfW + 2, 0);
      ctx.lineTo(topHalfW + 2, topY - 2);
      ctx.stroke();

      // E. Cúspide Glacial Afilada (Corona de hielo y roca)
      const tipY = topY - 14;
      ctx.fillStyle = '#80d8ff';
      ctx.beginPath();
      ctx.moveTo(0, topY);
      ctx.lineTo(-topHalfW - 2, topY - 2);
      ctx.lineTo(0, tipY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, topY);
      ctx.lineTo(topHalfW + 2, topY - 2);
      ctx.lineTo(0, tipY);
      ctx.closePath();
      ctx.fill();

      // Destello de corona gélida
      const coronaGrad = ctx.createRadialGradient(0, tipY + 4, 1, 0, tipY + 4, 16);
      coronaGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coronaGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.7)');
      coronaGrad.addColorStop(0.8, 'rgba(2, 132, 199, 0.35)');
      coronaGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(0, tipY + 4, 16, 0, Math.PI * 2);
      ctx.fill();

      // F. Grietas Progresivas de Daño / Desgaste
      if (mono.hp < mono.maxHp) {
        const crackPct = Math.max(0, Math.min(1.0, 1.0 - mono.hp / mono.maxHp));
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-halfW * 0.6, topY * 0.25);
        ctx.lineTo(-halfW * 0.1, topY * (0.45 * crackPct));
        ctx.lineTo(-halfW * 0.45, topY * (0.75 * crackPct));
        ctx.moveTo(halfW * 0.5, topY * 0.3);
        ctx.lineTo(halfW * 0.15, topY * (0.6 * crackPct));
        ctx.lineTo(halfW * 0.4, topY * (0.85 * crackPct));
        ctx.stroke();

        // Barra de vida táctica flotante sobre el monolito
        const barW = 26;
        const barH = 3.5;
        const barY = tipY - 8;
        const hpRatio = Math.max(0, mono.hp / mono.maxHp);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

        ctx.fillStyle = hpRatio > 0.5 ? '#00e5ff' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);
      }

      // G. Destello de Impacto (Hit Flash)
      if (mono.hitFlash > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.moveTo(-halfW - 2, 0);
        ctx.lineTo(halfW + 2, 0);
        ctx.lineTo(topHalfW + 2, topY - 2);
        ctx.lineTo(0, tipY);
        ctx.lineTo(-topHalfW - 2, topY - 2);
        ctx.closePath();
        ctx.fill();
      }

      // H. Emisión de Vaho Frío (Ralentización táctica visual)
      const mistOffset = Math.sin(now * 0.005 + mono.angles[1]) * 3;
      ctx.fillStyle = 'rgba(224, 247, 250, 0.18)';
      ctx.beginPath();
      ctx.arc(-halfW - 4, -h * 0.3 + mistOffset, 6, 0, Math.PI * 2);
      ctx.arc(halfW + 4, -h * 0.4 - mistOffset, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 3. Previsualización de retícula táctica para Prisión de Permafrost
  private static drawPermafrostAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;
    const targetDist = 135;
    const cx = wizard.x + Math.cos(wizard.facingAngle) * targetDist;
    const cy = wizard.y + Math.sin(wizard.facingAngle) * targetDist * squish;
    const r = isReady ? 90 : 64;

    ctx.save();
    ctx.translate(cx, cy);

    // Vértices proyectados de los monolitos de permafrost
    const points: Array<{ x: number; y: number }> = [];
    if (!isReady) {
      // 4 Monolitos: Rombo / Cuadrado circunscrito
      points.push({ x: 0, y: -r * squish });
      points.push({ x: r, y: 0 });
      points.push({ x: 0, y: r * squish });
      points.push({ x: -r, y: 0 });
    } else {
      // 6 Monolitos: Hexágono regular expandido (+50% daño/salud)
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3 - Math.PI / 2;
        points.push({
          x: r * Math.cos(ang),
          y: r * Math.sin(ang) * squish,
        });
      }
    }

    // Perímetro poligonal punteado
    ctx.strokeStyle = isReady ? '#80d8ff' : '#00e5ff';
    ctx.lineWidth = isReady ? 2.4 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Marcadores glacio-tectónicos en cada monolito proyectado
    points.forEach((pt) => {
      ctx.fillStyle = isReady ? '#ffffff' : '#80d8ff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isReady ? 5.5 : 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isReady ? '#00e5ff' : '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isReady ? 9 : 7, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Texto de HUD táctico flotante
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#80d8ff' : '#00e5ff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(
      isReady ? '¡PRISIÓN 6P (+50% DAÑO/VIDA)! ❄️🌍' : 'PRISIÓN DE PERMAFROST (4 MONOLITOS)',
      0,
      -r * squish - 14
    );

    ctx.restore();
  }

  // =========================================================================
  // TORNADO DE PLASMA (FUEGO + RAYO: SUELO, VÓRTICE MÓVIL Y RETÍCULA TÁCTICA)
  // =========================================================================

  // 1. Dibuja el remolino de succión en el suelo, marcas de calcinación y onda de choque
  private static drawPlasmaTornadoGround(
    ctx: CanvasRenderingContext2D,
    tornadoes: PlasmaTornadoEntity[]
  ) {
    if (!tornadoes || tornadoes.length === 0) return;

    const squish = 0.58;

    tornadoes.forEach((t) => {
      if (t.phase === 'finished') return;

      const now = Date.now();
      ctx.save();
      ctx.translate(t.x, t.y);

      // A. Succión gravitatoria en el suelo
      if (t.phase === 'moving' || t.phase === 'collapsing') {
        const suctionR = t.suctionRadius;
        const groundGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, suctionR);
        groundGrad.addColorStop(0, 'rgba(255, 109, 0, 0.45)');
        groundGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.22)');
        groundGrad.addColorStop(0.8, 'rgba(124, 77, 255, 0.1)');
        groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = groundGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, suctionR, suctionR * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brazos en espiral convergentes en el suelo
        ctx.lineWidth = 1.6;
        for (let b = 0; b < 3; b++) {
          const armBaseAng = (b * Math.PI * 2) / 3 + now * 0.008;
          ctx.strokeStyle = b % 2 === 0 ? 'rgba(255, 234, 0, 0.5)' : 'rgba(0, 229, 255, 0.5)';
          ctx.beginPath();
          for (let st = 0; st <= 10; st++) {
            const frac = st / 10;
            const curR = suctionR * (1 - frac * 0.85);
            const curAng = armBaseAng + frac * 2.2;
            const px = Math.cos(curAng) * curR;
            const py = Math.sin(curAng) * curR * squish;
            if (st === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      }

      // B. Anillo de onda de choque de plasma en el suelo al detonar
      if (t.phase === 'detonating') {
        const prog = Math.min(1.0, t.phaseTimer / t.detonateDurationMs);
        const maxDetonateR = (t.isCharged ? 98 : 70) * (0.3 + 0.7 * Math.sin(prog * Math.PI * 0.5));
        const alpha = Math.max(0, 1.0 - prog);

        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 3.5 * (1.0 - prog * 0.6);
        ctx.beginPath();
        ctx.ellipse(0, 0, maxDetonateR, maxDetonateR * squish, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 109, 0, ${alpha * 0.8})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(0, 0, maxDetonateR * 0.75, maxDetonateR * 0.75 * squish, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  // 2. Dibuja el cuerpo tridimensional del Tornado de Plasma (embudo de fuego/plasma con elipses apiladas y relámpagos)
  private static drawPlasmaTornadoBody(
    ctx: CanvasRenderingContext2D,
    t: PlasmaTornadoEntity
  ) {
    const squish = 0.58;
    const now = Date.now();
    const scale = t.scale;

    ctx.save();
    ctx.translate(t.x, t.y);

    // FASE A: VÓRTICE EN MOVIMIENTO
    if (t.phase === 'moving') {
      const levels = 6;
      const totalHeight = 72 * scale;

      // Dibujar los niveles elípticos apilados desde el suelo hasta la cúspide
      for (let l = 0; l < levels; l++) {
        const frac = l / (levels - 1);
        const curY = -frac * totalHeight;
        const curR = (10 + frac * 26) * scale;
        const waveOffset = Math.sin(now * 0.015 + l * 0.8) * (3.0 * scale);
        const rotAng = now * 0.02 + l * 0.5;

        ctx.save();
        ctx.translate(waveOffset, curY);
        ctx.rotate(rotAng);

        const ringGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, curR);
        ringGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        ringGrad.addColorStop(0.3, 'rgba(0, 229, 255, 0.8)');
        ringGrad.addColorStop(0.65, 'rgba(255, 109, 0, 0.75)');
        ringGrad.addColorStop(0.9, 'rgba(124, 77, 255, 0.6)');
        ringGrad.addColorStop(1, 'rgba(255, 109, 0, 0)');

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, curR, curR * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = l % 2 === 0 ? 'rgba(255, 234, 0, 0.75)' : 'rgba(0, 229, 255, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.restore();
      }

      // Relámpagos helicoidales que serpentean por la columna
      for (let arc = 0; arc < 2; arc++) {
        const arcPhase = now * 0.018 + arc * Math.PI;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        for (let step = 0; step < 5; step++) {
          const sFrac = step / 4;
          const sY = -sFrac * totalHeight;
          const sR = (11 + sFrac * 25) * scale;
          const sAng = arcPhase + sFrac * Math.PI * 2;
          const sJitter = (Math.random() - 0.5) * 4;
          const px = Math.cos(sAng) * sR + sJitter;
          const py = sY + Math.sin(sAng) * (sR * squish) + sJitter;

          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    }
    // FASE B: COLAPSO E IMPLOSIÓN
    else if (t.phase === 'collapsing') {
      const prog = Math.min(1.0, t.phaseTimer / t.collapseDurationMs);
      const contractScale = Math.max(0.15, (1.0 - prog) * scale);
      const coreR = 24 * contractScale;

      const collapseGrad = ctx.createRadialGradient(0, -coreR * 0.5, 1, 0, -coreR * 0.5, coreR * 1.5);
      collapseGrad.addColorStop(0, '#ffffff');
      collapseGrad.addColorStop(0.4, '#00e5ff');
      collapseGrad.addColorStop(0.8, '#ff6d00');
      collapseGrad.addColorStop(1, 'rgba(255, 109, 0, 0)');

      ctx.fillStyle = collapseGrad;
      ctx.beginPath();
      ctx.ellipse(0, -coreR * 0.5, coreR * 1.5, coreR * 1.5 * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rayos de sobrecalentamiento inward
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + now * 0.02;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (coreR * 2.2), -coreR * 0.5 + Math.sin(ang) * (coreR * 2.2) * squish);
        ctx.lineTo(0, -coreR * 0.5);
        ctx.stroke();
      }
    }
    // FASE C: DETONACIÓN TERMINAL DE PLASMA
    else if (t.phase === 'detonating') {
      const prog = Math.min(1.0, t.phaseTimer / t.detonateDurationMs);
      const blastR = (t.isCharged ? 98 : 70) * Math.sin(prog * Math.PI * 0.5);
      const alpha = Math.max(0, 1.0 - prog);

      const blastGrad = ctx.createRadialGradient(0, -12, 1, 0, -12, blastR);
      blastGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`);
      blastGrad.addColorStop(0.35, `rgba(0, 229, 255, ${alpha * 0.85})`);
      blastGrad.addColorStop(0.7, `rgba(255, 109, 0, ${alpha * 0.6})`);
      blastGrad.addColorStop(1, 'rgba(255, 109, 0, 0)');

      ctx.fillStyle = blastGrad;
      ctx.beginPath();
      ctx.ellipse(0, -12, blastR, blastR * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // Descargas radiales bifurcadas de remate
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.8;
      for (let b = 0; b < 6; b++) {
        const bAng = (b * Math.PI) / 3 + t.swirlAngle;
        const bDist = blastR * 0.95;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        const midX = Math.cos(bAng + 0.15) * (bDist * 0.5);
        const midY = -12 + Math.sin(bAng + 0.15) * (bDist * 0.5) * squish;
        const endX = Math.cos(bAng) * bDist;
        const endY = -12 + Math.sin(bAng) * bDist * squish;
        ctx.lineTo(midX, midY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // 3. Previsualización de retícula táctica y trayectoria para Tornado de Plasma
  private static drawPlasmaTornadoAimTrajectory(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;
    const travelDist = 280;
    const ang = wizard.facingAngle;
    const destX = wizard.x + Math.cos(ang) * travelDist;
    const destY = wizard.y + Math.sin(ang) * travelDist * squish;
    const destR = isReady ? 98 : 70;

    ctx.save();

    // Línea de trayectoria direccional del tornado
    ctx.strokeStyle = isReady ? '#00e5ff' : '#ff6d00';
    ctx.lineWidth = isReady ? 2.6 : 1.8;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(wizard.x, wizard.y);
    ctx.lineTo(destX, destY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Círculo de detonación terminal proyectado
    ctx.strokeStyle = isReady ? '#00e5ff' : '#ffea00';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(destX, destY, destR, destR * squish, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Pulso central en el destino
    ctx.fillStyle = isReady ? '#ffffff' : '#00e5ff';
    ctx.beginPath();
    ctx.arc(destX, destY, isReady ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Texto de HUD táctico flotante sobre el destino
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#00e5ff' : '#ffea00';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(
      isReady ? '¡TORNADO SOBRECARGADO (+50% DAÑO/ÁREA)! 🌪️⚡' : 'TORNADO DE PLASMA (AVANCE Y SUCCIÓN)',
      destX,
      destY - destR * squish - 14
    );

    ctx.restore();
  }

  // LLUVIA DEL INFIERNO (FUEGO + FUEGO + FUEGO)
  // 1. Suelo, sombras balísticas, advertencias y cráteres de magma
  private static drawHellRainGround(ctx: CanvasRenderingContext2D, hellRains: HellRainEntity[]) {
    const squish = 0.58;
    const nowTime = Date.now() * 0.003;

    hellRains.forEach((rain) => {
      // 1.1 Resplandor e indicador de zona general del bombardeo
      ctx.save();
      const zoneR = rain.areaRadius;
      ctx.fillStyle = rain.isCharged ? 'rgba(255, 61, 0, 0.12)' : 'rgba(255, 109, 0, 0.08)';
      ctx.beginPath();
      ctx.ellipse(rain.centerX, rain.centerY, zoneR, zoneR * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = rain.isCharged ? 'rgba(255, 61, 0, 0.38)' : 'rgba(255, 109, 0, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(rain.centerX, rain.centerY, zoneR, zoneR * squish, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 1.2 Cráteres de magma ardiente dejados por meteoritos tras impactar
      rain.craters.forEach((crater) => {
        const cx = crater.x;
        const cy = crater.y;
        const cr = crater.radius;
        const progress = 1.0 - Math.max(0, crater.lifeTimerMs / crater.maxLifeMs); // 0 (recién creado) a 1 (disipado)
        const alpha = Math.max(0, 1.0 - Math.pow(progress, 2.2));

        ctx.save();
        ctx.globalAlpha = alpha;

        // Base de roca volcánica oscura calcinada
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.ellipse(cx, cy, cr * 1.15, cr * 1.15 * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Magma fundido interior (se enfría de amarillo brillante a basalto oscuro)
        const magmaGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, cr);
        if (progress < 0.65) {
          magmaGrad.addColorStop(0, '#ffffff');
          magmaGrad.addColorStop(0.25, '#fde047');
          magmaGrad.addColorStop(0.65, '#ea580c');
          magmaGrad.addColorStop(1, '#7f1d1d');
        } else {
          magmaGrad.addColorStop(0, '#f97316');
          magmaGrad.addColorStop(0.5, '#7f1d1d');
          magmaGrad.addColorStop(1, '#292524');
        }

        ctx.fillStyle = magmaGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cr, cr * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fisuras incandescentes en el borde del cráter
        ctx.strokeStyle = progress < 0.6 ? '#fef08a' : '#ea580c';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + nowTime * 0.4;
          const r1 = cr * 0.4;
          const r2 = cr * 0.95;
          ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * squish);
          ctx.lineTo(cx + Math.cos(a + 0.2) * r2, cy + Math.sin(a + 0.2) * r2 * squish);
        }
        ctx.stroke();

        // Pavesas y ascuas flotando verticalmente sobre el cráter
        if (progress < 0.85 && Math.random() < 0.35) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkDist = Math.random() * cr * 0.7;
          const sparkX = cx + Math.cos(sparkAngle) * sparkDist;
          const sparkY = cy + Math.sin(sparkAngle) * sparkDist * squish - ((nowTime * 25) % 20);
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 1.3 Sombras proyectadas y círculos de advertencia de meteoritos en vuelo
      rain.meteors.forEach((meteor) => {
        if (meteor.hasImpacted) return;
        if (rain.elapsedMs < meteor.delayMs) return;

        const tx = meteor.targetX;
        const ty = meteor.targetY;
        const r = meteor.impactRadius;
        const t = Math.min(1.0, meteor.flightProgress); // 0.0 a 1.0

        ctx.save();

        // Círculo de advertencia rojo pulsante en el suelo
        ctx.strokeStyle = meteor.isColossal ? '#ef4444' : '#f97316';
        ctx.lineWidth = meteor.isColossal ? 2.6 : 1.8;
        ctx.beginPath();
        ctx.ellipse(tx, ty, r, r * squish, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Relleno de advertencia
        ctx.fillStyle = meteor.isColossal ? 'rgba(239, 68, 68, 0.25)' : 'rgba(249, 115, 22, 0.16)';
        ctx.beginPath();
        ctx.ellipse(tx, ty, r, r * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sombra proyectada que se expande y oscurece a medida que el bólido se acerca al suelo
        const shadowRadius = r * (0.35 + 0.65 * t);
        const shadowAlpha = 0.25 + 0.65 * t;
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(tx, ty, shadowRadius, shadowRadius * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
    });
  }

  // 2. Cuerpo del meteorito en vuelo (Y-Sorting con perspectiva 2.5D)
  private static drawHellMeteorBody(ctx: CanvasRenderingContext2D, meteor: HellMeteorInstance) {
    const mx = meteor.currentX;
    const my = meteor.currentY;
    const bodyR = meteor.isColossal ? 22 : 13;

    // Vector de trayectoria en caída (desde arriba-izquierda hacia el destino en el suelo)
    const fallAngle = Math.atan2(meteor.targetY - meteor.startY, meteor.targetX - meteor.startX);
    const tailAngle = fallAngle + Math.PI;

    ctx.save();
    ctx.translate(mx, my);

    // 2.1 Estela de fuego y humo trailing backwards
    ctx.save();
    ctx.rotate(tailAngle);

    const tailLen = meteor.isColossal ? 105 : 68;
    const tailW = bodyR * 1.35;

    const tailGrad = ctx.createLinearGradient(0, 0, tailLen, 0);
    tailGrad.addColorStop(0, '#ffffff');
    tailGrad.addColorStop(0.2, '#fde047');
    tailGrad.addColorStop(0.55, '#ff6d00');
    tailGrad.addColorStop(0.85, '#dc2626');
    tailGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');

    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(0, -tailW);
    ctx.lineTo(tailLen, 0);
    ctx.lineTo(0, tailW);
    ctx.closePath();
    ctx.fill();

    // Núcleo de llama blanca interior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(0, -tailW * 0.45);
    ctx.lineTo(tailLen * 0.48, 0);
    ctx.lineTo(0, tailW * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 2.2 Resplandor radial de alta temperatura
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, bodyR * 2.8);
    auraGrad.addColorStop(0, '#ffffff');
    auraGrad.addColorStop(0.4, '#ff9100');
    auraGrad.addColorStop(0.8, '#d50000');
    auraGrad.addColorStop(1, 'rgba(213, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, bodyR * 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2.3 Núcleo rocoso incandescente irregular
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    const vertices = 8;
    for (let i = 0; i < vertices; i++) {
      const vAng = (i * Math.PI * 2) / vertices;
      const vDist = bodyR * (0.8 + ((i % 3 === 0) ? 0.35 : -0.15));
      const vx = Math.cos(vAng) * vDist;
      const vy = Math.sin(vAng) * vDist;
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();

    // Fracturas ígneas doradas en la roca
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-bodyR * 0.4, -bodyR * 0.3);
    ctx.lineTo(0, bodyR * 0.2);
    ctx.lineTo(bodyR * 0.4, -bodyR * 0.2);
    ctx.stroke();

    ctx.restore();
  }

  // 3. Previsualización de retícula táctica para Lluvia del Infierno
  private static drawHellRainAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;
    const targetDist = 180;
    const ang = wizard.facingAngle;
    const destX = wizard.x + Math.cos(ang) * targetDist;
    const destY = wizard.y + Math.sin(ang) * targetDist * squish;
    const areaRadius = isReady ? 190 : 150;

    ctx.save();

    // Línea de orientación hacia el epicentro del bombardeo
    ctx.strokeStyle = isReady ? '#ff3d00' : '#f97316';
    ctx.lineWidth = isReady ? 2.5 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(wizard.x, wizard.y);
    ctx.lineTo(destX, destY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Área general de impacto de la Lluvia
    ctx.strokeStyle = isReady ? '#ff3d00' : '#ea580c';
    ctx.lineWidth = isReady ? 2.8 : 2.0;
    ctx.beginPath();
    ctx.ellipse(destX, destY, areaRadius, areaRadius * squish, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Relleno de advertencia ígnea
    ctx.fillStyle = isReady ? 'rgba(255, 61, 0, 0.16)' : 'rgba(234, 88, 12, 0.1)';
    ctx.beginPath();
    ctx.ellipse(destX, destY, areaRadius, areaRadius * squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // Marcador central (donde caerá el megameteorito colosal si está cargado)
    const centerR = isReady ? 76 : 42;
    ctx.strokeStyle = isReady ? '#ffd600' : '#f59e0b';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(destX, destY, centerR, centerR * squish, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glifo central
    ctx.fillStyle = isReady ? '#ffd600' : '#ff3d00';
    ctx.beginPath();
    ctx.arc(destX, destY, isReady ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();

    // Texto de HUD táctico flotante
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#ffd600' : '#ff9100';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.fillText(
      isReady
        ? '¡FURIA CÓSMICA (+50% DAÑO · 6 METEORITOS + COLOSAL)! ☄️🔥'
        : 'LLUVIA DEL INFIERNO (4 METEORITOS EN SALVA) ☄️',
      destX,
      destY - areaRadius * squish - 14
    );

    ctx.restore();
  }

  // =========================================================================
  // RENDERIZADO DE TORMENTA CELESTIAL (RAYO + RAYO + RAYO - ⚡⚡⚡)
  // =========================================================================

  // 1. Suelo, auras de ionización, charcos de estática y sellos rúnicos de advertencia
  private static drawCelestialStormGround(ctx: CanvasRenderingContext2D, celestialStorms: CelestialStormEntity[]) {
    const squish = 0.58;
    const nowTime = Date.now() * 0.003;

    celestialStorms.forEach((storm) => {
      // 1.1 Indicador de perímetro y atmósfera ionizada de la tempestad
      ctx.save();
      const zoneR = storm.areaRadius;
      ctx.fillStyle = storm.isCharged ? 'rgba(0, 240, 255, 0.12)' : 'rgba(0, 240, 255, 0.07)';
      ctx.beginPath();
      ctx.ellipse(storm.centerX, storm.centerY, zoneR, zoneR * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // Perímetro eléctrico punteado
      ctx.strokeStyle = storm.isCharged ? 'rgba(0, 240, 255, 0.45)' : 'rgba(0, 240, 255, 0.28)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.ellipse(storm.centerX, storm.centerY, zoneR, zoneR * squish, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Nodos de chispas en órbita sobre el perímetro
      const nodeCount = storm.isCharged ? 6 : 4;
      for (let n = 0; n < nodeCount; n++) {
        const nAng = nowTime * (n % 2 === 0 ? 0.7 : -0.7) + (n * Math.PI * 2) / nodeCount;
        const nx = storm.centerX + Math.cos(nAng) * zoneR;
        const ny = storm.centerY + Math.sin(nAng) * zoneR * squish;
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(nx, ny, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 1.2 Charcos de estática residual ionizada dejados tras cada rayo
      storm.puddles.forEach((puddle) => {
        const px = puddle.x;
        const py = puddle.y;
        const pr = puddle.radius;
        const progress = 1.0 - Math.max(0, puddle.lifeTimerMs / puddle.maxLifeMs);
        const alpha = Math.max(0, 1.0 - Math.pow(progress, 2.0));

        ctx.save();
        ctx.globalAlpha = alpha;

        // Base brillante del charco de estática
        const puddleGrad = ctx.createRadialGradient(px, py, 1, px, py, pr);
        puddleGrad.addColorStop(0, '#ffffff');
        puddleGrad.addColorStop(0.28, '#00f0ff');
        puddleGrad.addColorStop(0.68, '#3b82f6');
        puddleGrad.addColorStop(1, 'rgba(30, 27, 75, 0)');

        ctx.fillStyle = puddleGrad;
        ctx.beginPath();
        ctx.ellipse(px, py, pr, pr * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Líneas de crackling y estática en la superficie
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let l = 0; l < 4; l++) {
          const lAng = (l * Math.PI) / 2 + nowTime * 2.5;
          const lr1 = pr * 0.2;
          const lr2 = pr * 0.85;
          const lx1 = px + Math.cos(lAng) * lr1;
          const ly1 = py + Math.sin(lAng) * lr1 * squish;
          const lx2 = px + Math.cos(lAng + 0.3) * lr2;
          const ly2 = py + Math.sin(lAng + 0.3) * lr2 * squish;
          ctx.moveTo(lx1, ly1);
          ctx.lineTo(lx2, ly2);
        }
        ctx.stroke();

        // Chispas ascendentes desde el charco
        if (Math.random() < 0.3) {
          const sAng = Math.random() * Math.PI * 2;
          const sDist = Math.random() * pr * 0.7;
          const sx = px + Math.cos(sAng) * sDist;
          const sy = py + Math.sin(sAng) * sDist * squish - ((nowTime * 35) % 18);
          ctx.fillStyle = '#00f0ff';
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 1.3 Arcos secundarios conectando charcos adyacentes si están cerca (< 85px)
      const puddles = storm.puddles;
      for (let i = 0; i < puddles.length; i++) {
        for (let j = i + 1; j < puddles.length; j++) {
          const pA = puddles[i];
          const pB = puddles[j];
          const dist = Math.hypot(pA.x - pB.x, (pA.y - pB.y) / squish);
          if (dist < 85 && Math.random() < 0.75) {
            ctx.save();
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            const midX = (pA.x + pB.x) / 2 + (Math.random() - 0.5) * 12;
            const midY = (pA.y + pB.y) / 2 + (Math.random() - 0.5) * 8;
            ctx.lineTo(midX, midY);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(midX, midY);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 1.4 Sellos rúnicos de advertencia e ionización previa al impacto
      storm.strikes.forEach((strike) => {
        if (strike.hasStruck) return;
        const warnStart = strike.delayMs - strike.warningDurationMs;
        if (storm.elapsedMs < warnStart || storm.elapsedMs >= strike.delayMs) return;

        const tx = strike.targetX;
        const ty = strike.targetY;
        const r = strike.impactRadius;
        const warnProgress = Math.min(1.0, (storm.elapsedMs - warnStart) / strike.warningDurationMs);

        ctx.save();
        ctx.globalAlpha = 0.4 + 0.6 * warnProgress;

        // Círculo exterior de advertencia eléctrico
        ctx.strokeStyle = strike.isColossal ? '#7c4dff' : '#00f0ff';
        ctx.lineWidth = strike.isColossal ? 2.5 : 1.8;
        ctx.beginPath();
        ctx.ellipse(tx, ty, r, r * squish, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Relleno suave de ionización
        ctx.fillStyle = strike.isColossal ? 'rgba(124, 77, 255, 0.22)' : 'rgba(0, 240, 255, 0.16)';
        ctx.beginPath();
        ctx.ellipse(tx, ty, r, r * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cruz rúnica central de 4 puntas
        const runeR = r * 0.65;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(tx - runeR, ty);
        ctx.lineTo(tx + runeR, ty);
        ctx.moveTo(tx, ty - runeR * squish);
        ctx.lineTo(tx, ty + runeR * squish);
        ctx.stroke();

        // Trazos de chispas que brotan del suelo verticalmente anunciando la descarga
        const sparkLines = strike.isColossal ? 6 : 4;
        for (let sp = 0; sp < sparkLines; sp++) {
          const spAng = (sp * Math.PI * 2) / sparkLines + nowTime * 3;
          const spDist = r * 0.45;
          const sx = tx + Math.cos(spAng) * spDist;
          const sy = ty + Math.sin(spAng) * spDist * squish;
          const sHeight = 12 + warnProgress * 22;

          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + (Math.random() - 0.5) * 4, sy - sHeight);
          ctx.stroke();
        }

        ctx.restore();
      });
    });
  }

  // 2. Relámpagos verticales en cascada y destellos electromagnéticos
  private static drawCelestialStormStrikes(ctx: CanvasRenderingContext2D, celestialStorms: CelestialStormEntity[]) {
    const squish = 0.58;

    celestialStorms.forEach((storm) => {
      storm.strikes.forEach((strike) => {
        if (strike.strikeProgress <= 0 || strike.strikeProgress > 1.0) return;
        if (!strike.boltSegments || strike.boltSegments.length === 0) return;

        const tx = strike.targetX;
        const ty = strike.targetY;
        const isColossal = strike.isColossal;
        const alpha = Math.max(0, 1.0 - Math.pow(strike.strikeProgress, 1.6) * 0.9);

        ctx.save();
        ctx.globalAlpha = alpha;

        // 2.1 Destello radial en el punto de contacto en el suelo
        const flareR = strike.impactRadius * (isColossal ? 1.6 : 1.3);
        const flareGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, flareR);
        flareGrad.addColorStop(0, '#ffffff');
        flareGrad.addColorStop(0.3, isColossal ? '#7c4dff' : '#00f0ff');
        flareGrad.addColorStop(0.7, '#2563eb');
        flareGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

        ctx.fillStyle = flareGrad;
        ctx.beginPath();
        ctx.ellipse(tx, ty, flareR, flareR * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2.2 Trazado del rayo vertical en 3 capas (Halo Violeta, Borde Cian y Núcleo Blanco)
        // Capa 1: Halo de sobrecarga exterior
        ctx.strokeStyle = isColossal ? 'rgba(124, 77, 255, 0.85)' : 'rgba(37, 99, 235, 0.75)';
        ctx.lineWidth = isColossal ? 26 : 13;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        strike.boltSegments.forEach((seg) => {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        });
        ctx.stroke();

        // Capa 2: Borde cian eléctrico
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = isColossal ? 14 : 6.5;
        ctx.beginPath();
        strike.boltSegments.forEach((seg) => {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        });
        ctx.stroke();

        // Capa 3: Núcleo blanco incandescente
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isColossal ? 5.5 : 2.4;
        ctx.beginPath();
        strike.boltSegments.forEach((seg) => {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        });
        ctx.stroke();

        // 2.3 Onda expansiva electromagnética del rayo colosal
        if (isColossal) {
          const waveR = strike.impactRadius * (0.6 + strike.strikeProgress * 1.8);
          ctx.strokeStyle = '#7c4dff';
          ctx.lineWidth = 3.2 * (1 - strike.strikeProgress * 0.7);
          ctx.beginPath();
          ctx.ellipse(tx, ty, waveR, waveR * squish, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });
    });
  }

  // 3. Previsualización de retícula táctica para Tormenta Celestial
  private static drawCelestialAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;
    const targetDist = 180;
    const ang = wizard.facingAngle;
    const destX = wizard.x + Math.cos(ang) * targetDist;
    const destY = wizard.y + Math.sin(ang) * targetDist * squish;
    const areaRadius = isReady ? 195 : 155;

    ctx.save();

    // Línea de orientación de relámpago
    ctx.strokeStyle = isReady ? '#7c4dff' : '#00f0ff';
    ctx.lineWidth = isReady ? 2.5 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(wizard.x, wizard.y);
    ctx.lineTo(destX, destY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Área general de la tormenta
    ctx.strokeStyle = isReady ? '#7c4dff' : '#00f0ff';
    ctx.lineWidth = isReady ? 2.8 : 2.0;
    ctx.beginPath();
    ctx.ellipse(destX, destY, areaRadius, areaRadius * squish, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Relleno de ionización
    ctx.fillStyle = isReady ? 'rgba(124, 77, 255, 0.16)' : 'rgba(0, 240, 255, 0.1)';
    ctx.beginPath();
    ctx.ellipse(destX, destY, areaRadius, areaRadius * squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // Marcador central (epicentro del rayo colosal)
    const centerR = isReady ? 74 : 38;
    ctx.strokeStyle = isReady ? '#ffffff' : '#00f0ff';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(destX, destY, centerR, centerR * squish, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glifo central
    ctx.fillStyle = isReady ? '#7c4dff' : '#00f0ff';
    ctx.beginPath();
    ctx.arc(destX, destY, isReady ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();

    // Texto de HUD táctico
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#ffffff' : '#00f0ff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.fillText(
      isReady
        ? '¡FURIA DE LA TEMPESTAD (+50% DAÑO · 6 RAYOS + COLOSAL)! ⚡🌩️'
        : 'TORMENTA CELESTIAL (4 RELÁMPAGOS EN RÁFAGA) ⚡',
      destX,
      destY - areaRadius * squish - 14
    );

    ctx.restore();
  }

  // =========================================================================
  // RENDERIZADO DE GLACIAR DEVASTADOR (HIELO + HIELO + HIELO - ❄️❄️❄️)
  // =========================================================================

  // 1. Suelo, ventisca gélida, escarcha y sombras de monolitos
  private static drawGlacierGround(ctx: CanvasRenderingContext2D, glaciers: DevastatingGlacierEntity[]) {
    const squish = 0.58;
    const nowTime = Date.now() * 0.003;

    glaciers.forEach((glacier) => {
      const cx = glacier.centerX;
      const cy = glacier.centerY;
      const r = glacier.areaRadius;

      ctx.save();

      // 1.1 Campo de escarcha y niebla ártica en el suelo
      const frostGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      frostGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      frostGrad.addColorStop(0.35, glacier.isCharged ? 'rgba(0, 229, 255, 0.22)' : 'rgba(0, 229, 255, 0.16)');
      frostGrad.addColorStop(0.75, 'rgba(2, 132, 199, 0.10)');
      frostGrad.addColorStop(1, 'rgba(0, 145, 234, 0)');

      ctx.fillStyle = frostGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // Perímetro gélido punteado
      ctx.strokeStyle = glacier.isCharged ? 'rgba(0, 229, 255, 0.55)' : 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * squish, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Corrientes huracanadas de viento gélido en espiral
      ctx.strokeStyle = 'rgba(224, 247, 250, 0.35)';
      ctx.lineWidth = 1.4;
      for (let w = 0; w < 3; w++) {
        const wAng = nowTime * 2.2 + (w * Math.PI * 2) / 3;
        const wR = r * (0.45 + w * 0.2);
        ctx.beginPath();
        ctx.ellipse(cx, cy, wR, wR * squish, wAng, 0, Math.PI * 0.85);
        ctx.stroke();
      }

      // Cristales de escarcha en los bordes del suelo
      for (let fc = 0; fc < 6; fc++) {
        const fcAng = (fc * Math.PI) / 3 + nowTime * 0.3;
        const fcDist = r * 0.88;
        const fx = cx + Math.cos(fcAng) * fcDist;
        const fy = cy + Math.sin(fcAng) * fcDist * squish;
        ctx.fillStyle = '#e0f7fa';
        ctx.beginPath();
        ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 1.2 Sombras y retículas de advertencia para monolitos cayendo
      glacier.monoliths.forEach((monolith) => {
        if (monolith.hasImpacted) {
          // Fragmentos de hielo rotos que se disuelven tras el choque
          if (monolith.shatterProgress < 1.0) {
            const shAlpha = Math.max(0, 1.0 - monolith.shatterProgress);
            ctx.save();
            ctx.globalAlpha = shAlpha;
            ctx.fillStyle = '#e0f7fa';
            for (let f = 0; f < 5; f++) {
              const fAng = (f * Math.PI * 2) / 5 + f * 0.4;
              const fDist = monolith.impactRadius * (0.3 + monolith.shatterProgress * 0.9);
              const fx = monolith.targetX + Math.cos(fAng) * fDist;
              const fy = monolith.targetY + Math.sin(fAng) * fDist * squish;
              ctx.beginPath();
              ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
          return;
        }

        const warnStart = monolith.delayMs - 160;
        if (glacier.elapsedMs < warnStart) return;

        const tx = monolith.targetX;
        const ty = monolith.targetY;
        const ir = monolith.impactRadius;
        const t = Math.min(1.0, Math.max(0, monolith.flightProgress));

        // Círculo de impacto cian en el suelo
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(tx, ty, ir, ir * squish, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 229, 255, 0.16)';
        ctx.beginPath();
        ctx.ellipse(tx, ty, ir, ir * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sombra proyectada que se contrae y oscurece al descender el monolito
        const shadowR = ir * (0.4 + 0.6 * t);
        const shadowAlpha = 0.2 + 0.65 * t;
        ctx.fillStyle = `rgba(1, 87, 155, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(tx, ty, shadowR, shadowR * squish, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    });
  }

  // 2. Monolito de hielo prismático cayendo (Y-Sorting en 2.5D)
  private static drawIceMonolithBody(ctx: CanvasRenderingContext2D, monolith: IceMonolithInstance) {
    const mx = monolith.currentX;
    const my = monolith.currentY;
    const bw = 24;
    const bh = 52;

    ctx.save();
    ctx.translate(mx, my);

    // Estela de vapor helado y copos
    ctx.fillStyle = 'rgba(224, 247, 250, 0.45)';
    for (let p = 0; p < 3; p++) {
      const px = (Math.random() - 0.5) * bw * 0.8;
      const py = -bh * 0.7 - Math.random() * 20;
      ctx.beginPath();
      ctx.arc(px, py, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Faceta lateral izquierda (sombra zafiro)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, -bh);
    ctx.lineTo(-bw * 0.5, -bh * 0.4);
    ctx.lineTo(-bw * 0.5, 0);
    ctx.lineTo(0, bh * 0.3);
    ctx.closePath();
    ctx.fill();

    // Faceta frontal derecha (luz cian glaciar)
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(0, -bh);
    ctx.lineTo(0, bh * 0.3);
    ctx.lineTo(bw * 0.5, 0);
    ctx.lineTo(bw * 0.5, -bh * 0.4);
    ctx.closePath();
    ctx.fill();

    // Tapa superior reflectante (blanco puro)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -bh);
    ctx.lineTo(-bw * 0.5, -bh * 0.4);
    ctx.lineTo(0, -bh * 0.3);
    ctx.lineTo(bw * 0.5, -bh * 0.4);
    ctx.closePath();
    ctx.fill();

    // Borde brillante de cristal
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -bh);
    ctx.lineTo(0, bh * 0.3);
    ctx.stroke();

    ctx.restore();
  }

  // 3. Agujas y cristales gigantes de la erupción radial terminal (Y-Sorting en 2.5D)
  private static drawRadialIceSpike(ctx: CanvasRenderingContext2D, cx: number, cy: number, spike: RadialIceSpike) {
    const squish = 0.58;
    const bx = cx + Math.cos(spike.angle) * spike.dist;
    const by = cy + Math.sin(spike.angle) * spike.dist * squish;
    const h = spike.height;
    const w = spike.width;

    if (h <= 1) return;

    ctx.save();

    // Faceta izquierda
    ctx.fillStyle = '#80d8ff';
    ctx.beginPath();
    ctx.moveTo(bx, by - h);
    ctx.lineTo(bx - w * 0.5, by);
    ctx.lineTo(bx, by + w * 0.25 * squish);
    ctx.closePath();
    ctx.fill();

    // Faceta derecha (luz directa)
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(bx, by - h);
    ctx.lineTo(bx, by + w * 0.25 * squish);
    ctx.lineTo(bx + w * 0.5, by);
    ctx.closePath();
    ctx.fill();

    // Cresta afilada
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(bx, by - h);
    ctx.lineTo(bx, by + w * 0.25 * squish);
    ctx.stroke();

    // Destello en la punta
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by - h, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 4. Previsualización de retícula táctica para Glaciar Devastador
  private static drawGlacierAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;
    const targetDist = 180;
    const ang = wizard.facingAngle;
    const destX = wizard.x + Math.cos(ang) * targetDist;
    const destY = wizard.y + Math.sin(ang) * targetDist * squish;
    const areaRadius = isReady ? 210 : 155;

    ctx.save();

    // Línea de orientación hacia el ojo de la ventisca
    ctx.strokeStyle = isReady ? '#ffffff' : '#00e5ff';
    ctx.lineWidth = isReady ? 2.5 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(wizard.x, wizard.y);
    ctx.lineTo(destX, destY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Área general de la ventisca
    ctx.strokeStyle = isReady ? '#ffffff' : '#00e5ff';
    ctx.lineWidth = isReady ? 2.8 : 2.0;
    ctx.beginPath();
    ctx.ellipse(destX, destY, areaRadius, areaRadius * squish, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Relleno gélido
    ctx.fillStyle = isReady ? 'rgba(224, 247, 250, 0.22)' : 'rgba(0, 229, 255, 0.12)';
    ctx.beginPath();
    ctx.ellipse(destX, destY, areaRadius, areaRadius * squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // Marcador central (epicentro de la erupción radial)
    const centerR = isReady ? 68 : 42;
    ctx.strokeStyle = isReady ? '#80d8ff' : '#00e5ff';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(destX, destY, centerR, centerR * squish, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glifo central
    ctx.fillStyle = isReady ? '#ffffff' : '#00e5ff';
    ctx.beginPath();
    ctx.arc(destX, destY, isReady ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();

    // Texto de HUD táctico
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#ffffff' : '#00e5ff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.fillText(
      isReady
        ? '¡ERA DE HIELO (+50% DAÑO · 6 MONOLITOS + REMATE CONGELANTE)! 🏔️❄️'
        : 'GLACIAR DEVASTADOR (VENTISCA Y MONOLITOS) ❄️',
      destX,
      destY - areaRadius * squish - 14
    );

    ctx.restore();
  }

  // =========================================================================
  // BARRERA TELÚRICA (TIERRA + TIERRA + TIERRA: 3 ROCAS ORBITALES CONSUMIBLES)
  // =========================================================================

  // 1. Suelo, sombras de las rocas y halo gravitatorio de la Barrera Telúrica
  private static drawTelluricGround(
    ctx: CanvasRenderingContext2D,
    barriers: TelluricBarrierEntity[]
  ) {
    if (!barriers || barriers.length === 0) return;
    const squish = 0.58;

    barriers.forEach((barrier) => {
      if (barrier.finished) return;

      const activeRocks = barrier.rocks.filter((r) => !r.destroyed);
      if (activeRocks.length === 0) return;

      // Centro de la órbita anclado al jugador
      const cx = barrier.centerX ?? (activeRocks[0]?.x || 0);
      const cy = barrier.centerY ?? (activeRocks[0]?.y || 0);

      ctx.save();

      // Halo gravitatorio orbital elíptico en el suelo
      ctx.strokeStyle = barrier.isCharged ? 'rgba(245, 158, 11, 0.42)' : 'rgba(217, 119, 6, 0.28)';
      ctx.lineWidth = barrier.isCharged ? 2.0 : 1.4;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, barrier.orbitRadiusX, barrier.orbitRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Resplandor áureo tenue en el suelo si está reforzado
      if (barrier.isCharged) {
        const floorGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, barrier.orbitRadiusX * 1.1);
        floorGrad.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
        floorGrad.addColorStop(0.7, 'rgba(217, 119, 6, 0.06)');
        floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = floorGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, barrier.orbitRadiusX * 1.1, barrier.orbitRadiusY * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sombras proyectadas de cada roca activa
      activeRocks.forEach((rock) => {
        const sRad = rock.radius * 1.35;
        const sGrad = ctx.createRadialGradient(rock.x, rock.y, 2, rock.x, rock.y, sRad);
        sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
        sGrad.addColorStop(0.65, 'rgba(30, 20, 10, 0.28)');
        sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.ellipse(rock.x, rock.y, sRad, sRad * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pequeño glifo de anclaje gravitatorio debajo de la roca
        ctx.strokeStyle = barrier.isCharged ? 'rgba(255, 213, 79, 0.35)' : 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(rock.x, rock.y, rock.radius * 0.75, rock.radius * 0.75 * squish, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.restore();
    });
  }

  // 2. Dibuja el cuerpo tridimensional facetado de una roca orbital flotante
  private static drawTelluricRockBody(
    ctx: CanvasRenderingContext2D,
    rock: TelluricRockInstance,
    barrier: TelluricBarrierEntity
  ) {
    if (rock.destroyed) return;

    const hover = Math.sin(Date.now() * 0.005 + rock.facetSeed) * 2.2;
    const drawX = rock.x;
    const drawY = rock.y - rock.height + hover;
    const r = rock.radius;
    const isCharged = barrier.isCharged;

    ctx.save();
    ctx.translate(drawX, drawY);

    // Si tiene flash de impacto de proyectil, resplandor blanco-dorado
    if (rock.hitFlash > 0) {
      ctx.shadowColor = '#fff59d';
      ctx.shadowBlur = 14;
    } else if (isCharged) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
    }

    // Generar vértices facetados pseudo-irregulares
    const numVerts = 6;
    const verts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < numVerts; i++) {
      const a = rock.rotationAngle + (i * Math.PI * 2) / numVerts;
      const seedMod = Math.sin(rock.facetSeed * 3.3 + i * 2.1) * 0.22;
      const rad = r * (1.0 + seedMod);
      verts.push({
        x: Math.cos(a) * rad,
        y: Math.sin(a) * rad * 0.9,
      });
    }

    // A. Base de roca poligonal (silueta principal)
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < numVerts; i++) {
      ctx.lineTo(verts[i].x, verts[i].y);
    }
    ctx.closePath();

    // Relleno de degradado de roca oscura (gris pizarra a marrón arcilla)
    const rockGrad = ctx.createLinearGradient(-r, -r, r, r);
    rockGrad.addColorStop(0, isCharged ? '#4e342e' : '#37474f');
    rockGrad.addColorStop(0.5, isCharged ? '#3e2723' : '#263238');
    rockGrad.addColorStop(1, '#1b120c');
    ctx.fillStyle = rockGrad;
    ctx.fill();

    // B. Facetas angulares internas (relieve 3D)
    const centerX = Math.cos(rock.rotationAngle) * (r * 0.25);
    const centerY = Math.sin(rock.rotationAngle) * (r * 0.2);

    for (let i = 0; i < numVerts; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % numVerts];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
      ctx.closePath();

      // Iluminación según orientación del triángulo facetado
      const midY = (v1.y + v2.y) / 2;
      const midX = (v1.x + v2.x) / 2;
      if (midY < centerY && midX < centerX) {
        // Cara superior-izquierda iluminada
        ctx.fillStyle = isCharged ? 'rgba(215, 204, 200, 0.28)' : 'rgba(120, 144, 156, 0.32)';
      } else if (midY > centerY && midX > centerX) {
        // Cara inferior-derecha en sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      } else {
        ctx.fillStyle = 'rgba(62, 39, 35, 0.2)';
      }
      ctx.fill();

      // Aristas facetadas
      ctx.strokeStyle = isCharged ? 'rgba(255, 213, 79, 0.35)' : 'rgba(55, 71, 79, 0.6)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // C. Borde exterior rocoso bien definido
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < numVerts; i++) {
      ctx.lineTo(verts[i].x, verts[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = isCharged ? '#ffd54f' : '#f59e0b';
    ctx.lineWidth = isCharged ? 2.2 : 1.6;
    ctx.stroke();

    // D. Vetas y Runas Doradas Incandescentes
    const runePulse = 0.6 + Math.sin(rock.pulseTimer * 3.5 + rock.facetSeed) * 0.4;
    ctx.strokeStyle = isCharged ? `rgba(255, 241, 118, ${0.85 + runePulse * 0.15})` : `rgba(255, 213, 79, ${0.7 + runePulse * 0.3})`;
    ctx.lineWidth = isCharged ? 1.8 : 1.4;
    ctx.beginPath();
    // Glifo geomántico central (rombo / runa de tierra)
    const runeSize = r * (isCharged ? 0.48 : 0.38);
    ctx.moveTo(centerX, centerY - runeSize);
    ctx.lineTo(centerX + runeSize * 0.75, centerY);
    ctx.lineTo(centerX, centerY + runeSize);
    ctx.lineTo(centerX - runeSize * 0.75, centerY);
    ctx.closePath();
    ctx.stroke();

    // Líneas secundarias de fisura áurea
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(verts[0].x * 0.75, verts[0].y * 0.75);
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(verts[3].x * 0.75, verts[3].y * 0.75);
    ctx.stroke();

    // E. Destello de blanco puro si acaba de impactar un proyectil
    if (rock.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 230, ${Math.min(0.85, rock.hitFlash / 7)})`;
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < numVerts; i++) {
        ctx.lineTo(verts[i].x, verts[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // F. Indicador de absorción reforzada (puntos de durabilidad contra proyectiles)
    if (isCharged && rock.hitPoints > 1) {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(centerX, centerY - r * 0.95, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 3. Previsualización de retícula táctica para Barrera Telúrica (órbita y runas)
  private static drawTelluricAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const orbitX = 63;
    const orbitY = 38.5;
    const now = Date.now();

    ctx.save();

    // Anillo orbital elíptico
    ctx.strokeStyle = isReady ? '#f59e0b' : '#d97706';
    ctx.lineWidth = isReady ? 2.5 : 1.6;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(wizard.x, wizard.y, orbitX, orbitY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Relleno áureo
    ctx.fillStyle = isReady ? 'rgba(245, 158, 11, 0.16)' : 'rgba(217, 119, 6, 0.08)';
    ctx.beginPath();
    ctx.ellipse(wizard.x, wizard.y, orbitX, orbitY, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 rocas holográficas girando en tiempo real en la previsualización
    const spinAngle = now * 0.0025;
    for (let i = 0; i < 3; i++) {
      const rockAng = spinAngle + (i * Math.PI * 2) / 3;
      const rx = wizard.x + Math.cos(rockAng) * orbitX;
      const ry = wizard.y + Math.sin(rockAng) * orbitY;
      const rRad = isReady ? 16 : 13;

      ctx.save();
      ctx.translate(rx, ry - 18);
      ctx.strokeStyle = isReady ? '#fde047' : '#f59e0b';
      ctx.lineWidth = 1.6;
      ctx.fillStyle = isReady ? 'rgba(245, 158, 11, 0.45)' : 'rgba(120, 53, 15, 0.35)';

      ctx.beginPath();
      ctx.rect(-rRad * 0.7, -rRad * 0.7, rRad * 1.4, rRad * 1.4);
      ctx.fill();
      ctx.stroke();

      // Runa central en la roca holográfica
      ctx.strokeStyle = '#fffbeb';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -rRad * 0.4);
      ctx.lineTo(rRad * 0.4, 0);
      ctx.lineTo(0, rRad * 0.4);
      ctx.lineTo(-rRad * 0.4, 0);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    }

    // Texto de HUD táctico
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#fef08a' : '#f59e0b';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.fillText(
      isReady
        ? '¡DENSIDAD TELÚRICA (+50% DAÑO · ABSORCIÓN REFORZADA)! 🛡️🌍'
        : 'BARRERA TELÚRICA (3 ROCAS DEFENSIVAS) 🛡️',
      wizard.x,
      wizard.y - orbitY - 14
    );

    ctx.restore();
  }

  // =========================================================================
  // VOLCÁN DE OBSIDIANA (FUEGO + HIELO + TIERRA: ERUPCIÓN Y CUCHILLAS VÍTREAS)
  // =========================================================================

  // 1. Suelo, cuenca de basalto vitrificado, fisuras de magma, vapor y columna eruptiva
  private static drawObsidianVolcanoGround(
    ctx: CanvasRenderingContext2D,
    volcanoes: ObsidianVolcanoEntity[]
  ) {
    if (!volcanoes || volcanoes.length === 0) return;
    const squish = 0.58;
    const now = Date.now();

    volcanoes.forEach((volcano) => {
      if (volcano.finished) return;

      const rx = volcano.areaRadius;
      const ry = volcano.areaRadius * squish;
      const cx = volcano.centerX;
      const cy = volcano.centerY;

      ctx.save();

      // A. Cuenca de Basalto Vitrificado (Suelo cristalizado por choque térmico)
      const basinGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rx);
      if (volcano.phase === 'fracture' || volcano.phase === 'eruption') {
        basinGrad.addColorStop(0, 'rgba(255, 87, 34, 0.45)');
        basinGrad.addColorStop(0.35, 'rgba(234, 88, 12, 0.28)');
        basinGrad.addColorStop(0.75, 'rgba(15, 23, 42, 0.35)');
        basinGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else {
        // En campo activo y fractura vítrea: suelo negro azabache espejado con borde ígneo
        basinGrad.addColorStop(0, volcano.isCharged ? 'rgba(30, 27, 75, 0.55)' : 'rgba(15, 23, 42, 0.5)');
        basinGrad.addColorStop(0.45, 'rgba(15, 23, 42, 0.42)');
        basinGrad.addColorStop(0.85, volcano.isCharged ? 'rgba(192, 38, 211, 0.22)' : 'rgba(234, 88, 12, 0.18)');
        basinGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = basinGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. Anillo perimetral de contención térmico con dientes de obsidiana
      const rimAlpha = volcano.phase === 'shattering'
        ? Math.max(0, 1 - (volcano.phaseTimer / 250)) * 0.4
        : (0.35 + Math.sin(now * 0.005) * 0.12);

      ctx.strokeStyle = volcano.isCharged
        ? `rgba(244, 63, 94, ${rimAlpha})`
        : `rgba(234, 88, 12, ${rimAlpha})`;
      ctx.lineWidth = volcano.isCharged ? 2.4 : 1.6;
      ctx.setLineDash([10, 6, 4, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // C. Fisuras Sísmicas Radiantes (grietas incandescentes que expulsan vapor)
      volcano.fissures.forEach((fissure) => {
        const radLen = fissure.length;
        const fx = cx + Math.cos(fissure.angle) * radLen;
        const fy = cy + Math.sin(fissure.angle) * (radLen * squish);
        const midX = cx + Math.cos(fissure.angle + 0.15) * (radLen * 0.55);
        const midY = cy + Math.sin(fissure.angle + 0.15) * (radLen * 0.55 * squish);

        // Resplandor exterior de magma
        ctx.strokeStyle = volcano.isCharged ? 'rgba(255, 110, 64, 0.85)' : 'rgba(249, 115, 22, 0.75)';
        ctx.lineWidth = fissure.width * (volcano.phase === 'eruption' ? 1.6 : 1.0);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(midX, midY, fx, fy);
        ctx.stroke();

        // Núcleo blanco-incandescente
        ctx.strokeStyle = '#fff7ed';
        ctx.lineWidth = Math.max(1, fissure.width * 0.4);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(midX, midY, fx, fy);
        ctx.stroke();

        // Columnitas de vapor a presión en los extremos de las grietas
        if (volcano.phase === 'fracture' || volcano.phase === 'eruption' || volcano.phase === 'active_field') {
          const steamAnim = (now * 0.003 + fissure.angle) % 1;
          const sx = fx;
          const sy = fy - steamAnim * 28;
          ctx.fillStyle = `rgba(224, 242, 254, ${(1 - steamAnim) * 0.45})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 3 + steamAnim * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // D. Columna Eruptiva Piroclástica Vertical (Fase 'eruption')
      if (volcano.phase === 'eruption') {
        const prog = volcano.eruptionProgress; // 0.0 -> 1.0
        const eruptHeight = (190 + (volcano.isCharged ? 70 : 0)) * Math.sin(prog * Math.PI);
        const eruptWidth = (rx * 0.65) * (0.55 + 0.45 * Math.sin(prog * Math.PI));

        // 1. Pluma exterior de ceniza y vapor gélido turbulento
        ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
        ctx.beginPath();
        ctx.moveTo(cx - eruptWidth * 0.9, cy);
        ctx.quadraticCurveTo(cx - eruptWidth * 1.3, cy - eruptHeight * 0.6, cx, cy - eruptHeight * 1.05);
        ctx.quadraticCurveTo(cx + eruptWidth * 1.3, cy - eruptHeight * 0.6, cx + eruptWidth * 0.9, cy);
        ctx.closePath();
        ctx.fill();

        // 2. Columna piroclástica de fuego y magma ascendente
        const magmaGrad = ctx.createLinearGradient(cx, cy, cx, cy - eruptHeight);
        magmaGrad.addColorStop(0, '#ffffff');
        magmaGrad.addColorStop(0.2, '#fed7aa');
        magmaGrad.addColorStop(0.5, '#ea580c');
        magmaGrad.addColorStop(0.85, '#dc2626');
        magmaGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.fillStyle = magmaGrad;
        ctx.beginPath();
        ctx.moveTo(cx - eruptWidth * 0.55, cy);
        ctx.quadraticCurveTo(cx - eruptWidth * 0.7, cy - eruptHeight * 0.5, cx, cy - eruptHeight);
        ctx.quadraticCurveTo(cx + eruptWidth * 0.7, cy - eruptHeight * 0.5, cx + eruptWidth * 0.55, cy);
        ctx.closePath();
        ctx.fill();

        // 3. Destello de choque térmico central (vapor blanco/cian gélido colisionando con el magma)
        const flashGrad = ctx.createRadialGradient(cx, cy - eruptHeight * 0.35, 2, cx, cy - eruptHeight * 0.35, eruptWidth * 0.75);
        flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        flashGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.75)');
        flashGrad.addColorStop(0.85, 'rgba(249, 115, 22, 0.4)');
        flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(cx, cy - eruptHeight * 0.35, eruptWidth * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // 2. Dibuja el cuerpo tridimensional facetado de una cuchilla monumental de obsidiana
  private static drawObsidianBladeBody(
    ctx: CanvasRenderingContext2D,
    blade: ObsidianBladeInstance,
    volcano: ObsidianVolcanoEntity
  ) {
    if (blade.growthProgress <= 0.05) return;

    const curH = blade.height * blade.growthProgress;
    const curW = blade.width * blade.growthProgress;
    const isCharged = volcano.isCharged;
    const isShattering = volcano.phase === 'shattering';
    const shatter = blade.shatterProgress;

    ctx.save();

    // Si está en fase de colapso, aplicamos vibración y dispersión
    let posX = blade.x;
    let posY = blade.y;
    let alpha = 1.0;

    if (isShattering && shatter > 0) {
      const shakeAmt = (1 - shatter) * 4;
      posX += (Math.random() - 0.5) * shakeAmt;
      posY += (Math.random() - 0.5) * shakeAmt;
      alpha = Math.max(0, 1 - shatter * 1.3);
    }
    ctx.globalAlpha = alpha;

    // Sombra proyectada en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(posX, posY + 2, curW * 0.65, curW * 0.35, blade.tiltAngle, 0, Math.PI * 2);
    ctx.fill();

    // Puntos geométricos de la cuchilla piramidal facetada
    const tilt = blade.tiltAngle;
    const topX = posX + Math.sin(tilt) * curH;
    const topY = posY - Math.cos(tilt) * curH;

    const baseLeftX = posX - Math.cos(tilt) * (curW * 0.5);
    const baseLeftY = posY - Math.sin(tilt) * (curW * 0.5 * 0.58);
    const baseRightX = posX + Math.cos(tilt) * (curW * 0.5);
    const baseRightY = posY + Math.sin(tilt) * (curW * 0.5 * 0.58);

    const midSpineX = posX + Math.sin(tilt) * (curH * 0.4) - Math.cos(tilt) * (curW * 0.1);
    const midSpineY = posY - Math.cos(tilt) * (curH * 0.4);

    // Cara 1: Lado Izquierdo (Sombra profunda azabache)
    const leftGrad = ctx.createLinearGradient(baseLeftX, baseLeftY, topX, topY);
    leftGrad.addColorStop(0, '#09090b');
    leftGrad.addColorStop(0.5, '#18181b');
    leftGrad.addColorStop(1, '#27272a');

    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(baseLeftX, baseLeftY);
    ctx.lineTo(midSpineX, midSpineY);
    ctx.lineTo(topX, topY);
    ctx.lineTo(posX, posY);
    ctx.closePath();
    ctx.fill();

    // Cara 2: Lado Derecho (Reflejo vítreo especular de alta reflectividad)
    const rightGrad = ctx.createLinearGradient(posX, posY, topX, topY);
    rightGrad.addColorStop(0, isCharged ? '#1e1b4b' : '#111827');
    rightGrad.addColorStop(0.4, isCharged ? '#2e1065' : '#1f2937');
    rightGrad.addColorStop(0.8, '#334155');
    rightGrad.addColorStop(1, '#94a3b8');

    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(posX, posY);
    ctx.lineTo(midSpineX, midSpineY);
    ctx.lineTo(topX, topY);
    ctx.lineTo(baseRightX, baseRightY);
    ctx.closePath();
    ctx.fill();

    // Bisel / Vena interior (en versión cargada: núcleo magmático ardiente visible bajo el vidrio negro)
    if (isCharged) {
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.75)';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(posX, posY);
      ctx.lineTo(midSpineX, midSpineY);
      ctx.lineTo(topX, topY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Arista afilada central (Reflejo de luz blanca/azul hielo)
    ctx.strokeStyle = isCharged ? '#fecdd3' : '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(baseLeftX, baseLeftY);
    ctx.lineTo(midSpineX, midSpineY);
    ctx.lineTo(topX, topY);
    ctx.lineTo(baseRightX, baseRightY);
    ctx.stroke();

    // Brillo especular dinámico que corre por el filo
    const shineTime = (Date.now() * 0.002 + blade.shinePhase) % Math.PI;
    const shineAlpha = Math.max(0, Math.sin(shineTime)) * 0.85;
    if (shineAlpha > 0.05 && !isShattering) {
      const glintX = midSpineX + (topX - midSpineX) * (shineAlpha * 0.9);
      const glintY = midSpineY + (topY - midSpineY) * (shineAlpha * 0.9);

      ctx.fillStyle = `rgba(255, 255, 255, ${shineAlpha})`;
      ctx.beginPath();
      ctx.arc(glintX, glintY, isCharged ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Destello estrellado en la punta
      ctx.strokeStyle = `rgba(255, 255, 255, ${shineAlpha * 0.9})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(topX - 4, topY);
      ctx.lineTo(topX + 4, topY);
      ctx.moveTo(topX, topY - 4);
      ctx.lineTo(topX, topY + 4);
      ctx.stroke();
    }

    // Efecto de fractura al colapsar: trozos dispersos volando
    if (isShattering && shatter > 0.15) {
      for (let sh = 0; sh < 4; sh++) {
        const shAng = (sh * Math.PI) / 2 + shatter * 2;
        const shDist = shatter * (16 + sh * 8);
        const sx = posX + Math.cos(shAng) * shDist;
        const sy = posY - curH * 0.4 + Math.sin(shAng) * shDist;
        const sSize = (1 - shatter) * (4 + (sh % 2) * 3);

        ctx.fillStyle = sh % 2 === 0 ? '#09090b' : (isCharged ? '#c026d3' : '#334155');
        ctx.beginPath();
        ctx.moveTo(sx, sy - sSize);
        ctx.lineTo(sx + sSize, sy);
        ctx.lineTo(sx, sy + sSize);
        ctx.lineTo(sx - sSize, sy);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // 3. Previsualización de retícula táctica para Volcán de Obsidiana
  private static drawObsidianAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;

    // Radio de la zona objetivo: tap ~122px, cargado ~168px (+35%)
    const baseRadius = 122;
    const targetRadius = isReady ? Math.floor(baseRadius * 1.35) : Math.floor(baseRadius * (1 + ratio * 0.35));
    const rx = targetRadius;
    const ry = targetRadius * squish;

    // Ubicación objetivo a distancia media frontal (~165px)
    const aimDist = 165;
    const tx = wizard.x + Math.cos(wizard.facingAngle) * aimDist;
    const ty = wizard.y + Math.sin(wizard.facingAngle) * aimDist;
    const now = Date.now();

    ctx.save();

    // Línea guía desde el jugador hasta el centro del volcán
    ctx.strokeStyle = isReady ? 'rgba(244, 63, 94, 0.45)' : 'rgba(234, 88, 12, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(wizard.x, wizard.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    // Relleno de advertencia en el suelo
    const aimGrad = ctx.createRadialGradient(tx, ty, 5, tx, ty, rx);
    aimGrad.addColorStop(0, isReady ? 'rgba(244, 63, 94, 0.28)' : 'rgba(234, 88, 12, 0.2)');
    aimGrad.addColorStop(0.65, isReady ? 'rgba(30, 27, 75, 0.22)' : 'rgba(15, 23, 42, 0.15)');
    aimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = aimGrad;
    ctx.beginPath();
    ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anillo exterior con rotación de runas de obsidiana
    ctx.strokeStyle = isReady ? '#f43f5e' : '#ea580c';
    ctx.lineWidth = isReady ? 2.5 : 1.8;
    ctx.setLineDash([12, 6, 4, 6]);
    ctx.beginPath();
    ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Mini-cuchillas holográficas indicando los puntos donde emergerá la obsidiana
    const bladeCount = isReady ? 10 : 7;
    for (let b = 0; b < bladeCount; b++) {
      const bAng = (b * Math.PI * 2) / bladeCount + now * 0.001;
      const bDist = rx * (0.35 + (b % 3) * 0.22);
      const bx = tx + Math.cos(bAng) * bDist;
      const by = ty + Math.sin(bAng) * (bDist * squish);

      ctx.save();
      ctx.translate(bx, by);
      ctx.strokeStyle = isReady ? '#fbcfe8' : '#fed7aa';
      ctx.fillStyle = isReady ? 'rgba(192, 38, 211, 0.45)' : 'rgba(234, 88, 12, 0.35)';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 4);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Texto de HUD táctico
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#fbcfe8' : '#fed7aa';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.fillText(
      isReady
        ? '¡FUSIÓN VÍTREA (+50% DAÑO · MAYOR RADIO · 10 CUCHILLAS DENSAS)! 🌋🖤❄️'
        : 'VOLCÁN DE OBSIDIANA (ERUPCIÓN & CUCHILLAS VÍTREAS) 🌋',
      tx,
      ty - ry - 14
    );

    ctx.restore();
  }

  // =========================================================================
  // PRISIÓN CONDUCTORA (RAYO + HIELO + TIERRA: PILARES CRIOTÉCNICOS E IMPLOSIÓN)
  // =========================================================================

  // 1. Suelo, escarcha gélida, valla voltaica perimetral e implosión central
  private static drawConductivePrisonFloor(
    ctx: CanvasRenderingContext2D,
    prisons: ConductivePrisonEntity[]
  ) {
    if (!prisons || prisons.length === 0) return;
    const squish = 0.58;
    const now = Date.now();

    prisons.forEach((prison) => {
      if (prison.phase === 'finished') return;

      const cx = prison.centerX;
      const cy = prison.centerY;
      const r = prison.radius;
      const isCharged = prison.isCharged;

      ctx.save();

      // A. Cuenca de escarcha criogénica y niebla gélida en el suelo
      const groundGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, r * 1.15);
      if (prison.phase === 'imploding') {
        // En implosión: destello central blanco-cian cegador
        const prog = Math.min(1.0, prison.phaseTimer / prison.implosionDurationMs);
        groundGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * (1 - prog)})`);
        groundGrad.addColorStop(0.35, `rgba(0, 229, 255, ${0.75 * (1 - prog)})`);
        groundGrad.addColorStop(0.75, `rgba(124, 77, 255, ${0.5 * (1 - prog)})`);
        groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        groundGrad.addColorStop(0, isCharged ? 'rgba(0, 229, 255, 0.22)' : 'rgba(0, 229, 255, 0.15)');
        groundGrad.addColorStop(0.45, isCharged ? 'rgba(124, 77, 255, 0.16)' : 'rgba(124, 77, 255, 0.1)');
        groundGrad.addColorStop(0.85, 'rgba(38, 50, 56, 0.2)');
        groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = groundGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.12, r * 1.12 * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. Anillo rúnico perimetral
      const ringAlpha = prison.phase === 'fracture'
        ? Math.min(1.0, 0.3 + (prison.phaseTimer / prison.eruptDurationMs) * 0.7)
        : (prison.phase === 'imploding' ? Math.max(0, 1 - prison.phaseTimer / prison.implosionDurationMs) : 0.65 + Math.sin(now * 0.006) * 0.2);

      ctx.strokeStyle = isCharged ? `rgba(179, 136, 255, ${ringAlpha})` : `rgba(0, 229, 255, ${ringAlpha})`;
      ctx.lineWidth = isCharged ? 2.4 : 1.6;
      ctx.setLineDash([8, 6, 3, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * squish, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // C. Trazas rúnicas desde el epicentro hacia la base de cada pilar
      prison.pillars.forEach((p) => {
        if (p.destroyed) return;
        ctx.strokeStyle = `rgba(128, 216, 255, ${ringAlpha * 0.6})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const midX = (cx + p.x) * 0.5 + Math.sin(now * 0.007 + p.facetSeed) * 3;
        const midY = (cy + p.y) * 0.5 + Math.cos(now * 0.007 + p.facetSeed) * 2;
        ctx.lineTo(midX, midY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });

      // D. Valla de Relámpagos de Alto Voltaje conectando pilares adyacentes
      const activePillars = prison.pillars.filter((p) => !p.destroyed);
      const pCount = activePillars.length;

      if (pCount >= 2 && (prison.phase === 'active' || prison.phase === 'imploding' || prison.phase === 'erupting')) {
        for (let i = 0; i < pCount; i++) {
          const p1 = activePillars[i];
          const p2 = activePillars[(i + 1) % pCount];

          const p1TopY = p1.y - p1.height;
          const p2TopY = p2.y - p2.height;

          // D.1 Cortina electromagnética de escarcha y plasma translúcida
          const curtainGrad = ctx.createLinearGradient(p1.x, p1TopY, p2.x, p2.y);
          curtainGrad.addColorStop(0, isCharged ? 'rgba(124, 77, 255, 0.22)' : 'rgba(0, 229, 255, 0.16)');
          curtainGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
          curtainGrad.addColorStop(1, isCharged ? 'rgba(0, 229, 255, 0.22)' : 'rgba(124, 77, 255, 0.16)');

          ctx.fillStyle = curtainGrad;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p1.x, p1TopY);
          ctx.lineTo(p2.x, p2TopY);
          ctx.lineTo(p2.x, p2.y);
          ctx.closePath();
          ctx.fill();

          // D.2 Arco voltaico de alta tensión en las cúspides
          if (prison.phase === 'imploding') {
            // Durante implosión, los arcos se deforman y tensan bruscamente hacia el epicentro
            const prog = Math.min(1.0, prison.phaseTimer / prison.implosionDurationMs);
            const suckX = cx + (Math.random() - 0.5) * 10;
            const suckY = cy + (Math.random() - 0.5) * 8;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1TopY);
            ctx.quadraticCurveTo(suckX, suckY, p2.x, p2TopY);
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            // Arco en zig-zag continuo en la cúspide
            const segments = 5;
            ctx.strokeStyle = isCharged ? '#ffffff' : '#e0f7fa';
            ctx.lineWidth = isCharged ? 2.2 : 1.6;
            ctx.shadowColor = isCharged ? '#b388ff' : '#00e5ff';
            ctx.shadowBlur = 6;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1TopY);
            for (let s = 1; s < segments; s++) {
              const t = s / segments;
              const sx = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * 8;
              const sy = p1TopY + (p2TopY - p1TopY) * t + (Math.random() - 0.5) * 7;
              ctx.lineTo(sx, sy);
            }
            ctx.lineTo(p2.x, p2TopY);
            ctx.stroke();

            // Arco secundario inferior a media altura
            ctx.strokeStyle = isCharged ? '#7c4dff' : '#00e5ff';
            ctx.lineWidth = 1.2;
            const mid1Y = p1.y - p1.height * 0.45;
            const mid2Y = p2.y - p2.height * 0.45;
            ctx.beginPath();
            ctx.moveTo(p1.x, mid1Y);
            const midSegX = (p1.x + p2.x) * 0.5 + (Math.random() - 0.5) * 6;
            const midSegY = (mid1Y + mid2Y) * 0.5 + (Math.random() - 0.5) * 5;
            ctx.lineTo(midSegX, midSegY);
            ctx.lineTo(p2.x, mid2Y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }

      ctx.restore();
    });
  }

  // 2. Dibuja un Pilar Criotécnico (base de pizarra rocosa + aguja de hielo cristalino + corona voltaica)
  private static drawConductivePrisonPillar(
    ctx: CanvasRenderingContext2D,
    pillar: ConductivePrisonPillarNode,
    prison: ConductivePrisonEntity
  ) {
    if (pillar.height <= 2 || pillar.destroyed) return;

    const squish = 0.58;
    const isCharged = prison.isCharged;
    const isImploding = prison.phase === 'imploding';
    const curH = pillar.height;
    const r = pillar.radius;

    ctx.save();

    // Sombra elíptica en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(pillar.x, pillar.y + 2, r * 1.15, r * 1.15 * squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // Temblor visual si fue golpeado o al implosionar
    let drawX = pillar.x;
    let drawY = pillar.y;
    if (pillar.hitFlash > 0 || isImploding) {
      const shakeAmt = isImploding ? 4 : 2.5;
      drawX += (Math.random() - 0.5) * shakeAmt;
      drawY += (Math.random() - 0.5) * shakeAmt;
    }

    const rockHeight = curH * 0.38; // 38% base de roca
    const iceHeight = curH * 0.62;  // 62% aguja de cristal gélido

    // 1. BASE DE ROCA PIZARRA (Estructura sólida inferior #263238 / #1e293b)
    const rockGrad = ctx.createLinearGradient(drawX - r, drawY, drawX + r, drawY - rockHeight);
    rockGrad.addColorStop(0, '#1e293b');
    rockGrad.addColorStop(0.5, '#263238');
    rockGrad.addColorStop(1, '#37474f');

    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    ctx.moveTo(drawX - r, drawY);
    ctx.lineTo(drawX - r * 0.85, drawY - rockHeight);
    ctx.lineTo(drawX, drawY - rockHeight - r * 0.25 * squish);
    ctx.lineTo(drawX + r * 0.85, drawY - rockHeight);
    ctx.lineTo(drawX + r, drawY);
    ctx.lineTo(drawX, drawY + r * 0.35 * squish);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. CUERPO FACETADO DE CRISTAL DE HIELO (Estructura superior translúcida #00e5ff / #80d8ff)
    const tipX = drawX;
    const tipY = drawY - curH;
    const midX = drawX;
    const midY = drawY - rockHeight;

    // Cara izquierda del cristal (sombra gélida cian)
    const iceLeftGrad = ctx.createLinearGradient(drawX - r * 0.85, midY, tipX, tipY);
    iceLeftGrad.addColorStop(0, isCharged ? '#00b0ff' : '#00bcd4');
    iceLeftGrad.addColorStop(0.6, '#00e5ff');
    iceLeftGrad.addColorStop(1, '#e0f7fa');

    ctx.fillStyle = iceLeftGrad;
    ctx.beginPath();
    ctx.moveTo(drawX - r * 0.85, midY);
    ctx.lineTo(midX, midY - r * 0.25 * squish);
    ctx.lineTo(tipX, tipY);
    ctx.closePath();
    ctx.fill();

    // Cara derecha del cristal (reflejo brillante y translúcido)
    const iceRightGrad = ctx.createLinearGradient(midX, midY, drawX + r * 0.85, tipY);
    iceRightGrad.addColorStop(0, '#80d8ff');
    iceRightGrad.addColorStop(0.5, '#e0f7fa');
    iceRightGrad.addColorStop(1, '#ffffff');

    ctx.fillStyle = iceRightGrad;
    ctx.beginPath();
    ctx.moveTo(midX, midY - r * 0.25 * squish);
    ctx.lineTo(drawX + r * 0.85, midY);
    ctx.lineTo(tipX, tipY);
    ctx.closePath();
    ctx.fill();

    // 3. VENA CONDUCTORA INTERIOR (Arista violeta de alto voltaje a lo largo del pilar)
    ctx.strokeStyle = isCharged ? '#b388ff' : '#7c4dff';
    ctx.lineWidth = isCharged ? 2.0 : 1.4;
    ctx.shadowColor = '#7c4dff';
    ctx.shadowBlur = isCharged ? 6 : 3;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Aristas afiladas de cristal
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(drawX - r * 0.85, midY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(drawX + r * 0.85, midY);
    ctx.stroke();

    // 4. ORBE CONDUCTOR / CHISPA EN LA CÚSPIDE DEL PILAR
    const orbPulse = Math.sin(Date.now() * 0.02 + pillar.facetSeed) * 1.5;
    const orbR = (isCharged ? 5.5 : 4.0) + orbPulse * 0.8;
    const orbGrad = ctx.createRadialGradient(tipX, tipY, 1, tipX, tipY, orbR * 2.2);
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(0.35, '#80d8ff');
    orbGrad.addColorStop(0.7, '#7c4dff');
    orbGrad.addColorStop(1, 'rgba(124, 77, 255, 0)');

    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(tipX, tipY, orbR * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. FLASH DE IMPACTO
    if (pillar.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(drawX - r, drawY);
      ctx.lineTo(drawX - r * 0.85, midY);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(drawX + r * 0.85, midY);
      ctx.lineTo(drawX + r, drawY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // 3. Previsualización de retícula táctica para Prisión Conductora
  private static drawConductivePrisonAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;

    // Radio: tap ~88px (4 pilares), cargado ~122px (6 pilares)
    const baseRadius = 88;
    const targetRadius = isReady ? 122 : Math.floor(baseRadius + ratio * 34);
    const rx = targetRadius;
    const ry = targetRadius * squish;

    const aimDist = 165;
    const tx = wizard.x + Math.cos(wizard.facingAngle) * aimDist;
    const ty = wizard.y + Math.sin(wizard.facingAngle) * aimDist;
    const now = Date.now();

    ctx.save();

    // Línea de trayectoria
    ctx.strokeStyle = isReady ? 'rgba(179, 136, 255, 0.45)' : 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(wizard.x, wizard.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    // Relleno elíptico en el suelo
    const aimGrad = ctx.createRadialGradient(tx, ty, 6, tx, ty, rx);
    aimGrad.addColorStop(0, isReady ? 'rgba(124, 77, 255, 0.28)' : 'rgba(0, 229, 255, 0.2)');
    aimGrad.addColorStop(0.7, isReady ? 'rgba(0, 229, 255, 0.16)' : 'rgba(124, 77, 255, 0.1)');
    aimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = aimGrad;
    ctx.beginPath();
    ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anillo perimetral
    ctx.strokeStyle = isReady ? '#b388ff' : '#00e5ff';
    ctx.lineWidth = isReady ? 2.5 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pilares holográficos rotando ligeramente
    const nodeCount = isReady ? 6 : 4;
    for (let i = 0; i < nodeCount; i++) {
      const ang = (i * Math.PI * 2) / nodeCount + now * 0.001;
      const px = tx + Math.cos(ang) * rx;
      const py = ty + Math.sin(ang) * ry;

      ctx.save();
      ctx.translate(px, py - 14);
      ctx.strokeStyle = isReady ? '#ffffff' : '#80d8ff';
      ctx.fillStyle = isReady ? 'rgba(179, 136, 255, 0.5)' : 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 4);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Texto de HUD táctico
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#b388ff' : '#80d8ff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.fillText(
      isReady
        ? '¡SOBRECARGA CRIOCONDUCTORA (6 PILARES · +50% DAÑO · DOBLE IMPLOSIÓN)! ⚡❄️🏛️'
        : 'PRISIÓN CONDUCTORA (4 PILARES) ⚡❄️',
      tx,
      ty - ry - 14
    );

    ctx.restore();
  }

  // =========================================================================
  // NÚCLEO DE SOBRECARGA (FUEGO + RAYO + TIERRA)
  // =========================================================================

  // 1. Suelo, glifos electromagnéticos, fisuras y ondas de pulso del Núcleo de Sobrecarga
  private static drawOverloadCoreFloor(
    ctx: CanvasRenderingContext2D,
    overloadCores: OverloadCoreEntity[]
  ) {
    if (!overloadCores || overloadCores.length === 0) return;

    const squish = 0.58;
    const now = Date.now();

    overloadCores.forEach((core) => {
      if (core.phase === 'finished') return;

      const cx = core.currentX;
      const cy = core.currentY;
      const lvl = core.level;

      ctx.save();

      // Sombra elíptica suave en el suelo bajo el núcleo flotante
      const shadowRadius = 16 + lvl * 5;
      const shadowGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, shadowRadius);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      shadowGrad.addColorStop(0.5, 'rgba(20, 10, 5, 0.4)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, shadowRadius, shadowRadius * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fisuras magmático-eléctricas radiando en el suelo
      const fissureCount = 6 + lvl * 2;
      for (let f = 0; f < fissureCount; f++) {
        const fAng = (f * Math.PI * 2) / fissureCount + (f % 2 === 0 ? 0.15 : -0.15);
        const fDist = (24 + lvl * 8) * (0.8 + ((f * 37) % 10) * 0.04);
        const fx = cx + Math.cos(fAng) * fDist;
        const fy = cy + Math.sin(fAng) * (fDist * squish);

        ctx.strokeStyle = lvl === 3 ? 'rgba(255, 23, 68, 0.75)' : lvl === 2 ? 'rgba(255, 109, 0, 0.65)' : 'rgba(255, 152, 0, 0.5)';
        ctx.lineWidth = lvl === 3 ? 2.2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const midX = (cx + fx) * 0.5 + Math.sin(f * 2.3) * 4;
        const midY = (cy + fy) * 0.5 + Math.cos(f * 1.9) * 3;
        ctx.lineTo(midX, midY);
        ctx.lineTo(fx, fy);
        ctx.stroke();

        // Núcleo brillante en la fisura
        ctx.strokeStyle = lvl === 3 ? '#ffffff' : '#ffd600';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(midX, midY);
        ctx.stroke();
      }

      // Zona de peligro / advertencia de detonación actual
      const detR = core.detonationRadius;
      const warnGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, detR);
      if (lvl === 3) {
        warnGrad.addColorStop(0, 'rgba(255, 23, 68, 0.28)');
        warnGrad.addColorStop(0.6, 'rgba(255, 109, 0, 0.18)');
        warnGrad.addColorStop(1, 'rgba(224, 64, 251, 0.04)');
      } else if (lvl === 2) {
        warnGrad.addColorStop(0, 'rgba(255, 109, 0, 0.22)');
        warnGrad.addColorStop(0.7, 'rgba(255, 214, 0, 0.12)');
        warnGrad.addColorStop(1, 'rgba(255, 109, 0, 0.02)');
      } else {
        warnGrad.addColorStop(0, 'rgba(255, 152, 0, 0.15)');
        warnGrad.addColorStop(0.7, 'rgba(255, 214, 0, 0.08)');
        warnGrad.addColorStop(1, 'rgba(255, 152, 0, 0.01)');
      }

      ctx.fillStyle = warnGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, detR, detR * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // Anillo perimetral punteado de la detonación
      ctx.strokeStyle = lvl === 3 ? '#ff1744' : lvl === 2 ? '#ffab00' : '#ffd54f';
      ctx.lineWidth = lvl === 3 ? 2.4 : 1.6;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, detR, detR * squish, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ondas concéntricas de pulso radial en expansión (cuando emite una descarga periódica)
      if (core.pulseTimer < 320) {
        const pulseRatio = core.pulseTimer / 320;
        const currentPulseR = core.pulseRadius * pulseRatio;
        const pulseAlpha = (1.0 - pulseRatio) * 0.85;

        ctx.strokeStyle = lvl === 3
          ? `rgba(255, 255, 255, ${pulseAlpha})`
          : lvl === 2
          ? `rgba(255, 214, 0, ${pulseAlpha})`
          : `rgba(255, 109, 0, ${pulseAlpha})`;
        ctx.lineWidth = 2.5 * (1.0 - pulseRatio) + 0.8;
        ctx.shadowColor = lvl === 3 ? '#ff1744' : '#ffd600';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(cx, cy, currentPulseR, currentPulseR * squish, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Líneas de succión gravitatoria hacia el centro (efecto telúrico-magnético)
      const spokeCount = 8;
      for (let s = 0; s < spokeCount; s++) {
        const sAng = (s * Math.PI * 2) / spokeCount + (now * 0.002);
        const sDist = detR * 0.85;
        const inDist = 18 + ((now * 0.04 + s * 15) % (sDist - 18));
        const px = cx + Math.cos(sAng) * inDist;
        const py = cy + Math.sin(sAng) * (inDist * squish);

        ctx.fillStyle = lvl === 3 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 214, 0, 0.55)';
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // 2. Dibuja el Núcleo de Sobrecarga (Orbe de plasma flotante + esquirlas orbitales + arcos eléctricos + HUD de sobrecarga)
  private static drawOverloadCoreEntity(
    ctx: CanvasRenderingContext2D,
    core: OverloadCoreEntity
  ) {
    if (core.phase === 'finished') return;

    const squish = 0.58;
    const now = Date.now();
    const lvl = core.level;

    // Altura de levitación con oscilación vertical
    const hoverH = core.phase === 'launching' ? core.height : 14 + Math.sin(now * 0.006) * 3;
    const vx = core.currentX + core.vibrationOffset.x;
    const vy = core.currentY - hoverH + core.vibrationOffset.y;

    // Radio visual del orbe según su nivel
    const coreR = lvl === 1 ? 12 : lvl === 2 ? 16 : 21;

    ctx.save();

    // 1. DIBUJAR ESQUIRLAS DE ROCA ORBITALES (Fase 2 y 3)
    if (core.rockFragments && core.rockFragments.length > 0) {
      core.rockFragments.forEach((frag) => {
        const fx = core.currentX + Math.cos(frag.orbitAngle) * frag.orbitRadius;
        const fy = (core.currentY - hoverH * 0.75) + Math.sin(frag.orbitAngle) * (frag.orbitRadius * squish);

        // Rayo voltaico conectando el núcleo central con la esquirla
        ctx.strokeStyle = lvl === 3 ? '#ffffff' : lvl === 2 ? '#fff176' : '#ffb74d';
        ctx.lineWidth = lvl === 3 ? 1.6 : 1.1;
        ctx.shadowColor = lvl === 3 ? '#ff1744' : '#ffd600';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        const midX = (vx + fx) * 0.5 + (Math.random() - 0.5) * 5;
        const midY = (vy + fy) * 0.5 + (Math.random() - 0.5) * 5;
        ctx.lineTo(midX, midY);
        ctx.lineTo(fx, fy);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Cuerpo facetado de la roca magnetizada
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(frag.orbitAngle + Math.PI / 4);

        const rockGrad = ctx.createLinearGradient(-frag.size, -frag.size, frag.size, frag.size);
        rockGrad.addColorStop(0, '#37474f');
        rockGrad.addColorStop(0.5, '#212121');
        rockGrad.addColorStop(1, '#0d0d0d');
        ctx.fillStyle = rockGrad;

        ctx.beginPath();
        if (frag.roughPoints && frag.roughPoints.length > 0) {
          ctx.moveTo(frag.roughPoints[0].x, frag.roughPoints[0].y);
          for (let p = 1; p < frag.roughPoints.length; p++) {
            ctx.lineTo(frag.roughPoints[p].x, frag.roughPoints[p].y);
          }
        } else {
          ctx.rect(-frag.size, -frag.size, frag.size * 2, frag.size * 2);
        }
        ctx.closePath();
        ctx.fill();

        // Borde encendido de magma
        ctx.strokeStyle = lvl === 3 ? '#ff5252' : '#ff9100';
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.restore();
      });
    }

    // 2. CORONA DE ENERGÍA Y ANILLOS DE CONTENCIÓN MAGNÉTICA
    // Halo difuso de plasma
    const haloR = coreR * 2.2;
    const haloGrad = ctx.createRadialGradient(vx, vy, coreR * 0.5, vx, vy, haloR);
    if (lvl === 3) {
      haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      haloGrad.addColorStop(0.3, 'rgba(255, 23, 68, 0.6)');
      haloGrad.addColorStop(0.7, 'rgba(224, 64, 251, 0.35)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (lvl === 2) {
      haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      haloGrad.addColorStop(0.35, 'rgba(255, 214, 0, 0.55)');
      haloGrad.addColorStop(0.75, 'rgba(255, 109, 0, 0.25)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      haloGrad.addColorStop(0, 'rgba(255, 235, 59, 0.6)');
      haloGrad.addColorStop(0.4, 'rgba(255, 109, 0, 0.4)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(vx, vy, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Anillos elípticos de contención rotando a contracorriente
    const ringRot1 = core.rotationAngle;
    const ringRot2 = -core.rotationAngle * 0.75;

    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(ringRot1);
    ctx.strokeStyle = lvl === 3 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 214, 0, 0.65)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 0, coreR * 1.5, coreR * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(ringRot2);
    ctx.strokeStyle = lvl === 3 ? 'rgba(255, 23, 68, 0.8)' : 'rgba(255, 109, 0, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.ellipse(0, 0, coreR * 1.35, coreR * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);

    // 3. CUERPO ESFÉRICO CENTRAL (Esfera de roca ígnea + plasma supercrítico)
    const sphereGrad = ctx.createRadialGradient(
      vx - coreR * 0.35,
      vy - coreR * 0.35,
      coreR * 0.1,
      vx,
      vy,
      coreR
    );

    if (lvl === 3) {
      sphereGrad.addColorStop(0, '#ffffff');
      sphereGrad.addColorStop(0.35, '#ff80ab');
      sphereGrad.addColorStop(0.7, '#d50000');
      sphereGrad.addColorStop(1, '#212121');
    } else if (lvl === 2) {
      sphereGrad.addColorStop(0, '#ffffff');
      sphereGrad.addColorStop(0.3, '#ffd600');
      sphereGrad.addColorStop(0.65, '#ff6d00');
      sphereGrad.addColorStop(1, '#263238');
    } else {
      sphereGrad.addColorStop(0, '#ffff8d');
      sphereGrad.addColorStop(0.4, '#ff9100');
      sphereGrad.addColorStop(0.8, '#dd2c00');
      sphereGrad.addColorStop(1, '#212121');
    }

    ctx.fillStyle = sphereGrad;
    ctx.shadowColor = lvl === 3 ? '#ff1744' : '#ffd600';
    ctx.shadowBlur = lvl === 3 ? 16 : 9;
    ctx.beginPath();
    ctx.arc(vx, vy, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Fisuras incandescentes en la superficie de la esfera
    const crackCount = 4;
    for (let c = 0; c < crackCount; c++) {
      const crkAng = (c * Math.PI) / 2 + core.rotationAngle * 0.4;
      const c1x = vx + Math.cos(crkAng) * (coreR * 0.2);
      const c1y = vy + Math.sin(crkAng) * (coreR * 0.2);
      const c2x = vx + Math.cos(crkAng) * (coreR * 0.85);
      const c2y = vy + Math.sin(crkAng) * (coreR * 0.85);

      ctx.strokeStyle = lvl === 3 ? '#ffffff' : '#ffff8d';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(c1x, c1y);
      ctx.lineTo((c1x + c2x) * 0.5 + Math.sin(c * 2) * 2, (c1y + c2y) * 0.5 + Math.cos(c * 2) * 2);
      ctx.lineTo(c2x, c2y);
      ctx.stroke();
    }

    // Chispas violentas en Nivel 3 (Sobrecarga Crítica)
    if (lvl === 3) {
      const sparkCount = 6;
      for (let s = 0; s < sparkCount; s++) {
        const sAng = (s * Math.PI * 2) / sparkCount + Math.random() * 0.5;
        const sLen = coreR + 8 + Math.random() * 14;
        ctx.strokeStyle = Math.random() < 0.5 ? '#ffffff' : '#ff1744';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + Math.cos(sAng) * sLen, vy + Math.sin(sAng) * sLen);
        ctx.stroke();
      }
    }

    // 4. BADGE HUD DE NIVEL Y BARRA DE PROGRESO DE SOBRECARGA
    const badgeY = vy - coreR - 16;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';

    let badgeText = '⚡ NÚCLEO I (100%)';
    let badgeColor = '#ffb74d';
    if (lvl === 2) {
      badgeText = '⚡⚡ NÚCLEO II (+50%)';
      badgeColor = '#ffd600';
    } else if (lvl === 3) {
      badgeText = '⚠️ ¡SOBRECARGA CRÍTICA! (+120%) 💣';
      badgeColor = (now % 200 < 100) ? '#ffffff' : '#ff1744';
    }

    ctx.fillStyle = badgeColor;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(badgeText, vx, badgeY);

    // Barra de tiempo restante hacia auto-detonación (3500ms total)
    const barW = 38;
    const barH = 3;
    const progress = Math.min(1.0, core.elapsedMs / 3500);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(vx - barW / 2, badgeY + 4, barW, barH);

    ctx.fillStyle = lvl === 3 ? '#ff1744' : lvl === 2 ? '#ffd600' : '#ff9100';
    ctx.fillRect(vx - barW / 2, badgeY + 4, barW * progress, barH);

    ctx.restore();
  }

  // 3. Previsualización de retícula táctica para Núcleo de Sobrecarga
  private static drawOverloadCoreAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;

    // Tap despliega a Nivel 1 (~105px detonación); Cargado despliega a Nivel 2 (~157px detonación)
    const baseRadius = 105;
    const targetRadius = isReady ? 157 : Math.floor(baseRadius + ratio * 52);
    const rx = targetRadius;
    const ry = targetRadius * squish;

    const aimDist = 165;
    const tx = wizard.x + Math.cos(wizard.facingAngle) * aimDist;
    const ty = wizard.y + Math.sin(wizard.facingAngle) * aimDist;
    const now = Date.now();

    ctx.save();

    // Línea de trayectoria en arco parabólico
    ctx.strokeStyle = isReady ? 'rgba(255, 214, 0, 0.55)' : 'rgba(255, 109, 0, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(wizard.x, wizard.y);
    const midX = (wizard.x + tx) * 0.5;
    const midY = (wizard.y + ty) * 0.5 - 28;
    ctx.quadraticCurveTo(midX, midY, tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    // Relleno elíptico en el suelo con degradado térmico-voltaico
    const aimGrad = ctx.createRadialGradient(tx, ty, 8, tx, ty, rx);
    aimGrad.addColorStop(0, isReady ? 'rgba(255, 214, 0, 0.28)' : 'rgba(255, 109, 0, 0.22)');
    aimGrad.addColorStop(0.65, isReady ? 'rgba(255, 109, 0, 0.16)' : 'rgba(255, 214, 0, 0.1)');
    aimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = aimGrad;
    ctx.beginPath();
    ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anillo perimetral punteado
    ctx.strokeStyle = isReady ? '#ffd600' : '#ff9100';
    ctx.lineWidth = isReady ? 2.4 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Silueta holográfica del núcleo flotando en el objetivo
    const ghostH = 14 + Math.sin(now * 0.006) * 3;
    const ghostY = ty - ghostH;
    const ghostR = isReady ? 16 : 12;

    ctx.save();
    ctx.fillStyle = isReady ? 'rgba(255, 214, 0, 0.5)' : 'rgba(255, 109, 0, 0.45)';
    ctx.strokeStyle = isReady ? '#ffffff' : '#ffd600';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(tx, ghostY, ghostR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mini esquirlas holográficas orbitando si está cargado (Nivel 2)
    if (isReady) {
      for (let s = 0; s < 3; s++) {
        const sAng = (s * Math.PI * 2) / 3 + now * 0.003;
        const sx = tx + Math.cos(sAng) * (ghostR * 2.0);
        const sy = ghostY + Math.sin(sAng) * (ghostR * 2.0 * squish);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Texto de HUD táctico
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#ffd600' : '#ffb74d';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.fillText(
      isReady
        ? '¡DESPLIEGUE SOBRECARGADO (NIVEL 2 INICIAL · +50% DAÑO BASE)! 💣⚡🌋'
        : 'NÚCLEO DE SOBRECARGA (NIVEL 1) 💣⚡',
      tx,
      ty - ry - 14
    );

    ctx.restore();
  }

  // =========================================================================
  // TORMENTA DE PLASMA GLACIAL (FUEGO + RAYO + HIELO)
  // =========================================================================

  // 1. Suelo, sombras, estela térmica y ondas de implosión/detonación
  private static drawGlacialPlasmaStormGround(
    ctx: CanvasRenderingContext2D,
    glacialPlasmaStorms: GlacialPlasmaStormEntity[]
  ) {
    if (!glacialPlasmaStorms || glacialPlasmaStorms.length === 0) return;

    const squish = 0.58;
    const now = Date.now();

    glacialPlasmaStorms.forEach((storm) => {
      if (storm.phase === 'finished') return;

      const cx = storm.x;
      const cy = storm.y;
      const r = storm.radius;
      const isCharged = storm.isCharged;

      ctx.save();

      // Sombra gélida y térmica en el suelo
      const shadowR = r * 1.1;
      const shadowGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, shadowR);
      shadowGrad.addColorStop(0, isCharged ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.5)');
      shadowGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.18)');
      shadowGrad.addColorStop(0.85, 'rgba(255, 109, 0, 0.12)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, shadowR, shadowR * squish, 0, 0, Math.PI * 2);
      ctx.fill();

      // Anillo de advertencia de succión / influencia gravitatoria
      const suctionR = storm.implosionRadius;
      ctx.strokeStyle = isCharged ? 'rgba(0, 229, 255, 0.45)' : 'rgba(124, 77, 255, 0.35)';
      ctx.lineWidth = isCharged ? 1.8 : 1.2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, suctionR, suctionR * squish, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Si está en fase de IMPLOSIÓN: espirales de succión centrípeta hacia el núcleo
      if (storm.phase === 'imploding') {
        const suckProg = Math.min(1.0, storm.phaseTimer / storm.implosionDurationMs);
        const spiralCount = 8;
        for (let s = 0; s < spiralCount; s++) {
          const baseAng = (s * Math.PI * 2) / spiralCount + (now * 0.008);
          const startDist = suctionR * (1.0 - suckProg * 0.85);

          ctx.strokeStyle = s % 2 === 0 ? 'rgba(0, 229, 255, 0.7)' : 'rgba(255, 109, 0, 0.7)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(baseAng) * startDist, cy + Math.sin(baseAng) * (startDist * squish));
          const midDist = startDist * 0.5;
          const midAng = baseAng + 0.6;
          ctx.quadraticCurveTo(
            cx + Math.cos(midAng) * midDist,
            cy + Math.sin(midAng) * (midDist * squish),
            cx,
            cy
          );
          ctx.stroke();
        }
      }

      // Si está en fase de DETONACIÓN: onda de choque expansiva en el suelo
      if (storm.phase === 'detonating') {
        const detProg = Math.min(1.0, storm.phaseTimer / storm.detonationDurationMs);
        const shockR = suctionR * (0.3 + detProg * 0.85);
        const shockAlpha = (1.0 - detProg) * 0.9;

        // Anillo de fuego interior
        ctx.strokeStyle = `rgba(255, 109, 0, ${shockAlpha})`;
        ctx.lineWidth = 3.5 * (1.0 - detProg);
        ctx.beginPath();
        ctx.ellipse(cx, cy, shockR * 0.7, shockR * 0.7 * squish, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Anillo de hielo exterior
        ctx.strokeStyle = `rgba(0, 229, 255, ${shockAlpha})`;
        ctx.lineWidth = 4.5 * (1.0 - detProg);
        ctx.beginPath();
        ctx.ellipse(cx, cy, shockR, shockR * squish, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  // 2. Dibuja el cuerpo tridimensional del vórtice tri-elemental
  private static drawGlacialPlasmaStormBody(
    ctx: CanvasRenderingContext2D,
    storm: GlacialPlasmaStormEntity
  ) {
    if (storm.phase === 'finished') return;

    const squish = 0.58;
    const now = Date.now();
    const isCharged = storm.isCharged;

    // Altura de levitación con balanceo
    const hoverH = 14 + Math.sin(now * 0.007) * 2.5;
    const vx = storm.x;
    const vy = storm.y - hoverH;

    ctx.save();

    // =========================================================================
    // FASE B: IMPLOSIÓN DE VACÍO (El vórtice colapsa bruscamente hacia el centro)
    // =========================================================================
    if (storm.phase === 'imploding') {
      const suckProg = Math.min(1.0, storm.phaseTimer / storm.implosionDurationMs);
      const curR = Math.max(4, storm.radius * (1.0 - suckProg * 0.88));

      // Singularidad púrpura-negra en el centro
      const singGrad = ctx.createRadialGradient(vx, vy, 1, vx, vy, curR * 2.0);
      singGrad.addColorStop(0, '#ffffff');
      singGrad.addColorStop(0.35, '#311b92');
      singGrad.addColorStop(0.7, '#12005e');
      singGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = singGrad;
      ctx.beginPath();
      ctx.arc(vx, vy, curR * 2.0, 0, Math.PI * 2);
      ctx.fill();

      // Destello agudo central
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(vx, vy, 3 + (1.0 - suckProg) * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
      return;
    }

    // =========================================================================
    // FASE C: DETONACIÓN EXPANSIVA Y REMATE CENTRÍFUGO
    // =========================================================================
    if (storm.phase === 'detonating') {
      const detProg = Math.min(1.0, storm.phaseTimer / storm.detonationDurationMs);
      const burstR = storm.implosionRadius * (0.2 + detProg * 0.9);
      const alpha = (1.0 - detProg);

      // Flash esférico de plasma gélido y fuego
      const burstGrad = ctx.createRadialGradient(vx, vy, 2, vx, vy, burstR);
      burstGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      burstGrad.addColorStop(0.3, `rgba(255, 214, 0, ${alpha * 0.8})`);
      burstGrad.addColorStop(0.6, `rgba(255, 109, 0, ${alpha * 0.7})`);
      burstGrad.addColorStop(0.85, `rgba(0, 229, 255, ${alpha * 0.6})`);
      burstGrad.addColorStop(1, 'rgba(124, 77, 255, 0)');

      ctx.fillStyle = burstGrad;
      ctx.beginPath();
      ctx.arc(vx, vy, burstR, 0, Math.PI * 2);
      ctx.fill();

      // Chispas de alta tensión radiando
      const rayCount = 10;
      for (let r = 0; r < rayCount; r++) {
        const rAng = (r * Math.PI * 2) / rayCount + storm.swirlAngle;
        const rLen = burstR * (0.8 + Math.random() * 0.35);
        ctx.strokeStyle = r % 2 === 0 ? '#00e5ff' : '#ffd600';
        ctx.lineWidth = 2.0 * alpha;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + Math.cos(rAng) * rLen, vy + Math.sin(rAng) * rLen);
        ctx.stroke();
      }

      ctx.restore();
      return;
    }

    // =========================================================================
    // FASE A: VÓRTICE EN DESPLAZAMIENTO (3 CAPAS ELEMENTALES VIVAS)
    // =========================================================================
    const baseR = storm.radius;

    // 1. CAPA GÉLIDA (Base y halo exterior: Cian #00E5FF y blanco escarcha)
    const frostR = baseR * 1.1;
    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(storm.frostLayerAngle);

    const frostGrad = ctx.createRadialGradient(0, 0, frostR * 0.3, 0, 0, frostR);
    frostGrad.addColorStop(0, 'rgba(224, 247, 250, 0.4)');
    frostGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.32)');
    frostGrad.addColorStop(0.85, 'rgba(128, 216, 255, 0.18)');
    frostGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');

    ctx.fillStyle = frostGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, frostR, frostR * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anillo giratorio de espirales de escarcha
    ctx.strokeStyle = isCharged ? 'rgba(0, 229, 255, 0.75)' : 'rgba(128, 216, 255, 0.55)';
    ctx.lineWidth = isCharged ? 2.2 : 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(0, 0, frostR * 0.9, frostR * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 2. NÚCLEO DE FUEGO Y PLASMA (Rotación contracorriente: Naranja #FF6D00 y Sol #FFD600)
    const coreR = baseR * 0.65;
    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(storm.plasmaCoreAngle);

    // Variación turbulenta del radio para dar sensación viva
    const turbulence = Math.sin(now * 0.02) * 2.5;
    const finalCoreR = coreR + turbulence;

    const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, finalCoreR);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#ffd600');
    coreGrad.addColorStop(0.7, '#ff6d00');
    coreGrad.addColorStop(0.92, '#d50000');
    coreGrad.addColorStop(1, 'rgba(213, 0, 0, 0)');

    ctx.fillStyle = coreGrad;
    ctx.shadowColor = '#ff6d00';
    ctx.shadowBlur = isCharged ? 18 : 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, finalCoreR, finalCoreR * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Espiral ígnea interna
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let theta = 0; theta < Math.PI * 3; theta += 0.3) {
      const spR = (theta / (Math.PI * 3)) * (finalCoreR * 0.75);
      const sx = Math.cos(theta) * spR;
      const sy = Math.sin(theta) * (spR * 0.75);
      if (theta === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();

    // 3. FILAMENTOS ELÉCTRICOS (Rayo violeta #7C4DFF y blanco neón orbitando)
    const arcCount = isCharged ? 5 : 3;
    for (let a = 0; a < arcCount; a++) {
      const aAng = storm.swirlAngle * 2.5 + (a * Math.PI * 2) / arcCount;
      const aDist = baseR * (0.6 + ((a * 19) % 10) * 0.04);
      const ax = vx + Math.cos(aAng) * aDist;
      const ay = vy + Math.sin(aAng) * (aDist * squish);

      ctx.strokeStyle = a % 2 === 0 ? '#ffffff' : '#b388ff';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = '#7c4dff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      const midX = (vx + ax) * 0.5 + (Math.random() - 0.5) * 8;
      const midY = (vy + ay) * 0.5 + (Math.random() - 0.5) * 6;
      ctx.lineTo(midX, midY);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Dibujar arcos activos que saltan hacia enemigos
    if (storm.arcs && storm.arcs.length > 0) {
      storm.arcs.forEach((arc) => {
        ctx.strokeStyle = arc.color || '#00e5ff';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#7c4dff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(arc.x1, arc.y1);
        const midX = (arc.x1 + arc.x2) * 0.5 + (Math.random() - 0.5) * 6;
        const midY = (arc.y1 + arc.y2) * 0.5 + (Math.random() - 0.5) * 6;
        ctx.lineTo(midX, midY);
        ctx.lineTo(arc.x2, arc.y2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    }

    // 4. BADGE HUD DE TORMENTA
    const badgeY = vy - baseR - 12;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isCharged ? '#ffd600' : '#80d8ff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(
      isCharged ? '🌪️⚡ SOBRECARGA TRI-ELEMENTAL (+50%)' : '🌪️❄️⚡ TORMENTA DE PLASMA GLACIAL',
      vx,
      badgeY
    );

    ctx.restore();
  }

  // 3. Previsualización de retícula táctica para Tormenta de Plasma Glacial
  private static drawGlacialPlasmaStormAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: { x: number; y: number; facingAngle: number; isCharging?: boolean; chargeRatio?: number }
  ) {
    const ratio = wizard.chargeRatio || 0;
    const isReady = ratio >= 1.0;
    const squish = 0.58;

    // Tap = alcance estándar ~280px, radio de succión ~125px; Cargado = radio +35% (~170px)
    const aimDist = 280;
    const tx = wizard.x + Math.cos(wizard.facingAngle) * aimDist;
    const ty = wizard.y + Math.sin(wizard.facingAngle) * aimDist;
    const suctionR = isReady ? 170 : Math.floor(125 + ratio * 45);
    const vortexR = isReady ? 95 : Math.floor(70 + ratio * 25);
    const now = Date.now();

    ctx.save();

    // Línea de trayectoria recta proyectada
    ctx.strokeStyle = isReady ? 'rgba(0, 229, 255, 0.65)' : 'rgba(255, 109, 0, 0.5)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(wizard.x, wizard.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    // Relleno elíptico en el epicentro final de implosión
    const aimGrad = ctx.createRadialGradient(tx, ty, 6, tx, ty, suctionR);
    aimGrad.addColorStop(0, isReady ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255, 109, 0, 0.22)');
    aimGrad.addColorStop(0.55, isReady ? 'rgba(124, 77, 255, 0.18)' : 'rgba(0, 229, 255, 0.14)');
    aimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = aimGrad;
    ctx.beginPath();
    ctx.ellipse(tx, ty, suctionR, suctionR * squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anillo exterior de succión
    ctx.strokeStyle = isReady ? '#00e5ff' : '#ff9100';
    ctx.lineWidth = isReady ? 2.2 : 1.6;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(tx, ty, suctionR, suctionR * squish, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Silueta holográfica del vórtice rotando en el destino
    const ghostY = ty - 14;
    ctx.save();
    ctx.translate(tx, ghostY);
    ctx.rotate(now * 0.003);
    ctx.strokeStyle = isReady ? '#ffffff' : '#80d8ff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, vortexR * 0.6, vortexR * 0.6 * squish, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Texto de HUD táctico
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isReady ? '#00e5ff' : '#ffd54f';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.fillText(
      isReady
        ? '¡SOBRECARGA TRI-ELEMENTAL (+35% ÁREA · +50% DAÑO · CONGELACIÓN)! 🌪️❄️⚡'
        : 'TORMENTA DE PLASMA GLACIAL 🌪️❄️⚡',
      tx,
      ty - (suctionR * squish) - 14
    );

    ctx.restore();
  }

  // =========================================================================
  // CATACLISMO ELEMENTAL (FUEGO + RAYO + HIELO + TIERRA: SECUENCIA EN 4 FASES)
  // =========================================================================

  // 1. Suelo: Runa primordial tetra-elemental, 4 fisuras tectónicas, magma y escarcha
  private static drawElementalCataclysmGround(
    ctx: CanvasRenderingContext2D,
    cataclysms: ElementalCataclysmEntity[]
  ) {
    if (!cataclysms || cataclysms.length === 0) return;
    const squish = 0.58;
    const now = Date.now();

    cataclysms.forEach((cataclysm) => {
      if (cataclysm.phase === 'finished') return;

      try {
        const elapsed = cataclysm.elapsedMs;
        const alpha = elapsed > 2400 ? Math.max(0, 1 - (elapsed - 2400) / 400) : 1;
        const cx = cataclysm.x;
        const cy = cataclysm.y;
        const safeRad = Math.max(1, cataclysm.radius);
        const isCharged = cataclysm.isCharged;

        ctx.save();
        ctx.globalAlpha = alpha;

        // A. RESPLANDOR DE FONDO TETRA-ELEMENTAL EN EL SUELO
        const innerG = Math.min(10, safeRad * 0.1);
        const bgGrad = ctx.createRadialGradient(cx, cy, innerG, cx, cy, safeRad);
        if (cataclysm.phase === 'earth_fissure') {
          bgGrad.addColorStop(0, 'rgba(255, 179, 0, 0.28)');
          bgGrad.addColorStop(0.65, 'rgba(62, 39, 35, 0.18)');
          bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (cataclysm.phase === 'fire_eruption') {
          bgGrad.addColorStop(0, 'rgba(255, 109, 0, 0.35)');
          bgGrad.addColorStop(0.55, 'rgba(213, 0, 0, 0.22)');
          bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (cataclysm.phase === 'ice_wave') {
          bgGrad.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
          bgGrad.addColorStop(0.6, 'rgba(0, 145, 234, 0.2)');
          bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          bgGrad.addColorStop(0.5, 'rgba(124, 77, 255, 0.3)');
          bgGrad.addColorStop(0.85, 'rgba(0, 229, 255, 0.15)');
          bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, safeRad, safeRad * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // B. RUNA PRIMORDIAL TETRA-ELEMENTAL (ANILLOS CONCÉNTRICOS Y GLIFOS)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, squish);

        // Anillo perimetral punteado exterior
        ctx.strokeStyle = isCharged ? '#ec4899' : '#fbbf24';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, safeRad, 0, Math.PI * 2);
        ctx.stroke();

        // Anillo rúnico intermedio girando
        ctx.rotate(now * 0.001);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.1, safeRad * 0.65), 0, Math.PI * 2);
        ctx.stroke();

        // Anillo interior con 4 sectores elementales
        ctx.rotate(-now * 0.002);
        ctx.lineWidth = 2.0;
        ctx.setLineDash([12, 8]);
        ctx.strokeStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.1, safeRad * 0.35), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // C. 4 FISURAS TECTÓNICAS EN PERSPECTIVA ISOMÉTRICA
        cataclysm.fissures.forEach((fissure) => {
          if (!fissure.segments || fissure.segments.length < 2) return;

          // Trazado base de la fractura en roca
          ctx.save();
          ctx.strokeStyle = '#181824';
          ctx.lineWidth = isCharged ? 7 : 5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'bevel';
          ctx.beginPath();
          ctx.moveTo(fissure.segments[0].x, fissure.segments[0].y);
          for (let i = 1; i < fissure.segments.length; i++) {
            ctx.lineTo(fissure.segments[i].x, fissure.segments[i].y);
          }
          ctx.stroke();

          // En Fase 2 (Fuego): Brillo de magma en el fondo de las fisuras
          if (cataclysm.phase === 'fire_eruption' || elapsed >= 600) {
            ctx.strokeStyle = cataclysm.phase === 'fire_eruption' ? '#ff6d00' : '#d50000';
            ctx.lineWidth = isCharged ? 4.5 : 3.2;
            ctx.shadowColor = '#ff3d00';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(fissure.segments[0].x, fissure.segments[0].y);
            for (let i = 1; i < fissure.segments.length; i++) {
              ctx.lineTo(fissure.segments[i].x, fissure.segments[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // En Fase 3 (Hielo): Escarcha cristalina que sella el magma expuesto
          if (cataclysm.phase === 'ice_wave' || elapsed >= 1200) {
            ctx.strokeStyle = '#80d8ff';
            ctx.lineWidth = isCharged ? 3.5 : 2.5;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(fissure.segments[0].x, fissure.segments[0].y);
            for (let i = 1; i < fissure.segments.length; i++) {
              ctx.lineTo(fissure.segments[i].x, fissure.segments[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // En Fase 4 (Rayo): Sobrecarga eléctrica recorriendo las fisuras congeladas
          if (cataclysm.phase === 'lightning_detonation' && elapsed >= 1800) {
            if (Math.random() < 0.8) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2.2;
              ctx.shadowColor = '#7c4dff';
              ctx.shadowBlur = 12;
              ctx.beginPath();
              ctx.moveTo(fissure.segments[0].x, fissure.segments[0].y);
              for (let i = 1; i < fissure.segments.length; i++) {
                const jx = fissure.segments[i].x + (Math.random() - 0.5) * 6;
                const jy = fissure.segments[i].y + (Math.random() - 0.5) * 4;
                ctx.lineTo(jx, jy);
              }
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          }

          ctx.restore();
        });

        ctx.restore();
      } catch (err) {
        console.error('TaskQuest renderer: error in drawElementalCataclysmGround:', err);
      }
    });
  }

  // 2. Cuerpo y Secuencia Coreografiada de Cuatro Fases
  private static drawElementalCataclysmBody(
    ctx: CanvasRenderingContext2D,
    cataclysm: ElementalCataclysmEntity
  ) {
    if (cataclysm.phase === 'finished') return;

    try {
      const elapsed = cataclysm.elapsedMs;
      const alpha = elapsed > 2400 ? Math.max(0, 1 - (elapsed - 2400) / 400) : 1;
      const cx = cataclysm.x;
      const cy = cataclysm.y;
      const isCharged = cataclysm.isCharged;

      ctx.save();
      ctx.globalAlpha = alpha;

      // FASE 1: TIERRA — PLACAS DE ROCA TECTÓNICAS QUE EMERGEN
      cataclysm.fissures.forEach((fissure) => {
        fissure.slabs.forEach((slab) => {
          const sx = cx + slab.relX;
          const sy = cy + slab.relY;
          const currentH = slab.elevation;
          if (currentH <= 0.5) return;

          ctx.save();
          ctx.translate(sx, sy);

          // Cara lateral oscura sombreada (marrón arcilla / pizarra)
          ctx.fillStyle = '#263238';
          ctx.beginPath();
          ctx.moveTo(-slab.width / 2, 0);
          ctx.lineTo(slab.width / 2, 0);
          ctx.lineTo(slab.width / 2, -currentH);
          ctx.lineTo(-slab.width / 2, -currentH);
          ctx.closePath();
          ctx.fill();

          // Cara superior de la placa (ámbar arcilla con vetas)
          ctx.fillStyle = slab.color;
          ctx.beginPath();
          const slabW = Math.max(0.1, slab.width / 2);
          const slabH = Math.max(0.1, (slab.height / 2) * 0.58);
          ctx.ellipse(0, -currentH, slabW, slabH, slab.tilt || 0, 0, Math.PI * 2);
          ctx.fill();

          // Borde superior iluminado
          ctx.strokeStyle = '#ffd54f';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.restore();
        });
      });

      // FASE 2: FUEGO — COLUMNAS DE MAGMA ARDIENTE VERTICALES
      if (elapsed >= 500 && elapsed < 1850) {
        const fireProg = Math.sin(Math.max(0, Math.min(1.0, (elapsed - 600) / 600)) * Math.PI);
        const magmaMaxH = Math.max(0, (isCharged ? 95 : 70) * fireProg);

        cataclysm.magmaColumns.forEach((col, cIdx) => {
          const colH = Math.max(0, magmaMaxH * (0.8 + 0.4 * Math.sin(cIdx + Date.now() * 0.015)));
          if (colH <= 2) return;

          ctx.save();
          ctx.translate(col.x, col.y);

          const colGrad = ctx.createLinearGradient(0, 0, 0, -colH);
          colGrad.addColorStop(0, '#d50000');
          colGrad.addColorStop(0.35, '#ff6d00');
          colGrad.addColorStop(0.75, '#ffd600');
          colGrad.addColorStop(1, '#ffffff');

          ctx.fillStyle = colGrad;
          ctx.shadowColor = '#ff6d00';
          ctx.shadowBlur = 14;

          ctx.beginPath();
          ctx.moveTo(-col.width / 2, 0);
          ctx.quadraticCurveTo(-col.width * 0.7, -colH * 0.5, 0, -colH);
          ctx.quadraticCurveTo(col.width * 0.7, -colH * 0.5, col.width / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.restore();
        });
      }

      // FASE 3: HIELO — CRISTALES DE HIELO Y ONDA DE CERO ABSOLUTO (Protección estricta de radios)
      if (elapsed >= 1150 && elapsed < 2600) {
        const iceWaveProg = Math.max(0, Math.min(1.0, (elapsed - 1200) / 600));
        const waveR = Math.max(0.1, cataclysm.radius * iceWaveProg);

        // Anillo expansivo de vapor polar y escarcha
        ctx.save();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = isCharged ? 3.5 : 2.2;
        ctx.shadowColor = '#80d8ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(cx, cy, waveR, waveR * 0.58, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Espículas de cristal gélido en las columnas congeladas
        cataclysm.magmaColumns.forEach((col) => {
          const spikeProg = Math.max(0, Math.min(1.0, (elapsed - 1200) / 350));
          const spikeH = Math.max(0, (isCharged ? 75 : 55) * spikeProg);
          if (spikeH <= 1) return;

          ctx.save();
          ctx.translate(col.x, col.y);

          const iceGrad = ctx.createLinearGradient(0, 0, 0, -spikeH);
          iceGrad.addColorStop(0, '#0091ea');
          iceGrad.addColorStop(0.5, '#00e5ff');
          iceGrad.addColorStop(1, '#ffffff');

          ctx.fillStyle = iceGrad;
          ctx.beginPath();
          ctx.moveTo(-col.width * 0.4, 0);
          ctx.lineTo(0, -spikeH);
          ctx.lineTo(col.width * 0.4, 0);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        });
        ctx.restore();
      }

      // FASE 4: RAYO — RELÁMPAGO TITÁNICO Y DETONACIÓN RADIAL
      if (elapsed >= 1800) {
        // A. Relámpago Titánico que desciende desde el cielo
        const lightningAlpha = elapsed < 2100 ? 1.0 : Math.max(0, 1.0 - (elapsed - 2100) / 400);
        if (lightningAlpha > 0.05) {
          ctx.save();
          ctx.globalAlpha = alpha * lightningAlpha;

          const boltTopY = cy - 560;
          const boltMidX1 = cx + (Math.sin(Date.now() * 0.05) * 14);
          const boltMidY1 = cy - 380;
          const boltMidX2 = cx - (Math.cos(Date.now() * 0.04) * 16);
          const boltMidY2 = cy - 180;

          // Halo exterior violeta/plasma
          ctx.strokeStyle = 'rgba(124, 77, 255, 0.85)';
          ctx.lineWidth = isCharged ? 32 : 22;
          ctx.shadowColor = '#d500f9';
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.moveTo(cx, boltTopY);
          ctx.lineTo(boltMidX1, boltMidY1);
          ctx.lineTo(boltMidX2, boltMidY2);
          ctx.lineTo(cx, cy);
          ctx.stroke();

          // Tronco central blanco incandescente
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isCharged ? 16 : 10;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.moveTo(cx, boltTopY);
          ctx.lineTo(boltMidX1, boltMidY1);
          ctx.lineTo(boltMidX2, boltMidY2);
          ctx.lineTo(cx, cy);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Destello cegador en el epicentro del impacto
          const flashR = Math.max(10, isCharged ? 80 : 55);
          const flashGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, flashR);
          flashGrad.addColorStop(0, '#ffffff');
          flashGrad.addColorStop(0.35, '#80d8ff');
          flashGrad.addColorStop(0.7, '#7c4dff');
          flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.ellipse(cx, cy, flashR, flashR * 0.58, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // B. Onda de Choque Radial Expansiva (1900ms a 2800ms)
        if (elapsed >= 1900) {
          const shockProg = Math.max(0, Math.min(1.0, (elapsed - 1900) / 750));
          const currR = Math.max(0.1, cataclysm.radius * (0.15 + 0.85 * shockProg));
          const shockAlpha = Math.max(0, 1.0 - shockProg);

          ctx.save();
          ctx.globalAlpha = alpha * shockAlpha;
          ctx.strokeStyle = isCharged ? '#ffffff' : '#ffd54f';
          ctx.lineWidth = Math.max(0.1, (isCharged ? 4.5 : 3.0) * (1 - shockProg * 0.5));
          ctx.shadowColor = '#7c4dff';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.ellipse(cx, cy, currR, currR * 0.58, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Segundo anillo exterior de dispersión
          const subR = Math.max(0.1, currR * 0.82);
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.ellipse(cx, cy, subR, subR * 0.58, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          ctx.restore();
        }
      }

      ctx.restore();
    } catch (err) {
      console.error('TaskQuest renderer: error in drawElementalCataclysmBody:', err);
    }
  }

  // 3. Indicador de Apuntado Táctico de Cataclismo Elemental
  private static drawElementalCataclysmAimIndicator(
    ctx: CanvasRenderingContext2D,
    wizard: {
      x: number;
      y: number;
      facingAngle: number;
      chargeRatio?: number;
    }
  ) {
    try {
      const ratio = Math.max(0, Math.min(1.0, wizard.chargeRatio || 0));
      const isReady = ratio >= 0.95;
      const squish = 0.58;

      const targetDist = 175;
      const tx = wizard.x + Math.cos(wizard.facingAngle) * targetDist;
      const ty = wizard.y + Math.sin(wizard.facingAngle) * targetDist * squish;

      const rad = isReady ? 340 : Math.floor(240 + ratio * 100);
      const safeRad = Math.max(1, rad);
      const now = Date.now();

      ctx.save();

      // Línea de trayectoria estelar al epicentro
      ctx.strokeStyle = isReady ? 'rgba(236, 72, 153, 0.75)' : 'rgba(251, 191, 36, 0.55)';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.moveTo(wizard.x, wizard.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      // Relleno de los 4 cuadrantes elementales
      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(1, squish);

      // Fondo global con gradiente radial
      const innerG = Math.min(8, safeRad * 0.1);
      const catAimGrad = ctx.createRadialGradient(0, 0, innerG, 0, 0, safeRad);
      catAimGrad.addColorStop(0, isReady ? 'rgba(255, 255, 255, 0.35)' : 'rgba(251, 191, 36, 0.25)');
      catAimGrad.addColorStop(0.5, isReady ? 'rgba(236, 72, 153, 0.22)' : 'rgba(0, 229, 255, 0.15)');
      catAimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = catAimGrad;
      ctx.beginPath();
      ctx.arc(0, 0, safeRad, 0, Math.PI * 2);
      ctx.fill();

      // Anillo rúnico tetra-elemental punteado giratorio
      ctx.rotate(now * 0.001);
      ctx.strokeStyle = isReady ? '#ec4899' : '#ffd54f';
      ctx.lineWidth = isReady ? 3.0 : 2.0;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, safeRad, 0, Math.PI * 2);
      ctx.stroke();

      // Cruz primordial de coordenadas
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(-safeRad, 0);
      ctx.lineTo(safeRad, 0);
      ctx.moveTo(0, -safeRad);
      ctx.lineTo(0, safeRad);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      // Texto de HUD táctico
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isReady ? '#f472b6' : '#fde047';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(
        isReady
          ? '¡SINTONÍA PRIMORDIAL (ÁREA TOTAL · +50% DAÑO · VAPORIZACIÓN)! 🪐✨'
          : 'CATACLISMO ELEMENTAL (FUEGO + RAYO + HIELO + TIERRA) 🪐✨',
        tx,
        ty - (safeRad * squish) - 16
      );

      ctx.restore();
    } catch (err) {
      console.error('TaskQuest renderer: error in drawElementalCataclysmAimIndicator:', err);
    }
  }

  private static drawPrimordialMagmaBastion(ctx: CanvasRenderingContext2D, x: number, y: number, entity: PrimordialMagmaBastionEntity) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(x, y, entity.radius, entity.radius * 0.58, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    entity.monoliths.forEach((monolith) => {
      const a = entity.orbitAngle + monolith.angleOffset;
      const mx = Math.floor(x + Math.cos(a) * entity.radius);
      const my = Math.floor(y + Math.sin(a) * entity.radius * 0.58);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(mx - 8, my - monolith.height, monolith.width, monolith.height);
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(mx - 5, my - monolith.height + 3, 7, monolith.height - 8);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(mx - 10, my - 5, 4, 4);
      ctx.fillRect(mx + 9, my - 13, 4, 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(mx - 2, my - monolith.height - 4, 4, 4);
      ctx.fillRect(mx + 4, my - 7, 3, 3);
    });
    ctx.restore();
  }

  private static drawEternalPermafrostFortress(ctx: CanvasRenderingContext2D, x: number, y: number, entity: EternalPermafrostFortressEntity) {
    ctx.save();
    const progress = entity.burst ? entity.burstProgress : Math.min(1, entity.elapsedMs / entity.durationMs);
    if (!entity.burst) {
      const r = entity.radius;
      ctx.globalAlpha = 0.5 + ((entity.absorbedHits || 0) % 3) * 0.1;
      for (let row = 0; row < 10; row++) {
        const dy = -62 + row * 7;
        const halfWidth = Math.floor(Math.sqrt(Math.max(0, 1 - (dy * dy) / (62 * 62))) * r);
        ctx.fillStyle = row % 3 === 0 ? '#7dd3fc' : '#334155';
        ctx.fillRect(Math.floor(x - halfWidth), Math.floor(y + dy), halfWidth * 2, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(x - halfWidth), Math.floor(y + dy), 4, 3);
        ctx.fillRect(Math.floor(x + halfWidth - 4), Math.floor(y + dy), 4, 3);
      }
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(Math.floor(x - 3), Math.floor(y - 70), 6, 8);
    } else {
      ctx.globalAlpha = Math.max(0, 1 - progress * 0.65);
      for (const shard of entity.shards) {
        const sx = Math.floor(x + Math.cos(shard.angle) * shard.dist);
        const sy = Math.floor(y + Math.sin(shard.angle) * shard.dist * 0.58);
        ctx.fillStyle = shard.isRock ? '#334155' : '#7dd3fc';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1, sy - 6, 3, 3);
      }
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(x, y, 30 + progress * 220, (30 + progress * 220) * 0.58, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawMagneticTelluricSpire(ctx: CanvasRenderingContext2D, entity: MagneticTelluricSpireEntity) {
    ctx.save();
    const x = Math.floor(entity.targetX);
    const y = Math.floor(entity.targetY);
    const elapsed = entity.elapsedMs;
    // Líneas magnéticas angulares de un píxel apuntan hacia la base del obelisco.
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + (Math.floor(elapsed / 180) % 2) * 0.08;
      const sx = x + Math.cos(a) * entity.radius;
      const sy = y + Math.sin(a) * entity.radius * 0.58;
      const mx = (sx + x) / 2 + (i % 2 ? 8 : -8);
      const my = (sy + y) / 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(mx, my);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    // Obelisco de basalto en bloques escalonados, sin difuminado.
    ctx.fillStyle = '#27272a';
    ctx.fillRect(x - 26, y - entity.obeliskHeight, 52, entity.obeliskHeight);
    ctx.fillRect(x - 34, y - entity.obeliskHeight + 18, 68, 18);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(x - 14, y - entity.obeliskHeight + 8, 28, entity.obeliskHeight - 18);
    ctx.fillStyle = '#fbbf24';
    for (let row = 0; row < 4; row++) {
      const ry = y - entity.obeliskHeight + 22 + row * 18;
      ctx.fillRect(x - 2, ry, 4, 8);
      ctx.fillRect(x - 6, ry + 3, 12, 2);
    }
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(x - 3, y - entity.obeliskHeight - 8, 6, 6);
    ctx.fillRect(x - 38, y - 8, 8, 3);
    ctx.fillRect(x + 30, y - 8, 8, 3);
    for (let arc = 0; arc < 3; arc++) {
      const side = arc % 2 === 0 ? -1 : 1;
      const phase = Math.floor(elapsed / 90 + arc * 3) % 10;
      const ax = x + side * (10 + phase * 2);
      const ay = y - entity.obeliskHeight + 12 + ((phase * 11) % Math.max(16, entity.obeliskHeight - 20));
      ctx.fillRect(ax, ay, 3, 3);
      ctx.fillRect(ax - side * 5, ay - 5, 5, 3);
      ctx.fillRect(ax - side * 9, ay + 3, 4, 3);
      ctx.fillRect(ax - side * 13, ay - 3, 4, 3);
    }
    ctx.restore();
  }
}
