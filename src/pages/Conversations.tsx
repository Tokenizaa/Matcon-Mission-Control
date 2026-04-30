import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Search, 
  Send, 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  MoreVertical,
  User,
  History,
  TrendingUp,
  Package
} from "lucide-react";
import { brl, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTelemetry } from "@/lib/offline/telemetry";
import { Row } from "@/lib/offline/db";
import Timeline from "@/components/Timeline";

interface CustomerWithContext extends Row<"customers"> {
  conversation_contexts: Row<"conversation_contexts">[];
  quotes: { count: number }[];
  orders: { count: number }[];
}

export default function Conversations() {
  useTelemetry("Conversas");
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithContext | null>(null);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers_conversations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select(`
          *,
          conversation_contexts(*),
          quotes(count),
          orders(count)
        `)
        .order("name");
      return data ?? [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["whatsapp_events", selectedCustomer?.id],
    enabled: !!selectedCustomer,
    queryFn: async () => {
      const { data } = await supabase
        .from("whatsapp_events")
        .select("*")
        .eq("customer_id", selectedCustomer.id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone ?? "").includes(search)
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden -mt-2">
      {/* Sidebar: Customer List */}
      <Card className={cn(
        "flex-col w-full md:w-80 rounded-2xl shadow-soft overflow-hidden transition-all",
        selectedCustomer ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar cliente..." 
              className="pl-9 h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left group",
                  selectedCustomer?.id === c.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground group-hover:bg-background">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate text-sm">{c.name}</div>
                  <div className="text-xs opacity-70 truncate">{c.phone || "Sem telefone"}</div>
                </div>
                {c.conversation_contexts?.[0]?.tags?.[0] && (
                  <Badge variant="secondary" className="text-[10px] h-4 rounded-md">
                    {c.conversation_contexts[0].tags[0]}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main: Chat Area */}
      <Card className={cn(
        "flex-1 rounded-2xl shadow-soft flex flex-col overflow-hidden",
        !selectedCustomer ? "hidden md:flex bg-muted/20 items-center justify-center" : "flex"
      )}>
        {!selectedCustomer ? (
          <div className="text-center px-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Selecione uma conversa</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha um cliente à esquerda para acessar o painel operacional.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedCustomer(null)}>
                  <MoreVertical className="h-4 w-4 rotate-90" />
                </Button>
                <div>
                  <div className="font-semibold text-sm">{selectedCustomer.name}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" /> Ativo agora
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xs text-muted-foreground">Inicie uma conversa enviando um orçamento ou cobrança.</p>
                  </div>
                ) : (
                  events.map(e => (
                    <div key={e.id} className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm",
                      e.type.includes('received') 
                        ? "bg-muted border self-start" 
                        : "bg-primary text-primary-foreground self-end ml-auto"
                    )}>
                      <div className="whitespace-pre-wrap">{e.payload?.text || JSON.stringify(e.payload)}</div>
                      <div className="text-[9px] mt-1 opacity-60 text-right">{fmtDate(e.created_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t space-y-3">
               {/* Quick Actions Bar */}
               <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <Button size="sm" variant="outline" className="rounded-full h-8 text-[11px] shrink-0">
                  <FileText className="h-3 w-3 mr-1" /> Orçamento
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-8 text-[11px] shrink-0">
                  <ShoppingCart className="h-3 w-3 mr-1" /> Pedido
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-8 text-[11px] shrink-0">
                  <CreditCard className="h-3 w-3 mr-1" /> Cobrança
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-8 text-[11px] shrink-0">
                  <Package className="h-3 w-3 mr-1" /> Estoque
                </Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Responda via WhatsApp..." className="rounded-xl h-11" />
                <Button size="icon" className="rounded-xl h-11 w-11 shrink-0 gradient-primary text-primary-foreground">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Operational Sidebar (Right) */}
      {selectedCustomer && (
        <Card className="hidden lg:flex flex-col w-72 rounded-2xl shadow-soft overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <History className="h-3.5 w-3.5" /> Contexto Operacional
            </h4>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Financial Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Limite de Crédito</span>
                  <span className="text-xs font-medium">{brl(Number(selectedCustomer.credit_limit || 0))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">Saldo Atual</span>
                  <span className="text-xs font-bold text-success">{brl(0)}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-primary w-[35%]" />
                </div>
              </div>

              {/* Real Timeline */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Linha do Tempo</span>
                </div>
                <Timeline customerId={selectedCustomer.id} className="px-1" />
              </div>

               {/* Tags */}
               <div className="space-y-3">
                <span className="text-xs font-semibold">Segmentação</span>
                <div className="flex flex-wrap gap-1">
                  {selectedCustomer.conversation_contexts?.[0]?.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="rounded-lg text-[10px]">{tag}</Badge>
                  ))}
                  <Badge variant="outline" className="rounded-lg text-[10px] cursor-pointer">+ Etiqueta</Badge>
                </div>
              </div>
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
