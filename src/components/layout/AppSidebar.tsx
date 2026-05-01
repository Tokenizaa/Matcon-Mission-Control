import { NavLink, useLocation } from "react-router-dom";
import { Sparkles, Map, KanbanSquare, History, FileText, ShoppingCart, CreditCard, Users, Package, LayoutDashboard, MessageCircle, Store } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const missionControlItems = [
  { title: "Mission Control", url: "/", icon: Sparkles },
  { title: "Roadmap", url: "/pmo/roadmap", icon: Map },
  { title: "Kanban", url: "/pmo/kanban", icon: KanbanSquare },
  { title: "Auditoria", url: "/auditoria", icon: History },
];

const platformItems = [
  { title: "Dashboard", url: "/analise", icon: LayoutDashboard },
  { title: "Conversas", url: "/conversas", icon: MessageCircle },
  { title: "Catálogo", url: "/loja", icon: Store },
  { title: "Orçamentos", url: "/orcamentos", icon: FileText },
  { title: "Pedidos", url: "/pedidos", icon: ShoppingCart },
  { title: "Cobranças", url: "/cobrancas", icon: CreditCard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Produtos", url: "/produtos", icon: Package },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (p: string) => p === "/" ? pathname === "/" : pathname.startsWith(p);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm">Matcon</span>
              <span className="text-xs text-muted-foreground">Command Center</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gerenciador</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {missionControlItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === "/"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
