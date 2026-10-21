import React, { useState } from 'react';
import { Player, BaseElement, ElementSkillNode, FusedSpell } from '../types';
import { ELEMENT_SKILLS, ELEMENTAL_FUSIONS } from '../services/gameData';
import {
  Sparkles,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { sound } from '../services/soundService';
import confetti from 'canvas-confetti';

interface SkillsViewProps {
  player: Player;
  onUnlockSkill: (skillId: string, costSP: number) => void;
  onUnlockFusion: (fusionId: string) => void;
  onEquipSpell: (spell: ElementSkillNode | FusedSpell) => void;
}

interface RadialNode {
  id: string;
  name: string;
  category: 'core' | 'fire' | 'lightning' | 'earth' | 'ice' | 'fusion';
  element?: BaseElement;
  tier: number;
  x: number; // Coordenada en el plano SVG de 400x400
  y: number;
  costSP: number;
  description: string;
  bonus: string;
  icon: string;
  isFusion?: boolean;
  fusionId?: string;
  requires: string[]; // IDs de nodos previos necesarios
  color: string;
}

export const SkillsView: React.FC<SkillsViewProps> = ({
  player,
  onUnlockSkill,
  onUnlockFusion,
  onEquipSpell,
}) => {
  // Centro del árbol radial en (200, 200)
  const CX = 200;
  const CY = 200;

  // NODOS DEL ÁRBOL RADIAL (Centro -> 4 Ramas Cardinales + 4 Fusiones Diagonales)
  const radialNodes: RadialNode[] = [
    // CENTRO: Núcleo Arcano
    {
      id: 'core',
      name: 'Núcleo de Maná Arcano',
      category: 'core',
      tier: 0,
      x: CX,
      y: CY,
      costSP: 0,
      description: 'El corazón de tu poder mágico. De aquí nacen todas las ramas elementales.',
      bonus: 'Origen Arcano',
      icon: '✨',
      requires: [],
      color: '#a855f7',
    },

    // ==========================================
    // RAMA NORTE: RAYO ⚡ (x=200, y disminuye hacia arriba)
    // ==========================================
    {
      id: 'lightning-1',
      name: 'Chispa Estática',
      category: 'lightning',
      element: 'lightning',
      tier: 1,
      x: CX,
      y: CY - 65,
      costSP: 1,
      description: 'Descarga eléctrica rápida que golpea antes de que el enemigo reaccione.',
      bonus: 'Daño x1.25',
      icon: '⚡',
      requires: ['core'],
      color: '#facc15',
    },
    {
      id: 'lightning-2',
      name: 'Rayo Penetrante',
      category: 'lightning',
      element: 'lightning',
      tier: 2,
      x: CX,
      y: CY - 125,
      costSP: 2,
      description: 'Atraviesa defensas enemigas y conecta creeps en cadena.',
      bonus: 'Daño x1.7',
      icon: '⚡',
      requires: ['lightning-1'],
      color: '#facc15',
    },
    {
      id: 'lightning-3',
      name: 'Juicio del Trueno',
      category: 'lightning',
      element: 'lightning',
      tier: 3,
      x: CX,
      y: CY - 175,
      costSP: 4,
      description: 'Poder celestial con 50% de probabilidad de daño crítico doble.',
      bonus: 'Daño x2.4',
      icon: '⚡',
      requires: ['lightning-2'],
      color: '#facc15',
    },

    // ==========================================
    // RAMA ESTE: FUEGO 🔥 (y=200, x aumenta hacia la derecha)
    // ==========================================
    {
      id: 'fire-1',
      name: 'Chispa Ardiente',
      category: 'fire',
      element: 'fire',
      tier: 1,
      x: CX + 65,
      y: CY,
      costSP: 1,
      description: 'Flama concentrada que inicia la combustión de los creeps.',
      bonus: 'Daño x1.2',
      icon: '🔥',
      requires: ['core'],
      color: '#ef4444',
    },
    {
      id: 'fire-2',
      name: 'Llamarada Voraz',
      category: 'fire',
      element: 'fire',
      tier: 2,
      x: CX + 125,
      y: CY,
      costSP: 2,
      description: 'Columna de fuego expansiva que incinera las resistencias.',
      bonus: 'Daño x1.6',
      icon: '🔥',
      requires: ['fire-1'],
      color: '#ef4444',
    },
    {
      id: 'fire-3',
      name: 'Fénix del Renacer',
      category: 'fire',
      element: 'fire',
      tier: 3,
      x: CX + 175,
      y: CY,
      costSP: 4,
      description: 'Poder supremo de fuego que inflige daño masivo y restaura HP.',
      bonus: 'Daño x2.2',
      icon: '🔥',
      requires: ['fire-2'],
      color: '#ef4444',
    },

    // ==========================================
    // RAMA SUR: TIERRA 🌍 (x=200, y aumenta hacia abajo)
    // ==========================================
    {
      id: 'earth-1',
      name: 'Golpe Telúrico',
      category: 'earth',
      element: 'earth',
      tier: 1,
      x: CX,
      y: CY + 65,
      costSP: 1,
      description: 'Impacta el suelo arrojando rocas contundentes.',
      bonus: 'Daño x1.15',
      icon: '🌍',
      requires: ['core'],
      color: '#10b981',
    },
    {
      id: 'earth-2',
      name: 'Muro de Granito',
      category: 'earth',
      element: 'earth',
      tier: 2,
      x: CX,
      y: CY + 125,
      costSP: 2,
      description: 'Eleva placas telúricas masivas que amortiguan ataques.',
      bonus: 'Daño x1.45',
      icon: '🌍',
      requires: ['earth-1'],
      color: '#10b981',
    },
    {
      id: 'earth-3',
      name: 'Terremoto Cataclísmico',
      category: 'earth',
      element: 'earth',
      tier: 3,
      x: CX,
      y: CY + 175,
      costSP: 4,
      description: 'Fractura la tierra con peñascos gigantescos y rompe escudos.',
      bonus: 'Daño x2.1',
      icon: '🌍',
      requires: ['earth-2'],
      color: '#10b981',
    },

    // ==========================================
    // RAMA OESTE: HIELO ❄️ (y=200, x disminuye hacia la izquierda)
    // ==========================================
    {
      id: 'ice-1',
      name: 'Daga Gélida',
      category: 'ice',
      element: 'ice',
      tier: 1,
      x: CX - 65,
      y: CY,
      costSP: 1,
      description: 'Proyectil de escarcha afilada que enfría al enemigo.',
      bonus: 'Daño x1.2',
      icon: '❄️',
      requires: ['core'],
      color: '#38bdf8',
    },
    {
      id: 'ice-2',
      name: 'Ventisca Ártica',
      category: 'ice',
      element: 'ice',
      tier: 2,
      x: CX - 125,
      y: CY,
      costSP: 2,
      description: 'Vientos helados que reducen el poder y ralentizan creeps.',
      bonus: 'Daño x1.6',
      icon: '❄️',
      requires: ['ice-1'],
      color: '#38bdf8',
    },
    {
      id: 'ice-3',
      name: 'Cero Absoluto',
      category: 'ice',
      element: 'ice',
      tier: 3,
      x: CX - 175,
      y: CY,
      costSP: 4,
      description: 'Congelamiento supremo que encierra enemigos en cubos de hielo 3D.',
      bonus: 'Daño x2.3',
      icon: '❄️',
      requires: ['ice-2'],
      color: '#38bdf8',
    },

    // ==========================================
    // NODOS DE FUSIÓN EN LAS DIAGONALES (DESBLOQUEO DIRECTO EN EL ÁRBOL)
    // ==========================================
    // Noreste: Rayo + Fuego = Haz de Plasma
    {
      id: 'fusion-fire-lightning',
      name: 'Haz de Plasma',
      category: 'fusion',
      tier: 2,
      x: CX + 75,
      y: CY - 75,
      costSP: 3,
      description: 'Combina calor extremo con alto voltaje. Perfora filas enteras de creeps.',
      bonus: 'Poder 55 (Crítico)',
      icon: '🔮',
      isFusion: true,
      fusionId: 'fusion-fire-lightning',
      requires: ['lightning-1', 'fire-1'],
      color: '#c084fc',
    },
    // Sureste: Fuego + Tierra = Meteorito de Magma
    {
      id: 'fusion-fire-earth',
      name: 'Meteorito de Magma',
      category: 'fusion',
      tier: 2,
      x: CX + 75,
      y: CY + 75,
      costSP: 3,
      description: 'Roca volcánica ardiente que estalla con gran impacto y quema.',
      bonus: 'Poder 50 (Área)',
      icon: '🌋',
      isFusion: true,
      fusionId: 'fusion-fire-earth',
      requires: ['fire-1', 'earth-1'],
      color: '#ea580c',
    },
    // Suroeste: Tierra + Hielo = Bastión de Permafrost
    {
      id: 'fusion-earth-ice',
      name: 'Bastión de Permafrost',
      category: 'fusion',
      tier: 2,
      x: CX - 75,
      y: CY + 75,
      costSP: 3,
      description: 'Hielo milenario fusionado con roca sólida. Otorga defensa colosal.',
      bonus: 'Poder 35 (Escudo)',
      icon: '🏔️',
      isFusion: true,
      fusionId: 'fusion-earth-ice',
      requires: ['earth-1', 'ice-1'],
      color: '#10b981',
    },
    // Noroeste: Hielo + Rayo = Superconductor Ártico
    {
      id: 'fusion-lightning-ice',
      name: 'Superconductor Ártico',
      category: 'fusion',
      tier: 2,
      x: CX - 75,
      y: CY - 75,
      costSP: 3,
      description: 'Temperatura bajo cero que conduce electricidad sin resistencia.',
      bonus: 'Poder 52 (Descarga)',
      icon: '⚡❄️',
      isFusion: true,
      fusionId: 'fusion-lightning-ice',
      requires: ['ice-1', 'lightning-1'],
      color: '#06b6d4',
    },
  ];

  // Nodo seleccionado actualmente para ver detalles
  const [selectedNodeId, setSelectedNodeId] = useState<string>('fire-1');

  // Nivel requerido según tier/fusión (para deleveling y sellado de habilidades)
  const getRequiredLevel = (node: RadialNode): number => {
    if (node.id === 'core') return 1;
    if (node.isFusion) return 4;
    if (node.tier === 1) return 1;
    if (node.tier === 2) return 3;
    if (node.tier === 3) return 6;
    return 1;
  };

  // Comprobar si un nodo está desbloqueado
  const isNodeUnlocked = (node: RadialNode): boolean => {
    if (node.id === 'core') return true;
    if (node.isFusion && node.fusionId) {
      return player.unlockedFusions.includes(node.fusionId);
    }
    return player.unlockedSkills.includes(node.id);
  };

  // Comprobar si cumple los requisitos previos
  const arePrerequisitesMet = (node: RadialNode): boolean => {
    if (node.id === 'core') return true;
    return node.requires.every((reqId) => {
      const parent = radialNodes.find((n) => n.id === reqId);
      return parent ? isNodeUnlocked(parent) : false;
    });
  };

  const selectedNode = radialNodes.find((n) => n.id === selectedNodeId) || radialNodes[1];
  const selectedNodeReqLevel = getRequiredLevel(selectedNode);
  const isSelectedUnlocked = isNodeUnlocked(selectedNode);
  const isSelectedLevelLocked = isSelectedUnlocked && player.level < selectedNodeReqLevel;
  const isSelectedPrereqMet = arePrerequisitesMet(selectedNode);
  const canUnlockSelected = !isSelectedUnlocked && isSelectedPrereqMet && player.skillPoints >= selectedNode.costSP;

  // Comprobar si está equipado
  const isSelectedEquipped = player.equippedSpells.some((s) => s.id === selectedNode.id);

  // Manejar desbloqueo
  const handleUnlockSelected = () => {
    if (!canUnlockSelected) return;

    sound.playLevelUp();
    confetti({ particleCount: 70, spread: 60 });

    if (selectedNode.isFusion && selectedNode.fusionId) {
      onUnlockFusion(selectedNode.fusionId);
    } else {
      onUnlockSkill(selectedNode.id, selectedNode.costSP);
    }
  };

  // Manejar equipamiento
  const handleEquipSelected = () => {
    if (!isSelectedUnlocked || isSelectedLevelLocked) return;

    if (selectedNode.isFusion && selectedNode.fusionId) {
      const fusion = ELEMENTAL_FUSIONS.find((f) => f.id === selectedNode.fusionId);
      if (fusion) onEquipSpell(fusion);
    } else {
      const skill = ELEMENT_SKILLS.find((s) => s.id === selectedNode.id);
      if (skill) onEquipSpell(skill);
    }
  };

  // LISTA DE LÍNEAS / RAMAS CONECTORAS ENTRE NODOS
  const connections: Array<{ from: RadialNode; to: RadialNode }> = [];
  radialNodes.forEach((node) => {
    node.requires.forEach((reqId) => {
      const parent = radialNodes.find((n) => n.id === reqId);
      if (parent) {
        connections.push({ from: parent, to: node });
      }
    });
  });

  return (
    <div className="max-w-xl mx-auto px-3 py-3 pb-24 space-y-3 select-none">
      {/* Cabecera del Árbol Radial */}
      <div className="bg-[#121420] border-2 border-stone-800 rounded-3xl p-3.5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/50 flex items-center justify-center text-amber-300">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-black text-sm text-stone-100">Árbol de Habilidades Radial</h3>
            <p className="text-[10px] text-stone-400">
              Expande las ramas desde el núcleo central y desbloquea poderes y fusiones.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-black text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-600/40">
            {player.skillPoints} SP
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* EL ÁRBOL RADIAL SVG (CENTRO CON RAMAS EXPANDIÉNDOSE HACIA AFUERA) */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-b from-[#131522] via-[#0b0c14] to-[#131522] border-2 border-stone-800 rounded-3xl p-2 shadow-2xl relative overflow-hidden flex items-center justify-center">
        {/* Guías circulares concéntricas de fondo (los 3 anillos del árbol) */}
        <svg viewBox="0 0 400 400" className="w-full max-w-[390px] aspect-square block">
          <defs>
            {/* Gradientes para las ramas */}
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Anillos concéntricos de fondo */}
          <circle cx={CX} cy={CY} r={65} fill="none" stroke="#1c1f30" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx={CX} cy={CY} r={125} fill="none" stroke="#1c1f30" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx={CX} cy={CY} r={175} fill="none" stroke="#1c1f30" strokeWidth="1" strokeDasharray="4 4" />

          {/* Resplandor del núcleo central */}
          <circle cx={CX} cy={CY} r={40} fill="url(#coreGlow)" />

          {/* 1. LÍNEAS / RAMAS CONECTORAS ENTRE NODOS */}
          {connections.map((conn, idx) => {
            const isTargetUnlocked = isNodeUnlocked(conn.to);
            const isSourceUnlocked = isNodeUnlocked(conn.from);
            const isPathActive = isSourceUnlocked && isTargetUnlocked;
            const isPathAvailable = isSourceUnlocked && !isTargetUnlocked;

            return (
              <g key={idx}>
                {/* Línea base */}
                <line
                  x1={conn.from.x}
                  y1={conn.from.y}
                  x2={conn.to.x}
                  y2={conn.to.y}
                  stroke={
                    isPathActive
                      ? conn.to.color
                      : isPathAvailable
                      ? '#44403c'
                      : '#1c1917'
                  }
                  strokeWidth={isPathActive ? 3.5 : 2}
                  strokeDasharray={isPathActive ? 'none' : '4 3'}
                  strokeLinecap="round"
                />

                {/* Resplandor si está activa */}
                {isPathActive && (
                  <line
                    x1={conn.from.x}
                    y1={conn.from.y}
                    x2={conn.to.x}
                    y2={conn.to.y}
                    stroke={conn.to.color}
                    strokeWidth={7}
                    strokeOpacity={0.35}
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}

          {/* 2. DIBUJAR CADA NODO RADIAL INTERACTIVO */}
          {radialNodes.map((node) => {
            const unlocked = isNodeUnlocked(node);
            const reqLvl = getRequiredLevel(node);
            const isLevelLocked = unlocked && player.level < reqLvl;
            const prereqMet = arePrerequisitesMet(node);
            const isSelected = selectedNodeId === node.id;
            const isCore = node.id === 'core';
            const nodeRadius = isCore ? 20 : node.isFusion ? 17 : 15;

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
              >
                {/* Resplandor de selección */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 6}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    strokeDasharray="3 3"
                    className="animate-spin"
                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                  />
                )}

                {/* Círculo exterior del nodo */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill={
                    isLevelLocked
                      ? '#1c0a0a'
                      : unlocked
                      ? '#0d0f17'
                      : prereqMet
                      ? '#171926'
                      : '#0a0a0f'
                  }
                  stroke={
                    isLevelLocked
                      ? '#ef4444'
                      : unlocked
                      ? node.color
                      : prereqMet
                      ? '#57534e'
                      : '#292524'
                  }
                  strokeWidth={unlocked ? 3 : 2}
                />

                {/* Resplandor de desbloqueado */}
                {unlocked && !isLevelLocked && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 2}
                    fill="none"
                    stroke={node.color}
                    strokeWidth={1.5}
                    strokeOpacity={0.6}
                  />
                )}

                {/* Indicador de bloqueo por degradación */}
                {isLevelLocked && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 2}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    strokeOpacity={0.8}
                  />
                )}

                {/* Icono del nodo */}
                <text
                  x={node.x}
                  y={node.y + (node.isFusion ? 3.5 : 4)}
                  fontSize={isCore ? 14 : node.isFusion ? 11 : 12}
                  textAnchor="middle"
                  fill="#ffffff"
                  className="pointer-events-none select-none font-bold"
                >
                  {unlocked ? node.icon : prereqMet ? node.icon : '🔒'}
                </text>

                {/* Candado rojo superpuesto si está bloqueada por nivel */}
                {isLevelLocked && (
                  <text
                    x={node.x + 9}
                    y={node.y - 7}
                    fontSize={10}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    🔒
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Leyenda de las Ramas */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] font-bold text-stone-500 uppercase px-2 pointer-events-none">
          <span>❄️ Hielo (Oeste)</span>
          <span>⚡ Rayo (Norte)</span>
          <span>🔥 Fuego (Este)</span>
          <span>🌍 Tierra (Sur)</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. PANEL DE DETALLES DEL NODO SELECCIONADO */}
      {/* ============================================================== */}
      <div className="bg-[#121420] border-2 border-stone-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-xl shrink-0 shadow-inner bg-black/60"
              style={{ borderColor: selectedNode.color }}
            >
              {selectedNode.icon}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-stone-100">{selectedNode.name}</h4>
                {selectedNode.isFusion && (
                  <span className="text-[9px] font-black text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-600/50">
                    FUSIÓN
                  </span>
                )}
                {isSelectedUnlocked && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>

              <p className="text-xs text-stone-300 mt-0.5 leading-snug">
                {selectedNode.description}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-amber-300 font-bold bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                  {selectedNode.bonus}
                </span>
                <span className="text-[10px] text-stone-400 font-semibold bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                  Requiere Nivel {selectedNodeReqLevel}
                </span>
                {!isSelectedUnlocked && selectedNode.id !== 'core' && (
                  <span className="text-[10px] text-stone-400">
                    Costo: <strong>{selectedNode.costSP} SP</strong>
                  </span>
                )}
              </div>

              {/* Alerta de habilidad sellada por degradación */}
              {isSelectedLevelLocked && (
                <div className="mt-2 bg-red-950/70 border border-red-500/60 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-[11px] text-red-200">
                  <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>
                    <strong className="text-red-300">Sellada por degradación:</strong> Requiere Nivel {selectedNodeReqLevel} (Nivel actual: {player.level}). ¡Sube de nivel para reactivarla!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* BOTÓN DE ACCIÓN (DESBLOQUEAR O EQUIPAR) */}
          <div className="shrink-0 self-center">
            {selectedNode.id === 'core' ? (
              <span className="text-[10px] font-bold text-purple-400 bg-purple-950 px-2 py-1 rounded-xl border border-purple-800">
                Núcleo Activo
              </span>
            ) : isSelectedLevelLocked ? (
              <button
                disabled
                className="px-3 py-2 bg-red-950/80 text-red-400 border border-red-800/80 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-90 shadow"
                title={`Requiere Nivel ${selectedNodeReqLevel} para equiparse`}
              >
                <Lock className="w-3.5 h-3.5 text-red-500" />
                <span>Nv. {selectedNodeReqLevel} Req.</span>
              </button>
            ) : isSelectedUnlocked ? (
              <button
                onClick={handleEquipSelected}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                  isSelectedEquipped
                    ? 'bg-cyan-600 text-white'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                }`}
              >
                {isSelectedEquipped ? 'Equipado' : 'Equipar'}
              </button>
            ) : canUnlockSelected ? (
              <button
                onClick={handleUnlockSelected}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition"
              >
                Desbloquear ({selectedNode.costSP} SP)
              </button>
            ) : (
              <div className="text-center">
                <span className="text-[10px] font-bold text-stone-500 bg-stone-900 px-2.5 py-1 rounded-xl border border-stone-800 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {!isSelectedPrereqMet ? 'Bloqueado' : `${selectedNode.costSP} SP requeridos`}
                </span>
                {!isSelectedPrereqMet && (
                  <span className="text-[9px] text-stone-500 block mt-0.5">
                    Desbloquea el nodo anterior
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
