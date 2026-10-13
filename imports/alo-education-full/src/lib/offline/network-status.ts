'use client';

// ─── Network Status React Hook ────────────────────────────
// Provides real-time online/offline and sync status to React components.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSyncEngine,
  type SyncEngine,
  type SyncStatus,
} from './sync-engine';
import { pendingCount } from './sync-queue';

export interface NetworkStatusState {
  isOnline: boolean;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: Date | null;
  pendingCount: number;
  syncNow: () => Promise<void>;
}

/**
 * React hook that provides real-time network and sync status.
 * Initializes the SyncEngine singleton if not already running.
 */
export function useNetworkStatus(userId?: string): NetworkStatusState {
  const engineRef = useRef<SyncEngine | null>(null);
  const [state, setState] = useState<{
    isOnline: boolean;
    isSyncing: boolean;
    syncStatus: SyncStatus;
    lastSyncAt: Date | null;
    pending: number;
  }>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    syncStatus: 'ONLINE' as SyncStatus,
    lastSyncAt: null,
    pending: 0,
  });

  // Initialize engine on mount
  useEffect(() => {
    const effectiveUserId = userId ?? 'anonymous';
    const engine = getSyncEngine(effectiveUserId);
    engineRef.current = engine;

    // Subscribe to status changes — onStatusChange fires immediately
    // with the current status, so we get the initial state via callback
    const unsubscribe = engine.onStatusChange(() => {
      setState((prev) => ({
        ...prev,
        isOnline: engine.isOnline,
        isSyncing: engine.isSyncing,
        syncStatus: engine.syncStatus,
        lastSyncAt: engine.lastSyncAt,
      }));
    });

    // Start the engine
    engine.start();

    // Periodically refresh pending count
    const pendingInterval = setInterval(async () => {
      const count = await pendingCount();
      setState((prev) => ({ ...prev, pending: count }));
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(pendingInterval);
      engine.stop();
      engineRef.current = null;
    };
  }, [userId]);

  const syncNow = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.syncNow();
      const count = await pendingCount();
      setState((prev) => ({ ...prev, pending: count }));
    }
  }, []);

  return {
    isOnline: state.isOnline,
    isSyncing: state.isSyncing,
    syncStatus: state.syncStatus,
    lastSyncAt: state.lastSyncAt,
    pendingCount: state.pending,
    syncNow,
  };
}
