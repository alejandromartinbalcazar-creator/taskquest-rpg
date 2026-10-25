import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CloudSaveRecord,
  CloudSaveSnapshot,
  createCloudSave,
  loadCloudSave,
  updateCloudSave,
} from '../services/cloudSaveService';
import { isSupabaseConfigured, nativeAuthCallbackUrl, supabase } from '../services/supabaseClient';

export type CloudSyncStatus =
  | 'not_configured'
  | 'signed_out'
  | 'checking'
  | 'needs_choice'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'error';

export interface CloudSyncControls {
  configured: boolean;
  userEmail: string | null;
  status: CloudSyncStatus;
  error: string | null;
  lastSyncedAt: string | null;
  remoteSave: CloudSaveRecord | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  restoreCloudSave: () => void;
  uploadDeviceSave: () => Promise<void>;
}

interface UseCloudSyncOptions {
  snapshot: CloudSaveSnapshot;
  onApplyCloudSave: (snapshot: CloudSaveSnapshot) => void;
}

function messageForError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error de sincronización.';
}

export function useCloudSync({ snapshot, onApplyCloudSave }: UseCloudSyncOptions): CloudSyncControls {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<CloudSyncStatus>(
    isSupabaseConfigured ? 'signed_out' : 'not_configured',
  );
  const [error, setError] = useState<string | null>(null);
  const [remoteSave, setRemoteSave] = useState<CloudSaveRecord | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const snapshotRef = useRef(snapshot);
  const revisionRef = useRef<number | null>(null);
  const savedPayloadRef = useRef('');
  const syncLockRef = useRef(false);
  const syncQueuedRef = useRef(false);

  snapshotRef.current = snapshot;

  useEffect(() => {
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setError(null);
      if (!session) {
        revisionRef.current = null;
        savedPayloadRef.current = '';
        setCloudReady(false);
        setRemoteSave(null);
        setLastSyncedAt(null);
        setStatus('signed_out');
      }
    });

    void supabase.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
      if (sessionError) {
        setError(messageForError(sessionError));
        setStatus('error');
        return;
      }
      setUser(sessionData.session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !Capacitor.isNativePlatform()) return;
    const client = supabase;

    let active = true;
    let removeListener: (() => void) | undefined;
    const handleAuthCallback = async (url: string) => {
      if (!url.startsWith(nativeAuthCallbackUrl)) return;
      try {
        const callbackUrl = new URL(url);
        const callbackError = callbackUrl.searchParams.get('error_description');
        if (callbackError) throw new Error(callbackError);

        const code = callbackUrl.searchParams.get('code');
        if (!code) throw new Error('Google no devolvió el código de inicio de sesión.');

        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        setError(null);
        await Browser.close().catch(() => undefined);
      } catch (callbackError) {
        setError(messageForError(callbackError));
        setStatus('error');
        await Browser.close().catch(() => undefined);
      }
    };

    void CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      void handleAuthCallback(url);
    }).then((listener) => {
      if (active) removeListener = () => void listener.remove();
      else void listener.remove();
    });

    void CapacitorApp.getLaunchUrl().then((launchUrl) => {
      if (launchUrl?.url) void handleAuthCallback(launchUrl.url);
    });

    return () => {
      active = false;
      removeListener?.();
    };
  }, []);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!supabase || !userId) {
      revisionRef.current = null;
      savedPayloadRef.current = '';
      setCloudReady(false);
      setRemoteSave(null);
      if (!isSupabaseConfigured) setStatus('not_configured');
      return;
    }

    let cancelled = false;
    setCloudReady(false);
    setRemoteSave(null);
    setStatus('checking');
    setError(null);

    const initializeCloudSave = async () => {
      try {
        const existing = await loadCloudSave(userId);
        if (cancelled) return;

        if (existing) {
          // La nube es la fuente de verdad al iniciar sesión. Evita que una copia
          // local antigua reemplace por accidente el progreso más reciente.
          onApplyCloudSave(existing.saveData);
          revisionRef.current = existing.revision;
          savedPayloadRef.current = JSON.stringify(existing.saveData);
          setRemoteSave(null);
          setLastSyncedAt(existing.updatedAt);
          setCloudReady(true);
          setStatus('synced');
          return;
        }

        const created = await createCloudSave(userId, snapshotRef.current);
        if (cancelled) return;
        revisionRef.current = created.revision;
        savedPayloadRef.current = JSON.stringify(snapshotRef.current);
        setLastSyncedAt(created.updatedAt);
        setCloudReady(true);
        setStatus('synced');
      } catch (initialError) {
        if (cancelled) return;

        // A second device can create the row between our read and insert.
        try {
          const rowCreatedElsewhere = await loadCloudSave(userId);
          if (rowCreatedElsewhere) {
            onApplyCloudSave(rowCreatedElsewhere.saveData);
            revisionRef.current = rowCreatedElsewhere.revision;
            savedPayloadRef.current = JSON.stringify(rowCreatedElsewhere.saveData);
            setLastSyncedAt(rowCreatedElsewhere.updatedAt);
            setCloudReady(true);
            setStatus('synced');
            return;
          }
        } catch {
          // Keep the original error below; it is usually more actionable.
        }

        setError(messageForError(initialError));
        setStatus(navigator.onLine ? 'error' : 'offline');
      }
    };

    void initializeCloudSave();
    return () => {
      cancelled = true;
    };
  }, [onApplyCloudSave, userId]);

  const syncLatest = useCallback(async () => {
    if (!supabase || !userId || !cloudReady) return;
    if (syncLockRef.current) {
      syncQueuedRef.current = true;
      return;
    }

    syncLockRef.current = true;
    try {
      do {
        syncQueuedRef.current = false;
        const currentSnapshot = snapshotRef.current;
        const serializedSnapshot = JSON.stringify(currentSnapshot);
        if (serializedSnapshot === savedPayloadRef.current) continue;

        const expectedRevision = revisionRef.current;
        if (expectedRevision === null) return;

        setStatus('syncing');
        const updated = await updateCloudSave(userId, currentSnapshot, expectedRevision);
        if (!updated) {
          const latest = await loadCloudSave(userId);
          setRemoteSave(latest);
          setCloudReady(false);
          setStatus(latest ? 'needs_choice' : 'error');
          setError(latest ? null : 'No se encontró la partida en la nube.');
          return;
        }

        revisionRef.current = updated.revision;
        savedPayloadRef.current = serializedSnapshot;
        setLastSyncedAt(updated.updatedAt);
        setError(null);
        setStatus('synced');
      } while (syncQueuedRef.current);
    } catch (syncError) {
      setError(messageForError(syncError));
      setStatus(navigator.onLine ? 'error' : 'offline');
    } finally {
      syncLockRef.current = false;
    }
  }, [cloudReady, userId]);

  useEffect(() => {
    if (!cloudReady || !userId) return;
    if (JSON.stringify(snapshot) === savedPayloadRef.current) return;

    const timer = window.setTimeout(() => void syncLatest(), 1800);
    return () => window.clearTimeout(timer);
  }, [cloudReady, snapshot, syncLatest, userId]);

  useEffect(() => {
    const retryWhenOnline = () => void syncLatest();
    window.addEventListener('online', retryWhenOnline);
    return () => window.removeEventListener('online', retryWhenOnline);
  }, [syncLatest]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      setError('La autenticación con Google todavía no está configurada.');
      setStatus('not_configured');
      return;
    }

    setError(null);
    try {
      const native = Capacitor.isNativePlatform();
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: native ? nativeAuthCallbackUrl : window.location.origin,
          skipBrowserRedirect: native,
        },
      });
      if (signInError) throw signInError;
      if (native && data.url) await Browser.open({ url: data.url });
      else if (!native && data.url) window.location.assign(data.url);
    } catch (signInError) {
      setError(messageForError(signInError));
      setStatus('error');
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(messageForError(signOutError));
      setStatus('error');
    }
  }, []);

  const restoreCloudSave = useCallback(() => {
    if (!remoteSave) return;
    onApplyCloudSave(remoteSave.saveData);
    revisionRef.current = remoteSave.revision;
    savedPayloadRef.current = JSON.stringify(remoteSave.saveData);
    setLastSyncedAt(remoteSave.updatedAt);
    setRemoteSave(null);
    setError(null);
    setCloudReady(true);
    setStatus('synced');
  }, [onApplyCloudSave, remoteSave]);

  const uploadDeviceSave = useCallback(async () => {
    if (!userId || !remoteSave) return;
    setStatus('syncing');
    setError(null);
    try {
      const updated = await updateCloudSave(userId, snapshotRef.current, remoteSave.revision);
      if (!updated) {
        const latest = await loadCloudSave(userId);
        setRemoteSave(latest);
        setStatus(latest ? 'needs_choice' : 'error');
        setError(latest ? null : 'No se encontró la partida en la nube.');
        return;
      }
      revisionRef.current = updated.revision;
      savedPayloadRef.current = JSON.stringify(snapshotRef.current);
      setLastSyncedAt(updated.updatedAt);
      setRemoteSave(null);
      setCloudReady(true);
      setStatus('synced');
    } catch (uploadError) {
      setError(messageForError(uploadError));
      setStatus(navigator.onLine ? 'error' : 'offline');
    }
  }, [remoteSave, userId]);

  return {
    configured: isSupabaseConfigured,
    userEmail: user?.email ?? null,
    status,
    error,
    lastSyncedAt,
    remoteSave,
    signInWithGoogle,
    signOut,
    restoreCloudSave,
    uploadDeviceSave,
  };
}
