import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { brl, fmtDate } from "@/lib/format";

const statusColor: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-primary/15 text-primary",
  aprovado: "bg-success/15 text-success",
  cancelado: "bg-destructive/15 text-destructive",
};

export default function Quotes() {
  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => (await supabase.from("quotes").select("*, customers(name)").order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <>
      <PageHeader
        title="Orçamentos"
        subtitle="Crie, envie e converta em pedidos"
        actions={
          <Link to="/orcamentos/novo">
            <Button className="gradient-primary text-primary-foreground rounded-xl shadow-glow"><Plus className="h-4 w-4 mr-1" />Novo</Button>
          </Link>
        }
      />
      <div className="grid gap-3">
        {quotes.length === 0 && (
          <Card className="p-10 text-center rounded-2xl">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum orçamento ainda</p>
            <Link to="/orcamentos/novo"><Button className="mt-4 gradient-primary text-primary-foreground rounded-xl">Criar primeiro</Button></Link>
          </Card>
        )}
        {quotes.map((q: any) => (
          <Link to={`/orcamentos/${q.id}`} key={q.id}>
            <Card className="p-4 rounded-2xl shadow-soft hover:shadow-glow transition-shadow flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{q.customers?.name ?? "Sem cliente"}</div>
                <div className="text-xs text-muted-foreground">{fmtDate(q.created_at)}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{brl(q.total)}</div>
                <Badge className={`${statusColor[q.status] ?? ""} rounded-lg mt-1`} variant="secondary">{q.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
