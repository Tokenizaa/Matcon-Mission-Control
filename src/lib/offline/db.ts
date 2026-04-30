import { openDB, type IDBPDatabase } from "idb";
import type { Database } from "@/integrations/supabase/types";

export type TableName = keyof Database["public"]["Tables"];

export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type Insert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type Update<T extends TableName> = Database["public"]["Tables"][T]["Update"];

export type MutationOp = "insert" | "update" | "delete";

export interface PendingMutation {
  id: string;
  table: TableName;
  op: MutationOp;
  payload?: Record<string, unknown> | null;
  match?: Record<string, string | number | boolean | null>;
  createdAt: number;
  tries: number;
  error?: string;
}

const DB_NAME = "balcao_offline";
const DB_VERSION = 2;

const TABLES: TableName[] = [
  "customers", 
  "products", 
  "quotes", 
  "quote_items", 
  "orders", 
  "order_items", 
  "payments",
  "whatsapp_events",
  "conversation_contexts",
  "event_store",
  "message_intents"
];

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const t of TABLES) {
          if (!db.objectStoreNames.contains(`cache_${t}`)) {
            db.createObjectStore(`cache_${t}`, { keyPath: "id" });
          }
        }
        if (!db.objectStoreNames.contains("mutations")) {
          db.createObjectStore("mutations", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      },
    });
  }
  return dbPromise;
}

// ----- cache helpers -----

export async function cachePut<T extends TableName>(table: T, rows: Row<T>[]) {
  if (!rows?.length) return;
  const db = await getDB();
  const tx = db.transaction(`cache_${table}`, "readwrite");
  for (const r of rows) {
    if (r && "id" in r) await tx.store.put(r);
  }
  await tx.done;
}

export async function cacheReplaceAll<T extends TableName>(table: T, rows: Row<T>[]) {
  const db = await getDB();
  const tx = db.transaction(`cache_${table}`, "readwrite");
  await tx.store.clear();
  for (const r of rows ?? []) {
    if (r && "id" in r) await tx.store.put(r);
  }
  await tx.done;
}

export async function cacheGetAll<T extends TableName>(table: T): Promise<Row<T>[]> {
  const db = await getDB();
  return db.getAll(`cache_${table}`);
}

export async function cacheUpsertOne<T extends TableName>(table: T, row: Row<T> | Insert<T> | Update<T>) {
  if (!row || !("id" in row)) return;
  const db = await getDB();
  await db.put(`cache_${table}`, row);
}

export async function cacheDeleteOne(table: TableName, id: string) {
  const db = await getDB();
  await db.delete(`cache_${table}`, id);
}

// ----- mutations queue -----

export async function enqueueMutation(m: Omit<PendingMutation, "id" | "createdAt" | "tries">) {
  const db = await getDB();
  const full: PendingMutation = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    tries: 0,
    ...m,
  };
  await db.put("mutations", full);
  return full;
}

export async function listMutations(): Promise<PendingMutation[]> {
  const db = await getDB();
  const all = await db.getAll("mutations");
  return (all as PendingMutation[]).sort((a, b) => a.createdAt - b.createdAt);
}

export async function deleteMutation(id: string) {
  const db = await getDB();
  await db.delete("mutations", id);
}

export async function updateMutation(m: PendingMutation) {
  const db = await getDB();
  await db.put("mutations", m);
}

export async function countMutations(): Promise<number> {
  const db = await getDB();
  return db.count("mutations");
}
