import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, MessageCircle, ShoppingCart, Save, History } from "lucide-react";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { offlineList, offlineInsert, offlineUpdate, offlineDeleteByMatch } from "@/lib/offline/api";
import { sendWhatsApp, waTemplates } from "@/lib/whatsapp";
import { emitEvent } from "@/lib/offline/events";
import Timeline from "@/components/Timeline";

type Item = { id?: string; product_id: string | null; product_name: string; quantity: number; price: number; total: number };

export default function QuoteEdit() {
  const { id } = useParams();
  const isNew = !id || id === "novo";
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const [customerId, setCustomerId] = useState<string>("");
  const [status, setStatus] = useState("rascunho");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [productPick, setProductPick] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => offlineList("customers") });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => offlineList("products", { orderBy: "name", ascending: true }) });

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data: q } = await supabase.from("quotes").select("*").eq("id", id!).single();
      if (q) { setCustomerId(q.customer_id ?? ""); setStatus(q.status); setNotes(q.notes ?? ""); setDiscount(Number(q.discount ?? 0)); }
      const { data: it } = await supabase.from("quote_items").select("*").eq("quote_id", id!);
      setItems((it ?? []).map(i => ({ id: i.id, product_id: i.product_id, product_name: i.product_name, quantity: Number(i.quantity), price: Number(i.price), total: Number(i.total) })));
    })();
  }, [id, isNew]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.total, 0), [items]);
  const total = Math.max(0, subtotal - (discount || 0));

  const addProduct = () => {
    const p = (products as any[]).find((x) => x.id === productPick);
    if (!p) return;
    setItems([...items, { product_id: p.id as string, product_name: p.name as string, quantity: 1, price: Number(p.price), total: Number(p.price) }]);
    setProductPick("");
  };

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems(items.map((it, i) => {
      if (i !== idx) return it;
      const merged = { ...it, ...patch };
      merged.total = merged.quantity * merged.price;
      return merged;
    }));
  };

  const save = async (newStatus?: string) => {
    if (!customerId) { toast.error("Selecione um cliente"); return; }
    setSaving(true);
    const payload = { user_id: user!.id, customer_id: customerId, status: newStatus ?? status, subtotal, discount, total, notes };
    let quoteId = id;
    
    if (isNew) {
      const q = await offlineInsert("quotes", payload);
      quoteId = q.id;
      await emitEvent(user!.id, "quotes", quoteId, "quote_created", { total });
    } else {
      await offlineUpdate("quotes", id!, payload);
      await offlineDeleteByMatch("quote_items", { quote_id: id! });
      await emitEvent(user!.id, "quotes", id!, "quote_created", { total, update: true });
    }

    if (items.length) {
      for (const i of items) {
        await offlineInsert("quote_items", {
          quote_id: quoteId, product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price, total: i.total,
        });
      }
    }
    
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["quotes"] });
    toast.success("Orçamento salvo");
    if (isNew) nav(`/orcamentos/${quoteId}`);
    if (newStatus) setStatus(newStatus);
    return quoteId;
  };

  const convertToOrder = async () => {
    const quoteId = await save("aprovado");
    if (!quoteId) return;

    // Reserve stock: decrement products.stock by item quantities (optimistic + offline-safe).
    for (const it of items) {
      if (!it.product_id) continue;
      const p = (products as any[]).find((x) => x.id === it.product_id);
      if (!p) continue;
      const newStock = Math.max(0, Number(p.stock ?? 0) - Number(it.quantity ?? 0));
      await offlineUpdate("products", it.product_id, { stock: newStock });
    }

    const order = await offlineInsert("orders", {
      user_id: user!.id, customer_id: customerId, quote_id: quoteId, status: "aguardando", total,
    });
    await emitEvent(user!.id, "orders", order.id, "order_created", { total, quote_id: quoteId });
    
    for (const it of items) {
      await offlineInsert("order_items", {
        order_id: order.id, product_id: it.product_id, product_name: it.product_name,
        quantity: it.quantity, price: it.price, total: it.total,
      });
    }
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success("Pedido gerado · estoque reservado");
    nav(`/pedidos`);
  };

  const customer = customers.find((c) => c.id === customerId);
  const waMessage = waTemplates.quote({ customerName: customer?.name, items, subtotal, discount, total, notes });

  const sendQuoteWa = async () => {
    const res = await sendWhatsApp({
      kind: "quote", refId: id && id !== "novo" ? id : undefined, customerId: customerId || undefined,
      phone: customer?.whatsapp, message: waMessage,
    });
    if (!res.ok) toast.error(res.error || "Não foi possível abrir o WhatsApp");
  };

  return (
    <>
      <PageHeader title={isNew ? "Novo orçamento" : "Orçamento"} subtitle="Cliente → Orçamento → Pedido → Cobrança" />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl shadow-soft lg:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Cliente</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Itens</Label>
            <div className="flex gap-2">
              <Select value={productPick} onValueChange={setProductPick}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Adicionar produto…" /></SelectTrigger>
                <SelectContent>
                  {(products as any[]).map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {brl(p.price)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={addProduct} disabled={!productPick} className="gradient-primary text-primary-foreground rounded-xl shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum item</p>}
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{it.product_name}</div>
                    <div className="text-xs text-muted-foreground">{brl(it.total)}</div>
                  </div>
                  <Input className="w-16 rounded-lg" type="number" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 0 })} />
                  <Input className="w-24 rounded-lg" type="number" step="0.01" value={it.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) || 0 })} />
                  <Button size="icon" variant="ghost" className="rounded-lg text-destructive" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl shadow-soft h-fit lg:sticky lg:top-20 space-y-4">
          <div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{brl(subtotal)}</span></div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-muted-foreground">Desconto</span>
              <Input className="w-28 h-8 rounded-lg" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">{brl(total)}</span>
            </div>
            <Badge className="mt-3" variant="secondary">{status}</Badge>
          </div>

          <div className="grid gap-2">
            <Button onClick={() => save()} disabled={saving} className="gradient-primary text-primary-foreground rounded-xl">
              <Save className="h-4 w-4 mr-1" />Salvar
            </Button>
            {customer?.whatsapp && (
              <Button onClick={sendQuoteWa} variant="outline" className="rounded-xl w-full text-success border-success/30">
                <MessageCircle className="h-4 w-4 mr-1" />Enviar no WhatsApp
              </Button>
            )}
            <Button onClick={convertToOrder} disabled={saving || items.length === 0} variant="outline" className="rounded-xl">
              <ShoppingCart className="h-4 w-4 mr-1" />Converter em pedido
            </Button>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">Histórico de Eventos</span>
            </div>
            <Timeline aggregateId={id} className="px-1" />
          </div>
        </Card>
      </div>
    </>
  );
}
