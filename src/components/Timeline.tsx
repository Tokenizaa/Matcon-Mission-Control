import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { brl, fmtDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  MessageCircle, 
  User, 
  Package,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Row } from "@/lib/offline/db";

interface TimelineProps {
  customerId?: string;
  aggregateId?: string;
  className?: string;
}

export default function Timeline({ customerId, aggregateId, className }: TimelineProps) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["timeline", customerId, aggregateId],
    queryFn: async () => {
      let query = supabase
        .from("event_store")
        .select("*")
        .order("created_at", { ascending: false });

      if (customerId) {
        // Find events where customer_id is in payload or aggregate_id matches
        // For simplicity, let's assume we store customer_id in payload for all events
        query = query.or(`aggregate_id.eq.${customerId},payload->>customer_id.eq.${customerId}`);
      } else if (aggregateId) {
        query = query.eq("aggregate_id", aggregateId);
      }

      const { data } = await query.limit(50);
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getIcon = (type: string) => {
    if (type.startsWith("quote")) return <FileText className="h-4 w-4" />;
    if (type.startsWith("order")) return <ShoppingCart className="h-4 w-4" />;
    if (type.startsWith("payment")) return <CreditCard className="h-4 w-4" />;
    if (type.includes("whatsapp")) return <MessageCircle className="h-4 w-4" />;
    if (type.includes("customer")) return <User className="h-4 w-4" />;
    if (type.includes("inventory")) return <Package className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getLabel = (event: Row<"event_store">) => {
    const { event_type, payload } = event;
    switch (event_type) {
      case "quote_created": return "Orçamento Gerado";
      case "quote_approved": return "Orçamento Aprovado";
      case "order_created": return "Pedido Criado";
      case "order_status_changed": return `Status do Pedido: ${payload.status}`;
      case "payment_generated": return "Cobrança Gerada";
      case "payment_paid": return "Pagamento Recebido";
      case "whatsapp_message_received": return "Mensagem Recebida";
      case "whatsapp_message_sent": return "Mensagem Enviada";
      default: return event_type.replace(/_/g, " ");
    }
  };

  const getColor = (type: string) => {
    if (type.includes("paid") || type.includes("approved")) return "text-success border-success/20 bg-success/5";
    if (type.includes("failed") || type.includes("error")) return "text-destructive border-destructive/20 bg-destructive/5";
    if (type.includes("whatsapp")) return "text-primary border-primary/20 bg-primary/5";
    return "text-muted-foreground border-muted bg-muted/5";
  };

  return (
    <div className={cn("relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-muted before:via-muted before:to-transparent", className)}>
      {events.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma atividade registrada.
        </div>
      )}
      {events.map((event) => (
        <div key={event.id} className="relative flex items-start gap-4 group">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm transition-all group-hover:scale-110",
            getColor(event.event_type)
          )}>
            {getIcon(event.event_type)}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-sm font-semibold capitalize tracking-tight">
                {getLabel(event)}
              </h5>
              <time className="text-[10px] text-muted-foreground tabular-nums">
                {fmtDate(event.created_at)}
              </time>
            </div>
            {event.payload?.total && (
              <div className="text-sm font-bold mt-0.5">{brl(Number(event.payload.total))}</div>
            )}
            {event.payload?.text && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 italic">
                "{event.payload.text}"
              </p>
            )}
            {event.payload?.status && (
              <Badge variant="secondary" className="mt-2 rounded-md text-[10px] h-4">
                {event.payload.status}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
