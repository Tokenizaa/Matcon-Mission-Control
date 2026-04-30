import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  KanbanSquare,
  ListTodo,
  CalendarDays,
  Rocket,
  ShieldAlert,
  Gauge,
  Network,
  Users,
  CheckSquare,
  Layers,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { executive } from "@/data/project";

const nav = [
  { to: "/", label: "Mission Control", icon: LayoutDashboard, end: true },
  { to: "/kanban", label: "Kanban", icon: KanbanSquare },
  { to: "/checklist", label: "Checklist de Entrega", icon: CheckSquare },
  { to: "/tese", label: "Tese Estratégica", icon: BookOpen },
];

function PmoSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <span className="font-mono text-sm font-bold">M</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">{executive.productName}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">PMO · v0.1</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 pb-4">
        <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Gestão</p>
        {nav.map((n) => {
          const Icon = n.icon;
          const active = n.end ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 opacity-80" />
              <span>{n.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="text-foreground">Wedge:</span> WhatsApp → Orçamento → Pedido → Cobrança.
        </p>
      </div>
    </aside>
  );
}

function MobileNav() {
  const { pathname } = useLocation();
  return (
    <div className="md:hidden">
      <div className="scrollbar-thin overflow-x-auto border-b border-border bg-card/50 backdrop-blur">
        <div className="flex gap-1 px-3 py-2">
          {nav.map((n) => {
            const active = n.end ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={cn(
                  "shrink-0 rounded-md border border-transparent px-2.5 py-1 text-xs text-muted-foreground",
                  active && "border-border bg-secondary text-foreground"
                )}
              >
                {n.label}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PmoLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <PmoSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1400px] px-5 py-6 md:px-8 md:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}