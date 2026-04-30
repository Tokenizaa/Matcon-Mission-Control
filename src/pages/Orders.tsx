import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { brl, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { CreditCard, MessageCircle } from "lucide-react";
import { sendWhatsApp, waTemplates } from "@/lib/whatsapp";
import { offlineInsert, offlineUpdate } from "@/lib/offline/api";
import type { Row } from "@/lib/offline/db";

const statuses = ["aguardando", "pago", "separando", "entregue", "cancelado"];

export default function Orders() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [billOrder, setBillOrder] = useState<Row<"orders"> | null>(null);
  const [type, setType] = useState("pix");
  const [amount, setAmount] = useState("0");

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await supabase.from("orders").select("*, customers(name, whatsapp)").order("created_at", { ascending: false })).data ?? [],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await offlineUpdate("orders", id, { status });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); toast.success("Status atualizado"); },
  });

  const createPayment = async () => {
    if (!billOrder) return;
    await offlineInsert("payments", {
      user_id: user!.id, order_id: billOrder.id, type, amount: Number(amount), status: "pendente",
    });
    toast.success("Cobrança criada");
    setBillOrder(null);
    qc.invalidateQueries({ queryKey: ["payments"] });
  };

  return (
    <>
      <PageHeader title="Pedidos" subtitle={`${orders.length} pedidos`} />
      <div className="grid gap-3">
        {orders.length === 0 && <Card className="p-10 text-center text-muted-foreground rounded-2xl">Nenhum pedido</Card>}
        {orders.map((o) => {
          const customer = o.customers as { name?: string; whatsapp?: string } | null;
          return (
            <Card key={o.id} className="p-4 rounded-2xl shadow-soft">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-medium">{customer?.name ?? "Cliente"}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{brl(Number(o.total))}</div>
                  <Badge variant="secondary" className="rounded-lg mt-1">{o.status ?? ""}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Select value={o.status ?? ""} onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}>
                  <SelectTrigger className="rounded-xl h-9 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setBillOrder(o); setAmount(String(o.total)); }}>
                  <CreditCard className="h-4 w-4 mr-1" />Gerar cobrança
                </Button>
                {customer?.whatsapp && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-success border-success/30"
                    onClick={async () => {
                      const res = await sendWhatsApp({
                        kind: "order", refId: o.id, customerId: o.customer_id!,
                        phone: customer.whatsapp!,
                        message: waTemplates.order({ customerName: customer.name!, total: Number(o.total), status: o.status! }),
                      });
                      if (!res.ok) toast.error(res.error || "Falha ao abrir WhatsApp");
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />WhatsApp
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!billOrder} onOpenChange={(o) => !o && setBillOrder(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Gerar cobrança</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={createPayment} className="gradient-primary text-primary-foreground rounded-xl w-full">Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
