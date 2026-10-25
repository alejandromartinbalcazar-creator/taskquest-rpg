import React, { useState } from 'react';
import { X, Smartphone, Cloud, Laptop, Check, Copy, ArrowRight, ShieldCheck } from 'lucide-react';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose }) => {
  const [selectedMethod, setSelectedMethod] = useState<'pwa' | 'cloud' | 'local'>('pwa');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const githubWorkflowCode = `name: Compilar APK Android
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Instalar dependencias
        run: npm ci
      - name: Build Web App
        run: npm run build
      - name: Generar APK con Capacitor
        run: |
          npm i -D @capacitor/core @capacitor/cli @capacitor/android
          npx cap init FocusMission com.taskquest.rpg --web-dir dist
          npx cap add android
          cd android && ./gradlew assembleDebug
      - name: Subir APK descargable
        uses: actions/upload-artifact@v4
        with:
          name: FocusMission-APK
          path: android/app/build/outputs/apk/debug/app-debug.apk
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(githubWorkflowCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="retro-box-stone p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <h3 className="font-pixel-title text-xs text-emerald-400">
            Tener la App en tu Android
          </h3>
        </div>
        <p className="font-pixel-text text-sm text-stone-300 mb-3">
          Diseñado para que tu laptop no sufra ni consuma batería compilando pesados emuladores.
        </p>

        {/* Selector de Método */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setSelectedMethod('pwa')}
            className={`p-3 rounded-2xl border text-left transition ${
              selectedMethod === 'pwa'
                ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md'
                : 'bg-[#161a29] border-[#22263d] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Opción 1 (Recomendada)</span>
            </div>
            <div className="text-xs font-bold text-slate-200">App Nativa PWA</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              0% recursos de laptop. 1 clic para instalar en Android.
            </div>
          </button>

          <button
            onClick={() => setSelectedMethod('cloud')}
            className={`p-3 rounded-2xl border text-left transition ${
              selectedMethod === 'cloud'
                ? 'bg-purple-950/50 border-purple-500 text-white shadow-md'
                : 'bg-[#161a29] border-[#22263d] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 mb-1">
              <Cloud className="w-4 h-4" />
              <span>Opción 2</span>
            </div>
            <div className="text-xs font-bold text-slate-200">APK en la Nube</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              GitHub compila el .apk gratis sin exigir tu procesador.
            </div>
          </button>
        </div>

        {/* DETALLE OPCIÓN 1: PWA */}
        {selectedMethod === 'pwa' && (
          <div className="space-y-3 bg-[#161928] p-4 rounded-2xl border border-[#2b3352] text-xs">
            <h4 className="font-bold text-emerald-400 text-sm">
              ¿Cómo instalarla directamente en tu teléfono?
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-slate-300">
              <li>
                Inicia la app en tu laptop con <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">npm run dev -- --host</code> para abrirla desde la misma red WiFi en el navegador de tu celular (ej. Chrome o Brave).
              </li>
              <li>
                En el navegador de tu móvil, toca el menú de los <strong>tres puntos (⋮)</strong> en la esquina superior derecha.
              </li>
              <li>
                Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla principal"</strong>.
              </li>
              <li>
              <strong>¡Listo!</strong> Tendrás el icono de <strong>FocusMission</strong> en el menú de tu teléfono. Se abre en pantalla completa, guarda tus datos sin conexión y no requirió instalar Android Studio.
              </li>
            </ol>
          </div>
        )}

        {/* DETALLE OPCIÓN 2: APK EN LA NUBE */}
        {selectedMethod === 'cloud' && (
          <div className="space-y-3 bg-[#161928] p-4 rounded-2xl border border-[#2b3352] text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-purple-400 text-sm">
                Compilar APK con GitHub Actions (Gratis)
              </h4>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-slate-900 px-2 py-1 rounded border border-slate-700 hover:text-white"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '¡Copiado!' : 'Copiar YAML'}</span>
              </button>
            </div>

            <p className="text-slate-300">
              Ya hemos preparado este flujo. Al subir este proyecto a GitHub, sus servidores compilan el archivo <code className="text-amber-300">FocusMission.apk</code> para descargarlo en tu móvil.
            </p>

            <div className="bg-[#0b0d14] p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 max-h-36 overflow-y-auto">
              <pre>{githubWorkflowCode}</pre>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#22273e] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
