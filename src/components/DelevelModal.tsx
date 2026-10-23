import React, { useEffect } from 'react';
import { DelevelEvent } from '../types';
import { sound } from '../services/soundService';
import { Skull, AlertOctagon, HeartCrack, ZapOff, ShieldAlert, Award, Clock, ShieldCheck } from 'lucide-react';

interface DelevelModalProps {
  event: DelevelEvent | null;
  onClose: () => void;
}

export const DelevelModal: React.FC<DelevelModalProps> = ({ event, onClose }) => {
  useEffect(() => {
    if (event) {
      if (event.isGraceShieldAbsorbed) {
        sound.playHonorRedeemedSound();
      } else {
        sound.playDelevelCrackSound();
      }
    }
  }, [event]);

  if (!event) return null;

  if (event.isGraceShieldAbsorbed) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 animate-fadeIn">
        <div className="retro-box-gold max-w-md w-full p-5 space-y-4 text-stone-100 relative">
          {/* Encabezado Heroico */}
          <div className="text-center space-y-1">
            <div className="inline-flex p-2 bg-emerald-950 border-2 border-emerald-500 mb-1 text-emerald-400 shadow-[2px_2px_0px_#000]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="font-pixel-title text-sm font-black text-emerald-400 tracking-wider uppercase drop-shadow-[2px_2px_0px_#000]">
              ¡Escudo de Gracia Activado!
            </h2>
            <p className="font-pixel-text text-sm text-emerald-200">
              Tu constancia forjó una protección impenetrable.
            </p>
          </div>

          {/* Detalle de la absorción */}
          <div className="bg-[#0f172a] border-2 border-[#18181b] p-3 text-center">
            <span className="font-pixel-text text-base font-bold text-stone-200">
              La penalización por la tarea "{event.task.title}" fue absorbida.
            </span>
            <div className="mt-1 font-pixel-text text-sm text-emerald-300">
              ✨ <strong>Sin deleveling:</strong> Tu héroe permanece en <span className="font-pixel-title text-[9px] text-emerald-400">Nv. {event.previousLevel}</span>.
            </div>
            <div className="font-pixel-text text-xs text-stone-400 mt-1">
              Se ha consumido 1 carga del Escudo de Gracia. Mantén otra racha de 7 días para recargarlo.
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 retro-btn-emerald text-xs uppercase"
          >
            <span>Continuar con Determinación</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 animate-fadeIn">
      <div className="retro-box-danger max-w-md w-full p-5 space-y-4 text-stone-100 relative">
        {/* Encabezado Ominoso */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-2 bg-red-950 border-2 border-red-500 mb-1 text-red-400 shadow-[2px_2px_0px_#000] animate-bounce">
            <Skull className="w-8 h-8" />
          </div>
          <h2 className="font-pixel-title text-sm font-black text-red-400 tracking-wider uppercase drop-shadow-[2px_2px_0px_#000]">
            ¡Fallo Crítico!
          </h2>
          <p className="font-pixel-text text-sm text-red-200">
            El descuido de tus deberes ha cobrado su precio en tu héroe.
          </p>
        </div>

        {/* Display de Nivel Quebrado */}
        <div className="bg-[#0f172a] border-2 border-[#18181b] p-3 text-center relative overflow-hidden">
          <div className="font-pixel-title text-[8px] text-stone-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Degradación de Rango</span>
          </div>

          {event.isAgony ? (
            <div className="space-y-1 py-1">
              <span className="font-pixel-title text-xs font-black text-red-500 uppercase tracking-wider animate-pulse">
                ⚠️ ¡Bancarrota & Agonía!
              </span>
              <p className="font-pixel-text text-xs text-red-300">
                Tu personaje está en Nivel 1 y ha tocado fondo. Vitalidad severamente disminuida.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="text-center">
                <span className="font-pixel-title text-base line-through text-stone-500 decoration-red-500 decoration-2">
                  Nv. {event.previousLevel}
                </span>
                <span className="block font-pixel-title text-[7px] text-stone-500">ANTERIOR</span>
              </div>
              <span className="font-pixel-title text-red-500 text-lg">➔</span>
              <div className="text-center">
                <span className="font-pixel-title text-lg font-black text-red-400">
                  Nv. {event.newLevel}
                </span>
                <span className="block font-pixel-title text-[7px] text-red-300">ACTUAL</span>
              </div>
            </div>
          )}
        </div>

        {/* Tarea Culpable */}
        <div className="bg-[#1a0a0a] border-2 border-[#18181b] p-2.5 text-xs space-y-1">
          <div className="font-pixel-title text-[7px] text-stone-400 uppercase font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-red-400" />
            <span>Misión Vencida / Fallida</span>
          </div>
          <div className="font-pixel-title text-[9px] font-bold text-red-200">
            "{event.task.title}"
          </div>
          <div className="font-pixel-text text-xs text-stone-300 capitalize">
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
