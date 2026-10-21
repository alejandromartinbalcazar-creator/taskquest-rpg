import React, { useState } from 'react';
import { CHANGELOG_DATA, ChangeType } from '../data/changelog';
import {
  X,
  GitCommit,
  Calendar,
  Sparkles,
  Wrench,
  Scale,
  Cpu,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal
} from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<ChangeType | 'all'>('all');
  const [copied, setCopied] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    '0.4.0': true,
    '0.3.5': true,
  });

  if (!isOpen) return null;

  const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.4.0';
  const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '2026-10-21';
  const commitHash = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev';

  const handleCopyHash = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(commitHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleVersion = (ver: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [ver]: !prev[ver],
    }));
  };

  // Conteo de métricas
  const totalChanges = CHANGELOG_DATA.reduce((acc, curr) => acc + curr.changes.length, 0);
  const totalFeatures = CHANGELOG_DATA.reduce(
    (acc, curr) => acc + curr.changes.filter((c) => c.type === 'feature').length,
    0
  );
  const totalFixes = CHANGELOG_DATA.reduce(
    (acc, curr) => acc + curr.changes.filter((c) => c.type === 'fix').length,
    0
  );
  const totalBalance = CHANGELOG_DATA.reduce(
    (acc, curr) => acc + curr.changes.filter((c) => c.type === 'balance').length,
    0
  );
  const totalEngine = CHANGELOG_DATA.reduce(
    (acc, curr) => acc + curr.changes.filter((c) => c.type === 'engine').length,
    0
  );

  const getTagBadge = (type: ChangeType) => {
    switch (type) {
      case 'feature':
        return (
          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Feature
          </span>
        );
      case 'fix':
        return (
          <span className="bg-amber-950/80 text-amber-300 border border-amber-600/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <Wrench className="w-3 h-3 text-amber-400" />
            Fix
          </span>
        );
      case 'balance':
        return (
          <span className="bg-purple-950/80 text-purple-300 border border-purple-600/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <Scale className="w-3 h-3 text-purple-400" />
            Balance
          </span>
        );
      case 'engine':
        return (
          <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-600/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <Cpu className="w-3 h-3 text-cyan-400" />
            Engine
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in zoom-in-95">
      <div className="bg-[#0f111a] border-2 border-stone-800 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 pb-3 border-b border-stone-800/80 flex items-center justify-between bg-gradient-to-r from-[#171a29] via-[#10121d] to-[#171a29]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-950/80 border border-amber-600/40 text-amber-400 shadow-md">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-100 tracking-wider">
                  DEV CHANGELOG
                </h3>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded-full border border-amber-600/40 font-mono">
                  v{currentVersion}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Historial de versiones, compilaciones y notas de lanzamiento.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800/60 rounded-xl transition"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel de Metadatos de Compilación */}
        <div className="bg-[#141624] px-4 py-2.5 border-b border-stone-800/80 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-stone-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Compilado:</span>
            <span className="font-mono text-cyan-300 font-bold text-[11px]">{buildDate}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0b0c14] px-2 py-1 rounded-xl border border-stone-800">
            <GitCommit className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] text-stone-400">Hash:</span>
            <span className="font-mono text-purple-300 font-bold text-[11px]">{commitHash}</span>
            <button
              onClick={handleCopyHash}
              className="ml-1 p-1 hover:text-white text-stone-400 transition"
              title="Copiar commit hash"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Resumen de Métricas */}
        <div className="grid grid-cols-4 gap-1.5 p-3 bg-[#111320] border-b border-stone-800/60 text-center">
          <div className="p-1.5 rounded-xl bg-stone-900/60 border border-stone-800">
            <span className="block text-xs font-black text-emerald-400">{totalFeatures}</span>
            <span className="text-[9px] text-stone-400 uppercase font-bold">Features</span>
          </div>
          <div className="p-1.5 rounded-xl bg-stone-900/60 border border-stone-800">
            <span className="block text-xs font-black text-cyan-400">{totalEngine}</span>
            <span className="text-[9px] text-stone-400 uppercase font-bold">Motor 60fps</span>
          </div>
          <div className="p-1.5 rounded-xl bg-stone-900/60 border border-stone-800">
            <span className="block text-xs font-black text-purple-400">{totalBalance}</span>
            <span className="text-[9px] text-stone-400 uppercase font-bold">Balance</span>
          </div>
          <div className="p-1.5 rounded-xl bg-stone-900/60 border border-stone-800">
            <span className="block text-xs font-black text-amber-400">{totalFixes}</span>
            <span className="text-[9px] text-stone-400 uppercase font-bold">Fixes</span>
          </div>
        </div>

        {/* Filtros por Categoría */}
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-stone-800/60 bg-[#0e101a]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${
              filter === 'all'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            Todos ({totalChanges})
          </button>
          <button
            onClick={() => setFilter('feature')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${
              filter === 'feature'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            ✨ Features ({totalFeatures})
          </button>
          <button
            onClick={() => setFilter('engine')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${
              filter === 'engine'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            ⚡ Motor ({totalEngine})
          </button>
          <button
            onClick={() => setFilter('balance')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${
              filter === 'balance'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            ⚖️ Balance ({totalBalance})
          </button>
          <button
            onClick={() => setFilter('fix')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 ${
              filter === 'fix'
                ? 'bg-amber-700 text-white shadow'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            🛠️ Fixes ({totalFixes})
          </button>
        </div>

        {/* Lista de Versiones Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {CHANGELOG_DATA.map((entry) => {
            const filteredChanges =
              filter === 'all'
                ? entry.changes
                : entry.changes.filter((c) => c.type === filter);

            if (filteredChanges.length === 0) return null;

            const isExpanded = expandedVersions[entry.version] ?? true;

            return (
              <div
                key={entry.version}
                className="bg-[#141724] border border-stone-800 rounded-2xl overflow-hidden shadow-lg transition"
              >
                {/* Cabecera de la versión */}
                <div
                  onClick={() => toggleVersion(entry.version)}
                  className="p-3 bg-gradient-to-r from-[#191d2e] to-[#121422] flex items-center justify-between cursor-pointer hover:bg-stone-800/40 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      v{entry.version}
                    </span>
                    <h4 className="font-bold text-xs text-stone-100">{entry.title}</h4>
                  </div>

                  <div className="flex items-center gap-2 text-stone-400">
                    <span className="text-[10px] font-mono">{entry.date}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* Lista de cambios */}
                {isExpanded && (
                  <div className="p-3 space-y-2 border-t border-stone-800/60 bg-[#0f111a]">
                    {filteredChanges.map((change, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-stone-200 leading-snug"
                      >
                        {getTagBadge(change.type)}
                        <p className="flex-1 text-[11px] pt-0.5 text-stone-300">
                          {change.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pie del Modal */}
        <div className="p-3 border-t border-stone-800 bg-[#121420] flex items-center justify-between text-xs">
          <span className="text-[10px] text-stone-500 font-mono">
            TaskQuest RPG Engine • React 18 + Canvas 2.5D
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition shadow active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
