import { useOnlineSync } from "@/hooks/useOnlineSync";
import { Wifi, WifiOff, RefreshCw, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SyncIndicator() {
  const { online, pending, syncing, sync } = useOnlineSync();

  if (online && pending === 0 && !syncing) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground px-2">
        <Wifi className="h-3.5 w-3.5 text-success" />
        <span>Online</span>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={sync}
      className={cn(
        "rounded-xl h-9 gap-1.5 text-xs",
        !online && "text-warning",
        online && pending > 0 && "text-primary"
      )}
      title={online ? `${pending} alteração(ões) pendentes` : "Você está offline"}
    >
      {!online ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline{pending > 0 ? ` · ${pending}` : ""}</span>
        </>
      ) : syncing ? (
        <>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Sincronizando…</span>
        </>
      ) : (
        <>
          <CloudUpload className="h-3.5 w-3.5" />
          <span>{pending} pendente(s)</span>
        </>
      )}
    </Button>
  );
}
