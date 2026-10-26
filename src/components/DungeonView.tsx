import React, { useEffect, useState } from 'react';
import { Player, DungeonFloor } from '../types';
import { LandscapeCombatView } from '../game/elementalEngine/LandscapeCombatView';
import { createLevel1CampaignRoute, getRouteSummary } from '../game/expedition/campaignRoute';
import { Castle, Sword, Key, AlertTriangle, Lock, GraduationCap } from 'lucide-react';

interface DungeonViewProps {
  player: Player;
  dungeons: DungeonFloor[];
  onBattleVictory: (floorNumber: number, expReward: number, goldReward: number) => void;
  onTakeBattleDamage: (damage: number) => void;
  onConsumeKey: () => void;
  onTutorialFinished: () => void;
}

export const DungeonView: React.FC<DungeonViewProps> = ({
  player,
  dungeons,
  onBattleVictory,
  onTakeBattleDamage,
  onConsumeKey,
  onTutorialFinished,
}) => {
  const [activeFloor, setActiveFloor] = useState<DungeonFloor | null>(null);
  // Se crea una única ruta persistente; la misma semilla permite reproducirla al volver a entrar.
  const [level1Route] = useState(() => createLevel1CampaignRoute());

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
    if (activeFloor?.floorNumber === 0) {
      onTutorialFinished();
      // El portal del tutorial lleva de inmediato a la primera expedición real.
      setActiveFloor(dungeons.find((floor) => floor.floorNumber === 1) ?? null);
      return;
    }
    setActiveFloor(null);
  };
  const tutorialFloor: DungeonFloor = {
    ...(dungeons[0] || { floorNumber: 0, name: 'Tutorial', description: '', recommendedLevel: 1, enemy: { id: 'tutorial', name: 'Espectro de práctica', title: 'Aprende a luchar', avatar: '🎯', hp: 80, maxHp: 80, attack: 2, defense: 0, weakness: 'fire', expReward: 0, goldReward: 0 }, isBoss: false, cleared: false }),
    floorNumber: 0, name: 'Tutorial: Sendero del Mago', description: 'Aprende a moverte, atacar y combinar elementos.',
  };
  useEffect(() => {
    if (!player.tutorialCompleted) setActiveFloor(tutorialFloor);
  // Solo reacciona al estado de tutorial; tutorialFloor es una definición local estable en contenido.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.tutorialCompleted]);
  const levels = Array.from({ length: 20 }, (_, index) => index + 1);

  // Si está jugando el piso activo en tiempo real:
  if (activeFloor) {
    return (
      <LandscapeCombatView
        player={player}
        floor={activeFloor}
        onExit={handleExitDungeon}
        onVictory={onBattleVictory}
        onPlayerTakeDamage={onTakeBattleDamage}
        isTutorial={activeFloor.floorNumber === 0}
        campaignRoute={activeFloor.floorNumber === 1 ? level1Route : undefined}
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

      <div className="retro-box-gold p-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="font-pixel-title text-[9px] text-amber-300 flex items-center gap-1.5">
            <span>✦ TUTORIAL OPCIONAL</span>
          </div>
          <div className="font-pixel-text text-sm text-stone-200">
            Aprende movimiento, afinidades elementales y combate sin gastar llave.
          </div>
        </div>
        <button
          onClick={() => setActiveFloor(tutorialFloor)}
          className="retro-btn-gold px-3 py-2 shrink-0 flex items-center gap-1 text-[8px]"
        >
          <GraduationCap className="w-3 h-3" /><span>ENTRAR</span>
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

      {/* Campaña: los niveles futuros ya existen como destino y se desbloquean por progreso real. */}
      <div className="space-y-3">
        {levels.map((level) => {
          const floor = dungeons.find((item) => item.floorNumber === level);
          const previousFloor = dungeons.find((item) => item.floorNumber === level - 1);
          const unlocked = level === 1 || !!previousFloor?.cleared;
          const title = level === 1
            ? 'Nivel 1: Bosque Profundo'
            : level === 2
              ? 'Nivel 2: Campamento Glacial'
              : `Nivel ${level}: Región por descubrir`;
          const description = level === 1
            ? 'La primera expedición real: combate, tesoros y guardián.'
            : level === 2
              ? 'Un campamento congelado custodiado solo por acechadores de hielo.'
              : `Completa misiones para abrir esta expedición.`;
          return (
          <div
            key={level}
            className={`${
              floor?.cleared
                ? 'retro-box-stone outline-emerald-500'
                : 'retro-box-stone'
            } p-3 ${!unlocked ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-[#0f172a] border-2 border-[#18181b] shadow-[2px_2px_0px_#000]">
                  {unlocked ? (floor?.enemy.avatar || '🌲') : '🔒'}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="retro-badge bg-amber-950 text-amber-300 border-amber-600">
                      {unlocked ? `Nivel ${level}` : 'BLOQUEADO'}
                    </span>
                    <h4 className="font-pixel-title text-[9px] text-stone-100">{title}</h4>
                  </div>
                  <p className="font-pixel-text text-sm text-stone-300 mt-0.5">{description}</p>
                  {level === 1 && (
                    <p className="font-pixel-text text-xs text-emerald-300 mt-1">
                      {getRouteSummary(level1Route.run)} · Ruta {level1Route.seedLabel}
                    </p>
                  )}
                </div>
              </div>

              <button
                disabled={!unlocked || !floor}
                onClick={() => floor && handleStartFloor(floor)}
                className={`${unlocked ? 'retro-btn-gold' : 'retro-btn-stone'} px-3 py-1.5 flex items-center gap-1 text-[8px] shrink-0`}
              >
                {unlocked ? <Sword className="w-3 h-3" /> : <Lock className="w-3 h-3" />}<span>{unlocked ? 'Entrar' : 'Misiones'}</span>
              </button>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};
