import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fmtDate } from "@/lib/format";
import { retryWhatsApp } from "@/lib/whatsapp";
import { MessageCircle, RotateCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const kindLabel: Record<string, string> = { quote: "Orçamento", order: "Pedido", payment: "Cobrança" };

export default function WhatsAppLogs() {
  const qc = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["wa_messages"],
    queryFn: async () =>
      (await supabase.from("wa_messages").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  const { data: audit = [] } = useQuery({
    queryKey: ["sync_audit"],
    queryFn: async () =>
      (await supabase.from("sync_audit").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  const failed = (messages as any[]).filter((m) => m.status !== "sent");
  const conflicts = (audit as any[]).filter((a) => a.resolution === "local_won" || a.resolution === "remote_won");

  const onRetry = async (m: any) => {
    const res = await retryWhatsApp({ id: m.id as string, phone: m.phone as string, message: m.message as string });
    if (res.ok) toast.success("Reenviado");
    else toast.error(res.error || "Falha");
    qc.invalidateQueries({ queryKey: ["wa_messages"] });
  };

  return (
    <>
      <PageHeader title="Auditoria" subtitle="Envios de WhatsApp e reconciliação de sync" />

      <Tabs defaultValue="wa" className="w-full">
        <TabsList className="rounded-xl">
          <TabsTrigger value="wa" className="rounded-lg">
            <MessageCircle className="h-4 w-4 mr-1" />WhatsApp
            {failed.length > 0 && <Badge variant="destructive" className="ml-2 rounded-md">{failed.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sync" className="rounded-lg">
            <AlertTriangle className="h-4 w-4 mr-1" />Conflitos
            {conflicts.length > 0 && <Badge variant="secondary" className="ml-2 rounded-md">{conflicts.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wa" className="mt-4 space-y-2">
          {messages.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground rounded-2xl">Nenhum envio registrado</Card>
          )}
          {(messages as any[]).map((m) => (
            <Card key={m.id} className="p-4 rounded-2xl shadow-soft">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="rounded-md">{kindLabel[m.kind] ?? m.kind}</Badge>
                    <Badge
                      className="rounded-md"
                      variant={m.status === "sent" ? "default" : "destructive"}
                    >
                      {m.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{fmtDate(m.created_at)}</span>
                    {m.phone && <span className="text-xs text-muted-foreground">· {m.phone}</span>}
                  </div>
                  <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 font-sans">
                    {m.message}
                  </pre>
                  {m.error && <div className="mt-1 text-xs text-destructive">⚠ {m.error}</div>}
                </div>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onRetry(m)}>
                  <RotateCw className="h-4 w-4 mr-1" />Reenviar
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sync" className="mt-4 space-y-2">
          {audit.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground rounded-2xl">Nenhum evento de sync</Card>
          )}
          {(audit as any[]).map((a) => (
            <Card key={a.id} className="p-4 rounded-2xl shadow-soft">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="rounded-md">{a.table_name}</Badge>
                    <Badge
                      className="rounded-md"
                      variant={
                        a.resolution === "remote_won" ? "destructive"
                        : a.resolution === "local_won" ? "default"
                        : a.resolution === "error" ? "destructive" : "secondary"
                      }
                    >
                      {a.resolution}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{fmtDate(a.created_at)}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Registro: <span className="font-mono">{a.record_id.slice(0, 8)}…</span> · estratégia {a.strategy}
                  </div>
                  {a.note && <div className="text-xs text-muted-foreground">{a.note}</div>}
                </div>
              </div>
              {(a.local_payload || a.remote_payload) && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer">Ver payloads</summary>
                  <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    <pre className="text-xs bg-muted/40 p-2 rounded-lg overflow-auto">
                      <span className="font-semibold">local</span>
                      {"\n"}{JSON.stringify(a.local_payload, null, 2)}
                    </pre>
                    <pre className="text-xs bg-muted/40 p-2 rounded-lg overflow-auto">
                      <span className="font-semibold">remoto</span>
                      {"\n"}{JSON.stringify(a.remote_payload, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </>
  );
}
