import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { GroupedCatalog } from "@/actions/catalog";
import type { OfflineQueuedOrder } from "@/lib/offline/types";

const DB_NAME = "pepperr-pos-offline";
const DB_VERSION = 1;

type Schema = DBSchema & {
  meta: {
    key: string;
    value: { key: string; updatedAt: number; data: unknown };
  };
  outbox: {
    key: string;
    value: OfflineQueuedOrder;
  };
};

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

function open(): Promise<IDBPDatabase<Schema>> {
  if (!dbPromise) {
    dbPromise = openDB<Schema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("outbox")) {
          db.createObjectStore("outbox", { keyPath: "client_queue_id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function idbSaveCatalog(catalog: GroupedCatalog): Promise<void> {
  const db = await open();
  await db.put("meta", { key: "catalog", updatedAt: Date.now(), data: catalog });
}

export async function idbLoadCatalog(): Promise<GroupedCatalog | null> {
  const db = await open();
  const row = await db.get("meta", "catalog");
  if (!row?.data) return null;
  return row.data as GroupedCatalog;
}

export async function idbSaveSettings(settings: Record<string, string>): Promise<void> {
  const db = await open();
  await db.put("meta", { key: "settings", updatedAt: Date.now(), data: settings });
}

export async function idbLoadSettings(): Promise<Record<string, string> | null> {
  const db = await open();
  const row = await db.get("meta", "settings");
  if (!row?.data) return null;
  return row.data as Record<string, string>;
}

export async function idbEnqueueOrder(row: OfflineQueuedOrder): Promise<void> {
  const db = await open();
  await db.put("outbox", row);
}

export async function idbListOutbox(): Promise<OfflineQueuedOrder[]> {
  const db = await open();
  return db.getAll("outbox");
}

export async function idbRemoveQueued(clientQueueId: string): Promise<void> {
  const db = await open();
  await db.delete("outbox", clientQueueId);
}

export async function idbOutboxCount(): Promise<number> {
  const db = await open();
  return db.count("outbox");
}
