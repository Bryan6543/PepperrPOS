"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createCheckoutOrder } from "@/actions/orders";
import { idbListOutbox, idbOutboxCount, idbRemoveQueued } from "@/lib/offline/idb";

type Ctx = {
  isOnline: boolean;
  pendingCount: number;
  lastSyncError: string | null;
  refreshPendingCount: () => Promise<void>;
  flushOutbox: () => Promise<void>;
};

const OfflineSyncContext = createContext<Ctx | null>(null);

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const flushing = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      setPendingCount(await idbOutboxCount());
    } catch {
      setPendingCount(0);
    }
  }, []);

  const flushOutbox = useCallback(async () => {
    if (flushing.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    flushing.current = true;
    setLastSyncError(null);
    try {
      const rows = await idbListOutbox();
      for (const row of rows) {
        const res = await createCheckoutOrder({
          ...row.payload,
          client_queue_id: row.client_queue_id,
        });
        if (!res.ok) {
          setLastSyncError(res.error);
          break;
        }
        await idbRemoveQueued(row.client_queue_id);
      }
    } catch (e) {
      setLastSyncError(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      flushing.current = false;
      await refreshPendingCount();
    }
  }, [refreshPendingCount]);

  const flushRef = useRef(flushOutbox);
  flushRef.current = flushOutbox;
  const refreshRef = useRef(refreshPendingCount);
  refreshRef.current = refreshPendingCount;

  useEffect(() => {
    const online = () => {
      setIsOnline(true);
      void flushRef.current();
    };
    const offline = () => setIsOnline(false);
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    void refreshRef.current();
    if (typeof navigator !== "undefined" && navigator.onLine) void flushRef.current();
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  const value = useMemo(
    () => ({ isOnline, pendingCount, lastSyncError, refreshPendingCount, flushOutbox }),
    [isOnline, pendingCount, lastSyncError, refreshPendingCount, flushOutbox],
  );

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
}

export function useOfflineSync(): Ctx {
  const v = useContext(OfflineSyncContext);
  if (!v) {
    return {
      isOnline: true,
      pendingCount: 0,
      lastSyncError: null,
      refreshPendingCount: async () => {},
      flushOutbox: async () => {},
    };
  }
  return v;
}
