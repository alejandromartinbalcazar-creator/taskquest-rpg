import React from 'react';
import { Coins, Volume2, VolumeX } from 'lucide-react';
import { Player } from '../types';
import { sound } from '../services/soundService';

interface HeroHeaderProps {
  player: Player;
  onOpenChangelogModal?: () => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({ player, onOpenChangelogModal }) => {
  const [soundOn, setSoundOn] = React.useState(sound.isEnabled());
  const tapCountRef = React.useRef(0);
  const lastTapTimeRef = React.useRef(0);
  const expPercent = Math.max(0, Math.min(100, (player.exp / Math.max(1, player.maxExp)) * 100));

  const handleLogoTap = () => {
    const now = Date.now();
    tapCountRef.current = now - lastTapTimeRef.current < 600 ? tapCountRef.current + 1 : 1;
    lastTapTimeRef.current = now;
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      onOpenChangelogModal?.();
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    sound.setSoundEnabled(next);
    setSoundOn(next);
  };

  return (
    <header className="fantasy-home-header px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 text-white">
      <div className="mx-auto max-w-xl">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={handleLogoTap} className="flex min-w-0 items-center gap-2 text-left" title="FocusMission">
            <span className="wizard-mark" aria-hidden="true">🧙</span>
            <span className="min-w-0">
              <span className="block font-pixel-title text-base leading-tight text-amber-300 drop-shadow-[2px_2px_0_#3b1b5d]">FOCUSMISSION</span>
              <span className="mt-1 block font-pixel-text text-base leading-none text-violet-200">Pequeños pasos, grandes logros</span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1 border-2 border-amber-500/70 bg-[#101633]/90 px-2 py-1.5 shadow-[2px_2px_0_#071025]">
              <Coins className="h-4 w-4 text-amber-300" />
              <span className="font-pixel-title text-[9px] text-amber-100">{player.gold}</span>
            </div>
            <button type="button" onClick={toggleSound} className="flex h-9 w-9 items-center justify-center border-2 border-violet-400/70 bg-[#101633]/90 text-violet-100 shadow-[2px_2px_0_#071025]" title="Sonido">
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-4 border-2 border-amber-400/90 bg-[#0b1230]/90 p-2 shadow-[3px_3px_0_#2a174b]">
          <div className="flex items-center gap-3">
            <span className="font-pixel-title text-xs text-amber-200">NV. {player.level}</span>
            <div className="h-4 min-w-0 flex-1 border-2 border-[#17133b] bg-[#0a0d25] p-[2px]">
              <div className="h-full bg-violet-400 shadow-[0_0_7px_#c4b5fd]" style={{ width: `${expPercent}%` }} />
            </div>
            <span className="font-pixel-title text-[8px] text-violet-100">{player.exp} / {player.maxExp} EXP</span>
          </div>
        </div>
      </div>
    </header>
  );
};
