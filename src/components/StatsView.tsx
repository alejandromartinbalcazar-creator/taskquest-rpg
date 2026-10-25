import React, { useState, useRef } from 'react';
import { Player, Task } from '../types';
import { StorageService } from '../services/storageService';
import { sound } from '../services/soundService';
import { AccountSyncPanel } from './AccountSyncPanel';
import { CloudSyncControls } from '../hooks/useCloudSync';
import {
  BarChart3,
  Download,
  Upload,
  Swords,
  Wind,
  Shield,
  BookOpen,
  TrendingUp,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface StatsViewProps {
  player: Player;
  tasks: Task[];
  accountSync: CloudSyncControls;
  onDataImported: () => void;
  onOpenChangelogModal?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  player,
  tasks,
  accountSync,
  onDataImported,
  onOpenChangelogModal,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Contador de toques secretos para abrir Changelog
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  const handleVersionTap = () => {
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

  // Estadísticas reales por Afinidad de Atributo del Personaje
  const attackTasks = tasks.filter((t) => t.statAffinity === 'attack');
  const speedTasks = tasks.filter((t) => t.statAffinity === 'speed');
  const defenseTasks = tasks.filter((t) => t.statAffinity === 'defense');
  const knowledgeTasks = tasks.filter((t) => t.statAffinity === 'knowledge');

  const attackCompleted = attackTasks.filter((t) => t.completed).length;
  const speedCompleted = speedTasks.filter((t) => t.completed).length;
  const defenseCompleted = defenseTasks.filter((t) => t.completed).length;
  const knowledgeCompleted = knowledgeTasks.filter((t) => t.completed).length;

  const totalCompleted = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const handleExport = () => {
    const json = StorageService.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusmission_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importData(content);
      if (success) {
        setImportStatus('¡Datos restaurados con éxito!');
        onDataImported();
      } else {
        setImportStatus('Error: Archivo de respaldo no válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-xl mx-auto px-3 py-4 pb-24 space-y-4">
      <AccountSyncPanel {...accountSync} />

      {/* Resumen Principal 16-Bit */}
      <div className="retro-box-stone p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="font-pixel-title text-xs text-stone-100">Panel de Rendimiento Real</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-[#0f172a] p-2.5 border-2 border-[#18181b] shadow-[2px_2px_0px_#000]">
            <span className="font-pixel-title text-base text-emerald-400">{totalCompleted}</span>
            <div className="font-pixel-text text-sm text-stone-300 mt-0.5">
              Misiones Conquistadas
            </div>
          </div>

          <div className="bg-[#0f172a] p-2.5 border-2 border-[#18181b] shadow-[2px_2px_0px_#000]">
            <span className="font-pixel-title text-base text-cyan-400">{completionRate}%</span>
            <div className="font-pixel-text text-sm text-stone-300 mt-0.5">
              Efectividad Global
            </div>
          </div>

          <div className="bg-[#0f172a] p-2.5 border-2 border-[#18181b] shadow-[2px_2px_0px_#000]">
            <span className="font-pixel-title text-sm text-amber-400">
              {player.cleanStreakDays} días
            </span>
            <div className="font-pixel-text text-sm text-stone-300 mt-0.5">
              Racha sin Procrastinar
            </div>
          </div>

          <div className="bg-[#0f172a] p-2.5 border-2 border-[#18181b] shadow-[2px_2px_0px_#000]">
            <span className="font-pixel-title text-sm text-rose-400">
              {player.totalDamageSufferedFromProcrastination} HP
            </span>
            <div className="font-pixel-text text-sm text-stone-300 mt-0.5">
              Daño por Retrasos
            </div>
          </div>
        </div>
      </div>

      {/* Desglose por Atributos del Héroe */}
      <div className="retro-box-stone p-4 space-y-3">
        <h4 className="font-pixel-title text-[9px] text-stone-300 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          Progreso por Atributos del Héroe
        </h4>

        <div className="space-y-3">
          {/* Ataque */}
          <div>
            <div className="flex justify-between font-pixel-title text-[8px] mb-1">
              <span className="text-rose-400 flex items-center gap-1.5">
                <Swords className="w-3 h-3" />
                Ataque (Nv. {player.stats.attack})
              </span>
              <span className="text-stone-300 font-pixel-text text-xs">
                {attackCompleted} / {attackTasks.length} completadas
              </span>
            </div>
            <div className="retro-bar-container h-3 w-full">
              <div
                className="retro-bar-fill bg-rose-600"
                style={{
                  width: `${attackTasks.length > 0 ? (attackCompleted / attackTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Velocidad */}
          <div>
            <div className="flex justify-between font-pixel-title text-[8px] mb-1">
              <span className="text-amber-400 flex items-center gap-1.5">
                <Wind className="w-3 h-3" />
                Velocidad (Nv. {player.stats.speed})
              </span>
              <span className="text-stone-300 font-pixel-text text-xs">
                {speedCompleted} / {speedTasks.length} completadas
              </span>
            </div>
            <div className="retro-bar-container h-3 w-full">
              <div
                className="retro-bar-fill bg-amber-500"
                style={{
                  width: `${speedTasks.length > 0 ? (speedCompleted / speedTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Resistencia */}
          <div>
            <div className="flex justify-between font-pixel-title text-[8px] mb-1">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Resistencia (Nv. {player.stats.defense})
              </span>
              <span className="text-stone-300 font-pixel-text text-xs">
                {defenseCompleted} / {defenseTasks.length} completadas
              </span>
            </div>
            <div className="retro-bar-container h-3 w-full">
              <div
                className="retro-bar-fill bg-emerald-500"
                style={{
                  width: `${defenseTasks.length > 0 ? (defenseCompleted / defenseTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Conocimiento */}
          <div>
            <div className="flex justify-between font-pixel-title text-[8px] mb-1">
              <span className="text-cyan-400 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                Conocimiento (Nv. {player.stats.knowledge})
              </span>
              <span className="text-stone-300 font-pixel-text text-xs">
                {knowledgeCompleted} / {knowledgeTasks.length} completadas
              </span>
            </div>
            <div className="retro-bar-container h-3 w-full">
              <div
                className="retro-bar-fill bg-cyan-500"
                style={{
                  width: `${knowledgeTasks.length > 0 ? (knowledgeCompleted / knowledgeTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Respaldo y Exportación de Datos */}
      <div className="retro-box-stone p-4 space-y-2.5">
        <h4 className="font-pixel-title text-[9px] text-stone-300 uppercase tracking-wider">
          Respaldo de Progreso (100% Offline)
        </h4>
        <p className="font-pixel-text text-sm text-stone-300">
          Tus datos se guardan de forma privada y local en tu dispositivo. Puedes descargar una
          copia en cualquier momento para restaurarla en otro equipo o teléfono.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 retro-btn-stone"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Descargar Respaldo</span>
          </button>

          <label className="flex-1 flex items-center justify-center gap-1.5 py-2 retro-btn-stone cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Restaurar Datos</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <p className="font-pixel-text text-sm text-center text-cyan-300 font-bold">{importStatus}</p>
        )}
      </div>

      {/* Pie discreto con versión y activador easter egg */}
      <div className="pt-2 pb-1 text-center">
        <button
          type="button"
          onClick={handleVersionTap}
          className="font-pixel-title text-[7px] text-stone-600 hover:text-stone-400 transition select-none px-2 py-1"
          title="Toca 5 veces para ver el registro de versiones (Changelog)"
        >
          FocusMission v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.4.0'}
        </button>
      </div>
    </div>
  );
};
