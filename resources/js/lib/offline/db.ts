// resources/js/lib/offline/db.ts
import { openDB, type IDBPDatabase } from "idb";

export interface QueuedMutation {
  ownerId?: string;
  id?: number;
  url: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  formData?: {
    entries: Array<[string, string]>;
    files?: Array<{ key: string; name: string; type: string; data: Blob }>;
  };
  tag: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
  label?: string;
}

const DB_NAME = "nstp-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("outbox")) {
          const store = db.createObjectStore("outbox", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("tag", "tag");
        }
        if (!db.objectStoreNames.contains("cache")) {
          const cache = db.createObjectStore("cache", { keyPath: "url" });
          cache.createIndex("cachedAt", "cachedAt");
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      },
    });
  }
  return dbPromise;
}

export async function addToOutbox(item: QueuedMutation): Promise<number> {
  const db = await getDB();
  const id = await db.add("outbox", item);
  return id as number;
}

export async function getOutbox(): Promise<QueuedMutation[]> {
  const db = await getDB();
  return db.getAll("outbox");
}

export async function getOutboxCount(): Promise<number> {
  const db = await getDB();
  return db.count("outbox");
}

export async function deleteFromOutbox(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("outbox", id);
}

export async function updateOutboxItem(
  id: number,
  updates: Partial<QueuedMutation>,
): Promise<void> {
  const db = await getDB();
  const existing = await db.get("outbox", id);
  if (!existing) return;
  await db.put("outbox", { ...existing, ...updates, id });
}

export async function clearOutbox(): Promise<void> {
  const db = await getDB();
  await db.clear("outbox");
}

export async function setCache(url: string, data: any): Promise<void> {
  const db = await getDB();
  await db.put("cache", { url, data, cachedAt: Date.now() });
}

export async function getCache<T = any>(url: string): Promise<T | null> {
  const db = await getDB();
  const row = await db.get("cache", url);
  return row?.data ?? null;
}

export async function setMeta(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put("meta", value, key);
}

export async function getMeta<T = any>(key: string): Promise<T | null> {
  const db = await getDB();
  return (await db.get("meta", key)) ?? null;
}