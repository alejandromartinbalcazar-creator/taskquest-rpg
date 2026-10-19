import React from 'react';
import { Player, Task } from '../types';
import { Coins, Key, Volume2, VolumeX, AlertTriangle, Download } from 'lucide-react';
import { sound } from '../services/soundService';

interface HeroHeaderProps {
  player: Player;
  tasks: Task[];
  onOpenApkModal: () => void;
  isDamagedAnimation: boolean;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  player,
  tasks,
  onOpenApkModal,
  isDamagedAnimation,
}) => {
  const [soundOn, setSoundOn] = React.useState(sound.isEnabled());

  const overdueCount = tasks.filter(
    (t) => !t.completed && new Date(t.dueDate).getTime() < Date.now()
  ).length;

  const toggleSound = () => {
    const next = !soundOn;
    sound.setSoundEnabled(next);
    setSoundOn(next);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0d0f17]/95 backdrop-blur-md border-b-2 border-stone-800 px-3 py-2 shadow-lg">
      <div className="max-w-xl mx-auto flex flex-col gap-1.5">
        {/* Fila Principal: Título, Recursos y Controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-amber-400 tracking-wider flex items-center gap-1.5">
              ⚔️ TASKQUEST
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Recursos: Oro y Llaves */}
            <div className="flex items-center gap-1.5 bg-[#171a26] px-2.5 py-1 rounded-xl border border-stone-800 text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-amber-300 text-[11px]">{player.gold}</span>
              <span className="text-stone-600">|</span>
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-cyan-300 text-[11px]">{player.dungeonKeys}</span>
              {player.skillPoints > 0 && (
                <>
                  <span className="text-stone-600">|</span>
                  <span className="text-purple-300 font-bold text-[10px] animate-pulse">
                    +{player.skillPoints} SP
                  </span>
                </>
              )}
            </div>

            {/* Sonido */}
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-[#171a26] border border-stone-800 text-stone-400 hover:text-white"
              title="Sonidos"
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-stone-600" />}
            </button>

            {/* APK */}
            <button
              onClick={onOpenApkModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold"
              title="Instalar en Android"
            >
              <Download className="w-3 h-3" />
              <span>APK</span>
            </button>
          </div>
        </div>

        {/* Alerta si hay tareas vencidas */}
        {overdueCount > 0 && (
          <div className={`bg-red-950/70 border border-red-500/50 text-red-200 px-2.5 py-1 rounded-xl text-[11px] flex items-center justify-between animate-pulse ${isDamagedAnimation ? 'animate-damage' : ''}`}>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>¡{overdueCount} tarea(s) vencida(s)! Tu personaje se debilita.</span>
            </div>
            <span className="font-bold text-red-400">-15 HP</span>
          </div>
        )}
      </div>
    </header>
  );
};
