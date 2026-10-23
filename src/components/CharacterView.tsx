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
  ShieldAlert,
  Skull,
  TrendingDown,
  Trophy,
} from 'lucide-react';

interface CharacterViewProps {
  player: Player;
  onUpdateName: (newName: string) => void;
  onAllocateStat: (stat: StatType) => void;
  onOpenProgressModal?: () => void;
}

export const CharacterView: React.FC<CharacterViewProps> = ({
  player,
  onUpdateName,
  onAllocateStat,
  onOpenProgressModal,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);
  const [now] = useState(() => Date.now());

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
      {/* TARJETA DEL HÉROE CON SPRITE DEL MAGO DIBUJADO EN VIVO (16-BIT) */}
      <div className="retro-box-stone p-4 text-center relative overflow-hidden">
        {/* Decoración de enredaderas en las esquinas */}
        <div className="absolute top-2 left-2 font-pixel-title text-[7px] text-emerald-400 tracking-wider uppercase">
          🌿 Refugio del Mago
        </div>

        {/* SPRITE DE MAGO INTERACTIVO */}
        <div className="my-1 flex justify-center">
          <WizardAvatar
            size={130}
            scale={2.4}
            activeElement={getActiveElement()}
            isAnimated={true}
          />
        </div>

        {/* Nombre y Título del Mago */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="bg-[#090a10] border-2 border-[#18181b] outline-1 outline-[#334155] px-2 py-1 font-pixel-title text-xs text-white text-center"
              />
              <button
                onClick={handleSaveName}
                className="retro-btn-emerald p-1.5 text-white"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h3 className="font-pixel-title text-sm text-stone-100 drop-shadow-[2px_2px_0px_#000]">{player.name}</h3>
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

        <p className="font-pixel-title text-[8px] text-purple-400 font-bold mt-1 uppercase">{player.title}</p>

        {/* Estado del Héroe y Efectos de Castigo */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
          {player.isAgony && (
            <div className="retro-badge bg-red-950 text-red-200 border-red-500 animate-pulse flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>En Agonía / Bancarrota (Piso Nivel 1)</span>
            </div>
          )}
          {player.curseExpiresAt && new Date(player.curseExpiresAt).getTime() > now && (
            <div className="retro-badge bg-purple-950 text-purple-200 border-purple-500 flex items-center gap-1">
              <Skull className="w-3 h-3 text-purple-400" />
              <span>Maldición (-15% EXP)</span>
            </div>
          )}
          {player.currentHp <= 25 ? (
            <div className="retro-badge bg-red-950 text-red-200 border-red-500 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>Debilitado ({player.currentHp} HP)</span>
            </div>
          ) : !player.isAgony && !(player.curseExpiresAt && new Date(player.curseExpiresAt).getTime() > now) && (
            <div className="retro-badge bg-emerald-950 text-emerald-300 border-emerald-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Enfoque Óptimo ({player.cleanStreakDays} días)</span>
            </div>
          )}
        </div>

        {/* BOTÓN PROGRESIÓN DIRECTA E HITOS */}
        {onOpenProgressModal && (
          <div className="mt-3">
            <button
              onClick={onOpenProgressModal}
              className="w-full py-2 px-3 retro-btn-gold flex items-center justify-center gap-2 text-[8px]"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-200" />
              <span>Ver Hitos del Héroe & Progresión Directa</span>
            </button>
          </div>
        )}
      </div>

      {/* ATRIBUTOS DEL MAGO (16-BIT RETRO) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-pixel-title text-[9px] text-stone-300 uppercase tracking-wider">
            Atributos de tu Vida Real
          </h4>
          {player.skillPoints > 0 && (
            <span className="retro-badge bg-amber-950 text-amber-300 border-amber-500 animate-pulse">
              +{player.skillPoints} Puntos disponibles
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {statDetails.map((stat) => {
            const Icon = stat.icon;
            const canLevelUp = player.skillPoints > 0;

            return (
              <div
                key={stat.id}
                className="retro-box-stone p-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1 border ${stat.color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="font-pixel-title text-[8px] text-stone-200">{stat.name}</span>
                    </div>

                    <span className="font-pixel-title text-xs text-amber-400">
                      {stat.value}
                    </span>
                  </div>

                  <p className="font-pixel-text text-xs text-stone-300 mt-0.5 leading-snug">{stat.desc}</p>
                </div>

                {canLevelUp && (
                  <button
                    onClick={() => onAllocateStat(stat.id)}
                    className="mt-2 w-full py-1.5 retro-btn-emerald text-[8px]"
                  >
                    +1 {stat.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* REGISTRO DE CASTIGO: HISTORIAL DE DELEVELING */}
      <div className="retro-box-danger p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-red-950 border border-red-500 text-red-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="font-pixel-title text-[8px] text-stone-200 uppercase tracking-wide">
                Consecuencias Reales: Deleveling
              </h4>
              <p className="font-pixel-text text-xs text-stone-300">
                Pérdidas de nivel y degradación de poder por tareas expiradas.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="retro-badge bg-red-950 text-red-300 border-red-700">
              {player.totalDelevelsSuffered || 0} Niveles Perdidos
            </span>
          </div>
        </div>

        {player.delevelHistory && player.delevelHistory.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            {player.delevelHistory.slice(0, 5).map((record) => (
              <div
                key={record.id}
                className="bg-[#161825] border-2 border-[#18181b] p-2 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-pixel-title text-[8px] text-stone-200 flex items-center gap-1.5">
                    <Skull className="w-3 h-3 text-red-400 shrink-0" />
                    <span>{record.taskTitle}</span>
                  </div>
                  <div className="font-pixel-text text-xs text-stone-300 flex items-center gap-2 mt-0.5">
                    <span>{new Date(record.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className="text-red-400 font-bold">Nv. {record.previousLevel} ➔ Nv. {record.newLevel}</span>
                    <span>•</span>
                    <span className="text-stone-300">-{record.hpLost} Max HP</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="retro-badge bg-red-900 text-red-200 border-red-700">
                    -{record.levelsLost} {record.levelsLost === 1 ? 'Nivel' : 'Niveles'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 bg-[#0d0f17] border border-stone-800">
            <p className="font-pixel-text text-sm text-stone-400">
              ✨ Tu récord está impecable. No has sufrido deleveling por incumplimiento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
