import React from 'react';
import { AlertTriangle, Cloud, LoaderCircle, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { CloudSyncControls, CloudSyncStatus } from '../hooks/useCloudSync';

interface AccountSyncPanelProps extends CloudSyncControls {}

const STATUS_LABEL: Record<CloudSyncStatus, string> = {
  not_configured: 'La sincronización en la nube aún no está configurada.',
  signed_out: 'Tu progreso se guarda en este dispositivo. Inicia sesión para sincronizarlo.',
  checking: 'Revisando tu partida en la nube…',
  needs_choice: 'Resolviendo la partida más reciente…',
  syncing: 'Sincronizando tu progreso…',
  synced: 'Tu progreso está sincronizado.',
  offline: 'Sin conexión. Tus cambios siguen guardados en este dispositivo.',
  error: 'No se pudo completar la sincronización.',
};

function formatSyncTime(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export const AccountSyncPanel: React.FC<AccountSyncPanelProps> = ({
  configured,
  userEmail,
  status,
  error,
  lastSyncedAt,
  remoteSave,
  signInWithGoogle,
  signOut,
  restoreCloudSave,
  uploadDeviceSave,
}) => {
  const busy = status === 'checking' || status === 'syncing';

  return (
    <section className="retro-box-stone p-4 space-y-3" aria-labelledby="account-sync-title">
      <div className="flex items-center gap-2">
        <Cloud className="w-4 h-4 text-cyan-400" />
        <h3 id="account-sync-title" className="font-pixel-title text-xs text-stone-100">
          Cuenta y sincronización
        </h3>
      </div>

      {userEmail ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-pixel-text text-xs text-stone-100 truncate">{userEmail}</p>
            <p className="font-pixel-text text-[10px] text-stone-400">Cuenta Google conectada</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex shrink-0 items-center gap-1.5 border-2 border-stone-600 bg-stone-800 px-2.5 py-2 font-pixel-text text-[10px] text-stone-200 hover:bg-stone-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-pixel-text text-xs leading-relaxed text-stone-300">
            Vincula Google para guardar una copia de tu personaje y tus tareas en la nube. El juego sigue funcionando sin conexión.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={!configured || busy}
            className="flex w-full items-center justify-center gap-2 border-2 border-cyan-400 bg-cyan-950/70 px-3 py-2.5 font-pixel-title text-[10px] text-cyan-100 hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Continuar con Google
          </button>
        </div>
      )}

      <div className="flex items-start gap-2 border-t border-stone-700 pt-2">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <p className="font-pixel-text text-[10px] leading-relaxed text-stone-400">
          La nube guardará tus tareas y progreso para recuperarlos en otros dispositivos. Solo tu cuenta podrá acceder a tu copia.
        </p>
      </div>

      <p className={`font-pixel-text text-[10px] ${status === 'error' || status === 'offline' ? 'text-amber-300' : 'text-stone-300'}`} role="status">
        {busy && <LoaderCircle className="mr-1 inline h-3 w-3 animate-spin" />}
        {status === 'error' && <AlertTriangle className="mr-1 inline h-3 w-3" />}
        {STATUS_LABEL[status]}
        {status === 'synced' && formatSyncTime(lastSyncedAt) ? ` Última copia: ${formatSyncTime(lastSyncedAt)}.` : ''}
      </p>
      {error && <p className="break-words font-pixel-text text-[10px] leading-relaxed text-amber-200">{error}</p>}

      {status === 'needs_choice' && remoteSave && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={restoreCloudSave}
            className="border-2 border-emerald-500 bg-emerald-950/70 px-2 py-2 font-pixel-text text-[10px] text-emerald-100 hover:bg-emerald-900"
          >
            Restaurar la copia de la nube
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Esto reemplazará la copia en la nube con los datos de este dispositivo. ¿Continuar?')) {
                void uploadDeviceSave();
              }
            }}
            className="border-2 border-amber-500 bg-amber-950/70 px-2 py-2 font-pixel-text text-[10px] text-amber-100 hover:bg-amber-900"
          >
            Usar esta copia y subirla
          </button>
        </div>
      )}
    </section>
  );
};
