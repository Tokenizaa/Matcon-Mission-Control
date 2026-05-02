import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  MessageCircle, 
  Share2, 
  Store,
  ArrowRight,
  X,
  Send
} from "lucide-react";
import { brl, waLink } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  whatsapp_number: string | null;
  description: string | null;
  primary_color: string;
  secondary_color: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  description: string | null;
  images: string[] | null;
  category_id: string | null;
  stock: number;
  unit: string;
}

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

// Session ID único para este visitante
const getSessionId = () => {
  let sessionId = localStorage.getItem("matcon_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("matcon_session_id", sessionId);
  }
  return sessionId;
};

export default function PublicStore() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("categoria");
  
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsApp, setCustomerWhatsApp] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFilter);
  
  const sessionId = useMemo(() => getSessionId(), []);

  // Buscar dados da loja
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      
      if (error) throw error;
      return data as Store;
    },
    enabled: !!slug,
  });

  // Buscar produtos do tenant (via RPC ou view pública)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["public-products", store?.tenant_id],
    queryFn: async () => {
      if (!store?.tenant_id) return [];
      
      // Buscar produtos do tenant com RLS permitindo leitura pública
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, price, description, images, category_id, stock, unit")
        .eq("user_id", store.tenant_id)
        .gt("stock", 0)
        .order("name");
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!store?.tenant_id,
  });

  // Buscar categorias
  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories", store?.tenant_id],
    queryFn: async () => {
      if (!store?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", store.tenant_id)
        .eq("active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: !!store?.tenant_id,
  });

  // Registrar view da loja (analytics)
  useEffect(() => {
    if (store?.id) {
      supabase.from("store_analytics").insert({
        store_id: store.id,
        event_type: "store_viewed",
        session_id: sessionId,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
      }).then();
    }
  }, [store?.id, sessionId]);

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku?.toLowerCase() || "").includes(search.toLowerCase());
      
      const matchesCategory = selectedCategory 
        ? p.category_id === selectedCategory 
        : true;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  // Carrinho handlers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }];
    });
    
    toast.success(`${product.name} adicionado`, { duration: 1500 });
    
    // Registrar evento
    if (store?.id) {
      supabase.from("store_analytics").insert({
        store_id: store.id,
        event_type: "cart_item_added",
        session_id: sessionId,
        metadata: { product_id: product.id, product_name: product.name }
      }).then();
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Compartilhar loja
  const shareStore = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  // Solicitar orçamento (Quote-first checkout)
  const requestQuote = async () => {
    if (!customerName.trim()) {
      toast.error("Digite seu nome");
      return;
    }
    if (!customerWhatsApp.trim() || customerWhatsApp.replace(/\D/g, "").length < 11) {
      toast.error("Digite um WhatsApp válido (DDD + número)");
      return;
    }

    // Registrar evento
    if (store?.id) {
      await supabase.from("store_analytics").insert({
        store_id: store.id,
        event_type: "quote_requested",
        session_id: sessionId,
        metadata: { 
          customer_name: customerName, 
          items_count: cart.length,
          total: cartTotal 
        }
      });
    }

    // Montar mensagem para WhatsApp
    const itemsText = cart.map(item => 
      `• ${item.quantity}x ${item.name} — ${brl(item.price * item.quantity)}`
    ).join("\n");

    const message = `*Orçamento solicitado* 🛒\n\n` +
      `Olá! Meu nome é ${customerName}.\n` +
      `Gostaria de solicitar um orçamento:\n\n` +
      `${itemsText}\n\n` +
      `*Total: ${brl(cartTotal)}*\n\n` +
      `Aguardo retorno. Obrigado!`;

    const cleanPhone = store?.whatsapp_number?.replace(/\D/g, "");
    
    if (cleanPhone && cleanPhone.length >= 10) {
      window.open(waLink(cleanPhone, message), "_blank");
      toast.success("Redirecionando para WhatsApp...");
      
      // Limpar carrinho após envio
      setCart([]);
      setIsQuoteDialogOpen(false);
      setIsCartOpen(false);
    } else {
      toast.error("Loja não possui WhatsApp configurado");
    }
  };

  // Loading state
  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-center">
          <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-400">Carregando loja...</p>
        </div>
      </div>
    );
  }

  // Loja não encontrada
  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Store className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Loja não encontrada</h1>
          <p className="text-gray-500">Esta loja não existe ou está indisponível.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="sticky top-0 z-40 bg-white border-b shadow-sm"
        style={{ 
          borderColor: store.primary_color + "20",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo/Nome */}
            <div className="flex items-center gap-3">
              {store.logo_url ? (
                <img 
                  src={store.logo_url} 
                  alt={store.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: store.primary_color }}
                >
                  {store.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg leading-tight">{store.name}</h1>
                {store.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{store.description}</p>
                )}
              </div>
            </div>

            {/* Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 rounded-full border-gray-200"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={shareStore}
              >
                <Share2 className="h-5 w-5" />
              </Button>
              
              <Button
                variant="outline"
                className="relative rounded-full px-3 h-10"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Carrinho</span>
                {cartItemCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    style={{ backgroundColor: store.primary_color }}
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      {store.banner_url && (
        <div className="w-full h-40 sm:h-56 overflow-hidden">
          <img 
            src={store.banner_url} 
            alt="Banner"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Categorias */}
      {categories.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                className="rounded-full whitespace-nowrap"
                style={selectedCategory === null ? { backgroundColor: store.primary_color } : {}}
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Button>
              {categories.map((cat: any) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-full whitespace-nowrap"
                  style={selectedCategory === cat.id ? { backgroundColor: store.primary_color } : {}}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Produtos */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <PackageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              {search ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                primaryColor={store.primary_color}
                onAdd={() => addToCart(product)}
                cartQuantity={cart.find(item => item.product_id === product.id)?.quantity || 0}
              />
            ))}
          </div>
        )}
      </main>

      {/* Drawer do Carrinho */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsCartOpen(false)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header do carrinho */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Seu Carrinho
                  {cartItemCount > 0 && (
                    <Badge variant="secondary">{cartItemCount} itens</Badge>
                  )}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCartOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Itens do carrinho */}
              <div className="flex-1 overflow-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Seu carrinho está vazio</p>
                    <p className="text-sm mt-2">Adicione produtos da loja</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <Card key={item.product_id} className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">{brl(item.price)} cada</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.product_id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.product_id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right mt-2 text-sm font-medium">
                          {brl(item.price * item.quantity)}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer do carrinho */}
              {cart.length > 0 && (
                <div className="border-t p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-bold text-lg">{brl(cartTotal)}</span>
                  </div>
                  
                  <Button
                    className="w-full h-12 rounded-xl font-bold"
                    style={{ backgroundColor: store.primary_color }}
                    onClick={() => setIsQuoteDialogOpen(true)}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Solicitar Orçamento
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500">
                    Você será redirecionado para o WhatsApp
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Solicitar Orçamento */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Solicitar Orçamento
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Seu nome</label>
              <Input
                placeholder="Digite seu nome"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">WhatsApp</label>
              <Input
                placeholder="(11) 99999-9999"
                value={customerWhatsApp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setCustomerWhatsApp(v);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite DDD + número (ex: 11999999999)
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Resumo do pedido:</p>
              <div className="text-sm text-gray-600 space-y-1">
                {cart.map(item => (
                  <div key={item.product_id} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{brl(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>{brl(cartTotal)}</span>
              </div>
            </div>
            
            <Button
              className="w-full h-12 rounded-xl font-bold"
              style={{ backgroundColor: store.primary_color }}
              onClick={requestQuote}
              disabled={!customerName || customerWhatsApp.length < 11}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Enviar pelo WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de Card de Produto
function ProductCard({ 
  product, 
  primaryColor, 
  onAdd,
  cartQuantity 
}: { 
  product: Product; 
  primaryColor: string;
  onAdd: () => void;
  cartQuantity: number;
}) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Imagem */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <PackageIcon className="h-12 w-12" />
          </div>
        )}
        
        {cartQuantity > 0 && (
          <Badge 
            className="absolute top-2 right-2"
            style={{ backgroundColor: primaryColor }}
          >
            {cartQuantity}x no carrinho
          </Badge>
        )}
      </div>
      
      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
        {product.sku && (
          <p className="text-xs text-gray-400 mb-2">{product.sku}</p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="font-bold" style={{ color: primaryColor }}>
            {brl(product.price)}
          </span>
          <span className="text-xs text-gray-400">/{product.unit || 'un'}</span>
        </div>
        
        <Button
          className="w-full mt-3 rounded-lg"
          style={{ backgroundColor: primaryColor }}
          onClick={onAdd}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>
    </Card>
  );
}

// Ícone de pacote para fallback
function PackageIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
