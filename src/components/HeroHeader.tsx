import React from 'react';
import { Player, Task } from '../types';
import { Coins, Key, Volume2, VolumeX, AlertTriangle, Download, Skull, ShieldAlert, Trophy } from 'lucide-react';
import { sound } from '../services/soundService';

interface HeroHeaderProps {
  player: Player;
  tasks: Task[];
  onOpenApkModal: () => void;
  onOpenChangelogModal?: () => void;
  onOpenProgressModal?: () => void;
  isDamagedAnimation: boolean;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  player,
  tasks,
  onOpenApkModal,
  onOpenChangelogModal,
  onOpenProgressModal,
  isDamagedAnimation,
}) => {
  const [soundOn, setSoundOn] = React.useState(sound.isEnabled());
  const [now, setNow] = React.useState(() => Date.now());

  // Contador de toques secretos para abrir Changelog
  const tapCountRef = React.useRef(0);
  const lastTapTimeRef = React.useRef(0);

  const handleLogoTap = () => {
    const nowTap = Date.now();
    if (nowTap - lastTapTimeRef.current < 600) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = nowTap;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      sound.playMicroStepDing();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 30, 40]);
      }
      onOpenChangelogModal?.();
    }
  };

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  const overdueCount = tasks.filter(
    (t) => !t.completed && !t.isFailed && new Date(t.dueDate).getTime() < now
  ).length;

  const urgentTasks = tasks.filter(
    (t) =>
      !t.completed &&
      !t.isFailed &&
      !t.isHonorDebt &&
      new Date(t.dueDate).getTime() > now &&
      new Date(t.dueDate).getTime() - now <= 4 * 3600 * 1000
  );

  const isCursed = !!(player.isCursed || (player.curseExpiresAt && new Date(player.curseExpiresAt).getTime() > now));
  const isAgony = !!player.isAgony;

  const toggleSound = () => {
    const next = !soundOn;
    sound.setSoundEnabled(next);
    setSoundOn(next);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0d0f17] border-b-4 border-[#18181b] outline-1 outline-[#334155] px-3 py-2 shadow-[0_4px_0_0_#000000]">
      <div className="max-w-xl mx-auto flex flex-col gap-1.5">
        {/* Fila Principal: Título, Recursos y Controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogoTap}
              className="font-pixel-title text-[11px] font-black text-amber-400 tracking-wider flex items-center gap-1.5 focus:outline-none select-none active:translate-x-[1px] active:translate-y-[1px] transition-transform drop-shadow-[2px_2px_0px_#000000]"
              title="FocusMission (5 toques para Dev Changelog)"
            >
              ⚔️ FOCUSMISSION
            </button>
            {isAgony && (
              <span className="retro-badge bg-red-950 text-red-300 border-red-500 animate-pulse flex items-center gap-1">
                <ShieldAlert className="w-2.5 h-2.5 text-red-400" />
                Agonía
              </span>
            )}
            {isCursed && (
              <span className="retro-badge bg-purple-950 text-purple-300 border-purple-500 flex items-center gap-1">
                <Skull className="w-2.5 h-2.5 text-purple-400" />
                -15% EXP
              </span>
            )}
            {/* Botón de Progreso & Hitos */}
            <button
              type="button"
              onClick={onOpenProgressModal}
              className="retro-btn-stone flex items-center gap-1 px-2 py-1 text-[8px] font-bold text-amber-300"
              title="Ver Progresión Directa e Hitos del Héroe"
            >
              <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Nv.{player.level}</span>
              <span className="text-orange-400 font-pixel-title text-[7px]">🔥{player.cleanStreakDays || 0}d</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Recursos: Oro y Llaves */}
            <div className="flex items-center gap-1.5 bg-[#171a26] px-2 py-1 border-2 border-[#18181b] outline-1 outline-[#334155] shadow-[2px_2px_0_0_#000000] text-xs font-pixel-title">
              <Coins className="w-3 h-3 text-amber-400" />
              <span className="font-bold text-amber-300 text-[9px]">{player.gold}</span>
              <span className="text-stone-600">|</span>
              <Key className="w-3 h-3 text-cyan-400" />
              <span className="font-bold text-cyan-300 text-[9px]">{player.dungeonKeys}</span>
              {player.skillPoints > 0 && (
                <>
                  <span className="text-stone-600">|</span>
                  <span className="text-purple-300 font-bold text-[8px] animate-pulse">
                    +{player.skillPoints} SP
                  </span>
                </>
              )}
            </div>

            {/* Sonido */}
            <button
              onClick={toggleSound}
              className="retro-btn-stone p-1.5 text-stone-300 hover:text-white"
              title="Sonidos"
            >
              {soundOn ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-stone-500" />}
            </button>

            {/* APK */}
            <button
              onClick={onOpenApkModal}
              className="retro-btn-emerald flex items-center gap-1 px-2 py-1 text-[8px] font-bold"
              title="Instalar en Android"
            >
              <Download className="w-2.5 h-2.5" />
              <span>APK</span>
            </button>
          </div>
        </div>

        {/* Alerta si hay tareas vencidas */}
        {overdueCount > 0 && (
          <div className={`retro-box-danger text-red-200 px-2.5 py-1 text-xs flex items-center justify-between animate-pulse ${isDamagedAnimation ? 'animate-damage' : ''}`}>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>¡{overdueCount} tarea(s) vencida(s)! Penalización de deleveling aplicada.</span>
            </div>
            <span className="font-pixel-title text-[8px] font-bold text-red-400 uppercase">Peligro</span>
          </div>
        )}

        {/* Alerta de urgencia pre-expiración (<4 horas) */}
        {overdueCount === 0 && urgentTasks.length > 0 && (
          <div className="retro-box-gold text-amber-200 px-2.5 py-1 text-xs flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>¡{urgentTasks.length} tarea(s) al borde de vencer (&lt;4h)! Evita perder nivel.</span>
            </div>
            <span className="font-pixel-title text-[8px] font-bold text-amber-400 uppercase">¡Urgente!</span>
          </div>
        )}
      </div>
    </header>
  );
};
