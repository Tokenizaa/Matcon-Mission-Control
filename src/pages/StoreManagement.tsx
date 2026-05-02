import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, 
  Link as LinkIcon, 
  Copy, 
  ExternalLink, 
  QrCode, 
  TrendingUp, 
  Eye, 
  ShoppingCart, 
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Palette,
  ImageIcon,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Store {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  whatsapp_number: string | null;
  description: string | null;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
}

interface StoreStats {
  views_30d: number;
  carts_30d: number;
  quotes_30d: number;
  active_carts: number;
  last_activity: string | null;
}

// QRCode simples usando API gratuita
const QRCodeSVG = ({ url, size = 200 }: { url: string; size?: number }) => {
  const encodedUrl = encodeURIComponent(url);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <img 
        src={qrUrl} 
        alt="QR Code da Loja"
        className="rounded-lg"
        style={{ width: size, height: size }}
      />
      <p className="text-xs text-gray-500 text-center">Escaneie para acessar a loja</p>
    </div>
  );
};

export default function StoreManagement() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    whatsapp_number: "",
    primary_color: "#3b82f6",
    secondary_color: "#1e40af",
    logo_url: "",
    banner_url: "",
  });

  // Buscar loja do tenant
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("tenant_id", user.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
      return data as Store | null;
    },
    enabled: !!user?.id,
  });

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ["store-stats", store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      
      const { data, error } = await supabase
        .from("store_stats")
        .select("*")
        .eq("store_id", store.id)
        .single();
      
      if (error) throw error;
      return data as StoreStats | null;
    },
    enabled: !!store?.id,
  });

  // Buscar analytics recentes
  const { data: recentActivity } = useQuery({
    queryKey: ["store-activity", store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      
      const { data, error } = await supabase
        .from("store_analytics")
        .select("event_type, created_at, metadata")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  // Preencher formulário quando carregar loja
  useEffect(() => {
    if (store) {
      setForm({
        name: store.name,
        slug: store.slug,
        description: store.description || "",
        whatsapp_number: store.whatsapp_number || "",
        primary_color: store.primary_color,
        secondary_color: store.secondary_color,
        logo_url: store.logo_url || "",
        banner_url: store.banner_url || "",
      });
    }
  }, [store]);

  // Criar loja
  const createStore = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const slug = form.slug || `loja-${user.id.slice(0, 8)}`;
      
      const { data, error } = await supabase
        .from("stores")
        .insert({
          tenant_id: user.id,
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          name: form.name || "Minha Loja",
          description: form.description,
          whatsapp_number: form.whatsapp_number,
          primary_color: form.primary_color,
          secondary_color: form.secondary_color,
          logo_url: form.logo_url || null,
          banner_url: form.banner_url || null,
          is_active: true,
          is_public: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Loja criada com sucesso!");
      qc.invalidateQueries({ queryKey: ["my-store"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar loja");
    },
  });

  // Atualizar loja
  const updateStore = useMutation({
    mutationFn: async () => {
      if (!store?.id) throw new Error("Loja não encontrada");
      
      const { data, error } = await supabase
        .from("stores")
        .update({
          name: form.name,
          description: form.description,
          whatsapp_number: form.whatsapp_number,
          primary_color: form.primary_color,
          secondary_color: form.secondary_color,
          logo_url: form.logo_url || null,
          banner_url: form.banner_url || null,
        })
        .eq("id", store.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Loja atualizada!");
      qc.invalidateQueries({ queryKey: ["my-store"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar loja");
    },
  });

  // Toggle ativar/desativar
  const toggleStore = async (field: "is_active" | "is_public", value: boolean) => {
    if (!store?.id) return;
    
    const { error } = await supabase
      .from("stores")
      .update({ [field]: value })
      .eq("id", store.id);
    
    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    
    toast.success(field === "is_active" 
      ? (value ? "Loja ativada" : "Loja desativada")
      : (value ? "Loja pública" : "Loja privada")
    );
    qc.invalidateQueries({ queryKey: ["my-store"] });
  };

  // URL pública da loja
  const publicUrl = store?.slug 
    ? `${window.location.origin}/s/${store.slug}`
    : null;

  // Copiar link
  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link copiado para a área de transferência!");
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  // Abrir loja
  const openStore = () => {
    if (publicUrl) {
      window.open(publicUrl, "_blank");
    }
  };

  const handleSave = () => {
    if (store) {
      updateStore.mutate();
    } else {
      createStore.mutate();
    }
  };

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Loja Virtual" 
        subtitle="Configure sua loja pública e acompanhe resultados"
      />

      {/* Status da Loja */}
      <Card className="rounded-2xl shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-white"
                style={{ backgroundColor: store?.primary_color || form.primary_color }}
              >
                <Store className="h-7 w-7" />
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {store?.name || "Sua Loja Virtual"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {store?.is_active ? (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ativa
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Inativa
                    </Badge>
                  )}
                  {store?.is_public ? (
                    <Badge variant="outline" className="border-success text-success">
                      Pública
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Privada
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {store && (
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-xl" onClick={openStore}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Loja
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setShowQRDialog(true)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* URL Pública */}
      {store && publicUrl && (
        <Card className="rounded-2xl shadow-soft border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">URL pública da sua loja</p>
                <div className="flex items-center gap-2 text-sm font-mono bg-white px-3 py-2 rounded-lg border">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  {publicUrl}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={copyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button className="rounded-xl gradient-primary" onClick={openStore}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={store ? "config" : "setup"} className="w-full">
        <TabsList className="rounded-xl">
          <TabsTrigger value="setup" className="rounded-lg">
            {store ? "Geral" : "Criar Loja"}
          </TabsTrigger>
          {store && (
            <>
              <TabsTrigger value="stats" className="rounded-lg">
                Estatísticas
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-lg">
                Atividade
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Tab: Configuração */}
        <TabsContent value="setup" className="space-y-4 mt-4">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Configurações da Loja
              </CardTitle>
              <CardDescription>
                Personalize como sua loja aparece para os clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome e Slug */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Loja</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Loja São Paulo Materiais"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="loja-sp"
                    disabled={!!store}
                  />
                  {store && (
                    <p className="text-xs text-muted-foreground">Slug não pode ser alterado após criação</p>
                  )}
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descreva sua loja para os clientes..."
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label>WhatsApp da Loja</Label>
                <Input
                  value={form.whatsapp_number}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setForm({ ...form, whatsapp_number: v });
                  }}
                  placeholder="11999999999"
                />
                <p className="text-xs text-muted-foreground">
                  Número que receberá os pedidos de orçamento (DDD + número)
                </p>
              </div>

              {/* Cores */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cor Primária
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <Input 
                      value={form.primary_color} 
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cor Secundária
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.secondary_color}
                      onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <Input 
                      value={form.secondary_color} 
                      onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* URLs de imagem (simplificado) */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    URL do Logo
                  </Label>
                  <Input
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    URL do Banner
                  </Label>
                  <Input
                    value={form.banner_url}
                    onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Status toggles (apenas se loja existe) */}
              {store && (
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                  <div className="flex items-center justify-between flex-1">
                    <div>
                      <p className="font-medium">Loja Ativa</p>
                      <p className="text-sm text-muted-foreground">Clientes podem acessar</p>
                    </div>
                    <Switch
                      checked={store.is_active}
                      onCheckedChange={(v) => toggleStore("is_active", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <div>
                      <p className="font-medium">Visibilidade Pública</p>
                      <p className="text-sm text-muted-foreground">Aparece em buscas</p>
                    </div>
                    <Switch
                      checked={store.is_public}
                      onCheckedChange={(v) => toggleStore("is_public", v)}
                    />
                  </div>
                </div>
              )}

              {/* Preview */}
              {form.primary_color && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Preview das cores:</p>
                  <div 
                    className="h-20 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: form.primary_color }}
                  >
                    Cor Primária
                  </div>
                </div>
              )}

              {/* Botão salvar */}
              <Button 
                className="w-full h-12 rounded-xl gradient-primary text-lg font-bold"
                onClick={handleSave}
                disabled={createStore.isPending || updateStore.isPending}
              >
                {store ? "Salvar Alterações" : "Criar Minha Loja"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Estatísticas */}
        {store && (
          <TabsContent value="stats" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Eye}
                label="Visualizações (30d)"
                value={stats?.views_30d || 0}
                color="bg-blue-500"
              />
              <StatCard
                icon={ShoppingCart}
                label="Carrinhos (30d)"
                value={stats?.carts_30d || 0}
                color="bg-green-500"
              />
              <StatCard
                icon={MessageCircle}
                label="Orçamentos (30d)"
                value={stats?.quotes_30d || 0}
                color="bg-purple-500"
              />
              <StatCard
                icon={TrendingUp}
                label="Carrinhos Ativos"
                value={stats?.active_carts || 0}
                color="bg-orange-500"
              />
            </div>

            {stats?.last_activity && (
              <Card className="rounded-2xl shadow-soft">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Última atividade: {new Date(stats.last_activity).toLocaleString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Tab: Atividade Recente */}
        {store && (
          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card className="rounded-2xl shadow-soft">
              <CardHeader>
                <CardTitle className="text-base">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma atividade registrada ainda</p>
                    <p className="text-sm">Compartilhe sua loja para começar!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity?.map((activity: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <EventIcon type={activity.event_type} />
                          <div>
                            <p className="font-medium text-sm">{eventLabel(activity.event_type)}</p>
                            {activity.metadata?.product_name && (
                              <p className="text-xs text-muted-foreground">
                                {activity.metadata.product_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleTimeString("pt-BR", { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog QR Code */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code da Loja</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {publicUrl && <QRCodeSVG url={publicUrl} size={250} />}
            <p className="text-sm text-center text-muted-foreground mt-4">
              Escaneie com a câmera do celular para acessar a loja
            </p>
            <Button 
              variant="outline" 
              className="mt-4 rounded-xl"
              onClick={() => {
                const canvas = document.querySelector("img");
                if (canvas) {
                  const link = document.createElement("a");
                  link.download = `qrcode-loja-${store?.slug}.png`;
                  link.href = canvas.getAttribute("src") || "";
                  link.click();
                }
              }}
            >
              Baixar QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de Card de Estatística
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="p-4">
        <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center text-white mb-3`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// Ícone baseado no tipo de evento
function EventIcon({ type }: { type: string }) {
  const icons: Record<string, any> = {
    store_viewed: Eye,
    product_viewed: Store,
    cart_item_added: ShoppingCart,
    cart_created: ShoppingCart,
    quote_requested: MessageCircle,
  };
  
  const Icon = icons[type] || AlertCircle;
  const colors: Record<string, string> = {
    store_viewed: "bg-blue-100 text-blue-600",
    product_viewed: "bg-green-100 text-green-600",
    cart_item_added: "bg-purple-100 text-purple-600",
    cart_created: "bg-purple-100 text-purple-600",
    quote_requested: "bg-orange-100 text-orange-600",
  };
  
  return (
    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colors[type] || "bg-gray-100 text-gray-600"}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

// Label do evento
function eventLabel(type: string): string {
  const labels: Record<string, string> = {
    store_viewed: "Loja visualizada",
    product_viewed: "Produto visualizado",
    cart_item_added: "Item adicionado ao carrinho",
    cart_created: "Carrinho criado",
    quote_requested: "Orçamento solicitado",
  };
  return labels[type] || type;
}
