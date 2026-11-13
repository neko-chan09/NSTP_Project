import { getCurrentUserId } from '../token';
// resources/js/lib/offline/outbox.ts
import {
  addToOutbox,
  deleteFromOutbox,
  getOutbox,
  updateOutboxItem,
  type QueuedMutation,
} from "./db";

export const OUTBOX_CHANGED_EVENT = "nstp:outbox-changed";

function emitChange() {
  window.dispatchEvent(new CustomEvent(OUTBOX_CHANGED_EVENT));
}

export async function queueMutation(
  mutation: Omit<
    QueuedMutation,
    "id" | "createdAt" | "attempts" | "lastError"
  >,
): Promise<number> {
  if (!mutation.ownerId) throw new Error('Sign in before saving offline changes.');
  const id = await addToOutbox({
    ...mutation,
    createdAt: Date.now(),
    attempts: 0,
  });
  emitChange();
  return id;
}

export async function listQueue(): Promise<QueuedMutation[]> {
  const owner = getCurrentUserId();
  return owner ? (await getOutbox()).filter(item => item.ownerId === owner) : [];
}

export async function queueCount(): Promise<number> {
  return (await listQueue()).length;
}

export async function removeFromQueue(id: number): Promise<void> {
  await deleteFromOutbox(id);
  emitChange();
}

export async function markAttempt(id: number, error?: string): Promise<void> {
  const items = await getOutbox();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  await updateOutboxItem(id, {
    attempts: (item.attempts || 0) + 1,
    lastError: error,
  });
  emitChange();
}

export async function clearQueue(): Promise<void> {
  for (const item of await listQueue()) { if (item.id != null) await deleteFromOutbox(item.id); }
  emitChange();
}

export function serializeFormData(fd: FormData): QueuedMutation["formData"] {
  const entries: Array<[string, string]> = [];
  const files: NonNullable<QueuedMutation["formData"]>["files"] = [];

  fd.forEach((value, key) => {
    if (value instanceof File) {
      files.push({
        key,
        name: value.name,
        type: value.type,
        data: value,
      });
    } else {
      entries.push([key, String(value)]);
    }
  });

  return { entries, files };
}

export function deserializeFormData(
  data: NonNullable<QueuedMutation["formData"]>,
): FormData {
  const fd = new FormData();
  for (const [k, v] of data.entries) {
    fd.append(k, v);
  }
  if (data.files) {
    for (const f of data.files) {
      fd.append(f.key, f.data, f.name);
    }
  }
  return fd;
}