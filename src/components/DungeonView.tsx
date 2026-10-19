import React, { useState } from 'react';
import { Player, DungeonFloor } from '../types';
import { LandscapeCombatView } from '../game/elementalEngine/LandscapeCombatView';
import { Castle, Sword, Key, AlertTriangle } from 'lucide-react';

interface DungeonViewProps {
  player: Player;
  dungeons: DungeonFloor[];
  onBattleVictory: (floorNumber: number, expReward: number, goldReward: number) => void;
  onTakeBattleDamage: (damage: number) => void;
  onConsumeKey: () => void;
}

export const DungeonView: React.FC<DungeonViewProps> = ({
  player,
  dungeons,
  onBattleVictory,
  onTakeBattleDamage,
  onConsumeKey,
}) => {
  const [activeFloor, setActiveFloor] = useState<DungeonFloor | null>(null);

  const handleStartFloor = (floor: DungeonFloor) => {
    if (player.currentHp <= 0) {
      alert('¡Tu héroe está debilitado por procrastinar! Completa una tarea pendiente para recuperar vida.');
      return;
    }
    if (player.dungeonKeys <= 0) {
      alert('No tienes Llaves de Mazmorra. ¡Completa tareas en tu vida real para obtener llaves!');
      return;
    }

    onConsumeKey();
    setActiveFloor(floor);
  };

  const handleExitDungeon = () => {
    setActiveFloor(null);
  };

  // Si está jugando el piso activo en tiempo real:
  if (activeFloor) {
    return (
      <LandscapeCombatView
        player={player}
        floor={activeFloor}
        onExit={handleExitDungeon}
        onVictory={onBattleVictory}
        onPlayerTakeDamage={onTakeBattleDamage}
      />
    );
  }

  // Vista de selección de pisos de la mazmorra con estética de piedra y ladrillo
  return (
    <div className="max-w-xl mx-auto px-3 py-4 pb-24 space-y-4">
      {/* Banner de Mazmorra */}
      <div className="bg-gradient-to-br from-[#1c1917] via-[#12131a] to-[#1c1917] p-4 rounded-3xl border border-stone-700 shadow-xl flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-stone-200 flex items-center gap-1.5">
            <Castle className="w-4 h-4 text-amber-500" />
            Mazmorras de Acción en Tiempo Real
          </h3>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Controla a tu mago, esquiva a los monstruos y prueba tus 10 habilidades mágicas.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-950/60 px-3 py-1.5 rounded-2xl border border-amber-600/40 shrink-0">
          <Key className="w-4 h-4 text-amber-400 animate-bounce" />
          <span className="font-black text-amber-300 text-sm">{player.dungeonKeys}</span>
        </div>
      </div>

      {/* Botón Destacado: Prueba Directa en Navegador / Modo Práctica */}
      <div className="bg-gradient-to-r from-purple-950/80 via-[#1b1938] to-purple-950/80 p-4 rounded-3xl border-2 border-purple-500/60 flex items-center justify-between shadow-2xl">
        <div className="space-y-0.5">
          <div className="text-xs font-black text-purple-200 flex items-center gap-1.5">
            <span>✨ PROBAR NUEVO MOTOR DE MAGIA</span>
            <span className="text-[9px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-400/40 font-mono">CHROME / PC</span>
          </div>
          <div className="text-[11px] text-slate-300">
            Entra gratis al combate para probar los 10 hechizos, la esquiva [Espacio/Dash] y el ataque cargado.
          </div>
        </div>
        <button
          onClick={() => {
            const floorToUse = dungeons[0] || {
              floorNumber: 1,
              name: 'Atrio de Entrada',
              description: 'Sala de entrenamiento elemental',
              recommendedLevel: 1,
              enemy: {
                id: 'practice-target',
                name: 'Enemigo de Práctica',
                title: 'Objetivo',
                avatar: '🎯',
                hp: 180,
                maxHp: 180,
                attack: 8,
                defense: 2,
                expReward: 50,
                goldReward: 25,
              },
              isBoss: false,
              cleared: false,
            };
            setActiveFloor(floorToUse);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:brightness-110 active:scale-95 text-white font-black text-xs rounded-2xl border border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] shrink-0 transition"
        >
          ⚔️ PROBAR AHORA
        </button>
      </div>

      {/* Advertencia de Salud Baja */}
      {player.currentHp <= 25 && (
        <div className="bg-red-950/60 border border-red-500/50 p-3 rounded-2xl text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>
            <strong>¡Salud baja!</strong> Si procrastinas y tu HP llega a 0 no podrás entrar al combate. Completa tareas para regenerarte.
          </span>
        </div>
      )}

      {/* Lista de Mazmorras estilo RPG de Piedra */}
      <div className="space-y-3">
        {dungeons.map((floor) => (
          <div
            key={floor.floorNumber}
            className={`p-4 rounded-3xl border transition-all relative overflow-hidden ${
              floor.cleared
                ? 'bg-[#10141f] border-emerald-500/40'
                : 'bg-[#151722] border-stone-700/60 hover:border-amber-500/50 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 bg-[#1f2233] rounded-2xl border border-stone-700">
                  {floor.enemy.avatar}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                      Piso {floor.floorNumber}
                    </span>
                    <h4 className="font-bold text-sm text-stone-100">{floor.name}</h4>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{floor.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleStartFloor(floor)}
                className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition shrink-0"
              >
                <Sword className="w-3.5 h-3.5" />
                <span>Luchar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
