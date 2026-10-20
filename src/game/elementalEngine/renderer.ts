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
  ForestLevelData,
  ForestTreeEntity,
  PuzzleWheelEntity,
  GateDoorEntity,
  AmbientLeafParticle,
} from './types';
import { getCameraFrustum, isInFrustum, FrustumBounds } from './level1ForestMap';
import { drawWizardSprite } from '../renderWizard';

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
      channeledStream?: ChanneledStreamState | null;
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
    forestLevel?: ForestLevelData
  ) {
    ctx.save();

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

    // 2. Dibujar Suelo (Bosque Extendido 2.5D con Chunks o Suelo de Mazmorra clásica)
    if (forestLevel) {
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

    // 3.8 Líneas de trayectoria y retículas tácticas al cargar o apuntar
    if (wizard.isCharging && wizard.chargeType === 'ice') {
      this.drawGlacialAimTrajectory(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'earth') {
      this.drawTectonicAimIndicator(ctx, wizard);
    } else if (wizard.isCharging && wizard.chargeType === 'cryo') {
      this.drawCryoAimTrajectory(ctx, wizard);
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
      if (forestLevel && !isInFrustum(obs.x, obs.y, obs.radius + 30, frustum)) return;
      renderList.push({
        y: obs.y,
        draw: () => this.drawObstacle(ctx, obs),
      });
    });

    // Si hay nivel de bosque: añadir Troncos de Árboles, Rueda Elemental y Portón al Y-Sorting
    if (forestLevel) {
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

    // Mago (Jugador)
    renderList.push({
      y: wizard.y,
      draw: () => this.drawWizard(ctx, wizard),
    });

    // Enemigos y Jefes
    enemies.forEach((enemy) => {
      renderList.push({
        y: enemy.y,
        draw: () => this.drawEnemy(ctx, enemy),
      });
    });

    // Ordenar por coordenada Y ascendente
    renderList.sort((a, b) => a.y - b.y);

    // Ejecutar dibujo ordenado
    renderList.forEach((item) => item.draw());

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

    // 6.5 Dibujar Rayos Criogénicos (Hielo + Rayo) Penetrantes con Núcleo Gélido y Espirales Voltaicas
    this.drawCryoBeams(ctx, wizard, cryoBeams);

    // 7. Dibujar Partículas
    this.drawParticles(ctx, particles);

    // 8. Dibujar Textos Flotantes
    this.drawFloatingTexts(ctx, floatingTexts);

    // 8.5 Capa Superior: Canopy de Árboles (Oclusión suave al pasar por debajo) y Hojas Ambientales
    if (forestLevel) {
      this.drawCanopyLayer(ctx, frustum, forestLevel.trees);
      this.drawAmbientLeaves(ctx, frustum, forestLevel.ambientLeaves);
    }

    ctx.restore(); // Fin del espacio transformado con Zoom

    // 9. Barra de Salud Superior del Jefe (si hay un jefe activo en la sala)
    if (currentBoss && currentBoss.hp > 0) {
      this.drawBossHUD(ctx, width, currentBoss);
    }

    ctx.restore(); // Fin de screen shake
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

  // Dibuja el suelo, runas, grietas y cráter calcinado de la Corona Infernal (Fase A, B, C, D)
  private static drawInfernalCrownFloor(ctx: CanvasRenderingContext2D, crowns: InfernalCrownEntity[]) {
    if (!crowns || crowns.length === 0) return;

    crowns.forEach((crown) => {
      ctx.save();
      ctx.translate(crown.x, crown.y);

      const squish = 0.58;

      if (crown.phase === 'preparation') {
        const prog = Math.min(1, crown.phaseTimer / crown.prepDurationMs);
        // 1. Mancha calcinada central en crecimiento con resplandor ígneo
        const scorchRadius = 24 + prog * 24;
        const scorchGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, scorchRadius);
        scorchGrad.addColorStop(0, 'rgba(40, 15, 8, 0.88)');
        scorchGrad.addColorStop(0.65, 'rgba(30, 10, 5, 0.5)');
        scorchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = scorchGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, scorchRadius, scorchRadius * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Grietas incandescentes que se ramifican por las losas del suelo
        crown.crackAngles.forEach((ang, idx) => {
          const crackLen = (28 + prog * 45) * (0.85 + (idx % 3) * 0.15);
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.9)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const midX = Math.cos(ang + 0.12) * (crackLen * 0.5);
          const midY = Math.sin(ang + 0.12) * (crackLen * 0.5) * squish;
          const endX = Math.cos(ang - 0.08) * crackLen;
          const endY = Math.sin(ang - 0.08) * crackLen * squish;
          ctx.lineTo(midX, midY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Filamento central de oro blanco al rojo vivo
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        });

        // 3. Delimitación sutil del radio final de la corona (telegrafo táctico)
        const boundaryAlpha = 0.22 + 0.18 * Math.sin(crown.phaseTimer * 0.02);
        ctx.strokeStyle = `rgba(249, 115, 22, ${boundaryAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.ellipse(0, 0, crown.maxRadius, crown.maxRadius * squish, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (crown.phase === 'expansion') {
        const r = crown.currentRadius;

        // 1. Disco calcinado en expansión
        const discGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
        discGrad.addColorStop(0, 'rgba(67, 20, 7, 0.88)');
        discGrad.addColorStop(0.75, 'rgba(124, 45, 18, 0.55)');
        discGrad.addColorStop(1, 'rgba(234, 88, 12, 0.12)');
        ctx.fillStyle = discGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Grietas de magma que siguen la onda expansiva
        crown.crackAngles.forEach((ang) => {
          const len = r * 0.92;
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len * squish);
          ctx.stroke();

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        });

        // 3. Frente ígneo en el suelo
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * squish, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else if (crown.phase === 'ring') {
        const r = crown.maxRadius;

        // 1. Interior calcinado permanente con brillo de brasas
        const ashGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, r);
        ashGrad.addColorStop(0, 'rgba(20, 5, 4, 0.92)');
        ashGrad.addColorStop(0.68, 'rgba(38, 9, 5, 0.8)');
        ashGrad.addColorStop(0.92, 'rgba(120, 25, 10, 0.45)');
        ashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = ashGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * squish, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Anillo de brasas incandescentes donde brotan las llamas
        const pulse = Math.sin(crown.phaseTimer * 0.007) * 0.15;
        ctx.strokeStyle = `rgba(234, 88, 12, ${0.72 + pulse})`;
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * squish, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(254, 240, 138, ${0.85 + pulse})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 3. Grietas de magma irradiando en el suelo
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
        ctx.lineWidth = 1.8;
        crown.crackAngles.forEach((ang) => {
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * (r * 0.15), Math.sin(ang) * (r * 0.15) * squish);
          ctx.lineTo(Math.cos(ang) * (r * 0.88), Math.sin(ang) * (r * 0.88) * squish);
          ctx.stroke();
        });

        // 4. Glifos rúnicos incrustados en la piedra
        for (let g = 0; g < 6; g++) {
          const gAng = (g / 6) * Math.PI * 2 + crown.phaseTimer * 0.0003;
          const gx = Math.cos(gAng) * (r * 0.78);
          const gy = Math.sin(gAng) * (r * 0.78) * squish;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (crown.phase === 'detonation') {
        const r = crown.maxRadius;
        if (crown.phaseTimer < 180) {
          // Energía del suelo contrayéndose y sobrecalentándose
          const curR = crown.currentRadius;
          const brightGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, Math.max(10, curR));
          brightGrad.addColorStop(0, '#ffffff');
          brightGrad.addColorStop(0.4, '#fef08a');
          brightGrad.addColorStop(0.85, '#f97316');
          brightGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = brightGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, curR, curR * squish, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Cráter calcinado post-detonación desvaneciéndose
          const fadeProg = (crown.phaseTimer - 180) / Math.max(1, crown.detonationDurationMs - 180);
          const alpha = Math.max(0, 1 - fadeProg);
          ctx.globalAlpha = alpha;

          const blastR = r * 1.25;
          const craterGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, blastR);
          craterGrad.addColorStop(0, 'rgba(15, 4, 3, 0.92)');
          craterGrad.addColorStop(0.55, 'rgba(67, 20, 7, 0.65)');
          craterGrad.addColorStop(0.88, 'rgba(234, 88, 12, 0.35)');
          craterGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = craterGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, blastR, blastR * squish, 0, 0, Math.PI * 2);
          ctx.fill();

          // Anillo de choque residual en el suelo
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.65)';
          ctx.lineWidth = 3.5 * alpha;
          ctx.beginPath();
          ctx.ellipse(0, 0, blastR * 0.95, blastR * 0.95 * squish, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
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
    if (obs.obstacleType === 'door_gate') {
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
      channeledStream?: ChanneledStreamState | null;
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

      ctx.restore();
    }

    if (wizard.hitFlash > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.beginPath();
      ctx.arc(0, -10, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    drawWizardSprite({
      ctx,
      x: 0,
      y: 0,
      scale: 1.15, // Mago con presencia visual mejorada
      facingAngle: wizard.facingAngle,
      isMoving: wizard.isMoving,
    });

    ctx.restore();
  }

  // Dibuja Enemigos y Jefes con siluetas, indicadores de estado y telégrafos
  private static drawEnemy(ctx: CanvasRenderingContext2D, enemy: GameEnemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    // 1. Telégrafo de Ataque Rojo
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

    // 2. Sombra en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, enemy.radius * 0.7, enemy.radius, enemy.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Si está congelado: Cubo de hielo 3D traslúcido
    const isFrozen = enemy.statuses.some((s) => s.type === 'frozen');
    if (isFrozen) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-enemy.radius - 5, -enemy.radius * 2 - 5, (enemy.radius + 5) * 2, (enemy.radius + 5) * 2);
      ctx.fillRect(-enemy.radius - 5, -enemy.radius * 2 - 5, (enemy.radius + 5) * 2, (enemy.radius + 5) * 2);
    }

    // 4. Si está aturdido (Stunned)
    if (enemy.stunnedTimer && enemy.stunnedTimer > 0) {
      ctx.font = '14px sans-serif';
      ctx.fillText('💫💫', 0, -enemy.radius * 2 - 25);
    }

    // 5. Cuerpo del enemigo
    if (enemy.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = enemy.color;
    }

    ctx.beginPath();
    ctx.arc(0, -enemy.radius * 0.6, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    // Avatar / Cara del enemigo
    ctx.font = `${Math.floor(enemy.radius * 1.3)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.avatar, 0, -enemy.radius * 0.7);

    // 6. Barra de Vida para enemigos normales (los jefes usan la gran barra superior)
    if (enemy.archetype !== 'boss') {
      const barW = Math.max(32, enemy.radius * 2.2);
      const barH = 4;
      const hpPct = Math.max(0, enemy.hp / enemy.maxHp);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-barW / 2, -enemy.radius * 2 - 12, barW, barH);
      ctx.fillStyle = hpPct > 0.4 ? '#22c55e' : '#ef4444';
      ctx.fillRect(-barW / 2, -enemy.radius * 2 - 12, barW * hpPct, barH);
    }

    // 7. Iconos de Estados Activos
    let stateIcons = '';
    enemy.statuses.forEach((s) => {
      if (s.type === 'burning') stateIcons += '🔥';
      if (s.type === 'frozen') stateIcons += '🧊';
      if (s.type === 'slowed') stateIcons += '❄️';
      if (s.type === 'shocked') stateIcons += '⚡';
    });
    if (stateIcons) {
      ctx.font = '11px sans-serif';
      ctx.fillText(stateIcons, 0, -enemy.radius * 2 - 18);
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

  // DIBUJO DE PROYECTILES CON SILUETAS FÍSICAS RECONOCIBLES Y TAMAÑO DRAMÁTICO
  private static drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
    projectiles.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);

      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(p.rotation !== undefined ? p.rotation : angle);

      // A. FUEGO: Cometa de llamas incandescentes de gran escala con flamas vivas
      if (p.spellType === 'fire_shot' || p.spellType === 'fire_inferno') {
        const time = Date.now() * 0.02;
        const scale = p.spellType === 'fire_inferno' ? 1.4 : 1.1;

        // Resplandor cálido exterior
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 18;

        // Flamas exteriores danzantes
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(18 * scale, 0);
        ctx.lineTo(-24 * scale, -14 * scale + Math.sin(time * 3) * 4);
        ctx.lineTo(-12 * scale, 0);
        ctx.lineTo(-24 * scale, 14 * scale + Math.cos(time * 3) * 4);
        ctx.closePath();
        ctx.fill();

        // Cuerpo medio de fuego naranja
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(2 * scale, 0, 14 * scale, 10 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo blanco-amarillo supercaliente
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(4 * scale, 0, 8 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // B. HIELO: Lanza / Cristal puntiagudo geométrico facetado y brillante
      else if (p.spellType === 'ice_shard' || p.spellType === 'ice_lance') {
        const scale = p.spellType === 'ice_lance' ? 1.3 : 1.0;

        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 14;

        // Faceta exterior cristalina
        ctx.fillStyle = '#67e8f9';
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        ctx.moveTo(26 * scale, 0); // Punta frontal afilada
        ctx.lineTo(0, -9 * scale);
        ctx.lineTo(-18 * scale, 0); // Cola
        ctx.lineTo(0, 9 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Facetas internas reflectantes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(16 * scale, 0);
        ctx.lineTo(0, -4 * scale);
        ctx.lineTo(-10 * scale, 0);
        ctx.closePath();
        ctx.fill();
      }
      // C. TIERRA: Megalito de piedra maciza irregular con fisuras y aristas marcadas
      else if (p.spellType === 'earth_toss' || p.spellType === 'earth_megalith') {
        const scale = p.spellType === 'earth_megalith' ? 1.4 : 1.1;

        ctx.fillStyle = '#78716c';
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 3;

        // Polígono irregular de roca con 8 vértices marcados
        ctx.beginPath();
        ctx.moveTo(18 * scale, -6 * scale);
        ctx.lineTo(8 * scale, -16 * scale);
        ctx.lineTo(-10 * scale, -14 * scale);
        ctx.lineTo(-18 * scale, 2 * scale);
        ctx.lineTo(-12 * scale, 16 * scale);
        ctx.lineTo(4 * scale, 16 * scale);
        ctx.lineTo(16 * scale, 8 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Relieve y grietas de granito oscuro
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4 * scale, -10 * scale);
        ctx.lineTo(2 * scale, 2 * scale);
        ctx.lineTo(-10 * scale, 8 * scale);
        ctx.stroke();
      }
      // D. CHOQUE TÉRMICO (FUEGO + HIELO): Núcleo dual vapor/escarcha
      else if (p.spellType === 'thermal_shock') {
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 18;

        // Mitad ígnea roja
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, -5, 12, 0, Math.PI * 2);
        ctx.fill();

        // Mitad helada azul
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 5, 12, 0, Math.PI * 2);
        ctx.fill();

        // Anillo de vapor blanco
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
      }
      // E. ERUPCIÓN DE MAGMA: Roca volcánica incandescente
      else if (p.spellType === 'magma_eruption') {
        ctx.fillStyle = '#ea580c';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(4, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      // F. SOBRECARGA EXPLOSIVA: Bólido de plasma hipersónico
      else if (p.spellType === 'explosive_overload') {
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 24;

        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      // G. TORMENTA CRIOGÉNICA (HIELO + RAYO): Estrella de escarcha electrificada
      else if (p.spellType === 'cryo_storm') {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;

        // Rombo de hielo
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(0, -9);
        ctx.lineTo(-14, 0);
        ctx.lineTo(0, 9);
        ctx.closePath();
        ctx.fill();

        // Corona eléctrica amarilla
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // H. CATACLISMO ELEMENTAL: Esfera de plasma tetracromática
      else if (p.spellType === 'elemental_cataclysm') {
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 25;

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(3, -3, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(-3, 3, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // I. PROYECTIL ENEMIGO (HOSTIL): Esfera de sombra umbría con núcleo púrpura/carmesí
      else if (p.isHostile) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 16;

        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      // J. Chispa Arcana Básica y Destellos Mágicos
      else {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo brillante
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(2, p.radius * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // Dibuja Partículas
  private static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    particles.forEach((pt) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      if (pt.type === 'ring') {
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // Dibuja Textos Flotantes
  private static drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
    texts.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.opacity);
      ctx.font = `bold ${t.fontSize}px sans-serif`;
      ctx.fillStyle = t.color;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 5;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
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

  // Dibuja las llamas vivas en 2.5D, vórtice de implosión y la detonación estelar de la Corona Infernal
  private static drawInfernalCrownFlames(ctx: CanvasRenderingContext2D, crowns: InfernalCrownEntity[]) {
    if (!crowns || crowns.length === 0) return;

    const squish = 0.58;

    crowns.forEach((crown) => {
      ctx.save();

      if (crown.phase === 'preparation') {
        const prog = Math.min(1, crown.phaseTimer / crown.prepDurationMs);
        // Pequeño orbe de ignición que vibra y crece en el centro
        const coreR = 5 + prog * 9 + Math.sin(crown.phaseTimer * 0.04) * 2;
        const coreGrad = ctx.createRadialGradient(crown.x, crown.y - 8, 2, crown.x, crown.y - 8, coreR * 1.8);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.3, '#fef08a');
        coreGrad.addColorStop(0.7, '#f97316');
        coreGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(crown.x, crown.y - 8, coreR * 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (crown.phase === 'expansion') {
        const r = crown.currentRadius;
        const count = 20;

        // Pared de fuego expansiva proyectada en 2.5D
        for (let i = 0; i < count; i++) {
          const ang = (i / count) * Math.PI * 2 + crown.phaseTimer * 0.002;
          const bx = crown.x + Math.cos(ang) * r;
          const by = crown.y + Math.sin(ang) * r * squish;
          const h = 20 + Math.sin(crown.phaseTimer * 0.015 + i * 1.7) * 8;
          const w = 7;

          // Lengua de fuego viva
          ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
          ctx.beginPath();
          ctx.moveTo(bx - w, by);
          ctx.quadraticCurveTo(bx - w * 0.6, by - h * 0.6, bx, by - h);
          ctx.quadraticCurveTo(bx + w * 0.6, by - h * 0.6, bx + w, by);
          ctx.closePath();
          ctx.fill();

          // Núcleo brillante
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(bx - w * 0.4, by);
          ctx.quadraticCurveTo(bx, by - h * 0.5, bx, by - h * 0.7);
          ctx.quadraticCurveTo(bx, by - h * 0.5, bx + w * 0.4, by);
          ctx.closePath();
          ctx.fill();
        }
      } else if (crown.phase === 'ring') {
        // CORONA DE LLAMAS VIVAS EN 2.5D (Fase C)
        const r = crown.maxRadius;
        const numFlames = 28;

        for (let i = 0; i < numFlames; i++) {
          const ang = (i / numFlames) * Math.PI * 2 + crown.phaseTimer * 0.0004;
          const bx = crown.x + Math.cos(ang) * r;
          const by = crown.y + Math.sin(ang) * r * squish;

          // Altura y curvatura de la llama viva
          const wave = Math.sin(crown.phaseTimer * 0.009 + i * 1.4);
          const wave2 = Math.cos(crown.phaseTimer * 0.018 + i * 2.1);
          const h = 28 + wave * 14 + wave2 * 6;
          const w = 9 + Math.sin(crown.phaseTimer * 0.01 + i) * 2;
          const tipX = bx + wave * 5;
          const tipY = by - h;

          // 1. Capa de resplandor exterior rojo fuego
          ctx.fillStyle = 'rgba(234, 88, 12, 0.6)';
          ctx.beginPath();
          ctx.moveTo(bx - w * 1.3, by);
          ctx.quadraticCurveTo(bx - w, by - h * 0.55, tipX, tipY - 4);
          ctx.quadraticCurveTo(bx + w, by - h * 0.55, bx + w * 1.3, by);
          ctx.closePath();
          ctx.fill();

          // 2. Cuerpo de llama naranja vivo
          ctx.fillStyle = 'rgba(249, 115, 22, 0.9)';
          ctx.beginPath();
          ctx.moveTo(bx - w, by);
          ctx.quadraticCurveTo(bx - w * 0.7, by - h * 0.6, tipX, tipY);
          ctx.quadraticCurveTo(bx + w * 0.7, by - h * 0.6, bx + w, by);
          ctx.closePath();
          ctx.fill();

          // 3. Núcleo incandescente amarillo-blanco
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(bx - w * 0.45, by);
          ctx.quadraticCurveTo(bx - w * 0.3, by - h * 0.5, tipX * 0.8 + bx * 0.2, tipY + h * 0.35);
          ctx.quadraticCurveTo(bx + w * 0.3, by - h * 0.5, bx + w * 0.45, by);
          ctx.closePath();
          ctx.fill();
        }

        // Cinta conectora de la corona (arco de energía ígnea ondulante entre las puntas)
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i <= numFlames; i++) {
          const ang = (i / numFlames) * Math.PI * 2 + crown.phaseTimer * 0.0004;
          const bx = crown.x + Math.cos(ang) * r;
          const by = crown.y + Math.sin(ang) * r * squish;
          const h = 24 + Math.sin(crown.phaseTimer * 0.009 + i * 1.4) * 10;
          const px = bx;
          const py = by - h * 0.6;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      } else if (crown.phase === 'detonation') {
        if (crown.phaseTimer < 180) {
          // Vórtice colapsando rápidamente hacia el centro (Fase D: Convergencia)
          const collapseProg = crown.phaseTimer / 180;
          const curR = crown.currentRadius;
          const count = 16;
          for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2 + collapseProg * Math.PI;
            const bx = crown.x + Math.cos(ang) * curR;
            const by = crown.y + Math.sin(ang) * curR * squish;
            const tipX = crown.x + Math.cos(ang) * (curR * 0.3);
            const tipY = crown.y + Math.sin(ang) * (curR * 0.3) * squish - 12;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.5 * (1 - collapseProg * 0.5);
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();

            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }
        } else {
          // ¡GRAN DETONACIÓN FINAL! (Fase D: Estallido)
          const prog = (crown.phaseTimer - 180) / Math.max(1, crown.detonationDurationMs - 180);
          const alpha = Math.max(0, 1 - prog);
          ctx.globalAlpha = alpha;

          const blastR = crown.maxRadius * (0.4 + prog * 0.95);

          // Resplandor cegador con gradiente radial masivo
          const blastGrad = ctx.createRadialGradient(crown.x, crown.y - 15, 5, crown.x, crown.y - 15, blastR);
          blastGrad.addColorStop(0, '#ffffff');
          blastGrad.addColorStop(0.2, '#fef08a');
          blastGrad.addColorStop(0.55, '#f97316');
          blastGrad.addColorStop(0.85, '#dc2626');
          blastGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
          ctx.fillStyle = blastGrad;
          ctx.beginPath();
          ctx.ellipse(crown.x, crown.y - 15, blastR, blastR * squish * 1.2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Destellos en estrella de 8 puntas
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3 * alpha;
          for (let s = 0; s < 8; s++) {
            const sAng = (s / 8) * Math.PI * 2;
            const sLen = blastR * 1.25;
            ctx.beginPath();
            ctx.moveTo(crown.x, crown.y - 15);
            ctx.lineTo(crown.x + Math.cos(sAng) * sLen, crown.y - 15 + Math.sin(sAng) * sLen * squish);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    });
  }

  // BARRA DE SALUD SUPERIOR DEL JEFE (HUD)
  private static drawBossHUD(ctx: CanvasRenderingContext2D, width: number, boss: GameEnemy) {
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

      // Culling del segmento del sendero
      const minY = Math.min(p1.y, p2.y) - 200;
      const maxY = Math.max(p1.y, p2.y) + 200;
      if (maxY < frustum.top || minY > frustum.bottom) continue;

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

    // 3. Plaza de Adoquines en el Checkpoint (Y ~ 3980)
    if (frustum.bottom >= 3700 && frustum.top <= 4300) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(900, 3860, 600, 240);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      for (let sy = 3880; sy < 4100; sy += 30) {
        ctx.beginPath();
        ctx.moveTo(920, sy);
        ctx.lineTo(1480, sy);
        ctx.stroke();
      }

      // Runa / Conducto Criogénico en el suelo entre la Rueda (960, 4050) y el Portón (1200, 3980)
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

    // 4. Gran Arena del Jefe / Santuario Megalítico (Y <= 2600)
    if (frustum.top <= 2600) {
      const arenaCenterX = 1200;
      const arenaCenterY = 1600;
      const arenaRadius = 420;

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
  }

  // CAPA 2 (Y-SORTED): Tronco de árbol y raíces en el suelo
  private static drawTreeTrunk(ctx: CanvasRenderingContext2D, tree: ForestTreeEntity) {
    const tx = tree.x;
    const ty = tree.y;
    const r = tree.trunkRadius;
    const squish = 0.58;

    // Sombra del tronco en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(tx, ty + 2, r * 1.4, r * 1.4 * squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // Raíces y ensanchamiento en la base
    ctx.fillStyle = tree.trunkColor;
    ctx.beginPath();
    ctx.moveTo(tx - r * 1.3, ty + 2);
    ctx.lineTo(tx - r * 0.7, ty - tree.canopyHeight * 0.25);
    ctx.lineTo(tx + r * 0.7, ty - tree.canopyHeight * 0.25);
    ctx.lineTo(tx + r * 1.3, ty + 2);
    ctx.closePath();
    ctx.fill();

    // Columna del tronco
    ctx.fillRect(tx - r * 0.7, ty - tree.canopyHeight * 0.75, r * 1.4, tree.canopyHeight * 0.55);

    // Corteza iluminada
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tx - r * 0.2, ty - tree.canopyHeight * 0.7);
    ctx.lineTo(tx - r * 0.2, ty - 2);
    ctx.stroke();
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
    const cx = tree.x;
    const cy = tree.y - tree.canopyHeight;
    const r = tree.canopyRadius;

    if (tree.treeType === 'pine') {
      // Pino / Abeto: 3 niveles triangulares superpuestos
      const levels = 3;
      for (let lvl = 0; lvl < levels; lvl++) {
        const lvlR = r * (1 - lvl * 0.22);
        const lvlY = cy + lvl * (r * 0.38);
        const lvlH = r * 0.75;

        ctx.fillStyle = lvl === 0 ? '#1b4324' : lvl === 1 ? tree.foliageColor : '#102e17';
        ctx.beginPath();
        ctx.moveTo(cx, lvlY - lvlH);
        ctx.lineTo(cx + lvlR, lvlY);
        ctx.lineTo(cx - lvlR, lvlY);
        ctx.closePath();
        ctx.fill();

        // Borde escarchado superior
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else if (tree.treeType === 'oak') {
      // Roble frondoso: racimos circulares de follaje
      const clumps = [
        { ox: 0, oy: 0, cr: r * 0.8 },
        { ox: -r * 0.42, oy: r * 0.2, cr: r * 0.58 },
        { ox: r * 0.42, oy: r * 0.2, cr: r * 0.58 },
        { ox: -r * 0.25, oy: -r * 0.3, cr: r * 0.52 },
        { ox: r * 0.25, oy: -r * 0.3, cr: r * 0.52 },
      ];

      clumps.forEach((c, idx) => {
        ctx.fillStyle = idx === 0 ? tree.foliageColor : (idx % 2 === 0 ? '#1b4d24' : '#225d2b');
        ctx.beginPath();
        ctx.arc(cx + c.ox, cy + c.oy, c.cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
    } else {
      // Árbol ancestral: copa colosal con sombras profundas
      ctx.fillStyle = '#0f2916';
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tree.foliageColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, r * 0.82, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

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
}
