import { supabase } from "@/integrations/supabase/client";
import { listMutations, deleteMutation, updateMutation, cacheUpsertOne, cacheDeleteOne } from "./db";
import { resolveLWWUpdate } from "./conflict";

let syncing = false;

export async function drainQueue(): Promise<{ ok: number; failed: number; conflicts: number }> {
  if (syncing) return { ok: 0, failed: 0, conflicts: 0 };
  syncing = true;
  let ok = 0;
  let failed = 0;
  let conflicts = 0;
  try {
    const pending = await listMutations();
    for (const m of pending) {
      try {
        if (m.op === "insert") {
          const { data, error } = await supabase.from(m.table).insert(m.payload).select().single();
          if (error) throw error;
          if (data) await cacheUpsertOne(m.table, data);
        } else if (m.op === "update") {
          const id = m.match?.id;
          if (!id) throw new Error("missing id");
          const res = await resolveLWWUpdate(m.table, id, m.payload, m.createdAt);
          if (res.resolution === "error") throw new Error(res.error || "conflict resolve error");
          if (res.applied) await cacheUpsertOne(m.table, res.applied);
          if (res.resolution === "local_won" || res.resolution === "remote_won") conflicts += 1;
        } else if (m.op === "delete") {
          const id = m.match?.id;
          if (!id) throw new Error("missing id");
          const { error } = await supabase.from(m.table).delete().eq("id", id);
          if (error) throw error;
          await cacheDeleteOne(m.table, id);
        }
        await deleteMutation(m.id);
        ok += 1;
      } catch (e: unknown) {
        failed += 1;
        const errMsg = e instanceof Error ? e.message : String(e);
        await updateMutation({ ...m, tries: m.tries + 1, error: errMsg });
        if (m.tries + 1 >= 5) {
          await deleteMutation(m.id);
        } else {
          break;
        }
      }
    }
  } finally {
    syncing = false;
  }
  return { ok, failed, conflicts };
}
