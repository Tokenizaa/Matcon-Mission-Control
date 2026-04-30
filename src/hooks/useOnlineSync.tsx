import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { drainQueue } from "@/lib/offline/sync";
import { countMutations } from "@/lib/offline/db";
import { toast } from "sonner";

export function useOnlineSync() {
  const qc = useQueryClient();
  const [online, setOnline] = useState<boolean>(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pending, setPending] = useState<number>(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    setPending(await countMutations());
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    const res = await drainQueue();
    setSyncing(false);
    await refreshPending();
    if (res.ok > 0) {
      toast.success(`${res.ok} alteração(ões) sincronizadas${res.conflicts ? ` · ${res.conflicts} conflito(s) reconciliado(s)` : ""}`);
      qc.invalidateQueries();
    }
    if (res.failed > 0 && res.ok === 0) {
      toast.error("Falha ao sincronizar. Tentaremos novamente.");
    }
  }, [qc, refreshPending]);

  useEffect(() => {
    refreshPending();
    const onUp = () => { setOnline(true); toast.success("Conexão restabelecida — sincronizando…"); sync(); };
    const onDown = () => { setOnline(false); toast.warning("Você está offline. Alterações serão enfileiradas."); };
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    // initial sync attempt
    if (navigator.onLine) sync();
    const interval = setInterval(() => { if (navigator.onLine) sync(); }, 30_000);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { online, pending, syncing, sync, refreshPending };
}
