import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { offlineList } from "@/lib/offline/api";
import { createCart, convertCartToQuote } from "@/lib/offline/cart";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  MessageCircle, 
  FileText,
  Package,
  ChevronRight,
  Share2
} from "lucide-react";
import { brl, waLink } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Store() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentTerm, setPaymentTerm] = useState("a_combinar");

  const { data: products = [] } = useQuery({
    queryKey: ["products_store"],
    queryFn: () => offlineList("products"),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers_store"],
    queryFn: () => offlineList("customers"),
  });

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku ?? "").includes(search)
  );

  const addToCart = (id: string) => {
    setCart(prev => {
      const next = { ...prev, [id]: (prev[id] || 0) + 1 };
      return next;
    });
    toast.success("Item adicionado", { duration: 800, position: "bottom-center" });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });
  };

  const total = Object.entries(cart).reduce((acc, [id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return acc + (Number(p?.price || 0) * qty);
  }, 0);

  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      toast.error("Vincule um cliente para processar o checkout");
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const cleanWA = (customer?.whatsapp || "").replace(/\D/g, "");

    if (cleanWA.length < 10) {
      toast.error("O WhatsApp do cliente parece inválido ou incompleto.");
      return;
    }

    const items = Object.entries(cart).map(([id, qty]) => {
      const p = products.find(prod => prod.id === id)!;
      return {
        product_id: id,
        quantity: qty,
        unit_price: Number(p.price),
      };
    });

    try {
      const cartPayload = {
        tenant_id: user!.id,
        customer_id: selectedCustomerId,
        status: "active",
        metadata: { payment_term: paymentTerm }
      };

      const newCart = await createCart(user!.id, selectedCustomerId, items);
      
      const quote = await convertCartToQuote(user!.id, newCart.id);
      toast.success("Orçamento gerado e vinculado à conversa!");

      if (customer?.whatsapp) {
        const msg = `Olá ${customer.name}! Seu carrinho de ${itemCount} itens foi convertido em orçamento.\n\n*Total: ${brl(total)}*\n*Condição: ${paymentTerm.replace("_", " ")}*\n\nPodemos seguir com o faturamento?`;
        window.open(waLink(customer.whatsapp, msg), "_blank");
      }

      setCart({});
      setSelectedCustomerId(null);
    } catch (err) {
      toast.error("Erro no motor de conversão conversacional");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      <PageHeader 
        title="Catálogo Operacional" 
        subtitle="Vitra de vendas e orçamentos"
        actions={
          <div className="flex items-center gap-2">
            <select 
              className="h-10 rounded-xl bg-background border px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={selectedCustomerId || ""}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">Vincular Cliente...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.whatsapp ? `(${c.whatsapp})` : ''}</option>)}
            </select>
          </div>
        }
      />

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Products Grid */}
        <Card className="flex-1 rounded-2xl shadow-soft p-4 flex flex-col gap-4 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar produtos ou SKU..." 
              className="pl-9 h-11 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(p => (
                <Card key={p.id} className="p-3 rounded-xl border-muted/50 hover:border-primary/30 transition-shadow group flex flex-col justify-between">
                  <div>
                    <div className="h-24 w-full rounded-lg bg-muted/30 flex items-center justify-center shrink-0 mb-3 group-hover:bg-muted/50 transition-colors">
                      <Package className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-1">{p.name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">{p.sku || 'N/A SKU'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-primary">{brl(Number(p.price))}</span>
                    <div className="flex items-center gap-1">
                      {cart[p.id] > 0 && (
                        <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-1 mr-2 px-2 animate-in fade-in slide-in-from-right-2">
                           <span className="text-xs font-bold text-primary">{cart[p.id]}x</span>
                        </div>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => addToCart(p.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Floating Cart (Sidebar Mode) */}
        <Card className="w-80 rounded-2xl shadow-soft p-4 flex flex-col gap-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 border-b pb-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-tight">Checkout Operacional</h3>
          </div>

          <ScrollArea className="flex-1 -mx-2 px-2">
            {Object.keys(cart).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-10" />
                <p className="text-sm font-medium">Lista vazia</p>
                <p className="text-[10px] mt-1 italic">Adicione produtos da vitrine</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(cart).map(([id, qty]) => {
                  const p = products.find(prod => prod.id === id)!;
                  return (
                    <div key={id} className="flex gap-2 items-center bg-muted/20 p-2 rounded-xl group hover:bg-muted/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate uppercase">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{brl(Number(p.price))}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-background border rounded-lg p-0.5">
                        <button onClick={() => removeFromCart(id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground"><Minus className="h-3 w-3" /></button>
                        <span className="text-xs font-bold w-4 text-center">{qty}</span>
                        <button onClick={() => addToCart(id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground"><Plus className="h-3 w-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="pt-4 border-t space-y-4">
            {/* Pay Later Context */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Condição de Pagamento</span>
              <select 
                className="w-full h-10 rounded-xl bg-muted/40 border-none px-3 text-xs focus:ring-1 focus:ring-primary/30"
                value={paymentTerm}
                onChange={(e) => setPaymentTerm(e.target.value)}
              >
                <option value="pix">Pix / À Vista (Imediato)</option>
                <option value="a_combinar">Faturado (A Combinar)</option>
                <option value="prazo_30">30 dias direto</option>
                <option value="prazo_60">60 dias direto</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-medium">
                <span>Subtotal ({itemCount} itens)</span>
                <span>{brl(total)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold uppercase">Total Global</span>
                <span className="text-xl font-black text-primary tracking-tighter">{brl(total)}</span>
              </div>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-black shadow-glow group"
              disabled={itemCount === 0}
              onClick={handleCheckout}
            >
              CONVERTER EM ORÇAMENTO
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <div className="flex justify-center gap-4">
              <button className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1" onClick={() => {
                toast.info("Link do catálogo rápido copiado!");
                navigator.clipboard.writeText(window.location.origin + "/loja");
              }}>
                <Share2 className="h-3 w-3" /> Compartilhar catálogo
              </button>
              <button className="text-[10px] text-destructive/70 hover:text-destructive transition-colors" onClick={() => setCart({})}>
                Limpar tudo
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
