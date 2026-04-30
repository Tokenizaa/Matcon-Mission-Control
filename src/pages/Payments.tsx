import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brl, fmtDate } from "@/lib/format";
import { Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { sendWhatsApp, waTemplates } from "@/lib/whatsapp";
import { offlineUpdate } from "@/lib/offline/api";
import { emitEvent } from "@/lib/offline/events";

import { Row } from "@/lib/offline/db";

interface PaymentWithOrder extends Row<"payments"> {
  orders: {
    id: string;
    customer_id?: string;
    customers: {
      name: string;
      whatsapp: string;
    } | null;
  } | null;
}

export default function Payments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: payments = [] } = useQuery<PaymentWithOrder[]>({
    queryKey: ["payments"],
    queryFn: async () => (await supabase.from("payments").select("*, orders(id, customer_id, customers(name, whatsapp))").order("created_at", { ascending: false })).data as any ?? [],
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      await offlineUpdate("payments", id, { status: "pago", paid_at: new Date().toISOString() });
      const payment = payments.find(p => p.id === id);
      if (user) {
        await emitEvent(user.id, "payments", id, "payment_paid", { 
          amount: payment?.amount, 
          customer_id: payment?.orders?.customer_id 
        });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); toast.success("Pagamento confirmado"); },
  });

  const totalReceber = payments.filter((p) => p.status === "pendente").reduce((s, p) => s + Number(p.amount), 0);
  const totalRecebido = payments.filter((p) => p.status === "pago").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      <PageHeader title="Cobranças" subtitle="Resumo financeiro simples" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4 rounded-2xl shadow-soft">
          <div className="text-xs text-muted-foreground">A receber</div>
          <div className="text-2xl font-bold mt-1 text-warning">{brl(totalReceber)}</div>
        </Card>
        <Card className="p-4 rounded-2xl shadow-soft">
          <div className="text-xs text-muted-foreground">Recebido</div>
          <div className="text-2xl font-bold mt-1 text-success">{brl(totalRecebido)}</div>
        </Card>
      </div>

      <div className="grid gap-3">
        {payments.length === 0 && <Card className="p-10 text-center text-muted-foreground rounded-2xl">Nenhuma cobrança</Card>}
        {payments.map((p) => {
          const customer = p.orders?.customers;
          const message = waTemplates.payment({ customerName: customer?.name, amount: Number(p.amount), type: p.type });
          return (
            <Card key={p.id} className="p-4 rounded-2xl shadow-soft flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="font-medium">{customer?.name ?? "Cliente"} · <span className="uppercase text-xs text-muted-foreground">{p.type}</span></div>
                <div className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <div className="font-semibold">{brl(p.amount)}</div>
                  <Badge className={p.status === "pago" ? "bg-success text-success-foreground" : ""} variant={p.status === "pago" ? "default" : "secondary"}>{p.status}</Badge>
                </div>
                {customer?.whatsapp && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-xl text-success"
                    onClick={async () => {
                      const res = await sendWhatsApp({
                        kind: "payment", refId: p.id, customerId: p.orders?.customer_id ?? "",
                        phone: customer.whatsapp, message,
                      });
                      if (!res.ok) toast.error(res.error || "Falha ao abrir WhatsApp");
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
                {p.status !== "pago" && (
                  <Button size="sm" className="gradient-accent text-accent-foreground rounded-xl" onClick={() => markPaid.mutate(p.id)}>
                    <Check className="h-4 w-4 mr-1" />Marcar pago
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
