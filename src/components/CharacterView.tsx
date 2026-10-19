import React, { useState } from 'react';
import { Player, StatType } from '../types';
import { WizardAvatar } from './WizardAvatar';
import {
  Swords,
  Zap,
  Shield,
  BookOpen,
  Sparkles,
  Edit2,
  Check,
  ShieldAlert
} from 'lucide-react';

interface CharacterViewProps {
  player: Player;
  onUpdateName: (newName: string) => void;
  onAllocateStat: (stat: StatType) => void;
}

export const CharacterView: React.FC<CharacterViewProps> = ({
  player,
  onUpdateName,
  onAllocateStat,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateName(nameInput.trim());
      setIsEditing(false);
    }
  };

  // Determinar elemento activo del mago según fisiones o hechizo equipado
  const getActiveElement = (): 'fire' | 'lightning' | 'earth' | 'ice' | 'plasma' | 'magma' => {
    if (player.unlockedFusions.includes('fusion-fire-lightning')) return 'plasma';
    if (player.unlockedFusions.includes('fusion-fire-earth')) return 'magma';
    if (player.equippedSpells.length > 0) {
      const sp = player.equippedSpells[0];
      if ('element' in sp) return sp.element;
    }
    return 'fire';
  };

  const statDetails = [
    {
      id: 'attack' as StatType,
      name: 'Ataque',
      value: player.stats.attack || 10,
      desc: 'Aumenta el poder de tus hechizos y daño en mazmorras.',
      icon: Swords,
      color: 'text-rose-400 bg-rose-950/40 border-rose-800/40',
      btnColor: 'bg-rose-600 hover:bg-rose-500',
    },
    {
      id: 'speed' as StatType,
      name: 'Velocidad',
      value: player.stats.speed || 10,
      desc: 'Aumenta tu agilidad para moverte y esquivar ataques.',
      icon: Zap,
      color: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
      btnColor: 'bg-amber-600 hover:bg-amber-500',
    },
    {
      id: 'defense' as StatType,
      name: 'Resistencia',
      value: player.stats.defense || 10,
      desc: 'Aumenta tu armadura, absorción de daño y vida máxima.',
      icon: Shield,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500',
    },
    {
      id: 'knowledge' as StatType,
      name: 'Conocimiento',
      value: player.stats.knowledge || 10,
      desc: 'Aumenta tu sabiduría y otorga puntos de skill (SP).',
      icon: BookOpen,
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
      btnColor: 'bg-cyan-600 hover:bg-cyan-500',
    },
  ];

  return (
    <div className="max-w-xl mx-auto px-3 py-4 pb-24 space-y-4">
      {/* TARJETA DEL HÉROE CON SPRITE DEL MAGO DIBUJADO EN VIVO */}
      <div className="bg-gradient-to-b from-[#181a26] to-[#111219] border-2 border-stone-700/80 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-center">
        {/* Decoración de enredaderas en las esquinas */}
        <div className="absolute top-2 left-2 text-[10px] text-emerald-600 font-bold tracking-widest uppercase">
          🌿 Refugio del Mago
        </div>

        {/* SPRITE DE MAGO INTERACTIVO */}
        <div className="my-1">
          <WizardAvatar
            size={150}
            scale={2.6}
            activeElement={getActiveElement()}
            isAnimated={true}
          />
        </div>

        {/* Nombre y Título del Mago */}
        <div className="flex items-center justify-center gap-2 mt-1">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="bg-[#1b2035] border border-cyan-500 rounded-lg px-2.5 py-1 text-xs text-white text-center"
              />
              <button
                onClick={handleSaveName}
                className="p-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-xl text-stone-100">{player.name}</h3>
              <button
                onClick={() => setIsEditing(true)}
                className="text-stone-400 hover:text-white"
                title="Editar Nombre"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-purple-400 font-bold mt-0.5">{player.title}</p>

        {/* Estado del Héroe */}
        {player.currentHp <= 25 ? (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/70 border border-red-500/50 text-[11px] text-red-200">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Debilitado por Procrastinar ({player.currentHp} HP)</span>
          </div>
        ) : (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/40 text-[11px] text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Enfoque Óptimo ({player.cleanStreakDays} días de racha)</span>
          </div>
        )}
      </div>

      {/* ATRIBUTOS DEL MAGO (LIMPIO Y FÁCIL DE ENTENDER) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
            Atributos de tu Vida Real
          </h4>
          {player.skillPoints > 0 && (
            <span className="text-xs font-bold text-amber-400 bg-amber-950/70 px-2.5 py-0.5 rounded-full border border-amber-600/40 animate-pulse">
              +{player.skillPoints} Puntos disponibles
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {statDetails.map((stat) => {
            const Icon = stat.icon;
            const canLevelUp = player.skillPoints > 0;

            return (
              <div
                key={stat.id}
                className="bg-[#13151f] border border-stone-800 p-3 rounded-2xl flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1.5 rounded-lg border ${stat.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-stone-200">{stat.name}</span>
                    </div>

                    <span className="font-mono font-black text-sm text-stone-100">
                      {stat.value}
                    </span>
                  </div>

                  <p className="text-[10px] text-stone-400 mt-1 leading-snug">{stat.desc}</p>
                </div>

                {canLevelUp && (
                  <button
                    onClick={() => onAllocateStat(stat.id)}
                    className={`mt-2 w-full py-1 text-white font-bold text-[11px] rounded-xl transition shadow ${stat.btnColor}`}
                  >
                    +1 {stat.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
