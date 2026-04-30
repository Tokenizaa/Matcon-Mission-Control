import { supabase } from "@/integrations/supabase/client";
import type { TableName, Row, Update } from "./db";

export type Resolution = "local_won" | "remote_won" | "no_conflict" | "error";

interface ResolveResult<T extends TableName> {
  resolution: Resolution;
  applied: Row<T> | null;
  remote: Row<T> | null;
  error?: string;
}

const TS = "updated_at";

const isoOrNull = (v: string | number | null | undefined) => (v ? new Date(v).getTime() : null);

/**
 * Last-write-wins conflict resolution for a single update.
 * Compares queued local payload against current remote row using updated_at.
 * Logs the decision into `sync_audit` for traceability.
 */
export async function resolveLWWUpdate<T extends TableName>(
  table: T,
  id: string,
  localPatch: Update<T>,
  localUpdatedAt: number, // Date.now() when mutation was queued
): Promise<ResolveResult<T>> {
  // Fetch current remote
  const { data: remote, error: fetchErr } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    await audit(table, id, "error", null, null, localPatch, null, null, fetchErr.message);
    return { resolution: "error", applied: null, remote: null, error: fetchErr.message };
  }

  if (!remote) {
    // Remote gone — treat as no_conflict; caller may decide to skip.
    await audit(table, id, "no_conflict", localUpdatedAt, null, localPatch, null, null, "remote missing");
    return { resolution: "no_conflict", applied: null, remote: null };
  }

  const remoteTs = isoOrNull((remote as Record<string, unknown>)[TS] as string | null);

  // Determine the keys actually changing
  const changed = Object.keys(localPatch).filter((k) => k !== "id");
  const hasRemoteDivergence =
    remoteTs !== null && remoteTs > localUpdatedAt && changed.some((k) => (remote as Record<string, unknown>)[k] !== (localPatch as Record<string, unknown>)[k]);

  if (!hasRemoteDivergence) {
    // Apply the patch normally.
    const { data: applied, error } = await supabase
      .from(table)
      .update(localPatch as any)
      .eq("id", id)
      .select()
      .maybeSingle();
    
    if (error) {
      await audit(table, id, "error", localUpdatedAt, remoteTs, localPatch, remote as Row<T>, null, error.message);
      return { resolution: "error", applied: null, remote: remote as Row<T>, error: error.message };
    }
    await audit(table, id, "no_conflict", localUpdatedAt, remoteTs, localPatch, remote as Row<T>, applied as Row<T>);
    return { resolution: "no_conflict", applied: applied as Row<T>, remote: remote as Row<T> };
  }

  // Conflict: remote is newer than the local edit. LWW => remote wins by default.
  // Strategy: keep remote, but if the local change is strictly newer than remote, local wins.
  if (localUpdatedAt > (remoteTs ?? 0)) {
    const { data: applied, error } = await supabase
      .from(table)
      .update(localPatch as any)
      .eq("id", id)
      .select()
      .maybeSingle();
    
    if (error) {
      await audit(table, id, "error", localUpdatedAt, remoteTs, localPatch, remote as Row<T>, null, error.message);
      return { resolution: "error", applied: null, remote: remote as Row<T>, error: error.message };
    }
    await audit(table, id, "local_won", localUpdatedAt, remoteTs, localPatch, remote as Row<T>, applied as Row<T>);
    return { resolution: "local_won", applied: applied as Row<T>, remote: remote as Row<T> };
  }

  // Remote wins — discard local patch but record it for human review.
  await audit(table, id, "remote_won", localUpdatedAt, remoteTs, localPatch, remote, remote);
  return { resolution: "remote_won", applied: remote as Row<T>, remote: remote as Row<T> };
}

async function audit<T extends TableName>(
  table: T,
  recordId: string,
  resolution: Resolution,
  localTs: number | null,
  remoteTs: number | null,
  localPayload: Update<T>,
  remotePayload: Row<T> | null,
  appliedPayload: Row<T> | null,
  note?: string,
) {
  try {
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id;
    if (!userId) return;
    await supabase.from("sync_audit").insert({
      user_id: userId,
      table_name: table,
      record_id: recordId,
      strategy: "lww",
      resolution,
      local_updated_at: localTs ? new Date(localTs).toISOString() : null,
      remote_updated_at: remoteTs ? new Date(remoteTs).toISOString() : null,
      local_payload: localPayload ?? null,
      remote_payload: remotePayload ?? null,
      applied_payload: appliedPayload ?? null,
      note: note ?? null,
    });
  } catch {
    // never block sync on audit failures
  }
}
