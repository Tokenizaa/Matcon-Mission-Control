import { supabase } from "@/integrations/supabase/client";
import {
  cacheGetAll,
  cacheReplaceAll,
  cacheUpsertOne,
  cacheDeleteOne,
  enqueueMutation,
  type TableName,
  type Row,
  type Insert,
  type Update,
} from "./db";

export const isOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine);

/**
 * Fetch a list from a table with offline fallback.
 * - Online: query Supabase, then refresh local cache.
 * - Offline: read from IndexedDB cache.
 */
export async function offlineList(table: TableName, opts?: { orderBy?: string; ascending?: boolean }) {
  if (isOnline()) {
    try {
      let q = supabase.from(table).select("*");
      if (opts?.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending ?? false });
      const { data, error } = await q;
      if (!error && data) {
        await cacheReplaceAll(table, data);
        return data;
      }
    } catch {
      // fall through to cache
    }
  }
  const cached = await cacheGetAll(table);
  if (opts?.orderBy) {
    cached.sort((a, b) => {
      const av = a[opts.orderBy!]; const bv = b[opts.orderBy!];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return opts.ascending ? cmp : -cmp;
    });
  }
  return cached;
}

/**
 * Insert with optimistic cache + queue if offline / failure.
 * Returns the (optimistic) row.
 */
export async function offlineInsert<T extends TableName>(table: T, payload: Insert<T>) {
  const id = ((payload as Record<string, unknown>).id as string) ?? crypto.randomUUID();
  const optimistic = { 
    id, 
    created_at: new Date().toISOString(), 
    ...payload 
  } as unknown as Row<T>;
  
  await cacheUpsertOne(table, optimistic);

  if (isOnline()) {
    try {
      const { data, error } = await supabase.from(table).insert({ ...payload, id }).select().single();
      if (error) throw error;
      if (data) await cacheUpsertOne(table, data);
      return (data as Row<T>) ?? optimistic;
    } catch (e: unknown) {
      await enqueueMutation({ table, op: "insert", payload: { ...(payload as Record<string, unknown>), id } as Record<string, unknown> });
      return optimistic;
    }
  }

  await enqueueMutation({ table, op: "insert", payload: { ...(payload as Record<string, unknown>), id } as Record<string, unknown> });
  return optimistic;
}

export async function offlineUpdate<T extends TableName>(table: T, id: string, patch: Update<T>) {
  const all = await cacheGetAll(table);
  const existing = all.find((r) => (r as Record<string, unknown>).id === id) ?? ({ id } as unknown as Row<T>);
  const merged = { ...existing, ...patch } as Row<T>;
  await cacheUpsertOne(table, merged);

  if (isOnline()) {
    try {
      const { error } = await supabase.from(table).update(patch as any).eq("id", id);
      if (error) throw error;
      return merged;
    } catch {
      await enqueueMutation({ table, op: "update", payload: patch as Record<string, unknown>, match: { id } });
      return merged;
    }
  }
  await enqueueMutation({ table, op: "update", payload: patch as Record<string, unknown>, match: { id } });
  return merged;
}

export async function offlineDelete(table: TableName, id: string) {
  await cacheDeleteOne(table, id);
  if (isOnline()) {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return;
    } catch {
      await enqueueMutation({ table, op: "delete", match: { id } });
      return;
    }
  }
  await enqueueMutation({ table, op: "delete", match: { id } });
}

export async function offlineDeleteByMatch(table: TableName, match: Record<string, string | number | boolean | null>) {
  const existing = await cacheGetAll(table);
  const matches = existing.filter(r => Object.keys(match).every(k => (r as any)[k] === match[k]));
  for (const r of matches) await cacheDeleteOne(table, (r as any).id);

  if (isOnline()) {
    try {
      let q = supabase.from(table).delete();
      Object.keys(match).forEach((k) => {
        const val = match[k];
        if (typeof val === "string") q = q.eq(k, val);
        else if (typeof val === "number") q = q.eq(k, val);
        else if (typeof val === "boolean") q = q.eq(k, val);
      });
      const { error } = await q;
      if (error) throw error;
      return;
    } catch {
      await enqueueMutation({ table, op: "delete", match });
      return;
    }
  }
  await enqueueMutation({ table, op: "delete", match });
}
