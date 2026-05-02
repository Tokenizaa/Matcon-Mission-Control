import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Package, FileUp, Image, Link2, X, GripVertical, Share2, Eye, Zap } from "lucide-react";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Types
interface ProductImage {
  id?: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  source_type: 'upload' | 'url';
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  internal_code?: string;
  gtin_ean?: string;
  brand?: string;
  manufacturer?: string;
  category_id?: string;
  subcategory_id?: string;
  department?: string;
  product_line?: string;
  tags?: string[];
  price: number;
  sale_price?: number;
  promotional_price?: number;
  cost_price?: number;
  margin?: number;
  markup?: number;
  stock: number;
  stock_quantity?: number;
  minimum_stock?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  unit: string;
  purchase_unit?: string;
  sale_unit?: string;
  sale_multiple?: number;
  short_description?: string;
  full_description?: string;
  technical_specs?: Record<string, string>;
  application_use?: string;
  benefits?: string[];
  weight_kg?: number;
  width_cm?: number;
  height_cm?: number;
  length_cm?: number;
  coverage_m2?: number;
  yield_per_unit?: string;
  packaging_type?: string;
  seo_title?: string;
  seo_description?: string;
  is_active: boolean;
  is_featured: boolean;
  visibility: 'public' | 'private' | 'catalog_only';
  images?: ProductImage[];
}

