import React, { useEffect, useState } from 'react';
import { BookOpen, Brain, Check, Clock3, Heart, Pause, Play, Sparkles, Swords, Wind, X } from 'lucide-react';
import { Player, StatType } from '../types';

interface Props { player: Player; onCompleteSession: (affinity: StatType, minutes: number) => void; }
type FocusMode = 'free' | 'pomodoro' | 'meditation';

const branches = [
  { id: 'attack' as StatType, title: 'Acción', subtitle: 'Avanzar y empezar', icon: Swords, tone: 'rose' },
  { id: 'speed' as StatType, title: 'Ritmo', subtitle: 'Constancia sin prisa', icon: Wind, tone: 'amber' },
  { id: 'defense' as StatType, title: 'Resistencia', subtitle: 'Calma y energía', icon: Heart, tone: 'emerald' },
  { id: 'knowledge' as StatType, title: 'Claridad', subtitle: 'Estudio profundo', icon: BookOpen, tone: 'sky' },
] as const;
const modes: { id: FocusMode; title: string; minutes: number; description: string; icon: typeof Brain }[] = [
  { id: 'free', title: 'Enfoque libre', minutes: 15, description: 'Un espacio a tu ritmo.', icon: Sparkles },
  { id: 'pomodoro', title: 'Pomodoro', minutes: 25, description: '25 min de atención plena.', icon: Clock3 },
  { id: 'meditation', title: 'Meditación', minutes: 5, description: 'Respira, descansa y vuelve.', icon: Brain },
];
const tones: Record<string, { base: string; selected: string; icon: string }> = {
  rose: { base: 'border-rose-400/70 bg-rose-950/35', selected: 'border-rose-300 bg-rose-900/60', icon: 'text-rose-300' },
  amber: { base: 'border-amber-400/70 bg-amber-950/35', selected: 'border-amber-300 bg-amber-900/60', icon: 'text-amber-300' },
  emerald: { base: 'border-emerald-400/70 bg-emerald-950/35', selected: 'border-emerald-300 bg-emerald-900/60', icon: 'text-emerald-300' },
  sky: { base: 'border-sky-400/70 bg-sky-950/35', selected: 'border-sky-300 bg-sky-900/60', icon: 'text-sky-300' },
};
const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export const ConcentrationTreeView: React.FC<Props> = ({ player, onCompleteSession }) => {
  const [affinity, setAffinity] = useState<StatType>('knowledge');
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [phase, setPhase] = useState<'setup' | 'running' | 'paused' | 'complete'>('setup');
  const [remaining, setRemaining] = useState(25 * 60);
  const [leftApp, setLeftApp] = useState(false);
  const selectedMode = modes.find((item) => item.id === mode)!;
  const selectedBranch = branches.find((item) => item.id === affinity)!;
  const planned = selectedMode.minutes * 60;
  const elapsed = Math.max(0, planned - remaining);
  const progress = Math.min(100, (elapsed / planned) * 100);
  const total = player.stats.attack + player.stats.speed + player.stats.defense + player.stats.knowledge;
  const growth = Math.min(100, Math.round((total / 120) * 100));

  useEffect(() => {
    if (phase !== 'running') return;
    const timer = window.setInterval(() => setRemaining((seconds) => {
      if (seconds <= 1) { window.clearInterval(timer); setPhase('complete'); return 0; }
      return seconds - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    const trackExit = () => { if (document.hidden && phase === 'running') setLeftApp(true); };
    document.addEventListener('visibilitychange', trackExit);
    return () => document.removeEventListener('visibilitychange', trackExit);
  }, [phase]);

  const chooseMode = (nextMode: FocusMode) => { const next = modes.find((item) => item.id === nextMode)!; setMode(nextMode); setRemaining(next.minutes * 60); };
  const begin = () => { setRemaining(selectedMode.minutes * 60); setLeftApp(false); setPhase('running'); };
  const abandon = () => { setPhase('setup'); setRemaining(selectedMode.minutes * 60); setLeftApp(false); };
  const collect = () => { if (elapsed >= 60) onCompleteSession(affinity, Math.max(1, Math.round(elapsed / 60))); abandon(); };

  if (phase !== 'setup') return <div className="w-full max-w-xl mx-auto px-4 py-5 pb-28"><section className="cute-panel focus-session-card relative overflow-hidden px-5 py-7 text-center">
    <div className="focus-stars" aria-hidden="true">✦　·　✧　·　✦</div><p className="relative font-pixel-title text-[9px] text-violet-200">SESIÓN DE {selectedBranch.title.toUpperCase()}</p>
    <div className="relative my-6 flex justify-center" aria-label="Mago concentrándose"><div className="focus-aura" /><div className="focus-wizard">🧙‍♂️</div></div>
    {phase === 'complete' ? <><p className="font-pixel-title text-base text-amber-300">¡HECHO!</p><p className="mt-3 font-pixel-text text-xl text-slate-100">Tu sesión terminó. Recibiste un punto de {selectedBranch.title}.</p><button onClick={collect} className="cute-primary-button mt-7 w-full py-4">RECIBIR PROGRESO</button></> : <>
      <p className="font-pixel-title text-4xl tracking-wide text-white tabular-nums">{clock(remaining)}</p><p className="mt-3 font-pixel-text text-xl text-violet-200">{selectedMode.title} · {selectedBranch.subtitle}</p>
      <div className="mt-5 h-3 overflow-hidden border-2 border-violet-950 bg-[#0b0f24] p-[2px]"><div className="h-full bg-violet-400 transition-[width] duration-1000" style={{ width: `${progress}%` }} /></div>
      {leftApp && <p className="mt-4 font-pixel-text text-lg text-amber-200">El mago te esperó. Regresa con calma a tu misión.</p>}
      <div className="mt-7 grid grid-cols-2 gap-3"><button onClick={() => setPhase(phase === 'running' ? 'paused' : 'running')} className="retro-btn-stone flex min-h-12 items-center justify-center gap-2 py-3">{phase === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{phase === 'running' ? 'PAUSAR' : 'SEGUIR'}</button><button onClick={abandon} className="retro-btn-danger flex min-h-12 items-center justify-center gap-2 py-3"><X className="h-4 w-4" />SALIR</button></div>
    </>}</section></div>;

  return <div className="w-full max-w-xl mx-auto px-4 py-4 pb-28">
    <section className="cute-panel focus-intro relative overflow-hidden p-5"><div className="absolute right-3 top-2 text-3xl opacity-70">☾</div><div className="flex items-center gap-4"><div className="focus-wizard focus-wizard-small shrink-0">🧙‍♂️</div><div><p className="font-pixel-title text-[10px] text-violet-200">CONCENTRACIÓN</p><h1 className="mt-2 font-pixel-title text-base leading-relaxed text-amber-300">UN MOMENTO PARA TI</h1><p className="mt-2 font-pixel-text text-xl leading-tight text-slate-200">Elige tu intención. El mago cuidará el tiempo contigo.</p></div></div></section>
    <section className="mt-5"><div className="mb-2 flex items-center justify-between"><h2 className="font-pixel-title text-[10px] text-white">¿QUÉ QUIERES FORTALECER?</h2><span className="font-pixel-title text-[8px] text-violet-200">{growth}% CRECIMIENTO</span></div><div className="grid grid-cols-2 gap-2">{branches.map((branch) => { const Icon = branch.icon; const tone = tones[branch.tone]; const selected = affinity === branch.id; return <button key={branch.id} onClick={() => setAffinity(branch.id)} className={`min-h-24 border-2 p-3 text-left transition ${selected ? tone.selected : tone.base}`}><div className="flex items-center justify-between"><Icon className={`h-5 w-5 ${tone.icon}`} />{selected && <Check className={`h-4 w-4 ${tone.icon}`} />}</div><p className="mt-3 font-pixel-title text-[9px] text-white">{branch.title}</p><p className="mt-1 font-pixel-text text-base leading-none text-slate-300">{branch.subtitle}</p></button>; })}</div></section>
    <section className="mt-5"><h2 className="mb-2 font-pixel-title text-[10px] text-white">ELIGE TU RITUAL</h2><div className="space-y-2">{modes.map((item) => { const Icon = item.icon; const active = mode === item.id; return <button key={item.id} onClick={() => chooseMode(item.id)} className={`flex w-full items-center gap-3 border-2 p-3 text-left ${active ? 'border-violet-300 bg-violet-900/55' : 'border-slate-700 bg-[#11162d]'}`}><div className="flex h-10 w-10 items-center justify-center border border-violet-400/70 bg-violet-950/70 text-violet-200"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-pixel-title text-[9px] text-white">{item.title}</p><p className="mt-1 font-pixel-text text-lg leading-none text-slate-300">{item.description}</p></div><span className="font-pixel-title text-[9px] text-amber-300">{item.minutes}m</span></button>; })}</div></section>
    <div className="mt-5 rounded border border-violet-400/40 bg-violet-950/25 px-3 py-3 font-pixel-text text-lg leading-tight text-violet-100"><Sparkles className="mr-2 inline h-4 w-4 text-amber-300" />Durante la sesión no bloqueamos otras apps todavía: será una función opcional separada.</div><button onClick={begin} className="cute-primary-button mt-5 flex w-full items-center justify-center gap-3 py-5"><Play className="h-5 w-5 fill-current" />COMENZAR A CONCENTRARME</button>
  </div>;
};
