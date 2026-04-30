import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { brl, fmtDate } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import { TrendingUp, ShoppingCart, CreditCard, Users, Package, MessageCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Row } from "@/lib/offline/db";
import { useTelemetry } from "@/lib/offline/telemetry";

interface StatProp {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent: string;
}

function StatCard({ icon: Icon, label, value, accent }: StatProp) {
  return (
    <Card className="p-4 rounded-2xl shadow-soft hover:shadow-glow transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <div className="text-2xl font-bold mt-3">{value}</div>
    </Card>
  );
}

export default function Dashboard() {
  useTelemetry("Dashboard");
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [orders, payments, customers, products, recentOrders, recentPayments] = await Promise.all([
        supabase.from("orders").select("total, status, created_at"),
        supabase.from("payments").select("amount, status"),
        supabase.from("customers").select("id"),
        supabase.from("products").select("id, stock, name"),
        supabase.from("orders").select("id, total, status, created_at, customers(name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("payments").select("id, amount, status, type, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      const salesToday = (orders.data ?? []).filter(o => new Date(o.created_at) >= today).reduce((s, o) => s + Number(o.total), 0);
      const pendingOrders = (orders.data ?? []).filter(o => ["aguardando", "separando"].includes(o.status)).length;
      const pendingPayments = (payments.data ?? []).filter(p => p.status === "pendente").reduce((s, p) => s + Number(p.amount), 0);
      const lowStock = (products.data ?? []).filter(p => Number(p.stock) <= 5);
      
      const typedRecentOrders = (recentOrders.data ?? []).map(o => ({
        ...o,
        customers: o.customers as { name: string } | null
      }));

      return {
        salesToday, pendingOrders, pendingPayments,
        customersCount: customers.data?.length ?? 0,
        lowStock, recentOrders: typedRecentOrders, recentPayments: recentPayments.data ?? [],
      };
    },
  });

  return (
    <>
      <PageHeader title="Olá 👋" subtitle="Resumo da operação de hoje" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={TrendingUp} label="Vendas hoje" value={brl(data?.salesToday ?? 0)} accent="gradient-primary" />
        <StatCard icon={ShoppingCart} label="Pedidos pendentes" value={data?.pendingOrders ?? 0} accent="bg-warning" />
        <StatCard icon={CreditCard} label="A receber" value={brl(data?.pendingPayments ?? 0)} accent="gradient-accent" />
        <StatCard icon={Users} label="Clientes" value={data?.customersCount ?? 0} accent="bg-foreground" />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Card className="p-5 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
              <MessageCircle className="h-4 w-4" /> Conversas Ativas
            </h3>
            <Link to="/conversas" className="text-xs text-primary hover:underline">Chat</Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border">
              <div className="text-xs font-medium">WhatsApp Event Layer</div>
              <Badge variant="outline" className="text-[10px] rounded-lg">ATIVO</Badge>
            </div>
            <div className="text-xs text-muted-foreground px-1 pb-2">
              Acompanhe sinais operacionais direto do WhatsApp.
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 p-5 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Últimos pedidos</h3>
            <Link to="/pedidos" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          {data?.recentOrders.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhum pedido ainda</p>}
          <div className="space-y-2">
            {data?.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{o.customers?.name ?? "Cliente"}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{brl(Number(o.total))}</div>
                  <Badge variant="secondary" className="text-[10px] mt-1">{o.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Últimas cobranças</h3>
            <Link to="/cobrancas" className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>
          {data?.recentPayments.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma cobrança</p>}
          <div className="space-y-2">
            {data?.recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div>
                  <div className="text-sm font-medium uppercase">{p.type}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{brl(Number(p.amount))}</div>
                  <Badge className={p.status === "pago" ? "bg-success text-success-foreground" : ""} variant={p.status === "pago" ? "default" : "secondary"}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {data && data.lowStock.length > 0 && (
        <Card className="p-5 rounded-2xl shadow-soft mt-4 border-warning/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-warning" />
              <h3 className="font-semibold">Estoque baixo</h3>
            </div>
            <Link to="/produtos"><Button size="sm" variant="ghost" className="rounded-lg">Gerenciar</Button></Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.lowStock.map((p) => (
              <Badge key={p.id} variant="outline" className="rounded-lg">{p.name} · {Number(p.stock)}</Badge>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