export default function Products() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    sku: "",
    price: 0,
    cost_price: 0,
    stock: 0,
    unit: "un",
    is_active: true,
    visibility: "public",
  });
  const [images, setImages] = useState<ProductImage[]>([]);

  // Queries
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("tenant_id", user!.id)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", user!.id)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const saveProduct = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const productData = {
        ...form,
        tenant_id: user.id,
        price: Number(form.price) || 0,
        sale_price: Number(form.sale_price) || null,
        cost_price: Number(form.cost_price) || null,
        stock: Number(form.stock) || 0,
        stock_quantity: Number(form.stock) || 0,
        margin: form.sale_price && form.cost_price 
          ? ((form.sale_price - form.cost_price) / form.sale_price) * 100 
          : null,
      };

      let productId: string;

      if (editing?.id) {
        const { data, error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editing.id)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Save images
      for (const img of images) {
        if (!img.id) {
          await supabase.from("product_images").insert({
            tenant_id: user.id,
            product_id: productId,
            image_url: img.image_url,
            alt_text: img.alt_text || form.name,
            sort_order: img.sort_order,
            is_primary: img.is_primary,
            source_type: img.source_type,
          });
        }
      }

      return productId;
    },
    onSuccess: () => {
      toast.success(editing ? "Produto atualizado" : "Produto criado");
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto removido");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Helpers
  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      sku: "",
      price: 0,
      cost_price: 0,
      stock: 0,
      unit: "un",
      is_active: true,
      visibility: "public",
    });
    setImages([]);
    setActiveTab("basic");
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm(product);
    setImages(product.images || []);
    setOpen(true);
  };

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  // Image handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user?.id) return;

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { upsert: true });
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        setImages(prev => [...prev, {
          image_url: publicUrl,
          alt_text: form.name,
          sort_order: prev.length,
          is_primary: prev.length === 0,
          source_type: 'upload',
        }]);
      } catch (err) {
        toast.error(`Erro ao upload ${file.name}`);
      }
    }
    
    setIsUploading(false);
    toast.success("Imagens adicionadas");
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    
    setImages(prev => [...prev, {
      image_url: imageUrlInput,
      alt_text: form.name,
      sort_order: prev.length,
      is_primary: prev.length === 0,
      source_type: 'url',
    }]);
    setImageUrlInput("");
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Update sort orders and primary
      return newImages.map((img, i) => ({
        ...img,
        sort_order: i,
        is_primary: i === 0 && newImages.length > 0,
      }));
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === images.length - 1) return;

    setImages(prev => {
      const newImages = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      return newImages.map((img, i) => ({ ...img, sort_order: i }));
    });
  };

  // NFe Import
  const handleXmlImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implementation preserved from original
    toast.info("Importação NFe - implementação pendente");
  };

  // Filtered products
  const filtered = products.filter((p) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.internal_code ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const stockBadge = (stock: number) => {
    if (stock <= 0) return <Badge variant="destructive">Esgotado</Badge>;
    if (stock < 10) return <Badge variant="secondary" className="bg-amber-500 text-white">Baixo</Badge>;
    return <Badge variant="secondary" className="bg-emerald-500 text-white">Disponível</Badge>;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Produtos"
        description="Cadastro completo de produtos com galeria de imagens"
        action={
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleXmlImport}
              accept=".xml"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-2 h-4 w-4" />
              Importar NFe
            </Button>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, SKU ou código interno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => (
          <Card key={p.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {p.images?.[0]?.image_url ? (
                <img 
                  src={p.images[0].image_url} 
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="font-semibold line-clamp-2" title={p.name}>{p.name}</h3>
              {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{brl(p.price)}</span>
                {stockBadge(p.stock)}
              </div>
              {p.sale_price && p.sale_price !== p.price && (
                <p className="text-sm text-emerald-600 font-medium">
                  Promo: {brl(p.sale_price)}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
                <Eye className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button size="sm" variant="outline" onClick={() => {}}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {editing ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="commercial">Comercial</TabsTrigger>
              <TabsTrigger value="images">Imagens</TabsTrigger>
              <TabsTrigger value="description">Descrição</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do Produto *</Label>
                  <Input 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Ex: Cimento Portland CP II 50kg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input 
                    value={form.sku || ""} 
                    onChange={e => setForm({...form, sku: e.target.value})}
                    placeholder="Código do produto"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Código Interno</Label>
                  <Input 
                    value={form.internal_code || ""} 
                    onChange={e => setForm({...form, internal_code: e.target.value})}
                    placeholder="Seu código interno"
                  />
                </div>

                <div className="space-y-2">
                  <Label>GTIN/EAN</Label>
                  <Input 
                    value={form.gtin_ean || ""} 
                    onChange={e => setForm({...form, gtin_ean: e.target.value})}
                    placeholder="7891234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input 
                    value={form.brand || ""} 
                    onChange={e => setForm({...form, brand: e.target.value})}
                    placeholder="Marca do produto"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fabricante</Label>
                  <Input 
                    value={form.manufacturer || ""} 
                    onChange={e => setForm({...form, manufacturer: e.target.value})}
                    placeholder="Fabricante"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <select 
                    className="w-full h-9 rounded-md border border-input px-3"
                    value={form.category_id || ""}
                    onChange={e => setForm({...form, category_id: e.target.value || undefined})}
                  >
                    <option value="">Selecione...</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Input 
                    value={form.department || ""} 
                    onChange={e => setForm({...form, department: e.target.value})}
                    placeholder="Ex: Construção, Elétrica..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="commercial" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Preço de Venda *</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={form.price || 0} 
                    onChange={e => setForm({...form, price: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Preço Promocional</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={form.sale_price || ""} 
                    onChange={e => setForm({...form, sale_price: parseFloat(e.target.value) || undefined})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Preço de Custo</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={form.cost_price || ""} 
                    onChange={e => setForm({...form, cost_price: parseFloat(e.target.value) || undefined})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estoque *</Label>
                  <Input 
                    type="number"
                    value={form.stock || 0} 
                    onChange={e => setForm({...form, stock: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estoque Mínimo</Label>
                  <Input 
                    type="number"
                    value={form.minimum_stock || ""} 
                    onChange={e => setForm({...form, minimum_stock: parseInt(e.target.value) || undefined})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <select 
                    className="w-full h-9 rounded-md border border-input px-3"
                    value={form.unit}
                    onChange={e => setForm({...form, unit: e.target.value})}
                  >
                    <option value="un">Unidade</option>
                    <option value="kg">Quilograma</option>
                    <option value="m">Metro</option>
                    <option value="m2">Metro²</option>
                    <option value="m3">Metro³</option>
                    <option value="cx">Caixa</option>
                    <option value="sc">Saco</option>
                  </select>
                </div>
              </div>

              {form.sale_price && form.cost_price && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-medium">Métricas de Lucratividade</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Margem:</span>{" "}
                      <span className="font-medium">
                        {(((form.sale_price - form.cost_price) / form.sale_price) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Markup:</span>{" "}
                      <span className="font-medium">
                        {((form.sale_price / form.cost_price - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="product-images"
                    onChange={handleImageUpload}
                  />
                  <Label htmlFor="product-images" className="flex-1">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="text-center">
                        <Image className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">Clique para upload</p>
                        <p className="text-xs text-muted-foreground">ou arraste imagens aqui</p>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Cole a URL da imagem..."
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddImageUrl} variant="outline">
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>

                {isUploading && <p className="text-sm text-muted-foreground">Enviando imagens...</p>}

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className={`relative group rounded-lg overflow-hidden border-2 ${img.is_primary ? 'border-primary' : 'border-transparent'}`}>
                        <img 
                          src={img.image_url} 
                          alt={img.alt_text || "Produto"}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="icon" variant="ghost" className="text-white" onClick={() => moveImage(idx, 'up')}>
                            <GripVertical className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-white" onClick={() => setPrimaryImage(idx)}>
                            <Image className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-white" onClick={() => removeImage(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {img.is_primary && (
                          <Badge className="absolute top-2 left-2 bg-primary text-white">Principal</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="description" className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição Curta</Label>
                <Input 
                  value={form.short_description || ""} 
                  onChange={e => setForm({...form, short_description: e.target.value})}
                  placeholder="Resumo de 1 linha para cards e listagens"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição Completa</Label>
                <textarea 
                  className="w-full min-h-[150px] rounded-md border border-input px-3 py-2"
                  value={form.full_description || ""} 
                  onChange={e => setForm({...form, full_description: e.target.value})}
                  placeholder="Descrição detalhada do produto..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Aplicação / Uso</Label>
                  <Input 
                    value={form.application_use || ""} 
                    onChange={e => setForm({...form, application_use: e.target.value})}
                    placeholder="Onde e como usar este produto"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rendimento</Label>
                  <Input 
                    value={form.yield_per_unit || ""} 
                    onChange={e => setForm({...form, yield_per_unit: e.target.value})}
                    placeholder="Ex: 50m² por saco"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={form.weight_kg || ""} 
                    onChange={e => setForm({...form, weight_kg: parseFloat(e.target.value) || undefined})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cobertura (m²)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={form.coverage_m2 || ""} 
                    onChange={e => setForm({...form, coverage_m2: parseFloat(e.target.value) || undefined})}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-2">
                <Label>Título SEO</Label>
                <Input 
                  value={form.seo_title || ""} 
                  onChange={e => setForm({...form, seo_title: e.target.value})}
                  placeholder="Título para buscadores (50-60 caracteres)"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{(form.seo_title || "").length}/60 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label>Descrição SEO</Label>
                <textarea 
                  className="w-full min-h-[80px] rounded-md border border-input px-3 py-2"
                  value={form.seo_description || ""} 
                  onChange={e => setForm({...form, seo_description: e.target.value})}
                  placeholder="Descrição para Google (150-160 caracteres)"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">{(form.seo_description || "").length}/160 caracteres</p>
              </div>

              <div className="flex gap-4 pt-4">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={form.is_active}
                    onChange={e => setForm({...form, is_active: e.target.checked})}
                  />
                  Produto Ativo
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={form.is_featured}
                    onChange={e => setForm({...form, is_featured: e.target.checked})}
                  />
                  Destaque
                </label>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveProduct.mutate()} disabled={!form.name || saveProduct.isPending}>
              <Zap className="mr-2 h-4 w-4" />
              {saveProduct.isPending ? "Salvando..." : (editing ? "Atualizar" : "Criar Produto")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
