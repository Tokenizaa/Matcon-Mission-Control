import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Quotes from "./pages/Quotes";
import QuoteEdit from "./pages/QuoteEdit";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import WhatsAppLogs from "./pages/WhatsAppLogs";
import Conversations from "./pages/Conversations";
import Store from "./pages/Store";
import MissionControl from "./pages/pmo/MissionControl";
import Kanban from "./pages/pmo/Kanban";
import Thesis from "./pages/pmo/Thesis";
import Checklist from "./pages/pmo/Checklist";
import Roadmap from "./pages/pmo/Roadmap";
import NotFound from "./pages/NotFound";
import PublicStore from "./pages/PublicStore";
import StoreManagement from "./pages/StoreManagement";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Storefront Público - acesso sem login */}
            <Route path="/s/:slug" element={<PublicStore />} />
            
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<MissionControl />} />
              <Route path="/analise" element={<Dashboard />} />
              <Route path="/conversas" element={<Conversations />} />
              <Route path="/loja" element={<Store />} />
              <Route path="/minha-loja" element={<StoreManagement />} />
              <Route path="/pmo/kanban" element={<Kanban />} />
              <Route path="/pmo/tese" element={<Thesis />} />
              <Route path="/pmo/roadmap" element={<Roadmap />} />
              <Route path="/pmo/checklist" element={<Checklist />} />
              <Route path="/clientes" element={<Customers />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/orcamentos" element={<Quotes />} />
              <Route path="/orcamentos/:id" element={<QuoteEdit />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/cobrancas" element={<Payments />} />
              <Route path="/auditoria" element={<WhatsAppLogs />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
