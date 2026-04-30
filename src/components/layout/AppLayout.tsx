import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SyncIndicator from "@/components/SyncIndicator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AppLayout() {
  const { signOut, user } = useAuth();
  const nav = useNavigate();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-2 border-b bg-background/80 backdrop-blur px-3 md:px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium hidden sm:inline">Operação</span>
            </div>
            <div className="flex items-center gap-2">
              <SyncIndicator />
              <Button size="sm" className="gradient-primary text-primary-foreground shadow-glow rounded-xl" onClick={() => nav("/orcamentos/novo")}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline ml-1">Novo orçamento</span>
              </Button>
              <Button size="icon" variant="ghost" className="rounded-xl"><Bell className="h-4 w-4" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-full h-9 w-9 gradient-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
