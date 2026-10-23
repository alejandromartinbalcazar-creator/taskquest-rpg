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

  // Vista de selección de pisos de la mazmorra con estética 16-bit de piedra y metal
  return (
    <div className="max-w-xl mx-auto px-3 py-4 pb-24 space-y-4">
      {/* Banner de Mazmorra */}
      <div className="retro-box-stone p-3 flex items-center justify-between">
        <div>
          <h3 className="font-pixel-title text-xs text-amber-400 flex items-center gap-1.5 uppercase">
            <Castle className="w-4 h-4 text-amber-400" />
            Mazmorras en Tiempo Real
          </h3>
          <p className="font-pixel-text text-sm text-stone-300 mt-0.5">
            Controla a tu mago, esquiva monstruos y desata tus hechizos elementales.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#0f172a] px-2.5 py-1 border-2 border-[#18181b] shadow-[2px_2px_0px_#000] shrink-0">
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-pixel-title text-[9px] text-amber-300">{player.dungeonKeys}</span>
        </div>
      </div>

      {/* Botón Destacado: Prueba Directa en Navegador / Modo Práctica */}
      <div className="retro-box-gold p-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="font-pixel-title text-[9px] text-amber-300 flex items-center gap-1.5">
            <span>⚔️ PROBAR MOTOR DE COMBATE</span>
            <span className="retro-badge bg-purple-950 text-purple-300 border-purple-500">PC / MOBILE</span>
          </div>
          <div className="font-pixel-text text-sm text-stone-200">
            Entra gratis al combate para probar los hechizos, el dash y el ataque cargado.
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
          className="retro-btn-gold px-3 py-2 shrink-0 flex items-center gap-1 text-[8px]"
        >
          <span>PROBAR AHORA</span>
        </button>
      </div>

      {/* Advertencia de Salud Baja */}
      {player.currentHp <= 25 && (
        <div className="retro-box-danger p-2.5 text-xs text-red-200 flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="font-pixel-text text-sm">
            <strong className="font-pixel-title text-[8px] text-red-300">¡Salud baja!</strong> Si procrastinas y tu HP llega a 0 no podrás entrar al combate. Completa tareas para regenerarte.
          </span>
        </div>
      )}

      {/* Lista de Mazmorras estilo RPG de Piedra */}
      <div className="space-y-3">
        {dungeons.map((floor) => (
          <div
            key={floor.floorNumber}
            className={`${
              floor.cleared
                ? 'retro-box-stone outline-emerald-500'
                : 'retro-box-stone'
            } p-3`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-[#0f172a] border-2 border-[#18181b] shadow-[2px_2px_0px_#000]">
                  {floor.enemy.avatar}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="retro-badge bg-amber-950 text-amber-300 border-amber-600">
                      Piso {floor.floorNumber}
                    </span>
                    <h4 className="font-pixel-title text-[9px] text-stone-100">{floor.name}</h4>
                  </div>
                  <p className="font-pixel-text text-sm text-stone-300 mt-0.5">{floor.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleStartFloor(floor)}
                className="retro-btn-gold px-3 py-1.5 flex items-center gap-1 text-[8px] shrink-0"
              >
                <Sword className="w-3 h-3" />
                <span>Luchar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
