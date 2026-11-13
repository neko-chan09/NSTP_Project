// resources/js/lib/offline/sync.ts
import { getToken, getCurrentUserId } from "../token";
import {
  listQueue,
  markAttempt,
  removeFromQueue,
  deserializeFormData,
} from "./outbox";
import { setMeta } from "./db";

let syncing = false;
let intervalId: number | null = null;

export const SYNC_STARTED_EVENT = "nstp:sync-started";
export const SYNC_FINISHED_EVENT = "nstp:sync-finished";

function emit(name: string, detail?: any) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export async function flushQueue(): Promise<{
  success: number;
  failed: number;
}> {
  if (syncing) return { success: 0, failed: 0 };
  if (!navigator.onLine) return { success: 0, failed: 0 };

  syncing = true;
  emit(SYNC_STARTED_EVENT);

  let success = 0;
  let failed = 0;

  try {
    const items = await listQueue();
    if (items.length === 0) return { success, failed };

    const owner = getCurrentUserId();
    const authToken = getToken();
    if (!owner || !authToken) return {success, failed};
    for (const item of items) {
      if (item.ownerId !== owner) continue;
      if (getCurrentUserId() !== owner || getToken() !== authToken) break;
      if (!item.id) continue;

      try {
        const token = getToken();
        const headers: Record<string, string> = {
          Accept: "application/json",
          ...(item.headers || {}),
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        let body: BodyInit | undefined;

        if (item.formData) {
          body = deserializeFormData(item.formData);
        } else if (item.body !== undefined) {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify(item.body);
        }

        const response = await fetch(item.url, {
          method: item.method,
          headers,
          body,
        });

        if (response.status === 401) {
          await markAttempt(item.id, "Unauthorized");
          failed++;
          break;
        }

        if (response.ok) {
          await removeFromQueue(item.id);
          success++;
        } else {
          const text = await response.text().catch(() => "");
          await markAttempt(
            item.id,
            `HTTP ${response.status}: ${text.slice(0, 200)}`,
          );
          failed++;
        }
      } catch (err: any) {
        if (item.id) {
          await markAttempt(item.id, err?.message || "Network error");
        }
        failed++;
      }
    }
  } finally {
    syncing = false;
    if (success > 0) await setMeta("lastSyncAt", Date.now());
    emit(SYNC_FINISHED_EVENT, { success, failed });
  }

  return { success, failed };
}

const onOnline = () => { flushQueue().catch(() => {}); };

export function startSyncEngine() {
  if (intervalId !== null) return;

  window.addEventListener("online", onOnline);

  intervalId = window.setInterval(() => {
    if (navigator.onLine) flushQueue().catch(() => {});
  }, 60_000);

  if (navigator.onLine) {
    flushQueue().catch(() => {});
  }
}

export function stopSyncEngine() {
  window.removeEventListener("online", onOnline);
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

export function isSyncing(): boolean {
  return syncing;
}