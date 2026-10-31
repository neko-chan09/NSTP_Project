// resources/js/hooks/useSyncQueue.ts
import { useEffect, useState, useCallback } from "react";
import {
  listQueue,
  queueCount,
  clearQueue,
  removeFromQueue,
  OUTBOX_CHANGED_EVENT,
} from "../../lib/offline/outbox";
import { flushQueue } from "../../lib/offline/sync";
import type { QueuedMutation } from "../../lib/offline/db";

export function useSyncQueue() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<QueuedMutation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const c = await queueCount();
      setCount(c);
      const all = await listQueue();
      setItems(all);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    refresh();

    const onChange = () => refresh();
    window.addEventListener(OUTBOX_CHANGED_EVENT, onChange);

    const onSyncStart = () => setSyncing(true);
    const onSyncEnd = () => {
      setSyncing(false);
      refresh();
    };
    window.addEventListener("nstp:sync-started", onSyncStart);
    window.addEventListener("nstp:sync-finished", onSyncEnd);

    return () => {
      window.removeEventListener(OUTBOX_CHANGED_EVENT, onChange);
      window.removeEventListener("nstp:sync-started", onSyncStart);
      window.removeEventListener("nstp:sync-finished", onSyncEnd);
    };
  }, [refresh]);

  const flush = useCallback(async () => {
    setLastError(null);
    try {
      const res = await flushQueue();
      await refresh();
      return res;
    } catch (err: any) {
      setLastError(err?.message || "Sync failed");
      return { success: 0, failed: 0 };
    }
  }, [refresh]);

  const clear = useCallback(async () => {
    await clearQueue();
    await refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: number) => {
      await removeFromQueue(id);
      await refresh();
    },
    [refresh],
  );

  return {
    count,
    items,
    syncing,
    lastError,
    flush,
    clear,
    remove,
    refresh,
  };
}