import React from 'react';
import { BookOpen, Brain, Heart, Sparkles, Swords, Wind } from 'lucide-react';
import { Player } from '../types';

interface ConcentrationTreeViewProps {
  player: Player;
}

const branches = [
  { id: 'attack', title: 'Acción', description: 'Las tareas valientes fortalecen tus ataques.', icon: Swords, tone: 'rose', value: (player: Player) => player.stats.attack },
  { id: 'speed', title: 'Ritmo', description: 'La constancia mejora tu velocidad y ligereza.', icon: Wind, tone: 'amber', value: (player: Player) => player.stats.speed },
  { id: 'defense', title: 'Resistencia', description: 'Cuidarte aumenta tu vida y protección.', icon: Heart, tone: 'emerald', value: (player: Player) => player.stats.defense },
  { id: 'knowledge', title: 'Claridad', description: 'Aprender alimenta tu conocimiento.', icon: BookOpen, tone: 'sky', value: (player: Player) => player.stats.knowledge },
] as const;

const tones = {
  rose: { border: 'border-rose-300', bg: 'bg-rose-950/30', icon: 'text-rose-300', fill: 'bg-rose-400' },
  amber: { border: 'border-amber-300', bg: 'bg-amber-950/30', icon: 'text-amber-300', fill: 'bg-amber-400' },
  emerald: { border: 'border-emerald-300', bg: 'bg-emerald-950/30', icon: 'text-emerald-300', fill: 'bg-emerald-400' },
  sky: { border: 'border-sky-300', bg: 'bg-sky-950/30', icon: 'text-sky-300', fill: 'bg-sky-400' },
};

export const ConcentrationTreeView: React.FC<ConcentrationTreeViewProps> = ({ player }) => {
  const total = branches.reduce((sum, branch) => sum + branch.value(player), 0);
  const growth = Math.min(100, Math.round((total / 120) * 100));

  return (
    <div className="w-full max-w-3xl mx-auto px-3 py-3 pb-24 landscape:max-w-none landscape:px-4 landscape:py-3">
      <section className="cute-panel mb-3 flex items-center gap-3 p-3 landscape:mb-2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-violet-300 bg-violet-950/50 text-violet-200 shadow-[3px_3px_0_#2e1065]">
          <Brain className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-pixel-title text-[9px] text-violet-200">ÁRBOL DE CONCENTRACIÓN</p>
          <p className="mt-1 font-pixel-text text-base leading-tight text-slate-300">Tus tareas hacen crecer tus poderes automáticamente.</p>
        </div>
        <div className="hidden text-right landscape:block">
          <p className="font-pixel-title text-[8px] text-violet-200">CRECIMIENTO</p>
          <p className="mt-1 font-pixel-title text-sm text-white">{growth}%</p>
        </div>
      </section>

      <div className="mb-3 h-3 border-2 border-violet-950 bg-[#111426] p-[2px] shadow-[2px_2px_0_#090a10] landscape:mb-2">
        <div className="h-full bg-violet-400" style={{ width: `${growth}%` }} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {branches.map((branch) => {
          const Icon = branch.icon;
          const value = branch.value(player);
          const tone = tones[branch.tone];
          const tier = Math.max(1, Math.ceil(value / 10));
          const progress = ((value % 10) / 10) * 100;
          return (
            <article key={branch.id} className={`cute-panel ${tone.bg} ${tone.border} p-3`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 ${tone.border} bg-[#101426] ${tone.icon}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-pixel-title text-[9px] text-white">{branch.title}</h2>
                    <span className={`font-pixel-title text-[8px] ${tone.icon}`}>NV {tier}</span>
                  </div>
                  <p className="mt-1 font-pixel-text text-sm leading-tight text-slate-300">{branch.description}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 border border-slate-700 bg-[#101426] p-px">
                  <div className={`h-full ${tone.fill}`} style={{ width: `${progress || 6}%` }} />
                </div>
                <span className="font-pixel-title text-[8px] text-slate-200">{value}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 px-1 text-violet-200">
        <Sparkles className="h-4 w-4 shrink-0" />
        <p className="font-pixel-text text-base leading-tight">Elige la afinidad al crear una misión. Al completarla, esa rama recibe el mayor impulso.</p>
      </div>
    </div>
  );
};
