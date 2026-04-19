"use client";

import { useOfflineSync } from "@/contexts/OfflineSyncContext";

export function OfflineBanner() {
  const { isOnline, pendingCount, lastSyncError, flushOutbox } = useOfflineSync();

  if (isOnline && pendingCount === 0 && !lastSyncError) return null;

  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-100"
      role="status"
    >
      {!isOnline && (
        <span>
          <strong>Offline.</strong> You can still bill walk-in orders; they are saved on this device and will upload when
          the connection returns.
        </span>
      )}
      {isOnline && pendingCount > 0 && (
        <span>
          <strong>{pendingCount} order(s) queued</strong> from offline use — syncing…{" "}
          <button type="button" className="ml-2 font-semibold underline" onClick={() => void flushOutbox()}>
            Retry sync
          </button>
        </span>
      )}
      {isOnline && pendingCount === 0 && lastSyncError && (
        <span>
          <strong>Sync issue:</strong> {lastSyncError}{" "}
          <button type="button" className="ml-2 font-semibold underline" onClick={() => void flushOutbox()}>
            Retry
          </button>
        </span>
      )}
    </div>
  );
}
