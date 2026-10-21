import React from 'react';
import { Player } from '../types';
import {
  HERO_MILESTONES,
  calculatePlayerProgressionStats,
  getMilestoneProgress,
} from '../data/heroMilestones';
import {
  Trophy,
  X,
  Flame,
  Shield,
  Zap,
  Heart,
  Swords,
  Timer,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface HeroProgressModalProps {
  player: Player;
  onClose: () => void;
}

export const HeroProgressModal: React.FC<HeroProgressModalProps> = ({ player, onClose }) => {
  const stats = calculatePlayerProgressionStats(player);

  const xpPercent = Math.min(100, Math.round((player.exp / Math.max(1, player.maxExp)) * 100));
  const globalDamagePercent = Math.round((stats.damageMultiplier - 1.0) * 100);
  const cooldownReductionPercent = Math.round(stats.cooldownReduction * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#161824] via-[#10121c] to-[#0a0b12] border-2 border-stone-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* ENCABEZADO */}
        <div className="relative px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-[#131522]/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-amber-300 tracking-wide">
                PROGRESIÓN DIRECTA & HITOS
              </h3>
              <p className="text-[11px] text-stone-400">
                Poder forjado con tus acciones reales. Sin tiendas ni microgestión.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800/60 hover:bg-stone-700 text-stone-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* CABECERA: NIVEL, EXP & RACHA */}
          <div className="bg-[#181a28] border border-amber-500/30 rounded-2xl p-4 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Rango del Héroe
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400">Nivel {player.level}</span>
                  <span className="text-xs font-semibold text-purple-300">{player.title}</span>
                </div>
              </div>

              {/* RACHA DIARIA */}
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-950/80 to-amber-950/80 border border-orange-500/50 px-3 py-1.5 rounded-xl">
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="text-xs font-black text-orange-200">
                  Racha: {player.cleanStreakDays || 0} {player.cleanStreakDays === 1 ? 'día' : 'días'}
                </span>
              </div>
            </div>

            {/* BARRA DE EXP */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-stone-300 mb-1">
                <span>Experiencia hacia Nv. {player.level + 1}</span>
                <span className="font-mono text-amber-400">
                  {player.exp} / {player.maxExp} XP ({xpPercent}%)
                </span>
              </div>
              <div className="w-full h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* RESUMEN DE PODER ACTUAL */}
          <div>
            <h4 className="text-xs font-black text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Resumen de Poder Pasivo</span>
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {/* VIDA MÁXIMA */}
              <div className="bg-[#141624] border border-stone-800 p-2.5 rounded-xl text-center">
                <div className="flex justify-center mb-1 text-emerald-400">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="text-[10px] text-stone-400 font-bold uppercase">Vida Máxima</div>
                <div className="text-sm font-black text-stone-100 font-mono mt-0.5">
                  {stats.maxHp} HP
                </div>
                <div className="text-[9px] text-emerald-400 mt-0.5">
                  +{stats.levelHpBonus} Nv {stats.milestoneHpBonus > 0 ? `| +${stats.milestoneHpBonus} Hito` : ''}
                </div>
              </div>

              {/* BONO DAÑO GLOBAL */}
              <div className="bg-[#141624] border border-stone-800 p-2.5 rounded-xl text-center">
                <div className="flex justify-center mb-1 text-rose-400">
                  <Swords className="w-4 h-4" />
                </div>
                <div className="text-[10px] text-stone-400 font-bold uppercase">Bono de Daño</div>
                <div className="text-sm font-black text-stone-100 font-mono mt-0.5">
                  +{globalDamagePercent}%
                </div>
                <div className="text-[9px] text-rose-400 mt-0.5">+4% por nivel</div>
              </div>

              {/* REDUCCIÓN ENFRIAMIENTO */}
              <div className="bg-[#141624] border border-stone-800 p-2.5 rounded-xl text-center">
                <div className="flex justify-center mb-1 text-cyan-400">
                  <Timer className="w-4 h-4" />
                </div>
                <div className="text-[10px] text-stone-400 font-bold uppercase">Recarga CD</div>
                <div className="text-sm font-black text-stone-100 font-mono mt-0.5">
                  -{cooldownReductionPercent}%
                </div>
                <div className="text-[9px] text-cyan-400 mt-0.5">-5% c/3 niveles</div>
              </div>
            </div>

            {/* BONIFICACIONES ESPECIALES ACTIVAS */}
            {(stats.graceShieldCharges > 0 ||
              stats.holdChargeTime < 0.6 ||
              stats.moveSpeedMultiplier > 1.0 ||
              stats.fireDamageBonus > 0) && (
              <div className="mt-2 bg-[#121422] border border-purple-500/30 rounded-xl p-2.5 flex flex-wrap gap-2 text-[10px]">
                {stats.graceShieldCharges > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Escudo de Gracia: {stats.graceShieldCharges} carga(s)
                  </span>
                )}
                {stats.holdChargeTime < 0.6 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Hold Rápido (0.4s)
                  </span>
                )}
                {stats.moveSpeedMultiplier > 1.0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    Velocidad +15% & Aura Relámpago
                  </span>
                )}
                {stats.fireDamageBonus > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-950/80 border border-orange-500/50 text-orange-300 font-bold">
                    <Flame className="w-3 h-3 text-orange-400" />
                    Fuego +10%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* LISTA DE HITOS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Hitos del Héroe (Hábitos Reales)</span>
              </h4>
              <span className="text-[10px] font-bold text-stone-400 font-mono">
                {(player.unlockedMilestones || []).length} / {HERO_MILESTONES.length} Desbloqueados
              </span>
            </div>

            <div className="space-y-2">
              {HERO_MILESTONES.map((milestone) => {
                const prog = getMilestoneProgress(milestone, player);
                return (
                  <div
                    key={milestone.id}
                    className={`p-3 rounded-2xl border transition ${
                      prog.isUnlocked
                        ? 'bg-[#151928] border-amber-500/50 shadow-md'
                        : 'bg-[#10121d] border-stone-800 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{milestone.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-stone-100">
                              {milestone.title}
                            </span>
                            {prog.isUnlocked && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-stone-400 leading-snug">
                            {milestone.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {prog.isUnlocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-950/80 border border-amber-500/60 text-amber-300">
                            ACTIVO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-stone-400 bg-stone-900 px-2 py-0.5 rounded-md border border-stone-800">
                            <Lock className="w-3 h-3 text-stone-500" />
                            {prog.current}/{prog.target}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* BARRA DE PROGRESO */}
                    <div className="mt-2.5">
                      <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            prog.isUnlocked
                              ? 'bg-amber-400'
                              : 'bg-gradient-to-r from-stone-600 to-stone-400'
                          }`}
                          style={{ width: `${prog.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* RECOMPENSA */}
                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      <span className="text-stone-400">Recompensa pasiva:</span>
                      <span
                        className={`font-semibold ${
                          prog.isUnlocked ? 'text-amber-300' : 'text-stone-300'
                        }`}
                      >
                        {milestone.rewardDescription}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PIE DE MODAL */}
        <div className="px-5 py-3 border-t border-stone-800 bg-[#0d0e17] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs transition shadow-md"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
