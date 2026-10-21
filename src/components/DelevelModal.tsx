import React, { useEffect } from 'react';
import { DelevelEvent } from '../types';
import { sound } from '../services/soundService';
import { Skull, AlertOctagon, HeartCrack, ZapOff, ShieldAlert, Award, Clock } from 'lucide-react';

interface DelevelModalProps {
  event: DelevelEvent | null;
  onClose: () => void;
}

export const DelevelModal: React.FC<DelevelModalProps> = ({ event, onClose }) => {
  useEffect(() => {
    if (event) {
      sound.playDelevelCrackSound();
    }
  }, [event]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-[#1c0808] via-[#120505] to-[#0a0202] border-2 border-red-600 max-w-md w-full rounded-3xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.5)] space-y-5 text-stone-100 relative overflow-hidden">
        {/* Resplandor y partículas de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado Ominoso */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 bg-red-950/80 border border-red-500/70 rounded-2xl mb-1 text-red-400 shadow-lg shadow-red-950 animate-bounce">
            <Skull className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-red-400 tracking-wider uppercase drop-shadow-md">
            ¡Fallo Crítico!
          </h2>
          <p className="text-xs text-red-200 font-semibold tracking-wide">
            El descuido de tus deberes ha cobrado su precio en tu héroe.
          </p>
        </div>

        {/* Display de Nivel Quebrado */}
        <div className="bg-black/60 border border-red-800/80 rounded-2xl p-4 text-center relative overflow-hidden">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Degradación de Rango</span>
          </div>

          {event.isAgony ? (
            <div className="space-y-1 py-1">
              <span className="text-2xl font-black text-red-500 uppercase tracking-wider animate-pulse">
                ⚠️ ¡Bancarrota & Agonía!
              </span>
              <p className="text-[11px] text-red-300">
                Tu personaje está en Nivel 1 y ha tocado fondo. Vitalidad severamente disminuida.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-1 font-mono">
              <div className="text-center">
                <span className="text-2xl font-black line-through text-stone-500 decoration-red-500 decoration-2">
                  Nv. {event.previousLevel}
                </span>
                <span className="block text-[9px] text-stone-500">ANTERIOR</span>
              </div>
              <span className="text-red-500 text-2xl font-black">➔</span>
              <div className="text-center">
                <span className="text-3xl font-black text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
                  Nv. {event.newLevel}
                </span>
                <span className="block text-[9px] text-red-300 font-bold">ACTUAL</span>
              </div>
            </div>
          )}
        </div>

        {/* Tarea Culpable */}
        <div className="bg-[#1a0a0a]/80 border border-red-900/50 rounded-xl p-3 text-xs space-y-1">
          <div className="text-[10px] text-stone-400 uppercase font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-red-400" />
            <span>Misión Vencida / Fallida</span>
          </div>
          <div className="font-bold text-red-200 text-sm">
            "{event.task.title}"
          </div>
          <div className="text-[11px] text-stone-400 capitalize">
            Dificultad: <span className="text-amber-400 font-semibold">{event.task.difficulty}</span>
            {event.levelsLost > 1 && (
              <span className="ml-1 text-red-400 font-bold">(Penalización Crítica -2 Niveles)</span>
            )}
          </div>
        </div>

        {/* Resumen de Consecuencias y Pérdidas */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-stone-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            Pérdidas Reales Sufridas:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-red-950/40 border border-red-900/40 p-2 rounded-xl flex items-center gap-2">
              <ZapOff className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <span className="font-bold text-red-300">
                  {event.levelsLost > 0 ? `-${event.levelsLost} Nivel(es)` : 'XP a Cero'}
                </span>
                <span className="block text-[10px] text-stone-400">Progreso reiniciado</span>
              </div>
            </div>

            <div className="bg-red-950/40 border border-red-900/40 p-2 rounded-xl flex items-center gap-2">
              <HeartCrack className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-rose-300">-{event.hpLost} Max HP</span>
                <span className="block text-[10px] text-stone-400">Salud degradada</span>
              </div>
            </div>

            <div className="bg-red-950/40 border border-red-900/40 p-2 rounded-xl flex items-center gap-2 col-span-2">
              <Skull className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="font-bold text-purple-300">Maldición por Incumplimiento</span>
                <span className="block text-[10px] text-stone-400">
                  -15% EXP de monstruos durante las próximas 24 horas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ventana de Redención / Deuda de Honor */}
        <div className="bg-gradient-to-r from-amber-950/40 via-stone-900/60 to-amber-950/40 border border-amber-600/40 rounded-2xl p-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Mecánica de Redención: Deuda de Honor</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            Completa esta misión dentro de las próximas <strong className="text-amber-300">24 horas</strong> para saldar la deuda de honor y recuperar el <strong className="text-emerald-300">50% de la EXP</strong> perdida.
          </p>
        </div>

        {/* Botón Aceptar Castigo */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-950 active:scale-98 transition flex items-center justify-center gap-2 border border-red-500/60"
        >
          <span>Asumir el Castigo y Continuar</span>
        </button>
      </div>
    </div>
  );
};
